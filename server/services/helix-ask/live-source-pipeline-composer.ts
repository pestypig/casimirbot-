import crypto from "node:crypto";
import type { LiveAnswerLineDefinition } from "@shared/helix-live-answer-environment";
import {
  HELIX_LIVE_SOURCE_PIPELINE_PLAN_SCHEMA,
  type HelixLiveSourcePipelineLinePlan,
  type HelixLiveSourcePipelinePlan,
  type HelixLiveSourcePipelineProducerPlan,
} from "@shared/helix-live-source-pipeline-plan";
import type { HelixLiveSourceChunkModality } from "@shared/helix-live-source-chunk";
import { classifyLiveSourcePipelineIntent } from "./live-source-pipeline-intent-router";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const sourceIdFor = (threadId: string, modality: HelixLiveSourceChunkModality, suffix: string): string =>
  `source:${modality}:${hashShort([threadId, suffix], 12)}`;

const producer = (
  source_id: string,
  modality: HelixLiveSourceChunkModality,
  capture_mode: HelixLiveSourcePipelineProducerPlan["capture_mode"],
  permission_required: boolean,
  cadence_ms?: number | null,
): HelixLiveSourcePipelineProducerPlan => ({
  source_id,
  modality,
  capture_mode,
  cadence_ms: cadence_ms ?? null,
  permission_required,
});

const line = (
  key: string,
  label: string,
  primary_modalities: HelixLiveSourceChunkModality[],
  next_best_tool?: string | null,
): HelixLiveSourcePipelineLinePlan => ({
  key,
  label,
  primary_modalities,
  next_best_tool: next_best_tool ?? null,
});

export function pipelineLinesToLiveAnswerSchema(lines: HelixLiveSourcePipelineLinePlan[]): LiveAnswerLineDefinition[] {
  return lines.map((entry: HelixLiveSourcePipelineLinePlan) => ({
    key: entry.key,
    label: entry.label,
    update_policy: entry.key === "next_check" || entry.key === "missing_evidence" || entry.key === "uncertainty"
      ? "projection_only"
      : entry.key === "stability" || entry.key === "residual"
        ? "stability_window"
        : "episode_based",
    visibility: "answer_card",
    priority: entry.key === "risk" || entry.key === "uncertainty" || entry.key === "missing_evidence"
      ? "warn"
      : entry.key === "next_check"
        ? "action"
        : "info",
  }));
}

export function composeLiveSourcePipelinePlan(input: {
  threadId?: string | null;
  objective: string;
  environmentId?: string | null;
}): HelixLiveSourcePipelinePlan {
  const threadId = input.threadId?.trim() || "helix-ask:desktop";
  const kind = classifyLiveSourcePipelineIntent(input.objective);
  let producers: HelixLiveSourcePipelineProducerPlan[] = [];
  let liveCardSchema: HelixLiveSourcePipelineLinePlan[] = [];
  let missingCapabilities: string[] = [];

  if (kind === "minecraft_cortana") {
    producers = [
      producer(sourceIdFor(threadId, "visual_frame", "minecraft-visual"), "visual_frame", "manual", true, null),
      producer("source:minecraft-server", "world_event", "push", false, null),
      producer(sourceIdFor(threadId, "audio_transcript", "minecraft-voice"), "audio_transcript", "push", true, null),
    ];
    liveCardSchema = [
      line("place", "Place", ["visual_frame", "world_event"], "visual.align_latest_with_event_window"),
      line("activity", "Activity", ["visual_frame", "world_event"], "visual.align_latest_with_event_window"),
      line("structure", "Structure", ["visual_frame", "world_event"], "minecraft.query_event_window"),
      line("entities", "Entities", ["visual_frame", "world_event"], "minecraft.query_world_sense_window"),
      line("risk", "Risk", ["world_event", "visual_frame"], "minecraft.query_event_window"),
      line("missing_evidence", "Missing Evidence", ["visual_frame", "world_event"], "situation-room.live-source.query_analysis_jobs"),
      line("next_check", "Next Check", ["visual_frame", "world_event"], "situation-room.live-source.run_due_analysis"),
    ];
    missingCapabilities = ["grant_visual_capture_permission", "attach_world_event_source"];
  } else if (kind === "moral_transcript") {
    producers = [
      producer(sourceIdFor(threadId, "audio_transcript", "moral-transcript"), "audio_transcript", "push", true, null),
      producer(sourceIdFor(threadId, "document_context", "moral-reference"), "document_context", "manual", false, null),
    ];
    liveCardSchema = [
      line("current_claim", "Current claim", ["audio_transcript"], "situation-room.live-source.query_chunks"),
      line("moral_comparison", "Moral comparison", ["audio_transcript", "document_context"], "docs-viewer.lookup_reference"),
      line("evidence", "Evidence", ["audio_transcript", "document_context"], "situation-room.live-source.query_analysis_jobs"),
      line("uncertainty", "Uncertainty", ["audio_transcript"], "situation-room.run_agentic_review"),
      line("next_check", "Next Check", ["audio_transcript", "document_context"], "situation-room.live-source.run_due_analysis"),
    ];
    missingCapabilities = ["attach_audio_or_transcript_source", "attach_reference_context"];
  } else if (kind === "equation_stream") {
    producers = [
      producer(sourceIdFor(threadId, "calculator_stream", "equation"), "calculator_stream", "interval", false, 1_000),
      producer(sourceIdFor(threadId, "simulation_stream", "stability"), "simulation_stream", "interval", false, 1_000),
    ];
    liveCardSchema = [
      line("equation", "Equation", ["calculator_stream"], "scientific-calculator.solve_with_steps"),
      line("variables", "Variables", ["calculator_stream"], "scientific-calculator.solve_with_steps"),
      line("result", "Result", ["calculator_stream"], "situation-room.live-source.query_chunks"),
      line("stability", "Stability", ["simulation_stream", "calculator_stream"], "situation-room.live-source.query_analysis_jobs"),
      line("residual", "Residual", ["simulation_stream"], "situation-room.live-source.query_chunks"),
      line("next_check", "Next Check", ["calculator_stream", "simulation_stream"], "situation-room.live-source.run_due_analysis"),
    ];
  } else if (kind === "document_math") {
    producers = [
      producer(sourceIdFor(threadId, "document_context", "doc-math"), "document_context", "manual", false, null),
      producer(sourceIdFor(threadId, "calculator_stream", "doc-equation"), "calculator_stream", "on_change", false, null),
      producer(sourceIdFor(threadId, "note_context", "doc-notes"), "note_context", "on_change", false, null),
    ];
    liveCardSchema = [
      line("section", "Section", ["document_context"], "docs-viewer.lookup_reference"),
      line("equation", "Equation", ["document_context", "calculator_stream"], "scientific-calculator.solve_with_steps"),
      line("verification", "Verification", ["calculator_stream", "document_context"], "scientific-calculator.solve_with_steps"),
      line("evidence", "Evidence", ["document_context", "note_context"], "docs-viewer.lookup_reference"),
      line("next_check", "Next Check", ["document_context", "calculator_stream"], "situation-room.live-source.run_due_analysis"),
    ];
  } else {
    producers = [producer(sourceIdFor(threadId, "visual_frame", "generic-visual"), "visual_frame", "manual", true, null)];
    liveCardSchema = [
      line("scene", "Scene", ["visual_frame"], "visual.capture_now"),
      line("activity", "Activity", ["visual_frame"], "visual.align_latest_with_event_window"),
      line("objects", "Objects / Participants", ["visual_frame"], "visual.align_latest_with_event_window"),
      line("evidence", "Evidence", ["visual_frame"], "situation-room.live-source.query_analysis_jobs"),
      line("uncertainty", "Uncertainty", ["visual_frame"], "situation-room.run_agentic_review"),
      line("next_check", "Next Check", ["visual_frame"], "situation-room.live-source.run_due_analysis"),
    ];
    missingCapabilities = ["grant_visual_capture_permission"];
  }

  const requestedModalities = Array.from(new Set(producers.map((entry: HelixLiveSourcePipelineProducerPlan) => entry.modality)));
  return {
    schema: HELIX_LIVE_SOURCE_PIPELINE_PLAN_SCHEMA,
    plan_id: `live_source_pipeline_plan:${hashShort([threadId, input.objective, requestedModalities])}`,
    thread_id: threadId,
    objective: input.objective,
    environment_id: input.environmentId ?? null,
    requested_modalities: requestedModalities,
    producers,
    analyzers: producers.map((entry: HelixLiveSourcePipelineProducerPlan) => ({
      analyzer_id: entry.modality === "visual_frame"
        ? "visual_analysis"
        : entry.modality === "audio_transcript"
          ? "transcript_intent"
          : entry.modality === "world_event"
            ? "world_sense"
            : `${entry.modality}_analysis`,
      source_id: entry.source_id,
      run_policy: entry.modality === "world_event" || entry.modality === "audio_transcript" ? "on_chunk" : "manual",
    })),
    live_card_schema: liveCardSchema,
    missing_capabilities: missingCapabilities,
    assistant_answer: false,
    raw_content_included: false,
  };
}
