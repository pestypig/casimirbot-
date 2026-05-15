export const HELIX_LIVE_SOURCE_ANALYSIS_JOB_SCHEMA = "helix.live_source_analysis_job.v1" as const;

export type HelixLiveSourceAnalysisJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "suppressed";

export type HelixLiveSourceAnalysisJob = {
  schema: typeof HELIX_LIVE_SOURCE_ANALYSIS_JOB_SCHEMA;
  job_id: string;
  chunk_id: string;
  worker_id: string;
  thread_id: string;
  source_id: string;
  analyzer_id: string;
  status: HelixLiveSourceAnalysisJobStatus;
  output_refs: string[];
  summary: string;
  assistant_answer: false;
  raw_content_included: false;
};
