import type { HelixLiveSourcePipelinePlan } from "./helix-live-source-pipeline-plan";

export const HELIX_LIVE_SOURCE_PIPELINE_RECEIPT_SCHEMA = "helix.live_source_pipeline_receipt.v1" as const;

export type HelixLiveSourcePipelineStatus =
  | "planned"
  | "active"
  | "paused"
  | "stopped"
  | "archived"
  | "error";

export type HelixLiveSourcePipelineReceipt = {
  schema: typeof HELIX_LIVE_SOURCE_PIPELINE_RECEIPT_SCHEMA;
  receipt_id: string;
  pipeline_id: string;
  plan_id: string;
  thread_id: string;
  environment_id?: string | null;
  status: HelixLiveSourcePipelineStatus;
  source_producer_ids: string[];
  analysis_job_ids: string[];
  worker_lane_ids: string[];
  missing_capabilities: string[];
  next_repair_actions: string[];
  ok: boolean;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};

export type HelixLiveSourcePipelineDashboard = {
  schema: "helix.live_source_pipeline_dashboard.v1";
  pipeline_id: string;
  plan: HelixLiveSourcePipelinePlan;
  receipt: HelixLiveSourcePipelineReceipt;
  producers: unknown[];
  chunks: unknown[];
  analysis_jobs: unknown[];
  worker_lanes: unknown[];
  buffer_status: unknown;
  source_capabilities: unknown[];
  live_card: unknown;
  missing_capabilities: string[];
  next_repair_actions: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};
