import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scuffemService } from "./services/scuffem";
import { fileManager } from "./services/fileManager";
import { simulationParametersSchema } from "@shared/schema";
import { WebSocket, WebSocketServer } from "ws";
import targetValidationRoutes from "./routes/target-validation.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // --- Realtime plumbing ----------------------------------------------------
  // Support multiple WS subscribers per simulation + SSE fallback
  let wss: WebSocketServer | null = null;
  const connections = new Map<string, Set<WebSocket>>();
  const sseConnections = new Map<string, Set<Response>>();

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
      for (const bucket of connections.values()) {
        for (const ws of Array.from(bucket)) {
          if (ws.readyState === WebSocket.OPEN) {
            try { ws.ping(); } catch { bucket.delete(ws); }
          } else {
            bucket.delete(ws);
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
  const {
    handleHelixCommand,
    getTileStatus,
    getSystemMetrics,
    getPipelineState,
    getDisplacementField,
    updatePipelineParams,
    switchOperationalMode
  } = await importHelixCore();

  app.post("/api/helix/command", handleHelixCommand);
  app.get("/api/helix/tiles/:sectorId", getTileStatus);
  app.get("/api/helix/metrics", getSystemMetrics);
  app.get("/api/helix/pipeline", getPipelineState);
  app.get("/api/helix/field", getDisplacementField);
  // Alias for HelixCasimirAmplifier component compatibility
  app.get("/api/helix/displacement", getDisplacementField);
  app.post("/api/helix/pipeline/update", updatePipelineParams);
  app.post("/api/helix/pipeline/mode", switchOperationalMode);
  // Alias for HelixCasimirAmplifier component mode switching
  app.post("/api/helix/mode", switchOperationalMode);

  return httpServer;
}