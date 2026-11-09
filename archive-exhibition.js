import * as THREE from './vendor/three/three.module.min.js';

const stage = document.querySelector('#archive-stage');
const canvas = document.querySelector('#archive-canvas');
const launch = document.querySelector('.archive-launch');
const reset = document.querySelector('.archive-reset');
const layerNav = document.querySelector('.archive-layer-nav');
const fallback = document.querySelector('#archive-fallback');
const status = document.querySelector('#archive-status');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let open = false;

const setStaticReady = (reason = 'Vista estática accesible') => {
  stage.dataset.webgl = 'fallback';
  fallback.hidden = false;
  layerNav.hidden = false;
  reset.hidden = true;
  launch.setAttribute('aria-expanded', 'true');
  status.textContent = `${reason}. Los tres accesos del expediente siguen disponibles.`;
};

function initArchive() {
  if (reduceMotion) {
    setStaticReady('Movimiento reducido activado');
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  } catch (error) {
    setStaticReady('WebGL no está disponible');
    return;
  }

  stage.dataset.webgl = 'ready';
  fallback.hidden = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 1.2, 10.6);
  const rig = new THREE.Group();
  rig.rotation.set(-0.16, -0.18, -0.03);
  scene.add(rig);

  scene.add(new THREE.HemisphereLight(0xfff7e9, 0x403b52, 2.6));
  const key = new THREE.DirectionalLight(0xffffff, 4.2);
  key.position.set(-4, 7, 8);
  scene.add(key);
  const fill = new THREE.PointLight(0x40c0c0, 20, 20);
  fill.position.set(5, 2, 5);
  scene.add(fill);

  const paper = new THREE.MeshStandardMaterial({color: 0xf5efdf, roughness: 0.86, metalness: 0});
  const orange = new THREE.MeshPhysicalMaterial({color: 0xef6f2e, roughness: 0.58, clearcoat: 0.08});
  const graphite = new THREE.MeshStandardMaterial({color: 0x252322, roughness: 0.7});
  const colors = [0x40b9b5, 0xf1c72d, 0x7e9c55];
  const pieces = [];

  const part = (name, size, material, y, z, target) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(0, y, z);
    mesh.userData.home = mesh.position.clone();
    mesh.userData.open = new THREE.Vector3(...target);
    mesh.castShadow = mesh.receiveShadow = true;
    rig.add(mesh);
    pieces.push(mesh);
    return mesh;
  };

  part('base', [5.9, 3.65, 0.16], orange, -0.1, -0.22, [-0.35, -0.55, -1.15]);
  part('paper-back', [5.45, 3.25, 0.055], paper, 0.03, -0.08, [-0.8, 0.02, -0.35]);
  colors.forEach((color, index) => {
    const material = new THREE.MeshPhysicalMaterial({color, roughness: 0.64, clearcoat: 0.05});
    const x = -0.08 + index * 0.1;
    const sheet = part(`separator-${index}`, [5.25, 3.03, 0.075], material, 0.09 + index * 0.045, 0.02 + index * 0.09, [x + (index - 1) * 0.42, 0.45 + index * 0.66, 0.18 + index * 0.9]);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 0.09), material);
    tab.position.set(1.88 - index * 1.72, 1.7 + index * 0.045, 0.03 + index * 0.09);
    tab.userData.home = tab.position.clone();
    tab.userData.open = new THREE.Vector3(1.88 - index * 1.72, 2.15 + index * 0.67, 0.2 + index * 0.9);
    rig.add(tab); pieces.push(tab);
  });
  const cover = part('cover', [5.9, 3.65, 0.15], orange, -0.02, 0.42, [0.9, -1.45, 2.55]);
  cover.geometry.translate(0, -1.825, 0);
  cover.position.y += 1.825;
  cover.userData.home = cover.position.clone();
  cover.userData.open = new THREE.Vector3(0.75, -1.55, 1.15);
  const label = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 0.02), paper);
  label.position.set(-0.8, 0.3, 0.51); rig.add(label);
  label.userData.home = label.position.clone(); label.userData.open = new THREE.Vector3(-0.8, -0.8, 3.05); pieces.push(label);
  const clip = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 32, Math.PI * 1.6), graphite);
  clip.rotation.z = 1.25; clip.position.set(2.24, 1.22, 0.62); rig.add(clip);
  clip.userData.home = clip.position.clone(); clip.userData.open = new THREE.Vector3(2.65, 1.85, 3.15); pieces.push(clip);

  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.ShadowMaterial({opacity: 0.18}));
  shadowPlane.position.set(0, -2.15, -1.3); shadowPlane.rotation.x = -Math.PI / 2; scene.add(shadowPlane);
  renderer.shadowMap.enabled = true;

  let progress = 0;
  let desired = 0;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const resize = () => {
    const rect = stage.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  };
  resize(); new ResizeObserver(resize).observe(stage);

  const render = () => {
    progress += (desired - progress) * 0.075;
    const p = ease(progress);
    pieces.forEach((mesh) => {
      mesh.position.lerpVectors(mesh.userData.home, mesh.userData.open, p);
      if (mesh.name === 'cover') mesh.rotation.x = -Math.PI * 0.74 * p;
    });
    rig.rotation.y += ((open ? -0.06 : -0.18) - rig.rotation.y) * 0.06;
    rig.position.y = -0.12 + p * 0.12;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();

  const setOpen = (value) => {
    open = value; desired = value ? 1 : 0;
    stage.dataset.state = value ? 'open' : 'closed';
    launch.setAttribute('aria-expanded', String(value));
    layerNav.hidden = !value; reset.hidden = !value;
    status.textContent = value ? 'Expediente separado. Elige Resultados, Rutas o Emprendimientos.' : 'Expediente rearmado. Activa Explorar archivo para separar sus capas.';
    if (value) setTimeout(() => layerNav.querySelector('a')?.focus({preventScroll:true}), 380);
  };
  launch.addEventListener('click', () => setOpen(true));
  reset.addEventListener('click', () => {setOpen(false); launch.focus();});
  stage.addEventListener('pointermove', (event) => {
    if (!open) return;
    const rect = stage.getBoundingClientRect();
    rig.rotation.y = -0.06 + ((event.clientX - rect.left) / rect.width - 0.5) * 0.12;
    rig.rotation.x = -0.14 + ((event.clientY - rect.top) / rect.height - 0.5) * -0.08;
  });
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {setOpen(false); launch.focus();}
  });
}

initArchive();

const film = document.querySelector('#exhibition-film');
document.querySelector('.exhibition-film-open')?.addEventListener('click', () => film.showModal());
document.querySelector('.exhibition-film-close')?.addEventListener('click', () => film.close());
film?.addEventListener('click', (event) => {if (event.target === film) film.close();});

const activeFilters = document.querySelector('#active-filters span');
const search = document.querySelector('#search');
const division = document.querySelector('#division-filter');
const phase = document.querySelector('#phase-filter');
const count = document.querySelector('#result-count');
const updateActiveFilters = () => {
  const selected = [];
  if (search?.value.trim()) selected.push(`“${search.value.trim()}”`);
  if (division?.value) selected.push(division.value);
  if (phase?.value) selected.push(phase.value);
  activeFilters.textContent = `${selected.length ? selected.join(' · ') : 'Sin filtros'} · ${count?.textContent || '0'} expedientes`;
};
[search, division, phase].forEach((control) => control?.addEventListener(control === search ? 'input' : 'change', () => setTimeout(updateActiveFilters, 0)));
document.querySelector('#clear-filters')?.addEventListener('click', () => setTimeout(updateActiveFilters, 0));
new MutationObserver(updateActiveFilters).observe(count, {childList: true, characterData: true, subtree: true});
