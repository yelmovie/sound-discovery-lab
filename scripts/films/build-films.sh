#!/bin/zsh
# 인트로·파이널 이야기 영상 다시 합성(2026-11-21). 사용: scripts/films/build-films.sh [intro|final|all]
# 장면 원본은 git 밖 외장 SSD .work/film-20261121/flow-out/ (Flow·Gemini 영상, 임시 컷 E). 바꾼 장면이 생기면 이 스크립트만 다시 돌린다.
# 소리: 영상 생성기 소리는 쓰지 않고 앱 주제곡(main-theme / final-theme) + 앱 ElevenLabs 목소리(삐오 Aria). 자막은 공용 burn.py로 영상 안에.
set -e
APP="/Volumes/T7 Shield/iscreammedia_sc34/11 sound"; W="$APP/.work/film-20261121"; cd "$W"
FF=ffmpeg; FP=ffprobe; VO="$APP/media/audio/voices"; BGM="$APP/media/audio/bgm"; CARDS="$W/cards"; PY=~/.local/share/uv/tools/earshot/bin/python
BURN="/Volumes/T7 Shield/iscreammedia_sc34/_shared/caption-motion-20261118/burn.py"; Q="$APP/docs/film-captions-20261121"
N="setsar=1,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709"
S="scale=1920:1080:flags=lanczos"
mkdir -p build
[ -d "$CARDS" ] || "$PY" "$APP/scripts/films/make-cards.py" "$CARDS"
ms(){ echo "$1*1000/1" | bc; }
mixaudio(){ # $1 곡 $2 길이 $3 출력 , 이후 "목소리 시작초" 쌍
  local song=$1 len=$2 out=$3; shift 3; local ins=() fl="" i=1 labs=""
  while [ $# -gt 0 ]; do ins+=(-i "$VO/el-$1.mp3"); fl+="[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=$(ms $2)|$(ms $2),volume=1.5[s$i];"; labs+="[s$i]"; i=$((i+1)); shift 2; done
  $FF -y -v error -i "$BGM/$song" ${ins[@]} -filter_complex "[0:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${len},asetpts=PTS-STARTPTS,afade=t=in:d=0.6,afade=t=out:st=$(echo "$len-1.0"|bc -l):d=1.0,volume=0.6[bg];${fl}${labs}amix=inputs=$((i-1)):normalize=0,asplit[vo][vo2];[bg][vo]sidechaincompress=threshold=0.04:ratio=5:attack=30:release=350[duck];[duck][vo2]amix=inputs=2:normalize=0,apad,atrim=0:${len}[a]" -map "[a]" -c:a pcm_s16le build/$out.wav
  $FF -v info -i build/$out.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' > build/ln.json
  local ii=$(python3 -c "import json;d=json.load(open('build/ln.json'));print('measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s'%(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset']))")
  $FF -y -v error -i build/$out.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:${ii}:linear=true" -c:a aac -b:a 160k -ar 48000 build/$out.m4a
}
intro(){
  local A=flow-out/cutA.mp4 B=flow-out/cutB.mp4 C=flow-out/cutC.mp4 len=25.0
  $FF -y -v error -i $A -i $B -i $C -loop 1 -t $len -i $CARDS/intro-logo.png -loop 1 -t $len -i $CARDS/intro-hook.png -filter_complex "
[0:v]fps=24,${S},${N}[v0];[1:v]trim=0:4.5,setpts=PTS-STARTPTS,fps=24,${S},${N}[v1];[2:v]fps=24,${S},${N},tpad=stop_mode=clone:stop_duration=5.6[v2];
[v0][v1]xfade=transition=fade:duration=0.3:offset=7.55[v01];[v01][v2]xfade=transition=fadewhite:duration=0.5:offset=11.55[base];
color=c=black:s=1920x1080:r=24:d=${len},format=yuva420p,colorchannelmixer=aa=0.5,fade=t=in:st=19.6:d=0.8:alpha=1[dim];[base][dim]overlay=shortest=1[b2];
[3:v]format=rgba,scale=w='iw*(0.9+0.1*min(1,max(0,t-20.0)/0.9))':h=-1:eval=frame,fade=t=in:st=20.0:d=0.8:alpha=1[logo];
[b2][logo]overlay=x=(main_w-overlay_w)/2:y=(main_h-overlay_h)/2-20:eval=frame:shortest=1[b3];
[4:v]format=rgba,fade=t=in:st=20.9:d=0.6:alpha=1[hook];[b3][hook]overlay=shortest=1,fade=t=in:st=0:d=0.5,fade=t=out:st=$(echo "$len-0.6"|bc -l):d=0.6,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p build/intro-v.mp4
  mixaudio main-theme.mp3 $len intro guide-1 0.8 story-1 5.4 story-2 10.4 title-bubble 21.0
  $FF -y -v error -i build/intro-v.mp4 -i build/intro.m4a -map 0:v -map 1:a -c copy -movflags +faststart build/intro-base.mp4
  "$PY" "$BURN" "$Q/intro.json"
}
final(){
  local D=flow-out/cutD.mp4 E=${FINAL_E:-flow-out/cutE-temp.mp4} F=flow-out/cutF.mp4 len=28.55
  $FF -y -v error -i $D -i $E -i $F -loop 1 -t $len -i $CARDS/final-badge.png -framerate 24 -i $CARDS/notes/%03d.png -filter_complex "
[0:v]fps=24,${S},${N}[v0];[1:v]trim=0:7.85,setpts=PTS-STARTPTS,fps=24,${S},${N}[v1];[2:v]fps=24,${S},${N},tpad=stop_mode=clone:stop_duration=5.6[v2];
[v0][v1]xfade=transition=fade:duration=0.3:offset=7.55[v01];[v01][v2]xfade=transition=fade:duration=0.3:offset=15.1[base];
color=c=black:s=1920x1080:r=24:d=${len},format=yuva420p,colorchannelmixer=aa=0.45,fade=t=in:st=23.1:d=0.7:alpha=1[dim];[base][dim]overlay=shortest=1[b2];
[4:v]format=rgba,setpts=PTS+23.0/TB[notes];[b2][notes]overlay=eof_action=pass[b3];
[3:v]format=rgba,scale=w='iw*min(1.0,0.55+0.5*max(0,t-23.4)/0.35-0.05*max(0,min(1,(t-23.75)/0.25)))':h=-1:eval=frame,fade=t=in:st=23.4:d=0.35:alpha=1[badge];
[b3][badge]overlay=x=(main_w-overlay_w)/2:y=(main_h-overlay_h)/2-30:eval=frame:shortest=1,fade=t=in:st=0:d=0.5,fade=t=out:st=$(echo "$len-0.6"|bc -l):d=0.6,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p build/final-v.mp4
  mixaudio final-theme.mp3 $len final final-title 0.4 final-core 3.1 ending-1 6.6 ending-2 15.0 finale-thanks 23.6
  $FF -y -v error -i build/final-v.mp4 -i build/final.m4a -map 0:v -map 1:a -c copy -movflags +faststart build/final-base.mp4
  "$PY" "$BURN" "$Q/final.json"
}
web(){ # $1 intro|final  $2 앱 경로 이름  $3 포스터 초  $4 crf(기본 27)
  $FF -y -v error -i build/$1-cap.mp4 -vf scale=1280:720:flags=lanczos -c:v libx264 -profile:v high -level 4.0 -preset slower -crf ${4:-27} -pix_fmt yuv420p -c:a aac -b:a 112k -ar 48000 -movflags +faststart "$APP/media/$2.mp4"
  $FF -y -v error -ss $3 -i build/$1-cap.mp4 -frames:v 1 -vf scale=1280:720 -q:v 6 "$APP/media/$2.jpg"
}
case ${1:-all} in intro) intro; web intro intro/intro-ullim 2.0;; final) final; web final finale/final-ullim 1.0 30;; all) intro; web intro intro/intro-ullim 2.0; final; web final finale/final-ullim 1.0 30;; esac
find "$APP/media" -name '._*' -delete
