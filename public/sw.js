// Increment cache version on every deploy
const CACHE_NAME = 'sunsafe-v5';

// Core static assets to pre-cache
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
      .then(() => self.skipWaiting()) // Activate SW immediately
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
    ).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event – cache first, network fallback, dynamic caching for assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Clone the response immediately for caching
          const responseClone = networkResponse.clone();

          // Dynamically cache all /assets/ requests
          if (event.request.url.includes('/assets/')) {
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              })
            );
          }

          return networkResponse;
        })
        .catch(() => {
          // Optional: fallback for navigation requests if offline
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
