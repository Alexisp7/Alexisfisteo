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
    'precision highp float;',
    'uniform vec2 uRes; uniform vec4 uVB; uniform vec2 uC; uniform float uSC, uRoll, uT, uIncl, uPix;',
    'float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    // disco dibujado: cada órbita es una línea fina; por ella corren trazos a la velocidad kepleriana
    'vec4 disco(vec3 p, vec3 v) {',
    '  float r = length(p.xz); if (r < 5.9 || r > 17.0) return vec4(0.0);',
    '  float b = sqrt(1.0 / (r - 2.0)); vec3 t = normalize(vec3(-p.z, 0.0, p.x)); vec3 vd = normalize(v);',
    '  float g = sqrt(1.0 - 3.0 / r) / (1.0 - b * dot(t, -vd));',          // corrimiento gravitacional + Doppler
    '  float aa = 1.3 * uPix / max(abs(vd.y), .12);',                              // ancho de un píxel sobre el plano del disco
    '  float sp = .42, k = floor(r / sp), h = hash(vec3(k, 1.7, 4.2)), h2 = hash(vec3(k, 9.1, 2.3));',
    '  float d = abs(fract(r / sp) - .5) * sp, wl = .012 + .016 * h;',
    '  float linea = 1.0 - smoothstep(wl, wl + aa, d);',
    '  float dI = abs(r - 6.05), isco = 1.0 - smoothstep(.02, .02 + aa, dI);',   // borde interior (ISCO) a tinta firme
    '  float rr = (k + .5) * sp, om = 2.4 * pow(6.0 / rr, 1.5) * (.85 + .3 * h2);',
    '  float ph = atan(p.z, p.x), n = 1.0 + floor(h * 3.0), cola = .18 + .3 * h;',
    '  float s = fract((ph - om * uT) / 6.2831853 * n + h2);',
    '  float st = s > 1.0 - cola ? pow((s - 1.0 + cola) / cola, 2.4) : 0.0;',   // cabeza nítida y cola que se apaga
    '  float T = pow(r, -.75) * pow(max(1.0 - sqrt(6.0 / r), 0.0), .25) / .1274;',
    '  float D = clamp(pow(g, 3.0), .25, 3.2);',
    '  float fade = smoothstep(5.9, 6.2, r) * (1.0 - smoothstep(13.5, 17.0, r));',
    '  vec3 mostaza = vec3(.84, .62, .12), claro = vec3(1.0, .9, .52);',
    '  vec3 col = mix(mostaza, claro, clamp(st * D * .7, 0.0, 1.0)) * (.55 + .5 * T) * D * (.9 + 1.4 * st);',
    '  float a = max(linea * fade * (.28 + .72 * st), isco * .9);',
    '  return vec4(col + isco * vec3(1.0, .9, .6), clamp(a, 0.0, 1.0)); }',
    // la sombra como esfera de tinta: luz arriba a la izquierda, reflejo de ventana, brillo, rebote violeta y sombreado a líneas
    'vec3 esfera(vec2 b) {',
    '  vec2 u = b / 5.196; float q = dot(u, u), au = uPix / 5.196; vec3 nn = vec3(u, sqrt(max(1.0 - q, 0.0)));',
    '  vec3 L = normalize(vec3(-.55, .62, .58)); float dif = max(dot(nn, L), 0.0);',
    '  vec3 col = vec3(.010, .007, .012) + vec3(.055, .04, .065) * pow(dif, 1.6);',
    '  col += vec3(.95, .9, 1.0) * pow(max(dot(reflect(-L, nn), vec3(0.0, 0.0, 1.0)), 0.0), 70.0) * .55;',
    '  vec2 w = u - vec2(-.38, .44); w = vec2(.8 * w.x + .6 * w.y, -.6 * w.x + .8 * w.y);',
    '  float e = length(w / vec2(.21, .085)); col += vec3(.75, .7, .85) * (1.0 - smoothstep(1.0 - au * 9.0, 1.0, e)) * .16;',
    '  vec2 w2 = u - vec2(-.2, .6); float e2 = length(w2 / vec2(.06, .03)); col += vec3(.8, .75, .9) * (1.0 - smoothstep(1.0 - au * 25.0, 1.0, e2)) * .12;',
    '  float ru = sqrt(q), rim = smoothstep(.8, .99, ru) * max(dot(normalize(u + 1e-5), normalize(vec2(.65, -.55))), 0.0);',
    '  col += vec3(.5, .38, .9) * rim * .18;',
    '  float hl = abs(fract((u.x + u.y) * 16.0) - .5) / 16.0;',              // sombreado a líneas en el lado oscuro
    '  col += vec3(.42, .34, .62) * (1.0 - smoothstep(.0035, .0035 + au, hl)) * (1.0 - smoothstep(.05, .45, dif)) * smoothstep(.97, .85, ru) * .18;',
    '  return col; }',
    'void main() {',
    '  vec2 q = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);',
    '  vec2 d = (uVB.xy + q * uVB.zw - uC) / uSC; float cr = cos(uRoll), sr = sin(uRoll);',
    '  d = vec2(cr * d.x + sr * d.y, -sr * d.x + cr * d.y);',
    '  float bx = d.x, by = -d.y;',
    '  float ci = cos(uIncl), si = sin(uIncl);',
    '  vec3 cam = vec3(0.0, ci, -si) * 40.0, fw = -normalize(cam), up = vec3(0.0, si, ci), rt = vec3(-1.0, 0.0, 0.0);',
    '  vec3 p = cam + rt * bx + up * by, v = fw;',
    '  float h2 = dot(cross(p, v), cross(p, v));',
    '  vec3 acc = vec3(0.0); float al = 0.0; bool cae = false;',
    '  for (int i = 0; i < 260; i++) {',
    '    float r = length(p);',
    '    if (r < 2.02) { cae = true; break; }',
    '    if (r > 48.0 && dot(p, v) > 0.0) break;',
    '    float dt = clamp(.07 * r - .08, .025, 1.1);',
    '    vec3 a = -3.0 * h2 * p / pow(r, 5.0);',
    '    vec3 vm = v + a * dt * .5, pn = p + vm * dt; float rn = length(pn);',
    '    vec3 an = -3.0 * h2 * pn / pow(rn, 5.0); vec3 vn = vm + an * dt * .5;',
    '    if (p.y * pn.y < 0.0) { float k = p.y / (p.y - pn.y); vec4 c = disco(mix(p, pn, k), vn);',
    '      acc += (1.0 - al) * c.rgb * c.a; al += (1.0 - al) * c.a; if (al > .98) break; }',
    '    p = pn; v = vn;',
    '  }',
    '  float rb = length(vec2(bx, by));',
    '  vec3 fondo = cae ? esfera(vec2(bx, by)) : vec3(.030, .016, .026) * (1.0 - .45 * smoothstep(8.0, 30.0, rb));',
    '  vec3 col = acc + (1.0 - al) * fondo;',
    '  col = 1.0 - exp(-col * 1.6);',
    '  gl_FragColor = vec4(col, 1.0); }'
  ].join('\n');

  function escenaRelatividad(svg, salida) {
    var fig = svg.parentNode, lienzo = document.createElement('canvas');
    lienzo.className = 'bn-lienzo'; fig.insertBefore(lienzo, svg);
    var C = [995, 450], SC = 25.5, ROLL = -16 * Math.PI / 180, INCL = 82 * Math.PI / 180;
    // proyección sin lente (ortográfica) del mundo a la pantalla, igual que en el trazador
    function aPantalla(x, y, z) {
      var ci = Math.cos(INCL), si = Math.sin(INCL), bx = -x, by = y * si + z * ci, sx = bx * SC, sy = -by * SC;
      return [C[0] + Math.cos(ROLL) * sx - Math.sin(ROLL) * sy, C[1] + Math.sin(ROLL) * sx + Math.cos(ROLL) * sy];
    }
    function enPantalla(bx, by) { var sx = bx * SC, sy = -by * SC; return [C[0] + Math.cos(ROLL) * sx - Math.sin(ROLL) * sy, C[1] + Math.sin(ROLL) * sx + Math.cos(ROLL) * sy]; }
    var BC = Math.sqrt(27), RSH = BC * SC;   // radio de la sombra en pantalla
    // ── WebGL
    var gl = lienzo.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }), U = {}, listo = false;
    if (gl) {
      var vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
      var fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, GLSL_AGUJERO); gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(fs));
      var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr);
      var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uVB', 'uC', 'uSC', 'uRoll', 'uT', 'uIncl', 'uPix'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
      listo = gl.getProgramParameter(pr, gl.LINK_STATUS);
    }
    if (!listo) fig.classList.add('bn-sin-gl');
    var tiempo = 0;
    function pintar() {
      if (!listo) return;
      var r = lienzo.getBoundingClientRect(); if (!r.width) return;
      var q = Math.min(window.devicePixelRatio || 1, 1.5) * calidad, W = Math.round(r.width * q), H = Math.round(r.height * q);
      if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
      var vb = svg.viewBox.baseVal;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(U.uRes, W, H); gl.uniform4f(U.uVB, vb.x, vb.y, vb.width, vb.height); gl.uniform2f(U.uC, C[0], C[1]);
      gl.uniform1f(U.uSC, SC); gl.uniform1f(U.uRoll, ROLL); gl.uniform1f(U.uT, tiempo); gl.uniform1f(U.uIncl, INCL); gl.uniform1f(U.uPix, vb.width / W / SC);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // calidad adaptativa: si la GPU no llega a ~30 fps, se baja la resolución del trazado
    var calidad = 1, previo = 0, lentos = 0;
    (function bucleGL(t) {
      requestAnimationFrame(bucleGL);
      if (!fig.classList.contains('on') || document.hidden || window.__bnPausa) { previo = 0; return; }
      if (previo) { var d = t - previo; lentos = d > 34 ? lentos + 1 : Math.max(0, lentos - 1); if (lentos > 20 && calidad > .42) { calidad *= .85; lentos = 0; } }
      previo = t; pintar();
    })(0);
    fig.bnPintar = function (q) { calidad = q; pintar(); };   // para capturas fijas
    // ── capa SVG: zonas para las notas y radiación de Hawking
    // ── estrellas dibujadas a pluma: puntos, cruces de cuatro puntas y alguna con aro; titilan despacio
    var cielo = el('g', { 'class': 'bn-cielo' }, svg), semilla = 7;
    function azar() { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; }
    for (var si = 0, puestas = 0; si < 900 && puestas < 130; si++) {
      var sx = 180 + azar() * 1700, sy = -120 + azar() * 1140, ex = (sx - C[0]) / SC, ey = (sy - C[1]) / SC;
      var ux = Math.cos(ROLL) * ex + Math.sin(ROLL) * ey, uy = -Math.sin(ROLL) * ex + Math.cos(ROLL) * ey;
      if ((sx > 980 && sy > 700) || (sy < 80 && sx > 450 && sx < 1000) || (ux / 19) * (ux / 19) + (uy / 8.5) * (uy / 8.5) < 1 || ux * ux + uy * uy < 100) continue;
      puestas++;
      var tipo = azar(), tono = azar() < .18 ? ' bn-est-oro' : azar() < .15 ? ' bn-est-vio' : '';
      var est = el('g', { 'class': 'bn-est' + tono, style: 'animation-delay:' + f(-azar() * 6) + 's;animation-duration:' + f(3 + azar() * 4) + 's' }, cielo);
      if (tipo < .72) { el('circle', { cx: f(sx), cy: f(sy), r: f(.45 + azar() * .7) }, est); continue; }
      var L = 2.5 + azar() * 4.5;
      el('circle', { cx: f(sx), cy: f(sy), r: .9 }, est);
      el('path', { d: 'M' + f(sx - L) + ' ' + f(sy) + 'H' + f(sx + L) + 'M' + f(sx) + ' ' + f(sy - L * 1.3) + 'V' + f(sy + L * 1.3) }, est);
      if (tipo > .93) el('circle', { 'class': 'bn-est-aro', cx: f(sx), cy: f(sy), r: f(L * .55) }, est);
    }
    var g = el('g', {}, svg);
    function anillo(r0, r1) { return 'M' + f(C[0] - r1) + ' ' + f(C[1]) + ' a' + f(r1) + ' ' + f(r1) + ' 0 1 0 ' + f(2 * r1) + ' 0 a' + f(r1) + ' ' + f(r1) + ' 0 1 0 ' + f(-2 * r1) + ' 0' + (r0 ? ' M' + f(C[0] - r0) + ' ' + f(C[1]) + ' a' + f(r0) + ' ' + f(r0) + ' 0 1 0 ' + f(2 * r0) + ' 0 a' + f(r0) + ' ' + f(r0) + ' 0 1 0 ' + f(-2 * r0) + ' 0' : ''); }
    el('circle', { 'class': 'bn-hawking-borde', cx: f(C[0]), cy: f(C[1]), r: f(RSH * .965) }, g);
    var hawk = el('g', {}, g);
    function zona(d) { return el('path', { 'class': 'zona bn-zona', d: d, 'fill-rule': 'evenodd' }, g); }
    function poligono(pts) { return 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join(' L') + 'Z'; }
    function bandaDisco(r0, r1, a0, a1) {   // franja del disco (sin lente) entre radios y ángulos
      var o = [], k; for (k = 0; k <= 24; k++) { var t = (a0 + (a1 - a0) * k / 24); o.push(aPantalla(r1 * Math.cos(t), 0, r1 * Math.sin(t))); }
      for (k = 24; k >= 0; k--) { var t2 = (a0 + (a1 - a0) * k / 24); o.push(aPantalla(r0 * Math.cos(t2), 0, r0 * Math.sin(t2))); }
      return poligono(o);
    }
    var zSombra = zona(anillo(0, RSH * .9)), zHawk = zona(anillo(RSH * .9, RSH * 1.0)), zFot = zona(anillo(RSH * 1.0, RSH * 1.13));
    var zDisco = zona(bandaDisco(9, 16, Math.PI * 1.4, Math.PI * 1.92)), zDoppler = zona(bandaDisco(7, 16, Math.PI * .85, Math.PI * 1.35));
    var zLente = zona((function () { var o = []; for (var k = 0; k <= 20; k++) { var t = Math.PI * (.15 + .7 * k / 20); o.push(enPantalla(Math.cos(t) * 9.5, Math.sin(t) * 9.5)); } for (k = 20; k >= 0; k--) { var t3 = Math.PI * (.15 + .7 * k / 20); o.push(enPantalla(Math.cos(t3) * 6.2, Math.sin(t3) * 6.2)); } return poligono(o); })());
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random()); }
    var pares = [], acum = 0;
    function par() {
      var a = Math.random() * Math.PI * 2, sale = el('circle', { 'class': 'bn-hq', r: 2.1 }, hawk), cae = el('circle', { 'class': 'bn-hq bn-hq-cae', r: 1.5 }, hawk);
      pares.push({ a: a, r: RSH * .955, rc: RSH * .955, v: 26 + Math.random() * 30, sale: sale, cae: cae, da: gauss() * .08 });
    }
    return {
      tick: function (dt) {
        tiempo += dt;
        acum += dt; while (acum > .16) { acum -= .16; par(); }
        for (var i = pares.length - 1; i >= 0; i--) {
          var p = pares[i]; p.r += p.v * dt; p.rc -= 14 * dt; p.a += p.da * dt;
          var u = (p.r - RSH) / (RSH * .9);
          p.sale.setAttribute('cx', f(C[0] + Math.cos(p.a) * p.r)); p.sale.setAttribute('cy', f(C[1] + Math.sin(p.a) * p.r)); p.sale.setAttribute('opacity', f(Math.max(0, 1 - u)));
          p.cae.setAttribute('cx', f(C[0] + Math.cos(p.a + .05) * p.rc)); p.cae.setAttribute('cy', f(C[1] + Math.sin(p.a + .05) * p.rc)); p.cae.setAttribute('opacity', f(Math.max(0, (p.rc - RSH * .82) / (RSH * .13))));
          if (u >= 1) { hawk.removeChild(p.sale); hawk.removeChild(p.cae); pares.splice(i, 1); }
        }
        salida('rₛ = 2GM/c²', 'sombra b = √27 GM/c² ≈ 2,6 rₛ · ISCO 3 rₛ');
      },
      notas: function () {
        var nota = fabricaNotas(svg, svg, function (x, y) { return [x, y]; });
        var top = enPantalla(-Math.sin(.6) * BC * .45, Math.cos(.6) * BC * .45);
        nota([zSombra], [C[0], C[1]], 'Sombra y horizonte', ['La luz que pasa a menos de b = √27 GM/c²', '(≈ 2,6 rₛ) cae sin remedio: eso es la sombra.', 'El horizonte, rₛ = 2GM/c², queda dentro;', 'la curvatura lo agranda hasta llenarla.'], 110, null, { izq: true, dx: -40, ancho: 300 });
        var pf = enPantalla(Math.cos(2.2) * BC * 1.05, Math.sin(2.2) * BC * 1.05);
        nota([zFot], pf, 'Anillo de fotones', ['Luz que dio una o más vueltas cerca de', 'r = 1,5 rₛ (esfera de fotones) antes de', 'escapar. El EHT lo fotografió en M87* (2019).'], 110);
        var ph = enPantalla(Math.cos(-.5) * BC * .95, Math.sin(-.5) * BC * .95);
        nota([zHawk], ph, 'Radiación de Hawking', ['Hawking (1974): junto al horizonte, por', 'efectos cuánticos, el agujero emite como', 'cuerpo negro a T = ħc³/(8πGMk_B). Para', 'una masa solar, T ≈ 6 × 10⁻⁸ K.'], 660, null, { izq: false });
        var pl = enPantalla(Math.cos(1.25) * 8.2, Math.sin(1.25) * 8.2);
        nota([zLente], pl, 'Lente gravitacional', ['El arco sobre la sombra es la parte de', 'atrás del disco: su luz se curva por', 'encima del agujero y llega hasta aquí.'], 110);
        var pd = aPantalla(12, 0, -7);
        nota([zDisco], pd, 'Disco de acreción', ['Gas en órbita que se calienta al caer en', 'espiral. Empieza en la órbita circular', 'estable más interna, r = 3 rₛ (ISCO).'], 680, null, { izq: false });
        var pp = aPantalla(-12, 0, 2);
        nota([zDoppler], pp, 'Doppler relativista', ['El gas de este lado viene hacia nosotros', 'a casi la mitad de c: su luz se concentra', 'y brilla más que la del lado que se aleja.'], 130, null, { izq: true });
        void top;
      }
    };
  }

  // ═════════ II · Mecánica cuántica: Stern–Gerlach ═════════
  function escenaSternGerlach(svg, salida) {
    var s = 4.7, P = camara(920, 455, s, 38), g = el('g', {}, svg), ZB = 16, orden = 0;
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
