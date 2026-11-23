/* Motion and interaction belong to the scene lifecycle, never to an endless DOM loop. */
const COLONIA_MOVIMIENTO={estreno:false,control:null};
const COLONIA_PERFILES={
 cal:'conveccion',tmp:'conveccion',ter1:'pulso',ter2:'conveccion',flu:'conveccion',
 circ:'impulso',elec:'campo',gauss:'campo',mag:'campo',
 cin:'flujo',vrel:'flujo',din:'pulso',ene:'flujo',mom:'impulso',
 mcirc:'orbita',grav:'orbita',ato:'orbita',osc:'pulso',equi:'pulso',rot:'orbita',vcom:'campo'
};
function coloniaMovimientoReducido(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
function coloniaRevelar(st,el,behavior='smooth'){
 const escena=st.coloniaEscena,v=st.querySelector('.colonia-ventana');
 const p=escena?.items.find(p=>p.el===el);if(!p||!v)return;
 const margenIzq=p.cy-p.cuerpo/2>escena.reserva.y?escena.reserva.x+escena.reserva.w+8:72;
 const derecha=v.clientWidth-24,izquierda=Math.min(margenIzq,Math.max(72,derecha-p.w-12));
 let destino=v.scrollLeft;
 if(p.x-destino<izquierda)destino=p.x-izquierda;
 else if(p.x+p.w-destino>derecha)destino=p.x+p.w-derecha;
 destino=Math.max(0,Math.min(v.scrollWidth-v.clientWidth,destino));
 if(Math.abs(destino-v.scrollLeft)>1){v.coloniaCancelarDesplazamiento?.();v.scrollTo({left:destino,behavior:coloniaMovimientoReducido()?'instant':behavior});}
}
function coloniaRevelarSeleccion(st){
 const el=st?.querySelector('.colonia-nodo[aria-pressed="true"]');if(el)coloniaRevelar(st,el);
}
function coloniaVecino(items,actual,dx,dy){
 let mejor=null,coste=Infinity;
 for(const p of items){
  if(p===actual)continue;
  const x=p.cx-actual.cx,y=p.cy-actual.cy,frente=x*dx+y*dy;
  if(frente<8)continue;
  const lateral=Math.abs(x*dy-y*dx),d=Math.hypot(x,y),c=d+lateral*2.8;
  if(c<coste){coste=c;mejor=p;}
 }
 return mejor;
}
function coloniaIniciarMovimiento(st){
 COLONIA_MOVIMIENTO.control?.abort();
 const control=new AbortController();COLONIA_MOVIMIENTO.control=control;
 const signal=control.signal,v=st.querySelector('.colonia-ventana'),nodes=[...st.querySelectorAll('.colonia-nodo')];
 const preferencia=matchMedia('(prefers-reduced-motion: reduce)');
 const hive=document.getElementById('v-hive');
 const visibilidad=()=>st.classList.toggle('colonia-dormida',document.hidden||preferencia.matches||!hive?.classList.contains('on'));
 const modo=new MutationObserver(visibilidad);if(hive)modo.observe(hive,{attributes:true,attributeFilter:['class','hidden']});
 signal.addEventListener('abort',()=>modo.disconnect(),{once:true});
 document.addEventListener('visibilitychange',visibilidad,{signal});preferencia.addEventListener('change',visibilidad,{signal});visibilidad();
 nodes.forEach((el,i)=>{
  el.dataset.movimiento=COLONIA_PERFILES[el.dataset.id]||'pulso';
  el.style.setProperty('--vida-periodo',(6.1+(i*1.37)%4.8).toFixed(2)+'s');
  el.style.setProperty('--vida-fase',(-i*.79).toFixed(2)+'s');
  const copia=el.querySelector('.colonia-vida').cloneNode(true);copia.classList.add('colonia-vida-secundaria');el.querySelector('.colonia-cuerpo').append(copia);
 });
 v.addEventListener('keydown',ev=>{
  const el=ev.target.closest('.colonia-nodo');if(!el)return;
  const direcciones={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(!direcciones[ev.key])return;
  ev.preventDefault();const items=st.coloniaEscena?.items||[],actual=items.find(p=>p.el===el);
  const siguiente=actual&&coloniaVecino(items,actual,...direcciones[ev.key]);
  if(siguiente){siguiente.el.inert=false;siguiente.el.focus({preventScroll:true});}
 },{signal});
 v.addEventListener('focusin',ev=>{const el=ev.target.closest('.colonia-nodo');if(el)coloniaRevelar(st,el);},{signal});
 document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!ev.defaultPrevented&&!document.querySelector('dialog[open]')&&document.getElementById('v-hive')?.classList.contains('on')){
   const close=document.querySelector('#side:not([hidden]) #closeSide');if(close){ev.preventDefault();close.click();}
  }
 },{signal});
 if(!COLONIA_MOVIMIENTO.estreno){
  COLONIA_MOVIMIENTO.estreno=true;
  const visibles=nodes.filter(el=>el.classList.contains('vida-activa'));
  if(!preferencia.matches)visibles.forEach(el=>el.querySelector('.colonia-cuerpo').classList.add('colonia-entrada-espera'));
  Promise.race([Promise.allSettled(visibles.map(el=>el.querySelector('.colonia-cuerpo>img').decode?.())),new Promise(resolve=>setTimeout(resolve,900))]).then(()=>{
   visibles.forEach(el=>el.querySelector('.colonia-cuerpo').classList.remove('colonia-entrada-espera'));
   if(signal.aborted||preferencia.matches)return;
   visibles.forEach((el,i)=>el.querySelector('.colonia-cuerpo').animate([
    {opacity:0,transform:'translateY(9px) scale(.965)'},{opacity:1,transform:'translateY(0) scale(1)'}
   ],{duration:560,delay:Math.min(i*38,190),fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'}));
  });
 }
}
function coloniaAnimarPanel(el,id){
 if(el.dataset.coloniaTema===id)return;
 el.dataset.coloniaTema=id;el.coloniaAnimacion?.cancel();
 if(!coloniaMovimientoReducido())el.coloniaAnimacion=el.animate([
  {opacity:.35,transform:'translateX(14px)'},{opacity:1,transform:'translateX(0)'}
 ],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});
}
