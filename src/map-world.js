// Checked against image/generated/ullim-village.png. Normalized coordinates keep
// the picture, labels, light anchors and road graph in the same coordinate space.
const width=1672,height=941;
const point=(x,y)=>({x:x/width,y:y/height});
export const mapLayout={
  width,height,image:'image/generated/ullim-village.png',explorer:'image/generated/explorer-walk.png',companion:'image/generated/bird-walk.png',spawn:'spawn',
  nodes:{
    lab:point(387,384),westTop:point(586,432),northWest:point(663,385),north:point(831,347),arena:point(836,309),
    northEast:point(1038,394),eastTop:point(1107,448),workshop:point(1325,413),east:point(1100,556),
    southEast:point(1017,631),south:point(845,677),core:point(843,628),southWest:point(704,650),
    westBottom:point(617,610),west:point(562,521),gardenTop:point(677,687),garden:point(652,754),gardenBottom:point(593,822),
    noise:point(475,790),spawn:point(845,735),bridgeTop:point(940,781),bridge:point(1005,822),bridgeBottom:point(1110,864),network:point(1267,807),
  },
  edges:[
    ['lab','westTop'],['westTop','northWest'],['northWest','north'],['north','arena'],['north','northEast'],
    ['northEast','eastTop'],['eastTop','workshop'],['eastTop','east'],['east','southEast'],['southEast','south'],
    ['south','core'],['south','southWest'],['southWest','westBottom'],['westBottom','west'],['west','westTop'],
    ['southWest','gardenTop'],['gardenTop','garden'],['garden','gardenBottom'],['gardenBottom','noise'],
    ['south','spawn'],['spawn','bridgeTop'],['bridgeTop','bridge'],['bridge','bridgeBottom'],['bridgeBottom','network'],
  ],
  doors:[
    {stage:0,node:'lab',label:point(387,414),bounds:[point(186,115),point(502,389)],lights:[point(251,300),point(454,282),point(535,504)]},
    {stage:1,node:'arena',label:point(836,337),bounds:[point(651,28),point(1007,308)],lights:[point(771,207),point(906,207),point(1094,307)]},
    {stage:2,node:'workshop',label:point(1325,443),bounds:[point(1153,143),point(1509,410)],lights:[point(1233,317),point(1439,343),point(1549,286)]},
    {stage:3,node:'network',label:point(1267,700),bounds:[point(1168,457),point(1445,800)],lights:[point(1370,745),point(1242,590),point(1086,634)]},
    {stage:4,node:'noise',label:point(455,640),bounds:[point(291,515),point(620,782)],lights:[point(449,625),point(375,694),point(766,714)]},
    {stage:5,node:'core',label:point(843,588),bounds:[point(700,382),point(982,596)],lights:[point(844,461)]},
  ],
};
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export function createWorld(layout=mapLayout){
  if(!Number.isFinite(layout.width)||!Number.isFinite(layout.height)||layout.width<100||layout.height<100)throw Error('Invalid map dimensions');
  const pixel=p=>{
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)throw Error('Invalid map point');
    return {x:p.x*layout.width,y:p.y*layout.height};
  };
  const nodes=Object.fromEntries(Object.entries(layout.nodes).map(([id,p])=>[id,pixel(p)]));
  const adjacency=Object.fromEntries(Object.keys(nodes).map(id=>[id,[]]));
  const edges=layout.edges.map(([a,b],index)=>{
    if(!nodes[a]||!nodes[b]||a===b)throw Error('Invalid road');
    const length=distance(nodes[a],nodes[b]);if(length<1)throw Error('Empty road');
    adjacency[a].push({node:b,edge:index,length});adjacency[b].push({node:a,edge:index,length});return {a,b,length};
  });
  const doors=layout.doors.map(door=>{
    if(!nodes[door.node])throw Error('Missing door road');
    return {...door,...nodes[door.node],radius:23,label:pixel(door.label),bounds:door.bounds.map(pixel),lights:door.lights.map(pixel)};
  });
  if(doors.length!==6||new Set(doors.map(d=>d.stage)).size!==6||!doors.every(d=>Number.isInteger(d.stage)&&d.stage>=0&&d.stage<=5))throw Error('Invalid stage doors');
  if(!nodes[layout.spawn])throw Error('Missing spawn');
  return {width:layout.width,height:layout.height,nodes,edges,adjacency,doors,spawn:nodes[layout.spawn]};
}
export const worldMap=createWorld();
export function buildingAt(point,world=worldMap){
  return world.doors.find(door=>distance(point,door)<58||(
    point.x>=door.bounds[0].x&&point.x<=door.bounds[1].x&&point.y>=door.bounds[0].y&&point.y<=door.bounds[1].y
  ));
}

export function nearestRoad(p,world=worldMap){
  let best=null;
  world.edges.forEach((edge,index)=>{
    const a=world.nodes[edge.a],b=world.nodes[edge.b],t=clamp(((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(edge.length*edge.length),0,1);
    const projected=mix(a,b,t),d=distance(p,projected);if(!best||d<best.distance)best={...projected,edge:index,t,distance:d};
  });return best;
}
function nodeRoute(start,end,world){
  const costs=new Map([[start,0]]),previous=new Map(),pending=new Set(Object.keys(world.nodes));
  while(pending.size){
    let current=null,best=Infinity;
    for(const id of pending)if((costs.get(id)??Infinity)<best){best=costs.get(id);current=id;}
    if(current===null)break;pending.delete(current);
    if(current===end){const route=[end];while(route[0]!==start)route.unshift(previous.get(route[0]));return {cost:best,route};}
    for(const next of world.adjacency[current]){const candidate=best+next.length;if(candidate<(costs.get(next.node)??Infinity)){costs.set(next.node,candidate);previous.set(next.node,current);}}
  }return null;
}
// Both endpoints are projected onto roads. Routes cannot cut through water or buildings.
export function findRoute(start,target,world=worldMap){
  const from=nearestRoad(start,world),to=nearestRoad(target,world);if(!from||!to)return [];
  let best=from.edge===to.edge?{cost:distance(from,to),points:[from,to]}:null;
  const a=world.edges[from.edge],b=world.edges[to.edge];
  for(const first of [a.a,a.b])for(const last of [b.a,b.b]){
    const middle=nodeRoute(first,last,world);if(!middle)continue;
    const cost=distance(from,world.nodes[first])+middle.cost+distance(world.nodes[last],to);
    if(!best||cost<best.cost)best={cost,points:[from,...middle.route.map(id=>world.nodes[id]),to]};
  }return best?best.points.filter((p,i,list)=>i===0||distance(p,list[i-1])>.01).map(({x,y})=>({x,y})):[];
}
export function directionVector(directions){
  const has=key=>directions instanceof Set?directions.has(key):Boolean(directions[key]);
  const x=Number(has('right'))-Number(has('left')),y=Number(has('down'))-Number(has('up')),length=Math.hypot(x,y);
  return length?{x:x/length,y:y/length}:{x:0,y:0};
}
// Junctions choose the outgoing road closest to the held direction. All input
// directions consume equal world distance, including movement on diagonal roads.
export function moveOnRoad(position,input,amount,world=worldMap){
  let p=nearestRoad(position,world),remaining=Math.max(0,amount);const magnitude=Math.hypot(input.x,input.y);
  if(!p||!magnitude||!remaining)return {x:position.x,y:position.y};
  const intent={x:input.x/magnitude,y:input.y/magnitude};
  for(let guard=0;guard<world.edges.length+2&&remaining>.001;guard++){
    const edge=world.edges[p.edge],a=world.nodes[edge.a],b=world.nodes[edge.b],node=p.t<.00001?edge.a:p.t>.99999?edge.b:null;
    let target,available;
    if(node){
      let best=null,score=.12;
      for(const next of world.adjacency[node]){const dest=world.nodes[next.node],dot=((dest.x-p.x)*intent.x+(dest.y-p.y)*intent.y)/next.length;if(dot>score){score=dot;best=next;}}
      if(!best)break;
      p={...world.nodes[node],edge:best.edge,t:world.edges[best.edge].a===node?0:1};target=world.nodes[best.node];available=best.length;
    }else{
      const dot=((b.x-a.x)*intent.x+(b.y-a.y)*intent.y)/edge.length;if(Math.abs(dot)<.12)break;
      target=dot>0?b:a;available=distance(p,target);
    }
    if(remaining<available){const next=mix(p,target,remaining/available);return {x:next.x,y:next.y};}
    remaining-=available;p={...target,edge:p.edge,t:distance(target,world.nodes[world.edges[p.edge].a])<.01?0:1};
  }return {x:p.x,y:p.y};
}
export function returnPosition(stage,world=worldMap){
  const door=world.doors.find(d=>d.stage===stage);if(!door)return {...world.spawn};
  const neighbor=world.adjacency[door.node][0];return mix(door,world.nodes[neighbor.node],Math.min(1,42/neighbor.length));
}
export function createDoorTracker(initial,world=worldMap){
  let inside=new Set(world.doors.filter(d=>distance(initial,d)<=d.radius).map(d=>d.stage));
  return position=>{const current=new Set(world.doors.filter(d=>distance(position,d)<=d.radius).map(d=>d.stage)),entered=[...current].filter(stage=>!inside.has(stage));inside=current;return entered;};
}
