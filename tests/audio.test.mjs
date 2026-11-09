import test from 'node:test';
import assert from 'node:assert/strict';
import { SoundEngine } from '../src/audio.js';

class Param {
  constructor(){this.events=[];this.value=0;}
  setValueAtTime(value,time){this.events.push({kind:'set',value,time});}
  linearRampToValueAtTime(value,time){this.events.push({kind:'linear',value,time});}
  exponentialRampToValueAtTime(value,time){this.events.push({kind:'exponential',value,time});}
  setTargetAtTime(value,time,constant){this.events.push({kind:'target',value,time,constant});}
}
class Node {
  constructor(){this.frequency=new Param();this.playbackRate=new Param();this.gain=new Param();this.starts=[];this.stops=[];this.connected=false;}
  connect(){this.connected=true;}disconnect(){this.connected=false;}
  start(time){this.starts.push(time);}stop(time){this.stops.push(time);}
}
class Context {
  constructor(){this.state='running';this.currentTime=10;this.sampleRate=8000;this.destination={};this.oscillators=[];this.gains=[];this.noises=[];}
  createOscillator(){const n=new Node();this.oscillators.push(n);return n;}
  createGain(){const n=new Node();this.gains.push(n);return n;}
  createBuffer(channels,count){const data=new Float32Array(count);return {getChannelData:()=>data};}
  createBufferSource(){const n=new Node();this.noises.push(n);return n;}
  async resume(){this.state='running';}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
}
globalThis.AudioContext=Context;

test('downloaded UI effects honor mute and clean up their buffer sources',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();sound.configure({bgm:false});
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 try{await sound.ready();sound.context.decodeAudioData=async()=>({sample:true});await sound.effect('drop');assert.equal(sound.nodes.length,1);const source=sound.nodes[0].source;sound.setMuted(true);assert.equal(sound.nodes.length,0);assert.equal(source.connected,false);}finally{sound.destroy();globalThis.fetch=previousFetch;}
});
test('a delayed sample download cannot restart sound after leaving a screen',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();sound.configure({bgm:false});let resolveFetch;
 globalThis.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});
 try{await sound.ready();sound.context.decodeAudioData=async()=>({sample:true});const pending=sound.effect('success');for(let n=0;n<8&&!resolveFetch;n++)await Promise.resolve();assert.ok(resolveFetch);sound.stop();resolveFetch({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await pending;assert.equal(sound.nodes.length,0);}finally{sound.destroy();globalThis.fetch=previousFetch;}
});

test('force changes amplitude without changing initial pitch; peaks remain capped',async()=>{const sound=new SoundEngine();await sound.play({kind:'drum',frequency:150,level:1/3});const first=sound.context.gains[0].gain.events.find(e=>e.kind==='linear').value;await sound.play({kind:'drum',frequency:150,level:1});const second=sound.context.gains[2].gain.events.find(e=>e.kind==='linear').value;assert.ok(second>first);assert.ok(second<=.23);assert.equal(sound.context.oscillators[0].frequency.events[0].value,150);assert.equal(sound.context.oscillators[1].frequency.events[0].value,150);});
test('replacement and mute stop and disconnect previous sounds',async()=>{const sound=new SoundEngine();await sound.play({frequency:260});const old=sound.nodes[0];await sound.play({frequency:650});assert.equal(old.source.connected,false);assert.ok(old.source.stops.includes(undefined));assert.equal(sound.nodes.length,1);sound.setMuted(true);assert.equal(sound.nodes.length,0);const count=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,count);});
test('patterns schedule three distinct notes and stop cancels even future notes',async()=>{const sound=new SoundEngine();await sound.sequence([{frequency:260},{frequency:650},{frequency:390}]);assert.deepEqual(sound.context.oscillators.map(o=>o.frequency.events[0].value),[260,650,390]);assert.deepEqual(sound.context.oscillators.map(o=>o.starts[0]),[10,10.62,11.24]);const nodes=[...sound.nodes];sound.stop();assert.ok(nodes.every(n=>n.source.stops.includes(undefined)&&!n.source.connected));});
test('a pending audio resume cannot resurrect sound after navigating or muting',async()=>{const sound=new SoundEngine();sound.context=new Context();sound.context.state='suspended';let resume;sound.context.resume=()=>new Promise(resolve=>{resume=()=>{sound.context.state='running';resolve();};});const pending=sound.play();sound.stop();resume();await pending;assert.equal(sound.context.oscillators.length,0);});
test('unavailable audio reports a helpful status instead of an unhandled rejection',async()=>{const sound=new SoundEngine();sound.context=new Context();sound.context.state='suspended';sound.context.resume=async()=>{throw Error('blocked');};let status;sound.onStatus=s=>{status=s;};await sound.play();assert.match(status,/기기의 소리 설정/);assert.equal(sound.nodes.length,0);});

test('BGM and effects have independent switches; experiments pause background music',async()=>{
  const sound=new SoundEngine();
  try{
    sound.configure({bgm:true,sfx:false,bgmVolume:.25});await sound.unlock();
    assert.equal(sound.bgmNodes.length,5);assert.equal(sound.bgmBus.gain.events.at(-1).value,.25);
    const before=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,before);
    sound.configure({sfx:true});await sound.play();assert.equal(sound.nodes.length,1);assert.equal(sound.bgmNodes.length,5);
    sound.setScene('lesson');assert.equal(sound.bgmNodes.length,0);assert.equal(sound.bgmTimer,null);
    await sound.play();assert.equal(sound.nodes.length,1);sound.setScene('map');assert.equal(sound.bgmNodes.length,5);
    sound.configure({bgm:false});assert.equal(sound.bgmNodes.length,0);assert.equal(sound.nodes.length,1);
  }finally{sound.destroy();}
});
test('master mute cancels both channels including scheduled background notes',async()=>{
  const sound=new SoundEngine();
  try{
    await sound.unlock();await sound.play();const bgm=[...sound.bgmNodes];sound.setMuted(true);
    assert.equal(sound.nodes.length,0);assert.equal(sound.bgmNodes.length,0);assert.equal(sound.bgmTimer,null);
    assert.ok(bgm.every(n=>n.source.stops.includes(undefined)&&!n.source.connected));
    const count=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,count);
    sound.setMuted(false);assert.equal(sound.bgmNodes.length,5);
  }finally{sound.destroy();}
});
test('hidden tab stops both channels and requires a fresh gesture before playback',async()=>{
  const listeners=new Map(),doc={hidden:false,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  globalThis.document=doc;const sound=new SoundEngine();
  try{
    await sound.unlock();await sound.play();doc.hidden=true;listeners.get('visibilitychange')();
    assert.equal(sound.nodes.length,0);assert.equal(sound.bgmNodes.length,0);assert.equal(sound.context.state,'suspended');
    doc.hidden=false;const count=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,count);
    assert.equal(sound.needsGesture,true);await sound.unlock();assert.equal(sound.needsGesture,false);assert.equal(sound.bgmNodes.length,5);
  }finally{sound.destroy();delete globalThis.document;}
  assert.equal(listeners.size,0);
});

test('recorded drum uses the same cached sample and pitch for every striking force',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();let downloads=0;
 globalThis.fetch=async()=>{downloads++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:1.5});
  await sound.play({kind:'drum',frequency:150,level:1/3});const first=sound.nodes[0];
  await sound.play({kind:'drum',frequency:150,level:1});const second=sound.nodes[0];
  assert.equal(downloads,1);assert.equal(first.source.buffer,second.source.buffer);
  assert.equal(first.source.playbackRate.events[0].value,1);assert.equal(second.source.playbackRate.events[0].value,1);
  assert.ok(second.gain.gain.events[1].value>first.gain.gain.events[1].value);
  assert.equal(first.source.connected,false);assert.equal(sound.context.oscillators.length,0);
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});
test('recorded ruler changes pitch with playback rate while preserving requested level',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:1.1});
  await sound.play({kind:'ruler',frequency:260,level:.5});const low=sound.nodes[0];
  await sound.play({kind:'ruler',frequency:650,level:.5});const high=sound.nodes[0];
  assert.equal(low.source.buffer,high.source.buffer);assert.equal(low.source.playbackRate.events[0].value,1);assert.equal(high.source.playbackRate.events[0].value,2.5);
  assert.equal(low.gain.gain.events[1].value,high.gain.gain.events[1].value);
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});
test('delayed instrument decoding cannot play after leaving or muting',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();let finish;
 globalThis.fetch=()=>new Promise(resolve=>{finish=resolve;});
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:1.1});const pending=sound.play({kind:'ruler'});
  for(let i=0;i<12&&!finish;i++)await Promise.resolve();assert.ok(finish);sound.setMuted(true);
  finish({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await pending;assert.equal(sound.nodes.length,0);assert.equal(sound.context.oscillators.length,0);
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});
test('recorded melody shares its buffer and cancels every scheduled note on stop',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();let downloads=0;
 globalThis.fetch=async()=>{downloads++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:1.1});
  await sound.sequence([{frequency:260},{frequency:650},{frequency:390}]);assert.equal(downloads,1);
  assert.deepEqual(sound.nodes.map(e=>e.source.starts[0]),[10,10.62,11.24]);const notes=[...sound.nodes];sound.stop();
  assert.ok(notes.every(e=>!e.source.connected&&e.source.stops.includes(undefined)));
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});
test('missing recorded file falls back to an audible synthesized experiment',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();globalThis.fetch=async()=>({ok:false});
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:1.1});await sound.play({kind:'ruler',frequency:390});
  assert.equal(sound.context.oscillators.length,1);assert.equal(sound.context.oscillators[0].frequency.events[0].value,390);
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});

test('NPC narration quiet mode stops and gates experiment and background sound',async()=>{
 const sound=new SoundEngine();try{
  await sound.unlock();await sound.play();sound.setQuiet(true);
  assert.equal(sound.nodes.length,0);assert.equal(sound.bgmNodes.length,0);
  const count=sound.context.oscillators.length;await sound.play();sound.tone();
  assert.equal(sound.context.oscillators.length,count);sound.setQuiet(false);
  assert.equal(sound.bgmNodes.length,5);
 }finally{sound.destroy();}
});
