export const HELIX_SITUATION_NARRATION_RECEIPT_SCHEMA =
  "helix.situation_narration_receipt.v1" as const;

export type SituationNarrationMode =
  | "deterministic_template"
  | "llm_micro_reasoning";

export type SituationNarrationReceipt = {
  schema: typeof HELIX_SITUATION_NARRATION_RECEIPT_SCHEMA;
  narration_id: string;
  room_id: string;
  graph_id?: string | null;
  source_signal_ids: string[];
  semantic_event_ids: string[];
  mode: SituationNarrationMode;
  text: string;
  perspective: "third_person";
  inferred_intent?: string | null;
  inferred_intent_confidence?: number | null;
  prediction?: string | null;
  prediction_confidence?: number | null;
  memory_policy: "ignore" | "session_keep" | "promote_to_goal_context";
  evidence_refs: string[];
  ts: string;
};
