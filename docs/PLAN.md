# Plan: juego romántico-gracioso de 4 minijuegos (web táctil, Phaser)

## Context
Juego personal para una persona especial: 4 niveles secuenciales (Sudoku → Crucigrama → Billar pool → Minecraft 2D). Si los completa dentro del tiempo, recibe un premio en la vida real. Solo móvil/táctil, tono romántico y muy divertido. Sin backend. Despliegue en Vercel. Repo personal en GitHub (`Juand2021`).

Estado del entorno (verificado): carpeta de trabajo vacía y temporal; Node 22 / npm 10 / git OK; **`gh` CLI NO instalado**; git global tiene `user.email=juanchaves@cbit-online.com` (cuenta empresarial) → en este repo se fija identidad local personal (`Juand2021` / `juand.chavesg@gmail.com`).

## Decisiones
- **Stack:** Vite + JavaScript vanilla (ES modules) + **Phaser 3** (billar y Minecraft) + **Matter.js** (física del billar, incluida en Phaser). Sudoku y crucigrama en **DOM/CSS** (más nítido y accesible en móvil). Sin framework UI.
- **Arquitectura:** una sola app; un `GameShell` (DOM) maneja pantallas, HUD de temporizador, diálogos narrativos y progreso. Cada minijuego es un módulo con interfaz común: `mount(container, ctx)` → `ctx.onWin()` / `ctx.onLose()`, y `destroy()`.
- **Tiempos:** Sudoku 5:00, Crucigrama 5:00, Billar 8:00, Minecraft 8:00 (en `src/config.js`, fácil de ajustar).
- **Si pierde por tiempo:** reintenta el nivel (nuevo temporizador) con mensaje gracioso; el progreso de niveles ya ganados se conserva. (Ver "Supuestos".)
- **Progreso:** `localStorage` (nivel desbloqueado, intentos), envuelto en try/catch.
- **Móvil:** viewport portrait, `touch-action: none` en canvas, Phaser `Scale.FIT`, sin hover, objetivos táctiles ≥ 44px, bloqueo de zoom/scroll, PWA mínima (manifest) opcional para pantalla completa.
- **Premio:** pantalla final con placeholder configurable (`src/content/reward.js`); se define luego.

## Estructura
```
juego-especial/
  index.html
  package.json  vite.config.js  vercel.json(no necesario: Vite se autodetecta)
  src/
    main.js            // arranque
    config.js          // tiempos, textos globales
    shell/             // GameShell, Timer, Dialog, LevelMap, Progress(localStorage)
    content/           // story.js (diálogos graciosos), crossword.js (pistas personalizadas), reward.js
    games/
      sudoku/          // generator.js (puzzles + solución), SudokuGame.js, estilos
      crossword/       // CrosswordGame.js (grid + teclado propio)
      pool/            // PoolScene.js (Phaser+Matter), reglas, input drag-to-aim
      craft/           // CraftScene.js (Phaser): mundo 2D, construcción, mobs/PvP
    styles/
  public/assets/       // sprites pixel-art, audio (CC0)
  docs/                // PLAN.md, GDD.md, MAQUETA.md (wireframes)
  README.md
```

## Maqueta (pantallas, portrait)
1. **Portada:** título juguetón, botón "Empezar".
2. **Mapa de niveles:** 4 nodos conectados (🔢 ✏️ 🎱 ⛏️), candados, estrellas/intentos.
3. **Intro de nivel:** diálogo corto gracioso/romántico + "¡Vamos!".
4. **HUD de juego:** barra superior con temporizador y botón pausa/salir; área de juego debajo.
5. **Resultado:** victoria (confeti + frase) / derrota por tiempo (broma + reintentar).
6. **Final:** pantalla de premio + mensaje romántico.

## Diseño por minijuego
- **Sudoku (5 min):** cuadrícula 9x9, teclado numérico propio en pantalla, modo notas, resaltado de conflictos, botón "pista" limitado (ej. 3). Banco de puzzles pre-generados de dificultad media-fácil con solución única + generador/validador para poder crecer.
- **Crucigrama (5 min):** cuadrícula pequeña (~9x9 o 10x10, ~8–10 palabras) con **pistas personalizadas** (chistes internos, recuerdos). Teclado QWERTY propio en pantalla (evitar teclado del sistema), pista actual arriba, tocar casilla alterna horizontal/vertical, botón "revelar letra" limitado. Contenido a rellenar con el usuario (se dejan placeholders válidos).
- **Billar pool (8 min):** mesa horizontal rotada o vertical, 7 bolas + blanca + 6 troneras. Apuntar arrastrando hacia atrás desde la blanca (línea guía + potencia), Matter.js con fricción/rebote ajustados, reglas simplificadas: *embocar todas las bolas antes de que acabe el tiempo; embocar la blanca = penalización (se recoloca)*. Bola 8 al final.
- **Minecraft 2D (8 min):** mundo lateral de bloques pixel-art. Joystick virtual + botones (saltar, picar/poner). Fases: (1) recolectar madera/piedra, (2) **construir** una casita/estructura-meta siguiendo un plano (mecánica principal), (3) al caer la noche, **mobs** (zombis/creepers cómicos) atacan: golpear con espada táctil (PvE/"PvP" ligero). Ganar = estructura completa y sobrevivir la noche. Assets pixel propios simples/CC0 (no usar assets oficiales de Mojang).

## Fases de implementación
0. **Repo + esqueleto:** `npm create vite`, instalar `phaser`, estructura, Shell, mapa de niveles, temporizador, progreso, niveles *stub* que se ganan con un botón; despliegue en Vercel. Docs (`PLAN.md`, `GDD.md`, `MAQUETA.md`).
1. Sudoku completo.
2. Crucigrama completo (con contenido del usuario).
3. Billar.
4. Minecraft 2D.
5. Pantalla de premio, narrativa/humor, pulido móvil, sonido, pruebas en dispositivo real.

Cada fase termina funcionando y desplegada antes de empezar la siguiente.

## Repositorio y GitHub (ejecución, tras aprobar)
- `gh` no está instalado → instalar con `winget install GitHub.cli` y autenticar la cuenta **`Juand2021`** (`gh auth login`, web/device flow, lo hace el usuario en el navegador) — o, alternativa, crear el repo vacío en github.com y yo solo hago `git remote add` + `push`. Usar `gh auth switch --user Juand2021` si hay dos cuentas.
- `git init`, identidad **local** del repo: `user.name=Juand2021`, `user.email=juand.chavesg@gmail.com` (no la del trabajo).
- Crear repo `juand2021/<nombre>` (privado por defecto, porque contiene pistas personales; nombre sugerido: `juego-especial`), primer commit y push. Publicar y crear repo remoto solo tras confirmación explícita (acción externa).

## Verificación
- `npm run dev` y `npm run build` sin errores; abrir en el navegador integrado con emulación móvil (375x812) y recorrer: portada → mapa → nivel stub → siguiente nivel → final; comprobar que expira el temporizador y que el progreso persiste al recargar.
- Después de cada minijuego: pruebas de lógica (validador de sudoku, detección de crucigrama completo), y jugarlo en emulación táctil.
- Prueba final en un teléfono real vía URL de Vercel.

## Supuestos (ajustables)
- Repo privado; carpeta de proyecto definitiva por elegir (la actual es temporal).
- Derrota = reintento ilimitado del nivel; si prefieres "tiene N vidas" o "todo en una sola sesión con tiempo global", se cambia en `config.js`.
- Idioma de la UI: español.
