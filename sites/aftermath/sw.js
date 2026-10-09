/* Aftermath offline shell.
 * Network-first for the app shell: online users always get the freshest
 * bytes, and with zero network the cached shell still opens. Cross-origin
 * API calls (sync, billing) are never cached.
 * Cache is versioned; a new worker drops the old cache on activate. */
"use strict";
var CACHE = "aftermath-shell-v1";
var SHELL = [
  "./",
  "index.html",
  "app.html",
  "privacy.html",
  "css/style.css",
  "js/app.js",
  "js/sync.js",
  "js/auth-ui.js",
  "billing-ui.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){ /* offline at install: pages still work, shell caches later */ })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k.indexOf("aftermath-shell-") === 0 && k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never cache API calls
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(req, {ignoreSearch: false}).then(function(hit){
        if (hit) return hit;
        // Navigation with no cached page (e.g. first-ever load offline):
        // fall back to the app shell entry.
        if (req.mode === "navigate") return caches.match("app.html");
      });
    })
  );
});
