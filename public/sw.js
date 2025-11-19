// Service Worker
const CACHE_NAME = 'shadeseat-v7';

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

// Fetch event – cache first, network fallback, dynamic caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        try {
          // Only cache http/https requests in /assets/
          if (
            event.request.url.startsWith('http') &&
            event.request.url.includes('/assets/')
          ) {
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
        // Fallback for navigation requests (offline)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// --- 12-HOUR UPDATE CHECK: Triggered by message from main page ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    console.log('[SW] Received update request');
    event.waitUntil(updateCache());
  }
});

// Update cache (STATIC_ASSETS only)
async function updateCache() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    STATIC_ASSETS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log('[SW] Updated cache for', url);
        }
      } catch (err) {
        console.warn('[SW] Failed to update', url, err);
      }
    })
  );
}
