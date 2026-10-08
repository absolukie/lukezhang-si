/* Curbside offline app shell. Versioned cache: bump SW_VERSION to ship a new shell.
 * Navigations are network-first with a cache fallback (fresh HTML, offline relaunch);
 * static assets are cache-first. Local state lives in localStorage and is never touched. */
const SW_VERSION = 'curbside-shell-v1';
const STATIC = ['./', 'app.html', 'styles.css', 'app.js', 'sync.js', 'auth-ui.js', 'billing-ui.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SW_VERSION).then(c => c.addAll(STATIC)));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SW_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(SW_VERSION).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match('app.html').then(m => m || caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) {
        const copy = r.clone();
        caches.open(SW_VERSION).then(c => c.put(e.request, copy));
      }
      return r;
    }))
  );
});
