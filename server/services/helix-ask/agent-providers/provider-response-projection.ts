import type { HelixWorkstationGatewayListResult } from "../workstation-tool-gateway/types";
import type { HelixAgentRuntimeSelectionTrace } from "./runtime-debug";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";

const toDebugRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const buildSelectedAgentProviderProjection = (provider: HelixAgentProvider) => ({
  id: provider.id,
  label: provider.label,
  permission_profile: provider.permissionProfile,
  supports: provider.supports,
});

const readGatewayCapabilityIds = (gatewayManifest: HelixWorkstationGatewayListResult): string[] =>
  gatewayManifest.capabilities.map((capability) => capability.capability_id);

const buildProviderProjectionFields = (input: {
  provider: HelixAgentProvider;
  providerDebug: Record<string, unknown>;
  runtimeSelectionTrace: HelixAgentRuntimeSelectionTrace;
  gatewayManifest: HelixWorkstationGatewayListResult;
}) => {
  const selectedAgentProvider = buildSelectedAgentProviderProjection(input.provider);
  const gatewayCapabilityIds = readGatewayCapabilityIds(input.gatewayManifest);

  return {
    agent_runtime: input.provider.id,
    agent_runtime_selection_trace: input.runtimeSelectionTrace,
    selected_agent_provider: selectedAgentProvider,
    workstation_gateway_manifest: input.gatewayManifest,
    workstation_gateway_manifest_version: input.gatewayManifest.manifest_version,
    workstation_gateway_capability_ids: gatewayCapabilityIds,
    agent_runtime_adapter_contract: input.providerDebug.agent_runtime_adapter_contract ?? null,
    capability_lane_manifest: input.providerDebug.capability_lane_manifest ?? null,
    capability_lane_ids: input.providerDebug.capability_lane_ids ?? [],
    capability_lane_statuses: input.providerDebug.capability_lane_statuses ?? {},
    capability_lane_resolve_trace_shape: input.providerDebug.capability_lane_resolve_trace_shape ?? null,
    workstation_gateway_reentry_status:
      input.providerDebug.workstation_gateway_reentry_status ?? input.runtimeSelectionTrace.evidence_reentry_status,
    terminal_authority_status:
      input.providerDebug.terminal_authority_status ?? input.runtimeSelectionTrace.terminal_authority_status,
    workstation_gateway_call_results: input.providerDebug.workstation_gateway_call_results ?? [],
    workstation_gateway_observation_packets: input.providerDebug.workstation_gateway_observation_packets ?? [],
    tool_lifecycle_traces: input.providerDebug.tool_lifecycle_traces ?? [],
    tool_followup_decisions: input.providerDebug.tool_followup_decisions ?? [],
    provider_terminal_candidate: input.providerDebug.provider_terminal_candidate ?? null,
    provider_reasoning_reentry: input.providerDebug.provider_reasoning_reentry ?? null,
    terminal_authority_candidate_review: input.providerDebug.terminal_authority_candidate_review ?? null,
    provider_terminal_authority_bridge: input.providerDebug.provider_terminal_authority_bridge ?? null,
    terminal_answer_authority: input.providerDebug.terminal_answer_authority ?? null,
    terminal_presentation: input.providerDebug.terminal_presentation ?? null,
    final_answer_source: input.providerDebug.final_answer_source ?? null,
    terminal_artifact_kind: input.providerDebug.terminal_artifact_kind ?? null,
    provider_gateway_debug_summary: input.providerDebug.provider_gateway_debug_summary ?? null,
    fail_reason: input.providerDebug.fail_reason ?? null,
    codex_exit_code: input.providerDebug.codex_exit_code ?? null,
    codex_timed_out: input.providerDebug.codex_timed_out ?? null,
    codex_process_killed: input.providerDebug.codex_process_killed ?? null,
    codex_timeout_ms: input.providerDebug.codex_timeout_ms ?? null,
    codex_bin: input.providerDebug.codex_bin ?? null,
    codex_args: input.providerDebug.codex_args ?? null,
    codex_runtime_status: input.providerDebug.codex_runtime_status ?? null,
    codex_stderr_preview: input.providerDebug.codex_stderr_preview ?? null,
  };
};

export const buildHelixAgentProviderAskPayload = (input: {
  provider: HelixAgentProvider;
  providerResult: HelixAgentRunResult;
  providerDebug?: Record<string, unknown>;
  runtimeSelectionTrace: HelixAgentRuntimeSelectionTrace;
  gatewayManifest: HelixWorkstationGatewayListResult;
  turnId: string;
}): Record<string, unknown> => {
  const providerDebug = input.providerDebug ?? toDebugRecord(input.providerResult.debug);
  const projectionFields = buildProviderProjectionFields({
    provider: input.provider,
    providerDebug,
    runtimeSelectionTrace: input.runtimeSelectionTrace,
    gatewayManifest: input.gatewayManifest,
  });

  return {
    ...input.providerResult,
    turn_id: input.turnId,
    ...projectionFields,
    debug: {
      ...providerDebug,
      turn_id: input.turnId,
      ...projectionFields,
    },
  };
};
