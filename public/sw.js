// Service worker Courses Pro : l'appli démarre et fonctionne sans réseau (au magasin).
// La liste des fichiers de l'appli (__FICHIERS__) et la version sont injectées au moment du build.
const VERSION = '__VERSION__';
const CACHE = 'courses-pro-' + VERSION;
const FICHIERS = __FICHIERS__;
const BASE = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  // Tout est mis en cache dès l'installation : plus besoin d'avoir ouvert chaque écran en ligne
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([...new Set([...BASE, ...FICHIERS])])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('courses-pro-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Réseau avec délai max : si le réseau ne répond pas (réseau faible au magasin), on prend le cache
function reseauOuCache(req, cleCache, delai) {
  return new Promise(resolve => {
    let fini = false;
    const depuisCache = () => caches.match(cleCache).then(r => r || caches.match('/index.html'));
    const minuterie = setTimeout(() => {
      depuisCache().then(r => { if (r && !fini) { fini = true; resolve(r); } });
    }, delai);
    fetch(req).then(r => {
      if (r.ok) { const copie = r.clone(); caches.open(CACHE).then(c => c.put(cleCache, copie)); }
      if (!fini) { fini = true; clearTimeout(minuterie); resolve(r); }
    }).catch(() => {
      clearTimeout(minuterie);
      depuisCache().then(r => { if (!fini) { fini = true; resolve(r || Response.error()); } });
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Pages : réseau d'abord (3 s max), sinon la version en cache
  if (req.mode === 'navigate') {
    e.respondWith(reseauOuCache(req, '/', 3000));
    return;
  }
  // Fichiers de l'appli et polices : cache d'abord
  if (url.origin === location.origin || url.hostname.includes('fonts.g')) {
    e.respondWith(caches.match(req, { ignoreSearch: url.origin === location.origin }).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copie = r.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      return r;
    })));
  }
});
