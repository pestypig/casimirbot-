export const HELIX_INTERJECTION_INVESTIGATION_SCHEMA =
  "helix.interjection_investigation.v1" as const;
export const HELIX_INTERJECTION_DECISION_SCHEMA =
  "helix.interjection_decision.v1" as const;

export type HelixInterjectionInvestigationTrigger =
  | "critical_salience"
  | "risk_detected"
  | "goal_blocked"
  | "goal_progress"
  | "user_confusion"
  | "source_health"
  | "manual_review";

export type HelixInterjectionInvestigation = {
  schema: typeof HELIX_INTERJECTION_INVESTIGATION_SCHEMA;
  investigation_id: string;
  thread_id: string;
  room_id: string;
  trigger: HelixInterjectionInvestigationTrigger;
  mission_memory_hash: string;
  evidence_refs: string[];
  episode_ids: string[];
  salience_receipt_ids: string[];
  question: "should_interject";
  allowed_outputs: [
    "silent_keep_in_context",
    "show_text",
    "voice_on_confirm",
    "request_user_input",
  ];
  created_at: string;
};

export type HelixInterjectionDecision = {
  schema: typeof HELIX_INTERJECTION_DECISION_SCHEMA;
  decision_id: string;
  investigation_id: string;
  thread_id: string;
  decision:
    | "silent_keep_in_context"
    | "show_text"
    | "voice_on_confirm"
    | "request_user_input";
  text?: string | null;
  reason: string;
  confidence: number;
  evidence_refs: string[];
  model_invoked: boolean;
  deterministic_gate?: boolean;
  ts: string;
};

export type HelixInterjectionInvestigationReceipt = {
  ok: boolean;
  schema: "helix.interjection_investigation_receipt.v1";
  investigation?: HelixInterjectionInvestigation | null;
  decision?: HelixInterjectionDecision | null;
  error?: string | null;
  message: string;
};

