# 에셋·교육 내용 출처 기록

갱신일: 2026-10-28. 기존 이미지와 합성음에 핵심 개념 생성 그림 13개 및 CC0 공개 녹음을 추가했다. 외부 공개 배포는 수행하지 않았다. 아래 2026-10-22의 제작 기록과 최신 추가 자료를 함께 보존한다.

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
| Web Audio·CC0 녹음 | 배경 음악·실험음·효과음 | 배경 음악과 대체음은 합성, 실험음과 일부 효과음은 위 CC0 녹음 | 파일별 출처·가공 및 라이선스 보존 |
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
