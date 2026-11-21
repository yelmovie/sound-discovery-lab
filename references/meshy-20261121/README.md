# Meshy 원본 · 3D 달리기 문틀·북 (2026-11-21)

원본 GLB와 입력 그림은 Git에 올리지 않는다(`.gitignore`). 실행본은 `media/models/run-stage/`.

| 물체 | 입력 그림 | Meshy 작업 ID | 크레딧 | 원본 GLB (SHA-256) | 실행본 |
|---|---|---|---|---|---|
| 잠금문 문틀 (Golden Seashell Arch) | `gate-arch-input.png` = `.work/run-stage-20261117/gate-arch.png`(GPT 이미지, 2026-11-17) · sha256 05f8f9b2… | 01a1fd8f-ffcc-728b-b5a7-b1dda6340412 | 30 | `gate-arch-meshy71-std-tex2k.glb` 24,888,768B · 557,416면 · 01194c82277e62b763c37fbf72a5bdba837f4384c70b88bfdcdb6b7772ea0997 | `gate-arch.glb` 530,028B · 8,080면 (pack.mjs 0.01 0.012) |
| 징검돌 북 (Toy Drum) | `drum-input.png`(gpt-imagegen, 참고 그림 drum-side·gate-arch, 2026-11-21) · sha256 966cf6e0… | 01a1fd98-2a75-7632-8295-c78feada0aff | 30 | `drum-meshy71-std-tex2k.glb` 27,858,148B · 658,280면 · 868464e67b87b5b13773cf1a5184b893c64109d50e274785dd999af6dec5095e | `drum.glb` 489,812B · 2,914면 (pack.mjs 0.0015 0.08) |

- 설정: Meshy 7.1 · 표준 해상도 · 텍스처 Meshy 7 2K · 포즈 끔 · 라이선스 비공개(사용자 Meshy 계정 유료 크레딧). `_shared/meshy/meshy-gen.sh`로 생성, 문틀은 받기 단계 오류로 코디네이터가 같은 작업을 다시 받음(재생성 없음).
- 압축: `_shared/meshy/pack.mjs`(텍스처 1024px JPEG, gltfpack 1.3.0 meshopt). 렌더 확인은 `_shared/meshy/render.py`.
