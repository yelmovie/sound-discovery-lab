# 삭제 검토 후보 — 실제 삭제하지 않음

2026-10-22. src/data.js의 실행 assets 24개에는 아래 참고 이미지 폴더가 포함되지 않는다. scripts/build.mjs도 assets 목록만 복사한다. 다음은 실행 미사용 근거이며 기획 참고 가치가 없다는 뜻은 아니다. 원본을 보존하고 이동·삭제하지 않았다.

| 경로 | 파일 수 | 합계 bytes | 실행 미사용 근거 | 권장 |
|---|---:|---:|---|---|
| image/branding/ | 2 | 3,989,242 | data.assets에 미포함 | 제목·브랜딩 참고로 보존 |
| _unused/ui-wireframes/ (2026-11-21 image/ui-wireframes/에서 옮김) | 10 | 690,248 | data.assets에 미포함 | 원래 학습 흐름 참고로 보존 |
| _unused/ui-early-concepts/ (2026-11-21 image/ui-early-concepts/에서 옮김) | 6 | 13,735,940 | data.assets에 미포함 | 초기 설계 참고로 보존 |
| _unused/ui-illustrated/ (2026-11-21 image/ui-illustrated/에서 옮김) | 10 | 21,358,001 | data.assets에 미포함 | 기존 화면 비교용으로 보존 |

생성 manifest·문서·테스트는 실행 이미지가 아니어도 검증·추적에 필요하므로 삭제 후보에 넣지 않는다. dist/는 로컬 빌드 결과이며 원본 정리와 구분한다. 배포를 위해 프로젝트 전체를 압축하는 대신 빌드 산출물만 사용한다.


## 2026-11-21 옮김

`image/ui-wireframes/`·`image/ui-early-concepts/`·`image/ui-illustrated/`(26개, 약 36MB)를 지우지 않고 이 폴더로 옮겼다(최종점검 D6 「사용하지 않는 파일은 `_unused/`로 이동」 권고). 빌드(`src/data.js` `assets`)와 코드는 이 파일을 쓰지 않는다. `image/branding/`의 원본 PNG, `image/generated/`의 원본 PNG·manifest, 옛 목소리·효과음 파일은 권리 장부(`docs/RIGHTS-LEDGER-20261121.md`)와 출처 기록이 가리키는 원본이라 그대로 둔다. `docs/asset-move-manifest.json`은 2026-10의 옮김 기록이라 고치지 않았다.
