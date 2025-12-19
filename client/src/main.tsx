import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Stamp build token at app boot
(window as any).__APP_WARP_BUILD = 'dev-patched-' + Date.now().toString();

createRoot(document.getElementById("root")!).render(<App />);

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
        .register("/mobile-sw.js")
        .catch(() => {
          // no-op on failure
        });
    });
  }
}
