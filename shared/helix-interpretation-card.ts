export const HELIX_INTERPRETATION_CARD_SCHEMA =
  "helix.interpretation_card.v1" as const;

export type HelixInterpretationCard = {
  schema: typeof HELIX_INTERPRETATION_CARD_SCHEMA;
  interpretation_id: string;
  thread_id: string;
  room_id?: string | null;
  title: string;
  summary: string;
  evidence_refs: string[];
  confidence: number;
  expires_at: string;
  model_invoked: boolean;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
