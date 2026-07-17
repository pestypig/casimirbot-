import crypto from "node:crypto";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
  normalizeAgentGoalActuatorV1,
  type AgentGoalActuatorV1,
  type AgentGoalContextFeedKindV1,
  type AgentGoalSessionV1,
} from "@shared/contracts/workstation-goal-context.v1";
import type {
  HelixRuntimeGoalSession,
  HelixRuntimeGoalStagePlayProjection,
} from "@shared/helix-runtime-goal-session";
import {
  listStagePlayAgentGoalSessions,
  recordStagePlayGoalContextUpdate,
  upsertStagePlayAgentGoalSession,
} from "../../stage-play/stage-play-goal-context-store";

const RUNTIME_GOAL_CONTEXT_FEEDS: readonly AgentGoalContextFeedKindV1[] = [
  "visual_summaries",
  "audio_transcripts",
  "translated_transcripts",
  "live_answer_lines",
  "source_health",
  "trace_memory",
  "route_evidence",
];

const BASE_READ_ONLY_ACTUATORS: readonly AgentGoalActuatorV1[] = [
  "query_trace_memory",
  "query_route_evidence",
];

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = (values: Array<string | null | undefined>, limit = Number.MAX_SAFE_INTEGER): string[] =>
  Array.from(new Set(values
    .map((value: string | null | undefined) => String(value ?? "").trim())
    .filter(Boolean))).slice(0, limit);

const clip = (value: string, limit = 240): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit
    ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...`
    : normalized;
};

const toMs = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const stagePlayStatus = (status: HelixRuntimeGoalSession["status"]): AgentGoalSessionV1["status"] => {
  if (status === "blocked") return "blocked";
  if (status === "completed") return "satisfied";
  if (status === "cancelled") return "stopped";
  if (status === "failed") return "failed";
  return "active";
};

const nextStepFor = (
  status: AgentGoalSessionV1["status"],
): AgentGoalSessionV1["checkpoints"][number]["nextStep"] => {
  if (status === "blocked" || status === "failed") return "ask_user";
  if (status === "satisfied") return "report";
  if (status === "stopped") return "stop";
  return "continue";
};

const sourceRefsFor = (session: HelixRuntimeGoalSession): string[] => unique([
  session.latest_source_binding?.source_id,
  session.latest_source_binding?.doc_path,
  session.latest_source_binding?.active_panel_id,
  session.latest_source_binding?.source_hash,
]);

const evidenceRefsFor = (session: HelixRuntimeGoalSession): string[] => unique([
  `${session.goal_id}:job_brief`,
  ...sourceRefsFor(session),
  ...session.latest_observation_refs,
  ...session.latest_receipt_refs,
  session.latest_provider_terminal_candidate_ref,
], 48);

const readOnlyActuatorsFor = (session: HelixRuntimeGoalSession): AgentGoalActuatorV1[] => unique([
  ...BASE_READ_ONLY_ACTUATORS,
  ...session.allowed_workstation_tools
    .map(normalizeAgentGoalActuatorV1)
    .filter((actuator: AgentGoalActuatorV1 | null): actuator is AgentGoalActuatorV1 =>
      Boolean(actuator?.startsWith("query_"))),
]) as AgentGoalActuatorV1[];

const checkpointSummaryFor = (session: HelixRuntimeGoalSession): string => clip(
  session.latest_progress_summary?.current_summary ||
    (session.status === "blocked" || session.status === "failed"
      ? `Runtime goal ${session.status}: ${session.status_reason ?? "unknown reason"}.`
      : `Runtime goal ${session.status}: ${session.objective}`),
);

const failedProjection = (session: HelixRuntimeGoalSession): HelixRuntimeGoalStagePlayProjection => ({
  schema: "helix.runtime_goal.stage_play_projection.v1",
  status: "failed",
  goal_id: session.goal_id,
  thread_id: session.thread_id,
  runtime_session_id: session.runtime_session_id,
  stage_play_goal_session_ref: null,
  context_update_ref: null,
  projected_evidence_refs: [],
  failure_code: "stage_play_projection_failed",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const projectRuntimeGoalSessionToStagePlay = (
  session: HelixRuntimeGoalSession,
): HelixRuntimeGoalStagePlayProjection => {
  try {
    const nowMs = toMs(session.updated_at);
    const sourceRefs = sourceRefsFor(session);
    const evidenceRefs = evidenceRefsFor(session);
    const status = stagePlayStatus(session.status);
    const existing = listStagePlayAgentGoalSessions({
      threadId: session.thread_id,
      goalId: session.goal_id,
      limit: 1,
    })[0] ?? null;
    const contextFeeds: AgentGoalSessionV1["contextFeeds"] = RUNTIME_GOAL_CONTEXT_FEEDS.map(
      (sourceKind: AgentGoalContextFeedKindV1) => ({
        feedId: `runtime-goal-feed:${hashShort([session.goal_id, sourceKind], 12)}`,
        sourceKind,
        freshnessMs: sourceKind === "trace_memory" ? 120_000 : 60_000,
        relevancePolicy: "same-goal-or-thread",
      }),
    );
    const checkpointSummary = checkpointSummaryFor(session);
    const checkpoint = {
      checkpointId: `runtime-goal-checkpoint:${hashShort([
        session.goal_id,
        session.updated_at,
        session.status,
        session.wake_count,
        evidenceRefs,
      ], 16)}`,
      createdAtMs: nowMs,
      summary: checkpointSummary,
      evidenceRefs,
      actionsTaken: unique([
        existing ? "project_runtime_goal_progress" : "project_runtime_goal_started",
        `runtime_status:${session.status}`,
        `runtime_provider:${session.runtime_agent_provider}`,
      ], 12),
      nextStep: nextStepFor(status),
    } satisfies AgentGoalSessionV1["checkpoints"][number];
    const goalSession = upsertStagePlayAgentGoalSession({
      schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
      goalId: session.goal_id,
      threadId: session.thread_id,
      roomId: existing?.roomId ?? null,
      objective: session.objective,
      userVisibleSummary: clip(session.objective, 120),
      status,
      sourceRefs,
      loopRefs: unique([
        `thread:${session.thread_id}`,
        `runtime-goal:${session.goal_id}`,
        `runtime-session:${session.runtime_session_id}`,
      ]),
      constructRefs: unique([
        "runtime-goal-stage-play-projection",
        `runtime-provider:${session.runtime_agent_provider}`,
        `runtime-session:${session.runtime_session_id}`,
      ]),
      contextFeeds,
      allowedActuators: readOnlyActuatorsFor(session),
      cadence: { kind: "event_accumulation", minUpdates: 1 },
      stopConditions: unique([
        "Runtime goal completes, stops, or fails",
        session.job_brief.stop_condition,
      ]),
      checkpoints: [...(existing?.checkpoints ?? []), checkpoint].slice(-20),
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
        finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
      },
    });
    const update = recordStagePlayGoalContextUpdate({
      schemaVersion: WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
      updateId: `runtime-goal-context:${hashShort([
        session.goal_id,
        session.updated_at,
        session.status,
        evidenceRefs,
      ], 18)}`,
      createdAtMs: nowMs,
      sourceRefs,
      loopRefs: goalSession.loopRefs,
      producerKind: "runtime_goal",
      updateKind: "runtime_goal_progress",
      contentRef: `${session.goal_id}:progress_summary`,
      preview: checkpointSummary,
      evidenceRefs,
      receiptRefs: session.latest_receipt_refs,
      freshness: {
        observedAtMs: nowMs,
        staleAfterMs: 120_000,
        status: "fresh",
      },
      goalRelevance: {
        goalId: session.goal_id,
        relevance: 1,
        reason: "canonical_runtime_goal_state_projection",
      },
      suggestedDispatch: [],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    return {
      schema: "helix.runtime_goal.stage_play_projection.v1",
      status: "projected",
      goal_id: session.goal_id,
      thread_id: session.thread_id,
      runtime_session_id: session.runtime_session_id,
      stage_play_goal_session_ref: goalSession.goalId,
      context_update_ref: update.updateId,
      projected_evidence_refs: evidenceRefs,
      failure_code: null,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  } catch {
    return failedProjection(session);
  }
};
