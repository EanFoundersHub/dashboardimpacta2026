# Archivo Impacta 2026 — implementación de exposición digital

## Alcance

La versión se construyó desde `impacta-2026-dashboard-logica-piloto` en la copia independiente `impacta-2026-archivo-exposicion`. No se publicó ni se modificó GitHub Pages.

Se conservaron los 116 expedientes, los filtros, la búsqueda, las reglas de agregación, la distinción entre cero y ausencia de dato, los modos claro/oscuro y la navegación de detalle.

## Dirección elegida

Se exploraron dos direcciones en navegador:

1. **Mesa de conservación / exposición digital (implementada):** el expediente es el objeto de entrada y sus tres separadores conducen a Resultados, Rutas y Emprendimientos. Facilita entender el archivo y llegar a un expediente.
2. **Sala oscura inmersiva (descartada):** daba mayor protagonismo escénico al objeto, pero retrasaba la lectura de cifras y reducía la claridad de los accesos.

Claude Design no estaba disponible en el entorno. Las dos direcciones se evaluaron directamente en el navegador.

## Técnicas incorporadas

| Fuente | Versión / archivo consultado | Incorporado | Adaptación visible |
|---|---|---|---|
| Cutaway | commit `5d8f1c6efe0ed65a8fc7647a7a2a3ee9fbb4d20a`; `sims/kit/stage3d.js`, `sims/kit/director.js`; MIT | Patrón de piezas independientes, encuadre de cámara, separación progresiva y retorno a origen | `archive-exhibition.js`: cubierta, base, hojas, tres separadores y pestañas se separan y se rearman |
| Three.js | `0.181.1`; MIT | Render WebGL local, cámara, iluminación, materiales y geometrías | `vendor/three/three.module.min.js`, `three.core.min.js` y licencia incluida |
| HyperFrames | `0.9.26`; Apache-2.0 | Composición HTML/GSAP seekable y render determinista | `video/archivo-impacta/index.html`; render de 12 segundos y reporte de validación |
| Remotion | Licencia y precios consultados | **No incorporado** | Requiere licencia empresarial para esta organización; no se asumió una compra |
| Blender MCP / GLB | Referencias consultadas | **No incorporado** | El expediente se resolvió con geometría propia en Three.js; no hizo falta Blender ni GLB |

No se copiaron modelos de Cutaway. Solo se adaptó su patrón técnico a un objeto propio de Impacta.

## Recorrido implementado

1. La portada carga con navegación y fallback disponibles desde el primer momento.
2. `Explorar archivo` separa las piezas del expediente.
3. Cada separador enlaza con una sección real: Panorama, Rutas o Portafolio.
4. Panorama diferencia explícitamente el universo institucional del universo filtrado.
5. Portafolio muestra filtros activos, métricas del mismo conjunto y expedientes consultables.
6. Cronología presenta un índice compacto: 12 meses preparados y 0 hitos publicados mientras no existan hitos autorizados.
7. La apertura audiovisual se reproduce bajo demanda, no bloquea el recorrido y tiene subtítulos.

## Pieza audiovisual

- Fuente: `video/archivo-impacta/index.html`
- Duración: 12 segundos, 1920×1080, 30 fps.
- Render original: `assets/video/archivo-impacta.mp4`.
- Versión web: `assets/video/archivo-impacta.webm`.
- Subtítulos: `assets/video/archivo-impacta-es.vtt`.
- Póster: `assets/video/archivo-impacta-poster.png`.
- Comando reproducible: `cd video/archivo-impacta && npm run check && npm run render`.
- Validación HyperFrames: 0 errores de lint, runtime, motion o contraste; 31/31 comprobaciones de contraste aprobadas.

## Pruebas

| Prueba | Resultado |
|---|---|
| Núcleo lógico del portafolio | 5/5 aprobadas |
| Portada cerrada y expediente abierto, desktop | Aprobada |
| Portada cerrada y expediente abierto, 390×844 | Aprobada |
| Elegir Emprendimientos desde una capa | Aprobada |
| Filtrar Crece | 37 expedientes |
| Abrir desglose de Ventas y luego expediente | Aprobada |
| Navegación por teclado y Escape para rearmar | Aprobada |
| Movimiento reducido | Fallback estático con accesos funcionales |
| WebGL desactivado | Fallback estático con accesos funcionales |
| Modo oscuro | Aprobado |
| Errores de página durante el recorrido | 0 |

Comandos:

```text
node --test tests/portfolio-logic.test.mjs
$env:IMPACTA_URL='http://127.0.0.1:4184/'; node tests/ui-validation.mjs
node tests/exhibition-validation.mjs
```

## Evidencias

- Antes: `evidence/redesign-before/`
- Después: `evidence/redesign-after/`
- Recorrido grabado: `evidence/redesign-after/recorrido-portada-a-expediente.webm`
- Estados sin WebGL y con movimiento reducido: `evidence/redesign-after/desktop-sin-webgl.png` y `mobile-reduced-motion.png`

## Pendiente editorial, no técnico

- Incorporar hitos de la cronología solo cuando sean autorizados.
- Sustituir o ampliar fotografías de expedientes únicamente con materiales aprobados.
- Decidir si la institución adquiere una licencia Remotion; no es necesaria para reproducir esta entrega.
