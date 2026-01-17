const CACHE_VERSION = new URL(self.location.href).searchParams.get("v") || "v2";
const CACHE_NAME = `helix-mobile-shell-${CACHE_VERSION}`;
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
  if (req.method !== "GET") return;

  // Navigation requests: try network, fall back to cache (app shell)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/mobile").then((resp) => resp || caches.match("/")))
    );
    return;
  }

  // Network-first for static assets to avoid stale bundles
  if (["script", "style", "font"].includes(req.destination)) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
});
