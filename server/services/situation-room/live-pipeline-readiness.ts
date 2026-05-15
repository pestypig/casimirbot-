import {
  HELIX_LIVE_PIPELINE_READINESS_SCHEMA,
  type HelixLivePipelineReadiness,
  type HelixLivePipelineReadinessState,
} from "@shared/helix-live-pipeline-readiness";
import type { HelixLiveSourcePipelinePlan } from "@shared/helix-live-source-pipeline-plan";
import type { HelixLiveSourcePipelineProducerPlan } from "@shared/helix-live-source-pipeline-plan";
import type { HelixLiveSourcePipelineReceipt } from "@shared/helix-live-source-pipeline-receipt";
import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import { getLiveAnswerEnvironment } from "./live-answer-environment-store";
import { listLivePipelineLifecycleEvents } from "./live-pipeline-lifecycle-store";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function calculateLivePipelineReadiness(input: {
  plan: HelixLiveSourcePipelinePlan;
  receipt: HelixLiveSourcePipelineReceipt;
  producers: HelixLiveSourceProducer[];
  chunks: HelixLiveSourceChunk[];
  analysisJobs: HelixLiveSourceAnalysisJob[];
  repairActions: string[];
  missingCapabilities: string[];
  now?: string;
}): HelixLivePipelineReadiness {
  const now = input.now ?? new Date().toISOString();
  const lifecycle = listLivePipelineLifecycleEvents({
    pipelineId: input.receipt.pipeline_id,
    limit: 200,
  });
  const sourceHealth = input.plan.producers.map((planned: HelixLiveSourcePipelineProducerPlan) => {
    const producer = input.producers.find((entry: HelixLiveSourceProducer) => entry.source_id === planned.source_id) ?? null;
    const sourceChunks = input.chunks.filter((chunk: HelixLiveSourceChunk) => chunk.source_id === planned.source_id);
    const sourceJobs = input.analysisJobs.filter((job: HelixLiveSourceAnalysisJob) => job.source_id === planned.source_id);
    const latestJob = sourceJobs.at(-1) ?? null;
    return {
      source_id: planned.source_id,
      modality: planned.modality,
      status: producer?.status ?? (planned.permission_required ? "permission_required" : "configured_missing"),
      latest_chunk_id: sourceChunks.at(-1)?.chunk_id ?? null,
      latest_analysis_job_id: latestJob?.job_id ?? null,
      latest_evidence_ref: latestJob?.output_refs.at(-1) ?? null,
    };
  });
  const requiredProducers = input.plan.producers.filter((producer: HelixLiveSourcePipelineProducerPlan) =>
    producer.modality === "visual_frame" ||
    (producer.modality === "audio_transcript" && input.missingCapabilities.includes("attach_audio_or_transcript_source"))
  );
  const permissionMissing = requiredProducers.some((producer: HelixLiveSourcePipelineProducerPlan) =>
    sourceHealth.find((entry: { source_id: string; status: string }) => entry.source_id === producer.source_id)?.status === "permission_required"
  );
  const hasAnyChunk = sourceHealth.some((entry: { latest_chunk_id?: string | null }) => Boolean(entry.latest_chunk_id));
  const hasQueuedOrRunning = input.analysisJobs.some((job: HelixLiveSourceAnalysisJob) => job.status === "queued" || job.status === "running");
  const hasCompleted = input.analysisJobs.some((job: HelixLiveSourceAnalysisJob) => job.status === "completed" && job.output_refs.length > 0);
  const hasFailed = input.analysisJobs.some((job: HelixLiveSourceAnalysisJob) => job.status === "failed");
  const environment = input.receipt.environment_id ? getLiveAnswerEnvironment(input.receipt.environment_id) : null;
  const hasCardUpdate = Boolean(environment?.evidence_refs?.some((ref: string) =>
    /\b(?:synthetic_evidence|visual_evidence|live_source_analysis_job|live_source_chunk)\b/i.test(ref)
  ));
  let state: HelixLivePipelineReadinessState = "not_started";
  if (input.receipt.status === "error") state = "error";
  else if (permissionMissing) state = "waiting_for_permission";
  else if (!hasAnyChunk) state = "waiting_for_first_chunk";
  else if (hasQueuedOrRunning) state = "analyzing";
  else if (hasCompleted && hasCardUpdate) state = input.missingCapabilities.length > 0 ? "degraded" : "ready";
  else if (hasCompleted) state = "ready";
  else if (hasFailed && input.repairActions.includes("configure_vision_provider")) state = "blocked";
  else if (hasFailed) state = "degraded";
  const score = clamp01(
    (input.producers.length > 0 ? 0.2 : 0) +
    (permissionMissing ? 0 : 0.15) +
    (hasAnyChunk ? 0.2 : 0) +
    (hasQueuedOrRunning ? 0.1 : 0) +
    (hasCompleted ? 0.25 : 0) +
    (hasCardUpdate ? 0.2 : 0) -
    (state === "blocked" ? 0.35 : 0) -
    (input.missingCapabilities.length > 0 ? 0.1 : 0),
  );
  return {
    schema: HELIX_LIVE_PIPELINE_READINESS_SCHEMA,
    pipeline_id: input.receipt.pipeline_id,
    thread_id: input.plan.thread_id,
    environment_id: input.receipt.environment_id ?? input.plan.environment_id ?? null,
    state,
    score,
    summary:
      state === "ready"
        ? "Pipeline has active source traffic, completed analysis, and a projected card update."
        : state === "degraded"
          ? "Pipeline is usable with partial sources or missing optional capabilities."
          : state === "blocked"
            ? "Pipeline is blocked by a required provider or source failure."
            : state === "waiting_for_permission"
              ? "Pipeline is waiting for explicit source permission."
              : state === "waiting_for_first_chunk"
                ? "Pipeline is active and waiting for the first source chunk."
                : state === "analyzing"
                  ? "Pipeline has source chunks and queued/running analysis."
                  : "Pipeline has not started source traffic yet.",
    source_health: sourceHealth,
    missing_capabilities: input.missingCapabilities,
    repair_actions: input.repairActions,
    latest_lifecycle_event: lifecycle.at(-1) ?? null,
    lifecycle_event_count: lifecycle.length,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
}
