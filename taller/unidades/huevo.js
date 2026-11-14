// Unidad 01 · Huevo latente (v2)
// Óvalo de placas verdes abultadas unidas por nervaduras brillantes, envuelto abajo
// por una membrana oscura con púas cortas, sobre un disco de biomasa violeta.
import * as THREE from 'three';
import { crearRuido, organizar, tuboAfinado, PALETA, cuadro } from '../organico.js';

export const ficha = {
  id: 'huevo',
  numero: '01',
  nombre: 'Huevo latente',
  estado: 'Versión 2 · para revisar',
  partes: [
    ['Placas', 'Catorce celdas verdes, lisas y abultadas, cada una de distinto tamaño; laten con una luz tenue desde dentro.'],
    ['Nervaduras', 'Una red en relieve, color bronce oscuro y brillo húmedo, que separa y sujeta las placas.'],
    ['Membrana', 'Piel oscura que envuelve la mitad de abajo y cae en pliegues hasta el suelo.'],
    ['Púas y biomasa', 'Cuatro púas cortas en la base y un disco de biomasa violeta.'],
  ],
};

const ALTO = 0.98, ANCHO = 0.74, CENTRO = 1.0;

// v=0 polo inferior, v=1 polo superior. Más ancho abajo, como un huevo.
function puntoHuevo(theta, v, r = 1, out = new THREE.Vector3()) {
  const c = Math.cos(Math.PI * v);
  const anillo = Math.sin(Math.PI * v) * ANCHO * (1 + 0.12 * c) * r;
  return out.set(Math.cos(theta) * anillo, CENTRO - ALTO * c * (0.94 + 0.06 * r), Math.sin(theta) * anillo);
}

export async function construir({ progreso = () => {} } = {}) {
  const R = crearRuido(11);
  const grupo = new THREE.Group();
  grupo.name = 'Huevo latente';

  /* ---------------- Cáscara: celdas de Voronoi sobre la esfera ---------------- */
  progreso('Placas');
  const semillas = [];
  const nS = 14;
  for (let i = 0; i < nS; i++) {
    // espiral de Fibonacci con desorden, sin semillas en los polos exactos
    const y = 1 - 2 * (i + 0.5) / nS;
    const r = Math.sqrt(1 - y * y), a = i * 2.39996 + 0.5 * Math.sin(i * 7.3);
    semillas.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).add(new THREE.Vector3(R.azar() - 0.5, R.azar() - 0.5, R.azar() - 0.5).multiplyScalar(0.28)).normalize());
  }
  const W = 0.085; // medio ancho de la nervadura (en la esfera unidad)
  const g = new THREE.SphereGeometry(1, 400, 300);
  const pos = g.attributes.position, nV = pos.count;
  const celda = new Float32Array(nV * 2);
  const P = new THREE.Vector3(), Q = new THREE.Vector3();
  for (let k = 0; k < nV; k++) {
    P.fromBufferAttribute(pos, k);
    let d1 = 9, d2 = 9, i1 = 0, i2 = 0;
    for (let i = 0; i < nS; i++) {
      const d = P.distanceToSquared(semillas[i]);
      if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i; } else if (d < d2) { d2 = d; i2 = i; }
    }
    const sep = semillas[i1].distanceTo(semillas[i2]) || 1;
    const e = (d2 - d1) / (2 * sep); // distancia al borde de la celda
    // la nervadura serpentea un poco
    const e2 = e + 0.018 * R.n3(P.x * 6, P.y * 6, P.z * 6);
    const x = THREE.MathUtils.smoothstep(e2, W * 0.85, W + 0.36);
    const cojin = 1 - Math.pow(1 - x, 1.8);                       // placa abultada
    const nerv = 0.05 * Math.pow(Math.max(0, 1 - Math.pow(e2 / (W * 1.2), 2)), 1.5); // nervadura redondeada
    const tam = 0.85 + 0.3 * ((i1 * 0.618) % 1);                  // cada placa con su propia altura
    const surco = -0.016 * Math.exp(-Math.pow((e2 - W * 1.1) / 0.045, 2));
    const r = 1 + 0.115 * cojin * tam + nerv + surco + 0.008 * R.fbm(P.x * 3, P.y * 3, P.z * 3, 3) * cojin;
    const v = Math.acos(THREE.MathUtils.clamp(-P.y, -1, 1)) / Math.PI;
    puntoHuevo(Math.atan2(P.z, P.x), v, r, Q);
    pos.setXYZ(k, Q.x, Q.y, Q.z);
    celda[k * 2] = e2; // distancia al borde; el corte placa/nervadura se hace por píxel
    celda[k * 2 + 1] = x;                                               // 0 borde · 1 centro de la placa
  }
  g.setAttribute('aCelda', new THREE.BufferAttribute(celda, 2));
  g.computeVertexNormals();
  await cuadro();

  const mCascara = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.4, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, emissive: 0xffffff,
  }), {
    clave: 'cascara2', fuerza: 0.0,
    vertexDecl: '\nattribute vec2 aCelda; varying vec2 vCelda;',
    vertex: '\nvCelda = aCelda;',
    fragDecl: 'varying vec2 vCelda; float tl_placa(){ float w = fwidth(vCelda.x); return smoothstep(' + (W*0.92).toFixed(4) + ' - w, ' + (W*1.08).toFixed(4) + ' + w, vCelda.x); }',
    relieve: 'h = 0.5*tl_fbm(q*3.5);',
    tinte: `
      float placa = tl_placa();
      float mota = 0.5 + 0.5*tl_fbm(q*2.2 + 2.0);
      vec3 musgo = mix(vec3(0.07, 0.16, 0.018), vec3(0.13, 0.27, 0.03), mota);
      musgo = mix(musgo, vec3(0.24, 0.42, 0.05), smoothstep(0.5, 1.0, vCelda.y) * 0.5);
      musgo *= 0.55 + 0.45*smoothstep(0.0, 0.45, vCelda.y);
      float vet = 0.5 + 0.5*tl_snoise(q*vec3(2.0, 8.0, 2.0));
      vec3 bronce = mix(vec3(0.22, 0.09, 0.025), vec3(0.48, 0.24, 0.06), vet);
      diffuseColor.rgb = mix(bronce, musgo, placa);`,
    material: `
      roughnessFactor = mix(0.22, 0.34 - 0.08*vCelda.y, tl_placa());
      metalnessFactor = mix(0.45, 0.0, tl_placa());`,
    brillo: `
      float centro = smoothstep(0.25, 1.0, vCelda.y) * tl_placa();
      totalEmissiveRadiance = vec3(0.72, 0.96, 0.18) * centro * (0.035 + 0.06*uPulso) * (0.7 + 0.6*tl_fbm(q*2.5 + uT*0.05));`,
  });
  const cascara = new THREE.Mesh(g, mCascara);
  cascara.name = 'Cáscara'; cascara.castShadow = true; cascara.receiveShadow = true;
  const pivHuevo = new THREE.Group(); pivHuevo.position.set(0, 0.08, 0);
  cascara.position.y = -0.08;
  pivHuevo.add(cascara); grupo.add(pivHuevo);

  /* ---------------- Membrana de la base ---------------- */
  progreso('Membrana');
  const nT = 260, nSg = 90;
  const mp = [], muv = [], midx = [];
  const vArriba = 0.36;
  for (let j = 0; j <= nSg; j++) {
    const s = j / nSg;
    for (let i = 0; i <= nT; i++) {
      const th = (i / nT) * Math.PI * 2;
      const top = puntoHuevo(th, vArriba + 0.03 * Math.sin(th * 3 + 1) + 0.02 * R.n3(th, 0, 1), 1.075);
      const pliegue = 0.07 * Math.sin(th * 6 + 0.8 * Math.sin(th * 2)) + 0.05 * R.n3(Math.cos(th) * 2, Math.sin(th) * 2, 3);
      const rBase = 1.02 + pliegue + 0.04 * Math.sin(th * 11);
      const sc = Math.pow(s, 1.2);
      const rTop = Math.hypot(top.x, top.z);
      // cae pegada al huevo y se abre al final, como tela mojada
      let rr = THREE.MathUtils.lerp(rTop, rBase, THREE.MathUtils.smoothstep(s, 0.15, 1) ** 1.6);
      rr += 0.035 * Math.sin(s * 22 + th * 2) * s * (1 - s) * 2; // arrugas horizontales
      rr += pliegue * 0.35 * sc;
      let y = THREE.MathUtils.lerp(top.y, 0.03, sc);
      y += 0.05 * Math.sin(Math.PI * s) * (0.5 + 0.5 * Math.sin(th * 6 + 0.8 * Math.sin(th * 2)));
      // labio superior enrollado
      if (s < 0.06) rr += 0.03 * (1 - s / 0.06);
      mp.push(Math.cos(th) * rr, y, Math.sin(th) * rr);
      muv.push(i / nT, s);
    }
  }
  for (let j = 0; j < nSg; j++) for (let i = 0; i < nT; i++) {
    const a = j * (nT + 1) + i, b = a + nT + 1;
    midx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const gM = new THREE.BufferGeometry();
  gM.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
  gM.setAttribute('uv', new THREE.Float32BufferAttribute(muv, 2));
  gM.setIndex(midx); gM.computeVertexNormals();
  const mMembrana = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.45, clearcoat: 0.9, clearcoatRoughness: 0.18, side: THREE.DoubleSide,
    sheen: 0.0, sheenColor: new THREE.Color(PALETA.biomasa), emissive: 0xffffff,
  }), {
    clave: 'membrana', fuerza: 0.0,
    relieve: 'h = 0.6*tl_fbm(q*vec3(3.0, 6.0, 3.0));',
    tinte: `
      float m = 0.5 + 0.5*tl_fbm(q*2.5);
      diffuseColor.rgb = mix(vec3(0.018, 0.006, 0.008), vec3(0.06, 0.018, 0.02), m);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.02, 0.08), smoothstep(0.7, 1.0, vUv2.y) * 0.6);`,
    brillo: 'totalEmissiveRadiance = vec3(0.0);',
  });
  const membrana = new THREE.Mesh(gM, mMembrana);
  membrana.name = 'Membrana'; membrana.castShadow = true; membrana.receiveShadow = true;
  grupo.add(membrana);
  await cuadro();

  /* ---------------- Púas ---------------- */
  progreso('Púas');
  const mPua = organizar(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: 0xffffff }), {
    clave: 'pua', fuerza: 0.0,
    relieve: 'h = 0.3*tl_fbm(q*8.0) + 0.2*sin(vUv2.x*40.0);',
    tinte: 'diffuseColor.rgb = mix(vec3(0.06, 0.025, 0.03), vec3(0.30, 0.22, 0.17), smoothstep(0.1, 0.9, vUv2.x));',
    brillo: 'totalEmissiveRadiance = vec3(0.0);',
  });
  const puas = new THREE.Group(); puas.name = 'Púas';
  [0.5, 2.05, 3.55, 5.1].forEach((a, i) => {
    const base = new THREE.Vector3(Math.cos(a) * 0.86, 0.2, Math.sin(a) * 0.86);
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const lado = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(i % 2 ? 0.08 : -0.08);
    const largo = 0.42 + 0.08 * Math.sin(i * 2.1);
    const curva = new THREE.QuadraticBezierCurve3(
      base,
      base.clone().addScaledVector(out, largo * 0.6).add(new THREE.Vector3(0, 0.02, 0)),
      base.clone().addScaledVector(out, largo).add(lado).add(new THREE.Vector3(0, 0.17, 0)),
    );
    const gp = tuboAfinado(curva, { tramos: 50, lados: 16, radio: (t) => 0.095 * Math.pow(1 - t, 1.1) + 0.002 });
    const m = new THREE.Mesh(gp, mPua); m.castShadow = true; puas.add(m);
  });
  grupo.add(puas);

  /* ---------------- Disco de biomasa ---------------- */
  progreso('Biomasa');
  const suelo = (x, z) => 0.07 * Math.exp(-(x * x + z * z) / 1.6) + 0.03 * R.fbm(x * 1.2, 0, z * 1.2, 4) - 0.03;
  const anillos = 120, lados = 200, sp = [], sc = [], si = [], su = [];
  const cerca = new THREE.Color(0x3c1a4c), azul = new THREE.Color(0x231a46), lejos = new THREE.Color(PALETA.fondo);
  for (let a = 0; a <= anillos; a++) {
    const rr = Math.pow(a / anillos, 1.4) * 4.4;
    for (let l = 0; l <= lados; l++) {
      const ang = (l / lados) * Math.PI * 2;
      const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
      sp.push(x, suelo(x, z), z); su.push(x, z);
      const c = cerca.clone().lerp(azul, THREE.MathUtils.clamp(0.5 + 1.8 * R.fbm(x * 0.9, 7, z * 0.9, 3), 0, 1));
      c.lerp(lejos, THREE.MathUtils.smoothstep(rr, 1.4, 3.4));
      sc.push(c.r, c.g, c.b);
    }
  }
  for (let a = 0; a < anillos; a++) for (let l = 0; l < lados; l++) {
    const i0 = a * (lados + 1) + l, i1 = i0 + lados + 1;
    si.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1);
  }
  const gS = new THREE.BufferGeometry();
  gS.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  gS.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  gS.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
  gS.setIndex(si); gS.computeVertexNormals();
  const mSuelo = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, emissive: 0xffffff,
  }), {
    clave: 'suelo2', fuerza: 0.0,
    relieve: 'h = 0.6*tl_fbm(q*3.0) + 0.2*tl_fbm(q*9.0);',
    tinte: `diffuseColor.rgb *= (0.75 + 0.45*h) * smoothstep(3.6, 0.9, length(q.xz));
            float veta = smoothstep(0.92, 0.99, 1.0 - abs(tl_snoise(q*1.6 + 3.0)));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.12, 0.42), veta * 0.35 * smoothstep(3.2, 1.0, length(q.xz)));`,
    brillo: 'totalEmissiveRadiance = vec3(0.0);',
  });
  const disco = new THREE.Mesh(gS, mSuelo);
  disco.name = 'Biomasa'; disco.receiveShadow = true;
  grupo.add(disco);

  

  const materiales = [mCascara, mMembrana, mPua, mSuelo];

  function actualizar(t, dt, { respirar = true } = {}) {
    const b = respirar ? 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 3.6) : 0.35;
    for (const m of materiales) { const u = m.userData.uniforms; u.uT.value = t; u.uPulso.value = b; }
    pivHuevo.scale.set(1 + 0.012 * b, 1 + 0.02 * b, 1 + 0.012 * b);
  }

  let tris = 0;
  grupo.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });

  return { grupo, actualizar, tris, objetivo: new THREE.Vector3(0, 0.85, 0) };
}
