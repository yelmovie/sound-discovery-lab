import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, normalize, readState, writeState, canLesson, canRoute, checkLesson, recordEvidence, evidenceCount, stageDone, checkFinal, nextDiagnosisField, STORAGE_KEY } from '../src/model.js';
import { lessons, legacyIndex, LESSON_COUNT, finalTasks, stageLessons } from '../src/data.js';
import { runChallenge, checkChallenge, challengeRoundCount } from '../src/challenges.js';

const oldWork=[{seen:['rubber','fork'],choice:0},{started:true,stopped:true,choice:1},{a:1,b:3},{heardA:true,heardB:true,pairKey:'1,3',choice:1},{lengths:[18,6],choice:0},{targetHeard:true,pattern:[18,6,12]},{media:['air','water','solid'],choice:1},{verified:{0:'air',1:'water',2:'solid'}},{heard:true,place:'library',situation:'reading',person:'reader'},{solutions:['pad'],before:true,after:true,afterKey:'pad',choice:0}];
const sound={play(){},sequence(){},stop(){}};
const correctFinal=()=>Object.fromEntries(finalTasks.map((t,i)=>[i,t.answer]));
function complete(s,i,work){s.work[i]=structuredClone(work);assert.equal(recordEvidence(s,i).ok,true,'activity '+(i+1)+': '+lessons[i].title);}
function challengeWork(id){
  const w={},act=(action,value)=>runChallenge(id,w,action,{value},sound);
  if(id==='parts')for(const answer of [0,1,2,1]){act('listen');act('select',answer);}
  if(id==='rhythm')for(const length of [3,4,5]){for(let n=0;n<length;n++)act(n%2?'rest':'ring');}
  if(id==='signal')for(const force of [1,3,2,1]){act('force',force);act('strike');}
  if(id==='sort')for(const order of [[2,1,3],[3,2,1]]){
    for(let n=0;n<3;n++){act('parcel',order.indexOf(n+1));act('slot',n);}
  }
  if(id==='melody')for(const notes of [[18,12,6],[6,12,18],[12,6,18,12]]){act('listen');for(const note of notes)act('note',note);}
  if(id==='mix')for(const [length,force] of [[6,1],[18,3],[12,1],[6,3]]){act('length',length);act('force',force);act('check');}
  if(id==='sensor')for(const zone of ['air','water','solid'])act('zone',zone);
  if(id==='classify')for(const zone of ['air','water','solid','air','water','solid'])act('zone',zone);
  if(id==='solutions')for(const solution of ['pad','volume','time','place']){act('solution',solution);act('before');act('after');}
  if(id==='festival'){act('music',1);act('announcement',2);act('pads');}
  assert.equal(checkChallenge(id,w.challenge),true,id+': live rounds completed');
  assert.equal(w.challenge.proof.length,challengeRoundCount(id));return w;
}
function completeAll(s){for(let i=0;i<LESSON_COUNT;i++){const l=lessons[i];complete(s,i,l.challenge?challengeWork(l.challenge):oldWork[l.base]);}}
function memoryStorage(){const memory=new Map();return {memory,getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};}

test('twenty activities have four sequential phases per facility',()=>{
  assert.equal(LESSON_COUNT,20);
  for(let stage=0;stage<5;stage++)assert.deepEqual(stageLessons(stage).map(i=>lessons[i].phase),['관찰','비교','응용','의뢰']);
  assert.deepEqual(Array.from({length:10},(_,n)=>legacyIndex(n)),[0,1,4,5,8,9,12,13,16,17]);
});
test('new explorer enters only the first activity; invalid routes remain closed',()=>{
  const s=freshState();assert.equal(canLesson(s,0),true);for(let i=1;i<LESSON_COUNT;i++)assert.equal(canLesson(s,i),false);
  for(const route of ['lesson/-1','lesson/20','lesson/NaN','final','result','untrusted'])assert.equal(canRoute(s,route),false);
});
test('admin unlock never fabricates evidence, facility rewards or certification',()=>{
  const s=freshState();s.settings.admin=true;for(let i=0;i<LESSON_COUNT;i++)assert.equal(canLesson(s,i),true);
  assert.equal(canRoute(s,'result'),true);assert.equal(evidenceCount(s),0);for(let stage=0;stage<5;stage++)assert.equal(stageDone(s,stage),false);
  s.finalAnswers=correctFinal();assert.deepEqual(checkFinal(s),{ok:true,wrong:[],eligible:false});s.settings.admin=false;
  assert.equal(canRoute(s,'result'),false);assert.equal(canRoute(s,'final'),false);
});
test('every activity blocks empty work and incorrect science choices',()=>{
  const s=freshState();for(let i=0;i<LESSON_COUNT;i++)assert.equal(checkLesson(s,i).ok,false,'activity '+i);
  s.work[0]={seen:['rubber','rubber'],choice:0};assert.equal(checkLesson(s,0).ok,false);
  s.work[0]={seen:['rubber','fork'],choice:1};assert.equal(checkLesson(s,0).ok,false);
  s.work[1]={started:true,choice:1};assert.equal(checkLesson(s,1).ok,false);
});
test('A/B compares the actual pair and retains the original comparison snapshot',()=>{
  const s=freshState(),a=legacyIndex(2),b=legacyIndex(3);s.work[a]={a:2,b:2};assert.equal(checkLesson(s,a).ok,false);
  complete(s,a,{a:3,b:1});s.work[b]={heardA:true,heardB:true,pairKey:'3,1',choice:1};assert.equal(checkLesson(s,b).ok,false);
  s.work[b].choice=0;assert.equal(recordEvidence(s,b).ok,true);assert.equal(s.evidence[b].observation.pair.a,3);
  complete(s,a,{a:1,b:3});assert.equal(checkLesson(s,b).ok,false);assert.equal(s.evidence[b].observation.pair.a,3);
  const saved=normalize(s);assert.equal(saved.evidence[b].observation.pair.a,3);assert.equal(saved.evidence[a].observation.a,1);
});
test('length, melody and transfer require meaningful experiment evidence',()=>{
  const s=freshState();for(const [base,work] of [[4,{lengths:[18,18],choice:0}],[5,{targetHeard:true,pattern:[6,18,12]}],[6,{media:['air','water'],choice:1}],[7,{verified:{0:'air',1:'solid',2:'solid'}}]]){
    s.work[legacyIndex(base)]=work;assert.equal(checkLesson(s,legacyIndex(base)).ok,false);
  }
});
test('noise comparison requires diagnosis and fresh hearing for the selected solution',()=>{
  const s=freshState(),a=legacyIndex(8),b=legacyIndex(9);s.work[b]=structuredClone(oldWork[9]);assert.equal(checkLesson(s,b).ok,false);
  complete(s,a,oldWork[8]);assert.equal(checkLesson(s,b).ok,true);s.work[b].solutions=['time'];assert.equal(checkLesson(s,b).ok,false);
  s.work[b].afterKey='time';assert.equal(checkLesson(s,b).ok,true);s.work[b].choice=1;assert.equal(checkLesson(s,b).ok,false);
});
test('diagnosis retry points to each incorrect field after all choices are made',()=>{
  const correct={heard:true,place:'library',situation:'reading',person:'reader'};
  assert.equal(nextDiagnosisField({}).key,'place');
  assert.equal(nextDiagnosisField({place:'field'}).key,'situation');
  for(const [key,wrong] of [['place','field'],['situation','festival'],['person','drummer']]){
    const work={...correct,[key]:wrong},s=freshState();s.work[legacyIndex(8)]=work;
    assert.equal(nextDiagnosisField(work).key,key);
    assert.equal(checkLesson(s,legacyIndex(8)).ok,false);
  }
  assert.equal(nextDiagnosisField(correct),undefined);
  const s=freshState();s.work[legacyIndex(8)]=correct;
  assert.equal(checkLesson(s,legacyIndex(8)).ok,true);
});
test('additional activities require all live rounds and survive storage',()=>{
  for(let i=0;i<LESSON_COUNT;i++)if(lessons[i].challenge){
    const s=freshState(),work=challengeWork(lessons[i].challenge);complete(s,i,work);const saved=normalize(JSON.parse(JSON.stringify(s)));
    assert.ok(saved.evidence[i],lessons[i].challenge);s.work[i].challenge.proof.pop();assert.equal(checkLesson(s,i).ok,false);
    assert.equal(saved.evidence[i].observation.challenge.proof.length,challengeRoundCount(lessons[i].challenge));
  }
});
test('the twenty-activity path unlocks successors and rewards only complete facilities',()=>{
  const s=freshState();for(let i=0;i<LESSON_COUNT;i++){
    assert.equal(canLesson(s,i),true);if(i+1<LESSON_COUNT)assert.equal(canLesson(s,i+1),false);
    const l=lessons[i];complete(s,i,l.challenge?challengeWork(l.challenge):oldWork[l.base]);
    assert.equal(evidenceCount(s),i+1);assert.equal(stageDone(s,l.stage),i%4===3);
  }
  assert.equal(canRoute(s,'final'),true);assert.equal(checkFinal(s).ok,false);s.finalAnswers=correctFinal();assert.deepEqual(checkFinal(s),{ok:true,wrong:[],eligible:true});
  s.restored=true;s.completedAt='2026-10-22T00:00:00.000Z';s.lastRoute='result';const saved=normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(saved.restored,true);assert.equal(saved.lastRoute,'result');assert.equal(evidenceCount(saved),20);
});
test('v1 migration preserves ten original observations and withholds certification for new activities',()=>{
  const original={version:1,work:Object.fromEntries(oldWork.map((w,i)=>[i,w])),evidence:{},settings:{muted:true,admin:false},lastRoute:'lesson/7',restored:true,completedAt:'2026-10-15T09:00:00.000Z',finalAnswers:correctFinal()};
  for(let i=0;i<10;i++)original.evidence[i]={observation:structuredClone(oldWork[i]),at:'2026-10-15T08:00:00.000Z'};
  original.evidence[3].observation.pair=structuredClone(oldWork[2]);const storage=memoryStorage();storage.setItem(STORAGE_KEY,JSON.stringify(original));const {state:s}=readState(storage);
  assert.equal(s.version,2);assert.equal(evidenceCount(s),10);assert.equal(s.lastRoute,'lesson/'+legacyIndex(7));assert.equal(s.restored,false);assert.equal(s.completedAt,null);
  assert.equal(s.previousCompletion,original.completedAt);assert.equal(canRoute(s,'final'),false);assert.equal(canRoute(s,'result'),false);assert.equal(stageDone(s,0),false);
  assert.equal(canLesson(s,2),true);assert.equal(canLesson(s,3),false);assert.equal(s.settings.muted,true);
  assert.equal(storage.getItem(STORAGE_KEY+'-backup-v1'),JSON.stringify(original));const backup=storage.getItem(STORAGE_KEY+'-backup-v1');readState(storage);assert.equal(storage.getItem(STORAGE_KEY+'-backup-v1'),backup);
});
test('saved work preserves empty sorting positions and never resumes an oscillator',()=>{
  const s=freshState();s.work[7]={challenge:{slots:[undefined,2,undefined],selected:1,listened:[2],sounding:true}};
  const saved=normalize(JSON.parse(JSON.stringify(s)));assert.deepEqual(saved.work[7].challenge.slots,[null,2,null]);assert.equal(saved.work[7].challenge.selected,1);assert.equal(saved.work[7].challenge.sounding,false);
});
test('malformed values cannot fabricate completion; sound preferences stay bounded',()=>{
  assert.deepEqual(normalize({version:99}),freshState());
  const s=normalize({version:2,settings:{admin:'true',bgm:false,sfx:false,bgmVolume:999},work:{0:{seen:'broken',choice:'0'}},evidence:{0:{summary:'fake',observation:{}}},lastRoute:'lesson/16',restored:true});
  assert.equal(s.settings.admin,false);assert.equal(s.settings.bgm,false);assert.equal(s.settings.sfx,false);assert.equal(s.settings.bgmVolume,100);
  assert.equal(evidenceCount(s),0);assert.equal(s.lastRoute,'home');assert.deepEqual(s.work[0].seen,[]);assert.equal(s.restored,false);
  assert.equal(normalize({version:2,settings:{bgmVolume:23}}).settings.bgmVolume,25);assert.equal(normalize({version:2,settings:{bgmVolume:-1}}).settings.bgmVolume,0);
  const completed=freshState();completeAll(completed);completed.finalAnswers=correctFinal();completed.restored=true;completed.completedAt='invalid';assert.equal(normalize(completed).restored,false);
});
test('storage denied or corrupt returns usable state and an honest warning',()=>{
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};assert.notEqual(readState(denied).warning,'');assert.equal(writeState(denied,freshState()),false);
  assert.equal(readState({getItem(){return '{invalid';}}).state.version,2);const storage=memoryStorage();assert.equal(writeState(storage,freshState()),true);assert.ok(storage.memory.has(STORAGE_KEY));assert.equal(readState(storage).warning,'');
});

test('successful signal, tuning and sensor trials preserve the requested experimental sound',()=>{
  const cases=[
    {id:'signal',rounds:[1,3,2,1].map(force=>({controls:[['force',force]],commit:['strike'],sound:{kind:'drum',frequency:150,level:force/3,duration:.7}}))},
    {id:'mix',rounds:[[6,1,650],[18,3,260],[12,1,390],[6,3,650]].map(([length,force,frequency])=>({controls:[['length',length],['force',force]],commit:['check'],sound:{frequency,level:force/3,duration:.8}}))},
    {id:'sensor',rounds:['air','water','solid'].map(zone=>({controls:[],commit:['zone',zone],sound:{kind:zone==='air'?'drum':zone==='water'?'fork':'solid',frequency:zone==='air'?150:440,level:.4}}))}
  ];
  for(const scenario of cases){
    const w={},events=[],spy={play:options=>events.push(['play',options]),stop:()=>events.push(['stop']),sequence:notes=>events.push(['sequence',notes])};
    for(const [index,round] of scenario.rounds.entries()){
      for(const [action,value] of round.controls)runChallenge(scenario.id,w,action,{value},spy);
      events.length=0;runChallenge(scenario.id,w,round.commit[0],{value:round.commit[1]},spy);
      assert.equal(w.challenge.proof.length,index+1,scenario.id+': success recorded');
      assert.deepEqual(events,[['play',round.sound]],scenario.id+': no success chime or stop cancels the experimental tone');
    }
    assert.equal(checkChallenge(scenario.id,w.challenge),true);
  }
});
