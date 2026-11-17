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
const TORN = 'polygon(2% 4%,12% 2%,24% 4.5%,37% 1.5%,50% 4%,63% 2%,76% 4.5%,88% 1.8%,98% 4%,97% 18%,98.5% 34%,97% 50%,98.6% 66%,97.2% 82%,98% 96%,86% 97.8%,73% 95.6%,60% 98%,47% 95.8%,34% 98.2%,21% 95.7%,9% 97.8%,2% 96%,3% 80%,1.4% 64%,3.2% 48%,1.5% 32%,3% 16%)';
document.documentElement.style.setProperty('--torn-clip', TORN);

let DATA = null, BYID = new Map();
const state = { scrollByRoute: {} };

// ---------- Filtros del directorio (solo positivos) ----------
const city = s => (s || '').split(',')[0].trim();
const FACETS = [
  { key: 'cohorte', label: 'Cohorte', get: s => s.cohorte ? [s.cohorte] : [] },
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
function viewHome() {
  const P = DATA.insights.panorama;
  return `<section class="ir-hero ir-paper-bg" data-component="EditorialHero" aria-labelledby="hero-title">
  <div class="ir-container ir-hero__grid">
    <div class="ir-hero__text">
      <p class="ir-label ir-hero__kicker">Informe de resultados e impacto · 2020–2025</p>
      <h1 class="ir-hero__title" id="hero-title" tabindex="-1">Ean Impacta <em>Startup</em> Report 2026</h1>
      <p class="ir-hero__lead">El archivo vivo de los emprendimientos que acompañamos: lo que construyeron, lo que lograron y hacia dónde van.</p>
      <div class="ir-hero__actions">
        <a class="ir-btn ir-btn--primary" href="#/panorama">Abrir el informe ${ICON('flecha')}</a>
        <a class="ir-btn" href="#/insights">Ver Insights</a>
        <a class="ir-btn" href="#/directorio">Directorio</a>
      </div>
    </div>
    <div class="ir-route" data-component="RouteCover" data-state="closed" aria-hidden="true">
      <img class="ir-route__folder ir-route__folder--back-a" src="assets/folders/carpeta-amarilla.webp" alt="">
      <img class="ir-route__folder ir-route__folder--back-b" src="assets/folders/carpeta-verde.webp" alt="">
      <img class="ir-route__folder ir-route__folder--front" src="assets/folders/carpeta-turquesa.webp" alt="">
      <div class="ir-route__label"><span class="ir-label">Expediente</span><b>STARTUP<br>REPORT <span style="color:var(--color-accent-title)">2026</span></b></div>
      <img class="ir-route__stamp" src="assets/stamps/sello-archivo-2026.webp" alt="">
    </div>
  </div>
  <div class="ir-container"><div class="ir-hero__band">
    ${metric(177, 'emprendimientos únicos en Construye y Crece')}${metric(117, 'participaciones en Construye')}${metric(63, 'participaciones relacionadas con Crece')}${metric('76,3 %', 'del portafolio Construye–Crece con liderazgo femenino')}
  </div></div>
</section>
<section class="ir-section"><div class="ir-container"><div class="ir-section__head"><span class="ir-label">Alcance del programa</span>
<h2 class="ir-section__title" style="font-size:var(--fs-h2)">Construye incuba. Crece acelera.</h2>
<p class="ir-section__lead">Ean Impacta acompaña emprendimientos de base sostenible desde 2020. Este informe reúne el directorio de quienes participaron y los resultados que ${P.universos[3].cifras[0].valor} de ellos declararon en la medición de 2026.</p></div>
<div style="display:flex;flex-wrap:wrap;gap:12px"><a class="ir-btn ir-btn--primary" href="#/insights">Recorrer los Insights ${ICON('flecha')}</a><a class="ir-btn" href="#/metodologia">Cómo se midió</a></div></div></section>`;
}
const metric = (v, t, cls = '') => { const s = String(v); const m = s.match(/^([\d.,]+)\s?(%)?$/); return `<div class="ir-metric ${cls}" data-component="MetricFigure"><span class="ir-metric__value">${m ? esc(m[1]) + (m[2] ? '<small>%</small>' : '') : esc(s)}</span><span class="ir-metric__text">${esc(t)}</span></div>`; };

function viewPanorama() {
  const U = DATA.insights.panorama.universos;
  return `<section class="ir-section ir-overview" data-component="ImpactOverview" aria-labelledby="pan-title"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag" style="background:#fff;color:#0B4A46">Panorama Impacta</span><h1 class="ir-section__title" id="pan-title" tabindex="-1">Cuatro universos, cuatro lecturas</h1>
  <p class="ir-section__lead">Cada bloque se lee sobre su propio denominador. Las participaciones cuentan inscripciones por fase; los emprendimientos únicos cuentan empresas; la medición cubre a quienes respondieron.</p></div>
  ${U.map((u, i) => `<div class="ir-universe ir-reveal" style="--i:${i}" data-kind="${u.id}"><div class="ir-universe__name"><span class="ir-label">0${i + 1} · Universo</span><b>${esc(u.titulo)}</b></div>
  <div class="ir-universe__figures">${u.cifras.map(c => metric(c.valor, c.texto, 'ir-metric--l ir-metric--on-dark')).join('')}</div></div>`).join('')}
  <div style="display:flex;justify-content:flex-end;padding-top:var(--space-6)"><a class="ir-btn" style="border-color:#fff;color:#fff" href="#/insights">Ver los Insights ${ICON('flecha')}</a></div>
</div></section>`;
}

function viewInsights(q) {
  const I = DATA.insights.insights;
  return `<section class="ir-section ir-paper-bg" aria-labelledby="ins-title"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag">Insights · medición 2026</span><h1 class="ir-section__title" id="ins-title" tabindex="-1">Lo que construyeron</h1>
  <p class="ir-section__lead">${esc(DATA.insights.panorama.notaBase)} Abre una cifra para ver los emprendimientos que la componen.</p></div>
  ${I.map(ch => `<div class="ir-chapter" data-component="InsightSection" id="cap-${ch.id}" style="${chVars(ch.color)}">
    <div class="ir-chapter__head"><span class="ir-tag ir-tag--chapter">${esc(ch.capitulo)}</span><h2 class="ir-chapter__title">${esc(ch.capitulo)}</h2>${ch.universo === 'directorio' ? '<p class="ir-label">Universo: portafolio Construye–Crece</p>' : ''}</div>
    <div class="ir-chapter__cards">${ch.cifras.map((c, j) => `<button type="button" class="ir-insight ir-reveal ${j === 0 ? 'ir-insight--feature' : ''}" style="--i:${j}" data-component="InsightCard" data-insight="${ch.id}:${c.id}" aria-expanded="false" aria-controls="insight-drawer" ${c.miembros ? '' : 'data-static="true"'}>
      <span class="ir-insight__tab">${esc(ch.capitulo)}</span>
      <span style="display:flex;align-items:baseline;gap:14px"><span class="ir-insight__value">${c.valor}</span>${c.pct ? `<span class="ir-insight__pct">${esc(c.pct)}</span>` : ''}</span>
      <span class="ir-insight__text">${esc(c.texto)}</span>${c.nota ? `<span class="ir-label">${esc(c.nota)}</span>` : ''}
      <span class="ir-insight__cta">${c.miembros ? 'Abrir el expediente de la cifra' : 'Ver en el directorio'} ${ICON('flecha')}</span></button>`).join('')}</div>
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
  if (!c.miembros) { location.hash = '#/directorio?atributo=' + encodeURIComponent('Liderazgo femenino'); return; }
  const q = parseHash().q; if (push) { q.set('i', key); setQuery(q, false); }
  const dr = $('#insight-drawer'); dr.setAttribute('style', chVars(ch.color));
  const items = c.miembros.map(id => BYID.get(id)).filter(Boolean);
  const types = ch.filtros || [];
  dr.innerHTML = `<div class="ir-drawer__head"><span class="ir-label" style="color:inherit">${esc(ch.capitulo)}</span>
    <h2 class="ir-drawer__title" id="drawer-title" tabindex="-1">${esc(c.texto[0].toUpperCase() + c.texto.slice(1))}</h2>
    <div style="display:flex;align-items:baseline;gap:14px"><span class="ir-drawer__figure">${c.valor}</span>${c.pct ? `<span style="font:800 22px var(--font-display);white-space:nowrap">${esc(c.pct)}</span>` : ''}</div>
    <button class="ir-drawer__close" type="button" data-action="close-drawer" aria-label="Cerrar">${ICON('cerrar')}</button></div>
  <div class="ir-drawer__body">
    <p style="margin:0;font-size:14px;color:#2B2C30">${c.valor} emprendimientos ${esc(c.texto)}. ${esc(DATA.insights.panorama.notaBase)}</p>
    <label class="ir-search" style="min-height:48px">${ICON('buscar')}<span class="ir-sr">Buscar en este conjunto</span><input type="search" placeholder="Buscar en este conjunto" data-drawer-search></label>
    ${types.length ? `<div class="ir-active" role="group" aria-label="Tipo">${types.map(t => `<button type="button" class="ir-badge ir-badge--cert" style="min-height:36px;border:0;cursor:pointer" aria-pressed="false" data-drawer-type="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    <p class="ir-count" data-drawer-count>${items.length} emprendimientos</p>
    <div data-drawer-list>${items.map(s => { const d = insightDetail(s, c); const col = VERT_COLOR(s.vertical);
      return `<a class="ir-drawer__item" href="#/e/${s.id}" data-name="${esc((s.nombre + ' ' + d + ' ' + (s.sector || '')).toLowerCase())}" data-types="${esc(d.toLowerCase())}"><span class="ir-card__logo" style="width:44px;height:44px;font-size:15px;${chVars(col)}">${esc(initials(s.nombre))}</span><span><b>${esc(s.nombre)}</b><span>${esc([d, s.sector, s.cohorte].filter(Boolean).join(' · '))}</span></span>${ICON('flecha').replace('<svg', '<svg width="20" height="20"')}</a>`; }).join('')}</div>
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
  return DATA.startups.filter(s => FACETS.every(F => { const sel = q.getAll(F.key); if (!sel.length) return true; const v = F.get(s); return F.multi ? sel.every(x => v.includes(x)) : sel.some(x => v.includes(x)); })
    && (!term || (s.nombre + ' ' + (s.descripcion || '') + ' ' + (s.sector || '') + ' ' + (s.ubicacion || '')).toLowerCase().includes(term)));
}
function facetOptions(F) { const m = new Map(); DATA.startups.forEach(s => F.get(s).forEach(v => m.set(v, (m.get(v) || 0) + 1)));
  let arr = [...m.entries()]; arr.sort(F.key === 'cohorte' || F.key === 'ods' ? (a, b) => a[0].localeCompare(b[0], 'es', { numeric: true }) : (a, b) => b[1] - a[1]); return F.top ? arr.slice(0, F.top) : arr; }
const card = s => { const col = VERT_COLOR(s.vertical); const m = s.medicion || {};
  const tags = [s.vertical && `<span class="ir-badge">${esc(s.vertical)}</span>`, m.certificaciones && '<span class="ir-badge ir-badge--cert">Certificaciones</span>', m.tecnologias && '<span class="ir-badge ir-badge--tec">Tecnología emergente</span>', (s.reconocimientos || m.premios) && '<span class="ir-badge ir-badge--rec">Reconocimientos</span>', m.internacional && '<span class="ir-badge">Internacionalización</span>'].filter(Boolean).slice(0, 3).join('');
  const meta = [s.cohorte || (s.anios || []).join(', '), (s.fases || []).join(' · ')].filter(Boolean).join(' · ');
  return `<a class="ir-card" href="#/e/${s.id}" style="${chVars(col)}" data-component="StartupCard"><span class="ir-card__bar"></span><span class="ir-card__body">
  <span class="ir-card__top"><span class="ir-card__logo" aria-hidden="true">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : esc(initials(s.nombre))}</span>${meta ? `<span class="ir-label">${esc(meta)}</span>` : ''}</span>
  <h3 class="ir-card__name">${esc(s.nombre)}</h3>${s.descripcion ? `<p class="ir-card__desc">${esc(s.descripcion)}</p>` : ''}
  ${s.ubicacion ? `<span class="ir-card__meta">${ICON('pin')}${esc(s.ubicacion)}</span>` : ''}${s.sector ? `<span class="ir-label" style="text-transform:none;letter-spacing:0;font-size:13px">${esc(s.sector)}</span>` : ''}
  ${tags ? `<span class="ir-card__tags">${tags}</span>` : ''}<span class="ir-card__cta">Abrir expediente</span></span></a>`; };

function viewDirectory(q) {
  const res = filterList(q), view = q.get('vista') === 'compacta' ? 'compact' : 'grid', limit = Math.max(PAGE, +q.get('n') || PAGE);
  const chips = FACETS.flatMap(F => q.getAll(F.key).map(v => ({ k: F.key, v }))); if (q.get('q')) chips.push({ k: 'q', v: q.get('q') });
  const nActive = chips.length;
  return `<section class="ir-section" aria-labelledby="dir-title"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag">Directorio</span><h1 class="ir-section__title" id="dir-title" tabindex="-1">Emprendimientos</h1>
  <p class="ir-section__lead">Busca por nombre, sector o ciudad y combina filtros. La dirección de la página guarda tu selección para compartirla.</p></div>
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
      ${chips.length ? `<div class="ir-active" data-component="ActiveFilters" aria-label="Filtros activos">${chips.map(c => `<button type="button" class="ir-chip" data-remove="${c.k}" data-value="${esc(c.v)}" aria-label="Quitar ${esc(c.v)}">${esc(c.k === 'q' ? '«' + c.v + '»' : c.v)}<i>×</i></button>`).join('')}<button type="button" class="ir-btn ir-btn--small" style="border:0;text-decoration:underline" data-action="clear">Limpiar filtros</button></div>` : ''}
      ${res.length ? `<div class="ir-grid" data-view="${view}" data-component="StartupGrid">${res.slice(0, limit).map(card).join('')}</div>${res.length > limit ? `<div class="ir-more"><button class="ir-btn" type="button" data-action="more">Ver más · ${res.length - limit} restantes</button></div>` : ''}`
      : `<div class="ir-empty"><img src="assets/folders/carpeta-morada.webp" alt="" style="transform:rotate(-5deg)"><div style="display:flex;flex-direction:column;gap:12px"><h2 style="margin:0;font:800 28px/1.1 var(--font-display)">Ningún expediente coincide con esta combinación.</h2><p style="margin:0">Quita un filtro o prueba otra búsqueda.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="ir-btn ir-btn--primary" type="button" data-action="undo">Quitar el último filtro</button><button class="ir-btn" type="button" data-action="clear">Limpiar todo</button></div></div></div>`}
    </div>
  </div></div></section>`;
}

function viewDossier(id) {
  const s = BYID.get(id); if (!s) return `<section class="ir-section"><div class="ir-container"><h1 class="ir-section__title" tabindex="-1">Expediente no encontrado</h1><p><a href="#/directorio">Volver al directorio</a></p></div></section>`;
  const m = s.medicion || {}, col = VERT_COLOR(s.vertical);
  const facts = [['Cohorte', s.cohorte], ['Fase', (s.fases || []).join(' · ')], ['Ubicación', s.ubicacion], ['Sector', s.sector], ['Vertical', s.vertical], ['Año de participación', (s.anios || []).join(', ')]].filter(f => f[1]);
  const blocks = [
    m.productos && ['Productos o servicios', `<p style="margin:0">${esc(m.productos)}</p>`],
    m.productoNuevo && ['Producto o servicio nuevo', `<p style="margin:0">${esc(m.productoNuevo)}</p>`],
    m.tecnologias && ['Tecnologías', `<div class="ir-card__tags">${m.tecnologias.map(t => `<span class="ir-badge ir-badge--tec" data-component="TechnologyBadge">${esc(t)}</span>`).join('')}</div>`],
    m.certificaciones && ['Certificaciones', `<div class="ir-card__tags">${[...new Set([...m.certificaciones.tipos, m.certificaciones.detalle].filter(Boolean))].map(t => `<span class="ir-badge ir-badge--cert" data-component="CertificationBadge">${esc(t)}</span>`).join('')}</div>`],
    m.propiedadIntelectual && ['Propiedad intelectual', `<div class="ir-card__tags">${m.propiedadIntelectual.map(t => `<span class="ir-badge">${esc(t)}</span>`).join('')}</div>`],
    m.internacional && ['Internacionalización', `<p style="margin:0">Alcanzó mercados en ${esc(m.internacional.regiones.join(', '))}.</p>`],
    m.ods && ['Objetivos de Desarrollo Sostenible', `<div class="ir-card__tags">${m.ods.map(sdgBadge).join('')}</div>`],
    s.equipo?.length && ['Equipo', `<div class="ir-team">${s.equipo.map(p => `<div class="ir-member" data-component="FounderCard"><div class="ir-member__photo">${p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nombre)}">` : ''}</div><b>${esc(p.nombre)}</b>${p.rol ? `<span class="ir-label" style="text-transform:none;letter-spacing:0;font-size:13px">${esc(p.rol)}</span>` : ''}</div>`).join('')}</div>`],
    (s.reconocimientos || m.premios) && ['Premios y reconocimientos', `<div class="ir-recognition" data-component="RecognitionCard"><p style="margin:0;max-width:52ch">${esc(s.reconocimientos || m.premios)}</p></div>`]
  ].filter(Boolean);
  const related = DATA.startups.filter(x => x.id !== s.id && x.vertical && x.vertical === s.vertical).slice(0, 3);
  return `<article class="ir-dossier ir-paper-bg" data-component="StartupDossier" aria-labelledby="dos-title"><div class="ir-container">
  <div class="ir-dossier__back"><a class="ir-btn ir-btn--small" href="#/directorio${state.lastDirQuery ? '?' + state.lastDirQuery : ''}" data-action="back">${ICON('atras')} Volver al directorio</a></div>
  <div class="ir-dossier__grid">
    <div class="ir-dossier__folder"><img src="assets/folders/carpeta-${col}.webp" alt=""><div class="ir-dossier__sheet"><div class="ir-dossier__logo" style="${chVars(col)}">${s.logo ? `<img src="${esc(s.logo)}" alt="">` : esc(initials(s.nombre))}</div><div class="ir-dossier__photo--team" data-slot="foto-equipo">${s.fotoEquipo || s.foto ? `<img src="${esc(s.fotoEquipo || s.foto)}" alt="${s.fotoEquipo ? 'Equipo de ' : 'Foto de '}${esc(s.nombre)}">` : ''}</div></div>
      <img class="ir-stamp" src="assets/stamps/sello-archivo-2026.webp" alt="" style="position:absolute;right:4%;bottom:12%;width:22%"></div>
    <div style="display:flex;flex-direction:column;gap:var(--space-5)">
      <span class="ir-tag ir-tag--chapter" style="${chVars(col)}">Expediente${s.vertical ? ' · ' + esc(s.vertical) : ''}</span>
      <h1 class="ir-dossier__title" id="dos-title" tabindex="-1">${esc(s.nombre)}</h1>
      ${s.descripcion ? `<p class="ir-dossier__desc">${esc(s.descripcion)}</p>` : ''}
      ${facts.length ? `<div class="ir-facts">${facts.map(([k, v]) => `<div><span class="ir-label">${k}</span><b>${esc(v)}</b></div>`).join('')}</div>` : ''}
      ${blocks.map(([t, h]) => `<section class="ir-block"><h2>${t}</h2>${h}</section>`).join('')}
      ${related.length ? `<section class="ir-block"><h2>Emprendimientos relacionados</h2><div class="ir-grid">${related.map(card).join('')}</div></section>` : ''}
    </div>
  </div></div></article>`;
}

function viewStories() {
  const picks = DATA.startups.filter(s => s.reconocimientos && s.descripcion && s.descripcion.length > 120).slice(0, 4);
  const s = picks[0]; const col = VERT_COLOR(s.vertical);
  return `<section class="ir-section ir-paper-bg" aria-labelledby="his-title" data-component="StoryGallery"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag">Historias destacadas</span><h1 class="ir-section__title" id="his-title" tabindex="-1">Expedientes abiertos</h1></div>
  <div class="ir-story" style="${chVars(col)}">
    <div class="ir-story__media"><img src="assets/textures/papel-kraft.webp" alt="" class="ir-paper" style="left:-6%;top:-4%;width:70%;transform:rotate(-5deg)"><img src="assets/folders/carpeta-${col}.webp" alt="" style="position:absolute;left:14%;top:4%;width:72%;transform:rotate(3deg)"><img class="ir-stamp" src="assets/stamps/sello-archivo-2026.webp" alt="" style="position:absolute;right:6%;bottom:6%;width:20%"></div>
    <div style="display:flex;flex-direction:column;gap:var(--space-4)"><span class="ir-label">${esc([s.cohorte || (s.anios || []).join(', '), (s.fases || []).join(' · '), s.ubicacion].filter(Boolean).join(' · '))}</span>
      <h2 style="margin:0;font:900 var(--fs-h1)/.9 var(--font-display);letter-spacing:-.04em">${esc(s.nombre)}</h2>
      <p class="ir-story__quote">${esc(s.descripcion)}</p>
      <div class="ir-recognition"><span class="ir-label">Reconocimientos</span><p style="margin:6px 0 0;max-width:46ch">${esc(s.reconocimientos)}</p></div>
      <a class="ir-btn ir-btn--primary" style="align-self:flex-start" href="#/e/${s.id}">Abrir expediente ${ICON('flecha')}</a></div>
  </div>
  <h2 style="margin:var(--space-8) 0 var(--space-4);font:800 var(--fs-h3) var(--font-display)">Más historias</h2>
  <div class="ir-story__strip" role="list">${picks.slice(1).map(x => `<div role="listitem">${card(x)}</div>`).join('')}</div>
</div></section>`;
}

function viewMethod() {
  const D = [['Universo del directorio', 'Registros del Directorio Consolidado de Ean Impacta. El 79,8 % se encuentra activo. Una empresa puede aparecer en varias fases.'],
    ['Participaciones', 'Cuentan inscripciones por fase: 117 en Construye y 63 relacionadas con Crece. Una empresa que pasó por ambas fases suma dos participaciones.'],
    ['Emprendimientos únicos', '177 empresas distintas conforman el universo principal de Construye y Crece. Sobre este universo se calcula el liderazgo femenino (135 · 76,3 %).'],
    ['Universo de la medición', 'La medición 2026 cubre 97 emprendimientos del portafolio principal (cobertura del 54,8 %). Los porcentajes de Insights se calculan sobre los 121 emprendimientos que respondieron.'],
    ['Datos declarados', 'Las capacidades, logros y proyecciones fueron declarados por cada emprendimiento en la medición. No se publican montos de inversión ni de recursos no reembolsables, ni información personal.'],
    ['Definiciones', 'Producto nuevo: desarrollado desde su participación. Tecnología emergente: IA, IoT, realidad aumentada, blockchain u otras declaradas. Internacionalización: exportó o dio alcance internacional a su producto o servicio.']];
  return `<section class="ir-section ir-method" data-component="MethodologySection" aria-labelledby="met-title"><div class="ir-container">
  <div class="ir-section__head"><span class="ir-tag">Metodología y fuentes</span><h1 class="ir-section__title" id="met-title" tabindex="-1">Cómo leer este informe</h1></div>
  <dl>${D.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
  <p style="margin-top:var(--space-6);font-size:14px;color:var(--color-muted)">Fuentes: Directorio Consolidado Ean Impacta · Actualización de emprendedores y medición de impactos 2026.</p>
</div></section>`;
}

// ---------- Router ----------
function render(focus = true) {
  const { parts, q } = parseHash(); const r = parts[0] || '';
  const prevKey = state.route; if (prevKey) state.scrollByRoute[prevKey] = scrollY;
  const main = $('#main');
  const html = r === 'panorama' ? viewPanorama() : r === 'insights' ? viewInsights(q) : r === 'directorio' ? viewDirectory(q) : r === 'e' ? viewDossier(parts[1]) : r === 'historias' ? viewStories() : r === 'metodologia' ? viewMethod() : viewHome();
  main.innerHTML = `<div class="ir-view">${html}</div>`;
  if (r === 'directorio') state.lastDirQuery = q.toString();
  $$('[data-nav]').forEach(a => a.toggleAttribute('aria-current', false)); const cur = $(`[data-nav="${r === 'e' ? 'directorio' : r}"]`); cur && cur.setAttribute('aria-current', 'page');
  closeMenu();
  const key = r + (r === 'e' ? '/' + parts[1] : ''); state.route = key;
  if (r === 'directorio' && state.scrollByRoute.directorio != null && state.fromDossier) window.scrollTo(0, state.scrollByRoute.directorio); else window.scrollTo(0, 0);
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
  if (r !== 'directorio') return;
  const upd = fn => { const nq = parseHash().q; fn(nq); nq.delete('n'); history.replaceState(null, '', '#/directorio' + (nq.toString() ? '?' + nq : '')); state.lastQ = nq; render(false); };
  let t; const inp = $('[data-search]'); inp?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const pos = inp.selectionStart; upd(nq => inp.value.trim() ? nq.set('q', inp.value) : nq.delete('q')); const ni = $('[data-search]'); ni.focus(); ni.setSelectionRange(pos, pos); }, 220); });
  $$('[data-facet]').forEach(cb => cb.addEventListener('change', () => { const k = cb.dataset.facet, v = cb.value; const open = $('#filters').dataset.open === 'true';
    upd(nq => { const cur = nq.getAll(k); nq.delete(k); (cb.checked ? [...cur, v] : cur.filter(x => x !== v)).forEach(x => nq.append(k, x)); state.order = [...(state.order || []).filter(o => o !== k + '=' + v), ...(cb.checked ? [k + '=' + v] : [])]; });
    if (open) { $('#filters').dataset.open = 'true'; $(`[data-facet="${k}"][value="${CSS.escape(v)}"]`)?.focus(); } }));
  $$('[data-remove]').forEach(b => b.addEventListener('click', () => upd(nq => { const k = b.dataset.remove, v = b.dataset.value; if (k === 'q') nq.delete('q'); else { const cur = nq.getAll(k).filter(x => x !== v); nq.delete(k); cur.forEach(x => nq.append(k, x)); } })));
  $$('[data-view]').forEach(b => b.addEventListener('click', () => upd(nq => b.dataset.view === 'compacta' ? nq.set('vista', 'compacta') : nq.delete('vista'))));
}

document.addEventListener('click', e => {
  const a = e.target.closest('[data-action]'); if (!a) return; const act = a.dataset.action;
  if (act === 'menu') { const n = $('#mobile-nav'); const o = n.dataset.open !== 'true'; n.dataset.open = o; a.setAttribute('aria-expanded', o); a.textContent = o ? 'Cerrar' : 'Índice'; }
  if (act === 'close-drawer') closeDrawer();
  if (act === 'open-filters') { $('#filters').dataset.open = 'true'; a.setAttribute('aria-expanded', 'true'); $('#filters input')?.focus(); }
  if (act === 'close-filters') { $('#filters').dataset.open = 'false'; $('[data-action="open-filters"]')?.focus(); }
  if (act === 'clear') { history.replaceState(null, '', '#/directorio'); state.order = []; render(false); }
  if (act === 'undo') { const last = (state.order || []).pop(); const nq = parseHash().q; if (last) { const [k, v] = last.split('='); const cur = nq.getAll(k).filter(x => x !== v); nq.delete(k); cur.forEach(x => nq.append(k, x)); } else nq.delete('q'); history.replaceState(null, '', '#/directorio' + (nq.toString() ? '?' + nq : '')); render(false); }
  if (act === 'more') { const nq = parseHash().q; nq.set('n', (+nq.get('n') || PAGE) + PAGE); history.replaceState(null, '', '#/directorio?' + nq); const y = scrollY; render(false); window.scrollTo(0, y); }
});
function closeMenu() { const n = $('#mobile-nav'); if (n.dataset.open === 'true') { n.dataset.open = 'false'; const b = $('[data-action="menu"]'); b.setAttribute('aria-expanded', 'false'); b.textContent = 'Índice'; } }
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if ($('#insight-drawer').dataset.open === 'true') closeDrawer(); else if ($('#filters')?.dataset.open === 'true') { $('#filters').dataset.open = 'false'; } else closeMenu(); });
$('#insight-drawer').addEventListener('keydown', e => { if (e.key !== 'Tab') return; const f = $$('a[href],button,input', e.currentTarget).filter(x => !x.hidden && x.offsetParent); if (!f.length) return; const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
window.addEventListener('hashchange', () => render(true));

// ---------- Carga ----------
(async () => {
  const main = $('#main'); main.innerHTML = `<div class="ir-container ir-section"><div class="ir-grid">${Array.from({ length: 6 }, () => `<div class="ir-card ir-card--skeleton"><span class="ir-card__bar ir-sk"></span><span class="ir-card__body"><span class="ir-sk" style="width:56px;height:56px"></span><span class="ir-sk" style="height:22px;width:70%"></span><span class="ir-sk" style="height:54px"></span></span></div>`).join('')}</div></div>`;
  try {
    const [startups, insights] = await Promise.all([fetch('data/startups.json?v=media-20261117').then(r => r.json()), fetch('data/insights.json').then(r => r.json())]);
    DATA = { startups, insights }; startups.forEach(s => BYID.set(s.id, s)); render(false);
  } catch (err) { main.innerHTML = `<div class="ir-container ir-section"><h1 class="ir-section__title" tabindex="-1">No pudimos cargar el informe</h1><p>Abre el sitio desde un servidor (ver README) y vuelve a intentarlo.</p><button class="ir-btn ir-btn--primary" onclick="location.reload()">Reintentar</button></div>`; }
})();
