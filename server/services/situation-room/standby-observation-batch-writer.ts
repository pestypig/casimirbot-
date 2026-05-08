import crypto from "node:crypto";
import {
  HELIX_STANDBY_OBSERVATION_BATCH_SCHEMA,
  type HelixStandbyObservationAppendDecision,
  type HelixStandbyObservationBatchReceipt,
} from "@shared/helix-standby-observation-batch";
import { appendHelixThreadEvent } from "../helix-thread/ledger";

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

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value: string | null | undefined): value is string => Boolean(value)))).sort();

type StandbyBatchObservationInput = {
  eventId: string;
  worldId?: string | null;
  sourceId?: string | null;
  graphId?: string | null;
  observationRef: Record<string, unknown>;
  salienceReason?: string | null;
  saliencePriority?: "info" | "warn" | "critical" | "action" | null;
  dedupeKey?: string | null;
  evidenceRefs: string[];
};

type StandbyBatchExtraItemInput = {
  itemId: string;
  itemType: "toolObservation" | "validation";
  kind: string;
  observationRef: Record<string, unknown>;
  sourceItemIds?: string[];
};

export async function appendStandbyObservationBatch(args: {
  threadId: string;
  turnId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  route?: "/ask" | "/ask/conversation-turn";
  roomId?: string | null;
  observations: StandbyBatchObservationInput[];
  extraItems?: StandbyBatchExtraItemInput[];
  now?: () => Date;
}): Promise<HelixStandbyObservationBatchReceipt> {
  const clock = args.now ?? (() => new Date());
  const started = clock();
  const startedAt = started.toISOString();
  const observations = args.observations.slice();
  const extraItems = args.extraItems?.slice() ?? [];
  const batchId = `standby_batch:${hashShort([
    args.threadId,
    args.roomId ?? null,
    observations.map((observation: StandbyBatchObservationInput) => observation.eventId),
    startedAt,
  ], 16)}`;
  const turnId = args.turnId ?? `standby_batch_turn:${hashShort([batchId, args.threadId], 16)}`;
  const route = args.route ?? "/ask";

  if (observations.length > 0 || extraItems.length > 0) {
    appendHelixThreadEvent({
      route,
      event_type: "turn_started",
      thread_id: args.threadId,
      turn_id: turnId,
      session_id: args.sessionId ?? null,
      trace_id: args.traceId ?? null,
      turn_kind: "auxiliary",
      meta: {
        kind: "standby_observation_batch",
        batch_id: batchId,
        room_id: args.roomId ?? null,
      },
      ts: startedAt,
    });

    for (const observation of observations) {
      const itemId = `standby_observation:${hashShort([batchId, observation.eventId], 16)}`;
      appendHelixThreadEvent({
        route,
        event_type: "item_started",
        thread_id: args.threadId,
        turn_id: turnId,
        session_id: args.sessionId ?? null,
        trace_id: args.traceId ?? null,
        item_id: itemId,
        item_type: "toolObservation",
        item_status: "in_progress",
        item_stream: "observation",
        meta: {
          kind: "standby_observation",
          batch_id: batchId,
          event_id: observation.eventId,
        },
      });
      appendHelixThreadEvent({
        route,
        event_type: "item_completed",
        thread_id: args.threadId,
        turn_id: turnId,
        session_id: args.sessionId ?? null,
        trace_id: args.traceId ?? null,
        item_id: itemId,
        item_type: "toolObservation",
        item_status: "completed",
        item_stream: "observation",
        observation_ref: observation.observationRef,
        meta: {
          kind: "standby_observation",
          batch_id: batchId,
          event_id: observation.eventId,
          salience_reason: observation.salienceReason ?? null,
        },
      });
    }

    for (const extra of extraItems) {
      appendHelixThreadEvent({
        route,
        event_type: "item_started",
        thread_id: args.threadId,
        turn_id: turnId,
        session_id: args.sessionId ?? null,
        trace_id: args.traceId ?? null,
        item_id: extra.itemId,
        item_type: extra.itemType,
        item_status: "in_progress",
        item_stream: "observation",
        source_item_ids: extra.sourceItemIds ?? null,
        meta: {
          kind: extra.kind,
          batch_id: batchId,
        },
      });
      appendHelixThreadEvent({
        route,
        event_type: "item_completed",
        thread_id: args.threadId,
        turn_id: turnId,
        session_id: args.sessionId ?? null,
        trace_id: args.traceId ?? null,
        item_id: extra.itemId,
        item_type: extra.itemType,
        item_status: "completed",
        item_stream: "observation",
        source_item_ids: extra.sourceItemIds ?? null,
        observation_ref: extra.observationRef,
        meta: {
          kind: extra.kind,
          batch_id: batchId,
          model_invoked: false,
          context_role: "observation_not_assistant_answer",
        },
      });
    }

    appendHelixThreadEvent({
      route,
      event_type: "turn_completed",
      thread_id: args.threadId,
      turn_id: turnId,
      session_id: args.sessionId ?? null,
      trace_id: args.traceId ?? null,
      turn_kind: "auxiliary",
      meta: {
        kind: "standby_observation_batch",
        batch_id: batchId,
        item_count: observations.length + extraItems.length,
      },
    });
  }

  const completed = clock();
  const decisions: HelixStandbyObservationAppendDecision[] = observations.map((observation: StandbyBatchObservationInput) => ({
    event_id: observation.eventId,
    world_id: observation.worldId ?? null,
    room_id: args.roomId ?? "unknown",
    source_id: observation.sourceId ?? null,
    graph_id: observation.graphId ?? null,
    thread_id: args.threadId,
    appendable: true,
    appended: true,
    salience_reason: observation.salienceReason ?? null,
    salience_priority: observation.saliencePriority ?? null,
    append_reason: observation.salienceReason === "source_health" ? "source_health" : "salient_receipt",
    suppression_reason: null,
    dedupe_key: observation.dedupeKey ?? null,
    observation_item_id: `standby_observation:${hashShort([batchId, observation.eventId], 16)}`,
  }));

  return {
    schema: HELIX_STANDBY_OBSERVATION_BATCH_SCHEMA,
    batch_id: batchId,
    thread_id: args.threadId,
    turn_id: observations.length > 0 || extraItems.length > 0 ? turnId : null,
    room_id: args.roomId ?? null,
    source_ids: uniqueStrings(observations.map((observation: StandbyBatchObservationInput) => observation.sourceId)),
    world_ids: uniqueStrings(observations.map((observation: StandbyBatchObservationInput) => observation.worldId)),
    event_count: observations.length,
    appendable_count: observations.length,
    appended_count: observations.length,
    suppressed_count: 0,
    decisions,
    started_at: startedAt,
    completed_at: completed.toISOString(),
    duration_ms: Math.max(0, completed.getTime() - started.getTime()),
  };
}
