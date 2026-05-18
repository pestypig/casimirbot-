import type { HelixLiveInterpretationLens } from "./helix-live-interpretation-run";

export const HELIX_LIVE_INTERPRETATION_HYPOTHESIS_SCHEMA =
  "helix.live_interpretation_hypothesis.v1" as const;

export type HelixLiveInterpretationHypothesisStatus =
  | "new"
  | "reinforced"
  | "unchanged"
  | "contradicted"
  | "superseded"
  | "stale"
  | "expired";

export type HelixLiveInterpretationHypothesis = {
  schema: typeof HELIX_LIVE_INTERPRETATION_HYPOTHESIS_SCHEMA;
  hypothesis_id: string;
  interpretation_worker_run_id: string;
  interpretation_run_id: string;
  situation_run_id: string;
  source_epoch: number;
  lens: HelixLiveInterpretationLens;
  claim: string;
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
  expires_at: string;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};
