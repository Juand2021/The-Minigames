import { LEVELS, UNLOCK_ALL } from '../config.js';
import { cover, intros, wins, loses } from '../content/story.js';
import { reward } from '../content/reward.js';
import { loadProgress, saveProgress, resetProgress } from './progress.js';
import { Timer, formatTime } from './timer.js';
import sudoku from '../games/sudoku/index.js';
import crossword from '../games/crossword/index.js';
import pool from '../games/pool/index.js';
import craft from '../games/craft/index.js';

const GAMES = { sudoku, crossword, pool, craft };

export class GameShell {
  constructor(root) {
    this.root = root;
    this.progress = loadProgress();
    this.game = null;
    this.timer = null;
  }

  start() {
    this.showCover();
  }

  render(html) {
    this.cleanup();
    this.root.innerHTML = `<main class="screen">${html}</main>`;
    return this.root.firstElementChild;
  }

  cleanup() {
    this.timer?.stop();
    this.timer = null;
    this.game?.destroy();
    this.game = null;
  }

  showCover() {
    const el = this.render(`
      <div class="center">
        <div class="heart">💜</div>
        <h1>${cover.title}</h1>
        <p class="sub">${cover.subtitle}</p>
        <button class="btn" data-act="go">${this.progress.unlocked > 0 ? 'Continuar' : cover.button}</button>
        ${this.progress.unlocked > 0 ? '<button class="btn btn-ghost" data-act="reset">Reiniciar</button>' : ''}
      </div>`);
    el.addEventListener('click', (e) => {
      const act = e.target.dataset?.act;
      if (act === 'go') this.showMap();
      if (act === 'reset' && confirm('¿Borrar el progreso?')) {
        this.progress = resetProgress();
        this.showCover();
      }
    });
  }

  showMap() {
    if (!UNLOCK_ALL && this.progress.unlocked >= LEVELS.length) return this.showFinal();
    const nodes = LEVELS.map((l, i) => {
      const state = i < this.progress.unlocked ? 'done' : i === this.progress.unlocked || UNLOCK_ALL ? 'open' : 'locked';
      const mark = state === 'done' ? '✅' : state === 'locked' ? '🔒' : l.icon;
      return `<button class="node ${state}" data-i="${i}" ${state === 'locked' ? 'disabled' : ''}>
        <span class="node-icon">${mark}</span>
        <span class="node-name">${l.name}</span>
        <span class="node-time">${formatTime(l.seconds)}</span>
      </button>`;
    }).join('');
    const el = this.render(`<h2 class="title">Tu camino</h2><div class="map">${nodes}</div>`);
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('.node.open, .node.done');
      if (btn) this.showIntro(Number(btn.dataset.i));
    });
  }

  showIntro(i) {
    const lvl = LEVELS[i];
    const el = this.render(`
      <div class="center">
        <div class="big">${lvl.icon}</div>
        <h2>${lvl.name}</h2>
        <p class="bubble">${intros[lvl.id]}</p>
        <p class="sub">Tiempo: ${formatTime(lvl.seconds)}</p>
        <button class="btn" data-act="go">¡Vamos!</button>
        <button class="btn btn-ghost" data-act="back">Volver</button>
      </div>`);
    el.addEventListener('click', (e) => {
      const act = e.target.dataset?.act;
      if (act === 'go') this.play(i);
      if (act === 'back') this.showMap();
    });
  }

  play(i) {
    const lvl = LEVELS[i];
    const el = this.render(`
      <header class="hud">
        <button class="hud-btn" data-act="quit" aria-label="Salir">✕</button>
        <span class="hud-name">${lvl.icon} ${lvl.name}</span>
        <span class="hud-time" id="time">${formatTime(lvl.seconds)}</span>
      </header>
      <section class="stage" id="stage"></section>`);
    const timeEl = el.querySelector('#time');
    this.timer = new Timer(
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
    this.timer.start();
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
    const el = this.render(`
      <div class="center">
        <div class="big">${won ? '🎉' : '⏰'}</div>
        <h2>${won ? '¡Ganaste!' : reason ? 'Perdiste' : 'Tiempo agotado'}</h2>
        <p class="bubble">${msg}</p>
        <button class="btn" data-act="next">${won ? (last ? 'Ver premio' : 'Continuar') : 'Reintentar'}</button>
        ${won ? '' : '<button class="btn btn-ghost" data-act="map">Mapa</button>'}
      </div>`);
    el.addEventListener('click', (e) => {
      const act = e.target.dataset?.act;
      if (act === 'map') this.showMap();
      if (act === 'next') {
        if (!won) this.play(i);
        else last ? this.showFinal() : this.showMap();
      }
    });
  }

  showFinal() {
    const el = this.render(`
      <div class="center">
        <div class="big">🏆</div>
        <h1>${reward.title}</h1>
        <p class="bubble">${reward.message}</p>
        <p class="prize">${reward.detail}</p>
        <button class="btn btn-ghost" data-act="back">Volver al inicio</button>
      </div>`);
    el.addEventListener('click', (e) => {
      if (e.target.dataset?.act === 'back') this.showCover();
    });
  }
}
