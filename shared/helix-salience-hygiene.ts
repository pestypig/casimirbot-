export const HELIX_SALIENCE_HYGIENE_DECISION_SCHEMA =
  "helix.salience_hygiene_decision.v1" as const;

export type HelixSalienceHygieneDecision = {
  schema: typeof HELIX_SALIENCE_HYGIENE_DECISION_SCHEMA;
  decision_id: string;
  source_event_ref: string;
  situation_run_id?: string | null;
  salience_receipt_ref?: string | null;
  decision: "allow" | "dedupe" | "projection_only" | "suppress" | "resolve";
  reason: string;
  cooldown_until?: string | null;
  assistant_answer: false;
};
