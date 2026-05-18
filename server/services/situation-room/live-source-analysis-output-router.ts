import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
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
import { upsertLiveSourceDescriptor } from "./live-source-descriptor-builder";
import {
  liveSchemaSelectionToLineDefinitions,
  selectLiveSchemaForEnvironment,
} from "./live-schema-selection-engine";
import { inspectLiveSchemaCompatibility } from "./live-schema-compatibility-guard";
import { buildLiveCardLineProjection } from "./live-card-line-projection-builder";
import { runLiveFieldWorkersForObservation } from "./live-field-worker-runner";

export type LiveSourceAnalysisRouterInput = {
  job: HelixLiveSourceAnalysisJob;
  chunk: HelixLiveSourceChunk;
  status: "completed" | "failed" | "suppressed";
  summary: string;
  outputRefs: string[];
  lineValues?: Record<string, {
    value: string;
    confidence?: number | null;
  }>;
  modelInvoked?: boolean;
};

const defaultLineValues = (input: LiveSourceAnalysisRouterInput): Record<string, { value: string; confidence?: number | null }> => {
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
    chunk: input.chunk,
    status: input.status,
    summary: input.summary,
    outputRefs: input.outputRefs,
    evidenceRefs: [syntheticEvidence.evidence_id, interpretedEvent.event_id],
    modelInvoked: input.modelInvoked,
  });
  if (input.chunk.modality === "visual_frame") {
    upsertLiveSourceDescriptor({
      source_id: input.chunk.source_id,
      thread_id: input.chunk.thread_id,
      environment_id: input.chunk.environment_id ?? null,
      modality: "visual_frame",
      source_origin: "browser_getDisplayMedia",
      surface: "screen",
      app_hint: input.summary,
      window_title_hint: input.summary,
      current_state: "active",
      latest_observation_refs: liveCognitionPromotion.observation ? [liveCognitionPromotion.observation.observation_id] : [],
      capabilities: ["capture_frame", "interval_capture", "client_adoption"],
    });
  }
  const environment =
    getActiveLiveAnswerEnvironmentForSource(input.chunk.source_id) ??
    getActiveLiveAnswerEnvironmentForThread(input.chunk.thread_id);
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
  const lineValues = projectionLineValues && Object.keys(projectionLineValues).length > 0
    ? projectionLineValues
    : Object.keys(lineReasoning?.line_values ?? {}).length > 0
    ? lineReasoning?.line_values ?? {}
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
    assistant_answer: false as const,
    raw_content_included: false as const,
    context_policy: "compact_context_pack_only" as const,
  };
}
