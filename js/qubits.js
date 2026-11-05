// Teselado de qubits: esferas de Bloch doradas detrás de una sección.
// En reposo se ven al 35%; al pasar el mouse la esfera y sus 3 vecinas se
// ven enteras y su flecha gira de polo a polo desde donde estaba, cada una
// en su propia fase. Un clic mide el qubit: colapsa al polo más cercano, |0⟩ o |1⟩
// (azul para |0⟩, rojo para |1⟩, con el ket encima); solo si la flecha está
// justo en el ecuador queda en mostaza con una H, girando por el ecuador,
// hasta que un segundo clic la mide al azar en 0 o 1.
// Cada <canvas class="qubits-fondo"> cubre a su elemento padre, o solo
// hasta el elemento que indique data-hasta. Se omiten las esferas que
// tocarían texto o una nota, para que nada quede encima de las letras.
// Con data-libre="d1 y1, d2 y2, ..." se deja sin esferas una zona simétrica:
// cada par es la media anchura en píxeles desde el centro y la altura en
// fracción de la sección. Con data-linea="selector" se traza una línea fina
// y corta sobre ese elemento, centrada, con un cuadrito.
(function () {
  var R = 8, DX = 26, DY = DX * Math.sqrt(3) / 2;
  var SPIN = 3.2, TAU = Math.PI * 2;
  var LINE = '#E0DDD8';
  var GOLD = '200,169,110', BLUE = '37,99,235', RED = '220,38,38', MUSTARD = '206,154,18';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rnd(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function init(canvas) {
    if (!canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var section = canvas.parentElement;
    var limit = canvas.getAttribute('data-hasta');
    var profile = (canvas.getAttribute('data-libre') || '').split(',').map(function (pair) {
      return pair.trim().split(/\s+/).map(Number);
    }).filter(function (p) { return p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]); });

    // contorno de la zona libre: lado derecho de arriba a abajo y luego el
    // izquierdo de abajo a arriba, en píxeles de la sección
    function outline() {
      var cx = w / 2;
      var right = profile.map(function (p) { return [cx + p[0], p[1] * h]; });
      var left = profile.map(function (p) { return [cx - p[0], p[1] * h]; }).reverse();
      return right.concat(left);
    }

    // la esfera queda fuera si su centro cae en la zona o la roza
    function inFree(x, y) {
      if (profile.length < 2) return false;
      var pts = outline(), inside = false, m = R + 4;
      for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        var a = pts[i], b = pts[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
        var ex = b[0] - a[0], ey = b[1] - a[1];
        var t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / (ex * ex + ey * ey || 1)));
        var dx = a[0] + t * ex - x, dy = a[1] + t * ey - y;
        if (dx * dx + dy * dy < m * m) return true;
      }
      return inside;
    }

    var qubits = [], current = [], w = 0, h = 0, visible = false, raf = 0, last = 0;

    // cajas de cada línea de texto (y de cada nota) dentro de la sección
    function blockers() {
      var base = section.getBoundingClientRect(), boxes = [], pad = 4;
      function add(r) {
        if (r.width && r.height) boxes.push([r.left - base.left - pad, r.top - base.top - pad, r.right - base.left + pad, r.bottom - base.top + pad]);
      }
      var walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, null);
      var range = document.createRange(), node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        range.selectNodeContents(node);
        Array.prototype.forEach.call(range.getClientRects(), add);
      }
      Array.prototype.forEach.call(section.querySelectorAll('.nota'), function (el) { add(el.getBoundingClientRect()); });
      return boxes;
    }

    function covered(boxes, x, y) {
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (x + R > b[0] && x - R < b[2] && y + R > b[1] && y - R < b[3]) return true;
      }
      return false;
    }

    var lineSel = canvas.getAttribute('data-linea'), lineY = null;
    var PAPEL = canvas.getAttribute('data-papel') || '255,255,255';
    // ola de medición ligada al scroll (data-ola): al bajar, un frente sale de
    // todo el borde interior de cada costado y mide las esferas a su paso; al subir se deshace. Avanza suave,
    // siguiendo al scroll con retraso, para que se vea lenta pero fluida
    var ola = canvas.hasAttribute('data-ola') && !still, olaMeta = 0, olaP = 0, BANDA = 140, altoSec = 1;
    function olaObjetivo() {
      var recorrido = Math.max(1, altoSec * 0.75);
      return Math.max(0, Math.min(1, window.scrollY / recorrido));
    }
    // extremos de la zona libre a la altura y
    function spanAt(y) {
      if (profile.length < 2) return null;
      var pts = outline(), xs = [];
      for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        var a = pts[i], b = pts[j];
        if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]));
      }
      return xs.length >= 2 ? [Math.min.apply(null, xs), Math.max.apply(null, xs)] : null;
    }

    function layout() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = section.clientWidth; h = section.clientHeight;
      var stop = limit && section.querySelector(limit);
      if (stop) h = Math.round(stop.getBoundingClientRect().top - section.getBoundingClientRect().top);
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      qubits = []; current = []; sprites = {}; escala = dpr; altoSec = section.offsetHeight; olaO = null;
      var boxes = blockers();
      var lineEl = lineSel && section.querySelector(lineSel);
      lineY = lineEl ? Math.round(lineEl.getBoundingClientRect().top - section.getBoundingClientRect().top) + 0.5 : null;
      var row = 0, k = 0;
      // solo filas completas, para que ninguna esfera quede cortada abajo
      for (var y = DY / 2; y + R + 1 <= h; y += DY, row++) {
        // filas centradas en la mitad de la sección, para que ambos lados
        // sean espejo uno del otro
        var x0 = w / 2 + (row % 2 ? DX / 2 : 0);
        x0 -= Math.ceil((x0 + DX) / DX) * DX;
        for (var x = x0; x < w + DX; x += DX, k++) {
          if (covered(boxes, x, y) || inFree(x, y)) continue;
          qubits.push({
            x: x, y: y,
            theta: Math.acos(1 - 2 * rnd(k + 1)),
            phi: rnd(k + 7) * TAU,
            theta0: Math.acos(1 - 2 * rnd(k + 1)),
            phi0: rnd(k + 7) * TAU,
            drift: (rnd(k + 13) - 0.5) * 0.0012,
            hot: false, frozen: false
          });
        }
      }
      pintarBase(dpr);
    }

    // El cuerpo de cada esfera (contorno y ecuador) no cambia nunca: solo se
    // mueve la flecha. Por eso las esferas en reposo se dibujan una sola vez
    // en una capa aparte, y cada cuadro solo copia esa capa y traza las
    // flechas. Las esferas encendidas, medidas o tocadas por la ola usan una
    // plantilla ya dibujada de su color (un sello por estilo).
    var base = document.createElement('canvas'), bctx = base.getContext('2d');
    var sprites = {}, escala = 1, S = R + 2;
    function cuerpo(c, x, y) {
      c.beginPath();
      c.moveTo(x + R, y); c.arc(x, y, R, 0, TAU);
      c.moveTo(x + R, y); c.ellipse(x, y, R, R * 0.3, 0, 0, Math.PI);
      c.stroke();
      c.setLineDash([1.4, 1.6]); c.beginPath();
      c.moveTo(x - R, y); c.ellipse(x, y, R, R * 0.3, 0, Math.PI, TAU);
      c.stroke(); c.setLineDash([]);
    }
    function pintarBase(dpr) {
      base.width = canvas.width; base.height = canvas.height;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.strokeStyle = 'rgba(' + GOLD + ',0.60)'; bctx.lineWidth = 0.85;
      for (var i = 0; i < qubits.length; i++) cuerpo(bctx, qubits[i].x, qubits[i].y);
    }
    function sello(clave, color, lw) {
      var sp = sprites[clave];
      if (sp) return sp;
      sp = sprites[clave] = document.createElement('canvas');
      sp.width = sp.height = Math.ceil(2 * S * escala);
      var c = sp.getContext('2d');
      c.setTransform(escala, 0, 0, escala, 0, 0);
      c.strokeStyle = color; c.lineWidth = lw;
      cuerpo(c, S, S);
      return sp;
    }

    function nearest(px, py, count) {
      var found = [];
      if (py > h) return found;
      for (var i = 0; i < qubits.length; i++) {
        var q = qubits[i], dx = q.x - px, dy = q.y - py;
        if (Math.abs(dx) > DX * 2 || Math.abs(dy) > DY * 2.5) continue;
        found.push({ q: q, d: dx * dx + dy * dy });
      }
      found.sort(function (a, b) { return a.d - b.d; });
      return found.slice(0, count).map(function (f) { return f.q; });
    }

    function onSphere(q, px, py) {
      var dx = q.x - px, dy = q.y - py;
      return dx * dx + dy * dy <= (R + 3) * (R + 3);
    }

    function release() {
      current.forEach(function (q) { q.hot = false; });
      current = [];
      start();
    }

    function activate(px, py) {
      var group = nearest(px, py, 4).filter(function (q) { return !q.frozen; });
      var center = group[0];
      if (!center || !onSphere(center, px, py)) return release();
      if (current[0] === center) return;
      release();
      // cada flecha sigue desde donde apunta: se pasa al meridiano que se ve
      // de frente (phi = 0) conservando su dirección en pantalla, así gira
      // por el contorno de la esfera sin saltos
      group.forEach(function (q) {
        if (q.phi !== 0) {
          var st = Math.sin(q.theta);
          var vx = st * Math.cos(q.phi);
          var vy = -Math.cos(q.theta) * 0.95 + st * Math.sin(q.phi) * 0.3;
          q.theta = Math.atan2(vx, -vy / 0.95);
          q.phi = 0;
        }
        q.hot = true;
      });
      current = group;
      start();
    }

    function freeze(px, py) {
      var q = nearest(px, py, 1)[0];
      if (!q || !onSphere(q, px, py)) return;
      if (q.frozen === '0' || q.frozen === '1') return;
      var c = Math.cos(q.theta);
      if (q.frozen === 'H') q.frozen = Math.random() < 0.5 ? '0' : '1';
      else q.frozen = Math.abs(c) < 0.2 ? 'H' : c > 0 ? '0' : '1';
      q.theta = q.frozen === '0' ? 0 : q.frozen === '1' ? Math.PI : Math.PI / 2;
      q.phi = 0;
      q.hot = false;
      // al medir a mano, las flechas del conteo vuelven a salir del medidor
      if (q.frozen !== 'H') { shownL = 0; shownR = 0; }
      current = current.filter(function (c) { return c !== q; });
      start();
    }

    // medidor de circuito cuántico sobre la línea; un clic colapsa todo
    var meter = null, collapsed = false;
    // el medidor se arrastra con el mouse sobre la línea y al soltarlo vuelve
    // suave al centro
    // Si se suelta en el extremo derecho se queda ahí anclado como QFT
    var meterOff = 0, lineHalf = 105, drag = null, arrastrado = false, anclado = false;

    // cuántas esferas hay en cada resultado
    function cuenta() {
      var c = { n0: 0, n1: 0, h: 0 };
      for (var i = 0; i < qubits.length; i++) {
        var f = qubits[i].frozen;
        if (f === '0') c.n0++; else if (f === '1') c.n1++; else if (f === 'H') c.h++;
      }
      return c;
    }

    // medidor de circuito cuántico. Si hay esferas en H la medición está en
    // superposición: el medidor hace glitch entre rojo y azul y la aguja oscila
    function drawMeter(t, superpuesto) {
      var mw = 30, mh = 20, x = w / 2 + meterOff - mw / 2, y = lineY - mh / 2;
      meter = { x: x, y: y, w: mw, h: mh };
      var ang = -0.9;
      ctx.save();
      if (superpuesto) {
        ang = -Math.PI / 2 + Math.sin(t / 900) * 1.1;
        // glitch: cuadraditos alrededor que saltan entre rojo y azul, y el
        // contorno desdoblado en rojo y azul como una señal que no se decide
        var paso = Math.floor(t / 110);
        for (var i = 0; i < 14; i++) {
          var a1 = rnd(paso * 31 + i * 7), a2 = rnd(paso * 17 + i * 13), a3 = rnd(paso * 5 + i * 3);
          var lado = 2 + Math.floor(a3 * 4);
          var gx = x - 10 + a1 * (mw + 20), gy = y - 8 + a2 * (mh + 16);
          if (gx > x - 2 && gx < x + mw + 2 && gy > y - 2 && gy < y + mh + 2) continue;
          ctx.fillStyle = 'rgba(' + (rnd(paso * 11 + i) < 0.5 ? RED : BLUE) + ',' + (0.45 + 0.5 * a3) + ')';
          ctx.fillRect(Math.round(gx), Math.round(gy), lado, lado);
        }
        var dx = (rnd(paso * 3 + 1) - 0.5) * 4;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(' + RED + ',0.75)'; ctx.strokeRect(x - 1.5 + dx, y, mw, mh);
        ctx.strokeStyle = 'rgba(' + BLUE + ',0.75)'; ctx.strokeRect(x + 1.5 - dx, y, mw, mh);
      }
      ctx.fillStyle = 'rgb(' + PAPEL + ')'; ctx.strokeStyle = '#3B2F28'; ctx.lineWidth = 1.2;
      ctx.fillRect(x, y, mw, mh); ctx.strokeRect(x, y, mw, mh);
      var cx = w / 2 + meterOff, cy = y + mh - 4;
      if (anclado) {
        // en el extremo derecho el medidor se vuelve una compuerta QFT
        ctx.fillStyle = '#3B2F28'; ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('QFT', cx, lineY + 0.5);
      } else {
        ctx.beginPath(); ctx.arc(cx, cy, 9, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 11 * Math.cos(ang), cy + 11 * Math.sin(ang)); ctx.stroke();
      }
      ctx.restore();
    }

    // La línea cuenta los resultados medidos, a mano o con el medidor. La
    // mitad izquierda es solo de los |1⟩ (rojo) y la derecha solo de los |0⟩
    // (azul); cada lado mide su fracción del total medido y se reescala con
    // cada medición. Las flechas crecen y se recogen suave, y al recogerse se
    // van desvaneciendo cuanto más se acercan al medidor. Si hay esferas en H
    // la medición queda superpuesta: las flechas se recogen y solo queda el
    // glitch del medidor.
    var shownL = 0, shownR = 0;
    function drawTally(half, dt, t) {
      var c = cuenta(), n = c.n0 + c.n1;
      var sup = c.h > 0;
      var ease = still ? 1 : Math.min(1, dt / 650);
      var targetL, targetR;
      if (sup) {
        targetL = 0; targetR = 0;
        ease = still ? 1 : Math.min(1, dt / 120);
      } else {
        targetL = n ? c.n1 / n : 0; targetR = n ? c.n0 / n : 0;
      }
      shownL += (targetL - shownL) * ease;
      shownR += (targetR - shownR) * ease;
      if (shownL < 0.004 && shownR < 0.004) return sup;
      var y = lineY, mx = 15;
      function color(base) { return 'rgb(' + base + ')'; }
      ctx.save();
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      function lado(dir, k, col) {
        // se desvanece al acercarse al medidor
        ctx.globalAlpha = Math.min(1, k / 0.22);
        // cada flecha sale del medidor y llega como máximo al borde de la línea
        var largo = half - dir * meterOff - mx;
        var x0 = w / 2 + meterOff + dir * mx, x1 = x0 + dir * largo * k;
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1 - dir * 7, y - 11); ctx.lineTo(x1, y); ctx.lineTo(x1 - dir * 7, y + 11); ctx.stroke();
      }
      if (shownL > 0.004) lado(-1, shownL, color(RED));
      if (shownR > 0.004) lado(1, shownR, color(BLUE));
      ctx.restore();
      return sup;
    }
    function onMeter(px, py) {
      return meter && px >= meter.x - 6 && px <= meter.x + meter.w + 6 && py >= meter.y - 6 && py <= meter.y + meter.h + 6;
    }
    // colapso en onda desde el medidor: cada esfera sale |0⟩ con
    // probabilidad cos²(θ/2). Un segundo clic deshace todo, también en onda
    // desde el medidor, y cada esfera vuelve a su estado inicial
    function collapseAll() {
      var t0 = performance.now(), cx = w / 2 + meterOff, cy = lineY;
      qubits.forEach(function (q) {
        var d = Math.sqrt((q.x - cx) * (q.x - cx) + (q.y - cy) * (q.y - cy));
        if (collapsed) {
          if (q.frozen) q.resetAt = t0 + d * 0.9;
          q.collapseAt = 0;
        } else if (q.frozen !== '0' && q.frozen !== '1') {
          q.collapseAt = t0 + d * 0.9;
        }
      });
      current.forEach(function (q) { q.hot = false; }); current = [];
      collapsed = !collapsed;
      start();
    }
    function measure(q) {
      var p0 = Math.cos(q.theta / 2); p0 *= p0;
      q.frozen = q.forzado || (Math.random() < p0 ? '0' : '1'); q.forzado = '';
      q.theta = q.frozen === '0' ? 0 : Math.PI; q.phi = 0; q.hot = false; q.collapseAt = 0; q.part = 0;
    }
    // clic en la QFT: todas las esferas pasan a H en onda desde la compuerta.
    // Cada una divide su ecuador en 2, 4, 8, 16 o 32 posiciones al azar y la
    // flecha avanza entre esas posiciones
    // Segundo clic en la QFT: todo colapsa en onda y los resultados forman una
    // Q arriba a la izquierda y otra abajo a la derecha, con las letras en
    // |0⟩ y el fondo en |1⟩. Después la compuerta vuelve al centro como
    // medidor ya activado, y por eso queda fija
    var LETRAS = {
      Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#']
    };
    var qftActivo = false;
    function mensaje() {
      var izq = qubits.filter(function (q) { return q.x < w / 2; });
      var der = qubits.filter(function (q) { return q.x >= w / 2; });
      function caja(lista) {
        var b = [Infinity, -Infinity];
        lista.forEach(function (q) { b[0] = Math.min(b[0], q.x); b[1] = Math.max(b[1], q.x); });
        return b;
      }
      var bi = caja(izq), bd = caja(der);
      var px = Math.min(bi[1] - bi[0], bd[1] - bd[0]) * 0.6 / 5;
      // las letras van más altas que anchas para que se lean en la grilla
      var py = Math.min(px * 1.6, h * 0.42 / 7);
      function bloque(texto, b, cy) {
        var ancho = (texto.length * 6 - 1) * px;
        return { texto: texto, x0: (b[0] + b[1]) / 2 - ancho / 2, y0: cy - 3.5 * py };
      }
      var bloques = [bloque('Q', bi, h * 0.27), bloque('Q', bd, h * 0.73)];
      function enLetra(q) {
        var bl = q.x < w / 2 ? bloques[0] : bloques[1];
        var gx = Math.floor((q.x - bl.x0) / px), gy = Math.floor((q.y - bl.y0) / py);
        if (gx < 0 || gy < 0 || gy > 6) return false;
        var letra = bl.texto[Math.floor(gx / 6)], col = gx % 6;
        return !!letra && col < 5 && LETRAS[letra][gy][col] === '#';
      }
      var t0 = performance.now(), cx = w / 2 + meterOff, cy = lineY;
      qubits.forEach(function (q) {
        var d = Math.sqrt((q.x - cx) * (q.x - cx) + (q.y - cy) * (q.y - cy));
        q.hAt = 0; q.resetAt = 0;
        q.forzado = enLetra(q) ? '0' : '1';
        q.collapseAt = t0 + d * 0.9;
      });
      current.forEach(function (q) { q.hot = false; }); current = [];
      qftActivo = false; anclado = false; collapsed = true;
      start();
    }
    function qftAll() {
      if (qftActivo) return mensaje();
      qftActivo = true;
      var t0 = performance.now(), cx = w / 2 + meterOff, cy = lineY;
      qubits.forEach(function (q) {
        var d = Math.sqrt((q.x - cx) * (q.x - cx) + (q.y - cy) * (q.y - cy));
        q.collapseAt = 0; q.resetAt = 0;
        q.hAt = t0 + d * 0.9;
      });
      current.forEach(function (q) { q.hot = false; }); current = [];
      collapsed = false;
      start();
    }
    function hadamard(q) {
      q.frozen = 'H'; q.masivo = false; q.hot = false; q.hAt = 0;
      q.theta = Math.PI / 2;
      q.part = PARTICIONES[Math.floor(Math.random() * PARTICIONES.length)];
      q.k = Math.floor(Math.random() * q.part);
      q.phi = q.phiTo = q.k * TAU / q.part;
      q.hopAt = performance.now() + TIC;
    }
    // avanza una partición en sentido antihorario a ritmo fijo, como el
    // segundero de un reloj. Cada esfera se queda con la cantidad de
    // particiones que le tocó al azar
    var PARTICIONES = [2, 4, 8, 16, 32], TIC = 600;
    function fluctua(q, now) {
      q.k = (q.k + q.part - 1) % q.part;
      q.phiTo -= TAU / q.part;
      q.hopAt += TIC;
      if (q.hopAt < now) q.hopAt = now + TIC;
    }
    function restore(q) {
      q.frozen = false; q.masivo = false; q.resetAt = 0; q.part = 0;
      q.theta = q.theta0; q.phi = q.phi0;
    }

    var olaO = null, REPOSO = GOLD + '|0.60|0.85', C5 = Math.cos(0.5), S5 = Math.sin(0.5);
    function draw(dt) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      var span = lineY !== null && spanAt(lineY), half = 0;
      if (span) {
        half = Math.min(105, (span[1] - span[0]) / 2 - 16);
        lineHalf = half;
        if (!drag) meterOff += ((anclado ? half - 15 : 0) - meterOff) * (still ? 1 : Math.min(1, dt / 220));
        meterOff = Math.max(-(half - 15), Math.min(half - 15, meterOff));
      }
      var now = performance.now();
      var oX = w / 2 + meterOff, oY = lineY !== null ? lineY : h / 2, oD = 0;
      if (ola) {
        olaP += (olaMeta - olaP) * Math.min(1, dt / 520);   // sigue al scroll con inercia
        if (Math.abs(olaMeta - olaP) < 0.0005) olaP = olaMeta;
        // el frente sale de todo el borde interior de cada costado, de arriba a
        // abajo, y avanza hacia afuera: cada esfera se mide según su distancia
        // horizontal al borde de la zona libre en su misma fila. Va desde la
        // esfera más cercana al borde hasta la más lejana (se calcula una vez)
        if (!olaO) {
          var dMin = Infinity, dMax = 0, filas = {};
          for (var j = 0; j < qubits.length; j++) {
            var qj = qubits[j], sp2 = filas[qj.y];
            if (sp2 === undefined) sp2 = filas[qj.y] = spanAt(qj.y);
            var dj = sp2 ? (qj.x < w / 2 ? sp2[0] - qj.x : qj.x - sp2[1]) : Math.abs(qj.x - w / 2);
            dj = Math.max(0, dj); qj.dO = dj;
            if (dj < dMin) dMin = dj; if (dj > dMax) dMax = dj;
          }
          olaO = { min: dMin, max: dMax };
        }
        oD = olaP > 0 ? olaO.min + olaP * (olaO.max - olaO.min + BANDA) : 0;
      }
      var grupos = {}, orden = [], rotulos = [];
      for (var i = 0; i < qubits.length; i++) {
        var q = qubits[i];
        if (q.collapseAt && now >= q.collapseAt) { measure(q); q.masivo = true; }
        if (q.resetAt && now >= q.resetAt) restore(q);
        if (q.hAt && now >= q.hAt) hadamard(q);
        if (q.hot) q.theta = (q.theta + SPIN * dt / 1000) % TAU;
        else if (q.frozen === 'H' && q.part) {
          if (now >= q.hopAt) fluctua(q, now);
          q.phi += (q.phiTo - q.phi) * (still ? 1 : Math.min(1, dt / 110));
        }
        else if (q.frozen === 'H') q.phi = (q.phi - SPIN * dt / 1000) % TAU;
        else if (!q.frozen) q.phi += q.drift * dt;

        var on = q.hot || q.frozen;
        var col = q.frozen === 'H' ? MUSTARD : q.frozen === '1' ? RED : q.frozen === '0' ? BLUE : GOLD;
        var alfa = on ? 1 : 0.6, th = q.theta, ph = q.phi, e = 0;
        if (ola && oD > 0 && !on) {
          // frente de la ola: 0 antes de llegar, 1 ya medida; suavizado en la banda
          var dq = q.dO;
          e = Math.max(0, Math.min(1, (oD - dq) / BANDA)); e = e * e * (3 - 2 * e);
          if (e > 0) {
            if (!q.res) { var p0 = Math.cos(q.theta0 / 2); q.res = rnd(q.x * 7.1 + q.y * 3.3) < p0 * p0 ? '0' : '1'; }
            var meta = q.res === '0' ? 0 : Math.PI;
            th = q.theta + (meta - q.theta) * e; ph = q.phi * (1 - e);
          }
        }
        // se agrupa por estilo: todas las esferas iguales se trazan en un solo camino (mucho más liviano)
        if (e > 0) { var eq = Math.round(e * 10) / 10; col = mezcla(GOLD, q.res === '0' ? BLUE : RED, eq); alfa = 0.6 + 0.4 * eq; }
        var lw = on ? 1 : (e > 0 ? 1 : 0.85), clave = (on || e > 0) ? col + '|' + alfa.toFixed(2) + '|' + lw : REPOSO, gr = grupos[clave];
        if (!gr) { gr = grupos[clave] = { k: clave, c: 'rgba(' + col + ',' + alfa.toFixed(2) + ')', lw: lw, l: [] }; orden.push(gr); }
        var st = Math.sin(th);
        gr.l.push(q, q.x + st * Math.cos(ph) * R, q.y + (-Math.cos(th) * 0.95 + st * Math.sin(ph) * 0.3) * R);
        if (q.frozen) rotulos.push(q, 0);
        else if (e > 0.75) rotulos.push(q, (e - 0.75) / 0.25);
      }
      for (var g = 0; g < orden.length; g++) {
        var G = orden[g], L = G.l, k, q2, ex, ey, an, ux, uy, dx, dy, dd;
        // las esferas que no están en reposo tapan su cuerpo de la capa base
        // con el sello de su color
        if (G.k !== REPOSO) {
          var sp = sello(G.k, G.c, G.lw);
          for (k = 0; k < L.length; k += 3) {
            q2 = L[k];
            ctx.clearRect(q2.x - S, q2.y - S, 2 * S, 2 * S);
            ctx.drawImage(sp, q2.x - S, q2.y - S, 2 * S, 2 * S);
          }
        }
        ctx.strokeStyle = ctx.fillStyle = G.c; ctx.lineWidth = G.lw;
        // flechas
        ctx.beginPath();
        for (k = 0; k < L.length; k += 3) { q2 = L[k]; ctx.moveTo(q2.x, q2.y); ctx.lineTo(L[k + 1], L[k + 2]); }
        ctx.stroke();
        // puntas de flecha: triángulos sin closePath (fill cierra cada uno
        // solo) y sin trigonometría, girando el vector de la flecha 0,5 rad
        ctx.beginPath();
        for (k = 0; k < L.length; k += 3) {
          q2 = L[k]; ex = L[k + 1]; ey = L[k + 2];
          dx = ex - q2.x; dy = ey - q2.y; dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < 0.01) continue;
          ux = dx / dd * 2.6; uy = dy / dd * 2.6;
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - (ux * C5 + uy * S5), ey - (uy * C5 - ux * S5));
          ctx.lineTo(ex - (ux * C5 - uy * S5), ey - (uy * C5 + ux * S5));
        }
        ctx.fill();
      }
      if (span) {
        ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w / 2 - half, lineY); ctx.lineTo(w / 2 + half, lineY); ctx.stroke();
        var sup = drawTally(half, dt, now);
        drawMeter(now, sup);
      }
      for (var r2 = 0; r2 < rotulos.length; r2 += 2) { if (rotulos[r2].frozen) label(rotulos[r2]); else ketOla(rotulos[r2], rotulos[r2 + 1]); }
    }

    // ket |0⟩ o |1⟩ en gris, o la compuerta H, encima de la esfera medida
    function label(q) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (q.frozen === 'H') {
        ctx.fillStyle = 'rgb(' + PAPEL + ')'; ctx.strokeStyle = 'rgb(' + MUSTARD + ')'; ctx.lineWidth = 1;
        ctx.fillRect(q.x + 2, q.y - 12, 10, 10); ctx.strokeRect(q.x + 2, q.y - 12, 10, 10);
        ctx.fillStyle = 'rgb(' + MUSTARD + ')';
        ctx.font = '700 8px "Space Mono", monospace';
        ctx.fillText('H', q.x + 7, q.y - 6.6);
      } else {
        var text = '|' + q.frozen + '⟩';
        // en el colapso masivo el ket va más pequeño para no amontonarse
        var fs = q.masivo ? 10 : 13, off = q.masivo ? 9 : 11;
        ctx.font = 'italic 600 ' + fs + 'px "Cormorant Garamond", serif';
        ctx.lineWidth = q.masivo ? 2.5 : 3.5; ctx.strokeStyle = 'rgba(' + PAPEL + ',0.92)';
        ctx.strokeText(text, q.x + off, q.y - off);
        ctx.fillStyle = '#6B6B6B';
        ctx.fillText(text, q.x + off, q.y - off);
      }
      ctx.restore();
    }

    function mezcla(a, b, k) {
      var x = a.split(','), y = b.split(',');
      return x.map(function (v, i) { return Math.round(+v + (+y[i] - v) * k); }).join(',');
    }
    // ket pequeño que aparece cuando la ola ya midió la esfera
    function ketOla(q, k) {
      ctx.save(); ctx.globalAlpha = k;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'italic 600 10px "Cormorant Garamond", serif';
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(' + PAPEL + ',0.92)';
      var text = '|' + q.res + '⟩';
      ctx.strokeText(text, q.x + 9, q.y - 9); ctx.fillStyle = '#6B6B6B'; ctx.fillText(text, q.x + 9, q.y - 9);
      ctx.restore();
    }

    function loop(t) {
      var dt = last ? Math.min(t - last, 50) : 16;
      var pendientes = (ola && Math.abs(olaMeta - olaP) > 0) || drag || (!anclado && Math.abs(meterOff) > 0.3) || qubits.some(function (q) { return q.collapseAt || q.resetAt || q.hAt; });
      // en reposo solo deriva despacio: basta con ~24 cuadros por segundo
      if (!pendientes && !current.length && last && t - last < 40) { raf = visible ? requestAnimationFrame(loop) : 0; return; }
      last = t;
      draw(dt);
      if (visible && (!still || current.length || pendientes)) raf = requestAnimationFrame(loop);
      else { raf = 0; last = 0; }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(loop);
    }

    // la posición de la sección se lee una vez por cuadro como mucho, no en
    // cada movimiento del mouse (leerla fuerza al navegador a recalcular)
    var rectSec = null;
    function invalidar() { rectSec = null; }
    window.addEventListener('scroll', invalidar, { passive: true });
    function point(e) {
      var r = rectSec || (rectSec = section.getBoundingClientRect());
      return [e.clientX - r.left, e.clientY - r.top];
    }
    var cursor = '';
    function ponerCursor(c) { if (c !== cursor) { cursor = c; section.style.cursor = c; } }

    layout(); draw(16);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); draw(16); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; last = 0; }
      }).observe(section);
    } else { visible = true; start(); }

    if (ola) {
      olaMeta = olaP = olaObjetivo();
      window.addEventListener('scroll', function () { olaMeta = olaObjetivo(); start(); }, { passive: true });
    }
    section.addEventListener('mouseleave', release);
    section.addEventListener('mousemove', function (e) {
      if (drag) return;
      var p = point(e);
      ponerCursor(onMeter(p[0], p[1]) ? (collapsed ? 'pointer' : 'grab') : '');
      activate(p[0], p[1]);
    });
    section.addEventListener('mousedown', function (e) {
      var p = point(e);
      arrastrado = false;
      // con la medición activada el medidor queda fijo
      if (!onMeter(p[0], p[1]) || collapsed) return;
      e.preventDefault();
      drag = { x: p[0], off: meterOff };
      arrastrado = false;
      ponerCursor('grabbing');
      start();
    });
    window.addEventListener('mousemove', function (e) {
      if (!drag) return;
      var dx = point(e)[0] - drag.x;
      if (Math.abs(dx) > 3) arrastrado = true;
      meterOff = Math.max(-(lineHalf - 15), Math.min(lineHalf - 15, drag.off + dx));
      start();
    });
    window.addEventListener('mouseup', function () {
      if (!drag) return;
      drag = null;
      anclado = meterOff >= lineHalf - 15 - 12;
      ponerCursor('');
      start();
    });
    section.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a, button, .nota')) return;
      // soltar después de arrastrar no cuenta como clic en el medidor
      if (arrastrado) { arrastrado = false; return; }
      var p = point(e);
      if (onMeter(p[0], p[1])) return anclado ? qftAll() : collapseAll();
      freeze(p[0], p[1]);
    });

    // al cambiar el tamaño se reacomoda en el siguiente cuadro, sin esperar,
    // para que el dibujo nunca se vea estirado
    var pending = 0, lastW = section.clientWidth, lastH = section.clientHeight;
    window.addEventListener('resize', function () {
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = 0;
        if (section.clientWidth === lastW && section.clientHeight === lastH) return;
        lastW = section.clientWidth; lastH = section.clientHeight;
        rectSec = null; layout(); draw(16);
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.qubits-fondo'), init);
})();
