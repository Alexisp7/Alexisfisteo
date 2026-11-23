// Física teórica · página del curso (formato de sílabo).
// Figura 1: densidad espectral de Planck ρ(ν,T) = 8πhν³/c³ /(e^{hν/kT}−1) frente a Rayleigh–Jeans 8πν²kT/c³,
// con estilo de figura de artículo. Además: visor del PDF de la clase y entrada tras la hoja de carga.
(function () {
  'use strict';
  var d = document, raiz = d.documentElement;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(v, n) { return v.toFixed(n).replace('.', ','); }
  function miles(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  var H_ = 6.62607015e-34, K_ = 1.380649e-23, C_ = 2.99792458e8, A_ = 7.5657e-16, WIEN_NU = 5.878925757e10, WIEN_L = 2.897771955e-3;
  var NU_MAX = 1500e12;
  var pc = d.getElementById('ftPlanck'), px = pc.getContext('2d'), rT = d.getElementById('ftTemp');
  var Tobj = +rT.value, Tvis = Tobj, pW = 0, pH = 0, hoverNu = null, pendiente = true;
  var TINTA = '#1F1C17', TINTA2 = '#4A443B', TINTA3 = '#7B7366', REGLA = '#D9D0BF', ACENTO = '#7A1F3D';

  function rho(nu, T) { var x = H_ * nu / (K_ * T); return 8 * Math.PI * H_ * nu * nu * nu / (C_ * C_ * C_) / (Math.exp(x) - 1); }
  function rj(nu, T) { return 8 * Math.PI * nu * nu * K_ * T / (C_ * C_ * C_); }
  function colorNu(thz) {
    var l = 299792.458 / thz, r = 0, g = 0, b = 0;
    if (l >= 380 && l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else if (l <= 780) { r = 1; }
    return [r * 255 | 0, g * 255 | 0, b * 255 | 0];
  }
  function tam() { var r = pc.getBoundingClientRect(); pW = r.width; pH = r.height; pc.width = Math.round(pW * DPR); pc.height = Math.round(pH * DPR); pendiente = true; }

  function dibuja() {
    var c = px, T = Tvis; c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, pW, pH);
    var L = 58, R = 16, Tp = 18, B = 46, w = pW - L - R, h = pH - Tp - B;
    var pico = rho(WIEN_NU * T, T), ymax = pico * 1.15;
    function X(nu) { return L + nu / NU_MAX * w; } function Y(v) { return Tp + h - v / ymax * h; }
    // espectro visible: franja fina bajo el eje
    for (var f = 400; f < 790; f += 2) { c.fillStyle = 'rgb(' + colorNu(f) + ')'; c.fillRect(X(f * 1e12), Tp + h + 1, w * 2e12 / NU_MAX + .6, 4); }
    // ejes con marcas hacia dentro
    c.strokeStyle = TINTA; c.lineWidth = 1; c.beginPath(); c.moveTo(L, Tp); c.lineTo(L, Tp + h); c.lineTo(L + w, Tp + h); c.stroke();
    c.font = '13px Newsreader, Georgia, serif'; c.fillStyle = TINTA2; c.textAlign = 'center';
    for (var m = 0; m <= 1500; m += 250) {
      var xm = X(m * 1e12); c.beginPath(); c.moveTo(xm, Tp + h); c.lineTo(xm, Tp + h - 5); c.stroke();
      c.fillText(m, xm, Tp + h + 20);
    }
    for (m = 0; m <= 1; m += .25) { var ym = Y(m * pico); c.beginPath(); c.moveTo(L, ym); c.lineTo(L + 5, ym); c.stroke(); c.textAlign = 'right'; c.fillText(fmt(m, 2), L - 7, ym + 4); }
    c.textAlign = 'center'; c.font = 'italic 14px Newsreader, Georgia, serif'; c.fillStyle = TINTA;
    c.fillText('ν  (THz)', L + w / 2, Tp + h + 40);
    c.save(); c.translate(16, Tp + h / 2); c.rotate(-Math.PI / 2); c.fillText('ρ(ν,T), normalizada', 0, 0); c.restore();
    // Rayleigh–Jeans, discontinua, hasta salir del marco
    c.save(); c.beginPath(); c.rect(L, Tp, w, h); c.clip();
    c.setLineDash([6, 4]); c.strokeStyle = TINTA2; c.lineWidth = 1.3; c.beginPath();
    for (var nu = 1e12; nu <= NU_MAX; nu += 5e12) { var y = Y(rj(nu, T)); c[nu === 1e12 ? 'moveTo' : 'lineTo'](X(nu), y); if (y < Tp - 2) break; }
    c.stroke(); c.setLineDash([]);
    // Planck, continua
    c.strokeStyle = TINTA; c.lineWidth = 1.8; c.beginPath();
    for (nu = 1e12; nu <= NU_MAX; nu += 3e12) c[nu === 1e12 ? 'moveTo' : 'lineTo'](X(nu), Y(rho(nu, T)));
    c.stroke();
    // máximo de Wien
    var nP = WIEN_NU * T;
    c.strokeStyle = ACENTO; c.lineWidth = 1; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(X(nP), Y(pico)); c.lineTo(X(nP), Tp + h); c.stroke(); c.setLineDash([]);
    c.fillStyle = ACENTO; c.beginPath(); c.arc(X(nP), Y(pico), 3, 0, 7); c.fill();
    c.font = 'italic 13px Newsreader, Georgia, serif'; c.textAlign = nP > NU_MAX * .7 ? 'right' : 'left';
    c.fillText('máximo: ' + Math.round(nP / 1e12) + ' THz', X(nP) + (nP > NU_MAX * .7 ? -8 : 8), Y(pico) - 8);
    // leyenda, arriba a la derecha
    var lx = L + w - 150, ly = Tp + 22;
    c.strokeStyle = TINTA; c.lineWidth = 1.8; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 26, ly); c.stroke();
    c.strokeStyle = TINTA2; c.lineWidth = 1.3; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(lx, ly + 20); c.lineTo(lx + 26, ly + 20); c.stroke(); c.setLineDash([]);
    c.fillStyle = TINTA; c.textAlign = 'left'; c.font = 'italic 13px Newsreader, Georgia, serif';
    c.fillText('Planck', lx + 34, ly + 4); c.fillStyle = TINTA2; c.fillText('Rayleigh–Jeans', lx + 34, ly + 24);
    // lectura bajo el cursor
    if (hoverNu) {
      var hv = rho(hoverNu, T), hr = rj(hoverNu, T), xh = X(hoverNu);
      c.strokeStyle = REGLA; c.beginPath(); c.moveTo(xh, Tp); c.lineTo(xh, Tp + h); c.stroke();
      c.fillStyle = TINTA; c.beginPath(); c.arc(xh, Y(hv), 2.6, 0, 7); c.fill();
      var razon = hr / hv, txt = Math.round(hoverNu / 1e12) + ' THz · λ = ' + Math.round(C_ / hoverNu * 1e9) + ' nm · RJ/Planck = ' + (razon < 1000 ? fmt(razon, razon < 10 ? 2 : 0) : razon.toExponential(1).replace('.', ','));
      c.font = '12px "Space Mono", monospace'; var tw = c.measureText(txt).width + 14, bx = cl(xh - tw / 2, L + 2, L + w - tw - 2);
      c.fillStyle = 'rgba(252,250,245,.95)'; c.fillRect(bx, Tp + 4, tw, 22); c.strokeStyle = REGLA; c.strokeRect(bx + .5, Tp + 4.5, tw - 1, 21);
      c.fillStyle = TINTA; c.textAlign = 'left'; c.fillText(txt, bx + 7, Tp + 19);
    }
    c.restore();
  }
  function lecturas(T) {
    d.getElementById('ftT').textContent = miles(T) + ' K';
    d.getElementById('ftNu').textContent = Math.round(WIEN_NU * T / 1e12) + ' THz';
    d.getElementById('ftLa').textContent = Math.round(WIEN_L / T * 1e9) + ' nm';
    var u = A_ * Math.pow(T, 4); d.getElementById('ftU').textContent = (u < 10 ? fmt(u, 2) : fmt(u, 1)) + ' J/m³';
  }
  var pres = d.querySelectorAll('.ac-pres button');
  function marcar() { pres.forEach(function (b) { b.classList.toggle('on', +b.dataset.t === Tobj); }); }
  rT.addEventListener('input', function () { Tobj = +rT.value; lecturas(Tobj); marcar(); pendiente = true; });
  pres.forEach(function (b) { b.addEventListener('click', function () { Tobj = +b.dataset.t; rT.value = Tobj; lecturas(Tobj); marcar(); pendiente = true; }); });
  pc.addEventListener('pointermove', function (ev) { var r = pc.getBoundingClientRect(), x = ev.clientX - r.left; hoverNu = x > 58 && x < r.width - 16 ? (x - 58) / (r.width - 74) * NU_MAX : null; pendiente = true; });
  pc.addEventListener('pointerleave', function () { hoverNu = null; pendiente = true; });

  // solo se redibuja cuando algo cambia (transición suave entre temperaturas)
  function cuadro() {
    if (Math.abs(Tobj - Tvis) > .5) { Tvis += (Tobj - Tvis) * .2; pendiente = true; } else if (Tvis !== Tobj) { Tvis = Tobj; pendiente = true; }
    if (pendiente) { pendiente = false; dibuja(); }
    requestAnimationFrame(cuadro);
  }

  // visor del PDF
  var visor = d.querySelector('.ac-visor'), ifr = visor.querySelector('iframe');
  d.querySelectorAll('[data-abrir]').forEach(function (b) { b.addEventListener('click', function () { if (!ifr.src) ifr.src = b.dataset.abrir; visor.classList.add('abierto'); }); });
  function cerrar() { visor.classList.remove('abierto'); }
  visor.addEventListener('click', function (ev) { if (ev.target === visor || ev.target.closest('[data-cerrar]')) cerrar(); });
  addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrar(); });

  var esperaR = null;
  addEventListener('resize', function () { clearTimeout(esperaR); esperaR = setTimeout(tam, 120); });
  tam(); lecturas(Tobj);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { pendiente = true; });
  requestAnimationFrame(cuadro);
  function armar() { raiz.classList.add('ac-armado'); }
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieto) armar(); else if (window.fxRevelado) window.fxRevelado.then(armar); else armar();
  addEventListener('pageshow', function (e) { if (e.persisted) armar(); });
})();
