import type { Express, Response } from "express";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scuffemService } from "./services/scuffem";
import { fileManager } from "./services/fileManager";
import { simulationParametersSchema, sweepSpecSchema } from "@shared/schema";
import { WebSocket, WebSocketServer } from "ws";
import targetValidationRoutes from "./routes/target-validation.js";
import { getHorizonsElements } from "./utils/horizons-proxy";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // --- Realtime plumbing ----------------------------------------------------
  // Support multiple WS subscribers per simulation + SSE fallback
  let wss: WebSocketServer | null = null;
  const connections = new Map<string, Set<WebSocket>>();
  const sseConnections = new Map<string, Set<Response>>();
  const hardwareSseConnections = new Map<string, Set<Response>>();

  const broadcastWS = (simulationId: string, payload: any) => {
    const bucket = connections.get(simulationId);
    if (!bucket) return;
    const data = JSON.stringify(payload);
    for (const ws of Array.from(bucket)) {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(data); } catch { /* noop */ }
      } else {
        bucket.delete(ws);
      }
    }
    if (bucket.size === 0) connections.delete(simulationId);
  };

  const broadcastHardware = (topic: string, payload: any) => {
    const bucket = hardwareSseConnections.get(topic);
    if (!bucket) return;
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of Array.from(bucket)) {
      try { res.write(data); } catch { bucket.delete(res); }
    }
    if (bucket.size === 0) hardwareSseConnections.delete(topic);
  };

  const broadcastSSE = (simulationId: string, payload: any) => {
    const bucket = sseConnections.get(simulationId);
    if (!bucket) return;
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of Array.from(bucket)) {
      try { res.write(data); } catch { bucket.delete(res); }
    }
    if (bucket.size === 0) sseConnections.delete(simulationId);
  };

  if (process.env.NODE_ENV === "production" || process.env.ENABLE_WS === "true") {
    wss = new WebSocketServer({ 
      server: httpServer,
      path: "/ws"
    });

    // Optional keepalive/ping to clean up dead sockets
    const pingInterval = setInterval(() => {
      for (const bucket of Array.from(connections.values())) {
        for (const ws of Array.from(bucket)) {
          if (ws && (ws as WebSocket).readyState === WebSocket.OPEN) {
            try { (ws as WebSocket).ping(); } catch { bucket.delete(ws as WebSocket); }
          } else {
            bucket.delete(ws as WebSocket);
          }
        }
      }
    }, 30_000);
    // Stop pings when server closes
    httpServer.on("close", () => clearInterval(pingInterval));

    wss.on("connection", (ws, req) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const simulationId = url.searchParams.get("simulationId");
      if (!simulationId) {
        ws.close(1008, "simulationId required");
        return;
      }
      let bucket = connections.get(simulationId);
      if (!bucket) {
        bucket = new Set<WebSocket>();
        connections.set(simulationId, bucket);
      }
      bucket.add(ws);

      ws.on("close", () => {
        const b = connections.get(simulationId);
        if (b) {
          b.delete(ws);
          if (b.size === 0) connections.delete(simulationId);
        }
      });
      ws.on("error", () => {
        try { ws.terminate(); } catch {}
      });
    });
  }

  // --- SSE (Server-Sent Events) fallback -----------------------------------
  app.get("/api/simulations/:id/stream", (req, res) => {
    // headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const id = req.params.id;
    let bucket = sseConnections.get(id);
    if (!bucket) {
      bucket = new Set<Response>();
      sseConnections.set(id, bucket);
    }
    bucket.add(res);

    // initial hello
    res.write(`data: ${JSON.stringify({ type: "hello", simulationId: id })}\n\n`);

    req.on("close", () => {
      const b = sseConnections.get(id);
      if (b) {
        b.delete(res);
        if (b.size === 0) sseConnections.delete(id);
      }
    });
  });

  app.get("/api/helix/hardware/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const topicParam = typeof req.query.topic === "string" && req.query.topic.trim().length > 0
      ? req.query.topic.trim()
      : "default";
    const topic = topicParam;

    let bucket = hardwareSseConnections.get(topic);
    if (!bucket) {
      bucket = new Set<Response>();
      hardwareSseConnections.set(topic, bucket);
    }
    bucket.add(res);

    res.write(`data: ${JSON.stringify({ type: "hello", topic })}\n\n`);

    req.on("close", () => {
      const b = hardwareSseConnections.get(topic);
      if (b) {
        b.delete(res);
        if (b.size === 0) hardwareSseConnections.delete(topic);
      }
    });
  });

  app.options("/api/helix/hardware/stream", (req, res) => {
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).end();
  });

  app.post("/api/helix/hardware/stream", (req, res) => {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
    const panelIdRaw = typeof body.panelId === "string" && body.panelId.trim().length > 0 ? body.panelId.trim() : "default";
    const payload = {
      type: "profile",
      topic: panelIdRaw,
      profile: body.profile ?? null,
      source: body.source ?? "bridge",
      action: body.action ?? "connect",
      ts: Date.now(),
    };
    broadcastHardware(panelIdRaw, payload);
    res.status(200).json({ ok: true, topic: panelIdRaw });
  });

  // --- REST API -------------------------------------------------------------

  // Get all simulations
  app.get("/api/simulations", async (req, res) => {
    try {
      const simulations = await storage.getAllSimulations();
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch simulations" 
      });
    }
  });

  // Get specific simulation
  app.get("/api/simulations/:id", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch simulation" 
      });
    }
  });

  // Create new simulation
  app.post("/api/simulations", async (req, res) => {
    try {
      const validatedData = simulationParametersSchema.parse(req.body);

      const simulation = await storage.createSimulation({
        parameters: validatedData,
        status: "pending",
        startTime: new Date(),
        generatedFiles: [],
        logs: []
      });

      res.status(201).json(simulation);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid simulation parameters" 
      });
    }
  });

  // Start simulation
  app.post("/api/simulations/:id/start", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      // Update status to generating
      await storage.updateSimulation(req.params.id, { status: "generating" });

      // Start simulation in background
      scuffemService.runSimulation(
        simulation.parameters,
        req.params.id,
        async (message: string) => {
          // Broadcast progress updates (WS + SSE)
          const payload = { type: "progress", message };
          broadcastWS(req.params.id, payload);
          broadcastSSE(req.params.id, payload);

          // Append to logs (fetch latest to avoid stale-closure overwrite)
          try {
            const latest = await storage.getSimulation(req.params.id);
            const prevLogs = latest?.logs ?? [];
            await storage.updateSimulation(req.params.id, { logs: [...prevLogs, message] });
          } catch {
            // best-effort; ignore log write errors
          }
        }
      ).then(async (result) => {
        if (result.success) {
          // Get generated files
          const generatedFiles = await scuffemService.getSimulationFiles(req.params.id);

          await storage.updateSimulation(req.params.id, {
            status: "completed",
            endTime: new Date(),
            results: result.results,
            generatedFiles
          });

          const payload = { type: "completed", results: result.results };
          broadcastWS(req.params.id, payload);
          broadcastSSE(req.params.id, payload);
        } else {
          await storage.updateSimulation(req.params.id, {
            status: "failed",
            endTime: new Date(),
            error: result.error
          });

          const payload = { type: "error", error: result.error };
          broadcastWS(req.params.id, payload);
          broadcastSSE(req.params.id, payload);
        }
      }).catch(async (error) => {
        await storage.updateSimulation(req.params.id, {
          status: "failed",
          endTime: new Date(),
          error: error.message
        });

        const payload = { type: "error", error: error.message };
        broadcastWS(req.params.id, payload);
        broadcastSSE(req.params.id, payload);
      });

      res.json({ message: "Simulation started" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to start simulation" 
      });
    }
  });

  // Generate .scuffgeo file only
  app.post("/api/simulations/:id/generate", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      const scuffgeoContent = scuffemService.generateScuffgeoContent(simulation.parameters);

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", 'attachment; filename="geometry.scuffgeo"');
      res.send(scuffgeoContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate .scuffgeo file" 
      });
    }
  });

  // Download file
  app.get("/api/simulations/:id/files/:fileId", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      const file = simulation.generatedFiles.find(f => f.id === req.params.fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const fileContent = await fileManager.readFile(file.path);

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
      res.send(fileContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to download file" 
      });
    }
  });

  // Download all files as ZIP
  app.get("/api/simulations/:id/download", async (req, res) => {
    try {
      const simulation = await storage.getSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      const zipContent = await fileManager.createZipArchive(req.params.id);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="simulation-${req.params.id}.zip"`);
      res.send(zipContent);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create ZIP archive" 
      });
    }
  });

  // Delete simulation
  app.delete("/api/simulations/:id", async (req, res) => {
    try {
      const success = await storage.deleteSimulation(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Simulation not found" });
      }
      res.json({ message: "Simulation deleted" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete simulation" 
      });
    }
  });

  // Research Papers API for AI/bot integration
  app.get("/api/papers", (req, res) => {
    try {
      const papers = [
        {
          title: "83 MW Needle Hull Mark 1",
          url: "/attached_assets/83 MW Needle Hull Mark 1 update_1753733381119.pdf",
          year: 2025,
          description: "Comprehensive analysis of the Needle Hull Mark 1 warp bubble design with exotic mass calculations and power requirements"
        },
        {
          title: "Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator",
          url: "/attached_assets/Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf", 
          year: 2025,
          description: "Research on geometric amplification factors in concave cavity designs for enhanced Casimir effect generation"
        },
        {
          title: "Time-Sliced Sector Strobing Functions as a GR-Valid Proxy",
          url: "/attached_assets/time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf",
          year: 2025,
          description: "Analysis of sector strobing techniques for time-scale separation in general relativity applications"
        },
        {
          title: "CheckList of Bubble Metric",
          url: "/attached_assets/CheckList of Bubble Metric_1753798567838.pdf",
          year: 2025,
          description: "Quality assurance checklist for warp bubble metric calculations and validation procedures"
        }
      ];

      res.json(papers);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve research papers"
      });
    }
  });

  // Health check endpoint for deployment verification
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      service: "Casimir Effect Research Platform"
    });
  });

  // Documents listing endpoint for crawlers
  app.get("/documents/", (req, res) => {
    try {
      const documents = [
        {
          title: "83 MW Needle Hull Mark 1 Update",
          url: "/attached_assets/83 MW Needle Hull Mark 1 update_1753733381119.pdf",
          type: "Research Paper",
          description: "Needle Hull warp bubble design specifications"
        },
        {
          title: "Geometry-Amplified Dynamic Casimir Effect",
          url: "/attached_assets/Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf",
          type: "Research Paper", 
          description: "Concave cavity Casimir amplification research"
        },
        {
          title: "Time-Sliced Sector Strobing Functions",
          url: "/attached_assets/time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf",
          type: "Research Paper",
          description: "GR-compliant sector strobing methodology"
        },
        {
          title: "Bubble Metric Checklist",
          url: "/attached_assets/CheckList of Bubble Metric_1753798567838.pdf",
          type: "Reference Document",
          description: "Warp bubble validation checklist"
        }
      ];

      res.json({
        message: "Available research documents",
        count: documents.length,
        documents: documents
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to list documents"
      });
    }
  });

  // Add target validation routes
  app.use("/api", targetValidationRoutes);

  // ---- JPL Horizons API Proxy for precise orbital elements ---------------
  app.get("/api/horizons", async (req, res) => {
    try {
      const year = req.query.year;
      if (!year || typeof year !== 'string') {
        return res.status(400).json({ error: 'Year parameter required' });
      }
      
      const elements = await getHorizonsElements(year);
      res.json(elements);
    } catch (error) {
      console.error('Horizons API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch orbital elements',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ---- Serve HaloBank static HTML file ------------------------------------
  app.get("/halobank", (req, res) => {
    // Use Express's built-in sendFile method - no need for require/import
    res.sendFile('halobank.html', { root: process.cwd() }, (err) => {
      if (err) {
        console.log(`[/halobank] ❌ Error serving file: ${err.message}`);
        res.status(404).send(`HaloBank page not found: ${err.message}`);
      } else {
        console.log(`[/halobank] ✅ Successfully served halobank.html`);
      }
    });
  });

  const serveHalobankTimeline = (req: express.Request, res: Response) => {
    res.type("application/javascript");
    res.sendFile("halobank-spore-timeline.js", { root: process.cwd() }, (err) => {
      if (err) {
        console.log(`[/halobank timeline] Error serving module: ${err.message}`);
        if (!res.headersSent) {
          res.status(404).type("text/plain").send(`Timeline module not found: ${err.message}`);
        }
      } else {
        console.log(`[/halobank timeline] Served ${req.originalUrl}`);
      }
    });
  };

  // Support requests for the timeline module from any nested halobank page copy
  app.get("*", (req: express.Request, res: Response, next: express.NextFunction) => {
    if (req.path?.toLowerCase().endsWith("halobank-spore-timeline.js")) {
      serveHalobankTimeline(req, res);
      return;
    }
    next();
  });

  // ---- Warp Creator micro-site (no-build static) ---------------------------
  // Serve the warp-web assets under a dedicated /warp prefix to avoid clashes
  // with the main app's /css or /js. The HTML uses relative paths (./css, ./js)
  // so mounting the whole folder at /warp makes those resolve to /warp/css, /warp/js.
  // Resolve warp-web root robustly across different runtime CWDs (dev/prod/replit)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  function hasWarpWeb(dir: string) {
    try {
      return fs.existsSync(dir)
        && (fs.existsSync(path.join(dir, 'creator.html')) || fs.existsSync(path.join(dir, 'spore-pedia.html')));
    } catch { return false; }
  }
  function findWarpRoot(): { root: string; attempts: string[] } {
    const attempts: string[] = [];
    const seen = new Set<string>();
    const push = (p: string) => { const r = path.resolve(p); if (!seen.has(r)) { attempts.push(r); seen.add(r); } };

    const bases = [
      process.cwd(),
      path.resolve(process.cwd(), 'client/src'), // explicit client/src base for warp-web in source tree
      __dirname,
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '../..'),
      path.resolve(process.cwd(), '..'),
    ];
    function searchChildrenForWarpWeb(base: string, maxDepth = 2): string | null {
      try {
        const stack: Array<{ dir: string; depth: number }> = [{ dir: base, depth: 0 }];
        while (stack.length) {
          const { dir, depth } = stack.shift()!;
          if (depth > maxDepth) continue;
          let entries: string[] = [];
          try { entries = fs.readdirSync(dir).map(e => path.join(dir, e)); } catch { continue; }
          for (const e of entries) {
            const name = path.basename(e);
            let stat: fs.Stats | null = null;
            try { stat = fs.statSync(e); } catch { continue; }
            if (stat && stat.isDirectory()) {
              const candidate = path.join(e, 'warp-web');
              push(candidate);
              if (hasWarpWeb(candidate)) return candidate;
              // Also enqueue child for further search
              stack.push({ dir: e, depth: depth + 1 });
            }
          }
        }
      } catch {}
      return null;
    }
    for (const base of bases) {
      // walk up to 6 levels from each base and test '<level>/warp-web'
      let d = path.resolve(base);
      for (let i = 0; i < 6; i++) {
        const candidate = path.join(d, 'warp-web');
        push(candidate);
        if (hasWarpWeb(candidate)) return { root: candidate, attempts };
        // also check potential monorepo layouts
        const alt1 = path.join(d, 'apps', 'warp-web'); push(alt1); if (hasWarpWeb(alt1)) return { root: alt1, attempts };
        const alt2 = path.join(d, 'packages', 'warp-web'); push(alt2); if (hasWarpWeb(alt2)) return { root: alt2, attempts };
        d = path.dirname(d);
        const parent = path.dirname(d);
        if (parent === d) break;
      }
      // If not found walking up, try a shallow child search from the base
      const childHit = searchChildrenForWarpWeb(base, 2);
      if (childHit) return { root: childHit, attempts };
    }
    // Fall back to first attempt
    return { root: attempts[0] || path.join(process.cwd(), 'warp-web'), attempts };
  }
  const found = findWarpRoot();
  const warpRoot = found.root;
  const warpAttempts = found.attempts;
  if (!hasWarpWeb(warpRoot)) {
    console.warn(`[warp] Could not locate warp-web site. Tried (${found.attempts.length}):\n - ` + found.attempts.join('\n - '));
    console.warn(`[warp] Using fallback root: ${warpRoot}`);
  } else {
    console.log(`[warp] Serving warp-web from: ${warpRoot}`);
  }
  app.use('/warp', express.static(warpRoot));

  // Replit compatibility: allow overriding warp-web root explicitly via env
  // e.g., WARP_WEB_ROOT=/home/runner/workspace/warp-web
  const overrideRoot = process.env.WARP_WEB_ROOT;
  if (overrideRoot && fs.existsSync(overrideRoot)) {
    console.log(`[warp] Replit override detected: WARP_WEB_ROOT=${overrideRoot}`);
    app.use('/warp', express.static(overrideRoot));
  }

  // Debug the resolved root at runtime
  app.get('/warp/_debug-root', (req, res) => {
    const root = overrideRoot && fs.existsSync(overrideRoot) ? overrideRoot : warpRoot;
    res.json({
      resolvedRoot: root,
      overrideRoot: overrideRoot || null,
      exists: fs.existsSync(root),
      attempts: warpAttempts,
      cwd: process.cwd(),
      __dirname
    });
  });

  // Landing → Spore‑pedia
  app.get(["/warp", "/warp/", "/warp/spore-pedia"], (req, res) => {
    const root = overrideRoot && fs.existsSync(overrideRoot) ? overrideRoot : warpRoot;
    res.sendFile('spore-pedia.html', { root }, (err) => {
      if (err) {
        console.log(`[/warp] ❌ Error serving spore-pedia.html from ${root}: ${err.message}`);
        res.status(404).send(`Spore-pedia not found (root=${root}): ${err.message}`);
      } else {
        console.log(`[/warp] ✅ Served /warp/spore-pedia`);
      }
    });
  });

  // Creator page
  app.get("/warp/creator", (req, res) => {
    const root = overrideRoot && fs.existsSync(overrideRoot) ? overrideRoot : warpRoot;
    res.sendFile('creator.html', { root }, (err) => {
      if (err) {
        console.log(`[/warp] ❌ Error serving creator.html from ${root}: ${err.message}`);
        res.status(404).send(`Creator not found (root=${root}): ${err.message}`);
      } else {
        console.log(`[/warp] ✅ Served /warp/creator`);
      }
    });
  });

  // KM-scale warp ledger lab (standalone path under root)
  app.get("/km-scale-warp-ledger", (req, res) => {
    const root = overrideRoot && fs.existsSync(overrideRoot) ? overrideRoot : warpRoot;
    res.sendFile('km-scale-warp-ledger.html', { root }, (err) => {
      if (err) {
        console.log(`[warp-ledger] ❌ Error serving km-scale-warp-ledger.html from ${root}: ${err.message}`);
        res.status(404).send(`KM-scale warp ledger not found (root=${root}): ${err.message}`);
      } else {
        console.log(`[warp-ledger] ✅ Served /km-scale-warp-ledger`);
      }
    });
  });

  // Generic: /warp/:page → serve <page>.html from warp-web (e.g., /warp/creator2)
  app.get('/warp/:page', (req, res, next) => {
    const page = req.params.page;
    // Avoid catching known API/static prefixes
    if (!page || page.includes('.') || page === 'css' || page === 'js' || page === '_debug-root') return next();
    const root = overrideRoot && fs.existsSync(overrideRoot) ? overrideRoot : warpRoot;
    const fileName = `${page}.html`;
    const filePath = path.join(root, fileName);
    if (fs.existsSync(filePath)) {
      res.sendFile(fileName, { root }, (err) => {
        if (err) {
          console.log(`[/warp] ❌ Error serving ${fileName} from ${root}: ${err.message}`);
          res.status(404).send(`Page not found: ${fileName} (root=${root})`);
        } else {
          console.log(`[/warp] ✅ Served /warp/${page}`);
        }
      });
    } else {
      res.status(404).send(`Page not found: ${fileName} (root=${root})`);
    }
  });

  // Convenience redirects for bare routes if someone visits /spore-pedia or /creator
  app.get('/spore-pedia', (_req, res) => res.redirect(302, '/warp/spore-pedia'));
  app.get('/creator', (_req, res) => res.redirect(302, '/warp/creator'));

  // Helpful tip for hosted environments
  if (process.env.REPL_ID && !hasWarpWeb(warpRoot) && !overrideRoot) {
    console.warn('[warp] Replit detected but warp-web path unresolved. Set env WARP_WEB_ROOT to your absolute path, e.g. /home/runner/workspace/warp-web');
  }

  // ---- Helix core: prefer .ts in dev, fall back to .js in prod --------------
  async function importHelixCore() {
    try {
      // ts-node/tsx dev: load TypeScript module directly
      return await import("./helix-core.ts");
    } catch (eTs) {
      try {
        // compiled/bundled prod: load emitted JavaScript
        return await import("./helix-core.js");
      } catch (eJs) {
        const tsMsg = (eTs instanceof Error ? eTs.message : String(eTs));
        const jsMsg = (eJs instanceof Error ? eJs.message : String(eJs));
        throw new Error(
          `Failed to load helix-core (tried .ts then .js). ` +
          `ts: ${tsMsg} | js: ${jsMsg}`
        );
      }
    }
  }
  const core = await importHelixCore();
  const {
    handleHelixCommand,
    getTileStatus,
    getSystemMetrics,
    getPipelineState,
    getDisplacementField,
    updatePipelineParams,
    ingestHardwareSweepPoint,
    ingestHardwareSectorState,
    ingestHardwareQiSample,
    cancelVacuumGapSweep,
    switchOperationalMode,
    getEnergySnapshot,
    getCurvatureBrick,
    getPhaseBiasTable,
    getSpectrumLog,
    postSpectrumLog,
    orchestrateParametricSweep,
    publish: publishHelixEvent,
    registerHardwareBroadcast: registerHardwareBroadcastFn,
  } = core;

  // Helpful startup log to confirm dynamic import succeeded and which build was loaded
  try {
    console.log(`[routes] Loaded helix-core module; VERSION=${(core as any).VERSION ?? 'unknown'}`);
  } catch (e) {
    console.log('[routes] Loaded helix-core module (version unknown)');
  }

  if (typeof registerHardwareBroadcastFn === "function") {
    try {
      registerHardwareBroadcastFn(broadcastHardware);
    } catch (err) {
      console.warn("[routes] registerHardwareBroadcast failed:", err);
    }
  }

  app.post("/api/helix/command", handleHelixCommand);
  app.get("/api/helix/tiles/:sectorId", getTileStatus);
  app.get("/api/helix/metrics", getSystemMetrics);
  app.get("/api/helix/pipeline", getPipelineState);
  // Backwards-compatible alias: some clients (HelixCasimirAmplifier) request /api/helix/state
  app.get("/api/helix/state", getPipelineState);
  app.get("/api/helix/field", getDisplacementField);
  app.options("/api/helix/hardware/sweep-point", ingestHardwareSweepPoint);
  app.post("/api/helix/hardware/sweep-point", ingestHardwareSweepPoint);
  app.options("/api/helix/hardware/sector-state", ingestHardwareSectorState);
  app.post("/api/helix/hardware/sector-state", ingestHardwareSectorState);
  app.options("/api/helix/hardware/qi-sample", ingestHardwareQiSample);
  app.post("/api/helix/hardware/qi-sample", ingestHardwareQiSample);
  // NEW: expose exact computeEnergySnapshot result (GET returns current defaults; POST accepts optional { sim })
  app.get ("/api/helix/snapshot", getEnergySnapshot);
  app.post("/api/helix/snapshot", getEnergySnapshot);
  // Alias for HelixCasimirAmplifier component compatibility
  app.get("/api/helix/displacement", getDisplacementField);
  app.post("/api/helix/pipeline/update", updatePipelineParams);
  app.post("/api/helix/sweep/run", async (req, res) => {
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
    const specInput =
      body && typeof body.spec === "object"
        ? (body.spec as Record<string, unknown>)
        : (body as Record<string, unknown>);
    const parsed = sweepSpecSchema.safeParse(specInput);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid-spec", details: parsed.error.flatten() });
      return;
    }

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.flushHeaders?.();

    const abortController = new AbortController();
    req.on("close", () => abortController.abort());

    try {
      const iterator = orchestrateParametricSweep(parsed.data, { signal: abortController.signal });
      for await (const event of iterator) {
        if (res.writableEnded) break;
        res.write(JSON.stringify(event) + "\n");
        if (event.type === "point") {
          try {
            publishHelixEvent?.("parametricSweepStep", event.payload);
          } catch (err) {
            console.warn("[routes] parametric sweep bus publish failed:", err);
          }
        }
        if (event.type === "abort") {
          break;
        }
      }
      if (!res.writableEnded) {
        res.end();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (abortController.signal.aborted) {
        if (!res.writableEnded) {
          res.end();
        }
        return;
      }
      if (res.headersSent) {
        res.write(JSON.stringify({ type: "abort", payload: { reason: message } }) + "\n");
        res.end();
      } else {
        res.status(500).json({ error: "sweep-failed", message });
      }
    }
  });
  app.post("/api/helix/pipeline/cancel-sweep", cancelVacuumGapSweep);
  app.post("/api/helix/pipeline/mode", switchOperationalMode);
  // Alias for HelixCasimirAmplifier component mode switching
  app.post("/api/helix/mode", switchOperationalMode);
  app.get("/api/helix/curvature-brick", getCurvatureBrick);
  app.post("/api/helix/curvature-brick", getCurvatureBrick);
  app.get("/api/helix/phase-bias", getPhaseBiasTable);
  app.get("/api/helix/spectrum", getSpectrumLog);
  app.post("/api/helix/spectrum", postSpectrumLog);

  return httpServer;
}

// Export a minimal routes list so tooling importing routes succeeds.
export const routes = [
  { path: '/', name: 'home' },
  { path: '/inspector', name: 'inspector' }
];
export default routes;
