/* Geometría estática: cordones de quitina, fibras y suturas, sin filtros animados. */
function coloniaRelaciones(topics, posiciones) {
  const porId = new Map(topics.map(t => [t.id, t]));
  const enlaces = [];
  for (const destino of topics) {
    if (!posiciones[destino.id]) continue;
    const visitar = (id, via = [], vistos = new Set([destino.id])) => {
      if (vistos.has(id)) return;
      if (posiciones[id]) {
        if (!enlaces.some(e => e.a === id && e.b === destino.id))
          enlaces.push({ a: id, b: destino.id, via, afin: false });
        return;
      }
      const siguientes = new Set([...vistos, id]);
      for (const pre of porId.get(id)?.pre || []) visitar(pre, [...via, id], siguientes);
    };
    destino.pre.forEach(id => visitar(id));
  }
  // Herramienta matemática para el potencial: afinidad, no requisito del temario.
  if (posiciones.vcom && posiciones.gauss)
    enlaces.push({ a: 'vcom', b: 'gauss', via: [], afin: true });
  return enlaces;
}

// Puertos de las siluetas PNG de fase 3: izquierda, derecha, arriba y abajo.
// Coordenadas relativas al archivo original; no al centro del botón ni a su rótulo.
const COLONIA_ANATOMIA={
  cin:{size:[544,306],ports:[[.04,.91],[.91,.15],[.56,.02],[.62,.88]]},
  vrel:{size:[510,277],ports:[[.02,.74],[.94,.50],[.52,.05],[.74,.92]]},
  din:{size:[523,290],ports:[[.03,.44],[.98,.42],[.53,.02],[.55,.91]]},
  mcirc:{size:[468,329],ports:[[.02,.57],[.98,.63],[.49,.02],[.51,.98]]},
  osc:{size:[520,309],ports:[[.03,.52],[.98,.48],[.51,.08],[.53,.94]]},
  flu:{size:[541,320],ports:[[.02,.71],[.98,.24],[.52,.03],[.48,.94]]},
  cal:{size:[554,346],ports:[[.05,.48],[.98,.50],[.52,.01],[.56,.95]]},
  ter1:{size:[1714,918],ports:[[.036,.58],[.967,.50],[.54,.036],[.455,.953]]},
  tmp:{size:[491,301],ports:[[.03,.44],[.97,.28],[.55,.02],[.50,.91]]},
  ter2:{size:[494,296],ports:[[.02,.74],[.98,.35],[.67,.02],[.34,.94]]},
  circ:{size:[518,307],ports:[[.01,.58],[.99,.50],[.49,.02],[.49,.98]]},
  elec:{size:[534,361],ports:[[.03,.46],[.99,.53],[.45,.02],[.56,.97]]},
  ene:{size:[544,316],ports:[[.02,.66],[.99,.25],[.55,.03],[.47,.97]]},
  mom:{size:[520,300],ports:[[.02,.48],[.99,.43],[.37,.02],[.58,.97]]},
  equi:{size:[542,296],ports:[[.01,.52],[.99,.51],[.48,.08],[.51,.98]]},
  rot:{size:[532,333],ports:[[.02,.52],[.98,.48],[.52,.02],[.53,.96]]},
  gauss:{size:[477,310],ports:[[.02,.55],[.98,.44],[.55,.02],[.51,.98]]},
  mag:{size:[478,296],ports:[[.02,.50],[.98,.50],[.53,.02],[.51,.98]]},
  grav:{size:[508,310],ports:[[.02,.68],[.98,.36],[.55,.02],[.52,.98]]},
  ato:{size:[440,306],ports:[[.02,.25],[.98,.45],[.45,.02],[.57,.97]]},
  vcom:{size:[1245,1227],ports:[[.03,.56],[.97,.38],[.53,.02],[.49,.98]]}
};

function coloniaMedir(st){
  const root=(st.querySelector('.colonia-mundo')||st).getBoundingClientRect(),sx=1774/root.width,sy=887/root.height,medidas={};
  if(!root.width||!root.height)return medidas;
  for(const el of st.querySelectorAll('.colonia-nodo')){
    const id=el.dataset.id,anatomia=COLONIA_ANATOMIA[id],r=el.querySelector('.colonia-cuerpo').getBoundingClientRect();
    const k=Math.min(r.width/anatomia.size[0],r.height/anatomia.size[1]);
    const w=anatomia.size[0]*k,h=anatomia.size[1]*k;
    const nombre=el.querySelector('.colonia-nombre').getBoundingClientRect(),cuenta=el.querySelector('.colonia-cuenta').getBoundingClientRect();
    medidas[id]={x:(r.left+(r.width-w)/2-root.left)*sx,y:(r.top+(r.height-h)/2-root.top)*sy,w:w*sx,h:h*sy,
      label:{x:(nombre.left-root.left)*sx,y:(nombre.top-root.top)*sy,w:nombre.width*sx,h:(cuenta.bottom-nombre.top)*sy}};
  }
  return medidas;
}

function coloniaPuerto(id,objetivo,medidas){
  const r=medidas[id],cx=r.x+r.w/2,cy=r.y+r.h/2,dx=objetivo[0]-cx,dy=objetivo[1]-cy;
  let mejor;
  for(const [u,v] of COLONIA_ANATOMIA[id].ports){
    const x=r.x+u*r.w,y=r.y+v*r.h,ox=x-cx,oy=y-cy,l=Math.hypot(ox,oy);
    const score=(ox*dx+oy*dy)/l;
    if(!mejor||score>mejor.score)mejor={x,y,nx:ox/l,ny:oy/l,score};
  }
  return mejor;
}

// Dibujo anatómico estático: bifurcaciones abiertas, bordes de quitina y fibras internas.
function coloniaCordon(a,b,medidas,semilla,afin=false){
  if(!medidas[a]||!medidas[b])return '';
  const centro=id=>{const r=medidas[id];return [r.x+r.w/2,r.y+r.h/2];};
  const A=coloniaPuerto(a,centro(b),medidas),B=coloniaPuerto(b,centro(a),medidas);
  const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy);if(L<1)return '';
  const ux=dx/L,uy=dy/L,nx=-uy,ny=ux,handle=Math.min(90,Math.max(20,L*.32));
  const bez=(p,q,r,s,t)=>{const u=1-t;return [u*u*u*p[0]+3*u*u*t*q[0]+3*u*t*t*r[0]+t*t*t*s[0],u*u*u*p[1]+3*u*u*t*q[1]+3*u*t*t*r[1]+t*t*t*s[1]];};
  const curva=bow=>{
    const M=[(A.x+B.x)/2+nx*bow,(A.y+B.y)/2+ny*bow];
    return Array.from({length:49},(_,i)=>i<=24?
      bez([A.x,A.y],[A.x+A.nx*handle,A.y+A.ny*handle],[M[0]-ux*handle*.55,M[1]-uy*handle*.55],M,i/24):
      bez(M,[M[0]+ux*handle*.55,M[1]+uy*handle*.55],[B.x+B.nx*handle,B.y+B.ny*handle],[B.x,B.y],(i-24)/24));
  };
  const dentro=(p,r,pad)=>p[0]>r.x-pad&&p[0]<r.x+r.w+pad&&p[1]>r.y-pad&&p[1]<r.y+r.h+pad;
  let P,coste=Infinity;
  for(const bow of [0,35,-35,70,-70,110,-110,150,-150]){
    const puntos=curva(bow);let c=Math.abs(bow)*.025;
    for(let i=5;i<44;i+=2)for(const [id,r] of Object.entries(medidas)){
      if(id!==a&&id!==b&&dentro(puntos[i],r,9))c+=50;
      if(dentro(puntos[i],r.label,8))c+=35;
    }
    if(c<coste){coste=c;P=puntos;}
  }
  // La malla dibujada se curva siguiendo el tendón anatómico, sin estirar una tira recta entre centros.
  const piezas={cin:1,din:2,ene:3,mom:4,rot:5,equi:6,cal:3,tmp:4,ter1:2,ter2:6,circ:5,elec:1,gauss:3,mag:4,grav:2,osc:6,flu:5,vrel:4,mcirc:3,ato:6,vcom:7};
  const pieza=afin?7:piezas[a],sizes={1:[2172,724],2:[2172,724],3:[1086,328],4:[1079,354],5:[1086,361],6:[1084,352],7:[2145,179]};
  const [iw,ih]=sizes[pieza],n=24,sourceW=iw/n,ancho=afin?22:Math.min(66,Math.max(38,L*.22));
  let svg='';
  for(let j=0;j<n;j++){
    const p=P[j*2],q=P[j*2+2],cx=(p[0]+q[0])/2,cy=(p[1]+q[1])/2;
    const largo=Math.hypot(q[0]-p[0],q[1]-p[1])+1.1,angulo=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI;
    const t=(j+.5)/n,alto=ancho*(.3+.7*Math.pow(Math.sin(Math.PI*t),.6));
    svg+='<g transform="translate('+cx.toFixed(2)+' '+cy.toFixed(2)+') rotate('+angulo.toFixed(3)+')"><svg class="anatomia-dibujo" x="'+(-largo/2).toFixed(2)+'" y="'+(-alto/2).toFixed(2)+'" width="'+largo.toFixed(2)+'" height="'+alto.toFixed(2)+'" viewBox="'+(j*sourceW).toFixed(3)+' 0 '+sourceW.toFixed(3)+' '+ih+'" preserveAspectRatio="none" overflow="hidden"><image href="conexiones/C'+String(pieza).padStart(2,'0')+'.png" width="'+iw+'" height="'+ih+'"/></svg></g>';
  }
  return svg;
}
