// Offline cache for classroom Wi-Fi drops. scripts/build.mjs rewrites CACHE_VERSION and APP_SHELL in dist/sw.js.
const CACHE_VERSION='dev';
const CACHE=`ullim-city-${CACHE_VERSION}`;
const APP_SHELL=['/','/index.html','/manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ullim-city-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
const remember=(request,response)=>{if(response.ok&&response.type==='basic'){const copy=response.clone();void caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;};
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  // Concept films stream with range requests; partial 206 responses cannot use cache.put.
  if(request.headers.has('range')||request.destination==='video')return;
  // HTML: network first so a new deploy shows up, cache when offline.
  if(request.mode==='navigate'||request.destination==='document'){
    event.respondWith(fetch(request).then(response=>remember(request,response)).catch(()=>caches.match(request).then(hit=>hit||caches.match('/index.html'))));
    return;
  }
  // Everything else: cache first. A new CACHE_VERSION replaces the whole cache.
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>remember(request,response))));
});
