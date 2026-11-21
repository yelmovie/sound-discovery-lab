# 인트로 영상 제작 기록 (2026-11-21)

앱 파일: `media/intro/intro-ullim.mp4`(1280×720, 20.9초, 6.1MB), `intro-ullim.jpg`(포스터), `intro-ullim.vtt`(자막). 고화질 원본·Flow 컷·시작 그림은 git 밖 `.work/film-20261121/`(외장 SSD).

1. 시작 그림 3장: GPT 이미지(Codex 내장 이미지 도구, `gpt-imagegen`), 기존 앱 그림(ullim-village, title-city, pio, map-hero-reaction, map-villain-poses-left)을 참고 이미지로 넣음. 프롬프트는 아래 「GPT 그림 프롬프트」.
2. 영상 3컷: Google Flow(Veo 3.1 Quality, 사용자 PRO 계정, 지역 정책상 워터마크 필수), Aside로 조작. 컷 A·B는 시작·끝 프레임 지정. Flow 프로젝트 https://flow.google.com/project/67a6e18e-7db7-40c4-8345-60ded9de5564
3. 편집: 로컬 ffmpeg(`.work/film-20261121/assemble-intro.sh`). B는 탐험가에게 모자가 생기는 4.5초 뒤를 잘라 하얀 빛 전환으로 C에 이음. 앱 녹음 `el-story-1`(5.4초), `el-story-2`(10.9초)를 얹고 -16 LUFS.


세 컷을 이어 붙여 24초 인트로를 만든다. 컷 사이가 끊기지 않게 앞 두 컷은 「프레임 → 동영상(Frames to Video)」으로 시작·끝 프레임을 지정한다.
- 컷 A: 시작 intro-1.png → 끝 intro-2.png
- 컷 B: 시작 intro-2.png → 끝 intro-3.png
- 컷 C: 시작 intro-3.png (끝 프레임 없음)

모든 컷: 16:9, 8초. 글자·자막·로고 금지. 대사 금지(앱 목소리를 나중에 얹음).

### 컷 A — 울림도시의 아침 → 소리 코어가 멈췄어
Hand-painted 2.5D storybook animated film for children, keep the exact art style, colors and character designs of the frames. Begins on a bright golden morning high above Ullim City: soft glowing sound-wave ribbons and tiny musical-note sparkles drift from the rooftop instruments (golden tuning fork, big drum, kalimba, gramophone horn) toward the glowing cyan crystal in the central plaza, birds glide, waterfalls flow. The camera smoothly descends and glides down into the plaza toward the crystal. Three small cute purple box-shaped speaker robots with yellow trim sneak in, grab the thick glowing cable together and tug; with a comical pop the plug comes out. The crystal dims to cold grey-blue, the sound ribbons freeze and fall as grey note fragments, and color drains across the village into a hushed blue dusk, ending exactly on the final frame. Funny and a little suspenseful, never scary, nobody is hurt. Audio: birdsong and a soft music-box melody, then tugging sounds, a cartoon pop and a descending power-down hum fading to silence. No voices, no speech. No subtitles, captions, logos or any written text.

### 컷 B — 어두워진 광장 → 연구소
Same hand-painted storybook animation style, keep the exact character designs. From the darkened plaza at blue dusk, the mischievous purple speaker robots giggle and scurry away. The camera rises and glides smoothly across the quiet blue village toward the round sound laboratory, then pushes gently through its big glowing window into the warm lamp-lit lab, ending exactly on the final frame: the small blue bird mascot with round glasses flying in with its feathered bird wings spread, and the girl explorer turning toward it. One continuous camera move, no cuts. Audio: soft wind, distant quiet village, a lab hum growing as the camera enters, fluttering wings. No voices, no speech. No subtitles, captions, logos or any written text.

### 컷 C — 삐오의 부름
Same storybook animation style, inside the round sound laboratory at dusk. The small blue bird mascot with round glasses flaps its feathered bird wings (always bird wings with feathers, never hands), hovers beside the girl and chirps urgently, pointing a wing toward the big window and the dark blue village outside. The girl turns toward the bird, tightens her backpack straps, lifts the small silver tuning fork and nods with a brave, determined smile. Screens flicker; the dark glass core tube in the background glows faintly for a moment, as if waiting. Camera: eye-level medium shot with a slow dolly-in to the girl's determined face. Warm lamp light against cool blue dusk. Keep both characters exactly as in the image. Audio: soft lab hum, fluttering wings, a hopeful rising chime at the end. No spoken words. No subtitles, captions, logos or any written text.

### 앱 목소리 얹을 자리 (로컬 편집)
- 컷 A 플러그가 빠진 직후: story-1 「소리 코어가 멈췄어!」
- 컷 C 시작부터: story-2 「물체를 울리고, 조건을 바꾸며 소리의 비밀을 찾아 줘. …」

## GPT 그림 프롬프트

### intro-1

High aerial establishing view of Ullim City, a sound village of five facilities around the central plaza: a teal-roofed house crowned with a giant golden tuning fork, an orange round arena topped with a big drum, a purple-roofed workshop with a large kalimba sign, a green domed observatory with a brass gramophone horn, and a red-roofed library cottage, connected by sandy paths, lanterns, waterfalls and pine forest on a bright golden morning. Every facility hums with music: soft glowing translucent sound-wave ribbons and tiny floating musical-note sparkles drift from each rooftop instrument toward the Sound Core: a tall glowing cyan crystal standing on a round brass-and-stone plinth in the middle of a circular plaza, which shines bright cyan. Birds, waterfalls, lively lantern-lit paths, a calm happy mood. Camera at a high three-quarter angle, the core slightly below the frame center, room in the sky for a slow push-in. Hand-painted 2.5D storybook game art for a Korean elementary science adventure, warm cozy fantasy, soft volumetric light, rich saturated colors, crisp painterly detail, matching the attached reference images in style, palette and character design exactly. Cinematic 16:9 widescreen keyframe for an animated film. No text, no letters, no numbers, no logos, no UI, no watermark.

### intro-2

Low-angle medium-wide shot at the central plaza of Ullim City, a sound village of five facilities around the central plaza: a teal-roofed house crowned with a giant golden tuning fork, an orange round arena topped with a big drum, a purple-roofed workshop with a large kalimba sign, a green domed observatory with a brass gramophone horn, and a red-roofed library cottage, connected by sandy paths, lanterns, waterfalls and pine forest. Three small mischievous purple box-shaped speaker robots with yellow-orange trim, one big round black speaker-cone face with grumpy eyes, stubby orange arms and legs and a cable tail ending in a plug (nonviolent, comical, cute) tug together on a thick glowing cable and pull its plug out of the base of the Sound Core: a tall glowing cyan crystal standing on a round brass-and-stone plinth in the middle of a circular plaza. The crystal dims to a cold grey-blue, the sound-wave ribbons in the air freeze and crack into falling grey note fragments, colors drain from the village into a hushed blue dusk, rooftop instruments go still. Comical, a little suspenseful, not scary, no harm to anyone. Hand-painted 2.5D storybook game art for a Korean elementary science adventure, warm cozy fantasy, soft volumetric light, rich saturated colors, crisp painterly detail, matching the attached reference images in style, palette and character design exactly. Cinematic 16:9 widescreen keyframe for an animated film. No text, no letters, no numbers, no logos, no UI, no watermark.

### intro-3

Inside the round sound laboratory of the reference image at dusk: the tall glass core tube in the background is dark and silent, screens flicker. Pio, a small round chibi bluebird mascot with bright sky-blue feathers, a white face and belly with a tiny cyan waveform mark on the chest, big round navy-rimmed glasses, shiny dark eyes, pink cheeks, orange beak and feet, and an upright electric-blue flame-shaped crest with a white zigzag sound-wave stripe flies in from the left, wings spread, glasses glinting, calling urgently. a cheerful Korean elementary-school girl explorer with a chestnut-brown high ponytail tied with a teal scrunchie, a white-and-blue zip jacket, navy shorts, white socks, blue-and-white sneakers and an orange-and-blue backpack turns toward Pio in the middle of the room, pulling on her backpack straps and holding a small silver tuning fork, determined and brave. Through the big window the dim blue village waits. Medium shot, eye level, warm lamp light against cool blue dusk. Hand-painted 2.5D storybook game art for a Korean elementary science adventure, warm cozy fantasy, soft volumetric light, rich saturated colors, crisp painterly detail, matching the attached reference images in style, palette and character design exactly. Cinematic 16:9 widescreen keyframe for an animated film. No text, no letters, no numbers, no logos, no UI, no watermark.
