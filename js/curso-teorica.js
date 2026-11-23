// Física teórica · página del curso.
// Cielo nocturno sobre el valle del Colca con cascadas vivas (lienzo 2D fijo), espectro de Planck interactivo,
// árbol de Heitler y efectos de la página (letras, aparición al bajar, reflejos, imán, visor del PDF).
// Física real: Planck ρ(ν,T) = 8πhν³/c³ /(e^{hν/kT}−1); Wien ν_máx = 5,879·10¹⁰ Hz/K · T; u = aT⁴;
// Heitler N_máx = E₀/E_c, X_máx = X₀ ln(E₀/E_c) con X₀ = 36,7 g/cm² y E_c = 87 MeV en aire.
(function () {
  'use strict';
  var d = document, raiz = d.documentElement;
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function fmt(v, n) { return v.toFixed(n).replace('.', ','); }
  function miles(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function cient(v) { var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); if (m >= 9.95) { m /= 10; e++; } return fmt(m, 1) + ' × 10' + String(e).split('').map(function (c) { return SUP[c]; }).join(''); }

  /* ───────────── letras del título */
  var tit = d.querySelector('[data-letras]'), iL = 0;
  (function partir(n) {
    Array.prototype.slice.call(n.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var f = d.createDocumentFragment();
        c.textContent.split('').forEach(function (ch) {
          if (ch === ' ') { f.appendChild(d.createTextNode(' ')); return; }
          var s = d.createElement('span'); s.className = 'l'; s.style.setProperty('--i', iL++); s.textContent = ch; f.appendChild(s);
        });
        n.replaceChild(f, c);
      } else if (c.nodeType === 1) partir(c);
    });
  })(tit);

  /* ───────────── cielo: estrellas, cordillera, tanques y cascadas */
  var cv = d.querySelector('.ft-cielo'), cx = cv.getContext('2d');
  var W = 0, H = 0, capaE = null, capaM = null, brillantes = [], tanques = [], cascadas = [];
  var mx = 0, my = 0, pmx = 0, pmy = 0, tSig = { tau: 1.2, rc: .4 };

  // perfil del terreno: macizo izquierdo (de donde sale el tau), fondo del valle y ladera derecha con los tanques
  function suelo(x) {
    var u = x / W, y;
    if (u < .42) { var a = u / .42; y = .63 + .30 * Math.pow(a, 1.6) - .05 * Math.sin(a * Math.PI) ; }
    else { var b = (u - .42) / .58; y = .93 - .27 * Math.pow(b, .8); }
    y += .012 * Math.sin(u * 37) + .007 * Math.sin(u * 91 + 1.3) + .004 * Math.sin(u * 211);
    return y * H;
  }

  function armarCielo() {
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    // estrellas en una capa con margen para el paralaje
    capaE = d.createElement('canvas'); capaE.width = Math.round((W + 40) * DPR); capaE.height = Math.round((H + 40) * DPR);
    var e = capaE.getContext('2d'); e.scale(DPR, DPR);
    var g = e.createLinearGradient(0, 0, 0, H + 40);
    g.addColorStop(0, '#04050B'); g.addColorStop(.55, '#070917'); g.addColorStop(.85, '#120A1E'); g.addColorStop(1, '#1A0C22');
    e.fillStyle = g; e.fillRect(0, 0, W + 40, H + 40);
    // brillo del aire (airglow) sobre la cordillera
    var ag = e.createRadialGradient(W * .55, H * .95, 10, W * .55, H * .95, W * .7);
    ag.addColorStop(0, 'rgba(120,40,110,.20)'); ag.addColorStop(.5, 'rgba(60,40,120,.08)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
    e.fillStyle = ag; e.fillRect(0, 0, W + 40, H + 40);
    // banda de la Vía Láctea: una diagonal de polvo de estrellas
    var nV = Math.round(W * H / 900);
    for (var i = 0; i < nV; i++) {
      var s = Math.random(), q = (Math.random() + Math.random() + Math.random() - 1.5) * .16;
      var x = s * (W + 40), y = (.08 + .55 * (1 - s)) * H + q * H;
      e.fillStyle = 'rgba(' + (200 + Math.random() * 55 | 0) + ',' + (190 + Math.random() * 50 | 0) + ',255,' + rnd(.05, .35) + ')';
      e.fillRect(x, y, rnd(.5, 1.1), rnd(.5, 1.1));
    }
    var neb = e.createLinearGradient(0, H * .6, W, H * .05);
    neb.addColorStop(0, 'rgba(0,0,0,0)'); neb.addColorStop(.45, 'rgba(150,120,220,.05)'); neb.addColorStop(.6, 'rgba(206,32,104,.04)'); neb.addColorStop(1, 'rgba(0,0,0,0)');
    e.fillStyle = neb; e.fillRect(0, 0, W + 40, H + 40);
    var nE = Math.round(W * H / 2600);
    for (i = 0; i < nE; i++) {
      var r = Math.pow(Math.random(), 3) * 1.4 + .3;
      e.beginPath(); e.arc(Math.random() * (W + 40), Math.random() * (H + 40), r, 0, 7);
      var t = Math.random();
      e.fillStyle = t < .15 ? 'rgba(255,214,190,' + rnd(.4, .9) + ')' : t < .3 ? 'rgba(190,215,255,' + rnd(.4, .9) + ')' : 'rgba(255,255,255,' + rnd(.25, .8) + ')';
      e.fill();
    }
    brillantes = [];
    for (i = 0; i < 46; i++) brillantes.push({ x: Math.random() * W, y: Math.random() * H * .7, r: rnd(.8, 1.7), f: rnd(.6, 2.2), p: rnd(0, 7) });

    // cordillera y tanques
    capaM = d.createElement('canvas'); capaM.width = cv.width; capaM.height = cv.height;
    var m = capaM.getContext('2d'); m.scale(DPR, DPR);
    // cordillera lejana
    m.beginPath(); m.moveTo(0, H);
    for (x = 0; x <= W; x += 4) m.lineTo(x, H * (.70 + .05 * Math.sin(x / W * 9 + 2) + .025 * Math.sin(x / W * 27)) );
    m.lineTo(W, H); m.closePath(); m.fillStyle = 'rgba(22,16,36,.9)'; m.fill();
    // valle
    m.beginPath(); m.moveTo(0, H);
    for (x = 0; x <= W; x += 3) m.lineTo(x, suelo(x));
    m.lineTo(W, H); m.closePath();
    var gm = m.createLinearGradient(0, H * .6, 0, H); gm.addColorStop(0, '#0E0B17'); gm.addColorStop(1, '#06050A');
    m.fillStyle = gm; m.fill();
    // filo de la cresta, apenas iluminado por el cielo
    m.beginPath(); for (x = 0; x <= W; x += 3) m[x ? 'lineTo' : 'moveTo'](x, suelo(x));
    m.strokeStyle = 'rgba(179,155,240,.22)'; m.lineWidth = 1; m.stroke();
    tanques = [];
    for (var fila = 0; fila < 4; fila++)
      for (x = W * (.56 + fila * .012); x < W * .95; x += W * .018) {
        var ty = suelo(x) + 10 + fila * 11 + Math.sin(x * .7) * 2;
        tanques.push({ x: x, y: ty, luz: 0 });
        m.beginPath(); m.arc(x, ty, 1.4, 0, 7); m.fillStyle = 'rgba(158,219,238,.38)'; m.fill();
      }
  }

  // una cascada: árbol de tramos que nace en un punto y se abre; cada tramo se recorta contra el suelo
  function nuevaCascada(tipo) {
    var c = { tipo: tipo, t0: performance.now() / 1000, tramos: [], v: tipo === 'tau' ? W * .24 : H * .5, blanco: 0, golpe: false };
    var x0, y0, ang, L, prof;
    if (tipo === 'tau') {
      x0 = W * rnd(.2, .3); y0 = suelo(x0) - 2;
      c.blanco = W * rnd(.64, .86);
      var yB = suelo(c.blanco) + 16;
      ang = Math.atan2(yB - y0, c.blanco - x0) - .05; L = W * .1; prof = 6;
      c.tramos.push({ x0: x0 - W * .05, y0: y0 + H * .04, x1: x0, y1: y0, s0: -W * .065, w: 1.6, a: 1, tau: true });
    } else {
      x0 = W * rnd(.05, .95); y0 = -10; ang = Math.PI / 2 + rnd(-.25, .25); L = H * rnd(.18, .26); prof = 5;
    }
    (function rama(x, y, a, l, n, s, w) {
      var x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l, choca = false;
      // recorte contra el terreno
      for (var k = 1; k <= 12; k++) { var px = x + (x1 - x) * k / 12, py = y + (y1 - y) * k / 12; if (py > suelo(px) + (tipo === 'tau' ? 22 : 0)) { x1 = px; y1 = py; choca = true; break; } }
      var len = Math.hypot(x1 - x, y1 - y);
      c.tramos.push({ x0: x, y0: y, x1: x1, y1: y1, s0: s, len: len, w: w, a: tipo === 'tau' ? .9 : .5 });
      if (choca || n <= 0) return;
      var abre = tipo === 'tau' ? rnd(.05, .13) : rnd(.08, .2);
      rama(x1, y1, a - abre, l * rnd(.68, .86), n - 1, s + len, w * .78);
      rama(x1, y1, a + abre, l * rnd(.68, .86), n - 1, s + len, w * .78);
    })(x0, y0, ang, L, prof, 0, tipo === 'tau' ? 1.5 : 1);
    c.fin = 0; c.tramos.forEach(function (q) { q.len = q.len || Math.hypot(q.x1 - q.x0, q.y1 - q.y0); c.fin = Math.max(c.fin, q.s0 + q.len); });
    cascadas.push(c);
  }

  function dibujaCielo(ts) {
    var t = ts / 1000;
    pmx += (mx - pmx) * .05; pmy += (my - pmy) * .05;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(capaE, Math.round((-20 - pmx * 14) * DPR), Math.round((-20 - pmy * 10) * DPR));
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // estrellas que titilan
    for (var i = 0; i < brillantes.length; i++) {
      var b = brillantes[i], k = .5 + .5 * Math.sin(t * b.f + b.p);
      cx.globalAlpha = .25 + .75 * k * k;
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(b.x - pmx * 14, b.y - pmy * 10, b.r, 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;

    // nuevas cascadas
    if (t > tSig.tau) { nuevaCascada('tau'); tSig.tau = t + rnd(3.8, 5.6); }
    if (t > tSig.rc) { nuevaCascada('rc'); tSig.rc = t + rnd(1.2, 2.4); }

    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.drawImage(capaM, 0, 0);
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.globalCompositeOperation = 'lighter';
    for (i = cascadas.length - 1; i >= 0; i--) {
      var c = cascadas[i], e = (t - c.t0) * c.v, estela = c.tipo === 'tau' ? W * .14 : H * .22;
      if (e - estela > c.fin) { cascadas.splice(i, 1); continue; }
      var col = c.tipo === 'tau' ? '240,90,160' : '158,219,238';
      for (var j = 0; j < c.tramos.length; j++) {
        var q = c.tramos[j];
        var a0 = cl((e - estela - q.s0) / q.len, 0, 1), a1 = cl((e - q.s0) / q.len, 0, 1);
        if (a1 <= 0 || a0 >= 1) continue;
        var xa = q.x0 + (q.x1 - q.x0) * a0, ya = q.y0 + (q.y1 - q.y0) * a0, xb = q.x0 + (q.x1 - q.x0) * a1, yb = q.y0 + (q.y1 - q.y0) * a1;
        var g = cx.createLinearGradient(xa, ya, xb, yb);
        g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + (q.tau ? '255,235,245' : col) + ',' + q.a + ')');
        cx.strokeStyle = g; cx.lineWidth = q.w; cx.beginPath(); cx.moveTo(xa, ya); cx.lineTo(xb, yb); cx.stroke();
      }
      // el frente toca la ladera: se encienden los tanques cercanos al eje (densidad que cae con la distancia)
      if (c.tipo === 'tau' && !c.golpe && e > c.fin * .93) {
        c.golpe = true;
        for (j = 0; j < tanques.length; j++) { var dx = Math.abs(tanques[j].x - c.blanco) / (W * .07); if (dx < 1) tanques[j].luz = Math.max(tanques[j].luz, Math.pow(1 - dx, 1.4)); }
        c.anillo = t;
      }
      if (c.anillo) {
        var u = (t - c.anillo) / 1.6;
        if (u < 1) { cx.strokeStyle = 'rgba(240,90,160,' + (.5 * (1 - u)) + ')'; cx.lineWidth = 1; cx.beginPath(); cx.ellipse(c.blanco, suelo(c.blanco) + 22, W * .07 * (.3 + u), 9 * (.3 + u), -.18, 0, 7); cx.stroke(); }
      }
    }
    cx.globalCompositeOperation = 'source-over';
    // tanques encendidos
    for (i = 0; i < tanques.length; i++) {
      var tq = tanques[i]; if (tq.luz < .01) continue;
      cx.fillStyle = 'rgba(240,90,160,' + (.25 * tq.luz) + ')'; cx.beginPath(); cx.arc(tq.x, tq.y, 7 * tq.luz + 2, 0, 7); cx.fill();
      cx.fillStyle = 'rgba(255,220,236,' + tq.luz + ')'; cx.beginPath(); cx.arc(tq.x, tq.y, 1.8, 0, 7); cx.fill();
      tq.luz *= .985;
    }
  }

  /* ───────────── espectro de Planck */
  var H_ = 6.62607015e-34, K_ = 1.380649e-23, C_ = 2.99792458e8, A_ = 7.5657e-16, WIEN_NU = 5.878925757e10, WIEN_L = 2.897771955e-3;
  var pc = d.getElementById('ftPlanck'), px = pc.getContext('2d'), rT = d.getElementById('ftTemp');
  var Tobj = +rT.value, Tvis = Tobj, pW = 0, pH = 0, hoverNu = null, entra = 0;
  function rho(nu, T) { var x = H_ * nu / (K_ * T); return 8 * Math.PI * H_ * nu * nu * nu / (C_ * C_ * C_) / (Math.exp(x) - 1); }
  function rj(nu, T) { return 8 * Math.PI * nu * nu * K_ * T / (C_ * C_ * C_); }
  // color aproximado de una frecuencia visible (400–790 THz)
  function colorNu(thz) {
    var l = 299792.458 / thz, r = 0, g = 0, b = 0;
    if (l >= 380 && l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; } else if (l < 510) { g = 1; b = (510 - l) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; } else if (l < 645) { r = 1; g = (645 - l) / 65; } else if (l <= 780) { r = 1; }
    return [r * 255 | 0, g * 255 | 0, b * 255 | 0];
  }
  function tamPlanck() { var r = pc.getBoundingClientRect(); pW = r.width; pH = r.height; pc.width = Math.round(pW * DPR); pc.height = Math.round(pH * DPR); }
  var NU_MAX = 1500e12;
  function dibujaPlanck() {
    var c = px, T = Tvis; c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, pW, pH);
    var L = 38, R = 10, Tp = 16, B = 30, w = pW - L - R, h = pH - Tp - B;
    var pico = rho(WIEN_NU * T, T), ymax = pico * 1.18;
    function X(nu) { return L + nu / NU_MAX * w; } function Y(v) { return Tp + h - v / ymax * h; }
    // banda visible
    for (var f = 400; f < 790; f += 3) { var k = colorNu(f); c.fillStyle = 'rgba(' + k + ',.07)'; c.fillRect(X(f * 1e12), Tp, w * 3e12 / NU_MAX + .5, h); c.fillStyle = 'rgba(' + k + ',.9)'; c.fillRect(X(f * 1e12), Tp + h + 3, w * 3e12 / NU_MAX + .5, 3); }
    // ejes y marcas
    c.strokeStyle = 'rgba(236,230,222,.16)'; c.lineWidth = 1; c.beginPath(); c.moveTo(L, Tp); c.lineTo(L, Tp + h); c.lineTo(L + w, Tp + h); c.stroke();
    c.font = '400 9.5px "Space Mono", monospace'; c.fillStyle = 'rgba(236,230,222,.42)'; c.textAlign = 'center';
    for (var m = 0; m <= 1500; m += 250) { c.textAlign = m === 1500 ? 'right' : 'center'; c.fillText(m, X(m * 1e12), Tp + h + 19); c.fillStyle = 'rgba(236,230,222,.06)'; if (m) c.fillRect(X(m * 1e12), Tp, 1, h); c.fillStyle = 'rgba(236,230,222,.42)'; }
    c.textAlign = 'right'; c.fillText('ν (THz)', L + w, Tp + h - 6);
    c.save(); c.translate(12, Tp + h / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText('ρ(ν, T)', 0, 0); c.restore();
    var lim = cl(entra, 0, 1), nFin = NU_MAX * lim;
    // Rayleigh–Jeans: crece sin límite (la catástrofe ultravioleta)
    c.setLineDash([5, 4]); c.strokeStyle = 'rgba(158,219,238,.85)'; c.lineWidth = 1.5; c.beginPath();
    for (var nu = 1e12; nu <= nFin; nu += 6e12) { var y = Y(rj(nu, T)); if (y < Tp - 4) { c.lineTo(X(nu), Tp - 4); break; } c[nu === 1e12 ? 'moveTo' : 'lineTo'](X(nu), y); }
    c.stroke(); c.setLineDash([]);
    // Planck con relleno de color por frecuencia
    var gr = c.createLinearGradient(X(0), 0, X(NU_MAX), 0);
    for (f = 0; f <= 1500; f += 50) { var kk = f < 400 ? [170, 40, 60] : f > 790 ? [120, 90, 220] : colorNu(f); gr.addColorStop(f / 1500, 'rgba(' + kk + ',.30)'); }
    c.beginPath(); c.moveTo(X(0), Y(0));
    for (nu = 1e12; nu <= nFin; nu += 4e12) c.lineTo(X(nu), Y(rho(nu, T)));
    c.lineTo(X(nFin), Y(0)); c.closePath(); c.fillStyle = gr; c.fill();
    c.beginPath(); for (nu = 1e12; nu <= nFin; nu += 4e12) c[nu === 1e12 ? 'moveTo' : 'lineTo'](X(nu), Y(rho(nu, T)));
    c.strokeStyle = '#FFE3EF'; c.lineWidth = 2; c.shadowColor = 'rgba(240,122,174,.9)'; c.shadowBlur = 10; c.stroke(); c.shadowBlur = 0;
    // pico de Wien
    var nP = WIEN_NU * T;
    if (nP <= nFin) {
      c.strokeStyle = 'rgba(255,227,239,.35)'; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(X(nP), Y(pico)); c.lineTo(X(nP), Tp + h); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#05070D'; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(X(nP), Y(pico), 4, 0, 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,240,246,.85)'; c.textAlign = nP > NU_MAX * .7 ? 'right' : 'left'; c.font = 'italic 500 14px "Cormorant Garamond", serif';
      c.fillText('Wien', X(nP) + (nP > NU_MAX * .7 ? -9 : 9), Y(pico) - 6);
    }
    // lectura bajo el cursor
    if (hoverNu) {
      var hv = rho(hoverNu, T), hr = rj(hoverNu, T);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(X(hoverNu), Tp); c.lineTo(X(hoverNu), Tp + h); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(X(hoverNu), Y(hv), 3, 0, 7); c.fill();
      var txt = Math.round(hoverNu / 1e12) + ' THz · λ ' + Math.round(C_ / hoverNu * 1e9) + ' nm · clásica ×' + (hr / hv < 100 ? fmt(hr / hv, 1) : cient(hr / hv));
      c.font = '400 10px "Space Mono", monospace'; var tw = c.measureText(txt).width + 14, bx = cl(X(hoverNu) - tw / 2, L, L + w - tw);
      c.fillStyle = 'rgba(10,9,16,.88)'; c.fillRect(bx, Tp + 2, tw, 20); c.fillStyle = '#F7EFE4'; c.textAlign = 'left'; c.fillText(txt, bx + 7, Tp + 16);
    }
  }
  function lecturas(T) {
    d.getElementById('ftT').textContent = miles(T) + ' K';
    d.getElementById('ftNu').textContent = Math.round(WIEN_NU * T / 1e12) + ' THz';
    d.getElementById('ftLa').textContent = Math.round(WIEN_L / T * 1e9) + ' nm';
    var u = A_ * Math.pow(T, 4); d.getElementById('ftU').textContent = (u < 10 ? fmt(u, 2) : fmt(u, 1)) + ' J/m³';
  }
  rT.addEventListener('input', function () { Tobj = +rT.value; lecturas(Tobj); marcarPres(); });
  var pres = d.querySelectorAll('.ft-pres button');
  function marcarPres() { pres.forEach(function (b) { b.classList.toggle('on', +b.dataset.t === Tobj); }); }
  pres.forEach(function (b) { b.addEventListener('click', function () { Tobj = +b.dataset.t; rT.value = Tobj; lecturas(Tobj); marcarPres(); }); });
  pc.addEventListener('pointermove', function (ev) { var r = pc.getBoundingClientRect(), x = ev.clientX - r.left; hoverNu = x > 38 && x < r.width - 10 ? (x - 38) / (r.width - 48) * NU_MAX : null; });
  pc.addEventListener('pointerleave', function () { hoverNu = null; });

  /* ───────────── cascada de Heitler */
  var X0 = 36.7, EC = 87e6;
  var hc = d.getElementById('ftHeitler'), hx = hc.getContext('2d'), rE = d.getElementById('ftE');
  var hW = 0, hH = 0, capaH = null, nodos = [], chispas = [], gen = 0, NIV = 7;
  function tamHeitler() { var col = d.querySelector('.ft-lab-txt'); hc.style.height = innerWidth > 900 ? Math.max(380, col.offsetHeight) + 'px' : ''; var r = hc.getBoundingClientRect(); hW = r.width; hH = r.height; hc.width = Math.round(hW * DPR); hc.height = Math.round(hH * DPR); armarHeitler(); }
  function armarHeitler() {
    var E = Math.pow(10, +rE.value), N = E / EC; gen = Math.max(0, Math.log2(N));
    d.getElementById('hE').textContent = E >= 1e15 ? fmt(E / 1e15, E < 1e16 ? 1 : 0) + ' PeV' : E >= 1e12 ? fmt(E / 1e12, E < 1e13 ? 1 : 0) + ' TeV' : fmt(E / 1e9, 0) + ' GeV';
    d.getElementById('hG').textContent = fmt(gen, 1);
    d.getElementById('hN').textContent = N < 1e4 ? miles(N) : cient(N);
    d.getElementById('hX').textContent = Math.round(X0 * Math.log(N)) + ' g/cm²';
    if (!hW) return;
    capaH = d.createElement('canvas'); capaH.width = hc.width; capaH.height = hc.height;
    var c = capaH.getContext('2d'); c.scale(DPR, DPR);
    var niv = Math.min(NIV, Math.floor(gen)), top = 34, bajo = hH - 46, paso = (bajo - top) / (NIV + 1.4);
    nodos = [[{ x: hW * .56, y: top }]];
    for (var i = 1; i <= niv; i++) {
      var fila = [], ant = nodos[i - 1], ancho = hW * .72, n = Math.pow(2, i);
      for (var j = 0; j < n; j++) fila.push({ x: hW * .56 - ancho / 2 + ancho * (j + .5) / n, y: top + paso * i });
      nodos.push(fila);
    }
    // guías de profundidad: cada fila es una longitud de división X₀ ln2
    c.font = '400 9px "Space Mono", monospace'; c.textAlign = 'left';
    for (i = 0; i <= niv; i++) {
      var y = top + paso * i; c.fillStyle = 'rgba(236,230,222,.05)'; c.fillRect(12, y, hW - 24, 1);
      c.fillStyle = 'rgba(236,230,222,.38)'; c.fillText(i ? 'n=' + i + ' · ' + Math.round(i * X0 * Math.LN2) + ' g/cm²' : 'E₀', 14, y - 4);
    }
    // ramas: azul (energía alta) → frambuesa (cerca de E_c)
    for (i = 1; i <= niv; i++) {
      var u = i / Math.max(gen, 1), col = 'rgba(' + Math.round(158 + (240 - 158) * u) + ',' + Math.round(219 + (90 - 219) * u) + ',' + Math.round(238 + (160 - 238) * u) + ',';
      for (j = 0; j < nodos[i].length; j++) {
        var p = nodos[i - 1][j >> 1], q = nodos[i][j];
        c.strokeStyle = col + (.75 - i * .045) + ')'; c.lineWidth = Math.max(.5, 1.8 - i * .17); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke();
      }
    }
    // nube de las generaciones que no caben, hasta el máximo
    if (gen > niv) {
      var yN = top + paso * niv, yM = bajo, dens = Math.min(1600, 60 * (gen - niv) + 120);
      for (i = 0; i < dens; i++) {
        var a = Math.random(), yy = yN + (yM - yN) * Math.sqrt(a), sp = hW * .36 * (.75 + .25 * Math.sqrt(a));
        c.fillStyle = 'rgba(240,' + (90 + 100 * (1 - a) | 0) + ',170,' + rnd(.15, .6) + ')'; c.fillRect(hW * .56 + (Math.random() * 2 - 1) * sp, yy, 1.2, 1.2);
      }
      c.fillStyle = 'rgba(236,230,222,.5)'; c.textAlign = 'center'; c.font = 'italic 500 14px "Cormorant Garamond", serif';
      c.fillText('… ' + fmt(gen - niv, 1) + ' generaciones más', hW * .56, yN + (yM - yN) * .45);
    }
    // máximo de la cascada
    var yX = gen > niv ? bajo : top + paso * niv + 18;
    c.strokeStyle = 'rgba(240,122,174,.8)'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(14, yX + 10); c.lineTo(hW - 14, yX + 10); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#F7C6DC'; c.textAlign = 'right'; c.font = '700 9.5px "Space Mono", monospace';
    c.fillText('X_máx = ' + Math.round(X0 * Math.log(Math.max(N, 1))) + ' g/cm² · E por partícula = E_c', hW - 14, yX + 26);
    chispas = [];
  }
  rE.addEventListener('input', armarHeitler);
  function dibujaHeitler(t) {
    if (!capaH) return;
    var c = hx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, hc.width, hc.height); c.drawImage(capaH, 0, 0); c.setTransform(DPR, 0, 0, DPR, 0, 0);
    var niv = nodos.length - 1; if (niv < 1) return;
    // chispas que bajan por el árbol y se duplican en cada nodo
    if (chispas.length < 90 && Math.random() < .06) { chispas.push({ i: 1, j: 0, s: 0 }); chispas.push({ i: 1, j: 1, s: 0 }); }
    c.globalCompositeOperation = 'lighter';
    for (var k = chispas.length - 1; k >= 0; k--) {
      var s = chispas[k]; s.s += .028;
      if (s.s >= 1) {
        if (s.i >= niv) { chispas.splice(k, 1); continue; }
        if (chispas.length < 200) chispas.push({ i: s.i + 1, j: s.j * 2 + 1, s: 0 });
        s.i++; s.j *= 2; s.s = 0;
      }
      var p = nodos[s.i - 1][s.j >> 1], q = nodos[s.i][s.j];
      var x = p.x + (q.x - p.x) * s.s, y = p.y + (q.y - p.y) * s.s;
      var g = c.createRadialGradient(x, y, 0, x, y, 6); g.addColorStop(0, 'rgba(255,240,248,.95)'); g.addColorStop(1, 'rgba(240,90,160,0)');
      c.fillStyle = g; c.fillRect(x - 6, y - 6, 12, 12);
    }
    c.globalCompositeOperation = 'source-over';
  }

  /* ───────────── bucle */
  var visPlanck = false, visHeitler = false;
  function cuadro(ts) {
    dibujaCielo(ts);
    if (visPlanck) { Tvis += (Tobj - Tvis) * .14; if (entra < 1) entra += .018; dibujaPlanck(); }
    if (visHeitler) dibujaHeitler(ts);
    requestAnimationFrame(cuadro);
  }

  /* ───────────── efectos de la página */
  var luz = d.querySelector('.ft-luz');
  addEventListener('pointermove', function (ev) {
    mx = ev.clientX / innerWidth - .5; my = ev.clientY / innerHeight - .5;
    luz.style.transform = 'translate3d(' + ev.clientX + 'px,' + ev.clientY + 'px,0)';
  }, { passive: true });
  d.querySelectorAll('.ft-panel').forEach(function (p) {
    p.addEventListener('pointermove', function (ev) { var r = p.getBoundingClientRect(); p.style.setProperty('--mx', (ev.clientX - r.left) + 'px'); p.style.setProperty('--my', (ev.clientY - r.top) + 'px'); });
  });
  // inclinación leve del panel de la clase
  d.querySelectorAll('[data-inclina]').forEach(function (p) {
    if (quieto) return;
    p.addEventListener('pointermove', function (ev) { var r = p.getBoundingClientRect(), u = (ev.clientX - r.left) / r.width - .5, v = (ev.clientY - r.top) / r.height - .5; p.style.transform = 'perspective(1400px) rotateY(' + (u * 2.4) + 'deg) rotateX(' + (-v * 2.4) + 'deg)'; });
    p.addEventListener('pointerleave', function () { p.style.transform = ''; });
  });
  // botones con imán
  d.querySelectorAll('[data-iman]').forEach(function (b) {
    if (quieto) return;
    b.addEventListener('pointermove', function (ev) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((ev.clientX - r.left - r.width / 2) * .18) + 'px,' + ((ev.clientY - r.top - r.height / 2) * .28) + 'px)'; });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });
  // aparición al bajar y lienzos que solo se dibujan cuando se ven
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ver'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
  d.querySelectorAll('.ft-ap').forEach(function (n) { io.observe(n); });
  new IntersectionObserver(function (es) { visPlanck = es[0].isIntersecting; }).observe(pc);
  new IntersectionObserver(function (es) { visHeitler = es[0].isIntersecting; }).observe(hc);
  // hilo del programa
  var prog = d.querySelector('.ft-prog'), unidades = d.querySelectorAll('.ft-u');
  function hilo() {
    var r = prog.getBoundingClientRect(), p = cl((innerHeight * .6 - r.top) / r.height, 0, 1);
    prog.style.setProperty('--p', p.toFixed(4));
    unidades.forEach(function (u) { var ru = u.getBoundingClientRect(); u.classList.toggle('vivo', ru.top + 14 < innerHeight * .6); });
  }
  addEventListener('scroll', hilo, { passive: true });

  // visor del PDF
  var visor = d.querySelector('.ft-visor'), ifr = visor.querySelector('iframe');
  d.querySelectorAll('[data-abrir]').forEach(function (b) { b.addEventListener('click', function () { if (!ifr.src) ifr.src = b.dataset.abrir; visor.classList.add('abierto'); }); });
  function cerrar() { visor.classList.remove('abierto'); }
  visor.addEventListener('click', function (ev) { if (ev.target === visor || ev.target.closest('[data-cerrar]')) cerrar(); });
  addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrar(); });

  /* ───────────── arranque */
  var esperaR = null;
  addEventListener('resize', function () { clearTimeout(esperaR); esperaR = setTimeout(function () { armarCielo(); tamPlanck(); tamHeitler(); hilo(); }, 150); });
  armarCielo(); tamPlanck(); tamHeitler(); lecturas(Tobj); hilo();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { armarHeitler(); });
  requestAnimationFrame(cuadro);
  function armar() { raiz.classList.add('ft-armado'); }
  if (quieto) armar(); else if (window.fxRevelado) window.fxRevelado.then(armar); else armar();
  addEventListener('pageshow', function (e) { if (e.persisted) armar(); });
})();
