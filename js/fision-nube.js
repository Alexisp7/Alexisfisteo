// Problemas de física, parte IV · la nube y la bola de fuego pintadas como aguada continua (WebGL).
// Mismo lenguaje que el agujero negro de Relatividad: campos de ruido fBm, pigmento que se acumula en el filo,
// grano de papel. Aquí no hay partículas: cada píxel evalúa una densidad continua.
//   · bola de fuego: esfera turbulenta apoyada en el suelo (cúpula), con venas de ruido de crestas.
//   · casquete: toro de vórtice visto de lado; el ruido gira alrededor de cada lóbulo (sube por dentro, baja por fuera).
//   · tallo: columna que se estrecha arriba y se abre al llegar al casquete; su material sube.
//   · oleada de base: polvo bajo y ancho que corre por el suelo.
// Coordenadas del mundo: x a la derecha y h hacia arriba, en unidades del SVG, con origen en el punto cero del suelo.
(function () {
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes; uniform vec4 uVB; uniform vec2 uO; uniform float uZ, uT;',
    'uniform vec4 uCap, uStem, uBase, uFire, uMisc;',
    'float hash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float ruido(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
    '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }',
    'float fbm3(vec3 p) { float a = .5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * ruido(p); p = p * 2.03 + 7.1; a *= .5; } return s / .875; }',
    'float fbm(vec3 p) { float a = .5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * ruido(p); p = p * 2.03 + 7.1; a *= .5; } return s / .97; }',
    // ruido «coliflor»: valor absoluto en cada octava; los pliegues quedan entre los cúmulos
    'float coli(vec3 p) { float a = .5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * abs(2.0 * ruido(p) - 1.0); p = p * 2.03 + 7.1; a *= .5; } return 1.0 - s / .97; }',
    'vec2 gira(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }',
    // cúmulos: fBm con el dominio torcido por otro fBm (bordes redondeados, no rayas); y luz desde arriba a la izquierda
    'vec3 campo(vec2 P, float z) {',
    '  vec2 w = vec2(fbm3(vec3(P * .45, z)), fbm3(vec3(P * .45 + 5.2, z + 1.7)));',
    '  vec2 Q = P + 1.5 * w;',
    '  float n = fbm(vec3(Q, z + 3.1)), nL = fbm(vec3(Q + vec2(-.16, .24), z + 3.1));',
    '  float n2 = fbm3(vec3(Q * 2.7, z + 6.3));',   // detalle fino: cúmulos pequeños sobre los grandes
    '  return vec3(n, clamp(.5 + (n - nL) * 3.2 + (n2 - .5) * .35, 0.0, 1.0), n2); }',
    'vec4 sobre(vec4 fr, vec4 at) { float a = fr.a + at.a * (1.0 - fr.a); return vec4((fr.rgb * fr.a + at.rgb * at.a * (1.0 - fr.a)) / max(a, 1e-4), a); }',
    // humo en aguada: densidad, luz desde arriba, pigmento en el filo, calor por dentro
    'vec4 humo(float e, float c, float lit, float calor, float grano, float alfa, float n) {',
    '  float W = 1.0 - smoothstep(.9, 1.0, e);',
    '  float filo = smoothstep(.72, .98, e) * W;',
    '  vec3 hondo = vec3(.1, .09, .13), medio = vec3(.3, .22, .2), claro = vec3(.6, .49, .42);',
    '  vec3 col = mix(mix(hondo, medio, smoothstep(.0, .55, lit)), claro, smoothstep(.55, 1.0, lit));',
    '  vec3 fuego = mix(vec3(.66, .2, .07), mix(vec3(1.0, .58, .18), vec3(1.0, .86, .52), smoothstep(.6, 1.0, calor)), smoothstep(.15, .6, calor));',
    '  col = mix(col, fuego, smoothstep(.08, .7, calor) * (.55 + .45 * c));',
    // marcas de agua: líneas finas donde el pigmento se secó (curvas de nivel del ruido), como en una aguada
    '  float marca = (1.0 - smoothstep(.0, .02, abs(n - .58))) * .15 + (1.0 - smoothstep(.0, .014, abs(n - .4))) * .08;',
    '  col *= (1.0 - .42 * filo) * (1.0 - marca * W) * (.93 + .1 * grano);',
    '  float a = alfa * W * (.9 + .1 * c) * (.9 + .1 * grano) + .1 * filo * alfa;',
    '  return vec4(col, clamp(a, 0.0, 1.0)); }',
    'void main() {',
    '  vec2 q = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);',
    '  vec2 sv = uVB.xy + q * uVB.zw;',
    '  vec2 p = vec2(sv.x - uO.x, uO.y - sv.y) / uZ;',
    '  float grano = ruido(vec3(sv * .85, 3.0)) * .6 + ruido(vec3(sv * 2.3, 9.0)) * .4;',
    '  float suelo = smoothstep(-3.0, 1.5, p.y);',
    '  vec4 col = vec4(0.0);',
    // ── bola de fuego
    '  float Rf = uFire.x, af = uFire.z;',
    '  if (af > .004) {',
    '    vec2 fp = (p - vec2(0.0, uFire.y)) / Rf; float r = length(fp);',
    '    float tb = fbm(vec3(fp * 3.0, uT * .55)), ve = 1.0 - abs(2.0 * fbm(vec3(fp * 6.5 + 4.0, uT * .8)) - 1.0);',
    '    float eF = r + (tb - .5) * .15;',
    '    float z = sqrt(max(0.0, 1.0 - r * r));',
    '    float calor = clamp(.22 + .58 * z + (tb - .5) * 1.5 - pow(1.0 - ve, 5.0) * .5, 0.0, 1.0);',
    '    float et = uFire.w;',   // 0 blanca · 1 amarilla intensa · 2 naranja con costra
    '    vec3 c0 = mix(vec3(1.0, .9, .62), vec3(1.0, 1.0, .96), calor);',
    '    vec3 c1 = calor < .5 ? mix(vec3(.84, .4, .1), vec3(1.0, .78, .23), calor / .5) : mix(vec3(1.0, .78, .23), vec3(1.0, .95, .66), (calor - .5) / .5);',
    '    vec3 c2 = calor < .5 ? mix(vec3(.26, .11, .07), vec3(.82, .37, .13), calor / .5) : mix(vec3(.82, .37, .13), vec3(1.0, .73, .36), (calor - .5) / .5);',
    '    vec3 cf = et < 1.0 ? mix(c0, c1, et) : mix(c1, c2, et - 1.0);',
    '    float dF = (1.0 - smoothstep(.95, 1.0, eF)) * suelo;',
    '    float halo = exp(-max(eF - 1.0, 0.0) * 5.5) * (1.0 - dF) * .5 * suelo;',
    '    vec4 bola = vec4(cf * (.97 + .06 * grano), dF * af);',
    '    vec4 hal = vec4(mix(vec3(1.0, .74, .3), vec3(1.0, .9, .6), 1.0 - min(et, 1.0)), halo * af * (1.0 - .45 * max(et - 1.0, 0.0)));',
    '    col = sobre(bola, hal);',
    '  }',
    // ── tallo
    '  float Hc = uCap.z, Rt = uCap.x, rt = uCap.y;',
    '  if (uStem.z > .004 && p.y > -4.0 && p.y < uStem.y) {',
    '    float hn = clamp(p.y / max(Hc, 1.0), 0.0, 1.0);',
    '    float wS = uStem.x * (1.0 + 1.3 * (1.0 - smoothstep(0.0, .35, hn)) + 2.2 * smoothstep(.55, 1.0, hn)) * (.85 + .3 * fbm3(vec3(p.y / 40.0, uT * .2, 5.0)));',
    '    vec2 ps = vec2(p.x, p.y - uT * 16.0) / (uStem.x * .55 + 7.0);',
    '    vec3 cm = campo(ps * .7, 7.0); float b = cm.x;',
    '    float e = abs(p.x) / wS + (.5 - b) * 1.0 + (.5 - cm.z) * .35;',
    '    e = max(e, smoothstep(uStem.y - 20.0, uStem.y, p.y) * 1.2);',
    '    float lit = clamp(.3 + .35 * cm.y - p.x / wS * .25, 0.0, 1.0);',
    '    float calor = uMisc.x * (1.0 - hn) * .6 * (.6 + .4 * b);',
    '    col = sobre(humo(e, b, lit, calor, grano, uStem.z * .92 * suelo, b), col);',
    '  }',
    // ── casquete: toro de vórtice
    '  if (uCap.w > .004) {',
    '    float lado = p.x >= 0.0 ? 1.0 : -1.0;',
    '    vec2 L = vec2(lado * Rt, Hc);',
    '    float wr = smoothstep(Rt * .1, Rt * .75, abs(p.x));',
    // el vórtice: el dibujo gira alrededor de cada lóbulo (sube por dentro, baja por fuera). Dos fases desfasadas que se
    // relevan cada 5 s evitan que el giro acumulado retuerza el ruido en rayas
    '    float ph = uT / 5.0, f1 = fract(ph), f2 = fract(ph + .5), k1 = 1.0 - abs(2.0 * f1 - 1.0);',
    '    float sc = rt * .5 + 9.0;',
    '    vec3 cA = campo((L + gira(p - L, -lado * .7 * f1 * wr)) / sc, 1.3 + floor(ph) * 3.7);',
    '    vec3 cB = campo((L + gira(p - L, -lado * .7 * f2 * wr)) / sc, 1.3 + floor(ph + .5) * 3.7 + 1.9);',
    '    vec3 cm = mix(cB, cA, k1); float b = cm.x;',
    // forma del casquete: dos lóbulos enrollados a los lados (el toro visto de canto) unidos por una cúpula ancha
    '    vec2 cd = vec2(p.x / (Rt + rt * 1.05), (p.y - Hc - rt * .1) / (p.y > Hc + rt * .1 ? rt * 1.32 : rt * .92));',
    '    float eL = min(length(p - vec2(Rt, Hc)), length(p - vec2(-Rt, Hc))) / (rt * 1.12);',
    '    float eD = length(vec2(p.x / (Rt * 1.08 + rt * .3), (p.y - Hc - rt * .22) / (rt * 1.22)));',
    '    float eU = min(eL, eD) - .08 * exp(-pow((eL - eD) * 4.0, 2.0));',   // unión suave
    '    float e = eU + (.5 - b) * .7 + (.5 - cm.z) * .24;',
    // cada lóbulo es una esfera iluminada desde arriba a la izquierda; al centro las dos se funden sin costura
    '    vec2 lD = (p - vec2(Rt, Hc)) / rt, lI = (p - vec2(-Rt, Hc)) / rt, ld = normalize(vec2(-.45, .9));',
    '    float fD = .5 + .45 * dot(lD / max(1.0, length(lD)), ld), fI = .5 + .45 * dot(lI / max(1.0, length(lI)), ld);',
    '    float forma = clamp(mix(fI, fD, smoothstep(-Rt * .5, Rt * .5, p.x)), 0.0, 1.0);',
    '    float lit = clamp(.02 + .72 * forma + .3 * cm.y + .12 * cd.y, 0.0, 1.0);',
    '    float dentro = 1.0 - smoothstep(.0, .95, length(cd));',
    '    float calor = clamp(uMisc.x * (.35 + .75 * dentro) + uMisc.y * (1.0 - smoothstep(-.7, .15, cd.y)) * (1.0 - smoothstep(.55, 1.05, abs(cd.x))), 0.0, 1.0) * (.55 + .45 * b);',
    '    col = sobre(humo(e, b, lit, calor, grano, uCap.w * .95, b), col);',
    '  }',
    // ── oleada de base: polvo que corre por el suelo, delante de todo
    '  if (uBase.z > .004 && p.y > -uBase.y * .3) {',
    '    float lado = p.x >= 0.0 ? 1.0 : -1.0;',
    '    vec2 pb = vec2(p.x / (1.0 + .03 * uT), p.y * 1.3) / (uBase.y * .6 + 14.0);',
    '    vec3 cm = campo(pb * .8, 11.0); float b = cm.x;',
    '    float hv = uBase.y * (.65 + .7 * fbm(vec3(p.x / 70.0, 1.0, 17.0)));',   // la oleada no es pareja: montículos de polvo
    '    vec2 cb = vec2(p.x / uBase.x, max(p.y, 0.0) / hv);',
    '    float e = length(cb) + (.5 - b) * .8 + (.5 - cm.z) * .25;',
    '    e = max(e, smoothstep(-2.0, -uBase.y * .3, p.y));',
    '    float lit = clamp(.18 + .35 * cm.y + .4 * cb.y, 0.0, 1.0);',
    '    float calor = uMisc.x * .5 * (1.0 - smoothstep(.0, .8, length(cb)));',
    '    col = sobre(humo(e, b, lit, calor, grano, uBase.z * .9, b), col);',
    '  }',
    '  gl_FragColor = vec4(col.rgb, col.a * uMisc.z);',
    '}'
  ].join('\n');

  window.fzNube = function (lienzo) {
    var gl = lienzo.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: true });
    if (!gl) return null;
    var vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, FS); gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(fs)); return null; }
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uVB', 'uO', 'uZ', 'uT', 'uCap', 'uStem', 'uBase', 'uFire', 'uMisc'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var sucio = false;
    return {
      limpia: function () { if (!sucio) return; gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); sucio = false; },
      // caja: rectángulo en píxeles del lienzo [x, y, ancho, alto] con y desde arriba; fuera de él no se pinta nada
      pinta: function (o, caja) {
        var w = lienzo.width, h = lienzo.height;
        gl.viewport(0, 0, w, h); gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        var x0 = Math.max(0, Math.floor(caja[0])), y0 = Math.max(0, Math.floor(caja[1])), x1 = Math.min(w, Math.ceil(caja[0] + caja[2])), y1 = Math.min(h, Math.ceil(caja[1] + caja[3]));
        if (x1 <= x0 || y1 <= y0) return;
        gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, h - y1, x1 - x0, y1 - y0);
        gl.uniform2f(U.uRes, w, h); gl.uniform4f(U.uVB, o.vb.x, o.vb.y, o.vb.width, o.vb.height);
        gl.uniform2f(U.uO, o.ox, o.oy); gl.uniform1f(U.uZ, o.z); gl.uniform1f(U.uT, o.t);
        gl.uniform4fv(U.uCap, o.cap); gl.uniform4fv(U.uStem, o.tallo); gl.uniform4fv(U.uBase, o.base); gl.uniform4fv(U.uFire, o.fuego); gl.uniform4fv(U.uMisc, o.misc);
        gl.drawArrays(gl.TRIANGLES, 0, 3); sucio = true;
      }
    };
  };
})();
