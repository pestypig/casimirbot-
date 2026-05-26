export const HELIX_LIVE_ENVIRONMENT_RUNTIME_PACKET_SCHEMA =
  "helix.live_environment_runtime_packet.v1" as const;
export const HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA =
  "helix.live_agent_step_decision.v1" as const;
export const HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA =
  "helix.live_environment_tool_observation.v1" as const;
export const HELIX_LIVE_ENVIRONMENT_AGENT_LOOP_SCHEMA =
  "helix.live_environment_agent_loop.v1" as const;

export type HelixLiveEnvironmentToolName =
  | "live_env.read_card"
  | "live_env.query_event_log"
  | "live_env.query_world_events"
  | "live_env.query_navigation_state"
  | "live_env.query_source_health"
  | "live_env.request_probe"
  | "live_env.spawn_field_worker"
  | "live_env.record_commentary"
  | "live_env.evaluate_goal_satisfaction";

export type HelixLiveEnvironmentAgentNextStep =
  | "call_tool"
  | "spawn_field_worker"
  | "record_commentary"
  | "ask_user"
  | "answer"
  | "fail_closed";

export type HelixLiveEnvironmentRuntimePacket = {
  schema: typeof HELIX_LIVE_ENVIRONMENT_RUNTIME_PACKET_SCHEMA;
  packet_id: string;
  thread_id: string;
  environment_id?: string | null;
  room_id?: string | null;
  mode: "auntie_dottie" | "operator" | "ambient_field_worker";
  current_goal: {
    goal_id: string;
    goal_kind:
      | "minecraft_route_assist"
      | "visual_context_question"
      | "source_health_check"
      | "workstation_operator_review"
      | "translation_support"
      | "browser_claim_review"
      | "live_environment_review";
    user_visible_goal_summary: string;
    terminal_contract: {
      allowed_terminal_kinds: string[];
      forbidden_terminal_kinds: string[];
      requires_goal_satisfaction: true;
    };
  };
  live_card_snapshot: {
    line_keys: string[];
    stale_lines: string[];
    missing_evidence_lines: string[];
  };
  recent_commentary_refs: string[];
  recent_event_refs: string[];
  source_health_refs: string[];
  navigation_state_ref?: string | null;
  missing_evidence: string[];
  available_tools: Array<{
    tool_id: HelixLiveEnvironmentToolName;
    family: "live_env";
    creates_assistant_answer: false;
    requires_user_confirmation: boolean;
    can_run_automatically: boolean;
  }>;
  policy: {
    may_surface_user_text: boolean;
    may_spawn_worker: boolean;
    may_call_probe: boolean;
    may_mutate_sources: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  created_at: string;
};

export type HelixLiveAgentStepDecision = {
  schema: typeof HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA;
  decision_id: string;
  thread_id: string;
  environment_id?: string | null;
  step_index: number;
  decision_authority: "model" | "deterministic_policy_fallback";
  decision_timing: "pre_observation" | "post_observation" | "terminal_review";
  next_step: HelixLiveEnvironmentAgentNextStep;
  selected_tool?: HelixLiveEnvironmentToolName | null;
  tool_args?: Record<string, unknown> | null;
  rationale_summary: string;
  expected_evidence_kind?: string | null;
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixLiveEnvironmentToolObservation = {
  schema: typeof HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA;
  observation_id: string;
  thread_id: string;
  environment_id?: string | null;
  tool_name: HelixLiveEnvironmentToolName;
  ok: boolean;
  summary: string;
  observation: unknown;
  evidence_refs: string[];
  instruction_authority: "none";
  ask_instruction_authority: "none";
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

export type HelixLiveEnvironmentAgentLoopResult = {
  schema: typeof HELIX_LIVE_ENVIRONMENT_AGENT_LOOP_SCHEMA;
  loop_id: string;
  thread_id: string;
  environment_id?: string | null;
  iterations: Array<{
    step_decision: HelixLiveAgentStepDecision;
    tool_observation?: HelixLiveEnvironmentToolObservation | null;
    commentary_refs: string[];
  }>;
  terminal_decision:
    | "answer_allowed"
    | "needs_more_observation"
    | "ask_user"
    | "fail_closed"
    | "budget_exhausted";
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  created_at: string;
};
