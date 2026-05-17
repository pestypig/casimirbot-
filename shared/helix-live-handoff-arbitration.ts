export const HELIX_LIVE_HANDOFF_ARBITRATION_SCHEMA =
  "helix.live_handoff_arbitration.v1" as const;

export type HelixLiveHandoffArbitrationDecision =
  | "silent_update"
  | "ask_handoff_candidate"
  | "plan_contract_candidate"
  | "request_user_input_candidate"
  | "blocked"
  | "terminal_waiting";

export type HelixLiveHandoffArbitration = {
  schema: typeof HELIX_LIVE_HANDOFF_ARBITRATION_SCHEMA;
  arbitration_id: string;
  situation_run_id: string;
  thread_id: string;
  decision: HelixLiveHandoffArbitrationDecision;
  candidate?: {
    type: "none" | "ask_handoff" | "plan_contract" | "request_user_input";
    reason: string;
    evidence_refs: string[];
  } | null;
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
  created_at: string;
};
