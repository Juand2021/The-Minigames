// Lógica de la noche de supervivencia (sin DOM). La interfaz lee el estado y consume `events`.
import { B, BLOCKS, dropOf } from '../engine/blocks.js';
import { generateSurvival } from '../engine/world.js';
import { moveEntity, overlapsTile, boxDist, centerX, centerY } from '../engine/physics.js';

export const WAVES = [
  ['zombie', 'zombie', 'zombie'],
  ['zombie', 'zombie', 'creeper', 'zombie'],
  ['zombie', 'skeleton', 'zombie', 'creeper', 'zombie'],
  ['zombie', 'zombie', 'skeleton', 'creeper', 'zombie', 'skeleton', 'creeper', 'zombie'],
];

const MOB = {
  zombie: { hp: 16, speed: 1.9, w: 0.6, h: 1.8 },
  creeper: { hp: 14, speed: 1.7, w: 0.6, h: 1.7 },
  skeleton: { hp: 14, speed: 1.8, w: 0.6, h: 1.8 },
};

export const PREP_TIME = 35;
const REACH = 4.5;
const ATTACK_REACH = 2.4;
const WALK = 4.3;
const JUMP = 9.2;
const FUSE = 1.5;
const BLAST = 2.6;
const LOKOS = 5;

export class Survival {
  constructor(seed = Date.now()) {
    this.world = generateSurvival(seed);
    const w = this.world;
    const cx = Math.floor(w.center);
    const gy = w.heights[cx];
    this.chest = { x: cx, y: gy - 1, w: 1, h: 1 };
    w.set(cx, gy - 1, B.CHEST);
    this.lokos = LOKOS;
    this.player = {
      x: cx - 2.5, y: gy - 1.8, w: 0.6, h: 1.8, vx: 0, vy: 0, onGround: false,
      hp: 20, maxHp: 20, face: 1, attackCd: 0, swingT: 0, invuln: 0, hurtT: 0, regenT: 0, kbT: 0, walkT: 0,
      sword: 6, ironSword: false,
    };
    this.juan = { x: cx + 1.6, y: gy - 0.7, w: 0.9, h: 0.7, vx: 0, vy: 0, home: cx + 1.6, carriedBy: null, lost: false, face: -1, walkT: 0, scaredT: 0 };
    this.mobs = [];
    this.arrows = [];
    this.drops = [];
    this.inv = new Map([[B.COBBLE, 12], [B.PLANKS, 8], [B.DIRT, 6], [B.TORCH, 4]]);
    this.selected = B.COBBLE;
    this.phase = 'prep';
    this.t = 0;
    this.phaseT = 0;
    this.wave = 0; // oleada actual (1..N) durante la noche
    this.queue = [];
    this.spawnT = 0;
    this.breakT = 0;
    this.daylight = 0.35; // 0 = día, 1 = noche cerrada
    this.mining = null; // { tx, ty, p }
    this.digSoundT = 0;
    this.kills = 0;
    this.xp = 0;
    this.result = null; // 'won' | 'lost'
    this.loseReason = '';
    this.events = [];
    this.input = { move: 0, jump: false, attack: false, mine: null, place: null };
    this.nextId = 1;
  }

  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }

  get juanSafe() {
    return !this.juan.lost;
  }

  startNight() {
    if (this.phase !== 'prep') return;
    this.phase = 'night';
    this.phaseT = 0;
    this.nextWave();
  }

  nextWave() {
    this.wave++;
    const list = WAVES[this.wave - 1];
    this.queue = list.map((type, i) => ({ type, side: i % 2 === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0 }));
    this.queue.forEach((q, i) => {
      if (q.side === 0) q.side = -this.queue[i - 1].side;
    });
    this.spawnT = 1.2;
    this.emit('wave', { n: this.wave, total: WAVES.length });
  }

  spawn(type, side) {
    const w = this.world;
    const m = MOB[type];
    const x = side < 0 ? 1.2 : w.w - 1.2 - m.w;
    const sy = w.surface(Math.floor(x + m.w / 2));
    this.mobs.push({
      id: this.nextId++, type, x, y: sy - m.h - 0.05, w: m.w, h: m.h, vx: 0, vy: 0, onGround: false,
      hp: m.hp, maxHp: m.hp, speed: m.speed, face: side < 0 ? 1 : -1, hurtT: 0, kbT: 0, attackCd: 0.5,
      breakT: 0, breakTile: null, stuckT: 0, carry: null, grabT: 0, fuse: 0, shootCd: 1.5 + Math.random(),
      walkT: 0, burnT: 0, groanT: 2 + Math.random() * 4,
    });
    this.emit('spawn', { mob: type });
  }

  /* ---------------- bucle ---------------- */
  update(dt) {
    if (this.result) return;
    this.t += dt;
    this.phaseT += dt;

    if (this.phase === 'prep') {
      this.daylight = 0.35 + 0.3 * Math.min(1, this.phaseT / PREP_TIME);
      if (this.phaseT >= PREP_TIME) this.startNight();
    } else if (this.phase === 'night') {
      this.daylight = Math.min(1, this.daylight + dt * 0.05);
      if (this.queue.length) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) {
          const q = this.queue.shift();
          this.spawn(q.type, q.side);
          this.spawnT = 2.2 + Math.random() * 1.2;
        }
      } else if (this.mobs.length === 0) {
        this.breakT += dt;
        if (this.wave >= WAVES.length) {
          this.phase = 'dawn';
          this.phaseT = 0;
          this.emit('dawn');
        } else if (this.breakT > 5) {
          this.breakT = 0;
          this.nextWave();
        }
      }
    } else if (this.phase === 'dawn') {
      this.daylight = Math.max(0, 1 - this.phaseT / 5);
      if (this.phaseT > 5.5) {
        this.result = 'won';
        this.emit('won');
      }
    }

    this.updatePlayer(dt);
    this.updateMining(dt);
    this.updatePlace();
    for (const m of this.mobs) this.updateMob(m, dt);
    this.mobs = this.mobs.filter((m) => !m.dead);
    this.updateArrows(dt);
    this.updateJuan(dt);
    this.updateDrops(dt);
  }

  /* ---------------- jugadora ---------------- */
  updatePlayer(dt) {
    const p = this.player;
    const inp = this.input;
    p.attackCd -= dt;
    p.swingT = Math.max(0, p.swingT - dt);
    p.invuln -= dt;
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.regenT += dt;
    if (p.kbT > 0) p.kbT -= dt;
    else p.vx = inp.move * WALK;
    if (inp.move) p.face = Math.sign(inp.move);
    if (inp.jump && p.onGround) {
      p.vy = -JUMP;
      this.emit('jump');
    }
    const wasAir = !p.onGround;
    const fallV = p.vy;
    moveEntity(this.world, p, dt);
    if (p.onGround && wasAir && fallV > 14) this.hurtPlayer(Math.round((fallV - 14) * 0.9), 0, 'caída');
    if (p.onGround && Math.abs(p.vx) > 0.1) {
      p.walkT += dt * Math.abs(p.vx);
      if (Math.floor(p.walkT / 1.6) !== Math.floor((p.walkT - dt * Math.abs(p.vx)) / 1.6)) {
        this.emit('step', { block: this.world.get(Math.floor(centerX(p)), Math.floor(p.y + p.h + 0.05)) });
      }
    }
    if (p.regenT > 3 && p.hp < p.maxHp && p.hp > 0) {
      p.hp = Math.min(p.maxHp, p.hp + dt * 0.7);
    }
    if (inp.attack) {
      inp.attack = false;
      this.attack();
    }
  }

  attack() {
    const p = this.player;
    if (p.attackCd > 0) return;
    p.attackCd = 0.38;
    p.swingT = 0.25;
    let best = null;
    let bestD = 1e9;
    for (const m of this.mobs) {
      const d = boxDist(p, m);
      if (d > ATTACK_REACH) continue;
      const facing = Math.sign(centerX(m) - centerX(p)) === p.face ? 0 : 0.6; // prefiere lo que tiene delante
      if (d + facing < bestD) {
        bestD = d + facing;
        best = m;
      }
    }
    if (!best) {
      this.emit('swing');
      return;
    }
    p.face = Math.sign(centerX(best) - centerX(p)) || p.face;
    const crit = !p.onGround && p.vy > 1;
    this.damageMob(best, p.sword * (crit ? 1.5 : 1), p.face, crit);
  }

  hurtPlayer(amount, dir, cause = '') {
    const p = this.player;
    if (p.invuln > 0 || this.result || amount <= 0) return;
    p.hp -= amount;
    p.invuln = 0.5;
    p.hurtT = 0.3;
    p.regenT = 0;
    if (dir) {
      p.vx = dir * 6;
      p.vy = -5;
      p.kbT = 0.18;
    }
    this.emit('hurt', { amount, cause });
    if (p.hp <= 0) {
      p.hp = 0;
      this.lose(cause === 'explosión' ? 'Un creeper te hizo volar por los aires' : 'Los mobs te derrotaron esta noche');
    }
  }

  lose(reason) {
    if (this.result) return;
    this.result = 'lost';
    this.loseReason = reason;
    this.emit('lost', { reason });
  }

  /* ---------------- picar y colocar ---------------- */
  inReach(tx, ty) {
    const p = this.player;
    return Math.hypot(tx + 0.5 - centerX(p), ty + 0.5 - (p.y + 0.4)) <= REACH;
  }

  updateMining(dt) {
    const target = this.input.mine;
    if (!target) {
      this.mining = null;
      return;
    }
    const { tx, ty } = target;
    const id = this.world.get(tx, ty);
    const hard = BLOCKS[id].hardness;
    if (!this.inReach(tx, ty) || hard === null || id === B.AIR) {
      this.mining = null;
      return;
    }
    if (!this.mining || this.mining.tx !== tx || this.mining.ty !== ty) this.mining = { tx, ty, p: 0 };
    this.player.face = Math.sign(tx + 0.5 - centerX(this.player)) || this.player.face;
    this.player.swingT = 0.2;
    this.mining.p += dt / hard;
    this.digSoundT -= dt;
    if (this.digSoundT <= 0) {
      this.digSoundT = 0.24;
      this.emit('dig', { block: id, x: tx, y: ty });
    }
    if (this.mining.p >= 1) {
      this.breakBlock(tx, ty, true);
      this.mining = null;
    }
  }

  breakBlock(tx, ty, byPlayer) {
    const id = this.world.get(tx, ty);
    if (id === B.AIR) return;
    this.world.set(tx, ty, B.AIR);
    this.emit('break', { block: id, x: tx, y: ty });
    if (!byPlayer) return;
    const drop = dropOf(id);
    if (drop === 'none') return;
    this.drops.push({ kind: drop === 'coal' || drop === 'iron' ? drop : 'block', id: drop, x: tx + 0.3, y: ty + 0.3, w: 0.4, h: 0.4, vx: (Math.random() - 0.5) * 2, vy: -3, t: 0 });
  }

  updatePlace() {
    const target = this.input.place;
    if (!target) return;
    this.input.place = null;
    const { tx, ty } = target;
    const w = this.world;
    const id = this.selected;
    const have = this.inv.get(id) || 0;
    const cur = w.get(tx, ty);
    if (have <= 0 || !w.inside(tx, ty)) return;
    if (cur !== B.AIR && cur !== B.WATER) return;
    if (!this.inReach(tx, ty)) return;
    const blockers = [this.player, this.juan, ...this.mobs];
    if (BLOCKS[id].solid && blockers.some((e) => overlapsTile(e, tx, ty))) return;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => w.solid(tx + dx, ty + dy));
    if (!near) return;
    if (id === B.TORCH && !w.solid(tx, ty + 1) && !w.solid(tx - 1, ty) && !w.solid(tx + 1, ty)) return;
    w.set(tx, ty, id);
    this.inv.set(id, have - 1);
    this.emit('place', { block: id, x: tx, y: ty });
  }

  /* ---------------- mobs ---------------- */
  damageMob(m, amount, dir, crit = false) {
    m.hp -= amount;
    m.hurtT = 0.3;
    m.aggroT = 4;
    m.vx = dir * 7;
    m.vy = -4.5;
    m.kbT = 0.22;
    m.fuse = 0;
    this.emit('hit', { mob: m.type, crit, x: centerX(m), y: m.y + 0.3 });
    if (m.hp <= 0) this.killMob(m);
  }

  killMob(m) {
    m.dead = true;
    this.kills++;
    this.emit('death', { mob: m.type, x: centerX(m), y: centerY(m) });
    for (let i = 0; i < 3; i++) {
      this.drops.push({ kind: 'xp', x: centerX(m), y: centerY(m), w: 0.3, h: 0.3, vx: (Math.random() - 0.5) * 4, vy: -3 - Math.random() * 2, t: 0 });
    }
    this.dropCarry(m);
  }

  dropCarry(m) {
    if (!m.carry) return;
    if (m.carry === 'loko') {
      this.drops.push({ kind: 'loko', x: centerX(m), y: m.y, w: 0.4, h: 0.5, vx: 0, vy: -4, t: 0 });
      this.emit('chat', { key: 'lokoDropped' });
    } else if (m.carry === 'juan') {
      const j = this.juan;
      j.carriedBy = null;
      j.x = centerX(m) - j.w / 2;
      j.y = m.y;
      j.vy = -4;
      this.emit('chat', { key: 'juanSaved' });
    }
    m.carry = null;
  }

  mobTarget(m) {
    const p = this.player;
    const dP = boxDist(m, p);
    const dyP = Math.abs(centerY(m) - centerY(p));
    if (m.type === 'zombie') {
      if (m.carry) return { x: centerX(m) < this.world.w / 2 ? -10 : this.world.w + 10, kind: 'edge' };
      // son ladrones: van por el cofre; solo persiguen a la jugadora un rato si ella les pega
      if (m.aggroT > 0 && dP < 6 && dyP < 2.2) return { x: centerX(p), kind: 'player', d: dP };
      return { x: this.chest.x + 0.5, kind: 'chest', d: Math.hypot(centerX(m) - this.chest.x - 0.5, m.y + m.h - 0.5 - (this.chest.y + 0.5)) };
    }
    if (m.type === 'creeper') {
      if (dP < 9 && dyP < 3) return { x: centerX(p), kind: 'player', d: dP };
      return { x: this.chest.x + 0.5, kind: 'chest', d: Math.hypot(centerX(m) - this.chest.x - 0.5, centerY(m) - this.chest.y - 0.5) };
    }
    return { x: centerX(p), kind: 'player', d: dP };
  }

  updateMob(m, dt) {
    const w = this.world;
    const p = this.player;
    m.hurtT = Math.max(0, m.hurtT - dt);
    m.attackCd -= dt;
    m.groanT -= dt;
    m.aggroT = Math.max(0, (m.aggroT || 0) - dt);
    if (m.groanT <= 0) {
      m.groanT = 4 + Math.random() * 5;
      this.emit('groan', { mob: m.type, x: centerX(m) });
    }

    // Arden al amanecer
    if (this.phase === 'dawn') {
      m.burnT += dt;
      if (m.burnT > 0.5) {
        m.burnT = 0;
        m.hp -= 4;
        m.hurtT = 0.2;
        this.emit('burn', { x: centerX(m), y: m.y });
        if (m.hp <= 0) this.killMob(m);
      }
    }

    const tgt = this.mobTarget(m);
    let dir = 0;

    if (m.kbT > 0) {
      m.kbT -= dt;
    } else if (m.type === 'skeleton') {
      const d = tgt.d;
      const los = this.lineOfSight(m, p);
      m.noLosT = los ? 0 : (m.noLosT || 0) + dt;
      dir = Math.sign(tgt.x - centerX(m));
      if (m.noLosT > 2.5 || m.holdT > 8) {
        // sin visión o tras mucho rato sin acertar: se acerca (y rompe lo que estorbe)
        if (d < 2.2) m.holdT = 0;
      } else if (d < 4.5) dir = -dir;
      else if (d < 7.5) dir = 0;
      m.holdT = dir === 0 ? (m.holdT || 0) + dt : m.holdT > 8 ? m.holdT : 0;
      m.face = Math.sign(tgt.x - centerX(m)) || m.face;
      m.shootCd -= dt;
      if (m.shootCd <= 0 && d < 12 && los) {
        m.shootCd = 2.2 + Math.random() * 0.8;
        this.shootArrow(m, p);
      }
      m.vx = dir * m.speed;
    } else if (m.type === 'creeper') {
      const close = tgt.d < 1.9 || (m.stuckT > 1.5 && tgt.d < 4.5);
      if (m.fuse > 0 || close) {
        if (m.fuse === 0) this.emit('fuse', { x: centerX(m) });
        m.fuse += dt;
        m.vx = 0;
        if (tgt.kind === 'player' && tgt.d > 3.6) m.fuse = 0;
        if (m.fuse >= FUSE) return this.explode(m);
      } else {
        dir = Math.sign(tgt.x - centerX(m));
        m.vx = dir * m.speed;
      }
    } else {
      // zombi
      dir = Math.sign(tgt.x - centerX(m));
      // al lado del cofre, o justo debajo (en un cráter), ya alcanza a robar
      const underChest = tgt.kind === 'chest' && Math.abs(centerX(m) - this.chest.x - 0.5) < 1.2 && tgt.d < 2.6;
      if (tgt.kind === 'chest' && (tgt.d < 1.3 || underChest)) {
        dir = 0;
        m.grabT += dt;
        if (m.grabT > 0.9) this.steal(m);
      } else m.grabT = 0;
      m.vx = dir * (m.carry ? 2.7 : m.speed);
      // golpe a la jugadora
      if (!m.carry && m.attackCd <= 0 && boxDist(m, p) < 1.1) {
        m.attackCd = 1.2;
        this.hurtPlayer(2, Math.sign(centerX(p) - centerX(m)) || 1, 'zombi');
      }
      // escapó con el botín
      if (m.carry && (m.x < 0.3 || m.x + m.w > w.w - 0.3)) return this.escape(m);
    }
    if (Math.abs(tgt.x - centerX(m)) < 0.3) dir = 0;
    if (!dir && m.type !== 'creeper') m.vx = m.kbT > 0 ? m.vx : 0;
    if (dir) m.face = dir;

    const prevX = m.x;
    moveEntity(w, m, dt);
    if (Math.abs(m.vx) > 0.1) m.walkT += dt * Math.abs(m.vx);

    // Atascado contra un muro: saltar si es de un bloque; si no, romperlo (zombis) o esperar (creepers explotan)
    if (m.hitWall && dir) {
      const fx = m.hitWall > 0 ? Math.floor(m.x + m.w + 0.05) : Math.floor(m.x - 0.05);
      const footY = Math.floor(m.y + m.h - 0.05);
      const oneHigh = w.solid(fx, footY) && !w.solid(fx, footY - 1) && !w.solid(fx, footY - 2) && !w.solid(Math.floor(centerX(m)), Math.floor(m.y) - 1);
      if (oneHigh && m.onGround) m.vy = -JUMP * 0.97;
      else {
        m.stuckT += dt;
        if (m.type !== 'creeper') this.zombieBreak(m, fx, footY, dt);
      }
    } else if (Math.abs(m.x - prevX) > 0.001) {
      m.stuckT = Math.max(0, m.stuckT - dt);
      m.breakT = 0;
    }
  }

  // Rompe en escalera: primero lo más alto del muro, para poder subir saltando en vez de hacer túneles.
  zombieBreak(m, fx, footY, dt) {
    const w = this.world;
    const ok = (x, y) => w.solid(x, y) && BLOCKS[w.get(x, y)].hardness !== null;
    const ownX = Math.floor(centerX(m));
    const headY = Math.floor(m.y) - 1;
    let tx = fx;
    let ty = null;
    if (ok(fx, footY - 2)) ty = footY - 2;
    else if (ok(fx, footY - 1)) ty = footY - 1;
    else if (ok(ownX, headY)) {
      tx = ownX;
      ty = headY;
    } else if (ok(fx, footY)) ty = footY;
    if (ty === null) return;
    fx = tx;
    const key = `${fx},${ty}`;
    if (m.breakTile !== key) {
      m.breakTile = key;
      m.breakT = 0;
    }
    m.breakT += dt;
    const need = BLOCKS[w.get(fx, ty)].hardness * 2.6 + 0.8;
    m.breakProgress = { tx: fx, ty, p: m.breakT / need };
    if (Math.random() < dt * 3) this.emit('dig', { block: w.get(fx, ty), x: fx, y: ty, mob: true });
    if (m.breakT >= need) {
      this.breakBlock(fx, ty, false);
      m.breakT = 0;
      m.breakProgress = null;
    }
  }

  steal(m) {
    m.grabT = 0;
    if (this.lokos > 0) {
      this.lokos--;
      m.carry = 'loko';
      this.emit('steal', { what: 'loko', left: this.lokos });
    } else if (!this.juan.carriedBy && !this.juan.lost) {
      m.carry = 'juan';
      this.juan.carriedBy = m.id;
      this.emit('steal', { what: 'juan' });
    }
  }

  escape(m) {
    m.dead = true;
    if (m.carry === 'juan') {
      this.juan.lost = true;
      this.juan.carriedBy = null;
      this.emit('escape', { what: 'juan' });
      this.lose('Se llevaron al capibara Juan');
    } else if (m.carry === 'loko') {
      this.emit('escape', { what: 'loko' });
    }
  }

  explode(m) {
    m.dead = true;
    const w = this.world;
    const cx = centerX(m);
    const cy = centerY(m);
    this.emit('explode', { x: cx, y: cy });
    for (let y = Math.floor(cy - BLAST); y <= Math.ceil(cy + BLAST); y++) {
      for (let x = Math.floor(cx - BLAST); x <= Math.ceil(cx + BLAST); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > BLAST - Math.random() * 0.6) continue;
        const id = w.get(x, y);
        if (id === B.AIR || BLOCKS[id].hardness === null) continue;
        this.breakBlock(x, y, Math.random() < 0.25);
      }
    }
    const p = this.player;
    const dp = boxDist(m, p);
    if (dp < BLAST + 1.8) this.hurtPlayer(Math.round(15 * (1 - dp / (BLAST + 2))), Math.sign(centerX(p) - cx) || 1, 'explosión');
    const dc = Math.hypot(this.chest.x + 0.5 - cx, this.chest.y + 0.5 - cy);
    if (dc < BLAST + 0.6 && this.lokos > 0) {
      this.lokos--;
      this.emit('steal', { what: 'boom', left: this.lokos });
    }
    for (const o of this.mobs) {
      if (o === m || o.dead) continue;
      const d = boxDist(o, m);
      if (d < BLAST + 1) this.damageMob(o, 12 * (1 - d / (BLAST + 1.5)), Math.sign(centerX(o) - cx) || 1);
    }
  }

  lineOfSight(a, b) {
    const x0 = centerX(a);
    const y0 = a.y + 0.4;
    const x1 = centerX(b);
    const y1 = b.y + 0.5;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.world.solid(Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t))) return false;
    }
    return true;
  }

  shootArrow(m, target) {
    const x = centerX(m);
    const y = m.y + 0.45;
    const dx = centerX(target) - x;
    const dy = target.y + 0.6 - y;
    const vxAbs = 12;
    const t = Math.max(0.15, Math.abs(dx) / vxAbs);
    const g = 14;
    const vy = dy / t - 0.5 * g * t + (Math.random() - 0.5) * 1.6;
    this.arrows.push({ x, y, vx: Math.sign(dx) * vxAbs, vy, g, stuck: 0, dead: false });
    this.emit('bow', { x });
  }

  updateArrows(dt) {
    const p = this.player;
    for (const a of this.arrows) {
      if (a.stuck) {
        a.stuck += dt;
        if (a.stuck > 1.2) a.dead = true;
        continue;
      }
      a.vy += a.g * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (this.world.solid(Math.floor(a.x), Math.floor(a.y))) {
        a.stuck = 0.001;
        this.emit('arrowHit', { x: a.x });
      } else if (a.x > p.x && a.x < p.x + p.w && a.y > p.y && a.y < p.y + p.h) {
        a.dead = true;
        this.hurtPlayer(3, Math.sign(a.vx), 'flecha');
      } else if (a.y > this.world.h + 2 || a.x < -2 || a.x > this.world.w + 2) a.dead = true;
    }
    this.arrows = this.arrows.filter((a) => !a.dead);
  }

  /* ---------------- Juan y objetos ---------------- */
  updateJuan(dt) {
    const j = this.juan;
    if (j.lost) return;
    if (j.carriedBy) {
      const m = this.mobs.find((o) => o.id === j.carriedBy);
      if (!m) {
        j.carriedBy = null;
        return;
      }
      j.x = centerX(m) - j.w / 2;
      j.y = m.y - j.h + 0.1;
      j.vy = 0;
      j.face = m.face;
      return;
    }
    const scared = this.mobs.some((m) => boxDist(m, j) < 3);
    const dx = j.home - j.x;
    let speed = 0;
    if (Math.abs(dx) > 0.4) speed = Math.sign(dx) * 2.2;
    else if (scared) speed = Math.sin(this.t * 9) * 1.5; // tiembla de miedo
    j.vx = speed;
    if (speed) j.face = Math.sign(speed);
    moveEntity(this.world, j, dt);
    if (j.hitWall && j.onGround) j.vy = -7.5;
    if (Math.abs(j.vx) > 0.1) j.walkT += dt * Math.abs(j.vx);
    j.scared = scared;
  }

  updateDrops(dt) {
    const p = this.player;
    for (const d of this.drops) {
      d.t += dt;
      const dist = Math.hypot(centerX(d) - centerX(p), centerY(d) - centerY(p));
      if (d.t > 0.35 && dist < 2.2) {
        // atracción hacia la jugadora
        const k = 14 * dt;
        d.x += (centerX(p) - centerX(d)) * k;
        d.y += (centerY(p) - centerY(d)) * k;
        if (dist < 0.7) this.collect(d);
      } else {
        moveEntity(this.world, d, dt);
        d.vx *= 0.9;
      }
      if (d.t > 60) d.dead = true;
    }
    this.drops = this.drops.filter((d) => !d.dead);
  }

  collect(d) {
    d.dead = true;
    const p = this.player;
    if (d.kind === 'xp') {
      this.xp++;
      this.emit('xp', { total: this.xp });
    } else if (d.kind === 'loko') {
      this.lokos++;
      this.emit('recover', { left: this.lokos });
    } else if (d.kind === 'coal') {
      this.inv.set(B.TORCH, (this.inv.get(B.TORCH) || 0) + 2);
      this.emit('pickup', { item: B.TORCH, n: 2 });
    } else if (d.kind === 'iron') {
      if (!p.ironSword) {
        p.ironSword = true;
        p.sword = 9;
        this.emit('chat', { key: 'ironSword' });
      } else this.inv.set(B.TORCH, (this.inv.get(B.TORCH) || 0) + 1);
      this.emit('pickup', { item: 'iron' });
    } else {
      this.inv.set(d.id, (this.inv.get(d.id) || 0) + 1);
      this.emit('pickup', { item: d.id, n: 1 });
    }
  }
}
