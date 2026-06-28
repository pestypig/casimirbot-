import type { HelixAskDomain } from "../intent-directory";
import type { HelixAskAnswerPlanSection } from "../answer-plan";
import type {
  HelixAskAnswerObligation,
  HelixAskAnswerPlanFamily,
  HelixAskTurnContractObjective,
} from "../obligations";
import type { PromptResearchContract } from "../prompt-research-contract";
import type {
  HelixAskObjectivePlannerPass,
  HelixAskObjectivePlannerVerbosity,
} from "../objectives/objective-llm-contracts";
import { buildHelixAskTurnContractAnswerFormat } from "./turn-contract-answer-format";
import {
  buildHelixAskTurnContractClarifyQuestion,
  finalizeHelixAskTurnContractClarifyQuestion,
} from "./turn-contract-clarify-question";
import { buildHelixAskTurnContractConstraints } from "./turn-contract-constraints";
import { buildHelixAskTurnContractGoal } from "./turn-contract-goal";
import {
  detectHelixAskTurnContractDefinitionRelationRepoMismatch,
  selectHelixAskTurnContractFamily,
  selectHelixAskTurnContractGroundingMode,
  selectHelixAskTurnContractPlannerFamily,
  selectHelixAskTurnContractRequestedGroundingMode,
  type HelixAskTurnContractGroundingMode,
} from "./turn-contract-normalizers";
import {
  buildHelixAskTurnContractFallbackObjectiveLabels,
  buildHelixAskTurnContractObjectives,
  buildHelixAskTurnContractResearchObjectiveInputs,
  selectHelixAskTurnContractObjectiveInputs,
} from "./turn-contract-objectives";
import { buildHelixAskTurnContractPlannerMetadata } from "./turn-contract-planner-metadata";
import {
  buildHelixAskTurnContractPlannerSections,
  selectHelixAskTurnContractPlannerSectionSource,
} from "./turn-contract-planner-sections";
import {
  buildHelixAskTurnContractPromptResearchSummary,
  selectHelixAskTurnContractPromptResearchContract,
  type HelixAskTurnContractPromptResearchSummary,
} from "./turn-contract-prompt-research-summary";
import { buildHelixAskTurnContractQueryHints } from "./turn-contract-query-hints";
import { buildHelixAskTurnContractRequiredSlots } from "./turn-contract-slots";
import { buildHelixAskTurnContractRiskFlags } from "./turn-contract-risk-flags";

export type HelixAskAnswerPlanSpecificity = "broad" | "mid" | "specific";
export type HelixAskTurnContractPlannerMode = "llm" | "deterministic";

export type HelixAskTurnContract<TVersion extends string = string> = {
  version: TVersion;
  goal: string;
  objectives: HelixAskTurnContractObjective[];
  obligations: HelixAskAnswerObligation[];
  grounding_mode: HelixAskTurnContractGroundingMode;
  output_family: HelixAskAnswerPlanFamily;
  prompt_specificity: HelixAskAnswerPlanSpecificity;
  required_slots: string[];
  query_hints: string[];
  clarify_question: string | null;
  risk_flags: string[];
  constraints: {
    requires_repo_evidence: boolean;
    requires_citations: boolean;
    allow_open_world_bypass: boolean;
    clarify_allowed: boolean;
    tone_policy: "optimistic-but-honest";
  };
  planner: {
    mode: HelixAskTurnContractPlannerMode;
    valid: boolean;
    source: string;
  };
  prompt_research_contract?: HelixAskTurnContractPromptResearchSummary | null;
  answer_format: {
    sections: HelixAskAnswerPlanSection[];
    preferred_verbosity: HelixAskObjectivePlannerVerbosity | null;
  };
};

export type BuildHelixAskTurnContractDependencies<
  TQueryConstraints extends { explicitAnchorPaths: string[] },
  TEquationIntentContract extends { ask_mode: "broad" | "mid" | "specific" },
> = {
  classifyFamily: (args: {
    question: string;
    equationPrompt: boolean;
    definitionFocus: boolean;
    queryConstraints: TQueryConstraints;
  }) => HelixAskAnswerPlanFamily;
  classifySpecificity: (args: {
    question: string;
    queryConstraints: TQueryConstraints;
    equationPrompt: boolean;
    equationIntentContract?: TEquationIntentContract | null;
    family: HelixAskAnswerPlanFamily;
  }) => HelixAskAnswerPlanSpecificity;
  isDefinitionRelationQuery: (question: string) => boolean;
  hasDefinitionRepoAnchorCue: (question: string) => boolean;
  buildObligations: (args: {
    question: string;
    family: HelixAskAnswerPlanFamily;
    objectives: HelixAskTurnContractObjective[];
    requiredSlots: string[];
    plannerSections?: HelixAskAnswerPlanSection[];
    requiresRepoEvidence: boolean;
  }) => HelixAskAnswerObligation[];
};

export const buildHelixAskTurnContract = <
  TQueryConstraints extends { explicitAnchorPaths: string[] },
  TEquationIntentContract extends { ask_mode: "broad" | "mid" | "specific" },
  TVersion extends string,
>(args: {
  question: string;
  intentDomain: HelixAskDomain;
  requiresRepoEvidence: boolean;
  queryConstraints: TQueryConstraints;
  equationPrompt: boolean;
  definitionFocus: boolean;
  equationIntentContract?: TEquationIntentContract | null;
  plannerMode: HelixAskTurnContractPlannerMode;
  plannerValid: boolean;
  plannerSource: string;
  plannerPass?: HelixAskObjectivePlannerPass | null;
  promptResearchContract?: PromptResearchContract | null;
  maxObjectives: number;
  maxRequiredSlots: number;
  maxQueryHints: number;
  version: TVersion;
  dependencies: BuildHelixAskTurnContractDependencies<TQueryConstraints, TEquationIntentContract>;
}): HelixAskTurnContract<TVersion> => {
  const researchContract = selectHelixAskTurnContractPromptResearchContract(args.promptResearchContract);
  const fallbackFamily = args.dependencies.classifyFamily({
    question: args.question,
    equationPrompt: args.equationPrompt,
    definitionFocus: args.definitionFocus,
    queryConstraints: args.queryConstraints,
  });
  const plannerFamily = selectHelixAskTurnContractPlannerFamily(args.plannerPass?.output_family);
  const plannerDefinitionRelationRepoMismatch =
    detectHelixAskTurnContractDefinitionRelationRepoMismatch({
      plannerFamily,
      fallbackFamily,
      definitionFocus: args.definitionFocus,
      relationQuery: args.dependencies.isDefinitionRelationQuery(args.question),
      definitionRepoAnchorCue: args.dependencies.hasDefinitionRepoAnchorCue(args.question),
    });
  const family = selectHelixAskTurnContractFamily({
    plannerFamily,
    fallbackFamily,
    definitionRelationRepoMismatch: plannerDefinitionRelationRepoMismatch,
  });
  const specificity = args.dependencies.classifySpecificity({
    question: args.question,
    queryConstraints: args.queryConstraints,
    equationPrompt: args.equationPrompt,
    equationIntentContract: args.equationIntentContract,
    family,
  });
  const requestedGrounding = selectHelixAskTurnContractRequestedGroundingMode(
    args.plannerPass?.grounding_mode,
  );
  const groundingMode = selectHelixAskTurnContractGroundingMode({
    requiresRepoEvidence: args.requiresRepoEvidence,
    intentDomain: args.intentDomain,
    requestedGroundingMode: requestedGrounding,
  });
  const researchObjectiveInputs = buildHelixAskTurnContractResearchObjectiveInputs({
    researchContract,
    family,
    groundingMode,
    maxObjectives: args.maxObjectives,
  });
  const fallbackObjectiveLabels = buildHelixAskTurnContractFallbackObjectiveLabels({
    hasResearchObjectiveInputs: researchObjectiveInputs.length > 0,
    question: args.question,
    maxObjectives: args.maxObjectives,
  });
  const objectiveInputs = selectHelixAskTurnContractObjectiveInputs({
    researchObjectiveInputs,
    plannerObjectiveInputs: args.plannerPass?.objectives,
    fallbackObjectiveLabels,
  });
  const objectives = buildHelixAskTurnContractObjectives({
    objectiveInputs,
    question: args.question,
    family,
    groundingMode,
    maxObjectives: args.maxObjectives,
  });
  const goal = buildHelixAskTurnContractGoal({
    researchPurpose: researchContract?.purpose,
    plannerGoal: args.plannerPass?.goal,
    question: args.question,
  });
  const requiredSlots = buildHelixAskTurnContractRequiredSlots({
    family,
    objectives,
    requiredSlots: args.plannerPass?.required_slots,
    maxRequiredSlots: args.maxRequiredSlots,
  });
  const queryHints = buildHelixAskTurnContractQueryHints({
    researchRequiredRepoInputs: researchContract?.required_repo_inputs,
    researchCanonicalPrecedencePaths: researchContract?.canonical_precedence_paths,
    plannerQueryHints: args.plannerPass?.query_hints,
    objectiveQueryHints: objectives.flatMap((objective) => objective.query_hints),
    maxQueryHints: args.maxQueryHints,
  });
  const riskFlags = buildHelixAskTurnContractRiskFlags({
    objectiveCount: objectives.length,
    requiresRepoEvidence: args.requiresRepoEvidence,
    promptResearchContractActive: Boolean(researchContract),
    promptResearchMissingRequiredInputsStop:
      Boolean(researchContract?.fail_closed_behavior.missing_required_inputs_stop),
    explicitAnchorPathCount: args.queryConstraints.explicitAnchorPaths.length,
    groundingMode,
    maxRiskFlags: 8,
  });
  const clarifyQuestion = buildHelixAskTurnContractClarifyQuestion({
    plannerClarifyQuestion: args.plannerPass?.clarify_question,
    requiresRepoEvidence: args.requiresRepoEvidence,
    objectiveCount: objectives.length,
    explicitAnchorPathCount: args.queryConstraints.explicitAnchorPaths.length,
  });
  const plannerSectionSource = selectHelixAskTurnContractPlannerSectionSource({
    plannerSections: args.plannerPass?.sections,
    researchContract,
    family,
  });
  const plannerSections = buildHelixAskTurnContractPlannerSections(plannerSectionSource);
  const obligations = args.dependencies.buildObligations({
    question: args.question,
    family,
    objectives,
    requiredSlots,
    plannerSections,
    requiresRepoEvidence: args.requiresRepoEvidence,
  });
  return {
    version: args.version,
    goal,
    objectives,
    obligations,
    grounding_mode: groundingMode,
    output_family: family,
    prompt_specificity: specificity,
    required_slots: requiredSlots,
    query_hints: queryHints,
    clarify_question: finalizeHelixAskTurnContractClarifyQuestion(clarifyQuestion),
    risk_flags: riskFlags,
    constraints: buildHelixAskTurnContractConstraints({
      requiresRepoEvidence: args.requiresRepoEvidence,
      groundingMode,
      family,
      specificity,
    }),
    planner: buildHelixAskTurnContractPlannerMetadata({
      mode: args.plannerMode,
      valid: args.plannerValid,
      source: args.plannerSource,
    }),
    prompt_research_contract: buildHelixAskTurnContractPromptResearchSummary(researchContract),
    answer_format: buildHelixAskTurnContractAnswerFormat({
      sections: plannerSections,
      preferredVerbosity: args.plannerPass?.verbosity,
    }),
  };
};
