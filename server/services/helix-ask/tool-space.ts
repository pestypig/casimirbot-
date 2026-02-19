import type { ToolManifestEntry } from "@shared/skills";

export type HelixToolSideEffectClass = "none" | "read" | "write" | "external";

export type HelixToolCatalogCard = {
  id: string;
  name: string;
  purpose: string;
  intents: string[];
  requiredInputs: string[];
  sideEffectClass: HelixToolSideEffectClass;
  dryRunSupported: boolean;
  trustRequirements: string[];
  verifyRequirements: string[];
};

export type HelixToolPlanCandidate = {
  tool: string;
  score: number;
  reason: string;
};

export type HelixToolPlanBlocked = {
  tool: string;
  reason: string;
};

export type HelixToolPlan = {
  candidates: HelixToolPlanCandidate[];
  selectedTool: string;
  blocked: HelixToolPlanBlocked[];
  tieBreakReason: string;
};

const TOOL_CARD_OVERRIDES: Record<string, Partial<HelixToolCatalogCard>> = {
  "halobank.time.compute": {
    purpose: "Compute diagnostic time/place gravity and timing deltas.",
    intents: ["time comparison", "place comparison", "gravity delta"],
    requiredInputs: ["timestamp", "place"],
    sideEffectClass: "read",
    dryRunSupported: true,
    trustRequirements: ["diagnostic_only"],
    verifyRequirements: ["adapter_verify_for_certifying_claims"],
  },
  "telemetry.time_dilation.control.set": {
    purpose: "Apply a time-dilation control command.",
    intents: ["control", "set"],
    sideEffectClass: "write",
    dryRunSupported: true,
  },
  "telemetry.time_dilation.diagnostics.get": {
    purpose: "Read time-dilation diagnostics.",
    intents: ["diagnostics", "observe"],
    sideEffectClass: "read",
    dryRunSupported: true,
  },
};

const inferSideEffectClass = (entry: ToolManifestEntry): HelixToolSideEffectClass => {
  if (entry.risk?.touchesNetwork) return "external";
  if (entry.risk?.writesFiles) return "write";
  return "none";
};

const defaultCard = (entry: ToolManifestEntry): HelixToolCatalogCard => ({
  id: entry.name,
  name: entry.name,
  purpose: entry.desc,
  intents: [entry.name.split(".")[0] ?? "general"],
  requiredInputs: [],
  sideEffectClass: inferSideEffectClass(entry),
  dryRunSupported: true,
  trustRequirements: [entry.provenance?.maturity ?? "diagnostic"],
  verifyRequirements: entry.provenance?.certifying ? ["certificate_required"] : [],
});

export const buildHelixToolCatalog = (manifest: ToolManifestEntry[]): HelixToolCatalogCard[] =>
  [...manifest]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      ...defaultCard(entry),
      ...(TOOL_CARD_OVERRIDES[entry.name] ?? {}),
      id: entry.name,
      name: entry.name,
    }));

const scoreTool = (goal: string, toolName: string): HelixToolPlanCandidate => {
  const normalized = goal.toLowerCase();
  let score = 0;
  const reasons: string[] = [];
  if (toolName === "halobank.time.compute") {
    if (/\b(time|timestamp|duration|clock|utc|when)\b/.test(normalized)) {
      score += 3;
      reasons.push("time_signal");
    }
    if (/\b(place|location|lat|lon|longitude|latitude|where|tz)\b/.test(normalized)) {
      score += 3;
      reasons.push("place_signal");
    }
    if (/\b(tide|gravity|gravitational|moon|sun|lunar|solar)\b/.test(normalized)) {
      score += 2;
      reasons.push("gravity_signal");
    }
  }
  if (toolName === "telemetry.time_dilation.diagnostics.get" && /\b(observe|diagnostic|status)\b/.test(normalized)) {
    score += 4;
    reasons.push("observe_signal");
  }
  if (toolName === "telemetry.time_dilation.control.set" && /\b(set|update|control|apply)\b/.test(normalized)) {
    score += 4;
    reasons.push("control_signal");
  }
  if (score === 0) {
    reasons.push("fallback_match");
  }
  return {
    tool: toolName,
    score,
    reason: reasons.join("+"),
  };
};

export const buildHelixToolPlan = (input: {
  goal: string;
  manifest: ToolManifestEntry[];
  allowTools: string[];
  mode: "observe" | "act" | "verify";
}): HelixToolPlan => {
  const candidates = input.manifest
    .map((entry) => scoreTool(input.goal, entry.name))
    .sort((a, b) => (b.score - a.score) || a.tool.localeCompare(b.tool));
  const top = candidates[0];
  const selectedTool = top?.tool ?? input.manifest[0]?.name ?? "";

  const allowedSet = new Set(input.allowTools.map((entry) => entry.trim().toLowerCase()).filter(Boolean));
  const allowAll = allowedSet.size === 0;
  const blocked: HelixToolPlanBlocked[] = [];
  for (const candidate of candidates) {
    const selected = candidate.tool.toLowerCase();
    const isAllowed = allowAll || [...allowedSet].some((allowed) => selected === allowed || selected.startsWith(`${allowed}.`) || allowed.startsWith(`${selected}.`));
    if (!isAllowed) {
      blocked.push({ tool: candidate.tool, reason: "not_in_allowTools" });
    }
  }

  return {
    candidates: candidates.slice(0, 6),
    selectedTool,
    blocked,
    tieBreakReason: "highest_score_then_lexicographic_tool_id",
  };
};

export const collectMissingRequiredInputs = (
  toolName: string,
  payload: Record<string, unknown>,
): string[] => {
  if (toolName !== "halobank.time.compute") return [];
  const missing: string[] = [];
  if (payload.timestamp === undefined) missing.push("timestamp");
  if (!payload.place || typeof payload.place !== "object") missing.push("place");
  return missing;
};
