import test from 'node:test';
import assert from 'node:assert/strict';
import {mapLayout,createWorld,worldMap,nearestRoad,findRoute,moveOnRoad,directionVector,distance,returnPosition,createDoorTracker,buildingAt} from '../src/map-world.js';

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
test('held movement follows junctions, stops at endpoints and stays on roads',()=>{
  let p={...worldMap.spawn};for(let i=0;i<40;i++){p=moveOnRoad(p,{x:0,y:-1},8);assert.ok(nearestRoad(p).distance<.001);}
  assert.ok(distance(p,worldMap.doors[5])<.01);assert.ok(distance(moveOnRoad(p,{x:0,y:-1},10000),p)<.01);
  for(const input of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:1,y:1}]){
    let position={...worldMap.spawn};for(let i=0;i<200;i++){position=moveOnRoad(position,input,13);assert.ok(nearestRoad(position).distance<.001);}
  }
});
test('cardinal and diagonal commands travel equal world distance',()=>{
  const start={x:940,y:781},cardinal=moveOnRoad(start,{x:1,y:0},20),diagonal=moveOnRoad(start,{x:1,y:1},20);
  assert.ok(Math.abs(distance(start,cardinal)-20)<.001);assert.ok(Math.abs(distance(start,diagonal)-20)<.001);
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
