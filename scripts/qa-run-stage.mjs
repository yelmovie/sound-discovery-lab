// Plays the two 3D run stages from start to finish in a real Chrome, then checks the fallbacks.
// Earlier activities are seeded through the game's own model so the run starts at the request under test.
// Usage: QA_BASE=http://127.0.0.1:4311 node scripts/qa-run-stage.mjs <run-name>
import { chromium } from '/Volumes/T7 Shield/DevCaches/playwright-runner/node_modules/playwright/index.mjs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { courseFor } from '../src/run-stage-rules.js';
import { rhythms, melodies } from '../src/challenge-rules.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = process.argv[2] || 'local';
if (!/^[a-z0-9-]+$/.test(run)) throw Error('Use a simple run name.');
const base = process.env.QA_BASE || 'http://127.0.0.1:4311';
const out = path.join(root, '.tmp/run-stage-20261117', run), temp = path.join(out, 'tmp');
await rm(out, { recursive: true, force: true }); await mkdir(temp, { recursive: true });
for (const name of ['TMPDIR', 'TMP', 'TEMP']) process.env[name] = temp;
const KEY = 'ullim-city-v1', checks = [], runtime = [];
const LANE = { 18: -1.5, 12: 0, 6: 1.5 };
const stones = (id, section) => courseFor(id).platforms.filter(p => p.section === section && p.kind === 'stone').map(p => p.s);
const rows = (id, section) => courseFor(id).platforms.filter(p => p.section === section && p.lane === 0).map(p => p.rowStart);
const padAt = (id, name) => courseFor(id).pads.find(p => p.name === name).s;

async function open(name, { width, height, reducedMotion = 'no-preference', noWebgl = false }) {
  const context = await chromium.launchPersistentContext(path.join(out, `profile-${name}`), {
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: process.env.QA_HEADFUL !== '1',
    viewport: { width, height }, deviceScaleFactor: 1, reducedMotion,
    args: ['--disable-crash-reporter', '--disable-breakpad', '--noerrdialogs', '--use-mock-keychain', '--mute-audio', '--enable-unsafe-swiftshader', `--disk-cache-dir=${path.join(out, `cache-${name}`)}`]
  });
  const page = context.pages()[0] || await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', e => runtime.push({ run: name, type: 'pageerror', text: String(e) }));
  page.on('console', m => { if (m.type() === 'error') runtime.push({ run: name, type: 'console', text: m.text() }); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) runtime.push({ run: name, type: 'http', status: r.status(), url: r.url() }); });
  if (noWebgl) await page.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/.test(type) ? null : get.call(this, type, ...rest); }; });
  return { context, page };
}
/** Completes the activities before `upTo` with the game's own rules, as a learner's save would hold them. */
async function seed(page, upTo) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async ({ upTo, KEY }) => {
    const m = await import('/src/model.js'), d = await import('/src/data.js'), ch = await import('/src/challenges.js');
    const sound = { play() { }, sequence() { }, stop() { } };
    const old = [{ seen: ['rubber', 'fork'], choice: 0 }, { started: true, stopped: true, choice: 1 }, { a: 1, b: 3 }, { heardA: true, heardB: true, pairKey: '1,3', choice: 1 }, { lengths: [18, 6], choice: 0 }, { targetHeard: true, pattern: [18, 6, 12] }];
    const play = id => {
      const w = {}, act = (a, value) => ch.runChallenge(id, w, a, { value }, sound);
      if (id === 'parts') for (const x of [1, 1, 0]) { act('listen'); act('select', x); }
      if (id === 'rhythm') for (const n of [3, 5]) for (let k = 0; k < n; k++) act(k % 2 ? 'rest' : 'ring');
      if (id === 'signal') for (const f of [1, 3, 2]) { act('force', f); act('strike'); }
      if (id === 'sort') for (const o of [[2, 1, 3], [3, 2, 1]]) for (let n = 0; n < 3; n++) { act('parcel', o.indexOf(n + 1)); act('slot', n); }
      return w;
    };
    const s = m.freshState();
    for (let i = 0; i < upTo; i++) { s.work[i] = structuredClone(d.lessons[i].challenge ? play(d.lessons[i].challenge) : old[d.lessons[i].base]); if (!m.recordEvidence(s, i).ok) throw Error(`seed ${i}`); }
    s.lastRoute = `lesson/${upTo}`; s.resumeLesson = upTo; localStorage.setItem(KEY, JSON.stringify(s));
  }, { upTo, KEY });
  await page.reload({ waitUntil: 'domcontentloaded' });
}
const saved = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
const probe = page => page.evaluate(() => document.querySelector('.run-stage')?.runProbe?.() || null);
const line = page => page.locator('.run-message span').textContent();
function when(page, kind, value = 0, timeout = 12000) {
  return page.waitForFunction(([kind, value]) => {
    const p = document.querySelector('.run-stage')?.runProbe?.(); if (!p) return false;
    return kind === 'ready' ? true : kind === 'settled' ? p.grounded && !p.moving : kind === 'air' ? !p.grounded : kind === 'down' ? p.grounded || p.moving : kind === 's' ? p.s >= value || p.moving : kind === 'back' ? p.s <= value : kind === 'right' ? p.x >= value || p.moving : p.x <= value || p.moving;
  }, [kind, value], { polling: 16, timeout });
}
// Two ways to steer: real keys, or pointer events on the on-screen pad and buttons.
const steer = (page, touch, keys = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }) => touch ? {
  async hold(d) { await page.dispatchEvent(`[data-run-direction="${d}"]`, 'pointerdown', { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, bubbles: true, cancelable: true }); return () => page.evaluate(() => { document.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true })); }); },
  jump: () => page.dispatchEvent('[data-run-jump]', 'pointerdown', { pointerId: 8, pointerType: 'touch', isPrimary: true, button: 0, bubbles: true, cancelable: true })
} : {
  async hold(d) { await page.keyboard.down(keys[d]); return () => page.keyboard.up(keys[d]); },
  jump: () => page.keyboard.press('Space')
};
const mover = (page, input) => ({
  async walkTo(s) { const release = await input.hold('up'); await when(page, 's', s); await release(); await when(page, 'settled'); },
  async backTo(s) { const release = await input.hold('down'); await when(page, 'back', s); await release(); await when(page, 'settled'); },
  async sideTo(x) { const from = (await probe(page)).x; if (Math.abs(from - x) < .2) return; const d = x < from ? 'left' : 'right'; const release = await input.hold(d); await when(page, d, x); await release(); await when(page, 'settled'); },
  async jumpTo(s) { const release = await input.hold('up'); await when(page, 's', s - 1.75); await input.jump(); await when(page, 'air', 0, 1500); await when(page, 'down'); await release(); await when(page, 'settled'); }
});
const note = text => { checks.push(text); console.log('ok ·', text); };

async function playRhythm(name, size, touch) {
  const { context, page } = await open(name, size), i = 3, go = mover(page, steer(page, touch));
  await seed(page, i); await when(page, 'ready');
  assert.equal(await page.locator('main.lesson-page').getAttribute('inert'), '', '2D request is inert under the stage');
  // The Meshy drum bodies and gate arch replace the plain shapes once they load (2026-11-21).
  await page.waitForFunction(() => { const m = document.querySelector('.run-stage')?.runProbe?.()?.models; return m?.arch && m.drums === 10; }, null, { timeout: 20000 });
  note(`${name}: Meshy gate arch and 10 drum bodies loaded`);
  await page.screenshot({ path: path.join(out, `${name}-start.png`) });
  const practice = stones('rhythm', 'practice');
  await go.jumpTo(practice[0]); await page.waitForTimeout(120); assert.match(await line(page), /떨리면서 소리/);
  await go.walkTo(practice[1]); await page.waitForTimeout(120); assert.match(await line(page), /떨리지 않아/);
  assert.deepEqual((await saved(page)).work[i]?.challenge?.proof || [], [], 'practice is not recorded');
  // A wrong move first: walking onto a 울림 stone keeps the learner on the pad with the request's own hint.
  await go.walkTo(padAt('rhythm', 'round-0'));
  const first = stones('rhythm', 0)[0];
  const release = await steer(page, touch).hold('up'); await page.waitForFunction(() => document.querySelector('.run-stage').runProbe().fails > 0, null, { polling: 16 }); await release(); await when(page, 'settled');
  assert.match((await saved(page)).work[i].challenge.message, /먼저 울려야/); assert.ok((await probe(page)).s < first - 1, 'returned to the pad');
  note(`${name}: wrong landing returns to the last safe spot with the existing hint`);
  for (const [round, beats] of rhythms.entries()) {
    await go.walkTo(padAt('rhythm', `round-${round}`));
    for (const [n, beat] of beats.entries()) {
      await (beat === '울림' ? go.jumpTo(stones('rhythm', round)[n]) : go.walkTo(stones('rhythm', round)[n]));
      const c = (await saved(page)).work[i].challenge;
      if (n < beats.length - 1) assert.deepEqual(c.sequence, beats.slice(0, n + 1), `round ${round} step ${n}`);
      if (round === 0 && n === 0) {
        // Falling off the side returns to the stone just played and changes nothing in the request.
        const left = await steer(page, touch).hold('left'); await page.waitForFunction(() => /괜찮아/.test(document.querySelector('.run-message span').textContent), null, { polling: 16 }); await left(); await when(page, 'settled');
        assert.deepEqual((await saved(page)).work[i].challenge.sequence, ['울림']); assert.ok(Math.abs((await probe(page)).s - stones('rhythm', 0)[0]) < .3);
        note(`${name}: a fall returns to the last stone and keeps the sequence`);
      }
    }
    assert.equal((await saved(page)).work[i].challenge.proof.length, round + 1);
    if (round === 0) await page.screenshot({ path: path.join(out, `${name}-round-1-done.png`) });
  }
  await page.screenshot({ path: path.join(out, `${name}-finale.png`) });
  await page.waitForSelector('.run-stage', { state: 'detached', timeout: 6000 });
  const state = await saved(page);
  assert.deepEqual(state.work[i].challenge.proof, rhythms.map(r => r.join(',')));
  assert.deepEqual(state.evidence[i].observation.challenge.proof, state.work[i].challenge.proof, 'evidence recorded in the existing field');
  assert.equal(await page.locator('.challenge-complete [data-action="continue"]').count(), 1);
  assert.equal(await page.locator('main[inert]').count(), 0);
  await page.screenshot({ path: path.join(out, `${name}-complete-card.png`) });
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('.challenge-complete');
  assert.equal(await page.locator('.run-stage').count(), 0, 'a finished request reopens as the 2D card');
  assert.ok((await saved(page)).evidence[i], 'evidence survives reload');
  note(`${name}: 울림 징검다리 played to the end by ${touch ? 'on-screen buttons' : 'keyboard'} at ${size.width}×${size.height}; proof and evidence saved`);
  await context.close();
}

async function playMelody(name, size, touch) {
  const { context, page } = await open(name, size), i = 10, go = mover(page, steer(page, touch, { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }));
  await seed(page, i); await when(page, 'ready');
  assert.equal(await page.locator('[data-run-jump]').count(), 0, 'no jump button where jumping means nothing');
  const practice = rows('melody', 'practice')[0];
  await page.waitForFunction(() => document.querySelector('.run-stage')?.runProbe?.()?.models?.arch, null, { timeout: 20000 });
  note(`${name}: Meshy gate arch loaded`);
  for (const length of [18, 12, 6]) { await go.sideTo(LANE[length]); await go.walkTo(practice + .35); await go.backTo(practice - .5); }
  await page.screenshot({ path: path.join(out, `${name}-practice.png`) });
  assert.deepEqual((await saved(page)).work[i]?.challenge?.sequence || [], [], 'practice is not recorded');
  // Without the target the request refuses the first key, as the 2D screen does.
  await go.walkTo(rows('melody', 0)[0] + .35); await when(page, 'settled');
  assert.match((await saved(page)).work[i].challenge.message, /목표 멜로디를 먼저/);
  assert.ok(await page.locator('.run-unit.is-next').count(), 'target button is pointed out');
  const choose = async (round, notes) => { for (const [n, length] of notes.entries()) { await go.sideTo(LANE[length]); await go.walkTo(rows('melody', round)[n] + .35); await page.waitForTimeout(150); } await when(page, 'settled'); };
  await page.locator('.run-unit').click(); assert.equal((await saved(page)).work[i].challenge.heard, true);
  await choose(0, [...melodies[0]].reverse());
  assert.match(await line(page), /다른 발판이 있어/); assert.equal((await saved(page)).work[i].challenge.proof?.length || 0, 0);
  note(`${name}: a wrong melody returns to the section start without proof`);
  for (const [round, notes] of melodies.entries()) {
    await go.walkTo(padAt('melody', `round-${round}`));
    if (!(await saved(page)).work[i].challenge.heard) await page.locator('.run-unit').click();
    await choose(round, notes);
    assert.equal((await saved(page)).work[i].challenge.proof.length, round + 1);
    if (round === 0) {
      // Reload in the middle: the stage comes back at the open section.
      await page.reload({ waitUntil: 'domcontentloaded' }); await when(page, 'ready'); await when(page, 'settled');
      assert.ok(Math.abs((await probe(page)).s - padAt('melody', 'round-1')) < .2, 'resumes at the second section');
      note(`${name}: reload resumes at the open section`);
    }
  }
  await page.screenshot({ path: path.join(out, `${name}-finale.png`) });
  await page.waitForSelector('.run-stage', { state: 'detached', timeout: 6000 });
  const state = await saved(page);
  assert.deepEqual(state.work[i].challenge.proof, melodies.map(r => r.join(',')));
  assert.deepEqual(state.evidence[i].observation.challenge.proof, state.work[i].challenge.proof);
  note(`${name}: 높낮이 잠금문 played to the end by ${touch ? 'on-screen buttons' : 'keyboard (WASD)'} at ${size.width}×${size.height}; proof and evidence saved`);
  await context.close();
}

async function fallbacks() {
  // Reduced motion: the 2D request opens first and offers the stage.
  let { context, page } = await open('reduced', { width: 1280, height: 800, reducedMotion: 'reduce' });
  await seed(page, 3); await page.waitForSelector('[data-action="challenge-ring"]');
  assert.equal(await page.locator('.run-stage').count(), 0); assert.equal(await page.locator('main[inert]').count(), 0);
  await page.locator('[data-action="challenge-ring"]').click(); assert.deepEqual((await saved(page)).work[3].challenge.sequence, ['울림']);
  await page.locator('[data-action="run-stage-open"]').click(); await when(page, 'ready');
  note('reduced motion: 2D request first, 3D on request');
  // Back to the 2D request, where the automatic experiment still runs.
  await page.locator('.run-classic').click(); await page.waitForSelector('.run-stage', { state: 'detached' });
  await page.locator('[data-action="auto-play"]').click();
  await page.waitForFunction(() => ['playing', 'waiting'].includes(document.querySelector('.autoplay-controls')?.dataset.playerState));
  assert.equal(await page.locator('.run-stage').count(), 0);
  note('기존 방식으로 하기: 2D request returns and 자동재생 runs on it');
  await context.close();
  // Teacher demo: the stage opens with the same choice, arrow keys steer instead of changing activity, nothing is saved.
  ({ context, page } = await open('teacher', { width: 1280, height: 800 }));
  await seed(page, 3); await when(page, 'ready');
  await page.locator('.nav-right [data-action="settings"]').click();
  await page.evaluate(() => { for (const d of document.querySelectorAll('dialog details')) d.open = true; });
  await page.locator('dialog [data-action="admin"]').click(); await page.locator('dialog .modal-footer [data-action="close"]').click();
  await when(page, 'ready'); assert.equal(await page.locator('.run-classic').count(), 1);
  // The app saves the learner record once on entering the demo; nothing after that may change it.
  const student = JSON.stringify(await saved(page));
  await page.keyboard.down('ArrowRight'); await when(page, 'right', .4); await page.keyboard.up('ArrowRight');
  assert.equal(await page.locator('.lesson-page').getAttribute('data-lesson'), '3', 'arrow keys do not leave the activity');
  await page.keyboard.press('Space'); await page.waitForTimeout(200); assert.equal(await page.locator('dialog[open]').count(), 0, 'Space jumps, it does not press the focused button');
  const go = mover(page, steer(page, false)); await go.sideTo(0); await go.walkTo(padAt('rhythm', 'round-0')); await go.jumpTo(stones('rhythm', 0)[0]);
  assert.equal(JSON.stringify(await saved(page)), student, 'teacher demo does not write the learner record');
  note('teacher demo: stage opens, arrows steer, learner record untouched');
  await context.close();
  // No WebGL: the 2D request with a plain notice, and no offer that cannot work.
  ({ context, page } = await open('no-webgl', { width: 1280, height: 800, noWebgl: true }));
  await seed(page, 10); await page.waitForSelector('[data-action="challenge-listen"]');
  await page.waitForFunction(() => /기존 방식으로 진행/.test(document.querySelector('#coach-hint')?.textContent || ''));
  assert.equal(await page.locator('.run-stage').count(), 0); assert.equal(await page.locator('[data-action="run-stage-open"]').count(), 0);
  await page.locator('[data-action="challenge-listen"]').click(); assert.equal((await saved(page)).work[10].challenge.heard, true);
  note('no WebGL: falls back to the 2D request and it still plays');
  await context.close();
  // A real software-WebGL context loss must release the inert 2D request and retain the learner's prefix.
  ({ context, page } = await open('context-loss', { width: 1024, height: 768 }));
  await seed(page, 3); await when(page, 'ready');
  const recoveryMove = mover(page, steer(page, true));
  await recoveryMove.walkTo(padAt('rhythm', 'round-0')); await recoveryMove.jumpTo(stones('rhythm', 0)[0]);
  const prefix = (await saved(page)).work[3].challenge.sequence;
  assert.deepEqual(prefix, ['울림']);
  await page.evaluate(() => { const gl = document.querySelector('.run-stage canvas').getContext('webgl2'); const ext = gl.getExtension('WEBGL_lose_context'); if (!ext) throw Error('No context-loss test extension'); ext.loseContext(); });
  await page.waitForSelector('.run-stage', { state: 'detached' });
  assert.equal(await page.locator('main[inert]').count(), 0); assert.deepEqual((await saved(page)).work[3].challenge.sequence, prefix);
  assert.match(await page.locator('#coach-hint').textContent(), /기존 방식.*신호는 그대로/);
  await page.locator('[data-action="challenge-rest"]').click();
  assert.deepEqual((await saved(page)).work[3].challenge.sequence, ['울림', '쉼']);
  await page.locator('[data-action="challenge-ring"]').click();
  assert.equal((await saved(page)).work[3].challenge.proof.length, 1);
  await page.waitForTimeout(560); // the same between-round input guard as the regular 2D student flow
  for (const action of ['ring', 'rest', 'ring', 'rest', 'ring']) await page.locator(`[data-action="challenge-${action}"]`).click();
  assert.equal((await saved(page)).work[3].challenge.proof.length, 2); assert.ok((await saved(page)).evidence[3]);
  await page.screenshot({ path: path.join(out, 'context-loss-2d-complete.png') });
  note('context loss: prefix retained, 2D controls active, request completed with no duplicate proof');
  await context.close();
  // Fatal initializer and render failures must also be caught, without an unhandled promise or an inert page.
  for (const fault of ['initializer', 'render']) {
    ({ context, page } = await open(`failed-${fault}`, { width: 1024, height: 768 }));
    await page.route('**/src/run-stage.js', async route => {
      const response = await route.fetch(), source = await response.text();
      const body = fault === 'initializer' ? "export function openRunStage(){throw Error('QA initialization failure');}"
        : source.replace('renderer.render(scene, camera)', "(()=>{throw Error('QA render failure');})()");
      await route.fulfill({ response, body, contentType: 'text/javascript' });
    });
    await seed(page, 3); await page.waitForSelector('[data-action="challenge-ring"]');
    await page.waitForFunction(() => !document.querySelector('.run-stage') && /기존 방식/.test(document.querySelector('#coach-hint')?.textContent || ''));
    assert.equal(await page.locator('main[inert]').count(), 0);
    await page.locator('[data-action="challenge-ring"]').click(); assert.deepEqual((await saved(page)).work[3].challenge.sequence, ['울림']);
    note(`${fault} failure: 2D request active with explanation and unchanged proof`);
    await context.close();
  }
  // A missing runner picture already has a plain-figure fallback; it need not abandon a working stage.
  ({ context, page } = await open('runner-image', { width: 1024, height: 768 }));
  await page.route('**/image/generated/explorer-walk-lite.webp', route => route.abort());
  await seed(page, 3); await when(page, 'ready'); await page.waitForSelector('.run-loading', { state: 'detached' });
  await mover(page, steer(page, true)).jumpTo(stones('rhythm', 'practice')[0]); await page.waitForTimeout(120);
  assert.match(await line(page), /떨리면서 소리/); assert.deepEqual((await saved(page)).work[3]?.challenge?.proof || [], []);
  await page.locator('.run-classic').click(); await page.waitForSelector('.run-stage', { state: 'detached' });
  assert.equal(await page.locator('main[inert]').count(), 0);
  note('runner picture blocked: existing plain figure still plays; manual 2D path remains available');
  await context.close();
  // Models that cannot be fetched leave the plain drum shapes and the painted arch; the stage still plays.
  ({ context, page } = await open('no-models', { width: 1280, height: 800 }));
  await page.route('**/*.glb', route => route.abort());
  await seed(page, 3); await when(page, 'ready'); await page.waitForTimeout(1500);
  assert.deepEqual((await probe(page)).models, { arch: false, drums: 0 });
  await mover(page, steer(page, false)).jumpTo(stones('rhythm', 'practice')[0]); await page.waitForTimeout(120); assert.match(await line(page), /떨리면서 소리/);
  await page.screenshot({ path: path.join(out, 'no-models.png') });
  note('models blocked: plain drums and painted arch, the stage still plays');
  await context.close();
}

let failure = null;
try {
  if (!process.argv.includes('--fallback-only')) {
  await playRhythm('rhythm-keyboard-1280', { width: 1280, height: 800 }, false);
  await playMelody('melody-touch-1024', { width: 1024, height: 768 }, true);
  await playRhythm('rhythm-touch-1024', { width: 1024, height: 768 }, true);
  await playMelody('melody-keyboard-1280', { width: 1280, height: 800 }, false);
  }
  await fallbacks();
} catch (error) { failure = error; }
// A cancelled request while a page closes is not a fault of the game.
const faults = runtime.filter(e => !/ERR_ABORTED|net::ERR_FAILED/.test(e.text || ''));
await writeFile(path.join(out, 'results.json'), JSON.stringify({ run, base, checks, runtime, failure: failure ? String(failure.stack || failure) : null }, null, 2));
if (failure) { console.error(failure); process.exit(1); }
if (faults.length) { console.error('Runtime errors:', faults); process.exit(1); }
console.log(`PASS · ${checks.length} checks · ${base}`);
process.exit(0);
