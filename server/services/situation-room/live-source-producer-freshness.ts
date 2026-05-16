import {
  HELIX_LIVE_SOURCE_PRODUCER_FRESHNESS_SCHEMA,
  type HelixLiveSourceProducerFreshness,
} from "@shared/helix-live-source-producer-freshness";
import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import {
  listLiveSourceAnalysisJobs,
  listLiveSourceChunks,
  listLiveSourceProducers,
} from "./live-source-chunk-buffer";
import { getLiveSourceProducerBinding } from "./live-source-producer-binding";
import { getVisualProducerSchedulerAdoption } from "./visual-producer-scheduler-adoption-store";
import { listLiveAnswerEnvironmentDeltas } from "./live-answer-environment-store";

const latest = <T>(items: T[]): T | null => items.at(-1) ?? null;

const outputEvidenceRef = (job: HelixLiveSourceAnalysisJob | null): string | null =>
  job?.output_refs.find((ref) => /^visual_evidence:/.test(ref)) ?? job?.output_refs[0] ?? null;

export function readLiveSourceProducerFreshness(input: {
  producerId: string;
  now?: string | null;
}): HelixLiveSourceProducerFreshness | null {
  const actualProducer = listLiveSourceProducers()
    .find((producer) => producer.producer_id === input.producerId || producer.source_id === input.producerId) ?? null;
  if (!actualProducer) {
    return null;
  }
  const chunks = listLiveSourceChunks({
    sourceId: actualProducer.source_id,
    threadId: actualProducer.thread_id,
    modality: actualProducer.modality,
    limit: 50,
  });
  const latestChunk = latest(chunks) as HelixLiveSourceChunk | null;
  const jobs = listLiveSourceAnalysisJobs({
    threadId: actualProducer.thread_id,
    sourceId: actualProducer.source_id,
    limit: 100,
  });
  const latestJob = latest(jobs) as HelixLiveSourceAnalysisJob | null;
  const binding = getLiveSourceProducerBinding(actualProducer.source_id);
  const adoption = getVisualProducerSchedulerAdoption(actualProducer.producer_id) ??
    getVisualProducerSchedulerAdoption(actualProducer.source_id);
  const deltas = binding?.environment_id
    ? listLiveAnswerEnvironmentDeltas(binding.environment_id).slice(-20)
    : [];
  const latestDelta = latest(deltas);
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  const cadenceMs = actualProducer.cadence_ms ?? null;
  const lastChunkMs = latestChunk?.ts ? Date.parse(latestChunk.ts) : null;
  const staleWindowMs = cadenceMs ? cadenceMs * 2 : 60_000;
  let staleReason: string | null = null;
  let nextRequiredAction: string | null = null;
  if (actualProducer.status === "permission_required") {
    staleReason = "visual_capture_permission_required";
    nextRequiredAction = "grant_visual_capture_permission";
  } else if (actualProducer.status === "waiting_for_client" && adoption?.status !== "adopted") {
    staleReason = "waiting_for_client_stream";
    nextRequiredAction = adoption ? "client_stream_heartbeat_or_permission" : "client_adopt_visual_producer";
  } else if (actualProducer.capture_mode === "interval" && (!latestChunk || (lastChunkMs !== null && nowMs - lastChunkMs > staleWindowMs))) {
    staleReason = "no_chunk_after_two_cadence_windows";
    nextRequiredAction = "capture_frame_now";
  } else if (latestChunk && !latestJob) {
    staleReason = "analysis_pending_or_failed";
    nextRequiredAction = "run_due_analysis";
  } else if (latestJob && latestJob.status === "queued") {
    staleReason = "analysis_pending_or_failed";
    nextRequiredAction = "run_due_analysis";
  } else if (latestJob && latestJob.status === "failed") {
    staleReason = "analysis_pending_or_failed";
    nextRequiredAction = "repair_pipeline";
  } else if (latestJob && latestJob.status === "completed" && binding?.environment_id && !latestDelta) {
    staleReason = "routing_gap";
    nextRequiredAction = "inspect_pipeline";
  }
  const isFresh = staleReason === null;
  return {
    schema: HELIX_LIVE_SOURCE_PRODUCER_FRESHNESS_SCHEMA,
    producer_id: actualProducer.producer_id,
    source_id: actualProducer.source_id,
    thread_id: actualProducer.thread_id,
    cadence_ms: cadenceMs,
    last_capture_at: latestChunk?.ts ?? null,
    last_chunk_id: latestChunk?.chunk_id ?? actualProducer.latest_chunk_id ?? null,
    last_analysis_job_id: latestJob?.job_id ?? null,
    last_visual_evidence_id: outputEvidenceRef(latestJob),
    last_card_delta_at: latestDelta?.ts ?? null,
    is_fresh: isFresh,
    stale_reason: staleReason,
    next_required_action: nextRequiredAction,
    assistant_answer: false,
    raw_content_included: false,
  };
}
