// Mundo en rejilla: tiles en un Uint8Array. `fixed` marca bloques que la jugadora no puede quitar (modo construcción).
import { B, isSolid } from './blocks.js';

export class World {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.tiles = new Uint8Array(w * h);
    this.fixed = new Uint8Array(w * h);
    this.onChange = null; // (x, y) => void, para refrescar la caché de dibujo
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x, y) {
    if (!this.inside(x, y)) return y >= this.h ? B.BEDROCK : B.AIR;
    return this.tiles[y * this.w + x];
  }

  set(x, y, id) {
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    if (this.tiles[i] === id) return;
    this.tiles[i] = id;
    this.onChange?.(x, y);
  }

  isFixed(x, y) {
    return this.inside(x, y) && this.fixed[y * this.w + x] === 1;
  }

  solid(x, y) {
    // Los bordes laterales y el fondo son sólidos; el cielo abierto no.
    if (x < 0 || x >= this.w || y >= this.h) return true;
    if (y < 0) return false;
    return isSolid(this.tiles[y * this.w + x]);
  }

  // Primera fila sólida (sin contar hojas) desde arriba en la columna x
  surface(x) {
    for (let y = 0; y < this.h; y++) {
      const id = this.get(x, y);
      if (isSolid(id) && id !== B.LEAVES) return y;
    }
    return this.h;
  }
}

export function rng(seed) {
  let s = seed >>> 0 || 7;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

// Ruido 1D suave y determinista
function makeNoise(seed) {
  const r = rng(seed);
  const pts = Array.from({ length: 64 }, r);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = pts[((i % 64) + 64) % 64];
    const b = pts[(((i + 1) % 64) + 64) % 64];
    const t = f * f * (3 - 2 * f);
    return a + (b - a) * t;
  };
}

export function tree(world, x, groundY, r) {
  const h = 4 + Math.floor(r() * 2);
  for (let k = 1; k <= h; k++) world.set(x, groundY - k, B.TRUNK);
  const top = groundY - h;
  for (let dy = -2; dy <= 1; dy++) {
    const span = dy === -2 ? 1 : 2;
    for (let dx = -span; dx <= span; dx++) {
      if (dx === 0 && dy >= 0) continue;
      if (Math.abs(dx) === 2 && dy !== 0 && r() < 0.5) continue;
      if (world.get(x + dx, top + dy) === B.AIR) world.set(x + dx, top + dy, B.LEAVES);
    }
  }
}

// Mundo de supervivencia: colinas, capas, menas y árboles, con una zona plana en el centro para el cofre.
export function generateSurvival(seed = Date.now()) {
  const W = 64;
  const H = 36;
  const world = new World(W, H);
  const n1 = makeNoise(seed);
  const n2 = makeNoise(seed * 7 + 3);
  const r = rng(seed * 13 + 5);
  const cx = W / 2;
  const heights = [];
  for (let x = 0; x < W; x++) {
    const flat = Math.max(0, Math.min(1, (Math.abs(x - cx) - 4) / 6)); // 0 en el centro
    const hNoise = (n1(x / 9) - 0.5) * 7 + (n2(x / 4) - 0.5) * 2.5;
    heights.push(Math.round(20 + hNoise * flat));
  }
  // Escalones de máximo un bloque: así los mobs siempre pueden subir
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < W; x++) heights[x] = Math.max(heights[x - 1] - 1, Math.min(heights[x - 1] + 1, heights[x]));
    for (let x = W - 2; x >= 0; x--) heights[x] = Math.max(heights[x + 1] - 1, Math.min(heights[x + 1] + 1, heights[x]));
  }
  for (let x = 0; x < W; x++) {
    const top = heights[x];
    for (let y = top; y < H; y++) {
      let id = B.STONE;
      if (y === top) id = B.GRASS;
      else if (y < top + 3) id = B.DIRT;
      else if (y >= H - 1) id = B.BEDROCK;
      else {
        const v = r();
        if (v < 0.035) id = B.COAL;
        else if (v < 0.05 && y > top + 6) id = B.IRON;
      }
      world.set(x, y, id);
    }
  }
  // Árboles lejos del centro
  for (let x = 3; x < W - 3; x++) {
    if (Math.abs(x - cx) < 8) continue;
    if (r() < 0.12) {
      tree(world, x, heights[x], r);
      x += 4;
    }
  }
  world.heights = heights;
  world.center = cx;
  return world;
}
