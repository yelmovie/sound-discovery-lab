import {stages} from './data.js';
import {stageDone} from './model.js';
export function strikeSignalNote(state,stage,note){
 if(!stageDone(state,stage)||![0,1,2].includes(note))return false;
 const played=state.restoration?.[stage]??[];if(played.includes(note))return false;
 state.restoration={...state.restoration,[stage]:[...played,note]};return true;
}
export function mountSignalRestoration(host,state,save,play){
 const available=stages.map((_,i)=>i).filter(i=>stageDone(state,i));if(!host||!available.length)return;
 let stage=available.find(i=>(state.restoration?.[i]?.length??0)<3)??available[0];
 const panel=document.createElement('details');panel.className='signal-restoration';host.append(panel);
 function draw(){const played=state.restoration?.[stage]??[],done=played.length===3;
 panel.innerHTML=`<summary>♫ ${done?'축하 신호 완성':'세 음으로 축하 신호'} · ${played.length}/3</summary><div class="signal-work"><label>축하할 시설 <select aria-label="축하할 시설">${available.map(i=>`<option value="${i}" ${i===stage?'selected':''}>${stages[i].name}</option>`).join('')}</select></label><div class="signal-sky ${done?'celebrating':''}" aria-hidden="true"><span>♪</span><b>${done?'✦ 울림도시 ✦':'○ · ○ · ○'}</b><span>♫</span><div>${[0,1,2].map(i=>`<i class="${played.includes(i)?'lit':''}"></i>`).join('')}</div></div><div class="signal-keys">${['도','미','솔'].map((name,i)=>`<button data-note="${i}" class="${played.includes(i)?'played':''}" aria-pressed="${played.includes(i)}" aria-label="${name} 음 연주"><span aria-hidden="true">${['▥','♬','♩'][i]}</span><b>${name}</b><small>${played.includes(i)?'✓ 연주했어':'눌러 연주'}</small></button>`).join('')}</div><p role="status">${done?stages[stage].restored+' 세 음의 빛이 축하 신호가 됐어!':'세 건반을 하나씩 눌러 도·미·솔을 모아 줘. 소리가 꺼져 있어도 빛으로 보여.'}</p><button data-fold>지도 계속 보기</button></div>`;
 panel.querySelector('select').onchange=e=>{stage=+e.target.value;draw();panel.querySelector('select').focus();};
 panel.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{const note=+b.dataset.note;play([261.63,329.63,392][note]);if(strikeSignalNote(state,stage,note))save();draw();const key=panel.querySelector(`[data-note="${note}"]`);key.classList.add('struck');key.focus();});
 panel.querySelector('[data-fold]').onclick=()=>{panel.open=false;panel.querySelector('summary').focus();};
 }
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){panel.open=false;panel.querySelector('summary').focus();}});draw();
}
