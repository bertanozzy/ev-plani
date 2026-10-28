/* Ev Planı · servis çalışanı: hızlı/çevrimdışı açılış ve telefon bildirimleri */
const SURUM='evp-1';
const DOSYALAR=['./','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(SURUM).then(c=>c.addAll(DOSYALAR)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(l=>Promise.all(l.filter(k=>k!==SURUM).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url); if(u.origin!==location.origin || !u.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const sayfa=r.mode==='navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html');
  if(sayfa){
    // Saklı sayfayla anında aç, arkadan yenisini al (bir sonraki açılışta kullanılır)
    const taze=fetch(r).then(y=>{ if(y.ok){ const k=y.clone(); caches.open(SURUM).then(c=>c.put('./',k)); } return y; });
    e.respondWith(caches.match('./').then(c=>c||taze).catch(()=>taze));
    e.waitUntil(taze.catch(()=>{}));
    return;
  }
  e.respondWith(caches.match(r).then(c=>c||fetch(r)));
});
self.addEventListener('push',e=>{
  let d={}; try{ d=e.data?e.data.json():{}; }catch(_){ d={mesaj:e.data?e.data.text():''}; }
  e.waitUntil(self.registration.showNotification(d.baslik||'Ev Planı',{
    body:d.mesaj||'', icon:'icon-192.png', badge:'icon-192.png', tag:d.tag||undefined, data:{ev:d.ev||''}
  }));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const ev=(e.notification.data||{}).ev||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){ if('focus' in c){ if(ev) c.postMessage({evp:'ev',ev:ev}); return c.focus(); } }
    return self.clients.openWindow('./'+(ev?'?ev='+encodeURIComponent(ev):''));
  }));
});
