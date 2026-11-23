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
//    150 m (diseño nominal 2025). Señal: densidad lateral NKG; tiempo: frente
//    curvo centrado en la desintegración (se ajusta con un plano y quedan residuos de pocos ns).
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
    // el fondo fijo es su propio lienzo, debajo: se pinta solo al cambiar el tamaño; cada cuadro solo limpia y dibuja lo que se mueve
    var fondo = document.createElement('canvas'), fctx = fondo.getContext('2d'), claveFondo = '';
    fondo.className = 'rc-lienzo rc-fondo-fijo'; fig.insertBefore(fondo, lienzo);
    var capaZ = el('g', { 'class': 'rc-zonas' }, svg), capa = el('g', { 'class': 'rc-notas' }, svg);
    var SPR = { p: esfera('#E08A76', '#A8402F', '#5A1E16', 'rgba(40,14,10,.7)'), n: esfera('#FFFDF8', '#EDE3CF', '#B3A285', 'rgba(30,26,22,.55)'),
      pi: esfera('#D6C4F2', '#8A66C4', '#46307A', 'rgba(30,20,50,.6)'), mu: esfera('#C4E0EC', '#5A8EA8', '#28495A', 'rgba(20,30,40,.6)') };

    // ── cámara fija, oblicua: x a lo ancho, y arriba, z hacia el fondo del valle ──
    var KZ = .12, KY = .42, CAM = { cx: 948, cy: 758, s: 96 }, BX0 = -4.4, BX1 = 5, Z0 = -1, Z1 = 3.6;
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
        if (nE >= 1) { var dist = Math.hypot(v[0], v[1], v[2]); d.tg = d.t = dist / C_KM; d.n = nE; d.rp = r * 1000; d.res = (dist - a) / C_KM * 1000; }   // tiempo geométrico (frente curvo)
      });
    })();
    var VIVOS = DET.filter(function (d) { return d.n > 0; }).sort(function (a, b) { return a.t - b.t; });
    var T0H = VIVOS.length ? VIVOS[0].t : 0, T1H = VIVOS.length ? VIVOS[VIVOS.length - 1].t : 1;
    var E1 = (function () { var a = [DIR[1], -DIR[0], 0], l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; })();
    var E2 = [DIR[1] * E1[2] - DIR[2] * E1[1], DIR[2] * E1[0] - DIR[0] * E1[2], DIR[0] * E1[1] - DIR[1] * E1[0]];
    // tiempos observados = geométrico (frente curvo centrado en el decaimiento)
    //   + retraso de la primera partícula dentro del frente: cada partícula llega con un retraso gamma (k = 2)
    //     cuya desviación típica es σ_t(r) = 1,6 ns (1 + r/30 m)^1,65 (espesor de Linsley, ajustado a cascadas
    //     de 10¹⁷–10²⁰ eV con θ < 60°: aquí se extrapola); la estación se dispara con la primera de sus n partículas
    //   + reloj del detector: gaussiana de σ = 2 ns.
    var SIG_DET = .002;
    function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }
    // GEN: parámetros del generador de tiempos (nominal). Las pruebas de desajuste generan con otros y ajustan con el nominal.
    var GEN0 = { s0: .0016, b: 1.65, k: 2, fn: 1 }, GEN = GEN0;
    function grosor(rp, G) { G = G || GEN; return G.s0 * Math.pow(1 + rp / 30, G.b); }   // σ_t(r) en µs
    // mínimo exacto de n retrasos gamma(k, θ) con desviación σ_t: P(M > x) = S(x)^n → se invierte (k = 1 exacto; k = 2 con Newton)
    function primera(d, r, G) {
      G = G || GEN; var n = Math.max(1, Math.round(d.n * G.fn)), L = -Math.log(r() + 1e-15) / n;
      if (G.k === 1) return grosor(d.rp, G) * L;
      var th = grosor(d.rp, G) / Math.SQRT2, z = Math.sqrt(2 * L);
      for (var it = 0; it < 30; it++) { var g = Math.log(1 + z) - z + L, dz = g * (1 + z) / z; z += dz; if (z < 1e-9) z = 1e-9; if (Math.abs(dz) < 1e-10 * (1 + z)) break; }
      return th * z;
    }
    // media y desviación del primer tiempo de cada estación (2000 muestras del mismo estadístico que usa el generador):
    // la media se resta antes del ajuste y la desviación (⊕ reloj) fija el peso 1/σ_i²
    (function () { var r = semilla(23); VIVOS.forEach(function (d) { var m = 0, q = 0, N = 2000; for (var j = 0; j < N; j++) { var v = primera(d, r); m += v; q += v * v; } m /= N; d.muF = m; d.sigF = Math.sqrt(Math.max(0, q / N - m * m)); d.sig = Math.sqrt(SIG_DET * SIG_DET + d.sigF * d.sigF); }); })();
    function realiza(r, fis, det, G) { return VIVOS.map(function (d) { return d.tg + (fis ? primera(d, r, G) : 0) + (det ? SIG_DET * gauss(r) : 0); }); }
    // ajuste del frente: t_i − ⟨retraso_i⟩ = t₀ + n̂·r_i / c + κ ρ_i² / 2c, con n̂ = eje + a ê₁ + b ê₂ (a, b pequeños)
    // y κ = 1/R la curvatura (ρ_i: distancia al eje por el punto de impacto). Mínimos cuadrados lineales con pesos 1/σ_i².
    // Error angular = ángulo entre n̂ ajustado y el eje simulado. PULL acumula (residuo/σ_i) para comprobar la calibración.
    var PULL = { s: 0, n: 0, chi: [] };
    function ajusta(ts, guarda) {
      var N = 4, A = [], B = [0, 0, 0, 0], F = [], i, j, c;
      for (i = 0; i < N; i++) A.push([0, 0, 0, 0]);
      VIVOS.forEach(function (d, k) {
        var f = [1, (E1[0] * d.x + E1[1] * d.y + E1[2] * d.z) / C_KM, (E2[0] * d.x + E2[1] * d.y + E2[2] * d.z) / C_KM, d.rp * d.rp * 1e-6 / (2 * C_KM)];
        var y = ts[k] - (d.muF || 0) - (DIR[0] * d.x + DIR[1] * d.y + DIR[2] * d.z) / C_KM, sg = d.sig || .002, w = 1 / (sg * sg);
        F.push([f, y, sg]); for (i = 0; i < N; i++) { B[i] += w * f[i] * y; for (j = 0; j < N; j++) A[i][j] += w * f[i] * f[j]; }
      });
      for (c = 0; c < N; c++) {
        var pv = c; for (i = c + 1; i < N; i++) if (Math.abs(A[i][c]) > Math.abs(A[pv][c])) pv = i;
        var tA = A[c]; A[c] = A[pv]; A[pv] = tA; var tB = B[c]; B[c] = B[pv]; B[pv] = tB;
        for (i = c + 1; i < N; i++) { var q = A[i][c] / A[c][c]; for (j = c; j < N; j++) A[i][j] -= q * A[c][j]; B[i] -= q * B[c]; }
      }
      var x = [0, 0, 0, 0]; for (c = N - 1; c >= 0; c--) { var sm = B[c]; for (j = c + 1; j < N; j++) sm -= A[c][j] * x[j]; x[c] = sm / A[c][c]; }
      var chi = 0;
      F.forEach(function (q, k) { var m = x[0] + x[1] * q[0][1] + x[2] * q[0][2] + x[3] * q[0][3], u = (q[1] - m) / q[2]; PULL.s += u * u; PULL.n++; chi += u * u; if (guarda) { var d = VIVOS[k]; d.t = ts[k]; d.res = (q[1] - m) * 1000; } });
      if (guarda) KAP = x[3];
      if (PULL.chi.length < NMC) PULL.chi.push(chi / (F.length - N));
      return Math.atan(Math.hypot(x[1], x[2])) * 180 / Math.PI;
    }
    var KAP = 0;
    // 1000 repeticiones del mismo evento: solo reloj, solo espesor del frente, ambos; y cinco generadores distintos
    // del que asume el ajuste (desajuste de modelo). Intervalos de 68 % de la mediana y del P68 por estadística de orden.
    var NMC = 1000, CHI90 = 14.684;   // cuantil 90 % de χ² con 9 grados de libertad
    // un escenario se puede calcular de una vez o por tramos (paso), para no bloquear el navegador
    function nuevoEsc(fis, det, sem, G) { return { fis: fis, det: det, G: G, r: semilla(sem), mc: [], todas: [], mal: 0, k: 0 }; }
    function paso(E, m) {
      for (var j = 0; j < m && E.k < NMC; j++, E.k++) { var ts = realiza(E.r, E.fis, E.det, E.G), e = ajusta(ts, false); if (isFinite(e) && e < 20) { E.mc.push(e); if (!E.G && E.fis && E.det) E.todas.push([e, ts]); } else E.mal++; }
      return E.k >= NMC;
    }
    function cierra(E) {
      var mc = E.mc.sort(function (a, b) { return a - b; }), n = mc.length, md = mc[Math.round(n / 2)];
      var tip = E.todas.length ? E.todas.reduce(function (b, q) { return Math.abs(q[0] - md) < Math.abs(b[0] - md) ? q : b; }, E.todas[0])[1] : null;
      var q = function (p) { var s = Math.sqrt(n * p * (1 - p)); return [mc[Math.round(n * p)], (mc[Math.min(n - 1, Math.round(n * p + s))] - mc[Math.max(0, Math.round(n * p - s))]) / 2]; };
      E.todas = null; return { mc: mc, med: q(.5), p68: q(.68), mal: E.mal, tip: tip };
    }
    // escenario nominal (ambos efectos): ahora mismo, porque fija los tiempos que se dibujan
    var AJ = (function () {
      if (VIVOS.length < 4) return null;
      PULL.s = PULL.n = 0; PULL.chi = [];
      var E = nuevoEsc(true, true, 97); paso(E, NMC); var C = cierra(E), pull = Math.sqrt(PULL.s / PULL.n), chi = PULL.chi.sort(function (a, b) { return a - b; })[PULL.chi.length >> 1], cob = PULL.chi.filter(function (v) { return v * (VIVOS.length - 4) > CHI90; }).length / PULL.chi.length; PULL.chi = []; var err = ajusta(C.tip, true);   // se muestra la realización más cercana a la mediana (declarado en la ficha)
      return { err: err, mc: C.mc, med: C.med[0], p68: C.p68[0], dmed: C.med[1], dp68: C.p68[1], mal: C.mal, pull: pull, chi: chi, cob: cob, R: KAP > 0 ? 1 / KAP : 0, listo: false };
    })();
    // sensibilidad (solo reloj, solo espesor y cinco generadores distintos): por tramos, después de arrancar la escena
    function sensibilidad(alFin) {
      if (!AJ) return;
      var VAR = [{ s0: .0016, b: 1.4, k: 2, fn: 1 }, { s0: .0016, b: 1.9, k: 2, fn: 1 }, { s0: .0024, b: 1.65, k: 2, fn: 1 }, { s0: .0016, b: 1.65, k: 1, fn: 1 }, { s0: .0016, b: 1.65, k: 2, fn: .5 }];
      var L = [nuevoEsc(false, true, 131), nuevoEsc(true, false, 173)].concat(VAR.map(function (G, i) { return nuevoEsc(true, true, 211 + i, G); })), i = 0;
      (function tramo() {
        var t0 = performance.now();
        while (i < L.length && performance.now() - t0 < 8) { if (paso(L[i], 25)) i++; }
        if (i < L.length) { setTimeout(tramo, 16); return; }
        var R = L.map(cierra), p68s = R.slice(2).map(function (m) { return m.p68[0]; });
        AJ.reloj = R[0]; AJ.fis = R[1]; AJ.sMin = Math.min.apply(null, p68s); AJ.sMax = Math.max.apply(null, p68s);
        AJ.mal += R.reduce(function (a, m) { return a + m.mal; }, 0); AJ.listo = true; alFin();
      })();
    }
    VIVOS.sort(function (a, b) { return a.t - b.t; });
    T0H = VIVOS[0].t; T1H = VIVOS[VIVOS.length - 1].t;

    // ── cascada: rayos rectos que nacen a lo largo del eje ──
    var RAY = [], rnd = semilla(7);
    for (var i = 0; i < 760; i++) {
      var sb = L_CRUCE * Math.pow(rnd(), 1.7) * .8, ph = rnd() * 2 * Math.PI;
      var rf = R_M * 1.25 * Math.sqrt(-2 * Math.log(rnd() + 1e-6)) * .55;
      RAY.push({ sb: sb, c: Math.cos(ph), s: Math.sin(ph), th: rf / Math.max(.4, L_CRUCE - sb), a: rnd(), tr: .35 + rnd() * .9, oro: rnd() < .06, q: rnd(), nuc: rf < R_M * .35 });
    }
    // muones: pocos, rectos y poco desviados; nacen de los piones cargados y atraviesan todo el valle
    for (i = 0; i < 30; i++) {
      var sbm = L_CRUCE * .35 * Math.pow(rnd(), 1.3), phm = rnd() * 2 * Math.PI, rfm = R_M * (.3 + 1.6 * rnd());
      RAY.push({ sb: sbm, c: Math.cos(phm), s: Math.sin(phm), th: rfm / (L_CRUCE - sbm), a: 0, tr: .7 + .5 * rnd(), oro: false, mu: true, q: 0 });
    }
    function puntoRayo(R, s) {
      var l = (s - R.sb) * R.th, p = sobre(DEC, s);
      return [p[0] + l * (R.c * E1[0] + R.s * E2[0]), p[1] + l * (R.c * E1[1] + R.s * E2[1]), p[2] + l * (R.c * E1[2] + R.s * E2[2])];
    }
    RAY.forEach(function (R) { var s = R.sb; while (s < L_CRUCE * 1.15) { var q = puntoRayo(R, s); if (q[0] < 0 && alto(q[0], q[2]) > q[1]) break; s += .01; } R.fin = s; });

    // ── el bucle (s) ──
    var T_VTX = 2, T_CARA = 2.9, T_DEC = 4.2, T_LLEGA = 7.7, T_H0 = 7.8, T_H1 = 9.2, T_REC = 9.4, T_FUN = 12.4, LOOP = 13.4;
    function frente(t) { if (t < T_DEC) return 0; var u = cl((t - T_DEC) / (T_LLEGA - T_DEC), 0, 1); return L_CRUCE * (.3 * u + .7 * u * u); }
    function tHit(d) { return T_H0 + (T_H1 - T_H0) * (T1H > T0H ? (d.t - T0H) / (T1H - T0H) : 0); }
    function microS(t) {
      if (t < T_CARA) return null;
      if (t < T_DEC) return L_TAU * suave((t - T_CARA) / (T_DEC - T_CARA)) / C_KM;
      if (t < T_LLEGA) return (L_TAU + frente(t)) / C_KM;
      return L_TAU / C_KM + T0H + (T1H - T0H) * cl((t - T_H0) / (T_H1 - T_H0), 0, 1);
    }

    // ── medallón de la fuente (arriba a la derecha) ──
    var MED = { x: 1110, y: 200, r: 110 };
    var LT = { x0: 905, x1: 1105, y: 428 };   // línea de llegadas

    // ── zonas al pasar el mouse y su ficha ──
    var foco = null, fichas = {};
    var FX = 632, FY = 98, FW = 338;
    function ficha(id, o) {
      var g = el('g', { 'class': 'rc-ficha' }, capa);
      var guia = el('path', { 'class': 'rc-guia', pathLength: 1 }, g);
      var pt = el('circle', { 'class': 'rc-pt', r: 2.4 }, g), aro = el('circle', { 'class': 'rc-aro', r: 2.4 }, g);
      var hDib = o.dib ? o.dibH : 0, lineas = o.d, alto2 = 66 + (hDib ? hDib + 10 : 0) + lineas.length * 19.5 + 12;
      el('rect', { 'class': 'rc-fondo', x: FX, y: FY, width: FW, height: f(alto2), rx: 8 }, g);
      var k = el('text', { 'class': 'rc-k', x: FX + 16, y: FY + 22 }, g); k.textContent = o.k;
      el('line', { 'class': 'rc-regla', x1: FX + 16, y1: FY + 30, x2: FX + FW - 16, y2: FY + 30 }, g);
      var t = el('text', { 'class': 'rc-tit', x: FX + 16, y: FY + 54 }, g); rico(t, o.tit);
      if (o.dib) o.dib(el('g', { 'class': 'rc-dib' }, g), FX + 16, FY + 74, FW - 32, hDib - 14);
      var d = el('text', { 'class': 'rc-d', x: FX + 16, y: FY + 84 + (hDib ? hDib + 10 : 0) }, g);
      lineas.forEach(function (l, j) { var s = el('tspan', { x: FX + 16, dy: j ? 19.5 : 0 }, d); rico(s, l); });
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
      var A = [[210, 138, 27], [217, 90, 26], [182, 51, 58], [111, 74, 207]], x = cl(k, 0, 1) * (A.length - 1), i = Math.min(A.length - 2, Math.floor(x)), w = x - i;
      return [0, 1, 2].map(function (c) { return Math.round(A[i][c] + (A[i + 1][c] - A[i][c]) * w); }).join(',');
    }

    // dibujitos de las fichas (SVG)
    function dibSabores(g, x, y, w, h) {
      var R = [[1, 2, 0], [1, 1, 1]], nom = ['e', 'μ', 'τ'], cols = ['#C9A27A', '#6F8FB0', '#B0568A'];
      [['en la fuente', 0], ['al llegar', 1]].forEach(function (q, s) {
        var x0 = x + s * (w / 2), t = el('text', { 'class': 'rc-dk', x: x0, y: y + 10 }, g); t.textContent = q[0];
        R[q[1]].forEach(function (v, k) {
          var bx = x0 + k * 26, hb = 34 * v / 2;
          el('rect', { 'class': 'rc-dcaja', x: bx, y: y + 18, width: 13, height: 34 }, g);
          el('rect', { x: bx, y: f(y + 52 - hb), width: 13, height: f(hb), fill: cols[k], opacity: .85 }, g);
          var tt = el('text', { 'class': 'rc-dl', x: bx, y: y + 66 }, g); rico(tt, 'ν_' + nom[k]);
        });
        var tv = el('text', { 'class': 'rc-dk', x: x0 + 82, y: y + 40 }, g); tv.textContent = q[1] ? '1 : 1 : 1' : '1 : 2 : 0';
      });
    }
    function dibTau(g, x, y, w, h) {   // escala logarítmica de 10 m a 10 km
      var lx = function (m) { return x + (Math.log10(m) - 1) / 3 * w; }, yb = y + 26;
      el('rect', { 'class': 'rc-dbanda', x: f(lx(3000)), y: yb - 8, width: f(lx(10000) - lx(3000)), height: 16 }, g);
      var tb = el('text', { 'class': 'rc-dk', x: f(lx(10000)), y: yb + 30, 'text-anchor': 'end' }, g); tb.textContent = 'banda: ancho útil de un valle (3–10 km)';
      el('line', { 'class': 'rc-deje', x1: x, y1: yb, x2: x + w, y2: yb }, g);
      [10, 100, 1000, 10000].forEach(function (m) { el('line', { 'class': 'rc-deje', x1: f(lx(m)), y1: yb - 3, x2: f(lx(m)), y2: yb + 3 }, g); var t = el('text', { 'class': 'rc-dk', x: f(lx(m) - (m > 5000 ? 30 : 8)), y: yb + 16 }, g); t.textContent = m < 1000 ? m + ' m' : m / 1000 + ' km'; });
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
      el('line', { 'class': 'rc-dcota', x1: f(xm), y1: y + h - 4, x2: f(xm), y2: y + h + 3 }, g);
      var t2 = el('text', { 'class': 'rc-dk', x: f(xm - 8), y: y + h + 14, 'text-anchor': 'middle' }, g); rico(t2, 'X_{máx} ≈ ' + coma(X_MAX, 0) + ' (param.)');
      var t3 = el('text', { 'class': 'rc-dk', x: x + w, y: y + h + 14, 'text-anchor': 'end' }, g); t3.textContent = 'g/cm²';
    }
    function dibMalla(g, x, y, w, h) {
      var p = 28, cx = x + 8;
      for (var j = 0; j < 3; j++) for (var k = 0; k < 8; k++) { var px = cx + k * p + (j % 2 ? p / 2 : 0), py = y + 8 + j * p * .866; el('circle', { 'class': 'rc-dunidad', cx: f(px), cy: f(py), r: 3.4 }, g); }
      var yc = y + 8 + 2 * p * .866 + 14;
      el('line', { 'class': 'rc-dcota', x1: cx, y1: yc, x2: cx + p, y2: yc }, g);
      var t = el('text', { 'class': 'rc-dk', x: cx + p + 6, y: yc + 3 }, g); t.textContent = '150 m · malla triangular';
      var t2 = el('text', { 'class': 'rc-dk', x: x + w - 46, y: y + 30 }, g); t2.textContent = '× 5 000';
    }
    function dibOrden(g, x, y, w, hT) {   // residuos del ajuste con un plano y, debajo, el error angular en 200 eventos
      var h = hT - 194, rM = 0, eM = 0; VIVOS.forEach(function (d) { rM = Math.max(rM, d.rp); eM = Math.max(eM, Math.abs(d.res)); });
      rM = Math.ceil(rM / 50) * 50 || 50; eM = Math.min(60, Math.max(2, Math.ceil(eM * 1.2)));
      var x0 = x + 22, w0 = w - 30, ym = y + 4 + (h - 20) / 2, h0 = (h - 20) / 2, yb = y + h - 16, X = function (r) { return x0 + r / rM * w0; }, Y = function (e) { return ym - cl(e, -eM, eM) / eM * h0; };
      el('line', { 'class': 'rc-deje', x1: x0, y1: f(ym), x2: x0 + w0, y2: f(ym) }, g); el('line', { 'class': 'rc-deje', x1: x0, y1: f(ym - h0), x2: x0, y2: f(ym + h0) }, g);
      var dd = '', VV = VIVOS.slice().sort(function (p, q) { return p.rp - q.rp; });
      VV.forEach(function (d, i) { dd += (i ? ' L' : 'M') + f(X(d.rp)) + ' ' + f(Y(d.res)); });
      el('path', { 'class': 'rc-dcurva rc-dtrazo', d: dd }, g);
      VIVOS.forEach(function (d) { var k = T1H > T0H ? (d.t - T0H) / (T1H - T0H) : 0; el('circle', { cx: f(X(d.rp)), cy: f(Y(d.res)), r: 2.6, fill: 'rgb(' + paleta(k) + ')', stroke: '#18212B', 'stroke-width': .6 }, g); });
      var t1 = el('text', { 'class': 'rc-dk', x: x0 + w0, y: f(ym + h0 + 12), 'text-anchor': 'end' }, g); t1.textContent = 'distancia al eje: 0 a ' + rM + ' m';
      var t2 = el('text', { 'class': 'rc-dk', x: x, y: f(ym - h0 + 3) }, g); t2.textContent = '+' + eM;
      var t3 = el('text', { 'class': 'rc-dk', x: x + 8, y: f(ym + 3) }, g); t3.textContent = '0';
      var t5 = el('text', { 'class': 'rc-dk', x: x, y: f(ym + h0 + 3) }, g); t5.textContent = '−' + eM;
      var t4 = el('text', { 'class': 'rc-dk', x: x0 + 8, y: f(ym - h0 + 3) }, g); t4.textContent = 't − frente ajustado (ns)';
      if (!AJ) return;
      var yh = y + h + 58, hh = 38, NB = 24, top = AJ.mc[Math.floor(AJ.mc.length * .99)], mx = Math.max(.5, Math.ceil(top * 4) / 4), cnt = []; for (var i = 0; i < NB; i++) cnt.push(0);
      AJ.mc.forEach(function (v) { if (v < mx) cnt[Math.floor(v / mx * NB)]++; });
      var cM = Math.max.apply(null, cnt), bw = w0 / NB;
      cnt.forEach(function (c, i) { if (c) el('rect', { x: f(x0 + i * bw + .5), y: f(yh - c / cM * hh), width: f(bw - 1), height: f(c / cM * hh), fill: 'rgba(158,219,238,.5)' }, g); });
      el('line', { 'class': 'rc-deje', x1: x0, y1: f(yh), x2: x0 + w0, y2: f(yh) }, g);
      var xe = x0 + Math.min(1, AJ.err / mx) * w0; el('line', { 'class': 'rc-dguion', x1: f(xe), y1: f(yh + 2), x2: f(xe), y2: f(yh - hh - 2) }, g);
      var u1 = el('text', { 'class': 'rc-dk', x: x0, y: f(yh - hh - 6) }, g); u1.textContent = 'error angular · ' + NMC + ' repeticiones';
      var u2 = el('text', { 'class': 'rc-dk', x: x0, y: f(yh + 12) }, g); u2.textContent = '0';
      var u3 = el('text', { 'class': 'rc-dk', x: x0 + w0, y: f(yh + 12), 'text-anchor': 'end' }, g); u3.textContent = coma(mx, 2) + '°';
      var u4 = el('text', { 'class': 'rc-dk', x: f(cl(xe, x0 + 40, x0 + w0 - 60)), y: f(yh + 12), 'text-anchor': 'middle' }, g); u4.textContent = 'mostrada';
      // tabla de sensibilidad: qué parte del error viene del reloj y cuál del frente
      var c1 = x0, c2 = x0 + 150, c3 = x0 + w0, yt = yh + 30;
      function fila(yy, a1, a2, a3, cls) { [[c1, a1, 'start'], [c2, a2, 'end'], [c3, a3, 'end']].forEach(function (q) { var t = el('text', { 'class': cls || 'rc-dk', x: f(q[0]), y: f(yy), 'text-anchor': q[2] }, g); t.textContent = q[1]; }); }
      var nd = VIVOS.length - 4;
      fila(yt, 'mediana nominal', '', coma(AJ.med, 2) + ' ± ' + coma(AJ.dmed, 2) + '°', 'rc-dl rc-dch');
      fila(yt + 17, 'P68 nominal', '', coma(AJ.p68, 2) + ' ± ' + coma(AJ.dp68, 2) + '°', 'rc-dl rc-dch');
      if (!AJ.listo) { var uw = el('text', { 'class': 'rc-dk', x: c1, y: f(yt + 36) }, g); uw.textContent = 'calculando sensibilidad…'; return; }
      fila(yt + 34, 'P68 con generador distinto', '', coma(AJ.sMin, 2) + '–' + coma(AJ.sMax, 2) + '°', 'rc-dl rc-dch');
      el('line', { 'class': 'rc-deje', x1: c1, y1: yt + 42, x2: c3, y2: yt + 42 }, g);
      var u5 = el('text', { 'class': 'rc-dk', x: c1, y: f(yt + 56) }, g); u5.textContent = 'reloj solo ' + coma(AJ.reloj.med[0], 2) + '° · frente solo ' + coma(AJ.fis.med[0], 2) + '° (med.)';
      var u6 = el('text', { 'class': 'rc-dk', x: c1, y: f(yt + 70) }, g); u6.textContent = 'χ²/ndf mediano ' + coma(AJ.chi, 2) + ' (esperado ' + coma(Math.pow(1 - 2 / (9 * nd), 3), 2) + ', ndf ' + nd + ')';
      var u7 = el('text', { 'class': 'rc-dk', x: c1, y: f(yt + 84) }, g); u7.textContent = 'χ² > cuantil 90 %: ' + coma(100 * AJ.cob, 1) + ' % (esperado 10 %)';
      var u8 = el('text', { 'class': 'rc-dk', x: c1, y: f(yt + 98) }, g); u8.textContent = 'R ajustado ' + coma(AJ.R, 1) + ' km · ' + AJ.mal + ' fallos de ' + 8 * NMC;
    }

    function dibAire(g, x, y, w, h) {   // densidad del aire (atmósfera estándar) contra altura
      var rho = function (hk) { return 1.225 * Math.pow(1 - 2.2558e-2 * hk, 4.2559); }, H = 6, x0 = x + 26, w0 = w - 34, yb = y + h - 16, h0 = h - 24;
      var X = function (r) { return x0 + r / 1.3 * w0; }, Y = function (hk) { return yb - hk / H * h0; }, d = '';
      for (var hk = 0; hk <= H + .001; hk += .2) d += (hk ? ' L' : 'M') + f(X(rho(hk))) + ' ' + f(Y(hk));
      el('line', { 'class': 'rc-deje', x1: x0, y1: yb, x2: x0 + w0, y2: yb }, g); el('line', { 'class': 'rc-deje', x1: x0, y1: f(yb - h0), x2: x0, y2: yb }, g);
      el('path', { 'class': 'rc-dcurva', d: d }, g);
      var hE = 3; el('line', { 'class': 'rc-dguion', x1: x0, y1: f(Y(hE)), x2: f(X(rho(hE))), y2: f(Y(hE)) }, g); el('circle', { 'class': 'rc-dpto', cx: f(X(rho(hE))), cy: f(Y(hE)), r: 3.2 }, g);
      var t1 = el('text', { 'class': 'rc-dk', x: x0 + 6, y: f(Y(hE) - 6) }, g); t1.textContent = 'evento · 3 km · ' + coma(rho(hE), 2);
      var t2 = el('text', { 'class': 'rc-dk', x: x0 + w0, y: yb + 12, 'text-anchor': 'end' }, g); t2.textContent = 'ρ (kg/m³) → 1,3';
      var t3 = el('text', { 'class': 'rc-dk', x: x, y: f(yb - h0 + 3) }, g); t3.textContent = '6 km';
      var t4 = el('text', { 'class': 'rc-dk', x: x + 8, y: yb + 3 }, g); t4.textContent = '0';
      var t5 = el('text', { 'class': 'rc-dk', x: x0 + 6, y: f(yb - 5) }, g); t5.textContent = 'nivel del mar · 1,23 kg/m³';
    }
    function dibOnda(g, x, y, w, h) {   // traza sintética del fotomultiplicador de la estación EST
      var r = semilla(13), T = 400, dtb = 2, nb = T / dtb, S = []; for (var i = 0; i < nb; i++) S.push(0);
      var k = Math.min(300, Math.max(1, Math.round(EST.n))), th = grosor(EST.rp) * 1000 / Math.SQRT2, t0 = 40;
      for (var j = 0; j < k; j++) { var tp = t0 - th * Math.log((r() + 1e-12) * (r() + 1e-12)), a = .6 + .8 * r(); for (var b = Math.ceil(tp / dtb); b < nb; b++) S[b] += a * Math.exp(-(b * dtb - tp) / 60); }
      var mx = Math.max.apply(null, S) || 1, x0 = x + 4, w0 = w - 8, yb = y + h - 16, h0 = h - 40, d = '';
      S.forEach(function (v, i) { d += (i ? ' L' : 'M') + f(x0 + i / nb * w0) + ' ' + f(yb - v / mx * h0); });
      el('line', { 'class': 'rc-deje', x1: x0, y1: yb, x2: x0 + w0, y2: yb }, g);
      el('path', { 'class': 'rc-dcurva', d: d }, g);
      var td = 0; for (i = 0; i < nb; i++) if (S[i] > .08 * mx) { td = i * dtb; break; }
      var xd = x0 + td / T * w0; el('line', { 'class': 'rc-dguion', x1: f(xd), y1: yb + 2, x2: f(xd), y2: f(yb - h0 - 18) }, g);
      var t1 = el('text', { 'class': 'rc-dk', x: f(xd + 4), y: f(yb - h0 - 8) }, g); t1.textContent = 'umbral ilustrativo · 8 % del máx.';
      var t2 = el('text', { 'class': 'rc-dk', x: x0 + w0, y: yb + 12, 'text-anchor': 'end' }, g); t2.textContent = 't (ns) → 400';
      var t3 = el('text', { 'class': 'rc-dk', x: x0, y: yb + 12 }, g); t3.textContent = Math.round(EST.n) + ' partículas';
    }
    var A_MED = [MED.x - MED.r * .55, MED.y + MED.r * .55], A_MON = Ps([3.6, .2, Z0]), A_VTX = Ps(VTX), A_TAU = Ps(sobre(CARA, L_TAU * .6)), A_CAS = Ps(sobre(DEC, L_CRUCE * .5)), A_LAD = Ps([-2.4, alto(-2.4, 2.6), 2.6]), A_IMP = Ps(IMP), A_VAL = Ps([.3, 0, 2.2]);
    ficha('fuente', { ancla: A_MED, k: 'Rayo cósmico · fuente lejana', tit: 'p + γ → Δ⁺ → n + π⁺', dib: dibSabores, dibH: 86,
      d: ['Un protón de ~2 × 10¹⁷ eV choca con un fotón', 'de su entorno. Luego π⁺ → μ⁺ ν_μ y μ⁺ → e⁺ ν_e ν̄_μ:', 'cada neutrino se lleva ≈ 5 % de la energía.', 'Sin carga, viajan en línea recta; al oscilar', 'en el camino también llegan ν_τ.'] });
    ficha('monte', { ancla: A_MON, k: 'Blanco de roca', tit: 'Neutrinos rasantes',
      d: ['A 10 PeV un neutrino recorre en promedio', '~4 000 km de roca antes de interactuar: la', 'Tierra entera lo absorbe, pero uno casi', 'horizontal cruza kilómetros de montaña y', 'puede interactuar cerca de la cara del valle.'] });
    ficha('vertice', { ancla: A_VTX, k: 'Corriente cargada', tit: 'ν_τ + N → τ⁻ + X',
      d: ['El neutrino intercambia un bosón W con un', 'quark y se vuelve un tau, que se lleva ≈ 80 %', 'de la energía. El resto (X) es una lluvia de', 'hadrones que la roca absorbe. Debe ocurrir a', 'entre ~50 m y 5 km de la cara del valle.'] });
    ficha('tau', { ancla: A_TAU, k: 'Leptón tau', tit: 'λ = γ c τ ≈ 49 m × E/PeV', dib: dibTau, dibH: 72,
      d: ['m_τ = 1,777 GeV, cτ = 87 µm; a 8 PeV, γ ≈ 4,5 × 10⁶.', 'Vuela en promedio ≈ 390 m (distribución', 'exponencial). Aquí decae en hadrones + ν_τ', '(≈ 65 %); otros canales: e ν ν, μ ν ν.'] });
    ficha('cascada', { ancla: A_CAS, k: 'Cascada de partículas', tit: 'Perfil longitudinal esquemático', dib: dibPerfil, dibH: 104,
      d: ['e± y γ (cian), hadrones (ámbar) y muones', '(lavanda, ≈ ' + cient(Math.pow(E_CAS / 20e9, .85)) + ' según Matthews). X = ∫ρ ds:', '3,37 km de aire = ' + coma(X_IMP, 0) + ' g/cm², antes del máximo;', 'llegan ≈ ' + cient(N_IMP) + ' e±. Greisen, Heitler y Matthews', 'son estimaciones: no sustituyen una simulación', 'de transporte (CORSIKA).'] });
    ficha('ladera', { ancla: A_LAD, k: 'TAMBO · ladera de enfrente', tit: '5 000 unidades a 150 m', dib: dibMalla, dibH: 82,
      d: ['Detectores de partículas en malla triangular', 'sobre la ladera que mira a la montaña (diseño', 'nominal de 2025; se estudian tanques de agua', 'Cherenkov y centelleadores plásticos).', 'Busca neutrinos tau de 1 a 100 PeV.'] });
    function fichaHuella() { return ficha('huella', { ancla: A_IMP, k: 'Reconstrucción · evento simulado', tit: 't_i = t₀ + n̂ · r_i / c + ρ_i² / 2Rc', dib: dibOrden, dibH: 306,
      d: ['Se resta el retraso medio de cada estación y se', 'ajustan dirección y curvatura (pesos 1/σ_i²); se', 'muestra la realización mediana. La cola de χ² algo', 'más pesada viene de la asimetría del primer', 'tiempo. No es la resolución de TAMBO.'] }); }
    fichaHuella();
    sensibilidad(function () { var vieja = fichas.huella, ver = vieja.ver; var n = fichaHuella(); capa.insertBefore(n.g, vieja.g); capa.removeChild(vieja.g); if (ver) n.pon(true); });
    ficha('valle', { ancla: A_VAL, k: 'Valle del Colca · Perú', tit: 'Un valle como detector', dib: dibAire, dibH: 92,
      d: ['≈ 1,5 km de profundidad y ≈ 4,5 km entre', 'laderas: una cara es blanco y la otra pantalla.', 'A ~3 km de altura el aire es 26 % menos denso', 'que al nivel del mar, y la cascada se estira.', 'Sección sintética inspirada en el Colca, no un', 'modelo de elevación real.'] });
    // estación: la que esté más cerca de 100 m del eje con al menos 10 partículas (frente ya grueso, pulso con estructura)
    var EST = VIVOS.filter(function (d) { return d.n >= 10; }).reduce(function (b, d) { return Math.abs(d.rp - 100) < Math.abs(b.rp - 100) ? d : b; }, VIVOS[0]), A_EST = Ps([EST.x, EST.y, EST.z]);
    ficha('estacion', { ancla: [A_EST[0], A_EST[1] - 2], k: 'Estación ilustrativa · tanque de agua', tit: 'Pulso de luz Cherenkov', dib: dibOnda, dibH: 96,
      d: ['Cada partícula que entra al agua emite luz y el', 'fotomultiplicador suma pulsos de ~60 ns. El', 'disparo es el t_i del ajuste. A ' + coma(EST.rp, 0) + ' m del eje las', 'partículas llegan repartidas en decenas de ns.', 'Esquemático: sin modelo óptico ni electrónico.'] });
    ficha('llegadas', { ancla: [LT.x0 + 4, LT.y - 4], k: 'Registro del evento', tit: 'Tiempos de disparo', 
      d: ['Una marca por detector: su posición es el', 'tiempo de disparo desde el primero y su altura,', 'el logaritmo de las partículas. La ventana de', coma(T1H - T0H, 2) + ' µs no es la duración de la cascada: es', 'lo que tarda el frente en barrer la ladera,', 'inclinada respecto a él.'] });
    var EVT = [720, 858];
    var TMB = [700, 432];
    ficha('evento', { ancla: [EVT[0] + 4, EVT[1] - 10], k: 'Evento sintético 001 · ficha técnica', tit: 'Qué es simulado y qué no',
      d: ['E_ν 10 PeV · y 0,2 · E_τ 8 PeV · τ → hadrones', 'τ ' + coma(L_TAU * 1000, 0) + ' m · aire ' + coma(L_CRUCE, 2) + ' km · X ' + coma(X_IMP, 0) + ' g/cm²', 'llegan ' + cient(N_IMP) + ' e± · ' + VIVOS.length + ' estaciones', 'Calculado: λ_τ, Greisen, NKG, umbral, ajuste.', 'Parametrizado: Linsley y Matthews (extrapolados).', 'Ilustrativo: valle, medallón y trazas.', 'No son datos de TAMBO.'] });

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
      zona('huella', circulo(A_IMP[0], A_IMP[1], 24));
      zona('estacion', circulo(A_EST[0], A_EST[1] - 2, 9));
      zona('llegadas', poli([[LT.x0 - 10, LT.y - 40], [LT.x1 + 12, LT.y - 40], [LT.x1 + 12, LT.y + 22], [LT.x0 - 10, LT.y + 22]]));
      zona('fuente', circulo(MED.x, MED.y, MED.r + 6));
    })();

    // ── fondo fijo: cielo, cordillera lejana, capas del valle, roca cortada, río, unidades, medallón ──
    function rio(z) { return P(.05 + .12 * Math.sin(z * 1.9), 0, z); }
    var CNU = null;
    function pintaFondo(c, vb) {
      // maqueta sobre el papel de la página: sin cielo, sin estrellas ni cordillera de fondo
      // el bloque del valle: superficie sombreada (de atrás hacia adelante) con curvas de nivel cada 200 m
      var LX = [.62, .7, -.36], ll = Math.hypot(LX[0], LX[1], LX[2]); LX = [LX[0] / ll, LX[1] / ll, LX[2] / ll];
      function tono(x, z, y) {
        var dx = (alto(x + .03, z) - alto(x - .03, z)) / .06, dz = (alto(x, z + .03) - alto(x, z - .03)) / .06, nl = Math.hypot(dx, 1, dz);
        var lam = Math.max(0, (-dx * LX[0] + LX[1] - dz * LX[2]) / nl);
        var w = cl((y - .01) / .1, 0, 1), up = cl((y - .8) / .9, 0, 1);
        // terrazas verdes junto al río → roca ocre andina → cumbres pálidas (luz de papel, sombras cálidas)
        var A = [168 + 38 * w + 22 * up, 184 - 12 * w + 44 * up, 128 + 68 * up];
        var S = [104, 92, 96], k = .25 + .85 * Math.pow(lam, 1.1);
        return 'rgb(' + [0, 1, 2].map(function (c) { return Math.round(S[c] + (A[c] - S[c]) * k); }).join(',') + ')';
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
            if (pts.length >= 2) { var kL = xa < -.4 ? .65 : 1; c.strokeStyle = 'rgba(92,70,54,' + ((n % 2 ? .1 : .17) * kL).toFixed(3) + ')'; c.lineWidth = .5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]); c.stroke(); }
          }
        }
      }
      // cara frontal cortada (z = Z0): estratos de roca bajo la superficie
      c.save(); c.beginPath(); var f0 = P(BX0, -.95, Z0); c.moveTo(f0[0], f0[1]);
      for (var xq = BX0; xq <= BX1 + .001; xq += .04) { var qq = P(xq, alto(xq, Z0), Z0); c.lineTo(qq[0], qq[1]); }
      var f1 = P(BX1, -.95, Z0); c.lineTo(f1[0], f1[1]); c.closePath();
      var gR = c.createLinearGradient(0, P(0, 1.7, Z0)[1], 0, f0[1]); gR.addColorStop(0, '#D9C4A4'); gR.addColorStop(.5, '#C7AD88'); gR.addColorStop(1, '#B39674');
      c.fillStyle = gR; c.fill(); c.clip();
      for (var e = 0; e < 26; e++) {
        var yE = 1.75 - e * .1;
        if (e % 2) continue; c.strokeStyle = 'rgba(92,62,40,' + (.1 + .06 * ((e * 7) % 3)) + ')'; c.lineWidth = .5 + ((e * 5) % 3) * .3; c.beginPath();
        for (var xs = BX0; xs <= BX1 + .001; xs += .05) { var qs = P(xs, yE + .05 * Math.sin(xs * 2.3 + e) + .03 * xs, Z0); if (xs === BX0) c.moveTo(qs[0], qs[1]); else c.lineTo(qs[0], qs[1]); }
        c.stroke();
      }
      c.restore();
      // aristas del bloque
      c.strokeStyle = 'rgba(78,56,40,.55)'; c.lineWidth = 1; c.beginPath();
      for (xq = BX0; xq <= BX1 + .001; xq += .04) { var qa = P(xq, alto(xq, Z0), Z0); if (xq === BX0) c.moveTo(qa[0], qa[1]); else c.lineTo(qa[0], qa[1]); }
      c.stroke();
      c.strokeStyle = 'rgba(78,56,40,.35)'; c.lineWidth = .8; c.beginPath(); c.moveTo(f0[0], f0[1]); c.lineTo(f1[0], f1[1]); c.stroke();
      // el valle hace un corte: agua en el fondo, visible en la cara frontal
      // río
      pintaPasto(c);
      // río: una cinta de agua que se ensancha y se angosta, con orillas de arena y reflejos
      function cinta(ext) {
        var izq = [], der = [];
        for (var z3 = Z0; z3 <= Z1 + .001; z3 += .04) { var x3 = .05 + .12 * Math.sin(z3 * 1.9), a3 = (.055 + .022 * Math.sin(z3 * 3.1 + 1)) + ext; izq.push(P(x3 - a3, 0, z3)); der.push(P(x3 + a3, 0, z3)); }
        c.beginPath(); izq.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); for (var i = der.length - 1; i >= 0; i--) c.lineTo(der[i][0], der[i][1]); c.closePath();
      }
      cinta(.03); c.fillStyle = 'rgba(214,200,164,.95)'; c.fill();
      cinta(0); var gA = c.createLinearGradient(0, P(0, 0, Z1)[1], 0, P(0, 0, Z0)[1]); gA.addColorStop(0, '#5FA6CF'); gA.addColorStop(1, '#2C74AE'); c.fillStyle = gA; c.fill();
      c.strokeStyle = 'rgba(30,80,120,.5)'; c.lineWidth = .5; c.stroke();
      c.save(); cinta(0); c.clip(); c.strokeStyle = 'rgba(225,244,255,.75)'; c.lineWidth = .7; c.lineCap = 'round';
      for (var zr = Z0 + .1; zr < Z1; zr += .17) { var xr = .05 + .12 * Math.sin(zr * 1.9) + .02 * Math.sin(zr * 7), r0 = P(xr - .025, 0, zr), r1 = P(xr + .02, 0, zr + .05); c.beginPath(); c.moveTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.stroke(); }
      c.restore();
      // unidades (tanques de agua) sobre la ladera: cilindros blancos con su sombra
      for (var j = DET.length - 1; j >= 0; j--) {
        var d = DET[j], q5 = Ps([d.x, d.y, d.z]);
        if (q5[0] < vb.x - 10 || q5[0] > vb.x + vb.width + 10) continue;
        c.fillStyle = 'rgba(60,44,30,.25)'; c.beginPath(); c.ellipse(q5[0] + 2.3, q5[1] + .8, 5, 1.8, 0, 0, 2 * Math.PI); c.fill();
        c.fillStyle = '#C3C9CB'; c.fillRect(q5[0] - 3.9, q5[1] - 5.6, 7.8, 5.6);
        c.fillStyle = '#D9DEDF'; c.fillRect(q5[0] - 3.9, q5[1] - 5.6, 2.8, 5.6);
        c.fillStyle = '#A9B1B5'; c.beginPath(); c.ellipse(q5[0], q5[1], 3.9, 1.5, 0, 0, Math.PI); c.fill();
        c.fillStyle = '#F2F4F1'; c.beginPath(); c.ellipse(q5[0], q5[1] - 5.6, 3.9, 1.5, 0, 0, 2 * Math.PI); c.fill();
        c.strokeStyle = 'rgba(70,80,88,.4)'; c.lineWidth = .4; c.stroke();
        // matitas al pie de algunos tanques: les dan profundidad y aire entre ellos
        var hz = Math.abs(Math.sin(j * 12.9898) * 43758.5453) % 1;
        if (hz < .55) {
          var nb = 2 + Math.floor(hz * 7) % 3, lado = hz < .27 ? -1 : 1;
          c.lineWidth = .7; c.lineCap = 'round';
          for (var m2 = 0; m2 < nb; m2++) {
            var bx = q5[0] + lado * (2.2 + m2 * 1.6) - (m2 % 2) * lado * 3.8, by = q5[1] + .9 + (m2 % 2) * .4, lb = 3.2 + ((hz * 31 + m2 * 7) % 1) * 2.6;
            c.strokeStyle = (m2 + j) % 3 ? 'rgba(86,140,52,1)' : 'rgba(150,170,70,1)';
            c.beginPath();
            for (var h2 = -1; h2 <= 1; h2++) { c.moveTo(bx + h2 * .5, by); c.quadraticCurveTo(bx + h2 * .4, by - lb * .6, bx + h2 * lb * .35 + lado * .3, by - lb * (1 - .15 * Math.abs(h2))); }
            c.stroke();
          }
          c.lineCap = 'butt';
        }
      }
      difumina(c, true);
      // rótulo mínimo del observatorio sobre la ladera instrumentada
      c.fillStyle = 'rgba(70,54,42,.95)'; c.font = '700 11px "Space Mono", monospace'; c.fillText('TAMBO', TMB[0], TMB[1]);
      c.font = '400 9px "Space Mono", monospace'; c.fillStyle = 'rgba(92,70,54,.75)'; c.fillText('red de detectores en la ladera', TMB[0], TMB[1] + 13);
    }
    // la maqueta se disuelve hacia la izquierda, como la de Stern–Gerlach: empieza en la cordillera, sin corte duro
    var DIF0 = 572, DIF1 = 805, DIFR0 = 1230, DIFR1 = 1415, DIFY = 340;
    function difumina(c, der) {
      var D0 = DIF0, D1 = DIF1;
      c.save(); c.globalCompositeOperation = 'destination-out';
      var g = c.createLinearGradient(D0, 0, D1, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.3, 'rgba(0,0,0,.8)'); g.addColorStop(.65, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(D0 - 400, -50, D1 - D0 + 400, 1100);
      // a la derecha solo se disuelve la maqueta (debajo del origen astrofísico)
      var g2 = c.createLinearGradient(DIFR0, 0, DIFR1, 0); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.45, 'rgba(0,0,0,.5)'); g2.addColorStop(1, 'rgba(0,0,0,1)');
      if (der) { c.fillStyle = g2; c.fillRect(DIFR0, DIFY, 1600 - DIFR0, 1100); } c.restore();
    }

    // ── dibujo por cuadro ──
    var W = 0, H = 0, dpr = 1, T = 0, fijo = false;
    function trazo(a, b, col, ancho, guion) { ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.setLineDash(guion || []); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
    // brillos: un sprite radial por color, precalculado (dibujar una imagen es mucho más barato que crear un degradado por cuadro)
    var GLOW = {}, nGlow = 0;
    function sprGlow(rgb) {
      var S = 64, c = document.createElement('canvas'); c.width = c.height = S;
      var x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); return c;
    }
    function brillo(x, y, r, rgb, a) {
      if (a <= 0 || r <= 0) return;
      var sp = GLOW[rgb]; if (!sp) { if (++nGlow > 96) { GLOW = {}; nGlow = 1; } sp = GLOW[rgb] = sprGlow(rgb); }
      var ga = ctx.globalAlpha; ctx.globalAlpha = ga * Math.min(1, a); ctx.drawImage(sp, x - r, y - r, 2 * r, 2 * r); ctx.globalAlpha = ga;
    }
    function sprite(c, x, y, r) { ctx.drawImage(c, x - r, y - r, 2 * r, 2 * r); }
    function rotulo(s, x, y, col, tam) {
      tam = tam || 16; ctx.fillStyle = col; ctx.strokeStyle = 'rgba(255,253,248,.92)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      trozos(s).forEach(function (q) { var k = q[1] ? .68 : 1, yy = y + (q[1] ? tam * .28 : 0); ctx.font = 'italic 500 ' + (tam * k).toFixed(1) + 'px "Cormorant Garamond", serif'; ctx.strokeText(q[0], x, yy); ctx.fillText(q[0], x, yy); x += ctx.measureText(q[0]).width + (q[1] ? 1 : .5); });
    }
    // texto mono con halo blanco (para que ninguna línea lo atraviese visualmente)
    function texto(c, s, x, y, col, font, al) { c.font = font; c.lineJoin = 'round'; c.strokeStyle = 'rgba(255,253,248,.92)'; c.lineWidth = 3; c.textAlign = al || 'start'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.textAlign = 'start'; }
    // línea con borde blanco: primero blanco más ancho, luego el color
    function trazoB(a, b, col, ancho, guion) { trazo(a, b, 'rgba(255,253,248,.95)', ancho + 2.2, guion); trazo(a, b, col, ancho, guion); }
    // cometa: solo la cabeza y una estela corta que se desvanece (no queda trayectoria)
    function cometa(a, b, u, cola, col, ancho, al) {
      var L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u0 = Math.max(0, u - cola / L);
      var h = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], e = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0];
      var g = ctx.createLinearGradient(e[0], e[1], h[0], h[1]); g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',' + al + ')');
      var gw = ctx.createLinearGradient(e[0], e[1], h[0], h[1]); gw.addColorStop(0, 'rgba(255,253,248,0)'); gw.addColorStop(1, 'rgba(255,253,248,' + (.95 * al) + ')');
      ctx.lineCap = 'round'; trazo(e, h, gw, ancho + 2.2); trazo(e, h, g, ancho); ctx.lineCap = 'butt';
      return h;
    }
    function fade(t) { return 1 - suave((t - T_FUN) / (LOOP - T_FUN - .2)); }

    // ── origen astrofísico: trayectorias rectas que se quedan dibujadas (como en una cámara de burbujas) ──
    // p (rayo cósmico, láser celeste) + γ → Δ⁺ → n + π⁺;  π⁺ → μ⁺ + ν_μ;  μ⁺ → e⁺ + ν_e + ν̄_μ;  n → p + e⁻ + ν̄_e.
    // El ν_μ que nos importa sale recto hacia la montaña y oscila en el camino a ν_τ (no a escala).
    var OR = (function () {
      var C = [MED.x - 20, MED.y - 18], S = [C[0] - 380, C[1] - 86], G = [C[0] + 150, C[1] + 26];
      function pt(a, d, L) { var l = Math.hypot(d[0], d[1]); return [a[0] + d[0] / l * L, a[1] + d[1] / l * L]; }
      var D1 = pt(C, [.8, .5], 48), D2 = pt(D1, [1, -.05], 62), N1 = pt(C, [1, -.42], 118);
      var E = Ps(sobre(VTX, -1.55));
      // cada traza: desde, hasta, t de inicio, t de fin, color, ancho, guion, rótulo
      var T = [
        { a: S, b: C, t0: 0, t1: .55, col: '45,183,232', w: 1.7, lab: 'p', laser: true },
        { a: G, b: C, t0: .2, t1: .55, col: '196,150,40', w: 1, g: [3, 3], lab: 'γ' },
        { a: C, b: N1, t0: .55, t1: 1.25, col: '120,108,94', w: 1.1, lab: 'n' },
        { a: C, b: D1, t0: .55, t1: .75, col: '120,80,200', w: 1.2, lab: 'π⁺' },
        { a: D1, b: D2, t0: .75, t1: 1.05, col: '50,130,170', w: 1.1, lab: 'μ⁺' },
        { a: D2, b: pt(D2, [.55, -.85], 44), t0: 1.05, t1: 1.4, col: '196,70,120', w: .9, lab: 'e⁺' },
        { a: D2, b: pt(D2, [1, .3], 74), t0: 1.05, t1: 1.5, col: '170,55,125', w: .8, g: [2, 3], lab: 'ν_e' },
        { a: D2, b: pt(D2, [.35, 1], 52), t0: 1.05, t1: 1.45, col: '170,55,125', w: .8, g: [2, 3], lab: 'ν̄_μ' },
        { a: N1, b: pt(N1, [.9, -.2], 30), t0: 1.25, t1: 1.45, col: '190,80,60', w: 1, lab: 'p' },
        { a: N1, b: pt(N1, [.3, -1], 38), t0: 1.25, t1: 1.5, col: '196,70,120', w: .8, lab: 'e⁻' },
        { a: N1, b: pt(N1, [1, .25], 46), t0: 1.25, t1: 1.55, col: '170,55,125', w: .8, g: [2, 3], lab: 'ν̄_e' }
      ];
      return { C: C, S: S, D1: D1, D2: D2, N1: N1, E: E, T: T };
    })();
    var T_OFIN = 3.95;   // las trazas del origen quedan medio transparentes hasta aquí y luego se desvanecen juntas
    function medallon(t) {
      var fd = fade(t), r = semilla(5);
      for (var i = 0; i < 30; i++) { var ra = MED.r * Math.sqrt(r()) * 1.1, an = r() * 2 * Math.PI, x = OR.C[0] + ra * Math.cos(an), y = OR.C[1] + ra * Math.sin(an) * .7; ctx.fillStyle = 'rgba(185,140,70,' + (.15 + .25 * (.5 + .5 * Math.sin(t * 2 + i))) + ')'; ctx.fillRect(x, y, 1.2, 1.2); }
      OR.T.forEach(function (q) {
        if (t < q.t0) return;
        var u = cl((t - q.t0) / (q.t1 - q.t0), 0, 1), rs = (1 - suave((t - T_OFIN) / .6)) * fd;   // todas las trazas se van juntas
        if (rs > 0) { var hq = [q.a[0] + (q.b[0] - q.a[0]) * u, q.a[1] + (q.b[1] - q.a[1]) * u]; ctx.globalAlpha = .35 * rs; trazo(q.a, hq, 'rgba(' + q.col + ',1)', q.laser ? 1.2 : q.w * .8, q.g); }
        var al = (1 - suave((t - q.t1) / .35)) * fd; if (al <= 0) { ctx.globalAlpha = 1; return; }
        ctx.globalAlpha = al;
        var b = cometa(q.a, q.b, u, q.laser ? 120 : 34, q.col, q.laser ? 2 : q.w + .3, 1);
        if (q.laser) { var b2 = cometa(q.a, q.b, u, 60, '225,248,255', .7, .9); }
        brillo(b[0], b[1], q.laser ? 16 : 9, q.col, .8); ctx.fillStyle = 'rgb(' + q.col + ')'; ctx.beginPath(); ctx.arc(b[0], b[1], q.laser ? 2.4 : 1.6, 0, 2 * Math.PI); ctx.fill();
        if (u > .25) rotulo(q.lab, b[0] + 5, b[1] - 5, 'rgba(' + q.col + ',1)', 14);
        ctx.globalAlpha = 1;
      });
      ctx.globalAlpha = .9 * fd * suave(t / .25) * (1 - suave((t - T_OFIN) / .6)); if (ctx.globalAlpha > 0) texto(ctx, 'RAYO CÓSMICO · PROTÓN DE ~10¹⁷ eV', OR.S[0] + 110, OR.S[1] + 8, 'rgba(30,120,160,1)', '700 9px "Space Mono", monospace'); ctx.globalAlpha = 1;
      // vértices: destellos breves al dividirse
      [[OR.C, .55, 'Δ⁺'], [OR.D1, .75], [OR.D2, 1.05], [OR.N1, 1.25]].forEach(function (v) { var w = t - v[1]; if (w > 0 && w < .5) { brillo(v[0][0], v[0][1], 26 * (1 - w / .5) + 4, '240,150,70', .9 * (1 - w / .5)); if (v[2]) rotulo(v[2], v[0][0] - 14, v[0][1] + 20, '#A84A2E', 14); } });
    }

    // el ν_μ que importa: una recta desde la desintegración del π⁺ hasta la roca; cambia de azul (ν_μ) a magenta (ν_τ)
    // por la oscilación y su trayectoria queda dibujada. Ya en la roca va hasta el vértice.
    var T_PAS = 1.4, T_NU0 = .75, U_SUELO = null;
    // dónde toca la recta del ν el suelo de los Andes (en pantalla): ahí termina su hilo celeste
    function sueloNu(A, B) {
      for (var u = 0; u <= 1; u += .005) {
        var sx = A[0] + (B[0] - A[0]) * u, sy = A[1] + (B[1] - A[1]) * u;
        for (var z = Z0; z <= Z1; z += .05) { var x3 = (sx - CAM.cx) / CAM.s - KZ * z; if (x3 < BX0 || x3 > BX1) continue; if (sy >= CAM.cy - CAM.s * (alto(x3, z) + KY * z)) return u; }
      }
      return 1;
    }
    function neutrino(t) {
      var fd = fade(t), A = OR.D1, B = OR.E;
      // el camino completo, desde el protón: queda como un hilo celeste muy tenue hasta el suelo
      ctx.globalAlpha = fd;
      [[OR.S, OR.C, 0, .55], [OR.C, OR.D1, .55, .75]].forEach(function (g) { if (t > g[2]) { var w = cl((t - g[2]) / (g[3] - g[2]), 0, 1); trazo(g[0], [g[0][0] + (g[1][0] - g[0][0]) * w, g[0][1] + (g[1][1] - g[0][1]) * w], 'rgba(90,180,225,.15)', 1.1); } });
      ctx.globalAlpha = 1;
      if (t > T_NU0 && fd > 0) {
        var u = cl((t - T_NU0) / (T_PAS - T_NU0), 0, 1), cn = u < .55 ? [50 + 70 * u / .55, 120 - 40 * u / .55, 190 - 20 * u / .55] : [120 + 50 * (u - .55) / .45, 80 - 25 * (u - .55) / .45, 170 - 45 * (u - .55) / .45];
        cn = cn.map(Math.round).join(',');
        var hN = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u];
        if (U_SUELO === null) U_SUELO = sueloNu(A, B);
        var hS = [A[0] + (B[0] - A[0]) * Math.min(u, U_SUELO), A[1] + (B[1] - A[1]) * Math.min(u, U_SUELO)];
        ctx.globalAlpha = fd; trazo(A, hS, 'rgba(90,180,225,.15)', 1.1);   // su recorrido queda como un hilo celeste muy tenue
        var aN = (1 - suave((t - T_PAS) / .3)) * fd;
        if (aN > 0) { ctx.globalAlpha = aN; var q = cometa(A, B, u, 70, cn, 1.6, 1); brillo(q[0], q[1], 12, cn, .8); ctx.fillStyle = 'rgb(' + cn + ')'; ctx.beginPath(); ctx.arc(q[0], q[1], 2.2, 0, 2 * Math.PI); ctx.fill(); }
        if (u > .5) {
          var m = [A[0] + (B[0] - A[0]) * .3, A[1] + (B[1] - A[1]) * .3];
          ctx.globalAlpha = fd * suave((u - .5) / .3) * (1 - suave((t - T_VTX - .6) / .8));
          texto(ctx, 'OSCILA EN EL CAMINO', m[0] + 16, m[1] - 4, 'rgba(92,70,54,.95)', '700 10px "Space Mono", monospace');
          rotulo('ν_μ → ν_τ', m[0] + 16, m[1] + 15, '#963270', 16);
        }
        ctx.globalAlpha = 1;
      }
      if (t < T_PAS) return;
      var uu = cl((t - T_PAS) / (T_VTX - T_PAS), 0, 1), a = Ps(sobre(VTX, -1.55)), cab = Ps(sobre(VTX, -1.55 + 1.55 * uu)), al = fade(t);
      ctx.globalAlpha = al;
      // la traza que queda nace desvanecida a la derecha: no pasa bajo la ecuación de la página
      var gw = ctx.createLinearGradient(1222, 0, 1186, 0), gc = ctx.createLinearGradient(1222, 0, 1186, 0);
      gw.addColorStop(0, 'rgba(255,253,248,0)'); gw.addColorStop(1, 'rgba(255,253,248,.95)'); gc.addColorStop(0, 'rgba(170,55,125,0)'); gc.addColorStop(1, 'rgba(170,55,125,.95)');
      trazo(a, cab, gw, 3.6, [5, 4]); trazo(a, cab, gc, 1.4, [5, 4]);
      if (t < T_VTX) { brillo(cab[0], cab[1], 14, '170,55,125', .6); ctx.fillStyle = '#B23C82'; ctx.beginPath(); ctx.arc(cab[0], cab[1], 2, 0, 2 * Math.PI); ctx.fill(); rotulo('ν_τ', cab[0] - 4, cab[1] - 12, '#9C2F6E', 20); }
      ctx.globalAlpha = 1;
    }

    function tau(t) {
      var vt = A_VTX, ui = t - T_VTX; if (ui < 0) return;
      var al = fade(t);
      ctx.globalAlpha = al;
      if (ui < 1.2) brillo(vt[0], vt[1], 46 * (1 - ui / 1.2) + 6, '235,140,60', .9 * (1 - ui / 1.2));
      var rr = semilla(3), cr = Math.min(1, ui / .5);
      ctx.strokeStyle = 'rgba(180,105,55,' + (.65 * (1 - suave((ui - 3) / 3))) + ')'; ctx.lineWidth = .7; ctx.beginPath();
      for (var k = 0; k < 18; k++) { var an = Math.PI * (.78 + .44 * rr()) + (rr() - .5) * .9, l = (7 + 15 * rr()) * cr; ctx.moveTo(vt[0], vt[1]); ctx.lineTo(vt[0] + Math.cos(an) * l, vt[1] + Math.sin(an) * l); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150,100,50,.85)'; ctx.lineWidth = .9; ctx.beginPath();
      for (var j = 0; j <= 14; j++) { var ra = j % 2 ? 3.5 : 10 * suave(ui / .35), ang = j / 14 * 2 * Math.PI + .3, px = vt[0] + Math.cos(ang) * ra, py = vt[1] + Math.sin(ang) * ra * .8; if (!j) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke();
      var sT = t < T_CARA ? L_ROCA * suave(ui / (T_CARA - T_VTX)) : L_ROCA + L_TAU * suave((t - T_CARA) / (T_DEC - T_CARA));
      var q1 = Ps(sobre(VTX, Math.min(sT, L_ROCA)));
      trazoB(vt, q1, 'rgba(181,106,30,.95)', 1.8);
      var cab = q1;
      if (sT > L_ROCA) { cab = Ps(sobre(VTX, sT)); trazoB(q1, cab, 'rgba(181,106,30,.95)', 1.8); }
      if (t < T_DEC) { brillo(cab[0], cab[1], 12, '220,110,60', .55); ctx.fillStyle = 'rgba(244,210,165,.3)'; ctx.beginPath(); ctx.arc(cab[0], cab[1], 3.5, 0, 2 * Math.PI); ctx.fill(); ctx.fillStyle = '#B8641E'; ctx.beginPath(); ctx.arc(cab[0], cab[1], 2.2, 0, 2 * Math.PI); ctx.fill(); rotulo('τ⁻', cab[0] - 6, cab[1] - 14, '#9A4E16', 20); }
      var ud = t - T_DEC;
      if (ud > 0) {
        var d = Ps(DEC);
        if (ud < .45) { var fl = ud < .1 ? ud / .1 : 1 - suave((ud - .1) / .3); brillo(d[0], d[1], 40 * fl + 4, '255,170,60', .9 * fl); brillo(d[0], d[1], 14 * fl + 2, '255,248,239', fl); ctx.strokeStyle = 'rgba(242,154,56,' + (.55 * (1 - ud / .45)) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(d[0], d[1], 5 + 60 * ud, 0, 2 * Math.PI); ctx.stroke(); }
        var nuF = Ps(sobre(DEC, Math.min(L_CRUCE * .95, ud * .9))), qn = [nuF[0], nuF[1] + 10];
        ctx.globalAlpha = al * Math.max(0, 1 - Math.max(0, ud - 1) / .8);   // se va antes de que la cascada alcance su rótulo
        trazoB(d, qn, 'rgba(170,55,125,.8)', .9, [1.5, 3]); rotulo('ν_τ', qn[0] + 3, qn[1] + 12, '#A33F7C', 13);
      }
      ctx.globalAlpha = 1;
    }

    // cascada: una población de partículas, no un haz. Componente electromagnética (e±, γ) en cian claro,
    // trazas finas que nacen a lo largo del eje y se abren; hadrones/muones escasos, puntos ámbar más gruesos.
    var LOTES = [[], [], [], [], [], []], ESTELA = [], CAB = [], CABH = [];
    function cascada(t) {
      if (t < T_DEC) return;
      var sf = frente(t), crec = cl(sf / L_CRUCE, 0, 1), fin = (1 - .75 * suave((t - T_LLEGA) / 2)) * fade(t);
      if (fin <= 0) return;
      var dens = .2 + .8 * suave((t - T_DEC - .5) / 1.4);   // semilla → abanico → fase madura
      LOTES.forEach(function (l) { l.length = 0; }); ESTELA.length = 0; CAB.length = 0; CABH.length = 0;
      RAY.forEach(function (R) {
        if (sf < R.sb || R.q > (R.nuc ? .62 * dens : dens)) return;
        var s1 = Math.min(sf, R.fin), s0 = Math.max(R.sb, s1 - R.tr * L_CRUCE * (R.mu ? .45 : R.oro ? .1 : R.a > .82 ? .3 : .11)); if (s1 <= s0) return;
        var a = Ps(puntoRayo(R, s0)), b = Ps(puntoRayo(R, s1));
        if (s0 > R.sb && R.a < .5 && !R.mu) { var e0 = Ps(puntoRayo(R, R.sb)); ESTELA.push(e0[0], e0[1], a[0], a[1]); }
        LOTES[R.mu ? 5 : R.oro ? 4 : Math.min(3, Math.floor(R.a * 4))].push(a[0], a[1], b[0], b[1]);
        if (s1 < R.fin && !R.mu) { if (R.oro) CABH.push(b[0], b[1], .8 + R.tr * .6); else if (R.a < .6) CAB.push(b[0], b[1]); }
      });
      var resalta = foco === 'cascada' ? 1.6 : 1;
      // halo claro bajo la cascada: la separa del pasto y de los tanques sin cambiar sus colores
      for (var hk = 0; hk <= 10; hk++) { var sh = Math.max(0, sf - L_CRUCE * .55 * hk / 10), ph = Ps(sobre(DEC, Math.min(sh, L_CRUCE))); brillo(ph[0], ph[1], 8 + 18 * crec * (1 - hk / 12), '255,252,240', (t > T_DEC + 1.3 ? .14 : .2) * fin * (1 - hk / 11)); }
      LOTES.forEach(function (l, k) {
        if (!l.length) return;
        var al = Math.min(1, (k === 5 ? .45 : k === 4 ? .7 : Math.max(3.3 * (.035 + k * .025) * (k === 3 ? 1.05 : 1) * (k >= 2 && t > T_DEC + 1.3 ? .88 : 1), .18 * (1 - crec) + .11 * crec)) * fin * resalta);
        ctx.strokeStyle = k === 5 ? 'rgba(123,76,226,' + al + ')' : k === 4 ? 'rgba(229,110,17,' + al + ')' : 'rgba(0,109,204,' + al + ')'; ctx.lineWidth = k === 5 ? .9 : k === 4 ? .9 : .5 + k * .13;
        ctx.beginPath(); for (var i = 0; i < l.length; i += 4) { ctx.moveTo(l[i], l[i + 1]); ctx.lineTo(l[i + 2], l[i + 3]); } ctx.stroke();
      });
      if (ESTELA.length) { ctx.strokeStyle = 'rgba(40,120,165,' + (.012 * fin * resalta) + ')'; ctx.lineWidth = .5; ctx.beginPath(); for (var e = 0; e < ESTELA.length; e += 4) { ctx.moveTo(ESTELA[e], ESTELA[e + 1]); ctx.lineTo(ESTELA[e + 2], ESTELA[e + 3]); } ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,109,204,' + ((t - T_DEC < .9 ? .92 : .85) * fin * (1 - .4 * crec)) + ')';
      for (var i = 0; i < CAB.length; i += 2) ctx.fillRect(CAB[i] - .7, CAB[i + 1] - .7, 1.4, 1.4);
      ctx.fillStyle = 'rgba(229,110,17,' + (.85 * fin) + ')';
      for (i = 0; i < CABH.length; i += 3) { ctx.beginPath(); ctx.arc(CABH[i], CABH[i + 1], CABH[i + 2] * .5 + .5, 0, 2 * Math.PI); ctx.fill(); }
      // eje: tenue, para no leerse como un láser
      var c0 = Ps(sobre(DEC, Math.max(0, sf - L_CRUCE * .3))), c1 = Ps(sobre(DEC, Math.min(sf, L_CRUCE)));
      var gl = ctx.createLinearGradient(c0[0], c0[1], c1[0], c1[1]); gl.addColorStop(0, 'rgba(50,90,130,0)'); gl.addColorStop(1, 'rgba(50,90,130,' + (.18 * fin) + ')');
      ctx.strokeStyle = gl; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.stroke();
      // el frente: un disco delgado (≈ 2 R_M) que avanza a c
      if (sf < L_CRUCE * 1.01) {
        var c = sobre(DEC, sf), rd = R_M * 1.4 * crec + .02, pc = Ps(c), p1 = Ps([c[0] + E2[0] * rd, c[1] + E2[1] * rd, c[2] + E2[2] * rd]), p2 = Ps([c[0] + E1[0] * rd, c[1] + E1[1] * rd, c[2] + E1[2] * rd]);
        var rx = Math.max(2, Math.hypot(p2[0] - pc[0], p2[1] - pc[1])), ry = Math.max(2, Math.hypot(p1[0] - pc[0], p1[1] - pc[1]));
        ctx.globalCompositeOperation = 'source-over'; brillo(pc[0], pc[1], Math.max(rx, ry) * 1.6 + 6, '40,120,165', .09 * fin); ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(50,90,130,' + (.5 * fin) + ')'; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.ellipse(pc[0], pc[1], rx, ry, Math.atan2(p1[1] - pc[1], p1[0] - pc[0]) - Math.PI / 2, 0, 2 * Math.PI); ctx.stroke();
      }
    }

    // mediciones: cada unidad con señal se enciende a su tiempo, con una barra ∝ log del número de partículas
    function senales(t) {
      var al0 = fade(t);
      VIVOS.forEach(function (d) {
        var u = t - tHit(d); if (u < 0) return;
        var q = Ps([d.x, d.y, d.z]), k = T1H > T0H ? (d.t - T0H) / (T1H - T0H) : 0, col = paleta(k);
        var a = Math.min(1, u / .15) * al0, hb = (10 + 6 * Math.log10(1 + d.n)) * suave(u / .5);
        var y0 = q[1] - 5.6, rx = 4.1, ry = 1.6;
        ctx.globalAlpha = a;
        // como al señalar la ladera: solo la tapita se pinta, del color de su tiempo de llegada
        brillo(q[0], y0, 7, '255,255,255', .4 * a * (1 - suave(u / .14)));
        ctx.fillStyle = 'rgb(' + col + ')'; ctx.beginPath(); ctx.ellipse(q[0], y0, rx, ry, 0, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .9; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(q[0] - rx * .25, y0 - ry * .2, rx * .45, ry * .4, 0, 0, 2 * Math.PI); ctx.fill();
        // barra de tiempo con borde blanco
        // el borde blanco solo arriba: donde la barra toca su tapita no lleva delineado
        if (hb > 4) { ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,253,248,.95)'; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(q[0], y0 - 4); ctx.lineTo(q[0], y0 - hb); ctx.stroke(); ctx.lineCap = 'butt'; }
        ctx.strokeStyle = 'rgb(' + col + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q[0], y0); ctx.lineTo(q[0], y0 - hb); ctx.stroke();
        if (u < .12) { ctx.strokeStyle = 'rgba(255,255,255,' + (1 - u / .12) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(q[0], y0, rx * 1.35, ry * 1.35, 0, 0, 2 * Math.PI); ctx.stroke(); }
        var p1 = Math.max(0, 1 - u / .7); if (p1 > 0) { ctx.strokeStyle = 'rgba(' + col + ',' + (.85 * p1) + ')'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(q[0], y0, rx + 8 * (1 - p1), ry + 3.4 * (1 - p1), 0, 0, 2 * Math.PI); ctx.stroke(); }
        ctx.globalAlpha = 1;
      });
    }
    // línea de tiempos de llegada (registro del evento): una marca por detector, a su tiempo, en su color
    function llegadas(t) {
      var a = suave((t - T_H0 + .3) / .5) * fade(t); if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,247,234,.55)'; ctx.fillRect(LT.x0 - 6, LT.y - 15, LT.x1 - LT.x0 + 12, 16);
      ctx.strokeStyle = 'rgba(120,100,80,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(LT.x0, LT.y); ctx.lineTo(LT.x1, LT.y); ctx.moveTo(LT.x0, LT.y - 3); ctx.lineTo(LT.x0, LT.y + 3); ctx.moveTo(LT.x1, LT.y - 3); ctx.lineTo(LT.x1, LT.y + 3); ctx.stroke();
      VIVOS.forEach(function (d) {
        var u = t - tHit(d); if (u < 0) return;
        var k = T1H > T0H ? (d.t - T0H) / (T1H - T0H) : 0, x = LT.x0 + (LT.x1 - LT.x0) * k, hb = 9 + 2.2 * Math.log10(1 + d.n);
        ctx.strokeStyle = 'rgb(' + paleta(k) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, LT.y - 1); ctx.lineTo(x, LT.y - 1 - (2 + (hb - 2) * suave(u / .12))); ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(80,100,120,.32)'; ctx.lineWidth = .6; ctx.setLineDash([1.5, 2]); ctx.beginPath(); ctx.moveTo(LT.x0 + 30, LT.y + 22); ctx.lineTo(A_IMP[0] + 6, A_IMP[1] - 30); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#201B1C'; ctx.font = '700 10px "Space Mono", monospace';
      ctx.fillText('LLEGADAS A LOS DETECTORES', LT.x0, LT.y - 26);
      ctx.fillStyle = 'rgba(92,70,54,.85)'; ctx.font = '400 11px "Space Mono", monospace';
      ctx.fillText('0', LT.x0 - 3, LT.y + 15); ctx.textAlign = 'end'; ctx.fillText(coma(T1H - T0H, 2) + ' µs', LT.x1 + 3, LT.y + 15); ctx.textAlign = 'start';
      ctx.globalAlpha = 1;
    }
    // inferencia (no partícula), en tres tiempos: primero el frente ajustado a las llegadas, luego el eje
    // reconstruido que sale de él y al final el cono que contiene el 68 % de las repeticiones
    function reconstruye(t) {
      var fd = fade(t), uf = suave((t - T_REC) / .5) * fd; if (uf <= 0) return;
      var a = Ps(sobre(IMP, -1.75)), b = A_IMP, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var h = .5 * uf, fa = Ps([IMP[0] + E2[0] * h, IMP[1] + E2[1] * h, IMP[2] + E2[2] * h]), fb = Ps([IMP[0] - E2[0] * h, IMP[1] - E2[1] * h, IMP[2] - E2[2] * h]);
      ctx.globalAlpha = uf; ctx.globalAlpha = uf * .72; trazo(fa, fb, 'rgba(255,255,255,.6)', 3, [5, 4]); trazo(fa, fb, '#231F20', 1.4, [5, 4]); ctx.globalAlpha = uf;
      [fa, fb].forEach(function (p) { ctx.fillStyle = 'rgba(255,253,248,.95)'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, 2 * Math.PI); ctx.fill(); ctx.fillStyle = '#22201E'; ctx.beginPath(); ctx.arc(p[0], p[1], 1.5, 0, 2 * Math.PI); ctx.fill(); });
      // rótulo: separado del frente, hacia el lado contrario al eje (la cascada llega por la derecha)
      var lo = fa[0] < fb[0] ? fa : fb, ex = fa[0] - fb[0], ey = fa[1] - fb[1], el = Math.hypot(ex, ey) || 1;
      texto(ctx, 'FRENTE AJUSTADO', lo[0] - 7, lo[1] + 13, '#22201E', '700 9px "Space Mono", monospace', 'end');
      var ue = suave((t - T_REC - .5) / .5) * fd;
      if (ue > 0) {
        var lv = L * ue;
        ctx.globalAlpha = ue;
        trazoB([b[0] - Math.cos(ang) * lv, b[1] - Math.sin(ang) * lv], b, '#181415', 2.2, [6, 3]);
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - 9 * Math.cos(ang - .35), b[1] - 9 * Math.sin(ang - .35)); ctx.lineTo(b[0] - 9 * Math.cos(ang + .35), b[1] - 9 * Math.sin(ang + .35)); ctx.closePath();
        ctx.strokeStyle = 'rgba(255,253,248,.95)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fillStyle = '#22201E'; ctx.fill();
        if (ue > .9) texto(ctx, 'EJE RECONSTRUIDO', b[0] - L * Math.cos(ang) * .62, b[1] - L * Math.sin(ang) * .62 - 12, '#22201E', '700 9px "Space Mono", monospace');
      }
      var uc = suave((t - T_REC - 1) / .4) * fd;
      if (uc > 0 && AJ) {
        var dA = AJ.p68 * Math.PI / 180;
        ctx.globalAlpha = uc; ctx.beginPath();
        ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - L * Math.cos(ang - dA), b[1] - L * Math.sin(ang - dA)); ctx.lineTo(b[0] - L * Math.cos(ang + dA), b[1] - L * Math.sin(ang + dA)); ctx.closePath();
        ctx.fillStyle = 'rgba(42,37,38,.22)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,253,248,.85)'; ctx.lineWidth = .6; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // detalles: brillo del río y un cóndor que planea
    function rioVivo(t) {
      ctx.globalCompositeOperation = 'source-over';
      for (var k = 0; k < 7; k++) { var w = (t * .25 + k * .6) % 4.2, q = rio(Z0 + w * (Z1 - Z0) / 4.2); brillo(q[0], q[1], 7, '90,150,190', .35 * Math.sin(Math.PI * w / 4.2)); }
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
    // pasto fijo: matas en todos los Andes (verde en las terrazas, ichu dorado al subir) y algunas piedras;
    // se pinta una sola vez en el lienzo de fondo, así que no cuesta nada por cuadro
    var MATAS = [], PIEDRAS = [];
    (function () {
      var r = semilla(61), grid = {}, key = function (x, y) { return Math.floor(x / 7) + ',' + Math.floor(y / 7); };
      DET.forEach(function (d) { var q = Ps([d.x, d.y, d.z]); (grid[key(q[0], q[1])] = grid[key(q[0], q[1])] || []).push(q); });
      function cerca(q, r2) { var gx = Math.floor(q[0] / 7), gy = Math.floor(q[1] / 7); for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var L = grid[(gx + i) + ',' + (gy + j)]; if (L) for (var k = 0; k < L.length; k++) { var dx = q[0] - L[k][0], dy = q[1] - L[k][1]; if (dx * dx + dy * dy * 3 < r2) return true; } } return false; }
      for (var n = 0; n < 16000 && MATAS.length < 7000; n++) {
        var x = BX0 + .05 + r() * (BX1 - BX0 - .1), z = Z0 + .03 + r() * (Z1 - Z0 - .06), y = alto(x, z);
        if (y > 1.45 && r() < .6) continue;
        if (y < .06 && Math.abs(x - .05 - .12 * Math.sin(z * 1.9)) < .075) continue;   // deja libre el cauce
        var q = Ps([x, y, z]); if (cerca(q, 40)) continue;
        var prof = (z - Z0) / (Z1 - Z0), seco = cl((y - .1) / .5, 0, 1) * (.75 + .25 * r());
        MATAS.push({ x: q[0], y: q[1], l: (2.6 + 3.6 * r()) * (1 - .35 * prof), lean: (r() - .5) * 1.4, c: seco < .3 ? 0 : seco < .55 ? 1 : seco < .8 ? 2 : 3, s: r(), f: r() < .025 });
      }
      MATAS.sort(function (a, b) { return a.y - b.y; });
      for (n = 0; n < 400 && PIEDRAS.length < 34; n++) {
        x = BX0 + .2 + r() * (BX1 - BX0 - .4); z = Z0 + .1 + r() * (Z1 - Z0 - .2); y = alto(x, z);
        if (y < .05 && Math.abs(x - .05) < .3) continue;   // no en el río
        q = Ps([x, y, z]); if (cerca(q, 90)) continue;
        PIEDRAS.push({ x: q[0], y: q[1], w: (3 + 5 * r() * r()) * (1 - .3 * (z - Z0) / (Z1 - Z0)), h: .55 + .2 * r(), a: (r() - .5) * .4 });
      }
      // rocas grandes en el cerro de la derecha (blanco de roca): bloques facetados, como afloramientos reales
      for (n = 0; n < 900 && PIEDRAS.length < 34 + 15; n++) {
        x = 1.15 + r() * 3.4; z = Z0 + .15 + r() * (Z1 - Z0 - .3); y = alto(x, z);
        if (y < .2) continue;
        q = Ps([x, y, z]);
        if (PIEDRAS.some(function (o) { return o.g && Math.abs(o.x - q[0]) < 46 && Math.abs(o.y - q[1]) < 20; })) continue;
        PIEDRAS.push({ x: q[0], y: q[1], w: (20 + 20 * r()) * (1 - .3 * (z - Z0) / (Z1 - Z0)), h: .45 + .3 * r(), a: 0, g: true, z: z });
      }
      // arriba del cerro: más y más grandes (afloramientos), algunas en grupo
      for (n = 0; n < 1500 && PIEDRAS.length < 34 + 15 + 16; n++) {
        x = 1.6 + r() * 3.2; z = Z0 + .2 + r() * (Z1 - Z0 - .4); y = alto(x, z);
        if (y < .95) continue;
        q = Ps([x, y, z]);
        if (PIEDRAS.some(function (o) { return o.g && Math.abs(o.x - q[0]) < 40 && Math.abs(o.y - q[1]) < 16; })) continue;
        PIEDRAS.push({ x: q[0], y: q[1], w: (28 + 26 * r()) * (1 - .3 * (z - Z0) / (Z1 - Z0)), h: .38 + .3 * r(), a: 0, g: true, z: z });
        if (r() < .5) PIEDRAS.push({ x: q[0] + 14 + 10 * r(), y: q[1] + 3 + 3 * r(), w: 10 + 8 * r(), h: .5 + .2 * r(), a: 0, g: true, z: z });
      }
      var uS = sueloNu(OR.D1, OR.E), pS = [OR.D1[0] + (OR.E[0] - OR.D1[0]) * uS, OR.D1[1] + (OR.E[1] - OR.D1[1]) * uS];
      PIEDRAS = PIEDRAS.filter(function (o) { return !o.g || (Math.hypot(o.x - pS[0], (o.y - pS[1]) * 1.6) > 44 && o.z > Z0 + .4); });
      // forma de cada piedra: contorno superior irregular (6–8 vértices) y una arista desde la cumbre
      PIEDRAS.forEach(function (p) {
        var k = (p.g ? 6 : 5) + Math.floor(r() * 3), v = [], sesgo = (r() - .5) * .5;
        for (var i = 0; i <= k; i++) { var an = Math.PI * (1 - i / k), rr = .72 + .4 * r(); v.push([Math.cos(an) * rr * .5, -Math.max(.12, Math.sin(an + sesgo * Math.sin(an))) * rr * p.h * (i === 0 || i === k ? .2 + .2 * r() : 1)]); }
        var pk = 1; v.forEach(function (q, i) { if (q[1] < v[pk][1]) pk = i; }); if (pk === 0) pk = 1; if (pk === k) pk = k - 1;
        p.v = v; p.pk = pk; p.b = .05 + .2 * r(); p.gr = r() < .6 ? [.1 + .3 * r(), .2 + .4 * r()] : null;
      });
      PIEDRAS.sort(function (a, b) { return a.y - b.y; });
    })();
    var COL_PASTO = [['rgba(84,122,56,.85)', 'rgba(110,146,66,.85)'], ['rgba(132,150,70,.85)', 'rgba(150,160,78,.85)'], ['rgba(184,156,82,.88)', 'rgba(198,170,94,.88)'], ['rgba(170,134,70,.88)', 'rgba(150,118,62,.85)']];
    function pintaPasto(c) {
      var B = [[], [], [], [], [], [], [], []], flores = [];
      MATAS.forEach(function (m) {
        var L = B[m.c * 2 + (m.s < .5 ? 0 : 1)];
        for (var h = -2; h <= 2; h++) {
          if ((h === -2 || h === 2) && m.s < .4) continue;
          var lh = m.l * (1 - .14 * Math.abs(h)), tx = m.x + m.lean + h * lh * .32, ty = m.y - lh;
          L.push(m.x + h * .5, m.y, m.x + h * lh * .08 + m.lean * .3, m.y - lh * .55, tx, ty);
        }
        if (m.f) flores.push(m.x + m.lean, m.y - m.l, m.c);
      });
      c.lineWidth = .75; c.lineCap = 'round';
      B.forEach(function (Q, k) { if (!Q.length) return; c.strokeStyle = COL_PASTO[k >> 1][k & 1]; c.beginPath(); for (var j = 0; j < Q.length; j += 6) { c.moveTo(Q[j], Q[j + 1]); c.quadraticCurveTo(Q[j + 2], Q[j + 3], Q[j + 4], Q[j + 5]); } c.stroke(); });
      c.lineCap = 'butt';
      for (var j = 0; j < flores.length; j += 3) { c.fillStyle = flores[j + 2] > 1 ? '#E2B63E' : '#A866BE'; c.beginPath(); c.arc(flores[j], flores[j + 1], 1.3, 0, 2 * Math.PI); c.fill(); }
      PIEDRAS.forEach(function (p) {   // piedra facetada: la luz viene de la derecha (cara clara), la izquierda en sombra
        var W = p.g ? p.w : p.w * 2, X = function (q) { return p.x + q[0] * W; }, Y = function (q) { return p.y + q[1] * W; }, v = p.v, k = v.length - 1, B = [p.b, 0];
        c.fillStyle = 'rgba(60,44,30,.28)'; c.beginPath(); c.ellipse(p.x - W * .12, p.y + .6, W * .62, W * .14 + 1, 0, 0, 2 * Math.PI); c.fill();
        function cara(desde, hasta, col) { c.beginPath(); c.moveTo(X(B), Y(B)); for (var i = desde; i <= hasta; i++) c.lineTo(X(v[i]), Y(v[i])); c.closePath(); c.fillStyle = col; c.fill(); }
        cara(0, p.pk, p.g ? '#7C7367' : '#857C70');
        cara(p.pk, k, p.g ? '#B4AB9C' : '#ADA496');
        // cara superior: un triángulo claro junto a la cumbre
        var m = [(v[p.pk][0] + v[Math.min(k, p.pk + 1)][0]) / 2, (v[p.pk][1] + v[Math.min(k, p.pk + 1)][1]) / 2 + .08 * p.h];
        c.fillStyle = '#CFC6B6'; c.beginPath(); c.moveTo(X(v[p.pk]), Y(v[p.pk])); c.lineTo(X(v[Math.min(k, p.pk + 1)]), Y(v[Math.min(k, p.pk + 1)])); c.lineTo(X(m), Y(m)); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(58,50,42,.6)'; c.lineWidth = p.g ? .7 : .5; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(X(v[0]), Y(v[0])); for (var i = 1; i <= k; i++) c.lineTo(X(v[i]), Y(v[i])); c.closePath(); c.stroke();
        c.strokeStyle = 'rgba(58,50,42,.35)'; c.beginPath(); c.moveTo(X(v[p.pk]), Y(v[p.pk])); c.lineTo(X(B), Y(B)); c.stroke();
        if (p.g && p.gr) { c.strokeStyle = 'rgba(58,50,42,.3)'; c.lineWidth = .5; c.beginPath(); var g0 = [p.b + .12, -p.gr[0] * p.h]; c.moveTo(X(g0), Y(g0)); c.lineTo(X([g0[0] + .14, g0[1] - .1 * p.h]), Y([g0[0] + .14, g0[1] - .1 * p.h])); c.lineTo(X([g0[0] + .2, g0[1] + .04]), Y([g0[0] + .2, g0[1] + .04])); c.stroke(); }
        // un par de matas al pie de las grandes
        if (p.g) { c.strokeStyle = 'rgba(176,150,78,.95)'; c.lineWidth = .7; c.lineCap = 'round'; c.beginPath(); [-.42, .38].forEach(function (o, i) { var bx = p.x + o * W, by = p.y + .5; for (var h = -1; h <= 1; h++) { c.moveTo(bx + h * .5, by); c.quadraticCurveTo(bx + h * .4, by - 2.5, bx + h * 1.4, by - 4.2 - i); } }); c.stroke(); c.lineCap = 'butt'; }
      });
    }
    function realce() {
      if (foco === 'ladera') { ctx.fillStyle = '#5BB4E6'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = .9; DET.forEach(function (d) { var q = Ps([d.x, d.y, d.z]); ctx.beginPath(); ctx.ellipse(q[0], q[1] - 5.6, 3.9, 1.5, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); }); }
      if (foco === 'valle') { ctx.strokeStyle = 'rgba(50,130,180,.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); for (var z = Z0; z <= Z1; z += .05) { var q = rio(z); if (z === Z0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    }

    function dibuja(t) {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      var vb = svg.viewBox.baseVal;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = fondo.width = Math.round(w * d); lienzo.height = fondo.height = Math.round(h * d); claveFondo = ''; }
      var kx = W / vb.width * dpr, ky = H / vb.height * dpr, clave = [vb.x, vb.y, vb.width, vb.height, W, H, dpr].join();
      if (clave !== claveFondo) { claveFondo = clave; fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fondo.width, fondo.height); fctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky); pintaFondo(fctx, vb); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      rioVivo(t); realce();
      medallon(t); neutrino(t); tau(t); cascada(t); senales(t); llegadas(t); reconstruye(t);
      difumina(ctx);
    }

    function lecturas(t) {
      var us = microS(t);
      if (t < T_VTX) salida('neutrino tau · 10 PeV · casi horizontal', 'cruza kilómetros de roca');
      else if (t < T_CARA) salida('corriente cargada · nace un tau', 'τ ≈ 8 PeV · el resto queda en la roca');
      else if (t < T_DEC) salida('tau en el aire · ' + coma(L_TAU * 1000 * suave((t - T_CARA) / (T_DEC - T_CARA)), 0) + ' m', 't = ' + coma(us, 2) + ' µs');
      else if (t < T_LLEGA) { var X = frente(t) * 1e5 * RHO; salida('cascada · t = ' + coma(us, 1) + ' µs', 'X ≈ ' + coma(X, 0) + ' g/cm² · ' + cient(Math.max(1, greisen(X))) + ' e±'); }
      else if (t < T_REC) { var k = VIVOS.filter(function (d) { return t >= tHit(d); }).length; salida('detectores activados · ' + ('0' + k).slice(-2) + ' / ' + VIVOS.length, 'ventana de lectura · ' + coma((T1H - T0H) * cl((t - T_H0) / (T_H1 - T_H0), 0, 1), 3) + ' µs'); }
      else salida('error angular mediano simulado · ' + coma(AJ ? AJ.med : 0, 2) + '°', 'P68 ' + coma(AJ ? AJ.p68 : 0, 2) + '° · ' + NMC + ' realizaciones · ' + VIVOS.length + ' detectores · ventana ' + coma(T1H - T0H, 2) + ' µs');
    }

    fig.rcFija = function (t) { T = t; fijo = true; }; fig.rcSuelta = function () { fijo = false; };
    fig.rcFoco = function (id) { Object.keys(fichas).forEach(function (k) { fichas[k].pon(k === id); }); foco = id || null; };
    fig.rcInfo = function () { var m = DET.reduce(function (b, d) { var r = Math.hypot(d.x - IMP[0], d.y - IMP[1], d.z - IMP[2]); return r < b[0] ? [r, d] : b; }, [9, null]); return { IMP: IMP, cerca: m, L_ROCA: L_ROCA, L_TAU: L_TAU, L_CRUCE: L_CRUCE, X_IMP: X_IMP, N: N_IMP, vivos: VIVOS.length, det: DET.length, dt: T1H - T0H }; };
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (raiz) raiz.classList.toggle('rc-noche', false); if (on && !fig.rcOn) T = 0; fig.rcOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });
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
