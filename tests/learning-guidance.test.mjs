import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../src/model.js';
import { lessons, stages } from '../src/data.js';
import { coachFor } from '../src/companion.js';

test('all twenty activities connect an inquiry and a discovery to a standard', () => {
  assert.equal(lessons.length, 20);
  for (const lesson of lessons) {
    assert.ok(lesson.inquiry?.length > 8, lesson.title);
    assert.ok(lesson.discovery?.length > 8, lesson.title);
    assert.deepEqual(lesson.standards, stages[lesson.stage].standards);
  }
  assert.ok(stages.every(stage => stage.nextInquiry?.length > 8));
});

test('a changed strike force points back to the drum without inventing evidence', () => {
  const state = freshState();
  state.work[4] = { a: 1, force: 1 };
  assert.equal(coachFor(state, 4).target, '#force');
  state.work[4].force = 3;
  assert.equal(coachFor(state, 4).target, '[data-action="hit"]');
  assert.match(coachFor(state, 4).text, /북/);
  assert.equal(state.work[4].b, undefined);
});

test('signal and two-variable mixing guide adjustment before playing', () => {
  const state = freshState();
  state.work[6] = { challenge: { proof: ['1'] } };
  assert.equal(coachFor(state, 6).target, '#signal-force');
  state.work[6].challenge.force = 3;
  assert.equal(coachFor(state, 6).target, '[data-action="challenge-strike"]');
  state.work[11] = { challenge: { length: 18, force: 3 } };
  assert.equal(coachFor(state, 11).target, '#mix-length');
  state.work[11].challenge.length = 6;
  assert.equal(coachFor(state, 11).target, '#mix-force');
  state.work[11].challenge.force = 1;
  assert.equal(coachFor(state, 11).target, '[data-action="challenge-check"]');
  assert.deepEqual(state.evidence, {});
});

test('parcel guidance offers a tap path and follows listen then placement', () => {
  const state = freshState();
  state.work[7] = { challenge: { listened: [0], selected: 0 } };
  assert.equal(coachFor(state, 7).target, '[data-action="challenge-parcel"][data-value="1"]');
  state.work[7].challenge.listened = [0, 1, 2];
  assert.equal(coachFor(state, 7).target, '[data-action="challenge-slot"]');
  assert.match(coachFor(state, 7).text, /칸.*눌러/);
});
