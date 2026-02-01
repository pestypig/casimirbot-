import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./index.css";

const buildStamp = import.meta.env.DEV
  ? `dev-${Date.now().toString()}`
  : typeof __APP_BUILD__ === "string"
    ? __APP_BUILD__
    : "prod";

const BUILD_STORAGE_KEY = "__helix_build_stamp";

// Stamp build token at app boot
(window as any).__APP_WARP_BUILD = buildStamp;

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
];

const extractErrorMessage = (value: unknown): string => {
  if (!value) return "";
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (typeof (value as { message?: unknown }).message === "string") {
    return String((value as { message?: unknown }).message);
  }
  return "";
};

const scheduleReloadOnce = () => {
  if (typeof window === "undefined") return;
  const reloadKey = `__helix_reload_${buildStamp}`;
  try {
    if (window.sessionStorage.getItem(reloadKey) === "1") return;
    window.sessionStorage.setItem(reloadKey, "1");
  } catch {
    // ignore session storage errors
  }
  window.location.reload();
};

const clearRuntimeCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
};

const unregisterServiceWorkers = async () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister()));
};

const syncBuildStamp = async () => {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(BUILD_STORAGE_KEY);
    if (stored && stored !== buildStamp) {
      await Promise.all([clearRuntimeCaches(), unregisterServiceWorkers()]);
      window.localStorage.setItem(BUILD_STORAGE_KEY, buildStamp);
      scheduleReloadOnce();
      return;
    }
    if (!stored) {
      window.localStorage.setItem(BUILD_STORAGE_KEY, buildStamp);
    }
  } catch {
    // ignore storage/caching failures
  }
};

const shouldAutoReload = (value: unknown): boolean => {
  if (import.meta.env?.DEV) return false;
  const message = extractErrorMessage(value);
  if (!message) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const errEvent = event as ErrorEvent;
    const candidate = errEvent?.error ?? errEvent?.message ?? event;
    if (shouldAutoReload(candidate)) {
      scheduleReloadOnce();
    }
  });
  window.addEventListener("unhandledrejection", (event) => {
    const rejection = event as PromiseRejectionEvent;
    const candidate = rejection?.reason ?? event;
    if (shouldAutoReload(candidate)) {
      scheduleReloadOnce();
    }
  });
}

if (typeof window !== "undefined" && import.meta.env?.PROD) {
  void syncBuildStamp();
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);

if (typeof window !== "undefined" && Boolean(import.meta.env?.DEV)) {
  // Ensure dev doesn't get stuck on a stale service worker or cached shell.
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }
  } catch {
    // ignore dev cleanup failures
  }
  try {
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  } catch {
    // ignore dev cleanup failures
  }
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const isProd = Boolean(import.meta.env?.PROD);
  const isLocalhost = Boolean(
    window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]"
  );
  const isSecure = window.location.protocol === "https:" || isLocalhost;
  if (isProd && isSecure) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`/mobile-sw.js?v=${encodeURIComponent(buildStamp)}`, {
          updateViaCache: "none",
        })
        .then((reg) => {
          const reloadOnUpdate = () => {
            const waiting = reg.waiting;
            if (waiting) {
              waiting.postMessage({ type: "SKIP_WAITING" });
            }
          };
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                reloadOnUpdate();
              }
            });
          });
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            scheduleReloadOnce();
          });
          reloadOnUpdate();
          return reg.update();
        })
        .catch(() => {
          // no-op on failure
        });
    });
  }
}
