import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { introFilm, assets } from '../src/data.js';
import { voiceLines } from '../src/voice.js';

const root = new URL('../', import.meta.url);

test('opening film files ship with the app and stay light for classroom Wi-Fi', async () => {
  for (const file of [introFilm.src, introFilm.poster, introFilm.captions]) {
    assert.ok(assets.includes(file), `${file} is copied by the build`);
    await stat(new URL(file, root));
  }
  const { size } = await stat(new URL(introFilm.src, root));
  assert.ok(size < 8 * 1024 * 1024, `film is ${size} bytes`);
});

test('film captions say the recorded story lines, in order', async () => {
  const vtt = (await readFile(new URL(introFilm.captions, root), 'utf8')).replace(/\r/g, '');
  const cues = vtt.split('\n\n').slice(1).map(block => block.split('\n').slice(2).join(' ').trim());
  assert.equal(cues[0], voiceLines['story-1'].text);
  assert.equal(cues.slice(1).join(' '), voiceLines['story-2'].text);
});

test('the film opens on a first start and from the story button, never over saved work', async () => {
  const app = await readFile(new URL('src/app.js', root), 'utf8');
  assert.match(app, /a==='start'&&state\.resumeLesson===null&&!Object\.keys\(state\.work\)\.length\)return openIntro\('map'\)/);
  assert.match(app, /a==='story'\)return openIntro\('map'\)/);
  assert.match(app, /prefers-reduced-motion: reduce\)'\)\.matches\)void video\.play\(\)/, 'no autoplay with reduced motion');
});
