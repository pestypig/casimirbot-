import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, type Server } from "http";
import { registerMetricsEndpoint, metrics } from "./metrics";
import { jwtMiddleware } from "./auth/jwt";

type LatticeWatcherHandle = {
  close(): Promise<void>;
  getVersion(): number;
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
registerMetricsEndpoint(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, "..", "docs");

let appReady = false;
let serverInstance: Server | null = null;
let latticeWatcher: LatticeWatcherHandle | null = null;
let shuttingDown = false;
const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
};

const healthPayload = () => ({
  status: appReady ? "ok" : "starting",
  ready: appReady,
  timestamp: new Date().toISOString(),
});

app.get("/healthz", (_req, res) => {
  res.status(200).json(healthPayload());
});
app.head("/healthz", (_req, res) => {
  res.status(200).end();
});

const isPublicHealthRoute = (req: Request): boolean =>
  req.path === "/" || req.path === "/healthz";

app.use((req, res, next) => {
  if (isPublicHealthRoute(req)) {
    return next();
  }
  return jwtMiddleware(req, res, next);
});
const requestShutdown = (signal: NodeJS.Signals) => {
  try {
    console.error(`[process] signal received: ${signal}`);
  } catch {}

  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  const watcherHandle = latticeWatcher;
  latticeWatcher = null;
  if (watcherHandle) {
    watcherHandle.close().catch((err) => {
      try {
        console.error("[code-lattice] watcher close failed:", err);
      } catch {}
    });
  }

  const forceExitTimer = setTimeout(() => {
    try {
      console.error("[process] forcing exit after graceful shutdown timeout");
    } catch {}
    process.exit(1);
  }, 5000);

  const exit = (code: number) => {
    clearTimeout(forceExitTimer);
    process.exit(code);
  };

  if (!serverInstance) {
    exit(0);
    return;
  }

  try {
    serverInstance.close((err) => {
      if (err) {
        try {
          console.error("[process] error while closing server:", err);
        } catch {}
        exit(1);
        return;
      }
      exit(0);
    });
  } catch (err) {
    try {
      console.error("[process] server close threw:", err);
    } catch {}
    exit(1);
  }
};

// Keep the dev server resilient: log unexpected errors instead of exiting
process.on('uncaughtException', (err) => {
  try {
    console.error('[process] uncaughtException:', err?.stack || err);
  } catch {}
});
process.on('unhandledRejection', (reason) => {
  try {
    console.error('[process] unhandledRejection:', reason);
  } catch {}
});
// Extra lifecycle diagnostics to catch unexpected shutdowns
process.on('beforeExit', (code) => {
  try {
    console.error('[process] beforeExit with code:', code);
  } catch {}
});
process.on('exit', (code) => {
  try {
    console.error('[process] exit with code:', code);
  } catch {}
});
for (const sig of ['SIGINT','SIGTERM'] as const) {
  process.on(sig, () => requestShutdown(sig));
}

// Serve PDF files from attached_assets folder
app.use('/attached_assets', express.static('attached_assets'));

// Serve static mission documentation
app.use('/docs', express.static(docsDir));

// Cache headers for warp engine bundles
app.use('/warp-engine*.js', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

const desktopRedirectHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=/desktop">
    <title>CasimirBot</title>
  </head>
  <body>
    <p>Redirecting to <a href="/desktop">/desktop</a>...</p>
  </body>
</html>`;

const rootHandler = (req: Request, res: Response) => {
  // Health check: respond immediately with 200 for fastest possible response
  // This ensures deployment health checks pass quickly
  const isHealthCheck = req.headers['user-agent']?.includes('health') || 
                        req.headers['x-health-check'] || 
                        !req.headers.accept ||
                        req.headers.accept === '*/*';
  
  if (isHealthCheck) {
    res.status(200).send("ok");
    return;
  }
  
  if (!appReady) {
    res.status(200).send("starting");
    return;
  }
  const wantsHtml = Boolean(req.accepts(["html"]));
  if (wantsHtml) {
    res.status(200).type("html").send(desktopRedirectHtml);
    return;
  }
  res.status(200).json({ status: "ok", redirect: "/desktop" });
};

// Register root health check handler FIRST for immediate response
app.get("/", rootHandler);
app.head("/", (_req, res) => {
  res.status(200).end();
});

const previewResponseBody = (body: unknown, maxLength = 80): string | undefined => {
  if (body === undefined) return undefined;
  if (body === null) return "null";

  if (typeof body === "string") {
    return body.length > maxLength ? `${body.slice(0, maxLength - 3)}...` : body;
  }

  if (typeof body === "number" || typeof body === "boolean") {
    const str = String(body);
    return str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
  }

  if (Buffer.isBuffer(body)) {
    return `Buffer(${body.length})`;
  }

  if (Array.isArray(body)) {
    if (body.length === 0) return "[]";
    if (body.length > 16) return `Array(${body.length})`;
  }

  if (typeof body === "object") {
    const keys = Object.keys(body as Record<string, unknown>);
    if (keys.length > 16) {
      const previewKeys = keys.slice(0, 16).join(", ");
      const suffix = keys.length > 16 ? ", ..." : "";
      return `Object keys: ${previewKeys}${suffix}`;
    }

    const seen = new WeakSet<object>();
    const replacer = (_key: string, value: unknown) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value as object)) {
          return "[Circular]";
        }
        seen.add(value as object);
      }
      return value;
    };

    try {
      const json = JSON.stringify(body, replacer);
      if (!json) return undefined;
      return json.length > maxLength ? `${json.slice(0, maxLength - 3)}...` : json;
    } catch (err: any) {
      const message = typeof err?.message === "string" ? err.message : "serialization error";
      return `[unserializable: ${message}]`;
    }
  }

  try {
    const str = String(body);
    return str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
  } catch {
    return "[unknown value]";
  }
};

const resolveRouteLabel = (req: Request): string => {
  if (req.route?.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  if (req.baseUrl) {
    return req.baseUrl;
  }
  const url = typeof req.path === "string" && req.path ? req.path : req.originalUrl || "/";
  return url || "/";
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonPreview: string | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonPreview = previewResponseBody(bodyJson);
    return Reflect.apply(originalResJson, this, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const routeLabel = resolveRouteLabel(req);
    metrics.observeHttpRequest(req.method, routeLabel, res.statusCode, duration);
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonPreview) {
        logLine += ` :: ${capturedJsonPreview}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "...";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5173 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const fallbackPort = app.get("env") === "production" ? "5000" : "5173";
  const port = parseInt(process.env.PORT || fallbackPort, 10);
  const isWin = process.platform === "win32";
  const listenOpts: any = { port, host: "0.0.0.0" };
  if (!isWin) listenOpts.reusePort = true;

  const server = createServer(app);
  serverInstance = server;

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`[server] port ${port} is already in use. Another Casimir server is still running or the OS has not released the socket yet.`);
      console.error("[server] stop the other process or set PORT to an open value before retrying.");
      process.exit(1);
      return;
    }
    console.error("[server] unexpected listen error:", err);
  });

  // Start listening early so health checks succeed while routes finish initializing.
  server.listen(listenOpts, () => {
    log(`serving on port ${port}`);
  });

  const bootstrap = async () => {
    const { initializeModules } = await import("./modules/module-loader.js");
    await initializeModules();

    const { registerRoutes } = await import("./routes");
    await registerRoutes(app, server);

    if (process.env.ENABLE_LATTICE_WATCHER === "1") {
      const debounceMs = Number(process.env.LATTICE_WATCHER_DEBOUNCE_MS);
      const watcherOptions = Number.isFinite(debounceMs) ? { debounceMs } : undefined;
      try {
        const { startLatticeWatcher } = await import("./services/code-lattice/watcher");
        latticeWatcher = await startLatticeWatcher(watcherOptions);
        log(`[code-lattice] watcher ready (version=${latticeWatcher.getVersion()})`);
      } catch (error) {
        console.error("[code-lattice] watcher failed to start:", error);
      }
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      // Log the error but do not crash the server; this keeps dev server alive
      // and avoids connection refusals after a first route error.
      try {
        console.error("[express] error handler:", status, message);
        if (process.env.NODE_ENV !== "production") {
          console.error(err?.stack || err);
        }
      } catch {}
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const skipVite = process.env.SKIP_VITE_MIDDLEWARE === "1";
    if (app.get("env") === "development" && !skipVite) {
      log("dev: Vite middleware enabled (hot reload via Express)");
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } else {
      if (skipVite) {
        log("dev: skipping Vite middlewares (SKIP_VITE_MIDDLEWARE=1); serving prebuilt client instead");
      } else if (app.get("env") !== "development") {
        log(`dev: NODE_ENV=${process.env.NODE_ENV ?? "undefined"}; serving prebuilt client instead of Vite HMR`);
      }
      const { serveStatic } = await import("./vite");
      serveStatic(app);
    }

    appReady = true;
    log("app ready");
  };

  setTimeout(() => {
    void bootstrap().catch((error) => {
      console.error("[server] bootstrap failed:", error);
    });
  }, 0);
})();
