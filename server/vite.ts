import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

const stripViteHmrClient = (html: string): string => {
  let next = html;
  next = next.replace(
    /<script\s+type="module"\s+src="\/@vite\/client"><\/script>/g,
    "",
  );
  next = next.replace(
    /<script\s+type="module">[\s\S]*?@react-refresh[\s\S]*?<\/script>/g,
    "",
  );
  return next;
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await import("../vite.config");
  const viteLogger = createLogger();
  const baseServerConfig = viteConfig.server ?? {};
  const hmrDisabled =
    process.env.DISABLE_VITE_HMR === "1" || process.env.VITE_HMR === "0";
  const resolvedHmrPortRaw = process.env.HMR_PORT ?? process.env.PORT ?? "";
  const resolvedHmrPort = Number.parseInt(resolvedHmrPortRaw, 10);
  const hmrPort = Number.isFinite(resolvedHmrPort) ? resolvedHmrPort : null;
  const hmrHost = process.env.HMR_HOST || null;
  const hmrProtocol = process.env.HMR_PROTOCOL || null;
  const baseHmrConfig =
    baseServerConfig.hmr && typeof baseServerConfig.hmr === "object"
      ? baseServerConfig.hmr
      : {};

  const hmrConfig = {
    ...baseHmrConfig,
    server,
    ...(hmrHost ? { host: hmrHost } : {}),
    ...(hmrPort ? { port: hmrPort, clientPort: hmrPort } : {}),
    ...(hmrProtocol ? { protocol: hmrProtocol } : {}),
  };

  const serverOptions = {
    ...baseServerConfig,
    ...(hmrPort ? { port: hmrPort } : {}),
    ...(hmrHost ? { host: hmrHost } : {}),
    middlewareMode: true,
    hmr: hmrDisabled ? false : hmrConfig,
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Log errors but do not terminate the dev server.
        // This keeps Express+Vite middleware alive for debugging.
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Resolve __dirname from ESM meta so pathing works in Node + tsx
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      const finalPage = hmrDisabled ? stripViteHmrClient(page) : page;
      res.status(200).set({ "Content-Type": "text/html" }).end(finalPage);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

function resolveDistPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const candidates = [
    path.resolve(__dirname, "public"), // bundled server path (dist/public)
    path.resolve(__dirname, "..", "dist", "public"), // running from source with a built client
    path.resolve(process.cwd(), "dist", "public"), // fallback when cwd is repo root
  ];

  const distPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Looked in: ${candidates.join(
        ", ",
      )}. Run "npm run build" to produce dist/public.`,
    );
  }

  return distPath;
}

export function serveStatic(app: Express) {
  const distPath = resolveDistPath();

  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }
    if (req.path.startsWith("/src/") || req.path.startsWith("/@vite/")) {
      res
        .status(404)
        .type("text/plain")
        .send(
          "Vite dev module requested while running the static build. Run the dev server or rebuild the client assets.",
        );
      return;
    }
    next();
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
