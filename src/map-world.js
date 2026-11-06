// Checked against image/generated/ullim-village.jpg. Normalized coordinates keep
// the picture, labels, light anchors and road graph in the same coordinate space.
const width=1672,height=941;
const point=(x,y)=>({x:x/width,y:y/height});
export const mapLayout={
  width,height,roadWidth:26,image:'image/generated/ullim-village.jpg',explorer:'image/generated/explorer-walk.png',companion:'image/generated/bird-walk.png',spawn:'spawn',
  // Centre lines and half widths are traced from the sand colour of the artwork, kept a
  // few pixels inside it so feet stay on the path. Narrow widths are stairs, stones and the bridge.
  nodes:{
    lab:point(388,358),labStep:point(416,386),labRoad:point(470,408),westTop:point(568,447),
    northWest:point(668,372),forest:point(640,290),forestEnd:point(592,226),north:point(831,350),arenaStep:point(836,305),arena:point(834,262),
    northMid:point(960,350),groveGate:point(1015,372),grove:point(1052,300),groveEnd:point(1100,248),northEast:point(1050,392),
    eastTop:point(1110,440),workshopRoad:point(1205,438),workshopGate:point(1300,424),workshopStep:point(1312,395),workshop:point(1312,368),
    eastMid:point(1125,490),east:point(1100,548),southEast:point(1040,602),southRing:point(955,638),south:point(845,660),core:point(843,592),
    ringSW:point(760,638),gardenGate:point(712,626),southWest:point(668,608),westBottom:point(600,565),west:point(562,505),
    gardenTop:point(695,700),garden:point(650,770),gardenBottom:point(600,815),noisePatch:point(530,835),noiseStep:point(480,800),noise:point(462,762),
    spawn:point(850,735),bridgeTop:point(892,795),bridgeGate:point(962,832),bridge:point(1004,842),bridgeBottom:point(1050,872),bridgeEnd:point(1115,900),bridgeExit:point(1165,880),
    networkRoad:point(1205,835),networkStep:point(1262,808),network:point(1262,772),
  },
  edges:[
    ['lab','labStep',14],['labStep','labRoad',16],['labRoad','westTop',20],
    ['westTop','northWest',28],['northWest','forest',20],['forest','forestEnd',20],['northWest','north',24],['north','arenaStep',20],['arenaStep','arena',14],
    ['north','northMid',24],['northMid','groveGate',24],['groveGate','grove',14],['grove','groveEnd',14],['groveGate','northEast',24],['northEast','eastTop',26],
    ['eastTop','workshopRoad',15],['workshopRoad','workshopGate',15],['workshopGate','workshopStep',16],['workshopStep','workshop',14],
    ['eastTop','eastMid',26],['eastMid','east',26],['east','southEast',22],['southEast','southRing',22],['southRing','south',26],['south','core',20],
    ['south','ringSW',26],['ringSW','gardenGate',24],['gardenGate','southWest',24],['southWest','westBottom',28],['westBottom','west',34],['west','westTop',36],
    ['gardenGate','gardenTop',12],['gardenTop','garden',12],['garden','gardenBottom',12],['gardenBottom','noisePatch',24],['noisePatch','noiseStep',18],['noiseStep','noise',14],
    ['south','spawn',30],['spawn','bridgeTop',24],['bridgeTop','bridgeGate',18],['bridgeGate','bridge',14],['bridge','bridgeBottom',14],['bridgeBottom','bridgeEnd',14],
    ['bridgeEnd','bridgeExit',16],['bridgeExit','networkRoad',22],['networkRoad','networkStep',18],['networkStep','network',14],
  ],
  doors:[
    {stage:0,resident:point(452,432),node:'lab',label:point(340,262),bounds:[point(186,115),point(502,389)],lights:[point(251,300),point(454,282),point(535,504)]},
    {stage:1,resident:point(772,322),node:'arena',label:point(836,160),bounds:[point(651,28),point(1007,308)],lights:[point(771,207),point(906,207),point(1094,307)]},
    {stage:2,resident:point(1236,470),node:'workshop',label:point(1335,262),bounds:[point(1153,143),point(1509,410)],lights:[point(1233,317),point(1439,343),point(1549,286)]},
    {stage:3,resident:point(1190,792),node:'network',label:point(1285,640),bounds:[point(1168,457),point(1445,800)],lights:[point(1370,745),point(1242,590),point(1086,634)]},
    {stage:4,resident:point(566,800),node:'noise',label:point(440,610),bounds:[point(291,515),point(620,782)],lights:[point(449,625),point(375,694),point(766,714)]},
    {stage:5,node:'core',label:point(843,462),bounds:[point(700,382),point(982,596)],lights:[point(844,461)]},
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
  const edges=layout.edges.map(([a,b,width],index)=>{
    if(!nodes[a]||!nodes[b]||a===b)throw Error('Invalid road');
    const length=distance(nodes[a],nodes[b]);if(length<1)throw Error('Empty road');
    adjacency[a].push({node:b,edge:index,length});adjacency[b].push({node:a,edge:index,length});return {a,b,length,width:width??layout.roadWidth??26};
  });
  const doors=layout.doors.map(door=>{
    if(!nodes[door.node])throw Error('Missing door road');
    return {...door,...nodes[door.node],radius:16,label:pixel(door.label),resident:door.resident&&pixel(door.resident),bounds:door.bounds.map(pixel),lights:door.lights.map(pixel)};
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
function roadGap(p,edge,world){
  const a=world.nodes[edge.a],b=world.nodes[edge.b],t=clamp(((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(edge.length*edge.length),0,1);
  return distance(p,mix(a,b,t));
}
// Each road is a band around its centre line, so the walker can move freely on
// the painted sand while water, fences and buildings stay out of reach.
export const canWalk=(p,world=worldMap)=>world.edges.some(edge=>roadGap(p,edge,world)<=edge.width);
// A blocked step turns onto the road closest to the held direction at full speed,
// so all input directions still consume equal world distance on diagonal roads.
export function walkStep(position,input,amount,world=worldMap){
  let p={x:position.x,y:position.y};
  if(!canWalk(p,world)){const road=nearestRoad(p,world);if(road)p={x:road.x,y:road.y};}
  const magnitude=Math.hypot(input.x,input.y);if(!magnitude||!(amount>0))return p;
  const dir={x:input.x/magnitude,y:input.y/magnitude},steps=Math.min(64,Math.ceil(amount/5)),size=amount/steps;
  for(let i=0;i<steps;i++){
    const ahead={x:p.x+dir.x*size,y:p.y+dir.y*size};
    if(canWalk(ahead,world)){p=ahead;continue;}
    let best=null,score=.12;
    for(const turn of [.6,-.6,1.2,-1.2]){ // round road ends and tapers: edge around them
      const c=Math.cos(turn),n=Math.sin(turn),x=dir.x*c-dir.y*n,y=dir.x*n+dir.y*c,slide={x:p.x+x*size,y:p.y+y*size};
      if(c>score&&canWalk(slide,world)){score=c;best=slide;}
    }
    for(const edge of world.edges){
      if(roadGap(p,edge,world)>edge.width+size)continue;
      const a=world.nodes[edge.a],b=world.nodes[edge.b],tx=(b.x-a.x)/edge.length,ty=(b.y-a.y)/edge.length,along=dir.x*tx+dir.y*ty,sign=Math.sign(along)||1;
      const slide={x:p.x+tx*sign*size,y:p.y+ty*sign*size};
      if(Math.abs(along)>score&&canWalk(slide,world)){score=Math.abs(along);best=slide;}
    }
    if(!best)break;p=best;
  }
  return p;
}
// Pushes a label inside the safe area; one fully off screen stays put so it scrolls in naturally.
export function labelNudge(box,safe,screen=safe){
  if(box.right<=screen.left||box.left>=screen.right||box.bottom<=screen.top||box.top>=screen.bottom)return [0,0];
  return [Math.max(safe.left-box.left,Math.min(0,safe.right-box.right)),Math.max(safe.top-box.top,Math.min(0,safe.bottom-box.bottom))];
}
export function returnPosition(stage,world=worldMap){
  const door=world.doors.find(d=>d.stage===stage);if(!door)return {...world.spawn};
  const neighbor=world.adjacency[door.node][0];return mix(door,world.nodes[neighbor.node],Math.min(1,42/neighbor.length));
}
export function createDoorTracker(initial,world=worldMap){
  let inside=new Set(world.doors.filter(d=>distance(initial,d)<=d.radius).map(d=>d.stage));
  return position=>{const current=new Set(world.doors.filter(d=>distance(position,d)<=d.radius).map(d=>d.stage)),entered=[...current].filter(stage=>!inside.has(stage));inside=current;return entered;};
}
