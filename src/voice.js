// Character voice lines. Every line is ElevenLabs eleven_v4 (see docs/VOICE-FILL-20261118.json and NPC-DIALOGUE-20261112.json):
// one voice per character — Pio = Aria, reader = sena, villain speaker = Harry.
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
 ['guide-4','각 시설의 활동 네 개를 마치면 16초 개념 영상과 복구 배지가 기다려!'],
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
 ['ending-2','소리의 떨림, 크기, 높낮이, 전달을 탐구하고 함께 사는 친구들을 배려하는 방법을 발견했어.'],
 // 2026-11-18 ElevenLabs fill (docs/VOICE-FILL-20261118.json): concept-film cues, learning bridges, coach hints, map villain.
 ["concept-vibration-1","물체를 울리면 떨림이 시작돼."],
 ["concept-vibration-3","손으로 잡으면 떨림이 멈춰."],
 ["concept-vibration-4","떨림이 멈추면 소리도 멈춰."],
 ["concept-volume-1","같은 북을 약하게 쳐 봐."],
 ["concept-volume-2","세게 치면 더 크게 떨려."],
 ["concept-volume-3","높낮이는 같고, 소리 크기가 달라."],
 ["concept-volume-4","치는 세기로 소리 크기를 조절해."],
 ["concept-pitch-1","같은 자를 같은 힘으로 튕겨 봐."],
 ["concept-pitch-2","긴 부분은 천천히 떨려 낮은 소리."],
 ["concept-pitch-3","짧은 부분은 빠르게 떨려 높은 소리."],
 ["concept-pitch-4","길이로 높낮이, 힘으로 크기를 바꿔."],
 ["concept-travel-1","북과 귀 사이의 공기를 따라."],
 ["concept-travel-2","물속 종과 감지기 사이의 물을 따라."],
 ["concept-travel-3","탁자와 감지기 사이의 고체를 따라."],
 ["concept-travel-4","세 물질 모두 소리를 전달할 수 있어."],
 ["concept-care-1","누가, 언제, 어디에서 불편할까?"],
 ["concept-care-2","음량을 줄이고 의자에 패드를 붙여."],
 ["concept-care-3","연습 시간과 장소도 바꿀 수 있어."],
 ["concept-care-4","필요한 안내는 들리게, 서로 배려해."],
 ["bridge-1","떨림이 소리를 만들었어. 이번에는 같은 북의 소리 크기를 바꿔 볼까?"],
 ["bridge-2","소리 크기를 바꿨어. 이번에는 높은 소리와 낮은 소리를 만들어 볼까?"],
 ["bridge-3","크기와 높낮이를 조절했어. 이 소리는 무엇을 통해 친구에게 전해질까?"],
 ["bridge-4","소리가 전해지는 길을 찾았어. 친구가 불편한 소리는 어떻게 줄일까?"],
 ["bridge-5","다섯 가지 발견으로 필요한 소리는 살리고 모두가 즐거운 축제를 열어 보자!"],
 ["hint-1-1","물체를 두 가지 이상 울려 보고 공통점을 골라 봐."],
 ["hint-1-2","물체를 다시 울려서 소리가 날 때 움직이는 곳을 봐."],
 ["hint-1-3","두 물체를 번갈아 눌러 봐. 소리가 날 때와 멈췄을 때 뭐가 다를까?"],
 ["hint-2-1","소리굽쇠를 울리고 소리가 나는 동안 눌러 봐."],
 ["hint-2-2","멈추기 전과 뒤에 소리와 그림이 어떻게 달라지는지 봐."],
 ["hint-2-3","다시 울려서 멈추는 순간을 봐. 두 모습에 맞는 설명을 골라 봐."],
 ["hint-3-1","북을 쳐서 첫 번째 소리를 담아 봐."],
 ["hint-3-2","치는 세기 손잡이만 바꿔서 북을 다시 쳐 봐."],
 ["hint-3-3","A와 B에 표시된 세기를 봐. 같다면 한쪽 세기만 바꿔 다시 쳐 봐."],
 ["hint-4-1","A와 B를 각각 듣고 소리의 크기를 비교해 봐."],
 ["hint-4-2","A와 B의 친 세기와 소리 그림도 나란히 봐."],
 ["hint-4-3","A 듣기와 B 듣기를 번갈아 눌러 봐. 들은 차이를 아래 보기와 비교해."],
 ["hint-5-1","악기 그림을 눌러 울린 뒤 떨리는 곳의 번호를 눌러 봐."],
 ["hint-5-2","다시 그림을 눌러 울리고 번호가 붙은 세 곳을 비교해 봐."],
 ["hint-5-3","소리가 나는 동안 그림을 봐. 그대로인 부분과 움직이는 부분을 비교해."],
 ["hint-6-1","목표 신호를 보고 두 조작으로 신호를 만들어 봐."],
 ["hint-6-2","목표 신호와 내 신호를 왼쪽부터 맞춰 읽어 봐."],
 ["hint-6-3","내 신호 다음 빈칸과 같은 자리의 목표 표시를 봐. 그 표시에 맞는 조작을 골라 봐."],
 ["hint-7-1","주민이 요청한 소리의 크기를 읽어 봐."],
 ["hint-7-2","북을 아래로 쓸어 쳐 봐. 쓸어내린 길이와 들린 크기를 함께 살펴봐."],
 ["hint-7-3","요청 카드와 세기 표시를 비교해. 짧게·중간·길게 쓸어 소리 크기를 들어 봐."],
 ["hint-8-1","세 상자를 듣고 놓을 칸을 골라 봐."],
 ["hint-8-2","헷갈리는 두 상자를 번갈아 눌러 들어 봐."],
 ["hint-8-3","상자 A·B·C를 다시 들어 봐. 두 소리를 비교한 다음 상자와 놓을 칸을 눌러 봐."],
 ["hint-9-1","떨리는 길이 손잡이를 움직여 두 소리를 들어 봐."],
 ["hint-9-2","같은 자에서 길이만 바꿔 들었을 때 무엇이 달라지는지 봐."],
 ["hint-9-3","짧은 쪽과 긴 쪽을 한 번씩 들어 봐. 길이 표시와 높낮이를 짝지어 비교해."],
 ["hint-10-1","목표 신호를 듣고 자를 눌러 따라 연주해 봐."],
 ["hint-10-2","목표와 내가 누른 자의 소리를 같은 자리끼리 비교해 봐."],
 ["hint-10-3","목표 신호 듣기를 다시 눌러 봐. 헷갈린 자리의 소리를 자 버튼의 소리와 비교해."],
 ["hint-11-1","목표 듣기를 누르고 자를 칸에 끌어다 놓아 멜로디를 만들어 봐."],
 ["hint-11-2","목표의 높고 낮은 선과 내 칸의 자를 같은 자리끼리 비교해 봐."],
 ["hint-11-3","목표 다시 듣기를 눌러 봐. 헷갈린 칸을 눌러 비우고, 자 카드의 소리와 하나씩 비교해 봐."],
 ["hint-12-1","요청 카드의 높낮이와 크기를 읽어 봐."],
 ["hint-12-2","한 손잡이씩 움직여 어느 소리가 달라지는지 들어 봐."],
 ["hint-12-3","연주하기를 눌러 요청과 비교해. 길이와 세기 중 비교할 손잡이를 골라 봐."],
 ["hint-13-1","세 전달 실험의 듣기 버튼을 한 번씩 눌러 봐."],
 ["hint-13-2","소리를 내는 곳과 감지기 사이를 그림에서 찾아봐."],
 ["hint-13-3","세 실험의 듣기를 다시 눌러. 감지기에서 확인한 결과와 아래 설명을 비교해."],
 ["hint-14-1","상황 그림을 읽고 소리가 지난 물질을 골라 봐."],
 ["hint-14-2","소리가 난 곳과 듣는 곳을 먼저 찾아봐."],
 ["hint-14-3","상황 탭을 다시 봐. 두 곳 사이가 무엇으로 이어지는지 아래 보기와 비교해."],
 ["hint-15-1","그림을 보고 감지기를 소리가 지나온 물질에 놓아 봐."],
 ["hint-15-2","소리가 난 곳부터 듣는 곳까지 그림에서 손가락으로 따라가 봐."],
 ["hint-15-3","두 곳 사이에 공기·물·고체 중 무엇이 있는지 그림에서 찾아 감지기를 놓아 봐."],
 ["hint-16-1","이야기를 읽고 소리가 지난 물질을 골라 봐."],
 ["hint-16-2","말하는 곳과 듣는 곳 사이를 이어주는 것을 찾아봐."],
 ["hint-16-3","이야기 속 두 지점을 눈으로 이어 봐. 그 사이에 있는 것과 아래 보기를 비교해."],
 ["hint-17-1","현장 소리 듣기를 누르고 현장 제보를 읽어 봐."],
 ["hint-17-2","그림에서 소리가 난 곳과 소리를 들은 사람을 찾아봐."],
 ["hint-17-3","현장 소리 듣기를 다시 눌러 봐. 그림과 제보에서 장소·시간·사람의 단서를 비교해."],
 ["hint-18-1","적용 전과 적용 후의 소리를 비교해 봐."],
 ["hint-18-2","지금 선택한 방법이 어느 소리를 바꾸는지 들어 봐."],
 ["hint-18-3","적용 전 듣기와 적용 후 듣기를 번갈아 눌러 봐. 달라진 점과 그대로인 점을 찾아봐."],
 ["hint-19-1","현장 그림을 보고 알맞은 도구를 눌러 봐."],
 ["hint-19-2","누가, 어디에서, 언제 불편한지 그림에서 찾아봐."],
 ["hint-19-3","도구를 누르면 적용 전과 후 소리가 이어서 나와. 소리가 줄지 않았다면 다른 도구를 골라 봐."],
 ["hint-20-1","주민 요청을 읽고 전체 듣기를 눌러 봐."],
 ["hint-20-2","두 손잡이와 의자 도구를 한 번에 하나씩 바꿔 봐."],
 ["hint-20-3","전체 듣기를 다시 눌러 봐. 소리마다 주민 요청과 맞는지 비교하고, 어긋난 곳을 다시 조절해."],
 ["villain-1-1","떨림을 멈추면 소리도 멈추는 걸 알아냈어? 내 우퍼가 조용해지잖아!"],
 ["villain-1-2","둥둥! 그래도 내 배는 아직 떨린다!"],
 ["villain-1-4","쉿! 떨림을 잡으니 조용해지잖아!"],
 ["villain-1-5","쳇, 우퍼 전원은 꺼 줄게!"],
 ["villain-2-1","같은 북으로 큰 소리와 작은 소리를 만들었어? 내 볼륨 눈금은 숨겼는데!"],
 ["villain-2-2","쿵! 내 발소리는 무조건 최고 볼륨이다!"],
 ["villain-2-3","앗, 볼륨 손잡이가 돌아가!"],
 ["villain-2-4","내 큰 소리가 속삭임이 됐잖아!"],
 ["villain-2-5","흥, 경기장 볼륨은 적당히 맞출게!"],
 ["villain-3-1","긴 자랑 짧은 자로 멜로디를 맞췄어? 솔미라를 뒤집어 놨는데!"],
 ["villain-3-2","내 테마곡은 제일 낮게 시작해서 끝까지 삑!"],
 ["villain-3-3","삑! 내 음판이 한 칸 움직였어!"],
 ["villain-3-4","높고 낮은 소리가 다시 맞았잖아!"],
 ["villain-3-5","쳇, 음판은 네가 정해. 나는 삑 하고 퇴장!"],
 ["villain-4-1","공기랑 물, 탁자에서도 소리를 찾아냈어? 나는 선만 뽑으면 끝인 줄!"],
 ["villain-4-2","이젠 내 비밀 계획도 탁자에 들리겠군!"],
 ["villain-4-3","앗, 끊어 둔 신호가 연결됐어!"],
 ["villain-4-4","물속 감지기까지 깜빡이잖아!"],
 ["villain-4-5","흥, 전달 네트워크는 돌려줄게!"],
 ["villain-5-1","독서 시간에 북소리를 줄였어? 내 소음 공연은 어디서 하라고!"],
 ["villain-5-2","좋아, 앙코르는 아무도 없는 연습실이다!"],
 ["villain-5-5","쉿! 여긴 도서관이니까 조용히 퇴장할게!"]
].map(([id,text])=>[id,{text,src:`${dir}el-${id}.mp3`}]));
export const voiceAssets=Object.values(voiceLines).map(line=>line.src.slice(1));
const byText=new Map(Object.entries(voiceLines).map(([id,line])=>[line.text,id]));
/** The voice line whose words match this on-screen text exactly, if there is one. */
export function voiceFor(text){return byText.get(String(text||'').trim())||null;}
/** Reads the visible request-completion heading before its next-step cue. */
export function voiceCue(id,requestComplete=false){return requestComplete&&['lesson-done','stage-done'].includes(id)?['quest-done',id]:[id];}

export function createVoice({enabled,quiet=()=>{},onSpeaking=()=>{}}){
 let audio=null,chain=[],ticket=0,timer=null,current=null;
 function release(){onSpeaking(null);if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();audio=null;}}
 function stop(){ticket++;clearTimeout(timer);timer=null;chain=[];current=null;release();quiet(false);}
 function next(id){
  const line=voiceLines[id];if(!line)return finish();
  current=id;release();const mine=ticket,clip=new Audio(line.src);audio=clip;clip.preload='auto';
  const active=()=>mine===ticket&&audio===clip;
  clip.addEventListener?.('playing',()=>{if(active())onSpeaking(id);});
  for(const event of ['waiting','pause'])clip.addEventListener?.(event,()=>{if(active())onSpeaking(null);});
  clip.onended=()=>{if(mine===ticket)finish();};
  clip.onerror=()=>{if(mine===ticket)finish();};
  clip.play().then(()=>{if(active())onSpeaking(id);}).catch(()=>{if(mine===ticket)stop();});
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
