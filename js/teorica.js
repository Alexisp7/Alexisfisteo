// IV · Física teórica — de un rayo cósmico a la cascada que mide TAMBO (valle del Colca, Perú).
// Una sola escena en bucle (~13 s), como la del agujero negro o la de Stern–Gerlach; las explicaciones
// aparecen al pasar el mouse por zonas fijas.
//  · Fuente lejana (medallón, no a escala): p + γ → Δ⁺ → n + π⁺; π⁺ → μ⁺ ν_μ, μ⁺ → e⁺ ν_e ν̄_μ.
//    Cada neutrino ≈ 5 % de la energía del protón. Sabores 1 : 2 : 0 en la fuente → ≈ 1 : 1 : 1 al llegar.
//  · Un ν_τ de 10 PeV entra casi horizontal en la montaña; corriente cargada ν_τ + N → τ⁻ + X, con
//    ≈ 80 % de la energía para el τ.
//  · El τ sale al aire del valle y se desintegra tras γcτ ≈ 49 m × E/PeV (≈ 390 m a 8 PeV).
//  · La desintegración inicia una cascada (perfil de Greisen; aire a ~3 km, ρ ≈ 0,91 kg/m³) que cruza
//    el valle a c y llega a la ladera de enfrente, a unidades de detección en una malla triangular de
//    150 m (diseño nominal 2025). Señal: densidad lateral NKG; tiempo: frente plano perpendicular al eje.
// Datos de TAMBO: Argüelles et al., arXiv:2507.08070 (2025) y Thompson, ICRC 2023, arXiv:2308.09753.
// Fondo fijo pintado una vez en un lienzo aparte; cada cuadro solo dibuja lo que se mueve (sin filtros).
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function f(v) { return Math.round(v * 10) / 10; }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function suave(x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); }
  function semilla(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function trozos(str) { return str.split(/(_\{[^}]*\}|_.)/).filter(Boolean).map(function (q) { return q[0] === '_' && q.length > 1 ? [q[1] === '{' ? q.slice(2, -1) : q.slice(1), true] : [q, false]; }); }
  function rico(nodo, str) { trozos(str).forEach(function (q) { if (q[1]) { var s = el('tspan', { 'baseline-shift': 'sub', 'font-size': '72%' }, nodo); s.textContent = q[0]; } else nodo.appendChild(document.createTextNode(q[0])); }); }
  function coma(x, d) { return x.toFixed(d).replace('.', ',').replace('-', '−'); }
  function sup(n) { return String(n).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }); }
  function cient(x) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); if (m >= 9.95) { m /= 10; e++; } return coma(m, 1) + ' × 10' + sup(e); }
  function gamma(z) {   // Lanczos (g = 7)
    var g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < .5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1; var x = g[0]; for (var i = 1; i < 9; i++) x += g[i] / (z + i);
    var t = z + 7.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + .5) * Math.exp(-t) * x;
  }
  function esfera(c0, c1, c2, borde) {
    var S = 64, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), g = x.createRadialGradient(S * .36, S * .32, S * .04, S * .5, S * .5, S * .5);
    g.addColorStop(0, c0); g.addColorStop(.55, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, 2 * Math.PI); x.fill();
    x.lineWidth = 2; x.strokeStyle = borde; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(S * .37, S * .31, S * .11, S * .07, -.6, 0, 2 * Math.PI); x.fill();
    return c;
  }

  // ── física (km, µs, eV) ──
  var C_KM = .299792458, M_TAU = 1.77686e9, CTAU = 87.03e-9;
  var E_NU = 1e16, Y_CC = .2, E_TAU = E_NU * (1 - Y_CC);
  var L_TAU = E_TAU / M_TAU * CTAU;                       // ≈ 0,39 km
  var RHO = .909e-3, X0 = 36.7, EC = 87e6, E_CAS = .5 * E_TAU;
  var BETA = Math.log(E_CAS / EC), R_M = 9.6 / RHO / 1e5, X_MAX = X0 * BETA;
  function greisen(Xg) { var t = Xg / X0; if (t <= .05) return 1; var s = 3 * t / (t + 2 * BETA); return .31 / Math.sqrt(BETA) * Math.exp(t * (1 - 1.5 * Math.log(s))); }

  // ── el valle: perfil transversal extruido a lo largo del valle (z) ──
  function base(x) {
    if (x < -.4) { var u = cl((-.4 - x) / 3.1, 0, 1); return 1.6 * (1 - Math.cos(Math.PI * u)) / 2 + (x < -3.5 ? .08 * Math.sin((x + 3.5) * 1.7) : 0); }
    if (x > .5) { var v = cl((x - .5) / 3.2, 0, 1); return 1.75 * (1 - Math.cos(Math.PI * v)) / 2 + (x > 3.5 ? .12 * Math.sin((x - 3.5) * 1.3) : 0); }
    return 0;
  }
  function alto(x, z) { var b = base(x); return b + (b > .02 ? .035 * Math.sin(3.1 * x + 1.3 * z) + .02 * Math.sin(7.3 * x - 2 * z + .7) : 0); }
  function pend(x) { return (base(x + .005) - base(x - .005)) / .01; }

  window.escenaTeorica = function (svg, salida) {
    var fig = svg.parentNode, raiz = fig.closest('.mc');
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lienzo = document.createElement('canvas'); lienzo.className = 'rc-lienzo'; fig.insertBefore(lienzo, svg);
    var ctx = lienzo.getContext('2d');
    var fondo = document.createElement('canvas'), fctx = fondo.getContext('2d'), claveFondo = '';
    var capaZ = el('g', { 'class': 'rc-zonas' }, svg), capa = el('g', { 'class': 'rc-notas' }, svg);
    var SPR = { p: esfera('#E08A76', '#A8402F', '#5A1E16', 'rgba(40,14,10,.7)'), n: esfera('#FFFDF8', '#EDE3CF', '#B3A285', 'rgba(30,26,22,.55)'),
      pi: esfera('#D6C4F2', '#8A66C4', '#46307A', 'rgba(30,20,50,.6)'), mu: esfera('#C4E0EC', '#5A8EA8', '#28495A', 'rgba(20,30,40,.6)') };

    // ── cámara fija, oblicua: x a lo ancho, y arriba, z hacia el fondo del valle ──
    var KZ = .12, KY = .42, CAM = { cx: 1030, cy: 640, s: 100 }, BX0 = -4.4, BX1 = 5, Z0 = -1, Z1 = 3.6;
    function P(x, y, z) { return [CAM.cx + CAM.s * (x + KZ * z), CAM.cy - CAM.s * (y + KY * z)]; }
    function Ps(p) { return P(p[0], p[1], p[2]); }

    // ── trayectoria ──
    var DIR = (function () { var d = [-1, .1, .2], l = Math.hypot(d[0], d[1], d[2]); return [d[0] / l, d[1] / l, d[2] / l]; })();
    function sobre(p, s) { return [p[0] + DIR[0] * s, p[1] + DIR[1] * s, p[2] + DIR[2] * s]; }
    var VTX = [2.45, .4, -.78], CARA, DEC, IMP, L_ROCA, L_CRUCE;
    (function () {
      var s = 0; while (alto(sobre(VTX, s)[0], sobre(VTX, s)[2]) > sobre(VTX, s)[1] && s < 3) s += .002;
      CARA = sobre(VTX, s); L_ROCA = s; DEC = sobre(CARA, L_TAU);
      var q = 0; while (q < 8) { var p = sobre(DEC, q); if (p[0] < 0 && alto(p[0], p[2]) > p[1]) break; q += .002; }
      IMP = sobre(DEC, q); L_CRUCE = q;
    })();
    var X_IMP = L_CRUCE * 1e5 * RHO, N_IMP = greisen(X_IMP);
    var NU0 = sobre(VTX, -5.2);

    // ── malla de detección: triangular de 150 m sobre la ladera izquierda ──
    var DET = [], PASO = .15, FILA = PASO * Math.sqrt(3) / 2;
    (function () {
      for (var j = 0, z = Z0 + .08; z < Z1 - .1; z += FILA, j++) {
        var x = -.55 - (j % 2 ? PASO / 2 : 0);
        while (x > -3.4) { DET.push({ x: x, y: alto(x, z), z: z, t: Infinity, n: 0 }); x -= PASO / Math.sqrt(1 + pend(x) * pend(x)); }
      }
      var sA = X_IMP / X0, edad = 3 * sA / (sA + 2 * BETA), CN = gamma(4.5 - edad) / (2 * Math.PI * gamma(edad) * gamma(4.5 - 2 * edad)), A_UNI = 4;
      DET.forEach(function (d) {
        var v = [d.x - DEC[0], d.y - DEC[1], d.z - DEC[2]], a = v[0] * DIR[0] + v[1] * DIR[1] + v[2] * DIR[2];
        var r = Math.sqrt(Math.max(0, v[0] * v[0] + v[1] * v[1] + v[2] * v[2] - a * a)), u = Math.max(r, .004) / R_M;
        var rho = N_IMP / (R_M * R_M * 1e6) * CN * Math.pow(u, edad - 2) * Math.pow(1 + u, edad - 4.5);   // e±/m² (NKG)
        var nE = rho * A_UNI * 6;   // e± y fotones (γ/e± ≈ 5) en ~4 m²
        if (nE >= 1) { d.t = a / C_KM; d.n = nE; }
      });
    })();
    var VIVOS = DET.filter(function (d) { return d.n > 0; }).sort(function (a, b) { return a.t - b.t; });
    var T0H = VIVOS.length ? VIVOS[0].t : 0, T1H = VIVOS.length ? VIVOS[VIVOS.length - 1].t : 1;

    // ── cascada: rayos rectos que nacen a lo largo del eje ──
    var RAY = [], rnd = semilla(7);
    var E1 = (function () { var a = [DIR[1], -DIR[0], 0], l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; })();
    var E2 = [DIR[1] * E1[2] - DIR[2] * E1[1], DIR[2] * E1[0] - DIR[0] * E1[2], DIR[0] * E1[1] - DIR[1] * E1[0]];
    for (var i = 0; i < 760; i++) {
      var sb = L_CRUCE * Math.pow(rnd(), 1.7) * .8, ph = rnd() * 2 * Math.PI;
      var rf = R_M * 1.25 * Math.sqrt(-2 * Math.log(rnd() + 1e-6)) * .55;
      RAY.push({ sb: sb, c: Math.cos(ph), s: Math.sin(ph), th: rf / Math.max(.4, L_CRUCE - sb), a: rnd(), tr: .35 + rnd() * .9, oro: rnd() < .06 });
    }
    function puntoRayo(R, s) {
      var l = (s - R.sb) * R.th, p = sobre(DEC, s);
      return [p[0] + l * (R.c * E1[0] + R.s * E2[0]), p[1] + l * (R.c * E1[1] + R.s * E2[1]), p[2] + l * (R.c * E1[2] + R.s * E2[2])];
    }
    RAY.forEach(function (R) { var s = R.sb; while (s < L_CRUCE * 1.15) { var q = puntoRayo(R, s); if (q[0] < 0 && alto(q[0], q[2]) > q[1]) break; s += .01; } R.fin = s; });

    // ── el bucle (s) ──
    var T_VTX = 1.5, T_CARA = 2.2, T_DEC = 3.3, T_LLEGA = 7.4, T_H0 = 7.5, T_H1 = 9, T_REC = 9.3, T_FUN = 11.7, LOOP = 13;
    var T_SRC = 9.4;   // en el medallón: el choque p + γ; su ν sale y llega al borde al cerrar el bucle
    function frente(t) { if (t < T_DEC) return 0; var u = cl((t - T_DEC) / (T_LLEGA - T_DEC), 0, 1); return L_CRUCE * (.3 * u + .7 * u * u); }
    function tHit(d) { return T_H0 + (T_H1 - T_H0) * (T1H > T0H ? (d.t - T0H) / (T1H - T0H) : 0); }
    function microS(t) {
      if (t < T_CARA) return null;
      if (t < T_DEC) return L_TAU * suave((t - T_CARA) / (T_DEC - T_CARA)) / C_KM;
      if (t < T_LLEGA) return (L_TAU + frente(t)) / C_KM;
      return L_TAU / C_KM + T0H + (T1H - T0H) * cl((t - T_H0) / (T_H1 - T_H0), 0, 1);
    }

    // ── medallón de la fuente (arriba a la derecha) ──
    var MED = { x: 1262, y: 238, r: 92 };

    // ── zonas al pasar el mouse y su ficha ──
    var foco = null, fichas = {};
    var FX = 712, FY = 98, FW = 338;
    function ficha(id, o) {
      var g = el('g', { 'class': 'rc-ficha' }, capa);
      var guia = el('path', { 'class': 'rc-guia', pathLength: 1 }, g);
      var pt = el('circle', { 'class': 'rc-pt', r: 2.4 }, g), aro = el('circle', { 'class': 'rc-aro', r: 2.4 }, g);
      var hDib = o.dib ? o.dibH : 0, lineas = o.d, alto2 = 64 + hDib + lineas.length * 17.5 + 12;
      el('rect', { 'class': 'rc-fondo', x: FX, y: FY, width: FW, height: f(alto2), rx: 2 }, g);
      var k = el('text', { 'class': 'rc-k', x: FX + 16, y: FY + 22 }, g); k.textContent = o.k;
      el('line', { 'class': 'rc-regla', x1: FX + 16, y1: FY + 30, x2: FX + FW - 16, y2: FY + 30 }, g);
      var t = el('text', { 'class': 'rc-tit', x: FX + 16, y: FY + 54 }, g); rico(t, o.tit);
      if (o.dib) o.dib(el('g', { 'class': 'rc-dib' }, g), FX + 16, FY + 66, FW - 32, hDib - 8);
      var d = el('text', { 'class': 'rc-d', x: FX + 16, y: FY + 80 + hDib }, g);
      lineas.forEach(function (l, j) { var s = el('tspan', { x: FX + 16, dy: j ? 17.5 : 0 }, d); rico(s, l); });
      var n = { g: g, ancla: o.ancla, ver: false, abajo: FY + alto2 };
      n.pon = function (v) {
        if (v === n.ver) return; n.ver = v; g.classList.toggle('ver', v);
        if (v) {
          var a = n.ancla, xR = FX + FW, yG = FY + 40, dd;
          if (a[0] > xR + 14) dd = 'M' + f(a[0]) + ' ' + f(a[1] - 4) + ' L' + f(a[0]) + ' ' + f(yG) + ' L' + f(xR) + ' ' + f(yG);
          else dd = 'M' + f(a[0]) + ' ' + f(a[1] - 4) + ' L' + f(a[0]) + ' ' + f(n.abajo);
          guia.setAttribute('d', dd); pt.setAttribute('cx', f(a[0])); pt.setAttribute('cy', f(a[1])); aro.setAttribute('cx', f(a[0])); aro.setAttribute('cy', f(a[1]));
        }
      };
      fichas[id] = n; return n;
    }
    function zona(id, dPath) {
      var z = el('path', { 'class': 'rc-zona', d: dPath }, capaZ);
      z.addEventListener('pointerenter', function () { foco = id; z.classList.add('foco'); fichas[id].pon(true); svg.classList.add('rc-on'); });
      z.addEventListener('pointerleave', function () { if (foco === id) foco = null; z.classList.remove('foco'); fichas[id].pon(false); svg.classList.remove('rc-on'); });
      return z;
    }
    function circulo(x, y, r) { return 'M' + f(x - r) + ' ' + f(y) + ' a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(2 * r) + ' 0 a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(-2 * r) + ' 0Z'; }
    function capsula(a, b, r) {
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * r, ny = dx / l * r;
      return 'M' + f(a[0] + nx) + ' ' + f(a[1] + ny) + ' L' + f(b[0] + nx) + ' ' + f(b[1] + ny) + ' A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(b[0] - nx) + ' ' + f(b[1] - ny) + ' L' + f(a[0] - nx) + ' ' + f(a[1] - ny) + ' A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(a[0] + nx) + ' ' + f(a[1] + ny) + 'Z';
    }
    function poli(pts) { return 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L') + 'Z'; }
    function paleta(k) {
      var A = [[246, 214, 140], [236, 150, 80], [214, 82, 96], [150, 100, 220]], x = cl(k, 0, 1) * (A.length - 1), i = Math.min(A.length - 2, Math.floor(x)), w = x - i;
      return [0, 1, 2].map(function (c) { return Math.round(A[i][c] + (A[i + 1][c] - A[i][c]) * w); }).join(',');
    }

    // dibujitos de las fichas (SVG)
    function dibSabores(g, x, y, w, h) {
      var R = [[1, 2, 0], [1, 1, 1]], nom = ['e', 'μ', 'τ'], cols = ['#C9A27A', '#6F8FB0', '#B0568A'];
      [['en la fuente', 0], ['al llegar', 1]].forEach(function (q, s) {
        var x0 = x + s * (w / 2), t = el('text', { 'class': 'rc-dk', x: x0, y: y + 10 }, g); t.textContent = q[0];
        R[q[1]].forEach(function (v, k) {
          var bx = x0 + k * 30, hb = 34 * v / 2;
          el('rect', { 'class': 'rc-dcaja', x: bx, y: y + 18, width: 13, height: 34 }, g);
          el('rect', { x: bx, y: f(y + 52 - hb), width: 13, height: f(hb), fill: cols[k], opacity: .85 }, g);
          var tt = el('text', { 'class': 'rc-dl', x: bx, y: y + 66 }, g); rico(tt, 'ν_' + nom[k]);
        });
        var tv = el('text', { 'class': 'rc-dk', x: x0 + 96, y: y + 40 }, g); tv.textContent = q[1] ? '1 : 1 : 1' : '1 : 2 : 0';
      });
    }
    function dibTau(g, x, y, w, h) {   // escala logarítmica de 10 m a 10 km
      var lx = function (m) { return x + (Math.log10(m) - 1) / 3 * w; }, yb = y + 26;
      el('rect', { 'class': 'rc-dbanda', x: f(lx(3000)), y: yb - 8, width: f(lx(10000) - lx(3000)), height: 16 }, g);
      var tb = el('text', { 'class': 'rc-dk', x: f(lx(3000) - 6), y: yb - 12 }, g); tb.textContent = 'ancho del valle';
      el('line', { 'class': 'rc-deje', x1: x, y1: yb, x2: x + w, y2: yb }, g);
      [10, 100, 1000, 10000].forEach(function (m) { el('line', { 'class': 'rc-deje', x1: f(lx(m)), y1: yb - 3, x2: f(lx(m)), y2: yb + 3 }, g); var t = el('text', { 'class': 'rc-dk', x: f(lx(m) - 8), y: yb + 16 }, g); t.textContent = m < 1000 ? m + ' m' : m / 1000 + ' km'; });
      [[1, '1 PeV'], [8, '8'], [100, '100 PeV']].forEach(function (q) { var m = q[0] * 1e15 / M_TAU * CTAU * 1e3; el('circle', { 'class': q[0] === 8 ? 'rc-dpto' : 'rc-dpt', cx: f(lx(m)), cy: yb, r: 3.2 }, g); var t = el('text', { 'class': 'rc-dl', x: f(lx(m) - 8), y: yb - 8 }, g); t.textContent = q[1]; });
    }
    function dibPerfil(g, x, y, w, h) {
      var Xm = 1100, Nm = greisen(X_MAX), d = '', d2 = '';
      var xi = x + X_IMP / Xm * w, yi = y + h - N_IMP / Nm * (h - 12), xm = x + X_MAX / Xm * w;
      for (var X = 0; X <= Xm; X += 10) { var px = x + X / Xm * w, py = y + h - greisen(X) / Nm * (h - 12); d += (X ? ' L' : 'M') + f(px) + ' ' + f(py); if (px <= xi) d2 += (X ? ' L' : 'M') + f(px) + ' ' + f(py); }
      el('path', { 'class': 'rc-dlleno', d: d2 + ' L' + f(xi) + ' ' + f(yi) + ' L' + f(xi) + ' ' + f(y + h) + ' L' + f(x) + ' ' + f(y + h) + 'Z' }, g);
      el('line', { 'class': 'rc-deje', x1: x, y1: y + h, x2: x + w, y2: y + h }, g);
      el('path', { 'class': 'rc-dcurva', d: d }, g);
      el('line', { 'class': 'rc-dguion', x1: f(xi), y1: y + h, x2: f(xi), y2: y + 4 }, g);
      el('circle', { 'class': 'rc-dpto', cx: f(xi), cy: f(yi), r: 3.2 }, g);
      var t1 = el('text', { 'class': 'rc-dk', x: f(xi + 5), y: y + 10 }, g); t1.textContent = 'ladera · ' + coma(X_IMP, 0) + ' g/cm²';
      var t2 = el('text', { 'class': 'rc-dk', x: f(xm - 20), y: y + h + 12 }, g); rico(t2, 'X_{máx} ≈ ' + coma(X_MAX, 0));
      var t3 = el('text', { 'class': 'rc-dk', x: x + w - 50, y: y + h + 12 }, g); t3.textContent = 'X (g/cm²)';
    }
    function dibMalla(g, x, y, w, h) {
      var p = 28, cx = x + 8;
      for (var j = 0; j < 3; j++) for (var k = 0; k < 8; k++) { var px = cx + k * p + (j % 2 ? p / 2 : 0), py = y + 8 + j * p * .866; el('circle', { 'class': 'rc-dunidad', cx: f(px), cy: f(py), r: 3.4 }, g); }
      var yc = y + 8 + 2 * p * .866 + 14;
      el('line', { 'class': 'rc-dcota', x1: cx, y1: yc, x2: cx + p, y2: yc }, g);
      var t = el('text', { 'class': 'rc-dk', x: cx + p + 6, y: yc + 3 }, g); t.textContent = '150 m · malla triangular';
      var t2 = el('text', { 'class': 'rc-dk', x: x + w - 46, y: y + 30 }, g); t2.textContent = '× 5 000';
    }
    function dibOrden(g, x, y, w, h) {
      for (var k = 0; k < 7; k++) el('circle', { cx: f(x + 8 + k * 24), cy: y + 12, r: 6, fill: 'rgb(' + paleta(k / 6) + ')' }, g);
      var t = el('text', { 'class': 'rc-dk', x: x, y: y + 34 }, g); t.textContent = 'primera → última llegada: ' + coma((T1H - T0H) * 1000, 0) + ' ns';
    }

    var A_MED = [MED.x - MED.r * .55, MED.y + MED.r * .55], A_MON = Ps([3.6, .2, Z0]), A_VTX = Ps(VTX), A_TAU = Ps(sobre(CARA, L_TAU * .6)), A_CAS = Ps(sobre(DEC, L_CRUCE * .5)), A_LAD = Ps([-2.4, alto(-2.4, 2.6), 2.6]), A_IMP = Ps(IMP), A_VAL = Ps([.3, 0, 2.2]);
    ficha('fuente', { ancla: A_MED, k: 'Rayo cósmico · fuente lejana', tit: 'p + γ → Δ⁺ → n + π⁺', dib: dibSabores, dibH: 80,
      d: ['Un protón de ~2 × 10¹⁷ eV choca con un fotón', 'de su entorno. Luego π⁺ → μ⁺ ν_μ y μ⁺ → e⁺ ν_e ν̄_μ:', 'cada neutrino se lleva ≈ 5 % de la energía.', 'Sin carga, viajan en línea recta; al oscilar', 'en el camino también llegan ν_τ.'] });
    ficha('monte', { ancla: A_MON, k: 'Blanco de roca', tit: 'Neutrinos rasantes',
      d: ['A 10 PeV un neutrino recorre en promedio', '~4 000 km de roca antes de interactuar: la', 'Tierra entera lo absorbe, pero uno casi', 'horizontal cruza kilómetros de montaña y', 'puede interactuar cerca de la cara del valle.'] });
    ficha('vertice', { ancla: A_VTX, k: 'Corriente cargada', tit: 'ν_τ + N → τ⁻ + X',
      d: ['El neutrino intercambia un bosón W con un', 'quark y se vuelve un tau, que se lleva ≈ 80 %', 'de la energía. El resto (X) es una lluvia de', 'hadrones que la roca absorbe. Debe ocurrir a', 'entre ~50 m y 5 km de la cara del valle.'] });
    ficha('tau', { ancla: A_TAU, k: 'Leptón tau', tit: 'λ = γ c τ ≈ 49 m × E/PeV', dib: dibTau, dibH: 56,
      d: ['m_τ = 1,777 GeV y cτ = 87 µm. A 8 PeV, γ ≈ 4,5 × 10⁶:', 'vuela ≈ 390 m y se desintegra en el aire. Así', 'en ≈ 65 % de los casos (hadrones + ν_τ); con', 'e ν ν (≈ 18 %) la cascada es electromagnética;', 'con μ ν ν (≈ 17 %) casi no hay cascada.'] });
    ficha('cascada', { ancla: A_CAS, k: 'Cascada de partículas', tit: 'X_{máx} ≈ X₀ ln(E₀/E_c)', dib: dibPerfil, dibH: 80,
      d: ['e± radian fotones y los fotones crean pares:', 'el número se duplica cada X₀ ln 2 (X₀ ≈ 37 g/cm²).', 'Mide de 3 a 10 km y solo ~200 m de ancho', '(radio de Molière ≈ 100 m). Llega a la ladera', 'antes del máximo, con ≈ ' + cient(N_IMP) + ' e±.'] });
    ficha('ladera', { ancla: A_LAD, k: 'TAMBO · ladera de enfrente', tit: '5 000 unidades a 150 m', dib: dibMalla, dibH: 76,
      d: ['Detectores de partículas en malla triangular', 'sobre la ladera que mira a la montaña (diseño', 'nominal de 2025; se estudian tanques de agua', 'Cherenkov y centelleadores plásticos).', 'Busca neutrinos tau de 1 a 100 PeV.'] });
    ficha('huella', { ancla: A_IMP, k: 'Reconstrucción', tit: 't_i = t₀ + r_i · n̂ / c', dib: dibOrden, dibH: 46,
      d: ['El frente es casi un plano que avanza a c:', 'ajustando los tiempos de llegada sale la', 'dirección, con resolución bajo 1°; el número', 'de partículas por unidad da la energía. Con', 'el flujo de IceCube: ≈ 6 neutrinos en 10 años.'] });
    ficha('valle', { ancla: A_VAL, k: 'Valle del Colca · Perú', tit: 'Un valle como detector',
      d: ['≈ 1,5 km de profundidad y ≈ 4,5 km entre', 'laderas. Una cara hace de blanco y la otra', 'de pantalla; si el valle mide de 3 a 10 km,', 'la cascada se desarrolla antes de llegar.'] });

    // zonas (las grandes primero; las pequeñas encima)
    (function () {
      var ladera = [], k;
      for (k = -3.05; k <= -.65; k += .1) ladera.push(Ps([k, alto(k, Z0 + .05), Z0 + .05]));
      for (k = -.65; k >= -3.05; k -= .1) ladera.push(Ps([k, alto(k, Z1 - .1), Z1 - .1]));
      zona('ladera', poli(ladera));
      var monte = [Ps([1.3, 0, Z0])]; for (k = 1.3; k <= BX1; k += .1) monte.push(Ps([k, alto(k, Z0), Z0]));
      monte.push(P(BX1, -.95, Z0), P(1.3, -.95, Z0));
      zona('monte', poli(monte));
      zona('valle', poli([Ps([-.5, 0, Z0]), Ps([.9, 0, Z0]), Ps([.9, 0, Z1]), Ps([-.5, 0, Z1])]));
      zona('cascada', capsula(Ps(sobre(DEC, .25)), Ps(sobre(DEC, L_CRUCE - .35)), 22));
      zona('tau', capsula(Ps(sobre(VTX, L_ROCA * .6)), Ps(DEC), 16));
      zona('vertice', circulo(A_VTX[0], A_VTX[1], 20));
      zona('huella', circulo(A_IMP[0], A_IMP[1], 34));
      zona('fuente', circulo(MED.x, MED.y, MED.r + 6));
    })();

    // ── fondo fijo: cielo, cordillera lejana, capas del valle, roca cortada, río, unidades, medallón ──
    function rio(z) { return P(.05 + .12 * Math.sin(z * 1.9), 0, z); }
    var CNU = null;
    function caminoNu() {   // del medallón al borde derecho, donde el ν entra a la roca (no a escala)
      if (CNU) return CNU;
      var a = [MED.x + MED.r * .72, MED.y + MED.r * .7], e = Ps(sobre(VTX, -3.6)), c1 = [1440, 360], pts = [];
      for (var k = 0; k <= 40; k++) { var u = k / 40; pts.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c1[0] + u * u * e[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c1[1] + u * u * e[1]]); }
      CNU = pts; return pts;
    }
    function pintaFondo(c, vb) {
      var g = c.createLinearGradient(0, vb.y, 0, vb.y + vb.height);
      g.addColorStop(0, '#080A14'); g.addColorStop(.38, '#12142A'); g.addColorStop(.58, '#2A2142'); g.addColorStop(.7, '#3B2846'); g.addColorStop(1, '#1A1422');
      c.fillStyle = g; c.fillRect(vb.x - 2, vb.y - 2, vb.width + 4, vb.height + 4);
      var gl = c.createRadialGradient(1080, 560, 10, 1080, 560, 520); gl.addColorStop(0, 'rgba(201,120,110,.22)'); gl.addColorStop(1, 'rgba(201,120,110,0)');
      c.fillStyle = gl; c.fillRect(vb.x, vb.y, vb.width, vb.height);
      var r = semilla(91); c.fillStyle = '#F4EEE3';
      for (var i = 0; i < 220; i++) { var x = vb.x + r() * vb.width, y = vb.y + r() * vb.height * .52, s = .4 + r() * 1.1; c.globalAlpha = .15 + .55 * r() * r(); c.fillRect(x, y, s, s); }
      c.globalAlpha = 1;
      // cordillera lejana con un volcán nevado (silueta, sin escala)
      var hz = P(0, 0, Z1)[1] - 175;
      c.beginPath(); c.moveTo(vb.x - 2, hz + 40);
      for (var X = vb.x - 2; X <= vb.x + vb.width + 2; X += 6) c.lineTo(X, hz + 30 - 16 * Math.sin(X * .011) - 10 * Math.sin(X * .027 + 1) - 110 * Math.exp(-Math.pow((X - 880) / 64, 2)) - 46 * Math.exp(-Math.pow((X - 975) / 50, 2)) - 30 * Math.exp(-Math.pow((X - 1330) / 90, 2)));
      c.lineTo(vb.x + vb.width + 2, hz + 300); c.lineTo(vb.x - 2, hz + 300); c.closePath(); c.fillStyle = '#251D38'; c.fill();
      c.save(); c.clip();
      var gn = c.createLinearGradient(0, hz - 82, 0, hz - 30); gn.addColorStop(0, 'rgba(230,226,240,.6)'); gn.addColorStop(1, 'rgba(230,226,240,0)');
      c.fillStyle = gn; c.fillRect(800, hz - 90, 230, 70); c.restore();
      // el bloque del valle: superficie sombreada (de atrás hacia adelante) con curvas de nivel cada 200 m
      var LX = [.62, .7, -.36], ll = Math.hypot(LX[0], LX[1], LX[2]); LX = [LX[0] / ll, LX[1] / ll, LX[2] / ll];
      function tono(x, z, y) {
        var dx = (alto(x + .03, z) - alto(x - .03, z)) / .06, dz = (alto(x, z + .03) - alto(x, z - .03)) / .06, nl = Math.hypot(dx, 1, dz);
        var lam = Math.max(0, (-dx * LX[0] + LX[1] - dz * LX[2]) / nl);
        var w = cl((y - .01) / .1, 0, 1), up = cl((y - .8) / .9, 0, 1);
        var A = [96 + 60 * w + 20 * up, 112 - 4 * w + 22 * up, 84 + 22 * w + 26 * up];   // terrazas verdes en el fondo → roca ocre y malva → cumbres claras
        var S = [34, 30, 62], k = .2 + .95 * Math.pow(lam, 1.2), m = .62;
        return 'rgb(' + [0, 1, 2].map(function (c) { return Math.round((S[c] + (A[c] - S[c]) * k) * m + S[c] * (1 - m) * .4); }).join(',') + ')';
      }
      var NX = Math.round((BX1 - BX0) / .08), NZ = Math.round((Z1 - Z0) / .12), dxm = (BX1 - BX0) / NX, dzm = (Z1 - Z0) / NZ, NIV = [.2, .4, .6, .8, 1, 1.2, 1.4, 1.6];
      var HF = []; for (var iz = 0; iz <= NZ; iz++) { HF.push([]); for (var ix = 0; ix <= NX; ix++) HF[iz].push(alto(BX0 + ix * dxm, Z0 + iz * dzm)); }
      c.lineJoin = 'round';
      for (iz = NZ - 1; iz >= 0; iz--) {
        var za = Z0 + iz * dzm, zb = za + dzm;
        for (ix = 0; ix < NX; ix++) {
          var xa = BX0 + ix * dxm, xb = xa + dxm, h00 = HF[iz][ix], h10 = HF[iz][ix + 1], h01 = HF[iz + 1][ix], h11 = HF[iz + 1][ix + 1];
          var p00 = P(xa, h00, za), p10 = P(xb, h10, za), p11 = P(xb, h11, zb), p01 = P(xa, h01, zb);
          var col = tono(xa + dxm / 2, za + dzm / 2, (h00 + h10 + h01 + h11) / 4);
          c.fillStyle = col; c.strokeStyle = col; c.lineWidth = .6;
          c.beginPath(); c.moveTo(p00[0], p00[1]); c.lineTo(p10[0], p10[1]); c.lineTo(p11[0], p11[1]); c.lineTo(p01[0], p01[1]); c.closePath(); c.fill(); c.stroke();
          // curvas de nivel en esta celda (cuadrados que marchan)
          for (var n = 0; n < NIV.length; n++) {
            var L = NIV[n], pts = [];
            [[h00, h10, xa, za, xb, za], [h10, h11, xb, za, xb, zb], [h11, h01, xb, zb, xa, zb], [h01, h00, xa, zb, xa, za]].forEach(function (e) {
              if ((e[0] - L) * (e[1] - L) < 0) { var u = (L - e[0]) / (e[1] - e[0]); pts.push(P(e[2] + (e[4] - e[2]) * u, L, e[3] + (e[5] - e[3]) * u)); }
            });
            if (pts.length >= 2) { c.strokeStyle = n % 2 ? 'rgba(232,206,160,.16)' : 'rgba(232,206,160,.3)'; c.lineWidth = n % 2 ? .45 : .7; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke(); }
          }
        }
      }
      // cara frontal cortada (z = Z0): estratos de roca bajo la superficie
      c.save(); c.beginPath(); var f0 = P(BX0, -.95, Z0); c.moveTo(f0[0], f0[1]);
      for (var xq = BX0; xq <= BX1 + .001; xq += .04) { var qq = P(xq, alto(xq, Z0), Z0); c.lineTo(qq[0], qq[1]); }
      var f1 = P(BX1, -.95, Z0); c.lineTo(f1[0], f1[1]); c.closePath();
      var gR = c.createLinearGradient(0, P(0, 1.7, Z0)[1], 0, f0[1]); gR.addColorStop(0, '#5A3C48'); gR.addColorStop(.5, '#3E2A36'); gR.addColorStop(1, '#22171F');
      c.fillStyle = gR; c.fill(); c.clip();
      for (var e = 0; e < 26; e++) {
        var yE = 1.75 - e * .1;
        c.strokeStyle = 'rgba(214,176,132,' + (.06 + .05 * ((e * 7) % 3)) + ')'; c.lineWidth = .6 + ((e * 5) % 3) * .35; c.beginPath();
        for (var xs = BX0; xs <= BX1 + .001; xs += .05) { var qs = P(xs, yE + .05 * Math.sin(xs * 2.3 + e) + .03 * xs, Z0); if (xs === BX0) c.moveTo(qs[0], qs[1]); else c.lineTo(qs[0], qs[1]); }
        c.stroke();
      }
      c.restore();
      // aristas del bloque
      c.strokeStyle = 'rgba(240,214,170,.55)'; c.lineWidth = 1; c.beginPath();
      for (xq = BX0; xq <= BX1 + .001; xq += .04) { var qa = P(xq, alto(xq, Z0), Z0); if (xq === BX0) c.moveTo(qa[0], qa[1]); else c.lineTo(qa[0], qa[1]); }
      c.stroke();
      c.strokeStyle = 'rgba(240,214,170,.3)'; c.lineWidth = .8; c.beginPath(); c.moveTo(f0[0], f0[1]); c.lineTo(f1[0], f1[1]); c.stroke();
      // el valle hace un corte: agua en el fondo, visible en la cara frontal
      // río
      c.strokeStyle = 'rgba(120,170,190,.55)'; c.lineWidth = 2; c.beginPath();
      for (var z3 = Z0; z3 <= Z1; z3 += .05) { var q3 = rio(z3); if (z3 === Z0) c.moveTo(q3[0], q3[1]); else c.lineTo(q3[0], q3[1]); } c.stroke();
      // unidades (tanques) sobre la ladera
      var rr = 2.6, hh = 2.2;
      for (var j = DET.length - 1; j >= 0; j--) {
        var d = DET[j], q5 = Ps([d.x, d.y, d.z]);
        if (q5[0] < vb.x - 10 || q5[0] > vb.x + vb.width + 10) continue;
        c.fillStyle = 'rgba(44,46,68,.8)'; c.strokeStyle = 'rgba(200,210,235,.26)'; c.lineWidth = .5;
        c.beginPath(); c.ellipse(q5[0], q5[1], rr, rr * .45, 0, 0, Math.PI); c.lineTo(q5[0] - rr, q5[1] - hh); c.ellipse(q5[0], q5[1] - hh, rr, rr * .45, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = 'rgba(140,190,210,.32)'; c.beginPath(); c.ellipse(q5[0], q5[1] - hh, rr, rr * .45, 0, 0, 2 * Math.PI); c.fill();
      }
      // medallón de la fuente: disco oscuro, aro dorado con marcas y rótulo
      var gm = c.createRadialGradient(MED.x - 20, MED.y - 24, 4, MED.x, MED.y, MED.r); gm.addColorStop(0, '#1C1D38'); gm.addColorStop(1, '#0B0C18');
      c.fillStyle = gm; c.beginPath(); c.arc(MED.x, MED.y, MED.r, 0, 2 * Math.PI); c.fill();
      c.strokeStyle = 'rgba(201,162,122,.75)'; c.lineWidth = 1; c.stroke();
      c.strokeStyle = 'rgba(201,162,122,.35)'; c.lineWidth = .6; c.beginPath(); c.arc(MED.x, MED.y, MED.r + 5, 0, 2 * Math.PI); c.stroke();
      for (var m = 0; m < 72; m++) { var an = m / 72 * 2 * Math.PI, l = m % 6 ? 3 : 6; c.beginPath(); c.moveTo(MED.x + Math.cos(an) * (MED.r + 5), MED.y + Math.sin(an) * (MED.r + 5)); c.lineTo(MED.x + Math.cos(an) * (MED.r + 5 + l), MED.y + Math.sin(an) * (MED.r + 5 + l)); c.stroke(); }
      c.fillStyle = 'rgba(205,183,154,.75)'; c.font = '700 7.5px "Space Mono", monospace'; c.textAlign = 'center';
      c.fillText('FUENTE LEJANA · NO A ESCALA', MED.x, MED.y - MED.r - 16); c.textAlign = 'start';
      // camino del neutrino (punteado tenue)
      c.strokeStyle = 'rgba(214,120,176,.3)'; c.lineWidth = .8; c.setLineDash([1.5, 4]); c.beginPath();
      caminoNu().forEach(function (q, k) { if (!k) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); }); c.stroke(); c.setLineDash([]);
    }

    // ── dibujo por cuadro ──
    var W = 0, H = 0, dpr = 1, T = 0, fijo = false;
    function trazo(a, b, col, ancho, guion) { ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.setLineDash(guion || []); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
    function brillo(x, y, r, rgb, a) { if (a <= 0) return; var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    function sprite(c, x, y, r) { ctx.drawImage(c, x - r, y - r, 2 * r, 2 * r); }
    function rotulo(s, x, y, col, tam) {
      tam = tam || 16; ctx.fillStyle = col;
      trozos(s).forEach(function (q) { var k = q[1] ? .68 : 1; ctx.font = 'italic 500 ' + (tam * k).toFixed(1) + 'px "Cormorant Garamond", serif'; ctx.fillText(q[0], x, y + (q[1] ? tam * .28 : 0)); x += ctx.measureText(q[0]).width + (q[1] ? 1 : .5); });
    }
    function fade(t) { return 1 - suave((t - T_FUN) / (LOOP - T_FUN - .2)); }

    function medallon(t) {
      ctx.save(); ctx.beginPath(); ctx.arc(MED.x, MED.y, MED.r - 1, 0, 2 * Math.PI); ctx.clip();
      var r = semilla(5);
      for (var i = 0; i < 26; i++) { var x = MED.x + (r() - .5) * MED.r * 1.8, y = MED.y + (r() - .5) * MED.r * 1.8; ctx.fillStyle = 'rgba(232,196,138,' + (.15 + .25 * (.5 + .5 * Math.sin(t * 2 + i))) + ')'; ctx.fillRect(x, y, 1.2, 1.2); }
      var u = (t + LOOP - T_SRC) % (LOOP / 2), C = [MED.x - 14, MED.y - 2];
      var tc = 1.1;
      if (u < tc) {
        var v = u / tc, px = C[0] - 62 + 62 * v, py = C[1] - 20 + 20 * v;
        trazo([C[0] - 74, C[1] - 24], [px, py], 'rgba(224,138,118,.4)', .8, [2, 3]);
        brillo(px, py, 14, '224,138,118', .35); sprite(SPR.p, px, py, 7); rotulo('p', px - 4, py - 10, '#E08A76', 15);
        var gx = C[0] + 56 - 56 * v; ctx.strokeStyle = '#E8C48A'; ctx.lineWidth = 1.1; ctx.beginPath();
        for (var xx = 0; xx <= 30; xx += 1.5) { var yy = C[1] + 3 * Math.sin(xx * .7 - t * 14); if (!xx) ctx.moveTo(gx + xx, yy); else ctx.lineTo(gx + xx, yy); } ctx.stroke();
        rotulo('γ', gx + 10, C[1] - 7, '#E8C48A', 14);
      } else {
        var w = u - tc;
        if (w < .8) { brillo(C[0], C[1], 34 * (1 - w / .8) + 8, '255,190,120', .7 * (1 - w / .8)); sprite(SPR.p, C[0], C[1], 8 + Math.sin(w * 40)); rotulo('Δ⁺', C[0] + 8, C[1] - 10, '#F0B49A', 14); }
        else {
          var w2 = w - .8, al = 1 - suave((w2 - 3.6) / .8);
          ctx.globalAlpha = al;
          var nx = C[0] - 22 * Math.min(w2, 2.5), ny = C[1] + 11 * Math.min(w2, 2.5); sprite(SPR.n, nx, ny, 6); rotulo('n', nx - 14, ny + 4, '#D8CDBA', 13);
          var tp = .9, pw = Math.min(w2, tp), pix = C[0] + 30 * pw, piy = C[1] - 8 * pw;
          trazo(C, [pix, piy], 'rgba(170,140,230,.5)', .8);
          if (w2 < tp) { sprite(SPR.pi, pix, piy, 5); rotulo('π⁺', pix - 3, piy - 9, '#C4B0EE', 13); }
          else {
            var v2 = w2 - tp, tm = 1.1, mw = Math.min(v2, tm), mx = pix + 26 * mw, my = piy + 12 * mw;
            brillo(pix, piy, 12, '170,140,230', .6 * Math.max(0, 1 - v2 / .5));
            trazo([pix, piy], [mx, my], 'rgba(120,180,210,.5)', .8);
            nuMed([pix, piy], [pix + 40 * Math.min(v2, 1.6), piy + 26 * Math.min(v2, 1.6)], 'ν_μ');
            if (v2 < tm) { sprite(SPR.mu, mx, my, 4.5); rotulo('μ⁺', mx + 5, my - 6, '#9CC8DC', 12); }
            else {
              var z = Math.min(v2 - tm, 1.4);
              brillo(mx, my, 10, '120,180,210', .6 * Math.max(0, 1 - (v2 - tm) / .5));
              trazo([mx, my], [mx + 18 * z, my - 22 * z], 'rgba(230,150,190,.55)', .7); rotulo('e⁺', mx + 18 * z + 3, my - 22 * z - 3, '#E6A0C4', 12);
              nuMed([mx, my], [mx + 36 * z, my + 4 * z], 'ν_e'); nuMed([mx, my], [mx + 16 * z, my + 30 * z], 'ν̄_μ');
            }
          }
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    }
    function nuMed(a, b, nom) { trazo(a, b, 'rgba(214,120,176,.6)', .8, [1.5, 2.5]); rotulo(nom, b[0] + 3, b[1] + 4, 'rgba(230,150,196,.9)', 12); }

    // el ν: recorre el camino punteado al cerrar el bucle y, ya en la roca, va hasta el vértice
    function neutrino(t) {
      var cn = caminoNu(), u0 = (t - (LOOP - 1.6)) / 1.6;
      if (u0 > 0 && u0 < 1) { var q = cn[Math.min(cn.length - 1, Math.floor(u0 * (cn.length - 1)))]; brillo(q[0], q[1], 10, '214,120,176', .7); ctx.fillStyle = '#F2B8D8'; ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, 2 * Math.PI); ctx.fill(); }
      if (t > T_VTX + 2) return;
      var u = cl(t / T_VTX, 0, 1), a = Ps(sobre(VTX, -3.6)), cab = Ps(sobre(VTX, -3.6 + 3.6 * u)), al = t < T_VTX ? 1 : 1 - suave((t - T_VTX) / 1.8);
      ctx.globalAlpha = al;
      trazo(a, cab, 'rgba(214,120,176,.85)', 1.1, [5, 4]);
      if (t < T_VTX) { brillo(cab[0], cab[1], 14, '214,120,176', .6); ctx.fillStyle = '#F7D0E4'; ctx.beginPath(); ctx.arc(cab[0], cab[1], 2, 0, 2 * Math.PI); ctx.fill(); rotulo('ν_τ', cab[0] - 4, cab[1] - 12, '#F2B8D8', 20); }
      ctx.globalAlpha = 1;
    }

    function tau(t) {
      var vt = A_VTX, ui = t - T_VTX; if (ui < 0) return;
      var al = fade(t);
      ctx.globalAlpha = al;
      if (ui < 1.2) brillo(vt[0], vt[1], 46 * (1 - ui / 1.2) + 6, '255,180,110', .9 * (1 - ui / 1.2));
      var rr = semilla(3), cr = Math.min(1, ui / .5);
      ctx.strokeStyle = 'rgba(232,170,120,' + (.65 * (1 - suave((ui - 3) / 3))) + ')'; ctx.lineWidth = .7; ctx.beginPath();
      for (var k = 0; k < 18; k++) { var an = Math.PI * (.78 + .44 * rr()) + (rr() - .5) * .9, l = (7 + 15 * rr()) * cr; ctx.moveTo(vt[0], vt[1]); ctx.lineTo(vt[0] + Math.cos(an) * l, vt[1] + Math.sin(an) * l); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(246,214,170,.85)'; ctx.lineWidth = .9; ctx.beginPath();
      for (var j = 0; j <= 14; j++) { var ra = j % 2 ? 3.5 : 10 * suave(ui / .35), ang = j / 14 * 2 * Math.PI + .3, px = vt[0] + Math.cos(ang) * ra, py = vt[1] + Math.sin(ang) * ra * .8; if (!j) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke();
      var sT = t < T_CARA ? L_ROCA * suave(ui / (T_CARA - T_VTX)) : L_ROCA + L_TAU * suave((t - T_CARA) / (T_DEC - T_CARA));
      var q1 = Ps(sobre(VTX, Math.min(sT, L_ROCA)));
      trazo(vt, q1, 'rgba(240,150,110,.9)', 1.3, [4, 3]);
      var cab = q1;
      if (sT > L_ROCA) { cab = Ps(sobre(VTX, sT)); trazo(q1, cab, 'rgba(255,190,150,.95)', 1.6); }
      if (t < T_DEC) { brillo(cab[0], cab[1], 12, '255,150,110', .7); ctx.fillStyle = '#FFE2D0'; ctx.beginPath(); ctx.arc(cab[0], cab[1], 2.2, 0, 2 * Math.PI); ctx.fill(); rotulo('τ⁻', cab[0] - 4, cab[1] - 11, '#FFC9A8', 20); }
      var ud = t - T_DEC;
      if (ud > 0) {
        var d = Ps(DEC);
        if (ud < 1.3) brillo(d[0], d[1], 56 * (1 - ud / 1.3) + 6, '255,240,215', .95 * (1 - ud / 1.3));
        var nuF = Ps(sobre(DEC, Math.min(L_CRUCE * .95, ud * .9))), qn = [nuF[0], nuF[1] + 10];
        ctx.globalAlpha = al * Math.max(0, 1 - Math.max(0, ud - 2.5) / 2);
        trazo(d, qn, 'rgba(214,120,176,.65)', .8, [1.5, 3]); rotulo('ν_τ', qn[0] + 3, qn[1] + 12, '#E6A0C4', 13);
      }
      ctx.globalAlpha = 1;
    }

    var LOTES = [[], [], [], [], []];
    function cascada(t) {
      if (t < T_DEC) return;
      var sf = frente(t), crec = cl(sf / L_CRUCE, 0, 1), fin = (1 - .7 * suave((t - T_LLEGA) / 2.2)) * fade(t);
      if (fin <= 0) return;
      LOTES.forEach(function (l) { l.length = 0; });
      RAY.forEach(function (R) {
        if (sf < R.sb) return;
        var s1 = Math.min(sf, R.fin), s0 = Math.max(R.sb, s1 - R.tr * L_CRUCE * .5); if (s1 <= s0) return;
        var a = Ps(puntoRayo(R, s0)), b = Ps(puntoRayo(R, s1));
        LOTES[R.oro ? 4 : Math.min(3, Math.floor(R.a * 4))].push(a[0], a[1], b[0], b[1]);
      });
      ctx.globalCompositeOperation = 'lighter';
      var resalta = foco === 'cascada' ? 1.5 : 1;
      LOTES.forEach(function (l, k) {
        if (!l.length) return;
        var al = (k === 4 ? .32 : .014 + k * .017) * fin * (.5 + .5 * crec) * resalta;
        ctx.strokeStyle = k === 4 ? 'rgba(246,206,140,' + al + ')' : 'rgba(' + (k < 2 ? '150,170,255' : '214,226,255') + ',' + al + ')'; ctx.lineWidth = k === 4 ? .7 : .6 + k * .2;
        ctx.beginPath(); for (var i = 0; i < l.length; i += 4) { ctx.moveTo(l[i], l[i + 1]); ctx.lineTo(l[i + 2], l[i + 3]); } ctx.stroke();
      });
      var c0 = Ps(sobre(DEC, Math.max(0, sf - L_CRUCE * .35))), c1 = Ps(sobre(DEC, Math.min(sf, L_CRUCE)));
      var gl = ctx.createLinearGradient(c0[0], c0[1], c1[0], c1[1]); gl.addColorStop(0, 'rgba(180,200,255,0)'); gl.addColorStop(1, 'rgba(225,235,255,' + (.35 * fin) + ')');
      ctx.strokeStyle = gl; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.stroke();
      if (sf < L_CRUCE * 1.01) {
        var c = sobre(DEC, sf), rd = R_M * 1.4 * crec + .02, pc = Ps(c), p1 = Ps([c[0] + E2[0] * rd, c[1] + E2[1] * rd, c[2] + E2[2] * rd]), p2 = Ps([c[0] + E1[0] * rd, c[1] + E1[1] * rd, c[2] + E1[2] * rd]);
        var rx = Math.max(2, Math.hypot(p2[0] - pc[0], p2[1] - pc[1])), ry = Math.max(2, Math.hypot(p1[0] - pc[0], p1[1] - pc[1]));
        brillo(pc[0], pc[1], Math.max(rx, ry) * 2 + 8, '190,210,255', .3 * fin);
        ctx.strokeStyle = 'rgba(246,214,150,' + (.85 * fin) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(pc[0], pc[1], rx, ry, Math.atan2(p1[1] - pc[1], p1[0] - pc[0]) - Math.PI / 2, 0, 2 * Math.PI); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function senales(t) {
      var r = 2.6, hh = 2.2, al0 = fade(t);
      VIVOS.forEach(function (d) {
        var u = t - tHit(d); if (u < 0) return;
        var q = Ps([d.x, d.y, d.z]), k = T1H > T0H ? (d.t - T0H) / (T1H - T0H) : 0, col = paleta(k);
        var a = Math.min(1, u / .2) * al0, rr = 4 + 3.2 * Math.log10(1 + d.n);
        ctx.globalCompositeOperation = 'lighter';
        brillo(q[0], q[1] - hh / 2, rr * 2, col, .75 * a);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = a; ctx.fillStyle = 'rgb(' + col + ')'; ctx.beginPath(); ctx.ellipse(q[0], q[1] - hh, r + .4, (r + .4) * .45, 0, 0, 2 * Math.PI); ctx.fill();
        var p1 = Math.max(0, 1 - u / .9); if (p1 > 0) { ctx.strokeStyle = 'rgba(' + col + ',' + p1 + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(q[0], q[1] - hh / 2, rr * (1 + 3 * (1 - p1)), rr * .45 * (1 + 3 * (1 - p1)), 0, 0, 2 * Math.PI); ctx.stroke(); }
        ctx.globalAlpha = 1;
      });
    }
    function reconstruye(t) {
      var u = suave((t - T_REC) / 1.2) * fade(t); if (u <= 0) return;
      var a = Ps(sobre(IMP, -1.3)), b = A_IMP, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var lv = L * suave((t - T_REC) / 1.4);
      ctx.globalAlpha = u;
      trazo([b[0] - Math.cos(ang) * lv, b[1] - Math.sin(ang) * lv], b, 'rgba(246,214,150,.95)', 1.3, [6, 4]);
      ctx.fillStyle = 'rgba(246,214,150,.95)'; ctx.beginPath();
      ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - 10 * Math.cos(ang - .35), b[1] - 10 * Math.sin(ang - .35)); ctx.lineTo(b[0] - 10 * Math.cos(ang + .35), b[1] - 10 * Math.sin(ang + .35)); ctx.closePath(); ctx.fill();
      var dA = Math.PI / 180; ctx.strokeStyle = 'rgba(246,214,150,.35)'; ctx.lineWidth = .7; ctx.beginPath();
      ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - lv * Math.cos(ang - dA), b[1] - lv * Math.sin(ang - dA)); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - lv * Math.cos(ang + dA), b[1] - lv * Math.sin(ang + dA)); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // detalles: brillo del río y un cóndor que planea
    function rioVivo(t) {
      ctx.globalCompositeOperation = 'lighter';
      for (var k = 0; k < 7; k++) { var w = (t * .25 + k * .6) % 4.2, q = rio(Z0 + w * (Z1 - Z0) / 4.2); brillo(q[0], q[1], 7, '150,200,220', .35 * Math.sin(Math.PI * w / 4.2)); }
      ctx.globalCompositeOperation = 'source-over';
    }
    function condor(t) {
      var u = t / LOOP, x = 1150 - 230 * u, y = 400 - 34 * Math.sin(u * Math.PI) + 5 * Math.sin(t * .9), b = .1 * Math.sin(t * .7);
      ctx.save(); ctx.translate(x, y); ctx.rotate(b);
      ctx.fillStyle = 'rgba(8,8,14,.92)'; ctx.beginPath();
      ctx.moveTo(-17, -1); ctx.quadraticCurveTo(-9, -5, -2, -1); ctx.lineTo(0, -2.2); ctx.lineTo(2, -1); ctx.quadraticCurveTo(9, -5, 17, -1); ctx.lineTo(16, 0); ctx.quadraticCurveTo(8, -2.6, 2, 1.2); ctx.lineTo(0, 3); ctx.lineTo(-2, 1.2); ctx.quadraticCurveTo(-8, -2.6, -16, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(240,236,230,.6)'; ctx.fillRect(-1, -2.6, 2, 1);
      ctx.restore();
    }
    function realce() {
      if (foco === 'ladera') DET.forEach(function (d) { var q = Ps([d.x, d.y, d.z]); ctx.fillStyle = 'rgba(170,220,240,.6)'; ctx.beginPath(); ctx.ellipse(q[0], q[1] - 2.2, 2.8, 1.3, 0, 0, 2 * Math.PI); ctx.fill(); });
      if (foco === 'valle') { ctx.strokeStyle = 'rgba(170,220,240,.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); for (var z = Z0; z <= Z1; z += .05) { var q = rio(z); if (z === Z0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    }

    function dibuja(t) {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      var vb = svg.viewBox.baseVal;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = fondo.width = Math.round(w * d); lienzo.height = fondo.height = Math.round(h * d); claveFondo = ''; }
      var kx = W / vb.width * dpr, ky = H / vb.height * dpr, clave = [vb.x, vb.y, vb.width, vb.height, W, H, dpr].join();
      if (clave !== claveFondo) { claveFondo = clave; fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fondo.width, fondo.height); fctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky); pintaFondo(fctx, vb); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fondo, 0, 0);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      rioVivo(t); condor(t); realce();
      medallon(t); neutrino(t); tau(t); cascada(t); senales(t); reconstruye(t);
    }

    function lecturas(t) {
      var us = microS(t);
      if (t < T_VTX) salida('neutrino tau · 10 PeV · casi horizontal', 'cruza kilómetros de roca');
      else if (t < T_CARA) salida('corriente cargada · nace un tau', 'τ ≈ 8 PeV · el resto queda en la roca');
      else if (t < T_DEC) salida('tau en el aire · ' + coma(L_TAU * 1000 * suave((t - T_CARA) / (T_DEC - T_CARA)), 0) + ' m', 't = ' + coma(us, 2) + ' µs');
      else if (t < T_LLEGA) { var X = frente(t) * 1e5 * RHO; salida('cascada · t = ' + coma(us, 1) + ' µs', 'X ≈ ' + coma(X, 0) + ' g/cm² · ' + cient(Math.max(1, greisen(X))) + ' e±'); }
      else if (t < T_REC) { var k = VIVOS.filter(function (d) { return t >= tHit(d); }).length; salida('unidades con señal: ' + k + ' de ' + VIVOS.length, 't = ' + coma(us, 2) + ' µs'); }
      else salida('dirección reconstruida · menos de 1°', VIVOS.length + ' unidades en ' + coma((T1H - T0H) * 1000, 0) + ' ns');
    }

    fig.rcFija = function (t) { T = t; fijo = true; }; fig.rcSuelta = function () { fijo = false; };
    fig.rcFoco = function (id) { Object.keys(fichas).forEach(function (k) { fichas[k].pon(k === id); }); foco = id || null; };
    fig.rcInfo = function () { var m = DET.reduce(function (b, d) { var r = Math.hypot(d.x - IMP[0], d.y - IMP[1], d.z - IMP[2]); return r < b[0] ? [r, d] : b; }, [9, null]); return { IMP: IMP, cerca: m, L_ROCA: L_ROCA, L_TAU: L_TAU, L_CRUCE: L_CRUCE, X_IMP: X_IMP, N: N_IMP, vivos: VIVOS.length, det: DET.length, dt: T1H - T0H }; };
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (raiz) raiz.classList.toggle('rc-noche', on); if (on && !fig.rcOn) T = 0; fig.rcOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });
    if (quieto) T = T_REC + 1;
    return {
      tick: function (dt) {
        if (!fig.classList.contains('on')) return;
        if (!quieto && !fijo) { T += dt; if (T >= LOOP) T -= LOOP; }
        dibuja(T); lecturas(T);
      }
    };
  };
})();
