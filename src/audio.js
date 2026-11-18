import { interfaceSounds, backgroundMusic } from './data.js';
import { instrumentSamples } from './samples.js';
// Suno tracks (references/suno): the main theme loops everywhere; the finale plays once on the ending/certificate
// and while the map finale dialog is open.
const finaleScenes=new Set(['result']);
const effectKinds=new Set(['ui','success','feedback']);
const bounded=(value,min,max,fallback)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;

export class SoundEngine {
  constructor(){
    this.context=null;this.nodes=[];this.generation=0;this.muted=false;this.onStatus=()=>{};
    this.bgm=true;this.sfx=true;this.bgmVolume=.35;this.scene='home';
    this.music=new Map();this.track='main';this.mapFinale=false;this.finaleDone=false;this.holdUntil=0;this.holdTimer=null;
    this.quiet=false;this.unlocked=false;this.needsGesture=false;this.destroyed=false;this.bgmBus=null;
    this.buffers=new Map();this.effectClock=0;this.effectClocks=new Map();this.effectRequest=0;this.effectNode=null;
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
  // The map finale music never plays over a victory jingle.
  setMapFinale(open){this.mapFinale=Boolean(open);if(this.mapFinale)this.fadeEffect();this.syncBgm();}
  async unlock(){
    if(this.destroyed||typeof document!=='undefined'&&document.hidden)return false;
    this.unlocked=true;this.needsGesture=false;
    if(this.muted)return false;
    const ready=await this.ready();if(ready)this.syncBgm();return ready;
  }
  stop(){
    this.generation++;
    if(this.holdUntil){this.holdUntil=0;clearTimeout(this.holdTimer);this.holdTimer=null;this.syncBgm();}
    for(const entry of this.nodes)this.disconnect(entry);
    this.nodes=[];this.effectNode=null;
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
    this.holdBgm((options.duration??1.1)+.3);
    this.onStatus('소리 재생 중');if(!this.recordedTone(options,sample))this.tone(options);
  }
  async sequence(notes){
    this.stop();const generation=this.generation;
    if(!this.sfx||!await this.ready()||generation!==this.generation)return;
    const sequence=notes.slice(0,32),samples=await Promise.all(sequence.map(note=>this.loadInstrument(note.kind||'ruler')));
    if(generation!==this.generation||this.quiet||this.muted||!this.sfx||this.needsGesture||this.destroyed)return;
    this.holdBgm(Math.max(0,sequence.length-1)*.62+.8);
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
    const source=c.createBufferSource(),gain=c.createGain(),peak=bounded(level,0,1,.4)*.6*(sample.spec.gain??1);
    source.buffer=sample.buffer;source.playbackRate.setValueAtTime(rate,start);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(peak,start+.004);
    gain.gain.setValueAtTime(peak,start+Math.max(.005,length-.025));gain.gain.linearRampToValueAtTime(0,start+length);
    source.connect(gain);gain.connect(c.destination);source.start(start);source.stop(start+length+.02);
    const entry={source,gain};this.nodes.push(entry);
    source.onended=()=>{source.disconnect();gain.disconnect();this.nodes=this.nodes.filter(n=>n!==entry);if(!this.nodes.length)this.onStatus('재생 끝');};
    return true;
  }
  // One effect voice at a time: a new cue fades the previous one out. The same cue waits 90 ms before repeating.
  // polite cues skip while an experiment sound is playing so they never mix into a comparison.
  async effect(name='tap',{polite=false}={}){
    const cue=interfaceSounds[name],now=Date.now();
    if(!this.sfx||!cue||polite&&now<this.holdUntil||name!=='badge'&&(now-(this.effectClocks.get(name)??-Infinity)<90||now-this.effectClock<40))return;
    this.effectClock=now;this.effectClocks.set(name,now);const generation=this.generation,request=++this.effectRequest;
    if(!await this.ready()||generation!==this.generation)return;
    try{
      if(!this.buffers.has(cue.src))this.buffers.set(cue.src,fetch(`/${cue.src}`).then(r=>{if(!r.ok)throw Error('Sound unavailable');return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)));
      const buffer=await this.buffers.get(cue.src);
      if(generation!==this.generation||request!==this.effectRequest||this.quiet||!this.sfx||this.muted||this.needsGesture||this.destroyed)return;
      this.fadeEffect();
      const c=this.context,source=c.createBufferSource(),gain=c.createGain(),rate=cue.rate??1,start=c.currentTime;
      source.buffer=buffer;source.playbackRate.value=rate;source.playbackRate.setValueAtTime(rate,start);gain.gain.setValueAtTime(cue.gain??.16,start);
      source.connect(gain);gain.connect(c.destination);
      const entry={source,gain,effect:name};this.nodes.push(entry);this.effectNode=entry;
      source.onended=()=>{source.disconnect();gain.disconnect();this.nodes=this.nodes.filter(n=>n!==entry);if(this.effectNode===entry)this.effectNode=null;};source.start(start);
      // A stop can only be scheduled after start, so the fade for long cues comes last.
      if(cue.max&&Number.isFinite(buffer?.duration)&&buffer.duration/rate>cue.max){gain.gain.setValueAtTime(cue.gain??.16,start+cue.max-.12);gain.gain.linearRampToValueAtTime(0,start+cue.max);source.stop(start+cue.max+.02);}
    }catch{if(generation===this.generation)this.tone({frequency:name==='success'?660:480,kind:'ui',level:.4,duration:.12});}
  }
  // A voice line or an experiment sound is playing: effects stay out of it (dropped, or skipped when polite).
  get masked(){return this.quiet||Date.now()<this.holdUntil;}
  fadeEffect(){
    const entry=this.effectNode;if(!entry)return;this.effectNode=null;
    try{const t=this.context.currentTime;entry.gain.gain.setValueAtTime(entry.gain.gain.value,t);entry.gain.gain.linearRampToValueAtTime(0,t+.025);entry.source.stop(t+.03);}catch{this.disconnect(entry);}
  }
  canBgm(){
    return !this.destroyed&&this.unlocked&&!this.needsGesture&&!this.muted&&this.bgm&&this.bgmVolume>0&&!(typeof document!=='undefined'&&document.hidden);
  }
  // Experiment sounds are compared without music, so the theme falls silent while they play.
  holdBgm(seconds){
    this.holdUntil=Math.max(this.holdUntil,Date.now()+seconds*1000);
    clearTimeout(this.holdTimer);this.holdTimer=setTimeout(()=>{this.holdTimer=null;this.holdUntil=0;this.syncBgm();},this.holdUntil-Date.now());
    this.syncBgm();
  }
  syncBgm(){
    const track=this.mapFinale||finaleScenes.has(this.scene)?'finale':'main';
    if(track!==this.track){this.music.get(this.track)?.element.pause();this.track=track;if(track==='finale'){this.finaleDone=false;const finale=this.music.get('finale');if(finale)finale.element.currentTime=0;}}
    if(!this.canBgm()||this.context?.state!=='running'||track==='finale'&&this.finaleDone){this.stopBgm();return;}
    const c=this.context;
    if(!this.bgmBus){this.bgmBus=c.createGain();this.bgmBus.connect(c.destination);}
    // Voices and concept films keep the music at a quarter instead of stopping it.
    const level=Date.now()<this.holdUntil?0:this.bgmVolume*.6*(this.quiet||this.scene==='concept'?.25:1);
    this.bgmBus.gain.setTargetAtTime(level,c.currentTime,.08);
    const player=this.player(track);
    if(!player.routed)player.element.volume=Math.min(1,level);
    if(player.element.paused)player.element.play()?.catch?.(()=>{});
  }
  player(track){
    let player=this.music.get(track);
    if(player)return player;
    const element=new Audio(`/${backgroundMusic[track]}`);element.preload='auto';element.loop=track==='main';
    if(element.dataset)element.dataset.track=track;
    element.addEventListener?.('ended',()=>{if(track==='finale')this.finaleDone=true;});
    let routed=false;
    // Routing through the Web Audio bus lets volume and ducking work on iPad, where element.volume is fixed.
    try{if(typeof this.context?.createMediaElementSource==='function'){this.context.createMediaElementSource(element).connect(this.bgmBus);routed=true;}}catch{}
    player={element,routed};this.music.set(track,player);return player;
  }
  stopBgm(){
    for(const {element} of this.music.values())element.pause();
  }
  destroy(){
    this.destroyed=true;this.stop();this.stopBgm();clearTimeout(this.holdTimer);
    if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.visibilityHandler);
    try{this.bgmBus?.disconnect();}catch{}
    this.context?.close?.().catch(()=>{});
  }
}
