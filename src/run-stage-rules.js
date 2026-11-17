// Rule link for the 3D run stage. No drawing here: the course is plain numbers and every result
// still comes from runChallenge/checkChallenge. A landing only chooses which existing action to send.
import { rhythms, melodies, roundOf, checkChallenge } from './challenge-rules.js';
import { lengths } from './data.js';

export const RUN_MISSIONS = Object.freeze({ rhythm: '울림 징검다리', melody: '높낮이 잠금문' });

// Movement numbers shared by the stage and the reach tests. Metres and seconds.
export const RUN_SPEED = 2.8, JUMP_SPEED = 5.2, GRAVITY = 16, STEP_UP = .3;
export const JUMP_REACH = RUN_SPEED * 2 * JUMP_SPEED / GRAVITY;

const STONE_RADIUS = 1, STONE_GAP = .6, PAD_HALF = 1.4, PAD_HALF_WIDTH = 2.1;
const LANE_WIDTH = 1.5, KEY_UNIT = 2.4 / 18, ROW_DEPTH = 2.4, ROW_MARGIN = .9, KEY_TOP = .14, BENCH = .3;

/** Stepping stones over the water: practice, then one section per rhythm round. s grows forward. */
function rhythmCourse() {
  const platforms = [], pads = [];
  let s = 0;
  const pad = name => {
    const p = { kind: 'pad', name, x: 0, s, halfWidth: PAD_HALF_WIDTH, halfDepth: PAD_HALF, top: 0 };
    platforms.push(p); pads.push(p); s += PAD_HALF; return p;
  };
  const stones = (section, count) => {
    for (let index = 0; index < count; index++) {
      const from = s; s += STONE_GAP + STONE_RADIUS;
      platforms.push({ kind: 'plank', x: 0, s: from + STONE_GAP / 2, halfWidth: .5, halfDepth: STONE_GAP / 2 + .2, top: -.1 });
      platforms.push({ kind: 'stone', section, index, x: 0, s, radius: STONE_RADIUS, top: 0 });
      s += STONE_RADIUS;
    }
    platforms.push({ kind: 'plank', x: 0, s: s + STONE_GAP / 2, halfWidth: .5, halfDepth: STONE_GAP / 2 + .2, top: -.1 });
    s += STONE_GAP + PAD_HALF;
  };
  pad('start'); stones('practice', 2);
  rhythms.forEach((beats, round) => { pad(`round-${round}`); stones(round, beats.length); });
  pad('goal');
  return { id: 'rhythm', platforms, pads, halfWidth: PAD_HALF_WIDTH, length: s, canJump: true };
}

/** One floor with rows of three ruler keys. Key length is drawn to scale: 6, 12 and 18 cm. */
function melodyCourse() {
  const platforms = [], pads = [], halfWidth = LANE_WIDTH * 1.5;
  let s = 0;
  const pad = name => { const p = { kind: 'pad', name, x: 0, s, halfWidth, halfDepth: PAD_HALF, top: 0 }; pads.push(p); s += PAD_HALF; return p; };
  const row = (section, index) => {
    s += ROW_MARGIN;
    // The bench holds one end of every ruler, so the free part past it is exactly 6, 12 or 18 cm to scale.
    platforms.push({ kind: 'bench', x: 0, s: s - BENCH / 2, halfWidth, halfDepth: BENCH / 2, top: KEY_TOP, rowStart: s });
    lengths.forEach((l, lane) => {
      const depth = l.value * KEY_UNIT;
      platforms.push({ kind: 'key', section, index, lane, length: l.value, x: (lane - 1) * LANE_WIDTH, s: s + depth / 2, halfWidth: LANE_WIDTH / 2, halfDepth: depth / 2, top: KEY_TOP, rowStart: s });
    });
    s += ROW_DEPTH;
  };
  pad('start'); row('practice', 0); s += ROW_MARGIN + PAD_HALF;
  melodies.forEach((notes, round) => { pad(`round-${round}`); notes.forEach((_, index) => row(round, index)); s += ROW_MARGIN + PAD_HALF; });
  pad('goal');
  const length = s;
  // The keys lie on one continuous floor, so nobody falls between rows.
  platforms.unshift({ kind: 'floor', x: 0, s: (length - PAD_HALF) / 2, halfWidth, halfDepth: (length + PAD_HALF) / 2, top: 0 });
  return { id: 'melody', platforms, pads, halfWidth, length, canJump: false };
}
export const courseFor = id => id === 'rhythm' ? rhythmCourse() : id === 'melody' ? melodyCourse() : null;

/** Which round is open and how many of its steps are already played. */
export function runProgress(id, c = {}) {
  const round = roundOf(id, c), sequence = Array.isArray(c.sequence) ? c.sequence : [];
  const size = (id === 'rhythm' ? rhythms : melodies)[round].length;
  if (id === 'rhythm') return { round, step: sequence.length >= size ? 0 : sequence.length, size };
  const gap = sequence.findIndex(value => !(value > 0)), filled = gap < 0 ? sequence.length : gap;
  // A full melody that did not match starts again with the next key, as in the 2D request.
  return { round, step: filled >= size ? 0 : filled, size };
}

/** A landing becomes the request's own action. `how` is 'jump' or 'walk'.
 * null: this stone is not part of the open round. {skip:true}: stones are taken in order. */
export function landingAction(id, c, landing) {
  if (!RUN_MISSIONS[id] || checkChallenge(id, c)) return null;
  const at = runProgress(id, c);
  if (landing.section !== at.round || landing.index < at.step) return null;
  if (landing.index > at.step) return { skip: true };
  if (id === 'rhythm') return { action: landing.how === 'jump' ? 'ring' : 'rest' };
  return { action: 'note', value: landing.length };
}

/** After reload or a hidden tab the fork is silent, so a rest cannot follow. The 2D request asks for 처음부터. */
export const rhythmNeedsRestart = (c = {}) => !c.sounding && c.sequence?.at(-1) === '울림';

/** What the dispatched action did, read from the saved challenge before and after. */
export function landingOutcome(id, before, after) {
  if ((after.proof?.length || 0) > (before.proof?.length || 0)) return checkChallenge(id, after) ? 'complete' : 'round';
  return after.kind === 'hint' ? 'wrong' : 'step';
}

/** Target row for the overlay. Same data the 2D request shows. */
export function runGoal(id, c = {}) {
  const at = runProgress(id, c);
  if (id === 'rhythm') return rhythms[at.round].map((label, n) => ({ label, filled: n < at.step }));
  return melodies[at.round].map((value, n) => ({ label: lengths.find(l => l.value === value).pitch, value, filled: n < at.step }));
}

/** Short prompts for the overlay. Hints describe the controls, never the answer. */
export const runGuide = {
  rhythm: { practice: ['연습: 첫 북에 뛰어서 올라가 봐. 북이 떨리면 소리가 나.', '이번엔 걸어서 살며시 올라가 봐. 북이 떨리지 않으면 소리도 나지 않아.', '좋아! 이제 목표 신호를 보고 징검다리를 건너 봐.'], play: '뛰어 밟으면 울림, 걸어 오르면 쉼이야. 목표 신호대로 건너 봐.', skip: '북을 하나씩 차례로 밟아 줘.', fall: '괜찮아! 방금 서 있던 곳에서 다시 가 보자.', restart: '소리가 멈췄어. 이 구간을 처음부터 다시 건너 보자.', ring: '뛰어 밟았더니 북이 떨리면서 소리가 나!', rest: '살며시 올랐더니 이 북은 떨리지 않아. 소리 없이 쉼!', hint: '표지판의 목표와 내가 밟은 방법을 비교해 봐. 뛰어 밟으면 북이 떨려서 소리가 나고, 살며시 걸어 오르면 떨리지 않아.' },
  melody: { practice: ['연습: 길이가 다른 세 발판을 모두 밟아 소리를 비교해 봐.', '좋아! 짧은 발판과 긴 발판의 소리가 어떻게 달랐지?', '이제 목표 멜로디를 듣고 발판을 골라 밟아 봐.'], play: '목표를 듣고, 줄마다 발판 하나를 골라 밟아 봐.', skip: '앞줄 발판부터 차례로 밟아 줘.', fall: '괜찮아! 방금 서 있던 곳에서 다시 가 보자.', retry: '목표와 다른 발판이 있어. 목표를 다시 듣고 첫 줄부터 골라 봐.', note: length => { const l = lengths.find(x => x.value === length); return `${l.label}(${l.value} cm)를 밟았더니 ${{ 낮음: '낮은', 중간: '중간 높이의', 높음: '높은' }[l.pitch]} 소리가 났어.`; }, hint: '목표를 다시 듣고, 연습 발판에서 들은 소리와 비교해 봐. 발판 길이에 따라 높낮이가 달라.' }
};
