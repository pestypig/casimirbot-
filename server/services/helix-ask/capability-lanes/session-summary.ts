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
): HelixCapabilityLaneSessionDebugSummary => ({
  schema: HELIX_CAPABILITY_LANE_SESSION_DEBUG_SUMMARY_SCHEMA,
  lane_session_id: session.lane_session_id,
  lane_id: session.lane_id,
  selected_runtime_agent_provider: session.selected_runtime_agent_provider,
  selected_backend_provider: session.selected_backend_provider,
  backend_selection_decision: session.backend_selection_decision,
  session_status: session.status,
  session_health: session.health,
  source_id: session.source_binding.source_id || null,
  source_kind: session.source_binding.source_kind,
  projection_target: session.source_binding.projection_target,
  account_locale: session.source_binding.account_locale,
  created_at_ms: session.created_at_ms,
  updated_at_ms: session.updated_at_ms,
  last_observation_ref: session.last_observation_ref,
  latest_session_event: session.debug_history.at(-1) ?? null,
  session_event_count: session.debug_history.length,
  terminal_authority_status: readTerminalAuthorityStatus(session),
  reentry_required: true,
  backend_provider_becomes_root_agent: false,
  final_reports_require_terminal_authority: true,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const buildHelixCapabilityLaneSessionDebugSummaries = (
  sessions: HelixCapabilityLaneSession[],
): HelixCapabilityLaneSessionDebugSummary[] =>
  sessions.map(buildHelixCapabilityLaneSessionDebugSummary);
