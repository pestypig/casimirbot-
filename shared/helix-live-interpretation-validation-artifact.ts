export const HELIX_LIVE_INTERPRETATION_VALIDATION_ARTIFACT_SCHEMA =
  "helix.live_interpretation_validation_artifact.v1" as const;

export type HelixLiveInterpretationValidationArtifactType =
  | "observation"
  | "hypothesis_candidate"
  | "reinforcement"
  | "contradiction"
  | "supersession"
  | "expiry"
  | "uncertainty"
  | "risk_notice"
  | "protocol_notice"
  | "affordance_notice"
  | "user_notice_candidate"
  | "gate_block";

export type HelixLiveInterpretationValidationArtifact = {
  schema: typeof HELIX_LIVE_INTERPRETATION_VALIDATION_ARTIFACT_SCHEMA;
  validation_artifact_id: string;
  interpretation_run_id: string;
  interpretation_worker_run_id: string;
  scene_epoch_id: string;
  artifact_type: HelixLiveInterpretationValidationArtifactType;
  payload: Record<string, unknown>;
  confidence?: number | null;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
  created_at: string;
};
