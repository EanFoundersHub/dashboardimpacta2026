// Cifras de cierre 2026 · cinta de resultados por programa (inicio, entre portada y Programas).
// Datos de la presentación de cierre 2026. Los destinos usan las rutas y filtros existentes del portafolio.
const PF = p => '#/portafolio?anio=2026&programa=' + encodeURIComponent(p);
export const CIERRE_FUENTE = 'Fuente: presentación de cierre 2026 y corte operativo de los programas';
export const CIERRE = [
  { id: 'foundershub', nombre: 'FoundersHub', color: '#F6B24E', colorOn: '#1F2124', cifras: [
    { valor: '170', rotulo: 'Startups en el pipeline', tipo: 'detalle', detalleId: 'cc-fh-pipeline', accion: 'Ver detalle',
      detalle: { titulo: '170 startups en el pipeline', texto: 'La presentación de cierre registra 170 startups en el pipeline de FoundersHub. En el portafolio se consultan 169 fichas únicas: SURCOLME y Ousia corresponden al mismo emprendimiento y se presentan en una sola ficha.', href: PF('FoundersHub'), accion: 'Ver detalle' } },
    { valor: '84', rotulo: 'Iniciativas con ingresos', tipo: 'enlace', href: PF('FoundersHub') + '&programMetric=founders-income', accion: 'Ver detalle' },
    // Reservadas: se publican cuando existan las listas nominales aprobadas (añadir href y cambiar tipo a 'enlace').
    { valor: '45', rotulo: 'En crecimiento', tipo: 'reservada' },
    { valor: '12', rotulo: 'Con expansión o inversión', tipo: 'reservada' },
  ] },
  { id: 'impacta-inhouse', nombre: 'Impacta InHouse', color: '#3EAF49', colorOn: '#0E2E12', cifras: [
    { valor: '451', rotulo: 'Iniciativas acompañadas', tipo: 'enlace', href: PF('Impacta InHouse'), accion: 'Ver detalle' },
  ] },
  { id: 'science2venture', nombre: 'Science2Venture', color: '#1E5AA8', colorOn: '#FFFFFF', cifras: [
    { valor: '35', rotulo: 'Postulaciones científico-tecnológicas', tipo: 'info', nota: 'Alcance de la convocatoria' },
    { valor: '27', rotulo: 'Equipos en acompañamiento', tipo: 'enlace', href: PF('Science2Venture'), accion: 'Ver detalle' },
    { valor: '17', rotulo: 'Con MVP funcional reportado', tipo: 'enlace', href: PF('Science2Venture') + '&programMetric=science-prototype', accion: 'Ver detalle' },
    { valor: '14', rotulo: 'Con TRL validado de 4 o superior', tipo: 'enlace', href: PF('Science2Venture') + '&programMetric=science-trl-4-plus', accion: 'Ver detalle' },
  ] },
];
export const CIERRE_NOTA = { valor: '831', rotulo: 'estudiantes acompañados', contexto: 'Alcance institucional · Corte del 13 de noviembre de 2026' };

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ARROW = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const HOJAS = ['cuadriculado', 'bond', 'rayado'];
let ORD = 0;
function cifra(c, g, i) {
  const k = ORD++, hoja = c.tipo === 'info' ? 'tira' : HOJAS[k % 3], rot = [-1.4, .9, -.6, 1.3, -1, .5][k % 6], tape = [-7, 5, -3, 8, -5, 3][k % 6];
  const paper = `<span class="cc-cut__paper cc-cut__paper--${hoja}" aria-hidden="true"></span>` + (c.tipo === 'info' ? '' : `<span class="cc-cut__tape" aria-hidden="true" style="--tr:${tape}deg"></span>`);
  const n = paper + `<span class="cc-cut__num" data-v="${esc(c.valor)}">${esc(c.valor)}</span><span class="cc-cut__label">${esc(c.rotulo)}</span>`;
  const st = `style="--d:${380 + k * 90}ms;--rot:${rot}deg"`;
  if (c.tipo === 'info') return `<li class="cc-cut cc-cut--info" ${st}>${n}<span class="cc-cut__note">${esc(c.nota)}</span></li>`;
  if (c.tipo === 'enlace') return `<li class="cc-cut cc-cut--link" ${st}><a href="${esc(c.href)}" aria-label="${esc(c.valor + ' ' + c.rotulo + ' · ' + c.accion + ' de ' + g.nombre)}">${n}<span class="cc-cut__action">${esc(c.accion)} ${ARROW}</span></a></li>`;
  if (c.tipo === 'detalle') { const d = c.detalle;
    return `<li class="cc-cut cc-cut--link" ${st}><button type="button" popovertarget="${c.detalleId}" aria-label="${esc(c.valor + ' ' + c.rotulo + ' · ' + c.accion)}">${n}<span class="cc-cut__action">${esc(c.accion)} ${ARROW}</span></button>
      <div class="cc-pop" id="${c.detalleId}" popover style="--c:${g.color}"><span class="cc-pop__kicker">${esc(g.nombre)} · Cifra de cierre</span><h3>${esc(d.titulo)}</h3><p>${esc(d.texto)}</p><p class="cc-pop__src">${esc(CIERRE_FUENTE)}</p>
        <div class="cc-pop__actions"><a class="pp__btn" href="${esc(d.href)}">${esc(d.accion)} ${ARROW}</a><button type="button" class="cc-pop__close" popovertarget="${c.detalleId}" popovertargetaction="hide">Cerrar</button></div></div></li>`; }
  return ''; // 'reservada': no se publica hasta tener la lista nominal
}

export function cifrasCierre() {
  ORD = 0;
  return `<section class="cc" id="cifras-cierre" aria-labelledby="cc-title" data-component="ClosingFigures">
  <div class="pp__arch-head cc__head"><h2 id="cc-title">Cifras de cierre <em class="cc__year">2026</em></h2><span>Resultados por programa</span></div>
  <div class="cc__strip"><span class="cc__band" aria-hidden="true"></span><span class="cc__tape cc__tape--l" aria-hidden="true"></span><span class="cc__tape cc__tape--r" aria-hidden="true"></span>
    <div class="cc__groups">${CIERRE.map(g => `<section class="cc-group cc-group--${g.id}" style="--c:${g.color};--c-on:${g.colorOn}" aria-labelledby="cc-g-${g.id}">
      <h3 class="cc-group__tab" id="cc-g-${g.id}">${esc(g.nombre)}</h3>
      <ul class="cc-group__cuts">${g.cifras.map((c, i) => cifra(c, g, i)).join('')}</ul></section>`).join('')}</div>
    <div class="cc__foot"><p class="cc__nota"><b>${esc(CIERRE_NOTA.valor)}</b> ${esc(CIERRE_NOTA.rotulo)}<span>${esc(CIERRE_NOTA.contexto)}</span></p><p class="cc__src">${esc(CIERRE_FUENTE)}</p></div>
  </div></section>`;
}

// Revelado breve de los recortes al entrar en pantalla (una vez). Sin efecto con movimiento reducido.
if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  // Conteo de cifras al posarse cada recorte (600 ms, ease-out). El valor final ya está en el HTML.
  const count = el => {
    const v = el.dataset.v, n = parseInt(v.replace(/\D/g, ''), 10); if (!n || RM.matches) return;
    const delay = parseFloat(getComputedStyle(el.closest('.cc-cut')).getPropertyValue('--d')) + 260, t0 = performance.now() + delay, dur = 640;
    el.style.minWidth = el.offsetWidth + 'px';
    const step = now => { const t = Math.min(1, Math.max(0, (now - t0) / dur)); el.textContent = v.replace(/\d+/, String(Math.round(n * (1 - Math.pow(1 - t, 3))))); if (t < 1) requestAnimationFrame(step); };
    el.textContent = v.replace(/\d+/, '0'); requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); e.target.querySelectorAll('.cc-cut__num[data-v]').forEach(count); io.unobserve(e.target); } }), { threshold: .2 });
  new MutationObserver(() => document.querySelectorAll('.cc:not([data-cc-obs])').forEach(el => { el.dataset.ccObs = '1'; el.classList.add('cc--anim'); io.observe(el); }))
    .observe(document.documentElement, { childList: true, subtree: true });
}
