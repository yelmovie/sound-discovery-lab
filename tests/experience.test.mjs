import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import { readFile,stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { concepts,conceptView,emphasize } from '../src/concepts.js';
import { assets,interfaceSounds } from '../src/data.js';
import { freshState, normalize } from '../src/model.js';
import { coachFor } from '../src/companion.js';

const root=fileURLToPath(new URL('../',import.meta.url));
let server,base;
before(async()=>{
 const listener=net.createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));
 const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 base=`http://127.0.0.1:${port}`;
 server=spawn(process.execPath,['scripts/server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),TEMP:'D:\\DevTemp',TMP:'D:\\DevTemp'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Local server did not start')),8000);
  server.stdout.once('data',()=>{clearTimeout(timer);resolve();});
  server.once('error',error=>{clearTimeout(timer);reject(error);});
  server.once('exit',code=>{clearTimeout(timer);reject(Error(`Server exited: ${code}`));});
 });
});
after(()=>server?.kill());

test('five concept films and six credited sound files ship in the offline asset manifest',async()=>{
 assert.equal(concepts.length,5);assert.equal(Object.keys(interfaceSounds).length,6);
 for(const c of concepts){
  assert.equal(c.duration,16);assert.equal(c.cues.length,4);
  for(const asset of [c.src,c.poster,c.captions]){assert.ok(assets.includes(asset.slice(1)));assert.ok((await stat(new URL(`../${asset.slice(1)}`,import.meta.url))).size>100);}
 }
 const credits=await readFile(new URL('../media/audio/License.txt',import.meta.url),'utf8');assert.match(credits,/CC0/);
 for(const name of Object.values(interfaceSounds))assert.ok((await stat(new URL(`../media/audio/${name}.ogg`,import.meta.url))).size>100);
});
test('every lesson has progressive hints and ready feedback requires actual evidence work',()=>{
 const state=freshState();
 for(let i=0;i<20;i++)for(let level=0;level<3;level++){const coach=coachFor(state,i,level);assert.equal(coach.ready,false);assert.equal(typeof coach.text,'string');assert.ok(coach.text.length>5);}
 state.work[0]={seen:['rubber','drum'],choice:0};assert.equal(coachFor(state,0).ready,true);assert.equal(coachFor(state,0).target,'[data-action="submit"]');
});
test('a restored rhythm guides a fresh performance instead of adding another first beat',()=>{
 const state=freshState();state.work[3]={challenge:{sequence:['울림'],sounding:true}};
 assert.match(coachFor(state,3).target,/challenge-ring.*challenge-rest/);
 const restored=normalize(state),cue=coachFor(restored,3);
 assert.equal(cue.target,'[data-action="challenge-clear"]');
 assert.match(cue.text,/다시 연주/);
 restored.work[3].challenge.sequence=['울림','쉼'];
 assert.match(coachFor(restored,3).target,/challenge-ring.*challenge-rest/);
});
test('concept player retains native playback controls and text when video is unavailable',()=>{
 const html=conceptView(0);assert.match(html,/playsinline controls/);assert.match(html,/kind="captions"/);assert.match(html,/concept-fallback/);
 for(const cue of concepts[0].cues)assert.ok(html.replace(/<[^>]*>/g,'').includes(cue));
 assert.match(html,/concept-keyword/);assert.match(html,/concept-focus/);assert.match(html,/concept-transcript\" open/);
 assert.equal(emphasize('<떨림>',['떨림']),'&lt;<mark class=\"concept-keyword\">떨림</mark>&gt;');
});
test('video seeking returns byte ranges, correct MIME and matching bytes',async()=>{
 const r=await fetch(`${base}${concepts[0].src}`,{headers:{Range:'bytes=0-127'}});
 assert.equal(r.status,206);assert.equal(r.headers.get('content-type'),'video/mp4');assert.equal(r.headers.get('content-length'),'128');assert.match(r.headers.get('content-range'),/^bytes 0-127\/\d+$/);
 const body=Buffer.from(await r.arrayBuffer()),file=await readFile(new URL('../media/concepts/vibration.mp4',import.meta.url));assert.deepEqual(body,file.subarray(0,128));
 const tail=await fetch(`${base}${concepts[0].src}`,{headers:{Range:'bytes=-32'}});assert.equal(tail.status,206);assert.deepEqual(Buffer.from(await tail.arrayBuffer()),file.subarray(-32));
});
test('invalid ranges and nonpublic project paths are rejected',async()=>{
 for(const range of ['bytes=999999999-','bytes=50-10','bytes=-','bytes=1-2,5-6']){const r=await fetch(`${base}${concepts[0].src}`,{headers:{Range:range}});assert.equal(r.status,416);}
 for(const path of ['/package.json','/.work/downloads/kenney-interface.zip','/tests/model.test.mjs'])assert.equal((await fetch(base+path)).status,403);
});
test('all five caption files and interface audio are served with usable media types',async()=>{
 for(const c of concepts){const r=await fetch(base+c.captions);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^text\/vtt/);assert.match(await r.text(),/^WEBVTT/);}
 const audio=await fetch(`${base}/media/audio/click_003.ogg`,{method:'HEAD'});assert.equal(audio.status,200);assert.equal(audio.headers.get('content-type'),'audio/ogg');
});
