import crypto from "node:crypto";
import type {
  HelixCapabilityLaneGoalActivationPolicy,
  HelixCapabilityLaneGoalAttentionPolicy,
  HelixCapabilityLaneGoalBinding,
  HelixCapabilityLaneGoalBindingEvent,
  HelixCapabilityLaneGoalBindingResult,
  HelixCapabilityLaneGoalQuietBehavior,
  HelixCapabilityLaneGoalReportPolicy,
  HelixCapabilityLaneGoalStopCondition,
} from "@shared/helix-capability-lane-goal-binding";
import {
  HELIX_CAPABILITY_LANE_GOAL_BINDING_EVENT_SCHEMA,
  HELIX_CAPABILITY_LANE_GOAL_BINDING_SCHEMA,
} from "@shared/helix-capability-lane-goal-binding";
import type { HelixCapabilityLaneSessionStore } from "./session-manager";
import type { HelixCapabilityLaneSession } from "@shared/helix-capability-lane-session";
import type { HelixCapabilityLaneMailLoopDebugSummary } from "@shared/helix-capability-lane-mail-loop";

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const languageMatches = (candidate: string | null | undefined, expected: string | null | undefined): boolean => {
  const normalizedCandidate = readString(candidate).toLowerCase();
  const normalizedExpected = readString(expected).toLowerCase();
  if (!normalizedCandidate || !normalizedExpected) return true;
  return normalizedCandidate === normalizedExpected ||
    normalizedCandidate.startsWith(`${normalizedExpected}-`) ||
    normalizedExpected.startsWith(`${normalizedCandidate}-`);
};

const targetLanguageForSession = (session: HelixCapabilityLaneSession): string | null =>
  readString(session.source_binding.target_language) ||
  readString(session.source_binding.account_locale).split("-")[0] ||
  null;

const latestObservationEvent = (session: HelixCapabilityLaneSession) =>
  [...session.debug_history].reverse().find((event) => event.observation_ref) ?? null;

const bindingEvent = (input: {
  goalBindingId: string;
  goalId: string;
  session: HelixCapabilityLaneSession;
  event: HelixCapabilityLaneGoalBindingEvent["event"];
  reason: string;
  atMs: number;
  mailLoopRef?: string | null;
  receiptRef?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  terminalAuthorityStatus?: HelixCapabilityLaneGoalBindingEvent["terminal_authority_status"];
}): HelixCapabilityLaneGoalBindingEvent => {
  const observationEvent = latestObservationEvent(input.session);
  return {
    schema: HELIX_CAPABILITY_LANE_GOAL_BINDING_EVENT_SCHEMA,
    event_id: `${input.goalBindingId}:${input.event}:${input.atMs}`,
    goal_binding_id: input.goalBindingId,
    goal_id: input.goalId,
    lane_session_id: input.session.lane_session_id,
    lane_id: input.session.lane_id,
    event: input.event,
    at_ms: input.atMs,
    reason: input.reason,
    lane_session_status: input.session.status,
    lane_session_health: input.session.health,
    lane_session_observation_ref: input.session.last_observation_ref,
    source_id: input.session.source_binding.source_id,
    source_hash: input.session.source_binding.source_hash ?? null,
    source_kind: input.session.source_binding.source_kind,
    source_projection_target: input.session.source_binding.projection_target,
    account_locale: input.session.source_binding.account_locale,
    target_language: input.session.source_binding.target_language ?? observationEvent?.target_language ?? null,
    latest_chunk_id: observationEvent?.chunk_id ?? null,
    latest_chunk_index: observationEvent?.chunk_index ?? null,
    latest_source_id: observationEvent?.source_id ?? null,
    latest_source_hash: observationEvent?.source_hash ?? null,
    latest_source_kind: observationEvent?.source_kind ?? null,
    latest_target_language: observationEvent?.target_language ?? null,
    latest_dedupe_key: observationEvent?.dedupe_key ?? null,
    latest_source_event_id: observationEvent?.source_event_id ?? null,
    latest_source_event_ms: observationEvent?.source_event_ms ?? null,
    latest_observed_at_ms: observationEvent?.observed_at_ms ?? null,
    latest_freshness_status: observationEvent?.freshness_status ?? null,
    source_text_hash: readString(input.sourceTextHash) || null,
    source_text_char_count: typeof input.sourceTextCharCount === "number"
      ? input.sourceTextCharCount
      : null,
    latest_projection_target: observationEvent?.projection_target ?? null,
    latest_cancel_requested: observationEvent?.cancel_requested ?? null,
    mail_loop_ref: readString(input.mailLoopRef) || null,
    receipt_ref: readString(input.receiptRef) || null,
    terminal_authority_status: input.terminalAuthorityStatus ?? "not_terminal_authority",
    reentry_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const withSessionSnapshot = (
  binding: Omit<
    HelixCapabilityLaneGoalBinding,
    | "selected_runtime_agent_provider"
    | "selected_backend_provider"
    | "backend_selection_decision"
    | "cost_class"
    | "latency_class"
    | "privacy_class"
    | "fallback_backend_provider"
    | "lane_session_status"
    | "lane_session_health"
    | "lane_session_source_id"
    | "lane_session_source_hash"
    | "lane_session_source_text_hash"
    | "lane_session_source_text_char_count"
    | "lane_session_source_kind"
    | "lane_session_projection_target"
    | "lane_session_account_locale"
    | "lane_session_permissions"
    | "lane_session_last_observation_ref"
    | "lane_session_last_receipt_ref"
    | "latest_lane_session_event"
    | "lane_session_debug_history"
  >,
  session: HelixCapabilityLaneSession,
): HelixCapabilityLaneGoalBinding => ({
  ...binding,
  selected_runtime_agent_provider: session.selected_runtime_agent_provider,
  selected_backend_provider: session.selected_backend_provider,
  backend_selection_decision: session.backend_selection_decision,
  cost_class: session.cost_class,
  latency_class: session.latency_class,
  privacy_class: session.privacy_class,
  fallback_backend_provider: session.fallback_backend_provider,
  lane_session_status: session.status,
  lane_session_health: session.health,
  lane_session_source_id: session.source_binding.source_id,
  lane_session_source_hash: session.source_binding.source_hash ?? null,
  lane_session_source_text_hash: session.source_binding.source_text_hash ?? null,
  lane_session_source_text_char_count: session.source_binding.source_text_char_count ?? null,
  lane_session_source_kind: session.source_binding.source_kind,
  lane_session_projection_target: session.source_binding.projection_target,
  lane_session_account_locale: session.source_binding.account_locale,
  lane_session_permissions: session.permissions,
  lane_session_last_observation_ref: session.last_observation_ref,
  lane_session_last_receipt_ref: session.last_receipt_ref,
  latest_lane_session_event: session.debug_history.at(-1) ?? null,
  lane_session_debug_history: session.debug_history,
});

const blocked = (blockedReason: string): HelixCapabilityLaneGoalBindingResult => ({
  ok: false,
  goal_binding: null,
  blocked_reason: blockedReason,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export type HelixCapabilityLaneGoalBindingStore = ReturnType<typeof createHelixCapabilityLaneGoalBindingStore>;

export const createHelixCapabilityLaneGoalBindingStore = (input: {
  sessionStore: HelixCapabilityLaneSessionStore;
}) => {
  const bindings = new Map<string, HelixCapabilityLaneGoalBinding>();

  const bind = (args: {
    goalId: string;
    laneSessionId: string;
    activationPolicy?: HelixCapabilityLaneGoalActivationPolicy;
    attentionPolicy?: HelixCapabilityLaneGoalAttentionPolicy;
    stopCondition?: HelixCapabilityLaneGoalStopCondition;
    reportPolicy?: HelixCapabilityLaneGoalReportPolicy;
    quietBehavior?: HelixCapabilityLaneGoalQuietBehavior;
    goalBindingId?: string | null;
    nowMs?: number;
  }): HelixCapabilityLaneGoalBindingResult => {
    const goalId = readString(args.goalId);
    if (!goalId) return blocked("missing_goal_id");
    const session = input.sessionStore.get(args.laneSessionId);
    if (!session) return blocked("unknown_lane_session");
    if (session.status === "stopped") return blocked("lane_session_stopped");

    const nowMs = args.nowMs ?? Date.now();
    const goalBindingId =
      readString(args.goalBindingId) ||
      `capability_lane_goal_binding:${crypto.randomUUID()}`;
    const event = bindingEvent({
      goalBindingId,
      goalId,
      session,
      event: "bound",
      reason: "goal_bound_to_lane_session",
      atMs: nowMs,
    });
    const binding = withSessionSnapshot({
      schema: HELIX_CAPABILITY_LANE_GOAL_BINDING_SCHEMA,
      goal_binding_id: goalBindingId,
      goal_id: goalId,
      lane_session_id: session.lane_session_id,
      lane_id: session.lane_id,
      activation_policy: args.activationPolicy ?? "while_goal_active",
      attention_policy: args.attentionPolicy ?? "quiet_until_salient",
      stop_condition: args.stopCondition ?? "manual_stop",
      report_policy: args.reportPolicy ?? "terminal_authorized_summary",
      quiet_behavior: args.quietBehavior ?? "record_only",
      status: "bound",
      last_report_ref: null,
      latest_mail_loop_summary: null,
      lane_session_mail_loop_refs: [],
      debug_history: [event],
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    }, session);
    bindings.set(goalBindingId, binding);
    return {
      ok: true,
      goal_binding: binding,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const updateAttention = (args: {
    goalBindingId: string;
    attentionPolicy: HelixCapabilityLaneGoalAttentionPolicy;
    quietBehavior: HelixCapabilityLaneGoalQuietBehavior;
    nowMs?: number;
    reason?: string | null;
  }): HelixCapabilityLaneGoalBindingResult => {
    const binding = bindings.get(args.goalBindingId);
    if (!binding) return blocked("unknown_goal_binding");
    if (binding.status === "stopped") return blocked("goal_binding_stopped");
    const session = input.sessionStore.get(binding.lane_session_id);
    if (!session) return blocked("unknown_lane_session");
    if (session.status === "stopped") return blocked("lane_session_stopped");
    const nowMs = args.nowMs ?? Date.now();
    const event = bindingEvent({
      goalBindingId: args.goalBindingId,
      goalId: binding.goal_id,
      session,
      event: "attention_updated",
      reason: readString(args.reason) || "goal_binding_attention_updated",
      atMs: nowMs,
    });
    const updated = withSessionSnapshot({
      ...binding,
      attention_policy: args.attentionPolicy,
      quiet_behavior: args.quietBehavior,
      debug_history: [...binding.debug_history, event],
    }, session);
    bindings.set(args.goalBindingId, updated);
    return {
      ok: true,
      goal_binding: updated,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const recordReportRequest = (args: {
    goalBindingId: string;
    reportRef: string;
    nowMs?: number;
    terminalAuthorized: boolean;
  }): HelixCapabilityLaneGoalBindingResult => {
    const binding = bindings.get(args.goalBindingId);
    if (!binding) return blocked("unknown_goal_binding");
    if (binding.status === "stopped") return blocked("goal_binding_stopped");
    if (!args.terminalAuthorized) return blocked("terminal_authority_required_for_goal_lane_report");
    const reportRef = readString(args.reportRef);
    if (!reportRef) return blocked("missing_report_ref");
    const session = input.sessionStore.get(binding.lane_session_id);
    if (!session) return blocked("unknown_lane_session");
    if (session.status === "stopped") return blocked("lane_session_stopped");
    const nowMs = args.nowMs ?? Date.now();
    const event = bindingEvent({
      goalBindingId: args.goalBindingId,
      goalId: binding.goal_id,
      session,
      event: "report_requested",
      reason: "terminal_authorized_goal_lane_report_recorded",
      atMs: nowMs,
      receiptRef: binding.latest_mail_loop_summary?.receipt_ref ?? null,
      sourceTextHash: binding.latest_mail_loop_summary?.source_text_hash ?? null,
      sourceTextCharCount: binding.latest_mail_loop_summary?.source_text_char_count ?? null,
      terminalAuthorityStatus: "pending_helix_terminal_authority",
    });
    const updated = withSessionSnapshot({
      ...binding,
      last_report_ref: reportRef,
      debug_history: [...binding.debug_history, event],
    }, session);
    bindings.set(args.goalBindingId, updated);
    return {
      ok: true,
      goal_binding: updated,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const recordMailLoopEvidence = (args: {
    goalBindingId: string;
    mailLoopSummary: HelixCapabilityLaneMailLoopDebugSummary;
    nowMs?: number;
  }): HelixCapabilityLaneGoalBindingResult => {
    const binding = bindings.get(args.goalBindingId);
    if (!binding) return blocked("unknown_goal_binding");
    if (binding.status === "stopped") return blocked("goal_binding_stopped");
    const session = input.sessionStore.get(binding.lane_session_id);
    if (!session) return blocked("unknown_lane_session");
    if (session.status === "stopped") return blocked("lane_session_stopped");
    if (args.mailLoopSummary.lane_session_id !== session.lane_session_id) {
      return blocked("lane_session_mismatch");
    }
    if (args.mailLoopSummary.lane_id !== session.lane_id) {
      return blocked("capability_lane_mismatch");
    }
    if (
      args.mailLoopSummary.source_id &&
      session.source_binding.source_id &&
      args.mailLoopSummary.source_id !== session.source_binding.source_id
    ) {
      return blocked("source_id_mismatch");
    }
    if (
      args.mailLoopSummary.source_hash &&
      session.source_binding.source_hash &&
      args.mailLoopSummary.source_hash !== session.source_binding.source_hash
    ) {
      return blocked("source_hash_mismatch");
    }
    if (
      args.mailLoopSummary.source_text_hash &&
      session.source_binding.source_text_hash &&
      args.mailLoopSummary.source_text_hash !== session.source_binding.source_text_hash
    ) {
      return blocked("source_text_hash_mismatch");
    }
    if (
      typeof args.mailLoopSummary.source_text_char_count === "number" &&
      typeof session.source_binding.source_text_char_count === "number" &&
      args.mailLoopSummary.source_text_char_count !== session.source_binding.source_text_char_count
    ) {
      return blocked("source_text_char_count_mismatch");
    }
    if (
      args.mailLoopSummary.projection_target &&
      session.source_binding.projection_target &&
      args.mailLoopSummary.projection_target !== session.source_binding.projection_target
    ) {
      return blocked("projection_target_mismatch");
    }
    if (!languageMatches(args.mailLoopSummary.target_language, targetLanguageForSession(session))) {
      return blocked("target_language_mismatch");
    }
    const mailLoopRef =
      readString(args.mailLoopSummary.stage_play_mail_id) ||
      readString(args.mailLoopSummary.observation_ref);
    if (!mailLoopRef) return blocked("missing_mail_loop_ref");

    const nowMs = args.nowMs ?? Date.now();
    const event = bindingEvent({
      goalBindingId: args.goalBindingId,
      goalId: binding.goal_id,
      session,
      event: "mail_loop_recorded",
      reason: "goal_lane_mail_loop_evidence_recorded",
      atMs: nowMs,
      mailLoopRef,
      receiptRef: args.mailLoopSummary.receipt_ref,
      sourceTextHash: args.mailLoopSummary.source_text_hash,
      sourceTextCharCount: args.mailLoopSummary.source_text_char_count,
      terminalAuthorityStatus: args.mailLoopSummary.terminal_authority_status,
    });
    const updated = withSessionSnapshot({
      ...binding,
      latest_mail_loop_summary: args.mailLoopSummary,
      lane_session_mail_loop_refs: Array.from(new Set([
        ...binding.lane_session_mail_loop_refs,
        mailLoopRef,
      ])),
      debug_history: [...binding.debug_history, event],
    }, session);
    bindings.set(args.goalBindingId, updated);
    return {
      ok: true,
      goal_binding: updated,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const stop = (args: {
    goalBindingId: string;
    nowMs?: number;
    reason?: string | null;
  }): HelixCapabilityLaneGoalBindingResult => {
    const binding = bindings.get(args.goalBindingId);
    if (!binding) return blocked("unknown_goal_binding");
    const session = input.sessionStore.get(binding.lane_session_id);
    if (!session) return blocked("unknown_lane_session");
    const nowMs = args.nowMs ?? Date.now();
    const event = bindingEvent({
      goalBindingId: args.goalBindingId,
      goalId: binding.goal_id,
      session,
      event: "stopped",
      reason: readString(args.reason) || "goal_binding_stopped",
      atMs: nowMs,
    });
    const updated = withSessionSnapshot({
      ...binding,
      status: "stopped",
      debug_history: [...binding.debug_history, event],
    }, session);
    bindings.set(args.goalBindingId, updated);
    return {
      ok: true,
      goal_binding: updated,
      blocked_reason: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  return {
    bind,
    updateAttention,
    recordMailLoopEvidence,
    recordReportRequest,
    stop,
    get: (goalBindingId: string) => bindings.get(goalBindingId) ?? null,
    list: () => Array.from(bindings.values()),
    clear: () => bindings.clear(),
  };
};
