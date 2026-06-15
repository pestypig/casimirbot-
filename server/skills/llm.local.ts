import { type ToolHandler, type ToolSpecShape } from "@shared/skills";
import { beginLlMJob } from "../services/hardware/gpu-scheduler";
import { resolveLlmLocalBackend, type LocalLlmBackend } from "../services/llm/local-runtime";

export { resolveLlmLocalBackend, type LocalLlmBackend };

const DEFAULT_LLM_LOCAL_RPM = Math.max(1, Number(process.env.LLM_LOCAL_RPM ?? 60));

const attachLlmBridgeMeta = (
  payload: unknown,
  meta: {
    backend: LocalLlmBackend;
    routedVia: "llm.local.generate";
    providerCalled: boolean;
    stub?: boolean;
  },
) => {
  if (!payload || typeof payload !== "object") return payload;
  return {
    ...(payload as Record<string, unknown>),
    __llm_backend: meta.backend,
    __llm_routed_via: meta.routedVia,
    __llm_provider_called: meta.providerCalled,
    ...(meta.stub ? { __llm_stub: true } : {}),
  };
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
      const spawnResult = await llmLocalSpawnHandler(input, ctx);
      return attachLlmBridgeMeta(spawnResult, {
        backend: "spawn",
        routedVia: "llm.local.generate",
        providerCalled: false,
      });
    }
    if (backend === "http") {
      const { llmHttpHandler } = await import("./llm.http");
      const httpResult = await llmHttpHandler(input, {
        ...ctx,
        routedVia: "llm.local.generate",
      });
      return attachLlmBridgeMeta(httpResult, {
        backend: "http",
        routedVia: "llm.local.generate",
        providerCalled: true,
      });
    }
    if (process.env.NODE_ENV === "test" && process.env.LLM_LOCAL_STRICT_NO_STUB !== "1") {
      return attachLlmBridgeMeta({ text: "llm.local stub result", usage: { tokens: 64 } }, {
        backend: "none",
        routedVia: "llm.local.generate",
        providerCalled: false,
        stub: true,
      });
    }
    throw new Error("llm_backend_unavailable: configure local spawn or LLM_HTTP_BASE");
  } finally {
    release();
  }
};
