// Strict single-screen QA: scrolling never excuses a hidden or off-screen learning control.
import {chromium} from '/Volumes/T7 Shield/DevCaches/playwright-runner/node_modules/playwright/index.mjs';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {freshState,normalize,recordEvidence,STORAGE_KEY} from '../src/model.js';
import {lessons} from '../src/data.js';

const root=fileURLToPath(new URL('../',import.meta.url)),phase=process.argv[2]||'baseline';
const out=path.join(root,'.tmp/single-screen-20261108',phase),temp=path.join(root,'.tmp/single-screen-20261108/tmp');
await mkdir(out,{recursive:true});await mkdir(temp,{recursive:true});
for(const name of ['TMPDIR','TMP','TEMP'])process.env[name]=temp;
const base=process.env.QA_BASE||'http://127.0.0.1:4186';
const proofs={parts:['0','1','2','1'],rhythm:['울림,쉼,울림','울림,쉼,울림,쉼','울림,쉼,울림,쉼,울림'],signal:['1','3','2','1'],sort:['1,2,3','1,2,3'],melody:['18,12,6','6,12,18','12,6,18,12'],mix:['6,1','18,3','12,1','6,3'],sensor:['air','water','solid'],classify:['air','water','solid','air','water','solid'],solutions:['pad','volume','time','place'],festival:['balanced']};
const sourceWork=[{seen:['rubber','drum'],choice:0},{started:true,stopped:true,choice:1},{a:1,b:3,force:1},{heardA:true,heardB:true,pairKey:'1,3',choice:1},{lengths:[18,6],length:18,choice:0},{targetHeard:true,pattern:[18,6,12]},{media:['air','water','solid'],choice:1},{verified:{0:'air',1:'water',2:'solid'}},{heard:true,place:'library',situation:'reading',person:'reader'},{solutions:['pad'],before:true,after:true,afterKey:'pad',choice:0}];
function seed(n,finished=false){const s=freshState();s.settings={...s.settings,muted:true,bgm:false,sfx:false};for(let i=0;i<(finished?20:n);i++){const l=lessons[i];s.work[i]=l.challenge?{challenge:{proof:proofs[l.challenge]}}:structuredClone(sourceWork[l.base]);assert.ok(recordEvidence(s,i).ok,`seed ${i}`);}if(!finished)s.work[n]=lessons[n].challenge?{challenge:{}}:{};s.lastRoute=`lesson/${n}`;return s;}
const A=(name,count=1)=>[`[data-action="${name}"]`,count];
const required=[
 [A('instrument',4),A('choice',2)],[A('fork-start'),A('fork-stop'),A('choice',2)],
 [A('challenge-listen'),A('challenge-select',3)],[A('challenge-ring'),A('challenge-rest'),A('challenge-clear')],
 [A('hit'),['#force',1]],[A('sample-play',2),A('choice',2)],
 [A('challenge-strike'),['#signal-force',1]],[A('challenge-parcel',3),A('challenge-slot',3)],
 [['#ruler-length',1],A('pluck'),A('choice',2)],[A('target'),A('note',3),A('pattern-reset')],
 [A('challenge-listen'),A('challenge-note',3),A('challenge-clear')],[['#mix-length',1],['#mix-force',1],A('challenge-check')],
 [A('medium',3),A('choice',2)],[A('case',3),A('case-choice',3)],
 [A('challenge-zone',3)],[A('challenge-zone',3)],
 [A('noise-scene'),A('diagnostic',6)],[A('solution',3),A('noise-before'),A('noise-after'),A('choice',2)],
 [A('challenge-solution',4),A('challenge-before'),A('challenge-after')],
 [['#festival-music',1],['#festival-announcement',1],A('challenge-pads'),A('challenge-preview')]
];
const browser=await chromium.launchPersistentContext(path.join(out,'profile'),{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,viewport:{width:1280,height:800},deviceScaleFactor:1,reducedMotion:'reduce',args:['--disable-crash-reporter','--disable-breakpad','--noerrdialogs','--use-mock-keychain',`--disk-cache-dir=${path.join(out,'cache')}`,`--crash-dumps-dir=${path.join(out,'crashes')}`]});
const page=browser.pages()[0]||await browser.newPage();page.setDefaultTimeout(20000);
const errors=[],results=[],checks=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const snapshot={};
for(const file of ['index.html',...(await readdir(path.join(root,'src'))).filter(f=>!f.startsWith('._')&&/\.(js|css)$/.test(f)).map(f=>'src/'+f)]){const body=await readFile(path.join(root,file),'utf8');snapshot['/'+file]={body,hash:createHash('sha256').update(body).digest('hex')};}
snapshot['/']=snapshot['/index.html'];
if(phase==='baseline'){
 await page.route('**/*',async route=>{const url=new URL(route.request().url()),item=url.origin===base?snapshot[url.pathname]:null;if(item)await route.fulfill({status:200,contentType:url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.js')?'text/javascript':'text/html',body:item.body});else await route.continue();});
}
async function open(s){if(!page.url().startsWith(base))await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s,key:STORAGE_KEY});await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,1500))]);for(const e of document.querySelectorAll('.lesson-page,.experiment-board,.research-panel'))e.scrollTop=0;window.scrollTo(0,0);await Promise.race([new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),new Promise(r=>setTimeout(r,400))]);});}
function audit({requirements=[],quick=false,expectedTarget='',debug=false}={}){
 const issues=[],main=document.querySelector('.lesson-page'),board=document.querySelector('.experiment-board');
 const visible=e=>{if(!e||e.closest('[hidden],.sr-only,.visually-hidden,dialog:not([open])'))return false;for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||+c.opacity<.05)return false;if(p.tagName==='DETAILS'&&!p.open){const s=[...p.children].find(x=>x.tagName==='SUMMARY');if(!s?.contains(e))return false;}}const r=e.getBoundingClientRect();return r.width>1&&r.height>1;};
 const box=e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x*10)/10,y:Math.round(r.y*10)/10,w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10};};
 const label=e=>(e.getAttribute('aria-label')||e.textContent||e.id).trim().replace(/\s+/g,' ').slice(0,70);
 const add=(type,e,detail)=>issues.push({type,label:e?label(e):'',class:e?.className?.baseVal??e?.className,rect:e?box(e):null,detail});
 const inside=r=>r.left>=-2&&r.right<=innerWidth+2&&r.top>=-2&&r.bottom<=innerHeight+2;
 const clipped=e=>{const r=e.getBoundingClientRect();for(let p=e.parentElement;p;p=p.parentElement){const c=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(c.overflowY)&&(r.top<b.top-2||r.bottom>b.bottom+2))return true;if(/auto|scroll|hidden|clip/.test(c.overflowX)&&(r.left<b.left-2||r.right>b.right+2))return true;}return false;};
 const containers=[document.documentElement,document.body,main,board,...document.querySelectorAll('.experiment-content,.lesson-scene,.challenge-shell,.challenge-workspace,.research-panel,.lesson-actions,.lesson-footer,.activity-footer')].filter(Boolean);
 for(const e of main?.querySelectorAll('*')||[]){const c=getComputedStyle(e);if(/auto|scroll/.test(c.overflowX+' '+c.overflowY))containers.push(e);}
 const metrics=[...new Set(containers)].filter(e=>visible(e)||e===document.documentElement||e===document.body).map(e=>({element:e.tagName+'.'+(e.className?.baseVal??e.className??''),height:e.clientHeight,contentHeight:e.scrollHeight,width:e.clientWidth,contentWidth:e.scrollWidth,rect:box(e)}));
 for(const m of metrics){if(m.contentHeight>m.height+3)add('vertical-overflow',null,m);if(m.contentWidth>m.width+3)add('horizontal-overflow',null,m);}
 let outside=0,hidden=0,minimumTarget=Infinity,minimumFont=Infinity,minimumFontLabel='';
 const controls=[...(main?.querySelectorAll('button,input,select,textarea')||[])];
 for(const e of controls){if(!visible(e)){hidden++;continue;}const r=e.getBoundingClientRect();minimumTarget=Math.min(minimumTarget,r.width,r.height);if(!inside(r)){outside++;add('offscreen-control',e,'scrolling is not accepted');}if(clipped(e))add('clipped-control',e,'control not fully inside clipping ancestors');if(quick)continue;if(r.width<43.5||r.height<43.5)add('small-target',e,`${r.width.toFixed(1)}×${r.height.toFixed(1)}; target 44px`);if(inside(r)&&!clipped(e)){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit)&&!hit.contains(e))add('covered-control',e,`${hit.tagName}.${hit.className}`);}}
 for(const [selector,count]of requirements){const found=[...document.querySelectorAll(selector)];if(found.length<count)add('missing-essential-control',null,{selector,expected:count,actual:found.length});for(const e of found)if(!visible(e))add('hidden-essential-control',e,selector);}
 const footer=document.querySelector('.activity-footer'),hint=document.querySelector('#coach-hint'),targets=[...document.querySelectorAll('.next-target,.next-choice-group')].filter(visible);
 if(!quick){
  if(!visible(footer))add('missing-single-guidance-footer',footer,'expected .activity-footer');
  if(!visible(hint)||document.querySelectorAll('#coach-hint').length!==1)add('missing-single-guidance',hint,'expected one visible #coach-hint');
  if(targets.length!==1)add('next-action-target-count',null,{expected:1,actual:targets.length});
  if(expectedTarget&&!targets.some(e=>e.matches(expectedTarget)||e.querySelector(expectedTarget)))add('next-target-does-not-advance',null,{expectedTarget,actual:targets.map(e=>label(e))});
  for(const e of main?.querySelectorAll('img')||[])if(visible(e)&&e.complete&&!e.naturalWidth)add('broken-image',e,e.src);
  const walk=document.createTreeWalker(main||document.body,NodeFilter.SHOW_TEXT),sentences=new Map();let n;
  while(n=walk.nextNode()){
   const text=n.textContent.trim();if(!text||!visible(n.parentElement))continue;const e=n.parentElement,range=document.createRange();range.selectNodeContents(n);const rs=[...range.getClientRects()].filter(r=>r.width>1&&r.height>1),control=e.closest('button'),block=e.closest('button,p,h1,h2,h3,label,legend,.stage-badge,.chapter');
   let renderedFont=parseFloat(getComputedStyle(e).fontSize);for(let p=e;p&&p!==document.body;p=p.parentElement){const style=getComputedStyle(p),transform=style.transform;if(transform!=='none'){const matrix=new DOMMatrix(transform);renderedFont*=Math.hypot(matrix.a,matrix.b);}renderedFont*=parseFloat(style.zoom)||1;}if(renderedFont<minimumFont){minimumFont=renderedFont;minimumFontLabel=text.slice(0,45);}
   const readingFloor=innerWidth>=1800?18:innerWidth>=900?14:0;if(readingFloor&&renderedFont<readingFloor-.1)add('small-reading-text',e,{actual:renderedFont,minimum:readingFloor,text:text.slice(0,45)});
   if(text.replace(/\s+/g,'').length>=12){const normalized=text.replace(/\s+/g,' ');sentences.set(normalized,(sentences.get(normalized)||0)+1);}
   for(const r of rs){if(block){const b=block.getBoundingClientRect();if(r.left<b.left-2||r.right>b.right+2)add('text-overflow',block,text.slice(0,80));}
    for(let p=e;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p),b=p.getBoundingClientRect();if((/hidden|clip|auto|scroll/.test(c.overflowX)&&(r.left<b.left-2||r.right>b.right+2))||(/hidden|clip|auto|scroll/.test(c.overflowY)&&(r.top<b.top-2||r.bottom>b.bottom+2))){add('text-clipped',p,text.slice(0,80));break;}}
    if(control)for(const icon of control.querySelectorAll('svg.icon')){const b=icon.getBoundingClientRect();if(Math.min(b.right,r.right)-Math.max(b.left,r.left)>3&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>3)add('text-icon-overlap',control,text.slice(0,80));}
   }
  }
  for(const [text,count]of sentences)if(count>1)add('duplicate-copy',null,{text,count});
 }
 const unique=[...new Map(issues.map(x=>[JSON.stringify([x.type,x.label,x.detail]),x])).values()];
 const detailBoxes=debug?[...main.querySelectorAll('.challenge-workspace,.hotspot-scene,.challenge-object,.challenge-object-art,.prop-assembly,.prop-img,.labelled-choices,.labelled-choices .choice,.festival-controls,.festival-controls fieldset,.festival-controls legend,.festival-controls .mixer-channel,.festival-controls .mixer-title,.festival-controls .range-ticks,.festival-controls button,.festival-controls input')].map(e=>{const c=getComputedStyle(e);return {tag:e.tagName,class:e.className,label:label(e),rect:box(e),clientH:e.clientHeight,scrollH:e.scrollHeight,clientW:e.clientWidth,scrollW:e.scrollWidth,gridRows:c.gridTemplateRows,gridColumns:c.gridTemplateColumns,gap:c.gap,padding:c.padding,height:c.height,minHeight:c.minHeight,zoom:c.zoom,transform:c.transform};}):undefined;
 return {title:main?.querySelector('h1')?.textContent,viewport:[innerWidth,innerHeight],metrics,controlCount:controls.length,outsideControls:outside,hiddenControls:hidden,minimumTarget:Number.isFinite(minimumTarget)?Math.round(minimumTarget*10)/10:null,minimumFont:Number.isFinite(minimumFont)?Math.round(minimumFont*10)/10:null,minimumFontLabel,fitScale:board?.dataset.fitScale,guidance:hint?.textContent,nextTargets:targets.map(e=>({label:label(e),class:e.className,rect:box(e)})),issues:unique,actions:[...new Set(controls.map(e=>e.dataset.action||e.id))],detailBoxes};
}
async function measure(name,i,requirements=required[i],expectedTarget=''){const data=await page.evaluate(audit,{quick:phase==='baseline',requirements,expectedTarget,debug:phase.includes('debug')});assert.equal(data.title,lessons[i].title,`actual route ${i}`);results.push({name,lesson:i,...data});if(phase!=='baseline'&&(phase.startsWith('probe')||i%4===0||data.issues.length))await page.screenshot({path:path.join(out,`${data.viewport.join('x')}-${name}.png`)});return data;}
async function save(){const counts={};for(const r of results)for(const i of r.issues)counts[i.type]=(counts[i.type]||0)+1;await writeFile(path.join(out,'results.json'),JSON.stringify({phase,results,counts,checks,errors,sourceHashes:Object.fromEntries(Object.entries(snapshot).map(([k,v])=>[k,v.hash]))},null,2));return counts;}
const action=async(name,attrs='')=>{await page.locator(`[data-action="${name}"]${attrs}`).click();await page.waitForTimeout(80);};
// Legacy observations gain empty challenge defaults on the first two normalizations.
// Compare the stable representation so default fields are not mistaken for experiment mutations.
const saved=async()=>normalize(normalize(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY)));
const playerState=()=>page.locator('.autoplay-controls').getAttribute('data-player-state');
async function awaitPlayerEnd(){await page.waitForFunction(()=>['waiting','complete'].includes(document.querySelector('.autoplay-controls')?.dataset.playerState),{},{timeout:16000});}
async function autoChecks(){
 await page.setViewportSize({width:1280,height:800});await open(seed(0));
 assert.deepEqual(await page.locator('#experiment-speed option').evaluateAll(es=>es.map(e=>e.value)),['0.5','1','1.5','2']);
 for(const value of ['0.5','1','1.5','2']){await page.locator('#experiment-speed').selectOption(value);assert.equal(await page.locator('#experiment-speed').inputValue(),value);}checks.push('all four speed options accept real selection');
 await page.locator('#experiment-speed').selectOption('2');await action('auto-play');assert.equal(await playerState(),'playing');await action('auto-play');assert.equal(await playerState(),'paused');const paused=structuredClone((await saved()).work[0]);await page.waitForTimeout(550);assert.deepEqual((await saved()).work[0],paused);await action('auto-play');await awaitPlayerEnd();const observed=await saved();assert.equal(observed.work[0]?.choice,undefined);assert.equal(observed.evidence[0],undefined);assert.ok(observed.work[0]?.seen?.length>=2);checks.push('play/pause/resume/speed2 and observed objects without automatic answer');
 for(const [i,id]of [[2,'parts'],[3,'rhythm'],[6,'signal'],[7,'sort'],[10,'melody'],[11,'mix'],[14,'sensor'],[15,'classify'],[18,'solutions'],[19,'festival']]){
  await open(seed(i));await page.locator('#experiment-speed').selectOption('2');const before=await saved();await action('auto-play');await awaitPlayerEnd();const after=await saved();assert.deepEqual(after.work[i]?.challenge?.proof||[],before.work[i]?.challenge?.proof||[],`automatic proof ${id}`);for(const field of ['selected','slots','sequence','zone','solution','pads','length','force','music','announcement'])if(!(id==='sort'&&field==='selected'))assert.deepEqual(after.work[i]?.challenge?.[field],before.work[i]?.challenge?.[field],`automatic answer ${id}.${field}`);assert.deepEqual(after.evidence,before.evidence,`evidence unchanged in fresh ${id}`);checks.push(`automatic ${id}: no answer, proof or evidence fabrication`);await measure(`automatic-${id}`,i);await save();console.log(`automatic ${id}: passed`);
 }
 await open(seed(18));await action('challenge-solution','[data-value="volume"]');await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await awaitPlayerEnd();let chosen=await saved();assert.equal(chosen.work[18]?.challenge?.solution,'volume');assert.equal(chosen.work[18]?.challenge?.proof?.length||0,0);checks.push('automatic observation preserves an already chosen wrong solution');
 await open(seed(18));await action('challenge-solution','[data-value="pad"]');await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.work[18]?.challenge?.proof?.length===1,STORAGE_KEY);await page.waitForTimeout(700);chosen=await saved();assert.equal(chosen.work[18]?.challenge?.proof?.length,1);checks.push('student-chosen correct solution completes exactly one observed round');
 await open(seed(0));await page.evaluate(async()=>{const {SoundEngine}=await import('/src/audio.js'),original=SoundEngine.prototype.play;window.__qaSoundInputs=[];SoundEngine.prototype.play=function(options){window.__qaSoundInputs.push({frequency:options.frequency,level:options.level??null,duration:options.duration??null,kind:options.kind??null});return original.call(this,options);};});await page.locator('#experiment-speed').selectOption('1');await action('auto-play');await action('auto-stop');await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await action('auto-stop');const sounds=await page.evaluate(()=>window.__qaSoundInputs);assert.ok(sounds.length>=2);assert.deepEqual(sounds[0],sounds[1]);checks.push('speed1 and speed2 send identical pitch, level and sound duration to the sound engine');
 await action('auto-play');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);await measure('playing-live-resize-0',0);await action('auto-play');await measure('paused-live-resize-0',0);await action('auto-stop');await page.setViewportSize({width:1280,height:800});
 await open(seed(0));await action('auto-play');await action('settings');assert.equal(await playerState(),'idle');await page.locator('.modal-heading [data-action="close"]').click();assert.equal(await playerState(),'idle');checks.push('modal opening stops player and closing does not resume');
 await open(seed(11));await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await page.waitForFunction(()=>document.querySelector('.mix-device .illustrated-ruler')?.getAttribute('aria-label')?.includes('6 센티미터'),{},{timeout:6000});await action('settings');assert.equal(await playerState(),'idle');assert.match(await page.locator('.mix-device .illustrated-ruler').getAttribute('aria-label'),/18 센티미터/);await page.locator('.modal-heading [data-action="close"]').click();assert.equal((await saved()).work[11]?.challenge?.length,undefined);checks.push('modal cancellation restores original experiment picture after temporary preview');
 await open(seed(1));await page.locator('#experiment-speed').selectOption('2');await action('auto-play');await action('auto-play');await page.waitForTimeout(4200);await action('auto-play');await awaitPlayerEnd();const fork=await saved();assert.equal(fork.work[1]?.started,true);assert.equal(fork.work[1]?.stopped,true);assert.equal(fork.work[1]?.choice,undefined);checks.push('resuming after the original sound expires re-observes and can stop the fork');
 await open(seed(0));
 await action('auto-play');await action('instrument','[data-tool="rubber"]');assert.equal(await playerState(),'idle');checks.push('manual action stops automatic player');
 await action('auto-play');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await playerState(),'idle');await page.evaluate(()=>delete document.hidden);checks.push('visibilitychange hidden handler stops player');
 await action('auto-play');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));assert.equal(await playerState(),'idle');const hidden=await saved();await page.waitForTimeout(1000);assert.deepEqual((await saved()).work,hidden.work);checks.push('pagehide cancels observation scheduler and pending work mutations');
 await action('auto-play');await action('home');assert.equal(await page.locator('.autoplay-controls').count(),0);const left=await saved();await page.waitForTimeout(1200);assert.deepEqual((await saved()).work,left.work);checks.push('navigation stops pending observation mutations');
}
async function auxiliaryChecks(){
 await page.setViewportSize({width:1280,height:800});await open(seed(8));await action('activity-tools');await action('notebook');assert.match(await page.locator('dialog').getAttribute('aria-label'),/증거 노트/);assert.equal((await page.locator('.notebook-tabs .current').textContent()).trim(),'높낮이');await page.locator('.modal-heading [data-action="close"]').click();assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'activity-tools');checks.push('auxiliary notebook opens correct stage and returns focus to tools');
 await action('activity-tools');await action('concept');assert.equal(await page.locator('dialog video').count(),1);assert.equal(await page.locator('dialog track[kind="captions"]').count(),1);await page.locator('.modal-heading [data-action="close"]').click();assert.equal(await page.evaluate(()=>document.activeElement?.dataset.action),'activity-tools');checks.push('auxiliary concept video retains captions and returns focus to tools');
 const final=seed(0,true);final.lastRoute='final';await open(final);assert.equal(await page.locator('.final-focus').count(),1);await action('final-choice','[data-question="0"][data-choice="0"]');await page.waitForTimeout(700);assert.ok(await page.locator('[data-question="1"]').count());const value=await saved();assert.equal(value.finalAnswers[0],0);assert.equal(value.restored,false);checks.push('final question selection advances while restoration still requires completion');
}
async function cueChecks(){for(const [width,height]of [[1280,800],[915,412],[740,360],[390,844],[360,740]]){await page.setViewportSize({width,height});await open(seed(11));await action('challenge-check');await measure('error-mix',11,required[11],'#mix-length,#mix-force');await open(seed(18));await action('challenge-solution','[data-value="volume"]');await action('challenge-before');await action('challenge-after');await measure('error-solution',18,required[18],'[data-action="challenge-solution"]');}checks.push('wrong mix redirects to adjustment controls without choosing a value');checks.push('wrong solution redirects to tool choices without choosing a tool');for(const [width,height]of [[1920,1080],[1280,800],[390,844]]){await page.setViewportSize({width,height});await open(seed(0));await measure('lesson-0',0);}checks.push('ruler card layout remains visible at board, tablet and portrait sizes');}
const probe=phase.startsWith('probe'),autoOnly=phase==='auto',cueOnly=phase==='cue',focused=phase.includes('focused'),worst=phase.includes('worst'),debug=phase.includes('debug'),ids=debug?[2,11,14,19]:focused?[8,12,16]:probe&&!worst?[0,8,12,16,19]:Array.from({length:20},(_,i)=>i);
const vps=autoOnly||cueOnly?[]:focused?[[1024,600],[390,844]]:worst||debug?[[740,360],[360,740]]:phase==='baseline'||probe?[[1280,800],[915,412],[390,844]]:[[1920,1080],[1366,768],[1280,800],[1024,768],[1024,600],[915,412],[740,360],[390,844],[360,740]];
try{
 for(const [width,height]of vps){await page.setViewportSize({width,height});for(const i of ids){await open(seed(i));await measure(`lesson-${i}`,i);}console.log(JSON.stringify({phase,viewport:`${width}x${height}`,states:ids.length,outsideControls:results.slice(-ids.length).reduce((n,r)=>n+r.outsideControls,0),scrollingStates:results.slice(-ids.length).filter(r=>r.metrics.some(m=>m.contentHeight>m.height+3)).length}));await save();}
 if(probe&&phase.includes('aux'))await auxiliaryChecks();
 if(cueOnly)await cueChecks();
 if(phase!=='baseline'&&!probe&&!cueOnly){
  if(!autoOnly)for(const [width,height]of [[1280,800],[915,412],[740,360],[390,844],[360,740]]){await page.setViewportSize({width,height});for(const [i,work]of [[2,{challenge:{proof:proofs.parts.slice(0,2)}}],[2,{challenge:{proof:proofs.parts.slice(0,3)}}],[3,{challenge:{proof:proofs.rhythm.slice(0,2),sequence:['울림','쉼','울림','쉼']}}],[10,{challenge:{proof:proofs.melody.slice(0,2)}}],[15,{challenge:{proof:proofs.classify.slice(0,5)}}],[18,{challenge:{proof:proofs.solutions.slice(0,2)}}]]){const s=seed(i);s.work[i]=work;await open(s);await measure(`long-${i}-${work.challenge.proof.length}`,i);}
   for(const i of [0,4,8,12,16,19]){const s=seed(i,true);await open(s);await measure(`complete-${i}`,i,lessons[i].challenge?[A('challenge-replay')]:required[i]);}
   await open(seed(11));await action('challenge-check');await measure('error-mix',11);
   await open(seed(18));await action('challenge-solution','[data-value="volume"]');await action('challenge-before');await action('challenge-after');await measure('error-solution',18);
   const diagnosis=seed(16);diagnosis.work[16]={heard:true,place:'library'};await open(diagnosis);await measure('diagnosis-next-situation',16,required[16],'[data-action="diagnostic"][data-field="situation"]');
   const care=seed(17);care.work[17]={before:true};await open(care);await measure('care-next-solutions',17,required[17],'.solution-grid');
   await open(seed(0));await action('auto-play');await measure('playing-0',0);await action('auto-play');await measure('paused-0',0);await action('auto-stop');
  }
  if(!process.env.QA_SKIP_AUTO)await autoChecks();
  if(!autoOnly)await auxiliaryChecks();
  if(!autoOnly){await page.setViewportSize({width:1024,height:600});const teacherSeed=seed(0,true);teacherSeed.work={};await open(teacherSeed);await action('settings');await page.locator('[data-action="admin"]').evaluate(e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await action('admin');await page.locator('.modal-heading [data-action="close"]').click();for(let i=0;i<20;i++){await measure(`teacher-${i}`,i);if(i<19){await page.keyboard.press('ArrowRight');await page.waitForTimeout(80);}}}
 }
 if(phase.startsWith('final')||cueOnly){const changed=[];for(const [file,value]of Object.entries(snapshot)){if(file==='/')continue;const actual=createHash('sha256').update(await readFile(path.join(root,file.slice(1)))).digest('hex');if(actual!==value.hash)changed.push(file);}assert.deepEqual(changed,[],'product source changed during verification');checks.push(`product source hashes remained unchanged throughout ${phase} verification`);}
 const counts=await save();console.log(JSON.stringify({phase,states:results.length,counts,errors,out}));if((phase.startsWith('final')||cueOnly)&&Object.keys(counts).length)process.exitCode=2;
}catch(error){errors.push(String(error));await save();throw error;}finally{await browser.close();}
