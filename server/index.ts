import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, get as httpGet, type Server, type ServerResponse } from "http";
import os from "os";
import { registerMetricsEndpoint, metrics } from "./metrics";
import { jwtMiddleware } from "./auth/jwt";

type LatticeWatcherHandle = {
  close(): Promise<void>;
  getVersion(): number;
};

type HealthCheckRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, "..", "docs");

let appReady = false;
let healthReady = false;
let serverInstance: Server | null = null;
let latticeWatcher: LatticeWatcherHandle | null = null;
let shuttingDown = false;
const runtimeEnv = process.env.NODE_ENV ?? "development";
const fastBoot = process.env.FAST_BOOT === "1";
const skipModuleInit = process.env.SKIP_MODULE_INIT === "1";
const deferRouteBoot = process.env.DEFER_ROUTE_BOOT === "1";
const healthReadyOnListen =
  process.env.HEALTH_READY_ON_LISTEN === "1" ||
  (process.env.HEALTH_READY_ON_LISTEN !== "0" && deferRouteBoot);
const rootLivenessAlways = process.env.ROOT_LIVENESS_ALWAYS === "1";
const probeDiag = process.env.PROBE_DIAG === "1";
const netDiag = process.env.NET_DIAG === "1";
const netDiagMaxConnections = 25;
let netDiagConnectionsLogged = 0;
let netReqSeq = 0;
let netProbeLogCount = 0;
let netProbeLimitLogged = false;
const netProbeLogLimit = 50;
const bootstrapDelayMsRaw = process.env.BOOTSTRAP_DELAY_MS;
const bootstrapDelayMs = Number.isFinite(Number(bootstrapDelayMsRaw))
  ? Math.max(0, Number(bootstrapDelayMsRaw))
  : 0;
let bootstrapPromise: Promise<void> | null = null;
const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
};

const healthPayload = () => {
  const ready = appReady || healthReady;
  return {
    status: ready ? "ok" : "starting",
    ready,
    timestamp: new Date().toISOString(),
  };
};

app.get("/healthz", (_req, res) => {
  const payload = healthPayload();
  res.status(payload.ready ? 200 : 503).json(payload);
});
app.head("/healthz", (_req, res) => {
  const ready = appReady || healthReady;
  res.status(ready ? 200 : 503).end();
});

const headerValue = (value: string | string[] | undefined): string => {
  if (!value) return "";
  return Array.isArray(value) ? value.join(",") : value;
};

const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const normalizeHealthPath = (value?: string): string => {
  if (!value) return "/";
  const base = value.split("?")[0] || "/";
  if (base.length > 1 && base.endsWith("/")) {
    return base.slice(0, -1);
  }
  return base;
};

const getPathname = (value?: string): string => {
  try {
    return new URL(value ?? "/", "http://localhost").pathname || "/";
  } catch {
    return (value ?? "/").split("?")[0] || "/";
  }
};

const isLivenessProbe = (req: HealthCheckRequest): boolean => {
  const method = (req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  const path = getPathname(req.url);
  return path === "/" || path === "";
};

const replyPlain = (req: HealthCheckRequest, res: ServerResponse, statusCode: number, body: string): void => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if ((req.method ?? "GET").toUpperCase() === "HEAD") {
    res.end();
    return;
  }
  res.end(body);
};

const addProbeHeaders = (res: ServerResponse, handler: string): void => {
  if (!probeDiag) return;
  const bootstrapped = appReady;
  const bootState = bootstrapped ? "done" : bootstrapPromise ? "booting" : "idle";
  res.setHeader("X-Probe-Handler", handler);
  res.setHeader("X-Probe-Bootstrapped", bootstrapped ? "1" : "0");
  res.setHeader(
    "X-Probe-Handler-Detail",
    `boot=${bootState};health=${healthReady ? "1" : "0"};defer=${deferRouteBoot ? "1" : "0"}`
  );
};

const isPublicHealthRoute = (req: Request): boolean => {
  const normalized = normalizeHealthPath(req.path || req.originalUrl);
  return normalized === "/" || normalized === "/healthz" || normalized === "/__selfcheck";
};

const isHealthCheckRequest = (req: HealthCheckRequest): boolean => {
  const userAgent = headerValue(req.headers["user-agent"]).toLowerCase();
  const accept = headerValue(req.headers.accept).trim().toLowerCase();
  const acceptTokens = accept
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  const acceptsAny =
    acceptTokens.length === 0 ||
    (acceptTokens.length === 1 && acceptTokens[0].startsWith("*/*"));
  return (
    req.method === "HEAD" ||
    req.headers["x-health-check"] !== undefined ||
    userAgent.includes("health") ||
    userAgent.includes("kube-probe") ||
    userAgent.includes("elb-healthchecker") ||
    acceptsAny
  );
};

const resolveRootRedirectOverride = (req: Request): string | null => {
  try {
    const url = new URL(req.originalUrl ?? req.url ?? "/", "http://localhost");
    const params = url.searchParams;
    if (params.get("mobile") === "1") return "/mobile";
    if (params.get("desktop") === "1") return "/desktop";
  } catch {}
  return null;
};

const isMobileRequest = (req: Request): boolean => {
  const mobileHint = headerValue(req.headers["sec-ch-ua-mobile"]).trim();
  if (mobileHint === "?1") return true;
  if (mobileHint === "?0") return false;

  const ua = headerValue(req.headers["user-agent"]);
  if (!ua) return false;
  if (MOBILE_UA_REGEX.test(ua)) return true;
  const uaLower = ua.toLowerCase();
  return uaLower.includes("macintosh") && uaLower.includes("mobile");
};

const resolveRootRedirectTarget = (req: Request): string => {
  const override = resolveRootRedirectOverride(req);
  if (override) return override;
  return isMobileRequest(req) ? "/mobile" : "/desktop";
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
registerMetricsEndpoint(app);

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

let lastLagTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const lag = now - lastLagTick - 1000;
  if (lag > 250) {
    try {
      console.warn(`[lag] event loop lag ${lag}ms`);
    } catch {}
  }
  lastLagTick = now;
}, 1000).unref?.();

// Serve PDF files from attached_assets folder
app.use('/attached_assets', express.static('attached_assets'));

// Serve static mission documentation
app.use('/docs', express.static(docsDir));

// Cache headers for warp engine bundles
app.use('/warp-engine*.js', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

const renderRootRedirectHtml = (target: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${target}">
    <title>CasimirBot</title>
  </head>
  <body>
    <p>Redirecting to <a href="${target}">${target}</a>...</p>
    <script>
      window.location.replace(${JSON.stringify(target)});
    </script>
  </body>
</html>`;

const renderRootBootHtml = (target: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="5">
    <meta name="robots" content="noindex">
    <title>CasimirBot</title>
  </head>
  <body>
    <p>Starting up... Redirecting to <a href="${target}">${target}</a> once ready.</p>
    <script>
      (function() {
        var target = ${JSON.stringify(target)};
        var retryMs = 500;
        function schedule() {
          setTimeout(check, retryMs);
        }
        function check() {
          fetch("/healthz", { cache: "no-store" })
            .then(function(res) {
              return res.ok ? res.json() : null;
            })
            .then(function(payload) {
              if (payload && payload.ready) {
                window.location.replace(target);
                return;
              }
              schedule();
            })
            .catch(schedule);
        }
        check();
      })();
    </script>
  </body>
</html>`;

const rootHandler = (req: Request, res: Response) => {
  addProbeHeaders(res, "express-root");
  // Health check: respond immediately with 200 for fastest possible response
  // This ensures deployment health checks pass quickly
  const isHealthCheck = isHealthCheckRequest(req);
  
  if (isHealthCheck) {
    res.status(200).send("ok");
    return;
  }
  const redirectTarget = resolveRootRedirectTarget(req);
  const wantsHtml = Boolean(req.accepts(["html"]));
  if (!appReady) {
    if (wantsHtml) {
      res
        .status(200)
        .set("Cache-Control", "no-store")
        .type("html")
        .send(renderRootBootHtml(redirectTarget));
      return;
    }
    res.status(200).json({ status: "starting", redirect: redirectTarget });
    return;
  }
  if (wantsHtml) {
    res
      .status(302)
      .set("Location", redirectTarget)
      .set("Cache-Control", "no-store")
      .type("html")
      .send(renderRootRedirectHtml(redirectTarget));
    return;
  }
  res.status(200).json({ status: "ok", redirect: redirectTarget });
};

const handleHealthCheck = (req: HealthCheckRequest, res: ServerResponse): boolean => {
  const method = (req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  const path = getPathname(req.url);
  if (path === "/healthz") {
    const payload = healthPayload();
    const statusCode = payload.ready ? 200 : 503;
    addProbeHeaders(res, "raw-healthz");
    if (method === "HEAD") {
      res.statusCode = statusCode;
      res.setHeader("Cache-Control", "no-store");
      res.end();
      return true;
    }
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
    return true;
  }

  return false;
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

const resolveContainerIPv4 = (): string | null => {
  const nets = os.networkInterfaces() as NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  const entriesList = Object.values(nets) as Array<os.NetworkInterfaceInfo[] | undefined>;
  for (const entries of entriesList) {
    if (!entries) continue;
    for (const net of entries) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

const selfCheck = (port: number) => {
  if (!netDiag) return;
  const runCheck = (label: string, url: string) => {
    const started = Date.now();
    const req = httpGet(url, (res) => {
      log(`[selfcheck] ${label} / -> ${res.statusCode} in ${Date.now() - started}ms`, "net");
      res.resume();
    });
    req.on("error", (error) => {
      log(`[selfcheck] ${label} failed: ${error.message}`, "net");
    });
    req.setTimeout(1500, () => {
      req.destroy(new Error("timeout"));
    });
  };

  runCheck("IPv4", `http://127.0.0.1:${port}/__selfcheck`);
  const containerIp = resolveContainerIPv4();
  if (containerIp) {
    runCheck(`container ${containerIp}`, `http://${containerIp}:${port}/__selfcheck`);
  } else {
    log("[selfcheck] container IPv4 not found", "net");
  }
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
  const startBootstrap = (reason: string) => {
    if (bootstrapPromise) return;
    log(`bootstrap start (${reason})`);
    bootstrapPromise = bootstrap().catch((error) => {
      console.error("[server] bootstrap failed:", error);
    });
  };
  const scheduleBootstrap = (reason: string) => {
    if (bootstrapPromise) return;
    if (bootstrapDelayMs > 0) {
      const timer = setTimeout(() => startBootstrap(reason), bootstrapDelayMs);
      timer.unref?.();
      return;
    }
    setImmediate(() => startBootstrap(reason));
  };

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5173 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const fallbackPort = app.get("env") === "production" ? "5000" : "5173";
  const isDeploy =
    process.env.REPLIT_DEPLOYMENT === "1" ||
    process.env.REPLIT_DEPLOYMENT === "true" ||
    process.env.DEPLOYMENT === "1" ||
    process.env.DEPLOYMENT === "true";

  let port = parseInt(process.env.PORT || fallbackPort, 10);
  if (!Number.isFinite(port) || Number.isNaN(port) || port <= 0) {
    port = parseInt(fallbackPort, 10);
  }

  const hostEnv = process.env.HOST;
  let host = hostEnv?.trim() ? hostEnv.trim() : "0.0.0.0";

  if (isDeploy) {
    const forcedPort = 5000;
    const forcedHost = "0.0.0.0";
    if (port !== forcedPort || host !== forcedHost) {
      log(
        `[deploy] forcing listen ${forcedHost}:${forcedPort} (was ${host}:${port}; env PORT=${process.env.PORT ?? "unset"} HOST=${process.env.HOST ?? "unset"})`
      );
    }
    port = forcedPort;
    host = forcedHost;
  }

  const isWin = process.platform === "win32";
  const listenOpts: any = { port, host };
  if (typeof host === "string" && host.includes(":")) {
    listenOpts.ipv6Only = false;
  }
  if (!isWin && !isDeploy) listenOpts.reusePort = true;
  log(`boot env: NODE_ENV=${process.env.NODE_ENV ?? "undefined"} PORT=${process.env.PORT ?? "unset"} HOST=${host} FAST_BOOT=${fastBoot ? "1" : "0"}`);
  if (probeDiag) {
    const buildId =
      process.env.GIT_SHA ??
      process.env.COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      process.env.REPLIT_GIT_COMMIT ??
      process.env.npm_package_version ??
      "unknown";
    log(
      `[probe-diag] pid=${process.pid} NODE_ENV=${runtimeEnv} SKIP_MODULE_INIT=${process.env.SKIP_MODULE_INIT ?? "unset"} ` +
        `DEFER_ROUTE_BOOT=${process.env.DEFER_ROUTE_BOOT ?? "unset"} deferRouteBoot=${deferRouteBoot ? "1" : "0"} ` +
        `HEALTH_READY_ON_LISTEN=${process.env.HEALTH_READY_ON_LISTEN ?? "unset"} healthReadyOnListen=${healthReadyOnListen ? "1" : "0"} ` +
        `build=${buildId}`,
      "probe"
    );
  }

  const server = createServer((req, res) => {
    const method = (req.method ?? "GET").toUpperCase();
    const pathname = getPathname(req.url);
    const isRootPath = pathname === "/" || pathname === "";
    const isHealthCheck = isHealthCheckRequest(req);
    const isSelfcheck = pathname === "/__selfcheck";
    const isProbePath =
      pathname === "/healthz" ||
      isSelfcheck ||
      (isRootPath && isHealthCheck);
    const shouldStartBootstrap = deferRouteBoot && !bootstrapPromise;
    const scheduleAfterResponse = (reason: string) => {
      if (!shouldStartBootstrap) return;
      let queued = false;
      const queue = () => {
        if (queued) return;
        queued = true;
        scheduleBootstrap(reason);
      };
      if (res.writableEnded) {
        queue();
        return;
      }
      res.once("finish", queue);
      res.once("close", queue);
    };
    if (netDiag) {
      if (isProbePath && netProbeLogCount < netProbeLogLimit) {
        netProbeLogCount += 1;
        const id = ++netReqSeq;
        const t0 = Date.now();
        const remoteAddr = req.socket.remoteAddress ?? "?";
        const remotePort = req.socket.remotePort ?? "?";
        const localAddr = req.socket.localAddress ?? "?";
        const localPort = req.socket.localPort ?? "?";
        const remote = `${remoteAddr}:${remotePort}`;
        const local = `${localAddr}:${localPort}`;
        const ua = (req.headers["user-agent"] ?? "-").toString();
        const hostHdr = (req.headers.host ?? "-").toString();
        const elapsed = () => `${Date.now() - t0}ms`;

        log(
          `[req#${id}] start ${method} ${req.url ?? "/"} path=${pathname} ` +
            `remote=${remote} local=${local} fam=${req.socket.remoteFamily ?? "?"} ` +
            `host=${hostHdr} ua=${ua}`,
          "net"
        );

        req.once("aborted", () => {
          log(`[req#${id}] aborted after ${elapsed()}`, "net");
        });

        res.once("finish", () => {
          log(`[res#${id}] finish ${method} ${req.url ?? "/"} -> ${res.statusCode} in ${elapsed()}`, "net");
        });

        res.once("close", () => {
          log(
            `[res#${id}] close ended=${res.writableEnded ? "yes" : "no"} ` +
              `headersSent=${res.headersSent ? "yes" : "no"} after ${elapsed()}`,
            "net"
          );
        });
      } else if (isProbePath && !netProbeLimitLogged) {
        netProbeLimitLogged = true;
        log(`[req] probe log limit reached (${netProbeLogLimit})`, "net");
      }
    }
    if (rootLivenessAlways && (method === "GET" || method === "HEAD") && isRootPath) {
      scheduleAfterResponse("root-liveness");
      addProbeHeaders(res, "raw-liveness");
      replyPlain(req, res, 200, "ok");
      return;
    }
    if (isLivenessProbe(req) && isHealthCheck) {
      scheduleAfterResponse("liveness-probe");
      addProbeHeaders(res, "raw-liveness");
      const start = Date.now();
      const ua = headerValue(req.headers["user-agent"]);
      try {
        console.log(`[probe] ${req.method ?? "GET"} ${req.url ?? "/"} ua="${ua}"`);
      } catch {}
      replyPlain(req, res, 200, "ok");
      try {
        console.log(`[probe] responded 200 in ${Date.now() - start}ms`);
      } catch {}
      return;
    }
    if ((method === "GET" || method === "HEAD") && isSelfcheck) {
      addProbeHeaders(res, "raw-selfcheck");
      replyPlain(req, res, 200, "ok");
      scheduleAfterResponse("selfcheck-probe");
      return;
    }
    if (handleHealthCheck(req, res)) {
      scheduleAfterResponse("healthz-probe");
      return;
    }
    if (deferRouteBoot && !bootstrapPromise && !isProbePath) {
      scheduleBootstrap("first-real-request");
    }
    app(req, res);
  });
  serverInstance = server;

  if (netDiag) {
    server.on("connection", (socket) => {
      if (netDiagConnectionsLogged >= netDiagMaxConnections) {
        return;
      }
      netDiagConnectionsLogged += 1;
      log(`[conn] from ${socket.remoteAddress ?? "unknown"} (${socket.remoteFamily ?? "unknown"})`, "net");
      if (netDiagConnectionsLogged === netDiagMaxConnections) {
        log(`[conn] log limit reached (${netDiagMaxConnections})`, "net");
      }
    });

    server.on("clientError", (err, socket) => {
      log(`[clientError] ${err.message}`, "net");
      socket.destroy();
    });

    // Detailed per-request logs are wired inside createServer to capture lifecycle.
  }

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`[server] port ${port} is already in use. Another Casimir server is still running or the OS has not released the socket yet.`);
      console.error("[server] stop the other process or set PORT to an open value before retrying.");
      process.exit(1);
      return;
    }
    console.error("[server] unexpected listen error:", err);
  });

  const bootstrap = async () => {
    if (fastBoot) {
      log("FAST_BOOT=1: skipping module init, API routes, and background services");
      appReady = true;
      log("app ready (fast boot)");
    } else {
      if (skipModuleInit) {
        log("SKIP_MODULE_INIT=1: skipping physics module initialization");
      } else {
        const { initializeModules } = await import("./modules/module-loader.js");
        await initializeModules();
      }

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
    healthReady = true;
    log("app ready");
  };

  // Start listening early so health checks succeed while routes finish initializing.
  server.listen(listenOpts, () => {
    const address = server.address();
    const addressLabel =
      typeof address === "string"
        ? address
        : address
          ? `${address.address}:${address.port}`
          : `0.0.0.0:${port}`;
    log(`serving on ${addressLabel} (HOST=${host})`);
    if (app.get("env") === "production") {
      log(`[boot] server.address()=${JSON.stringify(server.address())}`, "net");
    }
    if (netDiag) {
      const timer = setTimeout(() => selfCheck(port), 250);
      timer.unref?.();
    }
    if (healthReadyOnListen && !healthReady) {
      healthReady = true;
      if (probeDiag) {
        log("health ready (pre-bootstrap)", "probe");
      }
    }
    if (fastBoot) {
      healthReady = true;
    }
    if (healthReadyOnListen && !deferRouteBoot) {
      scheduleBootstrap("post-ready-startup");
    }
  });

  if (deferRouteBoot) {
    log("bootstrap deferred until first health check or request");
  } else if (!healthReadyOnListen) {
    scheduleBootstrap("startup");
  }
})();
