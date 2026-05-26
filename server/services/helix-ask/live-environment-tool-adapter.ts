import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  type HelixLiveEnvironmentToolName,
  type HelixLiveEnvironmentToolObservation,
} from "@shared/helix-live-agent-step";
import type { HelixInterpretedEventKind } from "@shared/helix-interpreted-event-log";
import { getActiveLiveAnswerEnvironmentForThread, getLiveAnswerEnvironment } from "../situation-room/live-answer-environment-store";
import { queryEventWindow } from "../situation-room/event-window-query";
import { appendInterpretedEvent, listInterpretedEvents } from "../situation-room/interpreted-event-log-store";
import { queryMinecraftNavigationState } from "../situation-room/minecraft-navigation-state-store";
import { readSituationSourceCapabilities } from "../situation-room/situation-source-capability-store";
import {
  ensureLiveSituationRunForEnvironment,
} from "../situation-room/live-situation-run-store";
import { registerFieldWorkersForSituationRun } from "../situation-room/live-field-worker-registry";

type ExecuteLiveEnvironmentToolInput = {
  tool_name: HelixLiveEnvironmentToolName;
  args?: Record<string, unknown> | null;
  thread_id: string;
  environment_id?: string | null;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map(readString).filter((entry): entry is string => Boolean(entry))))
    : [];

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const evidenceRefsFrom = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return readStringArray(record.evidence_refs);
};

const makeObservation = (input: {
  threadId: string;
  environmentId?: string | null;
  toolName: HelixLiveEnvironmentToolName;
  ok: boolean;
  summary: string;
  observation: unknown;
  evidenceRefs?: string[];
}): HelixLiveEnvironmentToolObservation => ({
  schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  observation_id: `live_env_tool_observation:${hashShort([
    input.threadId,
    input.environmentId ?? null,
    input.toolName,
    input.summary,
    input.evidenceRefs ?? [],
  ])}`,
  thread_id: input.threadId,
  environment_id: input.environmentId ?? null,
  tool_name: input.toolName,
  ok: input.ok,
  summary: input.summary,
  observation: input.observation,
  evidence_refs: Array.from(new Set(input.evidenceRefs ?? [])),
  instruction_authority: "none",
  ask_instruction_authority: "none",
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  assistant_answer: false,
  raw_content_included: false,
  created_at: new Date().toISOString(),
});

const eventKind = (value: unknown): HelixInterpretedEventKind => {
  const raw = readString(value);
  if (
    raw === "source_observation" ||
    raw === "visual_observation" ||
    raw === "visual_event_alignment" ||
    raw === "categorization" ||
    raw === "present_state_synthesis" ||
    raw === "line_tool_evaluation" ||
    raw === "synthetic_evidence" ||
    raw === "subgoal_update" ||
    raw === "mission_memory_update" ||
    raw === "live_environment_delta" ||
    raw === "user_steering" ||
    raw === "steering_applied" ||
    raw === "hypothesis_confidence_changed" ||
    raw === "clarification_need" ||
    raw === "clarification_question" ||
    raw === "utility_hypothesis" ||
    raw === "pattern_candidate" ||
    raw === "archive_summary" ||
    raw === "agentic_review" ||
    raw === "tool_trace" ||
    raw === "proof_recall" ||
    raw === "callout_proposal" ||
    raw === "callout_delivery" ||
    raw === "final_answer_snapshot"
  ) {
    return raw;
  }
  return "tool_trace";
};

export function executeLiveEnvironmentTool(
  input: ExecuteLiveEnvironmentToolInput,
): HelixLiveEnvironmentToolObservation {
  const args = input.args ?? {};
  const environment =
    (input.environment_id ? getLiveAnswerEnvironment(input.environment_id) : null) ??
    getActiveLiveAnswerEnvironmentForThread(input.thread_id);
  const roomId = readString(args.room_id) ?? environment?.room_id ?? null;

  if (input.tool_name === "live_env.read_card") {
    const lineKeys = readStringArray(args.line_keys);
    const selectedLines = environment?.lines.filter((line) =>
      lineKeys.length === 0 || lineKeys.includes(line.key)
    ) ?? [];
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: Boolean(environment),
      summary: environment
        ? `Read ${selectedLines.length} live card line(s); line text is UI projection only.`
        : "No live answer environment was found for the requested card.",
      observation: environment
        ? {
            schema: "helix.live_environment_card_read.v1",
            environment_id: environment.environment_id,
            thread_id: environment.thread_id,
            room_id: environment.room_id ?? null,
            lines: selectedLines.map((line) => ({
              key: line.key,
              label: line.label,
              value: line.value,
              confidence: line.confidence ?? null,
              evidence_refs: line.evidence_refs,
              ui_summary_only: true,
              assistant_answer: false,
            })),
            assistant_answer: false,
            raw_content_included: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
          }
        : null,
      evidenceRefs: selectedLines.flatMap((line) => line.evidence_refs),
    });
  }

  if (input.tool_name === "live_env.query_event_log") {
    const events = listInterpretedEvents({
      threadId: input.thread_id,
      roomId,
      limit: readNumber(args.limit, 50),
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Retrieved ${events.length} compact interpreted event(s).`,
      observation: {
        schema: "helix.interpreted_log_read.v1",
        thread_id: input.thread_id,
        room_id: roomId,
        events,
        raw_logs_included: false,
        deterministic_content_role: "evidence_not_assistant_answer",
        assistant_answer: false,
      },
      evidenceRefs: events.flatMap((event) => [event.event_id, ...event.evidence_refs]),
    });
  }

  if (input.tool_name === "live_env.query_world_events") {
    const result = queryEventWindow({
      thread_id: input.thread_id,
      room_id: roomId,
      source_id: readString(args.source_id),
      world_id: readString(args.world_id),
      actor_id: readString(args.actor_id),
      event_types: readStringArray(args.event_types),
      from_ts: readString(args.from_ts),
      to_ts: readString(args.to_ts),
      limit: readNumber(args.limit, 50),
      include_raw_events: false,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Retrieved ${result.returned_count} compact world event(s).`,
      observation: result,
      evidenceRefs: result.events.flatMap((event) => [event.journal_event_id, ...event.evidence_refs]),
    });
  }

  if (input.tool_name === "live_env.query_navigation_state") {
    const result = queryMinecraftNavigationState({
      roomId,
      worldId: readString(args.world_id),
      actorLabel: readString(args.actor_label),
      limit: readNumber(args.limit, 6),
    });
    const state = result.navigation_state ?? null;
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: state
        ? `Navigation state route_status=${state.route_status}; policy_surface_status=${state.policy_surface_status}.`
        : "No compact Minecraft navigation state is available.",
      observation: result,
      evidenceRefs: state?.evidence_refs ?? result.latest_solver_observations.flatMap(evidenceRefsFrom),
    });
  }

  if (input.tool_name === "live_env.query_source_health") {
    const result = readSituationSourceCapabilities({
      threadId: input.thread_id,
      roomId,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Read ${result.capabilities.length} source capability state(s).`,
      observation: result,
      evidenceRefs: result.capabilities.map((capability) => capability.source_id),
    });
  }

  if (input.tool_name === "live_env.record_commentary" || input.tool_name === "live_env.request_probe") {
    const event = appendInterpretedEvent({
      thread_id: input.thread_id,
      room_id: roomId,
      source_family: "live_environment",
      kind: input.tool_name === "live_env.record_commentary" ? eventKind(args.kind) : "tool_trace",
      title: readString(args.title) ?? (input.tool_name === "live_env.request_probe" ? "Live probe requested" : "Live commentary"),
      summary: readString(args.summary) ?? readString(args.reason) ?? "Live environment evidence item recorded.",
      confidence: typeof args.confidence === "number" ? args.confidence : null,
      evidence_refs: readStringArray(args.evidence_refs),
      related_artifact_ids: readStringArray(args.related_artifact_ids),
      model_invoked: args.model_invoked === true,
      deterministic: args.model_invoked !== true,
    });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `${input.tool_name} recorded ${event.event_id}.`,
      observation: event,
      evidenceRefs: [event.event_id, ...event.evidence_refs],
    });
  }

  if (input.tool_name === "live_env.spawn_field_worker") {
    if (!environment) {
      return makeObservation({
        threadId: input.thread_id,
        environmentId: input.environment_id,
        toolName: input.tool_name,
        ok: false,
        summary: "No live answer environment was found; field worker spawn was not attempted.",
        observation: null,
        evidenceRefs: [],
      });
    }
    const run = ensureLiveSituationRunForEnvironment({
      environment,
      pipelineId: readString(args.pipeline_id),
    });
    const workers = registerFieldWorkersForSituationRun({ run, environment });
    return makeObservation({
      threadId: input.thread_id,
      environmentId: input.environment_id,
      toolName: input.tool_name,
      ok: true,
      summary: `Registered ${workers.length} bounded field worker(s) for live environment.`,
      observation: {
        schema: "helix.live_field_worker_spawn_receipt.v1",
        situation_run_id: run.situation_run_id,
        worker_ids: workers.map((worker) => worker.worker_id),
        assistant_answer: false,
        raw_content_included: false,
      },
      evidenceRefs: [run.situation_run_id, ...workers.map((worker) => worker.worker_id)],
    });
  }

  const evidenceRefs = readStringArray(args.evidence_refs);
  const missingEvidence = readStringArray(args.missing_evidence);
  const satisfied = evidenceRefs.length > 0 && missingEvidence.length === 0;
  return makeObservation({
    threadId: input.thread_id,
    environmentId: input.environment_id,
    toolName: input.tool_name,
    ok: true,
    summary: satisfied
      ? "Live environment goal satisfaction has enough compact evidence."
      : "Live environment goal satisfaction needs more evidence.",
    observation: {
      schema: "helix.live_environment_goal_satisfaction.v1",
      status: satisfied ? "satisfied" : "needs_more_evidence",
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence.length > 0 ? missingEvidence : ["No evidence refs were supplied to the live goal check."],
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    },
    evidenceRefs,
  });
}
