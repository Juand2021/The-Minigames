// Pruebas sin interfaz de Maincra: mundo, física, supervivencia (con un bot) y planos de construcción.
import { B } from '../src/games/craft/engine/blocks.js';
import { World, generateSurvival } from '../src/games/craft/engine/world.js';
import { moveEntity } from '../src/games/craft/engine/physics.js';
import { Survival, WAVES } from '../src/games/craft/modes/survival.js';
import { BLUEPRINTS, makeSite, scoreBuild, blueprintCells, paint } from '../src/games/craft/modes/build.js';

const assert = (c, msg) => {
  if (!c) throw new Error(msg);
};

// 1) Mundo
{
  const w = generateSurvival(1234);
  assert(w.w === 64 && w.h === 36, 'tamaño');
  for (let x = 0; x < w.w; x++) {
    assert(w.get(x, w.h - 1) === B.BEDROCK, 'lecho de roca');
    assert(w.surface(x) > 5 && w.surface(x) < 32, `superficie rara en ${x}`);
  }
  const c = Math.floor(w.center);
  for (let x = c - 4; x <= c + 4; x++) assert(w.heights[x] === w.heights[c], 'centro plano');
  console.log('mundo OK');
}

// 2) Física: cae al suelo y choca con paredes
{
  const w = new World(10, 10);
  for (let x = 0; x < 10; x++) w.set(x, 8, B.STONE);
  w.set(6, 7, B.STONE);
  w.set(6, 6, B.STONE);
  const e = { x: 2, y: 0, w: 0.6, h: 1.8, vx: 0, vy: 0 };
  for (let i = 0; i < 120; i++) moveEntity(w, e, 1 / 60);
  assert(e.onGround && Math.abs(e.y + e.h - 8) < 1e-6, 'debería estar en el suelo');
  for (let i = 0; i < 120; i++) {
    e.vx = 4;
    moveEntity(w, e, 1 / 60);
  }
  assert(Math.abs(e.x + e.w - 6) < 1e-6, `debería chocar con la pared (x=${e.x})`);
  console.log('física OK');
}

// 3) Supervivencia con un bot que defiende
function play(seed, bot) {
  const s = new Survival(seed);
  s.startNight();
  const dt = 1 / 60;
  let t = 0;
  const stats = { steals: 0, explosions: 0, kills: 0 };
  while (!s.result && t < 900) {
    bot(s);
    s.update(dt);
    for (const e of s.events) {
      if (e.type === 'steal') stats.steals++;
      if (e.type === 'explode') stats.explosions++;
    }
    s.events.length = 0;
    t += dt;
    for (const m of s.mobs) assert(Number.isFinite(m.x + m.y), 'mob con posición inválida');
    assert(Number.isFinite(s.player.x + s.player.y), 'jugadora con posición inválida');
  }
  stats.kills = s.kills;
  return { result: s.result, t, stats, lokos: s.lokos, reason: s.loseReason, wave: s.wave };
}

const defender = (s) => {
  const p = s.player;
  const px = p.x + p.w / 2;
  let near = null;
  let nd = 1e9;
  for (const m of s.mobs) {
    const d = Math.abs(m.x + m.w / 2 - px) + (m.carry ? -3 : 0);
    if (d < nd) {
      nd = d;
      near = m;
    }
  }
  const home = s.chest.x + 0.5;
  const tx = near && nd < 14 ? near.x + near.w / 2 : home - 1.5;
  s.input.move = Math.abs(tx - px) > 0.9 ? Math.sign(tx - px) : 0;
  s.input.jump = p.hitWall !== 0;
  if (near && Math.hypot(near.x - p.x, near.y - p.y) < 2.2) s.input.attack = true;
};

const runs = [];
for (let i = 0; i < 12; i++) runs.push(play(100 + i, defender));
const won = runs.filter((r) => r.result === 'won').length;
console.log(`bot defensor: ${won}/${runs.length} noches ganadas`);
runs.forEach((r, i) =>
  console.log(`  #${i} ${r.result} en ${r.t.toFixed(0)}s · oleada ${r.wave}/${WAVES.length} · robos ${r.stats.steals} · explosiones ${r.stats.explosions} · bajas ${r.stats.kills} · lokos ${r.lokos} ${r.reason}`),
);
assert(runs.every((r) => r.result), 'alguna partida no terminó');
assert(won >= runs.length * 0.5, 'el bot defensor gana muy poco: demasiado difícil');

// 4) Sin defensa se pierde
const idle = play(7, (s) => {
  s.input.move = 0;
});
console.log(`bot quieto: ${idle.result} en ${idle.t.toFixed(0)}s · ${idle.reason}`);
assert(idle.result === 'lost', 'sin defensa debería perder');

// 5) Jugadora quieta e invencible: deben robar los 5 Four Lokos y luego llevarse a Juan
const thief = play(8, (s) => {
  s.input.move = 0;
  s.player.invuln = 1e9;
});
console.log(`robo total: ${thief.result} · robos ${thief.stats.steals} · lokos ${thief.lokos} · ${thief.reason}`);
assert(thief.result === 'lost' && thief.reason.includes('Juan') && thief.lokos === 0, 'el robo de Juan no funcionó');

// 6) Construcción: plano perfecto = 3 estrellas; errores y bloques donde va vacío bajan el puntaje
for (const bp of BLUEPRINTS) {
  const site = makeSite(bp, 3);
  const empty = scoreBuild(site, bp);
  assert(empty.correct === 0 && empty.stars === 0, `${bp.id}: debería empezar vacío`);
  for (const c of blueprintCells(bp, site.ox, site.oy)) paint(site, c.x, c.y, c.id === B.AIR ? null : c.id);
  const full = scoreBuild(site, bp);
  assert(full.accuracy === 1 && full.stars === 3, `${bp.id}: plano perfecto debería dar 3 estrellas (${full.correct}/${full.need})`);
  // un bloque equivocado y uno en una celda que debe quedar vacía
  const cells = blueprintCells(bp, site.ox, site.oy);
  const solid = cells.find((c) => c.id !== B.AIR);
  paint(site, solid.x, solid.y, solid.id === B.DIRT ? B.SAND : B.DIRT);
  const hole = cells.find((c) => c.id === B.AIR);
  if (hole) paint(site, hole.x, hole.y, B.DIRT);
  const worse = scoreBuild(site, bp);
  assert(worse.accuracy < 1 && worse.wrong >= 1, `${bp.id}: los errores deberían restar`);
  // el terreno fijo no se puede tocar
  const gx = site.ox - 2;
  const gy = site.world.surface(gx);
  assert(!paint(site, gx, gy, null), `${bp.id}: no debería poder borrar el terreno`);
  console.log(`${bp.id}: ${full.need} bloques · perfecto ${full.score} pts · con errores ${worse.score} pts (${worse.stars}★)`);
}

console.log('OK');
