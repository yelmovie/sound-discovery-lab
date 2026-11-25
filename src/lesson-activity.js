import {art,rulerIllustration} from './illustrations.js';
import {lessons,instruments,lengths,legacyPitchTarget,media,transferCases,diagnosisFields,solutions,legacyIndex} from './data.js';
import {liveWave,rulerKey} from './manipulations.js';
import {pitchScore} from './challenges.js';
const arr=x=>Array.isArray(x)?x:[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function answerChoices(i,w,button){
 const lesson=lessons[i];
 if(!lesson.choices)return '';
 const question=lesson.base===4?'짧아질수록 소리의 높낮이는?':lesson.question;
 const labels=lesson.base===4?['높아져.','낮아져.']:lesson.base===9?['독서 방해를 줄일 수 있어.','모든 소리가 완전히 없어져.']:lesson.choices;
 return `<section class="answer-group" role="group" aria-labelledby="answer-question-${i}">
  <h2 class="answer-question" id="answer-question-${i}">${question}</h2>
  <div class="answer-options">${labels.map((choice,k)=>button(choice,'choice',`data-choice="${k}" aria-pressed="${w.choice===k}"`,`choice ${w.choice===k?'selected':''}`)).join('')}</div>
 </section>`;
}
export function activity(index,w,{state,playingUntil,lastObject,button,icon,prop,toolGraphic,wave,voiceButton,challengeView,previewVisual,visualForce}){
 const choiceGroup=(i,w)=>answerChoices(i,w,button);
 const diagnostic=(...args)=>diagnosticChoices(button,...args);
 const missing=(...args)=>missingRecord(button,icon,...args);
  const i=lessons[index].base;
  if(lessons[index].challenge)return challengeView(lessons[index].challenge,w,{button,icon,prop,toolGraphic,wave,playingUntil,previewVisual,visualForce});
  const live=playingUntil>Date.now();
  if(i===0){
   const observed=instruments.find(t=>t.id===lastObject),shown=observed||instruments[0];
   return `<div class="vibration-workspace observe-workspace">
    <figure class="vibration-art ${live?'pulse':''} ${arr(w.seen).includes(shown.id)?'observed':''}">${toolGraphic(shown.id)}</figure>
    <div class="vibration-controls">
     <div class="experiment-label"><span>관찰 ${arr(w.seen).length} / 4</span></div>
     <div class="instruments" role="group" aria-label="관찰할 악기">${instruments.map(t=>button(
       `${icon(arr(w.seen).includes(t.id)?'check':'play')} <b>${t.name}</b>`,'instrument',
       `data-tool="${t.id}" aria-pressed="${observed?.id===t.id}"`,`instrument ${arr(w.seen).includes(t.id)?'observed':''}`)).join('')}</div>
     <div class="observation-window">${observed?`<span>${observed.observation}</span>`:''}${wave(observed ? .8 : 0,6,!observed,live?1700:0)}</div>
     ${arr(w.seen).length>=2?choiceGroup(index,w):''}
    </div>
   </div>`;
  }
  if(i===1)return `<div class="vibration-workspace fork-workspace">
   <figure class="vibration-art ${live?'pulse':''}">${toolGraphic('fork')}</figure>
   <div class="vibration-controls">
    ${button(live?`${icon('hand')} 잡아서 멈추기`:`${icon('play')} 소리굽쇠 울리기`,live?'fork-stop':'fork-start','id="fork-control"','btn primary fork-control')}
    <div class="comparison">
     <div><b>잡기 전</b>${w.started?wave(.8,5,false,live?4000:0):'<span class="wave-placeholder" aria-label="잡기 전 기록 대기"></span>'}</div>
     <div><b>잡은 뒤</b>${w.stopped?wave(0,0,true):'<span class="wave-placeholder" aria-label="잡은 뒤 기록 대기"></span>'}</div>
    </div>
    ${w.started&&w.stopped?choiceGroup(index,w):''}
   </div>
  </div>`;
  if(i===2)return `<div class="force-lab"><button class="drum-display strike-pad ${live?'pulse':''}" data-action="hit" data-drag-kind="strike" data-force="${(live&&visualForce)||w.force||1}" aria-label="직접 두드리거나 아래로 쓸어 북 치기">${toolGraphic('drum')}<span class="tool-caption">북 치기</span></button><div class="force-control"><label for="force">치는 세기 <b id="force-value">${['','약하게','보통','세게'][w.force||1]}</b></label><input id="force" type="range" min="1" max="3" step="1" value="${w.force||1}" aria-valuetext="${['','약하게','보통','세게'][w.force||1]}"><div class="range-ticks"><span>약하게</span><span>보통</span><span>세게</span></div><div class="live-scope" id="force-scope">${live?wave((visualForce||w.force||1)/3,5,false,1000):liveWave((w.force||1)/3,5)}</div></div></div><div class="sample-pair">${['a','b'].map(k=>`<section><span class="sample-letter">${k.toUpperCase()}</span>${w[k]?wave(w[k]/3,5):'<div class="empty-wave">아직 기록이 없어</div>'}<p>${w[k]?['','약하게','보통','세게'][w[k]]:''}</p>${w[k]?button(`${k.toUpperCase()} 바꾸기`,'capture',`data-slot="${k}"`,'btn quiet'):''}</section>`).join('')}</div>`;
  if(i===3){
   const pair=state.evidence[legacyIndex(2)]?.observation;
   if(!pair)return missing(2,'비교할 내 실험이 아직 없어.');
   const heardPair=w.pairKey===`${pair.a},${pair.b}`;
   return `<div class="experiment-label"><span>같은 북 · 다른 세기</span></div><div class="sample-pair large">
    ${['a','b'].map(key=>{
     const heard=heardPair&&w[key==='a'?'heardA':'heardB'];
     return `<section>
      ${heard?wave(pair[key]/3,5):'<span class="wave-placeholder" aria-label="아직 듣지 않은 기록"></span>'}
      ${button(`${icon(heard?'check':'play')} 실험 ${key.toUpperCase()} 듣기`,'sample-play',`data-slot="${key}"`,'btn secondary')}
     </section>`;
    }).join('')}
   </div>${heardPair&&w.heardA&&w.heardB?choiceGroup(index,w):''}`;
  }
  if(i===4)return `<div class="ruler-demonstration"><div class="fixed-conditions"><span>같은 자 · 같은 재료와 두께 · 같은 힘</span></div><div class="ruler-bench illustrated-bench">${rulerIllustration(w.length||18)}</div><div class="ruler-play-row">${button(`${icon('play')} 다시 듣기`,'pluck','','btn secondary')}<span>관찰 ${arr(w.lengths).length} / 3</span></div></div><div class="ruler-adjustment"><div class="ruler-slider"><label for="ruler-length">떨리는 길이 <output id="ruler-value">${w.length||18} cm</output></label><input id="ruler-length" type="range" min="6" max="18" step="6" value="${w.length||18}" aria-valuetext="${w.length||18} 센티미터"><div class="range-ticks"><span>짧게 · 6 cm</span><span>12 cm</span><span>길게 · 18 cm</span></div></div><div class="live-scope" id="ruler-scope">${liveWave(.65,w.length===6?9:w.length===12?6:3)}</div>${arr(w.lengths).length>=2?choiceGroup(index,w):''}</div>`;
  if(i===5)return `<div class="target-row">
   ${button(`${icon('play')} 목표 신호 듣기`,'target','','btn secondary')}
   ${pitchScore(legacyPitchTarget,w.targetHeard)}
  </div><div class="pattern-slots" aria-label="내 신호">
   ${[0,1,2].map((_,k)=>`<span class="${w.pattern?.[k]?'filled':''}">${w.pattern?.[k]?`${w.pattern[k]} cm`:k+1}</span>`).join('<i aria-hidden="true">→</i>')}
  </div><div class="length-options" role="group" aria-label="신호를 연주할 자">
   ${lengths.map(l=>button(`${rulerKey(l.value)}<b>${l.value} cm</b>`,'note',`data-length="${l.value}" aria-label="${l.value} 센티미터 자" ${w.targetHeard?'':'disabled'}`,'length-card key')).join('')}
  </div><div class="inline-actions">${button('다시 연주하기','pattern-reset',w.targetHeard?'':'disabled','btn quiet')}</div>`;
  if(i===6)return `<div class="medium-grid">${media.map(m=>{
   const observed=arr(w.media).includes(m.id);
   return `<section class="medium-card illustrated-medium ${observed?'observed':''}">
    ${art(`travel-${m.id}`,`${m.source}에서 ${m.receiver}까지 소리가 전해지는 실험`,'concept-scene')}
    <div class="transmission-path"><span>${m.source}</span>${icon('arrow')}<span>${m.receiver}</span></div>
    ${button(`${icon(observed?'check':'play')} ${m.label} 듣기`,'medium',`data-medium="${m.id}"`,'btn secondary')}
   </section>`;
  }).join('')}</div>${media.every(m=>arr(w.media).includes(m.id))?choiceGroup(index,w):''}`;
  if(i===7){
   const k=w.currentCase||0,t=transferCases[k];
   return `<div class="case-tabs" role="group" aria-label="살펴볼 상황">
    ${transferCases.map((_,n)=>button(`${['문 밖','물속','탁자'][n]} ${w.verified?.[n]?icon('check'):''}`,'case',`data-case="${n}" aria-pressed="${k===n}"`,`btn ${k===n?'secondary':'quiet'}`)).join('')}
   </div><div class="scene-question case-story"><figure class="scene-figure">
    ${art(['case-door','case-underwater','case-table'][k],t.title,'scene-art')}
   </figure><div class="scene-copy"><p>${t.text}</p></div></div>
   <div class="medium-choices" role="group" aria-label="소리가 지나온 물질">
    ${media.map(m=>button(`${icon(m.id)} ${m.label}`,'case-choice',`data-medium="${m.id}" aria-pressed="${w.caseChoice===m.id}"`,`choice ${w.caseChoice===m.id?'selected':''}`)).join('')}
   </div>`;
  }
  if(i===8)return `<div class="noise-story illustrated-noise">
   ${art('library-noise','도서관에서 책 읽는 친구와 열린 문 밖 복도의 북 연습','concept-story')}
   <div><h3>“같은 줄을 자꾸 다시 읽게 돼.”${voiceButton('reader-complaint','책 읽는 친구 목소리 듣기')}</h3>
   ${button(`${icon(w.heard?'check':'play')} 현장 소리 듣기`,'noise-scene','','btn secondary')}</div>
  </div>${w.heard?diagnosisFields.map(field=>diagnostic(field.key,field.label,field.options,w)).join(''):''}`;
  if(i===9){
   if(!state.evidence[legacyIndex(8)])return missing(8,'어떤 친구가 불편한지 먼저 살펴봐.');
   const tools=arr(w.solutions),heardAfter=w.after&&w.afterKey===tools.slice().sort().join(',');
   return `<div class="solution-grid" role="group" aria-label="해결 도구">
    ${solutions.map(s=>button(`${art(s.id==='pad'?'drum-pad':`care-${s.id}`,'','concept-thumb')}<b>${s.label}</b>`,'solution',
     `data-solution="${s.id}" aria-pressed="${tools.includes(s.id)}"`,`solution concept-tool ${tools.includes(s.id)?'selected':''}`)).join('')}
   </div><div class="sample-pair compact">
    <section>${w.before?wave(.9,7):''}${button(`${icon(w.before?'check':'play')} 적용 전 듣기`,'noise-before','','btn secondary')}</section>
    <section>${heardAfter?wave(tools.includes('time')?0:noiseLevel(w),7,tools.includes('time')):''}
     ${button(`${icon(heardAfter?'check':'play')} 적용 후 듣기`,'noise-after',tools.length?'':'disabled','btn secondary')}
    </section>
   </div>${w.before&&heardAfter?choiceGroup(index,w):''}`;
  }
  return '';
}
function diagnosticChoices(button,key,label,options,w){return `<section class="diagnostic" role="group" aria-labelledby="diagnostic-${key}"><h3 id="diagnostic-${key}">${label}</h3><div>${options.map(([value,text])=>button(text,'diagnostic',`data-field="${key}" data-value="${value}" aria-pressed="${w[key]===value}"`,`choice ${w[key]===value?'selected':''}`)).join('')}</div></section>`;}
function missingRecord(button,icon,base,message){const i=legacyIndex(base);return `<div class="missing-record">${icon('book')}<h3>${message}</h3><p>네가 만든 기록을 가져와야 비교할 수 있어.</p>${button('관찰 활동에서 기록 만들기','goto',`data-route="lesson/${i}"`,'btn primary')}</div>`;}
export function noiseLevel(w){return .85*(arr(w.solutions).includes('pad')?.65:1)*(arr(w.solutions).includes('volume')?.4:1);}
