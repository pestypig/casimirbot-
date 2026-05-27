export const VOICE_PROPOSAL_SCHEMA = "helix.voice_proposal.v1" as const;
export const VOICE_DELIVERY_RECEIPT_SCHEMA = "helix.voice_delivery_receipt.v1" as const;

export type VoiceProposal = {
  schema: typeof VOICE_PROPOSAL_SCHEMA;
  proposal_id: string;
  source_observation_refs: string[];
  proposed_text: string;
  reason: string;
  voice_policy:
    | "muted"
    | "propose_only"
    | "confirm_speak_required"
    | "automatic_when_policy_allows";
  spoken: false;
  confirm_speak_receipt_present: false;
  output_authority: "proposal";
  assistant_answer: false;
  raw_content_included: false;
};

export type VoiceDeliveryReceipt = {
  schema: typeof VOICE_DELIVERY_RECEIPT_SCHEMA;
  receipt_id: string;
  proposal_id: string;
  spoken: true;
  confirm_speak_receipt_present: true;
  output_authority: "confirmed_spoken";
  spoken_text: string;
  delivered_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
