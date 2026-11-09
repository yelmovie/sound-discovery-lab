// Renders each film with HyperFrames, then encodes the app copy (same path and name as before):
// media/concepts/<id>.mp4 (1280×720, 30 fps, H.264 + AAC, faststart) and the poster <id>.jpg (the answer scene).
// Run: TMPDIR=<external SSD tmp> node films/render-films.mjs [id]
// Render frames and intermediate files stay in $TMPDIR; only the final files go into media/concepts/.
import { execFileSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { films, DURATION } from './films.data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const tmp = process.env.TMPDIR;
if (!tmp || !tmp.startsWith('/Volumes/')) throw new Error('Set TMPDIR to a folder on the external SSD first.');
const out = join(tmp, 'film-renders');
await mkdir(out, { recursive: true });
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' };
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }).toString();

const only = process.argv[2];
for (const f of films.filter(x => !only || x.id === only)) {
  const dir = join(here, f.id), raw = join(out, `${f.id}.mp4`);
  run('hyperframes', ['render', '--quality', 'delivery', '-o', raw], dir);
  const app = join(root, 'media/concepts', `${f.id}.mp4`), poster = join(root, 'media/concepts', `${f.id}.jpg`);
  run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-vf', 'scale=1280:720:flags=lanczos', '-r', '30', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'slow', '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-movflags', '+faststart', '-t', String(DURATION), app]);
  run('ffmpeg', ['-v', 'error', '-y', '-ss', String(DURATION - .3), '-i', raw, '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '3', poster]);
  const dur = +run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', app]);
  console.log(JSON.stringify({ id: f.id, duration: dur, mp4KB: Math.round((await stat(app)).size / 1024), posterKB: Math.round((await stat(poster)).size / 1024) }));
}
