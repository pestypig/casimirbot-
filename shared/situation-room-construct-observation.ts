export const SITUATION_ROOM_CONSTRUCT_OBSERVATION_SCHEMA =
  "helix.situation_room_construct_observation.v1" as const;

export type SituationRoomConstructObservation = {
  schema: typeof SITUATION_ROOM_CONSTRUCT_OBSERVATION_SCHEMA;
  observation_id: string;
  turn_id: string;
  action:
    | "construct.create_from_recipe"
    | "construct.set_operating_prompt"
    | "construct.attach_source"
    | "construct.bind_output"
    | "construct.activate"
    | "construct.pause"
    | "construct.resume"
    | "construct.detach"
    | "construct.query"
    | "construct.diagnose"
    | "voice_delivery.propose_from_trace"
    | "voice_delivery.confirm_speak";
  live_job_contract_ref?: string;
  construct_ids: string[];
  created_constructs: Array<{
    construct_id: string;
    name: string;
    role: "observer" | "translator" | "transcriber" | "route_watcher" | "source_health_watcher";
    authority: "witness_only" | "evidence_only" | "none";
    status: "created" | "active" | "blocked" | "stale" | "paused";
  }>;
  missing_inputs: string[];
  policy_state: {
    voice_policy: "muted" | "propose_only" | "confirm_speak_required" | "automatic_when_policy_allows";
    spoken: boolean;
    confirm_speak_receipt_present: boolean;
    output_authority: "proposal" | "confirmed_spoken" | "typed_only";
  };
  output_bindings: string[];
  source_status: Array<{
    source_kind: string;
    status: "connected" | "missing" | "stale" | "blocked" | "unknown";
    message: string;
  }>;
  diagnostics: Array<{
    code: string;
    message: string;
    severity: "info" | "warning" | "error";
  }>;
  terminal_eligible: false;
  panel_generated_answer: false;
  next_step_authority: "agent_step_decision";
  assistant_answer: false;
  raw_content_included: false;
};
