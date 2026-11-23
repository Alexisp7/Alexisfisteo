/* Cavidades de lectura sobre el tejido pintado; sólo se recalculan al distribuir. */
const RED_VIVA={carga:null,espera:new WeakSet()};
function coloniaTejido(st){
  const mundo=st?.querySelector('.colonia-mundo');
  if(!mundo?.clientWidth||!mundo.clientHeight)return;
  if(!RED_VIVA.spec){
    RED_VIVA.carga??=fetch('arte/red-biologica.json').then(r=>{if(!r.ok)throw Error('Especificación de red no disponible');return r.json();}).then(spec=>RED_VIVA.spec=spec);
    if(RED_VIVA.espera.has(st))return;
    RED_VIVA.espera.add(st);
    RED_VIVA.carga.then(()=>{RED_VIVA.espera.delete(st);if(st.isConnected)coloniaTejido(st);}).catch(err=>console.warn('Red biológica:',err));
    return;
  }
  const spec=RED_VIVA.spec,pal=spec.estilo.paleta_hex;
  const negro=/^#[0-9a-f]{6}$/i.test(pal.casi_negro||'')?pal.casi_negro:'#09050E';
  const opacidad=spec.capas.find(c=>c.id==='L2')?.opacidad_aproximada??.92;
  mundo.style.setProperty('--red-opacidad',Math.min(1,Math.max(0,opacidad)));
  let claridad='';
  for(const r of Object.values(coloniaMedir(st))){
    const q=r.label;
    claridad+=`<ellipse cx="${q.x+q.w/2}" cy="${q.y+q.h/2}" rx="${Math.max(35,q.w*.68)}" ry="${q.h*.85+5}" fill="url(#red-claridad)"/>`;
  }
  let svg=mundo.querySelector('.colonia-enganches');
  if(!svg){svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('colonia-enganches');svg.setAttribute('aria-hidden','true');mundo.insertBefore(svg,mundo.querySelector('.colonia-organismos'));}
  svg.setAttribute('viewBox','0 0 1774 887');svg.setAttribute('preserveAspectRatio','none');
  svg.innerHTML=`<defs><radialGradient id="red-claridad"><stop offset="0" stop-color="${negro}" stop-opacity=".97"/><stop offset=".55" stop-color="${negro}" stop-opacity=".86"/><stop offset="1" stop-color="${negro}" stop-opacity="0"/></radialGradient></defs>${claridad}`;
  mundo.dataset.redLista='true';
}
