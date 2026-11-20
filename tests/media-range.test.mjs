import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaRange } from '../worker/media-range.js';

const assets = type => ({ fetch: async () => new Response(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), { headers: { 'Content-Type': type, ETag: '"x"' } }) });
const get = (path, range) => new Request(`https://example.test${path}`, { headers: range ? { Range: range } : {} });

test('background music and voices answer a byte range with a 206 slice, like the concept films', async () => {
  for (const [path, type] of [['/media/audio/bgm/main-theme.mp3', 'audio/mpeg'], ['/media/audio/voices/a.ogg', 'audio/ogg'], ['/media/concepts/v.mp4', 'video/mp4']]) {
    const part = await mediaRange(get(path, 'bytes=0-1'), assets(type));
    assert.equal(part.status, 206, path);
    assert.equal(part.headers.get('Content-Range'), 'bytes 0-1/10');
    assert.deepEqual([...new Uint8Array(await part.arrayBuffer())], [0, 1]);
    const whole = await mediaRange(get(path), assets(type));
    assert.equal(whole.status, 200);
    assert.equal(whole.headers.get('Accept-Ranges'), 'bytes');
    assert.equal((await whole.arrayBuffer()).byteLength, 10);
  }
});

test('a missing sound that comes back as the page is never sliced', async () => {
  const page = await mediaRange(get('/media/audio/nope.mp3', 'bytes=0-1'), assets('text/html'));
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('Content-Range'), null);
});
