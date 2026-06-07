const CACHE = 'linguaturb-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/pwa.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Cache addAll failed:', err);
        return Promise.all(
          ASSETS.map(url => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('translate.googleapis.com')) {
    e.respondWith(networkFirst(e.request));
    return;
  }
  e.respondWith(cacheFirst(e.request));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req).then(res => {
    if (res.ok) {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(req, clone));
    }
    return res;
  }).catch(() => new Response('Offline', { status: 503 }));
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(req, clone));
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response('Offline', { status: 503 });
  }
}
