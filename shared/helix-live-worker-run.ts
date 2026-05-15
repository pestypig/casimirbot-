export const HELIX_LIVE_WORKER_RUN_SCHEMA = "helix.live_worker_run.v1" as const;

export type HelixLiveWorkerRun = {
  schema: typeof HELIX_LIVE_WORKER_RUN_SCHEMA;
  run_id: string;
  worker_id: string;
  thread_id: string;
  environment_id: string;
  started_at: string;
  completed_at?: string | null;
  status: "started" | "completed" | "failed" | "suppressed";
  trigger_reason: string;
  tool_calls: Array<{
    tool_id: string;
    dynamic_tool_call_id: string;
    receipt_refs: string[];
  }>;
  observations: string[];
  validations: string[];
  updated_line_keys: string[];
  summary: string;
  assistant_answer: false;
  raw_content_included: false;
};
