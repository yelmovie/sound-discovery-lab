import {returnPosition,worldMap} from './map-world.js';

export const mapEncounterIds=['0','1','2','3','4'];
const lines=[
 ['이 떨림, 내가 켰지!','우퍼를 한 번 더 흔들어 볼까?'],
 ['아직 더 키울 수 있지!','손잡이를 조금만 돌려 볼까?'],
 ['멜로디를 한 칸 틀어 볼까?','소리판을 옆으로 밀어야지!'],
 ['신호선을 뽑아 버렸지!','플러그를 흔들면 어떻게 될까?'],
 ['조용하니까 심심한데?','전원등을 한 번 더 켤까?'],
];
export const mapVillainStages=mapEncounterIds.map((id,i)=>{
 const door=worldMap.doors[i],start=returnPosition(i),p=worldMap.nodes[worldMap.adjacency[door.node][0].node];
 const d=Math.hypot(p.x-door.x,p.y-door.y)||1;
 return {id,x:start.x+(p.x-door.x)/d*33,y:start.y+(p.y-door.y)/d*33,
  name:'방해 스피커',lines:lines[i],prop:['wave','dial','flip','plug','light'][i],
  hit:['둥! 우퍼가 울렸어!','덜덜! 플러그가 빠지잖아!'],finish:'전원을 끄고 갈게!'};
});
