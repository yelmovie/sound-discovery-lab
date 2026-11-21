"""인트로·파이널 끝 카드 그림과 음표 꽃가루 프레임을 만든다(2026-11-21).
실행: ~/.local/share/uv/tools/earshot/bin/python scripts/films/make-cards.py <작업 폴더>
글꼴: 공용 주아체(OFL, _shared/caption-motion-20261118/fonts). 그림: 앱 제목 로고·소리 코어 그림 그대로."""
import sys, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
JUA = '/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/fonts/Jua-Regular.ttf'
W, H = 1920, 1080
GOLD, TEAL, INK = (255, 211, 92), (63, 214, 230), (14, 42, 51)

def text_layer(txt, size, fill, stroke=8, glow=None):
    f = ImageFont.truetype(JUA, size); box = f.getbbox(txt); w, h = box[2] - box[0] + stroke * 4 + 40, box[3] - box[1] + stroke * 4 + 40
    im = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(im)
    if glow:
        g = Image.new('RGBA', (w, h)); ImageDraw.Draw(g).text((20 + stroke * 2 - box[0], 20 + stroke * 2 - box[1]), txt, font=f, fill=glow, stroke_width=stroke * 2, stroke_fill=glow)
        im = Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(14))); d = ImageDraw.Draw(im)
    d.text((20 + stroke * 2 - box[0], 20 + stroke * 2 - box[1]), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=INK + (255,))
    return im

# 인트로: 제목 로고 + 호기심 한 줄(가운데 위쪽, 아래 자막 자리는 비움)
logo = Image.open(ROOT / 'image/branding/title-logo.webp').convert('RGBA')
lw = 980; logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
card = Image.new('RGBA', (W, H))
glow = Image.new('RGBA', (W, H)); gx, gy = (W - lw) // 2, 120
glow.paste(Image.new('RGBA', logo.size, TEAL + (150,)), (gx, gy), logo.split()[3]); card = Image.alpha_composite(card, glow.filter(ImageFilter.GaussianBlur(30)))
card.alpha_composite(logo, (gx, gy))
card.save(OUT / 'intro-logo.png')
hook = text_layer('멈춘 소리를 되찾을 탐험가, 바로 너야!', 66, (255, 255, 255, 255), stroke=7, glow=TEAL + (170,))
h2 = Image.new('RGBA', (W, H)); h2.alpha_composite(hook, ((W - hook.width) // 2, gy + logo.height + 18)); h2.save(OUT / 'intro-hook.png')

# 파이널: 소리 코어 메달 + 「복구 완료」 + 인증서로 이어지는 한 줄
core = Image.open(ROOT / 'image/generated/core.png').convert('RGBA'); cs = 300; core = core.resize((cs, round(core.height * cs / core.width)), Image.LANCZOS)
badge = Image.new('RGBA', (W, H)); cx = W // 2
halo = Image.new('RGBA', (W, H)); ImageDraw.Draw(halo).ellipse((cx - 210, 70, cx + 210, 490), fill=GOLD + (120,)); badge = Image.alpha_composite(badge, halo.filter(ImageFilter.GaussianBlur(40)))
ring = Image.new('RGBA', (W, H)); rd = ImageDraw.Draw(ring); rd.ellipse((cx - 190, 90, cx + 190, 470), fill=INK + (235,), outline=GOLD + (255,), width=12); rd.ellipse((cx - 168, 112, cx + 168, 448), outline=TEAL + (255,), width=5)
badge = Image.alpha_composite(badge, ring); badge.alpha_composite(core, (cx - core.width // 2, 280 - core.height // 2))
title = text_layer('울림도시 복구 완료!', 104, GOLD + (255,), stroke=10, glow=GOLD + (140,)); badge.alpha_composite(title, ((W - title.width) // 2, 480))
sub = text_layer('소리 탐험가 인증서를 받으러 가자!', 56, (255, 255, 255, 255), stroke=7); badge.alpha_composite(sub, ((W - sub.width) // 2, 640))
badge.save(OUT / 'final-badge.png')

# 음표 꽃가루: 4.8초(24fps) 동안 떨어지며 흔들리는 금빛·청록 음표와 반짝임
random.seed(11); notes = []
for i in range(46):
    notes.append(dict(x=random.uniform(60, W - 60), y=random.uniform(-700, -40), v=random.uniform(170, 330), sw=random.uniform(20, 60), ph=random.uniform(0, 6.28),
                      s=random.uniform(0.7, 1.35), c=random.choice([GOLD, TEAL, (255, 255, 255), (255, 150, 190)]), k=random.choice(['8', '16', 'dot'])))
def draw_note(d, x, y, s, c, k, a):
    col = c + (a,)
    if k == 'dot':
        r = 9 * s; d.polygon([(x, y - r * 2), (x + r * .6, y - r * .6), (x + r * 2, y), (x + r * .6, y + r * .6), (x, y + r * 2), (x - r * .6, y + r * .6), (x - r * 2, y), (x - r * .6, y - r * .6)], fill=col); return
    r = 15 * s; d.ellipse((x - r * 1.25, y - r, x + r * 1.25, y + r), fill=col); d.line((x + r * 1.1, y, x + r * 1.1, y - 64 * s), fill=col, width=max(3, int(5 * s)))
    if k == '8': d.line((x + r * 1.1, y - 64 * s, x + r * 2.6, y - 44 * s), fill=col, width=max(3, int(6 * s)))
    else:
        d.line((x + r * 1.1, y - 64 * s, x + r * 2.6, y - 50 * s), fill=col, width=max(3, int(6 * s))); d.line((x + r * 1.1, y - 50 * s, x + r * 2.6, y - 36 * s), fill=col, width=max(3, int(6 * s)))
fr = OUT / 'notes'; fr.mkdir(exist_ok=True)
for n in range(int(4.8 * 24)):
    t = n / 24; im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    for p in notes:
        y = p['y'] + p['v'] * (t + 1.2); x = p['x'] + math.sin(t * 2.2 + p['ph']) * p['sw']
        a = int(255 * min(1, t / 0.4) * (1 if y < H * 0.72 else max(0, 1 - (y - H * 0.72) / 160)))
        if a > 0 and y > -80: draw_note(d, x, y, p['s'], p['c'], p['k'], a)
    im.save(fr / f'{n:03d}.png')
print('cards ok', OUT)
