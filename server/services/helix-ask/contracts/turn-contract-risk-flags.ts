import type { HelixAskTurnContractGroundingMode } from "./turn-contract-normalizers";

export const buildHelixAskTurnContractRiskFlags = (args: {
  objectiveCount: number;
  requiresRepoEvidence: boolean;
  promptResearchContractActive: boolean;
  promptResearchMissingRequiredInputsStop: boolean;
  explicitAnchorPathCount: number;
  groundingMode: HelixAskTurnContractGroundingMode;
  maxRiskFlags?: number;
}): string[] =>
  Array.from(
    new Set(
      [
        args.objectiveCount > 1 ? "multi_objective" : null,
        args.requiresRepoEvidence ? "repo_grounding_required" : null,
        args.promptResearchContractActive ? "prompt_research_contract" : null,
        args.promptResearchMissingRequiredInputsStop ? "fail_closed_required_inputs" : null,
        args.explicitAnchorPathCount > 0 ? "explicit_anchor_paths" : null,
        args.groundingMode === "open" ? "open_world_allowed" : null,
      ].filter(Boolean) as string[],
    ),
  ).slice(0, Math.max(0, Math.floor(args.maxRiskFlags ?? Number.POSITIVE_INFINITY)));
