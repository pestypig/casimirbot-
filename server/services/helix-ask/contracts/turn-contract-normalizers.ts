import type { HelixAskDomain } from "../intent-directory";

export type HelixAskAnswerPlanFamily =
  | "definition_overview"
  | "mechanism_process"
  | "equation_formalism"
  | "comparison_tradeoff"
  | "troubleshooting_diagnosis"
  | "implementation_code_path"
  | "roadmap_planning"
  | "recommendation_decision"
  | "general_overview";

export type HelixAskTurnContractGroundingMode = "repo" | "open" | "hybrid";

export const normalizeHelixAskTurnContractFamily = (
  value: unknown,
): HelixAskAnswerPlanFamily | null => {
  const normalized = String(value ?? "").trim().toLowerCase();
  switch (normalized) {
    case "definition_overview":
    case "mechanism_process":
    case "equation_formalism":
    case "comparison_tradeoff":
    case "troubleshooting_diagnosis":
    case "implementation_code_path":
    case "roadmap_planning":
    case "recommendation_decision":
    case "general_overview":
      return normalized;
    default:
      return null;
  }
};

export const normalizeHelixAskTurnContractGroundingMode = (
  value: unknown,
): HelixAskTurnContractGroundingMode | null => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "repo" || normalized === "open" || normalized === "hybrid") {
    return normalized;
  }
  return null;
};

export const selectHelixAskTurnContractPlannerFamily = (
  outputFamily?: unknown,
): HelixAskAnswerPlanFamily | null => normalizeHelixAskTurnContractFamily(outputFamily);

export const selectHelixAskTurnContractRequestedGroundingMode = (
  groundingMode?: unknown,
): HelixAskTurnContractGroundingMode | null =>
  normalizeHelixAskTurnContractGroundingMode(groundingMode);

export const selectHelixAskTurnContractFamily = (args: {
  plannerFamily?: HelixAskAnswerPlanFamily | null;
  fallbackFamily: HelixAskAnswerPlanFamily;
  definitionRelationRepoMismatch: boolean;
}): HelixAskAnswerPlanFamily =>
  args.definitionRelationRepoMismatch ? args.fallbackFamily : args.plannerFamily ?? args.fallbackFamily;

export const detectHelixAskTurnContractDefinitionRelationRepoMismatch = (args: {
  plannerFamily?: HelixAskAnswerPlanFamily | null;
  fallbackFamily: HelixAskAnswerPlanFamily;
  definitionFocus: boolean;
  relationQuery: boolean;
  definitionRepoAnchorCue: boolean;
}): boolean =>
  args.plannerFamily === "definition_overview" &&
  args.fallbackFamily === "mechanism_process" &&
  args.definitionFocus &&
  args.relationQuery &&
  args.definitionRepoAnchorCue;

export const selectHelixAskTurnContractGroundingMode = (args: {
  requiresRepoEvidence: boolean;
  intentDomain: HelixAskDomain;
  requestedGroundingMode?: HelixAskTurnContractGroundingMode | null;
}): HelixAskTurnContractGroundingMode => {
  if (args.requiresRepoEvidence || args.intentDomain === "repo") return "repo";
  const defaultGroundingMode: HelixAskTurnContractGroundingMode =
    args.intentDomain === "hybrid" ? "hybrid" : "open";
  return args.requestedGroundingMode ?? defaultGroundingMode;
};
