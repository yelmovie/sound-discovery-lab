import {media} from './data.js';

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

export {parts,rhythms,signals,sortOrders,melodies,mixes,situations,cases,solutionTools,roundOf,expectedProof};
