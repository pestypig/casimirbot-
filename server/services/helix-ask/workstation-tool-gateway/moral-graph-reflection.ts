import { runHelixAskMoralGraphReflectionTool } from "../../../skills/helix-ask.moral-graph-reflection";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const MORAL_GRAPH_REFLECTION_CAPABILITY = "moral-graph.reflect_context" as const;
export const MORAL_GRAPH_REFLECTION_OBSERVATION_SCHEMA =
  "helix.moral_graph_reflection_observation.v1" as const;

export const moralGraphReflectionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: MORAL_GRAPH_REFLECTION_CAPABILITY,
  label: "Moral Graph reflect context",
  description:
    "Reflects the prompt through Moral Graph badges, locator matches, procedural classification, and fruition as bounded, evidence-only context. It does not authorize action or become a final answer.",
  panel_id: "moral-graph",
  action_id: "reflect_context",
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
      refs: { type: "array", items: { type: "string" } },
      include_locator: { type: "boolean" },
      include_fruition: { type: "boolean" },
      include_procedural_classification: { type: "boolean" },
      include_civic_trust_traversability: { type: "boolean" },
      include_civic_order_participation: { type: "boolean" },
      include_civilization_provisioning: { type: "boolean" },
      include_recommended_actions: { type: "boolean" },
      include_admissions: { type: "boolean" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: MORAL_GRAPH_REFLECTION_OBSERVATION_SCHEMA,
  observation_schema: MORAL_GRAPH_REFLECTION_OBSERVATION_SCHEMA,
  produces_affordances: ["claim_boundary", "source_ref"],
  typed_handoff_role: "producer",
  safety_tags: ["read_or_observe", "moral_graph", "reflection", "badge_locator", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const cleanString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry: unknown): entry is string => typeof entry === "string") : [];

const takeIds = (entries: unknown, field: string): string[] =>
  Array.isArray(entries)
    ? entries
        .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>)[field] : null))
        .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        .slice(0, 12)
    : [];

export type MoralGraphGatewayObservationResult = {
  ok: boolean;
  admissionStatus: "admitted" | "blocked";
  admissionReason: string;
  blockedReason?: string;
  observationStatus: "succeeded" | "blocked";
  panelId: "moral-graph";
  action: "reflect_context";
  summary: string;
  observation: Record<string, unknown>;
  missingRequirements?: Array<{
    code: string;
    message: string;
    repair_action: "ask_user";
  }>;
  error?: string;
};

export async function buildMoralGraphReflectionGatewayObservation(
  args: Record<string, unknown>,
): Promise<MoralGraphGatewayObservationResult> {
  const prompt = cleanString(args.prompt ?? args.text ?? args.query);
  if (!prompt) {
    return {
      ok: false,
      admissionStatus: "blocked",
      admissionReason: "moral_graph_reflection_prompt_missing",
      blockedReason: "moral_graph_reflection_prompt_missing",
      observationStatus: "blocked",
      panelId: "moral-graph",
      action: "reflect_context",
      summary: "Moral Graph reflection was blocked because no prompt was supplied.",
      error: "moral_graph_reflection_prompt_missing",
      observation: {
        schema: MORAL_GRAPH_REFLECTION_OBSERVATION_SCHEMA,
        capability_key: MORAL_GRAPH_REFLECTION_CAPABILITY,
        status: "blocked",
        blocked_reason: "moral_graph_reflection_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [{
        code: "moral_graph_reflection_prompt_missing",
        message: "Provide a prompt or discussion context to reflect against the Moral Graph.",
        repair_action: "ask_user",
      }],
    };
  }

  const output = await runHelixAskMoralGraphReflectionTool({
    inputKind: "user_prompt",
    text: prompt,
    refs: readStringArray(args.refs),
    options: {
      includeOverlay: true,
      includeRecommendedActions: args.include_recommended_actions !== false,
      includeAdmissionArtifacts: args.include_admissions !== false,
      includeLocator: args.include_locator !== false,
      includeFruition: args.include_fruition !== false,
      includeProceduralClassification: args.include_procedural_classification !== false,
      includeCivicTrustTraversability: args.include_civic_trust_traversability !== false,
      includeCivicOrderParticipation: args.include_civic_order_participation !== false,
      includeCivilizationProvisioning: args.include_civilization_provisioning !== false,
    },
  });
  const locator = output.locator;
  const exactBadgeIds = takeIds(locator?.locatedBadges.exact, "nodeId");
  const likelyBadgeIds = takeIds(locator?.locatedBadges.likely, "nodeId");
  const inferredBadgeIds = takeIds(locator?.locatedBadges.inferred, "nodeId");
  const locatedBadgeIds = [...new Set([...exactBadgeIds, ...likelyBadgeIds, ...inferredBadgeIds])].slice(0, 18);
  const claimBoundaryNotes = [
    output.reflection.claim_boundaries.diagnostic_only ? "diagnostic_only" : null,
    output.reflection.claim_boundaries.avoid_character_judgment ? "avoid_character_judgment" : null,
    output.reflection.claim_boundaries.needs_user_confirmation ? "needs_user_confirmation" : null,
    ...(output.reflection.claim_boundaries.missing_evidence ?? []),
  ].filter((entry): entry is string => Boolean(entry)).slice(0, 12);
  const observation = {
    schema: MORAL_GRAPH_REFLECTION_OBSERVATION_SCHEMA,
    capability_key: MORAL_GRAPH_REFLECTION_CAPABILITY,
    panel_id: "moral-graph",
    action_id: "reflect_context",
    status: "succeeded",
    prompt,
    conversation_context_included: Boolean(cleanString(args.conversation_context)),
    reflection_id: output.reflection.reflectionId,
    summary: output.reflection.input.summary,
    exact_badge_ids: exactBadgeIds,
    likely_badge_ids: likelyBadgeIds,
    inferred_badge_ids: inferredBadgeIds,
    located_badge_ids: locatedBadgeIds,
    located_binding_ids: takeIds(locator?.locatedBindings, "id"),
    comparison_seed: locator?.comparisonSeed,
    probability_terrain: locator?.probabilityTerrain,
    procedural_classification: output.proceduralClassification,
    fruition: output.fruition,
    civic_trust_traversability: output.civicTrustTraversability,
    civic_trust_activated_badge_ids: output.civicTrustTraversability?.activatedBadgeIds ?? [],
    civic_trust_missing_evidence: output.civicTrustTraversability?.missingEvidence ?? [],
    civic_order_participation: output.civicOrderParticipation,
    civic_order_activated_badge_ids: output.civicOrderParticipation?.activatedBadgeIds ?? [],
    civic_order_missing_evidence: output.civicOrderParticipation?.missingEvidence ?? [],
    civilization_provisioning_network: output.civilizationProvisioningNetwork,
    civilization_provisioning_moral_node_ids: output.civilizationProvisioningNetwork?.moralNodeIds ?? [],
    civilization_provisioning_missing_evidence: output.civilizationProvisioningNetwork?.missingEvidence ?? [],
    claim_boundary_notes: claimBoundaryNotes,
    recommended_action_ids: output.reflection.recommended_actions.map((action) => action.id).slice(0, 12),
    admissions_included: output.admissions.length > 0,
    admission_reason_codes: output.admissions.flatMap((admission) => admission.reasonCodes).slice(0, 24),
    admission_blocking_reason_codes: output.admissions.flatMap((admission) => admission.blockingReasonCodes).slice(0, 24),
    reflection_schema: output.reflection.schemaVersion,
    reflection_terminal_eligible: false,
    authority: output.reflection.authority,
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
    panelId: "moral-graph",
    action: "reflect_context",
    summary: `Moral Graph reflection produced ${exactBadgeIds.length} exact badge match(es), ${likelyBadgeIds.length} likely match(es), and ${claimBoundaryNotes.length} claim-boundary note(s).`,
    observation,
  };
}
