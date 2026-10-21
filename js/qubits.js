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
      qubits = []; current = [];
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
            drift: (rnd(k + 13) - 0.5) * 0.0012,
            hot: false, frozen: false
          });
        }
      }
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
      current = current.filter(function (c) { return c !== q; });
      start();
    }

    // medidor de circuito cuántico sobre la línea; un clic colapsa todo
    var meter = null, collapsed = false;
    function drawMeter() {
      var mw = 30, mh = 20, x = w / 2 - mw / 2, y = lineY - mh / 2;
      meter = { x: x, y: y, w: mw, h: mh };
      ctx.save();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3B2F28'; ctx.lineWidth = 1.2;
      ctx.fillRect(x, y, mw, mh); ctx.strokeRect(x, y, mw, mh);
      ctx.beginPath(); ctx.arc(w / 2, y + mh - 4, 9, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2, y + mh - 4); ctx.lineTo(w / 2 + 7, y + 4); ctx.stroke();
      ctx.restore();
    }
    // la línea cuenta los resultados medidos, a mano o con el medidor: se
    // reparte entre rojo (|1⟩, desde la izquierda) y azul (|0⟩, desde la
    // derecha) según cuántos hay de cada uno entre los ya medidos; si solo hay
    // de un tipo, toda la línea queda de ese color. Cada color cierra con su
    // paréntesis en su extremo.
    function drawTally(half) {
      var n0 = 0, n1 = 0;
      for (var i = 0; i < qubits.length; i++) {
        if (qubits[i].frozen === '0') n0++; else if (qubits[i].frozen === '1') n1++;
      }
      var n = n0 + n1;
      if (!n) return;
      var y = lineY, xl = w / 2 - half, xr = w / 2 + half;
      var corte = xl + (xr - xl) * n1 / n;
      ctx.save();
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      function tramo(x0, x1, col) {
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      }
      function parentesis(x, dir, col) {
        ctx.strokeStyle = col;
        ctx.beginPath(); ctx.moveTo(x - dir * 2, y - 14); ctx.quadraticCurveTo(x + dir * 9, y, x - dir * 2, y + 14); ctx.stroke();
      }
      if (n1) { tramo(xl, corte, 'rgb(' + RED + ')'); parentesis(xl, -1, 'rgb(' + RED + ')'); }
      if (n0) { tramo(corte, xr, 'rgb(' + BLUE + ')'); parentesis(xr, 1, 'rgb(' + BLUE + ')'); }
      ctx.restore();
    }
    function onMeter(px, py) {
      return meter && px >= meter.x - 6 && px <= meter.x + meter.w + 6 && py >= meter.y - 6 && py <= meter.y + meter.h + 6;
    }
    // colapso en onda desde el medidor: cada esfera sale |0⟩ con
    // probabilidad cos²(θ/2); un segundo clic deja todo como al inicio
    function collapseAll() {
      var t0 = performance.now(), cx = w / 2, cy = lineY;
      if (collapsed) {
        layout(); draw(16); collapsed = false; start(); return;
      }
      qubits.forEach(function (q) {
        if (q.frozen === '0' || q.frozen === '1') return;  // las ya medidas a mano se quedan
        var d = Math.sqrt((q.x - cx) * (q.x - cx) + (q.y - cy) * (q.y - cy));
        q.collapseAt = t0 + d * 0.9;
      });
      current.forEach(function (q) { q.hot = false; }); current = [];
      collapsed = true;
      start();
    }
    function measure(q) {
      var p0 = Math.cos(q.theta / 2); p0 *= p0;
      q.frozen = Math.random() < p0 ? '0' : '1';
      q.theta = q.frozen === '0' ? 0 : Math.PI; q.phi = 0; q.hot = false; q.collapseAt = 0;
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      var span = lineY !== null && spanAt(lineY);
      if (span) {
        ctx.strokeStyle = LINE; ctx.lineWidth = 1;
        var half = Math.min(105, (span[1] - span[0]) / 2 - 16);
        ctx.beginPath(); ctx.moveTo(w / 2 - half, lineY); ctx.lineTo(w / 2 + half, lineY); ctx.stroke();
        drawTally(half);
        drawMeter();
      }
      var now = performance.now();
      for (var i = 0; i < qubits.length; i++) {
        var q = qubits[i];
        if (q.collapseAt && now >= q.collapseAt) { measure(q); q.masivo = true; }
        if (q.hot) q.theta = (q.theta + SPIN * dt / 1000) % TAU;
        else if (q.frozen === 'H') q.phi = (q.phi + SPIN * dt / 1000) % TAU;
        else if (!q.frozen) q.phi += q.drift * dt;

        var on = q.hot || q.frozen;
        var col = q.frozen === 'H' ? MUSTARD : q.frozen === '1' ? RED : q.frozen === '0' ? BLUE : GOLD;
        ctx.strokeStyle = ctx.fillStyle = 'rgba(' + col + ',' + (on ? 1 : 0.35) + ')';
        ctx.lineWidth = on ? 1 : 0.7;

        // contorno
        ctx.beginPath(); ctx.arc(q.x, q.y, R, 0, TAU); ctx.stroke();
        // ecuador: mitad delantera continua, mitad trasera punteada
        ctx.beginPath(); ctx.ellipse(q.x, q.y, R, R * 0.3, 0, 0, Math.PI); ctx.stroke();
        ctx.setLineDash([1.4, 1.6]);
        ctx.beginPath(); ctx.ellipse(q.x, q.y, R, R * 0.3, 0, Math.PI, TAU); ctx.stroke();
        ctx.setLineDash([]);

        // flecha de estado
        var st = Math.sin(q.theta);
        var ex = q.x + st * Math.cos(q.phi) * R;
        var ey = q.y + (-Math.cos(q.theta) * 0.95 + st * Math.sin(q.phi) * 0.3) * R;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(ex, ey); ctx.stroke();
        var a = Math.atan2(ey - q.y, ex - q.x);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 2.6 * Math.cos(a - 0.5), ey - 2.6 * Math.sin(a - 0.5));
        ctx.lineTo(ex - 2.6 * Math.cos(a + 0.5), ey - 2.6 * Math.sin(a + 0.5));
        ctx.closePath(); ctx.fill();
        if (q.frozen) label(q);
      }
    }

    // ket |0⟩ o |1⟩ en gris, o la compuerta H, encima de la esfera medida
    function label(q) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (q.frozen === 'H') {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgb(' + MUSTARD + ')'; ctx.lineWidth = 1;
        ctx.fillRect(q.x + 2, q.y - 12, 10, 10); ctx.strokeRect(q.x + 2, q.y - 12, 10, 10);
        ctx.fillStyle = 'rgb(' + MUSTARD + ')';
        ctx.font = '700 8px "Space Mono", monospace';
        ctx.fillText('H', q.x + 7, q.y - 6.6);
      } else {
        var text = '|' + q.frozen + '⟩';
        // en el colapso masivo el ket va más pequeño para no amontonarse
        var fs = q.masivo ? 10 : 13, off = q.masivo ? 9 : 11;
        ctx.font = 'italic 600 ' + fs + 'px "Cormorant Garamond", serif';
        ctx.lineWidth = q.masivo ? 2.5 : 3.5; ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.strokeText(text, q.x + off, q.y - off);
        ctx.fillStyle = '#6B6B6B';
        ctx.fillText(text, q.x + off, q.y - off);
      }
      ctx.restore();
    }

    function loop(t) {
      var dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      draw(dt);
      var pendientes = collapsed && qubits.some(function (q) { return q.collapseAt; });
      if (visible && (!still || current.length || pendientes)) raf = requestAnimationFrame(loop);
      else { raf = 0; last = 0; }
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function point(e) {
      var r = section.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }

    layout(); draw(16);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); draw(16); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; last = 0; }
      }).observe(section);
    } else { visible = true; start(); }

    section.addEventListener('mouseleave', release);
    section.addEventListener('mousemove', function (e) {
      var p = point(e);
      section.style.cursor = onMeter(p[0], p[1]) ? 'pointer' : '';
      activate(p[0], p[1]);
    });
    section.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a, button, .nota')) return;
      var p = point(e);
      if (onMeter(p[0], p[1])) return collapseAll();
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
        layout(); draw(16);
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.qubits-fondo'), init);
})();
