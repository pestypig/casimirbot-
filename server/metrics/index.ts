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

const contributionVcuTotal = new Gauge({
  name: "contribution_vcu_total",
  help: "VCUs minted over the active window",
  registers: [registry],
});

const contributionVcuContributorCount = new Gauge({
  name: "contribution_vcu_contributor_count",
  help: "Unique contributors in the active VCU window",
  registers: [registry],
});

const contributionVcuTopShare = new Gauge({
  name: "contribution_vcu_top_share",
  help: "Top contributor share of VCUs in the active window (0..1)",
  registers: [registry],
});

const contributionVcuHhi = new Gauge({
  name: "contribution_vcu_hhi",
  help: "HHI concentration index for VCUs (0..1)",
  registers: [registry],
});

const contributionVcuConcentrationMasked = new Gauge({
  name: "contribution_vcu_concentration_masked",
  help: "1 when concentration metrics are masked due to privacy thresholds",
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

const grAgentLoopRunsTotal = new Counter({
  name: "gr_agent_loop_runs_total",
  help: "GR agent loop runs recorded",
  labelNames: ["status"],
  registers: [registry],
});

const grAgentLoopAttemptsTotal = new Counter({
  name: "gr_agent_loop_attempts_total",
  help: "GR agent loop attempts by gate status and acceptance",
  labelNames: ["gate_status", "accepted"],
  registers: [registry],
});

const grAgentLoopDurationMs = new Histogram({
  name: "gr_agent_loop_duration_ms",
  help: "Wall-clock duration of GR agent loops in milliseconds",
  buckets: [50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 60000],
  registers: [registry],
});

const grAgentLoopAttemptsPerRun = new Histogram({
  name: "gr_agent_loop_attempts_per_run",
  help: "Number of attempts taken per GR agent loop run",
  buckets: [1, 2, 3, 4, 5, 8, 12, 20, 50],
  registers: [registry],
});

const grAgentLoopTimeToGreenMs = new Histogram({
  name: "gr_agent_loop_time_to_green_ms",
  help: "Time from last rejected run to next accepted run (ms)",
  buckets: [1000, 2000, 5000, 10000, 30000, 60000, 300000, 900000],
  registers: [registry],
});

const grAgentLoopSuccessRate = new Gauge({
  name: "gr_agent_loop_success_rate",
  help: "Accepted runs divided by total runs (since process start)",
  registers: [registry],
});

const grAgentLoopConstraintViolationRate = new Gauge({
  name: "gr_agent_loop_constraint_violation_rate",
  help: "Gate failures or unknowns divided by total attempts (since process start)",
  registers: [registry],
});

const grAgentLoopLastAcceptedIteration = new Gauge({
  name: "gr_agent_loop_last_accepted_iteration",
  help: "Iteration index that last passed the GR gate",
  registers: [registry],
});

const grAgentLoopLastAcceptedResidual = new Gauge({
  name: "gr_agent_loop_last_accepted_residual",
  help: "Residual values from the last accepted attempt",
  labelNames: ["metric"],
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

type GrAgentLoopMetricsAttempt = {
  gateStatus?: string;
  accepted?: boolean;
  iteration?: number;
  residuals?: {
    H_rms?: number;
    M_rms?: number;
    H_maxAbs?: number;
    M_maxAbs?: number;
  };
};

type GrAgentLoopMetricsInput = {
  accepted: boolean;
  durationMs?: number;
  acceptedIteration?: number;
  ts?: string;
  attempts: GrAgentLoopMetricsAttempt[];
};

let grAgentLoopAcceptedCount = 0;
let grAgentLoopRejectedCount = 0;
let grAgentLoopGateFailures = 0;
let grAgentLoopGateAttempts = 0;
let lastGrAgentLoopFailureAt: number | null = null;

const parseGateStatus = (value?: string): "pass" | "fail" | "unknown" => {
  if (value === "pass" || value === "fail" || value === "unknown") {
    return value;
  }
  return "unknown";
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
  recordGrAgentLoopRun(input: GrAgentLoopMetricsInput): void {
    const statusLabel = input.accepted ? "accepted" : "rejected";
    grAgentLoopRunsTotal.inc({ status: statusLabel });
    if (input.accepted) {
      grAgentLoopAcceptedCount += 1;
    } else {
      grAgentLoopRejectedCount += 1;
    }
    const totalRuns = grAgentLoopAcceptedCount + grAgentLoopRejectedCount;
    if (totalRuns > 0) {
      grAgentLoopSuccessRate.set(grAgentLoopAcceptedCount / totalRuns);
    }
    if (Number.isFinite(input.durationMs as number) && (input.durationMs as number) >= 0) {
      grAgentLoopDurationMs.observe(input.durationMs as number);
    }
    if (input.attempts.length > 0) {
      grAgentLoopAttemptsPerRun.observe(input.attempts.length);
    }

    const endMs = (() => {
      if (input.ts) {
        const parsed = Date.parse(input.ts);
        if (Number.isFinite(parsed)) return parsed;
      }
      return Date.now();
    })();

    if (input.accepted && lastGrAgentLoopFailureAt !== null) {
      const delta = endMs - lastGrAgentLoopFailureAt;
      if (Number.isFinite(delta) && delta >= 0) {
        grAgentLoopTimeToGreenMs.observe(delta);
      }
      lastGrAgentLoopFailureAt = null;
    } else if (!input.accepted) {
      lastGrAgentLoopFailureAt = endMs;
    }

    let acceptedAttempt: GrAgentLoopMetricsAttempt | undefined;
    for (const attempt of input.attempts) {
      const gateStatus = parseGateStatus(attempt.gateStatus);
      const acceptedLabel = attempt.accepted ? "true" : "false";
      grAgentLoopAttemptsTotal.inc({
        gate_status: gateStatus,
        accepted: acceptedLabel,
      });
      grAgentLoopGateAttempts += 1;
      if (gateStatus !== "pass") {
        grAgentLoopGateFailures += 1;
      }
      if (attempt.accepted) {
        acceptedAttempt = attempt;
      }
    }

    if (grAgentLoopGateAttempts > 0) {
      grAgentLoopConstraintViolationRate.set(
        grAgentLoopGateFailures / grAgentLoopGateAttempts,
      );
    }

    if (input.accepted) {
      const iteration =
        input.acceptedIteration ??
        (acceptedAttempt?.iteration as number | undefined);
      if (Number.isFinite(iteration as number)) {
        grAgentLoopLastAcceptedIteration.set(iteration as number);
      }
      const residuals = acceptedAttempt?.residuals;
      if (residuals) {
        const entries: Array<[string, number | undefined]> = [
          ["H_rms", residuals.H_rms],
          ["M_rms", residuals.M_rms],
          ["H_maxAbs", residuals.H_maxAbs],
          ["M_maxAbs", residuals.M_maxAbs],
        ];
        for (const [metric, value] of entries) {
          if (Number.isFinite(value as number)) {
            grAgentLoopLastAcceptedResidual.set({ metric }, value as number);
          }
        }
      }
    }
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
  setContributionConcentration(input: {
    totalVcu: number;
    contributorCount: number;
    topShare: number;
    hhi: number;
    masked?: boolean;
  }): void {
    contributionVcuTotal.set(Math.max(0, input.totalVcu));
    contributionVcuContributorCount.set(
      Math.max(0, input.contributorCount),
    );
    contributionVcuTopShare.set(
      Number.isFinite(input.topShare) ? input.topShare : 0,
    );
    contributionVcuHhi.set(Number.isFinite(input.hhi) ? input.hhi : 0);
    contributionVcuConcentrationMasked.set(input.masked ? 1 : 0);
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
