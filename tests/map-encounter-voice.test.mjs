import test from 'node:test';
import assert from 'node:assert/strict';
import { mountMapEncounters } from '../src/map-encounters.js';

// A small stand-in DOM: enough for the encounter layer to mount, find the nearest villain and take a hit.
class El {
  constructor(doc){this.ownerDocument=doc;this.style={setProperty(){}};this.dataset={};this.hidden=false;this.textContent='';this.children=[];this.attrs={};
    this.classList={add(){},contains:()=>false};this.listeners={};this.clientWidth=800;this.clientHeight=600;this.isConnected=false;}
  append(...nodes){this.children.push(...nodes);}remove(){}after(){}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  closest(){return null;}querySelector(){return null;}querySelectorAll(){return [];}contains(){return false;}
  getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};}focus(){}
}
function harness(){
  const timers=[];let clock=1000;
  const view={performance:{now:()=>clock},setTimeout:(fn,ms)=>{timers.push({at:clock+ms,fn});return timers.length;},clearTimeout(){},addEventListener(){},HTMLElement:El};
  const doc={defaultView:view,hidden:false,head:new El(),activeElement:null,createElement(){return new El(doc);},createElementNS(){return new El(doc);},querySelector:()=>null,querySelectorAll:()=>[]};
  doc.head.ownerDocument=doc;
  const host=new El(doc),events=[];
  const advance=ms=>{clock+=ms;for(const t of timers.splice(0).sort((a,b)=>a.at-b.at)){if(t.at<=clock)t.fn();else timers.push(t);}};
  const map=mountMapEncounters({host,stages:[{id:'0',name:'연구소',x:100,y:100,lines:['도발!'],hit:['하나!','둘!'],finish:'퇴장!'}],art:{left:'a.png'},
    tone:kind=>events.push([clock,'sfx',kind]),voice:text=>events.push([clock,'voice',text])});
  const frame={hero:{x:110,y:100},ally:null,project:p=>({x:p.x,y:p.y}),scale:1};
  return {map,events,advance,frame,host,update:()=>map.update({...frame,now:clock}),attack:()=>{const find=el=>el.listeners?.click?el:el.children?.map(find).find(Boolean);find(host).listeners.click();}};
}

test('a hit or exit villain line starts about 300 ms after its fight cue; a taunt is not delayed',()=>{
  const h=harness();
  h.update();
  const taunt=h.events.find(e=>e[1]==='voice');assert.deepEqual(taunt.slice(1),['voice','도발!']);
  assert.ok(h.events.some(e=>e[1]==='sfx'&&e[2]==='appear'));
  for(let n=1;n<=3;n++){
    h.advance(3000);h.update();h.events.length=0;
    h.attack();
    assert.deepEqual(h.events.map(e=>e[2]),['swing'],'only the swing at the press');
    h.advance(110);
    assert.deepEqual(h.events.map(e=>e[2]),['swing',n===3?'finish':'hit'],'the strike lands before any voice');
    h.advance(190);
    const said=h.events.find(e=>e[1]==='voice');
    assert.ok(said,'the line follows');assert.equal(said[2],n===3?'퇴장!':['하나!','둘!'][n-1]);
    assert.ok(said[0]-h.events[0][0]>=300,'at least 300 ms after the swing');
  }
  h.advance(600);assert.ok(h.events.some(e=>e[2]==='exit'),'the exit cue still plays on the third hit');
  h.map.destroy();
});
