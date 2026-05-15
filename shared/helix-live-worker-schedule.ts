export const HELIX_LIVE_WORKER_SCHEDULE_SCHEMA = "helix.live_worker_schedule.v1" as const;

export type HelixLiveWorkerSchedule = {
  schema: typeof HELIX_LIVE_WORKER_SCHEDULE_SCHEMA;
  thread_id: string;
  environment_id?: string | null;
  max_active_workers_per_thread: number;
  max_runs_per_minute: number;
  cooldown_ms: number;
  active_run_count: number;
  suppressed_run_count: number;
  assistant_answer: false;
  raw_content_included: false;
};
