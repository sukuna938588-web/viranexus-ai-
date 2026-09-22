// ViraNexus AI Service Worker for offline capability
const CACHE_NAME = 'viranexus-ai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  // Bypass Vite development paths, HMR, and API endpoints
  if (
    url.includes('/api/') ||
    url.includes('/@vite/') ||
    url.includes('/src/') ||
    url.includes('node_modules')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(async () => {
          if (event.request.destination === 'document') {
            const fallback = await caches.match('/');
            if (fallback) return fallback;
          }
          // Return an empty 503 response instead of resolving to undefined
          return new Response('Network unavailable', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
