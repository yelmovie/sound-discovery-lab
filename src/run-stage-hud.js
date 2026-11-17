// HTML over the 3D run stage: goal row, guide line and the on-screen controls. Every word is DOM text.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = { up: 'M12 19V5m-6 6 6-6 6 6', down: 'M12 5v14m-6-6 6 6 6-6', left: 'M19 12H5m6-6-6 6 6 6', right: 'M5 12h14m-6-6 6 6-6 6' };
const directionName = { up: '앞으로', down: '뒤로', left: '왼쪽으로', right: '오른쪽으로' };
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
// The same trace the 2D request draws: a wave for 울림, a flat line for 쉼, a line at three heights for pitch.
const trace = goal => goal.value ? `M4 ${goal.value === 6 ? 6 : goal.value === 12 ? 15 : 24}H68` : goal.label === '쉼' ? 'M4 15H68' : 'M4 15H12L18 5L26 25L34 5L42 25L50 5L58 15H68';

export function createRunHud(host, { id, title, canJump, onClassic }) {
  host.innerHTML = `<canvas class="run-canvas" aria-hidden="true"></canvas>
<p class="run-loading" role="status">달리기 무대를 준비하고 있어…</p>
<header class="run-head">
  <div class="run-title"><b>${esc(title)}</b><span class="run-round" role="status"></span></div>
  <div class="run-goal"></div>
  <button type="button" class="btn quiet run-classic">기존 방식으로 하기</button>
</header>
<p class="run-message" role="status"><img src="/image/generated/concepts/pio-fly.webp" alt="" draggable="false"><span></span></p>
<div class="run-pad" role="group" aria-label="이동 방향">${['up', 'left', 'right', 'down'].map(d => `<button type="button" class="run-key run-${d}" data-run-direction="${d}" aria-label="${directionName[d]} 이동">${svg(arrow[d])}</button>`).join('')}</div>
<div class="run-actions">${id === 'melody' ? `<button type="button" class="run-key run-unit" data-run-unit aria-label="목표 멜로디 듣기">${svg('m8 4 12 8-12 8z')}<span>목표 듣기</span></button>` : ''}${canJump ? `<button type="button" class="run-key run-jump" data-run-jump aria-label="점프">${svg('M12 19V5m-6 6 6-6 6 6')}<span>점프</span></button>` : ''}</div>`;
  const find = selector => host.querySelector(selector);
  const round = find('.run-round'), goalRow = find('.run-goal'), message = find('.run-message'), text = find('.run-message span');
  const classic = find('.run-classic'), unit = find('.run-unit');
  classic.addEventListener('click', onClassic);
  let lastGoal = '';
  return {
    canvas: find('.run-canvas'),
    ready() { find('.run-loading')?.remove(); },
    /** goal: [{label,value?,filled}], now: index of the step being played. */
    update({ goal, now, roundText, line, kind = '', listen = false, heard = false, stuck = false }) {
      round.textContent = roundText;
      const markup = goal.map((g, n) => `<span class="run-chip ${g.filled ? 'filled' : ''} ${n === now ? 'now' : ''} ${g.label === '쉼' ? 'is-rest' : ''}"${g.value ? ` data-pitch="${g.value}"` : ''}><svg viewBox="0 0 72 30" aria-hidden="true"><path d="${trace(g)}"/></svg><b>${esc(g.label)}${g.filled ? ' ✓' : ''}</b></span>`).join('');
      if (markup !== lastGoal) {
        lastGoal = markup; goalRow.innerHTML = markup;
        goalRow.setAttribute('role', 'img');
        goalRow.setAttribute('aria-label', `${id === 'melody' ? '목표 멜로디' : '목표 신호'}: ${goal.map(g => g.label + (g.filled ? ' 완료' : '')).join(', ')}`);
      }
      if (text.textContent !== line) text.textContent = line;
      message.dataset.kind = kind;
      if (unit) { unit.classList.toggle('is-next', listen); unit.querySelector('span').textContent = heard ? '목표 다시 듣기' : '목표 듣기'; }
      classic.classList.toggle('is-next', stuck);
    },
    destroy() { classic.removeEventListener('click', onClassic); host.innerHTML = ''; }
  };
}
