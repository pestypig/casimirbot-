import { createRoot } from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import "./index.css";

const buildStamp = import.meta.env.DEV
  ? `dev-${Date.now().toString()}`
  : typeof __APP_BUILD__ === "string"
    ? __APP_BUILD__
    : "prod";

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
        .then((reg) => reg.update())
        .catch(() => {
          // no-op on failure
        });
    });
  }
}
