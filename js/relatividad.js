// Relatividad: fondo de espacio profundo (nebulosas, red cósmica con supercúmulos de galaxias, estrellas) pintado
// una sola vez a resolución completa, y el agujero negro de Cursos (mismo trazador, js/agujero-glsl.js) abajo,
// animado cada cuadro y sin la mancha de tinta. Al retirarse el velo de la transición la cámara se aleja del agujero
// (llega desde el espacio en el que terminó la mancha) y el curso se arma de arriba abajo.
(function () {
  var d = document, raiz = d.documentElement;
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function programa(gl, fuente) {
    var vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fuente); gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(fs)); return null; }
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr);
    var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
  }

  // ── cosmos: se pinta una vez (y al cambiar el tamaño); la deriva lenta es un transform de CSS
  var GLSL_COSMOS = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uDpr;',
    'float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n * 17.0)); }',
    'float ruido(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }',
    'float fbm(vec2 p) { float a = .5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * ruido(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= .5; } return s; }',
    // red cósmica: los filamentos son los bordes de celdas de Voronoi (F2 − F1 pequeño); los nudos, donde se cruzan
    'vec3 voronoi(vec2 p) { vec2 i = floor(p), f = fract(p); float F1 = 8.0, F2 = 8.0;',
    '  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = h22(i + g);',
    '    float dd = length(g + o - f); if (dd < F1) { F2 = F1; F1 = dd; } else if (dd < F2) F2 = dd; }',
    '  return vec3(F1, F2, F2 - F1); }',
    'float estrellas(vec2 q, float esc, float umbral, float px) {',
    '  vec2 c = floor(q * esc), f = fract(q * esc) - .5; float h = h21(c); if (h < umbral) return 0.0;',
    '  vec2 o = (h22(c + 3.0) - .5) * .7; float r = length(f - o) / esc;',
    '  float tam = px * (.5 + 1.6 * pow(h21(c + 9.0), 6.0));',
    '  return exp(-r * r / (tam * tam)) * (.35 + .65 * h21(c + 5.0)); }',
    'void main() {',
    '  vec2 q = (gl_FragCoord.xy - .5 * uRes) / uRes.y; float px = 1.0 / uRes.y;',
    // nebulosa con el dominio deformado: velos granate e índigo, más densos en una banda diagonal y hacia abajo (junto al agujero)
    '  vec2 w = vec2(fbm(q * 1.7 + 1.3), fbm(q * 1.7 + 8.1));',
    '  float n1 = fbm(q * 2.1 + w * 1.6), n2 = fbm(q * 3.4 - w * 1.2 + 5.0), n3 = fbm(q * 7.0 + w * 2.0 + 11.0);',
    '  float banda = exp(-pow((q.y + .38 * q.x - .02) / .34, 2.0)) * .85 + .35 * smoothstep(.1, -.55, q.y);',
    '  vec3 col = vec3(.004, .005, .009);',
    '  col += vec3(.30, .05, .065) * smoothstep(.50, .88, n1) * banda * .75;',
    '  col += vec3(.06, .08, .20) * smoothstep(.48, .86, n2) * (.3 + .5 * banda) * .8;',
    '  col += vec3(.62, .38, .17) * pow(smoothstep(.55, .95, n1 * n2 * 1.9), 2.0) * banda * .22;',   // polvo dorado iluminado
    '  col *= 1.0 - .55 * smoothstep(.52, .78, n3) * banda;',                                        // franjas de polvo oscuro
    // supercúmulo: filamentos tenues y, sobre ellos, muchas galaxias diminutas; en los nudos, cúmulos densos
    '  vec3 v = voronoi(q * 3.2 + w * .6); float fil = exp(-v.z * 9.0), nudo = exp(-v.x * 5.0) * fil;',
    '  col += vec3(.20, .17, .24) * fil * .06 + vec3(.40, .30, .26) * nudo * .05;',
    '  vec2 c = floor(q * 260.0), f = fract(q * 260.0) - .5; float hg = h21(c + 41.0);',
    '  if (hg < .06 + .55 * fil * fil + .5 * nudo) { vec2 o = (h22(c + 7.0) - .5) * .6, e = f - o; float a = h21(c + 2.0) * 6.283;',
    '    e = mat2(cos(a), -sin(a), sin(a), cos(a)) * e; e.y *= 1.6 + 2.2 * h21(c + 4.0);',
    '    float g = exp(-dot(e, e) * 70.0) * (.25 + .55 * h21(c + 8.0));',
    '    col += mix(vec3(1.0, .78, .55), vec3(.75, .82, 1.0), h21(c + 6.0)) * g * .6; }',
    // estrellas: tres capas, las más brillantes con cruz de difracción fina (como en la mancha de Cursos)
    '  float s = estrellas(q, 60.0, .93, px * 1.2) + estrellas(q + 3.7, 140.0, .94, px) * .6 + estrellas(q + 9.1, 300.0, .96, px * .8) * .4;',
    '  vec3 tinte = mix(vec3(.78, .85, 1.0), vec3(1.0, .88, .70), h21(floor(q * 160.0)));',
    '  col += tinte * s;',
    '  vec2 cb = floor(q * 22.0), fb = fract(q * 22.0) - .5; if (h21(cb + 77.0) > .975) { vec2 o = (h22(cb + 5.0) - .5) * .6, e = (fb - o) / 22.0;',
    '    float x = abs(e.x), y = abs(e.y), cruz = (exp(-y * y / (px * px * .5)) * exp(-x / (px * 14.0)) + exp(-x * x / (px * px * .5)) * exp(-y / (px * 14.0))) * .5;',
    '    col += vec3(1.0, .9, .75) * (cruz * .55 + exp(-dot(e, e) / (px * px * 2.2))) * (.5 + .5 * h21(cb + 1.0)); }',
    '  col = 1.0 - exp(-col * 1.35);',   // tono suave: las zonas brillantes no se queman
    '  gl_FragColor = vec4(col, 1.0); }'
  ].join('\n');

  var cosmos = d.querySelector('.rg-cosmos');
  function pintarCosmos() {
    var W = Math.round(innerWidth * 1.06 * DPR), H = Math.round(innerHeight * 1.06 * DPR);
    if (cosmos.width === W && cosmos.height === H) return;
    cosmos.width = W; cosmos.height = H;
    var gl = cosmos.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
    if (!gl) { cosmos.classList.add('listo'); return; }
    if (!cosmos.pr) cosmos.pr = programa(gl, GLSL_COSMOS);
    if (!cosmos.pr) return;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(gl.getUniformLocation(cosmos.pr, 'uRes'), W, H); gl.uniform1f(gl.getUniformLocation(cosmos.pr, 'uDpr'), DPR);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    cosmos.classList.add('listo');
  }

  // ── agujero negro abajo: el mismo trazador que en Cursos, sin la mancha (uAg = 0)
  var lienzo = d.querySelector('.rg-agujero'), gl = window.GLSL_AGUJERO && lienzo.getContext('webgl', { antialias: false, premultipliedAlpha: false }), U = {}, pr = null;
  if (gl) { gl.getExtension('OES_standard_derivatives'); pr = programa(gl, window.GLSL_AGUJERO); }
  if (pr) ['uRes', 'uVB', 'uC', 'uSC', 'uRoll', 'uT', 'uIncl', 'uPix', 'uArm', 'uDim', 'uTD', 'uHk', 'uEx', 'uSal', 'uAg'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
  var ROLL = 0, INCL = 80 * Math.PI / 180, t0 = performance.now(), tEntrada = null, zoom = 1;
  function geometria() {
    var w = innerWidth, h = innerHeight, ancho = w <= 900;
    // el disco ocupa casi todo el ancho; su centro queda bajo el borde de la pantalla y se ven la sombra y el arco de atrás
    var SC = Math.min(w * (ancho ? 1.05 : .84) / 44, h * .42 / 12);
    return { SC: SC, cx: w * .5, cy: h - SC * 3.3 };
  }
  function suave(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
  function pintar(t) {
    var r = lienzo.getBoundingClientRect(), W = Math.round(r.width * DPR), H = Math.round(r.height * DPR);
    if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    var g = geometria(), s = (t - t0) / 1000, arm = 20;
    // entrada: la cámara llega de muy cerca (donde terminó la mancha) y se aleja hasta su sitio; el disco se enciende
    if (tEntrada != null) { var u = (t - tEntrada) / 2600; zoom = 1 + 2.4 * Math.pow(1 - suave(u), 2); arm = .25 + u * 2.6; } else { zoom = 3.4; arm = 0; }
    var SC = g.SC * zoom;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.uRes, W, H); gl.uniform4f(U.uVB, 0, 0, r.width, r.height); gl.uniform2f(U.uC, g.cx, g.cy + (zoom - 1) * -g.SC * 2.2);
    gl.uniform1f(U.uSC, SC); gl.uniform1f(U.uRoll, ROLL); gl.uniform1f(U.uT, s);
    gl.uniform1f(U.uIncl, INCL + (Math.sin(s * .9) * .6 + Math.sin(s * .37 + 1.3) * .4) * Math.PI / 180);
    gl.uniform1f(U.uPix, r.width / W / SC); gl.uniform1f(U.uArm, arm); gl.uniform2f(U.uDim, 1, 1);
    gl.uniform1f(U.uTD, ((s % 40) + 40) % 40); gl.uniform1f(U.uHk, 0); gl.uniform1f(U.uEx, 0); gl.uniform1f(U.uSal, 0); gl.uniform1f(U.uAg, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  // siempre a resolución completa; si la GPU no llega, se pinta un cuadro de cada dos (nunca baja la resolución)
  var previo = 0, lentos = 0, salto = 1, cuadro = 0;
  function bucle(t) {
    requestAnimationFrame(bucle);
    if (d.hidden || !pr) { previo = 0; return; }
    if (++cuadro % salto) return;
    pintar(t);
    if (previo) { var dt = (t - previo) / salto; lentos = dt > 30 ? lentos + 1 : Math.max(0, lentos - 1); if (lentos > 25) { lentos = 0; salto = 2; } }
    previo = t;
  }

  // el fondo y el primer cuadro del agujero se preparan bajo el velo de carga
  var listo = new Promise(function (ok) {
    requestAnimationFrame(function () { setTimeout(function () { pintarCosmos(); if (pr) pintar(performance.now()); ok(); }, 0); });
  });
  if (window.fxEspera) window.fxEspera(listo);
  addEventListener('resize', function () { clearTimeout(pintarCosmos.t); pintarCosmos.t = setTimeout(pintarCosmos, 200); });
  function armar() { tEntrada = performance.now(); raiz.classList.add('rg-armado'); }
  listo.then(function () {
    requestAnimationFrame(bucle);
    if (quieto) { tEntrada = performance.now() - 1e5; raiz.classList.add('rg-armado'); }
    else if (window.fxRevelado) window.fxRevelado.then(armar); else armar();
  });
  // al volver con «atrás» desde la caché, todo queda armado
  addEventListener('pageshow', function (e) { if (e.persisted) { tEntrada = performance.now() - 1e5; raiz.classList.add('rg-armado'); } });
})();
