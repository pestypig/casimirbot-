export const HELIX_LIVE_SOURCE_IDENTITY_SCHEMA =
  "helix.live_source_identity.v1" as const;

export type HelixLiveSourceSurface =
  | "screen"
  | "window"
  | "browser_tab"
  | "camera"
  | "unknown";

export type HelixLiveSourceOrigin =
  | "browser_getDisplayMedia"
  | "browser_getUserMedia"
  | "client_upload"
  | "server_event"
  | "manual"
  | string;

export type HelixLiveSourceConsentState =
  | "not_required"
  | "requested"
  | "granted"
  | "revoked";

export type HelixLiveSourceBindingStatus =
  | "bound"
  | "observed_unbound"
  | "stale"
  | "missing"
  | "pending_repair"
  | "detached";

export type HelixLiveSourceIdentity = {
  schema: typeof HELIX_LIVE_SOURCE_IDENTITY_SCHEMA;
  source_id: string;
  thread_id: string;
  environment_id: string | null;
  source_binding_id: string | null;
  producer_id?: string | null;
  modality:
    | "visual_frame"
    | "audio_transcript"
    | "world_event"
    | "document_context"
    | "note_context"
    | "calculator_stream"
    | "process_graph"
    | string;
  source_surface: HelixLiveSourceSurface;
  source_origin: HelixLiveSourceOrigin;
  consent_state: HelixLiveSourceConsentState;
  binding_status: HelixLiveSourceBindingStatus;
  capture_session_id: string | null;
  surface_fingerprint?: string | null;
  latest_epoch: number;
  latest_observation_id?: string | null;
  latest_evidence_refs: string[];
  freshness_ms?: number | null;
  assistant_answer: false;
  raw_content_included: false;
};

export const liveSourceIdentityRefFor = (identity: Pick<HelixLiveSourceIdentity, "source_id" | "thread_id" | "latest_epoch">): string =>
  `live_source_identity:${identity.thread_id}:${identity.source_id}:epoch:${identity.latest_epoch}`;
