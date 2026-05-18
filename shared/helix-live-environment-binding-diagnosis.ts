export const HELIX_LIVE_ENVIRONMENT_BINDING_DIAGNOSIS_SCHEMA =
  "helix.live_environment_binding_diagnosis.v1" as const;

export type HelixLiveEnvironmentBindingDiagnosisBlockingReason =
  | "none"
  | "producer_stale"
  | "no_active_situation_run"
  | "no_field_evaluations"
  | "no_interpretation_artifacts"
  | "panel_unbound"
  | "cadence_mismatch"
  | "client_adoption_pending";

export type HelixLiveEnvironmentBindingDiagnosisNextAction =
  | "none"
  | "capture_frame_now"
  | "bind_producer_to_live_environment"
  | "create_or_resume_situation_run"
  | "run_field_workers_for_latest_observation"
  | "repair_card_projection_binding"
  | "reconcile_cadence";

export type HelixLiveEnvironmentBindingDiagnosis = {
  schema: typeof HELIX_LIVE_ENVIRONMENT_BINDING_DIAGNOSIS_SCHEMA;
  diagnosis_id: string;
  turn_id: string;
  thread_id: string;
  target_source: "visual_capture";
  source_id?: string | null;
  producer_id?: string | null;
  live_environment_id?: string | null;
  situation_run_id?: string | null;
  producer_status: "missing" | "requested" | "adopted" | "bound" | "stale" | "fresh";
  client_adoption_status: "missing" | "requested" | "adopted" | "failed";
  client_interval_active: boolean;
  server_cadence_ms?: number | null;
  client_observed_cadence_ms?: number | null;
  cadence_match: boolean;
  capture_ready: boolean;
  scene_procedure_ready: boolean;
  live_card_ready: boolean;
  active_situation_context_status: "active" | "missing" | "stale" | "unbound" | "not_selected";
  latest_observation_ref?: string | null;
  latest_field_evaluation_refs: string[];
  latest_interpretation_refs: string[];
  latest_card_delta_at?: string | null;
  blocking_reason: HelixLiveEnvironmentBindingDiagnosisBlockingReason;
  next_required_action: HelixLiveEnvironmentBindingDiagnosisNextAction;
  summary: string;
  assistant_answer: false;
  raw_content_included: false;
};
