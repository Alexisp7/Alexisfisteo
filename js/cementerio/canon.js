// III · Problemas de física — Taylor, Classical Mechanics, problema 1.40.
// Un cañón dispara con ángulo θ (sin aire). x = v₀ cos θ t, y = v₀ sen θ t − ½ g t².
// r² = v₀²t² − g v₀ sen θ t³ + ¼ g² t⁴  ⟹  d(r²)/dt = t (g²t² − 3 g v₀ sen θ t + 2 v₀²).
// Con τ = g t / v₀ el paréntesis es v₀² q(τ), q(τ) = τ² − 3 sen θ τ + 2. r crece siempre si q no tiene raíces:
// Δ = 9 sen²θ − 8 < 0  ⟺  sen θ < √8/3  ⟺  θ < 70,53°. Si θ es mayor, r baja entre las raíces τ₋ y τ₊,
// justo cuando la velocidad apunta "hacia" el cañón: r·v = ½ d(r²)/dt < 0.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function f(v) { return Math.round(v * 10) / 10; }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; }
  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function suave(x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); }
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
  var G = 9.81, V0 = 20, TMAX = Math.asin(Math.sqrt(8) / 3) * 180 / Math.PI;   // 70,53°
  var ANG = [45, 60, TMAX, 75, 85];

  window.cmCanon = function (svg, salida, op) {
    op = op || {}; var SEC = op.secuencia || [0, 1, 2, 3, 4], DY = op.embebido ? 44 : 0;
    var fig = svg.parentNode, raiz = fig.closest('.mc');
    var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lienzo = document.createElement('canvas'); lienzo.className = 'mo-lienzo'; fig.insertBefore(lienzo, svg);
    var ctx = lienzo.getContext('2d'), capa = el('g', { 'class': 'fz-notas' }, svg);
    var ec = raiz && raiz.querySelector('.mc-ec[data-ec="2"]');
    var BALA = esfera('#6E665E', '#3A342F', '#141210', 'rgba(10,8,6,.8)'), BRONCE = esfera('#F6E7C4', '#C79A52', '#6B4718', 'rgba(60,38,12,.65)');
    var TINTA = 'rgba(30,26,22,', VINO = 'rgba(122,46,34,', ORO = 'rgba(176,122,40,', VIOL = 'rgba(91,58,140,', PAPEL = '#F4EEE3';
    var W = 0, H = 0, dpr = 1;
    // ── escena: el cañón en O, 13 px por metro ──
    var OX = 900, OY = 690, ESC = 11;
    function Pm(x, y) { return [OX + ESC * x, OY - ESC * y]; }

    function txt(str, x, y, o) {
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr, k = Math.min(kx, ky);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = (o.it ? 'italic 500 ' : '400 ') + (o.px * k).toFixed(1) + 'px ' + (o.mono ? "'Space Mono',monospace" : "'Cormorant Garamond',serif");
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
    function linea(a, b, col, al, w, guion) { ctx.strokeStyle = col + al + ')'; ctx.lineWidth = w; ctx.setLineDash(guion || []); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
    function camino(pts) { ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); }

    // ── física ──
    function tiro(th) {
      var s = Math.sin(th * Math.PI / 180), c = Math.cos(th * Math.PI / 180), D = 9 * s * s - 8, o = { th: th, s: s, c: c, tf: 2 * V0 * s / G, D: D };
      if (D > 1e-6) { o.t1 = (3 * s - Math.sqrt(D)) / 2 * V0 / G; o.t2 = (3 * s + Math.sqrt(D)) / 2 * V0 / G; }
      return o;
    }
    function pos(o, t) { return [V0 * o.c * t, V0 * o.s * t - .5 * G * t * t]; }
    function vel(o, t) { return [V0 * o.c, V0 * o.s - G * t]; }

    // ── estado: ángulo elegido y reloj del tiro ──
    var sel = SEC[0], T = 0, auto = true, LENTO = .8, PAUSA = op.pausa || 3.4, ocupa = 0;
    var tir = ANG.map(tiro);
    function durTiro(k) { return tir[k].tf / LENTO + PAUSA; }

    // ── selector de ángulo (misma tipografía que la barra de capítulos) ──
    var barra = document.createElement('nav'); barra.className = 'fz-caps' + (op.embebido ? ' ca-sel' : ''); barra.setAttribute('aria-label', 'Ángulo de tiro');
    var et = document.createElement('span'); et.className = 'fz-cap ca-et'; et.innerHTML = '<span class="fz-cap-n">θ</span>'; barra.appendChild(et);
    var bots = ANG.map(function (a, k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fz-cap' + (k === 2 ? ' ca-max' : '');
      b.innerHTML = '<span class="fz-cap-n">' + coma(a, k === 2 ? 1 : 0) + '°</span>' + (k === 2 ? '<span class="fz-cap-t">máx</span>' : '') + '<i class="fz-cap-l"><i></i></i>';
      b.addEventListener('click', function () { elige(k); auto = false; ocupa = performance.now() + 20000; clearTimeout(bots.tAuto); bots.tAuto = setTimeout(function () { auto = true; }, 20000); });
      barra.appendChild(b); return b;
    });
    fig.appendChild(barra);
    function elige(k) { sel = k; T = 0; bots.forEach(function (b, j) { b.classList.toggle('on', j === k); }); }
    elige(sel);

    // ── desarrollo (SVG, como las notas) ──
    var x0 = 770, filas = [];
    function fila(y, rot, partes, nota) {
      var g = el('g', { 'class': 'fz-nota' }, capa), r = el('text', { 'class': 'fz-k', x: x0, y: y }, g); r.textContent = rot;
      var t = el('text', { 'class': 'mo-ec', x: x0, y: y + 26 }, g);
      partes.forEach(function (p) {
        var at = p[1] === 's' ? { 'class': 'mo-sub', dy: 5 } : p[1] === 'p' ? { 'class': 'mo-sub', dy: -9 } : {};
        var sp = el('tspan', at, t); sp.textContent = p[0];
        if (p[1] === 's' || p[1] === 'p') { var vu = el('tspan', { dy: p[1] === 's' ? -5 : 9 }, t); vu.textContent = ' '; }
      });
      if (nota) { var d = el('text', { 'class': 'fz-d', x: x0, y: y + 46 }, g); d.textContent = nota; }
      var n = { ver: false, pon: function (v) { if (v !== n.ver) { n.ver = v; g.classList.toggle('ver', v); } } }; filas.push(n); return n;
    }
    fila(110 + DY, 'Taylor · problema 1.40', [['x = v', ''], ['0', 's'], ['cos θ t,   y = v', ''], ['0', 's'], ['sen θ t − ½ g t', ''], ['2', 'p']], 'Segunda ley sin aire: ẍ = 0, ÿ = −g.');
    fila(176 + DY, 'Distancia al cañón', [['r', ''], ['2', 'p'], [' = v', ''], ['0', 's'], ['2', 'p'], ['t', ''], ['2', 'p'], [' − g v', ''], ['0', 's'], [' sen θ t', ''], ['3', 'p'], [' + ¼ g', ''], ['2', 'p'], ['t', ''], ['4', 'p']]);
    fila(226 + DY, 'Se deriva', [['d(r', ''], ['2', 'p'], [')/dt = t ( g', ''], ['2', 'p'], ['t', ''], ['2', 'p'], [' − 3 g v', ''], ['0', 's'], [' sen θ t + 2v', ''], ['0', 's'], ['2', 'p'], [' )', '']], 'r crece siempre si el paréntesis nunca se anula.');
    fila(294 + DY, 'Sin raíces reales', [['Δ ∝ 9 sen', ''], ['2', 'p'], ['θ − 8 < 0  ⟹  sen θ < √8 / 3', '']], 'θ < arcsen(√8/3) ≈ 70,53°, sin importar v₀ ni g.');
    filas.forEach(function (n, k) { n.t0 = .4 + k * .5; });

    // ── dibujo ──
    var GQ = { x: 1140, y: 200 + DY, w: 230, h: 110 };   // q(τ) = τ² − 3 sen θ τ + 2 sobre el vuelo, τ ∈ [0, 2 sen θ]
    function graficaQ(o, t, a) {
      var lo = -.6, hi = 2.2, x = function (u) { return GQ.x + GQ.w * u / 2; }, y = function (v) { return GQ.y + GQ.h - (v - lo) / (hi - lo) * GQ.h; };
      ctx.globalAlpha = a;
      linea([GQ.x, GQ.y], [GQ.x, GQ.y + GQ.h], TINTA, .55, .7); linea([GQ.x, y(0)], [GQ.x + GQ.w, y(0)], TINTA, .55, .7);
      [2, 1, 0].forEach(function (v) { linea([GQ.x - 3, y(v)], [GQ.x, y(v)], TINTA, .55, .7); txt(String(v), GQ.x - 6, y(v) + 3, { px: 7, mono: true, c: '#6B6156', a: .8, al: 'right' }); });
      txt('q(τ) = τ² − 3 sen θ τ + 2', GQ.x, GQ.y - 10, { px: 7, mono: true, c: '#6B6156', a: .85 });
      txt('τ = g t / v₀', GQ.x + GQ.w + 4, y(0) + 4, { px: 12, it: true, c: '#4A4038', a: .8 });
      // los otros ángulos, tenues
      tir.forEach(function (q, k) {
        var pts = []; for (var u = 0; u <= 2 * q.s + 1e-9; u += .02) pts.push([x(u), y(u * u - 3 * q.s * u + 2)]);
        ctx.strokeStyle = (k === sel ? VINO : TINTA) + (k === sel ? .95 : .18) + ')'; ctx.lineWidth = k === sel ? 1.6 : .8; camino(pts); ctx.stroke();
      });
      // región negativa del ángulo elegido
      if (o.t1) {
        var u1 = o.t1 * G / V0, u2 = Math.min(o.t2 * G / V0, 2 * o.s), pts = [[x(u1), y(0)]];
        for (var u = u1; u <= u2; u += .01) pts.push([x(u), y(u * u - 3 * o.s * u + 2)]);
        pts.push([x(u2), y(0)]); ctx.fillStyle = VIOL + '.22)'; camino(pts); ctx.closePath(); ctx.fill();
        txt('r decrece', x((u1 + u2) / 2), y(0) + 22, { px: 13, it: true, c: '#5B3A8C', a: 1, al: 'center' });
      } else if (Math.abs(o.D) < 1e-3) txt('toca el cero', x(1.5 * o.s), y(0) + 18, { px: 13, it: true, c: '#5B3A8C', a: 1, al: 'center' });
      var tt = Math.min(t, o.tf), uu = tt * G / V0, qq = uu * uu - 3 * o.s * uu + 2;
      ctx.fillStyle = VINO + '1)'; ctx.beginPath(); ctx.arc(x(uu), y(qq), 3, 0, 7); ctx.fill();
    }
    function canon(th, a) {
      ctx.globalAlpha = a;
      // suelo rayado
      linea([OX - 60, OY + 14], [OX + 530, OY + 14], TINTA, .7, 1);
      ctx.strokeStyle = TINTA + '.3)'; ctx.lineWidth = .6; ctx.beginPath();
      for (var x = OX - 56; x < OX + 530; x += 9) { ctx.moveTo(x, OY + 14); ctx.lineTo(x - 7, OY + 22); }
      ctx.stroke();
      // cureña, rueda y tubo
      ctx.save(); ctx.translate(OX, OY); ctx.rotate(-th * Math.PI / 180);
      var gt = ctx.createLinearGradient(0, -7, 0, 7); gt.addColorStop(0, '#E9CF94'); gt.addColorStop(.45, '#B88A44'); gt.addColorStop(1, '#5E4018');
      ctx.fillStyle = gt; ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(40, -5.5); ctx.lineTo(40, 5.5); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,38,12,.85)'; ctx.lineWidth = .8; ctx.stroke();
      ctx.fillStyle = '#4A3214'; ctx.fillRect(38, -6.5, 4, 13); ctx.restore();
      ctx.fillStyle = '#3A322B'; ctx.beginPath(); ctx.moveTo(OX - 22, OY + 14); ctx.lineTo(OX - 4, OY - 4); ctx.lineTo(OX + 8, OY + 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2B241F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(OX - 2, OY + 6, 8, 0, 7); ctx.stroke();
      ctx.lineWidth = .7; for (var k = 0; k < 6; k++) { var an = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(OX - 2, OY + 6); ctx.lineTo(OX - 2 + 8 * Math.cos(an), OY + 6 + 8 * Math.sin(an)); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    function dibuja() {
      var w = fig.clientWidth, h = fig.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || !h) return;
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; lienzo.width = Math.round(w * d); lienzo.height = Math.round(h * d); }
      var vb = svg.viewBox.baseVal, kx = W / vb.width * dpr, ky = H / vb.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(kx, 0, 0, ky, -vb.x * kx, -vb.y * ky);
      var o = tir[sel], t = Math.min(T * LENTO, o.tf), fin = T * LENTO >= o.tf;
      // arcos de referencia: el ángulo máximo y el elegido
      var R0 = 74;
      ctx.strokeStyle = ORO + '.9)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(OX, OY, R0, -o.th * Math.PI / 180, 0); ctx.stroke();
      txt('θ', OX + R0 * Math.cos(o.th * Math.PI / 360) + 6, OY - R0 * Math.sin(o.th * Math.PI / 360) + 4, { px: 18, it: true, c: '#8A5A16', a: 1 });
      var am = TMAX * Math.PI / 180, Pm1 = [OX + 300 * Math.cos(am), OY - 300 * Math.sin(am)];
      linea([OX, OY], Pm1, VIOL, .55, .9, [4, 4]);
      txt('70,53°', Pm1[0] + 6, Pm1[1] + 2, { px: 13, it: true, c: '#5B3A8C', a: .9 });
      // trayectorias de los otros ángulos, tenues
      tir.forEach(function (q, k) {
        if (k === sel) return; var pts = []; for (var s = 0; s <= q.tf + 1e-9; s += q.tf / 80) pts.push(Pm.apply(null, pos(q, s)));
        ctx.strokeStyle = TINTA + '.14)'; ctx.lineWidth = .8; ctx.setLineDash([2, 4]); camino(pts); ctx.stroke(); ctx.setLineDash([]);
      });
      // trayectoria elegida: ya recorrida en tinta, el resto punteado; el tramo donde r decrece en violeta
      var pts = [], todo = []; for (var s = 0; s <= o.tf + 1e-9; s += o.tf / 160) { var P = Pm.apply(null, pos(o, s)); todo.push(P); if (s <= t) pts.push(P); }
      ctx.strokeStyle = TINTA + '.3)'; ctx.lineWidth = .8; ctx.setLineDash([2, 4]); camino(todo); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = TINTA + '.85)'; ctx.lineWidth = 1.3; camino(pts); ctx.stroke();
      if (o.t1) {
        var tr = []; for (var s2 = o.t1; s2 <= Math.min(o.t2, o.tf); s2 += .01) tr.push(Pm.apply(null, pos(o, s2)));
        ctx.strokeStyle = VIOL + '.9)'; ctx.lineWidth = 3; camino(tr); ctx.stroke();
        // puntos donde r es máximo y mínimo: v ⟂ r
        [o.t1, o.t2].forEach(function (tk, j) {
          if (tk > o.tf) return; var Q = Pm.apply(null, pos(o, tk));
          ctx.fillStyle = VIOL + '1)'; ctx.beginPath(); ctx.arc(Q[0], Q[1], 3.2, 0, 7); ctx.fill();
          linea([OX, OY], Q, VIOL, .35, .7, [2, 3]);
          txt(j ? 'r mín' : 'r máx', Q[0] + (j ? 10 : -10), Q[1] - 8, { px: 13, it: true, c: '#5B3A8C', a: .95, al: j ? 'left' : 'right', halo: true });
        });
      }
      canon(o.th, 1);
      // bala, r y v, con el ángulo entre ellos
      var B = Pm.apply(null, pos(o, t)), v = vel(o, t), rv = pos(o, t), dot = rv[0] * v[0] + rv[1] * v[1];
      if (t > .05) {
        var rx = B[0] - OX, ry = B[1] - OY, rl = Math.hypot(rx, ry);
        flecha(OX + rx / rl * 30, OY + ry / rl * 30, B[0] - rx / rl * 9, B[1] - ry / rl * 9, TINTA, .9, 1.2, 9);
        txt('r', OX + rx * .55 - ry / rl * 14, OY + ry * .55 + rx / rl * 14 + 5, { px: 20, it: true, c: '#1E1A16', a: 1, al: 'center', halo: true });
        var vx = v[0] * 2.6, vy = -v[1] * 2.6;
        flecha(B[0], B[1], B[0] + vx, B[1] + vy, dot < 0 ? VIOL : VINO, .95, 1.8, 10);
        txt('v', B[0] + vx + 6, B[1] + vy + 4, { px: 20, it: true, c: dot < 0 ? '#5B3A8C' : '#7A2E22', a: 1, halo: true });
        // ángulo entre r (prolongado) y v
        var a0 = Math.atan2(ry, rx), a1 = Math.atan2(vy, vx), da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        linea([B[0] + rx / rl * 10, B[1] + ry / rl * 10], [B[0] + rx / rl * 46, B[1] + ry / rl * 46], TINTA, .35, .7, [2, 3]);
        ctx.strokeStyle = (Math.abs(da) > Math.PI / 2 ? VIOL : ORO) + '.9)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(B[0], B[1], 24, Math.min(a0, a0 + da), Math.max(a0, a0 + da)); ctx.stroke();
        var gd = Math.abs(da) * 180 / Math.PI;
        txt(coma(gd, 0) + '°', B[0] + Math.cos(a0 + da / 2) * 36, B[1] + Math.sin(a0 + da / 2) * 36 + 4, { px: 12, it: true, c: gd > 90 ? '#5B3A8C' : '#8A5A16', a: 1, al: 'center', halo: true });
        if (dot < 0) txt('r · v < 0 : se acerca al cañón', B[0] + 14, B[1] + 34, { px: 14, it: true, c: '#5B3A8C', a: 1, halo: true });
      }
      ctx.drawImage(BALA, B[0] - 7, B[1] - 7, 14, 14);
      txt('O', OX - 16, OY + 34, { px: 16, it: true, c: '#1E1A16', a: .9, al: 'right' });
      graficaQ(o, t, 1);
      ctx.globalAlpha = 1;
      // lectura
      var r = Math.hypot(rv[0], rv[1]), dr = r > 1e-6 ? dot / r : V0;
      salida('θ = ' + coma(o.th, o.th % 1 ? 2 : 0) + '° · t = ' + coma(t, 2) + ' s · r = ' + coma(r, 1) + ' m', 'dr/dt = ' + coma(dr, 2) + ' m/s' + (o.t1 ? ' · r baja de ' + coma(o.t1, 2) + ' a ' + coma(Math.min(o.t2, o.tf), 2) + ' s' : o.D > -1e-3 ? ' · Δ = 0: límite' : ' · r siempre crece'));
      return fin;
    }

    var ecAct = '', reloj = 0;
    if (!op.embebido) new MutationObserver(function () { var on = fig.classList.contains('on'); if (on && !fig.caOn) { T = 0; filas.forEach(function (n) { n.pon(false); }); reloj = 0; } fig.caOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });
    fig.caElige = function (k) { elige(k); auto = false; }; fig.caT2 = function (t) { T = t; };   // para capturas
    var vista = -1;
    function mostrar(a) {   // en modo incrustado, la escena que la contiene decide cuándo se ve
      if (a > 0 && vista <= 0) { elige(SEC[0]); auto = true; reloj = 0; filas.forEach(function (n) { n.pon(false); }); }
      vista = a; var d = a > 0 ? '' : 'none';
      lienzo.style.display = d; barra.style.display = d; capa.style.display = d;
      lienzo.style.opacity = barra.style.opacity = a.toFixed(3);
    }
    return {
      mostrar: mostrar, ocupado: function () { return performance.now() < ocupa; },
      tick: function (dt) {
        if (!fig.classList.contains('on')) return;
        reloj += dt; filas.forEach(function (n) { n.pon(reloj > n.t0); });
        if (!quieto) T += dt; else T = 99;
        dibuja();
        if (auto && T > durTiro(sel)) { var j = SEC.indexOf(sel); if (op.embebido) { if (j >= 0 && j < SEC.length - 1) elige(SEC[j + 1]); } else elige((sel + 1) % ANG.length); }
        var e = 'θ<sub>máx</sub> = arcsen(√8 / 3) ≈ 70,53°';
        if (ec && e !== ecAct) { ecAct = e; ec.innerHTML = e; }
      }
    };
  };
})();
