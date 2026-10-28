import { cp, mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assets } from '../src/data.js';
process.env.TEMP = process.env.TMP = 'D:\\DevTemp';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
await writeFile(path.join(root,'src/version.js'),`// Updated from package.json by scripts/build.mjs.\nexport const APP_VERSION = ${JSON.stringify(pkg.version)};\n`);
for (const file of ['challenges.js','map-world.js','settings-content.js','version.js','app.js','audio.js','map.js','model.js','data.js','concepts.js','companion.js','manipulations.js','progress.js','illustrations.js','samples.js']) execFileSync(process.execPath, ['--check', path.join(root,'src',file)]);
for (const file of assets) await stat(path.join(root,file));
await mkdir(path.join(root,'dist'),{recursive:true});
for (const file of ['index.html','src',...assets]) {
  await mkdir(path.dirname(path.join(root,'dist',file)),{recursive:true});
  await cp(path.join(root,file),path.join(root,'dist',file),{recursive:true});
}
console.log(`Build complete: dist · ${assets.length} assets · no dependencies`);
