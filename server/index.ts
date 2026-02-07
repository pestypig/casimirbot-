import express, { type Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer, get as httpGet, type Server, type ServerResponse } from "http";
import os from "os";
import { registerMetricsEndpoint, metrics } from "./metrics";
import { jwtMiddleware } from "./auth/jwt";
import { otelMiddleware } from "./services/observability/otel-middleware";
import { patchExpressAsyncHandlers } from "./utils/express-async-guard";
import {
  flushErrorReporter,
  initErrorReporter,
  reportError,
} from "./services/observability/error-reporter";
import {
  loadIdeologyVerifierPack,
  validateIdeologyVerifierPackAgainstNodeIds,
} from "@shared/ideology/ideology-verifiers";
import { collectIdeologyNodeIdsFromTree } from "../scripts/collect-ideology-node-ids";

type LatticeWatcherHandle = {
  close(): Promise<void>;
  getVersion(): number;
};

type HealthCheckRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

patchExpressAsyncHandlers();
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
const fatalExitOnError =
  process.env.FATAL_EXIT_ON_ERROR !== "0" && runtimeEnv !== "development";
const fatalExitDelayMs = Number(process.env.FATAL_EXIT_DELAY_MS ?? "1500");
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
let artifactsReady = false;
let artifactHydrationError: string | null = null;
let artifactRetryTimer: NodeJS.Timeout | null = null;
let artifactHydrationInFlight = false;
let bootstrapError: string | null = null;
const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
};

const resolveReadyState = (): boolean => appReady && artifactsReady;

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy && trustProxy !== "0") {
  app.set("trust proxy", trustProxy === "1" ? true : trustProxy);
}

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

const artifactRetryMs = toPositiveInt(process.env.RUNTIME_ARTIFACT_RETRY_MS, 30_000);

const scheduleArtifactRetry = () => {
  if (artifactRetryTimer || artifactRetryMs <= 0) return;
  artifactRetryTimer = setTimeout(() => {
    artifactRetryTimer = null;
    void attemptArtifactHydration();
  }, artifactRetryMs);
  artifactRetryTimer.unref?.();
};

const noteArtifactError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  artifactHydrationError = message.slice(0, 280);
};

const noteBootstrapError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  bootstrapError = message.slice(0, 280);
};

const attemptArtifactHydration = async () => {
  if (artifactHydrationInFlight) return;
  artifactHydrationInFlight = true;
  try {
    const { ensureRuntimeArtifactsHydrated } = await import("./services/llm/runtime-artifacts");
    await ensureRuntimeArtifactsHydrated();
    artifactsReady = true;
    artifactHydrationError = null;
  } catch (error) {
    artifactsReady = false;
    noteArtifactError(error);
    scheduleArtifactRetry();
  } finally {
    artifactHydrationInFlight = false;
  }
};

const resolveExistingPath = (primary: string, fallback?: string) => {
  if (fs.existsSync(primary)) return primary;
  if (fallback && fs.existsSync(fallback)) return fallback;
  return primary;
};

const validateIdeologyVerifierPack = () => {
  const ideologyPath = resolveExistingPath(
    path.resolve(process.cwd(), "docs", "ethos", "ideology.json"),
    path.resolve(process.cwd(), "ideology.json"),
  );
  const verifiersPath = resolveExistingPath(
    path.resolve(process.cwd(), "configs", "ideology-verifiers.json"),
    path.resolve(process.cwd(), "ideology-verifiers.json"),
  );

  const ideologyTree = JSON.parse(fs.readFileSync(ideologyPath, "utf8"));
  const nodeIds = collectIdeologyNodeIdsFromTree(ideologyTree);
  const pack = loadIdeologyVerifierPack(verifiersPath);
  const result = validateIdeologyVerifierPackAgainstNodeIds(pack, nodeIds);

  if (!result.ok) {
    const details = result.errors
      .map((error) => `[${error.kind}] ${error.message}`)
      .join("; ");
    throw new Error(`ideology-verifiers validation failed: ${details}`);
  }

  log(
    `[ideology-verifiers] validation ok (mappings=${pack.mappings.length} nodes=${nodeIds.size})`,
    "ideology",
  );
};

const healthPayload = () => {
  const ready = resolveReadyState();
  return {
    status: ready ? "ok" : "starting",
    ready,
    appReady,
    artifactsReady,
    healthReady,
    artifactsError: artifactHydrationError,
    bootstrapError,
    timestamp: new Date().toISOString(),
  };
};

const readyPayload = () => {
  const ready = appReady;
  return {
    status: ready ? "ok" : "starting",
    ready,
    appReady,
    artifactsReady,
    healthReady,
    artifactsError: artifactHydrationError,
    bootstrapError,
    timestamp: new Date().toISOString(),
  };
};

const resolveServiceName = (): string =>
  process.env.SERVICE_NAME ??
  process.env.SERVICE_ID ??
  process.env.npm_package_name ??
  "casimirbot";

const resolveServiceVersion = (): string =>
  process.env.SERVICE_VERSION ?? process.env.npm_package_version ?? "0.0.0";

const resolveGitSha = (): string | null => {
  const sha =
    process.env.GIT_SHA ??
    process.env.COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.REPLIT_GIT_COMMIT;
  const normalized = sha?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const resolveBuildTime = (): string | null => {
  const explicit =
    process.env.BUILD_TIME ??
    process.env.BUILD_TIMESTAMP ??
    process.env.BUILD_AT;
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }
  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
  if (sourceDateEpoch) {
    const seconds = Number(sourceDateEpoch);
    if (Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return null;
};

const versionPayload = () => ({
  service: resolveServiceName(),
  version: resolveServiceVersion(),
  gitSha: resolveGitSha(),
  buildTime: resolveBuildTime(),
});

app.get("/healthz", (_req, res) => {
  const payload = healthPayload();
  res.status(payload.ready ? 200 : 503).json(payload);
});
app.head("/healthz", (_req, res) => {
  const ready = resolveReadyState();
  res.status(ready ? 200 : 503).end();
});
app.get("/api/ready", (_req, res) => {
  const payload = readyPayload();
  res.status(payload.ready ? 200 : 503).json(payload);
});
app.head("/api/ready", (_req, res) => {
  const ready = appReady;
  res.status(ready ? 200 : 503).end();
});
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});
app.head("/health", (_req, res) => {
  res.status(200).end();
});
app.get("/version", (_req, res) => {
  res.status(200).json(versionPayload());
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
  return (
    normalized === "/" ||
    normalized === "/health" ||
    normalized === "/healthz" ||
    normalized === "/api/ready" ||
    normalized === "/version" ||
    normalized === "/__selfcheck"
  );
};

const isHealthCheckRequest = (req: HealthCheckRequest): boolean => {
  const userAgent = headerValue(req.headers["user-agent"]).toLowerCase();
  return (
    req.method === "HEAD" ||
    req.headers["x-health-check"] !== undefined ||
    userAgent.includes("health") ||
    userAgent.includes("kube-probe") ||
    userAgent.includes("elb-healthchecker")
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
app.use(otelMiddleware);

app.use((req, res, next) => {
  if (isPublicHealthRoute(req)) {
    return next();
  }
  return jwtMiddleware(req, res, next);
});
const requestShutdown = (signal: NodeJS.Signals | string) => {
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

void initErrorReporter();

const scheduleFatalExit = (reason: string, error?: unknown) => {
  if (!fatalExitOnError) return;
  try {
    console.error(`[process] fatal error (${reason}); exiting for supervisor restart`);
  } catch {}
  if (error) {
    reportError(error, { tags: { reason } });
  }
  const delay = Number.isFinite(fatalExitDelayMs) ? Math.max(0, fatalExitDelayMs) : 0;
  setTimeout(() => {
    void flushErrorReporter().finally(() => requestShutdown(reason));
  }, delay).unref?.();
};

// Keep the dev server resilient: log unexpected errors; exit in production to allow supervisor restart.
process.on('uncaughtException', (err) => {
  try {
    console.error('[process] uncaughtException:', err?.stack || err);
  } catch {}
  reportError(err, { tags: { source: "uncaughtException" } });
  scheduleFatalExit("uncaughtException", err);
});
process.on('unhandledRejection', (reason) => {
  try {
    console.error('[process] unhandledRejection:', reason);
  } catch {}
  reportError(reason, { tags: { source: "unhandledRejection" } });
  scheduleFatalExit("unhandledRejection", reason);
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

app.get(["/desktop", "/mobile", "/start", "/helix-core"], (req: Request, res: Response, next: NextFunction) => {
  if (appReady) {
    next();
    return;
  }
  if (req.method !== "GET") {
    next();
    return;
  }
  res.status(503);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Retry-After", "8");
  res.send(renderStartupRetryHtml(req.path));
});

const renderStartupRetryHtml = (target: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="8">
    <meta name="robots" content="noindex,nofollow">
    <title>Starting up…</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: #0b1020; color: #e2e8f0; display: flex; min-height: 100vh; margin: 0; }
      .card { max-width: 520px; margin: auto; padding: 28px 32px; border-radius: 16px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.2); }
      h1 { font-size: 18px; margin: 0 0 8px; }
      p { font-size: 14px; line-height: 1.5; margin: 0 0 10px; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .muted { color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Starting up…</h1>
      <p>The server is still warming up. This page will auto-refresh when it is ready.</p>
      <p class="muted">Target: <code>${target}</code></p>
      <p class="muted" id="boot-error" style="display:none;"></p>
      <p class="muted">If this persists, check the deploy logs for runtime errors.</p>
    </div>
    <script>
      (function retryWhenReady() {
        function reload() { window.location.replace(${JSON.stringify(target)}); }
        function poll() {
          fetch("/api/ready", { cache: "no-store" })
            .then(function (res) { return res.json ? res.json() : null; })
            .then(function (payload) {
              if (payload && payload.ready) {
                reload();
                return;
              }
              var err = payload && (payload.bootstrapError || payload.artifactsError);
              if (err) {
                var el = document.getElementById("boot-error");
                if (el) {
                  el.textContent = "Last error: " + err;
                  el.style.display = "block";
                }
              }
              setTimeout(poll, 2000);
            })
            .catch(function () { setTimeout(poll, 2000); });
        }
        poll();
      })();
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
    <p id="boot-error" style="font-family: sans-serif; font-size: 12px; color: #666; display:none;"></p>
    <script>
      (function() {
        var target = ${JSON.stringify(target)};
        var retryMs = 500;
        function schedule() {
          setTimeout(check, retryMs);
        }
        function check() {
          fetch("/api/ready", { cache: "no-store" })
            .then(function(res) {
              return res.ok ? res.json() : null;
            })
            .then(function(payload) {
              if (payload && payload.ready) {
                window.location.replace(target);
                return;
              }
              var err = payload && (payload.bootstrapError || payload.artifactsError);
              if (err) {
                var el = document.getElementById("boot-error");
                if (el) {
                  el.textContent = "Last error: " + err;
                  el.style.display = "block";
                }
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
    // Return 200 so default platform health checks pass even with Accept: */*.
    res
      .status(200)
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
  if (path === "/api/ready") {
    const payload = readyPayload();
    const statusCode = payload.ready ? 200 : 503;
    addProbeHeaders(res, "raw-ready");
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
      noteBootstrapError(error);
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
    const forcedHostRaw = hostEnv?.trim() ? hostEnv.trim() : "0.0.0.0";
    const forcedHost = forcedHostRaw === "0.0.0.0" ? "::" : forcedHostRaw;
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
  log(
    `boot env: NODE_ENV=${process.env.NODE_ENV ?? "undefined"} PORT=${process.env.PORT ?? "unset"} ` +
      `HOST=${host} FAST_BOOT=${fastBoot ? "1" : "0"} ` +
      `PROBE_DIAG=${process.env.PROBE_DIAG ?? "unset"} NET_DIAG=${process.env.NET_DIAG ?? "unset"}`
  );
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
      pathname === "/health" ||
      pathname === "/healthz" ||
      pathname === "/api/ready" ||
      pathname === "/version" ||
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
  const requestTimeoutMs = toPositiveInt(process.env.HTTP_SERVER_REQUEST_TIMEOUT_MS, 120_000);
  const headersTimeoutMs = toPositiveInt(process.env.HTTP_SERVER_HEADERS_TIMEOUT_MS, 65_000);
  const keepAliveTimeoutMs = toPositiveInt(process.env.HTTP_SERVER_KEEPALIVE_TIMEOUT_MS, 5_000);
  server.requestTimeout = requestTimeoutMs;
  server.headersTimeout = headersTimeoutMs;
  server.keepAliveTimeout = keepAliveTimeoutMs;
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
    validateIdeologyVerifierPack();
    void attemptArtifactHydration();

    if (fastBoot) {
      log("FAST_BOOT=1: skipping module init, API routes, and background services");
      appReady = true;
      log("app ready (fast boot)");
    } else {
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
      reportError(err, {
        tags: { source: "express" },
        extra: { status, path: _req?.path, method: _req?.method },
      });
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
      const { serveStatic } = await import("./static");
      serveStatic(app);
    }

    appReady = true;
    healthReady = true;
    log("app ready");

    if (!fastBoot) {
      if (skipModuleInit) {
        log("SKIP_MODULE_INIT=1: skipping physics module initialization");
      } else {
        const moduleInitStart = Date.now();
        const moduleInitTimeoutMs = Number(process.env.MODULE_INIT_TIMEOUT_MS ?? "20000");
        const { initializeModules } = await import("./modules/module-loader.js");
        const timeout = setTimeout(() => {
          log(
            `physics module init still running after ${moduleInitTimeoutMs}ms (continuing in background)`,
          );
        }, moduleInitTimeoutMs);
        timeout.unref?.();
        Promise.resolve()
          .then(() => initializeModules())
          .then(() => {
            clearTimeout(timeout);
            log(`physics modules initialized in ${Date.now() - moduleInitStart}ms`);
          })
          .catch((error) => {
            clearTimeout(timeout);
            console.error("[modules] initialization failed:", error);
          });
      }
    }
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
