export const HELIX_LIVE_PROBE_RESULT_SCHEMA =
  "helix.live_probe_result.v1" as const;

export type HelixLiveProbeResultStatus =
  | "satisfied"
  | "contradicted"
  | "inconclusive"
  | "expired"
  | "blocked";

export type HelixLiveProbeResult = {
  schema: typeof HELIX_LIVE_PROBE_RESULT_SCHEMA;
  probe_result_id: string;
  prediction_id: string;
  probe_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  tested_at_epoch: number;
  status: HelixLiveProbeResultStatus;
  observed_signals: string[];
  evidence_refs: string[];
  confidence_delta: number;
  spawned_tangent_refs: string[];
  spawned_candidate_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
  created_at: string;
};

