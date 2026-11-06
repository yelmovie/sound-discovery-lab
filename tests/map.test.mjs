import test from 'node:test';
import assert from 'node:assert/strict';
import {mapLayout,createWorld,worldMap,nearestRoad,findRoute,walkStep,canWalk,labelNudge,directionVector,distance,returnPosition,createDoorTracker,buildingAt} from '../src/map-world.js';

test('published world matches the generated map and has six entrances',()=>{
  assert.equal(worldMap.width,1672);assert.equal(worldMap.height,941);
  assert.deepEqual(worldMap.doors.map(d=>d.stage),[0,1,2,3,4,5]);
  assert.throws(()=>createWorld({...mapLayout,width:NaN}));
  assert.throws(()=>createWorld({...mapLayout,doors:mapLayout.doors.slice(1)}));
});
test('spawn reaches every door using only the painted road graph',()=>{
  for(const door of worldMap.doors){
    const route=findRoute(worldMap.spawn,door);assert.ok(route.length>=2,`route to stage ${door.stage}`);assert.ok(distance(route.at(-1),door)<.001);
    for(let i=1;i<route.length;i++)for(let step=0;step<=20;step++){
      const p={x:route[i-1].x+(route[i].x-route[i-1].x)*step/20,y:route[i-1].y+(route[i].y-route[i-1].y)*step/20};
      assert.ok(nearestRoad(p).distance<.001,`stage ${door.stage}: segment stays on a road`);
    }
  }
});
test('network route uses the footbridge and cannot take a river shortcut',()=>{
  const route=findRoute(worldMap.spawn,worldMap.doors[3]);
  assert.ok(route.some(p=>distance(p,worldMap.nodes.bridge)<.01));assert.ok(route.some(p=>distance(p,worldMap.nodes.bridgeBottom)<.01));
  assert.ok(nearestRoad({x:1030,y:760}).distance>45);
});
test('opposite keys cancel, diagonals normalize, held keys remain independent',()=>{
  assert.deepEqual(directionVector(new Set(['left','right'])),{x:0,y:0});assert.deepEqual(directionVector(new Set(['up','down','left','right'])),{x:0,y:0});
  const keys=new Set(['up','right']);assert.ok(Math.abs(Math.hypot(...Object.values(directionVector(keys)))-1)<1e-12);
  keys.delete('up');assert.deepEqual(directionVector(keys),{x:1,y:0});
});
test('held movement walks freely inside the road width and never leaves it',()=>{
  for(const input of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:1,y:1},{x:-1,y:-1}]){
    let position={...worldMap.spawn};for(let i=0;i<200;i++){position=walkStep(position,input,8);assert.ok(canWalk(position),`${input.x},${input.y} step ${i}`);}
  }
  const road={x:560,y:500},side=walkStep(road,{x:1,y:0},8);
  assert.ok(nearestRoad(side).distance>4,'sidestep leaves the centre line');
});
test('walking up from spawn reaches the core door and a road end stops the walker',()=>{
  let p={...worldMap.spawn};for(let i=0;i<40&&distance(p,worldMap.doors[5])>worldMap.doors[5].radius;i++)p=walkStep(p,{x:0,y:-1},8);
  assert.ok(distance(p,worldMap.doors[5])<=worldMap.doors[5].radius);
  const end=walkStep(p,{x:0,y:-1},10000);assert.ok(canWalk(end));assert.ok(distance(end,worldMap.doors[5])<60);
});
test('held direction slides along bends so diagonal roads keep full speed',()=>{
  let p={...worldMap.spawn};for(let i=0;i<120;i++)p=walkStep(p,{x:1,y:0},8);
  assert.ok(distance(p,worldMap.doors[3])<60,'right from spawn crosses the bridge to the network door');
  const start={x:850,y:700},cardinal=walkStep(start,{x:1,y:0},20),diagonal=walkStep(start,{x:1,y:1},20);
  assert.ok(Math.abs(distance(start,cardinal)-20)<.001);assert.ok(Math.abs(distance(start,diagonal)-20)<.001);
});
test('water and buildings stay out of reach and stray positions return to the road',()=>{
  assert.equal(canWalk({x:1030,y:760}),false);assert.equal(canWalk({x:60,y:400}),false);
  for(const door of worldMap.doors.slice(0,5))assert.equal(canWalk({x:door.x,y:door.y-90}),false,`stage ${door.stage}`);
  const back=walkStep({x:1030,y:760},{x:0,y:0},8);assert.ok(canWalk(back));
});
test('walking past on a neighbouring road never brushes a door by accident',()=>{
  for(const door of worldMap.doors)worldMap.edges.forEach(edge=>{
    if(edge.a===door.node||edge.b===door.node)return;
    const a=worldMap.nodes[edge.a],b=worldMap.nodes[edge.b],nx=-(b.y-a.y)/edge.length,ny=(b.x-a.x)/edge.length;
    for(let t=0;t<=1;t+=.05)for(const side of [-1,1]){
      const p={x:a.x+(b.x-a.x)*t+nx*edge.width*side,y:a.y+(b.y-a.y)*t+ny*edge.width*side};
      assert.ok(distance(p,door)>door.radius,`${edge.a}-${edge.b} brushes stage ${door.stage}`);
    }
  });
});
test('labels stay inside the safe area and off-screen ones are left alone',()=>{
  const safe={left:10,right:790,top:90,bottom:400},screen={left:0,right:800,top:0,bottom:500};
  assert.deepEqual(labelNudge({left:-40,right:120,top:200,bottom:260},safe,screen),[50,0]);
  assert.deepEqual(labelNudge({left:700,right:860,top:20,bottom:80},safe,screen),[-70,70]);
  assert.deepEqual(labelNudge({left:300,right:460,top:430,bottom:490},safe,screen),[0,-90]);
  assert.deepEqual(labelNudge({left:-300,right:-140,top:200,bottom:260},safe,screen),[0,0]);
  assert.deepEqual(labelNudge({left:300,right:460,top:200,bottom:260},safe,screen),[0,0]);
});
test('entrances fire once on entry, never on mount or immediate return',()=>{
  for(const door of worldMap.doors){
    const track=createDoorTracker(door);assert.deepEqual(track(door),[]);assert.deepEqual(track(door),[]);
    const back=returnPosition(door.stage);assert.ok(nearestRoad(back).distance<.001);assert.ok(distance(back,door)>door.radius);
    assert.deepEqual(track(back),[]);assert.deepEqual(track(door),[door.stage]);assert.deepEqual(track(door),[]);
    assert.deepEqual(createDoorTracker(back)(back),[]);
  }
});
test('building art accepts pointer destinations while open roads stay ground targets',()=>{
  for(const door of worldMap.doors){const [a,b]=door.bounds;assert.equal(buildingAt({x:(a.x+b.x)/2,y:(a.y+b.y)/2}).stage,door.stage);}
  assert.equal(buildingAt(worldMap.spawn),undefined);assert.equal(buildingAt({x:586,y:432}),undefined);
});
