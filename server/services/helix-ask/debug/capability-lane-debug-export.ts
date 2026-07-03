type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readRecordArray = (value: unknown): RecordLike[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is RecordLike => Boolean(readRecord(entry)))
    : [];

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeTimelineStage = (value: unknown): string | null => {
  const stage = readString(value);
  if (!stage) return null;
  switch (stage) {
    case "lane_visible":
      return "visible";
    case "lane_requested":
      return "requested";
    case "lane_backend_selected":
      return "backend";
    case "lane_observation":
      return "observed";
    case "lane_projection_receipt":
      return "receipt";
    case "lane_reentered":
      return "reentered";
    case "lane_session":
      return "session";
    case "lane_mail_loop":
      return "mail";
    case "lane_goal_binding":
    case "goal_binding":
      return "goal";
    case "lane_goal_dispatch_plan":
      return "goal_plan";
    case "lane_goal_dispatch_admission":
      return "goal_admission";
    case "lane_goal_dispatch_readiness":
      return "goal_readiness";
    case "terminal_selected":
    case "terminal_rejected":
      return stage;
    default:
      return stage.replace(/^lane_/, "");
  }
};

const buildCapabilityLaneTimelineSummary = (timeline: unknown): RecordLike => {
  const entries = readRecordArray(timeline);
  const stageSequence = entries
    .map((entry) => normalizeTimelineStage(entry.stage))
    .filter((stage): stage is string => Boolean(stage));
  const count = (stage: string): number => stageSequence.filter((entry) => entry === stage).length;
  const flagCount = (key: string): number =>
    entries.filter((entry) => entry[key] === true).length;
  const refCount = (key: string): number =>
    entries.filter((entry) => Boolean(readString(entry[key]))).length;
  return {
    schema: "helix.capability_lane.timeline_summary.v1",
    event_count: entries.length,
    stage_sequence: stageSequence,
    stage_sequence_text: stageSequence.join(" > "),
    visible_count: count("visible"),
    requested_count: count("requested"),
    backend_selected_count: count("backend"),
    observed_count: count("observed"),
    receipt_count: count("receipt"),
    reentered_count: count("reentered"),
    session_count: count("session"),
    mail_loop_count: count("mail"),
    goal_binding_count: count("goal"),
    goal_dispatch_plan_count: count("goal_plan"),
    goal_dispatch_admission_count: count("goal_admission"),
    goal_dispatch_readiness_count: count("goal_readiness"),
    lane_executed_count: flagCount("lane_executed"),
    visible_only_count: entries.filter((entry) =>
      entry.lane_visible === true && entry.lane_executed !== true
    ).length,
    observation_ref_count: refCount("observation_ref"),
    receipt_ref_count: refCount("receipt_ref"),
    session_lifecycle_action_count: entries.filter((entry) =>
      Boolean(
        readString(entry.session_lifecycle_action) ||
        readString(entry.lifecycle_action) ||
        readString(entry.session_action),
      )
    ).length,
    session_control_key_count: refCount("session_control_key"),
    source_binding_key_count: refCount("source_binding_key"),
    latest_observation_key_count: refCount("latest_observation_key"),
    observation_lane_session_id_count: refCount("observation_lane_session_id"),
    observation_reentered_count: flagCount("observation_reentered"),
    terminal_selected_count: count("terminal_selected"),
    terminal_rejected_count: count("terminal_rejected"),
    visible_lane_does_not_mean_executed: true,
  };
};

const normalizeMailLoopDebugSummary = (summary: RecordLike): RecordLike => {
  const wakeKind = typeof summary.stage_play_wake_kind === "string"
    ? summary.stage_play_wake_kind.trim()
    : "";
  if (wakeKind === "mailbox_wake" || wakeKind === "none") return summary;
  return {
    ...summary,
    stage_play_wake_kind: summary.stage_play_wake_expected === true ? "mailbox_wake" : "none",
  };
};

const readCapabilityLaneMailLoopDebugSummaries = (
  payload: RecordLike,
  debug: RecordLike | null,
): RecordLike[] => {
  const explicit = [
    ...readRecordArray(payload.capability_lane_mail_loop_debug_summaries),
    ...readRecordArray(debug?.capability_lane_mail_loop_debug_summaries),
  ];
  if (explicit.length > 0) return explicit.map(normalizeMailLoopDebugSummary);

  return [
    ...readRecordArray(payload.capability_lane_goal_binding_debug_summaries),
    ...readRecordArray(debug?.capability_lane_goal_binding_debug_summaries),
  ]
    .map((summary) => readRecord(summary.latest_mail_loop_summary))
    .filter((summary): summary is RecordLike => Boolean(summary))
    .map(normalizeMailLoopDebugSummary);
};

export const buildCapabilityLaneDebugExportFields = (
  payload: RecordLike,
): RecordLike => {
  const debug = readRecord(payload.debug);
  const read = (key: string, fallback: unknown): unknown =>
    payload[key] ?? debug?.[key] ?? fallback;
  const capabilityLaneTurnTimeline = read("capability_lane_turn_timeline", []);

  return {
    capability_lane_manifest: read("capability_lane_manifest", null),
    model_visible_capability_lane_manifest: read("model_visible_capability_lane_manifest", null),
    capability_lane_resolve_traces: read("capability_lane_resolve_traces", []),
    capability_lane_backend_selections: read("capability_lane_backend_selections", []),
    capability_lane_call_results: read("capability_lane_call_results", []),
    capability_lane_turn_timeline: capabilityLaneTurnTimeline,
    capability_lane_timeline_summary: buildCapabilityLaneTimelineSummary(capabilityLaneTurnTimeline),
    capability_lane_observation_packets: read("capability_lane_observation_packets", []),
    capability_lane_debug_events: read("capability_lane_debug_events", []),
    capability_lane_projection_receipts: read("capability_lane_projection_receipts", []),
    capability_lane_session_results: read("capability_lane_session_results", []),
    capability_lane_session_debug_summaries: read("capability_lane_session_debug_summaries", []),
    capability_lane_goal_binding_results: read("capability_lane_goal_binding_results", []),
    capability_lane_mail_loop_debug_summaries: readCapabilityLaneMailLoopDebugSummaries(payload, debug),
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
