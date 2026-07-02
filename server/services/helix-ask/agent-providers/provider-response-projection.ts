import type { HelixWorkstationGatewayListResult } from "../workstation-tool-gateway/types";
import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
  HelixCapabilityLaneGoalDispatchReadiness,
} from "@shared/helix-capability-lane-goal-binding";
import { buildHelixCapabilityLaneGoalDispatchAdmission } from "../capability-lanes/goal-dispatch-admission";
import { buildHelixCapabilityLaneGoalDispatchReadiness } from "../capability-lanes/goal-dispatch-readiness";
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

const readRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    : [];

const isGoalDispatchPlan = (value: Record<string, unknown>): value is HelixCapabilityLaneGoalDispatchPlan =>
  value.schema === "helix.capability_lane.goal_dispatch_plan.v1";

const isGoalDispatchAdmission = (
  value: Record<string, unknown>,
): value is HelixCapabilityLaneGoalDispatchAdmission =>
  value.schema === "helix.capability_lane.goal_dispatch_admission.v1";

const isGoalDispatchReadiness = (
  value: unknown,
): value is HelixCapabilityLaneGoalDispatchReadiness => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.schema === "helix.capability_lane.goal_dispatch_readiness.v1" &&
    Array.isArray(record.next_receipt_refs) &&
    (record.next_evidence_refs === undefined || Array.isArray(record.next_evidence_refs)) &&
    (record.next_lane_ids === undefined || Array.isArray(record.next_lane_ids)) &&
    (record.next_lane_session_ids === undefined || Array.isArray(record.next_lane_session_ids));
};

const readGoalDispatchPlans = (providerDebug: Record<string, unknown>): Record<string, unknown>[] => {
  const explicitPlans = readRecordArray(providerDebug.capability_lane_goal_dispatch_plans);
  if (explicitPlans.length > 0) return explicitPlans;

  return readRecordArray(providerDebug.capability_lane_goal_binding_debug_summaries)
    .map((summary) => summary.dispatch_plan)
    .filter((plan): plan is Record<string, unknown> =>
      Boolean(plan) && typeof plan === "object" && !Array.isArray(plan));
};

const readGoalDispatchAdmissions = (providerDebug: Record<string, unknown>): Record<string, unknown>[] => {
  const explicitAdmissions = readRecordArray(providerDebug.capability_lane_goal_dispatch_admissions);
  if (explicitAdmissions.length > 0) return explicitAdmissions;

  const summaryAdmissions = readRecordArray(providerDebug.capability_lane_goal_binding_debug_summaries)
    .map((summary) => summary.dispatch_admission)
    .filter((admission): admission is Record<string, unknown> =>
      Boolean(admission) && typeof admission === "object" && !Array.isArray(admission));
  if (summaryAdmissions.length > 0) return summaryAdmissions;

  return readGoalDispatchPlans(providerDebug)
    .filter(isGoalDispatchPlan)
    .map(buildHelixCapabilityLaneGoalDispatchAdmission);
};

const readMailLoopDebugSummaries = (providerDebug: Record<string, unknown>): Record<string, unknown>[] => {
  const explicitSummaries = readRecordArray(providerDebug.capability_lane_mail_loop_debug_summaries);
  if (explicitSummaries.length > 0) return explicitSummaries;

  return readRecordArray(providerDebug.capability_lane_goal_binding_debug_summaries)
    .map((summary) => summary.latest_mail_loop_summary)
    .filter((summary): summary is Record<string, unknown> =>
      Boolean(summary) && typeof summary === "object" && !Array.isArray(summary));
};

const readGoalDispatchReadiness = (
  providerDebug: Record<string, unknown>,
  plans: Record<string, unknown>[],
  admissions: Record<string, unknown>[],
): HelixCapabilityLaneGoalDispatchReadiness | null => {
  if (isGoalDispatchReadiness(providerDebug.capability_lane_goal_dispatch_readiness)) {
    return providerDebug.capability_lane_goal_dispatch_readiness;
  }

  const typedPlans = plans.filter(isGoalDispatchPlan);
  const typedAdmissions = admissions.filter(isGoalDispatchAdmission);
  if (typedPlans.length === 0 && typedAdmissions.length === 0) return null;

  return buildHelixCapabilityLaneGoalDispatchReadiness({
    plans: typedPlans,
    admissions: typedAdmissions,
  });
};

const buildProviderProjectionFields = (input: {
  provider: HelixAgentProvider;
  providerDebug: Record<string, unknown>;
  runtimeSelectionTrace: HelixAgentRuntimeSelectionTrace;
  gatewayManifest: HelixWorkstationGatewayListResult;
}) => {
  const selectedAgentProvider = buildSelectedAgentProviderProjection(input.provider);
  const gatewayCapabilityIds = readGatewayCapabilityIds(input.gatewayManifest);
  const goalDispatchPlans = readGoalDispatchPlans(input.providerDebug);
  const goalDispatchAdmissions = readGoalDispatchAdmissions(input.providerDebug);
  const mailLoopDebugSummaries = readMailLoopDebugSummaries(input.providerDebug);
  const goalDispatchReadiness = readGoalDispatchReadiness(
    input.providerDebug,
    goalDispatchPlans,
    goalDispatchAdmissions,
  );

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
    capability_lane_resolve_traces: input.providerDebug.capability_lane_resolve_traces ?? [],
    capability_lane_backend_selections: input.providerDebug.capability_lane_backend_selections ?? [],
    capability_lane_call_results: input.providerDebug.capability_lane_call_results ?? [],
    capability_lane_observation_packets: input.providerDebug.capability_lane_observation_packets ?? [],
    capability_lane_projection_receipts: input.providerDebug.capability_lane_projection_receipts ?? [],
    capability_lane_debug_events: input.providerDebug.capability_lane_debug_events ?? [],
    capability_lane_session_results:
      input.providerDebug.capability_lane_session_results ?? [],
    capability_lane_session_debug_summaries:
      input.providerDebug.capability_lane_session_debug_summaries ?? [],
    capability_lane_goal_binding_results:
      input.providerDebug.capability_lane_goal_binding_results ?? [],
    capability_lane_mail_loop_debug_summaries: mailLoopDebugSummaries,
    capability_lane_goal_binding_debug_summaries:
      input.providerDebug.capability_lane_goal_binding_debug_summaries ?? [],
    capability_lane_goal_dispatch_plans: goalDispatchPlans,
    capability_lane_goal_dispatch_admissions: goalDispatchAdmissions,
    capability_lane_goal_dispatch_readiness: goalDispatchReadiness,
    capability_lane_reentry_status: input.providerDebug.capability_lane_reentry_status ?? null,
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
