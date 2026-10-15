/* FocusFlow service worker — jaringan dulu, cadangan dari cache (offline penuh) */
const CACHE="focusflow-v1.0.3";
const ASSETS=["./","index.html","styles.css","improve.css","ux.css","paper.css","core.js","goals-tasks.js","habits-focus.js","init.js","improve.js","paper.js","focus-plus.js","manifest.webmanifest","icon.svg"];
/* Aset di-cache satu per satu: satu berkas gagal/hilang tidak membatalkan pemasangan service worker */
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(ASSETS.map(a=>c.add(a)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html")))
  );
});
