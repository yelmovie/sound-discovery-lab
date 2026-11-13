import { mountNpcGuide } from './npc-guide.js';
import { portraitMarkup } from './npc-scene.js';
let disposeNpc;
import { art, rulerIllustration } from './illustrations.js';
import { transferSound } from './samples.js';
import { backgrounds, titleLogo, stages, lessons, instruments, lengths, media, transferCases, diagnosisFields, solutions, finalTasks, props, achievements, legacyIndex, LESSON_COUNT, stageLessons } from './data.js';
import { STORAGE_KEY, freshState, readState, createSaveSession, evidenceCount, stageDone, canLesson, canRoute, lessonFromRoute, recordEvidence, checkLesson, checkFinal, nextDiagnosisField } from './model.js';
import { SoundEngine } from './audio.js';
import { createVoice, voiceFor, voiceCue } from './voice.js';
import { settingsContent as copy } from './settings-content.js';
import { APP_VERSION } from './version.js';
import { concepts, conceptView, conceptTerms, emphasize } from './concepts.js';
import { coachFor } from './companion.js';
import { collectReadyEvidence, evidenceMatches, captureStrike } from './progress.js';

const app=document.querySelector('#app'),modalRoot=document.querySelector('#modal-root');
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
let dialogueStage=null;
const loaded=readState(storage);let state=loaded.state,route=state.lastRoute,warning=loaded.warning;
const persistence=createSaveSession(storage,loaded);
let studentState=null;
// Older builds persisted teacher unlock. Always return to student mode on load.
state.settings.admin=false;if(!canRoute(state,route))route='map';
let map=null,feedback=null,liveTimer=null,playingUntil=0,returnFocus=null,trail=[],soundText='',lastObject='';
let finalStep=0,notebookStage=0,mapView='follow',mapNoteTimer=null;
let advanceTimer=null,inputLockedUntil=0;
const hintLevels={};
const sound=new SoundEngine();configureSound();
const voice=createVoice({enabled:()=>!state.settings.muted&&state.settings.sfx,quiet:value=>sound.setQuiet(value),onSpeaking:id=>{
 const dialog=modalRoot.querySelector('dialog.modal-npc');
 if(dialog)dialog.dataset.speaking=String(Boolean(id&&dialog.dataset.voiceLines?.split(',').includes(id)));
}});
const pioPortrait=(hue=0)=>'<div class="npc-stage-art">'+portraitMarkup('/image/generated/dialogue/pio.webp',{hue})+'</div>';
function residentDialogue(stage){
 const data=stages[stage];if(!data||!stageDone(state,stage))return;
 const id='restored-'+(stage+1), name=data.name+' 주민';
 openModal(pioPortrait([-20,200,60,-55,150][stage])+'<div class="story-card"><p>'+esc(data.restored)+'</p></div>',name,voiceButton(id,name+' 목소리 다시 듣기',true)+button('닫기','close','','btn primary'),'npc');
 modalRoot.querySelector('dialog').dataset.voiceLines=id;voice.say(id);
}
const voiceChains={story:['story-1','story-2','story-3'],guide:['guide-1','guide-2','guide-3','guide-4'],final:['final-title','final-core'],ending:['ending-1','ending-2']};
let voiceSeen={route:'',text:''};const heardMissions=new Set();
function voiceButton(id,label='삐오 목소리 다시 듣기',text=false){return text?button(`${icon('volume')} 다시 듣기`,'voice-replay',`data-voice="${id}" aria-label="${label}"`,'btn quiet voice-replay'):button(icon('volume'),'voice-replay',`data-voice="${id}" aria-label="${label}" title="다시 듣기"`,'icon-btn voice-replay');}
let autoSession=0,previewVisual=null,autoplayDispatch=false,fitFrame=0,fitObserver=null,currentExperimentStep=null;
let experimentPointer=null,pointerReleaseTimer=null;
let experimentPlayer,experimentPlan,EXPERIMENT_SPEEDS,activity,noiseLevel,liveWave,rulerKey,challengeView,runChallenge;
let experimentLoad,challengeLoad,mapLoad,mapRevision=0,renderRevision=0,mapFailed=false,mapModuleFailed=false,pendingMapTravel=null;
const idlePlayer={state:'idle',playing:false,speed:1,message:''};
function within(load){
 let timer;
 return Promise.race([load,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Screen load timed out')),10000);})]).finally(()=>clearTimeout(timer));
}
function prepareExperiment(){
 return experimentLoad??=Promise.all([import('./lesson-activity.js'),import('./experiment-player.js'),import('./manipulations.js')]).then(([lesson,player,tools])=>{
  ({activity,noiseLevel}=lesson);({experimentPlan,EXPERIMENT_SPEEDS}=player);({liveWave,rulerKey}=tools);
  experimentPlayer=player.createExperimentPlayer({getContext:()=>`${route}|${autoSession}`,perform:performExperimentStep,onUpdate:syncExperimentPlayer});
  tools.bindManipulations(app,manipulationOptions);
 });
}
function prepareChallenge(){
 return challengeLoad??=import('./challenges.js').then(module=>{({challengeView,runChallenge}=module);});
}
function configureSound(){sound.configure({...state.settings,bgmVolume:state.settings.bgmVolume/100});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=x=>Array.isArray(x)?x:[];
const icons={air:'M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M5 17h5',water:'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12ZM8 16a4 4 0 0 0 4 3',solid:'M4 7 12 3l8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10',ear:'M8 17c0 3 2 4 4 4s3-2 3-4c0-2 5-4 5-8a7 7 0 0 0-14 0M10 9a3 3 0 0 1 6 0c0 2-3 2-3 4',map:'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',back:'m14 5-7 7 7 7M7 12h14',volume:'M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',mute:'M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',arrow:'M4 12h16m-6-6 6 6-6 6',check:'m5 12 4 4L20 5',lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',unlock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 7.5-2',book:'M4 3h13l3 3v15H4zM8 8h7m-7 4h8m-8 4h5',wave:'M2 12h3l3-8 5 16 4-12 2 4h3',music:'M9 17V5l11-2v12M9 7l11-2M9 17c0 4-7 4-7 0s7-4 7 0m11-2c0 4-7 4-7 0s7-4 7 0',network:'M5 5h4v4H5zM15 15h4v4h-4zM15 3h4v4h-4zM7 9v8h8M9 7l6-2',leaf:'M20 3C8 2 2 8 6 16c6 7 15-1 14-13ZM4 21 16 8',play:'m8 4 12 8-12 8z',pause:'M8 5v14M16 5v14',stop:'M6 6h12v12H6z',close:'m5 5 14 14M19 5 5 19',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',hand:'M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',skip:'M5 5l9 7-9 7zM19 5v14'};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[name]||icons.wave}"/></svg>`;}
function button(label,action,attrs='',cls='btn'){return `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;}
function save(){
 state.lastRoute=route;
 if(studentState)return;
 const result=persistence.save(state);
 if(!result.ok){warning=result.warning;const el=document.querySelector('#save-status');if(el)el.textContent=warning;}
}

function work(i){return state.work[i]??=( {} );}
function setWork(i,patch){Object.assign(work(i),patch);save();}
function finishInteraction(i){
 // The evidence chime waits for the experiment sound so it never masks the sound being compared.
 if(collectReadyEvidence(state,i)){feedback=null;const here=route;setTimeout(()=>{if(route===here)void sound.effect('success');},700);}
 save();updateView();
}
function runTrial(i,action,data){
 const w=work(i),before=w.challenge?.proof?.length||0;
 if(data.round!==undefined&&Number(data.round)!==before)return;
 runChallenge(lessons[i].challenge,w,action,data,sound);
 if(lessons[i].challenge==='solutions'&&action==='solution')void sound.effect('drop');
 if((w.challenge?.proof?.length||0)>before)inputLockedUntil=Date.now()+500;
}
function strikeAndCapture(w,force){
 feedback={kind:'hint',text:captureStrike(w,force)};
 sound.play({kind:'drum',frequency:150,level:force/3,duration:1});
}
function cancelAdvance(){clearTimeout(advanceTimer);advanceTimer=null;}
function portrait(who='bird'){return who==='bird'?'<img class="portrait pio" src="/image/generated/pio-guide.svg" alt="안경 쓴 파란 울림새 삐오" draggable="false">':`<div class="portrait ${who}" role="img" aria-label="${who==='girl'?'기록 파트너':'장비 파트너'}"></div>`;}
function rings(){return `<div class="rings" aria-label="복구한 코어 링 ${stages.filter((_,i)=>stageDone(state,i)).length}개">${stages.map((s,i)=>`<span class="ring ${stageDone(state,i)?'lit':''}" style="--ring:${s.color}" title="${s.name}: ${stageDone(state,i)?'복구 완료':'복구 전'}">${stageDone(state,i)?'✓':i+1}</span>`).join('')}</div>`;}
function header(){const soundOff=state.settings.muted||!state.settings.bgm&&!state.settings.sfx;return `<header class="topbar game-hud"><nav class="nav-left" aria-label="화면 이동">${button(icon('home'),'home','aria-label="홈"','icon-btn')}${button(icon('back'),'back',`aria-label="이전" ${route==='home'&&!trail.length?'disabled':''}`,'icon-btn')}</nav><nav class="nav-right" aria-label="소리 및 설정">${button(icon(soundOff?'mute':'volume'),'mute',`aria-label="${soundOff?'소리 켜기':'소리 끄기'}" aria-pressed="${soundOff}"`,'icon-btn')}${button(icon('settings'),'settings','aria-label="설정"','icon-btn')}</nav></header>${state.settings.admin&&(route==='home'||route==='map')?'<div class="admin-banner">교사용 시연 · 학생 기록과 따로 진행 중</div>':''}`;}
function home(){const hasWork=state.resumeLesson!==null||Object.keys(state.work).length>0;return `<main class="title-screen"><div class="title-copy"><span class="title-eyebrow">${icon('wave')} 초등 과학 · 소리의 성질</span><h1 class="title-logo"><img src="/${titleLogo}" fetchpriority="high" alt="울림도시 대작전" draggable="false"></h1><p class="title-tagline">도시의 소리 코어가 멈췄어. 직접 소리를 만들고 증거를 모아<br><b>울림도시를 다시 깨워 줘!</b></p><div class="title-actions">${button(`${hasWork?'탐험 이어 하기':'탐험 시작하기'} ${icon('arrow')}`,'start','','btn primary title-cta')}${button(`${icon('book')} 도시 이야기 보기`,'story','','btn title-story')}</div><span class="title-sub">증거 20개 → 복구 배지 5개 → 소리 탐험가 인증서</span><p class="title-note">${icon('volume')} 소리가 나오는 활동이야. 기기 음량을 편안하게 맞춰 줘.</p></div><div class="title-guide" aria-hidden="true"><span class="title-bubble">같이 도시를 깨우자!</span>${portrait()}</div></main>`;}
function topic(name){return (name.charCodeAt(name.length-1)-0xac00)%28?'은':'는';}
function towardName(name){const code=name.charCodeAt(name.length-1)-0xac00,batchim=code%28;return `${name}${batchim&&batchim!==8?'으로':'로'}`;}
function mapPlace(s,i,target){const finished=stageDone(state,i),open=canLesson(state,i*4),count=stageLessons(i).filter(n=>state.evidence[n]).length;return `<button class="map-location ${finished?'restored':''} ${open?'':'locked'} ${target===i?'is-next':''}" style="--place:${s.color}" data-action="travel" data-stage="${i}" ${open?'':'aria-disabled="true"'}><span class="place-mark">${finished?icon('check'):open?i+1:icon('lock')}</span><span class="place-text"><b>${s.name}</b><small>${finished?'복구 완료':open?`<span class="place-pips" aria-hidden="true">${[0,1,2,3].map(k=>`<i class="${k<count?'on':''}"></i>`).join('')}</span>${count} / 4 활동`:'잠김'}</small></span></button>`;}
function mapNextLabel(stage,here){const name=stage===5?'소리 코어':stages[stage].name;return `<small>${here?'바로 앞':'다음 추천 장소'}</small><b>${here?`${name} 들어가기`:`${towardName(name)} 가기`}</b>${icon('arrow')}`;}
function mapViewLabel(view,mode){return mode==='hand'?(view==='hand'?'둘러보기 끝':'손으로 둘러보기'):(view==='overview'?'이전 지도 보기로 돌아가기':'지도 한눈에 보기');}
function mapPage(){const next=stages.findIndex((_,i)=>!stageDone(state,i)),target=next<0?5:next;return `<main class="map-page"><div class="map-viewport"><div class="map-world"><canvas id="world"></canvas>${stages.map((s,i)=>mapPlace(s,i,target)).join('')}<button class="core-marker ${target===5?'is-next':''}" data-action="travel" data-stage="5" ${canRoute(state,'final')?'':'aria-disabled="true"'}>${icon(canRoute(state,'final')?'star':'lock')} 소리 코어</button>${button('<span class="sr-only">삐오에게 안내 듣기</span>','guide','aria-label="삐오에게 안내 듣기"','map-companion')}</div></div><div class="map-help"><span class="map-help-place">울림 숲 · 증거 ${evidenceCount(state)} / ${LESSON_COUNT}</span><span id="map-status" role="status">${next<0?'다섯 시설을 복구했어! 소리 코어로 가자.':stages[next].mission}</span>${voiceButton(next<0?'mission-core':`mission-${next+1}`)}</div><div class="map-controls"><div class="map-dpad" role="group" aria-label="이동 방향">${[['up','↑','위쪽'],['left','←','왼쪽'],['down','↓','아래쪽'],['right','→','오른쪽']].map(([dir,label,word])=>`<button data-direction="${dir}" aria-label="${word}으로 이동">${label}</button>`).join('')}</div><div class="map-tools">${['hand','overview'].map(mode=>button(`${icon(mode==='hand'?'hand':'map')}`,'map-view',`data-view="${mode}" aria-label="${mapViewLabel(mapView,mode)}" title="${mapViewLabel(mapView,mode)}" aria-pressed="${mapView===mode}"`,'map-tool')).join('')}</div></div>${button(mapNextLabel(target,false),'travel',`data-stage="${target}" data-target="${target}"`,'btn primary map-next')}</main>`;}
// Only show lock guidance after the learner requests a closed destination.
function lockedNote(n){const text=document.querySelector('#map-status');if(!text)return;const before=text.dataset.mission??=text.textContent;void sound.effect('hint');text.textContent=n===5?'증거 20개를 모으면 소리 코어가 열려.':`${stages[n].name}${topic(stages[n].name)} 앞 시설을 복구하면 열려.`;clearTimeout(mapNoteTimer);mapNoteTimer=setTimeout(()=>{text.textContent=before;},3500);}
function syncMapNext(near){const b=document.querySelector('.map-next');if(!b)return;const target=Number(b.dataset.target),here=near!==null&&(near===5?canRoute(state,'final'):canLesson(state,near*4)&&!stageDone(state,near));b.dataset.stage=String(here?near:target);b.innerHTML=mapNextLabel(here?near:target,here);}
function syncMapView(view){mapView=view;for(const tool of document.querySelectorAll('.map-tool')){const mode=tool.dataset.view;tool.setAttribute('aria-pressed',String(view===mode));tool.setAttribute('aria-label',mapViewLabel(view,mode));tool.title=mapViewLabel(view,mode);}}
function syncMapTravel(stage){const b=document.querySelector('.map-next');if(!b)return;b.disabled=stage!==null;b.setAttribute('aria-busy',String(stage!==null));}
// Teacher preview: walk the whole sequence without operating each activity.
const adminOrder=[...Array.from({length:LESSON_COUNT},(_,i)=>`lesson/${i}`),'final','result'];
function adminTargets(){
 const at=adminOrder.indexOf(route);if(at<0)return null;
 const lesson=route.startsWith('lesson/')?lessons[Number(route.split('/')[1])]:null;
 const stage=lesson?(lesson.stage<4?`lesson/${stageLessons(lesson.stage+1)[0]}`:'final'):route==='final'?'result':null;
 return {prev:at>0?adminOrder[at-1]:'map',next:adminOrder[at+1]||null,stage};
}
function adminDock(inMenu=false){
 if(route.startsWith('lesson/')&&!inMenu)return '';
 const t=state.settings.admin&&adminTargets();if(!t)return '';
 return `<nav class="admin-dock ${inMenu?'admin-menu':''}" aria-label="교사용 빠른 이동"><div class="admin-arrows"><span class="admin-chip">교사용 · ← → 키로 이동</span>${button('←','goto',`data-route="${t.prev}" aria-label="이전 단계" aria-keyshortcuts="ArrowLeft"`,'admin-arrow')}${button('→','goto',`data-route="${t.next||''}" aria-label="다음 단계" aria-keyshortcuts="ArrowRight" ${t.next?'':'disabled'}`,'admin-arrow')}</div>${t.stage?button(`다음 스테이지 ${icon('skip')}`,'goto',`data-route="${t.stage}"`,'btn primary admin-skip'):''}</nav>`;
}
function wave(level=1,frequency=4,flat=false){const points=Array.from({length:121},(_,i)=>`${i*2},${40+(flat?0:Math.sin(i/120*Math.PI*2*frequency)*level*25)}`).join(' ');return `<svg viewBox="0 0 240 80" preserveAspectRatio="none" class="waveform" aria-hidden="true"><path class="wave-reference" d="M0 20H240M0 40H240M0 60H240M60 0V80M120 0V80M180 0V80" fill="none"/><polygon class="wave-area" points="0,40 ${points} 240,40"/><polyline class="wave-trace" points="${points}"/></svg>`;}
function prop(name,alt=''){return `<img class="prop-img" src="/${props[name]}" alt="${esc(alt)}" draggable="false">`;}
function toolGraphic(id){
 if(id==='rubber')return art('rubber-instrument','팽팽한 고무줄을 울리는 나무 상자 악기','tool-svg');
 if(id==='ruler')return rulerIllustration(18);
 if(id==='drum'||id==='fork')return `<span class="prop-assembly ${id==='fork'?'fork':'drum'}-assembly">${id==='fork'?prop('fork-stand','소리굽쇠 받침대')+prop('tuning-fork','소리굽쇠'):prop('drum','작은 북')+prop('mallet','북채')}</span>`;
 return '';
}
function stagePicture(stage){return stage===0?prop('tuning-fork','떨리는 소리굽쇠'):stage===1?prop('drum','소리 크기를 비교한 북'):stage===2?rulerIllustration(12):art(stage===3?'travel-water':'care-pad',stage===3?'물속 종과 감지기':'의자 다리의 소음 방지 패드','concept-thumb');}
function lessonCue(i,w,saved){
 const coach=coachFor(state,i,hintLevels[i]||0,saved),l=lessons[i];
 if(saved)return {text:i%4===3?'네 활동을 모두 마쳤어! 시설 복구를 눌러 봐.':'활동을 마쳤어! 다음 활동으로 가자.',target:'[data-action="continue"]'};
 if(l.challenge){
  const c=w.challenge||{};if(coach.target==='[data-action="challenge-clear"]')return coach;let target=coach.target;
  if(c.kind==='hint'&&l.challenge==='solutions'&&c.before&&c.after)target='[data-action="challenge-solution"]';
  if(c.kind==='hint'&&l.challenge==='mix')target='.slider-mixer';
  return {text:!hintLevels[i]&&c.message&&c.kind!=='success'?c.message:coach.text,target};
 }
 if(l.base===1)return {text:hintLevels[i]?coach.text:playingUntil>Date.now()?'손으로 눌러 떨림을 멈춰 봐.':w.stopped?'누르기 전과 뒤를 비교해 골라 봐.':'소리굽쇠를 눌러 울려 봐.',target:playingUntil>Date.now()?'[data-action="fork-stop"]':coach.target};
 if(l.base===8&&w.heard){const field=nextDiagnosisField(w);if(field)return {text:hintLevels[i]?coach.text:`${field.label}${field.key==='place'?'를':'을'} ${w[field.key]?'다시 살펴보고 ':''}골라 봐.`,target:`[data-action="diagnostic"][data-field="${field.key}"]`};}
 if(hintLevels[i])return coach;
 if(l.base===0)return {text:arr(w.seen).length<2?'물체를 눌러 떨림을 관찰해 봐.':'관찰한 물체의 공통점을 골라 봐.',target:coach.target};
 if(l.base===2)return coach;
 if(l.base===3)return {text:!w.heardA||!w.heardB?'A와 B를 번갈아 들어 봐.':'더 큰 소리가 난 실험을 골라 봐.',target:coach.target};
 if(l.base===4)return {text:arr(w.lengths).length<2?'길이 손잡이를 움직여 두 소리를 비교해 봐.':'길이가 짧아졌을 때의 소리를 골라 봐.',target:coach.target};
 return coach;
}
function playerLabel(ps){const compact=innerWidth<=600;return ps.playing?(compact?'멈춤':'일시정지'):ps.state==='paused'?(compact?'계속':'계속 재생'):'자동재생';}
function lessonPage(i){
 const l=lessons[i],s=stages[l.stage],w=work(i),saved=evidenceMatches(state,i),cue=lessonCue(i,w,saved),ps=(experimentPlayer?.status()||idlePlayer);
 const display=previewVisual?{...w,...previewVisual,challenge:{...w.challenge,...previewVisual.challenge}}:w;
 return `<main data-stage="${l.stage}" data-lesson="${i}" class="lesson-page single-screen ${saved?'lesson-saved':''}" style="--scene:url('/${backgrounds[l.base??l.stage*2+1]}')"><header class="lesson-heading"><div class="lesson-title"><span class="stage-badge">${icon(s.icon)} ${s.name}</span><h1>${l.title}</h1><p class="learning-focus"><span>${saved?'발견':'생각해 봐'}</span> ${emphasize(saved?l.discovery:l.inquiry,conceptTerms[l.stage])}</p></div><nav class="chapter-switch" aria-label="장소 안의 활동">${stageLessons(l.stage).map(n=>button(`<span class="chapter-step" aria-hidden="true">${state.evidence[n]?'✓':n%4+1}</span><span>${lessons[n].phase}</span>`,'goto',`data-route="lesson/${n}" ${!canLesson(state,n)?'disabled':''} ${i===n?'aria-current="step"':''}`,`chapter ${i===n?'current':''}`)).join('')}</nav></header><section class="lesson-scene"><div class="experiment-board" role="region" aria-label="${esc(s.name)} · ${esc(l.phase)} 실험대"><div class="experiment-content activity-base-${l.base??'challenge'}">${activity(i,display,{state,playingUntil,lastObject,button,icon,prop,toolGraphic,wave,voiceButton,challengeView})}</div></div></section><footer class="activity-footer"><div class="next-instruction"><span class="next-marker" aria-hidden="true">${saved?'✓':'→'}</span><p id="coach-hint" role="status">${esc(ps.state!=='idle'&&ps.message?ps.message:feedback?.text||cue.text)}</p>${voiceButton('lesson-done')}</div><div class="activity-controls"><div class="autoplay-controls" data-player-state="${ps.state}">${button(`${icon(ps.playing?'pause':'play')} <span class="autoplay-state">${playerLabel(ps)}</span>`,'auto-play',`aria-pressed="${ps.playing}"`,'btn secondary auto-play')}${button(icon('stop'),'auto-stop',`aria-label="자동실험 정지" title="정지" ${ps.state==='idle'?'hidden':''}`,'icon-btn auto-stop')}<label class="sr-only" for="experiment-speed">자동실험 속도</label><select id="experiment-speed" aria-label="자동실험 속도">${EXPERIMENT_SPEEDS.map(n=>`<option value="${n}" ${ps.speed===n?'selected':''}>${n}배</option>`).join('')}</select></div><div class="activity-tools">${button(icon('star'),'guide','aria-label="힌트 더 보기" title="힌트" aria-describedby="coach-hint"','icon-btn')}${button(icon('book'),'activity-tools','aria-label="노트와 개념 영상" title="노트·영상"','icon-btn')}</div>${saved?button(`${i%4===3?'시설 복구':'다음 활동'} ${icon('arrow')}`,'continue','','btn primary lesson-next'):''}</div></footer></main>`;
}
function stopExperiment(){
 const active=(experimentPlayer?.status()||idlePlayer).state!=='idle'||previewVisual;
 autoSession++;previewVisual=null;currentExperimentStep=null;experimentPlayer?.stop();if(active)sound.stop();
}
// A preview is a demonstration, not the learner's saved settings. The first
// manual gesture restores those settings; a second, explicit gesture acts on them.
function handOffExperiment(target){
 if(!previewVisual)return false;
 const control=target?.closest('button,input,select');
 const selector=control?.id?`#${CSS.escape(control.id)}`:control?.dataset.action?`button${[...control.attributes].filter(a=>a.name.startsWith('data-')).map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join('')}`:'';
 stopExperiment();clearTimeout(liveTimer);playingUntil=0;
 feedback={kind:'hint',text:'자동실험을 멈췄어. 내 설정으로 돌아왔으니 직접 조절하고 조작해 봐.'};
 render();if(selector)app.querySelector(selector)?.focus({preventScroll:true});
 return true;
}
function syncExperimentPlayer(ps=(experimentPlayer?.status()||idlePlayer)){
 // Keep the pressed control in place until its click/drop has a target. Hiding
 // player controls here can cross a container-query breakpoint during a tap.
 if(experimentPointer!==null)return;
 const controls=app.querySelector('.autoplay-controls');if(!controls)return;
 controls.dataset.playerState=ps.state;
 const b=controls.querySelector('[data-action="auto-play"]'),label=b?.querySelector('.autoplay-state');
 b?.setAttribute('aria-pressed',String(ps.playing));const glyph=b?.querySelector('.icon path');glyph?.setAttribute('d',icons[ps.playing?'pause':'play']);
 if(label){label.textContent=playerLabel(ps);label.dataset.step=String(ps.currentStep);}
 const stop=controls.querySelector('[data-action="auto-stop"]');if(stop)stop.hidden=ps.state==='idle';
 const speed=controls.querySelector('select');if(speed)speed.value=String(ps.speed);
 if(['waiting','complete','idle'].includes(ps.state)&&previewVisual){previewVisual=null;render();return;}
 syncLessonCue();
}
function releaseExperimentPointer(){
 if(experimentPointer===null)return;
 clearTimeout(pointerReleaseTimer);experimentPointer=null;syncExperimentPlayer();
}
function syncLessonCue(){
 if(!route.startsWith('lesson/'))return;
 const i=Number(route.split('/')[1]),ps=(experimentPlayer?.status()||idlePlayer),cue=lessonCue(i,work(i),evidenceMatches(state,i));
 const text=app.querySelector('#coach-hint');if(text)text.innerHTML=emphasize(ps.state!=='idle'&&ps.message?ps.message:feedback?.text||cue.text,conceptTerms[lessons[i].stage]);
 const said=voiceFor(text?.textContent),replay=app.querySelector('.next-instruction .voice-replay');if(replay){replay.hidden=!said;if(said)replay.dataset.voice=said;}
 if(voiceSeen.route!==route)voiceSeen={route,text:text?.textContent||''};else if(text&&text.textContent!==voiceSeen.text){voiceSeen.text=text.textContent;if(said)voice.say(voiceCue(said,Boolean(app.querySelector('.challenge-complete'))),said==='retry'?150:1300);}
 app.querySelectorAll('.next-target,.next-choice-group').forEach(e=>e.classList.remove('next-target','next-choice-group'));
 const selector=ps.state!=='idle'&&ps.nextSelector?ps.nextSelector:cue.target;
 if(!selector)return;
 const targets=[...app.querySelectorAll(selector)].filter(e=>!e.disabled);
 if(targets.length>1){
  let group=targets[0].closest('fieldset,.challenge-tools,.medium-choices,.sort-slots,.sort-cards,.sensor-zones,.context-cards,.length-options,.solution-grid');
  if(!group){group=targets[0].parentElement;while(group&&!targets.every(e=>group.contains(e)))group=group.parentElement;}
  group?.classList.add('next-choice-group');
 }
 else targets[0]?.classList.add('next-target');
}
async function performExperimentStep(step,meta){
 if(!meta.isCurrent())return;
 currentExperimentStep=step;previewVisual=null;
 if(step.type==='preview'){
  previewVisual=step.visual||{};sound.stop();if(step.sound)sound.play(step.sound);render();return;
 }
 if(step.type==='range'){
  const input=app.querySelector(`#${step.id}`);if(!input)throw Error('Experiment control unavailable');
  autoplayDispatch=true;try{input.value=String(step.value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}finally{autoplayDispatch=false;}return;
 }
 if(step.type==='action'){
  const i=Number(route.split('/')[1]);if(step.data?.round!==undefined&&Number(step.data.round)!==(work(i).challenge?.proof?.length||0)){experimentPlayer?.stop();syncLessonCue();return;}
  const b=app.querySelector(step.selector);if(!b||b.disabled)throw Error('Experiment action unavailable');
  await handleClick({target:b,detail:1,auto:true});
 }
}
function fitExperiment(){
 cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(()=>{
  const board=app.querySelector('.experiment-board'),content=board?.querySelector('.experiment-content');if(!board||!content)return;
  content.style.setProperty('--content-fit','1');board.dataset.fitScale='1';
  const width=board.clientWidth-parseFloat(getComputedStyle(board).paddingLeft)-parseFloat(getComputedStyle(board).paddingRight);
  const height=board.clientHeight-parseFloat(getComputedStyle(board).paddingTop)-parseFloat(getComputedStyle(board).paddingBottom);
  if(width<=0||height<=0)return;
  let scale=1;
  for(let n=0;n<10;n++){
   const box=content.getBoundingClientRect();let left=box.left,right=box.right,top=box.top,bottom=box.bottom;
   const clipBoxes=new Map();
   for(const child of content.querySelectorAll('*')){
    const r=child.getBoundingClientRect();if(r.width<1||r.height<1)continue;
    let x1=r.left,x2=r.right,y1=r.top,y2=r.bottom;
    // Cropped artwork can extend far beyond its visible window. Measure that
    // window, while retaining overflow outside the actual experiment content.
    for(let parent=child.parentElement;parent&&parent!==content;parent=parent.parentElement){
     let clip=clipBoxes.get(parent);
     if(!clip){const style=getComputedStyle(parent);clip={x:/hidden|clip|auto|scroll/.test(style.overflowX),y:/hidden|clip|auto|scroll/.test(style.overflowY)};if(clip.x||clip.y)clip.box=parent.getBoundingClientRect();clipBoxes.set(parent,clip);}
     if(clip.x){x1=Math.max(x1,clip.box.left);x2=Math.min(x2,clip.box.right);}
     if(clip.y){y1=Math.max(y1,clip.box.top);y2=Math.min(y2,clip.box.bottom);}
     if(x2<=x1||y2<=y1)break;
    }
    if(x2<=x1||y2<=y1)continue;
    left=Math.min(left,x1);right=Math.max(right,x2);top=Math.min(top,y1);bottom=Math.max(bottom,y2);
   }
   const needW=Math.max(Math.max(content.scrollWidth,content.offsetWidth)*scale,right-left),needH=Math.max(Math.max(content.scrollHeight,content.offsetHeight)*scale,bottom-top);
   const factor=Math.min(1,width/needW,height/needH);if(factor>.995)break;
   scale=Math.max(.4,scale*factor*.995);content.style.setProperty('--content-fit',String(scale));
  }
  board.dataset.fitScale=scale.toFixed(3);
 });
}

function finalPage(){
 const i=finalStep,t=finalTasks[i],answered=Object.keys(state.finalAnswers).length;
 return `<main class="final-page final-focus"><div class="page-title"><div><span class="eyebrow">마지막 미션</span><h1>우리의 증거로 축제를 열자! ${voiceButton('final')}</h1></div>${rings()}</div>${evidenceCount(state)<LESSON_COUNT?'<div class="preview-notice">교사용 미리보기 · 정식 복구에는 증거 20개가 필요해.</div>':''}<nav class="final-steps" aria-label="다섯 가지 소리 원리">${stages.map((s,n)=>button(`${state.finalAnswers[n]!==undefined?'✓ ':''}${s.short}`,'final-step',`data-step="${n}" ${n===i?'aria-current="step"':''}`,`chapter ${n===i?'current':''}`)).join('')}</nav><div class="final-grid"><section class="final-task"><div class="final-stage">${stagePicture(i)} ${stages[i].name}<span>${i+1} / 5</span></div><div class="evidence-quote">${state.evidence[i*4+3]?emphasize(state.evidence[i*4+3].summary,conceptTerms[i]):'이 시설에서 모은 증거를 떠올려 봐.'}</div><h2>${t.q}</h2>${t.options.map((option,k)=>button(option,'final-choice',`data-question="${i}" data-choice="${k}" aria-pressed="${state.finalAnswers[i]===k}"`,`choice ${state.finalAnswers[i]===k?'selected':''}`)).join('')}<div class="final-navigation">${button('이전 원리','final-step',`data-step="${Math.max(0,i-1)}" ${i===0?'disabled':''}`,'btn quiet')}<span class="small-note">${i===4?'다섯 원리를 모았다면 코어를 복구해!':'답을 고르면 다음 원리로 이어져.'}</span></div></section><section class="core-control"><div class="mini-core">${prop('core','소리 코어')}</div><h2>다섯 발견이 모이면<br>축제가 시작돼!</h2><p>${answered} / 5 원리 선택</p>${button('소리 코어 복구하기','restore',answered<5?'disabled':'','btn primary')}<div class="feedback ${feedback?.kind||''}" role="status">${esc(feedback?.text||'모은 증거를 적용해서 코어를 깨워 줘.')}</div>${state.settings.admin?button('결과 미리보기','goto','data-route="result"','btn quiet'):''}</section></div></main>`;
}
function resultPage(){const genuine=state.restored&&evidenceCount(state)===LESSON_COUNT;return `<main class="result-page"><section class="certificate ${genuine?'':'preview'}"><span class="eyebrow">${genuine?'울림도시 · 소리 탐험가':'관리자 미리보기 · 아직 인증되지 않았어'}</span><div class="certificate-medal">${icon('star')}</div><h1>${genuine?'울림도시가 다시 깨어났어!':'도시의 복구를 기다리고 있어'}${genuine?voiceButton('ending'):''}</h1><p>${genuine?'관찰하고, 비교하고, 다시 도전한 너에게':'증거 20개와 마지막 복구를 마치면'}</p><h2>소리 탐험가 인증서</h2>${rings()}<div class="certificate-summary"><span><b>${evidenceCount(state)}</b>개 증거</span><span><b>${stages.filter((_,i)=>stageDone(state,i)).length}</b>곳 복구</span><span><b>5</b>가지 소리의 원리</span></div><p class="certificate-message">소리의 떨림, 크기, 높낮이, 전달을 탐구하고<br>함께 사는 친구들을 배려하는 방법을 발견했어.</p>${genuine?`<p class="certificate-date">복구한 날 · ${new Date(state.completedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</p>`:''}<div class="result-team">${portrait('girl')}${portrait()}${portrait('boy')}</div><div class="result-actions">${genuine?button('인증서 인쇄 · PDF 저장','print','','btn primary'):button('증거 모으러 가기','goto','data-route="map"','btn primary')}${button('내 증거 다시 보기','notebook','','btn secondary')}${button('지도 둘러보기','goto','data-route="map"','btn quiet')}</div></section><section class="result-findings"><h2>내가 발견한 다섯 원리</h2>${stages.map((s,i)=>button(`${stagePicture(i)}<span><small>${s.name}</small><b>${concepts[i].title}</b></span>${icon('play')}`,'concept',`data-stage="${i}"`,'finding-replay')).join('')}</section></main>`;}
function render(){
 const revision=++renderRevision;mapRevision++;fitObserver?.disconnect();
 disposeNpc?.();disposeNpc=null;map?.destroy();map=null;mapFailed=false;mapModuleFailed=false;pendingMapTravel=null;
 const requested=route,n=route.startsWith('lesson/')?Number(route.split('/')[1]):-1;
 if(n>=0&&(!experimentPlayer||lessons[n].challenge&&!challengeView)){
  app.innerHTML=header()+`<main class="route-loading"><p role="status">소리 실험을 준비하고 있어…</p>${button('지도 보기','goto','data-route="map"','btn secondary')}</main>`;
  within(Promise.all([prepareExperiment(),lessons[n].challenge?prepareChallenge():null])).then(()=>{
   if(revision===renderRevision&&route===requested){render();if(!modalRoot.querySelector('dialog')){const title=app.querySelector('main h1');title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});}}
  },()=>{
   if(revision!==renderRevision||route!==requested)return;
   app.innerHTML=header()+`<main class="route-loading"><h1 tabindex="-1">실험을 열지 못했어</h1>${button('다시 열기','reload-screen','','btn primary')}${button('지도 보기','goto','data-route="map"','btn secondary')}</main>`;
   app.querySelector('main h1')?.focus({preventScroll:true});
  });return;
 }
 const entering=voiceSeen.route!==route;sound.setScene(route.startsWith('lesson/')?'lesson':route);app.innerHTML=header()+(route==='home'?home():route==='map'?mapPage():route==='final'?finalPage():route==='result'?resultPage():lessonPage(Number(route.split('/')[1])))+adminDock()+`<footer class="statusbar"><span id="audio-status" role="status">${esc(soundText||'소리 준비됨')}</span><span id="save-status" role="status">${esc(studentState?'교사용 시연 · 학생 기록에 저장하지 않음':warning||'이 브라우저에 자동 저장 중')}</span></footer>${warning?`<div class="save-warning" role="alert">${esc(warning)}</div>`:''}`;if(route.startsWith('lesson/')){syncLessonCue();const n=Number(route.split('/')[1]);if(entering&&lessons[n].base===8&&!state.evidence[n])voice.say('reader-complaint',700);fitExperiment();fitObserver??=new ResizeObserver(fitExperiment);fitObserver.disconnect();fitObserver.observe(app.querySelector('.experiment-board'));}if(route==='home')disposeNpc=mountNpcGuide(app.querySelector('.title-actions'),{name:'울림새 삐오',portrait:'/image/generated/dialogue/pio.webp',src:'./media/audio/voices/el-welcome.mp3',text:'소리 탐험을 시작해 볼까? 소리가 날 때 물체가 어떻게 떨리는지 관찰하고, 소리의 크기와 높낮이를 직접 비교해 보자.',enabled:()=>!state.settings.muted&&state.settings.sfx,quiet:value=>{if(value)voice.stop();sound.setQuiet(value)}});if(route==='map')openMap();
 if(entering&&!route.startsWith('lesson/')){voiceSeen={route,text:''};if(route==='home')voice.say('title-bubble',400);if(route==='final')voice.say(voiceChains.final,500);if(route==='result'&&state.restored&&evidenceCount(state)===LESSON_COUNT)voice.say(voiceChains.ending,1600);}
}
function enterMapStage(n){
 if(n===5?!canRoute(state,'final'):!canLesson(state,n*4))return lockedNote(n);
 navigate(n===5?'final':`lesson/${stageLessons(n).find(i=>!state.evidence[i])??n*4}`);
}
function openMap(){
 const page=app.querySelector('.map-page'),canvas=page.querySelector('#world'),revision=++mapRevision;
 const current=()=>route==='map'&&revision===mapRevision&&page.isConnected;
 const status=document.createElement('div');status.className='map-load-state map-recovery';page.querySelector('.map-viewport').append(status);
 status.innerHTML='<p role="status">마을로 가는 길을 준비하고 있어…</p>';
 const fail=(moduleFailed=false)=>{
  if(!current())return;
  mapFailed=true;mapModuleFailed=moduleFailed;pendingMapTravel=null;syncMapTravel(null);
  const next=stages.findIndex((_,i)=>!stageDone(state,i)),target=next<0?5:next;
  status.hidden=false;
  status.innerHTML=`<p role="status">지도를 불러오지 못했어. 탐구 기록은 그대로야.</p>${button('지도 다시 열기','retry-map','','btn secondary')}${button(target===0?'첫 소리 실험 시작':'다음 탐험 시작','map-direct',`data-stage="${target}"`,'btn primary')}`;
 };
 mapLoad??=Promise.all([import('./map.js'),import('./map-controls.js'),import('./signal-restoration.js')]).then(([world,controls,signals])=>({world,controls,signals}));
 within(mapLoad).then(({world,controls,signals})=>{
  if(!current())return;
  status.hidden=true;
  try{
   const clearStage=dialogueStage;dialogueStage=null;
   map=world.mountMap(canvas,state,enterMapStage,{clearStage,onMapHit:patch=>{state.mapHits={...state.mapHits,...patch};save();},encounterTone:(kind,hits)=>sound.tone({frequency:kind==='finish'?100:kind==='contact'?145:hits===1?245:175,level:.38,duration:kind==='finish'?.18:.09,kind:'ui'}),onView:syncMapView,onNear:syncMapNext,onTravel:syncMapTravel,onLoad:()=>{if(current()){mapFailed=false;status.hidden=true;}},onError:()=>fail(),onStep:()=>sound.tone({frequency:170,level:.5,duration:.06,kind:'ui'}),residentLine:n=>stages[n].restored,residentLabel:n=>stages[n].name+' 주민과 대화하기',onTalk:residentDialogue});
   const events=new AbortController(),mounted=map,destroy=map.destroy;
   controls.bindDirectionPad(page,'.map-dpad [data-direction]',b=>b.dataset.direction,{signal:events.signal,blocked:()=>document.hidden||!!document.querySelector('dialog[open]'),press:d=>mounted.direction(d,true),release:d=>mounted.direction(d,false),tap:d=>mounted.nudge(d)});
   map.destroy=()=>{events.abort();destroy();};
   map.setView(mapView);
   if(modalRoot.querySelector('dialog')){pendingMapTravel=null;map.pause();}
   if(pendingMapTravel!==null){const target=pendingMapTravel;pendingMapTravel=null;map.walk(target);}
   const next=stages.findIndex((_,i)=>!stageDone(state,i)),mission=next<0?'mission-core':`mission-${next+1}`;
   if(!heardMissions.has(mission)){heardMissions.add(mission);voice.say(mission,700);}
   signals.mountSignalRestoration(page,state,save,frequency=>sound.play({frequency,kind:'fork',duration:.5}));
  }catch{fail();}
 },()=>fail(true));
}
function navigate(next){voice.stop();stopExperiment();cancelAdvance();inputLockedUntil=Date.now()+300;if(!canRoute(state,next))next='map';if(next!==route)trail.push(route);const lesson=lessonFromRoute(state,next);if(lesson!==null)state.resumeLesson=lesson;else if(next==='map'&&state.evidence[state.resumeLesson])state.resumeLesson=null;route=next;feedback=null;lastObject='';clearTimeout(liveTimer);playingUntil=0;sound.stop();closeModal(false);save();render();void sound.effect('tap');window.scrollTo(0,0);document.querySelector('main h1')?.setAttribute('tabindex','-1');document.querySelector('main h1')?.focus({preventScroll:true});}
sound.onStatus=text=>{soundText=text;const el=document.querySelector('#audio-status');if(el)el.textContent=text;};
function updateView(){const focus=document.activeElement;const action=focus?.dataset?.action,key=['tool','length','medium','slot','choice','case','solution','field','value','question'].map(k=>focus?.dataset?.[k]?`[data-${k}="${focus.dataset[k]}"]`:'').join('');render();if(action)document.querySelector(`[data-action="${action}"]${key}`)?.focus({preventScroll:true});}
function showFeedback(text,kind='hint'){feedback={text,kind};updateView();}
function openModal(content,label,footer=button('닫기','close','','btn primary'),kind='standard'){const hadPreview=Boolean(previewVisual);stopExperiment();if(hadPreview)render();cancelAdvance();if(!modalRoot.querySelector('dialog'))returnFocus=document.activeElement;modalRoot.innerHTML=`<dialog class="modal-${kind}" aria-label="${label}"><div class="modal-heading"><h2>${label}</h2>${button(icon('close'),'close','aria-label="닫기"','icon-btn')}</div><div class="modal-body">${content}</div><div class="modal-footer">${footer}</div></dialog>`;const dialog=modalRoot.querySelector('dialog');dialog.addEventListener('cancel',e=>{e.preventDefault();closeModal();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});map?.pause(true);if(kind!=='concept')void sound.effect(kind==='discovery'?'success':'open');dialog.showModal();dialog.querySelector('.modal-heading button')?.focus({preventScroll:true});}
function closeModal(focus=true){voice.stop();modalRoot.querySelector('video')?.pause();sound.setScene(route.startsWith('lesson/')?'lesson':route);modalRoot.querySelector('dialog')?.close();modalRoot.innerHTML='';map?.pause(false);if(focus&&returnFocus?.isConnected)returnFocus.focus();}
function showSettings(){const paragraphs=items=>items.map(x=>`<p>${esc(x)}</p>`).join('');const toggle=(label,key)=>`<div class="setting-row"><b>${label}</b><button class="switch ${state.settings[key]?'on':''}" role="switch" aria-checked="${state.settings[key]}" aria-label="${label}" data-action="sound-setting" data-key="${key}"><span></span></button></div>`;openModal(`<p class="modal-intro">${copy.intro}</p><div class="sound-toggles">${toggle('배경 음악','bgm')}${toggle('효과음','sfx')}</div><div class="setting-row"><label for="bgm-volume">배경 음악 크기 <output id="bgm-value">${state.settings.bgmVolume}</output></label><input id="bgm-volume" type="range" min="0" max="100" step="5" value="${state.settings.bgmVolume}" ${state.settings.bgm?'':'disabled'}></div><div class="settings-shortcuts">${button('이 탐험을 하는 이유 다시 보기','story','','btn secondary settings-story')}${state.restored?button('엔딩 다시 보기','ending','','btn quiet')+button('인증서 받기','certificate','','btn quiet'):''}</div><div class="settings-help-grid"><details><summary>앱 정보 · 배움과 보상</summary><p><b>탐험 목적</b> ${copy.purpose}</p><p><b>미션 보상</b> ${copy.reward}</p><p><b>남는 배움</b> ${copy.learning}</p><p>울림도시 대작전 v${APP_VERSION} · ${copy.signature}</p></details><details><summary>학생용 가이드</summary>${paragraphs(copy.student)}</details><details><summary>교사용 가이드</summary>${paragraphs(copy.teacher)}<details><summary>성취기준</summary><p>${copy.curriculumIntro}</p>${paragraphs(copy.standards)}</details><details><summary>교사용 도구</summary><p>버튼 하나로 모든 활동과 마무리를 열어요. 시연 중 조작·정답·완료 기록은 학생 기록에 저장하지 않아요.</p><p>열린 동안 화면 왼쪽 아래 ← → 버튼(키보드 방향키)으로 활동을 하나씩 넘기고, 오른쪽 아래 ‘다음 스테이지’로 다음 시설까지 바로 건너뛸 수 있어요.</p>${button(state.settings.admin?'모두 열림 · 다시 누르면 닫기':'모든 단계 한 번에 열기','admin',`aria-pressed="${state.settings.admin}"`,'btn secondary wide')}<p>수업 시연용이에요. 다시 누르거나 새로고침하면 학생의 원래 진행으로 돌아가요.</p></details></details><details><summary>이미지·소리·저작권 고지</summary>${paragraphs(copy.credits)}<details><summary>자료 출처 모아 보기</summary>${paragraphs(copy.sources)}</details>${paragraphs(copy.copyright)}</details></div>`,'설정',`${button('탐험 기록 초기화','reset-confirm','','btn danger')}${button('닫기','close','','btn primary')}`,'settings');}
function notebook(stage=route.startsWith('lesson/')?lessons[Number(route.split('/')[1])].stage:notebookStage){
 notebookStage=stage;
 openModal(`<nav class="notebook-tabs" aria-label="시설별 증거">${stages.map((s,n)=>button(s.short,'notebook-stage',`data-stage="${n}" aria-pressed="${stage===n}"`,`chapter ${stage===n?'current':''}`)).join('')}</nav><div class="notebook-summary"><b>${stages[stage].name}</b><span>전체 증거 ${evidenceCount(state)} / ${LESSON_COUNT}</span>${button(`${icon('play')} 16초 개념 영상`,'concept',`data-stage="${stage}"`,'btn quiet')}</div><div class="evidence-list">${stageLessons(stage).map(i=>{const l=lessons[i];return `<article class="${state.evidence[i]?'collected':''}"><span class="evidence-number">${state.evidence[i]?'✓':i%4+1}</span><div><h3>${l.phase} · ${l.title}</h3><p>${state.evidence[i]?emphasize(state.evidence[i].summary,conceptTerms[l.stage]):'아직 모은 증거가 없어.'}</p></div>${button(state.evidence[i]?'다시 실험':'실험하기','goto',`data-route="lesson/${i}" ${canLesson(state,i)?'':'disabled'}`,'btn quiet')}</article>`;}).join('')}</div>`,'내 증거 노트',button('닫기','close','','btn primary'),'notebook');
}

function completion(i){
 if(!evidenceMatches(state,i))return;
 if(i%4===3&&stageDone(state,lessons[i].stage)){
  showConcept(lessons[i].stage,i===LESSON_COUNT-1?'final':`lesson/${i+1}`,true);
 }else navigate(`lesson/${i+1}`);
}
function showConcept(stage,next=null,reward=false){
 const c=concepts[stage];if(!c)return;
 sound.stop();sound.setScene('concept');
 const footer=next?button(`${next==='final'?'마지막 코어 복구로':next.startsWith('lesson/')?'다음 시설로':'복구한 마을로'} ${icon('arrow')}`,'goto',`data-route="${next}"`,'btn primary'):button(route==='result'?'인증서로 돌아가기':'활동으로 돌아가기','close','','btn primary');
 openModal(`${reward?`<div class="concept-reward"><span>✓ ${achievements[stage].name} 배지 획득</span><b>${stages[stage].restored}</b></div>`:''}${conceptView(stage)}${reward?`<p class="learning-bridge">${emphasize(stages[stage].nextInquiry,conceptTerms[stage])}</p>`:''}`,`${reward?'시설 복구! · ':''}${c.title}`,`${button('처음부터 보기','replay-concept','','btn quiet')}${footer}`,'concept');
 const video=modalRoot.querySelector('video');video.muted=state.settings.muted||!state.settings.sfx;video.volume=c.volume??1;
 video.addEventListener('timeupdate',()=>{const active=Math.min(3,Math.floor(video.currentTime/4));modalRoot.querySelectorAll('[data-cue]').forEach(el=>el.classList.toggle('active',Number(el.dataset.cue)===active));});
 video.addEventListener('ended',()=>{void sound.effect('badge');modalRoot.querySelector('.modal-footer .primary')?.classList.add('ready-action');});
 const failed=()=>{modalRoot.querySelector('.concept-fallback').hidden=false;modalRoot.querySelector('.concept-transcript').open=true;};
 video.addEventListener('error',failed);video.querySelector('source').addEventListener('error',failed);
 if(reward&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)void video.play().catch(()=>{});
}

modalRoot.addEventListener('input',e=>{if(e.target.id==='bgm-volume'){state.settings.bgmVolume=Number(e.target.value);configureSound();save();modalRoot.querySelector('#bgm-value').textContent=e.target.value;}});

app.addEventListener('input',e=>{
 const param=e.target.dataset.challengeParam;if(!param)return;
 const value=Number(e.target.value),out=app.querySelector(`[data-param-output="${param}"]`);
 if(out)out.textContent=param==='length'?`${value} cm`:['music','announcement'].includes(param)?['끔','작게','보통','크게'][value]:['','약하게','보통','세게'][value];
 const length=Number(app.querySelector('[data-challenge-param="length"]')?.value)||12,force=Number(app.querySelector('[data-challenge-param="force"]')?.value)||1;
 const scope=app.querySelector('.challenge-live-wave');if(scope)scope.innerHTML=liveWave(force/3,param==='length'||app.querySelector('#mix-length')?(length===6?9:length===12?6:3):5);const device=app.querySelector('.mix-device');if(device&&param==='length')device.innerHTML=rulerKey(length);
 if(['music','announcement'].includes(param)){const good=param==='music'?value<=1:value>=2,el=app.querySelector(`[data-resident="${param}"]`);el?.classList.toggle('satisfied',good);if(el)el.querySelector('span').textContent=good?'✓':'…';}
});
app.addEventListener('change',e=>{
 const param=e.target.dataset.challengeParam;if(!param||!route.startsWith('lesson/'))return;
 const i=Number(route.split('/')[1]);if(Date.now()<inputLockedUntil){updateView();return;}runTrial(i,param,{value:e.target.value,round:e.target.dataset.round});finishInteraction(i);app.querySelector(`[data-challenge-param="${param}"]`)?.focus({preventScroll:true});
});
app.addEventListener('input',e=>{if(e.target.id==='ruler-length'){const n=Number(route.split('/')[1]),value=Number(e.target.value);setWork(n,{length:value});document.querySelector('#ruler-value').textContent=`${value} cm`;e.target.setAttribute('aria-valuetext',`${value} 센티미터`);const ruler=document.querySelector('.illustrated-bench .illustrated-ruler');ruler.style.setProperty('--free',value/18);ruler.setAttribute('aria-label',`같은 자에서 떨리는 길이 ${value} 센티미터`);document.querySelector('#ruler-scope').innerHTML=liveWave(.65,value===6?9:value===12?6:3);return;}if(e.target.id==='force'){const n=Number(route.split('/')[1]);setWork(n,{force:Number(e.target.value)});const text=['','약하게','보통','세게'][Number(e.target.value)];document.querySelector('#force-value').textContent=text;e.target.setAttribute('aria-valuetext',text);const scope=document.querySelector('#force-scope');if(scope)scope.innerHTML=liveWave(Number(e.target.value)/3,5);feedback=null;syncLessonCue();}});
app.addEventListener('change',e=>{
 if(e.target.id!=='ruler-length'||!route.startsWith('lesson/'))return;
 const i=Number(route.split('/')[1]),w=work(i),length=Number(e.target.value);
 w.length=length;w.lengths=[...new Set([...arr(w.lengths),length])];
 sound.play({frequency:lengths.find(l=>l.value===length).frequency,level:.5});finishInteraction(i);
 app.querySelector('#ruler-length')?.focus({preventScroll:true});
});
async function handleClick(e){void sound.unlock();const b=e.target.closest('button[data-action]');if(!b||b.disabled)return;const a=b.dataset.action,i=route.startsWith('lesson/')?Number(route.split('/')[1]):-1,w=i>=0?work(i):{};
  if(a==='voice-replay'){const id=b.dataset.voice;voice.say(voiceChains[id]||voiceCue(id,Boolean(app.querySelector('.challenge-complete'))));return;}
  voice.stop();
  if(e.detail>1&&['continue','goto','restore'].includes(a))return;
  if(a==='auto-play'){
   const ps=(experimentPlayer?.status()||idlePlayer);
   if(ps.playing){experimentPlayer.pause();sound.stop();clearTimeout(liveTimer);playingUntil=0;updateView();return;}
   if(ps.state==='paused'){const step=currentExperimentStep,context=`${route}|${autoSession}`;experimentPlayer.start();if(step)void performExperimentStep(step,{isCurrent:()=>(experimentPlayer?.status()||idlePlayer).playing&&context===`${route}|${autoSession}`});return;}
   if(i<0)return;if(lessons[i].challenge==='rhythm'&&w.challenge)w.challenge.sounding=false;previewVisual=null;experimentPlayer.start(experimentPlan(i,w,state.evidence));return;
  }
  if(a==='auto-stop'){stopExperiment();clearTimeout(liveTimer);playingUntil=0;updateView();return;}
  if(!e.auto){if(b.closest('.experiment-board')&&handOffExperiment(b))return;const hadPreview=Boolean(previewVisual);stopExperiment();if(hadPreview){render();app.querySelector(`[data-action="${a}"]`)?.focus({preventScroll:true});}}
  if(a==='activity-tools')return openModal(`<div class="activity-menu">${button(`${icon('book')} 내 증거 노트`,'notebook','','btn secondary')}${button(`${icon('play')} 개념 영상`,'concept',`data-stage="${lessons[i].stage}"`,'btn secondary')}${button(`${icon('map')} 지도 보기`,'goto','data-route="map"','btn quiet')}${adminDock(true)}</div>`,'노트와 개념 영상');
  if(a==='home')return navigate('home');
  if(a==='start')return navigate(canLesson(state,state.resumeLesson)?`lesson/${state.resumeLesson}`:'map');
  if(a==='goto')return navigate(b.dataset.route);
  if(a==='back'){const target=trail.pop()||(i>0&&i%4>0?`lesson/${i-1}`:route==='home'?'home':'map');const previous=trail;trail=[];navigate(target);trail=previous;return;}
  if(a==='close')return closeModal();
  if(a==='settings')return showSettings();
  if(a==='notebook')return notebook();
  if(a==='notebook-stage')return notebook(Number(b.dataset.stage));
  if(a==='concept')return showConcept(Number(b.dataset.stage));
  if(a==='replay-concept'){const video=modalRoot.querySelector('video');if(video){video.currentTime=0;void video.play().catch(()=>{});}return;}
  if(a==='final-step'){cancelAdvance();finalStep=Math.min(4,Math.max(0,Number(b.dataset.step)));feedback=null;updateView();return;}
  if(a==='mute'){const bothOff=!state.settings.bgm&&!state.settings.sfx;if(bothOff){state.settings.bgm=true;state.settings.sfx=true;state.settings.muted=false;}else state.settings.muted=!state.settings.muted;configureSound();playingUntil=0;clearTimeout(liveTimer);save();updateView();return;}
  if(a==='admin'){
   if(!studentState){save();studentState=state;state=structuredClone(state);state.settings.admin=true;}
   else{state=studentState;studentState=null;route=state.lastRoute;}
   trail=[];feedback=null;if(!canRoute(state,route))route='map';
   sound.stop();playingUntil=0;clearTimeout(liveTimer);configureSound();render();showSettings();return;
  }
  if(a==='reset-confirm'){openModal(`<p>${studentState?'시연 기록만 새로 시작할까? 학생 기록은 그대로야.':'현재 기록을 브라우저에 백업한 뒤 처음부터 시작할까?'}</p><p>${copy.reset}</p>`,'탐험 기록을 초기화할까요?',`${button('취소','close','','btn secondary')}${button('기록 지우기','reset','','btn danger')}`);modalRoot.querySelector('.modal-footer [data-action="close"]')?.focus();return;}
  if(a==='reset'){
   if(!studentState&&!persistence.backup()){closeModal();warning='원본 기록을 안전하게 보관하지 못해 초기화하지 않았어.';render();return;}
   const audioSettings={...state.settings};state=freshState();for(const key of ['muted','bgm','sfx','bgmVolume'])state.settings[key]=audioSettings[key];state.settings.admin=Boolean(studentState);
   warning=loaded.blocked?loaded.warning:'';trail=[];configureSound();navigate('home');trail=[];render();return;
  }
  if(a==='reload-screen')return location.reload();
  if(a==='retry-map'&&route==='map'&&mapFailed){if(mapModuleFailed)return location.reload();return render();}
  if(a==='map-direct'&&route==='map'&&mapFailed)return enterMapStage(Number(b.dataset.stage));
  if(a==='map-view'){map?.browse(mapView===b.dataset.view?'follow':b.dataset.view);return;}
  if(a==='travel'){const n=Number(b.dataset.stage);if(b.getAttribute('aria-disabled')==='true')return lockedNote(n);if(mapFailed)return enterMapStage(n);if(map)map.walk(n);else{pendingMapTravel=n;syncMapTravel(n);}return;}
  if(a==='sound-setting'){const key=b.dataset.key;if(['bgm','sfx'].includes(key)){state.settings[key]=!state.settings[key];configureSound();save();showSettings();}return;}
  if(a==='story'){openModal(`${pioPortrait()}<div class="story-card"><span class="npc-scene-name">울림새 삐오</span><h3>소리 코어가 멈췄어!</h3><p>물체를 울리고, 조건을 바꾸며 소리의 비밀을 찾아 줘. 네가 모은 증거 20개로 다섯 시설을 복구하면 주민들의 축제가 다시 열려!</p><p>시설마다 관찰 → 비교 → 응용 → 주민 의뢰를 해결해. 배지와 탐구 기록이 남아.</p></div>`,'이 탐험을 하는 이유',voiceButton('story','삐오 목소리 다시 듣기',true)+button('탐험하러 가기','goto','data-route="map"','btn primary'),'npc');modalRoot.querySelector('dialog').dataset.voiceLines=voiceChains.story.join(',');voice.say(voiceChains.story,200);return;}
  if(a==='ending')return state.restored?navigate('result'):undefined;
  if(a==='certificate')return state.restored?navigate('result'):undefined;
  if(a==='guide'){
   void sound.effect('hint');
   if(i>=0){hintLevels[i]=((hintLevels[i]||0)+1)%3;updateView();return;}
   openModal(`${pioPortrait()}<div class="story-card"><span class="npc-scene-name">울림새 삐오</span><h3>나는 울림새 삐오야!</h3><p>방향키나 화면 화살표로 길 위를 자유롭게 걸어 봐. 길을 누르면 그곳까지 걸어가고, 시설 이름을 누르면 시설로 가. 내가 뒤를 따라갈게.</p><p>지도를 손으로 끌어 둘러보거나 ‘지도 한눈에 보기’로 마을 전체를 볼 수 있어. 다시 걸으면 탐험가에게 돌아와.</p><p>각 시설의 네 활동을 마치면 16초 개념 영상과 복구 배지가 기다려!</p></div>`,'삐오와 함께 탐험해',voiceButton('guide','삐오 목소리 다시 듣기',true)+button('닫기','close','','btn primary'),'npc');modalRoot.querySelector('dialog').dataset.voiceLines=voiceChains.guide.join(',');voice.say(voiceChains.guide,200);return;
  }
  if(a==='print')return window.print();
  if(a==='final-choice')void sound.effect('tap');
  if(a==='final-choice'){
   cancelAdvance();const question=Number(b.dataset.question);
   state.finalAnswers[question]=Number(b.dataset.choice);feedback=null;save();updateView();
   if(question<4)advanceTimer=setTimeout(()=>{if(route==='final'&&finalStep===question){finalStep=question+1;updateView();app.querySelector('.final-task h2')?.setAttribute('tabindex','-1');app.querySelector('.final-task h2')?.focus({preventScroll:true});}},600);
   else app.querySelector('[data-action="restore"]')?.focus({preventScroll:true});
   return;
  }
  if(a==='restore'){const result=checkFinal(state);if(!result.ok){cancelAdvance();finalStep=result.wrong[0];return showFeedback(`${result.wrong.map(n=>stages[n].name).join(', ')}의 증거를 다시 읽어 봐. 선택을 바꿔 다시 도전할 수 있어.`,'error');}if(!result.eligible)return showFeedback('미리보기의 선택은 모두 맞았어! 정식 복구와 인증서를 받으려면 학습 증거 20개를 모아 줘.','hint');state.restored=true;state.completedAt=new Date().toISOString();save();navigate('result');void sound.effect('badge');return;}
  if(i<0)return;
  if(a==='continue')return completion(i);
  if(Date.now()<inputLockedUntil&&!e.auto)return;
  feedback=null;
  if(a==='strike')strikeAndCapture(w,Number(b.dataset.value)||1);
  if(a==='pluck'){const length=w.length||18;w.lengths=[...new Set([...arr(w.lengths),length])];sound.play({frequency:lengths.find(l=>l.value===length).frequency,level:.5});}
  if(a.startsWith('challenge-')){runTrial(i,a.slice(10),b.dataset);finishInteraction(i);return;}
  if(a==='choice'){w.choice=Number(b.dataset.choice);const result=checkLesson(state,i);if(!result.ok)feedback={kind:'hint',text:result.message};}
  if(a==='instrument'){const t=instruments.find(t=>t.id===b.dataset.tool);w.seen=[...new Set([...arr(w.seen),t.id])];lastObject=t.id;playingUntil=Date.now()+1700;sound.play({frequency:t.frequency,kind:t.id,duration:1.7});clearTimeout(liveTimer);liveTimer=setTimeout(()=>{playingUntil=0;if(route===`lesson/${legacyIndex(0)}`)updateView();},1700);}
  if(a==='fork-start'){w.started=true;playingUntil=Date.now()+4000;sound.play({frequency:520,duration:4,kind:'fork'});clearTimeout(liveTimer);liveTimer=setTimeout(()=>{playingUntil=0;if(route===`lesson/${legacyIndex(1)}`)updateView();},4000);}
  if(a==='fork-stop'){if(playingUntil<=Date.now())return;w.stopped=true;playingUntil=0;clearTimeout(liveTimer);sound.stop();feedback={kind:'success',text:'눌렀더니 떨림과 소리가 함께 멈췄어. 누르기 전과 비교해 봐.'};}
  if(a==='hit')strikeAndCapture(w,w.force||1);
  if(a==='capture'){const force=w.force||1;w[b.dataset.slot]=force;sound.play({kind:'drum',frequency:150,level:force/3,duration:1});}
  if(a==='sample-play'){const pair=state.evidence[legacyIndex(2)]?.observation;if(!pair)return;const pairKey=`${pair.a},${pair.b}`;if(w.pairKey!==pairKey){w.heardA=false;w.heardB=false;}w.pairKey=pairKey;w[b.dataset.slot==='a'?'heardA':'heardB']=true;sound.play({kind:'drum',frequency:150,level:pair[b.dataset.slot]/3,duration:1});}
  if(a==='length'){const length=Number(b.dataset.length);w.length=length;w.lengths=[...new Set([...arr(w.lengths),length])];sound.play({frequency:lengths.find(l=>l.value===length).frequency,level:.5});}
  if(a==='target'){w.targetHeard=true;sound.sequence([18,6,12].map(value=>({frequency:lengths.find(l=>l.value===value).frequency,level:.5})));}
  if(a==='note'){const length=Number(b.dataset.length);sound.play({frequency:lengths.find(l=>l.value===length).frequency,level:.5,duration:.45});if(!w.targetHeard)feedback={kind:'hint',text:'먼저 목표 신호를 들어 봐.'};else{w.pattern=arr(w.pattern).length>=3?[length]:[...arr(w.pattern),length];const result=checkLesson(state,i);if(w.pattern.length===3&&!result.ok)feedback={kind:'hint',text:result.message};}}
  if(a==='pattern-reset'){w.pattern=[];sound.stop();}
  if(a==='medium'){const m=media.find(m=>m.id===b.dataset.medium);w.media=[...new Set([...arr(w.media),m.id])];sound.play({...transferSound(m.id,.5),duration:1.2});feedback={kind:'success',text:m.detail};}
  if(a==='case'){w.currentCase=Number(b.dataset.case);w.caseChoice=null;sound.stop();}
  if(a==='case-choice')w.caseChoice=b.dataset.medium;
  if(a==='case-choice'){const k=w.currentCase||0;if(w.caseChoice===transferCases[k].answer){w.verified={...w.verified,[k]:w.caseChoice};sound.play(transferSound(w.caseChoice));feedback={kind:'success',text:`맞아! ${media.find(m=>m.id===w.caseChoice).label}${w.caseChoice==='water'?'을':'를'} 통해 전달됐어. ${Object.keys(w.verified).length===3?'세 상황을 모두 연결했어.':'다음 상황에서도 소리 길을 찾아봐.'}`};const next=transferCases.findIndex((_,n)=>!w.verified[n]);if(next>=0){w.currentCase=next;w.caseChoice=null;inputLockedUntil=Date.now()+500;}}else feedback={kind:'error',text:w.caseChoice?'소리를 내는 물체와 듣는 곳 사이를 다시 살펴봐. 다른 물질을 눌러 다시 확인해 봐.':'먼저 공기·물·고체 중 하나를 골라 줘.'};}
  if(a==='noise-scene'){w.heard=true;sound.sequence([0,1,2].map(()=>({kind:'drum',frequency:150,level:.85})));}
  if(a==='diagnostic')w[b.dataset.field]=b.dataset.value;
  if(a==='solution'){const id=b.dataset.solution;feedback={kind:'hint',text:solutions.find(s=>s.id===id).detail};w.solutions=arr(w.solutions).includes(id)?w.solutions.filter(x=>x!==id):[...arr(w.solutions),id];w.after=false;sound.stop();void sound.effect('drop');}
  if(a==='noise-before'){w.before=true;sound.sequence([0,1,2].map(()=>({kind:'drum',frequency:150,level:.85})));}
  if(a==='noise-after'){if(!arr(w.solutions).length)return showFeedback('해결책을 하나 이상 적용한 다음 들어 봐.','error');w.after=true;w.afterKey=w.solutions.slice().sort().join(',');if(w.solutions.includes('time')){sound.stop();feedback={kind:'success',text:'지금은 독서 시간이어서 조용해. 북 연습은 독서가 끝난 뒤에 해.'};}else sound.sequence([0,1,2].map(()=>({kind:'drum',frequency:150,level:noiseLevel(w)})));}
  if(a==='submit'){const wasDone=stageDone(state,i),result=recordEvidence(state,i);save();if(result.ok){if(!wasDone&&stageDone(state,i)&&!state.settings.admin)dialogueStage=i;feedback=null;updateView();}else showFeedback(result.message,'hint');return;}
  finishInteraction(i);
}

const manipulationOptions={
 session:()=>route.startsWith('lesson/')?{i:Number(route.split('/')[1]),round:work(Number(route.split('/')[1])).challenge?.proof?.length||0}:null,
 unlock:()=>void sound.unlock(),
 commit:(steps,session)=>{
  if(!route.startsWith('lesson/')||Date.now()<inputLockedUntil)return;
  const i=Number(route.split('/')[1]),w=work(i);
  if(session?.i!==i)return;
  for(const step of steps){
   if(step.action.startsWith('challenge-'))runTrial(i,step.action.slice(10),{value:step.value,round:session.round});
   if(step.action==='strike')strikeAndCapture(w,Number(step.value));
  }
  finishInteraction(i);
 }
};
app.addEventListener('click',handleClick);modalRoot.addEventListener('click',handleClick);
document.addEventListener('visibilitychange',()=>{if(document.hidden){const hadPreview=Boolean(previewVisual);stopExperiment();cancelAdvance();modalRoot.querySelector('video')?.pause();for(const w of Object.values(state.work))if(w.challenge)w.challenge.sounding=false;sound.stop();playingUntil=0;clearTimeout(liveTimer);if(hadPreview||route.startsWith('lesson/'))render();}});
document.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey||modalRoot.querySelector('dialog'))return;
 if(e.target instanceof Element&&e.target.closest('input,select,textarea,[contenteditable="true"]'))return;
 const t=state.settings.admin&&adminTargets(),next=t&&(e.key==='ArrowLeft'?t.prev:t.next);
 if(next){e.preventDefault();navigate(next);}
});
window.addEventListener('pagehide',()=>{const hadPreview=Boolean(previewVisual);stopExperiment();cancelAdvance();clearTimeout(liveTimer);playingUntil=0;for(const w of Object.values(state.work))if(w.challenge)w.challenge.sounding=false;sound.stop();map?.destroy();if(hadPreview||route.startsWith('lesson/'))render();});
render();
// Offline cache for classroom Wi-Fi drops; skipped on local dev unless ?sw is added.
if('serviceWorker' in navigator&&location.protocol!=='file:'&&(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||new URLSearchParams(location.search).has('sw'))){
 const register=()=>navigator.serviceWorker.register('/sw.js').catch(()=>{});
 if(document.readyState==='complete')register();else addEventListener('load',register,{once:true});
}

app.addEventListener('pointerdown',e=>{if(!e.target.closest('.experiment-board'))return;if(handOffExperiment(e.target)){e.preventDefault();e.stopImmediatePropagation();return;}clearTimeout(pointerReleaseTimer);experimentPointer=e.pointerId;stopExperiment();},{capture:true});
document.addEventListener('pointerup',e=>{if(e.pointerId===experimentPointer)pointerReleaseTimer=setTimeout(releaseExperimentPointer,0);},{capture:true});
document.addEventListener('click',releaseExperimentPointer,{capture:true});
document.addEventListener('pointercancel',releaseExperimentPointer,{capture:true});
window.addEventListener('blur',releaseExperimentPointer);
app.addEventListener('keydown',e=>{if(e.target.matches('.experiment-board input[type="range"]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)&&handOffExperiment(e.target)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
app.addEventListener('input',e=>{if(e.target.id==='experiment-speed'){experimentPlayer?.setSpeed(Number(e.target.value));return;}if(!autoplayDispatch){if(handOffExperiment(e.target)){e.stopImmediatePropagation();return;}stopExperiment();}},{capture:true});
window.addEventListener('resize',()=>{syncExperimentPlayer();fitExperiment();});
window.visualViewport?.addEventListener('resize',fitExperiment);
document.fonts.ready.then(fitExperiment);
