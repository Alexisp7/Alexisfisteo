/* Personaje principal del Enjambre: el modelo 3D de Andreé con sus texturas (modelos/personaje.glb,
   copia ligera para web de su base.obj: 300 mil triángulos, texturas 2048 en webp).
   Va al centro de la maqueta, muy grande, entre los organismos y sus rótulos. No intercepta clics:
   los organismos de debajo siguen abriéndose. Las bolsas verdes de su textura laten. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

// su propio espacio: una franja entre el mapa de la colmena y el suelo, para no tapar nada
const escenario = document.createElement('section');
escenario.id = 'mq-escenario';
escenario.setAttribute('aria-hidden', 'true');
const caja = document.createElement('div');
caja.className = 'mq-personaje';
escenario.appendChild(caja);

// maquetaDraw() crea o rehace #maqueta: mantenemos el escenario justo después
function colocar() {
  const st = document.getElementById('maqueta');
  if (!st) return;
  escenario.hidden = st.hidden;
  if (st.nextSibling !== escenario) st.after(escenario);
}
new MutationObserver(colocar).observe(document.body, { childList: true, subtree: true });

const render = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
render.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
render.toneMapping = THREE.ACESFilmicToneMapping;
render.toneMappingExposure = 1.15;
render.outputColorSpace = THREE.SRGBColorSpace;
caja.appendChild(render.domElement);

const escena = new THREE.Scene();
// su textura es metálica: sin un entorno que reflejar se ve negra
escena.environment = new THREE.PMREMGenerator(render).fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.8;
const camara = new THREE.PerspectiveCamera(26, 1, 0.05, 50);
const MIRA = new THREE.Vector3(0, 0.56, 0);
camara.position.set(0, 0.95, 3.2);
camara.lookAt(MIRA);

escena.add(new THREE.HemisphereLight(0xe6d8ff, 0x220a2a, 0.6));
const clave = new THREE.DirectionalLight(0xfff0e0, 2.4); clave.position.set(-2, 3.5, 3); escena.add(clave);
const contra = new THREE.DirectionalLight(0xc44aff, 5.0); contra.position.set(2.4, 2, -3); escena.add(contra);
const contra2 = new THREE.DirectionalLight(0x9228e8, 2.2); contra2.position.set(-2.6, 1.2, -2.5); escena.add(contra2);
const verde = new THREE.PointLight(0xb8f52d, 0.5, 2.5, 2); verde.position.set(0, 0.25, 1.2); escena.add(verde);

const pulso = { value: 0.5 };

function piel(m) {
  m.onBeforeCompile = (s) => {
    s.uniforms.uPulso = pulso;
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uPulso;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float verdor = smoothstep(0.06, 0.22, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));
        totalEmissiveRadiance += diffuseColor.rgb * verdor * (0.9 + 1.3 * uPulso);`);
  };
  m.needsUpdate = true;
}

let modelo = null, visible = true;
// el modelo viene separado en partes, cada una con su hueso (guadañas, garras, brazos, manos, cabeza, torso
// y 18 bolsas verdes). Aquí se mueve cada parte por separado.
const H = {};
const fase = (n) => { let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) % 997; return h / 997 * 6.283; };
function animar(t) {
  const s = Math.sin, a = reducido ? 0 : 1;
  for (const lado of ['izq', 'der']) {
    const sg = lado === 'izq' ? 1 : -1, d = lado === 'izq' ? 0 : 0.7;
    const gu = H['guadana_' + lado];   // las guadañas se alzan y amenazan despacio
    if (gu) gu.rotation.set(a * (0.11 * s(t * 0.9 + d) - 0.05), 0, a * sg * (0.13 * s(t * 0.9 + d) + 0.03 * s(t * 2.3 + d)));
    const ga = H['garra_tras_' + lado];
    if (ga) ga.rotation.set(a * 0.17 * s(t * 1.1 + d + 1.5), 0, a * sg * 0.13 * s(t * 1.3 + d));
    const br = H['brazo_' + lado];     // los brazos delanteros tantean
    if (br) br.rotation.set(a * 0.2 * s(t * 1.7 + d), a * sg * 0.1 * s(t * 1.2 + d), 0);
    // las manos principales (las dos casi cruzadas frente al pecho) se quedan quietas
  }
  if (H.torso) H.torso.rotation.set(a * 0.025 * s(t * 1.2), a * 0.03 * s(t * 0.5), 0);
  if (H.cabeza) H.cabeza.rotation.set(a * 0.07 * s(t * 0.8 + 0.4), a * 0.13 * s(t * 0.45), a * 0.04 * s(t * 0.6));
  for (const k in H) if (k.startsWith('bolsa_')) {  // cada bolsa late a su ritmo
    const p = 1 + a * 0.14 * Math.max(0, s(t * 2.2 + fase(k))) ** 2;
    H[k].scale.setScalar(p);
  }
}
const t0 = performance.now();

function tamano() {
  const r = caja.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const w = Math.round(r.width), h = Math.round(r.height), c = render.domElement, pr = render.getPixelRatio();
  if (c.width !== Math.round(w * pr) || c.height !== Math.round(h * pr)) {
    render.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix();
  }
  return true;
}

function cuadro() {
  if (!modelo || !visible || !caja.isConnected || !tamano()) return;
  const t = (performance.now() - t0) / 1000;
  modelo.rotation.y = reducido ? -0.35 : -0.35 + Math.sin(t * 0.22) * 0.35;
  const resp = reducido ? 0 : Math.sin(t * 1.2);
  modelo.scale.set(1 + resp * 0.004, 1 + resp * 0.008, 1 + resp * 0.004);
  animar(t);
  pulso.value = reducido ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.0);
  verde.intensity = 0.3 + pulso.value * 0.5;
  render.render(escena, camara);
}
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

colocar();
// solo en pantallas anchas, donde está la maqueta (en móvil no se descarga)
const ancho = matchMedia('(min-width: 761px)');
function cargar() {
  if (!ancho.matches || cargar.hecho) return; cargar.hecho = true;
  const cargador = new GLTFLoader();
  cargador.setMeshoptDecoder(MeshoptDecoder);
  cargador.load(new URL('modelos/personaje.glb', import.meta.url).href, (g) => {
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
      if (o.isSkinnedMesh) { o.frustumCulled = false; for (const b of o.skeleton.bones) H[b.name] = b; }
      piel(o.material);
    });
    modelo = new THREE.Group();
    modelo.add(g.scene);
    escena.add(modelo);
    caja.classList.add('listo');
    window.__personaje = { render, escena, camara, cuadro, modelo, H, animar };
    render.setAnimationLoop(cuadro);
  });
}
cargar(); ancho.addEventListener('change', cargar);
