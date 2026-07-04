import {
  normalizeHelixLiveTranslationSourceIdentityKey,
  normalizeHelixLiveTranslationSourceKind,
} from "@shared/helix-live-translation-source-kind";

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

const readScalarString = (value: unknown): string | null => {
  const text = readString(value);
  if (text) return text;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
};

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readRuntimeAgentProvider = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const normalizeDebugSourceKind = (value: unknown): string | null => {
  const text = readString(value);
  if (!text) return null;
  return normalizeHelixLiveTranslationSourceKind(text, "") || null;
};

const normalizeDebugSourceIdentityKey = (value: unknown): string | null => {
  const text = readString(value);
  if (!text) return null;
  return normalizeHelixLiveTranslationSourceIdentityKey(text) || null;
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(readString)
        .filter((entry): entry is string => Boolean(entry))
    : [];

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const buildCapabilityLaneEvidenceRefs = (record: RecordLike): string[] =>
  uniqueStrings([
    ...readStringArray(record.evidence_refs),
    readString(record.lane_session_id),
    readString(record.observation_lane_session_id),
    readString(record.latest_event_id),
    readString(record.latest_observation_event_id),
    readString(record.session_control_key),
    readString(record.observation_ref),
    readString(record.last_observation_ref),
    readString(record.latest_visible_observation_ref),
    readString(record.visible_observation_ref),
    readString(record.latest_evidence_observation_ref),
    readString(record.evidence_observation_ref),
    readString(record.receipt_ref),
    readString(record.last_receipt_ref),
    readString(record.latest_receipt_ref),
    readString(record.latest_visible_receipt_ref),
    readString(record.visible_receipt_ref),
    readString(record.latest_evidence_receipt_ref),
    readString(record.evidence_receipt_ref),
    readString(record.mail_loop_ref),
    readString(record.source_id),
    readString(record.source_hash),
    readString(record.source_binding_key),
    readString(record.latest_source_binding_key),
    readString(record.lane_session_source_binding_key),
    readString(record.source_identity_key),
    readString(record.latest_source_identity_key),
    readString(record.lane_session_source_identity_key),
    readString(record.chunk_id),
    readScalarString(record.chunk_index),
    readString(record.latest_chunk_id),
    readScalarString(record.latest_chunk_index),
    readString(record.dedupe_key),
    readString(record.latest_dedupe_key),
    readString(record.source_event_id),
    readString(record.latest_source_event_id),
    readString(record.latest_observation_key),
    readString(record.latest_mail_loop_observation_key),
  ]);

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

const buildConsoleStateLabel = (entry: RecordLike, stage: string | null): string => {
  if (stage === "visible") return entry.lane_executed === true ? "visible_executed" : "visible_only";
  if (stage === "backend") return "backend_selected";
  if (stage === "observed") return entry.observation_reentered === true ? "observed_reentered" : "observed_pending_reentry";
  if (stage === "receipt") return "receipt_recorded";
  if (stage === "reentered") return "observation_reentered";
  if (stage === "session") return `session_${readString(entry.session_lifecycle_action) || readString(entry.lifecycle_action) || readString(entry.session_action) || "event"}`;
  if (stage === "mail") return entry.observation_reentered === true ? "mail_loop_evidence_reentered" : "mail_loop_evidence_pending";
  if (stage === "goal") return entry.observation_reentered === true ? "goal_bound_with_evidence" : "goal_bound_waiting_for_evidence";
  if (stage === "terminal_selected") return "terminal_selected";
  if (stage === "terminal_rejected") return "terminal_rejected";
  return stage || "unknown";
};

const resolveConsoleExecutionState = (input: {
  stage: string | null;
  laneVisible: boolean;
  laneRequested: boolean;
  laneExecuted: boolean;
  observationReentered: boolean;
}): string => {
  if (input.stage === "terminal_rejected") return "terminal_rejected";
  if (input.stage === "terminal_selected") return "terminal_selected";
  if (input.stage === "reentered" || input.observationReentered) return "reentered";
  if (
    input.stage === "goal_plan" ||
    input.stage === "goal_admission" ||
    input.stage === "goal_readiness"
  ) {
    return "goal_dispatch";
  }
  if (input.stage === "goal") return "goal_bound";
  if (input.stage === "mail") return "mail_loop_active";
  if (input.stage === "session") return "session_active";
  if (input.stage === "receipt") return "receipt_pending_reentry";
  if (input.stage === "backend") return "backend_selected";
  if (input.stage === "observed" || input.laneExecuted) return "executed_pending_reentry";
  if (input.stage === "requested" || input.laneRequested) return "requested_not_executed";
  if (input.stage === "visible" || input.laneVisible) return "available_only";
  return "available_only";
};

const readTimelineContextRole = (entry: RecordLike, stage: string | null): string | null => {
  const explicit = readString(entry.context_role);
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

const timelineStageCanCarryTerminalAuthority = (stage: string | null): boolean =>
  stage === "terminal_selected" || stage === "terminal_rejected";

const buildConsoleStateRows = (
  entries: RecordLike[],
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike[] =>
  entries.map((entry, index) => {
    const stage = normalizeTimelineStage(entry.stage);
    const canCarryTerminalAuthority = timelineStageCanCarryTerminalAuthority(stage);
    const evidenceRefs = buildCapabilityLaneEvidenceRefs(entry);
    const laneVisible = entry.lane_visible === true;
    const laneRequested = entry.lane_requested === true;
    const laneExecuted = entry.lane_executed === true;
    const observationReentered = entry.observation_reentered === true;
    return {
      schema: "helix.capability_lane.console_state_row.v1",
      seq: typeof entry.seq === "number" ? entry.seq : index,
      stage: entry.stage ?? null,
      normalized_stage: stage,
      state_label: buildConsoleStateLabel(entry, stage),
      execution_state: resolveConsoleExecutionState({
        stage,
        laneVisible,
        laneRequested,
        laneExecuted,
        observationReentered,
      }),
      adapter_boundary: readString(entry.adapter_boundary),
      lane_id: readString(entry.lane_id),
      capability_id: readString(entry.capability_id),
      selected_runtime_agent_provider: readRuntimeAgentProvider(
        entry.selected_runtime_agent_provider,
        fallbackRuntimeAgentProvider,
      ),
      requested_backend_provider: readString(entry.requested_backend_provider),
      requested_backend_provider_known: readBoolean(entry.requested_backend_provider_known),
      selected_backend_provider: readString(entry.selected_backend_provider),
      fallback_backend_provider: readString(entry.fallback_backend_provider),
      backend_selection_reason:
        readString(entry.backend_selection_reason) ??
        readString(entry.selection_reason),
      lane_visible: laneVisible,
      lane_requested: laneRequested,
      lane_executed: laneExecuted,
      observation_reentered: observationReentered,
      observation_ref: readString(entry.observation_ref),
      receipt_ref: readString(entry.receipt_ref),
      latest_visible_observation_ref:
        readString(entry.latest_visible_observation_ref) ||
        readString(entry.visible_observation_ref),
      latest_visible_receipt_ref:
        readString(entry.latest_visible_receipt_ref) ||
        readString(entry.visible_receipt_ref),
      latest_evidence_observation_ref:
        readString(entry.latest_evidence_observation_ref) ||
        readString(entry.evidence_observation_ref),
      latest_evidence_receipt_ref:
        readString(entry.latest_evidence_receipt_ref) ||
        readString(entry.evidence_receipt_ref),
      goal_id: readString(entry.goal_id),
      goal_binding_id: readString(entry.goal_binding_id),
      lane_session_id: readString(entry.lane_session_id),
      mail_loop_ref: readString(entry.mail_loop_ref),
      session_control_key: readString(entry.session_control_key),
      source_binding_key: readString(entry.source_binding_key) || readString(entry.latest_source_binding_key),
      latest_source_binding_key: readString(entry.latest_source_binding_key),
      lane_session_source_binding_key: readString(entry.lane_session_source_binding_key),
      lane_session_source_identity_key: normalizeDebugSourceIdentityKey(entry.lane_session_source_identity_key),
      source_identity_key: normalizeDebugSourceIdentityKey(entry.source_identity_key),
      latest_source_identity_key: normalizeDebugSourceIdentityKey(entry.latest_source_identity_key),
      latest_mail_loop_observation_key: readString(entry.latest_mail_loop_observation_key),
      latest_observation_key: readString(entry.latest_observation_key),
      observation_lane_session_id: readString(entry.observation_lane_session_id),
      ...(evidenceRefs.length > 0 ? { evidence_refs: evidenceRefs } : {}),
      latest_event_id: readString(entry.latest_event_id),
      session_status: readString(entry.session_status),
      session_health: readString(entry.session_health),
      session_debug_phase: readString(entry.session_debug_phase),
      session_observation_status: readString(entry.session_observation_status),
      session_lifecycle_action:
        readString(entry.session_lifecycle_action) ||
        readString(entry.lifecycle_action) ||
        readString(entry.session_action),
      session_reason:
        readString(entry.session_reason) ||
        readString(entry.latest_session_reason) ||
        readString(entry.reason),
      permission_profile: readString(entry.permission_profile),
      source_id: readString(entry.source_id) || readString(entry.latest_source_id),
      source_hash: readString(entry.source_hash) || readString(entry.latest_source_hash),
      source_kind: normalizeDebugSourceKind(entry.source_kind) || normalizeDebugSourceKind(entry.latest_source_kind),
      source_text_hash: readString(entry.source_text_hash),
      source_text_char_count: readScalarString(entry.source_text_char_count),
      projection_target: readString(entry.projection_target) || readString(entry.latest_projection_target),
      account_locale: readString(entry.account_locale) || readString(entry.latest_account_locale),
      target_language: readString(entry.target_language) || readString(entry.latest_target_language),
      chunk_id: readString(entry.chunk_id) || readString(entry.latest_chunk_id),
      chunk_index: readScalarString(entry.chunk_index) || readScalarString(entry.latest_chunk_index),
      dedupe_key: readString(entry.dedupe_key) || readString(entry.latest_dedupe_key),
      source_event_id: readString(entry.source_event_id) || readString(entry.latest_source_event_id),
      source_event_ms: readScalarString(entry.source_event_ms) || readScalarString(entry.latest_source_event_ms),
      observed_at_ms: readScalarString(entry.observed_at_ms) || readScalarString(entry.latest_observed_at_ms),
      freshness_status: readString(entry.freshness_status) || readString(entry.latest_freshness_status),
      cancel_requested: readBoolean(entry.cancel_requested) ?? readBoolean(entry.latest_cancel_requested),
      latest_mail_loop_wake_kind: readString(entry.latest_mail_loop_wake_kind),
      report_action: readString(entry.report_action),
      report_reason: readString(entry.report_reason),
      dispatch_target: readString(entry.dispatch_target),
      dispatch_admission_status: readString(entry.dispatch_admission_status),
      dispatch_blocked_reason: readString(entry.dispatch_blocked_reason),
      materialized_mail_loop_evidence: entry.materialized_mail_loop_evidence === true,
      mailbox_wake_expected:
        readBoolean(entry.mailbox_wake_expected) ??
        (readString(entry.latest_mail_loop_wake_kind) === "mailbox_wake" ? true : null) ??
        false,
      decision_wake_expected: readBoolean(entry.decision_wake_expected) ?? false,
      wake_dispatch_allowed: entry.wake_dispatch_allowed === true,
      side_effects_allowed: entry.side_effects_allowed === true,
      quiet_behavior_applied:
        readBoolean(entry.quiet_behavior_applied) ??
        readBoolean(readRecord(entry.report_decision)?.quiet_behavior_applied) ??
        false,
      wake_expected:
        readBoolean(entry.wake_expected) ??
        readBoolean(readRecord(entry.report_decision)?.wake_expected) ??
        false,
      surface_badge_expected:
        readBoolean(entry.surface_badge_expected) ??
        readBoolean(readRecord(entry.report_decision)?.surface_badge_expected) ??
        false,
      terminal_report_requested:
        readBoolean(entry.terminal_report_requested) ??
        readBoolean(readRecord(entry.report_decision)?.terminal_report_requested) ??
        false,
      terminal_report_authorized:
        readBoolean(entry.terminal_report_authorized) ??
        readBoolean(readRecord(entry.report_decision)?.terminal_report_authorized) ??
        false,
      terminal_authority_status: readString(entry.terminal_authority_status) ?? "not_terminal_authority",
      context_role: readTimelineContextRole(entry, stage),
      answer_authority: stage === "terminal_selected" && entry.answer_authority === true,
      terminal_eligible: canCarryTerminalAuthority && entry.terminal_eligible === true,
      assistant_answer: canCarryTerminalAuthority && entry.assistant_answer === true,
      raw_content_included: canCarryTerminalAuthority && entry.raw_content_included === true,
    };
  });

const timelineRowHasObservation = (entry: RecordLike): boolean => {
  const explicit = readBoolean(entry.has_observation) ?? readBoolean(entry.hasObservation);
  if (explicit !== null) return explicit;
  return Boolean(
    readString(entry.observation_ref) ||
    readString(entry.receipt_ref) ||
    readString(entry.latest_visible_observation_ref) ||
    readString(entry.visible_observation_ref) ||
    readString(entry.latest_visible_receipt_ref) ||
    readString(entry.visible_receipt_ref) ||
    readString(entry.latest_evidence_observation_ref) ||
    readString(entry.evidence_observation_ref) ||
    readString(entry.latest_evidence_receipt_ref) ||
    readString(entry.evidence_receipt_ref) ||
    readString(entry.latest_observation_key) ||
    readString(entry.latest_mail_loop_observation_key),
  );
};

export const buildCapabilityLaneTimelineSummary = (
  timeline: unknown,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const entries = readRecordArray(timeline);
  const stageSequence = entries
    .map((entry) => normalizeTimelineStage(entry.stage))
    .filter((stage): stage is string => Boolean(stage));
  const count = (stage: string): number => stageSequence.filter((entry) => entry === stage).length;
  const flagCount = (key: string): number =>
    entries.filter((entry) => entry[key] === true).length;
  const refCount = (key: string): number =>
    entries.filter((entry) => Boolean(readString(entry[key]))).length;
  const refAnyCount = (...keys: string[]): number =>
    entries.filter((entry) => keys.some((key) => Boolean(readString(entry[key])))).length;
  const observedStageCount = (stage: string): number =>
    entries.filter((entry) =>
      normalizeTimelineStage(entry.stage) === stage && timelineRowHasObservation(entry)
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
    observed_lane_activity_count: entries.filter(timelineRowHasObservation).length,
    goal_dispatch_plan_count: count("goal_plan"),
    goal_dispatch_admission_count: count("goal_admission"),
    goal_dispatch_readiness_count: count("goal_readiness"),
    lane_executed_count: flagCount("lane_executed"),
    visible_only_count: entries.filter((entry) =>
      entry.lane_visible === true && entry.lane_executed !== true
    ).length,
    observation_ref_count: refCount("observation_ref"),
    receipt_ref_count: refCount("receipt_ref"),
    latest_visible_observation_ref_count: refAnyCount("latest_visible_observation_ref", "visible_observation_ref"),
    latest_visible_receipt_ref_count: refAnyCount("latest_visible_receipt_ref", "visible_receipt_ref"),
    latest_evidence_observation_ref_count: refAnyCount("latest_evidence_observation_ref", "evidence_observation_ref"),
    latest_evidence_receipt_ref_count: refAnyCount("latest_evidence_receipt_ref", "evidence_receipt_ref"),
    session_lifecycle_action_count: entries.filter((entry) =>
      Boolean(
        readString(entry.session_lifecycle_action) ||
        readString(entry.lifecycle_action) ||
        readString(entry.session_action),
      )
    ).length,
    session_control_key_count: refCount("session_control_key"),
    session_debug_phase_count: refCount("session_debug_phase"),
    session_observation_status_count: refCount("session_observation_status"),
    source_binding_key_count: entries.filter((entry) =>
      Boolean(readString(entry.source_binding_key) || readString(entry.latest_source_binding_key))
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
    console_state_rows: buildConsoleStateRows(entries, fallbackRuntimeAgentProvider),
    visible_lane_does_not_mean_executed: true,
  };
};

const normalizeCapabilityLaneTimelineSummary = (
  summary: unknown,
  timeline: unknown,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const timelineEntries = readRecordArray(timeline);
  const explicit = readRecord(summary);
  const explicitRows = readRecordArray(explicit?.console_state_rows);
  const derived = buildCapabilityLaneTimelineSummary(
    timelineEntries.length > 0 ? timelineEntries : explicitRows,
    fallbackRuntimeAgentProvider,
  );

  if (!explicit) return derived;

  return {
    ...derived,
    ...explicit,
    console_state_rows: explicitRows.length > 0
      ? buildConsoleStateRows(explicitRows, fallbackRuntimeAgentProvider)
      : derived.console_state_rows,
    visible_lane_does_not_mean_executed: true,
  };
};

const normalizeMailLoopDebugSummary = (
  summary: RecordLike,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const wakeKind = typeof summary.stage_play_wake_kind === "string"
    ? summary.stage_play_wake_kind.trim()
    : "";
  const stagePlayWakeExpected = readBoolean(summary.stage_play_wake_expected) ?? false;
  const mailboxWakeExpected =
    readBoolean(summary.mailbox_wake_expected) ??
    (wakeKind === "mailbox_wake" ? true : null) ??
    stagePlayWakeExpected;
  if (wakeKind === "mailbox_wake" || wakeKind === "none") {
    const selectedRuntimeAgentProvider = readRuntimeAgentProvider(
      summary.selected_runtime_agent_provider,
      fallbackRuntimeAgentProvider,
    );
    return {
      ...summary,
      ...(selectedRuntimeAgentProvider
        ? { selected_runtime_agent_provider: selectedRuntimeAgentProvider }
        : {}),
      mailbox_wake_expected: mailboxWakeExpected,
      decision_wake_expected: readBoolean(summary.decision_wake_expected) ?? false,
      context_role: readString(summary.context_role) ?? "tool_evidence",
      answer_authority: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const selectedRuntimeAgentProvider = readRuntimeAgentProvider(
    summary.selected_runtime_agent_provider,
    fallbackRuntimeAgentProvider,
  );
  return {
    ...summary,
    ...(selectedRuntimeAgentProvider
      ? { selected_runtime_agent_provider: selectedRuntimeAgentProvider }
      : {}),
    context_role: readString(summary.context_role) ?? "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    stage_play_wake_kind: stagePlayWakeExpected ? "mailbox_wake" : "none",
    mailbox_wake_expected: mailboxWakeExpected,
    decision_wake_expected: readBoolean(summary.decision_wake_expected) ?? false,
  };
};

const normalizeCapabilityLaneEvidenceRecord = (
  record: RecordLike,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike => {
  const evidenceRefs = buildCapabilityLaneEvidenceRefs(record);
  const selectedRuntimeAgentProvider = readRuntimeAgentProvider(
    record.selected_runtime_agent_provider,
    fallbackRuntimeAgentProvider,
  );
  return {
    ...record,
    ...(evidenceRefs.length > 0 ? { evidence_refs: evidenceRefs } : {}),
    latest_receipt_ref:
      readString(record.latest_receipt_ref) ??
      readString(record.receipt_ref) ??
      readString(record.last_receipt_ref),
    ...(selectedRuntimeAgentProvider
      ? { selected_runtime_agent_provider: selectedRuntimeAgentProvider }
      : {}),
    context_role: readString(record.context_role) ?? "tool_evidence",
    answer_authority: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const readCapabilityLaneEvidenceRecords = (
  payload: RecordLike,
  debug: RecordLike | null,
  key: string,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike[] => {
  const payloadRecords = readRecordArray(payload[key]);
  const fallbackRecords = readRecordArray(debug?.[key]);
  return (payloadRecords.length > 0 ? payloadRecords : fallbackRecords)
    .map((record) => normalizeCapabilityLaneEvidenceRecord(record, fallbackRuntimeAgentProvider));
};

const readCapabilityLaneEvidenceRecord = (
  payload: RecordLike,
  debug: RecordLike | null,
  key: string,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike | null => {
  const record = readRecord(payload[key]) ?? readRecord(debug?.[key]);
  return record ? normalizeCapabilityLaneEvidenceRecord(record, fallbackRuntimeAgentProvider) : null;
};

const readCapabilityLaneMailLoopDebugSummaries = (
  payload: RecordLike,
  debug: RecordLike | null,
  fallbackRuntimeAgentProvider: string | null = null,
): RecordLike[] => {
  const explicit = [
    ...readRecordArray(payload.capability_lane_mail_loop_debug_summaries),
    ...readRecordArray(debug?.capability_lane_mail_loop_debug_summaries),
  ];
  if (explicit.length > 0) {
    return explicit.map((summary) =>
      normalizeMailLoopDebugSummary(summary, fallbackRuntimeAgentProvider),
    );
  }

  return [
    ...readRecordArray(payload.capability_lane_goal_binding_debug_summaries),
    ...readRecordArray(debug?.capability_lane_goal_binding_debug_summaries),
  ]
    .map((summary) => readRecord(summary.latest_mail_loop_summary))
    .filter((summary): summary is RecordLike => Boolean(summary))
    .map((summary) => normalizeMailLoopDebugSummary(summary, fallbackRuntimeAgentProvider));
};

export const buildCapabilityLaneDebugExportFields = (
  payload: RecordLike,
): RecordLike => {
  const debug = readRecord(payload.debug);
  const read = (key: string, fallback: unknown): unknown =>
    payload[key] ?? debug?.[key] ?? fallback;
  const capabilityLaneTurnTimeline = read("capability_lane_turn_timeline", []);
  const fallbackRuntimeAgentProvider = readRuntimeAgentProvider(
    payload.selected_runtime_agent_provider,
    payload.agent_runtime,
    payload.agentRuntime,
    debug?.selected_runtime_agent_provider,
    debug?.agent_runtime,
    debug?.agentRuntime,
  );
  const capabilityLaneTimelineSummary = read("capability_lane_timeline_summary", null);

  return {
    capability_lane_manifest: read("capability_lane_manifest", null),
    model_visible_capability_lane_manifest: read("model_visible_capability_lane_manifest", null),
    capability_lane_resolve_traces: read("capability_lane_resolve_traces", []),
    capability_lane_backend_selections: read("capability_lane_backend_selections", []),
    capability_lane_call_results: read("capability_lane_call_results", []),
    capability_lane_turn_timeline: capabilityLaneTurnTimeline,
    capability_lane_timeline_summary: normalizeCapabilityLaneTimelineSummary(
      capabilityLaneTimelineSummary,
      capabilityLaneTurnTimeline,
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_observation_packets: read("capability_lane_observation_packets", []),
    capability_lane_debug_events: read("capability_lane_debug_events", []),
    capability_lane_projection_receipts: read("capability_lane_projection_receipts", []),
    capability_lane_session_results: readCapabilityLaneEvidenceRecords(
      payload,
      debug,
      "capability_lane_session_results",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_session_debug_summaries: readCapabilityLaneEvidenceRecords(
      payload,
      debug,
      "capability_lane_session_debug_summaries",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_goal_binding_results: readCapabilityLaneEvidenceRecords(
      payload,
      debug,
      "capability_lane_goal_binding_results",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_mail_loop_debug_summaries: readCapabilityLaneMailLoopDebugSummaries(
      payload,
      debug,
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_goal_binding_debug_summaries: readCapabilityLaneEvidenceRecords(
      payload,
      debug,
      "capability_lane_goal_binding_debug_summaries",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_goal_dispatch_plans: readCapabilityLaneEvidenceRecords(
      payload,
      debug,
      "capability_lane_goal_dispatch_plans",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_goal_dispatch_admissions: readCapabilityLaneEvidenceRecords(
      payload,
      debug,
      "capability_lane_goal_dispatch_admissions",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_goal_dispatch_readiness: readCapabilityLaneEvidenceRecord(
      payload,
      debug,
      "capability_lane_goal_dispatch_readiness",
      fallbackRuntimeAgentProvider,
    ),
    capability_lane_reentry_status: read("capability_lane_reentry_status", null),
    runtime_lane_request_contract: read("runtime_lane_request_contract", null),
    runtime_lane_request_loop: read("runtime_lane_request_loop", null),
    runtime_lane_request_retry: read("runtime_lane_request_retry", null),
  };
};
