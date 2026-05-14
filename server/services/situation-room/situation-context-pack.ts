import crypto from "node:crypto";
import {
  HELIX_SITUATION_CONTEXT_PACK_SCHEMA,
  type SituationContextPack,
} from "@shared/helix-situation-context-pack";
import type { HelixStandbyActivityItem } from "@shared/helix-standby-activity";
import { getStandbyActivityForThread } from "./standby-activity";
import {
  getActiveSituationGoalSessionForThread,
  getSituationGoalSessionLedger,
} from "./situation-goal-session-store";
import { getMissionMemoryForThread } from "./mission-memory-reducer";
import { getActiveLiveSituationArtifactForThread } from "./live-situation-artifact-store";
import { getActiveLiveAnswerEnvironmentForThread, getLiveAnswerEnvironment } from "./live-answer-environment-store";
import {
  listWorkstationLiveSourceWindows,
  listWorkstationLiveSources,
} from "./workstation-live-source-ingest";
import { listWorldSourcesSeen, type WorldSourceSeen } from "./world-source-registry";
import { getLatestMinecraftSpatialEpisodeForRoom } from "./minecraft-spatial-window";
import { getLatestMinecraftWorldSenseContextForRoom } from "./minecraft-world-sense-window";
import type {
  LiveSourceWindowSummary,
  WorkstationLiveSource,
} from "@shared/helix-workstation-live-source";

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export type HelixSituationContextPack = SituationContextPack;

export function buildSituationContextPack(args: {
  threadId: string;
  roomId?: string | null;
  sessionId?: string | null;
  liveAnswerEnvironmentId?: string | null;
  limit?: number;
}): SituationContextPack {
  const activeSession = getActiveSituationGoalSessionForThread(args.threadId);
  const roomId = args.roomId ?? activeSession?.room_id ?? "room:minecraft-minehut";
  const activities = getStandbyActivityForThread({
    threadId: args.threadId,
    limit: args.limit ?? 80,
  }).activities.filter((activity: HelixStandbyActivityItem) => activity.room_id === roomId);
  const suppressionSummary: Record<string, number> = {};
  for (const activity of activities) {
    if (activity.kind !== "suppression") continue;
    const key = activity.summary || "suppressed";
    suppressionSummary[key] = (suppressionSummary[key] ?? 0) + 1;
  }
  const sessionId = args.sessionId ?? activeSession?.session_id ?? null;
  const ledger = sessionId ? getSituationGoalSessionLedger(sessionId) : null;
  const missionMemory = getMissionMemoryForThread({ threadId: args.threadId }).memory ?? null;
  const liveArtifact = getActiveLiveSituationArtifactForThread(args.threadId);
  const liveAnswerEnvironment =
    (args.liveAnswerEnvironmentId ? getLiveAnswerEnvironment(args.liveAnswerEnvironmentId) : null) ??
    getActiveLiveAnswerEnvironmentForThread(args.threadId);
  const liveSourceIds = new Set(liveAnswerEnvironment?.source_ids ?? []);
  const liveSourceStatus = listWorkstationLiveSources()
    .filter((source: WorkstationLiveSource) => liveSourceIds.has(source.source_id) || source.environment_id === liveAnswerEnvironment?.environment_id)
    .map((source: WorkstationLiveSource) => ({
      source_id: source.source_id,
      status: source.status,
      kind: source.kind,
      last_tick_index: source.last_tick_index ?? null,
      event_count: source.event_count ?? 0,
      last_event_ts: source.last_event_ts ?? null,
    }));
  const liveWindowSummary = listWorkstationLiveSourceWindows()
    .filter((window: LiveSourceWindowSummary) => liveSourceIds.has(window.source_id) || window.environment_id === liveAnswerEnvironment?.environment_id)
    .slice(-3)
    .map((window: LiveSourceWindowSummary) => ({
      window_id: window.window_id,
      source_id: window.source_id,
      event_count: window.event_count,
      policy: window.policy.emit_line_delta_on,
      from_ts: window.from_ts,
      to_ts: window.to_ts,
    }));
  const worldSources = listWorldSourcesSeen()
    .filter((source: WorldSourceSeen) => source.room_id === roomId)
    .slice(0, 8)
    .map((source: WorldSourceSeen) => ({
      room_id: source.room_id,
      source_id: source.source_id,
      world_id: source.world_id,
      latest_actor_id: source.latest_actor_id ?? null,
      latest_actor_label: source.latest_actor_label ?? null,
      latest_event_type: source.latest_event_type,
      latest_ts: source.latest_ts,
      event_count: source.event_count,
      append_decision: source.latest_debug?.append_decision ?? null,
      append_reason: source.latest_debug?.append_reason ?? null,
      salience_class: source.latest_debug?.salience_class ?? null,
    }));
  const minecraftSpatialEpisode = getLatestMinecraftSpatialEpisodeForRoom(roomId);
  const minecraftWorldSenseContext = getLatestMinecraftWorldSenseContextForRoom(roomId);
  const episodeActivities = activities
    .filter((activity: HelixStandbyActivityItem) => activity.kind === "episode" || activity.kind === "episode_created")
    .slice(-3);
  const predictionActivities = activities
    .filter((activity: HelixStandbyActivityItem) => activity.kind === "prediction" || activity.kind === "prediction_updated")
    .slice(-5);
  const salienceActivities = activities
    .filter((activity: HelixStandbyActivityItem) => activity.kind === "salience" || activity.kind === "salience_evaluated")
    .slice(-5);
  return {
    schema: HELIX_SITUATION_CONTEXT_PACK_SCHEMA,
    context_pack_id: `situation_context:${hashShort([
      args.threadId,
      roomId,
      sessionId,
      missionMemory?.updated_at ?? null,
      minecraftSpatialEpisode?.episode_id ?? null,
      minecraftWorldSenseContext?.context_id ?? null,
      activities.map((activity: HelixStandbyActivityItem) => activity.activity_id).slice(-12),
    ], 18)}`,
    session_id: sessionId,
    room_id: roomId,
    thread_id: args.threadId,
    mission_memory: missionMemory,
    live_situation_artifact: liveArtifact
      ? {
          artifact_id: liveArtifact.artifact_id,
          objective: liveArtifact.objective,
          current_state_lines: liveArtifact.current_state_lines,
          subgoals: liveArtifact.subgoals,
          latest_evaluation: liveArtifact.latest_evaluation ?? null,
        }
      : null,
    live_answer_environment: liveAnswerEnvironment
      ? {
          environment_id: liveAnswerEnvironment.environment_id,
          objective: liveAnswerEnvironment.objective,
          lines: liveAnswerEnvironment.lines,
          subgoals: liveAnswerEnvironment.subgoals,
          latest_evaluation: liveAnswerEnvironment.latest_evaluation ?? null,
          source_status: liveSourceStatus,
          window_summary: liveWindowSummary,
          latest_summary: liveAnswerEnvironment.latest_summary,
          evidence_refs: liveAnswerEnvironment.evidence_refs,
          updated_at: liveAnswerEnvironment.updated_at,
        }
      : null,
    world_sources: worldSources,
    minecraft_spatial_episode: minecraftSpatialEpisode,
    minecraft_world_sense_context: minecraftWorldSenseContext,
    objective: activeSession?.objective ?? ledger?.objective ?? null,
    current_goal: activeSession?.current_goal ?? ledger?.current_goal ?? null,
    latest_projection: null,
    recent_episodes: episodeActivities.map((activity: HelixStandbyActivityItem) => ({
      episode_id: activity.activity_id,
      summary: activity.summary,
      narration: activity.kind === "episode" || activity.kind === "episode_created" ? activity.summary : null,
      prediction: null,
      evidence_refs: activity.evidence_refs,
    })),
    active_predictions: predictionActivities.map((activity: HelixStandbyActivityItem) => ({
      predicted_goal: activity.summary,
      confidence: asNumber((activity.metadata as Record<string, unknown> | undefined)?.confidence, 0.5),
      status: "active",
      evidence_refs: activity.evidence_refs,
    })),
    recent_salience: salienceActivities.map((activity: HelixStandbyActivityItem) => ({
      reason: activity.title,
      priority: activity.priority,
      summary: activity.summary,
      should_notify_helix: activity.decision === "show_text" || activity.decision === "voice_on_confirm",
      evidence_refs: activity.evidence_refs,
    })),
    callouts: activities
      .filter((activity: HelixStandbyActivityItem) => activity.kind === "callout_proposal" || activity.kind === "callout_delivery")
      .slice(-5),
    suppression_summary: suppressionSummary,
    known_risks: ledger?.known_risks ?? [],
    known_unknowns: ledger?.known_unknowns ?? ["No active situation ledger has been populated yet."],
    evidence_refs: Array.from(
      new Set([
        ...(ledger?.evidence_refs ?? []),
        ...activities.flatMap((activity: HelixStandbyActivityItem) => activity.evidence_refs),
      ]),
    ).slice(-24),
    created_at: new Date().toISOString(),
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
    raw_transcript_included: false,
    raw_audio_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
  };
}
