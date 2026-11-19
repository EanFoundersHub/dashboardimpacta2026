const endpoint = 'https://startup-report-analytics.afcaballero.workers.dev/events';
const storageKey = 'impacta-report-analytics-2026';
const observedSelectors = '#cifras-cierre, #programas, #portafolio, #portafolio-completo, .cc-cut, [data-insight], [data-component="ImpactOverview"], [data-component="StartupDossier"]';
let session, queue = [], pending, sending = false, namePending = false, lastRoute = '';
const visible = new Map();

function readPreference() {
  try { return JSON.parse(sessionStorage.getItem(storageKey)); }
  catch { return null; }
}

function enqueue(type, target, extra) {
  if (!session || queue.length >= 100) return;
  queue.push({ type, target, at: new Date().toISOString(), ...extra });
  if (queue.length >= 25) void flush();
}

function metricId(element) {
  const insight = element.dataset.insight;
  if (insight) return 'insight:' + insight;
  const action = element.querySelector('a, button');
  const href = action?.getAttribute('href');
  const filter = href && new URLSearchParams(href.split('?')[1]).get('programMetric');
  const group = element.closest('.cc-group')?.getAttribute('aria-labelledby');
  const value = element.querySelector('[data-v]')?.dataset.v;
  return filter || action?.getAttribute('popovertarget') || (group && value ? group + ':' + value : '');
}

function sample(now = performance.now()) {
  for (const [element, since] of visible) {
    if (since === null) continue;
    const visibleMs = Math.min(60000, Math.round(now - since));
    if (visibleMs > 0) enqueue('visible_time', targetFor(element), { visibleMs });
    visible.set(element, document.hidden ? null : now);
  }
}

async function flush() {
  if (sending || (!pending && !queue.length)) return;
  if (!pending) {
    pending = {
      batchId: crypto.randomUUID(), sessionId: session.id,
      ...(namePending && session.name ? { visitorName: session.name } : {}),
      events: queue.splice(0, 25)
    };
  }
  sending = true;
  try {
    const response = await fetch(endpoint, {
      method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(pending)
    });
    if (response.status === 200 || response.status === 201) {
      namePending = false;
      pending = null;
    }
  } catch {
    // The next cycle retries the same batch identifier.
  } finally {
    sending = false;
  }
}

function targetFor(element) {
  return metricId(element) || element.id || (
    element.dataset.component === 'StartupDossier' ? 'profile:' + lastRoute.split('/').pop() : 'overview'
  );
}

function start(preference, fresh) {
  session = preference;
  namePending = fresh;
  if (fresh) enqueue('session_start', 'report');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const previous = visible.get(entry.target);
      if (typeof previous === 'number') {
        enqueue('visible_time', targetFor(entry.target), { visibleMs: Math.max(1, Math.min(60000, Math.round(performance.now() - previous))) });
      }
      if (entry.isIntersecting && entry.intersectionRatio >= .15) visible.set(entry.target, document.hidden ? null : performance.now());
      else visible.delete(entry.target);
    }
  }, { threshold: .15 });
  function observeView() {
    sample();
    visible.clear();
    observer.disconnect();
    const route = location.hash.split('?')[0];
    if (route !== lastRoute && route.startsWith('#/e/') && document.querySelector('[data-component="StartupDossier"]')) {
      enqueue('initiative_open', route.slice(4).slice(0, 150));
    }
    lastRoute = route;
    document.querySelectorAll(observedSelectors).forEach(element => observer.observe(element));
  }
  const main = document.querySelector('#main');
  if (main) new MutationObserver(observeView).observe(main, { childList: true });
  observeView();
  document.addEventListener('click', event => {
    const action = event.target.closest('.cc-cut a, .cc-cut button[popovertarget], [data-insight]:not([data-static])');
    if (!action) return;
    const target = metricId(action.closest('.cc-cut, [data-insight]'));
    if (target) enqueue('metric_click', target);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      for (const element of visible.keys()) visible.set(element, performance.now());
      return;
    }
    sample();
    void flush();
  });
  setInterval(() => { if (!document.hidden) { sample(); void flush(); } }, 10000);
}

function offerPreference() {
  const existing = readPreference();
  if (!window.crypto?.randomUUID || !window.IntersectionObserver) return;
  if (existing?.id) { start(existing, false); return; }
  if (existing?.declined || !('IntersectionObserver' in window)) return;
  const panel = document.createElement('aside');
  panel.setAttribute('aria-label', 'Estadísticas de uso');
  panel.className = 'ir-container';
  panel.innerHTML = `<form style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding-block:16px">
    <p style="flex:1 1 100%;margin:0">Ayúdanos a mejorar el informe. Si aceptas, guardaremos los clics, las iniciativas consultadas y el tiempo visible de esta visita en el SharePoint institucional.</p>
    <input name="visitorName" aria-label="Nombre opcional" placeholder="Tu nombre (opcional)" maxlength="100" autocomplete="off" style="font-size:16px;min-height:44px;max-width:100%;padding-inline:10px">
    <button class="ir-btn" type="submit" style="min-height:44px">Compartir estadísticas</button>
    <button class="ir-btn" type="submit" value="decline" style="min-height:44px">Omitir</button>
  </form>`;
  panel.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const choice = event.submitter?.value === 'decline' ? { declined: true } : {
      id: crypto.randomUUID(), name: new FormData(event.currentTarget).get('visitorName').trim()
    };
    try { sessionStorage.setItem(storageKey, JSON.stringify(choice)); } catch {}
    panel.remove();
    if (choice.id) start(choice, true);
  });
  document.querySelector('#main')?.before(panel);
}

if ('requestIdleCallback' in window) requestIdleCallback(offerPreference, { timeout: 1500 });
else setTimeout(offerPreference, 0);
