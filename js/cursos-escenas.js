// Menú de Cursos: tres escenas isométricas con física real que cambian según el curso elegido.
//  I   Relatividad — embudo de Flamm (geometría espacial de Schwarzschild) con una órbita
//      integrada de u'' + u = M/h² + 3Mu²; la precesión del perihelio se mide en vivo.
//  II  Mecánica cuántica — aparato de Stern–Gerlach: átomos de plata con velocidades del haz
//      efusivo (f ∝ v³e^{−v²/v₀²}), desviación ±K(y)/v², impactos que forman los dos "labios".
//  III Problemas — imán de barra con limaduras (modelo de dos polos), una brújula que sigue
//      el campo y un péndulo de amplitud grande integrado con RK4 (T/T₀ medido).
(function () {
  var raiz = document.querySelector('[data-cursos-menu]');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C30 = 0.8660254, S30 = 0.5;
  function f(v) { return Math.round(v * 10) / 10; }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; }
  function camara(ox, oy, s) { return function (x, y, z) { return [ox + (x - y) * C30 * s, oy + (x + y) * S30 * s - (z || 0) * s]; }; }
  function pts(a) { return a.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }
  function poly(g, a, cls) { return el('polygon', { points: pts(a), 'class': cls }, g); }
  function linea(g, a, b, cls) { return el('line', { x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]), 'class': cls }, g); }
  function ruta(g, a, cls) { return el('path', { d: 'M' + a.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L'), 'class': cls }, g); }

  // caja sólida: se ven la tapa y las caras que miran a +x (costado) y +y (frente)
  function caja(g, P, x, y, z, w, d, h, tono) {
    var t = 's ' + (tono || 'mid');
    var q = el('g', { 'class': t }, g);
    poly(q, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'fr');
    poly(q, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], 'sd');
    poly(q, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'tp');
    return q;
  }
  // cilindro vertical (eje z)
  function cilindro(g, P, s, x, y, z, r, h, tono) {
    var q = el('g', { 'class': 's ' + (tono || 'mid') }, g), a = P(x, y, z), b = P(x, y, z + h), rx = r * 1.2247 * s, ry = r * 0.7071 * s;
    el('path', { 'class': 'fr', d: 'M' + f(b[0] - rx) + ' ' + f(b[1]) + ' L' + f(a[0] - rx) + ' ' + f(a[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(a[0]) + ' ' + f(a[1] + ry) + ' L' + f(b[0]) + ' ' + f(b[1] + ry) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(b[0] - rx) + ' ' + f(b[1]) + 'Z' }, q);
    el('path', { 'class': 'sd', d: 'M' + f(b[0]) + ' ' + f(b[1] + ry) + ' L' + f(a[0]) + ' ' + f(a[1] + ry) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(a[0] + rx) + ' ' + f(a[1]) + ' L' + f(b[0] + rx) + ' ' + f(b[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(b[0]) + ' ' + f(b[1] + ry) + 'Z' }, q);
    el('ellipse', { 'class': 'tp', cx: f(b[0]), cy: f(b[1]), rx: f(rx), ry: f(ry) }, q);
    return q;
  }
  function tornillo(g, p) { el('circle', { 'class': 'tornillo', cx: f(p[0]), cy: f(p[1]), r: 2.2 }, g); linea(g, [p[0] - 1.4, p[1] - .6], [p[0] + 1.4, p[1] + .6], 'ranura'); }
  // regla grabada a lo largo del borde frontal (y = y0) de una losa, en la cara frontal
  function regla(g, P, x0, x1, y0, z, paso, cada) {
    for (var x = x0, i = 0; x <= x1 + 1e-6; x += paso, i++) {
      var mayor = i % cada === 0;
      linea(g, P(x, y0, z), P(x, y0, z - (mayor ? 2.2 : 1.2)), mayor ? 'tick-may' : 'tick');
    }
  }
  // placa grabada sobre una tapa: tres renglones de "texto" y un rótulo
  function placa(g, P, x, y, z, w, d, rotulo) {
    caja(g, P, x, y, z, w, d, .5, 'hi');
    var c = P(x + w / 2, y + d / 2, z + .5);
    var t = el('text', { 'class': 'grabado', x: f(c[0]), y: f(c[1] + 3) }, g); t.textContent = rotulo;
    [[x + 1.2, y + 1.2], [x + w - 1.2, y + 1.2], [x + 1.2, y + d - 1.2], [x + w - 1.2, y + d - 1.2]].forEach(function (q) { el('circle', { 'class': 'tornillo', cx: f(P(q[0], q[1], z + .5)[0]), cy: f(P(q[0], q[1], z + .5)[1]), r: 1.3 }, g); });
  }
  function sombra(g, P, s, x, y, rx, ry) { var c = P(x, y, 0); el('ellipse', { 'class': 'halo', cx: f(c[0]), cy: f(c[1]), rx: f(rx * s * 1.2247), ry: f(ry * s * .7071) }, g); }

  // ═════════ I · Relatividad: embudo de Flamm y órbita de Schwarzschild ═════════
  function escenaRelatividad(svg, salida) {
    var s = 6.2, P = camara(1000, 395, s), g = el('g', {}, svg);
    var M = 1, RS = 2 * M, RMAX = 30, EXAG = 2.4;
    function hond(r) { return EXAG * (2 * Math.sqrt(RS * (Math.max(r, RS) - RS)) - 2 * Math.sqrt(RS * (RMAX - RS))); } // z(r) del paraboloide de Flamm, con el borde en 0
    var Z0 = -50;
    sombra(g, P, s, 0, 0, 52, 52);
    // zócalo, regla y placa
    caja(g, P, -40, -40, Z0 - 6, 80, 80, 6, 'lo');
    caja(g, P, -38, -38, Z0, 76, 76, 2.4, 'mid');
    regla(g, P, -36, 36, 40, Z0 - 1, 2, 5);
    [[-37, -37], [37, -37], [-37, 37], [37, 37]].forEach(function (q) { tornillo(g, P(q[0], q[1], Z0 + 2.4)); });
    placa(g, P, 14, 24, Z0 + 2.4, 20, 9, 'FLAMM · rₛ = 2GM/c²');
    // patas traseras (detrás del embudo)
    var PATAS = [[-27, 0], [0, -27], [27, 0], [0, 27]];
    function pata(q) {
      cilindro(g, P, s, q[0], q[1], Z0 + 2.4, 1.6, 2, 'lo');
      cilindro(g, P, s, q[0], q[1], Z0 + 4.4, 1, -Z0 - 4.4, 'mid');
      cilindro(g, P, s, q[0], q[1], -6, 1.7, 3, 'lo');                    // abrazadera
      for (var k = 0; k < 5; k++) { var a = P(q[0] - 1.2, q[1] + 1, -5.6 + k * .55), b = P(q[0] + 1.2, q[1] + 1, -5.6 + k * .55); linea(g, a, b, 'moleteado'); }
    }
    pata(PATAS[0]); pata(PATAS[1]);
    // la superficie: anillos y meridianos
    var sup = el('g', { 'class': 'malla' }, g);
    var RADIOS = []; for (var r = RS; r <= RMAX + 1e-6; r += (r < 6 ? .5 : r < 14 ? 1 : 2)) RADIOS.push(r);
    RADIOS.forEach(function (r) {
      var a = [], z = hond(r); for (var k = 0; k <= 72; k++) { var ph = k / 72 * Math.PI * 2; a.push(P(r * Math.cos(ph), r * Math.sin(ph), z)); }
      ruta(sup, a, r === RS ? 'horizonte' : (Math.round(r) % 6 === 0 ? 'anillo-may' : 'anillo'));
    });
    for (var m = 0; m < 24; m++) {
      var ph = m / 24 * Math.PI * 2, a2 = [];
      for (var r2 = RS; r2 <= RMAX + 1e-6; r2 += .5) a2.push(P(r2 * Math.cos(ph), r2 * Math.sin(ph), hond(r2)));
      ruta(sup, a2, 'meridiano');
    }
    // aro del borde con tornillos de tensión
    var aro = []; for (var k2 = 0; k2 <= 96; k2++) { var p2 = k2 / 96 * Math.PI * 2; aro.push(P(RMAX * Math.cos(p2), RMAX * Math.sin(p2), 0)); }
    ruta(g, aro, 'aro');
    for (var k3 = 0; k3 < 16; k3++) { var p3 = k3 / 16 * Math.PI * 2; el('circle', { 'class': 'tornillo', cx: f(P(RMAX * Math.cos(p3), RMAX * Math.sin(p3), 0)[0]), cy: f(P(RMAX * Math.cos(p3), RMAX * Math.sin(p3), 0)[1]), r: 1.6 }, g); }
    // rótulo del horizonte
    // órbita: estela y cuerpo
    var estela = el('path', { 'class': 'estela' }, g), cuerpo = el('g', {}, g);
    el('circle', { 'class': 'cuerpo', r: 5.5 }, cuerpo); el('circle', { 'class': 'cuerpo-brillo', r: 1.8, cx: -1.6, cy: -1.8 }, cuerpo);
    pata(PATAS[2]); pata(PATAS[3]);
    // integración: u = 1/r, d²u/dφ² = M/h² − u + 3Mu²
    var p = 20, e = .5, h2 = p * M, h = Math.sqrt(h2);
    var u = (1 + e) / p, du = 0, phi = 0, hist = [], ultPeri = null, prec = null, dPrev = 0;
    function acel(uu) { return M / h2 - uu + 3 * M * uu * uu; }
    function paso(dphi) {
      var k1u = du, k1v = acel(u);
      var k2u = du + .5 * dphi * k1v, k2v = acel(u + .5 * dphi * k1u);
      var k3u = du + .5 * dphi * k2v, k3v = acel(u + .5 * dphi * k2u);
      var k4u = du + dphi * k3v, k4v = acel(u + dphi * k3u);
      var nu = u + dphi / 6 * (k1u + 2 * k2u + 2 * k3u + k4u), ndu = du + dphi / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
      if (dPrev > 0 && ndu <= 0) { if (ultPeri !== null) prec = (phi - ultPeri) - 2 * Math.PI; ultPeri = phi; }   // máximo de u = perihelio
      dPrev = ndu; u = nu; du = ndu; phi += dphi;
    }
    return {
      tick: function (dt) {
        var n = 6, dphi = Math.min(.06, h * u * u * dt * 40) / n;
        for (var i = 0; i < n; i++) paso(dphi);
        var r = 1 / u, x = r * Math.cos(phi), y = r * Math.sin(phi), q = P(x, y, hond(r));
        hist.push(q); if (hist.length > 700) hist.shift();
        estela.setAttribute('d', 'M' + hist.map(function (c) { return f(c[0]) + ' ' + f(c[1]); }).join(' L'));
        cuerpo.setAttribute('transform', 'translate(' + f(q[0]) + ' ' + f(q[1] - 5) + ')');
        salida('r = ' + r.toFixed(1).replace('.', ',') + ' GM/c²', prec === null ? 'Δφ por vuelta: midiendo…' : 'Δφ por vuelta = ' + (prec * 180 / Math.PI).toFixed(1).replace('.', ',') + '° (Newton: 0°)');
      }
    };
  }

  // ═════════ II · Mecánica cuántica: Stern–Gerlach ═════════
  function escenaSternGerlach(svg, salida) {
    var s = 4.7, P = camara(960, 470, s), g = el('g', {}, svg), ZB = 16, orden = 0;
    // cada pieza entra desde abajo (+) o desde arriba (−) cada vez que se muestra la escena
    function pieza(dy) { return el('g', { 'class': 'pieza', style: '--dy:' + dy + 'px;--d:' + (120 + orden++ * 45) + 'ms' }, g); }
    function arrollamiento(q, x0, x1, y, z0, z1, n) { for (var k = 1; k < n; k++) { var z = z0 + (z1 - z0) * k / n; linea(q, P(x0, y, z), P(x1, y, z), 'espira'); } }

    // ── banco óptico
    var b0 = pieza(120);
    sombra(b0, P, s, 10, 0, 110, 46);
    [[-80, -28], [94, -28], [-80, 28], [94, 28]].forEach(function (q) { caja(b0, P, q[0] - 3, q[1] - 3, -12, 6, 6, 4, 'lo'); });
    caja(b0, P, -86, -30, -8, 186, 60, 5, 'lo');
    caja(b0, P, -84, -26, -3, 182, 52, 3, 'mid');
    regla(b0, P, -80, 94, 26, -1.5, 2, 5);
    linea(b0, P(-84, 0, 0), P(98, 0, 0), 'eje-optico');
    [[-82, -24], [96, -24], [-82, 24], [96, 24]].forEach(function (q) { tornillo(b0, P(q[0], q[1], 0)); });

    // ── horno de plata: crisol cilíndrico, resistencia en espiral, tapa y boquilla
    var h0 = pieza(-160);
    caja(h0, P, -82, -12, 0, 22, 24, 3, 'lo');
    cilindro(h0, P, s, -71, 0, 3, 9, 24, 'mid');
    for (var j = 0; j < 9; j++) {
      var zc = 6 + j * 2.3, c = P(-71, 0, zc), rx = 9 * 1.2247 * s, ry = 9 * .7071 * s;
      el('path', { 'class': 'resistencia', d: 'M' + f(c[0] - rx) + ' ' + f(c[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(c[0] + rx) + ' ' + f(c[1] - 1.2) }, h0);
    }
    cilindro(h0, P, s, -71, 0, 27, 10, 2.4, 'lo');
    cilindro(h0, P, s, -71, 0, 29.4, 3, 3, 'mid');
    caja(h0, P, -63, -2.5, ZB - 2.5, 5, 5, 5, 'lo');
    var boca = P(-58, 0, ZB); el('ellipse', { 'class': 'brasa', cx: f(boca[0]), cy: f(boca[1]), rx: 2.6, ry: 3.6 }, h0);
    var rotAg = P(-71, 9, 15); var tAg = el('text', { 'class': 'grabado grande', x: f(rotAg[0]), y: f(rotAg[1]) }, h0); tAg.textContent = 'Ag';

    // capas de vuelo: cada tramo del haz se pinta detrás de lo que tiene delante
    var vuelo = [], tramos = [-46, -36, -12, 32, 999];
    function capa() { var q = el('g', { 'class': 'vuelo' }, g); vuelo.push(q); return q; }
    capa();                                   // horno → 1.ª rendija

    // ── colimadores: placa, ranura horizontal, marco y pie
    function rendija(x) {
      var q = pieza(-150); rendijas.push(q);
      caja(q, P, x - 3, -9, 0, 7, 18, 2, 'lo');
      caja(q, P, x, -13, 2, 1.8, 26, 26, 'hi');
      poly(q, [P(x + 1.8, -8, ZB - .7), P(x + 1.8, 8, ZB - .7), P(x + 1.8, 8, ZB + .7), P(x + 1.8, -8, ZB + .7)], 'hueco');
      linea(q, P(x + 1.8, -8.6, ZB + 1.6), P(x + 1.8, 8.6, ZB + 1.6), 'guia'); linea(q, P(x + 1.8, -8.6, ZB - 1.6), P(x + 1.8, 8.6, ZB - 1.6), 'guia');
      [[-11, 25], [11, 25], [-11, 5], [11, 5]].forEach(function (t) { var p = P(x + 1.8, t[0], t[1]); el('circle', { 'class': 'tornillo', cx: f(p[0]), cy: f(p[1]), r: 1.2 }, q); });
    }
    var rendijas = [];
    rendija(-46); capa(); rendija(-36); capa();

    // ── electroimán: columna con bobina, brazos, polo inferior acanalado y polo superior en filo
    var m0 = pieza(150);
    caja(m0, P, -12, -26, 0, 44, 6, 46, 'lo');
    caja(m0, P, -12, -20, 0, 44, 30, 5, 'lo');
    var m1 = pieza(-160);
    caja(m1, P, -14, -28, 13, 48, 10, 16, 'cobre');
    arrollamiento(m1, -14, 34, -18, 13, 29, 9);
    for (var k = 1; k < 5; k++) { var yy = -28 + k * 2; linea(m1, P(34, yy, 13), P(34, yy, 29), 'espira'); }
    var m2 = pieza(130);
    caja(m2, P, -12, -10, 5, 44, 20, 7, 'mid');
    poly(m2, [P(-12, -1.3, 12), P(32, -1.3, 12), P(32, 1.3, 12), P(-12, 1.3, 12)], 'hueco');
    poly(m2, [P(32, -1.3, 12), P(32, 1.3, 12), P(32, 0, 10.2)], 'hueco');
    [[-8, -7], [28, -7], [-8, 7], [28, 7]].forEach(function (t) { tornillo(m2, P(t[0], t[1], 12)); });
    capa();                                   // dentro del imán
    var m3 = pieza(-180);
    var cu = el('g', { 'class': 's mid' }, m3);
    poly(cu, [P(-12, 10, 26), P(32, 10, 26), P(32, 0, 19), P(-12, 0, 19)], 'fr');
    poly(cu, [P(32, -10, 26), P(32, 10, 26), P(32, 0, 19)], 'sd');
    linea(m3, P(-12, 0, 19), P(32, 0, 19), 'arista');
    caja(m3, P, -12, -10, 26, 44, 20, 8, 'mid');
    caja(m3, P, -12, -20, 34, 44, 30, 6, 'lo');
    for (var w = 0; w < 6; w++) tornillo(m3, P(-8 + w * 7.6, 6, 40));
    var rN = P(10, 10, 30), tN = el('text', { 'class': 'grabado', x: f(rN[0]), y: f(rN[1]) }, m3); tN.textContent = '∂B/∂z';

    // ── placa y pantalla de vidrio con marco
    var p0 = pieza(110);
    placa(p0, P, 40, 13, 0, 28, 10, 'Ag · 1922 · T ≈ 1300 K');
    capa();                                   // imán → pantalla
    var pa = pieza(-170);
    caja(pa, P, 76, -24, 0, 8, 6, 2.5, 'lo'); caja(pa, P, 76, 18, 0, 8, 6, 2.5, 'lo');
    caja(pa, P, 79, -22, 2.5, 2, 2, 34, 'lo');
    var pantalla = el('g', { 'class': 's vidrio' }, pa);
    poly(pantalla, [P(80, -20, 3), P(80, 20, 3), P(80, 20, 35), P(80, -20, 35)], 'tp');
    var impactos = el('g', {}, pa);
    ruta(pa, [P(80, -9, ZB), P(80, 9, ZB)], 'clasico');
    var rc = P(80, 12, ZB + 1.5), tc = el('text', { 'class': 'grabado', x: f(rc[0]), y: f(rc[1]) }, pa); tc.textContent = 'clásico';
    caja(pa, P, 79, 20, 2.5, 2, 2, 34, 'lo');
    caja(pa, P, 79, -22, 35, 2, 44, 2, 'lo');

    // notas: al pasar el mouse por una pieza, una línea guía sube hasta una explicación corta en gris
    var capaNotas = el('g', { 'class': 'notas' }, g);
    function nota(piezas, ancla, titulo, l1, l2, cima) {
      var a = P(ancla[0], ancla[1], ancla[2]), alto = 64 + (a[1] > 520 ? 40 : 0), izq = a[0] > 1150, dx = izq ? -22 : 22;
      var top = cima || Math.max(118, a[1] - alto), n = el('g', { 'class': 'nota' }, capaNotas);
      el('circle', { cx: f(a[0]), cy: f(a[1]), r: 2.2 }, n);
      el('circle', { 'class': 'anillo-nota', cx: f(a[0]), cy: f(a[1]), r: 5 }, n);
      el('path', { d: 'M' + f(a[0]) + ' ' + f(a[1] - 4) + ' L' + f(a[0]) + ' ' + f(top) + ' L' + f(a[0] + dx) + ' ' + f(top), pathLength: 1 }, n);
      var tx = a[0] + dx + (izq ? -6 : 6), anc = izq ? 'end' : 'start';
      var ancho = Math.max(l1.length, l2.length) * 6.4 + 20;
      el('rect', { 'class': 'nota-fondo', x: f(izq ? tx - ancho + 10 : tx - 10), y: f(top - 11), width: f(ancho), height: 52, rx: 2 }, n);
      var t = el('text', { 'class': 'nota-t', x: f(tx), y: f(top + 3), 'text-anchor': anc }, n); t.textContent = titulo;
      var d = el('text', { 'class': 'nota-d', x: f(tx), y: f(top + 19), 'text-anchor': anc }, n);
      [l1, l2].forEach(function (l, k) { var sp = el('tspan', { x: f(tx), dy: k ? 15 : 0 }, d); sp.textContent = l; });
      piezas.forEach(function (q) {
        q.classList.add('con-nota');
        q.addEventListener('pointerenter', function () { n.classList.add('ver'); piezas.forEach(function (o) { o.classList.add('foco'); }); svg.classList.add('nota-on'); });
        q.addEventListener('pointerleave', function () { n.classList.remove('ver'); piezas.forEach(function (o) { o.classList.remove('foco'); }); svg.classList.remove('nota-on'); });
      });
    }
    nota([b0], [-62, 22, 0], 'Banco óptico', 'Alinea horno, rendijas, imán y pantalla', 'sobre un mismo eje; en el real, en vacío.');
    nota([h0], [-71, 0, 32.4], 'Horno de plata', 'Evapora plata a ≈ 1300 K: sale un haz', 'de átomos neutros con velocidades térmicas.');
    nota([rendijas[0], rendijas[1]], [-35.1, -13, 28], 'Colimadores', 'Dos rendijas recortan el haz', 'hasta dejarlo como una lámina delgada.');
    nota([m0, m1], [10, -23, 46], 'Electroimán', 'La bobina magnetiza el yugo de hierro;', 'el campo se concentra entre los polos.', 150);
    nota([m2, m3], [32, 5, 22.5], 'Polos asimétricos', 'Filo arriba, canal abajo: B no uniforme.', 'F = μz ∂B/∂z empuja según el espín.', 175);
    nota([p0], [54, 18, .5], 'Fráncfort, 1922', 'Otto Stern y Walther Gerlach: primera', 'prueba de la cuantización espacial.');
    nota([pa], [80, -21, 37], 'Placa colectora', 'Clásicamente: una sola banda continua.', 'Se ven dos manchas: espín ±ħ/2.', 300);

    // física: f(v) ∝ v³ e^{−v²/v₀²} → w = v²/v₀² ~ Gamma(2,1); Δz = ±K(y)/w
    // espín: antes del imán, superposición (la flecha "titila"); al entrar al gradiente queda ↑ o ↓
    var K = 11, enVuelo = [], arriba = 0, abajo = 0, acum = 0;
    function lanzar() {
      var w2 = -Math.log(Math.random() * Math.random() + 1e-9), y0 = (Math.random() * 2 - 1) * 8;
      var sgn = Math.random() < .5 ? 1 : -1;
      var dz = sgn * K * (1 - (y0 / 9.5) * (y0 / 9.5)) / Math.max(w2, .7);
      var a = el('g', { 'class': 'atomo' }, vuelo[0]);
      el('circle', { 'class': 'atomo-b', r: 2.1 }, a);
      var fl = el('path', { 'class': 'espin', d: 'M0 1.4 L0 -6.5 M-1.7 -4.4 L0 -6.6 L1.7 -4.4' }, a);
      var fl2 = el('path', { 'class': 'espin fantasma', d: 'M0 -1.4 L0 6.5 M-1.7 4.4 L0 6.6 L1.7 4.4' }, a);
      enVuelo.push({ x: -58, y: y0, v: Math.sqrt(w2), dz: dz, sgn: sgn, el: a, fl: fl, fl2: fl2, tramo: 0, def: false });
    }
    function zEn(a, x) {   // parabólica dentro del imán (−12…32), recta después
      if (x <= -12) return ZB;
      var L = 44, t = Math.min(x + 12, L) / L, zm = a.dz * .32 * t * t;
      if (x <= 32) return ZB + zm;
      return ZB + a.dz * .32 + (2 * .32 * a.dz / L) * (x - 32);
    }
    return {
      tick: function (dt) {
        acum += dt; while (acum > .035) { acum -= .035; lanzar(); }
        for (var i = enVuelo.length - 1; i >= 0; i--) {
          var a = enVuelo[i]; a.x += a.v * 62 * dt;
          if (a.x >= 80) {
            var z = ZB + a.dz, q = P(80, a.y, z);
            if (z > 4 && z < 34) el('circle', { 'class': 'impacto ' + (a.sgn > 0 ? 'imp-arriba' : 'imp-abajo'), cx: f(q[0]), cy: f(q[1]), r: 1.15 }, impactos);
            if (impactos.childNodes.length > 1400) impactos.removeChild(impactos.firstChild);
            if (a.sgn > 0) arriba++; else abajo++;
            a.el.parentNode.removeChild(a.el); enVuelo.splice(i, 1); continue;
          }
          while (a.x > tramos[a.tramo]) { a.tramo++; vuelo[a.tramo].appendChild(a.el); }
          var q2 = P(a.x, a.y, zEn(a, a.x)), jx = 0, jy = 0;
          if (a.x < -12) {                       // superposición: la flecha salta entre ↑ y ↓ y vibra
            var ang = (Math.random() < .5 ? 0 : 180) + (Math.random() - .5) * 70;
            a.fl.setAttribute('transform', 'rotate(' + f(ang) + ')');
            a.fl.setAttribute('opacity', f(.45 + Math.random() * .55));
            a.fl2.setAttribute('opacity', f(Math.random() * .5));
            jx = (Math.random() - .5) * 1.4; jy = (Math.random() - .5) * 1.4;
          } else if (!a.def) {                   // el gradiente "mide": queda definido
            a.def = true; a.fl.removeAttribute('transform'); a.fl.setAttribute('opacity', 1);
            a.fl2.parentNode.removeChild(a.fl2);
            a.el.setAttribute('class', 'atomo ' + (a.sgn > 0 ? 'arriba' : 'abajo'));
            if (a.sgn < 0) a.fl.setAttribute('transform', 'rotate(180)');
          }
          a.el.setAttribute('transform', 'translate(' + f(q2[0] + jx) + ' ' + f(q2[1] + jy) + ')');
        }
        var n = arriba + abajo;
        salida('N↑ = ' + arriba + '   N↓ = ' + abajo, n ? 'P(↑) = ' + (arriba / n).toFixed(2).replace('.', ',') + ' · dos manchas, no una banda' : 'esperando átomos…');
      }
    };
  }

  // ═════════ III · Problemas: imán, limaduras, brújula y péndulo ═════════
  function escenaProblemas(svg, salida) {
    var s = 4.7, P = camara(990, 480, s), g = el('g', {}, svg);
    sombra(g, P, s, 0, 0, 100, 60);
    caja(g, P, -90, -50, -6, 180, 100, 6, 'lo');
    regla(g, P, -86, 86, 50, -1, 2, 5);
    [[-87, -47], [87, -47], [-87, 47], [87, 47]].forEach(function (q) { tornillo(g, P(q[0], q[1], 0)); });
    // péndulo (atrás a la derecha): soporte en L
    var PX = 52, PY = -38, PZ = 62, L = 44;
    caja(g, P, PX - 6, PY - 6, 0, 12, 12, 3, 'mid');
    cilindro(g, P, s, PX, PY, 3, 1.4, PZ - 3, 'mid');
    caja(g, P, PX - 1.5, PY - 1.5, PZ - 2, 3, 3, 3, 'lo');
    caja(g, P, PX - 1, PY + 1.5, PZ - 1, 2, 14, 2, 'mid');
    var piv = [PX, PY + 14, PZ], cuerda = el('line', { 'class': 'cuerda' }, g), bola = el('circle', { 'class': 'bola', r: 4.4 }, g);
    var arco = []; for (var a0 = -50; a0 <= 50; a0 += 5) { var aa = a0 * Math.PI / 180; arco.push(P(piv[0] + Math.sin(aa) * (L + 6), piv[1], piv[2] - Math.cos(aa) * (L + 6))); }
    ruta(g, arco, 'transportador');
    // hoja de papel con limaduras alrededor del imán (modelo de dos polos ±q en los extremos)
    var hoja = [P(-78, -40, 0), P(40, -40, 0), P(40, 44, 0), P(-78, 44, 0)];
    poly(g, hoja, 'papel');
    var N = [-16, 2], S = [-48, 2];
    function B(x, y) {
      var dx1 = x - N[0], dy1 = y - N[1], r1 = Math.pow(dx1 * dx1 + dy1 * dy1, 1.5) + 1e-6;
      var dx2 = x - S[0], dy2 = y - S[1], r2 = Math.pow(dx2 * dx2 + dy2 * dy2, 1.5) + 1e-6;
      return [dx1 / r1 - dx2 / r2, dy1 / r1 - dy2 / r2];
    }
    var lim = el('g', { 'class': 'limaduras' }, g), sem = 7;
    function rnd() { sem = (sem * 16807) % 2147483647; return sem / 2147483647; }
    for (var i = 0; i < 1500; i++) {
      var x = -76 + rnd() * 114, y = -38 + rnd() * 80;
      if (x > -52 && x < -12 && y > -5 && y < 9) continue;
      var b = B(x, y), m = Math.hypot(b[0], b[1]); if (!m) continue;
      var lg = 1.3, ux = b[0] / m * lg, uy = b[1] / m * lg, op = Math.min(1, Math.pow(m * 900, .45));
      if (op < .12) continue;
      linea(lim, P(x - ux, y - uy, .2), P(x + ux, y + uy, .2), 'lima').setAttribute('opacity', op.toFixed(2));
    }
    // imán de barra: mitad N (roja) y S (tinta)
    caja(g, P, -50, -3, 0, 18, 10, 6, 'tinta');
    caja(g, P, -32, -3, 0, 18, 10, 6, 'rojo');
    var tn = P(-23, 2, 6), ts = P(-41, 2, 6);
    var t1 = el('text', { 'class': 'polo', x: f(tn[0]), y: f(tn[1] + 3) }, g); t1.textContent = 'N';
    var t2 = el('text', { 'class': 'polo polo-s', x: f(ts[0]), y: f(ts[1] + 3) }, g); t2.textContent = 'S';
    // brújula que recorre un óvalo alrededor del imán
    var brujula = el('g', {}, g), caja2 = el('ellipse', { 'class': 'brujula', rx: 13, ry: 7.5 }, brujula), aguja = el('g', {}, brujula);
    var agR = el('line', { 'class': 'aguja-n' }, aguja), agS = el('line', { 'class': 'aguja-s' }, aguja); el('circle', { 'class': 'eje', r: 1 }, brujula);
    placa(g, P, 54, 22, 0, 26, 12, 'g = 9,81 m/s² · ℓ = 0,44 m');
    // péndulo: θ'' = −(g/ℓ) sin θ, θ₀ = 50°, integrado con RK4
    var gL = 9.81 / .44, th = 50 * Math.PI / 180, w = 0, t = 0, cruces = [], prevTh = th, T = null;
    var T0 = 2 * Math.PI / Math.sqrt(gL), cb = 0;
    function rk(dt) {
      function a(x) { return -gL * Math.sin(x); }
      var k1x = w, k1v = a(th), k2x = w + .5 * dt * k1v, k2v = a(th + .5 * dt * k1x), k3x = w + .5 * dt * k2v, k3v = a(th + .5 * dt * k2x), k4x = w + dt * k3v, k4v = a(th + dt * k3x);
      th += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); w += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); t += dt;
      if (prevTh > 0 && th <= 0) { cruces.push(t); if (cruces.length > 2) { T = cruces[cruces.length - 1] - cruces[cruces.length - 2]; cruces.shift(); } }
      prevTh = th;
    }
    return {
      tick: function (dt) {
        var n = 8; for (var i = 0; i < n; i++) rk(dt * .55 / n);
        var bx = piv[0] + Math.sin(th) * L, bz = piv[2] - Math.cos(th) * L, pb = P(bx, piv[1], bz), pp = P(piv[0], piv[1], piv[2]);
        cuerda.setAttribute('x1', f(pp[0])); cuerda.setAttribute('y1', f(pp[1])); cuerda.setAttribute('x2', f(pb[0])); cuerda.setAttribute('y2', f(pb[1]));
        bola.setAttribute('cx', f(pb[0])); bola.setAttribute('cy', f(pb[1]));
        cb += dt * .16;
        var cx = -32 + Math.cos(cb) * 34, cy = 2 + Math.sin(cb) * 26, c = P(cx, cy, 1.2), bb = B(cx, cy), mm = Math.hypot(bb[0], bb[1]) || 1;
        var e1 = P(cx + bb[0] / mm * 7, cy + bb[1] / mm * 7, 1.2), e2 = P(cx - bb[0] / mm * 7, cy - bb[1] / mm * 7, 1.2);
        brujula.setAttribute('transform', 'translate(' + f(c[0]) + ' ' + f(c[1]) + ')');
        agR.setAttribute('x1', 0); agR.setAttribute('y1', 0); agR.setAttribute('x2', f(e1[0] - c[0])); agR.setAttribute('y2', f(e1[1] - c[1]));
        agS.setAttribute('x1', 0); agS.setAttribute('y1', 0); agS.setAttribute('x2', f(e2[0] - c[0])); agS.setAttribute('y2', f(e2[1] - c[1]));
        salida('θ = ' + (th * 180 / Math.PI).toFixed(0) + '°', T ? 'T/T₀ = ' + (T / T0).toFixed(3).replace('.', ',') + ' con θ₀ = 50° (lineal: 1)' : 'midiendo el período…');
      }
    };
  }

  // ═════════ menú ═════════
  var escenas = Array.prototype.slice.call(raiz.querySelectorAll('.mc-escena'));
  var items = Array.prototype.slice.call(raiz.querySelectorAll('.mc-item'));
  var lect1 = raiz.querySelector('[data-lect="1"]'), lect2 = raiz.querySelector('[data-lect="2"]');
  var activo = 0;
  function salida(i) { return function (a, b) { if (i === activo) { lect1.textContent = a; lect2.textContent = b; } }; }
  var mods = [escenaRelatividad, escenaSternGerlach, escenaProblemas].map(function (fn, i) { return fn(escenas[i].querySelector('svg'), salida(i)); });
  var tArmado = null;
  function armar(e) {          // se rearma cada vez que se entra a la escena
    clearTimeout(tArmado);
    e.classList.remove('armado'); e.classList.add('armando'); void e.getBoundingClientRect();
    requestAnimationFrame(function () { requestAnimationFrame(function () { e.classList.remove('armando'); e.classList.add('armado'); tArmado = setTimeout(function () { e.classList.remove('armado'); }, 1700); }); });
  }
  function elegir(i) {
    var previo = activo; activo = i;
    items.forEach(function (it, k) { it.classList.toggle('on', k === i); it.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    escenas.forEach(function (e, k) { e.classList.toggle('on', k === i); });
    var e = escenas[i];
    if (i !== previo && !quieto && e.querySelector('.pieza')) armar(e);
    raiz.setAttribute('data-activo', i);
    mods[i].tick(1 / 60);
  }
  items.forEach(function (it, i) {
    it.addEventListener('pointerenter', function () { elegir(i); });
    it.addEventListener('focus', function () { elegir(i); });
  });
  raiz.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault(); var n = (activo + (ev.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
      items[n].querySelector('a').focus();
    }
  });
  elegir(0);
  if (quieto) { for (var w = 0; w < 3; w++) for (var k = 0; k < 400; k++) mods[w].tick(1 / 60); elegir(0); return; }
  // precalienta cada escena para que no empiece vacía
  for (var w2 = 0; w2 < 3; w2++) for (var k2 = 0; k2 < (w2 === 2 ? 900 : 1600); k2++) mods[w2].tick(1 / 60);
  var visible = true, ult = 0;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(raiz);
  function bucle(t) {
    requestAnimationFrame(bucle);
    var dt = ult ? Math.min(.05, (t - ult) / 1000) : 1 / 60; ult = t;
    if (!visible || document.hidden) return;
    mods[activo].tick(dt);
  }
  requestAnimationFrame(bucle);
})();
