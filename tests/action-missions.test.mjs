import test from 'node:test';import assert from 'node:assert/strict';import {missionStatus,missionScene} from '../src/action-missions.js';import {runChallenge,challengeView} from '../src/challenges.js';
const sound={stop(){},play(){},sequence(){}};
test('mission route uses validated proof and restores without new save keys',()=>{assert.equal(missionStatus('rhythm',{proof:['a']},3).ratio,1/3);assert.match(missionScene('rhythm',{proof:['a','b','c']},3),/mission-open/)});
test('incorrect rhythm keeps correct prefix and can recover without timer',()=>{let w={};runChallenge('rhythm',w,'ring',{},sound);runChallenge('rhythm',w,'ring',{},sound);assert.deepEqual(w.challenge.sequence,['울림']);runChallenge('rhythm',w,'rest',{},sound);runChallenge('rhythm',w,'ring',{},sound);assert.equal(w.challenge.proof.length,1)});

test('mission progress has its own row outside the experiment layout', () => {
  const helpers = { button: label => `<button>${label}</button>`, icon: () => '', prop: () => '', toolGraphic: () => '', wave: () => '' };
  for (const id of ['parts', 'rhythm', 'signal', 'sort', 'melody', 'mix', 'sensor', 'classify', 'solutions', 'festival']) {
    const html = challengeView(id, {}, helpers);
    assert.match(html, /class="action-mission/, id);
    assert.match(html, /class="challenge-workspace"/, id);
    assert.ok(html.indexOf('class="action-mission') < html.indexOf('class="challenge-workspace"'), id);
    assert.doesNotMatch(html, /class="challenge-workspace"><section class="action-mission/, id);
  }
});
