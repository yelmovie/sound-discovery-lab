
const button=(text,cls)=>Object.assign(document.createElement('button'),{type:'button',textContent:text,className:cls});
export function portraitMarkup(src,{hue=0}={}){
  return '<span class="npc-stage-portrait" aria-hidden="true" style="--npc-portrait:url(&quot;'+src+'&quot;);--npc-hue:'+hue+'deg"></span>';
}

// This dialog owns a single voice and a single visible frame of the portrait.
export function openNpcScene({src,portrait,name,text,trigger,enabled,quiet=()=>{},hue=0,reduced=()=>false}){
  const dialog=document.createElement('dialog');
  dialog.className='npc-stage-dialog';dialog.setAttribute('aria-label',name+' 대화');
  const stage=document.createElement('section');
  stage.className='npc-stage';stage.dataset.speaking='false';
  if(reduced())stage.dataset.reduced='true';
  const art=document.createElement('div');art.className='npc-stage-art';art.innerHTML=portraitMarkup(portrait,{hue});
  const panel=document.createElement('div');panel.className='npc-stage-panel';
  const title=document.createElement('h2');title.textContent=name;
  const caption=document.createElement('p');caption.textContent=text;caption.className='npc-stage-caption';
  const footer=document.createElement('div');footer.className='npc-stage-actions';
  const play=button('목소리 다시 듣기','npc-stage-button');
  const close=button('닫기','npc-stage-button npc-stage-primary');
  const status=document.createElement('span');status.className='npc-stage-status';status.setAttribute('role','status');
  footer.append(play,status,close);panel.append(title,caption,footer);stage.append(art,panel);dialog.append(stage);document.body.append(dialog);
  const handlers=new AbortController();const {signal}=handlers;
  let player=null, disposed=false;
  function speaking(value){stage.dataset.speaking=String(value);play.textContent=value?'목소리 멈추기':'목소리 다시 듣기';play.setAttribute('aria-pressed',String(value));}
  function stop(){
    const old=player;player=null;
    if(old){old.pause();old.removeAttribute('src');old.load();}
    quiet(false);speaking(false);
  }
  async function start(){
    if(player){stop();return;}
    if(!enabled()||document.hidden){status.textContent='소리를 켜면 목소리를 들을 수 있어요.';return;}
    const audio=new Audio(src);player=audio;audio.preload='auto';status.textContent='';quiet(true);
    const live=fn=>()=>{if(player===audio)fn();};
    audio.addEventListener('playing',live(()=>speaking(true)),{signal});
    audio.addEventListener('waiting',live(()=>speaking(false)),{signal});
    audio.addEventListener('pause',live(()=>speaking(false)),{signal});
    audio.addEventListener('ended',live(stop),{once:true,signal});
    const fail=live(()=>{stop();status.textContent='음성을 재생하지 못했어요. 대화 글을 읽을 수 있어요.';});
    audio.addEventListener('error',fail,{once:true,signal});
    try{await audio.play();if(player===audio&&dialog.open&&enabled()&&!document.hidden)speaking(true);}
    catch{fail();}
  }
  function dispose(){
    if(disposed)return;disposed=true;
    handlers.abort();stop();dialog.remove();
    if(trigger?.isConnected)trigger.focus({preventScroll:true});
  }
  play.addEventListener('click',start,{signal});close.addEventListener('click',()=>dialog.close(),{signal});
  dialog.addEventListener('close',dispose,{once:true,signal});dialog.addEventListener('cancel',stop,{signal});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal});
  document.addEventListener('change',()=>{if(!enabled())stop();},{signal});
  window.addEventListener('pagehide',stop,{signal});
  dialog.showModal();close.focus({preventScroll:true});void start();
  return dispose;
}
