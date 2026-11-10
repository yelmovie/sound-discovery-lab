import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {mapLayout} from '../src/map-world.js';
import {villageAssets} from '../src/data.js';
import {challengeView} from '../src/challenges.js';

test('classification icons describe the material rather than music or a network',()=>{
 const icons=[];challengeView('classify',{challenge:{}},{button:()=>'',icon:name=>(icons.push(name),''),prop:()=>'',toolGraphic:()=>'',wave:()=>''});
 for(const name of ['air','water','solid','ear'])assert.ok(icons.includes(name),name);
 assert.ok(!icons.includes('music')&&!icons.includes('network'));
});
test('map uses optimized assets while retaining the original dimensions',async()=>{
 assert.equal(mapLayout.width,1672);assert.equal(mapLayout.height,941);
 for(const file of [mapLayout.image,mapLayout.explorer,mapLayout.companion]){
  assert.ok(villageAssets.includes(file));assert.ok(file.endsWith('.webp'));
  assert.ok((await stat(new URL('../'+file,import.meta.url))).size<(file===mapLayout.explorer?1_200_000:1_000_000),file);
 }
});
test('tablet and landscape touch floor is preserved after fit scaling',async()=>{
 const css=await readFile(new URL('../src/workbench.css',import.meta.url),'utf8');
 assert.match(css,/min-height:calc\(48px \/ var\(--content-fit\)\);min-width:calc\(48px \/ var\(--content-fit\)\)/);
});
test('observation pulse uses composited transform and opacity, not animated shadows',async()=>{
 const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
 const rule=css.match(/@keyframes object-pulse\{([^\n]*)/)[1];
 assert.match(rule,/opacity/);assert.match(rule,/transform/);assert.doesNotMatch(rule,/box-shadow/);
 assert.match(css,/\.pulse::after\{[^}]*pointer-events:none/);
});

test('observation pulse stays within the control during the entire animation',async()=>{
 const css=await readFile(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(css,/\.pulse::after\{[^}]*inset:3px/);
 assert.match(css,/@keyframes object-pulse\{from\{opacity:\.65;transform:scale\(\.96\)\}to\{opacity:0;transform:scale\(1\)\}\}/);
});

test('compact diagnostic and replay labels keep a 14px rendered floor',async()=>{
 const css=await readFile(new URL('../src/workbench.css',import.meta.url),'utf8');
 assert.match(css,/\.experiment-content \.noise-story \.btn,\.experiment-content \.diagnostic \.choice,\.experiment-content \.challenge-complete \.btn\{font-size:max\(var\(--read-small\),calc\(14px \/ var\(--content-fit\)\)\)\}/);
});
