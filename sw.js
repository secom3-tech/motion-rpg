// Network-first for live gameplay prevents old installed PWA caches from serving
// obsolete weapon, controller or UI code after the next release.
const CACHE = "motion-rpg-v0.44.1";
const ASSETS = ["./", "./preview.html?v=0.44.1", "./indoor.html?v=0.44.1", "./controller.html?v=0.44.1", "./manifest.webmanifest", "./icons/icon.svg"];
self.addEventListener("install", event => event.waitUntil(
 caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));
self.addEventListener("activate", event => event.waitUntil(
 caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("motion-rpg-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", event => {
 if(event.request.method !== "GET")return;
 const url = new URL(event.request.url);
 if(url.origin !== self.location.origin)return;
 const dynamic = /\.(?:html|mjs|js)$/.test(url.pathname) || url.pathname.endsWith("/motion-rpg/");
 if(dynamic){
  event.respondWith(fetch(event.request).then(response => {
   if(response.ok){
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
   }
   return response;
  }).catch(()=>caches.match(event.request)));
 }else{
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
   return response;
  })));
 }
});
