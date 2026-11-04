// Miniaturas isométricas de cada lugar de la red de Orcopampa, dibujadas como piezas
// sólidas (cara superior clara, dos caras laterales por orientación, un solo acento dorado)
// y con una animación pequeña y tranquila. Cada una cabe en el círculo de su nodo.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = 0.866, S = 0.5;
  function P(x, y, z) { return [(x - y) * C, (x + y) * S - (z || 0)]; }
  function f(v) { return Math.round(v * 100) / 100; }
  function pts(a) { return a.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); padre.appendChild(n); return n; }
  function poly(g, a, cls) { return el('polygon', { points: pts(a), 'class': cls }, g); }
  function anim(n, at) { if (!quieto) el(at.attributeName === 'transform' || at.type ? 'animateTransform' : 'animate', Object.assign({ repeatCount: 'indefinite' }, at), n); return n; }

  // caja: x, y, z (esquina) y w, d, h (medidas); se ven la cara de arriba y las dos de adelante
  function caja(g, x, y, z, w, d, h, tono) {
    var t = tono || '';
    poly(g, [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'an-i' + t);
    poly(g, [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], 'an-d' + t);
    poly(g, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'an-s' + t);
  }
  // rayas sobre la cara izquierda (y = y0) entre x0 y x1: ventanas, juntas
  function ranura(g, x0, x1, y, z0, z1) { poly(g, [P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], 'an-hueco'); }
  // cilindro vertical
  function cilindro(g, x, y, z, r, h, tono) {
    var c0 = P(x, y, z), c1 = P(x, y, z + h), rx = r * 1.2247, ry = r * 0.7071, t = tono || '';
    el('path', { 'class': 'an-i' + t, d: 'M' + f(c1[0] - rx) + ' ' + f(c1[1]) + ' L' + f(c0[0] - rx) + ' ' + f(c0[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(c0[0]) + ' ' + f(c0[1] + ry) + ' L' + f(c1[0]) + ' ' + f(c1[1] + ry) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(c1[0] - rx) + ' ' + f(c1[1]) + 'Z' }, g);
    el('path', { 'class': 'an-d' + t, d: 'M' + f(c1[0]) + ' ' + f(c1[1] + ry) + ' L' + f(c0[0]) + ' ' + f(c0[1] + ry) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(c0[0] + rx) + ' ' + f(c0[1]) + ' L' + f(c1[0] + rx) + ' ' + f(c1[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 1 ' + f(c1[0]) + ' ' + f(c1[1] + ry) + 'Z' }, g);
    el('ellipse', { 'class': 'an-s' + t, cx: f(c1[0]), cy: f(c1[1]), rx: f(rx), ry: f(ry) }, g);
    return c1;
  }
  // montón cónico: luz por la izquierda, sombra por la derecha
  function monton(g, x, y, r, h, tono) {
    var b = P(x, y, 0), a = P(x, y, h), rx = r * 1.2247, ry = r * 0.7071, t = tono || '';
    el('path', { 'class': 'an-i' + t, d: 'M' + f(a[0]) + ' ' + f(a[1]) + ' L' + f(b[0] - rx) + ' ' + f(b[1]) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(b[0] + rx * .18) + ' ' + f(b[1] + ry * .98) + 'Z' }, g);
    el('path', { 'class': 'an-d' + t, d: 'M' + f(a[0]) + ' ' + f(a[1]) + ' L' + f(b[0] + rx * .18) + ' ' + f(b[1] + ry * .98) + ' A' + f(rx) + ' ' + f(ry) + ' 0 0 0 ' + f(b[0] + rx) + ' ' + f(b[1]) + 'Z' }, g);
    return a;
  }
  // losa del suelo con tornillos en las esquinas
  function base(g, s) {
    caja(g, -s, -s, -2, 2 * s, 2 * s, 2, ' an-base');
    [[-s + 1.6, -s + 1.6], [s - 1.6, -s + 1.6], [-s + 1.6, s - 1.6], [s - 1.6, s - 1.6]].forEach(function (q) { var p = P(q[0], q[1], 0); el('circle', { 'class': 'an-tornillo', cx: f(p[0]), cy: f(p[1]), r: .45 }, g); });
  }
  // gotas o rocas que caen de a a b, desfasadas
  function caida(g, a, b, n, dur, cls, r) {
    for (var i = 0; i < n; i++) {
      var c = el('circle', { 'class': cls, cx: f(a[0]), cy: f(a[1]), r: r || .7, opacity: quieto ? .8 : 0 }, g);
      var d = (dur / n * i).toFixed(2) + 's';
      anim(c, { attributeName: 'cx', values: f(a[0]) + ';' + f(b[0]), dur: dur + 's', begin: d });
      anim(c, { attributeName: 'cy', values: f(a[1]) + ';' + f(b[1]), dur: dur + 's', begin: d, calcMode: 'spline', keySplines: '.5 0 1 1', keyTimes: '0;1' });
      anim(c, { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;.15;.8;1', dur: dur + 's', begin: d });
    }
  }

  var ICONOS = {
    // Planta de procesamiento: nave, chancadora y chimenea con humo
    x1: function (g) {
      base(g, 13);
      var top = cilindro(g, 5, -10, 0, 2, 15);
      caja(g, -11, -9, 0, 13, 11, 8);
      for (var i = 0; i < 4; i++) ranura(g, -10 + i * 3, -8.6 + i * 3, 2, 3, 5.6);
      caja(g, -11, -9, 8, 13, 11, 1.2, ' an-oro');
      caja(g, 3, -6, 0, 8, 7, 5);
      ranura(g, 4.4, 9.6, 1, 0, 3.2);
      for (var j = 0; j < 3; j++) {
        var h = el('circle', { 'class': 'an-humo', cx: f(top[0]), cy: f(top[1] - 1), r: 1.4, opacity: quieto ? .5 : 0 }, g), d = (j * 1.1) + 's';
        anim(h, { attributeName: 'cy', values: f(top[1] - 1) + ';' + f(top[1] - 11), dur: '3.3s', begin: d });
        anim(h, { attributeName: 'cx', values: f(top[0]) + ';' + f(top[0] - 4), dur: '3.3s', begin: d });
        anim(h, { attributeName: 'r', values: '1.2;3.2', dur: '3.3s', begin: d });
        anim(h, { attributeName: 'opacity', values: '0;.85;0', dur: '3.3s', begin: d });
      }
    },
    // Junta J1: cruce de vías con un semáforo que parpadea
    x2: function (g) { junta(g, false); },
    // Tajo: terrazas que bajan y un camión que sube por la rampa
    x3: function (g) {
      var s = [13, 9.5, 6, 2.8];
      for (var i = 0; i < s.length; i++) {
        var a = s[i], z = -i * 2.6;
        poly(g, [P(-a, -a, z), P(a, -a, z), P(a, a, z), P(-a, a, z)], i ? 'an-s' : 'an-s an-base');
        if (i < s.length - 1) {
          var b = s[i + 1], z1 = z - 2.6;
          poly(g, [P(-b, -b, z), P(b, -b, z), P(b, -b, z1), P(-b, -b, z1)], 'an-i');
          poly(g, [P(-b, -b, z), P(-b, b, z), P(-b, b, z1), P(-b, -b, z1)], 'an-d');
        }
      }
      var cam = el('g', {}, g);
      caja(cam, -2.2, -11.4, 0, 4.2, 2.6, 1.8, ' an-oro');
      caja(cam, 2, -11.4, 0, 1.6, 2.6, 2.6);
      var d0 = P(-8, 0, 0), d1 = P(6, 0, 0);
      anim(cam, { attributeName: 'transform', type: 'translate', values: f(d0[0]) + ' ' + f(d0[1]) + ';' + f(d1[0]) + ' ' + f(d1[1]) + ';' + f(d0[0]) + ' ' + f(d0[1]), dur: '6s', calcMode: 'spline', keyTimes: '0;.5;1', keySplines: '.45 0 .55 1;.45 0 .55 1' });
      if (quieto) cam.setAttribute('transform', 'translate(' + f(d0[0]) + ' ' + f(d0[1]) + ')');
    },
    // Botadero: desmonte cónico con rocas que ruedan por la ladera
    x4: function (g) {
      base(g, 13);
      var a = monton(g, -1, -1, 10.5, 12);
      caja(g, 5, 6, 0, 5, 3, 1.4);
      caja(g, 6, 6.4, 1.4, 3, 2.2, 1.6, ' an-oro');
      caida(g, [a[0] + .5, a[1] + 1], P(9, 2, 0), 3, 2.4, 'an-roca', .8);
      caida(g, [a[0] - .5, a[1] + 1], P(-9, 4, 0), 2, 2.8, 'an-roca', .7);
    },
    // Junta J2: cruce con una pluma de control que sube y baja
    x5: function (g) { junta(g, true); },
    // Pila de lixiviación: pila escalonada, aspersores y la poza de solución
    x6: function (g) {
      base(g, 13);
      poly(g, [P(4, 6, 0), P(12, 6, 0), P(12, 12, 0), P(4, 12, 0)], 'an-agua');
      tronco(g, -11, -11, 13, 14, 6, 2.2);
      for (var i = 0; i < 3; i++) {
        var p = P(-6.5 + i * 3.6, -6 + i * 1.6, 6);
        el('line', { 'class': 'an-tubo', x1: f(p[0]), y1: f(p[1]), x2: f(p[0]), y2: f(p[1] - 1.4) }, g);
        caida(g, [p[0], p[1] - 1.6], [p[0] + (i - 1) * 2, p[1] + 1.4], 3, 1.4, 'an-gota', .45);
      }
      var o = P(8, 9, 0), r = el('ellipse', { 'class': 'an-onda', cx: f(o[0]), cy: f(o[1]), rx: .6, ry: .35 }, g);
      anim(r, { attributeName: 'rx', values: '.6;4.8', dur: '2.6s' });
      anim(r, { attributeName: 'ry', values: '.35;2.8', dur: '2.6s' });
      anim(r, { attributeName: 'opacity', values: '1;0', dur: '2.6s' });
    },
    // Stock de baja ley: faja transportadora que alimenta el montón
    x7: function (g) {
      base(g, 13);
      var a = monton(g, -3, -3, 9.5, 9);
      var p0 = P(12, -3, 1), p1 = P(1, -3, 10);
      [P(9, -3, 0), P(5, -3, 0)].forEach(function (q, i) { var t = P(i ? 5 : 9, -3, i ? 6.6 : 3.4); el('line', { 'class': 'an-poste', x1: f(q[0]), y1: f(q[1]), x2: f(t[0]), y2: f(t[1]) }, g); });
      el('line', { 'class': 'an-faja', x1: f(p0[0]), y1: f(p0[1]), x2: f(p1[0]), y2: f(p1[1]) }, g);
      var m = el('line', { 'class': 'an-faja-m', x1: f(p0[0]), y1: f(p0[1]), x2: f(p1[0]), y2: f(p1[1]) }, g);
      anim(m, { attributeName: 'stroke-dashoffset', values: '0;-6', dur: '.9s' });
      el('circle', { 'class': 'an-polea', cx: f(p1[0]), cy: f(p1[1]), r: 1 }, g);
      caida(g, [p1[0] - .4, p1[1] + 1], [a[0] + .3, a[1] + .5], 3, 1.1, 'an-roca', .7);
    },
    // Relaves: dique con su espejo de agua, tubería de descarga y ondas
    x8: function (g) {
      base(g, 13);
      tronco(g, -12, -12, 24, 24, 4, 2.4, true);
      poly(g, [P(-9.6, -9.6, 1.6), P(9.6, -9.6, 1.6), P(9.6, 9.6, 1.6), P(-9.6, 9.6, 1.6)], 'an-agua');
      var t0 = P(-9.6, -6, 4.6), t1 = P(-4, -6, 3.2);
      el('line', { 'class': 'an-tubo2', x1: f(P(-14, -6, 4.6)[0]), y1: f(P(-14, -6, 4.6)[1]), x2: f(t1[0]), y2: f(t1[1]) }, g);
      caida(g, [t1[0], t1[1] + .6], [t1[0] + .4, t1[1] + 2.4], 3, .8, 'an-gota', .5);
      var o = P(-3, -5, 1.6);
      [0, 1].forEach(function (k) {
        var r = el('ellipse', { 'class': 'an-onda', cx: f(o[0]), cy: f(o[1] + 1), rx: .6, ry: .35, opacity: quieto ? .6 : 0 }, g);
        anim(r, { attributeName: 'rx', values: '.6;9', dur: '3.2s', begin: (k * 1.6) + 's' });
        anim(r, { attributeName: 'ry', values: '.35;5.2', dur: '3.2s', begin: (k * 1.6) + 's' });
        anim(r, { attributeName: 'opacity', values: '1;0', dur: '3.2s', begin: (k * 1.6) + 's' });
      });
    }
  };

  // tronco de pirámide (pila o dique) con taludes; hueco = solo el borde
  function tronco(g, x, y, w, d, h, talud, hueco) {
    var e = talud, top = [P(x + e, y + e, h), P(x + w - e, y + e, h), P(x + w - e, y + d - e, h), P(x + e, y + d - e, h)];
    poly(g, [P(x, y + d, 0), P(x + w, y + d, 0), top[2], top[3]], 'an-i');
    poly(g, [P(x + w, y, 0), P(x + w, y + d, 0), top[2], top[1]], 'an-d');
    poly(g, top, 'an-s');
    if (hueco) {
      var k = e + 1.2, inn = [P(x + k, y + k, h), P(x + w - k, y + k, h), P(x + w - k, y + d - k, h), P(x + k, y + d - k, h)];
      poly(g, inn, 'an-i');
    } else {
      for (var i = 1; i < 3; i++) { var a = P(x + e + i * 3.6, y + e, h), b = P(x + e + i * 3.6, y + d - e, h); el('line', { 'class': 'an-surco', x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) }, g); }
    }
  }

  // cruce de dos vías; J1 con semáforo, J2 con pluma
  function junta(g, pluma) {
    base(g, 13);
    caja(g, -13, -3.2, 0, 26, 6.4, .5, ' an-via');
    caja(g, -3.2, -13, 0, 6.4, 26, .5, ' an-via');
    [[-13, -9], [-3.5, 3.5], [5, 13]].forEach(function (s) { var a = P(s[0], 0, .5), b = P(s[0] + 4, 0, .5); el('line', { 'class': 'an-linea', x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]) }, g); });
    caja(g, 5, -11, 0, 5, 5, 3.5);
    caja(g, -11, 5, 0, 5, 4, 2.5);
    if (!pluma) {
      var pie = P(-7, -7, 0), cab = P(-7, -7, 11);
      el('line', { 'class': 'an-poste', x1: f(pie[0]), y1: f(pie[1]), x2: f(cab[0]), y2: f(cab[1]) }, g);
      caja(g, -8.2, -8.2, 11, 2.4, 2.4, 4.4);
      var luz = P(-5.8, -7, 13.2), l = el('circle', { 'class': 'an-luz', cx: f(luz[0]), cy: f(luz[1]), r: .9 }, g);
      var halo = el('circle', { 'class': 'an-halo', cx: f(luz[0]), cy: f(luz[1]), r: 2.6, opacity: 0 }, g);
      anim(l, { attributeName: 'opacity', values: '.25;1;1;.25', keyTimes: '0;.1;.5;.6', dur: '1.8s' });
      anim(halo, { attributeName: 'opacity', values: '0;.55;.4;0', keyTimes: '0;.1;.5;.6', dur: '1.8s' });
    } else {
      caja(g, 5, 4, 0, 2.4, 2.4, 4.6);
      var piv = P(6.2, 5.2, 4.2), fin = P(6.2, -10, 4.2);
      var arm = el('g', {}, g);
      el('line', { 'class': 'an-pluma', x1: f(piv[0]), y1: f(piv[1]), x2: f(fin[0]), y2: f(fin[1]) }, arm);
      el('line', { 'class': 'an-pluma-r', x1: f(piv[0]), y1: f(piv[1]), x2: f(fin[0]), y2: f(fin[1]) }, arm);
      el('circle', { 'class': 'an-tornillo', cx: f(piv[0]), cy: f(piv[1]), r: .7 }, g);
      anim(arm, { attributeName: 'transform', type: 'rotate', values: '0 ' + f(piv[0]) + ' ' + f(piv[1]) + ';58 ' + f(piv[0]) + ' ' + f(piv[1]) + ';58 ' + f(piv[0]) + ' ' + f(piv[1]) + ';0 ' + f(piv[0]) + ' ' + f(piv[1]) + ';0 ' + f(piv[0]) + ' ' + f(piv[1]), keyTimes: '0;.2;.55;.75;1', dur: '5s', calcMode: 'spline', keySplines: '.45 0 .55 1;0 0 1 1;.45 0 .55 1;0 0 1 1' });
    }
  }

  window.RO_ICONOS = function (k, g) { if (ICONOS[k]) ICONOS[k](g); };
})();
