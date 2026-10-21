// Teselado de qubits: esferas de Bloch doradas detrás de una sección.
// En reposo se ven al 35%; al pasar el mouse la esfera y sus 3 vecinas se
// ven enteras y su flecha gira de polo a polo, cada una desfasada un tercio
// de vuelta. Un clic mide el qubit: colapsa al polo más cercano, |0⟩ o |1⟩
// (azul, con el ket encima); solo si la flecha está justo en el ecuador
// queda en mostaza con una H, y un segundo clic la mide al azar en 0 o 1.
// Cada <canvas class="qubits-fondo"> cubre a su elemento padre, o solo
// hasta el elemento que indique data-hasta.
(function () {
  var R = 8, DX = 26, DY = DX * Math.sqrt(3) / 2;
  var SPIN = 3.2, TAU = Math.PI * 2;
  var GOLD = '200,169,110', BLUE = '37,99,235', MUSTARD = '206,154,18';
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
    var qubits = [], current = [], w = 0, h = 0, visible = false, raf = 0, last = 0;

    function layout() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = section.clientWidth; h = section.clientHeight;
      var stop = limit && section.querySelector(limit);
      if (stop) h = Math.round(stop.getBoundingClientRect().top - section.getBoundingClientRect().top);
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      qubits = []; current = [];
      var row = 0, k = 0;
      for (var y = DY / 2; y < h + DY; y += DY, row++) {
        for (var x = (row % 2 ? DX : DX / 2); x < w + DX; x += DX, k++) {
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
      group.forEach(function (q, i) {
        q.phi = 0;
        q.theta = center.theta + i * TAU / 3;
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
      else q.frozen = Math.abs(c) < 0.12 ? 'H' : c > 0 ? '0' : '1';
      q.theta = q.frozen === '0' ? 0 : q.frozen === '1' ? Math.PI : Math.PI / 2;
      q.phi = 0;
      q.hot = false;
      current = current.filter(function (c) { return c !== q; });
      start();
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < qubits.length; i++) {
        var q = qubits[i];
        if (q.hot) q.theta = (q.theta + SPIN * dt / 1000) % TAU;
        else if (!q.frozen) q.phi += q.drift * dt;

        var on = q.hot || q.frozen;
        var col = q.frozen === 'H' ? MUSTARD : q.frozen ? BLUE : GOLD;
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
        ctx.font = 'italic 600 11px "Cormorant Garamond", serif';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.strokeText(text, q.x + 10, q.y - 9);
        ctx.fillStyle = '#6B6B6B';
        ctx.fillText(text, q.x + 10, q.y - 9);
      }
      ctx.restore();
    }

    function loop(t) {
      var dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      draw(dt);
      if (visible && (!still || current.length)) raf = requestAnimationFrame(loop);
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
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; last = 0; }
      }).observe(section);
    } else { visible = true; start(); }

    section.addEventListener('mouseleave', release);
    section.addEventListener('mousemove', function (e) {
      var p = point(e); activate(p[0], p[1]);
    });
    section.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a, button, .nota')) return;
      var p = point(e); freeze(p[0], p[1]);
    });

    var timer, lastW = section.clientWidth, lastH = section.clientHeight;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (section.clientWidth === lastW && section.clientHeight === lastH) return;
        lastW = section.clientWidth; lastH = section.clientHeight;
        layout(); draw(16);
      }, 150);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.qubits-fondo'), init);
})();
