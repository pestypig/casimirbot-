import { Router } from "express";
import { getQueueSnapshot } from "../queue";
import { getGpuThermals } from "../services/hardware/gpu-scheduler";
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

export const hullStatusRouter = Router();

hullStatusRouter.get("/", (_req, res) => {
  const hullMode = hullModeEnabled();
  const allowHosts = getHullAllowList();
  const queue = getQueueSnapshot();
  const thermals = getGpuThermals();
  const kvBudget = Number(process.env.KV_BUDGET_BYTES ?? 0);

  res.json({
    hull_mode: hullMode,
    allow_hosts: allowHosts,
    llm_policy: process.env.LLM_POLICY ?? "hybrid",
    llm_runtime: process.env.LLM_RUNTIME ?? null,
    llm_local: {
      base: process.env.LLM_LOCAL_BASE ?? null,
      model: process.env.LLM_LOCAL_MODEL ?? null,
    },
    llm_http: describeEndpoint(process.env.LLM_HTTP_BASE),
    stt_http: describeEndpoint(process.env.WHISPER_HTTP_URL),
    diff_http: describeEndpoint(process.env.DIFF_HTTP_URL),
    gpu: {
      temp_c: thermals.current,
      max_c: thermals.max,
      override: process.env.GPU_TEMP_OVERRIDE ?? null,
    },
    queue,
    kv: {
      budget_bytes: Number.isFinite(kvBudget) && kvBudget > 0 ? kvBudget : null,
      evict_strategy: process.env.KV_EVICT_STRATEGY ?? "oldest",
    },
    timestamp: new Date().toISOString(),
  });
});
