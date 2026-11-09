import test from 'node:test';
import assert from 'node:assert/strict';
import { stages } from '../src/data.js';
import { settingsContent } from '../src/settings-content.js';

test('every facility names its achievement standard, objective and review state', () => {
  const listed = (settingsContent.standards ?? []).map(line => line.match(/^\[(4과07-0\d)\]/)?.[1]).filter(Boolean);
  for (const stage of stages) {
    assert.ok(Array.isArray(stage.standards) && stage.standards.length > 0, `${stage.name} standards`);
    for (const code of stage.standards) assert.ok(listed.includes(code), `${stage.name} ${code} is one of the standards shown to teachers`);
    assert.ok(typeof stage.objective === 'string' && stage.objective.length >= 10, `${stage.name} objective`);
    assert.equal(stage.review.needsReview, true, `${stage.name} waits for teacher review`);
    assert.ok(stage.review.source.includes('2022 개정'), `${stage.name} review source`);
  }
  assert.deepEqual([...new Set(stages.flatMap(s => s.standards))].sort(), ['4과07-01', '4과07-02', '4과07-03']);
});
