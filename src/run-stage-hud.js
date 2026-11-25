// The 3D scene owns the practice objects. This layer holds the task, progress and controls.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = { up: 'M12 19V5m-6 6 6-6 6 6', down: 'M12 5v14m-6-6 6 6 6-6', left: 'M19 12H5m6-6-6 6 6 6', right: 'M5 12h14m-6-6 6 6-6 6' };
const directionName = { up: '앞으로', down: '뒤로', left: '왼쪽으로', right: '오른쪽으로' };
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
// The same trace the 2D request draws: a wave for 울림, a flat line for 쉼, a line at three heights for pitch.
const trace = goal => goal.value ? `M4 ${goal.value === 6 ? 6 : goal.value === 12 ? 15 : 24}H68` : goal.label === '쉼' ? 'M4 15H68' : 'M4 15H12L18 5L26 25L34 5L42 25L50 5L58 15H68';

export function createRunHud(host, { id, title, canJump, onClassic }) {
  const melody = id === 'melody';
  host.innerHTML = `<canvas class="run-canvas" aria-hidden="true"></canvas>
<p class="run-loading" role="status">달리기 무대를 준비하고 있어…</p>
<header class="run-head">
  <div class="run-title"><b>${esc(title)}</b><span class="run-round" role="status"></span></div>
  <div class="run-goal"></div>
</header>
<button type="button" class="btn quiet run-classic" aria-label="2D로 하기">2D로 하기</button>
<p class="run-message" role="status"><span></span></p>
<div class="run-pad" role="group" aria-label="이동 방향">${['up', 'left', 'right', 'down'].map(d => `<button type="button" class="run-key run-${d}" data-run-direction="${d}" aria-label="${directionName[d]} 이동">${svg(arrow[d])}</button>`).join('')}</div>
<div class="run-actions">${melody ? `<button type="button" class="run-key run-unit" data-run-unit>${svg('m8 4 12 8-12 8z')}<span>목표 듣기</span></button>` : ''}${canJump ? `<button type="button" class="run-key run-jump" data-run-jump>${svg('M6 16Q12 2 18 16m-4-3 4 3 2-5M4 20h16')}<span>점프</span></button>` : ''}</div>`;
  const find = selector => host.querySelector(selector);
  const round = find('.run-round'), goalRow = find('.run-goal'), message = find('.run-message'), text = find('.run-message span');
  const classic = find('.run-classic'), unit = find('.run-unit');
  const forward = find('.run-up'), jump = find('.run-jump');
  classic.addEventListener('click', onClassic);
  let lastGoal = '';
  return {
    canvas: find('.run-canvas'),
    ready() { find('.run-loading')?.remove(); },
    /** goal: [{label,value?,filled}], now: index of the step being played. */
    update({ goal, now, roundText, line, kind = '', action, heard = false, finished = false }) {
      if (round.textContent !== roundText) round.textContent = roundText;
      // The melody is a listening task. Once played, the neutral contour supplies the
      // same pitch evidence as the audio for learners who cannot hear the playback.
      const showContour = !melody || heard || finished;
      const markup = goal.map((g, n) => `<span class="run-chip ${g.filled ? 'filled' : ''} ${n === now ? 'now' : ''}"><svg viewBox="0 0 72 30" aria-hidden="true"><path d="${showContour ? trace(g) : 'M29 15h14'}"/></svg><b>${melody ? n + 1 : esc(g.label)}${g.filled ? ' ✓' : ''}</b></span>`).join('');
      if (markup !== lastGoal) {
        lastGoal = markup; goalRow.innerHTML = markup;
        goalRow.setAttribute('role', 'img');
        const target = showContour ? goal.map(g => g.label + (g.filled ? ' 완료' : '')).join(', ') : `${goal.length}음`;
        goalRow.setAttribute('aria-label', `${melody ? '목표 멜로디' : '목표 신호'}: ${target}`);
      }
      if (text.textContent !== line) text.textContent = line;
      message.dataset.kind = kind;
      forward.classList.toggle('is-next', action === 'forward');
      jump?.classList.toggle('is-next', action === 'jump');
      if (unit) {
        unit.classList.toggle('is-next', action === 'listen');
        unit.querySelector('span').textContent = heard ? '목표 다시 듣기' : '목표 듣기';
      }
    },
    destroy() { classic.removeEventListener('click', onClassic); host.innerHTML = ''; }
  };
}
