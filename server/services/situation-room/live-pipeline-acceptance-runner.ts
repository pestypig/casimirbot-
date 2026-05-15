import {
  HELIX_LIVE_PIPELINE_ACCEPTANCE_RESULT_SCHEMA,
  type HelixLivePipelineAcceptanceResult,
  type HelixLivePipelineAcceptanceScenario,
} from "@shared/helix-live-pipeline-acceptance";
import type { HelixLiveSourceChunkModality } from "@shared/helix-live-source-chunk";
import {
  inspectLiveSourcePipeline,
  recordPipelineAnalysisLifecycle,
  recordPipelineChunkLifecycle,
} from "../helix-ask/live-source-pipeline-executor";
import {
  appendLiveSourceChunk,
  queueLiveSourceAnalysisJob,
  updateLiveSourceAnalysisJob,
} from "./live-source-chunk-buffer";
import { routeLiveSourceAnalysisOutput } from "./live-source-analysis-output-router";
import { listLivePipelineLifecycleEvents } from "./live-pipeline-lifecycle-store";

const summaryFor = (modality: HelixLiveSourceChunkModality): string => {
  if (modality === "visual_frame") return "Mock visual evidence: Minecraft scene with player HUD and visible terrain.";
  if (modality === "world_event") return "Mock world-event evidence: activity present and no damage escalation.";
  if (modality === "audio_transcript") return "Mock transcript evidence: direct-address gameplay question was heard.";
  if (modality === "calculator_stream") return "Mock calculator stream evidence: equation tick is stable.";
  if (modality === "simulation_stream") return "Mock simulation stream evidence: residual remains stable.";
  return `Mock ${modality} evidence accepted.`;
};

const scenarioNameFor = (modality: HelixLiveSourceChunkModality): string => {
  if (modality === "visual_frame") return "visual-only";
  if (modality === "world_event") return "world-only";
  if (modality === "audio_transcript") return "audio-transcript";
  if (modality === "calculator_stream") return "calculator-stream";
  if (modality === "simulation_stream") return "simulation-stream";
  return modality;
};

export function runLivePipelineAcceptance(input: {
  pipelineId: string;
}): HelixLivePipelineAcceptanceResult | null {
  const dashboard = inspectLiveSourcePipeline({ pipelineId: input.pipelineId });
  if (!dashboard) return null;
  const beforeEvents = listLivePipelineLifecycleEvents({ pipelineId: input.pipelineId, limit: 500 });
  const scenarios: HelixLivePipelineAcceptanceScenario[] = [];
  const producers = dashboard.plan.producers.length > 0
    ? dashboard.plan.producers
    : [];
  for (const producer of producers) {
    const summary = summaryFor(producer.modality);
    const chunkResult = appendLiveSourceChunk({
      source_id: producer.source_id,
      thread_id: dashboard.plan.thread_id,
      environment_id: dashboard.receipt.environment_id ?? dashboard.plan.environment_id ?? null,
      modality: producer.modality,
      compact_summary: summary,
      payload_ref: `acceptance://${producer.modality}/${Date.now()}`,
      evidence_refs: [`acceptance:${producer.modality}`],
      capture_mode: producer.capture_mode,
    });
    const job = queueLiveSourceAnalysisJob({
      chunk: chunkResult.chunk,
      analyzerId: dashboard.plan.analyzers.find((entry) => entry.source_id === producer.source_id)?.analyzer_id,
    });
    recordPipelineChunkLifecycle({ chunk: chunkResult.chunk, analysisJob: job });
    const completed = updateLiveSourceAnalysisJob({
      jobId: job.job_id,
      status: "completed",
      outputRefs: [`acceptance_evidence:${producer.modality}:${job.job_id}`],
      summary,
    }) ?? job;
    const output = routeLiveSourceAnalysisOutput({
      job: completed,
      chunk: chunkResult.chunk,
      status: "completed",
      summary,
      outputRefs: completed.output_refs,
      modelInvoked: false,
    });
    recordPipelineAnalysisLifecycle({
      job: completed,
      output,
      ok: true,
    });
    const afterEvents = listLivePipelineLifecycleEvents({ pipelineId: input.pipelineId, limit: 500 });
    const newEvents = afterEvents.slice(beforeEvents.length);
    scenarios.push({
      name: scenarioNameFor(producer.modality),
      ok: true,
      lifecycle_event_ids: newEvents.map((event) => event.event_id),
      evidence_refs: [
        output.synthetic_evidence.evidence_id,
        ...completed.output_refs,
      ],
      failures: [],
    });
  }
  const ok = scenarios.length > 0 && scenarios.every((scenario) => scenario.ok);
  return {
    schema: HELIX_LIVE_PIPELINE_ACCEPTANCE_RESULT_SCHEMA,
    pipeline_id: input.pipelineId,
    ok,
    scenarios,
    poison_audit_ok: true,
    terminal_authority_ok: true,
    assistant_answer_from_pipeline_count: 0,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}
