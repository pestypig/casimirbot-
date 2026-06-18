import type { AskTurnTranscriptRowDraftV1 } from "./contracts/stage-play-live-source-mail.v1";

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
  | "live_env.describe_stage_builder"
  | "live_env.query_stage_sources"
  | "live_env.draft_stage_play_graph"
  | "live_env.validate_stage_play_graph"
  | "live_env.plan_stage_play_job"
  | "live_env.request_stage_play_checkpoint"
  | "live_env.reflect_stage_play_context"
  | "live_env.check_live_source_mail"
  | "live_env.read_live_source_mail"
  | "live_env.process_live_source_mail"
  | "live_env.read_processed_live_source_mail"
  | "live_env.reflect_live_source_mail_loop"
  | "live_env.query_workstation_goal_context"
  | "live_env.start_agent_goal_session"
  | "live_env.query_trace_memory"
  | "live_env.query_micro_reasoner_prompts"
  | "live_env.query_micro_reasoner_presets"
  | "live_env.draft_micro_reasoner_preset"
  | "live_env.route_micro_reasoner_prompt"
  | "live_env.apply_micro_reasoner_preset"
  | "live_env.create_micro_reasoner_preset"
  | "live_env.update_micro_reasoner_prompt"
  | "live_env.test_micro_reasoner_prompt"
  | "live_env.configure_visual_observer_profile"
  | "live_env.apply_visual_observer_profile"
  | "live_env.query_visual_observer_profiles"
  | "live_env.test_visual_observer_profile"
  | "live_env.compare_visual_observer_profiles"
  | "live_env.request_visual_action_replay"
  | "live_env.configure_live_source_watch_job"
  | "live_env.configure_interpreter_profile"
  | "live_env.compare_mail_to_interpreter_profile"
  | "live_env.record_live_source_mail_decision"
  | "live_env.predict_live_source_immediate"
  | "live_env.compare_live_source_prediction"
  | "live_env.project_live_source_narrative"
  | "live_env.update_live_source_immersion_state"
  | "live_env.validate_live_source_prediction"
  | "live_env.query_live_source_loop_health"
  | "live_env.record_voice_steering"
  | "live_env.request_interim_voice_callout"
  | "live_env.query_source_health"
  | "live_env.query_live_source_quality"
  | "live_env.summarize_live_source_current_state"
  | "live_env.query_constructs"
  | "live_env.query_job_evidence"
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
  pending_voice_steering_refs?: string[];
  voice_steering_summary?: {
    count: number;
    items: Array<{
      steeringEventId: string;
      classification: string;
      modelVisibleSummary: string;
      confidence: "low" | "medium" | "high";
      evidenceRefs: string[];
      reasonCodes: string[];
    }>;
    assistant_answer: false;
    terminal_eligible: false;
    raw_content_included: false;
    context_role: "tool_evidence";
    ask_context_policy: "evidence_only";
  } | null;
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
  transcriptRows?: AskTurnTranscriptRowDraftV1[];
  evidence_refs: string[];
  producedRefs?: string[];
  artifactRefs?: {
    processedPacketIds?: string[];
    decisionIds?: string[];
    voiceReceiptIds?: string[];
    wakeRequestId?: string | null;
    askTurnId?: string | null;
  };
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
  transcriptRows?: AskTurnTranscriptRowDraftV1[];
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  created_at: string;
};
