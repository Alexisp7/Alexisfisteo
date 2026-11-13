// Trazador de rayos del agujero negro de Schwarzschild (GLSL), compartido por cursos.html y relatividad.html.
// Cada píxel lanza un rayo de luz hacia atrás y lo integra como geodésica nula de Schwarzschild
// (unidades G = c = M = 1, rₛ = 2): x'' = −(3/2)·rₛ·h²·x / r⁵, con h = |x × v|.
// uAg: opacidad de la mancha de tinta (1 en Cursos; 0 en Relatividad, donde el fondo es el espacio).
(function () {
window.GLSL_AGUJERO = [
  '#extension GL_OES_standard_derivatives : enable',
  'precision highp float;',
  'uniform vec2 uRes; uniform vec4 uVB; uniform vec2 uC; uniform float uSC, uRoll, uT, uIncl, uPix, uArm, uTD, uHk, uEx, uSal, uAg; uniform vec2 uDim;',
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
  // dibujo de los trazos en una fase dada: (raya, tono, flecos, huecos)
  'vec4 patron(float r, vec2 cs, float fr, float fa) {',
  '  float s1 = ruido(vec3(cs * 2.2, r * 3.0));',
      // donde la órbita se ve de canto (puntas del disco) un píxel abarca mucho ángulo: ahí la ondulación de las rayas se apaga y quedan anillos lisos
  '  float lisa = 1.0 - smoothstep(.015, .06, fa);',
  '  float f1 = r / .11 + (ruido(vec3(cs * 1.4, r * .8 + 2.0)) - .5) * 1.6 * lisa, f2 = r / .05 + (ruido(vec3(cs * 2.6 + 5.0, r * 1.7)) - .5) * 3.0 * lisa;',
  '  float w2 = 1.0 - smoothstep(.22, .42, fr / .11), w3 = (1.0 - smoothstep(.22, .42, fr / .05)) * (.35 + .65 * lisa);',
  '  float tr = (s1 - .5) * .7 + cos(6.2832 * f1) * .38 * w2 + cos(6.2832 * f2) * .3 * w3;',
  '  float n = ruido(vec3(cs * 1.6, r * 1.3 + 5.0)), flec = ruido(vec3(cs * 3.0, 2.0)) - .5, h1, h2;',
  // cada corte vive en un anillo; su borde radial se suaviza un píxel (antes era un escalón y salían cuadritos) y el corte
  // desaparece del todo antes de que su anillo mida menos de ~5 px o de que el corte, a lo largo de la órbita, quepa en pocos píxeles
  // (en las puntas del disco la órbita se ve de canto y los cortes se volvían puntos oscuros)
  '  { float y = r * 5.0, kb = floor(y), N = 2.0 + 4.0 * hash(vec3(kb, 3.0, 1.0)), e = min(fract(y), 1.0 - fract(y)) * .2;',
  '    h1 = smoothstep(.69, .75, ruido(vec3(cs * N + hash(vec3(kb, 8.0, 2.0)) * 40.0, kb * 1.7))) * smoothstep(.0, fr * 1.2, e) * smoothstep(5.0, 9.0, .2 / fr) * (1.0 - smoothstep(.02, .05, N * fa)); }',
  '  { float y = r * 9.0 + .5, kb = floor(y), N = 4.0 + 7.0 * hash(vec3(kb, 5.0, 4.0)), e = min(fract(y), 1.0 - fract(y)) * .111;',
  '    h2 = smoothstep(.73, .79, ruido(vec3(cs * N + hash(vec3(kb, 1.0, 6.0)) * 40.0, kb * 2.3 + 7.0))) * smoothstep(.0, fr * 1.2, e) * smoothstep(5.0, 9.0, .111 / fr) * (1.0 - smoothstep(.02, .05, N * fa)); }',
  '  return vec4(tr, n, flec, max(h1, h2 * .9)); }',
  'vec4 disco(vec3 p, vec3 v, float hay) {',
  '  float r = max(length(p.xz), 2.5), ph = atan(p.z, p.x), b = sqrt(1.0 / max(r - 2.0, .05)); vec3 t = normalize(vec3(-p.z, 0.0, p.x) + 1e-5); vec3 vd = normalize(v + 1e-5);',
  '  float g = sqrt(max(1.0 - 3.0 / r, 0.0)) / (1.0 - b * dot(t, -vd)), D = clamp(pow(g, 2.0), .82, 1.18);',
  '  float u = (r - 6.0) / 13.5, fr = min(fwidth(r), .4) + 1e-4, fa = length(fwidth(vec2(cos(ph), sin(ph))));',
  // bucle perfecto de 40 s: cada anillo da un número entero de vueltas por ciclo (más adentro, más vueltas, como Kepler),
  // así el último cuadro es idéntico al primero y los trazos nunca se enrollan; entre dos anillos vecinos se funde en una franja fina
  '  float x = 10.8 * pow(6.0 / r, 1.5), nA = floor(x), fx = x - nA, wB = smoothstep(.44, .56, fx), ang = 6.2832 * uTD / 40.0;',
  '  float q0 = ph - 1.7 * pow(6.0 / r, 1.5) * 9.0;',   // un poco de desfase fijo entre órbitas: trazo más nítido, sin crecer con el tiempo
  '  vec4 P = patron(r, vec2(cos(q0 - nA * ang), sin(q0 - nA * ang)), fr, fa);',
  '  if (wB > 0.0) P = mix(P, patron(r, vec2(cos(q0 - (nA + 1.0) * ang), sin(q0 - (nA + 1.0) * ang)), fr, fa), wB);',
  '  float tr = P.x, n = P.y, flec = P.z, hueco = P.w;',
  '  vec3 tono = paleta(u + (n - .5) * .26 + tr * .12);',
  '  vec3 col = mix(tono * vec3(.72, .46, .34), min(tono * 1.1, vec3(1.0)), clamp(.62 + tr * .95, 0.0, 1.0));',
  // corrimiento Doppler en el color: el lado que se acerca (g > 1) se ve más dorado y el que se aleja, más carmín
  '  float dop = clamp((g - 1.0) * 3.0, -1.0, 1.0);',
  '  col *= mix(vec3(1.0), dop > 0.0 ? vec3(1.08, 1.0, .82) : vec3(.97, .8, .66), abs(dop));',
  '  float ar = min(fr, .12) * .7 + 1e-4;',
  '  float afuera = 1.0 - smoothstep(15.0 + 2.5 * flec, 21.5 + 1.0 * flec, r);',
  '  float fundido = smoothstep(.3, 1.3, uArm);',
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
  // salida hacia Relatividad: la mancha se extiende hasta cubrir toda la pantalla
  '  pw *= 1.0 + 5.5 * uEx;',
  // borde con la mitad del suavizado original (antes la veladura ocupaba .065 en e; ahora .0325) y sin línea de contorno
  '  float fe = clamp(fwidth(e), 1e-4, .06), T = .914 * pw;',
  '  float W = 1.0 - smoothstep(T - .0325 - fe, T, e);',
  // núcleo de pigmento denso (índigo casi negro) y, hacia el borde, una veladura gris azulada que se deshilacha
  '  float nucleo = 1.0 - smoothstep(.5 * pw, .84 * pw, e + (fbm(vec3(sb * .25, 9.0)) - .5) * .35);',
  '  float n = fbm(d * 2.6 + vec3(1.3, 6.2, 2.9)), n3 = fbm(d * 6.0 + 3.0);',
  '  float filo = smoothstep(.72, T, e) * W;',
  '  float grano = ruido(vec3(sb * 9.0, 7.0)) * (1.0 - smoothstep(.002, .004, px));',
  '  float dens = W * (.74 + .22 * n + .08 * grano) + .3 * filo;',
  '  dens = mix(dens, .9 + .1 * n, nucleo);',
  '  vec3 velo = mix(vec3(.05, .06, .11), vec3(.14, .16, .24), smoothstep(.3, .8, n3));',
  '  vec3 hondo = mix(vec3(.012, .016, .035), vec3(.05, .065, .12), smoothstep(.35, .9, n3) * .85 + grano * .12);',
  '  vec3 tinta = mix(velo, hondo, nucleo);',
  // vetas de pigmento granate y carmín mezcladas con el índigo, como dos tintas que se tocan en el papel mojado
  '  float vet = smoothstep(.56, .8, fbm(vec3(sb * .17, 21.0)) + (n - .5) * .3);',
  '  tinta = mix(tinta, mix(vec3(.17, .03, .05), vec3(.07, .012, .025), nucleo), vet * .75);',
  '  tinta = mix(tinta, vec3(.3, .06, .06), filo * .3 * (1.0 - nucleo));',
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
  '  if (length(vec2(bx / 23.0, by / 12.5)) > 1.45 * (1.0 + 5.5 * uEx) && length(vec2(bx, by)) > 24.0) { gl_FragColor = vec4(0.0); return; }',
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
  // dirección hacia el fondo: la de una cámara estenopeica
  '  float F = 16.0, px = uPix / F;',
  // el espacio de fondo se ve sin lente (Andreé quitó la ampliación de las estrellas a los costados de la sombra):
  // solo el disco conserva la desviación de la luz
  '  float bb = length(vec2(bx, by));',
  '  vec3 dg = normalize(fw + (rt * bx + up * by) / F);',
  // el cielo gira despacio, sin deformarse
  '  float ag = uT * .06, cg = cos(ag), sg = sin(ag); dg = vec3(cg * dg.x - sg * dg.z, dg.y, sg * dg.x + cg * dg.z);',
  // dentro de la sombra, marcas a escala (sin lente): singularidad, horizonte rₛ = 2 y esfera de fotones 1,5 rₛ = 3
  // sombra negra limpia; su borde (b = √27 M) se suaviza un píxel para que no se vea escalonado
  '  float ab = fwidth(bb) + 1e-4, sA = (cae ? 1.0 : 1.0 - smoothstep(5.196 - ab, 5.196 + ab, bb)) * (1.0 - uSal);',
  '  vec4 tinta = sA < .999 ? aguada(vec2(bx, by), dg, px) : vec4(0.0); tinta.a *= uDim.y * uAg;',
  '  vec4 fondo = mix(tinta, vec4(.012, .014, .02, smoothstep(.05, .55, uArm) * (1.0 - .7 * uHk)), sA);',
  // radiación de Hawking: filo rojo finísimo justo fuera de la sombra, que chisporrotea; va en la capa del fondo,
  // así queda delante de la sombra y detrás de las dos imágenes del disco, sin recortes
  '  float ang = atan(by, bx), chis = ruido(vec3(ang * 38.0, uT * 26.0, 1.0)) * .7 + ruido(vec3(ang * 90.0, uT * 41.0, 4.0)) * .3;',
  '  float ancho = ab * (.9 + 1.6 * chis * chis) * (1.0 + .9 * uHk), dr = bb - 5.196 - ab * .6;',
  '  float filoH = (1.0 - smoothstep(ancho * .55, ancho * .55 + ab, abs(dr))) * smoothstep(.55, 1.3, uArm) * max(uDim.y, uHk);',
  '  float halo = exp(-max(dr, 0.0) / (ab * (3.0 + 3.0 * uHk))) * step(0.0, dr) * (.35 + .45 * uHk) * chis * max(uDim.y, uHk);',
  '  vec3 rojo = mix(mix(vec3(.62, .07, .05), vec3(.95, .25, .17), chis), mix(vec3(.9, .02, .02), vec3(1.0, .16, .08), chis), uHk);',
  '  float mH = max(filoH, halo) * (1.0 - uSal); fondo = vec4(mix(fondo.rgb, rojo, mH), max(fondo.a, mH));',
  '  vec4 c1 = disco(hA, vA, n > 0 ? 1.0 : 0.0), c2 = disco(hB, vB, n > 1 ? 1.0 : 0.0); c1.a *= uDim.x * (1.0 - uSal); c2.a *= uDim.x * (1.0 - uSal);',
  // el fondo (mancha, estrellas, filo de Hawking) va dos tonos más oscuro y rojizo; el disco lleva su propio tono,
  // amarillo dorado de gas caliente (blanco cálido adentro, ámbar afuera), apenas más oscuro que el original
  '  fondo.rgb *= vec3(.88, .73, .68); fondo.rgb = mix(fondo.rgb, fondo.rgb * fondo.rgb * 1.25, .15);',
  '  c1.rgb *= vec3(.97, .93, .7); c2.rgb *= vec3(.97, .93, .7);',   // foco de las notas: lo demás se vuelve transparente
  // composición «sobre» con alfa directo: el papel de la página se ve donde no hay tinta
  '  float a2 = c2.a + fondo.a * (1.0 - c2.a); vec3 k2 = (c2.rgb * c2.a + fondo.rgb * fondo.a * (1.0 - c2.a)) / max(a2, 1e-4);',
  '  float a1 = c1.a + a2 * (1.0 - c1.a); vec3 k1 = (c1.rgb * c1.a + k2 * a2 * (1.0 - c1.a)) / max(a1, 1e-4);',
  '  gl_FragColor = vec4(k1, a1); }'
].join('\n');
})();
