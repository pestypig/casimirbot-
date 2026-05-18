export const HELIX_LIVE_SITUATION_PREDICTION_SCHEMA =
  "helix.live_situation_prediction.v1" as const;

export type HelixLiveSituationPredictionStatus =
  | "proposed"
  | "active"
  | "tested"
  | "satisfied"
  | "contradicted"
  | "inconclusive"
  | "expired";

export type HelixLiveSituationProbeType =
  | "passive_next_frame"
  | "compare_recent_frames"
  | "request_user_input"
  | "plan_contract_candidate";

export type HelixLiveSituationPrediction = {
  schema: typeof HELIX_LIVE_SITUATION_PREDICTION_SCHEMA;
  prediction_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  source_epoch: number;
  field_key: string;
  based_on_evaluation_refs: string[];
  claim: string;
  expected_observation_signals: string[];
  probe_type: HelixLiveSituationProbeType;
  confidence: number;
  status: HelixLiveSituationPredictionStatus;
  expires_at: string;
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};

