// Rival (el Quiz): elige una bola y tronera, comprueba que el camino esté libre y añade error humano.
import { R, W, H, POCKETS, VMAX, canPlaceCue } from './physics.js';

export const AI_ANGLE_SD = 0.06; // ruido de puntería en radianes (~2.4°). Más alto = más fácil de ganar.

const gauss = () => {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
};

// Distancia del punto p al segmento a-b
function distToSegment(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  let t = l2 ? ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

// Punto al que apuntar dentro de la tronera (un poco hacia el centro de la mesa)
function pocketAim(p) {
  const cx = W / 2;
  const cy = H / 2;
  const d = Math.hypot(cx - p.x, cy - p.y);
  const push = p.r > 10 ? 5 : 3;
  return { x: p.x + ((cx - p.x) / d) * push, y: p.y + ((cy - p.y) / d) * push };
}

export function bestShot(balls, cue, targets) {
  const live = balls.filter((b) => !b.pocketed);
  let best = null;
  for (const id of targets) {
    const t = live.find((b) => b.id === id);
    if (!t) continue;
    for (const p of POCKETS) {
      const pa = pocketAim(p);
      const dTP = Math.hypot(pa.x - t.x, pa.y - t.y);
      const ux = (pa.x - t.x) / dTP;
      const uy = (pa.y - t.y) / dTP;
      const ghost = { x: t.x - ux * 2 * R, y: t.y - uy * 2 * R };
      if (ghost.x < R || ghost.x > W - R || ghost.y < R || ghost.y > H - R) continue;
      const dCG = Math.hypot(ghost.x - cue.x, ghost.y - cue.y);
      if (dCG < 1) continue;
      const cx = (ghost.x - cue.x) / dCG;
      const cy = (ghost.y - cue.y) / dCG;
      const cos = cx * ux + cy * uy; // 1 = tiro recto
      if (cos < 0.34) continue; // corte demasiado cerrado (> ~70°)
      let blocked = false;
      for (const o of live) {
        if (o.id === 0 || o.id === id) continue;
        if (distToSegment(o, cue, ghost) < 2 * R - 0.5 || distToSegment(o, t, pa) < 2 * R - 0.5) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      const score = cos * 3 - (dCG + dTP) / 120;
      if (!best || score > best.score) best = { score, id, ghost, dCG, dTP, cos };
    }
  }
  return best;
}

// Devuelve { angle, power } con error humano aplicado.
export function chooseShot(balls, targets, { breakShot = false } = {}) {
  const cue = balls.find((b) => b.id === 0);
  if (breakShot) {
    const apex = balls.filter((b) => b.id !== 0 && !b.pocketed).sort((a, b) => a.y - b.y)[0];
    const a = Math.atan2(apex.y - cue.y, apex.x - cue.x) + gauss() * 0.02;
    return { angle: a, power: 0.9, plan: null };
  }
  const best = bestShot(balls, cue, targets);
  if (best) {
    const a = Math.atan2(best.ghost.y - cue.y, best.ghost.x - cue.x) + gauss() * AI_ANGLE_SD;
    const need = Math.sqrt(2 * 150 * (best.dCG + best.dTP * 1.3)) + 90;
    const power = Math.max(0.25, Math.min(1, need / VMAX + Math.random() * 0.08));
    return { angle: a, power, plan: best };
  }
  // Sin tiro limpio: golpear la bola legal más cercana con fuerza media.
  const live = balls.filter((b) => !b.pocketed && targets.includes(b.id));
  live.sort((a, b) => Math.hypot(a.x - cue.x, a.y - cue.y) - Math.hypot(b.x - cue.x, b.y - cue.y));
  const t = live[0];
  const a = Math.atan2(t.y - cue.y, t.x - cue.x) + gauss() * AI_ANGLE_SD * 1.5;
  return { angle: a, power: 0.45 + Math.random() * 0.2, plan: null };
}

// Con bola en mano: prueba posiciones y elige la que da mejor tiro.
export function choosePlacement(balls, targets) {
  const cue = balls.find((b) => b.id === 0);
  let best = null;
  for (let k = 0; k < 60; k++) {
    const x = R + 4 + Math.random() * (W - 2 * R - 8);
    const y = H * 0.45 + Math.random() * (H * 0.5 - R - 4);
    if (!canPlaceCue(balls, x, y)) continue;
    const s = bestShot(balls, { x, y }, targets);
    const score = s ? s.score : -10;
    if (!best || score > best.score) best = { x, y, score };
  }
  if (!best) return { x: cue.x, y: cue.y };
  return best;
}
