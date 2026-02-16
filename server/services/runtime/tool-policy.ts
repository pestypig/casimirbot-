import { loadRuntimeFrameContract } from "./frame-contract";
import { getToolMeta, type ToolMeta, type RuntimeTaskClass } from "./tool-metadata";

export type RuntimeToolPolicy = {
  toolId: string;
  lane: ToolMeta["lane"];
  taskClass: RuntimeTaskClass;
  hardTimeoutMs: number;
  budgetWeight: number;
};

const normalizeToolKey = (toolId: string): string => toolId.trim().toLowerCase().replace(/[_\s]+/g, ".");

const candidateProfileKeys = (toolId: string): string[] => {
  const normalized = normalizeToolKey(toolId);
  const underscore = normalized.replace(/\./g, "_");
  return Array.from(new Set([toolId, normalized, underscore]));
};

export const resolveRuntimeToolPolicy = (toolId: string): RuntimeToolPolicy | null => {
  const toolMeta = getToolMeta(toolId) ?? getToolMeta(normalizeToolKey(toolId));
  if (!toolMeta) {
    return null;
  }
  const contract = loadRuntimeFrameContract();
  const profileToolConfig = candidateProfileKeys(toolId)
    .map((key) => contract.tools[key])
    .find((entry) => entry && typeof entry === "object") as Record<string, unknown> | undefined;
  const configuredTimeout = Number(profileToolConfig?.timeout_ms);
  const hardTimeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? Math.floor(configuredTimeout)
    : toolMeta.hardTimeoutMs;

  return {
    toolId: toolMeta.id,
    lane: toolMeta.lane,
    taskClass: toolMeta.defaultClass,
    hardTimeoutMs,
    budgetWeight: toolMeta.budgetWeight,
  };
};
