import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
  type HelixAskCompositeSubgoalReferenceIntent,
} from "../composite-followup-helpers";
import {
  isHelixAskGoldenPathCalculatorSolveRequested,
} from "./capabilities/calculator";
import {
  isHelixAskGoldenPathDocsLocateRequested,
} from "./capabilities/docs-locate";
import {
  isHelixAskGoldenPathRepoSearchConceptRequested,
} from "./capabilities/repo-search-concept";
import {
  isHelixAskGoldenPathInternetSearchRequested,
} from "./capabilities/internet-search";
import {
  isHelixAskGoldenPathTheoryReflectionRequested,
} from "./capabilities/theory-reflection";
import {
  isHelixAskGoldenPathCivilizationBoundsReflectionRequested,
} from "./capabilities/civilization-bounds-reflection";
import {
  isHelixAskGoldenPathZenGraphReflectionRequested,
} from "./capabilities/zen-graph-reflection";
import {
  isHelixAskGoldenPathVisualCaptureRequested,
} from "./capabilities/visual-capture";
import {
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readStringArray,
  type RecordLike,
} from "./core";

export type HelixAskGoldenPathCompositeDebugDependencies = {
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
};

export type HelixAskGoldenPathCompoundSubgoalContractInput = {
  subgoalIdSuffix: string;
  requestedCapability: string;
  selectedCapability?: string;
  executedCapability?: string;
  args?: RecordLike;
  observationKind: string;
  observationRef: string;
  satisfaction?: "satisfied" | "missing" | "failed";
};

export const buildGoldenPathCompoundCapabilityContract = (args: {
  turnId: string;
  subgoals: readonly HelixAskGoldenPathCompoundSubgoalContractInput[];
  satisfaction?: "satisfied" | "missing" | "failed";
}): RecordLike => ({
  schema: "helix.compound_capability_contract.v1",
  turn_id: args.turnId,
  ordered_subgoals: args.subgoals.map((subgoal) => ({
    subgoal_id: `${args.turnId}:subgoal:${subgoal.subgoalIdSuffix}`,
    requested_capability: subgoal.requestedCapability,
    selected_capability: subgoal.selectedCapability ?? subgoal.requestedCapability,
    executed_capability: subgoal.executedCapability ?? subgoal.selectedCapability ?? subgoal.requestedCapability,
    args: subgoal.args ?? {},
    observation_kind: subgoal.observationKind,
    observation_ref: subgoal.observationRef,
    satisfaction: subgoal.satisfaction ?? "satisfied",
  })),
  satisfaction: args.satisfaction ?? "satisfied",
  assistant_answer: false,
  raw_content_included: false,
});

export const isHelixAskGoldenPathCatalogWorkspaceCompoundRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  const hasCatalog = requestedCapabilities.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY);
  const hasWorkspace = requestedCapabilities.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY);
  if (hasCatalog && hasWorkspace) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY) &&
    prompt.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY)
  );
};

export const isHelixAskGoldenPathVisualCalculatorCompoundRequested = (body: RecordLike): boolean =>
  isHelixAskGoldenPathVisualCaptureRequested(body) && isHelixAskGoldenPathCalculatorSolveRequested(body);

export const isHelixAskGoldenPathDocsCalculatorCompoundRequested = (body: RecordLike): boolean =>
  isHelixAskGoldenPathDocsLocateRequested(body) && isHelixAskGoldenPathCalculatorSolveRequested(body);

export const isHelixAskGoldenPathRepoDocsCompoundRequested = (body: RecordLike): boolean =>
  isHelixAskGoldenPathRepoSearchConceptRequested(body) && isHelixAskGoldenPathDocsLocateRequested(body);

export const isHelixAskGoldenPathInternetResearchReflectionCompoundRequested = (body: RecordLike): boolean =>
  isHelixAskGoldenPathInternetSearchRequested(body) && isHelixAskGoldenPathTheoryReflectionRequested(body);

export const isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested = (body: RecordLike): boolean =>
  isHelixAskGoldenPathCivilizationBoundsReflectionRequested(body) && isHelixAskGoldenPathZenGraphReflectionRequested(body);

export const buildGoldenPathCompositeDebug = (args: {
  deps: HelixAskGoldenPathCompositeDebugDependencies;
  turnId: string;
}): { decision: RecordLike; audit: RecordLike } => {
  const intent: HelixAskCompositeSubgoalReferenceIntent = {
    required: false,
    reference_kind: "that_result",
    requested_action: "inspect_debug",
    matched_phrases: [],
    confidence: "low",
  };
  const binding = {
    current_turn_id: args.turnId,
    prior_composite_turn_id: null,
    prior_composite_receipt_id: null,
    selected_subgoal_ids: [],
    candidate_subgoals: [],
    rejected_subgoals: [],
    binding_status: "no_usable_subgoal",
    non_authoritative_debug_probe: true,
  };
  const decision = args.deps.buildCompositeHandoffDecision({ turnId: args.turnId, binding, intent });
  const audit = args.deps.buildCompositeFollowupAudit({ priorEnvelope: null, binding, handoffDecision: decision });
  return { decision, audit };
};
