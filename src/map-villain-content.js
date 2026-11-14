import {returnPosition,nearestRoad,worldMap} from './map-world.js';

export const mapEncounterIds=['0','1','2','3','4'];
const dialogue=[
  ["떨림을 멈추면 소리도 멈추는 걸 알아냈어? 내 우퍼가 조용해지잖아!", "둥둥! 그래도 내 배는 아직 떨린다!", "둥! 우퍼 막이 떨려!", "쉿! 떨림을 잡으니 조용해지잖아!", "쳇, 우퍼 전원은 꺼 줄게!"],
  ["같은 북으로 큰 소리와 작은 소리를 만들었어? 내 볼륨 눈금은 숨겼는데!", "쿵! 내 발소리는 무조건 최고 볼륨이다!", "앗, 볼륨 손잡이가 돌아가!", "내 큰 소리가 속삭임이 됐잖아!", "흥, 경기장 볼륨은 적당히 맞출게!"],
  ["긴 자랑 짧은 자로 멜로디를 맞췄어? 솔미라를 뒤집어 놨는데!", "내 테마곡은 제일 낮게 시작해서 끝까지 삑!", "삑! 내 음판이 한 칸 움직였어!", "높고 낮은 소리가 다시 맞았잖아!", "쳇, 음판은 네가 정해. 나는 삑 하고 퇴장!"],
  ["공기랑 물, 탁자에서도 소리를 찾아냈어? 나는 선만 뽑으면 끝인 줄!", "이젠 내 비밀 계획도 탁자에 들리겠군!", "앗, 끊어 둔 신호가 연결됐어!", "물속 감지기까지 깜빡이잖아!", "흥, 전달 네트워크는 돌려줄게!"],
  ["독서 시간에 북소리를 줄였어? 내 소음 공연은 어디서 하라고!", "좋아, 앙코르는 아무도 없는 연습실이다!", "앗, 북 아래 패드가 떨림을 잡았어!", "소리 대신 책 넘기는 소리만 나잖아!", "쉿! 여긴 도서관이니까 조용히 퇴장할게!"],
];
export const mapVillainStages=mapEncounterIds.map((id,i)=>{
 const door=worldMap.doors[i],start=returnPosition(i),p=worldMap.nodes[worldMap.adjacency[door.node][0].node];
 const d=Math.hypot(p.x-door.x,p.y-door.y)||1;
 const along=[45,48,45,48,45][i],road=nearestRoad({x:start.x+(p.x-door.x)/d*along,y:start.y+(p.y-door.y)/d*along},worldMap);
 const a=road.point??road;
 return {id,x:a.x,y:a.y,
  name:'방해 스피커',lines:dialogue[i].slice(0,2),prop:['wave','dial','flip','plug','light'][i],
  hit:dialogue[i].slice(2,4),finish:dialogue[i][4]};
});
