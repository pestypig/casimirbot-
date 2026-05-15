import crypto from "node:crypto";
import {
  HELIX_LIVE_SOURCE_ANALYSIS_JOB_SCHEMA,
  type HelixLiveSourceAnalysisJob,
  type HelixLiveSourceAnalysisJobStatus,
} from "@shared/helix-live-source-analysis-job";
import {
  HELIX_LIVE_SOURCE_BACKPRESSURE_SCHEMA,
  type HelixLiveSourceBackpressure,
  type HelixLiveSourceBackpressurePolicy,
  type HelixLiveSourceBackpressureStatus,
} from "@shared/helix-live-source-backpressure";
import {
  HELIX_LIVE_SOURCE_BUFFER_STATUS_SCHEMA,
  type HelixLiveSourceBufferStatus,
} from "@shared/helix-live-source-buffer";
import {
  HELIX_LIVE_SOURCE_CHUNK_SCHEMA,
  type HelixLiveSourceChunk,
  type HelixLiveSourceChunkModality,
} from "@shared/helix-live-source-chunk";
import {
  HELIX_LIVE_SOURCE_PRODUCER_SCHEMA,
  type HelixLiveSourceCaptureMode,
  type HelixLiveSourceProducer,
  type HelixLiveSourceProducerStatus,
  type HelixLiveSourceRawContentPolicy,
} from "@shared/helix-live-source-producer";
import {
  HELIX_LIVE_SOURCE_RATE_POLICY_SCHEMA,
  type HelixLiveSourceRatePolicy,
} from "@shared/helix-live-source-rate-policy";
import { recordSituationSourceHeartbeat } from "./situation-source-capability-store";

const chunksBySource = new Map<string, HelixLiveSourceChunk[]>();
const producersBySource = new Map<string, HelixLiveSourceProducer>();
const analysisJobsByThread = new Map<string, HelixLiveSourceAnalysisJob[]>();
const sourceStats = new Map<string, {
  compactedChunkCount: number;
  droppedChunkCount: number;
  compactedSummary: string | null;
}>();

let maxChunksPerSource = 50;
const maxAnalysisJobsPerMinute = 120;

const nowIso = (): string => new Date().toISOString();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

export const normalizeLiveSourceModality = (value: unknown): HelixLiveSourceChunkModality => {
  if (
    value === "world_event" ||
    value === "visual_frame" ||
    value === "audio_transcript" ||
    value === "text_chat" ||
    value === "calculator_stream" ||
    value === "simulation_stream" ||
    value === "document_context" ||
    value === "note_context"
  ) return value;
  return "text_chat";
};

const normalizeCaptureMode = (value: unknown): HelixLiveSourceCaptureMode => {
  if (
    value === "manual" ||
    value === "interval" ||
    value === "salience_triggered" ||
    value === "push" ||
    value === "on_change"
  ) return value;
  return "push";
};

const normalizeProducerStatus = (value: unknown): HelixLiveSourceProducerStatus => {
  if (
    value === "permission_required" ||
    value === "active" ||
    value === "paused" ||
    value === "stale" ||
    value === "error" ||
    value === "stopped"
  ) return value;
  return "active";
};

const normalizeBackpressurePolicy = (value: unknown): HelixLiveSourceBackpressurePolicy => {
  if (
    value === "drop_oldest" ||
    value === "compact_window" ||
    value === "pause_source" ||
    value === "reject_retryable"
  ) return value;
  return "compact_window";
};

const normalizeRawPolicy = (value: unknown): HelixLiveSourceRawContentPolicy => {
  if (value === "debug_retained" || value === "profile_opt_in") return value;
  return "ephemeral";
};

const analyzerForModality = (modality: HelixLiveSourceChunkModality): string => {
  if (modality === "visual_frame") return "visual_analysis";
  if (modality === "audio_transcript") return "transcript_intent";
  if (modality === "world_event") return "world_sense";
  if (modality === "calculator_stream") return "calculator_stream_window";
  if (modality === "simulation_stream") return "simulation_stability_window";
  if (modality === "document_context") return "document_context_extraction";
  if (modality === "note_context") return "note_context_summary";
  return "text_chat_summary";
};

const producerId = (sourceId: string, threadId: string): string =>
  `live_source_producer:${hashShort([sourceId, threadId])}`;

const nextSequenceIndex = (sourceId: string): number => chunksBySource.get(sourceId)?.at(-1)?.sequence_index ?? -1;

const ensureStats = (sourceId: string) => {
  const existing = sourceStats.get(sourceId);
  if (existing) return existing;
  const stats = { compactedChunkCount: 0, droppedChunkCount: 0, compactedSummary: null as string | null };
  sourceStats.set(sourceId, stats);
  return stats;
};

export function upsertLiveSourceProducer(input: {
  sourceId: string;
  threadId: string;
  modality: HelixLiveSourceChunkModality;
  status?: HelixLiveSourceProducerStatus;
  cadenceMs?: number | null;
  captureMode?: HelixLiveSourceCaptureMode;
  latestChunkId?: string | null;
  backpressurePolicy?: HelixLiveSourceBackpressurePolicy;
  rawContentPolicy?: HelixLiveSourceRawContentPolicy;
  now?: string;
}): HelixLiveSourceProducer {
  const existing = producersBySource.get(input.sourceId);
  const now = input.now ?? nowIso();
  const cadenceMs = input.cadenceMs ?? existing?.cadence_ms ?? null;
  const producer: HelixLiveSourceProducer = {
    schema: HELIX_LIVE_SOURCE_PRODUCER_SCHEMA,
    producer_id: existing?.producer_id ?? producerId(input.sourceId, input.threadId),
    source_id: input.sourceId,
    thread_id: input.threadId,
    modality: input.modality,
    status: input.status ?? existing?.status ?? "active",
    cadence_ms: cadenceMs,
    capture_mode: input.captureMode ?? existing?.capture_mode ?? "push",
    latest_chunk_id: input.latestChunkId ?? existing?.latest_chunk_id ?? null,
    next_chunk_due_at: cadenceMs ? new Date(Date.parse(now) + cadenceMs).toISOString() : null,
    backpressure_policy: input.backpressurePolicy ?? existing?.backpressure_policy ?? "compact_window",
    raw_content_policy: input.rawContentPolicy ?? existing?.raw_content_policy ?? "ephemeral",
    assistant_answer: false,
  };
  producersBySource.set(input.sourceId, producer);
  recordSituationSourceHeartbeat({
    source_id: input.sourceId,
    thread_id: input.threadId,
    modality: input.modality,
    status: producer.status,
    ts: now,
  });
  return producer;
}

export function appendLiveSourceChunk(input: {
  source_id: string;
  thread_id: string;
  environment_id?: string | null;
  participant_id?: string | null;
  modality: HelixLiveSourceChunkModality;
  ts?: string | null;
  duration_ms?: number | null;
  compact_summary?: string | null;
  payload_ref?: string | null;
  evidence_refs?: string[];
  capture_mode?: HelixLiveSourceCaptureMode;
  backpressure_policy?: HelixLiveSourceBackpressurePolicy;
  raw_content_policy?: HelixLiveSourceRawContentPolicy;
}): { chunk: HelixLiveSourceChunk; producer: HelixLiveSourceProducer; buffer_status: HelixLiveSourceBufferStatus } {
  const ts = input.ts ?? nowIso();
  const chunk: HelixLiveSourceChunk = {
    schema: HELIX_LIVE_SOURCE_CHUNK_SCHEMA,
    chunk_id: `live_source_chunk:${hashShort([input.source_id, input.thread_id, input.modality, ts, nextSequenceIndex(input.source_id) + 1])}`,
    source_id: input.source_id,
    thread_id: input.thread_id,
    environment_id: input.environment_id ?? null,
    participant_id: input.participant_id ?? null,
    modality: input.modality,
    sequence_index: nextSequenceIndex(input.source_id) + 1,
    ts,
    duration_ms: input.duration_ms ?? null,
    compact_summary: input.compact_summary ?? null,
    payload_ref: input.payload_ref ?? null,
    evidence_refs: input.evidence_refs ?? [],
    raw_content_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const existing = chunksBySource.get(input.source_id) ?? [];
  let next = [...existing, chunk];
  if (next.length > maxChunksPerSource) {
    const overflow = next.slice(0, next.length - maxChunksPerSource);
    const stats = ensureStats(input.source_id);
    stats.compactedChunkCount += overflow.length;
    stats.compactedSummary = overflow
      .map((entry) => entry.compact_summary)
      .filter(Boolean)
      .slice(-5)
      .join(" | ") || stats.compactedSummary;
    next = next.slice(-maxChunksPerSource);
  }
  chunksBySource.set(input.source_id, next);
  const producer = upsertLiveSourceProducer({
    sourceId: input.source_id,
    threadId: input.thread_id,
    modality: input.modality,
    status: "active",
    latestChunkId: chunk.chunk_id,
    captureMode: input.capture_mode ?? "push",
    backpressurePolicy: input.backpressure_policy,
    rawContentPolicy: input.raw_content_policy,
    now: ts,
  });
  return {
    chunk,
    producer,
    buffer_status: getLiveSourceBufferStatus({ threadId: input.thread_id }),
  };
}

export function appendLiveSourceChunkFromBody(body: Record<string, unknown>) {
  const sourceId = cleanString(body.source_id) ?? `source:${normalizeLiveSourceModality(body.modality)}:${cleanString(body.thread_id) ?? "helix-ask:desktop"}`;
  const threadId = cleanString(body.thread_id) ?? "helix-ask:desktop";
  const modality = normalizeLiveSourceModality(body.modality);
  return appendLiveSourceChunk({
    source_id: sourceId,
    thread_id: threadId,
    environment_id: cleanString(body.environment_id),
    participant_id: cleanString(body.participant_id),
    modality,
    ts: cleanString(body.ts),
    duration_ms: typeof body.duration_ms === "number" ? body.duration_ms : null,
    compact_summary: cleanString(body.compact_summary) ?? cleanString(body.summary),
    payload_ref: cleanString(body.payload_ref) ?? cleanString(body.event_id) ?? cleanString(body.frame_id),
    evidence_refs: Array.isArray(body.evidence_refs) ? body.evidence_refs.map(String) : [],
    capture_mode: normalizeCaptureMode(body.capture_mode),
    backpressure_policy: normalizeBackpressurePolicy(body.backpressure_policy),
    raw_content_policy: normalizeRawPolicy(body.raw_content_policy),
  });
}

export function listLiveSourceChunks(input: {
  sourceId?: string | null;
  threadId?: string | null;
  modality?: HelixLiveSourceChunkModality | null;
  limit?: number;
} = {}): HelixLiveSourceChunk[] {
  const chunks = input.sourceId
    ? [...(chunksBySource.get(input.sourceId) ?? [])]
    : Array.from(chunksBySource.values()).flat();
  return chunks
    .filter((chunk) => !input.threadId || chunk.thread_id === input.threadId)
    .filter((chunk) => !input.modality || chunk.modality === input.modality)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts) || a.sequence_index - b.sequence_index)
    .slice(-(input.limit ?? 100));
}

export function getLatestLiveSourceChunk(input: {
  threadId: string;
  sourceIds?: string[];
  modality?: HelixLiveSourceChunkModality;
}): HelixLiveSourceChunk | null {
  const sourceSet = input.sourceIds?.length ? new Set(input.sourceIds) : null;
  return listLiveSourceChunks({ threadId: input.threadId, modality: input.modality ?? null, limit: 500 })
    .filter((chunk) => !sourceSet || sourceSet.has(chunk.source_id))
    .at(-1) ?? null;
}

export function getLiveSourceChunk(chunkId: string): HelixLiveSourceChunk | null {
  for (const chunks of chunksBySource.values()) {
    const match = chunks.find((chunk) => chunk.chunk_id === chunkId);
    if (match) return match;
  }
  return null;
}

const backpressureForSource = (
  sourceId: string,
  producer: HelixLiveSourceProducer,
  queueDepth: number,
  analysisDepth: number,
): HelixLiveSourceBackpressure => {
  const stats = ensureStats(sourceId);
  let status: HelixLiveSourceBackpressureStatus = "clear";
  if (producer.status === "paused") status = "paused";
  else if (stats.compactedChunkCount > 0) status = "compacting";
  else if (stats.droppedChunkCount > 0) status = "dropping_oldest";
  else if (queueDepth >= maxChunksPerSource) status = "retry_later";
  return {
    schema: HELIX_LIVE_SOURCE_BACKPRESSURE_SCHEMA,
    source_id: sourceId,
    thread_id: producer.thread_id,
    policy: producer.backpressure_policy,
    status,
    chunk_queue_depth: queueDepth,
    analysis_queue_depth: analysisDepth,
    dropped_chunk_count: stats.droppedChunkCount,
    compacted_chunk_count: stats.compactedChunkCount,
    retry_after_ms: status === "retry_later" ? producer.cadence_ms ?? 1_000 : null,
    reason: status === "clear" ? null : "Source chunk buffer is bounded; older chunks are compacted or retried.",
    assistant_answer: false,
    raw_content_included: false,
  };
};

export function getLiveSourceBufferStatus(input: { threadId: string }): HelixLiveSourceBufferStatus {
  const producers = Array.from(producersBySource.values()).filter((producer) => producer.thread_id === input.threadId);
  const jobs = listLiveSourceAnalysisJobs({ threadId: input.threadId, limit: 500 });
  const sources = producers.map((producer) => {
    const chunks = chunksBySource.get(producer.source_id) ?? [];
    const latest = chunks.at(-1);
    const analysisDepth = jobs.filter((job) => job.source_id === producer.source_id && (job.status === "queued" || job.status === "running")).length;
    const stats = ensureStats(producer.source_id);
    return {
      source_id: producer.source_id,
      thread_id: producer.thread_id,
      modality: producer.modality,
      chunk_count: chunks.length,
      latest_chunk_id: latest?.chunk_id ?? null,
      latest_chunk_ts: latest?.ts ?? null,
      compacted_summary: stats.compactedSummary,
      backpressure: backpressureForSource(producer.source_id, producer, chunks.length, analysisDepth),
      assistant_answer: false as const,
      raw_content_included: false as const,
    };
  });
  return {
    schema: HELIX_LIVE_SOURCE_BUFFER_STATUS_SCHEMA,
    thread_id: input.threadId,
    sources,
    total_chunk_count: sources.reduce((sum, entry) => sum + entry.chunk_count, 0),
    total_analysis_queue_depth: jobs.filter((job) => job.status === "queued" || job.status === "running").length,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function setLiveSourceRatePolicy(input: Record<string, unknown>): { producer: HelixLiveSourceProducer; rate_policy: HelixLiveSourceRatePolicy } {
  const sourceId = cleanString(input.source_id) ?? `source:${normalizeLiveSourceModality(input.modality)}:${cleanString(input.thread_id) ?? "helix-ask:desktop"}`;
  const threadId = cleanString(input.thread_id) ?? producersBySource.get(sourceId)?.thread_id ?? "helix-ask:desktop";
  const modality = normalizeLiveSourceModality(input.modality ?? producersBySource.get(sourceId)?.modality);
  const captureMode = normalizeCaptureMode(input.capture_mode ?? producersBySource.get(sourceId)?.capture_mode);
  const cadenceMs = typeof input.cadence_ms === "number" ? input.cadence_ms : producersBySource.get(sourceId)?.cadence_ms ?? null;
  const producer = upsertLiveSourceProducer({
    sourceId,
    threadId,
    modality,
    status: normalizeProducerStatus(input.status ?? producersBySource.get(sourceId)?.status ?? "active"),
    cadenceMs,
    captureMode,
    backpressurePolicy: normalizeBackpressurePolicy(input.backpressure_policy ?? producersBySource.get(sourceId)?.backpressure_policy),
    rawContentPolicy: normalizeRawPolicy(input.raw_content_policy ?? producersBySource.get(sourceId)?.raw_content_policy),
  });
  return {
    producer,
    rate_policy: {
      schema: HELIX_LIVE_SOURCE_RATE_POLICY_SCHEMA,
      source_id: sourceId,
      thread_id: threadId,
      modality,
      capture_mode: captureMode,
      cadence_ms: cadenceMs,
      max_chunks_per_source: maxChunksPerSource,
      max_analysis_jobs_per_minute: maxAnalysisJobsPerMinute,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
}

export function setLiveSourceProducerStatus(input: {
  sourceId: string;
  threadId?: string | null;
  status: HelixLiveSourceProducerStatus;
}): HelixLiveSourceProducer | null {
  const existing = producersBySource.get(input.sourceId);
  if (!existing && !input.threadId) return null;
  return upsertLiveSourceProducer({
    sourceId: input.sourceId,
    threadId: input.threadId ?? existing?.thread_id ?? "helix-ask:desktop",
    modality: existing?.modality ?? "text_chat",
    status: input.status,
    cadenceMs: existing?.cadence_ms ?? null,
    captureMode: existing?.capture_mode ?? "push",
    backpressurePolicy: existing?.backpressure_policy ?? "compact_window",
    rawContentPolicy: existing?.raw_content_policy ?? "ephemeral",
  });
}

export function queueLiveSourceAnalysisJob(input: {
  chunk: HelixLiveSourceChunk;
  workerId?: string | null;
  analyzerId?: string | null;
  status?: HelixLiveSourceAnalysisJobStatus;
  outputRefs?: string[];
  summary?: string;
}): HelixLiveSourceAnalysisJob {
  const now = nowIso();
  const job: HelixLiveSourceAnalysisJob = {
    schema: HELIX_LIVE_SOURCE_ANALYSIS_JOB_SCHEMA,
    job_id: `live_source_analysis_job:${hashShort([input.chunk.chunk_id, input.analyzerId ?? analyzerForModality(input.chunk.modality), input.workerId ?? "source", now])}`,
    chunk_id: input.chunk.chunk_id,
    worker_id: input.workerId ?? `source_worker:${input.chunk.modality}`,
    thread_id: input.chunk.thread_id,
    source_id: input.chunk.source_id,
    analyzer_id: input.analyzerId ?? analyzerForModality(input.chunk.modality),
    status: input.status ?? "queued",
    output_refs: input.outputRefs ?? [],
    summary: input.summary ?? "Live source analysis job queued from chunk traffic.",
    assistant_answer: false,
    raw_content_included: false,
  };
  const existing = analysisJobsByThread.get(job.thread_id) ?? [];
  analysisJobsByThread.set(job.thread_id, [...existing, job].slice(-500));
  return job;
}

export function completeLiveSourceAnalysisJobsForChunk(input: {
  chunkId: string;
  threadId: string;
  status: HelixLiveSourceAnalysisJobStatus;
  outputRefs?: string[];
  summary: string;
}): HelixLiveSourceAnalysisJob[] {
  const jobs = analysisJobsByThread.get(input.threadId) ?? [];
  const updated = jobs.map((job) => job.chunk_id === input.chunkId && (job.status === "queued" || job.status === "running")
    ? {
        ...job,
        status: input.status,
        output_refs: input.outputRefs ?? job.output_refs,
        summary: input.summary,
      }
    : job);
  analysisJobsByThread.set(input.threadId, updated);
  return updated.filter((job) => job.chunk_id === input.chunkId);
}

export function getLiveSourceAnalysisJob(jobId: string): HelixLiveSourceAnalysisJob | null {
  for (const jobs of analysisJobsByThread.values()) {
    const match = jobs.find((job) => job.job_id === jobId);
    if (match) return match;
  }
  return null;
}

export function updateLiveSourceAnalysisJob(input: {
  jobId: string;
  status: HelixLiveSourceAnalysisJobStatus;
  outputRefs?: string[];
  summary?: string;
}): HelixLiveSourceAnalysisJob | null {
  const existing = getLiveSourceAnalysisJob(input.jobId);
  if (!existing) return null;
  const jobs = analysisJobsByThread.get(existing.thread_id) ?? [];
  const updatedJob: HelixLiveSourceAnalysisJob = {
    ...existing,
    status: input.status,
    output_refs: input.outputRefs ?? existing.output_refs,
    summary: input.summary ?? existing.summary,
  };
  analysisJobsByThread.set(existing.thread_id, jobs.map((job) => job.job_id === input.jobId ? updatedJob : job));
  return updatedJob;
}

export function listLiveSourceAnalysisJobs(input: {
  threadId?: string | null;
  sourceId?: string | null;
  chunkId?: string | null;
  status?: HelixLiveSourceAnalysisJobStatus | "any" | null;
  limit?: number;
} = {}): HelixLiveSourceAnalysisJob[] {
  const entries = input.threadId
    ? [...(analysisJobsByThread.get(input.threadId) ?? [])]
    : Array.from(analysisJobsByThread.values()).flat();
  return entries
    .filter((job) => !input.sourceId || job.source_id === input.sourceId)
    .filter((job) => !input.chunkId || job.chunk_id === input.chunkId)
    .filter((job) => !input.status || input.status === "any" || job.status === input.status)
    .slice(-(input.limit ?? 100));
}

export function resetLiveSourceChunkBufferForTest(input: { maxChunks?: number } = {}): void {
  chunksBySource.clear();
  producersBySource.clear();
  analysisJobsByThread.clear();
  sourceStats.clear();
  maxChunksPerSource = input.maxChunks ?? 50;
}
