import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { runChallenge } from '../src/challenges.js';
import { checkChallenge, cleanChallenge, rhythms, melodies } from '../src/challenge-rules.js';
import { lessons } from '../src/data.js';
import { freshState, normalize } from '../src/model.js';
import { collectReadyEvidence } from '../src/progress.js';
import { courseFor, landingAction, landingOutcome, runProgress, runGoal, rhythmNeedsRestart, JUMP_REACH, RUN_MISSIONS } from '../src/run-stage-rules.js';

const sound = () => { const events = []; return { events, stop() { events.push('stop'); }, play(x) { events.push(x); }, sequence(x) { events.push(x); } }; };
// One landing, exactly as the stage sends it: rules pick the action, runChallenge judges it.
function land(id, w, s, landing) {
  const c = w.challenge ??= {}, before = structuredClone(c), move = landingAction(id, c, landing);
  if (!move || move.skip) return move ? 'skip' : 'ignored';
  runChallenge(id, w, move.action, { value: move.value, round: c.proof?.length || 0 }, s);
  return landingOutcome(id, before, w.challenge);
}
const stones = (id, section) => courseFor(id).platforms.filter(p => p.section === section && ['stone', 'key'].includes(p.kind));

test('a jump rings and a walk rests, and the request records the same proof as the buttons', () => {
  const w = {}, s = sound();
  rhythms.forEach((beats, round) => beats.forEach((beat, index) => {
    const result = land('rhythm', w, s, { section: round, index, how: beat === '울림' ? 'jump' : 'walk' });
    assert.equal(result, index < beats.length - 1 ? 'step' : round < rhythms.length - 1 ? 'round' : 'complete');
  }));
  assert.equal(checkChallenge('rhythm', w.challenge), true);
  assert.deepEqual(w.challenge.proof, rhythms.map(r => r.join(',')));
  assert.ok(s.events.some(e => e?.kind === 'fork' && e.frequency === 520));
});

test('a wrong landing keeps the played prefix and never adds proof', () => {
  const w = {}, s = sound();
  assert.equal(land('rhythm', w, s, { section: 0, index: 0, how: 'walk' }), 'wrong');
  assert.deepEqual(w.challenge.sequence || [], []);
  assert.equal(land('rhythm', w, s, { section: 0, index: 0, how: 'jump' }), 'step');
  assert.equal(land('rhythm', w, s, { section: 0, index: 1, how: 'jump' }), 'wrong');
  assert.deepEqual(w.challenge.sequence, ['울림']);
  assert.deepEqual(runProgress('rhythm', w.challenge), { round: 0, step: 1, size: 3 });
  assert.equal(w.challenge.proof?.length || 0, 0);
});

test('stones are taken in order, and stones of other rounds are scenery', () => {
  const w = { challenge: {} }, s = sound();
  assert.equal(land('rhythm', w, s, { section: 0, index: 1, how: 'jump' }), 'skip');
  assert.equal(land('rhythm', w, s, { section: 1, index: 0, how: 'jump' }), 'ignored');
  assert.equal(land('rhythm', w, s, { section: 'practice', index: 0, how: 'jump' }), 'ignored');
  assert.equal(s.events.length, 0);
  land('rhythm', w, s, { section: 0, index: 0, how: 'jump' });
  assert.equal(land('rhythm', w, s, { section: 0, index: 0, how: 'jump' }), 'ignored');
});

test('a silent fork after reload asks for the section again', () => {
  const w = {}, s = sound();
  land('rhythm', w, s, { section: 0, index: 0, how: 'jump' });
  assert.equal(rhythmNeedsRestart(w.challenge), false);
  const restored = cleanChallenge(JSON.parse(JSON.stringify(w.challenge)));
  assert.equal(rhythmNeedsRestart(restored), true);
  runChallenge('rhythm', { challenge: restored }, 'clear', {}, s);
  assert.equal(rhythmNeedsRestart(restored), false);
  assert.equal(runProgress('rhythm', restored).step, 0);
});

test('melody keys send the ruler length, need the target first and restart after a full mismatch', () => {
  const w = {}, s = sound();
  assert.equal(land('melody', w, s, { section: 0, index: 0, length: 6 }), 'wrong');
  assert.match(w.challenge.message, /목표 멜로디를 먼저/);
  runChallenge('melody', w, 'listen', {}, s);
  assert.equal(land('melody', w, s, { section: 0, index: 0, length: 18 }), 'step');
  assert.equal(land('melody', w, s, { section: 0, index: 1, length: 12 }), 'step');
  assert.equal(land('melody', w, s, { section: 0, index: 2, length: 6 }), 'wrong');
  assert.equal(runProgress('melody', w.challenge).step, 0);
  assert.equal(runGoal('melody', w.challenge).some(g => g.filled), false);
  melodies[0].forEach((length, index) => land('melody', w, s, { section: 0, index, length }));
  assert.deepEqual(w.challenge.proof, ['6,12,18']);
  runChallenge('melody', w, 'listen', {}, s);
  melodies[1].forEach((length, index) => land('melody', w, s, { section: 1, index, length }));
  assert.equal(checkChallenge('melody', w.challenge), true);
  assert.ok(s.events.some(e => e?.frequency === 650) && s.events.some(e => e?.frequency === 260));
});

test('a 3D run is saved in the existing fields and survives a reload', () => {
  for (const id of Object.keys(RUN_MISSIONS)) {
    const state = freshState(), i = lessons.findIndex(l => l.challenge === id), s = sound();
    for (let n = 0; n < i; n++) state.evidence[n] = { summary: '', observation: {}, at: '' };
    const w = state.work[i] = {};
    (id === 'rhythm' ? rhythms : melodies).forEach((round, section) => {
      if (id === 'melody') runChallenge(id, w, 'listen', {}, s);
      round.forEach((value, index) => land(id, w, s, id === 'rhythm' ? { section, index, how: value === '울림' ? 'jump' : 'walk' } : { section, index, length: value }));
    });
    assert.equal(collectReadyEvidence(state, i), true, id);
    const saved = JSON.parse(JSON.stringify(state.work[i].challenge));
    assert.deepEqual(Object.keys(saved).filter(key => !(key in cleanChallenge({}))), ['message', 'kind'].filter(key => key in saved), id);
    assert.equal(checkChallenge(id, cleanChallenge(saved)), true, id);
    assert.deepEqual(state.evidence[i].observation.challenge.proof, saved.proof, id);
  }
});

test('the course matches the request data and a jump cannot skip a stone', () => {
  const rhythm = courseFor('rhythm'), melody = courseFor('melody');
  rhythms.forEach((beats, round) => assert.equal(stones('rhythm', round).length, beats.length));
  melodies.forEach((notes, round) => assert.equal(stones('melody', round).length, notes.length * 3));
  assert.equal(stones('rhythm', 'practice').length, 2);
  assert.deepEqual(stones('melody', 'practice').map(k => k.length), [18, 12, 6]);
  for (const round of [0, 1]) {
    const row = stones('rhythm', round);
    for (let n = 0; n + 1 < row.length; n++) {
      const gap = row[n + 1].s - row[n].s;
      // From the middle of a stone a full jump lands on the next one; from its far edge it still cannot pass it.
      assert.ok(JUMP_REACH > gap - row[n + 1].radius && JUMP_REACH < gap + row[n + 1].radius, 'jump from the middle lands on the next stone');
      assert.ok(row[n].radius + JUMP_REACH < gap + row[n + 1].radius, 'no jump clears the next stone');
    }
  }
  // Key lengths are to scale: 6 : 12 : 18.
  const keys = stones('melody', 0).slice(0, 3);
  assert.deepEqual(keys.map(k => Math.round(k.halfDepth * 2 / (keys[2].halfDepth * 2) * 6)), [18, 12, 6]);
  assert.equal(melody.canJump, false);
  assert.equal(rhythm.canJump, true);
  for (const course of [rhythm, melody]) assert.ok(course.pads.at(-1).s + course.pads.at(-1).halfDepth <= course.length + 1e-9);
});

test('run stage files are checked, precached and served from the project', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const build = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const file of ['run-stage.js', 'run-stage-rules.js', 'run-character.js', 'run-input.js', 'run-stage-hud.js']) {
    assert.ok(pkg.scripts.check.includes(`src/${file}`), `check lists ${file}`);
    assert.ok(build.includes(`/src/${file}`), `precache lists ${file}`);
    await stat(new URL(`../src/${file}`, import.meta.url));
  }
  assert.ok(build.includes('/src/vendor/three/three.module.min.js'));
  assert.match(html, /href="\/src\/run-stage\.css"/);
  const three = await readFile(new URL('../src/vendor/three/three.module.min.js', import.meta.url), 'utf8');
  assert.match(three.slice(0, 400), /const t="170"/);
  await stat(new URL('../src/vendor/three/THREE-LICENSE.txt', import.meta.url));
});

test('a saved state written by the 3D run loads through normalize unchanged', () => {
  const state = freshState(), i = lessons.findIndex(l => l.challenge === 'rhythm'), s = sound();
  for (let n = 0; n < i; n++) state.evidence[n] = { summary: lessons[n].summary, observation: {}, at: '' };
  const w = state.work[i] = {};
  land('rhythm', w, s, { section: 0, index: 0, how: 'jump' });
  const loaded = normalize(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(loaded.work[i].challenge.sequence, ['울림']);
  assert.equal(loaded.work[i].challenge.sounding, false);
});
