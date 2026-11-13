// Unidad 01 · Huevo latente
// Saco luminoso que respira dentro de placas de quitina, sobre un montículo de biomasa con raíces.
import * as THREE from 'three';
import { crearRuido, organizar, tuboAfinado, PALETA, cuadro } from '../organico.js';

export const ficha = {
  id: 'huevo',
  numero: '01',
  nombre: 'Huevo latente',
  estado: 'Propuesta para revisar',
  partes: [
    ['Placas de quitina', 'Siete, de distinto alto; anillos de crecimiento, quilla central y poros. Se entreabren al respirar.'],
    ['Saco', 'Membrana húmeda que brilla en verde ácido desde dentro, con venas oscuras y una sombra que se mueve.'],
    ['Venas', 'Suben por las ranuras entre placas; un pulso las recorre de abajo hacia arriba.'],
    ['Raíces y montículo', 'Biomasa violeta con charcos de fluido, raíces que se afinan y se hunden, y brotes pequeños.'],
  ],
};

const EJE = new THREE.Vector3(0, 1, 0);
const ALTO = 1.05, ANCHO = 0.78, CENTRO = 1.12, INCLINA = 0.16;

// Superficie base del huevo: v=0 polo inferior, v=1 polo superior; θ alrededor del eje.
function puntoHuevo(theta, v, r = 1, out = new THREE.Vector3()) {
  const c = Math.cos(Math.PI * v);
  const y = CENTRO - ALTO * c;
  const anillo = Math.sin(Math.PI * v) * ANCHO * (1 + 0.1 * c) * r; // más ancho abajo
  const lean = INCLINA * (1 - c) * 0.5;
  return out.set(Math.cos(theta) * anillo + lean * 0.8, y, Math.sin(theta) * anillo + lean * 0.35);
}

// Altura del montículo (compartida por raíces y brotes)
function crearSuelo(R) {
  return (x, z) => {
    const r2 = x * x + z * z;
    return 0.34 * Math.exp(-r2 / 0.9) + 0.06 * R.fbm(x * 1.4, 0, z * 1.4, 4) + 0.03 * R.fbm(x * 5, 2, z * 5, 2) - 0.05 * Math.min(1, r2 / 6);
  };
}

export async function construir({ progreso = () => {} } = {}) {
  const R = crearRuido(7);
  const suelo = crearSuelo(R);
  const grupo = new THREE.Group();
  grupo.name = 'Huevo latente';
  const animables = [];

  /* ---------------- Saco interior ---------------- */
  progreso('Saco');
  const N = 7;
  const costuras = []; // ángulo de cada ranura entre placas
  const centros = [];
  for (let i = 0; i < N; i++) centros.push((i / N) * Math.PI * 2 + 0.22 * Math.sin(i * 2.7));
  for (let i = 0; i < N; i++) {
    let a = centros[i], b = centros[(i + 1) % N];
    if (b < a) b += Math.PI * 2;
    costuras.push((a + b) / 2);
  }
  const distCostura = (th) => {
    let m = 9;
    for (const s of costuras) { let d = Math.abs(((th - s + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < m) m = d; }
    return m;
  };

  const gSaco = new THREE.SphereGeometry(1, 180, 140);
  {
    const p = gSaco.attributes.position, P = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      P.fromBufferAttribute(p, k);
      const v = Math.acos(THREE.MathUtils.clamp(-P.y, -1, 1)) / Math.PI;
      const th = Math.atan2(P.z, P.x);
      const gap = Math.exp(-Math.pow(distCostura(th) / 0.16, 2)); // abulta entre placas
      const arriba = THREE.MathUtils.smoothstep(v, 0.55, 1.0);
      let r = 0.9 + 0.07 * gap * THREE.MathUtils.smoothstep(v, 0.25, 0.7) + 0.035 * R.fbm(P.x * 2.2, P.y * 2.2, P.z * 2.2, 3);
      r += 0.06 * arriba - 0.11 * Math.pow(THREE.MathUtils.smoothstep(v, 0.93, 1.0), 2); // ombligo arriba
      puntoHuevo(th, v, r, P);
      p.setXYZ(k, P.x, P.y, P.z);
    }
    gSaco.computeVertexNormals();
  }
  const mSaco = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x0e1406, roughness: 0.55, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.07, emissive: 0xffffff,
  }), {
    clave: 'saco', fuerza: 0.3,
    relieve: 'h = 0.5*tl_fbm(q*4.0);',
    brillo: `
      vec3 vv = normalize(vViewPosition);
      float fres = pow(1.0 - abs(dot(normal, vv)), 2.0);
      float vena = 1.0 - abs(tl_snoise(q*2.6 + vec3(0.0, uT*0.03, 0.0)));
      float vena2 = 1.0 - abs(tl_snoise(q*5.5 + 3.1));
      float venas = max(smoothstep(0.90, 0.985, vena), 0.7*smoothstep(0.93, 0.99, vena2));
      float sombra = smoothstep(0.05, 0.6, tl_snoise(q*1.25 + vec3(0.0, uT*0.11, uT*0.05)));
      float motas = smoothstep(0.42, 0.12, tl_celdas(q*4.2 + 1.7));
      vec3 acido = vec3(0.722, 0.961, 0.176);
      vec3 hondo = vec3(0.20, 0.55, 0.08);
      vec3 col = mix(hondo, acido, (1.0 - fres) * 0.85 + motas * 0.35);
      float e = (0.55 + 0.75 * (1.0 - fres)) * (0.75 + 0.45 * uPulso);
      e *= 1.0 - 0.7 * sombra;
      e *= 1.0 - 0.9 * venas;
      e *= 0.45 + 0.9 * motas;
      totalEmissiveRadiance = col * e * 0.62;
      totalEmissiveRadiance += vec3(0.57, 0.16, 0.91) * fres * 0.35 * (1.0 - venas*0.5);
    `,
  });
  const saco = new THREE.Mesh(gSaco, mSaco);
  saco.name = 'Saco';
  saco.position.set(0, 0, 0);
  // escala alrededor del centro del huevo
  const pivSaco = new THREE.Group(); pivSaco.position.set(INCLINA * 0.4, CENTRO, INCLINA * 0.17);
  saco.position.set(-INCLINA * 0.4, -CENTRO, -INCLINA * 0.17);
  pivSaco.add(saco); grupo.add(pivSaco);
  await cuadro();

  /* ---------------- Placas de quitina ---------------- */
  progreso('Placas de quitina');
  const mPlaca = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.58, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.3,
    sheen: 0.12, sheenColor: new THREE.Color(PALETA.secundario), sheenRoughness: 0.5, emissive: 0xffffff, side: THREE.DoubleSide,
  }), {
    clave: 'placa', fuerza: 0.35,
    relieve: 'h = 0.6*tl_fbm(q*7.0) - 0.5*smoothstep(0.16,0.04,tl_celdas(q*20.0));',
    tinte: 'diffuseColor.rgb *= 0.8 + 0.35*h; diffuseColor.rgb *= 1.0 - 0.6*smoothstep(0.16,0.04,tl_celdas(q*20.0));',
    brillo: `
      float borde = pow(abs(vUv2.x*2.0 - 1.0 - (vUv2.x > 1.5 ? 4.0 : 0.0)), 7.0);
      float dentro = vUv2.x > 1.5 ? 1.0 : 0.0;
      totalEmissiveRadiance = vec3(0.77, 0.29, 1.0) * borde * 0.22 * (0.6 + 0.4*uPulso) * (1.0 - dentro);
      totalEmissiveRadiance += vec3(0.45, 0.75, 0.12) * dentro * 0.16 * (0.6 + 0.6*uPulso);
    `,
  });

  const placas = [];
  const cBase = new THREE.Color(0x26102c), cQuilla = new THREE.Color(0x52245a), cPunta = new THREE.Color(0x7a2f9a), cHondo = new THREE.Color(0x0a040c);
  for (let i = 0; i < N; i++) {
    const th0 = centros[i];
    const prev = centros[(i - 1 + N) % N], next = centros[(i + 1) % N];
    const anchoMedio = (((next - prev + Math.PI * 4) % (Math.PI * 2))) / 4; // mitad del sector
    const vTop = 0.7 + 0.16 * (0.5 + 0.5 * Math.sin(i * 1.9 + 0.7));
    const vBot = 0.06, nu = 40, nv = 200;
    const abre = 0.12 + 0.1 * (0.5 + 0.5 * Math.cos(i * 2.3));
    const S = (u, v, capa) => {
      // u ∈ [-1,1] a lo ancho, v ∈ [vBot, vTop]
      const t = (v - vBot) / (vTop - vBot);
      const angosto = 1 - Math.pow(THREE.MathUtils.smoothstep(t, 0.35, 1.0), 1.25) * 0.97;
      const w = anchoMedio * 0.9 * angosto * (0.92 + 0.08 * Math.sin(t * 9 + i));
      const th = th0 + u * w + 0.06 * Math.sin(t * 3.5 + i) * t;
      const fb = (t * 15 + 0.6 * R.n3(i * 3.1, u * 1.5, t * 2)) % 1;
      const anillos = 0.028 * THREE.MathUtils.smoothstep(fb, 0, 0.12) * Math.pow(1 - fb, 1.6) * (1 - 0.5 * Math.abs(u));
      const quilla = 0.035 * Math.exp(-u * u * 14) * (0.4 + t);
      const comba = 0.07 * Math.cos(u * Math.PI / 2);
      const flare = abre * Math.pow(THREE.MathUtils.smoothstep(t, 0.5, 1.0), 2);
      const bulto = 0.03 * R.fbm(Math.cos(th) * 2.5, v * 5, Math.sin(th) * 2.5 + i, 3);
      const grosor = (0.012 + 0.05 * Math.cos(u * Math.PI / 2)) * (1 - 0.6 * t);
      let r = 0.99 + comba + anillos + quilla + flare + bulto;
      if (capa === 1) r -= grosor;
      return puntoHuevo(th, v, r);
    };
    // color por vértice: hondo en anillos, claro en la quilla, violeta hacia la punta
    const colorEn = (u, v) => {
      const t = (v - vBot) / (vTop - vBot);
      const c = cBase.clone().lerp(cQuilla, Math.exp(-u * u * 10) * 0.8);
      c.lerp(cPunta, Math.pow(t, 3) * 0.7);
      const fb = (t * 15 + 0.6 * R.n3(i * 3.1, u * 1.5, t * 2)) % 1;
      const surco = THREE.MathUtils.smoothstep(fb, 0, 0.1) * (1 - 0.6 * fb);
      c.lerp(cHondo, (1 - surco) * 0.75 + Math.pow(Math.abs(u), 6) * 0.2);
      return c;
    };
    const pos = [], col = [], uv = [], idx = [];
    const add = (P, c, a, b) => { pos.push(P.x, P.y, P.z); col.push(c.r, c.g, c.b); uv.push(a, b); return pos.length / 3 - 1; };
    const grid = (capa) => {
      const base = pos.length / 3;
      for (let j = 0; j <= nv; j++) for (let k = 0; k <= nu; k++) {
        const u = (k / nu) * 2 - 1, v = vBot + (vTop - vBot) * (j / nv);
        const c = colorEn(u, v); if (capa === 1) c.multiplyScalar(0.7);
        add(S(u, v, capa), c, (k / nu) + (capa === 1 ? 2 : 0), j / nv);
      }
      for (let j = 0; j < nv; j++) for (let k = 0; k < nu; k++) {
        const a = base + j * (nu + 1) + k, b = a + nu + 1;
        if (capa === 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    };
    grid(0); grid(1);
    // canto: une capa exterior e interior por los bordes izquierdo, derecho e inferior
    const canto = (puntos) => {
      const base = pos.length / 3;
      for (const [u, v] of puntos) {
        const c = colorEn(u, v).lerp(cPunta, 0.35);
        add(S(u, v, 0), c, Math.abs(u) > 0.99 ? (u < 0 ? 0 : 1) : 0.5, 0);
        add(S(u, v, 1), c, Math.abs(u) > 0.99 ? (u < 0 ? 0 : 1) : 0.5, 0);
      }
      for (let m = 0; m < puntos.length - 1; m++) { const a = base + m * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    const izq = [], der = [], abajo = [];
    for (let j = 0; j <= nv; j++) { const v = vBot + (vTop - vBot) * (j / nv); izq.push([-1, v]); der.push([1, v]); }
    for (let k = 0; k <= nu; k++) abajo.push([(k / nu) * 2 - 1, vBot]);
    canto(izq); canto(der.reverse()); canto(abajo.reverse());

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    // bisagra en la base de la placa
    const bis = puntoHuevo(th0, 0.16, 1.0);
    g.translate(-bis.x, -bis.y, -bis.z);
    const m = new THREE.Mesh(g, mPlaca);
    m.name = 'Placa ' + (i + 1);
    m.castShadow = true; m.receiveShadow = true;
    const piv = new THREE.Group(); piv.position.copy(bis); piv.add(m);
    const eje = new THREE.Vector3(-Math.sin(th0), 0, Math.cos(th0)).normalize();
    placas.push({ piv, eje, fase: i * 0.9 });
    grupo.add(piv);
    if (i % 2) await cuadro();
  }

  /* ---------------- Venas en las ranuras ---------------- */
  progreso('Venas');
  const mVena = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x3b1446, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0xffffff,
  }), {
    clave: 'vena', fuerza: 0.2,
    relieve: 'h = tl_snoise(q*18.0);',
    brillo: `
      float onda = pow(0.5 + 0.5*sin(vUv2.x*14.0 - uT*2.2), 10.0);
      totalEmissiveRadiance = vec3(0.57,0.16,0.91)*0.12 + vec3(0.72,0.96,0.18) * onda * (0.25 + 0.5*uPulso) * smoothstep(0.0, 0.15, vUv2.x);
    `,
  });
  const venas = new THREE.Group(); venas.name = 'Venas';
  costuras.forEach((s, i) => {
    const pts = [];
    // nace en el suelo, sube por la ranura y se abre sobre el saco
    const x0 = Math.cos(s) * 1.25, z0 = Math.sin(s) * 1.25;
    pts.push(new THREE.Vector3(x0, suelo(x0, z0) - 0.02, z0));
    const vFin = 0.82 + 0.12 * Math.sin(i * 3.1);
    for (let k = 0; k <= 9; k++) {
      const v = 0.1 + (vFin - 0.1) * (k / 9);
      const th = s + 0.05 * Math.sin(k * 1.3 + i) + (k > 6 ? (k - 6) * 0.07 * (i % 2 ? 1 : -1) : 0);
      pts.push(puntoHuevo(th, v, 0.985 + 0.02 * Math.sin(k + i)));
    }
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const g = tuboAfinado(curva, { tramos: 140, lados: 10, radio: (t) => 0.028 * (1 - t * 0.8) + 0.004 + 0.006 * Math.sin(t * 30 + i), ruido: R, rugosidad: 0.25 });
    const m = new THREE.Mesh(g, mVena); m.castShadow = true; venas.add(m);
  });
  grupo.add(venas);
  await cuadro();

  /* ---------------- Montículo de biomasa ---------------- */
  progreso('Biomasa');
  const gSuelo = new THREE.CircleGeometry(3.2, 220, 0, Math.PI * 2);
  {
    // CircleGeometry trae un solo anillo; se reconstruye como disco polar denso
    const anillos = 130, lados = 200, pos = [], col = [], idx = [], uv = [];
    const cerca = new THREE.Color(0x40173d), lejos = new THREE.Color(PALETA.fondo), oscuro = new THREE.Color(0x1e0c24);
    for (let a = 0; a <= anillos; a++) {
      const rr = Math.pow(a / anillos, 1.45) * 4.6;
      for (let l = 0; l <= lados; l++) {
        const ang = (l / lados) * Math.PI * 2;
        const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
        const y = suelo(x, z);
        pos.push(x, y, z); uv.push(x, z);
        const c = cerca.clone().lerp(oscuro, THREE.MathUtils.clamp(0.5 - 2.5 * R.fbm(x * 1.3, 5, z * 1.3, 3), 0, 1) * 0.7);
        c.lerp(lejos, THREE.MathUtils.smoothstep(rr, 1.3, 3.6));
        col.push(c.r, c.g, c.b);
      }
    }
    for (let a = 0; a < anillos; a++) for (let l = 0; l < lados; l++) {
      const i0 = a * (lados + 1) + l, i1 = i0 + lados + 1;
      idx.push(i0, i0 + 1, i1, i1, i0 + 1, i1 + 1);
    }
    gSuelo.dispose();
    var gS = new THREE.BufferGeometry();
    gS.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gS.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    gS.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    gS.setIndex(idx); gS.computeVertexNormals();
  }
  const mSuelo = organizar(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.7, clearcoat: 0.3, clearcoatRoughness: 0.35,
    sheen: 0.0, sheenColor: new THREE.Color(PALETA.primario), sheenRoughness: 0.6, emissive: 0xffffff,
  }), {
    clave: 'suelo', fuerza: 0.35,
    relieve: 'h = 0.6*tl_fbm(q*4.0) + 0.4*smoothstep(0.0,0.6,tl_celdas(q*9.0)); float ch = tl_fbm(q*1.1 + 4.0); h = mix(h, 0.2, smoothstep(0.3,0.36,ch));',
    tinte: `float charco = smoothstep(0.3, 0.36, tl_fbm(q*1.1 + 4.0)) * smoothstep(2.2, 0.8, length(q.xz));
            diffuseColor.rgb *= (0.7 + 0.5*h) * smoothstep(3.6, 0.9, length(q.xz));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03,0.07,0.01), charco);`,
    brillo: `float charco2 = smoothstep(0.3, 0.36, tl_fbm(q*1.1 + 4.0)) * smoothstep(2.2, 0.8, length(q.xz));
             float ond = 0.6 + 0.4*sin(uT*1.3 + q.x*3.0 + q.z*2.0);
             totalEmissiveRadiance = vec3(0.72,0.96,0.18) * charco2 * 0.16 * ond;`,
  });
  const montículo = new THREE.Mesh(gS, mSuelo);
  montículo.name = 'Biomasa'; montículo.receiveShadow = true;
  grupo.add(montículo);
  await cuadro();

  /* ---------------- Raíces ---------------- */
  progreso('Raíces');
  const mRaiz = organizar(new THREE.MeshPhysicalMaterial({
    color: 0x2a0f2f, roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.3,
    sheen: 0.25, sheenColor: new THREE.Color(PALETA.secundario), emissive: 0xffffff,
  }), {
    clave: 'raiz', fuerza: 0.3,
    relieve: 'h = 0.5*tl_fbm(q*8.0) + 0.25*sin(vUv2.x*70.0 + tl_snoise(q*5.0)*2.0);',
    tinte: 'diffuseColor.rgb *= 0.7 + 0.5*h;',
    brillo: 'totalEmissiveRadiance = vec3(0.57,0.16,0.91) * 0.05 * (1.0 - vUv2.x);',
  });
  const raices = new THREE.Group(); raices.name = 'Raíces';
  const nR = 11;
  for (let i = 0; i < nR; i++) {
    const a = (i / nR) * Math.PI * 2 + 0.3 * Math.sin(i * 4.1);
    const largo = 1.5 + 0.9 * (0.5 + 0.5 * Math.sin(i * 2.9));
    const pts = [puntoHuevo(a, 0.2, 0.97), puntoHuevo(a, 0.08, 1.02)];
    const pasos = 7;
    for (let k = 1; k <= pasos; k++) {
      const t = k / pasos;
      const rr = 0.75 + largo * t;
      const aa = a + 0.35 * Math.sin(t * 3 + i) * t;
      const x = Math.cos(aa) * rr, z = Math.sin(aa) * rr;
      pts.push(new THREE.Vector3(x, suelo(x, z) + 0.035 * (1 - t) - 0.06 * Math.pow(t, 3), z));
    }
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const grueso = 0.06 + 0.035 * (0.5 + 0.5 * Math.cos(i * 1.7));
    const g = tuboAfinado(curva, { tramos: 160, lados: 14, radio: (t) => grueso * Math.pow(1 - t, 1.3) + 0.006, ruido: R, rugosidad: 0.35 });
    const m = new THREE.Mesh(g, mRaiz); m.castShadow = true; m.receiveShadow = true; raices.add(m);
    // ramita lateral
    if (i % 2 === 0) {
      const t0 = 0.45, base = curva.getPointAt(t0);
      const dir = new THREE.Vector3(Math.cos(a + 1.2), 0, Math.sin(a + 1.2));
      const p2 = [];
      for (let k = 0; k <= 4; k++) {
        const x = base.x + dir.x * k * 0.18 + 0.05 * Math.sin(k + i), z = base.z + dir.z * k * 0.18;
        p2.push(new THREE.Vector3(x, suelo(x, z) + 0.01 - 0.02 * k / 4, z));
      }
      const g2 = tuboAfinado(new THREE.CatmullRomCurve3(p2), { tramos: 60, lados: 10, radio: (t) => grueso * 0.45 * (1 - t) + 0.004 });
      const m2 = new THREE.Mesh(g2, mRaiz); m2.castShadow = true; raices.add(m2);
    }
  }
  grupo.add(raices);
  await cuadro();

  /* ---------------- Brotes (sacos pequeños) ---------------- */
  progreso('Brotes');
  const brotes = new THREE.Group(); brotes.name = 'Brotes';
  const mBrote = mSaco.clone();
  organizar(mBrote, { clave: 'brote', fuerza: 0.5, relieve: 'h = tl_fbm(q*9.0);', brillo: `
      vec3 vv = normalize(vViewPosition);
      float fres = pow(1.0 - abs(dot(normal, vv)), 2.0);
      float motas = smoothstep(0.3, 0.05, tl_celdas(q*5.0));
      totalEmissiveRadiance = mix(vec3(0.2,0.5,0.06), vec3(0.72,0.96,0.18), 1.0 - fres) * (0.35 + 0.35*motas) * (0.7 + 0.3*sin(uT*2.0 + q.x*9.0));
      totalEmissiveRadiance += vec3(0.57,0.16,0.91) * fres * 0.4;` });
  const lugares = [[1.05, 0.4, 0.17], [1.25, 2.2, 0.12], [0.98, 3.4, 0.14], [1.4, 4.6, 0.09], [1.15, 5.5, 0.11]];
  for (const [rr, a, s] of lugares) {
    const g = new THREE.SphereGeometry(1, 48, 36);
    const p = g.attributes.position, P = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      P.fromBufferAttribute(p, k);
      const d = 1 + 0.12 * R.fbm(P.x * 2 + a, P.y * 2, P.z * 2, 3);
      p.setXYZ(k, P.x * d, P.y * d * 1.15, P.z * d);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mBrote);
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    m.position.set(x, suelo(x, z) + s * 0.55, z); m.scale.setScalar(s);
    m.rotation.set(0.3 * Math.sin(a), a, 0.25 * Math.cos(a));
    m.castShadow = true; brotes.add(m);
  }
  grupo.add(brotes);

  /* ---------------- Esporas ---------------- */
  const nE = 90, eDat = [];
  const gEsp = new THREE.IcosahedronGeometry(1, 1);
  const mEsp = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: true, toneMapped: false });
  const esporas = new THREE.InstancedMesh(gEsp, mEsp, nE);
  esporas.name = 'Esporas'; esporas.userData.noExportar = true;
  const verde = new THREE.Color(PALETA.acido).multiplyScalar(1.6), lila = new THREE.Color(PALETA.brillo).multiplyScalar(1.3);
  const ponerEspora = (k, inicio) => {
    const a = R.azar() * Math.PI * 2, rr = 0.35 + R.azar() * 1.7;
    eDat[k] = { x: Math.cos(a) * rr, z: Math.sin(a) * rr, y: inicio ? R.azar() * 3.2 : 0.25, v: 0.05 + R.azar() * 0.12, s: 0.004 + R.azar() * 0.008 };
    esporas.setColorAt(k, R.azar() < 0.7 ? verde : lila);
  };
  for (let k = 0; k < nE; k++) ponerEspora(k, true);
  const M4 = new THREE.Matrix4();
  grupo.add(esporas);

  /* ---------------- Luz interior ---------------- */
  const luz = new THREE.PointLight(PALETA.acido, 2, 5, 2);
  luz.position.set(INCLINA * 0.4, CENTRO + 0.1, INCLINA * 0.17);
  grupo.add(luz);

  const materiales = [mSaco, mPlaca, mVena, mSuelo, mRaiz, mBrote];

  // Respiración: periodo ~3.4 s; las placas siguen al saco con un leve retraso
  function actualizar(t, dt, { respirar = true } = {}) {
    const b = respirar ? 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 3.4) : 0.35;
    const b2 = respirar ? 0.5 - 0.5 * Math.cos(((t - 0.35) * Math.PI * 2) / 3.4) : 0.35;
    for (const m of materiales) { const u = m.userData.uniforms; u.uT.value = t; u.uPulso.value = b; }
    saco.parent.scale.set(1 + 0.02 * b, 1 + 0.032 * b, 1 + 0.02 * b);
    for (const p of placas) p.piv.quaternion.setFromAxisAngle(p.eje, -(0.012 + 0.035 * b2) * (1 + 0.25 * Math.sin(p.fase)));
    luz.intensity = 1.6 + 2.2 * b;
    for (let k = 0; k < nE; k++) {
      const e = eDat[k];
      e.y += e.v * dt; e.x += Math.sin(t * 0.7 + k) * 0.0015;
      if (e.y > 3.4) ponerEspora(k, false);
      const sc = e.s * Math.min(1, e.y * 2, (3.4 - e.y) * 2);
      M4.makeScale(sc, sc, sc).setPosition(e.x, e.y, e.z);
      esporas.setMatrixAt(k, M4);
    }
    esporas.instanceMatrix.needsUpdate = true;
    if (esporas.instanceColor) esporas.instanceColor.needsUpdate = true;
  }

  let tris = 0;
  grupo.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });

  return { grupo, actualizar, tris, objetivo: new THREE.Vector3(0.05, 0.85, 0.05) };
}
