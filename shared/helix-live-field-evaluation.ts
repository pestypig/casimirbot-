export const HELIX_LIVE_FIELD_EVALUATION_SCHEMA =
  "helix.live_field_evaluation.v1" as const;

export type HelixLiveFieldEvaluationStatus =
  | "supported"
  | "tentative"
  | "uncertain"
  | "contradicted"
  | "blocked"
  | "expired";

export type HelixLiveFieldEvaluation = {
  schema: typeof HELIX_LIVE_FIELD_EVALUATION_SCHEMA;
  evaluation_id: string;
  worker_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  field_key: string;
  value: string;
  status: HelixLiveFieldEvaluationStatus;
  confidence: number;
  evidence_refs: string[];
  missing_evidence: string[];
  corroboration_state: Record<string, "present" | "missing_not_required" | "missing_required" | "stale" | "not_applicable">;
  next_check: string;
  expires_at: string;
  role: "ui_projection";
  assistant_answer: false;
  raw_content_included: false;
};
