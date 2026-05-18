export const HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA =
  "helix.live_interpretation_worker_run.v1" as const;

export type HelixLiveInterpretationWorkerRun = {
  schema: typeof HELIX_LIVE_INTERPRETATION_WORKER_RUN_SCHEMA;
  interpretation_worker_run_id: string;
  interpretation_worker_id: string;
  situation_run_id: string;
  interpretation_run_id: string;
  thread_id: string;
  source_epoch: number;
  trigger_observation_refs: string[];
  trigger_summary_refs: string[];
  status: "started" | "completed" | "failed" | "expired";
  model_invoked: boolean;
  model_budget_used: "none" | "cheap" | "normal";
  started_at: string;
  completed_at?: string | null;
  output_hypothesis_id?: string | null;
  error?: string | null;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};
