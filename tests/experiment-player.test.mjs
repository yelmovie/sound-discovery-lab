import test from 'node:test';
import assert from 'node:assert/strict';
import { experimentPlan, createExperimentPlayer } from '../src/experiment-player.js';
import { lessons, legacyIndex } from '../src/data.js';
import { runChallenge } from '../src/challenges.js';
import { captureStrike } from '../src/progress.js';

function fakeClock(){
 let time=0,id=0;const jobs=new Map(),callbacks=[];
 return {
  now:()=>time,
  setTimer(fn,delay){const key=++id;jobs.set(key,{fn,at:time+delay});callbacks.push(fn);return key;},
  clearTimer:key=>jobs.delete(key),
  tick(ms){const end=time+ms;let count=0;while(true){const next=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;if(++count>100)throw Error('Unexpected timer loop');jobs.delete(next[0]);time=next[1].at;next[1].fn();}time=end;},
  pending:()=>jobs.size,
  callbacks
 };
}
const end=(state='waiting')=>({type:'end',state,message:'직접 골라 봐.',nextSelector:'.answer-group .choice'});
const step=(action,duration=1000)=>({type:'action',action,data:{},duration,message:action,selector:`[data-action="${action}"]`});
function setup(extra={}){
 const clock=fakeClock(),events=[],updates=[];let context='lesson/0|1';
 const player=createExperimentPlayer({perform:s=>events.push(s),onUpdate:s=>updates.push(s),getContext:()=>context,setTimer:clock.setTimer,clearTimer:clock.clearTimer,now:clock.now,...extra});
 return {clock,events,updates,player,setContext:value=>context=value};
}

test('all twenty observation plans are finite, finish locally and leave inputs untouched',()=>{
 const work={challenge:{proof:[],force:2},solutions:['pad'],currentCase:1};
 const evidence={[legacyIndex(2)]:{observation:{a:1,b:3}},[legacyIndex(8)]:{observation:{heard:true}}};
 const before=structuredClone({work,evidence});
 for(let i=0;i<lessons.length;i++){
  const plan=experimentPlan(i,work,evidence);
  assert.ok(plan.length>0&&plan.length<20,`lesson ${i}`);
  assert.equal(plan.at(-1).type,'end');
  for(const s of plan.slice(0,-1)){assert.ok(['action','range','preview'].includes(s.type));assert.ok(s.duration>0);assert.ok(s.message);assert.ok(s.selector);}
  assert.equal(plan.some(s=>['goto','continue','submit','restore'].includes(s.action)),false);
 }
 assert.deepEqual({work,evidence},before);
 assert.deepEqual(experimentPlan(-1),[]);
 assert.deepEqual(experimentPlan(20),[]);
});

test('legacy experiments observe instruments, compare forces and wait for the learner answer',()=>{
 const objects=experimentPlan(0);
 assert.deepEqual(objects.filter(s=>s.type==='action').map(s=>[s.action,s.data.tool]),[['instrument','rubber'],['instrument','ruler'],['instrument','drum'],['instrument','fork']]);
 assert.equal(objects.at(-1).state,'waiting');
 assert.deepEqual(experimentPlan(1).filter(s=>s.type==='action').map(s=>s.action),['fork-start','fork-stop']);
 const force=experimentPlan(4);
 assert.deepEqual(force.slice(0,-1).map(s=>s.type==='range'?[s.type,s.id,s.value]:[s.type,s.action]),[['range','force',1],['action','hit'],['range','force',3],['action','hit']]);
 assert.equal(force.at(-1).state,'complete');
 assert.deepEqual(experimentPlan(8).filter(s=>s.type==='range').map(s=>s.value),[18,12,6]);
 assert.deepEqual(experimentPlan(9).filter(s=>s.type==='action').map(s=>s.action),['target']);
 assert.deepEqual(experimentPlan(12).filter(s=>s.type==='action').map(s=>s.data.medium),['air','water','solid']);
});

test('dependent comparisons explain missing evidence and never manufacture it',()=>{
 for(const i of [5,17]){
  const plan=experimentPlan(i);
  assert.equal(plan.length,1);assert.equal(plan[0].type,'end');assert.equal(plan[0].state,'waiting');
  assert.match(plan[0].message,/먼저|기록/);
 }
 const evidence={[4]:{observation:{a:1,b:3}},[16]:{observation:{heard:true}}};
 assert.deepEqual(experimentPlan(5,{},evidence).filter(s=>s.type==='action').map(s=>s.data.slot),['a','b']);
 assert.deepEqual(experimentPlan(17,{solutions:[]},evidence).filter(s=>s.type==='action').map(s=>s.action),['noise-before']);
 assert.deepEqual(experimentPlan(17,{solutions:['pad']},evidence).filter(s=>s.type==='action').map(s=>s.action),['noise-before','noise-after']);
});

test('a replay preserves an existing A sample and leaves B at a different strength',()=>{
 for(const a of [1,2,3]){
  const w={a,b:3,force:2},plan=experimentPlan(4,w);
  for(const s of plan){if(s.type==='range')w.force=s.value;if(s.action==='hit')captureStrike(w,w.force);}
  assert.equal(w.a,a);assert.notEqual(w.b,a);
 }
});

test('challenge plans do not choose, submit, connect or perform a scored answer',()=>{
 const forbidden=new Set(['select','ring','rest','strike','note','check','zone','solution','pads','slot','force','length','music','announcement']);
 for(const [i,l] of lessons.entries()){
  if(!l.challenge)continue;
  const plan=experimentPlan(i,{challenge:{proof:[]}});
  for(const s of plan){
   if(s.type==='action'){assert.ok(s.action.startsWith('challenge-'));assert.equal(forbidden.has(s.action.slice(10)),false,`${l.challenge}: ${s.action}`);assert.equal(s.data.round,0);}
   assert.notEqual(s.type,'range',`${l.challenge} sliders must remain learner controlled`);
   if(s.type==='preview')assert.equal(s.action,undefined);
  }
  assert.equal(plan.at(-1).state,'waiting');
 }
 for(const id of ['rhythm','signal','mix','sensor','classify']){
  const i=lessons.findIndex(l=>l.challenge===id);
  assert.ok(experimentPlan(i).some(s=>s.type==='preview'),id);
 }
});

test('safe challenge observations retain the current round without replaying completed requests',()=>{
 const parts=lessons.findIndex(l=>l.challenge==='parts');
 const plan=experimentPlan(parts,{challenge:{proof:['0']}});
 assert.equal(plan[0].action,'challenge-listen');assert.equal(plan[0].data.round,1);
 const completed=experimentPlan(parts,{challenge:{proof:['0','1','2','1']}});
 assert.equal(completed.length,1);assert.equal(completed[0].state,'complete');
 const sort=lessons.findIndex(l=>l.challenge==='sort');
 assert.deepEqual(experimentPlan(sort).filter(s=>s.type==='action').map(s=>s.data.value),[0,1,2]);
 const solutions=lessons.findIndex(l=>l.challenge==='solutions');
 assert.deepEqual(experimentPlan(solutions).filter(s=>s.type==='action').map(s=>s.action),['challenge-before']);
 assert.deepEqual(experimentPlan(solutions,{challenge:{solution:'pad'}}).filter(s=>s.type==='action').map(s=>s.action),['challenge-before','challenge-after']);
});

test('automatic rhythm observation retains the restart cue for an interrupted performance',()=>{
 const i=lessons.findIndex(l=>l.challenge==='rhythm');
 for(const sounding of [false,true]){
  const w={challenge:{sequence:['울림'],sounding}},before=structuredClone(w);
  const cue=experimentPlan(i,w).at(-1);
  assert.equal(cue.nextSelector,'[data-action="challenge-clear"]');
  assert.match(cue.message,/다시 연주/);
  assert.deepEqual(w,before);
 }
 assert.match(experimentPlan(i,{challenge:{sequence:['울림','쉼'],sounding:false}}).at(-1).nextSelector,/challenge-ring.*challenge-rest/);
});

test('running every fresh challenge observation cannot award a proof or choose an answer',()=>{
 const sound={play(){},sequence(){},stop(){}};
 for(const [i,l] of lessons.entries()){
  if(!l.challenge)continue;
  const w={};
  for(const s of experimentPlan(i,w))if(s.type==='action')runChallenge(l.challenge,w,s.action.slice(10),s.data,sound);
  assert.equal(w.challenge?.proof?.length||0,0,l.challenge);
  assert.equal(w.challenge?.solution,undefined,l.challenge);
  assert.equal(w.challenge?.zone,undefined,l.challenge);
  assert.equal(w.challenge?.sequence,undefined,l.challenge);
  assert.equal(w.challenge?.pads,undefined,l.challenge);
 }
});

test('a learner-selected solution may finish through observation without choosing the next answer',()=>{
 const sound={play(){},sequence(){},stop(){}},i=lessons.findIndex(l=>l.challenge==='solutions');
 const selected={challenge:{proof:[],solution:'pad',before:false,after:false}};
 const plan=experimentPlan(i,selected);
 assert.equal(plan.some(s=>s.action==='challenge-solution'),false);
 for(const s of plan)if(s.type==='action')runChallenge('solutions',selected,s.action.slice(10),s.data,sound);
 assert.deepEqual(selected.challenge.proof,['pad']);
 assert.equal(selected.challenge.solution,undefined,'the existing validator resets only the completed round');
 assert.equal(selected.challenge.after,undefined,'old-round observation never spills into the next request');
 const wrong={challenge:{proof:[],solution:'volume'}};
 for(const s of experimentPlan(i,wrong))if(s.type==='action')runChallenge('solutions',wrong,s.action.slice(10),s.data,sound);
 assert.equal(wrong.challenge.solution,'volume','automatic observation does not replace a learner choice');
 assert.equal(wrong.challenge.proof.length,0);
});

test('learner-placed sound parcels may finish after listening without automatic placement',()=>{
 const sound={play(){},sequence(){},stop(){}},i=lessons.findIndex(l=>l.challenge==='sort');
 const w={challenge:{proof:[],slots:[1,0,2],listened:[]}};
 const plan=experimentPlan(i,w);assert.equal(plan.some(s=>s.action==='challenge-slot'),false);
 for(const s of plan)if(s.type==='action')runChallenge('sort',w,s.action.slice(10),s.data,sound);
 assert.deepEqual(w.challenge.proof,['1,2,3']);
 assert.equal(w.challenge.slots,undefined,'the existing validator resets the completed round without placing a new parcel');
});

test('player executes one finite plan and ends waiting without a route transition',()=>{
 const t=setup();t.player.start([step('first'),step('second',500),end()]);
 assert.equal(t.events.length,1);assert.equal(t.player.status().currentStep,1);assert.equal(t.player.status().total,2);
 t.clock.tick(999);assert.equal(t.events.length,1);
 t.clock.tick(1);assert.equal(t.events.length,2);
 t.clock.tick(500);assert.equal(t.player.status().state,'waiting');assert.equal(t.player.status().playing,false);assert.equal(t.player.status().waiting,true);
 assert.equal(t.player.status().nextSelector,'.answer-group .choice');assert.equal(t.clock.pending(),0);
 t.clock.tick(50000);assert.equal(t.events.length,2);
});

test('status reads and repeated render updates do not restart timers or expose mutable state',()=>{
 const t=setup();t.player.start([step('first'),step('second'),end()]);
 t.clock.tick(500);for(let i=0;i<50;i++){const s=t.player.status();s.speed=99;s.message='changed';}
 t.clock.tick(500);assert.equal(t.events.length,2);assert.equal(t.player.status().speed,1);
});

test('pause cancels the timer and start with no plan resumes the remaining observation time',()=>{
 const t=setup();t.player.start([step('first'),step('second'),end()]);
 t.clock.tick(250);t.player.pause();assert.equal(t.clock.pending(),0);assert.equal(t.player.status().state,'paused');
 t.clock.tick(5000);assert.equal(t.events.length,1);
 t.player.start();t.clock.tick(749);assert.equal(t.events.length,1);
 t.clock.tick(1);assert.equal(t.events.length,2);
});

test('changing speed rescales the remaining delay and never changes sound pitch or amplitude',()=>{
 const t=setup();const preview={type:'preview',sound:{frequency:650,level:.5,duration:.8,kind:'ruler'},visual:{challenge:{length:6}},selector:'.mix-device',duration:1000,message:'관찰해 봐.'};
 t.player.start([preview,end('complete')]);t.clock.tick(250);assert.equal(t.player.setSpeed(2),true);
 t.clock.tick(374);assert.equal(t.player.status().state,'playing');
 t.clock.tick(1);assert.equal(t.player.status().state,'complete');
 assert.deepEqual(t.events[0].sound,{frequency:650,level:.5,duration:.8,kind:'ruler'});
 for(const n of [.5,1,1.5,2]){assert.equal(t.player.setSpeed(n),true);assert.equal(t.player.status().speed,n);}
 assert.equal(t.player.setSpeed(3),false);assert.equal(t.player.status().speed,2);
});

test('a speed change also invalidates a timer callback that was already queued',()=>{
 const t=setup();t.player.start([step('first'),step('second'),end()]);
 const stale=t.clock.callbacks[0];t.clock.tick(200);t.player.setSpeed(2);stale();
 assert.deepEqual(t.events.map(s=>s.action),['first']);
 t.clock.tick(400);assert.deepEqual(t.events.map(s=>s.action),['first','second']);
});

test('stop invalidates queued callbacks and a later session cannot receive an older step',()=>{
 const t=setup();t.player.start([step('old-1'),step('old-2'),end()]);const stale=t.clock.callbacks[0];
 t.player.stop();assert.equal(t.player.status().state,'idle');assert.equal(t.clock.pending(),0);
 t.player.start([step('new-1'),end()]);stale();
 assert.deepEqual(t.events.map(s=>s.action),['old-1','new-1']);
 t.clock.tick(1000);assert.equal(t.player.status().state,'waiting');
});

test('a changed route or session token cancels before the next observation',()=>{
 const t=setup();t.player.start([step('first'),step('second'),end()]);t.setContext('lesson/1|2');t.clock.tick(1000);
 assert.deepEqual(t.events.map(s=>s.action),['first']);assert.equal(t.player.status().state,'idle');assert.equal(t.clock.pending(),0);
});

test('asynchronous performers carry a session guard and cannot resume after stop',async()=>{
 let resolve,meta;const pending=new Promise(done=>resolve=done);
 const t=setup({perform:(s,m)=>{meta=m;return pending;}});
 t.player.start([step('first'),step('second'),end()]);assert.equal(meta.isCurrent(),true);
 t.player.stop();assert.equal(meta.isCurrent(),false);resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(t.clock.pending(),0);assert.equal(t.player.status().state,'idle');
});

test('performer failures pause safely without issuing a second action',()=>{
 const t=setup({perform:()=>{throw Error('media failed');}});
 assert.doesNotThrow(()=>t.player.start([step('first'),step('second'),end()]));
 assert.equal(t.player.status().state,'paused');assert.equal(t.clock.pending(),0);
});

test('empty plans remain idle and terminal-only plans do not call the performer',()=>{
 const t=setup();assert.equal(t.player.start([]),false);assert.equal(t.player.status().state,'idle');
 t.player.start([end()]);assert.equal(t.events.length,0);assert.equal(t.player.status().state,'waiting');assert.equal(t.player.status().total,0);
});
