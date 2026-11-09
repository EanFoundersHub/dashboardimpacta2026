# Auditoría y pruebas — piloto de lógica del portafolio

## Alcance

- Copia de trabajo: `impacta-2026-dashboard-logica-piloto`.
- Rama local: `codex/portfolio-logic-pilot`.
- Ruta: `/#portafolio`.
- Módulo elegido: portafolio de 116 emprendimientos, por ser el flujo de mayor utilidad con datos controlados y verificables.
- Fuente: `data/public-data.js`; corte declarado: enero de 2026; ventas: periodo 2024.
- Despliegue existente: GitHub Actions (`.github/workflows/pages.yml`) publica el contenido estático al hacer `push` sobre `main` o por ejecución manual. No se ejecutó ni modificó.

## Hallazgos

| Categoría | Hallazgo inicial | Resolución |
|---|---|---|
| Lógica | Solo el contador respondía a filtros; no había KPIs filtrados ni registros explicativos. | Núcleo compartido `metrics.mjs`, cuatro indicadores y detalle por registro. |
| Datos | Cero y ausencia estaban bien en el expediente, pero no existía cobertura agregada. | Cobertura “con dato/sin dato”; pruebas con Agroadvisers y Biomasnest. |
| Estados | Vacío genérico; carga y fallo de fuente no se distinguían. | Estados `loading`, `ready`, `empty` y `error` con textos propios. |
| Interacción | No se podía auditar una cifra desde la interfaz. | Cada KPI abre los registros del mismo conjunto filtrado. |
| Diseño | La jerarquía existente admite la mejora sin alterar navegación ni identidad. | Ajuste dentro del sistema editorial actual; Claude Design no fue necesario. |
| Contenido | Fuente y corte no estaban junto a los resultados filtrados. | Fuente, corte y periodo visibles y repetidos en el detalle. |
| Permisos | Sitio estático público, sin perfiles, escritura ni rutas privadas. | No aplica control de acceso en este piloto; no se añadieron permisos ficticios. |

## Matriz de pruebas

| Criterio | Esperado | Observado | Estado | Evidencia |
|---|---:|---:|---|---|
| Conjunto completo | 116 expedientes | 116 | Cumplido | `tests/portfolio-logic.test.mjs`, captura desktop después |
| Empleos completos | 1.584; 58 con dato/58 sin dato | Coincide | Cumplido | prueba automática y UI |
| Ventas 2024 completas | $38.805.546.447; 58 con dato/58 sin dato | `$38,8 mil M` | Cumplido | prueba automática y UI |
| Buscar Astrolab | 1 expediente; 9 empleos; $157 M | Coincide en cuadrícula, KPI y expediente | Cumplido | `tests/ui-validation.mjs`, video de ayuda |
| División Salud | 5 expedientes; 38 empleos; $1.690.857.542 | `5`, `38`, `$1,7 mil M` | Cumplido | prueba UI desktop/móvil |
| Cero registrado | Empleos 0; ventas $0 | Coincide | Cumplido | Agroadvisers, prueba UI |
| Valor ausente | “Sin dato” | Coincide | Cumplido | Biomasnest, prueba UI |
| Sin coincidencias | Estado vacío específico; KPI total 0 | Coincide | Cumplido | búsqueda `zzzz-no-existe` |
| Carga | Estado “Cargando portafolio…” | Capturado con fuente retardada | Cumplido | `evidence/after/desktop-loading-state.png` |
| Error de fuente | Mensaje distinto al vacío | Capturado bloqueando `public-data.js` | Cumplido | `evidence/after/desktop-error-state.png` |
| Detalle de indicador | Registros que explican la cifra | Astrolab → 9 | Cumplido | diálogo “Empleos reportados” |
| Permisos | Solo aplica si existen perfiles/rutas privadas | No existen en el sitio estático | No aplica | auditoría de código |
| Persistencia/edición | Solo aplica a operaciones mutables | No hay edición ni escritura | No aplica | auditoría de código |

## Antes y después

- Desktop: `evidence/before/desktop-portfolio-equivalent.png` y `evidence/after/desktop-portfolio-equivalent.png`.
- Móvil 390×844: `evidence/before/mobile-portfolio-equivalent.png` y `evidence/after/mobile-portfolio-equivalent.png`.
- Estados adicionales: `evidence/after/desktop-loading-state.png`, `desktop-error-state.png`, ayuda desktop/móvil.

## Audiovisual, 3D y dependencias

- Ayuda integrada: `assets/help/portfolio-guide.webm` (10 s, VP9, 1280×720) y subtítulos editables `portfolio-guide-es.vtt`.
- Motor reutilizado: Playwright/Chromium ya presente en el proyecto; no se incorporaron dependencias nuevas.
- Claude Design: no requerido; los componentes actuales resolvieron la tarea sin modificar identidad o navegación global.
- 3D: no justificado; el sitio no contiene coworking, plano de sala ni tarea de selección espacial que requiera GLB.
- Repositorios externos: no se incorporó Cutaway, Blender MCP, Remotion, HyperFrames ni servicios de audio; no eran necesarios para el piloto verificable.

## Pendientes

- **Falta de insumos:** fecha de corte individual por registro y procedencia documental por emprendimiento, si se desea trazabilidad más granular.
- **Falta de acceso:** ninguna para el piloto público; no hay backend de perfiles que auditar.
- **Revisión:** decidir si los indicadores filtrados deben sustituir o complementar los indicadores institucionales de Panorama.
- **Producción:** publicación y activación de cualquier servicio externo quedan pendientes de autorización explícita.
