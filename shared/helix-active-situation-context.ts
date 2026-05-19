export const HELIX_ACTIVE_SITUATION_CONTEXT_SCHEMA =
  "helix.active_situation_context.v1" as const;

export type HelixActiveSituationContextStatus =
  | "active"
  | "stale"
  | "missing"
  | "unbound"
  | "no_fresh_evidence";

export type HelixActiveSituationContext = {
  schema: typeof HELIX_ACTIVE_SITUATION_CONTEXT_SCHEMA;
  context_id: string;
  thread_id: string;
  situation_run_id?: string | null;
  environment_id?: string | null;
  source_binding_ids: string[];
  source_binding_status_refs: string[];
  observed_unbound_source_refs: string[];
  repair_candidate_refs: string[];
  latest_epoch?: number | null;
  active_modalities: string[];
  latest_observation_refs: string[];
  latest_field_evaluation_refs: string[];
  latest_probe_result_refs: string[];
  latest_closure_refs: string[];
  latest_source_descriptor_refs: string[];
  status: HelixActiveSituationContextStatus;
  freshness_summary: string;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
