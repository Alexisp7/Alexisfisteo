// Red minera de Orcopampa: un selector de rutas por la red real y el camión que recorre la elegida.
// Adaptado del caso real del sitio del Qiskit Fall Fest 2026 (js/caso-minero.js, vista de resumen).
(function () {
  var raiz = document.querySelector('[data-red-orcopampa]');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sub(t) { return '<sub>' + t + '</sub>'; }
  function km(v) { return v < 1 ? Math.round(v * 1000) + ' m' : (Math.round(v * 1000) / 1000) + ' km'; }

  var L = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8'], s = 'x1';
  var IDX = {}; L.forEach(function (k, i) { IDX[k] = i + 1; });
  var NOMBRE = { x1: 'Planta', x2: 'J1', x3: 'Tajo', x4: 'Botadero', x5: 'J2', x6: 'Lixiviación', x7: 'Baja ley', x8: 'Relaves' };
  var CAMINOS = [['x1', 'x2', 1.6], ['x2', 'x3', 0.072], ['x2', 'x4', 0.035], ['x2', 'x8', 1.4], ['x2', 'x5', 1.4], ['x1', 'x5', 1.7], ['x8', 'x5', 1.0], ['x5', 'x6', 0.2], ['x5', 'x7', 0.5]];
  var DIST = {}; CAMINOS.forEach(function (c) { DIST[c[0] + c[1]] = c[2]; DIST[c[1] + c[0]] = c[2]; });
  function camino(a, b) { return a !== b && DIST[a + b] != null; }
  var POS = { x1: [74, 150], x2: [262, 96], x3: [176, 38], x4: [348, 38], x5: [348, 214], x6: [250, 266], x7: [446, 266], x8: [586, 150] };
  var ETIQ = { x1: [0, 42, 'middle'], x2: [0, 41, 'middle'], x3: [-31, 5, 'end'], x4: [31, 5, 'start'], x5: [0, 41, 'middle'], x6: [-31, 5, 'end'], x7: [31, 5, 'start'], x8: [0, 42, 'middle'] };
  var R = 24;
  // Rutas válidas por los caminos reales: salen de la planta, pasan por los 8 lugares y vuelven.
  // La primera es la óptima (7,314 km, la que da el VQE); las demás son recorridos más largos.
  var RUTAS = [
    [1, 5, 7, 5, 6, 5, 8, 2, 4, 2, 3, 2, 1],
    [1, 5, 6, 5, 7, 5, 8, 5, 2, 3, 2, 4, 2, 1],
    [1, 2, 3, 2, 4, 2, 5, 6, 5, 7, 5, 8, 2, 1],
    [1, 5, 2, 3, 2, 4, 2, 8, 5, 6, 5, 7, 5, 1],
    [1, 5, 6, 5, 7, 5, 2, 3, 2, 4, 2, 8, 2, 1]
  ].map(function (r) { return r.map(function (i) { return 'x' + i; }); });
  function largo(r) { var c = 0; for (var i = 1; i < r.length; i++) c += DIST[r[i - 1] + r[i]]; return c; }
  function kmTxt(v) { return (Math.round(v * 1000) / 1000).toFixed(3).replace('.', ','); }
  var elegida = 0, ruta = RUTAS[0], T = ruta.length;

  function el(tag, attrs, padre) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); padre.appendChild(n); return n; }

  function grafo(svg) {
    var r = ruta, mid = 'ro-flecha';
    var defs = el('defs', {}, svg);
    var mk = el('marker', { id: mid, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'tm-punta' }, mk);
    var mk3 = el('marker', { id: mid + '-v', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'caso-punta-v' }, mk3);
    var usados = {};
    for (var i = 1; i < r.length; i++) usados[[r[i - 1], r[i]].sort().join('')] = 1;
    CAMINOS.forEach(function (c) {
      var a = POS[c[0]], b = POS[c[1]];
      if (usados[[c[0], c[1]].sort().join('')]) el('line', { 'class': 'tm-resalte', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, svg);
      el('line', { 'class': 'tm-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, svg);
    });
    for (var t = 1; t < r.length; t++) {
      var a0 = POS[r[t - 1]], b0 = POS[r[t]];
      var ex = b0[0] - a0[0], ey = b0[1] - a0[1], l = Math.hypot(ex, ey), nx = -ey / l * 5, ny = ex / l * 5, R0 = R + 4;
      var vuelve = r.slice(0, t).indexOf(r[t]) >= 0;
      el('line', { 'class': vuelve ? 'tm-dir caso-vuelve' : 'tm-dir', x1: a0[0] + ex / l * R0 + nx, y1: a0[1] + ey / l * R0 + ny, x2: b0[0] - ex / l * (R0 + 2) + nx, y2: b0[1] - ey / l * (R0 + 2) + ny, 'marker-end': 'url(#' + mid + (vuelve ? '-v' : '') + ')' }, svg);
    }
    CAMINOS.forEach(function (c) {
      var a = POS[c[0]], b = POS[c[1]];
      el('text', { 'class': 'caso-dist', x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + 4 }, svg).textContent = km(c[2]);
    });
    L.forEach(function (k) {
      var p = POS[k];
      var g = el('g', { 'class': 'tm-nodo-g caso-nodo visitado' + (k === s ? ' es-s' : '') }, svg);
      el('circle', { 'class': 'tm-nodo', cx: p[0], cy: p[1], r: R }, g);
      // miniatura del lugar, recortada al círculo
      var cid = 'ro-clip-' + k;
      el('circle', { cx: p[0], cy: p[1], r: R - 1.6 }, el('clipPath', { id: cid }, defs));
      var ic = el('g', { 'class': 'ro-icono', 'clip-path': 'url(#' + cid + ')' }, g);
      if (window.RO_ICONOS) window.RO_ICONOS(k, el('g', { transform: 'translate(' + p[0] + ' ' + (p[1] + 3.5) + ') scale(1.2)' }, ic));
      el('circle', { 'class': 'tm-nodo-borde', cx: p[0], cy: p[1], r: R }, g);
      var e = ETIQ[k];
      var nm = el('text', { 'class': 'caso-nombre', x: p[0] + e[0], y: p[1] + e[1], 'text-anchor': e[2] }, g);
      var xi = el('tspan', { 'class': 'caso-nombre-x' }, nm); xi.textContent = 'x';
      el('tspan', { 'class': 'caso-nombre-sub', dy: '3' }, nm).textContent = IDX[k];
      el('tspan', { dy: '-3', dx: '3' }, nm).textContent = NOMBRE[k];
    });
    if (!quieto) camion(svg);
  }

  function camion(svg) {
    var h = el('g', { 'class': 'camion' }, svg);
    var cuerpo = el('g', { 'class': 'camion-cuerpo' }, h);
    var aire = el('g', { 'class': 'camion-aire' }, cuerpo);
    [[-13, 0], [-9, .35], [-5, .7]].forEach(function (z) { el('line', { x1: -22, y1: z[0], x2: -34, y2: z[0], style: 'animation-delay:-' + z[1] + 's' }, aire); });
    el('rect', { 'class': 'camion-caja', x: -16, y: -16, width: 20, height: 12, rx: 1.5 }, cuerpo);
    el('path', { 'class': 'camion-cabina', d: 'M4 -12 H11 L15 -7 V-4 H4 Z' }, cuerpo);
    el('circle', { 'class': 'camion-rueda', cx: -11, cy: -2.5, r: 3 }, cuerpo);
    el('circle', { 'class': 'camion-rueda', cx: 9, cy: -2.5, r: 3 }, cuerpo);
  }

  // el camión va montado sobre la flecha de cada tramo, con una pausa en cada lugar y una larga al terminar
  var t0 = 0, celdas = [];
  function andar(ahora) {
    requestAnimationFrame(andar);
    var c = svg.querySelector('.camion'); if (!c) return;
    var r = ruta, TRAMO = 1700, PAUSA = 450, FIN = 3200, tramos = r.length - 1, ciclo = tramos * (TRAMO + PAUSA) + FIN;
    if (!t0) t0 = ahora;
    var e = (ahora - t0) % ciclo, n = Math.min(tramos - 1, Math.floor(e / (TRAMO + PAUSA)));
    var u = Math.min(1, (e - n * (TRAMO + PAUSA)) / TRAMO), mueve = u > 0 && u < 1;
    if (e >= tramos * (TRAMO + PAUSA)) { n = tramos - 1; u = 1; mueve = false; }
    var k = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    var a = POS[r[n]], b = POS[r[n + 1]];
    var ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1, nx = -ey / l * 5, ny = ex / l * 5, R0 = R + 4;
    var x1 = a[0] + ex / l * R0 + nx, y1 = a[1] + ey / l * R0 + ny, x2 = b[0] - ex / l * (R0 + 2) + nx, y2 = b[1] - ey / l * (R0 + 2) + ny;
    var x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k;
    var ang = Math.atan2(ey, ex) * 180 / Math.PI, izq = ex < 0;
    c.setAttribute('opacity', '1');
    c.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (izq ? ang + 180 : ang).toFixed(1) + ')');
    c.firstChild.setAttribute('transform', izq ? 'scale(-1 1)' : '');
    c.classList.toggle('mueve', mueve);
    // la columna del tiempo en que va el camión se marca en la matriz
    var tAhora = u >= 1 ? n + 2 : n + 1;
    celdas.forEach(function (th, i) { th.classList.toggle('ahora', i + 1 === tAhora); });
  }

  function matriz(caja) {
    var cols = []; for (var t = 1; t <= T; t++) cols.push(t);
    var h = '<table class="caso-tabla"><tr><th></th>' + cols.map(function (t) { return '<th>t' + sub(t) + '</th>'; }).join('') + '</tr>';
    L.forEach(function (k, n) {
      h += '<tr><th><span class="caso-tabla-x">x' + sub(n + 1) + '</span> ' + NOMBRE[k] + '</th>' + cols.map(function (t) {
        var v = ruta[t - 1] === k ? 1 : 0, tono = v && ruta.slice(0, t - 1).indexOf(k) >= 0 ? ' revisita' : '';
        return '<td class="' + (v ? 'uno' : '') + tono + '" title="x' + (n + 1) + ',' + t + '">' + v + '</td>';
      }).join('') + '</tr>';
    });
    caja.innerHTML = h + '</table>';
    celdas = Array.prototype.slice.call(caja.querySelectorAll('tr:first-child th')).slice(1);
  }

  // ── selector de rutas: solo el costo total ──
  function $(n) { return raiz.querySelector('[data-ro="' + n + '"]'); }
  var selector = $('select'), selBtn = $('sel-btn'), lista = $('rutas'), costo = $('costo');
  var minimo = Math.min.apply(null, RUTAS.map(largo));
  function fila(r, n) {
    return '<span class="tm-r-n">R<sup>' + (n + 1) + '</sup></span><span class="tm-r-camino">' + r.map(function (k) { return IDX[k]; }).join('·') + '</span>' +
      '<span class="tm-r-min">óptima</span><span class="tm-r-coste">' + kmTxt(largo(r)) + ' km</span>';
  }
  function abrir(si) { selector.classList.toggle('abierto', si); selBtn.setAttribute('aria-expanded', si ? 'true' : 'false'); }
  function pintar() {
    ruta = RUTAS[elegida]; T = ruta.length; t0 = 0;
    selBtn.innerHTML = '<span class="tm-r-n">R<sup>' + (elegida + 1) + '</sup></span><span class="tm-r-camino">' + ruta.map(function (k) { return IDX[k]; }).join('·') + '</span><i class="tm-sel-chev" aria-hidden="true"></i>';
    costo.innerHTML = '<small>Costo total</small><b>' + kmTxt(largo(ruta)) + '<span>km</span></b>';
    lista.innerHTML = '';
    RUTAS.forEach(function (r, n) {
      var li = document.createElement('li');
      li.className = 'tm-ruta' + (n === elegida ? ' elegida' : '') + (Math.abs(largo(r) - minimo) < 1e-9 ? ' minima' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', n === elegida ? 'true' : 'false');
      li.innerHTML = '<button type="button">' + fila(r, n) + '</button>';
      li.querySelector('button').addEventListener('click', function () { elegida = n; abrir(false); pintar(); });
      lista.appendChild(li);
    });
    svg.innerHTML = '';
    grafo(svg);
    matriz($('matriz'));
  }
  selBtn.addEventListener('click', function () { abrir(!selector.classList.contains('abierto')); });
  document.addEventListener('click', function (ev) { if (!selector.contains(ev.target)) abrir(false); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') abrir(false); });

  var svg = $('grafo');
  pintar();
  if (!quieto) requestAnimationFrame(andar);
})();
