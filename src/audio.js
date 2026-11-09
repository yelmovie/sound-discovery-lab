import { interfaceSounds } from './data.js';
import { instrumentSamples } from './samples.js';
const bgmScenes=new Set(['home','map','result']);
const effectKinds=new Set(['ui','success','feedback']);
const bounded=(value,min,max,fallback)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;

export class SoundEngine {
  constructor(){
    this.context=null;this.nodes=[];this.generation=0;this.muted=false;this.onStatus=()=>{};
    this.bgm=true;this.sfx=true;this.bgmVolume=.35;this.scene='home';
    this.quiet=false;this.unlocked=false;this.needsGesture=false;this.destroyed=false;
    this.bgmNodes=[];this.bgmGeneration=0;this.bgmTimer=null;this.bgmBus=null;
    this.buffers=new Map();this.effectClock=0;
    this.visibilityHandler=()=>{
      if(typeof document!=='undefined'&&document.hidden){
        this.needsGesture=true;this.stop();this.stopBgm();
        if(this.context?.state==='running')this.context.suspend().catch(()=>{});
      }
    };
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.visibilityHandler);
  }
  configure(settings={}){
    const wasMuted=this.muted,wasSfx=this.sfx;
    for(const key of ['muted','bgm','sfx'])if(typeof settings[key]==='boolean')this[key]=settings[key];
    if(Number.isFinite(settings.bgmVolume))this.bgmVolume=bounded(settings.bgmVolume,0,1,.35);
    if(this.muted!==wasMuted||wasSfx&&!this.sfx)this.stop();
    this.syncBgm();
  }
  setQuiet(value){this.quiet=Boolean(value);if(this.quiet)this.stop();this.syncBgm();}
  setMuted(value){this.configure({muted:Boolean(value)});}
  setScene(scene){this.scene=scene;this.syncBgm();}
  async unlock(){
    if(this.destroyed||typeof document!=='undefined'&&document.hidden)return false;
    this.unlocked=true;this.needsGesture=false;
    if(this.muted)return false;
    const ready=await this.ready();if(ready)this.syncBgm();return ready;
  }
  stop(){
    this.generation++;
    for(const entry of this.nodes)this.disconnect(entry);
    this.nodes=[];
    this.onStatus(this.muted||!this.sfx?'소리 꺼짐 · 떨림을 눈으로 관찰해 봐':'소리 준비됨');
  }
  disconnect({source,gain}){
    source.onended=null;
    try{source.stop();}catch{}
    try{source.disconnect();gain.disconnect();}catch{}
  }
  async ready(){
    if(this.destroyed||this.quiet||this.muted||this.needsGesture||typeof document!=='undefined'&&document.hidden)return false;
    try{
      if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;this.context=new Audio();}
      if(this.context.state==='suspended')await this.context.resume();
      if(this.destroyed||this.quiet||this.muted||this.needsGesture||typeof document!=='undefined'&&document.hidden)return false;
      if(this.context.state!=='running')throw Error('Audio unavailable');
      return true;
    }catch{this.onStatus('소리를 시작하지 못했어 · 기기의 소리 설정을 확인해 줘');return false;}
  }
  tone({frequency=440,level=.4,duration=1.1,kind='ruler',delay=0}={}){
    if(!this.context||this.context.state!=='running'||this.quiet||this.muted||!this.sfx||this.needsGesture||this.destroyed)return;
    const c=this.context,start=c.currentTime+bounded(delay,0,30,0),length=bounded(duration,.04,15,1.1);
    const osc=c.createOscillator(),gain=c.createGain();osc.type=kind==='rubber'?'triangle':'sine';
    const pitch=bounded(frequency,40,10000,440);osc.frequency.setValueAtTime(pitch,start);
    if(kind==='drum')osc.frequency.exponentialRampToValueAtTime(pitch*.58,start+.22);
    const peak=Math.max(.001,bounded(level,0,1,.4)*(effectKinds.has(kind)?.025:.23));
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(peak,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    osc.connect(gain);gain.connect(c.destination);osc.start(start);osc.stop(start+length+.03);
    const entry={source:osc,gain};this.nodes.push(entry);
    osc.onended=()=>{
      osc.disconnect();gain.disconnect();this.nodes=this.nodes.filter(n=>n!==entry);
      if(!this.nodes.length)this.onStatus(this.muted||!this.sfx?'소리 꺼짐':'재생 끝');
    };
    if(kind==='drum'){
      const count=Math.floor(c.sampleRate*.12),buffer=c.createBuffer(1,count,c.sampleRate),samples=buffer.getChannelData(0);
      for(let i=0;i<count;i++)samples[i]=(Math.random()*2-1)*(1-i/count);
      const noise=c.createBufferSource(),ng=c.createGain();noise.buffer=buffer;ng.gain.value=peak*.18;
      noise.connect(ng);ng.connect(c.destination);noise.start(start);
      const ne={source:noise,gain:ng};this.nodes.push(ne);noise.onended=()=>{noise.disconnect();ng.disconnect();this.nodes=this.nodes.filter(n=>n!==ne);};
    }
  }
  async play(options={}){
    this.stop();const generation=this.generation;
    if(!this.sfx||!await this.ready()||generation!==this.generation)return;
    const sample=await this.loadInstrument(options.kind||'ruler');
    if(generation!==this.generation||this.quiet||this.muted||!this.sfx||this.needsGesture||this.destroyed)return;
    this.onStatus('소리 재생 중');if(!this.recordedTone(options,sample))this.tone(options);
  }
  async sequence(notes){
    this.stop();const generation=this.generation;
    if(!this.sfx||!await this.ready()||generation!==this.generation)return;
    const sequence=notes.slice(0,32),samples=await Promise.all(sequence.map(note=>this.loadInstrument(note.kind||'ruler')));
    if(generation!==this.generation||this.quiet||this.muted||!this.sfx||this.needsGesture||this.destroyed)return;
    this.onStatus('신호 재생 중');sequence.forEach((note,i)=>{const options={...note,delay:i*.62,duration:.5};if(!this.recordedTone(options,samples[i]))this.tone(options);});
  }
  async loadInstrument(kind){
    const spec=instrumentSamples[kind];
    if(!spec||typeof this.context?.decodeAudioData!=='function')return null;
    const key=`instrument:${spec.src}`;
    try{
      if(!this.buffers.has(key))this.buffers.set(key,fetch(spec.src).then(r=>{if(!r.ok)throw Error('Sample unavailable');return r.arrayBuffer();}).then(data=>this.context.decodeAudioData(data)));
      return {spec,buffer:await this.buffers.get(key)};
    }catch{this.buffers.delete(key);return null;}
  }
  recordedTone({frequency=440,level=.4,duration=1.1,delay=0}={},sample){
    if(!sample?.buffer||!Number.isFinite(sample.buffer.duration))return false;
    if(this.context?.state!=='running'||this.quiet||this.muted||!this.sfx||this.needsGesture||this.destroyed)return false;
    const c=this.context,rate=sample.spec.pitch?bounded(frequency/sample.spec.reference,.25,4,1):1;
    const length=Math.min(bounded(duration,.04,15,1.1),sample.buffer.duration/rate),start=c.currentTime+bounded(delay,0,30,0);
    const source=c.createBufferSource(),gain=c.createGain(),peak=bounded(level,0,1,.4)*.6;
    source.buffer=sample.buffer;source.playbackRate.setValueAtTime(rate,start);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(peak,start+.004);
    gain.gain.setValueAtTime(peak,start+Math.max(.005,length-.025));gain.gain.linearRampToValueAtTime(0,start+length);
    source.connect(gain);gain.connect(c.destination);source.start(start);source.stop(start+length+.02);
    const entry={source,gain};this.nodes.push(entry);
    source.onended=()=>{source.disconnect();gain.disconnect();this.nodes=this.nodes.filter(n=>n!==entry);if(!this.nodes.length)this.onStatus('재생 끝');};
    return true;
  }
  async effect(name='tap'){
    if(!this.sfx||!interfaceSounds[name]||(name!=='badge'&&Date.now()-this.effectClock<90))return;
    this.effectClock=Date.now();const generation=this.generation;
    if(!await this.ready()||generation!==this.generation)return;
    try{
      const file=interfaceSounds[name];
      if(!this.buffers.has(file))this.buffers.set(file,fetch(`/media/audio/${file}.ogg`).then(r=>{if(!r.ok)throw Error('Sound unavailable');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)));
      const buffer=await this.buffers.get(file);
      if(generation!==this.generation||this.quiet||!this.sfx||this.muted||this.needsGesture||this.destroyed)return;
      const source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=buffer;gain.gain.value=name==='badge'?.22:.16;source.connect(gain);gain.connect(this.context.destination);
      const entry={source,gain};this.nodes.push(entry);source.onended=()=>{source.disconnect();gain.disconnect();this.nodes=this.nodes.filter(n=>n!==entry);};source.start();
    }catch{if(generation===this.generation)this.tone({frequency:name==='success'?660:480,kind:'ui',level:.4,duration:.12});}
  }
  canBgm(){
    return !this.destroyed&&!this.quiet&&this.unlocked&&!this.needsGesture&&!this.muted&&this.bgm&&this.bgmVolume>0&&bgmScenes.has(this.scene)&&!(typeof document!=='undefined'&&document.hidden);
  }
  syncBgm(){
    if(!this.canBgm()||this.context?.state!=='running'){this.stopBgm();return;}
    const c=this.context;
    if(!this.bgmBus){this.bgmBus=c.createGain();this.bgmBus.connect(c.destination);}
    this.bgmBus.gain.setTargetAtTime(this.bgmVolume,c.currentTime,.08);
    if(this.bgmTimer!==null)return;
    const generation=++this.bgmGeneration;
    const schedule=()=>{
      if(generation!==this.bgmGeneration||!this.canBgm()||c.state!=='running')return;
      const start=c.currentTime+.04;
      [261.63,329.63,392,329.63,293.66].forEach((frequency,index)=>{
        const source=c.createOscillator(),gain=c.createGain(),time=start+index*2.4;
        source.type='sine';source.frequency.setValueAtTime(frequency,time);
        gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.018,time+.28);gain.gain.exponentialRampToValueAtTime(.0001,time+2.25);
        source.connect(gain);gain.connect(this.bgmBus);source.start(time);source.stop(time+2.3);
        const entry={source,gain};this.bgmNodes.push(entry);
        source.onended=()=>{source.disconnect();gain.disconnect();this.bgmNodes=this.bgmNodes.filter(n=>n!==entry);};
      });
      this.bgmTimer=setTimeout(()=>{this.bgmTimer=null;schedule();},12000);
    };
    schedule();
  }
  stopBgm(){
    this.bgmGeneration++;if(this.bgmTimer!==null)clearTimeout(this.bgmTimer);this.bgmTimer=null;
    for(const entry of this.bgmNodes)this.disconnect(entry);this.bgmNodes=[];
  }
  destroy(){
    this.destroyed=true;this.stop();this.stopBgm();
    if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.visibilityHandler);
    try{this.bgmBus?.disconnect();}catch{}
    this.context?.close?.().catch(()=>{});
  }
}
