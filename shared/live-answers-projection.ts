export const LIVE_ANSWERS_PROJECTION_SCHEMA =
  "helix.live_answers_projection.v1" as const;

export type LiveAnswersProjection = {
  schema: typeof LIVE_ANSWERS_PROJECTION_SCHEMA;
  projection_id: string;
  created_at: string;
  contract_id?: string | null;
  source_observation_refs: string[];
  policy_observation_refs: string[];
  voice_proposal_refs: string[];
  display_kind:
    | "route_status"
    | "source_health"
    | "dottie_status"
    | "voice_proposal"
    | "job_diagnostic";
  display_summary: string;
  state: {
    job_status?: string;
    route_state?: "on_route" | "drift_candidate" | "drift_confirmed" | "unknown";
    source_freshness?: "fresh" | "stale" | "missing" | "blocked" | "unknown";
    dottie_status?: "holding_quiet" | "trigger_matched" | "blocked" | "stale";
    voice_status?: "none" | "proposal_only" | "confirmed_spoken";
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};
