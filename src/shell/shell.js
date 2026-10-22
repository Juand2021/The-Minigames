import { LEVELS, UNLOCK_ALL } from '../config.js';
import { cover, intros, wins, loses } from '../content/story.js';
import { reward } from '../content/reward.js';
import { loadProgress, saveProgress, resetProgress } from './progress.js';
import { Timer, formatTime } from './timer.js';
import { burst } from '../games/shared/confetti.js';
import sudoku from '../games/sudoku/index.js';
import crossword from '../games/crossword/index.js';
import pool from '../games/pool/index.js';
import craft from '../games/craft/index.js';

const GAMES = { sudoku, crossword, pool, craft };
// Flecha de volver (SVG para que se vea nítida en cualquier pantalla)
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const timeLabel = (s) => (s == null ? 'Sin límite' : formatTime(s));

export class GameShell {
  constructor(root) {
    this.root = root;
    this.progress = loadProgress();
    this.game = null;
    this.timer = null;
    this.stopConfetti = null;
  }

  start() {
    this.showCover();
  }

  render(html, { playing = false } = {}) {
    this.cleanup();
    document.body.classList.toggle('playing', playing);
    this.root.innerHTML = `<main class="screen">${html}</main>`;
    return this.root.firstElementChild;
  }

  cleanup() {
    this.timer?.stop();
    this.timer = null;
    this.game?.destroy();
    this.game = null;
    this.stopConfetti?.();
    this.stopConfetti = null;
  }

  levelState(i) {
    if (i < this.progress.unlocked) return 'done';
    if (i === this.progress.unlocked || UNLOCK_ALL) return 'open';
    return 'locked';
  }

  showCover() {
    const done = this.progress.unlocked;
    const pips = LEVELS.map((l, i) => {
      const st = i < done ? 'done' : i === done ? 'next' : 'locked';
      return `<span class="pip ${st}" title="${l.name}">${st === 'done' ? '✅' : l.icon}</span>`;
    }).join('');
    const el = this.render(`
      <div class="cover reveal">
        <div class="orb orb-xl"><span>💜</span></div>
        <p class="eyebrow">${cover.eyebrow}</p>
        <h1 class="display">${cover.title}</h1>
        <p class="lead">${cover.subtitle}</p>
        <div class="glass journey">
          <div class="pips">${pips}</div>
          <p>${done === 0 ? 'Tu aventura está por comenzar' : `${done} de ${LEVELS.length} pruebas superadas`}</p>
        </div>
        <div class="cover-actions">
          <button class="btn btn-primary" data-act="go">${done > 0 ? 'Continuar ▸' : `${cover.button} ▸`}</button>
          ${done > 0 ? '<button class="btn btn-ghost" data-act="reset">Reiniciar progreso</button>' : ''}
        </div>
      </div>`);
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'go') this.showMap();
      if (act === 'reset' && confirm('¿Borrar el progreso?')) {
        this.progress = resetProgress();
        this.showCover();
      }
    });
  }

  showMap() {
    if (!UNLOCK_ALL && this.progress.unlocked >= LEVELS.length) return this.showFinal();
    const done = Math.min(this.progress.unlocked, LEVELS.length);
    const items = LEVELS.map((l, i) => {
      const st = this.levelState(i);
      const label = st === 'done' ? '✓ Superada' : st === 'locked' ? '🔒' : 'Jugar ▸';
      const current = i === this.progress.unlocked ? 'current' : '';
      return `<li style="--i:${i}">
        <button class="glass level node ${st} ${current}" data-i="${i}" ${st === 'locked' ? 'disabled' : ''}>
          <span class="orb level-orb">${l.icon}</span>
          <span class="level-text"><b>${l.name}</b><small>${l.tagline}</small></span>
          <span class="level-meta"><span class="state">${label}</span><span class="chip">⏱ ${timeLabel(l.seconds)}</span></span>
        </button>
      </li>`;
    }).join('');
    const el = this.render(`
      <header class="topbar reveal">
        <button class="glass icon-btn" data-act="home" aria-label="Volver al inicio">${BACK}</button>
        <div><h2>Tu camino</h2><p>${done} de ${LEVELS.length} pruebas superadas</p></div>
      </header>
      <div class="glass meter"><i style="width:${(done / LEVELS.length) * 100}%"></i></div>
      <ol class="path">${items}</ol>`);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-act=home]')) return this.showCover();
      const btn = e.target.closest('.level.open, .level.done');
      if (btn) this.showIntro(Number(btn.dataset.i));
    });
  }

  showIntro(i) {
    const lvl = LEVELS[i];
    const el = this.render(`
      <header class="topbar">
        <button class="glass icon-btn" data-act="back" aria-label="Volver al mapa">${BACK}</button>
      </header>
      <div class="intro reveal">
        <div class="orb orb-xl">${lvl.icon}</div>
        <p class="eyebrow">Prueba ${i + 1} de ${LEVELS.length}</p>
        <h2 class="display-sm">${lvl.name}</h2>
        <p class="glass bubble">${intros[lvl.id]}</p>
        <div class="chips"><span class="chip">⏱ ${timeLabel(lvl.seconds)}</span><span class="chip">🎯 ${lvl.tagline}</span></div>
        <div class="actions"><button class="btn btn-primary" data-act="go">¡Vamos! ▸</button></div>
      </div>`);
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'go') this.play(i);
      if (act === 'back') this.showMap();
    });
  }

  play(i) {
    const lvl = LEVELS[i];
    const el = this.render(
      `
      <header class="glass hud">
        <button class="hud-btn" data-act="quit" aria-label="Salir">✕</button>
        <span class="hud-name">${lvl.icon} ${lvl.name}</span>
        <span class="hud-time" id="time">${formatTime(lvl.seconds)}</span>
      </header>
      <section class="stage" id="stage"></section>`,
      { playing: true },
    );
    const timeEl = el.querySelector('#time');
    this.timer =
      lvl.seconds == null
        ? null
        : new Timer(
            lvl.seconds,
            (s) => {
              timeEl.textContent = formatTime(s);
              timeEl.classList.toggle('urgent', s <= 30);
            },
            () => this.showResult(i, false),
          );
    this.game = GAMES[lvl.id]();
    this.game.mount(el.querySelector('#stage'), {
      win: () => this.showResult(i, true),
      lose: (reason) => this.showResult(i, false, reason),
    });
    this.timer?.start();
    el.querySelector('[data-act="quit"]').addEventListener('click', () => {
      if (confirm('¿Salir del nivel? El tiempo se reinicia.')) this.showMap();
    });
  }

  showResult(i, won, reason) {
    const lvl = LEVELS[i];
    this.progress.attempts[lvl.id] = (this.progress.attempts[lvl.id] || 0) + 1;
    if (won && this.progress.unlocked === i) this.progress.unlocked = i + 1;
    saveProgress(this.progress);
    const msg = won ? wins[lvl.id] : reason || loses[Math.floor(Math.random() * loses.length)];
    const last = won && i === LEVELS.length - 1;
    const tries = this.progress.attempts[lvl.id];
    const el = this.render(`
      <div class="result ${won ? 'win' : 'lose'} reveal">
        <div class="orb orb-xl">${won ? '🎉' : reason ? '💔' : '⏰'}</div>
        <p class="eyebrow">${lvl.icon} ${lvl.name}</p>
        <h2 class="display-sm">${won ? '¡Ganaste!' : reason ? 'Perdiste' : 'Tiempo agotado'}</h2>
        <p class="glass bubble">${msg}</p>
        <div class="chips"><span class="chip">${won ? '🏅' : '🔁'} Intento ${tries}</span></div>
        <div class="actions">
          <button class="btn btn-primary" data-act="next">${won ? (last ? 'Ver premio 🏆' : 'Continuar ▸') : 'Reintentar ▸'}</button>
          ${won ? '' : '<button class="btn btn-ghost" data-act="map">Volver al mapa</button>'}
        </div>
      </div>`);
    if (won) this.stopConfetti = burst(this.root, { count: 110, duration: 3000 });
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'map') this.showMap();
      if (act === 'next') {
        if (!won) this.play(i);
        else last ? this.showFinal() : this.showMap();
      }
    });
  }

  showFinal() {
    const el = this.render(`
      <div class="result win reveal">
        <div class="orb orb-xl">🏆</div>
        <p class="eyebrow">Las 4 pruebas superadas</p>
        <h1 class="display">${reward.title}</h1>
        <p class="glass bubble">${reward.message}</p>
        <p class="glass prize">${reward.detail}</p>
        <div class="actions"><button class="btn btn-ghost" data-act="back">Volver al inicio</button></div>
      </div>`);
    this.stopConfetti = burst(this.root, { count: 160, duration: 4200 });
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-act=back]')) this.showCover();
    });
  }
}
