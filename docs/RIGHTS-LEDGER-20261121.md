# 권리 장부 · 울림도시 대작전 (11 sound)

2026-11-21 조사. 대상은 운영 빌드(앱 `bf402c8`, Workers `66a4456f`)에 실제로 들어가는 그림·영상·음악·효과음·목소리·글꼴이다(빌드는 `src/data.js`의 `assets` 목록 288개만 싣는다). 근거는 저장소 안 기록과 `_shared` 문서에서만 찾았고, 추측으로 채우지 않았다.

상태: **확인됨** = 출처·이용 조건·기록 파일이 모두 있음 / **근거 약함** = 만든 곳은 기록에 있으나 계약·요금제·프롬프트 같은 증빙이 저장소에 없음 / **출처 미확인** = 만든 곳이나 이용 조건을 기록에서 찾지 못함.

## 그림

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `image/backgrounds/chatgpt_generated_017~026_*.jpg` 10장(장소 배경) | 사용자가 제공한 ChatGPT 생성 그림 | 제공 시점 미기록, 2026-10-29 PNG→JPEG 변환 | 생성 당시 계정·요금제·상업 이용 근거 문서 없음 | `docs/CREDITS.md` 「기존 제공 이미지 — 11개」, `docs/ASSET_INDEX.md`, `docs/asset-move-manifest.json` | **출처 미확인** |
| `image/characters/chatgpt_generated_028_ee0700142c.jpg`(캐릭터 참고) | 사용자가 제공한 ChatGPT 생성 그림 | 위와 같음 | 위와 같음 | 같은 기록 | **출처 미확인** |
| `image/branding/title-logo.webp`(제목 로고) | 사용자 제공 `chatgpt_generated_029` PNG를 줄여 만든 파생본 | 2026-10-30 파생, 2026-11-14 최적화(`eeabaab`) | 원본(029)의 상업 이용 근거 없음 | `docs/CREDITS.md` 「2026-10-30 파생 이미지」 | **출처 미확인** |
| `image/backgrounds/title-city.webp`(시작 화면 배경) | 기록 없음 | 2026-11-14 커밋 `eeabaab`(「Optimize sound city title logo and background」) | 기록 없음 | 커밋 메시지뿐 | **출처 미확인** |
| `image/og/ullim-og.jpg`, `image/icons/icon-192·512.png` | 저장소 스크립트 `scripts/compose-share-art.swift`로 합성 | 2026-10-30 | 재료가 018 배경(출처 미확인)·title-logo(출처 미확인)·`pio-guide.svg`(자체 제작) | `docs/CREDITS.md` 「2026-10-30 파생 이미지」 | **출처 미확인**(재료 탓) |
| `image/generated/ullim-village.webp`(지도), `explorer-walk-lite.webp`·`bird-walk-lite.webp`(걷기 시트, 2026-11-21 손실 WebP 사본) | 내장 image_gen(OpenAI 이미지 생성) | 2026-10-22 생성 | 서비스 이용약관(계정·요금제 증빙은 저장소에 없음) | `image/generated/world-manifest.json`(서비스·프롬프트·원본 경로), `docs/CREDITS.md` 「이번 생성 이미지 — 13개」 | **근거 약함** |
| `image/generated/core·ring·tuning-fork·fork-stand·drum·mallet·kalimba·tine·transmitter·receiver.png` 10장(실험 소품) | 내장 image_gen | 2026-10-22 생성 | 위와 같음 | `image/generated/props-manifest.json`(프롬프트·검증 값) | **근거 약함** |
| `image/generated/concepts/` 36개(개념·장면·악기·배지 그림) | 2026-10-28 내장 image_gen 13개 + 2026-11-17 GPT 이미지(Codex 내장 이미지 도구) | 2026-10-28, 2026-11-17 | OpenAI 이용약관(사용자 ChatGPT 구독) | `image/generated/concepts/manifest.json`(프롬프트), `docs/CREDITS.md` | **근거 약함**(요금제 화면 증빙 없음) |
| `image/generated/run-stage/` 13개(3D 달리기 무대) | GPT 이미지(Codex 내장 이미지 도구) | 2026-11-17 | 위와 같음 | `docs/RUN-STAGE-3D-PLAN-20261117.md` 「구현 결과」(프롬프트·파일), 원본 `.work/run-stage-20261117/` | **근거 약함** |
| `image/generated/reward-cards/` 10개(성취 카드·썸네일) | GPT 이미지(Codex 내장 이미지 도구), 기존 캐릭터 시트·배경 참고 | 2026-11-18 | 위와 같음 | `docs/CREDITS.md` 「성취 카드」, `_shared/reward-cards` | **근거 약함** |
| `image/generated/map-villain-poses-left.webp`(지도 악당), `map-hero-reaction.webp`·`map-ally-reaction.webp`(반응 시트) | 생성 그림으로 기록(도구 이름 없음) | 2026-11-14 커밋 `9eb6f94`·`ca0cd4d`, 계획 `_shared/MAP-VILLAINS-HANDOFF-20261114.md` 「기존 원본을 참고해 투명 배경으로 생성」 | 도구·이용 조건 기록 없음 | 위 문서·커밋 | **출처 미확인** |
| `image/generated/dialogue/pio.webp`(삐오 대화 초상) | 기록 없음(참고 그림으로만 언급) | 2026-11-13 커밋 `2cdcd5a` | 기록 없음 | `docs/RUN-STAGE-3D-PLAN-20261117.md` 75줄(참고 그림 목록) | **출처 미확인** |
| `image/generated/pio-guide.svg` | 코드로 직접 그린 자체 제작 SVG | 2026-10-22 | 자체 제작물 | `docs/CREDITS.md` 「v2.1 추가 자료」 | 확인됨 |

## 영상

| 파일(묶음) | 만든 곳 | 만든 날·기록 위치 | 이용 조건 | 근거 파일 | 상태 |
|---|---|---|---|---|---|
| `media/concepts/*.mp4·jpg·vtt` 5편(개념 영상) | 프로젝트 소품·도형으로 Pillow 프레임 구성, FFmpeg 인코딩. 높낮이·전달·배려 편은 생성 그림 반영, 소리는 CC0 녹음 | 2026-10-22 제작, 2026-10-28 재렌더 | 재료 그림·녹음의 조건을 따름 | `docs/CREDITS.md` 「v2.1 추가 자료」, 「최신 추가 자료 · 2026-10-28」 | **근거 약함**(재료 그림의 요금제 증빙 없음) |
| `assets/map-encounters/map-finale.mp4`(지도 파이널) | 기록 없음 | 2026-11-14 커밋 `5e274ce`·`af2d876` | 기록 없음 | 커밋 메시지뿐 | **출처 미확인** |

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

- 출처 미확인 **8줄**: 장소 배경 10장, 캐릭터 참고 1장, 제목 로고, 시작 화면 배경, 공유 썸네일·아이콘(재료 탓), 지도 악당·반응 시트, 삐오 대화 초상, 지도 파이널 영상.
- 근거 약함 6줄: 생성 그림(지도·걷기, 소품, 개념, 3D 무대, 성취 카드)과 개념 영상. 만든 곳·프롬프트 기록은 있으나 생성 당시 계정·요금제 증빙이 저장소에 없다.
- 확인됨 9줄: 효과음·실험음·배경음·목소리·글꼴·three.js·자체 SVG.

## 사용자가 줘야 하는 자료

1. 기존 제공 ChatGPT 그림(배경 017~026, 캐릭터 028, 로고 원본 029)을 만든 계정·요금제와 상업 이용 근거(요금제 화면, 결제 메일, 또는 업체가 제공했다면 계약·메일).
2. `title-city.webp`, `map-villain-poses-left.webp`, `map-hero/ally-reaction.webp`, `dialogue/pio.webp`, `map-finale.mp4`를 만든 도구와 날짜(생성 기록, 대화 내보내기, 또는 다른 세션 기록 위치).
3. 생성 그림에 쓴 OpenAI(ChatGPT/Codex) 구독 요금제 화면 사본(2026-10~11 사용 기간).
4. ElevenLabs Creator, Suno Premier 요금제 화면 사본(생성 기간 포함).

자료가 없는 그림은 결정(「출처 모르는 옛 그림: 자료가 있으면 장부에 연결, 없으면 새로 만들어 교체」)에 따라 3-3단계에서 새로 만들어 바꾼다. 목록은 `docs/reviews/IMAGE-NEEDS-20261121.md`.
