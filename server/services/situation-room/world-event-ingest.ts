import crypto from "node:crypto";
import { z } from "zod";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_SITUATION_GOAL_HYPOTHESIS_SCHEMA,
  HELIX_SITUATION_INTERJECTION_PROPOSAL_SCHEMA,
  HELIX_SITUATION_SALIENCE_RECEIPT_SCHEMA,
  HELIX_SITUATION_STATE_PROJECTION_SCHEMA,
  type SituationEventSignal,
  type SituationGoalHypothesis,
  type SituationInterjectionProposal,
  type SituationSalienceReceipt,
  type SituationStateProjection,
} from "@shared/helix-situation-standby";
import {
  getMinecraftEventHints,
  normalizeMinecraftWorldEventToSignal,
} from "./minecraft-event-normalizer";
import { appendStandbyObservationToThread } from "./standby-thread-observation";
import {
  createSituationThreadBinding,
  resolveSituationThreadBinding,
} from "./thread-binding-store";

const recordSchema = z.record(z.string(), z.unknown());

export const helixWorldEventSchema = z.object({
  schema: z.literal("helix.world_event.v1"),
  world_id: z.string().trim().min(1),
  room_id: z.string().trim().min(1),
  source_id: z.string().trim().min(1).optional(),
  ts: z.string().trim().min(1),
  actor_id: z.string().trim().min(1).optional(),
  actor_label: z.string().trim().min(1).optional(),
  event_type: z.string().trim().min(1),
  location: recordSchema.optional(),
  inventory_delta: recordSchema.optional(),
  health_delta: recordSchema.optional(),
  objective_delta: recordSchema.optional(),
  entities: z.array(recordSchema).optional(),
  text: z.string().optional(),
  evidence_refs: z.array(z.string()).default([]),
  meta: recordSchema.optional(),
});

export const worldEventBatchRequestSchema = z.object({
  events: z.array(helixWorldEventSchema),
  thread_id: z.string().trim().min(1).nullable().optional(),
  turn_id: z.string().trim().min(1).nullable().optional(),
  session_id: z.string().trim().min(1).nullable().optional(),
  trace_id: z.string().trim().min(1).nullable().optional(),
});

export const worldEventReplayRequestSchema = z.object({
  room_id: z.string().trim().min(1).nullable().optional(),
  reset: z.boolean().optional(),
  events: z.array(helixWorldEventSchema),
});

export type WorldEventIngestOptions = {
  appendToThread?: boolean;
  threadId?: string | null;
  turnId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  graphId?: string | null;
};

export type WorldEventIngestResult = {
  ok: boolean;
  schema: "helix.world_event_ingest_response.v1";
  appended: boolean;
  signal_id?: string;
  salience_receipt_id?: string | null;
  projection_id?: string | null;
  goal_hypothesis_ids?: string[];
  thread_id?: string | null;
  turn_id?: string | null;
  item_id?: string | null;
  reason?: string | null;
  message: string;
  event_type?: string;
  signal?: SituationEventSignal;
  projection?: SituationStateProjection;
  goal_hypotheses?: SituationGoalHypothesis[];
  salience_receipt?: SituationSalienceReceipt | null;
  interjection_proposal?: SituationInterjectionProposal | null;
};

export type WorldEventIngestBatchResult = {
  ok: boolean;
  schema: "helix.world_event_batch_ingest_response.v1";
  results: WorldEventIngestResult[];
};

type RoomRuntimeState = {
  roomId: string;
  graphId: string | null;
  worldId: string;
  signals: SituationEventSignal[];
  goals: Map<string, SituationGoalHypothesis>;
  locationCounts: Map<string, number>;
};

const runtimeStateByKey = new Map<string, RoomRuntimeState>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key: string) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const getStateKey = (roomId: string, graphId: string | null, worldId: string): string =>
  `${roomId}:${graphId ?? "world"}:${worldId}`;

const locationBucket = (location: Record<string, unknown> | null | undefined): string | null => {
  if (!location) return null;
  const x = typeof location.x === "number" ? Math.round(location.x / 8) * 8 : null;
  const y = typeof location.y === "number" ? Math.round(location.y / 8) * 8 : null;
  const z = typeof location.z === "number" ? Math.round(location.z / 8) * 8 : null;
  const dimension = typeof location.dimension === "string" ? location.dimension : "world";
  if (x === null && y === null && z === null) return null;
  return `${dimension}:${x ?? "?"}:${y ?? "?"}:${z ?? "?"}`;
};

const readNumber = (value: unknown, keys: string[]): number | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const next = record[key];
    if (typeof next === "number" && Number.isFinite(next)) return next;
  }
  return null;
};

const readString = (value: unknown, key: string): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const next = (value as Record<string, unknown>)[key];
  return typeof next === "string" && next.trim() ? next.trim() : null;
};

const readBooleanMeta = (event: HelixWorldEvent, key: string): boolean =>
  Boolean(event.meta && typeof event.meta === "object" && event.meta[key] === true);

export const resetWorldEventIngestState = (): void => {
  runtimeStateByKey.clear();
};

const getOrCreateState = (
  event: HelixWorldEvent,
  graphId: string | null,
): RoomRuntimeState => {
  const key = getStateKey(event.room_id, graphId, event.world_id);
  const existing = runtimeStateByKey.get(key);
  if (existing) return existing;
  const next: RoomRuntimeState = {
    roomId: event.room_id,
    graphId,
    worldId: event.world_id,
    signals: [],
    goals: new Map(),
    locationCounts: new Map(),
  };
  runtimeStateByKey.set(key, next);
  return next;
};

const buildSignalId = (event: HelixWorldEvent): string =>
  `world-event:${event.world_id}:${event.event_type}:${hashShort(event.ts, 8)}:${hashShort(
    event.actor_id ?? event.actor_label ?? "world",
    8,
  )}`;

const buildProjection = (
  state: RoomRuntimeState,
  event: HelixWorldEvent,
  signal: SituationEventSignal,
): SituationStateProjection => {
  const signals = state.signals;
  const fromTs = signals[0]?.ts ?? signal.ts;
  const toTs = signals.at(-1)?.ts ?? signal.ts;
  const latestFacts = signals
    .slice(-8)
    .map((entry: SituationEventSignal) => ({
      fact_id: `fact:${hashShort([entry.signal_id, entry.event_type], 10)}`,
      text: entry.text?.trim()
        ? entry.text.trim()
        : `${entry.actor ?? "Minecraft"} emitted ${entry.event_type}`,
      evidence_refs: entry.evidence_refs,
    }));

  return {
    schema: HELIX_SITUATION_STATE_PROJECTION_SCHEMA,
    projection_id: `projection:${state.roomId}:${hashShort(
      signals.map((entry: SituationEventSignal) => entry.signal_id),
      12,
    )}`,
    room_id: state.roomId,
    graph_id: state.graphId,
    updated_at: signal.ts,
    window: {
      from_ts: fromTs,
      to_ts: toTs,
      event_count: signals.length,
    },
    speakers: [],
    active_sources: [
      {
        source_id: event.source_id ?? `minecraft:${event.world_id}`,
        status: event.event_type === "source_disconnected" ? "error" : "active",
        source_kind: "minecraft_event",
      },
    ],
    world_state: {
      world_id: event.world_id,
      actor_id: event.actor_id ?? null,
      actor_label: event.actor_label ?? null,
      event_type: event.event_type,
      location: event.location ?? null,
      health_delta: event.health_delta ?? null,
      inventory_delta: event.inventory_delta ?? null,
      objective_delta: event.objective_delta ?? null,
      hints: getMinecraftEventHints(event),
    },
    recent_facts: latestFacts,
  };
};

const deriveGoalLabel = (event: HelixWorldEvent): string | null => {
  const explicit = readString(event.objective_delta, "goal_label");
  if (explicit) return explicit;
  const text = `${event.text ?? ""} ${stableJson(event.objective_delta ?? {})}`.toLowerCase();
  if (text.includes("blaze rod") || text.includes("blaze rods")) return "collect blaze rods";
  if (text.includes("nether fortress")) return "reach nether fortress";
  if (event.event_type === "source_disconnected") return null;
  if (event.event_type === "item_acquired") {
    const item =
      readString(event.inventory_delta, "item") ??
      readString(event.inventory_delta, "item_id") ??
      readString(event.inventory_delta, "name");
    return item ? `collect ${item.replace(/^minecraft:/, "").replace(/_/g, " ")}` : "collect item";
  }
  return null;
};

const deriveGoalStatus = (
  event: HelixWorldEvent,
): SituationGoalHypothesis["status"] => {
  const rawStatus = readString(event.objective_delta, "status");
  if (rawStatus === "completed" || rawStatus === "blocked" || rawStatus === "active") {
    return rawStatus;
  }
  if (event.event_type === "item_acquired" || event.event_type === "advancement_unlocked") {
    return "completed";
  }
  return "active";
};

const updateGoalHypotheses = (
  state: RoomRuntimeState,
  event: HelixWorldEvent,
  signal: SituationEventSignal,
): SituationGoalHypothesis[] => {
  const goalLabel = deriveGoalLabel(event);
  if (!goalLabel) return Array.from(state.goals.values());
  const goalKey = goalLabel.toLowerCase();
  const existing = state.goals.get(goalKey);
  const nextSignals = Array.from(
    new Set([...(existing?.derived_from_signal_ids ?? []), signal.signal_id]),
  );
  const nextEvidence = Array.from(
    new Set([...(existing?.evidence_refs ?? []), ...signal.evidence_refs]),
  );
  const hypothesis: SituationGoalHypothesis = {
    schema: HELIX_SITUATION_GOAL_HYPOTHESIS_SCHEMA,
    hypothesis_id: `goal:${state.roomId}:${hashShort(goalKey, 10)}`,
    room_id: state.roomId,
    graph_id: state.graphId,
    goal_label: goalLabel,
    confidence: event.objective_delta ? 0.9 : 0.7,
    status: deriveGoalStatus(event),
    evidence_refs: nextEvidence,
    derived_from_signal_ids: nextSignals,
    updated_at: signal.ts,
  };
  state.goals.set(goalKey, hypothesis);
  return Array.from(state.goals.values());
};

const updateLocationCounts = (state: RoomRuntimeState, event: HelixWorldEvent): number => {
  const bucket = locationBucket(event.location);
  if (!bucket) return 0;
  const actor = event.actor_id ?? event.actor_label ?? "actor";
  const key = `${actor}:${bucket}`;
  const nextCount = (state.locationCounts.get(key) ?? 0) + 1;
  state.locationCounts.set(key, nextCount);
  return nextCount;
};

const buildSalienceReceipt = (args: {
  event: HelixWorldEvent;
  state: RoomRuntimeState;
  signal: SituationEventSignal;
  goalHypotheses: SituationGoalHypothesis[];
  repeatedLocationCount: number;
}): SituationSalienceReceipt | null => {
  const { event, state, signal, goalHypotheses, repeatedLocationCount } = args;
  const currentHealth = readNumber(event.health_delta, [
    "current_health",
    "current",
    "health",
  ]);
  const dangerNearby =
    readBooleanMeta(event, "hostile_nearby") ||
    readBooleanMeta(event, "lava_nearby") ||
    event.event_type === "mob_nearby" ||
    event.event_type === "player_death";
  const riskEvent =
    event.event_type === "player_damage" ||
    event.event_type === "damage_taken" ||
    event.event_type === "player_death" ||
    currentHealth !== null;
  const lowHealth = currentHealth !== null && currentHealth <= 6;

  let reason: SituationSalienceReceipt["reason"] | null = null;
  let priority: SituationSalienceReceipt["priority"] = "info";
  let summary = "";
  let shouldRequestUserInput = false;

  if ((riskEvent && (lowHealth || dangerNearby)) || event.event_type === "player_death") {
    reason = "risk_detected";
    priority = event.event_type === "player_death" || currentHealth === 0 ? "critical" : "warn";
    summary =
      event.event_type === "player_death"
        ? `${event.actor_label ?? event.actor_id ?? "Player"} died in Minecraft.`
        : `${event.actor_label ?? event.actor_id ?? "Player"} is in danger${
            currentHealth !== null ? ` at ${currentHealth} health` : ""
          }.`;
  } else if (
    event.event_type === "source_disconnected" ||
    getMinecraftEventHints(event).source_health_hint === "disconnected"
  ) {
    reason = "source_health";
    priority = "warn";
    summary = "Minecraft world-event source disconnected.";
  } else if (
    readString(event.objective_delta, "status") === "blocked" ||
    event.event_type === "objective_blocked" ||
    repeatedLocationCount >= 3
  ) {
    reason = "goal_blocked";
    priority = "action";
    summary =
      readString(event.objective_delta, "goal_label") ??
      "Minecraft goal appears blocked or looping near the same location.";
  } else if (
    event.event_type === "item_acquired" ||
    event.event_type === "advancement_unlocked" ||
    event.event_type === "dimension_changed" ||
    readString(event.objective_delta, "status") === "completed" ||
    readString(event.objective_delta, "status") === "progress"
  ) {
    const goalLabel = goalHypotheses.at(-1)?.goal_label ?? deriveGoalLabel(event);
    if (event.objective_delta || goalLabel) {
      reason = "goal_progress";
      priority = "info";
      summary = goalLabel
        ? `Minecraft goal progress: ${goalLabel}.`
        : "Minecraft goal progress observed.";
    }
  }

  if (!reason) return null;
  const dedupeKey = `${reason}:${state.roomId}:${event.actor_id ?? event.actor_label ?? "world"}:${
    deriveGoalLabel(event) ?? event.event_type
  }`;
  return {
    schema: HELIX_SITUATION_SALIENCE_RECEIPT_SCHEMA,
    receipt_id: `salience:${state.roomId}:${hashShort(dedupeKey, 12)}`,
    room_id: state.roomId,
    graph_id: state.graphId,
    signal_ids: [signal.signal_id],
    priority,
    reason,
    should_notify_helix: true,
    should_speak: false,
    should_request_user_input: shouldRequestUserInput,
    dedupe_key: dedupeKey,
    cooldown_ms: 30_000,
    summary,
    evidence_refs: signal.evidence_refs,
    ts: signal.ts,
  };
};

const buildInterjectionProposal = (
  receipt: SituationSalienceReceipt | null,
): SituationInterjectionProposal | null => {
  if (!receipt?.should_notify_helix) return null;
  return {
    schema: HELIX_SITUATION_INTERJECTION_PROPOSAL_SCHEMA,
    proposal_id: `interjection:${receipt.receipt_id}`,
    room_id: receipt.room_id,
    graph_id: receipt.graph_id ?? null,
    salience_receipt_id: receipt.receipt_id,
    mode: "game_master",
    text: receipt.summary,
    voice_output: "off",
    requires_confirmation: true,
    evidence_refs: receipt.evidence_refs,
    ts: receipt.ts,
  };
};

export const ingestWorldEvent = async (
  event: HelixWorldEvent,
  options: WorldEventIngestOptions = {},
): Promise<WorldEventIngestResult> => {
  const graphId = options.graphId ?? null;
  const state = getOrCreateState(event, graphId);
  const signalId = buildSignalId(event);
  const signal = normalizeMinecraftWorldEventToSignal({ event, signalId, graphId });
  state.signals.push(signal);
  state.signals.sort((a: SituationEventSignal, b: SituationEventSignal) =>
    a.ts.localeCompare(b.ts) || a.signal_id.localeCompare(b.signal_id),
  );
  if (state.signals.length > 100) {
    state.signals.splice(0, state.signals.length - 100);
  }
  const repeatedLocationCount = updateLocationCounts(state, event);
  const goalHypotheses = updateGoalHypotheses(state, event, signal);
  const projection = buildProjection(state, event, signal);
  const salienceReceipt = buildSalienceReceipt({
    event,
    state,
    signal,
    goalHypotheses,
    repeatedLocationCount,
  });
  const interjectionProposal = buildInterjectionProposal(salienceReceipt);
  const explicitThreadId = options.threadId ?? null;
  const explicitTurnId = options.turnId ?? null;
  const explicitBinding =
    options.appendToThread !== false && explicitThreadId
      ? createSituationThreadBinding({
          room_id: event.room_id,
          source_id: event.source_id ?? null,
          graph_id: graphId,
          world_id: event.world_id,
          thread_id: explicitThreadId,
          turn_id: explicitTurnId,
          session_id: options.sessionId ?? null,
          trace_id: options.traceId ?? null,
          mode: "standby_receipts",
          append_policy: "all_receipts_debug",
        }).binding ?? null
      : null;
  const resolvedBinding =
    explicitBinding ??
    (options.appendToThread === false
      ? null
      : resolveSituationThreadBinding({
          room_id: event.room_id,
          source_id: event.source_id ?? null,
          graph_id: graphId,
          world_id: event.world_id,
        }));
  const appendResult: Awaited<ReturnType<typeof appendStandbyObservationToThread>> =
    options.appendToThread === false
      ? { appended: false, reason: "no_binding" as const }
      : await appendStandbyObservationToThread({
          binding: resolvedBinding,
          world_event: event,
          signal,
          state_projection: projection,
          goal_hypotheses: goalHypotheses,
          salience_receipt: salienceReceipt,
          interjection_proposal: interjectionProposal,
        });
  const appended = appendResult.appended;
  const threadId = appendResult.thread_id ?? resolvedBinding?.thread_id ?? explicitThreadId ?? null;
  const turnId = appendResult.turn_id ?? resolvedBinding?.turn_id ?? explicitTurnId ?? null;
  const reason =
    appended
      ? null
      : appendResult.reason === "no_binding"
        ? "no_thread_context"
        : appendResult.reason;

  return {
    ok: true,
    schema: "helix.world_event_ingest_response.v1",
    appended,
    signal_id: signal.signal_id,
    salience_receipt_id: salienceReceipt?.receipt_id ?? null,
    projection_id: projection.projection_id,
    goal_hypothesis_ids: goalHypotheses.map((goal: SituationGoalHypothesis) => goal.hypothesis_id),
    thread_id: threadId,
    turn_id: turnId,
    item_id: appendResult.item_id ?? null,
    reason,
    message: appended
      ? "World event ingested and appended as a thread observation."
      : "World event ingested without thread append.",
    event_type: event.event_type,
    signal,
    projection,
    goal_hypotheses: goalHypotheses,
    salience_receipt: salienceReceipt,
    interjection_proposal: interjectionProposal,
  };
};

export const ingestWorldEventBatch = async (
  events: HelixWorldEvent[],
  options: WorldEventIngestOptions = {},
): Promise<WorldEventIngestBatchResult> => {
  const ordered = events
    .slice()
    .sort((a: HelixWorldEvent, b: HelixWorldEvent) => a.ts.localeCompare(b.ts) || a.event_type.localeCompare(b.event_type));
  const results: WorldEventIngestResult[] = [];
  for (const event of ordered) {
    results.push(await ingestWorldEvent(event, options));
  }
  return {
    ok: true,
    schema: "helix.world_event_batch_ingest_response.v1",
    results,
  };
};

export const getWorldEventIngestHealth = (): {
  ok: true;
  service: "helix-world-event-ingest";
  schema: "helix.world_event_ingest_health.v1";
  require_token: boolean;
  max_batch: number;
} => ({
  ok: true,
  service: "helix-world-event-ingest",
  schema: "helix.world_event_ingest_health.v1",
  require_token: process.env.HELIX_WORLD_EVENT_REQUIRE_TOKEN === "1",
  max_batch: Number.isFinite(Number(process.env.HELIX_WORLD_EVENT_MAX_BATCH))
    ? Math.max(1, Math.floor(Number(process.env.HELIX_WORLD_EVENT_MAX_BATCH)))
    : 128,
});
