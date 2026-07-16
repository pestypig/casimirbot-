import crypto from "node:crypto";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  buildInactiveHelixLiveRuntimeAgentControlState,
  resolveHelixLiveRuntimeAuthority,
  resolveHelixLiveRuntimeMode,
} from "@shared/helix-live-runtime-agent";
import type {
  HelixRealtimeSessionAction,
  HelixRealtimeSessionDebugSummary,
  HelixRealtimeSessionResponse,
  HelixRealtimeSessionTransportPlan,
} from "@shared/helix-realtime-session";
import {
  HELIX_REALTIME_SESSION_CLIENT_RECEIPT_RESPONSE_SCHEMA,
  HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA,
  HELIX_REALTIME_SESSION_RESPONSE_SCHEMA,
} from "@shared/helix-realtime-session";
import type {
  HelixRealtimeClientReceiptObservation,
  HelixRealtimeToolSuggestionObservation,
  HelixRealtimeTranscriptObservation,
} from "@shared/helix-realtime-observation";
import {
  HELIX_REALTIME_CLIENT_RECEIPT_OBSERVATION_SCHEMA,
  HELIX_REALTIME_TOOL_SUGGESTION_OBSERVATION_SCHEMA,
  HELIX_REALTIME_TRANSCRIPT_OBSERVATION_SCHEMA,
  isHelixRealtimeToolSuggestionEventType,
  isHelixRealtimeTranscriptEventType,
} from "@shared/helix-realtime-observation";
import { buildRealtimeSessionTransportPlan } from "./config";
import type { HelixRealtimeSessionAdapterResult } from "./adapter";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;

const hashText = (value: string | null): string | null =>
  value === null ? null : `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;

const buildRealtimeLifecycleEventRef = (input: {
  realtimeSessionId: string | null;
  action: HelixRealtimeSessionAction;
  eventType?: string | null;
  observationRef?: string | null;
  observedAtMs?: number | null;
}): string => `event:realtime:lifecycle:${crypto
  .createHash("sha256")
  .update([
    input.realtimeSessionId ?? "realtime:pending",
    input.action,
    input.eventType ?? "none",
    input.observationRef ?? "none",
    String(input.observedAtMs ?? "unknown"),
  ].join(":"))
  .digest("hex")
  .slice(0, 16)}`;

const readClientReceiptRefs = (body: Record<string, unknown>): string[] =>
  [
    readString(body.visible_user_consent_receipt ?? body.visibleUserConsentReceipt),
    readString(body.client_receipt_ref ?? body.clientReceiptRef),
  ].filter((entry): entry is string => Boolean(entry));

const readRequestedTransport = (body: Record<string, unknown>) => {
  const transport = readString(body.transport ?? body.requested_transport ?? body.requestedTransport);
  return transport === "webrtc" || transport === "websocket" || transport === "server_sideband"
    ? transport
    : "webrtc";
};

const actionSchema = (action: HelixRealtimeSessionAction): HelixRealtimeSessionResponse["schema"] => {
  if (action === "record_client_receipt") return HELIX_REALTIME_SESSION_CLIENT_RECEIPT_RESPONSE_SCHEMA;
  if (action === "record_event") return HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA;
  return HELIX_REALTIME_SESSION_RESPONSE_SCHEMA;
};

export const resolveRealtimeSessionPolicyGate = (input: {
  accountPolicy: HelixAccountCapabilityPolicy;
  body?: unknown;
}): HelixRealtimeSessionResponse["policy_gate"] => {
  const body = readRecord(input.body);
  const runtimeControlsLocked =
    input.accountPolicy.locked_features.includes("runtime_agent_controls") ||
    !input.accountPolicy.feature_flags.includes("runtime_agent_controls");
  const available = input.accountPolicy.account_type === "developer" && !runtimeControlsLocked;
  return {
    account_type: input.accountPolicy.account_type,
    runtime_agent_controls_available: available,
    locked_reason: available
      ? null
      : input.accountPolicy.account_type !== "developer"
        ? "developer_account_required"
        : "runtime_agent_controls_locked_by_account_policy",
    requested_runtime_agent_mode: readString(body.runtime_agent_mode ?? body.runtimeAgentMode),
    requested_runtime_agent_authority: readString(body.runtime_agent_authority ?? body.runtimeAgentAuthority),
  };
};

export const buildRealtimeRuntimeSessionDebugSummary = (input: {
  realtimeSessionId?: string | null;
  action: HelixRealtimeSessionAction;
  body?: unknown;
  blockedReason: string;
  transportPlan?: HelixRealtimeSessionTransportPlan;
}): HelixRealtimeSessionDebugSummary => {
  const body = readRecord(input.body);
  const transportPlan = input.transportPlan ?? buildRealtimeSessionTransportPlan({
    requestedTransport: readRequestedTransport(body),
    clientReceiptRefs: readClientReceiptRefs(body),
  });
  const runtimeMode = resolveHelixLiveRuntimeMode(body.runtime_agent_mode ?? body.runtimeAgentMode);
  const runtimeAuthority = resolveHelixLiveRuntimeAuthority(
    body.runtime_agent_authority ?? body.runtimeAgentAuthority,
  );
  const base = buildInactiveHelixLiveRuntimeAgentControlState({
    runtime_agent_mode: isHelixRealtimeTranscriptEventType(body.event_type)
      ? "live_transcription"
      : runtimeMode,
    runtime_agent_authority: runtimeAuthority,
    selected_backend_provider: readString(body.requested_backend_provider ?? body.requestedBackendProvider),
    selected_model_or_service: readString(
      body.selected_model_or_service ??
      body.selectedModelOrService ??
      body.selected_realtime_model ??
      body.selectedRealtimeModel,
    ),
    latest_failure_code: input.blockedReason,
  });
  const clientReceiptCount = input.action === "record_client_receipt" ? 1 : 0;
  const clientReceipt = buildRealtimeClientReceiptObservation({
    realtimeSessionId: input.realtimeSessionId ?? null,
    body,
  });
  const transcriptObservation = buildRealtimeTranscriptObservation({
    realtimeSessionId: input.realtimeSessionId ?? null,
    body,
  });
  const toolSuggestion = buildRealtimeToolSuggestionObservation({
    realtimeSessionId: input.realtimeSessionId ?? null,
    body,
  });
  const evidenceRef = transcriptObservation?.observation_ref ?? toolSuggestion?.suggestion_ref ?? null;
  const evidenceEventType = transcriptObservation?.event_type ?? toolSuggestion?.event_type ?? null;
  const evidenceObservedAtMs = transcriptObservation?.observed_at_ms ?? null;
  const lifecycleEventRef = evidenceRef
    ? buildRealtimeLifecycleEventRef({
        realtimeSessionId: input.realtimeSessionId ?? null,
        action: input.action,
        eventType: evidenceEventType,
        observationRef: evidenceRef,
        observedAtMs: evidenceObservedAtMs,
      })
    : null;
  return {
    ...base,
    realtime_session_id: input.realtimeSessionId ?? null,
    live_session_admission_status:
      input.blockedReason === "account_policy_locked" ||
      input.blockedReason === "developer_account_required" ||
      input.blockedReason === "runtime_agent_controls_locked_by_account_policy"
        ? "locked_by_account_policy"
        : input.action === "record_client_receipt" && clientReceipt
          ? "receipt_recorded"
          : input.blockedReason === "missing_openai_key"
            ? "missing_openai_key"
          : input.blockedReason === "openai_realtime_contract_ready"
            ? "openai_realtime_contract_ready"
          : input.blockedReason === "openai_realtime_contract_failed"
            ? "openai_realtime_contract_failed"
          : input.blockedReason === "realtime_session_admitted_stub"
            ? "admitted_stub"
            : input.blockedReason === "realtime_live_transport_disabled_by_env" ||
                input.blockedReason === "openai_realtime_adapter_stub_no_live_call"
              ? "transport_blocked"
              : "unavailable",
    selected_realtime_model: base.selected_model_or_service,
    session_status: input.blockedReason === "realtime_session_admitted_stub"
      ? "requesting"
      : clientReceipt?.receipt_kind === "stopped" ||
          clientReceipt?.receipt_kind === "transport_stopped" ||
          clientReceipt?.receipt_kind === "capture_stopped" ||
          clientReceipt?.receipt_kind === "track_stopped"
        ? "stopped"
        : clientReceipt?.receipt_kind === "error" ||
            input.blockedReason === "account_policy_locked"
          ? "error"
          : input.action === "stop"
            ? "stopping"
            : base.session_status,
    session_lifecycle: [input.action, input.blockedReason],
    transport_execution_attempted: false,
    media_capture_started: false,
    openai_network_call_attempted: false,
    webrtc_started: false,
    sideband_started: false,
    adapter_id: transportPlan.adapter_id,
    adapter_state: transportPlan.adapter_state,
    transport_plan: transportPlan,
    provider_session_ref: transportPlan.provider_session_ref,
    client_receipt_refs: transportPlan.client_receipt_refs,
    ephemeral_client_secret_expires_at_ms: transportPlan.ephemeral_client_secret_expires_at_ms,
    client_receipt_observation_count: clientReceipt ? 1 : 0,
    latest_client_receipt_ref: clientReceipt?.client_receipt_ref ?? null,
    latest_client_receipt_kind: clientReceipt?.receipt_kind ?? null,
    latest_client_receipt_status: clientReceipt?.status ?? null,
    live_execution_disabled_reason: transportPlan.live_execution_disabled_reason,
    client_receipt_count:
      clientReceiptCount +
      (transcriptObservation?.client_receipt_ref ? 1 : 0) +
      (clientReceipt ? 1 : 0),
    client_receipt_state: clientReceiptCount > 0 || clientReceipt ? "received" : base.client_receipt_state,
    tool_admission_state: "blocked",
    transcript_observation_count: transcriptObservation ? 1 : 0,
    latest_transcript_event_type: transcriptObservation?.event_type ?? null,
    latest_transcript_observation_ref: transcriptObservation?.observation_ref ?? null,
    tool_suggestion_count: toolSuggestion ? 1 : 0,
    latest_tool_suggestion_ref: toolSuggestion?.suggestion_ref ?? null,
    latest_tool_suggestion_admission_status: toolSuggestion?.admission_status ?? null,
    latest_lifecycle_event_ref: lifecycleEventRef,
    realtime_reentry_status: evidenceRef
      ? "observation_packet_required_for_provider_reentry"
      : null,
  };
};

export const buildRealtimeClientReceiptObservation = (input: {
  realtimeSessionId: string | null;
  body?: unknown;
  nowMs?: number;
}): HelixRealtimeClientReceiptObservation | null => {
  const body = readRecord(input.body);
  const clientReceiptRef = readString(body.client_receipt_ref ?? body.clientReceiptRef);
  const receiptKind = readString(body.receipt_kind ?? body.receiptKind);
  if (!clientReceiptRef || !receiptKind) return null;
  const realtimeSessionId = input.realtimeSessionId || "realtime:deterministic-client-receipt";
  const observedAtMs = readNumber(body.observed_at_ms ?? body.observedAtMs) ?? input.nowMs ?? Date.now();
  const runtimeMode = resolveHelixLiveRuntimeMode(body.runtime_agent_mode ?? body.runtimeAgentMode);
  const runtimeAuthority = resolveHelixLiveRuntimeAuthority(
    body.runtime_agent_authority ?? body.runtimeAgentAuthority,
  );
  const receiptRef =
    readString(body.receipt_ref ?? body.receiptRef) ??
    `receipt:realtime:${crypto
      .createHash("sha256")
      .update([realtimeSessionId, receiptKind, clientReceiptRef, String(observedAtMs)].join(":"))
      .digest("hex")
      .slice(0, 16)}`;
  return {
    schema: HELIX_REALTIME_CLIENT_RECEIPT_OBSERVATION_SCHEMA,
    receipt_ref: receiptRef,
    realtime_session_id: realtimeSessionId,
    lane_session_id: readString(body.lane_session_id ?? body.laneSessionId),
    runtime_agent_mode: runtimeMode,
    runtime_agent_authority: runtimeAuthority,
    receipt_kind: receiptKind,
    lifecycle_state: readString(body.lifecycle_state ?? body.lifecycleState),
    controller_state: readString(body.controller_state ?? body.controllerState),
    status: readString(body.status),
    observed_at_ms: observedAtMs,
    client_receipt_ref: clientReceiptRef,
    source_binding_ref: readString(body.source_binding_ref ?? body.sourceBindingRef),
    failure_code: readString(body.error_code ?? body.errorCode ?? body.failure_code ?? body.failureCode),
    failure_reason: readString(body.blocked_reason ?? body.blockedReason ?? body.failure_reason ?? body.failureReason),
    selected_model_or_service: readString(
      body.selected_model_or_service ?? body.selectedModelOrService,
    ),
    provider_session_ref: readString(body.provider_session_ref ?? body.providerSessionRef),
    provider_event_type: readString(body.provider_event_type ?? body.providerEventType),
    provider_response_ref: readString(body.provider_response_ref ?? body.providerResponseRef),
    response_status: readString(body.response_status ?? body.responseStatus),
    vad_state: readString(body.vad_state ?? body.vadState),
    response_interrupted: body.response_interrupted === true || body.responseInterrupted === true,
    audio_focus_owner: readString(body.audio_focus_owner ?? body.audioFocusOwner),
    audio_focus_owner_ref: readString(body.audio_focus_owner_ref ?? body.audioFocusOwnerRef),
    qualified_user_interruption:
      body.qualified_user_interruption === true || body.qualifiedUserInterruption === true,
    speaker_loopback_suppressed:
      body.speaker_loopback_suppressed === true || body.speakerLoopbackSuppressed === true,
    terminal_voice_interrupted:
      body.terminal_voice_interrupted === true || body.terminalVoiceInterrupted === true,
    barge_in_qualification_basis: readString(
      body.barge_in_qualification_basis ?? body.bargeInQualificationBasis,
    ),
    client_reported_transport_execution_attempted:
      body.transport_execution_attempted === true || body.transportExecutionAttempted === true,
    client_reported_openai_network_call_attempted:
      body.openai_network_call_attempted === true || body.openAiNetworkCallAttempted === true,
    client_reported_webrtc_started:
      body.webrtc_started === true || body.webrtcStarted === true,
    client_reported_media_capture_started:
      body.media_capture_started === true || body.mediaCaptureStarted === true,
    client_reported_browser_tracks_created:
      body.browser_tracks_created === true || body.browserTracksCreated === true,
    client_reported_data_channels_created:
      body.data_channels_created === true || body.dataChannelsCreated === true,
    openai_network_call_attempted: false,
    ephemeral_credential_minted: false,
    webrtc_started: false,
    sideband_started: false,
    media_capture_started: false,
    browser_media_api_referenced: false,
    browser_tracks_created: false,
    data_channels_created: false,
    answer_authority: false,
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    reentry_status: "pending_solver_reentry",
    observation_reentered: false,
    context_role: "tool_evidence",
  };
};

export const buildRealtimeToolSuggestionObservation = (input: {
  realtimeSessionId: string | null;
  body?: unknown;
}): HelixRealtimeToolSuggestionObservation | null => {
  const body = readRecord(input.body);
  if (!isHelixRealtimeToolSuggestionEventType(body.event_type)) return null;
  const realtimeSessionId = input.realtimeSessionId || "realtime:deterministic-suggestion";
  const runtimeMode = resolveHelixLiveRuntimeMode(body.runtime_agent_mode ?? body.runtimeAgentMode);
  const runtimeAuthority = resolveHelixLiveRuntimeAuthority(
    body.runtime_agent_authority ?? body.runtimeAgentAuthority,
  );
  const suggestedCapabilityId = readString(
    body.suggested_capability_id ?? body.suggestedCapabilityId ?? body.capability_id ?? body.capabilityId,
  );
  const suggestedActionId = readString(
    body.suggested_action_id ?? body.suggestedActionId ?? body.action_id ?? body.actionId,
  );
  const sourceObservationRef = readString(
    body.source_observation_ref ?? body.sourceObservationRef ?? body.observation_ref ?? body.observationRef,
  );
  const clientReceiptRef = readString(body.client_receipt_ref ?? body.clientReceiptRef);
  const hasSuggestionTarget = Boolean(suggestedCapabilityId || suggestedActionId);
  const suggestionRef =
    readString(body.suggestion_ref ?? body.suggestionRef ?? body.event_ref ?? body.eventRef) ??
    `suggestion:realtime:${crypto
      .createHash("sha256")
      .update([
        realtimeSessionId,
        String(body.event_type),
        suggestedCapabilityId ?? "none",
        suggestedActionId ?? "none",
        sourceObservationRef ?? "none",
      ].join(":"))
      .digest("hex")
      .slice(0, 16)}`;
  return {
    schema: HELIX_REALTIME_TOOL_SUGGESTION_OBSERVATION_SCHEMA,
    suggestion_ref: suggestionRef,
    realtime_session_id: realtimeSessionId,
    lane_session_id: readString(body.lane_session_id ?? body.laneSessionId),
    runtime_agent_mode: runtimeMode,
    runtime_agent_authority: runtimeAuthority,
    event_type: body.event_type,
    suggested_capability_id: suggestedCapabilityId,
    suggested_action_id: suggestedActionId,
    source_observation_ref: sourceObservationRef,
    client_receipt_ref: clientReceiptRef,
    tool_admission_state: hasSuggestionTarget ? "suggest_only" : "blocked",
    admission_status: hasSuggestionTarget ? "candidate_only" : "blocked",
    blocked_reason: hasSuggestionTarget ? null : "missing_suggested_capability_or_action",
    reentry_status: "pending_solver_reentry",
    observation_reentered: false,
    context_role: "tool_evidence",
    execution_attempted: false,
    gateway_execution_attempted: false,
    workstation_action_executed: false,
    answer_authority: false,
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeTranscriptObservation = (input: {
  realtimeSessionId: string | null;
  body?: unknown;
  nowMs?: number;
}): HelixRealtimeTranscriptObservation | null => {
  const body = readRecord(input.body);
  if (!isHelixRealtimeTranscriptEventType(body.event_type)) return null;
  const sourceBinding = readRecord(body.source_binding ?? body.sourceBinding);
  const sourceId = readString(body.source_id ?? body.sourceId ?? sourceBinding.source_id ?? sourceBinding.sourceId);
  const sourceKind = readString(body.source_kind ?? body.sourceKind ?? sourceBinding.source_kind ?? sourceBinding.sourceKind);
  const sourceHash = readString(body.source_hash ?? body.sourceHash ?? sourceBinding.source_hash ?? sourceBinding.sourceHash);
  const transcriptText = readString(body.transcript_text ?? body.transcriptText ?? body.text);
  const transcriptHash = readString(body.transcript_text_hash ?? body.transcriptTextHash) ?? hashText(transcriptText);
  const observedAtMs = readNumber(body.observed_at_ms ?? body.observedAtMs) ?? input.nowMs ?? Date.now();
  const realtimeSessionId = input.realtimeSessionId || "realtime:deterministic-transcript";
  const runtimeAuthority = resolveHelixLiveRuntimeAuthority(
    body.runtime_agent_authority ?? body.runtimeAgentAuthority,
  );
  const observationRef =
    readString(body.observation_ref ?? body.observationRef ?? body.event_ref ?? body.eventRef) ??
    `obs:realtime:transcript:${crypto
      .createHash("sha256")
      .update(`${realtimeSessionId}:${body.event_type}:${transcriptHash ?? observedAtMs}`)
      .digest("hex")
      .slice(0, 16)}`;
  return {
    schema: HELIX_REALTIME_TRANSCRIPT_OBSERVATION_SCHEMA,
    observation_ref: observationRef,
    realtime_session_id: realtimeSessionId,
    lane_session_id: readString(body.lane_session_id ?? body.laneSessionId),
    runtime_agent_mode: "live_transcription",
    runtime_agent_authority: runtimeAuthority,
    event_type: body.event_type,
    source_binding: Object.keys(sourceBinding).length > 0 ? sourceBinding : null,
    source_id: sourceId,
    source_kind: sourceKind,
    source_hash: sourceHash ?? transcriptHash,
    transcript_text_hash: transcriptHash,
    transcript_text_char_count:
      readNumber(body.transcript_text_char_count ?? body.transcriptTextCharCount) ??
      (transcriptText ? transcriptText.length : null),
    observed_at_ms: observedAtMs,
    client_receipt_ref: readString(body.client_receipt_ref ?? body.clientReceiptRef),
    reentry_status: "pending_solver_reentry",
    observation_reentered: false,
    context_role: "tool_evidence",
    transcript_is_user_intent: false,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeSessionBoundaryResponse = (input: {
  action: HelixRealtimeSessionAction;
  accountPolicy: HelixAccountCapabilityPolicy;
  body?: unknown;
  realtimeSessionId?: string | null;
  blockedReason:
    | "account_policy_locked"
    | "capability_lane_disabled_by_policy"
    | "realtime_session_not_found"
    | "realtime_adapter_disabled_by_env"
    | "realtime_live_transport_disabled_by_env"
    | "openai_realtime_adapter_stub_no_live_call"
    | "missing_openai_key"
    | "openai_realtime_transport_not_configured"
    | "openai_realtime_contract_failed";
  adapterResult?: HelixRealtimeSessionAdapterResult | null;
}): HelixRealtimeSessionResponse => {
  const body = readRecord(input.body);
  const transportPlan = input.adapterResult?.transport_plan ?? buildRealtimeSessionTransportPlan({
    requestedTransport: readRequestedTransport(body),
    clientReceiptRefs: readClientReceiptRefs(body),
  });
  const policyGate = resolveRealtimeSessionPolicyGate({
    accountPolicy: input.accountPolicy,
    body: input.body,
  });
  const policyLocked = input.blockedReason === "account_policy_locked";
  const error = policyLocked
    ? "realtime_runtime_agent_locked_by_account_policy"
    : input.blockedReason === "realtime_session_not_found"
      ? "realtime_session_not_found"
      : input.blockedReason === "openai_realtime_contract_failed"
        ? "realtime_openai_contract_failed"
      : "realtime_session_disabled";
  const summary = buildRealtimeRuntimeSessionDebugSummary({
    realtimeSessionId: input.realtimeSessionId ?? null,
    action: input.action,
    body: input.body,
    blockedReason: policyGate.locked_reason ?? input.blockedReason,
    transportPlan,
  });
  return {
    schema: actionSchema(input.action),
    ok: false,
    action: input.action,
    error,
    blocked_reason: policyGate.locked_reason ?? input.blockedReason,
    realtime_session_id: input.realtimeSessionId ?? null,
    lane_id: "realtime_session",
    transport: "none",
    transport_plan: transportPlan,
    client_secret_requested: false,
    client_secret_issued: false,
    sdp_exchange_requested: false,
    server_sideband_requested: false,
    provider_session_ref: input.adapterResult?.provider_session_ref ?? null,
    openai_network_call_attempted: input.adapterResult?.openai_network_call_attempted === true,
    ephemeral_credential_minted: input.adapterResult?.ephemeral_credential_minted === true,
    webrtc_started: false,
    sideband_started: false,
    account_policy: input.accountPolicy,
    policy_gate: policyGate,
    realtime_runtime_session_summary: {
      ...summary,
      live_session_admission_status:
        input.blockedReason === "missing_openai_key"
          ? "missing_openai_key"
          : input.blockedReason === "openai_realtime_contract_failed"
            ? "openai_realtime_contract_failed"
            : summary.live_session_admission_status,
      openai_network_call_attempted: input.adapterResult?.openai_network_call_attempted === true,
      provider_session_ref: input.adapterResult?.provider_session_ref ?? null,
      latest_failure_code: input.adapterResult?.blocked_reason ?? summary.latest_failure_code,
      ephemeral_client_secret_expires_at_ms:
        input.adapterResult?.ephemeral_client_secret_expires_at_ms ??
        transportPlan.ephemeral_client_secret_expires_at_ms,
    },
    realtime_runtime_session_events: [],
    realtime_transcript_observations: [],
    realtime_tool_suggestion_observations: [],
    realtime_client_receipt_observations: [],
    realtime_reentry_status: null,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeSessionAdmissionResponse = (input: {
  accountPolicy: HelixAccountCapabilityPolicy;
  body?: unknown;
  realtimeSessionId?: string | null;
  adapterResult?: HelixRealtimeSessionAdapterResult | null;
}): HelixRealtimeSessionResponse => {
  const body = readRecord(input.body);
  const transportPlan = input.adapterResult?.transport_plan ?? buildRealtimeSessionTransportPlan({
    requestedTransport: readRequestedTransport(body),
    clientReceiptRefs: readClientReceiptRefs(body),
  });
  const realtimeSessionId =
    input.realtimeSessionId ??
    readString(body.realtime_session_id ?? body.realtimeSessionId) ??
    `realtime:admitted:${crypto
      .createHash("sha256")
      .update([
        readString(body.visible_user_consent_receipt ?? body.visibleUserConsentReceipt) ?? "no-consent",
        readString(body.runtime_agent_mode ?? body.runtimeAgentMode) ?? "off",
        readString(body.runtime_agent_authority ?? body.runtimeAgentAuthority) ?? "observe_only",
      ].join(":"))
      .digest("hex")
      .slice(0, 16)}`;
  const summary = buildRealtimeRuntimeSessionDebugSummary({
    realtimeSessionId,
    action: "start",
    body: input.body,
    blockedReason: input.adapterResult?.blocked_reason === "openai_realtime_contract_ready"
      ? "openai_realtime_contract_ready"
      : "realtime_session_admitted_stub",
    transportPlan,
  });
  const lifecycleEventRef = buildRealtimeLifecycleEventRef({
    realtimeSessionId,
    action: "start",
    eventType: "session.admitted_stub",
    observationRef: readString(body.visible_user_consent_receipt ?? body.visibleUserConsentReceipt),
    observedAtMs: readNumber(body.observed_at_ms ?? body.observedAtMs),
  });
  return {
    schema: HELIX_REALTIME_SESSION_RESPONSE_SCHEMA,
    ok: true,
    action: "start",
    error: null,
    blocked_reason: null,
    realtime_session_id: realtimeSessionId,
    lane_id: "realtime_session",
    transport: "none",
    transport_plan: transportPlan,
    client_secret_requested: transportPlan.client_secret_requested,
    client_secret_issued: transportPlan.client_secret_issued,
    sdp_exchange_requested: transportPlan.sdp_exchange_requested,
    server_sideband_requested: false,
    provider_session_ref: input.adapterResult?.provider_session_ref ?? transportPlan.provider_session_ref,
    openai_network_call_attempted: input.adapterResult?.openai_network_call_attempted === true,
    ephemeral_credential_minted: input.adapterResult?.ephemeral_credential_minted === true,
    webrtc_started: false,
    sideband_started: false,
    account_policy: input.accountPolicy,
    policy_gate: resolveRealtimeSessionPolicyGate({
      accountPolicy: input.accountPolicy,
      body: input.body,
    }),
    realtime_runtime_session_summary: {
      ...summary,
      live_session_admission_status: input.adapterResult?.blocked_reason === "openai_realtime_contract_ready"
        ? "openai_realtime_contract_ready"
        : "admitted_stub",
      session_status: "requesting",
      session_lifecycle: [
        "start",
        input.adapterResult?.blocked_reason === "openai_realtime_contract_ready"
          ? "openai_realtime_contract_ready"
          : "realtime_session_admitted_stub",
        transportPlan.live_execution_disabled_reason,
      ],
      transport: "none",
      client_receipt_state: transportPlan.client_receipt_refs.length > 0
        ? "awaiting_client_receipt"
        : "not_expected",
      latest_failure_code: transportPlan.live_execution_disabled_reason,
      provider_session_ref: input.adapterResult?.provider_session_ref ?? transportPlan.provider_session_ref,
      openai_network_call_attempted: input.adapterResult?.openai_network_call_attempted === true,
      ephemeral_client_secret_expires_at_ms: transportPlan.ephemeral_client_secret_expires_at_ms,
    },
    realtime_runtime_session_events: [
      {
        schema: "helix.realtime_session.lifecycle_event.v1",
        lifecycle_event_ref: lifecycleEventRef,
        action: "start",
        event_type: input.adapterResult?.blocked_reason === "openai_realtime_contract_ready"
          ? "session.openai_realtime_contract_ready"
          : "session.admitted_stub",
        realtime_session_id: realtimeSessionId,
        admission_status: input.adapterResult?.blocked_reason === "openai_realtime_contract_ready"
          ? "openai_realtime_contract_ready"
          : "admitted_stub",
        transport_execution_attempted: false,
        media_capture_started: false,
        openai_network_call_attempted: input.adapterResult?.openai_network_call_attempted === true,
        webrtc_started: false,
        sideband_started: false,
        reentry_status: "pending_solver_reentry",
        observation_reentered: false,
        context_role: "tool_evidence",
        reentry_required: true,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
    ],
    realtime_transcript_observations: [],
    realtime_tool_suggestion_observations: [],
    realtime_client_receipt_observations: [],
    realtime_reentry_status: null,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeToolSuggestionEventResponse = (input: {
  accountPolicy: HelixAccountCapabilityPolicy;
  body?: unknown;
  realtimeSessionId?: string | null;
  adapterResult?: HelixRealtimeSessionAdapterResult | null;
}): HelixRealtimeSessionResponse => {
  const body = readRecord(input.body);
  const transportPlan = input.adapterResult?.transport_plan ?? buildRealtimeSessionTransportPlan({
    requestedTransport: readRequestedTransport(body),
    clientReceiptRefs: readClientReceiptRefs(body),
  });
  const suggestion = buildRealtimeToolSuggestionObservation({
    realtimeSessionId: input.realtimeSessionId ?? null,
    body: input.body,
  });
  const lifecycleEventRef = suggestion
    ? buildRealtimeLifecycleEventRef({
        realtimeSessionId: input.realtimeSessionId ?? null,
        action: "record_event",
        eventType: suggestion.event_type,
        observationRef: suggestion.suggestion_ref,
        observedAtMs: null,
      })
    : null;
  const summary = buildRealtimeRuntimeSessionDebugSummary({
    realtimeSessionId: input.realtimeSessionId ?? null,
    action: "record_event",
    body: input.body,
    blockedReason: suggestion ? "realtime_tool_suggestion_recorded" : "unsupported_realtime_event_type",
    transportPlan,
  });
  return {
    schema: HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA,
    ok: Boolean(suggestion),
    action: "record_event",
    error: suggestion ? null : "realtime_session_disabled",
    blocked_reason: suggestion ? null : "unsupported_realtime_event_type",
    realtime_session_id: input.realtimeSessionId ?? null,
    lane_id: "realtime_session",
    transport: "none",
    transport_plan: transportPlan,
    client_secret_requested: false,
    client_secret_issued: false,
    sdp_exchange_requested: false,
    server_sideband_requested: false,
    provider_session_ref: null,
    openai_network_call_attempted: false,
    ephemeral_credential_minted: false,
    webrtc_started: false,
    sideband_started: false,
    account_policy: input.accountPolicy,
    policy_gate: resolveRealtimeSessionPolicyGate({
      accountPolicy: input.accountPolicy,
      body: input.body,
    }),
    realtime_runtime_session_summary: {
      ...summary,
      latest_failure_code: suggestion?.blocked_reason ?? null,
      session_lifecycle: suggestion
        ? ["record_event", "realtime_tool_suggestion_recorded"]
        : summary.session_lifecycle,
      tool_admission_state: suggestion?.tool_admission_state ?? "blocked",
      tool_request_count: suggestion ? 1 : 0,
      admitted_tool_request_count: 0,
      blocked_tool_request_count: suggestion?.admission_status === "blocked" ? 1 : 0,
      latest_tool_suggestion_ref: suggestion?.suggestion_ref ?? null,
      latest_tool_suggestion_admission_status: suggestion?.admission_status ?? null,
      latest_lifecycle_event_ref: lifecycleEventRef,
      realtime_reentry_status: suggestion
        ? "observation_packet_required_for_provider_reentry"
        : null,
    },
    realtime_runtime_session_events: suggestion
      ? [
          {
            schema: "helix.realtime_session.lifecycle_event.v1",
            lifecycle_event_ref: lifecycleEventRef,
            action: "record_event",
            event_type: suggestion.event_type,
            suggestion_ref: suggestion.suggestion_ref,
            realtime_session_id: suggestion.realtime_session_id,
            client_receipt_ref: suggestion.client_receipt_ref,
            admission_status: suggestion.admission_status,
            reentry_status: "pending_solver_reentry",
            observation_reentered: false,
            context_role: "tool_evidence",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        ]
      : [],
    realtime_transcript_observations: [],
    realtime_tool_suggestion_observations: suggestion ? [suggestion] : [],
    realtime_client_receipt_observations: [],
    realtime_reentry_status: suggestion
      ? "observation_packet_required_for_provider_reentry"
      : null,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeTranscriptEventResponse = (input: {
  accountPolicy: HelixAccountCapabilityPolicy;
  body?: unknown;
  realtimeSessionId?: string | null;
  adapterResult?: HelixRealtimeSessionAdapterResult | null;
}): HelixRealtimeSessionResponse => {
  const body = readRecord(input.body);
  const transportPlan = input.adapterResult?.transport_plan ?? buildRealtimeSessionTransportPlan({
    requestedTransport: readRequestedTransport(body),
    clientReceiptRefs: readClientReceiptRefs(body),
  });
  const observation = buildRealtimeTranscriptObservation({
    realtimeSessionId: input.realtimeSessionId ?? null,
    body: input.body,
  });
  const summary = buildRealtimeRuntimeSessionDebugSummary({
    realtimeSessionId: input.realtimeSessionId ?? null,
    action: "record_event",
    body: input.body,
    blockedReason: observation ? "transcript_observation_recorded" : "unsupported_realtime_event_type",
    transportPlan,
  });
  const lifecycleEventRef = observation
    ? buildRealtimeLifecycleEventRef({
        realtimeSessionId: input.realtimeSessionId ?? null,
        action: "record_event",
        eventType: observation.event_type,
        observationRef: observation.observation_ref,
        observedAtMs: observation.observed_at_ms,
      })
    : null;
  return {
    schema: HELIX_REALTIME_SESSION_EVENT_RESPONSE_SCHEMA,
    ok: Boolean(observation),
    action: "record_event",
    error: observation ? null : "realtime_session_disabled",
    blocked_reason: observation ? null : "unsupported_realtime_event_type",
    realtime_session_id: input.realtimeSessionId ?? null,
    lane_id: "realtime_session",
    transport: "none",
    transport_plan: transportPlan,
    client_secret_requested: false,
    client_secret_issued: false,
    sdp_exchange_requested: false,
    server_sideband_requested: false,
    provider_session_ref: null,
    openai_network_call_attempted: false,
    ephemeral_credential_minted: false,
    webrtc_started: false,
    sideband_started: false,
    account_policy: input.accountPolicy,
    policy_gate: resolveRealtimeSessionPolicyGate({
      accountPolicy: input.accountPolicy,
      body: input.body,
    }),
    realtime_runtime_session_summary: {
      ...summary,
      latest_failure_code: observation ? null : summary.latest_failure_code,
      session_lifecycle: observation
        ? ["record_event", "transcript_observation_recorded"]
        : summary.session_lifecycle,
      transcript_observation_count: observation ? 1 : 0,
      latest_transcript_event_type: observation?.event_type ?? null,
      latest_transcript_observation_ref: observation?.observation_ref ?? null,
      latest_lifecycle_event_ref: lifecycleEventRef,
      realtime_reentry_status: observation
        ? "observation_packet_required_for_provider_reentry"
        : null,
      client_receipt_count: observation?.client_receipt_ref ? 1 : 0,
      client_receipt_state: observation?.client_receipt_ref ? "received" : "not_expected",
      tool_admission_state: "observe_only",
    },
    realtime_runtime_session_events: observation
      ? [
          {
            schema: "helix.realtime_session.lifecycle_event.v1",
            lifecycle_event_ref: lifecycleEventRef,
            action: "record_event",
            event_type: observation.event_type,
            observation_ref: observation.observation_ref,
            realtime_session_id: observation.realtime_session_id,
            observed_at_ms: observation.observed_at_ms,
            client_receipt_ref: observation.client_receipt_ref,
            reentry_status: "pending_solver_reentry",
            observation_reentered: false,
            context_role: "tool_evidence",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        ]
      : [],
    realtime_transcript_observations: observation ? [observation] : [],
    realtime_tool_suggestion_observations: [],
    realtime_client_receipt_observations: [],
    realtime_reentry_status: observation
      ? "observation_packet_required_for_provider_reentry"
      : null,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildRealtimeClientReceiptResponse = (input: {
  accountPolicy: HelixAccountCapabilityPolicy;
  body?: unknown;
  realtimeSessionId?: string | null;
  adapterResult?: HelixRealtimeSessionAdapterResult | null;
}): HelixRealtimeSessionResponse => {
  const body = readRecord(input.body);
  const transportPlan = input.adapterResult?.transport_plan ?? buildRealtimeSessionTransportPlan({
    requestedTransport: readRequestedTransport(body),
    clientReceiptRefs: readClientReceiptRefs(body),
  });
  const receipt = buildRealtimeClientReceiptObservation({
    realtimeSessionId: input.realtimeSessionId ?? null,
    body: input.body,
  });
  const lifecycleEventRef = receipt
    ? buildRealtimeLifecycleEventRef({
        realtimeSessionId: input.realtimeSessionId ?? null,
        action: "record_client_receipt",
        eventType: receipt.receipt_kind,
        observationRef: receipt.receipt_ref,
        observedAtMs: receipt.observed_at_ms,
      })
    : null;
  const summary = buildRealtimeRuntimeSessionDebugSummary({
    realtimeSessionId: input.realtimeSessionId ?? null,
    action: "record_client_receipt",
    body: input.body,
    blockedReason: receipt ? "client_receipt_recorded" : "missing_client_receipt_ref_or_kind",
    transportPlan,
  });
  return {
    schema: HELIX_REALTIME_SESSION_CLIENT_RECEIPT_RESPONSE_SCHEMA,
    ok: Boolean(receipt),
    action: "record_client_receipt",
    error: receipt ? null : "realtime_session_disabled",
    blocked_reason: receipt ? null : "missing_client_receipt_ref_or_kind",
    realtime_session_id: input.realtimeSessionId ?? null,
    lane_id: "realtime_session",
    transport: "none",
    transport_plan: transportPlan,
    client_secret_requested: false,
    client_secret_issued: false,
    sdp_exchange_requested: false,
    server_sideband_requested: false,
    provider_session_ref: null,
    openai_network_call_attempted: false,
    ephemeral_credential_minted: false,
    webrtc_started: false,
    sideband_started: false,
    account_policy: input.accountPolicy,
    policy_gate: resolveRealtimeSessionPolicyGate({
      accountPolicy: input.accountPolicy,
      body: input.body,
    }),
    realtime_runtime_session_summary: {
      ...summary,
      live_session_admission_status: receipt ? "receipt_recorded" : "unavailable",
      latest_failure_code: receipt?.failure_code ?? receipt?.failure_reason ?? null,
      session_lifecycle: receipt
        ? ["record_client_receipt", receipt.receipt_kind]
        : summary.session_lifecycle,
      client_receipt_count: receipt ? 1 : 0,
      client_receipt_observation_count: receipt ? 1 : 0,
      client_receipt_state: receipt ? "received" : "failed",
      latest_client_receipt_ref: receipt?.client_receipt_ref ?? null,
      latest_client_receipt_kind: receipt?.receipt_kind ?? null,
      latest_client_receipt_status: receipt?.status ?? null,
      latest_lifecycle_event_ref: lifecycleEventRef,
      realtime_reentry_status: receipt
        ? "observation_packet_required_for_provider_reentry"
        : null,
    },
    realtime_runtime_session_events: receipt
      ? [
          {
            schema: "helix.realtime_session.lifecycle_event.v1",
            lifecycle_event_ref: lifecycleEventRef,
            action: "record_client_receipt",
            event_type: receipt.receipt_kind,
            receipt_ref: receipt.receipt_ref,
            realtime_session_id: receipt.realtime_session_id,
            observed_at_ms: receipt.observed_at_ms,
            client_receipt_ref: receipt.client_receipt_ref,
            reentry_status: "pending_solver_reentry",
            observation_reentered: false,
            context_role: "tool_evidence",
            reentry_required: true,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        ]
      : [],
    realtime_transcript_observations: [],
    realtime_tool_suggestion_observations: [],
    realtime_client_receipt_observations: receipt ? [receipt] : [],
    realtime_reentry_status: receipt
      ? "observation_packet_required_for_provider_reentry"
      : null,
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
