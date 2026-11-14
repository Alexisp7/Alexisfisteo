// Visor del taller: escena, luz, cámara orbital, posproceso y panel.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PALETA } from './organico.js';

const UNIDADES = {
  huevo: () => import('./unidades/huevo.js'),
  zancuda: () => import('./unidades/zancuda.js'),
};

const $ = (s) => document.querySelector(s);
const lienzo = $('#visor');
const estado = $('#estado');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
escena.background = new THREE.Color(PALETA.fondo);
escena.fog = new THREE.FogExp2(PALETA.fondo, 0.12);
const pmrem = new THREE.PMREMGenerator(renderer);
escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.45;

const camara = new THREE.PerspectiveCamera(34, 1, 0.05, 60);
camara.position.set(1.7, 1.9, 5.6);

const controles = new OrbitControls(camara, lienzo);
controles.enableDamping = true;
controles.dampingFactor = 0.06;
controles.minDistance = 1.4;
controles.maxDistance = 11;
controles.maxPolarAngle = Math.PI * 0.53;
controles.autoRotateSpeed = 0.55;
controles.autoRotate = !reduce;

/* Luces: clave blanca fría arriba a la izquierda, contraluz azulado, relleno violeta suave */
escena.add(new THREE.HemisphereLight(0x4a4866, 0x08040c, 0.45));
const clave = new THREE.DirectionalLight(0xe6ecff, 3.2);
clave.position.set(-3.5, 5.5, 3);
clave.castShadow = true;
clave.shadow.mapSize.set(4096, 4096);
Object.assign(clave.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 2, far: 12 });
clave.shadow.bias = -0.0002; clave.shadow.normalBias = 0.04; clave.shadow.radius = 4;
escena.add(clave);
const contra = new THREE.DirectionalLight(0x9aa8ff, 2.6);
contra.position.set(2.5, 3, -4.5);
escena.add(contra);
const relleno = new THREE.PointLight(PALETA.secundario, 1.4, 9, 2);
relleno.position.set(3.2, 2.2, 3.2);
escena.add(relleno);

/* Posproceso: brillo (bloom) suave */
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(escena, camara));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.5, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function ajustar() {
  const w = lienzo.clientWidth, h = lienzo.clientHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
}
new ResizeObserver(ajustar).observe(lienzo);

/* Estado de la vista */
const op = { respirar: !reduce, malla: false };
let actual = null;

async function cargar(id) {
  estado.textContent = 'Gestando…';
  document.body.classList.add('cargando');
  if (actual) { escena.remove(actual.grupo); actual = null; }
  const mod = await UNIDADES[id]();
  const u = await mod.construir({ progreso: (t) => { estado.textContent = 'Gestando · ' + t.toLowerCase(); } });
  actual = { ...u, ficha: mod.ficha };
  escena.add(u.grupo);
  controles.target.copy(u.objetivo);
  pintarFicha(mod.ficha, u.tris);
  renderer.compile(escena, camara);
  document.body.classList.remove('cargando');
  estado.textContent = '';
}

function pintarFicha(f, tris) {
  $('#f-num').textContent = f.numero;
  $('#f-nombre').textContent = f.nombre;
  $('#f-estado').textContent = f.estado;
  $('#f-partes').innerHTML = f.partes.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('');
  $('#f-tris').textContent = Math.round(tris).toLocaleString('es') + ' triángulos';
}

/* Controles del panel */
function interruptor(sel, clave, alCambiar) {
  const b = $(sel);
  const pintar = () => b.setAttribute('aria-pressed', String(!!(clave === 'girar' ? controles.autoRotate : op[clave])));
  b.addEventListener('click', () => {
    if (clave === 'girar') controles.autoRotate = !controles.autoRotate; else op[clave] = !op[clave];
    pintar(); alCambiar && alCambiar();
  });
  pintar();
}
interruptor('#b-girar', 'girar');
interruptor('#b-respirar', 'respirar');
interruptor('#b-malla', 'malla', () => {
  actual?.grupo.traverse((o) => { if (o.isMesh) o.material.wireframe = op.malla; });
});
$('#b-vista').addEventListener('click', () => {
  camara.position.set(1.7, 1.9, 5.6);
  if (actual) controles.target.copy(actual.objetivo);
});
$('#b-glb').addEventListener('click', async () => {
  if (!actual) return;
  const b = $('#b-glb'); b.disabled = true; b.textContent = 'Exportando…';
  try {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const copia = actual.grupo.clone(true);
    copia.traverse((o) => { if (o.userData.noExportar) o.visible = false; });
    const datos = await new GLTFExporter().parseAsync(copia, { binary: true, onlyVisible: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([datos], { type: 'model/gltf-binary' }));
    a.download = actual.ficha.id + '.glb'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } finally { b.disabled = false; b.textContent = 'Descargar .glb'; }
});
const botones = document.querySelectorAll('[data-unidad]');
botones.forEach((el) => el.addEventListener('click', () => {
  botones.forEach((o) => o.setAttribute('aria-current', String(o === el)));
  history.replaceState(null, '', '?u=' + el.dataset.unidad);
  cargar(el.dataset.unidad);
}));

/* Bucle: se detiene cuando la pestaña no se ve */
const reloj = new THREE.Clock();
let t = 0;
function cuadro() {
  const dt = Math.min(reloj.getDelta(), 0.05);
  t += dt;
  controles.update(dt);
  actual?.actualizar(t, dt, op);
  composer.render(dt);
}
renderer.setAnimationLoop(cuadro);
document.addEventListener('visibilitychange', () => renderer.setAnimationLoop(document.hidden ? null : cuadro));

ajustar();
const inicial = UNIDADES[new URLSearchParams(location.search).get('u')] ? new URLSearchParams(location.search).get('u') : 'huevo';
botones.forEach((o) => o.setAttribute('aria-current', String(o.dataset.unidad === inicial)));
cargar(inicial).catch((e) => {
  console.error(e);
  estado.textContent = 'No se pudo construir la unidad.';
});
window.__taller = { renderer, escena, camara, controles, op, composer, cuadro, get actual() { return actual; } };
