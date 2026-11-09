// Pitch references are playback controls; the game does not show measured Hz/dB.
// gain evens out the recordings (0.5 s RMS: fork -8, drum -15, wood -23, ruler -29, rubber -35 dBFS) so a medium or
// object never sounds louder just because of its recording; ruler/rubber stay capped to avoid clipping at full force.
export const instrumentSamples={
 drum:{src:'/media/audio/experiments/drum.ogg',pitch:false,reference:150,gain:1},
 rubber:{src:'/media/audio/experiments/rubber.ogg',pitch:false,reference:330,gain:2},
 ruler:{src:'/media/audio/experiments/ruler.ogg',pitch:true,reference:260,gain:2},
 fork:{src:'/media/audio/experiments/fork.ogg',pitch:true,reference:440,gain:.46},
 solid:{src:'/media/audio/place_wood.ogg',pitch:false,reference:440,gain:2.2},
 music:{src:'/media/audio/restore_chime.ogg',pitch:false,reference:523.25}
};
export const recordedAudioAssets=[...Object.values(instrumentSamples).map(s=>s.src.slice(1)),'media/audio/experiments/sources.json','media/audio/experiments/VCSL-LICENSE.txt'];
export function transferSound(medium,level=.4){return {kind:medium==='air'?'drum':medium==='water'?'fork':'solid',frequency:medium==='air'?150:440,level};}
