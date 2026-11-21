# 권리 장부 · 울림도시 대작전 (11 sound)

2026-11-21 조사. 대상은 운영 빌드(앱 `bf402c8`, Workers `66a4456f`)에 실제로 들어가는 그림·영상·음악·효과음·목소리·글꼴이다(빌드는 `src/data.js`의 `assets` 목록 288개만 싣는다). 근거는 저장소 안 기록과 `_shared` 문서에서만 찾았고, 추측으로 채우지 않았다.

상태: **확인됨** = 출처·이용 조건·기록 파일이 모두 있음 / **근거 약함** = 만든 곳은 기록에 있으나 계약·요금제·프롬프트 같은 증빙이 저장소에 없음 / **출처 미확인** = 만든 곳이나 이용 조건을 기록에서 찾지 못함.

## 그림

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `image/backgrounds/chatgpt_generated_017~026_*.jpg` 10장(장소 배경) | Codex(GPT 이미지) — 저장소 기록은 「사용자가 제공한 ChatGPT 생성 그림」 | 제공 시점 미기록(2026-11-05 이전이라 이 맥에 생성 로그 없음), 2026-10-29 PNG→JPEG 변환 | 유료 요금제(사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제」 → "전부 맞아"), `_shared/CODEX-IMAGE-RECORDS-20261121.md`) | `docs/CREDITS.md` 「기존 제공 이미지 — 11개」, `docs/ASSET_INDEX.md`, 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제」 → "전부 맞아"), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `image/characters/chatgpt_generated_028_ee0700142c.jpg`(캐릭터 참고) | Codex(GPT 이미지) — 저장소 기록은 「사용자가 제공한 ChatGPT 생성 그림」 | 제공 시점 미기록(2026-11-05 이전이라 이 맥에 생성 로그 없음), 2026-10-29 PNG→JPEG 변환 | 유료 요금제(사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제」 → "전부 맞아"), `_shared/CODEX-IMAGE-RECORDS-20261121.md`) | `docs/CREDITS.md` 「기존 제공 이미지 — 11개」, `docs/ASSET_INDEX.md`, 사용자 확인 2026-11-21(「16곳 그림은 전부 Codex(GPT), 영상은 제미나이, 모두 유료 요금제」 → "전부 맞아"), `_shared/CODEX-IMAGE-RECORDS-20261121.md` | 확인됨(사용자 확인) |
| `image/branding/title-logo.webp`(제목 로고) | 사용자 제공 `chatgpt_generated_029` PNG를 줄여 만든 파생본 | 2026-10-30 파생, 2026-11-14 최적화(`eeabaab`) | 원본 029와 같음: 유료 요금제(사용자 확인) | `docs/CREDITS.md` 「2026-10-30 파생 이미지」 | 확인됨(사용자 확인, 원본 029 기준) |
| `image/backgrounds/title-city.webp`(시작 화면 배경) | 배경 `chatgpt_generated_018`을 1440px·품질 .82로 줄인 파생본(새로 그린 그림 아님) | 2026-11-13~14, Codex 세션 `rollout-2026-11-13T21-43-10-01a1d4ee…`의 변환 스크립트(`chatgpt_generated_018_99f70fe2eb.jpg → title-city.webp`), 커밋 `eeabaab` | 원본 018과 같음: 유료 요금제(사용자 확인) | 세션 기록(`_shared/CODEX-IMAGE-RECORDS-20261121.md` 방법) | 확인됨(사용자 확인, 원본 018 기준) |
| `image/og/ullim-og.jpg`, `image/icons/icon-192·512.png` | 저장소 스크립트 `scripts/compose-share-art.swift`로 합성 | 2026-10-30 | 재료 018·title-logo(사용자 확인)·`pio-guide.svg`(자체 제작)의 조건을 따름 | `docs/CREDITS.md` 「2026-10-30 파생 이미지」 | 확인됨(재료 기준) |
| `image/generated/ullim-village.webp`(지도), `explorer-walk-lite.webp`·`bird-walk-lite.webp`(걷기 시트, 2026-11-21 손실 WebP 사본) | 내장 image_gen(OpenAI 이미지 생성) | 2026-10-22 생성 | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | `image/generated/world-manifest.json`(서비스·프롬프트·원본 경로), `docs/CREDITS.md` 「이번 생성 이미지 — 13개」 | 확인됨(기록 + 사용자 확인) |
| `image/generated/core·ring·tuning-fork·fork-stand·drum·mallet·kalimba·tine·transmitter·receiver.png` 10장(실험 소품) | 내장 image_gen | 2026-10-22 생성 | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | `image/generated/props-manifest.json`(프롬프트·검증 값) | 확인됨(기록 + 사용자 확인) |
| `image/generated/concepts/` 36개(개념·장면·악기·배지 그림) | 2026-10-28 내장 image_gen 13개 + 2026-11-17 GPT 이미지(Codex 내장 이미지 도구) | 2026-10-28, 2026-11-17 | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | `image/generated/concepts/manifest.json`(프롬프트), `docs/CREDITS.md` | 확인됨(기록 + 사용자 확인) |
| `image/generated/run-stage/` 13개(3D 달리기 무대) | GPT 이미지(Codex 내장 이미지 도구) | 2026-11-17 | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | `docs/RUN-STAGE-3D-PLAN-20261117.md` 「구현 결과」(프롬프트·파일), 원본 `.work/run-stage-20261117/` | 확인됨(기록 + 사용자 확인) |
| `image/generated/reward-cards/` 10개(성취 카드·썸네일) | GPT 이미지(Codex 내장 이미지 도구), 기존 캐릭터 시트·배경 참고 | 2026-11-18 | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | `docs/CREDITS.md` 「성취 카드」, `_shared/reward-cards` | 확인됨(기록 + 사용자 확인) |
| `image/generated/map-villain-poses-left.webp`(지도 악당 방해 스피커 6칸) | Codex 내장 이미지 도구(`image_gen`) | 2026-11-13 21:07 UTC, Codex 세션 `rollout-2026-11-14T01-22-36-01a1d5b7…`의 `image_gen.generation` `exec-0abc89d6…`(「Create clean game-ready 2D pixel-style sprite animation frames…」, 08~11·16 악당 다시 그리기 묶음) → `_scratch/map-redraw-20261114/raw/11.png` → 시트로 묶음, 커밋 `9eb6f94` | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | 세션 기록, `_scratch/map-redraw-20261114/README.md` | 확인됨(기록 + 사용자 확인) |
| `image/generated/map-hero-reaction.webp`·`map-ally-reaction.webp`(탐험가·삐오 반응 시트) | Codex 내장 이미지 도구(`image_gen`) | 2026-11-13 16:59 UTC, 같은 세션 `rollout-2026-11-14T01-22-36-01a1d5b7…`의 `image_gen` 호출(프롬프트 키 「11」: 「the ponytailed young explorer with chestnut hair… Pio, the bright blue small bird…」, 4열×3행) → 세션의 `sheet()` 스크립트로 두 시트로 나눔, 커밋 `ca0cd4d` | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | 세션 기록 | 확인됨(기록 + 사용자 확인) |
| `image/generated/dialogue/pio.webp`(삐오 대화 초상 2칸) | Codex 내장 이미지 도구(`image_gen`) | 2026-11-12 12:51 UTC, Codex 세션 `rollout-2026-11-12T21-49-36-01a1cfce…`의 `image_gen.generation` `exec-a27b74b5…`(「dialogue portrait spritesheet… 2 columns by 1 row… Pio, a round sky-blue chibi sound bird…」, 참고 `bird-walk.webp`), `_scratch/npc-dialogue-plan-20261112/HANDOFF-5-16.md` 39행, 커밋 `2cdcd5a` | 유료 요금제(생성 기록 + 사용자 확인 2026-11-21) | 세션 기록 | 확인됨(기록 + 사용자 확인) |
| `image/generated/pio-guide.svg` | 코드로 직접 그린 자체 제작 SVG | 2026-10-22 | 자체 제작물 | `docs/CREDITS.md` 「v2.1 추가 자료」 | 확인됨 |

## 영상

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `media/concepts/*.mp4·jpg·vtt` 5편(개념 영상) | 프로젝트 소품·도형으로 Pillow 프레임 구성, FFmpeg 인코딩. 높낮이·전달·배려 편은 생성 그림 반영, 소리는 CC0 녹음 | 2026-10-22 제작, 2026-10-28 재렌더 | 재료 그림(Codex, 사용자 확인)과 CC0 녹음의 조건을 따름 | `docs/CREDITS.md` 「v2.1 추가 자료」, 「최신 추가 자료 · 2026-10-28」 | 확인됨(재료 기준, 자체 렌더) |
| `assets/map-encounters/map-finale.mp4`(지도 파이널) | 자체 렌더: 11번 지도 그림(`ullim-village`) 위에 글자 3줄을 `ffmpeg`로 합성(6초, 페이드) | 2026-11-14, `.tmp/font-later-20261114/render/finale/11.mp4`(배포 파일과 SHA256 같음)·`11.png`·`11-0~2.txt`, Codex 세션 `rollout-2026-11-14T01-22-36-01a1d5b7…`의 렌더 명령 | 재료 그림(Codex, 사용자 확인)과 CC0 녹음의 조건을 따름 | 렌더 결과 폴더·세션 기록 | 확인됨(재료 기준, 자체 렌더) |
| `media/intro/intro-ullim.mp4`·`.jpg`·`.vtt`(인트로 영상, 2026-11-21 추가) | 시작 그림: GPT 이미지(Codex 내장 이미지 도구), 영상: Google Flow Veo 3.1 Quality, 편집·목소리 합성: 로컬 ffmpeg | 2026-11-21, `docs/INTRO-FILM-20261121.md`(프롬프트·Flow 프로젝트 주소·편집 방법), 원본 `.work/film-20261121/` | 유료 요금제(GPT·Google AI Pro, 사용자 확인 2026-11-21 「영상은 제미나이, 모두 유료 요금제」), Flow 워터마크 표시 유지, 목소리는 앱 녹음(ElevenLabs) 그대로 | `docs/INTRO-FILM-20261121.md` | 확인됨(기록 + 사용자 요청 작업) |

## 음악·효과음·실험음

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `media/audio/bgm/main-theme.mp3`, `final-theme.mp3` | Suno(사용자 생성·제공) | 2026-11-17 | Suno Premier 유료 요금제 생성(2026-11-18 사용자 확인) | `docs/CREDITS.md` 도구·라이선스 표, 프롬프트 `_shared/music-prompts-10-16.html`, 원본 `references/suno` | 확인됨(요금제 화면 사본은 없음) |
| `media/audio/sfx/` 23개(악기 효과음·지도 전투음·카드 소리·발걸음) | Freesound CC0 원본을 과학34 공용 라이브러리에서 가공 | 2026-11-17~19 | CC0 1.0 | `media/audio/sfx/sources.json`(파일별 원본·저자·가공·CC0), `docs/CREDITS.md` | 확인됨 |
| `media/audio/experiments/` 5개(북·자·고무줄·소리굽쇠) | Freesound·Wikimedia·VCSL CC0 녹음 가공 | 2026-10-28 | CC0 1.0 | `media/audio/sources.json`, `docs/CREDITS.md` 「최신 추가 자료 · 2026-10-28」 | 확인됨 |
| `media/audio/place_wood.ogg`, `restore_chime.ogg` | VCSL(Versilian Studios) CC0 | 2026-10-28 | CC0 1.0 | `media/audio/sources.json`, VCSL 커밋 `c1ea7bc` 기록 | 확인됨 |
| `media/audio/maximize_008.ogg` | Kenney Interface Sounds 1.0 | 2026-10-22 | CC0 1.0 | `media/audio/License.txt` | 확인됨 |

## 목소리

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `media/audio/voices/el-*.mp3` 139개(삐오·책 읽는 친구·방해 스피커 대사, 개념 해설) | ElevenLabs `eleven_v4`(유료 Creator 요금제) | 2026-11-18 | 유료 요금제 상업 이용 | `docs/VOICE-FILL-20261118.json`(줄별 voiceId·generationId·SHA256), `_shared/voice-provenance-20261118.md`, `docs/CREDITS.md` 「캐릭터 음성 통일」 | 확인됨(요금제 화면 사본은 없음) |

## 글꼴·코드

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `media/fonts/NanumSquareNeoTTF-*.woff2` 3개 | NAVER 나눔스퀘어 네오 공식 배포 | 2026-11-10 | SIL OFL 1.1 | `media/fonts/SOURCE.md`, `media/fonts/NanumSquareNeo-OFL.txt` | 확인됨 |
| `src/vendor/three/three.module.min.js` | three.js r170 | 2026-11-17 | MIT | `src/vendor/three/THREE-LICENSE.txt` | 확인됨 |

## 요약

- **출처 미확인 0줄**(2026-11-21 사용자 확인 뒤, 전 5줄). 2026-11-05 이전 그림(배경 10장, 캐릭터 시트, 로고 원본 029)은 생성 로그가 없어 사용자 확인으로 채웠고, 파생본(시작 화면 배경·로고·공유 썸네일·아이콘)은 원본을 따른다.
- 근거 약함 0줄: 생성 기록이 있던 그림의 빠진 요금제 근거를 사용자 확인 「모두 유료 요금제」로 채웠다.
- 영상 두 줄(개념 영상 5편, 지도 파이널)은 사용자 확인의 「영상은 제미나이」와 다르게 저장소 기록이 **Pillow·FFmpeg 자체 렌더**(지도 파이널은 렌더 결과와 해시 같음)를 가리킨다. 지침대로 저장소 증거를 따랐고, 이 어긋남은 보고한다. 재료 그림이 확인됐으므로 두 줄도 확인됨이다.
- 저장소 기록의 「ChatGPT 생성」(배경·캐릭터·로고 원본)과 사용자 확인의 「Codex(GPT)」는 같은 GPT 이미지 계열로 보고 어긋남으로 세지 않았다.
- 확인됨: 전부(그림·영상·효과음·실험음·배경음·목소리·글꼴·three.js·자체 SVG). 음악·효과음·목소리는 이번 확인 범위가 아니어서 원래 출처 문서대로다.

## 사용자가 줘야 하는 자료

1. (2026-11-21 사용자 확인으로 장부는 채움) 납품 때 붙일 증빙: OpenAI(ChatGPT/Codex) 요금제 화면 사본.
2. (3-2a에서 찾음) 지도 악당·반응 시트·삐오 초상·지도 파이널·시작 화면 배경의 생성·변환 기록은 위 표에 연결했다. 남은 것은 2026-11-05 이전 그림의 근거뿐이다.
3. (납품 증빙) 생성 기간(2026-10~11)의 OpenAI 구독 요금제 화면 사본.
4. ElevenLabs Creator, Suno Premier 요금제 화면 사본(생성 기간 포함).

사용자 확인으로 모든 그림이 장부에 연결되어, 결정(「출처 모르는 옛 그림: 자료가 있으면 장부에 연결, 없으면 새로 만들어 교체」)에 따라 새로 그릴 그림은 없다(`docs/reviews/IMAGE-NEEDS-20261121.md`).
