# 에셋·교실 네트워크·미디어 정적 점검

작성일: 2026-10-22. 적용: asset-audit·classroom-ready·media-check. 현재 소스·에셋·빌드와 기존 PRD/TRD/CREDITS·생성 manifest를 읽었다. 코드 변경·에셋 이동·삭제·이미지 생성은 하지 않았다. 이 보고서는 정적 증거만 다루며 브라우저의 실제 20활동 검증은 최종점검 보고서와 합쳐 판단한다.

## 범위와 사실

| 대상 | 정적으로 확인한 사실 | 근거 |
|---|---|---|
| 전체 원본 | image/의 PNG 52개, 82,596,848 bytes | 파일별 stat·SHA-256 조사 |
| 실행 이미지 | PNG 24개, 42,823,417 bytes(40.84MiB) | src/data.js:1~8 |
| 빌드 | 점검 시점 dist 35파일, 43,003,197 bytes | 파일 stat 합계; 빌드 갱신 후 코드 크기는 달라질 수 있음 |
| 누락·중복 | assets 24경로 실제 존재, 이미지52개 SHA-256 동일 중복0 | 대소문자·파일명 목록과 실제 파일 검사 |
| 음원·영상·모델·폰트 파일 | 실행 에셋 목록에는0개. 오디오는 코드 합성 | data.js·audio.js·index.html·CSS·파일 확장자 조사 |
| 참고 이미지 | 미사용 후보28개, 39,773,431 bytes, 실행 assets·빌드에 미포함 | _unused/DELETE-CANDIDATES.md; 동적 data.assets 배열 확인 |
| 기능 UI | DOM/SVG로 버튼·설정·문항 작성, 생성 보행 시트는 애니메이션용 4×4 프레임 | app.js:18~19, map.js:23~55 |
| 외부 로딩 | src·index.html·scripts에서 외부 CDN·API·추적·외부 이미지 로딩 경로 발견 없음 | fetch/XMLHttpRequest/WebSocket/URL·CSS url/@import 정적 검색 |

SVG의 http://www.w3.org/2000/svg는 네임스페이스이고, server의 localhost는 요청 경로 해석용이므로 외부 네트워크 요청으로 세지 않았다. 정적 검색 결과가 런타임 네트워크 로그를 대신하지는 않는다.

## 실행 이미지 목록

모두 PNG다. 날짜·해시·알파·원본 경로의 상세 기록은 기존 이미지의 docs/asset-move-manifest.json 및 신규 image/generated/*-manifest.json을 재사용한다. 아래 24개는 실행 assets 목록과 대조한 실제 byte 값이다.

| 경로(image/ 이하) | bytes |
|---|---:|
| backgrounds/chatgpt_generated_017_53e4619e94.png | 1,975,725 |
| backgrounds/chatgpt_generated_018_99f70fe2eb.png | 1,879,632 |
| backgrounds/chatgpt_generated_019_4e1f52e30a.png | 2,044,841 |
| backgrounds/chatgpt_generated_020_c5bbc97e3d.png | 1,709,187 |
| backgrounds/chatgpt_generated_021_3dc9c418f5.png | 2,302,389 |
| backgrounds/chatgpt_generated_022_13fc18d100.png | 2,319,029 |
| backgrounds/chatgpt_generated_023_890a4c0418.png | 2,067,815 |
| backgrounds/chatgpt_generated_024_d5aa1da920.png | 1,894,212 |
| backgrounds/chatgpt_generated_025_e972cdea3c.png | 1,698,943 |
| backgrounds/chatgpt_generated_026_f04b11de8f.png | 1,841,250 |
| characters/chatgpt_generated_028_ee0700142c.png | 2,526,695 |
| generated/ullim-village.png | 3,865,504 |
| generated/explorer-walk.png | 1,451,800 |
| generated/bird-walk.png | 1,151,254 |
| generated/core.png | 1,336,320 |
| generated/ring.png | 839,498 |
| generated/tuning-fork.png | 1,248,075 |
| generated/fork-stand.png | 1,635,106 |
| generated/drum.png | 1,634,482 |
| generated/mallet.png | 1,284,618 |
| generated/kalimba.png | 1,846,139 |
| generated/tine.png | 1,136,978 |
| generated/transmitter.png | 1,682,452 |
| generated/receiver.png | 1,451,473 |

## 에셋 발견 사항

| ID | 판정 | 증거·영향 | 다음 확인 |
|---|---|---|---|
| AS1 | WARNING | 실행24PNG 중23개가1MB초과, 지도는3.87MB. 작은 화면 소품도 약1.1~1.85MB 원본을 사용한다. 그림을 단순히 보유하는 총량과 초기 다운로드를 구분해야 한다. | 원본을 보존한 채 렌더 크기용 파생 이미지·압축 검토. 픽셀 보행·소품 알파·가독성 비교 필요 |
| AS2 | WARNING | 기존 참조 캐릭터 시트는2.53MB이며 작은 portrait의 CSS 잘라보기에도 전체 파일을 읽는다(style.css:9). | 쓰는 얼굴만 별도 파생해도 되는지 이미지 정체성·알파 검증 후 결정 |
| AS3 | WARNING | image/ 안에 참고28개도 함께 남아 있다. assets 기반 빌드는 제외하지만 프로젝트 전체 압축·폴더 통째 업로드는 약39.77MB를 더 포함한다. | 외부 배포 시 dist만 사용. 원본 삭제하지 않기 |
| AS4 | NOT TESTED | 경로 존재·해시는 검사했지만 이 담당자는 브라우저 네트워크404·pending을 직접 확인하지 않았다. | root 브라우저 검증 결과와 결합 |
| AS5 | WARNING | CREDITS에 기존 제공 이미지의 생성 당시 계정·요금제·상업 이용 증빙 미제공, 신규 AI 생성에도 별도 계약 증빙 없음이 명시돼 있다(CREDITS:7~16). 사용 출처 기록은 있으나 상업 권리 확인을 완료했다고 할 수 없다. | 납품 담당자가 생성 당시 서비스 이용조건·제공자료 권리 근거 확인. 법률 판단·배포 승인으로 해석하지 않기 |

## 교실 네트워크와 저장

로컬 서버는127.0.0.1에만 바인딩한다(server.mjs:24). 같은 PC의 로컬 실행은 인터넷 없이 서버를 켜 두고 사용하도록 설계했다. 이 사실이 학교 AP의30대 접속이나 서버 없이 재실행하는 PWA를 보장하지 않는다.

| ID | 판정 | 증거·영향 | 한계·다음 확인 |
|---|---|---|---|
| CL1 | NOT TESTED | 첫 화면의 실제 transferSize·요청수·cold load는 이 담당자가 측정하지 않았다. | root의 브라우저 실측을 재사용. 추정치를 실측으로 쓰지 않기 |
| CL2 | WARNING | 메인 CSS 배경017+core+portrait 원본만 합치면5,838,740bytes다. 이를 각 학생이 모두 전송받는다고 가정하면30명은175,162,200bytes(약175MB)다. 코드·헤더와 캐시는 이 수치에 제외했다. | 정적 산술이며 실제 첫 화면 전송량·AP 소요시간은 미측정. 전원 전체24이미지 cold download 가정은 약1.285GB이며 첫 화면과 혼동하지 않기 |
| CL3 | WARNING | server.mjs:21은 Cache-Control:no-cache이고 gzip/Brotli 응답 처리가 없다. | 로컬 개발용 정책. 원격 납품 호스트의 압축·캐시 정책은 별도 확인 |
| CL4 | FAIL | PWA 기준: index.html에 manifest 연결·서비스워커 등록·precache가 없으며 현재 서버 허용경로도 index/src/image뿐이다. | 현재 로컬 MVP에서 PWA는 제외된 범위다. 설치·서버중단 후 오프라인 새로고침 가능이라고 표기하면 안 됨 |
| CL5 | NOT TESTED | 실제30대 동시 접속·학교망 차단·연결 끊기·다음 미캐시 시설·재연결을 시험하지 않았다. | 현재127.0.0.1 바인딩으로 다른 태블릿의 원격접속 자체가 제공되지 않음 |
| CL6 | NOT TESTED | 저장은 ullim-city-v1 고유 키, read/write try/catch, 필드와배열 길이 제한이 있다(model.js:3~57). | 실제 저장 차단·할당량·공용 태블릿 교대·offline 저장 검증은 root 테스트와 별도 기기 확인 |
| CL7 | NOT TESTED | 최초 정적 점검에서 초기화 시v1 백업이 남는 경로를 발견했다. root가 초기화의 storage.removeItem 백업 제거와 실패 안내를 추가했다고 보고했다. | 코드 수정으로 조치됨. 새 origin의 실제 초기화 검증은 root 진행 중이며 이 보고서에서 미해결 결함으로 세지 않음 |

CL4는 PWA·설치형 서비스의 기준 결함이다. 현재 로컬 MVP의20활동 플레이 실패를 뜻하지 않으며 이번 점검에서 PWA를 추가하거나 외부 서버를 열지 않았다.

## 영상·소리·성취 연출

영상 파일·video 요소·영상 loader 참조가 없어 인트로/개념/보상 영상의 코덱·해상도·끊김은 **N/A**다. 시작 이야기와 엔딩 다시 보기는 텍스트·게임 화면이다. 오디오는 하나의 SoundEngine에서 합성한다.

| ID | 판정 | 정적 증거 | 실제 확인이 필요한 부분 |
|---|---|---|---|
| ME1 | NOT TESTED | audio.js:1의 BGM 화면은home/map/result만. app.js:52에서 route를 전달한다. lesson/final에 들어가면 syncBgm이 stopBgm을 호출한다. | 화면 전환·뒤로/재진입·새로고침·모달의 실제 BGM 겹침·청음은 이 담당자 미실행 |
| ME2 | NOT TESTED | audio.js:19~28에 bgm/sfx/muted 분리, app.js:14는 bgmVolume/100, 기본25%(model.js:4). 상단 음소거와 설정 토글·슬라이더가 연결됨(app.js:25,59,64,76,81). | 기기 볼륨·스피커·진폭 차이의 실제 인지·화면 이동 후 음소거 지속 |
| ME3 | NOT TESTED | audio.js:11~17은 탭 숨김 시 발음/BGM 정지·context suspend·새 제스처 요구. play/sequence는 이전 노드와generation을 정리한다(:34~85). ready는 resume 실패를 처리한다(:45~53). | 실제 브라우저 자동재생 차단·탭 전환·복귀 후 동작. 기존 tests/audio.test.mjs의 모의 AudioContext 검사와 실제 청음은 구분 |
| ME4 | NOT TESTED | 최종 복구 성공 후 짧은4음 sequence가 연결되고(app.js:88), resultPage에는 인증서·다섯 링·실제 증거수·완료날짜·팀 그림이 있음(:51). | 소리·시각적 성취감·인쇄 렌더는 root 플레이 결과와 결합 |
| ME5 | NOT TESTED | 최초 점검에서 결과 애니메이션 연결을 찾지 못했다. root가 결과 medal·5개ring에0.6초 reveal/stagger를 추가하고 prefers-reduced-motion:no-preference 조건을 적용했다고 보고했다. | 코드 수정으로 조치됨. 실제 최종 렌더는 root가 검증하며 현재 미해결 결함으로 세지 않음 |

## 해석과 남은 확인

정적 근거만으로 실제 네트워크·오디오가 통과했다고 쓰지 않았다. 확실히 남은 항목은 원본 PNG 전송 부담, 상업 권리 확인 근거, 로컬 전용과 PWA/원격 운영의 범위 구분이다. 발견한v1 백업 초기화와 결과 애니메이션은 root가 수정했으며 실제 브라우저 확인은 담당 결과를 따른다. 이번 문서는 점수나 납품 가능 판정을 내리지 않는다. 실제 브라우저·단위 테스트·기기 검증 결과와 합쳐 최종 판단한다.

## 최종 브라우저 확인 보충

root가 별도 빌드 origin에서 초기화 확인·취소 포커스·소리 설정 유지를 확인했어. source에서는 실제20활동과 최종복구·정식인증서·리로드를 확인했고, 결과 CSS의 유한 진입 연출과 모션 감소 조건을 적용했어. v1 백업 삭제는 코드 확인, 이전 기록 백업·이관은 단위 테스트 근거야. 최초 빌드 origin 열기→첫 UI 관측은2,886ms(도구 비용 포함·로컬 무제한 네트워크)였고 학교 와이파이 성능 수치는 아니야. 실제 청음·교실30대·오프라인 재접속은 여전히 미검증이야.
