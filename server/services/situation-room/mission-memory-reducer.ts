import crypto from "node:crypto";
import {
  HELIX_MISSION_MEMORY_SCHEMA,
  HELIX_MISSION_MEMORY_UPDATE_SCHEMA,
  type HelixMissionMemory,
  type HelixMissionMemoryMode,
  type HelixMissionMemoryStatus,
  type HelixMissionMemoryUpdate,
} from "@shared/helix-mission-memory";
import type { HelixStandbyActivityItem } from "@shared/helix-standby-activity";
import { appendHelixThreadEvent } from "../helix-thread/ledger";
import { getStandbyActivityForThread } from "./standby-activity";
import {
  getActiveSituationGoalSessionForThread,
  getSituationGoalSessionLedger,
} from "./situation-goal-session-store";

const memories = new Map<string, HelixMissionMemory>();
const memoryHashes = new Map<string, string>();
const updates = new Map<string, HelixMissionMemoryUpdate>();

const hashValue = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const hashShort = (value: unknown, size = 16): string => hashValue(value).slice(0, size);

const firstSentence = (value: string | null | undefined, fallback: string): string => {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) return fallback;
  const sentence = text.match(/^(.+?[.!?])(?:\s|$)/)?.[1];
  return (sentence ?? text).slice(0, 180);
};

const mapStatus = (status: string | undefined): HelixMissionMemoryStatus => {
  if (status === "active" || status === "paused" || status === "error") return status;
  return status === "starting" ? "active" : "inactive";
};

const mapMode = (mode: string | undefined): HelixMissionMemoryMode => {
  if (mode === "voice_on_confirm" || mode === "critical_voice" || mode === "direct_address_only") return mode;
  return "text_only";
};

const priorityRank = (priority: HelixStandbyActivityItem["priority"]): number =>
  priority === "action" ? 4 : priority === "critical" ? 3 : priority === "warn" ? 2 : 1;

const latest = <T>(entries: T[]): T | null => entries.length > 0 ? entries[entries.length - 1] : null;

function appendMissionMemoryUpdateToThread(update: HelixMissionMemoryUpdate): void {
  const now = update.ts;
  const turnId = `turn:mission-memory:${crypto.randomUUID()}`;
  const itemId = `item:mission-memory:${update.update_id}`;
  const base = {
    route: "/ask" as const,
    thread_id: update.thread_id,
    turn_id: turnId,
    session_id: update.thread_id,
    trace_id: null,
    turn_kind: "auxiliary" as const,
    answer_surface_mode: null,
    ts: now,
  };
  appendHelixThreadEvent({
    ...base,
    event_type: "turn_started",
    meta: { kind: "mission_memory_update", visibility: "standby_trace" },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "item_started",
    item_id: itemId,
    item_type: "validation",
    item_stream: "observation",
    item_status: "in_progress",
    meta: {
      kind: "mission_memory_update",
      source: "deterministic_dictionary",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_only",
    },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "item_completed",
    item_id: itemId,
    item_type: "validation",
    item_stream: "observation",
    item_status: "completed",
    observation_ref: update as unknown as Record<string, unknown>,
    meta: {
      kind: "mission_memory_update",
      source: "deterministic_dictionary",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_only",
    },
  });
  appendHelixThreadEvent({
    ...base,
    event_type: "turn_completed",
    thread_status: "idle",
    meta: { kind: "mission_memory_update", assistant_text: null },
  });
}

export function refreshMissionMemoryForThread(args: {
  threadId: string;
  reason?: HelixMissionMemoryUpdate["reason"];
  now?: string;
  writeThreadUpdate?: boolean;
}): { ok: boolean; memory?: HelixMissionMemory | null; update?: HelixMissionMemoryUpdate | null; error?: string | null } {
  const threadId = args.threadId.trim();
  if (!threadId) return { ok: false, memory: null, update: null, error: "missing_thread_id" };
  const now = args.now ?? new Date().toISOString();
  const session = getActiveSituationGoalSessionForThread(threadId);
  if (!session) {
    const inactive: HelixMissionMemory = {
      schema: HELIX_MISSION_MEMORY_SCHEMA,
      session_id: "inactive",
      thread_id: threadId,
      room_id: "room:minecraft-minehut",
      source_ids: [],
      world_id: null,
      status: "inactive",
      objective: "No active situation.",
      mode: "text_only",
      now_line: "No active Minecraft situation is attached.",
      goal_line: "Goal: inactive.",
      risk_line: "Risk: not monitored.",
      progress_line: "Recent progress: unavailable.",
      unknowns_line: "Open question: start a Situation Goal Session to build live memory.",
      last_decision_line: "Last decision: inactive.",
      active_predictions: [],
      active_risks: [],
      recent_episode_ids: [],
      recent_salience_receipt_ids: [],
      updated_at: now,
    };
    memories.set(threadId, inactive);
    memoryHashes.set(threadId, hashValue(inactive));
    return { ok: true, memory: inactive, update: null, error: null };
  }

  const activity = getStandbyActivityForThread({ threadId, limit: 120 }).activities.filter(
    (item: HelixStandbyActivityItem) => !item.room_id || item.room_id === session.room_id,
  );
  const ledger = getSituationGoalSessionLedger(session.session_id);
  const episodes = activity.filter((item) => item.kind === "episode" || item.kind === "episode_created");
  const predictions = activity.filter((item) => item.kind === "prediction" || item.kind === "prediction_updated");
  const salience = activity.filter((item) => item.kind === "salience" || item.kind === "salience_evaluated");
  const callouts = activity.filter((item) => item.kind === "callout_proposal" || item.kind === "callout_delivery");
  const sourceEvents = activity.filter((item) => item.kind === "source_event" || item.kind === "observed");
  const latestEpisode = latest(episodes);
  const latestSourceEvent = latest(sourceEvents);
  const latestPrediction = latest(predictions);
  const latestCallout = latest(callouts);
  const latestSalience = latest(salience);
  const activeRisks = salience
    .filter((item) => priorityRank(item.priority) >= 2)
    .slice(-5)
    .map((item) => ({
      risk_id: item.activity_id,
      label: firstSentence(item.summary, item.title),
      priority: item.priority,
      evidence_refs: item.evidence_refs,
    }));
  const activePredictions = predictions.slice(-5).map((item) => ({
    prediction_id: item.activity_id,
    label: firstSentence(item.summary, item.title),
    confidence: typeof item.metadata?.confidence === "number" ? item.metadata.confidence : 0.5,
    status: "active" as const,
    evidence_refs: item.evidence_refs,
  }));
  const highRisk = activeRisks.slice().sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)).at(-1);
  const unknowns = [
    session.room_id.includes("minecraft") ||
    session.world_id?.includes("minecraft") ||
    session.source_ids.some((sourceId) => sourceId.includes("minecraft"))
      ? "No hostile precursor sensing yet."
      : null,
    ...(ledger?.known_unknowns ?? []),
  ].filter((entry): entry is string => Boolean(entry));
  const memory: HelixMissionMemory = {
    schema: HELIX_MISSION_MEMORY_SCHEMA,
    session_id: session.session_id,
    thread_id: session.thread_id,
    room_id: session.room_id,
    source_ids: session.source_ids,
    world_id: session.world_id ?? null,
    status: mapStatus(session.status),
    objective: session.objective,
    mode: mapMode(session.mode),
    now_line: latestEpisode
      ? firstSentence(latestEpisode.summary, "Situation episode updated.")
      : latestSourceEvent
        ? firstSentence(latestSourceEvent.summary, "Minecraft source is active.")
        : "Minecraft situation is active and waiting for salient events.",
    goal_line: session.current_goal
      ? `Goal: ${session.current_goal}.`
      : latestPrediction
        ? `Likely goal: ${firstSentence(latestPrediction.summary, "current objective")}`
        : "Likely goal: survival / resource gathering.",
    risk_line: highRisk
      ? `Risk: ${highRisk.label}`
      : "Risk: quiet unless health or hostile cues change.",
    progress_line: latestEpisode
      ? `Recent progress: ${firstSentence(latestEpisode.summary, "episode updated")}`
      : ledger?.recent_progress?.[0] ?? "Recent progress: no major progress signal.",
    unknowns_line: `Open question: ${unknowns[0] ?? "none recorded."}`,
    last_decision_line: latestCallout
      ? `Last decision: ${latestCallout.title.toLowerCase()} - ${firstSentence(latestCallout.summary, "callout updated")}`
      : latestSalience
        ? "Last decision: evaluated salience and kept receipt in context."
        : "Last decision: stayed silent.",
    active_predictions: activePredictions,
    active_risks: activeRisks,
    recent_episode_ids: episodes.slice(-5).map((item) => item.activity_id),
    recent_salience_receipt_ids: salience.slice(-5).map((item) => item.activity_id),
    updated_at: now,
  };
  const previousHash = memoryHashes.get(threadId) ?? null;
  const nextHash = hashValue(memory);
  memories.set(threadId, memory);
  memoryHashes.set(threadId, nextHash);
  const evidenceRefs = Array.from(
    new Set([
      `situation_goal_session:${session.session_id}`,
      ...(ledger?.evidence_refs ?? []),
      ...activity.flatMap((item) => item.evidence_refs),
    ]),
  ).slice(-40);
  const update: HelixMissionMemoryUpdate = {
    schema: HELIX_MISSION_MEMORY_UPDATE_SCHEMA,
    update_id: `mission_memory_update:${hashShort([threadId, nextHash, now], 18)}`,
    session_id: session.session_id,
    thread_id: threadId,
    room_id: session.room_id,
    reason: args.reason ?? (highRisk ? "risk_update" : latestEpisode ? "episode_update" : "manual_refresh"),
    previous_hash: previousHash,
    next_hash: nextHash,
    memory,
    evidence_refs: evidenceRefs,
    deterministic: true,
    model_invoked: false,
    context_policy: "compact_context_only",
    ts: now,
  };
  updates.set(threadId, update);
  if (args.writeThreadUpdate && previousHash !== nextHash) appendMissionMemoryUpdateToThread(update);
  return { ok: true, memory, update, error: null };
}

export function getMissionMemoryForThread(args: {
  threadId: string;
  refresh?: boolean;
}): { ok: boolean; memory?: HelixMissionMemory | null; update?: HelixMissionMemoryUpdate | null; error?: string | null } {
  if (args.refresh !== false || !memories.has(args.threadId)) {
    return refreshMissionMemoryForThread({ threadId: args.threadId });
  }
  return {
    ok: true,
    memory: memories.get(args.threadId) ?? null,
    update: updates.get(args.threadId) ?? null,
    error: null,
  };
}

export function resetMissionMemoryReducerState(): void {
  memories.clear();
  memoryHashes.clear();
  updates.clear();
}
