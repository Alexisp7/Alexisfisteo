// Efectos del sitio (ver css/efectos.css). Todo se apaga con "reducir movimiento".
(function () {
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d = document;
  function todos(sel) { return Array.prototype.slice.call(d.querySelectorAll(sel)); }

  // la pantalla de carga y la transición entre páginas viven en js/carga.js

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
    var empezar = function (fn) { if (window.fxRevelado) window.fxRevelado.then(fn); else fn(); };
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
      vistos.add(n); n.classList.add('fx-warp');
    });
    // los bloques aparecen cuando la hoja de carga se retira, no detrás de ella
    empezar(function () { vistos.forEach(function (n) { io.observe(n); }); });
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
