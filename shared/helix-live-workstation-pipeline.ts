import type { LiveAnswerLineDefinition } from "./helix-live-answer-environment";

export const HELIX_LIVE_WORKSTATION_PIPELINE_SCHEMA = "helix.live_workstation_pipeline.v1" as const;
export const HELIX_LIVE_WORKSTATION_PIPELINE_RECEIPT_SCHEMA = "helix.live_workstation_pipeline_receipt.v1" as const;

export type LivePipelineStatus = "active" | "paused" | "completed" | "error";

export type LivePipelineTransformKind =
  | "sentence_summary"
  | "rolling_summary"
  | "philosophy_compare"
  | "claim_evidence_extract"
  | "contradiction_watch"
  | "methods_note_writer"
  | "custom_prompt_transform";

export type LivePipelineSinkKind =
  | "live_answer_environment"
  | "workstation_note"
  | "situation_panel"
  | "debug_trace"
  | "helix_context_pack";

export type LivePipelineTransformSpec = {
  transform_id: string;
  kind: LivePipelineTransformKind;
  title: string;
  input_ports: string[];
  output_ports: string[];
  params: Record<string, unknown>;
  model_policy: "deterministic_only" | "model_on_window" | "model_on_salience" | "manual_review";
  output_role: "validation" | "toolObservation";
};

export type LivePipelineSinkSpec = {
  sink_id: string;
  kind: LivePipelineSinkKind;
  title: string;
  target_id?: string | null;
  params: Record<string, unknown>;
  write_policy: "append" | "replace_section" | "manual_only";
  evidence_policy: "cite_source_events" | "cite_window" | "debug_only";
};

export type LiveWorkstationPipeline = {
  schema: typeof HELIX_LIVE_WORKSTATION_PIPELINE_SCHEMA;
  pipeline_id: string;
  thread_id: string;
  created_turn_id: string;
  objective: string;
  source_ids: string[];
  environment_id?: string | null;
  status: LivePipelineStatus;
  transforms: LivePipelineTransformSpec[];
  sinks: LivePipelineSinkSpec[];
  line_schema?: LiveAnswerLineDefinition[];
  window_policy: {
    mode: "per_event" | "sentence" | "rolling_window" | "salience_only";
    max_events_per_window: number;
    max_window_ms: number;
  };
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  raw_transcript_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
  created_at: string;
  updated_at: string;
};

export type LiveWorkstationPipelineReceipt = {
  schema: typeof HELIX_LIVE_WORKSTATION_PIPELINE_RECEIPT_SCHEMA;
  ok: boolean;
  pipeline_id?: string | null;
  thread_id: string;
  created_turn_id?: string | null;
  objective: string;
  source_ids: string[];
  environment_id?: string | null;
  transform_ids: string[];
  sink_ids: string[];
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  raw_transcript_included: false;
  deterministic_content_role: "observation_not_assistant_answer";
  error?: string | null;
};

export type LiveWorkstationPipelinePlan = {
  schema: "helix.live_workstation_pipeline_plan.v1";
  pipeline_recipe_id:
    | "transcript_sentence_note"
    | "philosophy_compare"
    | "methods_note_writer"
    | "claim_evidence_extract"
    | "custom_live_pipeline";
  objective: string;
  source_requirements: string[];
  missing_bindings: string[];
  line_schema: LiveAnswerLineDefinition[];
  transforms: LivePipelineTransformSpec[];
  sinks: LivePipelineSinkSpec[];
  next_actions: Array<{
    action: "create_pipeline" | "request_live_source" | "attach_live_environment";
    reason: string;
  }>;
};
