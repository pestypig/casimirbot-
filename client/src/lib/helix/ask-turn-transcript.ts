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
  const baseRuntimeEvents = buildHelixRuntimeTranscriptEvents(reply);
  const runtimeEvents = mergeGatewayProjectionEvents(baseRuntimeEvents);
  if (baseRuntimeEvents.length > 0) {
    return normalizeEvents(runtimeEvents);
  }
  const directEvents = Array.isArray(reply.debug?.turn_transcript_events)
    ? reply.debug.turn_transcript_events
    : [];
  if (directEvents.length > 0) {
    return normalizeEvents(mergeGatewayProjectionEvents(directEvents as Record<string, unknown>[]));
  }
  const audit = readAgentLoopAuditRecord(reply.debug?.agent_loop_audit);
  const auditEvents = Array.isArray(audit?.turn_transcript_events) ? audit.turn_transcript_events : [];
  return normalizeEvents(mergeGatewayProjectionEvents(auditEvents as Record<string, unknown>[]));
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
