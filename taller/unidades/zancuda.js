// Unidad 02 · Zancuda nodriza
// Arácnida de rodilla alta: caparazón de quitina en tejas con cresta de púas, dos guadañas
// levantadas y un abdomen colgante que carga racimos de sacos verdes luminosos.
import * as THREE from 'three';
import { crearRuido, organizar, tuboAfinado, PALETA, cuadro } from '../organico.js';

export const ficha = {
  id: 'zancuda',
  numero: '02',
  nombre: 'Zancuda nodriza',
  estado: 'Propuesta para revisar',
  partes: [
    ['Caparazón', 'Bandas de quitina color hueso y bronce, superpuestas como tejas, con una cresta de púas curvas por el lomo.'],
    ['Patas', 'Seis zancos de rodilla alta con espolones y articulaciones de carne violeta; se levantan y vuelven a apoyar de una en una.'],
    ['Guadañas', 'Dos brazos delanteros alzados, dentados por dentro, que terminan en garras largas y se mecen al acecho.'],
    ['Vientre', 'Abdomen colgante de carne violeta que carga tres hileras de sacos verdes luminosos, sujetos por tiras de carne.'],
  ],
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const EJE_X = V(1, 0, 0), ARRIBA = V(0, 1, 0);
const S = THREE.MathUtils.smoothstep;
const ALTO = 1.08; // altura del cuerpo en reposo

const COL = {
  hueso: new THREE.Color(0xd8a95e), bronce: new THREE.Color(0x7c4816), oscuro: new THREE.Color(0x22140a),
  punta: new THREE.Color(0xf2e6c8), cobre: new THREE.Color(0xb8722c),
};

/* Elipsoide: c centro, r semiejes, inclina giro sobre X. s∈[-1,1] a lo largo (s=1 adelante), phi desde el lomo. */
function puntoElip(E, s, phi, k = 1, out = V()) {
  const an = Math.sqrt(Math.max(0, 1 - s * s));
  out.set(E.r.x * an * Math.sin(phi) * k, E.r.y * an * Math.cos(phi) * k, E.r.z * s * k);
  return out.applyAxisAngle(EJE_X, E.inclina).add(E.c);
}

/** Añade colores por vértice a un tubo a partir de su uv (t a lo largo, u alrededor). */
function colorear(g, fn) {
  const uv = g.attributes.uv, n = uv.count, col = new Float32Array(n * 3), c = new THREE.Color();
  for (let k = 0; k < n; k++) { fn(uv.getX(k), uv.getY(k), c); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Lámina gruesa: capa exterior, interior y cantos en los cuatro bordes. S(u,t,capa) da el punto. */
function lamina(Sup, colorEn, nu, nv) {
  const pos = [], col = [], uv = [], idx = [];
  const add = (P, c, a, b) => { pos.push(P.x, P.y, P.z); col.push(c.r, c.g, c.b); uv.push(a, b); };
  for (const capa of [0, 1]) {
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let k = 0; k <= nu; k++) {
      const u = (k / nu) * 2 - 1, t = j / nv;
      add(Sup(u, t, capa), colorEn(u, t, capa), t, (u + 1) / 2 + capa * 2);
    }
    for (let j = 0; j < nv; j++) for (let k = 0; k < nu; k++) {
      const a = base + j * (nu + 1) + k, b = a + nu + 1;
      if (capa === 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const canto = (pts) => {
    const base = pos.length / 3;
    for (const [u, t] of pts) { const c = colorEn(u, t, 2); add(Sup(u, t, 0), c, t, 5); add(Sup(u, t, 1), c, t, 5); }
    for (let m = 0; m < pts.length - 1; m++) { const a = base + m * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const izq = [], der = [], fre = [], tra = [];
  for (let j = 0; j <= nv; j++) { izq.push([-1, j / nv]); der.push([1, j / nv]); }
  for (let k = 0; k <= nu; k++) { fre.push([(k / nu) * 2 - 1, 0]); tra.push([(k / nu) * 2 - 1, 1]); }
  canto(izq); canto(der.reverse()); canto(fre.reverse()); canto(tra);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* Orientación: local +Y hacia B, local +Z hacia el lado del polo. */
const _bx = V(), _by = V(), _bz = V(), _m4 = new THREE.Matrix4();
function orientar(o, A, B, polo) {
  _by.subVectors(B, A).normalize();
  _bx.crossVectors(_by, polo).normalize();
  _bz.crossVectors(_bx, _by);
  o.matrix.makeBasis(_bx, _by, _bz).setPosition(A);
  o.matrixWorldNeedsUpdate = true;
}
/* Coloca una pieza que crece en +Y y se curva hacia -Z: dir = hacia dónde apunta, atras = hacia dónde se dobla. */
function colocar(o, base, dir, atras) {
  _by.copy(dir).normalize();
  _bz.copy(atras).addScaledVector(_by, -atras.dot(_by)).normalize().negate();
  _bx.crossVectors(_by, _bz);
  o.quaternion.setFromRotationMatrix(_m4.makeBasis(_bx, _by, _bz));
  o.position.copy(base);
  return o;
}

/* IK de dos huesos: rodilla B a partir de A, C y un polo. */
const _d = V(), _p = V();
function ik(A, C, L1, L2, polo, B) {
  _d.subVectors(C, A);
  let d = _d.length(); _d.divideScalar(d);
  d = THREE.MathUtils.clamp(d, Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  _p.copy(polo).addScaledVector(_d, -polo.dot(_d)).normalize();
  return B.copy(A).addScaledVector(_d, L1 * cosA).addScaledVector(_p, L1 * sinA);
}

export async function construir({ progreso = () => {} } = {}) {
  const R = crearRuido(23);
  const suelo = (x, z) => 0.05 * Math.exp(-(x * x + z * z) / 2.5) + 0.05 * R.fbm(x * 0.9, 0, z * 0.9, 4) + 0.02 * R.fbm(x * 4, 3, z * 4, 2);
  const grupo = new THREE.Group();
  grupo.name = 'Zancuda nodriza';
  grupo.rotation.y = 0.55;
  grupo.scale.setScalar(0.86);

  /* ---------------- Materiales ---------------- */
  const mQuitina = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.05, clearcoat: 0.75, clearcoatRoughness: 0.2,
    sheen: 0.15, sheenColor: new THREE.Color(0xffc070), sheenRoughness: 0.5, emissive: 0xffffff, side: THREE.DoubleSide,
  }), {
    clave: 'quitina', fuerza: 0.035,
    relieve: 'h = 0.5*tl_fbm(q*4.5) + 0.12*tl_snoise(q*16.0) - 0.25*smoothstep(0.1,0.02,tl_celdas(q*14.0));',
    tinte: 'diffuseColor.rgb *= 0.9 + 0.2*h;',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 3.0);
             totalEmissiveRadiance = vec3(0.77,0.29,1.0) * fres * 0.03;`,
  });
  const mCarne = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x4c1a5a, roughness: 0.42, clearcoat: 0.9, clearcoatRoughness: 0.12,
    sheen: 0.45, sheenColor: new THREE.Color(PALETA.secundario), sheenRoughness: 0.45, emissive: 0xffffff,
  }), {
    clave: 'carne', fuerza: 0.06,
    relieve: 'h = 0.5*tl_fbm(q*6.0) + 0.35*smoothstep(0.5,0.0,tl_celdas(q*13.0)) + 0.2*sin(q.z*38.0 + tl_snoise(q*4.0)*3.0);',
    tinte: 'diffuseColor.rgb *= 0.6 + 0.6*h;',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 2.5);
             totalEmissiveRadiance = vec3(0.57,0.16,0.91) * fres * 0.22 * (0.7 + 0.3*uPulso);`,
  });
  const mSaco = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x0e1406, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.06, emissive: 0xffffff,
  }), {
    clave: 'saco2', fuerza: 0.06,
    relieve: 'h = 0.5*tl_fbm(q*5.0);',
    brillo: `
      vec3 vv = normalize(vViewPosition);
      float fres = pow(1.0 - abs(dot(normal, vv)), 2.0);
      float vena = 1.0 - abs(tl_snoise(q*3.2 + vec3(0.0, uT*0.04, 0.0)));
      float venas = smoothstep(0.9, 0.985, vena);
      float motas = smoothstep(0.42, 0.12, tl_celdas(q*4.5 + 1.3));
      float sombra = smoothstep(0.1, 0.6, tl_snoise(q*1.4 + vec3(uT*0.1, 0.0, uT*0.06)));
      vec3 col = mix(vec3(0.20,0.55,0.08), vec3(0.722,0.961,0.176), (1.0 - fres)*0.85 + motas*0.3);
      float e = (0.5 + 0.8*(1.0 - fres)) * (0.7 + 0.5*uPulso) * (1.0 - 0.6*sombra) * (1.0 - 0.85*venas) * (0.5 + 0.8*motas);
      totalEmissiveRadiance = col * e * 0.66 + vec3(0.57,0.16,0.91) * fres * 0.3;
    `,
  });
  const mOjo = new THREE.MeshStandardMaterial({ color: 0x0a1004, emissive: new THREE.Color(PALETA.acido), emissiveIntensity: 1.6, roughness: 0.15 });

  /* ---------------- Piezas reutilizables ---------------- */
  function pua(largo, radio, curva, lados = 10) {
    const pts = [];
    for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(V(0, largo * t - radio * 0.9 * (1 - t), -curva * largo * t * t)); }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 26, lados, radio: (t) => radio * Math.pow(1 - t, 1.15) + 0.0015 });
    return colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.bronce, S(t, 0, 0.25)).lerp(COL.hueso, S(t, 0.3, 0.7)).lerp(COL.punta, S(t, 0.78, 1)));
  }
  // Hueso de pata: tubo con bulbo cerca de la base, cuello en la punta y anillos de crecimiento
  function hueso(L, r0, r1, comba, semilla) {
    const pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(V(0.01 * Math.sin(t * 5 + semilla), L * t, comba * Math.sin(Math.PI * t))); }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), {
      tramos: 56, lados: 13, ruido: R, rugosidad: 0.05,
      radio: (t) => {
        const base = r0 + (r1 - r0) * t;
        const bulbo = 0.32 * Math.exp(-Math.pow((t - 0.17) / 0.12, 2));
        const surcos = -0.07 * Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 9), 8) * (1 - S(t, 0.75, 0.95));
        const cuello = -0.28 * Math.exp(-Math.pow((t - 0.965) / 0.035, 2));
        return base * (1 + bulbo + surcos + cuello);
      },
    });
    return colorear(g, (t, u, c) => {
      const lado = 0.5 + 0.5 * Math.cos(u * Math.PI * 2 - Math.PI / 2); // más claro del lado del polo
      c.copy(COL.bronce).lerp(COL.hueso, 0.35 + 0.55 * lado * S(t, 0.05, 0.3) * (1 - S(t, 0.82, 0.98)));
      const anillo = Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 9), 10) * (1 - S(t, 0.75, 0.95));
      c.lerp(COL.oscuro, Math.max(1 - S(t, 0.0, 0.07), S(t, 0.92, 1.0)) * 0.7 + anillo * 0.45);
      c.multiplyScalar(0.95 + 0.1 * R.n3(t * 3, u * 2, semilla));
    });
  }
  // Garra: se curva hacia +Z y vuelve al eje en la punta
  function garra(L, r0, curva, semilla) {
    const pts = [];
    for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push(V(0, L * t, curva * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.3 * t))); }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 12, radio: (t) => r0 * (1 + 0.25 * Math.exp(-Math.pow((t - 0.1) / 0.1, 2))) * Math.pow(1 - t, 0.9) + 0.0015 });
    return colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.cobre, S(t, 0.0, 0.15)).lerp(COL.hueso, S(t, 0.25, 0.65)).lerp(COL.punta, S(t, 0.8, 1)).multiplyScalar(0.92 + 0.15 * R.n3(t * 5, u * 4, semilla)));
  }
  const gJunta = new THREE.SphereGeometry(1, 28, 20);
  const mJunta = new THREE.MeshPhysicalMaterial({
    color: 0x4c1a5a, roughness: 0.4, clearcoat: 0.9, clearcoatRoughness: 0.15,
    sheen: 0.5, sheenColor: new THREE.Color(PALETA.secundario), sheenRoughness: 0.4,
  });
  const junta = (r) => { const m = new THREE.Mesh(gJunta, mJunta); m.scale.set(r, r * 0.9, r); m.castShadow = true; return m; };

  /* Banda de caparazón sobre un elipsoide (teja: el borde trasero se levanta) */
  function banda(E, sA, sB, fm, i, { alza = 0.07, grosor = 0.035, nu = 34, nv = 26 } = {}) {
    const Sup = (u, t, capa) => {
      const s = sA + (sB - sA) * t;
      const borde = Math.pow(Math.abs(u), 6);
      const fb = (t * 6 + 0.4 * R.n3(i * 2.3, u * 2, t)) % 1;
      const lineas = 0.01 * S(fb, 0, 0.15) * (1 - fb);
      const quilla = 0.03 * Math.exp(-u * u * 16);
      let k = 1.035 + alza * t * t + quilla + lineas - 0.025 * borde + 0.012 * R.fbm(u * 3 + i, t * 3, i, 2);
      if (capa === 1) k -= grosor * (1 - 0.6 * borde) + 0.004;
      return puntoElip(E, s, u * fm * (1 - 0.06 * t), k);
    };
    const colorEn = (u, t, capa) => {
      const c = COL.hueso.clone().lerp(COL.bronce, S(Math.abs(u), 0.25, 0.9) * 0.85);
      c.lerp(COL.cobre, 0.2 * (0.5 + 0.5 * R.n3(u * 1.5, t * 2, i)));
      const fb = (t * 6 + 0.4 * R.n3(i * 2.3, u * 2, t)) % 1;
      c.lerp(COL.oscuro, (1 - S(fb, 0, 0.12)) * 0.45 + S(t, 0.88, 1) * 0.35 + Math.pow(Math.abs(u), 8) * 0.4);
      if (capa === 1) c.multiplyScalar(0.35);
      if (capa === 2) c.lerp(COL.oscuro, 0.5);
      return c;
    };
    const m = new THREE.Mesh(lamina(Sup, colorEn, nu, nv), mQuitina);
    m.castShadow = true; m.receiveShadow = true;
    return { m, Sup };
  }
  function elipsoide(E, k, mat, semilla) {
    const g = new THREE.SphereGeometry(1, 96, 72);
    const p = g.attributes.position, P = V();
    for (let n = 0; n < p.count; n++) {
      P.fromBufferAttribute(p, n);
      const d = k * (1 + 0.04 * R.fbm(P.x * 2 + semilla, P.y * 2, P.z * 2, 3));
      P.set(P.x * E.r.x * d, P.y * E.r.y * d, P.z * E.r.z * d).applyAxisAngle(EJE_X, E.inclina).add(E.c);
      p.setXYZ(n, P.x, P.y, P.z);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // púa del lomo sobre una banda
  function crestaEn(destino, E, Sup, u, t, largo, radio, lateral = 0) {
    const base = Sup(u, t, 0);
    const fuera = base.clone().sub(E.c).normalize();
    const dir = fuera.clone().multiplyScalar(1 + Math.abs(lateral)).add(ARRIBA.clone().multiplyScalar(lateral ? 0.3 : 1)).normalize();
    const m = new THREE.Mesh(pua(largo, radio, 0.45), mQuitina);
    colocar(m, base, dir, V(0, 0, -1));
    m.castShadow = true;
    destino.add(m);
  }

  /* ---------------- Cuerpo ---------------- */
  progreso('Caparazón');
  const cuerpo = new THREE.Group(); cuerpo.name = 'Cuerpo';
  cuerpo.position.y = ALTO;
  grupo.add(cuerpo);

  const E_ce = { c: V(0, 0, 0.2), r: V(0.4, 0.3, 0.52), inclina: 0.1 };
  const E_ca = { c: V(0, -0.05, 0.8), r: V(0.25, 0.2, 0.25), inclina: 0.25 };
  const E_ab = { c: V(0, -0.2, -1.02), r: V(0.62, 0.52, 0.84), inclina: -0.3 };

  cuerpo.add(elipsoide(E_ce, 0.98, mCarne, 1));
  cuerpo.add(elipsoide(E_ca, 0.97, mCarne, 2));
  // bandas del tórax
  [[0.95, 0.3, 0.16], [0.42, -0.25, 0.2], [-0.12, -0.92, 0.22]].forEach(([a, b, lp], i) => {
    const { m, Sup } = banda(E_ce, a, b, 1.55, i, { alza: 0.08 });
    cuerpo.add(m);
    crestaEn(cuerpo, E_ce, Sup, 0, 0.62, lp, 0.045);
  });
  // casco de la cabeza
  {
    const { m, Sup } = banda(E_ca, 0.5, -0.9, 1.35, 9, { alza: 0.05, grosor: 0.03 });
    cuerpo.add(m);
    crestaEn(cuerpo, E_ca, Sup, -0.55, 0.35, 0.1, 0.025, -0.6);
    crestaEn(cuerpo, E_ca, Sup, 0.55, 0.35, 0.1, 0.025, 0.6);
  }
  // ojos: dos pares al frente de la cabeza
  [[0.78, 0.28, 0.036], [0.68, 0.62, 0.028], [0.86, 0.12, 0.02]].forEach(([s, ph, r]) => {
    for (const lado of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mOjo);
      o.position.copy(puntoElip(E_ca, s, ph * lado, 0.99));
      cuerpo.add(o);
    }
  });
  await cuadro();

  // quelíceros: dos ganchos que se abren y cierran
  const quel = [];
  for (const lado of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.copy(puntoElip(E_ca, 0.85, Math.PI * 0.62 * lado, 0.95));
    const pts = [V(0, 0, 0), V(lado * 0.03, -0.07, 0.1), V(lado * 0.0, -0.17, 0.17), V(-lado * 0.05, -0.26, 0.13), V(-lado * 0.07, -0.3, 0.07)];
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 12, radio: (t) => 0.042 * Math.pow(1 - t, 0.8) + 0.002 });
    colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.bronce, S(t, 0, 0.3)).lerp(COL.punta, S(t, 0.7, 1)));
    const m = new THREE.Mesh(g, mQuitina); m.castShadow = true;
    piv.add(m); cuerpo.add(piv);
    quel.push({ piv, lado });
  }

  /* ---------------- Abdomen ---------------- */
  progreso('Vientre');
  const pivAb = new THREE.Group(); pivAb.position.set(0, -0.03, -0.28);
  const abd = new THREE.Group(); abd.position.set(0, 0.03, 0.28); pivAb.add(abd);
  cuerpo.add(pivAb);
  abd.add(elipsoide(E_ab, 0.98, mCarne, 3));
  // anillo de carne en la cintura
  { const m = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.07, 16, 40), mCarne); m.position.set(0, -0.05, -0.27); m.castShadow = true; cuerpo.add(m); }
  const bandasAb = [[0.97, 0.6], [0.66, 0.3], [0.36, 0.0], [0.06, -0.3], [-0.24, -0.6], [-0.54, -0.98]];
  const crestas = [0.3, 0.33, 0.3, 0.25, 0.19, 0.12];
  for (let i = 0; i < bandasAb.length; i++) {
    const [a, b] = bandasAb[i];
    const { m, Sup } = banda(E_ab, a, b, 1.72 - 0.05 * i, 20 + i, { alza: 0.09, grosor: 0.04, nu: 40, nv: 24 });
    abd.add(m);
    crestaEn(abd, E_ab, Sup, 0, 0.6, crestas[i], 0.055 - i * 0.004);
    if (i > 0 && i < 5) for (const u of [-0.78, 0.78]) crestaEn(abd, E_ab, Sup, u, 0.75, 0.12 + 0.02 * (i % 2), 0.028, u);
    await cuadro();
  }

  // sacos del vientre, en tres hileras
  const sacos = [];
  const filas = [[Math.PI, [0.58, 0.28, -0.02, -0.32, -0.6]], [Math.PI - 0.68, [0.44, 0.13, -0.17, -0.47]], [Math.PI + 0.68, [0.44, 0.13, -0.17, -0.47]]];
  filas.forEach(([ph, ss], f) => ss.forEach((s, n) => {
    const r = (0.17 - 0.04 * Math.abs(s + 0.05)) * (f ? 0.86 : 1) * (0.9 + 0.2 * (0.5 + 0.5 * Math.sin(n * 3.7 + f)));
    const g = new THREE.SphereGeometry(1, 48, 36);
    const p = g.attributes.position, P = V();
    for (let k = 0; k < p.count; k++) {
      P.fromBufferAttribute(p, k);
      const d = 1 + 0.08 * R.fbm(P.x * 2 + n + f * 5, P.y * 2, P.z * 2, 3);
      p.setXYZ(k, P.x * d, P.y * d * 0.85, P.z * d * 1.15);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mSaco);
    const c = puntoElip(E_ab, s + 0.03 * Math.sin(n + f), ph, 0.9);
    m.position.copy(c);
    const fuera = c.clone().sub(E_ab.c).normalize();
    m.quaternion.setFromUnitVectors(ARRIBA, fuera);
    m.scale.setScalar(r);
    m.castShadow = true;
    abd.add(m);
    sacos.push({ m, r, fase: n * 1.3 + f * 2.1 });
  }));
  // tiras de carne que sujetan las hileras
  for (const ph of [Math.PI - 0.34, Math.PI + 0.34, Math.PI - 1.02, Math.PI + 1.02]) {
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const s = 0.82 - 1.68 * (k / 14);
      pts.push(puntoElip(E_ab, s, ph + 0.05 * Math.sin(k * 1.7), 1.0 + 0.035 * Math.pow(Math.sin(k * 1.1), 2)));
    }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 120, lados: 10, ruido: R, rugosidad: 0.3, radio: (t) => 0.024 * (0.6 + 0.4 * Math.sin(Math.PI * t)) + 0.006 * Math.sin(t * 40) });
    const m = new THREE.Mesh(g, mCarne); m.castShadow = true; abd.add(m);
  }
  const luzVientre = new THREE.PointLight(PALETA.acido, 2.2, 3.5, 2);
  luzVientre.position.copy(puntoElip(E_ab, -0.05, Math.PI, 1.12));
  abd.add(luzVientre);
  await cuadro();

  /* ---------------- Guadañas ---------------- */
  progreso('Guadañas');
  const brazos = [];
  for (const lado of [-1, 1]) {
    const hombro = new THREE.Group();
    hombro.position.copy(puntoElip(E_ce, 0.88, Math.PI * 0.42 * lado, 0.95));
    hombro.rotation.y = 0.28 * lado;
    const alza = new THREE.Group(); alza.rotation.x = 0.15; alza.rotation.z = -0.3 * lado; hombro.add(alza);
    const s1 = new THREE.Mesh(hueso(0.82, 0.078, 0.062, -0.05, lado * 3), mQuitina); s1.castShadow = true; alza.add(s1);
    alza.add(junta(0.09));
    const codo = new THREE.Group(); codo.position.y = 0.82; codo.rotation.x = 1.35; alza.add(codo);
    codo.add(junta(0.085));
    const s2 = new THREE.Mesh(hueso(0.8, 0.072, 0.055, 0.05, lado * 5), mQuitina); s2.castShadow = true; codo.add(s2);
    // dientes por dentro (lado +Z)
    for (let k = 0; k < 6; k++) {
      const t = 0.22 + k * 0.12;
      const d = new THREE.Mesh(pua(0.09 + 0.03 * (k % 2), 0.018, 0.6, 8), mQuitina);
      colocar(d, V(0, 0.8 * t, 0.045 * (1 - t * 0.4) + 0.05 * Math.sin(Math.PI * t)), V(0, 0.55, 1), V(0, 1, 0));
      s2.add(d);
    }
    const muneca = new THREE.Group(); muneca.position.y = 0.8; muneca.rotation.x = 1.0; codo.add(muneca);
    muneca.add(junta(0.065));
    const g = new THREE.Mesh(garra(0.9, 0.065, 0.26, lado * 7), mQuitina); g.castShadow = true; muneca.add(g);
    cuerpo.add(hombro);
    brazos.push({ alza, codo, muneca, lado });
  }

  /* ---------------- Patas ---------------- */
  progreso('Patas');
  const L1 = 1.18, L2 = 1.32;
  const patas = [];
  const filasPata = [[0.46, 0.72, 0.9, 1.85], [0.24, 0.1, 0.14, 1.78], [0.0, -0.5, -0.76, 1.9]];
  const orden = [0, 4, 2, 3, 1, 5];
  let n = 0;
  for (const lado of [-1, 1]) for (const [z, ang, angPie, D] of filasPata) {
    const cadera = V(lado * 0.33, -0.08, z);
    const dirC = V(lado * Math.cos(ang), 0.3, Math.sin(ang));
    const finCoxa = cadera.clone().addScaledVector(dirC, 0.24);
    const Lc = finCoxa.distanceTo(cadera);
    const px = lado * 0.33 + lado * Math.cos(angPie) * D, pz = z + Math.sin(angPie) * D;
    const pie = V(px, suelo(px, pz), pz);
    const fuera = V(pie.x - cadera.x, 0, pie.z - cadera.z).normalize();
    const tobilloRel = V(-fuera.x * 0.1, 0.3, -fuera.z * 0.1);
    const Lt = tobilloRel.length();
    const semilla = n * 1.7 + 0.3;
    const mk = (g) => { const m = new THREE.Mesh(g, mQuitina); m.matrixAutoUpdate = false; m.castShadow = true; m.receiveShadow = true; grupo.add(m); return m; };
    const coxa = mk(hueso(Lc, 0.068, 0.062, 0.01, semilla));
    const femur = mk(hueso(L1, 0.05, 0.04, 0.06, semilla + 1));
    const tibia = mk(hueso(L2, 0.04, 0.026, -0.05, semilla + 2));
    const tarso = mk(garra(Lt, 0.028, 0.05, semilla + 3));
    // espinas del fémur y espolón de la rodilla
    for (const [t, l] of [[0.38, 0.09], [0.66, 0.11]]) {
      const e = new THREE.Mesh(pua(l, 0.02, 0.5, 8), mQuitina);
      colocar(e, V(0, L1 * t, 0.05 + 0.06 * Math.sin(Math.PI * t)), V(0, 0.45, 1), V(0, 1, 0));
      e.castShadow = true; femur.add(e);
    }
    { const e = new THREE.Mesh(pua(0.2, 0.032, 0.55, 10), mQuitina); colocar(e, V(0, 0.06, 0.03), V(0, -0.75, 0.6), V(0, -1, 0)); e.castShadow = true; tibia.add(e); }
    const juntas = [junta(0.07), junta(0.062), junta(0.054), junta(0.038)];
    juntas.forEach((j) => grupo.add(j));
    patas.push({ cadera, finCoxa, pie, fuera, tobilloRel, coxa, femur, tibia, tarso, juntas, turno: orden[n] });
    n++;
  }
  await cuadro();

  /* ---------------- Suelo de biomasa ---------------- */
  progreso('Biomasa');
  {
    const anillos = 120, lados = 200, pos = [], col = [], idx = [];
    const cerca = new THREE.Color(0x3a1538), lejos = new THREE.Color(PALETA.fondo), oscuro = new THREE.Color(0x1c0b22);
    for (let a = 0; a <= anillos; a++) {
      const rr = Math.pow(a / anillos, 1.4) * 4.8;
      for (let l = 0; l <= lados; l++) {
        const ang = (l / lados) * Math.PI * 2, x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
        pos.push(x, suelo(x, z), z);
        const c = cerca.clone().lerp(oscuro, THREE.MathUtils.clamp(0.5 - 2.5 * R.fbm(x * 1.3, 5, z * 1.3, 3), 0, 1) * 0.7);
        c.lerp(lejos, S(rr, 1.8, 4.2));
        col.push(c.r, c.g, c.b);
      }
    }
    for (let a = 0; a < anillos; a++) for (let l = 0; l < lados; l++) {
      const i0 = a * (lados + 1) + l, i1 = i0 + lados + 1;
      idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    var mSuelo = organizar(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.72, clearcoat: 0.3, clearcoatRoughness: 0.35, emissive: 0xffffff,
    }), {
      clave: 'suelo2', fuerza: 0.35,
      relieve: 'h = 0.6*tl_fbm(q*4.0) + 0.4*smoothstep(0.0,0.6,tl_celdas(q*9.0)); float ch = tl_fbm(q*1.1 + 9.0); h = mix(h, 0.2, smoothstep(0.32,0.38,ch));',
      tinte: `float charco = smoothstep(0.32, 0.38, tl_fbm(q*1.1 + 9.0)) * smoothstep(2.6, 1.0, length(q.xz));
              diffuseColor.rgb *= (0.7 + 0.5*h) * smoothstep(4.2, 1.2, length(q.xz));
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03,0.07,0.01), charco);`,
      brillo: `float charco2 = smoothstep(0.32, 0.38, tl_fbm(q*1.1 + 9.0)) * smoothstep(2.6, 1.0, length(q.xz));
               totalEmissiveRadiance = vec3(0.72,0.96,0.18) * charco2 * 0.14 * (0.6 + 0.4*sin(uT*1.3 + q.x*3.0 + q.z*2.0));`,
    });
    const m = new THREE.Mesh(g, mSuelo); m.name = 'Biomasa'; m.receiveShadow = true; grupo.add(m);
  }

  /* ---------------- Esporas que caen de los sacos y suben ---------------- */
  const nE = 70, eDat = [];
  const esporas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), nE);
  esporas.name = 'Esporas'; esporas.userData.noExportar = true;
  const verde = new THREE.Color(PALETA.acido).multiplyScalar(1.6), lila = new THREE.Color(PALETA.brillo).multiplyScalar(1.3);
  const ponerEspora = (k, inicio) => {
    const a = R.azar() * Math.PI * 2, rr = R.azar() * 1.6;
    eDat[k] = { x: Math.cos(a) * rr * 0.8, z: -0.9 + Math.sin(a) * rr, y: inicio ? R.azar() * 3.2 : 0.15, v: 0.04 + R.azar() * 0.1, s: 0.004 + R.azar() * 0.007 };
    esporas.setColorAt(k, R.azar() < 0.75 ? verde : lila);
  };
  for (let k = 0; k < nE; k++) ponerEspora(k, true);
  grupo.add(esporas);

  /* ---------------- Animación ---------------- */
  const materiales = [mQuitina, mCarne, mSaco, mSuelo];
  const M4 = new THREE.Matrix4();
  const H = V(), A = V(), B = V(), T = V(), P = V(), polo = V();
  const PERIODO = 7.2, PASO = 0.62;

  function actualizar(t, dt, { respirar = true } = {}) {
    const vivo = respirar ? 1 : 0;
    const b = respirar ? 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 3.2) : 0.35;
    for (const m of materiales) { const u = m.userData.uniforms; u.uT.value = t; u.uPulso.value = b; }

    // el cuerpo se mece sobre las patas
    cuerpo.position.set(0.03 * Math.sin(t * 0.53) * vivo, ALTO + 0.035 * (b - 0.35), 0.025 * Math.sin(t * 0.41 + 1) * vivo);
    cuerpo.rotation.set(0.025 * Math.sin(t * 0.7) * vivo, 0.05 * Math.sin(t * 0.29) * vivo, 0.02 * Math.sin(t * 0.61 + 2) * vivo);
    cuerpo.updateMatrix();
    pivAb.rotation.x = 0.04 * Math.sin(t * 0.9 + 0.5) * vivo;
    pivAb.rotation.z = 0.03 * Math.sin(t * 0.47) * vivo;
    abd.scale.set(1 + 0.018 * b, 1 + 0.024 * b, 1 + 0.012 * b);
    for (const s of sacos) {
      const p = respirar ? 0.5 + 0.5 * Math.sin(t * 2.1 + s.fase) : 0.4;
      s.m.scale.set(s.r * (1 + 0.06 * p), s.r * (1 + 0.09 * p), s.r * (1 + 0.06 * p));
    }
    luzVientre.intensity = 1.6 + 2.4 * b;

    // guadañas al acecho
    for (const br of brazos) {
      const f = t * 0.8 + (br.lado > 0 ? 0 : 1.4);
      br.alza.rotation.x = 0.15 + 0.08 * Math.sin(f) * vivo;
      br.codo.rotation.x = 1.35 + 0.12 * Math.sin(f - 0.6) * vivo;
      br.muneca.rotation.x = 1.0 + 0.15 * Math.sin(f - 1.1) * vivo;
    }
    for (const q of quel) q.piv.rotation.y = q.lado * (0.06 + 0.1 * Math.max(0, Math.sin(t * 2.6 + q.lado))) * vivo;

    // patas: cadera sigue al cuerpo, el pie queda en el suelo salvo cuando le toca dar un paso
    for (const pa of patas) {
      H.copy(pa.cadera).applyMatrix4(cuerpo.matrix);
      A.copy(pa.finCoxa).applyMatrix4(cuerpo.matrix);
      P.copy(pa.pie);
      if (respirar) {
        const w = ((((t / PERIODO) - pa.turno / 6) % 1 + 1) % 1) * PERIODO / PASO;
        if (w < 1) {
          const e = Math.sin(Math.PI * w);
          P.y += 0.2 * e;
          P.addScaledVector(pa.fuera, -0.12 * e);
        }
      }
      T.copy(P).add(pa.tobilloRel);
      polo.copy(ARRIBA).addScaledVector(pa.fuera, 0.35);
      ik(A, T, L1, L2, polo, B);
      orientar(pa.coxa, H, A, polo);
      orientar(pa.femur, A, B, polo);
      orientar(pa.tibia, B, T, polo);
      orientar(pa.tarso, T, P, pa.fuera);
      pa.juntas[0].position.copy(H); pa.juntas[1].position.copy(A); pa.juntas[2].position.copy(B); pa.juntas[3].position.copy(T);
    }

    for (let k = 0; k < nE; k++) {
      const e = eDat[k];
      e.y += e.v * dt; e.x += Math.sin(t * 0.7 + k) * 0.0015;
      if (e.y > 3.3) ponerEspora(k, false);
      const sc = e.s * Math.min(1, e.y * 2, (3.3 - e.y) * 2);
      M4.makeScale(sc, sc, sc).setPosition(e.x, e.y, e.z);
      esporas.setMatrixAt(k, M4);
    }
    esporas.instanceMatrix.needsUpdate = true;
    if (esporas.instanceColor) esporas.instanceColor.needsUpdate = true;
  }
  actualizar(0, 0, { respirar: false });

  let tris = 0;
  grupo.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });

  return { grupo, actualizar, tris, objetivo: V(0, 0.8, 0) };
}
