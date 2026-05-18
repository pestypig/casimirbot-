export const HELIX_LIVE_CONFIDENCE_UPDATE_SCHEMA =
  "helix.live_confidence_update.v1" as const;

export type HelixLiveConfidenceUpdate = {
  schema: typeof HELIX_LIVE_CONFIDENCE_UPDATE_SCHEMA;
  confidence_update_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  field_key?: string | null;
  prediction_id: string;
  probe_result_id: string;
  prior_confidence: number | null;
  confidence_delta: number;
  updated_confidence: number | null;
  reason: string;
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
  created_at: string;
};

