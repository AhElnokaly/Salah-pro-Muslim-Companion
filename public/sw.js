const CACHE_NAME = 'muslim-companion-cache-v1';

// Install Event: skip waiting immediately to activate right away
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event: clear ALL caches to prevent stale asset issues
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('[Service Worker] Clearing cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Direct pass-through, no caching or intercepting
self.addEventListener('fetch', (event) => {
  // Return early to let the browser fetch directly from the network
  return;
});
