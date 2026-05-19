export const HELIX_LIVE_FIELD_WORKER_RUN_SCHEMA =
  "helix.live_field_worker_run.v1" as const;

export type HelixLiveFieldWorkerRun = {
  schema: typeof HELIX_LIVE_FIELD_WORKER_RUN_SCHEMA;
  worker_run_id: string;
  worker_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  field_key: string;
  status: "started" | "completed" | "failed" | "expired";
  trigger_observation_refs: string[];
  tool_calls: [];
  started_at: string;
  completed_at?: string | null;
  output_evaluation_id?: string | null;
  error?: string | null;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};
