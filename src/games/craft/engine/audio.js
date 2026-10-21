// Sonidos de Maincra sintetizados con WebAudio (ruido filtrado + tonos). Respeta el silencio global del juego.
import { sfx } from '../../shared/sfx.js';

let ctx = null;
let master = null;
let noiseBuf = null;
let musicTimer = 0;
let musicOn = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Ráfaga de ruido filtrado
function noise({ dur = 0.1, type = 'bandpass', freq = 1000, q = 1, vol = 0.2, delay = 0, sweep = 0, attack = 0.004 }) {
  if (sfx.muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur);
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 1.2);
  src.stop(t + dur + 0.05);
}

function tone({ freq = 440, dur = 0.15, type = 'sine', vol = 0.1, delay = 0, slide = 0, attack = 0.005, filter = 0, vibrato = 0 }) {
  if (sfx.muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  let node = o;
  if (vibrato) {
    const lfo = a.createOscillator();
    const lg = a.createGain();
    lfo.frequency.value = vibrato;
    lg.gain.value = freq * 0.06;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  if (filter) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    f.Q.value = 4;
    node.connect(f);
    node = f;
  }
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const vary = (v, k = 0.12) => v * (1 + (Math.random() - 0.5) * k * 2);

// Cada material suena distinto al picar, romper, poner y pisar
const MAT = {
  stone: { type: 'highpass', freq: 1800, q: 0.8, dur: 0.07 },
  gravel: { type: 'lowpass', freq: 900, q: 0.7, dur: 0.09 },
  grass: { type: 'bandpass', freq: 2600, q: 0.6, dur: 0.1 },
  wood: { type: 'bandpass', freq: 650, q: 2.2, dur: 0.08, knock: 180 },
  sand: { type: 'lowpass', freq: 1400, q: 0.5, dur: 0.13 },
  glass: { type: 'bandpass', freq: 3800, q: 3, dur: 0.06, ring: true },
  water: { type: 'lowpass', freq: 600, q: 1, dur: 0.2 },
};

export const audio = {
  unlock() {
    ac();
  },
  dig(mat, loud = 1) {
    const m = MAT[mat] || MAT.stone;
    noise({ type: m.type, freq: vary(m.freq), q: m.q, dur: m.dur, vol: 0.16 * loud });
    if (m.knock) tone({ freq: vary(m.knock), dur: 0.06, type: 'triangle', vol: 0.06 * loud, slide: 0.7 });
  },
  break(mat) {
    const m = MAT[mat] || MAT.stone;
    for (let i = 0; i < 3; i++) noise({ type: m.type, freq: vary(m.freq * 0.9), q: m.q, dur: m.dur * 1.6, vol: 0.2, delay: i * 0.035 });
    if (m.knock) tone({ freq: vary(m.knock * 0.8), dur: 0.12, type: 'triangle', vol: 0.09, slide: 0.6 });
    if (m.ring) {
      // cristal roto
      for (let i = 0; i < 4; i++) tone({ freq: vary(2400 + i * 700, 0.3), dur: 0.18, type: 'sine', vol: 0.03, delay: i * 0.03 });
    }
  },
  place(mat) {
    const m = MAT[mat] || MAT.stone;
    noise({ type: m.type, freq: vary(m.freq * 0.7), q: m.q, dur: m.dur * 1.2, vol: 0.18 });
    tone({ freq: vary(120), dur: 0.07, type: 'sine', vol: 0.08, slide: 0.6 });
  },
  step(mat) {
    const m = MAT[mat] || MAT.gravel;
    noise({ type: m.type, freq: vary(m.freq * 0.8, 0.25), q: m.q, dur: m.dur * 0.8, vol: 0.06 });
  },
  jump() {
    noise({ type: 'lowpass', freq: 700, dur: 0.06, vol: 0.05 });
  },
  swing() {
    noise({ type: 'bandpass', freq: 3200, q: 0.8, dur: 0.14, vol: 0.07, sweep: 0.3, attack: 0.03 });
  },
  hit(crit) {
    noise({ type: 'bandpass', freq: 2600, q: 0.8, dur: 0.12, vol: 0.08, sweep: 0.3, attack: 0.02 });
    noise({ type: 'lowpass', freq: 500, dur: 0.1, vol: 0.22 });
    tone({ freq: vary(110), dur: 0.1, type: 'square', vol: 0.05, slide: 0.5 });
    if (crit) for (let i = 0; i < 3; i++) tone({ freq: 1600 + i * 400, dur: 0.06, vol: 0.03, delay: i * 0.03 });
  },
  hurt() {
    // "¡uf!" sintetizado: dos formantes que bajan
    tone({ freq: 230, dur: 0.16, type: 'sawtooth', vol: 0.12, slide: 0.7, filter: 900 });
    tone({ freq: 460, dur: 0.12, type: 'sawtooth', vol: 0.05, slide: 0.65, filter: 1500 });
    noise({ type: 'lowpass', freq: 400, dur: 0.08, vol: 0.12 });
  },
  groan(mob) {
    if (mob === 'zombie') {
      tone({ freq: vary(95), dur: vary(0.9), type: 'sawtooth', vol: 0.07, slide: 0.75, filter: 520, vibrato: 7, attack: 0.15 });
      tone({ freq: vary(140), dur: 0.7, type: 'sawtooth', vol: 0.03, slide: 0.8, filter: 700, vibrato: 5, attack: 0.2, delay: 0.1 });
    } else if (mob === 'skeleton') {
      for (let i = 0; i < 5; i++) noise({ type: 'highpass', freq: 3000, dur: 0.025, vol: 0.09, delay: i * 0.07 + Math.random() * 0.02 });
    }
  },
  mobHurt(mob) {
    if (mob === 'zombie') tone({ freq: vary(150), dur: 0.3, type: 'sawtooth', vol: 0.08, slide: 0.6, filter: 700, vibrato: 9 });
    else if (mob === 'skeleton') for (let i = 0; i < 3; i++) noise({ type: 'highpass', freq: 2600, dur: 0.03, vol: 0.12, delay: i * 0.05 });
    else noise({ type: 'bandpass', freq: 900, q: 1, dur: 0.15, vol: 0.12 });
  },
  death() {
    noise({ type: 'lowpass', freq: 800, dur: 0.35, vol: 0.12, sweep: 0.3 });
    tone({ freq: 180, dur: 0.35, type: 'triangle', vol: 0.06, slide: 0.4 });
  },
  fuse() {
    noise({ type: 'highpass', freq: 2500, dur: 1.5, vol: 0.12, sweep: 2, attack: 0.3 });
  },
  explode() {
    noise({ type: 'lowpass', freq: 900, dur: 1.4, vol: 0.5, sweep: 0.08, attack: 0.005 });
    noise({ type: 'bandpass', freq: 2200, q: 0.5, dur: 0.4, vol: 0.2, sweep: 0.2 });
    tone({ freq: 60, dur: 0.9, type: 'sine', vol: 0.4, slide: 0.4 });
  },
  bow() {
    tone({ freq: 320, dur: 0.12, type: 'triangle', vol: 0.08, slide: 0.45 });
    noise({ type: 'bandpass', freq: 2000, dur: 0.12, vol: 0.06, sweep: 0.4 });
  },
  arrowHit() {
    noise({ type: 'bandpass', freq: 800, q: 2, dur: 0.06, vol: 0.12 });
    tone({ freq: 220, dur: 0.05, type: 'triangle', vol: 0.05 });
  },
  pickup() {
    tone({ freq: vary(700, 0.2), dur: 0.08, type: 'sine', vol: 0.12, slide: 1.9 });
  },
  xp() {
    tone({ freq: vary(1400, 0.35), dur: 0.12, type: 'triangle', vol: 0.06 });
    tone({ freq: vary(2100, 0.35), dur: 0.1, type: 'sine', vol: 0.03, delay: 0.02 });
  },
  steal() {
    [523, 440, 349].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'square', vol: 0.05, delay: i * 0.12, filter: 2000 }));
  },
  recover() {
    [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.15, type: 'triangle', vol: 0.08, delay: i * 0.07 }));
  },
  levelUp() {
    [392, 523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.35, type: 'triangle', vol: 0.08, delay: i * 0.09 }));
  },
  star(i) {
    tone({ freq: 660 * Math.pow(1.26, i), dur: 0.35, type: 'triangle', vol: 0.1 });
    tone({ freq: 1320 * Math.pow(1.26, i), dur: 0.25, type: 'sine', vol: 0.04, delay: 0.03 });
  },
  wave() {
    tone({ freq: 110, dur: 1.4, type: 'sawtooth', vol: 0.06, filter: 400, attack: 0.3, slide: 0.9 });
    tone({ freq: 82, dur: 1.6, type: 'sawtooth', vol: 0.05, filter: 300, attack: 0.4 });
  },
  dawn() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone({ freq: f, dur: 0.6, type: 'triangle', vol: 0.07, delay: i * 0.13 }));
  },

  // Música ambiental generativa: notas suaves de piano en una escala tranquila
  music(on) {
    musicOn = on;
    clearTimeout(musicTimer);
    if (!on) return;
    const scale = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
    const play = () => {
      if (!musicOn) return;
      if (!sfx.muted) {
        const chord = Math.random() < 0.35;
        const base = scale[Math.floor(Math.random() * 5)];
        const notes = chord ? [base, base * 1.5] : [scale[Math.floor(Math.random() * scale.length)]];
        notes.forEach((f, i) => {
          tone({ freq: f, dur: 2.6, type: 'triangle', vol: 0.028, attack: 0.01, delay: i * 0.18 });
          tone({ freq: f * 2, dur: 1.4, type: 'sine', vol: 0.008, attack: 0.01, delay: i * 0.18 });
        });
      }
      musicTimer = setTimeout(play, 1400 + Math.random() * 2600);
    };
    musicTimer = setTimeout(play, 800);
  },
};
