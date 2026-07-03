import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneCostClass,
  HelixCapabilityLaneId,
  HelixCapabilityLaneLatencyClass,
  HelixCapabilityLanePrivacyClass,
} from "@shared/helix-capability-lane";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";
import {
  HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA,
} from "@shared/helix-capability-lane-mail-loop";
import type {
  HelixCapabilityLaneGoalActivationPolicy,
  HelixCapabilityLaneGoalAttentionPolicy,
  HelixCapabilityLaneGoalBindingDebugSummary,
  HelixCapabilityLaneGoalBindingResult,
  HelixCapabilityLaneGoalQuietBehavior,
  HelixCapabilityLaneGoalReportPolicy,
  HelixCapabilityLaneGoalStopCondition,
} from "@shared/helix-capability-lane-goal-binding";
import {
  buildHelixCapabilityLaneGoalBindingDebugSummaries,
} from "./goal-binding-summary";
import {
  createHelixCapabilityLaneGoalBindingStore,
  type HelixCapabilityLaneGoalBindingStore,
} from "./goal-binding";
import {
  helixCapabilityLaneSessionStore,
  type HelixCapabilityLaneSessionStore,
} from "./session-manager";

type RecordLike = Record<string, unknown>;

export type HelixCapabilityLaneGoalBindingRunnerResult = {
  schema: "helix.capability_lane.goal_binding_runner_result.v1";
  requested: boolean;
  goal_binding_results: HelixCapabilityLaneGoalBindingResult[];
  goal_binding_debug_summaries: HelixCapabilityLaneGoalBindingDebugSummary[];
  debug_projection: {
    capability_lane_goal_binding_results: HelixCapabilityLaneGoalBindingResult[];
    capability_lane_goal_binding_debug_summaries: HelixCapabilityLaneGoalBindingDebugSummary[];
  };
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCapabilityLaneGoalBindingCallAction =
  | "bind"
  | "update_attention"
  | "record_mail_loop"
  | "record_report"
  | "stop";

export const helixCapabilityLaneGoalBindingStore =
  createHelixCapabilityLaneGoalBindingStore({
    sessionStore: helixCapabilityLaneSessionStore,
  });

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry) => entry.length > 0)
    : [];

const readAction = (value: unknown): HelixCapabilityLaneGoalBindingCallAction | null => {
  const text = readString(value).toLowerCase();
  return text === "bind" ||
    text === "update_attention" ||
    text === "record_mail_loop" ||
    text === "record_report" ||
    text === "stop"
    ? text
    : null;
};

const readBackendSelectionOutcome = (
  value: unknown,
): HelixCapabilityLaneBackendSelectionDecision["outcome"] | null => {
  const text = readString(value);
  return text === "blocked" ||
    text === "default_selected" ||
    text === "requested_selected" ||
    text === "fallback_selected" ||
    text === "requested_recorded_default_selected"
    ? text
    : null;
};

const readBackendSelectionDecision = (
  value: unknown,
): HelixCapabilityLaneBackendSelectionDecision | null => {
  const record = readRecord(value);
  if (!record) return null;
  const outcome = readBackendSelectionOutcome(record.outcome);
  if (!outcome) return null;
  const selectedBackendProvider = readString(record.selected_backend_provider ?? record.selectedBackendProvider) || null;
  const requestedBackendProvider = readString(record.requested_backend_provider ?? record.requestedBackendProvider) || null;
  const fallbackBackendProvider = readString(record.fallback_backend_provider ?? record.fallbackBackendProvider) || null;
  const stagePlayWakeExpected =
    readBoolean(record.stage_play_wake_expected ?? record.stagePlayWakeExpected) ?? false;
  const stagePlayWakeKind = readString(record.stage_play_wake_kind ?? record.stagePlayWakeKind);
  return {
    schema: "helix.capability_lane.backend_selection_decision.v1",
    owner: "helix",
    outcome,
    reason: readString(record.reason) || "mail_loop_backend_selection_recorded",
    requested_backend_provider: requestedBackendProvider,
    requested_backend_provider_known:
      readBoolean(record.requested_backend_provider_known ?? record.requestedBackendProviderKnown) ??
      Boolean(requestedBackendProvider),
    selected_backend_provider: selectedBackendProvider,
    fallback_backend_provider: fallbackBackendProvider,
    selected_runtime_provider_remains_root: true,
    backend_provider_becomes_root_agent: false,
    dynamic_switching_executed: false,
    live_backend_execution_enabled: readBoolean(record.live_backend_execution_enabled ?? record.liveBackendExecutionEnabled) ?? false,
    terminal_authority_owner: "helix",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const readCostClass = (value: unknown): HelixCapabilityLaneCostClass | "unknown" | null => {
  const text = readString(value);
  return text === "free_local" ||
    text === "low" ||
    text === "standard" ||
    text === "premium" ||
    text === "unknown"
    ? text
    : null;
};

const readLatencyClass = (value: unknown): HelixCapabilityLaneLatencyClass | "unknown" | null => {
  const text = readString(value);
  return text === "local" ||
    text === "interactive" ||
    text === "realtime" ||
    text === "batch" ||
    text === "unknown"
    ? text
    : null;
};

const readPrivacyClass = (value: unknown): HelixCapabilityLanePrivacyClass | "unknown" | null => {
  const text = readString(value);
  return text === "local_only" ||
    text === "account_provider" ||
    text === "external_provider" ||
    text === "unknown"
    ? text
    : null;
};

const readTerminalAuthorityStatus = (
  value: unknown,
): HelixCapabilityLaneMailLoopDebugSummary["terminal_authority_status"] => {
  const text = readString(value);
  return text === "pending_helix_terminal_authority"
    ? "pending_helix_terminal_authority"
    : "not_terminal_authority";
};

const readMailLoopDebugSummary = (value: unknown): HelixCapabilityLaneMailLoopDebugSummary | null => {
  const record = readRecord(value);
  if (!record) return null;
  const backendSelectionDecision = readBackendSelectionDecision(
    record.backend_selection_decision ?? record.backendSelectionDecision,
  );
  const laneSessionId = readString(record.lane_session_id ?? record.laneSessionId);
  const laneId = readString(record.lane_id ?? record.laneId);
  const capability = readString(record.capability);
  const mailboxThreadId = readString(record.mailbox_thread_id ?? record.mailboxThreadId);
  if (!laneSessionId || !laneId || !capability || !mailboxThreadId || !backendSelectionDecision) {
    return null;
  }
  const stagePlayWakeExpected =
    readBoolean(record.stage_play_wake_expected ?? record.stagePlayWakeExpected) ?? false;
  const stagePlayWakeKind = readString(record.stage_play_wake_kind ?? record.stagePlayWakeKind);
  return {
    schema: HELIX_CAPABILITY_LANE_MAIL_LOOP_DEBUG_SUMMARY_SCHEMA,
    lane_session_id: laneSessionId,
    lane_id: laneId as HelixCapabilityLaneId,
    capability,
    observation_ref: readString(record.observation_ref ?? record.observationRef) || null,
    receipt_ref: readString(record.receipt_ref ?? record.receiptRef) || null,
    stage_play_mail_id: readString(record.stage_play_mail_id ?? record.stagePlayMailId) || null,
    stage_play_wake_expected: stagePlayWakeExpected,
    stage_play_wake_kind:
      stagePlayWakeKind === "mailbox_wake" || stagePlayWakeKind === "none"
        ? stagePlayWakeKind
        : stagePlayWakeExpected
          ? "mailbox_wake"
          : "none",
    mailbox_thread_id: mailboxThreadId,
    source_id: readString(record.source_id ?? record.sourceId) || null,
    source_hash: readString(record.source_hash ?? record.sourceHash) || null,
    source_text_hash: readString(record.source_text_hash ?? record.sourceTextHash) || null,
    source_text_char_count: readNumber(record.source_text_char_count ?? record.sourceTextCharCount),
    source_kind: readString(record.source_kind ?? record.sourceKind) || null,
    lane_session_source_text_hash:
      readString(record.lane_session_source_text_hash ?? record.laneSessionSourceTextHash) || null,
    lane_session_source_text_char_count:
      readNumber(record.lane_session_source_text_char_count ?? record.laneSessionSourceTextCharCount),
    chunk_id: readString(record.chunk_id ?? record.chunkId) || null,
    chunk_index: readNumber(record.chunk_index ?? record.chunkIndex),
    dedupe_key: readString(record.dedupe_key ?? record.dedupeKey) || null,
    source_event_id: readString(record.source_event_id ?? record.sourceEventId) || null,
    source_event_ms: readNumber(record.source_event_ms ?? record.sourceEventMs),
    observed_at_ms: readNumber(record.observed_at_ms ?? record.observedAtMs),
    projection_target: readString(record.projection_target ?? record.projectionTarget) || null,
    target_language: readString(record.target_language ?? record.targetLanguage) || null,
    cancel_requested: readBoolean(record.cancel_requested ?? record.cancelRequested) ?? false,
    selected_backend_provider: readString(record.selected_backend_provider ?? record.selectedBackendProvider) || null,
    requested_backend_provider: readString(record.requested_backend_provider ?? record.requestedBackendProvider) || null,
    backend_selection_decision: backendSelectionDecision,
    cost_class: readCostClass(record.cost_class ?? record.costClass),
    latency_class: readLatencyClass(record.latency_class ?? record.latencyClass),
    privacy_class: readPrivacyClass(record.privacy_class ?? record.privacyClass),
    fallback_backend_provider: readString(record.fallback_backend_provider ?? record.fallbackBackendProvider) || null,
    freshness_status: readString(record.freshness_status ?? record.freshnessStatus) || null,
    blocked_reason: readString(record.blocked_reason ?? record.blockedReason) || null,
    mail_status: readString(record.mail_status ?? record.mailStatus) || null,
    evidence_refs: readStringArray(record.evidence_refs ?? record.evidenceRefs),
    reentry_required: true,
    terminal_authority_status: readTerminalAuthorityStatus(
      record.terminal_authority_status ?? record.terminalAuthorityStatus,
    ),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const readActivationPolicy = (value: unknown): HelixCapabilityLaneGoalActivationPolicy | undefined => {
  const text = readString(value);
  return text === "manual" || text === "while_goal_active" || text === "on_source_event"
    ? text
    : undefined;
};

const readAttentionPolicy = (value: unknown): HelixCapabilityLaneGoalAttentionPolicy | undefined => {
  const text = readString(value);
  return text === "quiet_until_salient" || text === "report_each_observation" || text === "manual_review"
    ? text
    : undefined;
};

const readStopCondition = (value: unknown): HelixCapabilityLaneGoalStopCondition | undefined => {
  const text = readString(value);
  return text === "manual_stop" || text === "goal_complete" || text === "source_stopped" || text === "session_stopped"
    ? text
    : undefined;
};

const readReportPolicy = (value: unknown): HelixCapabilityLaneGoalReportPolicy | undefined => {
  const text = readString(value);
  return text === "debug_only" || text === "terminal_authorized_summary" || text === "ask_on_salience"
    ? text
    : undefined;
};

const readQuietBehavior = (value: unknown): HelixCapabilityLaneGoalQuietBehavior | undefined => {
  const text = readString(value);
  return text === "record_only" || text === "surface_badge" || text === "wake_on_salience"
    ? text
    : undefined;
};

const readStructuredGoalBindingCalls = (body: RecordLike) => {
  const candidate =
    body.capability_lane_goal_binding_call ??
    body.capabilityLaneGoalBindingCall ??
    body.lane_goal_binding_call ??
    body.laneGoalBindingCall;
  const rawCalls = Array.isArray(candidate) ? candidate : [candidate];
  return rawCalls
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      action: readAction(entry.action) ?? "bind",
      goal_binding_id: readString(entry.goal_binding_id ?? entry.goalBindingId) || null,
      goal_id: readString(entry.goal_id ?? entry.goalId) || null,
      lane_session_id: readString(entry.lane_session_id ?? entry.laneSessionId) || null,
      activation_policy: readActivationPolicy(entry.activation_policy ?? entry.activationPolicy),
      attention_policy: readAttentionPolicy(entry.attention_policy ?? entry.attentionPolicy),
      stop_condition: readStopCondition(entry.stop_condition ?? entry.stopCondition),
      report_policy: readReportPolicy(entry.report_policy ?? entry.reportPolicy),
      quiet_behavior: readQuietBehavior(entry.quiet_behavior ?? entry.quietBehavior),
      report_ref: readString(entry.report_ref ?? entry.reportRef) || null,
      mail_loop_summary: readMailLoopDebugSummary(entry.mail_loop_summary ?? entry.mailLoopSummary),
      terminal_authorized: readBoolean(entry.terminal_authorized ?? entry.terminalAuthorized),
      reason: readString(entry.reason) || null,
      now_ms: readNumber(entry.now_ms ?? entry.nowMs),
    }));
};

const blocked = (blockedReason: string): HelixCapabilityLaneGoalBindingResult => ({
  ok: false,
  goal_binding: null,
  blocked_reason: blockedReason,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const runHelixCapabilityLaneGoalBindingRequests = (input: {
  body: Record<string, unknown>;
  store?: HelixCapabilityLaneGoalBindingStore;
  sessionStore?: HelixCapabilityLaneSessionStore;
}): HelixCapabilityLaneGoalBindingRunnerResult => {
  const store = input.store ??
    (input.sessionStore
      ? createHelixCapabilityLaneGoalBindingStore({ sessionStore: input.sessionStore })
      : helixCapabilityLaneGoalBindingStore);
  const calls = readStructuredGoalBindingCalls(input.body);
  const results: HelixCapabilityLaneGoalBindingResult[] = [];

  for (const call of calls) {
    if (call.action === "bind") {
      if (!call.goal_id) {
        results.push(blocked("missing_goal_id"));
        continue;
      }
      if (!call.lane_session_id) {
        results.push(blocked("missing_lane_session_id"));
        continue;
      }
      results.push(store.bind({
        goalId: call.goal_id,
        laneSessionId: call.lane_session_id,
        goalBindingId: call.goal_binding_id,
        activationPolicy: call.activation_policy,
        attentionPolicy: call.attention_policy,
        stopCondition: call.stop_condition,
        reportPolicy: call.report_policy,
        quietBehavior: call.quiet_behavior,
        nowMs: call.now_ms ?? undefined,
      }));
      continue;
    }

    if (!call.goal_binding_id) {
      results.push(blocked("missing_goal_binding_id"));
      continue;
    }
    if (call.action === "update_attention") {
      if (!call.attention_policy || !call.quiet_behavior) {
        results.push(blocked("missing_attention_policy"));
        continue;
      }
      results.push(store.updateAttention({
        goalBindingId: call.goal_binding_id,
        attentionPolicy: call.attention_policy,
        quietBehavior: call.quiet_behavior,
        reason: call.reason,
        nowMs: call.now_ms ?? undefined,
      }));
    } else if (call.action === "record_report") {
      if (!call.report_ref) {
        results.push(blocked("missing_report_ref"));
        continue;
      }
      results.push(store.recordReportRequest({
        goalBindingId: call.goal_binding_id,
        reportRef: call.report_ref,
        terminalAuthorized: call.terminal_authorized === true,
        nowMs: call.now_ms ?? undefined,
      }));
    } else if (call.action === "record_mail_loop") {
      if (!call.mail_loop_summary) {
        results.push(blocked("missing_mail_loop_summary"));
        continue;
      }
      results.push(store.recordMailLoopEvidence({
        goalBindingId: call.goal_binding_id,
        mailLoopSummary: call.mail_loop_summary,
        nowMs: call.now_ms ?? undefined,
      }));
    } else {
      results.push(store.stop({
        goalBindingId: call.goal_binding_id,
        reason: call.reason,
        nowMs: call.now_ms ?? undefined,
      }));
    }
  }

  const goalBindings = results
    .map((result) => result.goal_binding)
    .filter((binding): binding is NonNullable<typeof binding> => Boolean(binding));
  const goalBindingDebugSummaries = buildHelixCapabilityLaneGoalBindingDebugSummaries(goalBindings);

  return {
    schema: "helix.capability_lane.goal_binding_runner_result.v1",
    requested: calls.length > 0,
    goal_binding_results: results,
    goal_binding_debug_summaries: goalBindingDebugSummaries,
    debug_projection: {
      capability_lane_goal_binding_results: results,
      capability_lane_goal_binding_debug_summaries: goalBindingDebugSummaries,
    },
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
