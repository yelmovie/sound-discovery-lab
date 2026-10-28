import { rulerIllustration } from './illustrations.js';
/** Pointer Events provide the same manipulation on tablets, boards and mice.
 * Every drag also has the existing tap/keyboard path. Only pointerup commits.
 */
export function bindManipulations(root,{session,commit,unlock}){
 let drag=null,suppressUntil=0;
 const clear=()=>{drag?.ghost?.remove();root.querySelectorAll('.drop-ready,.drag-source').forEach(e=>e.classList.remove('drop-ready','drag-source'));drag=null;};
 root.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.isPrimary)return;
  const source=e.target.closest('[data-drag-kind]'),context=session();if(!source||!context||source.disabled)return;
  unlock();drag={source,session:context,id:e.pointerId,kind:source.dataset.dragKind,value:source.dataset.value,x:e.clientX,y:e.clientY,moved:false};
  source.setPointerCapture(e.pointerId);
 });
 root.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<9)return;
  e.preventDefault();
  if(!drag.moved){drag.moved=true;drag.source.classList.add('drag-source');drag.ghost=drag.source.cloneNode(true);drag.ghost.removeAttribute('id');drag.ghost.setAttribute('aria-hidden','true');drag.ghost.className='drag-ghost';drag.ghost.style.width=`${Math.min(190,drag.source.getBoundingClientRect().width)}px`;document.body.append(drag.ghost);}
  drag.ghost.style.left=`${e.clientX}px`;drag.ghost.style.top=`${e.clientY}px`;
  root.querySelectorAll('[data-drop-kind]').forEach(el=>el.classList.toggle('drop-ready',el.dataset.dropKind===drag.kind&&inside(el,e)));
 });
 root.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const current=drag;
  if(current.moved){
   e.preventDefault();suppressUntil=Date.now()+500;
   const target=[...root.querySelectorAll('[data-drop-kind]')].find(el=>el.dataset.dropKind===current.kind&&inside(el,e));
   clear();
   if(current.kind==='strike')commit([{action:current.source.dataset.strikeAction||'strike',value:String(Math.min(3,Math.max(1,Math.round(Math.abs(e.clientY-current.y)/42)+1)))}],current.session);
   else if(target){
    if(current.kind==='parcel')commit([{action:'challenge-parcel',value:current.value},{action:'challenge-slot',value:target.dataset.value}],current.session);
    else if(current.kind==='sensor'||current.kind==='path')commit([{action:'challenge-zone',value:target.dataset.value}],current.session);
    else if(current.kind==='solution')commit([{action:'challenge-solution',value:current.value}],current.session);
   }
  }else clear();
 });
 for(const type of ['pointercancel','lostpointercapture'])root.addEventListener(type,()=>{if(drag)clear();});
 root.addEventListener('click',e=>{if(Date.now()<suppressUntil&&(e.target===root||e.target.closest('[data-drag-kind]'))){suppressUntil=0;e.preventDefault();e.stopImmediatePropagation();}},true);
 root.addEventListener('keydown',e=>{if(e.key==='Escape')clear();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
}
function inside(el,e){const r=el.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}

export function liveWave(level=1,cycles=5){
 const points=Array.from({length:121},(_,i)=>`${i*2},${40+Math.sin(i/120*Math.PI*2*cycles)*level*27*Math.sin(i/120*Math.PI)}`).join(' ');
 return `<svg viewBox="0 0 240 80" aria-hidden="true"><path d="M0 40H240" stroke="#bed3c5"/><polyline points="${points}" fill="none" stroke="#208d91" stroke-width="3" stroke-linecap="round"/></svg>`;
}
export function rulerKey(length){return rulerIllustration(length);}
