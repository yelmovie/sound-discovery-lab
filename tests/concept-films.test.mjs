import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { concepts } from '../src/concepts.js';
import { films, DURATION, CUES } from '../films/films.data.mjs';

const root = new URL('../', import.meta.url);
const read = p => readFile(new URL(p, root));

// Top-level MP4 boxes, plus the movie length from moov/mvhd.
function mp4Info(buf) {
  const boxes = [];
  let duration = null;
  for (let at = 0; at + 8 <= buf.length;) {
    let size = buf.readUInt32BE(at); const type = buf.toString('latin1', at + 4, at + 8);
    if (size === 1) size = Number(buf.readBigUInt64BE(at + 8));
    if (size < 8) break;
    boxes.push(type);
    if (type === 'moov') {
      for (let m = at + 8; m + 8 <= at + size;) {
        const s = buf.readUInt32BE(m), t = buf.toString('latin1', m + 4, m + 8);
        if (t === 'mvhd') { const v = buf[m + 8]; duration = v === 1 ? Number(buf.readBigUInt64BE(m + 32)) / buf.readUInt32BE(m + 28) : buf.readUInt32BE(m + 24) / buf.readUInt32BE(m + 20); }
        if (s < 8) break; m += s;
      }
    }
    at += size;
  }
  return { boxes, duration };
}

test('film captions are the app captions and scenes follow the app cue clock', async () => {
  const app = (await read('src/app.js')).toString();
  assert.match(app, /Math\.min\(3,Math\.floor\(video\.currentTime\/4\)\)/, 'app highlights one cue per 4 s');
  assert.equal(DURATION, 16); assert.deepEqual(CUES, [0, 4, 8, 12]);
  assert.deepEqual(films.map(f => f.id), concepts.map(c => c.id));
  for (const f of films) {
    const c = concepts.find(x => x.id === f.id);
    assert.deepEqual(f.captions, c.cues, `${f.id} captions`);
    assert.equal(c.duration, DURATION, `${f.id} app duration`);
    const html = (await read(`films/${f.id}/index.html`)).toString();
    assert.match(html, new RegExp(`data-composition-id="main" data-start="0" data-duration="${DURATION}"`), `${f.id} root length`);
    CUES.forEach((start, k) => assert.match(html, new RegExp(`id="cap${k}" class="clip full" data-start="${start}" data-duration="4"`), `${f.id} caption ${k} at ${start}s`));
  }
});

test('VTT tracks carry the same four lines on the same 4 s grid', async () => {
  for (const c of concepts) {
    const vtt = (await read(`media/concepts/${c.id}.vtt`)).toString();
    const cues = [...vtt.matchAll(/(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})\n(.+)/g)];
    assert.equal(cues.length, 4, c.id);
    cues.forEach((m, k) => {
      assert.equal(m[1], `00:00:${String(CUES[k]).padStart(2, '0')}.000`);
      assert.equal(m[2], `00:00:${String(CUES[k] + 4).padStart(2, '0')}.000`);
      assert.equal(m[3].trim(), c.cues[k]);
    });
  }
});

test('app films are 16 s, faststart, within 2.5 MB, with a poster', async () => {
  for (const c of concepts) {
    const buf = await read(`media/concepts/${c.id}.mp4`);
    assert.ok(buf.length <= 2.5 * 1024 * 1024, `${c.id} size ${buf.length}`);
    const { boxes, duration } = mp4Info(buf);
    assert.ok(boxes.indexOf('moov') > -1 && boxes.indexOf('moov') < boxes.indexOf('mdat'), `${c.id} moov before mdat`);
    assert.ok(Math.abs(duration - DURATION) < 0.1, `${c.id} duration ${duration}`);
    const poster = await stat(new URL(`media/concepts/${c.id}.jpg`, root));
    assert.ok(poster.size > 10_000, `${c.id} poster`);
  }
});
