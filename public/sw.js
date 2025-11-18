const CACHE_NAME = 'sunsafe-v6';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png'
];

// Install event – pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event – remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event – cache first, network fallback, dynamic caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Only try to cache if response is ok and type is basic/opaque
        try {
          if (event.request.url.includes('/assets/')) {
            const responseClone = networkResponse.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
            );
          }
        } catch (err) {
          console.warn('SW caching skipped for', event.request.url, err);
        }

        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('/');
      });
    })
  );
});
