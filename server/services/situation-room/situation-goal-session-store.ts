import crypto from "node:crypto";
import {
  HELIX_SITUATION_GOAL_SESSION_SCHEMA,
  type HelixSituationGoalSession,
  type HelixSituationGoalSessionReceipt,
} from "@shared/helix-situation-goal-session";

const sessions = new Map<string, HelixSituationGoalSession>();

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function createSituationGoalSession(input: {
  thread_id: string;
  room_id: string;
  source_ids: string[];
  graph_id?: string | null;
  world_id?: string | null;
  objective?: string | null;
  standby_mode?: HelixSituationGoalSession["standby_mode"];
  append_policy?: HelixSituationGoalSession["append_policy"];
  now?: string;
}): HelixSituationGoalSessionReceipt {
  const now = input.now ?? new Date().toISOString();
  const sourceIds = Array.from(new Set(input.source_ids.filter(Boolean))).sort();
  const sessionId = `situation_goal:${hashShort([
    input.thread_id,
    input.room_id,
    sourceIds,
    input.world_id ?? null,
  ], 16)}`;
  const existing = sessions.get(sessionId);
  const session: HelixSituationGoalSession = {
    schema: HELIX_SITUATION_GOAL_SESSION_SCHEMA,
    session_id: sessionId,
    thread_id: input.thread_id,
    room_id: input.room_id,
    source_ids: sourceIds,
    graph_id: input.graph_id ?? existing?.graph_id ?? null,
    world_id: input.world_id ?? existing?.world_id ?? null,
    objective: input.objective?.trim() || existing?.objective || "Monitor the current situation and surface danger or progress.",
    standby_mode: input.standby_mode ?? existing?.standby_mode ?? "text_only",
    append_policy: input.append_policy ?? existing?.append_policy ?? "salient_only",
    context_policy: "explicit_attachment_only",
    command_lane_enabled: false,
    status: "active",
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  sessions.set(sessionId, session);
  return {
    schema: "helix.situation_goal_session_receipt.v1",
    ok: true,
    session,
    error: null,
    message: existing ? "Situation goal session updated." : "Situation goal session created.",
  };
}

export function listSituationGoalSessions(filter?: {
  thread_id?: string | null;
}): HelixSituationGoalSession[] {
  return Array.from(sessions.values())
    .filter((session: HelixSituationGoalSession) => !filter?.thread_id || session.thread_id === filter.thread_id)
    .sort(
      (a: HelixSituationGoalSession, b: HelixSituationGoalSession) =>
        b.updated_at.localeCompare(a.updated_at) || a.session_id.localeCompare(b.session_id),
    );
}

export function resetSituationGoalSessions(): void {
  sessions.clear();
}
