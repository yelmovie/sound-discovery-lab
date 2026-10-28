# 소리 과학 소품 생성 프롬프트

2026-10-22 · 기본 내장 `image_gen.imagegen` 사용 · 소품 1개당 개별 생성 1회 · 10개 PNG.

최종 파일은 `image/generated/`에 저장했고, 생성된 알파 채널을 그대로 보존했어. 파일별 실제 크기·바이트·SHA-256·생성 원본 경로·검증 값은 `image/generated/props-manifest.json`에 있어. `src/data.js`의 `props`가 이미지 교체 지점이야. 아래 원문 프롬프트 뒤에 화면별 적용 계획과 향후 3D 모델 전환 기준을 정리했어.

## 공통 프롬프트

각 요청은 아래 공통 프롬프트에 해당 소품의 `Subject` 문장을 줄바꿈으로 붙인 정확한 내용이야. 도구 인자는 모든 요청에서 `transparent_background: true`였어.

```text
Use case: scientific-educational. Asset type: one reusable transparent game prop for an elementary sound-science game. Style: cozy polished illustrated 3D-shaped science toy, restrained cyan, deep navy and cream palette with orange accents where appropriate, clean material detail, soft studio shading on the object. Orthographic three-quarter view. One complete object centered, generous transparent padding, crisp readable silhouette at small size. Genuine transparent alpha background. No text, letters, numbers, logo, UI, environment, ground plane, detached parts, particles, waves, emitted light, motion effects, or cast shadow. Do not crop any part.
```

## 01 · core

파일: `image/generated/core.png`

```text
Subject: a compact tabletop science core device, a smooth cream and deep navy spherical housing held on one short sturdy pedestal. Five small empty circular mechanical ring ports distributed visibly around the housing. The five ports are empty; there are NO actual rings. Subtle cyan inset mechanical seams only, no emission. Complete standalone core plus pedestal as a single joined object.
```

확인: Cream/navy spherical housing on pedestal; five visibly empty ports; no detachable rings or emission.

## 02 · ring

파일: `image/generated/ring.png`

```text
Subject: one separate circular mechanical ring, upright like a coin seen at a three-quarter angle, deep navy outer casing and cream trim, restrained cyan inset band, and one small mounting tab at the bottom. The circular center is completely open and transparent. A single simple continuous ring only, no device core or stand.
```

확인: One continuous circular ring, transparent open center and one bottom mounting tab.

## 03 · tuning-fork

파일: `image/generated/tuning-fork.png`

```text
Subject: one physically correct silver tuning fork, TWO straight parallel silver metal prongs of equal length with gently rounded tips, joined by a curved U-shaped bottom, and ONE simple straight centered handle extending from the bottom of the U. Clearly visible large open space between the two prongs. Upright, complete tuning fork only. No stand, no mallet, no extra prongs, no sound waves.
```

확인: Two parallel equal-length silver prongs, U-shaped join and one centered handle; no stand.

## 04 · fork-stand

파일: `image/generated/fork-stand.png`

```text
Subject: one small warm natural wood rectangular tabletop stand for a tuning fork. A single empty centered socket drilled into its top, clearly visible from a slightly elevated three-quarter view. The slot is empty and dark inside. Softly rounded rectangular edges, solid simple wooden block. No tuning fork, no other object, no shadow underneath.
```

확인: One wooden block with empty top socket; no attached fork.

## 05 · drum

파일: `image/generated/drum.png`

```text
Subject: one upright short cylindrical hand drum. Reddish natural wooden shell, a single taut cream top membrane with visible rounded rim, a deep navy bottom rim, and restrained silver hardware connecting the rims. Slightly elevated three-quarter view clearly shows the entire cream drum membrane. No mallet, no hands, no stand, no vibration lines.
```

확인: Wooden cylindrical shell, cream upper membrane and metal hardware; no mallet.

## 06 · mallet

파일: `image/generated/mallet.png`

```text
Subject: one single wooden percussion mallet. Smooth slender natural wood straight handle and one soft orange felt spherical head attached at the end. Full mallet from rounded wood handle end to full orange felt ball, diagonal composition, no drum, no second mallet, no ribbon, no other object.
```

확인: One wooden handle and one orange felt head; no second mallet.

## 07 · kalimba

파일: `image/generated/kalimba.png`

```text
Subject: one warm natural wood kalimba BODY ONLY, a compact rounded rectangular wooden sound box with a round soundhole near the lower front and one silver metal bridge across the upper front. NO metal tines, NO keys, NO rods attached; the bridge is empty because individual tines are separate sprites. Clearly readable front face in an orthographic slightly elevated three-quarter view. Smooth wood grain, no branding.
```

확인: Wooden sound box and empty silver bridge; no tines attached.

## 08 · tine

파일: `image/generated/tine.png`

```text
Subject: one single uniform thin flat silver metal kalimba tine. A plain narrow straight rectangular strip of constant width with a gently rounded playing tip at one end and a simple squared opposite end. It must be visibly FLAT like a narrow metal ruler, NOT a cylindrical rod, and have no holes, labels, brackets or ornament. Vertical composition, very shallow three-quarter angle shows its flat face and thin metal edge.
```

확인: One flat silver strip of constant width with rounded playing tip.

## 09 · transmitter

파일: `image/generated/transmitter.png`

```text
Subject: one fictional waterproof sound-science transmitter device. A compact deep navy and cream rounded box, a single circular ORANGE emitter face on the front and one small blank status window. Closed watertight casing, softly rounded corners, modest silver screws. No antenna, no screen text, no cable, no handle, no sound waves, no water, no glow. Complete standalone device.
```

확인: Navy/cream box with one orange emitter and one blank status window.

## 10 · receiver

파일: `image/generated/receiver.png`

```text
Subject: one fictional waterproof sound-science receiver device matching a compact deep navy and cream rounded box family. Cream main casing with deep navy accents. A single circular CYAN sensor on the front and one separate small circular unlit indicator. Closed watertight casing, softly rounded corners, modest silver screws. No antenna, no screen text, no cable, no handle, no sound waves, no water, no glow. Complete standalone device.
```

확인: Cream/navy box with one cyan sensor and separate small circular indicator.


## 화면 적용과 3D 전환 목록

이번 버전은 생성 PNG를 2D 화면에 적용하는 단계야. 다음 표의 3D는 이후 모델 제작 후보이며 이번에 실제 모델을 생성했다는 뜻은 아니야. 스테이지 선택 지도만 2.5D 픽셀 RPG, 시설 내부는 2D라는 원칙을 유지해. 3D 소품을 넣더라도 시설 전체를 자유 카메라 공간으로 바꾸지 않아.

| 우선 | 기본 이미지 | 표시·조작 위치 | 모델을 나눌 부분 | 학습상 필요한 움직임 |
|---|---|---|---|---|
| 1 | core.png + ring.png | 메인·시설 복구·최종 코어 | 코어 몸체, 링 5개 | 완료된 시설의 링만 장착·회전, 미완료 링은 채우지 않기 |
| 1 | tuning-fork.png + fork-stand.png | 진동 관찰·멈추기·리듬 의뢰 | 소리굽쇠와 받침대 | 위쪽 두 갈래의 미세한 떨림, 눌렀을 때 멈춤 |
| 1 | drum.png + mallet.png | 크기 관찰·신호 의뢰 | 북 몸체·막, 북채 | 같은 북에서 힘에 따라 막 진폭만 변경 |
| 1 | transmitter.png + receiver.png | 전달 관찰·감지기 배치 | 송신기와 수신기 | 물질에 맞춰 수신기 위치 이동, 도착 표시 |
| 2 | kalimba.png + tine.png | 높낮이·크기 분리 조절 | 몸통·음판 | 떨리는 음판 길이와 진폭을 별도로 변경 |

칼림바는 소리 주문 장치의 시각 소품이야. 실제 학습에서 길이 비교의 조작·음높이 기준은 같은 자의 떨리는 부분이며, 재질이나 두께가 다른 악기 사이의 일반 법칙으로 과도하게 확대하지 않아.

## 3D 변환 공통 프롬프트

아래 공통 문장에 표의 소품별 문장을 붙이고 해당 PNG를 정체성·색·형태 참고로 사용해. 기존 PNG를 다시 생성할 프롬프트가 아니라 추후 3D 생성 도구에 전달할 명세야.

```text
Create one production-ready low-poly 3D game prop matching the supplied reference image. Preserve its exact silhouette, proportions, cream/deep-navy/cyan palette, material identity and child-friendly science-toy style. One complete object at real tabletop scale, clean topology, efficient geometry, UV mapped, PBR base color/roughness/metallic textures. No baked background, environment, UI, text, logo, water, sound waves, particles, emitted glow or cast shadow. Keep educational moving components as separately named meshes with useful pivots. Center the object on the ground plane, keep its front facing forward, and export glTF/GLB with named materials. Supply one neutral three-quarter preview matching the reference and front/side/back views. Do not invent additional parts.
```

| 모델 | 붙일 프롬프트 |
|---|---|
| 코어 | Match core.png. A joined spherical housing and short pedestal with five EMPTY ring ports. Name the static mesh CoreBody. Keep all five ports empty; the ring is a separate asset. Pivot at base center. |
| 링 | Match ring.png. One continuous upright mechanical ring with a genuinely open center and one bottom mounting tab. Name the mesh CoreRing. Pivot at ring center so it can rotate without orbiting. No core or stand. |
| 소리굽쇠 | Match tuning-fork.png. Exactly two equal parallel prongs connected by one U-shaped bend and one centered handle. Name the mesh TuningFork and retain physical continuity at the bend. Mark prong regions for subtle vertex deformation; never add more prongs. Pivot at bottom of handle. |
| 받침대 | Match fork-stand.png. One wooden block with one empty top socket. Name the mesh ForkStand. Pivot at base center. Do not attach a tuning fork. |
| 북 | Match drum.png. A short wooden cylindrical shell with one taut cream top membrane. Name separate meshes DrumShell and DrumMembrane. Preserve the membrane rim and allow very small membrane deformation. No mallet. |
| 북채 | Match mallet.png. One wood handle and one orange felt spherical head. Name meshes MalletHandle and MalletHead. Pivot at handle end for a short tapping arc. No drum. |
| 칼림바 몸통 | Match kalimba.png. One warm wooden sound box, lower sound hole and empty silver bridge. Name meshes KalimbaBody and KalimbaBridge. No attached tines. |
| 음판 | Match tine.png. One thin FLAT constant-width silver strip with a gently rounded playing end. Name the mesh KalimbaTine. Pivot at the clamped squared end for length/vibration illustration. No cylindrical rod, holes or markings. |
| 송신기 | Match transmitter.png. A compact waterproof cream/navy case, one orange emitter face and one blank status window. Name meshes TransmitterCase and TransmitterEmitter. Pivot at base center. No antenna, cable, sound waves or text. |
| 수신기 | Match receiver.png. Matching compact waterproof cream/navy case, one cyan sensor and a separate unlit round indicator. Name meshes ReceiverCase, ReceiverSensor and ReceiverIndicator. Pivot at base center. No antenna, cable, glow or text. |

3D 자산을 연결할 때도 물체 상태·진폭·길이·물질 선택은 기존 활동 상태를 사용해. 모델이 정답·증거·완료를 따로 판단하지 않게 하고, 로딩 실패 시 현재 PNG를 대체 표시로 남겨 둬. 먼저 한 소품으로 태블릿 성능과 조작 가독성을 확인한 다음 나머지를 교체해.

## 지도·보행 기본 그림

지도와 캐릭터의 정확한 생성 프롬프트는 image/generated/world-manifest.json에 있어.

- ullim-village.png: 다섯 시설과 중앙 코어, 넓은 모래길, 숲과 물길이 있는 글자 없는 2.5D 픽셀 마을. 길 그래프·빛·버튼은 앱이 별도 표시해.
- explorer-walk.png: 최신 갈색 포니테일·청록 의상 탐험가, 4방향×4보행 프레임.
- bird-walk.png: 파란 몸·크림 배·주황 부리와 발·청록 깃의 울림새, 4방향×4프레임.

현재 지도는 3D 전환 우선 대상이 아니야. 픽셀 RPG의 일관성과 길 찾기 가독성을 유지하고, 시설 안 소품부터 교체하는 계획이야.

## 별도 캔버스 상태

기존 별도 캔버스: https://chatgpt.com/space/page_e5c729a999bc8191a58096624d8e5603

이 문서와 두 생성 manifest가 이번 재개 작업의 최신 로컬 기준이야. 2026-10-22에 기존 캔버스를 읽고 20활동 구성과 생성 완료 지도·보행·소품 상태를 갱신했어. 세부 피벗·분리 모델 기준은 이 로컬 문서가 최신이야.
