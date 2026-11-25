// The 3D run stage for the 울림 징검다리 and 높낮이 잠금문 requests. Loaded on demand.
// This file only draws and walks. What a landing means and whether a round is solved is decided by
// run-stage-rules.js and the existing runChallenge; nothing here is a physics result.
// Walking, jumping and the checkpoint return follow the structure of the three.js games_fps example
// (sub-steps, gravity only in the air, jump only from the floor), with box and disc floors instead of an octree.
import * as THREE from './vendor/three/three.module.min.js';
import { lengths, runStageAssets, runStageModels } from './data.js';
import { checkChallenge, challengeRoundCount } from './challenge-rules.js';
import { courseFor, landingAction, landingOutcome, runProgress, runGoal, rhythmNeedsRestart, runGuide, RUN_MISSIONS, RUN_SPEED, JUMP_SPEED, GRAVITY, STEP_UP } from './run-stage-rules.js';
import { bindRunInput } from './run-input.js';
import { createRunner, loadImage } from './run-character.js';
import { createRunHud } from './run-stage-hud.js';

const FONT = '"NanumSquareNeo","Malgun Gothic","Apple SD Gothic Neo",sans-serif';
// Colour distinguishes the different ruler lengths.
const PITCH = { 18: '#3f7fd6', 12: '#2fa37c', 6: '#ec7f3a' };
const ART = '/image/generated/run-stage/', MODELS = '/media/models/run-stage/';
const WATER = -.62;
// How the painted gate arch sits on the goal pad: its width in metres and how far its feet are lifted.
const ARCH = { width: 4, lift: -.04, lampX: 1.61, lampY: 3.1 };
const z = s => -s;
/** Repeat a picture every `tile` metres across a box that is `width` by `depth`. */
function tiled(geometry, width, depth, tile) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width / tile, uv.getY(i) * depth / tile);
  return geometry;
}

function drawn(width, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}
function sign(text, { color = '#17394b' } = {}) {
  const width = 72 + [...text].length * 46;
  const texture = drawn(width, 104, g => {
    g.fillStyle = '#fffdf3'; g.beginPath(); g.roundRect(4, 4, width - 8, 96, 26); g.fill();
    g.strokeStyle = color; g.lineWidth = 6; g.stroke();
    g.fillStyle = color; g.font = `800 46px ${FONT}`; g.textBaseline = 'middle'; g.fillText(text, 36, 55);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true })); sprite.scale.set(width / 104 * .6, .6, 1);
  return sprite;
}

export function openRunStage(host, o) {
  const id = o.id, course = courseFor(id), guide = runGuide[id], total = challengeRoundCount(id);
  const blocked = () => document.hidden || Boolean(document.querySelector('dialog[open]'));
  const hud = createRunHud(host, { id, title: RUN_MISSIONS[id], canJump: course.canJump, onClassic: () => o.onClassic() });
  // Ask for the context first: without WebGL2 the 2D request takes over quietly.
  const gl = hud.canvas.getContext('webgl2', { antialias: true, powerPreference: 'low-power' });
  let renderer = null;
  try { if (gl) renderer = new THREE.WebGLRenderer({ canvas: hud.canvas, context: gl, antialias: true }); } catch { renderer = null; }
  if (!renderer) { hud.destroy(); o.onFail(); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#bfe6f2'); scene.fog = new THREE.Fog('#bfe6f2', 26, 70);
  const camera = new THREE.PerspectiveCamera(46, 2, .1, 160);
  const OFFSET = new THREE.Vector3(0, 4, 8.1);
  camera.position.copy(OFFSET); camera.lookAt(0, 1.1, -3.6); scene.add(camera);
  // Height of the horizon in front of the camera at a given distance, for things that travel with it.
  const horizonAt = distance => distance * Math.tan(-camera.rotation.x);
  scene.add(new THREE.HemisphereLight('#ffffff', '#7fa7b5', 1.25));
  const sun = new THREE.DirectionalLight('#fff3d6', 1.5); sun.position.set(-4, 9, 5); scene.add(sun);

  const disposables = [], animated = [];
  const keep = thing => { disposables.push(thing); return thing; };
  const lambert = color => keep(new THREE.MeshLambertMaterial({ color }));
  const add = (geometry, material, x, y, zed, parent = scene) => { const mesh = new THREE.Mesh(keep(geometry), material); mesh.position.set(x, y, zed); parent.add(mesh); return mesh; };
  const label = (text, x, y, zed, options) => { const s = sign(text, options); keep(s.material.map); keep(s.material); s.position.set(x, y, zed); scene.add(s); return s; };

  // ---- stage: plain shapes, textured later by the pictures in image/generated/run-stage/ ----
  const water = lambert('#3ea6c6'), waterDepth = course.length + 90;
  add(tiled(new THREE.PlaneGeometry(120, waterDepth), 120, waterDepth, 7), water, 0, WATER, z(course.length / 2)).rotation.x = -Math.PI / 2;
  const padMaterial = lambert('#ead9a6'), plankMaterial = lambert('#a8733f'), stoneSide = lambert('#c4532f'), skin = lambert('#fbf1d7'), floorMaterial = lambert('#e3d5b7');
  const benchMaterial = lambert('#8a6a4c'), clampMaterial = lambert('#4f5d6b'), keyMaterials = {}, gapShadow = keep(new THREE.MeshBasicMaterial({ color: 0x10242c, transparent: true, opacity: .16, depthWrite: false }));
  const stones = new Map(), keys = new Map(), sectionOf = p => `${p.section}:${p.index}`;
  for (const p of course.platforms) {
    // Pads, floor and drums stand in the water: their bodies go below the surface, nothing hovers.
    if (p.kind === 'pad') add(tiled(new THREE.BoxGeometry(p.halfWidth * 2, 1.6, p.halfDepth * 2), p.halfWidth * 2, p.halfDepth * 2, 2.1), padMaterial, p.x, p.top - .8, z(p.s));
    else if (p.kind === 'floor') add(tiled(new THREE.BoxGeometry(p.halfWidth * 2, 1.6, p.halfDepth * 2), p.halfWidth * 2, p.halfDepth * 2, 2.25), floorMaterial, p.x, p.top - .8, z(p.s));
    else if (p.kind === 'bench') {
      add(new THREE.BoxGeometry(p.halfWidth * 2, p.top - .05, p.halfDepth * 2), benchMaterial, p.x, (p.top - .05) / 2, z(p.s));
      add(new THREE.BoxGeometry(p.halfWidth * 2, .06, .12), clampMaterial, p.x, p.top + .03, z(p.s));
    }
    else if (p.kind === 'plank') add(new THREE.BoxGeometry(p.halfWidth * 2, .12, p.halfDepth * 2), plankMaterial, p.x, p.top - .06, z(p.s));
    else if (p.kind === 'stone') {
      // A drum-shaped stone. Its skin and the rings are the 떨림 display, drawn by code.
      const side = add(new THREE.CylinderGeometry(p.radius, p.radius * .93, .8, 32), stoneSide, p.x, p.top - .4, z(p.s));
      const top = add(new THREE.CircleGeometry(p.radius, 40), skin, p.x, p.top + .012, z(p.s)); top.rotation.x = -Math.PI / 2;
      const rings = [0, 1, 2].map(n => {
        const material = keep(new THREE.MeshBasicMaterial({ color: '#0b8f9c', transparent: true, opacity: 0, depthWrite: false }));
        const ring = add(new THREE.RingGeometry(.46, .54, 40), material, p.x, p.top + .03 + n * .002, z(p.s)); ring.rotation.x = -Math.PI / 2; return ring;
      });
      const entry = { p, side, top, rings, ringFrom: 0, ringEnds: 0 };
      stones.set(sectionOf(p), entry); animated.push(entry);
    } else if (p.kind === 'key') {
      // A ruler held on the bench at its near end. The free part hangs clear of the floor, is 6, 12 or 18 cm
      // to scale and shakes about the held end when stepped on.
      const pivot = new THREE.Group(); pivot.position.set(p.x, 0, z(p.rowStart)); scene.add(pivot);
      const depth = p.halfDepth * 2, material = keyMaterials[p.length] ??= lambert(PITCH[p.length]);
      const body = add(new THREE.BoxGeometry(p.halfWidth * 2 - .1, .05, depth + .26), material, 0, p.top - .025, -depth / 2 + .15, pivot);
      const under = add(new THREE.PlaneGeometry(p.halfWidth * 2 - .1, depth - .04), gapShadow, p.x, .008, z(p.s)); under.rotation.x = -Math.PI / 2;
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
      const face = keep(new THREE.CanvasTexture(canvas)); face.colorSpace = THREE.SRGBColorSpace;
      const plate = add(new THREE.PlaneGeometry(1.16, .58), keep(new THREE.MeshBasicMaterial({ map: face })), 0, p.top + .006, -.42, pivot); plate.rotation.x = -Math.PI / 2;
      // The length is written by code; a played key turns teal with a tick instead of a sign floating above it.
      const paint = played => {
        const g = canvas.getContext('2d'); g.clearRect(0, 0, 256, 128);
        g.fillStyle = played ? '#086a73' : '#fffdf3'; g.beginPath(); g.roundRect(6, 6, 244, 116, 24); g.fill();
        g.fillStyle = played ? '#fffdf3' : '#17394b'; g.font = `800 ${played ? 54 : 62}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(played ? `✓ ${p.length} cm` : `${p.length} cm`, 128, 68); face.needsUpdate = true;
      };
      paint(false);
      const entry = { p, pivot, body, paint, shakeEnds: 0, shakeFrom: 0, played: false };
      keys.set(`${sectionOf(p)}:${p.lane}`, entry); animated.push(entry);
    }
  }
  // Section signs and the goal. Words are drawn by code, never baked into a picture.
  // Every sign stands on a post in the water. Far signs would pile up on screen and reached ones would fill
  // a corner, so each shows only while it is a short way ahead.
  const posts = [], postMaterial = lambert('#f1e3c4');
  const post = (target, near, far) => {
    const height = target.position.y + .52, pole = add(new THREE.CylinderGeometry(.045, .045, height, 8), postMaterial, target.position.x, target.position.y - .3 - height / 2 + .1, target.position.z - .02);
    const entry = { pole, signs: [target], z: target.position.z, near, far }; posts.push(entry); return entry;
  };
  for (const pad of course.pads) {
    const name = pad.name === 'start' ? '연습' : pad.name === 'goal' ? '도착' : `${Number(pad.name.split('-')[1]) + 1}구간`;
    // Section signs stand on the side that has no other signs: left of the drums, right of the ruler rows.
    post(label(name, (id === 'melody' ? 1 : -1) * (pad.halfWidth + .45), 1.5, z(pad.s) - .6, { color: '#086a73' }), 2.6, 24);
  }
  const goalPad = course.pads.at(-1), gate = new THREE.Group(); gate.position.set(0, 0, z(goalPad.s) - .5); scene.add(gate);
  const frameMaterial = lambert('#6f5bb5'), doorMaterial = lambert('#8f7bd6'), arch = new THREE.Group(); gate.add(arch);
  for (const side of [-1, 1]) add(new THREE.BoxGeometry(.34, 2.6, .34), frameMaterial, side * 1.5, 1.3, 0, arch);
  add(new THREE.BoxGeometry(3.4, .34, .4), frameMaterial, 0, 2.6, 0, arch);
  // Door leaves hang on hinges at the posts and swing away from the runner, so they never pass through the frame.
  const doors = [-1, 1].map(side => {
    const hinge = new THREE.Group(); hinge.position.set(side * 1.33, 0, -.06); gate.add(hinge);
    const leaf = add(new THREE.BoxGeometry(1.31, 2.6, .1), doorMaterial, -side * .655, 1.3, 0, hinge); leaf.scale.x = -side;
    return { hinge, leaf, side };
  });
  // One lamp per section sits on top of the frame, one over each post.
  const lamps = Array.from({ length: total }, (_, n) => add(new THREE.SphereGeometry(.2, 16, 12), keep(new THREE.MeshBasicMaterial({ color: '#8a8f99' })), (n - (total - 1) / 2) * 3 / Math.max(1, total - 1), 2.95, 0, gate));

  if (id === 'melody') for (const p of course.platforms) if (p.kind === 'key' && p.lane === 0 && p.section !== 'practice') post(label(`${p.index + 1}`, -(course.halfWidth + .55), .7, z(p.rowStart) - .3, { color: '#6f5bb5' }), .4, 13);

  // ---- character, companion ----
  const pos = new THREE.Vector3(0, 0, 0), vel = new THREE.Vector3();
  let runner = null, pio = null, grounded = true, ground = course.pads[0], jumped = false, safe = course.pads[0];
  let landedUntil = 0, fails = 0, notice = '', noticeKind = 'hint', noticeEnds = 0, cheerEnds = 0, flinchEnds = 0, tween = null, finished = false, doneTimer = 0, destroyed = false;
  const practice = { jumped: false, walked: false, keys: new Set() };
  const firstStone = course.platforms.find(p => p.kind === 'stone' && p.section === 'practice');
  const padFor = round => course.pads.find(p => p.name === `round-${round}`) || course.pads[0];
  const centre = p => ({ x: p.x, y: p.top, z: z(p.kind === 'key' ? p.rowStart + Math.min(.4, p.halfDepth) : p.s) });
  function stand(platform) { const c = centre(platform); pos.set(c.x, c.y, c.z); vel.set(0, 0, 0); grounded = true; jumped = false; ground = platform; }
  function say(text, seconds = 4.5, kind = 'hint') { notice = text; noticeKind = kind; noticeEnds = performance.now() + seconds * 1000; }
  /** Hop back to a platform without it counting as a landing. */
  function bounce(platform) {
    const to = centre(platform); tween = { from: pos.clone(), to: new THREE.Vector3(to.x, to.y, to.z), t: 0, platform };
    vel.set(0, 0, 0); input.clear(); flinchEnds = performance.now() + 450;
  }

  const input = bindRunInput(host, { blocked, onGesture: () => o.unlock?.(), onUnit: () => { if (id === 'melody' && !checkChallenge(id, o.challenge())) { notice = ''; o.act('listen'); } } });

  // ---- floors ----
  const inside = (p, x, zed) => p.radius ? Math.hypot(x - p.x, zed - z(p.s)) <= p.radius : Math.abs(x - p.x) <= p.halfWidth && Math.abs(zed - z(p.s)) <= p.halfDepth;
  function floorUnder(x, zed, limit) {
    let best = null;
    for (const p of course.platforms) if (p.top <= limit && inside(p, x, zed) && (!best || p.top > best.top)) best = p;
    return best;
  }

  // ---- what a landing does ----
  function arrive(platform, how) {
    if (platform.kind === 'pad') { safe = platform; return; }
    if (platform.kind === 'plank' || platform.kind === 'floor' || platform.kind === 'bench') return;
    const now = performance.now();
    if (platform.section === 'practice') {
      safe = platform;
      if (id === 'rhythm') {
        const entry = stones.get(sectionOf(platform));
        if (how === 'jump') { practice.jumped = true; entry.ringFrom = now; entry.ringEnds = now + 1500; entry.finale = true; o.sound.play({ frequency: 520, kind: 'fork', duration: .65 }); say(guide.ring, 2.6, ''); }
        else { practice.walked = true; for (const s of stones.values()) s.ringEnds = 0; o.sound.stop(); say(guide.rest, 2.6, ''); }
      } else {
        const entry = keys.get(`${sectionOf(platform)}:${platform.lane}`); practice.keys.add(platform.length);
        entry.shakeFrom = now; entry.shakeEnds = now + 800;
        o.sound.play({ frequency: lengths.find(l => l.value === platform.length).frequency, level: .5, duration: .8 });
        say(guide.note(platform.length), 3.2, '');
      }
      return;
    }
    const c = o.challenge(), move = landingAction(id, c, { section: platform.section, index: platform.index, how, length: platform.length });
    if (!move) return;
    if (move.skip) { say(guide.skip); bounce(safe); return; }
    const before = structuredClone(c), round = runProgress(id, c).round;
    notice = '';
    o.act(move.action, move.value);
    const after = o.challenge(), result = landingOutcome(id, before, after);
    if (id === 'melody' && !before.heard) { bounce(padFor(round)); fails++; return; }
    if (id === 'melody') { const entry = keys.get(`${sectionOf(platform)}:${platform.lane}`); entry.shakeFrom = now; entry.shakeEnds = now + 900; }
    if (id === 'rhythm' && move.action === 'ring' && result !== 'wrong') { const entry = stones.get(sectionOf(platform)); entry.finale = result !== 'step'; entry.ringFrom = now; entry.ringEnds = now + (entry.finale ? 1500 : 4000); }
    if (result === 'wrong') {
      fails++; bounce(id === 'melody' ? padFor(round) : safe);
      // The 2D wording talks about slots and dragging, so the melody stage says the same thing in its own words.
      if (id === 'melody') say(guide.retry, 7);
      return;
    }
    safe = platform;
    if (result === 'step') say(id === 'rhythm' ? guide[move.action] : guide.note(platform.length), 3.2, '');
    if (result !== 'step') { fails = 0; cheerEnds = now + 1300; }
    if (result === 'complete') { finished = true; doneTimer = window.setTimeout(() => { if (!destroyed) o.onDone(); }, 2800); }
  }

  // ---- state → pictures ----
  let stamp = '';
  function syncState() {
    let c = o.challenge();
    if (id === 'rhythm' && !finished && rhythmNeedsRestart(c) && !checkChallenge(id, c)) {
      o.act('clear'); c = o.challenge();
      for (const s of stones.values()) s.ringEnds = 0;
      stand(padFor(runProgress(id, c).round)); safe = ground; tween = null; say(guide.restart);
    }
    const at = runProgress(id, c), solved = c.proof?.length || 0, done = checkChallenge(id, c);
    const inPractice = !solved && !at.step && pos.z > z(padFor(0).s - 1.6) && !done;
    const nearFirstStone = firstStone && pos.z <= z(firstStone.s - 1.75);
    let action;
    if (id === 'melody' && !c.heard && !done && !inPractice) action = 'listen';
    else if (inPractice && !notice && firstStone && !practice.jumped) action = nearFirstStone ? 'jump' : 'forward';
    else if (inPractice && !notice && !firstStone && !practice.keys.size && pos.z > -1) action = 'forward';
    const next = JSON.stringify([solved, c.sequence, c.message, c.kind, c.heard, c.sounding, notice, fails >= 3, practice.jumped, practice.walked, practice.keys.size, inPractice, action]);
    if (next === stamp) return; stamp = next;
    // The key stays marked after landing. The target contour has no matching key colour.
    for (const entry of keys.values()) {
      const p = entry.p; if (p.section === 'practice') continue;
      const played = p.section === at.round && !done && p.index < at.step && c.sequence?.[p.index] === p.length;
      if (played !== entry.played) { entry.played = played; entry.paint(played); }
    }
    lamps.forEach((lamp, n) => lamp.material.color.set(n < solved ? '#ffd257' : '#8a8f99'));
    const prompt = action === 'jump' ? '위 화살표를 누른 채 점프해 봐.' : id === 'rhythm' ? guide.practice[!practice.jumped ? 0 : !practice.walked ? 1 : 2] : guide.practice[practice.keys.size < 3 ? 0 : 1];
    const line = done ? (c.message || '주민의 의뢰를 모두 해결했어!') : notice || c.message || (inPractice ? prompt : id === 'melody' && !c.heard ? guide.practice[2] : guide.play);
    hud.update({
      goal: done ? runGoal(id, { proof: c.proof.slice(0, total - 1) }).map(g => ({ ...g, filled: true })) : runGoal(id, c), now: done ? -1 : at.step,
      roundText: done ? `${total} / ${total} 통과` : `${solved} / ${total} 통과`,
      line: fails >= 3 && !done && !notice ? guide.hint : line, kind: done ? 'success' : notice ? noticeKind : c.kind === 'success' ? 'success' : c.kind === 'hint' || fails >= 3 ? 'hint' : '',
      action, heard: Boolean(c.heard), finished: done
    });
  }

  // ---- one small step of walking, as games_fps does it ----
  function step(dt, now) {
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / .38);
      pos.lerpVectors(tween.from, tween.to, tween.t); pos.y += Math.sin(tween.t * Math.PI) * .7;
      if (tween.t === 1) { stand(tween.platform); tween = null; }
      return;
    }
    const want = input.vector(), ease = Math.min(1, (grounded ? 14 : 9) * dt);
    vel.x += (want.x * RUN_SPEED - vel.x) * ease; vel.z += (want.z * RUN_SPEED - vel.z) * ease;
    if (grounded && course.canJump && input.jumpPending(now)) { input.consumeJump(); vel.y = JUMP_SPEED; grounded = false; jumped = true; ground = null; }
    if (!grounded) vel.y -= GRAVITY * dt;
    const before = pos.y;
    pos.x += vel.x * dt; pos.z += vel.z * dt; pos.y += vel.y * dt;
    pos.z = Math.min(course.pads[0].halfDepth - .15, Math.max(z(course.length) + .15, pos.z));
    // The melody floor has side rails; the stepping stones do not.
    if (!course.canJump) pos.x = Math.max(-course.halfWidth + .22, Math.min(course.halfWidth - .22, pos.x));
    if (grounded) {
      const floor = floorUnder(pos.x, pos.z, pos.y + STEP_UP);
      if (!floor) { grounded = false; ground = null; jumped = false; return; }
      pos.y = floor.top; vel.y = 0;
      if (floor !== ground) { ground = floor; arrive(floor, 'walk'); }
    } else if (vel.y <= 0) {
      const floor = floorUnder(pos.x, pos.z, before + .02);
      if (floor && pos.y <= floor.top) {
        pos.y = floor.top; vel.y = 0; grounded = true;
        const how = jumped ? 'jump' : 'walk'; if (jumped) landedUntil = now + 130; jumped = false; ground = floor; arrive(floor, how);
      } else if (pos.y < -2.2) { fails++; say(guide.fall); stand(safe); void o.sound.effect?.('bump', { polite: true }); }
    }
  }

  // The companion flies high on the right, clear of the signposts.
  const cameraAt = new THREE.Vector3(), pioSide = 3.1;
  let flowing = null;
  const drifting = [];
  let last = performance.now(), frameId = 0;
  function frame(now) {
    if (destroyed) return;
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (blocked()) { input.clear(); return; }
    if (notice && now > noticeEnds) notice = '';
    syncState();
    for (let n = 0; n < 5; n++) step(dt / 5, now);
    const c = o.challenge(), cheer = now < cheerEnds || finished;
    for (const entry of animated) {
      if (entry.rings) {
        // A struck drum rings and dies away by itself; the display fades with the sound and stops when the request stops it.
        const ringing = now < entry.ringEnds && (entry.finale || c.sounding || entry.p.section === 'practice');
        if (!ringing) entry.ringEnds = 0;
        const strength = ringing ? Math.max(0, (entry.ringEnds - now) / (entry.ringEnds - entry.ringFrom || 1)) ** .6 : 0;
        entry.top.position.y = entry.p.top + .012 + Math.sin(now * .09) * .012 * strength;
        entry.rings.forEach((ring, n) => { const t = (now / 520 + n / 3) % 1; ring.scale.setScalar(.5 + t * 1.3); ring.material.opacity = (1 - t) * .8 * strength; });
      } else if (entry.pivot) {
        // Shorter free length, faster shake: 6 cm fastest, 18 cm slowest. Size of the shake is the same.
        const left = Math.max(0, (entry.shakeEnds - now) / (entry.shakeEnds - entry.shakeFrom || 1));
        entry.pivot.rotation.x = left ? Math.sin((now - entry.shakeFrom) * (.018 * 18 / entry.p.length)) * .035 * left : 0;
      }
    }
    for (const door of doors) door.hinge.rotation.y += ((finished ? -door.side * 1.85 : 0) - door.hinge.rotation.y) * Math.min(1, dt * 2.4);
    if (runner) {
      runner.sprite.position.copy(pos);
      runner.update(dt, { move: tween ? { x: 0, z: 0 } : input.vector(), airborne: !grounded && !tween, vy: vel.y, landed: now < landedUntil, cheer, flinch: Math.max(0, (flinchEnds - now) / 450) });
      // The shadow lies on whatever is below: a floor, or the water between the drums.
      const floor = floorUnder(pos.x, pos.z, pos.y + .05), below = floor ? floor.top : WATER;
      runner.shadow.visible = pos.y >= below - .05;
      runner.shadow.position.set(pos.x, below + .02, pos.z); runner.shadow.scale.setScalar(Math.max(.5, 1 - (pos.y - below) * .3));
    }
    if (pio) {
      const at = runProgress(id, c), target = finished ? goalPad : course.platforms.find(p => p.section === at.round && p.index === at.step && (p.lane ?? 1) === 1) || goalPad;
      const zed = Math.min(pos.z + 1.5, Math.max(pos.z - 6, z(target.s)));
      pio.position.x += (pioSide - pio.position.x) * Math.min(1, dt * 3); pio.position.z += (zed - pio.position.z) * Math.min(1, dt * 3);
      pio.position.y = 2.6 + Math.sin(now * .004) * .14;
    }
    // Calm water: a slow shimmer in place, so the lily pads and islands can stay where they are.
    if (flowing) flowing.offset.set(Math.sin(now * .0004) * .012, Math.cos(now * .0003) * .012);
    for (const entry of posts) { const ahead = pos.z - entry.z, show = ahead > entry.near && ahead < entry.far; entry.pole.visible = show; for (const s of entry.signs) s.visible = show; }
    for (const drift of drifting) drift.sprite.position.y = drift.y + Math.sin(now * .0006 + drift.phase) * .35;
    cameraAt.set(pos.x * .45 + OFFSET.x, OFFSET.y, pos.z + OFFSET.z);
    camera.position.lerp(cameraAt, Math.min(1, dt * 7));
    try { renderer.render(scene, camera); } catch { o.onFail(); }
  }

  function resize() {
    const width = host.clientWidth || 1, height = host.clientHeight || 1;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    // Narrow or tall screens pull the camera back a little so three lanes still fit.
    camera.fov = width / height < 1.5 ? 56 : 46; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();

  // Start where the saved request stands, so a reload continues from the same stone.
  (function place() {
    const c = o.challenge(), at = runProgress(id, c), solved = c.proof?.length || 0;
    if (id === 'rhythm' && rhythmNeedsRestart(c)) return; // syncState restarts the section
    if (!solved && !at.step) return;
    const stone = at.step ? course.platforms.find(p => p.section === at.round && p.index === at.step - 1 && (p.kind === 'stone' || p.length === c.sequence?.[at.step - 1])) : null;
    stand(stone || padFor(at.round)); safe = ground; camera.position.set(pos.x * .45, OFFSET.y, pos.z + OFFSET.z);
  })();

  // Generated pictures dress the plain shapes. A missing picture leaves the plain colour.
  // Only pictures listed in data.js exist, so nothing else is requested.
  const picture = (name, repeat = false) => !runStageAssets.includes(`${ART.slice(1)}${name}.webp`) ? Promise.resolve(null) : new Promise(resolve => new THREE.TextureLoader().load(`${ART}${name}.webp`, texture => {
    if (destroyed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    resolve(keep(texture));
  }, undefined, () => resolve(null)));
  const dress = (material, texture, color = '#ffffff') => { if (!texture) return; material.map = texture; material.color.set(color); material.needsUpdate = true; };
  picture('paving', true).then(texture => { dress(padMaterial, texture); if (!floorMaterial.map) dress(floorMaterial, texture, '#f3ece0'); });
  // The workshop tiles are drawn eight to a picture, so one picture spans the whole width of the floor.
  if (id === 'melody') picture('workshop-floor', true).then(texture => { if (texture) texture.repeat.set(.5, .5); dress(floorMaterial, texture); });
  // Wood for the planks and the ruler bench. The rulers keep their plain pitch colours so they match the goal row.
  picture('wood', true).then(texture => { dress(plankMaterial, texture, '#d9b98f'); dress(benchMaterial, texture, '#c9a57c'); });
  if (id === 'rhythm') picture('drum-side', true).then(texture => { if (texture) texture.repeat.set(3, 1); dress(stoneSide, texture); });
  // Scenery around the course. Places are fixed numbers, so every visit looks the same.
  const scatter = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
  picture('lily').then(texture => {
    if (!texture) return;
    const material = keep(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })), geometry = keep(new THREE.PlaneGeometry(1, 1));
    for (let n = 0; n < 26; n++) {
      const pad = new THREE.Mesh(geometry, material), size = .8 + scatter(n + 50) * .9;
      pad.position.set((n % 2 ? 1 : -1) * (course.halfWidth + 1.5 + scatter(n) * 6), WATER + .015, z((n + .5) / 26 * (course.length + 18) - 6));
      pad.rotation.set(-Math.PI / 2, 0, scatter(n + 9) * Math.PI * 2); pad.scale.setScalar(size); scene.add(pad);
    }
  });
  picture('island').then(texture => {
    if (!texture) return;
    // The rocky underside of the picture sits below the water line, so each islet stands in the lake.
    const material = keep(new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: .5 }));
    for (let n = 0; n < 7; n++) {
      const island = new THREE.Sprite(material), size = 5 + scatter(n + 3) * 2.5;
      island.center.set(.5, .31); island.scale.set(size * (n % 3 ? 1 : -1), size * texture.image.height / texture.image.width, 1);
      island.position.set((n % 2 ? 1 : -1) * (10.5 + scatter(n + 20) * 6), WATER, z(n * 9 + 4 + scatter(n + 7) * 4)); scene.add(island);
    }
  });
  picture('balloon').then(texture => {
    if (!texture) return;
    // Far balloons travel with the camera like the skyline, so they stay whole in the strip of sky under the goal row.
    const material = keep(new THREE.SpriteMaterial({ map: texture, transparent: true, fog: false, depthWrite: false }));
    for (const [n, x] of [-47, 43].entries()) {
      const sprite = new THREE.Sprite(material), size = 6 - n, y = horizonAt(110) + 5 + n * .8;
      sprite.scale.set(size * texture.image.width / texture.image.height, size, 1);
      sprite.position.set(x, y, -110); camera.add(sprite); drifting.push({ sprite, y, phase: n * 2 });
    }
  });
  picture('gate-door').then(texture => {
    // Keep the picture's proportions on the taller leaf: the extra height at the top repeats the edge and hides behind the arch.
    if (texture) texture.repeat.y = 2.6 / (1.31 * texture.image.height / texture.image.width);
    dress(doorMaterial, texture);
  });
  let archModel = null, archPicture = null;
  const placeLamps = front => lamps.forEach((lamp, n) => lamp.position.set((n - (total - 1) / 2) * ARCH.lampX * 2 / Math.max(1, total - 1), ARCH.lampY, front));
  picture('gate-arch').then(texture => {
    if (!texture || archModel) return;
    // A painted arch stands in front of the leaves; the plain frame steps back behind it.
    const width = ARCH.width, height = width * texture.image.height / texture.image.width;
    archPicture = add(new THREE.PlaneGeometry(width, height), keep(new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .35 })), 0, height / 2 + ARCH.lift, .14, gate);
    arch.visible = false; placeLamps(.16);
  });
  // Meshy models for the parts that never move (2026-11-21). They only change the look: landings still read
  // course.platforms, the leaves still swing and the lamps and drum skins are still drawn by code.
  // A model that does not load leaves the plain shapes and pictures above in place.
  const model = name => !runStageModels.includes(`${MODELS.slice(1)}${name}.glb`) ? Promise.resolve(null)
    : Promise.all([import('./vendor/three/GLTFLoader.js'), import('./vendor/three/meshopt_decoder.module.js')]).then(([{ GLTFLoader }, { MeshoptDecoder }]) => new Promise(resolve => {
      new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(`${MODELS}${name}.glb`, gltf => {
        const owned = [];
        gltf.scene.traverse(node => { if (!node.isMesh) return; owned.push(node.geometry); for (const m of [node.material].flat()) { owned.push(m); for (const value of Object.values(m)) if (value?.isTexture) owned.push(value); } });
        if (destroyed) { for (const thing of owned) thing.dispose(); resolve(null); return; }
        owned.forEach(keep);
        // Centre it on its footprint with its feet at 0. gltfpack keeps a dequantising scale on the inner nodes, so only the root moves.
        const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3());
        gltf.scene.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
        resolve({ scene: gltf.scene, size });
      }, undefined, () => resolve(null));
    })).catch(() => null);
  model('gate-arch').then(made => {
    if (!made) return;
    // Same width as the painted arch, so the opening still fits the two leaves and the lamps sit on the band over it.
    const scale = ARCH.width / made.size.x;
    archModel = new THREE.Group(); archModel.add(made.scene); archModel.scale.setScalar(scale); archModel.position.set(0, ARCH.lift, 0); gate.add(archModel);
    arch.visible = false; if (archPicture) archPicture.visible = false;
    placeLamps(made.size.z * scale / 2 + .06);
  });
  if (id === 'rhythm') model('drum').then(made => {
    if (!made) return;
    // Each stone gets the drum body at its own size: as wide as the stone, top level with the stone top, foot in the water.
    // The skin on top stays the code-drawn circle with the rings, the 떨림 display.
    for (const entry of stones.values()) {
      const { p } = entry, body = new THREE.Group(); body.add(made.scene.clone());
      body.scale.set(p.radius * 2 / made.size.x, .8 / made.size.y, p.radius * 2 / made.size.z);
      body.position.set(p.x, p.top - .8, z(p.s)); scene.add(body); entry.side.visible = false;
    }
  });
  picture('water', true).then(texture => { dress(water, texture); flowing = texture; });
  if (id === 'rhythm') picture('drum-top').then(texture => { if (texture) { skin.transparent = true; skin.alphaTest = .5; } dress(skin, texture); });
  picture('skyline').then(texture => {
    if (!texture) return;
    // A far picture that travels with the camera, so the city stays on the horizon.
    // Three mirrored copies side by side keep the buildings small and reach past the edges of a wide phone screen;
    // the picture's horizon sits on the stage's horizon.
    texture.wrapS = THREE.MirroredRepeatWrapping; texture.repeat.x = 3;
    const height = 95 * texture.image.height / texture.image.width, horizon = horizonAt(118);
    const far = add(new THREE.PlaneGeometry(285, height), keep(new THREE.MeshBasicMaterial({ map: texture, fog: false, depthWrite: false })), 0, horizon - height * .02, -118, camera);
    far.renderOrder = -1;
  });
  createRunner('/image/generated/explorer-walk-lite.webp', runStageAssets.includes(`${ART.slice(1)}explorer-jump.webp`) ? `${ART}explorer-jump.webp` : '').then(made => {
    if (destroyed) { made.dispose(); return; }
    runner = made; scene.add(runner.shadow, runner.sprite); hud.ready();
  }).catch(() => { if (!destroyed) o.onFail(); });
  loadImage('/image/generated/concepts/pio-fly.webp').then(image => {
    if (destroyed) return;
    const texture = keep(new THREE.Texture(image)); texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true;
    pio = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: texture, transparent: true }))); pio.scale.set(1.05, .94, 1); pio.position.set(pioSide, 2.6, pos.z - 3); scene.add(pio);
  }, () => {});
  frameId = requestAnimationFrame(frame);
  // Read-only position for play-through checks (scripts and browser QA).
  host.runProbe = () => ({ x: pos.x, s: -pos.z, y: pos.y, grounded, moving: Boolean(tween), finished, fails, models: { arch: Boolean(archModel), drums: [...stones.values()].filter(entry => !entry.side.visible).length } });

  return {
    destroy() {
      destroyed = true; delete host.runProbe; cancelAnimationFrame(frameId); clearTimeout(doneTimer); observer.disconnect(); input.destroy();
      for (const thing of disposables) thing.dispose();
      runner?.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); hud.destroy();
    }
  };
}
