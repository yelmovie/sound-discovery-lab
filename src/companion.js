import { lessons, instruments, media } from './data.js';
import { checkLesson } from './model.js';

const hints = [
 ['두 물체를 번갈아 울리고 떨리는 곳을 관찰해 봐.','소리가 날 때 움직이는 부분을 눈으로 찾아봐.','관찰한 두 물체의 공통점은 떨림이야.'],
 ['울린 다음 소리가 나는 동안 손으로 멈춰 봐.','소리와 떨림이 함께 멈추는지 비교해.','파형이 평평해지고 소리도 멈추는지 봐.'],
 ['북을 두드려 봐. 다른 세기로 치면 A와 B가 자동으로 담겨.','비교할 때 북과 높낮이는 그대로 두는 거야.','A와 B의 치는 세기를 다르게 기록해 봐.'],
 ['네가 만든 A와 B를 둘 다 다시 들어 봐.','파형이 위아래로 더 크게 움직인 쪽을 살펴봐.','더 세게 친 실험에서 소리가 더 크게 나.'],
 ['이번 물체를 울리고 그림에서 떨리는 부분을 찾아봐.','손이나 북채가 아니라 소리를 내는 물체를 살펴봐.','북의 막·고무줄·자의 끝·소리굽쇠 두 갈래가 떨려.'],
 ['울릴 때 소리, 누를 때 쉼! 신호를 차례대로 만들어.','목표의 다음 칸을 보고 울리거나 멈춰 봐.','신호가 다르면 바로 첫 박부터 다시 연주해 봐.'],
 ['주민의 요청에 맞게 세기를 정하고 북을 두드려 보내 봐.','북을 아래로 쓸어내린 거리로 치는 세기를 바꿔 봐.','높낮이는 그대로 두고 치는 세기만 바꿔 보내.'],
 ['세 상자를 모두 듣고, 작은 소리부터 끌어다 놔.','헷갈리는 상자 두 개를 번갈아 다시 들어 봐.','상자를 누른 뒤 빈칸을 눌러도 옮길 수 있어.'],
 ['길이를 바꾸면 자가 바로 울려. 두 길이의 소리를 비교해 봐.','긴 자와 짧은 자를 같은 힘으로 비교해.','짧은 쪽이 더 빠르게 떨려 높은 소리가 나.'],
 ['목표를 듣고 길이가 다른 자를 차례대로 눌러 봐.','긴 자는 낮음, 짧은 자는 높음이야.','긴 자 → 짧은 자 → 중간 자 순서로 연주해.'],
 ['목표 멜로디를 듣고 직접 건반처럼 연주해 봐.','목표의 다음 음과 내 연주의 빈칸을 비교해.','긴 자는 낮음, 중간 자는 중간, 짧은 자는 높음.'],
 ['길이와 세기를 하나씩 바꿔 주문한 소리를 만들어.','길이를 바꾸면 파형의 촘촘함이 달라져.','높낮이는 길이로, 크기는 튕기는 세기로 맞춰.'],
 ['세 실험을 하나씩 눌러 소리의 이동을 지켜봐.','소리를 내는 곳과 감지기 사이의 물질을 봐.','공기·물·고체에서 각각 전달되는지 확인해.'],
 ['두 물체 사이의 물질을 골라 봐. 맞으면 다음 상황이 이어져.','물속에서는 물, 탁자에 대면 탁자를 따라가.','문 밖 목소리는 공기, 물속 돌은 물, 탁자는 고체야.'],
 ['감지기를 잡아 이번 실험의 물질로 옮겨 봐.','소리를 내는 곳과 같은 물질에 감지기를 둬야 해.','감지기를 놓으면 소리가 전달되는지 바로 확인할 수 있어.'],
 ['주민과 전달 물질을 손가락으로 이어 봐.','말소리는 주로 공기, 팽팽한 실 전화는 고체야.','소리를 내는 곳과 듣는 곳 사이를 다시 살펴봐.'],
 ['현장 소리를 듣고 위치·시간·사람을 찾아봐.','어디에서 무엇을 하던 친구가 불편해졌을까?','도서관 옆 복도, 독서 시간, 책 읽는 친구를 살펴봐.'],
 ['해결책을 적용하고 전후 소리를 번갈아 들어 봐.','바닥 떨림·치는 세기·연습 시간을 바꿀 수 있어.','연습 시간을 옮기면 독서 중에는 조용해져.'],
 ['상황에 맞는 도구를 끌어 놓고 전후를 비교해.','의자에는 패드, 너무 큰 음악은 음량을 줄여.','시간이 겹치면 시간을, 장소를 옮길 수 있으면 장소를 바꿔.'],
 ['음악과 안내를 따로 조절하며 주민 표정을 봐.','모든 소리를 끄면 필요한 안내도 못 들어.','음악은 작게, 안내는 보통 이상, 의자에는 패드를 붙여.']
];
// Hints follow lesson IDs, which interleave each facility's two original and two resident activities.
const hintOrder=[0,1,4,5,2,3,6,7,8,9,10,11,12,13,14,15,16,17,18,19];
export function coachFor(state,index,level=0,saved){
 const w=state.work[index]||{},l=lessons[index],ready=checkLesson(state,index).ok;
 let text=hints[hintOrder[index]][Math.min(2,Math.max(0,level))],target='';
 if(ready)return {text:(saved??Boolean(state.evidence[index]))?'증거가 노트에 담겼어! 다음 활동으로 가자.':'발견을 다 모았어! 증거를 확인하고 다음으로 가자.',target:(saved??Boolean(state.evidence[index]))?'[data-action="continue"]':'[data-action="submit"]',ready};
 if(l.base===0){const next=instruments.find(t=>!(w.seen||[]).includes(t.id));target=(w.seen||[]).length<2&&next?`[data-tool="${next.id}"]`:'.answer-group .choice';}
 if(l.base===1)target=!w.started||!w.stopped?'[data-action="fork-start"]':'.answer-group .choice';
 if(l.base===2)target=!w.a?'[data-action="hit"]':'#force';
 if(l.base===3)target=!w.heardA?'[data-action="sample-play"][data-slot="a"]':!w.heardB?'[data-action="sample-play"][data-slot="b"]':'.answer-group .choice';
 if(l.base===4)target=(w.lengths||[]).length<2?'#ruler-length':'.answer-group .choice';
 if(l.base===5)target=!w.targetHeard?'[data-action="target"]':'[data-action="note"]';
 if(l.base===6){const next=media.find(m=>!(w.media||[]).includes(m.id));target=next?`[data-action="medium"][data-medium="${next.id}"]`:'.answer-group .choice';}
 if(l.base===8)target=!w.heard?'[data-action="noise-scene"]':'.diagnostic .choice';
 if(l.base===7)target='[data-action="case-choice"]';
 if(l.base===9)target=!w.before?'[data-action="noise-before"]':!(w.solutions||[]).length?'[data-action="solution"]':!w.after?'[data-action="noise-after"]':'.answer-group .choice';
 if(l.challenge){
  const c=w.challenge||{};
  if(l.challenge==='rhythm'&&!c.sounding&&c.sequence?.at(-1)==='울림')return {text:'소리가 멈췄어. 처음부터를 눌러 신호를 다시 연주해 봐.',target:'[data-action="challenge-clear"]',ready};
  const next={
   parts:c.heard?'[data-action="challenge-select"]':'[data-action="challenge-listen"]',
   rhythm:c.sounding?'[data-action="challenge-rest"]':'[data-action="challenge-ring"]',
   signal:'[data-action="challenge-strike"]',
   sort:Number.isInteger(c.selected)?'[data-action="challenge-slot"]':'[data-action="challenge-parcel"]',
   melody:c.heard?'[data-action="challenge-note"]':'[data-action="challenge-listen"]',
   mix:'[data-action="challenge-check"]',
   sensor:'[data-action="challenge-zone"]',
   classify:'[data-action="challenge-zone"]',
   solutions:!c.before?'[data-action="challenge-before"]':!c.solution?'[data-action="challenge-solution"]':'[data-action="challenge-after"]',
   festival:(c.music??3)>1?'[data-challenge-param="music"]':(c.announcement??1)<2?'[data-challenge-param="announcement"]':'[data-action="challenge-pads"]'
  };
  target=next[l.challenge]||'';
 }
 if(level===0&&l.base===0&&(w.seen||[]).length>=2)text='관찰한 물체의 공통점을 아래에서 골라 봐.';
 return {text,target,ready};
}
