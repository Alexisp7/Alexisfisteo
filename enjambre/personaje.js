/* Personaje principal del Enjambre: el modelo 3D de Andreé (modelos/personaje.glb, copia ligera para web
   de su base.glb) de pie en el claro bajo el panel «Sigue por aquí».
   El modelo no trae texturas: el color se calcula aquí a partir de la forma (crestas en hueso-bronce,
   caparazón violeta, cavidades oscuras con luz verde que late). La geometría no se toca. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// claro de la maqueta, en coordenadas de la imagen (1774×887)
const ZONA = { x: 110, y: 392, w: 430, h: 392 };
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

const caja = document.createElement('div');
caja.className = 'mq-personaje';
caja.title = 'Arrastra para girarlo';
caja.style.cssText = `left:${(100 * ZONA.x / 1774).toFixed(3)}%;top:${(100 * ZONA.y / 887).toFixed(3)}%;width:${(100 * ZONA.w / 1774).toFixed(3)}%;height:${(100 * ZONA.h / 887).toFixed(3)}%`;

// maquetaDraw() rehace el HTML de #maqueta: volvemos a meter la caja cada vez
function colocar() {
  const st = document.getElementById('maqueta');
  if (st && !st.hidden && caja.parentNode !== st) st.appendChild(caja);
}
new MutationObserver(colocar).observe(document.body, { childList: true, subtree: true });

const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
render.toneMapping = THREE.ACESFilmicToneMapping;
render.toneMappingExposure = 1.05;
render.outputColorSpace = THREE.SRGBColorSpace;
caja.appendChild(render.domElement);

const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(26, 1, 0.05, 50);
camara.position.set(0, 1.5, 5.0);
camara.lookAt(0, 0.82, 0);

escena.add(new THREE.HemisphereLight(0xd9c6ff, 0x1a0820, 0.9));
const clave = new THREE.DirectionalLight(0xffe2c4, 2.6); clave.position.set(-2.5, 4, 3); escena.add(clave);
const contra = new THREE.DirectionalLight(0xc44aff, 3.2); contra.position.set(2.5, 2.2, -3.5); escena.add(contra);
const bajo = new THREE.PointLight(0xb8f52d, 0.6, 3, 2); bajo.position.set(0, 0.3, 1.6); escena.add(bajo);

const pulso = { value: 0 };

function pintar(geo) {
  geo.computeVertexNormals();
  const P = geo.attributes.position.array, N = geo.attributes.normal.array, I = geo.index.array;
  const n = P.length / 3;
  // vecinos (aristas de cada triángulo) en formato CSR
  const grado = new Uint32Array(n);
  for (let i = 0; i < I.length; i++) grado[I[i]] += 2;
  const ini = new Uint32Array(n + 1);
  for (let i = 0; i < n; i++) ini[i + 1] = ini[i] + grado[i];
  const vec = new Uint32Array(ini[n]), lleno = new Uint32Array(n);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    vec[ini[a] + lleno[a]++] = b; vec[ini[a] + lleno[a]++] = c;
    vec[ini[b] + lleno[b]++] = a; vec[ini[b] + lleno[b]++] = c;
    vec[ini[c] + lleno[c]++] = a; vec[ini[c] + lleno[c]++] = b;
  }
  // suaviza posiciones k veces y mide cuánto sobresale cada vértice respecto a esa versión lisa
  const relieve = (k) => {
    let A = Float32Array.from(P), B = new Float32Array(P.length);
    for (let it = 0; it < k; it++) {
      for (let v = 0; v < n; v++) {
        let x = 0, y = 0, z = 0; const e = ini[v + 1] - ini[v];
        for (let j = ini[v]; j < ini[v + 1]; j++) { const u = vec[j] * 3; x += A[u]; y += A[u + 1]; z += A[u + 2]; }
        const o = v * 3;
        if (e) { B[o] = (A[o] + x / e) / 2; B[o + 1] = (A[o + 1] + y / e) / 2; B[o + 2] = (A[o + 2] + z / e) / 2; }
        else { B[o] = A[o]; B[o + 1] = A[o + 1]; B[o + 2] = A[o + 2]; }
      }
      [A, B] = [B, A];
    }
    const r = new Float32Array(n);
    for (let v = 0; v < n; v++) { const o = v * 3; r[v] = (P[o] - A[o]) * N[o] + (P[o + 1] - A[o + 1]) * N[o + 1] + (P[o + 2] - A[o + 2]) * N[o + 2]; }
    return r;
  };
  const fino = relieve(3), grueso = relieve(24);
  const escala = (r) => { const s = Float32Array.from(r).map(Math.abs).sort(); return s[Math.floor(s.length * 0.9)] || 1; };
  const sf = escala(fino), sg = escala(grueso);

  const col = new Float32Array(n * 3), luz = new Float32Array(n);
  const C = (h) => new THREE.Color(h);
  const ciruela = C(0x2a0c2c), violeta = C(0x6a1f78), lila = C(0x9a45b4), hueso = C(0xc9a77a), bronce = C(0x8a5a32),
        sombra = C(0x0c0410), piedra = C(0x1c1222), piedraAlta = C(0x3a2a44);
  const c = new THREE.Color(), tmp = new THREE.Color();
  for (let v = 0; v < n; v++) {
    const y = P[v * 3 + 1];
    const f = Math.max(-1, Math.min(1, fino[v] / sf)), g = Math.max(-1, Math.min(1, grueso[v] / sg));
    if (y < 0.115) { // peana
      c.copy(piedra).lerp(piedraAlta, Math.max(0, f) * 0.8);
      c.lerp(sombra, Math.max(0, -g) * 0.6);
      luz[v] = Math.max(0, -g - 0.35) * 0.25;
    } else {
      const alto = Math.min(1, (y - 0.12) / 1.6);
      c.copy(ciruela).lerp(violeta, 0.55 + 0.35 * alto);
      c.lerp(lila, Math.max(0, g) * 0.35);
      c.lerp(tmp.copy(bronce).lerp(hueso, Math.max(0, f)), Math.min(0.75, Math.max(0, f - 0.55) * 1.6)); // solo las crestas más vivas
      c.lerp(sombra, Math.max(0, -g) * 0.7);                                             // cavidades
      luz[v] = Math.max(0, -g - 0.6) * Math.max(0, 1 - Math.abs(f)) * 1.6;
    }
    col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('luz', new THREE.BufferAttribute(luz, 1));
}

function material() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.12 });
  m.onBeforeCompile = (s) => {
    s.uniforms.uPulso = pulso;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float luz; varying float vLuz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLuz = luz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uPulso; varying float vLuz;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.72,0.96,0.18) * vLuz * (0.55 + 0.45*uPulso);');
  };
  return m;
}

let modelo = null, giro = -0.35, objetivo = -0.35, arrastre = null, visible = true;
const t0 = performance.now();

function tamano() {
  const r = caja.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const w = Math.round(r.width), h = Math.round(r.height);
  const c = render.domElement;
  if (c.width !== Math.round(w * render.getPixelRatio()) || c.height !== Math.round(h * render.getPixelRatio())) {
    render.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix();
  }
  return true;
}

function cuadro() {
  if (!modelo || !visible || !caja.isConnected || !tamano()) return;
  const t = (performance.now() - t0) / 1000;
  if (!arrastre) objetivo += reducido ? 0 : 0.0016;
  giro += (objetivo - giro) * 0.08;
  modelo.rotation.y = giro + (reducido ? 0 : Math.sin(t * 0.35) * 0.18);
  const resp = reducido ? 0 : Math.sin(t * 1.25);
  modelo.scale.set(1 + resp * 0.006, 1 + resp * 0.012, 1 + resp * 0.006);
  pulso.value = reducido ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.1);
  bajo.intensity = 0.35 + pulso.value * 0.4;
  render.render(escena, camara);
}

caja.addEventListener('pointerdown', (e) => { arrastre = { x: e.clientX, o: objetivo }; caja.setPointerCapture(e.pointerId); caja.classList.add('gira'); });
caja.addEventListener('pointermove', (e) => { if (arrastre) objetivo = arrastre.o + (e.clientX - arrastre.x) * 0.012; });
const soltar = () => { arrastre = null; caja.classList.remove('gira'); };
caja.addEventListener('pointerup', soltar); caja.addEventListener('pointercancel', soltar);
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

colocar();
// solo en pantallas anchas, donde está la maqueta (en móvil no se descarga)
const ancho = matchMedia('(min-width: 761px)');
function cargar() {
  if (!ancho.matches || cargar.hecho) return; cargar.hecho = true;
  const cargador = new GLTFLoader();
  cargador.setMeshoptDecoder(MeshoptDecoder);
  cargador.load(new URL('modelos/personaje.glb', import.meta.url).href, (g) => {
  const malla = g.scene.getObjectByProperty('isMesh', true);
  // el .glb viene cuantizado: pasamos las posiciones a metros reales (mismo modelo, misma forma)
  g.scene.updateMatrixWorld(true);
  const q = malla.geometry.attributes.position, f = new Float32Array(q.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < q.count; i++) { v.fromBufferAttribute(q, i).applyMatrix4(malla.matrixWorld); f[i * 3] = v.x; f[i * 3 + 1] = v.y; f[i * 3 + 2] = v.z; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(f, 3));
  geo.setIndex(malla.geometry.index);
  malla.geometry = geo;
  malla.removeFromParent(); malla.position.set(0, 0, 0); malla.quaternion.identity(); malla.scale.set(1, 1, 1); malla.updateMatrix();
  g.scene.add(malla);
  pintar(geo);
  malla.material = material();
  modelo = new THREE.Group();
  modelo.add(g.scene);
  escena.add(modelo);
  caja.classList.add('listo');
  window.__personaje = { render, escena, camara, cuadro };
  render.setAnimationLoop(cuadro);
  });
}
cargar(); ancho.addEventListener('change', cargar);
