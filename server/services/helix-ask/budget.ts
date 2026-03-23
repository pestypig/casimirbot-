import type { PromptResearchContract } from "./prompt-research-contract";

export type SectionOverflowPolicy = "single_pass" | "sectional_compose";

export type GenerationBudget = {
  retrieval_context_budget: number;
  answer_max_tokens: number;
  section_overflow_policy: SectionOverflowPolicy;
  section_count: number;
  appendix_count: number;
  required_table_count: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const computePromptResearchGenerationBudget = (args: {
  contract: PromptResearchContract | null | undefined;
  answerCap: number;
}): GenerationBudget | null => {
  const contract = args.contract;
  if (!contract || contract.mode !== "research_contract") return null;
  const sectionCount = contract.required_top_level_structure.length;
  const appendixCount = contract.appendix_requirements.length;
  const requiredTableCount = contract.provenance_table_schema.length > 0 ? 1 : 0;
  let answerMaxTokens =
    1200 +
    sectionCount * 250 +
    appendixCount * 200 +
    requiredTableCount * 150;
  if (contract.output_style.equation_dense) {
    answerMaxTokens = Math.round(answerMaxTokens * 1.2);
  }
  const retrievalContextBudget = clamp(
    6 + contract.required_repo_inputs.length + contract.canonical_precedence_paths.length,
    6,
    48,
  );
  const sectionOverflowPolicy: SectionOverflowPolicy =
    answerMaxTokens > 3200 || sectionCount >= 5 || appendixCount >= 4
      ? "sectional_compose"
      : "single_pass";
  return {
    retrieval_context_budget: retrievalContextBudget,
    answer_max_tokens: clamp(answerMaxTokens, 1200, args.answerCap),
    section_overflow_policy: sectionOverflowPolicy,
    section_count: sectionCount,
    appendix_count: appendixCount,
    required_table_count: requiredTableCount,
  };
};
