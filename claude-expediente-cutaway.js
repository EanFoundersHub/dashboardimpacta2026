/* <expediente-cutaway> · Archivo Impacta 2026
 * Despiece interactivo del expediente de portada. Técnica adaptada de Cutaway
 * (github.com/Nyxera0x/cutaway, MIT): cada pieza es un grupo con ancla con nombre,
 * pose(state) es una función pura del estado, despiece → pausa → reensamble,
 * cámara propia por pieza y una etiqueta-botón por pieza.
 * Atributos: base (ruta a assets/, por defecto "assets/"), three (ruta al módulo three),
 *            exploded (booleano), reduced (booleano → versión estática).
 * Eventos:   cutaway-select {index, dest, title}  ·  cutaway-state {exploded, focus}
 * Teclado:   Enter/Espacio sobre el objeto = abrir/cerrar · 1/2/3 o ←/→ = enfocar acceso ·
 *            Enter sobre un acceso = entrar · Esc = reensamblar.
 */
(() => {
  if (customElements.get('expediente-cutaway')) return;
  const ACC = [
    { key: 'verde', n: '01', title: 'Resultados', sub: 'Panorama institucional', dest: 'panorama', ink: '#2d7f35' },
    { key: 'amarilla', n: '02', title: 'Rutas', sub: 'Programas y ruta Crece', dest: 'rutas', ink: '#a8700a' },
    { key: 'morada', n: '03', title: 'Emprendimientos', sub: 'Mesa de consulta', dest: 'portafolio', ink: '#7a3a87' }
  ];
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = x => { const k = clamp01(x); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const D = Math.PI / 180;
  // Poses en unidades de mundo (1 u = 100 px del lienzo de carpeta 1080 × 1176). rz en grados, sentido three.js.
  const REST = {
    morada: [2.0, .8, -.36, 8 * -1], amarilla: [-.6, 1.4, -.24, 3], verde: [-2.2, .6, -.12, 10],
    folder: [0, 0, 0, 2], tab: [0, 0, .02, 2], sheet: [0, 0, .04, 2], label: [-.65, 2.55, .07, 4.5], cover: [-.135, -4.24, .1, 2]
  };
  const EXP = {
    morada: [4.4, 2.8, -4.4, -5], amarilla: [.2, 3.6, -3.0, 1], verde: [-4.0, 2.8, -1.6, 6],
    folder: [0, -1.2, 0, 0], tab: [0, -1.2, .35, 0], sheet: [0, -.6, 1.1, 0], label: [-.65, 2.2, 2.0, 3], cover: [-.135, -5.6, 2.6, 0]
  };
  const ORDER = ['cover', 'label', 'sheet', 'tab', 'folder', 'verde', 'amarilla', 'morada'];
  const CAMS = [[-7, 2.5, 30], [0, 5, 30], [7, 2.5, 30]], CAM0 = [0, 0, 34];

  // pose(state) → transformaciones de todas las piezas. Pura: solo depende de state.
  function pose(s) {
    const out = {};
    ORDER.forEach((name, i) => {
      const k = ease((s.ex - i * .045) / (1 - ORDER.length * .045));
      const a = REST[name], b = EXP[name];
      out[name] = { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), z: lerp(a[2], b[2], k), rz: lerp(a[3], b[3], k) * D, op: 1 };
    });
    ACC.forEach((acc, i) => {
      const f = ease(s.foc[i]), p = out[acc.key], other = Math.max(...s.foc.map((v, j) => j === i ? 0 : v));
      p.z += f * 6.2; p.y -= f * 1.6; p.rz *= 1 - f; p.op = 1 - .7 * ease(other);
      out['ficha' + i] = { x: p.x, y: p.y + lerp(1.2, 3.4, ease(s.ex)) - f * .2, z: p.z + .3 + f * .6, rz: p.rz * .5, op: clamp01(s.ex * 1.6 - .5) * p.op, sc: lerp(.6, 1, ease(s.ex)) + f * .12 };
    });
    const anyF = Math.max(...s.foc);
    ['folder', 'tab', 'sheet', 'label', 'cover'].forEach(n => out[n].op = 1 - .72 * ease(anyF));
    out.cover.open = ease(clamp01(s.ex * 1.4)) * 1.15 + ease(anyF) * .3;
    out.group = { ry: lerp(0, -.42, ease(s.ex)) * (1 - ease(anyF) * .8), rx: lerp(0, .16, ease(s.ex)) };
    const fi = s.foc.indexOf(Math.max(...s.foc)), c = anyF > .001 ? CAMS[fi] : CAM0;
    out.cam = [lerp(CAM0[0], c[0], ease(anyF)), lerp(CAM0[1], c[1], ease(anyF)), lerp(lerp(CAM0[2], 36, ease(s.ex)), c[2], ease(anyF))];
    return out;
  }

  const CSS = `:host{display:block;position:relative;width:100%;height:100%;min-height:320px;outline:none;font-family:Poppins,sans-serif;color:#1f2124}
  canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer}
  .labels{position:absolute;inset:0;pointer-events:none}
  .lb{position:absolute;left:0;top:0;pointer-events:auto;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:44px;padding:9px 14px 10px;border:1.5px solid #1f2124;border-radius:10px;background:#fbf9f4;font:600 12px Poppins;cursor:pointer;white-space:nowrap;box-shadow:0 8px 18px rgba(40,30,20,.14);transition:background .2s,color .2s}
  .lb b{font:800 18px/1 Outfit;letter-spacing:-.01em}
  .lb[aria-pressed=true],.lb:hover{background:#1f2124;color:#f3efe6}
  .lb:focus-visible,:host(:focus-visible){outline:3px solid #40c0c0;outline-offset:3px}
  .hint{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgba(31,33,36,.82);color:#f3efe6;font:500 11.5px Poppins;white-space:nowrap;pointer-events:none;transition:opacity .3s}
  .static{position:absolute;inset:0;display:grid;grid-template-rows:repeat(3,minmax(0,1fr));gap:12px;padding:12px}
  .static button{position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;padding:16px;border:1px solid #ddd6c8;background:#fbf9f4;cursor:pointer;text-align:left;font:400 13px Poppins;color:#1f2124}
  .static img{position:absolute;right:-20px;top:-10px;width:44%;transform:rotate(-6deg)}
  .static .n{font:900 40px/.85 Outfit}.static .t{font:800 24px/1 Outfit}
  @media(max-width:520px){.lb{left:12px!important;right:12px!important;width:auto;min-height:60px;padding:8px 12px;white-space:normal;transform:none!important}.lb:nth-child(1){top:8px!important}.lb:nth-child(2){top:76px!important}.lb:nth-child(3){top:144px!important}.lb b{font-size:17px}.lb span:last-child{font-size:10px}.hint{bottom:4px;font-size:9px}.static{padding:8px;gap:8px}.static button{padding:12px}.static .n{font-size:32px}.static .t{font-size:20px}}`;

  class ExpedienteCutaway extends HTMLElement {
    static get observedAttributes() { return ['exploded', 'reduced']; }
    constructor() {
      super();
      this.state = { ex: 0, foc: [0, 0, 0] }; this.target = { ex: 0, foc: [0, 0, 0] }; this.focusIdx = -1;
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = `<style>${CSS}</style><canvas aria-hidden="true"></canvas><div class="labels" role="group" aria-label="Accesos del expediente"></div><div class="hint">Enter: abrir · 1–3: elegir · Esc: cerrar</div>`;
      this.canvas = this.root.querySelector('canvas'); this.labelsEl = this.root.querySelector('.labels'); this.hint = this.root.querySelector('.hint');
      this.labels = ACC.map((a, i) => { const b = document.createElement('button'); b.className = 'lb'; b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.innerHTML = `<span>${a.n} · ACCESO</span><b>${a.title}</b><span>${a.sub} →</span>`; b.setAttribute('aria-label', `${a.n} ${a.title}: ${a.sub}`);
        b.addEventListener('click', e => { e.stopPropagation(); this.focusIdx === i ? this.select(i) : this.focus_(i); });
        b.addEventListener('focus', () => this.focus_(i)); this.labelsEl.appendChild(b); return b; });
      this.addEventListener('keydown', e => this.onKey(e));
    }
    get base() { return this.getAttribute('base') || 'assets/'; }
    connectedCallback() { if (!this.hasAttribute('tabindex')) this.tabIndex = 0; this.setAttribute('role', 'application'); this.setAttribute('aria-label', 'Expediente Impacta 2026. Enter para abrir.'); if (this.booted) return; this.booted = true; this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this); this.boot(); }
    disconnectedCallback() { this.ro?.disconnect(); cancelAnimationFrame(this.raf); this.renderer?.dispose(); }
    attributeChangedCallback(n) {
      if (n === 'exploded') this.setExploded(this.hasAttribute('exploded'), true);
      if (n === 'reduced' && this.isConnected) this.boot();
    }
    isReduced() { return this.hasAttribute('reduced') || matchMedia('(prefers-reduced-motion: reduce)').matches; }
    async boot() {
      this.root.querySelector('.static')?.remove();
      if (this.isReduced()) return this.renderStatic();
      if (this.THREE) return this.kick();
      try {
        const T = this.THREE = await import(new URL(this.getAttribute('three') || './vendor/three.module.min.js', document.baseURI).href);
        const r = this.renderer = new T.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
        r.outputColorSpace = T.SRGBColorSpace; r.setClearColor(0x000000, 0);
        this.scene = new T.Scene(); this.camera = new T.PerspectiveCamera(32, 1, .5, 200); this.group = new T.Group(); this.scene.add(this.group);
        const L = new T.TextureLoader(), tex = u => new Promise(res => L.load(this.base + u, t => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; res(t); }));
        const plane = (t, w, h, name) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .02, depthWrite: false })); m.name = name; return m; };
        const [tv, ta, tm, tf, tt, ts, tc, tci, tl] = await Promise.all(['archivo/stack_verde.webp', 'archivo/stack_amarilla.webp', 'archivo/stack_morada.webp', 'sistema/turquesa/folder_sh.webp', 'sistema/turquesa/tab.webp', 'sistema/turquesa/sheet_sh.webp', 'sistema/turquesa/cover_sh.webp', 'sistema/turquesa/cover_inner.webp', 'archivo/label_expediente_paper.webp'].map(tex));
        const W = 10.8, H = 11.76, P = this.parts = {};
        const add = (name, obj, ro) => { const g = new T.Group(); g.name = name; g.add(obj); g.renderOrder = ro; obj.renderOrder = ro; this.group.add(g); P[name] = g; return g; };
        add('morada', plane(tm, W, W * 893 / 820, 'sep_morada'), 1); add('amarilla', plane(ta, W, W * 1025 / 820, 'sep_amarilla'), 2); add('verde', plane(tv, W, W * 1021 / 820, 'sep_verde'), 3);
        add('folder', plane(tf, W, H, 'folder_base'), 4); add('tab', plane(tt, W, H, 'folder_tab'), 5); add('sheet', plane(ts, W, H, 'sheet'), 6);
        await document.fonts?.load('900 80px Outfit').catch(() => {});
        add('label', plane(this.labelTex(T, tl), 7.99, 3.2, 'label_expediente'), 7);
        const cw = 10.33, chh = 5.88, front = plane(tc, cw, chh, 'cover_front'), back = plane(tci, cw, chh, 'cover_inner');
        front.position.y = chh / 2; back.position.y = chh / 2; back.rotation.y = Math.PI; back.renderOrder = 8;
        const hinge = new T.Group(); hinge.add(front, back); const cg = add('cover', hinge, 9); front.renderOrder = 9; P.coverHinge = hinge;
        this.fichas = ACC.map((a, i) => add('ficha' + i, plane(this.fichaTex(T, tl, a), 5.4, 2.6, 'ficha_' + a.key), 10 + i));
        this.meshes = ['verde', 'amarilla', 'morada'].map(k => P[k].children[0]).concat(this.fichas.map(f => f.children[0]));
        this.ray = new T.Raycaster(); this.mouse = new T.Vector2();
        this.canvas.addEventListener('pointermove', e => this.onPointer(e)); this.canvas.addEventListener('pointerleave', () => { this.hoverIdx = -1; this.canvas.style.cursor = 'pointer'; });
        this.canvas.addEventListener('click', e => this.onClick(e));
        this.resize(); this.state.ex = this.target.ex = this.hasAttribute('exploded') ? 1 : 0; this.kick();
      } catch (err) { console.warn('expediente-cutaway: sin WebGL, versión estática', err); this.renderStatic(); }
    }
    labelTex(T, img) { const c = document.createElement('canvas'); c.width = 1000; c.height = 400; const x = c.getContext('2d'); x.drawImage(img.image, 0, 0, 1000, 400);
      x.fillStyle = '#4d5158'; x.font = '600 34px Poppins'; x.fillText('E X P E D I E N T E', 90, 175); x.fillStyle = '#1f2124'; x.font = '900 118px Outfit'; x.fillText('IMPACTA', 82, 290); const w = x.measureText('IMPACTA ').width; x.fillStyle = '#f26f12'; x.fillText('2026', 82 + w, 290);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
    fichaTex(T, img, a) { const c = document.createElement('canvas'); c.width = 1080; c.height = 520; const x = c.getContext('2d'); x.drawImage(img.image, 0, 0, 1080, 520);
      x.fillStyle = a.ink; x.font = '900 130px Outfit'; x.fillText(a.n, 90, 230); x.fillStyle = '#1f2124'; x.font = '800 92px Outfit'; x.fillText(a.title, 90, 350); x.fillStyle = '#2b2c30'; x.font = '500 40px Poppins'; x.fillText(a.sub, 92, 420);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
    renderStatic() {
      this.canvas.style.display = 'none'; this.labelsEl.style.display = 'none'; this.hint.style.display = 'none';
      const s = document.createElement('div'); s.className = 'static'; s.setAttribute('role', 'group'); s.setAttribute('aria-label', 'Accesos del expediente');
      ACC.forEach((a, i) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<img src="${this.base}archivo/stack_${a.key}.webp" alt=""><span style="position:relative;display:flex;flex-direction:column;gap:4px"><span class="n" style="color:${a.ink}">${a.n}</span><span class="t">${a.title}</span><span>${a.sub}</span></span>`; b.addEventListener('click', () => this.select(i)); s.appendChild(b); });
      this.root.appendChild(s);
    }
    resize() { if (!this.renderer) return; const w = this.clientWidth || 1, h = this.clientHeight || 1; this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.draw(); }
    setExploded(on, fromAttr) { this.target.ex = on ? 1 : 0; if (!on) { this.focus_(-1); } this.kick(); if (!fromAttr) this.toggleAttribute('exploded', on); this.emitState(); }
    focus_(i) { this.focusIdx = i; this.target.foc = [0, 1, 2].map(j => j === i ? 1 : 0); if (i >= 0 && this.target.ex < 1) this.target.ex = 1; this.labels.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); this.kick(); this.emitState(); }
    select(i) { const a = ACC[i]; this.dispatchEvent(new CustomEvent('cutaway-select', { detail: { index: i, dest: a.dest, title: a.title }, bubbles: true, composed: true })); }
    emitState() { this.dispatchEvent(new CustomEvent('cutaway-state', { detail: { exploded: this.target.ex > .5, focus: this.focusIdx }, bubbles: true, composed: true })); }
    onKey(e) {
      const k = e.key; if (e.composedPath()[0] !== this && !['Escape', '1', '2', '3', 'ArrowLeft', 'ArrowRight'].includes(k)) return;
      if (k === 'Enter' || k === ' ') { if (this.focusIdx >= 0) this.select(this.focusIdx); else this.setExploded(this.target.ex < .5); }
      else if (k === 'Escape') this.setExploded(false);
      else if (/^[123]$/.test(k)) this.focus_(+k - 1);
      else if (k === 'ArrowRight' || k === 'ArrowLeft') this.focus_(((this.focusIdx < 0 ? (k === 'ArrowRight' ? -1 : 0) : this.focusIdx) + (k === 'ArrowRight' ? 1 : 2)) % 3);
      else return; e.preventDefault();
    }
    pick(e) { const r = this.canvas.getBoundingClientRect(); this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this.ray.setFromCamera(this.mouse, this.camera);
      const hit = this.ray.intersectObjects(this.meshes, false).find(h => { const m = h.object.material; return m.opacity > .4; }); if (!hit) return -1; const i = this.meshes.indexOf(hit.object); return i % 3; }
    onPointer(e) { if (this.state.ex < .6) { this.canvas.style.cursor = 'pointer'; return; } const i = this.pick(e); this.canvas.style.cursor = i >= 0 ? 'pointer' : 'default'; if (i !== this.hoverIdx) { this.hoverIdx = i; if (i >= 0 && this.focusIdx !== i) this.focus_(i); } }
    onClick(e) { if (this.state.ex < .6) return this.setExploded(true); const i = this.pick(e); if (i >= 0) { if (this.focusIdx === i) this.select(i); else this.focus_(i); } else this.focus_(-1); }
    kick() { if (!this.renderer || this.raf) return; this.last = performance.now(); const step = now => { const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; let moving = false;
        const go = (cur, tgt) => { const tau = tgt > cur ? .26 : .13; const v = cur + (tgt - cur) * (1 - Math.exp(-dt / tau)); if (Math.abs(tgt - v) > .002) moving = true; return Math.abs(tgt - v) > .002 ? v : tgt; };
        this.state.ex = go(this.state.ex, this.target.ex); this.state.foc = this.state.foc.map((v, i) => go(v, this.target.foc[i]));
        this.draw(); this.raf = moving ? requestAnimationFrame(step) : 0; };
      this.raf = requestAnimationFrame(step); }
    draw() {
      if (!this.parts) return; const p = pose(this.state), P = this.parts;
      Object.entries(p).forEach(([n, v]) => { const g = P[n]; if (!g || n === 'group' || n === 'cam') return; g.position.set(v.x, v.y, v.z); g.rotation.z = v.rz; if (v.sc) g.scale.setScalar(v.sc);
        g.traverse(o => { if (o.material) { o.material.opacity = v.op; o.visible = v.op > .01; } }); });
      P.coverHinge.rotation.x = -p.cover.open; this.group.rotation.y = p.group.ry; this.group.rotation.x = p.group.rx;
      this.camera.position.set(...p.cam); this.camera.lookAt(0, .4, 0); this.renderer.render(this.scene, this.camera);
      const w = this.clientWidth, h = this.clientHeight, vis = clamp01(this.state.ex * 2 - 1);
      this.fichas.forEach((f, i) => { const v = new this.THREE.Vector3(-2.4, 1.6, 0); f.localToWorld(v); v.project(this.camera); const b = this.labels[i];
        b.style.transform = `translate(${Math.round((v.x * .5 + .5) * w)}px,${Math.round((-v.y * .5 + .5) * h)}px) translate(-10%,-120%)`; b.style.opacity = vis; b.style.visibility = vis > .05 ? 'visible' : 'hidden'; });
      this.hint.style.opacity = this.focusIdx >= 0 ? 0 : 1; this.hint.textContent = this.state.ex > .5 ? '1–3 o ←/→: enfocar · Enter: entrar · Esc: reensamblar' : 'Clic o Enter: desplegar el expediente';
    }
  }
  ExpedienteCutaway.pose = pose; ExpedienteCutaway.ACCESOS = ACC;
  customElements.define('expediente-cutaway', ExpedienteCutaway);
})();
