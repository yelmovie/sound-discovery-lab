import test from 'node:test';
import assert from 'node:assert/strict';
import { runChallenge, challengeView, checkChallenge, cleanChallenge } from '../src/challenges.js';

function trial(id,initial={}){
  const w=initial,events=[];
  const sound={play:options=>events.push(['play',options]),sequence:notes=>events.push(['sequence',notes]),stop:()=>events.push(['stop'])};
  return {w,events,act:(action,value,round)=>runChallenge(id,w,action,{value,round},sound)};
}
const count=t=>t.w.challenge?.proof?.length||0;

test('finding a vibrating part requires observation and awards on the answer itself',()=>{
  const t=trial('parts');
  t.act('select',0);assert.equal(count(t),0);assert.match(t.w.challenge.message,/먼저/);
  t.act('listen');t.act('select',2);assert.equal(count(t),0);
  t.act('select',0);assert.equal(count(t),1);assert.equal(t.w.challenge.kind,'success');
  t.act('check');assert.equal(count(t),1);assert.equal(t.w.challenge.kind,'success');
  t.act('select',1);assert.equal(count(t),1,'the next object must be observed too');
});

test('rhythm ends on its last beat without cutting off the final experimental note',()=>{
  const t=trial('rhythm');
  t.act('ring');t.act('ring');t.act('ring');assert.equal(count(t),0);
  assert.match(t.w.challenge.message,/처음부터/);
  t.act('ring');assert.deepEqual(t.w.challenge.sequence,['울림']);
  t.act('rest');t.events.length=0;t.act('ring');
  assert.equal(count(t),1);
  assert.deepEqual(t.events,[['play',{frequency:520,kind:'fork',duration:.65}]]);
});

test('melody hearing remains required and a new note restarts a failed full melody',()=>{
  const t=trial('melody');
  t.act('note',18);assert.equal(count(t),0);assert.equal(t.w.challenge.sequence,undefined);
  t.act('listen');for(const n of [6,6,6])t.act('note',n);
  assert.equal(count(t),0);assert.match(t.w.challenge.message,/다른 음/);
  t.w.challenge=cleanChallenge(t.w.challenge);
  t.act('note',18);assert.deepEqual(t.w.challenge.sequence,[18]);
  t.act('note',12);t.events.length=0;t.act('note',6);
  assert.equal(count(t),1);
  assert.deepEqual(t.events,[['play',{frequency:650,level:.5,duration:.8}]]);
});

test('signal and mixer controls prepare silently and the performance submits once',()=>{
  const signal=trial('signal');signal.act('force',1);
  assert.deepEqual(signal.events,[]);assert.equal(count(signal),0);
  signal.act('strike');assert.equal(count(signal),1);assert.equal(signal.events.length,1);
  signal.act('strike',2);assert.equal(count(signal),1,'wrong strength is not awarded');
  signal.act('strike',3);assert.equal(count(signal),2,'drag strength also submits');
  const mix=trial('mix');mix.act('length',6);mix.act('force',1);
  assert.deepEqual(mix.events,[]);assert.equal(count(mix),0);
  mix.act('check');assert.equal(count(mix),1);assert.equal(mix.events.length,1);
});

test('listening selects the sound parcel and the last placement checks the order',()=>{
  const t=trial('sort');
  t.act('slot',0);assert.equal(count(t),0);assert.match(t.w.challenge.message,/먼저/);
  for(let n=0;n<3;n++){t.act('parcel',n);assert.equal(t.w.challenge.selected,n);t.act('slot',n);}
  assert.equal(count(t),0);assert.deepEqual(t.w.challenge.slots,[0,1,2]);
  t.act('parcel',0);t.act('slot',1);
  assert.equal(count(t),1,'moving an assigned parcel swaps it with the occupied slot');
  for(const [slot,parcel] of [2,1,0].entries()){t.act('select',parcel);t.act('slot',slot);}
  assert.equal(checkChallenge('sort',t.w.challenge),true,'drag selection also plays its parcel');
});

test('a placed sensor or connected story is checked immediately and stale events do nothing',()=>{
  for(const id of ['sensor','classify']){
    const t=trial(id);t.act('zone','water',0);assert.equal(count(t),0);
    t.act('zone','air',0);assert.equal(count(t),1);
    const snapshot=structuredClone(t.w.challenge),audioCount=t.events.length;
    t.act('zone','water',0);t.act('check',undefined,0);
    assert.deepEqual(t.w.challenge,snapshot);assert.equal(t.events.length,audioCount);
    t.act('zone','water',1);assert.equal(count(t),2);
  }
});

test('solution comparison needs both observations and invalidates hearing when the tool changes',()=>{
  const t=trial('solutions');
  t.act('solution','pad');t.act('after');assert.equal(count(t),0);
  t.act('before');assert.equal(count(t),1);
  t.act('before');t.act('solution','pad');t.act('after');assert.equal(count(t),1);
  t.act('solution','volume');assert.equal(t.w.challenge.after,false);
  t.act('before');assert.equal(count(t),1);
  t.events.length=0;t.act('after');assert.equal(count(t),2);
  assert.deepEqual(t.events,[['play',{kind:'drum',frequency:160,level:.2}]],'success preserves the improved scene sound');
});

test('festival completes on the final satisfied request and never on preview alone',()=>{
  const t=trial('festival');t.act('preview');assert.equal(count(t),0);
  t.act('music',1);t.act('pads');assert.equal(count(t),0);
  t.act('announcement',2);assert.equal(checkChallenge('festival',t.w.challenge),true);
  t.act('pads');assert.equal(count(t),1,'completed festival ignores repeated input');
});

test('stale perform and replay events cannot alter a new round or completed challenge',()=>{
  const t=trial('signal');t.act('strike',1,0);assert.equal(count(t),1);
  t.act('strike',3,0);assert.equal(count(t),1);
  t.act('replay',undefined,0);assert.equal(count(t),1);
  t.act('strike',3,1);t.act('strike',2,2);t.act('strike',1,3);
  assert.equal(checkChallenge('signal',t.w.challenge),true);
  t.act('replay',undefined,3);assert.equal(count(t),4);
  t.act('replay',undefined,4);assert.equal(count(t),0);
});

test('views carry round tokens on interaction targets and reserve submit for actual mixer playing',()=>{
  const h={button:(label,action,attrs='',cls='')=>`<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`,icon:()=>'',toolGraphic:()=>'',prop:()=>'',wave:()=>''};
  const ids=['parts','rhythm','signal','sort','melody','mix','sensor','classify','solutions','festival'];
  for(const id of ids){
    const html=challengeView(id,{challenge:{}},h);
    const targets=html.match(/<(?:button|input|div)\b[^>]*>/g).filter(tag=>/data-(?:action|drag-kind|drop-kind|challenge-param)=/.test(tag));
    for(const tag of targets)assert.match(tag,/data-round="0"/,id+': '+tag);
    assert.equal(html.includes('data-action="challenge-check"'),id==='mix',id);
  }
  const partHtml=challengeView('parts',{},h);
  assert.equal((partHtml.match(/data-action="challenge-listen"/g)||[]).length,1,'one direct object button');
  const parcelHtml=challengeView('sort',{},h);
  assert.equal((parcelHtml.match(/data-action="challenge-parcel"/g)||[]).length,3,'one listen-and-move button per parcel');
});
