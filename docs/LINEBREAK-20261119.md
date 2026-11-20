# 문장 줄바꿈 균형 점검·수정 (2026-11-19)

기준: `_shared/LINEBREAK-BALANCE-20261119.md`(짧은 끝줄·가운데 짧은 줄·단어 끊김·잘림). 문구·대사는 바꾸지 않고 줄바꿈 위치만 고쳤다.

## 측정 방법

- 도구: `.tmp/linebreak-20261119/audit.mjs` — 저장 상태를 심어 화면마다 들어가 공통 `measure.js`로 잰다.
- 화면 64곳 × 크기: 홈, 홈 삐오 대화, 설정(접힌 안내 모두 펼침), 이야기 팝업, 초기화 확인, 지도(진행 0·8·20), 지도 삐오 안내, 활동 20개 처음 상태, 활동 20개 완료 상태, 오류(활동 12 섞기·활동 19 해결책), 중간 상태(활동 17·18), 활동 도구·증거 노트, 시설 복구 개념 팝업 5개, 마무리(1·2번 질문), 결과.
- 크기: 1280×800, 1920×1080, 1024×768.

## 전/후 문제 수 (크기별 고유 블록)

| 단계 | 1280×800 | 1920×1080 | 합계 |
|---|---|---|---|
| 전(운영 `6591e02a`) | 7 | 10 | 17 |
| 공통 CSS만 | 4 | 4 | 8 |
| 후(로컬, 1024 포함) | 2 | 2 | 1024×768도 2 |
| 운영 확인(`35d08f3c`) | 2 | | 64개 화면 실패 0 |

후에 남은 2건은 모두 오탐: `<br>`로 의도해 끊은 자리를 도구가 낱말 안 끊김으로 셈.
- 홈 `p.title-tagline` 「…증거를 모아 / 울림도시를 다시 깨워 줘!」 (두 줄 499·210px, 강조 줄이 따로 오는 의도된 배치)
- 마무리 `.core-control h2` 「다섯 발견이 모이면 / 축제가 시작돼!」 (188·145px)

## 고친 곳

| 파일 | 선택자 | 내용 | 해결한 예 |
|---|---|---|---|
| `src/korean-linebreak.css`(신규, 공통 그대로) | `:where(html)` 등 | keep-all·pretty, 제목·버튼·팝업 balance | 설정 안내 「…축제를 / 열어요.」, 초기화 확인 「…소리 설정은 / 남아요.」, 지도 삐오 안내, 홈 삐오 대화 「…직접 / 비교해 보자.」, 마무리 피드백 「…코어를 / 깨워 줘.」 |
| `index.html` | `<head>` | 공통 CSS를 다른 스타일보다 먼저 링크 | |
| `src/korean-linebreak.css` 프로젝트 보정 | `.challenge-summary` | `text-wrap: balance` | 활동 3 완료 「…나는 부분은 / 떨려.」 → 두 줄 고르게, 활동 20 완료 「…약속을 / 만들었어.」 |
| 〃 | `.saved-discovery > span` | `text-wrap: balance` | 1024×768 활동 9 완료 「…높은 / 소리가 나.」 |

- 빌드: `scripts/build.mjs`가 `index.html`의 CSS 링크를 순서대로 `dist/src/app.css`로 합치므로 새 파일이 자동 포함된다. 서비스워커는 `app.css`를 미리 저장하고 빌드마다 `CACHE_VERSION`이 바뀌어 `sw.js` 수정은 필요 없었다.
- 스크린샷(전/후): `.tmp/linebreak-20261119/out/before/1280x800-done-2.png`, `out/after/1280x800-done-2.png`.

## 검증

- `npm run check` 통과, `npm test` 149/149 통과, `npm run build` 통과.
- `balance`는 줄 수를 바꾸지 않아 상자 높이·놀이 영역이 그대로다. 측정 중 64개 화면 모두 정상 진입(실패 0).

## 범위 밖·남은 것

- 지도 악당 말풍선·보상 카드·3D 달리기 무대(캔버스)는 실제 플레이로만 나와 이번 측정에 넣지 못했다. 말풍선은 이미 `word-break: keep-all`이다.
- 영상 자막은 범위 밖.

## 배포

- 커밋 `8b57856` → `run-lock.sh lbk-deploy-2 deploy.sh 11 "11 sound" worker-cfg sound-discovery-lab` → Workers 버전 `35d08f3c-5f10-4666-b863-562a3e89fb58`.
- `cmp.sh`: `src/korean-linebreak.css`·루트 해시 MATCH, `src/app.css`·`sw.js` 해시도 빌드와 같음(MATCH). 운영 1280×800 재측정: `<br>` 오탐 2건만 남음.
- 추가(2026-11-20, 지침 8절): `src/reward-cards.css` `.rc-locked` 보정 네 줄 → 커밋 `93fc1d7` → Workers `e8adb688`. 운영 보관함: 1280·1920 한 줄, 1024×768 「악당을 / 물리치면 / 열려요」 세 줄(전에는 이 크기에서도 한 줄로 들어갔음), 카드 넘침 없음. `app.css`·`sw.js`·루트 MATCH(`reward-cards.css` 단독 주소는 엣지 캐시로 잠시 DIFF, 캐시 우회 요청은 빌드와 같음).

## 남은 것 정리 (2026-11-20, 지침 9절)

- 도구: `.tmp/linebreak-20261119/remaining.mjs`. 1280×800·1024×768.
- 잰 화면(크기마다 55상태, 합계 110):
  - 지도 악당 말풍선 `.map-encounter-say`: 실제 클래스 요소를 지도 화면 가운데에 띄워 악당 대사 25줄(등장 2·명중 2·퇴장 1 × 5)을 한 줄씩 넣어 잼.
  - 시설 복구 뒤 도움 대사 `.map-encounter-clear` 5줄.
  - 성취 카드 획득 장면(`awardRewardCards` 상태 주입, 5번째 카드)과 「컬렉션 완성!」 장면.
  - 3D 달리기 무대(활동 4 리듬·활동 11 멜로디)를 실제로 열어 HUD를 재고, 안내 글 `.run-message` 21줄(리듬 10·멜로디 11)을 한 줄씩 넣어 잼.
- 전 1건 → 후 0건(운영 `fb61cf79`에서도 0건). 1280·1024 모두 「공기랑 물, 탁자에서도 소리를 / 찾아냈어? 나는 선만 뽑으면 / 끝인 줄!」(161·152·44px).
- 고친 선택자: `src/korean-linebreak.css` 프로젝트 보정 `.map-encounter-say { text-wrap: balance; }`. 최대 폭(184px)·글자 크기는 그대로라 말풍선이 넓어지지 않는다.
- 캔버스 글(3D 무대 `run-stage.js`의 `sign()`): 「1구간」·「울림 ✓」·「6 cm」 같은 한 줄 표지판만 `fillText`로 그린다. 표지판 폭이 글자 수에 맞춰 늘어나 줄을 나누지 않으므로 확인함, 문제없음.
- 못 연 화면: 없음.
- 배포: 커밋 `b2b7b0d` → `lbk-deploy-2` `deploy.sh 11 … worker-cfg sound-discovery-lab` → Workers `fb61cf79-235b-4e16-9e89-70bd310f6ff5`. `cmp.sh` `korean-linebreak.css`·루트 MATCH, `app.css`·`sw.js` MATCH. `npm run check`, `npm test` 160/160 통과.
