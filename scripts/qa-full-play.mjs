// End-to-end student play. No localStorage writes, seeded progress, admin mode or app-function awards.
import {chromium} from '/Volumes/T7 Shield/DevCaches/playwright-runner/node_modules/playwright/index.mjs';
import {mkdir,readFile,readdir,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import readline from 'node:readline';
import assert from 'node:assert/strict';
import {lessons,finalTasks} from '../src/data.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const run=process.argv[2]||'exploratory';
const boundaryOnly=run.startsWith('boundar');
if(!/^[a-z0-9-]+$/.test(run))throw Error('Use a simple run name.');
const base=process.env.QA_BASE||'http://127.0.0.1:4186';
const out=path.join(root,'.tmp/full-play-20261109',run),temp=path.join(root,'.tmp/full-play-20261109/tmp');
await mkdir(out,{recursive:true});await mkdir(temp,{recursive:true});
for(const name of ['TMPDIR','TMP','TEMP'])process.env[name]=temp;
const profile=process.env.QA_PROFILE||path.join(out,'profile');
const existed=await stat(path.join(profile,'Default','Preferences')).then(()=>true).catch(()=>false);
if(existed&&!process.argv.includes('--resume'))throw Error('This run already has a profile. Use a new run name or explicit --resume.');
const io=readline.createInterface({input:process.stdin,output:process.stdout,terminal:false});
const browser=await chromium.launchPersistentContext(profile,{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:process.env.QA_HEADFUL!=='1',viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'no-preference',args:['--disable-crash-reporter','--disable-breakpad','--noerrdialogs','--use-mock-keychain','--mute-audio',`--disk-cache-dir=${path.join(out,'cache')}`,`--crash-dumps-dir=${path.join(out,'crashes')}`]});
const page=browser.pages()[0]||await browser.newPage();page.setDefaultTimeout(12000);
const key='ullim-city-v1';
const events=[],audits=[],runtime=[],issues=[],checks=[],repairs=[];
let current='startup',lastAction='',serial=0,blocked=false;
const auditSource=await readFile(path.join(root,'scripts/qa-single-screen.mjs'),'utf8');
const start=auditSource.indexOf('function audit('),end=auditSource.indexOf('\nasync function measure(',start);
assert.ok(start>=0&&end>start,'existing read-only auditor found');
const auditLesson=Function(`return (${auditSource.slice(start,end)})`)();
async function hashes(){const result={};for(const f of ['index.html',...(await readdir(path.join(root,'src'))).filter(f=>!f.startsWith('._')&&/\.(js|css)$/.test(f)).map(f=>'src/'+f)])result[f]=createHash('sha256').update(await readFile(path.join(root,f))).digest('hex');return result;}
const sourceStart=await hashes();
page.on('pageerror',e=>runtime.push({type:'pageerror',step:current,text:String(e)}));
page.on('console',m=>{if(m.type()==='error')runtime.push({type:'console',step:current,text:m.text()});});
page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))runtime.push({type:'http',step:current,status:r.status(),url:r.url()});});
const saved=()=>page.evaluate(k=>{const text=localStorage.getItem(k);return text?JSON.parse(text):null;},key);
const domRoute=()=>page.evaluate(()=>{const lesson=document.querySelector('.lesson-page');return lesson?`lesson/${lesson.dataset.lesson}`:document.querySelector('.map-page')?'map':document.querySelector('.final-focus')?'final':document.querySelector('.result-page')?'result':document.querySelector('.title-screen')?'home':'unknown';});
const player=()=>page.locator('.autoplay-controls').getAttribute('data-player-state');
const proof=s=>s?.work?.[Number((s.lastRoute||'').split('/')[1])]?.challenge?.proof?.length||0;
async function flush(){await writeFile(path.join(out,'results.json'),JSON.stringify({run,current,lastAction,blocked,events,audits,runtime,issues,checks,repairs,sourceStart},null,2));}
async function settle(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
function genericAudit(){
 const modal=document.querySelector('dialog[open]'),scope=modal||document.querySelector('main')||document.body,out=[];
 const visible=e=>{if(e.closest('[hidden],.sr-only,.visually-hidden,dialog:not([open])'))return false;for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||+c.opacity<.05)return false;if(p.tagName==='DETAILS'&&!p.open){const s=[...p.children].find(x=>x.tagName==='SUMMARY');if(!s?.contains(e))return false;}}return e.getBoundingClientRect().width>1;};
 const name=e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().replace(/\s+/g,' ').slice(0,65);
 if(document.documentElement.scrollWidth>innerWidth+3)out.push({type:'horizontal-overflow'});
 if(modal){const r=modal.getBoundingClientRect();if(r.top<-2||r.bottom>innerHeight+2||r.left<-2||r.right>innerWidth+2)out.push({type:'modal-outside',rect:{x:r.x,y:r.y,w:r.width,h:r.height}});}
 for(const e of scope.querySelectorAll('button,input,select,summary')){if(!visible(e))continue;const r=e.getBoundingClientRect();let clipped=false;for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(c.overflowY)&&(r.top+r.height/2<b.top||r.top+r.height/2>b.bottom))clipped=true;}
  if(!clipped&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit)&&!hit.contains(e))out.push({type:'covered-control',label:name(e),by:hit.tagName+'.'+hit.className});}
 }
 for(const e of scope.querySelectorAll('img'))if(visible(e)&&e.complete&&!e.naturalWidth)out.push({type:'broken-image',src:e.src});
 return {issues:out,modal:modal?.getAttribute('aria-label'),title:document.querySelector('main h1')?.textContent,viewport:[innerWidth,innerHeight]};
}
async function record(label,{shot=false,allowIssues=false}={}){
 current=label;await settle();const route=await domRoute(),state=await saved();
 if(!boundaryOnly)assert.equal(state?.settings?.admin||false,false,'student mode only');
 const modal=await page.locator('dialog[open]').count();
 const data=route.startsWith('lesson/')&&!modal?await page.evaluate(auditLesson,{}):await page.evaluate(genericAudit);
 if(route.startsWith('lesson/')&&!modal){data.playerState=await player();if(data.playerState==='playing'){const transient=data.issues.filter(i=>i.type==='next-action-target-count'&&i.detail?.actual===0);if(transient.length){data.transientObservationNotes=transient;data.issues=data.issues.filter(i=>!transient.includes(i));}}}
 if(data.viewport?.[0]>=800&&data.minimumFont!=null&&data.minimumFont<(data.viewport[0]>=1280?15.95:13.95))data.issues.push({type:'small-learning-font',label:data.minimumFontLabel,detail:{actual:data.minimumFont,expected:data.viewport[0]>=1280?16:14,fitScale:data.fitScale}});
 const row={label,route,mode:boundaryOnly?'separate-teacher-boundary':'normal-student',evidence:Object.keys(state?.evidence||{}).length,proof:proof(state),...data};audits.push(row);
 if(shot||data.issues.length){const file=`${String(++serial).padStart(3,'0')}-${label.replace(/[^a-zA-Z0-9_-]/g,'-')}.png`;await page.screenshot({path:path.join(out,file)});row.screenshot=file;}
 await flush();
 if(data.issues.length&&!allowIssues)throw Error(`UI audit failed: ${JSON.stringify(row)}`);
 return row;
}
async function click(selector,label=selector){
 lastAction=label;const before=await saved();await page.locator(selector).click();await page.waitForTimeout(90);
 events.push({type:'click',label,route:await domRoute(),beforeEvidence:Object.keys(before?.evidence||{}).length});
}
const action=(name,attrs='',label=name)=>click(`[data-action="${name}"]${attrs}`,label);
async function physicalClick(selector){lastAction='physical pointer '+selector;const b=await page.locator(selector).boundingBox();assert.ok(b);await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.up();await page.waitForTimeout(120);}
async function range(selector,value){
 lastAction=`range ${selector}=${value}`;
 const meta=await page.locator(selector).evaluate(e=>({min:Number(e.min||0),step:Number(e.step||1),max:Number(e.max||100)}));
 assert.ok(value>=meta.min&&value<=meta.max);await page.locator(selector).focus();await page.keyboard.press('Home');await page.waitForTimeout(65);
 for(let n=0;n<Math.round((value-meta.min)/meta.step);n++){await page.keyboard.press('ArrowRight');await page.waitForTimeout(65);}
 assert.equal(Number(await page.locator(selector).inputValue()),value);events.push({type:'keyboard-range',selector,value,route:await domRoute()});
}
async function repairable(label,fn){
 for(;;){try{return await fn();}catch(error){blocked=true;const detail={label,lastAction,route:await domRoute().catch(()=>''),error:String(error),at:new Date().toISOString(),state:await saved().catch(()=>null)};issues.push(detail);await record('blocked-'+label,{shot:true,allowIssues:true}).catch(()=>{});await flush();console.log('BLOCKED '+JSON.stringify(detail));
  if(process.env.QA_FAIL_FAST==='1')throw error;
  console.log('Waiting for root repair. Send resume followed by Enter.');await new Promise(resolve=>{const next=line=>{if(line.trim()==='resume'){io.off('line',next);resolve();}};io.on('line',next);});
  repairs.push({label,sourceHashes:await hashes(),at:new Date().toISOString()});await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(450);blocked=false;await flush();
 }}
}
async function autoplay(i,label){
 await page.locator('#experiment-speed').selectOption('2');await action('auto-play','',label+'-start');
 const began=Date.now();let previous='';
 while(Date.now()-began<18000){const status=await player(),hint=await page.locator('#coach-hint').textContent();const fingerprint=status+'|'+hint;
  if(fingerprint!==previous){await record(label+'-'+status);previous=fingerprint;}
  if(['waiting','complete'].includes(status)){checks.push(`${label}: automatic observation ended`);return;}
  if(status==='paused')throw Error('Automatic observation paused unexpectedly.');
  await page.waitForTimeout(180);
 }
 throw Error('Automatic observation did not finish in 18 seconds.');
}
async function roundWait(i,n){await page.waitForFunction(({i,n,key})=>JSON.parse(localStorage.getItem(key))?.work?.[i]?.challenge?.proof?.length===n,{i,n,key},{timeout:3000});await page.waitForTimeout(560);}
async function evidence(i){await page.waitForFunction(({i,key})=>Boolean(JSON.parse(localStorage.getItem(key))?.evidence?.[i]),{i,key},{timeout:3000});assert.equal(await page.locator('[data-action="continue"]').count(),1);await record(`lesson-${i}-complete`,{shot:i%4===3||i===4||i===8});checks.push(`lesson ${i}: earned evidence and visible continue`);}
const choices=async(i,n)=>{await action('choice',`[data-choice="${n}"]`,`lesson-${i}-choice-${n}`);await record(`lesson-${i}-choice-${n}`);};
const plans={parts:[0,1,2,1],rhythm:[['ring','rest','ring'],['ring','rest','ring','rest'],['ring','rest','ring','rest','ring']],signal:[1,3,2,1],sort:[[1,0,2],[2,1,0]],melody:[[18,12,6],[6,12,18],[12,6,18,12]],mix:[[6,1],[18,3],[12,1],[6,3]],sensor:['air','water','solid'],classify:['air','water','solid','air','water','solid'],solutions:['pad','volume','time','place'],festival:['balanced']};
let reloadChecked=false,rhythmReloadChecked=false;
async function playLesson(i){
 assert.equal(await domRoute(),`lesson/${i}`);await page.waitForTimeout(380);await record(`lesson-${i}-entered`,{shot:i%4===0});
 if((await saved())?.evidence?.[i]){await evidence(i);return;}
 const id=lessons[i].challenge;
 if(id){
  if(i===3&&!rhythmReloadChecked){await action('challenge-clear');await action('challenge-ring');const before=await saved();assert.deepEqual(before.work[3].challenge.sequence,['울림']);await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(450);assert.equal(await domRoute(),'lesson/3');assert.deepEqual((await saved()).work[3].challenge.sequence,['울림']);assert.ok(await page.locator('.next-target[data-action="challenge-clear"]').count(),'interrupted rhythm points to restart');assert.match(await page.locator('#coach-hint').textContent(),/처음|다시/);assert.doesNotMatch(await page.locator('.rhythm-scope').textContent(),/떨리는 중/);await record('rhythm-real-reload-restart',{shot:true});await autoplay(i,'rhythm-reload-autoplay-recovery');assert.ok(await page.locator('.next-target[data-action="challenge-clear"]').count(),'automatic replay retains restart cue for interrupted input');assert.deepEqual((await saved()).work[3].challenge.sequence,['울림']);await record('rhythm-reload-auto-retains-restart',{shot:true});await action('challenge-clear');assert.deepEqual((await saved()).work[3].challenge.sequence,[]);rhythmReloadChecked=true;checks.push('manual ring, real reload and autoplay preserve partial input, stop sound, retain restart cue and allow clear');}
  for(let k=(await saved()).work?.[i]?.challenge?.proof?.length||0;k<plans[id].length;k++){
   await autoplay(i,`lesson-${i}-round-${k}-auto`);
   if(id==='parts')await action('challenge-select',`[data-value="${plans[id][k]}"]`);
   if(id==='rhythm'){await action('challenge-clear');for(const a of plans[id][k]){await action(`challenge-${a}`);await record(`lesson-${i}-round-${k}-${a}`);}}
   if(id==='signal'){await range('#signal-force',plans[id][k]);await record(`lesson-${i}-round-${k}-set`);await action('challenge-strike');}
   if(id==='sort'){for(const [slot,v]of plans[id][k].entries()){await action('challenge-parcel',`[data-value="${v}"]`);await action('challenge-slot',`[data-value="${slot}"]`);await record(`lesson-${i}-round-${k}-slot-${slot}`);}}
   if(id==='melody'){await action('challenge-clear');for(const n of plans[id][k]){await action('challenge-note',`[data-value="${n}"]`);await record(`lesson-${i}-round-${k}-note-${n}`);}}
   if(id==='mix'){await range('#mix-length',plans[id][k][0]);await range('#mix-force',plans[id][k][1]);await record(`lesson-${i}-round-${k}-set`);await action('challenge-check');}
   if(id==='sensor'||id==='classify')await action('challenge-zone',`[data-value="${plans[id][k]}"]`);
   if(id==='solutions'){await action('challenge-solution',`[data-value="${plans[id][k]}"]`);await record(`lesson-${i}-round-${k}-solution`);await action('challenge-after');}
   if(id==='festival'){await range('#festival-music',1);await range('#festival-announcement',2);await record(`lesson-${i}-balanced-levels`);await action('challenge-pads');}
   await roundWait(i,k+1);await record(`lesson-${i}-round-${k}-awarded`,{shot:k===plans[id].length-1});
  }
 }else{
  await autoplay(i,`lesson-${i}-auto`);
  if(i===0){await choices(i,1);assert.equal(Boolean((await saved()).evidence?.[i]),false);await choices(i,0);}
  if(i===1)await choices(i,1);
  if(i===5){const pair=(await saved()).evidence[4].observation;await choices(i,pair.a>pair.b?0:1);}
  if(i===8){
   if(!reloadChecked){const before=await saved();await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(450);assert.equal(await domRoute(),`lesson/${i}`);assert.deepEqual((await saved()).work[i].lengths,before.work[i].lengths);assert.equal(await player(),'idle');reloadChecked=true;checks.push('lesson8 reload restores actual observation work and route, player remains stopped');await record('lesson-8-after-real-reload',{shot:true});}
   await choices(i,0);
  }
  if(i===9){await action('pattern-reset');for(const n of [18,6,12]){await action('note',`[data-length="${n}"]`);await record(`lesson-${i}-note-${n}`);}}
  if(i===12)await choices(i,1);
  if(i===13){for(let k=0;k<3;k++){await page.waitForTimeout(560);await action('case-choice',`[data-medium="${['air','water','solid'][k]}"]`);const text=await page.locator('#coach-hint').textContent();if(/물를/.test(text)){issues.push({severity:'copy',label:'lesson13 water grammar',text,lastAction});console.log('COPY '+JSON.stringify({lesson:i,text}));}await record(`lesson-${i}-case-${k}`);}}
  if(i===16){await action('diagnostic','[data-field="place"][data-value="library"]');await record('diagnosis-place');await action('diagnostic','[data-field="situation"][data-value="reading"]');await record('diagnosis-situation');await action('diagnostic','[data-field="person"][data-value="drummer"]');await record('diagnosis-wrong-person',{shot:true});const hint=await page.locator('#coach-hint').textContent();const target=await page.locator('.next-target,.next-choice-group').evaluateAll(es=>es.map(e=>({text:e.textContent,person:Boolean(e.matches('[data-field="person"]')||e.querySelector('[data-field="person"]'))})));assert.ok(target.some(e=>e.person)||/다시|틀|불편한 사람|영향/.test(hint),`Wrong person received unrelated cue: ${JSON.stringify({hint,target})}`);await action('diagnostic','[data-field="person"][data-value="reader"]');}
  if(i===17){await action('solution','[data-solution="pad"]');await record('lesson-17-pad');await action('noise-after');await choices(i,0);}
 }
 await evidence(i);
}
async function reward(i){
 await page.locator('dialog.modal-concept').waitFor();await record(`facility-${Math.floor(i/4)}-reward-open`,{shot:true});
 const video=page.locator('dialog video');await video.waitFor();await page.waitForFunction(()=>{const v=document.querySelector('dialog video');return v&&v.readyState>=1;},{},{timeout:15000});
 assert.equal(await page.locator('.concept-reward').count(),1);const stage=lessons[i].stage;
 const paused=await video.evaluate(v=>v.paused);if(paused){await video.focus();await page.keyboard.press('Space');}
 await page.waitForFunction(()=>{const v=document.querySelector('dialog video');return v&&!v.paused&&v.currentTime>.1;},{},{timeout:7000});
 await page.waitForFunction(()=>document.querySelector('dialog video')?.ended,{},{timeout:25000});checks.push(`facility ${stage}: real concept video played to end`);await record(`facility-${stage}-video-ended`,{shot:true});
 await click('dialog .modal-footer .primary','reward-next');await page.waitForTimeout(380);
 const expected=i===19?'final':`lesson/${i+1}`;assert.equal(await domRoute(),expected);assert.equal(await page.locator('dialog[open]').count(),0);await record(`facility-${stage}-next`);
}
async function advance(i){
 const route=await domRoute();if(route===(i===19?'final':`lesson/${i+1}`))return;
 if(await page.locator('dialog.modal-concept').count()){await reward(i);return;}
 assert.equal(route,`lesson/${i}`);await action('continue','',`lesson-${i}-continue`);if(i%4===3)await reward(i);else{await page.waitForTimeout(380);assert.equal(await domRoute(),`lesson/${i+1}`);assert.equal(await page.locator('dialog[open]').count(),0);await record(`lesson-${i}-next`);}
}
async function finalQuestions(){
 assert.equal(await domRoute(),'final');await record('final-entered',{shot:true});
 for(let i=0;i<5;i++){if(!(await page.locator(`[data-question="${i}"]`).count()))await action('final-step',`[data-step="${i}"]`);await action('final-choice',`[data-question="${i}"][data-choice="${finalTasks[i].answer}"]`);await record(`final-question-${i}`);if(i<4)await page.waitForTimeout(650);}
 assert.equal(await page.locator('[data-action="restore"]').isEnabled(),true);await action('restore');await page.locator('.certificate:not(.preview)').waitFor();const s=await saved();assert.equal(s.restored,true);assert.equal(Object.keys(s.evidence).length,20);assert.equal(Object.keys(s.finalAnswers).length,5);assert.ok(Date.parse(s.completedAt));assert.equal(await page.locator('[data-action="print"]').count(),1);await record('genuine-certificate',{shot:true});checks.push('fresh student completed 20 lessons, all rounds, five reward videos, final and genuine certificate');await writeFile(path.join(out,'earned-state-before-regressions.json'),JSON.stringify(s,null,2));
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(450);assert.equal(await domRoute(),'result');await page.locator('.certificate:not(.preview)').waitFor();const restored=await saved();assert.equal(restored.restored,true);assert.equal(Object.keys(restored.evidence).length,20);assert.equal(restored.completedAt,s.completedAt);assert.deepEqual(restored.finalAnswers,s.finalAnswers);await record('genuine-certificate-after-reload',{shot:true});checks.push('genuine certificate, completion date, final answers and twenty earned records survive real reload');
}
async function revisit(i){
 if(await page.locator('dialog[open]').count())await click('.modal-heading [data-action="close"]');
 if(await page.locator('.lesson-page').count()){await action('activity-tools');await action('notebook');}else await action('notebook');
 await action('notebook-stage',`[data-stage="${Math.floor(i/4)}"]`);await click(`dialog [data-action="goto"][data-route="lesson/${i}"]`,`notebook-revisit-${i}`);await page.waitForTimeout(380);assert.equal(await domRoute(),`lesson/${i}`);
}
async function viewportRegressions(viewports=[[915,412],[1024,768],[1920,1080],[830,515]]){
 for(const [width,height]of viewports){await page.setViewportSize({width,height});for(const i of [0,5,8,12,17]){await revisit(i);await record(`${width}x${height}-lesson-${i}-revisit`,{shot:i===8});await autoplay(i,`${width}x${height}-lesson-${i}-auto`);const correct=i===5?((await saved()).evidence[4].observation.a>(await saved()).evidence[4].observation.b?0:1):i===12?1:0;await choices(i,1-correct);assert.equal(await page.locator('[data-action="continue"]').count(),0);assert.equal(Object.keys((await saved()).evidence).length,20);await choices(i,correct);await evidence(i);await advance(i);checks.push(`${width}x${height} lesson ${i}: actual earned work, auto, wrong/correct choice, continue`);}
  if(width<=915){await revisit(11);if(await page.locator('[data-action="challenge-replay"]').count())await action('challenge-replay');await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.waitForFunction(()=>document.querySelector('#mix-length')?.value==='6',{},{timeout:6000});await physicalClick('[data-action="challenge-check"]');assert.equal(await page.locator('.challenge-shell').getAttribute('data-round'),'0');assert.match(await page.locator('#coach-hint').textContent(),/멈췄어/);await record(`${width}x${height}-handoff-message`,{shot:true});await revisit(16);await action('diagnostic','[data-field="person"][data-value="drummer"]');assert.ok(await page.locator('.next-target[data-field="person"],.next-choice-group [data-field="person"]').count());await record(`${width}x${height}-wrong-diagnosis-message`,{shot:true});await action('diagnostic','[data-field="person"][data-value="reader"]');await evidence(16);checks.push(`${width}x${height}: new handoff and wrong-person guidance remain visible and recoverable`);}
 }
}
async function setupDemo(){
 await action('settings');await page.getByText('교사용 가이드',{exact:true}).click();await page.getByText('교사용 도구',{exact:true}).click();await action('admin');await click('.modal-heading [data-action="close"]');await action('start');await page.locator('.map-load-state').waitFor({state:'hidden',timeout:30000});await page.waitForTimeout(800);await click('.map-next');await page.locator('.lesson-page[data-lesson="0"]').waitFor({timeout:20000});
}
async function demoLesson(i){let current=Number((await domRoute()).split('/')[1]);await page.locator('main h1').focus();while(current!==i){await page.keyboard.press(current<i?'ArrowRight':'ArrowLeft');await page.waitForTimeout(110);current=Number((await domRoute()).split('/')[1]);}await page.waitForTimeout(560);await record(`demo-lesson-${i}`);}
async function boundaryIssue(label,detail){const item={severity:'confirmed',label,detail,lastAction,route:await domRoute()};issues.push(item);await record(label,{shot:true,allowIssues:true});console.log('CONFIRMED '+JSON.stringify(item));await flush();}
async function tracePointer(){
 assert.equal(await domRoute(),'lesson/5');assert.equal((await saved()).restored,true);await page.setViewportSize({width:830,height:515});await autoplay(5,'trace-auto');await record('trace-before-pointer',{shot:true});
 await page.evaluate(()=>{window.__qaPointerTrace=[];const rect=e=>{const r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{const control=e.target.closest('[data-action]');const snapshot=phase=>window.__qaPointerTrace.push({type,phase,target:e.target.tagName,action:control?.dataset.action,choice:control?.dataset.choice,x:e.clientX,y:e.clientY,footer:rect(document.querySelector('.activity-footer')),board:rect(document.querySelector('.experiment-board')),choices:[...document.querySelectorAll('[data-action="choice"]')].map(b=>({choice:b.dataset.choice,rect:rect(b),class:b.className})),player:document.querySelector('.autoplay-controls')?.dataset.playerState});snapshot('capture');requestAnimationFrame(()=>snapshot('next-frame'));},{capture:true});});
 const before=await saved();await physicalClick('[data-action="choice"][data-choice="0"]');await record('trace-after-pointer',{shot:true});const trace=await page.evaluate(()=>window.__qaPointerTrace),after=await saved();await writeFile(path.join(out,'pointer-trace.json'),JSON.stringify({before,after,trace},null,2));checks.push(`pointer trace: work choice ${before.work[5].choice} -> ${after.work[5].choice}, events ${trace.length}`);assert.equal(after.work[5].choice,0,'first real click after autoplay must apply the chosen answer');
}
async function fontProbeExisting(){assert.equal((await saved()).restored,true);for(const [width,height]of [[1280,800],[1920,1080]]){await page.setViewportSize({width,height});for(const i of [8,11]){await revisit(i);await record(`${width}x${height}-lesson-${i}-font-entered`);await autoplay(i,`${width}x${height}-lesson-${i}-font-probe`);await record(`${width}x${height}-lesson-${i}-font-final`,{shot:true});}}}
async function boundaryChecks(){
 await setupDemo();
 if(run.includes('font')){for(const [width,height]of [[1280,800],[1920,1080]]){await page.setViewportSize({width,height});for(const i of [8,11]){await demoLesson(i);await autoplay(i,`${width}x${height}-lesson-${i}-font-probe`);await record(`${width}x${height}-lesson-${i}-font-final`,{shot:true});}}return;}
 await demoLesson(3);let hidden='visible',windowDetails,cdp;
 if(process.env.QA_HEADFUL==='1'){cdp=await browser.newCDPSession(page);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});await page.bringToFront();await page.waitForTimeout(150);}
 const visibilityBefore=await page.evaluate(()=>document.visibilityState);await action('challenge-ring');const before=await page.locator('.rhythm-scope').textContent();
 if(process.env.QA_HEADFUL==='1'){
  windowDetails=await cdp.send('Browser.getWindowForTarget');await cdp.send('Browser.setWindowBounds',{windowId:windowDetails.windowId,bounds:{windowState:'minimized'}});await page.waitForTimeout(500);windowDetails.minimized=await cdp.send('Browser.getWindowBounds',{windowId:windowDetails.windowId});hidden=await page.evaluate(()=>document.visibilityState);await cdp.send('Browser.setWindowBounds',{windowId:windowDetails.windowId,bounds:{windowState:'normal'}});await page.bringToFront();
 }else{const tab=await browser.newPage();await tab.goto('about:blank');await tab.bringToFront();await page.waitForTimeout(250);hidden=await page.evaluate(()=>document.visibilityState);await tab.close();await page.bringToFront();}
 await page.waitForTimeout(150);const visibilityAfter=await page.evaluate(()=>document.visibilityState),after=await page.locator('.rhythm-scope').textContent();await record('rhythm-return-before-rest',{shot:true});await action('challenge-rest');const response=await page.locator('#coach-hint').textContent();
 if(hidden==='hidden'&&/떨리는/.test(after)&&/먼저 울려야/.test(response))await boundaryIssue('rhythm-real-tab-return',{visibilityBefore,hidden,visibilityAfter,before,after,response,windowDetails});else checks.push(`rhythm visibility boundary: visibility=${visibilityBefore}/${hidden}/${visibilityAfter}, before=${before}, after=${after}, response=${response}`);
 if(cdp){await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});await cdp.detach();}
 if(hidden!=='hidden')checks.push('actual hidden visibility was unavailable; no synthetic event was used');await action('challenge-clear');
 if(run.includes('tab'))return;
 const pointer=physicalClick;
 const mixValues=async()=>({length:await page.locator('#mix-length').inputValue(),force:await page.locator('#mix-force').inputValue(),round:await page.locator('.challenge-shell').getAttribute('data-round'),hint:await page.locator('#coach-hint').textContent()});
 await demoLesson(11);await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.waitForFunction(()=>document.querySelector('#mix-length')?.value==='6',{},{timeout:6000});const mixBefore=await mixValues();await record('mix-preview-before-pointer',{shot:true});await pointer('[data-action="challenge-check"]');const mixFirst=await mixValues();await pointer('[data-action="challenge-check"]');const mixSecond=await mixValues();
 if(mixFirst.length!=='18'||mixFirst.force!=='1'||mixFirst.round!==mixBefore.round||!/멈췄어/.test(mixFirst.hint))await boundaryIssue('mix-first-pointer-handoff-failed',{before:mixBefore,first:mixFirst,second:mixSecond});else checks.push('mix first pointer restores settings without judgment; second judges restored values '+JSON.stringify({first:mixFirst,second:mixSecond}));
 await action('auto-play');await page.waitForFunction(()=>document.querySelector('#mix-force')?.value==='3',{},{timeout:7000});const keyboardBefore=await mixValues();await page.locator('#mix-force').focus();await page.keyboard.press('ArrowLeft');await page.waitForTimeout(130);const keyboardAfter=await mixValues();if(keyboardAfter.force!=='1'||keyboardAfter.length!=='18')await boundaryIssue('mix-keyboard-range-handoff-failed',{before:keyboardBefore,after:keyboardAfter});else checks.push('keyboard range first gesture restores original values');
 await action('auto-play');await page.waitForFunction(()=>document.querySelector('#mix-length')?.value==='6',{},{timeout:6000});await page.locator('[data-action="challenge-check"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(100);const enterFirst=await mixValues();await page.keyboard.press('Enter');await page.waitForTimeout(100);const enterSecond=await mixValues();if(enterFirst.round!=='0'||!/멈췄어/.test(enterFirst.hint))await boundaryIssue('mix-keyboard-button-handoff-failed',{first:enterFirst,second:enterSecond});else checks.push('keyboard Enter first restores, second explicitly judges '+JSON.stringify({first:enterFirst,second:enterSecond}));
 await demoLesson(6);await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.waitForFunction(()=>document.querySelector('#signal-force')?.value==='3',{},{timeout:6000});const signalBefore={force:await page.locator('#signal-force').inputValue(),round:await page.locator('.challenge-shell').getAttribute('data-round')};await pointer('[data-action="challenge-strike"]');const signalFirst={force:await page.locator('#signal-force').inputValue(),round:await page.locator('.challenge-shell').getAttribute('data-round'),hint:await page.locator('#coach-hint').textContent()};await pointer('[data-action="challenge-strike"]');const signalSecond={round:await page.locator('.challenge-shell').getAttribute('data-round'),hint:await page.locator('#coach-hint').textContent()};if(signalFirst.force!=='1'||signalFirst.round!=='0'||signalSecond.round!=='1')await boundaryIssue('signal-pointer-handoff-failed',{before:signalBefore,first:signalFirst,second:signalSecond});else checks.push('signal first pointer restores without award; second explicitly earns one round');
 await demoLesson(14);await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.waitForFunction(()=>document.querySelector('.sensor-zone.water')?.getAttribute('aria-pressed')==='true',{},{timeout:6000});await pointer('[data-action="challenge-zone"][data-value="water"]');const sensorFirst={selected:await page.locator('.sensor-zone.water').getAttribute('aria-pressed'),round:await page.locator('.challenge-shell').getAttribute('data-round')};await pointer('[data-action="challenge-zone"][data-value="water"]');const sensorSecond={round:await page.locator('.challenge-shell').getAttribute('data-round'),hint:await page.locator('#coach-hint').textContent()};if(sensorFirst.selected!=='false'||sensorFirst.round!=='0'||sensorSecond.round!=='0')await boundaryIssue('sensor-pointer-handoff-failed',{first:sensorFirst,second:sensorSecond});else checks.push('sensor first restores without selection; second applies explicit choice');
 await demoLesson(13);await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.locator('[data-action="case-choice"][data-medium="water"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(110);const focused=await page.evaluate(()=>({action:document.activeElement?.dataset.action,medium:document.activeElement?.dataset.medium}));if(focused.medium!=='water')await boundaryIssue('case-keyboard-focus-jumped',{expected:'water',focused});else checks.push('case keyboard handoff preserves the focused medium');
 await action('case','[data-case="0"]');await action('case-choice','[data-medium="air"]');await page.waitForTimeout(560);await action('case-choice','[data-medium="water"]');const grammar=await page.locator('#coach-hint').textContent();if(/물를/.test(grammar))await boundaryIssue('water-feedback-grammar',{text:grammar});else checks.push('water success feedback uses 물을');
 await demoLesson(16);await autoplay(16,'demo-diagnosis-auto');await action('diagnostic','[data-field="place"][data-value="library"]');await action('diagnostic','[data-field="situation"][data-value="reading"]');await action('diagnostic','[data-field="person"][data-value="drummer"]');const hint=await page.locator('#coach-hint').textContent();const target=await page.locator('.next-target,.next-choice-group').evaluateAll(es=>es.map(e=>({text:e.textContent,person:Boolean(e.matches('[data-field="person"]')||e.querySelector('[data-field="person"]'))})));if(!target.some(e=>e.person)&&!/다시|틀|불편한 사람|영향/.test(hint))await boundaryIssue('diagnosis-wrong-person-target',{hint,target});else checks.push('diagnosis wrong-person cue identifies retry area');
}
try{
 if(process.argv.includes('--map-early'))await page.route('**/image/generated/ullim-village.jpg',async r=>{events.push({type:'network-delay',url:r.request().url(),milliseconds:4500});await new Promise(resolve=>setTimeout(resolve,4500));await r.continue();});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.bringToFront();await page.waitForTimeout(350);
 if(!process.argv.includes('--resume'))assert.equal(await saved(),null,'fresh student profile has no saved progress');
 if(process.argv.includes('--map-early')){await action('start');await page.locator('.map-load-state').waitFor({state:'visible'});await click('.map-next','single-early-recommended-click');assert.equal(await page.locator('.map-load-state').isVisible(),true);await record('map-early-click-loading',{shot:true});await page.locator('.lesson-page[data-lesson="0"]').waitFor({timeout:25000});await record('map-early-click-arrived',{shot:true});checks.push('one real recommended-map click during delayed loading is queued and enters first lesson after art becomes ready');}
 else if(process.argv.includes('--small-existing')){assert.equal((await saved()).restored,true);await page.setViewportSize({width:360,height:740});await revisit(4);await range('#force',1);await record('360x740-drum-complete-long-force-label',{shot:true});await viewportRegressions([[830,515]]);}
 else if(process.argv.includes('--font-existing'))await fontProbeExisting();
 else if(process.argv.includes('--trace-existing'))await tracePointer();
 else if(boundaryOnly)await boundaryChecks();
 else{
 if(await domRoute()==='home'){await record('fresh-home',{shot:true});await action('start');await page.locator('.map-next').waitFor();await page.locator('.map-load-state').waitFor({state:'hidden',timeout:30000});await page.waitForTimeout(800);await record('fresh-map',{shot:true});await click('.map-next','recommended-first-facility');await page.locator('.lesson-page[data-lesson="0"]').waitFor({timeout:20000});}
 for(let i=Number((await domRoute()).split('/')[1])||0;i<20;i++){if(await domRoute()==='final'||await domRoute()==='result')break;await repairable(`lesson-${i}`,()=>playLesson(i));await repairable(`next-${i}`,()=>advance(i));console.log(`PASS lesson ${i}: ${lessons[i].title}`);await flush();}
 if(await domRoute()==='final')await repairable('final',finalQuestions);
 assert.equal(await domRoute(),'result');
 if(!process.env.QA_PRIMARY_ONLY)await repairable('viewport-regressions',viewportRegressions);
 }
 const sourceEnd=await hashes(),changed=Object.keys(sourceStart).filter(f=>sourceStart[f]!==sourceEnd[f]);
 if(run.startsWith('final'))assert.deepEqual(changed,[],'frozen final source remained unchanged');
 checks.push(`${boundaryOnly?'separate teacher-boundary demo':'student progress'} came exclusively from browser interactions; storage writes and seeded awards were never used`);
 await flush();await writeFile(path.join(out,'summary.json'),JSON.stringify({run,checks,auditStates:audits.length,runtime,issues,repairs,sourceStart,sourceEnd,changed,finalState:await saved()},null,2));console.log(JSON.stringify({run,checks:checks.length,audits:audits.length,runtime,issues:issues.length,repairs:repairs.length,changed,out}));
}catch(error){issues.push({fatal:true,current,lastAction,error:String(error)});await record('fatal',{shot:true,allowIssues:true}).catch(()=>{});await flush();throw error;}finally{await browser.close();io.close();}
