// Service worker Courses Pro : fonctionne hors connexion (au magasin, sans réseau)
const CACHE = 'courses-pro-v1.2.0';
const BASE = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Pages : réseau d'abord, cache si hors ligne (garde les paramètres de partage)
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copie = r.clone(); caches.open(CACHE).then(c => c.put('/', copie)); return r; })
      .catch(() => caches.match('/').then(r => r || caches.match('/index.html'))));
    return;
  }
  // Fichiers statiques et polices : cache d'abord
  if (url.origin === location.origin || url.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copie = r.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      return r;
    })));
  }
});
