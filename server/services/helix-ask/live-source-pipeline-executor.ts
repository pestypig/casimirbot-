import crypto from "node:crypto";
import {
  HELIX_LIVE_SOURCE_PIPELINE_RECEIPT_SCHEMA,
  type HelixLiveSourcePipelineDashboard,
  type HelixLiveSourcePipelineReceipt,
  type HelixLiveSourcePipelineStatus,
} from "@shared/helix-live-source-pipeline-receipt";
import type { HelixLiveSourcePipelinePlan } from "@shared/helix-live-source-pipeline-plan";
import { createLiveAnswerEnvironment, getLiveAnswerEnvironment, setLiveAnswerEnvironmentStatus } from "../situation-room/live-answer-environment-store";
import { ensureDefaultLiveWorkerLanes, listLiveWorkerLanes } from "../situation-room/live-worker-lane-store";
import {
  getLiveSourceBufferStatus,
  listLiveSourceAnalysisJobs,
  listLiveSourceChunks,
  listLiveSourceProducers,
  setLiveSourceProducerStatus,
  setLiveSourceRatePolicy,
} from "../situation-room/live-source-chunk-buffer";
import { runDueLiveSourceAnalysisJobs } from "../situation-room/live-source-analysis-job-executor";
import { buildSituationSourceCapabilities } from "../situation-room/situation-source-capability-store";
import { projectPresentStateCard } from "../situation-room/present-state-card-projector";
import { getVisionProviderHealth } from "../vision/provider";
import { pipelineLinesToLiveAnswerSchema } from "./live-source-pipeline-composer";

const plansById = new Map<string, HelixLiveSourcePipelinePlan>();
const receiptsByPipelineId = new Map<string, HelixLiveSourcePipelineReceipt>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const pipelineIdFor = (plan: HelixLiveSourcePipelinePlan): string =>
  `live_source_pipeline:${hashShort([plan.thread_id, plan.plan_id, plan.objective])}`;

const receiptFor = (input: {
  plan: HelixLiveSourcePipelinePlan;
  environmentId?: string | null;
  status: HelixLiveSourcePipelineStatus;
  producerIds?: string[];
  analysisJobIds?: string[];
  workerLaneIds?: string[];
  missingCapabilities?: string[];
  nextRepairActions?: string[];
  ok?: boolean;
}): HelixLiveSourcePipelineReceipt => {
  const pipelineId = pipelineIdFor(input.plan);
  return {
    schema: HELIX_LIVE_SOURCE_PIPELINE_RECEIPT_SCHEMA,
    receipt_id: `live_source_pipeline_receipt:${hashShort([pipelineId, input.status, Date.now()])}`,
    pipeline_id: pipelineId,
    plan_id: input.plan.plan_id,
    thread_id: input.plan.thread_id,
    environment_id: input.environmentId ?? input.plan.environment_id ?? null,
    status: input.status,
    source_producer_ids: input.producerIds ?? [],
    analysis_job_ids: input.analysisJobIds ?? [],
    worker_lane_ids: input.workerLaneIds ?? [],
    missing_capabilities: input.missingCapabilities ?? input.plan.missing_capabilities,
    next_repair_actions: input.nextRepairActions ?? [],
    ok: input.ok ?? input.status !== "error",
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
};

export function saveLiveSourcePipelinePlan(plan: HelixLiveSourcePipelinePlan): HelixLiveSourcePipelineReceipt {
  plansById.set(plan.plan_id, plan);
  const receipt = receiptFor({
    plan,
    status: "planned",
    missingCapabilities: plan.missing_capabilities,
    nextRepairActions: plan.missing_capabilities,
  });
  receiptsByPipelineId.set(receipt.pipeline_id, receipt);
  return receipt;
}

export function executeLiveSourcePipelinePlan(plan: HelixLiveSourcePipelinePlan): {
  plan: HelixLiveSourcePipelinePlan;
  receipt: HelixLiveSourcePipelineReceipt;
  environment: ReturnType<typeof getLiveAnswerEnvironment>;
} {
  plansById.set(plan.plan_id, plan);
  const created = plan.environment_id
    ? { environment: getLiveAnswerEnvironment(plan.environment_id), receipt: null }
    : createLiveAnswerEnvironment({
        thread_id: plan.thread_id,
        created_turn_id: `turn:${plan.plan_id}`,
        objective: plan.objective,
        preset: "custom",
        line_schema: pipelineLinesToLiveAnswerSchema(plan.live_card_schema),
        source_ids: plan.producers.map((producer) => producer.source_id),
      });
  const environment = created.environment;
  const producers = plan.producers.map((producer) => setLiveSourceRatePolicy({
    source_id: producer.source_id,
    thread_id: plan.thread_id,
    modality: producer.modality,
    capture_mode: producer.capture_mode,
    cadence_ms: producer.cadence_ms ?? null,
    status: producer.permission_required ? "permission_required" : "active",
  }).producer);
  const lanes = environment ? ensureDefaultLiveWorkerLanes(environment) : [];
  const jobs = listLiveSourceAnalysisJobs({ threadId: plan.thread_id, limit: 200 })
    .filter((job) => plan.producers.some((producer) => producer.source_id === job.source_id));
  const receipt = receiptFor({
    plan: {
      ...plan,
      environment_id: environment?.environment_id ?? plan.environment_id ?? null,
    },
    environmentId: environment?.environment_id ?? null,
    status: "active",
    producerIds: producers.map((producer) => producer.producer_id),
    analysisJobIds: jobs.map((job) => job.job_id),
    workerLaneIds: lanes.map((lane) => lane.worker_id),
    missingCapabilities: plan.missing_capabilities,
    nextRepairActions: buildLiveSourcePipelineRepairActions(plan),
  });
  receiptsByPipelineId.set(receipt.pipeline_id, receipt);
  plansById.set(plan.plan_id, {
    ...plan,
    environment_id: environment?.environment_id ?? plan.environment_id ?? null,
  });
  return { plan: plansById.get(plan.plan_id) ?? plan, receipt, environment };
}

export function getLiveSourcePipelinePlan(planId: string): HelixLiveSourcePipelinePlan | null {
  return plansById.get(planId) ?? null;
}

export function getLiveSourcePipelineReceipt(pipelineId: string): HelixLiveSourcePipelineReceipt | null {
  return receiptsByPipelineId.get(pipelineId) ?? null;
}

export function listLiveSourcePipelineReceipts(): HelixLiveSourcePipelineReceipt[] {
  return Array.from(receiptsByPipelineId.values());
}

export function buildLiveSourcePipelineRepairActions(plan: HelixLiveSourcePipelinePlan): string[] {
  const actions = new Set<string>();
  for (const missing of plan.missing_capabilities) actions.add(missing);
  const capabilities = buildSituationSourceCapabilities({ threadId: plan.thread_id });
  const provider = getVisionProviderHealth();
  for (const producer of plan.producers) {
    const capability = capabilities.find((entry) => entry.source_id === producer.source_id || entry.modality === producer.modality);
    if (producer.modality === "visual_frame" && producer.permission_required) actions.add("grant_visual_capture_permission");
    if (producer.modality === "visual_frame" && !provider.configured) actions.add("configure_vision_provider");
    if (producer.modality === "visual_frame" && capability?.status === "stale") actions.add("capture_frame_now");
    if (producer.modality === "world_event" && (!capability || capability.status === "configured_missing")) actions.add("attach_world_event_source");
    if (producer.modality === "audio_transcript" && (!capability || capability.status === "configured_missing")) actions.add("attach_audio_or_transcript_source");
  }
  const buffer = getLiveSourceBufferStatus({ threadId: plan.thread_id });
  if (buffer.total_analysis_queue_depth > 0) actions.add("run_due_analysis");
  if (buffer.sources.some((source) => source.backpressure.status === "retry_later" || source.backpressure.status === "compacting")) {
    actions.add("wait_or_reduce_rate");
  }
  return Array.from(actions);
}

export function inspectLiveSourcePipeline(input: {
  pipelineId?: string | null;
  planId?: string | null;
}): HelixLiveSourcePipelineDashboard | null {
  const receipt = input.pipelineId
    ? receiptsByPipelineId.get(input.pipelineId) ?? null
    : Array.from(receiptsByPipelineId.values()).find((entry) => entry.plan_id === input.planId) ?? null;
  if (!receipt) return null;
  const plan = plansById.get(receipt.plan_id);
  if (!plan) return null;
  const sourceIds = plan.producers.map((producer) => producer.source_id);
  const nextRepairActions = buildLiveSourcePipelineRepairActions(plan);
  return {
    schema: "helix.live_source_pipeline_dashboard.v1",
    pipeline_id: receipt.pipeline_id,
    plan,
    receipt: {
      ...receipt,
      next_repair_actions: nextRepairActions,
    },
    producers: listLiveSourceProducers({ threadId: plan.thread_id, sourceIds }),
    chunks: listLiveSourceChunks({ threadId: plan.thread_id, limit: 200 }).filter((chunk) => sourceIds.includes(chunk.source_id)),
    analysis_jobs: listLiveSourceAnalysisJobs({ threadId: plan.thread_id, limit: 200 }).filter((job) => sourceIds.includes(job.source_id)),
    worker_lanes: listLiveWorkerLanes({ threadId: plan.thread_id, environmentId: plan.environment_id ?? receipt.environment_id ?? null, status: "any" }),
    buffer_status: getLiveSourceBufferStatus({ threadId: plan.thread_id }),
    source_capabilities: buildSituationSourceCapabilities({ threadId: plan.thread_id }),
    live_card: projectPresentStateCard({ threadId: plan.thread_id }),
    missing_capabilities: plan.missing_capabilities,
    next_repair_actions: nextRepairActions,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function repairLiveSourcePipeline(pipelineId: string): {
  receipt: HelixLiveSourcePipelineReceipt | null;
  actions: string[];
  executions: ReturnType<typeof runDueLiveSourceAnalysisJobs>;
} {
  const dashboard = inspectLiveSourcePipeline({ pipelineId });
  if (!dashboard) return { receipt: null, actions: [], executions: [] };
  const plan = dashboard.plan;
  const actions = buildLiveSourcePipelineRepairActions(plan);
  const executions = actions.includes("run_due_analysis")
    ? runDueLiveSourceAnalysisJobs({ threadId: plan.thread_id })
    : [];
  const receipt = receiptFor({
    plan,
    environmentId: dashboard.receipt.environment_id ?? null,
    status: dashboard.receipt.status,
    producerIds: dashboard.receipt.source_producer_ids,
    analysisJobIds: [
      ...dashboard.receipt.analysis_job_ids,
      ...executions.map((entry) => entry.job?.job_id).filter((entry): entry is string => Boolean(entry)),
    ],
    workerLaneIds: dashboard.receipt.worker_lane_ids,
    missingCapabilities: dashboard.missing_capabilities,
    nextRepairActions: actions,
  });
  receiptsByPipelineId.set(receipt.pipeline_id, receipt);
  return { receipt, actions, executions };
}

export function setLiveSourcePipelineStatus(pipelineId: string, status: HelixLiveSourcePipelineStatus): HelixLiveSourcePipelineReceipt | null {
  const receipt = receiptsByPipelineId.get(pipelineId);
  if (!receipt) return null;
  const plan = plansById.get(receipt.plan_id);
  if (plan?.environment_id && (status === "paused" || status === "stopped")) {
    setLiveAnswerEnvironmentStatus({
      environment_id: plan.environment_id,
      status: status === "paused" ? "paused" : "completed",
    });
  }
  for (const producer of plan?.producers ?? []) {
    setLiveSourceProducerStatus({
      sourceId: producer.source_id,
      threadId: plan?.thread_id,
      status: status === "paused" ? "paused" : status === "stopped" || status === "archived" ? "stopped" : "active",
    });
  }
  const next = receiptFor({
    plan: plan ?? {
      schema: "helix.live_source_pipeline_plan.v1",
      plan_id: receipt.plan_id,
      thread_id: receipt.thread_id,
      objective: "Unknown live-source pipeline",
      requested_modalities: [],
      producers: [],
      analyzers: [],
      live_card_schema: [],
      missing_capabilities: receipt.missing_capabilities,
      assistant_answer: false,
      raw_content_included: false,
    },
    environmentId: receipt.environment_id ?? null,
    status,
    producerIds: receipt.source_producer_ids,
    analysisJobIds: receipt.analysis_job_ids,
    workerLaneIds: receipt.worker_lane_ids,
    missingCapabilities: receipt.missing_capabilities,
    nextRepairActions: status === "archived" || status === "stopped" ? [] : receipt.next_repair_actions,
  });
  receiptsByPipelineId.set(pipelineId, next);
  return next;
}

export function resetLiveSourcePipelinesForTest(): void {
  plansById.clear();
  receiptsByPipelineId.clear();
}
