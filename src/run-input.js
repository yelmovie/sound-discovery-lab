// Input for the 3D run stage: the on-screen pad, the action buttons and the keyboard become one state.
import { bindDirectionPad, mapKeyDirection, MAP_VECTORS } from './map-controls.js';

/** root holds [data-run-direction] pad buttons and optional [data-run-jump] / [data-run-unit] buttons. */
export function bindRunInput(root, { blocked = () => false, onUnit = () => {}, onGesture = () => {} } = {}) {
  const doc = root.ownerDocument, win = doc.defaultView, events = new AbortController(), options = { signal: events.signal };
  const keys = new Map();
  let padDirection = null, jumpAt = -1;
  const clear = () => { keys.clear(); padDirection = null; jumpAt = -1; };
  const pad = bindDirectionPad(root, '[data-run-direction]', b => b.dataset.runDirection, {
    signal: events.signal, blocked,
    press: d => { padDirection = d; onGesture(); },
    release: () => { padDirection = null; },
    // Keyboard and switch activation of a pad button gives one short step.
    tap: d => { padDirection = d; win.setTimeout(() => { if (padDirection === d) padDirection = null; }, 320); }
  });
  const typing = target => target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  doc.addEventListener('keydown', event => {
    if (blocked() || event.ctrlKey || event.altKey || event.metaKey || event.isComposing || typing(event.target)) return;
    const direction = mapKeyDirection(event);
    if (direction) { event.preventDefault(); keys.set(event.code || event.key, direction); onGesture(); return; }
    if (event.code === 'Space' || event.key === ' ') {
      // The run controls keep native Space activation when one has focus.
      if (root.contains(event.target) && event.target?.closest?.('button')) return;
      event.preventDefault();
      if (!event.repeat) { jumpAt = win.performance.now(); onGesture(); }
    }
  }, options);
  doc.addEventListener('keyup', event => { if (mapKeyDirection(event)) keys.delete(event.code || event.key); }, options);
  root.addEventListener('pointerdown', event => {
    const jump = event.target.closest?.('[data-run-jump]'), unit = event.target.closest?.('[data-run-unit]');
    if (blocked() || !jump && !unit) return;
    onGesture();
    if (jump) { event.preventDefault(); jumpAt = win.performance.now(); }
  }, options);
  // The unit button is an ordinary click so keyboard and assistive activation work too.
  root.addEventListener('click', event => {
    if (blocked()) return;
    if (event.target.closest?.('[data-run-unit]')) onUnit();
    else if (event.detail === 0 && event.target.closest?.('[data-run-jump]')) jumpAt = win.performance.now();
  }, options);
  // Leaving the window or hiding the tab releases everything.
  win.addEventListener('blur', clear, options);
  doc.addEventListener('visibilitychange', clear, options);
  return {
    /** x: right is positive. z: forward (up on the pad) is negative, like the stage. */
    vector() {
      if (blocked()) return { x: 0, z: 0 };
      let x = 0, z = 0;
      for (const d of new Set([...keys.values(), ...(padDirection ? [padDirection] : [])])) { x += MAP_VECTORS[d].x; z += MAP_VECTORS[d].y; }
      const size = Math.hypot(x, z);
      return size > 1 ? { x: x / size, z: z / size } : { x, z };
    },
    /** A jump pressed a moment before landing still counts; the stage consumes it when the feet are down. */
    jumpPending(now = win.performance.now()) { return !blocked() && jumpAt >= 0 && now - jumpAt <= 160; },
    consumeJump() { jumpAt = -1; },
    clear() { clear(); pad.clear(); },
    destroy() { clear(); events.abort(); }
  };
}
