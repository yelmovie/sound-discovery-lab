import { checkLesson, recordEvidence } from './model.js';
import { lessons } from './data.js';

// Presentation state must not rewrite an already collected observation.
const evidenceFields = [
  ['seen','choice'], ['started','stopped','choice'], ['a','b'],
  ['heardA','heardB','pairKey','choice'], ['lengths','choice'], ['targetHeard','pattern'],
  ['media','choice'], ['verified'], ['heard','place','situation','person'],
  ['solutions','before','after','afterKey','choice']
];
function snapshot(value) {
  if (Array.isArray(value)) return value.map(snapshot);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, snapshot(value[key])]));
}
export function evidenceMatches(state, index) {
  const observation=value=>lessons[index]?.challenge?{proof:value?.challenge?.proof}:Object.fromEntries((evidenceFields[lessons[index]?.base]||[]).map(key=>[key,value?.[key]]));
  return Boolean(state.evidence[index]) && checkLesson(state, index).ok &&
    JSON.stringify(snapshot(observation(state.work[index]))) === JSON.stringify(snapshot(observation(state.evidence[index].observation)));
}
export function collectReadyEvidence(state, index) {
  if (!checkLesson(state, index).ok || evidenceMatches(state, index)) return false;
  return recordEvidence(state, index).ok;
}

export function captureStrike(work, force) {
  work.force = force;
  if (!work.a) { work.a = force; return 'A에 첫 소리를 담았어. 세기를 바꿔 한 번 더 쳐 봐.'; }
  if (!work.b && force === work.a) return 'A와 같은 세기야. 다른 세기로 쳐서 B와 비교해 봐.';
  work.b = force;
  return force === work.a ? 'A와 B가 같아졌어. 다른 세기로 다시 쳐 봐.' : 'B에 새 소리를 담았어! 두 파형의 크기를 비교해 봐.';
}
