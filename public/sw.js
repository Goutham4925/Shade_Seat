// Service Worker
const CACHE_NAME = 'shadeseat-v7';
const CURRENT_COMMIT = '{{COMMIT_HASH}}'; // Will be replaced during build

// Core static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/build-info.json' // Add build info file
];

// Install event – pre-cache core assets
self.addEventListener('install', (event) => {
  // console.log('[SW] Installing for commit:', CURRENT_COMMIT);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Activate SW immediately
  );
});

// Activate event – remove old caches and check for server updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              // console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }
          })
        )
      ),
      // Check if server has new commit
      checkCommitVersion()
    ]).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event – network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Always try network first for HTML documents to get fresh content
      if (event.request.url.includes('/index.html') || event.request.mode === 'navigate') {
        return fetchWithCacheFallback(event);
      }
      
      if (cachedResponse) return cachedResponse;

      return fetchWithDynamicCaching(event);
    })
  );
});

// Network first with cache fallback (for HTML/navigation)
function fetchWithCacheFallback(event) {
  return fetch(event.request)
    .then((networkResponse) => {
      // Cache the fresh HTML response
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseClone);
      });
      return networkResponse;
    })
    .catch(() => {
      // Fallback to cache if network fails
      return caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Ultimate fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    });
}

// Cache first with network fallback (for assets)
function fetchWithDynamicCaching(event) {
  return fetch(event.request).then((networkResponse) => {
    try {
      // Cache successful responses for assets
      if (
        event.request.url.startsWith('http') &&
        (event.request.url.includes('/assets/') || 
         event.request.url.includes('/static/') ||
         event.request.destination === 'script' ||
         event.request.destination === 'style')
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
}

// --- COMMIT-BASED VERSION CHECKING ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    // console.log('[SW] Received update request');
    event.waitUntil(checkForUpdates());
  }
});

// Check if server has different commit
async function checkCommitVersion() {
  try {
    const response = await fetch('/build-info.json?' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) throw new Error('Build info check failed');
    
    const buildInfo = await response.json();
    
    if (buildInfo.commit !== CURRENT_COMMIT && CURRENT_COMMIT !== '{{COMMIT_HASH}}') {
      // console.log('[SW] New commit detected, clearing cache. Old:', CURRENT_COMMIT, 'New:', buildInfo.commit);
      await clearAllCaches();
      // Notify clients to reload
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_AVAILABLE',
            commit: buildInfo.commit,
            timestamp: buildInfo.timestamp
          });
        });
      });
      return true; // New version detected
    }
    console.log('[SW] Commit matches:', CURRENT_COMMIT);
    return false; // Same version
  } catch (error) {
    // console.log('[SW] Build info check failed, using cached version');
    return false;
  }
}

// Comprehensive update check
async function checkForUpdates() {
  try {
    const hasUpdate = await checkCommitVersion();
    if (!hasUpdate) {
      await updateCache();
    }
  } catch (error) {
    console.warn('[SW] Update check failed:', error);
  }
}

// Update cache (STATIC_ASSETS only)
async function updateCache() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    STATIC_ASSETS.map(async (url) => {
      try {
        const response = await fetch(url, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          await cache.put(url, response);
          // console.log('[SW] Updated cache for', url);
        }
      } catch (err) {
        console.warn('[SW] Failed to update', url, err);
      }
    })
  );
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  // console.log('[SW] All caches cleared due to new commit');
}