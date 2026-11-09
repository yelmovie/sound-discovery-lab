// Manual, local-file NPC guide. No network TTS or autoplay.
export function mountNpcGuide(host, {src, text, enabled, quiet = () => {}}) {
  if (!host) return () => {};
  const trigger=document.createElement('button');
  trigger.type='button'; trigger.textContent='안내자 목소리 듣기';
  trigger.style.cssText='min-height:48px;min-width:48px;padding:10px 16px;border-radius:14px;font:inherit;cursor:pointer';
  trigger.setAttribute('aria-haspopup','dialog'); host.append(trigger);
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label','탐험 안내 음성');
  dialog.style.cssText='max-width:min(480px,calc(100vw - 32px));max-height:85dvh;overflow:auto;padding:24px;border:2px solid #789;border-radius:20px;color:#172b40;background:#fff';
  const caption=document.createElement('p'); caption.textContent=text; caption.style.lineHeight='1.7';
  const label=document.createElement('p');label.textContent='모모로 만든 AI 안내 음성 · 자막은 소리 없이도 볼 수 있어요.';
  const play=document.createElement('button');play.type='button';
  const close=document.createElement('button');close.type='button';close.textContent='닫기';
  for(const b of [play,close])b.style.cssText='min-height:48px;min-width:48px;padding:10px 16px;margin:4px;border-radius:12px;font:inherit;cursor:pointer';
  const status=document.createElement('p');status.setAttribute('role','status');
  dialog.append(caption,label,play,close,status);document.body.append(dialog);
  let audio=new Audio(src);audio.preload='none';let alive=true,request=0;
  function reset(){quiet(false);play.textContent='목소리 재생';play.setAttribute('aria-pressed','false');}
  function stop(){request++;audio.onended=null;audio.onerror=null;audio.pause();audio.currentTime=0;reset();}
  function failed(){stop();status.textContent='음성을 읽지 못했어요. 위 안내 글로 계속할 수 있어요.';}
  async function toggle(){
    if(!audio.paused||play.getAttribute('aria-pressed')==='true'){stop();return;}
    if(!enabled()){status.textContent='설정에서 소리를 켠 뒤 재생해 주세요.';return;}
    stop();audio=new Audio(src);audio.preload='none';audio.onended=reset;audio.onerror=failed;const candidate=audio;status.textContent='';const ticket=++request;quiet(true);play.setAttribute('aria-pressed','true');
    try{await candidate.play();if(!alive||ticket!==request||!dialog.open||!enabled()){candidate.pause();return;}play.textContent='목소리 멈추기';play.setAttribute('aria-pressed','true');}catch{if(alive&&ticket===request)failed();}
  }
  function hidden(){if(document.hidden)stop();}
  function outside(event){if(!dialog.contains(event.target)&&event.target!==trigger)stop();}
  function setting(){queueMicrotask(()=>{if(!enabled())stop();});}
  trigger.onclick=()=>{stop();status.textContent='';dialog.showModal();play.focus();};
  play.onclick=toggle;close.onclick=()=>{stop();dialog.close();};dialog.oncancel=stop;
  dialog.onclose=()=>{stop();if(trigger.isConnected)trigger.focus();};
  audio.onended=reset;audio.onerror=failed;reset();
  document.addEventListener('visibilitychange',hidden);document.addEventListener('click',outside,true);document.addEventListener('change',setting,true);window.addEventListener('pagehide',stop);
  return ()=>{alive=false;stop();document.removeEventListener('visibilitychange',hidden);document.removeEventListener('click',outside,true);document.removeEventListener('change',setting,true);window.removeEventListener('pagehide',stop);audio.onended=null;audio.onerror=null;audio.removeAttribute('src');audio.load();dialog.remove();trigger.remove();};
}
