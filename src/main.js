import '@fontsource/bungee/latin-400.css';
import '@fontsource/chakra-petch/latin-500.css';
import '@fontsource/chakra-petch/latin-600.css';
import '@fontsource/chakra-petch/latin-700.css';
import './styles/main.css';
import './styles/arcade.css';
import './styles/responsive.css';
import { GameShell } from './shell/shell.js';
import { mountIcons } from './ui/icons.js';

// Sin zoom en el móvil (doble toque y pellizco), también en iOS/Safari que ignora el meta viewport.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 320) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false },
);
document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.preventDefault(), { passive: false });

// El juego es solo vertical: si el navegador lo permite (pantalla completa / app instalada), bloquea la orientación.
try {
  screen.orientation?.lock?.('portrait').catch(() => {});
} catch {
  /* Safari y otros no lo permiten: no pasa nada */
}

mountIcons();
new GameShell(document.getElementById('app')).start();
