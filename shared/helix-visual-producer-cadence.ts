import type { HelixLiveSourceCaptureMode } from "./helix-live-source-producer";

export const HELIX_VISUAL_PRODUCER_CADENCE_SCHEMA = "helix.visual_producer_cadence.v1" as const;

export type HelixVisualProducerCadenceStatus =
  | "active"
  | "paused"
  | "waiting_for_client"
  | "permission_required"
  | "stale"
  | "stopped"
  | "error";

export type HelixVisualProducerCadence = {
  schema: typeof HELIX_VISUAL_PRODUCER_CADENCE_SCHEMA;
  producer_id: string;
  source_id: string;
  thread_id: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  capture_mode: Extract<HelixLiveSourceCaptureMode, "manual" | "interval" | "salience_triggered">;
  cadence_ms?: number | null;
  status: HelixVisualProducerCadenceStatus;
  next_capture_due_at?: string | null;
  last_capture_at?: string | null;
  last_chunk_id?: string | null;
  client_stream_confirmed: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixVisualProducerCadenceReceipt = {
  schema: "helix.visual_producer_cadence_receipt.v1";
  receipt_id: string;
  action_id: "situation-room.live-source.set_rate";
  producer_id: string;
  source_id: string;
  thread_id: string;
  cadence_ms?: number | null;
  capture_mode: Extract<HelixLiveSourceCaptureMode, "manual" | "interval" | "salience_triggered">;
  cadence: HelixVisualProducerCadence;
  ok: boolean;
  summary: string;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
