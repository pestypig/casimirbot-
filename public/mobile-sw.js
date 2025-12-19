const CACHE_NAME = "helix-mobile-shell-v1";
const CORE_ASSETS = ["/", "/mobile", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests: try network, fall back to cache (app shell)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/mobile").then((resp) => resp || caches.match("/")))
    );
    return;
  }

  // Cache-first for static assets we care about
  if (["script", "style", "font"].includes(req.destination)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return resp;
          })
      )
    );
    return;
  }
});
