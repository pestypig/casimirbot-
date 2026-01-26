import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function resolveDistPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const candidates = [
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
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
  app.use((req: Request, res: Response, next: NextFunction) => {
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

  app.use("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
