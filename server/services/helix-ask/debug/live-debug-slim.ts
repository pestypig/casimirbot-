type RecordLike = Record<string, unknown>;

export type HelixAskLiveDebugSlimDependencies = {
  asDebugExportRecord: (value: unknown) => RecordLike | null;
  buildDebugExportMandatoryNextTool: (
    payload: RecordLike,
    phase?: RecordLike | null,
  ) => RecordLike | null;
  buildDebugExportPhaseControllerTrajectory: (input: {
    payload: RecordLike;
    phase: RecordLike | null;
    mandatoryNextTool: RecordLike | null;
  }) => RecordLike;
  buildDebugExportEvidenceReentryProof: (payload: RecordLike) => RecordLike;
};

const HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT = 8;

const HELIX_ASK_LIVE_DEBUG_OMIT_FIELDS = new Set([
  "routeContext",
  "repoIndex",
  "workspaceFiles",
  "workspaceFileTexts",
  "candidateContext",
  "prompt",
  "fullPrompt",
  "systemPrompt",
  "modelPrompt",
  "messages",
  "rawModelOutput",
  "rawOpenAiResponse",
  "attachments",
  "artifact_query_index",
  "current_turn_artifact_ledger",
  "execution_trace",
  "step_results",
  "prompt_rewrite_candidates",
  "objective_recovery_attempts",
  "objective_retrieval_passes",
  "objective_loop_state",
  "objective_transition_log",
  "objective_mini_synth_debug",
  "objective_mini_critic_debug",
  "composer_v2_debug",
  "debug_export_payload",
  "response_payload_snapshot",
  "graph_congruence_diagnostics",
  "graph_framework",
  "graph_framework_diagnostics",
  "live_interpretation_graph",
  "tree_walks",
  "tree_walk_diagnostics",
  "wide_stage05_path_candidates",
  "retained_compacted_summaries",
  "historical_turn_ids",
  "presentation_poison_audit",
]);

const countHelixAskJsonBytes = (value: unknown): number | null => {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return null;
  }
};

const summarizeHelixAskDebugValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return {
      count: value.length,
      sample: value.slice(0, HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT),
      truncated: value.length > HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT,
    };
  }
  if (value && typeof value === "object") {
    const record = value as RecordLike;
    return {
      keys: Object.keys(record).slice(0, 24),
      key_count: Object.keys(record).length,
    };
  }
  return value;
};

const readHelixAskLiveDebugRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readHelixAskLiveDebugRecordArray = (value: unknown): RecordLike[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is RecordLike => Boolean(readHelixAskLiveDebugRecord(entry)))
    : [];

const readHelixAskLiveDebugString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readHelixAskLiveDebugRuntimeAgentProvider = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readHelixAskLiveDebugString(value);
    if (text) return text;
  }
  return null;
};

const readHelixAskLiveDebugScalarString = (value: unknown): string | null => {
  const text = readHelixAskLiveDebugString(value);
  if (text) return text;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
};

const readHelixAskLiveDebugBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readHelixAskLiveDebugStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(readHelixAskLiveDebugString)
        .filter((entry): entry is string => Boolean(entry))
    : [];

const uniqueHelixAskLiveDebugStrings = (
  values: Array<string | null | undefined>,
): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const buildCapabilityLaneEvidenceRefs = (record: RecordLike): string[] =>
  uniqueHelixAskLiveDebugStrings([
    ...readHelixAskLiveDebugStringArray(record.evidence_refs),
    readHelixAskLiveDebugString(record.lane_session_id),
    readHelixAskLiveDebugString(record.observation_lane_session_id),
    readHelixAskLiveDebugString(record.latest_event_id),
    readHelixAskLiveDebugString(record.latest_observation_event_id),
    readHelixAskLiveDebugString(record.session_control_key),
    readHelixAskLiveDebugString(record.observation_ref),
    readHelixAskLiveDebugString(record.last_observation_ref),
    readHelixAskLiveDebugString(record.receipt_ref),
    readHelixAskLiveDebugString(record.last_receipt_ref),
    readHelixAskLiveDebugString(record.latest_receipt_ref),
    readHelixAskLiveDebugString(record.mail_loop_ref),
    readHelixAskLiveDebugString(record.source_id),
    readHelixAskLiveDebugString(record.source_hash),
    readHelixAskLiveDebugString(record.source_binding_key),
    readHelixAskLiveDebugString(record.latest_source_binding_key),
    readHelixAskLiveDebugString(record.lane_session_source_binding_key),
    readHelixAskLiveDebugString(record.source_identity_key),
    readHelixAskLiveDebugString(record.latest_source_identity_key),
    readHelixAskLiveDebugString(record.lane_session_source_identity_key),
    readHelixAskLiveDebugString(record.chunk_id),
    readHelixAskLiveDebugScalarString(record.chunk_index),
    readHelixAskLiveDebugString(record.latest_chunk_id),
    readHelixAskLiveDebugScalarString(record.latest_chunk_index),
    readHelixAskLiveDebugString(record.dedupe_key),
    readHelixAskLiveDebugString(record.latest_dedupe_key),
    readHelixAskLiveDebugString(record.source_event_id),
    readHelixAskLiveDebugString(record.latest_source_event_id),
    readHelixAskLiveDebugString(record.latest_observation_key),
    readHelixAskLiveDebugString(record.latest_mail_loop_observation_key),
  ]);

const normalizeCapabilityLaneTimelineStage = (value: unknown): string | null => {
  const stage = readHelixAskLiveDebugString(value);
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

const buildCapabilityLaneConsoleStateLabel = (
  entry: RecordLike,
  stage: string | null,
): string => {
  if (stage === "visible") return entry.lane_executed === true ? "visible_executed" : "visible_only";
  if (stage === "backend") return "backend_selected";
  if (stage === "observed") return entry.observation_reentered === true ? "observed_reentered" : "observed_pending_reentry";
  if (stage === "receipt") return "receipt_recorded";
  if (stage === "reentered") return "observation_reentered";
  if (stage === "session") {
    return `session_${
      readHelixAskLiveDebugString(entry.session_lifecycle_action) ||
      readHelixAskLiveDebugString(entry.lifecycle_action) ||
      readHelixAskLiveDebugString(entry.session_action) ||
      "event"
    }`;
  }
  if (stage === "mail") return entry.observation_reentered === true ? "mail_loop_evidence_reentered" : "mail_loop_evidence_pending";
  if (stage === "goal") return entry.observation_reentered === true ? "goal_bound_with_evidence" : "goal_bound_waiting_for_evidence";
  if (stage === "terminal_selected") return "terminal_selected";
  if (stage === "terminal_rejected") return "terminal_rejected";
  return stage || "unknown";
};

const readCapabilityLaneTimelineContextRole = (
  entry: RecordLike,
  stage: string | null,
): string | null => {
  const explicit = readHelixAskLiveDebugString(entry.context_role);
  if (explicit) return explicit;
  if (
    stage === "observed" ||
    stage === "receipt" ||
    stage === "reentered" ||
    stage === "session" ||
    stage === "mail" ||
    stage === "goal"
  ) {
    return "tool_evidence";
  }
  return null;
};

const capabilityLaneTimelineStageCanCarryTerminalAuthority = (stage: string | null): boolean =>
  stage === "terminal_selected" || stage === "terminal_rejected";

const buildCapabilityLaneConsoleStateRows = (
  entries: RecordLike[],
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike[] =>
  entries.slice(0, HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT).map((entry, index) => {
    const stage = normalizeCapabilityLaneTimelineStage(entry.stage);
    const canCarryTerminalAuthority = capabilityLaneTimelineStageCanCarryTerminalAuthority(stage);
    const reportDecision = readHelixAskLiveDebugRecord(entry.report_decision);
    const evidenceRefs = buildCapabilityLaneEvidenceRefs(entry);
    return {
      schema: "helix.capability_lane.console_state_row.v1",
      seq: typeof entry.seq === "number" ? entry.seq : index,
      stage: entry.stage ?? null,
      normalized_stage: stage,
      state_label: buildCapabilityLaneConsoleStateLabel(entry, stage),
      adapter_boundary: readHelixAskLiveDebugString(entry.adapter_boundary),
      lane_id: readHelixAskLiveDebugString(entry.lane_id),
      capability_id: readHelixAskLiveDebugString(entry.capability_id),
      selected_runtime_agent_provider: readHelixAskLiveDebugRuntimeAgentProvider(
        entry.selected_runtime_agent_provider,
        fallbackRuntimeAgentProvider,
      ),
      requested_backend_provider: readHelixAskLiveDebugString(entry.requested_backend_provider),
      requested_backend_provider_known: readHelixAskLiveDebugBoolean(entry.requested_backend_provider_known),
      selected_backend_provider: readHelixAskLiveDebugString(entry.selected_backend_provider),
      fallback_backend_provider: readHelixAskLiveDebugString(entry.fallback_backend_provider),
      backend_selection_reason:
        readHelixAskLiveDebugString(entry.backend_selection_reason) ??
        readHelixAskLiveDebugString(entry.selection_reason),
      lane_visible: entry.lane_visible === true,
      lane_requested: entry.lane_requested === true,
      lane_executed: entry.lane_executed === true,
      observation_reentered: entry.observation_reentered === true,
      observation_ref: readHelixAskLiveDebugString(entry.observation_ref),
      receipt_ref: readHelixAskLiveDebugString(entry.receipt_ref),
      lane_session_id: readHelixAskLiveDebugString(entry.lane_session_id),
      source_id:
        readHelixAskLiveDebugString(entry.source_id) ||
        readHelixAskLiveDebugString(entry.latest_source_id),
      source_hash:
        readHelixAskLiveDebugString(entry.source_hash) ||
        readHelixAskLiveDebugString(entry.latest_source_hash),
      source_kind:
        readHelixAskLiveDebugString(entry.source_kind) ||
        readHelixAskLiveDebugString(entry.latest_source_kind),
      source_text_hash: readHelixAskLiveDebugString(entry.source_text_hash),
      source_text_char_count: readHelixAskLiveDebugScalarString(entry.source_text_char_count),
      source_identity_key: readHelixAskLiveDebugString(entry.source_identity_key),
      projection_target:
        readHelixAskLiveDebugString(entry.projection_target) ||
        readHelixAskLiveDebugString(entry.latest_projection_target),
      account_locale:
        readHelixAskLiveDebugString(entry.account_locale) ||
        readHelixAskLiveDebugString(entry.latest_account_locale),
      target_language:
        readHelixAskLiveDebugString(entry.target_language) ||
        readHelixAskLiveDebugString(entry.latest_target_language),
      session_control_key: readHelixAskLiveDebugString(entry.session_control_key),
      source_binding_key:
        readHelixAskLiveDebugString(entry.source_binding_key) ||
        readHelixAskLiveDebugString(entry.latest_source_binding_key),
      latest_source_binding_key: readHelixAskLiveDebugString(entry.latest_source_binding_key),
      lane_session_source_binding_key: readHelixAskLiveDebugString(entry.lane_session_source_binding_key),
      lane_session_source_identity_key: readHelixAskLiveDebugString(entry.lane_session_source_identity_key),
      latest_source_identity_key: readHelixAskLiveDebugString(entry.latest_source_identity_key),
      latest_mail_loop_observation_key: readHelixAskLiveDebugString(entry.latest_mail_loop_observation_key),
      latest_observation_key: readHelixAskLiveDebugString(entry.latest_observation_key),
      observation_lane_session_id: readHelixAskLiveDebugString(entry.observation_lane_session_id),
      ...(evidenceRefs.length > 0 ? { evidence_refs: evidenceRefs } : {}),
      quiet_behavior_applied:
        readHelixAskLiveDebugBoolean(entry.quiet_behavior_applied) ??
        readHelixAskLiveDebugBoolean(reportDecision?.quiet_behavior_applied) ??
        false,
      wake_expected:
        readHelixAskLiveDebugBoolean(entry.wake_expected) ??
        readHelixAskLiveDebugBoolean(reportDecision?.wake_expected) ??
        false,
      surface_badge_expected:
        readHelixAskLiveDebugBoolean(entry.surface_badge_expected) ??
        readHelixAskLiveDebugBoolean(reportDecision?.surface_badge_expected) ??
        false,
      terminal_report_requested:
        readHelixAskLiveDebugBoolean(entry.terminal_report_requested) ??
        readHelixAskLiveDebugBoolean(reportDecision?.terminal_report_requested) ??
        false,
      terminal_report_authorized:
        readHelixAskLiveDebugBoolean(entry.terminal_report_authorized) ??
        readHelixAskLiveDebugBoolean(reportDecision?.terminal_report_authorized) ??
        false,
      terminal_authority_status:
        readHelixAskLiveDebugString(entry.terminal_authority_status) ??
        "not_terminal_authority",
      context_role: readCapabilityLaneTimelineContextRole(entry, stage),
      answer_authority: stage === "terminal_selected" && entry.answer_authority === true,
      terminal_eligible: canCarryTerminalAuthority && entry.terminal_eligible === true,
      assistant_answer: canCarryTerminalAuthority && entry.assistant_answer === true,
      raw_content_included: canCarryTerminalAuthority && entry.raw_content_included === true,
    };
  });

const capabilityLaneTimelineRowHasObservation = (entry: RecordLike): boolean => {
  const explicit =
    readHelixAskLiveDebugBoolean(entry.has_observation) ??
    readHelixAskLiveDebugBoolean(entry.hasObservation);
  if (explicit !== null) return explicit;
  return Boolean(
    readHelixAskLiveDebugString(entry.observation_ref) ||
    readHelixAskLiveDebugString(entry.receipt_ref) ||
    readHelixAskLiveDebugString(entry.latest_observation_key) ||
    readHelixAskLiveDebugString(entry.latest_mail_loop_observation_key),
  );
};

const buildCapabilityLaneTimelineSummary = (
  timeline: unknown,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const entries = readHelixAskLiveDebugRecordArray(timeline);
  const stageSequence = entries
    .map((entry) => normalizeCapabilityLaneTimelineStage(entry.stage))
    .filter((stage): stage is string => Boolean(stage));
  const count = (stage: string): number => stageSequence.filter((entry) => entry === stage).length;
  const flagCount = (key: string): number =>
    entries.filter((entry) => entry[key] === true).length;
  const refCount = (key: string): number =>
    entries.filter((entry) => Boolean(readHelixAskLiveDebugString(entry[key]))).length;
  const observedStageCount = (stage: string): number =>
    entries.filter((entry) =>
      normalizeCapabilityLaneTimelineStage(entry.stage) === stage &&
      capabilityLaneTimelineRowHasObservation(entry)
    ).length;

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
    observed_session_count: observedStageCount("session"),
    observed_mail_loop_count: observedStageCount("mail"),
    observed_goal_binding_count: observedStageCount("goal"),
    observed_lane_activity_count: entries.filter(capabilityLaneTimelineRowHasObservation).length,
    goal_dispatch_plan_count: count("goal_plan"),
    goal_dispatch_admission_count: count("goal_admission"),
    goal_dispatch_readiness_count: count("goal_readiness"),
    lane_executed_count: flagCount("lane_executed"),
    visible_only_count: entries.filter((entry) =>
      entry.lane_visible === true && entry.lane_executed !== true
    ).length,
    observation_ref_count: refCount("observation_ref"),
    receipt_ref_count: refCount("receipt_ref"),
    session_control_key_count: refCount("session_control_key"),
    source_binding_key_count: entries.filter((entry) =>
      Boolean(
        readHelixAskLiveDebugString(entry.source_binding_key) ||
        readHelixAskLiveDebugString(entry.latest_source_binding_key),
      )
    ).length,
    latest_source_binding_key_count: refCount("latest_source_binding_key"),
    source_identity_key_count: refCount("source_identity_key"),
    latest_source_identity_key_count: refCount("latest_source_identity_key"),
    lane_session_source_binding_key_count: refCount("lane_session_source_binding_key"),
    lane_session_source_identity_key_count: refCount("lane_session_source_identity_key"),
    latest_mail_loop_observation_key_count: refCount("latest_mail_loop_observation_key"),
    latest_observation_key_count: refCount("latest_observation_key"),
    observation_lane_session_id_count: refCount("observation_lane_session_id"),
    observation_reentered_count: flagCount("observation_reentered"),
    quiet_behavior_applied_count: flagCount("quiet_behavior_applied"),
    mailbox_wake_expected_count: flagCount("mailbox_wake_expected"),
    decision_wake_expected_count: flagCount("decision_wake_expected"),
    wake_expected_count: flagCount("wake_expected"),
    surface_badge_expected_count: flagCount("surface_badge_expected"),
    terminal_report_requested_count: flagCount("terminal_report_requested"),
    terminal_report_authorized_count: flagCount("terminal_report_authorized"),
    terminal_selected_count: count("terminal_selected"),
    terminal_rejected_count: count("terminal_rejected"),
    console_state_rows: buildCapabilityLaneConsoleStateRows(
      entries,
      fallbackRuntimeAgentProvider,
    ),
    console_state_rows_truncated: entries.length > HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT,
    visible_lane_does_not_mean_executed: true,
  };
};

const normalizeCapabilityLaneTimelineSummary = (
  summary: unknown,
  timeline: unknown,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const explicit = readHelixAskLiveDebugRecord(summary);
  if (!explicit) {
    return buildCapabilityLaneTimelineSummary(timeline, fallbackRuntimeAgentProvider);
  }
  const explicitRows = readHelixAskLiveDebugRecordArray(explicit.console_state_rows);
  return {
    ...explicit,
    console_state_rows: explicitRows.length > 0
      ? buildCapabilityLaneConsoleStateRows(explicitRows, fallbackRuntimeAgentProvider)
      : buildCapabilityLaneTimelineSummary(timeline, fallbackRuntimeAgentProvider).console_state_rows,
    visible_lane_does_not_mean_executed: true,
  };
};

const normalizeCapabilityLaneMailLoopDebugSummary = (
  summary: RecordLike,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const wakeKind =
    typeof summary.stage_play_wake_kind === "string"
      ? summary.stage_play_wake_kind.trim()
      : "";
  const stagePlayWakeExpected = summary.stage_play_wake_expected === true;
  const mailboxWakeExpected =
    summary.mailbox_wake_expected === true ||
    wakeKind === "mailbox_wake" ||
    stagePlayWakeExpected;
  if (wakeKind === "mailbox_wake" || wakeKind === "none") {
    const selectedRuntimeAgentProvider = readHelixAskLiveDebugRuntimeAgentProvider(
      summary.selected_runtime_agent_provider,
      fallbackRuntimeAgentProvider,
    );
    return {
      ...summary,
      ...(selectedRuntimeAgentProvider
        ? { selected_runtime_agent_provider: selectedRuntimeAgentProvider }
        : {}),
      mailbox_wake_expected: mailboxWakeExpected,
      decision_wake_expected: summary.decision_wake_expected === true,
      context_role: readHelixAskLiveDebugString(summary.context_role) ?? "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const selectedRuntimeAgentProvider = readHelixAskLiveDebugRuntimeAgentProvider(
    summary.selected_runtime_agent_provider,
    fallbackRuntimeAgentProvider,
  );
  return {
    ...summary,
    ...(selectedRuntimeAgentProvider
      ? { selected_runtime_agent_provider: selectedRuntimeAgentProvider }
      : {}),
    context_role: readHelixAskLiveDebugString(summary.context_role) ?? "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    stage_play_wake_kind: stagePlayWakeExpected ? "mailbox_wake" : "none",
    mailbox_wake_expected: mailboxWakeExpected,
    decision_wake_expected: summary.decision_wake_expected === true,
  };
};

const normalizeCapabilityLaneEvidenceRecord = (
  record: RecordLike,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const evidenceRefs = buildCapabilityLaneEvidenceRefs(record);
  const selectedRuntimeAgentProvider = readHelixAskLiveDebugRuntimeAgentProvider(
    record.selected_runtime_agent_provider,
    fallbackRuntimeAgentProvider,
  );
  return {
    ...record,
    ...(evidenceRefs.length > 0 ? { evidence_refs: evidenceRefs } : {}),
    latest_receipt_ref:
      readHelixAskLiveDebugString(record.latest_receipt_ref) ??
      readHelixAskLiveDebugString(record.receipt_ref) ??
      readHelixAskLiveDebugString(record.last_receipt_ref),
    ...(selectedRuntimeAgentProvider
      ? { selected_runtime_agent_provider: selectedRuntimeAgentProvider }
      : {}),
    context_role: readHelixAskLiveDebugString(record.context_role) ?? "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const summarizeCapabilityLaneEvidenceRecords = (
  value: unknown,
  fallbackRuntimeAgentProvider: string | null = null,
): unknown => {
  const records = readHelixAskLiveDebugRecordArray(value);
  if (records.length === 0) return summarizeHelixAskDebugValue(value);
  return summarizeHelixAskDebugValue(
    records.map((record) =>
      normalizeCapabilityLaneEvidenceRecord(record, fallbackRuntimeAgentProvider),
    ),
  );
};

const normalizeCapabilityLaneEvidenceRecordValue = (
  value: unknown,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike | null => {
  const record = readHelixAskLiveDebugRecord(value);
  return record ? normalizeCapabilityLaneEvidenceRecord(record, fallbackRuntimeAgentProvider) : null;
};

const readCapabilityLaneMailLoopDebugSummaries = (
  payload: RecordLike,
  debug: RecordLike,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike[] => {
  const explicit = [
    ...readHelixAskLiveDebugRecordArray(payload.capability_lane_mail_loop_debug_summaries),
    ...readHelixAskLiveDebugRecordArray(debug.capability_lane_mail_loop_debug_summaries),
  ];
  if (explicit.length > 0) {
    return explicit.map((summary) =>
      normalizeCapabilityLaneMailLoopDebugSummary(summary, fallbackRuntimeAgentProvider),
    );
  }

  return [
    ...readHelixAskLiveDebugRecordArray(payload.capability_lane_goal_binding_debug_summaries),
    ...readHelixAskLiveDebugRecordArray(debug.capability_lane_goal_binding_debug_summaries),
  ]
    .map((summary) => readHelixAskLiveDebugRecord(summary.latest_mail_loop_summary))
    .filter((summary): summary is RecordLike => Boolean(summary))
    .map((summary) =>
      normalizeCapabilityLaneMailLoopDebugSummary(summary, fallbackRuntimeAgentProvider),
    );
};

export const createHelixAskLiveDebugSlimBuilder = (
  dependencies: HelixAskLiveDebugSlimDependencies,
): ((payload: RecordLike) => RecordLike | null) => {
  const {
    asDebugExportRecord,
    buildDebugExportMandatoryNextTool,
    buildDebugExportPhaseControllerTrajectory,
    buildDebugExportEvidenceReentryProof,
  } = dependencies;

  return (payload: RecordLike): RecordLike | null => {
    const debug = payload.debug && typeof payload.debug === "object"
      ? (payload.debug as RecordLike)
      : null;
    if (!debug) return null;
    const sourceByteCount = countHelixAskJsonBytes(debug);
    const slimPhase =
      asDebugExportRecord(payload.live_source_turn_phase_resolution) ??
      asDebugExportRecord(debug.live_source_turn_phase_resolution);
    const slimMandatoryNextTool =
      asDebugExportRecord(payload.mandatory_next_tool) ??
      asDebugExportRecord(debug.mandatory_next_tool) ??
      buildDebugExportMandatoryNextTool(payload, slimPhase);
    const slimPhaseControllerTrajectory =
      asDebugExportRecord(payload.phase_controller_trajectory) ??
      asDebugExportRecord(debug.phase_controller_trajectory) ??
      buildDebugExportPhaseControllerTrajectory({
        payload,
        phase: slimPhase,
        mandatoryNextTool: slimMandatoryNextTool,
      });
    const slimTerminalCandidateRejections =
      payload.terminal_candidate_rejections ??
      debug.terminal_candidate_rejections ??
      (payload.terminal_authority_single_writer && typeof payload.terminal_authority_single_writer === "object"
        ? (payload.terminal_authority_single_writer as RecordLike).rejectedCandidates ??
          (payload.terminal_authority_single_writer as RecordLike).rejected_candidates
        : null);
    const slimEvidenceReentryProof =
      asDebugExportRecord(payload.evidence_reentry_proof) ??
      asDebugExportRecord(debug.evidence_reentry_proof) ??
      buildDebugExportEvidenceReentryProof(payload);
    const fallbackRuntimeAgentProvider = readHelixAskLiveDebugRuntimeAgentProvider(
      payload.selected_runtime_agent_provider,
      payload.agent_runtime,
      payload.agentRuntime,
      debug.selected_runtime_agent_provider,
      debug.agent_runtime,
      debug.agentRuntime,
    );
    const capabilityLaneMailLoopDebugSummaries =
      readCapabilityLaneMailLoopDebugSummaries(payload, debug, fallbackRuntimeAgentProvider);
    const capabilityLaneTurnTimeline =
      payload.capability_lane_turn_timeline ?? debug.capability_lane_turn_timeline ?? [];
    const slim: RecordLike = {
      schema: "helix.ask.live_debug_slim.v1",
      live_debug_mode: "slim",
      full_debug_export_ref: payload.debug_export_ref ?? debug.debug_export_ref ?? null,
      full_debug_export_payload_hash: payload.debug_export_payload_hash ?? debug.debug_export_payload_hash ?? null,
      language_contract: payload.language_contract ?? debug.language_contract ?? null,
      source_language: payload.source_language ?? debug.source_language ?? null,
      language_detected: payload.language_detected ?? debug.language_detected ?? null,
      language_confidence: payload.language_confidence ?? debug.language_confidence ?? null,
      code_mixed: payload.code_mixed ?? debug.code_mixed ?? null,
      response_language: payload.response_language ?? debug.response_language ?? null,
      translated: payload.translated ?? debug.translated ?? null,
      turn_id: payload.turn_id ?? debug.turn_id ?? null,
      trace_id: payload.trace_id ?? payload.traceId ?? debug.trace_id ?? null,
      golden_path_runtime: payload.golden_path_runtime ?? debug.golden_path_runtime ?? null,
      golden_path_runtime_status: payload.golden_path_runtime_status ?? debug.golden_path_runtime_status ?? null,
      session_id: payload.session_id ?? payload.sessionId ?? debug.session_id ?? null,
      agent_runtime: payload.agent_runtime ?? debug.agent_runtime ?? null,
      agent_runtime_adapter_contract:
        payload.agent_runtime_adapter_contract ?? debug.agent_runtime_adapter_contract ?? null,
      fail_reason: payload.fail_reason ?? debug.fail_reason ?? null,
      codex_exit_code: payload.codex_exit_code ?? debug.codex_exit_code ?? null,
      codex_timed_out: payload.codex_timed_out ?? debug.codex_timed_out ?? null,
      codex_process_killed:
        payload.codex_process_killed ?? debug.codex_process_killed ?? null,
      codex_timeout_ms: payload.codex_timeout_ms ?? debug.codex_timeout_ms ?? null,
      codex_bin: payload.codex_bin ?? debug.codex_bin ?? null,
      codex_args: payload.codex_args ?? debug.codex_args ?? null,
      codex_runtime_status:
        payload.codex_runtime_status ?? debug.codex_runtime_status ?? null,
      codex_stderr_preview:
        payload.codex_stderr_preview ?? debug.codex_stderr_preview ?? null,
      agent_runtime_selection_trace:
        payload.agent_runtime_selection_trace ?? debug.agent_runtime_selection_trace ?? null,
      selected_agent_provider:
        payload.selected_agent_provider ?? debug.selected_agent_provider ?? null,
      capability_lane_manifest:
        payload.capability_lane_manifest ?? debug.capability_lane_manifest ?? null,
      model_visible_capability_lane_manifest:
        payload.model_visible_capability_lane_manifest ?? debug.model_visible_capability_lane_manifest ?? null,
      capability_lane_ids:
        payload.capability_lane_ids ?? debug.capability_lane_ids ?? null,
      capability_lane_statuses:
        payload.capability_lane_statuses ?? debug.capability_lane_statuses ?? null,
      capability_lane_resolve_trace_shape:
        payload.capability_lane_resolve_trace_shape ?? debug.capability_lane_resolve_trace_shape ?? null,
      capability_lane_resolve_traces:
        summarizeHelixAskDebugValue(payload.capability_lane_resolve_traces ?? debug.capability_lane_resolve_traces ?? []),
      capability_lane_backend_selections:
        summarizeHelixAskDebugValue(
          payload.capability_lane_backend_selections ?? debug.capability_lane_backend_selections ?? [],
        ),
      capability_lane_call_results:
        summarizeHelixAskDebugValue(payload.capability_lane_call_results ?? debug.capability_lane_call_results ?? []),
      capability_lane_timeline_summary:
        normalizeCapabilityLaneTimelineSummary(
          payload.capability_lane_timeline_summary ?? debug.capability_lane_timeline_summary,
          capabilityLaneTurnTimeline,
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_observation_packets:
        summarizeHelixAskDebugValue(
          payload.capability_lane_observation_packets ?? debug.capability_lane_observation_packets ?? [],
        ),
      capability_lane_debug_events:
        summarizeHelixAskDebugValue(payload.capability_lane_debug_events ?? debug.capability_lane_debug_events ?? []),
      capability_lane_session_results:
        summarizeCapabilityLaneEvidenceRecords(
          payload.capability_lane_session_results ?? debug.capability_lane_session_results ?? [],
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_session_debug_summaries:
        summarizeCapabilityLaneEvidenceRecords(
          payload.capability_lane_session_debug_summaries ?? debug.capability_lane_session_debug_summaries ?? [],
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_goal_binding_results:
        summarizeCapabilityLaneEvidenceRecords(
          payload.capability_lane_goal_binding_results ?? debug.capability_lane_goal_binding_results ?? [],
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_mail_loop_debug_summaries:
        summarizeHelixAskDebugValue(capabilityLaneMailLoopDebugSummaries),
      capability_lane_goal_binding_debug_summaries:
        summarizeCapabilityLaneEvidenceRecords(
          payload.capability_lane_goal_binding_debug_summaries ??
            debug.capability_lane_goal_binding_debug_summaries ??
            [],
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_goal_dispatch_plans:
        summarizeCapabilityLaneEvidenceRecords(
          payload.capability_lane_goal_dispatch_plans ?? debug.capability_lane_goal_dispatch_plans ?? [],
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_goal_dispatch_admissions:
        summarizeCapabilityLaneEvidenceRecords(
          payload.capability_lane_goal_dispatch_admissions ?? debug.capability_lane_goal_dispatch_admissions ?? [],
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_goal_dispatch_readiness:
        normalizeCapabilityLaneEvidenceRecordValue(
          payload.capability_lane_goal_dispatch_readiness ?? debug.capability_lane_goal_dispatch_readiness,
          fallbackRuntimeAgentProvider,
        ),
      capability_lane_projection_receipts:
        summarizeHelixAskDebugValue(
          payload.capability_lane_projection_receipts ?? debug.capability_lane_projection_receipts ?? [],
        ),
      capability_lane_reentry_status:
        payload.capability_lane_reentry_status ?? debug.capability_lane_reentry_status ?? null,
      runtime_lane_request_contract:
        payload.runtime_lane_request_contract ?? debug.runtime_lane_request_contract ?? null,
      runtime_lane_request_loop:
        payload.runtime_lane_request_loop ?? debug.runtime_lane_request_loop ?? null,
      runtime_lane_request_retry:
        payload.runtime_lane_request_retry ?? debug.runtime_lane_request_retry ?? null,
      workstation_gateway_manifest:
        payload.workstation_gateway_manifest ?? debug.workstation_gateway_manifest ?? null,
      workstation_gateway_manifest_version:
        payload.workstation_gateway_manifest_version ?? debug.workstation_gateway_manifest_version ?? null,
      workstation_gateway_capability_ids:
        payload.workstation_gateway_capability_ids ?? debug.workstation_gateway_capability_ids ?? null,
      workstation_gateway_reentry_status:
        payload.workstation_gateway_reentry_status ?? debug.workstation_gateway_reentry_status ?? null,
      workstation_gateway_call_results:
        summarizeHelixAskDebugValue(payload.workstation_gateway_call_results ?? debug.workstation_gateway_call_results ?? []),
      workstation_gateway_observation_packets:
        summarizeHelixAskDebugValue(
          payload.workstation_gateway_observation_packets ?? debug.workstation_gateway_observation_packets ?? [],
        ),
      tool_lifecycle_traces:
        summarizeHelixAskDebugValue(payload.tool_lifecycle_traces ?? debug.tool_lifecycle_traces ?? []),
      tool_followup_decisions:
        summarizeHelixAskDebugValue(payload.tool_followup_decisions ?? debug.tool_followup_decisions ?? []),
      provider_terminal_candidate:
        summarizeHelixAskDebugValue(payload.provider_terminal_candidate ?? debug.provider_terminal_candidate ?? null),
      provider_reasoning_reentry:
        payload.provider_reasoning_reentry ?? debug.provider_reasoning_reentry ?? null,
      terminal_authority_candidate_review:
        payload.terminal_authority_candidate_review ?? debug.terminal_authority_candidate_review ?? null,
      provider_terminal_authority_bridge:
        payload.provider_terminal_authority_bridge ?? debug.provider_terminal_authority_bridge ?? null,
      terminal_answer_authority:
        payload.terminal_answer_authority ?? debug.terminal_answer_authority ?? null,
      terminal_presentation:
        payload.terminal_presentation ?? debug.terminal_presentation ?? null,
      terminal_authority_status:
        payload.terminal_authority_status ?? debug.terminal_authority_status ?? null,
      route_reason_code: payload.route_reason_code ?? debug.route_reason_code ?? null,
      selected_final_answer: payload.selected_final_answer ?? debug.selected_final_answer ?? null,
      answer: payload.answer ?? debug.answer ?? null,
      assistant_answer: payload.assistant_answer ?? debug.assistant_answer ?? null,
      text: payload.text ?? debug.text ?? null,
      public_commentary_timeline:
        payload.public_commentary_timeline ?? debug.public_commentary_timeline ?? null,
      turn_transcript_source:
        payload.turn_transcript_source ?? debug.turn_transcript_source ?? null,
      turn_transcript_live_event_count:
        payload.turn_transcript_live_event_count ?? debug.turn_transcript_live_event_count ?? null,
      turn_transcript_reconstructed_fallback_count:
        payload.turn_transcript_reconstructed_fallback_count ?? debug.turn_transcript_reconstructed_fallback_count ?? null,
      turn_transcript_reconstructed_fallback:
        payload.turn_transcript_reconstructed_fallback ?? debug.turn_transcript_reconstructed_fallback ?? null,
      terminal_presentation: payload.terminal_presentation ?? debug.terminal_presentation ?? null,
      final_status: payload.final_status ?? debug.final_status ?? null,
      response_type: payload.response_type ?? debug.response_type ?? null,
      final_answer_source: payload.final_answer_source ?? debug.final_answer_source ?? null,
      terminal_artifact_kind: payload.terminal_artifact_kind ?? debug.terminal_artifact_kind ?? null,
      terminal_error_code: payload.terminal_error_code ?? debug.terminal_error_code ?? null,
      terminal_answer_authority: payload.terminal_answer_authority ?? debug.terminal_answer_authority ?? null,
      terminal_authority_single_writer: payload.terminal_authority_single_writer ?? debug.terminal_authority_single_writer ?? null,
      terminal_candidate_rejections:
        slimTerminalCandidateRejections,
      resolved_turn_summary: payload.resolved_turn_summary ?? debug.resolved_turn_summary ?? null,
      route_authority_audit: payload.route_authority_audit ?? debug.route_authority_audit ?? null,
      loop_parity_trace: payload.loop_parity_trace ?? debug.loop_parity_trace ?? null,
      capability_selection_result: payload.capability_selection_result ?? debug.capability_selection_result ?? null,
      capability_selection_trace:
        summarizeHelixAskDebugValue(payload.capability_selection_trace ?? debug.capability_selection_trace ?? []),
      solver_continuation_observation:
        payload.solver_continuation_observation ?? debug.solver_continuation_observation ?? null,
      source_target_intent: payload.source_target_intent ?? debug.source_target_intent ?? null,
      stage_play_live_source_mailbox_debug:
        payload.stage_play_live_source_mailbox_debug ?? debug.stage_play_live_source_mailbox_debug ?? null,
      live_source_mailbox_authority_summary:
        payload.live_source_mailbox_authority_summary ?? debug.live_source_mailbox_authority_summary ?? null,
      generic_runtime_trace:
        payload.generic_runtime_trace ?? debug.generic_runtime_trace ?? null,
      live_source_identity_audit: payload.live_source_identity_audit ?? debug.live_source_identity_audit ?? null,
      goal_satisfaction_evaluation:
        payload.goal_satisfaction_evaluation ?? debug.goal_satisfaction_evaluation ?? null,
      solver_controller_decision: payload.solver_controller_decision ?? debug.solver_controller_decision ?? null,
      tool_family_contract_audit:
        payload.tool_family_contract_audit ?? debug.tool_family_contract_audit ?? null,
      tool_use_restatement:
        payload.tool_use_restatement ??
        debug.tool_use_restatement ??
        (payload.ask_turn_solver_trace && typeof payload.ask_turn_solver_trace === "object"
          ? (payload.ask_turn_solver_trace as RecordLike).tool_use_restatement
          : null),
      phase_controller_trajectory:
        slimPhaseControllerTrajectory,
      mandatory_next_tool:
        slimMandatoryNextTool,
      evidence_reentry_proof:
        slimEvidenceReentryProof,
      terminal_equivalence_harness_result:
        payload.terminal_equivalence_harness_result ?? debug.terminal_equivalence_harness_result ?? null,
      terminal_surface_parity_invariant:
        payload.terminal_surface_parity_invariant ?? debug.terminal_surface_parity_invariant ?? null,
      route_label_consistency_audit: debug.route_label_consistency_audit ?? null,
      source_target_exact_contract: debug.source_target_exact_contract ?? null,
      voice_interpretation_context:
        payload.voice_interpretation_context ?? debug.voice_interpretation_context ?? null,
      runtime_memory_governor:
        payload.runtime_memory_governor ?? debug.runtime_memory_governor ?? null,
      runtime_memory_governor_admission:
        payload.runtime_memory_governor_admission ?? debug.runtime_memory_governor_admission ?? null,
      ask_turn_runtime_memory_governor:
        payload.ask_turn_runtime_memory_governor ?? debug.ask_turn_runtime_memory_governor ?? null,
      live_line_tool_requests:
        summarizeHelixAskDebugValue(payload.live_line_tool_requests ?? debug.live_line_tool_requests ?? []),
      live_line_tool_evaluations:
        summarizeHelixAskDebugValue(payload.live_line_tool_evaluations ?? debug.live_line_tool_evaluations ?? []),
      current_turn_artifact_ledger:
        summarizeHelixAskDebugValue(payload.current_turn_artifact_ledger ?? debug.current_turn_artifact_ledger ?? []),
      step_results: summarizeHelixAskDebugValue(payload.step_results ?? debug.step_results ?? []),
      execution_trace: summarizeHelixAskDebugValue(payload.execution_trace ?? debug.execution_trace ?? []),
      capability_lifecycle_ledger:
        summarizeHelixAskDebugValue(payload.capability_lifecycle_ledger ?? debug.capability_lifecycle_ledger ?? []),
      tool_lifecycle_trace:
        summarizeHelixAskDebugValue(payload.tool_lifecycle_trace ?? debug.tool_lifecycle_trace ?? []),
      ask_turn_solver_trace: payload.ask_turn_solver_trace ?? debug.ask_turn_solver_trace ?? null,
      poison_audit: debug.poison_audit ?? payload.poison_audit ?? null,
      artifact_role_counts: debug.artifact_role_counts ?? null,
      line_tool_request_count: payload.line_tool_request_count ?? debug.line_tool_request_count ?? null,
      line_tool_evaluation_count: payload.line_tool_evaluation_count ?? debug.line_tool_evaluation_count ?? null,
      request_user_input_count: payload.request_user_input_count ?? debug.request_user_input_count ?? null,
    };
    const omittedFields: string[] = [];
    for (const key of Object.keys(debug)) {
      if (HELIX_ASK_LIVE_DEBUG_OMIT_FIELDS.has(key)) {
        omittedFields.push(key);
      }
    }
    slim.live_debug_slimming = {
      source_debug_bytes: sourceByteCount,
      slim_debug_bytes: countHelixAskJsonBytes(slim),
      source_debug_key_count: Object.keys(debug).length,
      omitted_fields: omittedFields.sort(),
      omitted_field_count: omittedFields.length,
      array_sample_limit: HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT,
      full_export_available: Boolean(slim.full_debug_export_ref),
    };
    return slim;
  };
};
