import type {
  HelixCapabilityLaneSession,
  HelixCapabilityLaneSessionDebugSummary,
} from "@shared/helix-capability-lane-session";
import { HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA } from "@shared/helix-capability-lane-session";

const readTerminalAuthorityStatus = (
  session: HelixCapabilityLaneSession,
): HelixCapabilityLaneSessionDebugSummary["terminal_authority_status"] =>
  session.debug_history.at(-1)?.terminal_authority_status ?? "not_terminal_authority";

export const buildHelixCapabilityLaneSessionDebugSummary = (
  session: HelixCapabilityLaneSession,
): HelixCapabilityLaneSessionDebugSummary => {
  const latestEvent = session.debug_history.at(-1) ?? null;
  const latestObservationEvent =
    [...session.debug_history].reverse().find((event) => event.observation_ref) ?? null;
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
    session_status: session.status,
    session_health: session.health,
    source_id: session.source_binding.source_id || null,
    source_kind: session.source_binding.source_kind,
    projection_target: session.source_binding.projection_target,
    account_locale: session.source_binding.account_locale,
    created_at_ms: session.created_at_ms,
    updated_at_ms: session.updated_at_ms,
    last_observation_ref: session.last_observation_ref,
    last_receipt_ref: session.last_receipt_ref,
    latest_chunk_id: latestObservationEvent?.chunk_id ?? null,
    latest_chunk_index: latestObservationEvent?.chunk_index ?? null,
    latest_dedupe_key: latestObservationEvent?.dedupe_key ?? null,
    latest_source_event_id: latestObservationEvent?.source_event_id ?? null,
    latest_source_event_ms: latestObservationEvent?.source_event_ms ?? null,
    latest_observed_at_ms: latestObservationEvent?.observed_at_ms ?? null,
    latest_freshness_status: latestObservationEvent?.freshness_status ?? null,
    latest_projection_target: latestObservationEvent?.projection_target ?? session.source_binding.projection_target,
    latest_cancel_requested: latestObservationEvent?.cancel_requested ?? null,
    latest_session_event: latestEvent,
    session_event_count: session.debug_history.length,
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
