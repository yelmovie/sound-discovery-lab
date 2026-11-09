import { cp, mkdir, stat, readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assets, backgrounds } from '../src/data.js';
// Windows (D: SSD) keeps temp files off the internal drive; other systems keep their own TMPDIR.
if (process.platform === 'win32') process.env.TEMP = process.env.TMP = 'D:\\DevTemp';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
await writeFile(path.join(root,'src/version.js'),`// Updated from package.json by scripts/build.mjs.\nexport const APP_VERSION = ${JSON.stringify(pkg.version)};\n`);
for (const file of ['challenges.js','map-world.js','settings-content.js','version.js','app.js','audio.js','map.js','model.js','data.js','concepts.js','companion.js','manipulations.js','progress.js','illustrations.js','samples.js','experiment-player.js']) execFileSync(process.execPath, ['--check', path.join(root,'src',file)]);
for (const file of assets) await stat(path.join(root,file));
for (const file of ['sw.js','manifest.webmanifest','image/og/ullim-og.jpg','image/icons/icon-192.png','image/icons/icon-512.png']) await stat(path.join(root,file));
await mkdir(path.join(root,'dist'),{recursive:true});
const shareAssets=['image/og/ullim-og.jpg','image/icons/icon-192.png','image/icons/icon-512.png'];
for (const file of ['index.html','src','sw.js','manifest.webmanifest',...shareAssets,...assets]) {
  await mkdir(path.dirname(path.join(root,'dist',file)),{recursive:true});
  await cp(path.join(root,file),path.join(root,'dist',file),{recursive:true,filter:source=>!path.basename(source).startsWith('._')});
}
// Precache the code, title, map and interface sounds; lesson art caches as students reach it.
const sources=(await readdir(path.join(root,'src'))).filter(file=>!file.startsWith("._")&&/\.(js|css)$/.test(file)).map(file=>`/src/${file}`);
const shell=['/','/index.html','/manifest.webmanifest',...sources,...assets.filter(file=>/^(image\/(branding|generated\/(ullim-village|explorer-walk|bird-walk|pio-guide))|media\/audio\/.*\.(ogg|m4a)$)/.test(file)).map(file=>`/${file}`),...shareAssets.filter(file=>file.includes('icons')).map(file=>`/${file}`),`/${backgrounds[1]}`];
const swPath=path.join(root,'dist','sw.js'),sw=await readFile(swPath,'utf8');
const stamped=sw.replace("const CACHE_VERSION='dev';",`const CACHE_VERSION='${pkg.version}-${Date.now().toString(36)}';`).replace("const APP_SHELL=['/','/index.html','/manifest.webmanifest'];",`const APP_SHELL=${JSON.stringify(shell)};`);
if(stamped===sw||!stamped.includes(`'${pkg.version}-`))throw new Error('sw.js CACHE_VERSION/APP_SHELL markers not found.');
await writeFile(swPath,stamped);
for(const url of shell)if(url!=='/')await stat(path.join(root,'dist',url)).catch(()=>{throw new Error(`Precache file missing in dist: ${url}`);});
console.log(`Build complete: dist · ${assets.length} assets · ${shell.length} precached · no dependencies`);
