# Portfolio Core

Capa lógica preparada para la futura integración. No está importada por `index.html` y no modifica la experiencia existente.

- `normalize.mjs`: adaptadores sin pérdida desde las dos fuentes actuales; conserva `raw` y procedencia.
- `repository.mjs`: búsqueda acento-insensible, filtros combinables y facetas.
- `routes.mjs`: contrato de URL para directorio y detalle.

No fusiona automáticamente registros similares: `companies` y `portfolio` tienen propósitos y coberturas distintas. La futura unión requiere un identificador editorial validado. Los componentes visuales consumirán esta capa después de recibir el diseño de Claude.

