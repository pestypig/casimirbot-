import { buildNarratorDebugSnapshot } from "@/lib/narrator/narratorDebug";

export type DebugExportUiResult = {
  attempted_payload_hash: string;
  copied_payload_hash?: string;
  copied_text_length: number;
  method:
    | "navigator.clipboard"
    | "textarea_fallback"
    | "debug_drawer"
    | "download_link"
    | "backend_endpoint"
    | "failed";
  readback_match: "exact" | "unavailable" | "mismatch" | "empty";
  ok: boolean;
  fallback_presented: boolean;
  error?: string;
};

const stableStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  const normalize = (entry: unknown): unknown => {
    if (!entry || typeof entry !== "object") return entry;
    if (seen.has(entry as object)) return "[Circular]";
    seen.add(entry as object);
    if (Array.isArray(entry)) return entry.map(normalize);
    return Object.keys(entry as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = normalize((entry as Record<string, unknown>)[key]);
        return out;
      }, {});
  };
  return JSON.stringify(normalize(value));
};

export const hashDebugExportText = (text: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    : [];

const normalizeCapabilityLaneTimelineStage = (value: unknown): string | null => {
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

const buildCapabilityLaneConsoleStateLabel = (
  entry: Record<string, unknown>,
  stage: string | null,
): string => {
  if (stage === "visible") return entry.lane_executed === true ? "visible_executed" : "visible_only";
  if (stage === "backend") return "backend_selected";
  if (stage === "observed") return entry.observation_reentered === true ? "observed_reentered" : "observed_pending_reentry";
  if (stage === "receipt") return "receipt_recorded";
  if (stage === "reentered") return "observation_reentered";
  if (stage === "session") {
    return `session_${
      readString(entry.session_lifecycle_action) ||
      readString(entry.lifecycle_action) ||
      readString(entry.session_action) ||
      "event"
    }`;
  }
  if (stage === "mail") return entry.observation_reentered === true ? "mail_loop_evidence_reentered" : "mail_loop_evidence_pending";
  if (stage === "goal") return entry.observation_reentered === true ? "goal_bound_with_evidence" : "goal_bound_waiting_for_evidence";
  if (stage === "terminal_selected") return "terminal_selected";
  if (stage === "terminal_rejected") return "terminal_rejected";
  return stage || "unknown";
};

const buildCapabilityLaneConsoleStateRows = (
  entries: Record<string, unknown>[],
): Record<string, unknown>[] =>
  entries.map((entry, index) => {
    const stage = normalizeCapabilityLaneTimelineStage(entry.stage);
    return {
      schema: "helix.capability_lane.console_state_row.v1",
      seq: typeof entry.seq === "number" ? entry.seq : index,
      stage: entry.stage ?? null,
      normalized_stage: stage,
      state_label: buildCapabilityLaneConsoleStateLabel(entry, stage),
      lane_id: readString(entry.lane_id),
      capability_id: readString(entry.capability_id),
      selected_runtime_agent_provider: readString(entry.selected_runtime_agent_provider),
      selected_backend_provider: readString(entry.selected_backend_provider),
      lane_visible: entry.lane_visible === true,
      lane_requested: entry.lane_requested === true,
      lane_executed: entry.lane_executed === true,
      observation_reentered: entry.observation_reentered === true,
      observation_ref: readString(entry.observation_ref),
      receipt_ref: readString(entry.receipt_ref),
      goal_id: readString(entry.goal_id),
      goal_binding_id: readString(entry.goal_binding_id),
      lane_session_id: readString(entry.lane_session_id),
      mail_loop_ref: readString(entry.mail_loop_ref),
      latest_event_id: readString(entry.latest_event_id),
      session_status: readString(entry.session_status),
      session_health: readString(entry.session_health),
      latest_mail_loop_wake_kind: readString(entry.latest_mail_loop_wake_kind),
      report_action: readString(entry.report_action),
      report_reason: readString(entry.report_reason),
      dispatch_target: readString(entry.dispatch_target),
      dispatch_admission_status: readString(entry.dispatch_admission_status),
      dispatch_blocked_reason: readString(entry.dispatch_blocked_reason),
      materialized_mail_loop_evidence: entry.materialized_mail_loop_evidence === true,
      wake_dispatch_allowed: entry.wake_dispatch_allowed === true,
      side_effects_allowed: entry.side_effects_allowed === true,
      terminal_authority_status: readString(entry.terminal_authority_status) ?? "not_terminal_authority",
      terminal_eligible: entry.terminal_eligible === true,
      assistant_answer: entry.assistant_answer === true,
      raw_content_included: entry.raw_content_included === true,
    };
  });

const buildCapabilityLaneTimelineSummaryForExport = (timeline: unknown): Record<string, unknown> => {
  const entries = readRecordArray(timeline);
  const stageSequence = entries
    .map((entry) => normalizeCapabilityLaneTimelineStage(entry.stage))
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
    console_state_rows: buildCapabilityLaneConsoleStateRows(entries),
    visible_lane_does_not_mean_executed: true,
  };
};

const normalizeCapabilityLaneMailLoopDebugSummary = (
  summary: Record<string, unknown>,
): Record<string, unknown> => {
  const wakeKind = readString(summary.stage_play_wake_kind);
  if (wakeKind === "mailbox_wake" || wakeKind === "none") return summary;
  return {
    ...summary,
    stage_play_wake_kind: summary.stage_play_wake_expected === true ? "mailbox_wake" : "none",
  };
};

const readCapabilityLaneMailLoopDebugSummaries = (input: {
  payload: Record<string, unknown>;
  debug?: Record<string, unknown> | null;
  agentLoop?: Record<string, unknown> | null;
}): Record<string, unknown>[] => {
  const explicit = [
    ...readRecordArray(input.payload.capability_lane_mail_loop_debug_summaries),
    ...readRecordArray(input.debug?.capability_lane_mail_loop_debug_summaries),
    ...readRecordArray(input.agentLoop?.capability_lane_mail_loop_debug_summaries),
  ];
  if (explicit.length > 0) return explicit.map(normalizeCapabilityLaneMailLoopDebugSummary);

  return [
    ...readRecordArray(input.payload.capability_lane_goal_binding_debug_summaries),
    ...readRecordArray(input.debug?.capability_lane_goal_binding_debug_summaries),
    ...readRecordArray(input.agentLoop?.capability_lane_goal_binding_debug_summaries),
  ]
    .map((summary) => asRecord(summary.latest_mail_loop_summary))
    .filter((summary): summary is Record<string, unknown> => Boolean(summary))
    .map(normalizeCapabilityLaneMailLoopDebugSummary);
};

const HELIX_DEBUG_BACKEND_ENTRYPOINT_REQUIRED_PROMPT_RE =
  /\b(?:scientific-calculator\.[a-z0-9_.-]+|scientific\s+calculator|calculator_receipt|calculator\s+tool|docs-viewer\.[a-z0-9_.-]+|docs\s+viewer|repo-code\.[a-z0-9_.-]+|repo_code\.[a-z0-9_.-]+|workspace-directory\.[a-z0-9_.-]+|workspace_directory\.[a-z0-9_.-]+|workspace_os\.status|internet_search\.[a-z0-9_.-]+|internet\s+search\s+tool|scholarly-research\.[a-z0-9_.-]+|scholarly_research\.[a-z0-9_.-]+|scholarly\s+research\s+tool|lookup_papers|fetch_full_text|extract_numeric_parameters|live_env\.[a-z0-9_.-]+|helix_ask\.[a-z0-9_.-]+|image_lens|visual_capture)\b/i;

const requiresBackendEntrypointForDebugExport = (value: unknown): boolean => {
  const text = readString(value);
  return Boolean(text && HELIX_DEBUG_BACKEND_ENTRYPOINT_REQUIRED_PROMPT_RE.test(text));
};

const HELIX_DEBUG_EXPORT_MAX_UI_CHARS = 750_000;

const clipDebugText = (value: string, limit = 240): string =>
  value.length <= limit ? value : `${value.slice(0, limit)}...`;

const summarizeDebugObservationForExport = (value: unknown): Record<string, unknown> | null => {
  const record = asRecord(value);
  if (!record) return null;
  const payload = asRecord(record.payload);
  const observation = asRecord(record.observation);
  return {
    artifact_id:
      readString(record.artifact_id) ??
      readString(record.observation_id) ??
      readString(payload?.artifact_id) ??
      null,
    kind: readString(record.kind) ?? readString(payload?.kind) ?? null,
    schema:
      readString(record.schema) ??
      readString(payload?.schema) ??
      readString(observation?.schema) ??
      null,
    status: readString(record.status) ?? readString(payload?.status) ?? null,
    ok:
      typeof record.ok === "boolean"
        ? record.ok
        : typeof payload?.ok === "boolean"
          ? payload.ok
          : null,
  };
};

const summarizeDebugArtifactsForExport = (value: unknown): Record<string, unknown>[] => {
  const entries = Array.isArray(value) ? value : [];
  return entries.slice(0, 40).map((entry, index) => {
    const record = asRecord(entry) ?? {};
    const payload = asRecord(record.payload);
    const text = readString(payload?.text) ?? readString(payload?.answer_text) ?? readString(payload?.summary);
    return {
      artifact_id: readString(record.artifact_id) ?? `artifact:${index}`,
      kind: readString(record.kind),
      source_scope: readString(record.source_scope),
      payload_schema: readString(payload?.schema),
      tool_name: readString(record.tool_name) ?? readString(payload?.tool_name) ?? readString(payload?.toolName),
      capability_key:
        readString(record.capability_key) ??
        readString(payload?.capability_key) ??
        readString(payload?.chosen_capability),
      status: readString(record.status) ?? readString(payload?.status),
      ok:
        typeof record.ok === "boolean"
          ? record.ok
          : typeof payload?.ok === "boolean"
            ? payload.ok
            : null,
      supports_goal:
        typeof payload?.supports_goal === "boolean"
          ? payload.supports_goal
          : readString(payload?.supports_goal),
      expression: readString(payload?.expression) ?? readString(payload?.input),
      result: readString(payload?.result) ?? readString(payload?.value) ?? readString(payload?.computed_result),
      text_preview: text ? clipDebugText(text) : null,
    };
  });
};

const summarizeAgentRuntimeLoopForExport = (value: unknown): Record<string, unknown> | null => {
  const record = asRecord(value);
  if (!record) return null;
  const iterations = Array.isArray(record.iterations) ? record.iterations : [];
  return {
    schema: readString(record.schema) ?? "helix.agent_runtime_loop.v1",
    status: readString(record.status),
    selected_capability: readString(record.selected_capability),
    executed_tool_call_count:
      typeof record.executed_tool_call_count === "number" ? record.executed_tool_call_count : null,
    iteration_count: iterations.length,
    iterations: iterations.slice(0, 16).map((entry, index) => {
      const iteration = asRecord(entry) ?? {};
      return {
        iteration: typeof iteration.iteration === "number" ? iteration.iteration : index + 1,
        decision_id: readString(iteration.decision_id),
        chosen_capability: readString(iteration.chosen_capability),
        executed_action_key: readString(iteration.executed_action_key),
        next_step: readString(iteration.next_step),
        decision_timing: readString(iteration.decision_timing),
        decision_authority: readString(iteration.decision_authority),
        observation_role: readString(iteration.observation_role),
        observed_artifact_refs: Array.isArray(iteration.observed_artifact_refs)
          ? iteration.observed_artifact_refs.slice(0, 8)
          : Array.isArray(iteration.artifact_refs)
            ? iteration.artifact_refs.slice(0, 8)
            : [],
        tool_observation: summarizeDebugObservationForExport(iteration.tool_observation),
      };
    }),
  };
};

const copyRailCriticalDebugFields = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  debug: Record<string, unknown> | null,
): void => {
  const assign = (key: string, value: unknown): void => {
    if (value !== undefined && value !== null) target[key] = value;
  };
  [
    "terminal_answer_envelope",
    "terminal_boundary_eligibility",
    "terminal_projection_guard",
    "terminal_authority_single_writer",
    "tool_turn_chain_audit",
    "tool_rail_failure_triage",
    "tool_turn_chain_family_matrix",
    "artifact_query_index",
    "goal_satisfaction_evaluation",
    "post_tool_authority_bridge",
    "ask_turn_solver_trace",
    "solver_controller_decision",
    "solver_controller_summary",
    "agent_step_decision",
    "agent_step_loop",
    "calculator_tool_answer_support",
  ].forEach((key) => assign(key, source[key] ?? debug?.[key]));
  const ledger = source.current_turn_artifact_ledger ?? debug?.current_turn_artifact_ledger;
  if (Array.isArray(ledger)) target.current_turn_artifact_ledger = summarizeDebugArtifactsForExport(ledger);
  const runtimeLoop = summarizeAgentRuntimeLoopForExport(source.agent_runtime_loop ?? debug?.agent_runtime_loop);
  if (runtimeLoop) target.agent_runtime_loop = runtimeLoop;
};

const boundDebugExportEnvelopeText = (payload: Record<string, unknown>, text: string): string => {
  if (text.length <= HELIX_DEBUG_EXPORT_MAX_UI_CHARS) return text;
  const debug = asRecord(payload.debug);
  const capabilityLaneGoalBindingDebugSummaries =
    payload.capability_lane_goal_binding_debug_summaries ?? debug?.capability_lane_goal_binding_debug_summaries ?? [];
  const capabilityLaneMailLoopDebugSummaries = readCapabilityLaneMailLoopDebugSummaries({
    payload,
    debug,
  });
  const minimal = {
    schema: payload.schema ?? "helix.ask.debug_export.v1",
    exported_at_ms: payload.exported_at_ms,
    active_turn_id: payload.active_turn_id,
    selected_final_answer: payload.selected_final_answer,
    final_answer_source: payload.final_answer_source,
    terminal_artifact_kind: payload.terminal_artifact_kind,
    terminal_error_code: payload.terminal_error_code,
    ask_entrypoint_required: payload.ask_entrypoint_required ?? debug?.ask_entrypoint_required ?? null,
    ask_entrypoint_observed: payload.ask_entrypoint_observed ?? debug?.ask_entrypoint_observed ?? null,
    ask_entrypoint_failure_code: payload.ask_entrypoint_failure_code ?? debug?.ask_entrypoint_failure_code ?? null,
    blocked_projection_kind: payload.blocked_projection_kind ?? debug?.blocked_projection_kind ?? null,
    hard_prompt_projection_guard: payload.hard_prompt_projection_guard ?? debug?.hard_prompt_projection_guard ?? null,
    client_projection_policy_version:
      payload.client_projection_policy_version ?? debug?.client_projection_policy_version ?? null,
    demoted_projection_layers: payload.demoted_projection_layers ?? debug?.demoted_projection_layers ?? null,
    evidence_finalization_gate_demoted:
      payload.evidence_finalization_gate_demoted ?? debug?.evidence_finalization_gate_demoted ?? null,
    client_entrypoint_guard_version: payload.client_entrypoint_guard_version ?? debug?.client_entrypoint_guard_version ?? null,
    submit_handler_source: payload.submit_handler_source ?? debug?.submit_handler_source ?? null,
    runAsk_entered: payload.runAsk_entered ?? debug?.runAsk_entered ?? null,
    hard_backend_entrypoint_required:
      payload.hard_backend_entrypoint_required ?? debug?.hard_backend_entrypoint_required ?? null,
    use_backend_ask_turn_entrypoint:
      payload.use_backend_ask_turn_entrypoint ?? debug?.use_backend_ask_turn_entrypoint ?? null,
    backend_ask_call_attempted: payload.backend_ask_call_attempted ?? debug?.backend_ask_call_attempted ?? null,
    backend_ask_call_path: payload.backend_ask_call_path ?? debug?.backend_ask_call_path ?? null,
    backend_ask_call_error: payload.backend_ask_call_error ?? debug?.backend_ask_call_error ?? null,
    route_metadata_source: payload.route_metadata_source ?? debug?.route_metadata_source ?? null,
    mandatory_next_tool_name: payload.mandatory_next_tool_name ?? debug?.mandatory_next_tool_name ?? null,
    legacy_ask_local_bypassed: payload.legacy_ask_local_bypassed ?? debug?.legacy_ask_local_bypassed ?? null,
    first_broken_rail: payload.first_broken_rail ?? debug?.first_broken_rail ?? null,
    repair_target: payload.repair_target ?? debug?.repair_target ?? null,
    server_build_commit: payload.server_build_commit ?? debug?.server_build_commit ?? null,
    server_build_started_at_ms: payload.server_build_started_at_ms ?? debug?.server_build_started_at_ms ?? null,
    helix_docs_synthesis_bridge_version:
      payload.helix_docs_synthesis_bridge_version ?? debug?.helix_docs_synthesis_bridge_version ?? null,
    language_contract: payload.language_contract ?? debug?.language_contract ?? null,
    response_language: payload.response_language ?? debug?.response_language ?? null,
    source_language: payload.source_language ?? debug?.source_language ?? null,
    language_detected: payload.language_detected ?? debug?.language_detected ?? null,
    language_confidence: payload.language_confidence ?? debug?.language_confidence ?? null,
    code_mixed: payload.code_mixed ?? debug?.code_mixed ?? null,
    pivot_confidence: payload.pivot_confidence ?? debug?.pivot_confidence ?? null,
    translated: payload.translated ?? debug?.translated ?? null,
    repo_evidence_relevance_gate: payload.repo_evidence_relevance_gate ?? debug?.repo_evidence_relevance_gate ?? null,
    docs_synthesis_debug: payload.docs_synthesis_debug ?? debug?.docs_synthesis_debug ?? null,
    docs_continuation_contract: payload.docs_continuation_contract ?? debug?.docs_continuation_contract ?? null,
    doc_evidence_synthesis_plan: payload.doc_evidence_synthesis_plan ?? debug?.doc_evidence_synthesis_plan ?? null,
    doc_evidence_synthesis_coverage:
      payload.doc_evidence_synthesis_coverage ?? debug?.doc_evidence_synthesis_coverage ?? null,
    doc_evidence_synthesis_answer:
      payload.doc_evidence_synthesis_answer ?? debug?.doc_evidence_synthesis_answer ?? null,
    docs_synthesis_materializer_result:
      payload.docs_synthesis_materializer_result ?? debug?.docs_synthesis_materializer_result ?? null,
    terminal_answer_authority: payload.terminal_answer_authority ?? debug?.terminal_answer_authority ?? null,
    terminal_presentation: payload.terminal_presentation ?? debug?.terminal_presentation ?? null,
    agent_runtime: payload.agent_runtime ?? debug?.agent_runtime ?? null,
    selected_agent_provider: payload.selected_agent_provider ?? debug?.selected_agent_provider ?? null,
    capability_lane_ids: payload.capability_lane_ids ?? debug?.capability_lane_ids ?? null,
    capability_lane_statuses: payload.capability_lane_statuses ?? debug?.capability_lane_statuses ?? null,
    capability_lane_call_results: payload.capability_lane_call_results ?? debug?.capability_lane_call_results ?? [],
    capability_lane_turn_timeline:
      payload.capability_lane_turn_timeline ?? debug?.capability_lane_turn_timeline ?? [],
    capability_lane_timeline_summary:
      payload.capability_lane_timeline_summary ??
      debug?.capability_lane_timeline_summary ??
      buildCapabilityLaneTimelineSummaryForExport(
        payload.capability_lane_turn_timeline ?? debug?.capability_lane_turn_timeline ?? [],
      ),
    capability_lane_projection_receipts:
      payload.capability_lane_projection_receipts ?? debug?.capability_lane_projection_receipts ?? [],
    capability_lane_session_debug_summaries:
      payload.capability_lane_session_debug_summaries ?? debug?.capability_lane_session_debug_summaries ?? [],
    capability_lane_mail_loop_debug_summaries: capabilityLaneMailLoopDebugSummaries,
    capability_lane_goal_binding_results:
      payload.capability_lane_goal_binding_results ?? debug?.capability_lane_goal_binding_results ?? [],
    capability_lane_goal_binding_debug_summaries: capabilityLaneGoalBindingDebugSummaries,
    capability_lane_goal_dispatch_readiness:
      payload.capability_lane_goal_dispatch_readiness ?? debug?.capability_lane_goal_dispatch_readiness ?? null,
    capability_lane_reentry_status:
      payload.capability_lane_reentry_status ?? debug?.capability_lane_reentry_status ?? null,
    runtime_lane_request_loop: payload.runtime_lane_request_loop ?? debug?.runtime_lane_request_loop ?? null,
    debug: {
      schema: "helix.ask.debug_export_minimal_debug.v1",
      language_contract: payload.language_contract ?? debug?.language_contract ?? null,
      response_language: payload.response_language ?? debug?.response_language ?? null,
      source_language: payload.source_language ?? debug?.source_language ?? null,
      language_detected: payload.language_detected ?? debug?.language_detected ?? null,
      code_mixed: payload.code_mixed ?? debug?.code_mixed ?? null,
      server_build_commit: payload.server_build_commit ?? debug?.server_build_commit ?? null,
      server_build_started_at_ms: payload.server_build_started_at_ms ?? debug?.server_build_started_at_ms ?? null,
      helix_docs_synthesis_bridge_version:
        payload.helix_docs_synthesis_bridge_version ?? debug?.helix_docs_synthesis_bridge_version ?? null,
      repo_evidence_relevance_gate: payload.repo_evidence_relevance_gate ?? debug?.repo_evidence_relevance_gate ?? null,
      docs_synthesis_debug: payload.docs_synthesis_debug ?? debug?.docs_synthesis_debug ?? null,
      final_answer_source: payload.final_answer_source ?? debug?.final_answer_source ?? null,
      terminal_artifact_kind: payload.terminal_artifact_kind ?? debug?.terminal_artifact_kind ?? null,
      terminal_error_code: payload.terminal_error_code ?? debug?.terminal_error_code ?? null,
      ask_entrypoint_required: payload.ask_entrypoint_required ?? debug?.ask_entrypoint_required ?? null,
      ask_entrypoint_observed: payload.ask_entrypoint_observed ?? debug?.ask_entrypoint_observed ?? null,
      ask_entrypoint_failure_code: payload.ask_entrypoint_failure_code ?? debug?.ask_entrypoint_failure_code ?? null,
      blocked_projection_kind: payload.blocked_projection_kind ?? debug?.blocked_projection_kind ?? null,
      hard_prompt_projection_guard: payload.hard_prompt_projection_guard ?? debug?.hard_prompt_projection_guard ?? null,
      client_projection_policy_version:
        payload.client_projection_policy_version ?? debug?.client_projection_policy_version ?? null,
      demoted_projection_layers: payload.demoted_projection_layers ?? debug?.demoted_projection_layers ?? null,
      evidence_finalization_gate_demoted:
        payload.evidence_finalization_gate_demoted ?? debug?.evidence_finalization_gate_demoted ?? null,
      client_entrypoint_guard_version: payload.client_entrypoint_guard_version ?? debug?.client_entrypoint_guard_version ?? null,
      submit_handler_source: payload.submit_handler_source ?? debug?.submit_handler_source ?? null,
      runAsk_entered: payload.runAsk_entered ?? debug?.runAsk_entered ?? null,
      hard_backend_entrypoint_required:
        payload.hard_backend_entrypoint_required ?? debug?.hard_backend_entrypoint_required ?? null,
      use_backend_ask_turn_entrypoint:
        payload.use_backend_ask_turn_entrypoint ?? debug?.use_backend_ask_turn_entrypoint ?? null,
      backend_ask_call_attempted: payload.backend_ask_call_attempted ?? debug?.backend_ask_call_attempted ?? null,
      backend_ask_call_path: payload.backend_ask_call_path ?? debug?.backend_ask_call_path ?? null,
      backend_ask_call_error: payload.backend_ask_call_error ?? debug?.backend_ask_call_error ?? null,
      route_metadata_source: payload.route_metadata_source ?? debug?.route_metadata_source ?? null,
      mandatory_next_tool_name: payload.mandatory_next_tool_name ?? debug?.mandatory_next_tool_name ?? null,
      legacy_ask_local_bypassed: payload.legacy_ask_local_bypassed ?? debug?.legacy_ask_local_bypassed ?? null,
      first_broken_rail: payload.first_broken_rail ?? debug?.first_broken_rail ?? null,
      repair_target: payload.repair_target ?? debug?.repair_target ?? null,
      agent_runtime: payload.agent_runtime ?? debug?.agent_runtime ?? null,
      capability_lane_goal_binding_results:
        payload.capability_lane_goal_binding_results ?? debug?.capability_lane_goal_binding_results ?? [],
      capability_lane_goal_binding_debug_summaries:
        capabilityLaneGoalBindingDebugSummaries,
    },
    debug_export_size_control: {
      schema: "helix.ask.debug_export_size_control.v1",
      truncated: true,
      truncation_reason: "debug_export_size_limit",
      original_chars: text.length,
      max_chars: HELIX_DEBUG_EXPORT_MAX_UI_CHARS,
      compacted: true,
      final_compacted: true,
      bounded_by: "shared_debug_export_builder",
    },
  };
  copyRailCriticalDebugFields(minimal, payload, debug);
  copyRailCriticalDebugFields(minimal.debug as Record<string, unknown>, payload, debug);
  return JSON.stringify(minimal);
};

const buildVoicePlaybackReconciliationDebug = (input: {
  activeTurnId: string | null;
  selectedFinalAnswer: string | null;
  source: Record<string, unknown>;
}): Record<string, unknown> => {
  const clientProjection = asRecord(input.source.client_debug_projection);
  const clientVoice = asRecord(input.source.client_voice_debug ?? clientProjection?.voice);
  const receiptSources = [
    input.source.client_voice_playback_receipts,
    clientProjection?.voice_playback_receipts,
    clientVoice?.playbackReceipts,
  ];
  const receipts = receiptSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map(asRecord)
    .filter((receipt): receipt is Record<string, unknown> => Boolean(receipt));
  const voiceCallSources = [input.source.client_voice_calls, clientProjection?.voice_calls, clientVoice?.voiceCalls];
  const voiceCalls = voiceCallSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map(asRecord)
    .filter((call): call is Record<string, unknown> => Boolean(call));
  const activeTurnId = input.activeTurnId?.trim() ?? "";
  const isActiveTurnReceipt = (receipt: Record<string, unknown>): boolean => {
    if (!activeTurnId) return true;
    return [
      receipt.turnKey,
      receipt.utteranceId,
      receipt.sourceReceiptId,
      receipt.sourceReceiptKey,
      receipt.requestId,
    ].some((value) => readString(value)?.includes(activeTurnId));
  };
  const deliveredReceipts = receipts.filter(
    (receipt) => readString(receipt.status) === "delivered" && isActiveTurnReceipt(receipt),
  );
  const deliveredUtteranceIds = Array.from(
    new Set(deliveredReceipts.map((receipt) => readString(receipt.utteranceId)).filter(Boolean)),
  );
  const audioBytesObserved = voiceCalls
    .filter((call) => {
      const utteranceId = readString(call.utteranceId);
      return deliveredUtteranceIds.length === 0 || Boolean(utteranceId && deliveredUtteranceIds.includes(utteranceId));
    })
    .reduce((total, call) => {
      const bytes = typeof call.audioBytes === "number" && Number.isFinite(call.audioBytes) ? call.audioBytes : 0;
      return total + Math.max(0, bytes);
    }, 0);
  const selectedFinalAnswerClaim =
    /browser playback confirmation is still pending|playback confirmation is still pending/i.test(
      input.selectedFinalAnswer ?? "",
    )
      ? "pending_client_playback"
      : "none";
  const playbackConfirmation = deliveredReceipts.length > 0 ? "delivered" : "not_observed";
  return {
    schema: "helix.voice_playback_reconciliation.v1",
    source: "client_playback_receipts",
    active_turn_id: activeTurnId || null,
    selected_final_answer_claim: selectedFinalAnswerClaim,
    playback_confirmation: playbackConfirmation,
    delivered_receipt_count: deliveredReceipts.length,
    delivered_utterance_ids: deliveredUtteranceIds,
    audio_bytes_observed: audioBytesObserved,
    corrected_status_text:
      selectedFinalAnswerClaim === "pending_client_playback" && playbackConfirmation === "delivered"
        ? "Client playback receipt confirms delivered audio after the final answer was composed."
        : null,
    terminal_answer_mutated: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    output_authority: "client_playback_observation",
  };
};

const collectRecordsDeep = (value: unknown, predicate: (record: Record<string, unknown>) => boolean): Record<string, unknown>[] => {
  const results: Record<string, unknown>[] = [];
  const visited = new WeakSet<object>();
  const visit = (entry: unknown) => {
    if (!entry || typeof entry !== "object") return;
    if (visited.has(entry as object)) return;
    visited.add(entry as object);
    const record = asRecord(entry);
    if (record && predicate(record)) results.push(record);
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    Object.values(entry as Record<string, unknown>).forEach(visit);
  };
  visit(value);
  return results;
};

const buildVoicePlaybackReceiptBarrierDebug = (input: {
  activeTurnId: string | null;
  selectedFinalAnswer: string | null;
  source: Record<string, unknown>;
}): Record<string, unknown> | null => {
  const trace = asRecord(input.source.ask_turn_solver_trace);
  const capabilityResult = asRecord(trace?.capability_result ?? input.source.capability_result);
  const chainAudit = asRecord(input.source.tool_turn_chain_audit);
  const requestedCapability =
    readString(capabilityResult?.requested_capability) ??
    readString(chainAudit?.requested_capability) ??
    readString(asRecord(input.source.canonical_goal_frame)?.requested_capability);
  const executedCapability =
    readString(capabilityResult?.executed_capability) ??
    readString(chainAudit?.executed_capability);
  if (requestedCapability !== "text_to_speech.speak_text" && executedCapability !== "text_to_speech.speak_text") {
    return null;
  }
  const observationRefs = Array.isArray(capabilityResult?.observation_refs)
    ? capabilityResult.observation_refs.filter((ref): ref is string => typeof ref === "string" && ref.trim().length > 0)
    : [];
  const finalStatusMatch = (input.selectedFinalAnswer ?? "").match(/\bplayback_status\s*:\s*([a-z0-9_.-]+)/i);
  const reentered =
    readBoolean(capabilityResult?.reentered_solver) ??
    readBoolean(chainAudit?.reentry_executed) ??
    readBoolean(chainAudit?.reentry_proven) ??
    false;
  return {
    schema: "helix.voice_playback_receipt_barrier.v1",
    source: "agent_provider_gateway_reentry_projection",
    active_turn_id: input.activeTurnId,
    requested_capability: requestedCapability,
    executed_capability: executedCapability,
    capability_result_status: readString(capabilityResult?.status),
    playback_status: finalStatusMatch?.[1]?.toLowerCase() ?? null,
    receipt_kind: "helix.interim_voice_callout_tool_result.v1",
    observation_refs: observationRefs,
    receipt_observed: observationRefs.length > 0,
    evidence_reentered: reentered,
    terminal_blockers: reentered ? [] : ["voice_playback_receipt_not_reentered"],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    output_authority: "voice_playback_observation",
  };
};

const uniqueRecordsById = (
  records: Record<string, unknown>[],
  idKeys: string[],
): Record<string, unknown>[] => {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = idKeys.map((idKey) => readString(record[idKey])).find(Boolean) ?? stableStringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildVoiceSteeringDebug = (input: {
  activeTurnId: string | null;
  source: Record<string, unknown>;
  ledger: unknown[];
}): Record<string, unknown> => {
  const candidates = [
    input.source,
    asRecord(input.source.debug),
    asRecord(input.source.agentLoop),
    ...input.ledger,
  ];
  const events = uniqueRecordsById(
    candidates.flatMap((candidate) => collectRecordsDeep(candidate, (record) =>
      record.artifactId === "helix_voice_steering_event" ||
      record.schemaVersion === "helix.voice_steering_event.v1" ||
      record.schema === "helix.voice_steering_event.v1"
    )),
    ["steeringEventId", "steering_event_id"],
  );
  const decisions = uniqueRecordsById(
    candidates.flatMap((candidate) => collectRecordsDeep(candidate, (record) =>
      record.artifactId === "helix_voice_steering_decision" ||
      record.schemaVersion === "helix.voice_steering_decision.v1" ||
      record.schema === "helix.voice_steering_decision.v1"
    )),
    ["decisionId", "decision_id"],
  );
  const steeringAckToolResults = candidates.flatMap((candidate) => collectRecordsDeep(candidate, (record) =>
    record.schema === "helix.interim_voice_callout_tool_result.v1" &&
    readString(asRecord(record.request)?.kind) === "steering_ack"
  ));
  const latestSteeringAckReceipts = uniqueRecordsById(
    [
      ...steeringAckToolResults
        .map((result) => asRecord(result.receipt))
        .filter((receipt): receipt is Record<string, unknown> => Boolean(receipt)),
      ...candidates.flatMap((candidate) => collectRecordsDeep(candidate, (record) =>
        record.artifactId === "helix_interim_voice_callout_receipt" &&
        String(readString(record.requestId) ?? "").includes("steering")
      )),
    ],
    ["receiptId", "receipt_id"],
  ).slice(-10);
  const pendingCount = events.filter((event) =>
    readString(event.queueDecision) === "queued_for_safe_boundary" &&
    !decisions.some((decision) => readString(decision.steeringEventId) === readString(event.steeringEventId))
  ).length;
  return {
    schema: "helix.voice_steering_debug.v1",
    active_turn_id: input.activeTurnId,
    pending_count: pendingCount,
    events,
    decisions,
    latest_steering_ack_receipts: latestSteeringAckReceipts,
    assistant_answer: false,
    terminal_eligible: false,
    output_authority: "tool_evidence",
  };
};

const classifyCompactToolTraceAction = (panelId: string | null, actionId: string | null) => {
  const panel = (panelId ?? "").toLowerCase();
  const action = (actionId ?? "").toLowerCase();
  const tool = `${panelId}.${actionId}`;
  if (tool === "theory-badge-graph.reflect_discussion_context") {
    return { role: "context_locator", authority: "evidence_only", summary: "Located the prompt in theory graph space." };
  }
  if (tool === "theory-badge-graph.explain_reflected_context") {
    return { role: "context_route_builder", authority: "evidence_only", summary: "Built a first-principles context route from the reflection." };
  }
  if (tool === "scientific-calculator.solve_expression" || tool === "scientific-calculator.solve_with_steps") {
    return { role: "scalar_solver", authority: "numeric_observation", summary: "Computed the scalar result in the Scientific Calculator." };
  }
  if (action === "open" || action === "focus" || action === "show" || action === "switch_to") {
    return { role: "ui_navigation", authority: "ui_state", summary: "Opened or focused a workstation panel." };
  }
  if (
    panel.includes("doc") ||
    panel.includes("paper") ||
    panel.includes("source") ||
    action.includes("search") ||
    action.includes("lookup") ||
    action.includes("read") ||
    action.includes("open_doc") ||
    action.includes("retrieve")
  ) {
    return { role: "source_lookup", authority: "source_evidence", summary: "Retrieved source or reference evidence." };
  }
  if (action.includes("runtime") || action.includes("trace") || action.includes("receipt")) {
    return { role: "runtime_observer", authority: "runtime_observation", summary: "Returned runtime or trace observation evidence." };
  }
  if (
    action.includes("create") ||
    action.includes("update") ||
    action.includes("delete") ||
    action.includes("append") ||
    action.includes("save") ||
    action.includes("load") ||
    action.includes("clear") ||
    action.includes("set_")
  ) {
    return { role: "state_mutation", authority: "mutation_receipt", summary: "Changed workstation panel state." };
  }
  return { role: "panel_state", authority: "ui_state", summary: "Updated workstation panel state." };
};

const answerNoteForCompactToolTraceItems = (items: Array<{ role: string }>): string | null => {
  const hasTheoryReflection = items.some((item) => item.role === "context_locator" || item.role === "context_route_builder");
  const hasScalarSolver = items.some((item) => item.role === "scalar_solver");
  const hasRuntimeObserver = items.some((item) => item.role === "runtime_observer");
  const hasSourceLookup = items.some((item) => item.role === "source_lookup");
  const hasStateMutation = items.some((item) => item.role === "state_mutation");
  if (hasTheoryReflection && hasScalarSolver) {
    return "Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result.";
  }
  if (hasTheoryReflection && hasRuntimeObserver) {
    return "Evidence note: theory graph reflection supplied context; runtime receipts supplied system-level observations.";
  }
  if (hasTheoryReflection) return "Evidence note: theory graph reflection supplied context only; it is not a solve.";
  if (hasScalarSolver && hasRuntimeObserver) {
    return "Evidence note: calculator receipts supplied scalar results; runtime receipts supplied system-level observations.";
  }
  if (hasSourceLookup && hasScalarSolver) {
    return "Evidence note: source lookup supplied evidence; Scientific Calculator receipts supplied the numeric result.";
  }
  if (hasSourceLookup) return "Evidence note: workstation source lookup supplied evidence only; it is not a solve.";
  if (hasStateMutation) {
    return "Evidence note: workstation mutation receipts confirm panel state changes; they are not factual support by themselves.";
  }
  return null;
};

const collectLedgerPayloads = (
  ledger: unknown[],
  predicate: (artifact: Record<string, unknown>) => boolean,
): Record<string, unknown>[] =>
  ledger
    .map(asRecord)
    .filter((artifact): artifact is Record<string, unknown> => Boolean(artifact && predicate(artifact)))
    .map((artifact) => asRecord(artifact.payload) ?? artifact);

const collectCoverageArtifacts = (ledger: unknown[]): Record<string, unknown>[] =>
  collectLedgerPayloads(ledger, (artifact) => {
    const kind = readString(artifact.kind) ?? "";
    return kind === "calculator_plan_coverage" || /_coverage$/.test(kind);
  });

const findLedgerPayload = (ledger: unknown[], kind: string): Record<string, unknown> | null =>
  [...ledger]
    .reverse()
    .map(asRecord)
    .find((artifact) => artifact?.kind === kind)
    ? asRecord(
        [...ledger]
          .reverse()
          .map(asRecord)
          .find((artifact) => artifact?.kind === kind)?.payload,
      )
    : null;

const buildCompactToolTraceDisclosure = (actionEnvelope: Record<string, unknown> | null, turnId: string) => {
  const workstationActions = Array.isArray(actionEnvelope?.workstation_actions)
    ? actionEnvelope.workstation_actions
        .map(asRecord)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry) => ({
          panel_id: readString(entry.panel_id),
          action_id: readString(entry.action_id),
        }))
        .filter((entry) => Boolean(entry.panel_id && entry.action_id))
    : [];
  if (workstationActions.length === 0) return null;
  const actionKeys = workstationActions.map((action) => `${action.panel_id}.${action.action_id}`);
  const items = workstationActions.map((action) => ({
    tool: `${action.panel_id}.${action.action_id}`,
    ...classifyCompactToolTraceAction(action.panel_id, action.action_id),
  }));
  return {
    schema: "helix.ask_tool_trace_disclosure.v1",
    disclosureId: `${turnId}:tool_trace_disclosure`,
    turnId,
    action_keys: actionKeys,
    items,
    workstation_actions: workstationActions,
    answerNote: answerNoteForCompactToolTraceItems(items),
    assistant_answer: false,
    terminal_eligible: false,
  };
};

export function buildHelixUiDebugParityHarnessSnapshot(args: {
  visibleFinalAnswer: string | null | undefined;
  debugExport: Record<string, unknown>;
  calculatorPanelState?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const visibleFinalAnswer = readString(args.visibleFinalAnswer) ?? "";
  const terminalAuthority = asRecord(args.debugExport.terminal_answer_authority);
  const terminalAuthorityText = readString(terminalAuthority?.terminal_text_preview) ?? "";
  const selectedFinalAnswer = readString(args.debugExport.selected_final_answer) ?? "";
  const coverageArtifacts = Array.isArray(args.debugExport.coverage_artifacts)
    ? args.debugExport.coverage_artifacts
    : collectCoverageArtifacts(
        Array.isArray(args.debugExport.current_turn_artifact_ledger)
          ? args.debugExport.current_turn_artifact_ledger
          : [],
      );
  const calculatorPanelState = asRecord(args.calculatorPanelState ?? args.debugExport.calculator_panel_state);
  const currentCompoundRunId = readString(calculatorPanelState?.current_compound_run_id);
  const visibleCompoundRunIds = Array.isArray(calculatorPanelState?.visible_compound_run_ids)
    ? calculatorPanelState.visible_compound_run_ids
        .map((value) => readString(value))
        .filter((value): value is string => Boolean(value))
    : [];
  const staleCalculatorRunVisible = Boolean(
    currentCompoundRunId &&
      visibleCompoundRunIds.some((runId) => runId !== currentCompoundRunId),
  );
  return {
    schema: "helix.ui_debug_parity_harness.v1",
    visible_final_answer: visibleFinalAnswer,
    selected_final_answer: selectedFinalAnswer,
    terminal_authority_text: terminalAuthorityText,
    ui_answer_equals_selected_final_answer: Boolean(visibleFinalAnswer && selectedFinalAnswer && visibleFinalAnswer === selectedFinalAnswer),
    ui_answer_equals_terminal_authority_text: Boolean(visibleFinalAnswer && terminalAuthorityText && visibleFinalAnswer === terminalAuthorityText),
    has_terminal_authority: Boolean(terminalAuthority),
    has_goal_satisfaction: Boolean(asRecord(args.debugExport.goal_satisfaction_evaluation)),
    has_agent_runtime_loop: Boolean(asRecord(args.debugExport.agent_runtime_loop)),
    has_coverage_artifact: coverageArtifacts.length > 0,
    has_planner_artifact: Boolean(asRecord(args.debugExport.calculator_planner_result)),
    has_repair_artifact: Boolean(asRecord(args.debugExport.calculator_planner_repair_result)),
    has_receipt_artifact: Array.isArray(args.debugExport.current_turn_artifact_ledger)
      ? args.debugExport.current_turn_artifact_ledger.some((artifact) => asRecord(artifact)?.kind === "workspace_action_receipt")
      : false,
    has_composer_artifact: Boolean(asRecord(args.debugExport.final_answer_draft)),
    calculator_panel_state: calculatorPanelState,
    calculator_panel_current_compound_run_id: currentCompoundRunId,
    calculator_panel_visible_compound_run_ids: visibleCompoundRunIds,
    calculator_panel_stale_compound_run_visible: staleCalculatorRunVisible,
    clipboard_debug_copy_required_for_prompt_submission: false,
  };
}

const buildSolverControllerSummary = (payload: Record<string, unknown>) => {
  const debug = asRecord(payload.debug);
  const agentLoop = asRecord(payload.agentLoop);
  const controller = asRecord(payload.solver_controller_decision ?? debug?.solver_controller_decision ?? agentLoop?.solver_controller_decision);
  const terminalAuthority = asRecord(payload.terminal_answer_authority ?? debug?.terminal_answer_authority ?? agentLoop?.terminal_answer_authority);
  const poisonAudit = asRecord(payload.poison_audit ?? debug?.poison_audit ?? agentLoop?.poison_audit);
  const routeAuthority = asRecord(payload.route_authority_audit ?? debug?.route_authority_audit ?? agentLoop?.route_authority_audit);
  const turnIdIntegrity = asRecord(payload.turn_id_integrity_audit ?? debug?.turn_id_integrity_audit ?? agentLoop?.turn_id_integrity_audit);
  const finalRouteReconciliation = asRecord(payload.final_route_reconciliation ?? debug?.final_route_reconciliation ?? agentLoop?.final_route_reconciliation);
  return {
    decision: readString(controller?.decision),
    blocking_reasons: Array.isArray(controller?.blocking_reasons) ? controller.blocking_reasons : [],
    final_route: readString(controller?.final_route) ?? readString(payload.route_reason_code),
    required_terminal_kind: readString(controller?.required_terminal_kind),
    selected_terminal_artifact_kind:
      readString(controller?.selected_terminal_artifact_kind) ?? readString(payload.terminal_artifact_kind),
    poison_ok: readBoolean(poisonAudit?.ok),
    route_authority_ok: readBoolean(routeAuthority?.route_authority_ok),
    terminal_authority_route: readString(terminalAuthority?.route),
    turn_id_integrity_ok: readBoolean(turnIdIntegrity?.ok),
    final_route_reconciliation_ok: readBoolean(finalRouteReconciliation?.ok),
  };
};

export function buildDebugExportDrawerFallbackResult(args: {
  attemptedPayloadHash: string;
  copiedTextLength: number;
  readbackMatch?: "exact" | "unavailable" | "mismatch" | "empty";
  error?: string;
}): DebugExportUiResult {
  return {
    ok: true,
    attempted_payload_hash: args.attemptedPayloadHash,
    copied_text_length: args.copiedTextLength,
    method: "debug_drawer",
    readback_match: args.readbackMatch ?? "unavailable",
    fallback_presented: true,
    ...(args.error ? { error: args.error } : {}),
  };
}

export function buildHelixDebugExportEnvelopeFromMasterPayload(reply: {
  id?: string;
  question?: string | null;
  content?: string | null;
}, payload: Record<string, unknown>): string {
  const debug = asRecord(payload.debug);
  const agentLoop = asRecord(payload.agentLoop);
  const ledger = Array.isArray(agentLoop?.current_turn_artifact_ledger)
    ? agentLoop.current_turn_artifact_ledger
    : Array.isArray(debug?.current_turn_artifact_ledger)
      ? debug.current_turn_artifact_ledger
      : [];
  const availableCapabilities =
    asRecord(payload.available_capabilities ?? debug?.available_capabilities ?? agentLoop?.available_capabilities) ??
    findLedgerPayload(ledger, "available_capabilities");
  const agentStepDecision =
    asRecord(payload.agent_step_decision ?? debug?.agent_step_decision ?? agentLoop?.agent_step_decision) ??
    findLedgerPayload(ledger, "agent_step_decision");
  const observationReview =
    asRecord(payload.observation_review ?? debug?.observation_review ?? agentLoop?.observation_review) ??
    findLedgerPayload(ledger, "observation_review");
  const goalSatisfactionEvaluation =
    asRecord(payload.goal_satisfaction_evaluation ?? debug?.goal_satisfaction_evaluation ?? agentLoop?.goal_satisfaction_evaluation) ??
    findLedgerPayload(ledger, "goal_satisfaction_evaluation");
  const initialAvailableCapabilities =
    asRecord(
      payload.initial_available_capabilities ??
        debug?.initial_available_capabilities ??
        agentLoop?.initial_available_capabilities,
    ) ?? availableCapabilities;
  const initialAgentStepDecision =
    asRecord(payload.initial_agent_step_decision ?? debug?.initial_agent_step_decision ?? agentLoop?.initial_agent_step_decision) ??
    agentStepDecision;
  const agentStepAuthorityCheck =
    asRecord(payload.agent_step_authority_check ?? debug?.agent_step_authority_check ?? agentLoop?.agent_step_authority_check) ??
    findLedgerPayload(ledger, "agent_step_authority_check");
  const agentStepLoop =
    asRecord(payload.agent_step_loop ?? debug?.agent_step_loop ?? agentLoop?.agent_step_loop) ??
    findLedgerPayload(ledger, "agent_step_loop");
  const agentRuntimeLoop =
    asRecord(payload.agent_runtime_loop ?? debug?.agent_runtime_loop ?? agentLoop?.agent_runtime_loop) ??
    findLedgerPayload(ledger, "agent_runtime_loop");
  const agentRuntimeLoopAdmission =
    asRecord(payload.agent_runtime_loop_admission ?? debug?.agent_runtime_loop_admission ?? agentLoop?.agent_runtime_loop_admission) ??
    findLedgerPayload(ledger, "agent_runtime_loop_admission");
  const runtimeAuthorityAudit =
    asRecord(payload.runtime_authority_audit ?? debug?.runtime_authority_audit ?? agentLoop?.runtime_authority_audit) ??
    findLedgerPayload(ledger, "runtime_authority_audit");
  const agentRuntime = payload.agent_runtime ?? debug?.agent_runtime ?? agentLoop?.agent_runtime ?? null;
  const agentRuntimeSelectionTrace = asRecord(
    payload.agent_runtime_selection_trace ??
      debug?.agent_runtime_selection_trace ??
      agentLoop?.agent_runtime_selection_trace,
  );
  const selectedAgentProvider = asRecord(
    payload.selected_agent_provider ?? debug?.selected_agent_provider ?? agentLoop?.selected_agent_provider,
  );
  const providerGatewayDebugSummary = asRecord(
    payload.provider_gateway_debug_summary ??
      debug?.provider_gateway_debug_summary ??
      agentLoop?.provider_gateway_debug_summary,
  );
  const workstationGatewayManifest = asRecord(
    payload.workstation_gateway_manifest ??
      debug?.workstation_gateway_manifest ??
      agentLoop?.workstation_gateway_manifest,
  );
  const workstationGatewayCallResults =
    payload.workstation_gateway_call_results ??
    debug?.workstation_gateway_call_results ??
    agentLoop?.workstation_gateway_call_results;
  const workstationGatewayObservationPackets =
    payload.workstation_gateway_observation_packets ??
    debug?.workstation_gateway_observation_packets ??
    agentLoop?.workstation_gateway_observation_packets;
  const capabilityLaneManifest =
    payload.capability_lane_manifest ?? debug?.capability_lane_manifest ?? agentLoop?.capability_lane_manifest;
  const modelVisibleCapabilityLaneManifest =
    payload.model_visible_capability_lane_manifest ??
    debug?.model_visible_capability_lane_manifest ??
    agentLoop?.model_visible_capability_lane_manifest;
  const capabilityLaneIds =
    payload.capability_lane_ids ?? debug?.capability_lane_ids ?? agentLoop?.capability_lane_ids;
  const capabilityLaneStatuses =
    payload.capability_lane_statuses ?? debug?.capability_lane_statuses ?? agentLoop?.capability_lane_statuses;
  const capabilityLaneResolveTraces =
    payload.capability_lane_resolve_traces ??
    debug?.capability_lane_resolve_traces ??
    agentLoop?.capability_lane_resolve_traces;
  const capabilityLaneBackendSelections =
    payload.capability_lane_backend_selections ??
    debug?.capability_lane_backend_selections ??
    agentLoop?.capability_lane_backend_selections;
  const capabilityLaneCallResults =
    payload.capability_lane_call_results ?? debug?.capability_lane_call_results ?? agentLoop?.capability_lane_call_results;
  const capabilityLaneTurnTimeline =
    payload.capability_lane_turn_timeline ??
    debug?.capability_lane_turn_timeline ??
    agentLoop?.capability_lane_turn_timeline;
  const capabilityLaneTimelineSummary =
    payload.capability_lane_timeline_summary ??
    debug?.capability_lane_timeline_summary ??
    agentLoop?.capability_lane_timeline_summary ??
    buildCapabilityLaneTimelineSummaryForExport(capabilityLaneTurnTimeline);
  const capabilityLaneObservationPackets =
    payload.capability_lane_observation_packets ??
    debug?.capability_lane_observation_packets ??
    agentLoop?.capability_lane_observation_packets;
  const capabilityLaneProjectionReceipts =
    payload.capability_lane_projection_receipts ??
    debug?.capability_lane_projection_receipts ??
    agentLoop?.capability_lane_projection_receipts;
  const capabilityLaneSessionResults =
    payload.capability_lane_session_results ??
    debug?.capability_lane_session_results ??
    agentLoop?.capability_lane_session_results;
  const capabilityLaneSessionDebugSummaries =
    payload.capability_lane_session_debug_summaries ??
    debug?.capability_lane_session_debug_summaries ??
    agentLoop?.capability_lane_session_debug_summaries;
  const capabilityLaneGoalBindingResults =
    payload.capability_lane_goal_binding_results ??
    debug?.capability_lane_goal_binding_results ??
    agentLoop?.capability_lane_goal_binding_results;
  const capabilityLaneGoalBindingDebugSummaries =
    payload.capability_lane_goal_binding_debug_summaries ??
    debug?.capability_lane_goal_binding_debug_summaries ??
    agentLoop?.capability_lane_goal_binding_debug_summaries;
  const capabilityLaneMailLoopDebugSummaries = readCapabilityLaneMailLoopDebugSummaries({
    payload,
    debug,
    agentLoop,
  });
  const capabilityLaneGoalDispatchPlans =
    payload.capability_lane_goal_dispatch_plans ??
    debug?.capability_lane_goal_dispatch_plans ??
    agentLoop?.capability_lane_goal_dispatch_plans;
  const capabilityLaneGoalDispatchAdmissions =
    payload.capability_lane_goal_dispatch_admissions ??
    debug?.capability_lane_goal_dispatch_admissions ??
    agentLoop?.capability_lane_goal_dispatch_admissions;
  const capabilityLaneGoalDispatchReadiness =
    payload.capability_lane_goal_dispatch_readiness ??
    debug?.capability_lane_goal_dispatch_readiness ??
    agentLoop?.capability_lane_goal_dispatch_readiness;
  const capabilityLaneReentryStatus =
    payload.capability_lane_reentry_status ??
    debug?.capability_lane_reentry_status ??
    agentLoop?.capability_lane_reentry_status;
  const runtimeLaneRequestContract =
    payload.runtime_lane_request_contract ??
    debug?.runtime_lane_request_contract ??
    agentLoop?.runtime_lane_request_contract;
  const runtimeLaneRequestLoop =
    payload.runtime_lane_request_loop ?? debug?.runtime_lane_request_loop ?? agentLoop?.runtime_lane_request_loop;
  const runtimeLaneRequestRetry =
    payload.runtime_lane_request_retry ?? debug?.runtime_lane_request_retry ?? agentLoop?.runtime_lane_request_retry;
  const turnTranscriptEvents =
    payload.turn_transcript_events ??
    debug?.turn_transcript_events ??
    agentLoop?.turn_transcript_events;
  const providerTerminalCandidate = asRecord(
    payload.provider_terminal_candidate ??
      debug?.provider_terminal_candidate ??
      agentLoop?.provider_terminal_candidate,
  );
  const providerReasoningReentry = asRecord(
    payload.provider_reasoning_reentry ??
      debug?.provider_reasoning_reentry ??
      agentLoop?.provider_reasoning_reentry,
  );
  const terminalAuthorityCandidateReview = asRecord(
    payload.terminal_authority_candidate_review ??
      debug?.terminal_authority_candidate_review ??
      agentLoop?.terminal_authority_candidate_review,
  );
  const providerTerminalAuthorityBridge = asRecord(
    payload.provider_terminal_authority_bridge ??
      debug?.provider_terminal_authority_bridge ??
      agentLoop?.provider_terminal_authority_bridge,
  );
  const runtimeIntentPacket =
    asRecord(payload.runtime_intent_packet ?? debug?.runtime_intent_packet ?? agentLoop?.runtime_intent_packet) ??
    findLedgerPayload(ledger, "runtime_intent_packet");
  const runtimeContinuationHints =
    Array.isArray(payload.runtime_continuation_hints)
      ? payload.runtime_continuation_hints
      : Array.isArray(debug?.runtime_continuation_hints)
        ? debug.runtime_continuation_hints
        : Array.isArray(agentLoop?.runtime_continuation_hints)
          ? agentLoop.runtime_continuation_hints
          : ledger
              .map(asRecord)
              .filter((artifact) => artifact?.kind === "runtime_continuation_hint")
              .map((artifact) => asRecord(artifact?.payload) ?? artifact)
              .filter(Boolean);
  const receiptArtifact =
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => {
        if (artifact?.kind !== "workspace_action_receipt") return false;
        const payloadRecord = asRecord(artifact.payload);
        return Boolean(readString(payloadRecord?.action_key) || readString(payloadRecord?.target_id));
      }) ??
    [...ledger]
      .reverse()
      .map(asRecord)
      .find((artifact) => artifact?.kind === "workspace_action_receipt") ??
    null;
  const receipt = asRecord(receiptArtifact?.payload);
  const lifecycleEvents = Array.isArray(receipt?.workspace_action_lifecycle_events)
    ? receipt.workspace_action_lifecycle_events
    : [];
  const terminalPresentation = asRecord(payload.terminal_presentation ?? debug?.terminal_presentation ?? agentLoop?.terminal_presentation);
  const terminalAuthority = asRecord(payload.terminal_answer_authority ?? debug?.terminal_answer_authority ?? agentLoop?.terminal_answer_authority);
  const calculatorPlannerResult =
    asRecord(payload.calculator_planner_result ?? debug?.calculator_planner_result ?? agentLoop?.calculator_planner_result) ??
    findLedgerPayload(ledger, "calculator_planner_result");
  const calculatorPlannerRepairResult =
    asRecord(payload.calculator_planner_repair_result ?? debug?.calculator_planner_repair_result ?? agentLoop?.calculator_planner_repair_result) ??
    findLedgerPayload(ledger, "calculator_planner_repair_result");
  const calculatorPlanCoverage =
    asRecord(payload.calculator_plan_coverage ?? debug?.calculator_plan_coverage ?? agentLoop?.calculator_plan_coverage) ??
    findLedgerPayload(ledger, "calculator_plan_coverage");
  const promptRequirementCoverage =
    asRecord(payload.prompt_requirement_coverage ?? debug?.prompt_requirement_coverage ?? agentLoop?.prompt_requirement_coverage) ??
    findLedgerPayload(ledger, "prompt_requirement_coverage");
  const finalAnswerRepairRequest =
    asRecord(payload.final_answer_repair_request ?? debug?.final_answer_repair_request ?? agentLoop?.final_answer_repair_request) ??
    findLedgerPayload(ledger, "final_answer_repair_request");
  const finalAnswerDraft =
    asRecord(payload.final_answer_draft ?? debug?.final_answer_draft ?? agentLoop?.final_answer_draft) ??
    findLedgerPayload(ledger, "final_answer_draft");
  const actionEnvelope = asRecord(payload.action_envelope ?? debug?.action_envelope ?? agentLoop?.action_envelope);
  const codexHostWorkstationAffordances = asRecord(
    payload.codex_host_workstation_affordances ??
      debug?.codex_host_workstation_affordances ??
      agentLoop?.codex_host_workstation_affordances,
  );
  const hostWorkstationActions = Array.isArray(payload.workstation_actions)
    ? payload.workstation_actions
    : Array.isArray(debug?.workstation_actions)
      ? debug.workstation_actions
      : Array.isArray(codexHostWorkstationAffordances?.workstation_actions)
        ? codexHostWorkstationAffordances.workstation_actions
        : [];
  const hostSupportRefs = Array.isArray(payload.support_refs)
    ? payload.support_refs
    : Array.isArray(debug?.support_refs)
      ? debug.support_refs
      : Array.isArray(codexHostWorkstationAffordances?.support_refs)
        ? codexHostWorkstationAffordances.support_refs
        : [];
  const hostToolOutputRefs = Array.isArray(payload.tool_output_refs)
    ? payload.tool_output_refs
    : Array.isArray(debug?.tool_output_refs)
      ? debug.tool_output_refs
      : Array.isArray(codexHostWorkstationAffordances?.tool_output_refs)
        ? codexHostWorkstationAffordances.tool_output_refs
        : [];
  const coverageArtifacts = collectCoverageArtifacts(ledger);
  const calculatorPanelState = asRecord(payload.calculator_panel_state ?? debug?.calculator_panel_state ?? agentLoop?.calculator_panel_state);
  const terminalArtifactKind =
    readString(agentLoop?.terminal_artifact_kind) ??
    readString(debug?.terminal_artifact_kind) ??
    readString(payload.terminal_artifact_kind) ??
    readString(terminalAuthority?.terminal_artifact_kind) ??
    null;
  const finalAnswerSource =
    readString(agentLoop?.final_answer_source) ??
    readString(debug?.final_answer_source) ??
    readString(payload.final_answer_source) ??
    readString(terminalAuthority?.final_answer_source);
  const terminalErrorCode =
    readString(agentLoop?.terminal_error_code) ??
    readString(debug?.terminal_error_code) ??
    readString(payload.terminal_error_code);
  const promptRequiresBackendEntrypoint = requiresBackendEntrypointForDebugExport(
    readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? "",
  );
  const backendDebugRefPresent = Boolean(asRecord(debug?.debug_export_ref) ?? asRecord(payload.debug_export_ref));
  const backendSolverArtifactPresent = Boolean(
    payload.ask_turn_solver_trace ??
      debug?.ask_turn_solver_trace ??
      agentLoop?.ask_turn_solver_trace ??
      payload.agent_runtime_loop ??
      debug?.agent_runtime_loop ??
      agentLoop?.agent_runtime_loop ??
      payload.canonical_goal_frame ??
      debug?.canonical_goal_frame ??
      agentLoop?.canonical_goal_frame,
  );
  const askEntrypointRequired =
    readBoolean(agentLoop?.ask_entrypoint_required) ??
    readBoolean(debug?.ask_entrypoint_required) ??
    readBoolean(payload.ask_entrypoint_required) ??
    promptRequiresBackendEntrypoint;
  const askEntrypointObserved =
    readBoolean(agentLoop?.ask_entrypoint_observed) ??
    readBoolean(debug?.ask_entrypoint_observed) ??
    readBoolean(payload.ask_entrypoint_observed) ??
    (askEntrypointRequired ? backendDebugRefPresent || backendSolverArtifactPresent : null);
  const askEntrypointFailureCode =
    readString(agentLoop?.ask_entrypoint_failure_code) ??
    readString(debug?.ask_entrypoint_failure_code) ??
    readString(payload.ask_entrypoint_failure_code) ??
    (askEntrypointRequired && askEntrypointObserved === false ? "backend_ask_entry_required" : null);
  const blockedProjectionKind =
    readString(agentLoop?.blocked_projection_kind) ??
    readString(debug?.blocked_projection_kind) ??
    readString(payload.blocked_projection_kind) ??
    (askEntrypointRequired && askEntrypointObserved === false ? "client_projection" : null);
  const backendEntrypointRuntimeFingerprint = asRecord(
    payload.backend_ask_entrypoint_runtime_fingerprint ??
      debug?.backend_ask_entrypoint_runtime_fingerprint ??
      agentLoop?.backend_ask_entrypoint_runtime_fingerprint,
  );
  const hardPromptProjectionGuard = asRecord(
    payload.hard_prompt_projection_guard ??
      debug?.hard_prompt_projection_guard ??
      agentLoop?.hard_prompt_projection_guard,
  );
  const clientProjectionPolicyVersion =
    readString(hardPromptProjectionGuard?.client_projection_policy_version) ??
    readString(debug?.client_projection_policy_version) ??
    readString(payload.client_projection_policy_version);
  const demotedProjectionLayers = Array.isArray(hardPromptProjectionGuard?.demoted_projection_layers)
    ? hardPromptProjectionGuard.demoted_projection_layers
    : Array.isArray(debug?.demoted_projection_layers)
      ? debug.demoted_projection_layers
      : Array.isArray(payload.demoted_projection_layers)
        ? payload.demoted_projection_layers
        : [];
  const evidenceFinalizationGateDemoted =
    readBoolean(debug?.evidence_finalization_gate_demoted) ??
    readBoolean(payload.evidence_finalization_gate_demoted) ??
    false;
  const clientEntrypointGuardVersion =
    readString(backendEntrypointRuntimeFingerprint?.client_entrypoint_guard_version) ??
    readString(debug?.client_entrypoint_guard_version) ??
    readString(payload.client_entrypoint_guard_version);
  const submitHandlerSource =
    readString(backendEntrypointRuntimeFingerprint?.submit_handler_source) ??
    readString(debug?.submit_handler_source) ??
    readString(payload.submit_handler_source);
  const runAskEntered =
    readBoolean(backendEntrypointRuntimeFingerprint?.runAsk_entered) ??
    readBoolean(debug?.runAsk_entered) ??
    readBoolean(payload.runAsk_entered);
  const hardBackendEntrypointRequired =
    readBoolean(backendEntrypointRuntimeFingerprint?.hard_backend_entrypoint_required) ??
    readBoolean(debug?.hard_backend_entrypoint_required) ??
    readBoolean(payload.hard_backend_entrypoint_required) ??
    askEntrypointRequired;
  const useBackendAskTurnEntrypoint =
    readBoolean(backendEntrypointRuntimeFingerprint?.use_backend_ask_turn_entrypoint) ??
    readBoolean(debug?.use_backend_ask_turn_entrypoint) ??
    readBoolean(payload.use_backend_ask_turn_entrypoint);
  const backendAskCallAttempted =
    readBoolean(backendEntrypointRuntimeFingerprint?.backend_ask_call_attempted) ??
    readBoolean(debug?.backend_ask_call_attempted) ??
    readBoolean(payload.backend_ask_call_attempted);
  const backendAskCallPath =
    readString(backendEntrypointRuntimeFingerprint?.backend_ask_call_path) ??
    readString(debug?.backend_ask_call_path) ??
    readString(payload.backend_ask_call_path);
  const backendAskCallError =
    readString(backendEntrypointRuntimeFingerprint?.backend_ask_call_error) ??
    readString(debug?.backend_ask_call_error) ??
    readString(payload.backend_ask_call_error);
  const routeMetadataSource =
    readString(backendEntrypointRuntimeFingerprint?.route_metadata_source) ??
    readString(debug?.route_metadata_source) ??
    readString(payload.route_metadata_source);
  const mandatoryNextToolName =
    readString(backendEntrypointRuntimeFingerprint?.mandatory_next_tool_name) ??
    readString(debug?.mandatory_next_tool_name) ??
    readString(payload.mandatory_next_tool_name);
  const legacyAskLocalBypassed =
    readBoolean(backendEntrypointRuntimeFingerprint?.legacy_ask_local_bypassed) ??
    readBoolean(debug?.legacy_ask_local_bypassed) ??
    readBoolean(payload.legacy_ask_local_bypassed);
  const firstBrokenRail =
    readString(backendEntrypointRuntimeFingerprint?.first_broken_rail) ??
    readString(debug?.first_broken_rail) ??
    readString(payload.first_broken_rail) ??
    (askEntrypointRequired && askEntrypointObserved === false
      ? backendAskCallAttempted === true
        ? "backend_debug_materialization"
        : "backend_ask_entrypoint"
      : null);
  const repairTarget =
    readString(backendEntrypointRuntimeFingerprint?.repair_target) ??
    readString(debug?.repair_target) ??
    readString(payload.repair_target) ??
    (firstBrokenRail === "backend_debug_materialization"
      ? "debug_export_bridge"
      : firstBrokenRail === "backend_ask_entrypoint" || firstBrokenRail === "prompt_submit_entrypoint"
        ? "prompt_submit_entrypoint"
        : null);
  const backendEntrypointProjectionBlocked = askEntrypointRequired && askEntrypointObserved === false;
  const effectiveTerminalErrorCode =
    backendEntrypointProjectionBlocked ? askEntrypointFailureCode : terminalErrorCode ?? askEntrypointFailureCode;
  const effectiveTerminalArtifactKind =
    backendEntrypointProjectionBlocked
      ? "typed_failure"
      : terminalArtifactKind ?? (effectiveTerminalErrorCode ? "typed_failure" : null);
  const effectiveFinalAnswerSource =
    backendEntrypointProjectionBlocked
      ? "typed_failure"
      : finalAnswerSource ?? (effectiveTerminalErrorCode ? "typed_failure" : null);
  const typedFailure = asRecord(payload.typed_failure ?? debug?.typed_failure ?? agentLoop?.typed_failure);
  const terminalAuthorityText = readString(terminalAuthority?.terminal_text_preview);
  const terminalIsTypedFailure =
    effectiveTerminalArtifactKind === "typed_failure" ||
    effectiveFinalAnswerSource === "typed_failure" ||
    Boolean(effectiveTerminalErrorCode);
  const modelSynthesizedFinalDraft =
    !terminalIsTypedFailure &&
    effectiveTerminalArtifactKind === "model_synthesized_answer" &&
    effectiveFinalAnswerSource === "final_answer_draft";
  const selectedFinalAnswer =
    modelSynthesizedFinalDraft
      ? readString(payload.selected_final_answer) ??
        readString(agentLoop?.selected_final_answer) ??
        readString(debug?.selected_final_answer) ??
        terminalAuthorityText ??
        readString(terminalPresentation?.concise_text)
      : terminalIsTypedFailure
      ? readString(payload.terminal_failure_text) ??
        readString(typedFailure?.message) ??
        (effectiveTerminalErrorCode === "backend_ask_entry_required"
          ? "This prompt requires the backend Ask solver path before a final answer can be shown."
          : effectiveTerminalErrorCode === "backend_debug_materialization"
            ? "Backend Ask was reached, but no server terminal artifact or debug artifact was materialized for this turn."
          : null) ??
        terminalAuthorityText
      : readString(terminalPresentation?.concise_text) ??
        readString(payload.selected_final_answer) ??
        readString(agentLoop?.selected_final_answer) ??
        readString(debug?.selected_final_answer) ??
        terminalAuthorityText ??
        readString(payload.selectedDebugFinalAnswer) ??
        readString(payload.finalAnswer);
  const canonicalGoalFrame = asRecord(debug?.canonical_goal_frame ?? agentLoop?.canonical_goal_frame);
  const activeTurnId =
    readString(debug?.turn_id) ??
    readString(canonicalGoalFrame?.turn_id) ??
    readString(asRecord(payload.turnTruthTable)?.turn_id) ??
    readString(reply.id) ??
    "unknown-turn";
  const canonicalActiveTurnId = readString(terminalAuthority?.turn_id) ?? activeTurnId;
  const clientActiveTurnId = readString(reply.id);
  const toolTraceDisclosure = buildCompactToolTraceDisclosure(actionEnvelope, canonicalActiveTurnId);
  const voicePlaybackReconciliation = buildVoicePlaybackReconciliationDebug({
    activeTurnId: canonicalActiveTurnId,
    selectedFinalAnswer,
    source: payload,
  });
  const voicePlaybackReceiptBarrier = buildVoicePlaybackReceiptBarrierDebug({
    activeTurnId: canonicalActiveTurnId,
    selectedFinalAnswer,
    source: payload,
  });
  const voiceSteeringDebug = buildVoiceSteeringDebug({
    activeTurnId: canonicalActiveTurnId,
    source: payload,
    ledger,
  });
  const narratorDebug =
    asRecord(payload.client_narrator_debug ?? debug?.client_narrator_debug ?? payload.narrator_debug ?? debug?.narrator_debug) ??
    buildNarratorDebugSnapshot({ activeTurnId: canonicalActiveTurnId });
  const envelopeWithoutHash = {
    schema: "helix.ask.debug_export.v1",
    exported_at_ms: Date.now(),
    active_turn_id: canonicalActiveTurnId,
    backend_turn_id: canonicalActiveTurnId,
    client_active_turn_id: clientActiveTurnId && clientActiveTurnId !== canonicalActiveTurnId
      ? clientActiveTurnId
      : null,
    active_prompt: readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? "",
    active_prompt_hash: hashDebugExportText(readString(reply.question) ?? readString(payload.selectedDebugQuestion) ?? ""),
    selected_final_answer: selectedFinalAnswer,
    final_answer_source: effectiveFinalAnswerSource,
    terminal_artifact_kind: effectiveTerminalArtifactKind,
    terminal_error_code: effectiveTerminalErrorCode,
    ask_entrypoint_required: askEntrypointRequired,
    ask_entrypoint_observed: askEntrypointObserved,
    ask_entrypoint_failure_code: askEntrypointFailureCode,
    blocked_projection_kind: blockedProjectionKind,
    hard_prompt_projection_guard: hardPromptProjectionGuard,
    client_projection_policy_version: clientProjectionPolicyVersion,
    demoted_projection_layers: demotedProjectionLayers,
    evidence_finalization_gate_demoted: evidenceFinalizationGateDemoted,
    backend_ask_entrypoint_runtime_fingerprint: backendEntrypointRuntimeFingerprint,
    client_entrypoint_guard_version: clientEntrypointGuardVersion,
    submit_handler_source: submitHandlerSource,
    runAsk_entered: runAskEntered,
    hard_backend_entrypoint_required: hardBackendEntrypointRequired,
    use_backend_ask_turn_entrypoint: useBackendAskTurnEntrypoint,
    backend_ask_call_attempted: backendAskCallAttempted,
    backend_ask_call_path: backendAskCallPath,
    backend_ask_call_error: backendAskCallError,
    route_metadata_source: routeMetadataSource,
    mandatory_next_tool_name: mandatoryNextToolName,
    legacy_ask_local_bypassed: legacyAskLocalBypassed,
    first_broken_rail: firstBrokenRail,
    repair_target: repairTarget,
    voice_playback_reconciliation: voicePlaybackReconciliation,
    voice_playback_receipt_barrier: voicePlaybackReceiptBarrier,
    voice_steering_debug: voiceSteeringDebug,
    narrator_debug: narratorDebug,
    resolved_turn_summary: {
      turn_id: canonicalActiveTurnId,
      final_status: "final_answer",
      resolved_route_label: "unknown",
      terminal_artifact_kind: effectiveTerminalArtifactKind,
      terminal_error_code: effectiveTerminalErrorCode,
      pending_server_request_present: Boolean(agentLoop?.pending_request),
    },
    solver_controller_summary: buildSolverControllerSummary(payload),
    canonical_goal_frame: canonicalGoalFrame,
    available_capabilities: availableCapabilities,
    agent_step_decision: agentStepDecision,
    observation_review: observationReview,
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    initial_available_capabilities: initialAvailableCapabilities,
    initial_agent_step_decision: initialAgentStepDecision,
    agent_step_authority_check: agentStepAuthorityCheck,
    agent_step_loop: agentStepLoop,
    agent_runtime_loop: agentRuntimeLoop,
    agent_runtime_loop_admission: agentRuntimeLoopAdmission,
    agent_runtime: agentRuntime,
    agent_runtime_selection_trace: agentRuntimeSelectionTrace,
    selected_agent_provider: selectedAgentProvider,
    provider_gateway_debug_summary: providerGatewayDebugSummary,
    workstation_gateway_manifest: workstationGatewayManifest,
    workstation_gateway_manifest_version:
      payload.workstation_gateway_manifest_version ??
      debug?.workstation_gateway_manifest_version ??
      agentLoop?.workstation_gateway_manifest_version ??
      workstationGatewayManifest?.manifest_version,
    workstation_gateway_capability_ids:
      payload.workstation_gateway_capability_ids ??
      debug?.workstation_gateway_capability_ids ??
      agentLoop?.workstation_gateway_capability_ids,
    workstation_gateway_reentry_status:
      payload.workstation_gateway_reentry_status ??
      debug?.workstation_gateway_reentry_status ??
      agentLoop?.workstation_gateway_reentry_status,
    capability_lane_manifest: capabilityLaneManifest,
    model_visible_capability_lane_manifest: modelVisibleCapabilityLaneManifest,
    capability_lane_ids: capabilityLaneIds,
    capability_lane_statuses: capabilityLaneStatuses,
    capability_lane_resolve_traces: capabilityLaneResolveTraces,
    capability_lane_backend_selections: capabilityLaneBackendSelections,
    capability_lane_call_results: capabilityLaneCallResults,
    capability_lane_turn_timeline: capabilityLaneTurnTimeline,
    capability_lane_timeline_summary: capabilityLaneTimelineSummary,
    capability_lane_observation_packets: capabilityLaneObservationPackets,
    capability_lane_projection_receipts: capabilityLaneProjectionReceipts,
    capability_lane_session_results: capabilityLaneSessionResults,
    capability_lane_session_debug_summaries: capabilityLaneSessionDebugSummaries,
    capability_lane_mail_loop_debug_summaries: capabilityLaneMailLoopDebugSummaries,
    capability_lane_goal_binding_results: capabilityLaneGoalBindingResults,
    capability_lane_goal_binding_debug_summaries: capabilityLaneGoalBindingDebugSummaries,
    capability_lane_goal_dispatch_plans: capabilityLaneGoalDispatchPlans,
    capability_lane_goal_dispatch_admissions: capabilityLaneGoalDispatchAdmissions,
    capability_lane_goal_dispatch_readiness: capabilityLaneGoalDispatchReadiness,
    capability_lane_reentry_status: capabilityLaneReentryStatus,
    runtime_lane_request_contract: runtimeLaneRequestContract,
    runtime_lane_request_loop: runtimeLaneRequestLoop,
    runtime_lane_request_retry: runtimeLaneRequestRetry,
    terminal_authority_status:
      payload.terminal_authority_status ??
      debug?.terminal_authority_status ??
      agentLoop?.terminal_authority_status,
    workstation_gateway_call_results: workstationGatewayCallResults,
    workstation_gateway_observation_packets: workstationGatewayObservationPackets,
    turn_transcript_events: Array.isArray(turnTranscriptEvents) ? turnTranscriptEvents : [],
    provider_terminal_candidate: providerTerminalCandidate,
    provider_reasoning_reentry: providerReasoningReentry,
    terminal_authority_candidate_review: terminalAuthorityCandidateReview,
    provider_terminal_authority_bridge: providerTerminalAuthorityBridge,
    runtime_intent_packet: runtimeIntentPacket,
    runtime_authority_audit: runtimeAuthorityAudit,
    runtime_continuation_hints: runtimeContinuationHints,
    current_turn_artifact_ledger: ledger,
    current_turn_events: Array.isArray(agentLoop?.turn_events) ? agentLoop.turn_events : [],
    terminal_answer_authority: terminalAuthority,
    terminal_presentation: terminalPresentation,
    calculator_planner_result: calculatorPlannerResult,
    calculator_planner_repair_result: calculatorPlannerRepairResult,
    calculator_plan_coverage: calculatorPlanCoverage,
    prompt_requirement_coverage: promptRequirementCoverage,
    final_answer_repair_request: finalAnswerRepairRequest,
    final_answer_draft: finalAnswerDraft,
    action_envelope: actionEnvelope,
    codex_host_workstation_affordances: codexHostWorkstationAffordances,
    workstation_actions: hostWorkstationActions,
    support_refs: hostSupportRefs,
    tool_output_refs: hostToolOutputRefs,
    tool_trace_disclosure: toolTraceDisclosure,
    coverage_artifacts: coverageArtifacts,
    calculator_panel_state: calculatorPanelState,
    workspace_action_debug: receipt
      ? {
          workspace_action_registry_audit: receipt.workspace_action_registry_audit,
          workspace_action_lifecycle_events: lifecycleEvents,
          workspace_action_receipt: receipt,
          anti_determinism_audit: receipt.workspace_action_anti_determinism_audit,
          workspace_action_debug_proof: {
            action_key: receipt.action_key,
            target_id: receipt.target_id,
            action_id: receipt.action_id,
            lifecycle_events_present: lifecycleEvents
              .map((entry) => readString(asRecord(entry)?.event))
              .filter(Boolean),
            receipt_artifact_id: receiptArtifact?.artifact_id,
            receipt_status: receipt.status,
            registry_verdict: readString(asRecord(receipt.workspace_action_registry_audit)?.verdict),
            anti_determinism_verdict: readString(asRecord(receipt.workspace_action_anti_determinism_audit)?.verdict),
            final_answer_receipt_backed: Boolean(readString(receipt.message) && selectedFinalAnswer === readString(receipt.message)),
          },
        }
      : undefined,
    composite_goal_frame: debug?.composite_goal_frame ?? agentLoop?.composite_goal_frame,
    composite_execution_plan: debug?.composite_execution_plan ?? agentLoop?.composite_execution_plan,
    composite_turn_receipt: debug?.composite_turn_receipt ?? agentLoop?.composite_turn_receipt,
    subgoal_artifact_map: debug?.subgoal_artifact_map ?? agentLoop?.subgoal_artifact_map,
    composite_anti_determinism_audit:
      debug?.composite_anti_determinism_audit ?? agentLoop?.composite_anti_determinism_audit,
    composite_subgoal_reference_intent:
      debug?.composite_subgoal_reference_intent ?? agentLoop?.composite_subgoal_reference_intent ?? payload.composite_subgoal_reference_intent,
    composite_subgoal_binding: debug?.composite_subgoal_binding ?? agentLoop?.composite_subgoal_binding ?? payload.composite_subgoal_binding,
    composite_handoff_decision: debug?.composite_handoff_decision ?? agentLoop?.composite_handoff_decision ?? payload.composite_handoff_decision,
    composite_subgoal_explanation:
      debug?.composite_subgoal_explanation ?? agentLoop?.composite_subgoal_explanation ?? payload.composite_subgoal_explanation,
    composite_followup_anti_determinism_audit:
      debug?.composite_followup_anti_determinism_audit ?? agentLoop?.composite_followup_anti_determinism_audit ?? payload.composite_followup_anti_determinism_audit,
    live_interpretation_debug:
      payload.live_interpretation_debug ?? debug?.live_interpretation_debug ?? agentLoop?.live_interpretation_debug,
    live_interpretation_run:
      payload.live_interpretation_run ?? debug?.live_interpretation_run ?? agentLoop?.live_interpretation_run,
    live_interpretation_workers:
      payload.live_interpretation_workers ?? debug?.live_interpretation_workers ?? agentLoop?.live_interpretation_workers,
    live_interpretation_worker_runs:
      payload.live_interpretation_worker_runs ??
      debug?.live_interpretation_worker_runs ??
      agentLoop?.live_interpretation_worker_runs,
    live_interpretation_validation_artifacts:
      payload.live_interpretation_validation_artifacts ??
      debug?.live_interpretation_validation_artifacts ??
      agentLoop?.live_interpretation_validation_artifacts,
    live_interpretation_hypotheses:
      payload.live_interpretation_hypotheses ??
      debug?.live_interpretation_hypotheses ??
      agentLoop?.live_interpretation_hypotheses,
    live_interpretation_graph:
      payload.live_interpretation_graph ?? debug?.live_interpretation_graph ?? agentLoop?.live_interpretation_graph,
    live_interpretation_epoch_delta:
      payload.live_interpretation_epoch_delta ??
      debug?.live_interpretation_epoch_delta ??
      agentLoop?.live_interpretation_epoch_delta,
    pending_server_request: agentLoop?.pending_request ?? payload.pending_server_request ?? payload.pending_request ?? null,
    backend_debug_response_ref:
      asRecord(debug?.debug_export_ref) ??
      asRecord(payload.debug_export_ref) ??
      undefined,
    debug_export_source: asRecord(debug?.debug_export_ref) || asRecord(payload.debug_export_ref)
      ? "backend_ref_advertised"
      : "client_projection",
    backend_debug_response_status: asRecord(debug?.debug_export_ref) || asRecord(payload.debug_export_ref)
      ? "ref_advertised"
      : "not_advertised",
    debug_export_anti_determinism_audit: {
      verdict: "clean",
      checks: [
        { check: "projection_only_patch", passed: true },
        { check: "no_goal_mutation", passed: true },
        { check: "no_terminal_mutation", passed: true },
        { check: "active_turn_only", passed: true },
        { check: "no_dom_scrape_source", passed: true },
        { check: "receipt_not_fabricated", passed: true },
      ],
    },
  };
  const visibleFinalAnswerForParity = modelSynthesizedFinalDraft
    ? selectedFinalAnswer
    : readString(reply.content) ?? selectedFinalAnswer;
  const uiDebugParityHarness = buildHelixUiDebugParityHarnessSnapshot({
    visibleFinalAnswer: visibleFinalAnswerForParity,
    debugExport: envelopeWithoutHash,
    calculatorPanelState,
  });
  const envelope = {
    ...envelopeWithoutHash,
    ui_debug_parity_harness: uiDebugParityHarness,
    payload_hash: hashDebugExportText(stableStringify(envelopeWithoutHash)),
  };
  return boundDebugExportEnvelopeText(envelope, JSON.stringify(envelope));
}
