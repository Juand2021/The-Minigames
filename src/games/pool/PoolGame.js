import './pool.css';
import { Match } from './match.js';
import { step, isMoving, castRay, canPlaceCue, SUBSTEP, VMAX, R, W, H, RAIL, LW, LH } from './physics.js';
import { chooseShot, choosePlacement } from './ai.js';
import { makeBallSet, makeBallShadow, makeTable, drawVillain, drawPlayer } from './sprites.js';
import { poolLines, poolIntro } from '../../content/story.js';
import { sfx } from '../shared/sfx.js';
import { burst } from '../shared/confetti.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MIN_DRAG = 12; // arrastres muy cerca de la blanca se ignoran

export function createPool() {
  let root, ctx, cv, g, mainEl, bubbleEl, bannerEl, powerEl, fireBtn, fineL, fineR, villEl, heroEl, hintEl;
  let powerBox, thumbEl, powerLabel, introEl;
  let introStep = 0;
  let introTyping = false;
  let introTimer = 0;
  let draggingPower = false;
  let lastPct = -1;
  let trayEls = {};
  let match;
  let tableImg, shadowImg, sprites;
  let phase = 'intro';
  let aim = { angle: -Math.PI / 2, power: 0.6 };
  let strike = null;
  let aiAim = null;
  let particles = [];
  let raf = 0;
  let last = 0;
  let acc = 0;
  let scale = 1;
  let pulse = 0;
  let dragging = false;
  let stopConfetti = null;
  let resizeObs = null;
  let urgentObs = null;
  let typeTimer = 0;
  let lastClick = 0;
  let fineTimer = 0;
  let ended = false;
  const timeouts = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
  };

  /* ---------- DOM ---------- */
  function build() {
    match = new Match();
    sprites = makeBallSet();
    shadowImg = makeBallShadow();
    tableImg = makeTable();

    root = document.createElement('div');
    root.className = 'pool';
    root.innerHTML = `
      <div class="pl-top">
        <canvas class="pl-vill" aria-label="El Quiz de Fenómenos de Transporte"></canvas>
        <div class="pl-bubble"><b>Quiz de F. de Transporte</b><p></p></div>
        <canvas class="pl-hero" aria-label="Sofía"></canvas>
      </div>
      <div class="pl-trays">
        <div class="tray" data-who="V"><span class="tray-name">😈 Quiz</span><div class="slots"></div></div>
        <div class="tray" data-who="P"><span class="tray-name">💜 Tú</span><div class="slots"></div></div>
      </div>
      <div class="pl-main">
        <canvas class="pl-canvas" width="${LW}" height="${LH}"></canvas>
        <div class="pl-banner"><strong></strong><span></span></div>
      </div>
      <div class="pl-controls">
        <div class="pl-power" aria-label="Potencia"><i></i><em class="pl-thumb"></em><span>POTENCIA</span></div>
        <div class="pl-row">
          <button class="fine" data-fine="-1" aria-label="Girar a la izquierda">◀</button>
          <button class="pl-fire" data-act="fire">¡TIRAR!</button>
          <button class="fine" data-fine="1" aria-label="Girar a la derecha">▶</button>
        </div>
      </div>
      <p class="pl-hint"></p>
      <div class="pl-intro">
        <button class="pi-skip">Saltar ⏭</button>
        <div class="pi-char pi-vill"><canvas></canvas></div>
        <div class="pi-bubble" data-speaker="V">
          <b></b><p></p>
          <i class="pi-next">Toca para continuar ▸</i>
          <button class="pi-ready" hidden>¡Estoy lista para jugar! 🎱</button>
        </div>
        <div class="pi-char pi-hero"><canvas></canvas></div>
      </div>`;

    cv = root.querySelector('.pl-canvas');
    g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    mainEl = root.querySelector('.pl-main');
    bubbleEl = root.querySelector('.pl-bubble p');
    bannerEl = root.querySelector('.pl-banner');
    powerBox = root.querySelector('.pl-power');
    powerEl = powerBox.querySelector('i');
    thumbEl = powerBox.querySelector('.pl-thumb');
    powerLabel = powerBox.querySelector('span');
    fireBtn = root.querySelector('.pl-fire');
    [fineL, fineR] = root.querySelectorAll('.fine');
    hintEl = root.querySelector('.pl-hint');
    villEl = root.querySelector('.pl-vill');
    heroEl = root.querySelector('.pl-hero');
    introEl = root.querySelector('.pl-intro');
    drawVillain(villEl);
    drawPlayer(heroEl);
    drawVillain(introEl.querySelector('.pi-vill canvas'));
    drawPlayer(introEl.querySelector('.pi-hero canvas'));
    villEl.style.visibility = 'hidden';
    heroEl.style.visibility = 'hidden';
    root.querySelectorAll('.tray').forEach((t) => (trayEls[t.dataset.who] = t.querySelector('.slots')));
    refreshTrays();
  }

  function fitCanvas() {
    const w = mainEl.clientWidth;
    const h = mainEl.clientHeight;
    scale = Math.max(0.5, Math.min(w / LW, h / LH));
    cv.style.width = `${Math.floor(LW * scale)}px`;
    cv.style.height = `${Math.floor(LH * scale)}px`;
  }

  /* ---------- mensajes ---------- */
  function say(text) {
    clearInterval(typeTimer);
    bubbleEl.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      bubbleEl.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typeTimer);
    }, 20);
  }

  function banner(title, sub = '', ms = 1700, tone = '') {
    bannerEl.className = `pl-banner ${tone}`;
    bannerEl.firstElementChild.textContent = title;
    bannerEl.lastElementChild.textContent = sub;
    void bannerEl.offsetWidth;
    bannerEl.classList.add('show');
    later(() => bannerEl.classList.remove('show'), ms);
  }

  function react(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  function refreshTrays() {
    const set = match.pocketedSet();
    for (const who of ['P', 'V']) {
      const grp = match.assign[who];
      const box = trayEls[who];
      if (!grp) {
        box.innerHTML = '<em class="open">Mesa abierta</em>';
        continue;
      }
      const ids = grp === 'solid' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
      ids.push(8);
      box.innerHTML = ids
        .map((id) => `<img class="slot${set.has(id) ? ' out' : ''}${id === 8 ? ' eight' : ''}" src="${sprites[id].toDataURL()}" alt="">`)
        .join('');
    }
  }

  /* ---------- controles ---------- */
  function setControls() {
    const human = match.turn === 'P' && !match.winner && !ended;
    const aimOk = human && phase === 'aim';
    const placing = human && phase === 'place';
    fireBtn.disabled = !(aimOk || placing);
    fireBtn.textContent = placing ? 'LISTO ✔' : '¡TIRAR!';
    fineL.disabled = fineR.disabled = !aimOk;
    powerBox.classList.toggle('off', !aimOk);
    hintEl.textContent = placing
      ? 'Toca o arrastra en la mesa para colocar la blanca'
      : aimOk
        ? 'Arrastra en la mesa para apuntar · desliza la barra para la potencia'
        : phase === 'roll' || phase === 'strike' || phase === 'intro' || match.winner
          ? ''
          : 'Turno del Quiz…';
  }

  function defaultAim() {
    const cue = match.cue;
    let tgt;
    if (match.isBreak) tgt = match.balls.filter((b) => b.id !== 0 && !b.pocketed).sort((a, b) => a.y - b.y)[0];
    else {
      const ids = match.targets();
      tgt = match.balls
        .filter((b) => !b.pocketed && ids.includes(b.id))
        .sort((a, b) => Math.hypot(a.x - cue.x, a.y - cue.y) - Math.hypot(b.x - cue.x, b.y - cue.y))[0];
    }
    if (tgt) aim.angle = Math.atan2(tgt.y - cue.y, tgt.x - cue.x);
    aim.power = match.isBreak ? 0.9 : 0.55;
  }

  /* ---------- turnos ---------- */
  function startTurn() {
    if (match.winner) return;
    if (match.turn === 'P') {
      if (match.inHand) {
        phase = 'place';
        banner('¡BOLA EN MANO!', 'Coloca la blanca donde quieras', 2200, 'good');
      } else {
        phase = 'aim';
        defaultAim();
      }
      setControls();
    } else {
      phase = 'thinking';
      setControls();
      later(aiPlay, 900);
    }
  }

  function aiPlay() {
    if (ended) return;
    if (match.inHand) {
      const p = choosePlacement(match.balls, match.targets());
      match.cue.x = p.x;
      match.cue.y = p.y;
      match.inHand = false;
      sfx.tap();
    }
    const s = chooseShot(match.balls, match.targets(), { breakShot: match.isBreak });
    const cue = match.cue;
    const startAngle = Math.atan2(H / 2 - cue.y, W / 2 - cue.x);
    aiAim = { from: { angle: startAngle, power: 0.2 }, to: s, t: 0 };
    aim = { angle: startAngle, power: 0.2 };
    phase = 'ai-aim';
    setControls();
  }

  function fire(angle, power) {
    strike = { angle, power, t: 0 };
    phase = 'strike';
    setControls();
  }

  function launch() {
    match.beginShot();
    const rep = match.report;
    rep.onHit = (vn) => {
      const now = performance.now();
      if (now - lastClick > 35) {
        sfx.click(vn);
        lastClick = now;
      }
    };
    rep.onCushion = (v) => sfx.cushion(v);
    rep.onPocket = (b, p) => {
      sfx.pocket();
      spawnSparks(p.x, p.y, b.id);
    };
    const c = match.cue;
    c.vx = Math.cos(strike.angle) * VMAX * strike.power;
    c.vy = Math.sin(strike.angle) * VMAX * strike.power;
    sfx.shot(strike.power);
    strike = null;
    phase = 'roll';
    acc = 0;
  }

  function spawnSparks(px, py, id) {
    const col = id === 0 ? '#ffffff' : id === 8 ? '#aaaaaa' : '#ffd166';
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 20 + Math.random() * 50;
      particles.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, col });
    }
  }

  function finishShot() {
    const who = match.turn;
    const out = match.endShot();
    refreshTrays();
    const mine = who === 'P';

    if (out.assignedTo) {
      if (mine) {
        banner(out.assignedTo === 'solid' ? 'LISAS (1-7)' : 'RAYADAS (9-15)', 'Esas son tus bolas', 2400, 'good');
        say(poolLines.assigned[out.assignedTo]);
      } else say(poolLines.vAssigned);
    }

    if (out.gameOver) return endGame(out);

    if (out.foul) {
      banner('¡FALTA!', out.foul, 2300, 'bad');
      if (!out.assignedTo) say(pick(mine ? poolLines.pFoul : poolLines.vFoul));
    } else if (!out.assignedTo) {
      const good = out.continueTurn;
      if (mine) {
        if (out.pocketed.length && !good) say(pick(poolLines.pPocket));
        else if (good) say(pick(poolLines.continueP));
        else say(pick(poolLines.pMiss));
      } else {
        say(pick(out.pocketed.length && good ? poolLines.vPocket : poolLines.vMiss));
      }
    }
    if (mine && out.pocketed.some((i) => i !== 0)) react(villEl, 'hurt');
    if (!mine && out.pocketed.some((i) => i !== 0)) react(heroEl, 'hurt');

    if (!mine && !out.foul && !out.continueTurn) {
      later(() => {
        if (!ended && match.turn === 'P' && !match.inHand) say(pick(poolLines.yourTurn));
      }, 2600);
    }
    later(startTurn, out.foul || out.assignedTo ? 1600 : 700);
    phase = 'wait';
    setControls();
  }

  function endGame(out) {
    ended = true;
    phase = 'over';
    setControls();
    const youWin = match.winner === 'P';
    if (youWin) {
      banner('¡GANASTE!', 'Mesa limpia 🎱', 4000, 'good');
      say(poolLines.win);
      react(villEl, 'defeated');
      villEl.classList.add('dead');
      sfx.win();
      stopConfetti = burst(root);
      later(() => ctx.win(), 3200);
    } else {
      const early = out.early && out.shooter === 'P';
      banner(early ? '¡8 PREMATURA!' : '¡PERDISTE!', early ? 'La 8 no era para ahora' : 'El Quiz ganó esta vez', 3500, 'bad');
      say(early ? poolLines.eightEarlyP : out.early ? poolLines.eightEarlyV : poolLines.lose);
      react(villEl, 'laugh');
      villEl.classList.add('laughing');
      sfx.error();
      later(() => ctx.lose(early ? poolLines.eightEarlyLoseReason : poolLines.loseReason), 3200);
    }
  }

  /* ---------- bucle ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    pulse += dt;

    if (phase === 'ai-aim' && aiAim) {
      aiAim.t = Math.min(1, aiAim.t + dt / 0.8);
      const e = 1 - (1 - aiAim.t) ** 3;
      aim.angle = aiAim.from.angle + angleDiff(aiAim.from.angle, aiAim.to.angle) * e;
      aim.power = aiAim.from.power + (aiAim.to.power - aiAim.from.power) * e;
      if (aiAim.t >= 1) {
        const s = aiAim.to;
        aiAim = null;
        later(() => !ended && fire(s.angle, s.power), 250);
        phase = 'ai-hold';
      }
    }

    if (phase === 'strike' && strike) {
      strike.t += dt / 0.14;
      if (strike.t >= 1) launch();
    }

    if (phase === 'roll') {
      acc += dt;
      let n = 0;
      while (acc >= SUBSTEP && n < 40) {
        step(match.balls, SUBSTEP, match.report);
        acc -= SUBSTEP;
        n++;
      }
      let sinking = false;
      for (const b of match.balls) {
        if (b.pocketed && b.sink && b.sink.t < 1) {
          b.sink.t += dt / 0.22;
          sinking = true;
        }
      }
      if (!isMoving(match.balls) && !sinking) finishShot();
    }

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);

    draw();
  }

  const angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

  /* ---------- dibujo ---------- */
  const plot = (x, y, w = 1, h = 1) => g.fillRect(Math.round(x + RAIL), Math.round(y + RAIL), w, h);

  function dotted(x0, y0, x1, y1, color, on = 1, off = 2) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    g.fillStyle = color;
    for (let i = 0; i <= len; i += on + off) {
      const t = len ? i / len : 0;
      plot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  function ring(cx, cy, r, color) {
    g.fillStyle = color;
    const n = Math.ceil(r * 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      plot(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
  }

  function drawGuide() {
    const cue = match.cue;
    const hit = castRay(match.balls, cue, aim.angle);
    const ex = hit.type === 'none' ? cue.x + Math.cos(aim.angle) * 300 : hit.ghost.x;
    const ey = hit.type === 'none' ? cue.y + Math.sin(aim.angle) * 300 : hit.ghost.y;
    dotted(cue.x, cue.y, ex, ey, 'rgba(255,255,255,0.9)');
    if (hit.type === 'ball') {
      ring(hit.ghost.x, hit.ghost.y, R, 'rgba(255,255,255,0.9)');
      const tb = match.balls[hit.id];
      dotted(tb.x, tb.y, tb.x + hit.n.x * 48, tb.y + hit.n.y * 48, 'rgba(255,214,102,0.95)');
      const dx = Math.cos(aim.angle);
      const dy = Math.sin(aim.angle);
      const dot = dx * hit.n.x + dy * hit.n.y;
      let tx = dx - dot * hit.n.x;
      let ty = dy - dot * hit.n.y;
      const tl = Math.hypot(tx, ty);
      if (tl > 0.05) {
        tx /= tl;
        ty /= tl;
        dotted(hit.ghost.x, hit.ghost.y, hit.ghost.x + tx * 26 * tl, hit.ghost.y + ty * 26 * tl, 'rgba(160,220,255,0.9)');
      }
    } else if (hit.type === 'wall') {
      dotted(hit.ghost.x, hit.ghost.y, hit.ghost.x + hit.dir.x * 55, hit.ghost.y + hit.dir.y * 55, 'rgba(255,255,255,0.45)');
    }
  }

  function drawCue(angle, pull) {
    const cue = match.cue;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const gap = R + 2 + pull;
    const L = 64;
    for (let i = 0; i < L; i++) {
      const d = gap + i;
      const x = cue.x - dx * d;
      const y = cue.y - dy * d;
      let col = '#d9a35f';
      let th = 1;
      if (i < 2) col = '#4fa3ff';
      else if (i < 4) col = '#f4f4f4';
      else if (i > L - 16) {
        col = '#5a321b';
        th = 2;
      } else if (i > L - 18) col = '#2a1710';
      g.fillStyle = col;
      plot(x - (th - 1) / 2, y - (th - 1) / 2, th, th);
    }
  }

  function drawBall(b) {
    if (b.pocketed) {
      if (!b.sink || b.sink.t >= 1) return;
      const t = b.sink.t;
      const x = b.sink.x + (b.sink.px - b.sink.x) * t;
      const y = b.sink.y + (b.sink.py - b.sink.y) * t;
      const s = Math.max(2, Math.round(R * 2 * (1 - t * 0.7)));
      g.globalAlpha = 1 - t * 0.6;
      g.drawImage(sprites[b.id], Math.round(x + RAIL - s / 2), Math.round(y + RAIL - s / 2), s, s);
      g.globalAlpha = 1;
      return;
    }
    g.drawImage(shadowImg, Math.round(b.x + RAIL - R), Math.round(b.y + RAIL - R + 1));
    g.drawImage(sprites[b.id], Math.round(b.x + RAIL - R), Math.round(b.y + RAIL - R));
  }

  function draw() {
    const pct = Math.round(aim.power * 100);
    if (pct !== lastPct) {
      lastPct = pct;
      powerEl.style.width = `${pct}%`;
      thumbEl.style.left = `${pct}%`;
      powerLabel.textContent = `POTENCIA ${pct}%`;
    }
    g.clearRect(0, 0, LW, LH);
    g.drawImage(tableImg, 0, 0);
    const human = match.turn === 'P' && !ended;

    if (phase === 'place' && human) {
      const c = match.cue;
      const r = R + 3 + Math.sin(pulse * 6) * 1.2;
      ring(c.x, c.y, r, 'rgba(255,209,102,0.95)');
    }

    for (const b of match.balls) if (b.id !== 0) drawBall(b);
    if (!match.cue.pocketed || match.cue.sink) drawBall(match.cue);

    if (phase === 'aim' && human) {
      drawGuide();
      drawCue(aim.angle, 3 + aim.power * 18);
    } else if (phase === 'ai-aim' || phase === 'ai-hold') {
      drawCue(aim.angle, 3 + aim.power * 18);
    } else if (phase === 'strike' && strike) {
      const e = strike.t * strike.t;
      drawCue(strike.angle, (3 + strike.power * 18) * (1 - e));
    }

    for (const p of particles) {
      g.globalAlpha = clamp(p.life * 2, 0, 1);
      g.fillStyle = p.col;
      plot(p.x, p.y, 2, 2);
    }
    g.globalAlpha = 1;
  }

  /* ---------- entrada ---------- */
  function toLocal(e) {
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * LW - RAIL,
      y: ((e.clientY - r.top) / r.height) * LH - RAIL,
    };
  }

  function dragAt(e) {
    const p = toLocal(e);
    if (phase === 'aim' && match.turn === 'P') {
      const c = match.cue;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < MIN_DRAG) return;
      aim.angle = Math.atan2(c.y - p.y, c.x - p.x); // solo dirección; la potencia va en la barra
    } else if (phase === 'place' && match.turn === 'P') {
      const x = clamp(p.x, R, W - R);
      const y = clamp(p.y, R, H - R);
      if (canPlaceCue(match.balls, x, y)) {
        match.cue.x = x;
        match.cue.y = y;
      }
    }
  }

  function onDown(e) {
    dragging = true;
    cv.setPointerCapture?.(e.pointerId);
    dragAt(e);
  }
  const onMove = (e) => dragging && dragAt(e);
  const onUp = () => (dragging = false);

  function fineStart(dir) {
    const tick = () => {
      if (phase !== 'aim') return;
      aim.angle += dir * 0.0035;
    };
    tick();
    clearInterval(fineTimer);
    fineTimer = setInterval(tick, 40);
  }
  const fineStop = () => clearInterval(fineTimer);

  /* ---------- barra de potencia ---------- */
  function setPower(e) {
    const r = powerBox.getBoundingClientRect();
    aim.power = clamp((e.clientX - r.left) / r.width, 0.05, 1);
  }
  function onPowerDown(e) {
    if (phase !== 'aim' || match.turn !== 'P') return;
    draggingPower = true;
    powerBox.setPointerCapture?.(e.pointerId);
    setPower(e);
  }
  const onPowerMove = (e) => draggingPower && phase === 'aim' && setPower(e);
  const onPowerUp = () => (draggingPower = false);

  /* ---------- cinemática de intro ---------- */
  const introEls = () => ({
    box: introEl.querySelector('.pi-bubble'),
    who: introEl.querySelector('.pi-bubble b'),
    text: introEl.querySelector('.pi-bubble p'),
    next: introEl.querySelector('.pi-next'),
    ready: introEl.querySelector('.pi-ready'),
  });

  function showIntroStep() {
    const s = poolIntro[introStep];
    const e = introEls();
    const last = introStep === poolIntro.length - 1;
    e.box.dataset.speaker = s.who;
    introEl.dataset.speaker = s.who;
    e.who.textContent = s.who === 'V' ? 'Quiz de F. de Transporte' : 'Sofía';
    e.text.textContent = '';
    e.next.hidden = true;
    e.ready.hidden = true;
    react(e.box, 'pop');
    clearInterval(introTimer);
    introTyping = true;
    let i = 0;
    const done = () => {
      clearInterval(introTimer);
      introTyping = false;
      e.text.textContent = s.text;
      if (last) e.ready.hidden = false;
      else e.next.hidden = false;
    };
    introTimer = setInterval(() => {
      e.text.textContent = s.text.slice(0, ++i);
      if (i % 3 === 0) sfx.note();
      if (i >= s.text.length) done();
    }, 24);
    introEl._finish = done;
  }

  function onIntroTap(e) {
    if (phase !== 'intro' || e.target.closest('.pi-skip, .pi-ready')) return;
    if (introTyping) return introEl._finish();
    if (introStep < poolIntro.length - 1) {
      introStep++;
      sfx.tap();
      showIntroStep();
    }
  }

  // Los personajes grandes "viajan" hasta su sitio de arriba y se revela la mesa.
  function endIntro() {
    if (phase !== 'intro') return;
    phase = 'intro-out';
    clearInterval(introTimer);
    sfx.tap();
    const fly = (from, to) => {
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      from.style.transformOrigin = '0 0';
      from.style.transition = 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
      from.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width}, ${b.height / a.height})`;
    };
    fly(introEl.querySelector('.pi-vill canvas'), villEl);
    fly(introEl.querySelector('.pi-hero canvas'), heroEl);
    introEl.classList.add('leaving');
    later(() => {
      introEl.remove();
      villEl.style.visibility = '';
      heroEl.style.visibility = '';
      phase = 'aim';
      defaultAim();
      setControls();
      say(pick(poolLines.yourTurn));
    }, 950);
  }

  function onFire() {
    if (match.turn !== 'P' || ended) return;
    if (phase === 'place') {
      phase = 'aim';
      defaultAim();
      sfx.tap();
      setControls();
    } else if (phase === 'aim') {
      fire(aim.angle, Math.max(0.06, aim.power));
    }
  }

  return {
    mount(container, context) {
      ctx = context;
      build();
      container.appendChild(root);
      fitCanvas();
      resizeObs = new ResizeObserver(fitCanvas);
      resizeObs.observe(mainEl);

      cv.addEventListener('pointerdown', onDown);
      cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerup', onUp);
      cv.addEventListener('pointercancel', onUp);
      fireBtn.addEventListener('click', onFire);
      for (const b of [fineL, fineR]) {
        const dir = Number(b.dataset.fine);
        b.addEventListener('pointerdown', () => fineStart(dir));
        for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, fineStop);
      }

      const timeEl = document.getElementById('time');
      if (timeEl) {
        urgentObs = new MutationObserver(() => root.classList.toggle('urgent', timeEl.classList.contains('urgent')));
        urgentObs.observe(timeEl, { attributes: true, attributeFilter: ['class'] });
      }

      powerBox.addEventListener('pointerdown', onPowerDown);
      powerBox.addEventListener('pointermove', onPowerMove);
      powerBox.addEventListener('pointerup', onPowerUp);
      powerBox.addEventListener('pointercancel', onPowerUp);
      introEl.addEventListener('pointerdown', onIntroTap);
      introEl.querySelector('.pi-skip').addEventListener('click', endIntro);
      introEl.querySelector('.pi-ready').addEventListener('click', endIntro);

      if (location.search.includes('debug')) window.__poolDebug = { match, endGame };
      defaultAim();
      setControls();
      showIntroStep();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    destroy() {
      ended = true;
      cancelAnimationFrame(raf);
      clearInterval(typeTimer);
      clearInterval(fineTimer);
      clearInterval(introTimer);
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      resizeObs?.disconnect();
      urgentObs?.disconnect();
      stopConfetti?.();
      root?.remove();
    },
  };
}
