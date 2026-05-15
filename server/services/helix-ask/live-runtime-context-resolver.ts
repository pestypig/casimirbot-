import type { HelixSituationSourceCapability } from "@shared/helix-situation-source-capability";
import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import type { HelixLiveSourcePipelinePlan } from "@shared/helix-live-source-pipeline-plan";
import type { HelixLiveSourcePipelineReceipt } from "@shared/helix-live-source-pipeline-receipt";
import {
  buildSituationSourceCapabilities,
} from "../situation-room/situation-source-capability-store";
import {
  getLatestLiveSourceChunk,
  listLiveSourceAnalysisJobs,
  listLiveSourceProducers,
} from "../situation-room/live-source-chunk-buffer";
import {
  inspectLiveSourcePipeline,
  listLiveSourcePipelineReceipts,
} from "./live-source-pipeline-executor";

export type HelixLiveRuntimeSuggestedAction =
  | "compose_pipeline"
  | "inspect_pipeline"
  | "repair_pipeline"
  | "run_due_analysis"
  | "capture_frame_now"
  | "request_visual_permission"
  | "set_rate_policy";

export type HelixLiveRuntimeContext = {
  schema: "helix.live_runtime_context.v1";
  thread_id: string;
  active_visual_source: boolean;
  visual_status:
    | "active"
    | "stale"
    | "permission_required"
    | "configured_missing"
    | "error"
    | "paused"
    | "stopped"
    | "unknown";
  latest_frame_status:
    | "analysis_ready"
    | "frame_captured"
    | "analysis_failed"
    | "waiting_for_first_chunk"
    | "permission_required"
    | "no_source";
  active_pipeline_id?: string | null;
  active_environment_id?: string | null;
  active_visual_source_id?: string | null;
  suggested_action: HelixLiveRuntimeSuggestedAction;
  source_capability_refs: string[];
  analysis_job_refs: string[];
  producer_refs: string[];
  readiness_state?: string | null;
  readiness_score?: number | null;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};

const preferredVisualCapability = (capabilities: HelixSituationSourceCapability[]): HelixSituationSourceCapability | null => {
  const visual = capabilities.filter((entry) => entry.modality === "visual_frame");
  return (
    visual.find((entry: HelixSituationSourceCapability) => entry.status === "active") ??
    visual.find((entry: HelixSituationSourceCapability) => entry.status === "stale") ??
    visual.find((entry: HelixSituationSourceCapability) => entry.status === "permission_required") ??
    visual.find((entry: HelixSituationSourceCapability) => entry.status !== "configured_missing") ??
    visual[0] ??
    null
  );
};

export function resolveLiveRuntimeContext(input: { threadId: string }): HelixLiveRuntimeContext {
  const capabilities = buildSituationSourceCapabilities({ threadId: input.threadId });
  const visualCapability = preferredVisualCapability(capabilities);
  const producers = listLiveSourceProducers({ threadId: input.threadId }) as HelixLiveSourceProducer[];
  const visualProducer = producers.find((producer: HelixLiveSourceProducer) => producer.modality === "visual_frame") ?? null;
  const receipts = listLiveSourcePipelineReceipts()
    .filter((receipt: HelixLiveSourcePipelineReceipt) => receipt.thread_id === input.threadId)
    .filter((receipt: HelixLiveSourcePipelineReceipt) => receipt.status !== "archived" && receipt.status !== "stopped");
  const receipt = receipts.at(-1) ?? null;
  const dashboard = receipt ? inspectLiveSourcePipeline({ pipelineId: receipt.pipeline_id }) : null;
  const latestVisualChunk = getLatestLiveSourceChunk({
    threadId: input.threadId,
    sourceIds: visualCapability?.source_id ? [visualCapability.source_id] : undefined,
    modality: "visual_frame",
  }) ?? getLatestLiveSourceChunk({ threadId: input.threadId, modality: "visual_frame" });
  const visualJobs = listLiveSourceAnalysisJobs({
    threadId: input.threadId,
    sourceId: visualCapability?.source_id ?? visualProducer?.source_id ?? null,
    limit: 50,
    status: "any",
  }) as HelixLiveSourceAnalysisJob[];
  const visualAnalysisJobs = visualJobs.filter((job: HelixLiveSourceAnalysisJob) =>
    job.analyzer_id.includes("visual") || job.analyzer_id.includes("analysis")
  );
  const latestVisualJob = visualAnalysisJobs.at(-1) ?? null;

  const visualStatus = visualCapability?.status ?? visualProducer?.status ?? "unknown";
  const activeVisualSource =
    visualStatus === "active" ||
    visualStatus === "stale" ||
    visualStatus === "permission_required" ||
    Boolean(visualProducer);
  const latestFrameStatus: HelixLiveRuntimeContext["latest_frame_status"] =
    visualStatus === "permission_required"
      ? "permission_required"
      : !activeVisualSource || visualStatus === "configured_missing"
        ? "no_source"
        : latestVisualJob?.status === "completed"
          ? "analysis_ready"
          : latestVisualJob?.status === "failed"
            ? "analysis_failed"
            : latestVisualChunk
              ? "frame_captured"
              : "waiting_for_first_chunk";
  const queuedAnalysis = visualAnalysisJobs.some((job: HelixLiveSourceAnalysisJob) => job.status === "queued" || job.status === "running");
  const readinessState = dashboard?.readiness?.state ?? null;
  const suggestedAction: HelixLiveRuntimeSuggestedAction =
    visualStatus === "permission_required" || latestFrameStatus === "permission_required"
      ? "request_visual_permission"
      : !receipt
        ? "compose_pipeline"
        : queuedAnalysis || latestFrameStatus === "frame_captured"
          ? "run_due_analysis"
          : readinessState === "blocked" || readinessState === "degraded" || latestFrameStatus === "analysis_failed"
            ? "repair_pipeline"
            : latestFrameStatus === "waiting_for_first_chunk"
              ? "capture_frame_now"
              : "inspect_pipeline";

  return {
    schema: "helix.live_runtime_context.v1",
    thread_id: input.threadId,
    active_visual_source: activeVisualSource,
    visual_status: visualStatus as HelixLiveRuntimeContext["visual_status"],
    latest_frame_status: latestFrameStatus,
    active_pipeline_id: receipt?.pipeline_id ?? null,
    active_environment_id: receipt?.environment_id ?? null,
    active_visual_source_id: visualCapability?.source_id ?? visualProducer?.source_id ?? null,
    suggested_action: suggestedAction,
    source_capability_refs: capabilities.map((entry: HelixSituationSourceCapability) => entry.source_id),
    analysis_job_refs: visualAnalysisJobs.map((job: HelixLiveSourceAnalysisJob) => job.job_id),
    producer_refs: producers.map((producer: HelixLiveSourceProducer) => producer.producer_id),
    readiness_state: readinessState,
    readiness_score: dashboard?.readiness?.score ?? null,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function bindActiveVisualSourceToPipelinePlan(input: {
  plan: HelixLiveSourcePipelinePlan;
  runtime: HelixLiveRuntimeContext;
}): HelixLiveSourcePipelinePlan {
  if (!input.runtime.active_visual_source_id) return input.plan;
  const visualNeedsPermission =
    input.runtime.visual_status === "permission_required" ||
    input.runtime.visual_status === "configured_missing" ||
    input.runtime.visual_status === "unknown";
  return {
    ...input.plan,
    producers: input.plan.producers.map((producer: HelixLiveSourcePipelinePlan["producers"][number]) =>
      producer.modality === "visual_frame"
        ? {
            ...producer,
            source_id: input.runtime.active_visual_source_id!,
            permission_required: visualNeedsPermission,
          }
        : producer,
    ),
    missing_capabilities: visualNeedsPermission
      ? input.plan.missing_capabilities
      : input.plan.missing_capabilities.filter((entry: string) => entry !== "grant_visual_capture_permission"),
  };
}
