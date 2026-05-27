export const LIVE_JOB_POLICY_OBSERVATION_SCHEMA =
  "helix.live_job_policy_observation.v1" as const;

export type LiveJobPolicyObservation = {
  schema: typeof LIVE_JOB_POLICY_OBSERVATION_SCHEMA;
  observation_id: string;
  contract_id: string;
  source_observation_refs: string[];
  job_name: string;
  status:
    | "observed"
    | "suppressed"
    | "trigger_matched"
    | "blocked"
    | "missing_input"
    | "stale"
    | "failed";
  event_kind:
    | "source_fresh"
    | "source_stale"
    | "source_missing"
    | "route_clean"
    | "route_drift_candidate"
    | "route_drift_confirmed"
    | "direct_address_detected"
    | "translation_segment_ready"
    | "visual_context_updated"
    | "no_trigger_matched"
    | "policy_conflict"
    | "unknown";
  summary: string;
  policy_evaluation: {
    operating_prompt_ref?: string;
    trigger_matched: boolean;
    matched_rules: string[];
    suppressed: boolean;
    suppression_reason?: string;
    evidence_threshold: "observed" | "likely" | "confirmed";
    confidence: "low" | "medium" | "high";
  };
  missing_requirements: Array<{
    requirement: string;
    reason: string;
    repair_action?: string;
  }>;
  output_candidates: Array<{
    output_kind:
      | "typed_commentary"
      | "route_evidence"
      | "voice_proposal"
      | "live_answers_card"
      | "source_health_status"
      | "translated_transcript";
    eligible: boolean;
    text?: string;
    reason: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
};
