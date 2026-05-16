import crypto from "node:crypto";
import {
  HELIX_VISUAL_PRODUCER_SCHEDULER_ADOPTION_SCHEMA,
  type HelixVisualProducerSchedulerAdoption,
  type HelixVisualProducerSchedulerAdoptionStatus,
} from "@shared/helix-visual-producer-scheduler-adoption";
import type { HelixLiveSourceCaptureMode } from "@shared/helix-live-source-producer";
import { recordLiveSourceProducerLifecycleEvent } from "./live-source-producer-lifecycle-store";

const adoptionsByProducerId = new Map<string, HelixVisualProducerSchedulerAdoption>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const normalizeCaptureMode = (value: unknown): Extract<HelixLiveSourceCaptureMode, "manual" | "interval" | "salience_triggered"> =>
  value === "manual" || value === "salience_triggered" ? value : "interval";

const normalizeStatus = (value: unknown): HelixVisualProducerSchedulerAdoptionStatus =>
  value === "adopted" ||
  value === "waiting_for_stream" ||
  value === "waiting_for_environment" ||
  value === "paused" ||
  value === "stopped" ||
  value === "error"
    ? value
    : "waiting_for_stream";

export function recordVisualProducerSchedulerAdoption(input: Record<string, unknown>): HelixVisualProducerSchedulerAdoption {
  const producerId = asString(input.producer_id ?? input.producerId) ?? `live_source_producer:${hashShort([input.source_id, input.thread_id])}`;
  const sourceId = asString(input.source_id ?? input.sourceId) ?? `source:visual_frame:${asString(input.thread_id) ?? "helix-ask:desktop"}`;
  const threadId = asString(input.thread_id ?? input.threadId) ?? "helix-ask:desktop";
  const clientStreamConfirmed = input.client_stream_confirmed === true;
  const intervalActive = input.interval_active === true;
  const status = normalizeStatus(input.status) === "waiting_for_stream" && clientStreamConfirmed && intervalActive
    ? "adopted"
    : normalizeStatus(input.status);
  const adoption: HelixVisualProducerSchedulerAdoption = {
    schema: HELIX_VISUAL_PRODUCER_SCHEDULER_ADOPTION_SCHEMA,
    adoption_id: `visual_producer_scheduler_adoption:${hashShort([producerId, sourceId, threadId, Date.now()])}`,
    producer_id: producerId,
    source_id: sourceId,
    thread_id: threadId,
    environment_id: asString(input.environment_id ?? input.environmentId),
    pipeline_id: asString(input.pipeline_id ?? input.pipelineId),
    cadence_ms: asNumber(input.cadence_ms ?? input.cadenceMs),
    capture_mode: normalizeCaptureMode(input.capture_mode ?? input.captureMode),
    client_stream_confirmed: clientStreamConfirmed,
    interval_active: intervalActive,
    next_capture_due_at: asString(input.next_capture_due_at ?? input.nextCaptureDueAt),
    last_capture_at: asString(input.last_capture_at ?? input.lastCaptureAt),
    last_chunk_id: asString(input.last_chunk_id ?? input.lastChunkId),
    status,
    summary:
      status === "adopted"
        ? "Client scheduler adopted the visual producer cadence."
        : `Client scheduler adoption is ${status}.`,
    assistant_answer: false,
    raw_content_included: false,
  };
  adoptionsByProducerId.set(producerId, adoption);
  recordLiveSourceProducerLifecycleEvent({
    producerId,
    sourceId,
    threadId,
    environmentId: adoption.environment_id ?? null,
    pipelineId: adoption.pipeline_id ?? null,
    kind: status === "adopted" ? "client_stream_confirmed" : "producer_stale",
    status: status === "adopted" ? "ok" : status === "error" ? "failed" : "waiting",
    summary: adoption.summary,
    relatedIds: [adoption.adoption_id],
  });
  return adoption;
}

export function getVisualProducerSchedulerAdoption(producerIdOrSourceId: string | null | undefined): HelixVisualProducerSchedulerAdoption | null {
  if (!producerIdOrSourceId) return null;
  return adoptionsByProducerId.get(producerIdOrSourceId) ??
    Array.from(adoptionsByProducerId.values()).find((entry) => entry.source_id === producerIdOrSourceId) ??
    null;
}

export function listVisualProducerSchedulerAdoptions(input: { threadId?: string | null } = {}): HelixVisualProducerSchedulerAdoption[] {
  return Array.from(adoptionsByProducerId.values())
    .filter((entry) => !input.threadId || entry.thread_id === input.threadId);
}

export function resetVisualProducerSchedulerAdoptionsForTest(): void {
  adoptionsByProducerId.clear();
}
