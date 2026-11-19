// Ean Impacta Startup Report 2026 · app (HTML/CSS/JS sin dependencias)
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICON = n => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${{
  buscar: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>', cerrar: '<path d="M6 6l12 12M18 6L6 18"/>', flecha: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  atras: '<path d="M20 12H5M11 6l-6 6 6 6"/>', filtro: '<path d="M4 6h16M7 12h10M10 18h4"/>', grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  lista: '<path d="M8 6h12M8 12h12M8 18h12"/>', pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>' }[n]}</svg>`;
const CH = { verde: ['#3EAF49', '#0E2E12'], amarilla: ['#FFC62F', '#1F2124'], turquesa: ['#40C0C0', '#0C3B3B'], morada: ['#8F499C', '#FFFFFF'], naranja: ['#F78D2D', '#1F2124'] };
const VERT_COLOR = v => { const n = (v || '').toLowerCase(); return n.includes('circular') ? 'verde' : n.includes('alimentaria') || n.includes('agro') ? 'amarilla' : n.includes('inclus') || n.includes('educa') ? 'morada' : n.includes('turismo') || n.includes('naturaleza') || n.includes('bioecon') ? 'naranja' : 'turquesa'; };
const chVars = c => `--chapter:${CH[c][0]};--chapter-ink:${CH[c][1]}`;
const initials = n => n.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const cop = n => '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n) + ' COP';
const TORN = 'polygon(2% 4%,12% 2%,24% 4.5%,37% 1.5%,50% 4%,63% 2%,76% 4.5%,88% 1.8%,98% 4%,97% 18%,98.5% 34%,97% 50%,98.6% 66%,97.2% 82%,98% 96%,86% 97.8%,73% 95.6%,60% 98%,47% 95.8%,34% 98.2%,21% 95.7%,9% 97.8%,2% 96%,3% 80%,1.4% 64%,3.2% 48%,1.5% 32%,3% 16%)';
document.documentElement.style.setProperty('--torn-clip', TORN);

let DATA = null, BYID = new Map();
const state = { scrollByRoute: {} };

// ---------- Filtros del directorio (solo positivos) ----------
const city = s => {
  const raw = (s || '').split(',')[0].trim();
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return key.startsWith('bogota') ? 'Bogotá D.C.' : raw;
};
const FACETS = [
  { key: 'anio', label: 'Año de acompañamiento', get: s => (s.anios || []).map(String) },
  { key: 'programa', label: 'Programa', get: s => reportedPrograms(s) },
  { key: 'afiliacion', label: 'Afiliación Eanista', get: s => s.formacionEan?.afiliacion ? [s.formacionEan.afiliacion] : [] },
  { key: 'carrera', label: 'Carrera o programa académico', get: s => s.formacionEan?.programa ? [s.formacionEan.programa] : [] },
  { key: 'cohorte', label: 'Cohorte', get: s => (s.anios || []).map(String).includes('2026') ? ['Cohorte 9 (2026)'] : (s.cohorte ? [s.cohorte] : []) },
  { key: 'fase', label: 'Fase', get: s => s.fases || [] },
  { key: 'sector', label: 'Sector económico', get: s => s.sector ? [s.sector] : [], top: 14 },
  { key: 'vertical', label: 'Vertical de sostenibilidad', get: s => s.vertical ? [s.vertical] : [] },
  { key: 'ods', label: 'ODS', get: s => (s.medicion?.ods || []).map(n => 'ODS ' + n) },
  { key: 'ubicacion', label: 'Ubicación', get: s => s.ubicacion ? [city(s.ubicacion)] : [], top: 12 },
  { key: 'atributo', label: 'Capacidades', multi: true, get: s => [
    s.baseTec && 'Base tecnológica', s.liderazgoFemenino && 'Liderazgo femenino', s.medicion?.certificaciones && 'Certificaciones',
    s.medicion?.tecnologias && 'Tecnología emergente', s.medicion?.propiedadIntelectual && 'Propiedad intelectual',
    s.medicion?.internacional && 'Internacionalización', (s.reconocimientos || s.medicion?.premios) && 'Reconocimientos',
    (s.medicion?.buscaInversion || s.medicion?.levantoInversion) && 'Inversión', s.medicion?.productoNuevo && 'Productos o servicios nuevos'].filter(Boolean) }
];
const PAGE = 24;
const ODS = ["Fin de la pobreza","Hambre cero","Salud y bienestar","Educación de calidad","Igualdad de género","Agua limpia y saneamiento","Energía asequible y no contaminante","Trabajo decente y crecimiento económico","Industria, innovación e infraestructura","Reducción de las desigualdades","Ciudades y comunidades sostenibles","Producción y consumo responsables","Acción por el clima","Vida submarina","Vida de ecosistemas terrestres","Paz, justicia e instituciones sólidas","Alianzas para lograr los objetivos"];
const sdgBadge = n => `<span class="ir-badge ir-badge--sdg" data-component="SdgBadge" style="--sdg:var(--sdg-${n});--sdg-ink:var(--sdg-${n}-ink)" title="ODS ${n} · ${ODS[n - 1]}"><b>${n}</b>${ODS[n - 1]}</span>`;

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
}
function setQuery(q, replace = true) {
  const { parts } = parseHash();
  const s = q.toString(); const url = '#/' + parts.join('/') + (s ? '?' + s : '');
  replace ? history.replaceState(null, '', url) : history.pushState(null, '', url);
}

// ---------- Vistas ----------
const PROGRAM_ASSET = 'assets/programas-home/assets/';
const PROGRAM_FOCUSES = [
  { id:'cientifico', nombre:'Emprendimiento científico', subtitulo:'Investigación aplicada y soluciones de base científica que avanzan hacia el mercado.' },
  { id:'aprendedor', nombre:'De Aprendedor a emprendedor', subtitulo:'Una ruta para convertir conocimientos, capacidades e ideas en iniciativas empresariales.' },
  { id:'comunidad-eanista', nombre:'Comunidad Eanista en consultorio', subtitulo:'Orientación y acompañamiento para emprendimientos de la comunidad Eanista.' },
  { id:'mentorias-internacionales', nombre:'Mentorías internacionales', subtitulo:'Conexiones con expertos internacionales para fortalecer decisiones, capacidades y crecimiento.' },
  { id:'alistamiento-inversion', nombre:'Alistamiento para la inversión', subtitulo:'Preparación comercial y financiera para relacionarse con fuentes de capital.' },
  { id:'incubacion-especializada', nombre:'Incubación especializada', subtitulo:'Acompañamiento concentrado en sectores, retos y modelos de negocio específicos.' },
  { id:'venture-building', nombre:'Venture Building', subtitulo:'Diseño, construcción y validación de nuevas iniciativas junto a aliados organizacionales.' }
];
const PROGRAMS = [
  { id:'science2venture', nombre:'Science2Venture', enfoque:'cientifico', carpeta:'science2venture', tono:'oscuro', color:'#1E5AA8', colorOn:'#FFFFFF', anios:[2026], programa:'Science2Venture' },
  { id:'impacta-inhouse', nombre:'Impacta InHouse', enfoque:'aprendedor', carpeta:'impacta-inhouse', tono:'claro', color:'#3EAF49', colorOn:'#0E2E12', anios:[2026], programa:'Impacta InHouse', descripcion:'Acompañamiento de Ean Impacta para fortalecer el paso de aprendiz a emprendedor.', href:'impacta-inhouse/' },
  { id:'foundershub', nombre:'FoundersHub', enfoque:'comunidad-eanista', carpeta:'foundershub', tono:'claro', color:'#F6B24E', colorOn:'#1F2124', anios:[2026], programa:'FoundersHub' },
  { id:'conecta', nombre:'Conecta', enfoque:'mentorias-internacionales', carpeta:'amarilla', tono:'claro', color:'#FFC62F', colorOn:'#1F2124', anios:[2026], programa:'Conecta - Bridge for Billions' },
  { id:'pum', nombre:'PUM', enfoque:'mentorias-internacionales', carpeta:'naranja', tono:'claro', color:'#F78D2D', colorOn:'#1F2124', anios:[2026], programa:'PUM', descripcion:'Iniciativa de mentorías internacionales del ecosistema Ean Impacta.' },
  { id:'tangara-ir', programa:'Tángara Investment Readiness', nombre:'Tángara Investment Readiness', subtitulo:'Alistamiento para la Inversión', enfoque:'alistamiento-inversion', carpeta:'tangara', tono:'oscuro', color:'#C8197C', colorOn:'#FFFFFF', anios:[2026], descripcion:'Es un programa que busca fortalecer y preparar emprendimientos climáticos de los sectores de bioeconomía, economía circular, transición energética y agrotecnología para acceder a inversión. Su propósito es cerrar brechas financieras y comerciales, conectar empresas con inversionistas y corporativos, e impulsar soluciones sostenibles con potencial de crecimiento e impacto ambiental medible.', href:'https://tangara-ir.com/comunidad/' },
  { id:'swisscontact', nombre:'Swisscontact', enfoque:'alistamiento-inversion', carpeta:'swisscontact', tono:'oscuro', color:'#E2001A', colorOn:'#FFFFFF', anios:[2026], programa:'Swisscontact', href:'https://swisscontact-diagnosticos.afcaballero.workers.dev/auth/login?redirect=%2Fauth%2Fstart' },
  { id:'feoracle', nombre:'Feoracle', enfoque:'incubacion-especializada', carpeta:'verde', tono:'claro', color:'#3EAF49', colorOn:'#0E2E12', anios:[2026], descripcion:'Iniciativa de incubación especializada del ecosistema Ean Impacta.' },
  { id:'vision-circular', programa:'Visión Circular', logo:'assets/brand/vision-circular.png', nombre:'Visión Circular', enfoque:'incubacion-especializada', carpeta:'turquesa', tono:'claro', color:'#40C0C0', colorOn:'#0C3B3B', anios:[2026], descripcion:'Iniciativa de incubación especializada con enfoque circular.' },
  { id:'cavipetrol', nombre:'Cavipetrol', enfoque:'venture-building', carpeta:'petroleo', tono:'oscuro', color:'#0B4A46', colorOn:'#FFFFFF', anios:[2026], descripcion:'Iniciativa de Venture Building acompañada por Ean Impacta.' }
];
const RECAP = { id:'recap-2026', nombre:'ReCap 2026', marca:'ReCap <em>2026</em>', carpeta:'recap-2026', tono:'claro', color:'#40C0C0', colorOn:'#0C3B3B', anios:[2026], href:'#/panorama', cta:'Ver ReCap 2026' };
const programFit = name => { const longest = Math.max(...name.split(/[\s–-]+/).map(x => x.length)); return `--fit:${Math.min(12, 60 / (longest * .62)).toFixed(2)}cqi`; };
const yearStamp = year => `<img class="exp__sello" src="${PROGRAM_ASSET}sellos/png/sello-${year}-oscuro.png" alt="Participación ${year}" width="96" height="96">`;
const dossierYearStamps = years => {
  const valid = [...new Set((years || []).map(Number).filter(y => y >= 2020 && y <= 2026))];
  return valid.length ? `<div class="ir-dossier__year-stamps" aria-label="Años de acompañamiento">${valid.map(y => `<img src="${PROGRAM_ASSET}sellos/png/sello-${y}-oscuro.png" alt="Acompañamiento ${y}">`).join('')}</div>` : '';
};
function programFolder(p, extra = '') {
  const long = p.nombre.length > 22 ? 'exp--xlargo' : p.nombre.length > 12 ? 'exp--largo' : '';
  const inner = `<img class="exp__carpeta" src="${PROGRAM_ASSET}carpetas/carpeta-${p.carpeta}.webp" alt=""><span class="exp__hoja"><span class="exp__marca"><h3 class="exp__nombre" style="${programFit(p.nombre)}">${p.marca || esc(p.nombre)}</h3><img class="exp__cinta" src="${PROGRAM_ASSET}papeles/cinta-masking.webp" alt=""></span></span><span class="exp__pie"><span class="exp__sellos">${p.anios.map(yearStamp).join('')}</span><span class="exp__cta">${esc(p.cta || 'Abrir programa')} <span aria-hidden="true">→</span></span></span>`;
  const cls = `exp ${long} is-sin-logo is-sin-foto exp--program ${extra}`;
  const style = `--c:${p.color};--c-on:${p.colorOn}`;
  return `<button type="button" class="${cls}" data-program-open="${esc(p.id)}" data-tono="${p.tono}" style="${style}" aria-label="${esc(p.nombre)} · Abrir programa">${inner}</button>`;
}
const PROGRAM_METRIC_LABELS = { metaEmpresas:'empresas · meta del programa', iniciativas:'iniciativas', digitales:'digitales', fisicos:'físicos', hibridos:'híbridos', servicios:'servicios', ventasDeclaradasCop:'ventas 2025 declaradas', facultades:'facultades identificadas', retos:'retos empresariales', conPrototipo:'con MVP funcional', conFinanciacion:'con financiación asignada', generanIngresos:'generan ingresos', baseTecnologicaODigital:'de base tecnológica o digital', acompanamientoEfectivo:'con acompañamiento efectivo', diagnosticosCompletos:'con diagnóstico completo', planesAccionDisponibles:'con plan de acción disponible' };
const PROGRAM_METRIC_FILTERS = { conPrototipo:'science-prototype', conFinanciacion:'science-financing', generanIngresos:'founders-income', baseTecnologicaODigital:'founders-tech', acompanamientoEfectivo:'swiss-accompanied', diagnosticosCompletos:'swiss-diagnostic', planesAccionDisponibles:'swiss-plan' };
function enrichedPrograms() { return PROGRAMS.map(p => { const d = DATA.programs2026?.[p.id]; return { ...p, descripcion:d?.descripcion || p.descripcion, cifras:p.id === 'tangara-ir' ? {metaEmpresas:44} : d?.cifras, directorio:p.programa ? (p.id === 'tangara-ir' ? '#/portafolio?programa=' : '#/portafolio?anio=2026&programa=') + encodeURIComponent(p.programa) : null }; }); }
function openProgram(id, source) {
  const p = enrichedPrograms().find(x => x.id === id); if (!p) return; const metrics = Object.entries(p.cifras || {}).filter(([,v]) => Number.isFinite(v)).slice(0, 4);
  const metricValue = (k,v) => k === 'ventasDeclaradasCop' ? new Intl.NumberFormat('es-CO', {maximumFractionDigits:2}).format(v / 1e12) + 'B COP' : new Intl.NumberFormat('es-CO').format(v);
  const href = k => p.directorio + (PROGRAM_METRIC_FILTERS[k] ? '&programMetric=' + PROGRAM_METRIC_FILTERS[k] : ''); const modal = $('#program-modal');
  modal.innerHTML = `<div class="pp-program__paper" role="document" style="--c:${p.color};--c-on:${p.colorOn}"><button type="button" class="pp-program__close" data-program-close aria-label="Cerrar">×</button><span class="pp__kicker">Programa · 2026</span><h2 id="program-modal-title" tabindex="-1">${esc(p.nombre)}</h2>${p.logo ? `<img src="${esc(p.logo)}" alt="${esc(p.nombre)}" width="180" style="display:block;max-width:60%;height:auto;margin:0 0 12px">` : ''}${p.subtitulo ? `<p><strong>${esc(p.subtitulo)}</strong></p>` : ''}${p.descripcion ? `<p style="white-space:pre-line">${esc(p.descripcion)}</p>` : ''}${metrics.length ? `<div class="pp-program__metrics">${metrics.map(([k,v]) => `<a href="${href(k)}"><b${k === 'ventasDeclaradasCop' ? ' class="pp-program__amount"' : ''}>${metricValue(k,v)}</b><span>${esc(PROGRAM_METRIC_LABELS[k] || k)}</span><small>Ver iniciativas →</small></a>`).join('')}</div>` : ''}<div class="pp-program__actions">${p.directorio ? `<a class="pp__btn" href="${p.directorio}">Ver portafolio del programa →</a>` : ''}${p.href ? `<a class="ir-btn" href="${esc(p.href)}" target="_blank" rel="noopener">Abrir micrositio del programa</a>` : ''}</div></div>`;
  modal.hidden = false; document.body.style.overflow = 'hidden'; state.programReturn = source; setTimeout(() => $('#program-modal-title')?.focus({ preventScroll:true }), 30);
}
function closeProgram() { const modal = $('#program-modal'); if (!modal || modal.hidden) return; modal.hidden = true; modal.innerHTML = ''; document.body.style.overflow = ''; state.programReturn?.focus(); }
function viewHome(q = new URLSearchParams()) {
  const enriched = enrichedPrograms();
  return `<div class="pp" data-component="ProgramArchive"><header class="pp__head"><img src="${PROGRAM_ASSET}marca/ean-impacta-negro.png" alt="Ean Universidad | Impacta"><nav aria-label="Portada"><a href="#/panorama">ReCap 2026</a><a href="#/" data-action="programs">Programas</a></nav></header>
  <section class="pp-cover" aria-labelledby="hero-title">
    <div class="pp-cover__kraft" aria-hidden="true"></div>
    <div class="pp-cover__copy"><span class="pp__kicker">Ean Impacta · Informe anual</span><h1 class="pp-cover__title" id="hero-title" tabindex="-1"><span>Ean Impacta</span><em>Startup</em><span>Report <b>2026</b></span></h1>
      <div class="pp-cover__intro"><p>El archivo vivo de las iniciativas acompañadas en 2026: los programas que las impulsan, sus soluciones y las capacidades que están construyendo.</p><a class="pp__btn" href="#/panorama">Abrir el informe <span aria-hidden="true">→</span></a></div>
    </div>
    <div class="pp-cover__archive" aria-hidden="true">
      <img class="pp-cover__folder pp-cover__folder--purple" src="${PROGRAM_ASSET}carpetas/carpeta-morada.webp" alt="">
      <div class="pp-cover__folder pp-cover__folder--orange">
        <img class="pp-cover__paper" src="${PROGRAM_ASSET}carpetas/carpeta-naranja.webp" alt="">
        <img class="pp-cover__mark" src="assets/brand/ean-impacta-negro.png" alt="">
      </div>
      <div class="pp-cover__folder pp-cover__folder--teal">
        <img class="pp-cover__paper" src="${PROGRAM_ASSET}carpetas/carpeta-turquesa.webp" alt="">
        <img class="pp-cover__mark" src="assets/brand/sello-impacta.png" alt="">
      </div>
    </div>
    <img class="pp-cover__stamp" src="${PROGRAM_ASSET}sellos/png/sello-2026-oscuro.png" alt="Corte 2026">
  </section>
  <section class="pp__arch" id="programas" aria-labelledby="program-title"><div class="pp__arch-head"><h2 id="program-title">Programas</h2><span>${enriched.length} programas</span></div>
    <div class="pp-focus"><div class="pp-focus__head"><b>Buscar enfoque de iniciativas</b></div><nav class="pp-focus__bar" aria-label="Enfoques de iniciativas">${PROGRAM_FOCUSES.map(f => `<button type="button" data-focus-jump="${f.id}">${esc(f.nombre)}</button>`).join('')}</nav></div>
    <div class="pp-focus-sections">${PROGRAM_FOCUSES.map((f, i) => { const items = enriched.filter(p => p.enfoque === f.id); return `<section class="pp-focus-section" id="enfoque-${f.id}" aria-labelledby="enfoque-title-${f.id}"><div class="pp-focus-section__head"><span>${String(i + 1).padStart(2,'0')} · Enfoque</span><h3 id="enfoque-title-${f.id}">${esc(f.nombre)}</h3><p>${esc(f.subtitulo)}</p></div><ul class="pp__grid">${items.map(p => `<li>${programFolder(p)}</li>`).join('')}</ul></section>`; }).join('')}</div>
  </section></div><div class="pp-program" id="program-modal" role="dialog" aria-modal="true" aria-labelledby="program-modal-title" hidden></div>
  <div class="pp-portfolio" id="portafolio-completo">${viewDirectory(q)}</div>`;
}
const metric = (v, t, cls = '') => { const s = String(v); const m = s.match(/^([\d.,]+)\s?(%)?$/); return `<div class="ir-metric ${cls}" data-component="MetricFigure"><span class="ir-metric__value">${m ? esc(m[1]) + (m[2] ? '<small>%</small>' : '') : esc(s)}</span><span class="ir-metric__text">${esc(t)}</span></div>`; };
const tornPhoto = (src, alt, ratio = '4x3', focus = '50% 18%') => src ? `<div class="foto-rasgada foto-rasgada--${ratio}" style="--foco:${focus}"><span class="foto-rasgada__papel" aria-hidden="true"></span><img class="foto-rasgada__img" src="${esc(src)}" alt="${esc(alt)}"><span class="foto-rasgada__grano" aria-hidden="true"></span></div>` : '';

function viewPanorama() {
  const U = DATA.insights.panorama.universos;
  const p = DATA.programs2026;
  const programs = [p.science2venture, p.foundershub, p.conecta, p.swisscontact].filter(Boolean);
  return `<section class="ir-section ir-overview" data-component="ImpactOverview" aria-labelledby="pan-title"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag" style="background:#fff;color:#0B4A46">ReCap 2026</span><h1 class="ir-section__title" id="pan-title" tabindex="-1">2026 es el centro del archivo</h1>
  <p class="ir-section__lead">Este corte reúne las iniciativas registradas en Science2Venture, FoundersHub, Conecta y Swisscontact durante 2026. Las cifras históricas aparecen después como contexto, sin mezclarse con el universo del año.</p></div>
  ${programs.map((x, i) => `<div class="ir-universe ir-reveal" style="--i:${i + 1}" data-kind="programa-2026"><div class="ir-universe__name"><span class="ir-label">Programa 2026</span><b>${esc(x.nombre)}</b></div>
  <div class="ir-universe__figures">${Object.entries(x.cifras).map(([k,v]) => metric(v, ({ iniciativas:'iniciativas', conPrototipo:'con MVP funcional', conFinanciacion:'con financiación asignada', generanIngresos:'generan ingresos', baseTecnologicaODigital:'de base tecnológica o digital' })[k] || k, 'ir-metric--l ir-metric--on-dark')).join('')}</div></div>`).join('')}
  <div class="ir-section__head" style="padding-top:var(--space-9)"><span class="ir-tag" style="background:#fff;color:#0B4A46">Contexto histórico</span><h2 class="ir-section__title" style="font-size:var(--fs-h2)">La trayectoria que antecede a 2026</h2>
  <p class="ir-section__lead">Estas cifras reúnen el portafolio y la medición previamente consolidados. Cada bloque conserva su propio denominador y no representa exclusivamente las iniciativas de 2026.</p></div>
  ${U.map((u, i) => `<div class="ir-universe ir-reveal" style="--i:${i}" data-kind="${u.id}"><div class="ir-universe__name"><span class="ir-label">Histórico · 0${i + 1}</span><b>${esc(u.titulo)}</b></div>
  <div class="ir-universe__figures">${u.cifras.map(c => metric(c.valor, c.texto, 'ir-metric--l ir-metric--on-dark')).join('')}</div></div>`).join('')}
  <div style="display:flex;justify-content:flex-end;padding-top:var(--space-6)"><a class="ir-btn" style="border-color:#fff;color:#fff" href="#/insights">Ver resultados ${ICON('flecha')}</a></div>
</div></section>`;
}

function viewInsights(q) {
  const I = DATA.insights.insights;
  const resultsNote = DATA.insights.panorama.notaBase.replace(/Insights/gi, 'Resultados');
  return `<section class="ir-section ir-paper-bg" aria-labelledby="ins-title"><div class="ir-container">
  <div class="ir-section__head"><h1 class="ir-section__title" id="ins-title" tabindex="-1">Resultados</h1>
  <p class="ir-section__lead">Resultados declarados por emprendimientos acompañados en distintos años. ${esc(resultsNote)} Abre una cifra para ver las iniciativas que la componen.</p></div>
  ${I.map(ch => `<div class="ir-chapter" data-component="InsightSection" id="cap-${ch.id}" style="${chVars(ch.color)}">
    <div class="ir-chapter__head"><span class="ir-tag ir-tag--chapter">${esc(ch.capitulo)}</span><h2 class="ir-chapter__title">${esc(ch.capitulo)}</h2>${ch.universo === 'directorio' ? '<p class="ir-label">Universo: portafolio Construye–Crece</p>' : ''}</div>
    <div class="ir-chapter__cards">${ch.cifras.map((c, j) => `<button type="button" class="ir-insight ir-reveal ${j === 0 ? 'ir-insight--feature' : ''}" style="--i:${j}" data-component="InsightCard" data-insight="${ch.id}:${c.id}" aria-expanded="false" aria-controls="insight-drawer" ${c.miembros ? '' : 'data-static="true"'}>
      <span class="ir-insight__tab">${esc(ch.capitulo)}</span>
      <span style="display:flex;align-items:baseline;gap:14px"><span class="ir-insight__value">${c.valor}</span>${c.pct ? `<span class="ir-insight__pct">${esc(c.pct)}</span>` : ''}</span>
      <span class="ir-insight__text">${esc(c.texto)}</span>${c.nota ? `<span class="ir-label">${esc(c.nota)}</span>` : ''}
      <span class="ir-insight__cta">${c.miembros ? 'Ver iniciativas de la cifra' : 'Ver en el portafolio'} ${ICON('flecha')}</span></button>`).join('')}</div>
  </div>`).join('')}
</div></section>`;
}

function insightDetail(s, c) {
  const m = s.medicion || {};
  switch (c.campo) {
    case 'productoNuevo': return m.productoNuevo;
    case 'tecnologias': return (m.tecnologias || []).join(' · ');
    case 'propiedadIntelectual': return (m.propiedadIntelectual || []).join(' · ');
    case 'certificaciones': { const t = m.certificaciones?.tipos || [], d = m.certificaciones?.detalle; return [...new Set([...t, ...(d && !t.some(x => x.toLowerCase() === d.toLowerCase()) ? [d] : [])])].join(' · '); }
    case 'internacional': return (m.internacional?.regiones || []).join(' · ');
    case 'premios': return m.premios;
    default: return '';
  }
}
function openDrawer(key, push = true) {
  const [cid, fid] = key.split(':'); const ch = DATA.insights.insights.find(x => x.id === cid); const c = ch?.cifras.find(x => x.id === fid);
  if (!c) return;
  if (!c.miembros) { location.hash = '#/portafolio?atributo=' + encodeURIComponent('Liderazgo femenino'); return; }
  const q = parseHash().q; if (push) { q.set('i', key); setQuery(q, false); }
  const dr = $('#insight-drawer'); dr.setAttribute('style', chVars(ch.color));
  const items = c.miembros.map(id => BYID.get(id)).filter(Boolean);
  const types = ch.filtros || [];
  dr.innerHTML = `<div class="ir-drawer__head"><span class="ir-label" style="color:inherit">${esc(ch.capitulo)}</span>
    <h2 class="ir-drawer__title" id="drawer-title" tabindex="-1">${esc(c.texto[0].toUpperCase() + c.texto.slice(1))}</h2>
    <div style="display:flex;align-items:baseline;gap:14px"><span class="ir-drawer__figure">${c.valor}</span>${c.pct ? `<span style="font:800 22px var(--font-display);white-space:nowrap">${esc(c.pct)}</span>` : ''}</div>
    <button class="ir-drawer__close" type="button" data-action="close-drawer" aria-label="Cerrar">${ICON('cerrar')}</button></div>
  <div class="ir-drawer__body">
    <p style="margin:0;font-size:14px;color:#2B2C30">${c.valor} emprendimientos ${esc(c.texto)}. ${esc(DATA.insights.panorama.notaBase.replace(/Insights/gi, 'Resultados'))}</p>
    <label class="ir-search" style="min-height:48px">${ICON('buscar')}<span class="ir-sr">Buscar en este conjunto</span><input type="search" placeholder="Buscar en este conjunto" data-drawer-search></label>
    ${types.length ? `<div class="ir-active" role="group" aria-label="Tipo">${types.map(t => `<button type="button" class="ir-badge ir-badge--cert" style="min-height:36px;border:0;cursor:pointer" aria-pressed="false" data-drawer-type="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    <p class="ir-count" data-drawer-count>${items.length} emprendimientos</p>
    <div data-drawer-list>${items.map(s => { const d = insightDetail(s, c); const col = VERT_COLOR(s.vertical);
      return `<a class="ir-drawer__item" href="#/e/${s.id}" data-name="${esc((s.nombre + ' ' + d + ' ' + (s.sector || '') + ' ' + (s.programas2026 || []).join(' ')).toLowerCase())}" data-types="${esc(d.toLowerCase())}"><span class="ir-card__logo" style="width:44px;height:44px;font-size:15px;${chVars(col)}">${s.logo ? `<img src="${esc(s.logo)}" alt="" loading="lazy">` : esc(initials(s.nombre))}</span><span><b>${esc(s.nombre)}</b><span>${esc([d, (s.programas2026 || []).length ? 'Programas: ' + s.programas2026.join(' · ') : '', s.sector, s.cohorte].filter(Boolean).join(' · '))}</span></span>${ICON('flecha').replace('<svg', '<svg width="20" height="20"')}</a>`; }).join('')}</div>
  </div>`;
  $$('[data-insight]').forEach(b => b.setAttribute('aria-expanded', b.dataset.insight === key ? 'true' : 'false'));
  dr.dataset.open = 'true'; $('.ir-overlay').dataset.open = 'true'; document.body.style.overflow = 'hidden';
  state.drawerReturn = $(`[data-insight="${key}"]`); setTimeout(() => $('#drawer-title')?.focus(), reduced() ? 0 : 320);
  const filt = () => { const t = $('[data-drawer-search]', dr).value.trim().toLowerCase(); const on = $$('[data-drawer-type][aria-pressed="true"]', dr).map(b => b.dataset.drawerType.toLowerCase());
    let n = 0; $$('[data-drawer-list] > a', dr).forEach(a => { const ok = (!t || a.dataset.name.includes(t)) && (!on.length || on.some(o => a.dataset.types.includes(o))); a.hidden = !ok; n += ok; }); $('[data-drawer-count]', dr).textContent = n + ' emprendimientos'; };
  $('[data-drawer-search]', dr).addEventListener('input', filt);
  $$('[data-drawer-type]', dr).forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); filt(); }));
}
function closeDrawer(push = true) {
  const dr = $('#insight-drawer'); if (dr.dataset.open !== 'true') return;
  dr.dataset.open = 'false'; $('.ir-overlay').dataset.open = 'false'; document.body.style.overflow = '';
  $$('[data-insight]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  if (push) { const q = parseHash().q; q.delete('i'); setQuery(q); }
  state.drawerReturn?.focus();
}

function filterList(q) {
  const term = (q.get('q') || '').trim().toLowerCase();
  const metricKey = q.get('programMetric');
  const metricMatches = s => !metricKey || ({
    'science-prototype': s.science2venture2026?.prototipoReportado === true,
    'science-financing': s.science2venture2026?.financiacionAsignada === true,
    'founders-income': s.foundersHub2026?.generaIngresos === true,
    'founders-tech': ['tech','digitales','digital','innovación'].includes((s.foundersHub2026?.categoria || '').toLowerCase()),
    'swiss-accompanied': s.swisscontact2026?.acompanamientoEfectivo === true,
    'swiss-diagnostic': s.swisscontact2026?.diagnosticoEstado === 'completo',
    'swiss-plan': s.swisscontact2026?.planAccionEstado === 'disponible'
  })[metricKey] === true;
  return DATA.startups.filter(s => !s.excluidoPortafolio && metricMatches(s) && FACETS.every(F => { const sel = q.getAll(F.key); if (!sel.length) return true; const v = F.get(s); return F.multi ? sel.every(x => v.includes(x)) : sel.some(x => v.includes(x)); })
    && (!term || (s.nombre + ' ' + (s.descripcion || '') + ' ' + (s.sector || '') + ' ' + (s.ubicacion || '') + ' ' + (s.programas2026 || []).join(' ')).toLowerCase().includes(term)));
}
function facetOptions(F) { const m = new Map(); DATA.startups.filter(s => !s.excluidoPortafolio).forEach(s => F.get(s).forEach(v => m.set(v, (m.get(v) || 0) + 1)));
  let arr = [...m.entries()]; arr.sort(F.key === 'cohorte' || F.key === 'ods' ? (a, b) => a[0].localeCompare(b[0], 'es', { numeric: true }) : (a, b) => b[1] - a[1]); return F.top ? arr.slice(0, F.top) : arr; }
const reportedPrograms = s => [...new Set([
  ...(s.programas2026 || []),
  ...(s.fases || []).map(fase => fase.trim()).filter(fase => /^(Construye|Crece|Descubre)$/i.test(fase)).map(fase => fase[0].toUpperCase() + fase.slice(1).toLowerCase()),
])];
const programMembership = (s, selected = []) => {
  const programs = reportedPrograms(s);
  if (!programs.length) return '';
  const focused = selected.filter(program => programs.includes(program));
  const others = programs.filter(program => !focused.includes(program));
  if (!focused.length) return `<span class="ir-card__programs"><span><b>Programas:</b> ${esc(programs.join(' · '))}</span></span>`;
  return `<span class="ir-card__programs"><span class="ir-card__program-focus"><b>${focused.length > 1 ? 'Programas filtrados' : 'Programa filtrado'}:</b> ${esc(focused.join(' · '))}</span>${others.length ? `<span><b>Otros programas:</b> ${esc(others.join(' · '))}</span>` : ''}</span>`;
};
const card = (s, selectedPrograms = []) => { const col = VERT_COLOR(s.vertical); const m = s.medicion || {};
  const tags = [s.vertical && `<span class="ir-badge">${esc(s.vertical)}</span>`, m.certificaciones && '<span class="ir-badge ir-badge--cert">Certificaciones</span>', m.tecnologias && '<span class="ir-badge ir-badge--tec">Tecnología emergente</span>', (s.reconocimientos || m.premios) && '<span class="ir-badge ir-badge--rec">Reconocimientos</span>', m.internacional && '<span class="ir-badge">Internacionalización</span>'].filter(Boolean).slice(0, 3).join('');
  const meta = [s.cohorte || (s.anios || []).join(', '), (s.fases || []).join(' · ')].filter(Boolean).join(' · ');
  return `<a class="ir-card" href="#/e/${s.id}" style="${chVars(col)}" data-component="StartupCard"><span class="ir-card__bar"></span><span class="ir-card__body">
  <span class="ir-card__top"><span class="ir-card__logo" aria-hidden="true">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : esc(initials(s.nombre))}</span>${meta ? `<span class="ir-label">${esc(meta)}</span>` : ''}</span>
  <h3 class="ir-card__name">${esc(s.nombre)}</h3>${s.descripcion ? `<p class="ir-card__desc">${esc(s.descripcion)}</p>` : ''}
  ${programMembership(s, selectedPrograms)}
  ${s.formacionEan?.programa ? `<span class="ir-card__programs"><span><b>Programa académico:</b> ${esc(s.formacionEan.programa)}</span></span>` : ''}
  ${Number.isFinite(s.science2venture2026?.montoFinanciacionCop) ? `<span class="ir-label" style="text-transform:none;letter-spacing:0;font-size:13px"><b>Financiación Science2Venture:</b> ${cop(s.science2venture2026.montoFinanciacionCop)}</span>` : ''}
  ${s.ubicacion ? `<span class="ir-card__meta">${ICON('pin')}${esc(s.ubicacion)}</span>` : ''}${s.sector ? `<span class="ir-label" style="text-transform:none;letter-spacing:0;font-size:13px">${esc(s.sector)}</span>` : ''}
  ${tags ? `<span class="ir-card__tags">${tags}</span>` : ''}<span class="ir-card__cta">Ver iniciativa</span></span></a>`; };

const solutionGroups = [
  'residuos reciclaje reutilizacion valorizacion compostaje circular',
  'energia energetica solar electricidad renovable fotovoltaica',
  'educacion aprendizaje capacitacion formacion ensenanza',
  'agua saneamiento alcantarillado tratamiento potabilizacion',
  'agricultura agro cultiv cultivo agronomico agropecuario',
  'movilidad transporte vehiculo viajes logistica',
  'salud bienestar cuidado diagnostico clinico',
  'software digital automatizacion datos inteligencia artificial',
];
const solutionWords = value => new Set((String(value || '').normalize('NFD')
  .replace(/\p{M}/gu, '').toLowerCase().match(/[a-z0-9]+/g) || [])
  .filter(word => word.length > 2 && !'que una uno los las del por para con como quiero busco necesito buscamos soluciones tipo emprendimientos empresas iniciativas'.split(' ').includes(word))
  .map(word => word.length > 4 ? word.replace(/(?:es|s)$/, '') : word));
function recommendSolutions(query, startups) {
  const terms = solutionWords(query);
  const groups = solutionGroups.map(solutionWords);
  return startups.map(startup => {
    const title = solutionWords([startup.nombre, startup.sector, startup.vertical, ...(startup.fases || [])].join(' '));
    const body = solutionWords([startup.descripcion, startup.medicion?.productos, startup.medicion?.productoNuevo].join(' '));
    let score = 0;
    for (const term of terms) {
      if (title.has(term)) score += 5;
      if (body.has(term)) score += 3;
    }
    const directMatches = [...terms].filter(term => title.has(term) || body.has(term)).length;
    if (directMatches === terms.size && directMatches > 1) score += 6;
    for (const group of groups) {
      if ([...terms].some(term => group.has(term)) && [...group].some(term => title.has(term) || body.has(term))) score += 2;
    }
    return { startup, score };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score || a.startup.nombre.localeCompare(b.startup.nombre, 'es'));
}
function portfolioExplorer() {
  return `<section class="ir-block" aria-labelledby="explore-title">
    <h2 id="explore-title">Explorar portafolio</h2>
    <form data-explore style="display:grid;gap:12px">
      <label for="solution-query">¿Qué tipo de solución estás buscando?</label>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <label class="ir-search" style="flex:1 1 250px">${ICON('buscar')}<input id="solution-query" name="solucion" type="search" maxlength="220" required placeholder="Ejemplo: aprovechar residuos de alimentos"></label>
        <button class="ir-btn ir-btn--primary" type="submit">Ver recomendaciones</button>
      </div>
    </form>
    <p data-explore-status role="status"></p>
    <div class="ir-grid" data-explore-results></div>
  </section>`;
}
function viewDirectory(q) {
  const res = filterList(q), view = q.get('vista') === 'compacta' ? 'compact' : 'grid', limit = Math.max(PAGE, +q.get('n') || PAGE);
  const selectedProgram = q.get('programa');
  const programData = selectedProgram ? enrichedPrograms().find(p => p.programa === selectedProgram) : null;
  const programTotal = programData?.cifras?.iniciativas;
  const programAvailable = selectedProgram ? DATA.startups.filter(s => (s.programas2026 || []).includes(selectedProgram)).length : 0;
  const consolidationCount = selectedProgram === 'Impacta InHouse' && Number.isFinite(programTotal) ? Math.max(0, programTotal - programAvailable) : 0;
  const years = facetOptions(FACETS[0]).map(([y,n]) => [y,n]).sort((a,b) => Number(b[0]) - Number(a[0]));
  const chips = FACETS.flatMap(F => q.getAll(F.key).map(v => ({ k: F.key, v }))); if (q.get('q')) chips.push({ k: 'q', v: q.get('q') }); if (q.get('programMetric')) chips.push({ k:'programMetric', v:q.get('programMetric'), label:'Cifra seleccionada' });
  const nActive = chips.length;
  return `<section class="ir-section" aria-labelledby="dir-title"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag">Portafolio</span><h1 class="ir-section__title" id="dir-title" tabindex="-1">Todas las iniciativas</h1>
  <p class="ir-section__lead">Consulta el portafolio completo por año, nombre, sector, ciudad o programa.</p>${selectedProgram === 'Tángara Investment Readiness' ? '<p class="ir-program-status">El catálogo reúne 48 fichas. La meta del programa fue de 44 empresas.</p>' : ''}${consolidationCount ? `<p class="ir-program-status"><b>${programAvailable} iniciativas disponibles en el portafolio.</b> Las ${consolidationCount} iniciativas restantes se encuentran en consolidación para incorporarse al portafolio.</p>` : ''}</div>
  ${portfolioExplorer()}
  <nav class="ir-year-filter" aria-label="Filtrar portafolio por año"><button type="button" data-year="" aria-pressed="${!q.getAll('anio').length}">Todos los años</button>${years.map(([y,n]) => `<button type="button" data-year="${esc(y)}" aria-pressed="${q.getAll('anio').includes(y)}">${esc(y)} <span>${n}</span></button>`).join('')}</nav>
  <div class="ir-dir">
    <aside class="ir-filters" id="filters" data-open="false" data-component="FilterBar" aria-label="Filtros">
      <div class="ir-filters__mobile-head" style="justify-content:space-between;align-items:center"><b style="font:800 24px var(--font-display)">Filtros</b><button class="ir-drawer__close" style="position:static" type="button" data-action="close-filters" aria-label="Cerrar filtros">${ICON('cerrar')}</button></div>
      ${FACETS.map(F => `<fieldset class="ir-facet"><legend class="ir-label">${esc(F.label)}</legend>${facetOptions(F).map(([v, n]) => `<label class="ir-facet__opt"><input type="checkbox" data-facet="${F.key}" value="${esc(v)}" ${q.getAll(F.key).includes(v) ? 'checked' : ''}>${esc(v)}<span class="ir-facet__count">${n}</span></label>`).join('')}</fieldset>`).join('')}
      <div class="ir-filters__apply" style="position:fixed;left:0;right:0;bottom:0;padding:12px var(--gutter);background:var(--color-paper-2);border-top:1px solid var(--color-line);gap:10px"><button class="ir-btn" type="button" data-action="clear">Limpiar</button><button class="ir-btn ir-btn--primary" style="flex:1" type="button" data-action="close-filters">Ver ${res.length} resultados</button></div>
    </aside>
    <div style="min-width:0">
      <div style="display:flex;gap:10px"><label class="ir-search" style="flex:1" data-component="DirectorySearch">${ICON('buscar')}<span class="ir-sr">Buscar emprendimientos</span><input type="search" placeholder="Buscar por nombre, sector o ciudad" value="${esc(q.get('q') || '')}" data-search></label>
      <button class="ir-btn ir-btn--primary ir-filters-btn" type="button" data-action="open-filters" aria-controls="filters" aria-expanded="false">${ICON('filtro')} Filtros${nActive ? ' · ' + nActive : ''}</button></div>
      <div class="ir-toolbar"><span class="ir-count" aria-live="polite">${res.length} emprendimientos</span>
        <div class="ir-view-toggle" role="group" aria-label="Vista"><button type="button" aria-pressed="${view === 'grid'}" data-view="grid" aria-label="Cuadrícula">${ICON('grid')}</button><button type="button" aria-pressed="${view === 'compact'}" data-view="compacta" aria-label="Lista compacta">${ICON('lista')}</button></div></div>
      ${chips.length ? `<div class="ir-active" data-component="ActiveFilters" aria-label="Filtros activos">${chips.map(c => `<button type="button" class="ir-chip" data-remove="${c.k}" data-value="${esc(c.v)}" aria-label="Quitar ${esc(c.label || c.v)}">${esc(c.label || (c.k === 'q' ? '«' + c.v + '»' : c.v))}<i>×</i></button>`).join('')}<button type="button" class="ir-btn ir-btn--small" style="border:0;text-decoration:underline" data-action="clear">Limpiar filtros</button></div>` : ''}
      ${res.length ? `<div class="ir-grid" data-view="${view}" data-component="StartupGrid">${res.slice(0, limit).map(s => card(s, q.getAll('programa'))).join('')}</div>${res.length > limit ? `<div class="ir-more"><button class="ir-btn" type="button" data-action="more">Ver más · ${res.length - limit} restantes</button></div>` : ''}`
      : `<div class="ir-empty"><img src="assets/folders/carpeta-morada.webp" alt="" style="transform:rotate(-5deg)"><div style="display:flex;flex-direction:column;gap:12px"><h2 style="margin:0;font:800 28px/1.1 var(--font-display)">Ninguna iniciativa coincide con esta combinación.</h2><p style="margin:0">Quita un filtro o prueba otra búsqueda.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="ir-btn ir-btn--primary" type="button" data-action="undo">Quitar el último filtro</button><button class="ir-btn" type="button" data-action="clear">Limpiar todo</button></div></div></div>`}
    </div>
  </div></div></section>`;
}

function viewDossier(id) {
  const s = BYID.get(id === 'odem' ? 'agenciamidodem' : id); if (!s) return `<section class="ir-section"><div class="ir-container"><h1 class="ir-section__title" tabindex="-1">Iniciativa no encontrada</h1><p><a href="#/portafolio">Volver al portafolio</a></p></div></section>`;
  const m = s.medicion || {}, col = VERT_COLOR(s.vertical);
  const programs = reportedPrograms(s);
  const academic = s.formacionEan;
  const facts = [
    [programs.length === 1 ? 'Programa de Impacta' : 'Programas de Impacta', programs.join(' · ')],
    ['Vínculo con la Universidad Ean', [academic?.afiliacion, academic?.vinculo].filter(Boolean).join(' · ')],
    ['Carrera o programa académico', academic?.programa],
    ['Cohorte', s.cohorte], ['Financiación Science2Venture', Number.isFinite(s.science2venture2026?.montoFinanciacionCop) ? cop(s.science2venture2026.montoFinanciacionCop) : null], ['Fase', (s.fases || []).join(' · ')], ['Ubicación', s.ubicacion], ['Sector', s.sector], ['Vertical', s.vertical], ['Año de participación', (s.anios || []).join(', ')]].filter(f => f[1]);
  const blocks = [
    s.tangaraCatalogo && ['Comunidad Tángara Investment Readiness', `<p>${esc([s.tangaraCatalogo.sector, s.tangaraCatalogo.subsector].filter(Boolean).join(' · '))}</p>${s.tangaraCatalogo.descripcion && s.tangaraCatalogo.descripcion !== s.descripcion ? `<p>${esc(s.tangaraCatalogo.descripcion)}</p>` : ''}`],
    s.trayectoria?.length && ['Trayectoria por programa y fase', `<ul>${s.trayectoria.map(row => `<li><b>${esc(row.nombreOriginal)}</b>${row.programas.length ? `<br>Programas: ${esc(row.programas.join(' · '))}` : ''}${row.fases.length ? `<br>Fases: ${esc(row.fases.join(' · '))}` : ''}${row.anios.length ? `<br>Años: ${esc(row.anios.join(' · '))}` : ''}${row.cohorte ? `<br>Cohorte: ${esc(row.cohorte)}` : ''}</li>`).join('')}</ul>`],
    s.enlacesCanva?.length && ['Sitio web y redes sociales', `<div class="ir-card__tags">${s.enlacesCanva.filter(link => /^https?:\/\//i.test(link.url)).map(link => `<a class="ir-btn ir-btn--small" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.nombre)} ${ICON('flecha')}</a>`).join('')}</div>`],
    m.productos && ['Productos o servicios', `<p style="margin:0">${esc(m.productos)}</p>`],
    m.productoNuevo && ['Producto o servicio nuevo', `<p style="margin:0">${esc(m.productoNuevo)}</p>`],
    m.tecnologias && ['Tecnologías', `<div class="ir-card__tags">${m.tecnologias.map(t => `<span class="ir-badge ir-badge--tec" data-component="TechnologyBadge">${esc(t)}</span>`).join('')}</div>`],
    m.certificaciones && ['Certificaciones', `<div class="ir-card__tags">${[...new Set([...m.certificaciones.tipos, m.certificaciones.detalle].filter(Boolean))].map(t => `<span class="ir-badge ir-badge--cert" data-component="CertificationBadge">${esc(t)}</span>`).join('')}</div>`],
    m.propiedadIntelectual && ['Propiedad intelectual', `<div class="ir-card__tags">${m.propiedadIntelectual.map(t => `<span class="ir-badge">${esc(t)}</span>`).join('')}</div>`],
    m.internacional && ['Internacionalización', `<p style="margin:0">Alcanzó mercados en ${esc(m.internacional.regiones.join(', '))}.</p>`],
    m.ods && ['Objetivos de Desarrollo Sostenible', `<div class="ir-card__tags">${m.ods.map(sdgBadge).join('')}</div>`],
    s.equipo?.length && ['Equipo', `<div class="ir-team">${s.equipo.map(p => `<div class="ir-member" data-component="FounderCard">${tornPhoto(p.foto, p.nombre, '4x5')}<b>${esc(p.nombre)}</b>${p.rol ? `<span class="ir-label" style="text-transform:none;letter-spacing:0;font-size:13px">${esc(p.rol)}</span>` : ''}</div>`).join('')}</div>`],
    (s.reconocimientos || m.premios) && ['Premios y reconocimientos', `<div class="ir-recognition" data-component="RecognitionCard"><p style="margin:0;max-width:52ch">${esc(s.reconocimientos || m.premios)}</p></div>`]
  ].filter(Boolean);
  const related = DATA.startups.filter(x => !x.excluidoPortafolio && x.id !== s.id && x.vertical && x.vertical === s.vertical).slice(0, 3);
  return `<article class="ir-dossier ir-paper-bg" data-component="StartupDossier" aria-labelledby="dos-title"><div class="ir-container">
  <div class="ir-dossier__back"><a class="ir-btn ir-btn--small" href="#/portafolio${state.lastDirQuery ? '?' + state.lastDirQuery : ''}" data-action="back">${ICON('atras')} Volver al portafolio</a></div>
  <div class="ir-dossier__grid">
    <div class="ir-dossier__folder"><img src="assets/folders/carpeta-${col}.webp" alt=""><div class="ir-dossier__sheet"><div class="ir-dossier__logo" style="${chVars(col)}">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : esc(initials(s.nombre))}</div>${tornPhoto(s.fotoEquipo || s.foto, `${s.fotoEquipo ? 'Equipo de ' : 'Foto de '}${s.nombre}`)}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-5)">
      <span class="ir-tag ir-tag--chapter" style="${chVars(col)}">Iniciativa${s.vertical ? ' · ' + esc(s.vertical) : ''}</span>
      <h1 class="ir-dossier__title" id="dos-title" tabindex="-1">${esc(s.nombre)}</h1>
      ${s.descripcion ? `<p class="ir-dossier__desc">${esc(s.descripcion)}</p>` : ''}
      ${facts.length ? `<div class="ir-facts">${facts.map(([k, v]) => `<div><span class="ir-label">${k}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      ${dossierYearStamps(s.anios)}
      ${blocks.map(([t, h]) => `<section class="ir-block"><h2>${t}</h2>${h}</section>`).join('')}
      ${related.length ? `<section class="ir-block"><h2>Emprendimientos relacionados</h2><div class="ir-grid">${related.map(startup => card(startup)).join('')}</div></section>` : ''}
    </div>
  </div></div></article>`;
}

// ---------- Router ----------
function render(focus = true) {
  const { parts, q } = parseHash(); const r = parts[0] || '';
  const prevKey = state.route; if (prevKey) state.scrollByRoute[prevKey] = scrollY;
  const main = $('#main');
  document.body.querySelector(':scope > #program-modal')?.remove();
  const isPortfolio = r === 'portafolio' || r === 'directorio';
  const html = r === 'panorama' ? viewPanorama() : r === 'insights' ? viewInsights(q) : isPortfolio ? viewDirectory(q) : r === 'e' ? viewDossier(parts[1]) : viewHome(q);
  document.body.dataset.route = r || 'inicio';
  main.innerHTML = `<div class="ir-view">${html}</div>`;
  const programModal = $('#program-modal'); if (programModal) document.body.appendChild(programModal);
  if (isPortfolio) state.lastDirQuery = q.toString();
  $$('[data-nav]').forEach(a => a.toggleAttribute('aria-current', false)); const cur = $(`[data-nav="${r === 'e' || isPortfolio ? 'portafolio' : r}"]`); cur && cur.setAttribute('aria-current', 'page');
  closeMenu();
  const key = r + (r === 'e' ? '/' + parts[1] : ''); state.route = key;
  if (isPortfolio && state.scrollByRoute.portafolio != null && state.fromDossier) window.scrollTo(0, state.scrollByRoute.portafolio); else window.scrollTo(0, 0);
  state.fromDossier = r === 'e';
  if (focus) setTimeout(() => main.querySelector('h1[tabindex]')?.focus({ preventScroll: true }), 30);
  observeReveals();
  if (r === 'home' || r === '') setTimeout(() => { const rc = $('.ir-route'); rc && (rc.dataset.state = 'open'); }, reduced() ? 0 : 500);
  if (r === 'insights' && q.get('i')) openDrawer(q.get('i'), false); else closeDrawer(false);
  bindView(r, q);
}
function observeReveals() { const els = $$('.ir-reveal'); if (reduced() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .15 }); els.forEach(e => io.observe(e)); }
function bindView(r, q) {
  if (r === 'insights') $$('[data-insight]').forEach(b => b.addEventListener('click', () => openDrawer(b.dataset.insight)));
  if (r !== 'portafolio' && r !== 'directorio' && r !== '') return;
  $('[data-explore]')?.addEventListener('submit', event => {
    event.preventDefault();
    const results = recommendSolutions(new FormData(event.currentTarget).get('solucion'), filterList(q));
    const shown = results.slice(0, 12);
    $('[data-explore-results]').innerHTML = shown.map(({startup}) => card(startup, q.getAll('programa'))).join('');
    $('[data-explore-status]').textContent = shown.length
      ? `Mostrando ${shown.length} de ${results.length} iniciativas relacionadas con tu búsqueda.`
      : 'Prueba con otra necesidad o una palabra clave más concreta.';
  });
  const upd = fn => { const nq = parseHash().q; fn(nq); nq.delete('n'); history.replaceState(null, '', '#/portafolio' + (nq.toString() ? '?' + nq : '')); state.lastQ = nq; render(false); };
  $$('[data-year]').forEach(b => b.addEventListener('click', () => upd(nq => { nq.delete('anio'); if (b.dataset.year) nq.append('anio', b.dataset.year); })));
  let t; const inp = $('[data-search]'); inp?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const pos = inp.selectionStart; upd(nq => inp.value.trim() ? nq.set('q', inp.value) : nq.delete('q')); const ni = $('[data-search]'); ni.focus(); ni.setSelectionRange(pos, pos); }, 220); });
  $$('[data-facet]').forEach(cb => cb.addEventListener('change', () => { const k = cb.dataset.facet, v = cb.value; const open = $('#filters').dataset.open === 'true';
    upd(nq => { const cur = nq.getAll(k); nq.delete(k); (cb.checked ? [...cur, v] : cur.filter(x => x !== v)).forEach(x => nq.append(k, x)); state.order = [...(state.order || []).filter(o => o !== k + '=' + v), ...(cb.checked ? [k + '=' + v] : [])]; });
    if (open) { $('#filters').dataset.open = 'true'; $(`[data-facet="${k}"][value="${CSS.escape(v)}"]`)?.focus(); } }));
  $$('[data-remove]').forEach(b => b.addEventListener('click', () => upd(nq => { const k = b.dataset.remove, v = b.dataset.value; if (k === 'q') nq.delete('q'); else { const cur = nq.getAll(k).filter(x => x !== v); nq.delete(k); cur.forEach(x => nq.append(k, x)); } })));
  $$('[data-view]').forEach(b => b.addEventListener('click', () => upd(nq => b.dataset.view === 'compacta' ? nq.set('vista', 'compacta') : nq.delete('vista'))));
}

document.addEventListener('click', e => {
  const focusJump = e.target.closest('[data-focus-jump]'); if (focusJump) { $(`#enfoque-${focusJump.dataset.focusJump}`)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block:'start' }); return; }
  const programOpen = e.target.closest('[data-program-open]'); if (programOpen) { openProgram(programOpen.dataset.programOpen, programOpen); return; }
  if (e.target.closest('[data-program-close]') || e.target.id === 'program-modal') { closeProgram(); return; }
  if (e.target.closest('#program-modal a')) document.body.style.overflow = '';
  const a = e.target.closest('[data-action]'); if (!a) return; const act = a.dataset.action;
  if (act === 'programs') { e.preventDefault(); $('#programas')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  if (act === 'menu') { const n = $('#mobile-nav'); const o = n.dataset.open !== 'true'; n.dataset.open = o; a.setAttribute('aria-expanded', o); a.textContent = o ? 'Cerrar' : 'Índice'; }
  if (act === 'close-drawer') closeDrawer();
  if (act === 'open-filters') { $('#filters').dataset.open = 'true'; a.setAttribute('aria-expanded', 'true'); $('#filters input')?.focus(); }
  if (act === 'close-filters') { $('#filters').dataset.open = 'false'; $('[data-action="open-filters"]')?.focus(); }
  if (act === 'clear') { history.replaceState(null, '', '#/portafolio'); state.order = []; render(false); }
  if (act === 'undo') { const last = (state.order || []).pop(); const nq = parseHash().q; if (last) { const [k, v] = last.split('='); const cur = nq.getAll(k).filter(x => x !== v); nq.delete(k); cur.forEach(x => nq.append(k, x)); } else nq.delete('q'); history.replaceState(null, '', '#/portafolio' + (nq.toString() ? '?' + nq : '')); render(false); }
  if (act === 'more') { const nq = parseHash().q; nq.set('n', (+nq.get('n') || PAGE) + PAGE); history.replaceState(null, '', '#/portafolio?' + nq); const y = scrollY; render(false); window.scrollTo(0, y); }
});
function closeMenu() { const n = $('#mobile-nav'); if (n.dataset.open === 'true') { n.dataset.open = 'false'; const b = $('[data-action="menu"]'); b.setAttribute('aria-expanded', 'false'); b.textContent = 'Índice'; } }
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if ($('#program-modal') && !$('#program-modal').hidden) closeProgram(); else if ($('#insight-drawer').dataset.open === 'true') closeDrawer(); else if ($('#filters')?.dataset.open === 'true') { $('#filters').dataset.open = 'false'; } else closeMenu(); });
$('#insight-drawer').addEventListener('keydown', e => { if (e.key !== 'Tab') return; const f = $$('a[href],button,input', e.currentTarget).filter(x => !x.hidden && x.offsetParent); if (!f.length) return; const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
window.addEventListener('hashchange', () => render(true));

// ---------- Carga ----------
(async () => {
  const main = $('#main'); main.innerHTML = `<div class="ir-container ir-section"><div class="ir-grid">${Array.from({ length: 6 }, () => `<div class="ir-card ir-card--skeleton"><span class="ir-card__bar ir-sk"></span><span class="ir-card__body"><span class="ir-sk" style="width:56px;height:56px"></span><span class="ir-sk" style="height:22px;width:70%"></span><span class="ir-sk" style="height:54px"></span></span></div>`).join('')}</div></div>`;
  try {
    const [startups, insights, programs2026] = await Promise.all([fetch('data/startups.json?v=vision-circular-perfiles-1').then(r => r.json()), fetch('data/insights.json?v=tangara-catalogo-1').then(r => r.json()), fetch('data/programs2026.json?v=vision-circular-1').then(r => r.json())]);
    DATA = { startups, insights, programs2026 }; startups.forEach(s => [s.id, ...(s.aliasIds || [])].forEach(id => BYID.set(id, s))); render(false);
  } catch (err) { main.innerHTML = `<div class="ir-container ir-section"><h1 class="ir-section__title" tabindex="-1">No pudimos cargar el informe</h1><p>Abre el sitio desde un servidor (ver README) y vuelve a intentarlo.</p><button class="ir-btn ir-btn--primary" onclick="location.reload()">Reintentar</button></div>`; }
})();
