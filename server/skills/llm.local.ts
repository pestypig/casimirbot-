import { type ToolHandler, type ToolSpecShape } from "@shared/skills";
import { beginLlMJob } from "../services/hardware/gpu-scheduler";

const DEFAULT_LLM_LOCAL_RPM = Math.max(1, Number(process.env.LLM_LOCAL_RPM ?? 60));

export const llmLocalSpec: ToolSpecShape = {
  name: "llm.local.generate",
  desc: "Local LLM with (stub) speculative decoding + KV budgeting",
  inputSchema: {} as any,
  outputSchema: {} as any,
  deterministic: false,
  rateLimit: { rpm: DEFAULT_LLM_LOCAL_RPM },
  safety: { risks: [] },
};

export const llmLocalHandler: ToolHandler = async (input: any, ctx: any) => {
  const release = beginLlMJob();
  try {
    return { text: "llm.local stub result", usage: { tokens: 64 } };
  } finally {
    release();
  }
};
