import { type ToolHandler, type ToolSpecShape } from "@shared/skills";
import { beginLlMJob } from "../services/hardware/gpu-scheduler";
import { isLocalRuntime } from "../services/llm/local-runtime";

const DEFAULT_LLM_LOCAL_RPM = Math.max(1, Number(process.env.LLM_LOCAL_RPM ?? 60));

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
    const useSpawn =
      process.env.ENABLE_LLM_LOCAL_SPAWN === "1" ||
      isLocalRuntime() ||
      Boolean(process.env.LLM_LOCAL_CMD?.trim());
    if (useSpawn) {
      const { llmLocalSpawnHandler } = await import("./llm.local.spawn");
      return llmLocalSpawnHandler(input, ctx);
    }
    return { text: "llm.local stub result", usage: { tokens: 64 } };
  } finally {
    release();
  }
};
