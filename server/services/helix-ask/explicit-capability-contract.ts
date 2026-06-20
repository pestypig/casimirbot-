import type { HelixCapabilityFamily } from "@shared/helix-capability-plan";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import type { HelixToolCallAdmissionFamily } from "@shared/helix-tool-call-admission";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import { WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS } from "./workstation-context-feed-query-tool-contracts";

export type ExplicitCapabilityContract = {
  schema: "helix.explicit_capability_contract.v1";
  capability: string;
  runtime_capability?: string;
  aliases?: string[];
  capability_family: string;
  plan_family: HelixCapabilityFamily;
  source_target: string;
  admission_families: HelixToolCallAdmissionFamily[];
  required_observation_kinds: string[];
  required_terminal_kind: string;
  allowed_substitutions: string[];
  forbidden_nearby_capabilities: string[];
  required_args: string[];
  optional_args: string[];
};

type ExplicitCapabilityContractDefinition =
  Omit<ExplicitCapabilityContract, "required_args" | "optional_args"> &
  Partial<Pick<ExplicitCapabilityContract, "required_args" | "optional_args">>;

export type ExtractedExplicitCapabilityContract = {
  contract: ExplicitCapabilityContract;
  capability: string;
  matched_name: string;
  match_index: number;
  match_end_index: number;
  source: "command_mention" | "compound_command_chain";
};

const liveEnvironmentControlContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKind?: string;
  requiredTerminalKind?: string;
  forbiddenNearbyCapabilities?: string[];
}): ExplicitCapabilityContractDefinition => ({
  schema: "helix.explicit_capability_contract.v1",
  capability: input.capability,
  ...(input.aliases ? { aliases: input.aliases } : {}),
  capability_family: "live_environment",
  plan_family: "live_environment",
  source_target: "live_environment",
  admission_families: ["live_environment", "workstation_action"],
  required_observation_kinds: [
    "live_environment_tool_observation",
    input.requiredObservationKind ?? "stage_play_workstation_control_receipt",
    "helix.workstation_goal_context_update.v1",
  ],
  required_terminal_kind: input.requiredTerminalKind ?? "workstation_tool_evaluation",
  allowed_substitutions: [],
  forbidden_nearby_capabilities: input.forbiddenNearbyCapabilities ?? [
    "live_env.read_processed_live_source_mail",
    "live_env.read_live_source_mail",
    "model.direct_answer",
  ],
});

const liveEnvironmentQueryContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKind?: string;
  requiredObservationKinds?: string[];
}): ExplicitCapabilityContractDefinition => ({
  schema: "helix.explicit_capability_contract.v1",
  capability: input.capability,
  ...(input.aliases ? { aliases: input.aliases } : {}),
  capability_family: "live_environment",
  plan_family: "live_environment",
  source_target: "live_environment",
  admission_families: ["live_environment"],
  required_observation_kinds: [
    "live_environment_tool_observation",
    ...(input.requiredObservationKinds ?? (input.requiredObservationKind ? [input.requiredObservationKind] : [])),
    "helix.workstation_goal_context_update.v1",
  ],
  required_terminal_kind: "model_synthesized_answer",
  allowed_substitutions: [],
  forbidden_nearby_capabilities: [
    "live_env.read_processed_live_source_mail",
    "live_env.read_live_source_mail",
    "live_env.process_live_source_mail",
    "model.direct_answer",
  ],
});

const liveSourceMailEvidenceContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKinds: string[];
}): ExplicitCapabilityContractDefinition => ({
  schema: "helix.explicit_capability_contract.v1",
  capability: input.capability,
  ...(input.aliases ? { aliases: input.aliases } : {}),
  capability_family: "live_source_mail",
  plan_family: "live_environment",
  source_target: "live_source_mailbox",
  admission_families: ["live_environment"],
  required_observation_kinds: input.requiredObservationKinds,
  required_terminal_kind: "model_synthesized_answer",
  allowed_substitutions: [],
  forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
});

const contextReflectionEvidenceContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKinds: string[];
}): ExplicitCapabilityContractDefinition => ({
  schema: "helix.explicit_capability_contract.v1",
  capability: input.capability,
  ...(input.aliases ? { aliases: input.aliases } : {}),
  capability_family: "context_reflection",
  plan_family: "context_reflection",
  source_target: "context_reflection",
  admission_families: ["context_reflection"],
  required_observation_kinds: input.requiredObservationKinds,
  required_terminal_kind: "model_synthesized_answer",
  allowed_substitutions: [],
  forbidden_nearby_capabilities: ["model.direct_answer"],
});

const requiredArgsForCapability = (capability: string): string[] => {
  switch (capability) {
    case "scientific-calculator.solve_expression":
      return ["latex"];
    case "docs-viewer.locate_in_doc":
      return ["query"];
    case "repo-code.search_concept":
      return ["query"];
    case "workspace-directory.resolve":
      return ["query"];
    case "internet_search.web_research":
      return ["query"];
    case HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY:
      return ["query"];
    case HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY:
      return ["paper_result_or_source"];
    case "workstation-notes.append_to_note":
      return ["text"];
    default:
      return [];
  }
};

const optionalArgsForCapability = (capability: string): string[] => {
  switch (capability) {
    case "scientific-calculator.solve_expression":
      return ["expression", "equation"];
    case "docs-viewer.open":
      return ["path", "anchor", "selected_text"];
    case "docs-viewer.locate_in_doc":
      return ["path", "anchor", "term", "text"];
    case "docs-viewer.summarize_doc":
      return ["path", "anchor", "selected_text"];
    case "docs-viewer.doc_equation_context":
      return ["path", "anchor", "query", "selected_text"];
    case "repo-code.search_concept":
      return ["concept", "limit"];
    case "workspace-directory.resolve":
      return ["uri", "path", "target", "target_kinds", "limit"];
    case "internet_search.web_research":
      return ["question", "prompt", "topic", "search_query"];
    case HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY:
      return ["doi", "arxiv_id", "arxivId", "title", "journal", "reference", "citation", "limit"];
    case HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY:
      return ["paper_result_id", "paper_id", "result_id", "doi", "arxiv_id", "arxivId", "source_url", "pdf_url", "full_text_url", "url"];
    case "image_lens.inspect":
      return ["view_state", "source_id", "regions"];
    case "workstation-notes.append_to_note":
      return ["body", "content", "note_id", "title"];
    default:
      return [];
  }
};

const normalizeExplicitCapabilityContract = (
  contract: ExplicitCapabilityContractDefinition,
): ExplicitCapabilityContract => ({
  ...contract,
  required_args: contract.required_args ?? requiredArgsForCapability(contract.capability),
  optional_args: contract.optional_args ?? optionalArgsForCapability(contract.capability),
});

const explicitCapabilityContractDefinitions: ExplicitCapabilityContractDefinition[] = [
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.inspect_capability_catalog",
    aliases: ["helix.ask.inspect_capability_catalog", "inspect_capability_catalog"],
    capability_family: "capability_catalog",
    plan_family: "capability_catalog",
    source_target: "runtime_evidence",
    admission_families: ["capability_catalog", "runtime_evidence"],
    required_observation_kinds: ["capability_registry"],
    required_terminal_kind: "capability_help_summary",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.reflect_workstation_tool_alignment",
    aliases: [
      "workstation_tool_alignment",
      "workstation_tools_matrix",
      "toolchain_matrix",
      "tool_regression_matrix",
      "release_checklist_tools",
    ],
    capability_family: "capability_catalog",
    plan_family: "capability_catalog",
    source_target: "runtime_evidence",
    admission_families: ["capability_catalog", "runtime_evidence"],
    required_observation_kinds: ["capability_registry"],
    required_terminal_kind: "capability_help_summary",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "scientific-calculator.solve_expression",
    capability_family: "calculator",
    plan_family: "workstation_action",
    source_target: "calculator_stream",
    admission_families: ["calculator", "workstation_action"],
    required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workspace_os.status",
    capability_family: "workspace_diagnostic",
    plan_family: "workspace_diagnostic",
    source_target: "workspace_diagnostic",
    admission_families: ["workspace_diagnostic"],
    required_observation_kinds: ["workspace_os_status_observation"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["debug.inspect_current_turn"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.open",
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_open_receipt", "docs_viewer_receipt"],
    required_terminal_kind: "doc_open_receipt",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.locate_in_doc",
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_location_result", "doc_location_matches", "doc_evidence_location"],
    required_terminal_kind: "doc_location_matches",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.summarize_doc"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.summarize_doc",
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_summary", "observation_review"],
    required_terminal_kind: "doc_summary",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.locate_in_doc"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.doc_equation_context",
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_equation_context"],
    required_terminal_kind: "doc_equation_context",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "repo-code.search_concept",
    capability_family: "repo_code",
    plan_family: "repo_evidence",
    source_target: "repo_code",
    admission_families: ["repo_code"],
    required_observation_kinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
    required_terminal_kind: "repo_code_evidence_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.locate_in_doc", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workspace-directory.resolve",
    capability_family: "workspace_directory",
    plan_family: "workspace_directory",
    source_target: "workspace_directory",
    admission_families: ["workspace_directory"],
    required_observation_kinds: ["workspace_directory_resolution"],
    required_terminal_kind: "workspace_directory_resolution",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "internet_search.web_research",
    runtime_capability: HELIX_INTERNET_SEARCH_CAPABILITY,
    aliases: [HELIX_INTERNET_SEARCH_CAPABILITY],
    capability_family: "internet_search",
    plan_family: "internet_search",
    source_target: "internet_search",
    admission_families: ["internet_search"],
    required_observation_kinds: ["internet_search_observation"],
    required_terminal_kind: "internet_search_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    aliases: ["scholarly_research.lookup_papers", "scholarly_research", "lookup_papers"],
    capability_family: "scholarly_research",
    plan_family: "scholarly_research",
    source_target: "scholarly_research",
    admission_families: ["scholarly_research"],
    required_observation_kinds: ["scholarly_research_observation"],
    required_terminal_kind: "scholarly_research_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    aliases: ["scholarly_research.fetch_full_text", "fetch_full_text", "scholarly_full_text"],
    capability_family: "scholarly_research",
    plan_family: "scholarly_research",
    source_target: "scholarly_research",
    admission_families: ["scholarly_research"],
    required_observation_kinds: ["scholarly_full_text_observation"],
    required_terminal_kind: "scholarly_research_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  liveSourceMailEvidenceContract({
    capability: "live_env.query_micro_reasoner_presets",
    aliases: [
      "microdeck",
      "micro_reasoner_presets",
      "earbud_microdeck",
      "audio_transcript_microdeck",
      "earbud_translation_presets",
      "stage_play_micro_reasoner_prompt_preset_query_result/v1",
    ],
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_query_result"],
  }),
  liveSourceMailEvidenceContract({
    capability: "live_env.draft_micro_reasoner_preset",
    aliases: [
      "microdeck_draft",
      "micro_reasoner_preset_draft",
      "earbud_microdeck_draft",
      "audio_translation_preset_draft",
      "stage_play_micro_reasoner_prompt_preset_draft/v1",
    ],
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_preset_draft"],
  }),
  liveSourceMailEvidenceContract({
    capability: "live_env.route_micro_reasoner_prompt",
    aliases: [
      "microdeck_prompt_router",
      "prompt_delegation",
      "stage_play_micro_reasoner_prompt_delegation_result/v1",
    ],
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_delegation_result"],
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.read_processed_live_source_mail",
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_processed_mail_packet"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.process_live_source_mail",
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_live_source_mail_read_result", "stage_play_processed_mail_packet"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  liveSourceMailEvidenceContract({
    capability: "live_env.query_live_source_quality",
    aliases: ["live_source_quality", "source_freshness", "stage_play_live_source_quality/v1"],
    requiredObservationKinds: [
      "stage_play_live_source_quality",
      "helix.workstation_goal_context_update.v1",
    ],
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.query_workstation_goal_context",
    aliases: [
      "workstation_goal_context",
      "goal_context_updates",
      "agent_goal_sessions",
      "active_goals",
      "active_goal_sessions",
      "agent_goal_context",
      "stage_play_workstation_goal_context_read_result/v1",
    ],
    requiredObservationKinds: [
      "stage_play_workstation_goal_context_read_result",
      "helix.agent_goal_session.v1",
    ],
  }),
  liveSourceMailEvidenceContract({
    capability: "live_env.summarize_live_source_current_state",
    aliases: [
      "live_answer_state",
      "live_source_current_state",
      "stage_play_live_source_current_state/v1",
    ],
    requiredObservationKinds: [
      "stage_play_live_source_current_state",
      "helix.workstation_goal_context_update.v1",
    ],
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.reflect_live_source_mail_loop",
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_live_source_mail_loop_reflection"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.reflect_stage_play_context",
    aliases: ["reflect_stage_play_context", "stage_play_reflection"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment"],
    required_observation_kinds: ["live_environment_tool_observation", "stage_play_reflection_result"],
    required_terminal_kind: "direct_answer_text",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.configure_live_source_watch_job",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "situation-room.describe_visual_capture",
      "model.direct_answer",
    ],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.narrator_say",
    aliases: ["narrator.say", "narrator_say"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment", "workstation_action"],
    required_observation_kinds: ["live_environment_tool_observation", "helix.narrator_say_request.v1"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.narrator_bind_stream",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "model.direct_answer",
    ],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.narrator_bind_stream",
    aliases: ["narrator.bind_stream", "narrator_bind_stream"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment", "workstation_action"],
    required_observation_kinds: ["live_environment_tool_observation", "helix.narrator_bind_stream_request.v1"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.narrator_say",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "model.direct_answer",
    ],
  },
  liveEnvironmentControlContract({
    capability: "live_env.change_workstation_preset",
    aliases: ["change_workstation_preset", "change_preset"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.set_visual_preset",
    aliases: ["set_visual_preset", "visual_preset"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.set_audio_preset",
    aliases: ["set_audio_preset", "audio_preset"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.bind_workstation_source",
    aliases: ["bind_workstation_source", "bind_source"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.unbind_workstation_source",
    aliases: ["unbind_workstation_source", "unbind_source"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.pause_workstation_loop",
    aliases: ["pause_workstation_loop", "pause_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.resume_workstation_loop",
    aliases: ["resume_workstation_loop", "resume_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.set_workstation_loop_state",
    aliases: ["set_workstation_loop_state", "set_loop_state"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.configure_route_watch",
    aliases: ["configure_route_watch", "route_watch_policy"],
    requiredObservationKind: "stage_play_live_source_watch_job_policy_config_result",
  }),
  liveEnvironmentControlContract({
    capability: "live_env.configure_live_source_watch_job",
    aliases: ["configure_live_source_watch_job", "live_source_watch_job", "watch_job_policy"],
    requiredObservationKind: "stage_play_live_source_watch_job_policy_config_result",
  }),
  liveEnvironmentControlContract({
    capability: "live_env.repair_loop",
    aliases: ["repair_loop"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.repair_workstation_source",
    aliases: ["repair_workstation_source", "repair_source"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.update_live_answer_projection",
    aliases: ["update_live_answer_projection", "update_live_answer"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.focus_process_graph",
    aliases: ["focus_process_graph"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.start_agent_goal_session",
    aliases: ["start_agent_goal_session"],
    requiredObservationKind: "stage_play_agent_goal_session_tool_result",
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.evaluate_goal_satisfaction",
    aliases: ["evaluate_goal_satisfaction", "goal_satisfaction"],
    capability_family: "live_environment",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment"],
    required_observation_kinds: ["live_environment_tool_observation", "helix.live_environment_goal_satisfaction.v1"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: [
      "live_env.start_agent_goal_session",
      "live_env.read_processed_live_source_mail",
      "live_env.read_live_source_mail",
      "model.direct_answer",
    ],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.record_live_source_mail_decision",
    capability_family: "live_source_decision",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment", "workstation_action"],
    required_observation_kinds: [
      "stage_play_processed_mail_packet",
      "stage_play_live_source_mail_decision",
    ],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.request_interim_voice_callout",
    capability_family: "voice_delivery",
    plan_family: "live_environment",
    source_target: "live_environment",
    admission_families: ["live_environment", "workstation_action"],
    required_observation_kinds: [
      "stage_play_live_source_mail_decision",
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  ...WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.map((spec) => liveEnvironmentQueryContract({
    capability: spec.capability,
    aliases: [...spec.aliases],
    requiredObservationKind: spec.explicitRequiredObservationKind,
  })),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.reflect_theory_context",
    aliases: ["reflect_theory_context", "theory_context_reflection", "theory_badge_graph"],
    capability_family: "theory_locator",
    plan_family: "context_reflection",
    source_target: "theory_locator",
    admission_families: ["theory_locator"],
    required_observation_kinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
    required_terminal_kind: "theory_context_reflection_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  contextReflectionEvidenceContract({
    capability: "helix_ask.reflect_live_synthetic_data",
    aliases: [
      "live_synthetic_data_reflection",
      "live_answer_synthetic_data",
      "microdeck_reflection",
      "macro_reasoner_deck_reflection",
      "mail_loop_synthetic_data",
      "live_answer_prediction_review",
    ],
    requiredObservationKinds: [
      "helix_context_reflection_tool_receipt/v1",
      "bounded_context_reference",
    ],
  }),
  contextReflectionEvidenceContract({
    capability: "helix_ask.reflect_context_attachments",
    aliases: [
      "context_attachment_reflection",
      "context_binding_reflection",
      "dragged_cutout_context",
      "selected_ui_region",
      "selected_context_refs",
      "helix_context_reflection_tool_receipt/v1",
    ],
    requiredObservationKinds: [
      "helix_context_reflection_tool_receipt/v1",
      "context_attachment",
      "bounded_context_reference",
    ],
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.reflect_ideology_context",
    aliases: ["reflect_ideology_context", "zen_graph_reflection", "zen_graph"],
    capability_family: "zen_graph_reflection",
    plan_family: "context_reflection",
    source_target: "workspace_action",
    admission_families: ["workstation_action"],
    required_observation_kinds: [
      "ideology_context_reflection/v1",
      "procedural_zen_classification/v1",
      "helix_zen_graph_reflection_tool_result",
      "workstation_tool_evaluation",
    ],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.bridge_theory_ideology_context",
    aliases: ["bridge_theory_ideology_context", "theory_zen_bridge"],
    capability_family: "zen_graph_reflection",
    plan_family: "context_reflection",
    source_target: "workspace_action",
    admission_families: ["workstation_action"],
    required_observation_kinds: ["helix_theory_ideology_bridge_tool_result", "theory_ideology_bridge"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.build_civilization_scenario_frame",
    aliases: ["build_civilization_scenario_frame", "civilization_scenario_frame"],
    capability_family: "civilization_bounds",
    plan_family: "context_reflection",
    source_target: "workspace_action",
    admission_families: ["workstation_action"],
    required_observation_kinds: ["civilization_scenario_frame/v1", "helix_civilization_scenario_frame_tool_result"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix_ask.reflect_civilization_bounds",
    aliases: ["reflect_civilization_bounds", "civilization_bounds_reflection", "civilization_bounds_roadmap/v1"],
    capability_family: "civilization_bounds",
    plan_family: "context_reflection",
    source_target: "workspace_action",
    admission_families: ["workstation_action"],
    required_observation_kinds: ["civilization_bounds_roadmap/v1", "helix_civilization_bounds_tool_result"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "image_lens.inspect",
    runtime_capability: "situation-room.describe_visual_capture",
    aliases: ["image_lens", "image-lens", "visual_capture", "situation-room.describe_visual_capture"],
    capability_family: "visual_capture",
    plan_family: "visual_capture",
    source_target: "visual_capture",
    admission_families: ["situation_run"],
    required_observation_kinds: ["visual_frame_evidence", "situation_context_pack", "visual_capture_coverage"],
    required_terminal_kind: "situation_context_pack",
    allowed_substitutions: ["situation-room.describe_visual_capture"],
    forbidden_nearby_capabilities: ["docs-viewer.locate_in_doc", "repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workstation-notes.append_to_note",
    capability_family: "workstation",
    plan_family: "workstation_action",
    source_target: "workspace_action",
    admission_families: ["notes", "workstation_action"],
    required_observation_kinds: [
      "workspace_action_receipt",
      "note_update_receipt",
      "note_action_receipt",
    ],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
];

const explicitCapabilityContracts: ExplicitCapabilityContract[] =
  explicitCapabilityContractDefinitions.map(normalizeExplicitCapabilityContract);

const commandVerb = String.raw`(?:call|use|run|invoke|execute|inspect\s+using|locate\s+(?:in\s+doc\s+)?using|find\s+using)`;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const commandMentionsCapability = (prompt: string, capability: string): boolean => {
  const escaped = escapeRegex(capability);
  return new RegExp(String.raw`\b${commandVerb}\b[\s\S]{0,80}\b${escaped}\b`, "i").test(prompt);
};

const capabilityMentionRegex = (capability: string): RegExp =>
  new RegExp(String.raw`\b${escapeRegex(capability)}\b`, "gi");

const commandMentionsCapabilityAt = (prompt: string, capability: string, matchIndex: number): boolean => {
  const windowStart = Math.max(0, matchIndex - 100);
  const before = prompt.slice(windowStart, matchIndex);
  return new RegExp(String.raw`\b${commandVerb}\b[\s\S]{0,100}$`, "i").test(before) ||
    commandMentionsCapability(prompt.slice(Math.max(0, matchIndex - 20), matchIndex + capability.length + 90), capability);
};

const compoundCommandChainMentionsCapabilityAt = (prompt: string, matchIndex: number): boolean => {
  const before = prompt.slice(Math.max(0, matchIndex - 120), matchIndex);
  if (!new RegExp(String.raw`\b${commandVerb}\b`, "i").test(prompt)) return false;
  return /\b(?:then|and|plus|after|before|followed\s+by|next)\b[\s\S]{0,80}$/i.test(before);
};

const commandMentionsContract = (prompt: string, contract: ExplicitCapabilityContract): boolean => {
  const names = uniqueStrings([
    contract.capability,
    contract.runtime_capability ?? "",
    ...(contract.aliases ?? []),
  ]);
  return names.some((name) => commandMentionsCapability(prompt, name));
};

const familySuppressed = (prompt: string, contract: ExplicitCapabilityContract): boolean => {
  const suppression = detectContextualToolAdmissionSuppression(prompt);
  if (!suppression) return false;
  if (suppression.suppression_reason === "explanatory_only") return false;
  return contract.admission_families.some((family: HelixToolCallAdmissionFamily) =>
    contextualToolSuppressionBlocksFamily(suppression, family)
  );
};

export const explicitCapabilityContractForCapability = (
  capability: string | null | undefined,
): ExplicitCapabilityContract | null => {
  const normalized = String(capability ?? "").trim();
  if (!normalized) return null;
  return explicitCapabilityContracts.find((contract: ExplicitCapabilityContract) =>
    contract.capability === normalized ||
    contract.runtime_capability === normalized ||
    (contract.aliases ?? []).includes(normalized)
  ) ?? null;
};

export const extractExplicitCapabilityContract = (
  promptText: string | null | undefined,
): ExplicitCapabilityContract | null => {
  return extractExplicitCapabilityContracts(promptText)[0]?.contract ?? null;
};

export const extractExplicitCapabilityContracts = (
  promptText: string | null | undefined,
): ExtractedExplicitCapabilityContract[] => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return [];
  const matches: ExtractedExplicitCapabilityContract[] = [];
  for (const contract of explicitCapabilityContracts) {
    if (familySuppressed(prompt, contract)) continue;
    const names = uniqueStrings([
      contract.capability,
      contract.runtime_capability ?? "",
      ...(contract.aliases ?? []),
    ]);
    let best: ExtractedExplicitCapabilityContract | null = null;
    for (const name of names) {
      const matcher = capabilityMentionRegex(name);
      for (const match of prompt.matchAll(matcher)) {
        const matchIndex = typeof match.index === "number" ? match.index : -1;
        if (matchIndex < 0) continue;
        const commandMention = commandMentionsCapabilityAt(prompt, name, matchIndex);
        const compoundMention = compoundCommandChainMentionsCapabilityAt(prompt, matchIndex);
        if (!commandMention && !compoundMention) continue;
        const candidate: ExtractedExplicitCapabilityContract = {
          contract,
          capability: contract.capability,
          matched_name: name,
          match_index: matchIndex,
          match_end_index: matchIndex + name.length,
          source: commandMention ? "command_mention" : "compound_command_chain",
        };
        if (!best || candidate.match_index < best.match_index) {
          best = candidate;
        }
      }
    }
    if (best) matches.push(best);
  }
  return matches
    .sort((left, right) => left.match_index - right.match_index)
    .filter((match, index, ordered) =>
      ordered.findIndex((entry) => entry.contract.capability === match.contract.capability) === index
    );
};

export const explicitCapabilityMatches = (
  requestedCapability: string | null | undefined,
  actualCapability: string | null | undefined,
): boolean => {
  const requested = String(requestedCapability ?? "").trim();
  const actual = String(actualCapability ?? "").trim();
  if (!requested || !actual) return false;
  if (requested === actual) return true;
  const contract = explicitCapabilityContractForCapability(requested);
  return Boolean(
    contract?.runtime_capability === actual ||
      contract?.allowed_substitutions.includes(actual) ||
      contract?.aliases?.includes(actual),
  );
};

export const explicitCapabilityContractsForTests = explicitCapabilityContracts;
