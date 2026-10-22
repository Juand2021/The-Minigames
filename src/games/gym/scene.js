// Fondos pixel-art del gimnasio (se dibujan una sola vez por ejercicio).
import { px, C } from './laura.js';

export const LW = 144;
export const LH = 216;
export const FLOOR_Y = 186; // donde pisa Laura
export const CX = 72;

const FONT = {
  G: ['111', '100', '101', '101', '111'],
  Y: ['101', '101', '010', '010', '010'],
  M: ['101', '111', '111', '101', '101'],
};
function bigText(g, str, x, y, s, color) {
  g.fillStyle = color;
  let cx = x;
  for (const ch of str) {
    FONT[ch].forEach((row, ry) => [...row].forEach((v, rx) => v === '1' && g.fillRect(cx + rx * s, y + ry * s, s, s)));
    cx += 4 * s;
  }
}

function canvas() {
  const c = document.createElement('canvas');
  c.width = LW;
  c.height = LH;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}

function wall(g) {
  // pared con degradado morado y paneles verticales
  for (let y = 0; y < 140; y++) {
    const t = y / 140;
    g.fillStyle = `rgb(${Math.round(36 + 22 * t)},${Math.round(19 + 8 * t)},${Math.round(68 + 22 * t)})`;
    g.fillRect(0, y, LW, 1);
  }
  for (let x = 0; x < LW; x += 12) px(g, x, 0, 1, 140, 'rgba(255,255,255,0.05)');
  // luces del techo
  for (const x of [20, 72, 124]) {
    px(g, x - 10, 0, 20, 2, '#f4f0ff');
    px(g, x - 14, 2, 28, 3, 'rgba(255,240,255,0.18)');
    px(g, x - 20, 5, 40, 4, 'rgba(255,240,255,0.07)');
  }
  // letrero de neón "GYM"
  px(g, 36, 6, 72, 20, 'rgba(255,95,162,0.12)');
  bigText(g, 'GYM', 49, 8, 3, '#ff5fa2');
  bigText(g, 'GYM', 49, 8, 3, '#ff5fa2');
  px(g, 49, 8, 1, 1, '#ffd0e6'); // brillo
  // zócalo
  px(g, 0, 136, LW, 4, '#161027');
  px(g, 0, 136, LW, 1, '#ff5fa2');
}

function mirror(g) {
  const x = 12;
  const y = 30;
  const w = LW - 24;
  const h = 98;
  px(g, x - 2, y - 2, w + 4, h + 4, '#cbb8ee');
  px(g, x - 1, y - 1, w + 2, h + 2, '#8f7bc0');
  for (let r = 0; r < h; r++) {
    const t = r / h;
    g.fillStyle = `rgb(${Math.round(150 + 40 * (1 - t))},${Math.round(176 + 40 * (1 - t))},${Math.round(236 + 12 * (1 - t))})`;
    g.fillRect(x, y + r, w, 1);
  }
  // brillos diagonales
  for (const [ox, len] of [[26, 70], [40, 44], [92, 62]]) {
    for (let i = 0; i < len; i++) px(g, x + ox + Math.round(i * 0.6), y + 4 + i, 3, 1, 'rgba(255,255,255,0.28)');
  }
  // reflejo tenue de pesas
  for (let i = 0; i < 4; i++) px(g, x + 8 + i * 9, y + h - 12, 6, 4, 'rgba(60,40,110,0.22)');
}

function floor(g) {
  px(g, 0, 140, LW, LH - 140, '#1a1630');
  // baldosas de goma con perspectiva
  for (let y = 140; y < LH; y += 1) {
    const t = (y - 140) / (LH - 140);
    g.fillStyle = `rgba(255,255,255,${0.025 + 0.05 * t})`;
    g.fillRect(0, y, LW, 1);
  }
  for (const y of [152, 168, 190, 214]) px(g, 0, y, LW, 1, 'rgba(0,0,0,0.35)');
  for (let x = -40; x <= LW + 40; x += 24) {
    for (let y = 140; y < LH; y += 2) {
      const t = (y - 140) / (LH - 140);
      px(g, CX + (x - CX) * (0.7 + t * 0.9), y, 1, 1, 'rgba(0,0,0,0.3)');
    }
  }
  // reflejo del neón rosa en el piso
  px(g, 40, 142, 64, 2, 'rgba(255,95,162,0.15)');
}

function uprights(g) {
  for (const x of [16, 122]) {
    px(g, x, 30, 6, 156, '#2b2f45');
    px(g, x, 30, 2, 156, '#4a4f6e');
    px(g, x + 4, 30, 2, 156, '#1b1d2e');
    for (let y = 40; y < 180; y += 9) px(g, x + 2, y, 2, 2, '#0c0d16'); // agujeros
    px(g, x - 4, 184, 14, 3, '#1b1d2e'); // base
  }
  px(g, 16, 30, 112, 4, '#2b2f45'); // travesaño
  px(g, 16, 30, 112, 1, '#4a4f6e');
}

function plateTree(g, x, y) {
  px(g, x + 5, y - 16, 2, 40, '#555a78');
  for (let i = 0; i < 5; i++) {
    px(g, x, y + 22 - i * 5 - 5, 12, 4, C.plates[i % 4]);
    px(g, x, y + 22 - i * 5 - 5, 12, 1, 'rgba(255,255,255,0.4)');
  }
}

function dumbbellRack(g, x, y) {
  px(g, x, y, 30, 3, '#2b2f45');
  px(g, x, y + 20, 30, 3, '#2b2f45');
  px(g, x + 1, y, 2, 40, '#2b2f45');
  px(g, x + 27, y, 2, 40, '#2b2f45');
  for (let i = 0; i < 4; i++) {
    px(g, x + 4 + i * 6, y - 6, 4, 6, C.plates[i]);
    px(g, x + 4 + i * 6, y + 14, 4, 6, C.plates[(i + 1) % 4]);
  }
}

function kettlebell(g, x, y, col) {
  px(g, x + 2, y, 6, 2, '#222');
  px(g, x, y + 2, 10, 8, col);
  px(g, x + 1, y + 10, 8, 2, col);
  px(g, x + 2, y + 3, 2, 3, 'rgba(255,255,255,0.45)');
}

function bench(g) {
  px(g, 100, 156, 32, 5, '#3d2a63');
  px(g, 100, 156, 32, 1, '#7a5cc4');
  px(g, 104, 161, 3, 9, '#222');
  px(g, 125, 161, 3, 9, '#222');
}

export function makeScene(kind) {
  const [c, g] = canvas();
  wall(g);
  mirror(g);
  floor(g);
  if (kind === 'curl') {
    plateTree(g, 6, 112);
    dumbbellRack(g, 108, 104);
    bench(g);
    kettlebell(g, 14, 166, '#e5484d');
    kettlebell(g, 124, 190, '#3b82f6');
  } else {
    uprights(g);
    kettlebell(g, 28, 190, '#ffd166');
    kettlebell(g, 106, 192, '#5ee6a8');
  }
  return c;
}
