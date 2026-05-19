export const HELIX_LIVE_ENVIRONMENT_BINDING_DIAGNOSIS_SCHEMA =
  "helix.live_environment_binding_diagnosis.v2" as const;

export type HelixLiveEnvironmentBindingDiagnosisBlockingReason =
  | "none"
  | "client_adoption_pending"
  | "producer_missing"
  | "producer_stale"
  | "source_not_fresh"
  | "cadence_mismatch"
  | "no_active_situation_run"
  | "no_latest_observation"
  | "no_field_evaluations"
  | "no_interpretation_artifacts"
  | "procedure_memory_unavailable"
  | "panel_unbound"
  | "card_delta_missing";

export type HelixLiveEnvironmentBindingDiagnosisNextAction =
  | "none"
  | "request_or_adopt_capture"
  | "capture_frame_now"
  | "bind_producer_to_live_environment"
  | "create_or_resume_situation_run"
  | "run_field_workers_for_latest_observation"
  | "run_interpretation_workers_for_latest_evaluations"
  | "repair_procedure_memory"
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
  capture_ready: boolean;
  producer_status: "missing" | "requested" | "adopted" | "bound" | "fresh" | "stale" | "failed";
  client_adoption_status: "missing" | "requested" | "adopted" | "failed";
  client_interval_active: boolean;
  cadence_match: boolean;
  server_cadence_ms?: number | null;
  client_observed_cadence_ms?: number | null;
  source_freshness: {
    status: "fresh" | "stale" | "unknown";
    last_capture_at?: string | null;
    last_chunk_id?: string | null;
    last_analysis_job_id?: string | null;
    last_visual_evidence_id?: string | null;
    stale_reason?: string | null;
  };
  scene_procedure_ready: boolean;
  active_situation_run_status:
    | "active"
    | "missing"
    | "stale"
    | "unbound"
    | "no_fresh_evidence"
    | "not_selected";
  latest_observation_refs: string[];
  field_evaluation_refs: string[];
  interpretation_refs: string[];
  procedure_memory_status: "available" | "unavailable" | "not_requested" | "unknown";
  live_card_ready: boolean;
  card_delta_status: "fresh" | "missing" | "stale" | "panel_unbound" | "unknown";
  latest_card_delta_at?: string | null;
  blocking_reason: HelixLiveEnvironmentBindingDiagnosisBlockingReason;
  next_required_action: HelixLiveEnvironmentBindingDiagnosisNextAction;
  auntie_dot: {
    sensor_readiness_summary: string;
    mission_state_summary: string;
  };
  summary: string;
  assistant_answer: false;
  raw_content_included: false;
};
