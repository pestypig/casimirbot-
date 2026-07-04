import type { HelixCapabilityLaneSessionDebugSummary } from "@shared/helix-capability-lane-session";
import type { HelixCapabilityLaneProviderTimelineEvent } from "./provider-adapter-context";

export const buildHelixCapabilityLaneSessionListTimeline = (
  summaries: HelixCapabilityLaneSessionDebugSummary[],
): HelixCapabilityLaneProviderTimelineEvent[] =>
  summaries.map((summary, index) => {
    const laneExecuted = Boolean(
      summary.has_observation ||
      summary.last_observation_ref ||
      summary.latest_receipt_ref ||
      summary.last_receipt_ref ||
      summary.latest_observation_key,
    );
    return {
      schema: "helix.capability_lane.provider_timeline_event.v1",
      seq: index,
      stage: "lane_session",
      selected_runtime_agent_provider: summary.selected_runtime_agent_provider,
      adapter_boundary: "helix_agent_provider_edge",
      lane_id: summary.lane_id,
      capability_id: null,
      status: summary.session_status,
      session_status: summary.session_status,
      session_health: summary.session_health,
      lane_visible: false,
      lane_requested: true,
      lane_executed: laneExecuted,
      observation_reentered: false,
      requested_backend_provider:
        summary.backend_selection_decision.requested_backend_provider,
      requested_backend_provider_known:
        summary.backend_selection_decision.requested_backend_provider_known,
      selected_backend_provider: summary.selected_backend_provider,
      fallback_backend_provider: summary.fallback_backend_provider,
      selection_reason: summary.backend_selection_decision.reason,
      backend_selection_decision:
        summary.backend_selection_decision as unknown as Record<
          string,
          unknown
        >,
      cost_class: summary.cost_class,
      latency_class: summary.latency_class,
      privacy_class: summary.privacy_class,
      observation_ref: summary.last_observation_ref,
      receipt_ref: summary.latest_receipt_ref ?? summary.last_receipt_ref,
      latest_event_id: summary.latest_event_id,
      latest_receipt_ref: summary.latest_receipt_ref,
      lane_session_id: summary.lane_session_id,
      latest_session_reason: summary.latest_session_reason,
      session_reason: summary.session_reason,
      lifecycle_action: summary.lifecycle_action,
      session_lifecycle_action: summary.session_lifecycle_action,
      session_action: summary.session_action,
      session_debug_phase: summary.session_debug_phase,
      session_observation_status: summary.session_observation_status,
      session_control_key: summary.session_control_key,
      session_event_count: summary.session_event_count,
      session_created_at_ms: summary.created_at_ms,
      session_updated_at_ms: summary.updated_at_ms,
      permissions: summary.permissions,
      permission_profile: summary.permission_profile,
      source_binding_key: summary.source_binding_key,
      source_identity_key: summary.source_identity_key,
      latest_observation_key: summary.latest_observation_key,
      evidence_refs: summary.evidence_refs,
      has_observation: summary.has_observation,
      source_id: summary.source_id,
      source_hash: summary.source_hash,
      source_kind: summary.source_kind,
      source_projection_target: summary.projection_target,
      account_locale: summary.account_locale,
      latest_chunk_id: summary.latest_chunk_id,
      latest_chunk_index: summary.latest_chunk_index,
      latest_source_id: summary.latest_source_id,
      latest_source_hash: summary.latest_source_hash,
      latest_source_binding_key: summary.latest_source_binding_key,
      latest_source_identity_key: summary.latest_source_identity_key,
      latest_source_kind: summary.latest_source_kind,
      latest_account_locale: summary.latest_account_locale,
      latest_target_language: summary.latest_target_language,
      latest_dedupe_key: summary.latest_dedupe_key,
      latest_source_event_id: summary.latest_source_event_id,
      latest_source_event_ms: summary.latest_source_event_ms,
      latest_observed_at_ms: summary.latest_observed_at_ms,
      latest_freshness_status: summary.latest_freshness_status,
      source_text_hash: summary.source_text_hash,
      source_text_char_count: summary.source_text_char_count,
      latest_projection_target: summary.latest_projection_target,
      target_language: summary.target_language,
      latest_cancel_requested: summary.latest_cancel_requested,
      terminal_authority_status: summary.terminal_authority_status,
      selected_runtime_provider_remains_root: true,
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      context_role: "tool_evidence",
      answer_authority: false,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  });
