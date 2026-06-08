export const HELIX_MODEL_OBSERVATION_PACKET_SCHEMA =
  "helix.model_observation_packet.v1" as const;

export type HelixModelObservationSource =
  | "tool"
  | "repo_code"
  | "scholarly_research"
  | "internet_search"
  | "docs"
  | "active_doc"
  | "visual_capture"
  | "situation_room"
  | "runtime_evidence"
  | "model_only";

export type HelixModelObservationStatus =
  | "succeeded"
  | "blocked"
  | "missing_input"
  | "needs_confirmation"
  | "failed"
  | "client_pending"
  | "unknown";

export type HelixModelObservationPacket = {
  schema: typeof HELIX_MODEL_OBSERVATION_PACKET_SCHEMA;
  turn_id: string;
  iteration?: number;
  observation_ref: string;
  source: HelixModelObservationSource;
  source_target?: string;
  capability_key?: string;
  panel_id?: string;
  action?: string;
  status: HelixModelObservationStatus;
  user_requested: string;
  found: string[];
  proves: string[];
  support_refs: string[];
  missing_or_uncertain: string[];
  suggested_next_steps: Array<
    "answer" | "ask_user" | "use_another_tool" | "repair" | "fail_closed"
  >;
  raw_debug_ref?: string;
  exact_excerpt_refs?: string[];
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
