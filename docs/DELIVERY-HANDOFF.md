# 납품 안내 · 울림도시 대작전 (11 sound)

기존 인계 문서(원본 그대로 둠): [`HANDOFF.md`](../HANDOFF.md)(작업 기록), [`README.md`](../README.md)(변경 요약), `docs/TRD.md`·`docs/PRD.md`. 교사용 안내: [`docs/TEACHER-GUIDE.md`](TEACHER-GUIDE.md).

## 1. 한눈에

| 항목 | 값 |
|---|---|
| 프로젝트 | 울림도시 대작전(11번, 초등 과학 「소리의 성질」), 앱 버전 2.3.0 |
| 운영 주소 | https://sound-discovery-lab.yelsam.workers.dev |
| 저장소 | https://github.com/yelmovie/sound-discovery-lab (`main`) |
| 현재 앱 커밋 | `9bf30cc` (2026-11-22, 인증서 A4 고도화·진행 숫자 미표시·굵은 제목) |
| 운영 반영 확인 | Workers `da07ff04-5cc9-4dd0-96c5-a3728f3ff8e2`, 공식 주소 index+코드/스타일40개 MATCH, 인증서3뷰·PDF·PNG 확인(아래 최종 운영 확인) |

## 2. 폴더 구조

배포되는 것(`scripts/build.mjs`가 `src/data.js`의 자산 목록만 `dist/`로 복사):
- `index.html`, `sw.js`(서비스 워커), `manifest.webmanifest`, `src/`(앱 코드, `src/vendor/three` 포함)
- `image/`(배경·캐릭터·생성 그림·아이콘·공유 그림), `media/`(음악·효과음·목소리·글꼴·인트로/파이널/개념 영상·3D 모형)
- `worker/media-range.js`(영상·음원 Range 처리)

보관용(배포 안 됨): `docs/`, `films/`·`scripts/films/`(영상 제작), `_unused/`(쓰지 않는 시안), `references/`(Suno·Meshy 원본), `tests/`, `scripts/qa-*.mjs`, `thumbnails/`(납품 썸네일 `thumbnail-16x8.png`, `thumbnail-1x1.png`), `.work/`·`.tmp/`(git 제외).

## 3. 실행·빌드·검사 명령 (`package.json`)

- `npm start`: 개발 서버(`node scripts/server.mjs`). 로컬 서버는 `/assets/`를 막아 지도 파이널 영상이 로컬에서는 열리지 않습니다(운영에서는 열림).
- `npm run check`: `src/*.js` 문법 검사. `npm test`: `node --test tests/*.test.mjs`. `npm run build`: `dist/` 생성. `npm run preview`: 빌드본 서버.
- 브라우저 QA(수동 실행): `scripts/qa-full-play.mjs`, `qa-run-stage.mjs`, `qa-single-screen.mjs`, `qa-responsive.mjs`. Node 20 이상.
- 마지막 기록된 결과: 테스트 160개 통과(2026-11-20), 빌드 통과.

## 4. 배포

- 호스팅: Cloudflare **Workers**(정적 자산 + Worker), 이름 `sound-discovery-lab`.
- 영상 탐색 요청(Range) 처리: `worker/media-range.js`. 정적 자산이 Range 요청에 200으로 전체 파일을 보내 영상 탐색과 iPad Safari 재생이 깨지므로 `/media/intro/*`, `/media/finale/*`, `/media/concepts/*`, `/media/audio/*`, `/assets/map-encounters/*`는 Worker가 먼저 받아 206으로 나눠 보냅니다.
- 설정 파일은 저장소 밖 작업 폴더에 있습니다: `_scratch/deploy-20261118/11-worker.json`(이름·자산 폴더·`run_worker_first` 경로·`main`), 배포 스크립트 `_scratch/deploy-20261118/deploy.sh 11 "11 sound" worker-cfg sound-discovery-lab`(원격 `origin/main`을 받아 빌드 후 배포). 저장소 안에는 wrangler 설정 파일이 없습니다.
- 푸시로 자동 배포되는 워크플로는 없습니다(`.github` 없음). 배포는 위 스크립트로 직접 합니다.

## 5. 다른 호스팅으로 옮길 때 챙길 것

- 정적 파일: `npm run build`의 `dist/` 전체.
- 서비스 워커 `sw.js`는 루트에 있어야 하고, 같은 오리진에서 서빙해야 합니다.
- 영상·음원 Range(206) 응답은 필수입니다. 지원하지 않는 호스팅이면 `worker/media-range.js`와 같은 처리를 넣어야 합니다.
- `run_worker_first`로 지정한 경로 목록을 새 호스팅의 같은 경로 규칙으로 옮깁니다. `html_handling`은 `auto-trailing-slash`, 없는 경로는 404(`not_found_handling: none`).
- 환경 값·API 키·서버는 없습니다. 기록은 브라우저 localStorage(`ullim-city-v1`)에만 저장됩니다.

## 6. 버전과 변경 이력 (`git log`)

- 2026-11-22 `c7f9dcb` 파이널 영상 컷 E를 Gemini 앱(Veo) 영상으로 교체
- 2026-11-21 `f16484b` 3D 달리기 Meshy 모형(잠금문 문틀·북 징검돌)
- 2026-11-21 `06f9b35` 이야기 영상 마무리(전체 화면·영상 안 자막·앱 주제곡)
- 2026-11-21 `1d25f95`·`7f49d21` 파이널·인트로 영상 추가
- 2026-11-21 `64445d3` 학습 문구 제안 1(힌트·어조 10줄)
- 2026-11-21 `727b9df` 브라우저 뒤로 가기는 앱 안에서, 저장소 시안 그림 `_unused/`로 이동
- 2026-11-20 `8e9689e` 글자 대비 4.5 이상, 인증서 한 장 인쇄
- 2026-11-20 저작권 표기 한 문구(`a1442d0`, `fcef33b`), 소리 3차 수정(`32193b3`)
- 2026-11-19 소리 1·2차 수정, 화면 비율·중복 버튼 정리(`9cc27aa` 외)
- 2026-11-18 성취 카드(`bcd8464`)

## 7. 권리·출처

[`docs/RIGHTS-LEDGER-20261121.md`](RIGHTS-LEDGER-20261121.md). 요약: 그림은 Codex(GPT 이미지), 영상은 구글 Flow·Gemini 앱(Veo)과 자체 렌더, 배경음은 Suno, 목소리는 ElevenLabs, 효과음은 CC0, 글꼴 OFL, three.js MIT. 장부의 출처 미확인·근거 약함은 0줄이며, 요금제 화면 사본 같은 증빙은 사용자 자료 대기입니다.

## 8. 알려진 한계와 남은 일 (`docs/reviews/SCORE-20261121.md`, 92점·실기기 제외 97점)

- 코드 구조 정리 3점: 큰 `src/app.js` 쪼개기(E2), 파일 이름(E14), CSS 색 하드코딩 토큰화.
- 실기기·수업 대기 5점: 40분 수업(B16), 실제 손가락 터치(B19), 저사양 태블릿(D10), `backdrop-filter` blur 실기 측정(D13), 학교 와이파이 첫 화면 로딩(D1).
- (2026-11-22 정리됨) 설정 창 자료 출처 문장을 권리 장부에 맞췄습니다: 기존 배경·캐릭터는 「제작자가 GPT 이미지(Codex)로 만들어 제공한 그림」, 대사는 실제 파일 수 140줄.
- 교사 검수 전 상태이며, 학기와 예상 수업 시간은 확인이 필요합니다.

## 운영 대조 기록 (2026-11-22 12:56)

- 조율 세션이 운영 주소의 `index`와 스크립트·스타일 파일 40개를 저장소 `origin/main`과 대조했습니다. 결과는 모두 일치입니다(불일치 0).
- 위 본문에 「운영 반영 확인 필요」로 적힌 칸은 이 대조로 확인된 것입니다. 이후 앱을 다시 배포하면 `_scratch/final-recheck-20261120/prodcmp.sh 11`로 다시 대조합니다.

## 인증서 최종 운영 확인 · 2026-11-22

- 사용자 추가 지시에 맞춰 종이의 미션·기록·복구율·활동 개수 숫자 요약을 표시하지 않고 수여 본문·정성 탐구 내용을 유지했습니다. 제목은900 굵기와 얇은 동색 스트로크, PNG에도 같은 획을 적용합니다. 앱 `9bf30cc`, 기존 Worker 버전 `da07ff04-5cc9-4dd0-96c5-a3728f3ff8e2`.
- 기존 검사·단위 시험163개·빌드 통과. 운영 세뷰 전체 종이/버튼, 입력0·진행 숫자0·제목900·겹침/넘침/콘솔오류0. A4 가로PDF1쪽·PNG2400×1697·학교54.9mm·이름68.3mm·쓰기높이11.3mm 확인.
- 운영 index+코드/스타일40개 MATCH. `.tmp/cert-design-20261122/compare.png`는 최신 운영 화면·PNG로 갱신했습니다. 완료 판정과 저장 형식은 그대로입니다.
