import { lessons, legacyLessons, legacyIndex, LESSON_COUNT, stageLessons, finalTasks, transferCases, diagnosisFields } from './data.js';
import { cleanChallenge, checkChallenge } from './challenges.js';
export const STORAGE_KEY = 'ullim-city-v1';
export const freshState = () => ({version:2,work:{},restoration:{},evidence:{},settings:{muted:false,admin:false,bgm:true,sfx:true,bgmVolume:25},lastRoute:'home',finalAnswers:{},restored:false,completedAt:null,previousCompletion:null});
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function cleanWork(raw) {
  if (!object(raw)) return {};
  const result={};
  for(const key of ['started','stopped','heardA','heardB','targetHeard','heard','before','after']) result[key]=raw[key]===true;
  for(const key of ['choice','force','a','b','length','currentCase']) if(Number.isInteger(raw[key]))result[key]=raw[key];
  for(const [key,allowed] of Object.entries({seen:['rubber','ruler','drum','fork'],lengths:[6,12,18],pattern:[6,12,18],media:['air','water','solid'],solutions:['pad','volume','time']})) result[key]=Array.isArray(raw[key])?raw[key].filter(x=>allowed.includes(x)).slice(0,key==='pattern'?3:10):[];
  for(const key of ['caseChoice','place','situation','person','afterKey','pairKey']) if(typeof raw[key]==='string')result[key]=raw[key].slice(0,80);
  result.verified={};for(let k=0;k<3;k++)if(['air','water','solid'].includes(raw.verified?.[k]))result.verified[k]=raw.verified[k];
  result.challenge=cleanChallenge(raw.challenge);
  return result;
}
export function normalize(raw) {
  const base = freshState();
  if (!object(raw) || ![1,2].includes(raw.version)) return base;
  if(raw.version===1){
    const remap=source=>Object.fromEntries(Object.entries(object(source)?source:{}).filter(([i])=>/^\d+$/.test(i)&&Number(i)<10).map(([i,v])=>[legacyIndex(Number(i)),v]));
    const match=/^lesson\/(\d+)$/.exec(raw.lastRoute||'');
    raw={...raw,work:remap(raw.work),evidence:remap(raw.evidence),lastRoute:match?`lesson/${legacyIndex(Number(match[1]))}`:raw.lastRoute,previousCompletion:raw.restored?raw.completedAt:null,restored:false};
  }
  base.settings = {muted:raw.settings?.muted===true,admin:raw.settings?.admin===true,bgm:raw.settings?.bgm!==false,sfx:raw.settings?.sfx!==false,bgmVolume:Number.isFinite(raw.settings?.bgmVolume)?Math.round(Math.max(0,Math.min(100,raw.settings.bgmVolume))/5)*5:25};
  base.previousCompletion=typeof raw.previousCompletion==='string'&&Number.isFinite(Date.parse(raw.previousCompletion))?raw.previousCompletion:null;
  for (let i=0;i<LESSON_COUNT;i++) {
    if (object(raw.work?.[i])) base.work[i]=cleanWork(raw.work[i]);
    const e=raw.evidence?.[i];
    if (object(e) && object(e.observation)) {
      const observation=cleanWork(e.observation);
      const trial={...base,work:{...base.work,[i]:observation}};
      // A saved comparison retains the precise original pair even after a later re-experiment.
      if(lessons[i].base===3 && object(e.observation.pair))trial.evidence={...base.evidence,[legacyIndex(2)]:{observation:cleanWork(e.observation.pair)}};
      if(checkLesson(trial,i).ok){
        if(lessons[i].base===3)observation.pair=structuredClone(trial.evidence[legacyIndex(2)].observation);
        if(lessons[i].base===9)observation.diagnosis=structuredClone(base.evidence[legacyIndex(8)].observation);
        base.evidence[i]={summary:lessons[i].summary,observation,at:typeof e.at==='string'?e.at:''};
      }
    }
  }
  base.finalAnswers = Object.fromEntries(finalTasks.flatMap((t,i)=>Number.isInteger(raw.finalAnswers?.[i])&&raw.finalAnswers[i]>=0&&raw.finalAnswers[i]<t.options.length?[[i,raw.finalAnswers[i]]]:[]));
  base.restored = raw.restored===true && evidenceCount(base)===LESSON_COUNT && checkFinal(base).ok;
  base.completedAt = base.restored && typeof raw.completedAt==='string' && Number.isFinite(Date.parse(raw.completedAt)) ? raw.completedAt : null;
  if(!base.completedAt)base.restored=false;
  base.restoration=Object.fromEntries(Array.from({length:5},(_,n)=>[n,stageDone(base,n)&&Array.isArray(raw.restoration?.[n])?[...new Set(raw.restoration[n].filter(i=>[0,1,2].includes(i)))]:[]]));
  base.lastRoute = typeof raw.lastRoute==='string' && canRoute(base,raw.lastRoute) ? raw.lastRoute : 'home';
  return base;
}
export function readState(storage) {
  let saved=null;
  try {
    saved=storage.getItem(STORAGE_KEY)??null;
    const raw=saved ? JSON.parse(saved) : null;
    if(saved && (!object(raw)||![1,2].includes(raw.version)))return {state:freshState(),snapshot:saved,blocked:true,warning:'다른 버전의 기록을 보호 중이야. 이 창의 활동은 저장하지 않아.'};
    if(raw?.version===1){try{if(!storage.getItem(`${STORAGE_KEY}-backup-v1`))storage.setItem(`${STORAGE_KEY}-backup-v1`,saved);}catch{}}
    return {state:normalize(raw),snapshot:saved,blocked:false,warning:''};
  } catch {return {state:freshState(),snapshot:saved,blocked:true,warning:'저장 기록을 읽지 못해 원본을 보호 중이야. 이 창의 활동은 저장하지 않아.'};}
}
export function writeState(storage,state) {
  try { storage.setItem(STORAGE_KEY,JSON.stringify(state)); return true; } catch { return false; }
}
// Compare before writing so an older classroom tab never erases newer progress.
export function createSaveSession(storage,loaded=readState(storage)) {
  let snapshot=loaded.snapshot,blocked=loaded.blocked;
  return {
    save(state){
      if(blocked)return {ok:false,warning:loaded.warning||'다른 창의 기록을 보호 중이야. 새로고침 후 이어 해 줘.'};
      try {
        if((storage.getItem(STORAGE_KEY)??null)!==snapshot){blocked=true;return {ok:false,warning:'다른 창에서 기록이 바뀌어 덮어쓰지 않았어. 이 창을 새로고침해서 이어 해 줘.'};}
        const next=JSON.stringify(state);storage.setItem(STORAGE_KEY,next);snapshot=next;return {ok:true};
      }catch{return {ok:false,warning:'자동 저장이 막혀 있어. 이 창을 닫으면 기록을 잃을 수 있어.'};}
    },
    backup(){try{if(blocked||(storage.getItem(STORAGE_KEY)??null)!==snapshot)return false;if(snapshot)storage.setItem(`${STORAGE_KEY}-before-reset`,snapshot);return true;}catch{return false;}}
  };
}
export const evidenceCount = s => Object.keys(s.evidence).filter(i=>/^\d+$/.test(i)&&Number(i)>=0 && Number(i)<LESSON_COUNT).length;
export const stageDone = (s,n) => stageLessons(n).every(i=>Boolean(s.evidence[i]));
export const canLesson = (s,i) => Number.isInteger(i) && i>=0 && i<LESSON_COUNT && (s.settings.admin || i===0 || Boolean(s.evidence[i] || s.evidence[i-1]));
export function canRoute(s,route) {
  if (['home','map'].includes(route)) return true;
  if (route==='final') return s.settings.admin || evidenceCount(s)===LESSON_COUNT;
  if (route==='result') return s.settings.admin || s.restored;
  const match=/^lesson\/(\d+)$/.exec(route);
  return Boolean(match && canLesson(s,Number(match[1])));
}
const fail = message => ({ok:false,message});
const list = x => Array.isArray(x) ? x : [];
// Finish the first pass, then guide the learner back to the field that needs another look.
export function nextDiagnosisField(work={}) {
  return diagnosisFields.find(field=>!work[field.key]) || diagnosisFields.find(field=>work[field.key]!==field.answer);
}
export function checkLesson(s,i) {
  const w=s.work[i]||{};
  if(!lessons[i])return fail('올바른 실험을 선택해 줘.');
  if(lessons[i].challenge)return checkChallenge(lessons[i].challenge,w.challenge)?{ok:true,message:lessons[i].summary}:fail('아직 해결하지 않은 의뢰가 있어. 직접 조절하고 끝까지 확인해 줘.');
  const current=lessons[i];i=current.base;
  if (i===0 && new Set(list(w.seen).filter(x=>['rubber','ruler','drum','fork'].includes(x))).size<2) return fail('다른 물체도 울려 봐. 두 가지 이상의 떨림을 관찰해야 해.');
  if (i===1 && !(w.started && w.stopped)) return fail('먼저 울리기를 누른 다음, 소리가 나는 동안 눌러 멈춰 봐.');
  if (i===2) {
    if (![1,2,3].includes(w.a) || ![1,2,3].includes(w.b)) return fail('실험 A와 B를 각각 기록해 줘.');
    if (w.a===w.b) return fail('두 실험의 세기가 같아. 세기를 바꿔 한 실험을 다시 기록해 봐.');
  }
  if (i===3) {
    const pair=s.evidence[legacyIndex(2)]?.observation;
    if (!pair || pair.a===pair.b) return fail('먼저 볼륨 경기장의 관찰 활동에서 서로 다른 A/B 실험을 만들어 줘.');
    if (!(w.heardA && w.heardB) || w.pairKey!==`${pair.a},${pair.b}`) return fail('A와 B를 모두 다시 들어 봐.');
    if (w.choice!==(pair.a>pair.b ? 0 : 1)) return fail('더 세게 친 실험과 더 큰 떨림을 다시 비교해 봐.');
  }
  if (i===4 && new Set(list(w.lengths).filter(x=>[6,12,18].includes(x))).size<2) return fail('길이를 바꿔 두 가지 이상 튕겨 봐. 다른 조건은 그대로야.');
  if (i===5) {
    if (!w.targetHeard) return fail('먼저 목표 신호를 들어 봐.');
    if (JSON.stringify(w.pattern)!==JSON.stringify([18,6,12])) return fail('낮음 → 높음 → 중간 순서야. 긴 자의 소리부터 다시 연주해 봐.');
  }
  if (i===6 && !['air','water','solid'].every(x=>list(w.media).includes(x))) return fail('공기·물·고체 실험을 각각 한 번씩 확인해 줘.');
  if (i===7 && !transferCases.every((c,k)=>w.verified?.[k]===c.answer)) return fail('아직 검증하지 않은 상황이 있어. 세 상황 모두 선택한 뒤 실험해 봐.');
  if (i===8) {
    if (!w.heard) return fail('현장 소리를 먼저 들어 봐.');
    if (nextDiagnosisField(w)) return fail('도서관 옆 복도에서, 독서 중인 친구가 어떤 어려움을 겪는지 다시 살펴봐.');
  }
  if (i===9) {
    if (!s.evidence[legacyIndex(8)]) return fail('먼저 소음 관리센터에서 현장을 진단해 줘.');
    if (!list(w.solutions).some(x=>['pad','volume','time'].includes(x))) return fail('진단에 맞는 해결책을 하나 이상 적용해 줘.');
    if (!(w.before && w.after) || w.afterKey!==list(w.solutions).slice().sort().join(',')) return fail('현재 해결책의 적용 전과 적용 후 소리를 모두 들어 봐.');
  }
  if (legacyLessons[i]?.answer!==undefined && w.choice!==legacyLessons[i].answer) return fail(i===9 ? '시간을 바꾸면 독서 중에는 조용해져도 연습할 때의 소리는 남아. 어떤 점이 나아졌을까?' : '관찰한 떨림과 소리를 다시 떠올려 봐. 선택을 바꾸고 다시 확인할 수 있어.');
  return {ok:true,message:current.summary};
}
export function recordEvidence(s,i) {
  if(!Number.isInteger(i)||i<0||i>=LESSON_COUNT)return fail('올바른 실험을 선택해 줘.');
  const result=checkLesson(s,i);
  if (!result.ok) return result;
  if(lessons[i].base===2 && `${s.evidence[i]?.observation.a},${s.evidence[i]?.observation.b}`!==`${s.work[i].a},${s.work[i].b}`)s.work[legacyIndex(3)]={heardA:false,heardB:false};
  s.evidence[i]={summary:lessons[i].summary,observation:structuredClone(s.work[i]||{}),at:new Date().toISOString()};
  if (lessons[i].base===3) s.evidence[i].observation.pair=structuredClone(s.evidence[legacyIndex(2)].observation);
  if (lessons[i].base===9) s.evidence[i].observation.diagnosis=structuredClone(s.evidence[legacyIndex(8)].observation);
  return result;
}
export function checkFinal(s) {
  const wrong=finalTasks.map((t,i)=>s.finalAnswers[i]===t.answer ? -1 : i).filter(i=>i>=0);
  return {ok:wrong.length===0,wrong,eligible:evidenceCount(s)===LESSON_COUNT};
}
