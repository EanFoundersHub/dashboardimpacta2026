// Bienvenida · Ean Impacta Startup Report 2026. Sin dependencias.
// Se muestra una vez por sesión. El nombre solo se guarda si la persona marca la autorización y pulsa «Entrar al portafolio».
(() => {
  const CONFIG = {
    autorizacion: 'https://universidadean.edu.co/la-universidad/quienes-somos/orientacion-estrategica/reglamentos-universidad-ean/autorizacion-uso-de-datos-personales',
    avisoPrivacidad: 'https://universidadean.edu.co/la-universidad/quienes-somos/orientacion-estrategica/reglamentos-universidad-ean/aviso-de-privacidad',
    politicaPrivacidad: 'https://universidadean.edu.co/sites/default/files/institucion/acuerdos/politica-tratamiento-de-datos-personales.pdf',
    claveSesion: 'impacta2026:bienvenida-vista',   // sessionStorage
    claveNombre: 'impacta2026:nombre',             // sessionStorage, solo con autorización
  };
  let vista = false;
  try { vista = sessionStorage.getItem(CONFIG.claveSesion) === '1' && Boolean(sessionStorage.getItem(CONFIG.claveNombre)); } catch {}
  if (vista) return;

  const ARROW = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const d = document.createElement('dialog');
  d.className = 'bv'; d.setAttribute('aria-labelledby', 'bv-q'); d.setAttribute('aria-describedby', 'bv-k');
  d.innerHTML = `<form class="bv__sheet" method="dialog">
    <span class="bv__kraft" aria-hidden="true"></span><span class="bv__tape" aria-hidden="true"></span>
    <div class="bv__body">
      <p class="bv__kicker" id="bv-k">Estás a punto de conocer el portafolio emprendedor más innovador.</p>
      <h2 class="bv__q" id="bv-q">¿Cómo quieres que te <em>llamemos?</em></h2>
      <div class="bv__field"><label for="bv-nombre">Nombre</label>
        <input class="bv__input" id="bv-nombre" name="nombre" type="text" autocomplete="given-name" autocapitalize="words" enterkeyhint="go" maxlength="60" required></div>
      <div class="bv__consent">
        <label class="bv__check"><input type="checkbox" id="bv-ok" name="autorizo" required><span aria-hidden="true"></span>Autorizo el tratamiento de mis datos personales.</label>
        <p class="bv__legal" id="bv-legal">De manera voluntaria, explícita, informada e inequívoca, autorizo a la Universidad Ean para tratar mis <a href="${CONFIG.autorizacion}" target="_blank" rel="noopener">datos personales</a>, de acuerdo con lo dispuesto en los artículos 5, 7 y concordantes del Decreto 1377 de 2013 y las demás disposiciones legales referentes al tema. Para mayor información acerca del manejo de tus datos personales, puedes revisar nuestro <a href="${CONFIG.avisoPrivacidad}" target="_blank" rel="noopener">aviso de privacidad</a> y nuestra <a href="${CONFIG.politicaPrivacidad}" target="_blank" rel="noopener">política de privacidad</a>.</p>
      </div>
    </div>
    <div class="bv__foot">
      <button type="submit" class="bv__btn" data-bv="entrar">Entrar al portafolio ${ARROW}</button>
    </div></form>`;

  const marcarVista = () => { try { sessionStorage.setItem(CONFIG.claveSesion, '1'); } catch (e) {} };
  const salir = nombre => {
    marcarVista(); d.close();
    document.dispatchEvent(new CustomEvent('impacta:bienvenida', { detail: { nombre: nombre || null } }));
  };
  const input = () => d.querySelector('#bv-nombre'), ok = () => d.querySelector('#bv-ok');

  d.addEventListener('submit', e => {
    e.preventDefault();
    const n = input().value.trim().replace(/\s+/g, ' ');
    if (!n) {
      input().setCustomValidity('Escribe tu nombre para continuar.');
      input().reportValidity();
      return;
    }
    if (!ok().checked) return;
    try { sessionStorage.setItem(CONFIG.claveNombre, n); } catch {}
    salir(n);
  });
  d.addEventListener('input', e => { if (e.target === input()) input().setCustomValidity(''); });
  d.addEventListener('cancel', e => e.preventDefault());

  // Teclado virtual: ajusta la altura al área visible para que las acciones sigan a la vista.
  const vv = window.visualViewport;
  const fit = () => { d.style.setProperty('--bv-vh', (vv ? vv.height : innerHeight) + 'px'); if (vv) d.style.transform = `translateY(${vv.offsetTop}px)`; };
  const focusIn = e => { if (e.target.matches('input')) setTimeout(() => { const b = d.querySelector('.bv__body'), r = e.target.getBoundingClientRect(), br = b.getBoundingClientRect(); if (r.bottom > br.bottom || r.top < br.top) b.scrollTop += r.top - br.top - 16; }, 250); };

  const abrir = () => {
    document.body.appendChild(d); fit();
    vv && vv.addEventListener('resize', fit); vv && vv.addEventListener('scroll', fit);
    d.addEventListener('focusin', focusIn);
    d.showModal();
    // En escritorio el foco va al campo; en táctil, al diálogo, para no abrir el teclado de inmediato.
    if (matchMedia('(pointer:fine)').matches) input().focus(); else d.querySelector('.bv__sheet').setAttribute('tabindex', '-1'), d.querySelector('.bv__sheet').focus();
  };
  d.addEventListener('close', () => { vv && vv.removeEventListener('resize', fit); vv && vv.removeEventListener('scroll', fit); });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', abrir) : abrir();
})();
