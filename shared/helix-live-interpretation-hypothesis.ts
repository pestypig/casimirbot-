import type { HelixLiveInterpretationLens } from "./helix-live-interpretation-run";

export const HELIX_LIVE_INTERPRETATION_HYPOTHESIS_SCHEMA =
  "helix.live_interpretation_hypothesis.v1" as const;

export type HelixLiveInterpretationHypothesisStatus =
  | "active"
  | "new"
  | "reinforced"
  | "unchanged"
  | "contradicted"
  | "superseded"
  | "rejected"
  | "stale"
  | "expired";

export type HelixLiveInterpretationHypothesis = {
  schema: typeof HELIX_LIVE_INTERPRETATION_HYPOTHESIS_SCHEMA;
  hypothesis_id: string;
  interpretation_worker_run_id: string;
  interpretation_run_id: string;
  situation_run_id: string;
  source_epoch: number;
  latest_source_epoch?: number;
  lens: HelixLiveInterpretationLens;
  kind?:
    | "observation"
    | "activity"
    | "object"
    | "uncertainty"
    | "verification"
    | "protocol"
    | "risk"
    | "workstation_affordance"
    | "user_notice";
  claim: string;
  normalized_key?: string | null;
  confidence: number;
  evidence_refs: string[];
  missing_evidence: string[];
  uncertainty: string[];
  supports?: string[];
  contradicts?: string[];
  supersedes?: string[];
  predicted_signals?: string[];
  recommended_next_check?: string;
  recommended_candidate?:
    | "none"
    | "silent_update"
    | "ask_handoff_candidate"
    | "plan_contract_candidate"
    | "request_user_input_candidate";
  status: HelixLiveInterpretationHypothesisStatus;
  stale_after_epoch_count?: number | null;
  validation_state?: Record<string, unknown>;
  expires_at: string;
  expired_at?: string | null;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};
