import type {
  HelixCausalTurnEvent,
  HelixCausalTurnTimeline,
} from "@shared/helix-causal-turn-timeline";
import type { StagePlayLiveSourceMailTranscriptEntryV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import { humanizeAskLiveEventToken } from "@/lib/helix/ask-display-text";
import {
  parseAskLiveEventTimestampMs,
  type AskLiveEventEntry,
} from "@/lib/helix/ask-debug-event-display";

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

function readFirstAgentLoopAuditArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return [];
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

function readTranscriptBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function buildAskLiveEventFromTurnTranscriptRecord(
  record: Record<string, unknown>,
  fallbackId: string,
  maxChars = 560,
): AskLiveEventEntry | null {
  const text = coerceText(record.text).trim();
  if (!text) return null;
  const type = coerceText(record.type).trim() || coerceText(record.source_event_type).trim() || "turn_transcript_event";
  const sourceEventType = coerceText(record.source_event_type).trim();
  const isTerminalAnswerEvent =
    sourceEventType === "terminal_answer" ||
    sourceEventType === "final_answer" ||
    type === "terminal_answer" ||
    type === "final_answer";
  const turnId = coerceText(record.turn_id ?? record.turnId ?? record.active_turn_id).trim();
  const atMs = typeof record.at_ms === "number" && Number.isFinite(record.at_ms) ? Math.trunc(record.at_ms) : null;
  const ts = atMs ? new Date(atMs).toISOString() : undefined;
  const seq = typeof record.seq === "number" && Number.isFinite(record.seq) ? Math.trunc(record.seq) : undefined;
  return {
    id: coerceText(record.id).trim() || fallbackId,
    text: isTerminalAnswerEvent ? text : clipText(text, maxChars),
    tool: coerceText(record.role).trim() || "agent",
    ts,
    tsMs: atMs ?? parseAskLiveEventTimestampMs(record.ts) ?? undefined,
    seq,
    durationMs:
      typeof record.durationMs === "number" && Number.isFinite(record.durationMs)
        ? Math.max(0, Math.round(record.durationMs))
        : undefined,
    meta: {
      stage: type,
      detail: coerceText(record.detail).trim() || null,
      status: coerceText(record.status).trim() || null,
      stepId: coerceText(record.step_id).trim() || null,
      lane: coerceText(record.lane).trim() || null,
      capabilityId: coerceText(record.capability_id).trim() || null,
      laneSessionId: coerceText(record.lane_session_id).trim() || null,
      selectedBackendProvider: coerceText(record.selected_backend_provider).trim() || null,
      backendCostClass: coerceText(record.cost_class).trim() || null,
      backendLatencyClass: coerceText(record.latency_class).trim() || null,
      backendPrivacyClass: coerceText(record.privacy_class).trim() || null,
      fallbackBackendProvider: coerceText(record.fallback_backend_provider).trim() || null,
      receiptRef: coerceText(record.receipt_ref).trim() || null,
      observationRef: coerceText(record.observation_ref).trim() || null,
      terminalEligible: readTranscriptBoolean(record.terminal_eligible),
      assistantAnswer: readTranscriptBoolean(record.assistant_answer),
      rawContentIncluded: readTranscriptBoolean(record.raw_content_included),
      source_event_type: sourceEventType || type,
      event_source: coerceText(record.event_source).trim() || "live",
      turn_id: turnId || null,
      reconstructed: record.reconstructed === true,
      stream_event: "turn_transcript_event",
    },
  };
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
  if (sourceEventType === "context_state") return "Context";
  if (sourceEventType === "action_request") return "Action Request";
  if (sourceEventType === "action_observation") return "Action Observation";
  if (sourceEventType === "tool_request") return "Tool Request";
  if (sourceEventType === "tool_observation") return "Tool Observation";
  if (sourceEventType === "compound_itinerary") return "Itinerary";
  if (sourceEventType === "model_reentry") return "Model Re-entry";
  if (sourceEventType === "lane_requested") return "Lane Request";
  if (sourceEventType === "lane_backend_selected") return "Lane Backend";
  if (sourceEventType === "lane_observation") return "Lane Observation";
  if (sourceEventType === "lane_projection_receipt") return "Lane Receipt";
  if (sourceEventType === "lane_reentered") return "Lane Re-entry";
  if (sourceEventType === "lane_session") return "Lane Session";
  if (sourceEventType === "lane_mail_loop") return "Lane Mail";
  if (sourceEventType === "lane_goal_binding") return "Goal Lane";
  if (sourceEventType === "lane_goal_dispatch_plan") return "Goal Dispatch";
  if (sourceEventType === "lane_goal_dispatch_admission") return "Goal Admission";
  if (sourceEventType === "lane_goal_dispatch_readiness") return "Goal Readiness";
  if (sourceEventType === "terminal_selected") return "Terminal";
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

function readHelixGatewayProjectionSources(reply: HelixAskTranscriptReply): {
  replyRecord: Record<string, unknown> | null;
  debugRecord: Record<string, unknown> | null;
  agentLoopRecord: Record<string, unknown> | null;
  debugExportRecord: Record<string, unknown> | null;
} {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  const agentLoopRecord = readAgentLoopAuditRecord(
    replyRecord?.agent_runtime_loop ??
      debugRecord?.agent_runtime_loop ??
      replyRecord?.agent_loop_audit ??
      debugRecord?.agent_loop_audit,
  );
  const debugExportRecord = readAgentLoopAuditRecord(
    debugRecord?.debug_export ?? replyRecord?.debug_export,
  );
  return { replyRecord, debugRecord, agentLoopRecord, debugExportRecord };
}

function readHelixWorkstationGatewayCallResults(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.workstation_gateway_call_results,
    replyRecord?.workstation_gateway_results,
    debugRecord?.workstation_gateway_call_results,
    debugRecord?.workstation_gateway_results,
    agentLoopRecord?.workstation_gateway_call_results,
    agentLoopRecord?.workstation_gateway_results,
    debugExportRecord?.workstation_gateway_call_results,
    debugExportRecord?.workstation_gateway_results,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixWorkstationGatewayObservationPackets(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.workstation_gateway_observation_packets,
    debugRecord?.workstation_gateway_observation_packets,
    agentLoopRecord?.workstation_gateway_observation_packets,
    debugExportRecord?.workstation_gateway_observation_packets,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneCallResults(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_call_results,
    replyRecord?.capability_lane_results,
    debugRecord?.capability_lane_call_results,
    debugRecord?.capability_lane_results,
    agentLoopRecord?.capability_lane_call_results,
    agentLoopRecord?.capability_lane_results,
    debugExportRecord?.capability_lane_call_results,
    debugExportRecord?.capability_lane_results,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneObservationPackets(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_observation_packets,
    debugRecord?.capability_lane_observation_packets,
    agentLoopRecord?.capability_lane_observation_packets,
    debugExportRecord?.capability_lane_observation_packets,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneProjectionReceipts(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_projection_receipts,
    debugRecord?.capability_lane_projection_receipts,
    agentLoopRecord?.capability_lane_projection_receipts,
    debugExportRecord?.capability_lane_projection_receipts,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneResolveTraces(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  const directTrace =
    readAgentLoopAuditRecord(replyRecord?.capability_lane_resolve_trace) ??
    readAgentLoopAuditRecord(debugRecord?.capability_lane_resolve_trace) ??
    readAgentLoopAuditRecord(agentLoopRecord?.capability_lane_resolve_trace) ??
    readAgentLoopAuditRecord(debugExportRecord?.capability_lane_resolve_trace);
  const arrayTraces = readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_resolve_traces,
    debugRecord?.capability_lane_resolve_traces,
    agentLoopRecord?.capability_lane_resolve_traces,
    debugExportRecord?.capability_lane_resolve_traces,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  return directTrace ? [directTrace, ...arrayTraces] : arrayTraces;
}

function readHelixCapabilityLaneBackendSelections(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_backend_selections,
    debugRecord?.capability_lane_backend_selections,
    agentLoopRecord?.capability_lane_backend_selections,
    debugExportRecord?.capability_lane_backend_selections,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneDebugEvents(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_debug_events,
    debugRecord?.capability_lane_debug_events,
    agentLoopRecord?.capability_lane_debug_events,
    debugExportRecord?.capability_lane_debug_events,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .sort((left, right) => {
      const leftSeq = typeof left.seq === "number" && Number.isFinite(left.seq) ? left.seq : 0;
      const rightSeq = typeof right.seq === "number" && Number.isFinite(right.seq) ? right.seq : 0;
      return leftSeq - rightSeq;
    });
}

function readHelixCapabilityLaneGoalBindingDebugSummaries(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_goal_binding_debug_summaries,
    debugRecord?.capability_lane_goal_binding_debug_summaries,
    agentLoopRecord?.capability_lane_goal_binding_debug_summaries,
    debugExportRecord?.capability_lane_goal_binding_debug_summaries,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneGoalDispatchPlans(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  const directPlans = readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_goal_dispatch_plans,
    debugRecord?.capability_lane_goal_dispatch_plans,
    agentLoopRecord?.capability_lane_goal_dispatch_plans,
    debugExportRecord?.capability_lane_goal_dispatch_plans,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  if (directPlans.length > 0) return directPlans;

  return readHelixCapabilityLaneGoalBindingDebugSummaries(reply)
    .map((summary) => readAgentLoopAuditRecord(summary.dispatch_plan))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneGoalDispatchAdmissions(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  const directAdmissions = readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_goal_dispatch_admissions,
    debugRecord?.capability_lane_goal_dispatch_admissions,
    agentLoopRecord?.capability_lane_goal_dispatch_admissions,
    debugExportRecord?.capability_lane_goal_dispatch_admissions,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  if (directAdmissions.length > 0) return directAdmissions;

  return readHelixCapabilityLaneGoalBindingDebugSummaries(reply)
    .map((summary) => readAgentLoopAuditRecord(summary.dispatch_admission))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneGoalDispatchReadiness(reply: HelixAskTranscriptReply): Record<string, unknown> | null {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readAgentLoopAuditRecord(replyRecord?.capability_lane_goal_dispatch_readiness) ??
    readAgentLoopAuditRecord(debugRecord?.capability_lane_goal_dispatch_readiness) ??
    readAgentLoopAuditRecord(agentLoopRecord?.capability_lane_goal_dispatch_readiness) ??
    readAgentLoopAuditRecord(debugExportRecord?.capability_lane_goal_dispatch_readiness);
}

function readHelixCapabilityLaneSessionDebugSummaries(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_session_debug_summaries,
    debugRecord?.capability_lane_session_debug_summaries,
    agentLoopRecord?.capability_lane_session_debug_summaries,
    debugExportRecord?.capability_lane_session_debug_summaries,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneMailLoopDebugSummaries(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return readFirstAgentLoopAuditArray(
    replyRecord?.capability_lane_mail_loop_debug_summaries,
    debugRecord?.capability_lane_mail_loop_debug_summaries,
    agentLoopRecord?.capability_lane_mail_loop_debug_summaries,
    debugExportRecord?.capability_lane_mail_loop_debug_summaries,
  )
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

function readHelixCapabilityLaneReentryStatus(reply: HelixAskTranscriptReply): string {
  const { replyRecord, debugRecord, agentLoopRecord, debugExportRecord } = readHelixGatewayProjectionSources(reply);
  return (
    coerceText(replyRecord?.capability_lane_reentry_status).trim() ||
    coerceText(debugRecord?.capability_lane_reentry_status).trim() ||
    coerceText(agentLoopRecord?.capability_lane_reentry_status).trim() ||
    coerceText(debugExportRecord?.capability_lane_reentry_status).trim()
  );
}

function readHelixCapabilityLaneTerminalKind(reply: HelixAskTranscriptReply): string {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const debugRecord = readAgentLoopAuditRecord(reply.debug);
  return (
    coerceText(replyRecord?.terminal_artifact_kind).trim() ||
    coerceText(debugRecord?.terminal_artifact_kind).trim() ||
    coerceText(readHelixResolvedTurnSummary(reply)?.terminal_artifact_kind).trim() ||
    coerceText(replyRecord?.final_answer_source).trim() ||
    coerceText(debugRecord?.final_answer_source).trim()
  );
}

function readHelixCapabilityLaneId(record: Record<string, unknown>): string {
  const trace = readAgentLoopAuditRecord(record.lane_resolve_trace);
  return (
    coerceText(record.lane_id).trim() ||
    coerceText(record.laneId).trim() ||
    coerceText(record.requested_lane).trim() ||
    coerceText(trace?.requested_lane).trim() ||
    coerceText(trace?.selected_lane).trim()
  );
}

function readHelixCapabilityLaneCapability(record: Record<string, unknown>): string {
  const request = readAgentLoopAuditRecord(record.request);
  return (
    coerceText(record.capability).trim() ||
    coerceText(record.capability_id).trim() ||
    coerceText(record.capability_key).trim() ||
    coerceText(request?.capability).trim() ||
    readHelixCapabilityLaneId(record)
  );
}

function readHelixCapabilityLaneObservationPacketForCall(
  call: Record<string, unknown>,
  packets: Record<string, unknown>[],
): Record<string, unknown> | null {
  const directPacket = readAgentLoopAuditRecord(call.observation_packet);
  if (directPacket) return directPacket;
  const capability = readHelixCapabilityLaneCapability(call);
  const laneId = readHelixCapabilityLaneId(call);
  const observationRef = coerceText(call.observation_ref).trim();
  return packets.find((packet) => {
    const packetCapability =
      coerceText(packet.capability_key).trim() ||
      coerceText(packet.capability_id).trim() ||
      coerceText(packet.capability).trim();
    const packetLane = coerceText(packet.lane_id).trim() || coerceText(packet.lane).trim();
    const packetRef =
      coerceText(packet.observation_ref).trim() ||
      coerceText(packet.artifact_ref).trim() ||
      coerceText(packet.ref).trim();
    return Boolean(
      (capability && packetCapability === capability) ||
        (laneId && packetLane === laneId) ||
        (observationRef && packetRef === observationRef),
    );
  }) ?? null;
}

function readHelixCapabilityLaneTraceForCall(
  call: Record<string, unknown>,
  traces: Record<string, unknown>[],
): Record<string, unknown> | null {
  const directTrace = readAgentLoopAuditRecord(call.lane_resolve_trace);
  if (directTrace) return directTrace;
  const laneId = readHelixCapabilityLaneId(call);
  const capability = readHelixCapabilityLaneCapability(call);
  return traces.find((trace) => {
    const traceLane =
      coerceText(trace.requested_lane).trim() ||
      coerceText(trace.selected_lane).trim() ||
      coerceText(trace.lane_id).trim();
    const traceCapability =
      coerceText(trace.capability).trim() ||
      coerceText(trace.capability_id).trim() ||
      coerceText(trace.capability_key).trim();
    return Boolean((laneId && traceLane === laneId) || (capability && traceCapability === capability));
  }) ?? null;
}

function hasSucceededHelixCapabilityLanePacket(packet: Record<string, unknown> | null, call: Record<string, unknown>): boolean {
  if (call.ok !== true) return false;
  const status = coerceText(packet?.status).trim().toLowerCase();
  return status !== "blocked" && status !== "failed" && status !== "missing_input" && status !== "needs_confirmation";
}

function readHelixCapabilityLaneSessionId(
  call: Record<string, unknown>,
  packet: Record<string, unknown> | null,
): string {
  const observation = readAgentLoopAuditRecord(call.observation);
  const request = readAgentLoopAuditRecord(call.request);
  const stateDelta = readAgentLoopAuditRecord(packet?.state_delta);
  const translationChunk = readAgentLoopAuditRecord(stateDelta?.live_translation_chunk);
  return (
    coerceText(call.lane_session_id).trim() ||
    coerceText(observation?.lane_session_id).trim() ||
    coerceText(request?.lane_session_id).trim() ||
    coerceText(translationChunk?.lane_session_id).trim()
  );
}

function summarizeHelixCapabilityLaneBackend(trace: Record<string, unknown> | null): string {
  const decision = readAgentLoopAuditRecord(trace?.backend_selection_decision);
  const selectedBackend =
    coerceText(trace?.selected_backend_provider).trim() ||
    coerceText(trace?.backend_provider).trim() ||
    coerceText(trace?.backend_provider_id).trim();
  const requestedBackend = coerceText(trace?.requested_backend_provider).trim();
  const requestedAvailability = coerceText(trace?.requested_backend_availability_status).trim();
  const requestedPermission = coerceText(trace?.requested_backend_permission_status).trim();
  const requestedConfiguration = coerceText(trace?.requested_backend_configuration_status).trim();
  const selectionReason = coerceText(trace?.selection_reason).trim();
  const decisionOutcome = coerceText(decision?.outcome).trim();
  const runtimeRootPreserved = decision?.selected_runtime_provider_remains_root === true;
  const noLiveBackend = decision?.live_backend_execution_enabled === false;
  const terminalOwner = coerceText(decision?.terminal_authority_owner).trim();
  const availability = coerceText(trace?.availability_status).trim();
  const permission = coerceText(trace?.permission_status).trim();
  const cost = coerceText(trace?.cost_class).trim();
  const latency = coerceText(trace?.latency_class).trim();
  const privacy = coerceText(trace?.privacy_class).trim();
  const fallback = coerceText(trace?.fallback_backend_provider).trim();
  const parts = [
    selectedBackend ? `selected ${selectedBackend}` : "",
    requestedBackend ? `requested ${requestedBackend}` : "",
    requestedConfiguration ? `requested configuration ${requestedConfiguration}` : "",
    requestedAvailability ? `requested availability ${requestedAvailability}` : "",
    requestedPermission ? `requested permission ${requestedPermission}` : "",
    decisionOutcome ? `decision ${decisionOutcome}` : "",
    runtimeRootPreserved ? "runtime root preserved" : "",
    noLiveBackend ? "no live backend execution" : "",
    terminalOwner ? `terminal authority ${terminalOwner}` : "",
    selectionReason ? `reason ${selectionReason}` : "",
    availability ? `availability ${availability}` : "",
    permission ? `permission ${permission}` : "",
    cost ? `cost ${cost}` : "",
    latency ? `latency ${latency}` : "",
    privacy ? `privacy ${privacy}` : "",
    fallback ? `fallback ${fallback}` : "",
  ].filter(Boolean);
  return parts.join("; ");
}

function summarizeHelixCapabilityLaneBackendDecision(value: unknown): string[] {
  const decision = readAgentLoopAuditRecord(value);
  if (!decision) return [];
  const decisionOutcome = coerceText(decision.outcome).trim();
  const terminalOwner = coerceText(decision.terminal_authority_owner).trim();
  return [
    decisionOutcome ? `decision ${decisionOutcome}` : "",
    decision.selected_runtime_provider_remains_root === true ? "runtime root preserved" : "",
    decision.live_backend_execution_enabled === false ? "no live backend execution" : "",
    terminalOwner ? `terminal authority ${terminalOwner}` : "",
  ].filter(Boolean);
}

function readHelixCapabilityLanePacketBackend(packet: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!packet) return null;
  const stateDelta = readAgentLoopAuditRecord(packet.state_delta);
  const shadowExecution = readAgentLoopAuditRecord(stateDelta?.capability_lane_shadow_execution);
  const decision = readAgentLoopAuditRecord(packet.backend_selection_decision);
  const selectedBackend =
    coerceText(packet.selected_backend_provider).trim() ||
    coerceText(shadowExecution?.selected_backend_provider).trim() ||
    coerceText(decision?.selected_backend_provider).trim();
  const requestedBackend =
    coerceText(packet.requested_backend_provider).trim() ||
    coerceText(shadowExecution?.requested_backend_provider).trim() ||
    coerceText(decision?.requested_backend_provider).trim();
  const availability =
    coerceText(packet.availability_status).trim() ||
    coerceText(shadowExecution?.availability_status).trim();
  const permission =
    coerceText(packet.permission_status).trim() ||
    coerceText(shadowExecution?.permission_status).trim();
  const execution =
    coerceText(packet.execution_status).trim() ||
    coerceText(shadowExecution?.execution_status).trim();
  const cost =
    coerceText(packet.cost_class).trim() ||
    coerceText(shadowExecution?.cost_class).trim();
  const latency =
    coerceText(packet.latency_class).trim() ||
    coerceText(shadowExecution?.latency_class).trim();
  const privacy =
    coerceText(packet.privacy_class).trim() ||
    coerceText(shadowExecution?.privacy_class).trim();
  const fallback =
    coerceText(packet.fallback_backend_provider).trim() ||
    coerceText(shadowExecution?.fallback_backend_provider).trim() ||
    coerceText(decision?.fallback_backend_provider).trim();
  if (
    !selectedBackend &&
    !requestedBackend &&
    !availability &&
    !permission &&
    !execution &&
    !cost &&
    !latency &&
    !privacy &&
    !fallback &&
    !decision
  ) {
    return null;
  }
  return {
    selected_backend_provider: selectedBackend || null,
    requested_backend_provider: requestedBackend || null,
    availability_status: availability || null,
    permission_status: permission || null,
    execution_status: execution || null,
    cost_class: cost || null,
    latency_class: latency || null,
    privacy_class: privacy || null,
    fallback_backend_provider: fallback || null,
    backend_selection_decision: decision,
    terminal_eligible:
      typeof shadowExecution?.terminal_eligible === "boolean"
        ? shadowExecution.terminal_eligible
        : packet.terminal_eligible,
    assistant_answer:
      typeof shadowExecution?.assistant_answer === "boolean"
        ? shadowExecution.assistant_answer
        : packet.assistant_answer,
  };
}

function summarizeHelixCapabilityLanePacketBackend(packet: Record<string, unknown> | null): string {
  const backend = readHelixCapabilityLanePacketBackend(packet);
  if (!backend) return "";
  const decisionParts = summarizeHelixCapabilityLaneBackendDecision(backend.backend_selection_decision);
  const observationOnly = backend.terminal_eligible === false || backend.assistant_answer === false;
  const parts = [
    coerceText(backend.selected_backend_provider).trim()
      ? `backend ${coerceText(backend.selected_backend_provider).trim()}`
      : "",
    coerceText(backend.requested_backend_provider).trim()
      ? `requested backend ${coerceText(backend.requested_backend_provider).trim()}`
      : "",
    coerceText(backend.execution_status).trim()
      ? `execution ${coerceText(backend.execution_status).trim()}`
      : "",
    coerceText(backend.availability_status).trim()
      ? `availability ${coerceText(backend.availability_status).trim()}`
      : "",
    coerceText(backend.permission_status).trim()
      ? `permission ${coerceText(backend.permission_status).trim()}`
      : "",
    coerceText(backend.cost_class).trim() ? `cost ${coerceText(backend.cost_class).trim()}` : "",
    coerceText(backend.latency_class).trim() ? `latency ${coerceText(backend.latency_class).trim()}` : "",
    coerceText(backend.privacy_class).trim() ? `privacy ${coerceText(backend.privacy_class).trim()}` : "",
    coerceText(backend.fallback_backend_provider).trim()
      ? `fallback ${coerceText(backend.fallback_backend_provider).trim()}`
      : "",
    ...decisionParts,
    observationOnly ? "lane output remains observation-only" : "",
  ].filter(Boolean);
  return parts.join("; ");
}

function formatHelixCapabilityLaneObservationText(args: {
  capabilityId: string;
  call: Record<string, unknown>;
  packet: Record<string, unknown> | null;
  ok: boolean;
}): string {
  const sessionId = readHelixCapabilityLaneSessionId(args.call, args.packet);
  const sessionSuffix = sessionId ? ` session ${sessionId}` : "";
  const summary =
    coerceText(args.packet?.observation_summary).trim() ||
    coerceText(args.call.observation_summary).trim() ||
    coerceText(args.call.summary).trim() ||
    coerceText(args.call.error).trim();
  const backendSummary = summarizeHelixCapabilityLanePacketBackend(args.packet);
  const backendSuffix = backendSummary ? ` ${backendSummary}.` : "";
  if (summary) {
    const cleanSummary = summary.replace(/\.$/, "");
    return `Lane observation: ${args.capabilityId}${sessionSuffix} ${args.ok ? "produced" : "blocked"} ${cleanSummary}.${backendSuffix}`;
  }
  return args.ok
    ? `Lane observation: ${args.capabilityId}${sessionSuffix} produced a governed observation packet.${backendSuffix}`
    : `Lane observation: ${args.capabilityId}${sessionSuffix} did not produce a successful observation packet.${backendSuffix}`;
}

function formatHelixCapabilityLaneDebugEventText(event: Record<string, unknown>): string {
  const stage = coerceText(event.stage).trim();
  const capability = coerceText(event.capability).trim() || coerceText(event.lane_id).trim() || "capability_lane";
  const sessionId = coerceText(event.lane_session_id).trim();
  const sessionSuffix = sessionId ? ` session ${sessionId}` : "";
  if (stage === "lane_requested") return `Lane requested: ${capability}.`;
  if (stage === "lane_backend_selected") {
    const decision = readAgentLoopAuditRecord(event.backend_selection_decision);
    const selectedBackend = coerceText(event.selected_backend_provider).trim();
    const requestedBackend = coerceText(event.requested_backend_provider).trim();
    const requestedConfiguration = coerceText(event.requested_backend_configuration_status).trim();
    const requestedAvailability = coerceText(event.requested_backend_availability_status).trim();
    const requestedPermission = coerceText(event.requested_backend_permission_status).trim();
    const decisionOutcome = coerceText(decision?.outcome).trim();
    const runtimeRootPreserved = decision?.selected_runtime_provider_remains_root === true;
    const noLiveBackend = decision?.live_backend_execution_enabled === false;
    const terminalOwner = coerceText(decision?.terminal_authority_owner).trim();
    const reason = coerceText(event.selection_reason).trim();
    const availability = coerceText(event.availability_status).trim();
    const permission = coerceText(event.permission_status).trim();
    const cost = coerceText(event.cost_class).trim();
    const latency = coerceText(event.latency_class).trim();
    const privacy = coerceText(event.privacy_class).trim();
    const fallback = coerceText(event.fallback_backend_provider).trim();
    const parts = [
      selectedBackend ? `selected ${selectedBackend}` : "",
      requestedBackend ? `requested ${requestedBackend}` : "",
      requestedConfiguration ? `requested configuration ${requestedConfiguration}` : "",
      requestedAvailability ? `requested availability ${requestedAvailability}` : "",
      requestedPermission ? `requested permission ${requestedPermission}` : "",
      decisionOutcome ? `decision ${decisionOutcome}` : "",
      runtimeRootPreserved ? "runtime root preserved" : "",
      noLiveBackend ? "no live backend execution" : "",
      terminalOwner ? `terminal authority ${terminalOwner}` : "",
      reason ? `reason ${reason}` : "",
      availability ? `availability ${availability}` : "",
      permission ? `permission ${permission}` : "",
      cost ? `cost ${cost}` : "",
      latency ? `latency ${latency}` : "",
      privacy ? `privacy ${privacy}` : "",
      fallback ? `fallback ${fallback}` : "",
    ].filter(Boolean);
    return parts.length
      ? `Lane backend selected: ${parts.join("; ")}.`
      : `Lane backend selected for ${capability}.`;
  }
  if (stage === "lane_observation") {
    const status = coerceText(event.status).trim();
    const verb = status === "completed" ? "produced" : "blocked";
    const observationRef = coerceText(event.observation_ref).trim();
    const receiptRef = coerceText(event.receipt_ref).trim();
    const suffix = receiptRef ? `; receipt ${receiptRef}` : "";
    return `Lane observation: ${capability}${sessionSuffix} ${verb} ${observationRef || "a governed observation packet"}${suffix}.`;
  }
  if (stage === "lane_reentered") {
    const status = coerceText(event.reentry_status).trim();
    const receiptRef = coerceText(event.receipt_ref).trim();
    const suffix = receiptRef ? ` Receipt ${receiptRef} remains observation-only.` : "";
    return status === "observation_packet_required_for_provider_reentry"
      ? `Lane re-entry: observation packet available for provider reasoning before terminal selection.${suffix}`
      : `Lane re-entry: ${status || "pending"}.`;
  }
  return `Lane event: ${capability}.`;
}

function formatHelixCapabilityLaneProjectionReceiptText(receipt: Record<string, unknown>): string {
  const capability =
    coerceText(receipt.capability).trim() ||
    coerceText(receipt.capability_key).trim() ||
    coerceText(receipt.lane_id).trim() ||
    "capability_lane";
  const receiptRef = coerceText(receipt.receipt_ref).trim();
  const observationRef = coerceText(receipt.observation_ref).trim();
  const payload = readAgentLoopAuditRecord(receipt.payload);
  const projectionTarget =
    coerceText(receipt.projection_target).trim() ||
    coerceText(payload?.projection_target).trim();
  const projectionStatus =
    coerceText(receipt.projection_status).trim() ||
    coerceText(payload?.projection_status).trim() ||
    coerceText(receipt.status).trim();
  const targetLanguage =
    coerceText(receipt.target_language).trim() ||
    coerceText(payload?.target_language).trim();
  const parts = [
    capability,
    projectionStatus ? `projection ${projectionStatus}` : "",
    projectionTarget ? `target ${projectionTarget}` : "",
    targetLanguage ? `language ${targetLanguage}` : "",
    observationRef ? `observation ${observationRef}` : "",
    receiptRef ? `receipt ${receiptRef}` : "",
  ].filter(Boolean);
  return `Lane projection receipt: ${parts.join("; ")}; remains observation-only.`;
}

function formatHelixCapabilityLaneGoalBindingSummaryText(summary: Record<string, unknown>): string {
  const goalId = coerceText(summary.goal_id).trim();
  const laneId = coerceText(summary.lane_id).trim() || "capability_lane";
  const sessionId = coerceText(summary.lane_session_id).trim();
  const bindingStatus = coerceText(summary.binding_status).trim();
  const sessionStatus = coerceText(summary.session_status).trim();
  const sessionHealth = coerceText(summary.session_health).trim();
  const backend = coerceText(summary.selected_backend_provider).trim();
  const cost = coerceText(summary.cost_class).trim();
  const latency = coerceText(summary.latency_class).trim();
  const privacy = coerceText(summary.privacy_class).trim();
  const fallback = coerceText(summary.fallback_backend_provider).trim();
  const sourceId = coerceText(summary.source_id).trim();
  const observationRef = coerceText(summary.last_observation_ref).trim();
  const latestMailLoop = readAgentLoopAuditRecord(summary.latest_mail_loop_summary);
  const mailLoopRef =
    coerceText(latestMailLoop?.stage_play_mail_id).trim() ||
    coerceText(latestMailLoop?.observation_ref).trim();
  const receiptRef = coerceText(latestMailLoop?.receipt_ref).trim();
  const latestGoalEvent = readAgentLoopAuditRecord(summary.latest_goal_binding_event);
  const latestGoalEventName = coerceText(latestGoalEvent?.event).trim();
  const latestGoalEventReceiptRef = coerceText(latestGoalEvent?.receipt_ref).trim();
  const reportDecision = readAgentLoopAuditRecord(summary.report_decision);
  const reportAction = coerceText(reportDecision?.action).trim();
  const reportReason = coerceText(reportDecision?.reason).trim();
  const dispatchPlan = readAgentLoopAuditRecord(summary.dispatch_plan);
  const dispatchTarget = coerceText(dispatchPlan?.target).trim();
  const dispatchStatus = coerceText(dispatchPlan?.status).trim();
  const decisionParts = summarizeHelixCapabilityLaneBackendDecision(summary.backend_selection_decision);
  const terminalAuthority = coerceText(summary.terminal_authority_status).trim();
  const parts = [
    goalId ? `goal ${goalId}` : "",
    sessionId ? `session ${sessionId}` : "",
    bindingStatus ? `binding ${bindingStatus}` : "",
    sessionStatus || sessionHealth ? `session state ${[sessionStatus, sessionHealth].filter(Boolean).join("/")}` : "",
    backend ? `backend ${backend}` : "",
    cost ? `cost ${cost}` : "",
    latency ? `latency ${latency}` : "",
    privacy ? `privacy ${privacy}` : "",
    fallback ? `fallback ${fallback}` : "",
    ...decisionParts,
    sourceId ? `source ${sourceId}` : "",
    observationRef ? `last observation ${observationRef}` : "",
    mailLoopRef ? `latest mail ${mailLoopRef}` : "",
    latestGoalEventName ? `latest event ${latestGoalEventName}` : "",
    receiptRef || latestGoalEventReceiptRef ? `receipt ${receiptRef || latestGoalEventReceiptRef}` : "",
    reportAction ? `report action ${reportAction}` : "",
    reportReason ? `report reason ${reportReason}` : "",
    dispatchTarget ? `dispatch target ${dispatchTarget}` : "",
    dispatchStatus ? `dispatch ${dispatchStatus}` : "",
    terminalAuthority ? `terminal authority ${terminalAuthority}` : "",
  ].filter(Boolean);
  const suffix = parts.length ? parts.join("; ") : "debug summary available";
  return `Goal-bound lane session: ${laneId}; ${suffix}; lane output remains observation-only.`;
}

function formatHelixCapabilityLaneGoalDispatchPlanText(plan: Record<string, unknown>): string {
  const laneId = coerceText(plan.lane_id).trim() || "capability_lane";
  const target = coerceText(plan.target).trim() || "none";
  const status = coerceText(plan.status).trim() || "planned_not_dispatched";
  const reason = coerceText(plan.reason).trim();
  const evidenceRef = coerceText(plan.evidence_ref).trim();
  const mailLoopRef = coerceText(plan.mail_loop_ref).trim();
  const receiptRef = coerceText(plan.receipt_ref).trim();
  const terminalAuthority = coerceText(plan.terminal_authority_status).trim();
  const sideEffects = plan.side_effects_executed === true ? "side effects executed" : "no side effects executed";
  const parts = [
    `target ${target}`,
    `status ${status}`,
    reason ? `reason ${reason}` : "",
    evidenceRef ? `evidence ${evidenceRef}` : "",
    mailLoopRef ? `mail ${mailLoopRef}` : "",
    receiptRef ? `receipt ${receiptRef}` : "",
    terminalAuthority ? `terminal authority ${terminalAuthority}` : "",
    sideEffects,
  ].filter(Boolean);
  return `Goal dispatch plan: ${laneId}; ${parts.join("; ")}; lane output remains observation-only.`;
}

function formatHelixCapabilityLaneGoalDispatchAdmissionText(admission: Record<string, unknown>): string {
  const laneId = coerceText(admission.lane_id).trim() || "capability_lane";
  const target = coerceText(admission.target).trim() || "none";
  const status = coerceText(admission.status).trim() || "blocked";
  const reason = coerceText(admission.reason).trim();
  const blockedReason = coerceText(admission.blocked_reason).trim();
  const evidenceRef = coerceText(admission.evidence_ref).trim();
  const mailLoopRef = coerceText(admission.mail_loop_ref).trim();
  const receiptRef = coerceText(admission.receipt_ref).trim();
  const terminalAuthority = coerceText(admission.terminal_authority_status).trim();
  const parts = [
    `target ${target}`,
    `status ${status}`,
    reason ? `reason ${reason}` : "",
    blockedReason ? `blocked ${blockedReason}` : "",
    evidenceRef ? `evidence ${evidenceRef}` : "",
    mailLoopRef ? `mail ${mailLoopRef}` : "",
    receiptRef ? `receipt ${receiptRef}` : "",
    terminalAuthority ? `terminal authority ${terminalAuthority}` : "",
    "side effects not allowed",
  ].filter(Boolean);
  return `Goal dispatch admission: ${laneId}; ${parts.join("; ")}; lane output remains observation-only.`;
}

function formatHelixCapabilityLaneGoalDispatchReadinessText(readiness: Record<string, unknown>): string {
  const totalPlans = coerceText(readiness.total_plans).trim() || "0";
  const totalAdmissions = coerceText(readiness.total_admissions).trim() || "0";
  const admittedCount = coerceText(readiness.admitted_count).trim() || "0";
  const blockedCount = coerceText(readiness.blocked_count).trim() || "0";
  const pendingWakeCount = coerceText(readiness.pending_wake_count).trim() || "0";
  const pendingTerminalCount = coerceText(readiness.pending_terminal_authority_count).trim() || "0";
  const projectionOnlyCount = coerceText(readiness.projection_only_count).trim() || "0";
  const manualReviewCount = coerceText(readiness.manual_review_count).trim() || "0";
  const debugOnlyCount = coerceText(readiness.debug_only_count).trim() || "0";
  const blockedReasons = Array.isArray(readiness.blocked_reasons)
    ? readiness.blocked_reasons.map(coerceText).filter(Boolean).join(", ")
    : "";
  const nextLanes = Array.isArray(readiness.next_lane_ids)
    ? readiness.next_lane_ids.map(coerceText).filter(Boolean).join(", ")
    : "";
  const nextSessions = Array.isArray(readiness.next_lane_session_ids)
    ? readiness.next_lane_session_ids.map(coerceText).filter(Boolean).join(", ")
    : "";
  const nextTargets = Array.isArray(readiness.next_dispatch_targets)
    ? readiness.next_dispatch_targets.map(coerceText).filter(Boolean).join(", ")
    : "";
  const nextBindings = Array.isArray(readiness.next_goal_binding_ids)
    ? readiness.next_goal_binding_ids.map(coerceText).filter(Boolean).join(", ")
    : "";
  const nextEvidence = Array.isArray(readiness.next_evidence_refs)
    ? readiness.next_evidence_refs.map(coerceText).filter(Boolean).join(", ")
    : "";
  const nextReceipts = Array.isArray(readiness.next_receipt_refs)
    ? readiness.next_receipt_refs.map(coerceText).filter(Boolean).join(", ")
    : "";
  const parts = [
    `plans ${totalPlans}`,
    `admissions ${totalAdmissions}`,
    `admitted ${admittedCount}`,
    `blocked ${blockedCount}`,
    pendingWakeCount !== "0" ? `pending wake ${pendingWakeCount}` : "",
    pendingTerminalCount !== "0" ? `pending terminal authority ${pendingTerminalCount}` : "",
    projectionOnlyCount !== "0" ? `projection only ${projectionOnlyCount}` : "",
    manualReviewCount !== "0" ? `manual review ${manualReviewCount}` : "",
    debugOnlyCount !== "0" ? `debug only ${debugOnlyCount}` : "",
    nextLanes ? `next lanes ${nextLanes}` : "",
    nextSessions ? `next sessions ${nextSessions}` : "",
    nextTargets ? `next targets ${nextTargets}` : "",
    nextBindings ? `next goal bindings ${nextBindings}` : "",
    nextEvidence ? `next evidence ${nextEvidence}` : "",
    nextReceipts ? `next receipts ${nextReceipts}` : "",
    blockedReasons ? `blocked reasons ${blockedReasons}` : "",
    "no side effects allowed",
  ].filter(Boolean);
  return `Goal dispatch readiness: ${parts.join("; ")}; lane output remains observation-only.`;
}

function formatHelixCapabilityLaneSessionSummaryText(summary: Record<string, unknown>): string {
  const laneId = coerceText(summary.lane_id).trim() || "capability_lane";
  const sessionId = coerceText(summary.lane_session_id).trim();
  const sessionStatus = coerceText(summary.session_status).trim();
  const sessionHealth = coerceText(summary.session_health).trim();
  const backend = coerceText(summary.selected_backend_provider).trim();
  const cost = coerceText(summary.cost_class).trim();
  const latency = coerceText(summary.latency_class).trim();
  const privacy = coerceText(summary.privacy_class).trim();
  const fallback = coerceText(summary.fallback_backend_provider).trim();
  const sourceId = coerceText(summary.source_id).trim();
  const sourceKind = coerceText(summary.source_kind).trim();
  const projectionTarget = coerceText(summary.projection_target).trim();
  const accountLocale = coerceText(summary.account_locale).trim();
  const observationRef = coerceText(summary.last_observation_ref).trim();
  const receiptRef = coerceText(summary.last_receipt_ref).trim();
  const terminalAuthority = coerceText(summary.terminal_authority_status).trim();
  const eventCount = coerceText(summary.session_event_count).trim();
  const decisionParts = summarizeHelixCapabilityLaneBackendDecision(summary.backend_selection_decision);
  const parts = [
    sessionId ? `session ${sessionId}` : "",
    sessionStatus || sessionHealth ? `state ${[sessionStatus, sessionHealth].filter(Boolean).join("/")}` : "",
    backend ? `backend ${backend}` : "",
    cost ? `cost ${cost}` : "",
    latency ? `latency ${latency}` : "",
    privacy ? `privacy ${privacy}` : "",
    fallback ? `fallback ${fallback}` : "",
    ...decisionParts,
    sourceId ? `source ${sourceId}` : "",
    sourceKind ? `source kind ${sourceKind}` : "",
    projectionTarget ? `projection ${projectionTarget}` : "",
    accountLocale ? `locale ${accountLocale}` : "",
    observationRef ? `last observation ${observationRef}` : "",
    receiptRef ? `receipt ${receiptRef}` : "",
    terminalAuthority ? `terminal authority ${terminalAuthority}` : "",
    eventCount ? `events ${eventCount}` : "",
  ].filter(Boolean);
  const suffix = parts.length ? parts.join("; ") : "debug summary available";
  return `Lane session: ${laneId}; ${suffix}; lane output remains observation-only.`;
}

function formatHelixCapabilityLaneMailLoopSummaryText(summary: Record<string, unknown>): string {
  const laneId = coerceText(summary.lane_id).trim() || "capability_lane";
  const sessionId = coerceText(summary.lane_session_id).trim();
  const mailId = coerceText(summary.stage_play_mail_id).trim();
  const observationRef = coerceText(summary.observation_ref).trim();
  const receiptRef = coerceText(summary.receipt_ref).trim();
  const sourceId = coerceText(summary.source_id).trim();
  const sourceKind = coerceText(summary.source_kind).trim();
  const chunkId = coerceText(summary.chunk_id).trim();
  const chunkIndex = coerceText(summary.chunk_index).trim();
  const dedupeKey = coerceText(summary.dedupe_key).trim();
  const sourceEventMs = coerceText(summary.source_event_ms).trim();
  const observedAtMs = coerceText(summary.observed_at_ms).trim();
  const projectionTarget = coerceText(summary.projection_target).trim();
  const backend = coerceText(summary.selected_backend_provider).trim();
  const requestedBackend = coerceText(summary.requested_backend_provider).trim();
  const cost = coerceText(summary.cost_class).trim();
  const latency = coerceText(summary.latency_class).trim();
  const privacy = coerceText(summary.privacy_class).trim();
  const fallback = coerceText(summary.fallback_backend_provider).trim();
  const freshness = coerceText(summary.freshness_status).trim();
  const blockedReason = coerceText(summary.blocked_reason).trim();
  const terminalAuthority = coerceText(summary.terminal_authority_status).trim();
  const decisionParts = summarizeHelixCapabilityLaneBackendDecision(summary.backend_selection_decision);
  const wakeExpected = summary.stage_play_wake_expected === true ? "wake expected" : "wake not expected";
  const cancelled = summary.cancel_requested === true;
  const parts = [
    sessionId ? `session ${sessionId}` : "",
    mailId ? `mail ${mailId}` : "",
    wakeExpected,
    observationRef ? `observation ${observationRef}` : "",
    receiptRef ? `receipt ${receiptRef}` : "",
    sourceId ? `source ${sourceId}` : "",
    sourceKind ? `source kind ${sourceKind}` : "",
    chunkId ? `chunk ${chunkId}` : "",
    chunkIndex ? `index ${chunkIndex}` : "",
    dedupeKey ? `dedupe ${dedupeKey}` : "",
    sourceEventMs ? `source event ${sourceEventMs}` : "",
    observedAtMs ? `observed ${observedAtMs}` : "",
    cancelled ? "cancelled" : "",
    projectionTarget ? `projection ${projectionTarget}` : "",
    backend ? `backend ${backend}` : "",
    requestedBackend ? `requested backend ${requestedBackend}` : "",
    cost ? `cost ${cost}` : "",
    latency ? `latency ${latency}` : "",
    privacy ? `privacy ${privacy}` : "",
    fallback ? `fallback ${fallback}` : "",
    ...decisionParts,
    freshness ? `freshness ${freshness}` : "",
    blockedReason ? `blocked ${blockedReason}` : "",
    terminalAuthority ? `terminal authority ${terminalAuthority}` : "",
  ].filter(Boolean);
  const suffix = parts.length ? parts.join("; ") : "debug summary available";
  return `Lane mail loop: ${laneId}; ${suffix}; mail is evidence-only.`;
}

function readHelixGatewayCapabilityId(record: Record<string, unknown>): string {
  const admission = readAgentLoopAuditRecord(record.gateway_admission);
  return (
    coerceText(record.capability_id).trim() ||
    coerceText(record.capabilityId).trim() ||
    coerceText(record.capability_key).trim() ||
    coerceText(record.capabilityKey).trim() ||
    coerceText(admission?.requested_capability).trim()
  );
}

function readHelixGatewayObservationPacketForCall(
  call: Record<string, unknown>,
  packets: Record<string, unknown>[],
): Record<string, unknown> | null {
  const directPacket = readAgentLoopAuditRecord(call.observation_packet);
  if (directPacket) return directPacket;
  const capability = readHelixGatewayCapabilityId(call);
  const callId = coerceText(call.call_id ?? call.callId).trim();
  return packets.find((packet) => {
    const packetCapability =
      coerceText(packet.capability_key).trim() ||
      coerceText(packet.capability_id).trim() ||
      coerceText(packet.capabilityId).trim();
    const packetCallId = coerceText(packet.call_id ?? packet.callId).trim();
    return Boolean(
      (capability && packetCapability === capability) ||
        (callId && packetCallId === callId),
    );
  }) ?? null;
}

function readNestedGatewayValue(value: unknown, keys: string[]): string {
  const visit = (entry: unknown, depth: number): string => {
    if (depth > 4) return "";
    const text = coerceText(entry).trim();
    if (text && typeof entry !== "object") return "";
    const record = readAgentLoopAuditRecord(entry);
    if (!record) return "";
    for (const key of keys) {
      const candidate = coerceText(record[key]).trim();
      if (candidate) return candidate;
    }
    for (const nestedKey of ["observation", "result", "output", "payload", "raw", "args", "arguments"]) {
      const candidate = visit(record[nestedKey], depth + 1);
      if (candidate) return candidate;
    }
    return "";
  };
  return visit(value, 0);
}

function formatHelixGatewayObservationText(args: {
  capabilityId: string;
  call: Record<string, unknown>;
  packet: Record<string, unknown> | null;
  ok: boolean;
  isAction?: boolean;
}): string {
  const explicitText =
    coerceText(args.call.text).trim() ||
    coerceText(args.call.observation_text).trim() ||
    coerceText(args.call.observationText).trim();
  if (/^(?:Tool|Action) observation:/i.test(explicitText)) return explicitText;

  const expression = readNestedGatewayValue(args.call, [
    "expression",
    "normalized_expression",
    "expression_text",
    "latex",
  ]);
  const result = readNestedGatewayValue(args.call, ["result", "answer", "value"]);
  if (args.capabilityId === "scientific-calculator.solve_expression" && expression && result) {
    return `Tool observation: ${args.capabilityId} observed ${expression} = ${result}.`;
  }

  const summary =
    coerceText(args.packet?.observation_summary).trim() ||
    coerceText(args.call.observation_summary).trim() ||
    coerceText(args.call.summary).trim() ||
    coerceText(args.call.error).trim();
  if (summary) {
    const cleanSummary = summary.replace(/\.$/, "");
    const prefix = args.isAction ? "Action observation" : "Tool observation";
    return `${prefix}: ${args.capabilityId} ${args.ok ? "observed" : "blocked"} ${cleanSummary}.`;
  }
  const prefix = args.isAction ? "Action observation" : "Tool observation";
  return args.ok
    ? `${prefix}: ${args.capabilityId} produced a workstation observation packet.`
    : `${prefix}: ${args.capabilityId} did not produce a successful workstation observation packet.`;
}

function isHelixGatewayActionCapability(capabilityId: string, call: Record<string, unknown>): boolean {
  const mode = coerceText(call.mode).trim().toLowerCase();
  if (mode === "act") return true;
  return /\.(?:open_panel|show_gateway_solve|show|focus|open_doc)$/i.test(capabilityId);
}

function hasSucceededHelixGatewayPacket(packet: Record<string, unknown> | null, call: Record<string, unknown>): boolean {
  if (call.ok !== true) return false;
  const status = coerceText(packet?.status).trim().toLowerCase();
  return status !== "blocked" && status !== "failed" && status !== "missing_input" && status !== "needs_confirmation";
}

function readHelixCompoundDependencyTurnPlan(
  call: Record<string, unknown>,
  packet: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const observation = readAgentLoopAuditRecord(call.observation);
  const stateDelta = readAgentLoopAuditRecord(packet?.state_delta);
  return readAgentLoopAuditRecord(observation?.compound_dependency_turn_plan) ??
    readAgentLoopAuditRecord(stateDelta?.compound_dependency_turn_plan);
}

function formatHelixCompoundDependencyTurnPlan(plan: Record<string, unknown>): string {
  const outcomes = Array.isArray(plan.compound_outcomes)
    ? plan.compound_outcomes.map((entry) => coerceText(entry).trim()).filter(Boolean)
    : [];
  const label = outcomes.length > 0 ? outcomes.join(", ") : "compound capability";
  const subgoals = readAgentLoopAuditArray(plan.ordered_subgoals)
    .map((entry) => readAgentLoopAuditRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const satisfiedCount =
    typeof plan.satisfied_subgoal_count === "number" && Number.isFinite(plan.satisfied_subgoal_count)
      ? Math.trunc(plan.satisfied_subgoal_count)
      : subgoals.filter((subgoal) => subgoal.satisfied === true).length;
  const subgoalCount =
    typeof plan.subgoal_count === "number" && Number.isFinite(plan.subgoal_count)
      ? Math.trunc(plan.subgoal_count)
      : subgoals.length;
  const firstBroken = readAgentLoopAuditRecord(plan.first_broken_rail);
  const railStatus = coerceText(plan.rail_status).trim() || (firstBroken ? "blocked" : "satisfied");
  if (firstBroken) {
    const subgoalId = coerceText(firstBroken.subgoal_id).trim() || "unknown subgoal";
    const capability =
      coerceText(firstBroken.requested_capability).trim() ||
      coerceText(firstBroken.selected_capability).trim() ||
      coerceText(firstBroken.executed_capability).trim() ||
      "unknown capability";
    const reason = coerceText(firstBroken.reason ?? firstBroken.error ?? firstBroken.rail_status).trim();
    return `Compound itinerary: ${label} ${railStatus} at ${subgoalId} (${capability})${reason ? `: ${reason}` : ""}.`;
  }
  return `Compound itinerary: ${label} ${railStatus} with ${satisfiedCount}/${subgoalCount} subgoals satisfied.`;
}

export function buildHelixWorkstationGatewayTranscriptEvents(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const calls = readHelixWorkstationGatewayCallResults(reply);
  if (calls.length === 0) return [];
  const packets = readHelixWorkstationGatewayObservationPackets(reply);
  const turnId = coerceText(reply.turn_id ?? reply.debug?.turn_id ?? reply.id).trim();
  const events: Record<string, unknown>[] = [];
  let successfulPacketPresent = false;
  const compoundPlanEvents = new Map<string, Record<string, unknown>>();
  calls.slice(0, 10).forEach((call, index) => {
    const capabilityId = readHelixGatewayCapabilityId(call);
    if (!capabilityId) return;
    const packet = readHelixGatewayObservationPacketForCall(call, packets);
    const ok = hasSucceededHelixGatewayPacket(packet, call);
    successfulPacketPresent = successfulPacketPresent || ok;
    const stepId = `workstation_gateway_${index + 1}`;
    const isAction = isHelixGatewayActionCapability(capabilityId, call);
    events.push({
      id: `${reply.id}-workstation-gateway-${index}-request`,
      role: "agent",
      type: "model_decision",
      status: "completed",
      text: `${isAction ? "Action" : "Tool"} request: ${capabilityId}.`,
      detail: capabilityId,
      lane: "workstation_gateway",
      step_id: stepId,
      turn_id: turnId,
      capability_id: capabilityId,
      event_source: "workstation_gateway_call_results",
      source_event_type: isAction ? "action_request" : "tool_request",
    });
    events.push({
      id: `${reply.id}-workstation-gateway-${index}-observation`,
      role: "tool",
      type: "tool_result",
      status: ok ? "completed" : "failed",
      text: formatHelixGatewayObservationText({ capabilityId, call, packet, ok, isAction }),
      detail: coerceText(packet?.observation_summary).trim() || coerceText(call.error).trim() || capabilityId,
      lane: capabilityId,
      step_id: stepId,
      turn_id: turnId,
      capability_id: capabilityId,
      event_source: "workstation_gateway_call_results",
      source_event_type: isAction ? "action_observation" : "tool_observation",
    });
    const compoundPlan = readHelixCompoundDependencyTurnPlan(call, packet);
    if (compoundPlan) {
      const planKey =
        coerceText(compoundPlan.turn_id).trim() ||
        JSON.stringify(compoundPlan.compound_outcomes ?? compoundPlan.ordered_subgoals ?? index);
      if (!compoundPlanEvents.has(planKey)) {
        compoundPlanEvents.set(planKey, {
          id: `${reply.id}-workstation-gateway-compound-itinerary-${compoundPlanEvents.size}`,
          role: "agent",
          type: "decision",
          status: coerceText(compoundPlan.rail_status).trim() === "blocked" ? "blocked" : "completed",
          text: formatHelixCompoundDependencyTurnPlan(compoundPlan),
          detail: "compound_dependency_turn_plan",
          lane: "helix_compound_capability_dependency_planner",
          step_id: "compound_itinerary",
          turn_id: turnId,
          event_source: "workstation_gateway_call_results",
          source_event_type: "compound_itinerary",
        });
      }
    }
  });
  events.push(...compoundPlanEvents.values());
  if (successfulPacketPresent) {
    events.push({
      id: `${reply.id}-workstation-gateway-model-reentry`,
      role: "agent",
      type: "model_decision",
      status: "completed",
      text: "Model re-entry: Codex received the workstation observation packet(s) before final answer.",
      detail: "workstation_gateway_observation_packets",
      lane: "codex_provider",
      step_id: "model_reentry",
      turn_id: turnId,
      event_source: "workstation_gateway_call_results",
      source_event_type: "model_reentry",
    });
  }
  return events;
}

export function buildHelixCapabilityLaneTranscriptEvents(reply: HelixAskTranscriptReply): Record<string, unknown>[] {
  const calls = readHelixCapabilityLaneCallResults(reply);
  const debugEvents = readHelixCapabilityLaneDebugEvents(reply);
  const sessionSummaries = readHelixCapabilityLaneSessionDebugSummaries(reply);
  const mailLoopSummaries = readHelixCapabilityLaneMailLoopDebugSummaries(reply);
  const goalBindingSummaries = readHelixCapabilityLaneGoalBindingDebugSummaries(reply);
  const goalDispatchPlans = readHelixCapabilityLaneGoalDispatchPlans(reply);
  const goalDispatchAdmissions = readHelixCapabilityLaneGoalDispatchAdmissions(reply);
  const goalDispatchReadiness = readHelixCapabilityLaneGoalDispatchReadiness(reply);
  const projectionReceipts = readHelixCapabilityLaneProjectionReceipts(reply);
  const terminalKind = readHelixCapabilityLaneTerminalKind(reply);
  const turnId = coerceText(reply.turn_id ?? reply.debug?.turn_id ?? reply.id).trim();
  const projectionReceiptEvents = projectionReceipts.slice(0, 10).map((receipt, index) => {
    const laneId = coerceText(receipt.lane_id).trim() || "capability_lane";
    const capabilityId =
      coerceText(receipt.capability).trim() ||
      coerceText(receipt.capability_key).trim() ||
      laneId;
    const status = coerceText(receipt.status).trim();
    return {
      id: coerceText(receipt.receipt_ref).trim() || `${reply.id}-capability-lane-projection-receipt-${index}`,
      role: "tool",
      type: "observation",
      status: status === "blocked" || status === "failed" ? "failed" : "completed",
      text: formatHelixCapabilityLaneProjectionReceiptText(receipt),
      detail:
        coerceText(receipt.receipt_ref).trim() ||
        coerceText(receipt.observation_ref).trim() ||
        capabilityId,
      lane: laneId,
      step_id: "lane_projection_receipt",
      turn_id: turnId,
      capability_id: capabilityId,
      receipt_ref: coerceText(receipt.receipt_ref).trim() || null,
      observation_ref: coerceText(receipt.observation_ref).trim() || null,
      terminal_eligible: receipt.terminal_eligible === true,
      assistant_answer: receipt.assistant_answer === true,
      raw_content_included: receipt.raw_content_included === true,
      event_source: "capability_lane_projection_receipts",
      source_event_type: "lane_projection_receipt",
    };
  });
  const sessionEvents = sessionSummaries.slice(0, 10).map((summary, index) => {
    const laneId = coerceText(summary.lane_id).trim() || "capability_lane";
    const sessionStatus = coerceText(summary.session_status).trim();
    const sessionHealth = coerceText(summary.session_health).trim();
    const status =
      sessionHealth === "blocked" || sessionStatus === "blocked"
        ? "failed"
        : sessionStatus === "running" || sessionStatus === "paused"
          ? "pending"
          : "completed";
    return {
      id: coerceText(summary.lane_session_id).trim() || `${reply.id}-capability-lane-session-${index}`,
      role: "system",
      type: "observation",
      status,
      text: formatHelixCapabilityLaneSessionSummaryText(summary),
      detail:
        coerceText(summary.lane_session_id).trim() ||
        coerceText(summary.last_observation_ref).trim() ||
        laneId,
      lane: laneId,
      step_id: "lane_session",
      turn_id: turnId,
      capability_id: laneId,
      lane_session_id: coerceText(summary.lane_session_id).trim() || null,
      selected_backend_provider: coerceText(summary.selected_backend_provider).trim() || null,
      cost_class: coerceText(summary.cost_class).trim() || null,
      latency_class: coerceText(summary.latency_class).trim() || null,
      privacy_class: coerceText(summary.privacy_class).trim() || null,
      fallback_backend_provider: coerceText(summary.fallback_backend_provider).trim() || null,
      receipt_ref: coerceText(summary.last_receipt_ref).trim() || null,
      observation_ref: coerceText(summary.last_observation_ref).trim() || null,
      terminal_eligible: summary.terminal_eligible === true,
      assistant_answer: summary.assistant_answer === true,
      raw_content_included: summary.raw_content_included === true,
      event_source: "capability_lane_session_debug_summaries",
      source_event_type: "lane_session",
    };
  });
  const mailLoopEvents = mailLoopSummaries.slice(0, 10).map((summary, index) => {
    const laneId = coerceText(summary.lane_id).trim() || "capability_lane";
    const blockedReason = coerceText(summary.blocked_reason).trim();
    const status = blockedReason ? "failed" : summary.stage_play_wake_expected === true ? "pending" : "completed";
    return {
      id: coerceText(summary.stage_play_mail_id).trim() || `${reply.id}-capability-lane-mail-loop-${index}`,
      role: "system",
      type: "observation",
      status,
      text: formatHelixCapabilityLaneMailLoopSummaryText(summary),
      detail:
        coerceText(summary.stage_play_mail_id).trim() ||
        coerceText(summary.observation_ref).trim() ||
        blockedReason ||
        laneId,
      lane: laneId,
      step_id: "lane_mail_loop",
      turn_id: turnId,
      capability_id: coerceText(summary.capability).trim() || laneId,
      lane_session_id: coerceText(summary.lane_session_id).trim() || null,
      selected_backend_provider: coerceText(summary.selected_backend_provider).trim() || null,
      cost_class: coerceText(summary.cost_class).trim() || null,
      latency_class: coerceText(summary.latency_class).trim() || null,
      privacy_class: coerceText(summary.privacy_class).trim() || null,
      fallback_backend_provider: coerceText(summary.fallback_backend_provider).trim() || null,
      receipt_ref: coerceText(summary.receipt_ref).trim() || null,
      observation_ref: coerceText(summary.observation_ref).trim() || null,
      terminal_eligible: summary.terminal_eligible === true,
      assistant_answer: summary.assistant_answer === true,
      raw_content_included: summary.raw_content_included === true,
      event_source: "capability_lane_mail_loop_debug_summaries",
      source_event_type: "lane_mail_loop",
    };
  });
  const goalBindingEvents = goalBindingSummaries.slice(0, 10).map((summary, index) => {
    const laneId = coerceText(summary.lane_id).trim() || "capability_lane";
    const sessionStatus = coerceText(summary.session_status).trim();
    const sessionHealth = coerceText(summary.session_health).trim();
    const status =
      sessionHealth === "blocked" || sessionStatus === "blocked"
        ? "failed"
        : sessionStatus === "running" || sessionStatus === "paused"
          ? "pending"
          : "completed";
    const latestGoalEvent = readAgentLoopAuditRecord(summary.latest_goal_binding_event);
    const reportDecision = readAgentLoopAuditRecord(summary.report_decision);
    return {
      id: coerceText(summary.goal_binding_id).trim() || `${reply.id}-capability-lane-goal-binding-${index}`,
      role: "system",
      type: "observation",
      status,
      text: formatHelixCapabilityLaneGoalBindingSummaryText(summary),
      detail:
        coerceText(summary.goal_id).trim() ||
        coerceText(summary.lane_session_id).trim() ||
        laneId,
      lane: laneId,
      step_id: "lane_goal_binding",
      turn_id: turnId,
      capability_id: laneId,
      lane_session_id: coerceText(summary.lane_session_id).trim() || null,
      selected_backend_provider: coerceText(summary.selected_backend_provider).trim() || null,
      cost_class: coerceText(summary.cost_class).trim() || null,
      latency_class: coerceText(summary.latency_class).trim() || null,
      privacy_class: coerceText(summary.privacy_class).trim() || null,
      fallback_backend_provider: coerceText(summary.fallback_backend_provider).trim() || null,
      receipt_ref:
        coerceText(summary.last_receipt_ref).trim() ||
        coerceText(latestGoalEvent?.receipt_ref).trim() ||
        coerceText(reportDecision?.receipt_ref).trim() ||
        null,
      observation_ref:
        coerceText(summary.last_observation_ref).trim() ||
        coerceText(reportDecision?.evidence_ref).trim() ||
        null,
      terminal_eligible: summary.terminal_eligible === true,
      assistant_answer: summary.assistant_answer === true,
      raw_content_included: summary.raw_content_included === true,
      event_source: "capability_lane_goal_binding_debug_summaries",
      source_event_type: "lane_goal_binding",
    };
  });
  const goalDispatchEvents = goalDispatchPlans.slice(0, 10).map((plan, index) => {
    const laneId = coerceText(plan.lane_id).trim() || "capability_lane";
    const target = coerceText(plan.target).trim();
    const status =
      target === "ask_wake" ||
      target === "terminal_authority_review" ||
      target === "manual_review"
        ? "pending"
        : "completed";
    return {
      id:
        coerceText(plan.goal_binding_id).trim()
          ? `${coerceText(plan.goal_binding_id).trim()}:dispatch-plan`
          : `${reply.id}-capability-lane-goal-dispatch-${index}`,
      role: "system",
      type: "model_decision",
      status,
      text: formatHelixCapabilityLaneGoalDispatchPlanText(plan),
      detail:
        target ||
        coerceText(plan.goal_id).trim() ||
        coerceText(plan.lane_session_id).trim() ||
        laneId,
      lane: laneId,
      step_id: "lane_goal_dispatch_plan",
      turn_id: turnId,
      capability_id: laneId,
      lane_session_id: coerceText(plan.lane_session_id).trim() || null,
      receipt_ref: coerceText(plan.receipt_ref).trim() || null,
      observation_ref: coerceText(plan.evidence_ref).trim() || null,
      terminal_eligible: plan.terminal_eligible === true,
      assistant_answer: plan.assistant_answer === true,
      raw_content_included: plan.raw_content_included === true,
      event_source: "capability_lane_goal_dispatch_plans",
      source_event_type: "lane_goal_dispatch_plan",
    };
  });
  const goalDispatchAdmissionEvents = goalDispatchAdmissions.slice(0, 10).map((admission, index) => {
    const laneId = coerceText(admission.lane_id).trim() || "capability_lane";
    const blockedReason = coerceText(admission.blocked_reason).trim();
    const status = blockedReason || coerceText(admission.status).trim() === "blocked"
      ? "failed"
      : "pending";
    return {
      id:
        coerceText(admission.goal_binding_id).trim()
          ? `${coerceText(admission.goal_binding_id).trim()}:dispatch-admission`
          : `${reply.id}-capability-lane-goal-dispatch-admission-${index}`,
      role: "system",
      type: "model_decision",
      status,
      text: formatHelixCapabilityLaneGoalDispatchAdmissionText(admission),
      detail:
        blockedReason ||
        coerceText(admission.target).trim() ||
        coerceText(admission.goal_id).trim() ||
        coerceText(admission.lane_session_id).trim() ||
        laneId,
      lane: laneId,
      step_id: "lane_goal_dispatch_admission",
      turn_id: turnId,
      capability_id: laneId,
      lane_session_id: coerceText(admission.lane_session_id).trim() || null,
      receipt_ref: coerceText(admission.receipt_ref).trim() || null,
      observation_ref: coerceText(admission.evidence_ref).trim() || null,
      terminal_eligible: admission.terminal_eligible === true,
      assistant_answer: admission.assistant_answer === true,
      raw_content_included: admission.raw_content_included === true,
      event_source: "capability_lane_goal_dispatch_admissions",
      source_event_type: "lane_goal_dispatch_admission",
    };
  });
  const goalDispatchReadinessEvents = goalDispatchReadiness
    ? [
        {
          id: `${reply.id}-capability-lane-goal-dispatch-readiness`,
          role: "system",
          type: "model_decision",
          status: coerceText(goalDispatchReadiness.blocked_count).trim() !== "0" ? "failed" : "pending",
          text: formatHelixCapabilityLaneGoalDispatchReadinessText(goalDispatchReadiness),
          detail:
            Array.isArray(goalDispatchReadiness.next_dispatch_targets)
              ? goalDispatchReadiness.next_dispatch_targets.map(coerceText).filter(Boolean).join(", ")
              : "dispatch_readiness",
          lane: Array.isArray(goalDispatchReadiness.next_lane_ids)
            ? goalDispatchReadiness.next_lane_ids.map(coerceText).find(Boolean) || "capability_lane_goal_dispatch"
            : "capability_lane_goal_dispatch",
          step_id: "lane_goal_dispatch_readiness",
          turn_id: turnId,
          lane_session_id: Array.isArray(goalDispatchReadiness.next_lane_session_ids)
            ? goalDispatchReadiness.next_lane_session_ids.map(coerceText).find(Boolean) || null
            : null,
          receipt_ref: Array.isArray(goalDispatchReadiness.next_receipt_refs)
            ? goalDispatchReadiness.next_receipt_refs.map(coerceText).find(Boolean) || null
            : null,
          observation_ref: Array.isArray(goalDispatchReadiness.next_evidence_refs)
            ? goalDispatchReadiness.next_evidence_refs.map(coerceText).find(Boolean) || null
            : null,
          terminal_eligible: goalDispatchReadiness.terminal_eligible === true,
          assistant_answer: goalDispatchReadiness.assistant_answer === true,
          raw_content_included: goalDispatchReadiness.raw_content_included === true,
          event_source: "capability_lane_goal_dispatch_readiness",
          source_event_type: "lane_goal_dispatch_readiness",
        },
      ]
    : [];
  if (calls.length === 0 && debugEvents.length > 0) {
    const events = debugEvents.slice(0, 40).map((event, index) => {
      const stage = coerceText(event.stage).trim();
      const laneId = coerceText(event.lane_id).trim() || "capability_lane";
      const capabilityId = coerceText(event.capability).trim() || laneId;
      const status = coerceText(event.status).trim() || "completed";
      const sourceEventType =
        stage === "lane_requested" ||
        stage === "lane_backend_selected" ||
        stage === "lane_observation" ||
        stage === "lane_reentered"
          ? stage
          : "lane_observation";
      return {
        id: coerceText(event.event_id).trim() || `${reply.id}-capability-lane-debug-${index}`,
        role: stage === "lane_backend_selected" ? "system" : stage === "lane_observation" ? "tool" : "agent",
        type: stage === "lane_observation" ? "tool_result" : "model_decision",
        status: status === "blocked" || status === "failed" ? "failed" : status === "pending" ? "pending" : "completed",
        text: formatHelixCapabilityLaneDebugEventText(event),
        detail:
          coerceText(event.selection_reason).trim() ||
          coerceText(event.observation_ref).trim() ||
          capabilityId,
        lane: laneId,
        step_id: coerceText(event.stage).trim() || `capability_lane_debug_${index + 1}`,
        turn_id: turnId,
        capability_id: capabilityId,
        selected_backend_provider: coerceText(event.selected_backend_provider).trim() || null,
        cost_class: coerceText(event.cost_class).trim() || null,
        latency_class: coerceText(event.latency_class).trim() || null,
        privacy_class: coerceText(event.privacy_class).trim() || null,
        fallback_backend_provider: coerceText(event.fallback_backend_provider).trim() || null,
        receipt_ref: coerceText(event.receipt_ref).trim() || null,
        observation_ref: coerceText(event.observation_ref).trim() || null,
        terminal_eligible: event.terminal_eligible === true,
        assistant_answer: event.assistant_answer === true,
        raw_content_included: event.raw_content_included === true,
        event_source: "capability_lane_debug_events",
        source_event_type: sourceEventType,
      };
    });
    events.push(...sessionEvents);
    events.push(...mailLoopEvents);
    events.push(...projectionReceiptEvents);
    events.push(...goalBindingEvents);
    events.push(...goalDispatchEvents);
    events.push(...goalDispatchAdmissionEvents);
    events.push(...goalDispatchReadinessEvents);
    if (terminalKind) {
      events.push({
        id: `${reply.id}-capability-lane-terminal-selected`,
        role: "agent",
        type: "decision",
        status: "completed",
        text: `Terminal selected: ${terminalKind}.`,
        detail: terminalKind,
        lane: "helix_terminal_authority",
        step_id: "terminal_selected",
        turn_id: turnId,
        event_source: "capability_lane_debug_events",
        source_event_type: "terminal_selected",
      });
    }
    return events;
  }
  const backendSelections = readHelixCapabilityLaneBackendSelections(reply);
  const usingBackendSelectionOnly = calls.length === 0;
  const rowCalls = calls.length > 0 ? calls : backendSelections;
  if (rowCalls.length === 0) {
    const events = [
      ...sessionEvents,
      ...mailLoopEvents,
      ...projectionReceiptEvents,
      ...goalBindingEvents,
      ...goalDispatchEvents,
      ...goalDispatchAdmissionEvents,
      ...goalDispatchReadinessEvents,
    ];
    if (terminalKind) {
      events.push({
        id: `${reply.id}-capability-lane-terminal-selected`,
        role: "agent",
        type: "decision",
        status: "completed",
        text: `Terminal selected: ${terminalKind}.`,
        detail: terminalKind,
        lane: "helix_terminal_authority",
        step_id: "terminal_selected",
        turn_id: turnId,
        event_source: "capability_lane_session_debug_summaries",
        source_event_type: "terminal_selected",
      });
    }
    return events;
  }
  const packets = readHelixCapabilityLaneObservationPackets(reply);
  const traces = readHelixCapabilityLaneResolveTraces(reply);
  const reentryStatus = readHelixCapabilityLaneReentryStatus(reply);
  const events: Record<string, unknown>[] = [];
  let successfulPacketPresent = false;

  rowCalls.slice(0, 10).forEach((call, index) => {
    const capabilityId = readHelixCapabilityLaneCapability(call);
    if (!capabilityId) return;
    const laneId = readHelixCapabilityLaneId(call) || capabilityId;
    const packet = readHelixCapabilityLaneObservationPacketForCall(call, packets);
    const trace =
      readHelixCapabilityLaneTraceForCall(call, traces) ??
      readHelixCapabilityLaneTraceForCall(call, backendSelections);
    const ok = hasSucceededHelixCapabilityLanePacket(packet, call);
    successfulPacketPresent = successfulPacketPresent || ok;
    const stepId = `capability_lane_${index + 1}`;
    const backendSummary = summarizeHelixCapabilityLaneBackend(trace);

    events.push({
      id: `${reply.id}-capability-lane-${index}-request`,
      role: "agent",
      type: "model_decision",
      status: "completed",
      text: `Lane requested: ${capabilityId}.`,
      detail: capabilityId,
      lane: laneId,
      step_id: stepId,
      turn_id: turnId,
      capability_id: capabilityId,
      event_source: "capability_lane_call_results",
      source_event_type: "lane_requested",
    });

    if (backendSummary) {
      events.push({
        id: `${reply.id}-capability-lane-${index}-backend`,
        role: "system",
        type: "decision",
        status: coerceText(trace?.permission_status).trim() === "permission_blocked" ? "blocked" : "completed",
        text: `Lane backend selected: ${backendSummary}.`,
        detail:
          coerceText(trace?.selected_backend_provider).trim() ||
          coerceText(trace?.backend_provider).trim() ||
          laneId,
        lane: laneId,
        step_id: stepId,
        turn_id: turnId,
        capability_id: capabilityId,
        selected_backend_provider: coerceText(trace?.selected_backend_provider).trim() || null,
        cost_class: coerceText(trace?.cost_class).trim() || null,
        latency_class: coerceText(trace?.latency_class).trim() || null,
        privacy_class: coerceText(trace?.privacy_class).trim() || null,
        fallback_backend_provider: coerceText(trace?.fallback_backend_provider).trim() || null,
        event_source: "capability_lane_resolve_traces",
        source_event_type: "lane_backend_selected",
      });
    }

    if (!usingBackendSelectionOnly || packet) {
      const packetBackend = readHelixCapabilityLanePacketBackend(packet);
      events.push({
        id: `${reply.id}-capability-lane-${index}-observation`,
        role: "tool",
        type: "tool_result",
        status: ok ? "completed" : "failed",
        text: formatHelixCapabilityLaneObservationText({ capabilityId, call, packet, ok }),
        detail: coerceText(packet?.observation_summary).trim() || coerceText(call.error).trim() || capabilityId,
        lane: laneId,
        step_id: stepId,
        turn_id: turnId,
        capability_id: capabilityId,
        lane_session_id: readHelixCapabilityLaneSessionId(call, packet) || null,
        selected_backend_provider: coerceText(packetBackend?.selected_backend_provider).trim() || null,
        requested_backend_provider: coerceText(packetBackend?.requested_backend_provider).trim() || null,
        availability_status: coerceText(packetBackend?.availability_status).trim() || null,
        permission_status: coerceText(packetBackend?.permission_status).trim() || null,
        execution_status: coerceText(packetBackend?.execution_status).trim() || null,
        cost_class: coerceText(packetBackend?.cost_class).trim() || null,
        latency_class: coerceText(packetBackend?.latency_class).trim() || null,
        privacy_class: coerceText(packetBackend?.privacy_class).trim() || null,
        fallback_backend_provider: coerceText(packetBackend?.fallback_backend_provider).trim() || null,
        event_source: "capability_lane_call_results",
        source_event_type: "lane_observation",
      });
    }
  });

  events.push(...sessionEvents);
  events.push(...mailLoopEvents);
  events.push(...projectionReceiptEvents);
  if (successfulPacketPresent || reentryStatus) {
    events.push({
      id: `${reply.id}-capability-lane-reentry`,
      role: "agent",
      type: "model_decision",
      status: successfulPacketPresent ? "completed" : "pending",
      text: successfulPacketPresent
        ? "Lane re-entry: observation packet available for provider reasoning before terminal selection."
        : `Lane re-entry: ${reentryStatus}.`,
      detail: reentryStatus || "capability_lane_observation_packets",
      lane: "capability_lane",
      step_id: "lane_reentry",
      turn_id: turnId,
      event_source: "capability_lane_observation_packets",
      source_event_type: "lane_reentered",
    });
  }

  events.push(...goalBindingEvents);
  events.push(...goalDispatchEvents);
  events.push(...goalDispatchAdmissionEvents);
  events.push(...goalDispatchReadinessEvents);

  if (terminalKind) {
    events.push({
      id: `${reply.id}-capability-lane-terminal-selected`,
      role: "agent",
      type: "decision",
      status: "completed",
      text: `Terminal selected: ${terminalKind}.`,
      detail: terminalKind,
      lane: "helix_terminal_authority",
      step_id: "terminal_selected",
      turn_id: turnId,
      event_source: "capability_lane_call_results",
      source_event_type: "terminal_selected",
    });
  }

  return events;
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

export function buildHelixRuntimeAskLiveEvents(reply: HelixAskTranscriptReply): AskLiveEventEntry[] {
  const events = [
    ...buildHelixRuntimeTranscriptEvents(reply),
    ...buildHelixWorkstationGatewayTranscriptEvents(reply),
    ...buildHelixCapabilityLaneTranscriptEvents(reply),
  ];
  return events.map((event, index) => ({
    id: coerceText(event.id).trim() || `${reply.id}-runtime-event-${index}`,
    text: coerceText(event.text).trim() || "Helix Ask runtime update",
    tool: coerceText(event.role).trim() || "agent",
    seq: index,
    meta: {
      stage: coerceText(event.type).trim() || "runtime",
      detail: coerceText(event.detail).trim() || null,
      status: coerceText(event.status).trim() || "completed",
      traceId: coerceText(event.trace_id).trim() || null,
      turnKey: coerceText(event.turn_id).trim() || null,
      stepId: coerceText(event.step_id).trim() || null,
      lane: coerceText(event.lane).trim() || null,
      capabilityId: coerceText(event.capability_id).trim() || null,
      laneSessionId: coerceText(event.lane_session_id).trim() || null,
      selectedBackendProvider: coerceText(event.selected_backend_provider).trim() || null,
      backendCostClass: coerceText(event.cost_class).trim() || null,
      backendLatencyClass: coerceText(event.latency_class).trim() || null,
      backendPrivacyClass: coerceText(event.privacy_class).trim() || null,
      fallbackBackendProvider: coerceText(event.fallback_backend_provider).trim() || null,
      receiptRef: coerceText(event.receipt_ref).trim() || null,
      observationRef: coerceText(event.observation_ref).trim() || null,
      terminalEligible: readTranscriptBoolean(event.terminal_eligible),
      assistantAnswer: readTranscriptBoolean(event.assistant_answer),
      rawContentIncluded: readTranscriptBoolean(event.raw_content_included),
      source_event_type: coerceText(event.source_event_type).trim() || null,
      event_source: coerceText(event.event_source).trim() || "agent_runtime_loop",
    },
  }));
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
  const gatewayEvents = buildHelixWorkstationGatewayTranscriptEvents(reply);
  const gatewayEventsPresent = gatewayEvents.length > 0;
  const laneEvents = buildHelixCapabilityLaneTranscriptEvents(reply);
  const laneEventsPresent = laneEvents.length > 0;
  const mergeGatewayProjectionEvents = (events: Record<string, unknown>[]): Record<string, unknown>[] => {
    if (!gatewayEventsPresent) return events;
    const filtered = events.filter((event) => {
      const sourceEventType = coerceText(event.source_event_type).trim();
      return ![
        "tool_request",
        "tool_observation",
        "action_request",
        "action_observation",
        "model_reentry",
      ].includes(sourceEventType);
    });
    const firstTerminalIndex = filtered.findIndex((event) => {
      const sourceEventType = coerceText(event.source_event_type).trim();
      const type = coerceText(event.type).trim();
      return sourceEventType === "terminal_answer" || type === "final_answer";
    });
    if (firstTerminalIndex < 0) return [...filtered, ...gatewayEvents];
    return [
      ...filtered.slice(0, firstTerminalIndex),
      ...gatewayEvents,
      ...filtered.slice(firstTerminalIndex),
    ];
  };
  const mergeLaneProjectionEvents = (events: Record<string, unknown>[]): Record<string, unknown>[] => {
    if (!laneEventsPresent) return events;
    const filtered = events.filter((event) => {
      const sourceEventType = coerceText(event.source_event_type).trim();
      return ![
        "lane_requested",
        "lane_backend_selected",
        "lane_observation",
        "lane_projection_receipt",
        "lane_reentered",
        "lane_session",
        "lane_mail_loop",
        "lane_goal_binding",
        "lane_goal_dispatch_plan",
        "lane_goal_dispatch_admission",
        "lane_goal_dispatch_readiness",
        "terminal_selected",
      ].includes(sourceEventType);
    });
    const firstTerminalIndex = filtered.findIndex((event) => {
      const sourceEventType = coerceText(event.source_event_type).trim();
      const type = coerceText(event.type).trim();
      return sourceEventType === "terminal_answer" || type === "final_answer";
    });
    if (firstTerminalIndex < 0) return [...filtered, ...laneEvents];
    return [
      ...filtered.slice(0, firstTerminalIndex),
      ...laneEvents,
      ...filtered.slice(firstTerminalIndex),
    ];
  };
  const mergeProjectionEvents = (events: Record<string, unknown>[]): Record<string, unknown>[] =>
    mergeLaneProjectionEvents(mergeGatewayProjectionEvents(events));
  const baseRuntimeEvents = buildHelixRuntimeTranscriptEvents(reply);
  const runtimeEvents = mergeProjectionEvents(baseRuntimeEvents);
  if (baseRuntimeEvents.length > 0) {
    return normalizeEvents(runtimeEvents);
  }
  const directEvents = Array.isArray(reply.debug?.turn_transcript_events)
    ? reply.debug.turn_transcript_events
    : [];
  if (directEvents.length > 0) {
    return normalizeEvents(mergeProjectionEvents(directEvents as Record<string, unknown>[]));
  }
  const audit = readAgentLoopAuditRecord(reply.debug?.agent_loop_audit);
  const auditEvents = Array.isArray(audit?.turn_transcript_events) ? audit.turn_transcript_events : [];
  return normalizeEvents(mergeProjectionEvents(auditEvents as Record<string, unknown>[]));
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
    const rowsWithFinal =
      lifecycleRows.some((row) => row.label === "Final") || !String(reply.content ?? "").trim()
        ? lifecycleRows
        : [
            ...lifecycleRows,
            {
              key: `${reply.id}-transcript-content-final`,
              role: "agent",
              label: "Final",
              text: String(reply.content ?? "").trim(),
              meta: "",
              status: "completed",
            },
          ];
    if (publicCommentaryRows.length > 0) {
      const lifecycleWithoutGenericCompletions = rowsWithFinal.filter((row) =>
        !/^Completed step\b/i.test(row.text),
      );
      return [...publicCommentaryRows, ...lifecycleWithoutGenericCompletions].slice(-14);
    }
    return rowsWithFinal.slice(-14);
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
