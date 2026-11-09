// Shared data for the five 「삐오의 소리 노트」 concept films.
// Captions come straight from the app (src/concepts.js) so the film, the VTT track and the
// highlighted transcript can never drift apart. Scene boundaries match the app's cue clock
// (src/app.js: Math.floor(currentTime / 4)).
import { concepts } from '../src/concepts.js';

export const DURATION = 16;
export const CUES = [0, 4, 8, 12];
export const W = 1920, H = 1080;

// Colours are the app's own tokens (src/style.css :root).
export const C = {
  ink: '#17394b', teal: '#086a73', cyan: '#bceced', orange: '#ffbd58', paper: '#fffdf3',
  line: '#bad0c8', ground: '#eef4e8', grid: '#e4ede0', soft: '#486675', warm: '#c76a1c'
};

// Effect sounds are the game's own CC0 recordings (media/audio/experiments/sources.json).
// Loudness is shown by gain only; pitch by playback rate exactly as src/audio.js does
// (ruler reference 260 Hz: 18 cm = 260 Hz → ×1, 6 cm = 650 Hz → ×2.5).
const RULER_LEVEL = 'acompressor=threshold=-30dB:ratio=6:attack=1:release=150:makeup=10dB,alimiter=limit=0.8';
export const SFX = {
  fork: { from: 'media/audio/experiments/fork.ogg' },
  drum: { from: 'media/audio/experiments/drum.ogg' },
  wood: { from: 'media/audio/place_wood.ogg' },
  // The ruler recording is a sharp click with a quiet ring, so both lengths get the SAME gentle compression
  // (equal force stays equal); only the short one is sped up ×2.5 for the higher pitch.
  'ruler-long': { from: 'media/audio/experiments/ruler.ogg', filter: `${RULER_LEVEL}` },
  'ruler-short': { from: 'media/audio/experiments/ruler.ogg', filter: `asetrate=44100*2.5,aresample=44100,${RULER_LEVEL}` },
  'wood-pad': { from: 'media/audio/place_wood.ogg', filter: 'lowpass=f=650,volume=0.35' }
};

const question = {
  vibration: '소리는 어떻게 생길까?',
  volume: '북소리를 크게 내려면?',
  pitch: '자의 소리를 높이려면?',
  travel: '소리는 무엇을 따라 올까?',
  care: ''
};

export const films = concepts.map(c => ({
  id: c.id,
  title: c.title,
  summary: c.summary,
  question: question[c.id],
  captions: c.cues
}));
