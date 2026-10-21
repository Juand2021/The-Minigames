// Minijuego provisional: se gana con un botón. Cada fase lo sustituye por el juego real.
export function createStub(label) {
  let root;
  return {
    mount(container, ctx) {
      root = document.createElement('div');
      root.className = 'stub';
      root.innerHTML = `
        <h2>${label}</h2>
        <p>Aquí irá el minijuego real.</p>
        <button class="btn" data-act="win">Simular victoria</button>
        <button class="btn btn-ghost" data-act="lose">Simular derrota</button>`;
      root.addEventListener('click', (e) => {
        const act = e.target.dataset?.act;
        if (act === 'win') ctx.win();
        if (act === 'lose') ctx.lose();
      });
      container.appendChild(root);
    },
    destroy() {
      root?.remove();
    },
  };
}
