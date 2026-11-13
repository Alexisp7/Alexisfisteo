// Pantalla de carga y transición entre páginas (estilos en css/efectos.css).
// Va justo después de <body>: la hoja aparece en el primer cuadro, antes de que se ejecute nada pesado.
// Su péndulo y la luz de la regla se animan solo con transform, así siguen moviéndose aunque la página
// esté ocupada armando sus escenas. Una página puede pedir que la hoja espere con window.fxEspera(promesa);
// window.fxRevelado se cumple cuando la hoja empieza a retirarse.
(function () {
  var d = document, raiz = d.documentElement;
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SECCION = { 'index.html': 'Inicio', '': 'Inicio', 'cursos.html': 'Cursos', 'proyectos.html': 'Proyectos', 'contacto.html': 'Contacto',
    'quantumquipu.html': 'QuantumQuipu', 'blackscholes.html': 'Black–Scholes cuántico', 'relatividad.html': 'Relatividad General',
    'mecanica-cuantica.html': 'Mecánica Cuántica', 'problemas.html': 'Problemas de física', 'bitacora.html': 'Bitácora', 'cementerio.html': 'Bitácora' };
  // lo que cada página pesada pide al cargar: se precarga junto con la página al acercar el cursor a su enlace
  var RECURSOS = {
    'cursos.html': ['js/fision-nube.js', 'js/fision.js', 'js/canon.js', 'js/momento.js', 'js/cursos-escenas.js', 'css/fision.css', 'css/momento.css'],
    'index.html': ['js/qubits.js?v=20261105d'], '': ['js/qubits.js?v=20261105d'],
    'quantumquipu.html': ['js/orcopampa-iconos.js', 'js/red-orcopampa.js', 'img/quantumquipu/titulo.webp', 'img/quantumquipu/qubo.webp'],
    'contacto.html': ['img/alexis-perfil.webp'],
    'blackscholes.html': ['img/Black sholes/circuitos.webp', 'img/Black sholes/titulo.webp']
  };
  function archivo(url) { return url.pathname.split('/').pop(); }
  function nombreDe(url) { return SECCION[archivo(url)] || (d.title.split('—')[0] || '').trim(); }

  function hoja(titulo, clase, t0) {
    var h = d.createElement('div'); h.className = 'fx-hoja ' + (clase || ''); h.setAttribute('aria-hidden', 'true');
    h.innerHTML = '<div class="fx-hoja-c"><span class="fx-hoja-k">Alexis R. Salvatierra · Física · UNMSM</span><span class="fx-hoja-t"></span><span class="fx-hoja-r"></span>' +
      '<span class="fx-pend"><svg class="fx-pend-arco" viewBox="0 0 100 84"><path d="M31.3 65.4A68 68 0 0 0 68.7 65.4"/><path class="fx-pend-eje" d="M44 .5H56"/></svg><span class="fx-pend-brazo"><i></i></span></span></div>';
    h.querySelector('.fx-hoja-t').textContent = titulo;
    // el péndulo sigue su vaivén de una página a otra: retoma la fase guardada en vez de empezar de nuevo
    if (t0) h.style.setProperty('--fx-fase', -((Date.now() - t0) % 3200) + 'ms');
    d.body.appendChild(h); return h;
  }

  var esperas = [], revelar, yaRevelado = false;
  window.fxRevelado = new Promise(function (ok) { revelar = ok; });
  window.fxEspera = function (p) { esperas.push(p); };

  var guardado = null, fase = 0;
  try { guardado = sessionStorage.getItem('fx-hoja'); fase = +sessionStorage.getItem('fx-fase') || 0; sessionStorage.removeItem('fx-hoja'); } catch (e) {}
  if (!quieto) {
    // la hoja cubre la pantalla mientras cargan imágenes, fuentes y escenas; al estar todo listo se retira a la izquierda
    var t0 = performance.now(), fuera = false;
    var h0 = hoja(guardado || nombreDe(location), 'fx-quieta fx-cargando', guardado ? fase : 0);
    raiz.classList.add('fx-espera'); raiz.classList.remove('fx-llega');
    var retirar = function () {
      if (fuera) return; fuera = true;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        h0.className = 'fx-hoja fx-sale'; raiz.classList.remove('fx-espera');
        yaRevelado = true; revelar();
        setTimeout(function () { h0.remove(); }, 480);
      }); });
    };
    var cargada = new Promise(function (ok) { if (d.readyState === 'complete') ok(); else addEventListener('load', ok, { once: true }); });
    // las fuentes rara vez tardan, pero si tardan no retienen la página más de 1,2 s
    var fuentes = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise(function (ok) { setTimeout(ok, 1200); })]) : Promise.resolve();
    // al cambiar de sección, la hoja se queda 1,5 s más una vez que todo está listo, para que el péndulo se luzca
    var extra = guardado ? 1500 : 0;
    var pausa = function () { return new Promise(function (ok) { setTimeout(ok, extra); }); };
    cargada.then(function () { return Promise.all([fuentes].concat(esperas)); }).then(pausa, pausa).then(retirar);
    // tope de seguridad: una página con escenas puede esperar más; ninguna se queda tapada
    setTimeout(function () { if (!esperas.length) retirar(); }, 2600 + extra);
    setTimeout(retirar, 7000 + extra);
  } else { raiz.classList.remove('fx-llega'); yaRevelado = true; revelar(); }

  var yendo = false;
  function ir(href) {
    if (quieto || yendo) { location.href = href; return; }
    var u = new URL(href, location.href);
    yendo = true;
    var t = nombreDe(u), ahora = Date.now(), h = hoja(t, '', ahora);
    try { sessionStorage.setItem('fx-hoja', t); sessionStorage.setItem('fx-fase', ahora); } catch (e) {}
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('fx-entra'); }); });
    precargar(u.href);
    setTimeout(function () { location.href = u.href; }, 230);
  }
  window.fxIr = ir;
  window.fxPrecarga = function (href) { precargar(href); };

  // precarga: al acercar el cursor (o tocar) un enlace interno, el navegador ya va pidiendo esa página y lo que necesita
  var precargadas = {};
  function prefetch(href) {
    if (precargadas[href]) return; precargadas[href] = 1;
    var l = d.createElement('link'); l.rel = 'prefetch'; l.href = href; d.head.appendChild(l);
  }
  function precargar(href) {
    var u = new URL(href, location.href);
    prefetch(u.href);
    (RECURSOS[archivo(u)] || []).forEach(function (r) { prefetch(new URL(r, u.href).href); });
  }
  function interno(a) {
    if (!a || a.target === '_blank') return null;
    var h = a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(h) || /\.pdf($|\?|#)/i.test(h)) return null;
    var u = new URL(a.href, location.href);
    return u.host === location.host && u.pathname !== location.pathname ? u.href.split('#')[0] : null;
  }
  ['pointerover', 'touchstart', 'focusin'].forEach(function (tipo) {
    d.addEventListener(tipo, function (ev) { var u = interno(ev.target.closest && ev.target.closest('a[href]')); if (u) precargar(u); }, { passive: true });
  });
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var h = a.getAttribute('href');
    if (a.target === '_blank' || a.hasAttribute('download') || !h || h.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(h) || /\.pdf($|\?|#)/i.test(h)) return;
    var u = new URL(a.href, location.href);
    if (u.protocol !== location.protocol || u.host !== location.host || (u.pathname === location.pathname && u.search === location.search)) return;
    ev.preventDefault(); ir(a.href);
  });
  // al volver con "atrás" desde la caché del navegador, ninguna hoja debe quedar encima
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    yendo = false; Array.prototype.forEach.call(d.querySelectorAll('.fx-hoja'), function (n) { n.remove(); });
    raiz.classList.remove('fx-llega', 'fx-espera');
  });
})();
