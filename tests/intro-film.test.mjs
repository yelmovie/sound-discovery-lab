import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { introFilm, finaleFilm, assets } from '../src/data.js';
import { voiceLines } from '../src/voice.js';

const root = new URL('../', import.meta.url);
const cues = async name => JSON.parse(await readFile(new URL(`docs/film-captions-20261121/${name}.json`, root), 'utf8')).cues;
const plain = s => s.replace(/[[\]]/g, '');

test('story film files ship with the app and stay light for classroom Wi-Fi', async () => {
  for (const film of [introFilm, finaleFilm]) {
    for (const file of [film.src, film.poster]) {
      assert.ok(assets.includes(file), `${file} is copied by the build`);
      await stat(new URL(file, root));
    }
    const { size } = await stat(new URL(film.src, root));
    assert.ok(size < 8 * 1024 * 1024, `${film.src} is ${size} bytes`);
  }
});

test('burned-in captions say the recorded Pio lines word for word, in order', async () => {
  for (const [name, ids, last] of [['intro', ['guide-1', 'story-1', 'story-2', 'title-bubble'], '같이 도시를 깨우자!'], ['final', ['final-title', 'final-core', 'ending-1', 'ending-2', 'finale-thanks'], '우리가 해냈어! 함께 탐험해 줘서 고마워, 소리 탐험가!']]) {
    const list = await cues(name);
    for (const id of ids) {
      const said = list.filter(c => c.voice === id).map(c => plain(c.text)).join(' ');
      assert.equal(said, voiceLines[id].text, `${name} ${id}`);
    }
    assert.equal(plain(list.at(-1).text), last, `${name} ends on its invitation / celebration`);
    assert.ok(list.every((c, i) => !i || c.s >= list[i - 1].e), `${name} cues do not overlap`);
  }
});

test('the films open on a first start, from the story button and after a genuine restore', async () => {
  const app = await readFile(new URL('src/app.js', root), 'utf8');
  assert.match(app, /a==='start'&&state\.resumeLesson===null&&!Object\.keys\(state\.work\)\.length&&!introSeen\(\)\)return openIntro\('map'\)/);
  assert.match(app, /a==='story'\)return openIntro\('map'\)/);
  assert.match(app, /save\(\);navigate\('result'\);openFinale\(\);/, 'finale opens after a genuine restore');
  assert.match(app, /a==='ending'\)\{if\(!state\.restored\)return;navigate\('result'\);return openFinale\(\);\}/);
  assert.match(app, /const quiet=state\.settings\.muted\|\|!state\.settings\.voice;/, 'voice or all sound off mutes the film');
  assert.match(app, /if\(!video\.muted\)sound\.holdBgm/, 'background music only waits for a film with sound');
  assert.match(app, /prefers-reduced-motion: reduce\)'\)\.matches\)void video\.play\(\)/, 'no autoplay with reduced motion');
});
