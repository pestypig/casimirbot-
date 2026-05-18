import type { HelixLiveSituationProbeType } from "./helix-live-situation-prediction";

export const HELIX_LIVE_OBSERVATION_PROBE_SCHEMA =
  "helix.live_observation_probe.v1" as const;

export type HelixLiveObservationProbeStatus =
  | "waiting_for_observation"
  | "running_comparison"
  | "completed"
  | "blocked_unbound"
  | "expired";

export type HelixLiveObservationProbe = {
  schema: typeof HELIX_LIVE_OBSERVATION_PROBE_SCHEMA;
  probe_id: string;
  prediction_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  source_epoch: number;
  probe_type: HelixLiveSituationProbeType;
  expected_observation_signals: string[];
  status: HelixLiveObservationProbeStatus;
  expires_at: string;
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
};

