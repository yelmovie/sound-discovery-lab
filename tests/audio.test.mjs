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
  // Like the Web Audio API, a scheduled stop before start is an error.
  start(time){this.starts.push(time);}stop(time){if(!this.starts.length&&time!==undefined)throw Error('InvalidStateError');this.stops.push(time);}
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
  createMediaElementSource(element){const n=new Node();n.element=element;return n;}
}
globalThis.AudioContext=Context;
class FakeAudio {
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;this.loop=false;this.dataset={};this.listeners=new Map();}
  play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}
  addEventListener(key,fn){this.listeners.set(key,fn);}
}
globalThis.Audio=FakeAudio;
const music=(sound,track)=>sound.music.get(track)?.element;
const playing=(sound,track)=>Boolean(music(sound,track)&&!music(sound,track).paused);
const level=sound=>sound.bgmBus.gain.events.at(-1).value;

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

test('the Suno main theme loops after the first gesture; BGM and effects keep independent switches',async()=>{
  const sound=new SoundEngine();
  try{
    sound.configure({bgm:true,sfx:false,bgmVolume:.25});assert.equal(sound.music.size,0);await sound.unlock();
    assert.ok(playing(sound,'main'));assert.equal(music(sound,'main').src,'/media/audio/bgm/main-theme.mp3');assert.equal(music(sound,'main').loop,true);
    assert.equal(sound.music.get('main').routed,true);assert.ok(Math.abs(level(sound)-.15)<1e-9);
    const before=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,before);
    sound.setScene('lesson');assert.ok(playing(sound,'main'));sound.setScene('map');assert.ok(playing(sound,'main'));
    sound.configure({bgm:false});assert.ok(!playing(sound,'main'));
    sound.configure({bgm:true,bgmVolume:0});assert.ok(!playing(sound,'main'));
  }finally{sound.destroy();}
});
test('experiment sounds silence the theme while they play; voices and concept films duck it to a quarter',async()=>{
  const sound=new SoundEngine();
  try{
    sound.configure({bgmVolume:.5});await sound.unlock();sound.setScene('lesson');assert.ok(Math.abs(level(sound)-.3)<1e-9);
    await sound.play({duration:.4});assert.equal(level(sound),0);assert.ok(playing(sound,'main'));
    sound.stop();assert.ok(Math.abs(level(sound)-.3)<1e-9);
    await sound.sequence([{frequency:260},{frequency:650}]);assert.equal(level(sound),0);sound.stop();
    sound.setQuiet(true);assert.ok(Math.abs(level(sound)-.075)<1e-9);assert.ok(playing(sound,'main'));sound.setQuiet(false);
    sound.setScene('concept');assert.ok(Math.abs(level(sound)-.075)<1e-9);
  }finally{sound.destroy();}
});
test('the finale plays once on the certificate and while the map finale is open, then the main theme returns',async()=>{
  const sound=new SoundEngine();
  try{
    await sound.unlock();sound.setScene('map');assert.ok(playing(sound,'main'));
    sound.setMapFinale(true);assert.ok(playing(sound,'finale'));assert.ok(!playing(sound,'main'));
    assert.equal(music(sound,'finale').src,'/media/audio/bgm/final-theme.mp3');assert.equal(music(sound,'finale').loop,false);
    music(sound,'finale').currentTime=40;sound.setMapFinale(false);assert.ok(playing(sound,'main'));assert.ok(!playing(sound,'finale'));
    sound.setScene('result');assert.ok(playing(sound,'finale'));assert.equal(music(sound,'finale').currentTime,0);
    music(sound,'finale').pause();music(sound,'finale').listeners.get('ended')();sound.setScene('result');assert.ok(!playing(sound,'finale'));assert.ok(!playing(sound,'main'));
    sound.setScene('home');assert.ok(playing(sound,'main'));
  }finally{sound.destroy();}
});
test('master mute pauses the theme and cancels effects',async()=>{
  const sound=new SoundEngine();
  try{
    await sound.unlock();await sound.play();sound.setMuted(true);
    assert.equal(sound.nodes.length,0);assert.ok(!playing(sound,'main'));
    const count=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,count);
    sound.setMuted(false);assert.ok(playing(sound,'main'));
  }finally{sound.destroy();}
});
test('hidden tab stops both channels and requires a fresh gesture before playback',async()=>{
  const listeners=new Map(),doc={hidden:false,addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key)};
  globalThis.document=doc;const sound=new SoundEngine();
  try{
    await sound.unlock();await sound.play();doc.hidden=true;listeners.get('visibilitychange')();
    assert.equal(sound.nodes.length,0);assert.ok(!playing(sound,'main'));assert.equal(sound.context.state,'suspended');
    doc.hidden=false;const count=sound.context.oscillators.length;await sound.play();assert.equal(sound.context.oscillators.length,count);
    assert.equal(sound.needsGesture,true);await sound.unlock();assert.equal(sound.needsGesture,false);assert.ok(playing(sound,'main'));
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

test('NPC narration quiet mode stops experiment sound and ducks the background theme',async()=>{
 const sound=new SoundEngine();try{
  await sound.unlock();await sound.play();sound.setQuiet(true);
  assert.equal(sound.nodes.length,0);assert.ok(playing(sound,'main'));assert.ok(Math.abs(level(sound)-.35*.6*.25)<1e-9);
  const count=sound.context.oscillators.length;await sound.play();sound.tone();
  assert.equal(sound.context.oscillators.length,count);sound.setQuiet(false);
  assert.ok(Math.abs(level(sound)-.35*.6)<1e-9);
 }finally{sound.destroy();}
});

test('instrument effects play one at a time with their own level, speed and fade',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();sound.configure({bgm:false});const urls=[];
 globalThis.fetch=async url=>{urls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:1.3});
  await sound.effect('swing');const swing=sound.nodes[0];
  sound.effectClock=0;await sound.effect('hit2');const hit=sound.nodes.at(-1);
  assert.deepEqual(urls,['/media/audio/sfx/su-drum-small-01.mp3','/media/audio/sfx/su-battle-hit-02.mp3']);
  assert.equal(swing.gain.gain.events.at(-1).kind,'linear');assert.equal(swing.gain.gain.events.at(-1).value,0);
  assert.equal(hit.source.playbackRate.events[0].value,1.19);assert.equal(hit.gain.gain.events[0].value,.34);
  assert.ok(hit.source.stops[0]<10.8,'long bell fades out at its max length');
  sound.effectClock=0;await sound.effect('hit2');assert.equal(sound.nodes.at(-1),hit,'the same cue does not repeat within 90 ms');
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});
test('polite cues wait out experiment sounds and the map finale fades a victory jingle',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();sound.configure({bgm:false});
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 try{await sound.ready();sound.context.decodeAudioData=async()=>({duration:2.2});
  await sound.play({duration:.6});const count=sound.nodes.length;
  await sound.effect('retry',{polite:true});assert.equal(sound.nodes.length,count);
  sound.stop();await sound.effect('victory');const jingle=sound.nodes[0];
  sound.setMapFinale(true);assert.equal(jingle.gain.gain.events.at(-1).value,0);assert.equal(sound.effectNode,null);
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});

test('map fight cues keep playing under a voice line while other effects stay out',async()=>{
 const previousFetch=globalThis.fetch,sound=new SoundEngine();sound.configure({bgm:false});
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 try{
  await sound.ready();sound.context.decodeAudioData=async()=>({duration:.5});
  await sound.effect('swing');const swing=sound.nodes[0];assert.equal(swing.effect,'swing');
  sound.setQuiet(true);
  assert.ok(sound.nodes.includes(swing),'a voice starting does not cut the swing');assert.equal(swing.source.connected,true);
  await new Promise(resolve=>setTimeout(resolve,100));
  await sound.effect('hit1');const hit=sound.nodes.find(n=>n.effect==='hit1');
  assert.ok(hit,'the hit cue plays during the voice');assert.ok(hit.source.starts.length===1);
  assert.ok(hit.gain.gain.events[0].value>=.34*.7,'at least 70% of its level');
  await new Promise(resolve=>setTimeout(resolve,100));
  await sound.effect('tap');assert.equal(sound.nodes.some(n=>n.effect==='tap'),false,'interface taps still wait for the voice');
  await new Promise(resolve=>setTimeout(resolve,100));
  await sound.effect('card-reveal');assert.equal(sound.nodes.some(n=>n.effect==='card-reveal'),false,'card cues are not fight cues');
  sound.setMuted(true);assert.equal(sound.nodes.length,0,'mute still silences fight cues');
 }finally{sound.destroy();globalThis.fetch=previousFetch;}
});
