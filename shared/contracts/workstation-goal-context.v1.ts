import {
  NARRATOR_DELIVERY_MODES,
  NARRATOR_SOURCE_KINDS,
  type NarratorDeliveryMode,
  type NarratorSourceKind,
} from "./narrator-event.v1";

export const WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA = "helix.workstation_goal_context_update.v1" as const;
export const WORKSTATION_AGENT_GOAL_SESSION_SCHEMA = "helix.agent_goal_session.v1" as const;
export const WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA = "helix.narrator_say_request.v1" as const;
export const WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA = "helix.narrator_bind_stream_request.v1" as const;

export type WorkstationDispatchActionV1 =
  | { kind: "none" }
  | { kind: "log_receipt"; receiptRef?: string | null }
  | { kind: "update_live_answer"; lineKey: string }
  | { kind: "append_goal_context"; goalId: string }
  | { kind: "speak_narrator"; mode: "confirm" | "auto" | "visible_only" }
  | { kind: "bind_narrator_stream"; sourceRef: string; streamKind: NarratorBindStreamRequestV1["streamKind"]; deliveryMode?: Exclude<NarratorDeliveryMode, "hidden"> | null }
  | { kind: "change_preset"; targetRef: string; presetId: string }
  | { kind: "bind_source"; sourceRef: string; targetRef: string }
  | { kind: "unbind_source"; sourceRef: string; targetRef?: string | null }
  | { kind: "set_loop_state"; loopRef: string; state: "paused" | "running" | "repaired" }
  | { kind: "update_panel"; panelId: string }
  | { kind: "focus_process_graph"; nodeRef?: string | null }
  | { kind: "repair_loop"; loopRef: string }
  | { kind: "ask_user" }
  | { kind: "wake_agent"; interruptKind: "urgent" | "blocked" | "policy_triggered"; reason: string };

export type GoalContextProducerKindV1 =
  | "visual_capture"
  | "audio_capture"
  | "transcription_loop"
  | "translation_loop"
  | "microdeck"
  | "reflection"
  | "live_answer"
  | "source_health"
  | "trace_memory"
  | "route_watch"
  | "narrator"
  | "automation";

export const WORKSTATION_GOAL_CONTEXT_PRODUCER_KINDS: readonly GoalContextProducerKindV1[] = [
  "visual_capture",
  "audio_capture",
  "transcription_loop",
  "translation_loop",
  "microdeck",
  "reflection",
  "live_answer",
  "source_health",
  "trace_memory",
  "route_watch",
  "narrator",
  "automation",
];

export type GoalContextUpdateKindV1 =
  | "summary"
  | "transcript_window"
  | "translated_transcript"
  | "visual_observation"
  | "classification"
  | "route_evidence"
  | "source_status"
  | "preset_state"
  | "automation_status"
  | "reflection"
  | "error"
  | "suggested_action";

export const WORKSTATION_GOAL_CONTEXT_UPDATE_KINDS: readonly GoalContextUpdateKindV1[] = [
  "summary",
  "transcript_window",
  "translated_transcript",
  "visual_observation",
  "classification",
  "route_evidence",
  "source_status",
  "preset_state",
  "automation_status",
  "reflection",
  "error",
  "suggested_action",
];

export type WorkstationGoalContextUpdateV1 = {
  schemaVersion: typeof WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA;
  updateId: string;
  createdAtMs: number;
  sourceRefs: string[];
  loopRefs: string[];
  producerKind: GoalContextProducerKindV1;
  updateKind: GoalContextUpdateKindV1;
  contentRef: string;
  preview: string;
  evidenceRefs: string[];
  receiptRefs: string[];
  freshness: {
    observedAtMs: number;
    staleAfterMs?: number;
    status: "fresh" | "stale" | "blocked" | "unknown";
  };
  goalRelevance?: {
    goalId: string;
    relevance: number;
    reason: string;
  } | null;
  suggestedDispatch: WorkstationDispatchActionV1[];
  assistant_answer?: false;
  terminal_eligible?: false;
  raw_content_included?: false;
  authority: {
    assistantAnswer: false;
    terminalEligible: false;
    rawContentIncluded: false;
    postToolModelStepRequired: true;
  };
};

export type AgentGoalContextFeedKindV1 =
  | "visual_summaries"
  | "audio_transcripts"
  | "translated_transcripts"
  | "microdeck_outputs"
  | "live_answer_lines"
  | "source_health"
  | "trace_memory"
  | "narrator_events"
  | "packet_traces"
  | "route_evidence"
  | "automation_policies";

export const WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS: readonly AgentGoalContextFeedKindV1[] = [
  "visual_summaries",
  "audio_transcripts",
  "translated_transcripts",
  "microdeck_outputs",
  "live_answer_lines",
  "source_health",
  "trace_memory",
  "narrator_events",
  "packet_traces",
  "route_evidence",
  "automation_policies",
];

export type AgentGoalDefaultContextFeedSpecV1 = {
  sourceKind: AgentGoalContextFeedKindV1;
  freshnessMs: number;
  relevancePolicy: string;
};

export const WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS: readonly AgentGoalDefaultContextFeedSpecV1[] = [
  { sourceKind: "visual_summaries", freshnessMs: 30_000, relevancePolicy: "same-source-or-goal-id" },
  { sourceKind: "audio_transcripts", freshnessMs: 30_000, relevancePolicy: "same-source-or-goal-id" },
  { sourceKind: "translated_transcripts", freshnessMs: 45_000, relevancePolicy: "same-source-or-goal-id" },
  { sourceKind: "microdeck_outputs", freshnessMs: 30_000, relevancePolicy: "same-source-or-goal-id" },
  { sourceKind: "live_answer_lines", freshnessMs: 45_000, relevancePolicy: "same-goal-or-active-line" },
  { sourceKind: "source_health", freshnessMs: 60_000, relevancePolicy: "same-source" },
  { sourceKind: "trace_memory", freshnessMs: 120_000, relevancePolicy: "same-thread-or-turn" },
  { sourceKind: "narrator_events", freshnessMs: 60_000, relevancePolicy: "same-goal-or-stream-binding" },
  { sourceKind: "packet_traces", freshnessMs: 60_000, relevancePolicy: "same-source-or-packet" },
  { sourceKind: "route_evidence", freshnessMs: 60_000, relevancePolicy: "same-goal-or-route" },
  { sourceKind: "automation_policies", freshnessMs: 120_000, relevancePolicy: "same-goal-or-loop-policy" },
];

export type AgentGoalActuatorV1 =
  | "query_visual_summaries"
  | "query_audio_transcripts"
  | "query_translation_segments"
  | "query_microdeck_outputs"
  | "query_live_answer_state"
  | "query_source_health"
  | "query_narrator_events"
  | "query_packet_traces"
  | "query_route_evidence"
  | "query_automation_policies"
  | "configure_route_watch"
  | "set_audio_preset"
  | "set_visual_preset"
  | "change_preset"
  | "bind_source"
  | "unbind_source"
  | "bind_narrator"
  | "narrator_bind_stream"
  | "narrator_say"
  | "update_live_answer"
  | "query_trace_memory"
  | "pause_loop"
  | "resume_loop"
  | "set_loop_state"
  | "focus_process_graph"
  | "repair_source"
  | "ask_user";

export const WORKSTATION_AGENT_GOAL_ACTUATORS: readonly AgentGoalActuatorV1[] = [
  "query_visual_summaries",
  "query_audio_transcripts",
  "query_translation_segments",
  "query_microdeck_outputs",
  "query_live_answer_state",
  "query_source_health",
  "query_narrator_events",
  "query_packet_traces",
  "query_route_evidence",
  "query_automation_policies",
  "configure_route_watch",
  "set_audio_preset",
  "set_visual_preset",
  "change_preset",
  "bind_source",
  "unbind_source",
  "bind_narrator",
  "narrator_bind_stream",
  "narrator_say",
  "update_live_answer",
  "query_trace_memory",
  "pause_loop",
  "resume_loop",
  "set_loop_state",
  "focus_process_graph",
  "repair_source",
  "ask_user",
];

const normalizeWorkstationGoalToken = (value: unknown): string | null => {
  const normalized = typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    : "";
  return normalized || null;
};

export const WORKSTATION_AGENT_GOAL_ACTUATOR_ALIASES: Readonly<Record<string, AgentGoalActuatorV1>> = {
  live_env_query_visual_summaries: "query_visual_summaries",
  live_env_query_audio_transcripts: "query_audio_transcripts",
  live_env_query_translation_segments: "query_translation_segments",
  live_env_query_microdeck_outputs: "query_microdeck_outputs",
  live_env_query_micro_reasoner_outputs: "query_microdeck_outputs",
  live_env_query_live_answer_state: "query_live_answer_state",
  live_env_query_source_health: "query_source_health",
  live_env_query_narrator_events: "query_narrator_events",
  live_env_query_packet_traces: "query_packet_traces",
  live_env_query_route_evidence: "query_route_evidence",
  live_env_query_automation_policies: "query_automation_policies",
  live_env_configure_route_watch: "configure_route_watch",
  live_env_set_audio_preset: "set_audio_preset",
  live_env_set_visual_preset: "set_visual_preset",
  live_env_change_workstation_preset: "change_preset",
  live_env_bind_workstation_source: "bind_source",
  live_env_unbind_workstation_source: "unbind_source",
  live_env_pause_workstation_loop: "pause_loop",
  live_env_resume_workstation_loop: "resume_loop",
  live_env_set_workstation_loop_state: "set_loop_state",
  live_env_repair_workstation_source: "repair_source",
  live_env_update_live_answer_projection: "update_live_answer",
  live_env_focus_process_graph: "focus_process_graph",
  live_env_narrator_say: "narrator_say",
  live_env_narrator_bind_stream: "narrator_bind_stream",
  live_env_query_trace_memory: "query_trace_memory",
  narrator_say_request: "narrator_say",
  narrator_bind_stream_request: "narrator_bind_stream",
  set_audio_preset: "set_audio_preset",
  set_visual_preset: "set_visual_preset",
  audio_preset: "set_audio_preset",
  visual_preset: "set_visual_preset",
  pause_workstation_loop: "pause_loop",
  resume_workstation_loop: "resume_loop",
  repair_workstation_loop: "repair_source",
};

export function normalizeAgentGoalActuatorV1(value: unknown): AgentGoalActuatorV1 | null {
  const key = normalizeWorkstationGoalToken(value);
  if (!key) return null;
  if ((WORKSTATION_AGENT_GOAL_ACTUATORS as readonly string[]).includes(key)) {
    return key as AgentGoalActuatorV1;
  }
  return WORKSTATION_AGENT_GOAL_ACTUATOR_ALIASES[key] ?? null;
}

export type AgentGoalFinalReportRequirementsV1 = {
  completedSolverPathRequired: true;
  evidenceReentryRequired: true;
  routeAuthorityRequired: true;
  terminalAuthoritySingleWriterRequired: true;
  allowedTerminalArtifactKinds: string[];
  requiredEvidenceKinds: string[];
  prohibitedReportSources: string[];
};

export const WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS: AgentGoalFinalReportRequirementsV1 = {
  completedSolverPathRequired: true,
  evidenceReentryRequired: true,
  routeAuthorityRequired: true,
  terminalAuthoritySingleWriterRequired: true,
  allowedTerminalArtifactKinds: ["final_answer", "typed_failure", "request_user_input"],
  requiredEvidenceKinds: [
    "goal_context_update",
    "agent_step_observation_packet",
    "route_product_contract",
    "terminal_authority_single_writer",
  ],
  prohibitedReportSources: [
    "goal_context_update",
    "tool_receipt",
    "panel_projection",
    "microdeck_output",
    "narrator_event",
    "wake_request",
  ],
};

export type AgentGoalSessionV1 = {
  schemaVersion: typeof WORKSTATION_AGENT_GOAL_SESSION_SCHEMA;
  goalId: string;
  threadId: string;
  roomId?: string | null;
  objective: string;
  userVisibleSummary: string;
  status: "draft" | "active" | "paused" | "blocked" | "satisfied" | "stopped" | "failed";
  sourceRefs: string[];
  loopRefs: string[];
  constructRefs: string[];
  contextFeeds: Array<{
    feedId: string;
    sourceKind: AgentGoalContextFeedKindV1;
    query?: string;
    freshnessMs?: number;
    relevancePolicy?: string;
  }>;
  allowedActuators: AgentGoalActuatorV1[];
  cadence:
    | { kind: "manual" }
    | { kind: "interval"; everyMs: number }
    | { kind: "event_accumulation"; minUpdates: number }
    | { kind: "user_turn_only" };
  stopConditions: string[];
  checkpoints: Array<{
    checkpointId: string;
    createdAtMs: number;
    summary: string;
    evidenceRefs: string[];
    actionsTaken: string[];
    nextStep: "continue" | "ask_user" | "repair" | "report" | "stop";
  }>;
  authority: {
    assistantAnswer: false;
    finalReportsRequireTerminalAuthority: true;
    finalReportRequirements: AgentGoalFinalReportRequirementsV1;
  };
};

export type NarratorSayRequestV1 = {
  schemaVersion: typeof WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA;
  requestId: string;
  text: string;
  sourceKind: NarratorSourceKind;
  sourceId: string;
  sourceRefs: string[];
  loopRefs: string[];
  evidenceRefs: string[];
  producedRefs: string[];
  goalContextUpdateId: string;
  deliveryMode: Exclude<NarratorDeliveryMode, "hidden">;
  priority: "low" | "normal" | "high";
  language?: string;
  dedupeKey?: string;
  terminalAuthority: {
    status: "not_terminal";
    finalAnswerEligible: false;
    completedSolverPathRequired: true;
    terminalAuthoritySingleWriterRequired: true;
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type NarratorBindStreamRequestV1 = {
  schemaVersion: typeof WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA;
  requestId: string;
  sourceRef: string;
  sourceRefs: string[];
  loopRefs: string[];
  evidenceRefs: string[];
  producedRefs: string[];
  goalContextUpdateId: string;
  streamKind:
    | "transcript_stream"
    | "translated_transcript"
    | "translated_speech"
    | "typed_commentary"
    | "route_evidence"
    | "source_health_status";
  presetId?: string | null;
  deliveryMode: Exclude<NarratorDeliveryMode, "hidden">;
  voicePolicy: "muted" | "propose_only" | "confirm_speak_required" | "automatic_when_policy_allows";
  evidenceThreshold?: "observed" | "likely" | "confirmed";
  terminalAuthority: {
    status: "not_terminal";
    finalAnswerEligible: false;
    completedSolverPathRequired: true;
    terminalAuthoritySingleWriterRequired: true;
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const WORKSTATION_NARRATOR_STREAM_KINDS: readonly NarratorBindStreamRequestV1["streamKind"][] = [
  "transcript_stream",
  "translated_transcript",
  "translated_speech",
  "typed_commentary",
  "route_evidence",
  "source_health_status",
];

export const WORKSTATION_NARRATOR_VOICE_POLICIES: readonly NarratorBindStreamRequestV1["voicePolicy"][] = [
  "muted",
  "propose_only",
  "confirm_speak_required",
  "automatic_when_policy_allows",
];

export const WORKSTATION_NARRATOR_PRIORITIES: readonly NarratorSayRequestV1["priority"][] = [
  "low",
  "normal",
  "high",
];

const producerKinds = new Set<GoalContextProducerKindV1>(WORKSTATION_GOAL_CONTEXT_PRODUCER_KINDS);

const updateKinds = new Set<GoalContextUpdateKindV1>(WORKSTATION_GOAL_CONTEXT_UPDATE_KINDS);

const freshnessStatuses = new Set<WorkstationGoalContextUpdateV1["freshness"]["status"]>([
  "fresh",
  "stale",
  "blocked",
  "unknown",
]);

const goalStatuses = new Set<AgentGoalSessionV1["status"]>([
  "draft",
  "active",
  "paused",
  "blocked",
  "satisfied",
  "stopped",
  "failed",
]);

const agentGoalContextFeedKinds = new Set<AgentGoalContextFeedKindV1>(WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS);

const agentGoalActuators = new Set<AgentGoalActuatorV1>(WORKSTATION_AGENT_GOAL_ACTUATORS);

const narratorSourceKinds = new Set<string>(NARRATOR_SOURCE_KINDS);

const narratorVisibleDeliveryModes = new Set<string>(
  NARRATOR_DELIVERY_MODES.filter((mode) => mode !== "hidden"),
);

const narratorStreamKinds = new Set<string>(WORKSTATION_NARRATOR_STREAM_KINDS);

const narratorVoicePolicies = new Set<string>(WORKSTATION_NARRATOR_VOICE_POLICIES);

const narratorPriorities = new Set<string>(WORKSTATION_NARRATOR_PRIORITIES);

const terminalAuthorityIssue = (value: unknown, field: string): string[] => {
  const issues: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [`${field} must be an object`];
  const record = value as Record<string, unknown>;
  if (record.status !== "not_terminal") issues.push(`${field}.status must be not_terminal`);
  if (record.finalAnswerEligible !== false) issues.push(`${field}.finalAnswerEligible must be false`);
  if (record.completedSolverPathRequired !== true) issues.push(`${field}.completedSolverPathRequired must be true`);
  if (record.terminalAuthoritySingleWriterRequired !== true) {
    issues.push(`${field}.terminalAuthoritySingleWriterRequired must be true`);
  }
  return issues;
};

const stringArrayIssue = (value: unknown, field: string, options: { requireNonEmpty?: boolean } = {}): string[] => {
  if (!Array.isArray(value)) return [`${field} must be an array`];
  const issues: string[] = [];
  if (options.requireNonEmpty && value.length === 0) issues.push(`${field} must include at least one reference`);
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) issues.push(`${field}[${index}] must be a non-empty string`);
  });
  return issues;
};

const dispatchActionIssues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return ["suggestedDispatch must be an array"];
  const issues: string[] = [];
  value.forEach((action, index) => {
    if (typeof action !== "object" || action === null || Array.isArray(action)) {
      issues.push(`suggestedDispatch[${index}] must be an object`);
      return;
    }
    const record = action as Record<string, unknown>;
    if (typeof record.kind !== "string" || !record.kind.trim()) {
      issues.push(`suggestedDispatch[${index}].kind must be a non-empty string`);
      return;
    }
    if (record.kind === "log_receipt" && (typeof record.receiptRef !== "string" || !record.receiptRef.trim())) {
      issues.push(`suggestedDispatch[${index}].log_receipt must include receiptRef`);
    }
    if (record.kind === "append_goal_context" && (typeof record.goalId !== "string" || !record.goalId.trim())) {
      issues.push(`suggestedDispatch[${index}].append_goal_context must include goalId`);
    }
    if (record.kind === "update_panel" && (typeof record.panelId !== "string" || !record.panelId.trim())) {
      issues.push(`suggestedDispatch[${index}].update_panel must include panelId`);
    }
    if (record.kind === "update_live_answer" && (typeof record.lineKey !== "string" || !record.lineKey.trim())) {
      issues.push(`suggestedDispatch[${index}].update_live_answer must include lineKey`);
    }
    if (record.kind === "speak_narrator") {
      if (record.mode !== "confirm" && record.mode !== "auto" && record.mode !== "visible_only") {
        issues.push(`suggestedDispatch[${index}].speak_narrator mode is invalid`);
      }
    }
    if (record.kind === "bind_narrator_stream") {
      if (typeof record.sourceRef !== "string" || !record.sourceRef.trim()) {
        issues.push(`suggestedDispatch[${index}].bind_narrator_stream must include sourceRef`);
      }
      if (!narratorStreamKinds.has(record.streamKind as string)) {
        issues.push(`suggestedDispatch[${index}].bind_narrator_stream streamKind is invalid`);
      }
      if (
        record.deliveryMode !== undefined &&
        record.deliveryMode !== null &&
        !narratorVisibleDeliveryModes.has(record.deliveryMode as string)
      ) {
        issues.push(`suggestedDispatch[${index}].bind_narrator_stream deliveryMode is invalid`);
      }
    }
    if (record.kind === "set_loop_state") {
      if (typeof record.loopRef !== "string" || !record.loopRef.trim()) {
        issues.push(`suggestedDispatch[${index}].set_loop_state must include loopRef`);
      }
      if (record.state !== "paused" && record.state !== "running" && record.state !== "repaired") {
        issues.push(`suggestedDispatch[${index}].set_loop_state state is invalid`);
      }
    }
    if (record.kind === "repair_loop" && (typeof record.loopRef !== "string" || !record.loopRef.trim())) {
      issues.push(`suggestedDispatch[${index}].repair_loop must include loopRef`);
    }
    if (record.kind === "wake_agent") {
      if (
        record.interruptKind !== "urgent" &&
        record.interruptKind !== "blocked" &&
        record.interruptKind !== "policy_triggered"
      ) {
        issues.push("wake_agent dispatch must include interruptKind urgent, blocked, or policy_triggered");
      }
      if (typeof record.reason !== "string" || !record.reason.trim()) {
        issues.push("wake_agent dispatch must include a non-empty reason");
      }
    }
  });
  return issues;
};

const goalSessionCadenceIssues = (value: unknown): string[] => {
  const issues: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) return ["cadence must be an object"];
  const cadence = value as Partial<AgentGoalSessionV1["cadence"]>;
  if (
    cadence.kind !== "manual" &&
    cadence.kind !== "interval" &&
    cadence.kind !== "event_accumulation" &&
    cadence.kind !== "user_turn_only"
  ) {
    issues.push("cadence.kind is invalid");
  }
  if (cadence.kind === "interval" && (!Number.isFinite(cadence.everyMs) || cadence.everyMs <= 0)) {
    issues.push("cadence.everyMs must be a positive number");
  }
  if (cadence.kind === "event_accumulation" && (!Number.isFinite(cadence.minUpdates) || cadence.minUpdates <= 0)) {
    issues.push("cadence.minUpdates must be a positive number");
  }
  return issues;
};

const checkpointNextSteps = new Set<AgentGoalSessionV1["checkpoints"][number]["nextStep"]>([
  "continue",
  "ask_user",
  "repair",
  "report",
  "stop",
]);

const goalSessionCheckpointIssues = (value: unknown): string[] => {
  if (!Array.isArray(value)) return ["checkpoints must be an array"];
  const issues: string[] = [];
  value.forEach((checkpoint, index) => {
    if (typeof checkpoint !== "object" || checkpoint === null || Array.isArray(checkpoint)) {
      issues.push(`checkpoints[${index}] must be an object`);
      return;
    }
    const entry = checkpoint as AgentGoalSessionV1["checkpoints"][number];
    if (typeof entry.checkpointId !== "string" || !entry.checkpointId.trim()) {
      issues.push(`checkpoints[${index}].checkpointId is required`);
    }
    if (!Number.isFinite(entry.createdAtMs) || entry.createdAtMs <= 0) {
      issues.push(`checkpoints[${index}].createdAtMs must be a positive timestamp`);
    }
    if (typeof entry.summary !== "string" || !entry.summary.trim()) {
      issues.push(`checkpoints[${index}].summary is required`);
    }
    issues.push(...stringArrayIssue(entry.evidenceRefs, `checkpoints[${index}].evidenceRefs`, { requireNonEmpty: true }));
    issues.push(...stringArrayIssue(entry.actionsTaken, `checkpoints[${index}].actionsTaken`, { requireNonEmpty: true }));
    if (!checkpointNextSteps.has(entry.nextStep)) {
      issues.push(`checkpoints[${index}].nextStep is invalid`);
    }
  });
  return issues;
};

export function validateWorkstationGoalContextUpdateV1(value: WorkstationGoalContextUpdateV1): string[] {
  const issues: string[] = [];
  if (value.schemaVersion !== WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA) issues.push("schemaVersion must match goal context update schema");
  if (!value.updateId) issues.push("updateId is required");
  if (!Number.isFinite(value.createdAtMs) || value.createdAtMs <= 0) issues.push("createdAtMs must be a positive timestamp");
  issues.push(...stringArrayIssue(value.sourceRefs, "sourceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.loopRefs, "loopRefs"));
  if (!producerKinds.has(value.producerKind)) issues.push("producerKind is invalid");
  if (!updateKinds.has(value.updateKind)) issues.push("updateKind is invalid");
  if (!value.contentRef) issues.push("contentRef is required");
  if (!value.preview.trim()) issues.push("preview is required");
  issues.push(...stringArrayIssue(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.evidenceRefs) && value.contentRef && !value.evidenceRefs.includes(value.contentRef)) {
    issues.push("evidenceRefs must include contentRef");
  }
  issues.push(...stringArrayIssue(value.receiptRefs, "receiptRefs"));
  if (!value.freshness || !Number.isFinite(value.freshness.observedAtMs) || value.freshness.observedAtMs <= 0) {
    issues.push("freshness.observedAtMs must be a positive timestamp");
  }
  if (value.freshness?.staleAfterMs !== undefined && (!Number.isFinite(value.freshness.staleAfterMs) || value.freshness.staleAfterMs <= 0)) {
    issues.push("freshness.staleAfterMs must be a positive number");
  }
  if (!freshnessStatuses.has(value.freshness?.status)) issues.push("freshness.status is invalid");
  issues.push(...dispatchActionIssues(value.suggestedDispatch));
  if (value.assistant_answer !== false) issues.push("goal context updates must expose assistant_answer=false");
  if (value.terminal_eligible !== false) issues.push("goal context updates must expose terminal_eligible=false");
  if (value.raw_content_included !== false) issues.push("goal context updates must expose raw_content_included=false");
  if (value.authority?.assistantAnswer !== false) issues.push("goal context updates must not be assistant answers");
  if (value.authority?.terminalEligible !== false) issues.push("goal context updates must not be terminal eligible");
  if (value.authority?.rawContentIncluded !== false) issues.push("goal context updates must not include raw content");
  if (value.authority?.postToolModelStepRequired !== true) issues.push("goal context updates require a post-tool model step before answers");
  return issues;
}

export function validateAgentGoalSessionV1(value: AgentGoalSessionV1): string[] {
  const issues: string[] = [];
  if (value.schemaVersion !== WORKSTATION_AGENT_GOAL_SESSION_SCHEMA) issues.push("schemaVersion must match agent goal session schema");
  if (!value.goalId) issues.push("goalId is required");
  if (!value.threadId) issues.push("threadId is required");
  if (typeof value.objective !== "string" || !value.objective.trim()) issues.push("objective is required");
  if (typeof value.userVisibleSummary !== "string" || !value.userVisibleSummary.trim()) {
    issues.push("userVisibleSummary is required");
  }
  if (!goalStatuses.has(value.status)) issues.push("status is invalid");
  issues.push(...stringArrayIssue(value.sourceRefs, "sourceRefs"));
  issues.push(...stringArrayIssue(value.loopRefs, "loopRefs"));
  issues.push(...stringArrayIssue(value.constructRefs, "constructRefs"));
  if (!Array.isArray(value.contextFeeds)) issues.push("contextFeeds must be an array");
  if (Array.isArray(value.contextFeeds)) {
    if (value.contextFeeds.length === 0) issues.push("contextFeeds must include at least one feed");
    value.contextFeeds.forEach((feed, index) => {
      if (!feed?.feedId) issues.push(`contextFeeds[${index}].feedId is required`);
      if (!agentGoalContextFeedKinds.has(feed?.sourceKind)) issues.push(`contextFeeds[${index}].sourceKind is invalid`);
      if (feed?.query !== undefined && (typeof feed.query !== "string" || !feed.query.trim())) {
        issues.push(`contextFeeds[${index}].query must be a non-empty string`);
      }
      if (feed?.freshnessMs !== undefined && (!Number.isFinite(feed.freshnessMs) || feed.freshnessMs <= 0)) {
        issues.push(`contextFeeds[${index}].freshnessMs must be a positive number`);
      }
      if (feed?.relevancePolicy !== undefined && (typeof feed.relevancePolicy !== "string" || !feed.relevancePolicy.trim())) {
        issues.push(`contextFeeds[${index}].relevancePolicy must be a non-empty string`);
      }
    });
  }
  if (!Array.isArray(value.allowedActuators)) issues.push("allowedActuators must be an array");
  if (Array.isArray(value.allowedActuators)) {
    if (value.allowedActuators.length === 0) issues.push("allowedActuators must include at least one actuator");
    value.allowedActuators.forEach((actuator, index) => {
      if (!agentGoalActuators.has(actuator)) issues.push(`allowedActuators[${index}] is invalid`);
    });
  }
  issues.push(...goalSessionCadenceIssues(value.cadence));
  issues.push(...stringArrayIssue(value.stopConditions, "stopConditions", { requireNonEmpty: true }));
  issues.push(...goalSessionCheckpointIssues(value.checkpoints));
  if (value.authority?.assistantAnswer !== false) issues.push("goal sessions must not be assistant answers");
  if (value.authority?.finalReportsRequireTerminalAuthority !== true) issues.push("goal sessions require terminal authority for final reports");
  const requirements = value.authority?.finalReportRequirements;
  if (!requirements) {
    issues.push("goal sessions must track final report authority requirements");
  } else {
    if (requirements.completedSolverPathRequired !== true) issues.push("final report requirements must require completed solver path");
    if (requirements.evidenceReentryRequired !== true) issues.push("final report requirements must require evidence re-entry");
    if (requirements.routeAuthorityRequired !== true) issues.push("final report requirements must require route authority");
    if (requirements.terminalAuthoritySingleWriterRequired !== true) issues.push("final report requirements must require terminal authority single writer");
    issues.push(...stringArrayIssue(requirements.allowedTerminalArtifactKinds, "authority.finalReportRequirements.allowedTerminalArtifactKinds", { requireNonEmpty: true }));
    issues.push(...stringArrayIssue(requirements.requiredEvidenceKinds, "authority.finalReportRequirements.requiredEvidenceKinds", { requireNonEmpty: true }));
    issues.push(...stringArrayIssue(requirements.prohibitedReportSources, "authority.finalReportRequirements.prohibitedReportSources", { requireNonEmpty: true }));
  }
  return issues;
}

export function validateNarratorSayRequestV1(value: NarratorSayRequestV1): string[] {
  const issues: string[] = [];
  if (value.schemaVersion !== WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA) issues.push("schemaVersion must match narrator say request schema");
  if (!value.requestId) issues.push("requestId is required");
  if (!value.text.trim()) issues.push("text is required");
  if (!narratorSourceKinds.has(value.sourceKind)) issues.push("sourceKind is invalid");
  if (!value.sourceId) issues.push("sourceId is required");
  issues.push(...stringArrayIssue(value.sourceRefs, "sourceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.loopRefs, "loopRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.producedRefs, "producedRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.evidenceRefs) && value.requestId && !value.evidenceRefs.includes(value.requestId)) {
    issues.push("evidenceRefs must include requestId");
  }
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes("narrator:say")) {
    issues.push("loopRefs must include narrator:say");
  }
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes("workstation_actuator:narrator_say")) {
    issues.push("loopRefs must include workstation_actuator:narrator_say");
  }
  if (Array.isArray(value.evidenceRefs) && Array.isArray(value.sourceRefs)) {
    for (const ref of value.sourceRefs) {
      if (!value.evidenceRefs.includes(ref)) {
        issues.push("evidenceRefs must include every sourceRefs entry");
        break;
      }
    }
  }
  if (Array.isArray(value.evidenceRefs) && Array.isArray(value.loopRefs)) {
    for (const ref of value.loopRefs) {
      if (!value.evidenceRefs.includes(ref)) {
        issues.push("evidenceRefs must include every loopRefs entry");
        break;
      }
    }
  }
  if (Array.isArray(value.evidenceRefs) && !value.evidenceRefs.includes("allowed_actuator:narrator_say")) {
    issues.push("evidenceRefs must include narrator_say actuator policy ref");
  }
  if (Array.isArray(value.producedRefs) && value.requestId && !value.producedRefs.includes(value.requestId)) {
    issues.push("producedRefs must include requestId");
  }
  if (!value.goalContextUpdateId) issues.push("goalContextUpdateId is required");
  if (
    Array.isArray(value.producedRefs) &&
    value.goalContextUpdateId &&
    !value.producedRefs.includes(value.goalContextUpdateId)
  ) {
    issues.push("producedRefs must include goalContextUpdateId");
  }
  if (!narratorVisibleDeliveryModes.has(value.deliveryMode)) issues.push("deliveryMode must be visible_only, confirm_to_speak, or auto_speak");
  if (!narratorPriorities.has(value.priority)) issues.push("priority is invalid");
  issues.push(...terminalAuthorityIssue(value.terminalAuthority, "terminalAuthority"));
  if (value.assistant_answer !== false) issues.push("narrator say requests must not be assistant answers");
  if (value.terminal_eligible !== false) issues.push("narrator say requests must not be terminal eligible");
  if (value.raw_content_included !== false) issues.push("narrator say requests must not include raw content");
  return issues;
}

export function validateNarratorBindStreamRequestV1(value: NarratorBindStreamRequestV1): string[] {
  const issues: string[] = [];
  if (value.schemaVersion !== WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA) issues.push("schemaVersion must match narrator bind stream request schema");
  if (!value.requestId) issues.push("requestId is required");
  if (!value.sourceRef) issues.push("sourceRef is required");
  issues.push(...stringArrayIssue(value.sourceRefs, "sourceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.loopRefs, "loopRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssue(value.producedRefs, "producedRefs", { requireNonEmpty: true }));
  if (Array.isArray(value.evidenceRefs) && value.requestId && !value.evidenceRefs.includes(value.requestId)) {
    issues.push("evidenceRefs must include requestId");
  }
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes("narrator:bind_stream")) {
    issues.push("loopRefs must include narrator:bind_stream");
  }
  if (Array.isArray(value.loopRefs) && !value.loopRefs.includes("workstation_actuator:narrator_bind_stream")) {
    issues.push("loopRefs must include workstation_actuator:narrator_bind_stream");
  }
  if (Array.isArray(value.evidenceRefs) && Array.isArray(value.sourceRefs)) {
    for (const ref of value.sourceRefs) {
      if (!value.evidenceRefs.includes(ref)) {
        issues.push("evidenceRefs must include every sourceRefs entry");
        break;
      }
    }
  }
  if (Array.isArray(value.evidenceRefs) && Array.isArray(value.loopRefs)) {
    for (const ref of value.loopRefs) {
      if (!value.evidenceRefs.includes(ref)) {
        issues.push("evidenceRefs must include every loopRefs entry");
        break;
      }
    }
  }
  if (Array.isArray(value.evidenceRefs) && !value.evidenceRefs.includes("allowed_actuator:narrator_bind_stream")) {
    issues.push("evidenceRefs must include narrator_bind_stream actuator policy ref");
  }
  if (Array.isArray(value.producedRefs) && value.requestId && !value.producedRefs.includes(value.requestId)) {
    issues.push("producedRefs must include requestId");
  }
  if (!value.goalContextUpdateId) issues.push("goalContextUpdateId is required");
  if (
    Array.isArray(value.producedRefs) &&
    value.goalContextUpdateId &&
    !value.producedRefs.includes(value.goalContextUpdateId)
  ) {
    issues.push("producedRefs must include goalContextUpdateId");
  }
  if (!narratorStreamKinds.has(value.streamKind)) issues.push("streamKind is invalid");
  if (!narratorVisibleDeliveryModes.has(value.deliveryMode)) issues.push("deliveryMode must be visible_only, confirm_to_speak, or auto_speak");
  if (!narratorVoicePolicies.has(value.voicePolicy)) issues.push("voicePolicy is invalid");
  issues.push(...terminalAuthorityIssue(value.terminalAuthority, "terminalAuthority"));
  if (value.assistant_answer !== false) issues.push("narrator bind stream requests must not be assistant answers");
  if (value.terminal_eligible !== false) issues.push("narrator bind stream requests must not be terminal eligible");
  if (value.raw_content_included !== false) issues.push("narrator bind stream requests must not include raw content");
  return issues;
}
