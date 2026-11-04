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
    var e = Math.min(.45, w * .12, d * .12);   // bisel: un filo de luz en las aristas superiores
    if (e > .08) { linea(q, P(x + e, y + d - e, z + h), P(x + w - e, y + d - e, z + h), 'bisel'); linea(q, P(x + w - e, y + e, z + h), P(x + w - e, y + d - e, z + h), 'bisel'); }
    return q;
  }
  // cilindro vertical (eje z)
  function cilindro(g, P, s, x, y, z, r, h, tono) {
    var q = el('g', { 'class': 's ' + (tono || 'mid') }, g), a = P(x, y, z), b = P(x, y, z + h), rx = r * 1.2247 * s, ry = r * 0.7071 * s;
    el('path', { 'class': 'fr', d: 'M' + f(b[0] - rx) + ' ' + f(b[1]) + ' L' + f(a[0] - rx) + ' ' + f(a[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(a[0]) + ' ' + f(a[1] + ry) + ' L' + f(b[0]) + ' ' + f(b[1] + ry) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(b[0] - rx) + ' ' + f(b[1]) + 'Z' }, q);
    el('path', { 'class': 'sd', d: 'M' + f(b[0]) + ' ' + f(b[1] + ry) + ' L' + f(a[0]) + ' ' + f(a[1] + ry) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(a[0] + rx) + ' ' + f(a[1]) + ' L' + f(b[0] + rx) + ' ' + f(b[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(b[0]) + ' ' + f(b[1] + ry) + 'Z' }, q);
    if (h * s > 6) linea(q, [b[0] - rx * .45, b[1] + ry * .893], [a[0] - rx * .45, a[1] + ry * .893], 'brillo-cil');
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
    var t = el('text', { 'class': 'grabado', x: 0, y: 0, transform: 'matrix(.866 .5 -.866 .5 ' + f(c[0]) + ' ' + f(c[1]) + ')' }, g); t.textContent = rotulo;   // grabado en el plano de la tapa
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
    for (var v = 0; v < 5; v++) { var vt = []; for (var xv = -86; xv <= 100; xv += 3) vt.push(P(xv, 30, -7.2 + v * .9 + .28 * Math.sin(xv * .09 + v * 1.7) + .15 * Math.sin(xv * .31 + v))); ruta(b0, vt, 'veta'); }
    caja(b0, P, -84, -26, -3, 182, 52, 3, 'mid');
    regla(b0, P, -80, 94, 26, -1.5, 2, 5);
    linea(b0, P(-84, 0, 0), P(98, 0, 0), 'eje-optico');
    [[-82, -24], [96, -24], [-82, 24], [96, 24]].forEach(function (q) { tornillo(b0, P(q[0], q[1], 0)); });

    // ── horno de plata: crisol cilíndrico, resistencia en espiral, tapa y boquilla
    var h0 = pieza(-160);
    sombra(h0, P, s, -71, 0, 15, 15);
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
    sombra(m0, P, s, 10, -8, 32, 24);
    caja(m0, P, -12, -26, 0, 44, 6, 46, 'lo');
    for (var lm = -10; lm < 32; lm += 2) linea(m0, P(lm, -26, 46), P(lm, -20, 46), 'lamina');
    caja(m0, P, -12, -20, 0, 44, 30, 5, 'lo');
    var m1 = pieza(-160);
    caja(m1, P, -14, -28, 13, 48, 10, 16, 'cobre');
    arrollamiento(m1, -14, 34, -18, 13, 29, 9);
    for (var k = 1; k < 5; k++) { var yy = -28 + k * 2; linea(m1, P(34, yy, 13), P(34, yy, 29), 'espira'); linea(m1, P(-14, yy, 29), P(34, yy, 29), 'espira'); }
    var m2 = pieza(130);
    caja(m2, P, -12, -10, 5, 44, 20, 7, 'mid');
    poly(m2, [P(-12, -1.3, 12), P(32, -1.3, 12), P(32, 1.3, 12), P(-12, 1.3, 12)], 'hueco');
    poly(m2, [P(32, -1.3, 12), P(32, 1.3, 12), P(32, 0, 10.2)], 'hueco');
    [[-8, -7], [28, -7], [-8, 7], [28, 7]].forEach(function (t) { tornillo(m2, P(t[0], t[1], 12)); });
    var pS = P(32, 0, 8.5), tSp = el('text', { 'class': 'polo-b', x: 0, y: 0, transform: 'matrix(.866 -.5 0 1 ' + f(pS[0]) + ' ' + f(pS[1]) + ')' }, m2); tSp.textContent = 'S';
    // ── campo magnético en el entrehierro. Líneas calculadas resolviendo Laplace en la sección (y, z) con
    //    los polos de hierro como equipotenciales (μ ≫ μ0 ⇒ B sale perpendicular a TODA la superficie del
    //    polo, no solo del filo). Cada punto lleva [y, z, a], con a = log|B| normalizado: la transparencia
    //    marca la intensidad, máxima en el filo y débil en la base de la cuña y en los bordes.
    var CAMPO = [[[0.0,18.85,1.0],[-0.0,18.45,1.0],[-0.0,18.13,1.0],[-0.0,17.73,0.93],[-0.0,17.33,0.88],[-0.0,17.01,0.84],[-0.0,16.61,0.81],[-0.0,16.21,0.78],[-0.0,15.81,0.76],[-0.0,15.49,0.74],[-0.0,15.09,0.72],[-0.0,14.69,0.7],[-0.0,14.37,0.69],[-0.0,13.97,0.67],[-0.0,13.57,0.64],[-0.0,13.25,0.61],[-0.0,12.85,0.55],[-0.0,12.45,0.46],[-0.0,12.05,0.3],[-0.0,11.73,0.12],[-0.01,11.33,0.0],[-0.01,10.93,0.0],[-0.02,10.61,0.0],[-0.03,10.21,0.0]],[[0.8,19.38,1.0],[0.94,19.09,1.0],[1.05,18.79,0.97],[1.15,18.49,0.93],[1.24,18.18,0.9],[1.31,17.86,0.87],[1.38,17.47,0.83],[1.43,17.16,0.81],[1.48,16.84,0.79],[1.52,16.52,0.77],[1.55,16.2,0.75],[1.59,15.89,0.74],[1.61,15.57,0.73],[1.64,15.25,0.72],[1.67,14.93,0.71],[1.69,14.61,0.7],[1.71,14.29,0.7],[1.74,13.97,0.69],[1.77,13.57,0.69],[1.8,13.25,0.7],[1.82,12.93,0.72],[1.85,12.62,0.74],[1.88,12.3,0.77],[1.89,11.98,0.42]],[[-0.8,19.38,1.0],[-0.94,19.09,1.0],[-1.06,18.79,0.97],[-1.16,18.49,0.93],[-1.24,18.18,0.9],[-1.31,17.87,0.86],[-1.39,17.47,0.83],[-1.44,17.16,0.81],[-1.48,16.84,0.79],[-1.52,16.52,0.77],[-1.56,16.2,0.75],[-1.59,15.89,0.74],[-1.62,15.57,0.73],[-1.65,15.25,0.72],[-1.67,14.93,0.71],[-1.7,14.61,0.7],[-1.72,14.29,0.7],[-1.74,13.97,0.69],[-1.77,13.57,0.69],[-1.8,13.26,0.7],[-1.83,12.94,0.72],[-1.86,12.62,0.74],[-1.88,12.3,0.77],[-1.9,11.98,0.43]],[[1.51,19.88,0.83],[1.68,19.6,0.86],[1.86,19.25,0.84],[1.99,18.95,0.83],[2.13,18.58,0.81],[2.24,18.28,0.79],[2.35,17.89,0.77],[2.43,17.58,0.76],[2.5,17.27,0.75],[2.58,16.88,0.73],[2.64,16.56,0.72],[2.7,16.17,0.71],[2.74,15.85,0.7],[2.79,15.46,0.69],[2.83,15.14,0.69],[2.87,14.74,0.69],[2.9,14.42,0.68],[2.93,14.1,0.68],[2.95,13.7,0.68],[2.97,13.38,0.69],[3.0,12.98,0.69],[3.01,12.67,0.7],[3.02,12.27,0.7],[3.02,11.95,0.23]],[[-1.51,19.88,0.85],[-1.68,19.6,0.86],[-1.87,19.25,0.84],[-2.0,18.96,0.82],[-2.15,18.59,0.8],[-2.25,18.28,0.79],[-2.36,17.9,0.77],[-2.44,17.59,0.76],[-2.52,17.28,0.74],[-2.6,16.89,0.73],[-2.65,16.57,0.72],[-2.72,16.18,0.71],[-2.76,15.86,0.7],[-2.81,15.46,0.69],[-2.85,15.15,0.69],[-2.89,14.75,0.68],[-2.92,14.43,0.68],[-2.94,14.11,0.68],[-2.97,13.71,0.68],[-2.99,13.39,0.69],[-3.01,12.99,0.69],[-3.02,12.67,0.7],[-3.03,12.27,0.7],[-3.04,11.95,0.25]],[[2.23,20.38,0.8],[2.46,20.05,0.75],[2.62,19.77,0.74],[2.8,19.42,0.73],[2.96,19.05,0.72],[3.11,18.68,0.71],[3.22,18.38,0.7],[3.34,18.0,0.7],[3.45,17.61,0.69],[3.54,17.22,0.68],[3.61,16.91,0.67],[3.69,16.52,0.67],[3.76,16.12,0.66],[3.82,15.73,0.66],[3.86,15.41,0.66],[3.91,15.01,0.66],[3.95,14.62,0.66],[3.98,14.22,0.66],[4.0,13.9,0.66],[4.03,13.5,0.66],[4.04,13.1,0.66],[4.06,12.7,0.66],[4.06,12.38,0.66],[4.07,11.98,0.31]],[[-2.23,20.38,0.76],[-2.43,20.03,0.73],[-2.59,19.75,0.73],[-2.77,19.4,0.73],[-2.93,19.03,0.72],[-3.08,18.66,0.71],[-3.18,18.36,0.7],[-3.31,17.98,0.7],[-3.41,17.59,0.69],[-3.51,17.2,0.68],[-3.58,16.89,0.67],[-3.65,16.5,0.67],[-3.72,16.1,0.66],[-3.78,15.71,0.66],[-3.82,15.39,0.66],[-3.86,14.99,0.66],[-3.9,14.59,0.66],[-3.93,14.19,0.66],[-3.96,13.88,0.66],[-3.98,13.48,0.66],[-4.0,13.08,0.66],[-4.01,12.68,0.66],[-4.02,12.36,0.67],[-4.02,11.96,0.23]],[[2.94,20.88,0.63],[3.16,20.54,0.65],[3.36,20.19,0.65],[3.55,19.84,0.65],[3.72,19.48,0.65],[3.88,19.11,0.64],[4.02,18.74,0.64],[4.15,18.36,0.64],[4.27,17.98,0.63],[4.37,17.59,0.63],[4.47,17.2,0.63],[4.55,16.81,0.62],[4.64,16.34,0.62],[4.7,15.95,0.62],[4.76,15.55,0.62],[4.81,15.15,0.62],[4.85,14.75,0.63],[4.88,14.36,0.63],[4.91,13.96,0.63],[4.93,13.56,0.63],[4.94,13.16,0.64],[4.95,12.76,0.64],[4.96,12.36,0.64],[4.96,11.96,0.21]],[[-2.94,20.88,0.64],[-3.16,20.54,0.66],[-3.36,20.19,0.65],[-3.54,19.84,0.65],[-3.71,19.48,0.65],[-3.87,19.11,0.64],[-4.01,18.74,0.64],[-4.14,18.36,0.63],[-4.26,17.97,0.63],[-4.37,17.59,0.63],[-4.46,17.2,0.62],[-4.54,16.81,0.62],[-4.63,16.34,0.62],[-4.69,15.94,0.62],[-4.75,15.55,0.62],[-4.79,15.15,0.62],[-4.83,14.75,0.63],[-4.86,14.35,0.63],[-4.89,13.95,0.63],[-4.91,13.55,0.64],[-4.93,13.15,0.64],[-4.94,12.75,0.64],[-4.94,12.35,0.64],[-4.95,11.95,0.2]],[[3.66,21.38,0.6],[3.88,21.05,0.59],[4.13,20.63,0.59],[4.31,20.28,0.58],[4.49,19.92,0.58],[4.69,19.48,0.58],[4.84,19.11,0.58],[4.97,18.74,0.58],[5.12,18.28,0.57],[5.23,17.89,0.57],[5.33,17.51,0.57],[5.43,17.04,0.58],[5.51,16.65,0.58],[5.58,16.17,0.58],[5.64,15.78,0.58],[5.68,15.38,0.59],[5.73,14.9,0.59],[5.76,14.5,0.6],[5.78,14.1,0.61],[5.81,13.62,0.61],[5.82,13.22,0.62],[5.83,12.82,0.62],[5.83,12.34,0.62],[5.83,11.94,0.14]],[[-3.66,21.38,0.63],[-3.89,21.05,0.59],[-4.14,20.64,0.58],[-4.33,20.29,0.58],[-4.5,19.93,0.58],[-4.7,19.49,0.58],[-4.85,19.12,0.57],[-4.98,18.74,0.57],[-5.13,18.29,0.57],[-5.24,17.9,0.57],[-5.34,17.51,0.57],[-5.44,17.05,0.57],[-5.52,16.65,0.57],[-5.59,16.18,0.58],[-5.65,15.78,0.58],[-5.69,15.39,0.59],[-5.73,14.91,0.59],[-5.76,14.51,0.6],[-5.78,14.11,0.61],[-5.8,13.63,0.61],[-5.82,13.23,0.62],[-5.82,12.83,0.62],[-5.83,12.35,0.63],[-5.83,11.95,0.17]],[[4.37,21.88,0.49],[4.65,21.49,0.52],[4.86,21.15,0.52],[5.09,20.73,0.52],[5.31,20.3,0.52],[5.47,19.93,0.52],[5.66,19.49,0.52],[5.82,19.04,0.52],[5.95,18.66,0.52],[6.08,18.2,0.52],[6.2,17.73,0.52],[6.29,17.34,0.52],[6.38,16.87,0.53],[6.44,16.48,0.53],[6.5,16.0,0.54],[6.55,15.52,0.55],[6.58,15.12,0.56],[6.61,14.65,0.57],[6.63,14.17,0.58],[6.65,13.77,0.59],[6.65,13.29,0.6],[6.66,12.81,0.61],[6.66,12.41,0.61],[6.66,11.93,0.07]],[[-4.37,21.88,0.51],[-4.63,21.47,0.51],[-4.84,21.13,0.52],[-5.07,20.71,0.52],[-5.25,20.35,0.52],[-5.45,19.92,0.52],[-5.63,19.47,0.52],[-5.77,19.1,0.52],[-5.92,18.64,0.52],[-6.03,18.26,0.52],[-6.15,17.79,0.52],[-6.25,17.32,0.52],[-6.33,16.93,0.53],[-6.4,16.46,0.53],[-6.46,15.98,0.54],[-6.5,15.58,0.55],[-6.54,15.1,0.56],[-6.57,14.7,0.57],[-6.58,14.22,0.58],[-6.6,13.74,0.6],[-6.6,13.34,0.6],[-6.61,12.86,0.61],[-6.61,12.46,0.62],[-6.61,11.98,0.28]],[[5.09,22.38,0.46],[5.35,21.98,0.46],[5.6,21.57,0.46],[5.83,21.15,0.46],[6.05,20.72,0.46],[6.25,20.28,0.46],[6.4,19.91,0.46],[6.58,19.47,0.46],[6.73,19.01,0.46],[6.87,18.55,0.47],[6.99,18.09,0.47],[7.09,17.62,0.47],[7.18,17.15,0.48],[7.25,16.67,0.49],[7.31,16.19,0.5],[7.35,15.72,0.51],[7.38,15.24,0.53],[7.4,14.76,0.54],[7.4,14.36,0.56],[7.41,13.88,0.57],[7.4,13.4,0.59],[7.4,12.92,0.6],[7.4,12.44,0.61],[7.39,11.96,0.19]],[[-5.09,22.38,0.47],[-5.35,21.98,0.47],[-5.6,21.57,0.46],[-5.83,21.15,0.46],[-6.05,20.72,0.46],[-6.25,20.28,0.46],[-6.4,19.91,0.46],[-6.57,19.46,0.46],[-6.73,19.01,0.46],[-6.86,18.55,0.46],[-6.98,18.08,0.47],[-7.08,17.61,0.47],[-7.17,17.14,0.48],[-7.24,16.67,0.49],[-7.29,16.19,0.5],[-7.33,15.71,0.51],[-7.36,15.23,0.53],[-7.37,14.75,0.54],[-7.38,14.35,0.56],[-7.38,13.87,0.58],[-7.37,13.39,0.6],[-7.36,12.91,0.61],[-7.36,12.43,0.62],[-7.36,11.95,0.18]],[[5.8,22.88,0.35],[6.07,22.48,0.42],[6.32,22.07,0.41],[6.59,21.58,0.41],[6.81,21.15,0.41],[7.01,20.72,0.41],[7.2,20.28,0.41],[7.4,19.75,0.41],[7.55,19.3,0.41],[7.69,18.84,0.41],[7.81,18.37,0.42],[7.91,17.9,0.42],[8.0,17.35,0.43],[8.07,16.88,0.44],[8.12,16.4,0.45],[8.15,15.92,0.47],[8.17,15.44,0.49],[8.17,14.88,0.51],[8.17,14.4,0.53],[8.15,13.92,0.56],[8.13,13.44,0.59],[8.11,12.88,0.61],[8.09,12.4,0.63],[8.09,11.92,0.07]],[[-5.8,22.88,0.4],[-6.08,22.49,0.41],[-6.33,22.08,0.41],[-6.61,21.59,0.41],[-6.83,21.17,0.4],[-7.03,20.73,0.4],[-7.22,20.29,0.4],[-7.42,19.77,0.4],[-7.57,19.31,0.4],[-7.71,18.85,0.4],[-7.83,18.39,0.41],[-7.93,17.92,0.41],[-8.02,17.36,0.42],[-8.08,16.89,0.43],[-8.13,16.41,0.45],[-8.16,15.93,0.46],[-8.18,15.45,0.48],[-8.17,14.89,0.51],[-8.16,14.41,0.53],[-8.14,13.93,0.56],[-8.11,13.45,0.59],[-8.08,12.89,0.62],[-8.06,12.41,0.64],[-8.06,11.93,0.13]],[[6.51,23.38,0.32],[6.79,22.99,0.36],[7.09,22.51,0.36],[7.33,22.1,0.36],[7.59,21.6,0.36],[7.8,21.17,0.35],[8.02,20.65,0.35],[8.2,20.21,0.35],[8.38,19.68,0.35],[8.52,19.22,0.35],[8.65,18.68,0.36],[8.75,18.21,0.36],[8.85,17.65,0.37],[8.91,17.18,0.38],[8.96,16.62,0.4],[8.98,16.14,0.41],[8.99,15.58,0.44],[8.97,15.1,0.46],[8.94,14.54,0.5],[8.9,14.06,0.53],[8.84,13.51,0.58],[8.79,13.03,0.62],[8.75,12.47,0.66],[8.73,11.99,0.35]],[[-6.51,23.38,0.35],[-6.78,22.98,0.36],[-7.08,22.5,0.36],[-7.31,22.09,0.36],[-7.58,21.59,0.35],[-7.78,21.16,0.35],[-8.01,20.64,0.35],[-8.18,20.2,0.35],[-8.36,19.67,0.35],[-8.5,19.21,0.35],[-8.64,18.67,0.35],[-8.74,18.2,0.36],[-8.83,17.64,0.37],[-8.89,17.17,0.38],[-8.93,16.61,0.39],[-8.95,16.13,0.41],[-8.95,15.57,0.43],[-8.94,15.09,0.46],[-8.9,14.53,0.5],[-8.85,14.05,0.53],[-8.79,13.5,0.59],[-8.73,13.02,0.63],[-8.68,12.46,0.68],[-8.66,11.98,0.35]],[[7.23,23.88,0.26],[7.54,23.41,0.32],[7.83,22.93,0.32],[8.07,22.52,0.31],[8.34,22.03,0.31],[8.59,21.52,0.3],[8.81,21.01,0.3],[8.99,20.56,0.29],[9.17,20.04,0.29],[9.34,19.5,0.3],[9.47,18.96,0.3],[9.59,18.41,0.31],[9.66,17.94,0.31],[9.73,17.38,0.32],[9.77,16.82,0.34],[9.78,16.26,0.36],[9.77,15.7,0.38],[9.74,15.22,0.41],[9.68,14.66,0.45],[9.6,14.11,0.5],[9.5,13.56,0.56],[9.41,13.09,0.63],[9.32,12.54,0.71],[9.27,11.98,0.39]],[[-7.23,23.88,0.27],[-7.54,23.41,0.33],[-7.84,22.94,0.32],[-8.08,22.52,0.31],[-8.34,22.03,0.3],[-8.59,21.53,0.3],[-8.82,21.02,0.29],[-9.0,20.57,0.29],[-9.18,20.04,0.29],[-9.35,19.51,0.29],[-9.48,18.96,0.29],[-9.6,18.41,0.3],[-9.67,17.94,0.3],[-9.73,17.38,0.32],[-9.77,16.83,0.33],[-9.78,16.27,0.35],[-9.76,15.71,0.37],[-9.73,15.23,0.4],[-9.66,14.67,0.44],[-9.57,14.12,0.49],[-9.46,13.57,0.56],[-9.36,13.1,0.63],[-9.25,12.55,0.73],[-9.19,11.99,0.47]],[[7.94,24.38,0.3],[8.24,23.9,0.3],[8.55,23.43,0.28],[8.84,22.95,0.27],[9.15,22.4,0.26],[9.4,21.9,0.25],[9.63,21.39,0.24],[9.84,20.87,0.24],[10.03,20.34,0.23],[10.19,19.8,0.23],[10.33,19.26,0.24],[10.44,18.71,0.24],[10.54,18.08,0.25],[10.6,17.52,0.26],[10.62,16.96,0.28],[10.62,16.4,0.29],[10.6,15.84,0.32],[10.54,15.29,0.34],[10.46,14.73,0.38],[10.34,14.19,0.43],[10.18,13.57,0.51],[10.01,13.03,0.62],[9.83,12.5,0.8],[9.72,11.95,0.47]],[[-7.94,24.38,0.24],[-8.27,23.92,0.29],[-8.58,23.45,0.28],[-8.91,22.91,0.26],[-9.19,22.42,0.25],[-9.44,21.92,0.24],[-9.68,21.42,0.23],[-9.89,20.9,0.22],[-10.08,20.37,0.22],[-10.27,19.76,0.22],[-10.4,19.21,0.22],[-10.51,18.66,0.23],[-10.59,18.11,0.24],[-10.65,17.55,0.25],[-10.67,16.99,0.26],[-10.67,16.35,0.28],[-10.63,15.8,0.3],[-10.57,15.24,0.33],[-10.47,14.69,0.37],[-10.35,14.14,0.42],[-10.19,13.61,0.49],[-9.97,13.0,0.61],[-9.76,12.48,0.83],[-9.61,11.95,0.54]],[[8.66,24.88,0.2],[9.03,24.35,0.26],[9.34,23.89,0.24],[9.69,23.35,0.22],[9.97,22.87,0.2],[10.28,22.31,0.19],[10.52,21.8,0.18],[10.77,21.21,0.17],[10.98,20.61,0.17],[11.14,20.07,0.17],[11.3,19.45,0.17],[11.4,18.9,0.17],[11.49,18.27,0.18],[11.54,17.71,0.19],[11.56,17.07,0.2],[11.55,16.51,0.22],[11.5,15.87,0.24],[11.41,15.24,0.27],[11.3,14.69,0.3],[11.13,14.08,0.35],[10.94,13.55,0.41],[10.67,12.97,0.51],[10.38,12.49,0.68],[9.99,11.98,0.91]],[[-8.66,24.88,0.23],[-9.02,24.35,0.27],[-9.34,23.89,0.24],[-9.69,23.36,0.22],[-9.98,22.88,0.19],[-10.29,22.32,0.18],[-10.57,21.74,0.16],[-10.79,21.22,0.16],[-11.0,20.62,0.15],[-11.17,20.09,0.15],[-11.32,19.47,0.16],[-11.44,18.84,0.16],[-11.52,18.28,0.17],[-11.57,17.64,0.18],[-11.59,17.0,0.19],[-11.57,16.44,0.21],[-11.51,15.81,0.23],[-11.43,15.25,0.25],[-11.29,14.63,0.28],[-11.11,14.02,0.33],[-10.9,13.49,0.39],[-10.62,12.92,0.49],[-10.31,12.45,0.64],[-9.87,11.99,0.96]],[[9.37,25.38,0.31],[9.74,24.85,0.26],[10.17,24.28,0.2],[10.55,23.76,0.16],[10.93,23.15,0.13],[11.24,22.59,0.11],[11.52,22.02,0.1],[11.8,21.35,0.09],[12.0,20.75,0.09],[12.2,20.05,0.09],[12.33,19.43,0.1],[12.44,18.8,0.1],[12.51,18.08,0.11],[12.54,17.44,0.12],[12.53,16.8,0.13],[12.47,16.08,0.15],[12.38,15.45,0.17],[12.22,14.75,0.2],[12.03,14.14,0.23],[11.79,13.54,0.27],[11.45,12.91,0.34],[11.08,12.39,0.44],[10.54,11.91,0.64],[9.95,11.7,0.28]],[[-9.37,25.38,0.36],[-9.75,24.87,0.27],[-10.21,24.31,0.19],[-10.59,23.79,0.15],[-10.99,23.19,0.11],[-11.31,22.64,0.1],[-11.63,21.99,0.08],[-11.87,21.4,0.08],[-12.11,20.72,0.08],[-12.28,20.11,0.08],[-12.43,19.4,0.08],[-12.53,18.77,0.09],[-12.6,18.05,0.09],[-12.62,17.41,0.1],[-12.61,16.69,0.12],[-12.55,16.06,0.13],[-12.44,15.35,0.15],[-12.29,14.72,0.17],[-12.07,14.04,0.2],[-11.82,13.45,0.24],[-11.46,12.82,0.31],[-11.07,12.32,0.39],[-10.54,11.84,0.54],[-9.95,11.59,0.64]],[[10.09,25.88,0.44],[10.69,25.36,0.19],[11.21,24.85,0.1],[11.72,24.24,0.05],[12.17,23.58,0.02],[12.53,22.96,0.0],[12.87,22.23,0.0],[13.16,21.49,0.0],[13.38,20.8,0.0],[13.56,20.02,0.01],[13.7,19.23,0.01],[13.78,18.52,0.02],[13.82,17.72,0.03],[13.81,17.0,0.04],[13.74,16.2,0.04],[13.62,15.41,0.06],[13.45,14.71,0.07],[13.2,13.95,0.09],[12.87,13.22,0.12],[12.5,12.61,0.15],[12.0,11.99,0.2],[11.39,11.47,0.27],[10.76,11.14,0.32],[9.97,10.99,0.0]],[[-10.09,25.88,0.38],[-10.75,25.44,0.14],[-11.34,24.9,0.05],[-11.87,24.29,0.01],[-12.29,23.71,0.0],[-12.69,23.02,0.0],[-13.04,22.3,0.0],[-13.33,21.55,0.0],[-13.56,20.79,0.0],[-13.74,20.01,0.0],[-13.88,19.22,0.0],[-13.96,18.42,0.0],[-13.99,17.71,0.0],[-13.97,16.91,0.01],[-13.9,16.11,0.02],[-13.77,15.32,0.03],[-13.58,14.54,0.04],[-13.31,13.79,0.06],[-12.97,13.07,0.08],[-12.54,12.39,0.11],[-12.08,11.84,0.14],[-11.47,11.32,0.19],[-10.77,10.94,0.25],[-10.0,10.75,0.27]]];
    function abanico(capaB, XC, peso, flechas) {
      CAMPO.forEach(function (ln, il) {
        var tr = ln.map(function (q) { return P(XC, q[0], q[1]); }), suma = 0;
        for (var k = 0; k < ln.length - 1; k++) {
          var aa = (ln[k][2] + ln[k + 1][2]) / 2; suma += aa;
          linea(capaB, tr[k], tr[k + 1], 'linea-b').setAttribute('stroke-opacity', f(peso * (.12 + .88 * aa)));
        }
        if (flechas) {
          var media = suma / (ln.length - 1);
          var fl = el('path', { 'class': 'flecha-b', d: 'M-2.6 -1.7 L1.5 0 L-2.6 1.7 Z', 'fill-opacity': f(peso * (.15 + .85 * media)) }, capaB);
          el('animateMotion', { path: 'M' + tr.map(function (c) { return f(c[0]) + ' ' + f(c[1]); }).join(' L'), rotate: 'auto', dur: f(1.1 + 1.4 * (1 - media)) + 's', begin: f(-il * .19) + 's', repeatCount: 'indefinite' }, fl);
        }
      });
    }
    var mc = pieza(-60); mc.classList.add('campo');
    abanico(mc, -6, .45, false); abanico(mc, 6, .55, false); abanico(mc, 18, .7, true);
    capa();                                   // dentro del imán
    var m3 = pieza(-180);
    var cu = el('g', { 'class': 's mid' }, m3);
    poly(cu, [P(32, -10, 26), P(32, 10, 26), P(32, 0, 19)], 'sd');
    caja(m3, P, -12, -10, 26, 44, 20, 8, 'mid');
    caja(m3, P, -12, -20, 34, 44, 30, 6, 'lo');
    for (var la = -10; la < 32; la += 2) linea(m3, P(la, -20, 40), P(la, 10, 40), 'lamina');
    for (var w = 0; w < 6; w++) tornillo(m3, P(-8 + w * 7.6, 6, 40));
    var rN = P(10, 10, 30), tN = el('text', { 'class': 'grabado', x: 0, y: 0, transform: 'matrix(.866 .5 0 1 ' + f(rN[0]) + ' ' + f(rN[1]) + ')' }, m3); tN.textContent = '∂B/∂z';
    var mcF = pieza(-60); mcF.classList.add('campo'); abanico(mcF, 32.3, 1, true);
    var pN = P(32, 0, 30), tNp = el('text', { 'class': 'polo-b', x: 0, y: 0, transform: 'matrix(.866 -.5 0 1 ' + f(pN[0]) + ' ' + f(pN[1]) + ')' }, m3); tNp.textContent = 'N';

    var p0 = pieza(110);
    placa(p0, P, 40, 13, 0, 28, 10, 'Ag · 1922 · T ≈ 1300 K');
    capa();                                   // imán → pantalla
    var pa = pieza(-170);
    sombra(pa, P, s, 80, 0, 7, 28);
    caja(pa, P, 76, -24, 0, 8, 6, 2.5, 'lo'); caja(pa, P, 76, 18, 0, 8, 6, 2.5, 'lo');
    caja(pa, P, 79, -22, 2.5, 2, 2, 34, 'lo');
    var pantalla = el('g', { 'class': 's vidrio' }, pa);
    poly(pantalla, [P(80, -20, 3), P(80, 20, 3), P(80, 20, 35), P(80, -20, 35)], 'tp');
    poly(pa, [P(80, -18, 35), P(80, -12, 35), P(80, 6, 3), P(80, 0, 3)], 'reflejo');
    poly(pa, [P(80, -9, 35), P(80, -7, 35), P(80, 11, 3), P(80, 9, 3)], 'reflejo');
    var impactos = el('g', {}, pa);
    ruta(pa, [P(80, -9, ZB), P(80, 9, ZB)], 'clasico');
    var rc = P(80, 14.5, ZB + 1.2), tc = el('text', { 'class': 'grabado', x: 0, y: 0, transform: 'matrix(.866 -.5 0 1 ' + f(rc[0]) + ' ' + f(rc[1]) + ')' }, pa); tc.textContent = 'sin campo';
    caja(pa, P, 79, 20, 2.5, 2, 2, 34, 'lo');
    caja(pa, P, 79, -22, 35, 2, 44, 2, 'lo');
    var pz = pieza(-170);
    poly(pz, [P(80, -10, 4), P(80, 10, 4), P(80, 10, 33), P(80, -10, 33)], 'zona');

    // notas: al pasar el mouse por una pieza, una línea guía sube hasta una explicación corta en gris
    // modelo planetario de la plata (Z = 47): capas 2 · 8 · 18 · 18 · 1, configuración [Kr] 4d¹⁰ 5s¹
    // electroimán en miniatura: corriente en la bobina → flujo en el yugo → campo no uniforme en el
    // entrehierro (filo N, canal S) → el haz se separa en ↑ y ↓
    function imanMini(q, x0, y0) {
      function T(x, y) { return f(x0 + 8 + x) + ' ' + f(y0 + y); }
      el('path', { 'class': 'im-hierro', d: 'M' + T(10, 6) + ' L' + T(118, 6) + ' L' + T(118, 30) + ' L' + T(104, 46) + ' L' + T(90, 30) + ' L' + T(34, 30) + ' L' + T(34, 70) + ' L' + T(88, 70) + ' L' + T(88, 60) + ' L' + T(100, 60) + ' L' + T(104, 64) + ' L' + T(108, 60) + ' L' + T(120, 60) + ' L' + T(120, 94) + ' L' + T(10, 94) + ' Z' }, q);
      el('path', { 'class': 'im-flujo', d: 'M' + T(22, 50) + ' L' + T(22, 18) + ' L' + T(104, 18) + ' L' + T(104, 64) + ' L' + T(104, 82) + ' L' + T(22, 82) + ' Z' }, q);
      for (var k = 0; k < 7; k++) {
        var yb = 36 + k * 4.3;
        el('path', { 'class': 'im-bob', d: 'M' + T(4, yb) + ' L' + T(40, yb) }, q);
        el('path', { 'class': 'im-carga', d: 'M' + T(4, yb) + ' L' + T(40, yb) }, q);
      }
      [-12, -7, -3, 0, 3, 7, 12].forEach(function (dxg) {
        el('path', { 'class': 'im-gap', d: 'M' + T(104, 46) + ' Q' + T(104 + dxg * .3, 54) + ' ' + T(104 + dxg, 60), 'stroke-opacity': f(1 - Math.abs(dxg) / 15) }, q);
      });
      var e1 = el('text', { 'class': 'im-et', x: T(-2, 52).split(' ')[0], y: T(-2, 52).split(' ')[1], 'text-anchor': 'end' }, q); e1.textContent = 'I';
      var e2 = el('text', { 'class': 'im-et', x: T(122, 40).split(' ')[0], y: T(122, 40).split(' ')[1] }, q); e2.textContent = 'N';
      var e3 = el('text', { 'class': 'im-et', x: T(124, 70).split(' ')[0], y: T(124, 70).split(' ')[1] }, q); e3.textContent = 'S';
      // un átomo cruza el entrehierro y sale separado según su espín
      [['M' + T(128, 53) + ' L' + T(150, 53) + ' Q' + T(168, 53) + ' ' + T(196, 34), 'e-val', 'M0 1.2 L0 -5 M-1.4 -3.3 L0 -5.1 L1.4 -3.3', 'espin-arr'],
       ['M' + T(128, 53) + ' L' + T(150, 53) + ' Q' + T(168, 53) + ' ' + T(196, 72), 'e-baj', 'M0 -1.2 L0 5 M-1.4 3.3 L0 5.1 L1.4 3.3', 'espin-abj']].forEach(function (r) {
        el('path', { d: r[0], fill: 'none', stroke: '#8E8478', 'stroke-width': .6, 'stroke-dasharray': '1 3' }, q);
        var at = el('g', { 'class': 'im-at' }, q);
        el('circle', { r: 2.6, 'class': r[1] }, at);
        el('path', { d: r[2], 'class': r[3] }, at);
        el('animateMotion', { path: r[0], dur: '2.2s', repeatCount: 'indefinite' }, at);
      });
    }
    function atomoPlata(q, x0, y0) {
      var cx = x0 + 52, cy = y0 + 46, CAPAS = [2, 8, 18, 18, 1], R = [8, 14.5, 22, 30, 40];
      var orb = el('g', { transform: 'translate(' + f(cx) + ' ' + f(cy) + ')' }, q);
      CAPAS.forEach(function (n, k) {
        var ultima = k === CAPAS.length - 1;
        el('circle', { 'class': ultima ? 'orbita orbita-ext' : 'orbita', r: R[k] }, orb);
        var giro = el('g', {}, orb);
        for (var e = 0; e < n; e++) {
          var a = e / n * Math.PI * 2 + k * .7;
          el('circle', { 'class': ultima ? 'e-val' : 'e-int', cx: f(R[k] * Math.cos(a)), cy: f(R[k] * Math.sin(a)), r: ultima ? 3.2 : 1.3 }, giro);
        }
        el('animateTransform', { attributeName: 'transform', type: 'rotate', from: '0', to: (k % 2 ? '-360' : '360'), dur: (2.6 + k * 1.9) + 's', repeatCount: 'indefinite' }, giro);
      });
      el('circle', { 'class': 'nucleo', cx: f(cx), cy: f(cy), r: 4.2 }, q);
      // casilla de tabla periódica: número atómico, símbolo, masa y nombre
      var tx0 = x0 + 112, ty0 = y0 + 18;
      el('rect', { 'class': 'casilla', x: f(tx0), y: f(ty0), width: 46, height: 54, rx: 1.5 }, q);
      var tz = el('text', { 'class': 'cas-z', x: f(tx0 + 5), y: f(ty0 + 11) }, q); tz.textContent = '47';
      var ts = el('text', { 'class': 'cas-s', x: f(tx0 + 23), y: f(ty0 + 35) }, q); ts.textContent = 'Ag';
      var tm = el('text', { 'class': 'cas-m', x: f(tx0 + 23), y: f(ty0 + 47) }, q); tm.textContent = '107,87';
      // configuración electrónica
      var t2 = el('text', { 'class': 'conf', x: f(x0 + 172), y: f(y0 + 52) }, q);
      el('tspan', {}, t2).textContent = '[Kr] 4d';
      el('tspan', { 'class': 'sup', 'baseline-shift': 'super' }, t2).textContent = '10';
      el('tspan', { 'class': 'conf-val' }, t2).textContent = ' 5s';
      el('tspan', { 'class': 'conf-val sup', 'baseline-shift': 'super' }, t2).textContent = '1';
    }
    var capaNotas = el('g', { 'class': 'notas' }, g);
    function nota(piezas, ancla, titulo, lineas, cima, foco, op) {
      var extra = op ? op.alto : 0;
      foco = piezas.concat(foco || []);
      var a = P(ancla[0], ancla[1], ancla[2]), alto = 64 + (a[1] > 520 ? 40 : 0), izq = a[0] > 1150, dx = op && op.dx ? op.dx : (izq ? -22 : 22);
      var top = cima || Math.max(118, a[1] - alto), n = el('g', { 'class': 'nota' }, capaNotas);
      el('circle', { cx: f(a[0]), cy: f(a[1]), r: 2.2 }, n);
      el('circle', { 'class': 'anillo-nota', cx: f(a[0]), cy: f(a[1]), r: 5 }, n);
      el('path', { d: 'M' + f(a[0]) + ' ' + f(a[1] - 4) + ' L' + f(a[0]) + ' ' + f(top) + ' L' + f(a[0] + dx) + ' ' + f(top), pathLength: 1 }, n);
      var ancho = Math.max(op ? op.ancho : 0, Math.max.apply(null, lineas.map(function (l) { return l.length; })) * 6.6 + 22);
      var bx = izq ? a[0] + dx - ancho : a[0] + dx, tx = bx + 10, anc = 'start';
      el('rect', { 'class': 'nota-fondo', x: f(bx), y: f(top - 11), width: f(ancho), height: 22 + lineas.length * 17 + extra, rx: 2 }, n);
      if (op) op.dibujo(el('g', { 'class': 'nota-dib' }, n), bx, top + 10);
      var t = el('text', { 'class': 'nota-t', x: f(tx), y: f(top + 3), 'text-anchor': anc }, n); t.textContent = titulo;
      var d = el('text', { 'class': 'nota-d', x: f(tx), y: f(top + 19 + extra), 'text-anchor': anc }, n);
      lineas.forEach(function (l, k) { var sp = el('tspan', { x: f(tx), dy: k ? 17 : 0 }, d); sp.textContent = l; });
      piezas.forEach(function (q) {
        q.classList.add('con-nota');
        q.addEventListener('pointerenter', function () { n.classList.add('ver'); foco.forEach(function (o) { o.classList.add('foco'); }); svg.classList.add('nota-on'); });
        q.addEventListener('pointerleave', function () { n.classList.remove('ver'); foco.forEach(function (o) { o.classList.remove('foco'); }); svg.classList.remove('nota-on'); });
      });
    }
    nota([b0], [-62, 22, 0], 'Banco y vacío', ['Todo va sobre un solo eje. El aparato real', 'trabajaba en vacío: los átomos debían volar', 'sin chocar con el aire.']);
    nota([h0], [-71, 0, 32.4], 'Horno de plata', ['La plata tiene un solo electrón externo:', 'el momento magnético del átomo es el de ese', 'electrón. Por eso fue la elección ideal.'], 104, null, { alto: 96, ancho: 330, dx: 110, dibujo: atomoPlata });
    nota([rendijas[0], rendijas[1]], [-35.1, -13, 28], 'Colimadores', ['El haz debe ser fino: si fuera ancho,', 'las dos manchas se solaparían y la', 'separación no se vería.']);
    nota([m0, m1], [10, -23, 46], 'Electroimán', ['La corriente imanta el hierro; el yugo', 'lleva el campo hasta el entrehierro. Uniforme', 'solo haría girar al átomo: el filo lo desvía.'], 96, null, { alto: 108, ancho: 300, dx: 12, dibujo: imanMini });
    nota([m2, m3], [32, 5, 22.5], 'Polos asimétricos', ['El filo concentra el campo: ∂B/∂z grande.', 'La fuerza Fz = μz ∂B/∂z depende de μz,', 'así que el imán "mide" el espín.'], 175, [mc, mcF]);
    nota([p0], [54, 18, .5], 'Fráncfort, 1922', ['Stern y Gerlach buscaban la cuantización', 'espacial de Bohr–Sommerfeld. El espín', '(1925) explicó por qué eran justo dos.']);
    nota([pa], [79, -21, 37], 'Placa colectora', ['La línea punteada marca dónde llega el haz', 'sin campo. Con campo, la física clásica', 'esperaba una mancha continua (μz de cualquier', 'valor). Se vieron dos: μz está cuantizado.'], 300);
    nota([pz], [80, 0, 27], '¿Por qué no solo dos líneas?', [
      'Cada átomo cae arriba o abajo; lo que cambia es cuánto:',
      '· Δz ∝ 1/v²: los lentos se abren más, los rápidos menos.',
      '· ∂B/∂z es máximo bajo el filo y cae hacia los lados:',
      '  de ahí la forma de labios, que se cierra en los bordes.',
      '· La rendija tiene altura: el haz ya llega con ancho.',
      'Los puntos cerca del centro son átomos rápidos o de',
      'los bordes, no espines "intermedios".'], 150, [pa]);

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
      enVuelo.push({ x: -58, y: y0, z0: (Math.random() * 2 - 1) * .7, v: Math.sqrt(w2), dz: dz, sgn: sgn, el: a, fl: fl, fl2: fl2, tramo: 0, def: false });
    }
    function zEn(a, x) {   // parabólica dentro del imán (−12…32), recta después
      if (x <= -12) return ZB + a.z0;
      var L = 44, t = Math.min(x + 12, L) / L, zm = a.dz * .32 * t * t;
      if (x <= 32) return ZB + a.z0 + zm;
      return ZB + a.z0 + a.dz * .32 + (2 * .32 * a.dz / L) * (x - 32);
    }
    return {
      tick: function (dt) {
        acum += dt; while (acum > .035) { acum -= .035; lanzar(); }
        for (var i = enVuelo.length - 1; i >= 0; i--) {
          var a = enVuelo[i]; a.x += a.v * 62 * dt;
          if (a.x >= 80) {
            var z = ZB + a.z0 + a.dz, q = P(80, a.y, z);
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
