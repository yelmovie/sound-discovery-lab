import { cp, mkdir, stat, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assets, backgrounds, titleBackground, runStageAssets, runStageModels, rewardCardAssets } from '../src/data.js';
// Windows (D: SSD) keeps temp files off the internal drive; other systems keep their own TMPDIR.
if (process.platform === 'win32') process.env.TEMP = process.env.TMP = 'D:\\DevTemp';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
await writeFile(path.join(root,'src/version.js'),`// Updated from package.json by scripts/build.mjs.\nexport const APP_VERSION = ${JSON.stringify(pkg.version)};\n`);
for (const file of await readdir(path.join(root, 'src'))) {
  if (file.endsWith('.js') && !file.startsWith('._')) {
    execFileSync(process.execPath, ['--check', path.join(root, 'src', file)]);
  }
}
for (const file of assets) await stat(path.join(root,file));
for (const file of ['sw.js','manifest.webmanifest','image/og/ullim-og.jpg','image/icons/icon-192.png','image/icons/icon-512.png']) await stat(path.join(root,file));
// A fresh output prevents artwork from earlier builds leaking into production.
await rm(path.join(root,'dist'),{recursive:true,force:true});
await mkdir(path.join(root,'dist'),{recursive:true});
const shareAssets=['image/og/ullim-og.jpg','image/icons/icon-192.png','image/icons/icon-512.png'];
for (const file of ['index.html','src','sw.js','manifest.webmanifest',...shareAssets,...assets,'assets/map-encounters/map-finale.mp4','assets/ui/certificate-wax-seal-20261123.webp']) {
  await mkdir(path.dirname(path.join(root,'dist',file)),{recursive:true});
  await cp(path.join(root,file),path.join(root,'dist',file),{recursive:true,filter:source=>!path.basename(source).startsWith('._')});
}
// Merge the existing sheets in cascade order; their relative paths still resolve from /src.
const htmlPath=path.join(root,'dist','index.html'),html=await readFile(htmlPath,'utf8');
const links=[...html.matchAll(/<link rel="stylesheet" href="\.?\/(src\/[^"]+\.css)">/g)];
const css=(await Promise.all(links.map(([,file])=>readFile(path.join(root,file),'utf8')))).join('\n');
await writeFile(path.join(root,'dist','src','app.css'),css);
let built=html.replace(links[0][0],'<link rel="stylesheet" href="/src/app.css">');
for(const [link] of links.slice(1))built=built.replace(link,'');
await writeFile(htmlPath,built);
// Precache only the static startup graph; route code and map art are cached on first use.
const sources=new Set();
async function addModule(file){
 if(sources.has(file))return;
 sources.add(file);
 const source=await readFile(path.join(root,file.slice(1)),'utf8');
 for(const [,specifier] of source.matchAll(/^\s*(?:(?:import|export)\s+[^'";]*?\bfrom\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/gm)){
  await addModule(path.posix.join(path.posix.dirname(file),specifier));
 }
}
await addModule('/src/app.js');
// The 3D run stage is imported on demand, so the walk above never reaches it. Precache it for offline classrooms.
const runStage=['/src/run-stage.js','/src/run-stage-rules.js','/src/run-input.js','/src/run-character.js','/src/run-stage-hud.js','/src/map-controls.js','/src/vendor/three/three.module.min.js','/src/vendor/three/GLTFLoader.js','/src/vendor/three/BufferGeometryUtils.js','/src/vendor/three/meshopt_decoder.module.js','/image/generated/explorer-walk-lite.webp','/image/generated/concepts/pio-fly.webp',...runStageAssets.map(file=>`/${file}`),...runStageModels.map(file=>`/${file}`)];
// Achievement card pictures appear the moment a map villain is driven off, so they are precached too.
const shell=['/','/index.html','/manifest.webmanifest','/src/app.css',...new Set([...sources,...runStage]),...rewardCardAssets.map(file=>`/${file}`),...assets.filter(file=>/^(image\/(branding|generated\/pio-guide)|media\/audio\/.*\.(ogg|m4a)$|media\/audio\/sfx\/)/.test(file)||file.startsWith('media/fonts/')).map(file=>`/${file}`),...shareAssets.filter(file=>file.includes('icons')).map(file=>`/${file}`),`/${backgrounds[1]}`,`/${titleBackground}`];
const swPath=path.join(root,'dist','sw.js'),sw=await readFile(swPath,'utf8');
const stamped=sw.replace("const CACHE_VERSION='dev';",`const CACHE_VERSION='${pkg.version}-${Date.now().toString(36)}';`).replace("const APP_SHELL=['/','/index.html','/manifest.webmanifest'];",`const APP_SHELL=${JSON.stringify(shell)};`);
if(stamped===sw||!stamped.includes(`'${pkg.version}-`))throw new Error('sw.js CACHE_VERSION/APP_SHELL markers not found.');
await writeFile(swPath,stamped);
for(const url of shell)if(url!=='/')await stat(path.join(root,'dist',url)).catch(()=>{throw new Error(`Precache file missing in dist: ${url}`);});
console.log(`Build complete: dist · ${assets.length} assets · ${shell.length} precached · no dependencies`);
