import { missionScene } from './action-missions.js';
import { art } from './illustrations.js';
import { transferSound } from './samples.js';
import { lengths, media } from './data.js';
import { liveWave, rulerKey } from './manipulations.js';

import {sensorScenes,parts,rhythms,signals,sortOrders,melodies,mixes,situations,cases,solutionTools,roundOf,expectedProof,challengeRoundCount,checkChallenge} from './challenge-rules.js';
export {challengeRoundCount,cleanChallenge,checkChallenge,adjustmentCue,alignProof} from './challenge-rules.js';
import {alignProof} from './challenge-rules.js';

// 받침이 있으면 '이', 없으면 '가'.
const subject = word => (word.charCodeAt(word.length-1)-0xac00)%28 ? '이' : '가';
// '물속'은 한 낱말이라 붙여 쓴다.
const inside = m => m.id==='water' ? '물속' : `${m.label} 속`;
const forceName = n => ['','작게','보통 크기로','크게'][n];
const pitchName = n => lengths.find(x=>x.value===n)?.pitch || '낮음';
function resetRound(c){const proof=c.proof||[];for(const k of Object.keys(c))delete c[k];c.proof=proof;}
function award(id,c,proof,message){c.proof=[...(c.proof||[]),proof];resetRound(c);c.message=message;c.kind='success';return true;}

/** UI-only content uses the same trial definitions as validation and audio. */
export function challengeView(id,w,h) {
  const c=alignProof(id,w.challenge||{}),k=roundOf(id,c),done=checkChallenge(id,c);
  const {button:b,icon,toolGraphic,prop,wave}=h;
  const round=c.proof?.length||0;
  const control=(text,action,attrs='',cls='btn secondary')=>b(text,`challenge-${action}`,`data-round="${round}" ${attrs}`,cls);
  const choose=(text,value,selected)=>control(text,'select',`data-value="${value}" aria-pressed="${selected===value}"`,`choice ${selected===value?'selected':''}`);
  const scene=missionScene(id,c,challengeRoundCount(id));
  const object=tool=>`<span class="challenge-object-art">${toolGraphic(tool)}</span>`;
  const beat=(label,n,filled=false,pitch=null)=>`<span class="signal-tile ${filled?'filled':''} ${label==='쉼'?'is-rest':''}" aria-label="${n+1}번째 ${label}${filled?', 연주했어':''}"><svg class="signal-trace" viewBox="0 0 72 30" aria-hidden="true"><path d="${label==='쉼'?'M4 15H68':pitch!==null?`M4 ${pitch===6?6:pitch===12?15:24}H68`:'M4 15H12L18 5L26 25L34 5L42 25L50 5L58 15H68'}"/></svg><b>${label}${filled?' ✓':''}</b></span>`;
  const performance=(label,sequence)=>`<p class="performance-line"><b>${label}</b><span>${sequence||'—'}</span></p>`;
  if(done)return `<div class="challenge-shell challenge-complete round-success" data-challenge="${id}" data-round="${round}">${scene}<div class="success-emblem">${icon('check')}</div><h2>주민의 의뢰를 모두 해결했어!</h2>${h.summary?`<p class="challenge-summary">${h.summary}</p>`:''}<div class="challenge-complete-actions">${h.next?b(`${h.next} ${icon('arrow')}`,'continue','','btn primary lesson-next-inline'):''}${control('다시 도전','replay','','btn quiet')}</div></div>`;
  let body='';
  if(id==='parts'){
    // The picture itself is the instrument: tap it to ring, then tap the marker on the part that shakes.
    const p=parts[k];body=`<div class="part-scene"><div class="part-frame"><div class="part-stage ${c.heard?'is-ringing':''}">${control(`${art(p.art,'','part-art')}`,'listen',`aria-label="${p.name} 울려 보기"`,`part-ring challenge-object object-touch ${c.heard?'observed':''}`)}${p.answers.map((x,n)=>control(`<span class="pin-dot">${n+1}</span><span class="pin-label">${x}</span>`,'select',`data-value="${n}" aria-pressed="${c.selected===n}" aria-label="${n+1}번 ${x}" style="left:${p.pins[n][0]}%;top:${p.pins[n][1]}%"`,`part-pin ${c.selected===n?'selected':''}`)).join('')}</div></div><p class="part-caption"><b>${p.name}</b></p></div>`;
  }else if(id==='rhythm'){
    body=`<div class="rhythm-lab"><div class="challenge-object ${c.sounding?'pulse':''}">${object('fork')}</div><div class="rhythm-scope">${wave(c.sounding?.7:0,5,!c.sounding)}<span>${c.sounding?'울림 · 떨리는 중':'쉼 · 멈춘 상태'}</span></div></div><div class="sequence-console"><div class="pattern-slots signal-score" aria-label="목표 신호">${rhythms[k].map((x,n)=>beat(x,n,c.sequence?.[n]===x)).join('')}</div><div class="challenge-tools rhythm-actions">${control(`${icon('play')} 울리기`,'ring')}${control(`${icon('hand')} 쉼`,'rest')}${control('처음부터','clear','','btn quiet')}</div>${performance('내 신호',(c.sequence||[]).join(' → '))}</div>`;
  }else if(id==='signal'){
    // Swiping down the drum sets how hard it is hit; the meter shows the same three strengths for a tap or keyboard.
    const t=signals[k];body=`<div class="request-card"><h2>${t.name}에게 ${forceName(t.target)} 보내 줘</h2></div><div class="signal-lab swipe-lab" data-swipe="${c.force||0}"><button class="challenge-object strike-pad swipe-pad" data-action="challenge-strike" data-drag-kind="strike" data-strike-action="challenge-strike" aria-label="북을 아래로 쓸어 치기. 길게 쓸수록 세게 쳐져.">${object('drum')}<span class="swipe-hint" aria-hidden="true"><i></i>아래로 쓸어 치기</span></button><div class="swipe-meter" role="group" aria-label="치는 세기 고르기">${[3,2,1].map(n=>control(`<span class="swipe-bar" style="--n:${n}" aria-hidden="true"></span><b>${['','살살','보통','세게'][n]}</b><small>${['','짧게','중간','길게'][n]} 쓸기</small>`,'strike',`data-value="${n}" aria-pressed="${c.force===n}"`,`swipe-step ${c.force===n?'selected':''}`)).join('')}</div><div class="live-scope challenge-live-wave">${liveWave((c.force||1)/3,5)}</div></div>`;
  }else if(id==='sort'){
    body=`<div class="sort-cards">${sortOrders[k].map((v,n)=>`<div class="sound-parcel ${c.selected===n?'selected':''}">${control(`${art('sound-parcel','','concept-thumb')}<b class="parcel-title">${icon('play')} 상자 ${'ABC'[n]}${(c.listened||[]).includes(n)?' ✓':''}</b>`,'parcel',`data-value="${n}" data-drag-kind="parcel" aria-pressed="${c.selected===n}" aria-label="상자 ${'ABC'[n]} 듣고 옮기기"`,'drag-handle')}</div>`).join('')}</div><div class="sort-slots">${[0,1,2].map(n=>control(`<span class="slot-level" aria-hidden="true">${[0,1,2].map(j=>`<i class="${j<=n?'on':''}"></i>`).join('')}</span><b>${c.slots?.[n]!=null?`상자 ${'ABC'[c.slots[n]]}`:'＋'}</b><span>${['작은 소리','중간 소리','큰 소리'][n]}</span>`,'slot',`data-value="${n}" data-drop-kind="parcel" aria-label="${['작은 소리','중간 소리','큰 소리'][n]} 칸${c.slots?.[n]!=null?`, 상자 ${'ABC'[c.slots[n]]}`:', 비어 있음'}"`,`sort-slot ${c.slots?.[n]!=null?'filled':''}`)).join('')}</div>`;
  }else if(id==='melody'){
    // Compose by moving rulers into the melody slots; tapping a ruler fills the next empty slot.
    const seq=c.sequence||[];body=`<div class="sequence-console melody-console compose-console">${control(`${icon('play')} ${c.heard?'목표 다시 듣기':'목표 듣기'}`,'listen')}<div class="pattern-slots signal-score pitch-score" aria-label="목표 멜로디">${melodies[k].map((n,j)=>beat(pitchName(n),j,seq[j]===n,n)).join('')}</div><div class="melody-slots" aria-label="내 멜로디 칸">${melodies[k].map((_,j)=>{const v=seq[j]>0?seq[j]:0;return control(v?`<span class="slot-ruler" style="--len:${v/18}" aria-hidden="true"></span><b>${pitchName(v)}</b><small>${v} cm</small>`:`<b>${j+1}</b><small>자를 여기에</small>`,'note-slot',`data-value="${j}" data-drop-kind="note" aria-label="${j+1}번째 칸${v?`, ${pitchName(v)}. 누르면 비워`:', 비어 있음'}"`,`melody-slot ${v?'filled':''}`);}).join('')}</div></div><div class="length-options challenge-tools">${lengths.map(l=>control(`${rulerKey(l.value)}<b>${l.pitch}</b><small>${l.value} cm</small>`,'note',`data-value="${l.value}" data-drag-kind="note"`,'length-card key')).join('')}</div>`;
  }else if(id==='mix'){
    const t=mixes[k];body=`<div class="request-card sound-order"><h2><span>높낮이 <b>${pitchName(t.length)}</b></span><span>크기 <b>${forceName(t.force)}</b></span></h2></div><div class="mix-preview"><div class="mix-device">${rulerKey(c.length||18)}</div><div class="live-scope challenge-live-wave">${liveWave((c.force||1)/3,c.length===6?9:c.length===12?6:3)}</div></div><div class="mixer-controls slider-mixer"><section class="mixer-channel pitch-channel" role="group" aria-label="높낮이 조절"><h3 class="mixer-title">길이 <output data-param-output="length">${c.length||18} cm</output></h3><input id="mix-length" type="range" min="6" max="18" step="6" value="${c.length||18}" data-challenge-param="length" aria-label="떨리는 길이"><div class="range-ticks"><span>짧게</span><span>길게</span></div></section><section class="mixer-channel volume-channel" role="group" aria-label="소리 크기 조절"><h3 class="mixer-title">세기 <output data-param-output="force">${['','약하게','보통','세게'][c.force||1]}</output></h3><input id="mix-force" type="range" min="1" max="3" value="${c.force||1}" data-challenge-param="force" aria-label="튕기는 세기"><div class="range-ticks"><span>약하게</span><span>세게</span></div></section></div>${control(`${icon('play')} 연주하기`,'check','','btn primary')}`;
  }else if(id==='sensor'){
    const m=sensorScenes[k];body=`<div class="scene-question"><figure class="scene-figure">${art(m.art,m.text,'scene-art')}</figure><div class="scene-copy"><h2>${m.title}</h2><p>${m.text}</p><button class="sensor-grip" data-drag-kind="sensor" aria-label="감지기 잡아 옮기기">${prop('receiver','옮길 감지기')}</button></div></div><div class="sensor-zones medium-drop">${media.map(x=>control(`${icon(x.id)}<b>${x.label}</b><span class="sensor-indicator">${c.zone===x.id?prop('receiver','놓은 감지기'):'＋'}</span>`,'zone',`data-value="${x.id}" data-drop-kind="sensor" aria-pressed="${c.zone===x.id}"`,`sensor-zone ${x.id} ${c.zone===x.id?'selected':''}`)).join('')}</div>`;
  }else if(id==='classify'){
    const st=situations[k];body=`<div class="scene-question case-story path-source" data-drag-kind="path" aria-label="이야기를 전달 물질로 이어 보기"><figure class="scene-figure">${art(st.art,st.text,'scene-art')}</figure><div class="scene-copy"><p>${st.text}</p><div class="sound-path-mini" aria-hidden="true"><span>${icon('volume')} 소리</span><i>→</i><b>어떤 물질?</b><i>→</i><span>${icon('ear')} 듣는 곳</span></div></div></div><div class="medium-choices">${media.map(m=>control(`${icon(m.id)}<span>${m.label}</span>`,'zone',`data-value="${m.id}" data-drop-kind="path" aria-pressed="${c.zone===m.id}"`,`choice ${c.zone===m.id?'selected':''}`)).join('')}</div>`;
  }else if(id==='solutions'){
    const t=cases[k];body=`<div class="scene-question solution-target" data-drop-kind="solution"><figure class="scene-figure">${art(t.art,t.scene,'scene-art')}</figure><div class="scene-copy"><h2>${t.title}</h2><p>${t.scene}</p></div></div><div class="context-cards">${solutionTools.map(t=>control(`${art(`care-${t.id}`,'','concept-thumb')}<b>${t.name}${c.solution===t.id?' ✓':''}</b>`,'solution',`data-value="${t.id}" data-drag-kind="solution" aria-pressed="${c.solution===t.id}"`,`solution ${c.solution===t.id?'selected':''}`)).join('')}</div>`;
  }else if(id==='festival'){
    const music=c.music??3,announcement=c.announcement??1;
    body=`<div class="mixer-controls festival-controls slider-mixer"><section class="mixer-channel" role="group"><h3 data-resident="music" class="mixer-title resident-request ${music<=1?'satisfied':''}" aria-label="책 읽는 친구의 요청: 음악은 작게"><span>${music<=1?'✓':'○'}</span><b>음악 작게</b><output data-param-output="music">${['끔','작게','보통','크게'][music]}</output></h3>${art('care-volume','음악 스피커','concept-thumb')}<input id="festival-music" type="range" min="0" max="3" value="${music}" data-challenge-param="music" aria-label="음악 크기"><div class="range-ticks"><span>끔</span><span>크게</span></div></section><section class="mixer-channel" role="group"><h3 data-resident="announcement" class="mixer-title resident-request ${announcement>=2?'satisfied':''}" aria-label="축제 안내원의 요청: 안내 방송은 보통 이상"><span>${announcement>=2?'✓':'○'}</span><b>안내 보통 이상</b><output data-param-output="announcement">${['끔','작게','보통','크게'][announcement]}</output></h3>${prop('transmitter','안내 방송 장치')}<input id="festival-announcement" type="range" min="0" max="3" value="${announcement}" data-challenge-param="announcement" aria-label="안내 방송 크기"><div class="range-ticks"><span>끔</span><span>크게</span></div></section><section class="mixer-channel" role="group"><h3 data-resident="pads" class="mixer-title resident-request ${c.pads?'satisfied':''}" aria-label="이웃 교실의 요청: 의자 다리에 패드 붙이기"><span>${c.pads?'✓':'○'}</span><b>의자 패드</b></h3>${art('care-pad','패드를 붙인 의자 다리','concept-thumb')}${control(c.pads?'✓ 붙였어':'붙이기','pads',`aria-pressed="${!!c.pads}" aria-label="의자 다리에 패드 ${c.pads?'떼기':'붙이기'}"`,`choice ${c.pads?'selected':''}`)}${control(`${icon('play')} 전체 듣기`,'preview','','btn secondary')}</section></div>`;
  }
  // Raw drag sources and sliders carry the same round token as action buttons.
  body=body.replace(/<(button|input|div)\b[^>]*>/g,tag=>/data-(?:action|drag-kind|drop-kind|challenge-param)=/.test(tag)&&!tag.includes('data-round=')?tag.replace(/^<(\w+)/,`<$1 data-round="${round}"`):tag);
  return `<div class="challenge-shell ${c.kind==='success'?'round-success':''}" data-challenge="${id}" data-round="${round}">${scene}<div class="challenge-workspace">${body}</div></div>`;
}

export function runChallenge(id,w,action,data={},sound) {
  if(!expectedProof[id])return;
  const c=alignProof(id,w.challenge??={}),k=roundOf(id,c),v=data.value,n=Number(v);
  // Events from a replaced question cannot change its successor.
  if(data.round!==undefined&&Number(data.round)!==(c.proof?.length||0))return;
  if(action==='replay'){w.challenge={};sound.stop();return;}
  if(checkChallenge(id,c)||action==='check'&&id!=='mix')return;
  c.message='';c.kind='';
  const wrong=message=>{c.message=message;c.kind='hint';return false;};
  const finish=message=>award(id,c,expectedProof[id][k],message);
  const tone=(length=12,force=1)=>sound.play({frequency:lengths.find(l=>l.value===length)?.frequency||390,level:force/3,duration:.8});
  if(action==='clear'&&['rhythm','melody'].includes(id)){c.sequence=[];c.sounding=false;sound.stop();return;}

  if(id==='parts'){
    const p=parts[k];
    if(action==='listen'){c.heard=true;sound.play({frequency:p.sound==='fork'?520:230,kind:p.sound,level:.5});return;}
    if(action!=='select'||!Number.isInteger(n)||!p.answers[n])return;
    if(!c.heard)return wrong('먼저 물체를 눌러 울리고, 떨리는 곳을 관찰해 봐.');
    c.selected=n;
    return n===p.answer?finish(`맞아! ${p.answers[p.answer]}${subject(p.answers[p.answer])} 떨려.`):wrong('다시 울리기를 눌러. 고른 부분과 다른 부분이 어떻게 움직이는지 비교해 봐.');
  }
  if(id==='rhythm'){
    if(!['ring','rest'].includes(action))return;
    if((c.sequence||[]).length>=rhythms[k].length){c.sequence=[];c.sounding=false;}
    if(action==='rest'&&!c.sounding)return wrong('먼저 울려야 떨림을 멈출 수 있어.');
    const attempted=action==='ring'?'울림':'쉼',position=(c.sequence||[]).length;
    if(attempted!==rhythms[k][position]){return wrong('목표 신호와 내 신호의 같은 자리를 비교해 봐. 앞서 만든 신호는 그대로야.');}
    c.sounding=action==='ring';c.sequence=[...(c.sequence||[]),attempted];
    if(c.sounding)sound.play({frequency:520,kind:'fork',duration:c.sequence.length===rhythms[k].length?.65:4});else sound.stop();
    if(c.sequence.length<rhythms[k].length)return;
    return c.sequence.join(',')===rhythms[k].join(',')?finish('울림과 쉼의 신호가 도착했어!'):wrong('목표와 다른 박이 있어. 울리기를 누르면 처음부터 다시 연주해.');
  }
  if(id==='signal'){
    if(action==='force'){if([1,2,3].includes(n))c.force=n;return;}
    if(action!=='strike')return;
    if(v!==undefined&&![1,2,3].includes(n))return;
    c.force=v===undefined?c.force||1:n;
    sound.play({kind:'drum',frequency:150,level:c.force/3,duration:.7});
    return c.force===signals[k].target?finish('요청한 크기의 신호가 도착했어!'):wrong('세기를 바꾸고 북을 다시 쳐 줘. 높낮이는 그대로야.');
  }
  if(id==='sort'){
    if(['parcel','select'].includes(action)){
      if(![0,1,2].includes(n))return;
      c.selected=n;c.listened=[...new Set([...(c.listened||[]),n])];
      sound.play({kind:'drum',frequency:150,level:sortOrders[k][n]/3});
    }else if(action==='slot'){
      if(![0,1,2].includes(n))return;
      if(![0,1,2].includes(c.selected))return wrong('먼저 상자를 눌러 듣고, 놓을 칸을 골라 줘.');
      c.slots??=[];
      const previous=c.slots.indexOf(c.selected),replaced=c.slots[n];
      if(previous>=0)c.slots[previous]=replaced??null;
      c.slots[n]=c.selected;c.selected=undefined;
    }else return;
    if(![0,1,2].every(slot=>[0,1,2].includes(c.slots?.[slot])))return;
    if(new Set(c.listened||[]).size!==3)return wrong('아직 듣지 않은 상자도 눌러 들어 봐.');
    return [0,1,2].every(slot=>sortOrders[k][c.slots[slot]]===slot+1)?finish('작은 소리부터 순서대로 배달했어!'):wrong('크기 순서를 다시 들어 봐. 상자를 옮기면 서로 자리가 바뀌어.');
  }
  if(id==='melody'){
    if(action==='listen'){c.heard=true;sound.sequence(melodies[k].map(length=>({frequency:lengths.find(l=>l.value===length).frequency,level:.5})));return;}
    const size=melodies[k].length,full=q=>q.length===size&&q.every(x=>x>0);
    if(action==='note-slot'){
      if(!Number.isInteger(n)||n<0||n>=size||!(c.sequence?.[n]>0))return;
      c.sequence=[...c.sequence];c.sequence[n]=0;while(c.sequence.length&&!(c.sequence.at(-1)>0))c.sequence.pop();return;
    }
    if(action!=='note'||![6,12,18].includes(n))return;
    if(!c.heard)return wrong('목표 멜로디를 먼저 듣고 만들어 줘.');
    const slot=Number(data.slot),seq=[...(c.sequence||[])];
    if(Number.isInteger(slot)&&slot>=0&&slot<size){while(seq.length<slot)seq.push(0);seq[slot]=n;c.sequence=seq;}
    else if(full(seq))c.sequence=[n];
    else{const gap=seq.findIndex(x=>!(x>0));if(gap>=0)seq[gap]=n;else seq.push(n);c.sequence=seq;}
    tone(n,1.5);
    if(!full(c.sequence))return;
    return c.sequence.join(',')===melodies[k].join(',')?finish('멜로디 편지가 도착했어!'):wrong('목표와 다른 칸이 있어. 칸을 눌러 비우거나 다른 자를 끌어다 바꿔 봐.');
  }

  if(id==='mix'){
    if(action==='length'){if([6,12,18].includes(n))c.length=n;return;}
    if(action==='force'){if([1,2,3].includes(n))c.force=n;return;}
    if(action!=='check')return;
    tone(c.length||18,c.force||1);
    return (c.length||18)===mixes[k].length&&(c.force||1)===mixes[k].force?finish('높낮이와 크기를 따로 조절했어!'):wrong('길이는 높낮이, 튕기는 세기는 크기를 바꿔. 두 조건을 나누어 살펴봐.');
  }
  if(id==='sensor'||id==='classify'){
    if(action!=='zone'||!media.some(m=>m.id===v))return;
    c.zone=v;const expected=id==='sensor'?sensorScenes[k].id:situations[k].answer;
    if(v!==expected)return wrong(id==='sensor'?'그림에서 소리가 난 곳과 듣는 곳 사이에 무엇이 있는지 찾아봐.':'소리를 내는 곳과 듣는 곳 사이에 있는 물질을 다시 살펴봐.');
    sound.play(transferSound(expected));
    return finish(`${media.find(m=>m.id===expected).label}${expected==='water'?'을':'를'} 통해 소리가 도착했어!`);
  }
  if(id==='solutions'){
    const loud={kind:'drum',frequency:160,level:.7};
    if(action==='before'){c.before=true;sound.sequence([loud,loud]);return;}
    if(action!=='solution'||!solutionTools.some(tool=>tool.id===v))return;
    // One choice plays the before → after pair, so the comparison stays without three separate presses.
    c.solution=v;c.before=true;c.after=true;c.afterKey=v;
    const right=v===cases[k].answer,after={...loud,level:right?(v==='time'?0:.2):.7};
    sound.sequence([loud,loud,after,after]);
    return right?finish(v==='time'?'적용 후: 독서 시간에는 조용해! 북 연습은 약속한 다음 시간에 해.':`적용 후 소리가 줄었어! ${cases[k].why}`):wrong('적용 전과 후 소리가 똑같이 커. 누가, 언제, 어디에서 불편한지 보고 다른 도구를 골라 봐.');
  }
  if(id==='festival'){
    if(action==='preview'){sound.sequence([{kind:'music',frequency:220,level:(c.music??3)/5},{kind:'fork',frequency:660,level:(c.announcement??1)/5},{kind:'drum',frequency:140,level:c.pads?.07:.4}]);return;}
    if(['music','announcement'].includes(action)){
      if(![0,1,2,3].includes(n))return;
      c[action]=n;sound.play({kind:action==='music'?'music':'fork',frequency:action==='music'?220:660,level:n/5,duration:.6});
    }else if(action==='pads'){c.pads=!c.pads;sound.play({kind:'drum',frequency:140,level:c.pads?.07:.4});}
    else return;
    if((c.music??3)<=1&&(c.announcement??1)>=2&&c.pads===true)return finish('필요한 안내도 들리고, 조용히 읽을 수도 있어!');
    c.message='전체 듣기를 눌러 지금 소리를 확인해. 아직 표시가 안 된 주민 요청과 비교해 봐.';
  }
}
