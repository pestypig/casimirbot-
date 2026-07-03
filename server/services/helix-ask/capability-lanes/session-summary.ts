import type {
  HelixCapabilityLaneSession,
  HelixCapabilityLaneSessionDebugSummary,
} from "@shared/helix-capability-lane-session";
import { HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA } from "@shared/helix-capability-lane-session";

const readTerminalAuthorityStatus = (
  session: HelixCapabilityLaneSession,
): HelixCapabilityLaneSessionDebugSummary["terminal_authority_status"] => {
  const latestObservationEvent =
    [...session.debug_history].reverse().find((event) => event.observation_ref) ?? null;
  return (
    latestObservationEvent?.terminal_authority_status ??
    session.debug_history.at(-1)?.terminal_authority_status ??
    "not_terminal_authority"
  );
};

const permissionProfileFor = (
  session: HelixCapabilityLaneSession,
): HelixCapabilityLaneSessionDebugSummary["permission_profile"] => {
  const permissions = session.permissions;
  if (!permissions.write && !permissions.shell && !permissions.code_mutation) {
    return "permissions non-mutating";
  }
  const allowed = [
    permissions.write ? "write" : "",
    permissions.shell ? "shell" : "",
    permissions.code_mutation ? "code mutation" : "",
  ].filter(Boolean);
  return allowed.length ? `permissions ${allowed.join(", ")}` : "permissions unknown";
};

const compactKey = (parts: Array<string | null | undefined>): string =>
  parts
    .map((part) => typeof part === "string" ? part.trim() : "")
    .filter(Boolean)
    .join("::");

const sourceBindingKeyFor = (session: HelixCapabilityLaneSession): string =>
  compactKey([
    session.source_binding.source_id,
    session.source_binding.source_hash,
    session.source_binding.projection_target,
    session.source_binding.account_locale,
    session.source_binding.target_language,
  ]);

const sessionControlKeyFor = (session: HelixCapabilityLaneSession): string =>
  compactKey([
    session.lane_session_id,
    sourceBindingKeyFor(session),
  ]);

const latestObservationKeyFor = (
  latestObservationEvent: HelixCapabilityLaneSession["debug_history"][number] | null,
): string | null => {
  if (!latestObservationEvent) return null;
  const key = compactKey([
    latestObservationEvent.source_id,
    latestObservationEvent.source_hash,
    latestObservationEvent.projection_target,
    latestObservationEvent.target_language,
    latestObservationEvent.chunk_id,
    latestObservationEvent.receipt_ref ?? latestObservationEvent.observation_ref,
  ]);
  return key || null;
};

export const buildHelixCapabilityLaneSessionDebugSummary = (
  session: HelixCapabilityLaneSession,
): HelixCapabilityLaneSessionDebugSummary => {
  const latestEvent = session.debug_history.at(-1) ?? null;
  const latestObservationEvent =
    [...session.debug_history].reverse().find((event) => event.observation_ref) ?? null;
  const lifecycleAction = latestEvent?.action ?? null;
  return {
    schema: HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA,
    lane_session_id: session.lane_session_id,
    lane_id: session.lane_id,
    selected_runtime_agent_provider: session.selected_runtime_agent_provider,
    selected_backend_provider: session.selected_backend_provider,
    backend_selection_decision: session.backend_selection_decision,
    cost_class: session.cost_class,
    latency_class: session.latency_class,
    privacy_class: session.privacy_class,
    fallback_backend_provider: session.fallback_backend_provider,
    lifecycle_action: lifecycleAction,
    session_lifecycle_action: lifecycleAction,
    session_action: lifecycleAction,
    session_status: session.status,
    session_health: session.health,
    source_id: session.source_binding.source_id || null,
    source_hash: session.source_binding.source_hash ?? null,
    source_kind: session.source_binding.source_kind,
    projection_target: session.source_binding.projection_target,
    account_locale: session.source_binding.account_locale,
    target_language: session.source_binding.target_language ?? null,
    session_control_key: sessionControlKeyFor(session),
    source_binding_key: sourceBindingKeyFor(session),
    permissions: session.permissions,
    permission_profile: permissionProfileFor(session),
    created_at_ms: session.created_at_ms,
    updated_at_ms: session.updated_at_ms,
    last_observation_ref: session.last_observation_ref,
    last_receipt_ref: session.last_receipt_ref,
    latest_chunk_id: latestObservationEvent?.chunk_id ?? null,
    latest_chunk_index: latestObservationEvent?.chunk_index ?? null,
    latest_source_id: latestObservationEvent?.source_id ?? null,
    latest_source_hash: latestObservationEvent?.source_hash ?? null,
    latest_source_kind: latestObservationEvent?.source_kind ?? null,
    latest_account_locale: latestObservationEvent?.account_locale ?? session.source_binding.account_locale,
    latest_target_language: latestObservationEvent?.target_language ?? null,
    latest_dedupe_key: latestObservationEvent?.dedupe_key ?? null,
    latest_source_event_id: latestObservationEvent?.source_event_id ?? null,
    latest_source_event_ms: latestObservationEvent?.source_event_ms ?? null,
    latest_observed_at_ms: latestObservationEvent?.observed_at_ms ?? null,
    latest_freshness_status: latestObservationEvent?.freshness_status ?? null,
    source_text_hash: latestObservationEvent?.source_text_hash ?? session.source_binding.source_text_hash ?? null,
    source_text_char_count:
      latestObservationEvent?.source_text_char_count ?? session.source_binding.source_text_char_count ?? null,
    latest_projection_target: latestObservationEvent?.projection_target ?? session.source_binding.projection_target,
    latest_cancel_requested: latestObservationEvent?.cancel_requested ?? null,
    latest_session_event: latestEvent,
    latest_event_id: latestEvent?.event_id ?? null,
    latest_observation_key: latestObservationKeyFor(latestObservationEvent),
    session_event_count: session.debug_history.length,
    has_observation: Boolean(latestObservationEvent),
    terminal_authority_status: readTerminalAuthorityStatus(session),
    reentry_required: true,
    backend_provider_becomes_root_agent: false,
    final_reports_require_terminal_authority: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildHelixCapabilityLaneSessionDebugSummaries = (
  sessions: HelixCapabilityLaneSession[],
): HelixCapabilityLaneSessionDebugSummary[] =>
  sessions.map(buildHelixCapabilityLaneSessionDebugSummary);
