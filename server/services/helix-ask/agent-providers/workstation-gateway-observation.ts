import type { HelixAgentProvider } from "./types";
import type {
  HelixWorkstationGatewayCallResult,
  HelixWorkstationGatewayListResult,
} from "../workstation-tool-gateway/types";

const buildSelectedAgentProviderDebug = (provider: HelixAgentProvider) => ({
  id: provider.id,
  label: provider.label,
  permission_profile: provider.permissionProfile,
  supports: provider.supports,
});

export const buildHelixProviderGatewayObservationPayload = (input: {
  provider: HelixAgentProvider;
  turnId: string;
  runtimeSelectionTrace: Record<string, unknown>;
  gatewayManifest: HelixWorkstationGatewayListResult;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}) => {
  const gatewayObservationPackets = input.gatewayCallResults.map((result) => result.observation_packet);
  const gatewayLifecycleTraces = input.gatewayCallResults.map((result) => result.tool_lifecycle_trace);
  const gatewayFollowupDecisions = input.gatewayCallResults.map((result) => result.tool_followup_decision);
  const observationRefs = input.gatewayCallResults.flatMap((result) => result.artifact_refs);
  const selectedAgentProvider = buildSelectedAgentProviderDebug(input.provider);
  const providerReasoningReentry = {
    schema: "helix.provider_reasoning_reentry.v1",
    turn_id: input.turnId,
    agent_runtime: input.provider.id,
    selected_agent_provider: input.provider.id,
    provider_label: input.provider.label,
    status: "pending_helix_solver_reentry",
    input_observation_refs: observationRefs,
    provider_terminal_candidate_ref: null,
    provider_terminal_candidate_present: false,
    post_tool_model_step_required: true,
    evidence_reentered: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const terminalAuthorityCandidateReview = {
    schema: "helix.provider_terminal_authority_candidate_review.v1",
    turn_id: input.turnId,
    agent_runtime: input.provider.id,
    selected_agent_provider: input.provider.id,
    provider_label: input.provider.label,
    candidate_ref: null,
    terminal_authority_status: "not_authorized_observation_only",
    terminal_authority_granted: false,
    final_visible_answer_authorized: false,
    blockers: ["provider_reasoning_reentry_required"],
    selected_observation_refs: [],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const sharedDebug = {
    turn_id: input.turnId,
    agent_runtime: input.provider.id,
    agent_runtime_selection_trace: input.runtimeSelectionTrace,
    selected_agent_provider: selectedAgentProvider,
    workstation_gateway_manifest: input.gatewayManifest,
    workstation_gateway_manifest_version: input.gatewayManifest.manifest_version,
    workstation_gateway_capability_ids: input.gatewayManifest.capabilities.map((capability) => capability.capability_id),
    workstation_gateway_reentry_status: "pending_helix_solver_reentry",
    terminal_authority_status: "not_authorized_observation_only",
    workstation_gateway_call_results: input.gatewayCallResults,
    workstation_gateway_observation_packets: gatewayObservationPackets,
    tool_lifecycle_traces: gatewayLifecycleTraces,
    tool_followup_decisions: gatewayFollowupDecisions,
    provider_terminal_candidate: null,
    provider_reasoning_reentry: providerReasoningReentry,
    terminal_authority_candidate_review: terminalAuthorityCandidateReview,
    provider_terminal_authority_bridge: null,
    terminal_answer_authority: null,
    terminal_presentation: null,
    final_answer_source: null,
    terminal_artifact_kind: null,
  };

  return {
    ok: false,
    turn_id: input.turnId,
    runtime: input.provider.id,
    response_type: "workstation_gateway_observation",
    final_status: "requires_provider_reasoning_reentry",
    agent_runtime: input.provider.id,
    ...sharedDebug,
    debug: sharedDebug,
  };
};
