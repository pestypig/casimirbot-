import type { Express, Response, Request } from "express";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer, type Server } from "http";
import { storage } from "./sim-storage";
import { fileManager } from "./services/fileManager";
import { simulationParametersSchema, sweepSpecSchema } from "@shared/schema";
import { WebSocket, WebSocketServer } from "ws";
import targetValidationRoutes from "./routes/target-validation.js";
import { lumaRouter } from "./routes/luma";
import { lumaHceRouter } from "./routes/luma-hce";
import { registerLumaWhisperRoute } from "./routes/luma-whispers";
import { hceRouter } from "./routes/hce";
import { getHorizonsElements } from "./utils/horizons-proxy";
import { orchestratorRouter } from "./routes/orchestrator";
import { analysisLoopRouter } from "./routes/analysis-loops";
import noiseGensRouter from "./routes/noise-gens";
import { aiPlanRouter } from "./routes/ai.plan";
import { hullStatusRouter } from "./routes/hull.status";
import { ethosRouter } from "./routes/ethos";
import { searchRouter } from "./routes/search";
import { devTerminalRouter } from "./routes/dev-terminal";
import { voiceRouter } from "./routes/voice";
import { missionBoardRouter } from "./routes/mission-board";
import { helixQiRouter } from "./routes/helix/qi";
import { helixMathRouter } from "./routes/helix/math";
import { helixAuditTreeRouter } from "./routes/helix/audit-tree";
import { helixTimeDilationRouter } from "./routes/helix/time-dilation";
import { warpViabilityRouter } from "./routes/warp-viability";
import { curvatureRouter } from "./routes/physics.curvature";
import { tokamakRouter } from "./routes/physics.tokamak";
import { collapseBenchmarksRouter } from "./routes/benchmarks.collapse";        
import { grAgentRouter } from "./routes/gr-agent";
import { trainingTraceRouter } from "./routes/training-trace";
import { evolutionRouter } from "./routes/evolution";
import { adapterRouter } from "./routes/agi.adapter";
import { constraintPacksRouter } from "./routes/agi.constraint-packs";
import { chatRouter } from "./routes/agi.chat";
import { demonstrationRouter } from "./routes/agi.demonstration";
import { requireJwtMiddleware } from "./auth/jwt";
import { qiSnapHub } from "./qi/qi-snap-broadcaster";
import { vectorizerRouter } from "./routes/vectorizer";
import { removeBgEdgesRouter } from "./routes/remove-bg-edges";
import { hullPreviewRouter } from "./routes/hull-preview";
import { reduceTilesToSample, type RawTileInput } from "./qi/qi-saturation";
import { qiControllerRouter, startQiController } from "./modules/qi/qi-controller.js";
import { codeLatticeRouter } from "./routes/code-lattice";
import { stellarRouter } from "./routes/stellar";
import { starRouter } from "./routes/star";
import { neuroRouter } from "./routes/neuro";
import type { SimResult, Schedule, Flow, Faults, ClockModel } from "@shared/tsn-sim";
import { DEFAULT_QBV_SCHEDULE, DEMO_FLOWS, simulate as simulateTsn } from "../simulations/tsn-sim";
import { getGitFirstAppearances } from "./lib/git-first-appearance";
import { trainStatusRouter } from "./routes/train-status";
import { clientErrorRouter } from "./routes/observability.client-error";
import { createRateLimiter } from "./middleware/rate-limit";
import { createConcurrencyGuard } from "./middleware/concurrency-guard";

const flagEnabled = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === "1") return true;
  if (value === "0") return false;
  return defaultValue;
};

const headerValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
};

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

const fastBoot = process.env.FAST_BOOT === "1";
let scuffemServicePromise: Promise<typeof import("./services/scuffem").scuffemService> | null = null;
const getScuffemService = async () => {
  if (!scuffemServicePromise) {
    scuffemServicePromise = import("./services/scuffem").then((mod) => mod.scuffemService);
  }
  return scuffemServicePromise;
};

export async function registerRoutes(app: Express, existingServer?: Server): Promise<Server> {
  const httpServer = existingServer ?? createServer(app);
  if (fastBoot) {
    console.warn("[routes] FAST_BOOT=1: skipping optional routes and background jobs for faster startup.");
  }
  const rateLimitEnabled = flagEnabled(
    process.env.RATE_LIMIT_ENABLED,
    process.env.NODE_ENV === "production",
  );
  if (rateLimitEnabled) {
    const windowMs = toPositiveInt(process.env.RATE_LIMIT_API_WINDOW_MS, 60_000);
    const max = toPositiveInt(process.env.RATE_LIMIT_API_MAX, 240);
    const askJobsWindowMs = toPositiveInt(
      process.env.RATE_LIMIT_ASK_JOBS_WINDOW_MS,
      60_000,
    );
    const askJobsMax = toPositiveInt(process.env.RATE_LIMIT_ASK_JOBS_MAX, 1200);
    const shouldSkipRateLimit = (req: Request): boolean => {
      if (req.method === "OPTIONS") return true;
      const accept = headerValue(req.headers["accept"]).toLowerCase();
      if (accept.includes("text/event-stream")) return true;
      const path = req.path || "";
      if (path.includes("/stream")) return true;
      if (path.startsWith("/agi/ask/jobs")) return true;
      return false;
    };
    if (askJobsMax > 0) {
      app.use(
        "/api/agi/ask/jobs",
        createRateLimiter({
          windowMs: askJobsWindowMs,
          max: askJobsMax,
          skip: (req) => req.method === "OPTIONS",
        }),
      );
    }
    app.use(
      "/api",
      createRateLimiter({
        windowMs,
        max,
        skip: shouldSkipRateLimit,
        onLimit: (req, res, retryAfterMs) => {
          const ip = headerValue(req.headers["x-forwarded-for"]).split(",")[0]?.trim() || req.ip;
          const ua = headerValue(req.headers["user-agent"]);
          console.warn(
            `[rate-limit] ${req.method} ${req.originalUrl} ip=${ip || "unknown"} ua="${ua.slice(0, 160)}"`
          );
          res.status(429).json({
            error: "rate_limited",
            message: "Too many requests. Please retry shortly.",
            retryAfterMs,
          });
        },
      }),
    );
  }
  const askConcurrencyMax = toPositiveInt(process.env.HELIX_ASK_CONCURRENCY_MAX, 4);
  if (askConcurrencyMax > 0) {
    app.use(
      "/api/agi/ask",
      createConcurrencyGuard({
        max: askConcurrencyMax,
      }),
    );
  }
  app.use("/api/observability", clientErrorRouter);
  app.use("/api/luma/ops", lumaHceRouter);
  app.use("/api/luma", lumaRouter);
  registerLumaWhisperRoute(app);
  app.use("/api/tools/remove-bg-edges", removeBgEdgesRouter);
  app.use("/api/ethos", ethosRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/dev-terminal", devTerminalRouter);
  app.use("/api/voice", voiceRouter);
  app.use("/api/mission-board", missionBoardRouter);
  const evolutionAuthEnabled = flagEnabled(
    process.env.ENABLE_AGI_AUTH ?? process.env.ENABLE_AUTH,
    false,
  );
  if (evolutionAuthEnabled) {
    app.use("/api/evolution", (req, res, next) =>
      requireJwtMiddleware(req, res, next),
    );
  }
  const evolutionRateMax = toPositiveInt(process.env.EVOLUTION_RATE_LIMIT_MAX, 60);
  const evolutionRateWindowMs = toPositiveInt(
    process.env.EVOLUTION_RATE_LIMIT_WINDOW_MS,
    60_000,
  );
  if (evolutionRateMax > 0) {
    app.use(
      "/api/evolution",
      createRateLimiter({
        windowMs: evolutionRateWindowMs,
        max: evolutionRateMax,
        skip: (req) => req.method === "OPTIONS" || req.method === "GET",
      }),
    );
  }
  app.use("/api/evolution", evolutionRouter);

  if (!fastBoot) {
    const { knowledgeRouter } = await import("./routes/knowledge");
    app.use("/api/knowledge", knowledgeRouter);
    app.use("/api/code-lattice", codeLatticeRouter);
    app.use(trainStatusRouter);
    app.use("/api/stellar", stellarRouter);
    app.use("/api/benchmarks/collapse", collapseBenchmarksRouter);
    app.use("/api/physics/warp", warpViabilityRouter);
    app.use("/api/physics/curvature", curvatureRouter);
    app.use("/api/physics/tokamak", tokamakRouter);
    app.use("/api/vectorizer", vectorizerRouter);

    app.use("/api/orchestrator", orchestratorRouter);
    app.use("/api/analysis", analysisLoopRouter);
    app.use(noiseGensRouter);
    app.use("/api/ai", aiPlanRouter);
    app.use("/api/hull/status", hullStatusRouter);
    if (flagEnabled(process.env.ENABLE_STAR_SERVICE ?? process.env.ENABLE_STAR, true)) {
      app.use("/api/star", starRouter);
      app.use("/api/neuro", neuroRouter);
    }
    if (process.env.HULL_MODE === "1" && process.env.ENABLE_CAPSULE_IMPORT === "1") {
      const { hullCapsules } = await import("./routes/hull.capsules");
      app.use("/api/hull/capsules", hullCapsules);
    }
  }

  const enableEssence = !fastBoot && flagEnabled(process.env.ENABLE_ESSENCE, true);
  if (enableEssence) {
    if (process.env.ENABLE_ESSENCE === undefined) {
      console.warn("[routes] ENABLE_ESSENCE not set; defaulting to enabled (set ENABLE_ESSENCE=0 to disable).");
    }
    const { essenceRouter } = await import("./routes/essence");
    app.use("/api/essence", essenceRouter);
    const { fashionRouter } = await import("./routes/fashion");
    app.use("/api/fashion", fashionRouter);
    const { essencePromptsRouter } = await import("./routes/essence.prompts");
    app.use("/api/essence/prompts", essencePromptsRouter);
  }

  // Star Watcher: solar video → coherence
  if (!fastBoot) {
    const { starWatcherRouter } = await import("./routes/star-watcher");
    app.use("/api/star-watcher", starWatcherRouter);
  }

  const enableAgi = !fastBoot && flagEnabled(process.env.ENABLE_AGI, true);
  if (enableAgi) {
    if (process.env.ENABLE_AGI === undefined) {
      console.warn("[routes] ENABLE_AGI not set; defaulting to enabled (set ENABLE_AGI=0 to disable).");
    }
    const agiAuthEnabled = flagEnabled(
      process.env.ENABLE_AGI_AUTH ?? process.env.ENABLE_AUTH,
      false,
    );
    if (agiAuthEnabled) {
      app.use("/api/agi", (req, res, next) =>
        requireJwtMiddleware(req, res, next),
      );
    }
    const { personaRouter } = await import("./routes/agi.persona");
    const { memoryRouter } = await import("./routes/agi.memory");
    const { planRouter } = await import("./routes/agi.plan");
    const { evalRouter } = await import("./routes/agi.eval");
    const { profileRouter } = await import("./routes/agi.profile");
    const { starTelemetryRouter } = await import("./routes/agi.star");
    const { contributionsRouter } = await import("./routes/agi.contributions");
    const { refineryRouter } = await import("./routes/agi.refinery");
    const enableDebate = flagEnabled(process.env.ENABLE_DEBATE, false);
    if (enableDebate) {
      const { debateRouter } = await import("./routes/agi.debate");
      app.use("/api/agi/debate", debateRouter);
    }
    app.use("/api/agi/persona", personaRouter);
    app.use("/api/agi/memory", memoryRouter);
    app.use("/api/agi/profile", profileRouter);
    app.use("/api/agi/contributions", contributionsRouter);
    app.use("/api/agi", chatRouter);
    app.use("/api/agi/demonstration", demonstrationRouter);
    app.use("/api/agi", trainingTraceRouter);
    app.use("/api/agi", refineryRouter);
    app.use("/api/agi", constraintPacksRouter);
    app.use("/api/agi/adapter", adapterRouter);
    const enableTraceApi = flagEnabled(process.env.ENABLE_TRACE_API, false);
    if (enableTraceApi) {
      const { traceRouter } = await import("./routes/agi.trace");
      app.use("/api/agi/trace", traceRouter);
      if (flagEnabled(process.env.ENABLE_MEMORY_UI, false)) {
        const { memoryTraceRouter } = await import("./routes/agi.memory.trace");
        app.use("/api/agi/memory", memoryTraceRouter);
      }
    }
    app.use("/api/agi/star", starTelemetryRouter);
    app.use("/api/agi", planRouter);
    app.use("/api/agi/eval", evalRouter);
  }

  const enableSmallLlmRoutes = !fastBoot && flagEnabled(process.env.ENABLE_SMALL_LLM, true);
  if (enableSmallLlmRoutes) {
    const { smallLlmRouter } = await import("./routes/small-llm");
    app.use("/api/small-llm", smallLlmRouter);
  }

  if (!fastBoot && process.env.ENABLE_PROFILE_SUMMARIZER === "1") {
    const { startProfileSummarizerJob } = await import("./services/profile-summarizer-job");
    startProfileSummarizerJob();
  }

  // Jobs + Tokens router (env-gated optional)
  if (!fastBoot && flagEnabled(process.env.ENABLE_ESSENCE_JOBS, true)) {
    const { jobsRouter } = await import("./routes/jobs");
    app.use("/api/jobs", jobsRouter);
  }

  if (!fastBoot && flagEnabled(process.env.ENABLE_ESSENCE_PROPOSALS, true)) {
    const { proposalsRouter } = await import("./routes/proposals");
    const { profilePanelRouter } = await import("./routes/proposals.profile-panel");
    app.use("/api/proposals", proposalsRouter);
    app.use("/api/proposals/profile-panel", profilePanelRouter);
    const { startProposalJobRunner } = await import("./services/proposals/job-runner");
    startProposalJobRunner();
  }

  if (!fastBoot && process.env.ENABLE_SPECIALISTS === "1") {
    const { specialistsRouter } = await import("./routes/agi.specialists");
    app.use("/api/agi/specialists", specialistsRouter);
  }

  if (!fastBoot) {
    startQiController();
    app.use("/api/qi", qiControllerRouter);
  }

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
      const scuffemService = await getScuffemService();
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
      const scuffemService = await getScuffemService();
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

  // Luma librarian (read-only AI helper)
  app.use("/api/hce", hceRouter);

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

  app.get("/api/halobank/first-appearance", async (req, res) => {
    try {
      const rawLimit = req.query.limit;
      const limitParam =
        typeof rawLimit === "string"
          ? rawLimit
          : Array.isArray(rawLimit)
            ? rawLimit.filter((value): value is string => typeof value === "string")
            : undefined;
      const { items, total, cachedAt } = await getGitFirstAppearances({
        limit: limitParam,
      });
      res.json({ items, total, cachedAt });
    } catch (error) {
      res.status(500).json({
        error: "git_first_appearance_failed",
        message: error instanceof Error ? error.message : "Unknown error",
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
  const overrideRoot = process.env.WARP_WEB_ROOT;
  // Always use fast resolution to avoid blocking startup with deep filesystem scans
  const preferFastWarpResolve = true;
  function hasWarpWeb(dir: string) {
    try {
      return fs.existsSync(dir)
        && (fs.existsSync(path.join(dir, 'creator.html')) || fs.existsSync(path.join(dir, 'spore-pedia.html')));
    } catch { return false; }
  }
  function resolveFastWarpRoot(): { root: string; attempts: string[] } {
    const attempts: string[] = [];
    const seen = new Set<string>();
    const push = (p: string) => {
      if (!p) return;
      const r = path.resolve(p);
      if (!seen.has(r)) {
        attempts.push(r);
        seen.add(r);
      }
    };

    if (overrideRoot) {
      push(overrideRoot);
      if (hasWarpWeb(overrideRoot)) {
        return { root: path.resolve(overrideRoot), attempts };
      }
    }

    const candidates = [
      path.resolve(process.cwd(), "warp-web"),
      path.resolve(process.cwd(), "client", "src", "warp-web"),
      path.resolve(process.cwd(), "dist", "warp-web"),
      path.resolve(__dirname, "..", "warp-web"),
      path.resolve(__dirname, "..", "..", "warp-web"),
    ];

    for (const candidate of candidates) {
      push(candidate);
      if (hasWarpWeb(candidate)) {
        return { root: candidate, attempts };
      }
    }

    return { root: attempts[0] || path.join(process.cwd(), "warp-web"), attempts };
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
  const found = preferFastWarpResolve ? resolveFastWarpRoot() : findWarpRoot();
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
  if (overrideRoot && fs.existsSync(overrideRoot) && path.resolve(overrideRoot) !== path.resolve(warpRoot)) {
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

    // Deep mixing plan (shares warp-web deployment so route stays stable)
    app.get(["/deep-mixing-plan", "/deep-mixing-plan/"], (req, res) => {
      const root = overrideRoot && fs.existsSync(overrideRoot) ? overrideRoot : warpRoot;
      res.sendFile('deep-mixing-plan.html', { root }, (err) => {
        if (err) {
          console.log(`[warp-ledger] ❌ Error serving deep-mixing-plan.html from ${root}: ${err.message}`);
          res.status(404).send(`Deep-mixing plan not found (root=${root}): ${err.message}`);
        } else {
          console.log(`[warp-ledger] ✅ Served /deep-mixing-plan`);
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
    getPipelineProofs,
    getDisplacementField,
    getDisplacementFieldGeometry,
    probeFieldOnHull,
    getLatticeProbe,
    updatePipelineParams,
    ingestHardwareSweepPoint,
    ingestHardwareSectorState,
    ingestHardwareQiSample,
    cancelVacuumGapSweep,
    switchOperationalMode,
    getSectorControlLiveEvent,
    getEnergySnapshot,
    getCurvatureBrick,
    getStressEnergyBrick,
    getCasimirTileSummary,
    getLapseBrick,
    getGrRequest,
    getGrInitialBrick,
    getGrEvolveBrick,
    getGrRegionStats,
    getGrConstraintNetwork4d,
    getGrConstraintContract,
    getGrAssistantReport,
    getGrEvaluation,
    postCurvatureBrickDebugStamp,
    postCurvatureBrickDebugClear,
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
  app.get("/api/helix/pipeline/proofs", getPipelineProofs);
  // Backwards-compatible alias: some clients (HelixCasimirAmplifier) request /api/helix/state
  app.get("/api/helix/state", getPipelineState);
  app.get("/api/helix/field", getDisplacementField);
  app.options("/api/helix/field-geometry", getDisplacementFieldGeometry);
  app.post("/api/helix/field-geometry", getDisplacementFieldGeometry);
  app.options("/api/helix/field-probe", probeFieldOnHull);
  app.post("/api/helix/field-probe", probeFieldOnHull);
  app.get("/api/helix/lattice-probe", getLatticeProbe);
  app.post("/api/helix/lattice-probe", getLatticeProbe);
  app.options("/api/helix/hardware/sweep-point", ingestHardwareSweepPoint);
  app.post("/api/helix/hardware/sweep-point", ingestHardwareSweepPoint);
  app.options("/api/helix/hardware/sector-state", ingestHardwareSectorState);
  app.post("/api/helix/hardware/sector-state", ingestHardwareSectorState);
  app.options("/api/helix/hardware/qi-sample", ingestHardwareQiSample);
  app.post("/api/helix/hardware/qi-sample", ingestHardwareQiSample);
  app.use("/api/helix/qi", helixQiRouter);
  app.use("/api/helix/math", helixMathRouter);
  app.use("/api/helix/audit", helixAuditTreeRouter);
  app.use("/api/helix/time-dilation", helixTimeDilationRouter);
  app.use("/api/helix/hull-preview", hullPreviewRouter);
  app.use("/api/helix", grAgentRouter);
  app.use("/api/helix", trainingTraceRouter);
  app.use("/api/helix", constraintPacksRouter);

  app.get("/api/qisnap/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    res.write(`: qi-snap connected ${Date.now()}\n\n`);

    const clamp = (value: number, min: number, max: number, fallback: number) => {
      if (!Number.isFinite(value)) return fallback;
      if (value < min) return min;
      if (value > max) return max;
      return value;
    };
    const readQuery = (value: unknown): string | undefined => {
      if (Array.isArray(value)) {
        return value.length ? String(value[0]) : undefined;
      }
      return typeof value === "string" ? value : undefined;
    };

    const allowMock =
      process.env.NODE_ENV !== "production" ||
      process.env.QI_SNAP_ALLOW_MOCK === "1" ||
      isLoopback(req.ip);
    const query = req.query as Record<string, unknown>;
    const hzParam = Number(readQuery(query.hz));
    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping ${Date.now()}\n\n`);
      } catch {
        // ignore stream write errors; close handler will cleanup
      }
    }, 15_000);

    let cleanup: (() => void) | null = null;
    const enableMock = allowMock && readQuery(query.mock) === "1";

    if (enableMock) {
      const tilesParam = Number(readQuery(query.tiles));
      const tileTarget = clamp(tilesParam || 400, 16, 4096, 400);
      const sampler =
        readQuery(query.sampler) === "gaussian" ? "gaussian" : "lorentzian";
      const windowParam = Number(readQuery(query.windowS));
      const window_s = windowParam > 0 ? windowParam : 2e-3;
      const hz = clamp(hzParam || 10, 1, 60, 10);
      const intervalMs = Math.max(10, Math.round(1000 / hz));
      const side = Math.ceil(Math.sqrt(tileTarget));
      let t = 0;

      const emit = () => {
        const tiles: RawTileInput[] = [];
        for (let i = 0; i < side; i++) {
          for (let j = 0; j < side; j++) {
            if (tiles.length >= tileTarget) break;
            const phase = Math.sin(0.17 * i + 0.11 * j + 0.9 * t);
            tiles.push({
              id: `mock-${i}-${j}`,
              ijk: [i, j, 0],
              center_m: [i * 1e-3, j * 1e-3, 0],
              rho_neg_Jm3: -Math.abs(0.5 + 0.45 * phase),
              tau_eff_s: window_s,
              qi_limit: 1.0,
            });
          }
        }
        const frame = reduceTilesToSample(tiles, Date.now(), sampler, window_s, {
          frame_kind: "delta",
        });
        try {
          res.write(`data: ${JSON.stringify(frame)}\n\n`);
        } catch {
          // let close handler clean up
        }
        t += intervalMs * 1e-3;
      };

      const timer = setInterval(emit, intervalMs);
      emit();
      cleanup = () => clearInterval(timer);
    } else {
      const minGap = hzParam > 0 ? Math.floor(1000 / clamp(hzParam, 1, 120, 15)) : 0;
      let lastSent = 0;
      const unsubscribe = qiSnapHub.subscribe((frame) => {
        const now = Date.now();
        if (minGap && now - lastSent < minGap) {
          return;
        }
        lastSent = now;
        try {
          res.write(`data: ${JSON.stringify(frame)}\n\n`);
        } catch {
          // swallow; close handler clears listener
        }
      });
      cleanup = unsubscribe;
    }

    const close = () => {
      clearInterval(heartbeat);
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
    };

    req.on("close", close);
    req.on("error", close);
  });

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
  app.get("/api/helix/sector-control/live", getSectorControlLiveEvent);
  app.get("/api/helix/curvature-brick", getCurvatureBrick);
  app.post("/api/helix/curvature-brick", getCurvatureBrick);
  app.get("/api/helix/stress-energy-brick", getStressEnergyBrick);
  app.post("/api/helix/stress-energy-brick", getStressEnergyBrick);
  app.get("/api/helix/casimir-tile-summary", getCasimirTileSummary);
  app.post("/api/helix/casimir-tile-summary", getCasimirTileSummary);
  app.get("/api/helix/lapse-brick", getLapseBrick);
  app.post("/api/helix/lapse-brick", getLapseBrick);
  app.get("/api/helix/gr-request", getGrRequest);
  app.post("/api/helix/gr-request", getGrRequest);
  app.get("/api/helix/gr-initial-brick", getGrInitialBrick);
  app.post("/api/helix/gr-initial-brick", getGrInitialBrick);
  app.get("/api/helix/gr-evolve-brick", getGrEvolveBrick);
  app.post("/api/helix/gr-evolve-brick", getGrEvolveBrick);
  app.get("/api/helix/gr-region-stats", getGrRegionStats);
  app.post("/api/helix/gr-region-stats", getGrRegionStats);
  app.get("/api/helix/gr-constraint-network-4d", getGrConstraintNetwork4d);
  app.post("/api/helix/gr-constraint-network-4d", getGrConstraintNetwork4d);
  app.get("/api/helix/gr-constraint-contract", getGrConstraintContract);
  app.post("/api/helix/gr-constraint-contract", getGrConstraintContract);
  app.get("/api/helix/gr-assistant-report", getGrAssistantReport);
  app.post("/api/helix/gr-assistant-report", getGrAssistantReport);
  app.get("/api/helix/gr-evaluation", getGrEvaluation);
  app.post("/api/helix/gr-evaluation", getGrEvaluation);
  app.post("/api/helix/curvature-brick/debug-stamp", postCurvatureBrickDebugStamp);
  app.post("/api/helix/curvature-brick/debug-clear", postCurvatureBrickDebugClear);
  app.get("/api/helix/phase-bias", getPhaseBiasTable);
  app.get("/api/helix/spectrum", getSpectrumLog);
  app.post("/api/helix/spectrum", postSpectrumLog);

  // TSN/Qbv simulator exposure for Helix panels (logic-only)
  app.post("/api/sim/tsn", async (req, res) => {
    let tsnSim: typeof import("../simulations/tsn-sim");
    try {
      tsnSim = await import("../simulations/tsn-sim");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: "tsn_sim_unavailable", message });
      return;
    }
    const { simulate: simulateTsn, DEFAULT_QBV_SCHEDULE, DEMO_FLOWS } = tsnSim;
    const body = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
    const parseNumber = (value: unknown): number | undefined => {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    const schedule = (body.schedule as Schedule) ?? DEFAULT_QBV_SCHEDULE;
    const flows = Array.isArray(body.flows) && body.flows.length > 0 ? (body.flows as Flow[]) : DEMO_FLOWS;
    const cycles = parseNumber(body.cycles) ?? 10;
    const hopLatencyNs = parseNumber(body.hopLatencyNs);
    const faults = (body.faults as Faults | undefined) ?? undefined;
    const clock = (body.clock as ClockModel | undefined) ?? undefined;
    const framesLimit = Math.min(parseNumber(body.framesLimit) ?? 200, 2_000);

    try {
      const result: SimResult = simulateTsn({ schedule, flows, cycles, hopLatencyNs, faults, clock });
      res.json({
        summary: result.summary,
        fm: result.fm,
        framesTotal: result.frames.length,
        frames: result.frames.slice(0, framesLimit),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: "tsn_sim_failed", message });
    }
  });

  // Ensure API requests never fall through to the Vite HTML handler.
  app.use("/api", (req, res) => {
    res.status(404).json({
      error: "api_not_found",
      path: req.originalUrl ?? req.path,
      hint: "Enable the corresponding server feature flag (e.g., ENABLE_AGI=1) or check the requested path.",
    });
  });

  return httpServer;
}

function isLoopback(ip?: string | string[] | null): boolean {
  if (!ip) return false;
  if (Array.isArray(ip)) {
    return ip.some((value) => isLoopback(value));
  }
  return ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::ffff:127.0.0.1");
}

// Export a minimal routes list so tooling importing routes succeeds.
export const routes = [
  { path: '/', name: 'home' },
  { path: '/inspector', name: 'inspector' }
];
export default routes;

