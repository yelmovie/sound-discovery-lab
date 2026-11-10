import test from 'node:test';
import assert from 'node:assert/strict';
import {createVoice,voiceLines,voiceFor,voiceAssets} from '../src/voice.js';
const wait=()=>new Promise(resolve=>setTimeout(resolve,5));
function harness(){
 const instances=[],quiet=[],listeners={};let enabled=true;
 const old={Audio:globalThis.Audio,document:globalThis.document,window:globalThis.window};
 globalThis.Audio=class{constructor(src){this.src=src;this.paused=true;instances.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(k){delete this[k];}load(){}finish(){this.paused=true;this.onended?.();}};
 globalThis.document={hidden:false,addEventListener:(name,fn)=>listeners[name]=fn};globalThis.window={addEventListener:(name,fn)=>listeners[name]=fn};
 const voice=createVoice({enabled:()=>enabled,quiet:v=>quiet.push(v)});
 return{voice,instances,quiet,listeners,mute:()=>enabled=false,restore:()=>{voice.stop();Object.assign(globalThis,old);}};
}
test('voice catalog has 29 unique local lines and exact caption lookup',()=>{assert.equal(Object.keys(voiceLines).length,29);assert.equal(new Set(voiceAssets).size,29);assert(voiceAssets.every(p=>/^media\/audio\/voices\/[a-z0-9-]+\.mp3$/.test(p)));for(const[id,line]of Object.entries(voiceLines))assert.equal(voiceFor(line.text),id);assert.equal(voiceFor('not a caption'),null);});
test('voice queue plays sequentially and restores other sound at its end',async()=>{const h=harness();try{h.voice.say(['story-1','story-2']);await wait();assert.equal(h.voice.playing,'story-1');h.instances[0].finish();assert.equal(h.voice.playing,'story-2');assert(h.instances[0].paused);h.instances[1].finish();assert.equal(h.voice.playing,null);assert.equal(h.quiet.at(-1),false);}finally{h.restore();}});
test('a new line cancels the previous line and queue',async()=>{const h=harness();try{h.voice.say(['story-1','story-2']);await wait();h.voice.say('title-bubble');await wait();assert.equal(h.voice.playing,'title-bubble');assert(h.instances[0].paused);h.instances.at(-1).finish();assert.equal(h.voice.playing,null);assert.equal(h.instances.length,2);}finally{h.restore();}});
test('muted or hidden state cannot start narration',async()=>{const h=harness();try{h.mute();h.voice.say('story-1');await wait();assert.equal(h.instances.length,0);assert.equal(h.voice.playing,null);}finally{h.restore();}const h2=harness();try{document.hidden=true;h2.voice.say('story-1');await wait();assert.equal(h2.instances.length,0);}finally{h2.restore();}});
test('hiding the page or stopping clears queued voice and releases quiet state',async()=>{const h=harness();try{h.voice.say(['story-1','story-2']);await wait();document.hidden=true;h.listeners.visibilitychange();assert(h.instances[0].paused);assert.equal(h.voice.playing,null);assert.equal(h.quiet.at(-1),false);await wait();assert.equal(h.instances.length,1);}finally{h.restore();}});
test('explicit stop cancels delayed narration',async()=>{const h=harness();try{h.voice.say('story-1',15);h.voice.stop();await new Promise(resolve=>setTimeout(resolve,25));assert.equal(h.instances.length,0);assert.equal(h.quiet.at(-1),false);}finally{h.restore();}});
