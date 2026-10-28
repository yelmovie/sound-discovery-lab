import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, normalize, checkLesson, canLesson, evidenceCount } from '../src/model.js';
import { collectReadyEvidence, evidenceMatches, captureStrike } from '../src/progress.js';

test('a meaningful last observation records once and unlocks the next activity',()=>{
 const s=freshState();s.work[0]={seen:['rubber'],choice:0};
 assert.equal(collectReadyEvidence(s,0),false);assert.equal(canLesson(s,1),false);
 s.work[0].seen.push('drum');assert.equal(collectReadyEvidence(s,0),true);
 const evidence=s.evidence[0];assert.equal(evidenceMatches(s,0),true);assert.equal(canLesson(s,1),true);
 assert.equal(collectReadyEvidence(s,0),false);assert.equal(s.evidence[0],evidence);
 assert.equal(evidenceCount(s),1);
});
test('revisiting a collected activity does not erase its evidence on a wrong attempt',()=>{
 const s=freshState();s.work[0]={seen:['rubber','drum'],choice:0};collectReadyEvidence(s,0);
 const original=structuredClone(s.evidence[0]);s.work[0].choice=1;
 assert.equal(evidenceMatches(s,0),false);assert.equal(collectReadyEvidence(s,0),false);
 assert.deepEqual(s.evidence[0],original);
 s.work[0].choice=0;assert.equal(evidenceMatches(s,0),true);
});
test('normalized autosaved observations remain ready across a reload',()=>{
 const s=freshState();s.work[0]={seen:['rubber','drum'],choice:0};collectReadyEvidence(s,0);
 const reloaded=normalize(JSON.parse(JSON.stringify(s)));
 assert.equal(evidenceMatches(reloaded,0),true);assert.equal(collectReadyEvidence(reloaded,0),false);
});
test('strikes capture two different sounds and repeated identical hits do not fabricate a comparison',()=>{
 const s=freshState(),w=s.work[4]={};captureStrike(w,1);captureStrike(w,1);
 assert.equal(w.a,1);assert.equal(w.b,undefined);assert.equal(collectReadyEvidence(s,4),false);
 captureStrike(w,3);assert.equal(collectReadyEvidence(s,4),true);assert.deepEqual([w.a,w.b],[1,3]);
 captureStrike(w,2);assert.equal(evidenceMatches(s,4),false);assert.equal(collectReadyEvidence(s,4),true);
 assert.deepEqual([s.evidence[4].observation.a,s.evidence[4].observation.b],[1,2]);
});
test('changed A/B evidence requires a fresh comparison and keeps the earlier comparison snapshot',()=>{
 const s=freshState();s.work[4]={a:1,b:3};collectReadyEvidence(s,4);
 s.work[5]={heardA:true,heardB:true,pairKey:'1,3',choice:1};collectReadyEvidence(s,5);
 s.work[4].b=2;collectReadyEvidence(s,4);
 assert.equal(checkLesson(s,5).ok,false);assert.equal(evidenceMatches(s,5),false);
 assert.equal(s.evidence[5].observation.pair.b,3);
});
test('transient challenge messages do not issue a second observation',()=>{
 const s=freshState();s.work[19]={challenge:{proof:['balanced'],kind:'success',message:'완료',sounding:false}};
 assert.equal(collectReadyEvidence(s,19),true);const first=s.evidence[19];
 s.work[19].challenge.message='';s.work[19].challenge.kind='';
 assert.equal(collectReadyEvidence(s,19),false);assert.equal(s.evidence[19],first);
});
test('preparing a new force or ruler length leaves the collected comparison usable',()=>{
 const s=freshState();s.work[4]={a:1,b:3,force:3};collectReadyEvidence(s,4);
 s.work[4].force=2;assert.equal(evidenceMatches(s,4),true);assert.equal(collectReadyEvidence(s,4),false);
 s.work[8]={lengths:[18,6],length:6,choice:0};collectReadyEvidence(s,8);
 s.work[8].length=12;assert.equal(evidenceMatches(s,8),true);
});
test('automatic collection still requires listening and correct science',()=>{
 const s=freshState();s.work[9]={pattern:[18,6,12]};assert.equal(collectReadyEvidence(s,9),false);
 s.work[9].targetHeard=true;assert.equal(collectReadyEvidence(s,9),true);
 s.work[16]={place:'library',situation:'reading',person:'reader'};assert.equal(collectReadyEvidence(s,16),false);
 s.work[16].heard=true;assert.equal(collectReadyEvidence(s,16),true);
 s.work[17]={solutions:['pad'],before:true,choice:0};assert.equal(collectReadyEvidence(s,17),false);
 s.work[17].after=true;s.work[17].afterKey='pad';assert.equal(collectReadyEvidence(s,17),true);
});
