/* Ean Impacta Startup Report 2026 · motion «Archivo vivo»
   Script independiente: no modifica app.js. Observa #main y aplica coreografía,
   conteo de cifras, inclinación de carpetas y placeholders de recursos ausentes. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.getElementById('main');
  if (!main) return;

  // Barra de lectura
  const bar = document.createElement('div'); bar.className = 'av-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  const onScroll = () => { const h = document.documentElement; const p = h.scrollHeight - innerHeight; bar.style.setProperty('--p', p > 0 ? (scrollY / p).toFixed(4) : 0); };
  addEventListener('scroll', onScroll, { passive: true });

  // Recursos ausentes: carpeta CSS, iniciales en tarjetas, resto oculto
  const fixImg = img => {
    if (img.dataset.avChecked) return; img.dataset.avChecked = '1';
    const fail = () => {
      if (/Impacta/.test(img.alt) && !img.dataset.avBrand) { img.dataset.avBrand = '1'; img.dataset.avChecked = ''; img.src = 'assets/brand/ean-impacta-negro.png'; return; }
      if (img.classList.contains('exp__carpeta') || img.classList.contains('pp-cover__folder')) {
        const f = document.createElement('span'); f.className = 'av-folder' + (img.classList.contains('pp-cover__folder') ? ' av-folder--cover' : ''); f.setAttribute('aria-hidden', 'true');
        img.after(f);
      } else if (img.closest('.ir-card__logo, .ir-dossier__logo')) {
        const card = img.closest('.ir-card'); if (card) { const nm = (card.querySelector('.ir-card__name')?.textContent || '').trim(); const ph = document.createElement('span'); ph.className = 'av-logo-initials'; ph.textContent = nm.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); img.after(ph); }
      }
      img.classList.add('av-missing');
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail(); else img.addEventListener('error', fail, { once: true });
  };

  // Conteo de cifras (respeta formato es-CO y prefijos/sufijos)
  const countIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countIO.unobserve(e.target); count(e.target); } }), { threshold: .4 }) : null;
  const count = el => {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent)); if (!node) return;
    const original = node.textContent, m = original.match(/^(\D*?)(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?(.*)$/s); if (!m) return;
    const target = parseInt(m[2].replace(/\./g, ''), 10); if (!Number.isFinite(target) || target < 4) return;
    const dec = m[3] || '', t0 = performance.now(), dur = Math.min(1400, 600 + target / 4);
    const fmt = new Intl.NumberFormat('es-CO');
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      node.textContent = k < 1 ? m[1] + fmt.format(Math.round(target * e)) + (dec ? dec.replace(/\d/g, '0') : '') + m[4] : original;
      if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const COUNT_SEL = '.ir-metric__value, .ir-insight__value, .pp-program__metrics b, .ir-drawer__figure';

  // Coreografía de entrada
  const STAGGER_SEL = '.pp-focus-section, .exp--program, .ir-section__head, .ir-universe, .ir-chapter__head, .ir-insight, .ir-metric, .ir-card, .ir-toolbar, .ir-dossier__sheet, .ir-dossier__folder';
  // Ficha de iniciativa: media (foto/logo/fallback), contraste del logo, entrada y flotación
  const lumOf = img => new Promise(res => {
    const go = () => { try { const W = 48, H = Math.max(1, Math.round(48 * img.naturalHeight / img.naturalWidth)); const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data; let L = 0, n = 0, corners = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 40) continue; L += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; n++; }
      for (const [cx, cy] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]) if (d[(cy * W + cx) * 4 + 3] > 200) corners++;
      res({ lum: n ? L / n / 255 : .5, opaque: corners >= 3 }); } catch (e) { res(null); } };
    img.complete && img.naturalWidth ? go() : (img.addEventListener('load', go, { once: true }), img.addEventListener('error', () => res(null), { once: true }));
  });
  const dossier = root => root.querySelectorAll('.ir-dossier__folder:not([data-av-dos])').forEach(async f => {
    f.dataset.avDos = '1';
    const sheet = f.querySelector('.ir-dossier__sheet'); if (!sheet) return;
    const settle = im => !im ? Promise.resolve(false) : new Promise(res => { const ok = () => res(im.naturalWidth > 0 && !im.classList.contains('av-missing')); if (im.complete) return ok(); im.addEventListener('load', ok, { once: true }); im.addEventListener('error', () => res(false), { once: true }); setTimeout(ok, 2500); });
    const box0 = sheet.querySelector('.ir-dossier__logo'), li0 = box0?.querySelector('img'), fr0 = sheet.querySelector('.foto-rasgada'), pi0 = fr0?.querySelector('.foto-rasgada__img');
    const [hasLogo, hasPhoto] = await Promise.all([settle(li0), settle(pi0)]);
    if (!hasLogo && box0) box0.remove();
    if (!hasPhoto && fr0) fr0.remove();
    const name = (root.querySelector('#dos-title')?.textContent || '').trim();
    sheet.classList.add(hasPhoto && hasLogo ? 'initiative-media--both' : hasPhoto ? 'initiative-media--photo-only' : hasLogo ? 'initiative-media--logo-only' : 'initiative-media--none');
    if (hasPhoto) trimPhoto(pi0);
    if (!hasLogo && !hasPhoto) {
      box0 && box0.remove();
      sheet.appendChild(initiativeFallback(name, f.closest('.pp-dialog, [data-kind="programa"]') ? 'Programa' : 'Iniciativa'));
    }
    const tape = document.createElement('img'); tape.className = 'av-dos-tape'; tape.src = PROGRAM_ASSET_AV + 'papeles/cinta-masking.webp'; tape.alt = ''; tape.setAttribute('aria-hidden', 'true');
    sheet.querySelector('.foto-rasgada:not(.av-none)')?.appendChild(tape);
    const box = sheet.querySelector('.ir-dossier__logo'), li = box?.querySelector('img');
    box?.querySelector('.av-logo-ph') && li && box.querySelector('.av-logo-ph').remove();
    if (box) { box.classList.add('av-logo-label'); if (li) { const r = await lumOf(li); if (r) box.classList.add(r.opaque ? 'av-logo--opaco' : r.lum > .62 ? 'av-logo--claro' : 'av-logo--oscuro'); } else box.classList.add('av-logo--iniciales'); }
    f.querySelectorAll('.ir-dossier__year-stamps img').forEach((im, k) => im.style.setProperty('--k', k));
    if (!RM.matches) { f.classList.add('av-dos-in'); setTimeout(() => { f.classList.remove('av-dos-in'); f.classList.add('av-dos-float'); }, 1900); }
  });
  const PROGRAM_ASSET_AV = 'assets/programas-home/assets/';
  // Fallback editorial: nombre manuscrito con escritura letra por letra (700–1.200 ms, una sola vez)
  const initiativeFallback = (name, kind) => {
    const el = document.createElement('div'); el.className = 'initiative-fallback'; el.setAttribute('aria-hidden', 'true');
    const eb = document.createElement('span'); eb.className = 'initiative-fallback__eyebrow'; eb.textContent = kind;
    const n = document.createElement('p'); n.className = 'initiative-fallback__name';
    let i = 0; name.split(/\s+/).filter(Boolean).forEach((w, wi) => {
      if (wi) n.appendChild(document.createTextNode(' '));
      const ws = document.createElement('span'); ws.className = 'initiative-fallback__word';
      for (const ch of w) { const c = document.createElement('span'); c.className = 'initiative-fallback__ch'; c.textContent = ch; c.style.setProperty('--i', i++); ws.appendChild(c); }
      n.appendChild(ws);
    });
    const hl = document.createElement('span'); hl.className = 'initiative-fallback__highlight';
    const ul = document.createElement('span'); ul.className = 'initiative-fallback__underline';
    const tk = document.createElement('span'); tk.className = 'initiative-fallback__tick';
    n.append(hl, ul); el.append(eb, n, tk);
    // tiempos: total ≤ 1.150 ms
    const step = Math.max(12, Math.min(42, Math.round(560 / Math.max(1, i))));
    const writeEnd = 80 + step * Math.max(0, i - 1) + 260;
    el.style.setProperty('--step', step + 'ms'); el.style.setProperty('--hl-delay', Math.round(writeEnd * .55) + 'ms');
    el.style.setProperty('--hl-dur', Math.max(300, Math.min(520, 1150 - Math.round(writeEnd * .55) - 120)) + 'ms');
    el.style.setProperty('--ul-delay', Math.min(810, writeEnd) + 'ms');
    requestAnimationFrame(() => { fitName(el, n); if (!RM.matches) writeOnce(el); });
    return el;
  };
  // Ajuste: tamaño según longitud y reducción hasta que no desborde (ancho de palabra y alto)
  const fitName = (el, n) => {
    const len = n.textContent.length, longest = Math.max(...n.textContent.split(' ').map(w => w.length), 1);
    let fs = Math.min(17, 150 / Math.max(longest, 4), len > 30 ? 10.5 : len > 18 ? 12.5 : 17);
    const W = el.clientWidth; if (!W) return;
    const maxH = Math.max(120, (el.parentElement?.clientHeight || W) * .78);
    for (let k = 0; k < 24; k++) {
      n.style.setProperty('--fs', fs + 'cqi');
      const over = [...n.querySelectorAll('.initiative-fallback__word')].some(w => w.offsetWidth > n.clientWidth + 1) || n.offsetHeight > maxH;
      if (!over || fs <= 5) break; fs *= .9;
    }
  };
  const writeIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { writeIO.unobserve(e.target); e.target.classList.add('is-writing'); } }), { threshold: .35 }) : null;
  const writeOnce = el => writeIO ? writeIO.observe(el) : el.classList.add('is-writing');
  // Foto: recorta márgenes blancos de origen (exportaciones de Canva) sin tocar el archivo
  const trimPhoto = img => {
    if (!img || img.dataset.trim) return; img.dataset.trim = '1';
    try {
      const w = img.naturalWidth, h = img.naturalHeight; if (!w || !h) return;
      const S = Math.min(1, 320 / Math.max(w, h)), cw = Math.max(1, Math.round(w * S)), ch = Math.max(1, Math.round(h * S));
      const c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d'); x.drawImage(img, 0, 0, cw, ch);
      const d = x.getImageData(0, 0, cw, ch).data, white = i => d[i + 3] < 20 || (d[i] > 238 && d[i + 1] > 238 && d[i + 2] > 238);
      const rowW = y => { let k = 0; for (let xx = 0; xx < cw; xx++) if (white((y * cw + xx) * 4)) k++; return k / cw > .97; };
      const colW = xx => { let k = 0; for (let y = 0; y < ch; y++) if (white((y * cw + xx) * 4)) k++; return k / ch > .97; };
      let t = 0, b = ch - 1, l = 0, r = cw - 1; while (t < b && rowW(t)) t++; while (b > t && rowW(b)) b--; while (l < r && colW(l)) l++; while (r > l && colW(r)) r--;
      const m = Math.max(t, ch - 1 - b, l, cw - 1 - r); if (m < 2 || (r - l) < cw * .4 || (b - t) < ch * .4) return;
      const out = document.createElement('canvas'); out.width = Math.round((r - l + 1) / S); out.height = Math.round((b - t + 1) / S);
      out.getContext('2d').drawImage(img, l / S, t / S, out.width, out.height, 0, 0, out.width, out.height);
      out.toBlob(bl => { if (bl) { img.src = URL.createObjectURL(bl); img.classList.add('is-trimmed'); } }, 'image/jpeg', .92);
    } catch (e) { /* imagen de otro origen: se muestra tal cual */ }
  };
  // Trazos y resaltados en titulares de todo el documento
  const MARKS = ['hl', 'ul', 'hl2', 'ult'];
  const strokes = root => {
    let k = 0;
    root.querySelectorAll('h1:not([data-av-mk]), h2:not([data-av-mk])').forEach(h => {
      h.dataset.avMk = '1';
      if (h.closest('.ir-hero, .av-hero, header, footer, .ir-modal, [role=dialog], .av-dos-mano') || h.querySelector('img,svg') || h.offsetParent === null) return;
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let last = null; while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) last = walker.currentNode;
      if (!last) return;
      const txt = last.nodeValue, m = txt.match(/(\S+)(\s*)$/); if (!m || m[1].length < 3) return;
      const kind = MARKS[k++ % MARKS.length];
      const span = document.createElement('span'); span.className = 'av-mk av-mk--' + kind; span.textContent = m[1];
      last.nodeValue = txt.slice(0, m.index); last.parentNode.insertBefore(span, last.nextSibling); if (m[2]) span.after(document.createTextNode(m[2]));
      { let e = h, bg = ''; while (e && e !== document.body) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; } e = e.parentElement; }
        const v = (bg.match(/\d+/g) || [255, 255, 255]).map(Number); if ((.2126 * v[0] + .7152 * v[1] + .0722 * v[2]) / 255 < .45) span.classList.add('av-mk--dark'); }
      span.style.setProperty('--d', (200 + Math.random() * 200 | 0) + 'ms');
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { span.classList.add('is-on'); io.disconnect(); } }), { threshold: .6 }); io.observe(span);
    });
    root.querySelectorAll('.ir-stat__value:not([data-av-mk]), .ir-kpi__value:not([data-av-mk]), [data-countup]:not([data-av-mk])').forEach((el, i) => {
      el.dataset.avMk = '1'; if (i % 3) return;
      el.classList.add('av-mk-circle');
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { el.classList.add('is-on'); io.disconnect(); } }), { threshold: .6 }); io.observe(el);
    });
  };
  const choreograph = root => {
    dossier(root);
    setTimeout(() => strokes(root), 60);
    root.querySelectorAll('img').forEach(fixImg);
    if (RM.matches) return;
    let i = 0;
    root.querySelectorAll(STAGGER_SEL).forEach(el => {
      if (el.dataset.avIn) return; el.dataset.avIn = '1';
      const r = el.getBoundingClientRect(); if (r.top > innerHeight * 1.2) return; // solo lo visible al entrar
      el.style.setProperty('--i', Math.min(i++, 14)); el.classList.add('av-in');
      el.addEventListener('animationend', () => el.classList.remove('av-in'), { once: true });
    });
    if (countIO) root.querySelectorAll(COUNT_SEL).forEach(el => { if (!el.dataset.avCount) { el.dataset.avCount = '1'; countIO.observe(el); } });
  };

  // Transición entre rutas
  let lastRoute = location.hash.split('?')[0];
  addEventListener('hashchange', () => {
    const r = location.hash.split('?')[0]; if (r === lastRoute || RM.matches) { lastRoute = r; return; }
    lastRoute = r; main.classList.add('av-leaving'); setTimeout(() => main.classList.remove('av-leaving'), 190);
  });

  const mo = new MutationObserver(muts => {
    for (const m of muts) m.addedNodes.forEach(n => { if (n.nodeType !== 1) return;
      if (n.querySelector && n.querySelector('.pp-cover') || n.classList?.contains('pp')) { n.closest('#main')?.classList.add('av-hero'); setTimeout(() => main.classList.remove('av-hero'), 2200); }
      choreograph(n.parentElement || n); });
  });
  mo.observe(main, { childList: true, subtree: true });
  choreograph(main);
  if (main.querySelector('.pp-cover')) { main.classList.add('av-hero'); setTimeout(() => main.classList.remove('av-hero'), 2200); }

  // Modal de programa: escalonado de hijos y conteo
  const modal = () => document.getElementById('program-modal');
  new MutationObserver(() => { const m = modal(); if (!m || m.hidden) return;
    [...(m.querySelector('.pp-program__paper')?.children || [])].forEach((c, i) => c.style.setProperty('--i', i));
    m.querySelectorAll('img').forEach(fixImg);
    if (!RM.matches) m.querySelectorAll('.pp-program__metrics b').forEach(count);
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

  // Drawer de resultados: escalonado
  const drawer = document.getElementById('insight-drawer');
  if (drawer) new MutationObserver(() => drawer.querySelectorAll('.ir-drawer__item').forEach((c, i) => c.style.setProperty('--i', Math.min(i, 16)))).observe(drawer, { childList: true });

  // Inclinación de carpetas con el puntero
  main.addEventListener('pointermove', e => {
    if (RM.matches || e.pointerType !== 'mouse') return;
    const el = e.target.closest('.exp--program'); if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.setProperty('--rx', (x * 6).toFixed(2) + 'deg'); el.style.setProperty('--ry', (-y * 5).toFixed(2) + 'deg');
  });
  main.addEventListener('pointerout', e => { const el = e.target.closest?.('.exp--program'); if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); } });

  // Enfoque activo en la barra
  const markFocus = () => {
    const btns = [...document.querySelectorAll('[data-focus-jump]')]; if (!btns.length) return;
    let cur = null; btns.forEach(b => { const s = document.getElementById('enfoque-' + b.dataset.focusJump); if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = b; });
    btns.forEach(b => b.setAttribute('aria-current', b === cur ? 'true' : 'false'));
  };
  addEventListener('scroll', markFocus, { passive: true });
})();
