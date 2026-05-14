export const HELIX_CONTINUOUS_CATEGORIZATION_JOB_SCHEMA =
  "helix.continuous_categorization_job.v1" as const;
export const HELIX_CONTINUOUS_CATEGORIZATION_JOB_RECEIPT_SCHEMA =
  "helix.continuous_categorization_job_receipt.v1" as const;

export type ContinuousCategorizationJobStatus =
  | "active"
  | "paused"
  | "stopped"
  | "archived"
  | "error";

export type ContinuousCategorizationSourceFamily =
  | "minecraft_events"
  | "discord_voice"
  | "calculator_stream"
  | "physics_simulation"
  | "browser_transcript"
  | "research_session"
  | "custom";

export type ContinuousCategorizationJobPolicy = {
  mode: "per_event" | "windowed" | "salience_only";
  evidence_budget: "compact" | "expanded_debug";
  surface_policy: "silent" | "danger_progress" | "debug_trace";
  archive_on_stop: boolean;
  profile_archive_policy: "compact_summary_only" | "disabled";
};

export type ContinuousCategorizationJob = {
  schema: typeof HELIX_CONTINUOUS_CATEGORIZATION_JOB_SCHEMA;
  job_id: string;
  thread_id: string;
  profile_id?: string | null;
  room_id?: string | null;
  source_family: ContinuousCategorizationSourceFamily;
  source_ids: string[];
  world_id?: string | null;
  objective: string;
  status: ContinuousCategorizationJobStatus;
  policy: ContinuousCategorizationJobPolicy;
  counters: {
    source_events_seen: number;
    categorization_events: number;
    synthetic_evidence: number;
    utility_hypotheses: number;
    pattern_candidates: number;
  };
  latest_summary?: string | null;
  latest_evidence_refs: string[];
  last_event_ts?: string | null;
  archive_id?: string | null;
  raw_logs_included: false;
  assistant_answer: false;
  created_at: string;
  updated_at: string;
};

export type ContinuousCategorizationJobReceipt = {
  schema: typeof HELIX_CONTINUOUS_CATEGORIZATION_JOB_RECEIPT_SCHEMA;
  receipt_id: string;
  job_id: string;
  thread_id: string;
  action:
    | "start"
    | "pause"
    | "resume"
    | "stop"
    | "archive"
    | "process_event"
    | "query";
  ok: boolean;
  status: ContinuousCategorizationJobStatus;
  summary: string;
  evidence_refs: string[];
  raw_logs_included: false;
  assistant_answer: false;
  ts: string;
};
