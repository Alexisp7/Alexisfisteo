// Unidad 01 · Huevo latente (v2)
// Óvalo de placas verdes abultadas unidas por nervaduras brillantes, envuelto abajo
// por una membrana oscura con púas cortas, sobre un disco de biomasa violeta.
import * as THREE from 'three';
import { crearRuido, organizar, tuboAfinado, PALETA, cuadro } from '../organico.js';

export const ficha = {
  id: 'huevo',
  numero: '01',
  nombre: 'Huevo latente',
  estado: 'Versión 3 · para revisar',
  partes: [
    ['Placas', 'Doce placas ovaladas verdes, lisas y abultadas, cada una de distinto tamaño; laten con una luz tenue desde dentro.'],
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

  /* ---------------- Cáscara: placas ovaladas sobre una red de nervaduras ---------------- */
  progreso('Placas');
  const nS = 12;
  const semillas = [];
  for (let i = 0; i < nS; i++) {
    const y = 1 - 2 * (i + 0.5) / nS;
    const r = Math.sqrt(1 - y * y), a = i * 2.39996;
    semillas.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  // relajación: que las placas se repartan parejo y luego desordenarlas un poco
  for (let it = 0; it < 40; it++) {
    const f = semillas.map(() => new THREE.Vector3());
    for (let i = 0; i < nS; i++) for (let j = 0; j < nS; j++) if (i !== j) {
      const d = semillas[i].clone().sub(semillas[j]); const l = d.length();
      f[i].addScaledVector(d, 1 / (l * l * l));
    }
    semillas.forEach((p, i) => p.addScaledVector(f[i], 0.004).normalize());
  }
  semillas.forEach((p) => p.add(new THREE.Vector3(R.azar() - 0.5, R.azar() - 0.5, R.azar() - 0.5).multiplyScalar(0.12)).normalize());
  // radio de cada placa: casi toca a su vecina más cercana; tamaños distintos
  const rho = semillas.map((p, i) => {
    let m = 9; semillas.forEach((q, j) => { if (i !== j) m = Math.min(m, p.distanceTo(q)); });
    return m * (0.475 + 0.035 * Math.sin(i * 3.7));
  });
  const g = new THREE.SphereGeometry(1, 512, 384);
  const pos = g.attributes.position, nV = pos.count;
  const celda = new Float32Array(nV * 2);
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), Pd = new THREE.Vector3();
  for (let k = 0; k < nV; k++) {
    P.fromBufferAttribute(pos, k);
    // el borde de cada placa ondula para que no sea un círculo perfecto
    Pd.set(P.x + 0.022 * R.n3(P.x * 2.5, P.y * 2.5, P.z * 2.5), P.y + 0.022 * R.n3(P.x * 2.5 + 9, P.y * 2.5, P.z * 2.5), P.z + 0.022 * R.n3(P.x * 2.5, P.y * 2.5 + 9, P.z * 2.5));
    let mejor = -9, cerca = 9, dA = 0, iA = 0;
    for (let i = 0; i < nS; i++) {
      const d = Pd.distanceTo(semillas[i]);
      const sd = rho[i] - d; // >0 dentro de la placa
      if (sd > mejor) { mejor = sd; dA = d; iA = i; }
      cerca = Math.min(cerca, Math.abs(sd));
    }
    const pill = Math.max(0, 1 - (dA / rho[iA]) ** 2);
    const cojin = Math.sin(Math.PI / 2 * THREE.MathUtils.smoothstep(pill, 0, 0.2)) * 0.35 + 0.65 * Math.pow(pill, 0.8);
    const tam = 0.85 + 0.3 * ((iA * 0.618) % 1);
    // nervadura: labio en relieve alrededor de cada placa + ondulación orgánica
    const labio = 0.03 * Math.exp(-(((mejor + 0.035) / 0.032) ** 2));
    const red = 0.018 * (0.5 + 0.5 * R.fbm(P.x * 4, P.y * 4, P.z * 4, 3));
    const r = 1 + 0.17 * cojin * tam + labio + red * (1 - cojin);
    const v = Math.acos(THREE.MathUtils.clamp(-P.y, -1, 1)) / Math.PI;
    puntoHuevo(Math.atan2(P.z, P.x), v, r, Q);
    pos.setXYZ(k, Q.x, Q.y, Q.z);
    celda[k * 2] = mejor;   // distancia firmada al borde de la placa (por píxel)
    celda[k * 2 + 1] = pill; // 0 borde · 1 centro
  }
  g.setAttribute('aCelda', new THREE.BufferAttribute(celda, 2));
  g.computeVertexNormals();
  await cuadro();

  const mCascara = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.4, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0xffffff,
  }), {
    clave: 'cascara3', fuerza: 0.0,
    vertexDecl: '\nattribute vec2 aCelda; varying vec2 vCelda;',
    vertex: '\nvCelda = aCelda;',
    fragDecl: 'varying vec2 vCelda; float tl_placa(){ float w = fwidth(vCelda.x) + 0.004; return smoothstep(-w, w, vCelda.x - 0.004); }',
    tinte: `
      float placa = tl_placa();
      // musgo: verde con manchas oscuras, vetas y centros más claros
      float n1 = tl_fbm(q*4.0 + 2.0);
      float n2 = tl_fbm(q*11.0 + 7.0);
      float manchas = smoothstep(0.08, 0.3, tl_celdas(q*9.0));
      vec3 musgo = mix(vec3(0.022, 0.065, 0.005), vec3(0.085, 0.24, 0.016), 0.5 + 0.6*n1);
      musgo = mix(musgo * 0.55, musgo, manchas);
      musgo = mix(musgo, vec3(0.22, 0.42, 0.04), smoothstep(0.35, 0.95, vCelda.y) * (0.35 + 0.3*n2));
      musgo *= 0.6 + 0.4*smoothstep(0.0, 0.35, vCelda.y);
      // nervadura: bronce con vetas que siguen la red
      float vet = 0.5 + 0.5*tl_snoise(q*vec3(3.0, 9.0, 3.0));
      vec3 bronce = mix(vec3(0.05, 0.02, 0.008), vec3(0.17, 0.075, 0.025), vet);
      bronce *= 0.85 + 0.3*n2;
      diffuseColor.rgb = mix(bronce, musgo, placa);`,
    material: `
      roughnessFactor = mix(0.28 + 0.12*tl_fbm(q*6.0), 0.36 - 0.12*vCelda.y + 0.1*tl_fbm(q*8.0), tl_placa());
      metalnessFactor = mix(0.35, 0.0, tl_placa());`,
    brillo: `
      totalEmissiveRadiance = vec3(0.72, 0.96, 0.18) * smoothstep(0.4, 1.0, vCelda.y) * tl_placa() * (0.01 + 0.025*uPulso);`,
  });
  const cascara = new THREE.Mesh(g, mCascara);
  cascara.name = 'Cáscara'; cascara.castShadow = true; cascara.receiveShadow = true;
  const pivHuevo = new THREE.Group(); pivHuevo.position.set(0, 0.08, 0);
  cascara.position.y = -0.08;
  pivHuevo.add(cascara); grupo.add(pivHuevo);

  /* ---------------- Membrana de la base ---------------- */
  progreso('Membrana');
  const nT = 300, nSg = 140;
  const mp = [], muv = [], midx = [];
  for (let j = 0; j <= nSg; j++) {
    const s = j / nSg;
    for (let i = 0; i <= nT; i++) {
      const th = (i / nT) * Math.PI * 2;
      // borde superior irregular: sube en lóbulos y cubre la fila de placas de abajo
      const vTop = 0.46 + 0.07 * Math.sin(th * 2 + 0.6) + 0.04 * Math.sin(th * 5 + 2) + 0.03 * R.n3(Math.cos(th) * 1.5, Math.sin(th) * 1.5, 1);
      const top = puntoHuevo(th, vTop, 1.15);
      const rTop = Math.hypot(top.x, top.z);
      const ondaBase = 0.06 * Math.sin(th * 5 + 0.7 * Math.sin(th * 2)) + 0.05 * R.n3(Math.cos(th) * 2, Math.sin(th) * 2, 3);
      const rBase = 1.08 + ondaBase;
      // perfil: baja ceñida al huevo y se abre cerca del suelo
      const abre = THREE.MathUtils.smoothstep(s, 0.35, 1.0) ** 1.4;
      let rr = THREE.MathUtils.lerp(rTop, rBase, abre);
      let y = THREE.MathUtils.lerp(top.y, 0.04, s ** 0.9);
      // pliegues horizontales apilados (anillos), más marcados abajo
      const anillo = Math.sin(s * Math.PI * 6.5 + 0.4 * Math.sin(th * 3));
      rr += 0.045 * anillo * (0.3 + 0.7 * s) * (1 - THREE.MathUtils.smoothstep(s, 0.92, 1));
      y += 0.012 * anillo;
      // labio de arriba engrosado y labio de abajo enrollado
      if (s < 0.05) rr += 0.03 * (1 - s / 0.05);
      if (s > 0.9) { const c = (s - 0.9) / 0.1; rr += 0.06 * Math.sin(c * Math.PI * 0.9); y += 0.04 * Math.sin(c * Math.PI) ; }
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
    color: 0xffffff, roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.2, side: THREE.DoubleSide,
    sheen: 0.0, sheenColor: new THREE.Color(PALETA.biomasa), emissive: 0xffffff,
  }), {
    clave: 'membrana', fuerza: 0.0,
    relieve: 'h = 0.6*tl_fbm(q*vec3(3.0, 6.0, 3.0));',
    tinte: `
      float m = 0.5 + 0.5*tl_fbm(q*2.5);
      float m2 = tl_fbm(q*9.0);
      diffuseColor.rgb = mix(vec3(0.02, 0.008, 0.009), vec3(0.075, 0.03, 0.03), m);
      diffuseColor.rgb *= 0.8 + 0.4*m2;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.02, 0.05), smoothstep(0.75, 1.0, vUv2.y) * 0.7);`,
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
    tinte: 'diffuseColor.rgb = mix(vec3(0.10, 0.05, 0.025), vec3(0.42, 0.30, 0.15), smoothstep(0.0, 0.8, vUv2.x)) * (0.8 + 0.4*tl_fbm(q*10.0));',
    brillo: 'totalEmissiveRadiance = vec3(0.0);',
  });
  const puas = new THREE.Group(); puas.name = 'Púas';
  [0.15, 1.75, 3.0, 4.45].forEach((a, i) => {
    const base = new THREE.Vector3(Math.cos(a) * 0.86, 0.3, Math.sin(a) * 0.86);
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const lado = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(i % 2 ? 0.08 : -0.08);
    const largo = 0.5 + 0.08 * Math.sin(i * 2.1);
    const curva = new THREE.QuadraticBezierCurve3(
      base,
      base.clone().addScaledVector(out, largo * 0.6).add(new THREE.Vector3(0, 0.02, 0)),
      base.clone().addScaledVector(out, largo).add(lado).add(new THREE.Vector3(0, 0.22, 0)),
    );
    const gp = tuboAfinado(curva, { tramos: 50, lados: 16, radio: (t) => 0.1 * Math.pow(1 - t, 1.2) + 0.002 });
    const m = new THREE.Mesh(gp, mPua); m.castShadow = true; puas.add(m);
  });
  grupo.add(puas);

  /* ---------------- Hebras de fluido que cuelgan de la membrana ---------------- */
  const mHebra = new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETA.acido).multiplyScalar(0.55), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const hebras = new THREE.Group(); hebras.name = 'Hebras'; hebras.userData.noExportar = true;
  [0.6, 2.6, 4.0, 5.4].forEach((a, i) => {
    for (let k = 0; k < 5; k++) {
      const aa = a + (k - 2) * 0.045;
      const r0 = 0.9 + 0.03 * Math.sin(k * 3 + i), y0 = 0.32 + 0.05 * Math.sin(k + i);
      const pts = [];
      for (let m = 0; m <= 6; m++) {
        const t = m / 6;
        const rr = r0 + 0.12 * t + 0.02 * Math.sin(t * 9 + k);
        pts.push(new THREE.Vector3(Math.cos(aa) * rr + 0.015 * Math.sin(t * 14 + k * 2), y0 * (1 - t) + 0.01, Math.sin(aa) * rr));
      }
      const gh = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 5, radio: (t) => 0.004 + 0.002 * Math.sin(t * 10) });
      hebras.add(new THREE.Mesh(gh, mHebra));
    }
  });
  grupo.add(hebras);

  /* ---------------- Disco de biomasa ---------------- */
  progreso('Biomasa');
  const suelo = (x, z) => 0.07 * Math.exp(-(x * x + z * z) / 1.6) + 0.03 * R.fbm(x * 1.2, 0, z * 1.2, 4) - 0.03;
  const anillos = 120, lados = 200, sp = [], sc = [], si = [], su = [];
  const cerca = new THREE.Color(0x3a2a6a), azul = new THREE.Color(0x4a2050), lejos = new THREE.Color(PALETA.fondo);
  for (let a = 0; a <= anillos; a++) {
    const rr = Math.pow(a / anillos, 1.4) * 3.0;
    for (let l = 0; l <= lados; l++) {
      const ang = (l / lados) * Math.PI * 2;
      const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
      sp.push(x, suelo(x, z), z); su.push(x, z);
      const c = cerca.clone().lerp(azul, THREE.MathUtils.clamp(0.5 + 1.8 * R.fbm(x * 0.9, 7, z * 0.9, 3), 0, 1));
      c.lerp(lejos, THREE.MathUtils.smoothstep(rr, 1.0, 2.6));
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
    color: 0xffffff, vertexColors: true, roughness: 0.85, clearcoat: 0.0, clearcoatRoughness: 0.4, emissive: 0xffffff,
  }), {
    clave: 'suelo2', fuerza: 0.0,
    relieve: 'h = 0.6*tl_fbm(q*3.0) + 0.2*tl_fbm(q*9.0);',
    tinte: `diffuseColor.rgb *= (0.75 + 0.45*h) * smoothstep(2.8, 0.8, length(q.xz));
            float veta = smoothstep(0.92, 0.99, 1.0 - abs(tl_snoise(q*1.6 + 3.0)));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30, 0.12, 0.42), veta * 0.0 * smoothstep(3.2, 1.0, length(q.xz)));`,
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
