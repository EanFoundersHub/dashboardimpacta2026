# Sellos 2020–2026

- `sello-AAAA.svg`: vector con textura de tinta (filtro SVG). El color sale de `currentColor` o de la variable CSS `--tinta-sello`: oscuro `#262A34` sobre carpetas claras y `#FAF7EE` sobre carpetas oscuras. Usa las fuentes Outfit y Poppins; si no están cargadas, recurre a Arial.
- `png/sello-AAAA-oscuro.png` y `png/sello-AAAA-claro.png`: 600 × 600 con transparencia, tinta raster con imperfecciones. Son la versión recomendada para la web.
- Sobre carpetas claras: oscuro con `mix-blend-mode: multiply` y opacidad .88. Sobre carpetas oscuras: claro con opacidad .92, sin blend.
- Tamaño mínimo legible: 56 px.
