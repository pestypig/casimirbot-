import crypto from "node:crypto";
import {
  HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA,
  HELIX_SITUATION_GOAL_SESSION_SCHEMA,
  type HelixSituationGoalSession,
  type HelixSituationGoalSessionReceipt,
  type SituationGoalSession,
  type SituationGoalSessionAppendPolicy,
  type SituationGoalSessionLedger,
  type SituationGoalSessionMode,
  type SituationGoalSessionStatus,
} from "@shared/helix-situation-goal-session";

const sessions = new Map<string, SituationGoalSession>();
const ledgers = new Map<string, SituationGoalSessionLedger>();

const hashShort = (value: unknown, size = 14): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalize = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeMode = (value: unknown): SituationGoalSessionMode => {
  if (value === "observe_only" || value === "off") return "observe_only";
  if (value === "voice_on_confirm") return "voice_on_confirm";
  if (value === "critical_voice") return "critical_voice";
  return "text_callouts";
};

const toLegacyStandbyMode = (
  mode: SituationGoalSessionMode,
): NonNullable<SituationGoalSession["standby_mode"]> =>
  mode === "observe_only" ? "off" : mode === "text_callouts" ? "text_only" : mode;

const normalizeAppendPolicy = (value: unknown): SituationGoalSessionAppendPolicy =>
  value === "callouts_only" || value === "episodes_and_salience" ? value : "salient_only";

const buildSessionId = (input: {
  thread_id: string;
  room_id: string;
  source_ids: string[];
  world_id?: string | null;
}): string =>
  `situation_goal:${hashShort([
    input.thread_id,
    input.room_id,
    input.source_ids,
    normalize(input.world_id) ?? null,
  ], 16)}`;

const buildLedger = (session: SituationGoalSession, now: string): SituationGoalSessionLedger => ({
  objective: session.objective,
  current_goal: session.current_goal ?? null,
  constraints: [
    "compact_context_pack_only",
    "manual_or_session_bound_attachment",
    "minecraft_actions_disabled",
    session.voice_output_enabled ? "voice_output_policy_gated" : "voice_output_disabled",
  ],
  known_risks: [],
  known_unknowns: ["World events are observe-only and salience-gated."],
  recent_progress: ["Situation goal session is active."],
  next_recommended_check: "Watch for salient risk, goal progress, and source-health receipts.",
  evidence_refs: [`situation_goal_session:${session.session_id}`],
  updated_at: now,
});

export function createSituationGoalSession(input: {
  thread_id: string;
  room_id: string;
  source_id?: string | null;
  source_ids?: string[];
  graph_id?: string | null;
  world_id?: string | null;
  objective?: string | null;
  current_goal?: string | null;
  mode?: SituationGoalSessionMode | "off" | "text_only" | "direct_address_only";
  standby_mode?: "off" | "text_only" | "voice_on_confirm" | "critical_voice" | "direct_address_only";
  append_policy?: SituationGoalSessionAppendPolicy;
  voice_output_enabled?: boolean;
  status?: SituationGoalSessionStatus;
  now?: string;
  binding_id?: string | null;
}): HelixSituationGoalSessionReceipt {
  const now = input.now ?? new Date().toISOString();
  const threadId = normalize(input.thread_id);
  const roomId = normalize(input.room_id);
  if (!threadId || !roomId) {
    return {
      schema: HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      ledger: null,
      error: "missing_session_scope",
      message: "Situation Goal Session requires thread_id and room_id.",
    };
  }
  const primarySourceId = normalize(input.source_id) ?? normalize(input.source_ids?.[0]);
  const sourceIds = Array.from(new Set([...(input.source_ids ?? []), primarySourceId].filter(Boolean) as string[])).sort();
  const mode = normalizeMode(input.mode ?? input.standby_mode);
  const sessionId = buildSessionId({
    thread_id: threadId,
    room_id: roomId,
    source_ids: sourceIds,
    world_id: input.world_id ?? null,
  });
  const existing = sessions.get(sessionId);
  const session: SituationGoalSession = {
    schema: HELIX_SITUATION_GOAL_SESSION_SCHEMA,
    session_id: sessionId,
    thread_id: threadId,
    room_id: roomId,
    source_id: primarySourceId,
    source_ids: sourceIds,
    graph_id: normalize(input.graph_id) ?? existing?.graph_id ?? null,
    world_id: normalize(input.world_id) ?? existing?.world_id ?? null,
    objective:
      normalize(input.objective) ??
      existing?.objective ??
      "Watch my Minecraft run and tell me about danger or progress.",
    current_goal: normalize(input.current_goal) ?? existing?.current_goal ?? null,
    status: input.status ?? "active",
    mode,
    voice_output_enabled: input.voice_output_enabled === true,
    context_policy: "compact_context_pack_only",
    attachment_policy: "manual_or_session_bound",
    command_lane_enabled: false,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    standby_mode: toLegacyStandbyMode(mode),
    append_policy: normalizeAppendPolicy(input.append_policy),
  };
  sessions.set(sessionId, session);
  const ledger = buildLedger(session, now);
  ledgers.set(sessionId, ledger);
  return {
    schema: HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    ledger,
    binding_id: input.binding_id ?? null,
    graph_id: session.graph_id ?? null,
    source_id: session.source_id ?? null,
    error: null,
    message: existing ? "Situation Goal Session updated." : "Situation Goal Session started.",
  };
}

export function updateSituationGoalSessionStatus(input: {
  session_id: string;
  status: Extract<SituationGoalSessionStatus, "paused" | "active" | "stopped" | "closed">;
  now?: string;
}): HelixSituationGoalSessionReceipt {
  const session = sessions.get(input.session_id);
  if (!session) {
    return {
      schema: HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      ledger: null,
      error: "session_not_found",
      message: "Situation Goal Session was not found.",
    };
  }
  const now = input.now ?? new Date().toISOString();
  const updated: SituationGoalSession = { ...session, status: input.status, updated_at: now };
  sessions.set(updated.session_id, updated);
  const ledger = { ...(ledgers.get(updated.session_id) ?? buildLedger(updated, now)), updated_at: now };
  ledgers.set(updated.session_id, ledger);
  return {
    schema: HELIX_SITUATION_GOAL_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session: updated,
    ledger,
    binding_id: null,
    graph_id: updated.graph_id ?? null,
    source_id: updated.source_id ?? null,
    error: null,
    message: `Situation Goal Session ${input.status}.`,
  };
}

export function listSituationGoalSessions(filter?: {
  thread_id?: string | null;
  status?: SituationGoalSessionStatus | null;
}): HelixSituationGoalSession[] {
  return Array.from(sessions.values())
    .filter((session: SituationGoalSession) => !filter?.thread_id || session.thread_id === filter.thread_id)
    .filter((session: SituationGoalSession) => !filter?.status || session.status === filter.status)
    .sort(
      (a: SituationGoalSession, b: SituationGoalSession) =>
        b.updated_at.localeCompare(a.updated_at) || a.session_id.localeCompare(b.session_id),
    );
}

export function getActiveSituationGoalSessionForThread(threadId: string): SituationGoalSession | null {
  return listSituationGoalSessions({ thread_id: threadId }).find(
    (session: SituationGoalSession) => session.status === "active",
  ) ?? null;
}

export function getSituationGoalSessionLedger(sessionId: string): SituationGoalSessionLedger | null {
  return ledgers.get(sessionId) ?? null;
}

export function resetSituationGoalSessions(): void {
  sessions.clear();
  ledgers.clear();
}
