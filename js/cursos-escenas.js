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
  // cámara ortográfica: elevación isométrica (35,26°) y azimut θ (45° = isométrica pura)
  function camara(ox, oy, s, th) {
    th = (th == null ? 45 : th) * Math.PI / 180;
    var k = s * 1.2247, se = .57735, xc = Math.cos(th) * k, xs = Math.sin(th) * se * k, yc = -Math.sin(th) * k, ys = Math.cos(th) * se * k;
    var P = function (x, y, z) { return [ox + x * xc + y * yc, oy + x * xs + y * ys - (z || 0) * s]; };
    P.ux = [xc / s, xs / s]; P.uy = [yc / s, ys / s];   // ejes x e y en pantalla, por unidad de px de texto
    return P;
  }
  // texto grabado en un plano: 'z' (tapa), 'y' (cara que mira a +y, texto a lo largo de x), 'x' (cara que mira a +x)
  function enPlano(P, plano, c) {
    var u = plano === 'x' ? [-P.uy[0], -P.uy[1]] : P.ux, v = plano === 'z' ? P.uy : [0, 1];
    return 'matrix(' + [u[0], u[1], v[0], v[1]].map(function (n) { return n.toFixed(4); }).join(' ') + ' ' + f(c[0]) + ' ' + f(c[1]) + ')';
  }
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
  // texto justificado sin cortar palabras: se arma por párrafos y se recompone al ancho real de la
  // caja midiendo cada palabra (con la fuente ya cargada); el último renglón de cada párrafo va a
  // la izquierda. Las viñetas "·" llevan sangría francesa; un renglón que empieza con dos espacios
  // continúa la viñeta anterior.
  function parrafos(lineas) {
    var o = [], enVineta = false;
    lineas.forEach(function (l) {
      var t = l.trim(), sigue = o.length && t.charAt(0) !== '·' && (!enVineta || /^\s\s/.test(l));
      if (sigue) o[o.length - 1].texto += ' ' + t; else { enVineta = t.charAt(0) === '·'; o.push({ texto: enVineta ? t.replace(/^·\s*/, '') : t, vineta: enVineta }); }
    });
    return o;
  }
  function maquetar(d, pars, x, ancho, alto) {
    while (d.firstChild) d.removeChild(d.firstChild);
    var sonda = el('tspan', {}, d);
    function mide(t) { sonda.textContent = t; return sonda.getComputedTextLength(); }
    var esp = mide('a a') - mide('aa'), sang = mide('·') + esp, n = 0;
    pars.forEach(function (p) {
      var pal = p.texto.split(/ +/), w = pal.map(mide), ind = p.vineta ? sang : 0, ren = [], cur = [], largo = 0;
      pal.forEach(function (q, k) {
        var nuevo = cur.length ? largo + esp + w[k] : w[k];
        if (cur.length && nuevo > ancho - ind) { ren.push({ p: cur, l: largo }); cur = [q]; largo = w[k]; } else { cur.push(q); largo = nuevo; }
      });
      ren.push({ p: cur, l: largo, fin: true });
      ren.forEach(function (r, k) {
        if (p.vineta && k === 0) { var b = el('tspan', { x: f(x), dy: n ? alto : 0 }, d); b.textContent = '·'; }
        var sp = el('tspan', { x: f(x + ind) }, d);
        if (!(p.vineta && k === 0)) sp.setAttribute('dy', n ? alto : 0);
        sp.textContent = r.p.join(' ');
        var huecos = r.p.length - 1 + (sp.textContent.match(/\u00a0/g) || []).length;   // word-spacing también ensancha los espacios duros
        if (!r.fin && r.p.length > 1) sp.setAttribute('word-spacing', f((ancho - ind - r.l) / huecos));
        n++;
      });
    });
    d.removeChild(sonda);
    return n;
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
    var t = el('text', { 'class': 'grabado', x: 0, y: 0, transform: enPlano(P, 'z', c) }, g); t.textContent = rotulo;   // grabado en el plano de la tapa
    [[x + 1.2, y + 1.2], [x + w - 1.2, y + 1.2], [x + 1.2, y + d - 1.2], [x + w - 1.2, y + d - 1.2]].forEach(function (q) { el('circle', { 'class': 'tornillo', cx: f(P(q[0], q[1], z + .5)[0]), cy: f(P(q[0], q[1], z + .5)[1]), r: 1.3 }, g); });
  }
  // sombra de una base rectangular sobre el plano z: se proyecta la planta real (no una elipse de
  // pantalla), un poco corrida hacia +x, −y (la luz viene de arriba, del lado del lector), en dos capas.
  function sombraPlanta(g, P, x0, y0, x1, y1, z) {
    [[1.5, 'halo halo-cerca'], [4, 'halo halo-lejos']].forEach(function (k) {
      var e = k[0];
      poly(g, [P(x0 + e * .5, y0 - e * .4, z), P(x1 + e, y0 - e * .4, z), P(x1 + e, y1 - e * .2, z), P(x0 + e * .5, y1 - e * .2, z)], k[1]);
    });
  }
  // placa de latón con el elemento grabado como casilla de tabla periódica
  function placaAg(g, P, x, y, z, w, d, s) {
    caja(g, P, x, y, z, w, d, .6, 'laton');
    poly(g, [P(x + .9, y + .9, z + .6), P(x + w - .9, y + .9, z + .6), P(x + w - .9, y + d - .9, z + .6), P(x + .9, y + d - .9, z + .6)], 'placa-filete');
    var c = P(x + w / 2, y + d / 2, z + .6), L = el('g', { transform: enPlano(P, 'z', c) }, g), u0 = -w * s / 2 + 9;
    el('rect', { 'class': 'placa-casilla', x: f(u0), y: -15, width: 26, height: 30, rx: 1 }, L);
    var tz = el('text', { 'class': 'placa-z', x: f(u0 + 2.5), y: -10 }, L); tz.textContent = '47';
    var ts = el('text', { 'class': 'placa-s', x: f(u0 + 13), y: 4.5 }, L); ts.textContent = 'Ag';
    var tm = el('text', { 'class': 'placa-m', x: f(u0 + 13), y: 12.2 }, L); tm.textContent = 'plata';
    var tx = u0 + 34;
    var t1 = el('text', { 'class': 'placa-k', x: f(tx), y: -6 }, L); t1.textContent = 'STERN · GERLACH';
    el('line', { 'class': 'placa-raya', x1: f(tx), y1: -1.5, x2: f(w * s / 2 - 9), y2: -1.5 }, L);
    var t2 = el('text', { 'class': 'placa-d', x: f(tx), y: 8 }, L); t2.textContent = 'Fráncfort, 1922 · T ≈ 1300 K';
    [[x + 1.6, y + 1.6], [x + w - 1.6, y + 1.6], [x + 1.6, y + d - 1.6], [x + w - 1.6, y + d - 1.6]].forEach(function (q) { var p = P(q[0], q[1], z + .6); el('circle', { 'class': 'tornillo', cx: f(p[0]), cy: f(p[1]), r: 1.2 }, g); });
  }
  function sombra(g, P, s, x, y, rx, ry) { var c = P(x, y, 0); el('ellipse', { 'class': 'halo', cx: f(c[0]), cy: f(c[1]), rx: f(rx * s * 1.2247), ry: f(ry * s * .7071) }, g); }

  // notas al pasar el mouse: punto, guía que se dibuja y caja con texto justificado
  function fabricaNotas(svg, g, P) {
    var capaNotas = el('g', { 'class': 'notas' }, g);
    return function nota(piezas, ancla, titulo, lineas, cima, foco, op) {
      var extra = op && op.alto || 0;
      foco = piezas.concat(foco || []);
      var a = P(ancla[0], ancla[1], ancla[2]), alto = 64 + (a[1] > 520 ? 40 : 0), izq = op && op.izq != null ? op.izq : a[0] > 1150, dx = op && op.dx ? op.dx : (izq ? -22 : 22);
      var top = cima || Math.max(118, a[1] - alto), n = el('g', { 'class': 'nota' }, capaNotas);
      el('circle', { cx: f(a[0]), cy: f(a[1]), r: 2.2 }, n);
      el('circle', { 'class': 'anillo-nota', cx: f(a[0]), cy: f(a[1]), r: 5 }, n);
      el('path', { d: 'M' + f(a[0]) + ' ' + f(a[1] - 4) + ' L' + f(a[0]) + ' ' + f(top) + ' L' + f(a[0] + dx) + ' ' + f(top), pathLength: 1 }, n);
      if (op && op.flecha) { var sg = dx < 0 ? -1 : 1, ex = a[0] + dx; el('path', { 'class': 'nota-punta', d: 'M' + f(ex - sg * 7) + ' ' + f(top - 3.5) + ' L' + f(ex) + ' ' + f(top) + ' L' + f(ex - sg * 7) + ' ' + f(top + 3.5) + 'Z' }, n); n.classList.add('nota-fuerte'); }
      var ancho = Math.max(op && op.ancho || 0, Math.max.apply(null, lineas.map(function (l) { return l.length; })) * 6.6 + 22);
      var bx = izq ? a[0] + dx - ancho : a[0] + dx, tx = bx + 10, anc = 'start';
      var fondo = el('rect', { 'class': 'nota-fondo', x: f(bx), y: f(top - 11), width: f(ancho), height: 27 + lineas.length * 17 + extra, rx: 2 }, n);
      if (op && op.dibujo) op.dibujo(el('g', { 'class': 'nota-dib' }, n), bx, top + 10);
      var t = el('text', { 'class': 'nota-t', x: f(tx), y: f(top + 3), 'text-anchor': anc }, n); t.textContent = titulo;
      var d = el('text', { 'class': 'nota-d', x: f(tx), y: f(top + 24 + extra), 'text-anchor': anc }, n);
      var pars = parrafos(lineas), listo = false;
      lineas.forEach(function (l, k) { var sp = el('tspan', { x: f(tx), dy: k ? 17 : 0 }, d); sp.textContent = l.trim(); });
      linea(n, [tx, top + 8.5], [bx + ancho - 10, top + 8.5], 'nota-regla');
      piezas.forEach(function (q) {
        q.classList.add('con-nota');
        q.addEventListener('pointerenter', function () { if (!listo) { listo = true; var nl = maquetar(d, pars, tx, ancho - 20, 17); fondo.setAttribute('height', f(27 + nl * 17 + extra)); n.querySelectorAll('.nota-d2').forEach(function (t) { var m = maquetar(t, t.pars, t.x0, t.ancho, 17); t.fondo.setAttribute('height', f(37 + m * 17)); }); } n.classList.add('ver'); foco.forEach(function (o) { o.classList.add('foco'); }); svg.classList.add('nota-on'); });
        q.addEventListener('pointerleave', function () { n.classList.remove('ver'); foco.forEach(function (o) { o.classList.remove('foco'); }); svg.classList.remove('nota-on'); });
      });
    };
  }

  // ═════════ I · Relatividad: agujero negro de Schwarzschild, trazado de rayos ═════════
  // Cada píxel lanza un rayo de luz hacia atrás y lo integra como geodésica nula de Schwarzschild
  // (unidades G = c = M = 1, rₛ = 2): x'' = −(3/2)·rₛ·h²·x / r⁵, con h = |x × v|. Así salen solos
  // la sombra (b = √27 ≈ 5,2), el anillo de fotones, la imagen del disco de atrás por encima y por
  // debajo de la sombra (lente gravitacional) y el brillo Doppler del lado que se acerca.
  var GLSL_AGUJERO = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;',
    'uniform vec2 uRes; uniform vec4 uVB; uniform vec2 uC; uniform float uSC, uRoll, uT, uIncl, uPix, uArm, uTD, uHk; uniform vec2 uDim;',
    'float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float ruido(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
    '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float fbm(vec3 p) { float a = .5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * ruido(p); p = p * 2.03 + 7.1; a *= .5; } return s; }',
    // disco a lápiz de color: cientos de rayas finas a lo largo de cada órbita, crema junto al borde interior,
    // naranja y rojizo hacia afuera; el tono de cada raya cambia a lo largo de la órbita y ese dibujo gira (ω ∝ r^−3/2)
    'vec3 paleta(float u) { u = clamp(u, 0.0, 1.0);',
    '  vec3 A = vec3(1.0, .93, .76), B = vec3(1.0, .80, .48), Cc = vec3(.96, .52, .16), Dd = vec3(.68, .24, .08), E = vec3(.26, .13, .18);',
    '  if (u < .1) return mix(A, B, u / .1); if (u < .32) return mix(B, Cc, (u - .1) / .22);',
    '  if (u < .62) return mix(Cc, Dd, (u - .32) / .3); return mix(Dd, E, (u - .62) / .38); }',
    'vec4 disco(vec3 p, vec3 v, float hay) {',
    '  float r = max(length(p.xz), 2.5), ph = atan(p.z, p.x), b = sqrt(1.0 / max(r - 2.0, .05)); vec3 t = normalize(vec3(-p.z, 0.0, p.x) + 1e-5); vec3 vd = normalize(v + 1e-5);',
    '  float g = sqrt(max(1.0 - 3.0 / r, 0.0)) / (1.0 - b * dot(t, -vd)), D = clamp(pow(g, 2.0), .82, 1.18);',
    '  float u = (r - 6.0) / 13.5, om = 1.7 * pow(6.0 / r, 1.5), fase = ph - om * uTD;',
    '  vec2 cs = vec2(cos(fase), sin(fase)); float fr = fwidth(r) + 1e-4;',
    // trazos de lápiz: ruido estirado a lo largo de la órbita, fino en el radio; cada octava se apaga si es más fina que el píxel
    // trazos de lápiz como rayas suaves (coseno) a lo largo de la órbita: dos familias, cada una se apaga antes de ser más fina
    // que ~2 px, así no hay moiré; su fase varía despacio a lo largo de la órbita para que las rayas ondulen y se corten
    '  float s1 = ruido(vec3(cs * 2.2, r * 3.0));',
    '  float f1 = r / .11 + (ruido(vec3(cs * 1.4, r * .8 + 2.0)) - .5) * 1.6, f2 = r / .05 + (ruido(vec3(cs * 2.6 + 5.0, r * 1.7)) - .5) * 3.0;',
    '  float w2 = 1.0 - smoothstep(.22, .42, fr / .11), w3 = 1.0 - smoothstep(.22, .42, fr / .05);',
    '  float tr = (s1 - .5) * .7 + cos(6.2832 * f1) * .38 * w2 + cos(6.2832 * f2) * .3 * w3;',
    '  float n = ruido(vec3(cs * 1.6, r * 1.3 + 5.0));',
    '  vec3 tono = paleta(u + (n - .5) * .26 + tr * .12);',
    '  vec3 col = mix(tono * vec3(.72, .46, .34), min(tono * 1.1, vec3(1.0)), clamp(.62 + tr * .95, 0.0, 1.0));',   // la raya oscura tira a siena, no a gris
    '  float ar = min(fr, .12) * .7 + 1e-4;',
    '  float flec = ruido(vec3(cs * 3.0, 2.0)) - .5;',
    '  float afuera = 1.0 - smoothstep(15.0 + 2.5 * flec, 21.5 + 1.0 * flec, r);',
    '  float fundido = smoothstep(.3, 1.3, uArm);',
    // cortes irregulares en cada trazo: huecos que viajan con su órbita (más rápido adentro), distintos en cada raya
    '  float h1 = 0.0, h2 = 0.0;',
    // el patrón se lee sobre el círculo (cos, sin de la fase): sin costura en φ = ±π; cada familia se apaga si su raya es más fina que ~2 px
    '  { float kb = floor(r * 5.0), N = 2.0 + 4.0 * hash(vec3(kb, 3.0, 1.0));',
    '    h1 = smoothstep(.69, .75, ruido(vec3(cs * N + hash(vec3(kb, 8.0, 2.0)) * 40.0, kb * 1.7))) * smoothstep(3.0, 6.0, .2 / fr); }',
    '  { float kb = floor(r * 9.0 + .5), N = 4.0 + 7.0 * hash(vec3(kb, 5.0, 4.0));',
    '    h2 = smoothstep(.73, .79, ruido(vec3(cs * N + hash(vec3(kb, 1.0, 6.0)) * 40.0, kb * 2.3 + 7.0))) * smoothstep(3.0, 6.0, .111 / fr); }',
    '  float hueco = max(h1, h2 * .9);',
    '  col *= 1.0 - .25 * hueco;',
    '  float a = hay * fundido * smoothstep(5.95, 5.95 + ar + .03, r) * afuera * clamp(.75 + tr * .9 + .6 * (1.0 - smoothstep(8.0, 16.0, r)), 0.0, 1.0) * (1.0 - .75 * hueco);',
    // donde la lente comprime los trazos (las puntas en que se juntan las imágenes del disco) el borde interior se funde en vez de terminar en punta
    '  a *= smoothstep(5.95, 7.2, r);',
    '  return vec4(col * D, clamp(a, 0.0, 1.0)); }',
    // fondo: espacio azul muy oscuro con nubes violáceas dibujadas a curvas de nivel y muchas estrellas.
    // Se consulta en la dirección final del rayo, así que la lente lo deforma alrededor de la sombra.
    'vec3 estrellas(vec3 d, float px) {',
    '  vec3 col = vec3(0.0);',
    '  for (int l = 0; l < 3; l++) {',
    '    float fl = float(l), K = 34.0 * pow(2.1, fl), umbral = l == 0 ? .55 : (l == 1 ? .8 : .92);',
    '    vec3 pp = d * K, c = floor(pp); float h = hash(c + fl * 17.0);',
    '    if (h > umbral && px * K < .4) {',
    '      vec3 sp = c + .22 + .56 * vec3(hash(c + 1.3), hash(c + 2.7), hash(c + 5.1));',
    '      vec3 dd = pp - sp; dd -= d * dot(dd, d); float dist = length(dd) / K;',
    '      float g = hash(c + 9.0), rad = px * (.18 + .75 * g * g * g * g * (1.0 - .3 * fl));',
    '      float b = 1.0 - smoothstep(rad, rad + px * .8, dist);',
    '      if (l == 0 && g > .93) { vec3 ax = normalize(cross(d, vec3(0.0, 1.0, 0.0))), ay = cross(d, ax); float x1 = abs(dot(dd, ax)) / K, y1 = abs(dot(dd, ay)) / K; b = max(b, (1.0 - smoothstep(px * .25, px * .9, min(x1, y1))) * (1.0 - smoothstep(0.0, px * 9.0, max(x1, y1))) * .9); }',
    '      vec3 tinte = mix(vec3(.72, .82, 1.0), vec3(1.0, .9, .74), hash(c + 4.4));',
    '      col += tinte * b * (.3 + .7 * hash(c + 3.3)) * (1.0 - .28 * fl);',
    '    }',
    '  }',
    '  return col; }',
    // aguada de tinta índigo sobre el papel: mancha de bordes irregulares que acumula pigmento en el filo;
    // su textura y sus estrellas se leen en la dirección del rayo ya curvado, así la lente las deforma junto a la sombra
    'vec4 aguada(vec2 sb, vec3 d, float px) {',
    '  float e = length(vec2(sb.x / 23.0, sb.y / 12.5));',
    '  e += (fbm(vec3(sb * .11, 1.0)) - .5) * .75 + (fbm(vec3(sb * .6, 4.0)) - .5) * .2 + (ruido(vec3(sb * 2.4, 5.0)) - .5) * .05;',
    '  float pw = smoothstep(0.0, .9, uArm); pw = 1.0 - (1.0 - pw) * (1.0 - pw);',
    '  float W = 1.0 - smoothstep(.9 * pw - .035, .93 * pw, e);',
    // núcleo de pigmento denso (índigo casi negro) y, hacia el borde, una veladura gris azulada que se deshilacha
    '  float nucleo = 1.0 - smoothstep(.5 * pw, .84 * pw, e + (fbm(vec3(sb * .25, 9.0)) - .5) * .35);',
    '  float n = fbm(d * 2.6 + vec3(1.3, 6.2, 2.9)), n3 = fbm(d * 6.0 + 3.0);',
    '  float filo = smoothstep(.72, .92, e) * W;',
    '  float grano = ruido(vec3(sb * 9.0, 7.0)) * (1.0 - smoothstep(.002, .004, px));',
    '  float dens = W * (.74 + .22 * n + .08 * grano) + .3 * filo;',
    '  dens = mix(dens, .9 + .1 * n, nucleo);',
    '  vec3 velo = mix(vec3(.05, .06, .11), vec3(.14, .16, .24), smoothstep(.3, .8, n3));',
    '  vec3 hondo = mix(vec3(.012, .016, .035), vec3(.05, .065, .12), smoothstep(.35, .9, n3) * .85 + grano * .12);',
    '  vec3 tinta = mix(velo, hondo, nucleo);',
    '  vec3 est = estrellas(d, px) * vec3(1.0, .9, .7);',
    '  float aE = clamp(max(est.r, est.g) * 1.5, 0.0, 1.0) * smoothstep(.15, .5, W) * (.45 + .55 * nucleo);',
    '  vec3 col = mix(tinta, vec3(1.0, .9, .66), aE);',
    '  return vec4(col, clamp(max(dens * .97, aE), 0.0, 1.0)); }',
    'void main() {',
    '  vec2 q = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);',
    '  vec2 d = (uVB.xy + q * uVB.zw - uC) / uSC; float cr = cos(uRoll), sr = sin(uRoll);',
    '  d = vec2(cr * d.x + sr * d.y, -sr * d.x + cr * d.y);',
    '  float bx = d.x, by = -d.y;',
    // fuera de la mancha y del disco no hay nada que pintar: se evita trazar el rayo (ahorra casi la mitad de los píxeles)
    '  if (length(vec2(bx / 23.0, by / 12.5)) > 1.45 && length(vec2(bx, by)) > 24.0) { gl_FragColor = vec4(0.0); return; }',
    '  float ci = cos(uIncl), si = sin(uIncl);',
    '  vec3 cam = vec3(0.0, ci, -si) * 40.0, fw = -normalize(cam), up = vec3(0.0, si, ci), rt = vec3(-1.0, 0.0, 0.0);',
    '  vec3 p = cam + rt * bx + up * by, v = fw;',
    '  float h2 = dot(cross(p, v), cross(p, v));',
    '  vec3 hA = vec3(0.0), vA = vec3(0.0, 1.0, 0.0), hB = vec3(0.0), vB = vec3(0.0, 1.0, 0.0); int n = 0; bool cae = false;',
    '  for (int i = 0; i < 260; i++) {',
    '    float r = length(p);',
    '    if (r < 2.02) { cae = true; break; }',
    '    if (r > 48.0 && dot(p, v) > 0.0) break;',
    '    float dt = clamp(.07 * r - .08, .025, 1.1);',
    '    float r2 = r * r; vec3 a = -3.0 * h2 * p / (r2 * r2 * r);',
    '    vec3 vm = v + a * dt * .5, pn = p + vm * dt; float rn = length(pn);',
    '    float rn2 = rn * rn; vec3 an = -3.0 * h2 * pn / (rn2 * rn2 * rn); vec3 vn = vm + an * dt * .5;',
    '    if (p.y * pn.y < 0.0) { float k = p.y / (p.y - pn.y); vec3 q = mix(p, pn, k);',
    '      float rq = length(q.xz); if (rq > 5.85 && rq < 22.5) { if (n == 0) { hA = q; vA = vn; } else { hB = q; vB = vn; } n++; if (n > 1) break; } }',
    '    p = pn; v = vn;',
    '  }',
    // dirección hacia el fondo: la de una cámara estenopeica más la desviación que sufrió el rayo; el cielo gira despacio
    '  float F = 16.0, px = uPix / F;',
    // la desviación pesa entera cerca de la sombra y se apaga lejos: allí las estrellas conservan su forma
    '  float bb = length(vec2(bx, by)), pesoL = 1.0 / (1.0 + pow(bb / 9.5, 4.0));',
    '  vec3 dg = normalize(normalize(fw + (rt * bx + up * by) / F) + (normalize(v) - fw) * pesoL);',
    // el cielo gira despacio: al pasar junto a la sombra las estrellas se estiran y doblan (lente gravitacional)
    '  float ag = uT * .06, cg = cos(ag), sg = sin(ag); dg = vec3(cg * dg.x - sg * dg.z, dg.y, sg * dg.x + cg * dg.z);',
    // dentro de la sombra, marcas a escala (sin lente): singularidad, horizonte rₛ = 2 y esfera de fotones 1,5 rₛ = 3
    // sombra negra limpia; su borde (b = √27 M) se suaviza un píxel para que no se vea escalonado
    '  float ab = fwidth(bb) + 1e-4, sA = cae ? 1.0 : 1.0 - smoothstep(5.196 - ab, 5.196 + ab, bb);',
    '  vec4 tinta = sA < .999 ? aguada(vec2(bx, by), dg, px) : vec4(0.0); tinta.a *= uDim.y;',
    '  vec4 fondo = mix(tinta, vec4(.012, .014, .02, smoothstep(.05, .55, uArm) * (1.0 - .7 * uHk)), sA);',
    // radiación de Hawking: filo rojo finísimo justo fuera de la sombra, que chisporrotea; va en la capa del fondo,
    // así queda delante de la sombra y detrás de las dos imágenes del disco, sin recortes
    '  float ang = atan(by, bx), chis = ruido(vec3(ang * 38.0, uT * 26.0, 1.0)) * .7 + ruido(vec3(ang * 90.0, uT * 41.0, 4.0)) * .3;',
    '  float ancho = ab * (.9 + 1.6 * chis * chis) * (1.0 + .9 * uHk), dr = bb - 5.196 - ab * .6;',
    '  float filoH = (1.0 - smoothstep(ancho * .55, ancho * .55 + ab, abs(dr))) * smoothstep(.55, 1.3, uArm) * max(uDim.y, uHk);',
    '  float halo = exp(-max(dr, 0.0) / (ab * (3.0 + 3.0 * uHk))) * step(0.0, dr) * (.35 + .45 * uHk) * chis * max(uDim.y, uHk);',
    '  vec3 rojo = mix(mix(vec3(.62, .07, .05), vec3(.95, .25, .17), chis), mix(vec3(.9, .02, .02), vec3(1.0, .16, .08), chis), uHk);',
    '  float mH = max(filoH, halo); fondo = vec4(mix(fondo.rgb, rojo, mH), max(fondo.a, mH));',
    '  vec4 c1 = disco(hA, vA, n > 0 ? 1.0 : 0.0), c2 = disco(hB, vB, n > 1 ? 1.0 : 0.0); c1.a *= uDim.x; c2.a *= uDim.x;',   // foco de las notas: lo demás se vuelve transparente
    // composición «sobre» con alfa directo: el papel de la página se ve donde no hay tinta
    '  float a2 = c2.a + fondo.a * (1.0 - c2.a); vec3 k2 = (c2.rgb * c2.a + fondo.rgb * fondo.a * (1.0 - c2.a)) / max(a2, 1e-4);',
    '  float a1 = c1.a + a2 * (1.0 - c1.a); vec3 k1 = (c1.rgb * c1.a + k2 * a2 * (1.0 - c1.a)) / max(a1, 1e-4);',
    '  gl_FragColor = vec4(k1, a1); }'
  ].join('\n');

  function escenaRelatividad(svg, salida) {
    var fig = svg.parentNode, lienzo = document.createElement('canvas');
    lienzo.className = 'bn-lienzo'; fig.insertBefore(lienzo, svg);
    var C = [975, 465], SC = 20.5, ROLL = -16 * Math.PI / 180, INCL = 82 * Math.PI / 180;
    // proyección sin lente (ortográfica) del mundo a la pantalla, igual que en el trazador
    function aPantalla(x, y, z) {
      var ci = Math.cos(INCL), si = Math.sin(INCL), bx = -x, by = y * si + z * ci, sx = bx * SC, sy = -by * SC;
      return [C[0] + Math.cos(ROLL) * sx - Math.sin(ROLL) * sy, C[1] + Math.sin(ROLL) * sx + Math.cos(ROLL) * sy];
    }
    function enPantalla(bx, by) { var sx = bx * SC, sy = -by * SC; return [C[0] + Math.cos(ROLL) * sx - Math.sin(ROLL) * sy, C[1] + Math.sin(ROLL) * sx + Math.cos(ROLL) * sy]; }
    var BC = Math.sqrt(27), RSH = BC * SC;   // radio de la sombra en pantalla
    // ── WebGL
    var gl = lienzo.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }), U = {}, listo = false;
    if (gl) gl.getExtension('OES_standard_derivatives');
    if (gl) {
      var vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
      var fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, GLSL_AGUJERO); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(fs));
      var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr);
      var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uVB', 'uC', 'uSC', 'uRoll', 'uT', 'uIncl', 'uPix', 'uArm', 'uDim', 'uTD', 'uHk'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
      listo = gl.getProgramParameter(pr, gl.LINK_STATUS);
    }
    if (!listo) fig.classList.add('bn-sin-gl');
    var tiempo = 0, dim = [1, 1], dimMeta = [1, 1], hk = 0, hkMeta = 0;
    // el disco no gira sin fin (las órbitas de distinto radio se enrollarían en espirales cada vez más finas y aparecería moiré):
    // va 4 s en un sentido y 4 s de vuelta a la misma velocidad, con el giro suavizado solo en el cambio de sentido
    var VAI = (function () { var n = 800, o = new Float32Array(n + 1), acc = 0; o[0] = 0;
      for (var k = 1; k <= n; k++) { var th = 2 * Math.PI * (k - .5) / n; acc += Math.max(-1, Math.min(1, 6 * Math.sin(th))) * 8 / n; o[k] = acc; } return o; })();
    function tDisco(t) { var u = ((t % 8) + 8) % 8 / 8 * 800, k = Math.floor(u), w = u - k; return VAI[k] + (VAI[Math.min(k + 1, 800)] - VAI[k]) * w; }
    function pintar() {
      if (!listo) return;
      var r = lienzo.getBoundingClientRect(); if (!r.width) return;
      var q = Math.min(window.devicePixelRatio || 1, 2) * calidad, W = Math.round(r.width * q), H = Math.round(r.height * q);
      if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
      var vb = svg.viewBox.baseVal;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.uRes, W, H); gl.uniform4f(U.uVB, vb.x, vb.y, vb.width, vb.height); gl.uniform2f(U.uC, C[0], C[1]);
      gl.uniform1f(U.uSC, SC); gl.uniform1f(U.uRoll, ROLL); gl.uniform1f(U.uT, tiempo); gl.uniform1f(U.uIncl, INCL); gl.uniform1f(U.uPix, vb.width / W / SC); gl.uniform1f(U.uArm, armT != null ? armT : (performance.now() - inicio) / 1000);
      dim[0] += (dimMeta[0] - dim[0]) * .14; dim[1] += (dimMeta[1] - dim[1]) * .14; gl.uniform2f(U.uDim, dim[0], dim[1]);
      hk += (hkMeta - hk) * .14; gl.uniform1f(U.uHk, hk); gl.uniform1f(U.uTD, tDisco(tiempo));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // calidad adaptativa: si la GPU no llega a ~30 fps, se baja la resolución del trazado
    var calidad = 1, previo = 0, lentos = 0, cuadro = 0, salto = 1, inicio = performance.now(), armT = null;
    // entrada: cada vez que la escena se enciende, el dibujo se rehace desde cero (ver uArm en el shader)
    new MutationObserver(function () { var on = fig.classList.contains('on'); if (on && !fig.bnOn) inicio = performance.now(); fig.bnOn = on; }).observe(fig, { attributes: true, attributeFilter: ['class'] });
    (function bucleGL(t) {
      requestAnimationFrame(bucleGL);
      if (!fig.classList.contains('on') || document.hidden || window.__bnPausa) { previo = 0; return; }
      // la resolución casi no baja: si la GPU va lenta se ajusta poco y se salta un cuadro
      if (++cuadro % salto) return;
      pintar();
      // si va lento se pinta un cuadro de cada dos; la resolución no cambia nunca (si bajara, se pixelaría a mitad de la escena)
      if (previo) { var d = (t - previo) / salto; lentos = d > 30 ? lentos + 1 : Math.max(0, lentos - 1);
        if (lentos > 25) { lentos = 0; if (salto < 2) salto = 2; } }
      previo = t;
    })(0);
    fig.bnPintar = function (q, a) { calidad = q; armT = a == null ? null : a; pintar(); };   // para capturas fijas
    // ── capa SVG: zonas para las notas y radiación de Hawking
    var g = el('g', {}, svg);
    function anillo(r0, r1) { return 'M' + f(C[0] - r1) + ' ' + f(C[1]) + ' a' + f(r1) + ' ' + f(r1) + ' 0 1 0 ' + f(2 * r1) + ' 0 a' + f(r1) + ' ' + f(r1) + ' 0 1 0 ' + f(-2 * r1) + ' 0' + (r0 ? ' M' + f(C[0] - r0) + ' ' + f(C[1]) + ' a' + f(r0) + ' ' + f(r0) + ' 0 1 0 ' + f(2 * r0) + ' 0 a' + f(r0) + ' ' + f(r0) + ' 0 1 0 ' + f(-2 * r0) + ' 0' : ''); }
    // ── líneas de construcción a tinta, como en una lámina: elipses del plano del disco, ejes y marcas
    // las líneas de cartografía van en un SVG aparte, debajo del lienzo: quedan detrás de la tinta y del disco
    var fondoSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); fondoSvg.setAttribute('class', 'bn-fondo'); fondoSvg.setAttribute('aria-hidden', 'true');
    fondoSvg.setAttribute('preserveAspectRatio', svg.getAttribute('preserveAspectRatio') || 'none'); fig.appendChild(fondoSvg);
    function copiaVB() { var v = svg.getAttribute('viewBox'); if (v) fondoSvg.setAttribute('viewBox', v); }
    copiaVB(); new MutationObserver(copiaVB).observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
    var traza = el('g', { 'class': 'bn-traza' }, fondoSvg), giro = 'rotate(' + f(ROLL * 180 / Math.PI) + ' ' + f(C[0]) + ' ' + f(C[1]) + ')';
    var KT = SC / 25.5;   // las líneas se trazaron para SC = 25,5; escalan con el dibujo
    [[700, 330], [560, 205], [430, 300]].forEach(function (e) { el('ellipse', { cx: f(C[0]), cy: f(C[1]), rx: f(e[0] * KT), ry: f(e[1] * KT), transform: giro }, traza); });
    el('circle', { cx: f(C[0]), cy: f(C[1]), r: f(RSH * 1.9) }, traza);
    el('path', { d: 'M' + f(C[0] - 820 * KT) + ' ' + f(C[1]) + 'H' + f(C[0] + 820 * KT) + 'M' + f(C[0]) + ' ' + f(C[1] - 470 * KT) + 'V' + f(C[1] + 470 * KT), transform: giro }, traza);
    el('path', { d: 'M' + f(C[0] - 760 * KT) + ' ' + f(C[1] - 175 * KT) + 'H' + f(C[0] + 760 * KT) + 'M' + f(C[0] - 760 * KT) + ' ' + f(C[1] + 175 * KT) + 'H' + f(C[0] + 760 * KT), transform: giro, 'class': 'bn-traza-fina' }, traza);
    [[-560, -175], [560, 175], [-700, 0], [700, 0], [0, -330], [0, 330], [380, -175], [-380, 175]].forEach(function (q) {
      el('path', { d: 'M' + f(C[0] + q[0] * KT - 7) + ' ' + f(C[1] + q[1] * KT) + 'h14M' + f(C[0] + q[0] * KT) + ' ' + f(C[1] + q[1] * KT - 7) + 'v14', transform: giro, 'class': 'bn-cruz' }, traza);
    });
    [].forEach.call(traza.querySelectorAll('*'), function (e, i) { e.setAttribute('pathLength', 1); e.style.setProperty('--d', (1100 + i * 45) + 'ms'); });
    // la mitad cercana del disco pasa por delante de la sombra: ahí el contorno de Hawking queda debajo (máscara)
    var mk = el('mask', { id: 'bn-tapa', maskUnits: 'userSpaceOnUse', x: -2000, y: -2000, width: 6000, height: 6000 }, el('defs', {}, svg));
    el('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: '#fff' }, mk);
    (function () { var o = [], k, t; for (k = 0; k <= 60; k++) { t = Math.PI * (1 + k / 60); o.push(aPantalla(22.5 * Math.cos(t), 0, 22.5 * Math.sin(t))); }
      for (k = 60; k >= 0; k--) { t = Math.PI * (1 + k / 60); o.push(aPantalla(5.9 * Math.cos(t), 0, 5.9 * Math.sin(t))); }
      el('path', { d: 'M' + o.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L') + 'Z', fill: '#000', filter: 'blur(.6px)' }, mk); })();
    var capaHawk = el('g', { 'class': 'bn-hawk', mask: 'url(#bn-tapa)' }, g);
    // borde de Hawking: un trazo violeta finísimo que tiembla rápido alrededor de la sombra (el filo del horizonte aparente)
    var bordeH = el('path', { 'class': 'bn-hawking-borde' }, capaHawk), bordeH2 = el('path', { 'class': 'bn-hawking-borde bn-hawking-borde2' }, capaHawk);
    var NB = 220, jit = new Float32Array(NB), jit2 = new Float32Array(NB);
    function tiembla() {
      var d = '', d2 = '', R = RSH - .2, t = performance.now() / 1000;
      for (var i = 0; i < NB; i++) {
        jit[i] = jit[i] * .55 + (Math.random() - .5) * .9; if (Math.random() < .004) jit[i] += 2.4 + Math.random() * 2;
        jit2[i] = jit2[i] * .7 + (Math.random() - .5) * 1.2;
      }
      for (i = 0; i <= NB; i++) {
        var k = i % NB, a = k / NB * Math.PI * 2, w = .5 * Math.sin(a * 13 + t * 9) + .35 * Math.sin(a * 29 - t * 14);
        var r1 = R + .6 + Math.abs(jit[k] + w), r2 = R + 1.8 + Math.max(jit2[k] * 1.4 + w * .6, -.8);
        d += (i ? 'L' : 'M') + f(C[0] + Math.cos(a) * r1) + ' ' + f(C[1] + Math.sin(a) * r1);
        d2 += (i ? 'L' : 'M') + f(C[0] + Math.cos(a) * r2) + ' ' + f(C[1] + Math.sin(a) * r2);
      }
      bordeH.setAttribute('d', d); bordeH2.setAttribute('d', d2);
      bordeH.setAttribute('opacity', f(.65 + Math.random() * .35)); bordeH2.setAttribute('opacity', f(.15 + Math.random() * .3));
    }
    var hawk = el('g', {}, capaHawk);
    function zona(d) { return el('path', { 'class': 'zona bn-zona', d: d, 'fill-rule': 'evenodd' }, g); }
    function poligono(pts) { return 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L') + 'Z'; }
    function bandaDisco(r0, r1, a0, a1) {   // franja del disco (sin lente) entre radios y ángulos
      var o = [], k; for (k = 0; k <= 24; k++) { var t = (a0 + (a1 - a0) * k / 24); o.push(aPantalla(r1 * Math.cos(t), 0, r1 * Math.sin(t))); }
      for (k = 24; k >= 0; k--) { var t2 = (a0 + (a1 - a0) * k / 24); o.push(aPantalla(r0 * Math.cos(t2), 0, r0 * Math.sin(t2))); }
      return poligono(o);
    }
    // cinco zonas: centro, horizonte (interior de la sombra), borde (filo rojo de Hawking), región de caída (entre la sombra y el
    // borde interno del disco) y disco. Las de la sombra van encima del disco que la cruza por delante.
    // ── zonas exactas: el puntero se clasifica trazando su mismo rayo (igual que el shader), así cada zona es lo que se ve
    var zTodo = zona(anillo(0, 23 * SC)); fig.bnZona = function (x, y) { return clasifica(x, y); };
    function clasifica(x, y) {
      var dx = (x - C[0]) / SC, dy = (y - C[1]) / SC, cr = Math.cos(ROLL), sr = Math.sin(ROLL);
      var bx = cr * dx + sr * dy, by = -(-sr * dx + cr * dy), bb = Math.hypot(bx, by);
      if (bb > 23) return null;
      var ci = Math.cos(INCL), si = Math.sin(INCL);
      var p = [-bx, ci * 40 + si * by, -si * 40 + ci * by], v = [0, -ci, si];
      var cx = p[1] * v[2] - p[2] * v[1], cy = p[2] * v[0] - p[0] * v[2], cz = p[0] * v[1] - p[1] * v[0], h2 = cx * cx + cy * cy + cz * cz;
      function ac(q) { var r = Math.hypot(q[0], q[1], q[2]), k = -3 * h2 / Math.pow(r, 5); return [q[0] * k, q[1] * k, q[2] * k]; }
      var cruce = 0;
      for (var i = 0; i < 400; i++) {
        var r = Math.hypot(p[0], p[1], p[2]);
        if (r < 2.02) break;
        if (r > 48 && p[0] * v[0] + p[1] * v[1] + p[2] * v[2] > 0) break;
        var dt = Math.min(1.1, Math.max(.025, .07 * r - .08)), A = ac(p);
        var vm = [v[0] + A[0] * dt * .5, v[1] + A[1] * dt * .5, v[2] + A[2] * dt * .5], pn = [p[0] + vm[0] * dt, p[1] + vm[1] * dt, p[2] + vm[2] * dt], An = ac(pn);
        if (p[1] * pn[1] < 0) { var k = p[1] / (p[1] - pn[1]), rq = Math.hypot(p[0] + (pn[0] - p[0]) * k, p[2] + (pn[2] - p[2]) * k); if (rq < 22.5) { cruce = rq; break; } }
        p = pn; v = [vm[0] + An[0] * dt * .5, vm[1] + An[1] * dt * .5, vm[2] + An[2] * dt * .5];
      }
      if (cruce >= 6.3 && cruce < 20) return 'disco';   // la primera vez que el rayo atraviesa el plano cae sobre el disco visible
      if (bb < BC * .14) return 'sing';
      if (bb < BC - .12) return 'hor';
      if (bb < BC * 1.08) return 'hawk';
      if (bb < BC * 1.55) return 'caida';
      return null;
    }
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random()); }
    var pares = [], acum = 0;
    function par() {
      // chispas diminutas: nacen en el filo, apenas se alejan unos píxeles y se apagan; su pareja cae hacia dentro
      var a = Math.random() * Math.PI * 2, sale = el('circle', { 'class': 'bn-hq', r: f(.55 + Math.random() * .5) }, hawk), cae = el('circle', { 'class': 'bn-hq bn-hq-cae', r: .5 }, hawk);
      pares.push({ a: a, r0: RSH + 1, d: 4 + Math.random() * 11, vida: .75 + Math.random() * .55, t: 0, sale: sale, cae: cae, da: gauss() * .05 });
    }
    // ── medallones de las notas: una lámina circular a lápiz y aguada con una animación de cada parte.
    // Cada animación sale de la física que cita la nota (geodésicas nulas, luz radial en coordenadas
    // de Eddington–Finkelstein, órbitas de Kepler con ISCO); solo se mueve mientras su nota está abierta.
    var medAnim = [], medN = 0, NS = 'http://www.w3.org/2000/svg';
    function medallon(q, cx, cy, R) {
      var id = 'bnm' + (medN++), defs = el('defs', {}, q), cp = el('clipPath', { id: id }, defs);
      el('circle', { cx: f(cx), cy: f(cy), r: f(R) }, cp);
      el('circle', { 'class': 'med-papel', cx: f(cx), cy: f(cy), r: f(R) }, q);
      var dentro = el('g', { 'clip-path': 'url(#' + id + ')' }, q);
      el('circle', { 'class': 'med-borde', cx: f(cx), cy: f(cy), r: f(R) }, q);
      el('circle', { 'class': 'med-borde2', cx: f(cx), cy: f(cy), r: f(R + 3) }, q);
      return dentro;
    }
    function pie(q, x, y, lineas) {
      q.pie = lineas.join(' ');
      var t = el('text', { 'class': 'med-c', x: f(x), y: f(y) }, q);
      lineas.forEach(function (l, k) { var s = el('tspan', { x: f(x), dy: k ? 13 : 0 }, t); s.textContent = l; });
    }
    function etiqueta(q, x, y, s, cl) { var t = el('text', { 'class': 'med-k' + (cl ? ' ' + cl : ''), x: f(x), y: f(y) }, q); t.textContent = s; return t; }
    function anima(q, fn) { medAnim.push({ n: q, f: fn }); }
    function temp(u) {   // u: 0 caliente (crema) … 1 frío (rojizo), la paleta del disco
      var A = [[255, 244, 218], [252, 204, 138], [240, 140, 61], [179, 77, 33], [102, 56, 56]], k = Math.min(3.999, Math.max(0, u) * 4), i = Math.floor(k), w = k - i;
      return 'rgb(' + [0, 1, 2].map(function (c) { return Math.round(A[i][c] + (A[i + 1][c] - A[i][c]) * w); }).join(',') + ')';
    }
    var R0 = 44;
    var MED = {
      // 1 · pozo de curvatura y un cuerpo que cae estirándose por la marea (∝ 1/r³)
      sing: function (q, x0, y0) {
        var cx = x0 + 56, cy = y0 + 46, m = medallon(q, cx, cy, R0), radios = [46, 36, 28, 22, 17, 13, 10, 7.5, 5.5, 4], prof = function (r) { return -24 + 520 / (r + 8); };
        radios.forEach(function (r, k) { el('ellipse', { 'class': k % 3 ? 'med-tr' : 'med-tr med-tr-may', cx: f(cx), cy: f(cy + prof(r)), rx: f(r), ry: f(r * .28) }, m); });
        for (var j = 0; j < 12; j++) {
          var a = j / 12 * Math.PI * 2, d = '';
          for (var r = 46; r >= 3.5; r -= 1.5) d += (r === 46 ? 'M' : 'L') + f(cx + r * Math.cos(a)) + ' ' + f(cy + prof(r) + r * .28 * Math.sin(a));
          el('path', { 'class': 'med-tr', d: d }, m);
        }
        var fondo = cy + prof(3.5) + 2;
        el('line', { 'class': 'med-eje', x1: f(cx), y1: f(cy + prof(4)), x2: f(cx), y2: f(fondo + 6) }, m);
        el('circle', { 'class': 'med-sing', cx: f(cx), cy: f(fondo + 6), r: 2.4 }, m);
        var cuerpo = el('ellipse', { 'class': 'med-cuerpo', rx: 3, ry: 3 }, m);
        etiqueta(m, cx + 5, fondo + 9, 'r → 0');
        pie(q, x0 + 116, y0 + 24, ['Un cuerpo que cae se estira:', 'la marea crece como 1/r³ y', 'en r = 0 se vuelve infinita.', 'Pozo ilustrativo, no a escala.']);
        var ang = 2.2;
        anima(q, function (t) {
          var u = (t % 4.2) / 4.2, r = 42 * Math.pow(1 - u, 1.6) + 3.6, a = ang + u * 3.2;
          var px = cx + r * Math.cos(a), py = cy + prof(r) + r * .28 * Math.sin(a);
          var est = Math.min(5, Math.pow(14 / r, 1.5)), rad = Math.atan2(prof(r) - prof(r + 2) , 2) * 180 / Math.PI;
          cuerpo.setAttribute('cx', f(px)); cuerpo.setAttribute('cy', f(py));
          cuerpo.setAttribute('rx', f(2.6 / Math.sqrt(est))); cuerpo.setAttribute('ry', f(2.6 * est));
          var dx = cx - px, dy = (fondo + 6) - py;
          cuerpo.setAttribute('transform', 'rotate(' + f(Math.atan2(dy, dx) * 180 / Math.PI - 90) + ' ' + f(px) + ' ' + f(py) + ')');
          cuerpo.setAttribute('opacity', f(u > .9 ? (1 - u) * 10 : Math.min(1, u * 12)));
        });
      },
      // 2 · pares de partículas junto al horizonte: una cae, la otra escapa
      hawk: function (q, x0, y0) {
        var cx = x0 + 56, cy = y0 + 46, m = medallon(q, cx, cy, R0), Rh = 160, hy = cy + 12;
        var hc = hy + Rh, d = 'M' + f(cx - 60) + ' ' + f(hc - Math.sqrt(Rh * Rh - 3600)) + ' A' + Rh + ' ' + Rh + ' 0 0 1 ' + f(cx + 60) + ' ' + f(hc - Math.sqrt(Rh * Rh - 3600));
        el('path', { 'class': 'med-dentro', d: d + ' L' + f(cx + 60) + ' ' + f(cy + 60) + ' L' + f(cx - 60) + ' ' + f(cy + 60) + 'Z' }, m);
        el('path', { 'class': 'med-hor', d: d }, m);
        for (var k = 1; k < 4; k++) el('path', { 'class': 'med-tr', d: 'M' + f(cx - 60) + ' ' + f(hc - Math.sqrt(Rh * Rh - 3600) + k * 7) + ' A' + Rh + ' ' + Rh + ' 0 0 1 ' + f(cx + 60) + ' ' + f(hc - Math.sqrt(Rh * Rh - 3600) + k * 7) }, m);
        etiqueta(m, cx - 34, hy + 13, 'horizonte', 'med-k-claro');
        pie(q, x0 + 116, y0 + 24, ['El vacío crea pares; junto al', 'horizonte uno cae y el otro', 'escapa: el agujero radia', 'y pierde masa muy despacio.']);
        var pares = [0, 1, 2].map(function (i) {
          var g2 = el('g', {}, m);
          return { g: g2, lazo: el('ellipse', { 'class': 'med-lazo' }, g2), sale: el('circle', { 'class': 'med-sale', r: 2.3 }, g2), cae: el('circle', { 'class': 'med-cae', r: 2 }, g2), fase: i / 3, x: 0, sem: i * 7.1 };
        });
        anima(q, function (t) {
          pares.forEach(function (p) {
            var c = t / 2.8 + p.fase, u = c % 1, ciclo = Math.floor(c);
            if (ciclo !== p.ciclo) { p.ciclo = ciclo; var h = Math.sin(ciclo * 12.9898 + p.sem) * 43758.5; p.x = cx - 26 + (h - Math.floor(h)) * 52; }
            var yh = hc - Math.sqrt(Rh * Rh - (p.x - cx) * (p.x - cx)), y0p = yh - 4;
            var sep = u < .25 ? u / .25 * 3 : 3, ys = y0p - (u < .25 ? sep : 3 + (u - .25) * 70), yc = y0p + (u < .25 ? sep * .6 : 2 + (u - .25) * 36);
            p.sale.setAttribute('cx', f(p.x + (u < .25 ? -sep : -3))); p.sale.setAttribute('cy', f(ys));
            p.cae.setAttribute('cx', f(p.x + (u < .25 ? sep : 3))); p.cae.setAttribute('cy', f(yc));
            p.lazo.setAttribute('cx', f(p.x)); p.lazo.setAttribute('cy', f(y0p)); p.lazo.setAttribute('rx', f(sep + 1.5)); p.lazo.setAttribute('ry', f(sep * .7 + 1));
            p.lazo.setAttribute('opacity', f(u < .3 ? .8 * (1 - u / .3) : 0));
            p.sale.setAttribute('opacity', f(u < .05 ? u * 20 : (u > .85 ? (1 - u) / .15 : 1)));
            p.cae.setAttribute('opacity', f(u < .05 ? u * 20 : Math.max(0, 1 - (u - .25) * 2.2)));
          });
        });
      },
      // 3 · pulsos de luz hacia afuera: dr/dv = ½(1 − rₛ/r) (coordenadas de Eddington–Finkelstein)
      hor: function (q, x0, y0) {
        var cx = x0 + 56, cy = y0 + 46, m = medallon(q, cx, cy, R0), L = 34, xh = cx - 20, Rh = 150, xc = xh - Rh;
        var arco = function (rr) { return 'M' + f(xc + Math.sqrt(rr * rr - 3600)) + ' ' + f(cy - 60) + ' A' + rr + ' ' + rr + ' 0 0 1 ' + f(xc + Math.sqrt(rr * rr - 3600)) + ' ' + f(cy + 60); };
        el('path', { 'class': 'med-dentro', d: arco(Rh) + ' L' + f(cx - 60) + ' ' + f(cy + 60) + ' L' + f(cx - 60) + ' ' + f(cy - 60) + 'Z' }, m);
        el('path', { 'class': 'med-hor', d: arco(Rh) }, m);
        [1.5, 2].forEach(function (r) { el('path', { 'class': 'med-tr', d: arco(Rh + (r - 1) * L) }, m); });
        var X = function (r, y) { return xc + Math.sqrt(Math.pow(Rh + (r - 1) * L, 2) - y * y); };
        etiqueta(m, X(1, 0) + 2, cy + 39, 'rₛ'); etiqueta(m, X(2, 0) - 3, cy + 39, '2rₛ');
        var filas = [[1.9, -24], [1.12, -8], [1, 8], [.88, 24]].map(function (fl) {
          var y = cy + fl[1], g2 = el('g', {}, m), x = X(fl[0], fl[1]);
          el('circle', { 'class': 'med-emisor', cx: f(x), cy: f(y), r: 1.6 }, g2);
          return { r0: fl[0], y: y, dy: fl[1], estela: el('line', { 'class': 'med-estela', x1: f(x), y1: f(y), x2: f(x), y2: f(y) }, g2), foton: el('circle', { 'class': 'med-foton', cx: f(x), cy: f(y), r: 2 }, g2) };
        });
        pie(q, x0 + 116, y0 + 24, ['Luz emitida hacia afuera:', 'lejos escapa, cerca tarda,', 'en rₛ se queda quieta y', 'dentro también cae.']);
        anima(q, function (t) {
          var v = (t % 5) / 5 * 9;
          filas.forEach(function (p) {
            var r = p.r0, n = Math.ceil(v / .02), h = v / Math.max(n, 1);
            for (var i = 0; i < n && r > .25 && r < 4; i++) r += .5 * (1 - 1 / r) * h;
            var x = X(Math.max(r, .25), p.dy);
            p.foton.setAttribute('cx', f(x)); p.estela.setAttribute('x2', f(x));
            var fin = (t % 5) / 5, op = fin > .9 ? (1 - fin) * 10 : 1;
            p.foton.setAttribute('opacity', f(op * (r < .3 ? 0 : 1))); p.estela.setAttribute('opacity', f(op * .7));
          });
        });
      },
      // 4 · geodésicas nulas reales en el plano: d²u/dφ² = 3Mu² − u, con b alrededor de √27 M
      fot: function (q, x0, y0) {
        var cx = x0 + 56, cy = y0 + 46, m = medallon(q, cx, cy, R0), s = 4.6;
        el('circle', { 'class': 'med-dentro', cx: f(cx), cy: f(cy), r: f(2 * s) }, m);
        el('circle', { 'class': 'med-esfera', cx: f(cx), cy: f(cy), r: f(3 * s) }, m);
        etiqueta(m, cx + 3 * s + 2, cy - 3 * s - 1, '1,5 rₛ');
        function rayo(b) {
          var R = 12, ph = Math.asin(b / R), u = 1 / R, du = Math.cos(ph) / b, h = .004, pts = [], k = 0;
          while (k++ < 9000) {
            var a = 3 * u * u - u; u += du * h + .5 * a * h * h; var a2 = 3 * u * u - u; du += .5 * (a + a2) * h; ph += h;
            if (k % 6 === 0) pts.push([cx - Math.cos(ph) / u * s, cy + Math.sin(ph) / u * s]);
            if (u > .5 || u < 1 / R) break;
          }
          return pts;
        }
        var rayos = [[4.4, 'cae'], [5.205, 'gira'], [5.6, 'sale'], [7.2, 'sale']].map(function (rb, i) {
          var pts = rayo(rb[0]);
          var d = 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L');
          var largo = 0; for (var k = 1; k < pts.length; k++) largo += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
          el('path', { 'class': 'med-rayo-t', d: d }, m);
          var c = el('path', { 'class': 'med-rayo med-rayo-' + rb[1], d: d, pathLength: 1 }, m);
          return { c: c, largo: largo, fase: i * .23 };
        });
        var orbita = el('circle', { 'class': 'med-foton', r: 1.8 }, m);
        pie(q, x0 + 116, y0 + 24, ['Rayos de luz reales con', 'parámetro b cerca de √27 M:', 'uno cae, otro da vueltas', 'en 1,5 rₛ antes de escapar.']);
        anima(q, function (t) {
          rayos.forEach(function (r) { var dur = r.largo / 70 + 1, u = ((t / dur + r.fase) % 1) * 1.25 - .1; r.c.setAttribute('stroke-dashoffset', f(-u)); });
          var a = t * 1.9; orbita.setAttribute('cx', f(cx + 3 * s * Math.cos(a))); orbita.setAttribute('cy', f(cy - 3 * s * Math.sin(a)));
        });
      },
      // 5 · gas en órbita de Kepler (Ω ∝ r^−3/2) que se acerca despacio y, pasada la ISCO (3 rₛ), cae en picada
      disco: function (q, x0, y0) {
        var cx = x0 + 56, cy = y0 + 46, m = medallon(q, cx, cy, R0), s = 2.1, k2 = .42;
        el('rect', { 'class': 'med-aguada', x: f(cx - R0), y: f(cy - R0), width: f(2 * R0), height: f(2 * R0) }, m);
        [8, 11, 14, 17, 20].forEach(function (r) { el('ellipse', { 'class': 'med-tr', cx: f(cx), cy: f(cy), rx: f(r * s), ry: f(r * s * k2) }, m); });
        el('ellipse', { 'class': 'med-isco', cx: f(cx), cy: f(cy), rx: f(6 * s), ry: f(6 * s * k2) }, m);
        el('circle', { 'class': 'med-dentro', cx: f(cx), cy: f(cy), r: f(2 * s) }, m);
        etiqueta(m, cx + 6 * s - 6, cy + 6 * s * k2 + 8, 'ISCO', 'med-k-claro');
        var gas = [];
        for (var i = 0; i < 26; i++) gas.push({ r: 7 + Math.random() * 14, a: Math.random() * 6.283, el: el('path', { 'class': 'med-gas' }, m), cola: [] });
        pie(q, x0 + 116, y0 + 24, ['Kepler, Ω² = GM/r³: lo de', 'adentro gira más rápido y', 'está más caliente. Bajo 3 rₛ', 'no hay órbita estable: cae.']);
        var tPrev = null;
        anima(q, function (t) {
          var dt = tPrev == null ? 0 : Math.min(.05, t - tPrev); tPrev = t;
          gas.forEach(function (g2) {
            var w = 4.2 * Math.pow(6 / g2.r, 1.5), vr = g2.r > 6 ? -.35 : -4.5 * (6.3 - g2.r) - .6;
            g2.a += w * dt; g2.r += vr * dt;
            if (g2.r < 2.05) { g2.r = 19 + Math.random() * 2.5; g2.a = Math.random() * 6.283; g2.cola = []; }
            var p = [cx + g2.r * s * Math.cos(g2.a), cy + g2.r * s * k2 * Math.sin(g2.a)];
            g2.cola.push(p); if (g2.cola.length > 7) g2.cola.shift();
            g2.el.setAttribute('d', 'M' + g2.cola.map(function (c) { return f(c[0]) + ' ' + f(c[1]); }).join(' L'));
            g2.el.setAttribute('stroke', temp((g2.r - 4) / 17));
            g2.el.setAttribute('opacity', f(Math.min(1, (21.5 - g2.r) / 2)));
          });
        });
      }
    };
    (function bucleMed() {
      var t = performance.now() / 1000;
      if (!window.__bnPausa || window.__bnMedT != null) {
        var tt = window.__bnMedT != null ? window.__bnMedT : t;
        medAnim.forEach(function (a) { if (a.n.closest('.nota').classList.contains('ver')) a.f(tt); });
      }
      requestAnimationFrame(bucleMed);
    })();
    return {
      tick: function (dt) {
        tiempo += dt;
        acum += dt; while (acum > .045) { acum -= .045; par(); }
        for (var i = pares.length - 1; i >= 0; i--) {
          var p = pares[i]; p.t += dt; p.a += p.da * dt;
          var u = p.t / p.vida, sal = 1 - (1 - u) * (1 - u), r = p.r0 + p.d * sal, rc = p.r0 - 1 - p.d * .35 * u * u;
          var luz = u < .12 ? u / .12 : (1 - u) * (1 - u) / .77;
          p.sale.setAttribute('cx', f(C[0] + Math.cos(p.a) * r)); p.sale.setAttribute('cy', f(C[1] + Math.sin(p.a) * r)); p.sale.setAttribute('opacity', f(Math.max(0, luz))); 
          p.cae.setAttribute('cx', f(C[0] + Math.cos(p.a + .01) * rc)); p.cae.setAttribute('cy', f(C[1] + Math.sin(p.a + .01) * rc)); p.cae.setAttribute('opacity', f(Math.max(0, luz * .6)));
          if (u >= 1) { hawk.removeChild(p.sale); hawk.removeChild(p.cae); pares.splice(i, 1); }
        }
        salida('rₛ = 2GM/c²', 'sombra b = √27 GM/c² ≈ 2,6 rₛ · ISCO 3 rₛ');
      },
      notas: function () {
        // ficha de lectura: una sola ficha HTML en la columna oscura, debajo del menú (nunca tapa el dibujo ni la navegación).
        // En el dibujo solo queda un aro en la zona señalada y un rótulo corto a su lado: sin guías que crucen la escena.
        var sec = fig.closest('.mc') || fig.parentNode, sobre = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sobre.setAttribute('class', 'bn-notas'); sobre.setAttribute('aria-hidden', 'true'); sec.appendChild(sobre);
        function alinea() {
          var v = svg.getAttribute('viewBox'); if (v) sobre.setAttribute('viewBox', v);
          var rs = svg.getBoundingClientRect(), rm = sec.getBoundingClientRect();
          sobre.style.left = (rs.left - rm.left) + 'px'; sobre.style.top = (rs.top - rm.top) + 'px'; sobre.style.width = rs.width + 'px'; sobre.style.height = rs.height + 'px';
        }
        var capaN = el('g', { 'class': 'notas' }, sobre);
        var ficha = document.createElement('aside'); ficha.className = 'bn-ficha'; ficha.setAttribute('aria-live', 'polite'); sec.appendChild(ficha);
        var pista = document.createElement('p'); pista.className = 'bn-pista'; pista.textContent = 'Pasa el cursor por el agujero negro: cinco partes'; sec.appendChild(pista);
        var lista = sec.querySelector('.mc-lista');
        function ubica() {
          if (!lista) return; var rl = lista.getBoundingClientRect(), rm = sec.getBoundingClientRect();
          var x = rl.left - rm.left + 22, y = rl.bottom - rm.top + 34;
          pista.style.left = x + 'px'; pista.style.top = y + 'px';
        }
        ubica(); window.addEventListener('resize', ubica); setTimeout(ubica, 400);
        var nN = 0;
        // cada zona: punto en la zona, raya hasta el rótulo y, justo debajo del rótulo, su ficha
        function nota(piezas, o) {
          var a = o.ancla, et = o.rotulo, izq = o.lado ? o.lado === 'izq' : et[0] < a[0], n = el('g', { 'class': 'nota nota-marca' }, capaN);
          el('circle', { cx: f(a[0]), cy: f(a[1]), r: 2.4 }, n);
          el('circle', { 'class': 'anillo-nota', cx: f(a[0]), cy: f(a[1]), r: 5 }, n);
          var ux = et[0] - a[0], uy = et[1] - a[1], L = Math.hypot(ux, uy); ux /= L; uy /= L;
          el('path', { d: 'M' + f(a[0] + ux * 5) + ' ' + f(a[1] + uy * 5) + ' L' + f(et[0] - ux * 6) + ' ' + f(et[1] - uy * 6), pathLength: 1 }, n);
          var rot = el('text', { 'class': 'nota-rot', x: f(et[0]), y: f(et[1] + 3.5), 'text-anchor': izq ? 'end' : 'start' }, n); rot.textContent = o.titulo;
          if (o.extra) o.extra(n);
          var c = document.createElement('div'); c.className = 'bn-nota nota'; c.id = 'bn-nota-' + (nN++);
          var dato = document.createElement('p'); dato.className = 'bn-nota-dato'; dato.textContent = o.dato;
          var que = document.createElement('p'); que.className = 'bn-nota-que'; que.textContent = o.que;
          var dib = document.createElement('p'); dib.className = 'bn-nota-dib'; var dk = document.createElement('span'); dk.textContent = 'En el dibujo'; dib.appendChild(dk); dib.appendChild(document.createTextNode(o.dibujo));
          var med = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); med.setAttribute('viewBox', '6 -2 100 100'); med.setAttribute('class', 'bn-med'); med.setAttribute('aria-hidden', 'true');
          var gq = el('g', {}, med); MED[o.med](gq, 0, 0);
          var pAnim = document.createElement('p'); pAnim.className = 'bn-nota-anim'; pAnim.textContent = gq.pie || '';
          var fila = document.createElement('div'); fila.className = 'bn-nota-fila'; fila.appendChild(med); fila.appendChild(pAnim);
          [dato, que, dib, fila].forEach(function (e) { c.appendChild(e); }); ficha.appendChild(c);
          function bajoRotulo() {   // la ficha cuelga del rótulo: alineada a su borde y pegada debajo, sin salirse de la sección
            var rr = rot.getBoundingClientRect(), rm = sec.getBoundingClientRect(), w = c.offsetWidth, h = c.offsetHeight;
            var x = izq ? rr.right - rm.left - w + 4 : rr.left - rm.left - 4, y = rr.bottom - rm.top + 12;
            x = Math.max(16, Math.min(x, rm.width - w - 16)); y = Math.min(y, rm.height - h - 16);
            c.style.left = x + 'px'; c.style.top = y + 'px';
          }
          var foco = o.foco || [];
          NOTAS[o.k] = {
            on: function () {
              alinea(); n.classList.add('ver'); bajoRotulo(); c.classList.add('ver'); sec.classList.add('bn-leyendo');
              dimMeta[0] = o.dim[0]; dimMeta[1] = o.dim[1]; hkMeta = o.k === 'hawk' ? 1 : 0;
              foco.forEach(function (e) { e.classList.add('foco'); }); svg.classList.add('nota-on');
            },
            off: function () {
              n.classList.remove('ver'); c.classList.remove('ver');
              foco.forEach(function (e) { e.classList.remove('foco'); });
            }
          };
        }
        var NOTAS = {}, activa = null, pend = null;
        function cambia(k) {
          if (k === activa) return;
          if (activa) NOTAS[activa].off();
          activa = k;
          if (k) NOTAS[k].on();
          else { dimMeta[0] = dimMeta[1] = 1; hkMeta = 0; sec.classList.remove('bn-leyendo'); svg.classList.remove('nota-on'); }
        }
        zTodo.classList.add('con-nota');
        zTodo.addEventListener('pointermove', function (e) {
          var m = svg.getScreenCTM(); if (!m) return; var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; pt = pt.matrixTransform(m.inverse());
          if (pend == null) requestAnimationFrame(function () { cambia(clasifica(pend.x, pend.y)); pend = null; });
          pend = pt;
        });
        zTodo.addEventListener('pointerleave', function () { pend = null; cambia(null); });
        // un punto que de verdad cae en la zona: se recorre el radio en esa dirección y se toma el centro del tramo
        function buscar(k, ang, r0, r1) {
          var ini = -1, fin = -1;
          for (var r = r0; r <= r1; r += 1.5) { var q = polar(ang, r), z = clasifica(q[0], q[1]); if (z === k) { if (ini < 0) ini = r; fin = r; } else if (ini >= 0) break; }
          return polar(ang, ini < 0 ? r0 : (ini + fin) / 2);
        }
        function polar(ang, r) { return [C[0] + Math.cos(ang) * r, C[1] + Math.sin(ang) * r]; }
        var RS = 2 * SC, RF = 3 * SC, xI = C[0] - RSH - 62, xD = C[0] + RSH + 62;   // rₛ a escala (sin lente) y columnas de rótulos
        nota(null, { k: 'sing', ancla: [C[0], C[1]], rotulo: [xI, C[1] + 4], titulo: 'Singularidad', med: 'sing', dim: [.18, .35],
          dato: 'r = 0',
          que: 'El centro. La relatividad general predice que ahí la curvatura del espacio-tiempo se vuelve infinita: es la señal de que la teoría deja de valer, y se espera que una teoría cuántica de la gravedad la describa.',
          dibujo: 'un punto. Nadie puede verla: queda siempre dentro del horizonte.' });
        nota(null, { k: 'hor', ancla: polar(-2.2, RS), rotulo: [xI, C[1] - 64], titulo: 'Horizonte de eventos', med: 'hor', dim: [.18, .35],
          dato: 'rₛ = 2GM/c²',
          que: 'La frontera sin retorno: lo que la cruza, ni siquiera la luz, vuelve a salir. No es una superficie material, solo un radio. Para el Sol, rₛ ≈ 3 km.',
          dibujo: 'la esfera punteada es rₛ a escala, con su ecuador en el plano del disco. Los rayos que caen se frenan y se apagan al acercarse: vistos desde lejos, nunca llegan a cruzarla. La sombra negra es unas 2,6 veces mayor (√27 GM/c²) porque la gravedad curva la luz que pasa cerca.',
          extra: function (n) {
            // la esfera rₛ en perspectiva: contorno, ecuador en el plano del disco y un meridiano; la mitad de atrás más tenue
            function curva(fn, a0, a1) { var d = ''; for (var k = 0; k <= 48; k++) { var t = a0 + (a1 - a0) * k / 48, q = fn(t); d += (k ? 'L' : 'M') + f(q[0]) + ' ' + f(q[1]); } return d; }
            var ecu = function (t) { return aPantalla(2 * Math.cos(t), 0, 2 * Math.sin(t)); };
            var FI = 1.05, mer = function (t) { return aPantalla(2 * Math.sin(t) * Math.cos(FI), 2 * Math.cos(t), 2 * Math.sin(t) * Math.sin(FI)); };
            var gR = el('g', { 'class': 'bn-rayos' }, n);
            el('path', { 'class': 'bn-rs-atras', d: curva(ecu, 0, Math.PI) }, n);          // z > 0: detrás
            el('path', { 'class': 'bn-rs-atras', d: curva(mer, 0, Math.PI) }, n);
            el('circle', { 'class': 'bn-rs', cx: f(C[0]), cy: f(C[1]), r: f(RS), pathLength: 60 }, n);
            el('path', { 'class': 'bn-rs bn-rs-ecu', d: curva(ecu, Math.PI, 2 * Math.PI), pathLength: 30 }, n);   // z < 0: delante
            el('path', { 'class': 'bn-rs bn-rs-ecu', d: curva(mer, Math.PI, 2 * Math.PI), pathLength: 30 }, n);
            var t = el('text', { 'class': 'nota-rot bn-rs-k', x: f(C[0] + RS * .74 + 4), y: f(C[1] + RS * .74 + 9) }, n); t.textContent = 'rₛ';
            // rayos de luz que caen: vistos desde lejos se frenan y se apagan al llegar a rₛ (v ∝ 1 − rₛ/r)
            var rayos = [];
            for (var k = 0; k < 16; k++) rayos.push({ l: el('line', { 'class': 'bn-rayo' }, gR), r: 0, a: 0, vivo: false, w: Math.random() * 2 });
            var antes = 0;
            (function cae(ts) {
              requestAnimationFrame(cae);
              if (!n.classList.contains('ver')) { antes = 0; return; }
              var dt = antes ? Math.min(.05, (ts - antes) / 1000) : 0; antes = ts;
              rayos.forEach(function (o) {
                if (!o.vivo) { o.w -= dt; if (o.w > 0) return; o.vivo = true; o.a = Math.random() * Math.PI * 2; o.r = RSH * (.82 + Math.random() * .12); o.L = 7 + Math.random() * 9; }
                o.r -= dt * 150 * (1 - RS / o.r);
                var fr = Math.max(0, (o.r - RS) / (RSH * .85 - RS)), luz = Math.min(1, fr * 1.6) * Math.min(1, (RSH * .9 - o.r) / 8 + .2), L = o.L * (.25 + .75 * fr);
                var c = Math.cos(o.a), s2 = Math.sin(o.a);
                o.l.setAttribute('x1', f(C[0] + c * o.r)); o.l.setAttribute('y1', f(C[1] + s2 * o.r));
                o.l.setAttribute('x2', f(C[0] + c * (o.r + L))); o.l.setAttribute('y2', f(C[1] + s2 * (o.r + L)));
                o.l.setAttribute('opacity', f(Math.max(0, luz)));
                if (fr < .03) { o.vivo = false; o.w = Math.random() * .6; o.l.setAttribute('opacity', 0); }
              });
            })(0);
          } });
        nota(null, { k: 'hawk', ancla: buscar('hawk', -.55, RSH * .85, RSH * 1.2), rotulo: [xD, C[1] - RSH * .78], titulo: 'Borde · radiación de Hawking', med: 'hawk', dim: [.18, .35], foco: [capaHawk],
          dato: 'T = ħc³ / 8πGMk_B',
          que: 'Hawking (1974): por efectos cuánticos junto al horizonte, el agujero emite como un cuerpo negro y pierde masa muy despacio. Para una masa solar T ≈ 6 × 10⁻⁸ K; nunca se ha medido.',
          dibujo: 'el filo rojo y las chispas son simbólicos: esa radiación sería invisible.' });
        nota(null, { k: 'caida', ancla: buscar('caida', -2.0, RSH * 1.0, RSH * 1.7), rotulo: [xI, C[1] - RSH * 1.42], titulo: 'Región de caída', med: 'fot', dim: [.45, .45],
          dato: 'rₛ < r < 3 rₛ',
          que: 'Entre el borde interno del disco (la órbita estable más interna, ISCO, en 3 rₛ) y el horizonte ya no hay órbitas estables: el gas se precipita en espiral. En la literatura se llama plunging region. Dentro está la esfera de fotones, en 1,5 rₛ, donde la luz puede orbitar.',
          dibujo: 'la franja entre la sombra y el disco. La línea punteada es la esfera de fotones a escala; vista a través de la lente se agranda justo hasta el borde de la sombra.',
          extra: function (n) {
            el('circle', { 'class': 'bn-rs', cx: f(C[0]), cy: f(C[1]), r: f(RF), pathLength: 60 }, n);
            var t = el('text', { 'class': 'nota-rot bn-rs-k', x: f(C[0] - RF * .74 - 4), y: f(C[1] + RF * .74 + 10), 'text-anchor': 'end' }, n); t.textContent = '1,5 rₛ';
          } });
        nota(null, { k: 'disco', ancla: buscar('disco', Math.atan2(-.8, 2.6), RSH * 2.2, RSH * 3.2), rotulo: [C[0] + RSH * 2.55, C[1] - RSH * .33], lado: 'der', titulo: 'Disco de acreción', med: 'disco', dim: [1, .3],
          dato: 'r ≥ 3 rₛ (ISCO)',
          que: 'Gas que gira y cae poco a poco; la fricción lo calienta hasta brillar. Por dentro gira más rápido y está más caliente.',
          dibujo: 'el lado que se acerca a nosotros brilla más (Doppler relativista), y el disco de atrás asoma arriba y abajo de la sombra por la lente gravitacional.' });
      }
    };
  }

  // ═════════ II · Mecánica cuántica: Stern–Gerlach ═════════
  function escenaSternGerlach(svg, salida) {
    var s = 4.7, P = camara(920, 476, s, 38), g = el('g', {}, svg), ZB = 16, orden = 0;
    // cada pieza entra desde abajo (+) o desde arriba (−) cada vez que se muestra la escena
    function pieza(dy) { return el('g', { 'class': 'pieza', style: '--dy:' + dy + 'px;--d:' + (120 + orden++ * 45) + 'ms' }, g); }
    function arrollamiento(q, x0, x1, y, z0, z1, n) { for (var k = 1; k < n; k++) { var z = z0 + (z1 - z0) * k / n; linea(q, P(x0, y, z), P(x1, y, z), 'espira'); } }

    // ── banco óptico
    var b0 = pieza(120);
    sombraPlanta(b0, P, -89, -31, 103, 31, -12);
    [[-80, -28], [94, -28], [-80, 28], [94, 28]].forEach(function (q) { caja(b0, P, q[0] - 3, q[1] - 3, -12, 6, 6, 4, 'lo'); });
    caja(b0, P, -86, -30, -8, 186, 60, 5, 'lo');
    for (var v = 0; v < 5; v++) { var vt = []; for (var xv = -86; xv <= 100; xv += 3) vt.push(P(xv, 30, -7.2 + v * .9 + .28 * Math.sin(xv * .09 + v * 1.7) + .15 * Math.sin(xv * .31 + v))); ruta(b0, vt, 'veta'); }
    caja(b0, P, -84, -26, -3, 182, 52, 3, 'mid');
    regla(b0, P, -80, 94, 26, -1.5, 2, 5);
    linea(b0, P(-84, 0, 0), P(98, 0, 0), 'eje-optico');
    [[-82, -24], [96, -24], [-82, 24], [96, 24]].forEach(function (q) { tornillo(b0, P(q[0], q[1], 0)); });
    // la banqueta solo responde en su tramo central (no en el extremo bajo el menú)
    b0.style.pointerEvents = 'none';
    poly(b0, [P(-20, -30, 0), P(60, -30, 0), P(60, 30, 0), P(60, 30, -12), P(-20, 30, -12), P(-20, 30, 0)], 'zona').style.pointerEvents = 'all';

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
    // boquilla: tubo corto sobre el eje del haz, con el orificio de salida
    function boquilla(q, cortada) {
      var nx = -P.ux[1], ny = P.ux[0], tA = Math.atan2(-ny, P.uy[0] * nx + P.uy[1] * ny) * 180 / Math.PI;   // borde del manto visto desde la cámara
      // tubo horizontal sobre el eje del haz (eje x). El aro vive en el plano y-z; desde la cámara
      // se ven la tapa de salida (+x) y el manto con t ∈ (−45°, 135°). Cortada: se quita la mitad
      // y > 0 (el mismo cuadrante que el horno) y queda a la vista la sección en el plano y = 0.
      function aro(x, r, t0, t1, n) { var o = []; for (var k = 0; k <= n; k++) { var t = (t0 + (t1 - t0) * k / n) * Math.PI / 180; o.push(P(x, r * Math.cos(t), ZB + r * Math.sin(t))); } return o; }
      function tubo(xa, xb, r, ri, tono, sombra) {
        var c = el('g', { 'class': 's ' + tono }, q);
        if (!cortada) {
          poly(c, aro(xa, r, 0, 360, 36), 'sd');                                   // fondo (solo asoma su borde)
          poly(c, aro(xa, r, tA, tA + 180, 24).concat(aro(xb, r, tA + 180, tA, 24)), 'fr'); // manto visible
          if (sombra) poly(c, aro(xa, r, tA, tA + 60, 10).concat(aro(xb, r, tA + 60, tA, 10)), 'cil-sombra');
          linea(c, aro(xa + .3, r, tA + 145, tA + 145, 1)[0], aro(xb - .3, r, tA + 145, tA + 145, 1)[0], 'brillo-cil');
          poly(c, aro(xb, r, 0, 360, 36), 'sd');                                   // tapa que mira a +x
          return c;
        }
        poly(c, aro(xa, r, 90, tA + 180, 6).concat(aro(xb, r, tA + 180, 90, 6)), 'fr');      // franja superior de la mitad trasera
        poly(c, aro(xb, r, 90, 270, 18).concat(aro(xb, ri, 270, 90, 18)), 'sd');   // media corona de la tapa
        [[ri, r], [-r, -ri]].forEach(function (b) {                                // sección de la pared (arriba y abajo)
          poly(q, [P(xa, 0, ZB + b[0]), P(xb, 0, ZB + b[0]), P(xb, 0, ZB + b[1]), P(xa, 0, ZB + b[1])], 'hc hc-acero hc-A');
        });
        poly(q, [P(xa, 0, ZB - ri), P(xb, 0, ZB - ri), P(xb, 0, ZB + ri), P(xa, 0, ZB + ri)], 'hc-canal');   // el canal sigue
        return c;
      }
      var XF = -62.4, XB0 = -61.8, X1 = -57.4, RI = .8;
      tubo(XF, XB0, 2.9, RI, 'mid', false);                                      // brida contra la carcasa
      [20, 140, 260].forEach(function (t) { if (cortada && (t < 90 || t > 270)) return; var p0 = aro(XB0, 2.4, t, t, 1)[0]; el('circle', { 'class': 'tornillo-m', cx: f(p0[0]), cy: f(p0[1]), r: .9 }, q); });
      tubo(XB0, X1, 1.8, RI, 'lo', true);                                        // cuerpo de la boquilla
      tubo(X1, X1 + .5, 1.5, RI, 'mid', false);                                  // labio de salida
      if (!cortada) poly(q, aro(X1 + .5, RI, 0, 360, 24), 'hueco');              // orificio
      var b = P(X1 + .5, 0, ZB); el('circle', { 'class': 'brasa', cx: f(b[0]), cy: f(b[1]), r: 1.6 }, q);
    }
    boquilla(el('g', { 'class': 'boq-entera' }, h0));
    var rotAg = P(-71, 9, 15); var tAg = el('text', { 'class': 'grabado grande ag-rot', x: f(rotAg[0]), y: f(rotAg[1]) }, h0); tAg.textContent = 'Ag';
    // corte del horno (solo al tocarlo): se quita el cuadrante que mira al lector (x>0, y>0) y quedan
    // a la vista dos caras de corte con las capas reales —carcasa de acero, aislante, resistencia,
    // crisol cerámico, plata fundida— y la cámara de vapor. Todo en la misma cámara isométrica.
    var HX = -71, HY = 0, Z0 = 3, ZT = 27;
    var CAPA = [   // [radio interior, radio exterior, clase]
      [8.6, 9, 'hc-acero'], [6.6, 8.6, 'hc-aislante'], [5.8, 6.6, 'hc-resist'], [5, 5.8, 'hc-crisol']];
    var RC = 5, ZPOOL0 = 6, ZPOOL = 8.5, ZTECHO = 24;
    var hint = el('g', { 'class': 'horno-int' }, h0);
    function Q(x, y, z) { return P(HX + x, HY + y, z); }
    function arco(r, z, a0, a1, n) { var o = []; for (var k = 0; k <= n; k++) { var a = (a0 + (a1 - a0) * k / n) * Math.PI / 180; o.push(Q(r * Math.cos(a), r * Math.sin(a), z)); } return o; }
    // cara de corte: rectángulo en el plano y = 0 (cara A, mira a +y) o x = 0 (cara B, mira a +x)
    function corte(cara, u0, u1, z0, z1, cls) {
      var p = cara === 'A' ? [Q(u0, 0, z0), Q(u1, 0, z0), Q(u1, 0, z1), Q(u0, 0, z1)] : [Q(0, u0, z0), Q(0, u1, z0), Q(0, u1, z1), Q(0, u0, z1)];
      return poly(hint, p, 'hc ' + cls + ' hc-' + cara);
    }
    // 1. lo que queda a la vista detrás: la base bajo el cuadrante quitado
    poly(hint, [Q(0, 0, Z0)].concat(arco(9.5, Z0, -2, 92, 18)), 'hc-base');
    // 2. interior de la cámara: pared cóncava del crisol (90°→360°), charco de plata y vapor
    poly(hint, arco(RC, ZTECHO, 90, 360, 36).concat(arco(RC, ZPOOL, 360, 90, 36)), 'hc-pared');
    poly(hint, [Q(0, 0, ZPOOL)].concat(arco(RC, ZPOOL, 90, 360, 36)), 'hc-plata');
    var brilloPlata = el('ellipse', { 'class': 'hc-reflejo', cx: f(Q(-2, -2, ZPOOL)[0]), cy: f(Q(-2, -2, ZPOOL)[1]), rx: 7, ry: 2.4 }, hint);
    var vapor = el('g', {}, hint);
    // 3. caras de corte, capa por capa, primero B (izquierda) y luego A (derecha)
    ['B', 'A'].forEach(function (c) {
      corte(c, 0, 9, Z0, Z0 + .6, 'hc-acero');                 // fondo de acero
      corte(c, 0, 8.6, Z0 + .6, Z0 + 2.2, 'hc-aislante');      // aislante inferior
      corte(c, 0, RC + .8, Z0 + 2.2, ZPOOL0, 'hc-crisol');      // fondo del crisol
      corte(c, 0, RC, ZPOOL0, ZPOOL, 'hc-plata-c');             // plata fundida cortada
      CAPA.forEach(function (k) { corte(c, k[0], k[1], Z0 + .6, ZT - .6, k[2]); });
      corte(c, 0, RC + .8, ZTECHO, ZTECHO + .8, 'hc-crisol');   // tapa del crisol
      corte(c, 0, 8.6, ZTECHO + .8, ZT - .6, 'hc-aislante');    // aislante superior
      corte(c, 0, 9, ZT - .6, ZT, 'hc-acero');                  // tapa de acero
      corte(c, 0, 10, ZT, ZT + 2.4, 'hc-tapa');                 // tapa exterior
      for (var e = 0; e < 8; e++) {                              // espiras de la resistencia vistas en corte
        var zz = Z0 + 4 + e * 2.3, pc = c === 'A' ? Q(6.2, 0, zz) : Q(0, 6.2, zz);
        el('circle', { 'class': 'hc-espira', cx: f(pc[0]), cy: f(pc[1]), r: 1.5 }, hint);
      }
      for (var fb = 0; fb < 7; fb++) {                           // fibra del aislante
        var zf = Z0 + 5 + fb * 2.6, a1 = c === 'A' ? Q(7, 0, zf) : Q(0, 7, zf), a2 = c === 'A' ? Q(8.2, 0, zf + .7) : Q(0, 8.2, zf + .7);
        linea(hint, a1, a2, 'hc-fibra');
      }
    });
    // orificio de efusión: atraviesa crisol, aislante y carcasa hacia la boquilla (cara A, z = ZB)
    poly(hint, [Q(RC, 0, ZB - .8), Q(9, 0, ZB - .8), Q(9, 0, ZB + .8), Q(RC, 0, ZB + .8)], 'hc-canal');
    var ori = Q(RC, 0, ZB); el('circle', { 'class': 'hc-orificio', cx: f(ori[0]), cy: f(ori[1]), r: 3.2 }, hint);
    boquilla(hint, true);
    var salen = el('g', {}, hint);
    // átomos del vapor: componentes gaussianas (Maxwell), rebotan en la pared y en las caras de corte
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random()); }
    var VT = 7;
    function nace(a) { var ang = Math.PI / 2 + Math.random() * Math.PI * 1.5, r = Math.random() * (RC - .6); a.x = r * Math.cos(ang); a.y = r * Math.sin(ang); a.z = ZPOOL + .3; a.vx = gauss() * VT; a.vy = gauss() * VT; a.vz = Math.abs(gauss()) * VT; a.sale = -1;
      if (Math.random() < .22) { var dx = RC - a.x, dy = -a.y, dzz = ZB - a.z, dn = Math.hypot(dx, dy, dzz), vv = VT * (1.1 + Math.random() * .6); a.vx = vv * dx / dn; a.vy = vv * dy / dn; a.vz = vv * dzz / dn; }   // algunos van justo hacia el orificio
      return a; }
    var gas = []; for (var gi = 0; gi < 32; gi++) { var ga = nace({ el: el('circle', { 'class': 'hc-atomo', r: 1.35 }, vapor) }); ga.z = ZPOOL + 1 + Math.random() * (ZTECHO - ZPOOL - 2); gas.push(ga); }
    function hornoTick(dt) {
      gas.forEach(function (a) {
        if (a.sale >= 0) {                                       // efusión: sigue recto por el canal y la boquilla
          a.x += (Math.abs(a.vx) * .6 + 7) * dt; a.sale += dt;
          var fuera = Math.max(0, a.x - 13.6); a.y = a.sy * fuera; a.z = ZB + a.sz * fuera;   // tras la boquilla cada uno sigue su propia dirección
          var xe = Math.max(RC, a.x - 3.5), fe = Math.max(0, xe - 13.6), qe = Q(xe, a.sy * fe, ZB + a.sz * fe); a.est.setAttribute('x1', f(qe[0])); a.est.setAttribute('y1', f(qe[1]));
          a.el.setAttribute('opacity', f(Math.max(0, Math.min(1, (24 - a.x) / 6))));
          a.est.setAttribute('opacity', a.el.getAttribute('opacity'));
          if (a.x > 24) { a.el.setAttribute('opacity', 1); a.el.setAttribute('class', 'hc-atomo'); vapor.appendChild(a.el); a.est.parentNode.removeChild(a.est); nace(a); }
        } else {
          a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt;
          var r = Math.hypot(a.x, a.y);
          if (r > RC - .4) {                                     // pared: si da con el orificio, sale
            if (a.x > 0 && Math.abs(a.y) < 2.4 && Math.abs(a.z - ZB) < 2.6) { a.sale = 0; a.y = 0; a.z = ZB; a.sy = (Math.random() * 2 - 1) * .3; a.sz = (Math.random() * 2 - 1) * .3; a.el.setAttribute('class', 'hc-atomo hc-sale'); var qi = Q(RC, 0, ZB); a.est = el('line', { 'class': 'hc-estela', x1: f(qi[0]), y1: f(qi[1]), x2: f(qi[0]), y2: f(qi[1]) }, salen); salen.appendChild(a.el); }
            else { var nx = a.x / r, ny = a.y / r, vn = a.vx * nx + a.vy * ny; a.vx -= 2 * vn * nx; a.vy -= 2 * vn * ny; a.x = nx * (RC - .4); a.y = ny * (RC - .4); }
          }
          if (a.sale < 0 && a.x > 0 && a.y > 0) { if (a.x < a.y) { a.x = 0; a.vx = -Math.abs(a.vx); } else { a.y = 0; a.vy = -Math.abs(a.vy); } }   // caras de corte
          if (a.z > ZTECHO - .4) { a.z = ZTECHO - .4; a.vz = -Math.abs(a.vz); }
          if (a.z < ZPOOL + .2) { if (Math.random() < .35) nace(a); else { a.z = ZPOOL + .2; a.vz = Math.abs(a.vz); } }   // recondensa o rebota
        }
        var q = Q(a.x, a.y, a.z); a.el.setAttribute('cx', f(q[0])); a.el.setAttribute('cy', f(q[1]));
        if (a.sale >= 0) { a.est.setAttribute('x2', f(q[0])); a.est.setAttribute('y2', f(q[1])); }
      });
      brilloPlata.setAttribute('opacity', f(.55 + .25 * Math.sin(performance.now() / 300)));
    }

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
    sombraPlanta(m0, P, -12, -26, 32, 10, 0);
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
    var pS = P(32, 0, 8.5), tSp = el('text', { 'class': 'polo-b', x: 0, y: 0, transform: enPlano(P, 'x', pS) }, m2); tSp.textContent = 'S';
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
    var rN = P(10, 10, 30), tN = el('text', { 'class': 'grabado', x: 0, y: 0, transform: enPlano(P, 'y', rN) }, m3); tN.textContent = '∂B/∂z';
    var mcF = pieza(-60); mcF.classList.add('campo'); abanico(mcF, 32.3, 1, true);
    var pN = P(32, 0, 30), tNp = el('text', { 'class': 'polo-b', x: 0, y: 0, transform: enPlano(P, 'x', pN) }, m3); tNp.textContent = 'N';

    var p0 = pieza(110);
    placaAg(p0, P, 38, 12, 0, 32, 11, s);
    capa();                                   // imán → pantalla
    var pa = pieza(-170);
    sombraPlanta(pa, P, 76, -24, 84, 24, 0);
    caja(pa, P, 76, -24, 0, 8, 6, 2.5, 'lo'); caja(pa, P, 76, 18, 0, 8, 6, 2.5, 'lo');
    caja(pa, P, 79, -22, 2.5, 2, 2, 34, 'lo');
    var pantalla = el('g', { 'class': 's vidrio' }, pa);
    poly(pantalla, [P(80, -20, 3), P(80, 20, 3), P(80, 20, 35), P(80, -20, 35)], 'tp');
    poly(pa, [P(80, -18, 35), P(80, -12, 35), P(80, 6, 3), P(80, 0, 3)], 'reflejo');
    poly(pa, [P(80, -9, 35), P(80, -7, 35), P(80, 11, 3), P(80, 9, 3)], 'reflejo');
    var impactos = el('g', {}, pa);
    ruta(pa, [P(80, -9, ZB), P(80, 9, ZB)], 'clasico');
    var rc = P(80, 14.5, ZB + 1.2), tc = el('text', { 'class': 'grabado', x: 0, y: 0, transform: enPlano(P, 'x', rc) }, pa); tc.textContent = 'sin campo';
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
    // contraejemplo de los colimadores: el mismo imán con un haz fino y con uno ancho.
    // Cada átomo se desvía lo mismo (±D); con haz ancho las dos franjas se pisan.
    function colimMini(q, x0, y0) {
      [[0, 1.6, 'haz fino'], [160, 15, 'haz ancho']].forEach(function (cfg, kp) {
        var ox = x0 + 10 + cfg[0], cy = y0 + 46, A = cfg[1], D = 15, sem = 11 + kp * 7;
        function rnd() { sem = (sem * 16807) % 2147483647; return sem / 2147483647; }
        el('rect', { 'class': 'cm-ranura', x: f(ox + 18), y: f(cy - 30), width: 3, height: f(30 - A) }, q);
        el('rect', { 'class': 'cm-ranura', x: f(ox + 18), y: f(cy + A), width: 3, height: f(30 - A) }, q);
        el('path', { 'class': 'cm-polo', d: 'M' + f(ox + 46) + ' ' + f(cy - 30) + ' H' + f(ox + 86) + ' V' + f(cy - 22) + ' L' + f(ox + 66) + ' ' + f(cy - 14) + ' L' + f(ox + 46) + ' ' + f(cy - 22) + ' Z' }, q);
        el('rect', { 'class': 'cm-polo', x: f(ox + 46), y: f(cy + 22), width: 40, height: 8 }, q);
        el('line', { 'class': 'cm-pantalla', x1: f(ox + 132), y1: f(cy - 38), x2: f(ox + 132), y2: f(cy + 38) }, q);
        for (var k = 0; k < 60; k++) {                          // impactos acumulados en la pantalla
          var arriba = k % 2 === 0, y0k = (rnd() * 2 - 1) * A, yf = y0k + (arriba ? -D : D) * (.8 + .4 * rnd());
          el('circle', { 'class': arriba ? 'cm-imp-a' : 'cm-imp-b', cx: f(ox + 133 + rnd() * 2.5), cy: f(cy + yf), r: 1.1 }, q);
        }
        for (var t = 0; t < 8; t++) {                           // átomos en vuelo
          var up = t % 2 === 0, ys = (t / 7 * 2 - 1) * A * .9, d = up ? -1 : 1;
          var path = 'M' + f(ox) + ' ' + f(cy + ys) + ' L' + f(ox + 46) + ' ' + f(cy + ys) + ' Q' + f(ox + 70) + ' ' + f(cy + ys) + ' ' + f(ox + 86) + ' ' + f(cy + ys + d * D * .4) + ' L' + f(ox + 132) + ' ' + f(cy + ys + d * D);
          el('path', { 'class': 'cm-tray ' + (up ? 'cm-ta' : 'cm-tb'), d: path }, q);
          var at = el('circle', { 'class': up ? 'cm-at-a' : 'cm-at-b', r: 1.8 }, q);
          el('animateMotion', { path: path, dur: '1.9s', begin: f(-t * .24) + 's', repeatCount: 'indefinite' }, at);
        }
        var et = el('text', { 'class': 'cm-et', x: f(ox), y: f(cy + 44) }, q); et.textContent = cfg[2];
      });
    }
    function polosMini(q, x0, y0) {
      // vista lateral: filo arriba, polo plano abajo, pantalla. El gradiente sube y baja solo;
      // cada átomo sigue siendo ↑ o ↓ (50 %), lo único que cambia con ∂B/∂z es cuánto se separan.
      var ox = x0 + 14, cy = y0 + 46, XA = ox + 62, XB = ox + 152, XS = ox + 236, gx = ox + 268;
      var lineas = el('g', {}, q);
      for (var k = -3; k <= 3; k++) {
        var xt = (XA + XB) / 2 + k * 9, xb = (XA + XB) / 2 + k * 15;
        el('path', { 'class': 'pm-campo', d: 'M' + f(xt) + ' ' + f(cy - 14 - Math.abs(k) * 2.4) + ' Q' + f(xt + k * 1.5) + ' ' + f(cy) + ' ' + f(xb) + ' ' + f(cy + 20) }, lineas);
      }
      el('path', { 'class': 'cm-polo', d: 'M' + f(XA) + ' ' + f(cy - 36) + ' H' + f(XB) + ' V' + f(cy - 28) + ' L' + f((XA + XB) / 2) + ' ' + f(cy - 12) + ' L' + f(XA) + ' ' + f(cy - 28) + ' Z' }, q);
      el('path', { 'class': 'cm-polo', d: 'M' + f(XA) + ' ' + f(cy + 20) + ' H' + f((XA + XB) / 2 - 4) + ' V' + f(cy + 23) + ' H' + f((XA + XB) / 2 + 4) + ' V' + f(cy + 20) + ' H' + f(XB) + ' V' + f(cy + 28) + ' H' + f(XA) + ' Z' }, q);
      el('rect', { 'class': 'cm-ranura', x: f(ox + 22), y: f(cy - 26), width: 3, height: 24 }, q);
      el('rect', { 'class': 'cm-ranura', x: f(ox + 22), y: f(cy + 2), width: 3, height: 24 }, q);
      el('line', { 'class': 'cm-pantalla', x1: f(XS), y1: f(cy - 40), x2: f(XS), y2: f(cy + 40) }, q);
      el('line', { 'class': 'pm-cero', x1: f(ox), y1: f(cy), x2: f(XS), y2: f(cy) }, q);
      // medidor de ∂B/∂z
      el('rect', { 'class': 'pm-med', x: f(gx), y: f(cy - 32), width: 5, height: 64, rx: 1 }, q);
      var lleno = el('rect', { 'class': 'pm-lleno', x: f(gx), width: 5, rx: 1 }, q);
      var tg = el('text', { 'class': 'cm-et pm-et', x: f(gx + 2.5), y: f(cy + 44), 'text-anchor': 'middle' }, q); tg.textContent = '∂B/∂z';
      var trA = el('path', { 'class': 'cm-tray cm-ta pm-tray' }, q), trB = el('path', { 'class': 'cm-tray cm-tb pm-tray' }, q);
      var imps = el('g', {}, q), vuelan = el('g', {}, q), atomos = [], marcas = [], g = .5, t0 = performance.now(), ult = t0, acu = 0;
      function zDe(x, d) {                       // recta, parábola dentro del imán, recta después
        if (x <= XA) return 0;
        if (x <= XB) { var u = (x - XA) / (XB - XA); return d * .4 * u * u; }
        return d * .4 + d * .8 * (x - XB) / (XB - XA);
      }
      var D0 = 34 / (.4 + .8 * (XS - XB) / (XB - XA));   // desviación en la pantalla para g = 1
      function ruta(sgn) { var o = 'M' + f(ox) + ' ' + f(cy); for (var x = XA; x <= XS; x += 6) o += ' L' + f(x) + ' ' + f(cy + zDe(x, -sgn * g * D0)); return o; }
      function nuevo() {
        var a = { x: ox, z0: (Math.random() * 2 - 1) * 1.6, s: Math.random() < .5 ? 1 : -1, def: false, v: .85 + Math.random() * .3 };
        a.el = el('g', {}, vuelan); el('circle', { 'class': 'pm-at', r: 2.4 }, a.el);
        a.fl = el('path', { 'class': 'pm-espin', d: 'M0 1.2 L0 -5.6 M-1.6 -3.6 L0 -5.7 L1.6 -3.6' }, a.el);
        atomos.push(a);
      }
      function paso(now) {
        requestAnimationFrame(paso);
        if (!q.parentNode.classList.contains('ver')) { ult = now; return; }
        var dt = Math.min(.05, (now - ult) / 1000); ult = now;
        g = .1 + .9 * (.5 - .5 * Math.cos((now - t0) / 1000 * Math.PI * 2 / 7));
        lleno.setAttribute('y', f(cy + 32 - 64 * g)); lleno.setAttribute('height', f(64 * g));
        lineas.setAttribute('opacity', f(.15 + .85 * g));
        trA.setAttribute('d', ruta(1)); trB.setAttribute('d', ruta(-1));
        acu += dt; while (acu > .16) { acu -= .16; nuevo(); }
        for (var i = atomos.length - 1; i >= 0; i--) {
          var a = atomos[i]; a.x += 120 * a.v * dt;
          var dz = -a.s * g * D0 / (a.v * a.v), z = cy + a.z0 + zDe(Math.min(a.x, XS), dz);
          if (a.x >= XS) {
            marcas.push(el('circle', { 'class': a.s > 0 ? 'cm-imp-a' : 'cm-imp-b', cx: f(XS + 1 + Math.random() * 2), cy: f(z), r: 1.2 }, imps));
            if (marcas.length > 46) imps.removeChild(marcas.shift());
            vuelan.removeChild(a.el); atomos.splice(i, 1); continue;
          }
          if (a.x < XA) { a.fl.setAttribute('transform', 'rotate(' + f((Math.random() < .5 ? 0 : 180) + (Math.random() - .5) * 60) + ')'); a.fl.setAttribute('opacity', f(.4 + Math.random() * .6)); }
          else if (!a.def) { a.def = true; a.fl.setAttribute('opacity', 1); a.fl.setAttribute('transform', a.s > 0 ? '' : 'rotate(180)'); a.el.setAttribute('class', a.s > 0 ? 'pm-a' : 'pm-b'); }
          a.el.setAttribute('transform', 'translate(' + f(a.x) + ' ' + f(z) + ')');
        }
        marcas.forEach(function (m, k) { m.setAttribute('opacity', f(.25 + .75 * k / marcas.length)); });
      }
      requestAnimationFrame(paso);
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
      // segunda señal, enganchada al átomo: cómo salen los átomos del horno
      var sx = x0 + 352, sy = y0 - 10, lineasS = ['Nada los acelera. En el vapor a', '1300\u00a0K cada átomo ya trae su', 'velocidad térmica (Maxwell,', '≈\u00a0500\u00a0m/s). Los que por azar', 'llegan al orificio escapan en', 'línea recta: es efusión.'];
      el('line', { 'class': 'enlace', x1: f(x0 + 312), y1: f(y0 + 46), x2: f(sx), y2: f(y0 + 46) }, q);
      el('circle', { 'class': 'enlace-p', cx: f(x0 + 312), cy: f(y0 + 46), r: 1.8 }, q); el('circle', { 'class': 'enlace-p', cx: f(sx), cy: f(y0 + 46), r: 1.8 }, q);
      var fondoS = el('rect', { 'class': 'nota-fondo nota-fondo-2', x: f(sx), y: f(sy - 11), width: 280, height: 37 + lineasS.length * 17, rx: 2 }, q);
      var st = el('text', { 'class': 'nota-t', x: f(sx + 10), y: f(sy + 3) }, q); st.textContent = 'Cómo salen';
      var sd = el('text', { 'class': 'nota-d', x: f(sx + 10), y: f(sy + 26) }, q);
      lineasS.forEach(function (l, k) { var sp = el('tspan', { x: f(sx + 10), dy: k ? 17 : 0 }, sd); sp.textContent = l; });
      sd.setAttribute('class', 'nota-d nota-d2'); sd.pars = parrafos(lineasS); sd.x0 = sx + 10; sd.ancho = 260; sd.fondo = fondoS;
      linea(q, [sx + 10, sy + 8.5], [sx + 270, sy + 8.5], 'nota-regla');
    }
    var nota = fabricaNotas(svg, g, P);
    nota([b0], [-62, 22, 0], 'Banco y vacío', ['Todo va sobre un solo eje. El aparato real', 'trabajaba en vacío: los átomos debían volar', 'sin chocar con el aire.']);
    nota([h0], [-71, 0, 32.4], 'Horno de plata', ['La plata tiene un solo electrón externo:', 'el momento magnético del átomo es el de ese', 'electrón. Por eso fue la elección ideal.'], 88, null, { alto: 96, ancho: 330, dx: 110, dibujo: atomoPlata });
    nota([rendijas[0], rendijas[1]], [-35.1, -13, 28], 'Colimadores', ['El haz debe ser fino: si fuera ancho,', 'las dos manchas se solaparían y la', 'separación no se vería.'], null, null, { alto: 104, ancho: 330, dibujo: colimMini });
    nota([m0, m1], [10, -23, 46], 'Electroimán', ['La corriente imanta el hierro; el yugo', 'lleva el campo hasta el entrehierro. Uniforme', 'solo haría girar al átomo: el filo lo desvía.'], 96, null, { alto: 108, ancho: 300, dx: 12, dibujo: imanMini });
    nota([m2, m3], [32, 5, 22.5], 'Polos asimétricos', ['El filo concentra el campo: ∂B/∂z grande.', 'La fuerza Fz = μz ∂B/∂z depende de μz,', 'así que el imán "mide" el espín.'], 88, [mc, mcF], { alto: 104, ancho: 320, dibujo: polosMini });
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
    // efusión real: cada átomo sale de la boca de la boquilla (x = −57) en su propia dirección recta.
    // Las dos rendijas (|z − ZB| < 0,7 en x = −46 y x = −36) frenan a los que vienen inclinados;
    // solo pasan los casi paralelos al eje. En y la ranura es larga: el haz sale como un abanico plano.
    var K = 11, X0H = -57, enVuelo = [], arriba = 0, abajo = 0, acum = 0, acumB = 0, PLACAS = [-46, -36];
    function atomoNuevo() {
      var a = el('g', { 'class': 'atomo' }, vuelo[0]);
      el('circle', { 'class': 'atomo-b', r: 2.1 }, a);
      var fl = el('path', { 'class': 'espin', d: 'M0 1.4 L0 -6.5 M-1.7 -4.4 L0 -6.6 L1.7 -4.4' }, a);
      var fl2 = el('path', { 'class': 'espin fantasma', d: 'M0 -1.4 L0 6.5 M-1.7 4.4 L0 6.6 L1.7 4.4' }, a);
      return { el: a, fl: fl, fl2: fl2, x: X0H, tramo: 0, def: false, alto: 999 };
    }
    function lanzar() {
      var w2 = -Math.log(Math.random() * Math.random() + 1e-9), sy = (Math.random() * 2 - 1) * .1, ym = sy * (10 - X0H);
      var a = atomoNuevo();
      a.sgn = Math.random() < .5 ? 1 : -1; a.sy = sy; a.sz = (Math.random() * 2 - 1) * .012; a.v = Math.sqrt(w2);
      a.dz = a.sgn * K * (1 - (ym / 9.5) * (ym / 9.5)) / Math.max(w2, .7);
      enVuelo.push(a);
    }
    function lanzarFrenado() {                 // sale inclinado: choca con la 1.ª o con la 2.ª rendija
      var a = atomoNuevo();
      a.sz = (Math.random() < .5 ? 1 : -1) * (.035 + Math.random() * .3); a.sy = (Math.random() * 2 - 1) * .1;
      a.v = .7 + Math.random() * .7; a.dz = 0; a.sgn = 1;
      PLACAS.forEach(function (xp) { if (a.alto === 999 && Math.abs(a.sz * (xp - X0H)) > .7) a.alto = xp - .2; });
      enVuelo.push(a);
    }
    function zEn(a, x) {   // recta desde la boquilla; parabólica dentro del imán (−12…32), recta después
      var z = ZB + a.sz * (x - X0H);
      if (x <= -12) return z;
      var L = 44, t = Math.min(x + 12, L) / L, zm = a.dz * .32 * t * t;
      if (x <= 32) return z + zm;
      return z + a.dz * .32 + (2 * .32 * a.dz / L) * (x - 32);
    }
    return {
      tick: function (dt) {
        if (h0.classList.contains('foco')) hornoTick(dt);
        acum += dt; while (acum > .035) { acum -= .035; lanzar(); }
        acumB += dt; while (acumB > .05) { acumB -= .05; lanzarFrenado(); }
        for (var i = enVuelo.length - 1; i >= 0; i--) {
          var a = enVuelo[i]; a.x += a.v * 62 * dt;
          if (a.x >= a.alto) {                   // chocó con la placa del colimador
            a.x = a.alto; var qb = P(a.x, a.sy * (a.x - X0H), zEn(a, a.x)), sale = a.el;
            sale.setAttribute('transform', 'translate(' + f(qb[0]) + ' ' + f(qb[1]) + ')'); sale.setAttribute('class', 'atomo frenado');
            (function (e) { setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 420); })(sale);
            enVuelo.splice(i, 1); continue;
          }
          if (a.x >= 80) {
            var z = zEn(a, 80), q = P(80, a.sy * (80 - X0H), z);
            if (z > 4 && z < 34) el('circle', { 'class': 'impacto ' + (a.sgn > 0 ? 'imp-arriba' : 'imp-abajo'), cx: f(q[0]), cy: f(q[1]), r: 1.15 }, impactos);
            if (impactos.childNodes.length > 1400) impactos.removeChild(impactos.firstChild);
            if (a.sgn > 0) arriba++; else abajo++;
            a.el.parentNode.removeChild(a.el); enVuelo.splice(i, 1); continue;
          }
          while (a.x > tramos[a.tramo]) { a.tramo++; vuelo[a.tramo].appendChild(a.el); }
          var q2 = P(a.x, a.sy * (a.x - X0H), zEn(a, a.x)), jx = 0, jy = 0;
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
  var mods = [escenaRelatividad, escenaSternGerlach, escenaProblemas].map(function (fn, i) { var sv = escenas[i].querySelector('svg'), m = fn(sv, salida(i)); if (m.notas) m.notas(); return m; });
  // guía: una barra de luz que se desliza hasta el título activo
  var guia = raiz.querySelector('.mc-guia');
  function guiar() {
    if (!guia) return;
    var t = items[activo].querySelector('.mc-a'), lista = guia.parentNode;
    var top = t.getBoundingClientRect().top - lista.getBoundingClientRect().top + 9, alto = t.offsetHeight - 18;
    guia.style.transform = 'translateY(' + top + 'px)'; guia.style.height = alto + 'px'; guia.style.setProperty('--alto', alto + 'px');
  }
  var tGuia = 0;
  function seguirGuia() {   // sigue al título mientras el menú se reacomoda
    var t0 = performance.now(), id = ++tGuia;
    (function paso() { guiar(); if (id === tGuia && performance.now() - t0 < 700) requestAnimationFrame(paso); })();
  }
  // encuadre: a medio camino entre "cubrir" (slice, recorta) y "contener" (meet, deja márgenes):
  // escala = media geométrica de ambas. Si sobra alto se recorta más abajo que arriba, donde están las notas.
  function encuadrar() {
    escenas.forEach(function (e) {
      var sv = e.querySelector('svg'), r = sv.getBoundingClientRect(); if (!r.width || !r.height) return;
      var a = r.width / 1440, b = r.height / 900, k = Math.sqrt(Math.max(a, b) * Math.min(a, b)), W = r.width / k, H = r.height / k;
      var y0 = H < 900 ? Math.min((900 - H) / 2, 30) : (900 - H) / 2;
      sv.setAttribute('viewBox', f(1440 - W) + ' ' + f(y0) + ' ' + f(W) + ' ' + f(H));
    });
  }
  encuadrar();
  window.addEventListener('resize', function () { encuadrar(); guiar(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(guiar);
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
    seguirGuia();
    mods[i].tick(1 / 60);
  }
  items.forEach(function (it, i) {
    // en pantallas táctiles el primer toque solo selecciona; el segundo, sobre el título ya activo, abre el curso
    it.addEventListener('pointerenter', function (ev) { if (ev.pointerType !== 'mouse') it.estaba = i === activo; elegir(i); });
    it.querySelector('.mc-a').addEventListener('click', function (ev) { if (it.estaba === false) ev.preventDefault(); it.estaba = undefined; });
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
