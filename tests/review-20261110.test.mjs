import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freshState, checkLesson } from '../src/model.js';
import { lessons, legacyIndex } from '../src/data.js';
import { runChallenge, challengeView } from '../src/challenges.js';
import { instrumentSamples } from '../src/samples.js';
import { concepts } from '../src/concepts.js';

const sound={play(){},sequence(){},stop(){}};
const h={button:(label)=>`<button>${label}</button>`,icon:()=>'',prop:()=>'',toolGraphic:()=>'',wave:()=>''};

test('parts success messages use the right subject particle', () => {
  const w={},messages=[];
  for(const answer of [0,1,2,1]){runChallenge('parts',w,'listen',{},sound);runChallenge('parts',w,'select',{value:answer},sound);messages.push(w.challenge.message);}
  assert.deepEqual(messages,['맞아! 북의 막이 떨려.','맞아! 팽팽한 고무줄이 떨려.','맞아! 책상 밖으로 나온 자가 떨려.','맞아! 위쪽 두 갈래가 떨려.']);
});

test('sensor labels write 물속 as one word', () => {
  const w={challenge:{proof:['air']}};
  const html=challengeView('sensor',w,h);
  assert.match(html,/물속 감지기/);
  assert.match(html,/<b>물속<\/b>/);
  assert.doesNotMatch(html,/물 속/);
});

test('stopping the fork answer says the sound stops with the vibration', () => {
  assert.equal(lessons[legacyIndex(1)].choices[lessons[legacyIndex(1)].answer],'떨림과 함께 소리도 멈췄어.');
});

test('wrong answers on pitch and transfer point back to their own evidence', () => {
  const s=freshState();
  s.work[legacyIndex(4)]={lengths:[18,6],choice:1};
  assert.match(checkLesson(s,legacyIndex(4)).message,/높낮이/);
  s.work[legacyIndex(6)]={media:['air','water','solid'],choice:0};
  assert.match(checkLesson(s,legacyIndex(6)).message,/공기·물·고체/);
  s.work[legacyIndex(0)]={seen:['rubber','fork'],choice:1};
  assert.match(checkLesson(s,legacyIndex(0)).message,/떨림과 소리/);
});

test('completed resident requests show the activity summary', () => {
  const html=challengeView('parts',{challenge:{proof:['0','1','2','1']}},{...h,summary:lessons[2].summary});
  assert.match(html,/class="challenge-summary"/);
  assert.ok(html.includes(lessons[2].summary));
});

test('recordings are evened out so no medium sounds louder because of its file', () => {
  // 0.5 s RMS of each recording (dBFS), measured with ffmpeg volumedetect.
  const rms={drum:-15.1,fork:-8.4,solid:-23.1};
  const level=k=>rms[k]+20*Math.log10(instrumentSamples[k].gain);
  const levels=['drum','fork','solid'].map(level);
  assert.ok(Math.max(...levels)-Math.min(...levels)<=2.5,`transfer media within 2.5 dB: ${levels.map(x=>x.toFixed(1))}`);
  // Full force must not clip: peak 0.785 (ruler -2.1 dBFS) × 0.6 × gain stays under 1.
  assert.ok(0.785*0.6*instrumentSamples.ruler.gain<1);
});

test('concept films carry a playback volume and the pitch film stays at full volume', () => {
  for(const c of concepts)assert.ok(c.volume>0&&c.volume<=1,c.id);
  assert.equal(concepts.find(c=>c.id==='pitch').volume,1);
});

test('signal restoration keys get shorter as the note gets higher', async () => {
  const css=await readFile(new URL('../src/signal-restoration.css',import.meta.url),'utf8');
  const height=selector=>Number(new RegExp(`${selector.replace(/[.()]/g,'\\$&')}\\{[^}]*min-height:(\\d+)px`).exec(css)?.[1]);
  const low=height('.signal-keys button'),mid=height('.signal-keys button:nth-child(2)'),high=height('.signal-keys button:nth-child(3)');
  assert.ok(low>mid&&mid>high,`도 ${low} > 미 ${mid} > 솔 ${high}`);
});
