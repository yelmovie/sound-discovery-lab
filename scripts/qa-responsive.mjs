// Local browser QA. Profiles, cache, screenshots and reports stay beside the project on the external SSD.
import { chromium } from '/Volumes/T7 Shield/DevCaches/playwright-runner/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { freshState, recordEvidence, STORAGE_KEY } from '../src/model.js';
import { lessons, finalTasks } from '../src/data.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const phase=process.argv[2]||'baseline';
const modalOnly=process.env.QA_MODAL_ONLY==='1';
const out=path.join(root,'.tmp/responsive-20261108',phase);
const temp=path.join(root,'.tmp/responsive-20261108/tmp');
await mkdir(out,{recursive:true});await mkdir(temp,{recursive:true});
for(const key of ['TMPDIR','TMP','TEMP'])process.env[key]=temp;
const browser=await chromium.launchPersistentContext(path.join(out,'profile'),{
 executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,
 viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce',
 args:['--disable-crash-reporter','--disable-breakpad','--noerrdialogs','--use-mock-keychain',`--disk-cache-dir=${path.join(out,'cache')}`,`--crash-dumps-dir=${path.join(out,'crashes')}`]
});
const page=browser.pages()[0]||await browser.newPage();
page.setDefaultTimeout(20000);
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const base=process.env.QA_BASE||'http://127.0.0.1:4186';
const proofs={parts:['0','1','2','1'],rhythm:['울림,쉼,울림','울림,쉼,울림,쉼','울림,쉼,울림,쉼,울림'],signal:['1','3','2','1'],sort:['1,2,3','1,2,3'],melody:['18,12,6','6,12,18','12,6,18,12'],mix:['6,1','18,3','12,1','6,3'],sensor:['air','water','solid'],classify:['air','water','solid','air','water','solid'],solutions:['pad','volume','time','place'],festival:['balanced']};
const sourceWork=[{seen:['rubber','drum'],choice:0},{started:true,stopped:true,choice:1},{a:1,b:3,force:1},{heardA:true,heardB:true,pairKey:'1,3',choice:1},{lengths:[18,6],length:18,choice:0},{targetHeard:true,pattern:[18,6,12]},{media:['air','water','solid'],choice:1},{verified:{0:'air',1:'water',2:'solid'}},{heard:true,place:'library',situation:'reading',person:'reader'},{solutions:['pad'],before:true,after:true,afterKey:'pad',choice:0}];
function seed(n,finished=false){const s=freshState();s.settings={...s.settings,muted:true,bgm:false,sfx:false};for(let i=0;i<(finished?20:n);i++){const l=lessons[i];s.work[i]=l.challenge?{challenge:{proof:proofs[l.challenge]}}:structuredClone(sourceWork[l.base]);const r=recordEvidence(s,i);if(!r.ok)throw Error(`Bad QA seed ${i}: ${r.message}`);}s.lastRoute=n<20?`lesson/${n}`:'final';return s;}
async function open(s){if(!page.url().startsWith(base))await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s,key:STORAGE_KEY});await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,2500))]);window.scrollTo(0,0);for(const e of document.querySelectorAll('.lesson-page,.experiment-board,.research-panel'))e.scrollTop=0;});}
function audit(){
 const scope=document.querySelector('dialog[open]')||document;
 const issues=[],visible=e=>{if(e.closest('[hidden],.sr-only,.visually-hidden,dialog:not([open])'))return false;for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||+c.opacity<.05)return false;if(p.tagName==='DETAILS'&&!p.open){const summary=[...p.children].find(x=>x.tagName==='SUMMARY');if(!summary?.contains(e))return false;}}return e.getBoundingClientRect().width>1;};
 const rect=e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};};
 const name=e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().replace(/\s+/g,' ').slice(0,55);
 const add=(type,e,detail)=>issues.push({type,text:name(e),class:e.className?.baseVal??e.className,rect:rect(e),detail});
 const scrolls=p=>{const c=getComputedStyle(p);return /auto|scroll/.test(c.overflowY)&&p.scrollHeight>p.clientHeight+3;};
 const inView=r=>r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
 const documentScrolls=(document.scrollingElement?.scrollHeight||0)>innerHeight+3&&getComputedStyle(document.documentElement).overflowY!=='hidden'&&getComputedStyle(document.body).overflowY!=='hidden';
 const revealable=e=>{const saved=[];for(let p=e.parentElement;p;p=p.parentElement)saved.push([p,p.scrollLeft,p.scrollTop]);const before=[scrollX,scrollY];e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),ok=inView(r)&&hit&&(e.contains(hit)||hit.contains(e));for(const [p,x,y]of saved){p.scrollLeft=x;p.scrollTop=y;}window.scrollTo(...before);return ok;};
 if(document.documentElement.scrollWidth>innerWidth+2)issues.push({type:'document-horizontal-overflow',detail:document.documentElement.scrollWidth-innerWidth});
 for(const e of scope.querySelectorAll('button,input,summary,select,textarea')){
  if(!visible(e))continue;const r=e.getBoundingClientRect();
  if(r.width<43.5||r.height<43.5)add('small-target',e,`${r.width.toFixed(1)}×${r.height.toFixed(1)}; minimum 44px`);
  let p=e.parentElement,canScroll=false,clippedCenter=false;
  for(;p;p=p.parentElement){const c=getComputedStyle(p),b=p.getBoundingClientRect();if(scrolls(p))canScroll=true;if(/auto|scroll|hidden|clip/.test(c.overflowY)&&(r.top+r.height/2<b.top||r.top+r.height/2>b.bottom))clippedCenter=true;}
  if(!inView(r)&&!canScroll&&!documentScrolls&&!scrolls(document.documentElement)&&!scrolls(document.body))add('unreachable',e,'outside viewport without scroll ancestor');
  if(inView(r)&&!clippedCenter){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit)&&!hit.contains(e)&&!((canScroll||documentScrolls)&&revealable(e)))add('covered-control',e,`${hit.tagName}.${hit.className}`);}
 }
 for(const e of scope.querySelectorAll('img'))if(visible(e)&&e.complete&&!e.naturalWidth)add('broken-image',e,e.src);
 for(const e of scope.querySelectorAll('.chapter.current')){const c=getComputedStyle(e);if(visible(e)&&c.color==='rgb(255, 255, 255)'&&c.backgroundColor==='rgba(0, 0, 0, 0)')add('selected-tab-contrast',e,'white label with transparent active-tab background');}
 const w=document.createTreeWalker(scope===document?(document.querySelector('main')||document.body):scope,NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){
  if(!n.textContent.trim()||!visible(n.parentElement))continue;
  const e=n.parentElement,range=document.createRange();range.selectNodeContents(n);const rects=[...range.getClientRects()].filter(r=>r.width>1&&r.height>1);
  const control=e.closest('button'),block=e.closest('button,p,h1,h2,h3,label,legend,.stage-badge,.chapter');
  for(const r of rects){
   if(block){const b=block.getBoundingClientRect();if(r.left<b.left-3||r.right>b.right+3)add('text-overflow',block,n.textContent.trim().slice(0,70));}
   let reachableByScroll=false;
   for(let p=e;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p);if(scrolls(p))reachableByScroll=true;if(/hidden|clip/.test(c.overflowY)||/hidden|clip/.test(c.overflowX)){const b=p.getBoundingClientRect();if((/hidden|clip/.test(c.overflowX)&&(r.left<b.left-3||r.right>b.right+3))||(!reachableByScroll&&/hidden|clip/.test(c.overflowY)&&(r.top<b.top-3||r.bottom>b.bottom+3))){add('text-clipped',p,n.textContent.trim().slice(0,70));break;}}}
   if(control)for(const icon of control.querySelectorAll('svg.icon')){const b=icon.getBoundingClientRect();if(Math.min(b.right,r.right)-Math.max(b.left,r.left)>3&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>3)add('text-icon-overlap',control,n.textContent.trim().slice(0,70));}
  }
 }
 const unique=[...new Map(issues.map(i=>[`${i.type}|${i.text}|${i.detail}`,i])).values()];
 return {title:document.querySelector('main h1')?.textContent,challenge:document.querySelector('[data-challenge]')?.dataset.challenge,issues:unique,board:document.querySelector('.experiment-board')?rect(document.querySelector('.experiment-board')):null};
}
const vps=process.env.QA_SIZES?process.env.QA_SIZES.split(',').map(x=>x.split('x').map(Number)):modalOnly?[]:process.env.QA_NARROW?[[1024,600],[915,412],[740,360],[390,844],[360,740]]:process.env.QA_QUICK?[[1280,800],[915,412],[390,844]]:[[1920,1080],[1366,768],[1280,800],[1024,600],[915,412],[740,360],[390,844],[360,740]];
const results=[];
const interactions=[];
const click=async selector=>{await page.locator(selector).click();await page.waitForTimeout(100);};
const action=async(name,attrs='')=>click(`[data-action="${name}"]${attrs}`);
async function input(selector,value){await page.locator(selector).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},value);await page.waitForTimeout(100);}
async function inspect(name,viewport){const data=await page.evaluate(audit);const vp=page.viewportSize(),fullPage=vp.width>1100&&vp.height>620;await page.screenshot({path:path.join(out,`${viewport}-${name}.png`),fullPage});if(/^(long-round|error-|completed)/.test(name)){await page.evaluate(()=>{for(const e of document.querySelectorAll('.experiment-board,.research-panel,.lesson-page'))e.scrollTop=e.scrollHeight;window.scrollTo(0,document.documentElement.scrollHeight);});data.bottomIssues=(await page.evaluate(audit)).issues;await page.screenshot({path:path.join(out,`${viewport}-${name}-bottom.png`),fullPage});}results.push({name,viewport,...data});return data;}
try{
 for(const [width,height]of vps){
  await page.setViewportSize({width,height});
  for(let i=0;i<20;i++){
   await open(seed(i));
   const expected=lessons[i].title,actual=await page.locator('main h1').textContent();if(actual!==expected)throw Error(`Route mismatch ${i}: ${actual}`);
   const top=await page.evaluate(audit);
   if(phase==='baseline'||i%4===0||top.issues.length)await page.screenshot({path:path.join(out,`${width}x${height}-lesson-${i}.png`),fullPage:width>1100&&height>620});
   await page.evaluate(()=>{for(const e of document.querySelectorAll('.experiment-board,.research-panel,.lesson-page'))e.scrollTop=e.scrollHeight;window.scrollTo(0,document.documentElement.scrollHeight);});
   const bottom=await page.evaluate(audit);
   results.push({viewport:`${width}x${height}`,lesson:i,...top,bottomIssues:bottom.issues});
   if(i%5===4)console.log(`${phase} ${width}x${height}: ${i+1}/20`);
  }
  console.log(`${phase} ${width}x${height}: ${results.slice(-20).reduce((n,r)=>n+r.issues.length+r.bottomIssues.length,0)} issue records`);
  await writeFile(path.join(out,'results.json'),JSON.stringify({phase,results,errors},null,2));
 }
 if(!process.env.QA_ACTIVITY_ONLY){
 for(const [width,height] of [[1280,800],[915,412],[390,844]]){
  await page.setViewportSize({width,height});const vp=`${width}x${height}`;
  if(!modalOnly)for(const route of ['home','final','result']){const s=seed(20,true);s.lastRoute=route;if(route==='result'){s.finalAnswers=Object.fromEntries(finalTasks.map((t,i)=>[i,t.answer]));s.restored=true;s.completedAt='2026-11-08T03:00:00.000Z';}await open(s);await inspect(route,vp);}
  await open(seed(8));
  for(const modal of ['settings','notebook','concept']){if(await page.locator(`[data-action="${modal}"]`).count()===0)await action('activity-tools');await action(modal);await inspect(`modal-${modal}`,vp);await page.locator('.modal-body').evaluate(e=>e.scrollTop=e.scrollHeight);results.push({name:`modal-${modal}-bottom`,viewport:vp,...await page.evaluate(audit)});await click('.modal-heading [data-action="close"]');}
 }
 if(!modalOnly){
 // Longest rounds and completed evidence at a narrow viewport.
 for(const [width,height]of [[360,740],[915,412]]){
  await page.setViewportSize({width,height});const vp=`${width}x${height}`;
  for(const [i,work]of [[2,{challenge:{proof:proofs.parts.slice(0,2)}}],[2,{challenge:{proof:proofs.parts.slice(0,3)}}],[3,{challenge:{proof:proofs.rhythm.slice(0,2),sequence:['울림','쉼','울림','쉼']}}],[10,{challenge:{proof:proofs.melody.slice(0,2)}}],[15,{challenge:{proof:proofs.classify.slice(0,5)}}],[18,{challenge:{proof:proofs.solutions.slice(0,2)}}]]){const s=seed(i);s.work[i]=work;await open(s);await inspect(`long-round-${i}-${work.challenge.proof.length}`,vp);}
  const complete=seed(20,true);complete.lastRoute='lesson/19';await open(complete);await inspect('completed-19',vp);
  await open(seed(11));await page.waitForTimeout(350);await action('challenge-check');await inspect('error-mix',vp);
  await open(seed(18));await page.waitForTimeout(350);await action('challenge-solution','[data-value="volume"]');await action('challenge-before');await action('challenge-after');await inspect('error-solution',vp);
 }
 // Actual event handlers: comparison capture, accessible ruler updates and one full trial of all ten challenge types.
 await page.setViewportSize({width:1024,height:600});
 await open(seed(4));await page.waitForTimeout(350);await action('hit');await input('#force',3);await action('hit');
 let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);assert.deepEqual([saved.work[4].a,saved.work[4].b],[1,3]);assert.ok(saved.evidence[4]);interactions.push('drum A/B automatic evidence');
 await open(seed(8));await page.waitForTimeout(350);await input('#ruler-length',6);assert.match(await page.locator('.illustrated-bench .illustrated-ruler').getAttribute('aria-label'),/6/);await input('#ruler-length',12);assert.match(await page.locator('#ruler-length').getAttribute('aria-valuetext'),/12/);await action('choice','[data-choice="0"]');saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);assert.ok(saved.evidence[8]);interactions.push('ruler input, image aria, slider aria and evidence');
 for(const [i,id] of [[2,'parts'],[3,'rhythm'],[6,'signal'],[7,'sort'],[10,'melody'],[11,'mix'],[14,'sensor'],[15,'classify'],[18,'solutions'],[19,'festival']]){
  await open(seed(i));await page.waitForTimeout(350);
  if(id==='parts'){await action('challenge-listen');await action('challenge-select','[data-value="0"]');}
  if(id==='rhythm'){for(const a of ['ring','rest','ring'])await action(`challenge-${a}`);}
  if(id==='signal')await action('challenge-strike');
  if(id==='sort'){for(const [v,slot]of [[1,0],[0,1],[2,2]]){await action('challenge-parcel',`[data-value="${v}"]`);await action('challenge-slot',`[data-value="${slot}"]`);}}
  if(id==='melody'){await action('challenge-listen');for(const n of [18,12,6])await action('challenge-note',`[data-value="${n}"]`);}
  if(id==='mix'){await input('#mix-length',6);await action('challenge-check');}
  if(id==='sensor'||id==='classify')await action('challenge-zone','[data-value="air"]');
  if(id==='solutions'){await action('challenge-solution','[data-value="pad"]');await action('challenge-before');await action('challenge-after');}
  if(id==='festival'){await input('#festival-music',1);await input('#festival-announcement',2);await action('challenge-pads');}
  assert.equal(await page.locator('.challenge-shell').getAttribute('data-round'),'1',`UI trial ${id}`);interactions.push(`challenge ${id} round 1`);
  results.push({name:`interaction-${id}`,viewport:'1024x600',...await page.evaluate(audit)});
 }
 // Teacher mode needs live opt-in; seed flags alone must never enable it.
 await page.setViewportSize({width:1024,height:600});await open(seed(0));
 await page.locator('[data-action="settings"]').click();
 await page.locator('[data-action="admin"]').evaluate(e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
 await page.locator('[data-action="admin"]').click();await page.locator('.modal-heading [data-action="close"]').click();
 for(let i=0;i<20;i++){
  const top=await page.evaluate(audit);results.push({viewport:'1024x600',lesson:i,mode:'teacher',...top});
  if(i<19){if(await page.locator('.admin-arrow[data-action="goto"][aria-label="다음 단계"]').count()===0)await action('activity-tools');await page.locator('.admin-arrow[data-action="goto"][aria-label="다음 단계"]').click();await page.waitForTimeout(80);}
 }
 }
 }
 const counts={};for(const r of results)for(const i of [...r.issues,...(r.bottomIssues||[])])counts[i.type]=(counts[i.type]||0)+1;
 await writeFile(path.join(out,'results.json'),JSON.stringify({phase,results,errors,counts,interactions},null,2));
 console.log(JSON.stringify({phase,screens:results.length,counts,errors,interactions,out}));
}finally{await browser.close();}
