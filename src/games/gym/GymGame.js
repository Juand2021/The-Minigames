import './gym.css';
import { gymLines } from '../../content/story.js';
import { sfx } from '../shared/sfx.js';
import { burst } from '../shared/confetti.js';
import { drawBody, drawFront, headSprite, outlineLayer, barbell, dumbbell, pullBar, px, HEAD_W, HEAD_H } from './laura.js';
import { makeScene, LW, LH, FLOOR_Y, CX } from './scene.js';

const REPS = 10;
const TAPS_PER_SQUAT = 6; // toques por sentadilla (la mitad baja y la otra mitad sube)
const SWIPE_RANGE = 105; // píxeles de pantalla para una dominada completa
const CURL_MS = 320;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t * t * (3 - 2 * t);

const EXERCISES = [
  { id: 'squat', icon: '🍑', title: 'Sentadillas', card: 'Toca el botón lo más rápido que puedas. ¡10 sentadillas y cada vez con más peso!' },
  { id: 'pullup', icon: '🧗', title: 'Dominadas en barra', card: 'Desliza el dedo hacia ARRIBA para subir el mentón por encima de la barra y hacia ABAJO para bajar. ¡10 veces!' },
  { id: 'curl', icon: '💪', title: 'Curl con mancuernas', card: 'Toca IZQ y DER alternando para subir y bajar cada mancuerna. ¡10 repeticiones con los dos brazos!' },
];

export function createGym() {
  let root, ctx, cv, g, stageEl, controlsEl, cardEl, toastEl, floatsEl, titleEl, countEl, dotsEl, chipEls;
  let scenes = {};
  let bodyL, frontL, bg, fg;
  let ex = 0;
  let reps = 0;
  let phase = 'card'; // card | play | celebrate | done
  let raf = 0;
  let last = 0;
  let scale = 1;
  let resizeObs = null;
  let stopConfetti = null;
  let particles = [];
  let taps = [];
  let beast = false;
  const timeouts = new Set();

  // estado de cada ejercicio
  const squat = { p: 0, t: 0 };
  const pull = { target: 0, t: 0, up: false, dragging: false, y: 0 };
  // brazo en movimiento = { t0 } (hora de inicio); null = quieto. Todo va por reloj real, no por cuadros.
  const curl = { L: null, R: null, doneL: false, doneR: false, lastArm: null };

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
  };

  /* ---------- DOM ---------- */
  function build() {
    root = document.createElement('div');
    root.className = 'gy';
    root.innerHTML = `
      <div class="glass gy-top">
        <div class="gy-chips">${EXERCISES.map((e) => `<span class="gy-chip">${e.icon}</span>`).join('')}</div>
        <div class="gy-title"><b></b><span class="gy-count">0/${REPS}</span></div>
        <div class="gy-dots">${Array.from({ length: REPS }, () => '<i></i>').join('')}</div>
      </div>
      <div class="gy-stage">
        <canvas class="gy-canvas" width="${LW}" height="${LH}"></canvas>
        <div class="gy-toast" aria-live="polite"></div>
        <div class="gy-floats"></div>
      </div>
      <div class="gy-controls"></div>
      <div class="gy-card" hidden>
        <div class="glass gy-card-box">
          <div class="orb orb-lg gy-card-icon"></div>
          <p class="eyebrow gy-card-step"></p>
          <h2 class="gy-card-title"></h2>
          <p class="gy-card-text"></p>
          <button class="btn btn-primary" data-act="go">¡A darle! 🔥</button>
        </div>
      </div>`;
    cv = root.querySelector('.gy-canvas');
    g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    stageEl = root.querySelector('.gy-stage');
    controlsEl = root.querySelector('.gy-controls');
    cardEl = root.querySelector('.gy-card');
    toastEl = root.querySelector('.gy-toast');
    floatsEl = root.querySelector('.gy-floats');
    titleEl = root.querySelector('.gy-title b');
    countEl = root.querySelector('.gy-count');
    dotsEl = [...root.querySelectorAll('.gy-dots i')];
    chipEls = [...root.querySelectorAll('.gy-chip')];

    const layer = () => {
      const c = document.createElement('canvas');
      c.width = LW;
      c.height = LH;
      const gg = c.getContext('2d');
      gg.imageSmoothingEnabled = false;
      return [c, gg];
    };
    [bodyL, bg] = layer();
    [frontL, fg] = layer();
    scenes = { squat: makeScene('squat'), pullup: makeScene('pullup'), curl: makeScene('curl') };
  }

  function fit() {
    const w = stageEl.clientWidth;
    const h = stageEl.clientHeight;
    scale = Math.max(0.5, Math.min(w / LW, h / LH));
    cv.style.width = `${Math.floor(LW * scale)}px`;
    cv.style.height = `${Math.floor(LH * scale)}px`;
  }

  /* ---------- mensajes y efectos ---------- */
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
  }

  function floatText(text, cls = '') {
    const s = document.createElement('span');
    s.className = `gy-float ${cls}`;
    s.textContent = text;
    s.style.left = `${38 + Math.random() * 24}%`;
    floatsEl.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }

  function sweat(x, y) {
    for (let i = 0; i < 2; i++) {
      particles.push({ x, y, vx: (Math.random() - 0.5) * 30 + (x < CX ? -14 : 14), vy: -30 - Math.random() * 25, life: 0.7, col: '#a9dcff', w: 2, h: 2, g: 140 });
    }
  }

  function sparkles(x, y) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * 50;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.8, col: pick(['#ff5fa2', '#ffd166', '#ffffff', '#5ee6a8']), w: 2, h: 2, g: 60 });
    }
  }

  function registerTap() {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 1000);
    taps.push(now);
    if (taps.length >= 5 && !beast) {
      beast = true;
      toast(pick(gymLines.beast));
      sfx.hint();
    }
  }

  function updateHud() {
    const e = EXERCISES[ex];
    titleEl.textContent = `${e.icon} ${e.title}`;
    countEl.textContent = `${reps}/${REPS}`;
    dotsEl.forEach((d, i) => d.classList.toggle('on', i < reps));
    chipEls.forEach((c, i) => {
      c.classList.toggle('done', i < ex);
      c.classList.toggle('now', i === ex);
    });
  }

  /* ---------- flujo de ejercicios ---------- */
  function showCard() {
    phase = 'card';
    ctx.hold(true);
    const e = EXERCISES[ex];
    cardEl.querySelector('.gy-card-icon').textContent = e.icon;
    cardEl.querySelector('.gy-card-step').textContent = `Ejercicio ${ex + 1} de ${EXERCISES.length}`;
    cardEl.querySelector('.gy-card-title').textContent = e.title;
    cardEl.querySelector('.gy-card-text').textContent = e.card;
    cardEl.hidden = false;
    cardEl.classList.remove('out');
    reps = 0;
    resetExercise();
    buildControls();
    updateHud();
  }

  function startExercise() {
    cardEl.classList.add('out');
    later(() => (cardEl.hidden = true), 250);
    phase = 'play';
    ctx.hold(false);
    sfx.tap();
    toast(gymLines.go[ex]);
  }

  function resetExercise() {
    squat.p = 0;
    squat.t = 0;
    pull.target = 0;
    pull.t = 0;
    pull.up = false;
    curl.L = null;
    curl.R = null;
    curl.doneL = curl.doneR = false;
    curl.lastArm = null;
    taps = [];
    beast = false;
  }

  function buildControls() {
    const id = EXERCISES[ex].id;
    if (id === 'squat') {
      controlsEl.innerHTML = '<button class="gy-big pink" data-act="squat"><span>🍑</span><b>¡SENTADILLA!</b><small>toca rápido, rápido, rápido</small></button>';
    } else if (id === 'pullup') {
      controlsEl.innerHTML = '<div class="gy-swipe"><span class="arrow up">⬆</span><div><b>DESLIZA</b><small>arriba para subir · abajo para bajar</small></div><span class="arrow down">⬇</span></div>';
    } else {
      controlsEl.innerHTML = '<div class="gy-pair"><button class="gy-big pink" data-arm="L"><span>💪</span><b>IZQ</b></button><button class="gy-big violet" data-arm="R"><span>💪</span><b>DER</b></button></div>';
    }
  }

  function repDone() {
    reps++;
    updateHud();
    const e = EXERCISES[ex];
    sfx.complete();
    sparkles(CX, FLOOR_Y - 60);
    floatText(`${reps}/${REPS}`, reps === REPS ? 'big' : '');
    if (reps < REPS) {
      if (reps % 3 === 0) toast(pick(gymLines.rep));
    } else finishExercise(e);
  }

  function finishExercise() {
    phase = 'celebrate';
    toast(gymLines.exerciseDone[ex]);
    sfx.win();
    sparkles(CX - 25, FLOOR_Y - 70);
    sparkles(CX + 25, FLOOR_Y - 70);
    chipEls[ex].classList.add('done');
    if (ex < EXERCISES.length - 1) {
      later(() => {
        ex++;
        showCard();
      }, 1700);
    } else {
      phase = 'done';
      ctx.freeze();
      stopConfetti = burst(root, { count: 140, duration: 3500 });
      later(() => ctx.win(), 2400);
    }
  }

  // Una dominada = llegar arriba y volver abajo. Se revisa en cada movimiento del dedo, no solo por cuadro.
  function checkPull() {
    if (phase !== 'play') return;
    if (!pull.up && pull.target >= 0.96) {
      pull.up = true;
      sfx.place();
    } else if (pull.up && pull.target <= 0.1) {
      pull.up = false;
      repDone();
    }
  }

  function completeArm(k) {
    curl[k] = null;
    curl['done' + k] = true;
    if (phase === 'play' && curl.doneL && curl.doneR) {
      curl.doneL = curl.doneR = false;
      repDone();
    }
  }

  /* ---------- entrada ---------- */
  function onTap(e) {
    if (phase !== 'play') return;
    const id = EXERCISES[ex].id;
    const arm = e.target.closest('[data-arm]')?.dataset.arm;
    if (id === 'squat' && e.target.closest('[data-act=squat]')) {
      registerTap();
      sfx.place();
      squat.p += 1 / TAPS_PER_SQUAT;
      if (squat.p >= 1 - 1e-6) {
        squat.p = 0;
        repDone();
      }
      if (taps.length % 3 === 0) sweat(CX + (Math.random() < 0.5 ? -14 : 14), FLOOR_Y - 90 + squat.t * 14);
    } else if (id === 'curl' && arm) {
      // si el brazo ya va por la mitad de la subida/bajada, el toque lo cuenta como completado y empieza otro
      const now = performance.now();
      if (curl[arm]) {
        if (now - curl[arm].t0 < CURL_MS * 0.5) return;
        completeArm(arm);
      }
      if (curl.lastArm === arm) {
        toast(gymLines.alternate);
        sfx.error();
        return;
      }
      curl.lastArm = arm;
      curl[arm] = { t0: now };
      registerTap();
      sfx.place();
      if (taps.length % 2 === 0) sweat(CX + (arm === 'L' ? -14 : 14), FLOOR_Y - 90);
    }
  }

  function onPointerDown(e) {
    if (e.target.closest('.gy-card')) return;
    if (EXERCISES[ex].id === 'pullup' && phase === 'play') {
      pull.dragging = true;
      pull.y = e.clientY;
      root.setPointerCapture?.(e.pointerId);
      return;
    }
    onTap(e);
  }

  function onPointerMove(e) {
    if (!pull.dragging || phase !== 'play') return;
    const dy = pull.y - e.clientY; // positivo = el dedo sube
    pull.y = e.clientY;
    const before = pull.target;
    pull.target = clamp(pull.target + dy / SWIPE_RANGE, 0, 1);
    if (pull.target !== before && Math.abs(dy) > 2) registerTap();
    checkPull();
  }

  const onPointerUp = () => (pull.dragging = false);

  /* ---------- poses ---------- */
  function poseSquat() {
    const hipY = 153 + 14 * ease(squat.t);
    const ny = hipY - 20;
    const barY = ny + 3;
    const plates = Math.min(4, 1 + Math.floor(reps / 3));
    return {
      nx: CX,
      ny,
      hips: [[CX - 4, hipY], [CX + 4, hipY]],
      feet: [[CX - 11, FLOOR_Y - 5], [CX + 11, FLOOR_Y - 5]],
      legSide: [1, -1],
      hands: [[CX - 19, barY], [CX + 19, barY]],
      armSide: [-1, 1],
      behind: (gg) => barbell(gg, CX, barY, plates),
    };
  }

  function posePull() {
    const barY = 60;
    const ny = barY + 22 - 25 * ease(pull.t);
    const hipY = ny + 20;
    return {
      nx: CX,
      ny,
      hips: [[CX - 4, hipY], [CX + 4, hipY]],
      feet: [[CX - 3, hipY + 24], [CX + 3, hipY + 24]],
      legSide: [1, -1],
      hands: [[CX - 14, barY], [CX + 14, barY]],
      armSide: [-1, 1],
      front: (gg) => pullBar(gg, CX, barY),
    };
  }

  function poseCurl(now) {
    const ny = 133;
    const hipY = 153;
    const level = Math.min(3, Math.floor(reps / 3));
    const arm = (s, a) => {
      const phi = a ? Math.sin(Math.PI * clamp((now - a.t0) / CURL_MS, 0, 1)) * 2.65 : 0;
      const sh = [CX + s * 9, ny + 4];
      const elbow = [CX + s * 12, ny + 16];
      const dir = [-s * Math.sin(phi) * 0.55, Math.cos(phi)];
      return { elbow, hand: [elbow[0] + dir[0] * 13, elbow[1] + dir[1] * 13], sh };
    };
    const L = arm(-1, curl.L);
    const R = arm(1, curl.R);
    return {
      nx: CX,
      ny,
      hips: [[CX - 4, hipY], [CX + 4, hipY]],
      feet: [[CX - 8, FLOOR_Y - 5], [CX + 8, FLOOR_Y - 5]],
      legSide: [1, -1],
      hands: [L.hand, R.hand],
      elbows: [L.elbow, R.elbow],
      front: (gg) => {
        dumbbell(gg, L.hand[0], L.hand[1] + 1, level);
        dumbbell(gg, R.hand[0], R.hand[1] + 1, level);
      },
    };
  }

  /* ---------- bucle ---------- */
  function update(dt, now) {
    const id = EXERCISES[ex].id;
    // suaviza el movimiento (pasos cortos pero fluidos)
    if (id === 'squat') {
      const target = squat.p < 0.5 ? squat.p * 2 : (1 - squat.p) * 2;
      squat.t += (target - squat.t) * Math.min(1, dt * 16);
    } else if (id === 'pullup') {
      if (!pull.dragging && phase === 'play' && !pull.up) pull.target = Math.max(0, pull.target - dt * 0.12);
      pull.t += (pull.target - pull.t) * Math.min(1, dt * 18);
      checkPull();
    } else {
      for (const k of ['L', 'R']) if (curl[k] && now - curl[k].t0 >= CURL_MS) completeArm(k);
    }
    // fin del "modo bestia" si se deja de tocar
    taps = taps.filter((t) => now - t < 1000);
    if (beast && taps.length < 2) beast = false;

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
    if (beast && Math.random() < 0.6) {
      particles.push({ x: CX + (Math.random() - 0.5) * 30, y: FLOOR_Y - 4, vx: (Math.random() - 0.5) * 10, vy: -50 - Math.random() * 30, life: 0.5, col: pick(['#ff7a2f', '#ffd166', '#ff5fa2']), w: 2, h: 3, g: -20 });
    }
  }

  function draw(now) {
    const id = EXERCISES[ex].id;
    g.clearRect(0, 0, LW, LH);
    g.drawImage(scenes[id], 0, 0);

    const pose = id === 'squat' ? poseSquat() : id === 'pullup' ? posePull() : poseCurl(now);
    const bob = phase === 'play' || phase === 'card' ? Math.round(Math.sin(now / 380) * 0.5 + 0.5) : 0;
    if (id !== 'pullup') pose.ny += 0;

    // sombra en el suelo
    const hang = id === 'pullup' ? 0.5 : 1;
    g.fillStyle = `rgba(0,0,0,${0.35 * hang})`;
    g.fillRect(CX - 16, FLOOR_Y, 32, 2);
    g.fillRect(CX - 12, FLOOR_Y + 2, 24, 1);

    // cuerpo (con contorno) → cabeza → brazos y equipo (con contorno)
    bg.clearRect(0, 0, LW, LH);
    drawBody(bg, pose);
    outlineLayer(bodyL);
    g.drawImage(bodyL, 0, bob && id !== 'pullup' ? 0 : 0);
    g.drawImage(headSprite(), CX - HEAD_W / 2, pose.ny - HEAD_H + (id === 'pullup' ? 0 : bob));
    fg.clearRect(0, 0, LW, LH);
    drawFront(fg, pose);
    outlineLayer(frontL);
    g.drawImage(frontL, 0, 0);

    // aura de esfuerzo
    if (beast) {
      g.fillStyle = 'rgba(255,122,47,0.16)';
      g.fillRect(CX - 26, FLOOR_Y - 4, 52, 4);
    }
    for (const p of particles) {
      g.globalAlpha = clamp(p.life * 2, 0, 1);
      px(g, p.x, p.y, p.w, p.h, p.col);
    }
    g.globalAlpha = 1;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.25, (now - last) / 1000 || 0);
    last = now;
    update(dt, now);
    draw(now);
  }

  return {
    mount(container, context) {
      ctx = context;
      build();
      container.appendChild(root);
      fit();
      resizeObs = new ResizeObserver(fit);
      resizeObs.observe(stageEl);
      root.addEventListener('pointerdown', onPointerDown);
      root.addEventListener('pointermove', onPointerMove);
      root.addEventListener('pointerup', onPointerUp);
      root.addEventListener('pointercancel', onPointerUp);
      cardEl.querySelector('[data-act=go]').addEventListener('click', startExercise);
      if (location.search.includes('debug')) window.__gym = { get state() { return { ex, reps, phase }; }, skip: () => repDoneAll() };
      showCard();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    destroy() {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      resizeObs?.disconnect();
      stopConfetti?.();
      root?.remove();
    },
  };

  // solo pruebas (?debug)
  function repDoneAll() {
    if (phase === 'card') startExercise();
    for (let i = reps; i < REPS; i++) repDone();
  }
}
