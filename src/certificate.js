const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function certificateResult({genuine, evidence, restored, date, findings, endingVoice}) {
  return `<main class="result-page cert-design">
    <div class="cert-main">
      <article class="cert-paper ${genuine ? '' : 'preview'}" aria-label="소리 탐험가 인증서">
        <img class="cert-frame" src="/image/certificate-frame-20261122.webp" alt="" aria-hidden="true">
        <div class="cert-content">
          <p class="cert-world">울림도시 대작전 · 소리 탐험대</p>
          <h1 class="cert-title">소리 탐험가 인증서</h1>
          <div class="cert-recipient" aria-label="인쇄한 뒤 손으로 쓰는 학교, 학년, 반, 번호, 이름 빈칸">
            <div class="cert-class"><span class="cert-blank school" data-cert-blank="school"></span> 학교 <span class="cert-blank" data-cert-blank="grade"></span> 학년 <span class="cert-blank" data-cert-blank="class"></span> 반 <span class="cert-blank" data-cert-blank="number"></span> 번</div>
            <div class="cert-name">이름 <span class="cert-blank name" data-cert-blank="name"></span></div>
          </div>
          <p class="cert-award">위 탐험가는 소리의 떨림·크기·높낮이·전달을 탐구하고,<br>함께 사는 친구들을 배려하는 방법을 발견하였으므로<br>이 인증서를 드립니다.</p>
          <p class="cert-summary">${genuine ? `증거 ${evidence}개 · 시설 ${restored}곳 복구 · 5가지 소리의 원리` : `관리자 미리보기 · 증거 ${evidence}/20 · 정식 인증 아님`}</p>
          <div class="cert-bottom">
            <p class="cert-date"><small>복구한 날</small>${esc(date)}</p>
            <div class="cert-stamp"><b>소리 코어</b><span>${genuine ? '복구 인증' : '연습용 예시'}</span></div>
            <p class="cert-issuer"><small>주는 이</small>울림도시 탐험대</p>
          </div>
          <p class="cert-credit">기획·제작: 옐샘 &amp; ⓒ 아이스크림미디어</p>
        </div>
      </article>
      <p class="cert-note">인쇄한 뒤 학교·반·번호·이름을 직접 적어요.</p>
      <div class="result-actions">
        ${genuine ? '<button class="btn primary" data-action="print">인증서 인쇄 / PDF 저장</button><button class="btn secondary" data-action="cert-png">PNG 저장</button>' : '<button class="btn primary" data-action="goto" data-route="map">증거 모으러 가기</button>'}
        <button class="btn secondary" data-action="notebook">내 증거 다시 보기</button>
        <button class="btn quiet" data-action="goto" data-route="map">지도 둘러보기</button>
        ${endingVoice}
      </div>
      <p class="cert-error" role="status" aria-live="polite"></p>
    </div>
    <section class="result-findings"><h2>내가 발견한 다섯 원리</h2>${findings}</section>
  </main>`;
}
