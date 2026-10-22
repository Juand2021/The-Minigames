// Laura de cuerpo entero (proporciones "chibi") con ropa deportiva.
// La cabeza es la del retrato detallado de Maincra/Billar (pelo ondulado, mechones rubios, pecas, lunar, argolla dorada).
import { lauraPortrait } from '../craft/engine/textures.js';

export const HEAD_W = 38;
export const HEAD_H = 34; // alto de la cabeza recortada del retrato (hasta el cuello)

export const C = {
  skin: '#f3cfb2',
  skinSh: '#e0ae90',
  skinHi: '#fbe2cc',
  hair: '#2b1a13',
  hairMid: '#3f2719',
  hairHi: '#6a4630',
  blond: '#ecc47c',
  blondSh: '#c79a55',
  top: '#ff5fa2',
  topSh: '#d63e82',
  topHi: '#ff9cc6',
  trim: '#fff3f8',
  tight: '#3a2f66',
  tightSh: '#271f4b',
  tightHi: '#5646a0',
  stripe: '#ff5fa2',
  shoe: '#f7f7f7',
  shoeSh: '#cfcfda',
  sole: '#ff5fa2',
  band: '#ff9cc6',
  steel: '#c9cde0',
  steelSh: '#8d92ad',
  plates: ['#e5484d', '#3b82f6', '#ffd166', '#5ee6a8'],
};

export const px = (g, x, y, w, h, c) => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
};

// Línea gruesa hecha de cuadraditos (pixel-art)
export function line(g, x0, y0, x1, y1, t, color) {
  g.fillStyle = color;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    g.fillRect(Math.round(x - t / 2), Math.round(y - t / 2), t, t);
  }
}

// Miembro con una franja de sombra en el lado derecho
function limb(g, a, b, t, col, sh) {
  line(g, a[0] + 1, a[1], b[0] + 1, b[1], t, sh);
  line(g, a[0], a[1], b[0], b[1], t - 1, col);
}

// Dos huesos (cadera→rodilla→tobillo o hombro→codo→mano). `side` elige hacia dónde se dobla.
export function ik(a, b, l1, l2, side) {
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.01;
  let end = b;
  if (d > max) {
    end = [a[0] + (dx * max) / d, a[1] + (dy * max) / d];
    dx = end[0] - a[0];
    dy = end[1] - a[1];
    d = max;
  }
  const aa = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - aa * aa));
  const mx = a[0] + (dx * aa) / d;
  const my = a[1] + (dy * aa) / d;
  return { joint: [mx + (-dy / d) * h * side, my + (dx / d) * h * side], end };
}

/* ---------- cabeza (recorte del retrato, con su propio contorno) ---------- */
let headCache = null;
export function headSprite() {
  if (!headCache) {
    const p = lauraPortrait();
    const c = document.createElement('canvas');
    c.width = HEAD_W;
    c.height = HEAD_H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(p, 0, 0, HEAD_W, HEAD_H, 0, 0, HEAD_W, HEAD_H);
    headCache = c;
  }
  return headCache;
}

/* ---------- contorno oscuro de 1 px (rápido, con Uint32) ---------- */
export function outlineLayer(c, rgba = 0xff180e14) {
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = new Uint32Array(img.data.buffer);
  const w = c.width;
  const h = c.height;
  const add = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] >>> 24) continue;
      if (
        (x > 0 && d[i - 1] >>> 24) ||
        (x < w - 1 && d[i + 1] >>> 24) ||
        (y > 0 && d[i - w] >>> 24) ||
        (y < h - 1 && d[i + w] >>> 24)
      )
        add.push(i);
    }
  }
  for (const i of add) d[i] = rgba;
  g.putImageData(img, 0, 0);
}

/* ---------- piezas del cuerpo ---------- */
function shoe(g, [ax, ay]) {
  px(g, ax - 5, ay, 10, 4, C.shoe);
  px(g, ax - 5, ay + 3, 10, 1, C.shoeSh);
  px(g, ax - 5, ay + 4, 10, 1, C.sole);
  px(g, ax - 4, ay + 1, 2, 1, C.sole); // logo
  px(g, ax + 1, ay, 3, 1, C.shoeSh); // cordones
  px(g, ax - 1, ay + 1, 3, 1, C.shoeSh);
  px(g, ax - 3, ay - 1, 6, 1, C.trim); // media
}

function leg(g, hip, foot, side) {
  const { joint, end } = ik(hip, foot, 14.5, 14.5, side);
  limb(g, hip, joint, 8, C.tight, C.tightSh);
  limb(g, joint, end, 7, C.tight, C.tightSh);
  // franja lateral neón
  const out = side > 0 ? -1 : 1;
  line(g, hip[0] + out * 3, hip[1], joint[0] + out * 3, joint[1], 1, C.stripe);
  line(g, joint[0] + out * 3, joint[1], end[0] + out * 2, end[1], 1, C.stripe);
  px(g, joint[0] - 3, joint[1] - 1, 5, 2, C.tightHi); // brillo de la rodilla
  shoe(g, [end[0], end[1] + 1]);
}

function torso(g, nx, ny) {
  // cuello
  px(g, nx - 3, ny - 3, 6, 6, C.skinSh);
  // top deportivo coral con escote en V y borde blanco
  const top = ny + 2;
  for (let r = 0; r < 10; r++) {
    const half = r < 2 ? 10 : 9;
    px(g, nx - half, top + r, half * 2, 1, C.top);
    px(g, nx + half - 3, top + r, 3, 1, C.topSh);
  }
  px(g, nx - 9, top, 4, 2, C.topHi);
  // escote en V (piel)
  px(g, nx - 3, top, 6, 1, C.skin);
  px(g, nx - 2, top + 1, 4, 1, C.skin);
  px(g, nx - 1, top + 2, 2, 1, C.skin);
  // tirantes y borde inferior
  px(g, nx - 7, top, 1, 2, C.trim);
  px(g, nx + 6, top, 1, 2, C.trim);
  px(g, nx - 9, top + 9, 18, 1, C.trim);
  px(g, nx - 1, top + 5, 2, 2, C.trim); // logo
  // abdomen
  for (let r = 0; r < 4; r++) px(g, nx - 7, top + 10 + r, 14, 1, r === 3 ? C.skinSh : C.skin);
  px(g, nx, top + 12, 1, 1, C.skinSh); // ombligo
  // cintura alta de las mallas
  px(g, nx - 8, top + 14, 16, 2, C.tightHi);
  px(g, nx - 8, top + 16, 16, 4, C.tight);
  px(g, nx + 5, top + 16, 3, 4, C.tightSh);
  px(g, nx - 8, top + 14, 16, 1, C.stripe);
}

// Melena larga: continúa, sin cortes, las dos columnas de pelo del retrato (con su misma onda y los mechones rubios)
// y cae por delante de los hombros hasta terminar en puntas.
const HAIR_W = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 8, 8, 7, 6, 5, 4, 3, 2];
function hairFall(g, nx, ny) {
  for (let r = 0; r < HAIR_W.length; r++) {
    const y = HEAD_H + r; // fila equivalente en el sprite de la cabeza
    const wv = Math.round(Math.sin(y * 0.5) * 1.3);
    const wd = HAIR_W[r];
    const trim = Math.floor((10 - wd) / 2);
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? nx - 16 + wv + trim : nx + 6 - wv + trim;
      px(g, x0, ny + r, wd, 1, C.hair);
      // reflejos y sombras del pelo
      if ((r * 7 + (side < 0 ? 1 : 4)) % 5 === 0) px(g, x0 + 2 + ((r * 3) % 4), ny + r, 1, 2, C.hairHi);
      if ((r + (side < 0 ? 0 : 2)) % 4 === 1) px(g, x0 + wd - 3, ny + r, 2, 1, C.hairMid);
      // mechón rubio del lado de la cara, como en el retrato
      if (r < 15) {
        const w2 = Math.round(Math.sin(y * 0.55) * 1.2);
        const bx = side < 0 ? nx - 8 + w2 : nx + 7 - w2;
        px(g, bx, ny + r, 3, 1, (y + (side < 0 ? 0 : 2)) % 4 === 0 ? C.blondSh : C.blond);
      }
    }
  }
}

function arm(g, shoulder, hand, side, elbow) {
  const solved = elbow ? { joint: elbow, end: hand } : ik(shoulder, hand, 13, 13, side);
  const { joint, end } = solved;
  limb(g, shoulder, joint, 5, C.skin, C.skinSh);
  limb(g, joint, end, 5, C.skin, C.skinSh);
  // muñequera
  const k = 0.75;
  const wx = joint[0] + (end[0] - joint[0]) * k;
  const wy = joint[1] + (end[1] - joint[1]) * k;
  line(g, wx, wy, end[0], end[1], 5, C.band);
  // puño
  px(g, end[0] - 2, end[1] - 2, 4, 4, C.skin);
  px(g, end[0] - 2, end[1] + 1, 4, 1, C.skinSh);
  return { joint, end };
}

/**
 * o = {
 *   nx, ny,                      // base del cuello (centro)
 *   hips: [[x,y],[x,y]],         // caderas izq/der
 *   feet: [[x,y],[x,y]],         // tobillos
 *   legSide: [s, s],             // hacia dónde se doblan las rodillas
 *   hands: [[x,y],[x,y]],        // manos izq/der
 *   armSide: [s, s],             // hacia dónde se doblan los codos
 *   behind: (g) => {},           // equipo detrás (barra de sentadilla)
 *   front: (g) => {},            // equipo delante (barra de dominadas, mancuernas)
 * }
 */
export function drawBody(g, o) {
  o.behind?.(g);
  leg(g, o.hips[0], o.feet[0], o.legSide[0]);
  leg(g, o.hips[1], o.feet[1], o.legSide[1]);
  torso(g, o.nx, o.ny);
  hairFall(g, o.nx, o.ny);
}

export function drawFront(g, o) {
  const sy = o.ny + 4;
  arm(g, [o.nx - 9, sy], o.hands[0], o.armSide?.[0], o.elbows?.[0]);
  arm(g, [o.nx + 9, sy], o.hands[1], o.armSide?.[1], o.elbows?.[1]);
  o.front?.(g);
}

/* ---------- equipo ---------- */
export function barbell(g, cx, y, plates) {
  px(g, cx - 44, y - 1, 88, 2, C.steel);
  px(g, cx - 44, y + 1, 88, 1, C.steelSh);
  for (const s of [-1, 1]) {
    px(g, cx + s * 36 - (s > 0 ? 0 : 3), y - 2, 3, 4, C.steelSh); // manguito
    for (let k = 0; k < plates; k++) {
      const h = [22, 19, 16, 13][k];
      const x = s < 0 ? cx - 40 - k * 4 : cx + 38 + k * 4;
      px(g, x - (s < 0 ? 2 : 0), y - h / 2, 3, h, C.plates[k]);
      px(g, x - (s < 0 ? 2 : 0), y - h / 2, 1, h, 'rgba(255,255,255,0.45)');
    }
  }
}

export function dumbbell(g, x, y, level) {
  const sz = 5 + level * 2;
  const col = C.plates[Math.min(level, 3)];
  px(g, x - 5, y - 1, 10, 2, C.steel);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? x - 5 - 3 : x + 5;
    px(g, x0, y - sz / 2, 3, sz, col);
    px(g, x0, y - sz / 2, 1, sz, 'rgba(255,255,255,0.45)');
  }
}

export function pullBar(g, cx, y) {
  px(g, cx - 38, y - 1, 76, 3, C.steel);
  px(g, cx - 38, y + 2, 76, 1, C.steelSh);
  px(g, cx - 38, y - 1, 76, 1, '#ffffff');
}

/* ---------- cara de lesión: ojos en X, chichón y estrellitas dando vueltas ---------- */
export function drawHurt(g, hx, hy, now) {
  // ojos en X (sobre los ojos del retrato: x 12 y 22, y 16)
  for (const ex of [12, 22]) {
    px(g, hx + ex, hy + 16, 4, 4, '#ffffff');
    for (const [dx, dy] of [[0, 0], [3, 0], [1, 1], [2, 1], [1, 2], [2, 2], [0, 3], [3, 3]]) px(g, hx + ex + dx, hy + 16 + dy, 1, 1, '#b01030');
  }
  // chichón en la frente
  px(g, hx + 24, hy + 8, 4, 3, '#ff8a8a');
  px(g, hx + 25, hy + 8, 2, 1, '#ffd0d0');
  // boca de dolor
  px(g, hx + 17, hy + 25, 5, 1, '#7a1020');
  px(g, hx + 18, hy + 26, 3, 2, '#7a1020');
  // estrellas girando sobre la cabeza
  for (let k = 0; k < 3; k++) {
    const a = now / 220 + (k * Math.PI * 2) / 3;
    const sx = hx + 19 + Math.cos(a) * 15;
    const sy = hy - 2 + Math.sin(a) * 4;
    px(g, sx - 1, sy, 3, 1, '#ffd166');
    px(g, sx, sy - 1, 1, 3, '#ffd166');
  }
}
