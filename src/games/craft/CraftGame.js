import './craft.css';
import { B, BLOCKS } from './engine/blocks.js';
import { Renderer } from './engine/render.js';
import { heartIcon } from './engine/textures.js';
import { audio } from './engine/audio.js';
import { Survival, PREP_TIME, WAVES } from './modes/survival.js';
import { BLUEPRINTS, blueprintSize, makeSite, scoreBuild, blueprintCells, paint } from './modes/build.js';
import { centerX, centerY } from './engine/physics.js';
import { sfx } from '../shared/sfx.js';
import { burst } from '../shared/confetti.js';
import {
  maincraIntro,
  maincraIntroButton,
  maincraTips,
  chat,
  survivalWin,
  survivalLose,
  buildIntros,
  buildComments,
  buildFinal,
} from '../../content/maincra.js';

const NAMES = { sofia: 'Laura', juan: 'Juan', zombie: 'Zombi', creeper: 'Creeper' };
const PORTRAIT = { sofia: 'lauraPortrait', juan: 'juanPortrait', zombie: 'zombie0', creeper: 'creeper0' };
const STEP = 1 / 60;

// Captura el dedo sobre el elemento; algunos navegadores lanzan error con punteros ya liberados.
const capture = (el, e) => {
  try {
    el.setPointerCapture(e.pointerId);
  } catch {
    /* sin captura: el gesto sigue funcionando */
  }
};

export function createCraft() {
  let root, ctx, cv, rd, els;
  let stage = 'intro';
  let sim = null;
  let site = null;
  let buildIndex = 0;
  let buildScores = [];
  let selectedBuild = B.PLANKS;
  let showPlan = true;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let resizeObs = null;
  let ended = false;
  let flashLights = [];
  let typeTimer = 0;
  let lastXp = 0;
  let lastHud = 0;
  let wonHandled = false;
  const held = { attack: false, jump: false };
  const touch = { joy: null, world: null };
  const timeouts = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      if (!ended) fn();
    }, ms);
    timeouts.add(id);
  };

  /* ================= DOM ================= */
  function build() {
    root = document.createElement('div');
    root.className = 'mc';
    root.innerHTML = `
      <canvas class="mc-cv"></canvas>
      <div class="mc-flash"></div>
      <div class="mc-shud" hidden>
        <div class="mc-hearts"></div>
        <div class="mc-mid"><span class="mc-wave"></span><button class="mc-ready mc-btn">¡Estoy lista!</button></div>
        <div class="mc-loot"></div>
      </div>
      <div class="mc-bhud" hidden>
        <div class="mc-btitle"><b></b><span class="mc-stars"></span></div>
        <div class="mc-bar"><i></i><span></span></div>
        <div class="mc-bbtns">
          <button class="mc-btn" data-act="plan">👁 Plano</button>
          <button class="mc-btn mc-primary" data-act="finish">✔ Terminar</button>
        </div>
      </div>
      <button class="mc-sound mc-btn" aria-label="Sonido">${sfx.muted ? '🔇' : '🔊'}</button>
      <div class="mc-title"><strong></strong><span></span></div>
      <div class="mc-chat"></div>
      <div class="mc-hotbar"></div>
      <div class="mc-controls" hidden>
        <div class="mc-joy"><i></i></div>
        <div class="mc-actions">
          <button class="mc-act mc-jump" aria-label="Saltar">⤒</button>
          <button class="mc-act mc-attack" aria-label="Atacar">⚔️</button>
        </div>
      </div>
      <div class="mc-dialog" hidden>
        <button class="mc-skip mc-btn">Saltar ⏭</button>
        <div class="mc-stagechar"><canvas></canvas></div>
        <div class="mc-dbox"><b></b><p></p><i class="mc-next">Toca para continuar ▸</i><button class="mc-dok mc-btn mc-primary" hidden></button></div>
      </div>
      <div class="mc-card" hidden><div class="mc-cardbox"></div></div>`;
    const q = (s) => root.querySelector(s);
    cv = q('.mc-cv');
    els = {
      flash: q('.mc-flash'),
      shud: q('.mc-shud'),
      hearts: q('.mc-hearts'),
      wave: q('.mc-wave'),
      ready: q('.mc-ready'),
      loot: q('.mc-loot'),
      bhud: q('.mc-bhud'),
      btitle: q('.mc-btitle b'),
      bstars: q('.mc-stars'),
      bar: q('.mc-bar i'),
      barTxt: q('.mc-bar span'),
      finish: q('[data-act=finish]'),
      plan: q('[data-act=plan]'),
      sound: q('.mc-sound'),
      title: q('.mc-title'),
      chat: q('.mc-chat'),
      hotbar: q('.mc-hotbar'),
      controls: q('.mc-controls'),
      joy: q('.mc-joy'),
      knob: q('.mc-joy i'),
      jump: q('.mc-jump'),
      attack: q('.mc-attack'),
      dialog: q('.mc-dialog'),
      dchar: q('.mc-stagechar'),
      dcanvas: q('.mc-stagechar canvas'),
      dbox: q('.mc-dbox'),
      dname: q('.mc-dbox b'),
      dtext: q('.mc-dbox p'),
      dnext: q('.mc-next'),
      dok: q('.mc-dok'),
      dskip: q('.mc-skip'),
      card: q('.mc-card'),
      cardbox: q('.mc-cardbox'),
    };
    rd = new Renderer(cv);
    // iconos
    els.heartImgs = { full: heartIcon('full').toDataURL(), half: heartIcon('half').toDataURL(), empty: heartIcon('empty').toDataURL() };
    els.lokoImg = rd.sprites.loko.toDataURL();
    els.juanImg = rd.sprites.juan0.toDataURL();
  }

  function iconOf(id) {
    if (id === 'erase') return null;
    return rd.tex[id].toDataURL();
  }

  function fit() {
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (!w || !h) return;
    rd.resize(w, h, viewTiles());
    if (stage === 'build') frameBuild();
  }

  const viewTiles = () => {
    if ((stage === 'build' || stage === 'buildDone') && site) return blueprintSize(BLUEPRINTS[buildIndex]).w + 4;
    return 12;
  };

  /* ================= mensajes ================= */
  function title(big, small = '', ms = 2200) {
    els.title.firstElementChild.textContent = big;
    els.title.lastElementChild.textContent = small;
    els.title.classList.remove('show');
    void els.title.offsetWidth;
    els.title.classList.add('show');
    clearTimeout(els.titleT);
    els.titleT = setTimeout(() => els.title.classList.remove('show'), ms);
  }

  function say(text) {
    const line = document.createElement('p');
    line.textContent = text;
    els.chat.appendChild(line);
    while (els.chat.children.length > 4) els.chat.firstElementChild.remove();
    setTimeout(() => line.classList.add('old'), 6000);
  }

  function flash(color) {
    els.flash.style.background = color;
    els.flash.classList.remove('on');
    void els.flash.offsetWidth;
    els.flash.classList.add('on');
  }

  /* ================= cinemáticas ================= */
  function dialog(lines, finalLabel) {
    return new Promise((resolve) => {
      let i = 0;
      let typing = false;
      const d = els.dialog;
      d.hidden = false;
      const show = () => {
        const l = lines[i];
        const last = i === lines.length - 1;
        d.dataset.who = l.who;
        els.dname.textContent = NAMES[l.who];
        const spr = rd.sprites[l.scene || PORTRAIT[l.who]];
        const cvs = els.dcanvas;
        cvs.width = spr.width;
        cvs.height = spr.height;
        const g = cvs.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(spr, 0, 0);
        // escala entera que quepa en el escenario
        const zoom = Math.max(2, Math.floor(Math.min(230 / spr.height, 300 / spr.width)));
        cvs.style.width = `${spr.width * zoom}px`;
        cvs.style.height = `${spr.height * zoom}px`;
        els.dchar.classList.remove('in');
        void els.dchar.offsetWidth;
        els.dchar.classList.add('in');
        els.dnext.hidden = true;
        els.dok.hidden = true;
        els.dtext.textContent = '';
        typing = true;
        let k = 0;
        clearInterval(typeTimer);
        const done = () => {
          clearInterval(typeTimer);
          typing = false;
          els.dtext.textContent = l.text;
          if (last) {
            els.dok.textContent = finalLabel;
            els.dok.hidden = false;
          } else els.dnext.hidden = false;
        };
        typeTimer = setInterval(() => {
          els.dtext.textContent = l.text.slice(0, ++k);
          if (k % 2 === 0) audio.dig('grass', 0.25);
          if (k >= l.text.length) done();
        }, 22);
        d._done = done;
      };
      const onTap = (e) => {
        if (e.target.closest('.mc-dok, .mc-skip')) return;
        audio.unlock();
        if (typing) return d._done();
        if (i < lines.length - 1) {
          i++;
          show();
        }
      };
      const finish = () => {
        clearInterval(typeTimer);
        d.removeEventListener('pointerdown', onTap);
        els.dok.onclick = null;
        els.dskip.onclick = null;
        d.hidden = true;
        audio.unlock();
        resolve();
      };
      d.addEventListener('pointerdown', onTap);
      els.dok.onclick = finish;
      els.dskip.onclick = finish;
      show();
    });
  }

  function card({ icon, heading, body, buttons }) {
    return new Promise((resolve) => {
      els.cardbox.innerHTML = `
        <div class="mc-cardicon">${icon || ''}</div>
        <h3>${heading}</h3>
        <div class="mc-cardbody">${body}</div>
        <div class="mc-cardbtns">${buttons.map((b, i) => `<button class="mc-btn ${b.primary ? 'mc-primary' : ''}" data-i="${i}">${b.label}</button>`).join('')}</div>`;
      els.card.hidden = false;
      els.card.classList.remove('in');
      void els.card.offsetWidth;
      els.card.classList.add('in');
      els.cardbox.querySelectorAll('[data-i]').forEach((b) =>
        b.addEventListener('click', () => {
          audio.unlock();
          els.card.hidden = true;
          resolve(Number(b.dataset.i));
        }),
      );
    });
  }

  /* ================= SUPERVIVENCIA ================= */
  function startSurvival() {
    stage = 'survival';
    wonHandled = false;
    sim = new Survival(Math.floor(Math.random() * 1e9));
    rd.particles = [];
    rd.setWorld(sim.world);
    fit();
    rd.follow(centerX(sim.player), centerY(sim.player), 0, true, 0.42);
    els.shud.hidden = false;
    els.bhud.hidden = true;
    els.controls.hidden = false;
    els.ready.hidden = false;
    els.chat.innerHTML = '';
    renderHotbar();
    refreshHud();
    title('Atardecer', 'Prepara tus defensas', 2600);
    say(chat.prep);
    maincraTips.forEach((t, i) => later(() => stage === 'survival' && say(t), 1200 + i * 2600));
    audio.music(true);
  }

  function renderHotbar() {
    if (stage === 'survival') {
      const items = [...sim.inv.entries()].filter(([, n]) => n > 0);
      if (!items.some(([id]) => id === sim.selected) && items.length) sim.selected = items[0][0];
      els.hotbar.innerHTML = items
        .map(
          ([id, n]) =>
            `<button class="mc-slot ${id === sim.selected ? 'sel' : ''}" data-id="${id}" title="${BLOCKS[id].name}"><img src="${iconOf(id)}" alt=""><em>${n}</em></button>`,
        )
        .join('');
    } else if (stage === 'build') {
      const bp = BLUEPRINTS[buildIndex];
      els.hotbar.innerHTML =
        bp.palette
          .map((id) => `<button class="mc-slot ${id === selectedBuild ? 'sel' : ''}" data-id="${id}" title="${BLOCKS[id].name}"><img src="${iconOf(id)}" alt=""><span>${BLOCKS[id].name}</span></button>`)
          .join('') + `<button class="mc-slot mc-erase ${selectedBuild === 'erase' ? 'sel' : ''}" data-id="erase"><b>⛏️</b><span>Quitar</span></button>`;
    } else els.hotbar.innerHTML = '';
  }

  function refreshHud() {
    if (!sim) return;
    const p = sim.player;
    const hp = Math.ceil(p.hp);
    let h = '';
    for (let i = 0; i < 10; i++) {
      const v = hp - i * 2;
      h += `<img src="${els.heartImgs[v >= 2 ? 'full' : v === 1 ? 'half' : 'empty']}" alt="">`;
    }
    els.hearts.innerHTML = h;
    let loot = '';
    for (let i = 0; i < 5; i++) loot += `<img class="${i < sim.lokos ? '' : 'gone'}" src="${els.lokoImg}" alt="">`;
    loot += `<img class="juan ${sim.juan.lost ? 'gone' : sim.juan.carriedBy ? 'danger' : ''}" src="${els.juanImg}" alt="Juan">`;
    els.loot.innerHTML = loot;
    if (sim.phase === 'prep') {
      els.wave.textContent = `☀️ ${Math.ceil(PREP_TIME - sim.phaseT)} s`;
      els.ready.hidden = false;
    } else {
      els.ready.hidden = true;
      els.wave.textContent = sim.phase === 'dawn' || sim.result === 'won' ? '☀️ Amanecer' : `🌙 Oleada ${sim.wave}/${WAVES.length}`;
    }
  }

  function handleEvents() {
    for (const e of sim.events) {
      switch (e.type) {
        case 'wave':
          title(e.n === e.total ? '¡Luna llena!' : `Noche · Oleada ${e.n}`, `${e.n}/${e.total}`, 2400);
          say(chat.wave(e.n, e.total));
          audio.wave();
          break;
        case 'step':
          audio.step(BLOCKS[e.block]?.sound);
          break;
        case 'jump':
          audio.jump();
          break;
        case 'dig':
          audio.dig(BLOCKS[e.block].sound, e.mob ? 0.5 : 1);
          rd.burst(e.x, e.y, 'dig', { id: e.block });
          break;
        case 'break':
          audio.break(BLOCKS[e.block].sound);
          rd.burst(e.x, e.y, 'block', { id: e.block });
          break;
        case 'place':
          audio.place(BLOCKS[e.block].sound);
          renderHotbar();
          break;
        case 'swing':
          audio.swing();
          break;
        case 'hit':
          audio.hit(e.crit);
          audio.mobHurt(e.mob);
          if (e.crit) rd.burst(e.x, e.y, 'crit');
          rd.shake = Math.max(rd.shake, 2);
          break;
        case 'hurt':
          audio.hurt();
          flash('rgba(255,0,0,0.35)');
          rd.shake = Math.max(rd.shake, 5);
          break;
        case 'death':
          audio.death();
          rd.burst(e.x, e.y, 'smoke');
          break;
        case 'groan': {
          const vis = e.x > rd.cam.x - 4 && e.x < rd.cam.x + rd.viewW + 4;
          if (vis) audio.groan(e.mob);
          break;
        }
        case 'fuse':
          audio.fuse();
          break;
        case 'explode':
          audio.explode();
          rd.burst(e.x, e.y, 'explosion');
          rd.shake = 16;
          flash('rgba(255,255,255,0.6)');
          flashLights.push({ l: [e.x, e.y, 10, 1], t: 0.25 });
          break;
        case 'bow':
          audio.bow();
          break;
        case 'arrowHit':
          audio.arrowHit();
          break;
        case 'steal':
          audio.steal();
          if (e.what === 'loko') say(chat.stealLoko(e.left));
          else if (e.what === 'boom') say(chat.stealBoom(e.left));
          else {
            say(chat.stealJuan);
            title('¡Se llevan a Juan!', 'Rescátalo 🦫', 2200);
          }
          break;
        case 'escape':
          if (e.what === 'loko') say(chat.escapeLoko);
          break;
        case 'recover':
          audio.recover();
          say(chat.recover(e.left));
          break;
        case 'pickup':
          audio.pickup();
          renderHotbar();
          break;
        case 'xp': {
          const now = performance.now();
          if (now - lastXp > 50) audio.xp();
          lastXp = now;
          break;
        }
        case 'chat':
          if (chat[e.key]) say(chat[e.key]);
          if (e.key === 'ironSword') audio.levelUp();
          if (e.key === 'juanSaved') rd.burst(sim.juan.x + 0.4, sim.juan.y, 'heart');
          break;
        case 'burn':
          rd.burst(e.x, e.y, 'fire');
          break;
        case 'dawn':
          title('¡Amaneció!', 'Sobreviviste a la noche ☀️', 3000);
          say(chat.dawn);
          audio.dawn();
          break;
        case 'won':
          onSurvivalWon();
          break;
        case 'lost':
          onSurvivalLost(e.reason);
          break;
        default:
      }
    }
    sim.events.length = 0;
  }

  async function onSurvivalWon() {
    if (wonHandled) return;
    wonHandled = true;
    stage = 'survivalDone';
    audio.levelUp();
    const stop = burst(root);
    later(stop, 3500);
    await card({
      icon: '🌅',
      heading: survivalWin.title,
      body: `<p>${survivalWin.line(sim.lokos, sim.kills)}</p>`,
      buttons: [{ label: survivalWin.button, primary: true }],
    });
    startBuild(0);
  }

  async function onSurvivalLost(reason) {
    stage = 'survivalDone';
    audio.music(false);
    await new Promise((r) => later(r, 1100));
    await card({
      icon: '💀',
      heading: survivalLose.title,
      body: `<p>${reason}</p>`,
      buttons: [{ label: survivalLose.button, primary: true }],
    });
    startSurvival();
  }

  function survivalScene() {
    const p = sim.player;
    const frame = (e) => (e.onGround && Math.abs(e.vx) > 0.1 ? 1 + (Math.floor(e.walkT * 2.4) % 2) : 0);
    const entities = [];
    const j = sim.juan;
    if (!j.lost) entities.push({ name: `juan${frame(j)}`, x: j.x, y: j.y, w: j.w, h: j.h, face: j.face, bob: j.scared ? Math.round(Math.sin(rd.time * 40)) : 0 });
    for (const m of sim.mobs) {
      let name = `${m.type}${frame(m)}`;
      let scale = 1;
      if (m.type === 'creeper' && m.fuse > 0) {
        if (Math.floor(m.fuse * 8) % 2) name = 'creeperFlash';
        scale = 1 + m.fuse * 0.08;
      }
      entities.push({
        name, x: m.x, y: m.y, w: m.w, h: m.h, face: m.face, scale,
        mode: m.hurtT > 0 ? 'hurt' : null,
        carry: m.carry === 'loko' ? 'loko' : null,
        hpBar: m.hp / m.maxHp,
      });
    }
    for (const d of sim.drops) {
      let img;
      if (d.kind === 'xp') img = rd.sprites.xp;
      else if (d.kind === 'loko') img = rd.sprites.loko;
      else img = rd.tex[d.kind === 'coal' ? B.COAL : d.kind === 'iron' ? B.IRON : d.id];
      entities.push({ img, x: d.x, y: d.y, w: d.w, h: d.h, face: 1, scale: d.kind === 'xp' || d.kind === 'loko' ? 1 : 0.45, bob: Math.round(Math.sin(rd.time * 5 + d.x) * 1.5) });
    }
    const tool = sim.mining ? 'pick' : p.ironSword ? 'iron' : 'sword';
    entities.push({
      name: p.swingT > 0 ? `sofiaSwing_${tool}` : `sofia${frame(p)}`,
      x: p.x, y: p.y, w: p.w, h: p.h, face: p.face,
      mode: p.hurtT > 0 ? 'hurt' : null,
      alpha: p.invuln > 0 && Math.floor(rd.time * 20) % 2 ? 0.6 : 1,
    });
    const cracks = [];
    if (sim.mining) cracks.push(sim.mining);
    for (const m of sim.mobs) if (m.breakProgress) cracks.push(m.breakProgress);
    const lights = [[centerX(p), p.y + 0.6, 4.5, 0.55], ...flashLights.map((f) => f.l)];
    return {
      daylight: sim.daylight,
      entities,
      arrows: sim.arrows,
      cracks,
      lights,
      target: touch.world && touch.world.mode === 'mine' ? touch.world.tile : null,
    };
  }

  /* ================= CONSTRUCCIÓN ================= */
  async function startBuild(i) {
    stage = 'buildIntro';
    buildIndex = i;
    const bp = BLUEPRINTS[i];
    site = makeSite(bp, 11 + i);
    rd.particles = [];
    rd.setWorld(site.world);
    els.shud.hidden = true;
    els.controls.hidden = true;
    els.hotbar.innerHTML = '';
    els.chat.innerHTML = '';
    selectedBuild = bp.palette[0];
    showPlan = true;
    stage = 'build';
    fit();
    stage = 'buildIntro';
    audio.music(true);
    await dialog(buildIntros[bp.id], `¡A construir! (${i + 1}/3)`);
    stage = 'build';
    els.bhud.hidden = false;
    els.btitle.textContent = `${i + 1}/3 · ${bp.title}`;
    renderHotbar();
    refreshBuildHud();
    title(bp.title, 'Toca o arrastra para poner bloques', 2600);
  }

  function frameBuild() {
    if (!site) return;
    const bp = BLUEPRINTS[buildIndex];
    const { w, h } = blueprintSize(bp);
    rd.frameArea(site.ox - 1, site.oy - 1, w + 2, h + 3);
    // compensa el espacio que ocupan las barras de arriba y abajo
    const tileCss = rd.cssW / rd.viewW;
    rd.cam.y += (150 - 120) / 2 / tileCss;
  }

  function refreshBuildHud() {
    const bp = BLUEPRINTS[buildIndex];
    const s = scoreBuild(site, bp);
    els.bar.style.width = `${Math.round(s.progress * 100)}%`;
    els.barTxt.textContent = `${s.correct}/${s.need} bloques${s.wrong ? ` · ${s.wrong} mal` : ''}`;
    els.bstars.textContent = '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars);
    els.finish.disabled = s.stars === 0;
    els.plan.classList.toggle('off', !showPlan);
    return s;
  }

  function paintAt(tx, ty) {
    const id = selectedBuild === 'erase' ? null : selectedBuild;
    const before = site.world.get(tx, ty);
    if (!paint(site, tx, ty, id)) return false;
    if (id === null) {
      audio.break(BLOCKS[before].sound);
      rd.burst(tx, ty, 'block', { id: before });
    } else {
      audio.place(BLOCKS[id].sound);
      const want = blueprintCells(BLUEPRINTS[buildIndex], site.ox, site.oy).find((c) => c.x === tx && c.y === ty);
      if (want && want.id === id) rd.burst(tx, ty, 'sparkle');
    }
    return true;
  }

  async function finishBuild() {
    const bp = BLUEPRINTS[buildIndex];
    const s = scoreBuild(site, bp);
    if (s.stars === 0) return;
    stage = 'buildDone';
    buildScores[buildIndex] = s;
    els.bhud.hidden = true;
    els.hotbar.innerHTML = '';
    showPlan = false;
    audio.levelUp();
    const starsHtml = [0, 1, 2].map((k) => `<span class="mc-star ${k < s.stars ? 'on' : ''}" style="--d:${k * 0.35}s">★</span>`).join('');
    for (let k = 0; k < s.stars; k++) later(() => audio.star(k), 350 + k * 350);
    if (s.stars === 3) {
      const stop = burst(root);
      later(stop, 3000);
    }
    const lastOne = buildIndex === BLUEPRINTS.length - 1;
    await card({
      icon: '🏗️',
      heading: bp.title,
      body: `<div class="mc-starrow">${starsHtml}</div><p class="mc-score">${s.score} pts · ${Math.round(s.accuracy * 100)}% de parecido</p><p>${buildComments[s.stars]}</p>`,
      buttons: [{ label: lastOne ? 'Ver resultado final' : 'Siguiente construcción ▶', primary: true }],
    });
    if (!lastOne) return startBuild(buildIndex + 1);
    finalCard();
  }

  async function finalCard() {
    stage = 'final';
    const total = buildScores.reduce((a, s) => a + s.score, 0);
    const stars = buildScores.reduce((a, s) => a + s.stars, 0);
    audio.dawn();
    const stop = burst(root);
    later(stop, 4000);
    await card({
      icon: '🏆',
      heading: buildFinal.title,
      body: `<p>${buildFinal.line(total, stars)}</p>`,
      buttons: [{ label: buildFinal.button, primary: true }],
    });
    audio.music(false);
    ctx.win();
  }

  function buildScene() {
    const bp = BLUEPRINTS[buildIndex];
    const standY = site.standRow;
    const sx = site.ox - 1.4;
    return {
      daylight: 0,
      ghost: { show: showPlan && stage === 'build', cells: blueprintCells(bp, site.ox, site.oy) },
      entities: [
        { name: 'sofia0', x: sx, y: standY - 1.8, w: 0.6, h: 1.8, face: 1 },
        { name: `juan${Math.floor(rd.time * 2) % 3 === 0 ? 1 : 0}`, x: site.ox + blueprintSize(bp).w + 0.4, y: standY - 0.7, w: 0.9, h: 0.7, face: -1 },
      ],
    };
  }

  /* ================= entrada ================= */
  function bindInput() {
    // Joystick
    const joyMove = (e) => {
      const r = els.joy.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const max = r.width / 2;
      const k = Math.min(1, Math.hypot(dx, dy) / max);
      const ang = Math.atan2(dy, dx);
      els.knob.style.transform = `translate(${Math.cos(ang) * k * max * 0.6}px, ${Math.sin(ang) * k * max * 0.6}px)`;
      const mx = dx / (max * 0.75);
      touch.move = Math.abs(dx) < 10 ? 0 : Math.max(-1, Math.min(1, mx));
      touch.joyJump = dy < -max * 0.55;
    };
    els.joy.addEventListener('pointerdown', (e) => {
      audio.unlock();
      touch.joy = e.pointerId;
      capture(els.joy, e);
      joyMove(e);
    });
    els.joy.addEventListener('pointermove', (e) => touch.joy === e.pointerId && joyMove(e));
    const joyEnd = () => {
      touch.joy = null;
      touch.move = 0;
      touch.joyJump = false;
      els.knob.style.transform = '';
    };
    els.joy.addEventListener('pointerup', joyEnd);
    els.joy.addEventListener('pointercancel', joyEnd);

    const hold = (el, key) => {
      el.addEventListener('pointerdown', (e) => {
        audio.unlock();
        capture(el, e);
        held[key] = true;
        if (key === 'attack' && sim) sim.input.attack = true;
      });
      for (const ev of ['pointerup', 'pointercancel']) el.addEventListener(ev, () => (held[key] = false));
    };
    hold(els.jump, 'jump');
    hold(els.attack, 'attack');

    els.ready.addEventListener('click', () => {
      sim?.startNight();
      audio.unlock();
    });

    els.sound.addEventListener('click', () => {
      sfx.setMuted(!sfx.muted);
      els.sound.textContent = sfx.muted ? '🔇' : '🔊';
      audio.unlock();
    });

    els.hotbar.addEventListener('click', (e) => {
      const b = e.target.closest('.mc-slot');
      if (!b) return;
      const id = b.dataset.id === 'erase' ? 'erase' : Number(b.dataset.id);
      if (stage === 'survival') sim.selected = id;
      else selectedBuild = id;
      audio.pickup();
      renderHotbar();
    });

    els.plan.addEventListener('click', () => {
      showPlan = !showPlan;
      refreshBuildHud();
    });
    els.finish.addEventListener('click', finishBuild);

    // Mundo: picar / poner / atacar (supervivencia) o pintar (construcción)
    cv.addEventListener('pointerdown', (e) => {
      audio.unlock();
      capture(cv, e);
      const t = rd.toTile(e.clientX, e.clientY);
      if (stage === 'build') {
        touch.world = { id: e.pointerId, last: t };
        if (paintAt(t.tx, t.ty)) refreshBuildHud();
        return;
      }
      if (stage !== 'survival') return;
      const mob = sim.mobs.find((m) => t.fx > m.x - 0.4 && t.fx < m.x + m.w + 0.4 && t.fy > m.y - 0.3 && t.fy < m.y + m.h + 0.2);
      if (mob) {
        sim.player.face = Math.sign(centerX(mob) - centerX(sim.player)) || sim.player.face;
        sim.input.attack = true;
        return;
      }
      const id = sim.world.get(t.tx, t.ty);
      const breakable = id !== B.AIR && BLOCKS[id].hardness !== null;
      touch.world = { id: e.pointerId, tile: t, mode: breakable ? 'mine' : 'place', t0: performance.now(), x0: e.clientX, y0: e.clientY };
      if (breakable) sim.input.mine = { tx: t.tx, ty: t.ty };
    });
    cv.addEventListener('pointermove', (e) => {
      if (!touch.world || touch.world.id !== e.pointerId) return;
      const t = rd.toTile(e.clientX, e.clientY);
      if (stage === 'build') {
        // pinta todas las celdas entre el punto anterior y el actual
        const a = touch.world.last;
        const n = Math.max(Math.abs(t.tx - a.tx), Math.abs(t.ty - a.ty));
        let changed = false;
        for (let k = 1; k <= n; k++) {
          changed = paintAt(Math.round(a.tx + ((t.tx - a.tx) * k) / n), Math.round(a.ty + ((t.ty - a.ty) * k) / n)) || changed;
        }
        touch.world.last = t;
        if (changed) refreshBuildHud();
        return;
      }
      if (touch.world.mode === 'mine') {
        touch.world.tile = t;
        const id = sim.world.get(t.tx, t.ty);
        sim.input.mine = id !== B.AIR && BLOCKS[id].hardness !== null ? { tx: t.tx, ty: t.ty } : null;
      }
    });
    const worldUp = (e) => {
      const w = touch.world;
      if (!w || w.id !== e.pointerId) return;
      touch.world = null;
      if (stage !== 'survival') return;
      sim.input.mine = null;
      if (w.mode === 'place' && performance.now() - w.t0 < 400 && Math.hypot(e.clientX - w.x0, e.clientY - w.y0) < 14) {
        sim.input.place = { tx: w.tile.tx, ty: w.tile.ty };
      }
    };
    cv.addEventListener('pointerup', worldUp);
    cv.addEventListener('pointercancel', worldUp);
  }

  /* ================= bucle ================= */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    tick(now);
  }

  function tick(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0));
    last = now;
    flashLights = flashLights.filter((f) => (f.t -= dt) > 0);
    if (root.dataset.stage !== stage) root.dataset.stage = stage;

    if (stage === 'survival' || (stage === 'survivalDone' && sim)) {
      if (stage === 'survival') {
        sim.input.move = touch.move || 0;
        sim.input.jump = held.jump || touch.joyJump;
        if (held.attack) sim.input.attack = true;
        acc += dt;
        while (acc >= STEP) {
          sim.update(STEP);
          acc -= STEP;
        }
        handleEvents();
        if (now - lastHud > 200) {
          lastHud = now;
          refreshHud();
        }
      }
      rd.follow(centerX(sim.player), centerY(sim.player), dt, false, 0.42);
      rd.frame(survivalScene(), dt);
    } else if (site && (stage === 'build' || stage === 'buildDone' || stage === 'buildIntro' || stage === 'final')) {
      rd.frame(buildScene(), dt);
    } else if (sim) {
      rd.frame(survivalScene(), dt);
    }
  }

  return {
    async mount(container, context) {
      ctx = context;
      build();
      container.appendChild(root);
      bindInput();
      // Escenario de fondo durante la intro: el mundo de la noche, todavía de día
      sim = new Survival(Math.floor(Math.random() * 1e9));
      rd.setWorld(sim.world);
      fit();
      rd.follow(centerX(sim.player), centerY(sim.player), 0, true, 0.42);
      resizeObs = new ResizeObserver(fit);
      resizeObs.observe(root);
      if (location.search.includes('debug')) {
        // Solo pruebas: avanzar el juego a mano aunque el navegador no anime
        let fake = performance.now();
        const advance = (sec) => {
          fake = Math.max(fake, last, performance.now());
          for (let k = 0; k < sec * 60; k++) tick((fake += 1000 / 60));
          last = fake;
        };
        window.__maincra = { get sim() { return sim; }, get site() { return site; }, get stage() { return stage; }, get rd() { return rd; }, startBuild, finishBuild, startSurvival, advance, touch, held };
      }
      last = performance.now();
      raf = requestAnimationFrame(frame);
      stage = 'intro';
      await dialog(maincraIntro, maincraIntroButton);
      if (!ended) startSurvival();
    },
    destroy() {
      ended = true;
      cancelAnimationFrame(raf);
      clearInterval(typeTimer);
      clearTimeout(els?.titleT);
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      resizeObs?.disconnect();
      audio.music(false);
      root?.remove();
    },
  };
}
