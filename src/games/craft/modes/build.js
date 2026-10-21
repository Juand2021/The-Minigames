// Modo construcción: planos, terreno de cada obra y puntaje (sin DOM).
import { B } from '../engine/blocks.js';
import { World, rng, tree } from '../engine/world.js';

// Leyenda de los planos. ' ' = da igual · '.' = debe quedar vacío
export const LEGEND = {
  C: B.COBBLE,
  L: B.LOG,
  P: B.PLANKS,
  G: B.GLASS,
  D: B.DOOR,
  B: B.BRICK,
  S: B.STONEBRICK,
  F: B.FENCE,
  T: B.TORCH,
};

export const BLUEPRINTS = [
  {
    id: 'house',
    title: 'La casa de Juan',
    rows: [
      '   PPP   ',
      '  PPPPP  ',
      ' PPPPPPP ',
      'LLLLLLLLL',
      'LPGGPPPPL',
      'LPGGPPDPL',
      'LPPPPPDPL',
      'CCCCCCCCC',
    ],
    palette: [B.COBBLE, B.LOG, B.PLANKS, B.GLASS, B.DOOR],
  },
  {
    id: 'bridge',
    title: 'El puente sobre el río',
    rows: [
      'T          T',
      'F  F    F  F',
      'PPPPPPPPPPPP',
      'L    SS    L',
      '     SS     ',
      '     SS     ',
    ],
    palette: [B.PLANKS, B.FENCE, B.TORCH, B.STONEBRICK, B.LOG],
  },
  {
    id: 'tadeo',
    title: 'El arco de la Tadeo',
    rows: [
      'BBBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBBB',
      'BBB.........BBB',
      'BBB.BBBBBBB.BBB',
      'BBB.B.....B.BBB',
      'BBB.B.....B.BBB',
      'BBB.B.GGG.B.BBB',
      'BBB.B.GGG.B.BBB',
      'BBB.B.GGG.B.BBB',
    ],
    palette: [B.BRICK, B.GLASS],
  },
];

export const blueprintSize = (bp) => ({ w: bp.rows[0].length, h: bp.rows.length });

// Crea el terreno de la obra. Devuelve { world, ox, oy, base, ground, stand }
export function makeSite(bp, seed = 1) {
  const { w: bw, h: bh } = blueprintSize(bp);
  const margin = 5;
  const W = bw + margin * 2;
  const top = 3;
  const ground = top + bh; // fila de la superficie
  const H = ground + 18; // suelo de sobra para que llene la parte baja de la pantalla
  const world = new World(W, H);
  const r = rng(seed);
  const ox = margin;
  const oy = ground - bh;

  const fill = (x, y, id) => {
    world.set(x, y, id);
    world.fixed[y * W + x] = 1;
  };

  if (bp.id === 'bridge') {
    // Dos acantilados y un río debajo del puente
    const deckRow = oy + 2;
    for (let x = 0; x < W; x++) {
      const inGap = x >= ox && x < ox + bw;
      const surf = inGap ? oy + bh : deckRow;
      for (let y = surf; y < H; y++) fill(x, y, y === surf ? (inGap ? B.SAND : B.GRASS) : y < surf + 3 ? B.DIRT : B.STONE);
      if (inGap) for (let y = deckRow + 1; y < surf; y++) if (y >= oy + 4) fill(x, y, B.WATER);
    }
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (world.get(x, y) === B.WATER) world.fixed[y * W + x] = 0;
    tree(world, 1, deckRow, r);
    tree(world, W - 2, deckRow, r);
    return finish(world, bp, ox, oy, deckRow);
  }

  const plaza = bp.id === 'tadeo';
  for (let x = 0; x < W; x++) {
    for (let y = ground; y < H; y++) {
      let id = y === ground ? (plaza ? B.STONEBRICK : B.GRASS) : y < ground + 3 ? B.DIRT : B.STONE;
      fill(x, y, id);
    }
  }
  if (!plaza) {
    tree(world, 1, ground, r);
    tree(world, W - 2, ground, r);
  }
  return finish(world, bp, ox, oy, ground);
}

function finish(world, bp, ox, oy, standRow) {
  // Los árboles decorativos también son fijos
  for (let i = 0; i < world.tiles.length; i++) if (world.tiles[i] === B.TRUNK || world.tiles[i] === B.LEAVES) world.fixed[i] = 1;
  return { world, ox, oy, base: world.tiles.slice(), standRow };
}

// Cuánto se parece lo construido al plano.
export function scoreBuild(site, bp) {
  const { world, ox, oy } = site;
  let need = 0;
  let correct = 0;
  let wrong = 0;
  bp.rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch === ' ') return;
      const x = ox + rx;
      const y = oy + ry;
      const cur = world.get(x, y);
      const placed = !world.isFixed(x, y) && cur !== B.AIR && cur !== B.WATER;
      if (ch === '.') {
        if (placed) wrong++;
        return;
      }
      need++;
      if (cur === LEGEND[ch]) correct++;
      else if (placed) wrong++;
    });
  });
  const accuracy = Math.max(0, Math.min(1, (correct - 0.5 * wrong) / need));
  const stars = accuracy >= 0.98 ? 3 : accuracy >= 0.85 ? 2 : accuracy >= 0.6 ? 1 : 0;
  return { need, correct, wrong, accuracy, stars, score: Math.round(accuracy * 1000) + stars * 100, progress: correct / need };
}

// Celdas del plano con lo que piden (para dibujar el "fantasma")
export function blueprintCells(bp, ox, oy) {
  const cells = [];
  bp.rows.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      if (ch !== ' ') cells.push({ x: ox + rx, y: oy + ry, id: ch === '.' ? B.AIR : LEGEND[ch] });
    }),
  );
  return cells;
}

// Colocar o quitar en modo creativo. Devuelve true si cambió algo.
export function paint(site, x, y, id) {
  const { world, base } = site;
  if (!world.inside(x, y) || world.isFixed(x, y)) return false;
  const cur = world.get(x, y);
  if (id === null) {
    const orig = base[y * world.w + x];
    if (cur === orig) return false;
    world.set(x, y, orig === B.WATER ? B.WATER : B.AIR);
    return true;
  }
  if (cur === id) return false;
  world.set(x, y, id);
  return true;
}
