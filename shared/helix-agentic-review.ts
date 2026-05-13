export const HELIX_LIVE_AGENTIC_REVIEW_REQUEST_SCHEMA =
  "helix.live_agentic_review_request.v1" as const;
export const HELIX_LIVE_AGENTIC_REVIEW_RESULT_SCHEMA =
  "helix.live_agentic_review_result.v1" as const;

export type LiveAgenticReviewTrigger =
  | "user_direct"
  | "commentary_request"
  | "salience_threshold"
  | "windowed_review"
  | "manual_button";

export type LiveAgenticReviewAllowedOutput =
  | "silent_keep_in_context"
  | "update_lines"
  | "show_text"
  | "request_user_input"
  | "answer_user";

export type LiveAgenticReviewRequest = {
  schema: typeof HELIX_LIVE_AGENTIC_REVIEW_REQUEST_SCHEMA;
  review_id: string;
  thread_id: string;
  environment_id: string;
  trigger: LiveAgenticReviewTrigger;
  question: string;
  compact_context_pack_id?: string | null;
  allowed_outputs: LiveAgenticReviewAllowedOutput[];
  evidence_refs: string[];
  created_at: string;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};

export type LiveAgenticReviewResult = {
  schema: typeof HELIX_LIVE_AGENTIC_REVIEW_RESULT_SCHEMA;
  review_id: string;
  thread_id: string;
  environment_id: string;
  decision: LiveAgenticReviewAllowedOutput;
  summary: string;
  recommendation?: string | null;
  line_updates?: Record<string, string>;
  evidence_refs: string[];
  model_invoked: true;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
  created_at: string;
};

export type LiveAgenticReviewReceipt = {
  schema: "helix.live_agentic_review_receipt.v1";
  ok: boolean;
  request: LiveAgenticReviewRequest | null;
  result?: LiveAgenticReviewResult | null;
  error?: string | null;
};
