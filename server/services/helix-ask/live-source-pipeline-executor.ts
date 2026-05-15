import crypto from "node:crypto";
import {
  HELIX_LIVE_SOURCE_PIPELINE_RECEIPT_SCHEMA,
  type HelixLiveSourcePipelineDashboard,
  type HelixLiveSourcePipelineReceipt,
  type HelixLiveSourcePipelineStatus,
} from "@shared/helix-live-source-pipeline-receipt";
import type { HelixLiveSourcePipelinePlan } from "@shared/helix-live-source-pipeline-plan";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
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
import { recordLivePipelineLifecycleEvent, listLivePipelineLifecycleEvents } from "../situation-room/live-pipeline-lifecycle-store";
import { calculateLivePipelineReadiness } from "../situation-room/live-pipeline-readiness";

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
  recordLivePipelineLifecycleEvent({
    pipelineId: receipt.pipeline_id,
    threadId: plan.thread_id,
    environmentId: receipt.environment_id ?? null,
    kind: "pipeline_planned",
    status: "planned",
    summary: `Pipeline planned for: ${plan.objective}`,
    relatedIds: [plan.plan_id],
  });
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
        source_ids: plan.producers.map((producer: HelixLiveSourcePipelinePlan["producers"][number]) => producer.source_id),
      });
  const environment = created.environment;
  const producers = plan.producers.map((producer: HelixLiveSourcePipelinePlan["producers"][number]) => setLiveSourceRatePolicy({
    source_id: producer.source_id,
    thread_id: plan.thread_id,
    modality: producer.modality,
    capture_mode: producer.capture_mode,
    cadence_ms: producer.cadence_ms ?? null,
    status: producer.permission_required ? "permission_required" : "active",
  }).producer);
  for (const producer of producers) {
    recordLivePipelineLifecycleEvent({
      pipelineId: pipelineIdFor(plan),
      threadId: plan.thread_id,
      environmentId: environment?.environment_id ?? null,
      kind: "producer_created",
      status: producer.status === "permission_required" ? "blocked" : "running",
      summary: `${producer.modality} producer ${producer.source_id} is ${producer.status}.`,
      relatedIds: [producer.producer_id, producer.source_id],
    });
    recordLivePipelineLifecycleEvent({
      pipelineId: pipelineIdFor(plan),
      threadId: plan.thread_id,
      environmentId: environment?.environment_id ?? null,
      kind: "rate_policy_set",
      status: "completed",
      summary: `${producer.modality} rate policy set to ${producer.capture_mode}${producer.cadence_ms ? ` / ${producer.cadence_ms}ms` : ""}.`,
      relatedIds: [producer.producer_id, producer.source_id],
    });
    if (producer.status === "permission_required") {
      recordLivePipelineLifecycleEvent({
        pipelineId: pipelineIdFor(plan),
        threadId: plan.thread_id,
        environmentId: environment?.environment_id ?? null,
        kind: "source_permission_required",
        status: "blocked",
        summary: `${producer.modality} source needs explicit permission before producing chunks.`,
        relatedIds: [producer.producer_id, producer.source_id],
      });
    } else {
      recordLivePipelineLifecycleEvent({
        pipelineId: pipelineIdFor(plan),
        threadId: plan.thread_id,
        environmentId: environment?.environment_id ?? null,
        kind: "source_active",
        status: "running",
        summary: `${producer.modality} source is active.`,
        relatedIds: [producer.producer_id, producer.source_id],
      });
    }
  }
  const lanes = environment ? ensureDefaultLiveWorkerLanes(environment) : [];
  const jobs = listLiveSourceAnalysisJobs({ threadId: plan.thread_id, limit: 200 })
    .filter((job: HelixLiveSourceAnalysisJob) => plan.producers.some((producer: HelixLiveSourcePipelinePlan["producers"][number]) => producer.source_id === job.source_id));
  const receipt = receiptFor({
    plan: {
      ...plan,
      environment_id: environment?.environment_id ?? plan.environment_id ?? null,
    },
    environmentId: environment?.environment_id ?? null,
    status: "active",
    producerIds: producers.map((producer: HelixLiveSourceProducer) => producer.producer_id),
    analysisJobIds: jobs.map((job: HelixLiveSourceAnalysisJob) => job.job_id),
    workerLaneIds: lanes.map((lane: any) => lane.worker_id),
    missingCapabilities: plan.missing_capabilities,
    nextRepairActions: buildLiveSourcePipelineRepairActions(plan),
  });
  receiptsByPipelineId.set(receipt.pipeline_id, receipt);
  recordLivePipelineLifecycleEvent({
    pipelineId: receipt.pipeline_id,
    threadId: plan.thread_id,
    environmentId: receipt.environment_id ?? null,
    kind: "pipeline_executed",
    status: "running",
    summary: "Pipeline executed into producers, rate policies, and worker lanes.",
    relatedIds: [
      plan.plan_id,
      ...(environment ? [environment.environment_id] : []),
      ...producers.map((producer: HelixLiveSourceProducer) => producer.producer_id),
      ...lanes.map((lane: any) => lane.worker_id),
    ],
  });
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

const listPipelinePairsForSource = (input: {
  sourceId: string;
  threadId?: string | null;
}): Array<{ plan: HelixLiveSourcePipelinePlan; receipt: HelixLiveSourcePipelineReceipt }> =>
  Array.from(receiptsByPipelineId.values())
    .map((receipt: HelixLiveSourcePipelineReceipt) => {
      const plan = plansById.get(receipt.plan_id);
      return plan ? { plan, receipt } : null;
    })
    .filter((entry): entry is { plan: HelixLiveSourcePipelinePlan; receipt: HelixLiveSourcePipelineReceipt } =>
      Boolean(entry) &&
      (!input.threadId || entry!.plan.thread_id === input.threadId) &&
      entry!.plan.producers.some((producer: HelixLiveSourcePipelinePlan["producers"][number]) => producer.source_id === input.sourceId)
    );

export function recordPipelineChunkLifecycle(input: {
  chunk: HelixLiveSourceChunk;
  analysisJob?: HelixLiveSourceAnalysisJob | null;
}): void {
  for (const { plan, receipt } of listPipelinePairsForSource({
    sourceId: input.chunk.source_id,
    threadId: input.chunk.thread_id,
  })) {
    recordLivePipelineLifecycleEvent({
      pipelineId: receipt.pipeline_id,
      threadId: plan.thread_id,
      environmentId: receipt.environment_id ?? plan.environment_id ?? null,
      kind: "chunk_received",
      status: "running",
      summary: `${input.chunk.modality} chunk received for ${input.chunk.source_id}.`,
      relatedIds: [input.chunk.chunk_id, input.chunk.source_id],
      evidenceRefs: input.chunk.evidence_refs,
    });
    if (input.analysisJob) {
      recordLivePipelineLifecycleEvent({
        pipelineId: receipt.pipeline_id,
        threadId: plan.thread_id,
        environmentId: receipt.environment_id ?? plan.environment_id ?? null,
        kind: "analysis_job_queued",
        status: "planned",
        summary: `${input.analysisJob.analyzer_id} analysis queued for ${input.chunk.modality} chunk.`,
        relatedIds: [input.analysisJob.job_id, input.chunk.chunk_id],
        evidenceRefs: input.analysisJob.output_refs,
      });
    }
  }
}

export function recordPipelineAnalysisLifecycle(input: {
  execution?: ReturnType<typeof runDueLiveSourceAnalysisJobs>[number];
  job?: HelixLiveSourceAnalysisJob | null;
  output?: any;
  ok?: boolean;
}): void {
  const job = input.execution?.job ?? input.job ?? null;
  if (!job) return;
  for (const { plan, receipt } of listPipelinePairsForSource({
    sourceId: job.source_id,
    threadId: job.thread_id,
  })) {
    recordLivePipelineLifecycleEvent({
      pipelineId: receipt.pipeline_id,
      threadId: plan.thread_id,
      environmentId: receipt.environment_id ?? plan.environment_id ?? null,
      kind: "analysis_job_started",
      status: "running",
      summary: `${job.analyzer_id} analysis ran for ${job.source_id}.`,
      relatedIds: [job.job_id, job.chunk_id],
    });
    recordLivePipelineLifecycleEvent({
      pipelineId: receipt.pipeline_id,
      threadId: plan.thread_id,
      environmentId: receipt.environment_id ?? plan.environment_id ?? null,
      kind: job.status === "failed" ? "analysis_job_failed" : "analysis_job_completed",
      status: job.status === "failed" ? "failed" : job.status === "completed" ? "completed" : "degraded",
      summary: job.summary,
      relatedIds: [job.job_id, job.chunk_id],
      evidenceRefs: job.output_refs,
    });
    const output = input.execution?.output ?? input.output ?? null;
    const ok = input.execution?.ok ?? input.ok ?? false;
    if (output) {
      recordLivePipelineLifecycleEvent({
        pipelineId: receipt.pipeline_id,
        threadId: plan.thread_id,
        environmentId: receipt.environment_id ?? plan.environment_id ?? null,
        kind: "evidence_routed",
        status: ok ? "completed" : "degraded",
        summary: "Analysis output routed to evidence, interpreted log, and live-card projection.",
        relatedIds: [
          job.job_id,
          output.synthetic_evidence.evidence_id,
          output.interpreted_event.event_id,
        ],
        evidenceRefs: [output.synthetic_evidence.evidence_id, ...job.output_refs],
      });
      recordLivePipelineLifecycleEvent({
        pipelineId: receipt.pipeline_id,
        threadId: plan.thread_id,
        environmentId: receipt.environment_id ?? plan.environment_id ?? null,
        kind: "present_state_updated",
        status: "completed",
        summary: "Present-state card updated from pipeline evidence.",
        relatedIds: [
          output.present_state_card.card_id,
          output.live_environment_delta?.delta_id ?? "",
        ],
        evidenceRefs: [output.synthetic_evidence.evidence_id, ...job.output_refs],
      });
    }
  }
}

export function buildLiveSourcePipelineRepairActions(plan: HelixLiveSourcePipelinePlan): string[] {
  const actions = new Set<string>();
  for (const missing of plan.missing_capabilities) actions.add(missing);
  const capabilities = buildSituationSourceCapabilities({ threadId: plan.thread_id });
  const provider = getVisionProviderHealth();
  for (const producer of plan.producers) {
    const capability = capabilities.find((entry: any) => entry.source_id === producer.source_id || entry.modality === producer.modality);
    if (producer.modality === "visual_frame" && producer.permission_required) actions.add("grant_visual_capture_permission");
    if (producer.modality === "visual_frame" && !provider.configured) actions.add("configure_vision_provider");
    if (producer.modality === "visual_frame" && capability?.status === "stale") actions.add("capture_frame_now");
    if (producer.modality === "world_event" && (!capability || capability.status === "configured_missing")) actions.add("attach_world_event_source");
    if (producer.modality === "audio_transcript" && (!capability || capability.status === "configured_missing")) actions.add("attach_audio_or_transcript_source");
  }
  const buffer = getLiveSourceBufferStatus({ threadId: plan.thread_id });
  if (buffer.total_analysis_queue_depth > 0) actions.add("run_due_analysis");
  if (buffer.sources.some((source: any) => source.backpressure.status === "retry_later" || source.backpressure.status === "compacting")) {
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
    : Array.from(receiptsByPipelineId.values()).find((entry: HelixLiveSourcePipelineReceipt) => entry.plan_id === input.planId) ?? null;
  if (!receipt) return null;
  const plan = plansById.get(receipt.plan_id);
  if (!plan) return null;
  const sourceIds = plan.producers.map((producer: HelixLiveSourcePipelinePlan["producers"][number]) => producer.source_id);
  const nextRepairActions = buildLiveSourcePipelineRepairActions(plan);
  const producers = listLiveSourceProducers({ threadId: plan.thread_id, sourceIds });
  const chunks = listLiveSourceChunks({ threadId: plan.thread_id, limit: 200 }).filter((chunk: HelixLiveSourceChunk) => sourceIds.includes(chunk.source_id));
  const analysisJobs = listLiveSourceAnalysisJobs({ threadId: plan.thread_id, limit: 200 }).filter((job: HelixLiveSourceAnalysisJob) => sourceIds.includes(job.source_id));
  const liveCard = projectPresentStateCard({ threadId: plan.thread_id });
  const readiness = calculateLivePipelineReadiness({
    plan,
    receipt,
    producers,
    chunks,
    analysisJobs,
    repairActions: nextRepairActions,
    missingCapabilities: plan.missing_capabilities,
  });
  return {
    schema: "helix.live_source_pipeline_dashboard.v1",
    pipeline_id: receipt.pipeline_id,
    plan,
    receipt: {
      ...receipt,
      next_repair_actions: nextRepairActions,
    },
    producers,
    chunks,
    analysis_jobs: analysisJobs,
    worker_lanes: listLiveWorkerLanes({ threadId: plan.thread_id, environmentId: plan.environment_id ?? receipt.environment_id ?? null, status: "any" }),
    buffer_status: getLiveSourceBufferStatus({ threadId: plan.thread_id }),
    source_capabilities: buildSituationSourceCapabilities({ threadId: plan.thread_id }),
    live_card: liveCard,
    readiness,
    lifecycle_events: listLivePipelineLifecycleEvents({ pipelineId: receipt.pipeline_id, limit: 120 }),
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
  for (const action of actions) {
    recordLivePipelineLifecycleEvent({
      pipelineId,
      threadId: plan.thread_id,
      environmentId: dashboard.receipt.environment_id ?? null,
      kind: "repair_action_proposed",
      status: action === "configure_vision_provider" ? "blocked" : "degraded",
      summary: `Repair action proposed: ${action}.`,
      relatedIds: [action],
    });
  }
  const executions = actions.includes("run_due_analysis")
    ? runDueLiveSourceAnalysisJobs({ threadId: plan.thread_id })
    : [];
  for (const execution of executions) recordPipelineAnalysisLifecycle({ execution });
  if (executions.length > 0) {
    recordLivePipelineLifecycleEvent({
      pipelineId,
      threadId: plan.thread_id,
      environmentId: dashboard.receipt.environment_id ?? null,
      kind: "repair_action_executed",
      status: executions.some((entry: ReturnType<typeof runDueLiveSourceAnalysisJobs>[number]) => entry.ok) ? "completed" : "failed",
      summary: `Ran ${executions.length} due analysis job${executions.length === 1 ? "" : "s"} for pipeline repair.`,
      relatedIds: executions.map((entry: ReturnType<typeof runDueLiveSourceAnalysisJobs>[number]) => entry.job?.job_id).filter((entry: string | undefined): entry is string => Boolean(entry)),
      evidenceRefs: executions.flatMap((entry: ReturnType<typeof runDueLiveSourceAnalysisJobs>[number]) => entry.job?.output_refs ?? []),
    });
  }
  const receipt = receiptFor({
    plan,
    environmentId: dashboard.receipt.environment_id ?? null,
    status: dashboard.receipt.status,
    producerIds: dashboard.receipt.source_producer_ids,
    analysisJobIds: [
      ...dashboard.receipt.analysis_job_ids,
      ...executions.map((entry: ReturnType<typeof runDueLiveSourceAnalysisJobs>[number]) => entry.job?.job_id).filter((entry: string | undefined): entry is string => Boolean(entry)),
    ],
    workerLaneIds: dashboard.receipt.worker_lane_ids,
    missingCapabilities: dashboard.missing_capabilities,
    nextRepairActions: actions,
  });
  receiptsByPipelineId.set(receipt.pipeline_id, receipt);
  return { receipt, actions, executions };
}

export function getLiveSourcePipelineReadiness(pipelineId: string) {
  return inspectLiveSourcePipeline({ pipelineId })?.readiness ?? null;
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
  recordLivePipelineLifecycleEvent({
    pipelineId,
    threadId: next.thread_id,
    environmentId: next.environment_id ?? null,
    kind: status === "stopped" || status === "archived" ? "pipeline_stopped" : "pipeline_executed",
    status: status === "stopped" || status === "archived" ? "completed" : status === "paused" ? "degraded" : "running",
    summary: `Pipeline status changed to ${status}.`,
    relatedIds: [pipelineId],
  });
  return next;
}

export function resetLiveSourcePipelinesForTest(): void {
  plansById.clear();
  receiptsByPipelineId.clear();
}
