// Herramientas compartidas del taller: ruido, materiales orgánicos y tubos que se afinan.
import * as THREE from 'three';

/* ---------- Ruido simplex 3D (JS) con semilla ---------- */
export function crearRuido(semilla = 1) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = semilla >>> 0 || 1;
  const azar = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 255; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512), pm12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; }
  const g = [1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1];
  const F3 = 1 / 3, G3 = 1 / 6;
  function n3(x, y, z) {
    const t0 = (x + y + z) * F3, i = Math.floor(x + t0), j = Math.floor(y + t0), k = Math.floor(z + t0);
    const t = (i + j + k) * G3, x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; } else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; } else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; } else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; } else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 0.5, y3 = y0 - 1 + 0.5, z3 = z0 - 1 + 0.5;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0, tt, gi;
    tt = 0.6 - x0*x0 - y0*y0 - z0*z0; if (tt > 0) { gi = pm12[ii + perm[jj + perm[kk]]] * 3; tt *= tt; n += tt * tt * (g[gi]*x0 + g[gi+1]*y0 + g[gi+2]*z0); }
    tt = 0.6 - x1*x1 - y1*y1 - z1*z1; if (tt > 0) { gi = pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3; tt *= tt; n += tt * tt * (g[gi]*x1 + g[gi+1]*y1 + g[gi+2]*z1); }
    tt = 0.6 - x2*x2 - y2*y2 - z2*z2; if (tt > 0) { gi = pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3; tt *= tt; n += tt * tt * (g[gi]*x2 + g[gi+1]*y2 + g[gi+2]*z2); }
    tt = 0.6 - x3*x3 - y3*y3 - z3*z3; if (tt > 0) { gi = pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3; tt *= tt; n += tt * tt * (g[gi]*x3 + g[gi+1]*y3 + g[gi+2]*z3); }
    return 32 * n;
  }
  function fbm(x, y, z, oct = 4) {
    let a = 0.5, f = 1, sum = 0;
    for (let o = 0; o < oct; o++) { sum += a * n3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
    return sum;
  }
  return { n3, fbm, azar };
}

/* ---------- GLSL: ruido simplex (Ashima / Gustavson, MIT) ---------- */
export const GLSL_RUIDO = /* glsl */`
vec3 tl_mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 tl_mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 tl_perm(vec4 x){return tl_mod289(((x*34.0)+10.0)*x);}
float tl_snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=tl_mod289(i);
  vec4 p=tl_perm(tl_perm(tl_perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=inversesqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float tl_fbm(vec3 p){float a=0.5,s=0.0;for(int i=0;i<4;i++){s+=a*tl_snoise(p);p*=2.07;a*=0.5;}return s;}
// Celdas (Worley) para poros y escamas
float tl_celdas(vec3 p){
  vec3 b=floor(p); vec3 f=fract(p); float d=1.0;
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)for(int k=-1;k<=1;k++){
    vec3 o=vec3(float(i),float(j),float(k));
    vec3 r=fract(sin(vec3(dot(b+o,vec3(127.1,311.7,74.7)),dot(b+o,vec3(269.5,183.3,246.1)),dot(b+o,vec3(113.5,271.9,124.6))))*43758.5453);
    d=min(d,length(o+r-f));
  }
  return d;
}
`;

/**
 * Hace orgánico un MeshPhysicalMaterial: relieve fino por fragmento (sin texturas),
 * variación de color y, si se pide, brillo propio (emisivo) que late.
 * opciones.relieve: GLSL que devuelve float `h` a partir de vec3 `q` (posición local).
 * opciones.tinte: GLSL que modifica `diffuseColor.rgb` usando `q` y `h`.
 * opciones.brillo: GLSL que modifica `totalEmissiveRadiance` usando `q`, `h`, `uT`, `uPulso`.
 */
export function organizar(mat, op = {}) {
  const uniforms = { uT: { value: 0 }, uPulso: { value: 0 }, uFuerza: { value: op.fuerza ?? 1 } };
  mat.userData.uniforms = uniforms;
  mat.customProgramCacheKey = () => 'tl-' + (op.clave || Math.random());
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vQ;\nvarying vec2 vUv2;' + (op.vertexDecl || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvQ = position;\nvUv2 = uv;' + (op.vertex || ''));
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uT; uniform float uPulso; uniform float uFuerza;
varying vec3 vQ; varying vec2 vUv2;
${op.fragDecl || ''}
${GLSL_RUIDO}
float tl_altura(vec3 q){ float h = 0.0; ${op.relieve || ''} return h; }
`)
      .replace('#include <color_fragment>', `#include <color_fragment>
vec3 q = vQ; float h = tl_altura(q);
${op.tinte || ''}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  // relieve procedural: misma idea que bumpMap, con la altura calculada aquí
  vec3 vSigmaX = dFdx(-vViewPosition); vec3 vSigmaY = dFdy(-vViewPosition);
  vec3 vN = normal;
  vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec2 dH = vec2(tl_altura(vQ + dFdx(vQ)) - h, tl_altura(vQ + dFdy(vQ)) - h) * uFuerza;
  vec3 vGrad = sign(fDet) * (dH.x * R1 + dH.y * R2);
  normal = normalize(abs(fDet) * vN - vGrad);
}`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
${op.material || ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
${op.brillo || ''}`);
  };
  return mat;
}

/** Tubo que se afina (y ondula) a lo largo de una curva. radio(t) da el grosor en t∈[0,1]. */
export function tuboAfinado(curva, { tramos = 120, lados = 14, radio = (t) => 0.05 * (1 - t) + 0.004, ruido = null, rugosidad = 0 } = {}) {
  const marcos = curva.computeFrenetFrames(tramos, false);
  const pos = [], nor = [], uv = [], idx = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3();
  for (let i = 0; i <= tramos; i++) {
    const t = i / tramos;
    curva.getPointAt(t, P);
    const r0 = radio(t);
    for (let j = 0; j <= lados; j++) {
      const a = (j / lados) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      N.set(0, 0, 0).addScaledVector(marcos.normals[i], c).addScaledVector(marcos.binormals[i], s).normalize();
      let r = r0;
      if (ruido && rugosidad) r *= 1 + rugosidad * ruido.n3(P.x * 9 + c, P.y * 9 + s, P.z * 9 + t * 4);
      pos.push(P.x + N.x * r, P.y + N.y * r, P.z + N.z * r);
      nor.push(N.x, N.y, N.z);
      uv.push(t, j / lados);
    }
  }
  for (let i = 0; i < tramos; i++) for (let j = 0; j < lados; j++) {
    const a = i * (lados + 1) + j, b = a + lados + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export const PALETA = {
  fondo: 0x100817, sup1: 0x1B1025, sup2: 0x25132F, primario: 0x9228E8, secundario: 0xC44AFF,
  brillo: 0xE5A4FF, biomasa: 0x56234D, acido: 0xB8F52D, texto: 0xF3EAF8,
};

export const cuadro = () => new Promise((r) => requestAnimationFrame(() => r()));
