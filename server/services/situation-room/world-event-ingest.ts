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
import type {
  HelixStandbyObservationAppendDecision,
  HelixStandbyObservationBatchReceipt,
} from "@shared/helix-standby-observation-batch";
import type { StandbyQueueItem } from "@shared/helix-standby-queue";
import type { SituationNarrationReceipt } from "@shared/helix-situation-narration";
import type { SituationPrediction } from "@shared/helix-situation-prediction";
import type { SituationSemanticEvent } from "@shared/helix-situation-semantics";
import type {
  SituationEpisode,
  SituationEpisodeNarration,
  SituationPrediction as SituationEpisodePrediction,
} from "@shared/helix-situation-episode";
import {
  getMinecraftEventHints,
  normalizeMinecraftWorldEventToSignal,
} from "./minecraft-event-normalizer";
import {
  classifyMinecraftEventSalience,
  getLocationMinSamples,
  isLocationSalienceEnabled,
  type MinecraftEventSalienceClass,
} from "./minecraft-salience-policy";
import { buildStandbyObservationRef } from "./standby-thread-observation";
import { appendStandbyObservationBatch } from "./standby-observation-batch-writer";
import { decideSituationInterjection, type InterjectionDecision } from "./interjection-policy";
import { reduceGoalPredictions } from "./goal-prediction-reducer";
import { buildSituationMicroNarration } from "./situation-micro-narrator";
import { buildSituationSemanticEvents } from "./situation-semantic-dictionary";
import { completeStandbyQueueItem, enqueueStandbyQueueItem } from "./standby-queue";
import {
  createSituationThreadBinding,
} from "./thread-binding-store";
import { resolveWorldEventThreadBinding } from "./thread-binding-resolver";
import {
  recordWorldSourceSeen,
  resetWorldSourceRegistry,
  updateWorldSourceDebug,
  type WorldSourceSeen,
} from "./world-source-registry";
import { summarizeWorldEventQuality, type WorldEventQualitySummary } from "./world-event-quality";
import {
  narrateSituationEpisode,
  predictFromSituationEpisode,
  reduceSituationEpisodes,
} from "./situation-episode-reducer";

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
  dry_run: z.boolean().optional(),
  force_thread_id: z.string().trim().min(1).optional(),
  force_room_id: z.string().trim().min(1).optional(),
  deterministic_now: z.string().trim().min(1).optional(),
  events: z.array(helixWorldEventSchema),
});

export type WorldEventIngestOptions = {
  appendToThread?: boolean;
  deferThreadAppend?: boolean;
  threadId?: string | null;
  turnId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  graphId?: string | null;
  now?: () => Date;
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
  semantic_events?: SituationSemanticEvent[];
  narration_receipt?: SituationNarrationReceipt | null;
  predictions?: SituationPrediction[];
  episodes?: SituationEpisode[];
  episode_narrations?: SituationEpisodeNarration[];
  episode_predictions?: SituationEpisodePrediction[];
  queue_items?: StandbyQueueItem[];
  interjection_decision?: InterjectionDecision;
  debug?: WorldEventIngestDebug;
  append_decision?: HelixStandbyObservationAppendDecision;
  batch_receipt?: HelixStandbyObservationBatchReceipt | null;
  append_candidate?: WorldEventAppendCandidate | null;
};

export type WorldEventIngestBatchResult = {
  ok: boolean;
  schema: "helix.world_event_batch_ingest_response.v1";
  event_count: number;
  appended_count: number;
  suppressed_count: number;
  batch_receipts: HelixStandbyObservationBatchReceipt[];
  results: WorldEventIngestResult[];
};

export type WorldEventIngestDebug = {
  append_decision: "appended" | "not_appended";
  append_reason:
    | "no_thread_context"
    | "observe_only_binding"
    | "not_salient"
    | "projection_only"
    | "dedupe_cooldown"
    | "rate_limited"
    | "binding_mismatch"
    | "appended";
  salience_class: MinecraftEventSalienceClass;
  binding_id?: string | null;
  thread_id?: string | null;
  dedupe_key?: string | null;
  seen_source?: WorldSourceSeen;
  quality?: WorldEventQualitySummary;
};

export type WorldEventAppendCandidate = {
  event: HelixWorldEvent;
  eventId: string;
  threadId: string;
  sessionId?: string | null;
  traceId?: string | null;
  roomId: string;
  worldId?: string | null;
  sourceId?: string | null;
  graphId?: string | null;
  observationRef: Record<string, unknown>;
  salienceReason?: string | null;
  saliencePriority?: "info" | "warn" | "critical" | "action" | null;
  dedupeKey?: string | null;
  evidenceRefs: string[];
};

type RoomRuntimeState = {
  roomId: string;
  graphId: string | null;
  worldId: string;
  signals: SituationEventSignal[];
  worldEvents: HelixWorldEvent[];
  goals: Map<string, SituationGoalHypothesis>;
  predictions: Map<string, SituationPrediction>;
  episodePredictions: Map<string, SituationEpisodePrediction>;
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
  resetWorldSourceRegistry();
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
    worldEvents: [],
    goals: new Map(),
    predictions: new Map(),
    episodePredictions: new Map(),
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
  salienceClass: MinecraftEventSalienceClass;
}): SituationSalienceReceipt | null => {
  const { event, state, signal, goalHypotheses, repeatedLocationCount, salienceClass } = args;
  if (salienceClass === "projection_only" && event.event_type !== "player_location_sample") {
    return null;
  }
  if (event.event_type === "player_location_sample" && !isLocationSalienceEnabled()) {
    return null;
  }
  const currentHealth = readNumber(event.health_delta, [
    "current_health",
    "current",
    "health",
  ]);
  const dangerNearby =
    readBooleanMeta(event, "hostile_nearby") ||
    readBooleanMeta(event, "lava_nearby") ||
    event.event_type === "mob_nearby" ||
    event.event_type === "hostile_nearby" ||
    event.event_type === "creeper_fuse_started" ||
    event.event_type === "explosion_imminent" ||
    event.event_type === "player_death";
  const precursorRisk =
    event.event_type === "mob_nearby" ||
    event.event_type === "hostile_nearby" ||
    event.event_type === "creeper_fuse_started" ||
    event.event_type === "explosion_imminent";
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

  if ((riskEvent && (lowHealth || dangerNearby)) || precursorRisk || event.event_type === "player_death") {
    reason = "risk_detected";
    priority =
      event.event_type === "player_death" ||
      currentHealth === 0 ||
      event.event_type === "explosion_imminent"
        ? "critical"
        : "warn";
    summary =
      event.event_type === "player_death"
        ? `${event.actor_label ?? event.actor_id ?? "Player"} died in Minecraft.`
        : precursorRisk
          ? `${event.actor_label ?? event.actor_id ?? "Player"} has a nearby Minecraft threat.`
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
    (event.event_type === "player_location_sample" &&
      repeatedLocationCount >= getLocationMinSamples() &&
      goalHypotheses.some((goal: SituationGoalHypothesis) => goal.status === "active" || goal.status === "blocked"))
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

const recordCompletedQueueItem = (input: {
  roomId: string;
  graphId?: string | null;
  taskKind: "semantic_event" | "micro_narration" | "goal_prediction" | "salience_review" | "interjection_review";
  inputRefs: string[];
  resultRef?: string | null;
  priority?: "critical_salience" | "standby_salience" | "standby_interpretation";
  ts: string;
}): StandbyQueueItem => {
  const item = enqueueStandbyQueueItem({
    room_id: input.roomId,
    graph_id: input.graphId ?? null,
    priority: input.priority ?? "standby_interpretation",
    task_kind: input.taskKind,
    input_refs: input.inputRefs,
    created_at: input.ts,
  });
  return completeStandbyQueueItem(item.queue_item_id, input.resultRef ?? null, input.ts) ?? item;
};

export const ingestWorldEvent = async (
  event: HelixWorldEvent,
  options: WorldEventIngestOptions = {},
): Promise<WorldEventIngestResult> => {
  const graphId = options.graphId ?? null;
  const salienceClass = classifyMinecraftEventSalience(event);
  const seenSource = recordWorldSourceSeen(event);
  const quality = summarizeWorldEventQuality(event);
  const state = getOrCreateState(event, graphId);
  const signalId = buildSignalId(event);
  const signal = normalizeMinecraftWorldEventToSignal({ event, signalId, graphId });
  state.signals.push(signal);
  state.signals.sort((a: SituationEventSignal, b: SituationEventSignal) =>
    a.ts.localeCompare(b.ts) || a.signal_id.localeCompare(b.signal_id),
  );
  state.worldEvents.push(event);
  state.worldEvents.sort((a: HelixWorldEvent, b: HelixWorldEvent) =>
    a.ts.localeCompare(b.ts) || a.event_type.localeCompare(b.event_type),
  );
  if (state.signals.length > 100) {
    state.signals.splice(0, state.signals.length - 100);
  }
  if (state.worldEvents.length > 100) {
    state.worldEvents.splice(0, state.worldEvents.length - 100);
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
    salienceClass,
  });
  const interjectionProposal = buildInterjectionProposal(salienceReceipt);
  const semanticEvents = buildSituationSemanticEvents({ event, signal });
  const narrationReceipt = buildSituationMicroNarration({
    roomId: event.room_id,
    graphId,
    semanticEvents,
    ts: signal.ts,
  });
  const predictions = reduceGoalPredictions({
    roomId: event.room_id,
    graphId,
    semanticEvents,
    narration: narrationReceipt,
    existing: Array.from(state.predictions.values()),
  });
  const recentWindowStart = Number.isFinite(Date.parse(event.ts))
    ? new Date(Date.parse(event.ts) - 12_000).toISOString()
    : event.ts;
  const recentWorldEvents = state.worldEvents.filter((entry: HelixWorldEvent) => entry.ts >= recentWindowStart);
  const episodes = reduceSituationEpisodes({
    roomId: event.room_id,
    graphId,
    worldId: event.world_id,
    events: recentWorldEvents,
  });
  const episodeNarrations = episodes.map(narrateSituationEpisode);
  const episodePredictions = episodes.flatMap(predictFromSituationEpisode);
  state.predictions.clear();
  for (const prediction of predictions) {
    state.predictions.set(prediction.prediction_id, prediction);
  }
  state.episodePredictions.clear();
  for (const prediction of episodePredictions) {
    state.episodePredictions.set(prediction.prediction_id, prediction);
  }
  const interjectionDecision = decideSituationInterjection({
    salienceReceipt,
    interjectionProposal,
    predictions,
    powerMode: "low_power",
    voiceOutputGranted: false,
    speakerAuthority: "trusted",
  });
  const queueItems: StandbyQueueItem[] = [];
  if (semanticEvents.length > 0) {
    queueItems.push(
      recordCompletedQueueItem({
        roomId: event.room_id,
        graphId,
        taskKind: "semantic_event",
        inputRefs: [signal.signal_id],
        resultRef: semanticEvents.at(-1)?.semantic_event_id ?? null,
        ts: signal.ts,
      }),
    );
  }
  if (narrationReceipt) {
    queueItems.push(
      recordCompletedQueueItem({
        roomId: event.room_id,
        graphId,
        taskKind: "micro_narration",
        inputRefs: narrationReceipt.semantic_event_ids,
        resultRef: narrationReceipt.narration_id,
        ts: signal.ts,
      }),
    );
  }
  if (predictions.length > 0 && narrationReceipt) {
    queueItems.push(
      recordCompletedQueueItem({
        roomId: event.room_id,
        graphId,
        taskKind: "goal_prediction",
        inputRefs: [narrationReceipt.narration_id],
        resultRef: predictions.at(-1)?.prediction_id ?? null,
        ts: signal.ts,
      }),
    );
  }
  if (salienceReceipt) {
    queueItems.push(
      recordCompletedQueueItem({
        roomId: event.room_id,
        graphId,
        taskKind: "salience_review",
        inputRefs: [signal.signal_id],
        resultRef: salienceReceipt.receipt_id,
        priority: salienceReceipt.priority === "critical" || salienceReceipt.priority === "action"
          ? "critical_salience"
          : "standby_salience",
        ts: signal.ts,
      }),
    );
  }
  if (interjectionProposal) {
    queueItems.push(
      recordCompletedQueueItem({
        roomId: event.room_id,
        graphId,
        taskKind: "interjection_review",
        inputRefs: [interjectionProposal.salience_receipt_id],
        resultRef: interjectionProposal.proposal_id,
        priority: "standby_salience",
        ts: signal.ts,
      }),
    );
  }
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
  const bindingResolution =
    explicitBinding || options.appendToThread === false
      ? { binding: explicitBinding, reason: explicitBinding ? ("matched" as const) : ("no_thread_context" as const), mismatched_bindings: [] }
      : resolveWorldEventThreadBinding({
          room_id: event.room_id,
          source_id: event.source_id ?? null,
          graph_id: graphId,
          world_id: event.world_id,
        });
  const resolvedBinding = bindingResolution.binding;
  const appendBlockedReason =
    bindingResolution.reason === "binding_mismatch"
      ? "binding_mismatch"
      : !resolvedBinding
        ? "no_thread_context"
        : resolvedBinding.mode === "observe_only"
          ? "binding_observe_only"
          : resolvedBinding.append_policy === "salient_only" && salienceReceipt?.should_notify_helix !== true
            ? "not_salient"
            : null;
  const appendCandidate: WorldEventAppendCandidate | null =
    options.appendToThread === false || appendBlockedReason || !resolvedBinding
      ? null
      : {
          event,
          eventId: signal.signal_id,
          threadId: resolvedBinding.thread_id,
          sessionId: resolvedBinding.session_id ?? options.sessionId ?? null,
          traceId: resolvedBinding.trace_id ?? options.traceId ?? null,
          roomId: resolvedBinding.room_id,
          worldId: resolvedBinding.world_id ?? event.world_id,
          sourceId: resolvedBinding.source_id ?? event.source_id ?? null,
          graphId: resolvedBinding.graph_id ?? graphId,
          observationRef: buildStandbyObservationRef({
            binding: resolvedBinding,
            world_event: event,
            signal,
            state_projection: projection,
            goal_hypotheses: goalHypotheses,
            salience_receipt: salienceReceipt,
            interjection_proposal: interjectionProposal,
          semantic_events: semanticEvents,
          narration_receipts: narrationReceipt ? [narrationReceipt] : [],
          predictions,
          episodes,
          episode_narrations: episodeNarrations,
          episode_predictions: episodePredictions,
          interjection_decision: interjectionDecision,
        }),
          salienceReason: salienceReceipt?.reason ?? null,
          saliencePriority: salienceReceipt?.priority ?? null,
          dedupeKey: salienceReceipt?.dedupe_key ?? null,
          evidenceRefs: signal.evidence_refs,
        };
  const batchReceipt =
    appendCandidate && !options.deferThreadAppend
      ? await appendStandbyObservationBatch({
          threadId: appendCandidate.threadId,
          turnId: resolvedBinding?.turn_id ?? explicitTurnId ?? null,
          sessionId: appendCandidate.sessionId,
          traceId: appendCandidate.traceId,
          roomId: appendCandidate.roomId,
          now: options.now,
          observations: [
            {
              eventId: appendCandidate.eventId,
              worldId: appendCandidate.worldId,
              sourceId: appendCandidate.sourceId,
              graphId: appendCandidate.graphId,
              observationRef: appendCandidate.observationRef,
              salienceReason: appendCandidate.salienceReason,
              saliencePriority: appendCandidate.saliencePriority,
              dedupeKey: appendCandidate.dedupeKey,
              evidenceRefs: appendCandidate.evidenceRefs,
            },
          ],
        })
      : null;
  const batchDecision = batchReceipt?.decisions[0] ?? null;
  const appended = Boolean(batchDecision?.appended);
  const threadId = batchDecision?.thread_id ?? resolvedBinding?.thread_id ?? explicitThreadId ?? null;
  const turnId = batchReceipt?.turn_id ?? resolvedBinding?.turn_id ?? explicitTurnId ?? null;
  const reason =
    appended
      ? null
      : appendBlockedReason === "binding_observe_only"
        ? "binding_observe_only"
        : appendBlockedReason ?? (appendCandidate ? "batch_deferred" : "no_thread_context");
  const appendReason: WorldEventIngestDebug["append_reason"] = appended
    ? "appended"
    : reason === "binding_mismatch"
      ? "binding_mismatch"
      : salienceClass === "projection_only" && !salienceReceipt
        ? "projection_only"
        : reason === "binding_observe_only"
          ? "observe_only_binding"
          : reason === "not_salient"
            ? "not_salient"
            : "no_thread_context";
  const debug: WorldEventIngestDebug = {
    append_decision: appended ? "appended" : "not_appended",
    append_reason: appendReason,
    salience_class: salienceClass,
    binding_id: resolvedBinding?.binding_id ?? null,
    thread_id: threadId,
    dedupe_key: salienceReceipt?.dedupe_key ?? null,
    seen_source: seenSource,
    quality,
  };
  updateWorldSourceDebug(event, {
    append_decision: debug.append_decision,
    append_reason: debug.append_reason,
    salience_class: debug.salience_class,
    binding_id: debug.binding_id,
    thread_id: debug.thread_id,
    dedupe_key: debug.dedupe_key,
    item_id: batchDecision?.observation_item_id ?? null,
    batch_id: batchReceipt?.batch_id ?? null,
    turn_id: batchReceipt?.turn_id ?? null,
  });
  const appendDecision: HelixStandbyObservationAppendDecision = batchDecision ?? {
    event_id: signal.signal_id,
    world_id: event.world_id,
    room_id: event.room_id,
    source_id: event.source_id ?? null,
    graph_id: graphId,
    thread_id: threadId,
    appendable: Boolean(appendCandidate),
    appended: false,
    salience_reason: salienceReceipt?.reason ?? null,
    salience_priority: salienceReceipt?.priority ?? null,
    append_reason: appendCandidate ? "salient_receipt" : null,
    suppression_reason:
      appendReason === "observe_only_binding"
        ? "observe_only_binding"
        : appendReason === "appended"
          ? null
          : appendReason,
    dedupe_key: salienceReceipt?.dedupe_key ?? null,
    observation_item_id: null,
  };

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
    item_id: batchDecision?.observation_item_id ?? null,
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
    semantic_events: semanticEvents,
    narration_receipt: narrationReceipt,
    predictions,
    episodes,
    episode_narrations: episodeNarrations,
    episode_predictions: episodePredictions,
    queue_items: queueItems,
    interjection_decision: interjectionDecision,
    debug,
    append_decision: appendDecision,
    batch_receipt: batchReceipt,
    append_candidate: appendCandidate,
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
    results.push(await ingestWorldEvent(event, { ...options, deferThreadAppend: true }));
  }
  const candidates = results
    .map((result: WorldEventIngestResult) => result.append_candidate)
    .filter((candidate: WorldEventAppendCandidate | null | undefined): candidate is WorldEventAppendCandidate =>
      Boolean(candidate),
    );
  const candidatesByThread = new Map<string, WorldEventAppendCandidate[]>();
  for (const candidate of candidates) {
    const key = `${candidate.threadId}:${candidate.sessionId ?? ""}:${candidate.traceId ?? ""}:${candidate.roomId}`;
    const group = candidatesByThread.get(key) ?? [];
    group.push(candidate);
    candidatesByThread.set(key, group);
  }

  const batchReceipts: HelixStandbyObservationBatchReceipt[] = [];
  for (const group of candidatesByThread.values()) {
    const first = group[0];
    const receipt = await appendStandbyObservationBatch({
      threadId: first.threadId,
      turnId: null,
      sessionId: first.sessionId ?? null,
      traceId: first.traceId ?? null,
      roomId: first.roomId,
      now: options.now,
      observations: group.map((candidate: WorldEventAppendCandidate) => ({
        eventId: candidate.eventId,
        worldId: candidate.worldId,
        sourceId: candidate.sourceId,
        graphId: candidate.graphId,
        observationRef: candidate.observationRef,
        salienceReason: candidate.salienceReason,
        saliencePriority: candidate.saliencePriority,
        dedupeKey: candidate.dedupeKey,
        evidenceRefs: candidate.evidenceRefs,
      })),
    });
    batchReceipts.push(receipt);
  }

  const decisionsByEventId = new Map<string, { decision: HelixStandbyObservationAppendDecision; receipt: HelixStandbyObservationBatchReceipt }>();
  for (const receipt of batchReceipts) {
    for (const decision of receipt.decisions) {
      decisionsByEventId.set(decision.event_id, { decision, receipt });
    }
  }

  for (const result of results) {
    const eventId = result.signal_id;
    if (!eventId) continue;
    const appendedDecision = decisionsByEventId.get(eventId);
    if (!appendedDecision) continue;
    result.appended = appendedDecision.decision.appended;
    result.reason = appendedDecision.decision.appended ? null : result.reason;
    result.thread_id = appendedDecision.decision.thread_id ?? result.thread_id;
    result.turn_id = appendedDecision.receipt.turn_id ?? result.turn_id;
    result.item_id = appendedDecision.decision.observation_item_id ?? result.item_id;
    result.append_decision = appendedDecision.decision;
    result.batch_receipt = appendedDecision.receipt;
    if (result.debug) {
      result.debug.append_decision = appendedDecision.decision.appended ? "appended" : "not_appended";
      result.debug.append_reason = appendedDecision.decision.appended ? "appended" : result.debug.append_reason;
      result.debug.thread_id = appendedDecision.decision.thread_id ?? result.debug.thread_id;
    }
    const candidate = result.append_candidate;
    if (candidate) {
      updateWorldSourceDebug(candidate.event, {
        append_decision: appendedDecision.decision.appended ? "appended" : "not_appended",
        append_reason: appendedDecision.decision.appended ? "appended" : result.debug?.append_reason ?? "not_salient",
        salience_class: result.debug?.salience_class ?? "salience_candidate",
        binding_id: result.debug?.binding_id ?? null,
        thread_id: appendedDecision.decision.thread_id ?? null,
        dedupe_key: appendedDecision.decision.dedupe_key ?? null,
        item_id: appendedDecision.decision.observation_item_id ?? null,
        batch_id: appendedDecision.receipt.batch_id,
        turn_id: appendedDecision.receipt.turn_id ?? null,
      });
    }
  }
  const appendedCount = results.filter((result: WorldEventIngestResult) => result.appended).length;
  return {
    ok: true,
    schema: "helix.world_event_batch_ingest_response.v1",
    event_count: results.length,
    appended_count: appendedCount,
    suppressed_count: results.length - appendedCount,
    batch_receipts: batchReceipts,
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
