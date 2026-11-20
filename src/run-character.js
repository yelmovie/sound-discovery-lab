// The runner of the 3D run stage: the map's own explorer sheet stood up as a billboard, plus a round shadow.
import * as THREE from './vendor/three/three.module.min.js';

// Rows of image/generated/explorer-walk-lite.webp (2026-11-21 lossy copy of explorer-walk.webp, same size and alpha), four frames each.
const ROW = { front: 0, left: 1, right: 2, back: 3 };
const HEIGHT = 1.55, CELL = 256;

export function loadImage(src) {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(Error(`Missing ${src}`)); image.src = src; });
}
/** Alpha bounds of every cell, so each frame stands on its own feet whatever the padding. */
function sheetFrames(image, columns = 4, rows = 4) {
  const scratch = document.createElement('canvas'); scratch.width = image.naturalWidth; scratch.height = image.naturalHeight;
  const context = scratch.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, scratch.width, scratch.height), solid = (x, y) => data[(y * scratch.width + x) * 4 + 3] >= 128;
  const emptyRow = y => { for (let x = 0; x < scratch.width; x++) if (solid(x, y)) return false; return true; };
  // A few feet cross the exact quarter line, so cut at the empty row nearest to it.
  const edges = [0];
  for (let n = 1; n < rows; n++) {
    const expected = Math.round(scratch.height * n / rows);
    let cut = expected;
    for (let d = 0; d < scratch.height / 20; d++) { if (emptyRow(expected - d)) { cut = expected - d; break; } if (emptyRow(expected + d)) { cut = expected + d; break; } }
    edges.push(cut);
  }
  edges.push(scratch.height);
  const frames = []; let tallest = 1;
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const left = Math.floor(column * scratch.width / columns), right = Math.floor((column + 1) * scratch.width / columns);
    let minX = right, minY = edges[row + 1], maxX = left, maxY = edges[row];
    for (let y = edges[row]; y < edges[row + 1]; y++) for (let x = left; x < right; x++) if (solid(x, y)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (minX > maxX) throw Error('Empty sprite frame');
    frames.push({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
    tallest = Math.max(tallest, maxY - minY + 1);
  }
  return { frames, tallest };
}

// Frames of image/generated/run-stage/explorer-jump.webp: crouch, push off, rise, top, fall, land.
const JUMP = { push: 1, rise: 2, top: 3, fall: 4, land: 5 };

export async function createRunner(src, jumpSrc) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = CELL;
  const pen = canvas.getContext('2d');
  let image = null, sheet = null, jumpImage = null, jumpSheet = null;
  try { image = await loadImage(src); sheet = sheetFrames(image); } catch { /* the plain figure below still plays */ }
  if (jumpSrc) try { jumpImage = await loadImage(jumpSrc); jumpSheet = sheetFrames(jumpImage, 6, 1); } catch { /* without it a stretch and squash read as the jump */ }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: .08 });
  const sprite = new THREE.Sprite(material); sprite.center.set(.5, 0); sprite.scale.set(HEIGHT, HEIGHT, 1); sprite.renderOrder = 3;
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x10242c, transparent: true, opacity: .26, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), shadowMaterial); shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 1;
  let shown = -1, clock = 0, facing = 'back';
  function show(index, jump = false) {
    const id = jump ? 100 + index : index;
    if (id === shown) return; shown = id;
    pen.clearRect(0, 0, CELL, CELL);
    if (!sheet) { // stand-in when the sheet cannot load
      pen.fillStyle = '#2f6fb3'; pen.beginPath(); pen.roundRect(84, 110, 88, 120, 30); pen.fill();
      pen.fillStyle = '#8a5a3c'; pen.beginPath(); pen.arc(128, 80, 52, 0, Math.PI * 2); pen.fill();
      texture.needsUpdate = true; return;
    }
    const from = jump ? jumpSheet : sheet, f = from.frames[index], k = (CELL - 12) / from.tallest;
    pen.imageSmoothingEnabled = false;
    pen.drawImage(jump ? jumpImage : image, f.x, f.y, f.width, f.height, Math.round(CELL / 2 - f.width * k / 2), Math.round(CELL - f.height * k), Math.round(f.width * k), Math.round(f.height * k));
    texture.needsUpdate = true;
  }
  show(ROW.back * 4);
  return {
    sprite, shadow,
    /** move: {x,z} input, airborne: feet off the ground, vy: upward speed, landed: just came down from a jump, cheer: facing the learner. */
    update(dt, { move = { x: 0, z: 0 }, airborne = false, vy = 0, landed = false, cheer = false, flinch = 0 } = {}) {
      clock += dt;
      const shake = flinch > 0 ? Math.sin(clock * 60) * .05 * flinch : 0;
      if (jumpSheet && (airborne || landed) && !cheer) {
        show(landed && !airborne ? JUMP.land : vy > 3.4 ? JUMP.push : vy > 1.2 ? JUMP.rise : vy > -1.2 ? JUMP.top : JUMP.fall, true);
        facing = 'back'; sprite.scale.set(HEIGHT + shake, HEIGHT, 1); return;
      }
      const rising = vy > 0;
      const moving = Math.hypot(move.x, move.z) > .15;
      if (cheer) facing = 'front';
      else if (moving) facing = Math.abs(move.x) > Math.abs(move.z) ? (move.x < 0 ? 'left' : 'right') : move.z > 0 ? 'front' : 'back';
      else facing = 'back';
      const step = cheer ? Math.floor(clock * 6) % 2 * 2 : airborne ? 1 : moving ? Math.floor(clock * 9) % 4 : 0;
      show(ROW[facing] * 4 + step);
      // No jump drawing exists yet, so a stretch on the way up and a squash on the way down read as the jump.
      const stretch = airborne ? (rising ? 1.08 : .96) : 1;
      sprite.scale.set(HEIGHT * (2 - stretch) + shake, HEIGHT * stretch, 1);
    },
    dispose() { texture.dispose(); material.dispose(); shadow.geometry.dispose(); shadowMaterial.dispose(); }
  };
}
