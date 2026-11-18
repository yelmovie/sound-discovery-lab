// Achievement cards: one per map villain (noise speaker), earned on its third hit.
// Ownership is read from the existing hit record (mapHits[id]===3), so nothing new is saved and a villain
// that was already driven off shows its card in the header without replaying the reveal.
import {createRewardCards} from './reward-cards.js';
import {stages,rewardCardAssets} from './data.js';

// Villain ids in map order (map-villain-content.js mapEncounterIds) with each card's title. Stars rise with the order.
const CARDS=[['0','떨림 발견 탐험가'],['1','소리 크기 조절왕'],['2','높낮이 멜로디 장인'],['3','소리 전달 길잡이'],['4','울림도시 소리 영웅']];
// The app supplies its sound path and what it knows about the screen (connectRewardCards).
let host={sound(){},masked:()=>false,onMap:()=>true,hits:()=>({})};
export function connectRewardCards(next){host={...host,...next};}
let set;
// Built on first use: the unit tests import this module without a document.
const cards=()=>set??=createRewardCards({
  setName:'울림도시 성취 카드',
  cards:CARDS.map(([id,title],i)=>({id,title,stage:stages[i].name,art:`/${rewardCardAssets[i*2]}`,thumb:`/${rewardCardAssets[i*2+1]}`})),
  theme:{accent:'#ffbd58',accent2:'#086a73',glow:'#bceced',ink:'#17394b'},
  particles:['note','circle','spark','star'],
  colors:['#ffbd58','#bceced','#22d3df','#c1a3ff','#086a73','#ffffff'],
  // Card back: the sound wave of the app icon (index.html).
  emblem:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32h8l5-16 9 33 9-34 6 17h11" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sound:name=>host.sound(name),
  inertRoot:()=>document.querySelector('#app'),
});
// A card on its way to a slot stays empty in the header until it lands.
const flying=new Set();
const settled=owned=>owned.map((has,i)=>has&&!flying.has(i));
export const rewardCardsOwned=hits=>CARDS.map(([id])=>hits?.[id]===3);
export const newRewardCards=(before,after)=>CARDS.flatMap(([id],i)=>before?.[id]!==3&&after?.[id]===3?[i]:[]);
export const rewardSlotsHtml=hits=>cards().slotsHtml(settled(rewardCardsOwned(hits)));

// The villain leaves in about 0.7 s. Its parting line is still being spoken then, and effects stay silent
// under a voice, so the card waits until no voice or experiment sound has played for CLEAR ms (a line that is
// about to start counts too); PATIENCE caps that wait.
const EXIT=760,EXIT_CALM=520,POLL=120,CLEAR=360,PATIENCE=8000,BUBBLE=2750;
let finaleHoldAt=0;
// The map finale opens 2.92 s after the fifth villain's last hit. A card that is still waiting holds it
// (map.js adds this to the encounters' blocked()) from the moment the villain's speech bubble has gone.
export const rewardCardHold=(now=Date.now())=>finaleHoldAt>0&&now>=finaleHoldAt;
const landed=i=>{flying.delete(i);if(!flying.size)finaleHoldAt=0;};
// Call with the hit record before and after each save.
export function awardRewardCards(before,after){
  for(const i of newRewardCards(before,after)){
    const earned=Date.now(),ready=earned+(matchMedia('(prefers-reduced-motion: reduce)').matches?EXIT_CALM:EXIT);
    let clearSince=0;
    flying.add(i);
    if(rewardCardsOwned(after).every(Boolean))finaleHoldAt=earned+BUBBLE;
    const show=()=>{
      const owned=rewardCardsOwned(host.hits());
      // Left the map, or the record was reset meanwhile: no reveal, the slot simply shows what is saved.
      if(!host.onMap()||!owned[i]){landed(i);cards().syncSlots(settled(owned));return;}
      const now=Date.now();
      clearSince=host.masked()?0:clearSince||now;
      if(document.querySelector('dialog[open]')||now<ready||(!clearSince||now-clearSince<CLEAR)&&now-earned<PATIENCE){setTimeout(show,POLL);return;}
      const foe=document.querySelector(`.map-encounter-foe[data-encounter="${CARDS[i][0]}"]`),box=foe&&!foe.hidden?foe.getBoundingClientRect():null;
      // An open card makes #app inert, which pauses the map and the villains, so the finale film follows the card.
      void cards().reveal(i,box?{x:box.left,y:box.top-30}:undefined,owned.map((has,k)=>has&&(k===i||!flying.has(k)))).finally(()=>landed(i));
    };
    setTimeout(show,ready-CLEAR-earned);
  }
}
