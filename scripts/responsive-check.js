// Recorrido de compatibilidad de pantallas (se pega en la consola con ?debug en la URL).
// Recorre todas las pantallas y devuelve los elementos que se salen del ancho o del alto visibles.
window.__responsive = async () => {
  const S = window.__shell;
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const IGNORE = '.bg, .pz-rays, .pz-glow, .pz-fireworks, .pz-sparks, .rotate, canvas.fx-canvas, [hidden], .modal';
  const W = innerWidth;
  const H = innerHeight;
  const issues = [];
  const scan = (screen, { checkBottom = false } = {}) => {
    if (document.documentElement.scrollWidth > W + 1) issues.push(`${screen}: la página se desplaza en horizontal (${document.documentElement.scrollWidth}px > ${W}px)`);
    const seen = new Set();
    for (const el of document.querySelectorAll('#app *')) {
      if (el.closest(IGNORE)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const name = `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join('.')}`;
      if ((r.right > W + 1 || r.left < -1) && !seen.has(name)) {
        // solo si su contenedor no lo recorta a propósito
        const clip = el.parentElement && getComputedStyle(el.parentElement).overflow !== 'visible' && el.parentElement.getBoundingClientRect().right <= W + 1;
        if (!clip) {
          seen.add(name);
          issues.push(`${screen}: ${name} se sale (${Math.round(r.left)}→${Math.round(r.right)} de ${W})`);
        }
      }
      if (checkBottom && el.matches('button, [role=button]') && r.bottom > H + 1 && !seen.has('b' + name)) {
        seen.add('b' + name);
        issues.push(`${screen}: botón ${name} queda bajo el borde (${Math.round(r.bottom)} > ${H})`);
      }
      // texto que se desborda de su caja
      if (el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis' && !seen.has('t' + name)) {
        seen.add('t' + name);
        issues.push(`${screen}: texto cortado en ${name} ("${el.textContent.trim().slice(0, 24)}")`);
      }
    }
  };
  localStorage.setItem('juego-especial:v1', JSON.stringify({ unlocked: 2, attempts: {} }));
  S.progress = { unlocked: 2, attempts: {} };
  S.showCover();
  await w(900);
  scan('portada');
  S.showMap();
  await w(900);
  scan('mapa');
  S.showIntro(0);
  await w(900);
  scan('intro');
  for (let i = 0; i < 5; i++) {
    S.play(i);
    await w(1700);
    scan(`juego ${i}`, { checkBottom: true });
  }
  S.showResult(1, true);
  await w(900);
  scan('resultado');
  S.showFinal();
  await w(900);
  scan('premio (bloque)', { checkBottom: true });
  const st = document.querySelector('.pz-stage');
  for (let k = 0; k < 8; k++) st.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await w(2600);
  scan('premio (mensaje)', { checkBottom: true });
  document.querySelector('.pz-claim-btn')?.click();
  await w(900);
  scan('premio (vale)', { checkBottom: true });
  S.showCover();
  return issues.length ? issues : ['sin problemas'];
};
