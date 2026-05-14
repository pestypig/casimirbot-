export const HELIX_GAME_UTILITY_HYPOTHESIS_SCHEMA =
  "helix.game_utility_hypothesis.v1" as const;

export type GameUtilityHypothesis = {
  schema: typeof HELIX_GAME_UTILITY_HYPOTHESIS_SCHEMA;
  hypothesis_id: string;
  thread_id: string;
  room_id: string;
  game_id: "minecraft" | string;
  subject_ref: string;
  utility_label: string;
  status: "possible" | "likely" | "confirmed" | "contradicted" | "unknown";
  confidence: number;
  supporting_evidence_refs: string[];
  missing_evidence: string[];
  semantic_entry_refs: string[];
  raw_logs_included: false;
  assistant_answer: false;
  model_invoked: boolean;
  deterministic: boolean;
  ts: string;
};
