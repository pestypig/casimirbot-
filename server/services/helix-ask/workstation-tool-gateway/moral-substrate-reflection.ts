import { reflectLivingSubstrateContext } from "@shared/moral-graph/living-substrate-reflection-tool";
import type {
  MoralLivingSubstrateMatchV1,
  MoralLivingSubstrateProceduralChainStepV1,
  MoralLivingSubstrateProceduralDerivationV1,
  MoralLivingSubstrateRecommendedActionV1,
  MoralLivingSubstrateSourceRefV1,
  MoralLivingSubstrateSynthesisStepV1,
} from "@shared/contracts/moral-living-substrate-reflection.v1";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY =
  "moral-graph.reflect_living_substrate_context" as const;
export const MORAL_LIVING_SUBSTRATE_REFLECTION_OBSERVATION_SCHEMA =
  "helix.moral_living_substrate_reflection_observation.v1" as const;

export const moralLivingSubstrateReflectionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
  label: "Moral Graph reflect living substrate context",
  description:
    "Reflects the prompt through living-system substrate Moral Graph badges as bounded, evidence-only context. It does not solve equations, validate consciousness, authorize action, or become a final answer.",
  panel_id: "moral-badge-graph",
  action_id: "reflect_living_substrate_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      text: { type: "string" },
      query: { type: "string" },
      conversation_context: { type: "string" },
      source_theory_badge_ids: { type: "array", items: { type: "string" } },
      requested_substrate_badge_ids: { type: "array", items: { type: "string" } },
      refs: { type: "array", items: { type: "string" } },
      include_theory_bridge: { type: "boolean" },
      include_recommended_actions: { type: "boolean" },
      include_admissions: { type: "boolean" },
      limit: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: MORAL_LIVING_SUBSTRATE_REFLECTION_OBSERVATION_SCHEMA,
  observation_schema: MORAL_LIVING_SUBSTRATE_REFLECTION_OBSERVATION_SCHEMA,
  produces_affordances: ["claim_boundary", "source_ref"],
  typed_handoff_role: "producer",
  safety_tags: ["read_or_observe", "moral_graph", "living_substrate", "reflection", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const cleanString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string") : [];

const readLimit = (value: unknown): number | undefined => {
  const limit = Number(value);
  return Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 12) : undefined;
};

export type MoralSubstrateGatewayObservationResult = {
  ok: boolean;
  admissionStatus: "admitted" | "blocked";
  admissionReason: string;
  blockedReason?: string;
  observationStatus: "succeeded" | "blocked";
  panelId: "moral-badge-graph";
  action: "reflect_living_substrate_context";
  summary: string;
  observation: Record<string, unknown>;
  missingRequirements?: Array<{
    code: string;
    message: string;
    repair_action: "ask_user";
  }>;
  error?: string;
};

export function buildMoralSubstrateReflectionGatewayObservation(
  args: Record<string, unknown>,
): MoralSubstrateGatewayObservationResult {
  const prompt = cleanString(args.prompt ?? args.text ?? args.query);
  if (!prompt) {
    return {
      ok: false,
      admissionStatus: "blocked",
      admissionReason: "moral_living_substrate_prompt_missing",
      blockedReason: "moral_living_substrate_prompt_missing",
      observationStatus: "blocked",
      panelId: "moral-badge-graph",
      action: "reflect_living_substrate_context",
      summary: "Moral Graph living substrate reflection was blocked because no prompt was supplied.",
      error: "moral_living_substrate_prompt_missing",
      observation: {
        schema: MORAL_LIVING_SUBSTRATE_REFLECTION_OBSERVATION_SCHEMA,
        capability_key: MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
        status: "blocked",
        blocked_reason: "moral_living_substrate_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [{
        code: "moral_living_substrate_prompt_missing",
        message: "Provide a prompt or discussion context to reflect against living-system substrate badges.",
        repair_action: "ask_user",
      }],
    };
  }

  const reflection = reflectLivingSubstrateContext({
    prompt,
    conversationContext: cleanString(args.conversation_context ?? args.conversationContext) || null,
    refs: readStringArray(args.refs),
    sourceTheoryBadgeIds: readStringArray(args.source_theory_badge_ids ?? args.sourceTheoryBadgeIds),
    requestedSubstrateBadgeIds: readStringArray(
      args.requested_substrate_badge_ids ?? args.requestedSubstrateBadgeIds,
    ),
    includeTheoryBridge: args.include_theory_bridge !== false && args.includeTheoryBridge !== false,
    includeRecommendedActions: args.include_recommended_actions !== false && args.includeRecommendedActions !== false,
    includeAdmissions: args.include_admissions === true || args.includeAdmissions === true,
    limit: readLimit(args.limit),
  });
  const matchedSubstrateBadgeIds = [
    ...reflection.exactMatches,
    ...reflection.likelyMatches,
  ].map((match) => match.badgeId);
  const observation = {
    schema: MORAL_LIVING_SUBSTRATE_REFLECTION_OBSERVATION_SCHEMA,
    capability_key: MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
    panel_id: "moral-badge-graph",
    action_id: "reflect_living_substrate_context",
    status: "succeeded",
    prompt,
    conversation_context_included: Boolean(reflection.input.conversationContext),
    reflection_id: reflection.reflectionId,
    summary: reflection.evidenceForAsk.summary,
    exact_substrate_badge_ids: reflection.exactMatches.map((match: MoralLivingSubstrateMatchV1) => match.badgeId).slice(0, 12),
    likely_substrate_badge_ids: reflection.likelyMatches.map((match: MoralLivingSubstrateMatchV1) => match.badgeId).slice(0, 12),
    matched_substrate_badge_ids: matchedSubstrateBadgeIds.slice(0, 12),
    procedural_derivation_ids: reflection.proceduralDerivations
      .map((derivation: MoralLivingSubstrateProceduralDerivationV1) => derivation.derivationId)
      .slice(0, 12),
    procedural_derivations: reflection.proceduralDerivations
      .map((derivation: MoralLivingSubstrateProceduralDerivationV1) => ({
        derivation_id: derivation.derivationId,
        label: derivation.label,
        matched_badge_ids: derivation.matchedBadgeIds,
        evidence_strength: derivation.evidenceStrength,
        procedural_question: derivation.proceduralQuestion,
        substrate_observation: derivation.substrateObservation,
        estimate: derivation.estimate,
        obligation_hint: derivation.obligationHint,
        caution: derivation.caution,
        forbidden_overclaim: derivation.forbiddenOverclaim,
      }))
      .slice(0, 12),
    procedural_chain: reflection.proceduralChain
      .map((step: MoralLivingSubstrateProceduralChainStepV1) => ({
        from_badge_id: step.fromBadgeId,
        to_badge_id: step.toBadgeId,
        transition_label: step.transitionLabel,
        procedural_claim: step.proceduralClaim,
        evidence_strength: step.evidenceStrength,
        missing_evidence: step.missingEvidence,
        forbidden_overclaim: step.forbiddenOverclaim,
      }))
      .slice(0, 16),
    synthesis_path: reflection.synthesisPath
      .map((step: MoralLivingSubstrateSynthesisStepV1) => ({
        step_id: step.stepId,
        label: step.label,
        description: step.description,
        derived_from: step.derivedFrom,
        output_kind: step.outputKind,
      }))
      .slice(0, 6),
    source_theory_badge_ids: reflection.sourceTheoryBadgeIds.slice(0, 12),
    source_ref_ids: reflection.sourceRefs.map((ref: MoralLivingSubstrateSourceRefV1) => ref.id).slice(0, 12),
    source_references: reflection.sourceRefs
      .map((ref: MoralLivingSubstrateSourceRefV1) => ({
        id: ref.id,
        kind: ref.kind,
        title: ref.title,
        url: ref.url,
        note: ref.note,
      }))
      .slice(0, 12),
    claim_boundary_notes: reflection.claimBoundaryNotes.slice(0, 12),
    recommended_action_ids: reflection.evidenceForAsk.recommendedNextActions
      .map((action: MoralLivingSubstrateRecommendedActionV1) => action.actionId)
      .slice(0, 12),
    recommended_actions_solve: reflection.evidenceForAsk.recommendedNextActions.some(
      (action: MoralLivingSubstrateRecommendedActionV1) => Boolean(action.solves),
    ),
    admissions_included: reflection.admissions !== null,
    admission_reason_codes: reflection.admissions?.reasonCodes ?? [],
    admission_blocking_reason_codes: reflection.admissions?.blockingReasonCodes ?? [],
    theory_first_recommended: reflection.admissions?.theoryFirstRecommended ?? false,
    reflection_schema: reflection.schemaVersion,
    reflection_terminal_eligible: reflection.terminal_eligible,
    authority: reflection.authority,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    admissionStatus: "admitted",
    admissionReason: "read_only_gateway_capability",
    observationStatus: "succeeded",
    panelId: "moral-badge-graph",
    action: "reflect_living_substrate_context",
    summary: `Moral Graph living substrate reflection produced ${observation.exact_substrate_badge_ids.length} exact substrate match(es), ${observation.likely_substrate_badge_ids.length} likely match(es), and ${observation.claim_boundary_notes.length} claim-boundary note(s).`,
    observation,
  };
}
