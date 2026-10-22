// Prueba sin interfaz: física estable y partidas IA vs IA que siempre terminan.
import { Match } from '../src/games/pool/match.js';
import { step, isMoving, SUBSTEP, VMAX, W, H, R, canPlaceCue } from '../src/games/pool/physics.js';
import { chooseShot, choosePlacement } from '../src/games/pool/ai.js';

function shoot(m, angle, power) {
  m.beginShot();
  const ev = m.report;
  m.cue.vx = Math.cos(angle) * VMAX * power;
  m.cue.vy = Math.sin(angle) * VMAX * power;
  let t = 0;
  let maxV = 0;
  while (isMoving(m.balls) && t < 40) {
    step(m.balls, SUBSTEP, ev);
    t += SUBSTEP;
    for (const b of m.balls) {
      if (b.pocketed) continue;
      if (!Number.isFinite(b.x + b.y) || b.x < -1 || b.x > W + 1 || b.y < -1 || b.y > H + 1) {
        throw new Error(`bola fuera de mesa: ${b.id} (${b.x.toFixed(1)}, ${b.y.toFixed(1)})`);
      }
      maxV = Math.max(maxV, Math.hypot(b.vx, b.vy));
    }
  }
  if (t >= 40) throw new Error('el tiro nunca se detiene');
  // No debe haber bolas solapadas al final
  const live = m.balls.filter((b) => !b.pocketed);
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++)
      if (Math.hypot(live[i].x - live[j].x, live[i].y - live[j].y) < 2 * R - 0.8) throw new Error('bolas solapadas');
  return { t, maxV };
}

// 1) Energía: un tiro a máxima potencia debe detenerse en un tiempo razonable
{
  const m = new Match();
  const { t } = shoot(m, -Math.PI / 2, 1);
  console.log(`rotura a máxima potencia: ${t.toFixed(2)} s, embocadas: [${m.report.pocketed}]`);
}

// 2) Partidas completas IA vs IA
const GAMES = 150;
let finished = 0;
let totalShots = 0;
let fouls = 0;
let earlyEight = 0;
const wins = { P: 0, V: 0 };
for (let g = 0; g < GAMES; g++) {
  const m = new Match();
  let shots = 0;
  while (!m.winner && shots < 250) {
    if (m.inHand) {
      const p = choosePlacement(m.balls, m.targets());
      if (!canPlaceCue(m.balls, p.x, p.y)) throw new Error('colocación inválida');
      m.cue.x = p.x;
      m.cue.y = p.y;
      m.inHand = false;
    }
    const s = chooseShot(m.balls, m.targets(), { breakShot: m.isBreak });
    shoot(m, s.angle, s.power);
    const out = m.endShot();
    if (out.foul) fouls++;
    if (out.gameOver?.early) earlyEight++;
    shots++;
  }
  totalShots += shots;
  if (m.winner) {
    finished++;
    wins[m.winner]++;
  }
}
console.log(`partidas terminadas: ${finished}/${GAMES} · tiros medios: ${(totalShots / GAMES).toFixed(1)} · faltas/partida: ${(fouls / GAMES).toFixed(1)} · 8 prematuras: ${earlyEight}`);
console.log('victorias', wins);
if (finished < GAMES * 0.9) throw new Error('demasiadas partidas sin terminar');
console.log('OK');

// 3) La 8 en la apertura vuelve a la mesa y la partida sigue
{
  const m = new Match();
  m.beginShot();
  const eight = m.balls.find((b) => b.id === 8);
  eight.pocketed = true;
  m.report.pocketed.push(8);
  m.report.firstContact = 1;
  const out = m.endShot();
  if (m.winner || eight.pocketed || !out.eightRespotted) throw new Error('la 8 en la apertura debería volver a la mesa');
  const overlap = m.balls.some((b) => b.id !== 8 && !b.pocketed && Math.hypot(b.x - eight.x, b.y - eight.y) < 2 * R - 0.5);
  if (overlap) throw new Error('la 8 quedó encima de otra bola');
  console.log('8 en la apertura: vuelve a la mesa OK');
}
