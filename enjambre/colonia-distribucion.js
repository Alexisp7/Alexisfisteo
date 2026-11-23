// Composición del lienzo compacto: centros de los cuerpos, independientes de los rótulos.
const COLONIA_ANCLAJES={
 cal:[270,160],tmp:[620,140],circ:[970,170],elec:[1320,145],gauss:[1665,180],mag:[2030,155],ato:[2400,165],
 ter1:[720,365],ter2:[1050,385],cin:[1380,355],din:[1710,375],ene:[2040,360],grav:[2380,380],vcom:[2670,350],
 flu:[720,625],vrel:[1050,637],mcirc:[1380,626],osc:[1710,638],mom:[2040,630],equi:[2370,637],rot:[2660,622]
};
function coloniaBuscarSitios(items,ancho,alto,reserva){
 const sx=ancho/2800,sy=(alto-62)/658;
 const puestos=items.map(item=>{
  const [u,v]=COLONIA_ANCLAJES[item.id];
  const inicio=Math.max(720*sx,reserva.x+reserva.w+item.w/2+28),fin=ancho-item.w/2-24;
  const cx=v>300?inicio+(u-720)/1950*(fin-inicio):u*sx,cy=62+(v-62)*sy;
  const arriba=v>550;
  return {...item,cx,cy,arriba,cruce:item.id,x:cx-item.w/2,y:cy-(arriba?item.h-item.cuerpo/2:item.cuerpo/2)};
 });
 return {ancho,alto,items:puestos};
}

function coloniaAcomodar(st) {
  if(!st || st.hidden || !st.clientWidth || !st.offsetHeight)return;
  const ventana=st.querySelector('.colonia-ventana'),mundo=st.querySelector('.colonia-mundo');
  if(!ventana||!mundo)return;
  const panel=document.getElementById('side'),panelAbierto=panel&&!panel.hidden;
  const espacioPanel=panelAbierto?panel.offsetWidth+48:0;
  ventana.style.right=espacioPanel+'px';
  st.style.setProperty('--mapa-inset-derecho',espacioPanel+'px');
  const ancho=ventana.clientWidth,alto=innerHeight;
  const anchoMapa=Math.max(2800,Math.ceil(st.clientWidth*1.65));
  const charW=st.clientWidth*600/1774,charH=st.clientWidth*444/1774;
  const charLeft=st.clientWidth*18/1774,platH=charW*1.388*2/3;
  const charTop=alto-platH+charH*.015;
  st.style.setProperty('--personaje-ancho',charW+'px');
  st.style.setProperty('--personaje-alto',charH+'px');
  st.style.setProperty('--personaje-izquierda',charLeft+'px');
  st.style.setProperty('--personaje-arriba',charTop+'px');
  st.style.setProperty('--plataforma-izquierda',(charLeft-charW*.135)+'px');
  st.style.setProperty('--plataforma-arriba',(alto-platH)+'px');
  st.style.setProperty('--plataforma-ancho',(charW*1.388)+'px');
  st.style.setProperty('--plataforma-alto',platH+'px');
  const reserva={x:-24,y:alto-platH-22,w:charLeft+charW*1.253+48,h:platH+44};
  st.style.setProperty('--personaje-borde',(reserva.x+reserva.w)+'px');
  st.style.setProperty('--personaje-zona-arriba',Math.max(62,reserva.y-45)+'px');
  const items=[...st.querySelectorAll('.colonia-nodo')].map(el=>{
    return {id:el.dataset.id,w:el.offsetWidth,h:el.offsetHeight,cuerpo:el.querySelector('.colonia-cuerpo').offsetHeight};
  });
  const sitio=coloniaBuscarSitios(items,anchoMapa,alto,reserva);
  st.style.height=alto+'px';
  st.parentElement.style.overflowY='hidden';
  mundo.style.width=sitio.ancho+'px';
  mundo.style.height=alto+'px';
  for(const p of sitio.items){
    const el=st.querySelector('[data-id="'+p.id+'"]');
    el.classList.toggle('etiqueta-arriba',p.arriba);
    el.dataset.cruce=p.cruce;
    el.style.left=(p.x+el.offsetWidth/2)+'px';
    el.style.top=(p.y+el.offsetHeight/2)+'px';
    p.el=el;
  }
  st.coloniaEscena={items:sitio.items,reserva,personaje:{x:charLeft+charW*.53,y:charTop+charH*.62,rx:charW*.76,ry:charH*.82}};
  coloniaOcultarTrasPersonaje(st);
  coloniaTejido(st);
}

// Solo se consultan coordenadas ya calculadas: el scroll no vuelve a medir ni distribuir.
function coloniaOcultarTrasPersonaje(st){
  const escena=st.coloniaEscena,ventana=st.querySelector('.colonia-ventana');
  if(!escena||!ventana)return;
  const viewport=ventana.clientWidth,scroll=ventana.scrollLeft,enfocado=document.activeElement;
  for(const p of escena.items){
    const hero=escena.personaje;
    const izquierda=p.x-scroll,centroY=p.y+p.h/2;
    const distancia=Math.hypot((izquierda+p.w/2-hero.x)/hero.rx,(centroY-hero.y)/hero.ry);
    // El halo del personaje no debe desenfocar los temas que están por encima de él.
    const zonaPersonaje=Math.max(0,Math.min(1,(centroY-escena.reserva.y)/80));
    const juntoAlPersonaje=Math.max(0,Math.min(1,(1.18-distancia)/.36))*zonaPersonaje;
    const franjaIzquierda=55;
    const pasoIzquierdo=scroll>1?Math.max(0,Math.min(1,(franjaIzquierda-izquierda)/franjaIzquierda)):0;
    const paso=Math.max(pasoIzquierdo,juntoAlPersonaje);
    const opacidad=(1-paso)*(p.el.classList.contains('ajeno')?.32:1);
    const op=opacidad.toFixed(3),filtro=pasoIzquierdo>0?'blur('+(pasoIzquierdo*6).toFixed(2)+'px)':'';
    if(p.op!==op){p.el.style.opacity=op;p.op=op;}
    if(p.filtro!==filtro){p.el.style.filter=filtro;p.filtro=filtro;}
    const activa=izquierda+p.w>55&&izquierda<viewport-30&&opacidad>.15;
    if(p.activa!==activa){p.el.classList.toggle('vida-activa',activa);p.activa=activa;}
    const oculto=paso>.92&&enfocado!==p.el;
    if(p.el.inert!==oculto)p.el.inert=oculto;
  }
}

function coloniaDesplazamiento(st,anterior=0){
  const ventana=st.querySelector('.colonia-ventana');
  if(!ventana)return;
  ventana.scrollLeft=anterior;
  coloniaOcultarTrasPersonaje(st);
  let pendiente=false;
  ventana.addEventListener('scroll',()=>{
    if(pendiente)return;
    pendiente=true;
    requestAnimationFrame(()=>{pendiente=false;coloniaOcultarTrasPersonaje(st);});
  },{passive:true});
  let impulso=0,destino=anterior,previo=0;
  const cancelar=()=>{if(impulso)cancelAnimationFrame(impulso);impulso=0;destino=ventana.scrollLeft;previo=0;};
  ventana.coloniaCancelarDesplazamiento=cancelar;
  const avanzar=ahora=>{
    if(!ventana.isConnected||document.hidden){cancelar();return;}
    const dt=previo?Math.min(40,ahora-previo):16.67;previo=ahora;
    const falta=destino-ventana.scrollLeft;
    if(Math.abs(falta)<.6){ventana.scrollLeft=destino;impulso=0;previo=0;return;}
    ventana.scrollLeft+=falta*(1-Math.exp(-dt/68));
    impulso=requestAnimationFrame(avanzar);
  };
  ventana.addEventListener('pointerdown',cancelar,{passive:true});
  ventana.addEventListener('wheel',ev=>{
    if(ev.ctrlKey||Math.abs(ev.deltaX)>Math.abs(ev.deltaY)){cancelar();return;}
    const maximo=ventana.scrollWidth-ventana.clientWidth;if(maximo<=0)return;
    ev.preventDefault();
    const factor=ev.deltaMode===1?16:ev.deltaMode===2?ventana.clientWidth:1;
    const delta=ev.deltaY*factor;
    // El trackpad ya trae su propia inercia. Sólo se suavizan los pasos de una rueda.
    if(coloniaMovimientoReducido()||(ev.deltaMode===0&&Math.abs(ev.deltaY)<40)){
      cancelar();ventana.scrollLeft+=delta;return;
    }
    if(!impulso)destino=ventana.scrollLeft;
    destino=Math.max(0,Math.min(maximo,destino+delta));
    if(!impulso)impulso=requestAnimationFrame(avanzar);
  },{passive:false});
  ventana.addEventListener('keydown',ev=>{
    if(ev.target!==ventana||!['ArrowLeft','ArrowRight'].includes(ev.key))return;
    ev.preventDefault();
    cancelar();
    ventana.scrollBy({left:(ev.key==='ArrowRight'?1:-1)*ventana.clientWidth*.65,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
}
