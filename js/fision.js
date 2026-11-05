// III · Problemas de física — fisión del uranio-235, en cuatro capítulos.
//  I   Captura: un neutrón térmico entra en ²³⁵U; el núcleo compuesto ²³⁶U* queda excitado
//      (E* ≈ 6,5 MeV > barrera ≈ 6,2 MeV, valores de Krane) y oscila como una gota líquida.
//  II  Fisión: n + ²³⁵U → ¹⁴¹Ba + ⁹²Kr + 3n (Q ≈ 174 MeV con las masas atómicas).
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
    var A0 = 235, RU = 1.2 * Math.cbrt(236), pk = empaca(236, RU, 11), rN = pk.r * .98;
    var CAM = { x: 1010, y: 440, s: 19 };
    var T_CAP = 9.2, ROT = .16, TILT = .38;
    function angulo(t) { return t < T_CAP ? ROT * t : ROT * T_CAP + ROT * 1.6 * (1 - Math.exp(-(t - T_CAP) / 1.6)); }
    function gira(q, a) {
      var c = Math.cos(a), s = Math.sin(a), x = q[0] * c + q[2] * s, z = -q[0] * s + q[2] * c, y = q[1];
      var ct = Math.cos(TILT), st = Math.sin(TILT);
      return [x, y * ct - z * st, y * st + z * ct];
    }
    // el neutrón llega desde arriba a la izquierda y ocupa el lugar de la superficie que mira hacia él
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
      nuc.push({ b: q, p: !!esProton[i], cap: i === hueco, ini: [w * Math.cos(a) * lej, w * Math.sin(a) * lej * .7, u * lej], ret: rnd() * .7,
        f: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], w: [2.1 + rnd() * 1.6, 2.1 + rnd() * 1.6, 2.1 + rnd() * 1.6], x: 0, y: 0, z: 0 });
    });

    // ── notas: punto, guía que se dibuja, regla, rótulo, título y texto ──
    var notas = [];
    function nota(o) {
      var g = el('g', { 'class': 'fz-nota' }, capa), lado = o.lado || 1, ancho = o.ancho || 236;
      var gp = el('g', { 'class': 'fz-ancla' }, g); el('circle', { 'class': 'fz-pt', r: 2.3 }, gp); el('circle', { 'class': 'fz-aro', r: 2.3 }, gp);
      var guia = el('path', { 'class': 'fz-guia', pathLength: 1 }, g);
      // con pie: la regla queda debajo del bloque y la guía llega por abajo (para notas encima del núcleo)
      var tx = o.tx, ty = o.ty, x0 = lado > 0 ? tx : tx - ancho, anc = 'start', alto = 48 + (o.d.length - 1) * 17.5 + (o.ley ? 26 : 0);
      var y0 = o.pie ? ty - alto - 18 : ty;
      var regla = el('line', { 'class': 'fz-regla', x1: f(x0), y1: f(ty), x2: f(x0 + ancho), y2: f(ty), pathLength: 1 }, g);
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
    var nU = nota({ k: 'Uranio-235', tit: '²³⁵U · 92 p + 143 n', tx: 1000, ty: 282, ancho: 230, lado: -1, pie: true,
      d: ['235 nucleones en una esfera de', 'R = r₀ A¹ᐟ³ ≈ 7,4 fm (r₀ ≈ 1,2 fm).', 'No están quietos: se mueven dentro', 'como un gas de Fermi.'], ley: leyenda });
    var nN = nota({ k: 'Neutrón térmico', tit: 'E ≈ 0,025 eV · v ≈ 2,2 km/s', tx: 1192, ty: 528, ancho: 236,
      d: ['Sin carga, la repulsión de Coulomb no', 'lo frena. Su longitud de onda, λ ≈ 0,18 nm,', 'es ~10⁴ veces el núcleo: por eso la', 'sección eficaz de fisión es grande,', 'σ_f ≈ 585 barn.'] });
    var nC = nota({ k: 'Núcleo compuesto', tit: '²³⁶U*: E* ≈ 6,5 MeV', tx: 1192, ty: 528, ancho: 236,
      d: ['La energía de enlace del neutrón', 'queda como excitación, más que la', 'barrera de fisión (≈ 6,2 MeV). Con 144', 'neutrones (par) el apareamiento suma', 'energía: por eso ²³⁵U fisiona con', 'neutrones lentos y ²³⁸U no.'] });
    var nG = nota({ k: 'Modelo de la gota líquida', tit: 'Superficie contra Coulomb', tx: 1016, ty: 600, ancho: 246, lado: -1,
      d: ['La fuerza fuerte, de corto alcance,', 'actúa como tensión superficial y lo', 'quiere esférico; la repulsión de 92', 'protones lo estira (Z²/A ≈ 35,9).', 'Excitado, el núcleo oscila y se alarga.'] });
    var AGENDA = [[nU, 1.4, 8.6], [nN, 4.2, 9.6], [nC, 9.6, 18], [nG, 12.2, 18]];

    // ── capítulos ──
    var CAPS = [['I', 'Captura', 0], ['II', 'Fisión', null], ['III', 'Cadena', null], ['IV', 'Escala', null]], DUR = 19.5, FIN_I = 18;
    var barra = document.createElement('nav'); barra.className = 'fz-caps'; barra.setAttribute('aria-label', 'Capítulos de la animación');
    CAPS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fz-cap' + (c[2] == null ? ' fz-pronto' : '');
      b.innerHTML = '<span class="fz-cap-n">' + c[0] + '</span><span class="fz-cap-t">' + c[1] + '</span><i class="fz-cap-l"><i></i></i>';
      if (c[2] != null) b.addEventListener('click', function () { T = c[2]; }); else b.disabled = true;
      c.b = b; c.l = b.querySelector('.fz-cap-l i'); barra.appendChild(b);
    });
    fig.appendChild(barra);

    var T = 0, W = 0, H = 0, dpr = 1;
    function reinicia() { T = 0; notas.forEach(function (n) { n.pon(false); }); }
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (on && !fig.fzOn) reinicia(); fig.fzOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });

    function aPantalla(q) { return [CAM.x + q[0] * CAM.s, CAM.y + q[1] * CAM.s]; }
    function excit(t) { return t < T_CAP ? 0 : suave((t - T_CAP) / 1.2); }
    function estira(t) {   // alargamiento a (eje mayor / radio) del núcleo excitado
      if (t < T_CAP) return 1;
      var u = t - T_CAP, amp = .03 + .1 * suave(u / 6), med = .2 * suave((u - 4) / 5);
      return 1 + med + amp * Math.sin(2 * Math.PI * u / 1.7) * (1 - .5 * suave((u - 6) / 3));
    }
    var EJE = [Math.cos(-.17), Math.sin(-.17), 0];

    function dibuja(t) {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = Math.round(w * d); lienzo.height = Math.round(h * d); }
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      var fundido = t < .4 ? t / .4 : t > FIN_I ? 1 - suave((t - FIN_I) / (DUR - FIN_I - .3)) : 1;
      ctx.globalAlpha = fundido;
      var ex = excit(t), a = estira(t), ang = angulo(t), C = aPantalla([0, 0, 0]), Rp = RU * CAM.s;

      // sombra y calor del núcleo excitado
      ctx.save(); ctx.translate(C[0], C[1] + Rp * 1.55); ctx.scale(1, .2);
      var gs = ctx.createRadialGradient(0, 0, 0, 0, 0, Rp * 1.25); gs.addColorStop(0, 'rgba(30,26,22,.16)'); gs.addColorStop(1, 'rgba(30,26,22,0)');
      ctx.fillStyle = gs; ctx.fillRect(-Rp * 1.3, -Rp * 1.3, Rp * 2.6, Rp * 2.6); ctx.restore();
      if (ex > 0) {
        var gc = ctx.createRadialGradient(C[0], C[1], Rp * .4, C[0], C[1], Rp * 2.3);
        gc.addColorStop(0, 'rgba(232,150,70,' + (.22 * ex) + ')'); gc.addColorStop(.5, 'rgba(232,170,90,' + (.08 * ex) + ')'); gc.addColorStop(1, 'rgba(232,170,90,0)');
        ctx.fillStyle = gc; ctx.fillRect(C[0] - Rp * 2.4, C[1] - Rp * 2.4, Rp * 4.8, Rp * 4.8);
      }

      // posiciones: armado inicial, giro, deformación (volumen constante) y agitación de Fermi
      var amp = .12 + .22 * ex, ia = 1 / Math.sqrt(a);
      for (var i = 0; i < nuc.length; i++) {
        var n = nuc[i], q = gira(n.b, ang);
        var par = q[0] * EJE[0] + q[1] * EJE[1];
        q = [EJE[0] * par * a + (q[0] - EJE[0] * par) * ia, EJE[1] * par * a + (q[1] - EJE[1] * par) * ia, q[2] * ia];
        q[0] += amp * Math.sin(n.w[0] * t + n.f[0]); q[1] += amp * Math.sin(n.w[1] * t + n.f[1]); q[2] += amp * Math.sin(n.w[2] * t + n.f[2]);
        if (n.cap) {
          if (t < T_N0) { n.vis = 0; }
          else if (t < T_CAP) {   // vuelo recto a velocidad constante
            var u = (t - T_N0) / (T_CAP - T_N0); n.vis = 1;
            q = [N_INI[0] + (q[0] - N_INI[0]) * u, N_INI[1] + (q[1] - N_INI[1]) * u, N_INI[2] + (q[2] - N_INI[2]) * u];
          } else n.vis = 1;
        } else {
          var e = salidaExp((t - n.ret) / 1.1); n.vis = cl((t - n.ret) * 3, 0, 1);
          if (e < 1) q = [n.ini[0] + (q[0] - n.ini[0]) * e, n.ini[1] + (q[1] - n.ini[1]) * e, n.ini[2] + (q[2] - n.ini[2]) * e];
        }
        n.x = q[0]; n.y = q[1]; n.z = q[2];
      }
      // estela del neutrón que llega
      var cap = nuc[hueco];
      if (t > T_N0 && t < T_CAP + .8) {
        var p1 = aPantalla([cap.x, cap.y]), p0 = aPantalla(N_INI), largo = Math.min(1, (t - T_N0) / 1.2), dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
        var cola = Math.min(L, 150 * largo), sx = p1[0] - dx / L * cola, sy = p1[1] - dy / L * cola;
        var gt = ctx.createLinearGradient(sx, sy, p1[0], p1[1]); gt.addColorStop(0, 'rgba(30,26,22,0)'); gt.addColorStop(1, 'rgba(30,26,22,' + (.5 * (t < T_CAP ? 1 : 1 - (t - T_CAP) / .8)) + ')');
        ctx.strokeStyle = gt; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
      // halo dorado del neutrón en vuelo
      if (t > T_N0 && t < T_CAP + .6) {
        var ph = aPantalla([cap.x, cap.y]), al = (t < T_CAP ? cl((t - T_N0) / .6, 0, 1) : 1 - (t - T_CAP) / .6) * .5, rh = rN * CAM.s * 2.6;
        var gh = ctx.createRadialGradient(ph[0], ph[1], rN * CAM.s * .6, ph[0], ph[1], rh);
        gh.addColorStop(0, 'rgba(226,170,90,' + al + ')'); gh.addColorStop(1, 'rgba(226,170,90,0)');
        ctx.fillStyle = gh; ctx.fillRect(ph[0] - rh, ph[1] - rh, 2 * rh, 2 * rh);
      }
      // nucleones, de atrás hacia adelante
      var ord = nuc.slice().sort(function (p, q) { return p.z - q.z; });
      for (var j = 0; j < ord.length; j++) {
        var m = ord[j]; if (!m.vis) continue;
        var pz = 1 + m.z * .012, r = rN * CAM.s * pz, P = aPantalla([m.x, m.y]);
        ctx.globalAlpha = fundido * m.vis * (.78 + .22 * cl(.5 + m.z / (2 * RU), 0, 1));
        ctx.drawImage(m.p ? SPR.p : SPR.n, P[0] - r, P[1] - r, 2 * r, 2 * r);
      }
      ctx.globalAlpha = fundido;
      // la gota: contorno de tinta discontinuo que sigue la forma
      if (ex > 0) {
        ctx.save(); ctx.translate(C[0], C[1]); ctx.rotate(Math.atan2(EJE[1], EJE[0]));
        ctx.setLineDash([3, 5]); ctx.lineWidth = .8; ctx.strokeStyle = 'rgba(30,26,22,' + (.42 * ex) + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, (RU + .9) * CAM.s * a, (RU + .9) * CAM.s * ia, 0, 0, 2 * Math.PI); ctx.stroke(); ctx.restore();
        // pulso de la captura
        var up = (t - T_CAP) / 1.4;
        if (up < 1) {
          var P2 = aPantalla([cap.x, cap.y]);
          ctx.setLineDash([]); ctx.strokeStyle = 'rgba(200,120,50,' + (.7 * (1 - up)) + ')'; ctx.lineWidth = 1.4 * (1 - up) + .3;
          ctx.beginPath(); ctx.arc(P2[0], P2[1], 6 + up * Rp * 1.6, 0, 2 * Math.PI); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      // notas que siguen al núcleo
      nU.ubica(C[0] - Rp * .45, C[1] - Rp * .62);
      var Pn = aPantalla([cap.x, cap.y]); nN.ubica(Pn[0] - 4, Pn[1] + rN * CAM.s + 6);
      nC.ubica(C[0] + Rp * .78 * a, C[1] + Rp * .45);
      nG.ubica(C[0] - Rp * .9 * a, C[1] + Rp * .2);
    }

    function lecturas(t) {
      if (t < T_N0) salida('U-235 · R ≈ 7,4 fm', 'esperando un neutrón');
      else if (t < T_CAP) {
        var c = nuc[hueco], dd = Math.hypot(c.x, c.y, c.z) - RU;
        salida('neutrón · E = 0,025 eV', 'a ' + Math.max(0, dd).toFixed(1).replace('.', ',') + ' fm de la superficie');
      } else {
        var a = estira(t), b2 = (Math.pow(a, 1.5) - 1) / .946;
        salida('U-236* · E* ≈ 6,5 MeV', 'deformación β₂ ≈ ' + b2.toFixed(2).replace('.', ',').replace('-', '−'));
      }
    }

    function capitulos(t) {
      CAPS.forEach(function (c, k) {
        var ini = c[2], fin = k + 1 < CAPS.length && CAPS[k + 1][2] != null ? CAPS[k + 1][2] : FIN_I;
        var on = ini != null && t >= ini && t < (k + 1 < CAPS.length && CAPS[k + 1][2] != null ? CAPS[k + 1][2] : DUR);
        if (on !== c.on) { c.on = on; c.b.classList.toggle('on', on); }
        if (ini != null) c.l.style.transform = 'scaleX(' + cl((t - ini) / (fin - ini), 0, 1).toFixed(3) + ')';
      });
    }

    if (ec) ec.innerHTML = 'n + <sup>235</sup>U → <sup>236</sup>U<sup>*</sup>';
    if (quieto) { T = 14; }
    return {
      tick: function (dt) {
        if (!fig.classList.contains('on')) return;
        if (!quieto) { T += dt; if (T >= DUR) reinicia(); }
        AGENDA.forEach(function (a) { a[0].pon(T >= a[1] && T < a[2]); });
        dibuja(T); lecturas(T); capitulos(T);
      }
    };
  };
})();
