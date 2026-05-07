import crypto from "node:crypto";
import type { SituationEpisode } from "@shared/helix-situation-episode";
import {
  HELIX_STANDBY_REASONING_RESULT_SCHEMA,
  type StandbyReasoningResult,
} from "@shared/helix-standby-reasoning";
import { appendHelixThreadEvent } from "../helix-thread/ledger";

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function buildDeterministicStandbyReasoningResult(args: {
  workId: string;
  episode: SituationEpisode;
}): StandbyReasoningResult {
  const isRisk =
    args.episode.episode_type === "combat_risk" || args.episode.episode_type === "death_event";
  return {
    schema: HELIX_STANDBY_REASONING_RESULT_SCHEMA,
    work_id: args.workId,
    episode_id: args.episode.episode_id,
    decision: isRisk ? "text_callout" : "silent_keep_in_context",
    summary: args.episode.summary_seed,
    prediction: isRisk ? "Player may need immediate recovery or retreat." : null,
    rationale: isRisk
      ? "The episode contains combat, damage, death, or threat evidence."
      : "The episode is useful context but does not pass an interjection threshold.",
    evidence_refs: args.episode.evidence_refs,
    confidence: isRisk ? 0.82 : 0.62,
  };
}

export function appendVisibleStandbyReasoningTurn(args: {
  threadId: string;
  sessionId?: string | null;
  traceId?: string | null;
  workId: string;
  episode: SituationEpisode;
  result?: StandbyReasoningResult;
  route?: "/ask" | "/ask/conversation-turn";
  now?: () => Date;
}): { turn_id: string; result: StandbyReasoningResult; item_ids: string[] } {
  const clock = args.now ?? (() => new Date());
  const ts = clock().toISOString();
  const result =
    args.result ?? buildDeterministicStandbyReasoningResult({ workId: args.workId, episode: args.episode });
  const turnId = `standby_reasoning:${hashShort([args.threadId, args.workId, args.episode.episode_id], 16)}`;
  const observationItemId = `standby_reasoning_observation:${hashShort([turnId, "episode"], 12)}`;
  const planItemId = `standby_reasoning_plan:${hashShort([turnId, "plan"], 12)}`;
  const answerItemId = `standby_reasoning_result:${hashShort([turnId, "result"], 12)}`;
  const route = args.route ?? "/ask";

  appendHelixThreadEvent({
    route,
    event_type: "turn_started",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    turn_kind: "auxiliary",
    meta: {
      kind: "standby_reasoning",
      visibility: "standby_trace",
      work_id: args.workId,
      episode_id: args.episode.episode_id,
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_started",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    item_id: observationItemId,
    item_type: "toolObservation",
    item_status: "in_progress",
    item_stream: "observation",
    meta: { kind: "standby_episode_observation" },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_completed",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    item_id: observationItemId,
    item_type: "toolObservation",
    item_status: "completed",
    item_stream: "observation",
    observation_ref: {
      schema: "helix.standby_episode_observation.v1",
      episode: args.episode,
      command_lane_enabled: false,
      context_policy: "explicit_attachment_only",
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_started",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    item_id: planItemId,
    item_type: "plan",
    item_status: "in_progress",
    item_stream: "plan",
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_completed",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    item_id: planItemId,
    item_type: "plan",
    item_status: "completed",
    item_stream: "plan",
    delta_text: "Reviewing episode against current goals and interjection policy.",
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_started",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    item_id: answerItemId,
    item_type: "answer",
    item_status: "in_progress",
    item_stream: "answer",
    meta: { kind: "standby_reasoning_result", primary_user_visible: false },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "item_completed",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    item_id: answerItemId,
    item_type: "answer",
    item_status: "completed",
    item_stream: "answer",
    assistant_text: result.summary,
    observation_ref: result,
    meta: {
      kind: "standby_reasoning_result",
      decision: result.decision,
      primary_user_visible: false,
    },
    ts,
  });
  appendHelixThreadEvent({
    route,
    event_type: "turn_completed",
    thread_id: args.threadId,
    turn_id: turnId,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    turn_kind: "auxiliary",
    meta: {
      kind: "standby_reasoning",
      visibility: "standby_trace",
      decision: result.decision,
    },
    ts,
  });
  return { turn_id: turnId, result, item_ids: [observationItemId, planItemId, answerItemId] };
}
