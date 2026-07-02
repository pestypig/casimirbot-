type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

export const buildCapabilityLaneDebugExportFields = (
  payload: RecordLike,
): RecordLike => {
  const debug = readRecord(payload.debug);
  const read = (key: string, fallback: unknown): unknown =>
    payload[key] ?? debug?.[key] ?? fallback;

  return {
    capability_lane_manifest: read("capability_lane_manifest", null),
    model_visible_capability_lane_manifest: read("model_visible_capability_lane_manifest", null),
    capability_lane_resolve_traces: read("capability_lane_resolve_traces", []),
    capability_lane_backend_selections: read("capability_lane_backend_selections", []),
    capability_lane_call_results: read("capability_lane_call_results", []),
    capability_lane_observation_packets: read("capability_lane_observation_packets", []),
    capability_lane_debug_events: read("capability_lane_debug_events", []),
    capability_lane_projection_receipts: read("capability_lane_projection_receipts", []),
    capability_lane_session_results: read("capability_lane_session_results", []),
    capability_lane_session_debug_summaries: read("capability_lane_session_debug_summaries", []),
    capability_lane_mail_loop_debug_summaries: read("capability_lane_mail_loop_debug_summaries", []),
    capability_lane_goal_binding_debug_summaries: read("capability_lane_goal_binding_debug_summaries", []),
    capability_lane_goal_dispatch_plans: read("capability_lane_goal_dispatch_plans", []),
    capability_lane_goal_dispatch_admissions: read("capability_lane_goal_dispatch_admissions", []),
    capability_lane_goal_dispatch_readiness: read("capability_lane_goal_dispatch_readiness", null),
    capability_lane_reentry_status: read("capability_lane_reentry_status", null),
    runtime_lane_request_contract: read("runtime_lane_request_contract", null),
    runtime_lane_request_loop: read("runtime_lane_request_loop", null),
    runtime_lane_request_retry: read("runtime_lane_request_retry", null),
  };
};
