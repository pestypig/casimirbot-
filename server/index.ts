import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, "..", "docs");

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
  process.on(sig, () => {
    try {
      console.error(`[process] signal received: ${sig}`);
    } catch {}
  });
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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonPreview) {
        logLine += ` :: ${capturedJsonPreview}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize physics modules
  const { initializeModules } = await import('./modules/module-loader.js');
  await initializeModules();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Log the error but do not crash the server; this keeps dev server alive
    // and avoids connection refusals after a first route error.
    try {
      console.error('[express] error handler:', status, message);
      if (process.env.NODE_ENV !== 'production') {
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
  if (app.get("env") === "development") {
    if (process.env.SKIP_VITE_MIDDLEWARE === '1') {
      log('dev: skipping Vite middlewares (SKIP_VITE_MIDDLEWARE=1)');
    } else {
      await setupVite(app, server);
    }
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const isWin = process.platform === 'win32';
  const listenOpts: any = { port, host: '0.0.0.0' };
  if (!isWin) listenOpts.reusePort = true;
  server.listen(listenOpts, () => {
    log(`serving on port ${port}`);
  });
})();
