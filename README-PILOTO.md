# Integración piloto · Aceleratón Go-to-market

Copia independiente de `dashboardimpacta2026-publish`. No modifica ni publica el dashboard oficial.

- Entrada: botón **Abrir capítulo piloto** en la portada.
- Escena: carpetas multicolor reales, selección, apertura y scrub reversible.
- Bisagra: el origen se calcula desde `assets/motion/assets.json`; ninguna regla CSS lo anula.
- Transición: la hoja física funciona como puente y entrega el capítulo a un layout HTML responsive independiente.
- Continuidad: el contenido editorial sigue mediante scroll; al cerrar se recupera el dashboard con sus 116 expedientes, filtros, cronología, tema y navegación.
- Evidencia: `evidence/01-recorrido-completo-desktop.webm`, `02-recorrido-completo-movil.webm` y `03-scroll-reversible-desktop.webm`.

Ejecución local: servir esta carpeta por HTTP y abrir `index.html`.
