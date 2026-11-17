# 11 울림도시 대작전 · 3D 달리기 스테이지 계획 · 2026-11-17

**현재 단계: 구현·배포 완료(2026-11-17).** 아래 본문은 구현 전 계획이고, 코드를 읽고 바로잡은 내용은 「계획 확정」, 실제 결과는 끝의 「구현 결과」에 있다. 공통 규격은 [공통 계획](../../_shared/RUN-STAGE-3D-PLAN-20261117.md)에 있다.

## 한 줄 요약

「울림 징검다리」와 「높낮이 잠금문」 두 의뢰를, 탐험가가 소리 나는 발판을 밟아 목표 소리 순서를 만드는 3D 달리기로 바꾼다.

## 바꿀 자리

- 3~4학년군 「소리의 성질」(4과07-01~03). 시설 5곳 × 관찰·비교·응용·의뢰 = 20개 활동이고 모두 필수다.
- 대상은 두 곳이다.

| 미션 | 위치 | 지금 하는 일 |
|---|---|---|
| `rhythm` 울림 징검다리 | 진동 연구소 의뢰, 4번째 활동(lesson 3) | 울리기·쉼 버튼으로 목표 순서 [울림, 쉼, 울림], [울림, 쉼, 울림, 쉼, 울림]을 맞춘다 |
| `melody` 높낮이 잠금문 | 조율 공방 의뢰, 11번째 활동(lesson 10) | 목표를 듣고 길이 6·12·18인 자를 골라 [6, 12, 18], [12, 6, 18, 12]를 맞춘다 |

- 파일: `src/challenges.js`(84~94행 rhythm, 120~132행 melody), `src/challenge-rules.js`(판정), `src/action-missions.js`(지금의 진행 줄 표시). 화면은 `src/lesson-activity.js`가 `challengeView`를 불러 그린다.
- 지금 `action-missions.js`는 삐오 아이콘이 진행 줄을 따라 움직이는 표시뿐이다. 9개 프로젝트 중 화면 변화가 가장 크다.
- `rhythm`을 먼저 만들고 같은 구조로 `melody`를 만든다. 나머지 8개 미션은 이번 범위가 아니다.

## 지금 방식과 바뀐 방식

| | 지금 | 바꾼 뒤 |
|---|---|---|
| 울림 징검다리 | 울리기·쉼 버튼을 순서대로 누른다 | 북 모양 징검돌에 **뛰어서 올라타면 울림**, **걸어서 올라타면 쉼**이다 |
| 높낮이 잠금문 | 자 6·12·18을 골라 칸을 채운다 | 길이가 다른 세 줄의 발판 중 하나를 골라 밟는다. 짧은 발판은 높은 소리, 긴 발판은 낮은 소리가 난다 |
| 목표 듣기 | '목표 듣기' 버튼 | 같은 버튼. 출발 전에 듣는다 |
| 화면 | 2D 활동 화면 위 진행 줄 | 물길 위 징검돌, 잠금문 앞 발판 길 |

## 과학 개념과 조작

| 개념 | 달리기에서 하는 일 |
|---|---|
| 물체가 떨리면 소리가 난다 | 뛰어서 밟은 징검돌은 떨리는 모습이 보이고 소리가 난다. 걸어서 올라간 돌은 떨리지 않고 소리도 없다 |
| 떨림이 멈추면 소리도 멈춘다 | 다음 돌로 넘어가면 앞 돌의 떨림 표시가 잦아든다 |
| 같은 세기로 튕길 때 짧을수록 높은 소리가 난다 | 발판의 길이가 눈에 보이고, 밟으면 그 길이에 맞는 높낮이로 소리가 난다 |

### 지켜야 할 제한

- 학습 모델 제한을 따로 적은 문구는 코드와 문서에서 찾지 못했다. 그래서 아래를 이번 계획의 제한으로 삼는다.
- 높낮이 값 260·390·650Hz(`src/data.js` 47행 부근)는 게임에서 정한 값이다. 발판 소리는 이 값을 그대로 쓰고 새 값을 만들지 않는다.
- 뛰어오른 높이나 떨어진 속도로 소리의 크기를 바꾸지 않는다. 소리의 세기는 다른 활동(볼륨 경기장)의 내용이라 여기서 섞으면 조건이 두 개가 된다.
- 소리를 끈 교실에서도 풀 수 있게, 떨림 표시와 높낮이 표시(발판 길이, 색 띠)를 항상 함께 보여 준다.
- `docs/PRD.md`는 두 미션을 3라운드로 적었지만 코드는 2라운드다(`challenge-rules.js` 8·11행). 코드 기준 2라운드를 유지한다.
- 자동실험(재생·속도·일시정지)은 기존대로 둔다. 자동실험은 학생이 직접 연주하는 단계 앞에서 멈추게 되어 있으므로, 달리기 구간은 자동으로 진행하지 않는다.

## 코스 구성

**울림 징검다리(2라운드)**

1. 연습: 징검돌 두 개에서 "뛰어 밟기"와 "걸어 오르기"를 한 번씩 해 본다.
2. 1라운드: 징검돌 3개. 목표는 울림, 쉼, 울림.
3. 2라운드: 징검돌 5개. 목표는 울림, 쉼, 울림, 쉼, 울림.

**높낮이 잠금문(2라운드)**

1. 연습: 세 발판을 차례로 밟아 소리를 들어 본다.
2. 1라운드: 세 번 고른다. 목표는 6, 12, 18.
3. 2라운드: 네 번 고른다. 목표는 12, 6, 18, 12.

순서가 틀리면 그 자리에서 강 건너 출발 돌로 되돌아오고, 기존 오답 안내가 나온다. 물에 빠지는 연출은 하지 않는다.

## 연결과 저장

- 저장 키는 localStorage `ullim-city-v1`이다. `work[i].challenge`의 `{proof[], sequence[], heard, sounding}`을 그대로 쓴다.
- 밟은 결과를 `sequence[]`에 넣고, 라운드 결과는 기존 `award()`로 `proof[]`에 쌓는다. 판정은 `checkChallenge()`가 한다.
- `cleanChallenge()`(`challenge-rules.js` 40~52행)가 저장 필드를 걸러 낸다. 새 필드를 넣으면 지워지므로, 저장 형식은 바꾸지 않는다.
- 완료 기록은 기존 흐름(`runTrial` → `finishInteraction` → `collectReadyEvidence` → `recordEvidence`)을 그대로 탄다.
- 대체 화면은 기존 버튼 방식 화면이다. 이 프로젝트에는 WebGL 대체 처리가 아직 없으므로 새로 만든다.

## 이미지 생성·적용 목록

활동 화면은 2D 생성 일러스트다. 참고 그림은 `image/generated/explorer-walk.webp`, `image/generated/concepts/pio-fly.webp`, `image/generated/dialogue/pio.webp`다.

| 번호 | 그림 | 종류 | 적용 위치 |
|---|---|---|---|
| 1 | 탐험가 대기 | 캐릭터 동작 줄 | 서 있을 때 |
| 2 | 탐험가 걷기 | 캐릭터 동작 줄 | 걸어 오르기(쉼) |
| 3 | 탐험가 점프 | 캐릭터 동작 줄 | 뛰어 밟기(울림) |
| 4 | 탐험가 기뻐하기 | 캐릭터 동작 줄 | 라운드 통과 |
| 5 | 삐오 날기 | 캐릭터 동작 줄 | 동료, 목표 소리 안내 |
| 6 | 북 모양 징검돌(윗면, 옆면) | 소품 2장 | 울림 징검다리 |
| 7 | 자 모양 발판 무늬(눈금 없이) | 바닥 무늬 | 높낮이 잠금문의 세 발판 |
| 8 | 잠금문(닫힘, 열림) | 소품 2장 | 높낮이 잠금문 도착 |
| 9 | 물길 수면 무늬 | 바닥 무늬 | 징검다리 아래 |
| 10 | 울림도시 원경(먼 건물, 가까운 강둑) | 원경 2장 | 배경 |
| 11 | 시작 카드 그림 2장 | 시작 카드 | 두 미션 들어갈 때 |

떨림 표시(물결 선), 높낮이 색 띠, 발판 길이 숫자는 코드로 그린다. 생성 원본과 실행 파일은 이 프로젝트의 기존 `image/generated/` 규칙을 따라 `image/generated/run-stage/`에 둔다. 예상 16장.

## 기술, 검증, 배포

- **Three.js가 없는 프로젝트다.** 설치 없는 구조라서 npm으로 넣지 않고 로컬 파일로 넣는다. 06번이 쓰는 `three.module.min.js`(r170)와 같은 판을 `src/vendor/three/`에 두고 라이선스 파일을 함께 넣는다. 빌드가 `src/`를 통째로 복사하므로(`scripts/build.mjs` 22행 부근) 이 자리가 맞다.
- `sw.js`의 미리 저장 목록은 `app.js`의 정적 import만 따라간다(`build.mjs` 34~47행). 동적으로 불러오는 3D 파일은 처음 열 때만 캐시되므로, 오프라인에서 바로 되게 하려면 목록에 넣어야 한다.
- 새 JS 파일은 `check` 스크립트의 파일 목록에도 손으로 추가해야 한다.
- 소리는 기존 `src/audio.js`와 `src/samples.js`를 쓴다. 음소거와 소리 분리 설정을 그대로 따른다.
- 방향판은 `src/map-controls.js`의 `bindDirectionPad`를 다시 쓴다.
- 검증 명령: `npm test`(`node --test`), `npm run check`, `npm run build`.
- 운영 주소는 https://sound-discovery-lab.yelsam.workers.dev 이다. Cloudflare Worker `sound-discovery-lab`이고 `wrangler.jsonc`가 없다. 배포 절차는 `docs/reviews/DEPLOY-20261110-OVERNIGHT.md`를 따른다.

## 작업 순서

1. Three.js 로컬 파일 추가, WebGL 확인과 대체 화면 연결
2. 규칙 연결: 밟은 방식(뛰기·걷기)과 고른 발판을 `sequence[]`로 바꾸는 함수와 테스트
3. 기본 도형으로 울림 징검다리 2라운드를 끝까지 해 보기
4. 같은 구조로 높낮이 잠금문 만들기
5. 이미지 생성·적용
6. 오프라인 캐시 목록, `check` 목록 추가
7. 소리 끈 상태, 대체 화면, 새로고침 후 이어 하기, 자동실험 확인
8. 검증 명령 → 커밋·푸시 → 운영 배포 → 운영 주소 확인

## 시작 전에 확인할 것

- 학습 내용이 교사 검수 전으로 표시되어 있다(`src/data.js`의 `needsReview:true`). "뛰어 밟으면 울림, 걸어 오르면 쉼"이라는 조작이 단원 내용과 어긋나지 않는지 검수 항목에 넣는다.
- 추적되지 않은 `.claude/`, `.wrangler/`, `graphify-out/`, `output/`는 이번 작업과 섞지 않는다.
- 운영 시트 G·H열의 주소와 저장소를 대조한다.

## 계획 확정 (2026-11-17, 구현 세션)

코드를 읽어 위 계획과 다른 점을 바로잡았다.

| 계획에 적힌 것 | 실제 | 정한 것 |
|---|---|---|
| 순서가 틀리면 출발 돌로 되돌아온다 | `runChallenge`는 리듬에서 맞게 만든 앞부분을 그대로 둔다("앞서 만든 신호는 그대로야") | 리듬은 방금 서 있던 북(또는 구간 발판)으로, 멜로디는 구간 발판으로 되돌린다. 기존 판정과 화면이 어긋나지 않게 하려는 것이다 |
| `sw.js`의 미리 저장 목록에 추가 | 목록은 `scripts/build.mjs`가 만든다. 정적 import만 따라가서 지연 불러오기 파일은 빠진다 | `build.mjs`에 3D 파일·three.js·그림을 직접 넣었다 |
| 방향판은 `bindDirectionPad` 재사용 | 이 함수는 화면 버튼만 처리하고 키보드는 눌림 표시만 한다 | 화면 버튼은 그대로 재사용, 키보드(WASD·방향키·Space)는 `src/run-input.js`가 받는다 |
| 멜로디도 점프 | 발판을 고르는 활동이라 점프가 뜻이 없고, 짧은 자를 뛰어넘어 줄을 건너뛸 수 있다 | 높낮이 잠금문은 걷기만 쓴다. 오른쪽 아래 단원 버튼은 「목표 듣기」다 |
| 이미지 16장 | 탐험가 걷기 4방향 시트(`explorer-walk.webp`)와 삐오 그림이 이미 있다 | 걷기·대기·기뻐하기는 기존 시트를 쓰고 점프 동작만 새로 만들었다 |
| 새로고침 뒤 이어 하기 | 리듬은 마지막이 울림인 채 저장되면 `sounding`이 꺼져 쉼을 받을 수 없다(2D는 「처음부터」 안내) | 3D는 그 구간을 자동으로 처음부터 다시 시작한다(기존 `clear` 동작 호출) |
| 2D 오답 문구를 그대로 | 멜로디 문구가 "칸을 눌러 비우거나 끌어다 바꿔 봐"라서 3D 조작과 맞지 않는다 | 판정은 그대로 두고 3D 안내줄만 "목표와 다른 발판이 있어. 목표를 다시 듣고 첫 줄부터 골라 봐."로 보여 준다 |

### 코스 설계표

단위는 m. 달리기 2.8m/s, 점프 초속 5.2m/s, 중력 16m/s²(한 번 뛰면 앞으로 약 1.8m). 숫자는 `src/run-stage-rules.js`에 있고 테스트가 "한 번 뛰어 다음 북에 닿고, 한 칸을 건너뛸 수 없다"를 확인한다.

| 미션 | 구간 | 구성 | 하는 일 | 기록 |
|---|---|---|---|---|
| 울림 징검다리 | 연습 | 북 2개 | 뛰어 밟기 1번, 걸어 오르기 1번 | 없음 |
| | 1구간 | 북 3개(지름 2, 간격 0.6, 사이에 판자) | 울림·쉼·울림 | `sequence` → `proof[0]` |
| | 2구간 | 북 5개 | 울림·쉼·울림·쉼·울림 | `sequence` → `proof[1]` |
| 높낮이 잠금문 | 연습 | 자 3개 한 줄 | 세 발판을 밟아 소리 비교 | 없음 |
| | 1구간 | 3줄 | 목표 듣기 뒤 6·12·18 | `heard`, `sequence` → `proof[0]` |
| | 2구간 | 4줄 | 목표 듣기 뒤 12·6·18·12 | `heard`, `sequence` → `proof[1]` |

- 자 발판의 떨리는 길이는 0.8·1.6·2.4m로 6:12:18 비율 그대로다. 한쪽 끝을 받침대가 누르고 나머지는 바닥에서 떠 있다.
- 울림 징검다리는 옆으로 벗어나면 물로 떨어져 방금 서 있던 곳으로 돌아온다. 높낮이 잠금문은 길 양옆을 막아 떨어지지 않는다.
- 같은 구간에서 세 번 막히면(오답·떨어짐) 조작 방법 힌트가 나오고 「기존 방식으로 하기」가 강조된다. 힌트는 답을 말하지 않는다.

### 구현 작업 목록

1. `src/vendor/three/`에 three.js r170과 라이선스 복사
2. `src/run-stage-rules.js`(규칙 연결)와 `tests/run-stage.test.mjs`
3. `src/run-input.js`(입력), `src/run-character.js`(캐릭터), `src/run-stage-hud.js`·`src/run-stage.css`(화면 겹침), `src/run-stage.js`(무대)
4. `src/app.js`에 열기·닫기·대체 화면 연결
5. 그림 생성·적용
6. `package.json` check, `scripts/build.mjs` 미리 저장 목록, `index.html` 스타일
7. `scripts/qa-run-stage.mjs`로 끝까지 플레이 확인

## 구현 결과 (2026-11-17)

### 무엇이 바뀌었나

- 「울림 징검다리」(4번째 활동)와 「높낮이 잠금문」(11번째 활동)이 3D 달리기 화면으로 먼저 열린다. 2D 화면은 그대로 남아 대체 화면으로 쓴다.
- 판정은 전부 기존 `runChallenge`·`checkChallenge`가 한다. 3D는 "어느 북에 어떻게 올라왔는지", "어느 자를 밟았는지"를 기존 동작(`ring`·`rest`·`note`·`listen`·`clear`)으로 바꿔 보낼 뿐이다. 저장 필드는 하나도 늘지 않았다(`proof`, `sequence`, `heard`, `sounding`, `message`, `kind`만 쓴다).
- 완료 기록은 기존 흐름 그대로다: `runTrial` → `finishInteraction` → `collectReadyEvidence` → `recordEvidence`.
- 마지막 구간을 풀면 문이 열리고 2.8초 뒤 3D 화면이 닫혀 기존 완료 카드(「다음 활동」/「시설 복구」)가 나온다.

### 바뀐 파일

| 파일 | 내용 |
|---|---|
| `src/run-stage-rules.js` (새) | 코스 숫자, 착지를 기존 동작으로 바꾸는 규칙 연결, 안내 문구 |
| `src/run-stage.js` (새) | 무대·카메라·걷기·점프·되돌아오기, 그림 입히기 |
| `src/run-character.js` (새) | 세운 그림 캐릭터와 둥근 그림자 |
| `src/run-input.js` (새) | 화면 방향판·버튼·키보드를 하나의 입력으로 |
| `src/run-stage-hud.js`, `src/run-stage.css` (새) | 목표 줄, 안내줄, 화면 버튼 |
| `src/vendor/three/` (새) | three.js r170 `three.module.min.js`, `THREE-LICENSE.txt` (06번에서 복사) |
| `src/app.js` | 3D 열기·닫기, 대체 화면 전환, 2D 화면의 「3D 달리기」 버튼, 교사 시연 방향키 보호 |
| `src/data.js` | `runStageAssets` 목록(빌드 복사·미리 저장·무대가 모두 이 목록을 본다) |
| `src/settings-content.js`, `docs/CREDITS.md` | three.js(MIT) 고지 |
| `index.html`, `package.json`, `scripts/build.mjs` | 스타일 연결, check 목록, 오프라인 미리 저장 목록 |
| `tests/run-stage.test.mjs` (새) | 규칙 연결·저장·코스·목록 테스트 9개 |
| `scripts/qa-run-stage.mjs` (새), `scripts/qa-full-play.mjs` | 3D 끝까지 플레이 확인, 기존 전수 플레이는 움직임 줄이기 설정으로 2D 경로 확인 |
| `image/generated/run-stage/*.webp` (새) | 그림 13장 |
| `README.md`, `HANDOFF.md`, 이 문서 | 기록 |

### 그림 (GPT 이미지, 13장)

원본 PNG는 `.work/run-stage-20261117/`(git 제외, 외장 SSD), 실행 파일은 `image/generated/run-stage/`에 있다. 변환은 크기 줄이기와 WebP 인코딩뿐이다(`.work/run-stage-20261117/convert.mjs`). 걷기·대기·기뻐하기는 기존 `image/generated/explorer-walk.webp`, 삐오는 기존 `image/generated/concepts/pio-fly.webp`를 다시 썼다.

| 파일 | 적용 위치 | 크기 | 참고 그림 |
|---|---|---|---|
| `paving.webp` | 발판 윗면·옆면(울림 징검다리), 길 바닥 기본값 | 11KB | 없음 |
| `drum-top.webp` | 북 모양 징검돌 윗면 | 40KB | 없음 |
| `water.webp` | 호수 수면 | 14KB | 없음 |
| `skyline.webp` | 원경(울림도시). 좌우로 세 번 이어 붙여 카메라와 함께 움직임 | 55KB | `image/backgrounds/chatgpt_generated_017_53e4619e94.jpg` |
| `explorer-jump.webp` | 탐험가 점프 6칸(웅크림·도약·상승·정점·낙하·착지) | 158KB | `image/generated/explorer-walk.png` |
| `island.webp` | 호수 위 작은 섬 7곳 | 58KB | `.work/run-stage-20261117/skyline.png` |
| `lily.webp` | 물 위 연잎 26장 | 28KB | 없음 |
| `gate-arch.webp` | 도착 문 아치(축음기 나팔 장식) | 86KB | 없음 |
| `gate-door.webp` | 도착 문짝 2장(오른쪽은 좌우 반전) | 36KB | 없음 |
| `workshop-floor.webp` | 높낮이 잠금문 길 바닥 | 10KB | 없음 |
| `wood.webp` | 징검돌 사이 판자, 자 받침대 | 7KB | 없음 |
| `drum-side.webp` | 북 옆면 | 15KB | 없음 |
| `balloon.webp` | 하늘의 열기구 2개 | 34KB | 없음 |

글자·숫자·표시는 전부 코드로 그린다: 표지판(울림·쉼·구간 이름), 자 길이(6·12·18 cm), 떨림 고리, 높낮이 색, 구간 등불. 그림에는 글자가 없다(13장 모두 열어 확인했다).

프롬프트 원문:

- **paving**: Seamless tileable square texture of warm sand-colored stone paving slabs seen from directly above, large rounded-edge stones with thin slightly darker joints, soft painterly children's educational game illustration style, even flat lighting with no cast shadows, the pattern tiles seamlessly on all four edges, no objects, no text, no letters, no logo.
- **drum-top**: Top-down orthographic view of one round hand drum seen from directly above, the drum fills the whole square frame edge to edge: cream-colored stretched drum skin with a subtle painterly texture in the middle, a warm red-brown wooden rim with small brass tuning lugs evenly spaced around the edge, soft even lighting, bright cheerful children's educational game illustration style with clean shapes, transparent background outside the drum circle, no drumsticks, no hands, no text, no letters, no logo.
- **water**: Seamless tileable square texture of calm stylized river water seen from directly above, bright teal-blue with soft lighter curved ripple lines and gentle highlights, flat painterly children's educational game illustration style, even lighting with no shadows, the pattern tiles seamlessly on all four edges, no objects, no boats, no text, no letters, no logo.
- **skyline**: Wide panoramic background for a children's science game about sound, in the same bright painterly style and colour palette as the reference image: a friendly futuristic city seen far away across a calm river, rounded pastel teal and cream buildings with glass domes sit on the horizon line in the middle of the picture, bright morning sky with soft clouds above, the lower half is only open calm light-blue water with nothing in it so that game objects can be drawn in front. No characters, no people, no text, no letters, no logo.
- **explorer-jump**: Pixel-art sprite strip of exactly the same girl explorer character as in the reference image (brown wavy ponytail with a teal scrunchie, white and navy jacket, blue backpack with orange straps, navy shorts, white socks, blue sneakers), seen from behind like the bottom row of the reference. One horizontal row of six frames of a jump, evenly spaced with clear gaps: 1 crouching before the jump, 2 pushing off, 3 rising with arms lifted, 4 at the top of the jump with knees tucked, 5 falling with arms out, 6 landing in a small crouch. Same pixel-art style, same character size and proportions in every frame, feet on the same baseline in frames 1 and 6, transparent background, no ground, no shadows, no text, no letters, no logo.
- **island**: One tiny cute floating island for a children's game about a city of sound, side view, in the same soft pastel painterly style as the reference image: a small round grassy islet with one pastel teal-and-cream dome house, a little golden gramophone-horn speaker tower, two round fluffy trees and tiny flowers, the rocky base of the island narrows at the waterline. Storybook illustration, soft pastel colours, transparent background, no water, no people, no text, no letters, no musical notes, no logo.
- **lily**: Top-down view of one cute round lily pad with a small pink lotus flower and a tiny water droplet on it, soft painterly storybook illustration style, pastel greens, the lily pad fills most of the square frame, transparent background, no shadow, no water, no text, no letters, no logo.
- **gate-arch**: Front orthographic view of a cute storybook gate frame for a children's game about a city of sound: two round pastel cream-and-teal pillars joined by an arched top decorated with one golden gramophone-horn speaker ornament and curved pastel sound-wave lines, the doorway opening in the middle is completely empty and transparent, perfectly symmetrical, soft painterly illustration with pastel colours, transparent background, no doors, no steps, no ground, no text, no letters, no musical notes, no logo.
- **gate-door**: Front orthographic view of one cute pastel lavender wooden door leaf that fills the whole frame edge to edge as a tall rectangle, with rounded panels, a round porthole window with teal glass in the upper part, a golden ring handle and small golden studs, soft painterly storybook illustration style, flat even lighting, no door frame, no wall, no text, no letters, no numbers, no logo.
- **workshop-floor**: Seamless tileable square texture of a cute music workshop floor seen from directly above: soft pastel lavender and cream square tiles in a gentle checker pattern with thin rounded joints, soft painterly children's game illustration style, even flat lighting with no shadows, the pattern tiles seamlessly on all four edges, no objects, no text, no letters, no logo.
- **wood**: Seamless tileable square texture of light honey-coloured wooden boards seen from directly above with soft grain lines running straight up and down, soft painterly children's game illustration style, even flat lighting with no shadows, the pattern tiles seamlessly on all four edges, no nails, no knots, no objects, no text, no letters, no logo.
- **drum-side**: Seamless horizontally tileable texture band showing the side of a cute toy drum in flat front view: warm red painted wood with a cream zigzag rope lacing pattern and small golden studs along the top and bottom rims, soft painterly children's game illustration style, even lighting, the pattern repeats seamlessly from left to right, the band fills the whole frame, no text, no letters, no logo.
- **balloon**: One cute hot air balloon for a children's game about a city of sound, side view: pastel teal, cream and coral vertical stripes, a small wicker basket carrying a tiny golden gramophone horn, soft painterly storybook illustration style, transparent background, no people, no text, no letters, no logo.

### 물리·겹침 점검에서 고친 것 (사용자 요청, 2026-11-17)

| 문제 | 고친 내용 |
|---|---|
| 발판과 북이 물 위에 떠 있었다 | 몸통을 수면 아래까지 내려 물에 서 있게 했다 |
| 자가 바닥에 붙은 채 떨렸다 | 받침대가 한쪽 끝을 누르고 나머지는 바닥에서 떠 있게 했다. 떨리는 부분의 길이는 6:12:18 그대로다 |
| 걸어 오르면 앞 북의 떨림이 갑자기 멈추는 것처럼 보였다 | 울린 북의 떨림 고리가 시간이 지나며 스스로 잦아들게 했고, 문구를 "살며시 올랐더니 이 북은 떨리지 않아"로 바꿨다 |
| 문이 옆으로 밀리며 기둥을 뚫었다 | 문짝이 경첩에서 안쪽으로 돌아 열린다 |
| 표지판과 완료 표시가 허공에 떠 있었다 | 표지판은 물에 박힌 기둥 위에 세웠고, 밟은 자는 떠 있는 표시 대신 길이판 색이 바뀐다 |
| 구간 등불이 문 위 허공에 떠 있었다 | 문 기둥 꼭대기에 올렸다 |
| 먼 표지판끼리, 삐오와 표지판이 겹쳤다 | 표지판은 가까운 것만 보이고, 구간 표지와 삐오는 다른 표지가 없는 쪽으로 옮겼다 |
| 넓은 휴대폰 화면에서 원경 양옆이 비었다 | 원경을 세 장 폭으로 넓혔다 |
| 열기구가 화면 위에서 잘렸다 | 하늘 띠 안에 온전히 보이게 카메라와 함께 움직이도록 했다 |
| 물이 한 방향으로 흐르는데 연잎은 가만히 있었다 | 수면을 제자리 잔물결로 바꿨다 |
| 점프 중 물 위에서 그림자가 사라졌다 | 아래가 물이면 수면에 그림자가 진다 |

화면 겹침 점검(`.tmp/run-stage-20261117/audit.mjs`): 1920×1080, 1280×800, 1024×768, 915×412, 844×390, 800×600에서 두 미션의 가장 긴 목표 줄과 가장 긴 안내 문구로 확인했다. 3D 화면의 버튼·목표 줄·안내줄은 서로 겹치거나 화면 밖으로 나가지 않았고 모두 52px 이상이다. 기존 상단 버튼(홈·이전·소리·설정)은 작은 화면에서 48px인데 이번 범위 밖이라 그대로 뒀다.

### 실행한 검증

| 검증 | 결과 |
|---|---|
| `npm run check` | 통과 |
| `npm test` | 138개 통과(기존 129 + 새 9) |
| `npm run build` | 통과. 149 assets, 69 precached |
| `node scripts/qa-run-stage.mjs` (dist, 실제 Chrome) | 16개 항목 통과 |
| `node scripts/qa-full-play.mjs` (dist, 움직임 줄이기) | 20개 활동 모두 PASS. 그 뒤 스크립트의 915×412 재방문 점검이 9번째 활동(떨리는 길이, 이번에 손대지 않음)에서 멈췄다. 이번 변경 전에도 그랬는지는 확인하지 못했다 |

`qa-run-stage.mjs`가 확인한 것: 울림 징검다리를 1280×800 키보드(방향키·Space)와 1024×768 화면 버튼으로, 높낮이 잠금문을 1024×768 화면 버튼과 1280×800 키보드(WASD)로 연습부터 끝까지 플레이. 오답 착지와 떨어짐 뒤 되돌아오기, 중간 새로고침 뒤 이어 하기, 완료 뒤 `proof`와 증거 기록, 새로고침 뒤 유지, 움직임 줄이기에서 2D 먼저, 「기존 방식으로 하기」 뒤 자동재생, 교사 시연에서 방향키가 활동을 넘기지 않고 학생 기록이 바뀌지 않음, WebGL이 없을 때 2D로 진행. 콘솔·페이지·HTTP 오류 0건.

추가 다운로드는 약 1.32MB다(three.js 0.69MB, 그림 0.57MB, 코드 0.06MB). 삼각형은 수천 개, 픽셀 비율은 최대 1.5, 그림자는 발밑 원 하나, 후처리는 없다.

### 교사 검수 항목

`src/data.js`의 `needsReview:true`는 그대로 뒀다. 아래를 검수해 주면 좋겠다.

1. **"뛰어 밟으면 울림, 걸어 오르면 쉼"**: 뛰어 내려 북을 치면 북이 떨려 소리가 나고, 살며시 오르면 치지 않아 떨림이 없다는 뜻으로 만들었다. 단원 내용(소리가 나는 물체는 떨린다)과 어긋나지 않는다고 판단했다. 다만 실제로는 살며시 올라도 작은 소리가 날 수 있고, 2D 활동의 쉼은 "떨리는 소리굽쇠를 손으로 잡아 멈추기"였는데 3D의 쉼은 "치지 않아서 울리지 않기"라서 "떨림이 멈추면 소리도 멈춘다"는 표현이 약해졌다. 울린 북의 떨림 표시와 소리가 함께 잦아드는 것으로만 보여 준다.
2. **소리 크기**: 뛰는 높이나 떨어지는 속도로 소리 크기가 달라지지 않는다. 크기는 볼륨 경기장의 내용이라 조건을 섞지 않으려는 것이다.
3. **자 발판**: 한쪽 끝을 고정한 자의 떨리는 길이가 짧을수록 높은 소리가 난다. 발판은 사람이 밟을 만큼 크게 그린 모형이고 길이 비율만 6:12:18로 맞췄다. 떨림은 짧은 자가 더 빠르게 보이도록 그렸다(떨림 폭은 같다). 소리는 기존 값 650·390·260Hz 그대로다.
4. 힌트는 조작 방법만 말하고 답을 말하지 않는다.

### 확인하지 못한 것

- 학교 태블릿·전자칠판 실기기의 터치감과 프레임 속도(30fps 목표)는 재지 못했다. 확인은 맥의 Chrome에서만 했다.
- 실제 스피커로 소리를 듣고 확인하지 못했다(QA는 음소거 상태).
- 생성한 타일 그림(바닥·물·나무결)의 이음매는 화면에서 눈에 띄지 않았지만 픽셀 단위로 검사하지는 않았다.
