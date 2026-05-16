export const HELIX_LIVE_SOURCE_PRODUCER_LIFECYCLE_EVENT_SCHEMA =
  "helix.live_source_producer_lifecycle_event.v1" as const;

export type HelixLiveSourceProducerLifecycleKind =
  | "producer_created"
  | "producer_bound"
  | "cadence_set"
  | "client_stream_confirmed"
  | "interval_started"
  | "capture_due"
  | "frame_captured"
  | "chunk_posted"
  | "analysis_queued"
  | "analysis_completed"
  | "card_updated"
  | "interval_paused"
  | "producer_stale"
  | "producer_error";

export type HelixLiveSourceProducerLifecycleStatus =
  | "ok"
  | "failed"
  | "blocked"
  | "waiting";

export type HelixLiveSourceProducerLifecycleEvent = {
  schema: typeof HELIX_LIVE_SOURCE_PRODUCER_LIFECYCLE_EVENT_SCHEMA;
  event_id: string;
  producer_id: string;
  source_id: string;
  thread_id: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  kind: HelixLiveSourceProducerLifecycleKind;
  status: HelixLiveSourceProducerLifecycleStatus;
  summary: string;
  related_ids: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
