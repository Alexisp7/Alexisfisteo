// III · Problemas de física — fisión del uranio-235, en cuatro capítulos.
//  I   Captura: un neutrón térmico entra en ²³⁵U; el núcleo compuesto ²³⁶U* queda excitado
//      (E* ≈ 6,5 MeV > barrera ≈ 6,2 MeV, valores de Krane) y oscila como una gota líquida.
//  II  Fisión: n + ²³⁵U → ¹⁴¹Ba + ⁹²Kr + 3n (Q ≈ 173 MeV con las masas atómicas);
//      los neutrones se evaporan de los fragmentos ya acelerados: ¹⁴²Ba* + ⁹⁴Kr* → ¹⁴¹Ba + ⁹²Kr + 3n..
//  III Reacción en cadena con alejamiento progresivo de la cámara.
//  IV  Cambio de escala hasta la explosión.
// Todo se pinta en un lienzo 2D (sin filtros por cuadro); el SVG encima solo lleva las notas.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function f(v) { return Math.round(v * 10) / 10; }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function suave(x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); }
  function salidaExp(x) { x = cl(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function semilla(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  // n puntos empaquetados en una esfera de radio R (relajación por repulsión de corto alcance)
  function empaca(n, R, s) {
    var rnd = semilla(s), p = [], r = R * Math.pow(.6 / n, 1 / 3), i, j, it;
    for (i = 0; i < n; i++) {
      var u = rnd() * 2 - 1, a = rnd() * 2 * Math.PI, q = Math.cbrt(rnd()) * (R - r), w = Math.sqrt(1 - u * u);
      p.push([q * w * Math.cos(a), q * w * Math.sin(a), q * u]);
    }
    for (it = 0; it < 70; it++) {
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1], dz = p[j][2] - p[i][2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-9, m = 2 * r;
        if (d < m) { var e = (m - d) / d * .5; p[i][0] -= dx * e; p[i][1] -= dy * e; p[i][2] -= dz * e; p[j][0] += dx * e; p[j][1] += dy * e; p[j][2] += dz * e; }
      }
      for (i = 0; i < n; i++) { var l = Math.hypot(p[i][0], p[i][1], p[i][2]), lim = R - r * .55; if (l > lim) { p[i][0] *= lim / l; p[i][1] *= lim / l; p[i][2] *= lim / l; } }
    }
    return { p: p, r: r };
  }

  // esfera sombreada para cada tipo de nucleón (se pinta una vez y se copia)
  function esfera(c0, c1, c2, borde) {
    var S = 96, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), g = x.createRadialGradient(S * .36, S * .32, S * .04, S * .5, S * .5, S * .5);
    g.addColorStop(0, c0); g.addColorStop(.55, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, 2 * Math.PI); x.fill();
    x.lineWidth = 2.2; x.strokeStyle = borde; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(S * .37, S * .31, S * .11, S * .07, -.6, 0, 2 * Math.PI); x.fill();
    return c;
  }

  window.escenaFision = function (svg, salida) {
    var fig = svg.parentNode, raiz = fig.closest('.mc');
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lienzo = document.createElement('canvas'); lienzo.className = 'fz-lienzo'; fig.insertBefore(lienzo, svg);
    var ctx = lienzo.getContext('2d');
    var capa = el('g', { 'class': 'fz-notas' }, svg);
    var ec = raiz && raiz.querySelector('.mc-ec[data-ec="2"]');
    var SPR = { p: esfera('#D07A68', '#97392B', '#521B14', 'rgba(40,14,10,.7)'), n: esfera('#FFFDF8', '#EDE3CF', '#B3A285', 'rgba(30,26,22,.55)') };


    // ── el núcleo: 236 lugares (235 nucleones + el hueco que ocupará el neutrón capturado) ──
    var RU = 1.2 * Math.cbrt(236), pk = empaca(236, RU, 11), rN = pk.r * .98;
    var CAM = { x: 1010, y: 440, s: 19 };
    var T_CAP = 9.2, ROT = .16, TILT = .38;
    // capítulo II
    var T_P2 = 17, T_SC = 21;
    var FIN = 30, DUR = 31.6;
    function angulo(t) { return t < T_CAP ? ROT * t : ROT * T_CAP + ROT * 1.6 * (1 - Math.exp(-(t - T_CAP) / 1.6)); }
    function gira(q, a) {
      var c = Math.cos(a), s = Math.sin(a), x = q[0] * c + q[2] * s, z = -q[0] * s + q[2] * c, y = q[1];
      var ct = Math.cos(TILT), st = Math.sin(TILT);
      return [x, y * ct - z * st, y * st + z * ct];
    }
    var EJE = [Math.cos(-.17), Math.sin(-.17), 0], NOR = [-EJE[1], EJE[0], 0];
    function enEje(a, b, c) { return [EJE[0] * a + NOR[0] * b, EJE[1] * a + NOR[1] * b, c]; }
    // el neutrón llega desde la derecha y ocupa el lugar de la superficie que mira hacia él
    var N_INI = [RU * 5.6, -RU * .95, RU * .35], T_N0 = 3.4;
    var DIRN = (function () { var l = Math.hypot(N_INI[0], N_INI[1], N_INI[2]); return [-N_INI[0] / l, -N_INI[1] / l, -N_INI[2] / l]; })();
    var hueco = 0, mejor = -1e9;
    pk.p.forEach(function (q, i) { var w = gira(q, angulo(T_CAP)), v = -(w[0] * DIRN[0] + w[1] * DIRN[1] + w[2] * DIRN[2]); if (v > mejor) { mejor = v; hueco = i; } });
    var rnd = semilla(29), nuc = [];
    var orden = []; for (var i0 = 0; i0 < 236; i0++) if (i0 !== hueco) orden.push(i0);
    for (var k0 = orden.length - 1; k0 > 0; k0--) { var j0 = Math.floor(rnd() * (k0 + 1)), tmp = orden[k0]; orden[k0] = orden[j0]; orden[j0] = tmp; }
    var esProton = {}; for (var k1 = 0; k1 < 92; k1++) esProton[orden[k1]] = true;
    pk.p.forEach(function (q, i) {
      var u = rnd() * 2 - 1, a = rnd() * 2 * Math.PI, w = Math.sqrt(1 - u * u), lej = RU * (2.6 + rnd() * 2.2);
      nuc.push({ b: q, p: !!esProton[i], cap: i === hueco, ini: [w * Math.cos(a) * lej, w * Math.sin(a) * lej * .7, u * lej], ret0: rnd() * .7,
        f: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], w: [2.1 + rnd() * 1.6, 2.1 + rnd() * 1.6, 2.1 + rnd() * 1.6], x: 0, y: 0, z: 0, vis: 0 });
    });

    function excit(t) { return t < T_CAP ? 0 : suave((t - T_CAP) / 1.2); }
    function estira(t) {   // alargamiento a (eje mayor / radio) del núcleo excitado
      if (t < T_CAP) return 1;
      var u = t - T_CAP, amp = .03 + .1 * suave(u / 6), med = .2 * suave((u - 4) / 5);
      return 1 + med + amp * Math.sin(2 * Math.PI * u / 1.56) * (1 - .5 * suave((u - 6) / 3));
    }
    function deforma(q, a) { var ia = 1 / Math.sqrt(a), par = q[0] * EJE[0] + q[1] * EJE[1]; return [EJE[0] * par * a + (q[0] - EJE[0] * par) * ia, EJE[1] * par * a + (q[1] - EJE[1] * par) * ia, q[2] * ia]; }
    function poseI(n, t) { return deforma(gira(n.b, angulo(t)), estira(t)); }

    // ── capítulo II: ²³⁶U* → ¹⁴²Ba* + ⁹⁴Kr*; luego ¹⁴²Ba* → ¹⁴¹Ba + n y ⁹⁴Kr* → ⁹²Kr + 2n ──
    // Al escindirse, los centros quedan a r₀ = k Z₁Z₂e²/170 MeV ≈ 17 fm: la repulsión de Coulomb lleva la energía
    // cinética a ≈ 170 MeV (valor medio). Por momento, cada fragmento se aleja del centro de masa en razón inversa a su masa.
    var ZH = 56, ZL = 36, AH = 142, AL = 94, R0 = 1.44 * ZH * ZL / 170, EK = 170;
    var DH = R0 * AL / (AH + AL), DL = R0 * AH / (AH + AL), K_C = 1.05;   // K_C: ritmo visual (1/s) en unidades de r₀
    var TAB = [1.0004], PASO = .01;   // u = r/r₀ con du/dτ = K √(1 − 1/u), integrado con RK4
    (function () { var u = TAB[0], g = function (x) { return K_C * Math.sqrt(Math.max(0, 1 - 1 / x)); }; for (var k = 0; k < 1600; k++) { var a = g(u), b = g(u + a * PASO / 2), c = g(u + b * PASO / 2), d = g(u + c * PASO); u += PASO / 6 * (a + 2 * b + 2 * c + d); TAB.push(u); } })();
    function uDe(tau) { if (tau <= 0) return 1; var x = tau / PASO, k = Math.floor(x); if (k >= TAB.length - 1) return TAB[TAB.length - 1] + (k - TAB.length + 1) * PASO * K_C; return TAB[k] + (TAB[k + 1] - TAB[k]) * (x - k); }
    var V_L = K_C * R0 * AH / (AH + AL), V_N = V_L * .065 / .0483, C_LUZ = V_L / .0483;   // fm/s visuales: v_n(2 MeV) ≈ 0,065 c, v_Kr ≈ 0,048 c
    // forma de dos centros: separación d(sg) de 3 fm a r₀ y alargamiento de cada fragmento hasta 1,18
    var SG_B = .3;
    function sitio(k, loc, sg) {
      var d = 3 + (R0 - 3) * (.6 * suave(sg / .75) + .4 * suave((sg - .72) / .28)), e = 1 + .18 * suave(sg), cen = k === 'H' ? -d * AL / (AH + AL) : d * AH / (AH + AL);
      return enEje(cen + loc[0] * e, loc[1] / Math.sqrt(e), loc[2] / Math.sqrt(e));
    }
    var fr = { H: { A: AH, Z: ZH, lado: -1, m: [] }, L: { A: AL, Z: ZL, lado: 1, m: [] } }, libres = [], fotones = [];
    (function () {
      var ini = nuc.map(function (n) { return poseI(n, T_P2); });
      nuc.forEach(function (n, i) { n.s0 = ini[i]; n.c = ini[i][0] * EJE[0] + ini[i][1] * EJE[1]; });
      // lugares de destino: dos esferas empaquetadas (alargadas 1,18 en el eje), con sus protones y neutrones
      var lug = { p: [], n: [] }, r3 = semilla(53);
      ['H', 'L'].forEach(function (k, s) {
        var F = fr[k], pkF = empaca(F.A, 1.2 * Math.cbrt(F.A), 5 + s * 4);
        var idx = pkF.p.map(function (q, j) { return j; });
        for (var a = idx.length - 1; a > 0; a--) { var b = Math.floor(r3() * (a + 1)), t2 = idx[a]; idx[a] = idx[b]; idx[b] = t2; }
        idx.forEach(function (j, m) {
          var q = pkF.p[j];
          (m < F.Z ? lug.p : lug.n).push({ fr: k, loc: q, w: sitio(k, q, SG_B) });
        });
      });
      // asignación: emparejamiento voraz global por distancia y luego intercambios que acortan los recorridos
      ['p', 'n'].forEach(function (tipo) {
        var ms = nuc.filter(function (n) { return tipo === 'p' ? n.p : !n.p; }), ls = lug[tipo], pares = [], i, j;
        function d2(n, l) { var dx = n.s0[0] - l.w[0], dy = n.s0[1] - l.w[1], dz = n.s0[2] - l.w[2]; return dx * dx + dy * dy + dz * dz; }
        for (i = 0; i < ms.length; i++) for (j = 0; j < ls.length; j++) pares.push([d2(ms[i], ls[j]), i, j]);
        pares.sort(function (a, b) { return a[0] - b[0]; });
        var ocM = [], ocL = [], asg = [];
        pares.forEach(function (q) { if (!ocM[q[1]] && !ocL[q[2]]) { ocM[q[1]] = ocL[q[2]] = true; asg[q[1]] = q[2]; } });
        for (var pasada = 0; pasada < 4; pasada++) for (i = 0; i < ms.length; i++) for (j = i + 1; j < ms.length; j++) {
          var a = ls[asg[i]], b = ls[asg[j]];
          if (d2(ms[i], b) + d2(ms[j], a) < d2(ms[i], a) + d2(ms[j], b)) { var t3 = asg[i]; asg[i] = asg[j]; asg[j] = t3; }
        }
        ms.forEach(function (n, i) { var l = ls[asg[i]]; n.fr = l.fr; n.loc = l.loc; });
      });
      nuc.forEach(function (n) { fr[n.fr].m.push(n); });   // el cuello llega último
      ['H', 'L'].forEach(function (k) {
        var F = fr[k];
        // neutrones que se evaporan: los del extremo exterior del fragmento
        var ext = F.m.filter(function (n) { return !n.p; }).sort(function (a, b) { return F.lado * (b.loc[0] - a.loc[0]); });
        var dirs = k === 'H' ? [[-.45, .78, .43]] : [[.75, -.55, .35], [.72, .18, .67]], tE = k === 'H' ? [.8] : [.45, .95];
        dirs.forEach(function (d, j) { var n = ext[j], l = Math.hypot(d[0], d[1], d[2]); n.emite = { t: tE[j], d: [d[0] / l, d[1] / l, d[2] / l] }; libres.push(n); });
      });
      // rayos γ inmediatos: ≈ 8 fotones por fisión, después de los neutrones
      var r2 = semilla(71);
      for (var g = 0; g < 8; g++) { var a = r2() * 2 * Math.PI; fotones.push({ fr: g % 2 ? 'L' : 'H', t: 1.15 + g * .17 + r2() * .1, d: [Math.cos(a), Math.sin(a)] }); }
    })();
    function centroFr(F, tau) {   // centro del fragmento (fm) a τ segundos de la escisión
      var r = R0 * uDe(tau); return enEje(F.lado < 0 ? -r * AL / (AH + AL) : r * AH / (AH + AL), 0, 0);
    }
    function velFr(F, tau) { var u = uDe(tau), v = K_C * R0 * Math.sqrt(Math.max(0, 1 - 1 / u)) * (F.lado < 0 ? AL : AH) / (AH + AL); return enEje(F.lado * v, 0, 0); }
    function formaFr(tau) { return 1 + .18 * Math.exp(-tau / .9) * Math.cos(2 * Math.PI * tau / 1.15); }   // nacen alargados y vibran

    // cámara: se aleja al separarse los fragmentos (escala logarítmica)
    function escala(t) { var e = suave((t - T_SC - .2) / 7.5); return 19 * Math.pow(4.4 / 19, e); }

    // ── notas: punto, guía que se dibuja, regla, rótulo, título y texto ──
    var notas = [];
    function nota(o) {
      var g = el('g', { 'class': 'fz-nota' }, capa), lado = o.lado || 1, ancho = o.ancho || 236;
      var gp = el('g', { 'class': 'fz-ancla' }, g); el('circle', { 'class': 'fz-pt', r: 2.3 }, gp); el('circle', { 'class': 'fz-aro', r: 2.3 }, gp);
      var guia = el('path', { 'class': 'fz-guia', pathLength: 1 }, g);
      // con pie: la regla queda debajo del bloque y la guía llega por abajo (para notas encima del núcleo)
      var tx = o.tx, ty = o.ty, x0 = lado > 0 ? tx : tx - ancho, anc = 'start', alto = 48 + (o.d.length - 1) * 17.5 + (o.ley ? 26 : 0);
      var y0 = o.pie ? ty - alto - 18 : ty;
      el('line', { 'class': 'fz-regla', x1: f(x0), y1: f(ty), x2: f(x0 + ancho), y2: f(ty), pathLength: 1 }, g);
      var t = el('text', { 'class': 'fz-k', x: f(x0), y: f(o.pie ? y0 - 6 : ty - 9), 'text-anchor': anc }, g); t.textContent = o.k;
      var t2 = el('text', { 'class': 'fz-tit', x: f(x0), y: f(y0 + 25), 'text-anchor': anc }, g); t2.textContent = o.tit;
      var t3 = el('text', { 'class': 'fz-d', x: f(x0), y: f(y0 + 48), 'text-anchor': anc }, g);
      o.d.forEach(function (l, k) { var s = el('tspan', { x: f(x0), dy: k ? 17.5 : 0 }, t3); s.textContent = l; });
      if (o.ley) o.ley(g, x0, y0 + 48 + o.d.length * 17.5 - 6);
      var n = { g: g, o: o, ver: false };
      n.ubica = function (ax, ay) {
        gp.setAttribute('transform', 'translate(' + f(ax) + ' ' + f(ay) + ')');
        var ex = lado > 0 ? x0 - 10 : x0 + ancho + 10;
        guia.setAttribute('d', 'M' + f(ax) + ' ' + f(ay) + ' L' + f(ex) + ' ' + f(ty) + ' L' + f(lado > 0 ? x0 : x0 + ancho) + ' ' + f(ty));
      };
      n.pon = function (v) { if (v !== n.ver) { n.ver = v; g.classList.toggle('ver', v); } };
      notas.push(n); return n;
    }
    function leyenda(g, x, y) {
      [['p', 'protón · 92'], ['n', 'neutrón · 143']].forEach(function (e, k) {
        var cx = x + 6 + k * 112;
        el('circle', { 'class': 'fz-ley-' + e[0], cx: f(cx), cy: f(y + 6), r: 5.5 }, g);
        var t = el('text', { 'class': 'fz-ley', x: f(cx + 11), y: f(y + 10) }, g); t.textContent = e[1];
      });
    }
    // cuatro lugares fijos: arriba a la izquierda (con pie), abajo a la izquierda y a la derecha
    var ARR = { tx: 1000, ty: 282, ancho: 230, lado: -1, pie: true }, ABA = { tx: 1016, ty: 600, ancho: 246, lado: -1 }, DER = { tx: 1192, ty: 528, ancho: 236 };
    function en(lugar, o) { for (var k in lugar) if (!(k in o)) o[k] = lugar[k]; return nota(o); }
    var nU = en(ARR, { k: 'Uranio-235', tit: '²³⁵U · 92 p + 143 n', ley: leyenda,
      d: ['235 nucleones en una esfera de', 'R = r₀ A¹ᐟ³ ≈ 7,4 fm (r₀ ≈ 1,2 fm).', 'No están quietos: se mueven dentro', 'como un gas de Fermi.'] });
    var nN = en(DER, { k: 'Neutrón térmico', tit: 'E ≈ 0,025 eV · v ≈ 2,2 km/s',
      d: ['Sin carga, la repulsión de Coulomb no', 'lo frena. Su longitud de onda, λ ≈ 0,18 nm,', 'es ~10⁴ veces el núcleo: por eso la', 'sección eficaz de fisión es grande,', 'σ_f ≈ 585 barn.'] });
    var nC = en(DER, { k: 'Núcleo compuesto', tit: '²³⁶U*: E* ≈ 6,5 MeV',
      d: ['La energía de enlace del neutrón', 'queda como excitación, más que la', 'barrera de fisión (≈ 6,2 MeV). Con 144', 'neutrones (par) el apareamiento suma', 'energía: por eso ²³⁵U fisiona con', 'neutrones lentos y ²³⁸U no.'] });
    var nG = en(ABA, { k: 'Modelo de la gota líquida', tit: 'Superficie contra Coulomb',
      d: ['La fuerza fuerte, de corto alcance,', 'actúa como tensión superficial y lo', 'quiere esférico; la repulsión de 92', 'protones lo estira (Z²/A ≈ 35,9).', 'Excitado, el núcleo oscila y se alarga.'] });
    var nS = en(ABA, { k: 'Escisión', tit: 'El cuello se rompe',
      d: ['Pasado el punto de silla gana Coulomb:', 'el núcleo se alarga, el cuello se adelgaza', 'y se parte en dos fragmentos desiguales.', 'En ²³⁵U la fisión es asimétrica: masas', 'cerca de 95 y de 140.'] });
    var nF = en(ARR, { k: 'Fragmentos', tit: '¹⁴²Ba + ⁹⁴Kr',
      d: ['56 + 36 = 92 protones que se repelen.', 'Coulomb les da ≈ 170 MeV (en promedio):', 'casi toda la energía es cinética. Por', 'momento, el ligero sale 1,5 veces más', 'rápido, a v ≈ 0,05 c.'] });
    var nP = en(DER, { k: 'Neutrones inmediatos', tit: '≈ 2 MeV cada uno',
      d: ['Los fragmentos nacen excitados y', 'evaporan neutrones casi al instante:', '¹⁴²Ba → ¹⁴¹Ba + n, ⁹⁴Kr → ⁹²Kr + 2n.', 'En promedio salen ν ≈ 2,4 por fisión;', 'después, rayos γ (≈ 8 fotones, 7 MeV).'] });
    var nE = en(ABA, { k: 'Balance de masa', tit: 'Δm c² ≈ 173 MeV',
      d: ['¹⁴¹Ba + ⁹²Kr + 3n pesan 0,186 u menos', 'que n + ²³⁵U. Con los decaimientos β', 'que siguen, cada fisión libera ≈ 200 MeV', 'y unos 6 antineutrinos: los que miden', 'los detectores junto a los reactores.'] });
    var AGENDA = [[nU, 1.4, 8.6], [nN, 4.2, 9.6], [nC, 9.6, 17.8], [nG, 12.2, 17.6], [nS, 18, 22], [nF, 21.8, 27], [nP, 23, 29.2], [nE, 26, FIN]];

    // ── capítulos ──
    var CAPS = [['I', 'Captura', 0], ['II', 'Fisión', T_P2], ['III', 'Cadena', null], ['IV', 'Escala', null]];
    var barra = document.createElement('nav'); barra.className = 'fz-caps'; barra.setAttribute('aria-label', 'Capítulos de la animación');
    CAPS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fz-cap' + (c[2] == null ? ' fz-pronto' : '');
      b.innerHTML = '<span class="fz-cap-n">' + c[0] + '</span><span class="fz-cap-t">' + c[1] + '</span><i class="fz-cap-l"><i></i></i>';
      if (c[2] != null) b.addEventListener('click', function () { salta(c[2]); }); else b.disabled = true;
      c.b = b; c.l = b.querySelector('.fz-cap-l i'); barra.appendChild(b);
    });
    fig.appendChild(barra);

    var T = 0, W = 0, H = 0, dpr = 1, ecAct = '';
    function salta(t) { T = t; notas.forEach(function (n) { n.pon(false); }); }
    function reinicia() { salta(0); }
    var fijo = false;
    fig.fzSalta = salta; fig.fzFija = function (t) { salta(t); fijo = true; };   // para capturas
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (on && !fig.fzOn) reinicia(); fig.fzOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });

    function aPantalla(q) { return [CAM.x + q[0] * CAM.s, CAM.y + q[1] * CAM.s]; }
    function jit(n, t, amp) { return [amp * Math.sin(n.w[0] * t + n.f[0]), amp * Math.sin(n.w[1] * t + n.f[1]), amp * Math.sin(n.w[2] * t + n.f[2])]; }
    function brillo(x, y, r0, r1, rgb, a) {
      var g = ctx.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g; ctx.fillRect(x - r1, y - r1, 2 * r1, 2 * r1);
    }

    // posición de cada nucleón (fm) en el instante t
    function posiciones(t) {
      var ex = excit(t), amp = .12 + .22 * ex;
      if (t < T_P2) {
        for (var i = 0; i < nuc.length; i++) {
          var n = nuc[i], q = poseI(n, t), j = jit(n, t, amp);
          q[0] += j[0]; q[1] += j[1]; q[2] += j[2];
          if (n.cap) {
            if (t < T_N0) n.vis = 0;
            else if (t < T_CAP) { var u = (t - T_N0) / (T_CAP - T_N0); n.vis = 1; q = [N_INI[0] + (q[0] - N_INI[0]) * u, N_INI[1] + (q[1] - N_INI[1]) * u, N_INI[2] + (q[2] - N_INI[2]) * u]; }
            else n.vis = 1;
          } else {
            var e = salidaExp((t - n.ret0) / 1.1); n.vis = cl((t - n.ret0) * 3, 0, 1);
            if (e < 1) q = [n.ini[0] + (q[0] - n.ini[0]) * e, n.ini[1] + (q[1] - n.ini[1]) * e, n.ini[2] + (q[2] - n.ini[2]) * e];
          }
          n.x = q[0]; n.y = q[1]; n.z = q[2];
        }
        return;
      }
      if (t < T_SC) {   // dos centros que se separan: la unión de las dos esferas forma el cuello y luego se corta
        var sg = (t - T_P2) / (T_SC - T_P2), b = suave(sg / SG_B);
        nuc.forEach(function (n) {
          var w = sitio(n.fr, n.loc, sg), j = jit(n, t, .34);
          n.x = n.s0[0] + (w[0] - n.s0[0]) * b + j[0]; n.y = n.s0[1] + (w[1] - n.s0[1]) * b + j[1]; n.z = n.s0[2] + (w[2] - n.s0[2]) * b + j[2]; n.vis = 1;
        });
        return;
      }
      var tau = t - T_SC, a = formaFr(tau), ia = 1 / Math.sqrt(a), ampF = .16 + .18 * Math.exp(-tau / 2);
      ['H', 'L'].forEach(function (k) {
        var F = fr[k], c = centroFr(F, tau);
        F.c = c;
        F.m.forEach(function (n) {
          var j = jit(n, t, ampF), loc = enEje(n.loc[0] * a, n.loc[1] * ia, n.loc[2] * ia);
          if (n.emite && tau > n.emite.t) {   // neutrón evaporado: sigue recto con la velocidad del fragmento más la suya
            var te = n.emite.t, c0 = centroFr(F, te), v = velFr(F, te), dt = tau - te, a0 = formaFr(te), l0 = enEje(n.loc[0] * a0, n.loc[1] / Math.sqrt(a0), n.loc[2] / Math.sqrt(a0));
            n.x = c0[0] + l0[0] + (v[0] + V_N * n.emite.d[0]) * dt; n.y = c0[1] + l0[1] + (v[1] + V_N * n.emite.d[1]) * dt; n.z = c0[2] + l0[2] + (v[2] + V_N * n.emite.d[2]) * dt;
          } else { n.x = c[0] + loc[0] + j[0]; n.y = c[1] + loc[1] + j[1]; n.z = c[2] + loc[2] + j[2]; }
          n.vis = 1;
        });
      });
    }

    function dibuja(t) {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = Math.round(w * d); lienzo.height = Math.round(h * d); }
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      CAM.s = escala(t);
      var fundido = t < .4 ? t / .4 : t > FIN ? 1 - suave((t - FIN) / (DUR - FIN - .3)) : 1;
      ctx.globalAlpha = fundido;
      var ex = excit(t), a = estira(t), C = aPantalla([0, 0, 0]), Rp = RU * CAM.s, tau = t - T_SC;
      posiciones(t);

      // sombra (se desvanece cuando los fragmentos se separan) y calor del núcleo excitado
      var som = t < T_SC ? 1 : 1 - suave(tau / 1.5);
      if (som > 0) {
        ctx.save(); ctx.translate(C[0], C[1] + Rp * 1.55); ctx.scale(1, .2);
        var gs = ctx.createRadialGradient(0, 0, 0, 0, 0, Rp * 1.25 * (t < T_P2 ? 1 : 1.3)); gs.addColorStop(0, 'rgba(30,26,22,' + (.16 * som) + ')'); gs.addColorStop(1, 'rgba(30,26,22,0)');
        ctx.fillStyle = gs; ctx.fillRect(-Rp * 1.7, -Rp * 1.7, Rp * 3.4, Rp * 3.4); ctx.restore();
      }
      if (ex > 0 && t < T_SC + 2) {
        if (t < T_SC) brillo(C[0], C[1], Rp * .4, Rp * (2.3 + (t > T_P2 ? (t - T_P2) * .25 : 0)), '232,150,70', .22 * ex);
        else ['H', 'L'].forEach(function (k) { var P = aPantalla(fr[k].c); brillo(P[0], P[1], 0, Rp * 1.6, '232,150,70', .2 * (1 - tau / 2)); });
      }
      // destello de la escisión
      if (tau > -.15 && tau < 1.6) {
        var e1 = cl(tau / 1.6, 0, 1);
        brillo(C[0], C[1], 0, Rp * (.8 + 2.4 * e1), '246,214,150', .55 * (1 - e1) * cl((tau + .15) / .15, 0, 1));
        ctx.strokeStyle = 'rgba(200,130,60,' + (.6 * (1 - e1)) + ')'; ctx.lineWidth = 1.2 * (1 - e1) + .3;
        ctx.beginPath(); ctx.ellipse(C[0], C[1], 10 + e1 * Rp * 3.2, 10 + e1 * Rp * 3.2 * .55, -.17, 0, 2 * Math.PI); ctx.stroke();
      }
      // estela del neutrón que llega
      var cap = nuc[hueco];
      if (t > T_N0 && t < T_CAP + .8) {
        var p1 = aPantalla([cap.x, cap.y]), p0 = aPantalla(N_INI), largo = Math.min(1, (t - T_N0) / 1.2), dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
        var cola = Math.min(L, 150 * largo), sx = p1[0] - dx / L * cola, sy = p1[1] - dy / L * cola;
        var gt = ctx.createLinearGradient(sx, sy, p1[0], p1[1]); gt.addColorStop(0, 'rgba(30,26,22,0)'); gt.addColorStop(1, 'rgba(30,26,22,' + (.5 * (t < T_CAP ? 1 : 1 - (t - T_CAP) / .8)) + ')');
        ctx.strokeStyle = gt; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
      if (t > T_N0 && t < T_CAP + .6) {
        var ph = aPantalla([cap.x, cap.y]);
        brillo(ph[0], ph[1], rN * CAM.s * .6, rN * CAM.s * 2.6, '226,170,90', (t < T_CAP ? cl((t - T_N0) / .6, 0, 1) : 1 - (t - T_CAP) / .6) * .5);
      }
      // neutrones evaporados: halo dorado y estela recta desde donde salieron
      if (tau > 0) libres.forEach(function (n) {
        if (tau < n.emite.t) return;
        var P = aPantalla([n.x, n.y]), F = fr[n.fr], te = n.emite.t, c0 = centroFr(F, te), P0 = aPantalla(c0), s = cl((tau - te) / .4, 0, 1);
        var lx = P[0] - P0[0], ly = P[1] - P0[1], ll = Math.hypot(lx, ly) || 1, lc = Math.min(ll, 230); P0 = [P[0] - lx / ll * lc, P[1] - ly / ll * lc];
        var gt2 = ctx.createLinearGradient(P0[0], P0[1], P[0], P[1]); gt2.addColorStop(0, 'rgba(30,26,22,0)'); gt2.addColorStop(1, 'rgba(30,26,22,.42)');
        ctx.strokeStyle = gt2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
        brillo(P[0], P[1], rN * CAM.s * .5, rN * CAM.s * 2.8 + 4, '226,170,90', .5 * s);
      });
      // nucleones, de atrás hacia adelante
      var ord = nuc.slice().sort(function (p, q) { return p.z - q.z; });
      for (var j = 0; j < ord.length; j++) {
        var m = ord[j]; if (!m.vis) continue;
        var pz = 1 + m.z * .012, r = rN * CAM.s * pz, P = aPantalla([m.x, m.y]);
        if (P[0] < vb.x - r || P[0] > vb.x + vb.width + r || P[1] < vb.y - r || P[1] > vb.y + vb.height + r) continue;
        ctx.globalAlpha = fundido * m.vis * (.78 + .22 * cl(.5 + m.z / (2 * RU), 0, 1));
        ctx.drawImage(m.p ? SPR.p : SPR.n, P[0] - r, P[1] - r, 2 * r, 2 * r);
      }
      ctx.globalAlpha = fundido;
      // rayos γ: paquetes de onda dorados que salen a la velocidad de la luz
      if (tau > 0) fotones.forEach(function (g) {
        if (tau < g.t) return;
        var c0 = aPantalla(centroFr(fr[g.fr], g.t)), dd = (tau - g.t) * C_LUZ * CAM.s, ux = g.d[0], uy = g.d[1];
        if (dd > 1400) return;
        var a2 = .75 * (1 - cl(dd / 900, 0, 1)), Lp = 46, n = 24;
        ctx.strokeStyle = 'rgba(196,140,52,' + a2 + ')'; ctx.lineWidth = 1.1; ctx.beginPath();
        for (var k = 0; k <= n; k++) {
          var s = dd - Lp + Lp * k / n; if (s < 0) continue;
          var env = Math.sin(Math.PI * k / n), off = 3.2 * env * Math.sin(k / n * 6 * Math.PI);
          var x = c0[0] + ux * s - uy * off, y = c0[1] + uy * s + ux * off;
          if (k === 0 || s - Lp / n < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      // la gota: contorno de tinta discontinuo que sigue la forma, hasta que empieza el cuello
      var vg = ex * (t < T_P2 ? 1 : 1 - suave((t - T_P2) / 1.2));
      if (vg > 0) {
        var ia = 1 / Math.sqrt(a);
        ctx.save(); ctx.translate(C[0], C[1]); ctx.rotate(Math.atan2(EJE[1], EJE[0]));
        ctx.setLineDash([3, 5]); ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(30,26,22,' + (.42 * vg) + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, (RU + .9) * CAM.s * a, (RU + .9) * CAM.s * ia, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
        ctx.setLineDash([]);
      }
      var up = (t - T_CAP) / 1.4;   // pulso de la captura
      if (up > 0 && up < 1) {
        var P2 = aPantalla([cap.x, cap.y]);
        ctx.strokeStyle = 'rgba(200,120,50,' + (.7 * (1 - up)) + ')'; ctx.lineWidth = 1.4 * (1 - up) + .3;
        ctx.beginPath(); ctx.arc(P2[0], P2[1], 6 + up * Rp * 1.6, 0, 2 * Math.PI); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // notas que siguen a lo que señalan
      nU.ubica(C[0] - Rp * .45, C[1] - Rp * .62);
      var Pn = aPantalla([cap.x, cap.y]); nN.ubica(Pn[0] - 4, Pn[1] + rN * CAM.s + 6);
      nC.ubica(C[0] + Rp * .78 * a, C[1] + Rp * .45);
      nG.ubica(C[0] - Rp * .9 * a, C[1] + Rp * .2);
      nS.ubica(C[0], C[1] + Rp * .3);
      if (tau > 0) {
        var pH = aPantalla(fr.H.c), pL = aPantalla(fr.L.c), rH = 1.2 * Math.cbrt(AH) * CAM.s, rL = 1.2 * Math.cbrt(AL) * CAM.s;
        nF.ubica(pH[0] + rH * .1, pH[1] - rH * .95);
        nP.ubica(pL[0] + rL * .2, pL[1] + rL * .95);
      }
      nE.ubica(C[0], C[1] + 4);
    }

    function coma(x, d) { return x.toFixed(d).replace('.', ',').replace('-', '−'); }
    function lecturas(t) {
      var tau = t - T_SC;
      if (t < T_N0) salida('U-235 · R ≈ 7,4 fm', 'esperando un neutrón');
      else if (t < T_CAP) { var c = nuc[hueco]; salida('neutrón · E = 0,025 eV', 'a ' + coma(Math.max(0, Math.hypot(c.x, c.y, c.z) - RU), 1) + ' fm de la superficie'); }
      else if (t < T_P2) { var a = estira(t); salida('U-236* · E* ≈ 6,5 MeV', 'deformación β₂ ≈ ' + coma((Math.pow(a, 1.5) - 1) / .946, 2)); }
      else if (t < T_SC) {
        var sH = 0, sL = 0; fr.H.m.forEach(function (n) { sH += n.x * EJE[0] + n.y * EJE[1]; }); fr.L.m.forEach(function (n) { sL += n.x * EJE[0] + n.y * EJE[1]; });
        salida('U-236* · se forma el cuello', 'distancia entre centros ≈ ' + coma(sL / fr.L.m.length - sH / fr.H.m.length, 1) + ' fm');
      } else {
        var u = uDe(tau), q = Math.sqrt(Math.max(0, 1 - 1 / u)), nl = libres.filter(function (n) { return tau > n.emite.t; }).length, ng = fotones.filter(function (g) { return tau > g.t; }).length;
        salida('E cinética ≈ ' + coma(EK * (1 - 1 / u), 0) + ' MeV · d ≈ ' + coma(R0 * u, 0) + ' fm',
          nl ? 'neutrones libres: ' + nl + (ng ? ' · fotones γ: ' + ng : '') : 'Kr: v ≈ ' + coma(.0483 * q, 3) + ' c · Ba: ' + coma(.0483 * q * AL / AH, 3) + ' c');
      }
    }

    function capitulos(t) {
      CAPS.forEach(function (c, k) {
        var ini = c[2], sig = k + 1 < CAPS.length && CAPS[k + 1][2] != null ? CAPS[k + 1][2] : null, fin = sig == null ? FIN : sig;
        var on = ini != null && t >= ini && t < (sig == null ? DUR : sig);
        if (on !== c.on) { c.on = on; c.b.classList.toggle('on', on); }
        if (ini != null) c.l.style.transform = 'scaleX(' + cl((t - ini) / (fin - ini), 0, 1).toFixed(3) + ')';
      });
    }
    function ecuacion(t) {
      var e = t < T_SC ? 'n + <sup>235</sup>U → <sup>236</sup>U<sup>*</sup>' : 'n + <sup>235</sup>U → <sup>141</sup>Ba + <sup>92</sup>Kr + 3n';
      if (ec && e !== ecAct) { ecAct = e; ec.innerHTML = e; }
    }

    if (quieto) { T = 14; }
    return {
      tick: function (dt) {
        if (!fig.classList.contains('on')) return;
        if (!quieto && !fijo) { T += dt; if (T >= DUR) reinicia(); }
        AGENDA.forEach(function (a) { a[0].pon(T >= a[1] && T < a[2]); });
        dibuja(T); lecturas(T); capitulos(T); ecuacion(T);
      }
    };
  };
})();
