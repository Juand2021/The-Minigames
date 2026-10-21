# GDD resumido

- Tono: romántico + muy gracioso. Textos en `src/content/story.js`.
- Móvil táctil exclusivamente. Tiempos: Sudoku 5:00, Crucigrama 5:00, Billar 8:00, Minecraft 8:00 (`src/config.js`).
- Contrato de minijuego: `() => ({ mount(container, {win, lose}), destroy() })`. Ver `src/games/stub.js`.
- Detalles de cada minijuego: ver `docs/PLAN.md` ("Diseño por minijuego").
