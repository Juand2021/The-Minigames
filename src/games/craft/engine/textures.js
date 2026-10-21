// Pixel-art de Maincra, generado por código (texturas propias de 16x16, sin recursos externos).
import { B } from './blocks.js';
import { rng } from './world.js';

export const T = 16;

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const jit = (c, r, amt) => c.map((v) => Math.max(0, Math.min(255, Math.round(v + (r() - 0.5) * amt))));
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// Pinta una textura 16x16 con fn(x, y, r) -> [r, g, b, a?] | null
function tex(seed, fn) {
  const [c, g] = makeCanvas(T, T);
  const img = g.createImageData(T, T);
  const r = rng(seed);
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const col = fn(x, y, r);
      if (!col) continue;
      img.data.set([col[0], col[1], col[2], col[3] ?? 255], (y * T + x) * 4);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

const DIRT = hex('#866043');
const dirtPx = (r) => {
  const v = r();
  if (v < 0.14) return hex('#6b4a2f');
  if (v < 0.24) return hex('#9b7653');
  if (v < 0.27) return hex('#7a7a7a');
  return jit(DIRT, r, 14);
};
const STONE = hex('#7f7f7f');
const stonePx = (r) => {
  const v = r();
  if (v < 0.1) return hex('#6a6a6a');
  if (v < 0.17) return hex('#959595');
  return jit(STONE, r, 12);
};

// Voronoi para la roca (cobblestone)
function cobble(seed, tones, mortar) {
  const r = rng(seed);
  const pts = Array.from({ length: 8 }, () => [r() * 16, r() * 16, tones[Math.floor(r() * tones.length)]]);
  return tex(seed + 1, (x, y, rr) => {
    let d1 = 1e9;
    let d2 = 1e9;
    let col = null;
    for (const [px, py, c] of pts) {
      for (const ox of [-16, 0, 16])
        for (const oy of [-16, 0, 16]) {
          const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
          if (d < d1) {
            d2 = d1;
            d1 = d;
            col = c;
          } else if (d < d2) d2 = d;
        }
    }
    if (d2 - d1 < 1.1) return mortar;
    return jit(col, rr, 10);
  });
}

function bricks(seed, base, alt, mortar, bw, bh) {
  return tex(seed, (x, y, r) => {
    const row = Math.floor(y / bh);
    const off = row % 2 ? bw / 2 : 0;
    if (y % bh === bh - 1 || (x + off) % bw === 0) return mortar;
    const brick = Math.floor((x + off) / bw) + row * 7;
    const c = brick % 3 === 0 ? alt : base;
    return jit(c, r, 16);
  });
}

function ore(seed, spot) {
  const r = rng(seed);
  const spots = new Set();
  for (let k = 0; k < 4; k++) {
    const cx = 2 + Math.floor(r() * 12);
    const cy = 2 + Math.floor(r() * 12);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0]]) if (r() < 0.8) spots.add(`${cx + dx},${cy + dy}`);
  }
  return tex(seed + 9, (x, y, rr) => (spots.has(`${x},${y}`) ? jit(hex(spot), rr, 30) : stonePx(rr)));
}

export function makeBlockTextures() {
  const t = {};
  t[B.GRASS] = tex(11, (x, y, r) => {
    const edge = 3 + (((x * 7) % 5) < 2 ? 1 : 0);
    if (y < edge) return jit(y === 0 ? hex('#6fb043') : hex('#5d9b3a'), r, 18);
    return dirtPx(r);
  });
  t[B.DIRT] = tex(12, (x, y, r) => dirtPx(r));
  t[B.STONE] = tex(13, (x, y, r) => stonePx(r));
  t[B.COBBLE] = cobble(14, [hex('#8b8b8b'), hex('#7a7a7a'), hex('#9c9c9c'), hex('#6e6e6e')], hex('#4b4b4b'));
  const bark = (k) => (x, y, r) => {
    if (x % 4 === 0 || (x % 4 === 2 && r() < 0.3)) return shade(hex('#4e3a22'), k);
    return shade(jit(hex('#6b5131'), r, 18), k);
  };
  t[B.LOG] = tex(15, bark(1));
  t[B.TRUNK] = tex(16, bark(0.72));
  t[B.PLANKS] = tex(17, (x, y, r) => {
    const board = Math.floor(y / 4);
    if (y % 4 === 3) return hex('#6f5533');
    if (x === (board % 2 ? 4 : 12)) return hex('#7a5f37');
    return jit(r() < 0.12 ? hex('#977846') : hex('#a8864f'), r, 10);
  });
  t[B.LEAVES] = tex(18, (x, y, r) => {
    const v = r();
    if (v < 0.1) return hex('#1f4214');
    if (v < 0.32) return hex('#2f6420');
    if (v < 0.42) return hex('#4f9a35');
    return jit(hex('#3d7a29'), r, 14);
  });
  t[B.GLASS] = tex(19, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15) return [224, 240, 246, 235];
    if ((x === y + 3 || x === y + 4) && x < 10) return [255, 255, 255, 170];
    if (x === y - 6 && y > 9) return [255, 255, 255, 140];
    return [190, 225, 240, 45];
  });
  t[B.BRICK] = bricks(20, hex('#9a4a38'), hex('#ab5a42'), hex('#a8a59c'), 8, 4);
  t[B.STONEBRICK] = bricks(21, hex('#7b7b7b'), hex('#727272'), hex('#525252'), 16, 8);
  t[B.SAND] = tex(22, (x, y, r) => {
    const v = r();
    if (v < 0.15) return hex('#cdc38c');
    if (v < 0.25) return hex('#e8e1b5');
    return jit(hex('#dbd3a0'), r, 8);
  });
  t[B.WATER] = tex(23, (x, y) => {
    const wave = (y % 6 === 0 && (x + y) % 8 < 5) || (y % 6 === 3 && (x + y + 4) % 8 < 3);
    return wave ? [92, 136, 240, 200] : [47, 95, 216, 185];
  });
  t[B.BEDROCK] = tex(24, (x, y, r) => {
    const v = r();
    return v < 0.3 ? hex('#262626') : v < 0.6 ? hex('#4a4a4a') : hex('#5f5f5f');
  });
  t[B.COAL] = ore(25, '#1d1d1d');
  t[B.IRON] = ore(26, '#d8ae8e');
  t[B.TORCH] = tex(27, (x, y) => {
    if ((x === 7 || x === 8) && y >= 6) return x === 7 ? hex('#8a6a3e') : hex('#5c4428');
    if ((x === 7 || x === 8) && (y === 4 || y === 5)) return y === 4 ? hex('#ffe066') : hex('#ff9a2a');
    if ((x === 7 || x === 8) && y === 3) return hex('#fff6b0');
    return null;
  });
  const doorPx = (top) => (x, y, r) => {
    if (x < 2 || x > 13) return null;
    if (x === 2 || x === 13 || (top && y === 0) || (!top && y === 15)) return hex('#5e4426');
    if (top && y >= 3 && y <= 7 && ((x >= 4 && x <= 6) || (x >= 9 && x <= 11))) return [150, 190, 210, 200];
    if (!top && x === 11 && (y === 6 || y === 7)) return hex('#2b2b2b');
    if (x === 7 || x === 8) return hex('#7d6038');
    return jit(hex('#a8864f'), r, 10);
  };
  t[B.DOOR] = tex(28, doorPx(false));
  t.doorTop = tex(29, doorPx(true));
  t[B.FENCE] = tex(30, (x, y, r) => {
    if (x >= 6 && x <= 9) return x === 6 ? hex('#7d6038') : x === 9 ? hex('#5e4426') : jit(hex('#a8864f'), r, 8);
    if (y === 4 || y === 5 || y === 10 || y === 11) return y % 2 ? hex('#7d6038') : jit(hex('#a8864f'), r, 8);
    return null;
  });
  t[B.CHEST] = tex(31, (x, y) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return hex('#2c1d0e');
    if (y === 6) return hex('#3d2a14');
    if (x >= 7 && x <= 8 && y >= 4 && y <= 8) return x === 7 ? hex('#e0e0e0') : hex('#9a9a9a');
    if (x === 1 || y === 1) return hex('#c48a45');
    if (y > 6) return (x + y) % 5 === 0 ? hex('#7d4f22') : hex('#9c6630');
    return (x * 3 + y) % 7 === 0 ? hex('#8a5a28') : hex('#a86f34');
  });
  return t;
}

// Grietas al picar (10 etapas)
export function makeCracks() {
  const r = rng(77);
  const pts = [];
  let x = 8;
  let y = 8;
  for (let i = 0; i < 70; i++) {
    pts.push([x, y]);
    x = Math.max(0, Math.min(15, x + Math.round((r() - 0.5) * 3)));
    y = Math.max(0, Math.min(15, y + Math.round((r() - 0.5) * 3)));
    if (i % 14 === 13) {
      x = 8;
      y = 8;
    }
  }
  return Array.from({ length: 10 }, (_, s) => {
    const [c, g] = makeCanvas(T, T);
    g.fillStyle = 'rgba(0,0,0,0.75)';
    const n = Math.floor(((s + 1) / 10) * pts.length);
    for (let i = 0; i < n; i++) g.fillRect(pts[i][0], pts[i][1], 1, 1);
    return c;
  });
}

/* ---------------- personajes ---------------- */
const px = (g, x, y, w, h, c) => {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
};

// Humanoide de 20x30 mirando a la derecha. pose: { frame: 0|1|2, swing: 0..1, tool }
function humanoid(g, c, pose) {
  const o = 5; // desplazamiento para dejar sitio a la herramienta
  const legA = pose.frame === 1 ? 1 : 0;
  const legB = pose.frame === 2 ? 1 : 0;
  // piernas
  px(g, o + 1, 20, 3, 10 - legA, c.pants);
  px(g, o + 5, 20, 3, 10 - legB, shadeHex(c.pants, 0.82));
  px(g, o + 1, 28 - legA, 3, 2, c.shoes);
  px(g, o + 5, 28 - legB, 3, 2, c.shoes);
  // torso
  px(g, o + 1, 8, 7, 12, c.shirt);
  px(g, o + 1, 17, 7, 3, shadeHex(c.shirt, 0.85));
  if (c.detail) px(g, o + 3, 12, 3, 3, c.detail);
  // cabeza
  px(g, o, 0, 9, 8, c.skin);
  if (c.hair) {
    px(g, o, 0, 9, 2, c.hair);
    px(g, o, 0, 3, 8, c.hair);
    if (c.longHair) px(g, o - 1, 2, 3, 13, c.hair);
  }
  if (c.face) c.face(g, o);
  else {
    px(g, o + 6, 3, 2, 1, '#ffffff');
    px(g, o + 7, 3, 1, 1, c.eye || '#2b1b10');
    px(g, o + 6, 6, 2, 1, shadeHex(c.skin, 0.75));
  }
  // brazo (con golpe)
  if (c.zombieArms) {
    px(g, o + 4, 9, 11, 3, c.skin);
    px(g, o + 4, 9, 4, 3, c.shirt);
  } else if (pose.swing > 0) {
    const reach = Math.round(4 + pose.swing * 5);
    px(g, o + 4, 9, reach, 3, c.shirt);
    px(g, o + 4 + reach, 9, 2, 3, c.skin);
    drawTool(g, o + 5 + reach, 10, pose.tool, pose.swing);
  } else {
    px(g, o + 3, 9, 3, 9, c.shirt);
    px(g, o + 3, 17, 3, 2, c.skin);
  }
}

function drawTool(g, x, y, tool, s) {
  if (tool === 'pick') {
    px(g, x - 1, y - 6, 1, 8, '#6b5131');
    px(g, x - 4, y - 7, 7, 2, '#9a9a9a');
    px(g, x - 4, y - 6, 1, 2, '#9a9a9a');
    px(g, x + 2, y - 6, 1, 2, '#9a9a9a');
    return;
  }
  const blade = tool === 'iron' ? '#e8e8e8' : '#bdbdbd';
  // espada inclinada hacia delante
  const len = 7;
  for (let i = 0; i < len; i++) px(g, x + i, y - 1 - Math.round(i * (1 - s * 0.6)), 2, 1, blade);
  px(g, x - 1, y - 1, 1, 3, '#6b5131');
  px(g, x, y, 1, 1, '#3a2a18');
}

function shadeHex(c, k) {
  const [r, gg, b] = hex(c);
  return `rgb(${Math.round(r * k)},${Math.round(gg * k)},${Math.round(b * k)})`;
}

const SOFIA = {
  skin: '#f1c9a5',
  hair: '#3d2418',
  longHair: true,
  shirt: '#8a55e0',
  detail: '#a678ee',
  pants: '#2d3a6b',
  shoes: '#f2f2f2',
};
const ZOMBIE = {
  skin: '#5c9a3e',
  hair: '#3f6e29',
  shirt: '#2f9d9d',
  pants: '#3f3fa8',
  shoes: '#2a2a5e',
  zombieArms: true,
  face: (g, o) => {
    px(g, o + 5, 3, 2, 2, '#1a2a12');
    px(g, o + 2, 3, 2, 2, '#1a2a12');
    px(g, o + 4, 6, 4, 1, '#2f4f20');
  },
};

function sprite(w, h, draw) {
  const [c, g] = makeCanvas(w, h);
  draw(g);
  return c;
}

export function makeCharacterSprites() {
  const s = {};
  for (const frame of [0, 1, 2]) {
    s[`sofia${frame}`] = sprite(22, 30, (g) => humanoid(g, SOFIA, { frame, swing: 0 }));
    s[`zombie${frame}`] = sprite(22, 30, (g) => humanoid(g, ZOMBIE, { frame, swing: 0 }));
  }
  for (const tool of ['sword', 'iron', 'pick']) {
    s[`sofiaSwing_${tool}`] = sprite(22, 30, (g) => humanoid(g, SOFIA, { frame: 0, swing: 1, tool }));
  }

  // Esqueleto: huesos finos y arco
  for (const frame of [0, 1, 2]) {
    s[`skeleton${frame}`] = sprite(22, 30, (g) => {
      const o = 5;
      const bone = '#cfcfcf';
      const dark = '#7a7a7a';
      px(g, o, 0, 9, 8, bone);
      px(g, o + 2, 3, 2, 2, '#222');
      px(g, o + 5, 3, 2, 2, '#222');
      px(g, o + 2, 6, 5, 1, dark);
      px(g, o + 3, 8, 2, 12, bone); // columna
      for (let y = 10; y < 18; y += 2) px(g, o + 1, y, 7, 1, bone); // costillas
      px(g, o + 1, 20, 2, 10 - (frame === 1 ? 1 : 0), bone);
      px(g, o + 5, 20, 2, 10 - (frame === 2 ? 1 : 0), dark);
      px(g, o + 4, 10, 7, 1, bone); // brazo con arco
      for (let y = 4; y <= 17; y++) {
        const dx = Math.round(Math.sin(((y - 4) / 13) * Math.PI) * 3);
        px(g, o + 11 + dx, y, 1, 1, '#6b4a2a');
      }
      px(g, o + 11, 4, 1, 14, 'rgba(230,230,230,0.7)'); // cuerda
    });
  }

  // Creeper: sin brazos, cuatro patitas
  const creeperPx = (g, frame, flash) => {
    const r = rng(5);
    const greens = ['#5cbf4c', '#4aa53b', '#77d867', '#2f7a24'];
    const pal = () => (flash ? '#ffffff' : greens[Math.floor(r() * greens.length)]);
    const o = 6;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) px(g, o + x, y, 1, 1, pal());
    for (let y = 8; y < 22; y++) for (let x = 1; x < 8; x++) px(g, o + x, y, 1, 1, pal());
    const lift = frame === 1 ? 1 : 0;
    for (let y = 22; y < 28; y++) {
      for (let x = 0; x < 4; x++) px(g, o + x, y - (x < 2 ? lift : 0), 1, 1, pal());
      for (let x = 5; x < 9; x++) px(g, o + x, y - (x > 6 ? (frame === 2 ? 1 : 0) : 0), 1, 1, pal());
    }
    if (!flash) {
      const K = '#0d0d0d';
      px(g, o + 1, 2, 2, 2, K);
      px(g, o + 6, 2, 2, 2, K);
      px(g, o + 3, 4, 3, 2, K);
      px(g, o + 2, 5, 1, 3, K);
      px(g, o + 6, 5, 1, 3, K);
      px(g, o + 3, 6, 3, 1, K);
    }
  };
  for (const frame of [0, 1, 2]) {
    s[`creeper${frame}`] = sprite(22, 28, (g) => creeperPx(g, frame, false));
  }
  s.creeperFlash = sprite(22, 28, (g) => creeperPx(g, 0, true));

  // Juan, el capibara (con su mandarina en la cabeza)
  const juan = (frame) =>
    sprite(18, 14, (g) => {
      const body = '#9a6a3d';
      const back = '#7d5530';
      const dark = '#5b3c22';
      px(g, 1, 6, 13, 6, body);
      px(g, 1, 5, 11, 2, back);
      px(g, 0, 7, 1, 4, back);
      px(g, 11, 4, 6, 6, body); // cabeza
      px(g, 14, 6, 4, 4, dark); // hocico
      px(g, 17, 7, 1, 1, '#1a1008');
      px(g, 13, 5, 1, 1, '#1a1008'); // ojo
      px(g, 11, 3, 2, 2, back); // oreja
      px(g, 12, 1, 3, 3, '#ff9a1f'); // mandarina
      px(g, 13, 0, 1, 1, '#3f8f2a');
      const l = frame === 1 ? 1 : 0;
      px(g, 2, 12, 2, 2 - l, dark);
      px(g, 5, 12, 2, 2 - (frame === 2 ? 1 : 0), dark);
      px(g, 9, 12, 2, 2 - l, dark);
      px(g, 12, 10, 2, 4 - (frame === 2 ? 1 : 0), dark);
    });
  s.juan0 = juan(0);
  s.juan1 = juan(1);
  s.juan2 = juan(2);

  // Lata de Four Loko (camuflaje de colores)
  s.loko = sprite(7, 11, (g) => {
    px(g, 0, 1, 7, 10, '#1b1b1b');
    px(g, 1, 0, 5, 1, '#c9c9c9');
    px(g, 1, 10, 5, 1, '#9a9a9a');
    const cam = ['#e8452e', '#f6c43b', '#2f7de1', '#5cc46a'];
    for (let y = 2; y < 10; y++) for (let x = 1; x < 6; x++) px(g, x, y, 1, 1, cam[(x * 3 + y * 5) % 4]);
    px(g, 2, 4, 3, 2, '#111');
    px(g, 2, 4, 1, 1, '#fff');
  });

  s.xp = sprite(5, 5, (g) => {
    px(g, 1, 0, 3, 5, '#a8ff3d');
    px(g, 0, 1, 5, 3, '#a8ff3d');
    px(g, 1, 1, 3, 3, '#e8ff7a');
    px(g, 2, 2, 1, 1, '#ffffff');
  });
  return s;
}

// Versión teñida (daño en rojo)
export function tint(src, color, alpha) {
  const [c, g] = makeCanvas(src.width, src.height);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alpha;
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/* ---------------- iconos de la interfaz ---------------- */
export function heartIcon(kind) {
  return sprite(9, 9, (g) => {
    const rows = ['.XX...XX.', 'XooX.XooX', 'XoooXoooX', 'XoooooooX', '.XoooooX.', '..XoooX..', '...XoX...', '....X....'];
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        let col = '#1b0a0a';
        if (ch === 'o') {
          const filled = kind === 'full' || (kind === 'half' && x < 4);
          col = filled ? (y === 1 && x < 3 ? '#ff9a9a' : '#e3262f') : '#4a2a2a';
        }
        px(g, x, y + 1, 1, 1, col);
      }),
    );
  });
}
