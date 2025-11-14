import type { Express } from "express";
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from "prom-client";

const registry = new Registry();
collectDefaultMetrics({ register: registry });

const agiTasksTotal = new Counter({
  name: "agi_tasks_total",
  help: "Total AGI task executions",
  labelNames: ["status"],
  registers: [registry],
});

const toolCallsTotal = new Counter({
  name: "tool_calls_total",
  help: "Tool invocations",
  labelNames: ["tool", "status"],
  registers: [registry],
});

const specialistSolverCallsTotal = new Counter({
  name: "specialist_solver_calls_total",
  help: "Specialist solver invocations",
  labelNames: ["solver", "status"],
  registers: [registry],
});

const specialistVerifierCallsTotal = new Counter({
  name: "specialist_verifier_calls_total",
  help: "Specialist verifier results",
  labelNames: ["verifier", "status"],
  registers: [registry],
});

const specialistRepairLoopsTotal = new Counter({
  name: "specialist_repair_loops_total",
  help: "Number of specialist repair attempts",
  registers: [registry],
});

const essenceEnvelopesTotal = new Counter({
  name: "essence_envelopes_total",
  help: "Number of Essence envelopes persisted",
  registers: [registry],
});

const queueJobsActive = new Gauge({
  name: "queue_jobs_active",
  help: "Active queue jobs",
  labelNames: ["queue"],
  registers: [registry],
});

export const traceExportTotal = new Counter({
  name: "trace_export_total",
  help: "Trace export invocations",
  registers: [registry],
});

const agiTaskLatency = new Histogram({
  name: "agi_task_latency_ms",
  help: "Latency for AGI task execution",
  labelNames: ["status"],
  buckets: [50, 100, 250, 500, 1000, 2000, 4000, 8000],
  registers: [registry],
});

const toolLatency = new Histogram({
  name: "tool_latency_ms",
  help: "Latency for tool calls",
  labelNames: ["tool", "status"],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 4000],
  registers: [registry],
});

export const llmLocalSpawnCalls = new Counter({
  name: "llm_local_spawn_calls_total",
  help: "Count of local spawn LLM calls",
  registers: [registry],
});

export const llmLocalSpawnLatency = new Histogram({
  name: "llm_local_spawn_latency_ms",
  help: "Latency of local spawn LLM calls in ms",
  buckets: [50, 100, 200, 500, 1000, 2000, 5000, 10000, 30000, 60000, 120000],
  registers: [registry],
});

const debateRoundsTotal = new Counter({
  name: "agi_debate_rounds_total",
  help: "Total debate turns recorded grouped by role/result",
  labelNames: ["role", "result"],
  registers: [registry],
});

const debateVerificationsTotal = new Counter({
  name: "agi_debate_verifications_total",
  help: "Verifier invocations triggered by debate mode",
  labelNames: ["verifier", "result"],
  registers: [registry],
});

const debateWallMs = new Histogram({
  name: "agi_debate_wall_ms",
  help: "End-to-end debate wall-clock duration",
  buckets: [1000, 5000, 15000, 60000, 180000, 600000, 1200000],
  registers: [registry],
});

export const essenceUploadBytes = new Histogram({
  name: "essence_upload_bytes",
  help: "Size of uploaded artifacts in bytes",
  buckets: [1e4, 5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7],
  registers: [registry],
});

export const taskSuccess = new Counter({
  name: "agi_tasks_success_total",
  help: "Task completions by status",
  labelNames: ["status"],
  registers: [registry],
});

const evalRunsTotal = new Counter({
  name: "agi_eval_runs_total",
  help: "Smoke eval runs grouped by result",
  labelNames: ["result"],
  registers: [registry],
});

export const evalReplayTotal = new Counter({
  name: "agi_eval_replay_total",
  help: "Eval replay requests grouped by status",
  labelNames: ["status"],
  registers: [registry],
});

export const evalReplayLatency = new Histogram({
  name: "agi_eval_replay_latency_ms",
  help: "Eval replay wall-clock latency in milliseconds",
  buckets: [500, 1000, 2000, 5000, 10000, 30000, 60000],
  registers: [registry],
});

export const sseConnections = new Gauge({
  name: "agi_toollog_sse_clients",
  help: "Active tool-log SSE connections",
  registers: [registry],
});

const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests processed by Express",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

const httpRequestDuration = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "route", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [registry],
});

const normalizeStatus = (value?: boolean | string): "ok" | "error" => {
  if (typeof value === "boolean") {
    return value ? "ok" : "error";
  }
  if (value === "ok") {
    return "ok";
  }
  if (value === "error") {
    return "error";
  }
  return "ok";
};

export const metrics = {
  recordTask(latencyMs: number, ok: boolean): void {
    const status = normalizeStatus(ok);
    agiTasksTotal.inc({ status });
    observeTaskLatency(latencyMs, status);
  },
  recordTool(tool: string, latencyMs: number, ok: boolean): void {
    const status = normalizeStatus(ok);
    toolCallsTotal.inc({ tool, status });
    toolLatency.observe({ tool, status }, latencyMs);
  },
  recordSpecialistSolver(solver: string, ok: boolean | string): void {
    const status = normalizeStatus(ok);
    specialistSolverCallsTotal.inc({ solver, status });
  },
  recordSpecialistVerifier(verifier: string, ok: boolean | string): void {
    const status = normalizeStatus(ok);
    specialistVerifierCallsTotal.inc({ verifier, status });
  },
  incrementSpecialistRepair(): void {
    specialistRepairLoopsTotal.inc();
  },
  incrementEnvelope(): void {
    essenceEnvelopesTotal.inc();
  },
  setQueueActive(queue: string, value: number): void {
    queueJobsActive.set({ queue }, value);
  },
  observeHttpRequest(method: string, route: string, statusCode: number, durationMs: number): void {
    const cleanRoute = route || "unknown";
    const status = Number.isFinite(statusCode) ? String(statusCode) : "0";
    httpRequestsTotal.inc({ method: method || "GET", route: cleanRoute, status });
    httpRequestDuration.observe({ method: method || "GET", route: cleanRoute, status }, durationMs);
  },
  recordEvalRun(result: "ok" | "fail" | "skipped" | "error"): void {
    evalRunsTotal.inc({ result });
  },
  recordDebateRound(role: string, result: "ok" | "fail" | "timeout" = "ok"): void {
    debateRoundsTotal.inc({ role, result });
  },
  recordDebateVerification(verifier: string, ok: boolean): void {
    debateVerificationsTotal.inc({ verifier, result: ok ? "ok" : "fail" });
  },
  observeDebateWall(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      return;
    }
    debateWallMs.observe(durationMs);
  },
};

export function observeTaskLatency(durationMs: number, status: boolean | string = "ok"): void {
  const label = normalizeStatus(status);
  agiTaskLatency.observe({ status: label }, durationMs);
}

export function recordTaskOutcome(result: boolean): void {
  taskSuccess.inc({ status: result ? "ok" : "fail" });
}

export function recordTask(status: "ok" | "fail"): void {
  taskSuccess.inc({ status });
}

export function observeUploadBytes(n: number): void {
  if (!Number.isFinite(n) || n <= 0) {
    return;
  }
  essenceUploadBytes.observe(n);
}

export function registerMetricsEndpoint(app: Express): void {
  app.get("/metrics", async (_req, res) => {
    res.setHeader("Content-Type", registry.contentType);
    res.send(await registry.metrics());
  });
}
