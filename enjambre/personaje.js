/* Personaje principal del Enjambre: el modelo 3D de Andreé con sus texturas (modelos/personaje.glb,
   copia ligera para web de su base.obj: 300 mil triángulos, texturas 2048 en webp).
   Va al centro de la maqueta, muy grande, entre los organismos y sus rótulos. No intercepta clics:
   los organismos de debajo siguen abriéndose. Las bolsas verdes de su textura laten. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

// abajo a la izquierda, donde antes estaba «Evolución de la colonia», mirando hacia el mapa.
// Coordenadas de la imagen de la maqueta (1774×887); baja un poco más allá del borde, sobre una franja propia.
const ZONA = { x: -20, y: 400, w: 690, h: 510 };
const escenario = document.createElement('div');   // franja bajo el mapa: deja sitio al tutor y al personaje
escenario.id = 'mq-escenario';
escenario.setAttribute('aria-hidden', 'true');
const caja = document.createElement('div');
caja.className = 'mq-personaje';
caja.setAttribute('aria-hidden', 'true');
caja.style.cssText = `left:${(100 * ZONA.x / 1774).toFixed(3)}%;top:${(100 * ZONA.y / 887).toFixed(3)}%;width:${(100 * ZONA.w / 1774).toFixed(3)}%;height:${(100 * ZONA.h / 887).toFixed(3)}%`;
// plataforma biomecánica de Andreé bajo los pies (detrás del personaje); los orbes laten
caja.insertAdjacentHTML('afterbegin', '<img class="mq-plataforma" src="maqueta2/plataforma.webp" alt="" draggable="false"><img class="mq-plataforma mq-plat-orbes" src="maqueta2/plataforma-orbes.webp" alt="" draggable="false">');

// maquetaDraw() rehace el HTML de #maqueta: volvemos a meter la caja tras la capa de objetos
function colocar() {
  const st = document.getElementById('maqueta');
  if (!st) return;
  escenario.hidden = st.hidden;
  if (st.nextSibling !== escenario) st.after(escenario);
  const obj = st.querySelector(':scope > .mq-objetos');
  if (obj) { if (obj.nextSibling !== caja) obj.after(caja); }
  else if (caja.parentNode !== st) st.appendChild(caja);
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

const tiempo = { value: 0 };
function piel(m) {
  m.onBeforeCompile = (s) => {
    s.uniforms.uPulso = pulso;
    s.uniforms.uTiempo = tiempo;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosL;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosL = position;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uPulso, uTiempo; varying vec3 vPosL;
        float ruido(vec3 p){ return sin(p.x*1.7+sin(p.y*2.3+uTiempo*.9))*sin(p.y*1.9+sin(p.z*2.1-uTiempo*1.1))*sin(p.z*2.2+sin(p.x*1.6+uTiempo*.7)); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        // bolsas verdes: más verde y un líquido que se mueve por dentro
        float verdor = smoothstep(0.03, 0.16, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));
        vec3 q = vPosL * 60.0;
        float flujo = 0.5 + 0.5 * ruido(q + vec3(0.0, uTiempo * 1.6, 0.0));
        float vetas = smoothstep(0.55, 0.95, 0.5 + 0.5 * ruido(q * 1.8 - vec3(uTiempo * 1.2, 0.0, uTiempo * 0.8)));
        vec3 liquido = mix(vec3(0.16, 0.55, 0.03), vec3(0.62, 1.0, 0.16), flujo) + vetas * vec3(0.35, 0.45, 0.1);
        diffuseColor.rgb = mix(diffuseColor.rgb, liquido, verdor * 0.95);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += liquido * verdor * (1.0 + 0.9 * flujo + 0.8 * uPulso);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n        roughnessFactor = mix(roughnessFactor, 0.12, verdor);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n        metalnessFactor = mix(metalnessFactor, 0.0, verdor);');
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
    const p = 1 + a * (0.28 + 0.24 * Math.max(0, s(t * 1.6 + fase(k))) ** 2); // se inflan un poco y laten
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

const mira = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (ev) => { mira.tx = ev.clientX / innerWidth * 2 - 1; mira.ty = ev.clientY / innerHeight * 2 - 1; });
function cuadro() {
  if (!modelo || !visible || !caja.isConnected || !tamano()) return;
  const t = (performance.now() - t0) / 1000;
  // de tres cuartos, mirando al mapa; el mouse lo gira un poco en 3D (profundidad real)
  if (!reducido) { mira.x += (mira.tx - mira.x) * 0.05; mira.y += (mira.ty - mira.y) * 0.05; }
  modelo.rotation.y = reducido ? 0.55 : 0.55 + Math.sin(t * 0.22) * 0.2 + mira.x * 0.35;
  modelo.rotation.x = reducido ? 0 : mira.y * 0.08;
  const resp = reducido ? 0 : Math.sin(t * 1.2);
  modelo.scale.set(1 + resp * 0.004, 1 + resp * 0.008, 1 + resp * 0.004);
  animar(t);
  tiempo.value = reducido ? 0 : t;
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
    window.__personaje = { render, escena, camara, cuadro, modelo, H, animar, tiempo, pulso };
    render.setAnimationLoop(cuadro);
  });
}
cargar(); ancho.addEventListener('change', cargar);
