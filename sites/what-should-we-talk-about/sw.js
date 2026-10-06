/* Offline-first service worker for What Should We Talk About? */
const CACHE = "wsta-v1";
const ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.json",
  "./data/funny.js", "./data/relationship.js", "./data/deep.js",
  "./data/random.js", "./data/cute.js", "./data/wouldyourather.js",
  "./data/memories.js", "./data/future.js", "./data/spicy.js",
  "./data/faith.js", "./data/travel.js", "./data/hypotheticals.js",
  "./data/learnnew.js", "./data/challenges.js", "./data/unhinged.js",
  "./data/games.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
