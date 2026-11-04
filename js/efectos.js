// Efectos del sitio (ver css/efectos.css). Todo se apaga con "reducir movimiento".
(function () {
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d = document;
  function todos(sel) { return Array.prototype.slice.call(d.querySelectorAll(sel)); }

  // ── transición académica: la hoja con el título de la sección ──
  var SECCION = { 'index.html': 'Inicio', '': 'Inicio', 'cursos.html': 'Cursos', 'proyectos.html': 'Proyectos', 'contacto.html': 'Contacto',
    'quantumquipu.html': 'QuantumQuipu', 'blackscholes.html': 'Black–Scholes cuántico', 'relatividad.html': 'Relatividad General',
    'mecanica-cuantica.html': 'Mecánica Cuántica', 'problemas.html': 'Problemas de física' };
  function nombreDe(url) { var f = url.pathname.split('/').pop(); return SECCION[f] || (d.title.split('—')[0] || '').trim(); }
  function hoja(titulo, clase) {
    var h = d.createElement('div'); h.className = 'fx-hoja ' + (clase || ''); h.setAttribute('aria-hidden', 'true');
    h.innerHTML = '<div class="fx-hoja-c"><span class="fx-hoja-k">Alexis R. Salvatierra · Física · UNMSM</span><span class="fx-hoja-t"></span><span class="fx-hoja-r"></span></div>';
    h.querySelector('.fx-hoja-t').textContent = titulo; d.body.appendChild(h); return h;
  }
  var guardado = null;
  try { guardado = sessionStorage.getItem('fx-hoja'); sessionStorage.removeItem('fx-hoja'); } catch (e) {}
  if (guardado && !quieto) {
    // llega desde otra página: la hoja ya cubre la pantalla y se retira hacia la izquierda
    var h0 = hoja(guardado, 'fx-quieta');
    d.documentElement.classList.remove('fx-llega');
    setTimeout(function () { h0.className = 'fx-hoja fx-sale'; setTimeout(function () { h0.remove(); }, 560); }, 140);
  } else d.documentElement.classList.remove('fx-llega');
  var yendo = false;
  function ir(href) {
    if (quieto || yendo) { location.href = href; return; }
    var u = new URL(href, location.href);
    yendo = true;
    var t = nombreDe(u), h = hoja(t);
    try { sessionStorage.setItem('fx-hoja', t); } catch (e) {}
    requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('fx-entra'); }); });
    setTimeout(function () { location.href = u.href; }, 400);
  }
  window.fxIr = ir;
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
  window.addEventListener('pageshow', function (e) { if (e.persisted) { yendo = false; Array.prototype.forEach.call(d.querySelectorAll('.fx-hoja'), function (n) { n.remove(); }); d.documentElement.classList.remove('fx-llega'); } });

  // ── haz de progreso ──
  var haz = d.createElement('div'); haz.className = 'fx-haz'; haz.setAttribute('aria-hidden', 'true'); d.body.appendChild(haz);
  var pendiente = false;
  function progreso() {
    pendiente = false;
    var max = d.documentElement.scrollHeight - innerHeight;
    haz.style.setProperty('--fx-p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
  }
  addEventListener('scroll', function () { if (!pendiente) { pendiente = true; requestAnimationFrame(progreso); } }, { passive: true });
  addEventListener('resize', progreso); progreso();

  // ── aparición por warp ──
  var WARP = ['.section-title', '.project-card', '.course-card', '.courses-show-more', '.page-hero-title', '.page-hero p', '.rg-titulo', '.rg-lista li',
    '.contact-info-item', '.contact-form-group', '.about-photo', '.about-text > *', '.skills-tags', '.form-group', '.qq-links', '.ro-panel',
    '.proj-section', '.pagina', '.carousel', '.problema-card', '.problemas-lista > *'];
  if (!quieto && 'IntersectionObserver' in window) {
    var vistos = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target, hermanos = n.parentNode ? Array.prototype.indexOf.call(n.parentNode.children, n) : 0;
        n.style.setProperty('--fx-d', Math.min(hermanos, 6) * 0.08 + 's');
        n.classList.add('fx-dentro'); io.unobserve(n);
        n.addEventListener('animationend', function fin() { n.classList.remove('fx-warp', 'fx-dentro'); n.style.removeProperty('--fx-d'); n.removeEventListener('animationend', fin); });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    todos(WARP.join(',')).forEach(function (n) {
      if (vistos.has(n) || n.closest('.hero, .qq-hero, .fx-portal') || getComputedStyle(n).position === 'fixed') return;
      vistos.add(n); n.classList.add('fx-warp'); io.observe(n);
    });
  }

  // ── brillo en las cursivas doradas de los títulos ──
  todos('.section-title em, .page-hero-title em, .proj-hero-title em, .title-sep em').forEach(function (em) {
    var c = getComputedStyle(em).color.match(/\d+/g);
    if (!c) return;
    var r = +c[0], g = +c[1], b = +c[2];
    if (r > 120 && r > b + 30) { em.classList.add('fx-brillo'); if (r < 170) em.classList.add('fx-hondo'); }
  });

  // ── tarjetas con resplandor y esquinas ──
  function claro(n) {
    var e = n;
    while (e && e !== d.documentElement) { var bg = getComputedStyle(e).backgroundColor.match(/[\d.]+/g); if (bg && (bg.length < 4 || +bg[3] > 0.5)) return (+bg[0] + +bg[1] + +bg[2]) / 3 > 140; e = e.parentElement; }
    return true;
  }
  todos('.project-card, .course-card, .qq-link--web, .rg-lista a').forEach(function (n) {
    if (getComputedStyle(n).position === 'static') n.style.position = 'relative';
    n.classList.add('fx-carta'); if (claro(n)) n.classList.add('fx-claro');
    var r = d.createElement('span'); r.className = 'fx-resplandor'; r.setAttribute('aria-hidden', 'true');
    var a = d.createElement('span'); a.className = 'fx-esq a'; a.setAttribute('aria-hidden', 'true');
    var b = d.createElement('span'); b.className = 'fx-esq b'; b.setAttribute('aria-hidden', 'true');
    n.appendChild(r); n.appendChild(a); n.appendChild(b);
    n.addEventListener('pointermove', function (ev) {
      var q = n.getBoundingClientRect();
      n.style.setProperty('--fx-x', (ev.clientX - q.left) + 'px'); n.style.setProperty('--fx-y', (ev.clientY - q.top) + 'px');
    });
  });

  // ── botones con reflejo ──
  todos('.btn-show-more, .contact-submit, button[type="submit"], .btn-primary, .btn, .pdf-btn, .curtain-link, .slide-link').forEach(function (n) { n.classList.add('fx-boton'); });

  // ── línea viva sobre el pie ──
  todos('.footer-wrap').forEach(function (f) { var l = d.createElement('div'); l.className = 'fx-pie'; l.setAttribute('aria-hidden', 'true'); f.parentNode.insertBefore(l, f); });
})();
