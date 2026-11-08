import { lessons, instruments, lengths, media, legacyIndex } from './data.js';
import { checkChallenge } from './challenges.js';
import { transferSound } from './samples.js';

export const EXPERIMENT_SPEEDS=Object.freeze([.5,1,1.5,2]);
const actionSelector=(action,data={})=>`[data-action="${action}"]${Object.entries(data).filter(([key])=>key!=='round').map(([key,value])=>`[data-${key}="${value}"]`).join('')}`;
const action=(name,data,message,duration=1800)=>({type:'action',action:name,data,selector:actionSelector(name,data),message,duration});
const range=(id,value,message)=>({type:'range',id,value,selector:`#${id}`,message,duration:1500});
const preview=(kind,sound,challenge,selector,message,duration=1700)=>({type:'preview',sound,visual:{kind,challenge},selector,message,duration});
const end=(message,nextSelector,state='waiting')=>({type:'end',state,message,nextSelector});
const choices='.answer-group .choice';

/** Observation only. No step chooses an answer, submits a request or changes route.
 * Preview data belongs to a temporary display copy, never the saved work object.
 */
export function experimentPlan(index,work={},evidence={}){
 const lesson=lessons[index];if(!Number.isInteger(index)||!lesson)return [];
 const w=work&&typeof work==='object'?work:{},records=evidence&&typeof evidence==='object'?evidence:{};
 if(lesson.challenge)return challengePlan(lesson.challenge,w.challenge||{});
 switch(lesson.base){
  case 0:return [...instruments.map(t=>action('instrument',{tool:t.id},`${t.name}의 떨림을 관찰해 봐.`,1900)),end('소리가 나는 물체의 공통점을 골라 봐.',choices)];
  case 1:return [action('fork-start',{},'소리굽쇠가 떨릴 때 소리를 들어 봐.',1600),action('fork-stop',{},'떨림을 멈추고, 소리가 어떻게 바뀌는지 봐.',1300),end('멈추기 전과 뒤를 비교해 골라 봐.',choices)];
  case 2:{
   const first=[1,2,3].includes(w.a)?w.a:1,second=first===3?1:3;
   return [range('force',first,'먼저 첫 소리의 세기를 맞출게.'),action('hit',{},'첫 소리와 파형을 관찰해 봐.',1400),range('force',second,'같은 북을 다른 세기로 칠게.'),action('hit',{},'두 소리와 파형의 크기를 비교해 봐.',1400),end('서로 다른 세기의 A와 B를 만들었어.','[data-action="continue"]','complete')];
  }
  case 3:
   if(!records[legacyIndex(2)]?.observation)return [end('먼저 관찰 활동에서 A와 B를 기록해 줘.',`[data-action="goto"][data-route="lesson/${legacyIndex(2)}"]`)];
   return [action('sample-play',{slot:'a'},'네가 기록한 실험 A를 들어 봐.',1600),action('sample-play',{slot:'b'},'실험 B도 듣고 크기를 비교해 봐.',1600),end('어느 실험의 소리가 더 컸는지 골라 봐.',choices)];
  case 4:return [range('ruler-length',18,'긴 자의 떨림과 소리를 관찰해 봐.'),range('ruler-length',12,'같은 힘으로 중간 길이를 비교해 봐.'),range('ruler-length',6,'짧은 자의 소리는 어떻게 바뀔까?'),end('떨리는 부분이 짧아질 때의 소리를 골라 봐.',choices)];
  case 5:return [action('target',{},'목표 신호의 세 음을 들어 봐.',2600),end('길이가 다른 자를 눌러 네가 연주해 봐.','[data-action="note"]')];
  case 6:return [...media.map(m=>action('medium',{medium:m.id},`${m.label}에서 소리가 전해지는지 관찰해 봐.`,1700)),end('소리가 전달될 수 있는 물질을 골라 봐.',choices)];
  case 7:return [preview('path',null,{},'.case-story','소리가 난 곳과 듣는 곳 사이를 살펴봐.',1800),end('이 상황에서 소리를 전달한 물질을 골라 봐.','[data-action="case-choice"]')];
  case 8:return [action('noise-scene',{},'현장 소리를 듣고 누가 불편한지 살펴봐.',2600),end('위치, 상황, 영향을 받는 사람을 직접 골라 봐.','[data-action="diagnostic"]')];
  case 9:{
   if(!records[legacyIndex(8)])return [end('먼저 관찰 활동에서 현장 진단을 기록해 줘.',`[data-action="goto"][data-route="lesson/${legacyIndex(8)}"]`)];
   const selected=Array.isArray(w.solutions)&&w.solutions.length>0;
   return [action('noise-before',{},'바꾸기 전 독서 시간의 소리를 들어 봐.',2500),...(selected?[action('noise-after',{},'네가 고른 해결책을 적용한 뒤와 비교해 봐.',2500)]:[]),end(selected?'소리의 영향이 어떻게 바뀌었는지 골라 봐.':'현장에 맞는 해결책을 직접 골라 봐.',selected?choices:'[data-action="solution"]')];
  }
  default:return [];
 }
}

function challengePlan(id,c){
 if(checkChallenge(id,c))return [end('이 의뢰의 관찰을 모두 마쳤어.','[data-action="continue"]','complete')];
 const round=Array.isArray(c.proof)?c.proof.length:0;
 const observe=(name,data,message,duration)=>action(`challenge-${name}`,{...data,round},message,duration);
 switch(id){
  case 'parts':return [observe('listen',{},'물체를 울리고 떨리는 곳을 관찰해 봐.',1900),end('실제로 떨리는 부분을 직접 골라 봐.','[data-action="challenge-select"]')];
  case 'rhythm':return [preview(id,{kind:'fork',frequency:520,level:.5,duration:1.3},{sounding:true},'.rhythm-lab','울릴 때 떨림과 소리를 관찰해 봐.'),preview(id,null,{sounding:false},'.rhythm-lab','멈추면 소리도 쉬는지 비교해 봐.',1300),end('이제 목표의 울림과 쉼을 직접 만들어 봐.','[data-action="challenge-ring"]')];
  case 'signal':return [preview(id,{kind:'drum',frequency:150,level:1/3,duration:.9},{force:1},'.signal-lab','같은 북을 약하게 친 소리를 들어 봐.'),preview(id,{kind:'drum',frequency:150,level:1,duration:.9},{force:3},'.signal-lab','세게 친 소리와 크기를 비교해 봐.'),end('요청을 보고 세기를 맞춘 뒤 직접 북을 쳐 봐.','#signal-force')];
  case 'sort':return [...[0,1,2].map(value=>observe('parcel',{value},`상자 ${'ABC'[value]}를 듣고 크기를 비교해 봐.`,1600)),end('들은 소리를 작은 것부터 직접 놓아 봐.','[data-action="challenge-parcel"]')];
  case 'melody':return [observe('listen',{},'목표 멜로디의 높낮이를 들어 봐.',3000),end('목표와 같은 순서로 직접 자를 눌러 봐.','[data-action="challenge-note"]')];
  case 'mix':return [preview(id,{kind:'ruler',frequency:lengths[0].frequency,level:1/3,duration:1},{length:18,force:1},'.mix-preview','먼저 긴 자를 약하게 튕긴 소리야.'),preview(id,{kind:'ruler',frequency:lengths[2].frequency,level:1/3,duration:1},{length:6,force:1},'.mix-preview','같은 세기에서 길이만 바꾼 소리를 비교해 봐.'),preview(id,{kind:'ruler',frequency:lengths[2].frequency,level:1,duration:1},{length:6,force:3},'.mix-preview','길이를 그대로 두고 세기만 바꿨어.'),end('주문을 보고 길이와 세기를 직접 맞춰 봐.','#mix-length')];
  case 'sensor':return [...media.map(m=>preview(id,{...transferSound(m.id),duration:1.1},{zone:m.id},`.sensor-zone.${m.id}`,`${m.label}에서 소리와 감지기의 위치를 살펴봐.`,1600)),end('요청한 물질의 실험에 감지기를 직접 놓아 봐.','[data-action="challenge-zone"]')];
  case 'classify':return [preview('path',null,{},'.path-source','소리가 난 곳에서 듣는 곳까지의 상황을 읽어 봐.',1800),end('두 곳 사이에서 소리를 전달한 물질을 골라 봐.','[data-action="challenge-zone"]')];
  case 'solutions':return [observe('before',{},'해결책을 적용하기 전 소리를 들어 봐.',2200),...(c.solution?[observe('after',{},'네가 선택한 도구의 적용 후와 비교해 봐.',1800)]:[]),end(c.solution?'상황에 맞는 해결책인지 살펴보고 직접 바꿔 봐.':'주민의 상황에 맞는 해결 도구를 직접 골라 봐.','[data-action="challenge-solution"]')];
  case 'festival':return [observe('preview',{},'지금 설정된 축제의 소리를 들어 봐.',2800),end('세 주민의 요청을 보고 조절해 봐.','#festival-music')];
  default:return [];
 }
}

/** A DOM-independent scheduler. The app cancels it for manual input, modals,
 * navigation and hidden tabs, and clears temporary visuals/sound on cancellation.
 * getContext returns a stable route/session token; rendering must not change it.
 */
export function createExperimentPlayer({perform,onUpdate=()=>{},getContext,setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),now=()=>globalThis.performance?.now?.()??Date.now()}={}){
 if(typeof perform!=='function')throw new TypeError('perform must be a function');
 let steps=[],index=0,revision=0,timer=null,timerSerial=0,scheduledAt=0,remaining=0,awaiting=false,repeat=false,session;
 let state='idle',speed=1,message='',nextSelector='';
 const total=()=>steps.filter(s=>s.type!=='end').length;
 const status=()=>({state,playing:state==='playing',waiting:state==='waiting',speed,currentStep:state==='idle'?0:Math.min(index+1,total()),total:total(),message,nextSelector});
 const update=()=>onUpdate(status());
 const cancelTimer=()=>{timerSerial++;if(timer!==null){clearTimer(timer);timer=null;}};
 const consumeElapsed=()=>{if(timer!==null)remaining=Math.max(0,remaining-Math.max(0,now()-scheduledAt)*speed);};
 const sameContext=()=>typeof getContext!=='function'||Object.is(getContext(),session);
 const stop=(text='')=>{revision++;cancelTimer();steps=[];index=0;remaining=0;awaiting=false;repeat=false;state='idle';message=text;nextSelector='';update();};
 const current=token=>{
  if(token!==revision||state!=='playing')return false;
  if(!sameContext()){stop('화면이 바뀌어 실험을 멈췄어.');return false;}
  return true;
 };
 const schedule=token=>{
  if(!current(token))return;
  const serial=++timerSerial;
  scheduledAt=now();timer=setTimer(()=>{if(serial!==timerSerial)return;timer=null;if(!current(token))return;remaining=0;index++;execute(token);},remaining/speed);
 };
 const fail=token=>{
  if(!current(token))return;
  revision++;cancelTimer();awaiting=false;repeat=true;state='paused';message='실험을 잠시 멈췄어. 다시 재생해 봐.';update();
 };
 const execute=token=>{
  if(!current(token))return;
  const step=steps[index];
  if(!step||step.type==='end'){
   revision++;cancelTimer();state=step?.state==='waiting'?'waiting':'complete';message=step?.message||'관찰을 마쳤어.';nextSelector=step?.nextSelector||'';awaiting=false;repeat=false;update();return;
  }
  message=step.message||'';nextSelector=step.selector||'';remaining=Number.isFinite(step.duration)&&step.duration>0?step.duration:1500;repeat=false;update();
  if(!current(token))return;
  try{
   const result=perform(step,{context:session,isCurrent:()=>current(token)});
   if(!current(token))return;
   if(result&&typeof result.then==='function'){
    awaiting=true;
    Promise.resolve(result).then(()=>{if(!current(token))return;awaiting=false;schedule(token);},()=>fail(token));
   }else schedule(token);
  }catch{fail(token);}
 };
 const start=(plan,context)=>{
  if(plan===undefined){
   if(state!=='paused'||!steps.length)return false;
   if(!sameContext()){stop('화면이 바뀌어 실험을 멈췄어.');return false;}
   revision++;state='playing';const token=revision;update();
   if(repeat)execute(token);else schedule(token);
   return true;
  }
  if(!Array.isArray(plan)||!plan.length){stop();return false;}
  revision++;cancelTimer();steps=structuredClone(plan);index=0;remaining=0;awaiting=false;repeat=false;session=context===undefined?getContext?.():context;state='playing';message='';nextSelector='';execute(revision);return true;
 };
 const pause=(text='잠시 멈췄어. 재생을 누르면 이어져.')=>{
  if(state!=='playing')return false;
  consumeElapsed();cancelTimer();repeat=awaiting;awaiting=false;revision++;state='paused';message=text;update();return true;
 };
 const setSpeed=value=>{
  if(!EXPERIMENT_SPEEDS.includes(value))return false;
  const running=state==='playing'&&timer!==null;
  if(running){consumeElapsed();cancelTimer();}
  speed=value;if(running)schedule(revision);update();return true;
 };
 return {start,pause,stop,setSpeed,status};
}
