// Genera la cuadrícula del crucigrama a partir de src/content/crossword.js.
// Uso: npm run crossword   (escribe src/content/crosswordLayout.js)
import { writeFileSync } from 'node:fs';
import { entries } from '../src/content/crossword.js';

const ATTEMPTS = 30000;
const TARGET_W = 343; // área aproximada disponible en un móvil (px)
const TARGET_H = 430;

const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function tryLayout(words) {
  const letters = new Map(); // "r,c" -> letra
  const used = new Map(); // "r,c" -> { A, D }
  const placed = [];
  const key = (r, c) => `${r},${c}`;

  const fits = (w, r, c, dir) => {
    const dr = dir === 'D' ? 1 : 0;
    const dc = dir === 'A' ? 1 : 0;
    if (letters.has(key(r - dr, c - dc))) return -1;
    if (letters.has(key(r + dr * w.length, c + dc * w.length))) return -1;
    let cross = 0;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const ex = letters.get(key(rr, cc));
      if (ex) {
        if (ex !== w[i] || used.get(key(rr, cc))[dir]) return -1;
        cross++;
      } else if (letters.has(key(rr + dc, cc + dr)) || letters.has(key(rr - dc, cc - dr))) {
        return -1;
      }
    }
    return cross;
  };

  const put = (w, r, c, dir) => {
    const dr = dir === 'D' ? 1 : 0;
    const dc = dir === 'A' ? 1 : 0;
    for (let i = 0; i < w.length; i++) {
      const k = key(r + dr * i, c + dc * i);
      letters.set(k, w[i]);
      used.set(k, { ...(used.get(k) || {}), [dir]: true });
    }
    placed.push({ answer: w, r, c, dir });
  };

  const bbox = () => {
    let r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9;
    for (const k of letters.keys()) {
      const [r, c] = k.split(',').map(Number);
      r0 = Math.min(r0, r); r1 = Math.max(r1, r);
      c0 = Math.min(c0, c); c1 = Math.max(c1, c);
    }
    return { rows: r1 - r0 + 1, cols: c1 - c0 + 1, r0, c0 };
  };

  put(words[0], 0, 0, Math.random() < 0.5 ? 'A' : 'D');

  for (const w of words.slice(1)) {
    const cands = [];
    for (const p of placed) {
      for (let i = 0; i < p.answer.length; i++) {
        for (let j = 0; j < w.length; j++) {
          if (p.answer[i] !== w[j]) continue;
          const dir = p.dir === 'A' ? 'D' : 'A';
          const r = p.dir === 'A' ? p.r - j : p.r + i;
          const c = p.dir === 'A' ? p.c + i : p.c - j;
          if (fits(w, r, c, dir) > 0) cands.push([r, c, dir]);
        }
      }
    }
    if (!cands.length) return null;
    // Elige entre los candidatos el que menos agranda la caja (con algo de azar).
    let best = null;
    let bestScore = Infinity;
    for (const [r, c, dir] of shuffle(cands).slice(0, 40)) {
      const snapshot = [new Map(letters), new Map(used), placed.length];
      put(w, r, c, dir);
      const b = bbox();
      const score = b.rows * b.cols + Math.random() * 6;
      letters.clear(); snapshot[0].forEach((v, k) => letters.set(k, v));
      used.clear(); snapshot[1].forEach((v, k) => used.set(k, v));
      placed.length = snapshot[2];
      if (score < bestScore) { bestScore = score; best = [r, c, dir]; }
    }
    put(w, ...best);
  }

  const b = bbox();
  return {
    rows: b.rows,
    cols: b.cols,
    words: placed.map((p) => ({ ...p, r: p.r - b.r0, c: p.c - b.c0 })),
  };
}

const answers = entries.map((e) => e.answer);
let best = null;
let bestCell = 0;
for (let n = 0; n < ATTEMPTS; n++) {
  const order = shuffle(answers.slice());
  // Empieza por una palabra larga para tener más cruces.
  order.sort((a, b) => b.length - a.length + (Math.random() - 0.5) * 6);
  const lay = tryLayout(order);
  if (!lay) continue;
  const cell = Math.min(TARGET_W / lay.cols, TARGET_H / lay.rows);
  if (cell > bestCell) { bestCell = cell; best = lay; }
}
if (!best) throw new Error('No se pudo armar un crucigrama con todas las palabras');

// Numeración estándar: orden de lectura de las casillas donde empieza alguna palabra.
const starts = new Map();
for (const w of best.words) starts.set(`${w.r},${w.c}`, null);
const sortedStarts = [...starts.keys()].sort((a, b) => {
  const [ar, ac] = a.split(',').map(Number);
  const [br, bc] = b.split(',').map(Number);
  return ar - br || ac - bc;
});
sortedStarts.forEach((k, i) => starts.set(k, i + 1));

const clueOf = Object.fromEntries(entries.map((e) => [e.answer, e.clue]));
const words = best.words
  .map((w) => ({ num: starts.get(`${w.r},${w.c}`), dir: w.dir, r: w.r, c: w.c, answer: w.answer, clue: clueOf[w.answer] }))
  .sort((a, b) => a.num - b.num || (a.dir === 'A' ? -1 : 1));

const out = `// GENERADO por scripts/build-crossword.mjs — no editar a mano (npm run crossword).
export const layout = ${JSON.stringify({ rows: best.rows, cols: best.cols, words }, null, 2)};
`;
writeFileSync(new URL('../src/content/crosswordLayout.js', import.meta.url), out);

// Vista previa en consola
const grid = Array.from({ length: best.rows }, () => Array(best.cols).fill('·'));
for (const w of words) for (let i = 0; i < w.answer.length; i++) grid[w.r + (w.dir === 'D' ? i : 0)][w.c + (w.dir === 'A' ? i : 0)] = w.answer[i];
console.log(grid.map((r) => r.join(' ')).join('\n'));
console.log(`\n${best.cols}x${best.rows} · ${words.length} palabras · celda ≈ ${bestCell.toFixed(1)}px`);
