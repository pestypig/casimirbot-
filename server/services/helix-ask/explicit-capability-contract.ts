import type { HelixCapabilityFamily } from "@shared/helix-capability-plan";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import type { HelixToolCallAdmissionFamily } from "@shared/helix-tool-call-admission";
import {
  askCapabilityCatalogPromptMatchIndex,
  isAskCapabilityCatalogPrompt,
} from "./capability-catalog-intent";
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
  source: "command_mention" | "compound_command_chain" | "capability_catalog_prompt";
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

const liveEnvironmentEvidenceContract = (input: {
  capability: string;
  aliases?: string[];
  requiredObservationKinds?: string[];
  requiredTerminalKind?: string;
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
    ...(input.requiredObservationKinds ?? []),
  ],
  required_terminal_kind: input.requiredTerminalKind ?? "model_synthesized_answer",
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
    case "scientific-calculator.solve_with_steps":
    case "scientific-calculator.solve":
      return ["latex"];
    case "docs-viewer.locate_in_doc":
      return ["query"];
    case "docs-viewer.doc_equation_context":
      return ["query"];
    case "docs-viewer.search_docs":
      return ["query"];
    case "docs-viewer.open_doc_by_path":
      return ["path"];
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
    case "live_env.draft_micro_reasoner_preset":
      return ["scenario_text"];
    case "live_env.route_micro_reasoner_prompt":
      return ["source_summary"];
    case "helix_ask.reflect_theory_context":
      return ["prompt"];
    case "helix.theory.frontierVectorFieldTrace":
      return ["query"];
    case "helix_ask.reflect_live_synthetic_data":
      return ["prompt"];
    case "helix_ask.reflect_context_attachments":
      return ["prompt"];
    case "helix_ask.reflect_ideology_context":
      return ["text"];
    case "helix_ask.bridge_theory_ideology_context":
      return ["prompt"];
    case "helix_ask.build_civilization_scenario_frame":
      return ["prompt"];
    case "helix_ask.reflect_civilization_bounds":
      return ["prompt"];
    case "workstation-notes.create":
    case "workstation-notes.create_note":
      return ["title"];
    case "workstation-notes.append":
    case "workstation-notes.append_to_note":
      return ["text"];
    default:
      return [];
  }
};

const optionalArgsForCapability = (capability: string): string[] => {
  switch (capability) {
    case "scientific-calculator.solve_expression":
    case "scientific-calculator.solve_with_steps":
    case "scientific-calculator.solve":
      return ["expression", "equation"];
    case "scientific-calculator.start_equation_live_source":
      return ["latex", "expression", "equation"];
    case "docs-viewer.open":
      return ["path", "anchor", "selected_text"];
    case "docs-viewer.identify_current_doc":
      return ["path", "anchor", "selected_text"];
    case "docs-viewer.locate_in_doc":
      return ["path", "anchor", "term", "text"];
    case "docs-viewer.search_docs":
      return ["limit", "topic", "title"];
    case "docs-viewer.validate_doc_candidates":
      return ["query", "selected_path", "path"];
    case "docs-viewer.open_doc_by_path":
      return ["anchor", "selected_text"];
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
    case "live_env.query_micro_reasoner_presets":
      return ["query", "include_presets", "limit", "source_id", "source_ids", "preset_id"];
    case "live_env.draft_micro_reasoner_preset":
      return ["base_preset_id", "candidate_prompts", "confidence_threshold", "escalation_mode", "allow_none", "wake_prompt_contract", "wake_contract_prompt", "wake_contract_title"];
    case "live_env.route_micro_reasoner_prompt":
      return ["candidate_prompts", "confidence_threshold", "escalation_mode", "allow_none", "wake_prompt_contract", "wake_contract_prompt", "wake_contract_title"];
    case "live_env.query_micro_reasoner_prompts":
    case "live_env.apply_micro_reasoner_preset":
    case "live_env.create_micro_reasoner_preset":
    case "live_env.update_micro_reasoner_prompt":
    case "live_env.test_micro_reasoner_prompt":
      return ["query", "source_id", "source_ids", "preset_id", "role", "candidate_prompts", "base_preset_id", "scenario_text", "include_presets", "limit"];
    case "live_env.read_card":
    case "live_env.query_event_log":
    case "live_env.query_world_events":
    case "live_env.query_navigation_state":
    case "live_env.query_constructs":
    case "live_env.query_job_evidence":
    case "live_env.request_probe":
    case "live_env.record_commentary":
      return ["environment_id", "room_id", "world_id", "line_keys", "event_types", "title", "summary", "reason", "evidence_refs", "limit"];
    case "live_env.plan_stage_play_job":
    case "live_env.request_stage_play_checkpoint":
      return ["objective", "objective_text", "room_id", "environment_id", "source_id", "job_id", "reason", "evidence_refs"];
    case "live_env.configure_visual_observer_profile":
    case "live_env.apply_visual_observer_profile":
    case "live_env.query_visual_observer_profiles":
    case "live_env.test_visual_observer_profile":
    case "live_env.compare_visual_observer_profiles":
    case "live_env.request_visual_action_replay":
      return ["profile_id", "profile_ids", "source_id", "source_ids", "title", "domain", "prompt", "summary", "include_presets", "limit"];
    case "live_env.configure_interpreter_profile":
    case "live_env.compare_mail_to_interpreter_profile":
    case "live_env.predict_live_source_immediate":
    case "live_env.compare_live_source_prediction":
    case "live_env.project_live_source_narrative":
      return ["profile_id", "mail_ids", "narrative_state_id", "policy_id", "job_id", "source_id", "room_id", "environment_id", "objective", "objective_text", "evidence_refs", "limit"];
    case "live_env.query_live_source_quality":
      return ["source_ref", "source_refs", "source_id", "source_ids", "expected_cadence_ms", "mailbox_thread_id"];
    case "live_env.summarize_live_source_current_state":
      return ["source_ref", "source_refs", "source_id", "source_ids", "goal_id", "mail_limit", "limit", "query"];
    case "live_env.record_live_source_mail_decision":
      return ["evidence_refs", "mail_ids", "processed_packet_ids", "wake_request_id", "mailbox_thread_id", "route_metadata"];
    case "live_env.request_interim_voice_callout":
      return ["text", "message", "callout_text", "evidence_refs", "wake_request_id", "mailbox_thread_id", "route_metadata", "kind", "max_chars"];
    case "helix_ask.reflect_theory_context":
      return ["source_ref", "source_refs", "refs", "question", "topic"];
    case "helix.theory.frontierVectorFieldTrace":
      return ["question", "prompt", "topic"];
    case "helix_ask.reflect_live_synthetic_data":
    case "helix_ask.reflect_context_attachments":
      return ["source_ref", "source_refs", "refs", "question", "topic"];
    case "helix_ask.reflect_ideology_context":
      return ["inputKind", "refs", "options", "prompt", "source_ref", "source_refs"];
    case "helix_ask.bridge_theory_ideology_context":
      return ["source_refs", "refs", "theory_reflection_ref", "ideology_reflection_ref"];
    case "helix_ask.build_civilization_scenario_frame":
      return ["refs", "options", "scenario", "scenario_text", "source_ref", "source_refs"];
    case "helix_ask.reflect_civilization_bounds":
      return ["scenarioFrameRef", "source_ref", "source_refs", "refs", "options"];
    case "image_lens.inspect":
      return ["view_state", "source_id", "regions"];
    case "workstation-notes.create":
    case "workstation-notes.create_note":
      return ["text", "body", "content"];
    case "workstation-notes.append":
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
    aliases: [
      "helix.ask.inspect_capability_catalog",
      "inspect_capability_catalog",
      "capability_catalog",
      "capability catalog",
      "runtime_capability_catalog",
      "runtime capability catalog",
      "tool_catalog",
      "tool catalog",
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
    aliases: [
      "calculator",
      "calculator.solve_expression",
      "calculator solve expression",
      "calculator_stream",
      "calculator stream",
      "scientific-calculator",
      "scientific calculator",
      "solve expression",
    ],
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
    capability: "scientific-calculator.solve_with_steps",
    aliases: ["calculator.solve_with_steps", "scientific calculator solve with steps", "solve with calculator steps"],
    capability_family: "calculator",
    plan_family: "workstation_action",
    source_target: "calculator_stream",
    admission_families: ["calculator", "workstation_action"],
    required_observation_kinds: ["calculator_receipt", "calculator_subgoal_receipt", "workstation_tool_evaluation"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "scientific-calculator.solve",
    aliases: ["calculator.solve", "scientific calculator solve"],
    capability_family: "calculator",
    plan_family: "workstation_action",
    source_target: "calculator_stream",
    admission_families: ["calculator", "workstation_action"],
    required_observation_kinds: ["calculator_receipt", "calculator_subgoal_receipt", "workstation_tool_evaluation"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["repo-code.search_concept", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "scientific-calculator.open",
    aliases: ["calculator.open", "open scientific calculator", "open calculator"],
    capability_family: "calculator",
    plan_family: "workstation_action",
    source_target: "calculator_stream",
    admission_families: ["calculator", "workstation_action"],
    required_observation_kinds: ["workspace_action_receipt"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "scientific-calculator.start_equation_live_source",
    aliases: ["calculator.start_equation_live_source", "calculator live source", "start equation live source"],
    capability_family: "calculator",
    plan_family: "workstation_action",
    source_target: "calculator_stream",
    admission_families: ["calculator", "workstation_action"],
    required_observation_kinds: ["workspace_action_receipt", "calculator_live_source_status"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workspace_os.status",
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
    capability_family: "workspace_diagnostic",
    plan_family: "workspace_diagnostic",
    source_target: "workspace_diagnostic",
    admission_families: ["workspace_diagnostic"],
    required_observation_kinds: ["workspace_os_status_observation"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["debug.inspect_current_turn", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.open",
    aliases: [
      "docs_viewer.open",
      "docs_viewer open",
      "docs_viewer to open",
      "docs viewer open",
      "docs viewer to open",
    ],
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
    capability: "docs-viewer.identify_current_doc",
    aliases: ["docs_viewer.identify_current_doc", "docs viewer identify current doc", "identify current doc"],
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["active_doc_identity", "doc_open_receipt", "docs_viewer_receipt"],
    required_terminal_kind: "doc_open_receipt",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.search_docs",
    aliases: ["docs_viewer.search_docs", "docs viewer search docs", "search docs"],
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_search_results", "retrieval_context"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.summarize_doc", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.validate_doc_candidates",
    aliases: ["docs_viewer.validate_doc_candidates", "docs viewer validate candidates", "validate doc candidates"],
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_candidate_validation"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.summarize_doc", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.open_doc_by_path",
    aliases: ["docs_viewer.open_doc_by_path", "docs viewer open doc by path", "open doc by path"],
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_open_receipt"],
    required_terminal_kind: "doc_open_receipt",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.locate_in_doc",
    aliases: [
      "docs_viewer.locate_in_doc",
      "docs_viewer locate",
      "docs_viewer to locate",
      "docs viewer locate",
      "docs viewer to locate",
      "docs_viewer cite",
      "docs_viewer to cite",
      "docs viewer cite",
      "docs viewer to cite",
    ],
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_location_result", "doc_location_matches", "doc_evidence_location"],
    required_terminal_kind: "doc_location_matches",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.summarize_doc", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.summarize_doc",
    aliases: [
      "docs_viewer.summarize_doc",
      "docs_viewer summarize",
      "docs_viewer to summarize",
      "docs viewer summarize",
      "docs viewer to summarize",
    ],
    capability_family: "docs_viewer",
    plan_family: "docs",
    source_target: "docs_viewer",
    admission_families: ["docs_viewer"],
    required_observation_kinds: ["doc_summary", "observation_review"],
    required_terminal_kind: "doc_summary",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["docs-viewer.locate_in_doc", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "docs-viewer.doc_equation_context",
    aliases: [
      "docs_viewer.doc_equation_context",
      "docs_viewer equation context",
      "docs_viewer to inspect equation context",
      "docs viewer equation context",
      "docs viewer to inspect equation context",
    ],
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
    aliases: [
      "repo_code.search_concept",
      "repo code search concept",
      "repo_code",
      "repo code",
      "repo_evidence",
      "repository code",
    ],
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
    aliases: [
      "workspace_directory.resolve",
      "workspace directory resolve",
      "workspace_directory",
      "workspace directory",
      "workspace_directory_resolution",
      "workspace directory resolution",
    ],
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
    aliases: [
      HELIX_INTERNET_SEARCH_CAPABILITY,
      "internet_search",
      "internet search",
      "web_research",
      "web research",
      "web.search",
      "web search",
    ],
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
    aliases: [
      "scholarly_research.lookup_papers",
      "scholarly_research",
      "scholarly research",
      "scholarly research lookup",
      "lookup_papers",
    ],
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
    aliases: [
      "scholarly_research.fetch_full_text",
      "scholarly research fetch full text",
      "fetch_full_text",
      "fetch full text",
      "scholarly_full_text",
      "scholarly full text",
      "scholarly research full text",
    ],
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
      "micro reasoner presets",
      "micro reasoner preset catalog",
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
      "micro reasoner preset draft",
      "draft micro reasoner preset",
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
      "microdeck prompt router",
      "micro reasoner prompt router",
      "prompt_delegation",
      "stage_play_micro_reasoner_prompt_delegation_result/v1",
    ],
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt_delegation_result"],
  }),
  liveSourceMailEvidenceContract({
    capability: "live_env.query_micro_reasoner_prompts",
    aliases: [
      "micro_reasoner_prompts",
      "micro reasoner prompts",
      "stage_play_micro_reasoner_prompt/v1",
    ],
    requiredObservationKinds: ["stage_play_micro_reasoner_prompt"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.apply_micro_reasoner_preset",
    aliases: ["apply_micro_reasoner_preset", "apply micro reasoner preset"],
    requiredObservationKind: "stage_play_micro_reasoner_prompt_preset",
  }),
  liveEnvironmentControlContract({
    capability: "live_env.create_micro_reasoner_preset",
    aliases: ["create_micro_reasoner_preset", "create micro reasoner preset"],
    requiredObservationKind: "stage_play_micro_reasoner_prompt_preset",
  }),
  liveEnvironmentControlContract({
    capability: "live_env.update_micro_reasoner_prompt",
    aliases: ["update_micro_reasoner_prompt", "update micro reasoner prompt"],
    requiredObservationKind: "stage_play_micro_reasoner_prompt",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.test_micro_reasoner_prompt",
    aliases: ["test_micro_reasoner_prompt", "test micro reasoner prompt"],
    requiredObservationKind: "stage_play_micro_reasoner_prompt_test",
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.check_live_source_mail",
    aliases: [
      "check_live_source_mail",
      "live_source_mail.check",
      "live_source_mail check",
      "live_source_mail to check",
      "live source mail check",
      "live source mail to check",
      "live source mailbox check",
      "live source mailbox to check",
      "check live source mail",
      "check live source mailbox",
      "check source mail",
      "check mailbox",
    ],
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_live_source_mail_read_result"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.read_live_source_mail",
    aliases: [
      "read_live_source_mail",
      "live_source_mail.read_raw",
      "live_source_mail raw read",
      "live_source_mail read raw",
      "live_source_mail to read raw",
      "live source mail raw read",
      "live source mail read raw",
      "live source mail to read raw",
      "live source mailbox raw read",
      "live source mailbox read raw",
      "live source mailbox to read raw",
      "raw live source mail",
      "raw mail",
      "read raw mail",
      "unprocessed live source mail",
      "debug live source mail",
    ],
    capability_family: "live_source_mail",
    plan_family: "live_environment",
    source_target: "live_source_mailbox",
    admission_families: ["live_environment"],
    required_observation_kinds: ["stage_play_live_source_mail_read_result"],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["internet_search.web_research", "model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.read_processed_live_source_mail",
    aliases: [
      "read_processed_live_source_mail",
      "processed_live_source_mail",
      "live_source_mail.read_processed",
      "live_source_mail read",
      "live_source_mail to read",
      "live source mail read",
      "live source mail to read",
      "live source mailbox read",
      "live source mailbox to read",
    ],
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
    aliases: [
      "process_live_source_mail",
      "live_source_mail.process",
      "live_source_mail process",
      "live_source_mail to process",
      "live source mail process",
      "live source mail to process",
      "live source mailbox process",
      "live source mailbox to process",
    ],
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
  liveEnvironmentQueryContract({
    capability: "live_env.read_card",
    aliases: ["read_card", "live_card", "live card"],
    requiredObservationKind: "live_environment_tool_observation",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.query_event_log",
    aliases: ["query_event_log", "event_log", "live event log"],
    requiredObservationKind: "live_environment_tool_observation",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.query_world_events",
    aliases: ["query_world_events", "world_events", "world events"],
    requiredObservationKind: "live_environment_tool_observation",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.query_navigation_state",
    aliases: ["query_navigation_state", "navigation_state", "navigation state"],
    requiredObservationKind: "live_environment_tool_observation",
  }),
  liveEnvironmentEvidenceContract({
    capability: "live_env.plan_stage_play_job",
    aliases: ["plan_stage_play_job", "stage play job plan"],
    requiredObservationKinds: ["stage_play_job_plan"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.configure_visual_observer_profile",
    aliases: ["configure_visual_observer_profile", "visual_observer_profile", "visual observer profile"],
    requiredObservationKind: "stage_play_visual_observer_profile",
  }),
  liveEnvironmentControlContract({
    capability: "live_env.apply_visual_observer_profile",
    aliases: ["apply_visual_observer_profile", "apply visual observer profile", "apply visual observer shades"],
    requiredObservationKind: "stage_play_visual_observer_profile",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.query_visual_observer_profiles",
    aliases: ["query_visual_observer_profiles", "visual observer profiles", "visual observer shades"],
    requiredObservationKind: "stage_play_visual_observer_profile",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.test_visual_observer_profile",
    aliases: ["test_visual_observer_profile", "test visual observer profile"],
    requiredObservationKind: "stage_play_visual_observer_profile_test",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.compare_visual_observer_profiles",
    aliases: ["compare_visual_observer_profiles", "compare visual observer profiles"],
    requiredObservationKind: "stage_play_visual_observer_profile_test",
  }),
  liveEnvironmentEvidenceContract({
    capability: "live_env.request_visual_action_replay",
    aliases: ["request_visual_action_replay", "visual action replay"],
    requiredObservationKinds: ["helix_visual_frame_action_replay_request"],
  }),
  liveEnvironmentControlContract({
    capability: "live_env.configure_interpreter_profile",
    aliases: ["configure_interpreter_profile", "interpreter profile"],
    requiredObservationKind: "stage_play_live_source_interpreter_profile",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.compare_mail_to_interpreter_profile",
    aliases: ["compare_mail_to_interpreter_profile", "mail interpreter profile comparison"],
    requiredObservationKind: "stage_play_live_source_interpreter_profile_comparison",
  }),
  liveEnvironmentEvidenceContract({
    capability: "live_env.request_stage_play_checkpoint",
    aliases: ["request_stage_play_checkpoint", "stage play checkpoint"],
    requiredObservationKinds: ["stage_play_checkpoint_request"],
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.predict_live_source_immediate",
    aliases: ["predict_live_source_immediate", "predict live source immediate"],
    requiredObservationKind: "helix_live_source_immediate_prediction",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.compare_live_source_prediction",
    aliases: ["compare_live_source_prediction", "compare live source prediction"],
    requiredObservationKind: "helix_live_source_prediction_comparison",
  }),
  liveEnvironmentControlContract({
    capability: "live_env.project_live_source_narrative",
    aliases: ["project_live_source_narrative", "live source narrative state"],
    requiredObservationKind: "stage_play_live_source_narrative_state",
  }),
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "live_env.reflect_live_source_mail_loop",
    aliases: [
      "reflect_live_source_mail_loop",
      "live_source_mail.reflect",
      "live_source_mail reflect",
      "live_source_mail to reflect",
      "live source mail reflect",
      "live source mail to reflect",
      "live source mailbox reflect",
      "live source mailbox to reflect",
      "live_source_mail_loop_reflection",
      "mailbox loop reflection",
    ],
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
  liveEnvironmentQueryContract({
    capability: "live_env.query_constructs",
    aliases: ["query_constructs", "situation room constructs"],
    requiredObservationKind: "live_environment_tool_observation",
  }),
  liveEnvironmentQueryContract({
    capability: "live_env.query_job_evidence",
    aliases: ["query_job_evidence", "live job evidence"],
    requiredObservationKind: "live_environment_tool_observation",
  }),
  liveEnvironmentEvidenceContract({
    capability: "live_env.request_probe",
    aliases: ["request_probe", "bounded live evidence probe"],
  }),
  liveEnvironmentEvidenceContract({
    capability: "live_env.record_commentary",
    aliases: ["record_commentary", "live evidence commentary"],
  }),
  liveEnvironmentEvidenceContract({
    capability: "live_env.spawn_field_worker",
    aliases: ["spawn_field_worker", "spawn field worker"],
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
    aliases: [
      "reflect_theory_context",
      "theory_context",
      "theory_context_reflection",
      "theory_locator",
      "theory_badge_graph",
    ],
    capability_family: "theory_locator",
    plan_family: "theory_locator",
    source_target: "theory_locator",
    admission_families: ["theory_locator"],
    required_observation_kinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
    required_terminal_kind: "theory_context_reflection_answer",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "helix.theory.frontierVectorFieldTrace",
    aliases: [
      "frontierVectorFieldTrace",
      "frontier_vector_field_trace",
      "theory_frontier_vector_field",
      "theory_frontier_vector_field_trace",
      "badge_coordinate_vector_trace",
      "relation_tensor_trace",
    ],
    capability_family: "theory_locator",
    plan_family: "theory_locator",
    source_target: "theory_locator",
    admission_families: ["theory_locator"],
    required_observation_kinds: [
      "helix_theory_frontier_vector_field_tool_receipt",
      "theory_frontier_vector_field",
    ],
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
      "context_reflection.attachments",
      "context_reflection attachments",
      "context_reflection to inspect attachments",
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
    aliases: [
      "reflect_ideology_context",
      "ideology_context_reflection",
      "zen_graph_reflection",
      "zen graph reflection",
      "zen_graph",
      "zen graph",
    ],
    capability_family: "zen_graph_reflection",
    plan_family: "zen_graph_reflection",
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
    aliases: [
      "bridge_theory_ideology_context",
      "bridge theory ideology context",
      "bridge theory and ideology context",
      "theory_ideology_bridge",
      "theory ideology bridge",
      "theory_zen_bridge",
      "theory zen bridge",
    ],
    capability_family: "zen_graph_reflection",
    plan_family: "zen_graph_reflection",
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
    aliases: [
      "build_civilization_scenario_frame",
      "build civilization scenario frame",
      "civilization_scenario_frame",
      "civilization scenario frame",
    ],
    capability_family: "civilization_bounds",
    plan_family: "civilization_bounds",
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
    aliases: [
      "reflect_civilization_bounds",
      "reflect civilization bounds",
      "civilization_bounds",
      "civilization bounds",
      "civilization_bounds_reflection",
      "civilization bounds reflection",
      "civilization_bounds_roadmap/v1",
    ],
    capability_family: "civilization_bounds",
    plan_family: "civilization_bounds",
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
    aliases: ["workstation-notes.append", "workstation notes append"],
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
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workstation-notes.create_note",
    aliases: ["workstation-notes.create", "workstation notes create", "create workstation note"],
    capability_family: "workstation",
    plan_family: "workstation_action",
    source_target: "workspace_action",
    admission_families: ["notes", "workstation_action"],
    required_observation_kinds: [
      "workspace_action_receipt",
      "note_context",
      "note_create_receipt",
    ],
    required_terminal_kind: "model_synthesized_answer",
    allowed_substitutions: ["workstation-notes.create"],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
  {
    schema: "helix.explicit_capability_contract.v1",
    capability: "workstation-notes.open",
    aliases: ["workstation notes open", "open workstation notes"],
    capability_family: "workstation",
    plan_family: "workstation_action",
    source_target: "workspace_action",
    admission_families: ["notes", "workstation_action"],
    required_observation_kinds: ["workspace_action_receipt"],
    required_terminal_kind: "workstation_tool_evaluation",
    allowed_substitutions: [],
    forbidden_nearby_capabilities: ["model.direct_answer"],
  },
];

const explicitCapabilityContracts: ExplicitCapabilityContract[] =
  explicitCapabilityContractDefinitions.map(normalizeExplicitCapabilityContract);

const commandVerb = String.raw`(?:call|use|run|invoke|execute|inspect\s+using|locate\s+(?:in\s+doc\s+)?using|find\s+using)`;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const normalizeCapabilityKey = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s._:-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const capabilityKeysMatch = (
  left: unknown,
  right: unknown,
): boolean => {
  const normalizedLeft = normalizeCapabilityKey(left);
  const normalizedRight = normalizeCapabilityKey(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

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

const negatedCommandMentionsCapabilityAt = (prompt: string, matchIndex: number): boolean => {
  const before = prompt.slice(Math.max(0, matchIndex - 140), matchIndex);
  const clausePrefix = before.split(/[.!?;\n]/).pop() ?? before;
  return new RegExp(
    String.raw`\b(?:do\s+not|don't|dont|never|avoid|without|no)\b[\s\S]{0,80}\b(?:${commandVerb})?\b[\s\S]{0,80}$`,
    "i",
  ).test(clausePrefix);
};

const compoundCommandChainMentionsCapabilityAt = (prompt: string, matchIndex: number): boolean => {
  const before = prompt.slice(Math.max(0, matchIndex - 120), matchIndex);
  if (!new RegExp(String.raw`\b${commandVerb}\b`, "i").test(prompt)) return false;
  return /\b(?:then|and|plus|after|before|followed\s+by|next)\b[\s\S]{0,80}$/i.test(before);
};

const commandClauseOrdinal = (prompt: string, matchIndex: number): number => {
  const before = prompt.slice(0, Math.max(0, matchIndex));
  return Array.from(
    before.matchAll(/\b(?:then|next|followed\s+by|and\s+then|plus)\b\s+(?:call|use|run|invoke|execute)?\b/gi),
  ).length;
};

const commandMentionsContract = (prompt: string, contract: ExplicitCapabilityContract): boolean => {
  const names = uniqueStrings([
    contract.capability,
    contract.runtime_capability ?? "",
    ...(contract.aliases ?? []),
  ]);
  return names.some((name) => {
    const matcher = capabilityMentionRegex(name);
    for (const match of prompt.matchAll(matcher)) {
      const matchIndex = typeof match.index === "number" ? match.index : -1;
      if (matchIndex < 0) continue;
      if (negatedCommandMentionsCapabilityAt(prompt, matchIndex)) continue;
      if (commandMentionsCapabilityAt(prompt, name, matchIndex)) return true;
    }
    return false;
  });
};

const familySuppressed = (prompt: string, contract: ExplicitCapabilityContract): boolean => {
  if (commandMentionsContract(prompt, contract)) return false;
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
    capabilityKeysMatch(contract.capability, normalized) ||
    capabilityKeysMatch(contract.runtime_capability, normalized) ||
    (contract.aliases ?? []).some((alias) => capabilityKeysMatch(alias, normalized)) ||
    contract.allowed_substitutions.some((substitution) => capabilityKeysMatch(substitution, normalized))
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
  const capabilityCatalogContract = explicitCapabilityContractForCapability("helix_ask.inspect_capability_catalog");
  const capabilityCatalogMatchIndex = askCapabilityCatalogPromptMatchIndex(prompt);
  if (
    capabilityCatalogContract &&
    isAskCapabilityCatalogPrompt(prompt) &&
    !familySuppressed(prompt, capabilityCatalogContract)
  ) {
    matches.push({
      contract: capabilityCatalogContract,
      capability: capabilityCatalogContract.capability,
      matched_name: "capability_catalog_prompt",
      match_index: capabilityCatalogMatchIndex ?? 0,
      match_end_index: capabilityCatalogMatchIndex ?? 0,
      source: "capability_catalog_prompt",
    });
  }
  for (const contract of explicitCapabilityContracts) {
    if (familySuppressed(prompt, contract)) continue;
    const names = uniqueStrings([
      contract.capability,
      contract.runtime_capability ?? "",
      ...(contract.aliases ?? []),
    ]);
    for (const name of names) {
      const matcher = capabilityMentionRegex(name);
      for (const match of prompt.matchAll(matcher)) {
        const matchIndex = typeof match.index === "number" ? match.index : -1;
        if (matchIndex < 0) continue;
        const commandMention = commandMentionsCapabilityAt(prompt, name, matchIndex);
        const compoundMention = compoundCommandChainMentionsCapabilityAt(prompt, matchIndex);
        if ((commandMention || compoundMention) && negatedCommandMentionsCapabilityAt(prompt, matchIndex)) continue;
        if (!commandMention && !compoundMention) continue;
        const candidate: ExtractedExplicitCapabilityContract = {
          contract,
          capability: contract.capability,
          matched_name: name,
          match_index: matchIndex,
          match_end_index: matchIndex + name.length,
          source: commandMention ? "command_mention" : "compound_command_chain",
        };
        matches.push(candidate);
      }
    }
  }
  const seen = new Set<string>();
  const orderedMatches = matches
    .sort((left, right) =>
      left.match_index - right.match_index ||
      (right.match_end_index - right.match_index) - (left.match_end_index - left.match_index)
    )
    .filter((match) => {
      const key = `${match.contract.capability}:${match.match_index}:${match.match_end_index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const clauseSeen = new Set<string>();
  const clauseDedupeMatches = orderedMatches.filter((match) => {
    const key = `${match.contract.capability}:${commandClauseOrdinal(prompt, match.match_index)}`;
    if (clauseSeen.has(key)) return false;
    clauseSeen.add(key);
    return true;
  });
  return clauseDedupeMatches.filter((match, index, ordered) =>
    !ordered.some((other, otherIndex) => {
      if (otherIndex === index) return false;
      const matchLength = Math.max(0, match.match_end_index - match.match_index);
      const otherLength = Math.max(0, other.match_end_index - other.match_index);
      return other.match_index <= match.match_index &&
        other.match_end_index >= match.match_end_index &&
        otherLength > matchLength;
    })
  );
};

export const explicitCapabilityMatches = (
  requestedCapability: string | null | undefined,
  actualCapability: string | null | undefined,
): boolean => {
  const requested = String(requestedCapability ?? "").trim();
  const actual = String(actualCapability ?? "").trim();
  if (!requested || !actual) return false;
  if (capabilityKeysMatch(requested, actual)) return true;
  const contract = explicitCapabilityContractForCapability(requested);
  return Boolean(
    capabilityKeysMatch(contract?.runtime_capability, actual) ||
      contract?.allowed_substitutions.some((substitution) => capabilityKeysMatch(substitution, actual)) ||
      contract?.aliases?.some((alias) => capabilityKeysMatch(alias, actual)),
  );
};

export const explicitCapabilityContractsForTests = explicitCapabilityContracts;
