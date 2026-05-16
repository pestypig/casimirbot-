import type { HelixLiveSourceCaptureMode } from "./helix-live-source-producer";

export const HELIX_VISUAL_PRODUCER_SCHEDULER_ADOPTION_SCHEMA =
  "helix.visual_producer_scheduler_adoption.v1" as const;

export type HelixVisualProducerSchedulerAdoptionStatus =
  | "adopted"
  | "waiting_for_stream"
  | "waiting_for_environment"
  | "paused"
  | "stopped"
  | "error";

export type HelixVisualProducerSchedulerAdoption = {
  schema: typeof HELIX_VISUAL_PRODUCER_SCHEDULER_ADOPTION_SCHEMA;
  adoption_id: string;
  producer_id: string;
  source_id: string;
  thread_id: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  cadence_ms: number | null;
  capture_mode: Extract<HelixLiveSourceCaptureMode, "manual" | "interval" | "salience_triggered">;
  client_stream_confirmed: boolean;
  interval_active: boolean;
  next_capture_due_at?: string | null;
  last_capture_at?: string | null;
  last_chunk_id?: string | null;
  status: HelixVisualProducerSchedulerAdoptionStatus;
  summary: string;
  assistant_answer: false;
  raw_content_included: false;
};
