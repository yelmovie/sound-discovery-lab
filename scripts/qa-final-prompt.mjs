// Local regression for the delivery prompt. Uses isolated Chrome contexts; never visits the deployed app.
// QA_BASE=http://127.0.0.1:43117 QA_EARNED_STATE=.tmp/full-play-20261109/<run>/earned-state-before-regressions.json node scripts/qa-final-prompt.mjs <new-run>
// The optional final-page fixtures are copies of a genuinely browser-earned record, explicitly seeded only for layout/retry cases.
import { chromium } from '/Volumes/T7 Shield/DevCaches/playwright-runner/node_modules/playwright/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { instruments, finalTasks } from '../src/data.js';

const root=fileURLToPath(new URL('../',import.meta.url)),run=process.argv[2]||'local';
if(!/^[a-z0-9-]+$/.test(run))throw Error('Use a simple new run name.');
const base=process.env.QA_BASE||'http://127.0.0.1:43117',out=path.join(root,'.tmp/final-prompt-20261123',run);
await mkdir(path.join(out,'tmp'),{recursive:true});
const checks=[],layouts=[],runtime=[];
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,env:{...process.env,TMPDIR:path.join(out,'tmp')},args:['--disable-crash-reporter','--disable-breakpad','--noerrdialogs','--use-mock-keychain','--mute-audio']});
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('ullim-city-v1')));
const note=text=>{checks.push(text);console.log('ok · '+text);};
async function open(name,size={width:1024,height:768},setup){
 const context=await browser.newContext({viewport:size,deviceScaleFactor:1,reducedMotion:'reduce',acceptDownloads:true});
 if(setup)await context.addInitScript(setup);
 const page=await context.newPage();page.setDefaultTimeout(12000);
 page.on('pageerror',e=>runtime.push({name,text:String(e)}));
 return {context,page};
}
async function start(page){
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="settings"]').click();
 for(const key of ['bgm','sfx','voice'])await page.locator(`[data-action="sound-setting"][data-key="${key}"]`).click();
 assert.equal(await page.locator('[data-key="experiments"]').getAttribute('aria-checked'),'true');
 await page.locator('dialog .modal-footer [data-action="close"]').click();
 await page.locator('[data-action="start"]').click();
 await page.locator('dialog .film-skip').click();await page.locator('.map-next').click();
 await page.waitForSelector('.instruments');await page.waitForTimeout(400);
}
async function layout(page,label){
 const result=await page.evaluate(()=>{
  const issues=[];
  if(document.documentElement.scrollWidth>innerWidth+2)issues.push('horizontal overflow');
  for(const e of document.querySelectorAll('main button:not([hidden])')){
   const r=e.getBoundingClientRect(),c=getComputedStyle(e);if(c.display==='none'||c.visibility==='hidden'||r.width<1||r.height<1)continue;
   if(e.closest('[hidden],.sr-only,dialog:not([open])'))continue;
   if(r.top<-.5||r.bottom>innerHeight+.5||r.left<-.5||r.right>innerWidth+.5)issues.push('outside: '+e.textContent.trim());
   const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit))issues.push('covered: '+e.textContent.trim());
  }
  return {viewport:[innerWidth,innerHeight],issues};
 });
 layouts.push({label,...result});await page.screenshot({path:path.join(out,label+'.png')});assert.deepEqual(result.issues,[],label);
}
let failure=null;
try{
 // The settings are deliberately changed through the UI. Instrument observation is still unscored until the science answer.
 let {context,page}=await open('parts');await start(page);
 for(const instrument of instruments){
  await page.locator(`[data-action="instrument"][data-tool="${instrument.id}"]`).click();
  assert.match(await page.locator('.observation-window').textContent(),new RegExp(instrument.observation));
  const card=page.locator(`[data-tool="${instrument.id}"]`);
  assert.match(await card.textContent(),new RegExp(instrument.part));
  if(instrument.id!=='ruler')assert.ok(await page.locator('.vibration-art .vibration-detail').evaluate(e=>+getComputedStyle(e).opacity)>0);
  assert.equal(Object.keys((await saved(page)).evidence).length,0);
 }
 await layout(page,'vibration-1024');
 await page.locator('.nav-right [data-action="settings"]').click();
 assert.deepEqual(await page.locator('dialog [role="switch"]').evaluateAll(es=>es.map(e=>[e.getAttribute('aria-label'),e.getAttribute('aria-checked')])),[['배경 음악','false'],['효과음','false'],['실험 소리','true'],['목소리','false']]);
 await page.locator('[data-key="experiments"]').click();await page.locator('dialog .modal-footer [data-action="close"]').click();
 await page.reload();assert.equal((await saved(page)).settings.experiments,false);assert.equal((await saved(page)).settings.sfx,false);
 await page.locator('[data-action="instrument"][data-tool="drum"]').click();await page.locator('[data-action="choice"][data-choice="0"]').click();
 assert.ok((await saved(page)).evidence[0]);
 note('four main vibrating parts and text; separate settings persist; experiment-off observation can still earn evidence');
 await context.close();

 // A blocked audio device is recovered by a new user tap. Retry itself must never change learning evidence or work.
 ({context,page}=await open('device-failure',{width:1024,height:768},()=>{
  const Native=window.AudioContext||window.webkitAudioContext;window.__rejectAudio=true;
  window.AudioContext=class extends Native{constructor(...args){if(window.__rejectAudio)throw Error('QA blocked audio device');super(...args);}};
 }));
 await start(page);await page.locator('[data-tool="drum"]').click();
 await page.locator('.experiment-audio-notice:not([hidden])').waitFor();assert.match(await page.locator('.experiment-audio-notice').textContent(),/못했어.*그림과 글/);
 await layout(page,'audio-failure-1024');
 await page.locator('[data-action="audio-dismiss"]').click();assert.equal(await page.locator('.experiment-audio-notice').isVisible(),false);
 await page.locator('[data-tool="rubber"]').click();await page.locator('.experiment-audio-notice:not([hidden])').waitFor();
 const before=await saved(page);await page.evaluate(()=>{window.__rejectAudio=false;});await page.locator('[data-action="audio-retry"]').click();
 await page.waitForFunction(()=>document.querySelector('.experiment-audio-notice')?.hidden===true);
 assert.deepEqual((await saved(page)).work,before.work);assert.deepEqual((await saved(page)).evidence,before.evidence);
 note('blocked audio: visible replay and visual/text alternative; recovered replay leaves work and evidence unchanged');await context.close();

 // The recording can fail while synthesized comparison sound remains available; the notice must say so honestly.
 ({context,page}=await open('recording-failure'));await page.route('**/media/audio/experiments/*.ogg',route=>route.fulfill({status:503,body:'QA unavailable'}));
 await start(page);await page.locator('[data-tool="drum"]').click();await page.locator('.experiment-audio-notice:not([hidden])').waitFor();
 assert.match(await page.locator('.experiment-audio-notice').textContent(),/녹음 대신 비교용 소리/);await layout(page,'recording-fallback-1024');
 const fallback=await saved(page);await page.unroute('**/media/audio/experiments/*.ogg');await page.locator('[data-action="audio-retry"]').click();
 await page.waitForFunction(()=>document.querySelector('.experiment-audio-notice')?.hidden===true);assert.deepEqual((await saved(page)).work,fallback.work);
 note('missing recording: named model-sound fallback; retry returns to the recording without changing the observation');await context.close();

 if(process.env.QA_EARNED_STATE){
  const earned=JSON.parse(await readFile(path.resolve(root,process.env.QA_EARNED_STATE),'utf8'));
  assert.equal(Object.keys(earned.evidence).length,20);assert.equal(earned.settings.admin,false);
  for(const size of [{width:1280,height:800},{width:1024,height:768}]){
   ({context,page}=await open('final-'+size.width,size));await page.goto(base);
   for(let q=0;q<5;q++){
    const fixture=structuredClone(earned);fixture.restored=false;fixture.completedAt=null;fixture.lastRoute='final';fixture.settings.muted=true;
    fixture.finalAnswers=Object.fromEntries(finalTasks.map((t,n)=>[n,n===q?1-t.answer:t.answer]));
    await page.evaluate(s=>localStorage.setItem('ullim-city-v1',JSON.stringify(s)),fixture);await page.reload();
    await page.locator('[data-action="restore"]').click();assert.match(await page.locator('.final-progress').textContent(),/선택 5 \/ 5.*맞음 4 \/ 5/);
    assert.equal(await page.locator('.final-steps .needs-review').count(),1);assert.equal(await page.locator('.final-evidence-hint').textContent(),'근거 힌트 '+finalTasks[q].hint);
    assert.deepEqual((await saved(page)).finalAnswers,fixture.finalAnswers);assert.equal((await saved(page)).restored,false);
    await layout(page,`final-${size.width}-wrong-${q+1}`);
    await page.locator(`[data-action="final-choice"][data-question="${q}"][data-choice="${finalTasks[q].answer}"]`).click();
    assert.equal((await saved(page)).restored,false);assert.match(await page.locator('.final-progress').textContent(),/맞음 5 \/ 5/);
   }
   await page.locator('[data-action="restore"]').click();await page.locator('dialog .film-skip').click();
   assert.equal((await saved(page)).restored,true);await page.locator('.cert-paper:not(.preview)').waitFor();await page.evaluate(()=>document.fonts.ready);
   await layout(page,`certificate-${size.width}`);
   if(size.width===1024){
    const download=page.waitForEvent('download');await page.locator('[data-action="cert-png"]').click();const file=await download;const target=path.join(out,'certificate.png');await file.saveAs(target);const png=await readFile(target);
    assert.equal(png.readUInt32BE(16),2400);assert.equal(png.readUInt32BE(20),1697);
    await page.pdf({path:path.join(out,'certificate.pdf'),format:'A4',landscape:true,printBackground:true});const pdf=await readFile(path.join(out,'certificate.pdf'));
    assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,1);
    note('certificate PNG 2400×1697 and one-page A4 landscape PDF generated locally');
   }
   await page.reload();assert.equal((await saved(page)).restored,true);assert.equal(await page.locator('dialog #finale-video').count(),0);
   note(`${size.width}×${size.height}: all five wrong positions and evidence hints, retained choices, explicit recheck, certificate and reload (earned-record fixtures)`);
   await context.close();
  }
 }
}catch(error){failure=String(error.stack||error);throw error;}
finally{await writeFile(path.join(out,'results.json'),JSON.stringify({run,base,checks,layouts,runtime,failure,finalFixtures:Boolean(process.env.QA_EARNED_STATE)},null,2));await browser.close();}
assert.deepEqual(runtime,[]);console.log(`PASS · ${checks.length} checks · ${layouts.length} layouts · ${base}`);
