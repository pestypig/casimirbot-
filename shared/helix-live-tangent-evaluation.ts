export const HELIX_LIVE_TANGENT_EVALUATION_SCHEMA =
  "helix.live_tangent_evaluation.v1" as const;

export type HelixLiveTangentEvaluation = {
  schema: typeof HELIX_LIVE_TANGENT_EVALUATION_SCHEMA;
  tangent_id: string;
  situation_run_id: string;
  thread_id: string;
  tangent_type: string;
  claim: string;
  confidence: number;
  evidence_refs: string[];
  recommended_handoff?: {
    type: "none" | "ask_handoff" | "plan_contract" | "request_user_input";
    reason: string;
  };
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};
