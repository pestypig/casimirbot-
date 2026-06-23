import type { PromptResearchGenerationContract } from "../generation-contract";
import {
  rankPathsByPrecedence,
  type PromptResearchRetrievalContract,
} from "../retrieval-contract";

export type HelixAskTurnRetrievalPlanContract = {
  grounding_mode: string;
  output_family: string;
  objectives: unknown[];
  query_hints: string[];
};

export type HelixAskTurnRetrievalPlanConstraints = {
  explicitAnchorPaths: string[];
};

export type HelixAskTurnRetrievalPlan = {
  depth_budget: number;
  diversity_budget: number;
  connectivity_budget: number;
  must_include: string[];
  query_count: number;
};

export const buildHelixAskTurnRetrievalPlan = (
  contract: HelixAskTurnRetrievalPlanContract,
  constraints: HelixAskTurnRetrievalPlanConstraints,
  promptResearchRetrievalContract: PromptResearchRetrievalContract | null | undefined,
  promptResearchGenerationContract: PromptResearchGenerationContract | null | undefined,
  maxQueryHints: number,
): HelixAskTurnRetrievalPlan => {
  const mustInclude = new Set<string>();
  const researchMustReadCount = promptResearchRetrievalContract?.must_read_paths.length ?? 0;
  const researchRetrievalContextBudget =
    promptResearchGenerationContract?.budget?.retrieval_context_budget ?? 0;
  if (contract.grounding_mode !== "open") {
    mustInclude.add("docs/**");
    mustInclude.add("server/**");
    mustInclude.add("modules/**");
  }
  if (contract.output_family === "implementation_code_path") {
    mustInclude.add("shared/**");
    mustInclude.add("client/**");
  }
  if (contract.output_family === "roadmap_planning") {
    mustInclude.add("client/**");
    mustInclude.add("shared/**");
  }
  for (const explicitPath of constraints.explicitAnchorPaths.slice(0, 4)) {
    mustInclude.add(explicitPath);
  }
  for (const requiredPath of promptResearchRetrievalContract?.must_read_paths.slice(0, 8) ?? []) {
    mustInclude.add(requiredPath);
  }
  for (const precedencePath of promptResearchRetrievalContract?.precedence_paths.slice(0, 4) ?? []) {
    mustInclude.add(precedencePath);
  }
  const rankedMustInclude = rankPathsByPrecedence(
    Array.from(mustInclude),
    promptResearchRetrievalContract?.precedence_paths ?? [],
    8,
  );
  return {
    depth_budget: Math.min(
      12,
      Math.max(
        3,
        contract.objectives.length + 2,
        researchMustReadCount > 0 ? 5 : 0,
        researchRetrievalContextBudget > 0 ? Math.ceil(researchRetrievalContextBudget / 4) + 2 : 0,
      ),
    ),
    diversity_budget: Math.min(
      14,
      Math.max(
        3,
        contract.objectives.length * 2,
        researchMustReadCount > 0 ? researchMustReadCount + 2 : 0,
        researchRetrievalContextBudget,
      ),
    ),
    connectivity_budget: Math.min(
      10,
      Math.max(
        2,
        contract.objectives.length,
        researchMustReadCount > 0 ? Math.ceil(researchMustReadCount / 2) : 0,
        researchRetrievalContextBudget > 0 ? Math.ceil(researchRetrievalContextBudget / 2) : 0,
      ),
    ),
    must_include: rankedMustInclude,
    query_count: Math.min(
      maxQueryHints,
      Math.max(
        contract.query_hints.length,
        contract.objectives.length * 3,
        researchMustReadCount > 0 ? researchMustReadCount + 4 : 0,
        researchRetrievalContextBudget > 0 ? researchRetrievalContextBudget + 4 : 0,
      ),
    ),
  };
};
