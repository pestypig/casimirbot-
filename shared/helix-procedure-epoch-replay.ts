export const HELIX_PROCEDURE_EPOCH_REPLAY_SCHEMA =
  "helix.procedure_epoch_replay.v1" as const;

export type HelixProcedureEpochReplay = {
  schema: typeof HELIX_PROCEDURE_EPOCH_REPLAY_SCHEMA;
  replay_id: string;
  turn_id: string;
  thread_id: string;
  situation_run_id: string | null;
  current_epoch: number | null;
  previous_epoch: number | null;
  current_observation: string | null;
  previous_observation: string | null;
  changed_elements: string[];
  unchanged_elements: string[];
  uncertainty: string[];
  current_observation_refs: string[];
  previous_observation_refs: string[];
  current_field_evaluation_refs: string[];
  previous_field_evaluation_refs: string[];
  probe_result_refs: string[];
  epoch_closure_refs: string[];
  evidence_refs: string[];
  comparison_confidence: number;
  assistant_answer: false;
  raw_content_included: false;
};

