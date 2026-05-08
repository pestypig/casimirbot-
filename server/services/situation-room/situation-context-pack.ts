import type { HelixStandbyActivityItem } from "@shared/helix-standby-activity";
import { getStandbyActivityForThread } from "./standby-activity";

export type HelixSituationContextPack = {
  schema: "helix.situation_context_pack.v1";
  session_id?: string | null;
  room_id: string;
  thread_id: string;
  projection?: unknown;
  episodes: unknown[];
  predictions: unknown[];
  salience_receipts: unknown[];
  callouts: unknown[];
  suppression_summary: Record<string, number>;
  evidence_refs: string[];
  context_policy: "explicit_attachment_only";
};

export function buildSituationContextPack(args: {
  threadId: string;
  roomId: string;
  sessionId?: string | null;
  limit?: number;
}): HelixSituationContextPack {
  const activities = getStandbyActivityForThread({
    threadId: args.threadId,
    limit: args.limit ?? 80,
  }).activities.filter((activity: HelixStandbyActivityItem) => activity.room_id === args.roomId);
  const suppressionSummary: Record<string, number> = {};
  for (const activity of activities) {
    if (activity.kind !== "suppression") continue;
    const key = activity.title || "suppressed";
    suppressionSummary[key] = (suppressionSummary[key] ?? 0) + 1;
  }
  return {
    schema: "helix.situation_context_pack.v1",
    session_id: args.sessionId ?? null,
    room_id: args.roomId,
    thread_id: args.threadId,
    projection: null,
    episodes: activities.filter((activity) => activity.kind === "episode").slice(-3),
    predictions: activities.filter((activity) => activity.kind === "prediction").slice(-5),
    salience_receipts: activities.filter((activity) => activity.kind === "salience").slice(-5),
    callouts: activities
      .filter((activity) => activity.kind === "callout_proposal" || activity.kind === "callout_delivery")
      .slice(-5),
    suppression_summary: suppressionSummary,
    evidence_refs: Array.from(new Set(activities.flatMap((activity) => activity.evidence_refs))).slice(-24),
    context_policy: "explicit_attachment_only",
  };
}
