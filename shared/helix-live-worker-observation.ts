export const HELIX_LIVE_WORKER_OBSERVATION_SCHEMA =
  "helix.live_worker_observation.v1" as const;

export type HelixLiveWorkerObservation = {
  schema: typeof HELIX_LIVE_WORKER_OBSERVATION_SCHEMA;
  observation_id: string;
  worker_id: string;
  run_id: string;
  thread_id: string;
  environment_id: string;
  kind: "toolObservation" | "validation" | "ui_projection" | "request_user_input";
  summary: string;
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};
