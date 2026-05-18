const CACHE_NAME = 'omtogel-premium-v4';
const ASSETS = ['/', '/offline', '/assets/css/style.css', '/assets/js/app.js', '/icons/icon-192.svg', '/icons/icon-512.svg'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/offline'))));
});
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { notification: { title: 'OMTOGEL', body: event.data ? event.data.text() : '' } }; }
  const n = data.notification || data;
  event.waitUntil(self.registration.showNotification(n.title || 'OMTOGEL', { body: n.body || 'Notifikasi baru', icon: '/icons/icon-192.svg', badge: '/icons/icon-192.svg', data: data.data || { url: '/' } }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) { if ('focus' in client) { client.navigate(url); return client.focus(); } }
    return clients.openWindow(url);
  }));
});
