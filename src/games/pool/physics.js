// Física del billar (sin dependencias). Coordenadas en píxeles lógicos del juego.
// Zona de juego: [0,W] x [0,H]; los centros de las bolas se mueven en [R,W-R] x [R,H-R].

export const R = 5; // radio de bola
export const W = 128;
export const H = 256;
export const RAIL = 12; // grosor visual de la banda
export const LW = W + RAIL * 2;
export const LH = H + RAIL * 2;

export const POCKETS = [
  { x: -1, y: -1, r: 10.5, skip: 10.5 },
  { x: W + 1, y: -1, r: 10.5, skip: 10.5 },
  { x: -1, y: H / 2, r: 9.5, skip: 9.5 },
  { x: W + 1, y: H / 2, r: 9.5, skip: 9.5 },
  { x: -1, y: H + 1, r: 10.5, skip: 10.5 },
  { x: W + 1, y: H + 1, r: 10.5, skip: 10.5 },
];

export const VMAX = 640; // velocidad máxima de la blanca (px/s)
const FRICTION_CONST = 62; // desaceleración constante (px/s²)
const FRICTION_LIN = 0.3; // resistencia proporcional a la velocidad (1/s)
const STOP_SPEED = 3.5;
const REST_BALL = 0.96;
const REST_CUSHION = 0.74;
const CUSHION_TANGENT = 0.985;

export const SUBSTEP = 1 / 240;

export function makeBall(id, x, y) {
  return { id, x, y, vx: 0, vy: 0, pocketed: false, sink: null };
}

// Triángulo de 15 bolas con la 8 en el centro y una lisa y una rayada en las esquinas traseras.
export function rack() {
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const solids = shuffle([1, 2, 3, 4, 5, 6, 7]);
  const stripes = shuffle([9, 10, 11, 12, 13, 14, 15]);
  // Esquinas de la última fila: una lisa y una rayada.
  const corners = shuffle([solids.pop(), stripes.pop()]);
  const ids = shuffle([...solids, ...stripes]);
  const order = [];
  const apex = ids.pop();
  order.push(apex); // fila 0
  order.push(ids.pop(), ids.pop()); // fila 1
  order.push(ids.pop(), 8, ids.pop()); // fila 2
  order.push(ids.pop(), ids.pop(), ids.pop(), ids.pop()); // fila 3
  order.push(corners[0], ids.pop(), ids.pop(), ids.pop(), corners[1]); // fila 4
  const balls = [];
  const gap = 2 * R + 0.15;
  const dy = gap * 0.866;
  const ax = W / 2;
  const ay = H * 0.27;
  let k = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      balls.push(makeBall(order[k++], ax + (col - row / 2) * gap, ay - row * dy));
    }
  }
  balls.push(makeBall(0, W / 2, H * 0.75));
  return balls.sort((a, b) => a.id - b.id);
}

const nearPocket = (x, y) =>
  POCKETS.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 < p.skip * p.skip);

// Avanza la simulación `dt` segundos. `ev` acumula eventos del tiro.
export function step(balls, dt, ev) {
  const live = balls.filter((b) => !b.pocketed);
  for (const b of live) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const s = Math.hypot(b.vx, b.vy);
    if (s > 0) {
      const ns = s - (FRICTION_CONST + FRICTION_LIN * s) * dt;
      if (ns < STOP_SPEED) {
        b.vx = 0;
        b.vy = 0;
      } else {
        b.vx *= ns / s;
        b.vy *= ns / s;
      }
    }
  }

  // Bola contra bola (dos pasadas para choques en cadena en el triángulo)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i];
        const b = live[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const overlap = 2 * R - d;
        a.x -= (nx * overlap) / 2;
        a.y -= (ny * overlap) / 2;
        b.x += (nx * overlap) / 2;
        b.y += (ny * overlap) / 2;
        const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vn > 0) {
          const imp = ((1 + REST_BALL) / 2) * vn;
          a.vx -= imp * nx;
          a.vy -= imp * ny;
          b.vx += imp * nx;
          b.vy += imp * ny;
          ev.onHit?.(vn, a, b);
          if (ev.firstContact === null && (a.id === 0 || b.id === 0)) {
            ev.firstContact = a.id === 0 ? b.id : a.id;
          }
        }
      }
    }
  }

  // Bandas y troneras
  for (const b of live) {
    let hit = 0;
    if (!nearPocket(b.x, b.y)) {
      if (b.x < R) {
        b.x = R + (R - b.x);
        if (b.vx < 0) {
          hit = -b.vx;
          b.vx = -b.vx * REST_CUSHION;
          b.vy *= CUSHION_TANGENT;
        }
      } else if (b.x > W - R) {
        b.x = W - R - (b.x - (W - R));
        if (b.vx > 0) {
          hit = b.vx;
          b.vx = -b.vx * REST_CUSHION;
          b.vy *= CUSHION_TANGENT;
        }
      }
      if (b.y < R) {
        b.y = R + (R - b.y);
        if (b.vy < 0) {
          hit = Math.max(hit, -b.vy);
          b.vy = -b.vy * REST_CUSHION;
          b.vx *= CUSHION_TANGENT;
        }
      } else if (b.y > H - R) {
        b.y = H - R - (b.y - (H - R));
        if (b.vy > 0) {
          hit = Math.max(hit, b.vy);
          b.vy = -b.vy * REST_CUSHION;
          b.vx *= CUSHION_TANGENT;
        }
      }
      if (hit > 0) {
        if (ev.firstContact !== null) ev.railAfterContact = true;
        ev.onCushion?.(hit, b);
      }
    }
    for (const p of POCKETS) {
      if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < p.r * p.r) {
        b.pocketed = true;
        b.sink = { x: b.x, y: b.y, px: p.x, py: p.y, t: 0 };
        b.vx = 0;
        b.vy = 0;
        ev.pocketed.push(b.id);
        ev.onPocket?.(b, p);
        break;
      }
    }
  }
}

export const isMoving = (balls) => balls.some((b) => !b.pocketed && (b.vx !== 0 || b.vy !== 0));

export function newReport() {
  return { firstContact: null, pocketed: [], railAfterContact: false };
}

// Lanza un rayo desde `from` con ángulo `ang`. Devuelve el primer impacto.
// ignoreId: bola que no cuenta (la propia blanca).
export function castRay(balls, from, ang, ignoreId = 0) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  let best = { type: 'none', t: 1e9 };

  for (const b of balls) {
    if (b.pocketed || b.id === ignoreId) continue;
    const ox = b.x - from.x;
    const oy = b.y - from.y;
    const proj = ox * dx + oy * dy;
    if (proj <= 0) continue;
    const perp2 = ox * ox + oy * oy - proj * proj;
    const rr = 4 * R * R;
    if (perp2 >= rr) continue;
    const t = proj - Math.sqrt(rr - perp2);
    if (t >= 0 && t < best.t) {
      const gx = from.x + dx * t;
      const gy = from.y + dy * t;
      const nx = (b.x - gx) / (2 * R);
      const ny = (b.y - gy) / (2 * R);
      best = { type: 'ball', t, id: b.id, ghost: { x: gx, y: gy }, n: { x: nx, y: ny } };
    }
  }

  const walls = [];
  if (dx < 0) walls.push([(R - from.x) / dx, 'x']);
  if (dx > 0) walls.push([(W - R - from.x) / dx, 'x']);
  if (dy < 0) walls.push([(R - from.y) / dy, 'y']);
  if (dy > 0) walls.push([(H - R - from.y) / dy, 'y']);
  for (const [t, axis] of walls) {
    if (t > 0 && t < best.t) {
      best = {
        type: 'wall',
        t,
        ghost: { x: from.x + dx * t, y: from.y + dy * t },
        dir: axis === 'x' ? { x: -dx, y: dy } : { x: dx, y: -dy },
      };
    }
  }
  return best;
}

export function canPlaceCue(balls, x, y) {
  if (x < R || x > W - R || y < R || y > H - R) return false;
  if (nearPocket(x, y)) return false;
  return balls.every((b) => b.id === 0 || b.pocketed || (b.x - x) ** 2 + (b.y - y) ** 2 >= (2 * R + 0.5) ** 2);
}
