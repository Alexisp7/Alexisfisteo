// III · Problemas de física — momento angular, en cuatro capítulos.
//  I   Definición: L = r × p respecto de un punto O. Una partícula libre barre áreas iguales en tiempos
//      iguales: |L| = m v b no cambia porque b (distancia de O a la recta) es fija.
//  II  Órbita: con fuerza central τ = r × F = 0. Órbita de Kepler (e = 0,6) resuelta con la ecuación
//      de Kepler; sectores de igual duración = igual área (segunda ley). Al final la vista se inclina
//      y L aparece como un vector perpendicular al plano de la órbita.
//  III Sólido: L = I ω con I = 0,40 + 2·(1 kg)·r². Las masas pasan de 0,8 m a 0,2 m: ω de 2 a 7 rad/s,
//      la energía L²/2I de 3,4 a 11,8 J (trabajo de los brazos).
//  IV  Giróscopo: τ = dL/dt. Rotor de 150 g, R = 3 cm, d = 4 cm, 40 vueltas/s ⟹ Ω = mgd/(Iω) ≈ 3,5 rad/s.
// Todo se pinta en un lienzo 2D; el SVG encima solo lleva las notas (mismas clases que la fisión).
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function f(v) { return Math.round(v * 10) / 10; }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function suave(x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); }
  function ventana(t, a, b, e) { e = e || .7; return suave((t - a) / e) * (1 - suave((t - b + e) / e)); }
  function coma(x, d) { return x.toFixed(d).replace('.', ',').replace('-', '−'); }

  function esfera(c0, c1, c2, borde) {
    var S = 96, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), g = x.createRadialGradient(S * .36, S * .32, S * .04, S * .5, S * .5, S * .5);
    g.addColorStop(0, c0); g.addColorStop(.55, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, 2 * Math.PI); x.fill();
    x.lineWidth = 2.2; x.strokeStyle = borde; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(S * .37, S * .31, S * .11, S * .07, -.6, 0, 2 * Math.PI); x.fill();
    return c;
  }

  window.cmMomentoKepler = function (svg, salida) {
    var fig = svg.parentNode, raiz = fig.closest('.mc');
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lienzo = document.createElement('canvas'); lienzo.className = 'mo-lienzo'; fig.insertBefore(lienzo, svg);
    var ctx = lienzo.getContext('2d');
    var capa = el('g', { 'class': 'fz-notas' }, svg);
    var ec = raiz && raiz.querySelector('.mc-ec[data-ec="2"]');
    var SPR = {
      crema: esfera('#FFFDF8', '#EDE3CF', '#B3A285', 'rgba(30,26,22,.55)'),
      laton: esfera('#F6E7C4', '#C79A52', '#6B4718', 'rgba(60,38,12,.65)'),
      sol: esfera('#FFF8E4', '#F2C670', '#B9762A', 'rgba(120,70,20,.45)'),
      acero: esfera('#F2F0EC', '#A9A39A', '#4E4A44', 'rgba(30,26,22,.6)')
    };
    var TINTA = 'rgba(30,26,22,', VINO = 'rgba(122,46,34,', ORO = 'rgba(176,122,40,', PAPEL = '#F4EEE3';

    // ── tiempos ──
    var T2 = 16, T3 = 34, T4 = 51, FIN = 69, DUR = 71;
    var TILT0 = T2 + 11.5, TILT1 = T2 + 15;

    // ── cámara ortográfica: z hacia arriba; el = elevación de la vista (90° = desde arriba, plano de la página) ──
    var OX = 1090, OY = 300, cam = { x: OX, y: OY, s: 1, el: Math.PI / 2 };
    function P(x, y, z) { var se = Math.sin(cam.el), ce = Math.cos(cam.el); return [cam.x + cam.s * x, cam.y - cam.s * (y * se + z * ce), z * se - y * ce]; }

    var T = 0, W = 0, H = 0, dpr = 1, ecAct = '', fijo = false;

    // ── utilidades de dibujo ──
    function txt(str, x, y, o) {   // texto nítido (el lienzo se estira con el viewBox)
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr, k = Math.min(kx, ky);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = (o.it ? 'italic 500 ' : o.peso ? o.peso + ' ' : '400 ') + (o.px * k).toFixed(1) + 'px ' + (o.mono ? "'Space Mono',monospace" : "'Cormorant Garamond',serif");
      if ('letterSpacing' in ctx) ctx.letterSpacing = o.mono ? (o.px * .16 * k).toFixed(1) + 'px' : '0px';
      ctx.textAlign = o.al || 'left'; ctx.fillStyle = o.c; ctx.globalAlpha *= o.a == null ? 1 : o.a;
      if (o.halo) { ctx.lineWidth = 4 * k; ctx.strokeStyle = PAPEL; ctx.lineJoin = 'round'; ctx.strokeText(str, (x - vb.x) * kx, (y - vb.y) * ky); }
      ctx.fillText(str, (x - vb.x) * kx, (y - vb.y) * ky); ctx.restore();
    }
    function flecha(x0, y0, x1, y1, col, a, w, hb) {
      var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 2) return;
      var ux = dx / L, uy = dy / L; hb = Math.min(hb || 8, L * .45);
      ctx.strokeStyle = col + a + ')'; ctx.fillStyle = col + a + ')'; ctx.lineWidth = w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * hb * .7, y1 - uy * hb * .7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - ux * hb - uy * hb * .36, y1 - uy * hb + ux * hb * .36); ctx.lineTo(x1 - ux * hb * .7, y1 - uy * hb * .7); ctx.lineTo(x1 - ux * hb + uy * hb * .36, y1 - uy * hb - ux * hb * .36); ctx.closePath(); ctx.fill();
    }
    function linea(a, b, col, al, w, guion) {
      ctx.strokeStyle = col + al + ')'; ctx.lineWidth = w; ctx.setLineDash(guion || []);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    }
    function camino(pts, cerrar) { ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); if (cerrar) ctx.closePath(); }
    function sprite(img, x, y, r, a) { var g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * (a == null ? 1 : a); ctx.drawImage(img, x - r, y - r, 2 * r, 2 * r); ctx.globalAlpha = g0; }
    // aguada con rayado fino: el relleno de cada área barrida
    function aguada(pts, col, a, ang) {
      ctx.save(); camino(pts, true); ctx.fillStyle = col + (a * .55) + ')'; ctx.fill(); ctx.clip();
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
      var c = Math.cos(ang), s = Math.sin(ang), R = Math.hypot(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      ctx.strokeStyle = col + a + ')'; ctx.lineWidth = .6; ctx.beginPath();
      for (var d = -R; d <= R; d += 5.5) { ctx.moveTo(cx + c * d - s * R, cy + s * d + c * R); ctx.lineTo(cx + c * d + s * R, cy + s * d - c * R); }
      ctx.stroke(); ctx.restore();
    }
    function circulo3(c, u, v, R, n) { var pts = []; for (var k = 0; k <= n; k++) { var a = 2 * Math.PI * k / n, ca = Math.cos(a), sa = Math.sin(a); pts.push(P(c[0] + R * (ca * u[0] + sa * v[0]), c[1] + R * (ca * u[1] + sa * v[1]), c[2] + R * (ca * u[2] + sa * v[2]))); } return pts; }
    function puntoO(x, y, a, rot) { ctx.fillStyle = TINTA + a + ')'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill(); if (rot) txt(rot, x - 9, y - 8, { px: 17, it: true, c: '#1E1A16', a: a, al: 'right' }); }
    function salePagina(x, y, R, a, rot) {   // ⊙ : vector que sale de la página
      ctx.strokeStyle = VINO + a + ')'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = VINO + a + ')'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 2 * Math.PI); ctx.fill();
      var p = (T * .55) % 1; ctx.strokeStyle = VINO + (a * .45 * (1 - p)) + ')'; ctx.lineWidth = .7; ctx.beginPath(); ctx.arc(x, y, R + 3 + p * 16, 0, 2 * Math.PI); ctx.stroke();
      if (rot) txt(rot, x + R + 5, y - R + 2, { px: 21, it: true, c: '#7A2E22', a: a });
    }

    // ═════════ I · Definición: partícula libre ═════════
    var I = { b: 175, x0: -330, x1: 340, ta: .8, tb: 14.2, dt: 1.25, t0: 1.7 };
    I.v = (I.x1 - I.x0) / (I.tb - I.ta);
    function xI(t) { return I.x0 + I.v * (t - I.ta); }
    function dibujaI(t, a) {
      if (a <= 0) return;
      cam.el = Math.PI / 2; cam.s = 1;
      var O = P(0, 0, 0), yl = -I.b, xp = xI(cl(t, I.ta - .8, I.tb + 1)), Pp = P(xp, yl, 0);
      ctx.globalAlpha = a;
      // recta del movimiento y su distancia b a O
      linea(P(-760, yl, 0), P(600, yl, 0), TINTA, .28, .8, [2, 5]);
      var Fp = P(0, yl, 0); linea(O, Fp, TINTA, .55, .8);
      ctx.strokeStyle = TINTA + '.55)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(Fp[0] + 9, Fp[1]); ctx.lineTo(Fp[0] + 9, Fp[1] - 9); ctx.lineTo(Fp[0], Fp[1] - 9); ctx.stroke();
      txt('b', Fp[0] - 10, (O[1] + Fp[1]) / 2 + 6, { px: 19, it: true, c: '#1E1A16', a: .85, al: 'right', halo: true });
      // áreas barridas en intervalos iguales Δt
      var k = 0, tk = I.t0, col = [ORO, VINO];
      while (tk < t && tk < I.tb) {
        var te = Math.min(t, tk + I.dt), A = P(xI(tk), yl, 0), B = P(xI(te), yl, 0), lleno = te >= tk + I.dt;
        aguada([O, A, B], col[k % 2], k % 2 ? .16 : .24, k % 2 ? -1.05 : 1.05);
        linea(O, A, TINTA, .32, .6); if (lleno) linea(O, B, TINTA, .32, .6);
        linea([A[0], A[1] - 5], [A[0], A[1] + 5], TINTA, .6, .8);
        if (lleno) {
          var gx = (O[0] + A[0] + B[0]) / 3, gy = (O[1] + A[1] + B[1]) / 3 + 26;
          txt('A', gx, gy + 20, { px: 17, it: true, c: '#4A4038', a: .75 * suave((t - te) / .6), al: 'center', halo: true });
          if (k === 1) txt('Δt', (A[0] + B[0]) / 2, A[1] + 20, { px: 8.5, mono: true, c: '#6B6156', a: .8 * suave((t - te) / .6), al: 'center' });
        }
        k++; tk += I.dt;
      }
      // r, p y el ángulo φ entre ellos
      if (t > I.ta - .5 && t < I.tb + .9) {
        var rx = Pp[0] - O[0], ry = Pp[1] - O[1], rl = Math.hypot(rx, ry), ux = rx / rl, uy = ry / rl;
        flecha(O[0], O[1], Pp[0] - ux * 13, Pp[1] - uy * 13, TINTA, .9, 1.25, 9);
        txt('r', O[0] + rx * .55 + uy * 14, O[1] + ry * .55 - ux * 14 + 5, { px: 20, it: true, c: '#1E1A16', a: .9, al: 'center', halo: true });
        linea([Pp[0] + ux * 14, Pp[1] + uy * 14], [Pp[0] + ux * 58, Pp[1] + uy * 58], TINTA, .35, .7, [2, 3]);
        var ang0 = Math.atan2(uy, ux), ang1 = 0, R = 30;   // p apunta a +x
        ctx.strokeStyle = ORO + '.9)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(Pp[0], Pp[1], R, Math.min(ang0, ang1), Math.max(ang0, ang1)); ctx.stroke();
        var am = (ang0 + ang1) / 2; txt('φ', Pp[0] + Math.cos(am) * (R + 11), Pp[1] + Math.sin(am) * (R + 11) + 5, { px: 17, it: true, c: '#8A5A16', a: .95, al: 'center' });
        for (var j = 1; j <= 7; j++) sprite(SPR.crema, Pp[0] - j * 9, Pp[1], 11 - j * .9, .1 * (1 - j / 8));
        sprite(SPR.crema, Pp[0], Pp[1], 12);
        flecha(Pp[0] + 14, Pp[1], Pp[0] + 92, Pp[1], VINO, .95, 1.8, 10);
        txt('p', Pp[0] + 96, Pp[1] + 5, { px: 21, it: true, c: '#7A2E22', a: 1 });
        txt('m', Pp[0] - 4, Pp[1] + 30, { px: 15, it: true, c: '#4A4038', a: .7, al: 'center' });
      }
      puntoO(O[0], O[1], 1, '');
      txt('O', O[0] - 26, O[1] + 6, { px: 18, it: true, c: '#1E1A16', a: 1, al: 'right' });
      salePagina(O[0], O[1], 13, 1, 'L');
      ctx.globalAlpha = 1;
    }

    // ═════════ II · Órbita de Kepler ═════════
    var K = { a: 232, e: .6, Tor: 7.6, t0: T2 + .9, n: 12, cx: 1150, cy: 430 };
    K.b = K.a * Math.sqrt(1 - K.e * K.e); K.c = K.a * K.e;
    function kepler(M) { var E = M; for (var i = 0; i < 8; i++) E -= (E - K.e * Math.sin(E) - M) / (1 - K.e * Math.cos(E)); return E; }
    function orbita(t) {   // posición y velocidad (foco en el origen, perihelio en +x, giro antihorario)
      var M = 2 * Math.PI * (t - K.t0) / K.Tor, E = kepler(M), dE = 2 * Math.PI / K.Tor / (1 - K.e * Math.cos(E));
      return { x: K.a * (Math.cos(E) - K.e), y: K.b * Math.sin(E), vx: -K.a * Math.sin(E) * dE, vy: K.b * Math.cos(E) * dE };
    }
    var VA = 2 * Math.PI * K.a / K.Tor * Math.sqrt((1 - K.e) / (1 + K.e));   // rapidez en el afelio
    function dibujaII(t, a) {
      if (a <= 0) return;
      var tilt = suave((t - TILT0) / (TILT1 - TILT0));
      cam.s = 1; cam.el = Math.PI / 2 - tilt * (Math.PI / 2 - .42);
      var S = P(0, 0, 0); ctx.globalAlpha = a;
      // elipse que se traza, eje mayor, centro y foco vacío
      var tr = suave((t - T2) / 1.6), pts = [];
      for (var k = 0; k <= 160 * tr; k++) { var E = 2 * Math.PI * k / 160; pts.push(P(K.a * (Math.cos(E) - K.e), K.b * Math.sin(E), 0)); }
      ctx.strokeStyle = TINTA + '.75)'; ctx.lineWidth = 1.05; camino(pts); ctx.stroke();
      linea(P(K.a * (1 - K.e) + 30, 0, 0), P(-K.a * (1 + K.e) - 30, 0, 0), TINTA, .25 * tr, .7, [2, 5]);
      var F2 = P(-2 * K.c, 0, 0); linea([F2[0] - 4, F2[1] - 4], [F2[0] + 4, F2[1] + 4], TINTA, .5 * tr, .8); linea([F2[0] - 4, F2[1] + 4], [F2[0] + 4, F2[1] - 4], TINTA, .5 * tr, .8);
      var Ce = P(-K.c, 0, 0); ctx.fillStyle = TINTA + (.4 * tr) + ')'; ctx.beginPath(); ctx.arc(Ce[0], Ce[1], 1.6, 0, 7); ctx.fill();
      // sectores de igual duración Tor/n
      var dts = K.Tor / K.n, nt = (t - K.t0) / dts, col = [ORO, VINO];
      for (var s = 0; s < Math.min(K.n, Math.ceil(nt)); s++) {
        var ta = K.t0 + s * dts, tb = Math.min(t, ta + dts), poly = [S];
        for (var q = 0; q <= 18; q++) { var o = orbita(ta + (tb - ta) * q / 18); poly.push(P(o.x, o.y, 0)); }
        aguada(poly, col[s % 2], s % 2 ? .12 : .19, (s % 2 ? -1 : 1) * (1.05 - .3 * tilt));
        linea(S, poly[1], TINTA, .25, .55);
      }
      // ápsides: perihelio y afelio con sus velocidades (misma escala que la flecha viva)
      var esc = 24 / VA, vP = VA * (1 + K.e) / (1 - K.e), ap = .85 * tr;
      var Pp = P(K.a * (1 - K.e), 0, 0), Pa = P(-K.a * (1 + K.e), 0, 0);
      var Vp = P(K.a * (1 - K.e), vP * esc, 0), Va = P(-K.a * (1 + K.e), -VA * esc, 0);
      flecha(Pp[0], Pp[1], Vp[0], Vp[1], TINTA, .45 * ap, .9, 7); flecha(Pa[0], Pa[1], Va[0], Va[1], TINTA, .45 * ap, .9, 6);
      txt('v', Vp[0] + 8, Vp[1] + 4, { px: 16, it: true, c: '#4A4038', a: .8 * ap }); txt('p', Vp[0] + 15, Vp[1] + 8, { px: 11, it: true, c: '#4A4038', a: .8 * ap });
      txt('v', Va[0] - 18, Va[1] + 2, { px: 16, it: true, c: '#4A4038', a: .8 * ap }); txt('a', Va[0] - 11, Va[1] + 6, { px: 11, it: true, c: '#4A4038', a: .8 * ap });
      txt('PERIHELIO', Pp[0] + 12, Pp[1] + 20, { px: 7.5, mono: true, c: '#6B6156', a: .8 * ap * (1 - tilt) });
      txt('AFELIO', Pa[0] - 12, Pa[1] - 12, { px: 7.5, mono: true, c: '#6B6156', a: .8 * ap * (1 - tilt), al: 'right' });
      // Sol (con halo) y planeta con r y v
      var hal = ctx.createRadialGradient(S[0], S[1], 4, S[0], S[1], 60); hal.addColorStop(0, 'rgba(242,198,112,.45)'); hal.addColorStop(1, 'rgba(242,198,112,0)');
      ctx.fillStyle = hal; ctx.beginPath(); ctx.arc(S[0], S[1], 60, 0, 7); ctx.fill();
      var vis = suave((t - K.t0 + .6) / .6);
      // L: ⊙ visto desde arriba; al inclinar, una flecha vertical
      var Lz = P(0, 0, 165), largo = Math.hypot(Lz[0] - S[0], Lz[1] - S[1]);
      if (largo > 20) {
        linea(S, P(0, 0, -40), VINO, .2 * tilt, .8, [2, 4]);
      }
      sprite(SPR.sol, S[0], S[1], 19);
      if (largo > 20) { flecha(S[0], S[1] - 14, Lz[0], Lz[1], VINO, .95 * tilt, 2, 11); txt('L', Lz[0] + 10, Lz[1] + 10, { px: 22, it: true, c: '#7A2E22', a: tilt }); }
      if (tilt < .5) salePagina(S[0], S[1], 27, 1 - tilt * 2, 'L');
      if (vis > 0) {
        var o = orbita(Math.max(t, K.t0)), Q = P(o.x, o.y, 0), V = P(o.x + o.vx * esc, o.y + o.vy * esc, 0);
        var rx = Q[0] - S[0], ry = Q[1] - S[1], rl = Math.hypot(rx, ry);
        ctx.globalAlpha = a * vis;
        flecha(S[0] + rx / rl * 22, S[1] + ry / rl * 22, Q[0] - rx / rl * 11, Q[1] - ry / rl * 11, TINTA, .85, 1.15, 8);
        txt('r', S[0] + rx * .5 - ry / rl * 14, S[1] + ry * .5 + rx / rl * 14 + 5, { px: 19, it: true, c: '#1E1A16', a: .85, al: 'center', halo: true });
        sprite(SPR.crema, Q[0], Q[1], 10);
        flecha(Q[0], Q[1], V[0], V[1], VINO, .95, 1.7, 9);
        txt('v', V[0] + 6, V[1] - 4, { px: 19, it: true, c: '#7A2E22', a: 1 });
      }
      ctx.globalAlpha = 1;
    }

    // ═════════ III · Sólido: masas que se recogen ═════════
    var R = { I0: .40, m: 1, r1: .8, r2: .2, w1: 2, zb: .62 };
    R.L = (R.I0 + 2 * R.m * R.r1 * R.r1) * R.w1;
    function rIII(t) { var u = t - T3; return R.r1 + (R.r2 - R.r1) * (suave((u - 3.2) / 3) - suave((u - 10.5) / 3)); }
    function inercia(r) { return R.I0 + 2 * R.m * r * r; }
    var giro = 0, rastro = [[], []], hist = [];
    function dibujaIII(t, a) {
      if (a <= 0) return;
      cam.el = .42; cam.s = 205; cam.x = 1085; cam.y = 560;
      ctx.globalAlpha = a;
      var r = rIII(t), Ii = inercia(r), w = R.L / Ii, ca = Math.cos(giro), sa = Math.sin(giro), zb = R.zb;
      // suelo: sombra y pistas a 0,8 m y 0,2 m
      var C0 = P(0, 0, 0), som = ctx.createRadialGradient(C0[0], C0[1], 0, C0[0], C0[1], 180);
      som.addColorStop(0, 'rgba(30,26,22,.16)'); som.addColorStop(1, 'rgba(30,26,22,0)');
      ctx.save(); ctx.translate(C0[0], C0[1]); ctx.scale(1, Math.sin(cam.el)); ctx.translate(-C0[0], -C0[1]); ctx.fillStyle = som; ctx.beginPath(); ctx.arc(C0[0], C0[1], 180, 0, 7); ctx.fill(); ctx.restore();
      [R.r1, R.r2].forEach(function (rr, k) { ctx.setLineDash([2, 4]); ctx.strokeStyle = TINTA + (k ? .32 : .25) + ')'; ctx.lineWidth = .7; camino(circulo3([0, 0, zb], [1, 0, 0], [0, 1, 0], rr, 90)); ctx.stroke(); ctx.setLineDash([]); });
      var et = P(R.r1, 0, zb); txt('0,8 m', et[0] + 10, et[1] + 14, { px: 8, mono: true, c: '#6B6156', a: .75 });
      // pie: disco pesado con rayado
      var base = circulo3([0, 0, .07], [1, 0, 0], [0, 1, 0], .3, 72), base0 = circulo3([0, 0, 0], [1, 0, 0], [0, 1, 0], .3, 72);
      ctx.fillStyle = '#3A322B'; camino(base0, true); ctx.fill();
      var izq = P(-.3, 0, 0), der = P(.3, 0, 0), izq2 = P(-.3, 0, .07), der2 = P(.3, 0, .07);
      ctx.fillStyle = '#2B241F'; ctx.beginPath(); ctx.moveTo(izq[0], izq[1]); ctx.lineTo(izq2[0], izq2[1]); ctx.lineTo(der2[0], der2[1]); ctx.lineTo(der[0], der[1]); ctx.fill();
      var gb = ctx.createLinearGradient(izq2[0], 0, der2[0], 0); gb.addColorStop(0, '#5A4E44'); gb.addColorStop(.45, '#8C7F72'); gb.addColorStop(1, '#4A4038');
      ctx.fillStyle = gb; camino(base, true); ctx.fill(); ctx.strokeStyle = TINTA + '.8)'; ctx.lineWidth = .8; ctx.stroke();
      ctx.strokeStyle = 'rgba(244,238,227,.22)'; ctx.lineWidth = .6; camino(circulo3([0, 0, .07], [1, 0, 0], [0, 1, 0], .22, 60)); ctx.stroke();
      // eje vertical
      var e0 = P(0, 0, .07), e1 = P(0, 0, zb + .02), ew = .022 * cam.s;
      var ge = ctx.createLinearGradient(e0[0] - ew, 0, e0[0] + ew, 0); ge.addColorStop(0, '#4E4A44'); ge.addColorStop(.4, '#D9D4CC'); ge.addColorStop(1, '#5E5952');
      // la barra, las masas y el eje se ordenan por profundidad
      var objs = [];
      objs.push({ z: 0, pinta: function () { ctx.fillStyle = ge; ctx.fillRect(e0[0] - ew, e1[1], 2 * ew, e0[1] - e1[1]); ctx.strokeStyle = TINTA + '.6)'; ctx.lineWidth = .6; ctx.strokeRect(e0[0] - ew, e1[1], 2 * ew, e0[1] - e1[1]); } });
      [1, -1].forEach(function (sg, k) {
        var q = [sg * ca * .92, sg * sa * .92, zb], pm = [sg * ca * r, sg * sa * r, zb], h = P(0, 0, zb), Q = P(q[0], q[1], q[2]), M = P(pm[0], pm[1], pm[2]);
        objs.push({ z: P(q[0] * .5, q[1] * .5, zb)[2], pinta: function () {
          ctx.strokeStyle = '#2E2925'; ctx.lineWidth = 4.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(h[0], h[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke();
          ctx.strokeStyle = 'rgba(220,214,204,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h[0], h[1] - 1.2); ctx.lineTo(Q[0], Q[1] - 1.2); ctx.stroke();
          for (var d = .1; d < .92; d += .1) { var m1 = P(sg * ca * d, sg * sa * d, zb), m2 = P(sg * ca * d, sg * sa * d, zb + (Math.abs(d - .5) < .01 ? .045 : .028)); linea(m1, m2, TINTA, .7, .7); }
        } });
        objs.push({ z: M[2] + .001, pinta: function () {
          var sh = P(pm[0], pm[1], 0); ctx.fillStyle = 'rgba(30,26,22,.12)'; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 15, 15 * Math.sin(cam.el), 0, 0, 7); ctx.fill();
          sprite(SPR.laton, M[0], M[1], 17);
        } });
      });
      objs.sort(function (p, q) { return p.z - q.z; }).forEach(function (o) { o.pinta(); });
      // rastros en espiral de las masas
      rastro.forEach(function (rs) {
        for (var i = 1; i < rs.length; i++) { var p0 = P(rs[i - 1][0], rs[i - 1][1], zb), p1 = P(rs[i][0], rs[i][1], zb); linea(p0, p1, VINO, (.5 * i / rs.length).toFixed(3), 1); }
      });
      // buje, L (constante) y ω (crece)
      var hb = P(0, 0, zb + .02); sprite(SPR.acero, hb[0], hb[1], 7);
      var L0 = P(0, 0, zb + .06), L1 = P(0, 0, zb + .82), W1 = P(0, 0, zb + .06 + .085 * w);
      flecha(L0[0] - 5, L0[1], L1[0] - 5, L1[1], VINO, .95, 2.1, 11);
      txt('L', L1[0] - 16, L1[1] + 6, { px: 22, it: true, c: '#7A2E22', a: 1, al: 'right' });
      flecha(W1[0] + 5 - 0, L0[1], W1[0] + 5, W1[1], ORO, .95, 1.2, 8);
      txt('ω', W1[0] + 12, W1[1] + 8, { px: 20, it: true, c: '#8A5A16', a: 1 });
      // sentido de giro
      var arc = []; for (var k2 = 0; k2 <= 40; k2++) { var an = -2.2 + 4.2 * k2 / 40; arc.push(P(.14 * Math.cos(an), .14 * Math.sin(an), zb + .42)); }
      ctx.strokeStyle = ORO + '.8)'; ctx.lineWidth = .9; camino(arc); ctx.stroke();
      var pa = arc[arc.length - 2], pb = arc[arc.length - 1]; flecha(pa[0], pa[1], pb[0] + (pb[0] - pa[0]) * 2, pb[1] + (pb[1] - pa[1]) * 2, ORO, .8, .9, 6);
      graficaIII(t, a);
      ctx.globalAlpha = 1;
    }
    // recuadro: I y ω en escala logarítmica; su suma (log L) es una recta
    var GR = { x: 800, y: 160, w: 230, h: 112 };
    function graficaIII(t, a) {
      var u = t - T3, D = 15.5, ln = Math.log, y = function (v) { return GR.y + GR.h / 2 - ln(v) / ln(4) * GR.h / 2; }, x = function (s) { return GR.x + GR.w * s / D; };
      ctx.globalAlpha = a * suave((u - .6) / .8);
      linea([GR.x, GR.y], [GR.x, GR.y + GR.h], TINTA, .55, .7); linea([GR.x, GR.y + GR.h], [GR.x + GR.w, GR.y + GR.h], TINTA, .55, .7);
      [4, 2, 1, .5, .25].forEach(function (v) { linea([GR.x - 3, y(v)], [GR.x, y(v)], TINTA, .55, .7); txt(coma(v, v < 1 ? 2 : 0), GR.x - 6, y(v) + 3, { px: 7, mono: true, c: '#6B6156', a: .8, al: 'right' }); });
      txt('ESCALA LOG · RELATIVO AL INICIO', GR.x, GR.y - 10, { px: 7, mono: true, c: '#6B6156', a: .85 });
      txt('t', GR.x + GR.w + 4, GR.y + GR.h + 4, { px: 14, it: true, c: '#4A4038', a: .8 });
      linea([GR.x, y(1)], [x(Math.min(u, D)), y(1)], ORO, .9, 1.3);
      var pI = [], pW = [];
      for (var s = 0; s <= Math.min(u, D); s += .1) { var r = rIII(T3 + s), Ir = inercia(r) / inercia(R.r1); pI.push([x(s), y(Ir)]); pW.push([x(s), y(1 / Ir)]); }
      if (pI.length > 1) {
        ctx.strokeStyle = TINTA + '.85)'; ctx.lineWidth = 1.1; camino(pI); ctx.stroke();
        ctx.strokeStyle = VINO + '.9)'; ctx.lineWidth = 1.3; camino(pW); ctx.stroke();
        var e1 = pI[pI.length - 1], e2 = pW[pW.length - 1];
        txt('I', e1[0] + 6, e1[1] - 4, { px: 14, it: true, c: '#1E1A16', a: 1 }); txt('ω', e2[0] + 5, e2[1] - 4, { px: 15, it: true, c: '#7A2E22', a: 1 });
        txt('L = Iω', x(Math.min(u, D)) + 6, y(1) + 4, { px: 13, it: true, c: '#8A5A16', a: 1 });
      }
    }

    // ═════════ IV · Giróscopo ═════════
    var G = { m: .15, Rr: 3, d: 4, h: 9.5, rps: 40 };
    G.I = .5 * G.m * Math.pow(G.Rr / 100, 2); G.w = 2 * Math.PI * G.rps; G.Lm = G.I * G.w; G.tau = G.m * 9.81 * G.d / 100; G.Om = G.tau / G.Lm;
    var LENTA = .5;
    function dibujaIV(t, a) {
      if (a <= 0) return;
      cam.el = .5; cam.s = 24; cam.x = 1070; cam.y = 650;
      ctx.globalAlpha = a;
      var u = t - T4, psi = 2.4 + G.Om * LENTA * Math.max(0, u - 1.2) * suave((u - .4) / 1.6) , U = [Math.cos(psi), Math.sin(psi), 0], V = [-U[1], U[0], 0], Z = [0, 0, 1], h = G.h;
      function add(p, q, s) { return [p[0] + q[0] * s, p[1] + q[1] * s, p[2] + q[2] * s]; }
      function Pp(q) { return P(q[0], q[1], q[2]); }
      var piv = [0, 0, h], C = add(piv, U, G.d), Cs = Pp(C);
      // sombra y base
      var B0 = P(0, 0, 0), som = ctx.createRadialGradient(B0[0], B0[1], 0, B0[0], B0[1], 190);
      som.addColorStop(0, 'rgba(30,26,22,.15)'); som.addColorStop(1, 'rgba(30,26,22,0)');
      ctx.save(); ctx.translate(B0[0], B0[1]); ctx.scale(1, Math.sin(cam.el)); ctx.translate(-B0[0], -B0[1]); ctx.fillStyle = som; ctx.beginPath(); ctx.arc(B0[0], B0[1], 190, 0, 7); ctx.fill(); ctx.restore();
      var bz = .9, bR = 4.4;
      ctx.fillStyle = '#2B241F'; camino(circulo3([0, 0, 0], [1, 0, 0], [0, 1, 0], bR, 72), true); ctx.fill();
      var a1 = P(-bR, 0, 0), a2 = P(-bR, 0, bz), b1 = P(bR, 0, 0), b2 = P(bR, 0, bz);
      ctx.fillStyle = '#2B241F'; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]); ctx.fill();
      var gb = ctx.createLinearGradient(a2[0], 0, b2[0], 0); gb.addColorStop(0, '#5A4E44'); gb.addColorStop(.45, '#8C7F72'); gb.addColorStop(1, '#4A4038');
      ctx.fillStyle = gb; camino(circulo3([0, 0, bz], [1, 0, 0], [0, 1, 0], bR, 72), true); ctx.fill(); ctx.strokeStyle = TINTA + '.8)'; ctx.lineWidth = .8; ctx.stroke();
      ctx.strokeStyle = 'rgba(244,238,227,.2)'; ctx.lineWidth = .6; camino(circulo3([0, 0, bz], [1, 0, 0], [0, 1, 0], 3.4, 60)); ctx.stroke();
      // trayectorias: punta de L y centro del rotor
      var LL = 5.2, rt = G.d + LL;
      ctx.setLineDash([2, 4]); ctx.strokeStyle = VINO + '.4)'; ctx.lineWidth = .8; camino(circulo3(piv, [1, 0, 0], [0, 1, 0], rt, 120)); ctx.stroke();
      ctx.strokeStyle = TINTA + '.22)'; camino(circulo3(piv, [1, 0, 0], [0, 1, 0], G.d, 90)); ctx.stroke(); ctx.setLineDash([]);
      // torre
      var tr = .42, t0 = P(0, 0, bz), t1 = P(0, 0, h), tw = tr * cam.s;
      var gt = ctx.createLinearGradient(t0[0] - tw, 0, t0[0] + tw, 0); gt.addColorStop(0, '#5C4220'); gt.addColorStop(.38, '#E9CF94'); gt.addColorStop(1, '#6B4A1E');
      function torre() {
        ctx.fillStyle = gt; ctx.fillRect(t0[0] - tw, t1[1], 2 * tw, t0[1] - t1[1]);
        ctx.strokeStyle = TINTA + '.6)'; ctx.lineWidth = .6; ctx.strokeRect(t0[0] - tw, t1[1], 2 * tw, t0[1] - t1[1]);
        for (var k = 1; k < 4; k++) { var yy = t0[1] - (t0[1] - t1[1]) * k / 4; linea([t0[0] - tw, yy], [t0[0] + tw, yy], TINTA, .25, .5); }
      }
      // eje del rotor
      var A0 = Pp(add(piv, U, -1.1)), A1 = Pp(add(piv, U, G.d + 1.3));
      function eje() {
        ctx.strokeStyle = '#3A3530'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(A0[0], A0[1]); ctx.lineTo(A1[0], A1[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(230,226,218,.6)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(A0[0], A0[1] - 1); ctx.lineTo(A1[0], A1[1] - 1); ctx.stroke();
        var pv = Pp(piv); sprite(SPR.acero, pv[0], pv[1], 7.5);
      }
      // rotor: cara trasera, canto y cara delantera, con radios difuminados por el giro
      function rotor() {
        var th = .75, f1 = add(C, U, th / 2), f0 = add(C, U, -th / 2), fr = Pp(f1)[2] > Pp(f0)[2] ? [f0, f1, 1] : [f1, f0, -1];
        var atras = fr[0], frente = fr[1];
        for (var k = 0; k <= 8; k++) {
          var cc = add(atras, U, fr[2] * th * k / 8);
          ctx.fillStyle = k < 8 ? '#6B4A1E' : '#8A6228'; camino(circulo3(cc, V, Z, G.Rr, 64), true); ctx.fill();
        }
        var fc = Pp(frente), cara = circulo3(frente, V, Z, G.Rr, 64);
        var gg = ctx.createRadialGradient(fc[0] - 18, fc[1] - 22, 4, fc[0], fc[1], G.Rr * cam.s * 1.1);
        gg.addColorStop(0, '#FBEFD0'); gg.addColorStop(.5, '#D2A35A'); gg.addColorStop(1, '#7C5521');
        ctx.fillStyle = gg; camino(cara, true); ctx.fill(); ctx.strokeStyle = 'rgba(60,38,12,.85)'; ctx.lineWidth = .9; ctx.stroke();
        [.82, .36].forEach(function (q) { ctx.strokeStyle = 'rgba(60,38,12,.45)'; ctx.lineWidth = .7; camino(circulo3(frente, V, Z, G.Rr * q, 56)); ctx.stroke(); });
        // radios: el rotor gira a 40 vueltas/s; se ven como un abanico difuso
        var fase = T * 9.3;
        for (var s = 0; s < 6; s++) for (var j = 0; j < 5; j++) {
          var an = fase + s * Math.PI / 3 - j * .09, p0 = add(frente, add(V, Z, 0), 0);
          var a0 = add(add(frente, V, Math.cos(an) * G.Rr * .36), Z, Math.sin(an) * G.Rr * .36), a1 = add(add(frente, V, Math.cos(an) * G.Rr * .82), Z, Math.sin(an) * G.Rr * .82);
          linea(Pp(a0), Pp(a1), 'rgba(60,38,12,', (.42 * (1 - j / 5)).toFixed(2), 1.4);
        }
        var hc = Pp(add(frente, U, fr[2] * .15)); sprite(SPR.acero, hc[0], hc[1], 6);
      }
      var delante = Cs[2] > 0;
      if (delante) { torre(); eje(); rotor(); } else { rotor(); eje(); torre(); }
      // vectores: L a lo largo del eje, peso, torque y dL
      var Lt = Pp(add(C, U, LL)), Lb = Pp(add(C, U, G.d * 0 + .7));
      flecha(Lb[0], Lb[1], Lt[0], Lt[1], VINO, .95, 2.1, 11);
      txt('L', Lt[0] + 8, Lt[1] - 6, { px: 22, it: true, c: '#7A2E22', a: 1, halo: true });
      var mg0 = Pp(add(C, Z, -G.Rr - .2)), mg1 = Pp(add(C, Z, -G.Rr - 3.2));
      flecha(mg0[0], mg0[1], mg1[0], mg1[1], TINTA, .85, 1.3, 8);
      txt('mg', mg1[0] + 8, mg1[1] + 2, { px: 18, it: true, c: '#1E1A16', a: .9, halo: true });
      var tz = Pp(piv), tq = Pp(add(piv, V, 3.6));
      flecha(tz[0], tz[1], tq[0], tq[1], ORO, .95, 1.5, 9);
      txt('τ', tq[0] + 6, tq[1] + 4, { px: 20, it: true, c: '#8A5A16', a: 1, halo: true });
      var dl = Pp(add(add(C, U, LL), V, 1.6)); flecha(Lt[0], Lt[1], dl[0], dl[1], ORO, .9, 1.1, 7);
      txt('dL', dl[0] + 5, dl[1] + 12, { px: 15, it: true, c: '#8A5A16', a: .95, halo: true });
      var om = Pp(add(piv, Z, 3.4)); flecha(tz[0], tz[1] - 8, om[0], om[1], ORO, .8, 1.1, 8);
      txt('Ω', om[0] + 7, om[1] + 6, { px: 19, it: true, c: '#8A5A16', a: 1 });
      // cota d
      var dm = Pp(add(piv, U, G.d * .45)); txt('d', dm[0], dm[1] - 9, { px: 17, it: true, c: '#1E1A16', a: .9, al: 'center', halo: true });
      ctx.globalAlpha = 1;
      return psi;
    }

    // ── notas ──
    var notas = [];
    function nota(o) {
      var g = el('g', { 'class': 'fz-nota' }, capa), lado = o.lado || 1, ancho = o.ancho || 236;
      var gp = el('g', { 'class': 'fz-ancla' }, g); el('circle', { 'class': 'fz-pt', r: 2.3 }, gp); el('circle', { 'class': 'fz-aro', r: 2.3 }, gp);
      var guia = el('path', { 'class': 'fz-guia', pathLength: 1 }, g);
      var tx = o.tx, ty = o.ty, x0 = lado > 0 ? tx : tx - ancho, alto = 48 + (o.d.length - 1) * 17.5;
      var y0 = o.pie ? ty - alto - 18 : ty;
      el('line', { 'class': 'fz-regla', x1: f(x0), y1: f(ty), x2: f(x0 + ancho), y2: f(ty), pathLength: 1 }, g);
      var t = el('text', { 'class': 'fz-k', x: f(x0), y: f(o.pie ? y0 - 6 : ty - 9) }, g); t.textContent = o.k;
      var t2 = el('text', { 'class': 'fz-tit', x: f(x0), y: f(y0 + 25) }, g); t2.textContent = o.tit;
      var t3 = el('text', { 'class': 'fz-d', x: f(x0), y: f(y0 + 48) }, g);
      o.d.forEach(function (l, k) { var s = el('tspan', { x: f(x0), dy: k ? 17.5 : 0 }, t3); s.textContent = l; });
      var n = { g: g, ver: false };
      n.ubica = function (ax, ay) {
        gp.setAttribute('transform', 'translate(' + f(ax) + ' ' + f(ay) + ')');
        var ex = lado > 0 ? x0 - 10 : x0 + ancho + 10;
        guia.setAttribute('d', 'M' + f(ax) + ' ' + f(ay) + ' L' + f(ex) + ' ' + f(ty) + ' L' + f(lado > 0 ? x0 : x0 + ancho) + ' ' + f(ty));
      };
      n.pon = function (v) { if (v !== n.ver) { n.ver = v; g.classList.toggle('ver', v); } };
      notas.push(n); return n;
    }
    var ARR = { tx: 1010, ty: 238, ancho: 240, lado: -1, pie: true }, DER = { tx: 1150, ty: 650, ancho: 240 }, ABA = { tx: 1000, ty: 660, ancho: 244, lado: -1 };
    function en(lugar, o) { for (var k in lugar) if (!(k in o)) o[k] = lugar[k]; return nota(o); }
    var n1 = en(ARR, { k: 'Momento angular', tit: 'L = r × p',
      d: ['Se define respecto de un punto O y es', 'perpendicular a r y a p: aquí sale de la', 'página (⊙). Su tamaño es r p sen φ, y', 'r sen φ es la distancia b de O a la recta.'] });
    var n2 = en(DER, { k: 'Partícula libre', tit: 'Áreas iguales, tiempos iguales',
      d: ['Sin fuerzas p no cambia y b tampoco:', '|L| = m v b se conserva. En cada Δt,', 'r barre un triángulo de base v Δt y', 'altura b, así que dA/dt = |L| / 2m.'] });
    var n3 = en(ARR, { k: 'Fuerza central', tit: 'τ = r × F = 0',
      d: ['La gravedad del Sol apunta siempre a', 'lo largo de r: no hay torque y, como', 'dL/dt = τ, L no cambia. La órbita queda', 'en un plano fijo, perpendicular a L.'] });
    var n4 = en(DER, { k: 'Segunda ley de Kepler · 1609', tit: 'dA/dt = L / 2m',
      d: ['Cada sector dura 1/12 del periodo y', 'todos tienen la misma área. Cerca del Sol', 'r es pequeño y v grande: rₚvₚ = rₐvₐ.', 'Con e = 0,6, vₚ/vₐ = (1 + e)/(1 − e) = 4.'] });
    var n5 = en(ARR, { k: 'Un vector', tit: 'L es perpendicular a la órbita',
      d: ['Vista de lado, L es una flecha fija que', 'sale del Sol. Conservar L es conservar', 'el plano, el sentido de giro y el ritmo', 'al que se barren las áreas.'] });
    var n6 = en(DER, { k: 'Cuerpo rígido', tit: 'L = I ω',
      d: ['Al girar en torno a un eje fijo, L = I ω', 'con I = Σ m r². Sin torque externo en', 'el eje (sin rozamiento), I₁ω₁ = I₂ω₂:', 'así acelera una patinadora al recogerse.'] });
    var n7 = en(DER, { k: 'Al recoger las masas', tit: 'I baja 3,5 veces; ω sube 3,5',
      d: ['I = 0,40 + 2·(1 kg)·r² pasa de 1,68', 'a 0,48 kg·m² (r de 0,8 a 0,2 m) y ω,', 'de 2 a 7 rad/s. La energía L²/2I sube', 'de 3,4 a 11,8 J: el trabajo de los brazos.'] });
    var n8 = en(ARR, { k: 'Giróscopo', tit: 'τ = dL/dt',
      d: ['El peso, aplicado a d del pivote, da un', 'torque horizontal y perpendicular a L.', 'Cambia la dirección de L, no su tamaño:', 'el eje gira alrededor del pivote, no cae.'] });
    var n9 = en(DER, { k: 'Precesión', tit: 'Ω = m g d / (I ω)',
      d: ['Rotor de 150 g, R = 3 cm, d = 4 cm y', '40 vueltas/s: I ω ≈ 0,017 kg·m²/s y', 'τ ≈ 0,059 N·m, así que Ω ≈ 3,5 rad/s,', 'una vuelta en 1,8 s. Vale si ω ≫ Ω.'] });
    var AGENDA = [[n1, 2.2, 9.4], [n2, 6.4, T2 - .3], [n3, T2 + 1.6, T2 + 7.6], [n4, T2 + 4.2, TILT0 - .2], [n5, TILT1 - .6, T3 - .2], [n6, T3 + .8, T3 + 5.4], [n7, T3 + 5.8, T4 - .3], [n8, T4 + 1.4, T4 + 9.6], [n9, T4 + 6.4, FIN - .2]];

    // ── capítulos ──
    var CAPS = [['I', 'Definición', 0], ['II', 'Órbita', T2, [[T2, 'Fuerza central'], [TILT0, 'L como vector']]], ['III', 'Sólido', T3], ['IV', 'Giróscopo', T4]];
    var barra = document.createElement('nav'); barra.className = 'fz-caps'; barra.setAttribute('aria-label', 'Capítulos de la animación');
    CAPS.forEach(function (c, k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fz-cap';
      b.innerHTML = '<span class="fz-cap-n">' + c[0] + '</span><span class="fz-cap-t">' + c[1] + '</span><i class="fz-cap-l"><i></i></i>';
      b.addEventListener('click', function () { salta(c[2]); });
      c.b = b; c.l = b.querySelector('.fz-cap-l i'); barra.appendChild(b);
      if (c[3]) {
        c.s = document.createElement('span'); c.s.className = 'fz-cap-s'; b.appendChild(c.s);
        var fin = k + 1 < CAPS.length ? CAPS[k + 1][2] : FIN;
        c[3].forEach(function (e, j) { if (!j) return; var m = document.createElement('b'); m.className = 'fz-cap-m'; m.style.left = (100 * (e[0] - c[2]) / (fin - c[2])).toFixed(1) + '%'; b.appendChild(m); });
      }
    });
    fig.appendChild(barra);
    function capitulos(t) {
      CAPS.forEach(function (c, k) {
        var ini = c[2], sig = k + 1 < CAPS.length ? CAPS[k + 1][2] : null, fin = sig == null ? FIN : sig;
        var on = t >= ini && t < (sig == null ? DUR : sig);
        if (on !== c.on) { c.on = on; c.b.classList.toggle('on', on); }
        c.l.style.transform = 'scaleX(' + cl((t - ini) / (fin - ini), 0, 1).toFixed(3) + ')';
        if (c.s) {
          var sub = ''; if (on) c[3].forEach(function (e, j) { if (t >= e[0]) sub = c[0] + '·' + (j + 1) + ' ' + e[1]; });
          if (sub !== c.sub) { c.sub = sub; c.s.classList.remove('ver'); clearTimeout(c.st); if (sub) c.st = setTimeout(function () { c.s.textContent = sub; c.s.classList.add('ver'); }, c.s.textContent ? 260 : 0); }
        }
      });
    }

    function salta(t) { T = t; notas.forEach(function (n) { n.pon(false); }); rastro = [[], []]; }
    fig.moSalta = salta; fig.moFija = function (t) { salta(t); fijo = true; }; fig.moSuelta = function () { fijo = false; };   // para capturas
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (on && !fig.moOn) salta(0); fig.moOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });

    var psiAct = 0;
    function dibuja(t) {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = Math.round(w * d); lienzo.height = Math.round(h * d); }
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      var fundido = t < .4 ? t / .4 : t > FIN ? 1 - suave((t - FIN) / (DUR - FIN - .3)) : 1;
      // I y II comparten el punto O; la cámara se desliza de uno al otro
      var mv = suave((t - T2 + .4) / 1.6); cam.x = OX + (K.cx - OX) * mv; cam.y = OY + (K.cy - OY) * mv;
      var a1 = ventana(t, 0, T2 + .6, .8) * fundido;
      var a2 = ventana(t, T2 - .2, T3 + .3, .9) * fundido;
      dibujaI(t, a1 * (1 - suave((t - T2 + .6) / .8)) + 0);
      cam.x = OX + (K.cx - OX) * mv; cam.y = OY + (K.cy - OY) * mv;
      dibujaII(t, a2);
      dibujaIII(t, ventana(t, T3 - .3, T4 + .3, .9) * fundido);
      psiAct = dibujaIV(t, ventana(t, T4 - .3, DUR, .9) * fundido) || psiAct;
      // anclas de las notas
      cam.el = Math.PI / 2; cam.s = 1; cam.x = OX; cam.y = OY;
      var O = P(0, 0, 0); n1.ubica(O[0] + 14, O[1] - 14);
      n2.ubica((P(xI(Math.min(t, 7.5)), -I.b, 0)[0] + O[0]) / 2 + 30, O[1] + I.b * .8);
      n3.ubica(K.cx - 14, K.cy - 14);
      var oo = orbita(K.t0 + K.Tor * .93); n4.ubica(K.cx + oo.x * .55, K.cy - oo.y * .55);
      n5.ubica(K.cx, K.cy - 100);
      n6.ubica(1085, 560 - 205 * (R.zb + .4) * Math.cos(.42));
      n7.ubica(1085 + 205 * rIII(t) * .9, 560 - 205 * R.zb * Math.cos(.42));
      cam.el = .5; cam.s = 24; cam.x = 1070; cam.y = 650;
      var pv = P(0, 0, G.h); n8.ubica(pv[0], pv[1]);
      var lt = P(Math.cos(psiAct) * (G.d + 5.2), Math.sin(psiAct) * (G.d + 5.2), G.h); n9.ubica(lt[0], lt[1]);
    }
    function lecturas(t) {
      if (t < T2) {
        var x = xI(cl(t, I.ta, I.tb)), r = Math.hypot(x, I.b) / I.b, phi = Math.atan2(I.b, -x) * 180 / Math.PI;
        salida('r = ' + coma(r, 2) + ' b · φ = ' + coma(phi, 0) + '°', 'r sen φ = ' + coma(r * Math.sin(phi * Math.PI / 180), 2) + ' b  →  |L| = m v b');
      } else if (t < T3) {
        var o = orbita(Math.max(t, K.t0)), rr = Math.hypot(o.x, o.y), vv = Math.hypot(o.vx, o.vy), cr = Math.abs(o.x * o.vy - o.y * o.vx);
        var Lref = K.a * (1 + K.e) * VA;
        salida('r = ' + coma(rr / K.a, 2) + ' a · v = ' + coma(vv / VA, 2) + ' v_a', '|r × v| = ' + coma(cr / Lref, 3) + ' (constante)');
      } else if (t < T4) {
        var r3 = rIII(t), I3 = inercia(r3), w3 = R.L / I3;
        salida('r = ' + coma(r3, 2) + ' m · I = ' + coma(I3, 2) + ' kg·m²', 'ω = ' + coma(w3, 2) + ' rad/s · L = ' + coma(I3 * w3, 2) + ' · E = ' + coma(.5 * I3 * w3 * w3, 1) + ' J');
      } else {
        salida('Ω ≈ ' + coma(G.Om, 2) + ' rad/s · T ≈ ' + coma(2 * Math.PI / G.Om, 1) + ' s', '|L| = ' + coma(G.Lm, 3) + ' kg·m²/s · cámara lenta ×½');
      }
    }
    function ecuacion(t) {
      var e = t < T2 ? '<b>L</b> = <b>r</b> × <b>p</b>' : t < T3 ? 'd<b>L</b>/dt = <b>r</b> × <b>F</b> = 0' : t < T4 ? 'I<sub>1</sub>ω<sub>1</sub> = I<sub>2</sub>ω<sub>2</sub>' : 'Ω = mgd / Iω';
      if (ec && e !== ecAct) { ecAct = e; ec.innerHTML = e; }
    }

    if (quieto) T = 5;
    return {
      tick: function (dt) {
        if (!fig.classList.contains('on')) return;
        if (!quieto && !fijo) { T += dt; if (T >= DUR) salta(0); }
        // capítulo III: el giro se integra con ω = L / I(r)
        if (T > T3 - .5 && T < T4 + .5) {
          var r = rIII(T); giro += R.L / inercia(r) * (fijo ? 0 : dt);
          [1, -1].forEach(function (sg, k) { rastro[k].push([sg * Math.cos(giro) * r, sg * Math.sin(giro) * r]); if (rastro[k].length > 90) rastro[k].shift(); });
        }
        AGENDA.forEach(function (a) { a[0].pon(T >= a[1] && T < a[2]); });
        dibuja(T); lecturas(T); capitulos(T); ecuacion(T);
      }
    };
  };
})();
