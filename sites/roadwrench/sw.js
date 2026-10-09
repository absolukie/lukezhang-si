/* RoadWrench service worker: cache the app shell so it opens with no signal. */
const CACHE = "roadwrench-v4"; /* bump when shipping app changes, or repeat visits keep the stale shell */
const PRECACHE = [
  "app.html", "style.css", "app.js", "sync.js", "auth-ui.js", "billing-ui.js",
  "manifest.json", "index.html", "icon-192.png", "icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("app.html"));
    })
  );
});
