import { Router } from "express";
import { getQueueSnapshot } from "../queue";
import { getGpuThermals } from "../services/hardware/gpu-scheduler";
import { getToolLogs } from "../services/observability/tool-log-store";
import { resolveLocalContextTokens } from "../services/llm/local-runtime";
import { getLocalRuntimeStats } from "../services/llm/local-runtime-stats";
import { getLlmHttpBreakerSnapshot } from "../skills/llm.http";
import { getHullAllowList, hullModeEnabled, isHullAllowed } from "../security/hull-guard";

type EndpointStatus = { url: string; allowed: boolean } | null;

const describeEndpoint = (value?: string | null): EndpointStatus => {
  if (!value) {
    return null;
  }
  const url = value.trim();
  if (!url) {
    return null;
  }
  return { url, allowed: isHullAllowed(url) };
};

const sumCounts = (counts?: Record<string, number> | null): number => {
  if (!counts) return 0;
  return Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0);
};

const countPolicyFlag = (value?: boolean | number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return value ? 1 : 0;
};

export const hullStatusRouter = Router();

hullStatusRouter.get("/", (_req, res) => {
  const hullMode = hullModeEnabled();
  const allowHosts = getHullAllowList();
  const queue = getQueueSnapshot();
  const queueDepth = sumCounts(queue.active) + sumCounts(queue.pending);
  const approvalsOutstanding = getToolLogs()
    .map((entry) => countPolicyFlag(entry.policy?.approvalMissing))
    .reduce((sum, value) => sum + value, 0);
  const thermals = getGpuThermals();
  const kvBudget = Number(process.env.KV_BUDGET_BYTES ?? 0);
  const localStats = getLocalRuntimeStats();
  const hasContextEnv =
    process.env.LLM_LOCAL_CONTEXT_TOKENS ||
    process.env.LLM_LOCAL_CTX_TOKENS ||
    process.env.LLM_LOCAL_CTX_SIZE ||
    process.env.LLM_LOCAL_CONTEXT_SIZE;
  const contextTokens = localStats?.contextTokens ?? (hasContextEnv ? resolveLocalContextTokens() : null);

  res.json({
    hull_mode: hullMode,
    allow_hosts: allowHosts,
    llm_policy: process.env.LLM_POLICY ?? "hybrid",
    llm_runtime: process.env.LLM_RUNTIME ?? null,
    llm_local: {
      base: process.env.LLM_LOCAL_BASE ?? null,
      model: process.env.LLM_LOCAL_MODEL_PATH ?? process.env.LLM_LOCAL_MODEL ?? null,
      lora: process.env.LLM_LOCAL_LORA_PATH ?? null,
      context_tokens: contextTokens,
      stats: localStats,
    },
    llm_http: describeEndpoint(process.env.LLM_HTTP_BASE),
    llm_http_breaker: getLlmHttpBreakerSnapshot(),
    stt_http: describeEndpoint(process.env.WHISPER_HTTP_URL),
    diff_http: describeEndpoint(process.env.DIFF_HTTP_URL),
    gpu: {
      temp_c: thermals.current,
      max_c: thermals.max,
      override: process.env.GPU_TEMP_OVERRIDE ?? null,
    },
    queue,
    queue_depth: queueDepth,
    approvals_outstanding: approvalsOutstanding,
    kv: {
      budget_bytes: Number.isFinite(kvBudget) && kvBudget > 0 ? kvBudget : null,
      evict_strategy: process.env.KV_EVICT_STRATEGY ?? "oldest",
    },
    timestamp: new Date().toISOString(),
  });
});
