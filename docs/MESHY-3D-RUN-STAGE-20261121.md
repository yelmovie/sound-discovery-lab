# 3D 달리기 Meshy 모형 적용 · 2026-11-21

공통 지침 `_shared/MESHY-3D-UPGRADE-20261121.md`의 11번 줄. 기준 사례는 9번(`7cf5562`).

## 범위

- 바꾸는 것: 높낮이 잠금문·울림 징검다리 도착점의 **문틀(움직이지 않는 아치)**, 울림 징검다리의 **북 모양 징검돌 몸통(원기둥)**.
- 그대로 두는 것: 열리는 문짝 두 장(`gate-door` 그림), 구간마다 켜지는 램프, 북 윗면 가죽과 떨림 고리(떨림 표시), 발판·충돌·판정(`run-stage-rules.js`, `runChallenge`), 글자 표지.

## 성공 조건

- 두 스테이지에서 GLB 아치가 그림 아치 자리(너비 4 m, 발 높이 그대로)에 서고, 문짝이 그 안에서 열리며, 램프가 아치 띠 앞에 보인다.
- 울림 징검다리 북 10개가 GLB 몸통으로 바뀌고, 윗면은 지금처럼 코드로 그린 가죽·고리가 떨린다.
- GLB를 못 불러오면(네트워크 차단, 파일 없음) 지금의 원기둥·그림 아치로 그대로 진행한다. 불러오는 동안에도 게임은 진행된다.
- 추가 다운로드 3 MB 이내, 보이는 삼각형 3만 이하.

## 구현

- `src/vendor/three/`에 three r170(`three.module.min.js`와 같은 버전)의 `GLTFLoader.js`·`BufferGeometryUtils.js`·`meshopt_decoder.module.js`를 그대로 복사했다(가져오는 경로만 `./three.module.min.js`로). 새 dependency 없음.
- `src/data.js` `runStageModels` → 빌드 복사·오프라인 미리 저장(`scripts/build.mjs`)에 포함. 파일은 `media/models/run-stage/*.glb`.
- `src/run-stage.js` `model()`: 필요할 때만 로더를 불러와 GLB를 읽고, 바닥 가운데를 원점에 맞춘다(gltfpack 양자화 scale은 안쪽 노드에 남겨 둠). 아치는 너비 4 m로 맞추고 그림 아치·상자 틀을 숨긴다. 북은 돌마다 반지름 1 m·높이 0.8 m 몸통으로 맞추고 원기둥을 숨긴다. 장면을 떠날 때 geometry·material·texture를 dispose.
- `scripts/qa-run-stage.mjs`: 모형이 실제로 불러와졌는지(`runProbe().models`), GLB를 막았을 때 대체 화면으로 진행되는지 확인 항목을 더했다.

## 결과

- 생성: 문틀 작업 01a1fd8f-ffcc-728b-b5a7-b1dda6340412(30크레딧, 입력은 기존 gate-arch 그림), 북 작업 01a1fd98-2a75-7632-8295-c78feada0aff(30크레딧, 입력은 gpt-imagegen으로 만든 장난감 북). 기록은 `references/meshy-20261121/README.md`.
- 실행본: `media/models/run-stage/gate-arch.glb` 530,028B·8,080면, `drum.glb` 489,812B·2,914면. 추가 다운로드는 GLB 1.02MB + 로더 167KB. 북 10개와 문틀이 모두 화면 안에 있으면 최대 약 3.7만 면이야(목표 3만보다 조금 많음). 안개로 먼 북은 작게 보이고, 문틀은 마지막 구간에서만 크게 보여.
- 확인: `npm run check`, `npm test`, `npm run build` 통과. 빌드본을 `scripts/qa-run-stage.mjs`로 돌려 21항목 통과(두 스테이지 키보드·화면 버튼 끝까지, 문틀·북 10개 불러옴, GLB를 막으면 원기둥·그림 아치로 진행, WebGL 없음, 교사 시연). 스크린숏 `.tmp/run-stage-20261117/meshy-local/`에서 문짝이 문틀 안에서 열리고 램프가 기둥 위에 켜지는 것을 봤어.
