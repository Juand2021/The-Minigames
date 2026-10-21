// Cuenta regresiva basada en la hora real (no se desfasa si la pestaña se congela).
export class Timer {
  constructor(seconds, onTick, onEnd) {
    this.total = seconds * 1000;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.remaining = this.total;
    this.id = null;
  }

  start() {
    this.stop();
    this.last = performance.now();
    this.tick();
    this.id = setInterval(() => this.tick(), 250);
  }

  tick() {
    const now = performance.now();
    this.remaining -= now - this.last;
    this.last = now;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.onTick(0);
      this.stop();
      this.onEnd();
      return;
    }
    this.onTick(Math.ceil(this.remaining / 1000));
  }

  pause() {
    if (this.id === null) return;
    this.tick();
    this.stop();
  }

  resume() {
    if (this.id !== null || this.remaining <= 0) return;
    this.last = performance.now();
    this.id = setInterval(() => this.tick(), 250);
  }

  stop() {
    clearInterval(this.id);
    this.id = null;
  }
}

export const formatTime = (s) =>
  s == null ? '∞' :
  `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;
