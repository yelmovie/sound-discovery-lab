// Game progress comes from the same scientific evidence used by lesson validation.
const missions={parts:['떨림 탐지문','떨리는 부분을 찾아 문을 열어 줘.'],rhythm:['울림 징검다리','울림과 쉼으로 삐오가 건널 길을 이어 줘.'],signal:['신호 배달선','북을 치는 세기를 바꿔 신호를 보내 줘.'],sort:['소리 화물 정거장','작은 소리부터 화물을 배치해 출발시켜 줘.'],melody:['높낮이 잠금문','서로 다른 길이의 자로 소리 암호를 만들어 줘.'],mix:['두 조절 장치','길이와 세기를 따로 조절해 장치를 움직여 줘.'],sensor:['소리 연결 통로','전달 물질에 감지기를 놓아 통로를 이어 줘.'],classify:['전달 길 찾기','소리가 지나온 물질을 찾아 길을 연결해 줘.'],solutions:['조용한 길 만들기','주민의 상황에 맞게 소음을 줄여 줘.'],festival:['모두의 축제','음악·안내·주변 소리를 조절해 축제를 열어 줘.']};
export function missionStatus(id,c={},total=1){const done=Math.min(total,c.proof?.length||0);return {done,total,complete:done===total,ratio:done/total};}
export function missionScene(id, challenge, total) {
  const mission = missions[id];
  if (!mission) return '';
  const status = missionStatus(id, challenge, total);
  const gates = Array.from({ length: total }, (_, index) =>
    `<span class="mission-gate ${index < status.done ? 'open' : ''}"><svg viewBox="0 0 24 24"><path d="${index < status.done ? 'M5 12l4 4L19 6' : 'M12 5l7 7-7 7-7-7z'}"/></svg></span>`
  ).join('');
  return `<section class="action-mission ${status.complete ? 'mission-open' : ''}" aria-label="${mission[0]}">
    <div class="mission-copy"><b>${mission[0]}</b><span>${status.complete ? '길이 열렸어! 다음 탐험으로 가자.' : mission[1]}</span></div>
    <div class="mission-route" aria-hidden="true"><i class="mission-traveller" style="--travel:${status.ratio}"><img src="/image/generated/pio-guide.svg" alt=""></i>${gates}</div>
    <small class="mission-caption">시간 제한 없이 소리의 성질로 해결해요. 장치의 조건은 게임 속 약속이에요.</small>
    <div class="mission-status" role="status">${status.done} / ${total} 통과</div>
  </section>`;
}
