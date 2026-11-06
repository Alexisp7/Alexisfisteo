// III · Problemas de física — fisión del uranio-235, en cuatro capítulos.
//  I   Captura: un neutrón térmico entra en ²³⁵U; el núcleo compuesto ²³⁶U* queda excitado
//      (E* ≈ 6,5 MeV > barrera ≈ 6,2 MeV, valores de Krane) y oscila como una gota líquida.
//  II  Fisión: n + ²³⁵U → ¹⁴¹Ba + ⁹²Kr + 3n (Q ≈ 173 MeV con las masas atómicas);
//      los neutrones se evaporan de los fragmentos ya acelerados: ¹⁴²Ba* + ⁹⁴Kr* → ¹⁴¹Ba + ⁹²Kr + 3n..
//  III Reacción en cadena (ν = 2 o 3, k ≈ 1,8) con alejamiento progresivo de la cámara; espacio comprimido.
//  IV  Cambio de escala (10⁻¹⁴ m → 10³ m): destello, bola de fuego (Wien), onda de choque de Taylor
//      (R ∝ t^(2/5)) y nube en hongo como anillo de vórtice que sube; la noche se cierra como un iris.
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
    // II·1 escisión (T_P2 → T_SC) · II·2 fragmentos (T_SC → T_P3)
    var T_P2 = 17, T_SC = 23.5;
    var T_P3 = T_SC + 6.8, T_P4 = T_P3 + 15, T_FL = T_P4 + 3.6, FIN = T_P4 + 25.7, DUR = FIN + 4;
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
    var SG_B = .3, RH = 1.2 * Math.cbrt(AH), RL = 1.2 * Math.cbrt(AL);
    function dist(sg) { return 3 + (R0 - 3) * (.6 * suave(sg / .75) + .4 * suave((sg - .72) / .28)); }
    function sitio(k, loc, sg) {
      var d = dist(sg), e = 1 + .18 * suave(sg), cen = k === 'H' ? -d * AL / (AH + AL) : d * AH / (AH + AL);
      return enEje(cen + loc[0] * e, loc[1] / Math.sqrt(e), loc[2] / Math.sqrt(e));
    }
    // hueco entre las caras interiores de los dos fragmentos (fm); el cuello lo cubre hasta la escisión
    function hueco2(sg) { var d = dist(sg), e = 1 + .18 * suave(sg); return d - (RH + RL) * e; }
    function cuello(n, sg) {   // desplazamiento (a lo largo del eje) y estrechamiento de un nucleón del cuello
      var g = hueco2(sg); return n.cu * Math.max(0, g / 2 + 1.1) * suave(sg / .45);
    }
    var CU0 = Math.max(0, hueco2(1) / 2 + 1.1);   // estiramiento del cuello justo al romperse
    function sgDe(t) { var x = cl((t - T_P2) / (T_SC - T_P2), 0, 1); return x * (.75 + .25 * x); }   // pasado el punto de silla, la caída se acelera
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
      // nucleones del cuello: los de la cara interior y cerca del eje; se estiran hacia el centro y, al romperse, vuelven
      nuc.forEach(function (n) {
        var F = fr[n.fr], Rf = 1.2 * Math.cbrt(F.A), s2 = -F.lado * n.loc[0], rr = n.loc[1] * n.loc[1] + n.loc[2] * n.loc[2];
        n.cu = s2 > 0 ? Math.pow(s2 / Rf, 2.5) * Math.exp(-rr / (Rf * Rf * .3)) : 0;
      });
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

    function posLibre(n, tau) {   // neutrón evaporado: sigue recto con la velocidad del fragmento más la suya
      var F = fr[n.fr], te = n.emite.t, c0 = centroFr(F, te), v = velFr(F, te), dt = tau - te, a0 = formaFr(te), l0 = enEje(n.loc[0] * a0, n.loc[1] / Math.sqrt(a0), n.loc[2] / Math.sqrt(a0));
      return [c0[0] + l0[0] + (v[0] + V_N * n.emite.d[0]) * dt, c0[1] + l0[1] + (v[1] + V_N * n.emite.d[1]) * dt, c0[2] + l0[2] + (v[2] + V_N * n.emite.d[2]) * dt];
    }

    // ── capítulo II, dibujo en tinta: II·1 contorno de dos centros, cota y barrera; II·2 fuerzas, velocidades y rótulos ──
    var ZM1 = (function () { var d = dist(1), e = 1.18; return (-d * AL / (AH + AL) + RH * e + d * AH / (AH + AL) - RL * e) / 2; })();   // donde se rompe el cuello
    var TINTA = 'rgba(30,26,22,', VINO = 'rgba(122,46,34,', ORO = 'rgba(196,140,52,';
    function txt(str, x, y, o) {   // texto nítido en píxeles (el lienzo se estira con el viewBox)
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr, k = Math.min(kx, ky);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = (o.it ? 'italic 500 ' : '400 ') + (o.px * k).toFixed(1) + 'px ' + (o.mono ? "'Space Mono',monospace" : "'Cormorant Garamond',serif");
      if ('letterSpacing' in ctx) ctx.letterSpacing = o.mono ? (o.px * .18 * k).toFixed(1) + 'px' : '0px';
      ctx.textAlign = o.al || 'left'; ctx.fillStyle = o.c; ctx.globalAlpha = o.a;
      ctx.fillText(str, (x - vb.x) * kx, (y - vb.y) * ky); ctx.restore();
    }
    function flecha(x0, y0, x1, y1, col, a, w) {
      var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 2) return;
      var ux = dx / L, uy = dy / L, hb = Math.min(7, L * .45);
      ctx.strokeStyle = col + a + ')'; ctx.fillStyle = col + a + ')'; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * hb * .7, y1 - uy * hb * .7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * hb - uy * hb * .38, y1 - uy * hb + ux * hb * .38); ctx.lineTo(x1 - ux * hb * .72, y1 - uy * hb * .72); ctx.lineTo(x1 - ux * hb + uy * hb * .38, y1 - uy * hb - ux * hb * .38); ctx.closePath(); ctx.fill();
    }
    function trazo(pts, cerrar) { ctx.beginPath(); pts.forEach(function (P, i) { if (i) ctx.lineTo(P[0], P[1]); else ctx.moveTo(P[0], P[1]); }); if (cerrar) ctx.closePath(); ctx.stroke(); }
    // energía potencial (esquemática) frente a la deformación: pozo, punto de silla y caída de Coulomb
    function Vdef(x) { return x < .14 ? 9 * Math.pow((.14 - x) / .14, 2) : x < .5 ? 6.2 * suave((x - .14) / .36) : 6.2 - 30 * Math.pow((x - .5) / .5, 1.6); }
    var BX = 768, BY = 150, BW = 232, BH = 112, X_SC = .74;
    function barrera(t, a) {
      if (a <= 0) return;
      var px = function (x) { return BX + x * BW; }, py = function (v) { return BY + BH * (9 - v) / 15; }, rv = suave((t - T_P2 + .3) / 1.8), i;
      ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
      txt('BARRERA DE FISIÓN', BX, BY - 14, { mono: true, px: 8, c: '#1E1A16', a: a * .85 });
      txt('esquemática', BX + BW, BY - 14, { it: true, px: 12, c: '#8E8478', a: a, al: 'right' });
      ctx.strokeStyle = TINTA + '.55)'; ctx.lineWidth = .8;
      trazo([[BX, BY + 4], [BX, BY + BH * rv]]);
      ctx.setLineDash([2, 4]); trazo([[BX, py(0)], [BX + BW * rv, py(0)]]); ctx.setLineDash([]);
      txt('V', BX - 6, BY + 10, { it: true, px: 14, c: '#1E1A16', a: a, al: 'right' });
      txt('deformación →', BX + BW, BY + BH + 14, { mono: true, px: 7.5, c: '#8E8478', a: a * rv, al: 'right' });
      ctx.save(); ctx.beginPath(); ctx.rect(BX, BY, BW, BH); ctx.clip();
      var cur = []; for (i = 0; i <= 80 * rv; i++) { var x = i / 80; cur.push([px(x), py(Vdef(x))]); }
      ctx.strokeStyle = VINO + '.85)'; ctx.lineWidth = 1.3; if (cur.length > 1) trazo(cur);
      ctx.restore();
      var rv2 = suave((t - T_P2 - .9) / 1);
      if (rv2 > 0) {
        ctx.globalAlpha *= rv2;
        ctx.strokeStyle = ORO + '.9)'; ctx.lineWidth = .9; ctx.setLineDash([4, 3]); trazo([[px(.03), py(6.5)], [px(X_SC + .04), py(6.5)]]); ctx.setLineDash([]);
        txt('E* ≈ 6,5 MeV', px(.03), py(6.5) - 6, { it: true, px: 13, c: '#9A6A26', a: a * rv2 });
        ctx.strokeStyle = TINTA + '.5)'; ctx.lineWidth = .7;
        trazo([[px(.5), py(6.2) + 3], [px(.5), py(0) + 4]]); trazo([[px(X_SC), py(Vdef(X_SC)) - 2], [px(X_SC), py(0) + 4]]);
        txt('silla · B_f ≈ 6,2', px(.5), py(0) + 15, { mono: true, px: 7, c: '#6E655B', a: a * rv2, al: 'center' });
        txt('escisión', px(X_SC) + 4, py(0) - 5, { mono: true, px: 7, c: '#6E655B', a: a * rv2 });
        txt('↓ Coulomb', px(.96), py(-4.6), { mono: true, px: 7, c: '#7A2E22', a: a * rv2, al: 'right' });
        // el sistema: un punto que pasa la silla y cae hacia la escisión; la distancia a E* es energía de deformación cinética
        var xd = .14 + (X_SC - .14) * sgDe(t), P = [px(xd), py(Vdef(xd))];
        ctx.strokeStyle = ORO + '.7)'; ctx.setLineDash([1.5, 2.5]); trazo([[P[0], P[1] - 3], [P[0], py(6.5)]]); ctx.setLineDash([]);
        ctx.globalAlpha = a * rv2; brillo(P[0], P[1], 0, 11, '232,150,70', .45);
        ctx.fillStyle = '#7A2E22'; ctx.beginPath(); ctx.arc(P[0], P[1], 3, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#F4EEE3'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
    }
    // contorno de la gota de dos centros: max(elipsoide pesado, elipsoide ligero, cuello)
    function contornoII(t, a) {
      var sg = sgDe(t), d = dist(sg), e = 1 + .18 * suave(sg), cH = -d * AL / (AH + AL), cL = d * AH / (AH + AL);
      var aH = RH * e + .9, bH = RH / Math.sqrt(e) + .9, aL = RL * e + .9, bL = RL / Math.sqrt(e) + .9;
      var zm = (cH + RH * e + cL - RL * e) / 2, rn = 2.7 * (1 - suave((sg - .5) / .5)) + .25 * (1 - sg);
      function rho(z) {
        var r = 0, u;
        u = (z - cH) / aH; if (Math.abs(u) < 1) r = Math.max(r, bH * Math.sqrt(1 - u * u));
        u = (z - cL) / aL; if (Math.abs(u) < 1) r = Math.max(r, bL * Math.sqrt(1 - u * u));
        if (z > cH + aH * .4 && z < cL - aL * .4 && rn > .05) r = Math.max(r, Math.min(Math.min(bH, bL) * .8, rn + .3 * (z - zm) * (z - zm)));
        return r;
      }
      var z0 = cH - aH, z1 = cL + aL, N = 140, seg = [], tramos = [], i;
      for (i = 0; i <= N; i++) { var z = z0 + (z1 - z0) * i / N, r = rho(z); if (r > .06) seg.push([z, r]); else if (seg.length) { tramos.push(seg); seg = []; } }
      if (seg.length) tramos.push(seg);
      ctx.save(); ctx.setLineDash([3, 5]); ctx.lineWidth = .8; ctx.strokeStyle = TINTA + (.42 * a) + ')';
      tramos.forEach(function (S) {
        var pts = S.map(function (q) { return aPantalla(enEje(q[0], -q[1], 0)); }), abajo = S.slice().reverse().map(function (q) { return aPantalla(enEje(q[0], q[1], 0)); });
        trazo(pts.concat(abajo), true);
      });
      // eje de simetría (raya y punto), centros y cota de la distancia entre centros
      var E0 = aPantalla(enEje(z0 - 3, 0, 0)), E1 = aPantalla(enEje(z1 + 3, 0, 0)), PH = aPantalla(enEje(cH, 0, 0)), PL = aPantalla(enEje(cL, 0, 0));
      ctx.setLineDash([10, 3, 1.5, 3]); ctx.lineWidth = .6; ctx.strokeStyle = TINTA + (.32 * a) + ')'; trazo([E0, E1]); ctx.setLineDash([]);
      ctx.lineWidth = .9; ctx.strokeStyle = VINO + (.7 * a) + ')';
      [PH, PL].forEach(function (P) { trazo([[P[0] - 4, P[1]], [P[0] + 4, P[1]]]); trazo([[P[0], P[1] - 4], [P[0], P[1] + 4]]); });
      var off = Math.max(bH, bL) + 2.6, Q0 = aPantalla(enEje(cH, off, 0)), Q1 = aPantalla(enEje(cL, off, 0)), q0 = aPantalla(enEje(cH, bH * .5, 0)), q1 = aPantalla(enEje(cL, bL * .5, 0));
      ctx.lineWidth = .6; ctx.strokeStyle = TINTA + (.4 * a) + ')'; trazo([q0, [Q0[0], Q0[1] + 5]]); trazo([q1, [Q1[0], Q1[1] + 5]]);
      flecha((Q0[0] + Q1[0]) / 2, (Q0[1] + Q1[1]) / 2, Q0[0], Q0[1], TINTA, .55 * a, .7); flecha((Q0[0] + Q1[0]) / 2, (Q0[1] + Q1[1]) / 2, Q1[0], Q1[1], TINTA, .55 * a, .7);
      txt('d ≈ ' + coma(d, 1) + ' fm', (Q0[0] + Q1[0]) / 2, (Q0[1] + Q1[1]) / 2 + 15, { it: true, px: 14, c: '#1E1A16', a: a * .9, al: 'center' });
      ctx.restore();
    }
    function parteII(t, tau, vb) {
      // II·1: la barrera arriba a la izquierda y el contorno que pasa de una gota a dos
      barrera(t, suave((t - T_P2 + .3) / .9) * (1 - suave((t - T_SC - .1) / .5)));
      var ac = suave((t - T_P2 - .2) / 1.4) * (1 - suave((t - T_SC + .05) / .2));
      if (ac > 0 && t < T_SC + .3) contornoII(t, ac);
      if (tau < -.1) return;
      // la escisión: chispa en el cuello, anillo fino y astillas de tinta
      var Pz = aPantalla(enEje(ZM1, 0, 0));
      if (tau < 1.4) {
        var e1 = cl(tau / .7, 0, 1), r = 6 + 120 * salidaExp(tau / 1.2), ar = 1 - suave(tau / 1.3);
        brillo(Pz[0], Pz[1], 0, 26 + 90 * e1, '255,236,196', .75 * Math.pow(1 - e1, 2) * cl((tau + .1) / .1, 0, 1));
        brillo(Pz[0], Pz[1], 0, 10 + 30 * e1, '255,250,236', .9 * Math.pow(1 - e1, 3));
        ctx.lineWidth = 1.2 * ar + .2; ctx.strokeStyle = VINO + (.55 * ar) + ')'; ctx.beginPath(); ctx.arc(Pz[0], Pz[1], r, 0, 2 * Math.PI); ctx.stroke();
        ctx.lineWidth = .7; ctx.strokeStyle = ORO + (.55 * ar * ar) + ')';
        for (var k = 0; k < 14; k++) { var th = k / 14 * 2 * Math.PI + .2, l0 = r * .5, l1 = r * (.62 + .1 * (k % 3)); trazo([[Pz[0] + Math.cos(th) * l0, Pz[1] + Math.sin(th) * l0], [Pz[0] + Math.cos(th) * l1, Pz[1] + Math.sin(th) * l1]]); }
      }
      if (tau < 0) return;
      // II·2: contornos de los fragmentos que vibran, fuerza de Coulomb (igual y opuesta), velocidades y nombres
      var af = suave(tau / .3) * (1 - suave((tau - 2.4) / 1)), am = suave(tau / .35) * (1 - suave((tau - 3.8) / 1)), al = suave((tau - .1) / .4) * (1 - suave((tau - 5.2) / 1));
      var fa = formaFr(tau), u = uDe(tau), q = Math.sqrt(Math.max(0, 1 - 1 / u)), ang = Math.atan2(EJE[1], EJE[0]), nx = -EJE[1], ny = EJE[0];
      ['H', 'L'].forEach(function (k) {
        var F = fr[k], R = k === 'H' ? RH : RL, P = aPantalla(F.c), Rs = R * CAM.s * fa, dx = EJE[0] * F.lado, dy = EJE[1] * F.lado;
        if (af > 0) {
          ctx.save(); ctx.translate(P[0], P[1]); ctx.rotate(ang); ctx.setLineDash([3, 5]); ctx.lineWidth = .8; ctx.strokeStyle = TINTA + (.4 * af) + ')';
          ctx.beginPath(); ctx.ellipse(0, 0, (R * fa + .9) * CAM.s, (R / Math.sqrt(fa) + .9) * CAM.s, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
        }
        if (am > 0) {
          var s0 = Rs + 10, LF = 12 + 82 / (u * u), LV = 6 + 150 * q * (k === 'H' ? AL : AH) / (AH + AL);
          flecha(P[0] + dx * s0, P[1] + dy * s0, P[0] + dx * (s0 + LF), P[1] + dy * (s0 + LF), VINO, .85 * am, 1.3);
          txt('F', P[0] + dx * (s0 + LF + 10), P[1] + dy * (s0 + LF + 10) + 5, { it: true, px: 15, c: '#7A2E22', a: am, al: 'center' });
          var b0 = Rs * .95 + 14, V0 = [P[0] + nx * b0, P[1] + ny * b0], V1 = [V0[0] + dx * LV, V0[1] + dy * LV];
          flecha(V0[0], V0[1], V1[0], V1[1], TINTA, .7 * am, 1);
          var vv = .0483 * q * (k === 'H' ? AL / AH : 1);
          txt('v ≈ ' + coma(vv, 3) + ' c', V1[0] + dx * 8, V1[1] + 4, { mono: true, px: 8.5, c: '#1E1A16', a: am, al: F.lado < 0 ? 'right' : 'left' });
        }
        if (al > 0) {
          var nom = k === 'H' ? (tau < .8 ? '¹⁴²Ba*' : '¹⁴¹Ba') : (tau < .45 ? '⁹⁴Kr*' : tau < .95 ? '⁹³Kr*' : '⁹²Kr'), tc = k === 'H' ? [.8] : [.45, .95], parp = 1;
          tc.forEach(function (te) { parp *= 1 - .75 * Math.exp(-Math.pow((tau - te) / .09, 2)); });
          var Np = [P[0] - nx * (Rs + 28), P[1] - ny * (Rs + 28)];
          txt(nom, Np[0], Np[1], { it: true, px: 21, c: '#1E1A16', a: al * parp, al: 'center' });
          txt(k === 'H' ? 'Z = 56' : 'Z = 36', Np[0], Np[1] + 13, { mono: true, px: 7, c: '#8E8478', a: al * parp, al: 'center' });
        }
      });
      // cada neutrón evaporado deja un anillo dorado donde nace
      libres.forEach(function (n) {
        var dt = tau - n.emite.t; if (dt < 0 || dt > .7) return;
        var P0 = aPantalla(posLibre(n, n.emite.t)), e = dt / .7;
        ctx.lineWidth = 1; ctx.strokeStyle = ORO + (.8 * (1 - e)) + ')'; ctx.beginPath(); ctx.arc(P0[0], P0[1], 3 + 26 * salidaExp(e), 0, 2 * Math.PI); ctx.stroke();
        brillo(P0[0], P0[1], 0, 16, '246,214,150', .5 * (1 - e));
      });
    }

    // cámara: escala (px/fm) interpolada en logaritmo entre cuadros clave, con tangentes suaves
    var CLAVE = [[0, 19], [T_SC, 19], [T_SC + 1.5, 17], [T_SC + 5, 6.5], [T_P3 + .4, 2.5], [T_P3 + 3.5, 2.3], [T_P3 + 6.5, 1.6], [T_P3 + 10.5, .85], [T_P3 + 13.5, .64], [T_P4, .58], [T_P4 + 1.8, .17], [T_FL, .0006], [T_FL + 30, .0005]]
      .map(function (k) { return [k[0], Math.log(k[1])]; });
    function escala(t) {
      var K = CLAVE, i = 0; if (t <= K[0][0]) return Math.exp(K[0][1]);
      while (i < K.length - 2 && t > K[i + 1][0]) i++;
      var a = K[i], b = K[i + 1], h = b[0] - a[0], x = cl((t - a[0]) / h, 0, 1);
      var m = function (j) { var p = K[Math.max(0, j - 1)], q = K[Math.min(K.length - 1, j + 1)]; var d = (q[1] - p[1]) / (q[0] - p[0]); return (j === 0 || j === 1) ? 0 : d; };
      var m0 = m(i) * h, m1 = m(i + 1) * h, x2 = x * x, x3 = x2 * x;
      return Math.exp((2 * x3 - 3 * x2 + 1) * a[1] + (x3 - 2 * x2 + x) * m0 + (-2 * x3 + 3 * x2) * b[1] + (x3 - x2) * m1);
    }

    // ── capítulo III: reacción en cadena ──
    // Cada fisión libera 2 o 3 neutrones (media 2,4); cada uno vuela una distancia exponencial y, con
    // probabilidad PF, causa otra fisión; si no, escapa o se absorbe sin fisionar. k = 2,4 · PF ≈ 1,8.
    // Las distancias están comprimidas (en un sólido serían centímetros): se dice en una nota.
    // Dos tiempos: III·1, de cerca, cada fisión se dibuja entera (el núcleo se estira, se parte, los
    // fragmentos se frenan y quedan como productos de fisión); III·2, la cámara se aleja y se cuenta.
    var T_III2 = T_P3 + 6.5, T_SALE = .5;   // inicio de III·2 y retraso entre la captura y la salida de neutrones
    var CAD = { ev: [], ne: [], campo: [] }, PF = .75, V3 = 30, LAM = 24, MAXEV = 5000, T_FIN3 = T_P4 + 1.2;
    (function () {
      var r4 = semilla(131), cola = [];
      function dir() { var u = r4() * 2 - 1, a = r4() * 2 * Math.PI, w = Math.sqrt(1 - u * u); return [w * Math.cos(a), w * Math.sin(a), u]; }
      function mete(e) { var i = cola.length; while (i > 0 && cola[i - 1].t > e.t) i--; cola.splice(i, 0, e); }
      [.6, 1.1, 1.7].forEach(function (dt, i) {   // los tres neutrones del capítulo II encuentran su núcleo
        var n = libres[i], th = T_P3 + dt; n.golpe = th; mete({ t: th, p: posLibre(n, th - T_SC), g: 1 });
      });
      while (cola.length && CAD.ev.length < MAXEV) {
        var e = cola.shift(); e.i = CAD.ev.length; CAD.ev.push(e);
        var a = r4() * 2 * Math.PI; e.fd = [Math.cos(a), Math.sin(a)];   // eje de los fragmentos
        e.gm = [r4() * 2 * Math.PI, r4() * 2 * Math.PI];                    // direcciones de dos rayos γ
        var nu = r4() < .4 ? 3 : 2;
        for (var k = 0; k < nu; k++) {
          var d = dir(), L = 6 - LAM * Math.log(1 - r4() * .999), t0 = e.t + T_SALE, dest = r4(), fate = dest < PF ? 'f' : dest < PF + .14 ? 'e' : 'a';
          if (fate === 'e') L = L * 2.5 + 60;
          // salen de los fragmentos ya separados, no del centro
          var lado = k % 2 ? 1 : -1, o = [e.p[0] + e.fd[0] * lado * 3, e.p[1] + e.fd[1] * lado * 3, e.p[2]];
          var p1 = [o[0] + d[0] * L, o[1] + d[1] * L, o[2] + d[2] * L], t1 = t0 + L / V3;
          CAD.ne.push({ t0: t0, t1: t1, p0: o, p1: p1, fate: fate, g: e.g });
          if (fate === 'f' && t1 < T_FIN3) mete({ t: t1, p: p1, g: e.g + 1 });
          if (fate === 'a') CAD.campo.push({ p: p1, t: 1e9, abs: t1 });
        }
      }
      CAD.ev.forEach(function (e) { CAD.campo.push({ p: e.p, t: e.t }); });
      // núcleos que no participan: dan textura al material y aparecen al alejarse
      var r5 = semilla(17);
      for (var i = 0; i < 1500; i++) {
        var rr = 40 + r5() * 640, aa = r5() * 2 * Math.PI, zz = (r5() * 2 - 1) * 200;
        CAD.campo.push({ p: [Math.cos(aa) * rr, Math.sin(aa) * rr * .8, zz], t: 1e9, bg: true });
      }
      CAD.gen = 0; CAD.ev.forEach(function (e) { CAD.gen = Math.max(CAD.gen, e.g); });
      CAD.campo.forEach(function (c) { var z = Math.abs(c.p[2]); c.b = c.bg ? (z < 120 ? 1 : 2) : (z < 150 ? 0 : 1); });
      CAD.ne.forEach(function (n) { n.L = Math.hypot(n.p1[0] - n.p0[0], n.p1[1] - n.p0[1]) || 1; });
      CAD.abs = CAD.ne.filter(function (n) { return n.fate === 'a'; });
      CAD.fis = CAD.ne.filter(function (n) { return n.fate === 'f'; });
      // por generación: cuántas fisiones y cuándo termina (para la gráfica de III·2)
      CAD.porG = []; CAD.finG = [];
      CAD.ev.forEach(function (e) { CAD.porG[e.g] = (CAD.porG[e.g] || 0) + 1; CAD.finG[e.g] = Math.max(CAD.finG[e.g] || 0, e.t); });
    })();
    function generacion(t) { var g = 0; for (var i = 0; i < CAD.ev.length && CAD.ev[i].t <= t; i++) g = Math.max(g, CAD.ev[i].g); return g; }
    function fisiones(t) { var lo = 0, hi = CAD.ev.length; while (lo < hi) { var m = (lo + hi) >> 1; if (CAD.ev[m].t <= t) lo = m + 1; else hi = m; } return lo; }
    // ── notas: punto, guía que se dibuja, regla, rótulo, título y texto ──
    var notas = [];
    function nota(o) {
      var g = el('g', { 'class': 'fz-nota' + (o.luz ? ' fz-luz' : '') }, capa), lado = o.lado || 1, ancho = o.ancho || 236;
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
    var nK = en(DER, { k: 'Reacción en cadena', tit: 'Factor de multiplicación k',
      d: ['Cada fisión libera 2 o 3 neutrones; unos', 'escapan, otros se absorben sin fisionar.', 'k es cuántos causan, en promedio, una', 'nueva fisión. Si k > 1 la población crece', 'como N ≈ kᵍ por generación g.'] });
    var nX = en(ARR, { k: 'Fuera de escala', tit: 'El espacio está comprimido',
      d: ['En un sólido los núcleos distan ~10⁻¹⁰ m', 'y un neutrón recorre del orden de', 'centímetros entre choques: unas 10¹²', 'veces el tamaño del núcleo. Aquí las', 'distancias se acortan para poder verlo.'] });
    var nV = en(ARR, { k: 'Tiempo de generación', tit: '≈ 10 ns por generación',
      d: ['Con neutrones rápidos (≈ 2 MeV) cada', 'generación dura del orden de 10⁻⁸ s.', 'En la gráfica, kᵍ es una recta. Con', 'k ≈ 1,8, llegar a 10²³ fisiones toma', '≈ 90 generaciones: menos de 1 µs.'] });
    var nW = en(ABA, { k: 'Energía', tit: '≈ 200 MeV por fisión',
      d: ['Son 3,2 × 10⁻¹¹ J: muy poco. Un', 'kilotón de TNT (4,184 × 10¹² J) equivale', 'a ≈ 1,3 × 10²³ fisiones, 23 órdenes de', 'magnitud más que este destello.'] });
    var ARR4 = { tx: 1198, ty: 192, ancho: 220 }, DER4 = { tx: 1198, ty: 448, ancho: 220 };
    var nB = en(ARR4, { luz: true, k: 'Bola de fuego', tit: 'Brilla como un cuerpo negro',
      d: ['La energía calienta el aire hasta', 'que emite luz térmica. La esfera se', 'expande y, al enfriarse, su color', 'pasa del blanco al naranja (Wien).'] });
    var nT = en(DER4, { luz: true, k: 'Onda de choque', tit: 'R(t) ≈ (E t² / ρ)¹ᐟ⁵',
      d: ['G. I. Taylor (1950), por análisis', 'dimensional: el frente crece como', 't²ᐟ⁵ y solo depende de la energía', 'E y de la densidad del aire ρ.'] });
    var nH = en(ARR4, { luz: true, k: 'Nube en forma de hongo', tit: 'Flotación y vórtice',
      d: ['El aire caliente, menos denso,', 'sube (Rayleigh–Taylor). Su borde', 'se enrolla en un toro que gira y', 'aspira polvo del suelo: el tallo.'] });
    var nO = en(DER4, { luz: true, k: 'Epílogo', tit: 'E = Δm c²',
      d: ['Todo empezó con un neutrón de', '0,025 eV. Cada fisión convierte en', 'energía ≈ 0,08 % de la masa del', 'núcleo; más de 10²³ fisiones llegan', 'a la escala del paisaje.'] });
    var AGENDA = [[nB, T_FL + 1.7, T_FL + 6.3], [nT, T_FL + 2.2, T_FL + 6.3], [nH, T_FL + 7.4, FIN - .4], [nO, T_FL + 11.5, FIN - .4], [nK, T_P3 + 1.8, T_III2 - .2], [nX, T_P3 + 3.4, T_III2 + 2.6], [nW, T_III2 + 2.2, T_P4 + 1.2], [nV, T_III2 + 3.2, T_P4 + 1], [nU, 1.4, 8.6], [nN, 4.2, 9.6], [nC, 9.6, 17.8], [nG, 12.2, 17.6], [nS, T_P2 + 3.2, T_SC + .5], [nF, T_SC + .9, T_SC + 6], [nP, T_SC + 2, T_SC + 7.6], [nE, T_SC + 4.4, T_P3 + 1.4]];

    // ── capítulos ──
    // 4.º elemento opcional: sub-etapas [[t, nombre], …] (la primera empieza con el capítulo); marcan la barra y dan el subtítulo
    var CAPS = [['I', 'Captura', 0], ['II', 'Fisión', T_P2, [[T_P2, 'Escisión'], [T_SC, 'Fragmentos']]], ['III', 'Cadena', T_P3], ['IV', 'Escala', T_P4, [[T_P4, 'Destello'], [T_FL + 6.5, 'Hongo']]]];
    CAPS[2][3] = [[T_P3, 'Primeras fisiones'], [T_III2, 'Crecimiento']];   // sub-etapas de la III
    var barra = document.createElement('nav'); barra.className = 'fz-caps'; barra.setAttribute('aria-label', 'Capítulos de la animación');
    CAPS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fz-cap' + (c[2] == null ? ' fz-pronto' : '');
      b.innerHTML = '<span class="fz-cap-n">' + c[0] + '</span><span class="fz-cap-t">' + c[1] + '</span><i class="fz-cap-l"><i></i></i>';
      if (c[2] != null) b.addEventListener('click', function () { salta(c[2]); }); else b.disabled = true;
      c.b = b; c.l = b.querySelector('.fz-cap-l i'); barra.appendChild(b);
      if (c[3]) {
        c.s = document.createElement('span'); c.s.className = 'fz-cap-s'; b.appendChild(c.s);
        var k = CAPS.indexOf(c), fin = k + 1 < CAPS.length ? CAPS[k + 1][2] : FIN;
        c[3].forEach(function (e, j) { if (!j) return; var m = document.createElement('b'); m.className = 'fz-cap-m'; m.style.left = (100 * (e[0] - c[2]) / (fin - c[2])).toFixed(1) + '%'; b.appendChild(m); });
      }
    });
    fig.appendChild(barra);

    var T = 0, W = 0, H = 0, dpr = 1, ecAct = '';
    function salta(t) { T = t; notas.forEach(function (n) { n.pon(false); }); }
    function reinicia() { salta(0); }
    var fijo = false;
    fig.fzInfo = function () { return { ev: CAD.ev.length, ne: CAD.ne.length, gen: CAD.gen, tUlt: CAD.ev[CAD.ev.length - 1].t, campo: CAD.campo.length, porG: CAD.porG, finG: CAD.finG }; };
    fig.fzSalta = salta; fig.fzFija = function (t) { salta(t); fijo = true; }; fig.fzSuelta = function () { fijo = false; };   // para capturas
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (on && !fig.fzOn) reinicia(); if (!on && raiz) { raiz.classList.remove('fz-noche'); nocheOn = false; sacudida(-1); } fig.fzOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });

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
        var sg = sgDe(t), b = suave(sg / SG_B);
        nuc.forEach(function (n) {
          var w = sitio(n.fr, n.loc, sg), j = jit(n, t, .34);
          if (n.cu > .01) {   // el cuello: se estira hacia el centro y se adelgaza hacia el eje
            var o = cuello(n, sg) * -fr[n.fr].lado, par = w[0] * EJE[0] + w[1] * EJE[1], ap = .5 * n.cu * suave(sg / .45);
            w = [w[0] + EJE[0] * o - (w[0] - EJE[0] * par) * ap, w[1] + EJE[1] * o - (w[1] - EJE[1] * par) * ap, w[2] * (1 - ap)];
          }
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
          n.vis = 1;
          if (n.emite && tau > n.emite.t) { var pl = posLibre(n, tau); n.x = pl[0]; n.y = pl[1]; n.z = pl[2]; if (t > n.golpe) n.vis = 0; }
          else {
            if (n.cu > .01 && tau < 1.5) {   // el cuello roto se recoge con un rebote amortiguado
              var rb = Math.exp(-tau / .16) * Math.cos(tau * 13), o2 = n.cu * CU0 * rb * -F.lado, ap2 = .5 * n.cu * rb, pr = loc[0] * EJE[0] + loc[1] * EJE[1];
              loc = [loc[0] + EJE[0] * o2 - (loc[0] - EJE[0] * pr) * ap2, loc[1] + EJE[1] * o2 - (loc[1] - EJE[1] * pr) * ap2, loc[2] * (1 - ap2)];
            }
            n.x = c[0] + loc[0] + j[0]; n.y = c[1] + loc[1] + j[1]; n.z = c[2] + loc[2] + j[2]; n.vis = 1 - suave((t - T_P3 - 1) / 2.5);
          }
        });
      });
    }

    // sprites del capítulo III: destello cálido y núcleos en miniatura pintados con las esferas de la parte I
    var LUZ = (function () {
      var S = 128, c = document.createElement('canvas'); c.width = c.height = S; var x = c.getContext('2d'), g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.addColorStop(0, 'rgba(255,244,214,1)'); g.addColorStop(.12, 'rgba(252,214,140,.95)'); g.addColorStop(.35, 'rgba(236,150,60,.45)'); g.addColorStop(.7, 'rgba(214,110,40,.12)'); g.addColorStop(1, 'rgba(214,110,40,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S); return c;
    })();
    function miniNucleo(A, Z, sem) {
      var R = 1.2 * Math.cbrt(A), pq = empaca(A, R, sem), S = 200, k = (S / 2 - 3) / R, c = document.createElement('canvas'); c.width = c.height = S;
      var x = c.getContext('2d'), rz = semilla(sem + 7), tipo = pq.p.map(function (q, i) { return i < Z; }), i;
      for (i = tipo.length - 1; i > 0; i--) { var j = Math.floor(rz() * (i + 1)), w = tipo[i]; tipo[i] = tipo[j]; tipo[j] = w; }
      var ord = pq.p.map(function (q, i) { return i; }).sort(function (a, b) { return pq.p[a][2] - pq.p[b][2]; });
      ord.forEach(function (i) {   // de atrás hacia adelante, como el núcleo grande
        var q = pq.p[i], r = pq.r * .98 * k * (1 + q[2] / R * .1);
        x.globalAlpha = .8 + .2 * cl(.5 + q[2] / (2 * R), 0, 1);
        x.drawImage(tipo[i] ? SPR.p : SPR.n, S / 2 + q[0] * k - r, S / 2 + q[1] * k - r, 2 * r, 2 * r);
      });
      return { c: c, R: R * S / 2 / (S / 2 - 3) };   // radio del dibujo, en fm
    }
    var MINI = null, R_H = 1.2 * Math.cbrt(141), R_L = 1.2 * Math.cbrt(92);
    // fragmentos: parten tocándose y se frenan en el material; el ligero recorre 1,5 veces más (momento)
    var T_ESC = .45, D_H = 4.6, D_L = 7.1, V_H = 10, V_L3 = 15;
    function despl(de) { var u = 1 - Math.exp(-Math.max(0, de - T_ESC) / .55); return [D_H + V_H * u, D_L + V_L3 * u]; }
    function mini(M, x, y, r, a, ang, alarga) {
      if (a <= .01 || r < .5) return;
      ctx.globalAlpha = a;
      if (alarga && alarga > 1.001) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(alarga, 1 / Math.sqrt(alarga));
        ctx.drawImage(M.c, -r, -r, 2 * r, 2 * r); ctx.restore();
      } else ctx.drawImage(M.c, x - r, y - r, 2 * r, 2 * r);
    }
    function onda(x, y, ux, uy, dd, Lp, amp, a) {   // paquete de onda (rayo γ), como en la parte II
      var n = 18; ctx.strokeStyle = 'rgba(196,140,52,' + a + ')'; ctx.lineWidth = 1; ctx.beginPath();
      for (var k = 0, pr = false; k <= n; k++) {
        var s = dd - Lp + Lp * k / n; if (s < 0) continue;
        var env = Math.sin(Math.PI * k / n), off = amp * env * Math.sin(k / n * 6 * Math.PI);
        var X = x + ux * s - uy * off, Y = y + uy * s + ux * off;
        if (!pr) { ctx.moveTo(X, Y); pr = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
    function cadena(t, vb, fundido) {
      if (!MINI) MINI = { U: miniNucleo(236, 92, 41), H: miniNucleo(141, 56, 43), L: miniNucleo(92, 36, 47) };
      // todo lo numeroso se agrupa en pocos trazos (un camino por tono) para que miles de puntos cuesten poco
      var s = CAM.s, x0 = vb.x - 20, x1 = vb.x + vb.width + 20, y0 = vb.y - 20, y1 = vb.y + vb.height + 20, i, k, P, Q, e, de;
      var aparece = suave((t - (T_P3 - 3)) / 3);
      var det = 1 - suave((t - T_III2 + .6) / 2.2);   // III·1 dibujado → III·2 punteado
      function dentro(P, m) { return P[0] > x0 - m && P[0] < x1 + m && P[1] > y0 - m && P[1] < y1 + m; }
      // material: núcleos de uranio en espera, como un punteado fino de tinta (a esta escala son puntos)
      var rd = cl(RU * s * .25, .7, 1.8), tonos = [.42, .3, .17];
      ctx.fillStyle = '#5A2A20';
      for (k = 0; k < 3; k++) {
        ctx.globalAlpha = fundido * aparece * tonos[k] * (1 - .35 * det); ctx.beginPath();
        for (i = 0; i < CAD.campo.length; i++) {
          var c = CAD.campo[i]; if (c.b !== k || t >= c.t) continue;
          P = aPantalla(c.p); if (!dentro(P, 0)) continue;
          ctx.moveTo(P[0] + rd, P[1]); ctx.arc(P[0], P[1], rd, 0, 2 * Math.PI);
        }
        ctx.fill();
      }
      var fin = fisiones(t), ini = fisiones(t - 2.6);
      // productos de fisión: los dos fragmentos, ya frenados, quedan como puntos oscuros
      var rq = Math.max(.8, 1.15 * s), viejos = fisiones(t - 1.6);
      ctx.fillStyle = '#4A241C'; ctx.globalAlpha = fundido * .62; ctx.beginPath();
      for (i = 0; i < viejos; i++) {
        e = CAD.ev[i]; var dq = despl(t - e.t), aq = cl((t - e.t - 1.6) / .8, 0, 1); if (aq <= 0) continue;
        P = aPantalla(e.p); if (!dentro(P, 40)) continue;
        var rr = rq * (.6 + .4 * aq);
        ctx.moveTo(P[0] - e.fd[0] * dq[0] * s + rr, P[1] - e.fd[1] * dq[0] * s); ctx.arc(P[0] - e.fd[0] * dq[0] * s, P[1] - e.fd[1] * dq[0] * s, rr, 0, 2 * Math.PI);
        ctx.moveTo(P[0] + e.fd[0] * dq[1] * s + rr * .85, P[1] + e.fd[1] * dq[1] * s); ctx.arc(P[0] + e.fd[0] * dq[1] * s, P[1] + e.fd[1] * dq[1] * s, rr * .85, 0, 2 * Math.PI);
      }
      ctx.fill();
      if (det > .01) {
        // ramas: el camino de cada neutrón que causó una fisión queda un rato, a tinta discontinua (el árbol de generaciones)
        ctx.setLineDash([2, 3.5]); ctx.lineWidth = .7;
        for (k = 0; k < 3; k++) {
          ctx.globalAlpha = fundido * det * .34 * (1 - k / 3); ctx.strokeStyle = '#3A2E26'; ctx.beginPath();
          for (i = 0; i < CAD.fis.length; i++) {
            var nf = CAD.fis[i], ed = t - nf.t1; if (ed < k * 1.4 || ed >= (k + 1) * 1.4) continue;
            P = aPantalla(nf.p0); Q = aPantalla(nf.p1); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
        // el núcleo al que va un neutrón se define (de punto a núcleo dibujado) mientras este se acerca
        var Ru = MINI.U.R * s, lim = fisiones(t + 1.1);
        for (i = fin; i < lim && i < fin + 90; i++) {
          e = CAD.ev[i]; var fo = suave(1 - (e.t - t) / 1.1);
          P = aPantalla(e.p); if (!dentro(P, Ru)) continue;
          mini(MINI.U, P[0], P[1], rd + (Ru - rd) * fo, fundido * det * fo, 0, 0);
        }
      }
      // fisiones recientes, de la más vieja a la más nueva
      var dib = 0, sx = 0, sy = 0, cuenta = 0, frag = [[], [], [], []], Rh = MINI.H.R * s, Rl = MINI.L.R * s;
      for (i = ini; i < fin; i++) {
        e = CAD.ev[i]; de = t - e.t;
        P = aPantalla(e.p); if (!dentro(P, 60)) continue;
        if (de < 1.6 && cuenta < 400) { sx += P[0]; sy += P[1]; cuenta++; }
        var ang = Math.atan2(e.fd[1], e.fd[0]);
        if (det > .01 && dib < 140) {
          dib++;
          // núcleo compuesto ²³⁶U*: un pulso, calor y se estira a lo largo del eje de fisión
          if (de < T_ESC + .06) {
            var al = 1 + .6 * suave((de - .08) / (T_ESC - .08)), ac = 1 - cl((de - T_ESC) / .06, 0, 1);
            ctx.globalAlpha = fundido * det * .3 * ac; ctx.drawImage(LUZ, P[0] - Ru * 1.8, P[1] - Ru * 1.8, Ru * 3.6, Ru * 3.6);
            mini(MINI.U, P[0], P[1], Ru, fundido * det * ac, ang, al);
          }
          if (de < 1.2) {
            var up = de / 1.2; ctx.globalAlpha = fundido * det;
            ctx.strokeStyle = 'rgba(200,120,50,' + (.6 * (1 - up)) + ')'; ctx.lineWidth = 1.2 * (1 - up) + .3;
            ctx.beginPath(); ctx.arc(P[0], P[1], Ru * (1 + up * 2.6), 0, 2 * Math.PI); ctx.stroke();
          }
          if (de > T_ESC) {
            var d2 = de - T_ESC, dq2 = despl(de), af = fundido * det * cl(d2 / .06, 0, 1) * (1 - suave((de - 1.5) / .8)), sh = 1 - .45 * suave((de - 1.3) / 1);
            // destello de la escisión
            if (d2 < .8) { var rl = (Ru * 2.6 + 8) * (.5 + d2 * 1.1), a2 = 1 - d2 / .8; ctx.globalAlpha = fundido * det * a2 * a2 * .95; ctx.drawImage(LUZ, P[0] - rl, P[1] - rl, 2 * rl, 2 * rl); }
            // dos fragmentos que se separan y se frenan; nacen alargados y vibran
            var vib = 1 + .2 * Math.exp(-d2 / .5) * Math.cos(2 * Math.PI * d2 / .45);
            mini(MINI.H, P[0] - e.fd[0] * dq2[0] * s, P[1] - e.fd[1] * dq2[0] * s, Rh * sh, af, ang, vib);
            mini(MINI.L, P[0] + e.fd[0] * dq2[1] * s, P[1] + e.fd[1] * dq2[1] * s, Rl * sh, af, ang, vib);
            // dos rayos γ que salen a la velocidad de la luz
            if (e.i < 70 && d2 < .7) for (k = 0; k < 2; k++) onda(P[0], P[1], Math.cos(e.gm[k]), Math.sin(e.gm[k]), d2 * 620, 26, 2.6, fundido * det * .8 * (1 - d2 / .7));
          }
        }
        if (det < .99) {
          if (de < .55) { var rl2 = (RU * 1.5 * s + 6) * (.6 + de * 1.2), al2 = (1 - de / .55); ctx.globalAlpha = fundido * (1 - det) * al2 * al2 * .75; ctx.drawImage(LUZ, P[0] - rl2, P[1] - rl2, 2 * rl2, 2 * rl2); }
          if (de < 1.6) frag[Math.min(3, Math.floor(de / .4))].push(P, e.fd, de);
          if (de < 1) { ctx.globalAlpha = fundido * (1 - det); ctx.strokeStyle = 'rgba(200,120,50,' + (.45 * (1 - de)) + ')'; ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(P[0], P[1], 3 + de * 16, 0, 2 * Math.PI); ctx.stroke(); }
        }
      }
      var rf = Math.max(.8, RU * .4 * s);
      ctx.fillStyle = '#7A2E22';
      frag.forEach(function (L, b) {
        ctx.globalAlpha = fundido * (1 - det) * .5 * (1 - (b + .5) / 4); ctx.beginPath();
        for (var j = 0; j < L.length; j += 3) {
          var Q = L[j], d = L[j + 1], dq3 = despl(L[j + 2]);
          ctx.moveTo(Q[0] - d[0] * dq3[0] * s + rf, Q[1] - d[1] * dq3[0] * s); ctx.arc(Q[0] - d[0] * dq3[0] * s, Q[1] - d[1] * dq3[0] * s, rf, 0, 2 * Math.PI);
          ctx.moveTo(Q[0] + d[0] * dq3[1] * s + rf, Q[1] + d[1] * dq3[1] * s); ctx.arc(Q[0] + d[0] * dq3[1] * s, Q[1] + d[1] * dq3[1] * s, rf * .85, 0, 2 * Math.PI);
        }
        ctx.fill();
      });
      // neutrones en vuelo: en III·1 esfera crema con halo dorado y estela; en III·2 punto con borde de tinta
      var puntos = [], vuelo = 0;
      for (i = 0; i < CAD.ne.length; i++) {
        var n = CAD.ne[i]; if (t < n.t0 || t > n.t1) continue;
        vuelo++;
        var u = (t - n.t0) / (n.t1 - n.t0); P = aPantalla([n.p0[0] + (n.p1[0] - n.p0[0]) * u, n.p0[1] + (n.p1[1] - n.p0[1]) * u]); if (!dentro(P, 0)) continue;
        var ub = Math.max(0, u - (det > .01 ? 22 : 9) / n.L); Q = aPantalla([n.p0[0] + (n.p1[0] - n.p0[0]) * ub, n.p0[1] + (n.p1[1] - n.p0[1]) * ub]);
        puntos.push(P, Q, cl((t - n.t0) / .25, 0, 1));
      }
      CAD.vuelo = vuelo;
      var rp = Math.max(1.1, rN * s * .9), rn = Math.max(2.6, rN * s * 1.3);
      if (det < .99) {
        ctx.globalAlpha = fundido * (1 - det); ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(30,26,22,.38)'; ctx.beginPath();
        for (i = 0; i < puntos.length; i += 3) { ctx.moveTo(puntos[i + 1][0], puntos[i + 1][1]); ctx.lineTo(puntos[i][0], puntos[i][1]); }
        ctx.stroke();
        ctx.beginPath(); for (i = 0; i < puntos.length; i += 3) { ctx.moveTo(puntos[i][0] + rp, puntos[i][1]); ctx.arc(puntos[i][0], puntos[i][1], rp, 0, 2 * Math.PI); }
        ctx.fillStyle = '#F3EBDC'; ctx.fill(); ctx.lineWidth = .6; ctx.strokeStyle = 'rgba(30,26,22,.6)'; ctx.stroke();
      }
      if (det > .01) {
        var halo = puntos.length < 600;
        for (i = 0; i < puntos.length; i += 3) {
          P = puntos[i]; Q = puntos[i + 1]; var na = fundido * det * puntos[i + 2];
          var gt = ctx.createLinearGradient(Q[0], Q[1], P[0], P[1]); gt.addColorStop(0, 'rgba(30,26,22,0)'); gt.addColorStop(1, 'rgba(30,26,22,.5)');
          ctx.globalAlpha = na; ctx.strokeStyle = gt; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
          if (halo) { ctx.globalAlpha = na * .45; ctx.drawImage(LUZ, P[0] - rn * 2.6, P[1] - rn * 2.6, rn * 5.2, rn * 5.2); }
          ctx.globalAlpha = na; ctx.drawImage(SPR.n, P[0] - rn, P[1] - rn, 2 * rn, 2 * rn);
        }
      }
      // absorciones sin fisión: un anillo gris breve
      ctx.globalAlpha = fundido; ctx.strokeStyle = 'rgba(110,100,90,.45)'; ctx.lineWidth = .7; ctx.beginPath();
      for (i = 0; i < CAD.abs.length; i++) {
        var a = CAD.abs[i]; if (t < a.t1 || t > a.t1 + .6) continue;
        P = aPantalla(a.p1); if (!dentro(P, 0)) continue;
        var ra = rd + 2 + (t - a.t1) / .6 * 8 * (1 + det); ctx.moveTo(P[0] + ra, P[1]); ctx.arc(P[0], P[1], ra, 0, 2 * Math.PI);
      }
      ctx.stroke();
      // brillo de conjunto: crece con el número de fisiones recientes
      var nAct = fin - fisiones(t - 1.6);
      if (nAct > 4 && cuenta) {
        var I = Math.min(1, Math.log(nAct) / Math.log(900)), cx = sx / cuenta, cy = sy / cuenta, R = 60 + 260 * I;
        ctx.globalAlpha = fundido * .45 * I * (1 - .5 * det); ctx.drawImage(LUZ, cx - R, cy - R, 2 * R, 2 * R);
        CAD.cx = cx; CAD.cy = cy;
      }
      ctx.globalAlpha = fundido;
      CAD.act = nAct;
      grafica(t, fundido);
    }
    // III·2: gráfica a tinta de las fisiones por generación, en escala logarítmica (kᵍ es una recta)
    var GR = { x: 1206, y: 452, w: 190, h: 150 };
    function grafica(t, fundido) {
      var ap = suave((t - T_III2 - .6) / 1.2) * (1 - suave((t - T_P4 + .9) / 1));
      if (ap <= 0 || fig.clientWidth < 600) return;
      // escala fija: todo lo que llega a verse antes de la parte IV
      if (!GR.G) {
        var c4 = [], f4 = fisiones(T_P4 + 1.6), mx = 1;
        for (var j = 0; j < f4; j++) { var gj = CAD.ev[j].g; c4[gj] = (c4[gj] || 0) + 1; mx = Math.max(mx, c4[gj]); GR.G = Math.max(GR.G || 0, gj); }
        GR.dec = Math.max(2, Math.ceil(Math.log10(mx) + .05)); GR.comp = 1;
        for (j = 1; j <= GR.G; j++) if (CAD.finG[j] < T_P4) GR.comp = j;   // última generación completa
      }
      var G = GR.G, dec = GR.dec, X = GR.x, Y = GR.y + GR.h, W = GR.w, Hh = GR.h, dx = (W - 26) / G;
      function yv(N) { return Y - Math.log10(Math.max(1, N)) / dec * Hh; }
      function xg(g) { return X + 22 + (g - .5) * dx; }
      var tr = suave((t - T_III2 - .6) / 1.4);   // los ejes se trazan
      ctx.globalAlpha = fundido * ap;
      ctx.strokeStyle = 'rgba(142,132,120,.9)'; ctx.lineWidth = .75; ctx.beginPath();
      ctx.moveTo(X + 14, Y - Hh * tr); ctx.lineTo(X + 14, Y); ctx.lineTo(X + 14 + (W - 14) * tr, Y); ctx.stroke();
      ctx.fillStyle = '#6B6156'; ctx.font = '700 8.5px "Space Mono", monospace'; ctx.textAlign = 'left';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1.8px';
      ctx.fillText('FISIONES POR GENERACIÓN', X, GR.y - 26);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.font = '400 9px "Space Mono", monospace'; ctx.textAlign = 'right';
      for (var d = 0; d <= dec; d++) {
        var yy = yv(Math.pow(10, d)); ctx.fillText(d === 0 ? '1' : d === 1 ? '10' : '10' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[d], X + 10, yy + 3);
        ctx.beginPath(); ctx.moveTo(X + 14, yy); ctx.lineTo(X + 17, yy); ctx.stroke();
      }
      ctx.textAlign = 'center';
      for (var g = 1; g <= G; g++) if (g === 1 || g % 3 === 0) ctx.fillText(String(g), xg(g), Y + 12);
      ctx.fillText('g', X + W - 4, Y + 12);
      // barras: llenas si la generación terminó, solo contorno mientras crece
      var cnt = [], f0 = fisiones(t);
      for (var i = 0; i < f0; i++) cnt[CAD.ev[i].g] = (cnt[CAD.ev[i].g] || 0) + 1;
      for (g = 1; g <= G; g++) {
        var N = cnt[g] || 0; if (!N) continue;
        var bx = xg(g) - dx * .28, bw = dx * .56, by = yv(N), lleno = t >= CAD.finG[g];
        if (N === 1) by = Y - 2;
        if (lleno) { ctx.fillStyle = 'rgba(122,46,34,.78)'; ctx.fillRect(bx, by, bw, Y - by); }
        else { ctx.strokeStyle = 'rgba(122,46,34,.9)'; ctx.lineWidth = .8; ctx.strokeRect(bx + .4, by, bw - .8, Y - by); }
      }
      // N_g = 3 · 1,8^(g−1): recta discontinua
      // valor esperado N_g = 3 · 1,8^(g−1) (tres neutrones de la primera fisión): recta discontinua
      var tl = suave((t - T_III2 - 1.4) / 1.6), gF = 1 + (GR.comp + .4 - 1) * tl;
      if (tl > 0) {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(200,120,50,.95)'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(xg(1), yv(3)); ctx.lineTo(xg(gF), yv(3 * Math.pow(1.8, gF - 1))); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = fundido * ap * tl; ctx.fillStyle = '#1E1A16'; ctx.textAlign = 'left';
        var mg = 'italic 500 16px "Cormorant Garamond", serif', pq = 'italic 500 11px "Cormorant Garamond", serif', xx = X + 22, yb = GR.y - 4;
        ctx.font = mg; ctx.fillText('N', xx, yb); xx += ctx.measureText('N').width + 1;
        ctx.font = pq; ctx.fillText('g', xx, yb + 4); xx += ctx.measureText('g').width + 4;
        ctx.font = mg; ctx.fillText('≈ 3 · 1,8', xx, yb); xx += ctx.measureText('≈ 3 · 1,8').width + 1;
        ctx.font = pq; ctx.fillText('g − 1', xx, yb - 7);
        ctx.font = '400 8px "Space Mono", monospace'; ctx.fillStyle = '#8E8478';
        ctx.fillText('huecas: generaciones en curso', X + 14, Y + 26);
      }
      ctx.globalAlpha = fundido; ctx.textAlign = 'left';
    }

    // ── capítulo IV: cambio de escala y explosión ──
    // IV·1 destello: la bola de fuego nace como cúpula sobre el suelo, la onda de choque y el polvo.
    // IV·2 hongo: al enfriarse, el aire caliente (menos denso) sube; la cúpula se enrolla en un toro y deja un tallo.
    var GX = 880, SUELO = 650, T_ONDA = 1.25, T_HG = T_FL + 6.5;   // punto cero, horizonte (SVG), llegada de la onda, inicio del hongo
    function choque(tf) { return 150 * Math.pow(Math.max(tf, 0) + .02, .4); }           // Taylor: R ∝ t^(2/5)
    function bolaFuego(tf) { var x = Math.max(tf, 0); return 128 * Math.pow(Math.min(1, x / 1.6), .4) * (1 + .12 * suave((x - 1.6) / 2)); }   // crece rápido y luego se hincha despacio
    // encuadre: en IV·1 la cámara está cerca de la bola de fuego; al nacer el hongo se aleja despacio
    function zoomIV(tf) { return 1.45 - .45 * suave((tf - 5.4) / 7.5); }
    function aSVG(x, h, Z) { return [GX + x * Z, SUELO - h * Z]; }
    function nubeIV(tf) {
      var Rf = bolaFuego(tf), u = Math.max(0, tf - (T_HG - T_FL)), o = { Rf: Rf, hb: Rf * .55 };
      o.af = 1 - suave((tf - 6.7) / 3);
      o.et = tf < .5 ? tf / .5 : tf < 4 ? 1 + .2 * (tf - .5) / 3.5 : 1.2 + .8 * suave((tf - 4) / 5);
      o.Rt = 62 + 92 * (1 - Math.exp(-u / 4.5)); o.rt = 84; o.Hc = o.hb + 320 * (1 - Math.exp(-u / 5.2));
      o.aCap = suave(u / 1.6); o.cal = tf < T_HG - T_FL ? 1 : Math.exp(-u / 4.5); o.bajo = .7 * Math.exp(-u / 9); o.giro = .3 * u;
      o.hTop = o.Hc - o.rt * .3; o.rS = 12 + 26 * (1 - Math.exp(-u / 4)); o.aS = suave((u - .6) / 2.2);
      o.rM = tf < 6.5 ? choque(tf) * .8 : choque(6.5) * .8 + 11 * (tf - 6.5); o.hB = 20 + 66 * (1 - Math.exp(-tf / 2.6));
      o.aB = suave((tf - .35) / .6) * (1 - .35 * suave((tf - 16) / 6));
      return o;
    }
    var HUMO = (function () {
      var r8 = semilla(211), est = [], cerro = [], chis = [], i;
      for (i = 0; i < 110; i++) chis.push({ a: -Math.PI * (.06 + .88 * r8()), v: .4 + r8(), vida: 1.5 + r8() * 3.5, z: r8() });
      for (i = 0; i < 150; i++) est.push({ x: r8(), y: r8(), r: .4 + r8() * .8, a: .25 + r8() * .6, f: r8() * 6.28, w: .6 + r8() * 2 });
      var y = 0; for (i = 0; i <= 120; i++) { y += (r8() - .5) * 3.2; y *= .93; cerro.push(y - 4 - 6 * Math.sin(i / 120 * Math.PI * 3 + 1) * (i % 40 < 20 ? 1 : .6)); }
      return { est: est, cerro: cerro, chis: chis };
    })();
    // lienzos de la parte IV: la nube en WebGL encima del fondo y, delante, chispas y destello
    var lienzoN = document.createElement('canvas'); lienzoN.className = 'fz-lienzo fz-nube'; fig.insertBefore(lienzoN, svg);
    var lienzoF = document.createElement('canvas'); lienzoF.className = 'fz-lienzo fz-frente'; fig.insertBefore(lienzoF, svg);
    var ctxF = lienzoF.getContext('2d'), NUBE = window.fzNube ? window.fzNube(lienzoN) : null, frenteSucio = false;
    // la noche: la tinta nace en el punto de luz y, al final, se retira hacia él como un iris que se cierra
    function iris(t) { var pr = suave((t - T_P4 - .4) / 3.2), q = suave((t - FIN + .3) / 3.6); return (60 + pr * 2000) * Math.pow(1 - q, 1.6); }
    function noche(t) { return t < T_P4 + .4 ? 0 : cl((iris(t) - 450) / 300, 0, 1); }
    function cielo(t, vb, fundido) {
      if (t < T_P4 + .4 || iris(t) < 1) return;
      var nn = suave((t - T_P4 - .4) / 2.4) * (1 - suave((t - FIN + .6) / 1.4)) * fundido;
      // la tinta se extiende desde el punto de luz (como una aguada) y al final se retira de forma pareja
      var tf = t - T_FL, Ro = Math.max(1, iris(t)), cx = CAM.x, cy = CAM.y, fin2 = t > FIN - .3 ? Math.pow(Math.min(1, Ro / 1300), .8) : 1;
      var tierra = 1 - suave((t - FIN + .6) / 1.4);   // suelo y estrellas se apagan mientras aún es de noche
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Ro);
      g.addColorStop(0, 'rgba(30,27,40,' + fin2 + ')'); g.addColorStop(Math.max(.01, 1 - 420 / Ro) * .5, 'rgba(18,18,28,' + fin2 + ')');
      g.addColorStop(Math.max(.02, 1 - 420 / Ro), 'rgba(12,12,19,' + fin2 + ')'); g.addColorStop(1, 'rgba(12,12,19,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(vb.x, vb.y, vb.width, vb.height);
      // estrellas finas
      var X0 = vb.x, Wv = vb.width;
      HUMO.est.forEach(function (e) {
        var x = X0 + e.x * Wv, y = vb.y + e.y * (SUELO - 40 - vb.y);
        ctx.globalAlpha = nn * e.a * (.65 + .35 * Math.sin(t * e.w + e.f)) * (tf > 0 ? cl(1 - .8 * Math.exp(-tf / 3), 0, 1) : 1);
        ctx.fillStyle = '#F4EEE3'; ctx.fillRect(x, y, e.r, e.r);
      });
      if (tf > -.2) {   // horizonte y suelo
        var al = nn * suave((tf + .2) / 1.2);
        ctx.globalAlpha = al; ctx.fillStyle = '#08080D'; ctx.beginPath(); ctx.moveTo(vb.x, vb.y + vb.height);
        HUMO.cerro.forEach(function (h, i) { ctx.lineTo(vb.x + i / 120 * vb.width, SUELO + h); }); ctx.lineTo(vb.x + vb.width, vb.y + vb.height); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(214,180,138,.32)'; ctx.lineWidth = .7; ctx.beginPath();
        HUMO.cerro.forEach(function (h, i) { var x = vb.x + i / 120 * vb.width; if (i) ctx.lineTo(x, SUELO + h); else ctx.moveTo(x, SUELO + h); }); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // fondo de la explosión (lienzo 2D de atrás): luz en el suelo, nube de Wilson, onda de choque y el resplandor de la bola
    function explosion(t, vb, fundido) {
      fundido *= 1 - suave((t - FIN + 2.7) / 2.8);   // la nube se disuelve en la noche antes de que vuelva el papel
      var m = suave((t - T_P4) / (T_FL - T_P4)), tf = t - T_FL;
      // el punto de luz: toda la cadena, vista desde lejos
      if (tf < .6) {
        var R = 18 + 50 * m, al = fundido * Math.min(1, .3 + m) * (tf > 0 ? 1 - tf / .6 : 1);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al; ctx.drawImage(LUZ, CAM.x - R, CAM.y - R, 2 * R, 2 * R);
        ctx.globalAlpha = al * .8; ctx.drawImage(LUZ, CAM.x - R * .35, CAM.y - R * .35, R * .7, R * .7);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (tf < 0) { ctx.globalAlpha = 1; return null; }
      var Fb = fundido, Z = zoomIV(tf), o = nubeIV(tf), Rs = choque(tf);
      // el horizonte se enciende: las colinas reflejan la bola de fuego
      var luzS = Fb * o.af * (o.et < 1.6 ? 1 : 1 - (o.et - 1.6) / .4 * .7);
      if (luzS > .02) {
        var gr = ctx.createLinearGradient(GX - 760, 0, GX + 760, 0);
        gr.addColorStop(0, 'rgba(255,200,130,0)'); gr.addColorStop(.5, 'rgba(255,214,160,' + (.6 * luzS) + ')'); gr.addColorStop(1, 'rgba(255,200,130,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 1.4; ctx.beginPath();
        HUMO.cerro.forEach(function (h, i) { var x = vb.x + i / 120 * vb.width; if (i) ctx.lineTo(x, SUELO + h); else ctx.moveTo(x, SUELO + h); }); ctx.stroke();
      }
      ctx.save(); ctx.translate(GX, SUELO); ctx.scale(Z, Z);   // de aquí en adelante, coordenadas del mundo: x, −h
      // luz en el suelo
      var gl2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 520);
      gl2.addColorStop(0, 'rgba(240,150,70,' + (.55 * Fb * (.2 + .8 * o.af)) + ')'); gl2.addColorStop(1, 'rgba(240,150,70,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = gl2; ctx.save(); ctx.scale(1, .22); ctx.fillRect(-520, -520, 1040, 1040); ctx.restore();
      // resplandor alrededor de la bola de fuego
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Fb * o.af * .55 * (o.et < 1.3 ? 1 : .6);
      ctx.drawImage(LUZ, -o.Rf * 2.7, -o.hb - o.Rf * 2.7, o.Rf * 5.4, o.Rf * 5.4); ctx.globalCompositeOperation = 'source-over';
      // nube de Wilson: tras el frente, la expansión enfría el aire húmedo y condensa una cúpula blanca y fugaz
      var wa = Fb * suave((tf - .7) / .45) * (1 - suave((tf - 2) / 1.4));
      if (wa > .01) {
        var Rw = Rs * .9;
        ctx.save(); ctx.beginPath(); ctx.rect(-2000, -2000, 4000, 2000); ctx.clip(); ctx.scale(1, .94);
        var gw = ctx.createRadialGradient(0, 0, Rw * .45, 0, 0, Rw);
        gw.addColorStop(0, 'rgba(236,232,226,0)'); gw.addColorStop(.7, 'rgba(236,232,226,' + (.1 * wa) + ')'); gw.addColorStop(.93, 'rgba(248,246,240,' + (.34 * wa) + ')'); gw.addColorStop(1, 'rgba(248,246,240,0)');
        ctx.fillStyle = gw; ctx.fillRect(-Rw, -Rw, 2 * Rw, Rw); ctx.restore();
      }
      // onda de choque: cúpula en el aire, eco de rarefacción y anillo en el suelo
      var as = Fb * Math.max(0, 1 - tf / 6.5);
      if (as > 0) {
        ctx.lineWidth = 1.2 / Z; ctx.strokeStyle = 'rgba(244,232,210,' + (.55 * as) + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, Rs, Rs * .92, 0, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.lineWidth = .7 / Z; ctx.strokeStyle = 'rgba(244,232,210,' + (.22 * as) + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, Rs * .9, Rs * .83, 0, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.strokeStyle = 'rgba(250,214,150,' + (.8 * as) + ')'; ctx.lineWidth = 1.6 / Z;
        ctx.beginPath(); ctx.ellipse(0, 2, Rs, Rs * .12, 0, 0, 2 * Math.PI); ctx.stroke();
      }
      ctx.restore(); ctx.globalAlpha = 1;
      o.Z = Z; o.Fb = Fb; o.tf = tf; return o;
    }
    // la nube (WebGL), solo dentro de la caja que ocupa en pantalla
    function nube(o, vb, k) {
      if (!NUBE) return nubeSinGL(o);
      var Z = o.Z, xm = Math.max(o.aCap > 0 ? o.Rt + o.rt * 1.6 : 0, o.rM * 1.4, o.Rf * 2, o.rS * 4) + 20;
      var hm = Math.max(o.aCap > 0 ? o.Hc + o.rt * 1.9 : 0, o.hb + o.Rf * 1.9, o.hB * 1.7) + 20, hn = -o.hB * .4 - 8;
      var x0 = (GX - xm * Z - vb.x) * k, x1 = (GX + xm * Z - vb.x) * k, y0 = (SUELO - hm * Z - vb.y) * k, y1 = (SUELO - hn * Z - vb.y) * k;
      NUBE.pinta({ vb: vb, ox: GX, oy: SUELO, z: Z, t: o.tf,
        cap: [o.Rt, o.rt, o.Hc, o.aCap], tallo: [o.rS, o.hTop, o.aS, 0], base: [o.rM, o.hB, o.aB, 0],
        fuego: [o.Rf, o.hb, o.af, o.et], misc: [o.cal, o.bajo, o.Fb, o.giro] }, [x0, y0, x1 - x0, y1 - y0]);
    }
    // sin WebGL: manchas suaves en el lienzo de adelante
    function nubeSinGL(o) {
      function mancha(x, h, rx, ry, c, a) { if (a <= .01) return; ctxF.save(); ctxF.translate(GX + x * o.Z, SUELO - h * o.Z); ctxF.scale(rx * o.Z, ry * o.Z); var g = ctxF.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(' + c + ',' + a + ')'); g.addColorStop(.75, 'rgba(' + c + ',' + a * .8 + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctxF.fillStyle = g; ctxF.fillRect(-1, -1, 2, 2); ctxF.restore(); }
      mancha(0, o.hb, o.Rf, o.Rf, '255,206,90', o.af * o.Fb);
      mancha(0, o.hTop / 2, o.rS * 1.5, o.hTop / 2, '82,62,56', o.aS * o.Fb * .9);
      mancha(0, o.Hc, o.Rt + o.rt, o.rt * 1.2, '96,70,60', o.aCap * o.Fb * .95);
      mancha(0, 0, o.rM, o.hB, '74,58,52', o.aB * o.Fb * .85);
    }
    // adelante: chispas, destello y la línea de luz del horizonte
    function frente(o, vb) {
      var tf = o.tf, Fb = o.Fb, Z = o.Z;
      ctxF.globalCompositeOperation = 'lighter'; ctxF.fillStyle = '#FFD9A0';
      HUMO.chis.forEach(function (c) {
        var u = tf - .25 - c.z * .6; if (u <= 0 || u > c.vida) return;
        var d = o.Rf * .9 + 150 * c.v * (1 - Math.exp(-u / 1.2)), P = aSVG(Math.cos(c.a) * d, o.hb - Math.sin(c.a) * d * .8 + 26 * u, Z);
        ctxF.globalAlpha = Fb * .9 * (1 - u / c.vida); ctxF.fillRect(P[0], P[1], 1.6, 1.6);
      });
      var fl = tf < .06 ? tf / .06 : Math.exp(-(tf - .06) / .7);
      if (fl > .01) {
        var yb0 = SUELO - 62, Rb = 260 + 1400 * (1 - Math.exp(-tf / .5)), gf = ctxF.createRadialGradient(GX, yb0, 0, GX, yb0, Rb);
        gf.addColorStop(0, 'rgba(255,252,244,' + fl + ')'); gf.addColorStop(.18, 'rgba(255,236,190,' + (.9 * fl) + ')'); gf.addColorStop(.5, 'rgba(244,170,90,' + (.35 * fl) + ')'); gf.addColorStop(1, 'rgba(200,100,50,0)');
        ctxF.globalAlpha = Fb; ctxF.fillStyle = gf; ctxF.fillRect(vb.x, vb.y, vb.width, vb.height);
        var gh = ctxF.createLinearGradient(vb.x, 0, vb.x + vb.width, 0), hx = (GX - vb.x) / vb.width;
        gh.addColorStop(0, 'rgba(255,220,160,0)'); gh.addColorStop(cl(hx, .05, .95), 'rgba(255,244,220,' + (.8 * fl) + ')'); gh.addColorStop(1, 'rgba(255,220,160,0)');
        ctxF.fillStyle = gh; ctxF.fillRect(vb.x, yb0 - 2.5 - 6 * fl, vb.width, 5 + 12 * fl);
      }
      ctxF.globalCompositeOperation = 'source-over'; ctxF.globalAlpha = 1;
    }
    // sacudida: cuando la onda llega al observador todo tiembla, fuerte y breve, y queda un retumbo
    var escenas = fig.parentNode, menu = raiz && raiz.querySelector('.mc-menu'), sacOn = false;
    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // destello: un instante en que toda la pantalla, menú incluido, se pone en blanco
    var blanco = document.createElement('div'), blancoA = -1;
    blanco.className = 'fz-blanco'; blanco.setAttribute('aria-hidden', 'true'); document.body.appendChild(blanco);
    function destello(t) {
      var u = t - T_FL, a = 0;
      if (u > -.02 && u < .9) a = u < .05 ? cl((u + .02) / .07, 0, 1) : u < .14 ? 1 : 1 - suave((u - .14) / .7);
      if (reducido) a *= .45;
      a = Math.round(a * 100) / 100; if (a === blancoA) return; blancoA = a;
      blanco.style.opacity = a; blanco.style.visibility = a > 0 ? 'visible' : 'hidden';
    }
    function sacudida(t) {
      destello(t);
      var u = t - T_FL - T_ONDA, A = 0;
      if (!reducido && u > 0 && u < 6) A = (1 - Math.exp(-u / .04)) * (11 * Math.exp(-u / .7) + 2.2 * Math.exp(-u / 2.6)) * (1 - suave((u - 4.5) / 1.5));
      if (A < .05) { if (sacOn) { sacOn = false; escenas.style.transform = ''; if (menu) menu.style.transform = ''; } return; }
      sacOn = true;
      var x = A * (.6 * Math.sin(u * 61) + .4 * Math.sin(u * 37 + 1.3)), y = A * (.55 * Math.sin(u * 53 + .7) + .45 * Math.sin(u * 29 + 2.1)), r = A * .012 * Math.sin(u * 23);
      escenas.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) rotate(' + r.toFixed(3) + 'deg) scale(' + (1 + A * .0022).toFixed(4) + ')';
      if (menu) menu.style.transform = 'translate(' + (x * .35).toFixed(2) + 'px,' + (y * .35).toFixed(2) + 'px)';
    }
    // escalera de órdenes de magnitud (SVG): de 10⁻¹⁴ m a 10³ m
    var ESC = [[-14, 'núcleo'], [-10, 'átomo'], [-7, 'virus'], [-5, 'célula'], [-2, 'centímetro'], [0, 'persona'], [3, 'kilómetro']];
    var gEsc = el('g', { 'class': 'fz-esc' }, capa), yEsc = function (e) { return 690 - (e + 14) / 17 * 520; };
    el('line', { 'class': 'fz-esc-l', x1: 1390, y1: f(yEsc(-14)), x2: 1390, y2: f(yEsc(3)) }, gEsc);
    ESC.forEach(function (q) {
      var y = yEsc(q[0]), g2 = el('g', { 'class': 'fz-esc-p' }, gEsc);
      el('line', { x1: 1384, y1: f(y), x2: 1396, y2: f(y) }, g2);
      var t1 = el('text', { 'class': 'fz-esc-n', x: 1376, y: f(y + 4), 'text-anchor': 'end' }, g2);
      t1.textContent = '10' + String(q[0]).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }) + ' m';
      var t2 = el('text', { 'class': 'fz-esc-t', x: 1376, y: f(y + 17), 'text-anchor': 'end' }, g2); t2.textContent = q[1];
      q.g = g2; q.y = y;
    });
    var marca = el('circle', { 'class': 'fz-esc-m', cx: 1390, r: 3.4 }, gEsc), escOn = false;
    function exponente(t) { var x = suave((t - T_P4 - .3) / (T_FL - T_P4 + .2)); return -14 + 17 * x; }
    function escalera(t) {
      var on = t > T_P4 + .2 && t < T_FL + 1;
      if (on !== escOn) { escOn = on; gEsc.classList.toggle('ver', on); }
      if (!on) return;
      var e = exponente(t); marca.setAttribute('cy', f(yEsc(e)));
      ESC.forEach(function (q) { var a = e >= q[0] - .3; if (a !== q.a) { q.a = a; q.g.classList.toggle('on', a); } });
    }
    var nocheOn = false;

    function dibuja(t) {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = Math.round(w * d); lienzo.height = Math.round(h * d); }
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      CAM.s = escala(t);
      var mv = suave((t - T_P4) / (T_FL - T_P4)); CAM.x = 1010 + (GX - 1010) * mv; CAM.y = 440 + (SUELO - 70 - 440) * mv;
      var fundido = t < .4 ? t / .4 : t > FIN ? 1 - suave((t - FIN) / (DUR - FIN - .3)) : 1;
      ctx.globalAlpha = fundido;
      var ex = excit(t), a = estira(t), C = aPantalla([0, 0, 0]), Rp = RU * CAM.s, tau = t - T_SC;
      posiciones(t);
      if (t > T_P4) cielo(t, vb, fundido);

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
      if (t > T_P2 - .5 && t < T_P3) parteII(t, tau, vb);
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
        if (tau < n.emite.t || t > n.golpe) return;
        var P = aPantalla([n.x, n.y]), F = fr[n.fr], te = n.emite.t, c0 = centroFr(F, te), P0 = aPantalla(c0), s = cl((tau - te) / .4, 0, 1);
        var lx = P[0] - P0[0], ly = P[1] - P0[1], ll = Math.hypot(lx, ly) || 1, lc = Math.min(ll, 230); P0 = [P[0] - lx / ll * lc, P[1] - ly / ll * lc];
        var gt2 = ctx.createLinearGradient(P0[0], P0[1], P[0], P[1]); gt2.addColorStop(0, 'rgba(30,26,22,0)'); gt2.addColorStop(1, 'rgba(30,26,22,.42)');
        ctx.strokeStyle = gt2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
        brillo(P[0], P[1], rN * CAM.s * .5, rN * CAM.s * 2.8 + 4, '226,170,90', .5 * s);
      });
      if (t > T_P3 - 3 && t < T_FL + .4) cadena(t, vb, fundido);
      var oIV = t > T_P4 ? explosion(t, vb, fundido) : null;
      // lienzos de la parte IV (nube y frente) con la misma resolución y encuadre
      var dn = Math.min(1.5, d) * .75, wn = Math.round(w * dn), hn = Math.round(h * dn);
      if (lienzoN.width !== wn || lienzoN.height !== hn) { lienzoN.width = wn; lienzoN.height = hn; }
      if (lienzoF.width !== lienzo.width || lienzoF.height !== lienzo.height) { lienzoF.width = lienzo.width; lienzoF.height = lienzo.height; }
      if (oIV) {
        ctxF.setTransform(1, 0, 0, 1, 0, 0); ctxF.clearRect(0, 0, lienzoF.width, lienzoF.height); ctxF.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
        nube(oIV, vb, wn / vb.width); frente(oIV, vb); frenteSucio = true;
      } else if (frenteSucio) { ctxF.setTransform(1, 0, 0, 1, 0, 0); ctxF.clearRect(0, 0, lienzoF.width, lienzoF.height); if (NUBE) NUBE.limpia(); frenteSucio = false; }
      // nucleones, de atrás hacia adelante
      var ord = nuc.slice().sort(function (p, q) { return p.z - q.z; });
      for (var j = 0; j < ord.length; j++) {
        var m = ord[j]; if (!m.vis) continue;
        var pz = 1 + m.z * .012, r = rN * CAM.s * pz, P = aPantalla([m.x, m.y]);
        if (m.vis <= 0 || P[0] < vb.x - r || P[0] > vb.x + vb.width + r || P[1] < vb.y - r || P[1] > vb.y + vb.height + r) continue;
        ctx.globalAlpha = fundido * m.vis * (.78 + .22 * cl(.5 + m.z / (2 * RU), 0, 1));
        ctx.drawImage(m.p ? SPR.p : SPR.n, P[0] - r, P[1] - r, 2 * r, 2 * r);
      }
      ctx.globalAlpha = fundido;
      // rayos γ: paquetes de onda dorados que salen a la velocidad de la luz
      if (tau > 0 && tau < 5) fotones.forEach(function (g) {
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
      escalera(t);
      var tf = t - T_FL;
      if (tf > 0) {
        var Zn = zoomIV(tf), on = nubeIV(tf), Pn;
        Pn = aSVG(on.Rf * .5, on.hb + on.Rf * .62, Zn); nB.ubica(Pn[0], Pn[1]);
        Pn = aSVG(choque(tf) * .7, choque(tf) * .66, Zn); nT.ubica(Math.min(Pn[0], 1170), Math.max(Pn[1], 330));
        Pn = aSVG(on.Rt + on.rt * .5, on.Hc + on.rt * .35, Zn); nH.ubica(Pn[0], Pn[1]);
        Pn = aSVG(on.rS + 4, on.Hc * .32, Zn); nO.ubica(Pn[0], Pn[1]);
      }
      if (t > T_P3) {
        var e0 = CAD.ev[0], P3 = aPantalla(e0.p); nK.ubica(P3[0], P3[1]);
        var e1 = CAD.ev[Math.min(CAD.ev.length - 1, 40)], P4 = aPantalla(e1.p); nX.ubica(P4[0], P4[1]);
        var e2 = CAD.ev[Math.min(CAD.ev.length - 1, fisiones(T_III2 + 2.2) - 1)], P5 = aPantalla(e2.p); nW.ubica(P5[0], P5[1]);
        nV.ubica(GR.x + 20, GR.y + GR.h * .55);
      }
    }

    function eV(x) { var u = ['eV', 'keV', 'MeV', 'GeV', 'TeV', 'PeV', 'EeV'], k = 0; while (x >= 1000 && k < u.length - 1) { x /= 1000; k++; } return coma(x, x < 10 ? 1 : 0) + ' ' + u[k]; }
    function cientifica(x) { var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return coma(m, 1) + ' × 10' + String(e).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }); }
    function coma(x, d) { return x.toFixed(d).replace('.', ',').replace('-', '−'); }
    function lecturas(t) {
      var tau = t - T_SC;
      if (t < T_N0) salida('U-235 · R ≈ 7,4 fm', 'esperando un neutrón');
      else if (t < T_CAP) { var c = nuc[hueco]; salida('neutrón · E = 0,025 eV', 'a ' + coma(Math.max(0, Math.hypot(c.x, c.y, c.z) - RU), 1) + ' fm de la superficie'); }
      else if (t < T_P2) { var a = estira(t); salida('U-236* · E* ≈ 6,5 MeV', 'deformación β₂ ≈ ' + coma((Math.pow(a, 1.5) - 1) / .946, 2)); }
      else if (t < T_SC) {
        var sH = 0, sL = 0; fr.H.m.forEach(function (n) { sH += n.x * EJE[0] + n.y * EJE[1]; }); fr.L.m.forEach(function (n) { sL += n.x * EJE[0] + n.y * EJE[1]; });
        var sg = sgDe(t), xd = .14 + (X_SC - .14) * sg;
        if (xd < .5) salida('U-236* · sube hacia el punto de silla', 'E* − V ≈ ' + coma(Math.max(.3, 6.5 - Vdef(xd)), 1) + ' MeV');
        else salida('U-236* · el cuello se adelgaza', 'distancia entre centros ≈ ' + coma(sL / fr.L.m.length - sH / fr.H.m.length, 1) + ' fm');
      } else if (t >= T_FL) {
        var tf = t - T_FL;
        salida(tf < 9 ? 'onda de choque · R ∝ t^(2/5)' : 'nube: anillo de vórtice que sube', tf < 9 ? 'R(2t)/R(t) = 2^(2/5) ≈ 1,32' : 'de 10 fm a la escala del paisaje');
      } else if (t >= T_P4 + .3) {
        var ee = exponente(t);
        salida('alejándose · ' + coma(ee + 14, 0) + ' órdenes de magnitud', 'tamaño de la vista ≈ 10^' + coma(ee, 0) + ' m');
      } else if (t >= T_P3 + .6) {
        var nf = fisiones(t);
        if (t < T_III2) salida('generación ' + generacion(t) + ' · neutrones en vuelo: ' + (CAD.vuelo || 0), 'fisiones: ' + nf + ' · energía ≈ ' + eV(nf * 200e6));
        else salida('generación ' + generacion(t) + ' · k ≈ 1,8', 'fisiones: ' + nf + ' · energía ≈ ' + eV(nf * 200e6));
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
        if (c.s) {   // subtítulo de la sub-etapa: se apaga, cambia y vuelve a entrar
          var sub = ''; if (on) c[3].forEach(function (e, j) { if (t >= e[0]) sub = c[0] + '·' + (j + 1) + ' ' + e[1]; });
          if (sub !== c.sub) { c.sub = sub; c.s.classList.remove('ver'); clearTimeout(c.st); if (sub) c.st = setTimeout(function () { c.s.textContent = sub; c.s.classList.add('ver'); }, c.s.textContent ? 260 : 0); }
        }
      });
    }
    function ecuacion(t) {
      var e = t < T_SC ? 'n + <sup>235</sup>U → <sup>236</sup>U<sup>*</sup>' : t < T_P3 + .6 ? 'n + <sup>235</sup>U → <sup>141</sup>Ba + <sup>92</sup>Kr + 3n' : t < T_P4 + .3 ? 'N<sub>g</sub> ≈ k<sup>g</sup>, &nbsp;k > 1' : t < T_FL + 2 ? 'E = Δm c<sup>2</sup>' : 'R(t) ≈ (E t<sup>2</sup>/ρ)<sup>1/5</sup>';
      if (ec && e !== ecAct) { ecAct = e; ec.innerHTML = e; }
    }

    if (quieto) { T = 14; }
    return {
      tick: function (dt) {
        if (!fig.classList.contains('on')) return;
        if (!quieto && !fijo) { T += dt; if (T >= DUR) reinicia(); }
        AGENDA.forEach(function (a) { a[0].pon(T >= a[1] && T < a[2]); });
        dibuja(T); lecturas(T); capitulos(T); ecuacion(T); sacudida(T);
        var nO2 = noche(T) > .5; if (nO2 !== nocheOn) { nocheOn = nO2; if (raiz) raiz.classList.toggle('fz-noche', nO2); }
      }
    };
  };
})();
