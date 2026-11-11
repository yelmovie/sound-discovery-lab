import { missionScene } from './action-missions.js';
import { art } from './illustrations.js';
import { transferSound } from './samples.js';
import { lengths, media } from './data.js';
import { liveWave, rulerKey } from './manipulations.js';

const parts = [
  {tool:'drum',name:'작은 북',answers:['북의 막','북의 옆면','북채 손잡이'],answer:0,hint:'북채가 닿은 넓은 막을 살펴봐.'},
  {tool:'rubber',name:'고무줄 악기',answers:['나무 상자','팽팽한 고무줄','책상 다리'],answer:1,hint:'손가락으로 튕긴 부분을 살펴봐.'},
  {tool:'ruler',name:'책상에 고정한 자',answers:['고정한 책상','자를 누른 손','책상 밖으로 나온 자'],answer:2,hint:'책상 밖으로 나온 부분이 위아래로 움직여.'},
  {tool:'fork',name:'소리굽쇠',answers:['나무 받침대','위쪽 두 갈래','아래쪽 손잡이'],answer:1,hint:'U자 위쪽의 두 갈래를 살펴봐.'}
];
const rhythms = [['울림','쉼','울림'],['울림','쉼','울림','쉼'],['울림','쉼','울림','쉼','울림']];
const signals = [{name:'가까운 친구',target:1},{name:'멀리 있는 친구',target:3},{name:'가운데 줄 친구',target:2},{name:'조용한 시작 신호',target:1}];
const sortOrders = [[2,1,3],[3,2,1]];
const melodies = [[18,12,6],[6,12,18],[12,6,18,12]];
const mixes = [{length:6,force:1},{length:18,force:3},{length:12,force:1},{length:6,force:3}];
const situations = [
  {text:'운동장에서 친구의 목소리가 귀에 들려.',answer:'air'},
  {text:'물속에서 울린 종을 물속 감지기로 관찰했어.',answer:'water'},
  {text:'탁자 한쪽을 두드리고, 탁자에 댄 감지기로 들었어.',answer:'solid'},
  {text:'공연장에서 노랫소리가 관객의 귀에 들려.',answer:'air'},
  {text:'수중 마이크로 물속 돌이 부딪치는 소리를 들었어.',answer:'water'},
  {text:'종이컵 전화기의 팽팽한 실을 따라 소리가 전해졌어. 실은 어떤 물질일까?',answer:'solid'}
];
const cases = [
  {title:'의자를 끌 때마다 드르륵!',scene:'책 읽는 친구 옆에서 의자를 옮기고 있어.',answer:'pad',why:'의자 다리에 패드를 붙여 바닥에 긁히며 나는 소리를 줄였어.'},
  {title:'복도 음악이 너무 커!',scene:'옆 교실에서 발표하는 말이 잘 안 들려.',answer:'volume',why:'음악의 음량을 줄여 발표가 잘 들리게 했어.'},
  {title:'독서 시간과 북 연습이 겹쳐!',scene:'연습도 하고 싶고, 조용히 책도 읽고 싶어.',answer:'time',why:'서로의 시간을 맞추면 두 활동을 모두 할 수 있어.'},
  {title:'교실 문 바로 앞에서 응원해!',scene:'응원 장소를 옮길 수 있는 넓은 운동장이 있어.',answer:'place',why:'응원 장소를 교실에서 떨어진 곳으로 옮겼어.'}
];
const solutionTools = [{id:'pad',name:'패드 붙이기'},{id:'volume',name:'음량 줄이기'},{id:'time',name:'시간 바꾸기'},{id:'place',name:'장소 옮기기'}];
// 받침이 있으면 '이', 없으면 '가'.
const subject = word => (word.charCodeAt(word.length-1)-0xac00)%28 ? '이' : '가';
// '물속'은 한 낱말이라 붙여 쓴다.
const inside = m => m.id==='water' ? '물속' : `${m.label} 속`;
const forceName = n => ['','작게','보통 크기로','크게'][n];
const pitchName = n => lengths.find(x=>x.value===n)?.pitch || '낮음';
const expectedProof = {
  parts:parts.map(p=>String(p.answer)),rhythm:rhythms.map(p=>p.join(',')),
  signal:signals.map(s=>String(s.target)),sort:sortOrders.map(()=> '1,2,3'),
  melody:melodies.map(p=>p.join(',')),mix:mixes.map(p=>`${p.length},${p.force}`),
  sensor:media.map(m=>m.id),classify:situations.map(s=>s.answer),
  solutions:cases.map(c=>c.answer),festival:['balanced']
};
export const challengeRoundCount = id => expectedProof[id]?.length || 0;
export function cleanChallenge(raw) {
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return {};
  const c={};
  c.proof=Array.isArray(raw.proof)?raw.proof.filter(x=>typeof x==='string').map(x=>x.slice(0,50)).slice(0,6):[];
  for(const key of ['heard','tuneHeard','before','after','sounding','pads'])c[key]=raw[key]===true;
  for(const key of ['selected','force','length','music','announcement'])if(Number.isInteger(raw[key])&&raw[key]>=0&&raw[key]<=18)c[key]=raw[key];
  for(const key of ['zone','solution','afterKey'])if(typeof raw[key]==='string')c[key]=raw[key].slice(0,50);
  c.slots=Array.isArray(raw.slots)?raw.slots.slice(0,3).map(x=>Number.isInteger(x)&&x>=0&&x<=2?x:null):[];
  for(const key of ['sequence','listened'])c[key]=Array.isArray(raw[key])?raw[key].filter(x=>typeof x==='string'||Number.isInteger(x)).slice(0,6):[];
  // Feedback and a live oscillator are transient, never restored as running.
  c.sounding=false;
  return c;
}
export function checkChallenge(id,c={}) {
  const proof=expectedProof[id];
  return Boolean(proof && proof.every((value,i)=>c.proof?.[i]===value));
}
function roundOf(id,c){return Math.min(c.proof?.length||0,challengeRoundCount(id)-1);}
function resetRound(c){const proof=c.proof||[];for(const k of Object.keys(c))delete c[k];c.proof=proof;}
function award(id,c,proof,message){c.proof=[...(c.proof||[]),proof];resetRound(c);c.message=message;c.kind='success';return true;}

// Guidance reads the same request as validation, without changing an answer.
export function adjustmentCue(id, c = {}) {
  const round = roundOf(id, c);
  if (id === 'signal') {
    return (c.force || 1) === signals[round].target
      ? { text: '세기를 맞췄다면 북을 눌러 신호를 보내 봐.', target: '[data-action="challenge-strike"]' }
      : { text: '친구가 요청한 크기를 보고, 치는 세기 손잡이를 움직여 봐.', target: '#signal-force' };
  }
  if (id === 'mix') {
    if ((c.length || 18) !== mixes[round].length) {
      return { text: '먼저 길이 손잡이로 주문한 높낮이를 맞춰 봐.', target: '#mix-length' };
    }
    if ((c.force || 1) !== mixes[round].force) {
      return { text: '이제 세기 손잡이로 주문한 소리 크기를 맞춰 봐.', target: '#mix-force' };
    }
    return { text: '두 손잡이를 맞췄다면 연주하기를 눌러 들어 봐.', target: '[data-action="challenge-check"]' };
  }
  if (id === 'sort') {
    const unheard = [0, 1, 2].find(index => !(c.listened || []).includes(index));
    if (unheard !== undefined) {
      return { text: `먼저 상자 ${'ABC'[unheard]}를 눌러 들어 봐. 세 상자의 크기를 비교해.`, target: `[data-action="challenge-parcel"][data-value="${unheard}"]` };
    }
    return Number.isInteger(c.selected)
      ? { text: `상자 ${'ABC'[c.selected]}를 놓을 크기 칸을 눌러 줘.`, target: '[data-action="challenge-slot"]' }
      : { text: '옮길 상자를 누르고, 작은·중간·큰 소리 칸을 눌러 줘.', target: '[data-action="challenge-parcel"]' };
  }
  return null;
}

/** UI-only content uses the same trial definitions as validation and audio. */
export function challengeView(id,w,h) {
  const c=w.challenge||{},k=roundOf(id,c),done=checkChallenge(id,c);
  const {button:b,icon,toolGraphic,prop,wave}=h;
  const round=c.proof?.length||0;
  const control=(text,action,attrs='',cls='btn secondary')=>b(text,`challenge-${action}`,`data-round="${round}" ${attrs}`,cls);
  const choose=(text,value,selected)=>control(text,'select',`data-value="${value}" aria-pressed="${selected===value}"`,`choice ${selected===value?'selected':''}`);
  const scene=missionScene(id,c,challengeRoundCount(id));
  const object=tool=>`<span class="challenge-object-art">${toolGraphic(tool)}</span>`;
  const beat=(label,n,filled=false,pitch=null)=>`<span class="signal-tile ${filled?'filled':''} ${label==='쉼'?'is-rest':''}" aria-label="${n+1}번째 ${label}${filled?', 연주했어':''}"><svg class="signal-trace" viewBox="0 0 72 30" aria-hidden="true"><path d="${label==='쉼'?'M4 15H68':pitch!==null?`M4 ${pitch===6?6:pitch===12?15:24}H68`:'M4 15H12L18 5L26 25L34 5L42 25L50 5L58 15H68'}"/></svg><b>${label}${filled?' ✓':''}</b></span>`;
  const performance=(label,sequence)=>`<p class="performance-line"><b>${label}</b><span>${sequence||'—'}</span></p>`;
  if(done)return `<div class="challenge-shell challenge-complete round-success" data-challenge="${id}" data-round="${round}">${scene}<div class="success-emblem">${icon('check')}</div><h2>주민의 의뢰를 모두 해결했어!</h2>${h.summary?`<p class="challenge-summary">${h.summary}</p>`:''}${control('다시 도전','replay','','btn quiet')}</div>`;
  let body='';
  if(id==='parts'){
    const p=parts[k];body=`<div class="hotspot-scene"><button class="challenge-object object-touch ${c.heard?'observed':''}" data-action="challenge-listen" aria-label="${p.name} 직접 울려 보기">${object(p.tool)}<span class="object-caption">${p.name} · ${c.heard?'✓ 다시 울리기':'울려 보기'}</span></button></div><div class="challenge-tools labelled-choices" aria-label="떨리는 부분 선택">${p.answers.map((x,n)=>choose(`<span class="answer-marker">${n+1}</span><span>${x}</span>`,n,c.selected)).join('')}</div>`;
  }else if(id==='rhythm'){
    body=`<div class="rhythm-lab"><div class="challenge-object ${c.sounding?'pulse':''}">${object('fork')}</div><div class="rhythm-scope">${wave(c.sounding?.7:0,5,!c.sounding)}<span>${c.sounding?'울림 · 떨리는 중':'쉼 · 멈춘 상태'}</span></div></div><div class="sequence-console"><div class="pattern-slots signal-score" aria-label="목표 신호">${rhythms[k].map((x,n)=>beat(x,n,c.sequence?.[n]===x)).join('')}</div><div class="challenge-tools rhythm-actions">${control(`${icon('play')} 울리기`,'ring')}${control(`${icon('hand')} 쉼`,'rest')}${control('처음부터','clear','','btn quiet')}</div>${performance('내 신호',(c.sequence||[]).join(' → '))}</div>`;
  }else if(id==='signal'){
    const t=signals[k];body=`<div class="request-card"><h2>${t.name}에게 ${forceName(t.target)} 보내 줘</h2></div><div class="signal-lab"><button class="challenge-object strike-pad" data-action="challenge-strike" data-drag-kind="strike" data-strike-action="challenge-strike" aria-label="북을 두드리거나 아래로 쓸어 신호 보내기">${object('drum')}<span class="object-caption">북을 쳐서 전송</span></button><div class="signal-controls"><label for="signal-force">치는 세기 <output data-param-output="force">${['','약하게','보통','세게'][c.force||1]}</output></label><input id="signal-force" type="range" min="1" max="3" value="${c.force||1}" data-challenge-param="force" aria-label="치는 세기"><div class="range-ticks"><span>약하게</span><span>보통</span><span>세게</span></div><div class="live-scope challenge-live-wave">${liveWave((c.force||1)/3,5)}</div></div></div>`;
  }else if(id==='sort'){
    body=`<div class="sort-cards">${sortOrders[k].map((v,n)=>`<div class="sound-parcel ${c.selected===n?'selected':''}">${control(`${art('sound-parcel','','concept-thumb')}<b class="parcel-title">${icon('play')} 상자 ${'ABC'[n]}${(c.listened||[]).includes(n)?' ✓':''}</b>`,'parcel',`data-value="${n}" data-drag-kind="parcel" aria-pressed="${c.selected===n}" aria-label="상자 ${'ABC'[n]} 듣고 옮기기"`,'drag-handle')}</div>`).join('')}</div><div class="sort-slots">${[0,1,2].map(n=>control(`<span class="slot-level" aria-hidden="true">${[0,1,2].map(j=>`<i class="${j<=n?'on':''}"></i>`).join('')}</span><b>${c.slots?.[n]!=null?`상자 ${'ABC'[c.slots[n]]}`:'＋'}</b><span>${['작은 소리','중간 소리','큰 소리'][n]}</span>`,'slot',`data-value="${n}" data-drop-kind="parcel" aria-label="${['작은 소리','중간 소리','큰 소리'][n]} 칸${c.slots?.[n]!=null?`, 상자 ${'ABC'[c.slots[n]]}`:', 비어 있음'}"`,`sort-slot ${c.slots?.[n]!=null?'filled':''}`)).join('')}</div>`;
  }else if(id==='melody'){
    body=`<div class="sequence-console melody-console">${control(`${icon('play')} ${c.heard?'목표 다시 듣기':'목표 듣기'}`,'listen')}<div class="pattern-slots signal-score pitch-score" aria-label="목표 멜로디">${melodies[k].map((n,j)=>beat(pitchName(n),j,c.sequence?.[j]===n,n)).join('')}</div>${performance('내 연주',(c.sequence||[]).map(n=>pitchName(n)).join(' → '))}${control('처음부터','clear','','btn quiet')}</div><div class="length-options challenge-tools">${lengths.map(l=>control(`${rulerKey(l.value)}<b>${l.pitch}</b><small>${l.value} cm</small>`,'note',`data-value="${l.value}"`,'length-card key')).join('')}</div>`;
  }else if(id==='mix'){
    const t=mixes[k];body=`<div class="request-card sound-order"><h2><span>높낮이 <b>${pitchName(t.length)}</b></span><span>크기 <b>${forceName(t.force)}</b></span></h2></div><div class="mix-preview"><div class="mix-device">${rulerKey(c.length||18)}</div><div class="live-scope challenge-live-wave">${liveWave((c.force||1)/3,c.length===6?9:c.length===12?6:3)}</div></div><div class="mixer-controls slider-mixer"><section class="mixer-channel pitch-channel" role="group" aria-label="높낮이 조절"><h3 class="mixer-title">길이 <output data-param-output="length">${c.length||18} cm</output></h3><input id="mix-length" type="range" min="6" max="18" step="6" value="${c.length||18}" data-challenge-param="length" aria-label="떨리는 길이"><div class="range-ticks"><span>짧게</span><span>길게</span></div></section><section class="mixer-channel volume-channel" role="group" aria-label="소리 크기 조절"><h3 class="mixer-title">세기 <output data-param-output="force">${['','약하게','보통','세게'][c.force||1]}</output></h3><input id="mix-force" type="range" min="1" max="3" value="${c.force||1}" data-challenge-param="force" aria-label="튕기는 세기"><div class="range-ticks"><span>약하게</span><span>세게</span></div></section></div>${control(`${icon('play')} 연주하기`,'check','','btn primary')}`;
  }else if(id==='sensor'){
    const m=media[k];body=`<div class="challenge-top"><h2>${m.source} → ${inside(m)} 감지기</h2><small>물질마다 따로 실험</small></div><div class="sensor-scene"><div><button class="sensor-grip" data-drag-kind="sensor" aria-label="감지기 잡아 옮기기">${prop('receiver','옮길 감지기')}</button></div><div class="sensor-zones">${media.map(x=>control(`${art(`travel-${x.id}`,`${x.label} 전달 실험${x.id==='water'?', 물속에는 방수 감지기 사용':''}`,'concept-scene')}<b>${inside(x)}</b><span class="sensor-indicator">${c.zone===x.id?prop('receiver','놓은 감지기'):'＋'}</span>`,'zone',`data-value="${x.id}" data-drop-kind="sensor" aria-pressed="${c.zone===x.id}"`,`sensor-zone illustrated-zone ${x.id} ${c.zone===x.id?'selected':''}`)).join('')}</div></div>`;
  }else if(id==='classify'){
    body=`<div class="case-story path-source" data-drag-kind="path" aria-label="이야기를 전달 물질로 이어 보기"><p>${situations[k].text}</p></div>${k===5?`<figure class="sound-path-model transmission-illustration">${art('string-telephone','말하는 친구의 컵 바닥과 듣는 친구의 컵 바닥을 연결한 팽팽한 실','telephone-scene')}<figcaption>말하는 컵 → 어떤 물질? → 듣는 컵</figcaption></figure>`:`<div class="sound-path-model" aria-label="소리가 난 곳에서 전달 물질을 거쳐 듣는 곳으로 이어져"><span>${icon('volume')}<b>소리가 난 곳</b></span><i aria-hidden="true">→</i><span class="path-question"><b>어떤 물질?</b></span><i aria-hidden="true">→</i><span>${icon('ear')}<b>듣는 곳</b></span></div>`}<div class="medium-choices">${media.map(m=>control(`${icon(m.id)}<span>${m.label}</span>`,'zone',`data-value="${m.id}" data-drop-kind="path" aria-pressed="${c.zone===m.id}"`,`choice ${c.zone===m.id?'selected':''}`)).join('')}</div>`;
  }else if(id==='solutions'){
    const t=cases[k];body=`<div class="request-card solution-target" data-drop-kind="solution"><h2>${t.title}</h2><p>${t.scene}</p></div><div class="context-cards">${solutionTools.map(t=>control(`${art(`care-${t.id}`,'','concept-thumb')}<b>${t.name}${c.solution===t.id?' ✓':''}</b>`,'solution',`data-value="${t.id}" data-drag-kind="solution" aria-pressed="${c.solution===t.id}"`,`solution ${c.solution===t.id?'selected':''}`)).join('')}</div><div class="comparison-controls">${control(`${icon('play')} 적용 전 ${c.before?'✓':''}`,'before')}${control(`${icon('play')} 적용 후 ${c.after?'✓':''}`,'after',c.solution?'':'disabled')}</div>`;
  }else if(id==='festival'){
    const music=c.music??3,announcement=c.announcement??1;
    body=`<div class="mixer-controls festival-controls slider-mixer"><section class="mixer-channel" role="group"><h3 data-resident="music" class="mixer-title resident-request ${music<=1?'satisfied':''}" aria-label="책 읽는 친구의 요청: 음악은 작게"><span>${music<=1?'✓':'…'}</span><b>음악 작게</b><output data-param-output="music">${['끔','작게','보통','크게'][music]}</output></h3>${art('care-volume','음악 스피커','concept-thumb')}<input id="festival-music" type="range" min="0" max="3" value="${music}" data-challenge-param="music" aria-label="음악 크기"><div class="range-ticks"><span>끔</span><span>크게</span></div></section><section class="mixer-channel" role="group"><h3 data-resident="announcement" class="mixer-title resident-request ${announcement>=2?'satisfied':''}" aria-label="축제 안내원의 요청: 안내 방송은 보통 이상"><span>${announcement>=2?'✓':'…'}</span><b>안내 보통 이상</b><output data-param-output="announcement">${['끔','작게','보통','크게'][announcement]}</output></h3>${prop('transmitter','안내 방송 장치')}<input id="festival-announcement" type="range" min="0" max="3" value="${announcement}" data-challenge-param="announcement" aria-label="안내 방송 크기"><div class="range-ticks"><span>끔</span><span>크게</span></div></section><section class="mixer-channel" role="group"><h3 data-resident="pads" class="mixer-title resident-request ${c.pads?'satisfied':''}" aria-label="이웃 교실의 요청: 의자 다리에 패드 붙이기"><span>${c.pads?'✓':'…'}</span><b>의자 패드</b></h3>${art('care-pad','패드를 붙인 의자 다리','concept-thumb')}${control(c.pads?'✓ 붙였어':'붙이기','pads',`aria-pressed="${!!c.pads}" aria-label="의자 다리에 패드 ${c.pads?'떼기':'붙이기'}"`,`choice ${c.pads?'selected':''}`)}${control(`${icon('play')} 전체 듣기`,'preview','','btn secondary')}</section></div>`;
  }
  // Raw drag sources and sliders carry the same round token as action buttons.
  body=body.replace(/<(button|input|div)\b[^>]*>/g,tag=>/data-(?:action|drag-kind|drop-kind|challenge-param)=/.test(tag)&&!tag.includes('data-round=')?tag.replace(/^<(\w+)/,`<$1 data-round="${round}"`):tag);
  return `<div class="challenge-shell ${c.kind==='success'?'round-success':''}" data-challenge="${id}" data-round="${round}">${scene}<div class="challenge-workspace">${body}</div></div>`;
}

export function runChallenge(id,w,action,data={},sound) {
  if(!expectedProof[id])return;
  const c=w.challenge??={},k=roundOf(id,c),v=data.value,n=Number(v);
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
    if(action==='listen'){c.heard=true;sound.play({frequency:p.tool==='fork'?520:230,kind:p.tool,level:.5});return;}
    if(action!=='select'||!Number.isInteger(n)||!p.answers[n])return;
    if(!c.heard)return wrong('먼저 물체를 눌러 울리고, 떨리는 곳을 관찰해 봐.');
    c.selected=n;
    return n===p.answer?finish(`맞아! ${p.answers[p.answer]}${subject(p.answers[p.answer])} 떨려.`):wrong(p.hint);
  }
  if(id==='rhythm'){
    if(!['ring','rest'].includes(action))return;
    if((c.sequence||[]).length>=rhythms[k].length){c.sequence=[];c.sounding=false;}
    if(action==='rest'&&!c.sounding)return wrong('먼저 울려야 떨림을 멈출 수 있어.');
    const attempted=action==='ring'?'울림':'쉼',position=(c.sequence||[]).length;
    if(attempted!==rhythms[k][position]){return wrong(`이 발판은 ${rhythms[k][position]} 신호가 필요해. 앞서 연결한 길은 그대로야.`);}
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
    if(action!=='note'||![6,12,18].includes(n))return;
    if(!c.heard)return wrong('목표 멜로디를 먼저 듣고 연주해 줘.');
    if((c.sequence||[]).length>=melodies[k].length)c.sequence=[];
    c.sequence=[...(c.sequence||[]),n];tone(n,1.5);
    if(c.sequence.length<melodies[k].length)return;
    return c.sequence.join(',')===melodies[k].join(',')?finish('멜로디 편지가 도착했어!'):wrong('목표와 다른 음이 있어. 자를 누르면 처음부터 다시 연주해.');
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
    c.zone=v;const expected=id==='sensor'?media[k].id:situations[k].answer;
    if(v!==expected)return wrong(id==='sensor'?`이번에는 ${media[k].label} 전달 실험이야. 감지기를 그 물질에 놓아 줘.`:'소리를 내는 곳과 듣는 곳 사이에 있는 물질을 다시 살펴봐.');
    sound.play(transferSound(expected));
    return finish(`${media.find(m=>m.id===expected).label}${expected==='water'?'을':'를'} 통해 소리가 도착했어!`);
  }
  if(id==='solutions'){
    if(action==='solution'){
      if(!solutionTools.some(tool=>tool.id===v))return;
      if(c.solution!==v){c.solution=v;c.after=false;c.afterKey='';}
      return;
    }
    if(action==='before'){c.before=true;sound.sequence([0,1].map(()=>({kind:'drum',frequency:160,level:.7})));}
    else if(action==='after'){
      if(!c.solution)return wrong('먼저 적용할 해결책을 골라 줘.');
      c.after=true;c.afterKey=c.solution;
      if(c.solution===cases[k].answer&&c.solution==='time'){sound.stop();c.message='지금은 독서 시간이야. 연습은 약속한 다음 시간에 해.';}
      else sound.play({kind:'drum',frequency:160,level:c.solution===cases[k].answer?.2:.7});
    }else return;
    if(!c.before||!c.after||c.afterKey!==c.solution)return;
    return c.solution===cases[k].answer?finish(cases[k].why):wrong('누가, 언제, 어디에서 불편한지 보고 다른 도구를 적용해 봐.');
  }
  if(id==='festival'){
    if(action==='preview'){sound.sequence([{kind:'music',frequency:220,level:(c.music??3)/5},{kind:'fork',frequency:660,level:(c.announcement??1)/5},{kind:'drum',frequency:140,level:c.pads?.07:.4}]);return;}
    if(['music','announcement'].includes(action)){
      if(![0,1,2,3].includes(n))return;
      c[action]=n;sound.play({kind:action==='music'?'music':'fork',frequency:action==='music'?220:660,level:n/5,duration:.6});
    }else if(action==='pads'){c.pads=!c.pads;sound.play({kind:'drum',frequency:140,level:c.pads?.07:.4});}
    else return;
    if((c.music??3)<=1&&(c.announcement??1)>=2&&c.pads===true)return finish('필요한 안내도 들리고, 조용히 읽을 수도 있어!');
    c.message=(c.music??3)>1?'책 읽는 친구를 위해 음악을 작게 조절해 봐.':(c.announcement??1)<2?'안내 방송은 필요한 소리야. 보통 이상으로 들리게 해 줘.':'의자 다리에 패드를 붙여 끌 때 나는 소리를 줄여 줘.';
  }
}
