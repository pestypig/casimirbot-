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

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export type HelixSituationContextPack = SituationContextPack;

export function buildSituationContextPack(args: {
  threadId: string;
  roomId?: string | null;
  sessionId?: string | null;
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
      activities.map((activity: HelixStandbyActivityItem) => activity.activity_id).slice(-12),
    ], 18)}`,
    session_id: sessionId,
    room_id: roomId,
    thread_id: args.threadId,
    mission_memory: missionMemory,
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
    raw_transcript_included: false,
    raw_audio_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
  };
}
