export const HELIX_STANDBY_CALLOUT_PROPOSAL_SCHEMA =
  "helix.standby_callout_proposal.v1" as const;
export const HELIX_STANDBY_CALLOUT_DELIVERY_RECEIPT_SCHEMA =
  "helix.standby_callout_delivery_receipt.v1" as const;

export type StandbyCalloutChannel = "none" | "ui_text" | "voice" | "voice_on_confirm";

export type StandbyCalloutMode =
  | "off"
  | "text_only"
  | "voice_on_confirm"
  | "critical_voice"
  | "direct_address_only";

export type StandbyCalloutPriority = "info" | "warn" | "critical" | "action";

export type StandbyCalloutProposal = {
  schema: typeof HELIX_STANDBY_CALLOUT_PROPOSAL_SCHEMA;
  proposal_id: string;
  room_id: string;
  thread_id?: string | null;
  graph_id?: string | null;
  episode_id?: string | null;
  salience_receipt_id?: string | null;
  reasoning_work_id?: string | null;
  priority: StandbyCalloutPriority;
  decision: "suppress" | "show_text" | "speak_on_confirm" | "speak_now" | "request_user_input";
  text: string;
  voice_text?: string | null;
  requires_confirmation: boolean;
  evidence_refs: string[];
  dedupe_key: string;
  cooldown_ms: number;
  created_at: string;
};

export type StandbyCalloutDeliveryReceipt = {
  schema: typeof HELIX_STANDBY_CALLOUT_DELIVERY_RECEIPT_SCHEMA;
  delivery_id: string;
  proposal_id: string;
  delivered: boolean;
  channel: StandbyCalloutChannel;
  reason:
    | "delivered"
    | "suppressed_policy"
    | "suppressed_cooldown"
    | "awaiting_confirmation"
    | "voice_not_enabled"
    | "user_busy"
    | "error";
  thread_id?: string | null;
  audio_event_id?: string | null;
  evidence_refs: string[];
  ts: string;
};
