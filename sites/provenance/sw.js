/* Provenance service worker: app-shell caching for warehouse/offline capture.
 * Strategy: cache-first for the app shell, stale-while-revalidate for HTML
 * documents so deploys propagate, offline fallback for navigations. */
'use strict';
const CACHE = 'provenance-v1';
const SHELL = [
  './',
  'index.html',
  'app.html',
  'privacy.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'sync.js',
  'auth-ui.js',
  'billing-ui.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    // Stale-while-revalidate for documents: fast paint, fresh on next load.
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network.then(res => res || offlinePage());
      })
    );
    return;
  }

  // Cache-first for the rest of the app shell.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});

function offlinePage() {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Provenance is offline</title></head>' +
    '<body style="font-family:system-ui;background:#FAF7F1;color:#1C1917;padding:40px 24px;text-align:center">' +
    '<h1 style="font-family:Georgia,serif;font-weight:500">You are offline.</h1>' +
    '<p>Your records are stored on this device. Reconnect to sync or reload the app.</p>' +
    '</body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
