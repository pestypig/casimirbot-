import type { PromptResearchContract } from "../prompt-research-contract";

export type HelixAskTurnContractPromptResearchSummary = {
  mode: "research_contract";
  verbatim_constraints: string[];
  provenance_table_schema: string[];
  required_top_level_titles: string[];
  appendix_required: boolean;
  claim_discipline_required: boolean;
  self_check_required: boolean;
  unknown_marker: string;
};

export const selectHelixAskTurnContractPromptResearchContract = (
  promptResearchContract?: PromptResearchContract | null,
): PromptResearchContract | null =>
  promptResearchContract?.mode === "research_contract" ? promptResearchContract : null;

export const buildHelixAskTurnContractPromptResearchSummary = (
  researchContract: PromptResearchContract | null,
): HelixAskTurnContractPromptResearchSummary | null => {
  if (!researchContract) return null;
  return {
    mode: "research_contract",
    verbatim_constraints: researchContract.verbatim_constraints.slice(0, 4),
    provenance_table_schema: researchContract.provenance_table_schema.slice(0, 12),
    required_top_level_titles: researchContract.required_top_level_structure
      .map((section) => section.title)
      .slice(0, 12),
    appendix_required: researchContract.appendix_requirements.length > 0,
    claim_discipline_required: researchContract.claim_discipline.length > 0,
    self_check_required: researchContract.self_check.length > 0,
    unknown_marker: researchContract.fail_closed_behavior.unknown_marker,
  };
};
