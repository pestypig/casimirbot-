import crypto from "node:crypto";
import type { HelixWorkstationGatewayListResult } from "../workstation-tool-gateway/types";
import type {
  HelixCapabilityLaneGoalDispatchAdmission,
  HelixCapabilityLaneGoalDispatchPlan,
  HelixCapabilityLaneGoalDispatchReadiness,
} from "@shared/helix-capability-lane-goal-binding";
import { buildHelixCapabilityLaneGoalDispatchAdmission } from "../capability-lanes/goal-dispatch-admission";
import { buildHelixCapabilityLaneGoalDispatchReadiness } from "../capability-lanes/goal-dispatch-readiness";
import { attachLiveSourceIdentityAudit } from "../live-source-identity-audit";
import { liveSourceModelSynthesisMissingFailure } from "../live-source-terminal-failure-repair";
import {
  applyTerminalAnswerEnvelope,
  resolveTerminalAnswerEnvelope,
} from "../terminal-answer-envelope";
import { reconcileAuthoritativeTypedFailureLifecycle } from "../runtime/typed-failure-lifecycle-reconciliation";
import type { HelixAgentRuntimeSelectionTrace } from "./runtime-debug";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";

const toDebugRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const INLINE_IMAGE_DATA_URL_PATTERN =
  /data:(image\/[a-z0-9.+-]+);base64,[a-z0-9+/_=\r\n-]+(?:#[^\s"'\\}\]]+)?/gi;

export const sanitizeHelixAgentProviderPublicPayload = <T extends Record<string, unknown>>(payload: T): T => {
  const seen = new WeakSet<object>();
  const replacementCache = new Map<string, string>();
  let redactedReferenceCount = 0;
  let redactedEncodedChars = 0;

  const sanitizeString = (value: string): string =>
    value.replace(INLINE_IMAGE_DATA_URL_PATTERN, (matched, mediaType: string) => {
      redactedReferenceCount += 1;
      redactedEncodedChars += matched.length;
      const cached = replacementCache.get(matched);
      if (cached) return cached;
      const replacement = [
        "helix-inline-image-ref:redacted",
        `mime=${mediaType.toLowerCase()}`,
        `sha256=${crypto.createHash("sha256").update(matched).digest("hex")}`,
        `encoded_chars=${matched.length}`,
      ].join(";");
      replacementCache.set(matched, replacement);
      return replacement;
    });

  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (typeof entry === "string") value[index] = sanitizeString(entry);
        else visit(entry);
      });
      return;
    }
    const record = value as Record<string, unknown>;
    Object.entries(record).forEach(([key, entry]) => {
      if (typeof entry === "string") record[key] = sanitizeString(entry);
      else visit(entry);
    });
  };

  visit(payload);
  const sizeControl = {
    schema: "helix.agent_provider_public_payload_size_control.v1",
    inline_image_references_redacted: redactedReferenceCount,
    unique_inline_images_redacted: replacementCache.size,
    inline_image_encoded_chars_removed: redactedEncodedChars,
    raw_inline_images_included: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  payload.provider_response_size_control = sizeControl;
  const debug = toDebugRecord(payload.debug);
  if (Object.keys(debug).length > 0) debug.provider_response_size_control = sizeControl;
  return payload;
};

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
  const typedPlans = plans.filter(isGoalDispatchPlan);
  const typedAdmissions = admissions.filter(isGoalDispatchAdmission);
  if (isGoalDispatchReadiness(providerDebug.capability_lane_goal_dispatch_readiness)) {
    const existing = providerDebug.capability_lane_goal_dispatch_readiness;
    const hasSourceHashInputs = [...typedPlans, ...typedAdmissions].some((entry) =>
      typeof entry.source_hash === "string" && entry.source_hash.trim().length > 0);
    if (!hasSourceHashInputs || Array.isArray(existing.next_source_hashes)) {
      return existing;
    }
  }

  if (typedPlans.length === 0 && typedAdmissions.length === 0) return null;

  return buildHelixCapabilityLaneGoalDispatchReadiness({
    plans: typedPlans,
    admissions: typedAdmissions,
  });
};

const buildProviderProjectionFields = (input: {
  provider: HelixAgentProvider;
  providerResult: Record<string, unknown>;
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
    capability_lane_turn_timeline: input.providerDebug.capability_lane_turn_timeline ?? [],
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
    runtime_lane_request_contract:
      input.providerDebug.runtime_lane_request_contract ??
      input.providerResult.runtime_lane_request_contract ??
      null,
    provider_solver_completion_audit:
      input.providerDebug.provider_solver_completion_audit ??
      input.providerResult.provider_solver_completion_audit ??
      null,
    workstation_gateway_reentry_status:
      input.providerDebug.workstation_gateway_reentry_status ?? input.runtimeSelectionTrace.evidence_reentry_status,
    terminal_authority_status:
      input.providerDebug.terminal_authority_status ?? input.runtimeSelectionTrace.terminal_authority_status,
    workstation_gateway_call_results: input.providerDebug.workstation_gateway_call_results ?? [],
    workstation_gateway_observation_packets: input.providerDebug.workstation_gateway_observation_packets ?? [],
    tool_lifecycle_traces: input.providerDebug.tool_lifecycle_traces ?? [],
    tool_followup_decisions: input.providerDebug.tool_followup_decisions ?? [],
    provider_terminal_candidate:
      input.providerDebug.provider_terminal_candidate ?? input.providerResult.provider_terminal_candidate ?? null,
    provider_reasoning_reentry:
      input.providerDebug.provider_reasoning_reentry ?? input.providerResult.provider_reasoning_reentry ?? null,
    terminal_authority_candidate_review:
      input.providerDebug.terminal_authority_candidate_review ??
      input.providerResult.terminal_authority_candidate_review ??
      null,
    provider_terminal_authority_bridge:
      input.providerDebug.provider_terminal_authority_bridge ??
      input.providerResult.provider_terminal_authority_bridge ??
      null,
    conversational_referent_resolution:
      input.providerDebug.conversational_referent_resolution ??
      input.providerResult.conversational_referent_resolution ??
      null,
    chat_referent_context_presence:
      input.providerDebug.chat_referent_context_presence ??
      input.providerResult.chat_referent_context_presence ??
      null,
    chat_referent_context_source_summary:
      input.providerDebug.chat_referent_context_source_summary ??
      input.providerResult.chat_referent_context_source_summary ??
      null,
    terminal_answer_authority:
      input.providerDebug.terminal_answer_authority ?? input.providerResult.terminal_answer_authority ?? null,
    terminal_presentation:
      input.providerDebug.terminal_presentation ?? input.providerResult.terminal_presentation ?? null,
    final_answer_source:
      input.providerDebug.final_answer_source ?? input.providerResult.final_answer_source ?? null,
    terminal_artifact_kind:
      input.providerDebug.terminal_artifact_kind ?? input.providerResult.terminal_artifact_kind ?? null,
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
  requestBody?: Record<string, unknown>;
  runtimeSelectionTrace: HelixAgentRuntimeSelectionTrace;
  gatewayManifest: HelixWorkstationGatewayListResult;
  turnId: string;
}): Record<string, unknown> => {
  const providerDebug = input.providerDebug ?? toDebugRecord(input.providerResult.debug);
  const requestCommittedRoute = toDebugRecord(input.requestBody?.committed_ask_route);
  const requestRouteEvidenceAuthority = toDebugRecord(input.requestBody?.route_evidence_authority);
  const requestRouteProductContract = toDebugRecord(input.requestBody?.route_product_contract);
  const committedRouteProjection = requestCommittedRoute.schema === "helix.committed_ask_route.v1"
    ? { committed_ask_route: requestCommittedRoute }
    : {};
  const routeEvidenceAuthorityProjection = requestRouteEvidenceAuthority.schema === "helix.route_evidence_authority.v1"
    ? { route_evidence_authority: requestRouteEvidenceAuthority }
    : {};
  const routeProductContractProjection = requestRouteProductContract.schema === "helix.route_product_contract.v1"
    ? { route_product_contract: requestRouteProductContract }
    : {};
  const projectionFields = buildProviderProjectionFields({
    provider: input.provider,
    providerResult: toDebugRecord(input.providerResult),
    providerDebug,
    runtimeSelectionTrace: input.runtimeSelectionTrace,
    gatewayManifest: input.gatewayManifest,
  });
  const conversationMemoryPacket =
    input.requestBody?.conversation_memory_packet ?? null;
  const conversationalReferentResolution =
    projectionFields.conversational_referent_resolution ??
    input.requestBody?.conversational_referent_resolution ??
    null;
  const docsContinuationContract =
    input.providerResult.docs_continuation_contract ??
    input.requestBody?.docs_continuation_contract ??
    null;
  const runtimeContinuationHints =
    input.providerResult.runtime_continuation_hints ??
    input.requestBody?.runtime_continuation_hints ??
    [];

  const payload = {
    ...input.providerResult,
    turn_id: input.turnId,
    ...committedRouteProjection,
    ...routeEvidenceAuthorityProjection,
    ...routeProductContractProjection,
    ...projectionFields,
    conversation_memory_packet: conversationMemoryPacket,
    conversational_referent_resolution: conversationalReferentResolution,
    docs_continuation_contract: docsContinuationContract,
    runtime_continuation_hints: runtimeContinuationHints,
    debug: {
      ...providerDebug,
      turn_id: input.turnId,
      ...committedRouteProjection,
      ...routeEvidenceAuthorityProjection,
      ...routeProductContractProjection,
      ...projectionFields,
      conversation_memory_packet: conversationMemoryPacket,
      conversational_referent_resolution: conversationalReferentResolution,
      docs_continuation_contract: docsContinuationContract,
      runtime_continuation_hints: runtimeContinuationHints,
    },
  };
  const threadId =
    readString(payload.thread_id) ??
    readString(input.requestBody?.thread_id) ??
    readString(input.requestBody?.session_id) ??
    "helix-ask:desktop";
  const promptText =
    readString(input.requestBody?.question) ??
    readString(input.requestBody?.prompt) ??
    readString(input.requestBody?.transcript) ??
    "";
  const selectedRoute =
    readString(payload.route_reason_code) ??
    readString(payload.route) ??
    "/ask/turn";
  const identityAudit = attachLiveSourceIdentityAudit({
    payload,
    threadId,
    turnId: input.turnId,
    promptText,
    selectedRoute,
    terminalArtifactKind:
      readString(payload.terminal_artifact_kind) ?? "unknown",
  });
  if (identityAudit?.identity_ok === false) {
    const failure = liveSourceModelSynthesisMissingFailure(
      payload,
      readString(payload.selected_final_answer) ??
        readString(payload.answer) ??
        readString(payload.text) ??
        "",
    );
    if (failure) {
      payload.ok = false;
      payload.response_type = "final_failure";
      payload.final_status = "final_failure";
      payload.final_answer_source = "typed_failure";
      payload.terminal_artifact_kind = "typed_failure";
      payload.terminal_error_code = failure.code;
      payload.terminal_failure_text = failure.text;
      payload.typed_failure = {
        schema: "helix.typed_failure.v1",
        error_code: failure.code,
        failure_code: failure.code,
        message: failure.text,
        text: failure.text,
        answer_text: failure.text,
        assistant_answer: false,
        raw_content_included: false,
      };
      payload.selected_final_answer = failure.text;
      payload.answer = failure.text;
      payload.text = failure.text;
      payload.finalAnswer = failure.text;
      payload.content = failure.text;
      payload.terminal_presentation = {
        schema: "helix.terminal_presentation.v1",
        turn_id: input.turnId,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        concise_text: failure.text,
        assistant_answer: false,
        raw_content_included: false,
      };
      const envelope = resolveTerminalAnswerEnvelope(payload, {
        threadId,
        turnId: input.turnId,
        prompt: promptText,
      });
      applyTerminalAnswerEnvelope(payload, envelope);
      reconcileAuthoritativeTypedFailureLifecycle({
        payload,
        turnId: input.turnId,
        promptText,
        selectedTerminalArtifactKind: "typed_failure",
        finalAnswerSource: "typed_failure",
      });
      Object.assign(payload.debug, {
        ok: payload.ok,
        response_type: payload.response_type,
        final_status: payload.final_status,
        final_answer_source: payload.final_answer_source,
        terminal_artifact_kind: payload.terminal_artifact_kind,
        terminal_error_code: payload.terminal_error_code,
        terminal_failure_text: payload.terminal_failure_text,
        typed_failure: payload.typed_failure,
        selected_final_answer: payload.selected_final_answer,
        answer: payload.answer,
        text: payload.text,
        terminal_presentation: payload.terminal_presentation,
        terminal_answer_authority: payload.terminal_answer_authority,
        terminal_answer_envelope: payload.terminal_answer_envelope,
      });
    }
  }
  return sanitizeHelixAgentProviderPublicPayload(payload);
};
