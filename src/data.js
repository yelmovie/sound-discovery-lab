import { conceptArtAssets } from './illustrations.js';
import { recordedAudioAssets } from './samples.js';
import { voiceAssets } from './voice.js';
export const backgrounds = [
  '017_53e4619e94','018_99f70fe2eb','019_4e1f52e30a','020_c5bbc97e3d','021_3dc9c418f5',
  '022_13fc18d100','023_890a4c0418','024_d5aa1da920','025_e972cdea3c','026_f04b11de8f'
].map(id => `image/backgrounds/chatgpt_generated_${id}.jpg`);
export const characters = 'image/characters/chatgpt_generated_028_ee0700142c.jpg';
export const titleLogo = 'image/branding/title-logo.png';
export const props = Object.fromEntries(['core','ring','tuning-fork','fork-stand','drum','mallet','kalimba','tine','transmitter','receiver'].map(name => [name, `image/generated/${name}.png`]));
export const mapReactionAssets={hero:'image/generated/map-hero-reaction.webp',ally:'image/generated/map-ally-reaction.webp'};
export const villageAssets = ['image/generated/ullim-village.webp','image/generated/map-villain-left.webp',...Object.values(mapReactionAssets),...['explorer-walk','bird-walk'].map(name => `image/generated/${name}.webp`)];
import { conceptAssets } from './concepts.js';
export const interfaceSounds={tap:'click_003',open:'open_001',drop:'place_wood',hint:'select_003',success:'confirmation_002',badge:'restore_chime'};
export const assets = [...new Set(['media/fonts/NanumSquareNeoTTF-bRg.woff2','media/fonts/NanumSquareNeoTTF-cBd.woff2','media/fonts/NanumSquareNeoTTF-dEb.woff2','media/fonts/NanumSquareNeo-OFL.txt',...voiceAssets,...recordedAudioAssets, ...conceptArtAssets,...backgrounds, characters, titleLogo, ...Object.values(props), ...villageAssets, 'image/generated/pio-guide.svg','image/generated/dialogue/pio.webp',...conceptAssets,...Object.values(interfaceSounds).map(n=>`media/audio/${n}.ogg`),'media/audio/License.txt','media/audio/sources.json','media/concepts/manifest.json'])];
export { APP_VERSION } from './version.js';
// Curriculum link per facility. Teacher review is still pending, so needsReview stays true until a reviewer signs off.
export const CURRICULUM_REVIEW = Object.freeze({needsReview:true, source:'2022 개정 과학과 교육과정 3~4학년군 (7) 소리의 성질', reviewer:null, reviewedAt:null});
export const stages = [
  {name:'진동 연구소', short:'진동', color:'#22d3df', icon:'wave', x:132,y:141, mission:'멈춘 연구소에 소리를 되찾아 줘.', reward:'물체의 떨림을 제어하는 힘', standards:['4과07-01'], objective:'소리가 나는 물체는 떨리고, 떨림이 멈추면 소리도 멈춘다는 것을 관찰로 설명한다.', review:CURRICULUM_REVIEW, restored:'연구소의 실험 장치가 다시 움직여!'},
  {name:'볼륨 경기장', short:'크기', color:'#ffbf58', icon:'volume', x:305,y:93, mission:'멀리 있는 친구에게 신호를 보내 줘.', reward:'소리의 크기를 조절하는 힘', standards:['4과07-02'], objective:'같은 물체를 치는 세기를 바꿔 큰 소리와 작은 소리를 구분하고 만들어 낸다.', review:CURRICULUM_REVIEW, restored:'친구들에게 경기 시작 신호가 들려!'},
  {name:'조율 공방', short:'높낮이', color:'#c1a3ff', icon:'music', x:491,y:148, mission:'공방의 뒤섞인 멜로디를 고쳐 줘.', reward:'소리의 높낮이를 조절하는 힘', standards:['4과07-02'], objective:'떨리는 부분의 길이를 바꿔 높은 소리와 낮은 소리를 구분하고 만들어 낸다.', review:CURRICULUM_REVIEW, restored:'공방에서 다시 멜로디가 흘러나와!'},
  {name:'전달 네트워크', short:'전달', color:'#69dcb4', icon:'network', x:456,y:277, mission:'끊어진 도시의 통신을 되살려 줘.', reward:'소리가 전달되는 길을 찾는 힘', standards:['4과07-03'], objective:'소리가 공기·물·고체를 통해 전달되는 것을 관찰하고 생활 상황에 적용한다.', review:CURRICULUM_REVIEW, restored:'물속과 땅 위의 친구들이 연결됐어!'},
  {name:'소음 관리센터', short:'배려', color:'#ffa0a9', icon:'leaf', x:188,y:280, mission:'모두가 편안한 도서관을 만들어 줘.', reward:'상황에 맞게 소리를 다루는 힘', standards:['4과07-03'], objective:'불편한 소리를 줄이는 방법을 찾아 상황에 맞게 실천하고 필요한 소리는 살린다.', review:CURRICULUM_REVIEW, restored:'책 읽는 친구들이 편안해졌어!'}
];
export const legacyLessons = [
  {title:'소리는 어디에서 시작될까?', task:'물체를 눌러 소리를 만들고, 떨리는 모습을 관찰해 봐.', goal:'서로 다른 물체 2개 이상 관찰하기', question:'소리가 나는 물체의 공통점은?', choices:['물체가 떨려.','물체의 색이 바뀌어.'], answer:0, summary:'소리가 나는 물체는 떨려.'},
  {title:'떨림을 멈추면 어떻게 될까?', task:'소리굽쇠를 울린 다음, 손으로 눌러 떨림을 멈춰 봐.', goal:'울리기 → 눌러 멈추기 → 전후 비교', question:'떨림을 멈췄더니 소리는?', choices:['계속 같은 크기로 났어.','떨림과 함께 소리도 멈췄어.'],answer:1,summary:'물체의 떨림이 멈추면 소리도 멈춰.'},
  {title:'나만의 소리 실험 A와 B',task:'같은 북을 다른 세기로 쳐 봐. 두 소리가 A와 B에 바로 담겨.',goal:'서로 다른 세기의 A/B 실험 만들기',summary:'같은 물체를 세게 치면 더 큰 소리가 나.'},
  {title:'어느 실험의 소리가 더 클까?',task:'네가 기록한 A와 B를 다시 듣고 비교해 봐.',goal:'내 실험 A와 B를 모두 듣고 비교하기',question:'더 큰 소리가 난 실험은?',choices:['실험 A','실험 B'],summary:'내 실험을 비교해 치는 세기와 소리 크기의 관계를 확인했어.'},
  {title:'떨리는 길이가 달라지면?',task:'손잡이로 길이를 바꾸면 자가 튕겨져. 서로 다른 소리를 비교해 봐.',goal:'재료·두께·힘은 그대로, 길이 2가지 이상 비교',question:'떨리는 부분이 짧아지면?',choices:['더 높은 소리가 나.','더 낮은 소리가 나.'],answer:0,summary:'같은 자는 떨리는 부분이 짧을수록 더 높은 소리가 나.'},
  {title:'공방의 세 음을 되찾아 줘',task:'목표 신호를 듣고, 길이를 골라 같은 순서로 연주해 봐.',goal:'낮음 → 높음 → 중간 소리로 연주하기',summary:'긴 자 → 짧은 자 → 중간 자로 목표 신호를 연주했어.'},
  {title:'소리가 지나가는 세 가지 길',task:'공기·물·고체에서 각각 소리가 전해지는지 실험해 봐.',goal:'세 물질에서 각각 실험하기',question:'소리가 전달될 수 있는 것은?',choices:['공기만 가능해.','공기, 물, 고체 모두 가능해.'],answer:1,summary:'소리는 공기, 물, 고체를 통해 전달될 수 있어.'},
  {title:'새로운 곳에서도 통할까?',task:'상황을 읽고 주로 어떤 물질을 통해 소리가 전해지는지 확인해 봐.',goal:'새 상황 3개에 전달 원리 적용하기',summary:'목소리는 공기, 물속 돌 소리는 물, 탁자의 두드림은 고체로 전달돼.'},
  {title:'누구에게 불편한 소리일까?',task:'동아리의 북소리 때문에 책 읽기가 어려워졌어. 현장 정보를 살펴봐.',goal:'위치 · 상황 · 영향을 받는 사람 연결하기',summary:'도서관 옆 복도의 북소리가 독서 중인 친구들의 집중을 방해했어.'},
  {title:'소리도, 친구도 배려해 줘',task:'살펴본 상황에 맞게 해결책을 적용하고 독서 시간의 소리를 비교해 봐.',goal:'해결책 적용 → 전후 소리 듣기 → 효과 설명',question:'바꾼 뒤 독서 시간에는?',choices:['소리의 영향을 줄여 책 읽기가 편해져.','언제나 모든 소리가 완전히 없어져.'],answer:0,summary:'장소와 상황에 맞는 해결책으로 소리의 불편함을 줄일 수 있어.'}
];
export const instruments = [
  {id:'rubber',name:'고무줄',action:'튕기기',frequency:330},
  {id:'ruler',name:'자',action:'튕기기',frequency:220},
  {id:'drum',name:'작은 북',action:'두드리기',frequency:140},
  {id:'fork',name:'소리굽쇠',action:'울리기',frequency:520}
];
export const lengths = [{value:18,label:'긴 자',pitch:'낮음',frequency:260},{value:12,label:'중간 자',pitch:'중간',frequency:390},{value:6,label:'짧은 자',pitch:'높음',frequency:650}];
export const media = [
  {id:'air',label:'공기',source:'북',receiver:'친구의 귀',detail:'북과 귀 사이의 공기를 통해 소리가 전해져.'},
  {id:'water',label:'물',source:'물속 종',receiver:'물속 소리 감지기',detail:'물속에서 울린 종의 소리가 물을 통해 전해져.'},
  {id:'solid',label:'고체',source:'탁자 두드림',receiver:'탁자에 댄 감지기',detail:'탁자의 떨림이 고체인 탁자를 따라 전해져.'}
];
export const transferCases = [
  {title:'문 밖에서 친구가 불러',text:'열린 문 밖 친구의 목소리가 귀에 들려. 사이에 있는 것은?',answer:'air'},
  {title:'물속에서 돌을 톡톡',text:'물속 돌 두 개를 부딪칠 때, 물속 감지기에 소리가 전해져.',answer:'water'},
  {title:'탁자에 귀를 대 봐',text:'탁자 한쪽을 살짝 두드렸더니, 탁자에 댄 귀로 들렸어.',answer:'solid'}
];
export const diagnosisFields = [
  {key:'place',label:'소리가 나는 위치',answer:'library',options:[['library','도서관 옆 복도'],['field','운동장 반대편']]},
  {key:'situation',label:'소리가 불편한 상황',answer:'reading',options:[['reading','독서하는 시간'],['festival','함께 북 치는 축제']]},
  {key:'person',label:'영향을 받는 사람',answer:'reader',options:[['reader','책 읽는 친구'],['drummer','공연 중인 연주자']]}
];
export const solutions = [
  {id:'pad',label:'북 아래 패드',detail:'바닥으로 전해지는 떨림을 줄여.'},
  {id:'volume',label:'더 작은 세기로',detail:'북을 살살 쳐 소리 크기를 줄여.'},
  {id:'time',label:'연습 시간 바꾸기',detail:'독서 시간이 끝난 뒤에 연습해.'}
];
export const finalTasks = [
  {q:'공연의 북에서 소리가 나려면?',options:['북의 막이 떨려야 해.','북을 밝게 비추면 돼.'],answer:0},
  {q:'같은 북으로 더 큰 시작 신호를 내려면?',options:['더 살살 두드려.','더 세게 두드려.'],answer:1},
  {q:'같은 자로 더 높은 신호를 내려면?',options:['떨리는 부분을 짧게 해.','떨리는 부분을 길게 해.'],answer:0},
  {q:'무대 바닥을 두드린 소리가 바닥에 댄 감지기에 도착해. 무엇을 통해 왔을까?',options:['고체인 무대 바닥','빛'],answer:0},
  {q:'공연 연습이 옆 교실의 독서를 방해해. 어떻게 할까?',options:['친구들이 참게 해.','세기를 줄이고 연습 시간을 조정해.'],answer:1}
];

// Stable source IDs keep the original ten observations readable after the upgrade.
export const legacyIndex = n => Math.floor(n / 2) * 4 + n % 2;
const newLessons = [
  {challenge:'parts', title:'어디가 떨리고 있을까?', task:'소리를 내 보고, 실제로 떨리는 부분을 찾아 줘.', goal:'네 물체에서 떨리는 부분 찾기', summary:'북의 막, 고무줄, 자의 끝, 소리굽쇠의 두 갈래가 떨려 소리가 나.'},
  {challenge:'rhythm', title:'울림새의 리듬 의뢰', task:'물체를 울리고 멈추며 울림새의 신호를 만들어 줘.', goal:'소리와 쉼을 섞은 신호 세 개 만들기', summary:'물체를 울리면 소리가 나고, 떨림을 멈추면 소리도 멈춰.'},
  {challenge:'signal', title:'딱 알맞은 신호를 보내 줘', task:'같은 북을 치는 세기를 바꿔 요청한 크기의 신호를 보내 줘.', goal:'다른 크기의 신호 네 개 만들기', summary:'같은 북의 소리 크기를 치는 세기로 조절했어.'},
  {challenge:'sort', title:'소리 배달 상자를 정리해 줘', task:'상자를 모두 들어 보고 작은 소리부터 차례대로 놓아 줘.', goal:'두 묶음의 소리를 크기 순서로 정렬하기', summary:'소리의 높낮이를 같게 두고 소리의 크기만 비교했어.'},
  {challenge:'melody', title:'멜로디 세 통을 배달해 줘', task:'목표를 듣고 길이가 다른 자로 같은 순서의 소리를 만들어 줘.', goal:'길이가 다른 자로 멜로디 세 통 연주하기', summary:'떨리는 길이를 바꾸어 낮고 높은 소리를 섞어 연주했어.'},
  {challenge:'mix', title:'크기와 높낮이를 따로 조절해', task:'자의 길이와 튕기는 세기를 각각 조절해 주문한 소리를 만들어 줘.', goal:'크기와 높낮이가 다른 소리 네 개 만들기', summary:'같은 자에서 길이로 높낮이를, 튕기는 세기로 크기를 조절했어.'},
  {challenge:'sensor', title:'소리 감지기를 옮겨 줘', task:'관찰할 물질에 감지기를 놓고 신호가 전해지는지 확인해 줘.', goal:'공기·물·고체에서 각각 실험하기', summary:'소리를 내는 곳과 감지기를 같은 물질에 두고 전달을 확인했어.'},
  {challenge:'classify', title:'주민들의 소리 길을 찾아 줘', task:'주민의 이야기를 읽고, 관찰한 소리가 지나온 물질에 연결해 줘.', goal:'생활 속 여섯 상황을 전달 물질과 연결하기', summary:'일상생활에서도 공기·물·고체를 통해 소리가 전달되는 예를 찾았어.'},
  {challenge:'solutions', title:'소음 해결 가방을 열어 줘', task:'주민의 상황에 맞는 도구를 골라 적용 전후를 비교해 줘.', goal:'서로 다른 불편 네 가지 해결하기', summary:'소리가 나는 곳과 시간, 듣는 사람을 살펴 해결책을 골랐어.'},
  {challenge:'festival', title:'모두가 즐거운 축제를 준비해', task:'음악·안내 방송·의자를 조절해 세 주민의 요청을 함께 해결해 줘.', goal:'필요한 소리는 살리고 불편한 소리는 줄이기', summary:'필요한 안내는 들리게 하고, 음악과 의자를 끌 때 나는 소리를 줄이는 약속을 만들었어.'}
];
const learningFocus = [
  ['소리가 날 때 물체의 어느 곳이 떨릴까?', '소리가 나는 물체에는 떨림이 있어.'],
  ['떨림을 멈추면 소리도 달라질까?', '떨림을 멈추면 그 물체의 소리도 멈춰.'],
  ['북과 고무줄은 어느 부분이 떨릴까?', '북의 막, 고무줄, 자, 소리굽쇠가 떨려.'],
  ['울림과 쉼을 어떻게 만들 수 있을까?', '떨림을 시작하고 멈추며 신호를 만들었어.'],
  ['같은 북을 치는 세기만 바꾸면 어떨까?', '같은 북을 세게 치면 더 큰 소리가 나.'],
  ['세게 친 북과 살살 친 북은 어떻게 다를까?', '치는 세기를 바꿔 소리 크기를 비교했어.'],
  ['친구에게 알맞은 소리 크기는 얼마일까?', '치는 세기로 소리 크기를 조절했어.'],
  ['높낮이가 같은 세 소리의 크기는 어떨까?', '높낮이가 같아도 소리 크기는 다를 수 있어.'],
  ['같은 자의 떨리는 길이만 바꾸면 어떨까?', '같은 자는 떨리는 부분이 짧을수록 높은 소리가 나.'],
  ['어느 길이의 자로 목표 신호를 만들까?', '떨리는 길이를 골라 높낮이를 맞췄어.'],
  ['낮은 소리와 높은 소리를 어떻게 섞을까?', '떨리는 길이를 바꿔 멜로디를 만들었어.'],
  ['높은 소리를 작게도 낼 수 있을까?', '길이로 높낮이, 튕기는 세기로 크기를 조절해.'],
  ['소리는 어떤 물질을 통해 전해질까?', '소리는 공기·물·고체를 통해 전달돼.'],
  ['소리를 내는 곳과 듣는 곳 사이에는 무엇이 있을까?', '사이의 물질을 살펴 소리의 전달을 설명했어.'],
  ['소리를 찾는 도구인 감지기를 어디에 놓을까?', '공기·물·고체에서 소리의 전달을 확인했어.'],
  ['생활 속 소리는 어떤 물질을 통해 전해질까?', '탁자와 팽팽한 실도 소리를 전달하는 고체야.'],
  ['같은 소리도 누구에게는 불편할까?', '듣는 사람과 상황에 따라 소음이 될 수 있어.'],
  ['북 연습이 독서를 덜 방해하게 하려면?', '세기·시간·떨림을 바꿔 불편한 소리를 줄여.'],
  ['어떤 방법이 이 친구의 불편을 줄일까?', '상황에 맞춰 소리 크기·시간·장소를 바꿔.'],
  ['필요한 안내도 들리게 하려면 어떻게 할까?', '필요한 소리는 살리고 불편한 소리는 줄여.']
];
const nextInquiries = [
  '떨림이 소리를 만들었어. 이번에는 같은 북의 소리 크기를 바꿔 볼까?',
  '소리 크기를 바꿨어. 이번에는 높은 소리와 낮은 소리를 만들어 볼까?',
  '크기와 높낮이를 조절했어. 이 소리는 무엇을 통해 친구에게 전해질까?',
  '소리가 전해지는 길을 찾았어. 친구가 불편한 소리는 어떻게 줄일까?',
  '다섯 가지 발견으로 필요한 소리는 살리고 모두가 즐거운 축제를 열어 보자!'
];
stages.forEach((stage, index) => { stage.nextInquiry = nextInquiries[index]; });
export const lessons = stages.flatMap((stage,s) => [
  {...legacyLessons[s*2],base:s*2,stage:s,phase:'관찰'},
  {...legacyLessons[s*2+1],base:s*2+1,stage:s,phase:'비교'},
  {...newLessons[s*2],stage:s,phase:'응용'},
  {...newLessons[s*2+1],stage:s,phase:'의뢰'}
]).map((lesson, index) => ({
  ...lesson,
  standards: stages[lesson.stage].standards,
  inquiry: learningFocus[index][0],
  discovery: learningFocus[index][1]
}));
export const LESSON_COUNT = lessons.length;
export const stageLessons = s => [s*4,s*4+1,s*4+2,s*4+3];
export const achievements = [
  {name:'떨림 탐정',item:'울림 렌즈',promise:'소리가 나는 곳에서 떨림을 찾아볼게.'},
  {name:'크기 조절사',item:'신호 북',promise:'주변 사람에게 알맞은 소리 크기를 생각할게.'},
  {name:'멜로디 장인',item:'조율 열쇠',promise:'소리의 크기와 높낮이를 구분해 볼게.'},
  {name:'소리 길잡이',item:'통신 나침반',promise:'무엇을 통해 소리가 전해졌는지 살펴볼게.'},
  {name:'소리 배려가',item:'배려 배지',promise:'필요한 소리는 살리고, 불편한 소리는 줄일게.'}
];
