import './crossword.css';
import { layout } from '../../content/crosswordLayout.js';
import { crosswordToasts } from '../../content/story.js';
import { sfx } from '../shared/sfx.js';
import { burst } from '../shared/confetti.js';
import { icon } from '../../ui/icons.js';
import { callHelper } from '../../ui/helper.js';

const HINTS = 5;
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const DIR_NAME = { A: 'Horizontal', D: 'Vertical' };

export function createCrossword() {
  const { rows, cols } = layout;
  const idx = (r, c) => r * cols + c;

  // Palabras con sus casillas y mapa casilla → palabras que la cruzan.
  const words = layout.words.map((w, n) => ({
    ...w,
    n,
    cells: Array.from({ length: w.answer.length }, (_, k) =>
      w.dir === 'A' ? idx(w.r, w.c + k) : idx(w.r + k, w.c),
    ),
  }));
  const solution = new Map();
  const cellWords = new Map();
  const numberAt = new Map();
  for (const w of words) {
    numberAt.set(idx(w.r, w.c), w.num);
    w.cells.forEach((i, k) => {
      solution.set(i, w.answer[k]);
      cellWords.set(i, { ...(cellWords.get(i) || {}), [w.dir]: w });
    });
  }

  let root, ctx, grid, cursor, toastEl, clueEl, sheet;
  let cellEls = new Map();
  let btn = {};
  let state;
  let stopConfetti = null;
  let observer = null;
  const timeouts = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
  };

  /* ---------- construcción ---------- */
  function build() {
    state = {
      letters: new Map(),
      revealed: new Set(),
      wrong: new Set(),
      doneWords: new Set(),
      sel: -1,
      dir: 'A',
      hints: HINTS,
      over: false,
      lastWord: null,
    };

    root = document.createElement('div');
    root.className = 'cw enter';
    root.style.setProperty('--cols', cols);
    root.style.setProperty('--rows', rows);

    let cellsHtml = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = idx(r, c);
        if (!solution.has(i)) {
          cellsHtml += '<div class="cwv"></div>';
          continue;
        }
        const num = numberAt.get(i);
        cellsHtml += `<button class="cwc" data-i="${i}" style="--d:${(r + c) * 22}ms" aria-label="Fila ${r + 1}, columna ${c + 1}">${
          num ? `<em class="cwn">${num}</em>` : ''
        }<span class="cwch"></span></button>`;
      }
    }

    const kb = ROWS.map(
      (row, n) =>
        `<div class="kb-row">${[...row]
          .map((k, j) => `<button class="cwk" data-k="${k}" style="--d:${(n * 10 + j) * 18}ms">${k}</button>`)
          .join('')}${n === 2 ? `<button class="cwk wide" data-act="back" aria-label="Borrar">${icon('backspace')}</button>` : ''}</div>`,
    ).join('');

    const list = (dir) =>
      words
        .filter((w) => w.dir === dir)
        .map((w) => `<li data-n="${w.n}"><b>${w.num}</b><span>${w.clue}</span></li>`)
        .join('');

    root.innerHTML = `
      <div class="cw-toast" aria-live="polite"></div>
      <div class="cw-clue">
        <button class="cw-nav" data-act="prev" aria-label="Pista anterior">${icon('chev-l')}</button>
        <div class="cw-clue-body"><small></small><p></p></div>
        <button class="cw-nav" data-act="next" aria-label="Pista siguiente">${icon('chev-r')}</button>
      </div>
      <div class="cw-main"><div class="cw-grid"><div class="cw-cursor"></div>${cellsHtml}</div></div>
      <div class="cw-tools">
        <button class="cwt" data-act="list"><span>${icon('clipboard')}</span><em>Pistas</em></button>
        <button class="cwt" data-act="check"><span>${icon('check')}</span><em>Revisar</em></button>
        <button class="cwt" data-act="reveal"><span>${icon('bulb')}</span><em>Letra</em><u>${HINTS}</u></button>
        <button class="cwt" data-act="sound"><span>${icon(sfx.muted ? 'speaker-off' : 'speaker-on')}</span><em>Sonido</em></button>
      </div>
      <div class="cw-kb">${kb}</div>
      <div class="cw-sheet" hidden>
        <div class="cw-sheet-card">
          <header><h3>Pistas</h3><button class="cw-x" data-act="close" aria-label="Cerrar">✕</button></header>
          <div class="cw-sheet-body">
            <h4>Horizontales</h4><ol>${list('A')}</ol>
            <h4>Verticales</h4><ol>${list('D')}</ol>
          </div>
        </div>
      </div>`;

    grid = root.querySelector('.cw-grid');
    cursor = root.querySelector('.cw-cursor');
    toastEl = root.querySelector('.cw-toast');
    clueEl = root.querySelector('.cw-clue-body');
    sheet = root.querySelector('.cw-sheet');
    cellEls = new Map([...root.querySelectorAll('.cwc')].map((el) => [Number(el.dataset.i), el]));
    btn = {
      reveal: root.querySelector('[data-act=reveal]'),
      sound: root.querySelector('[data-act=sound]'),
    };
  }

  /* ---------- feedback ---------- */
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
  }

  function flash(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  const activeWord = () => (state.sel >= 0 ? cellWords.get(state.sel)?.[state.dir] || null : null);

  /* ---------- pintado ---------- */
  function refresh() {
    const word = activeWord();
    const inWord = new Set(word ? word.cells : []);
    for (const [i, el] of cellEls) {
      const ch = state.letters.get(i) || '';
      const span = el.lastElementChild;
      if (span.textContent !== ch) span.textContent = ch;
      el.classList.toggle('sel', i === state.sel);
      el.classList.toggle('inword', inWord.has(i) && i !== state.sel);
      el.classList.toggle('filled', ch !== '');
      el.classList.toggle('wrong', state.wrong.has(i));
      el.classList.toggle('revealed', state.revealed.has(i));
    }

    // Barra de pista (anima solo al cambiar de palabra)
    if (word) {
      clueEl.firstElementChild.textContent = `${word.num} · ${DIR_NAME[word.dir]} · ${word.answer.length} letras`;
      clueEl.lastElementChild.textContent = word.clue;
      if (state.lastWord !== word.n) flash(clueEl, 'swap');
      state.lastWord = word.n;
    } else {
      clueEl.firstElementChild.textContent = 'Toca una casilla para empezar';
      clueEl.lastElementChild.textContent = '';
    }
    clueEl.classList.toggle('done', !!word && state.doneWords.has(word.n));

    btn.reveal.lastElementChild.textContent = String(state.hints);
    btn.reveal.disabled = state.hints === 0;
    sheet.querySelectorAll('li').forEach((li) => li.classList.toggle('done', state.doneWords.has(Number(li.dataset.n))));
    moveCursor();
  }

  function moveCursor() {
    if (state.sel < 0) {
      cursor.style.opacity = '0';
      return;
    }
    cursor.style.opacity = '1';
    cursor.style.transform = `translate(${(state.sel % cols) * 100}%, ${Math.floor(state.sel / cols) * 100}%)`;
  }

  /* ---------- selección ---------- */
  function select(i) {
    if (state.over) return;
    const cw = cellWords.get(i);
    if (!cw) return;
    if (i === state.sel && cw.A && cw.D) state.dir = state.dir === 'A' ? 'D' : 'A';
    else if (!cw[state.dir]) state.dir = cw.A ? 'A' : 'D';
    state.sel = i;
    sfx.tap();
    refresh();
  }

  function goToWord(w, silent) {
    if (state.over) return;
    state.dir = w.dir;
    const target = w.cells.find((i) => !state.letters.get(i)) ?? w.cells[0];
    state.sel = target;
    if (!silent) sfx.tap();
    refresh();
  }

  function step(delta) {
    const w = activeWord() || words[0];
    const next = words[(w.n + delta + words.length) % words.length];
    goToWord(next);
  }

  /* ---------- escritura ---------- */
  function advance() {
    const w = activeWord();
    if (!w) return;
    const pos = w.cells.indexOf(state.sel);
    const after = w.cells.slice(pos + 1);
    const next = after.find((i) => !state.letters.get(i)) ?? after[0];
    if (next !== undefined) state.sel = next;
  }

  function type(ch) {
    const i = state.sel;
    if (state.over) return;
    if (i < 0) return toast(crosswordToasts.pickFirst);
    if (!state.revealed.has(i)) {
      state.letters.set(i, ch);
      state.wrong.delete(i);
      flash(cellEls.get(i), 'pop');
      sfx.place();
    }
    advance();
    refresh();
    checkWords(i);
    checkWin();
  }

  function backspace() {
    if (state.over || state.sel < 0) return;
    const i = state.sel;
    if (state.letters.get(i) && !state.revealed.has(i)) {
      state.letters.delete(i);
      state.wrong.delete(i);
    } else {
      const w = activeWord();
      const pos = w ? w.cells.indexOf(i) : -1;
      if (pos > 0) {
        const prev = w.cells[pos - 1];
        state.sel = prev;
        if (!state.revealed.has(prev)) {
          state.letters.delete(prev);
          state.wrong.delete(prev);
        }
      }
    }
    sfx.erase();
    refresh();
  }

  /* ---------- verificación ---------- */
  function wordCorrect(w) {
    return w.cells.every((i) => state.letters.get(i) === solution.get(i));
  }

  function checkWords(origin) {
    const cw = cellWords.get(origin);
    let any = false;
    for (const w of [cw.A, cw.D]) {
      if (!w) continue;
      if (wordCorrect(w)) {
        if (!state.doneWords.has(w.n)) {
          state.doneWords.add(w.n);
          any = true;
          w.cells.forEach((i, k) => {
            cellEls.get(i).style.setProperty('--w', `${k * 70}ms`);
            flash(cellEls.get(i), 'wave');
          });
        }
      } else state.doneWords.delete(w.n);
    }
    if (any) {
      sfx.complete();
      toast(pick(crosswordToasts.word));
      refresh();
    }
  }

  function check() {
    if (state.over) return;
    state.wrong.clear();
    for (const [i, ch] of state.letters) if (ch !== solution.get(i)) state.wrong.add(i);
    refresh();
    if (state.wrong.size) {
      sfx.error();
      flash(grid, 'shake');
      toast(pick(crosswordToasts.wrong));
    } else {
      sfx.hint();
      toast(crosswordToasts.allGood);
    }
  }

  function reveal() {
    if (state.over || state.hints === 0) return;
    let i = state.sel;
    const bad = (k) => state.letters.get(k) !== solution.get(k);
    if (i < 0 || !bad(i)) {
      const w = activeWord();
      const pool = (w ? w.cells : [...solution.keys()]).filter(bad);
      const any = pool.length ? pool : [...solution.keys()].filter(bad);
      if (!any.length) return;
      i = pick(any);
    }
    state.hints--;
    state.letters.set(i, solution.get(i));
    state.revealed.add(i);
    state.wrong.delete(i);
    state.sel = i;
    refresh();
    flash(cellEls.get(i), 'pop');
    sfx.hint();
    toast(pick(crosswordToasts.hint));
    checkWords(i);
    checkWin();
  }

  // Laura pide una letra: una mascota llega, se lo dice y la revela.
  let helping = false;
  let gone = false;
  async function askPet() {
    if (helping || state.over || state.hints === 0) return;
    helping = true;
    await callHelper(root, ctx, () => !gone && reveal());
    helping = false;
  }

  function toggleSound() {
    sfx.setMuted(!sfx.muted);
    btn.sound.firstElementChild.innerHTML = icon(sfx.muted ? 'speaker-off' : 'speaker-on');
    sfx.tap();
  }

  function checkWin() {
    if (state.over) return;
    for (const [i, ch] of solution) if (state.letters.get(i) !== ch) return;
    state.over = true;
    ctx.freeze?.(); // completo: el reloj ya no corre durante la celebración
    state.sel = -1;
    refresh();
    root.classList.add('won');
    for (const [i, el] of cellEls) {
      const d = Math.abs(Math.floor(i / cols) - rows / 2) + Math.abs((i % cols) - cols / 2);
      el.style.setProperty('--w', `${d * 55}ms`);
      flash(el, 'wave');
    }
    sfx.win();
    toast(crosswordToasts.win);
    stopConfetti = burst(root);
    later(() => ctx.win(), 2400);
  }

  /* ---------- entrada ---------- */
  function onPointer(e) {
    const cell = e.target.closest('.cwc');
    if (cell) return select(Number(cell.dataset.i));
    const key = e.target.closest('.cwk');
    if (key) {
      if (key.dataset.act === 'back') backspace();
      else type(key.dataset.k);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'prev') step(-1);
    else if (act === 'next') step(1);
    else if (act === 'check') check();
    else if (act === 'reveal') askPet();
    else if (act === 'sound') toggleSound();
    else if (act === 'list') {
      sheet.hidden = false;
      flash(sheet, 'open');
    } else if (act === 'close') sheet.hidden = true;
  }

  function onClick(e) {
    const li = e.target.closest('.cw-sheet li');
    if (li) {
      sheet.hidden = true;
      goToWord(words[Number(li.dataset.n)]);
    } else if (e.target === sheet) sheet.hidden = true;
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Tab') {
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
    }
  }

  return {
    mount(container, context) {
      ctx = context;
      build();
      container.appendChild(root);
      root.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.cw-sheet')) return; // la lista usa click para poder desplazarse
        onPointer(e);
      });
      root.addEventListener('click', (e) => {
        if (e.target.closest('.cw-sheet')) {
          if (e.target.closest('[data-act=close]')) sheet.hidden = true;
          else onClick(e);
        }
      });
      document.addEventListener('keydown', onKey);

      const timeEl = document.getElementById('time');
      if (timeEl) {
        observer = new MutationObserver(() => root.classList.toggle('urgent', timeEl.classList.contains('urgent')));
        observer.observe(timeEl, { attributes: true, attributeFilter: ['class'] });
      }

      refresh();
      toast(crosswordToasts.start);
      later(() => {
        root.classList.remove('enter');
        goToWord(words[0], true);
      }, 1100);
    },
    destroy() {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      observer?.disconnect();
      stopConfetti?.();
      document.removeEventListener('keydown', onKey);
      gone = true;
      root?.remove();
    },
  };
}
