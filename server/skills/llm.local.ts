import { type ToolHandler, type ToolSpecShape } from "@shared/skills";
import { beginLlMJob } from "../services/hardware/gpu-scheduler";
import { isLocalRuntime } from "../services/llm/local-runtime";

const DEFAULT_LLM_LOCAL_RPM = Math.max(1, Number(process.env.LLM_LOCAL_RPM ?? 60));

export type LocalLlmBackend = "spawn" | "http" | "none";

/**
 * Deterministic routing order for Helix Ask local tool bridge:
 * 1) local spawn runtime (explicit enable, local runtime, or local command)
 * 2) HTTP backend (LLM_HTTP_BASE configured)
 * 3) no backend
 */
export const resolveLlmLocalBackend = (): LocalLlmBackend => {
  const useSpawn =
    process.env.ENABLE_LLM_LOCAL_SPAWN === "1" ||
    isLocalRuntime() ||
    Boolean(process.env.LLM_LOCAL_CMD?.trim());
  if (useSpawn) {
    return "spawn";
  }
  if (process.env.LLM_HTTP_BASE?.trim()) {
    return "http";
  }
  return "none";
};

export const llmLocalSpec: ToolSpecShape = {
  name: "llm.local.generate",
  desc: "Local LLM (spawned runtime) with KV budgeting",
  inputSchema: {} as any,
  outputSchema: {} as any,
  deterministic: false,
  rateLimit: { rpm: DEFAULT_LLM_LOCAL_RPM },
  safety: { risks: [] },
};

export const llmLocalHandler: ToolHandler = async (input: any, ctx: any) => {
  const release = beginLlMJob();
  try {
    const backend = resolveLlmLocalBackend();
    if (backend === "spawn") {
      const { llmLocalSpawnHandler } = await import("./llm.local.spawn");
      return llmLocalSpawnHandler(input, ctx);
    }
    if (backend === "http") {
      const { llmHttpHandler } = await import("./llm.http");
      return llmHttpHandler(input, {
        ...ctx,
        routedVia: "llm.local.generate",
      });
    }
    if (process.env.NODE_ENV === "test" && process.env.LLM_LOCAL_STRICT_NO_STUB !== "1") {
      return { text: "llm.local stub result", usage: { tokens: 64 } };
    }
    throw new Error("llm_backend_unavailable: configure local spawn or LLM_HTTP_BASE");
  } finally {
    release();
  }
};
