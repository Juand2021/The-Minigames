// Sonidos sintetizados (sin archivos) + vibración. El mute se recuerda en localStorage.
const KEY = 'juego-especial:muted';
let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem(KEY) === '1';
} catch {
  /* sin almacenamiento */
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, { dur = 0.12, type = 'sine', vol = 0.08, delay = 0, slide = 0 } = {}) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const buzz = (ms) => {
  if (muted || !navigator.vibrate) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate(ms);
};

export const sfx = {
  get muted() {
    return muted;
  },
  setMuted(v) {
    muted = v;
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* ignorar */
    }
  },
  tap() {
    tone(520, { dur: 0.05, vol: 0.04 });
  },
  place() {
    tone(660, { dur: 0.1, type: 'triangle' });
    buzz(8);
  },
  note() {
    tone(900, { dur: 0.04, vol: 0.03 });
  },
  erase() {
    tone(330, { dur: 0.08, type: 'triangle', vol: 0.05, slide: 0.7 });
  },
  error() {
    tone(180, { dur: 0.2, type: 'sawtooth', vol: 0.06, slide: 0.6 });
    buzz([30, 40, 30]);
  },
  hint() {
    [880, 1175, 1568].forEach((f, i) => tone(f, { dur: 0.18, delay: i * 0.07, vol: 0.05 }));
  },
  complete() {
    [523, 659, 784].forEach((f, i) => tone(f, { dur: 0.22, delay: i * 0.06, type: 'triangle' }));
    buzz(20);
  },
  // billar
  click(v) {
    tone(260 + Math.min(v, 450) * 1.3, { dur: 0.05, type: 'square', vol: Math.min(0.07, 0.008 + v / 9000) });
  },
  cushion(v) {
    tone(130, { dur: 0.09, type: 'triangle', vol: Math.min(0.07, 0.01 + v / 8000), slide: 0.6 });
  },
  pocket() {
    tone(240, { dur: 0.16, type: 'sine', vol: 0.08, slide: 0.45 });
    tone(150, { dur: 0.22, type: 'triangle', vol: 0.06, delay: 0.1, slide: 0.6 });
    buzz(15);
  },
  shot(p) {
    tone(80 + p * 70, { dur: 0.09, type: 'square', vol: 0.04 + p * 0.04 });
    buzz(10);
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(f, { dur: 0.45, delay: i * 0.12, type: 'triangle', vol: 0.09 }),
    );
    buzz([40, 60, 40, 60, 80]);
  },
};
