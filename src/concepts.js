export function emphasize(text,terms){let rest=text,result='';const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));while(rest){const hit=terms.map(term=>({term,index:rest.indexOf(term)})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index||b.term.length-a.term.length)[0];if(!hit){result+=escape(rest);break;}result+=escape(rest.slice(0,hit.index))+`<mark class="concept-keyword">${escape(hit.term)}</mark>`;rest=rest.slice(hit.index+hit.term.length);}return result;}
export const conceptTerms=[['떨림','소리','멈춰'],['세게','소리 크기','높낮이'],['빠르게','높은 소리','낮은 소리'],['공기','물','고체'],['상황','불편한 소리','필요한 소리']];
// volume evens out the five films (integrated loudness -10.4 to -23.9 LUFS) to about -19 LUFS at playback;
// pitch is the quietest film and stays at full volume.
export const concepts = [
  {id:'vibration',volume:.37,title:'떨림이 소리를 만들어',summary:'물체가 떨리면 소리가 나고, 떨림이 멈추면 소리도 멈춰.',cues:['물체를 울리면 떨림이 시작돼.','떨리는 동안 소리가 나.','손으로 잡으면 떨림이 멈춰.','떨림이 멈추면 소리도 멈춰.']},
  {id:'volume',volume:.9,title:'큰 떨림, 큰 소리',summary:'같은 물체를 더 세게 치면 더 크게 떨리고 더 큰 소리가 나.',cues:['같은 북을 약하게 쳐 봐.','세게 치면 더 크게 떨려.','높낮이는 같고, 소리 크기가 달라.','치는 세기로 소리 크기를 조절해.']},
  {id:'pitch',volume:1,title:'짧은 자, 빠른 떨림',summary:'같은 자의 떨리는 부분이 짧을수록 더 빠르게 떨려 높은 소리가 나.',cues:['같은 자를 같은 힘으로 튕겨 봐.','긴 부분은 천천히 떨려 낮은 소리.','짧은 부분은 빠르게 떨려 높은 소리.','길이로 높낮이, 힘으로 크기를 바꿔.']},
  {id:'travel',volume:.6,title:'소리는 물질을 따라',summary:'소리는 공기·물·고체 같은 물질을 통해 전달돼.',cues:['북과 귀 사이의 공기를 따라.','물속 종과 감지기 사이의 물을 따라.','탁자와 감지기 사이의 고체를 따라.','세 물질 모두 소리를 전달할 수 있어.']},
  {id:'care',volume:.89,title:'필요한 소리는 살리고',summary:'듣는 사람과 상황을 살펴 불편한 소리를 줄이고 필요한 소리는 살려.',cues:['누가, 언제, 어디에서 불편할까?','음량을 줄이고 의자에 패드를 붙여.','연습 시간과 장소도 바꿀 수 있어.','필요한 안내는 들리게, 서로 배려해.']}
].map(c=>({...c,duration:16,src:`/media/concepts/${c.id}.mp4`,poster:`/media/concepts/${c.id}.jpg`,captions:`/media/concepts/${c.id}.vtt`}));

export const conceptAssets=concepts.flatMap(c=>[c.src,c.poster,c.captions].map(p=>p.slice(1)));

export function conceptView(stage){
  const c=concepts[stage];
  return `<div class="concept-player"><video id="concept-video" playsinline controls preload="metadata" poster="${c.poster}" aria-label="${c.title} · 16초 개념 영상"><source src="${c.src}" type="video/mp4"><track kind="captions" src="${c.captions}" srclang="ko" label="한국어"></video><div class="concept-focus"><small>기억할 낱말</small>${conceptTerms[stage].map(term=>`<strong>${term}</strong>`).join('')}</div><details class="concept-transcript" open><summary>네 장면으로 기억하기 · 16초</summary><div class="concept-cues" aria-label="영상 속 네 가지 발견">${c.cues.map((text,n)=>`<span data-cue="${n}" class="${n===0?'active':''}"><b>${n+1}</b><span>${emphasize(text,conceptTerms[stage])}</span></span>`).join('')}</div></details><p class="concept-recall-summary">${emphasize(c.summary,conceptTerms[stage])}</p><p class="concept-fallback" role="status" hidden>영상을 불러오지 못했어. 네 가지 발견을 글로 확인해 줘.</p></div>`;
}
