import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import { liveSourceIdentityRefFor } from "@shared/helix-live-source-identity";
import { appendInterpretedEvent } from "./interpreted-event-log-store";
import { recordSyntheticEvidence } from "./synthetic-evidence-ledger";
import {
  getActiveLiveAnswerEnvironmentForSource,
  getActiveLiveAnswerEnvironmentForThread,
  setLiveAnswerEnvironmentLineSchema,
  updateLiveAnswerEnvironment,
} from "./live-answer-environment-store";
import { projectPresentStateCard } from "./present-state-card-projector";
import { getLiveSourceProducer } from "./live-source-chunk-buffer";
import { recordLiveSourceProducerLifecycleEvent } from "./live-source-producer-lifecycle-store";
import { promoteLiveSourceAnalysisOutput } from "./live-cognition-promotion-router";
import { reasonLiveCardLinesForEnvironment } from "./live-card-line-reasoner";
import {
  getLatestLiveSourceDescriptorForSource,
  upsertLiveSourceDescriptor,
} from "./live-source-descriptor-builder";
import {
  liveSchemaSelectionToLineDefinitions,
  selectLiveSchemaForEnvironment,
} from "./live-schema-selection-engine";
import { inspectLiveSchemaCompatibility } from "./live-schema-compatibility-guard";
import { buildLiveCardLineProjection } from "./live-card-line-projection-builder";
import { runLiveFieldWorkersForObservation } from "./live-field-worker-runner";
import {
  liveSourceBindingIdFor,
  upsertLiveSourceIdentityFromChunk,
} from "./live-source-identity-store";

type RoutedLiveLineValue = {
  value: string;
  confidence?: number | null;
  evidence_refs?: string[];
  source_event_ids?: string[];
  source?: "deterministic_reducer" | "tool_observation" | "model_review" | "manual";
  model_invoked?: boolean;
  deterministic?: boolean;
};

export type LiveSourceAnalysisRouterInput = {
  job: HelixLiveSourceAnalysisJob;
  chunk: HelixLiveSourceChunk;
  status: "completed" | "failed" | "suppressed";
  summary: string;
  outputRefs: string[];
  lineValues?: Record<string, RoutedLiveLineValue>;
  modelInvoked?: boolean;
};

const defaultLineValues = (input: LiveSourceAnalysisRouterInput): Record<string, RoutedLiveLineValue> => {
  if (input.status !== "completed") {
    return {
      next_check: {
        value: input.summary,
        confidence: 0.2,
      },
      missing_evidence: {
        value: input.summary,
        confidence: 0.2,
      },
    };
  }
  if (input.chunk.modality === "visual_frame") {
    return {
      scene: { value: input.summary, confidence: 0.7 },
      place: { value: input.summary, confidence: 0.7 },
      activity: { value: input.summary, confidence: 0.62 },
      evidence: { value: "Latest visual frame was analyzed into compact evidence.", confidence: 0.7 },
      next_check: { value: "Capture another frame or align the visual evidence with fresh source events.", confidence: 0.55 },
    };
  }
  if (input.chunk.modality === "audio_transcript") {
    return {
      dialogue: { value: input.summary, confidence: 0.68 },
      activity: { value: input.summary, confidence: 0.45 },
      evidence: { value: "Transcript chunk was analyzed as compact dialogue evidence.", confidence: 0.68 },
    };
  }
  if (input.chunk.modality === "world_event") {
    return {
      activity: { value: input.summary, confidence: 0.65 },
      risk: { value: input.summary, confidence: 0.55 },
      progress: { value: input.summary, confidence: 0.6 },
    };
  }
  if (input.chunk.modality === "environment_state") {
    return {
      situation: { value: input.summary, confidence: 0.72 },
      actor_state: { value: "Structured actor state updated.", confidence: 0.72 },
      resources: { value: "Inventory/resource state updated.", confidence: 0.72 },
      affordances: { value: "Awaiting affordance reducer or latest focus target.", confidence: 0.45 },
      risk: { value: "No risk promoted unless hazards or status thresholds are present.", confidence: 0.55 },
      possibilities: { value: "No action graph generated yet.", confidence: 0.45 },
      rehearsal: { value: "No rehearsal result yet.", confidence: 0.45 },
      recommendation: { value: "Awaiting rehearsal before recommending action.", confidence: 0.45 },
      next_check: { value: "Watch changed state sections and request rehearsal for candidate suggestions.", confidence: 0.65 },
    };
  }
  if (input.chunk.modality === "environment_affordance") {
    return {
      affordances: { value: input.summary, confidence: 0.68 },
      possibilities: { value: "Candidate procedures still require a possibility graph.", confidence: 0.45 },
      next_check: { value: "Generate or refresh the possibility graph from current affordances.", confidence: 0.62 },
    };
  }
  if (input.chunk.modality === "procedure_graph" || input.chunk.modality === "process_graph") {
    return {
      possibilities: { value: input.summary, confidence: 0.68 },
      rehearsal: { value: "Procedure graph is possible, not validated.", confidence: 0.45 },
      recommendation: { value: "Awaiting rehearsal before recommending action.", confidence: 0.45 },
      next_check: { value: "Run read-only rehearsal before surfacing a recommendation.", confidence: 0.68 },
    };
  }
  if (input.chunk.modality === "calculator_stream" || input.chunk.modality === "simulation_stream") {
    return {
      progress: { value: input.summary, confidence: 0.65 },
      evidence: { value: input.summary, confidence: 0.65 },
      next_check: { value: "Continue the stream or reduce cadence if backpressure rises.", confidence: 0.5 },
    };
  }
  return {
    activity: { value: input.summary, confidence: 0.5 },
    evidence: { value: input.summary, confidence: 0.5 },
  };
};

export function routeLiveSourceAnalysisOutput(input: LiveSourceAnalysisRouterInput) {
  const environment =
    getActiveLiveAnswerEnvironmentForSource(input.chunk.source_id) ??
    getActiveLiveAnswerEnvironmentForThread(input.chunk.thread_id);
  const sourceIsBound = Boolean(
    environment &&
    (environment.source_ids.length === 0 || environment.source_ids.includes(input.chunk.source_id)),
  );
  const sourceBindingId = sourceIsBound
    ? input.chunk.source_binding_id ?? liveSourceBindingIdFor({
        thread_id: input.chunk.thread_id,
        environment_id: environment?.environment_id ?? input.chunk.environment_id ?? null,
        source_id: input.chunk.source_id,
        modality: input.chunk.modality,
      })
    : null;
  const sourceEpoch = Math.max(1, Math.trunc(input.chunk.source_epoch ?? input.chunk.sequence_index ?? 1));
  const priorVisualDescriptor = input.chunk.modality === "visual_frame"
    ? getLatestLiveSourceDescriptorForSource(input.chunk.source_id)
    : null;
  const priorVisualIdentitySurface = priorVisualDescriptor && [
    "screen",
    "window",
    "browser_tab",
    "camera",
    "unknown",
  ].includes(priorVisualDescriptor.serving_context.surface)
    ? priorVisualDescriptor.serving_context.surface as "screen" | "window" | "browser_tab" | "camera" | "unknown"
    : undefined;
  const sourceIdentity = upsertLiveSourceIdentityFromChunk({
    chunk: {
      ...input.chunk,
      source_binding_id: sourceBindingId,
      source_epoch: sourceEpoch,
    },
    sourceBindingId,
    sourceSurface: priorVisualIdentitySurface,
    sourceOrigin: priorVisualDescriptor?.serving_context.source_origin,
    bindingStatus: sourceIsBound ? "bound" : "observed_unbound",
    latestEvidenceRefs: input.outputRefs,
  });
  const sourceIdentityRef = liveSourceIdentityRefFor(sourceIdentity);
  const refs = Array.from(new Set([
    input.job.job_id,
    input.chunk.chunk_id,
    ...input.outputRefs,
    ...input.chunk.evidence_refs,
  ].filter(Boolean)));
  const syntheticEvidence = recordSyntheticEvidence({
    thread_id: input.chunk.thread_id,
    produced_by: input.modelInvoked === true ? "model_review" : "live_environment",
    claim: input.summary,
    support_status: input.status === "completed" ? "supports" : input.status === "failed" ? "unknown" : "partial",
    source_refs: refs,
    deterministic: input.modelInvoked !== true,
    model_invoked: input.modelInvoked === true,
  });
  const interpretedEvent = appendInterpretedEvent({
    thread_id: input.chunk.thread_id,
    room_id: null,
    source_family: `live_source:${input.chunk.modality}`,
    kind: input.status === "completed" ? "synthetic_evidence" : "agentic_review",
    title: `Live source analysis ${input.status}`,
    summary: input.summary,
    confidence: input.status === "completed" ? 0.65 : 0.2,
    evidence_refs: [...refs, syntheticEvidence.evidence_id],
    source_event_ids: [input.chunk.chunk_id],
    related_job_ids: [input.job.job_id],
    model_invoked: input.modelInvoked === true,
    deterministic: input.modelInvoked !== true,
    created_at: new Date().toISOString(),
  });
  const liveCognitionPromotion = promoteLiveSourceAnalysisOutput({
    job: input.job,
    chunk: {
      ...input.chunk,
      source_identity_ref: sourceIdentityRef,
      source_binding_id: sourceBindingId,
      source_epoch: sourceEpoch,
    },
    status: input.status,
    summary: input.summary,
    outputRefs: input.outputRefs,
    evidenceRefs: [syntheticEvidence.evidence_id, interpretedEvent.event_id],
    sourceIdentityRef,
    sourceBindingId,
    sourceEpoch,
    modelInvoked: input.modelInvoked,
  });
  const refreshedSourceIdentity = upsertLiveSourceIdentityFromChunk({
    chunk: {
      ...input.chunk,
      source_identity_ref: sourceIdentityRef,
      source_binding_id: sourceBindingId,
      source_epoch: sourceEpoch,
    },
    sourceBindingId,
    sourceSurface: priorVisualIdentitySurface,
    sourceOrigin: priorVisualDescriptor?.serving_context.source_origin,
    bindingStatus: sourceIsBound ? "bound" : "observed_unbound",
    latestObservationId: liveCognitionPromotion.observation?.observation_id ?? null,
    latestEvidenceRefs: [syntheticEvidence.evidence_id, interpretedEvent.event_id, ...input.outputRefs],
  });
  if (input.chunk.modality === "visual_frame") {
    upsertLiveSourceDescriptor({
      source_id: input.chunk.source_id,
      thread_id: input.chunk.thread_id,
      environment_id: input.chunk.environment_id ?? null,
      modality: "visual_frame",
      source_origin: priorVisualDescriptor?.serving_context.source_origin ?? "browser_getDisplayMedia",
      surface: priorVisualDescriptor?.serving_context.surface ?? "screen",
      app_hint: input.summary,
      window_title_hint: input.summary,
      current_state: "active",
      latest_observation_refs: liveCognitionPromotion.observation ? [liveCognitionPromotion.observation.observation_id] : [],
      capabilities: ["capture_frame", "interval_capture", "client_adoption"],
    });
  }
  const schemaSelection = environment
    ? selectLiveSchemaForEnvironment({ environment })
    : null;
  const schemaCompatibility = environment && schemaSelection
    ? inspectLiveSchemaCompatibility({ environment, selection: schemaSelection })
    : null;
  const schemaRepair = environment && schemaSelection && schemaCompatibility && !schemaCompatibility.ok && schemaCompatibility.recommended_schema
    ? setLiveAnswerEnvironmentLineSchema({
        environment_id: environment.environment_id,
        line_schema: liveSchemaSelectionToLineDefinitions(schemaSelection),
      })
    : null;
  const scopedEnvironment = schemaRepair?.environment ?? environment;
  const fieldWorkerRun = scopedEnvironment
    ? runLiveFieldWorkersForObservation({
        environment: scopedEnvironment,
        observation: liveCognitionPromotion.observation ?? null,
        sourceIdentity: refreshedSourceIdentity,
        sourceBindingId,
      })
    : null;
  const lineProjection = scopedEnvironment
    ? buildLiveCardLineProjection({ environment: scopedEnvironment })
    : null;
  const projectionLineValues = lineProjection
    ? Object.fromEntries(lineProjection.lines.map((entry) => [
        entry.key,
        {
          value: entry.value,
          confidence: entry.confidence,
          evidence_refs: entry.evidence_refs,
          source_event_ids: [input.chunk.chunk_id],
          source: "model_review" as const,
          model_invoked: input.modelInvoked === true,
          deterministic: input.modelInvoked !== true,
        },
      ]))
    : null;
  const lineReasoning = scopedEnvironment
    ? reasonLiveCardLinesForEnvironment({ environment: scopedEnvironment })
    : null;
  const lineValues: Record<string, RoutedLiveLineValue> = projectionLineValues && Object.keys(projectionLineValues).length > 0
    ? projectionLineValues
    : Object.keys(lineReasoning?.line_values ?? {}).length > 0
    ? (lineReasoning?.line_values ?? {}) as Record<string, RoutedLiveLineValue>
    : input.lineValues ?? defaultLineValues(input);
  const delta = scopedEnvironment
    ? updateLiveAnswerEnvironment({
        environment_id: scopedEnvironment.environment_id,
        reason: "line_reasoning_update",
        line_values: Object.fromEntries(Object.entries(lineValues).map(([key, value]) => [
          key,
          {
            value: value.value,
            confidence: value.confidence ?? null,
            evidence_refs: [...refs, syntheticEvidence.evidence_id, ...(value.evidence_refs ?? [])],
            source_event_ids: [input.chunk.chunk_id, ...(value.source_event_ids ?? [])],
            source: value.source ?? "deterministic_reducer",
            model_invoked: value.model_invoked ?? input.modelInvoked === true,
            deterministic: value.deterministic ?? input.modelInvoked !== true,
          },
        ])),
        latest_summary: input.summary,
        evidence_refs: [...refs, syntheticEvidence.evidence_id],
        source_event_count: 1,
      })
    : null;
  const presentStateCard = projectPresentStateCard({
    threadId: input.chunk.thread_id,
  });
  const producer = getLiveSourceProducer(input.chunk.source_id);
  if (producer && delta?.delta) {
    recordLiveSourceProducerLifecycleEvent({
      producerId: producer.producer_id,
      sourceId: producer.source_id,
      threadId: producer.thread_id,
      environmentId: delta.environment.environment_id,
      kind: "card_updated",
      status: "ok",
      summary: "Live card updated from live-source analysis output.",
      relatedIds: [input.job.job_id, input.chunk.chunk_id, delta.delta.delta_id, syntheticEvidence.evidence_id],
    });
  }
  return {
    synthetic_evidence: syntheticEvidence,
    interpreted_event: interpretedEvent,
    live_environment_delta: delta?.delta ?? null,
    live_answer_environment: delta?.environment ?? environment ?? null,
    live_source_identity: refreshedSourceIdentity,
    source_identity_ref: sourceIdentityRef,
    source_binding_id: sourceBindingId,
    source_epoch: sourceEpoch,
    present_state_card: presentStateCard,
    live_cognition_promotion: liveCognitionPromotion,
    live_cognition_promotion_audit: liveCognitionPromotion.audit,
    schema_selection: schemaSelection,
    schema_compatibility: schemaCompatibility,
    schema_repair_delta: schemaRepair?.delta ?? null,
    live_card_line_projection: lineProjection,
    live_card_line_reasoning: lineReasoning,
    live_situation_run: fieldWorkerRun?.run ?? null,
    live_field_workers: fieldWorkerRun?.workers ?? [],
    live_field_worker_runs: fieldWorkerRun?.worker_runs ?? [],
    live_field_evaluations: fieldWorkerRun?.evaluations ?? [],
    live_handoff_arbitration: fieldWorkerRun?.arbitration ?? null,
    live_arbitration_candidate: fieldWorkerRun?.arbitration?.arbitration_candidate ?? null,
    live_situation_predictions: fieldWorkerRun?.predictions ?? [],
    live_observation_probes: fieldWorkerRun?.probes ?? [],
    live_probe_results: fieldWorkerRun?.probe_results ?? [],
    live_confidence_updates: fieldWorkerRun?.confidence_updates ?? [],
    live_procedure_epoch: fieldWorkerRun?.procedure_epoch ?? null,
    live_procedure_epoch_closure: fieldWorkerRun?.procedure_epoch_closure ?? null,
    live_field_repair_artifact: fieldWorkerRun?.field_repair_artifact ?? null,
    live_interpretation_run: fieldWorkerRun?.interpretation_run ?? null,
    live_interpretation_workers: fieldWorkerRun?.interpretation_workers ?? [],
    live_interpretation_worker_runs: fieldWorkerRun?.interpretation_worker_runs ?? [],
    live_interpretation_hypotheses: fieldWorkerRun?.interpretation_hypotheses ?? [],
    live_interpretation_validation_artifacts: fieldWorkerRun?.interpretation_validation_artifacts ?? [],
    live_interpretation_graph: fieldWorkerRun?.interpretation_graph ?? null,
    live_interpretation_tangents: fieldWorkerRun?.interpretation_tangents ?? [],
    assistant_answer: false as const,
    raw_content_included: false as const,
    context_policy: "compact_context_pack_only" as const,
  };
}
