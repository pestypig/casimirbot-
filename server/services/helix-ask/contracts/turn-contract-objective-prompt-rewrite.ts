import crypto from "node:crypto";

export type HelixAskObjectivePromptRewriteMode = "off" | "shadow" | "on";

export type HelixAskObjectivePromptRewriteStage =
  | "retrieve_proposal"
  | "mini_synth"
  | "mini_critic"
  | "assembly"
  | "assembly_rescue";

export type HelixAskObjectivePromptRewriteResult = {
  effectivePrompt: string;
  rewrittenPrompt: string | null;
  applied: boolean;
  effectiveHash: string;
  effectiveTokenEstimate: number;
  rewrittenHash: string | null;
  rewrittenTokenEstimate: number | null;
};

export const resolveHelixAskObjectivePromptRewriteMode = (): HelixAskObjectivePromptRewriteMode => {
  const raw = String(process.env.HELIX_ASK_OBJECTIVE_PROMPT_REWRITE_V1 ?? "on")
    .trim()
    .toLowerCase();
  if (raw === "off" || raw === "shadow" || raw === "on") return raw;
  return "on";
};

export const estimateHelixAskPromptTokens = (value: string): number =>
  Math.max(1, Math.ceil(String(value ?? "").length / 4));

export const hashHelixAskPromptText = (value: string): string =>
  crypto.createHash("sha1").update(String(value ?? "")).digest("hex").slice(0, 16);

export const buildHelixAskObjectivePromptRewriteLines = (
  stage: HelixAskObjectivePromptRewriteStage,
): string[] => {
  switch (stage) {
    case "retrieve_proposal":
      return [
        "Action: Generate 1-4 retrieval queries that directly close missing slots.",
        "Inputs: objective id/label, required slots, missing slots, query hints.",
        "Constraints: prioritize missing slots first; keep queries short and concrete; avoid adding objectives.",
        "Output: strict JSON per schema in the base prompt.",
      ];
    case "mini_synth":
      return [
        "Action: Synthesize objective coverage from provided checkpoints only.",
        "Inputs: objective checkpoints with matched/missing slots and evidence refs.",
        "Constraints: include each objective exactly once; preserve unresolved slots; do not invent evidence.",
        "Output: strict JSON per schema in the base prompt.",
      ];
    case "mini_critic":
      return [
        "Action: Critique objective coverage and assign covered|partial|blocked.",
        "Inputs: current objective checkpoints with matched/missing slots and evidence refs.",
        "Constraints: covered requires empty missing_slots; reasons must be short and slot-specific.",
        "Output: strict JSON per schema in the base prompt.",
      ];
    case "assembly":
      return [
        "Action: Assemble a concise final answer from objective checkpoints.",
        "Inputs: objective checkpoints, current draft, and response language.",
        "Constraints: never mark unresolved objectives as complete; preserve uncertainty and citations.",
        "Output: plain final answer only, no JSON/debug metadata.",
      ];
    case "assembly_rescue":
      return [
        "Action: Repair or rescue assembly while preserving objective integrity.",
        "Inputs: objective checkpoints, current draft, and response language.",
        "Constraints: remove blocked/UNKNOWN scaffolds when objectives are covered; otherwise fail closed.",
        "Output: plain final answer only, no JSON/debug metadata.",
      ];
    default:
      return [];
  }
};

export const rewriteHelixAskObjectivePromptV1 = (args: {
  stage: HelixAskObjectivePromptRewriteStage;
  basePrompt: string;
  mode: HelixAskObjectivePromptRewriteMode;
  responseLanguage?: string | null;
}): HelixAskObjectivePromptRewriteResult => {
  const basePrompt = String(args.basePrompt ?? "").trim();
  const baseHash = hashHelixAskPromptText(basePrompt);
  const baseTokens = estimateHelixAskPromptTokens(basePrompt);
  if (!basePrompt || args.mode === "off") {
    return {
      effectivePrompt: basePrompt,
      rewrittenPrompt: null,
      applied: false,
      effectiveHash: baseHash,
      effectiveTokenEstimate: baseTokens,
      rewrittenHash: null,
      rewrittenTokenEstimate: null,
    };
  }
  const stageLines = buildHelixAskObjectivePromptRewriteLines(args.stage);
  const rewrittenPrompt = [
    `Helix Ask technical rewrite mode (v1). stage=${args.stage}`,
    ...stageLines,
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "Do not output anything outside the required output contract.",
    "",
    "Authoritative base prompt contract:",
    basePrompt,
  ].join("\n");
  const rewrittenHash = hashHelixAskPromptText(rewrittenPrompt);
  const rewrittenTokens = estimateHelixAskPromptTokens(rewrittenPrompt);
  const useRewritten = args.mode === "on";
  return {
    effectivePrompt: useRewritten ? rewrittenPrompt : basePrompt,
    rewrittenPrompt,
    applied: useRewritten,
    effectiveHash: useRewritten ? rewrittenHash : baseHash,
    effectiveTokenEstimate: useRewritten ? rewrittenTokens : baseTokens,
    rewrittenHash,
    rewrittenTokenEstimate: rewrittenTokens,
  };
};
