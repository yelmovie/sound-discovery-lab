# 에셋·교육 내용 출처 기록

갱신일: 2026-11-10. 아래 2026-10-28 기록은 당시 상태를 보존한 것이다. 현재는 로컬 나눔스퀘어 네오와 AI 캐릭터 음성도 배포한다.

## 악기 효과음·지도 전투음 · 2026-11-17

화면 효과음을 악기 음색으로 바꾸고 지도 악당(방해 스피커) 전투음을 연결했다. 파일은 과학34 공용 효과음 라이브러리(`_shared/sfx-library-20261117`, 출처 페이지에서 CC0 재확인)에서 골라 `media/audio/sfx/`에 그대로 복사했다. 파일별 제작자·원본 페이지·가공·SHA256은 `media/audio/sfx/sources.json`. 모두 Freesound의 CC0 녹음이며 일부는 라이브러리에서 저역 통과·메아리를 더한 가공본이다. 재생 음량·속도는 `src/data.js`의 `interfaceSounds`에서 정한다.

| 쓰는 곳 | 파일 | 원본 (모두 CC0) |
|---|---|---|
| 화면 이동 | su-xylophone-02 (실로폰 E4) | juancamiloorjuela, XYLOPHONE E4.wav (freesound 204644) |
| 패널 열기 | su-triangle-01 (트라이앵글) | mark205, ding.wav (580649) |
| 힌트 | su-kalimba-01 (칼림바 C3) | dvdfu, Kalimba C3 (536549) |
| 정답·증거 수집 | su-glockenspiel-01 (글로켄슈필 C7) | sgossner, glock_medium_C7.wav (373366) |
| 그림 표시 누르기 | su-xylophone-01 (실로폰 A3) | juancamiloorjuela, Xylophone A3.wav (204647) |
| 카드 집기 / 칸에 놓기 | su-xylophone-04 (F#6) / su-xylophone-03 (G4) | sgossner (374706) / juancamiloorjuela (204648) |
| 틀린 선택 | su-muffled-02 (막힌 종, 가공) | Khrinx, Thin bell ding 2 (333695) |
| 지도 공격 시작 | su-drum-small-01 (작은북) | TheEndOfACycle, Flat & Fat Snare Drum Hit (673516) |
| 지도 1·2타 명중 | su-battle-hit-02 (종, 2타는 1.19배 속도) | Khrinx, Thin bell ding 2 (333695) |
| 지도 3타 명중 | su-battle-hit-01 (울리는 금속 챙) | HenKonen, Metallic Clank 1.wav (682148) |
| 악당 퇴장 | su-battle-exit-01 (멀어지는 종 메아리, 가공) | Khrinx, Thin bell ding 2 (333695) |
| 악당 등장 | su-speaker-on-01 (스피커 켜짐 딸깍) | cookies+policy, Megaphone OnOff From Mic 2 (556362) |
| 악당에 닿음·3D 달리기 낙하 | su-muffled-01 (막힌 북, 가공) | TheEndOfACycle (673516) |
| 마지막 악당 격퇴 | victory-jingle-02 | Fupicat, WinBrass.wav (521639) |

나무 놓기(`place_wood.ogg`)와 복구 멜로디(`restore_chime.ogg`, VCSL)는 그대로 쓴다. 이전 화면 효과음 `click_003`·`open_001`·`select_003`(Kenney), `sparkle_correct`·`pin_pop`·`swipe_whoosh`·`slot_click`(Freesound)은 지금 재생하지 않지만 출처 기록과 함께 저장소에 남겨 두었다. 실험 소리(북·자·고무줄·소리굽쇠)는 바꾸지 않았다.

## 성취 카드 (지도 악당 격퇴 보상) · 2026-11-18

카드 그림 5장(`image/generated/reward-cards/card-*.webp` 640×960, `thumb-*.webp` 96×144)은 기존 탐험가·삐오 캐릭터 시트와 시설 배경을 참고로 GPT 이미지(Codex 내장 이미지 도구)로 생성해 WebP로 줄였다. 효과음 5개는 과학34 공용 효과음 라이브러리(`_shared/sfx-library-20261117`, 출처 페이지에서 CC0 재확인)에서 `media/audio/sfx/`에 그대로 복사했다(앞뒤 무음 제거·음량 정규화·모노 MP3, 피치·속도 변경 없음). 파일별 가공·SHA256은 `media/audio/sfx/sources.json`. 다른 화면 효과음과 같은 경로로 재생해 전체 음소거·효과음 끄기·탭 숨김을 따르고, 캐릭터 음성이나 실험 소리가 나는 동안에는 울리지 않는다(카드는 악당의 마지막 말이 끝난 뒤에 나온다).

| 쓰는 곳 | 파일 | 원본 (모두 CC0) |
|---|---|---|
| 카드가 날아올 때·보관함으로 들어갈 때 | wind-whoosh-03 | qubodup, Slow Swosh 40 (freesound 60027) |
| 카드 공개(별 1~3개) | reward-01 | ZenithInfinitiveStudios, Fantasy_ui_Button_3.wav (376745) |
| 카드 공개(별 4~5개) | reward-03 | CogFireStudios, Achievement Happy Beeps Jingle (619838) |
| 카드가 보관함 칸에 들어갈 때 | pickup-01 | DeltaCode, item-pickup-v1.wav (678384) |
| 카드 5장 완성 축하 | victory-jingle-01 | el_boss, Game Success Fanfare Short (677858) |

마지막 악당 격퇴 때 울리던 `victory-jingle-02`는 바로 뒤에 오는 카드 소리와 겹치지 않도록 퇴장음(`su-battle-exit-01`)으로 바꿨다. 축하는 카드 5장 완성 징글이 맡고, `victory-jingle-02` 파일과 출처 기록은 그대로 둔다.

카드 연출 코드 `src/reward-cards.js`·`reward-cards.css`는 과학34 공통 모듈(`_shared/reward-cards`)을 그대로 복사한 것이다.

## 캐릭터 음성 통일 · 2026-11-18

- 캐릭터 대사·개념 영상 해설은 모두 ElevenLabs `eleven_v4`(유료 Creator 요금제, 상업 이용 가능)로 만든 MP3를 쓴다. 캐릭터 한 명에 목소리 하나: 울림새 삐오 = Aria, 책 읽는 친구 = sena, 방해 스피커 = Harry, 주민 5명 = 기존 ElevenLabs 목소리. 실제 사람 음성 복제가 아니다.
- 아래 2026-11-10의 Qwen3-TTS 29줄은 더 이상 재생하지 않는다(파일은 보존). 줄별 voiceId·generationId·ASR·음량·SHA256은 `docs/VOICE-FILL-20261118.json`.

## 최신 추가 자료 · 2026-11-10

- 화면 글꼴: NAVER NanumSquareNeo Regular/Bold/ExtraBold WOFF2. 공식 캠페인에서 받은 파일을 이름 변경 없이 배포한다. `media/fonts/NanumSquareNeo-OFL.txt`에 SIL OFL 1.1 전문, `media/fonts/SOURCE.md`에 원본과 공식 도움말 출처를 보존했다.
- 캐릭터 대사: 로컬 Momo의 Qwen3-TTS-12Hz-1.7B-VoiceDesign으로 만든 29개 MP3. 실제 사람의 음성 복제가 아니다. 모델은 Apache-2.0이며, 파일별 대사·선택 후보·seed·SHA256·ASR·음량 값은 `docs/VOICE-PROVENANCE-20261110.json`에 보존했다. 모델 라이선스를 모든 기존 자산의 권리 보증으로 확대 해석하지 않는다.
- 납품 전 실제 스피커를 통한 자연스러움·캐릭터 적합성의 사람 청취 검토는 별도 필요하다. ASR 일치와 브라우저 재생 성공만으로 주관적 음질을 보증하지 않는다.

## 2026-10-28 기록

당시 갱신일: 2026-10-28. 기존 이미지와 합성음에 핵심 개념 생성 그림 13개 및 CC0 공개 녹음을 추가했다. 외부 공개 배포는 수행하지 않았다. 아래 2026-10-22의 제작 기록과 최신 추가 자료를 함께 보존한다.

## 최신 추가 자료 · 2026-10-28

- `image/generated/concepts/`의 WebP 13개: built-in `image_gen`으로 만든 학습용 그림이다. 고무줄 악기·자와 고정장치·공기/물/고체 전달 실험·도서관 소음 현장·해결 도구·소리 상자에 적용했다. 합계 779,412바이트이며 원본 경로·프롬프트·규격·해시는 같은 폴더의 `manifest.json`을 참조한다.
- `media/audio/experiments/`의 북·자·고무줄·소리굽쇠 녹음과 `place_wood.ogg`, `restore_chime.ogg`: 모두 CC0 1.0 공개 녹음에서 가공했다. 합계 79,974바이트이며 파일별 제작자·출처·발췌·가공·해시는 `media/audio/experiments/sources.json`, CC0 전문은 `VCSL-LICENSE.txt`에 있다.
- VCSL: Versilian Studios / Sam Gossner의 [공개 저장소](https://github.com/sgossner/VCSL)에서 Frame Drum·Claves·Kalimba를 선택했다. 원본 커밋은 `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e`이며 [해당 라이선스](https://github.com/sgossner/VCSL/blob/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/LICENSE)를 보존했다. 칼림바 녹음은 C–E–G 보상 편곡에 사용했다.
- 자: alienistcog의 [ruler-twang-long.aif](https://freesound.org/people/alienistcog/sounds/124719/). 고무줄: baidonovan의 [Rubber Band Snap.wav](https://freesound.org/people/baidonovan/sounds/187354/). 각 페이지의 CC0 표시를 확인하고 공개 HQ 미리듣기 파일에서 발췌했다. 로그인으로 제한된 원본은 받지 않았다.
- 소리굽쇠: jmuehlhans의 [Tuning-fork-440Hz.ogg](https://commons.wikimedia.org/wiki/File:Tuning-fork-440Hz.ogg). Wikimedia 파일 페이지의 CC0 표시와 원 출처를 확인했다.
- 현재 Kenney Interface Sounds 음원은 이동·열기·힌트·발견 4종이다. 기존 `drop_001`, `maximize_008`의 현재 적용은 각각 VCSL 나무 타격과 칼림바 복구 편곡으로 바꿨다.
- 개념 영상 5편도 같은 CC0 녹음을 활용해 재렌더했다. 높낮이·전달·배려 영상에는 새 생성 이미지를 반영했다. 16초·960×540·24fps·한국어 자막·무음성 해설 구성을 유지한다.

Pixabay 음원은 포함하지 않았다. CC0 공개 녹음과 가공 음원에는 아래의 프로젝트 자체 제작물 재배포 제한 문구를 적용하지 않는다. 전체 적용 범위와 실제 검증은 [그림·녹음 적용 기록](VISUAL-AUDIO-20261028.md)을 참조한다.

## 도구·라이선스 검토

| 도구·자료 | 쓰는 곳 | 확인된 사항 | 판정·남은 확인 |
|---|---|---|---|
| Node.js·브라우저 내장 API | 서버·빌드·게임 | 외부 npm 의존성·CDN·상용 UI/영상 도구 번들 없음 | 추가 패키지 라이선스 항목 없음 |
| 기존 ChatGPT 생성 이미지 11개 | 장소 배경·캐릭터 참고 | 사용자가 제공한 프로젝트 이미지, 원본 이동 기록은 ASSET_INDEX·asset-move-manifest 참조 | 제공 자료의 생성 당시 계정·요금제·상업 이용 근거는 별도 문서 미제공 |
| 내장 image_gen 생성 PNG 13개 | 지도·보행·실험 소품 | 2026-10-22 생성. 두 manifest에 서비스·프롬프트·원본 경로 기록, 소품은 파일 검증 값 포함 | 생성 당시 서비스 계정·요금제에 대한 별도 계약 증빙은 이 저장소에 없음 |
| Web Audio·CC0 녹음 | 실험음·효과음 | 대체음은 합성, 실험음과 일부 효과음은 위 CC0 녹음 | 파일별 출처·가공 및 라이선스 보존 |
| 배경음 2곡 (Suno 생성) | media/audio/bgm/main-theme.mp3 (첫 탭부터 홈·지도·활동 반복, 실험 소리 중엔 멈춤), media/audio/bgm/final-theme.mp3 (결과·인증서 1회, 지도 파이널 영상 대화상자 동안) | 2026-11-17 사용자가 Suno로 생성해 제공. 프롬프트는 _shared/music-prompts-10-16.html | 원본은 references/suno 보관(git 제외). 상업 이용 근거: 생성 당시 Suno Premier 유료 요금제(2026-11-18 사용자 확인) |
| SVG·Canvas·CSS | 기능 아이콘·파형·지도 효과 | 프로젝트 코드로 작성, 외부 아이콘 팩 없음 | 외부 아이콘 라이선스 대상 없음 |
| 시스템 한글 글꼴 | 화면 텍스트 | 기기의 설치 글꼴을 사용, 폰트 파일 배포 없음 | 외부 폰트 파일 라이선스 대상 없음 |

상업 납품 시 생성 서비스 이용 조건과 제공 자료의 권리 근거를 담당자가 확인할 수 있어야 한다. 이 기록은 미확인 자료에 임의의 재배포·상업 이용 허락을 부여하지 않는다.

## 기존 제공 이미지 — 11개

image/backgrounds/의 017~026 JPEG 10개(2026-10-29 PNG 원본에서 같은 해상도로 변환, 원본은 `_unused/originals-20261029/`)와 image/characters/chatgpt_generated_028_ee0700142c.jpg 1개다. ASSET_INDEX.md에 기록된 사용자가 제공한 ChatGPT 생성 이미지다. 원본은 보존한다. 최신 캐릭터 시트의 갈색 포니테일·청록 의상 탐험가와 파란 울림새를 새 보행 그림의 기준으로 사용했다.

브랜딩·초기 합본·와이어프레임·화면 참고 이미지들은 자료로 보존하되 현재 assets 목록과 빌드에는 포함하지 않는다. 목록은 _unused/DELETE-CANDIDATES.md에 있으며 실제 삭제는 하지 않았다.

## 이번 생성 이미지 — 13개

| 파일 | 용도 | 생성·검증 기록 |
|---|---|---|
| image/generated/ullim-village.jpg | 2.5D 픽셀 RPG 마을 지도 | world-manifest.json |
| image/generated/explorer-walk.png | 탐험가 4방향 × 4프레임 보행 | world-manifest.json |
| image/generated/bird-walk.png | 울림새 4방향 × 4프레임 동행 | world-manifest.json |
| image/generated/core.png, ring.png | 코어·복구 링 기준 소품 | props-manifest.json |
| image/generated/tuning-fork.png, fork-stand.png | 소리굽쇠와 분리 받침대 | props-manifest.json |
| image/generated/drum.png, mallet.png | 북과 분리 북채 | props-manifest.json |
| image/generated/kalimba.png, tine.png | 칼림바 몸통과 분리 음판 | props-manifest.json |
| image/generated/transmitter.png, receiver.png | 전달 실험의 가상 방수 장치 | props-manifest.json |

모든 신규 그림은 AI 생성 학습용 일러스트다. 실제 계측 장비 사진이 아니다. 소품 10개는 투명 배경 PNG이며 생성 결과의 알파를 보존했다. 지도는 불투명 배경, 보행 시트는 투명 배경이다. 정확한 생성 프롬프트와 원본 기록은 manifest, 화면 적용과 3D 전환 기준은 PROP-PROMPTS.md를 참조한다. 현재 실제 3D 모델은 없다.

## 소리·교육 내용

현재 실험음은 위 CC0 녹음을 사용한다. 같은 북의 크기 비교는 같은 파일·같은 재생 속도에서 음량만 바꾸고, 자의 높낮이는 같은 녹음의 상대 재생 속도로 조절한다. 코드의 주파수 제어값·파형·전달 표현은 실제 측정 Hz/dB나 물질별 전달 속도 순위가 아니다. 배경 음악과 녹음 로딩 실패 시의 대체음은 Web Audio 합성이다. 아래 2026-10-22 효과음 목록은 당시 적용 기록이다.

교육 내용은 사용자 확정 시나리오를 바탕으로 진동·소리 크기·높낮이·전달·소음 배려를 20개 활동에 연결했다. 과거 문서의 10장은 기존 활동의 조사 기록이다. 성취기준 [4과07-01]·[4과07-02]·[4과07-03]의 원문은 [경기도교육청 공개 교육과정 PDF](https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202312210923589990.pdf)에서 확인했으며 설정의 교사용 가이드와 PRD에 반영한다. 이는 대상 학생의 현장 학습효과 검증이나 생활 속 실천 평가를 대신하지 않는다.

## 표시 문구의 적용 범위

ⓒ 2026 옐샘 & 아이스크림미디어. All rights reserved.

앱 화면 구성·자체 제작 일러스트·자체 제작 소리 등 프로젝트 제작물의 이용 조건은 납품·제공 플랫폼의 계약과 이용약관을 따른다. 권리 범위를 넘어 제3자 자료의 소유권을 주장하지 않는다.

외부 자료·시스템 글꼴의 저작권은 각 원저작자에게 있으며 각 자료의 이용 조건을 따른다. 외부 폰트 파일은 포함하지 않는다. Kenney·VCSL·Freesound·Wikimedia의 위 CC0 녹음과 가공 음원에는 프로젝트 자체 제작물의 재배포 금지 문구를 적용하지 않는다.


## v2.1 추가 자료 · 2026-10-22

- 효과음: [Kenney · Interface Sounds 1.0](https://kenney.nl/assets/interface-sounds), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). 원본 License.txt와 다운로드 URL은 `media/audio/`에 보존했다. 파일은 수정하지 않고 재생 음량만 코드에서 낮췄다. 앱에서 오프라인으로 재생한다.
- click_003: 이동 / open_001: 패널 열기 / drop_001: 끌어 놓기 / select_003: 힌트 / confirmation_002: 증거 수집 / maximize_008: 영상 종료·도시 복구.
- `media/concepts/`의 5편: 프로젝트 소품과 직접 그린 도형, Windows 시스템 맑은 고딕으로 Pillow에서 프레임을 구성하고 FFmpeg로 H.264/AAC 인코딩. 각 16초·960×540·24fps. 자막·효과음은 자체 제작이며 음성 해설은 없다. 시스템 글꼴 파일은 배포하지 않는다.
- `image/generated/pio-guide.svg`: 코드로 직접 만든 파란 새 삐오 UI 일러스트. 지도에서는 기존 bird-walk.png 동행 애니메이션을 재사용한다.

## 2026-10-30 파생 이미지

| 파일 | 만든 방법 | 원본 |
|---|---|---|
| image/branding/title-logo.png | sips로 1200px 축소 | image/branding/chatgpt_generated_029_00e56966ca.png |
| image/og/ullim-og.jpg | scripts/compose-share-art.swift 합성 | 018 배경 + title-logo + pio-guide.svg |
| image/icons/icon-192.png, icon-512.png | 같은 스크립트 합성 | pio-guide.svg |

새로 생성한 이미지는 없다. 원본의 권리 확인 상태(기존 제공 이미지 상업 이용 근거)는 위 항목을 그대로 따른다.

## 2026-11-17 추가 소리 (모두 CC0 1.0)

Openverse에서 CC0만 걸러 찾고, 각 Freesound 원본 페이지에서 CC0(퍼블릭 도메인)을 다시 확인했다. 모노 44.1 kHz Ogg Vorbis로 바꾸고 앞 무음 제거·음량만 맞췄다. 목록과 원본 주소는 `media/audio/sources-20261117.json`.

- (2026-11-17 밤 제거) 배경 음악 `bgm_ukulele.ogg`(reasanka, short ukulele loop)는 Suno 배경음 2곡으로 바뀌어 실행 파일에서 뺐다.
- 정답 반짝 `sparkle_correct.ogg`: ZenithInfinitiveStudios, [Fantasy_ui_Button_4](https://freesound.org/people/ZenithInfinitiveStudios/sounds/376744/)
- 표시 누르기 `pin_pop.ogg`: MATRIXXX_, [Pop 02](https://freesound.org/people/MATRIXXX_/sounds/506545/)
- 끌기 시작 `swipe_whoosh.ogg`: qubodup, [Swipe Whoosh](https://freesound.org/people/qubodup/sounds/60007/)
- 칸에 놓기 `slot_click.ogg`: benzix2, [UI Button Click](https://freesound.org/people/benzix2/sounds/467951/)

그림: 2026-11-17 GPT 이미지(Codex 내장 이미지 도구)로 새 장면·악기·배지 그림을 만들었다. 프롬프트는 `image/generated/concepts/manifest.json`.

## 2026-11-17 3D 달리기 스테이지

- three.js r170 (MIT, Copyright 2010-2024 Three.js Authors): `src/vendor/three/three.module.min.js`. 라이선스 전문은 같은 폴더의 `THREE-LICENSE.txt`. 구조는 threejs.org `games_fps` 예제를 참고해 새로 썼고 예제의 모델·그림은 쓰지 않았다.
- 그림: GPT 이미지(Codex 내장 이미지 도구)로 만든 무대 그림. 프롬프트와 파일은 `docs/RUN-STAGE-3D-PLAN-20261117.md`의 「구현 결과」에 있다. 탐험가 걷기 그림과 삐오 그림은 기존 생성 그림을 다시 썼다.
