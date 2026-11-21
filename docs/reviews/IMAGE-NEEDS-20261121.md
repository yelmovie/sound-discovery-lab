# 필요한 그림 목록 · 울림도시 대작전 (11 sound) · 2026-11-21

새 그림이 필요한 자리만 적었다. 그림은 이번에 만들지 않았다. 결정(2026-11-21 「추천대로」): 출처 모르는 옛 그림은 자료가 있으면 장부에 연결하고, 없으면 3-3단계에서 새로 만들어 바꾼다. 근거는 `docs/RIGHTS-LEDGER-20261121.md`.

화풍을 맞출 참고 그림(모두 출처 기록이 있는 생성 그림): `image/generated/ullim-village.webp`(지도), `image/generated/explorer-walk-lite.webp`(탐험가), `image/generated/concepts/pio-fly.webp`(삐오), `image/generated/reward-cards/card-1-0.webp`(카드 화풍), `image/generated/run-stage/`(무대).

## (가) 권리 장부에서 출처 미확인인 그림 — 17장 + 영상 1편

| 쓰이는 화면 | 지금 파일 | 필요한 크기·비율 | 화풍 참고 | 왜 필요한가 |
|---|---|---|---|---|
| 활동 화면 배경(진동 연구소·볼륨 경기장·조율 공방·전달 네트워크·소음 관리센터, 시설마다 2장) | `image/backgrounds/chatgpt_generated_017~026_*.jpg` 10장 | 1672×941(16:9 근처), 화면에서는 cover로 흐리게 깔림 | `ullim-village.webp`, `run-stage/` 무대 | 사용자 제공 ChatGPT 그림, 상업 이용 근거 없음. 026은 마지막 미션·결과 배경, 017은 옛 홈 배경 규칙에도 쓰임 |
| 결과·인증서의 팀 얼굴(여자아이·남자아이) | `image/characters/chatgpt_generated_028_ee0700142c.jpg`(캐릭터 시트) 1장 | 1672×941 시트, 화면 표시는 얼굴 칸 52~68px 원형 | `explorer-walk-lite.webp` 얼굴, `card-*.webp` | 사용자 제공 ChatGPT 그림. 얼굴 두 개만 쓰므로 정사각 얼굴 2장(512×512, 투명)으로 바꿔도 됨 |
| 시작 화면 제목 로고 | `image/branding/title-logo.webp` 1장 | 1200×675(투명 배경), 글자 「울림도시 대작전」 포함 | 지금 로고의 색·두께, `card-*.webp` | 원본 `chatgpt_generated_029`가 사용자 제공 그림. 글자가 들어가므로 그림은 바탕만 만들고 글자는 합성 |
| ~~시작 화면 배경(연구소 실내)~~ | `image/backgrounds/title-city.webp` 1장 | 1440×810(16:9) | `ullim-village.webp`, `concepts/` 실험실 그림 | **3-2a: 새로 그리지 않음** — 배경 018을 줄인 파생본으로 확인. 018을 바꾸면 같은 방법(1440px)으로 다시 만든다 |
| ~~지도 악당(방해 스피커) 동작 시트~~ | `image/generated/map-villain-poses-left.webp` 1장 | 768×128(128px 칸 6개, 투명), 지도에서 57px 안팎 | `explorer-walk-lite.webp`, `_shared/MAP-VILLAINS-HANDOFF-20261114.md`의 시트 규칙(바닥 피벗·좌우 반전) | **3-2a: 필요 없음** — Codex `image_gen` 기록 확인(권리 장부) |
| ~~지도 탐험가·삐오 반응 시트~~ | `image/generated/map-hero-reaction.webp`, `map-ally-reaction.webp` 2장 | 각 1024×1024(투명, 칸 배치 지금과 같게) | `explorer-walk-lite.webp`, `concepts/pio-fly.webp` | **3-2a: 필요 없음** — Codex `image_gen` 기록 확인 |
| ~~대화창 삐오 초상~~ | `image/generated/dialogue/pio.webp` 1장 | 1024×512(투명, 상반신) | `concepts/pio-fly.webp` | **3-2a: 필요 없음** — Codex `image_gen` 기록 확인 |
| 공유 썸네일·앱 아이콘 | `image/og/ullim-og.jpg`(1200×630), `image/icons/icon-192·512.png` | 같은 크기 | — | 새로 그리지 않고, 위 배경·로고를 바꾼 뒤 `scripts/compose-share-art.swift`로 다시 합성 |
| ~~지도 파이널 영상~~ | `assets/map-encounters/map-finale.mp4` 1편 | 640×360 | 지도·탐험가 그림 | **3-2a: 필요 없음** — 11번 지도 그림에 글자를 합성한 자체 렌더(해시 같음) |

장수 세기(3-2a 대조 뒤, 2026-11-21): 배경 10 + 캐릭터 시트 1(얼굴 2장으로 바꾸면 2) + 로고 1 = **12장**(전 17장 + 영상 1편). 시작 화면 배경·공유 썸네일·아이콘은 새 배경·로고로 다시 만든다(새로 그리지 않음). 지도 악당·반응 시트·삐오 초상은 생성 기록을 찾았고, 지도 파이널 영상은 자체 렌더라 빠졌다.

## (나) 화풍·해상도가 튀거나 임시로 넣은 그림

없음. 1280×800·1024×768·1920×1080 전 화면(44화면) 스크린숏과 3D 달리기·보관함·인증서 인쇄를 보며 자리 표시 그림·깨진 그림·눈에 띄게 다른 화풍은 찾지 못했다(따로 화풍 심사를 한 것은 아니다).

## (다) 게임성·화면 보강에 필요한 소품·배경

없음. 할 일 목록(`SCORE-100-TODO-20261120.md`)에 A17·C14 같은 게임성·화면 보강 줄이 없다.
