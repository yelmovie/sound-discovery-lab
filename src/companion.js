import { lessons, instruments, media, legacyIndex } from './data.js';
import { checkLesson } from './model.js';
import { adjustmentCue } from './challenge-rules.js';

export const rhythmControls='[data-action="challenge-ring"], [data-action="challenge-rest"]';

const hints = [
 ['물체를 두 가지 이상 울려 보고 공통점을 골라 봐.','물체를 다시 울려서 소리가 날 때 움직이는 곳을 봐.','두 물체를 번갈아 눌러 봐. 소리가 날 때와 멈췄을 때 뭐가 다를까?'],
 ['소리굽쇠를 울리고 소리가 나는 동안 눌러 봐.','멈추기 전과 뒤에 소리와 그림이 어떻게 달라지는지 봐.','다시 울려서 멈추는 순간을 봐. 두 모습에 맞는 설명을 골라 봐.'],
 ['북을 쳐서 첫 번째 소리를 담아 봐.','치는 세기 손잡이만 바꿔서 북을 다시 쳐 봐.','A와 B에 표시된 세기를 봐. 같다면 한쪽 세기만 바꿔 다시 쳐 봐.'],
 ['A와 B를 각각 듣고 소리의 크기를 비교해 봐.','A와 B의 친 세기와 소리 그림도 나란히 봐.','A 듣기와 B 듣기를 번갈아 눌러 봐. 들은 차이를 아래 보기와 비교해.'],
 ['물체를 울린 뒤 떨리는 부분을 골라 봐.','다시 울리기를 눌러 물체의 여러 부분을 비교해 봐.','소리가 나는 동안 그림을 봐. 그대로인 부분과 움직이는 부분을 비교해.'],
 ['목표 신호를 보고 두 조작으로 신호를 만들어 봐.','목표 신호와 내 신호를 왼쪽부터 맞춰 읽어 봐.','내 신호 다음 빈칸과 같은 자리의 목표 표시를 봐. 그 표시에 맞는 조작을 골라 봐.'],
 ['주민이 요청한 소리의 크기를 읽어 봐.','치는 세기 손잡이를 움직이고 북을 쳐서 들어 봐.','요청 카드와 손잡이 옆 표시를 비교해. 북을 쳐서 방금 고른 세기를 확인해 봐.'],
 ['세 상자를 듣고 놓을 칸을 골라 봐.','헷갈리는 두 상자를 번갈아 눌러 들어 봐.','상자 A·B·C를 다시 들어 봐. 두 소리를 비교한 다음 상자와 놓을 칸을 눌러 봐.'],
 ['떨리는 길이 손잡이를 움직여 두 소리를 들어 봐.','같은 자에서 길이만 바꿔 들었을 때 무엇이 달라지는지 봐.','짧은 쪽과 긴 쪽을 한 번씩 들어 봐. 길이 표시와 높낮이를 짝지어 비교해.'],
 ['목표 신호를 듣고 자를 눌러 따라 연주해 봐.','목표와 내가 누른 자의 소리를 같은 자리끼리 비교해 봐.','목표 신호 듣기를 다시 눌러 봐. 헷갈린 자리의 소리를 자 버튼의 소리와 비교해.'],
 ['목표 듣기를 누르고 자 버튼으로 연주해 봐.','목표 멜로디와 내 연주에서 같은 자리의 음을 비교해 봐.','목표 다시 듣기를 눌러 봐. 헷갈린 음을 들은 뒤 자 버튼을 골라 다시 연주해.'],
 ['요청 카드의 높낮이와 크기를 읽어 봐.','한 손잡이씩 움직여 어느 소리가 달라지는지 들어 봐.','연주하기를 눌러 요청과 비교해. 길이와 세기 중 비교할 손잡이를 골라 봐.'],
 ['세 전달 실험의 듣기 버튼을 한 번씩 눌러 봐.','소리를 내는 곳과 감지기 사이를 그림에서 찾아봐.','세 실험의 듣기를 다시 눌러. 감지기에서 확인한 결과와 아래 설명을 비교해.'],
 ['상황 그림을 읽고 소리가 지난 물질을 골라 봐.','소리가 난 곳과 듣는 곳을 먼저 찾아봐.','상황 탭을 다시 봐. 두 곳 사이가 무엇으로 이어지는지 아래 보기와 비교해.'],
 ['실험 제목을 읽고 감지기를 놓을 곳을 눌러 봐.','소리가 난 곳부터 감지기까지 그림에서 가리켜 봐.','제목의 실험 조건과 세 장소 그림을 비교해. 시험할 곳을 눌러 결과를 들어 봐.'],
 ['이야기를 읽고 소리가 지난 물질을 골라 봐.','말하는 곳과 듣는 곳 사이를 이어주는 것을 찾아봐.','이야기 속 두 지점을 눈으로 이어 봐. 그 사이에 있는 것과 아래 보기를 비교해.'],
 ['현장 소리 듣기를 누르고 현장 제보를 읽어 봐.','그림에서 소리가 난 곳과 소리를 들은 사람을 찾아봐.','현장 소리 듣기를 다시 눌러 봐. 그림과 제보에서 장소·시간·사람의 단서를 비교해.'],
 ['적용 전과 적용 후의 소리를 비교해 봐.','지금 선택한 방법이 어느 소리를 바꾸는지 들어 봐.','적용 전 듣기와 적용 후 듣기를 번갈아 눌러 봐. 달라진 점과 그대로인 점을 찾아봐.'],
 ['현장 이야기를 읽고 적용 전 소리를 들어 봐.','해결 방법 하나를 시험하고 적용 전과 후를 비교해 봐.','적용 전과 적용 후를 번갈아 들어 봐. 현장의 불편이 줄었는지 보고 다른 방법도 시험해.'],
 ['주민 요청을 읽고 전체 듣기를 눌러 봐.','두 손잡이와 의자 도구를 한 번에 하나씩 바꿔 봐.','전체 듣기를 다시 눌러 봐. 소리마다 주민 요청과 맞는지 비교하고, 어긋난 곳을 다시 조절해.']
];
// Hints follow lesson IDs, which interleave each facility's two original and two resident activities.
const hintOrder=[0,1,4,5,2,3,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
export function coachFor(state,index,level=0,saved){
 const w=state.work[index]||{},l=lessons[index],ready=checkLesson(state,index).ok;
 let text=hints[hintOrder[index]][Math.min(2,Math.max(0,level))],target='';
 if(ready)return {text:(saved??Boolean(state.evidence[index]))?'증거가 노트에 담겼어! 다음 활동으로 가자.':'발견을 다 모았어! 증거를 확인하고 다음으로 가자.',target:(saved??Boolean(state.evidence[index]))?'[data-action="continue"]':'[data-action="submit"]',ready};
 if(l.base===0){const next=instruments.find(t=>!(w.seen||[]).includes(t.id));target=(w.seen||[]).length<2&&next?`[data-tool="${next.id}"]`:level===2?'[data-action="instrument"]':'.answer-group .choice';}
 if(l.base===1)target=!w.started||!w.stopped?'[data-action="fork-start"]':'.answer-group .choice';
 if(l.base===2){
  target=!w.a||(w.force||1)!==w.a?'[data-action="hit"]':'#force';
  if(level===0)text=!w.a?'북을 눌러 첫 소리를 담아 봐.':target==='#force'?'치는 세기 손잡이를 움직여 다른 세기로 바꿔 봐.':'이제 북을 눌러 두 번째 소리를 담아 봐.';
 }
 if(l.base===3)target=!w.heardA?'[data-action="sample-play"][data-slot="a"]':!w.heardB?'[data-action="sample-play"][data-slot="b"]':level===2?'[data-action="sample-play"]':'.answer-group .choice';
 if(l.base===3&&!state.evidence[legacyIndex(2)]?.observation)return {text:'관찰 활동에서 기록 만들기를 눌러. 북 치는 세기를 바꿔 비교할 두 소리를 담아 봐.',target:`[data-action="goto"][data-route="lesson/${legacyIndex(2)}"]`,ready};
 if(l.base===4)target=(w.lengths||[]).length<2||level===2?'#ruler-length':'.answer-group .choice';
 if(l.base===5)target=!w.targetHeard||level===2?'[data-action="target"]':'[data-action="note"]';
 if(l.base===6){const next=media.find(m=>!(w.media||[]).includes(m.id));target=next?`[data-action="medium"][data-medium="${next.id}"]`:level===2?'[data-action="medium"]':'.answer-group .choice';}
 if(l.base===8)target=!w.heard?'[data-action="noise-scene"]':'.diagnostic .choice';
 if(l.base===7)target='[data-action="case-choice"]';
 if(l.base===9)target=!w.before?'[data-action="noise-before"]':!(w.solutions||[]).length?'[data-action="solution"]':!w.after?'[data-action="noise-after"]':level===2?'[data-action="noise-before"], [data-action="noise-after"]':'.answer-group .choice';
 if(l.base===9&&!state.evidence[legacyIndex(8)])return {text:'관찰 활동에서 기록 만들기를 눌러. 현장 소리를 듣고 상황을 살펴봐.',target:`[data-action="goto"][data-route="lesson/${legacyIndex(8)}"]`,ready};
 if(l.challenge){
  const c=w.challenge||{};
  if(l.challenge==='rhythm'&&!c.sounding&&c.sequence?.at(-1)==='울림')return {text:'소리가 멈췄어. 처음부터를 눌러 신호를 다시 연주해 봐.',target:'[data-action="challenge-clear"]',ready};
  const next={
   parts:c.heard&&level<2?'[data-action="challenge-select"]':'[data-action="challenge-listen"]',
   rhythm:rhythmControls,
   signal:'[data-action="challenge-strike"]',
   sort:Number.isInteger(c.selected)?'[data-action="challenge-slot"]':'[data-action="challenge-parcel"]',
   melody:c.heard&&level<2?'[data-action="challenge-note"]':'[data-action="challenge-listen"]',
   mix:'[data-action="challenge-check"]',
   sensor:'[data-action="challenge-zone"]',
   classify:'[data-action="challenge-zone"]',
   solutions:!c.before?'[data-action="challenge-before"]':!c.solution?'[data-action="challenge-solution"]':'[data-action="challenge-after"]',
   festival:'[data-action="challenge-preview"]'
  };
  target=next[l.challenge]||'';
  const adjustment=adjustmentCue(l.challenge,c);
  if(adjustment){
   target=adjustment.target;
   if(level===0||l.challenge==='sort'&&(c.listened||[]).length<3)text=adjustment.text;
   if(l.challenge==='mix'&&level===2)target='[data-action="challenge-check"]';
  }
  if(l.challenge==='parts'&&!c.heard)text='물체의 울려 보기를 눌러. 소리가 날 때 어느 부분이 움직이는지 살펴봐.';
  if(l.challenge==='melody'&&!c.heard)text='목표 듣기를 눌러. 음마다 높이가 어떻게 바뀌는지 들어 봐.';
  if(l.challenge==='solutions')text=!c.before?'적용 전을 눌러 현장의 소리를 들어 봐.':!c.solution?'현장 이야기를 읽고 시험해 볼 도구를 눌러 봐.':!c.after?'적용 후를 눌러 처음 들은 소리와 비교해 봐.':text;
 }
 if(l.base===0&&(w.seen||[]).length<2&&level>0)text='아직 안 울려 본 물체를 눌러. 먼저 본 물체와 움직임을 비교해 봐.';
 if(level===0&&l.base===0&&(w.seen||[]).length>=2)text='관찰한 물체의 공통점을 아래에서 골라 봐.';
 if(l.base===5&&!w.targetHeard)text='목표 신호 듣기를 눌러. 음마다 높이가 어떻게 바뀌는지 들어 봐.';
 if(l.base===9&&!(w.solutions||[]).length)text=w.before?'해결 방법 하나를 고르고 적용 후 듣기를 눌러 봐.':'적용 전 듣기를 눌러 지금 들리는 소리를 기억해 봐.';
 return {text,target,ready};
}
