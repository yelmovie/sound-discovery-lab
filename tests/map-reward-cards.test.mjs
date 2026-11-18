import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {rewardCardsOwned,newRewardCards,rewardCardHold} from '../src/map-reward-cards.js';
import {mapEncounterIds} from '../src/map-villain-content.js';
import {assets,interfaceSounds,rewardCardAssets} from '../src/data.js';
import {normalize} from '../src/model.js';

test('achievement cards are owned exactly when a map villain has three hits',()=>{
  assert.deepEqual(rewardCardsOwned({0:3,1:2,3:3}),[true,false,false,true,false]);
  assert.deepEqual(rewardCardsOwned(undefined),[false,false,false,false,false]);
  assert.deepEqual(rewardCardsOwned(Object.fromEntries(mapEncounterIds.map(id=>[id,3]))),[true,true,true,true,true]);
});
test('a card is awarded only on the hit that takes a villain from under three to three',()=>{
  assert.deepEqual(newRewardCards({0:2},{0:3}),[0]);
  assert.deepEqual(newRewardCards({0:3},{0:3}),[]);
  assert.deepEqual(newRewardCards({0:3,4:1},{0:3,4:2}),[]);
  assert.deepEqual(newRewardCards(undefined,{2:3,4:3}),[2,4]);
});
test('cards add no save field and nothing holds the map finale until a card is waiting',()=>{
  assert.deepEqual(Object.keys(normalize({version:2})).sort(),Object.keys(normalize({version:2,rewardCards:[0,1]})).sort());
  assert.equal(rewardCardHold(),false);
});
test('card pictures, sounds and code ship with the build and the offline cache',async()=>{
  assert.equal(rewardCardAssets.length,mapEncounterIds.length*2);
  mapEncounterIds.forEach((id,i)=>assert.deepEqual(rewardCardAssets.slice(i*2,i*2+2),['card','thumb'].map(kind=>`image/generated/reward-cards/${kind}-${i+1}-${id}.webp`)));
  for(const file of rewardCardAssets){assert.ok(assets.includes(file),file);assert.ok((await stat(new URL(`../${file}`,import.meta.url))).size>1000,file);}
  for(const name of ['whoosh','reveal','epic','slot','complete'])assert.ok(interfaceSounds[`card-${name}`],name);
  const read=file=>readFile(new URL(`../${file}`,import.meta.url),'utf8');
  const [html,build,pkg,shared]=await Promise.all([read('index.html'),read('scripts/build.mjs'),read('package.json'),read('src/reward-cards.js')]);
  assert.match(html,/href="\/src\/reward-cards\.css"/);
  assert.match(build,/rewardCardAssets\.map/);
  for(const file of ['map-reward-cards.js','reward-cards.js'])assert.ok(pkg.includes(`node --check src/${file}`),file);
  assert.match(shared,/export function createRewardCards/);
});
