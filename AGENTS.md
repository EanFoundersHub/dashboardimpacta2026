# Dashboard Impacta — invariantes de implementación

## Portafolio

- Toda cifra contextual del portafolio debe calcularse con `filterVentures()` y `aggregateVentures()` de `src/portfolio-core/metrics.mjs`.
- La cuadrícula, el contador y el detalle de indicadores deben usar el mismo arreglo filtrado.
- Un valor `0` es un dato válido. Solo `null` o `undefined` se presentan como **Sin dato**.
- Cada indicador debe declarar fuente, fecha de corte y, cuando corresponda, periodo.
- Mantener estados separados para carga, error de fuente y búsqueda sin coincidencias.
- No exponer datos personales de contacto en el detalle público.

## Verificación mínima

- Ejecutar `node --test tests/portfolio-logic.test.mjs`.
- Ejecutar `node tests/ui-validation.mjs` con el servidor local activo en el puerto documentado por el piloto.
- Validar desktop y 390×844, teclado, tema claro/oscuro y `prefers-reduced-motion`.
- No publicar ni activar servicios externos sin autorización explícita.
