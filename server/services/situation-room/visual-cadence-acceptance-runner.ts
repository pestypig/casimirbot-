import {
  HELIX_VISUAL_CADENCE_ACCEPTANCE_RESULT_SCHEMA,
  type HelixVisualCadenceAcceptanceCheck,
  type HelixVisualCadenceAcceptanceResult,
} from "@shared/helix-visual-cadence-acceptance";
import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import {
  listLiveSourceAnalysisJobs,
  listLiveSourceChunks,
  listLiveSourceProducers,
} from "./live-source-chunk-buffer";
import { getLiveSourceProducerBinding } from "./live-source-producer-binding";
import { readLiveSourceProducerFreshness } from "./live-source-producer-freshness";
import { findLatestClientCapabilityAdoption } from "../client-capabilities/client-adoption-store";

const check = (input: HelixVisualCadenceAcceptanceCheck): HelixVisualCadenceAcceptanceCheck => input;

export function runVisualCadenceAcceptance(input: {
  producerId: string;
}): HelixVisualCadenceAcceptanceResult | null {
  const producer = listLiveSourceProducers()
    .find((entry: { producer_id: string; source_id: string }) => entry.producer_id === input.producerId || entry.source_id === input.producerId) ?? null;
  if (!producer) return null;
  const binding = getLiveSourceProducerBinding(producer.source_id);
  const chunks = listLiveSourceChunks({
    sourceId: producer.source_id,
    threadId: producer.thread_id,
    modality: "visual_frame",
    limit: 20,
  });
  const jobs = listLiveSourceAnalysisJobs({
    threadId: producer.thread_id,
    sourceId: producer.source_id,
    limit: 50,
  });
  const latestChunk = chunks.at(-1) as HelixLiveSourceChunk | null;
  const latestJob = jobs.at(-1) as HelixLiveSourceAnalysisJob | null;
  const freshness = readLiveSourceProducerFreshness({ producerId: producer.producer_id });
  const clientAdoption = findLatestClientCapabilityAdoption({
    threadId: producer.thread_id,
    sourceId: producer.source_id,
    producerId: producer.producer_id,
  }) ?? findLatestClientCapabilityAdoption({
    threadId: producer.thread_id,
    sourceId: producer.source_id,
  });
  const chunkSequencesIncrease =
    chunks.length >= 2 &&
    chunks.at(-2)!.sequence_index < chunks.at(-1)!.sequence_index;
  const latestChunkJobs = latestChunk
    ? jobs.filter((job: HelixLiveSourceAnalysisJob) => job.chunk_id === latestChunk.chunk_id)
    : [];
  const latestChunkJob = latestChunkJobs.at(-1) ?? null;
  const checks: HelixVisualCadenceAcceptanceCheck[] = [
    check({
      name: "producer_bound",
      ok: Boolean(binding?.environment_id || binding?.pipeline_id),
      summary: binding ? `Producer binding is ${binding.status}.` : "No producer binding exists.",
      related_ids: [binding?.binding_id, binding?.environment_id, binding?.pipeline_id].filter(Boolean) as string[],
    }),
    check({
      name: "cadence_set",
      ok: producer.capture_mode === "interval" && typeof producer.cadence_ms === "number" && producer.cadence_ms >= 5_000,
      summary: producer.cadence_ms ? `Cadence is ${producer.cadence_ms}ms.` : "No interval cadence is set.",
      related_ids: [producer.producer_id],
    }),
    check({
      name: "client_stream_confirmed_or_required",
      ok: producer.status === "active" || producer.status === "permission_required" || producer.status === "waiting_for_client",
      summary: `Producer status is ${producer.status}.`,
      related_ids: [producer.producer_id],
    }),
    check({
      name: "client_adoption_proven",
      ok: Boolean(clientAdoption?.ok || freshness?.client_adoption_ok),
      summary: clientAdoption
        ? `Client adoption ${clientAdoption.ok ? "succeeded" : "failed"}.`
        : freshness?.client_adoption_status
          ? `Client adoption status is ${freshness.client_adoption_status}.`
          : "No client adoption receipt exists for this producer.",
      related_ids: [clientAdoption?.adoption_id, freshness?.client_adoption_id].filter(Boolean) as string[],
    }),
    check({
      name: "two_increasing_chunks",
      ok: chunkSequencesIncrease,
      summary: chunkSequencesIncrease ? "At least two visual chunks were posted with increasing sequence indexes." : `Only ${chunks.length} visual chunk(s) are available.`,
      related_ids: chunks.slice(-2).map((chunk: HelixLiveSourceChunk) => chunk.chunk_id),
    }),
    check({
      name: "latest_chunk_has_analysis_job",
      ok: Boolean(latestChunkJob),
      summary: latestChunkJob ? `Latest chunk has analysis job ${latestChunkJob.job_id}.` : "Latest chunk has no analysis job.",
      related_ids: [latestChunk?.chunk_id, latestChunkJob?.job_id].filter(Boolean) as string[],
    }),
    check({
      name: "latest_job_has_output_or_failure",
      ok: Boolean(latestChunkJob && (latestChunkJob.output_refs.length > 0 || latestChunkJob.status === "failed")),
      summary: latestChunkJob
        ? `Latest job status is ${latestChunkJob.status}; outputs=${latestChunkJob.output_refs.length}.`
        : "No latest job was found.",
      related_ids: [latestChunkJob?.job_id, ...(latestChunkJob?.output_refs ?? [])].filter(Boolean) as string[],
    }),
    check({
      name: "freshness_visible",
      ok: Boolean(freshness && (freshness.is_fresh || freshness.next_required_action)),
      summary: freshness
        ? freshness.is_fresh
          ? "Freshness check reports producer fresh."
          : `Freshness reports ${freshness.stale_reason}; next ${freshness.next_required_action}.`
        : "Freshness record missing.",
      related_ids: [freshness?.last_chunk_id, freshness?.last_analysis_job_id, freshness?.last_visual_evidence_id].filter(Boolean) as string[],
    }),
    check({
      name: "poison_audit_boundary",
      ok: true,
      summary: "Producer acceptance checks are validation only and do not create assistant answers.",
      related_ids: [producer.producer_id],
    }),
  ];
  const ok = checks.every((entry: HelixVisualCadenceAcceptanceCheck) => entry.ok);
  const firstFailed = checks.find((entry: HelixVisualCadenceAcceptanceCheck) => !entry.ok);
  return {
    schema: HELIX_VISUAL_CADENCE_ACCEPTANCE_RESULT_SCHEMA,
    producer_id: producer.producer_id,
    ok,
    checks,
    next_required_action: ok
      ? null
      : firstFailed?.name === "two_increasing_chunks"
        ? "wait_for_next_interval_or_capture_now"
        : firstFailed?.name === "client_adoption_proven"
          ? "client_adopt_visual_producer"
        : firstFailed?.name === "latest_chunk_has_analysis_job"
          ? "run_due_analysis"
          : freshness?.next_required_action ?? "inspect_pipeline",
    assistant_answer: false,
  };
}
