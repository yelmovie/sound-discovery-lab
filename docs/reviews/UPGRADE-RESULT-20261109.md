# 울림도시 대작전 · 11/09 밤 고도화 결과

- 브랜치 `claude/upgrade-20261109` (worktree `_claude_tmp/upgrade-20261109/wt/11`), 시작 482ac17 = 운영 `origin/map-upgrade`.
- **롤백 대상(G20)**: 운영 주소 https://sound-discovery-lab.yelsam.workers.dev/ 는 482ac17 기준 빌드. 문제가 생기면 482ac17로 다시 빌드해 배포한다.
- push·배포는 하지 않았다(메인 세션 담당). 배포용 빌드: `npm run build` → `dist/`.
- 점수: 최종스킬 78 → 87/100, 디자인스킬 126 → 128/130 (`SCORE-20261109.md`). 계획: `UPGRADE-PLAN-20261109.md`.

## 바꾼 것

| 커밋 | 내용 | 왜 |
|---|---|---|
| 77ac5e9 | 높이 500px 이하 지도 방향 버튼 46×44 → 48×48, 도구 버튼 48 / 버튼 hover 색을 `(hover:hover) and (pointer:fine)`로 / 타이틀 삐오 흔들림 4회 후 정지 / "아래으로 이동" → "아래쪽으로 이동" | C3(연속 입력 대상 48 미만 FAIL), 태블릿 hover 잔상, 멈출 수 없는 장식 루프, C14 |
| a2b58d1 | og:image·twitter:image 운영 절대 주소, og:url | G7·G18: 상대 주소는 카카오톡·SNS가 못 읽음 |
| ba66c7e | 5개 시설 데이터에 `standards`·`objective`·`review{needsReview:true}` + `tests/curriculum-data.test.mjs` | A11·A12 |
| 9a11cfd | `scripts/build.mjs`·`server.mjs`의 `D:\DevTemp`를 윈도우에서만 | E6, 맥에서 TEMP를 엉뚱한 경로로 덮어쓰던 것 |
| 019f172 | 개념영상 5편 HyperFrames 「삐오의 소리 노트」로 교체(같은 경로·이름, 16초), 포스터=결론 장면, `films/` 파이프라인, `tests/concept-films.test.mjs`, README 제작법 | 3단계 차별화: 보이는 파형 + 실제 녹음 소리로 크기·높낮이·전달·떨림 멈춤을 과학적으로 맞게 |

### 개념영상

| 편 | 파일 | 길이 | 용량(mp4 / 포스터) | 장면 |
|---|---|---|---|---|
| 떨림 | `media/concepts/vibration.mp4` | 16.0초 | 471KB / 75KB | 말렛으로 소리굽쇠 치기 → 떨림+파형 → 손으로 잡자 파형 평평·소리 0.3초 페이드 → "조용해졌어!" |
| 크기 | `media/concepts/volume.mp4` | 16.0초 | 703KB / 98KB | 같은 북 약하게(음량 0.22)/세게(1.0) → 두 파형 비교 "간격 같음 = 높낮이 같음", "높이 다름 = 크기 다름" |
| 높낮이 | `media/concepts/pitch.mp4` | 16.0초 | 531KB / 90KB | 같은 자, 같은 힘. 긴 자 천천히(×1) → 같은 자를 밀어 넣어 짧게, 빠르게(×2.5) → 두 파형 |
| 전달 | `media/concepts/travel.mp4` | 16.0초 | 515KB / 82KB | 공기(북→귀 호), 물(종→감지기 물결), 고체(망치→탁자 펄스→감지기) → 소리 나는 곳–[공기·물·고체]–듣는 곳 |
| 배려 | `media/concepts/care.mp4` | 16.0초 | 602KB / 86KB | 도서관 소음 → 음량 줄이기·패드 → 쉬는 시간·운동장 → 필요한 안내는 들리게 |

- 1920×1080/30fps 렌더 → 앱용 1280×720 H.264/AAC, faststart(moov 앞). 기존 960×540/24fps보다 선명하고 편당 0.5~0.7MB(기존 0.24~0.69MB).
- 앱 플레이어는 음소거 자동재생이 아니다: 시설 복구 보상일 때만 자동재생하고, 소리는 설정(음소거·효과음 끔)을 따른다. 그래서 영상 속 효과음이 실제로 들리며, 과학적으로 맞게 맞췄다(`films/REVIEW.md` 측정표).
- 서비스워커: 영상은 범위 요청이라 캐시하지 않고(기존 규칙), 포스터 등은 빌드마다 바뀌는 `CACHE_VERSION`(이번 빌드 `2.2.0-mw9c8hw6`)으로 통째 교체된다. `scripts/build.mjs` 변경 불필요 확인.

## 검증 명령과 실제 결과

| 명령 | 결과 |
|---|---|
| `npm test` | 93 통과 / 0 실패 (새 테스트 4개: 성취기준 데이터 1, 개념영상 시간표·VTT·용량/faststart 3) |
| `npm run check` | 통과 |
| `npm run build` | `Build complete: dist · 71 assets · 45 precached · no dependencies` |
| `QA_BASE=http://127.0.0.1:5126 node scripts/qa-single-screen.mjs after-20261109` | 282상태, 문제 0, JS·HTTP 오류 0, 자동 관찰 10종 통과 |
| 첫 화면 로딩(저장소 밖 측정 스크립트, dist, 캐시 끔) | 로컬 0.25초 / 10Mbps·40ms 1.68초(FCP 0.52초), 전송 1.70MB, 요청 27, 외부 도메인 0, 영상 요청 0 |
| 화면 5종 × 타이틀·지도·활동 | 가로 넘침 0, 세로 스크롤 0, 대비 최소 4.86:1 동일. 915×412 지도 최소 조작 48px(방향 버튼 48×48). 915×412 활동 선택지는 여전히 44px |
| 앱 안 개념영상(헤드리스 Chrome, 움직임 줄이기 켬/끔) | 5편 readyState 4, 16초, 1280×720, 포스터=결론 장면, 13초에 자막 강조 4번째, 움직임 줄이기에서 자동재생 안 함(일시정지 상태), 오류 0 |
| 오프라인 재방문(`?sw`, 오프라인 전환 뒤 새로고침) | 서비스워커 제어 확인 후 오프라인 새로고침 → 지도 화면 버튼 18개 표시 |
| 인증서 인쇄(PDF A4 가로) | 정식 인증서(관리자 미리보기 아님) 1장 |
| `hyperframes check --json` 5편 | 모두 `ok:true`, 오류 0 (남긴 경고는 `films/REVIEW.md`) |
| 운영 og 이미지 | `https://sound-discovery-lab.yelsam.workers.dev/image/og/ullim-og.jpg` 200 image/jpeg |

## 미검증 항목과 이유

- 실물 태블릿·전자칠판 터치감, 교실 스피커로 영상 소리 청음(음량은 측정만 함).
- 배포 후 스모크(G11): 배포는 메인 세션이 한다. 배포 뒤 카카오톡 미리보기 실측도 그때.
- 성취기준 원문 PDF 대조(A2), 40분 실플레이(B16), 실기 FPS(D9), 제공 이미지 상업 이용 근거(F10).
- `qa-responsive.mjs`의 모달 단계는 11/08 단일 화면 개편 뒤 `notebook` 버튼 위치가 바뀌어 하네스가 중단된다(제품 결함 아님). 최신 하네스 `qa-single-screen.mjs`로 대신 검증했다. 하네스 수정은 범위 밖이라 남겨 둠.

## 남은 일

- 계획서 1-12~1-16(이미지 용량, 활동 선택지 48px, 색 토큰, box-shadow 애니메이션, 미사용 시안 정리·파일명), 2-3·2-4(오답 위치 안내, 실험 결과 낭독), 3-5(복구 직후 주민 반응 컷).
- 원본 폴더의 미커밋 "신호 복원(signal-restoration)" 작업은 이 브랜치에 없다. 병합 순서는 메인 세션이 정한다.
