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
    ['Cabeza y torso', 'Torso erguido de anillos de quitina sobre el cuerpo; la cabeza, alargada, lleva una corona de púas barridas hacia atrás, ojos verdes y dos ganchos bajo el hocico.'],
    ['Costillas', 'Una cortina de costillas violetas, nudosas, cuelga desde los hombros sobre la espalda.'],
    ['Patas', 'Seis patas largas y arqueadas, de cuatro segmentos con forma de hueso y mangas violetas en cada articulación; terminan en garras grandes y se apoyan de una en una. Entre ellas, una membrana violeta.'],
    ['Guadañas', 'Dos brazos alzados desde los hombros que se arquean hacia afuera, dentados por dentro, con garras largas.'],
    ['Vientre', 'Abdomen largo y horizontal con una fila de púas en el lomo, placas naranjas por debajo y racimos de sacos verdes luminosos a los costados.'],
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
  function hueso(L, r0, r1, comba, semilla, hueco = 0.05, maza = false) {
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
        if (maza) {
          // se ensancha hacia el extremo distal y remata en un nudo, como un hueso largo
          const cuerpoM = 0.5 + 0.62 * Math.pow(t, 1.6) + 0.12 * Math.sin(Math.PI * t);
          const nudo = 0.28 * Math.exp(-Math.pow((t - 0.9) / 0.07, 2)) - 0.35 * Math.exp(-Math.pow((1 - t) / 0.035, 2));
          const base0 = 0.22 * Math.exp(-Math.pow(t / 0.06, 2));
          return r0 * (cuerpoM + nudo + base0 + surcos);
        }
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
  cuerpo.scale.setScalar(1.0);
  grupo.add(cuerpo);

  const E_ce = { c: V(0, 0.02, 0.22), r: V(0.42, 0.33, 0.5), inclina: 0.1 };
  const E_ab = { c: V(0, 0.0, -1.2), r: V(0.55, 0.5, 1.05), inclina: -0.04 };

  cuerpo.add(elipsoide(E_ce, 0.98, mCarne, 1));
  [[0.95, 0.3], [0.42, -0.25], [-0.12, -0.92]].forEach(([a, b], i) => {
    const { m, Sup } = banda(E_ce, a, b, 1.5, i, { alza: 0.12, grosor: 0.06 });
    cuerpo.add(m);
    if (i === 2) crestaEn(cuerpo, E_ce, Sup, 0, 0.15, 0.26, 0.06);
    for (const u of [-0.8, 0.8]) crestaEn(cuerpo, E_ce, Sup, u, 0.15, 0.15, 0.04, u * 0.6);
  });
  /* ---------------- Torso erguido ---------------- */
  progreso('Torso');
  const torso = new THREE.Group(); torso.name = 'Torso';
  torso.position.set(0, 0.18, 0.5);
  cuerpo.add(torso);
  const espina = new THREE.CatmullRomCurve3([V(0, -0.1, -0.05), V(0, 0.3, 0.06), V(0, 0.66, 0.18), V(0, 0.95, 0.3), V(0, 1.1, 0.36)]);
  {
    const g = tuboAfinado(espina, { tramos: 80, lados: 20, ruido: R, rugosidad: 0.08, radio: (t) => 0.13 - 0.04 * t + 0.012 * Math.sin(t * 30) });
    const m = new THREE.Mesh(g, mCarne); m.castShadow = true; torso.add(m);
  }
  // placas del pecho (adelante) y de la espalda, apiladas a lo largo del torso
  for (let i = 0; i < 7; i++) {
    const t = 0.06 + i * 0.125;
    const c = espina.getPointAt(t), tg = espina.getTangentAt(t);
    const E_t = { c, r: V(0.21 - 0.05 * t, 0.16 - 0.035 * t, 0.1), inclina: -Math.PI / 2 + Math.atan2(tg.z, tg.y) };
    const pecho = banda(E_t, 0.98, -0.75, 1.65, 60 + i, { alza: 0.14, grosor: 0.045, centro: Math.PI, nu: 30, nv: 16 });
    torso.add(pecho.m);
    const lomo = banda(E_t, 0.98, -0.75, 1.5, 70 + i, { alza: 0.18, grosor: 0.05, nu: 30, nv: 16 });
    torso.add(lomo.m);
    if (i % 2 === 0) crestaEn(torso, E_t, lomo.Sup, 0, 0.1, 0.12 + 0.025 * i, 0.03, 0);
  }

  /* ---------------- Cabeza ---------------- */
  const cabeza = new THREE.Group(); cabeza.name = 'Cabeza';
  cabeza.position.copy(espina.getPointAt(1)).add(V(0, 0.06, 0.04));
  torso.add(cabeza);
  const E_ca = { c: V(0, 0, 0.14), r: V(0.18, 0.15, 0.34), inclina: 0.5 };
  cabeza.add(elipsoide(E_ca, 0.97, mCarne, 2));
  {
    const { m } = banda(E_ca, 0.75, -0.95, 1.4, 9, { alza: 0.08, grosor: 0.035, nu: 32, nv: 22 });
    cabeza.add(m);
  }
  // corona: púas largas que salen de la nuca hacia atrás y se curvan hacia arriba
  const corona = [[0, 1.0, 0.065], [-0.3, 0.9, 0.058], [0.3, 0.9, 0.058], [-0.6, 0.72, 0.05], [0.6, 0.72, 0.05], [-0.9, 0.5, 0.042], [0.9, 0.5, 0.042], [-0.15, 0.45, 0.034], [0.15, 0.45, 0.034]];
  corona.forEach(([ax, largo, radio], k) => {
    const base = puntoElip(E_ca, -0.35 - 0.12 * (k > 6 ? 1 : 0), ax * 0.9, 0.95);
    const dir = V(Math.sin(ax) * 0.55, 0.3 + 0.15 * Math.cos(ax) + (k > 6 ? 0.3 : 0), -1).normalize();
    const m = new THREE.Mesh(pua(largo, radio, 0.22, 12), mQuitina);
    colocar(m, base, dir, V(0, 1, 0.2));
    m.castShadow = true; cabeza.add(m);
  });
  // ojos al frente de la cabeza
  [[0.62, 0.42, 0.03], [0.5, 0.75, 0.024], [0.74, 0.18, 0.018]].forEach(([s, ph, r]) => {
    for (const lado of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mOjo);
      o.position.copy(puntoElip(E_ca, s, ph * lado + 0.35 * lado, 0.99));
      cabeza.add(o);
    }
  });
  // quelíceros: dos ganchos bajo el hocico que se abren y cierran
  const quel = [];
  for (const lado of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.copy(puntoElip(E_ca, 0.82, Math.PI * 0.7 * lado, 0.92));
    const pts = [V(0, 0, 0), V(lado * 0.03, -0.07, 0.08), V(lado * 0.0, -0.17, 0.12), V(-lado * 0.05, -0.25, 0.08), V(-lado * 0.07, -0.28, 0.02)];
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 12, radio: (t) => 0.036 * Math.pow(1 - t, 0.8) + 0.002 });
    colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.bronce, S(t, 0, 0.3)).lerp(COL.punta, S(t, 0.7, 1)));
    const m = new THREE.Mesh(g, mQuitina); m.castShadow = true;
    piv.add(m); cabeza.add(piv);
    quel.push({ piv, lado });
  }
  // cortina de costillas que cuelga desde los hombros
  const costillas = new THREE.Group(); costillas.name = 'Costillas';
  costillas.position.copy(espina.getPointAt(0.86)).add(V(0, 0, -0.1));
  torso.add(costillas);
  const violeta = new THREE.Color(0x7a3492), violetaOsc = new THREE.Color(0x2a0c33);
  for (let k = 0; k < 11; k++) {
    const x = (k / 10 - 0.5) * 0.85;
    const largo = 0.95 + 0.3 * Math.cos((k / 10 - 0.5) * Math.PI) + 0.08 * Math.sin(k * 2.3);
    const pts = [V(x * 0.6, 0, 0), V(x * 0.85, 0.08, -0.22), V(x, -0.08, -0.42), V(x * 1.05, -largo * 0.55, -0.5 - 0.04 * Math.sin(k)), V(x * 1.1, -largo, -0.44)];
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), {
      tramos: 90, lados: 9,
      radio: (t) => (0.03 - 0.016 * t) * (1 + 0.45 * Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 7), 10)) + 0.002,
    });
    colorear(g, (t, u, c) => {
      const nudo = Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * 7), 10);
      c.copy(violetaOsc).lerp(violeta, 0.55 + 0.4 * nudo).lerp(COL.punta, S(t, 0.92, 1) * 0.5);
    });
    const m = new THREE.Mesh(g, mQuitina); m.castShadow = true; costillas.add(m);
  }
  // brazos pequeños del pecho con dedos en gancho
  const bracitos = [];
  for (const lado of [-1, 1]) {
    const h = new THREE.Group(); h.position.copy(espina.getPointAt(0.55)).add(V(lado * 0.16, 0, 0.12));
    h.rotation.set(1.9, 0, -0.35 * lado);
    const a1 = new THREE.Mesh(hueso(0.32, 0.04, 0.034, 0.02, lado * 11), mQuitina); h.add(a1); h.add(junta(0.045));
    const c2 = new THREE.Group(); c2.position.y = 0.32; c2.rotation.x = -1.2; h.add(c2); c2.add(junta(0.04));
    c2.add(new THREE.Mesh(hueso(0.28, 0.034, 0.028, -0.02, lado * 13), mQuitina));
    for (const dz of [-0.03, 0, 0.03]) {
      const d = new THREE.Mesh(garra(0.12, 0.012, 0.04, dz * 100), mQuitina);
      d.position.set(dz, 0.28, 0); d.rotation.x = 0.6; c2.add(d);
    }
    torso.add(h); bracitos.push({ h, c2, lado });
  }
  await cuadro();

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
    const { m, Sup } = banda(E_ab, a, b, 0.72, 20 + i, { alza: 0.2, grosor: 0.07, nu: 30, nv: 28 });
    abd.add(m);
    crestaEn(abd, E_ab, Sup, 0, 0.12, crestas[i], 0.08 - i * 0.006);
    for (const u of [-0.85, 0.85]) crestaEn(abd, E_ab, Sup, u, 0.15, 0.17 + 0.04 * (i % 2), 0.045, u * 0.6);
    await cuadro();
  }

  // placas ventrales, más cálidas, debajo y detrás
  [[0.5, 0.15], [0.2, -0.15], [-0.1, -0.45], [-0.4, -0.75], [-0.68, -0.98]].forEach(([a, b], i) => {
    const { m } = banda(E_ab, a, b, 0.75, 40 + i, { alza: 0.12, grosor: 0.06, centro: Math.PI, tono: COL.naranja, nu: 26, nv: 20 });
    abd.add(m);
  });
  // sacos del vientre, en hileras a los lados
  const sacos = [];
  const filas = [[-1.2, [0.66, 0.33, 0.0, -0.33, -0.64]], [1.2, [0.66, 0.33, 0.0, -0.33, -0.64]], [-1.95, [0.5, 0.17, -0.16, -0.48]], [1.95, [0.5, 0.17, -0.16, -0.48]]];
  filas.forEach(([ph, ss], f) => ss.forEach((s, n) => {
    const r = (0.2 - 0.05 * Math.abs(s)) * (f > 1 ? 0.85 : 1) * (0.88 + 0.24 * (0.5 + 0.5 * Math.sin(n * 3.7 + f)));
    const g = new THREE.SphereGeometry(1, 48, 36);
    const p = g.attributes.position, P = V();
    for (let k = 0; k < p.count; k++) {
      P.fromBufferAttribute(p, k);
      const d = 1 + 0.08 * R.fbm(P.x * 2 + n + f * 5, P.y * 2, P.z * 2, 3);
      p.setXYZ(k, P.x * d, P.y * d * 0.85, P.z * d * 1.15);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mSaco);
    const c = puntoElip(E_ab, s + 0.03 * Math.sin(n + f), ph, 0.97);
    m.position.copy(c);
    const fuera = c.clone().sub(E_ab.c).normalize();
    m.quaternion.setFromUnitVectors(ARRIBA, fuera);
    m.scale.setScalar(r);
    m.castShadow = true;
    abd.add(m);
    sacos.push({ m, r, fase: n * 1.3 + f * 2.1 });
  }));
  // tiras de carne que sujetan las hileras
  for (const ph of [-0.8, 0.8, -1.58, 1.58, -2.3, 2.3]) {
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const s = 0.88 - 1.76 * (k / 14);
      pts.push(puntoElip(E_ab, s, ph + 0.05 * Math.sin(k * 1.7), 1.0 + 0.035 * Math.pow(Math.sin(k * 1.1), 2)));
    }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 120, lados: 10, ruido: R, rugosidad: 0.3, radio: (t) => 0.024 * (0.6 + 0.4 * Math.sin(Math.PI * t)) + 0.006 * Math.sin(t * 40) });
    const m = new THREE.Mesh(g, mCarne); m.castShadow = true; abd.add(m);
  }
  const luzVientre = new THREE.PointLight(PALETA.acido, 2.2, 3.5, 2);
  luzVientre.position.copy(puntoElip(E_ab, 0.0, Math.PI, 1.15));
  abd.add(luzVientre);
  await cuadro();

  /* ---------------- Guadañas ---------------- */
  progreso('Guadañas');
  const brazos = [];
  for (const lado of [-1, 1]) {
    const hombro = new THREE.Group();
    hombro.position.copy(espina.getPointAt(0.78)).add(V(lado * 0.2, 0, -0.02));
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
    torso.add(hombro);
    brazos.push({ alza, codo, muneca, lado });
  }

  /* ---------------- Patas ---------------- */
  progreso('Patas');
  const L1 = 1.22, L2 = 1.34, ARCO1 = 0.09, ARCO2 = 0.13;
  const sub = (L, k) => Math.hypot(L / 2, k * L);
  const patas = [];
  const filasPata = [[0.34, 0.44, 0.72, 0.95, 1.9], [0.4, 0.04, 0.1, 0.12, 1.85], [0.38, -0.46, -0.5, -0.88, 1.95]];
  const orden = [0, 4, 2, 3, 1, 5];
  let n = 0;
  for (const lado of [-1, 1]) for (const [hx, z, ang, angPie, D] of filasPata) {
    const cadera = V(lado * hx, -0.08, z);
    const dirC = V(lado * Math.cos(ang), 0.3, Math.sin(ang));
    const finCoxa = cadera.clone().addScaledVector(dirC, 0.24);
    const Lc = finCoxa.distanceTo(cadera);
    const px = lado * hx + lado * Math.cos(angPie) * D, pz = z + Math.sin(angPie) * D;
    const pie = V(px, suelo(px, pz), pz);
    const fuera = V(pie.x - cadera.x, 0, pie.z - cadera.z).normalize();
    const tobilloRel = V(-fuera.x * 0.1, 0.5, -fuera.z * 0.1);
    const Lt = tobilloRel.length();
    const semilla = n * 1.7 + 0.3;
    const mk = (g) => { const m = new THREE.Mesh(g, mQuitina); m.matrixAutoUpdate = false; m.castShadow = true; m.receiveShadow = true; grupo.add(m); return m; };
    const coxa = mk(hueso(Lc, 0.1, 0.095, 0.01, semilla, 0.025));
    const l1 = sub(L1, ARCO1), l2 = sub(L2, ARCO2);
    const femur = mk(hueso(l1, 0.085, 0.085, 0.03, semilla + 1, 0.04, true));
    const femur2 = mk(hueso(l1, 0.08, 0.08, 0.03, semilla + 1.5, 0.04, true));
    const tibia = mk(hueso(l2, 0.074, 0.074, -0.03, semilla + 2, 0.04, true));
    const tibia2 = mk(hueso(l2, 0.066, 0.066, -0.03, semilla + 2.5, 0.04, true));
    const tarso = mk(garra(Lt, 0.085, 0.13, semilla + 3));
    // espinas del fémur y espolón de la rodilla
    for (const [t, l] of [[0.4, 0.14], [0.68, 0.16]]) {
      const e = new THREE.Mesh(pua(l, 0.034, 0.5, 9), mQuitina);
      colocar(e, V(0, l1 * t, 0.06 + 0.07 * t), V(0, 0.45, 1), V(0, 1, 0));
      e.castShadow = true; femur2.add(e);
    }
    { const e = new THREE.Mesh(pua(0.26, 0.05, 0.55, 10), mQuitina); colocar(e, V(0, 0.08, 0.05), V(0, -0.75, 0.6), V(0, -1, 0)); e.castShadow = true; tibia.add(e); }
    const juntas = [junta(0.11), junta(0.1), junta(0.095), junta(0.088), junta(0.08), junta(0.068)];
    juntas.forEach((j) => { j.matrixAutoUpdate = false; grupo.add(j); });
    patas.push({ cadera, finCoxa, pie, fuera, tobilloRel, coxa, femur, femur2, tibia, tibia2, tarso, juntas, turno: orden[n], lado, fila: n % 3 });
    n++;
  }
  await cuadro();

  /* ---------------- Membrana entre las patas ---------------- */
  const mMembrana = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x4a1a58, roughness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.35, side: THREE.DoubleSide,
    sheen: 0.3, sheenColor: new THREE.Color(PALETA.secundario), sheenRoughness: 0.5, emissive: 0xffffff,
  }), {
    clave: 'membrana', fuerza: 0.02,
    relieve: 'h = 0.6*sin(vUv2.x*70.0 + tl_snoise(vec3(vUv2*6.0, 1.0))*2.0) + 0.3*tl_snoise(vec3(vUv2*20.0, 3.0));',
    tinte: 'diffuseColor.rgb *= 0.7 + 0.35*h; diffuseColor.rgb *= 0.65 + 0.5*smoothstep(1.0, 0.2, vUv2.y);',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 2.0);
             totalEmissiveRadiance = vec3(0.57,0.16,0.91) * fres * 0.1;`,
  });
  const CM = 13, FM = 9; // columnas por tramo entre patas, filas de arriba abajo
  const membranas = [-1, 1].map((lado) => {
    const nCol = 2 * CM + 1, pos = new Float32Array(nCol * FM * 3), uv = [], idx = [];
    for (let c = 0; c < nCol; c++) for (let f = 0; f < FM; f++) uv.push(c / (nCol - 1), f / (FM - 1));
    for (let c = 0; c < nCol - 1; c++) for (let f = 0; f < FM - 1; f++) { const a = c * FM + f, b = a + FM; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, mMembrana); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true;
    grupo.add(m);
    return { m, lado, nCol, arriba: [V(), V(), V()], abajo: [V(), V(), V()] };
  });
  const _mA = V(), _mB = V(), _mP = V(), _cen = V();
  function rehacerMembrana(mb) {
    const pos = mb.m.geometry.attributes.position.array;
    for (let c = 0; c < mb.nCol; c++) {
      const tramo = Math.min(1, Math.floor(c / CM)), fr = (c - tramo * CM) / CM;
      const comba = Math.sin(Math.PI * fr);
      _mA.lerpVectors(mb.arriba[tramo], mb.arriba[tramo + 1], fr);
      _mB.lerpVectors(mb.abajo[tramo], mb.abajo[tramo + 1], fr);
      _mB.lerp(_mA, 0.18 * comba); // el borde libre se recoge entre pata y pata
      for (let f = 0; f < FM; f++) {
        const v = f / (FM - 1);
        _mP.lerpVectors(_mA, _mB, v);
        _mP.y -= 0.05 * Math.sin(Math.PI * v) * (0.4 + comba);
        _mP.x -= mb.lado * 0.06 * Math.sin(Math.PI * v) * comba;
        const k = (c * FM + f) * 3; pos[k] = _mP.x; pos[k + 1] = _mP.y; pos[k + 2] = _mP.z;
      }
    }
    mb.m.geometry.attributes.position.needsUpdate = true;
    mb.m.geometry.computeVertexNormals();
  }

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
  const materiales = [mQuitina, mCarne, mSaco, mSuelo, mJunta, mMembrana];
  const M4 = new THREE.Matrix4();
  const H = V(), A = V(), B = V(), T = V(), P = V(), polo = V(), M1 = V(), M2 = V(), _ab = V(), _pp = V();
  // punto medio de un hueso, desplazado hacia el polo para que la pata se arquee
  const arco = (X, Y, L, k, pl, out) => {
    _ab.subVectors(Y, X); const d = _ab.length(); _ab.divideScalar(d);
    _pp.copy(pl).addScaledVector(_ab, -pl.dot(_ab)).normalize();
    const h = Math.sqrt(Math.max(0, Math.pow(Math.hypot(L / 2, k * L), 2) - d * d / 4));
    return out.copy(X).add(Y).multiplyScalar(0.5).addScaledVector(_pp, h);
  };
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
    torso.rotation.x = (0.04 * Math.sin(t * 0.6) - 0.02) * vivo;
    torso.rotation.z = 0.03 * Math.sin(t * 0.37) * vivo;
    cabeza.rotation.set(0.06 * Math.sin(t * 0.9 + 1) * vivo, 0.12 * Math.sin(t * 0.43) * vivo, 0);
    costillas.rotation.x = 0.04 * Math.sin(t * 1.1 + 0.5) * vivo;
    for (const bz of bracitos) { bz.c2.rotation.x = -1.2 + 0.2 * Math.sin(t * 1.7 + bz.lado) * vivo; }
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
      polo.copy(ARRIBA).addScaledVector(pa.fuera, 0.55);
      ik(A, T, L1, L2, polo, B);
      orientar(pa.coxa, H, A, polo);
      arco(A, B, L1, ARCO1, polo, M1);
      arco(B, T, L2, ARCO2, polo, M2);
      orientar(pa.femur, A, M1, polo); orientar(pa.femur2, M1, B, polo);
      orientar(pa.tibia, B, M2, polo); orientar(pa.tibia2, M2, T, polo);
      orientar(pa.tarso, T, P, pa.fuera);
      const J = pa.juntas;
      orientar(J[0], H, A, polo); orientar(J[1], A, M1, polo); orientar(J[2], M1, B, polo);
      orientar(J[3], B, M2, polo); orientar(J[4], M2, T, polo); orientar(J[5], T, P, pa.fuera);
      const mb = membranas[pa.lado < 0 ? 0 : 1];
      mb.arriba[pa.fila].copy(H).lerp(_cen.set(0, H.y, H.z), 0.35); mb.arriba[pa.fila].y -= 0.16;
      mb.abajo[pa.fila].copy(H).lerp(T, 0.22); mb.abajo[pa.fila].y = T.y + 0.08;
    }

    for (const mb of membranas) rehacerMembrana(mb);

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
