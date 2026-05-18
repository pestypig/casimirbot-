export const HELIX_LIVE_PROCEDURE_EPOCH_SCHEMA =
  "helix.live_procedure_epoch.v1" as const;

export type HelixLiveProcedureEpoch = {
  schema: typeof HELIX_LIVE_PROCEDURE_EPOCH_SCHEMA;
  epoch_id: string;
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  epoch: number;
  observation_refs: string[];
  field_evaluation_refs: string[];
  prediction_refs: string[];
  probe_result_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  role: "validation";
  created_at: string;
};

