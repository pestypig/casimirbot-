import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import { HELIX_RESEARCH_LIBRARY_READ_CAPABILITY } from "@shared/helix-research-library";
import { HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY } from "@shared/helix-paper-evidence-enrichment";

import { WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS } from "./workstation-context-feed-query-tool-contracts";

export type ToolAuthority =
  | "evidence_only"
  | "control_receipt"
  | "terminal_candidate";

export type ToolFamily =
  | "calculator"
  | "internet_search"
  | "scholarly_research"
  | "repo_code"
  | "docs_viewer"
  | "workspace_directory"
  | "workspace_diagnostic"
  | "workstation"
  | "visual_capture"
  | "live_environment"
  | "live_source_mail"
  | "live_source_decision"
  | "voice_delivery"
  | "moral_graph_reflection"
  | "theory_locator"
  | "context_reflection"
  | "civilization_bounds"
  | "capability_catalog";

export interface ToolFamilyContract {
  toolName: string;
  toolFamily: ToolFamily;
  authority: ToolAuthority;
  mutating: boolean;
  requiredObservationKinds: string[];
  allowedTerminalKinds: string[];
  requiredReentry: boolean;
  requiresGoalSatisfaction: boolean;
  defaultAssistantAnswer: false;
  defaultTerminalEligible: false;
  defaultRawContentIncluded: false;
  requiredNextWhen?: Array<{
    observationKind: string;
    predicateName: string;
    nextTool: string;
    forbidTerminalUntil: string[];
  }>;
  aliases?: string[];
}

type ContractDraft = Omit<
  ToolFamilyContract,
  "defaultAssistantAnswer" | "defaultTerminalEligible" | "defaultRawContentIncluded"
>;

const evidenceOnlyTerminalKinds = ["model_synthesized_answer"];

const shouldAllowWorkstationToolEvaluationTerminal = (input: ContractDraft): boolean =>
  input.allowedTerminalKinds.includes("workstation_tool_evaluation") ||
  input.requiredObservationKinds.some((kind) =>
    kind === "stage_play_workstation_control_receipt" ||
    kind === "stage_play_live_source_watch_job_policy_config_result" ||
    kind === "stage_play_agent_goal_session_tool_result" ||
    kind === "helix.narrator_say_request.v1" ||
    kind === "helix.narrator_bind_stream_request.v1"
  );

const contract = (input: ContractDraft): ToolFamilyContract => ({
  ...input,
  allowedTerminalKinds: Array.from(new Set([
    ...input.allowedTerminalKinds,
    ...(shouldAllowWorkstationToolEvaluationTerminal(input) ? ["workstation_tool_evaluation"] : []),
  ])),
  defaultAssistantAnswer: false,
  defaultTerminalEligible: false,
  defaultRawContentIncluded: false,
});

export const TOOL_FAMILY_DEFAULT_CONTRACTS: Record<ToolFamily, ToolFamilyContract> = {
  calculator: contract({
    toolName: "family:calculator",
    toolFamily: "calculator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "calculator_receipt",
      "calculator_subgoal_receipt",
      "calculator_plan_coverage",
      "calculator_result_trace",
      "calculator_result_validation",
      "calculator_live_source_status",
      "workspace_action_receipt",
      "workstation_tool_evaluation",
    ],
    allowedTerminalKinds: [
      "calculator_stream_result",
      "calculation_trace",
      "workstation_tool_evaluation",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["calculator", "calculator_stream", "scientific-calculator"],
  }),
  internet_search: contract({
    toolName: "family:internet_search",
    toolFamily: "internet_search",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["internet_search_observation", "web_research_observation"],
    allowedTerminalKinds: ["internet_search_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["internet_search", "web_research", "web.search"],
  }),
  scholarly_research: contract({
    toolName: "family:scholarly_research",
    toolFamily: "scholarly_research",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "scholarly_research_observation",
      "scholarly_full_text_observation",
      "scholarly_numeric_parameter_observation",
      "research_library_observation",
      "paper_evidence_enrichment_observation",
    ],
    allowedTerminalKinds: ["scholarly_research_answer", "compound_research_locator_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "scholarly_research",
      "scholarly-research",
      "scholarly-research.lookup_papers",
      "scholarly-research.fetch_full_text",
      "scholarly_research.lookup_papers",
      "scholarly_research.fetch_full_text",
      "research-library.read_document",
      "research-library.apply_evidence_enrichment",
      "scholarly research",
    ],
  }),
  repo_code: contract({
    toolName: "family:repo_code",
    toolFamily: "repo_code",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["repo_code_evidence_observation", "repo_code_search_result", "repo_evidence_relevance_gate"],
    allowedTerminalKinds: ["repo_code_evidence_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["repo_code", "repo_evidence", "repo-code", "repo.search"],
  }),
  docs_viewer: contract({
    toolName: "family:docs_viewer",
    toolFamily: "docs_viewer",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "active_doc_identity",
      "doc_search_results",
      "retrieval_context",
      "doc_candidate_validation",
      "doc_open_receipt",
      "doc_location_result",
      "doc_location_matches",
      "doc_evidence_location",
      "doc_equation_context",
      "doc_summary",
      "observation_review",
      "docs_viewer_receipt",
    ],
    allowedTerminalKinds: [
      "doc_location_result",
      "doc_location_matches",
      "doc_open_receipt",
      "doc_summary",
      "doc_equation_context",
      "doc_evidence_synthesis_answer",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["docs", "docs_viewer", "active_doc", "docs-viewer", "docs.search"],
  }),
  workspace_directory: contract({
    toolName: "family:workspace_directory",
    toolFamily: "workspace_directory",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["workspace_directory_resolution"],
    allowedTerminalKinds: ["workspace_directory_resolution", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["workspace_directory", "workspace-directory", "workspace_directory_resolution"],
  }),
  workspace_diagnostic: contract({
    toolName: "family:workspace_diagnostic",
    toolFamily: "workspace_diagnostic",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["workspace_os_status_observation"],
    allowedTerminalKinds: ["workspace_status_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "workspace_diagnostic",
      "workspace_status",
      "workspace-os.status",
      "workspace_os.status",
      "workspace_os_status",
      "workspace os status",
    ],
  }),
  workstation: contract({
    toolName: "family:workstation",
    toolFamily: "workstation",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "workspace_action_receipt",
      "workstation_tool_evaluation",
      "note_context",
      "note_create_receipt",
      "note_update_receipt",
      "note_action_receipt",
    ],
    allowedTerminalKinds: ["workspace_action_receipt", "workstation_tool_evaluation", "tool_evaluation", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "workstation",
      "workstation_action",
      "workspace_action",
      "workstation_panel",
      "workspace_panel",
      "account_session",
      "account_session.set_interface_language",
    ],
  }),
  visual_capture: contract({
    toolName: "family:visual_capture",
    toolFamily: "visual_capture",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["visual_frame_evidence", "situation_context_pack", "visual_capture_coverage"],
    allowedTerminalKinds: ["situation_context_pack", "visual_context_pack", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "visual_capture",
      "visual capture",
      "image_lens",
      "image_lens.inspect",
      "image-lens.inspect",
      "situation-room.describe_visual_capture",
      "situation room visual capture",
    ],
  }),
  live_environment: contract({
    toolName: "family:live_environment",
    toolFamily: "live_environment",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_reflection_result",
      "stage_play_workstation_control_receipt",
      "stage_play_live_source_watch_job_policy_config_result",
      "stage_play_agent_goal_session_tool_result",
      "helix.live_environment_goal_satisfaction.v1",
      "helix.narrator_say_request.v1",
      "helix.narrator_bind_stream_request.v1",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: ["workstation_tool_evaluation", "direct_answer_text", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "live_environment",
      "live-env",
      "live_env",
      "live-answer-environment",
      "stage_play_reflection_result",
      "live_environment_tool_observation",
    ],
  }),
  live_source_mail: contract({
    toolName: "family:live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_read_result", "stage_play_processed_mail_packet"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["live_source_mail", "live_source_mailbox"],
  }),
  live_source_decision: contract({
    toolName: "family:live_source_decision",
    toolFamily: "live_source_decision",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_live_source_mail_decision"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["live_source_decision", "live_environment_decision"],
  }),
  voice_delivery: contract({
    toolName: "family:voice_delivery",
    toolFamily: "voice_delivery",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "voice_delivery",
      "voice_output",
      "request_interim_voice_callout",
      "text_to_speech",
      "text_to_speech.speak_text",
    ],
  }),
  moral_graph_reflection: contract({
    toolName: "family:moral_graph_reflection",
    toolFamily: "moral_graph_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "moral_graph_reflection",
      "helix.moral_graph_reflection_observation.v1",
      "ideology_context_reflection/v1",
      "procedural_moral_classification/v1",
      "helix_moral_graph_reflection_tool_result",
      "helix_theory_ideology_bridge_tool_result",
      "theory_ideology_bridge",
      "workstation_tool_evaluation",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "moral_graph_reflection",
      "moral_graph",
      "moralgraph",
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
      "bridge_theory_ideology_context",
      "theory_ideology_bridge",
      "theory_moral_bridge",
      "procedural_moral_classification/v1",
    ],
  }),
  theory_locator: contract({
    toolName: "family:theory_locator",
    toolFamily: "theory_locator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "helix_theory_context_reflection_tool_receipt",
      "theory_context_reflection",
      "helix_theory_frontier_vector_field_tool_receipt",
      "theory_frontier_vector_field",
      "theory_frontier_conjecture_observation",
      "theory_frontier_search",
      "theory_frontier_candidate",
    ],
    allowedTerminalKinds: ["theory_context_reflection_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "theory_locator",
      "theory_context",
      "theory_context_reflection",
      "theory_badge_graph",
      "helix_ask.reflect_theory_context",
      "reflect_theory_context",
      "helix.theory.frontierVectorFieldTrace",
      "frontierVectorFieldTrace",
      "frontier_vector_field_trace",
      "theory-badge-graph.propose_frontier_conjectures",
      "theory-badge-graph.reflect_discussion_context",
      "theory-badge-graph.current_context",
      "propose_frontier_conjectures",
      "frontier_conjecture_workbench",
    ],
  }),
  context_reflection: contract({
    toolName: "family:context_reflection",
    toolFamily: "context_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "helix_context_reflection_tool_receipt/v1",
      "context_attachment",
      "bounded_context_reference",
      "moral_living_substrate_reflection",
      "helix.moral_living_substrate_reflection_observation.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "context_reflection",
      "context_binding",
      "bounded_context_reference",
      "dragged_cutout_context",
      "selected_ui_region",
      "helix_ask.reflect_context_attachments",
      "helix_ask.reflect_live_synthetic_data",
      "live_synthetic_data_reflection",
      "live_answer_synthetic_data",
      "microdeck_reflection",
      "macro_reasoner_deck_reflection",
      "mail_loop_synthetic_data",
      "live_answer_prediction_review",
    ],
  }),
  civilization_bounds: contract({
    toolName: "family:civilization_bounds",
    toolFamily: "civilization_bounds",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "civilization_scenario_frame/v1",
      "helix_civilization_scenario_frame_tool_result",
      "civilization_bounds_roadmap/v1",
      "helix_civilization_bounds_tool_result",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["civilization_bounds", "civilization_bounds_reflection"],
  }),
  capability_catalog: contract({
    toolName: "family:capability_catalog",
    toolFamily: "capability_catalog",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["capability_registry"],
    allowedTerminalKinds: ["capability_help_summary", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "capability_catalog",
      "capability_help",
      "helix_ask.inspect_capability_catalog",
      "helix_ask.reflect_workstation_tool_alignment",
    ],
  }),
};

const liveEnvExactContract = (input: {
  toolName: string;
  requiredObservationKinds: string[];
  aliases?: string[];
  authority?: ToolAuthority;
  mutating?: boolean;
  allowedTerminalKinds?: string[];
}): ToolFamilyContract => {
  const isControlReceipt = input.authority === "control_receipt";
  return contract({
    toolName: input.toolName,
    toolFamily: "live_environment",
    authority: input.authority ?? "evidence_only",
    mutating: input.mutating ?? false,
    requiredObservationKinds: Array.from(new Set([
      "live_environment_tool_observation",
      ...input.requiredObservationKinds,
      "helix.workstation_goal_context_update.v1",
      ...(isControlReceipt ? [
        "stage_play_workstation_control_receipt",
      ] : []),
    ])),
    allowedTerminalKinds: input.allowedTerminalKinds ??
      (isControlReceipt ? ["workstation_tool_evaluation", ...evidenceOnlyTerminalKinds] : [...evidenceOnlyTerminalKinds]),
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: input.aliases ?? [],
  });
};

export const TOOL_FAMILY_CONTRACTS: ToolFamilyContract[] = [
  ...Object.values(TOOL_FAMILY_DEFAULT_CONTRACTS),
  liveEnvExactContract({
    toolName: "live_pipeline",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_pipeline_receipt",
      "visual_producer_cadence_receipt",
      "tool_observation",
    ],
    allowedTerminalKinds: [
      "live_pipeline_receipt",
      "visual_producer_cadence_receipt",
      "workstation_tool_evaluation",
      ...evidenceOnlyTerminalKinds,
    ],
    aliases: [
      "live-pipeline",
      "live_pipeline_control",
      "live-source.set_rate",
      "situation-room.live-source.set_rate",
      "live_source:control_live_source",
      "set_rate",
    ],
  }),
  contract({
    toolName: "runtime_evidence",
    toolFamily: "capability_catalog",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["capability_registry"],
    allowedTerminalKinds: ["capability_help_summary", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "runtime-evidence",
      "runtime evidence",
      "runtime_debug_evidence",
    ],
  }),
  contract({
    toolName: "debug.inspect_current_turn",
    toolFamily: "capability_catalog",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["agent_runtime_loop", "debug_evidence_diagnosis"],
    allowedTerminalKinds: ["capability_help_summary", "debug_evidence_diagnosis", "typed_failure", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "diagnose_debug_or_runtime_evidence",
      "debug.inspect-current-turn",
      "debug_current_turn",
      "runtime_debug_evidence",
    ],
  }),
  contract({
    toolName: "live_env.query_micro_reasoner_presets",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_query_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "microdeck",
      "micro_reasoner_presets",
      "earbud_microdeck",
      "audio_transcript_microdeck",
      "earbud_translation_presets",
      "stage_play_micro_reasoner_prompt_preset_query_result/v1",
    ],
  }),
  contract({
    toolName: "live_env.draft_micro_reasoner_preset",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_draft"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "microdeck_draft",
      "micro_reasoner_preset_draft",
      "earbud_microdeck_draft",
      "audio_translation_preset_draft",
      "stage_play_micro_reasoner_prompt_preset_draft/v1",
    ],
  }),
  contract({
    toolName: "live_env.route_micro_reasoner_prompt",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_delegation_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["microdeck_prompt_router", "prompt_delegation", "stage_play_micro_reasoner_prompt_delegation_result/v1"],
  }),
  contract({
    toolName: "live_env.query_micro_reasoner_prompts",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["micro_reasoner_prompts", "stage_play_micro_reasoner_prompt/v1"],
  }),
  liveEnvExactContract({
    toolName: "live_env.apply_micro_reasoner_preset",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset"],
    aliases: ["apply_micro_reasoner_preset"],
  }),
  liveEnvExactContract({
    toolName: "live_env.create_micro_reasoner_preset",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset", "stage_play_micro_reasoner_prompt"],
    aliases: ["create_micro_reasoner_preset"],
  }),
  liveEnvExactContract({
    toolName: "live_env.update_micro_reasoner_prompt",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt"],
    aliases: ["update_micro_reasoner_prompt"],
  }),
  liveEnvExactContract({
    toolName: "live_env.test_micro_reasoner_prompt",
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_test"],
    aliases: ["test_micro_reasoner_prompt"],
  }),
  contract({
    toolName: "live_env.check_live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_read_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "live_env.read_live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_read_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    requiredNextWhen: [
      {
        observationKind: "stage_play_live_source_mail_read_result",
        predicateName: "processed_packet_missing",
        nextTool: "live_env.read_processed_live_source_mail",
        forbidTerminalUntil: ["stage_play_processed_mail_packet"],
      },
    ],
  }),
  contract({
    toolName: "live_env.read_processed_live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_processed_mail_packet"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "live_env.reflect_live_source_mail_loop",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_loop_reflection"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "live_mail_loop",
      "processed_mail_loop",
      "mail_loop_causality",
      "live_answer_retrieval",
      "temporary_retrieval_network",
      "synthetic_scene_retrieval",
      "microdex",
      "microdeck_loop",
      "stage_play_live_source_mail_loop_reflection/v1",
    ],
  }),
  contract({
    toolName: "live_env.query_workstation_goal_context",
    toolFamily: "live_environment",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_goal_context_read_result",
      "helix.workstation_goal_context_update.v1",
      "helix.agent_goal_session.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "workstation_goal_context",
      "goal_context_updates",
      "agent_goal_sessions",
      "stage_play_workstation_goal_context_read_result/v1",
    ],
  }),
  contract({
    toolName: "live_env.start_agent_goal_session",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_agent_goal_session_tool_result",
      "helix.workstation_goal_context_update.v1",
      "helix.agent_goal_session.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_agent_goal_session_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "agent_goal_session",
      "start_goal_session",
      "goal_session",
      "stage_play_agent_goal_session_tool_result/v1",
    ],
  }),
  contract({
    toolName: "live_env.configure_route_watch",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_live_source_watch_job_policy_config_result",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "live_pipeline_receipt",
      "stage_play_live_source_watch_job_policy_config_result",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "configure_route_watch",
      "route_watch",
      "route_watch_policy",
      "live_env.configure_live_source_watch_job",
    ],
  }),
  contract({
    toolName: "live_env.configure_live_source_watch_job",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_live_source_watch_job_policy_config_result",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "live_pipeline_receipt",
      "stage_play_live_source_watch_job_policy_config_result",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "configure_live_source_watch_job",
      "live_source_watch_job",
      "watch_job_policy",
    ],
  }),
  ...WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.map((spec) => contract({
    toolName: spec.capability,
    toolFamily: "live_environment",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: Array.from(new Set([
      "live_environment_tool_observation",
      ...spec.toolFamilyRequiredObservationKinds,
      spec.explicitRequiredObservationKind,
      "helix.workstation_goal_context_update.v1",
    ])),
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [...spec.aliases],
  })),
  contract({
    toolName: "live_env.query_live_source_quality",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "stage_play_live_source_quality",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "live_source_quality",
      "source_freshness",
      "stage_play_live_source_quality/v1",
    ],
  }),
  contract({
    toolName: "live_env.summarize_live_source_current_state",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "stage_play_live_source_current_state",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "live_answer_state",
      "live_source_current_state",
      "stage_play_live_source_current_state/v1",
    ],
  }),
  liveEnvExactContract({
    toolName: "live_env.plan_stage_play_job",
    requiredObservationKinds: ["stage_play_job_plan"],
    aliases: ["plan_stage_play_job"],
  }),
  liveEnvExactContract({
    toolName: "live_env.configure_visual_observer_profile",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_visual_observer_profile"],
    aliases: ["configure_visual_observer_profile", "visual_observer_profile"],
  }),
  liveEnvExactContract({
    toolName: "live_env.apply_visual_observer_profile",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_visual_observer_profile"],
    aliases: ["apply_visual_observer_profile"],
  }),
  liveEnvExactContract({
    toolName: "live_env.query_visual_observer_profiles",
    requiredObservationKinds: ["stage_play_visual_observer_profile"],
    aliases: ["query_visual_observer_profiles"],
  }),
  liveEnvExactContract({
    toolName: "live_env.test_visual_observer_profile",
    requiredObservationKinds: ["stage_play_visual_observer_profile_test"],
    aliases: ["test_visual_observer_profile"],
  }),
  liveEnvExactContract({
    toolName: "live_env.compare_visual_observer_profiles",
    requiredObservationKinds: ["stage_play_visual_observer_profile_test"],
    aliases: ["compare_visual_observer_profiles"],
  }),
  liveEnvExactContract({
    toolName: "live_env.request_visual_action_replay",
    requiredObservationKinds: ["helix_visual_frame_action_replay_request"],
    aliases: ["request_visual_action_replay"],
  }),
  liveEnvExactContract({
    toolName: "live_env.configure_interpreter_profile",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_live_source_interpreter_profile"],
    aliases: ["configure_interpreter_profile"],
  }),
  liveEnvExactContract({
    toolName: "live_env.compare_mail_to_interpreter_profile",
    requiredObservationKinds: ["stage_play_live_source_interpreter_profile_comparison"],
    aliases: ["compare_mail_to_interpreter_profile"],
  }),
  liveEnvExactContract({
    toolName: "live_env.request_stage_play_checkpoint",
    requiredObservationKinds: ["stage_play_checkpoint_request"],
    aliases: ["request_stage_play_checkpoint"],
  }),
  liveEnvExactContract({
    toolName: "live_env.predict_live_source_immediate",
    requiredObservationKinds: ["helix_live_source_immediate_prediction"],
    aliases: ["predict_live_source_immediate"],
  }),
  liveEnvExactContract({
    toolName: "live_env.compare_live_source_prediction",
    requiredObservationKinds: ["helix_live_source_prediction_comparison"],
    aliases: ["compare_live_source_prediction"],
  }),
  liveEnvExactContract({
    toolName: "live_env.project_live_source_narrative",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_live_source_narrative_state"],
    aliases: ["project_live_source_narrative"],
  }),
  contract({
    toolName: "live_env.evaluate_goal_satisfaction",
    toolFamily: "live_environment",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "helix.live_environment_goal_satisfaction.v1",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "goal_satisfaction",
      "evaluate_goal_satisfaction",
      "helix.live_environment_goal_satisfaction.v1",
    ],
  }),
  contract({
    toolName: "live_env.change_workstation_preset",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "change_workstation_preset",
      "apply_workstation_preset",
      "stage_play_workstation_control_receipt/v1",
    ],
  }),
  contract({
    toolName: "live_env.set_visual_preset",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "set_visual_preset",
      "visual_preset",
      "stage_play_workstation_control_receipt/v1",
    ],
  }),
  contract({
    toolName: "live_env.set_audio_preset",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "set_audio_preset",
      "audio_preset",
      "stage_play_workstation_control_receipt/v1",
    ],
  }),
  contract({
    toolName: "live_env.bind_workstation_source",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["bind_workstation_source", "bind_source", "source_binding"],
  }),
  contract({
    toolName: "live_env.unbind_workstation_source",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["unbind_workstation_source", "unbind_source", "detach_source"],
  }),
  contract({
    toolName: "live_env.pause_workstation_loop",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["pause_workstation_loop", "pause_loop"],
  }),
  contract({
    toolName: "live_env.resume_workstation_loop",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["resume_workstation_loop", "resume_loop"],
  }),
  contract({
    toolName: "live_env.set_workstation_loop_state",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["set_workstation_loop_state", "set_loop_state"],
  }),
  contract({
    toolName: "live_env.repair_loop",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["repair_loop"],
  }),
  contract({
    toolName: "live_env.update_live_answer_projection",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["update_live_answer_projection", "update_live_answer", "live_answer_projection"],
  }),
  contract({
    toolName: "live_env.repair_workstation_source",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["repair_workstation_source", "repair_source", "source_repair"],
  }),
  contract({
    toolName: "live_env.focus_process_graph",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "stage_play_workstation_control_receipt",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "stage_play_workstation_control_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["focus_process_graph", "process_graph_focus", "stage_play_process_graph"],
  }),
  contract({
    toolName: "live_env.process_live_source_mail",
    toolFamily: "live_source_mail",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["stage_play_live_source_mail_read_result", "stage_play_processed_mail_packet"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    requiredNextWhen: [
      {
        observationKind: "stage_play_live_source_mail_read_result",
        predicateName: "processed_packet_missing",
        nextTool: "live_env.read_processed_live_source_mail",
        forbidTerminalUntil: ["stage_play_processed_mail_packet"],
      },
    ],
  }),
  contract({
    toolName: "live_env.record_live_source_mail_decision",
    toolFamily: "live_source_decision",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["stage_play_processed_mail_packet", "stage_play_live_source_mail_decision"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    requiredNextWhen: [
      {
        observationKind: "stage_play_live_source_mail_decision",
        predicateName: "voice_callout_requested",
        nextTool: "live_env.request_interim_voice_callout",
        forbidTerminalUntil: [
          "live_source_interim_voice_callout_receipt",
          "voice_hold_receipt",
          "voice_block_receipt",
          "voice_receipt",
        ],
      },
    ],
  }),
  contract({
    toolName: "live_env.request_interim_voice_callout",
    toolFamily: "voice_delivery",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "stage_play_live_source_mail_decision",
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "live_env.narrator_say",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "helix.narrator_say_request.v1",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "narrator_say_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "narrator.say",
      "narrator_say",
      "helix.narrator_say_request.v1",
    ],
  }),
  contract({
    toolName: "live_env.narrator_bind_stream",
    toolFamily: "live_environment",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "live_environment_tool_observation",
      "helix.narrator_bind_stream_request.v1",
      "helix.workstation_goal_context_update.v1",
    ],
    allowedTerminalKinds: [
      "narrator_bind_stream_receipt",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "narrator.bind_stream",
      "narrator_bind_stream",
      "helix.narrator_bind_stream_request.v1",
    ],
  }),
  contract({
    toolName: "scientific-calculator.solve_expression",
    toolFamily: "calculator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "calculator_receipt",
      "calculator_subgoal_receipt",
      "calculator_result_trace",
      "calculator_result_validation",
      "workstation_tool_evaluation",
    ],
    allowedTerminalKinds: [
      "calculator_stream_result",
      "calculation_trace",
      "workstation_tool_evaluation",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["scientific-calculator.solve_with_steps"],
  }),
  contract({
    toolName: "repo-code.search_concept",
    toolFamily: "repo_code",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["repo_code_evidence_observation", "repo_code_search_result", "repo_evidence_relevance_gate"],
    allowedTerminalKinds: ["repo_code_evidence_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.open",
    toolFamily: "docs_viewer",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["doc_open_receipt", "docs_viewer_receipt"],
    allowedTerminalKinds: ["doc_open_receipt", "docs_viewer_receipt", "workspace_action_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.locate_in_doc",
    toolFamily: "docs_viewer",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["doc_location_result", "doc_location_matches", "doc_evidence_location"],
    allowedTerminalKinds: [
      "doc_location_result",
      "doc_location_matches",
      "doc_evidence_location",
      "doc_evidence_synthesis_answer",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.summarize_doc",
    toolFamily: "docs_viewer",
    authority: "terminal_candidate",
    mutating: false,
    requiredObservationKinds: ["doc_summary", "observation_review"],
    allowedTerminalKinds: ["doc_summary", "doc_evidence_synthesis_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "docs-viewer.doc_equation_context",
    toolFamily: "docs_viewer",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["doc_equation_context"],
    allowedTerminalKinds: ["doc_equation_context", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "workspace-directory.resolve",
    toolFamily: "workspace_directory",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["workspace_directory_resolution"],
    allowedTerminalKinds: ["workspace_directory_resolution", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "workspace_os.status",
    toolFamily: "workspace_diagnostic",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["workspace_os_status_observation"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "workspace_status",
      "workspace status",
      "workspace_diagnostic",
      "workspace diagnostic",
      "workspace_os status",
      "workspace_os_status",
      "workspace os status",
      "workstation status",
      "workstation diagnostic",
    ],
  }),
  contract({
    toolName: "workstation-notes.append_to_note",
    toolFamily: "workstation",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["workspace_action_receipt", "note_update_receipt", "note_action_receipt"],
    allowedTerminalKinds: ["workspace_action_receipt", "note_update_receipt", "note_action_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "workstation-notes.create_note",
    toolFamily: "workstation",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: ["workspace_action_receipt", "note_update_receipt"],
    allowedTerminalKinds: ["workspace_action_receipt", "note_update_receipt", "note_action_receipt", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "internet_search.web_research",
    toolFamily: "internet_search",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["internet_search_observation", "web_research_observation"],
    allowedTerminalKinds: ["internet_search_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["web.search", "web.run", "internet.search"],
  }),
  contract({
    toolName: HELIX_RESEARCH_LIBRARY_READ_CAPABILITY,
    toolFamily: "scholarly_research",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["research_library_observation"],
    allowedTerminalKinds: ["scholarly_research_answer", "compound_research_locator_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "research_library.read_document",
      "research library",
      "saved full text evidence",
      "existing full text evidence",
    ],
  }),
  contract({
    toolName: HELIX_RESEARCH_LIBRARY_APPLY_EVIDENCE_ENRICHMENT_CAPABILITY,
    toolFamily: "scholarly_research",
    authority: "evidence_only",
    mutating: true,
    requiredObservationKinds: ["paper_evidence_enrichment_observation"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "research_library.apply_evidence_enrichment",
      "apply paper evidence enrichment",
      "persist paper evidence enrichment",
    ],
  }),
  contract({
    toolName: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    toolFamily: "scholarly_research",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["scholarly_research_observation"],
    allowedTerminalKinds: ["scholarly_research_answer", "compound_research_locator_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "scholarly_research.lookup_papers",
      "scholarly_research",
      "scholarly research",
      "lookup_papers",
    ],
  }),
  contract({
    toolName: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    toolFamily: "scholarly_research",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["scholarly_full_text_observation"],
    allowedTerminalKinds: ["scholarly_research_answer", "compound_research_locator_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "scholarly_research.fetch_full_text",
      "scholarly_full_text",
      "scholarly full text",
      "fetch_full_text",
      "fetch full text",
    ],
  }),
  contract({
    toolName: "image_lens.inspect",
    toolFamily: "visual_capture",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["visual_frame_evidence", "situation_context_pack", "visual_capture_coverage"],
    allowedTerminalKinds: ["situation_context_pack", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "image_lens",
      "image lens",
      "image-lens",
      "visual_capture",
      "visual capture",
      "visual capture inspect",
      "situation-room.describe_visual_capture",
      "situation room visual capture",
      "image lens inspect",
    ],
  }),
  contract({
    toolName: "helix_ask.reflect_theory_context",
    toolFamily: "theory_locator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
    allowedTerminalKinds: ["theory_context_reflection_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "reflect_theory_context",
      "theory_context",
      "theory_context_reflection",
      "theory_locator",
      "theory_badge_graph",
    ],
  }),
  contract({
    toolName: "helix.theory.frontierVectorFieldTrace",
    toolFamily: "theory_locator",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "helix_theory_frontier_vector_field_tool_receipt",
      "theory_frontier_vector_field",
    ],
    allowedTerminalKinds: ["theory_context_reflection_answer", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "frontierVectorFieldTrace",
      "frontier_vector_field_trace",
      "theory_frontier_vector_field",
      "theory_frontier_vector_field_trace",
      "badge_coordinate_vector_trace",
      "relation_tensor_trace",
    ],
  }),
  contract({
    toolName: "helix_ask.reflect_ideology_context",
    toolFamily: "moral_graph_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "ideology_context_reflection/v1",
      "procedural_moral_classification/v1",
      "helix_moral_graph_reflection_tool_result",
      "workstation_tool_evaluation",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "reflect_ideology_context",
      "ideology_context_reflection",
      "moral_graph_reflection",
      "moral graph reflection",
      "moral_graph",
      "moral graph",
    ],
  }),
  contract({
    toolName: "helix_ask.bridge_theory_ideology_context",
    toolFamily: "moral_graph_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["helix_theory_ideology_bridge_tool_result", "theory_ideology_bridge"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "bridge_theory_ideology_context",
      "bridge theory ideology context",
      "bridge theory and ideology context",
      "theory_ideology_bridge",
      "theory ideology bridge",
      "theory_moral_bridge",
      "theory moral bridge",
    ],
  }),
  contract({
    toolName: "helix_ask.build_civilization_scenario_frame",
    toolFamily: "civilization_bounds",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["civilization_scenario_frame/v1", "helix_civilization_scenario_frame_tool_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "helix_ask.reflect_civilization_bounds",
    toolFamily: "civilization_bounds",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["civilization_bounds_roadmap/v1", "helix_civilization_bounds_tool_result"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["helix_civilization_bounds_tool_result", "civilization_bounds_roadmap/v1"],
  }),
  contract({
    toolName: "helix_ask.inspect_capability_catalog",
    toolFamily: "capability_catalog",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["capability_registry"],
    allowedTerminalKinds: ["capability_help_summary", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["what_tools_are_available", "what_can_helix_ask_do", "system_capability_help"],
  }),
  contract({
    toolName: "helix_ask.reflect_workstation_tool_alignment",
    toolFamily: "capability_catalog",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["capability_registry"],
    allowedTerminalKinds: ["capability_help_summary", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "workstation_tool_alignment",
      "workstation_tools_matrix",
      "toolchain_matrix",
      "tool_regression_matrix",
      "release_checklist_tools",
    ],
  }),
  contract({
    toolName: "helix_ask.reflect_live_synthetic_data",
    toolFamily: "context_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["helix_context_reflection_tool_receipt/v1", "bounded_context_reference"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "live_synthetic_data_reflection",
      "live_answer_synthetic_data",
      "microdeck_reflection",
      "macro_reasoner_deck_reflection",
      "mail_loop_synthetic_data",
      "live_answer_prediction_review",
    ],
  }),
  contract({
    toolName: "helix_ask.reflect_context_attachments",
    toolFamily: "context_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: ["helix_context_reflection_tool_receipt/v1", "context_attachment", "bounded_context_reference"],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "context_attachment_reflection",
      "context_binding_reflection",
      "dragged_cutout_context",
      "selected_ui_region",
      "selected_context_refs",
      "helix_context_reflection_tool_receipt/v1",
    ],
  }),
  contract({
    toolName: "text_to_speech.speak_text",
    toolFamily: "voice_delivery",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "capability_lane_observation_packet",
      "helix.agent_step_observation_packet.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["speak_text", "voice_delivery.speak_text"],
  }),
  contract({
    toolName: "visual_analysis.inspect_image_region",
    toolFamily: "visual_capture",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "capability_lane_observation_packet",
      "visual_analysis.inspect_image_region",
      "scientific_image_evidence_sidecar",
    ],
    allowedTerminalKinds: ["image_lens_observation_report", ...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
  }),
  contract({
    toolName: "moral-graph.reflect_living_substrate_context",
    toolFamily: "context_reflection",
    authority: "evidence_only",
    mutating: false,
    requiredObservationKinds: [
      "moral_living_substrate_reflection",
      "helix.moral_living_substrate_reflection_observation.v1",
    ],
    allowedTerminalKinds: [...evidenceOnlyTerminalKinds],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: [
      "moral_living_substrate_reflection",
      "living_substrate_moral_reflection",
      "reflect_living_substrate_context",
    ],
  }),
  contract({
    toolName: "workstation-notes.create",
    toolFamily: "workstation",
    authority: "control_receipt",
    mutating: true,
    requiredObservationKinds: [
      "workspace_action_receipt",
      "note_update_receipt",
    ],
    allowedTerminalKinds: [
      "note_update_receipt",
      "workspace_action_receipt",
      "workstation_tool_evaluation",
      ...evidenceOnlyTerminalKinds,
    ],
    requiredReentry: true,
    requiresGoalSatisfaction: true,
    aliases: ["workstation-notes.create_note", "workstation notes create"],
  }),
];

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase().replace(/_/g, "-") : "";

const normalizeFamily = (value: unknown): ToolFamily | null => {
  const normalized = normalize(value);
  if (!normalized) return null;
  if (/(^|[-.:])calculator($|[-.:])|scientific-calculator|calculator-stream/.test(normalized)) return "calculator";
  if (/scholarly[-.:]?research|scholarly-research|lookup-papers|fetch-full-text/.test(normalized)) return "scholarly_research";
  if (/internet[-.:]?search|web[-.:]?research|web\.search/.test(normalized)) return "internet_search";
  if (/repo[-.:]?code|repo[-.:]?evidence|repo-code/.test(normalized)) return "repo_code";
  if (/workspace[-.:]?diagnostic|workspace[-.:]?status|workspace-os\.status|workspace[-.:]?os[-.:]?status/.test(normalized)) return "workspace_diagnostic";
  if (/workspace[-.:]?directory|workspace-directory\.resolve|workspace[-.:]?directory[-.:]?resolution/.test(normalized)) return "workspace_directory";
  if (/docs?[-.:]?viewer|active[-.:]?doc|document/.test(normalized)) return "docs_viewer";
  if (/visual[-.:]?capture|image[-.:]?lens|situation-room\.describe-visual-capture/.test(normalized)) return "visual_capture";
  if (/workstation|workspace[-.:]?action|workspace[-.:]?panel|panel-control|click-or-activate-control/.test(normalized)) return "workstation";
  if (/live[-.:]?environment|live[-.:]?env|live[-.:]?answer[-.:]?environment|live[-.:]?source[-.:]?set[-.:]?rate|set[-.:]?rate|stage[-.:]?play[-.:]?reflection[-.:]?result/.test(normalized)) return "live_environment";
  if (/live[-.:]?source[-.:]?mail|mailbox|read-processed-live-source-mail|process-live-source-mail|reflect-live-source-mail-loop|mail-loop-causality|processed-mail-loop/.test(normalized)) return "live_source_mail";
  if (/record-live-source-mail-decision|live[-.:]?source[-.:]?decision/.test(normalized)) return "live_source_decision";
  if (/voice[-.:]?delivery|voice[-.:]?output|request-interim-voice-callout|callout/.test(normalized)) return "voice_delivery";
  if (/moral[-.:]?graph|moralgraph|reflect[-.:]?ideology[-.:]?context|procedural[-.:]?moral[-.:]?classification/.test(normalized)) return "moral_graph_reflection";
  if (/theory[-.:]?locator|theory[-.:]?context|reflect[-.:]?theory[-.:]?context|frontiervectorfieldtrace|frontier[-.:]?vector[-.:]?field/.test(normalized)) return "theory_locator";
  if (
    /context[-.:]?reflection|context[-.:]?binding|bounded[-.:]?context|context[-.:]?attachment|dragged[-.:]?cutout|selected[-.:]?ui[-.:]?region|reflect[-.:]?context[-.:]?attachments|live[-.:]?synthetic[-.:]?data|live[-.:]?answer[-.:]?synthetic|microdeck[-.:]?reflection|macro[-.:]?reasoner[-.:]?deck|mail[-.:]?loop[-.:]?synthetic|prediction[-.:]?review/.test(
      normalized,
    )
  ) return "context_reflection";
  if (/civilization[-.:]?bounds|civilization[-.:]?scenario|civilization[-.:]?roadmap|reflect-civilization-bounds/.test(normalized)) return "civilization_bounds";
  if (
    /runtime[-.:]?evidence|capability[-.:]?catalog|capability[-.:]?help|what[-.:]?tools[-.:]?are[-.:]?available|inspect-capability-catalog|workstation[-.:]?tool[-.:]?alignment|toolchain[-.:]?matrix|tool[-.:]?regression[-.:]?matrix/.test(
      normalized,
    )
  ) return "capability_catalog";
  return null;
};

const exactMatches = new Map<string, ToolFamilyContract>();
for (const entry of TOOL_FAMILY_CONTRACTS) {
  exactMatches.set(normalize(entry.toolName), entry);
  for (const alias of entry.aliases ?? []) {
    exactMatches.set(normalize(alias), entry);
  }
}

export const normalizeToolFamily = (value: unknown): ToolFamily | null => normalizeFamily(value);

export const inferToolFamilyFromToolName = (toolName: unknown): ToolFamily | null =>
  normalizeFamily(toolName);

export const getToolFamilyDefaultContract = (toolFamily: ToolFamily): ToolFamilyContract =>
  TOOL_FAMILY_DEFAULT_CONTRACTS[toolFamily];

export function resolveToolFamilyContract(input: {
  toolName?: unknown;
  toolFamily?: unknown;
}): ToolFamilyContract | null {
  const toolName = normalize(input.toolName);
  if (toolName && exactMatches.has(toolName)) return exactMatches.get(toolName) ?? null;
  const inferredFromTool = normalizeFamily(input.toolName);
  if (inferredFromTool) return getToolFamilyDefaultContract(inferredFromTool);
  const family = normalizeFamily(input.toolFamily);
  return family ? getToolFamilyDefaultContract(family) : null;
}

export const contractsForToolFamily = (toolFamily: ToolFamily): ToolFamilyContract[] =>
  TOOL_FAMILY_CONTRACTS.filter((entry) => entry.toolFamily === toolFamily);
