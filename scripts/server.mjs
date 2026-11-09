import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows (D: SSD) keeps temp files off the internal drive; other systems keep their own TMPDIR.
if (process.platform === 'win32') process.env.TEMP = process.env.TMP = 'D:\\DevTemp';
const project = fileURLToPath(new URL('../', import.meta.url));
const root = process.argv.includes('--dist') ? path.join(project, 'dist') : project;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json', '.webmanifest':'application/manifest+json', '.mp4':'video/mp4', '.vtt':'text/vtt; charset=utf-8', '.ogg':'audio/ogg', '.m4a':'audio/mp4', '.wav':'audio/wav' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (req,res) => {
  try {
    const route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (route === '/' ? '/index.html' : route));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !/^(index\.html$|sw\.js$|manifest\.webmanifest$|src[\\/]|image[\\/]|media[\\/])/.test(relative)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    const headers={'Content-Type':types[path.extname(file)] || 'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Accept-Ranges':'bytes'};
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=0,end=info.size-1;
      if(!match||!match[1]&&!match[2]){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      else start=Math.max(0,info.size-Number(match[2]));
      if(!Number.isSafeInteger(start)||start>=info.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${info.size}`});
      if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
    }else{res.writeHead(200,headers);if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);}
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`울림도시 대작전: http://127.0.0.1:${port} (${process.argv.includes('--dist') ? 'build' : 'source'})`));
