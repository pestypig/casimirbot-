export const HELIX_PRESENT_STATE_CARD_SCHEMA =
  "helix.present_state_card.v1" as const;

export type HelixPresentStateCardStatus =
  | "active"
  | "paused"
  | "completed"
  | "error";

export type HelixPresentStateCardLine = {
  key: string;
  label: string;
  value: string;
  confidence?: number | null;
  evidence_refs: string[];
  missing_evidence?: string[];
  next_best_tool?: string | null;
  last_check_result?: string | null;
  source_coverage?: import("./helix-live-card-line-state").HelixLiveCardLineSourceCoverage;
  reasoner_id?: string | null;
  source?: import("./helix-live-card-line-projection").HelixLiveCardLineProjectionSource;
  updated_at: string;
};

export type HelixPresentStateCard = {
  schema: typeof HELIX_PRESENT_STATE_CARD_SCHEMA;
  card_id: string;
  thread_id: string;
  room_id?: string | null;
  title: string;
  status: HelixPresentStateCardStatus;
  lines: HelixPresentStateCardLine[];
  pending_request_input?: import("./helix-agentic-request-input").HelixAgenticRequestInput | null;
  line_states?: import("./helix-live-card-line-state").HelixLiveCardLineState[];
  live_card_line_projection?: import("./helix-live-card-line-projection").HelixLiveCardLineProjection | null;
  present_state_synthesis?: import("./helix-present-state-synthesis").HelixPresentStateSynthesis | null;
  fidelity_profile?: import("./helix-live-environment-fidelity").HelixLiveEnvironmentFidelity | null;
  last_interpreted_event_id?: string | null;
  go_to_log_target?: string | null;
  updated_at: string;
};
