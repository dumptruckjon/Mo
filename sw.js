// Service worker for Mo's site — makes it installable and work offline.
// Strategy: NETWORK-FIRST so online visitors always get fresh content (no stale
// caching bugs), with a cache fallback when offline. The cache name is versioned
// (__BUILD__ is rewritten to the commit SHA at deploy time), and old caches are
// purged on activate.

const VERSION = "__BUILD__";
const CACHE = `mo-${VERSION}`;
const CORE = [
  "./",
  "./index.html",
  "./festival.html",
  "./styles/main.css",
  "./scripts/content.js",
  "./scripts/quiz.js",
  "./scripts/main.js",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
