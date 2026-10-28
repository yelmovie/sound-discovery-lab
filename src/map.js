import { stageDone } from './model.js';
import { mapLayout,worldMap,distance,nearestRoad,findRoute,moveOnRoad,directionVector,returnPosition,createDoorTracker,buildingAt } from './map-world.js';

const visits=new WeakMap();
let seenDone=null;
const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
const rowFor={down:0,left:1,right:2,up:3};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

function loadImage(source,signal){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    const abort=()=>{cleanup();image.src='';reject(Error('cancelled'));};
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);image.onload=null;image.onerror=null;};
    const timer=setTimeout(()=>{cleanup();image.src='';reject(Error('timeout'));},25000);
    image.onload=()=>{cleanup();resolve(image);};
    image.onerror=()=>{cleanup();reject(Error(source));};
    signal?.addEventListener('abort',abort,{once:true});
    image.src=new URL(source,document.baseURI).href;
  });
}
// Alpha bounds give each frame a real foot pivot, ignoring transparent cell padding.
function spriteFrames(image,targetHeight){
  const scratch=document.createElement('canvas');scratch.width=image.naturalWidth;scratch.height=image.naturalHeight;
  const context=scratch.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
  const pixels=context.getImageData(0,0,scratch.width,scratch.height).data,frames=[];
  // Generated sheets have four rows, but a few feet cross exact quarter lines.
  // Choose the transparent gutter nearest each expected division before cropping.
  const rowCounts=Array.from({length:scratch.height},(_,y)=>{
    let count=0;for(let x=0;x<scratch.width;x++)if(pixels[(y*scratch.width+x)*4+3]>=128)count++;return count;
  });
  const rowEdges=[0];
  for(let division=1;division<4;division++){
    const expected=Math.round(scratch.height*division/4),margin=Math.floor(scratch.height/20);
    let best=null,start=null;
    for(let y=expected-margin;y<=expected+margin+1;y++){
      if(y<=expected+margin&&rowCounts[y]===0){if(start===null)start=y;}
      else if(start!==null){const span=y-start;if(!best||span>best.span)best={span,middle:Math.floor((start+y)/2)};start=null;}
    }
    rowEdges.push(best?.middle??expected);
  }
  rowEdges.push(scratch.height);
  let tallest=1;
  for(let row=0;row<4;row++)for(let column=0;column<4;column++){
    const left=Math.floor(column*scratch.width/4),right=Math.floor((column+1)*scratch.width/4);
    const top=rowEdges[row],bottom=rowEdges[row+1];
    let minX=right,minY=bottom,maxX=left,maxY=top;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(pixels[(y*scratch.width+x)*4+3]>=128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    if(minX>maxX||minY>maxY)throw Error('Missing sprite frame');
    const frame={x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1};
    tallest=Math.max(tallest,frame.height);frames.push(frame);
  }
  return {image,frames,scale:targetHeight/tallest};
}

export function mountMap(canvas,state,onArrive){
  const world=worldMap,context=canvas.getContext('2d');
  canvas.width=world.width;canvas.height=world.height;context.imageSmoothingEnabled=false;
  canvas.tabIndex=0;canvas.setAttribute('aria-label','울림도시 지도. 방향키나 W A S D로 걷고, 길이나 건물 이름을 눌러 이동해. 문에 닿으면 들어가.');
  const frameElement=canvas.closest('.map-world')||canvas,viewport=canvas.closest('.map-viewport')||canvas.parentElement;
  const companionButton=frameElement.querySelector?.('.map-companion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const done=Array.from({length:5},(_,i)=>stageDone(state,i));
  const newLights=seenDone?done.flatMap((yes,i)=>yes&&!seenDone[i]?[i]:[]):[];seenDone=done;
  const nextStage=done.findIndex(yes=>!yes),targetStage=nextStage<0?5:nextStage;
  let position={...(visits.get(state)||world.spawn)},bird={x:position.x-38,y:position.y+12};
  let path=[],destination=null,frame=0,lastTime=0,active=true,ready=false,paused=false,manualPause=false,leaving=false;
  let facing='down',birdFacing='down',walkClock=0,moving=false,trail=[{...position}],travel=0;
  let scene,explorerSprite,birdSprite,loadedAt=0,loadVersion=0,arrivalBlocked=false;
  let viewWidth=1,viewHeight=1,worldWidth=1,worldHeight=1,camera={x:0,y:0};
  const pressedKeys=new Set(),screenDirections=new Set(),entered=createDoorTracker(position,world);
  const events=new AbortController(),signal=events.signal;
  const loading=document.createElement('div');loading.className='map-load-state';loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');viewport.append(loading);
  for(const label of frameElement.querySelectorAll?.('[data-stage].map-location,[data-stage].core-marker')||[]){
    const door=world.doors.find(d=>d.stage===Number(label.dataset.stage));
    if(door){label.style.left=`${door.label.x/world.width*100}%`;label.style.top=`${door.label.y/world.height*100}%`;}
  }
  function clearInput(){pressedKeys.clear();screenDirections.clear();path=[];destination=null;moving=false;lastTime=0;}
  function updatePause(){
    const next=manualPause||document.hidden||Boolean(canvas.closest('[inert]'))||Boolean(document.querySelector('dialog[open]'));
    if(next&&!paused)clearInput();paused=next;
  }
  const observer=new MutationObserver(updatePause);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','inert']});
  document.addEventListener('visibilitychange',updatePause,{signal});window.addEventListener('blur',clearInput,{signal});
  function measure(){
    viewWidth=viewport.clientWidth||canvas.clientWidth;viewHeight=viewport.clientHeight||canvas.clientHeight;
    worldWidth=frameElement.clientWidth||viewWidth;worldHeight=frameElement.clientHeight||viewHeight;followCamera(true);
  }
  const resize=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
  resize?.observe(viewport);window.addEventListener('resize',measure,{signal});
  function followCamera(immediate=false,dt=.016){
    if(frameElement===canvas)return;
    const x=clamp(viewWidth*.5-position.x/world.width*worldWidth,Math.min(0,viewWidth-worldWidth),0);
    const y=clamp(viewHeight*.55-position.y/world.height*worldHeight,Math.min(0,viewHeight-worldHeight),0),blend=immediate||reduced.matches?1:1-Math.exp(-dt*8);
    camera.x+=(x-camera.x)*blend;camera.y+=(y-camera.y)*blend;
    frameElement.style.transform=`translate3d(${camera.x.toFixed(2)}px,${camera.y.toFixed(2)}px,0)`;
    if(companionButton){companionButton.style.left=`${bird.x/world.width*100}%`;companionButton.style.top=`${(bird.y+8)/world.height*100}%`;}
  }
  function glow(ctx,p,radius=29,strength=.8){
    const glow=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,radius);glow.addColorStop(0,`rgba(255,231,128,${strength})`);glow.addColorStop(1,'rgba(255,212,102,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
  }
  function buildScene(image){
    scene=document.createElement('canvas');scene.width=world.width;scene.height=world.height;
    const back=scene.getContext('2d');back.imageSmoothingEnabled=false;back.drawImage(image,0,0,world.width,world.height);
    back.fillStyle=`rgba(20,38,56,${.24*(1-done.filter(Boolean).length/5)})`;back.fillRect(0,0,world.width,world.height);
    world.doors.forEach(door=>{if(door.stage===5?state.restored:done[door.stage])door.lights.forEach(p=>glow(back,p,door.stage===5?105:38,.7));});
  }
  function paintSprite(sprite,p,direction,clock,isMoving){
    if(!sprite)return;
    const step=isMoving&&!reduced.matches?Math.floor(clock/125)%4:0,cell=sprite.frames[rowFor[direction]*4+step],w=cell.width*sprite.scale,h=cell.height*sprite.scale;
    context.fillStyle='rgba(38,53,49,.25)';context.beginPath();context.ellipse(p.x,p.y+2,w*.28,7,0,0,Math.PI*2);context.fill();
    context.drawImage(sprite.image,cell.x,cell.y,cell.width,cell.height,Math.round(p.x-w/2),Math.round(p.y-h),Math.round(w),Math.round(h));
  }
  const restorationRoutes=newLights.map(stage=>{
    const route=findRoute(world.doors[stage],world.doors[5],world),lengths=route.slice(1).map((p,i)=>distance(route[i],p));
    return {route,lengths,total:lengths.reduce((a,b)=>a+b,0)};
  });
  function paint(t){
    if(!scene)return;context.drawImage(scene,0,0);
    const door=world.doors[targetStage];
    context.strokeStyle='#ffe894';context.lineWidth=4;context.fillStyle='rgba(255,232,148,.24)';context.beginPath();context.ellipse(door.x,door.y+1,34,13,0,0,Math.PI*2);context.fill();context.stroke();
    if(path.length){context.strokeStyle='rgba(255,244,182,.8)';context.lineWidth=5;context.setLineDash([8,12]);context.beginPath();context.moveTo(position.x,position.y);path.forEach(p=>context.lineTo(p.x,p.y));context.stroke();context.setLineDash([]);}
    if(!reduced.matches&&t-loadedAt<4000)for(const {route,lengths,total} of restorationRoutes)for(let spark=0;spark<4;spark++){
      let offset=((t-loadedAt-spark*150)/3000)*total;if(offset<0||offset>total)continue;
      for(let i=0;i<lengths.length;i++){if(offset<=lengths[i]){const a=route[i],b=route[i+1],n=offset/lengths[i];glow(context,{x:a.x+(b.x-a.x)*n,y:a.y+(b.y-a.y)*n},18,.9);break;}offset-=lengths[i];}
    }
    const residents=done.flatMap((restored,i)=>restored?[{p:{x:world.doors[i].x+48,y:world.doors[i].y-8},sprite:explorerSprite,direction:'down',resident:true}]:[]);
    const characters=[...residents,{p:position,sprite:explorerSprite,direction:facing},{p:bird,sprite:birdSprite,direction:birdFacing}];
    characters.sort((a,b)=>a.p.y-b.p.y).forEach(actor=>{context.save();paintSprite(actor.sprite,actor.p,actor.direction,walkClock,actor.resident?false:moving);context.restore();});
  }
  function faceMovement(before,after){const dx=after.x-before.x,dy=after.y-before.y;return Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
  function arrive(stage){
    if(arrivalBlocked)return;
    clearInput();arrivalBlocked=true;leaving=true;visits.set(state,returnPosition(stage,world));onArrive(stage);
    // Locked buildings may open a dialog while keeping this map mounted.
    queueMicrotask(()=>{arrivalBlocked=false;});
  }
  function followBird(before){
    travel+=distance(before,position);
    if(travel>=7){trail.push({...position});travel=0;while(trail.length>70)trail.shift();}
    let target=trail[0],behind=0;
    for(let i=trail.length-1;i>0;i--){behind+=distance(trail[i],trail[i-1]);if(behind>=47){target=trail[i-1];break;}}
    if(distance(bird,target)>.5){birdFacing=faceMovement(bird,target);bird={...target};}
  }
  function tick(t){
    if(!active)return;
    const dt=lastTime?Math.min((t-lastTime)/1000,.04):0;lastTime=t;
    if(ready&&!paused){
      const before={...position},directions=new Set([...pressedKeys].map(code=>keys[code]).concat([...screenDirections])),intent=directionVector(directions);
      if(intent.x||intent.y){path=[];destination=null;position=moveOnRoad(position,intent,dt*205,world);}
      else if(path.length){let remaining=dt*205;while(path.length&&remaining>0){const target=path[0],d=distance(position,target);if(d<=remaining){position={...target};path.shift();remaining-=d;}else{position={x:position.x+(target.x-position.x)/d*remaining,y:position.y+(target.y-position.y)/d*remaining};remaining=0;}}}
      moving=distance(before,position)>.01;
      if(moving){facing=faceMovement(before,position);walkClock+=dt*1000;followBird(before);leaving=false;}
      const arrivals=entered(position),requested=destination;
      if(arrivals.length&&(requested===null||arrivals.includes(requested))){arrive(requested??arrivals[0]);if(!active)return;}
      else if(!path.length&&requested!==null){destination=null;arrive(requested);if(!active)return;}
      followCamera(false,dt);paint(t);
    }
    frame=requestAnimationFrame(tick);
  }
  async function load(){
    const version=++loadVersion;ready=false;loading.hidden=false;loading.replaceChildren(document.createTextNode('마을로 가는 길을 준비하고 있어…'));
    try{
      const [background,explorer,birdImage]=await Promise.all([loadImage(mapLayout.image,signal),loadImage(mapLayout.explorer,signal),loadImage(mapLayout.companion,signal)]);
      if(!active||version!==loadVersion)return;
      if(background.naturalWidth!==world.width||background.naturalHeight!==world.height)throw Error('Map dimensions do not match');
      explorerSprite=spriteFrames(explorer,83);birdSprite=spriteFrames(birdImage,40);buildScene(background);
      ready=true;loadedAt=performance.now();loading.hidden=true;measure();paint(loadedAt);
    }catch{
      if(!active||version!==loadVersion)return;
      loading.replaceChildren(document.createTextNode('마을 그림을 불러오지 못했어. 탐구 기록은 그대로야. '));
      const retry=document.createElement('button');retry.type='button';retry.textContent='다시 불러오기';retry.addEventListener('click',load,{signal});loading.append(retry);
    }
  }
  function walk(stage){
    if(!ready||paused||!Number.isInteger(stage)||stage<0||stage>5)return false;
    clearInput();const door=world.doors[stage];
    if(distance(position,door)<=door.radius||reduced.matches){position={x:door.x,y:door.y};entered(position);paint(performance.now());followCamera(true);arrive(stage);return true;}
    path=findRoute(position,door,world).slice(1);destination=stage;return path.length>0;
  }
  function direction(dir,isPressed){
    if(!(dir in rowFor))return;
    if(!isPressed){screenDirections.delete(dir);return;}
    if(!ready||paused)return;screenDirections.add(dir);path=[];destination=null;
  }
  const editable=target=>target instanceof Element&&Boolean(target.closest('input,select,textarea,[contenteditable="true"],dialog'));
  document.addEventListener('keydown',event=>{
    if(!active||!ready||paused||editable(event.target))return;
    if(keys[event.code]){event.preventDefault();pressedKeys.add(event.code);path=[];destination=null;}
    else if((event.code==='Enter'||event.code==='Space')&&event.target===canvas){
      const nearest=world.doors.reduce((best,d)=>distance(position,d)<distance(position,best)?d:best,world.doors[0]);
      if(distance(position,nearest)<85){event.preventDefault();walk(nearest.stage);}
    }
  },{signal});
  document.addEventListener('keyup',event=>{if(keys[event.code]){pressedKeys.delete(event.code);event.preventDefault();}},{signal});
  canvas.addEventListener('pointerdown',event=>{
    if(!ready||paused||event.button!==0)return;
    const rect=canvas.getBoundingClientRect(),target={x:(event.clientX-rect.left)/rect.width*world.width,y:(event.clientY-rect.top)/rect.height*world.height},door=buildingAt(target,world);
    canvas.focus({preventScroll:true});if(door){walk(door.stage);return;}
    clearInput();const road=nearestRoad(target,world);if(road&&road.distance<155){path=findRoute(position,road,world).slice(1);destination=null;}
  },{signal});
  updatePause();measure();load();frame=requestAnimationFrame(tick);
  return {walk,direction,pause(value=true){manualPause=Boolean(value);updatePause();},destroy(){active=false;loadVersion++;if(!leaving)visits.set(state,{...position});cancelAnimationFrame(frame);events.abort();observer.disconnect();resize?.disconnect();loading.remove();}};
}
