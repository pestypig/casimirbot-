import type { HelixLiveInterpretationWorkerKind } from "./helix-live-interpretation-run";

export const HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA =
  "helix.live_interpretation_worker_run.v1" as const;

export type HelixLiveInterpretationWorkerRun = {
  schema: typeof HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA;
  interpretation_worker_run_id: string;
  interpretation_worker_id: string;
  worker_kind: HelixLiveInterpretationWorkerKind;
  situation_run_id: string;
  interpretation_run_id: string;
  thread_id: string;
  source_epoch: number;
  scene_epoch_id: string;
  trigger_observation_refs: string[];
  trigger_summary_refs: string[];
  status: "pending" | "running" | "started" | "succeeded" | "completed" | "failed" | "skipped" | "budget_exhausted" | "expired";
  model_invoked: boolean;
  model_budget_used: "none" | "cheap" | "normal";
  reasoning_budget?: {
    max_reasoning_steps: number;
    max_artifacts_per_epoch: number;
    max_hypotheses_per_epoch: number;
  };
  input_digest?: string | null;
  output_digest?: string | null;
  artifact_count?: number;
  hypothesis_count?: number;
  failure_reason?: string | null;
  started_at: string;
  completed_at?: string | null;
  output_hypothesis_id?: string | null;
  error?: string | null;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};
