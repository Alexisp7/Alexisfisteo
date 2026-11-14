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
    ['Silueta', 'Tres regiones: un abdomen ancho y horizontal, un tórax muy acorazado y un cuerpo superior erguido con la cabeza metida en una capucha de placas.'],
    ['Armadura', 'Placas de quitina bronce, ocre y café en tejas, con huecos oscuros entre ellas y púas de distinto largo que nacen del caparazón.'],
    ['Sacos y membrana', 'Sacos verdes hundidos en cuencas de quitina; una membrana violeta con pliegues cuelga del costado y se estira hacia cada pata.'],
    ['Patas', 'Seis patas gruesas de dos segmentos, juntas violetas y garras curvas color oliva, repartidas alrededor del abdomen.'],
    ['Presentación', 'Sobre una peana negra redonda con tierra, piedras, restos de hueso y pequeños brotes.'],
  ],
};

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const EJE_X = V(1, 0, 0), ARRIBA = V(0, 1, 0);
const S = THREE.MathUtils.smoothstep;
const ALTO = 1.05; // altura del cuerpo en reposo

const COL = {
  hueso: new THREE.Color(0x9a7436), bronce: new THREE.Color(0x4c2f12), oscuro: new THREE.Color(0x120a04),
  punta: new THREE.Color(0xc9b076), naranja: new THREE.Color(0xc0742a), cobre: new THREE.Color(0x9a5a22),
  oliva: new THREE.Color(0x6c7044), huesoVerde: new THREE.Color(0xbdbf96),
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

export async function construir({ progreso = () => {}, variante = 'a' } = {}) {
  const R = crearRuido(23);
  const BASE_Y = 0.2, BASE_R = 2.5;
  const suelo = (x, z) => BASE_Y + 0.025 + 0.03 * R.fbm(x * 1.2, 0, z * 1.2, 4) + 0.012 * R.fbm(x * 5, 3, z * 5, 2);
  const grupo = new THREE.Group();
  grupo.name = 'Zancuda nodriza';
  grupo.rotation.y = 1.0;
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
    color: 0x041402, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.06, emissive: 0xffffff,
  }), {
    clave: 'saco2', fuerza: 0.008,
    relieve: 'h = 0.5*tl_fbm(q*5.0);',
    brillo: `
      vec3 vv = normalize(vViewPosition);
      float ndv = abs(dot(normal, vv));
      float vena = 1.0 - abs(tl_snoise(q*2.4 + vec3(0.0, uT*0.04, 0.0)));
      float venas = smoothstep(0.95, 0.993, vena);
      float sombra = smoothstep(0.2, 0.7, tl_snoise(q*1.3 + vec3(uT*0.08, 0.0, uT*0.05)));
      vec3 col = mix(vec3(0.01,0.08,0.005), vec3(0.18,0.62,0.03), pow(ndv, 0.9));
      col = mix(col, vec3(0.45,0.95,0.15), pow(ndv, 7.0) * 0.4);
      float e = (0.2 + 0.9 * pow(ndv, 1.3)) * (0.75 + 0.4*uPulso) * (1.0 - 0.35*sombra) * (1.0 - 0.7*venas);
      totalEmissiveRadiance = col * e * 0.75;
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
  function garra(L, r0, curva, semilla, verde = false) {
    const pts = [];
    for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push(V(0, L * t, curva * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.3 * t))); }
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 12, radio: (t) => r0 * (1 + 0.25 * Math.exp(-Math.pow((t - 0.1) / 0.1, 2))) * Math.pow(1 - t, 0.9) + 0.0015 });
    if (verde) return colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.bronce, S(t, 0.0, 0.12)).lerp(COL.oliva, S(t, 0.15, 0.45)).lerp(COL.huesoVerde, S(t, 0.55, 0.95)).multiplyScalar(0.9 + 0.12 * R.n3(t * 9, u * 6, semilla) + 0.08 * Math.sin(u * Math.PI * 2 * 4)));
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

  /* ---------------- Variantes ---------------- */
  // Tres propuestas sobre la misma anatomía: cambian las guadañas, la estructura dorsal y los sacos.
  const CFG = {
    a: { cuello: 1.0, guadana: 'alta', dorsal: 'abanico', sacos: 'costados', capucha: 'media' },
    b: { cuello: 1.08, guadana: 'lateral', dorsal: 'cresta', sacos: 'lomo', capucha: 'alta' },
    c: { cuello: 0.74, guadana: 'mantis', dorsal: 'cortina', sacos: 'racimo', capucha: 'baja' },
  }[variante] || null;
  const cfg = CFG || { cuello: 1.0, guadana: 'alta', dorsal: 'abanico', sacos: 'costados', capucha: 'media' };
  const mOjoRojo = new THREE.MeshStandardMaterial({ color: 0x100202, emissive: new THREE.Color(0xff3a14), emissiveIntensity: 2.2, roughness: 0.2 });
  const espinas = (dest, E, Sup, n, semilla) => {
    for (let k = 0; k < n; k++) {
      const u = -0.9 + 1.8 * R.azar(), t = 0.04 + 0.3 * R.azar();
      crestaEn(dest, E, Sup, u, t, 0.05 + 0.15 * Math.pow(R.azar(), 1.5), 0.016 + 0.02 * R.azar(), u * 0.7);
    }
  };

  /* ---------------- Tórax y abdomen ---------------- */
  progreso('Caparazón');
  const cuerpo = new THREE.Group(); cuerpo.name = 'Cuerpo';
  grupo.add(cuerpo);
  const E_to = { c: V(0, 1.0, 0.42), r: V(0.56, 0.47, 0.52), inclina: 0.05 };
  const E_ab = { c: V(0, 0.95, -0.62), r: V(0.8, 0.46, 1.08), inclina: -0.06 };
  cuerpo.add(elipsoide(E_to, 0.97, mCarne, 1));
  cuerpo.add(elipsoide(E_ab, 0.97, mCarne, 3));
  // tórax: placas dorsales gruesas en tejas y placas laterales con púas
  [[0.98, 0.5], [0.58, 0.02], [0.1, -0.5], [-0.42, -0.95]].forEach(([a, b], i) => {
    const { m, Sup } = banda(E_to, a, b, 1.3, i, { alza: 0.2, grosor: 0.08, nu: 40, nv: 24 });
    cuerpo.add(m); espinas(cuerpo, E_to, Sup, 4, i);
  });
  // placas del pecho que cierran el frente y el vientre del tórax
  [[0.99, 0.55], [0.6, 0.1], [0.15, -0.45]].forEach(([a, b], i) => {
    const { m, Sup } = banda(E_to, a, b, 1.05, 90 + i, { alza: 0.14, grosor: 0.06, centro: Math.PI, nu: 32, nv: 20 });
    cuerpo.add(m); espinas(cuerpo, E_to, Sup, 2, 90 + i);
  });
  for (const lado of [-1, 1]) [[0.9, 0.25], [0.35, -0.3], [-0.2, -0.85]].forEach(([a, b], i) => {
    const { m, Sup } = banda(E_to, a, b, 0.42, 10 + i + lado * 3, { alza: 0.14, grosor: 0.06, centro: lado * 1.85, nu: 20, nv: 18 });
    cuerpo.add(m); crestaEn(cuerpo, E_to, Sup, 0, 0.2, 0.09 + 0.06 * i, 0.026, lado);
  });
  await cuadro();
  // abdomen: segmentos de placas, con huecos donde asoman los sacos y la carne
  const bandasAb = [[0.98, 0.58], [0.62, 0.2], [0.24, -0.18], [-0.14, -0.56], [-0.52, -0.98]];
  bandasAb.forEach(([a, b], i) => {
    if (cfg.sacos === 'lomo') {
      for (const lado of [-1, 1]) {
        const { m, Sup } = banda(E_ab, a, b, 0.4, 20 + i + lado * 7, { alza: 0.18, grosor: 0.07, centro: lado * 0.86, nu: 22, nv: 24 });
        cuerpo.add(m); crestaEn(cuerpo, E_ab, Sup, -lado * 0.5, 0.1, 0.12 + 0.12 * R.azar(), 0.035, lado * 0.3); espinas(cuerpo, E_ab, Sup, 2, i + lado);
      }
    } else if (cfg.sacos === 'racimo' && i >= 3) {
      for (const lado of [-1, 1]) { const { m } = banda(E_ab, a, b, 0.32, 20 + i + lado * 7, { alza: 0.16, grosor: 0.06, centro: lado * 1.25, nu: 18, nv: 24 }); cuerpo.add(m); }
    } else {
      const { m, Sup } = banda(E_ab, a, b, 0.85, 20 + i, { alza: 0.2, grosor: 0.08, nu: 34, nv: 24 });
      cuerpo.add(m);
      crestaEn(cuerpo, E_ab, Sup, 0, 0.1, 0.18 + 0.12 * R.azar(), 0.05, 0);
      espinas(cuerpo, E_ab, Sup, 4, 20 + i);
    }
    for (const lado of [-1, 1]) { const { m } = banda(E_ab, a, b, 0.3, 30 + i + lado * 5, { alza: 0.12, grosor: 0.06, centro: lado * 1.78, nu: 16, nv: 20 }); cuerpo.add(m); }
  });
  await cuadro();

  /* ---------------- Sacos verdes en cuencas ---------------- */
  progreso('Sacos');
  const sacos = [];
  const lugares = cfg.sacos === 'costados'
    ? [[0.52, 1.2, 0.2], [0.04, 1.24, 0.25], [-0.5, 1.18, 0.19], [0.5, -1.2, 0.18], [0.02, -1.22, 0.23], [-0.52, -1.16, 0.21]]
    : cfg.sacos === 'lomo'
      ? [[0.64, 0, 0.16], [0.28, 0, 0.22], [-0.12, 0, 0.26], [-0.52, 0, 0.21], [-0.84, 0, 0.14], [0.08, 1.28, 0.14], [-0.38, -1.28, 0.15]]
      : [[-0.52, 0.42, 0.2], [-0.58, -0.4, 0.19], [-0.86, 0.02, 0.18], [-0.3, 0.0, 0.16], [0.08, 1.22, 0.14], [0.04, -1.22, 0.14], [-0.8, 0.95, 0.13]];
  lugares.forEach(([s0, ph, r], n) => {
    const sup = puntoElip(E_ab, s0, ph, 1.0);
    const nrm = sup.clone().sub(E_ab.c).multiply(V(1 / (E_ab.r.x * E_ab.r.x), 1 / (E_ab.r.y * E_ab.r.y), 1 / (E_ab.r.z * E_ab.r.z))).normalize();
    const g = new THREE.SphereGeometry(1, 56, 40);
    const p = g.attributes.position, P = V();
    for (let k = 0; k < p.count; k++) {
      P.fromBufferAttribute(p, k);
      const d = 1 + 0.07 * R.fbm(P.x * 2.2 + n * 3, P.y * 2.2, P.z * 2.2, 3) + 0.04 * Math.sin(P.x * 7 + n);
      p.setXYZ(k, P.x * d * (1.05 + 0.1 * Math.sin(n)), P.y * d * 0.8, P.z * d * (1.12 - 0.1 * Math.sin(n)));
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mSaco);
    m.position.copy(sup).addScaledVector(nrm, -r * 0.3);
    m.quaternion.setFromUnitVectors(ARRIBA, nrm);
    m.scale.setScalar(r);
    m.castShadow = true;
    cuerpo.add(m);
    sacos.push({ m, r, fase: n * 1.7 });
    // cuenca: un labio de quitina irregular que abraza el saco
    const tg = new THREE.TorusGeometry(1.0, 0.2, 14, 48);
    const tp = tg.attributes.position;
    for (let k = 0; k < tp.count; k++) { P.fromBufferAttribute(tp, k); const d = 1 + 0.12 * R.fbm(P.x * 2 + n, P.y * 2, P.z * 3, 2); tp.setXYZ(k, P.x * d, P.y * d, P.z * (1 + 0.6 * R.fbm(P.x * 3, P.y * 3 + n, 1, 2))); }
    tg.computeVertexNormals();
    colorear(tg, (a, u, c) => {
      const cima = Math.max(0, Math.sin(u * Math.PI * 2));
      c.copy(COL.oscuro).lerp(COL.bronce, 0.4 + 0.5 * cima).lerp(COL.hueso, 0.35 * Math.pow(cima, 3)).multiplyScalar(0.9 + 0.2 * R.n3(a * 9, u * 3, n));
    });
    const lab = new THREE.Mesh(tg, mQuitina);
    lab.position.copy(sup).addScaledVector(nrm, -0.01);
    lab.quaternion.setFromUnitVectors(V(0, 0, 1), nrm);
    lab.scale.set(r * 1.02, r * 1.02 * 0.95, r);
    lab.castShadow = true;
    cuerpo.add(lab);
  });
  const luzSacos = new THREE.PointLight(0x7dff3a, 1.2, 2.5, 2);
  luzSacos.position.copy(E_ab.c).add(V(0, 0.75, 0));
  cuerpo.add(luzSacos);
  await cuadro();

  /* ---------------- Membrana violeta del costado ---------------- */
  progreso('Membrana');
  const mMemb = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.28, side: THREE.DoubleSide,
    sheen: 0.6, sheenColor: new THREE.Color(0xd04ab0), sheenRoughness: 0.5, emissive: 0xffffff,
  }), {
    clave: 'memb4', fuerza: 0.02,
    relieve: 'h = 0.5*tl_fbm(q*9.0);',
    tinte: 'diffuseColor.rgb *= 0.85 + 0.3*h;',
    brillo: `vec3 vv = normalize(vViewPosition); float fres = pow(1.0 - abs(dot(normal, vv)), 2.5);
             totalEmissiveRadiance = vec3(0.6,0.15,0.55) * fres * 0.12;`,
  });
  const cMem = { base: new THREE.Color(0x43145a), alto: new THREE.Color(0xa63a96), hondo: new THREE.Color(0x16051e) };
  const legZ = [0.5, 0.02, -0.95];
  for (const lado of [-1, 1]) {
    const Sup = (u, t, capa) => {
      const z = 0.55 - ((u + 1) / 2) * 1.95;
      const sA = THREE.MathUtils.clamp((z - E_ab.c.z) / E_ab.r.z, -0.96, 0.96);
      const top = puntoElip(E_ab, sA, lado * 1.95, 0.99);
      const sT = THREE.MathUtils.clamp((z - E_to.c.z) / E_to.r.z, -0.96, 0.96);
      const tt = puntoElip(E_to, sT, lado * 1.95, 0.99);
      if (Math.abs(tt.x) > Math.abs(top.x)) top.copy(tt);
      top.z = z;
      let tiro = 0; for (const lz of legZ) tiro = Math.max(tiro, Math.exp(-Math.pow((z - lz) / 0.22, 2)));
      const bottom = V(top.x * 1.1 + lado * 0.16 * tiro, BASE_Y + 0.5 - 0.16 * tiro + 0.08 * (1 - tiro), z);
      const P = top.clone().lerp(bottom, t);
      P.x += lado * (0.06 * Math.sin(Math.PI * t) + 0.014 * Math.sin(u * 46 + t * 4) * t);
      if (capa === 1) P.x -= lado * 0.035;
      return P;
    };
    const colorEn = (u, t, capa) => {
      const pl = 0.5 + 0.5 * Math.sin(u * 46 + t * 4);
      const c = cMem.base.clone().lerp(cMem.alto, Math.pow(pl, 3) * 0.6 * (0.3 + t));
      c.lerp(cMem.hondo, Math.pow(1 - pl, 4) * 0.5 + S(t, 0.85, 1) * 0.3 + (1 - S(t, 0, 0.15)) * 0.4);
      if (capa === 1) c.multiplyScalar(0.5);
      return c;
    };
    const m = new THREE.Mesh(lamina(Sup, colorEn, 110, 14), mMemb);
    m.castShadow = true; m.receiveShadow = true;
    cuerpo.add(m);
  }
  await cuadro();

  /* ---------------- Cuerpo superior erguido ---------------- */
  progreso('Torso');
  const superior = new THREE.Group(); superior.name = 'Cuerpo superior';
  superior.position.set(0, 1.3, 0.52);
  cuerpo.add(superior);
  const kc = cfg.cuello;
  const espina = new THREE.CatmullRomCurve3([V(0, -0.2, -0.06), V(0, 0.35 * kc, 0.05), V(0, 0.72 * kc, 0.16), V(0, 1.0 * kc, 0.3), V(0, 1.12 * kc, 0.42)]);
  {
    const g = tuboAfinado(espina, { tramos: 80, lados: 20, ruido: R, rugosidad: 0.08, radio: (t) => 0.17 - 0.07 * t + 0.012 * Math.sin(t * 30) });
    const m = new THREE.Mesh(g, mCarne); m.castShadow = true; superior.add(m);
  }
  for (let i = 0; i < 7; i++) {
    const t = 0.05 + i * 0.125;
    const c = espina.getPointAt(t), tg = espina.getTangentAt(t);
    const E_t = { c, r: V(0.25 - 0.08 * t, 0.19 - 0.05 * t, 0.12), inclina: -Math.PI / 2 + Math.atan2(tg.z, tg.y) };
    const pecho = banda(E_t, 0.98, -0.75, 1.6, 60 + i, { alza: 0.14, grosor: 0.045, centro: Math.PI, nu: 30, nv: 16 });
    superior.add(pecho.m);
    const lomo = banda(E_t, 0.98, -0.75, 1.5, 70 + i, { alza: 0.2, grosor: 0.05, nu: 30, nv: 16 });
    superior.add(lomo.m);
    espinas(superior, E_t, lomo.Sup, 2, 70 + i);
  }

  /* ---------------- Cabeza dentro de la capucha ---------------- */
  const cabeza = new THREE.Group(); cabeza.name = 'Cabeza';
  cabeza.position.copy(espina.getPointAt(1)).add(V(0, 0.02, 0.06));
  superior.add(cabeza);
  const E_ca = { c: V(0, -0.03, 0.12), r: V(0.15, 0.13, 0.25), inclina: 0.6 };
  cabeza.add(elipsoide(E_ca, 0.96, mCarne, 2));
  { const { m } = banda(E_ca, 0.98, 0.15, 0.95, 82, { alza: 0.06, grosor: 0.03, nu: 24, nv: 18 }); cabeza.add(m); }
  const E_cp = { c: V(0, 0.06, -0.03), r: V(0.29, 0.25, 0.34), inclina: 0.3 };
  {
    const a = banda(E_cp, 0.6, -0.15, 1.75, 80, { alza: 0.2, grosor: 0.06, nu: 36, nv: 20 });
    const b = banda(E_cp, -0.05, -0.95, 1.6, 81, { alza: 0.18, grosor: 0.06, nu: 36, nv: 20 });
    cabeza.add(a.m, b.m);
    const n = { baja: 3, media: 5, alta: 7 }[cfg.capucha];
    for (let k = 0; k < n; k++) {
      const f = n === 1 ? 0 : k / (n - 1) - 0.5;
      const largo = (cfg.capucha === 'alta' ? 0.55 : cfg.capucha === 'media' ? 0.36 : 0.2) * (1 - Math.abs(f) * 0.9);
      const base = b.Sup(f * 1.4, 0.2, 0);
      const dir = V(f * 0.9, cfg.capucha === 'alta' ? 0.9 : 0.5, -1).normalize();
      const pm = new THREE.Mesh(pua(largo, 0.03 + 0.02 * (1 - Math.abs(f)), 0.25, 10), mQuitina);
      colocar(pm, base, dir, V(0, 1, 0)); pm.castShadow = true; cabeza.add(pm);
    }
    espinas(cabeza, E_cp, a.Sup, 4, 80);
  }
  // ojos rojos hundidos
  [[0.55, 0.7, 0.02], [0.42, 1.0, 0.016]].forEach(([s, ph, r]) => {
    for (const lado of [-1, 1]) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mOjoRojo);
      o.position.copy(puntoElip(E_ca, s, ph * lado, 0.96));
      cabeza.add(o);
    }
  });
  // mandíbulas y colmillos
  const quel = [];
  for (const lado of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.copy(puntoElip(E_ca, 0.82, Math.PI * 0.68 * lado, 0.92));
    const pts = [V(0, 0, 0), V(lado * 0.04, -0.06, 0.07), V(lado * 0.01, -0.15, 0.11), V(-lado * 0.05, -0.21, 0.07), V(-lado * 0.07, -0.23, 0.01)];
    const g = tuboAfinado(new THREE.CatmullRomCurve3(pts), { tramos: 40, lados: 12, radio: (t) => 0.034 * Math.pow(1 - t, 0.8) + 0.002 });
    colorear(g, (t, u, c) => c.copy(COL.oscuro).lerp(COL.bronce, S(t, 0, 0.3)).lerp(COL.huesoVerde, S(t, 0.7, 1)));
    const m = new THREE.Mesh(g, mQuitina); m.castShadow = true;
    piv.add(m); cabeza.add(piv);
    quel.push({ piv, lado });
    const col = new THREE.Mesh(pua(0.1, 0.016, 0.3, 8), mQuitina);
    colocar(col, puntoElip(E_ca, 0.7, Math.PI * 0.55 * lado, 0.95), V(lado * 0.3, -0.8, 0.5), V(0, 0, 1));
    cabeza.add(col);
  }
  // brazos pequeños con dedos en gancho
  const bracitos = [];
  for (const lado of [-1, 1]) {
    const h = new THREE.Group(); h.position.copy(espina.getPointAt(0.5)).add(V(lado * 0.17, 0, 0.13));
    h.rotation.set(1.9, 0, -0.35 * lado);
    h.add(new THREE.Mesh(hueso(0.34, 0.045, 0.038, 0.02, lado * 11, 0.03, true), mQuitina)); h.add(junta(0.05));
    const c2 = new THREE.Group(); c2.position.y = 0.34; c2.rotation.x = -1.2; h.add(c2); c2.add(junta(0.045));
    c2.add(new THREE.Mesh(hueso(0.28, 0.038, 0.03, -0.02, lado * 13, 0.03, true), mQuitina));
    for (const dz of [-0.03, 0, 0.03]) {
      const d = new THREE.Mesh(garra(0.13, 0.014, 0.05, dz * 100, true), mQuitina);
      d.position.set(dz, 0.28, 0); d.rotation.x = 0.6; c2.add(d);
    }
    superior.add(h); bracitos.push({ h, c2, lado });
  }
  await cuadro();

  /* ---------------- Guadañas dorsales ---------------- */
  progreso('Guadañas');
  const POSE = {
    alta: { yaw: 0.3, ax: -0.6, az: -0.18, c1: 0.75, c2: 0.8, c3: 1.25 },
    lateral: { yaw: 0.85, ax: -0.25, az: -0.75, c1: 0.55, c2: 0.65, c3: 1.1 },
    mantis: { yaw: 0.25, ax: 0.15, az: -0.25, c1: 0.55, c2: 1.15, c3: 1.35 },
  }[cfg.guadana];
  function hoja(L, ancho, curva, semilla) {
    // hoja curva: ancha junto a la base, angosta y afilada en la punta, con estrías
    const g = garra(L, ancho, curva, semilla, true);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) * 0.42);
    g.computeVertexNormals();
    return g;
  }
  const brazos = [];
  for (const lado of [-1, 1]) {
    const asim = lado > 0 ? 0.08 : -0.04;
    const hombro = new THREE.Group();
    hombro.position.copy(espina.getPointAt(0.82)).add(V(lado * 0.17, 0.02, -0.14));
    hombro.rotation.y = POSE.yaw * lado;
    const alza = new THREE.Group(); alza.rotation.set(POSE.ax + asim, 0, POSE.az * lado); hombro.add(alza);
    alza.add(junta(0.15));
    const s1 = new THREE.Mesh(hueso(0.38, 0.14, 0.13, 0.02, lado * 3, 0.03, true), mQuitina); s1.castShadow = true; alza.add(s1);
    const c1 = new THREE.Group(); c1.position.y = 0.38; c1.rotation.x = POSE.c1 + asim; alza.add(c1); c1.add(junta(0.12));
    const s2 = new THREE.Mesh(hueso(0.75, 0.105, 0.1, 0.08, lado * 5, 0.04, true), mQuitina); s2.castShadow = true; c1.add(s2);
    const c2 = new THREE.Group(); c2.position.y = 0.75; c2.rotation.x = POSE.c2 - asim; c1.add(c2); c2.add(junta(0.1));
    const s3 = new THREE.Mesh(hueso(0.95, 0.085, 0.085, -0.06, lado * 7, 0.04, true), mQuitina); s3.castShadow = true; c2.add(s3);
    for (const t of [0.3, 0.55]) { const e = new THREE.Mesh(pua(0.1 + 0.04 * R.azar(), 0.022, 0.5, 8), mQuitina); colocar(e, V(0, 0.95 * t, 0.07), V(0, 0.4, 1), V(0, 1, 0)); s3.add(e); }
    const c3 = new THREE.Group(); c3.position.y = 0.95; c3.rotation.x = POSE.c3 + asim * 2; c2.add(c3); c3.add(junta(0.08));
    const bl = new THREE.Mesh(hoja(0.95 + asim, 0.11, 0.3, lado * 9), mQuitina); bl.castShadow = true; c3.add(bl);
    superior.add(hombro);
    brazos.push({ c1, c3, lado, b1: POSE.c1 + asim, b3: POSE.c3 + asim * 2 });
  }
  await cuadro();

  /* ---------------- Estructura dorsal violeta ---------------- */
  progreso('Placas dorsales');
  const cPV = { base: new THREE.Color(0x642080), alto: new THREE.Color(0xc65cb6), hondo: new THREE.Color(0x1c0726) };
  function placaViva(pts, ancho, lateral, semilla, nseg = 6) {
    const curva = new THREE.CatmullRomCurve3(pts);
    const lat = lateral.clone().normalize();
    const Sup = (u, t, capa) => {
      const C = curva.getPointAt(t), Tg = curva.getTangentAt(t);
      const n = V().crossVectors(lat, Tg).normalize();
      const seg = 1 - 0.22 * Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * nseg), 14);
      const w = ancho * Math.pow(Math.max(0, 1 - t), 0.55) * seg * (1 + 0.12 * R.n3(semilla, t * 4, 0));
      return C.addScaledVector(lat, u * w * 0.5).addScaledVector(n, 0.026 * (1 - u * u) - (capa === 1 ? 0.03 : 0));
    };
    const colorEn = (u, t, capa) => {
      const nudo = Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * nseg), 14);
      const c = cPV.base.clone().lerp(cPV.alto, Math.exp(-u * u * 8) * 0.55 * (1 - nudo)).lerp(cPV.hondo, Math.pow(Math.abs(u), 5) * 0.7 + nudo * 0.6);
      if (capa === 1) c.multiplyScalar(0.4);
      if (capa === 2) c.lerp(cPV.hondo, 0.5);
      return c;
    };
    const m = new THREE.Mesh(lamina(Sup, colorEn, 10, 64), mQuitina); m.castShadow = true; return m;
  }
  const dorsal = new THREE.Group(); dorsal.name = 'Placas dorsales'; superior.add(dorsal);
  if (cfg.dorsal === 'abanico') {
    for (let k = 0; k < 8; k++) {
      const f = k / 7 - 0.5;
      const st = espina.getPointAt(0.5 + 0.38 * (1 - Math.abs(f) * 1.6)).add(V(f * 0.32, 0, -0.13));
      const pts = [st, st.clone().add(V(f * 0.3, 0.14, -0.3)), st.clone().add(V(f * 0.55, -0.22, -0.58)), st.clone().add(V(f * 0.68, -0.62 + 0.05 * Math.sin(k * 2.1), -0.66))];
      dorsal.add(placaViva(pts, 0.15 + 0.03 * Math.sin(k * 1.7), V(1, 0, f * 0.9), 40 + k));
    }
  } else if (cfg.dorsal === 'cresta') {
    for (const lado of [-1, 1]) for (let k = 0; k < 6; k++) {
      const st = espina.getPointAt(0.22 + k * 0.13).add(V(lado * 0.08, 0, -0.14));
      const h = 0.3 + 0.25 * Math.sin((k + 0.5) / 6 * Math.PI);
      const pts = [st, st.clone().add(V(lado * 0.04, h * 0.5, -0.2)), st.clone().add(V(lado * 0.12, h * 0.85, -0.42)), st.clone().add(V(lado * 0.2, h, -0.66))];
      dorsal.add(placaViva(pts, 0.2, V(0, 0.75, 0.66), 50 + k + lado * 9, 4));
    }
  } else {
    for (let k = 0; k < 11; k++) {
      const f = k / 10 - 0.5;
      const st = espina.getPointAt(0.84).add(V(f * 0.55, 0, -0.15));
      const pts = [st, st.clone().add(V(f * 0.2, 0.07, -0.22)), st.clone().add(V(f * 0.38, -0.32, -0.36)), st.clone().add(V(f * 0.46, -0.78 + 0.08 * Math.sin(k * 1.9), -0.3))];
      dorsal.add(placaViva(pts, 0.1, V(1, 0, 0), 60 + k, 7));
    }
  }
  await cuadro();

  /* ---------------- Patas ---------------- */
  progreso('Patas');
  const L1 = 0.82, L2 = 0.98;
  const patas = [];
  const defPatas = [[0.5, 0.95, 0.5, 0.95, 1.45], [0.6, 0.92, 0.02, 0.08, 1.45], [0.74, 0.86, -0.95, -0.72, 1.5]];
  let n = 0;
  for (const lado of [-1, 1]) for (const [hx, hy, hz, ang, D] of defPatas) {
    const cadera = V(lado * hx, hy, hz);
    const px = lado * hx + lado * Math.cos(ang) * D, pz = hz + Math.sin(ang) * D;
    const pie = V(px, suelo(px, pz), pz);
    const fuera = V(pie.x - cadera.x, 0, pie.z - cadera.z).normalize();
    const tobilloRel = V(-fuera.x * 0.06, 0.4, -fuera.z * 0.06);
    const Lt = tobilloRel.length();
    const semilla = n * 1.7 + 0.3;
    const mk = (g) => { const m = new THREE.Mesh(g, mQuitina); m.matrixAutoUpdate = false; m.castShadow = true; m.receiveShadow = true; grupo.add(m); return m; };
    const femur = mk(hueso(L1, 0.14, 0.14, 0.05, semilla, 0.05, true));
    const tibia = mk(hueso(L2, 0.11, 0.11, -0.05, semilla + 1, 0.05, true));
    const tarso = mk(garra(Lt, 0.1, 0.14, semilla + 2, true));
    const nE = 2 + (n % 2);
    for (let k = 0; k < nE; k++) {
      const t = 0.3 + 0.5 * k / nE + 0.08 * R.azar();
      const e = new THREE.Mesh(pua(0.08 + 0.1 * R.azar(), 0.03, 0.5, 9), mQuitina);
      colocar(e, V(0, L1 * t, 0.1 + 0.05 * t), V((R.azar() - 0.5) * 0.6, 0.45, 1), V(0, 1, 0)); e.castShadow = true; femur.add(e);
    }
    { const e = new THREE.Mesh(pua(0.18 + 0.06 * R.azar(), 0.045, 0.5, 10), mQuitina); colocar(e, V(0, 0.07, 0.07), V(0, -0.7, 0.7), V(0, -1, 0)); e.castShadow = true; tibia.add(e); }
    const juntas = [junta(0.16), junta(0.14), junta(0.11)];
    juntas.forEach((j) => { j.matrixAutoUpdate = false; grupo.add(j); });
    patas.push({ cadera, pie, fuera, tobilloRel, femur, tibia, tarso, juntas });
    n++;
  }
  await cuadro();

  /* ---------------- Peana negra con terreno ---------------- */
  progreso('Peana');
  {
    const perfil = [[0, 0], [BASE_R - 0.03, 0], [BASE_R, 0.03], [BASE_R + 0.02, 0.1], [BASE_R - 0.01, BASE_Y - 0.02], [BASE_R - 0.07, BASE_Y], [0, BASE_Y]].map(([a, b]) => new THREE.Vector2(a, b));
    const peana = new THREE.Mesh(new THREE.LatheGeometry(perfil, 180), new THREE.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }));
    peana.name = 'Peana'; peana.castShadow = true; peana.receiveShadow = true; grupo.add(peana);
  }
  {
    const anillos = 90, lados = 200, pos = [], col = [], idx = [];
    const tierra = new THREE.Color(0x261d12), barro = new THREE.Color(0x3a3020), musgo = new THREE.Color(0x4b5722);
    const RT = BASE_R - 0.06;
    for (let a = 0; a <= anillos; a++) {
      const rr = (a / anillos) * RT;
      for (let l = 0; l <= lados; l++) {
        const ang = (l / lados) * Math.PI * 2, x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
        const y = a === anillos ? BASE_Y + 0.004 : suelo(x, z) * (1 - S(rr, RT - 0.12, RT)) + (BASE_Y + 0.004) * S(rr, RT - 0.12, RT);
        pos.push(x, y, z);
        const c = tierra.clone().lerp(barro, THREE.MathUtils.clamp(0.5 + 2 * R.fbm(x * 1.5, 7, z * 1.5, 3), 0, 1));
        c.lerp(musgo, S(R.fbm(x * 2.2, 2, z * 2.2, 3), 0.12, 0.3) * 0.8);
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
    var mSuelo = organizar(new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, emissive: 0x000000 }), {
      clave: 'tierra4', fuerza: 0.05,
      relieve: 'h = 0.6*tl_fbm(q*8.0) + 0.4*smoothstep(0.0,0.5,tl_celdas(q*16.0));',
      tinte: 'diffuseColor.rgb *= 0.7 + 0.5*h;',
    });
    const m = new THREE.Mesh(g, mSuelo); m.name = 'Terreno'; m.receiveShadow = true; grupo.add(m);
  }
  {
    // piedras, restos de hueso y pequeños brotes
    const mPiedra = new THREE.MeshStandardMaterial({ color: 0x4a4438, roughness: 0.85 });
    const cerca = (x, z) => patas.some((pa) => Math.hypot(pa.pie.x - x, pa.pie.z - z) < 0.25);
    for (let k = 0; k < 26; k++) {
      const a = R.azar() * Math.PI * 2, rr = 0.6 + R.azar() * 1.7, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (cerca(x, z)) continue;
      const g = new THREE.IcosahedronGeometry(1, 1);
      const p = g.attributes.position, P = V();
      for (let i = 0; i < p.count; i++) { P.fromBufferAttribute(p, i); const d = 1 + 0.3 * R.n3(P.x * 1.7 + k, P.y * 1.7, P.z * 1.7); p.setXYZ(i, P.x * d, P.y * d * 0.6, P.z * d); }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mPiedra); const sc = 0.025 + 0.07 * Math.pow(R.azar(), 2);
      m.scale.setScalar(sc); m.position.set(x, suelo(x, z) + sc * 0.2, z); m.rotation.y = R.azar() * 6;
      m.castShadow = true; m.receiveShadow = true; grupo.add(m);
    }
    for (let k = 0; k < 7; k++) {
      const a = R.azar() * Math.PI * 2, rr = 0.9 + R.azar() * 1.3, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (cerca(x, z)) continue;
      const m = new THREE.Mesh(pua(0.12 + 0.12 * R.azar(), 0.018, 0.4, 8), mQuitina);
      colocar(m, V(x, suelo(x, z) + 0.01, z), V(Math.cos(a + 1.5), 0.12, Math.sin(a + 1.5)), V(0, 1, 0)); grupo.add(m);
    }
    for (let k = 0; k < 9; k++) {
      const a = R.azar() * Math.PI * 2, rr = 1.0 + R.azar() * 1.2, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (cerca(x, z)) continue;
      const sc = 0.03 + 0.04 * R.azar();
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mSaco); m.scale.set(sc, sc * 0.75, sc);
      m.position.set(x, suelo(x, z) + sc * 0.3, z); grupo.add(m);
    }
  }

  /* ---------------- Animación ---------------- */
  const materiales = [mQuitina, mCarne, mSaco, mSuelo, mJunta, mMemb];
  const H = V(), B = V(), T = V(), P = V(), polo = V();

  function actualizar(t, dt, { respirar = true } = {}) {
    const vivo = respirar ? 1 : 0;
    const b = respirar ? 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 3.6) : 0.35;
    for (const m of materiales) { const u = m.userData.uniforms; if (u) { u.uT.value = t; u.uPulso.value = b; } }
    cuerpo.position.y = 0.014 * (b - 0.35);
    cuerpo.updateMatrix();
    superior.rotation.x = 0.03 * Math.sin(t * 0.6) * vivo;
    superior.rotation.z = 0.02 * Math.sin(t * 0.37) * vivo;
    cabeza.rotation.set(0.05 * Math.sin(t * 0.9 + 1) * vivo, 0.14 * Math.sin(t * 0.43) * vivo, 0);
    dorsal.rotation.x = 0.025 * Math.sin(t * 0.8 + 0.4) * vivo;
    for (const br of brazos) {
      const f = t * 0.7 + (br.lado > 0 ? 0 : 1.3);
      br.c1.rotation.x = br.b1 + 0.05 * Math.sin(f) * vivo;
      br.c3.rotation.x = br.b3 + 0.08 * Math.sin(f - 0.8) * vivo;
    }
    for (const bz of bracitos) bz.c2.rotation.x = -1.2 + 0.2 * Math.sin(t * 1.7 + bz.lado) * vivo;
    for (const q of quel) q.piv.rotation.y = q.lado * (0.05 + 0.1 * Math.max(0, Math.sin(t * 2.4 + q.lado))) * vivo;
    for (const s of sacos) {
      const p = respirar ? 0.5 + 0.5 * Math.sin(t * 1.9 + s.fase) : 0.4;
      s.m.scale.set(s.r * (1 + 0.04 * p), s.r * (1 + 0.06 * p), s.r * (1 + 0.04 * p));
    }
    luzSacos.intensity = 0.9 + 1.2 * b;
    for (const pa of patas) {
      H.copy(pa.cadera).applyMatrix4(cuerpo.matrix);
      P.copy(pa.pie);
      T.copy(P).add(pa.tobilloRel);
      polo.copy(ARRIBA).addScaledVector(pa.fuera, 0.6);
      ik(H, T, L1, L2, polo, B);
      orientar(pa.femur, H, B, polo);
      orientar(pa.tibia, B, T, polo);
      orientar(pa.tarso, T, P, pa.fuera);
      orientar(pa.juntas[0], H, B, polo); orientar(pa.juntas[1], B, T, polo); orientar(pa.juntas[2], T, P, pa.fuera);
    }
  }
  actualizar(0, 0, { respirar: false });

  let tris = 0;
  grupo.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });

  return { grupo, actualizar, tris, objetivo: V(0, 1.2, 0) };
}

/* Variantes para comparar en el taller */
const NOMBRES = { a: 'guadañas altas', b: 'cresta de aletas', c: 'compacta' };
const DETALLE = {
  a: ['Variante A', 'Guadañas que se arquean muy alto sobre la cabeza, un abanico de placas violetas en la espalda y seis sacos en cuencas a los costados del abdomen.'],
  b: ['Variante B', 'Guadañas abiertas hacia los lados, una doble cresta de aletas violetas segmentadas por el lomo del torso, capucha con púas altas y los sacos en fila sobre el lomo del abdomen.'],
  c: ['Variante C', 'Cuello corto y cabeza baja, guadañas plegadas al frente como una mantis, una cortina de placas violetas colgando de los hombros y un racimo de sacos en la parte trasera.'],
};
export function variante(v) {
  return {
    ficha: { ...ficha, id: v === 'a' ? 'zancuda' : 'zancuda-' + v, numero: '02 · ' + v.toUpperCase(), nombre: 'Zancuda nodriza', partes: [DETALLE[v], ...ficha.partes.filter(([t]) => t !== 'Armadura' && t !== 'Presentación')] },
    construir: (o = {}) => construir({ ...o, variante: v }),
  };
}
