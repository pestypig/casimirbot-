export const HELIX_LIVE_ARBITRATION_CANDIDATE_SCHEMA =
  "helix.live_arbitration_candidate.v1" as const;

export type HelixLiveArbitrationCandidateType =
  | "silent_update"
  | "ask_handoff_candidate"
  | "plan_contract_candidate"
  | "request_user_input_candidate"
  | "suppress";

export type HelixLiveArbitrationCandidatePriority =
  | "info"
  | "notice"
  | "warn"
  | "critical";

export type HelixLiveArbitrationCandidateStatus =
  | "pending"
  | "consumed"
  | "dismissed"
  | "expired"
  | "suppressed";

export type HelixLiveArbitrationCandidate = {
  schema: typeof HELIX_LIVE_ARBITRATION_CANDIDATE_SCHEMA;
  candidate_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  epoch: number;
  candidate_type: HelixLiveArbitrationCandidateType;
  reason: string;
  priority: HelixLiveArbitrationCandidatePriority;
  evidence_refs: string[];
  field_evaluation_refs: string[];
  tangent_refs: string[];
  proposed_output?: {
    handoff_type?: string;
    question?: string;
    plan_action_id?: string;
    missing_input?: string;
  };
  status: HelixLiveArbitrationCandidateStatus;
  expires_at: string;
  assistant_answer: false;
  raw_content_included: false;
};

