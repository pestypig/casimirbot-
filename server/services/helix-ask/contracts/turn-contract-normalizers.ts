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
