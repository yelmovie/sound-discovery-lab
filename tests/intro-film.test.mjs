import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { introFilm, finaleFilm, assets } from '../src/data.js';
import { voiceLines } from '../src/voice.js';

const root = new URL('../', import.meta.url);

test('story film files ship with the app and stay light for classroom Wi-Fi', async () => {
  for (const film of [introFilm, finaleFilm]) {
    for (const file of [film.src, film.poster, film.captions]) {
      assert.ok(assets.includes(file), `${file} is copied by the build`);
      await stat(new URL(file, root));
    }
    const { size } = await stat(new URL(film.src, root));
    assert.ok(size < 8 * 1024 * 1024, `${film.src} is ${size} bytes`);
  }
});

test('film captions say the recorded story lines, in order', async () => {
  const vtt = (await readFile(new URL(introFilm.captions, root), 'utf8')).replace(/\r/g, '');
  const cues = vtt.split('\n\n').slice(1).map(block => block.split('\n').slice(2).join(' ').trim());
  assert.equal(cues[0], voiceLines['story-1'].text);
  assert.equal(cues.slice(1).join(' '), voiceLines['story-2'].text);
  const fin = (await readFile(new URL(finaleFilm.captions, root), 'utf8')).replace(/\r/g, '');
  const said = fin.split('\n\n').slice(1).map(block => block.split('\n').slice(2).join(' ').trim()).join(' ');
  for (const id of ['final-title', 'final-core', 'ending-1', 'ending-2']) assert.ok(said.includes(voiceLines[id].text), `finale captions include ${id}`);
});

test('the film opens on a first start and from the story button, never over saved work', async () => {
  const app = await readFile(new URL('src/app.js', root), 'utf8');
  assert.match(app, /a==='start'&&state\.resumeLesson===null&&!Object\.keys\(state\.work\)\.length\)return openIntro\('map'\)/);
  assert.match(app, /a==='story'\)return openIntro\('map'\)/);
  assert.match(app, /save\(\);navigate\('result'\);openFinale\(\);/, 'finale opens after a genuine restore');
  assert.match(app, /a==='ending'\)\{if\(!state\.restored\)return;navigate\('result'\);return openFinale\(\);\}/);
  assert.match(app, /prefers-reduced-motion: reduce\)'\)\.matches\)void video\.play\(\)/, 'no autoplay with reduced motion');
});
