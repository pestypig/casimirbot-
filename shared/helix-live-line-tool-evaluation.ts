export const HELIX_LIVE_LINE_TOOL_EVALUATION_SCHEMA =
  "helix.live_line_tool_evaluation.v1" as const;

export type HelixLiveLineToolEvaluationSupport =
  | "supports"
  | "contradicts"
  | "partial"
  | "unknown";

export type HelixLiveLineToolEvaluation = {
  schema: typeof HELIX_LIVE_LINE_TOOL_EVALUATION_SCHEMA;
  evaluation_id: string;
  request_id: string;
  thread_id: string;
  line_key: string;
  tool_receipt_refs: string[];
  supports_line: HelixLiveLineToolEvaluationSupport;
  confidence_delta: number;
  next_line_value?: string | null;
  missing_evidence: string[];
  summary: string;
  deterministic: boolean;
  model_invoked: boolean;
  deterministic_content_role: "evidence_not_assistant_answer";
  raw_content_included: false;
  assistant_answer: false;
  created_at: string;
};
