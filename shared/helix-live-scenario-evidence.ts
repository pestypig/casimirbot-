export const HELIX_LIVE_SCENARIO_EVIDENCE_SCHEMA =
  "helix.live_scenario_evidence.v1" as const;

export const validLiveScenarioKinds = [
  "minecraft_route_monitor",
  "browser_audio_claim_monitor",
  "live_translation",
  "workstation_operator_monitor",
  "research_session",
  "support_procedure_monitor",
] as const;

export type LiveScenarioKind = (typeof validLiveScenarioKinds)[number];

export const validEvidenceLayers = [
  "observed_current_world",
  "persisted_block_delta_overlay",
  "seed_forecast",
  "route_math",
  "visual_capture",
  "transcript_intent",
  "audio_transcript",
  "document_context",
  "process_graph",
  "procedure_graph",
  "note_context",
  "calculator_stream",
  "simulation_stream",
  "text_chat",
  "model_hypothesis",
  "operator_review",
  "client_planner_observation",
] as const;

export type LiveEvidenceLayer = (typeof validEvidenceLayers)[number];

export const validEvidenceTrusts = [
  "server_observation",
  "client_cache",
  "client_planner_observation",
  "seed_forecast",
  "visual_capture",
  "player_transcript",
  "transcript_intent",
  "audio_transcript",
  "document_context",
  "process_observation",
  "procedure_observation",
  "note_context",
  "calculator_observation",
  "simulation_observation",
  "text_chat",
  "model_summary",
  "route_math",
  "operator_review",
  "unknown",
] as const;

export type LiveEvidenceTrust = (typeof validEvidenceTrusts)[number];

export type InstructionAuthority = "none";

export type AskInstructionAuthority = "none";

export const validAskContextPolicies = [
  "evidence_only",
  "ui_candidate_only",
  "operator_only",
  "not_admissible",
] as const;

export type AskContextPolicy = (typeof validAskContextPolicies)[number];

export const validLiveScenarioContextRoles = [
  "tool_evidence",
  "policy_receipt",
  "operator_referral",
  "ui_candidate",
  "debug_only",
] as const;

export type LiveScenarioContextRole =
  (typeof validLiveScenarioContextRoles)[number];

export type LiveScenarioSafetyEnvelope = {
  scenario_kind: LiveScenarioKind;
  evidence_layer: LiveEvidenceLayer;
  evidence_trust: LiveEvidenceTrust;

  instruction_authority: InstructionAuthority;
  ask_instruction_authority: AskInstructionAuthority;
  ask_context_policy: AskContextPolicy;
  context_role: LiveScenarioContextRole;

  creates_ask_turn: false;
  turn_triggered: false;

  raw_user_text_included: false;
  raw_transcript_included?: false;
  raw_image_included?: false;
  raw_audio_included?: false;
  raw_logs_included?: false;
  raw_content_included?: false;

  derived_by_deterministic_reducer?: boolean;
  model_invoked: boolean;
};
