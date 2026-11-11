# Scenery-first interface review — 2026-11-11

Translucent background fills, restrained borders/shadows, readable foreground text and icons. Core/selected/disabled states and learning artwork preserved. Large reading dialogs retain stronger fill. No opacity applied to whole controls.

119 unit tests; 160 activity viewport states without layout issues; 18 settings/notebook/concept dialog states without issues. Final 3-size activity and interaction regression also run. Existing macOS git sidecar warnings preserved, no object deletion.

Browser QA uses Chromium and seeded states; physical tablets, Safari, and every natural play route were not tested.

Final 135-state sweep exposed the decorative title guide covering voice replay at 915x412. Guide hidden only on short landscape; core actions retained. Twelve actual activity interactions passed.
