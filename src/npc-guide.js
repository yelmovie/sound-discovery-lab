import { openNpcScene } from './npc-scene.js';

export function mountNpcGuide(host,options){
  if(!host)return ()=>{};
  const trigger=document.createElement('button');trigger.type='button';trigger.className='npc-stage-button';
  trigger.textContent=options.title??'안내자 목소리 듣기';trigger.setAttribute('aria-haspopup','dialog');host.append(trigger);
  let close=null;
  trigger.onclick=()=>{close?.();close=openNpcScene({...options,trigger});};
  return ()=>{close?.();trigger.remove();};
}
