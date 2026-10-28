# 핵심 개념 그림·녹음 효과음 적용

2026-10-28. 전체 활동의 주요 학습 그림을 보강하고 CC0 공개 녹음을 적용했다.

## 그림

built-in `image_gen`으로 독립 이미지 13개를 제작했다. 원본 구도를 유지하며 화면용 WebP로 인코딩한 합계는 **779,412바이트**다.

| 영역 | 적용 |
|---|---|
| 진동 관찰·부분 찾기 | 고무줄이 실제로 걸린 나무 상자 악기, 자와 고정장치 |
| 크기 순서 정렬 | 모든 상자에 동일한 그림을 사용해 외형으로 정답을 알 수 없게 구성 |
| 길이·멜로디·높낮이 | 같은 자와 고정장치 이미지를 재사용하고 돌출 길이만 변경 |
| 전달·감지기 | 공기 속 북과 듣는 사람, 물속 종과 방수 감지기, 같은 탁자에 접촉한 타격점과 감지기 |
| 소음 진단·해결·축제 | 도서관과 복도 북 연습, 북 아래 패드, 의자 펠트 패드, 음량 손잡이 스피커, 시계, 교실에서 떨어진 연습 장소 |
| 마지막 복구·인증서 | 각 원리의 소품 썸네일 재사용 |

이미지 위치는 `image/generated/concepts/`이며 원본 경로·프롬프트·규격·해시는 같은 폴더의 `manifest.json`에 기록한다. 화면 연결은 `src/illustrations.js`, `src/illustrations.css`에서 관리한다. 파형·조작·정답·감지기 위치·글자는 코드로 제어한다. 높낮이·전달·배려 영상에도 같은 생성 이미지를 적용했다.

## CC0 녹음

Pixabay의 무료 이용 조건과 CC0 공개 자료를 검토한 뒤 아래 CC0 녹음을 선택했다. Pixabay 음원은 포함하지 않았다. Freesound는 음원 페이지에 공개된 HQ 미리듣기를 사용했으며 로그인으로 제한된 원본은 다운로드하지 않았다.

| 파일·용도 | 제작자와 출처 | 가공 |
|---|---|---|
| `experiments/drum.ogg` · 북 | Versilian Studios / Sam Gossner, [VCSL](https://github.com/sgossner/VCSL), Frame Drum | 같은 녹음에서 gain만 변경 |
| `experiments/ruler.ogg` · 자 | alienistcog, [ruler-twang-long.aif](https://freesound.org/people/alienistcog/sounds/124719/) | 첫 독립 타격 발췌, 상대 재생 속도로 높낮이 조절 |
| `experiments/rubber.ogg` · 고무줄 | baidonovan, [Rubber Band Snap.wav](https://freesound.org/people/baidonovan/sounds/187354/) | 앞의 손질 소리를 잘라 짧은 타격 발췌 |
| `experiments/fork.ogg` · 소리굽쇠 | jmuehlhans, [Tuning-fork-440Hz.ogg](https://commons.wikimedia.org/wiki/File:Tuning-fork-440Hz.ogg) | 실제 440Hz 녹음 발췌, 모형의 요청 주파수에 맞춰 재생 |
| `place_wood.ogg` · 배치·고체 타격 | Versilian Studios / Sam Gossner, VCSL Claves | 짧은 나무 타격으로 정리 |
| `restore_chime.ogg` · 복구 | Versilian Studios / Sam Gossner, VCSL Kalimba | A4 녹음에서 C–E–G로 구성한 짧은 보상 편곡 |

파일 경로는 `media/audio/` 기준이다. 새 음원 6개의 합계는 **79,974바이트**다. 각 파일의 출처·가공·해시는 `media/audio/experiments/sources.json`, CC0 전문은 같은 폴더의 `VCSL-LICENSE.txt`에 보존했다. VCSL 원본은 커밋 `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e`에 고정했다. [VCSL 라이선스](https://github.com/sgossner/VCSL/blob/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/LICENSE), Freesound 각 페이지와 Wikimedia 파일 페이지에서 CC0를 확인했다.

기존 이동·열기·힌트·발견 효과음 4종은 Kenney Interface Sounds의 CC0 음원을 사용한다. CC0 녹음과 가공 음원에는 앱 자체 제작물의 재배포 제한 문구를 적용하지 않는다.

## 재생·학습 조건

- 녹음은 로컬에서 읽고 디코딩한 버퍼를 재사용한다. 실행 중 외부 음원 사이트에 접속하지 않는다.
- 북의 크기 비교는 같은 파일·같은 재생 속도에서 음량만 바꾼다. 자는 같은 녹음의 상대 재생 속도를 조절한다. 코드의 주파수 제어값과 파형은 실제 측정 Hz/dB가 아니다.
- 전달은 서로 독립된 세 실험이다. 물질별 실제 속도·음량의 우열을 표현하지 않는다.
- 재생 교체·화면 이탈·음소거·탭 숨김 뒤 늦은 다운로드가 재생되지 않게 검사한다. 파일을 읽지 못하면 기존 합성음으로 활동을 계속한다.
- 실험 중 배경 음악을 멈추며, 효과음과 배경 음악 설정을 따로 적용한다.
- 개념 영상 5편도 녹음 기반 비교음으로 재렌더했다. 각 16초·960×540·24fps와 한국어 자막을 유지했다.

## 확인한 결과

- 구문 검사·자동 테스트 **61개**·프로덕션 빌드 통과. 빌드 참조 에셋은 69개다.
- 녹음 버퍼 재사용, 북의 gain/재생 속도 분리, 자의 재생 속도, 지연 응답 취소, 멜로디 정리, 누락 파일 대체 재생 회귀 검사를 포함했다.
- 1024×768·1280×720·1920×1080의 활동 시작 **60화면**에서 이미지 누락·잘린 조작·패널 스크롤·가로 이탈·브라우저 오류·실패 요청이 없었다. `.work/art-qa/report.json`에 기록했다.
- 새 브라우저의 정상 경로로 **20활동·복구 영상 5편·마지막 5문항·정식 인증서**를 완료하고 새로고침 후 증거 20개와 완료 상태를 확인했다. 시작·완료 **80화면**에 잘린 조작이 없었고 브라우저 오류·실패 요청도 없었다. `.work/play-flow/report.json`에 기록했다.

위 결과는 데스크톱 브라우저 검사다. 실제 스피커의 청감, 물리 태블릿·전자칠판과 교실 환경은 별도 확인 대상이다. 외부 배포는 수행하지 않았다.
