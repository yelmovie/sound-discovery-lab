// Prints errors and warnings from the newest `hyperframes check` report of a film folder.
const fs = require('fs'), path = require('path');
const dir = path.join(process.argv[2], '.hyperframes/artifacts/checks');
const f = fs.readdirSync(dir).filter(x => x.endsWith('.json') && !x.startsWith('._')).map(x => path.join(dir, x)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
const r = JSON.parse(fs.readFileSync(f, 'utf8'));
const out = [];
for (const k of ['lint', 'runtime', 'layout', 'motion', 'contrast', 'craft', 'audio']) {
  const sec = r[k]; if (!sec) continue;
  const items = sec.findings || sec.issues || sec.errors || sec.items || (Array.isArray(sec) ? sec : []);
  for (const x of items || []) out.push(`${k} ${x.severity || x.level || ''} ${x.code || x.rule || x.id || ''} | ${(x.message || x.text || '').slice(0, 150)} | ${x.selector || x.elementId || ''} ${x.time ?? x.t ?? ''}`);
}
console.log(JSON.stringify({ ok: r.ok, file: path.basename(f) }));
console.log(out.slice(0, 60).join('\n') || '(no findings)');
