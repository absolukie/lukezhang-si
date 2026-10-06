/* Dictation Pad service worker — caches the app shell only.
   Model files (jsdelivr / huggingface) are intentionally NOT cached here;
   transformers.js manages its own model cache in the Cache API. */
const CACHE = 'dictation-pad-v1';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Same-origin app shell: cache-first, fall back to network.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request))
    );
  }
  // Cross-origin (CDN libs, model weights): straight to network.
});
