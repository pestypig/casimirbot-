import type {
  HelixCausalTurnEvent,
  HelixCausalTurnTimeline,
} from "@shared/helix-causal-turn-timeline";
import type { StagePlayLiveSourceMailTranscriptEntryV1 } from "@shared/contracts/stage-play-live-source-mail.v1";

type HelixAskTranscriptReply = {
  id: string;
  content?: unknown;
  liveEvents?: unknown[];
  debug?: any;
  [key: string]: any;
};

export type HelixTurnTranscriptRow = {
  key: string;
  role: string;
  label: string;
  text: string;
  meta: string;
  status: string;
};

function coerceText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function clipText(value: string, maxChars: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
}

function readAgentLoopAuditRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readAgentLoopAuditArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function dedupeStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function humanizeAskLiveEventToken(value: string): string {
  const cleaned = value
    .replace(/^Helix Ask:\s*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.replace(/\b(?:llm|api|id|url|ui)\b/gi, (token) => token.toUpperCase());
}

function resolveHelixTranscriptActionLabel(event: Record<string, unknown>): string | null {
  const directPanelId = coerceText(event.panel_id ?? event.panelId).trim();
  const directActionId = coerceText(event.action_id ?? event.actionId).trim();
  if (directPanelId && directActionId) return `${directPanelId}.${directActionId}`;

  const action =
    readAgentLoopAuditRecord(event.action) ??
    readAgentLoopAuditRecord(event.selected_action) ??
    readAgentLoopAuditRecord(event.tool_action);
  const panelId = coerceText(action?.panel_id ?? action?.panelId).trim();
  const actionId = coerceText(action?.action_id ?? action?.actionId).trim();
  if (panelId && actionId) return `${panelId}.${actionId}`;

  const stepId = coerceText(event.step_id ?? event.stepId).trim();
  if (/^workspace_action_locate_(?:exact|variant|doc)$/i.test(stepId)) {
    return "docs-viewer.locate_in_doc";
  }
  if (/^workspace_action_append_(?:location_reminder|to_note|doc_summary)$/i.test(stepId)) {
    return "workstation-notes.append_to_note";
  }
  if (/^workspace_action_docs_viewer_summarize_doc$/i.test(stepId)) {
    return "docs-viewer.summarize_doc";
  }
  if (/^workspace_action_docs_viewer_search_docs$/i.test(stepId)) {
    return "docs-viewer.search_docs";
  }

  const toolName = coerceText(event.tool ?? event.tool_name ?? event.capability).trim();
  return toolName || null;
}

function resolveHelixTranscriptRowLabel(event: Record<string, unknown>): string {
  const sourceEventType = coerceText(event.source_event_type).trim();
  if (sourceEventType === "runtime_selected") return "Runtime";
  if (sourceEventType === "action_request") return "Action Request";
  if (sourceEventType === "action_observation") return "Action Observation";
  if (sourceEventType === "tool_request") return "Tool Request";
  if (sourceEventType === "tool_observation") return "Tool Observation";
  if (sourceEventType === "model_reentry") return "Model Re-entry";
  if (sourceEventType === "terminal_answer") return "Final";

  const type = String(event.type ?? "event");
  const status = String(event.status ?? "");
  if (type === "public_commentary") return "Thinking";
  if (type === "plan") return "Plan";
  if (type === "model_decision") return status === "running" ? "Thinking" : "Decision";
  if (type === "step_started") return "Working";
  if (type === "receipt_pending") return "Working";
  if (type === "receipt_observed") return "Observation";
  if (type === "tool_result") return "Observation";
  if (type === "observation") return "Recorded";
  if (type === "decision") return "Decision";
  if (type === "final_answer") return "Final";
  return "Agent";
}

export function normalizeHelixVisibleEventText(value: unknown): string {
  return coerceText(value).replace(/\s+/g, " ").trim().toLowerCase();
}

function buildHelixVisibleActionReceiptKey(event: Record<string, unknown>): string | null {
  const type = String(event.type ?? event.kind ?? "");
  if (type !== "action_receipt" && type !== "workstation_action_receipt" && type !== "tool_result") return null;
  const text = normalizeHelixVisibleEventText(event.text);
  if (!text) return null;
  const turnKey = coerceText(event.turnKey ?? event.turn_key ?? event.traceId ?? event.trace_id);
  const status = coerceText(event.status);
  const stepId = coerceText(event.step_id ?? event.stepId);
  return [turnKey, type, status, stepId, text].filter(Boolean).join("|");
}

function dedupeHelixVisibleTranscriptEvents(events: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const event of events) {
    const key = buildHelixVisibleActionReceiptKey(event);
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(event);
  }
  return out;
}

const readHelixResolvedTurnSummary = (reply?: HelixAskTranscriptReply | null): Record<string, unknown> | null => {
  const record = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply?.debug);
  const turnTruthTable = readAgentLoopAuditRecord(record?.turn_truth_table ?? debugRecord?.turn_truth_table);
  return readAgentLoopAuditRecord(record?.resolved_turn_summary ?? debugRecord?.resolved_turn_summary ?? turnTruthTable?.resolved_turn_summary);
};

function readHelixRuntimeArtifactRefs(record: Record<string, unknown>): string[] {
  const refs = [
    record.observed_artifact_refs,
    record.artifact_refs,
    record.produced_artifacts,
    record.actual_artifacts,
    record.consumed_artifact_refs,
  ].flatMap((value) => (Array.isArray(value) ? value : []));
  return Array.from(new Set(refs.map((entry) => coerceText(entry).trim()).filter(Boolean)));
}

function summarizeHelixRuntimeArtifactRefs(refs: string[]): string {
  if (refs.length === 0) return "";
  const labels = refs.map((ref) => {
    if (/workstation[-_]tool[-_]eval|workstation_tool_evaluation/i.test(ref)) {
      return "workstation_tool_evaluation";
    }
    if (/theory[-_]ideology[-_]bridge|helix_theory_ideology_bridge_tool_result/i.test(ref)) {
      return "theory_ideology_bridge evidence";
    }
    const match = ref.match(
      /\b(?:doc_search_results|doc_summary|doc_open_receipt|doc_location_matches|calculator_receipt|workspace_action_receipt|note_update_receipt|runtime_tool_observation|tool_observation|final_answer_draft|direct_answer_text)\b/i,
    );
    if (match?.[0]) return match[0];
    const parts = ref.split(/[/:#]/).map((part) => part.trim()).filter(Boolean);
    const label = parts[parts.length - 1] ?? ref;
    return /^[a-f0-9]{12,}$/i.test(label) || /^\d+$/.test(label) ? "" : label;
  });
  const unique = Array.from(new Set(labels.filter(Boolean)));
  const visible = unique.slice(0, 5).join(", ");
  return unique.length > 5 ? `${visible}, +${unique.length - 5} more` : visible;
}

export function buildHelixRuntimeTranscriptEvents(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  const agentRuntimeLoop = readAgentLoopAuditRecord(
    replyRecord?.agent_runtime_loop ?? debugRecord?.agent_runtime_loop,
  );
  const iterations = readAgentLoopAuditArray(agentRuntimeLoop?.iterations);
  if (iterations.length === 0) return [];

  const turnId = coerceText(replyRecord?.turn_id ?? debugRecord?.turn_id ?? reply.id).trim();
  const events: Record<string, unknown>[] = [];
  iterations.slice(0, 24).forEach((item, index) => {
    const record = readAgentLoopAuditRecord(item);
    if (!record) return;
    const nextStep = coerceText(record.next_step ?? record.decision ?? "step").trim() || "step";
    const chosenCapability =
      coerceText(record.executed_action_key).trim() ||
      coerceText(record.chosen_capability).trim() ||
      coerceText(record.capability_key).trim() ||
      coerceText(record.tool_key).trim();
    const authority =
      coerceText(record.decision_authority).trim() ||
      coerceText(record.decision_source).trim() ||
      coerceText(record.sampling_mode).trim() ||
      "runtime";
    const decisionId = coerceText(record.decision_id ?? record.decision_ref).trim();
    const stepId = `runtime_${index + 1}`;
    const status =
      record.observation_role === "tool_error" || record.status === "failed"
        ? "failed"
        : nextStep === "ask_user"
          ? "request_input"
          : "completed";
    const refs = readHelixRuntimeArtifactRefs(record);
    const artifactSummary = summarizeHelixRuntimeArtifactRefs(refs);
    const decisionText =
      nextStep === "answer" || chosenCapability === "model.direct_answer"
        ? "Composed final answer from current observations."
        : chosenCapability
          ? `Selected ${chosenCapability}.`
          : `Selected ${nextStep}.`;
    events.push({
      id: `${reply.id}-runtime-${index}-decision`,
      role: "agent",
      type: "decision",
      status,
      text: decisionText,
      detail: chosenCapability || nextStep,
      lane: authority,
      step_id: stepId,
      turn_id: turnId,
      decision_id: decisionId,
      event_source: "agent_runtime_loop",
    });
    if (nextStep === "answer" || chosenCapability === "model.direct_answer") {
      events.push({
        id: `${reply.id}-runtime-${index}-final`,
        role: "agent",
        type: "observation",
        status,
        text: artifactSummary
          ? `Reviewed observed artifacts for terminal answer: ${artifactSummary}.`
          : "Reviewed observed artifacts for terminal answer.",
        detail: chosenCapability || "model.direct_answer",
        lane: authority,
        step_id: stepId,
        turn_id: turnId,
        decision_id: decisionId,
        event_source: "agent_runtime_loop",
      });
      return;
    }
    events.push({
      id: `${reply.id}-runtime-${index}-observation`,
      role: "tool",
      type: "tool_result",
      status,
      text: artifactSummary ? `Observed ${artifactSummary}.` : "Observed selected capability result.",
      detail: chosenCapability || nextStep,
      lane: chosenCapability || "tool",
      step_id: stepId,
      turn_id: turnId,
      decision_id: decisionId,
      event_source: "agent_runtime_loop",
    });
  });
  return events;
}

export function resolveHelixTurnTranscriptEvents(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  const finalAnswerSource =
    coerceText(replyRecord?.final_answer_source).trim() ||
    coerceText(debugRecord?.final_answer_source).trim();
  const terminalArtifactKind =
    coerceText(replyRecord?.terminal_artifact_kind).trim() ||
    coerceText(debugRecord?.terminal_artifact_kind).trim() ||
    coerceText(readHelixResolvedTurnSummary(reply)?.terminal_artifact_kind).trim();
  const filterSatisfiedWorkstationArtifacts =
    finalAnswerSource === "workstation_tool_evaluation" ||
    terminalArtifactKind === "workstation_tool_evaluation";
  const normalizeEvents = (events: unknown[]): Record<string, unknown>[] => {
    const records = events
      .map((entry) => readAgentLoopAuditRecord(entry))
      .filter(Boolean) as Record<string, unknown>[];
    const visible = filterSatisfiedWorkstationArtifacts
      ? records.filter((event) => {
          const status = coerceText(event.status).trim().toLowerCase();
          const text = coerceText(event.text).trim();
          const detail = coerceText(event.detail).trim();
          const combined = `${text}\n${detail}`;
          return (
            status !== "request_input" &&
            status !== "final_failure" &&
            !/\b(?:missing_artifacts|missing_required_artifacts|Need user input|Request input|final_failure)\b/i.test(combined)
          );
        })
      : records;
    return dedupeHelixVisibleTranscriptEvents(visible);
  };
  const runtimeEvents = buildHelixRuntimeTranscriptEvents(reply);
  if (runtimeEvents.length > 0) {
    return normalizeEvents(runtimeEvents);
  }
  const directEvents = Array.isArray(reply.debug?.turn_transcript_events)
    ? reply.debug.turn_transcript_events
    : [];
  if (directEvents.length > 0) {
    return normalizeEvents(directEvents);
  }
  const audit = readAgentLoopAuditRecord(reply.debug?.agent_loop_audit);
  const auditEvents = Array.isArray(audit?.turn_transcript_events) ? audit.turn_transcript_events : [];
  return normalizeEvents(auditEvents);
}

function readHelixPublicCommentaryEvents(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  const candidates = [
    replyRecord?.public_commentary_timeline,
    debugRecord?.public_commentary_timeline,
    readAgentLoopAuditRecord(debugRecord?.debug_export)?.public_commentary_timeline,
  ];
  const events = candidates.find(Array.isArray);
  if (!Array.isArray(events)) return [];
  const seen = new Set<string>();
  return events
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((event): event is Record<string, unknown> => {
      if (!event) return false;
      if (event.schema !== "helix.ask_public_commentary_event.v1") return false;
      if (event.assistant_answer !== false || event.raw_reasoning_included !== false) return false;
      const text = coerceText(event.text).trim();
      if (!text || /^[{[]/.test(text)) return false;
      if (/\b(?:turn_purpose|why_this_capability|expected_artifacts|observation_summary|next_step_reason)\b/i.test(text)) return false;
      const id = coerceText(event.event_id).trim() || text;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function buildHelixPublicCommentaryTranscriptRows(reply: HelixAskTranscriptReply): HelixTurnTranscriptRow[] {
  return readHelixPublicCommentaryEvents(reply).map((event, index) => {
    const timing = coerceText(event.timing).trim();
    const certainty = coerceText(event.certainty_class).trim();
    const expected = coerceText(event.expected_artifact).trim();
    const status = coerceText(event.status).trim() || "thinking";
    const label =
      timing === "final_ready"
        ? "Ready"
        : timing === "after_step"
          ? "Checked"
          : timing === "fail_closed"
            ? "Blocked"
            : timing === "before_step"
              ? "Thinking"
              : "Orienting";
    return {
      key: `${reply.id}-public-commentary-${coerceText(event.event_id).trim() || index}`,
      role: "agent",
      label,
      text: coerceText(event.text).trim(),
      meta: [timing, certainty, expected].filter(Boolean).join(" | "),
      status,
    };
  });
}

export function readHelixCausalTurnTimeline(reply: HelixAskTranscriptReply): HelixCausalTurnTimeline | null {
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  const timelineRecord =
    readAgentLoopAuditRecord(debugRecord?.causal_turn_timeline) ??
    readAgentLoopAuditRecord((reply as Record<string, unknown>).causal_turn_timeline);
  if (!timelineRecord) return null;
  if (timelineRecord.schema !== "helix.causal_turn_timeline.v1") return null;
  if (!Array.isArray(timelineRecord.events)) return null;
  return timelineRecord as HelixCausalTurnTimeline;
}

function readHelixCausalTraceLabel(event: HelixCausalTurnEvent): string {
  if (event.status === "blocked" || event.status === "failed") return "Notice";
  switch (event.stage) {
    case "prompt_received":
      return "Input";
    case "goal_classified":
    case "source_target_decided":
    case "route_label_set":
    case "tool_surface_built":
      return "Setup";
    case "model_step_requested":
    case "model_step_decided":
    case "model_answer_artifact_created":
      return event.stage === "model_step_decided" ? "Decision" : "Thinking";
    case "deterministic_fallback_considered":
    case "deterministic_fallback_used":
      return "Fallback";
    case "runtime_tool_call_validated":
    case "runtime_tool_dispatched":
      return "Working";
    case "tool_observation_created":
    case "repo_evidence_observation_created":
      return "Observation";
    case "coverage_gate_evaluated":
    case "quality_gate_evaluated":
    case "goal_satisfaction_evaluated":
    case "solver_controller_decided":
    case "projection_mismatch_checked":
      return "Gate";
    case "terminal_artifact_materialized":
    case "terminal_artifact_selected":
    case "terminal_candidate_rejected":
      return "Terminal";
    case "visible_response_written":
      return "Final";
    case "debug_export_written":
      return "Debug";
    default:
      return "Trace";
  }
}

function readHelixCausalTraceText(event: HelixCausalTurnEvent): string {
  const publicSummary = coerceText(event.public_summary).trim();
  if (publicSummary) return clipText(publicSummary, 260);

  const parts: string[] = [];
  const decision = coerceText(event.decision).trim();
  const routeLabel = coerceText(event.route_label).trim();
  const sourceTarget = coerceText(event.source_target).trim();
  const capability = coerceText(event.selected_capability ?? event.model_step_capability).trim();
  const reasonCode = coerceText(event.reason_code).trim();
  if (decision) parts.push(humanizeAskLiveEventToken(decision));
  if (capability) parts.push(`Capability: ${humanizeAskLiveEventToken(capability)}`);
  if (routeLabel) parts.push(`Route: ${humanizeAskLiveEventToken(routeLabel)}`);
  if (sourceTarget) parts.push(`Source: ${humanizeAskLiveEventToken(sourceTarget)}`);
  if (event.fallback?.used) {
    parts.push(`Fallback rule: ${humanizeAskLiveEventToken(event.fallback.rule_id ?? "used")}`);
  }
  if (event.terminal?.selected_terminal_artifact_kind) {
    parts.push(`Selected ${humanizeAskLiveEventToken(event.terminal.selected_terminal_artifact_kind)}`);
  }
  if (Array.isArray(event.rejected) && event.rejected.length > 0) {
    const reasons = dedupeStrings(event.rejected.map((entry) => entry.reason)).slice(0, 3);
    parts.push(`Rejected: ${reasons.map(humanizeAskLiveEventToken).join(", ")}`);
  }
  if (reasonCode) parts.push(`Reason: ${humanizeAskLiveEventToken(reasonCode)}`);
  return parts.length ? clipText(parts.join(". "), 260) : humanizeAskLiveEventToken(event.stage);
}

export function buildHelixCausalTurnTraceRows(reply: HelixAskTranscriptReply): HelixTurnTranscriptRow[] {
  const timeline = readHelixCausalTurnTimeline(reply);
  if (!timeline) return [];
  return timeline.events
    .filter((event) => {
      if (!event || event.raw_content_included !== false || event.assistant_answer !== false) return false;
      return event.stage !== "prompt_received" && event.stage !== "debug_export_written";
    })
    .sort((left, right) => left.sequence - right.sequence)
    .map((event) => {
      const meta = [
        humanizeAskLiveEventToken(event.producer),
        humanizeAskLiveEventToken(event.stage),
        event.status ? humanizeAskLiveEventToken(event.status) : "",
        event.reason_code ? humanizeAskLiveEventToken(event.reason_code) : "",
      ]
        .filter(Boolean)
        .join(" | ");
      return {
        key: `${reply.id}-causal-trace-${event.event_id || event.sequence}`,
        role: event.producer,
        label: readHelixCausalTraceLabel(event),
        text: readHelixCausalTraceText(event),
        meta,
        status: event.status ?? "succeeded",
      };
    });
}

export function buildHelixTurnTranscriptRows(reply: HelixAskTranscriptReply): HelixTurnTranscriptRow[] {
  const publicCommentaryRows = buildHelixPublicCommentaryTranscriptRows(reply);
  const transcriptEvents = resolveHelixTurnTranscriptEvents(reply);
  if (transcriptEvents.length > 0) {
    const lifecycleRows = transcriptEvents
      .filter((event) => {
        const type = String(event.type ?? "");
        const status = String(event.status ?? "");
        if (publicCommentaryRows.length > 0 && (type === "turn_completed" || type === "work_delta")) return false;
        if (publicCommentaryRows.length > 0 && type === "step_started") return false;
        return type !== "question" && type !== "turn_completed" && status !== "superseded";
      })
      .slice(-14)
      .map((event, index) => {
        const role = String(event.role ?? "agent");
        const type = String(event.type ?? "event");
        const status = String(event.status ?? "");
        const actionLabel = resolveHelixTranscriptActionLabel(event);
        const eventText = String(event.text ?? "");
        const rowText =
          actionLabel && !eventText.includes(actionLabel)
            ? `${actionLabel}: ${eventText || type}`
            : eventText;
        return {
          key: `${reply.id}-transcript-event-${index}`,
          role,
          label: resolveHelixTranscriptRowLabel(event),
          text: rowText,
          meta: [String(event.lane ?? ""), String(event.step_id ?? ""), actionLabel ?? "", status]
            .filter(Boolean)
            .join(" | "),
          status,
        };
      });
    if (publicCommentaryRows.length > 0) {
      const lifecycleWithoutGenericCompletions = lifecycleRows.filter((row) =>
        !/^Completed step\b/i.test(row.text),
      );
      return [...publicCommentaryRows, ...lifecycleWithoutGenericCompletions].slice(-14);
    }
    return lifecycleRows;
  }
  if (publicCommentaryRows.length > 0) return publicCommentaryRows.slice(-14);
  const plannerContract = readAgentLoopAuditRecord(reply.debug?.planner_contract);
  const runtimeSummary = readAgentLoopAuditRecord(reply.debug?.turn_runtime);
  const planItems = Array.isArray(plannerContract?.plan_items) ? plannerContract.plan_items : [];
  const observations = Array.isArray(runtimeSummary?.observations) ? runtimeSummary.observations : [];
  const rows: HelixTurnTranscriptRow[] = [];
  planItems.slice(0, 4).forEach((item, index) => {
    const record = readAgentLoopAuditRecord(item);
    rows.push({
      key: `${reply.id}-fallback-plan-${index}`,
      role: "agent",
      label: "Plan",
      text: String(record?.title ?? record?.id ?? "planned step"),
      meta: `${String(record?.lane ?? "step")} | ${String(record?.status ?? "planned")}`,
      status: String(record?.status ?? "planned"),
    });
  });
  observations.slice(-6).forEach((item, index) => {
    const record = readAgentLoopAuditRecord(item);
    const actualArtifacts = Array.isArray(record?.actual_artifacts)
      ? (record.actual_artifacts as unknown[]).map((entry) => String(entry)).filter(Boolean).join(", ")
      : "";
    rows.push({
      key: `${reply.id}-fallback-observation-${index}`,
      role: "tool",
      label: "Observation",
      text: actualArtifacts || String(record?.step_id ?? "step result"),
      meta: `${String(record?.lane ?? "step")} | ${String(record?.status ?? "completed")}`,
      status: String(record?.status ?? "completed"),
    });
  });
  return rows;
}

export function isDurableHelixAskMailTranscriptGroup(
  entries: StagePlayLiveSourceMailTranscriptEntryV1[],
): boolean {
  if (!entries.length) return false;
  return entries.some((entry) => {
    const row = entry.row;
    switch (row.rowKind) {
      case "final_answer":
      case "terminal_answer":
      case "typed_failure":
      case "text_answer":
        return true;
      default:
        return false;
    }
  });
}
