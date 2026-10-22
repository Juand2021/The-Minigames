import { LEVELS, UNLOCK_ALL } from '../config.js';
import { cover, intros, wins, loses } from '../content/story.js';
import { reward } from '../content/reward.js';
import { loadProgress, saveProgress, resetProgress } from './progress.js';
import { Timer, formatTime } from './timer.js';
import { burst } from '../games/shared/confetti.js';
import { mountPrize } from '../ui/prize.js';
import { icon, glyph } from '../ui/icons.js';
import sudoku from '../games/sudoku/index.js';
import crossword from '../games/crossword/index.js';
import pool from '../games/pool/index.js';
import craft from '../games/craft/index.js';
import gym from '../games/gym/index.js';

const GAMES = { sudoku, crossword, pool, craft, gym };
// Flecha de volver (SVG para que se vea nítida en cualquier pantalla)
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const timeLabel = (s) => (s == null ? 'Sin límite' : formatTime(s));

// Espera a que el navegador pinte (con un tope por si la pestaña está en segundo plano).
const nextPaint = () =>
  new Promise((resolve) => {
    let done = false;
    const fin = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(() => setTimeout(fin, 0));
    setTimeout(fin, 150);
  });

// Precarga en tiempo libre lo pesado de cada nivel (texturas, personajes…), una sola vez.
const warmed = new Set();
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 250));
function prewarm(id) {
  if (warmed.has(id) || !GAMES[id]?.prewarm) return;
  idle(() => {
    if (warmed.has(id)) return;
    warmed.add(id);
    try {
      GAMES[id].prewarm();
    } catch {
      /* si falla, el nivel lo prepara al abrirse */
    }
  });
}

export class GameShell {
  constructor(root) {
    this.root = root;
    this.progress = loadProgress();
    this.game = null;
    this.timer = null;
    this.stopConfetti = null;
    this.screen = 'cover';
    this.session = null; // partida en curso: { finished, frozen, held }
    this.wake = null;
    this.modal = null;

    // Si la app pasa a segundo plano (bloqueo, llamada…), el reloj se detiene y vuelve al regresar.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.timer?.pause();
      else {
        this.syncTimer();
        if (this.screen === 'play') this.keepAwake();
      }
    });
  }

  start() {
    // El botón "atrás" del celular navega dentro del juego en vez de cerrarlo.
    try {
      history.replaceState({ app: 'root' }, '');
      history.pushState({ app: 'game' }, '');
    } catch {
      /* sin historial disponible */
    }
    window.addEventListener('popstate', () => {
      try {
        history.pushState({ app: 'game' }, '');
      } catch {
        /* ignorar */
      }
      this.onBack();
    });
    if (location.search.includes('debug')) window.__shell = this; // solo pruebas
    this.showCover();
  }

  onBack() {
    if (this.modal) return this.modal.cancel();
    if (this.screen === 'play') return this.askQuit();
    if (this.screen === 'intro' || this.screen === 'result') return this.showMap();
    if (this.screen === 'map' || this.screen === 'final') return this.showCover();
  }

  render(html, screen) {
    this.cleanup();
    this.screen = screen;
    document.body.classList.toggle('playing', screen === 'play');
    this.root.innerHTML = `<main class="screen">${html}</main>`;
    return this.root.firstElementChild;
  }

  cleanup() {
    this.closeModal();
    this.timer?.stop();
    this.timer = null;
    this.session = null;
    this.game?.destroy();
    this.game = null;
    this.stopConfetti?.();
    this.stopConfetti = null;
    this.prize?.destroy();
    this.prize = null;
    this.releaseWake();
  }

  get allDone() {
    return this.progress.unlocked >= LEVELS.length;
  }

  levelState(i) {
    if (i < this.progress.unlocked) return 'done';
    if (i === this.progress.unlocked || UNLOCK_ALL) return 'open';
    return 'locked';
  }

  /* ---------- reloj y pantalla encendida ---------- */
  // El reloj corre solo si hay partida, no terminó, no está en pausa y la app está visible.
  syncTimer() {
    const s = this.session;
    if (!this.timer || !s) return;
    if (s.loading || s.finished || s.frozen || s.held || this.modal || document.hidden) this.timer.pause();
    else this.timer.resume();
  }

  async keepAwake() {
    try {
      if (!this.wake && navigator.wakeLock) this.wake = await navigator.wakeLock.request('screen');
      this.wake?.addEventListener?.('release', () => (this.wake = null));
    } catch {
      /* el navegador no lo permite: no pasa nada */
    }
  }

  releaseWake() {
    try {
      this.wake?.release();
    } catch {
      /* ignorar */
    }
    this.wake = null;
  }

  /* ---------- ventana de confirmación (vidrio) ---------- */
  confirm({ art = 'question', title, text, ok, cancel, danger = false }) {
    this.closeModal();
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'modal';
      el.innerHTML = `
        <div class="glass sheet" role="dialog" aria-modal="true">
          <div class="orb orb-sm">${icon(art)}</div>
          <h3>${title}</h3>
          <p>${text}</p>
          <div class="sheet-actions">
            <button class="btn btn-primary" data-r="cancel">${cancel}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-ghost'}" data-r="ok">${ok}</button>
          </div>
        </div>`;
      const finish = (val) => {
        if (this.modal?.el !== el) return;
        this.modal = null;
        el.classList.add('out');
        setTimeout(() => el.remove(), 220);
        this.syncTimer();
        resolve(val);
      };
      el.addEventListener('click', (e) => {
        const r = e.target.closest('[data-r]')?.dataset.r;
        if (r) finish(r === 'ok');
        else if (e.target === el) finish(false);
      });
      this.modal = { el, cancel: () => finish(false) };
      this.root.appendChild(el);
      this.syncTimer();
    });
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.el.remove();
    this.modal = null;
  }

  /* ---------- pantallas ---------- */
  showCover() {
    const done = Math.min(this.progress.unlocked, LEVELS.length);
    const pips = LEVELS.map((l, i) => {
      const st = i < done ? 'done' : i === done ? 'next' : 'locked';
      return `<span class="pip ${st}" title="${l.name}">${st === 'done' ? glyph('check') : icon(l.icon)}</span>`;
    }).join('');
    const label = this.allDone ? `Ver tu premio ${glyph('trophy')}` : done > 0 ? `Continuar ${glyph('play')}` : `${cover.button} ${glyph('play')}`;
    const note = done === 0 ? 'Tu aventura está por comenzar' : this.allDone ? `¡Superaste las ${LEVELS.length} pruebas!` : `${done} de ${LEVELS.length} pruebas superadas`;
    const el = this.render(
      `
      <div class="cover reveal">
        <div class="orb orb-xl">${icon('heart-violet')}</div>
        <p class="eyebrow">${cover.eyebrow}</p>
        <h1 class="display">${cover.title}</h1>
        <p class="lead">${cover.subtitle}</p>
        <div class="glass journey">
          <span class="panel-tag">PROGRESO</span>
          <div class="pips">${pips}</div>
          <p>${note}</p>
        </div>
        <div class="cover-actions">
          <button class="btn btn-primary" data-act="go">${label}</button>
          ${this.allDone ? '<button class="btn btn-ghost" data-act="map">Ver el camino</button>' : ''}
          ${done > 0 ? '<button class="btn btn-ghost" data-act="reset">Reiniciar progreso</button>' : ''}
        </div>
      </div>`,
      'cover',
    );
    el.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'go') this.allDone ? this.showFinal() : this.showMap();
      if (act === 'map') this.showMap();
      if (act === 'reset') {
        const yes = await this.confirm({
          art: 'broom',
          title: '¿Empezar de cero?',
          text: `Se borrará el progreso de las ${LEVELS.length} pruebas.`,
          ok: 'Sí, reiniciar',
          cancel: 'No, conservarlo',
          danger: true,
        });
        if (yes) {
          this.progress = resetProgress();
          this.showCover();
        }
      }
    });
  }

  showMap() {
    const done = Math.min(this.progress.unlocked, LEVELS.length);
    const items = LEVELS.map((l, i) => {
      const st = this.levelState(i);
      const label = st === 'done' ? `${glyph('check')} Superada` : st === 'locked' ? glyph('lock') : `Jugar ${glyph('play')}`;
      const current = i === this.progress.unlocked ? 'current' : '';
      return `<li style="--i:${i}">
        <button class="glass level node ${st} ${current}" data-i="${i}" ${st === 'locked' ? 'disabled aria-disabled="true"' : ''}>
          <span class="orb level-orb">${icon(l.icon)}</span>
          <span class="level-text"><b>${l.name}</b><small>${st === 'locked' ? 'Supera la anterior para abrirla' : l.tagline}</small></span>
          <span class="level-meta"><span class="state">${label}</span><span class="tile">${glyph('timer')} ${timeLabel(l.seconds)}</span></span>
        </button>
      </li>`;
    }).join('');
    const prize = this.allDone
      ? `<button class="glass level prize-card" data-act="prize"><span class="orb level-orb">${icon('trophy')}</span><span class="level-text"><b>Tu premio</b><small>¡Lo lograste! Toca para verlo</small></span></button>`
      : '';
    const el = this.render(
      `
      <header class="topbar reveal">
        <button class="glass icon-btn" data-act="home" aria-label="Volver al inicio">${BACK}</button>
        <div><h2>Tu camino</h2><p>${done} de ${LEVELS.length} pruebas superadas</p></div>
      </header>
      <div class="glass meter"><i style="width:${(done / LEVELS.length) * 100}%"></i></div>
      <ol class="path">${items}</ol>
      ${prize}`,
      'map',
    );
    LEVELS.forEach((l, i) => this.levelState(i) !== 'locked' && prewarm(l.id));
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-act=home]')) return this.showCover();
      if (e.target.closest('[data-act=prize]')) return this.showFinal();
      const btn = e.target.closest('.level.open, .level.done');
      if (btn?.dataset.i) this.showIntro(Number(btn.dataset.i));
    });
  }

  showIntro(i) {
    const lvl = LEVELS[i];
    if (this.levelState(i) === 'locked') return this.showMap();
    const el = this.render(
      `
      <header class="topbar">
        <button class="glass icon-btn" data-act="back" aria-label="Volver al mapa">${BACK}</button>
      </header>
      <div class="intro reveal">
        <div class="orb orb-xl">${icon(lvl.icon)}</div>
        <p class="ribbon"><span>PRUEBA ${i + 1}<i>/</i>${LEVELS.length}</span></p>
        <h2 class="display-sm">${lvl.name}</h2>
        <div class="briefing">
          <span class="panel-tag">MISIÓN</span>
          <p>${intros[lvl.id]}</p>
        </div>
        <div class="stats">
          <div class="stat"><span class="stat-ic">${glyph('timer')}</span><span class="stat-l">TIEMPO</span><b>${timeLabel(lvl.seconds)}</b></div>
          <div class="stat"><span class="stat-ic">${glyph('target')}</span><span class="stat-l">OBJETIVO</span><b>${lvl.tagline}</b></div>
        </div>
        <div class="actions"><button class="btn btn-primary btn-go" data-act="go">¡Vamos! ${glyph('play')}</button></div>
      </div>`,
      'intro',
    );
    prewarm(lvl.id);
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'go') {
        const b = e.target.closest('[data-act=go]');
        if (b.disabled) return;
        b.disabled = true;
        b.classList.add('is-loading');
        this.play(i);
      }
      if (act === 'back') this.showMap();
    });
  }

  async play(i) {
    const lvl = LEVELS[i];
    const el = this.render(
      `
      <header class="glass hud">
        <button class="hud-btn" data-act="quit" aria-label="Salir">${glyph('close')}</button>
        <span class="hud-name">${lvl.name}</span>
        <span class="hud-time" id="time">${formatTime(lvl.seconds)}</span>
      </header>
      <section class="stage" id="stage">
        <div class="veil" aria-live="polite">
          <div class="glass veil-card">
            <div class="orb orb-lg">${icon(lvl.icon)}</div>
            <p>Preparando <b>${lvl.name}</b></p>
            <span class="veil-bar"><i></i></span>
          </div>
        </div>
      </section>`,
      'play',
    );
    // Mientras carga: el reloj no corre y la pantalla de carga absorbe los toques (no se salta la cinemática).
    const session = { finished: false, frozen: false, held: false, loading: true, level: i };
    this.session = session;
    const live = () => this.session === session;
    // Cada final (ganar, perder, tiempo) se acepta una sola vez y solo de la partida actual.
    const end = (won, reason) => {
      if (!live() || session.finished) return;
      session.finished = true;
      this.syncTimer();
      this.showResult(i, won, reason);
    };
    const timeEl = el.querySelector('#time');
    if (lvl.seconds != null) {
      this.timer = new Timer(
        lvl.seconds,
        (s) => {
          timeEl.textContent = formatTime(s);
          timeEl.classList.toggle('urgent', s <= 30);
        },
        () => end(false),
      );
    }
    el.querySelector('[data-act="quit"]').addEventListener('click', () => this.askQuit());
    const veil = el.querySelector('.veil');
    await nextPaint(); // primero se ve la pantalla de carga
    if (!live()) return;
    this.game = GAMES[lvl.id]();
    let markReady;
    const ready = new Promise((r) => (markReady = r));
    const ctx = {
      // se cumple cuando la pantalla de carga se va: las cinemáticas empiezan a escribir recién ahí
      ready,
      win: () => end(true),
      lose: (reason) => end(false, reason),
      // El juego ya está resuelto (animación de victoria): el reloj se detiene para no perder por segundos.
      freeze: () => {
        if (!live()) return;
        session.frozen = true;
        this.syncTimer();
      },
      // Pausa el reloj mientras hay una cinemática (no cuenta el tiempo de lectura).
      hold: (on) => {
        if (!live()) return;
        session.held = !!on;
        this.syncTimer();
      },
    };
    if (location.search.includes('debug')) window.__ctx = ctx; // solo pruebas
    this.game.mount(el.querySelector('#stage'), ctx);
    this.timer?.start();
    this.syncTimer();
    this.keepAwake();
    await nextPaint(); // el juego ya pintó su primer cuadro
    if (!live()) return;
    session.loading = false;
    this.syncTimer();
    veil.classList.add('gone');
    markReady();
    setTimeout(() => veil.remove(), 400);
  }

  async askQuit() {
    if (this.screen !== 'play' || this.modal) return;
    const lvl = LEVELS[this.session?.level ?? 0];
    const yes = await this.confirm({
      art: 'door',
      title: '¿Salir de la prueba?',
      text:
        lvl.seconds == null
          ? 'Perderás el avance de esta partida y tendrás que empezarla de nuevo.'
          : 'El reloj se reinicia y tendrás que empezar la prueba de nuevo.',
      ok: 'Salir',
      cancel: 'Seguir jugando',
      danger: true,
    });
    if (yes && this.screen === 'play') this.showMap();
  }

  showResult(i, won, reason) {
    const lvl = LEVELS[i];
    this.progress.attempts[lvl.id] = (this.progress.attempts[lvl.id] || 0) + 1;
    if (won && this.progress.unlocked === i) this.progress.unlocked = i + 1;
    saveProgress(this.progress);
    const msg = won ? wins[lvl.id] : reason || loses[Math.floor(Math.random() * loses.length)];
    const last = won && i === LEVELS.length - 1;
    const next = LEVELS[i + 1];
    const tries = this.progress.attempts[lvl.id];
    let actions;
    if (!won) {
      actions = `<button class="btn btn-primary" data-act="retry">Reintentar ${glyph('retry')}</button>
        <button class="btn btn-ghost" data-act="map">Volver al mapa</button>`;
    } else if (last || this.allDone) {
      actions = `<button class="btn btn-primary" data-act="final">Ver tu premio ${glyph('trophy')}</button>
        <button class="btn btn-ghost" data-act="map">Ver el camino</button>`;
    } else {
      actions = `<button class="btn btn-primary" data-act="next">Siguiente: ${next.name} ${glyph('play')}</button>
        <button class="btn btn-ghost" data-act="map">Ver el camino</button>`;
    }
    const el = this.render(
      `
      <div class="result ${won ? 'win' : 'lose'} reveal">
        <div class="orb orb-xl">${icon(won ? 'party' : reason ? 'broken-heart' : 'alarm')}</div>
        <p class="eyebrow">${lvl.name}</p>
        <h2 class="display-sm">${won ? '¡Ganaste!' : reason ? 'Perdiste' : 'Tiempo agotado'}</h2>
        <p class="glass bubble">${msg}</p>
        <div class="stats single"><div class="stat"><span class="stat-ic">${glyph(won ? 'star' : 'retry')}</span><span class="stat-l">INTENTO</span><b>N.º ${tries}</b></div></div>
        <div class="actions">${actions}</div>
      </div>`,
      'result',
    );
    if (won) this.stopConfetti = burst(this.root, { count: 110, duration: 3000 });
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'map') this.showMap();
      if (act === 'retry') this.play(i);
      if (act === 'next') this.showIntro(i + 1);
      if (act === 'final') this.showFinal();
    });
  }

  showFinal() {
    if (!this.allDone && !UNLOCK_ALL) return this.showMap();
    const el = this.render(
      `
      <div class="final">
        <p class="eyebrow">Las ${LEVELS.length} pruebas superadas</p>
        <h1 class="display">${reward.title}</h1>
        <div class="final-prize"></div>
        <div class="final-actions">
          <button class="btn btn-ghost" data-act="map">Ver el camino</button>
          <button class="btn btn-ghost" data-act="back">Inicio</button>
        </div>
      </div>`,
      'final',
    );
    // El premio: un bloque "?" que hay que romper a golpes
    this.prize = mountPrize(el.querySelector('.final-prize'));
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'back') this.showCover();
      if (act === 'map') this.showMap();
    });
  }
}
