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
const remember=(event,response)=>{if(response.ok&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));}return response;};
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  // Concept films stream with range requests; partial 206 responses cannot use cache.put.
  if(request.headers.has('range')||request.destination==='video')return;
  // HTML: network first so a new deploy shows up, cache when offline.
  if(request.mode==='navigate'||request.destination==='document'){
    event.respondWith(fetch(request).then(response=>remember(event,response)).catch(()=>caches.match(request).then(hit=>hit||caches.match('/index.html'))));
    return;
  }
  // App code (scripts, styles, data files): network first, so a reload always picks up a new deploy even if
  // an edge briefly served an older copy while the cache was filled. The cache is only the offline fallback.
  if(request.destination==='script'||request.destination==='style'||/\.(js|mjs|css|json)$/.test(new URL(request.url).pathname)){
    event.respondWith(fetch(request,{cache:'no-cache'}).then(response=>remember(event,response)).catch(()=>caches.match(request)));
    return;
  }
  // Pictures, sounds and fonts: cache first. A new CACHE_VERSION replaces the whole cache.
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>remember(event,response))));
});
