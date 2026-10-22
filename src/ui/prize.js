// El premio: un bloque "?" en 3D que gira y brilla. Hay que golpearlo varias veces hasta que estalla
// en luces y aparece el mensaje con el vale del premio.
import './prize.css';
import { reward } from '../content/reward.js';
import { icon } from './icons.js';
import { sfx } from '../games/shared/sfx.js';
import { burst } from '../games/shared/confetti.js';

// "?" en bloque, propio (100x100): gancho + punto
const Q = 'M28 26 L40 13 L64 13 L76 25 L76 45 L60 56 L60 64 L42 64 L42 49 L58 38 L58 30 L54 27 L48 27 L44 33 L28 33 Z M42 70 L60 70 L60 87 L42 87 Z';
// grietas que van apareciendo con cada golpe (mismo dibujo en las 6 caras)
const CRACKS = [
  'M50 50 L38 40 L31 28 L20 22',
  'M50 50 L64 44 L72 30 L84 24',
  'M50 50 L58 62 L70 70 L80 84',
  'M50 50 L40 62 L30 66 L16 78',
  'M50 50 L47 34 L52 20 L49 6',
  'M50 50 L66 54 L82 52 L95 58',
  'M38 40 L26 46 L8 44',
  'M58 62 L54 78 L58 95',
];

const face = (side) => `
  <div class="pz-face pz-${side}">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      ${[[11, 11], [89, 11], [11, 89], [89, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" class="pz-rivet"/><circle cx="${x - 1.2}" cy="${y - 1.2}" r="1.4" class="pz-rivet-hi"/>`).join('')}
      ${side === 'top' || side === 'bottom' ? '' : `<path d="${Q}" class="pz-q-shadow" transform="translate(3 4)"/><path d="${Q}" class="pz-q"/><path d="M40 13 L64 13 L76 25 L74 26 L63 16 L41 16 Z" class="pz-q-hi"/>`}
      <g class="pz-cracks">${CRACKS.map((d, i) => `<path d="${d}" data-c="${i}"/>`).join('')}</g>
    </svg>
  </div>`;

export function mountPrize(host, { onOpened } = {}) {
  const root = document.createElement('div');
  root.className = 'pz';
  root.innerHTML = `
    <div class="pz-rays"></div>
    <div class="pz-glow"></div>
    <p class="pz-intro">${reward.intro}</p>
    <button class="pz-stage" aria-label="Golpear el bloque">
      <div class="pz-bob">
        <div class="pz-cube">${['front', 'back', 'right', 'left', 'top', 'bottom'].map(face).join('')}</div>
      </div>
      <div class="pz-shadow"></div>
    </button>
    <p class="pz-hint"><b>${reward.hint}</b><span class="pz-dots">${'<i></i>'.repeat(reward.hits)}</span></p>
    <div class="pz-sparks"></div>
    <canvas class="pz-fireworks"></canvas>
    <div class="pz-flash"></div>
    <div class="pz-reveal" hidden></div>`;
  host.appendChild(root);

  const stage = root.querySelector('.pz-stage');
  const cube = root.querySelector('.pz-cube');
  const bob = root.querySelector('.pz-bob');
  const faces = [...root.querySelectorAll('.pz-face')];
  const dots = [...root.querySelectorAll('.pz-dots i')];
  const hintB = root.querySelector('.pz-hint b');
  const sparksEl = root.querySelector('.pz-sparks');
  const fw = root.querySelector('.pz-fireworks');
  const flashEl = root.querySelector('.pz-flash');
  const reveal = root.querySelector('.pz-reveal');

  let hits = 0;
  let angle = 25;
  let speed = 38; // grados por segundo
  let lift = 0; // rebote al golpear
  let liftV = 0;
  let squash = 0;
  let shake = 0;
  let broken = false;
  let raf = 0;
  let last = performance.now();
  let stopFireworks = null;
  let stopConfetti = null;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  /* ---------- giro y rebote ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (broken) return;
    angle += speed * dt;
    speed += (38 + hits * 14 - speed) * Math.min(1, dt * 1.5); // vuelve a su velocidad (más rápida si está dañado)
    liftV += (-lift * 160 - liftV * 12) * dt; // resorte
    lift += liftV * dt;
    squash *= Math.exp(-dt * 10);
    shake *= Math.exp(-dt * 6);
    const t = now / 1000;
    const float = Math.sin(t * 2.2) * 8;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    bob.style.transform = `translate(${sx}px, ${float - lift + sy}px) scale(${1 + squash * 0.18}, ${1 - squash * 0.14})`;
    cube.style.transform = `rotateX(-18deg) rotateY(${angle}deg)`;
  }

  /* ---------- golpes ---------- */
  function spark(n, big = false) {
    const r = stage.getBoundingClientRect();
    const hr = root.getBoundingClientRect();
    const cx = r.left + r.width / 2 - hr.left;
    const cy = r.top + r.height * 0.42 - hr.top;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      const a = Math.random() * Math.PI * 2;
      const d = (big ? 140 : 70) + Math.random() * (big ? 160 : 80);
      s.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--h:${Math.floor(Math.random() * 360)}`;
      if (Math.random() < 0.4) s.className = 'gold';
      sparksEl.appendChild(s);
      s.addEventListener('animationend', () => s.remove(), { once: true });
    }
  }

  function hit() {
    if (broken) return;
    hits++;
    liftV = 520;
    squash = 1;
    shake = 4 + hits * 1.6;
    speed += 260;
    dots.forEach((d, i) => d.classList.toggle('on', i < hits));
    const level = hits / reward.hits;
    const show = Math.round(level * CRACKS.length);
    root.querySelectorAll('.pz-cracks path').forEach((p) => p.classList.toggle('on', Number(p.dataset.c) < show));
    root.style.setProperty('--dmg', level.toFixed(2));
    spark(10 + hits * 2);
    sfx.bump?.(hits);
    if (hits < reward.hits) {
      hintB.textContent = reward.hitLines[Math.min(reward.hitLines.length - 1, Math.floor(level * reward.hitLines.length))];
      hintB.classList.remove('pop');
      void hintB.offsetWidth;
      hintB.classList.add('pop');
    } else explode();
  }

  /* ---------- explosión ---------- */
  function explode() {
    broken = true;
    root.classList.add('broken');
    sfx.shatter?.();
    // las caras salen volando en 3D
    faces.forEach((f, i) => {
      const base = getComputedStyle(f).transform;
      const rx = (Math.random() - 0.5) * 720;
      const ry = (Math.random() - 0.5) * 720;
      f.style.transition = 'transform 1.1s cubic-bezier(.15,.7,.3,1), opacity 1.1s ease-in';
      f.style.transform = `${base === 'none' ? '' : base} translateZ(${260 + i * 30}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      f.style.opacity = '0';
    });
    // destello, chispas y fuegos artificiales
    flashEl.classList.add('on');
    spark(60, true);
    stopFireworks = fireworks(fw);
    later(() => {
      stopConfetti = burst(root, { count: 180, duration: 5000 });
      sfx.win?.();
    }, 350);
    later(showMessage, 1100);
  }

  function showMessage() {
    reveal.hidden = false;
    reveal.innerHTML = `
      <div class="pz-card glass">
        <div class="pz-heart">${icon('heart')}</div>
        <h2 class="pz-congrats">${reward.congrats}</h2>
        ${reward.lines.map((l, i) => `<p class="pz-line" style="--i:${i}">${l}</p>`).join('')}
        <p class="pz-line pz-claim" style="--i:${reward.lines.length}">${reward.claim}</p>
        <p class="pz-price" style="--i:${reward.lines.length + 1}">${reward.price}</p>
        <button class="btn btn-primary pz-claim-btn" style="--i:${reward.lines.length + 2}">${reward.claimButton}</button>
      </div>`;
    reveal.querySelector('.pz-claim-btn').addEventListener('click', showVoucher);
    onOpened?.();
  }

  function showVoucher() {
    sfx.complete?.();
    const v = reward.voucher;
    reveal.innerHTML = `
      <div class="pz-voucher">
        <div class="pz-ticket">
          <span class="pz-stamp">${v.stamp}</span>
          <p class="pz-v-title">${v.title}</p>
          <div class="pz-v-row"><span>PARA</span><b>${v.to}</b></div>
          <div class="pz-v-row"><span>PRECIO</span><b>${v.price}</b></div>
          <p class="pz-v-note">${v.note}</p>
          <div class="pz-v-icons">${icon('heart')}${icon('trophy')}${icon('heart')}</div>
        </div>
      </div>`;
    spark(40, true);
  }

  stage.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    hit();
  });
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      stopFireworks?.();
      stopConfetti?.();
      root.remove();
    },
  };
}

/* ---------- fuegos artificiales (canvas, mezcla aditiva) ---------- */
function fireworks(cv) {
  const g = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const resize = () => {
    cv.width = cv.clientWidth * dpr;
    cv.height = cv.clientHeight * dpr;
  };
  resize();
  const W = () => cv.width;
  const H = () => cv.height;
  const COLORS = ['#ff4fa3', '#ffd166', '#5ee6a8', '#7ec8ff', '#c79bff', '#ffffff', '#ff8a3d'];
  // brillo pre-dibujado por color (más barato que shadowBlur)
  const glow = Object.fromEntries(
    COLORS.map((c) => {
      const s = document.createElement('canvas');
      s.width = s.height = 32;
      const sg = s.getContext('2d');
      const grd = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.25, c);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      sg.fillStyle = grd;
      sg.fillRect(0, 0, 32, 32);
      return [c, s];
    }),
  );
  let parts = [];
  let raf = 0;
  let last = performance.now();
  const start = last;
  let nextBurst = 0;
  const boom = (x, y) => {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    const c2 = COLORS[Math.floor(Math.random() * COLORS.length)];
    const n = 46 + Math.floor(Math.random() * 20);
    const sp = (150 + Math.random() * 140) * dpr;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
      const v = sp * (0.55 + Math.random() * 0.45);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2 + Math.random() * 0.6, max: 1.8, c: i % 3 ? c : c2, s: (10 + Math.random() * 10) * dpr });
    }
  };
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now - start;
    if (t < 7000 && t > nextBurst) {
      nextBurst = t + 260 + Math.random() * 320;
      boom(W() * (0.15 + Math.random() * 0.7), H() * (0.12 + Math.random() * 0.45));
    }
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, W(), H());
    g.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.vy += 160 * dpr * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      g.globalAlpha = Math.max(0, Math.min(1, p.life / 0.6));
      g.drawImage(glow[p.c], p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    g.globalAlpha = 1;
    parts = parts.filter((p) => p.life > 0);
    if (t > 9000 && !parts.length) stop();
  };
  function stop() {
    cancelAnimationFrame(raf);
    g.clearRect(0, 0, W(), H());
  }
  raf = requestAnimationFrame(frame);
  return stop;
}
