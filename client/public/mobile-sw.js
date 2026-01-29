const CACHE_NAME = "helix-mobile-shell-v2";
const OFFLINE_ASSETS = [
  "/",
  "/mobile",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/helix-icon-192.png",
  "/icons/helix-icon-512.png",
  "/icons/helix-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Network-first for navigation; fall back to cached shell for offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html", { cacheName: CACHE_NAME }))
    );
    return;
  }

  // Cache-first for static same-origin assets; otherwise let the request pass through.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request, { cacheName: CACHE_NAME }).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
