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
    ['Caparazón', 'Placas gruesas de quitina color hueso y bronce, apiladas con el borde levantado hacia adelante; cada una lleva una púa cónica y deja ver la carne violeta entre ellas.'],
    ['Patas', 'Seis patas de huesos gruesos en forma de barril, con mangas de carne violeta en cada articulación, espolones y garras de hueso; se levantan y vuelven a apoyar de una en una.'],
    ['Guadañas', 'Dos brazos alzados que se arquean hacia afuera, dentados por dentro, terminan en garras largas y se mecen al acecho.'],
    ['Vientre', 'Abdomen redondo de carne violeta con placas color naranja por debajo; a los costados carga racimos de sacos verdes luminosos, sujetos por tiras de carne.'],
  ],
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const EJE_X = V(1, 0, 0), ARRIBA = V(0, 1, 0);
const S = THREE.MathUtils.smoothstep;
const ALTO = 1.05; // altura del cuerpo en reposo

const COL = {
  hueso: new THREE.Color(0xae9c5c), bronce: new THREE.Color(0x56401c), oscuro: new THREE.Color(0x1e140a),
  punta: new THREE.Color(0xf4ead0), naranja: new THREE.Color(0xc0742a), cobre: new THREE.Color(0xb8722c),
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
  grupo.scale.setScalar(1.0);
  const calida = new THREE.DirectionalLight(0xffe2b8, 1.1); calida.position.set(2.5, 5, 4.5); grupo.add(calida);

  /* ---------------- Materiales ---------------- */
  const mQuitina = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.36, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.14,
    sheen: 0.1, sheenColor: new THREE.Color(0xffe0a0), sheenRoughness: 0.5, emissive: 0xffffff, side: THREE.DoubleSide,
  }), {
    clave: 'quitina', fuerza: 0.025,
    relieve: 'h = 0.6*tl_fbm(q*6.0);',
    tinte: 'diffuseColor.rgb *= 0.9 + 0.2*h;',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 3.0);
             totalEmissiveRadiance = vec3(0.77,0.29,1.0) * fres * 0.03;`,
  });
  const mCarne = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x4c1a5a, roughness: 0.42, clearcoat: 0.9, clearcoatRoughness: 0.12,
    sheen: 0.45, sheenColor: new THREE.Color(PALETA.secundario), sheenRoughness: 0.45, emissive: 0xffffff,
  }), {
    clave: 'carne', fuerza: 0.03,
    relieve: 'h = 0.5*tl_fbm(q*6.0) + 0.2*sin(q.z*38.0 + tl_snoise(q*4.0)*3.0);',
    tinte: 'diffuseColor.rgb *= 0.6 + 0.6*h;',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 2.5);
             totalEmissiveRadiance = vec3(0.57,0.16,0.91) * fres * 0.22 * (0.7 + 0.3*uPulso);`,
  });
  const mSaco = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x061003, roughness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0xffffff,
  }), {
    clave: 'saco2', fuerza: 0.008,
    relieve: 'h = 0.5*tl_fbm(q*5.0);',
    brillo: `
      vec3 vv = normalize(vViewPosition);
      float ndv = abs(dot(normal, vv));
      float vena = 1.0 - abs(tl_snoise(q*2.2 + vec3(0.0, uT*0.04, 0.0)));
      float venas = smoothstep(0.965, 0.995, vena);
      float sombra = smoothstep(0.2, 0.7, tl_snoise(q*1.2 + vec3(uT*0.08, 0.0, uT*0.05)));
      vec3 col = mix(vec3(0.05,0.18,0.01), vec3(0.42,0.9,0.06), pow(ndv, 0.9));
      col = mix(col, vec3(0.7,1.0,0.3), pow(ndv, 8.0) * 0.35);
      float e = (0.25 + 0.95 * pow(ndv, 1.2)) * (0.75 + 0.4*uPulso) * (1.0 - 0.35*sombra) * (1.0 - 0.7*venas);
      totalEmissiveRadiance = col * e * 0.7;
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
  function hueso(L, r0, r1, comba, semilla, hueco = 0.05) {
    const pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(V(0.012 * Math.sin(t * 5 + semilla), hueco + (L - 2 * hueco) * t, comba * Math.sin(Math.PI * t))); }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), {
      tramos: 64, lados: 16, ruido: R, rugosidad: 0.015,
      radio: (t) => {
        const base = r0 + (r1 - r0) * t;
        const barril = 0.6 + 0.4 * Math.pow(Math.sin(Math.PI * t), 0.6);
        const cabeza0 = 0.42 * Math.exp(-Math.pow(t / 0.08, 2));
        const cabeza1 = 0.34 * Math.exp(-Math.pow((1 - t) / 0.07, 2));
        const surcos = -0.06 * Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 4), 12) * S(t, 0.12, 0.2) * (1 - S(t, 0.8, 0.88));
        return base * (barril + cabeza0 + cabeza1 + surcos) * (1 - 0.6 * Math.pow(Math.max(0, Math.abs(t - 0.5) * 2 - 0.97) / 0.03, 2));
      },
    });
    return colorear(g, (t, u, c) => {
      const lado = 0.5 + 0.5 * Math.cos(u * Math.PI * 2 - Math.PI / 2); // más claro del lado del polo
      c.copy(COL.bronce).lerp(COL.hueso, 0.25 + 0.75 * lado * S(t, 0.06, 0.25) * (1 - S(t, 0.8, 0.95)));
      c.lerp(COL.punta, 0.3 * Math.pow(lado, 4) * S(t, 0.15, 0.4) * (1 - S(t, 0.6, 0.85)));
      const veta = Math.pow(0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 5 + 2 * R.n3(t * 2, semilla, 0)), 6);
      c.lerp(COL.oscuro, Math.max(1 - S(t, 0.0, 0.1), S(t, 0.9, 1.0)) * 0.6 + veta * 0.12);
      c.multiplyScalar(0.95 + 0.1 * R.n3(t * 3, u * 2, semilla));
    });
  }
  // Garra: se curva hacia +Z y vuelve al eje en la punta
  function garra(L, r0, curva, semilla) {
    const pts = [];
    for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push(V(0, L * t, curva * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.3 * t))); }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 12, radio: (t) => r0 * (1 + 0.25 * Math.exp(-Math.pow((t - 0.1) / 0.1, 2))) * Math.pow(1 - t, 0.9) + 0.0015 });
    return colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.bronce, S(t, 0.0, 0.15)).lerp(COL.hueso, S(t, 0.25, 0.65)).lerp(COL.punta, S(t, 0.8, 1)).multiplyScalar(0.92 + 0.15 * R.n3(t * 5, u * 4, semilla)));
  }
  // Junta: manga corta de carne violeta con pliegues, alineada con el hueso (eje Y)
  const mJunta = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x5a2470, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.3,
    sheen: 0.6, sheenColor: new THREE.Color(PALETA.secundario), sheenRoughness: 0.5, emissive: 0xffffff,
  }), {
    clave: 'junta', fuerza: 0.012,
    relieve: 'h = 0.6*sin(q.y*70.0 + tl_snoise(q*12.0)*2.0) + 0.3*tl_fbm(q*12.0);',
    tinte: 'diffuseColor.rgb *= 0.7 + 0.35*h;',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 2.5);
             totalEmissiveRadiance = vec3(0.57,0.16,0.91) * fres * 0.15;`,
  });
  const gMangas = new Map();
  const junta = (r) => {
    if (!gMangas.has(r)) {
      const perfil = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        perfil.push(new THREE.Vector2(r * (0.62 + 0.38 * Math.pow(Math.sin(Math.PI * t), 0.7)) * (1 + 0.06 * Math.sin(t * Math.PI * 6)), (t - 0.5) * r * 1.5));
      }
      gMangas.set(r, new THREE.LatheGeometry(perfil, 28));
    }
    const m = new THREE.Mesh(gMangas.get(r), mJunta); m.castShadow = true; return m;
  };

  /* Banda de caparazón sobre un elipsoide (teja: el borde trasero se levanta) */
  function banda(E, sA, sB, fm, i, { alza = 0.07, grosor = 0.035, nu = 34, nv = 26, centro = 0, tono = null } = {}) {
    const Sup = (u, t, capa) => {
      const s = sA + (sB - sA) * t;
      const borde = Math.pow(Math.abs(u), 6);
      const fb = (t * 6 + 0.4 * R.n3(i * 2.3, u * 2, t)) % 1;
      const lineas = 0.022 * S(fb, 0, 0.15) * (1 - fb);
      const quilla = 0.05 * Math.exp(-u * u * 16);
      let k = 1.035 + alza * (1 - t) * (1 - t) + quilla + lineas - 0.025 * borde + 0.012 * R.fbm(u * 3 + i, t * 3, i, 2);
      if (capa === 1) k -= grosor * (1 - 0.6 * borde) + 0.004;
      return puntoElip(E, s, centro + u * fm * (1 - 0.06 * t), k);
    };
    const colorEn = (u, t, capa) => {
      const c = (tono || COL.hueso).clone().lerp(COL.bronce, S(Math.abs(u), 0.3, 0.95) * 0.75);
      c.lerp(COL.cobre, 0.2 * (0.5 + 0.5 * R.n3(u * 1.5, t * 2, i)));
      const fb = (t * 6 + 0.4 * R.n3(i * 2.3, u * 2, t)) % 1;
      c.lerp(COL.oscuro, (1 - S(fb, 0, 0.12)) * 0.45 + S(t, 0.7, 1.0) * 0.6 + Math.pow(Math.abs(u), 8) * 0.4);
      c.lerp(COL.punta, S(t, 0.03, 0.1) * (1 - S(t, 0.15, 0.35)) * Math.exp(-u * u * 3) * 0.4);
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
  cuerpo.scale.setScalar(1.2);
  grupo.add(cuerpo);

  const E_ce = { c: V(0, 0.02, 0.22), r: V(0.42, 0.33, 0.5), inclina: 0.1 };
  const E_ca = { c: V(0, -0.05, 0.8), r: V(0.25, 0.2, 0.25), inclina: 0.25 };
  const E_ab = { c: V(0, -0.06, -0.84), r: V(0.68, 0.62, 0.7), inclina: -0.2 };

  cuerpo.add(elipsoide(E_ce, 0.98, mCarne, 1));
  cuerpo.add(elipsoide(E_ca, 0.97, mCarne, 2));
  // bandas del tórax
  [[0.95, 0.3, 0.16], [0.42, -0.25, 0.2], [-0.12, -0.92, 0.22]].forEach(([a, b, lp], i) => {
    const { m, Sup } = banda(E_ce, a, b, 1.55, i, { alza: 0.12, grosor: 0.06 });
    cuerpo.add(m);
    crestaEn(cuerpo, E_ce, Sup, 0, 0.15, lp * 1.25, 0.06);
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
  const bandasAb = [[0.97, 0.6], [0.6, 0.24], [0.22, -0.14], [-0.17, -0.52], [-0.53, -0.98]];
  const crestas = [0.36, 0.4, 0.36, 0.3, 0.22];
  for (let i = 0; i < bandasAb.length; i++) {
    const [a, b] = bandasAb[i];
    const { m, Sup } = banda(E_ab, a, b, 1.62 - 0.04 * i, 20 + i, { alza: 0.24, grosor: 0.08, nu: 44, nv: 28 });
    abd.add(m);
    crestaEn(abd, E_ab, Sup, 0, 0.12, crestas[i], 0.08 - i * 0.006);
    if (i > 0) for (const u of [-0.8, 0.8]) crestaEn(abd, E_ab, Sup, u, 0.15, 0.16 + 0.03 * (i % 2), 0.045, u);
    await cuadro();
  }

  // placas ventrales, más cálidas, debajo y detrás
  [[-0.1, -0.42], [-0.38, -0.7], [-0.64, -0.98]].forEach(([a, b], i) => {
    const { m } = banda(E_ab, a, b, 0.75, 40 + i, { alza: 0.12, grosor: 0.06, centro: Math.PI, tono: COL.naranja, nu: 26, nv: 20 });
    abd.add(m);
  });
  // sacos del vientre, en hileras a los lados
  const sacos = [];
  const filas = [[Math.PI - 1.3, [0.62, 0.3, -0.02]], [Math.PI + 1.3, [0.62, 0.3, -0.02]], [Math.PI - 0.66, [0.72, 0.44, 0.14]], [Math.PI + 0.66, [0.72, 0.44, 0.14]], [Math.PI, [0.8, 0.55, 0.28]]];
  filas.forEach(([ph, ss], f) => ss.forEach((s, n) => {
    const r = (0.21 - 0.04 * Math.abs(s - 0.4)) * (f === 4 ? 0.8 : 1) * (0.88 + 0.24 * (0.5 + 0.5 * Math.sin(n * 3.7 + f)));
    const g = new THREE.SphereGeometry(1, 48, 36);
    const p = g.attributes.position, P = V();
    for (let k = 0; k < p.count; k++) {
      P.fromBufferAttribute(p, k);
      const d = 1 + 0.08 * R.fbm(P.x * 2 + n + f * 5, P.y * 2, P.z * 2, 3);
      p.setXYZ(k, P.x * d, P.y * d * 0.85, P.z * d * 1.15);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mSaco);
    const c = puntoElip(E_ab, s + 0.03 * Math.sin(n + f), ph, 1.0);
    m.position.copy(c);
    const fuera = c.clone().sub(E_ab.c).normalize();
    m.quaternion.setFromUnitVectors(ARRIBA, fuera);
    m.scale.setScalar(r);
    m.castShadow = true;
    abd.add(m);
    sacos.push({ m, r, fase: n * 1.3 + f * 2.1 });
  }));
  // tiras de carne que sujetan las hileras
  for (const ph of [Math.PI - 0.33, Math.PI + 0.33, Math.PI - 0.98, Math.PI + 0.98, Math.PI - 1.62, Math.PI + 1.62]) {
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const s = 0.9 - 1.0 * (k / 14);
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
    hombro.rotation.y = 0.45 * lado;
    const alza = new THREE.Group(); alza.rotation.x = 0.1; alza.rotation.z = -0.3 * lado; hombro.add(alza);
    const s1 = new THREE.Mesh(hueso(0.9, 0.1, 0.085, -0.05, lado * 3), mQuitina); s1.castShadow = true; alza.add(s1);
    alza.add(junta(0.11));
    const codo = new THREE.Group(); codo.position.y = 0.9; codo.rotation.set(0.3, 0, -1.25 * lado); alza.add(codo);
    codo.add(junta(0.1));
    const s2 = new THREE.Mesh(hueso(0.85, 0.09, 0.07, 0.05, lado * 5), mQuitina); s2.castShadow = true; codo.add(s2);
    // dientes por dentro (lado +Z)
    for (let k = 0; k < 6; k++) {
      const t = 0.22 + k * 0.12;
      const d = new THREE.Mesh(pua(0.11 + 0.04 * (k % 2), 0.026, 0.6, 8), mQuitina);
      colocar(d, V(0, 0.85 * t, 0.075 * (1 - t * 0.3) + 0.05 * Math.sin(Math.PI * t)), V(0, 0.55, 1), V(0, 1, 0));
      s2.add(d);
    }
    const muneca = new THREE.Group(); muneca.position.y = 0.85; muneca.rotation.set(0.25, 0, -1.0 * lado); codo.add(muneca);
    muneca.add(junta(0.085));
    const g = new THREE.Mesh(garra(0.78, 0.085, 0.22, lado * 7), mQuitina); g.castShadow = true; muneca.add(g);
    cuerpo.add(hombro);
    brazos.push({ alza, codo, muneca, lado });
  }

  /* ---------------- Patas ---------------- */
  progreso('Patas');
  const L1 = 1.0, L2 = 1.06;
  const patas = [];
  const filasPata = [[0.46, 0.72, 0.9, 1.72], [0.24, 0.1, 0.14, 1.66], [0.0, -0.5, -0.8, 1.78]];
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
    const tobilloRel = V(-fuera.x * 0.16, 0.42, -fuera.z * 0.16);
    const Lt = tobilloRel.length();
    const semilla = n * 1.7 + 0.3;
    const mk = (g) => { const m = new THREE.Mesh(g, mQuitina); m.matrixAutoUpdate = false; m.castShadow = true; m.receiveShadow = true; grupo.add(m); return m; };
    const coxa = mk(hueso(Lc, 0.1, 0.095, 0.01, semilla, 0.025));
    const femur = mk(hueso(L1, 0.1, 0.085, 0.06, semilla + 1));
    const tibia = mk(hueso(L2, 0.088, 0.068, -0.05, semilla + 2));
    const tarso = mk(garra(Lt, 0.07, 0.12, semilla + 3));
    // espinas del fémur y espolón de la rodilla
    for (const [t, l] of [[0.4, 0.14], [0.68, 0.16]]) {
      const e = new THREE.Mesh(pua(l, 0.034, 0.5, 9), mQuitina);
      colocar(e, V(0, L1 * t, 0.08 + 0.06 * Math.sin(Math.PI * t)), V(0, 0.45, 1), V(0, 1, 0));
      e.castShadow = true; femur.add(e);
    }
    { const e = new THREE.Mesh(pua(0.26, 0.05, 0.55, 10), mQuitina); colocar(e, V(0, 0.08, 0.05), V(0, -0.75, 0.6), V(0, -1, 0)); e.castShadow = true; tibia.add(e); }
    const juntas = [junta(0.11), junta(0.1), junta(0.088), junta(0.07)];
    juntas.forEach((j) => { j.matrixAutoUpdate = false; grupo.add(j); });
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
      br.alza.rotation.x = 0.1 + 0.08 * Math.sin(f) * vivo;
      br.codo.rotation.z = br.lado * (-1.25 + 0.12 * Math.sin(f - 0.6) * vivo);
      br.muneca.rotation.z = br.lado * (-1.0 + 0.15 * Math.sin(f - 1.1) * vivo);
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
      orientar(pa.juntas[0], H, A, polo); orientar(pa.juntas[1], A, B, polo); orientar(pa.juntas[2], B, T, polo); orientar(pa.juntas[3], T, P, pa.fuera);
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
