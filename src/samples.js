// Pitch references are playback controls; the game does not show measured Hz/dB.
export const instrumentSamples={
 drum:{src:'/media/audio/experiments/drum.ogg',pitch:false,reference:150},
 rubber:{src:'/media/audio/experiments/rubber.ogg',pitch:false,reference:330},
 ruler:{src:'/media/audio/experiments/ruler.ogg',pitch:true,reference:260},
 fork:{src:'/media/audio/experiments/fork.ogg',pitch:true,reference:440},
 solid:{src:'/media/audio/place_wood.ogg',pitch:false,reference:440},
 music:{src:'/media/audio/restore_chime.ogg',pitch:false,reference:523.25}
};
export const recordedAudioAssets=[...Object.values(instrumentSamples).map(s=>s.src.slice(1)),'media/audio/experiments/sources.json','media/audio/experiments/VCSL-LICENSE.txt'];
export function transferSound(medium,level=.4){return {kind:medium==='air'?'drum':medium==='water'?'fork':'solid',frequency:medium==='air'?150:440,level};}
