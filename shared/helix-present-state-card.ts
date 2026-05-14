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
  last_interpreted_event_id?: string | null;
  go_to_log_target?: string | null;
  updated_at: string;
};
