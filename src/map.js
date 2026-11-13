import {mountMapEncounters} from './map-encounters.js';
import {mapVillainStages} from './map-villain-content.js';
import { stages } from './data.js';
import { stageDone } from './model.js';
import {paintSoundBuilding} from './map-renewal.js';
import { mapLayout,worldMap,distance,nearestRoad,findRoute,walkStep,canWalk,labelNudge,directionVector,returnPosition,createDoorTracker,buildingAt } from './map-world.js';

const visits=new WeakMap();
const seenDone=new WeakMap();
const keys={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
const rowFor={down:0,left:1,right:2,up:3};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
// Canvas hue turns for the blue bird sheet, one per restored facility.
const residentHue=[-20,200,60,-55,150];
const gardenStones=['gardenGate','gardenTop','garden','gardenBottom'];
const fogScale=.25;

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

export function mountMap(canvas,state,onArrive,options={}){
  const world=worldMap,context=canvas.getContext('2d');
  canvas.width=world.width;canvas.height=world.height;context.imageSmoothingEnabled=false;
  canvas.tabIndex=0;canvas.setAttribute('aria-label','울림도시 지도. 방향키나 W A S D로 길 위를 걷고, 길이나 건물 이름을 눌러 이동해. 문에 닿으면 들어가.');
  const frameElement=canvas.closest('.map-world')||canvas,viewport=canvas.closest('.map-viewport')||canvas.parentElement;
  const companionButton=frameElement.querySelector?.('.map-companion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const done=Array.from({length:5},(_,i)=>stageDone(state,i));
  const previous=seenDone.get(state),completion=[...done,Boolean(state.restored)];
  const newLights=previous?completion.flatMap((yes,i)=>yes&&!previous[i]?[i]:[]):[];
  seenDone.set(state,completion);
  const nextStage=done.findIndex(yes=>!yes),targetStage=nextStage<0?5:nextStage;
  let position={...(visits.get(state)||world.spawn)},bird={x:position.x-38,y:position.y+12};
  let path=[],destination=null,goal=null,near=null,chatting=null,stepCount=0,frame=0,lastTime=0,active=true,ready=false,paused=false,manualPause=false,leaving=false;
  let facing='down',birdFacing='down',walkClock=0,moving=false,trail=[{...position}],travel=0;
  let scene,beforeScene,explorerSprite,birdSprite,residentSprites=[],loadedAt=0,loadVersion=0,arrivalBlocked=false;
  let viewWidth=1,viewHeight=1,worldWidth=1,worldHeight=1,camera={x:0,y:0};
  // follow: the camera stays on the explorer. hand: dragging pans freely. overview: the whole town fits.
  // Walking always returns to follow, so a child can never lose the explorer.
  let view='follow',zoom=1,handZoom=1,fitZoom=1,free=null,beforeOverview=null,grab=null,pinch=null,dragged=false,safe={top:0,bottom:0};
  const pointers=new Map();
  const fog=document.createElement('canvas'),fogBase=document.createElement('canvas');fog.width=fogBase.width=Math.ceil(world.width*fogScale);fog.height=fogBase.height=Math.ceil(world.height*fogScale);
  const fogContext=fog.getContext('2d'),fogBaseContext=fogBase.getContext('2d');let fogKey='';
  const pressedKeys=new Set(),screenDirections=new Set(),entered=createDoorTracker(position,world);
  const events=new AbortController(),signal=events.signal;
  const loading=document.createElement('div');loading.className='map-load-state';loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');viewport.append(loading);
  const bubble=document.createElement('div');bubble.className='companion-bubble map-bubble';bubble.hidden=true;frameElement.append?.(bubble);
  const talk=document.createElement('button');talk.type='button';talk.className='map-resident-talk';talk.hidden=true;talk.setAttribute('aria-haspopup','dialog');viewport.parentElement?.querySelector('.map-help')?.append(talk);
  talk.addEventListener('click',()=>{if(chatting)options.onTalk?.(chatting.stage);},{signal});
  const labels=[...(frameElement.querySelectorAll?.('[data-stage].map-location,[data-stage].core-marker')||[])].flatMap(element=>{
    const door=world.doors.find(d=>d.stage===Number(element.dataset.stage));if(!door)return [];
    element.style.left=`${door.label.x/world.width*100}%`;element.style.top=`${door.label.y/world.height*100}%`;
    return [{element,x:door.label.x/world.width,y:door.label.y/world.height,width:0,height:0,offset:''}];
  });
  function setDestination(stage){if(destination!==stage){destination=stage;options.onTravel?.(stage);}}
  function stopRoute(){path=[];goal=null;setDestination(null);}
  function clearInput(){pressedKeys.clear();screenDirections.clear();stopRoute();moving=false;lastTime=0;}
  const encounters=mountMapEncounters({host:viewport,controls:viewport.closest('.map-page')?.querySelector('.map-tools')??viewport,stages:state.settings?.admin?[]:mapVillainStages.filter((_,i)=>done[i]),
   progress:state.mapHits,onSave:options.onMapHit,art:{left:new URL('image/generated/map-villain-left.webp',document.baseURI).href,frames:6},
   palette:'#c9a3ff',reach:122,contact:28,tone:options.encounterTone,
   blocked:()=>!ready||!active||paused||view!=='follow'||destination!==null||dragged,
   reduced:()=>reduced.matches});
  function updateEncounters(){
   const sx=worldWidth*zoom/world.width,sy=worldHeight*zoom/world.height;
   return encounters.update({hero:position,ally:bird,scale:sx,project:p=>({x:camera.x+p.x*sx,y:camera.y+p.y*sy})});
  }
  function updatePause(){
    const next=manualPause||document.hidden||Boolean(canvas.closest('[inert]'))||Boolean(document.querySelector('dialog[open]'));
    if(next&&!paused){clearInput();cancelGesture();}paused=next;if(next)updateEncounters();
  }
  const observer=new MutationObserver(updatePause);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','inert']});
  document.addEventListener('visibilitychange',updatePause,{signal});window.addEventListener('blur',()=>{clearInput();cancelGesture();},{signal});
  function measure(){
    viewWidth=viewport.clientWidth||canvas.clientWidth;viewHeight=viewport.clientHeight||canvas.clientHeight;
    worldWidth=frameElement.clientWidth||viewWidth;worldHeight=frameElement.clientHeight||viewHeight;
    fitZoom=Math.min(1,viewWidth/worldWidth,viewHeight/worldHeight);
    handZoom=clamp(handZoom,fitZoom,1.85);
    const page=viewport.parentElement,help=page?.querySelector?.('.map-help'),controls=page?.querySelector?.('.map-controls'),box=viewport.getBoundingClientRect?.();
    safe={top:help&&box?help.getBoundingClientRect().bottom-box.top+8:8,bottom:controls&&box?controls.getBoundingClientRect().top-box.top-8:viewHeight-8};
    for(const label of labels){label.width=label.element.offsetWidth;label.height=label.element.offsetHeight;}
    followCamera(true);
  }
  const resize=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
  resize?.observe(viewport);window.addEventListener('resize',measure,{signal});
  function placeLabels(){
    const screen={left:0,right:viewWidth,top:0,bottom:viewHeight},area={left:10,right:viewWidth-10,top:safe.top,bottom:safe.bottom};
    for(const label of labels){
      const x=camera.x+label.x*worldWidth*zoom,y=camera.y+label.y*worldHeight*zoom;
      const [dx,dy]=labelNudge({left:x-label.width/2,right:x+label.width/2,top:y,bottom:y+label.height},area,screen),offset=`${(dx/zoom).toFixed(1)}px ${(dy/zoom).toFixed(1)}px`;
      if(offset!==label.offset){label.offset=offset;label.element.style.translate=offset;}
    }
  }
  function followCamera(immediate=false,dt=.016){
    if(frameElement===canvas)return;
    const smooth=immediate||reduced.matches||view==='hand'?1:1-Math.exp(-dt*(view==='overview'?5:8)),wanted=view==='overview'?fitZoom:view==='hand'?handZoom:1;
    zoom+=(wanted-zoom)*smooth;if(Math.abs(wanted-zoom)<.002)zoom=wanted;
    const width=worldWidth*zoom,height=worldHeight*zoom,axis=(size,span,at)=>span<=size?(size-span)/2:clamp(at,size-span,0);
    const focus=view==='overview'?{x:.5,y:.5}:free??{x:position.x/world.width,y:position.y/world.height};
    const x=axis(viewWidth,width,viewWidth*.5-focus.x*width),y=axis(viewHeight,height,viewHeight*(view==='follow'?.55:.5)-focus.y*height),blend=free?1:smooth;
    camera.x+=(x-camera.x)*blend;camera.y+=(y-camera.y)*blend;
    frameElement.style.transform=`translate3d(${camera.x.toFixed(2)}px,${camera.y.toFixed(2)}px,0) scale(${zoom.toFixed(4)})`;
    frameElement.style.setProperty('--map-unscale',(1/zoom).toFixed(4));
    if(companionButton){const bx=bird.x/world.width,by=(bird.y+8)/world.height,sx=camera.x+bx*width,sy=camera.y+by*height;
      companionButton.hidden=!ready||view==='overview'||sx<22||sx>viewWidth-22||sy<44||sy>viewHeight;
      companionButton.style.left=`${bx*100}%`;companionButton.style.top=`${by*100}%`;
    }
    placeLabels();
  }
  function screenWorld(x,y){return {x:(x-camera.x)/(worldWidth*zoom),y:(y-camera.y)/(worldHeight*zoom)};}
  function setView(next,restore=false){
    if(view===next)return;
    const previousView=view,center=screenWorld(viewWidth/2,viewHeight/2),saved=beforeOverview;
    if(next==='overview')beforeOverview={view,free:free??center,zoom:handZoom};
    if(previousView==='overview'){
      if(restore&&saved)next=saved.view;
      beforeOverview=null;
    }
    view=next;free=view==='hand'?(restore&&saved?saved.free:center):null;
    handZoom=view==='hand'?clamp(restore&&saved?saved.zoom:zoom,fitZoom,1.85):1;
    grab=null;viewport.classList.toggle('hand-on',view==='hand');viewport.classList.remove('grabbing');options.onView?.(view);
    if(view==='hand')followCamera(true);
  }
  function pointerLocal(event){const r=viewport.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};}
  function pinched(){const [a,b]=pointers.values();return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,gap:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};}
  function setHandZoom(value,point,at){handZoom=clamp(value,fitZoom,1.85);free={x:point.x-(at.x-viewWidth*.5)/(worldWidth*handZoom),y:point.y-(at.y-viewHeight*.5)/(worldHeight*handZoom)};followCamera(true);}
  function beginHand(){clearInput();setView('hand');}
  function cancelGesture(){pointers.clear();grab=null;pinch=null;viewport.classList.remove('grabbing');}
  function resumeFollow(){cancelGesture();setView('follow');}
  function capture(pointer){try{viewport.setPointerCapture(pointer);}catch{}}

  function glow(ctx,p,radius=29,strength=.8){
    const glow=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,radius);glow.addColorStop(0,`rgba(255,231,128,${strength})`);glow.addColorStop(1,'rgba(255,212,102,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
  }
  // The art has no road through the flower bed, so the crossing gets painted stepping stones.
  function paintStones(back){
    const line=gardenStones.map(id=>world.nodes[id]);let side=1;
    for(let i=0;i<line.length-1;i++){
      const a=line[i],b=line[i+1],count=Math.floor(distance(a,b)/26),nx=-(b.y-a.y)/distance(a,b),ny=(b.x-a.x)/distance(a,b);
      for(let k=0;k<count;k++,side=-side){
        const t=(k+.5)/count,x=a.x+(b.x-a.x)*t+nx*side*4,y=a.y+(b.y-a.y)*t+ny*side*4;
        back.fillStyle='#5f6b4a88';back.beginPath();back.ellipse(x,y+3,15,8,0,0,Math.PI*2);back.fill();
        back.fillStyle='#e4d9c4';back.beginPath();back.ellipse(x,y,14,7,0,0,Math.PI*2);back.fill();
        back.fillStyle='#f4ecdc';back.beginPath();back.ellipse(x-2,y-2,8,3,0,0,Math.PI*2);back.fill();
      }
    }
  }
  function buildScene(image){
    scene=document.createElement('canvas');scene.width=world.width;scene.height=world.height;
    const back=scene.getContext('2d');back.imageSmoothingEnabled=false;back.drawImage(image,0,0,world.width,world.height);paintStones(back);
    if(newLights.length&&!reduced.matches){beforeScene=document.createElement('canvas');beforeScene.width=world.width;beforeScene.height=world.height;beforeScene.getContext('2d').drawImage(scene,0,0);}
    function draw(c,reveal){
      world.doors.forEach(door=>{
        const restored=completion[door.stage]&&(reveal||!newLights.includes(door.stage));
        paintSoundBuilding(c,image,world,door.stage,restored);
        if(restored)door.lights.forEach(p=>glow(c,p,door.stage===5?105:38,.7));
      });
    }
    draw(back,true);
    if(beforeScene)draw(beforeScene.getContext('2d'),false);
  }
  function clearAround(target,p,radius){
    const light=target.createRadialGradient(p.x,p.y,radius*.25,p.x,p.y,radius);
    light.addColorStop(0,'rgba(0,0,0,1)');light.addColorStop(.55,'rgba(0,0,0,.8)');light.addColorStop(1,'rgba(0,0,0,0)');
    target.fillStyle=light;target.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);
  }
  // Each restored facility lifts the dusk a step; the explorer always carries a pool of light.
  function paintDusk(t){
    const reveal=newLights.length&&!reduced.matches?clamp((t-loadedAt)/2000,0,1):1,level=done.filter(Boolean).length-newLights.filter(i=>i<5).length*(1-reveal),darkness=.44*(1-level/5);
    if(darkness<.005)return;
    const key=`${darkness.toFixed(3)}|${reveal.toFixed(2)}`;
    if(key!==fogKey){
      fogKey=key;const base=fogBaseContext;base.setTransform(fogScale,0,0,fogScale,0,0);base.globalCompositeOperation='source-over';base.clearRect(0,0,world.width,world.height);
      base.fillStyle=`rgba(13,34,60,${darkness})`;base.fillRect(0,0,world.width,world.height);base.globalCompositeOperation='destination-out';
      const target=world.doors[targetStage];clearAround(base,{x:target.x,y:target.y-30},150);
      world.doors.forEach(door=>{
        if(door.stage===5||!done[door.stage])return;const grow=newLights.includes(door.stage)?reveal:1;
        clearAround(base,{x:(door.bounds[0].x+door.bounds[1].x)/2,y:(door.bounds[0].y+door.bounds[1].y)/2},Math.max(30,270*grow));door.lights.forEach(p=>clearAround(base,p,Math.max(12,90*grow)));
      });
    }
    fogContext.setTransform(1,0,0,1,0,0);fogContext.globalCompositeOperation='copy';fogContext.drawImage(fogBase,0,0);
    fogContext.setTransform(fogScale,0,0,fogScale,0,0);fogContext.globalCompositeOperation='destination-out';clearAround(fogContext,{x:position.x,y:position.y-30},170);
    context.imageSmoothingEnabled=true;context.drawImage(fog,0,0,world.width,world.height);context.imageSmoothingEnabled=false;
  }
  // Sound rings mark the next place; they stand still when reduced motion is on.
  function paintBeacon(t){
    const door=world.doors[targetStage],color=stages[targetStage]?.color||'#ffe894';
    context.strokeStyle='#fff6c8';context.lineWidth=3;context.fillStyle=`${color}55`;context.beginPath();context.ellipse(door.x,door.y+1,30,12,0,0,Math.PI*2);context.fill();context.stroke();
    context.strokeStyle=color;context.lineWidth=4;
    for(let i=0;i<3;i++){
      const phase=reduced.matches?(i+1)/4:(t/2100+i/3)%1,width=34+phase*70;
      context.globalAlpha=(1-phase)*.85;context.beginPath();context.ellipse(door.x,door.y+1,width,width*.4,0,0,Math.PI*2);context.stroke();
    }
    context.globalAlpha=1;
  }
  function paintSprite(sprite,p,direction,clock,isMoving){
    if(!sprite)return;
    const step=isMoving&&!reduced.matches?Math.floor(clock/125)%4:0,cell=sprite.frames[rowFor[direction]*4+step],w=cell.width*sprite.scale,h=cell.height*sprite.scale;
    context.fillStyle='rgba(38,53,49,.25)';context.beginPath();context.ellipse(p.x,p.y+2,w*.28,7,0,0,Math.PI*2);context.fill();
    context.drawImage(sprite.image,cell.x,cell.y,cell.width,cell.height,Math.round(p.x-w/2),Math.round(p.y-h),Math.round(w),Math.round(h));
  }
  const restorationRoutes=newLights.filter(stage=>stage<5).map(stage=>{
    const route=findRoute(world.doors[stage],world.doors[5],world),lengths=route.slice(1).map((p,i)=>distance(route[i],p));
    return {route,lengths,total:lengths.reduce((a,b)=>a+b,0)};
  });
  function paint(t){
    if(!scene)return;context.drawImage(scene,0,0);
    if(beforeScene&&!reduced.matches&&t-loadedAt<1100){
      context.save();context.globalAlpha=1-clamp((t-loadedAt)/1100,0,1);context.drawImage(beforeScene,0,0);context.restore();
    }else if(beforeScene)beforeScene=null;
    if(path.length){context.strokeStyle='rgba(255,244,182,.8)';context.lineWidth=5;context.setLineDash([8,12]);context.beginPath();context.moveTo(position.x,position.y);path.forEach(p=>context.lineTo(p.x,p.y));context.stroke();context.setLineDash([]);}
    if(goal&&path.length){context.strokeStyle='#fff5b1';context.lineWidth=4;context.setLineDash([6,6]);context.beginPath();context.ellipse(goal.x,goal.y,20,9,0,0,Math.PI*2);context.stroke();context.setLineDash([]);}
    const residents=world.doors.flatMap(door=>door.stage<5&&done[door.stage]?[{p:{x:door.resident.x,y:door.resident.y-(reduced.matches?0:Math.abs(Math.sin(t/480+door.stage))*5)},sprite:residentSprites[door.stage],direction:'down',resident:true}]:[]);
    const poses=updateEncounters();
    const characters=[...residents,{p:position,sprite:explorerSprite,direction:facing,pose:poses.hero},{p:bird,sprite:birdSprite,direction:birdFacing,pose:poses.ally}];
    characters.sort((a,b)=>a.p.y-b.p.y).forEach(actor=>{context.save();
      const pose=actor.pose,p=pose?{x:actor.p.x+pose.dx,y:actor.p.y}:actor.p;
      if(pose)context.filter=pose.kind==='hurt'?'sepia(.35) saturate(1.6)':'brightness(1.18)';
      paintSprite(actor.sprite,p,pose?(pose.direction<0?'left':'right'):actor.direction,pose?pose.frame*120:actor.resident?t*.5:walkClock,Boolean(pose)||actor.resident||moving,!actor.resident);context.restore();});
    paintDusk(t);paintBeacon(t);
    if(!reduced.matches&&t-loadedAt<4000)for(const {route,lengths,total} of restorationRoutes)for(let spark=0;spark<4;spark++){
      let offset=((t-loadedAt-spark*150)/3000)*total;if(offset<0||offset>total)continue;
      for(let i=0;i<lengths.length;i++){if(offset<=lengths[i]){const a=route[i],b=route[i+1],n=offset/lengths[i];glow(context,{x:a.x+(b.x-a.x)*n,y:a.y+(b.y-a.y)*n},18,.9);break;}offset-=lengths[i];}
    }
  }
  // Offer a resident only when the explorer stops nearby and the facility is restored.
  function updateNearby(){
    const door=world.doors.filter(d=>distance(position,d)<90).sort((a,b)=>distance(position,a)-distance(position,b))[0],nextNear=door?door.stage:null;
    if(nextNear!==near){near=nextNear;options.onNear?.(near);}
    const friend=destination===null&&view!=='overview'&&!moving?world.doors.find(d=>d.stage<5&&done[d.stage]&&distance(position,d.resident)<105)||null:null;
    if(friend!==chatting){
      chatting=friend;bubble.hidden=!friend;talk.hidden=!friend;
      if(friend){bubble.textContent=options.residentLine?.(friend.stage)||'';talk.textContent=options.residentLabel?.(friend.stage)||'주민과 대화하기';bubble.style.left=`${(friend.resident.x+(position.x<friend.resident.x?90:-90))/world.width*100}%`;bubble.style.top=`${(friend.resident.y-46)/world.height*100}%`;}
    }
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
      if(intent.x||intent.y||path.length)setView('follow');
      if(intent.x||intent.y){stopRoute();position=walkStep(position,intent,dt*205,world);}
      else if(path.length){let remaining=dt*205;while(path.length&&remaining>0){const target=path[0],d=distance(position,target);if(d<=remaining){position={...target};path.shift();remaining-=d;}else{position={x:position.x+(target.x-position.x)/d*remaining,y:position.y+(target.y-position.y)/d*remaining};remaining=0;}}}
      moving=distance(before,position)>.01;if(!path.length)goal=null;
      if(moving){
        facing=faceMovement(before,position);walkClock+=dt*1000;followBird(before);leaving=false;
        const steps=Math.floor(walkClock/320);if(steps!==stepCount){stepCount=steps;options.onStep?.();}
      }
      updateNearby();
      const arrivals=entered(position),requested=destination;
      if(arrivals.length&&(requested===null||arrivals.includes(requested))){arrive(requested??arrivals[0]);if(!active)return;}
      else if(!path.length&&requested!==null){arrive(requested);if(!active)return;}
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
      residentSprites=residentHue.map(hue=>{
        const sheet=document.createElement('canvas');sheet.width=birdImage.naturalWidth;sheet.height=birdImage.naturalHeight;
        const paper=sheet.getContext('2d');paper.filter=`hue-rotate(${hue}deg) saturate(1.15)`;paper.drawImage(birdImage,0,0);return {...birdSprite,image:sheet};
      });
      ready=true;loadedAt=performance.now();loading.hidden=true;canvas.dataset.ready='true';measure();paint(loadedAt);options.onLoad?.();
      if(destination!==null)startWalk(destination);
    }catch{
      if(!active||version!==loadVersion)return;
      if(options.onError){loading.hidden=true;clearInput();options.onError();return;}
      loading.replaceChildren(document.createTextNode('마을 그림을 불러오지 못했어. 탐구 기록은 그대로야. '));
      const retry=document.createElement('button');retry.type='button';retry.textContent='다시 불러오기';retry.addEventListener('click',load,{signal});loading.append(retry);
    }
  }
  function walk(stage){
    if(paused||!Number.isInteger(stage)||stage<0||stage>5||destination===stage)return false;
    clearInput();setDestination(stage);
    if(ready)startWalk(stage);return true;
  }
  function startWalk(stage){
    resumeFollow();
    const door=world.doors[stage];
    if(distance(position,door)<=door.radius||reduced.matches){position={x:door.x,y:door.y};entered(position);paint(performance.now());followCamera(true);arrive(stage);return;}
    path=findRoute(position,door,world).slice(1);goal={x:door.x,y:door.y};
  }
  function direction(dir,isPressed){
    if(!(dir in rowFor))return;
    if(!isPressed){screenDirections.delete(dir);return;}
    if(!ready||paused)return;resumeFollow();screenDirections.add(dir);stopRoute();
  }
  const editable=target=>target instanceof Element&&Boolean(target.closest('input,select,textarea,[contenteditable="true"],dialog'));
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||!active||!ready||paused||editable(event.target)||event.ctrlKey||event.altKey||event.metaKey)return;
    if(keys[event.code]){event.preventDefault();resumeFollow();pressedKeys.add(event.code);stopRoute();}
    else if((event.code==='Enter'||event.code==='Space')&&event.target===canvas){
      const nearest=world.doors.reduce((best,d)=>distance(position,d)<distance(position,best)?d:best,world.doors[0]);
      if(distance(position,nearest)<85){event.preventDefault();walk(nearest.stage);}
    }
  },{signal});
  document.addEventListener('keyup',event=>{if(keys[event.code]){pressedKeys.delete(event.code);event.preventDefault();}},{signal});
  viewport.addEventListener('pointerdown',event=>{
    if(!ready||paused||event.button!==0||event.target.closest('button'))return;
    if(!pointers.size)dragged=false;
    pointers.set(event.pointerId,pointerLocal(event));
    if(pointers.size===2){const at=pinched(),point=screenWorld(at.x,at.y);beginHand();grab=null;dragged=true;pinch={gap:at.gap,zoom:handZoom,point};for(const id of pointers.keys())capture(id);}
    else if(pointers.size===1&&view!=='overview')grab={id:event.pointerId,x:event.clientX,y:event.clientY,center:screenWorld(viewWidth/2,viewHeight/2)};
  },{signal});
  viewport.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)||paused)return;
    pointers.set(event.pointerId,pointerLocal(event));
    if(pinch&&pointers.size>=2){const at=pinched();setHandZoom(pinch.zoom*at.gap/pinch.gap,pinch.point,at);return;}
    if(grab?.id!==event.pointerId)return;
    const dx=event.clientX-grab.x,dy=event.clientY-grab.y;if(!dragged&&Math.hypot(dx,dy)<6)return;
    if(!dragged){const start=grab;beginHand();grab=start;dragged=true;capture(event.pointerId);viewport.classList.add('grabbing');}
    free={x:grab.center.x-dx/(worldWidth*handZoom),y:grab.center.y-dy/(worldHeight*handZoom)};followCamera(true);
  },{signal});
  const letGo=event=>{pointers.delete(event.pointerId);if(pointers.size<2)pinch=null;if(grab?.id===event.pointerId)grab=null;viewport.classList.remove('grabbing');};
  window.addEventListener('pointerup',letGo,{signal});viewport.addEventListener('pointercancel',letGo,{signal});viewport.addEventListener('lostpointercapture',letGo,{signal});
  viewport.addEventListener('wheel',event=>{
    if(!ready||paused||event.target.closest('button'))return;
    event.preventDefault();const at=pointerLocal(event),point=screenWorld(at.x,at.y);beginHand();setHandZoom(handZoom*Math.exp(-event.deltaY*.0015),point,at);
  },{passive:false,signal});
  // A drag never ends as a tap on a building label.
  viewport.addEventListener('click',event=>{if(!dragged)return;dragged=false;event.preventDefault();event.stopPropagation();},{signal,capture:true});
  canvas.addEventListener('click',event=>{
    if(view==='hand'||!ready||paused||event.button!==0)return;
    const rect=canvas.getBoundingClientRect(),target={x:(event.clientX-rect.left)/rect.width*world.width,y:(event.clientY-rect.top)/rect.height*world.height},door=buildingAt(target,world);
    canvas.focus({preventScroll:true});if(door){walk(door.stage);return;}
    clearInput();const road=nearestRoad(target,world);if(road&&road.distance<155){goal=canWalk(target,world)?target:{x:road.x,y:road.y};path=[...findRoute(position,road,world).slice(1),goal];}
  },{signal});
  updatePause();measure();load();frame=requestAnimationFrame(tick);
  return {walk,direction,setView,browse(next){clearInput();cancelGesture();setView(next,next==='follow'&&view==='overview');updateNearby();},nudge(dir){if(!ready||paused)return;resumeFollow();stopRoute();position=walkStep(position,directionVector(new Set([dir])),12,world);},pause(value=true){manualPause=Boolean(value);updatePause();},destroy(){active=false;encounters.destroy();loadVersion++;if(!leaving)visits.set(state,{...position});cancelAnimationFrame(frame);events.abort();observer.disconnect();resize?.disconnect();loading.remove();bubble.remove();talk.remove();}};
}
