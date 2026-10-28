"""Rebuild five 16-second concept films with Pillow + the existing D: FFmpeg.

4 shots x 4 seconds, fixed analytical framing, one visual change per shot.
The final shot holds the conclusion. No generated faces, external APIs or fonts.
"""
import argparse, json, math, struct, subprocess, wave
from functools import lru_cache
from array import array
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'media/concepts'
TEMP=ROOT/'.work/concepts'
W,H,FPS,SECONDS=960,540,24,16
INK='#214c4b'; PAPER='#fffdf0'; MUTED='#53736b'; TEAL='#208e92'
FONT=Path('C:/Windows/Fonts/malgun.ttf')
BOLD=Path('C:/Windows/Fonts/malgunbd.ttf')
def font(size,bold=False): return ImageFont.truetype(str(BOLD if bold else FONT),size)
F={n:font(n) for n in [19,22,24,28,30,32]}
FB={n:font(n,True) for n in [20,24,28,32,36]}
STORIES=[
 ('vibration','떨림이 소리를 만들어',['물체를 울리면 떨림이 시작돼.','떨리는 동안 소리가 나.','손으로 잡으면 떨림이 멈춰.','떨림이 멈추면 소리도 멈춰.']),
 ('volume','큰 떨림, 큰 소리',['같은 북을 약하게 쳐 봐.','세게 치면 더 크게 떨려.','높낮이는 같고, 소리 크기가 달라.','치는 세기로 소리 크기를 조절해.']),
 ('pitch','짧게 떨리면 높은 소리',['같은 자를 같은 힘으로 튕겨 봐.','긴 부분은 천천히 떨려 낮은 소리.','짧은 부분은 빠르게 떨려 높은 소리.','길이로 높낮이, 힘으로 크기를 바꿔.']),
 ('travel','소리는 물질을 따라',['북과 귀 사이의 공기를 따라.','물속 종과 감지기 사이의 물을 따라.','탁자와 감지기 사이의 고체를 따라.','세 물질 모두 소리를 전달할 수 있어.']),
 ('care','필요한 소리는 살리고',['누가, 언제, 어디에서 불편할까?','음량을 줄이고 의자에 패드를 붙여.','연습 시간과 장소도 바꿀 수 있어.','필요한 안내는 들리게, 서로 배려해.'])
]
PROPS={}
for name in ['drum','mallet','tuning-fork','fork-stand','transmitter','receiver']:
 im=Image.open(ROOT/f'image/generated/{name}.png').convert('RGBA')
 box=im.getbbox(); PROPS[name]=im.crop(box) if box else im

ART={p.stem:Image.open(p).convert('RGBA') for p in (ROOT/'image/generated/concepts').glob('*.webp')}
@lru_cache(maxsize=64)
def art_tile(name,width,height):
 p=ART[name].copy();p.thumbnail((width,height),Image.Resampling.LANCZOS);return p
def art(im,name,x,y,width,height):
 p=art_tile(name,width,height)
 im.alpha_composite(p,(round(x+(width-p.width)/2),round(y+(height-p.height)/2)))
blade=ART['ruler-blade']
blade=blade.crop((0,round(blade.height*.38),blade.width,round(blade.height*.59))).resize((430,22),Image.Resampling.LANCZOS)
def illustrated_ruler(im,x,y,free,dy=0):
 width=130+free
 p=blade.crop((430-width,0,430,22))
 im.alpha_composite(p,(round(x+40),round(y+40+dy)))
 art(im,'ruler-base',x,y,170,85)

def text(d,xy,s,size=28,color=INK,bold=False,anchor=None):
 d.text(xy,s,font=FB[size] if bold else F[size],fill=color,anchor=anchor)
def pill(d,box,label,color='#e1f1dd'):
 d.rounded_rectangle(box,radius=16,fill=color)
 text(d,((box[0]+box[2])/2,(box[1]+box[3])/2),label,24,anchor='mm',bold=True)
def prop(im,name,x,y,width,height,dy=0):
 p=PROPS[name].copy();p.thumbnail((width,height),Image.Resampling.LANCZOS)
 im.alpha_composite(p,(round(x+(width-p.width)/2),round(y+(height-p.height)/2+dy)))
def waveform(d,x,y,width,amp,cycles,t,color=TEAL):
 d.line((x,y,x+width,y),fill='#ceddd2',width=2)
 pts=[(x+n*width/180,y+amp*math.sin(n/180*math.tau*cycles-t*5)*math.sin(n/180*math.pi)) for n in range(181)]
 d.line(pts,fill=color,width=5)
def arrow(d,x,y,width,color=TEAL):
 d.line((x,y,x+width,y),fill=color,width=5)
 d.line((x+width-12,y-10,x+width,y,x+width-12,y+10),fill=color,width=5)
def bird(d,x,y,scale=1):
 d.ellipse((x-28*scale,y-30*scale,x+28*scale,y+30*scale),fill='#69cbd8',outline=TEAL,width=2)
 d.ellipse((x-18*scale,y,x+18*scale,y+23*scale),fill='#ecfff2')
 for dx in [-10,10]:
  d.ellipse((x+(dx-9)*scale,y-19*scale,x+(dx+9)*scale,y-scale),fill=PAPER,outline=INK,width=3)
  d.ellipse((x+(dx-2)*scale,y-13*scale,x+(dx+2)*scale,y-6*scale),fill=INK)
 d.polygon([(x-6*scale,y-2*scale),(x+6*scale,y-2*scale),(x,y+5*scale)],fill='#efb455')

def frame(stage,t):
 shot=min(3,int(t/4));local=t%4
 im=Image.new('RGBA',(W,H),'#e9f2df');d=ImageDraw.Draw(im)
 # Keep the bottom 80px clear of essential text for native playback controls.
 # Quiet decorative rings stay outside the teaching area.
 for x,y,r in [(910,40,90),(-30,420,100),(950,520,120)]:
  d.ellipse((x-r,y-r,x+r,y+r),outline='#d2e3ce',width=16)
 text(d,(45,25),f'발견 {stage+1:02} / 05',20,bold=True)
 text(d,(45,56),STORIES[stage][1],36,bold=True)
 bird(d,886,55,.72)
 d.rounded_rectangle((40,112,920,380),radius=26,fill=PAPER,outline='#bed4c0',width=2)
 if stage==0:
  active=shot<2;dy=math.sin(t*24)*5 if active else 0
  prop(im,'fork-stand',160,282,170,70)
  prop(im,'tuning-fork',156,137,175,175,dy)
  if shot==2:
   pill(d,(125,138,360,183),'손으로 잡아 멈춰','#ffdfad')
  waveform(d,455,248,365,46 if active else 0,5,t)
  pill(d,(485,318,790,370),'떨림 + 소리' if active else '멈춘 떨림 + 고요함')
  text(d,(245,364),'울리기' if active else '멈추기',24,anchor='mm',bold=True)
 elif stage==1:
  prop(im,'drum',80,149,215,190,math.sin(t*21)*3)
  prop(im,'mallet',220,121,100,100,math.sin(t*7)*9)
  if shot<2:
   amp=16 if shot==0 else 58
   waveform(d,409,245,414,amp,5,t)
   pill(d,(465,324,780,370),'약하게 → 작은 소리' if shot==0 else '세게 → 큰 소리','#ffebc6')
  else:
   waveform(d,425,205,390,14,5,t)
   waveform(d,425,309,390,40,5,t)
   text(d,(370,205),'약',24,anchor='mm',bold=True)
   text(d,(370,309),'강',24,anchor='mm',bold=True)
   text(d,(630,364),'높낮이는 그대로',24,anchor='mm',bold=True)
 elif stage==2:
  for row,free,cycles,label in [(0,260,3,'긴 자 · 낮은 소리'),(1,87,8,'짧은 자 · 높은 소리')]:
   y=126+row*120;active=(shot in [0,3])or(shot==1 and row==0)or(shot==2 and row==1)
   dy=math.sin(t*(9 if row==0 else 23))*2 if active else 0
   illustrated_ruler(im,80,y,free,dy)
   waveform(d,615,y+42,225,24 if active else 0,cycles,t)
   text(d,(305,y+103),label,24,anchor='mm',bold=True)
 elif stage==3:
  active=shot if shot<3 else -1
  for col,(name,label) in enumerate([('travel-air','공기'),('travel-water','물'),('travel-solid','고체')]):
   x=55+col*288
   d.rounded_rectangle((x,129,x+274,367),radius=18,fill='#e5f2df' if active in [-1,col] else '#f1f2e8',outline=TEAL if active in [-1,col] else '#ceddca',width=3)
   art(im,name,x+8,151,258,165)
   text(d,(x+137,340),label,28,anchor='mm',bold=True)
 elif stage==4:
  if shot==0:
   art(im,'library-noise',65,124,825,245)
  elif shot==1:
   for col,(name,label) in enumerate([('care-volume','음량 줄이기'),('care-pad','의자 패드 붙이기')]):
    x=110+col*410;art(im,name,x,124,260,196)
    pill(d,(x-20,326,x+280,372),label)
  elif shot==2:
   art(im,'care-time',90,125,220,195);art(im,'care-place',400,133,430,185)
   pill(d,(70,326,345,372),'연습 시간 조절')
   pill(d,(420,326,835,372),'교실에서 먼 곳으로')
  else:
   art(im,'care-volume',70,136,190,170);art(im,'care-pad',290,136,150,170)
   prop(im,'transmitter',535,134,155,175)
   text(d,(786,176),'음악은 작게',24,anchor='mm',bold=True)
   text(d,(786,229),'의자에는 패드',24,anchor='mm',bold=True)
   text(d,(786,281),'안내는 들리게',24,anchor='mm',bold=True)
   pill(d,(160,326,805,372),'필요한 소리는 살리고 서로 배려해')
 caption=STORIES[stage][2][shot]
 d.rounded_rectangle((40,384,920,445),radius=18,fill=INK)
 text(d,(480,414),caption,30,PAPER,anchor='mm')
 for n in range(4):
  x=392+n*46;d.rounded_rectangle((x,455,x+34,460),radius=2,fill=TEAL if n<=shot else '#b7cfbd')
 return im.convert('RGB')

RECORDED={}
def sample_at(name,t,rate=1):
 samples=RECORDED[name];n=int(t*44100*rate)
 return samples[n] if 0<=n<len(samples) else 0
def sound_sample(stage,t):
 # Same CC0 recording under each condition; gain or relative rate changes only.
 beat=t%1
 if stage==0:return sample_at('fork',t%4,520/440)*.23 if t<8 else 0
 if stage==1:
  amp=.1 if t<4 or (8<=t<12 and int(t)%2==0) else .3
  return sample_at('drum',beat)*amp
 if stage==2:
  f=260 if t<8 else 650 if t<12 else [260,650,390][int(t)%3]
  return sample_at('ruler',beat,f/260)*.22
 if stage==3:
  voice=['drum','fork','solid','fork'][min(3,int(t/4))]
  return sample_at(voice,beat)*.18
 music=.22 if t<4 else .045
 return sample_at('music',t%2)*music+sample_at('fork',t%2,1.5)*(.11 if int(t)%2 else 0)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--ffmpeg',default='F:/tools/ffmpeg/ffmpeg.exe');parser.add_argument('--stage',type=int);a=parser.parse_args()
 for name,file in {'drum':'media/audio/experiments/drum.ogg','ruler':'media/audio/experiments/ruler.ogg','fork':'media/audio/experiments/fork.ogg','solid':'media/audio/place_wood.ogg','music':'media/audio/restore_chime.ogg'}.items():
  raw=subprocess.check_output([a.ffmpeg,'-v','error','-i',str(ROOT/file),'-ac','1','-ar','44100','-f','f32le','pipe:1'])
  RECORDED[name]=array('f',raw)
 OUT.mkdir(exist_ok=True,parents=True);TEMP.mkdir(exist_ok=True,parents=True)
 for stage,(name,title,captions) in enumerate(STORIES):
  if a.stage is not None and stage!=a.stage:continue
  wav=TEMP/f'{name}.wav'
  with wave.open(str(wav),'wb') as f:
   f.setparams((1,2,44100,0,'NONE','not compressed'))
   f.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,sound_sample(stage,n/44100)))*32767)) for n in range(44100*SECONDS)))
  cmd=[a.ffmpeg,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(wav),'-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-b:a','80k','-movflags','+faststart','-shortest',str(OUT/f'{name}.mp4')]
  p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  try:
   for n in range(FPS*SECONDS):p.stdin.write(frame(stage,n/FPS).tobytes())
  finally:p.stdin.close()
  if p.wait()!=0:raise RuntimeError(f'FFmpeg failed: {name}')
  frame(stage,5.2).save(OUT/f'{name}.jpg',quality=88)
  # Timestamp format is hours:minutes:seconds, with a short duration in seconds.
  vtt='WEBVTT\n\n'+'\n\n'.join(f'{k+1}\n00:00:{k*4:02}.000 --> 00:00:{(k+1)*4:02}.000\n{c}' for k,c in enumerate(captions))+'\n'
  (OUT/f'{name}.vtt').write_text(vtt,encoding='utf-8')
  print(f'{name}: 16s, 960x540, {(OUT/f"{name}.mp4").stat().st_size//1024} KiB',flush=True)
 (OUT/'manifest.json').write_text(json.dumps({'created':'2026-10-28','method':'Pillow + FFmpeg, generated teaching illustrations and project props, system Malgun Gothic','fps':FPS,'duration':SECONDS,'framing':'4 shots of 4s, static front analytical view, final conclusion held','audio':'CC0 field/instrument recordings, gain and relative-rate modeling; source details in media/audio/experiments/sources.json; no narration','films':[{'id':n,'title':t,'captions':c} for n,t,c in STORIES]},ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()
