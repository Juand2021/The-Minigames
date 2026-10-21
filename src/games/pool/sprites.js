// Todo el pixel-art se dibuja por código (sin archivos de imagen).
import { R, W, H, RAIL, LW, LH, POCKETS } from './physics.js';
import { FRONT } from './rotation.js';

export const BALL_COLORS = {
  1: '#f5d33b',
  2: '#2d5fd6',
  3: '#e33b3b',
  4: '#8a45c9',
  5: '#f08a24',
  6: '#1f9d55',
  7: '#9a2f2f',
  8: '#1a1a22',
};
export const colorOf = (id) => BALL_COLORS[id > 8 ? id - 8 : id];

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}

const rect = (g, x, y, w, h, color) => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};

/* ---------- bolas (esferas con orientación 3D) ---------- */
const LIGHT = (() => {
  const l = [-0.45, -0.6, 0.66];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();
const HALF = (() => {
  const h = [LIGHT[0], LIGHT[1], LIGHT[2] + 1];
  const n = Math.hypot(...h);
  return h.map((v) => v / n);
})();
const INK = [10, 8, 20];

// Color de la textura en el punto p de la esfera unidad (espacio de la textura).
function texColor(id, p) {
  if (id === 0) {
    // blanca con puntitos para que se note cómo gira
    for (const [ax, ay, az] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      if (p[0] * ax + p[1] * ay + p[2] * az > 0.965) return [200, 70, 80];
    }
    return [248, 246, 238];
  }
  const base = hex(colorOf(id));
  if (Math.abs(p[0]) > 0.84) return id === 8 ? [250, 248, 240] : [255, 255, 255]; // círculo del número
  if (id > 8 && Math.abs(p[1]) > 0.5) return [250, 248, 240]; // rayada: blanco fuera de la franja
  return base;
}

export function createBallCanvas() {
  return canvas(R * 2, R * 2);
}

// Dibuja la bola `id` con orientación `rot` en el canvas [c, g] (sin suavizado: pixel-art).
export function paintBall([c, g], id, rot) {
  const D = R * 2;
  const img = g.createImageData(D, D);
  for (let y = 0; y < D; y++) {
    for (let x = 0; x < D; x++) {
      const dx = (x + 0.5 - R) / R;
      const dy = (y + 0.5 - R) / R;
      const r2 = dx * dx + dy * dy;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      // p = Rᵀ · n (vista → textura)
      const p = [
        rot[0] * dx + rot[3] * dy + rot[6] * nz,
        rot[1] * dx + rot[4] * dy + rot[7] * nz,
        rot[2] * dx + rot[5] * dy + rot[8] * nz,
      ];
      let col = texColor(id, p);
      const diff = Math.max(0, dx * LIGHT[0] + dy * LIGHT[1] + nz * LIGHT[2]);
      const shade = Math.round((0.5 + 0.5 * diff) * 5) / 5; // 5 niveles: sombreado "de pixel"
      col = mix([0, 0, 0], col, shade);
      col = mix(col, INK, Math.max(0, 0.55 - shade) * 0.5);
      if (dx * HALF[0] + dy * HALF[1] + nz * HALF[2] > 0.972) col = mix(col, [255, 255, 255], 0.8);
      if (r2 > (1 - 0.9 / R) ** 2) col = mix(col, INK, 0.65);
      img.data.set([...col, 255], (y * D + x) * 4);
    }
  }
  g.putImageData(img, 0, 0);
}

// Sprite estático (bandejas de bolas embocadas): el número mira al frente.
export function makeBallSprite(id) {
  const cg = createBallCanvas();
  paintBall(cg, id, FRONT);
  return cg[0];
}

export function makeBallShadow() {
  const D = R * 2;
  const [c, g] = canvas(D + 2, D + 2);
  const img = g.createImageData(D + 2, D + 2);
  for (let y = 0; y < D + 2; y++)
    for (let x = 0; x < D + 2; x++) {
      if (Math.hypot(x + 0.5 - (R + 1), y + 0.5 - (R + 1)) <= R) img.data.set([0, 25, 10, 85], (y * (D + 2) + x) * 4);
    }
  g.putImageData(img, 0, 0);
  return c;
}

export function makeBallSet() {
  const set = {};
  for (let i = 0; i <= 15; i++) set[i] = makeBallSprite(i);
  return set;
}

/* ---------- mesa ---------- */
function disc(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) g.fillRect(x, y, 1, 1);
}

export function makeTable() {
  const [c, g] = canvas(LW, LH);
  // madera
  rect(g, 0, 0, LW, LH, '#6a3d20');
  rect(g, 0, 0, LW, 1, '#8c5a34');
  rect(g, 0, 0, 1, LH, '#8c5a34');
  rect(g, 0, LH - 1, LW, 1, '#3f2312');
  rect(g, LW - 1, 0, 1, LH, '#3f2312');
  // vetas de madera deterministas
  for (let i = 0; i < 160; i++) {
    const x = (i * 37) % LW;
    const y = (i * 91) % LH;
    if (x < RAIL - 4 || x > LW - RAIL + 3 || y < RAIL - 4 || y > LH - RAIL + 3) rect(g, x, y, 3, 1, '#59321a');
  }
  // banda (cojín)
  rect(g, RAIL - 4, RAIL - 4, W + 8, H + 8, '#0c5a34');
  rect(g, RAIL - 4, RAIL - 4, W + 8, 1, '#17794a');
  rect(g, RAIL - 4, RAIL - 4, 1, H + 8, '#17794a');
  // paño
  rect(g, RAIL, RAIL, W, H, '#1c8a50');
  for (let i = 0; i < 520; i++) {
    const x = RAIL + ((i * 53) % W);
    const y = RAIL + ((i * 29 + (i >> 3) * 7) % H);
    rect(g, x, y, 1, 1, i % 3 ? '#1f9556' : '#197f49');
  }
  // línea de cabecera y punto de salida
  for (let x = RAIL + 4; x < RAIL + W - 4; x += 4) rect(g, x, RAIL + Math.round(H * 0.75) + 8, 2, 1, '#2ea866');
  rect(g, RAIL + W / 2 - 1, RAIL + Math.round(H * 0.27), 2, 2, '#2ea866');
  // diamantes en la madera
  const dia = '#e8d9a8';
  for (let k = 1; k <= 7; k++) {
    if (k === 4) continue;
    const y = RAIL + Math.round((H * k) / 8);
    rect(g, 5, y - 1, 2, 2, dia);
    rect(g, LW - 7, y - 1, 2, 2, dia);
  }
  for (let k = 1; k <= 3; k++) {
    const x = RAIL + Math.round((W * k) / 4);
    rect(g, x - 1, 5, 2, 2, dia);
    rect(g, x - 1, LH - 7, 2, 2, dia);
  }
  // troneras
  for (const p of POCKETS) {
    const cx = p.x + RAIL;
    const cy = p.y + RAIL;
    disc(g, cx, cy, p.r - 0.2, '#3a2112');
    disc(g, cx, cy, p.r - 1.6, '#08060d');
  }
  return c;
}

/* ---------- fuente 3x5 diminuta ---------- */
const FONT = {
  Q: ['111', '101', '101', '111', '001'],
  U: ['101', '101', '101', '101', '111'],
  I: ['111', '010', '010', '010', '111'],
  Z: ['111', '001', '010', '100', '111'],
  0: ['111', '101', '101', '101', '111'],
  '.': ['000', '000', '000', '000', '010'],
};
function text(g, str, x, y, color) {
  g.fillStyle = color;
  let cx = x;
  for (const ch of str) {
    FONT[ch].forEach((row, ry) => {
      [...row].forEach((v, rx) => v === '1' && g.fillRect(cx + rx, y + ry, 1, 1));
    });
    cx += 4;
  }
}

const line = (g, x0, y0, x1, y1, color) => {
  g.fillStyle = color;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
};

/* ---------- villano: el Quiz de Fenómenos de Transporte ---------- */
export function drawVillain(cv, mood = 'idle') {
  cv.width = 36;
  cv.height = 46;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, 36, 46);
  const K = '#1b1022';
  const paper = '#f3efe2';
  const shade = '#d6cfba';
  const red = '#d1342f';

  // taco que sostiene
  rect(g, 32, 0, 2, 2, '#4fa3ff');
  rect(g, 32, 2, 2, 2, '#f4f4f4');
  rect(g, 32, 4, 2, 26, '#d9a35f');
  rect(g, 32, 30, 2, 14, '#5a321b');
  rect(g, 33, 4, 1, 40, 'rgba(0,0,0,0.25)');

  // piernas y zapatillas
  rect(g, 12, 32, 2, 8, K);
  rect(g, 22, 32, 2, 8, K);
  [[9, 39], [20, 39]].forEach(([x, y]) => {
    rect(g, x, y, 8, 5, K);
    rect(g, x + 1, y + 1, 6, 3, '#f2f2f2');
    rect(g, x + 1, y + 2, 6, 1, red);
  });

  // hoja
  rect(g, 5, 1, 24, 32, K);
  rect(g, 6, 2, 22, 30, paper);
  rect(g, 6, 28, 22, 4, shade);
  // esquina doblada
  rect(g, 22, 1, 7, 7, 'rgba(0,0,0,0)');
  g.clearRect(23, 1, 6, 6);
  line(g, 23, 1, 28, 6, K);
  line(g, 23, 1, 23, 6, K);
  line(g, 23, 6, 28, 6, K);
  rect(g, 24, 2, 4, 4, shade);
  // encabezado rojo con "QUIZ"
  rect(g, 6, 8, 22, 7, red);
  text(g, 'QUIZ', 9, 9, '#fff6ef');
  // ojos malvados
  rect(g, 9, 18, 6, 6, '#fff');
  rect(g, 19, 18, 6, 6, '#fff');
  const look = mood === 'angry' ? 0 : 1;
  rect(g, 11 + look, 20, 3, 3, red);
  rect(g, 20 - look + 1, 20, 3, 3, red);
  rect(g, 12 + look, 21, 1, 1, K);
  rect(g, 22 - look, 21, 1, 1, K);
  // cejas furiosas
  line(g, 8, 16, 14, 19, K);
  line(g, 8, 17, 14, 20, K);
  line(g, 26, 16, 20, 19, K);
  line(g, 26, 17, 20, 20, K);
  // sonrisa con dientes
  rect(g, 10, 26, 14, 5, K);
  for (let x = 11; x < 23; x += 2) rect(g, x, 26, 1, 2, '#fff');
  for (let x = 12; x < 22; x += 2) rect(g, x, 29, 1, 1, '#fff');
  rect(g, 15, 29, 3, 1, red);
  // nota "0.0"
  text(g, '0.0', 9, 31 - 0, red);
  rect(g, 8, 28, 0, 0, K);

  // brazo izquierdo y guante
  line(g, 5, 20, 2, 26, K);
  line(g, 4, 20, 1, 26, K);
  rect(g, 0, 26, 6, 6, K);
  rect(g, 1, 27, 4, 4, '#fff');
  rect(g, 2, 27, 1, 2, '#d6d0c4');
  // brazo derecho, guante en el taco
  line(g, 29, 18, 31, 14, K);
  line(g, 29, 19, 31, 15, K);
  rect(g, 29, 11, 6, 6, K);
  rect(g, 30, 12, 4, 4, '#fff');
  rect(g, 31, 12, 1, 2, '#d6d0c4');
}

/* ---------- jugadora (Sofía) ---------- */
export function drawPlayer(cv) {
  cv.width = 26;
  cv.height = 42;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, 26, 42);
  const K = '#1b1022';
  const hair = '#3d2418';
  // taco
  rect(g, 22, 2, 2, 2, '#4fa3ff');
  rect(g, 22, 4, 2, 2, '#f4f4f4');
  rect(g, 22, 6, 2, 22, '#d9a35f');
  rect(g, 22, 28, 2, 12, '#5a321b');
  // piernas
  rect(g, 8, 29, 4, 8, '#2d3a6b');
  rect(g, 13, 29, 4, 8, '#2d3a6b');
  rect(g, 7, 37, 6, 4, K);
  rect(g, 8, 38, 4, 2, '#f2f2f2');
  rect(g, 13, 37, 6, 4, K);
  rect(g, 14, 38, 4, 2, '#f2f2f2');
  // sudadera morada
  rect(g, 5, 15, 16, 15, K);
  rect(g, 6, 16, 14, 13, '#8a55e0');
  rect(g, 6, 26, 14, 3, '#7442c4');
  rect(g, 11, 20, 4, 4, '#a678ee');
  // brazo con taco
  rect(g, 19, 17, 5, 8, K);
  rect(g, 20, 18, 3, 6, '#8a55e0');
  rect(g, 21, 22, 3, 3, '#f1c9a5');
  // cabeza y pelo largo
  rect(g, 5, 2, 16, 16, K);
  rect(g, 6, 3, 14, 15, hair);
  rect(g, 8, 6, 10, 9, '#f1c9a5');
  rect(g, 8, 6, 10, 2, hair);
  rect(g, 10, 10, 2, 2, K);
  rect(g, 15, 10, 2, 2, K);
  rect(g, 11, 13, 4, 1, '#c4524f');
  rect(g, 8, 12, 2, 1, '#f09aa0');
  rect(g, 16, 12, 2, 1, '#f09aa0');
  // pelo cayendo a los lados
  rect(g, 6, 15, 3, 8, hair);
  rect(g, 18, 15, 2, 6, hair);
}

/* ---------- mini bola para las bandejas (DOM) ---------- */
export function ballDataUrl(id, balls) {
  return balls[id].toDataURL();
}
