# Validación de portada Claude — fase de aprobación

## Vista local

- Sitio integrado: `http://127.0.0.1:4186/`
- Prototipo original servido sin modificaciones: `http://127.0.0.1:4185/src/index.html`

## Archivos de Claude integrados

- `assets/claude-portada/`: texturas, pilas, etiquetas, fondos y tipografías del paquete.
- `vendor/claude-three/three.module.min.js`: runtime Three.js entregado.
- `claude-expediente-cutaway.js`: componente cutaway entregado, con sus poses, cámaras y materiales.
- `claude-portada.js`: conexión con la navegación real del sitio.

La barra “Prototipo” y sus selectores no forman parte de la vista integrada.

## Recorrido comprobado

- Panorama → `#panorama`
- Rutas → `#programas`
- Portafolio → `#portafolio`
- Apertura, enfoque, selección, reensamble y teclado.
- Alternativa estática con movimiento reducido.
- Alternativa estática cuando WebGL no está disponible.
- Escritorio 1440 × 900 y móvil 390 × 844 sin desbordamiento horizontal.

## Diferencias conscientes respecto de las capturas de Claude

- La versión integrada conserva la navegación superior real del producto; las capturas del prototipo tenían una barra de demostración que se retiró por solicitud.
- En móvil, las etiquetas de acceso se presentan como tres controles apilados y legibles. Las geometrías, texturas, cámaras y poses 3D permanecen intactas; este ajuste evita el solapamiento que producía la disposición flotante original a 390 px.
- El título se adapta al espacio disponible del producto, manteniendo texto, jerarquía, color y composición editorial del original.

## Evidencias

Las capturas del navegador y comparaciones a igual tamaño están en:

- `evidence/claude-reference/`
- `evidence/integrated-portada/`

Cada comparación coloca el prototipo original a la izquierda y el sitio integrado a la derecha.

## Fuera de esta fase

Panorama, la mesa de consulta, Portafolio y el render final HyperFrames se mantienen sin cambios hasta la aprobación visual de esta portada, respetando el orden solicitado.
