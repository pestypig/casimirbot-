import crypto from "node:crypto";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import {
  HELIX_VISUAL_PRODUCER_CADENCE_SCHEMA,
  type HelixVisualProducerCadence,
  type HelixVisualProducerCadenceReceipt,
  type HelixVisualProducerCadenceStatus,
} from "@shared/helix-visual-producer-cadence";
import {
  getLiveSourceProducer,
  listLiveSourceChunks,
  setLiveSourceRatePolicy,
  upsertLiveSourceProducer,
} from "./live-source-chunk-buffer";
import { recordLiveSourceProducerLifecycleEvent } from "./live-source-producer-lifecycle-store";
import { recordSituationSourceHeartbeat } from "./situation-source-capability-store";

export type HelixLiveSourceProducerBinding = {
  schema: "helix.live_source_producer_binding.v1";
  binding_id: string;
  thread_id: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  source_id: string;
  producer_id: string;
  modality: "visual_frame";
  participant_id?: string | null;
  status: "bound" | "waiting_for_environment" | "waiting_for_pipeline";
  assistant_answer: false;
  raw_content_included: false;
};

const bindingsBySourceId = new Map<string, HelixLiveSourceProducerBinding>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const nowIso = (): string => new Date().toISOString();

const clampCadenceMs = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(5_000, Math.min(120_000, Math.round(value)));
};

const receipt = (input: {
  cadence: HelixVisualProducerCadence;
  ok?: boolean;
  summary: string;
  nextRequiredAction?: string | null;
}): HelixVisualProducerCadenceReceipt => ({
  schema: "helix.visual_producer_cadence_receipt.v1",
  receipt_id: `visual_producer_cadence_receipt:${hashShort([input.cadence.producer_id, input.cadence.status, Date.now()])}`,
  action_id: "situation-room.live-source.set_rate",
  producer_id: input.cadence.producer_id,
  source_id: input.cadence.source_id,
  thread_id: input.cadence.thread_id,
  cadence_ms: input.cadence.cadence_ms ?? null,
  capture_mode: input.cadence.capture_mode,
  cadence: input.cadence,
  ok: input.ok ?? true,
  summary: input.summary,
  next_required_action: input.nextRequiredAction ?? null,
  assistant_answer: false,
  raw_content_included: false,
});

export function bindLiveSourceProducer(input: {
  threadId: string;
  sourceId: string;
  producer?: HelixLiveSourceProducer | null;
  environmentId?: string | null;
  pipelineId?: string | null;
  participantId?: string | null;
}): HelixLiveSourceProducerBinding {
  const producer = input.producer ?? upsertLiveSourceProducer({
    sourceId: input.sourceId,
    threadId: input.threadId,
    modality: "visual_frame",
    status: "waiting_for_client",
    captureMode: "interval",
    cadenceMs: 15_000,
  });
  const binding: HelixLiveSourceProducerBinding = {
    schema: "helix.live_source_producer_binding.v1",
    binding_id: `live_source_producer_binding:${hashShort([input.threadId, input.sourceId, input.environmentId, input.pipelineId])}`,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    source_id: input.sourceId,
    producer_id: producer.producer_id,
    modality: "visual_frame",
    participant_id: input.participantId ?? null,
    status: input.environmentId || input.pipelineId ? "bound" : "waiting_for_environment",
    assistant_answer: false,
    raw_content_included: false,
  };
  bindingsBySourceId.set(input.sourceId, binding);
  recordLiveSourceProducerLifecycleEvent({
    producerId: producer.producer_id,
    sourceId: input.sourceId,
    threadId: input.threadId,
    environmentId: binding.environment_id ?? null,
    pipelineId: binding.pipeline_id ?? null,
    kind: "producer_bound",
    status: binding.status === "bound" ? "ok" : "waiting",
    summary: `Visual producer binding is ${binding.status}.`,
    relatedIds: [binding.binding_id, binding.environment_id, binding.pipeline_id].filter(Boolean) as string[],
  });
  return binding;
}

export function getLiveSourceProducerBinding(sourceId: string): HelixLiveSourceProducerBinding | null {
  return bindingsBySourceId.get(sourceId) ?? null;
}

export function listLiveSourceProducerBindings(input: { threadId?: string | null } = {}): HelixLiveSourceProducerBinding[] {
  return Array.from(bindingsBySourceId.values())
    .filter((binding: HelixLiveSourceProducerBinding) => !input.threadId || binding.thread_id === input.threadId);
}

export function setVisualProducerCadence(input: {
  threadId: string;
  sourceId: string;
  environmentId?: string | null;
  pipelineId?: string | null;
  cadenceMs?: number | null;
  captureMode?: "manual" | "interval" | "salience_triggered";
  clientStreamConfirmed?: boolean;
  status?: HelixVisualProducerCadenceStatus | null;
}): { producer: HelixLiveSourceProducer; binding: HelixLiveSourceProducerBinding; receipt: HelixVisualProducerCadenceReceipt } {
  const cadenceMs = clampCadenceMs(input.cadenceMs) ?? 15_000;
  const captureMode = input.captureMode ?? "interval";
  const status: HelixVisualProducerCadenceStatus =
    input.status ??
    (input.clientStreamConfirmed ? "active" : "waiting_for_client");
  const producer = setLiveSourceRatePolicy({
    source_id: input.sourceId,
    thread_id: input.threadId,
    modality: "visual_frame",
    capture_mode: captureMode,
    cadence_ms: captureMode === "manual" ? null : cadenceMs,
    status,
  }).producer;
  recordLiveSourceProducerLifecycleEvent({
    producerId: producer.producer_id,
    sourceId: input.sourceId,
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    pipelineId: input.pipelineId ?? null,
    kind: "cadence_set",
    status: input.clientStreamConfirmed ? "ok" : status === "permission_required" ? "blocked" : "waiting",
    summary: captureMode === "interval"
      ? `Visual producer cadence set to ${cadenceMs}ms.`
      : "Visual producer set to manual capture.",
    relatedIds: [producer.producer_id],
  });
  if (input.clientStreamConfirmed) {
    recordLiveSourceProducerLifecycleEvent({
      producerId: producer.producer_id,
      sourceId: input.sourceId,
      threadId: input.threadId,
      environmentId: input.environmentId ?? null,
      pipelineId: input.pipelineId ?? null,
      kind: "interval_started",
      status: "ok",
      summary: "Client stream confirmed and interval producer started.",
      relatedIds: [producer.producer_id],
    });
  }
  const binding = bindLiveSourceProducer({
    threadId: input.threadId,
    sourceId: input.sourceId,
    producer,
    environmentId: input.environmentId ?? null,
    pipelineId: input.pipelineId ?? null,
  });
  const latestChunk = listLiveSourceChunks({
    sourceId: input.sourceId,
    threadId: input.threadId,
    modality: "visual_frame",
    limit: 1,
  }).at(-1) ?? null;
  const cadence: HelixVisualProducerCadence = {
    schema: HELIX_VISUAL_PRODUCER_CADENCE_SCHEMA,
    producer_id: producer.producer_id,
    source_id: input.sourceId,
    thread_id: input.threadId,
    environment_id: binding.environment_id ?? null,
    pipeline_id: binding.pipeline_id ?? null,
    capture_mode: captureMode,
    cadence_ms: captureMode === "manual" ? null : cadenceMs,
    status,
    next_capture_due_at: producer.next_chunk_due_at ?? null,
    last_capture_at: latestChunk?.ts ?? null,
    last_chunk_id: latestChunk?.chunk_id ?? producer.latest_chunk_id ?? null,
    client_stream_confirmed: input.clientStreamConfirmed === true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    producer,
    binding,
    receipt: receipt({
      cadence,
      summary: `${captureMode === "interval" ? `Visual producer cadence set to ${cadenceMs}ms` : "Visual producer cadence updated"}.`,
      nextRequiredAction: input.clientStreamConfirmed ? null : "client_stream_heartbeat_or_permission",
    }),
  };
}

export function markVisualProducerHeartbeat(input: {
  threadId: string;
  sourceId: string;
  environmentId?: string | null;
  pipelineId?: string | null;
  clientStreamConfirmed?: boolean;
  status?: HelixVisualProducerCadenceStatus | null;
  ts?: string | null;
}): { producer: HelixLiveSourceProducer; binding: HelixLiveSourceProducerBinding; receipt: HelixVisualProducerCadenceReceipt } {
  const existing = getLiveSourceProducerBinding(input.sourceId);
  const ts = input.ts ?? nowIso();
  const currentProducer = getLiveSourceProducer(input.sourceId);
  const producer = currentProducer ?? upsertLiveSourceProducer({
    sourceId: input.sourceId,
    threadId: input.threadId,
    modality: "visual_frame",
    status: input.status ?? (input.clientStreamConfirmed ? "active" : "waiting_for_client"),
    cadenceMs: 15_000,
    captureMode: "interval",
    now: ts,
  });
  recordSituationSourceHeartbeat({
    source_id: input.sourceId,
    thread_id: input.threadId,
    modality: "visual_frame",
    status: producer.status,
    ts,
  });
  recordLiveSourceProducerLifecycleEvent({
    producerId: producer.producer_id,
    sourceId: input.sourceId,
    threadId: input.threadId,
    environmentId: input.environmentId ?? existing?.environment_id ?? null,
    pipelineId: input.pipelineId ?? existing?.pipeline_id ?? null,
    kind: input.status === "paused" ? "interval_paused" : input.clientStreamConfirmed ? "client_stream_confirmed" : "producer_stale",
    status: input.status === "paused" ? "ok" : input.clientStreamConfirmed ? "ok" : "waiting",
    summary: input.clientStreamConfirmed ? "Client stream heartbeat confirmed." : `Producer heartbeat recorded with status ${producer.status}.`,
    relatedIds: [producer.producer_id],
    createdAt: ts,
  });
  const binding = bindLiveSourceProducer({
    threadId: input.threadId,
    sourceId: input.sourceId,
    producer,
    environmentId: input.environmentId ?? existing?.environment_id ?? null,
    pipelineId: input.pipelineId ?? existing?.pipeline_id ?? null,
  });
  const latestChunk = listLiveSourceChunks({
    sourceId: input.sourceId,
    threadId: input.threadId,
    modality: "visual_frame",
    limit: 1,
  }).at(-1) ?? null;
  return {
    producer,
    binding,
    receipt: receipt({
      cadence: {
        schema: HELIX_VISUAL_PRODUCER_CADENCE_SCHEMA,
        producer_id: producer.producer_id,
        source_id: input.sourceId,
        thread_id: input.threadId,
        environment_id: binding.environment_id ?? null,
        pipeline_id: binding.pipeline_id ?? null,
        capture_mode: producer.capture_mode === "manual" || producer.capture_mode === "salience_triggered" ? producer.capture_mode : "interval",
        cadence_ms: producer.cadence_ms ?? null,
        status: producer.status === "active" ? "active" : producer.status === "paused" ? "paused" : producer.status === "stopped" ? "stopped" : producer.status === "permission_required" ? "permission_required" : "waiting_for_client",
        next_capture_due_at: producer.next_chunk_due_at ?? null,
        last_capture_at: latestChunk?.ts ?? null,
        last_chunk_id: latestChunk?.chunk_id ?? producer.latest_chunk_id ?? null,
        client_stream_confirmed: input.clientStreamConfirmed === true,
        assistant_answer: false,
        raw_content_included: false,
      },
      summary: "Visual producer heartbeat recorded.",
      nextRequiredAction: input.clientStreamConfirmed ? null : "client_stream_heartbeat_or_permission",
    }),
  };
}

export function readVisualProducerTickDue(input: {
  threadId: string;
  sourceId: string;
  now?: string | null;
}): {
  due: boolean;
  producer: HelixLiveSourceProducer | null;
  binding: HelixLiveSourceProducerBinding | null;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
} {
  const binding = getLiveSourceProducerBinding(input.sourceId);
  const producer = getLiveSourceProducer(input.sourceId);
  const nowMs = Date.parse(input.now ?? nowIso());
  const dueMs = producer?.next_chunk_due_at ? Date.parse(producer.next_chunk_due_at) : Number.POSITIVE_INFINITY;
  const due = producer?.status === "active" && producer.capture_mode === "interval" && Number.isFinite(dueMs) && nowMs >= dueMs;
  if (producer) {
    recordLiveSourceProducerLifecycleEvent({
      producerId: producer.producer_id,
      sourceId: producer.source_id,
      threadId: producer.thread_id,
      environmentId: binding?.environment_id ?? null,
      pipelineId: binding?.pipeline_id ?? null,
      kind: "capture_due",
      status: due ? "ok" : "waiting",
      summary: due ? "Producer interval reports capture due." : "Producer interval reports capture not due yet.",
      relatedIds: [producer.producer_id],
    });
  }
  return {
    due,
    producer,
    binding,
    next_required_action: !producer
      ? "start_visual_producer"
      : producer.status === "permission_required"
      ? "grant_visual_capture_permission"
      : producer.status === "waiting_for_client"
        ? "client_stream_heartbeat_or_permission"
        : due
          ? "capture_frame_now"
          : null,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function resetLiveSourceProducerBindingsForTest(): void {
  bindingsBySourceId.clear();
}
