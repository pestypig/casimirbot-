import type { HelixLiveSourceChunkModality } from "./helix-live-source-chunk";
import type { HelixLiveSourceCaptureMode } from "./helix-live-source-producer";

export const HELIX_LIVE_SOURCE_PIPELINE_PLAN_SCHEMA = "helix.live_source_pipeline_plan.v1" as const;

export type HelixLiveSourcePipelineAnalyzerRunPolicy =
  | "on_chunk"
  | "interval"
  | "manual"
  | "salience";

export type HelixLiveSourcePipelineProducerPlan = {
  source_id: string;
  modality: HelixLiveSourceChunkModality;
  capture_mode: HelixLiveSourceCaptureMode;
  cadence_ms?: number | null;
  permission_required: boolean;
};

export type HelixLiveSourcePipelineAnalyzerPlan = {
  analyzer_id: string;
  source_id: string;
  run_policy: HelixLiveSourcePipelineAnalyzerRunPolicy;
};

export type HelixLiveSourcePipelineLinePlan = {
  key: string;
  label: string;
  primary_modalities: HelixLiveSourceChunkModality[];
  next_best_tool?: string | null;
};

export type HelixLiveSourcePipelinePlan = {
  schema: typeof HELIX_LIVE_SOURCE_PIPELINE_PLAN_SCHEMA;
  plan_id: string;
  thread_id: string;
  objective: string;
  environment_id?: string | null;
  requested_modalities: HelixLiveSourceChunkModality[];
  producers: HelixLiveSourcePipelineProducerPlan[];
  analyzers: HelixLiveSourcePipelineAnalyzerPlan[];
  live_card_schema: HelixLiveSourcePipelineLinePlan[];
  missing_capabilities: string[];
  assistant_answer: false;
  raw_content_included: false;
};
