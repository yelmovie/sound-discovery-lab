// Character voice lines (local files made with Momo, see docs/VOICE-PROVENANCE-20261110.json).
// One line chain plays at a time; a new chain, a screen change, a closed popup or a hidden tab stops it.
// Text stays on screen, so a blocked or failed play never stops the activity.
const dir='/media/audio/voices/';
export const voiceLines=Object.fromEntries([
 ['title-bubble','같이 도시를 깨우자!'],
 ['welcome','소리 탐험을 시작해 볼까? 소리가 날 때 물체가 어떻게 떨리는지 관찰하고, 소리의 크기와 높낮이를 직접 비교해 보자.'],
 ['story-1','소리 코어가 멈췄어!'],
 ['story-2','물체를 울리고, 조건을 바꾸며 소리의 비밀을 찾아 줘. 네가 모은 증거 20개로 다섯 시설을 복구하면 주민들의 축제가 다시 열려!'],
 ['story-3','시설마다 관찰 → 비교 → 응용 → 주민 의뢰를 해결해. 배지와 탐구 기록이 남아.'],
 ['guide-1','나는 울림새 삐오야!'],
 ['guide-2','방향키나 화면 화살표로 길 위를 자유롭게 걸어 봐. 길을 누르면 그곳까지 걸어가고, 시설 이름을 누르면 시설로 가. 내가 뒤를 따라갈게.'],
 ['guide-3','‘손으로 둘러보기’를 켜고 지도를 끌거나 ‘지도 한눈에 보기’로 마을 전체를 볼 수 있어. 다시 걸으면 탐험가에게 돌아와.'],
 ['guide-4','각 시설의 네 활동을 마치면 16초 개념 영상과 복구 배지가 기다려!'],
 ['mission-1','멈춘 연구소에 소리를 되찾아 줘.'],
 ['mission-2','멀리 있는 친구에게 신호를 보내 줘.'],
 ['mission-3','공방의 뒤섞인 멜로디를 고쳐 줘.'],
 ['mission-4','끊어진 도시의 통신을 되살려 줘.'],
 ['mission-5','모두가 편안한 도서관을 만들어 줘.'],
 ['mission-core','다섯 시설을 복구했어! 소리 코어로 가자.'],
 ['restored-1','연구소의 실험 장치가 다시 움직여!'],
 ['restored-2','친구들에게 경기 시작 신호가 들려!'],
 ['restored-3','공방에서 다시 멜로디가 흘러나와!'],
 ['restored-4','물속과 땅 위의 친구들이 연결됐어!'],
 ['restored-5','책 읽는 친구들이 편안해졌어!'],
 ['reader-complaint','“같은 줄을 자꾸 다시 읽게 돼.”'],
 ['lesson-done','활동을 마쳤어! 다음 활동으로 가자.'],
 ['stage-done','네 활동을 모두 마쳤어! 시설 복구를 눌러 봐.'],
 ['quest-done','주민의 의뢰를 모두 해결했어!'],
 ['retry','관찰한 떨림과 소리를 다시 떠올려 봐. 선택을 바꾸고 다시 확인할 수 있어.'],
 ['final-title','우리의 증거로 축제를 열자!'],
 ['final-core','다섯 발견이 모이면 축제가 시작돼!'],
 ['ending-1','울림도시가 다시 깨어났어!'],
 ['ending-2','소리의 떨림, 크기, 높낮이, 전달을 탐구하고 함께 사는 친구들을 배려하는 방법을 발견했어.']
].map(([id,text])=>[id,{text,src:`${dir}${id}.mp3`}]));
export const voiceAssets=Object.values(voiceLines).map(line=>line.src.slice(1));
const byText=new Map(Object.entries(voiceLines).map(([id,line])=>[line.text,id]));
/** The voice line whose words match this on-screen text exactly, if there is one. */
export function voiceFor(text){return byText.get(String(text||'').trim())||null;}
/** Reads the visible request-completion heading before its next-step cue. */
export function voiceCue(id,requestComplete=false){return requestComplete&&['lesson-done','stage-done'].includes(id)?['quest-done',id]:[id];}

export function createVoice({enabled,quiet=()=>{}}){
 let audio=null,chain=[],ticket=0,timer=null,current=null;
 function release(){if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();audio=null;}}
 function stop(){ticket++;clearTimeout(timer);timer=null;chain=[];current=null;release();quiet(false);}
 function next(id){
  const line=voiceLines[id];if(!line)return finish();
  current=id;release();const mine=ticket,clip=new Audio(line.src);audio=clip;clip.preload='auto';
  clip.onended=()=>{if(mine===ticket)finish();};
  clip.onerror=()=>{if(mine===ticket)finish();};
  clip.play().catch(()=>{if(mine===ticket)stop();});
 }
 function finish(){const id=chain.shift();if(id)next(id);else{current=null;release();quiet(false);}}
 /** Plays ids in order after an optional delay; anything playing stops first. */
 function say(ids,delay=0){
  stop();const list=(Array.isArray(ids)?ids:[ids]).filter(id=>voiceLines[id]);
  if(!list.length||!enabled()||typeof document!=='undefined'&&document.hidden)return;
  const mine=ticket;
  timer=setTimeout(()=>{if(mine!==ticket||!enabled())return;quiet(true);chain=list.slice(1);next(list[0]);},delay);
 }
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 if(typeof window!=='undefined')window.addEventListener('pagehide',stop);
 return {say,stop,get playing(){return current;}};
}
