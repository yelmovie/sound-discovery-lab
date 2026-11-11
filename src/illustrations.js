const names=['rubber-instrument','ruler-base','ruler-blade','travel-air','travel-water','travel-solid','library-noise','care-pad','care-volume','care-time','care-place','sound-parcel','drum-pad','string-telephone'];
export const conceptArtwork=Object.fromEntries(names.map(id=>[id,`image/generated/concepts/${id}.webp`]));
export const conceptArtAssets=[...Object.values(conceptArtwork),'image/generated/concepts/manifest.json'];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function art(id,alt='',className=''){
 const src=conceptArtwork[id];
 return src?`<img class="concept-art ${escape(className)}" src="/${src}" alt="${escape(alt)}" loading="lazy" decoding="async" draggable="false">`:'';
}
export function rulerIllustration(length=18){
 const n=[6,12,18].includes(Number(length))?Number(length):18;
 return `<span class="illustrated-ruler tool-svg ruler-key" role="img" aria-label="책상에 고정한 같은 자, 책상 밖에서 떨리는 길이 ${n} 센티미터" style="--free:${n/18}"><span class="ruler-model" aria-hidden="true"><span class="ruler-blade-window vibrating-part"><span class="ruler-blade-texture"></span></span>${art('ruler-base','','ruler-base-art')}<span class="ruler-edge"></span><span class="ruler-measure"></span><svg class="ruler-motion-arrow" viewBox="0 0 20 34" fill="none"><path d="M10 3v28M4 9l6-6 6 6M4 25l6 6 6-6"/></svg></span><span class="ruler-caption" aria-hidden="true"><span>책상에 고정</span><span>떨리는 부분</span></span></span>`;
}
