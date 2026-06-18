import type { NarratorDeliveryMode, NarratorSourceKind } from "./narrator-event.v1";

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
  | { kind: "wake_agent"; reason?: string | null };

export type GoalContextProducerKindV1 =
  | "visual_capture"
  | "audio_capture"
  | "transcription_loop"
  | "translation_loop"
  | "microdeck"
  | "reflection"
  | "live_answer"
  | "source_health"
  | "route_watch"
  | "narrator";

export type GoalContextUpdateKindV1 =
  | "summary"
  | "transcript_window"
  | "translated_transcript"
  | "visual_observation"
  | "classification"
  | "route_evidence"
  | "source_status"
  | "preset_state"
  | "reflection"
  | "error"
  | "suggested_action";

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
  | "route_evidence";

export type AgentGoalActuatorV1 =
  | "set_audio_preset"
  | "set_visual_preset"
  | "bind_narrator"
  | "narrator_bind_stream"
  | "narrator_say"
  | "update_live_answer"
  | "query_trace_memory"
  | "pause_loop"
  | "repair_source"
  | "ask_user";

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
  };
};

export type NarratorSayRequestV1 = {
  schemaVersion: typeof WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA;
  requestId: string;
  text: string;
  sourceKind: NarratorSourceKind;
  sourceId: string;
  evidenceRefs: string[];
  deliveryMode: Exclude<NarratorDeliveryMode, "hidden">;
  priority: "low" | "normal" | "high";
  language?: string;
  dedupeKey?: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type NarratorBindStreamRequestV1 = {
  schemaVersion: typeof WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA;
  requestId: string;
  sourceRef: string;
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
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const producerKinds = new Set<GoalContextProducerKindV1>([
  "visual_capture",
  "audio_capture",
  "transcription_loop",
  "translation_loop",
  "microdeck",
  "reflection",
  "live_answer",
  "source_health",
  "route_watch",
  "narrator",
]);

const updateKinds = new Set<GoalContextUpdateKindV1>([
  "summary",
  "transcript_window",
  "translated_transcript",
  "visual_observation",
  "classification",
  "route_evidence",
  "source_status",
  "preset_state",
  "reflection",
  "error",
  "suggested_action",
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

export function validateWorkstationGoalContextUpdateV1(value: WorkstationGoalContextUpdateV1): string[] {
  const issues: string[] = [];
  if (value.schemaVersion !== WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA) issues.push("schemaVersion must match goal context update schema");
  if (!value.updateId) issues.push("updateId is required");
  if (!Number.isFinite(value.createdAtMs) || value.createdAtMs <= 0) issues.push("createdAtMs must be a positive timestamp");
  if (!Array.isArray(value.sourceRefs)) issues.push("sourceRefs must be an array");
  if (!Array.isArray(value.loopRefs)) issues.push("loopRefs must be an array");
  if (!producerKinds.has(value.producerKind)) issues.push("producerKind is invalid");
  if (!updateKinds.has(value.updateKind)) issues.push("updateKind is invalid");
  if (!value.contentRef) issues.push("contentRef is required");
  if (!value.preview.trim()) issues.push("preview is required");
  if (!Array.isArray(value.evidenceRefs)) issues.push("evidenceRefs must be an array");
  if (!Array.isArray(value.receiptRefs)) issues.push("receiptRefs must be an array");
  if (!value.freshness || !Number.isFinite(value.freshness.observedAtMs)) issues.push("freshness.observedAtMs is required");
  if (!Array.isArray(value.suggestedDispatch)) issues.push("suggestedDispatch must be an array");
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
  if (!value.objective.trim()) issues.push("objective is required");
  if (!value.userVisibleSummary.trim()) issues.push("userVisibleSummary is required");
  if (!goalStatuses.has(value.status)) issues.push("status is invalid");
  if (!Array.isArray(value.sourceRefs)) issues.push("sourceRefs must be an array");
  if (!Array.isArray(value.loopRefs)) issues.push("loopRefs must be an array");
  if (!Array.isArray(value.contextFeeds)) issues.push("contextFeeds must be an array");
  if (!Array.isArray(value.allowedActuators)) issues.push("allowedActuators must be an array");
  if (!Array.isArray(value.stopConditions)) issues.push("stopConditions must be an array");
  if (value.authority?.assistantAnswer !== false) issues.push("goal sessions must not be assistant answers");
  if (value.authority?.finalReportsRequireTerminalAuthority !== true) issues.push("goal sessions require terminal authority for final reports");
  return issues;
}
