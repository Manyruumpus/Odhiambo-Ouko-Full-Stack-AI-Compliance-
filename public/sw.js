// public/sw.js
self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { clients.claim(); });

// Workbox CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  const { registerRoute } = workbox.routing;
  const { NetworkOnly } = workbox.strategies;
  const { BackgroundSyncPlugin } = workbox.backgroundSync;

  const bgSync = new BackgroundSyncPlugin('mint-queue', {
    maxRetentionTime: 24 * 60 // minutes
  });

  // Queue /api/mint when offline; replay when back online
  registerRoute(
    ({ url, request }) => request.method === 'POST' && url.pathname === '/api/mint',
    new NetworkOnly({ plugins: [bgSync] }),
    'POST'
  );
}
