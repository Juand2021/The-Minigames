// Confeti y corazones en un <canvas> superpuesto. Devuelve una función para cancelar.
const COLORS = ['#ff6fb5', '#ffd166', '#5ee6a8', '#7ec8ff', '#c79bff', '#fff6ff'];

export function burst(container, { count = 140, duration = 3200 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '20',
  });
  container.appendChild(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);

  const parts = Array.from({ length: count }, () => {
    const heart = Math.random() < 0.18;
    return {
      x: w / 2,
      y: h * 0.45,
      vx: (Math.random() - 0.5) * 11,
      vy: -Math.random() * 11 - 3,
      size: heart ? 14 + Math.random() * 10 : 5 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      heart,
    };
  });

  const start = performance.now();
  let raf = 0;
  let stopped = false;

  const frame = (now) => {
    const t = now - start;
    g.clearRect(0, 0, w, h);
    const fade = t > duration - 800 ? Math.max(0, (duration - t) / 800) : 1;
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      g.save();
      g.globalAlpha = fade;
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      if (p.heart) {
        g.font = `${p.size}px serif`;
        g.textAlign = 'center';
        g.fillText('💜', 0, 0);
      } else {
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      g.restore();
    }
    if (t < duration && !stopped) raf = requestAnimationFrame(frame);
    else stop();
  };

  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    canvas.remove();
  }

  raf = requestAnimationFrame(frame);
  return stop;
}
