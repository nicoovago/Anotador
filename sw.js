const CACHE='tablon-v3';
const ASSETS=['manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const isDoc=e.request.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html');
  // HTML siempre desde la red (network-first) para no servir versiones viejas
  if(isDoc){
    e.respondWith(
      fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>{try{c.put(e.request,copy)}catch(_){}});
        return res;
      }).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html')))
    );
    return;
  }
  // resto: cache-first
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>{try{c.put(e.request,copy)}catch(_){}});
      return res;
    }))
  );
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(list=>{
    for(const c of list){if('focus'in c)return c.focus()}
    if(clients.openWindow)return clients.openWindow('index.html');
  }));
});
