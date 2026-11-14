/* Personaje principal del Enjambre: el modelo 3D de Andreé con sus texturas (modelos/personaje.glb,
   copia ligera para web de su base.obj: 300 mil triángulos, texturas 2048 en webp).
   Va al centro de la maqueta, muy grande, entre los organismos y sus rótulos. No intercepta clics:
   los organismos de debajo siguen abriéndose. Las bolsas verdes de su textura laten. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// zona en coordenadas de la imagen de la maqueta (1774×887)
const ZONA = { x: 935, y: 688, w: 330, h: 240 }; // abajo, en el suelo oscuro libre entre Fluidos, Oscilador y Equilibrio
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

const caja = document.createElement('div');
caja.className = 'mq-personaje';
caja.setAttribute('aria-hidden', 'true');
caja.style.cssText = `left:${(100 * ZONA.x / 1774).toFixed(3)}%;top:${(100 * ZONA.y / 887).toFixed(3)}%;width:${(100 * ZONA.w / 1774).toFixed(3)}%;height:${(100 * ZONA.h / 887).toFixed(3)}%`;

// maquetaDraw() rehace el HTML de #maqueta: volvemos a meter la caja cada vez
function colocar() {
  const st = document.getElementById('maqueta');
  if (!st || st.hidden) return;
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
  modelo.scale.set(1 + resp * 0.005, 1 + resp * 0.01, 1 + resp * 0.005);
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
      piel(o.material);
    });
    modelo = new THREE.Group();
    modelo.add(g.scene);
    escena.add(modelo);
    caja.classList.add('listo');
    window.__personaje = { render, escena, camara, cuadro, modelo };
    render.setAnimationLoop(cuadro);
  });
}
cargar(); ancho.addEventListener('change', cargar);
