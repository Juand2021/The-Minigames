# Auditoría de flujos — El Gran Desafío

Fecha: 2026-10-21. Alcance: el flujo general (portada, mapa, intro, juego, resultado, premio) y los cuatro minijuegos.

## Problemas encontrados y corregidos

| # | Problema | Impacto | Corrección |
|---|----------|---------|------------|
| 1 | Si resolvía Sudoku/Crucigrama/Billar en los últimos segundos, el reloj llegaba a 0 durante la animación de victoria (2–3 s) | Perdía una prueba que había ganado | Los juegos avisan al resolverse (`ctx.freeze`) y el reloj se detiene al instante |
| 2 | El reloj del billar corría durante la cinemática | Perdía tiempo leyendo la historia | El reloj se pausa durante la cinemática (`ctx.hold`) y arranca al terminar |
| 3 | El reloj seguía corriendo con el celular bloqueado o la app en segundo plano | Una llamada podía costarle la prueba | Pausa automática al ocultarse la app y reanudación al volver |
| 4 | Un juego podía avisar "ganar/perder" dos veces o tarde (después de salir) | Intentos duplicados o pantallas inesperadas | Cada partida acepta un solo final y solo si sigue activa |
| 5 | El botón atrás del celular cerraba toda la app | Salida accidental | Atrás navega dentro del juego (juego → confirmar salida, intro/resultado → mapa, mapa → portada) |
| 6 | Confirmaciones con `confirm()` del navegador; al salir de Maincra decía "el tiempo se reinicia" (no tiene reloj) | Experiencia inconsistente y texto incorrecto | Ventana propia de vidrio, con el reloj en pausa mientras está abierta y textos según el nivel |
| 7 | Billar: meter la 8 en la apertura hacía perder | Derrota por pura suerte | La 8 vuelve a su punto y la partida sigue |
| 8 | Al ganar se volvía al mapa | Flujo cortado | Botón "Siguiente: (nivel)" que abre directamente la próxima prueba |
| 9 | Con todo superado, el mapa redirigía al premio y no se podía volver a jugar | Sin acceso a los niveles | El mapa muestra todo superado y una tarjeta del premio; la portada ofrece "Ver tu premio" y "Ver el camino" |
| 10 | La pantalla podía apagarse en niveles largos (Maincra no tiene reloj) | Interrupciones | Se mantiene encendida durante el juego (Wake Lock, si el navegador lo permite) |
| 11 | En horizontal la interfaz quedaba aplastada | Juego incómodo | Aviso para girar el celular en vertical |
| 12 | Maincra: tras salir a mitad de un diálogo seguía ejecutando código | Posibles errores ocultos | Se corta todo al salir |

## Escenarios probados (automatizados en el navegador, modo real con niveles bloqueados)

- **Primera visita:** botón "Empezar", sin "Reiniciar", y solo la prueba 1 abierta.
- **Mapa:** las pruebas bloqueadas están deshabilitadas, tocarlas no hace nada y su intro no se puede abrir.
- **Intro:** "Volver" y el botón atrás del celular llevan al mapa. En la portada, atrás no hace nada.
- **Salir a mitad del juego:** aparece la ventana con el reloj en pausa. "Seguir jugando" reanuda y "Salir" vuelve al mapa. El botón atrás abre la misma ventana.
- **Tiempo agotado:** aparece "Tiempo agotado". "Reintentar" vuelve a empezar con el reloj completo.
- **Resuelto en el último segundo:**
  - Con la ayuda de prueba: el reloj se congela, queda en victoria y se desbloquea la siguiente prueba.
  - Con el Sudoku real resuelto con 1 s restante: también queda "¡Ganaste!".
- **Finales tardíos o duplicados:** se ignoran.
- **Ganar:** "Siguiente: Crucigrama" abre su intro.
- **Perder con motivo:** se muestra el motivo, con "Reintentar" y "Volver al mapa".
- **Segundo plano:** el reloj se pausa y se reanuda al volver.
- **Repetir una prueba ya superada:** no altera el progreso.
- **Billar:** el reloj está en pausa durante la cinemática y corre al terminarla.
- **Maincra:** salir durante la intro no produce errores.
- **Camino completo hasta el premio:** "Ver tu premio", la pantalla del premio y el mapa con la tarjeta del premio. La portada muestra "Ver tu premio" y "Ver el camino".
- **Progreso:** se guarda en el navegador.
- **Reiniciar progreso:** cancelar lo conserva y confirmar lo borra.
- **Errores de JavaScript:** ninguno en todo el recorrido.

## Pruebas sin interfaz (scripts/)

- **Sudoku:** 100 tableros, todos con solución única.
- **Billar:**
  - Física estable en 150 partidas simuladas.
  - Las reglas se cumplen.
  - La 8 metida en la apertura vuelve a la mesa sin quedar encima de otra bola.
- **Maincra:**
  - Mundo y física.
  - Las noches siempre terminan.
  - Robos y rescate de Juan.
  - Puntaje de las 3 construcciones.
- **Rotación de las bolas del billar:** matemática verificada.

## Pendiente antes de entregar

- **Bloqueo de niveles:** poner `UNLOCK_ALL = false` en `src/config.js`. Hoy están todos abiertos para pruebas, y con `?locked` en la URL se prueba el modo real.
- **Premio:** definir el texto en `src/content/reward.js`; todavía es un placeholder.
- **Tiempo de Maincra:** decidir si tendrá límite (hoy no lo tiene).
- **Prueba final:** jugar en un celular real de punta a punta.
