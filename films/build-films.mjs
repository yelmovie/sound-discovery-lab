// Writes films/<id>/ (index.html + assets) for the five 「삐오의 소리 노트」 concept films.
// Shot plan per film (16 s, 4 scenes of 4 s = the app's caption clock):
//   question + the experiment set up → the change happens (sound you can hear and a wave you can see)
//   → the part that changed, named on the object → the one-line answer + 삐오 reacts.
// Run: node films/build-films.mjs  (then films/render-films.mjs)
import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { films, DURATION, CUES, W, H, C, SFX } from './films.data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const n = v => +(+v).toFixed(3);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FPS = 30, FRAME = 1 / FPS;

class Film {
  constructor(f) { this.f = f; this.clips = []; this.tl = []; this.z = 2; this.imgs = new Map(); this.sfx = new Set(); this.sounds = []; this.waveH = {}; }
  clip(id, start, dur, html, style = '') {
    this.clips.push(`<div id="${id}" class="clip full" data-start="${n(start)}" data-duration="${n(dur)}" data-track-index="${this.z}" style="z-index:${this.z++}">${html}</div>`);
  }
  t(js) { this.tl.push(js); }
  img(path) { const name = basename(path); this.imgs.set(name, path); return `assets/img/${name}`; }
  // A sound lands one frame after the picture it belongs to.
  sound(name, at, { vol = 1, dur, fadeOut } = {}) {
    this.sfx.add(name);
    this.sounds.push({ name, at: n(at + FRAME), vol, dur, fadeOut });
  }
  tag(id, text, x, y, { kind = '', anchor = 'center' } = {}) {
    const shift = anchor === 'center' ? 'translateX(-50%)' : anchor === 'right' ? 'translateX(-100%)' : 'none';
    return `<div class="tag-pos" style="left:${x}px;top:${y}px;transform:${shift}"><div id="${id}" class="tag ${kind}">${text}</div></div>`;
  }
  pop(sel, at) { this.t(`tl.fromTo('${sel}',{opacity:0,scale:.82},{opacity:1,scale:1,duration:.32,ease:'back.out(1.7)'},${n(at)});`); }
  out(sel, at, d = .2) { this.t(`tl.to('${sel}',{opacity:0,duration:${d},ease:'power2.in'},${n(at)});`); }
  fadeIn(sel, at, d = .3) { this.t(`tl.fromTo('${sel}',{opacity:0},{opacity:1,duration:${d},ease:'power2.out'},${n(at)});`); }
  // Damped back-and-forth: amplitude falls from a0 to a1 over the run. One tween of keyframes.
  osc(sel, prop, at, dur, freq, a0, a1, base = 0, extra = '') {
    const half = 1 / (2 * freq), count = Math.max(2, Math.floor(dur / half)), kf = [];
    for (let i = 0; i < count; i++) {
      const a = a0 * Math.pow(Math.max(a1, 1e-4) / a0, i / count);
      kf.push(`{${prop}:${n(base + (i % 2 ? -a : a))},duration:${n(i ? half : half / 2)},ease:'sine.inOut'}`);
    }
    kf.push(`{${prop}:${n(base)},duration:${n(half / 2)},ease:'sine.out'}`);
    this.t(`tl.set('${sel}',{${prop}:${n(base)}${extra}},${n(at)});tl.to('${sel}',{keyframes:[${kf.join(',')}]},${n(at)});`);
  }
  // A sine wave seen through a window; it scrolls so the sound reads as moving, its height is loudness and
  // the spacing between crests is how fast the object shakes (pitch).
  wave(id, x, y, w, h, lambda, { stroke = C.teal } = {}) {
    this.waveH[id] = h;
    this.t(`tl.set('#${id}-amp',{scaleY:.02,svgOrigin:'0 ${h / 2}'},0);`);
    const amp = h / 2 - 8, total = w + lambda * 2;
    let d = `M0 ${n(h / 2)}`;
    for (let px = 4; px <= total; px += 4) d += ` L${px} ${n(h / 2 - amp * Math.sin((2 * Math.PI * px) / lambda))}`;
    return `<div id="${id}" class="wave" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  <svg class="wave-axis" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/></svg>
  <svg id="${id}-run" class="wave-run" width="${total}" height="${h}" viewBox="0 0 ${total} ${h}"><g id="${id}-amp"><path d="${d}" style="stroke:${stroke}" vector-effect="non-scaling-stroke"/></g></svg>
</div>`;
  }
  waveRun(id, at, dur, lambda, speed = 160) { // speed in px per second
    const period = lambda / speed, rep = Math.max(0, Math.ceil(dur / period) - 1);
    this.t(`tl.fromTo('#${id}-run',{x:0},{x:${-lambda},duration:${n(period)},ease:'none',repeat:${rep}},${n(at)});`);
  }
  amp(id, at, from, to, d, ease = 'power2.out') {
    this.t(`tl.to('#${id}-amp',{scaleY:${to},duration:${n(d)},ease:'${ease}',svgOrigin:'0 ${this.waveH[id] / 2}'},${n(at)});`);
  }
  pio(at, text, { x = 1508, y = 560 } = {}) {
    const end = DURATION - at;
    this.clip('pio', at, end, `<img id="pio-img" class="pio" src="${this.img('image/generated/pio-guide.svg')}" alt="" style="left:${x}px;top:${y}px">
<div class="bubble-pos" style="left:${x - 16}px;top:${y + 70}px"><div id="pio-say" class="bubble">${esc(text)}</div></div>`);
    this.t(`tl.fromTo('#pio-img',{y:320},{y:0,duration:.55,ease:'back.out(1.5)'},${n(at)});`);
    this.t(`tl.fromTo('#pio-img',{scaleY:1,scaleX:1},{scaleY:.9,scaleX:1.06,duration:.12,ease:'power2.out',transformOrigin:'50% 100%'},${n(at + .62)});tl.to('#pio-img',{scaleY:1,scaleX:1,duration:.3,ease:'back.out(2.2)'},${n(at + .74)});`);
    this.pop('#pio-say', at + .75);
  }
}

// ---------- shared frame: notebook ground, header, captions ----------
function frame(F) {
  const f = F.f;
  F.clip('ground', 0, DURATION, '<div class="paper"></div>');
  F.clip('header', 0, DURATION, `<div class="head"><div id="head-chip" class="chip">삐오의 소리 노트</div><h1 id="head-title">${esc(f.title)}</h1>${f.question ? `<p id="head-q" class="question">${esc(f.question)}</p>` : ''}</div>`);
  F.t(`tl.fromTo('#head-chip',{opacity:0,x:-24},{opacity:1,x:0,duration:.45,ease:'expo.out'},.05);`);
  F.t(`tl.fromTo('#head-title',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.2,ease:'power2.out'},.15);`);
  if (f.question) { F.t(`tl.fromTo('#head-q',{opacity:0,y:12},{opacity:1,y:0,duration:.4,ease:'expo.out'},.35);`); F.out('#head-q', CUES[1] - .25); }
  f.captions.forEach((text, k) => {
    const start = CUES[k], end = k < 3 ? CUES[k + 1] : DURATION;
    F.clip(`cap${k}`, start, end - start, `<div class="cap-band"><p id="cap${k}-t">${esc(text)}</p></div>`);
    F.t(`tl.fromTo('#cap${k}-t',{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)',duration:.18,ease:'power2.out'},${n(start + .08)});`);
    if (k < 3) F.out(`#cap${k}-t`, end - .16, .14);
  });
}

// Mallet image mirrored by GSAP (scaleX -1) so its head points left; (headX, headY) is where the head lands.
const MALLET = { w: 360, h: 240, head: [50, 47], rest: { x: 150, y: -100, r: -10 } };
function mallet(F, id, headX, headY) {
  const r = MALLET.rest;
  F.t(`tl.set('#${id}',{scaleX:-1,x:${r.x},y:${r.y},rotation:${r.r}},0);`);
  return `<img id="${id}" class="abs" src="${F.img('image/generated/mallet.png')}" alt="" style="left:${headX - MALLET.head[0]}px;top:${headY - MALLET.head[1]}px;width:${MALLET.w}px;height:${MALLET.h}px">`;
}
function strike(F, id, at, power) { // wind up (bigger for a harder hit), land at `at`, back to rest
  const r = MALLET.rest, wx = n(r.x + 40 * power), wy = n(r.y - 50 * power), wr = n(r.r - 8 * power);
  F.t(`tl.to('#${id}',{x:${wx},y:${wy},rotation:${wr},duration:.32,ease:'power2.out'},${n(at - .48)});`);
  F.t(`tl.to('#${id}',{x:0,y:0,rotation:0,duration:.14,ease:'power3.in'},${n(at - .14)});`);
  F.t(`tl.to('#${id}',{x:${r.x},y:${r.y},rotation:${r.r},duration:.4,ease:'expo.out'},${n(at)});`);
}

const HAND = `<svg viewBox="0 0 220 200" width="220" height="200"><g fill="#f6c9a4" stroke="#8a5a3c" stroke-width="6" stroke-linejoin="round">
<rect x="40" y="70" width="150" height="110" rx="46"/><rect x="18" y="38" width="44" height="96" rx="22" transform="rotate(-24 40 86)"/>
<rect x="70" y="10" width="34" height="92" rx="17"/><rect x="106" y="4" width="34" height="98" rx="17"/><rect x="142" y="14" width="34" height="90" rx="17"/></g></svg>`;

// ---------- film 1: 떨림이 소리를 만들어 ----------
function vibration(F) {
  const fx = 470, fy = 330, fw = 320, fh = 480; // tuning fork, tines in the top 56 %
  F.clip('fork', 0, DURATION, `<img id="fork-stem" class="abs" src="${F.img('image/generated/tuning-fork.png')}" alt="" style="left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;clip-path:inset(56% 0 0 0)">
<img id="fork-tines" class="abs" src="${F.img('image/generated/tuning-fork.png')}" alt="" style="left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;clip-path:inset(0 0 44% 0);transform-origin:50% 56%">`);
  F.clip('fork-mallet', 0, 6.2, mallet(F, 'fm', fx + fw * .64, fy + fh * .2));
  F.t(`tl.to('#fm',{opacity:0,duration:.3},5.6);`);
  // wave of the sound
  const wx = 1120, wy = 380, ww = 520, wh = 210, lam = 150;
  F.clip('w', 0, DURATION, F.wave('wv', wx, wy, ww, wh, lam));
  F.fadeIn('#wv', .2, .4);
 
  F.waveRun('wv', 1, 8.2, lam);
  // strike 1 → shaking + sound
  strike(F, 'fm', 1, 1.2);
  F.sound('fork', 1, { vol: .9 });
  F.osc('#fork-tines', 'scaleX', 1, 3.4, 6, .06, .03, 1);
  F.amp('wv', 1, .02, 1, .12, 'power3.out');
  F.t(`tl.to('#wv-amp',{scaleY:.55,duration:3.3,ease:'power1.in',svgOrigin:'0 ${wh / 2}'},1.12);`);
  F.clip('lab1', 1.4, 7.6, F.tag('t-shake', '떨림', fx - 40, fy + 40, { anchor: 'right' }) + `<svg class="lead abs" width="${W}" height="${H}"><line id="l-shake" x1="${fx - 34}" y1="${fy + 72}" x2="${fx + fw * .4}" y2="${fy + 110}"/></svg>`);
  F.pop('#t-shake', 1.4); F.fadeIn('#l-shake', 1.45, .2);
  // strike 2 → the sound keeps going while it shakes
  strike(F, 'fm', 4.5, 1);
  F.sound('fork', 4.5, { vol: .9, dur: 9.0 - 4.5 + .3, fadeOut: .3 });
  F.osc('#fork-tines', 'scaleX', 4.5, 4.5, 6, .06, .035, 1);
  F.t(`tl.to('#wv-amp',{scaleY:1,duration:.1,ease:'power3.out',svgOrigin:'0 ${wh / 2}'},4.5);tl.to('#wv-amp',{scaleY:.62,duration:4.3,ease:'power1.in',svgOrigin:'0 ${wh / 2}'},4.62);`);
  F.clip('lab2', 4.9, 4.1, F.tag('t-sound', '소리', wx + ww / 2, wy - 70));
  F.pop('#t-sound', 4.9);
  // a hand holds the tines: shaking and sound fade out together
  F.clip('hand', 8.2, DURATION - 8.2, `<div id="hand" class="abs" style="left:${fx + 40}px;top:${fy + 30}px">${HAND}</div>`);
  F.t(`tl.fromTo('#hand',{x:-520,opacity:0},{x:0,opacity:1,duration:.55,ease:'expo.out'},8.3);tl.fromTo('#hand',{scale:1},{scale:.93,duration:.12,ease:'power2.out'},8.95);tl.to('#hand',{scale:1,duration:.2,ease:'power2.out'},9.07);`);
  F.t(`tl.to('#fork-tines',{scaleX:1,duration:.3,ease:'power2.out'},9.0);tl.to('#wv-amp',{scaleY:.02,duration:.3,ease:'power2.out',svgOrigin:'0 ${wh / 2}'},9.0);`);
  F.out('#t-shake', 8.8); F.out('#l-shake', 8.8); F.out('#t-sound', 8.8);
  F.clip('lab3', 9.4, DURATION - 9.4, F.tag('t-stop', '떨림 멈춤', fx + fw / 2, fy - 76, { kind: 'warm' }));
  F.pop('#t-stop', 9.4);
  F.clip('lab4', 12.3, DURATION - 12.3, F.tag('t-quiet', '소리 없음', wx + ww / 2, wy - 70, { kind: 'warm' }));
  F.pop('#t-quiet', 12.3);
  F.pio(12.7, '조용해졌어!', { x: 1490, y: 590 });
}

// ---------- film 2: 큰 떨림, 큰 소리 ----------
function volume(F) {
  const dx = 330, dy = 400, dw = 480, dh = 400; // drum
  const hit = [dx + 250, dy + 70];
  F.clip('drum', 0, 8.3, `<img id="drum" class="abs" src="${F.img('image/generated/drum.png')}" alt="" style="left:${dx}px;top:${dy}px;width:${dw}px;height:${dh}px">${mallet(F, 'dm', hit[0], hit[1])}`);
  F.t(`tl.to(['#drum','#dm'],{opacity:0,y:-30,duration:.3,ease:'power3.in'},7.95);`);
  const wx = 1080, wy = 400, ww = 600, wh = 260, lam = 150;
  F.clip('w', 0, 8.3, F.wave('wv', wx, wy, ww, wh, lam));
  F.fadeIn('#wv', .2, .4); F.waveRun('wv', 1, 7.2, lam);
  F.t(`tl.to('#wv',{opacity:0,duration:.3,ease:'power3.in'},7.95);`);
  // weak hit
  strike(F, 'dm', 1, .3);
  F.sound('drum', 1, { vol: .22 });
  F.osc('#drum', 'y', 1, 1.2, 9, 3, .4);
  F.amp('wv', 1, .02, .24, .1, 'power3.out');
  F.t(`tl.to('#wv-amp',{scaleY:.02,duration:1.8,ease:'power2.in',svgOrigin:'0 ${wh / 2}'},1.6);`);
  F.clip('lab1', 1.3, 2.6, F.tag('t-weak', '약하게', hit[0] + 210, dy - 130) + F.tag('t-small', '작은 소리', wx + ww / 2, wy - 64));
  F.pop('#t-weak', 1.3); F.pop('#t-small', 1.6);
  F.out('#t-weak', 3.65, .15); F.out('#t-small', 3.65, .15);
  // strong hit: same drum, same recording, only louder
  strike(F, 'dm', 4.8, 3);
  F.sound('drum', 4.8, { vol: 1 });
  F.osc('#drum', 'y', 4.8, 1.6, 9, 11, 1);
  F.amp('wv', 4.8, .02, .95, .1, 'power3.out');
  F.t(`tl.to('#wv-amp',{scaleY:.15,duration:2.6,ease:'power2.in',svgOrigin:'0 ${wh / 2}'},5.5);`);
  F.clip('lab2', 5.1, 2.8, F.tag('t-strong', '세게', hit[0] + 210, dy - 130, { kind: 'warm' }) + F.tag('t-big', '큰 소리', wx + ww / 2, wy - 64, { kind: 'warm' }));
  F.pop('#t-strong', 5.1); F.pop('#t-big', 5.4);
  F.out('#t-strong', 7.85, .15); F.out('#t-big', 7.85, .15);
  // compare: same spacing (높낮이), different height (크기)
  const cx = 470, cw = 700, lam2 = 172, rowA = 340, rowB = 560, rh = 230;
  F.clip('cmp', 8, DURATION - 8, `${F.wave('wa', cx, rowA, cw, rh, lam2)}${F.wave('wb', cx, rowB, cw, rh, lam2, { stroke: C.warm })}
${F.tag('t-a', '약하게 친 소리', cx - 40, rowA + rh / 2 - 34, { anchor: 'right' })}${F.tag('t-b', '세게 친 소리', cx - 40, rowB + rh / 2 - 34, { anchor: 'right', kind: 'warm' })}
<svg class="lead abs" width="${W}" height="${H}">
 <g id="g-gap"><line x1="${cx + lam2 * 1.25}" y1="${rowA - 6}" x2="${cx + lam2 * 1.25}" y2="${rowB + rh + 6}" class="dash"/><line x1="${cx + lam2 * 2.25}" y1="${rowA - 6}" x2="${cx + lam2 * 2.25}" y2="${rowB + rh + 6}" class="dash"/></g>
 <g id="g-height"><line x1="${cx + cw + 40}" y1="${rowB + 12}" x2="${cx + cw + 40}" y2="${rowB + rh - 12}"/><path d="M${cx + cw + 26} ${rowB + 30} l14 -18 l14 18 M${cx + cw + 26} ${rowB + rh - 30} l14 18 l14 -18"/></g>
</svg>
${F.tag('t-gap', '간격 같음 = 높낮이 같음', cx + lam2 * 1.75, rowA - 74)}${F.tag('t-height', '높이 다름 = 크기 다름', cx + cw + 70, rowB + rh / 2 - 34, { anchor: 'left', kind: 'warm' })}`);
  F.fadeIn('#wa', 8.15, .35); F.fadeIn('#wb', 8.25, .35); F.pop('#t-a', 8.3); F.pop('#t-b', 8.4);
  F.t(`tl.set('#wa-amp',{scaleY:.24,svgOrigin:'0 ${rh / 2}'},8);tl.set('#wb-amp',{scaleY:.95,svgOrigin:'0 ${rh / 2}'},8);`);
  F.waveRun('wa', 8.15, 7.85, lam2); F.waveRun('wb', 8.15, 7.85, lam2);
  F.sound('drum', 8.9, { vol: .22 }); F.t(`tl.fromTo('#wa',{scale:1},{scale:1.03,duration:.15,yoyo:true,repeat:1,ease:'power2.out'},8.9);`);
  F.sound('drum', 9.9, { vol: 1 }); F.t(`tl.fromTo('#wb',{scale:1},{scale:1.03,duration:.15,yoyo:true,repeat:1,ease:'power2.out'},9.9);`);
  F.fadeIn('#g-gap', 10.5, .3); F.pop('#t-gap', 10.55);
  F.fadeIn('#g-height', 11.0, .3); F.pop('#t-height', 11.05);
  F.pio(12.6, '세게 칠수록 커!', { x: 1480, y: 150 });
}

// ---------- film 3: 짧은 자, 빠른 떨림 ----------
function pitch(F) {
  const bx = 250, by = 300, bw = 600, bh = 300; // desk block with the clamp
  const px = bx + bw - 6, py = by + 162; // pivot = where the ruler leaves the desk
  const L = 640, S = 214; // free length 18 cm vs 6 cm (same 1 : 3 ratio as the game)
  F.clip('ruler', 0, DURATION, `<div id="pivot" class="abs" style="left:${px}px;top:${py - 40}px;width:${L}px;height:80px;transform-origin:0% 50%">
  <div class="blade-window"><img id="blade" src="${F.img('image/generated/concepts/ruler-blade.webp')}" alt="" style="width:${L}px;height:${n(L * 341 / 1024)}px;top:${n(40 - L * 341 / 2048)}px"></div></div>
<img id="base" class="abs" src="${F.img('image/generated/concepts/ruler-base.webp')}" alt="" style="left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px">
<svg class="lead abs" width="${W}" height="${H}"><g id="g-free"><g id="g-free-s"><line x1="${px}" y1="${py + 64}" x2="${px + L}" y2="${py + 64}"/><line x1="${px}" y1="${py + 50}" x2="${px}" y2="${py + 78}"/><line x1="${px + L}" y1="${py + 50}" x2="${px + L}" y2="${py + 78}" id="free-end"/></g></g></svg>
${F.tag('t-fixed', '책상에 고정', bx + bw * .36, by + bh + 8)}${F.tag('t-free', '떨리는 부분', px + L / 2, py + 92)}
<div id="push" class="abs push" style="left:${px + L - 70}px;top:${py - 190}px"><svg width="60" height="90" viewBox="0 0 60 90"><path d="M30 6v66M10 52l20 24 20-24" /></svg></div>
${F.tag('t-force', '같은 힘으로 튕기기', px + L - 40, py - 270)}`);
  F.t(`tl.set('#pivot',{rotation:0},0);`);
  F.pop('#t-fixed', .6); F.fadeIn('#g-free', 1.0, .3); F.pop('#t-free', 1.05);
  F.t(`tl.fromTo('#push',{opacity:0,y:-30},{opacity:1,y:0,duration:.4,ease:'expo.out'},1.6);`); F.pop('#t-force', 1.7);
  F.out('#t-fixed', 3.8); F.out('#t-free', 3.8);
  // long ruler: press, release → slow wide swing, low sound (×1)
  const pluck = (at, deg, freq, dur, snd) => {
    F.t(`tl.to('#pivot',{rotation:${deg},duration:.25,ease:'power2.out'},${n(at - .3)});`);
    F.osc('#pivot', 'rotation', at, dur, freq, deg, deg * .08);
    F.sound(snd, at, { vol: 1.6 });
  };
  F.t(`tl.to('#push',{y:24,duration:.22,ease:'power2.out'},4.15);tl.to('#push',{opacity:0,duration:.2},4.45);`);
  F.out('#t-force', 4.45);
  const wx = 960, wy = 650, ww = 540, wh = 150, lamL = 270, lamS = 108;
  F.clip('wl', 4.3, 3.9, F.wave('wl', wx, wy, ww, wh, lamL));
  F.fadeIn('#wl', 4.45, .3); F.waveRun('wl', 4.45, 3.7, lamL, 130);
  F.t(`tl.set('#wl-amp',{scaleY:.8,svgOrigin:'0 ${wh / 2}'},4.3);`);
  pluck(4.45, 6, 2.6, 1.5, 'ruler-long');
  pluck(6.35, 6, 2.6, 1.4, 'ruler-long');
  F.clip('lab2', 5.0, 2.95, F.tag('t-slow', '천천히 떨림', px + L - 20, py - 150) + F.tag('t-low', '낮은 소리', wx + ww / 2, wy - 64));
  F.pop('#t-slow', 5.0); F.pop('#t-low', 5.3); F.out('#t-slow', 7.8, .15); F.out('#t-low', 7.8, .15); F.out('#wl', 7.9, .2);
  // shorten the free part: slide the same ruler in
  F.t(`tl.fromTo('#blade',{x:0},{x:${-(L - S)},duration:.6,ease:'power2.inOut'},8.15);`);
  F.t(`tl.fromTo('#g-free-s',{scaleX:1},{scaleX:${n(S / L)},duration:.6,ease:'power2.inOut',svgOrigin:'${px} ${py + 64}'},8.15);`);
  const ws = 'ws';
  F.clip('ws', 8.8, 3.3, F.wave(ws, wx, wy, ww, wh, lamS));
  F.fadeIn('#ws', 9.1, .3); F.waveRun('ws', 9.1, 3.0, lamS, 130);
  F.t(`tl.set('#ws-amp',{scaleY:.8,svgOrigin:'0 ${wh / 2}'},8.8);`);
  pluck(9.1, 4, 6.5, 1.1, 'ruler-short');
  pluck(10.6, 4, 6.5, 1.1, 'ruler-short');
  F.clip('lab3', 9.6, 2.35, F.tag('t-fast', '빠르게 떨림', px + S + 40, py - 150) + F.tag('t-high', '높은 소리', wx + ww / 2, wy - 64, { kind: 'warm' }));
  F.pop('#t-fast', 9.6); F.pop('#t-high', 9.9); F.out('#t-fast', 11.8, .15); F.out('#t-high', 11.8, .15); F.out('#ws', 11.9, .2);
  // answer: both sounds side by side as waves, each named
  const ax = 640, aw = 760, r1 = 470, r2 = 640, ah = 130;
  F.clip('ans', 12, 4, `${F.wave('a1', ax, r1, aw, ah, lamL)}${F.wave('a2', ax, r2, aw, ah, lamS, { stroke: C.warm })}
${F.tag('t-a1', '긴 자 · 낮은 소리', ax - 30, r1 + ah / 2 - 34, { anchor: 'right' })}${F.tag('t-a2', '짧은 자 · 높은 소리', ax - 30, r2 + ah / 2 - 34, { anchor: 'right', kind: 'warm' })}`);
  F.t(`tl.to(['#pivot','#base','#g-free'],{opacity:0,duration:.35,ease:'power2.out'},12.0);`);
  F.t(`tl.set(['#a1-amp','#a2-amp'],{scaleY:.8,svgOrigin:'0 ${ah / 2}'},12);`);
  F.fadeIn('#a1', 12.15, .3); F.fadeIn('#a2', 12.3, .3); F.pop('#t-a1', 12.2); F.pop('#t-a2', 12.35);
  F.waveRun('a1', 12.15, 3.85, lamL, 130); F.waveRun('a2', 12.15, 3.85, lamS, 130);
  F.sound('ruler-long', 12.6, { vol: 1.6 }); F.sound('ruler-short', 13.5, { vol: 1.6 });
  F.pio(13.0, '짧을수록 높아!', { x: 1480, y: 150 });
}

// ---------- film 4: 소리는 물질을 따라 ----------
function arcs(id, x0, y0, x1, y1, count = 4) { // sound fronts travelling from (x0,y0) to (x1,y1)
  const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  return Array.from({ length: count }, (_, i) => `<svg id="${id}${i}" class="arc abs" width="70" height="120" viewBox="0 0 70 120" style="left:${x0 - 35}px;top:${y0 - 60}px;transform-origin:50% 50%"><path d="M20 12 Q62 60 20 108"/></svg>`).join('') + `<!-- ${ang} -->`;
}
function sendArcs(F, id, at, x0, y0, x1, y1, count = 4, travel = 1.0) {
  const ang = n(Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI);
  for (let i = 0; i < count; i++) {
    const s = at + i * .2;
    F.t(`tl.fromTo('#${id}${i}',{x:0,y:0,rotation:${ang},opacity:0,scale:.6},{x:${x1 - x0},y:${y1 - y0},rotation:${ang},scale:1.1,duration:${travel},ease:'none'},${n(s)});`);
    F.t(`tl.to('#${id}${i}',{opacity:1,duration:.15},${n(s)});tl.to('#${id}${i}',{opacity:0,duration:.2},${n(s + travel - .2)});`);
  }
}
function burst(id, x, y) {
  return `<svg id="${id}" class="burst abs" width="160" height="160" viewBox="0 0 160 160" style="left:${x - 80}px;top:${y - 80}px"><path d="M80 18v26M80 116v26M18 80h26M116 80h26M36 36l18 18M106 106l18 18M124 36l-18 18M54 106l-18 18"/></svg>`;
}
function travel(F) {
  const scene = (id, file, x, y, w, h, start, dur) => F.clip(id, start, dur, `<img id="${id}-img" class="abs" src="${F.img(file)}" alt="" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">`);
  const slideIn = (id, at) => F.t(`tl.fromTo('#${id}-img',{x:320,opacity:0},{x:0,opacity:1,duration:.5,ease:'expo.out'},${n(at)});`);
  const slideOut = (id, at) => F.t(`tl.to('#${id}-img',{x:-320,opacity:0,duration:.3,ease:'power3.in'},${n(at)});`);
  // air: drum → ear
  scene('air', 'image/generated/concepts/travel-air.webp', 460, 300, 1000, 500, 0, 4.1);
  slideOut('air', 3.75);
  F.clip('air-fx', .8, 3.1, burst('b-air', 704, 540) + arcs('ar', 800, 470, 1090, 450) + `<div id="ear" class="ring abs" style="left:${1110 - 70}px;top:${475 - 70}px"></div>` + F.tag('t-air', '공기', 945, 360));
  F.t(`tl.fromTo('#b-air',{opacity:0,scale:.5},{opacity:1,scale:1,duration:.15,ease:'power2.out'},.9);tl.to('#b-air',{opacity:0,duration:.3},1.2);`);
  F.sound('drum', .9, { vol: .8 });
  sendArcs(F, 'ar', .95, 800, 470, 1090, 450);
  F.pop('#t-air', 1.3);
  F.t(`tl.fromTo('#ear',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.3,ease:'back.out(1.6)'},1.95);`);
  // water: bell → sensor
  scene('water', 'image/generated/concepts/travel-water.webp', 510, 296, 900, 506, 4, 4.1);
  slideIn('water', 4.0); slideOut('water', 7.75);
  const bell = [780, 542], sensor = [1146, 570];
  F.clip('water-fx', 4.6, 3.3, [0, 1, 2].map(i => `<div id="rip${i}" class="ripple abs" style="left:${bell[0] - 60}px;top:${bell[1] - 60}px"></div>`).join('') + `<div id="sen" class="ring abs" style="left:${sensor[0] - 80}px;top:${sensor[1] - 80}px;width:160px;height:160px"></div>` + F.tag('t-water', '물', 965, 420));
  F.sound('fork', 4.7, { vol: .55, dur: 2.6, fadeOut: .6 });
  [0, 1, 2].forEach(i => F.t(`tl.fromTo('#rip${i}',{scale:.3,opacity:.9},{scale:6.2,opacity:0,duration:1.4,ease:'power1.out'},${n(4.7 + i * .35)});`));
  F.pop('#t-water', 5.0);
  F.t(`tl.fromTo('#sen',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.3,ease:'back.out(1.6)'},5.55);`);
  // solid: mallet knock → table → sensor
  scene('solid', 'image/generated/concepts/travel-solid.webp', 460, 300, 1000, 500, 8, 4.1);
  slideIn('solid', 8.0); slideOut('solid', 11.75);
  F.clip('solid-fx', 8.6, 3.3, burst('b-solid', 716, 520) + `<div id="pulse" class="pulse abs" style="left:${716 - 60}px;top:${514}px"></div><div id="sen2" class="ring abs" style="left:${1272 - 80}px;top:${490 - 80}px;width:160px;height:160px"></div>` + F.tag('t-solid', '고체(탁자)', 994, 600));
  F.t(`tl.fromTo('#b-solid',{opacity:0,scale:.5},{opacity:1,scale:1,duration:.15,ease:'power2.out'},8.7);tl.to('#b-solid',{opacity:0,duration:.3},9.0);`);
  F.sound('wood', 8.7, { vol: .9 });
  F.t(`tl.fromTo('#pulse',{x:0,opacity:0},{x:${1272 - 716 - 60},opacity:1,duration:.7,ease:'power1.in'},8.72);tl.to('#pulse',{opacity:0,duration:.2},9.42);`);
  F.pop('#t-solid', 9.0);
  F.t(`tl.fromTo('#sen2',{opacity:0,scale:.6},{opacity:1,scale:1,duration:.3,ease:'back.out(1.6)'},9.42);`);
  // answer: one path, the middle can be any of the three
  F.clip('path', 12, 4, `<img id="p-src" class="abs" src="${F.img('image/generated/drum.png')}" alt="" style="left:300px;top:430px;width:264px;height:220px">
<img id="p-dst" class="abs" src="${F.img('image/generated/receiver.png')}" alt="" style="left:1240px;top:410px;width:240px;height:219px">
${F.tag('t-src', '소리 나는 곳', 432, 670)}${F.tag('t-dst', '듣는 곳', 1360, 670)}
<div id="band" class="band abs" style="left:600px;top:470px;width:600px;height:130px"><div class="roll"><div id="roll" class="roll-in"><span>공기</span><span>물</span><span>고체</span><span>공기 · 물 · 고체</span></div></div></div>`);
  F.fadeIn('#p-src', 12.05, .3); F.fadeIn('#p-dst', 12.15, .3); F.pop('#t-src', 12.2); F.pop('#t-dst', 12.3);
  F.t(`tl.fromTo('#band',{scaleX:.2,opacity:0},{scaleX:1,opacity:1,duration:.5,ease:'expo.out',transformOrigin:'0% 50%'},12.25);`);
  F.t(`tl.set('#roll',{y:0},12.25);tl.to('#roll',{y:-130,duration:.18,ease:'power2.inOut'},12.85);tl.to('#roll',{y:-260,duration:.18,ease:'power2.inOut'},13.25);tl.to('#roll',{y:-390,duration:.22,ease:'power2.inOut'},13.65);`);
  F.pio(12.9, '셋 다 전달해!', { x: 1480, y: 150 });
}

// ---------- film 5: 필요한 소리는 살리고 ----------
function care(F) {
  F.clip('lib', 0, 4.1, `<img id="lib-img" class="abs" src="${F.img('image/generated/concepts/library-noise.webp')}" alt="" style="left:480px;top:280px;width:960px;height:540px">`);
  F.t(`tl.to('#lib-img',{x:-320,opacity:0,duration:.3,ease:'power3.in'},3.75);`);
  const drum = [1316, 542], reader = [738, 494];
  F.clip('lib-fx', .7, 3.2, burst('b-lib', drum[0], drum[1]) + arcs('nz', 1240, 520, 830, 480, 4) + F.tag('t-drum', '복도 북 연습', drum[0], 330, { kind: 'warm' }) + F.tag('t-reader', '책 읽는 친구', reader[0], 300));
  F.t(`tl.fromTo('#b-lib',{opacity:0,scale:.5},{opacity:1,scale:1,duration:.15},.8);tl.to('#b-lib',{opacity:0,duration:.3},1.1);`);
  F.sound('drum', .8, { vol: .85 }); F.sound('drum', 2.2, { vol: .85 });
  sendArcs(F, 'nz', .85, 1240, 520, 830, 480, 4, 1.1);
  F.pop('#t-drum', 1.0); F.pop('#t-reader', 1.6);
  // solutions 1–2: softer drum, pad on the chair leg
  F.clip('vol', 4, 4.1, `<img id="vol-img" class="abs" src="${F.img('image/generated/concepts/care-volume.webp')}" alt="" style="left:330px;top:320px;width:440px;height:402px">
<div class="meter abs" style="left:800px;top:400px"><div id="m4" class="bar"></div><div id="m3" class="bar"></div><div id="m2" class="bar"></div><div id="m1" class="bar on"></div><div id="m0" class="bar on"></div></div>
${F.tag('t-vol', '음량 줄이기', 550, 260)}`);
  F.fadeIn('#vol-img', 4.05, .35); F.pop('#t-vol', 4.2);
  F.t(`tl.fromTo(['#m2','#m3','#m4'],{opacity:1},{opacity:1,duration:.01},4.0);tl.to(['#m4','#m3','#m2'],{opacity:.15,duration:.12,stagger:.12,ease:'power2.in'},5.0);`);
  F.sound('drum', 4.5, { vol: .85 }); F.sound('drum', 5.6, { vol: .25 });
  F.clip('pad', 4, 4.1, `<img id="pad-img" class="abs" src="${F.img('image/generated/concepts/care-pad.webp')}" alt="" style="left:1130px;top:320px;width:420px;height:396px;clip-path:inset(0 0 24% 0)">
${burst('b-chair', 1300, 640)}${F.tag('t-pad', '의자 다리에 패드', 1340, 260)}`);
  F.fadeIn('#pad-img', 4.1, .35); F.pop('#t-pad', 6.8);
  F.t(`tl.fromTo('#pad-img',{clipPath:'inset(0% 0% 24% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.35,ease:'power2.out'},6.65);`);
  F.t(`tl.fromTo('#b-chair',{opacity:0,scale:.5},{opacity:1,scale:1.15,duration:.15},6.3);tl.to('#b-chair',{opacity:0,duration:.25},6.55);`);
  F.sound('wood', 6.3, { vol: .9 }); F.sound('wood-pad', 7.3, { vol: 1 });
  F.t(`tl.fromTo('#b-chair',{opacity:0,scale:.4},{opacity:.6,scale:.55,duration:.12},7.3);tl.to('#b-chair',{opacity:0,duration:.25},7.45);`);
  F.t(`tl.to(['#vol-img','#pad-img'],{opacity:0,y:-24,duration:.3,ease:'power3.in'},7.8);`); F.out('#t-vol', 7.8); F.out('#t-pad', 7.8); F.out('.meter', 7.8);
  // solutions 3–4: another time, another place
  F.clip('time', 8, 4.1, `<img id="time-img" class="abs" src="${F.img('image/generated/concepts/care-time.webp')}" alt="" style="left:330px;top:330px;width:420px;height:384px">
<svg id="turn" class="lead abs" width="${W}" height="${H}"><path d="M${540 + 230} ${522} A230 230 0 0 1 ${540} ${522 + 230}" /><path d="M${540 + 14} ${522 + 214} l-16 18 l20 10"/></svg>${F.tag('t-time', '쉬는 시간에', 540, 260)}`);
  F.fadeIn('#time-img', 8.05, .35); F.pop('#t-time', 8.6);
  F.t(`tl.fromTo('#turn',{opacity:0,rotation:-40,svgOrigin:'540 522'},{opacity:1,rotation:0,svgOrigin:'540 522',duration:.7,ease:'power2.out'},8.4);`);
  F.clip('place', 8, 4.1, `<img id="place-img" class="abs" src="${F.img('image/generated/concepts/care-place.webp')}" alt="" style="left:900px;top:350px;width:720px;height:360px">${F.tag('t-place', '넓은 운동장에서', 1260, 260)}`);
  F.t(`tl.fromTo('#place-img',{x:320,opacity:0},{x:0,opacity:1,duration:.5,ease:'expo.out'},9.6);`); F.pop('#t-place', 10.1);
  F.t(`tl.to(['#time-img','#place-img','#turn'],{opacity:0,duration:.3,ease:'power3.in'},11.8);`); F.out('#t-time', 11.8); F.out('#t-place', 11.8);
  // answer: keep the needed sound, lower the bothering one
  F.clip('ans', 12, 4, `<img id="ans-spk" class="abs" src="${F.img('image/generated/concepts/care-volume.webp')}" alt="" style="left:330px;top:380px;width:330px;height:301px">
<img id="ans-drum" class="abs" src="${F.img('image/generated/drum.png')}" alt="" style="left:820px;top:410px;width:300px;height:250px">
${F.tag('t-keep', '필요한 안내 → 들리게', 495, 300)}${F.tag('t-less', '연습 소리 → 줄이기', 970, 300, { kind: 'warm' })}`);
  F.fadeIn('#ans-spk', 12.1, .3); F.fadeIn('#ans-drum', 12.25, .3); F.pop('#t-keep', 12.35); F.pop('#t-less', 12.6);
  F.pio(13.1, '모두 편안해!', { x: 1500, y: 560 });
}

const builders = { vibration, volume, pitch, travel, care };

const CSS = `@font-face{font-family:"Note Sans";src:local("Apple SD Gothic Neo"),local("AppleSDGothicNeo-Regular");font-weight:400}
@font-face{font-family:"Note Sans";src:local("Apple SD Gothic Neo Bold"),local("AppleSDGothicNeo-Bold");font-weight:700}
@font-face{font-family:"Note Sans";src:local("Apple SD Gothic Neo ExtraBold"),local("AppleSDGothicNeo-ExtraBold");font-weight:800}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.paper}}
#root{position:relative;width:100%;height:100%;font-family:"Note Sans",sans-serif;color:${C.ink};word-break:keep-all}
.full{position:absolute;inset:0}
.abs{position:absolute}
.paper{position:absolute;inset:0;background-color:${C.paper};background-image:linear-gradient(${C.grid} 2px,transparent 2px),linear-gradient(90deg,${C.grid} 2px,transparent 2px);background-size:60px 60px}
.head{position:absolute;left:192px;top:104px}
.chip{display:inline-block;background:${C.teal};color:#fff;font-size:30px;font-weight:700;padding:8px 22px;border-radius:999px}
.head h1{font-size:68px;font-weight:800;line-height:1.1;margin-top:14px;letter-spacing:-.01em}
.question{font-size:40px;font-weight:700;color:${C.teal};margin-top:10px}
.cap-band{position:absolute;left:192px;right:192px;top:846px;height:124px;background:${C.ink};border-radius:30px;display:flex;align-items:center;justify-content:center}
.cap-band p{color:#fff;font-size:58px;font-weight:700;letter-spacing:-.01em}
.tag-pos{position:absolute}
.tag{background:#fff;border:4px solid ${C.ink};border-radius:20px;padding:8px 24px;font-size:42px;font-weight:800;white-space:nowrap;box-shadow:0 6px 0 rgba(23,57,75,.16)}
.tag.warm{border-color:${C.warm};color:#7a3d08}
.lead line,.lead path{stroke:${C.ink};stroke-width:5;stroke-linecap:round;fill:none}
.lead .dash{stroke:${C.soft};stroke-dasharray:10 12;stroke-width:4}
.wave{position:absolute;overflow:hidden;border-radius:18px;background:rgba(188,236,237,.35);border:3px solid ${C.line}}
.wave svg{position:absolute;left:0;top:0;overflow:visible}
.wave-axis line{stroke:${C.line};stroke-width:3;stroke-dasharray:8 10}
.wave-run path{fill:none;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}
.blade-window{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden}
.blade-window img{position:absolute;left:0}
.push path{stroke:${C.warm};stroke-width:9;stroke-linecap:round;stroke-linejoin:round;fill:none}
.pio{position:absolute;width:250px;height:250px}
.bubble-pos{position:absolute;transform:translateX(-100%)}
.bubble{background:#fff;border:4px solid ${C.teal};border-radius:28px;padding:14px 30px;font-size:46px;font-weight:800;color:${C.teal};white-space:nowrap;box-shadow:0 6px 0 rgba(8,106,115,.18)}
.arc path{stroke:${C.teal};stroke-width:9;stroke-linecap:round;fill:none}
.burst path{stroke:${C.warm};stroke-width:9;stroke-linecap:round}
.ring{width:140px;height:140px;border-radius:50%;border:8px solid ${C.orange};box-shadow:0 0 0 6px rgba(255,189,88,.25)}
.ripple{width:120px;height:120px;border-radius:50%;border:6px solid #fff}
.pulse{width:120px;height:18px;border-radius:9px;background:#fff;border:5px solid ${C.teal};box-shadow:0 0 0 6px rgba(188,236,237,.9)}
.band{border-radius:65px;background:${C.cyan};border:5px solid ${C.teal};overflow:hidden}
.roll{position:absolute;inset:0;overflow:hidden}
.roll-in span{display:flex;height:130px;align-items:center;justify-content:center;font-size:56px;font-weight:800;color:${C.ink}}
.meter{display:flex;flex-direction:column;gap:10px}
.meter .bar{width:90px;height:34px;border-radius:10px;background:${C.teal}}
#turn path{stroke:${C.warm};stroke-width:9}`;

async function build(f) {
  const F = new Film(f);
  frame(F);
  builders[f.id](F);
  const dir = join(here, f.id);
  await rm(join(dir, 'assets'), { recursive: true, force: true });
  await mkdir(join(dir, 'assets', 'img'), { recursive: true });
  await mkdir(join(dir, 'assets', 'sfx'), { recursive: true });
  for (const [name, src] of F.imgs) await copyFile(join(root, src), join(dir, 'assets', 'img', name));
  const lengths = {};
  for (const name of F.sfx) {
    const spec = SFX[name], out = join(dir, 'assets', 'sfx', `${name}.ogg`);
    if (spec.filter) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(root, spec.from), '-af', spec.filter, '-ac', '1', '-c:a', 'libvorbis', '-q:a', '5', out]);
    else await copyFile(join(root, spec.from), out);
    lengths[name] = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString();
  }
  const audio = F.sounds.map((s, i) => {
    const dur = Math.min(s.dur ?? lengths[s.name], lengths[s.name], DURATION - s.at);
    return `<audio id="sfx${i}" class="clip" src="assets/sfx/${s.name}.ogg" data-start="${s.at}" data-duration="${n(dur)}" data-track-index="${60 + i}" data-volume="${s.vol}"${s.fadeOut ? ` data-fade-out="${s.fadeOut}"` : ''}></audio>`;
  }).join('\n    ');
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(f.title)} · 삐오의 소리 노트</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
${CSS}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
    ${F.clips.join('\n    ')}
    ${audio}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${F.tl.join('\n      ')}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
  await writeFile(join(dir, 'index.html'), html);
  await writeFile(join(dir, 'hyperframes.json'), JSON.stringify({ $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' }, media: { autoProxy: true }, authoringSkill: 'hyperframes' }, null, 2) + '\n');
  await writeFile(join(dir, 'meta.json'), JSON.stringify({ id: `concept-${f.id}`, name: `${f.title} · 삐오의 소리 노트` }, null, 2) + '\n');
  return { id: f.id, sounds: F.sounds.length, clips: F.clips.length };
}

const only = process.argv[2];
for (const f of films) if (!only || only === f.id) console.log(JSON.stringify(await build(f)));
