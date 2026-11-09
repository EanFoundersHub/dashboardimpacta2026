const cutaway = document.querySelector('#claude-cutaway');
const stage = document.querySelector('.claude-cutaway-stage');
const launch = document.querySelector('.claude-archive-launch');
const status = document.querySelector('#claude-archive-status');
const loading = document.querySelector('.claude-cutaway-loading');

const syncState = (open) => {
  stage.dataset.state = open ? 'open' : 'closed';
  launch.setAttribute('aria-expanded', String(open));
  launch.innerHTML = open ? 'Rearmar expediente <span>↙</span>' : 'Explorar el archivo <span>→</span>';
  status.textContent = open
    ? 'ELIGE RESULTADOS, RUTAS O EMPRENDIMIENTOS'
    : 'EXPEDIENTE IMPACTA 2026 · TRES ACCESOS';
};

launch.addEventListener('click', () => {
  const open = !cutaway.hasAttribute('exploded');
  cutaway.toggleAttribute('exploded', open);
  syncState(open);
});

cutaway.addEventListener('cutaway-state', (event) => syncState(Boolean(event.detail.exploded)));
cutaway.addEventListener('cutaway-select', (event) => {
  const destinations = {panorama: '#panorama', rutas: '#programas', portafolio: '#portafolio'};
  const target = document.querySelector(destinations[event.detail.dest]);
  if (!target) return;
  if (window.impactaTravel) window.impactaTravel(target, `${target.dataset.chapter || '00'} · ${event.detail.title.toUpperCase()}`);
  else target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
});

let checks = 0;
const revealComponent = () => {
  const ready = Boolean(cutaway.renderer || cutaway.shadowRoot?.querySelector('.static'));
  if (ready || checks++ > 80) {
    loading.hidden = true;
    stage.dataset.ready = ready ? 'true' : 'fallback';
    return;
  }
  setTimeout(revealComponent, 75);
};
revealComponent();

window.__impactaClaudePortada = {
  open: () => {cutaway.setAttribute('exploded', ''); syncState(true);},
  close: () => {cutaway.removeAttribute('exploded'); syncState(false);},
  component: cutaway
};
