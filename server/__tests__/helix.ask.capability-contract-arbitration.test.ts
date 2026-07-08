import { describe, expect, it } from "vitest";

import {
  answerScopeForExplicitCapability,
  canonicalGoalKindForExplicitCapability,
} from "../services/helix-ask/capability-contract-arbitration";
import {
  explicitCapabilityContractsForTests,
  explicitCapabilityContractForCapability,
  extractExplicitCapabilityContracts,
} from "../services/helix-ask/explicit-capability-contract";
import { WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS } from "../services/helix-ask/workstation-context-feed-query-tool-contracts";

describe("Helix capability contract arbitration", () => {
  it("routes every canonical workstation context-feed query capability to live environment review", () => {
    for (const spec of WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS) {
      expect(canonicalGoalKindForExplicitCapability(spec.capability)).toBe("live_environment_review");
      expect(answerScopeForExplicitCapability(spec.capability)).toBe("live_environment_state");
    }
  });

  it("keeps explicit capability commands on domain-specific canonical goals and scopes", () => {
    const cases = [
      ["helix_ask.reflect_workstation_tool_alignment", "capability_help", "runtime_evidence"],
      ["helix_ask.inspect_capability_catalog", "capability_help", "runtime_evidence"],
      ["scientific-calculator.solve_expression", "calculator_solve", "current_turn_action"],
      ["scientific-calculator.solve_with_steps", "calculator_solve", "current_turn_action"],
      ["scientific-calculator.solve", "calculator_solve", "current_turn_action"],
      ["scientific-calculator.open", "calculator_open", "current_turn_action"],
      ["scientific-calculator.start_equation_live_source", "calculator_live_source_setup", "current_turn_action"],
      ["workspace_os.status", "workspace_status_diagnostic", "workspace_state"],
      ["docs-viewer.open", "doc_open", "current_turn_doc"],
      ["docs-viewer.open_doc_by_path", "doc_open", "current_turn_doc"],
      ["docs-viewer.identify_current_doc", "active_doc_identity", "current_turn_doc"],
      ["docs-viewer.search_docs", "docs_search", "current_turn_doc"],
      ["docs-viewer.validate_doc_candidates", "doc_candidate_validation", "current_turn_doc"],
      ["docs-viewer.locate_in_doc", "locate_in_doc", "current_turn_doc"],
      ["docs-viewer.summarize_doc", "doc_summary", "current_turn_doc"],
      ["docs-viewer.doc_equation_context", "doc_equation_context", "current_turn_doc"],
      ["repo-code.search_concept", "repo_code_evidence_question", "repo_evidence"],
      ["workspace-directory.resolve", "workspace_directory_resolution", "workspace_state"],
      ["internet_search.web_research", "internet_search_lookup", "external_internet_search"],
      ["scholarly-research.lookup_papers", "scholarly_research_lookup", "external_scholarly_research"],
      ["scholarly-research.fetch_full_text", "scholarly_full_text_lookup", "external_scholarly_research"],
      ["helix_ask.reflect_theory_context", "theory_context_reflection", "theory_context"],
      ["helix.theory.frontierVectorFieldTrace", "theory_frontier_vector_field", "theory_context"],
      ["helix_ask.reflect_live_synthetic_data", "context_attachment_reflection", "context_reflection"],
      ["helix_ask.reflect_context_attachments", "context_attachment_reflection", "context_reflection"],
      ["image_lens.inspect", "visual_capture_describe", "visual_capture"],
      ["situation-room.describe_visual_capture", "visual_capture_describe", "visual_capture"],
      ["helix_ask.reflect_ideology_context", "moral_graph_reflection", "moral_graph_reflection"],
      ["helix_ask.bridge_theory_ideology_context", "theory_ideology_bridge_reflection", "moral_graph_reflection"],
      ["helix_ask.build_civilization_scenario_frame", "civilization_bounds_reflection", "civilization_bounds"],
      ["helix_ask.reflect_civilization_bounds", "civilization_bounds_reflection", "civilization_bounds"],
      ["live_env.check_live_source_mail", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.read_live_source_mail", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.read_processed_live_source_mail", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.process_live_source_mail", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.reflect_live_source_mail_loop", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.query_micro_reasoner_presets", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.query_micro_reasoner_prompts", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.draft_micro_reasoner_preset", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.route_micro_reasoner_prompt", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.query_live_source_quality", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.summarize_live_source_current_state", "live_source_mailbox_review", "live_source_mail"],
      ["live_env.apply_micro_reasoner_preset", "live_environment_review", "live_environment_state"],
      ["live_env.create_micro_reasoner_preset", "live_environment_review", "live_environment_state"],
      ["live_env.update_micro_reasoner_prompt", "live_environment_review", "live_environment_state"],
      ["live_env.test_micro_reasoner_prompt", "live_environment_review", "live_environment_state"],
      ["live_env.read_card", "live_environment_review", "live_environment_state"],
      ["live_env.query_event_log", "live_environment_review", "live_environment_state"],
      ["live_env.query_world_events", "live_environment_review", "live_environment_state"],
      ["live_env.query_navigation_state", "live_environment_review", "live_environment_state"],
      ["live_env.plan_stage_play_job", "live_environment_review", "live_environment_state"],
      ["live_env.configure_visual_observer_profile", "live_environment_review", "live_environment_state"],
      ["live_env.apply_visual_observer_profile", "live_environment_review", "live_environment_state"],
      ["live_env.query_visual_observer_profiles", "live_environment_review", "live_environment_state"],
      ["live_env.test_visual_observer_profile", "live_environment_review", "live_environment_state"],
      ["live_env.compare_visual_observer_profiles", "live_environment_review", "live_environment_state"],
      ["live_env.request_visual_action_replay", "live_environment_review", "live_environment_state"],
      ["live_env.configure_interpreter_profile", "live_environment_review", "live_environment_state"],
      ["live_env.compare_mail_to_interpreter_profile", "live_environment_review", "live_environment_state"],
      ["live_env.request_stage_play_checkpoint", "live_environment_review", "live_environment_state"],
      ["live_env.predict_live_source_immediate", "live_environment_review", "live_environment_state"],
      ["live_env.compare_live_source_prediction", "live_environment_review", "live_environment_state"],
      ["live_env.project_live_source_narrative", "live_environment_review", "live_environment_state"],
      ["live_env.record_live_source_mail_decision", "processed_mail_voice_decision", "live_source_mail"],
      ["live_env.request_interim_voice_callout", "processed_mail_voice_decision", "live_environment_state"],
      ["workstation-notes.append_to_note", "workstation_note_edit", "workspace_state"],
      ["workstation-notes.create_note", "workstation_note_edit", "workspace_state"],
      ["workstation-notes.open", "workstation_note_open", "workspace_state"],
    ] as const;

    for (const [capability, goalKind, answerScope] of cases) {
      expect(canonicalGoalKindForExplicitCapability(capability), capability).toBe(goalKind);
      expect(answerScopeForExplicitCapability(capability), capability).toBe(answerScope);
    }
  });

  it("keeps every explicit capability contract mapped to a canonical goal and answer scope", () => {
    for (const contract of explicitCapabilityContractsForTests) {
      expect(canonicalGoalKindForExplicitCapability(contract.capability), contract.capability)
        .toEqual(expect.any(String));
      expect(answerScopeForExplicitCapability(contract.capability), contract.capability)
        .toEqual(expect.any(String));
    }
  });

  it("keeps every parity target family backed by an explicit capability contract", () => {
    const cases = [
      ["calculator", "scientific-calculator.solve_expression", "calculator_receipt", "workstation_tool_evaluation"],
      ["docs_viewer", "docs-viewer.locate_in_doc", "doc_location_matches", "doc_location_matches"],
      ["repo_code", "repo-code.search_concept", "repo_code_evidence_observation", "repo_code_evidence_answer"],
      ["workspace_directory", "workspace-directory.resolve", "workspace_directory_resolution", "workspace_directory_resolution"],
      ["workspace_diagnostic", "workspace_os.status", "workspace_os_status_observation", "model_synthesized_answer"],
      ["capability_catalog", "helix_ask.inspect_capability_catalog", "capability_registry", "capability_help_summary"],
      ["internet_search", "internet_search.web_research", "internet_search_observation", "internet_search_answer"],
      ["scholarly_research", "scholarly-research.lookup_papers", "scholarly_research_observation", "scholarly_research_answer"],
      ["theory_locator", "helix_ask.reflect_theory_context", "theory_context_reflection", "theory_context_reflection_answer"],
      ["live_source_mail", "live_env.read_processed_live_source_mail", "stage_play_processed_mail_packet", "model_synthesized_answer"],
      ["live_environment", "live_env.query_workstation_goal_context", "live_environment_tool_observation", "model_synthesized_answer"],
      ["visual_capture", "image_lens.inspect", "situation_context_pack", "situation_context_pack"],
      ["civilization_bounds", "helix_ask.reflect_civilization_bounds", "civilization_bounds_roadmap/v1", "model_synthesized_answer"],
      ["moral_graph_reflection", "helix_ask.reflect_ideology_context", "ideology_context_reflection/v1", "model_synthesized_answer"],
      ["workstation", "workstation-notes.create_note", "note_update_receipt", "note_update_receipt"],
    ] as const;

    for (const [family, capability, observationKind, terminalKind] of cases) {
      const contract = explicitCapabilityContractForCapability(capability);
      expect(contract?.capability_family, capability).toBe(family);
      expect(contract?.required_observation_kinds, capability).toContain(observationKind);
      expect(contract?.required_terminal_kind, capability).toBe(terminalKind);
      expect(contract?.allowed_substitutions, capability).toEqual(expect.any(Array));
      expect(contract?.forbidden_nearby_capabilities, capability).toContain("model.direct_answer");
      expect(contract?.required_args, capability).toEqual(expect.any(Array));
    }
  });

  it("extracts an explicit requested capability for every parity target family", () => {
    const cases = [
      ["calculator", "Call scientific-calculator.solve_expression with this exact expression: 2+2.", "scientific-calculator.solve_expression"],
      ["docs_viewer", "Use docs-viewer.locate_in_doc to cite the terminal authority rule.", "docs-viewer.locate_in_doc"],
      ["repo_code", "Use repo-code.search_concept to find terminal authority enforcement.", "repo-code.search_concept"],
      ["workspace_directory", "Run workspace-directory.resolve for docs/helix-ask-codex-loop-discipline.md.", "workspace-directory.resolve"],
      ["workspace_diagnostic", "Use workspace_os.status to inspect workstation status.", "workspace_os.status"],
      ["capability_catalog", "Call helix_ask.inspect_capability_catalog to list visible tools.", "helix_ask.inspect_capability_catalog"],
      ["internet_search", "Use internet_search.web_research to find a cited paper source.", "internet_search.web_research"],
      ["scholarly_research", "Call scholarly-research.lookup_papers for Alcubierre metric papers.", "scholarly-research.lookup_papers"],
      ["theory_locator", "Use helix_ask.reflect_theory_context to map this claim on the theory graph.", "helix_ask.reflect_theory_context"],
      ["live_source_mail", "Run live_env.read_processed_live_source_mail to inspect processed mailbox evidence.", "live_env.read_processed_live_source_mail"],
      ["live_environment", "Call live_env.query_workstation_goal_context to inspect goal context.", "live_env.query_workstation_goal_context"],
      ["visual_capture", "Use situation-room.describe_visual_capture to inspect the current visual frame.", "image_lens.inspect"],
      ["civilization_bounds", "Call helix_ask.reflect_civilization_bounds to reflect collaboration bounds.", "helix_ask.reflect_civilization_bounds"],
      ["moral_graph_reflection", "Use helix_ask.reflect_ideology_context to reflect the moral graph context.", "helix_ask.reflect_ideology_context"],
    ] as const;

    for (const [family, promptText, expectedCapability] of cases) {
      const extracted = extractExplicitCapabilityContracts(promptText);
      expect(extracted.map((entry) => entry.contract.capability), family).toContain(expectedCapability);
      const match = extracted.find((entry) => entry.contract.capability === expectedCapability);
      expect(match?.contract.capability_family, family).toBe(family);
      expect(match?.source, family).toBe("command_mention");
    }
  });

  it("covers the named explicit tool-call parity surface with contracts and extraction", () => {
    const cases = [
      [
        "scientific-calculator.solve_expression",
        "scientific-calculator.solve_expression",
        "calculator",
        "calculator_receipt",
        "workstation_tool_evaluation",
      ],
      [
        "repo-code.search_concept",
        "repo-code.search_concept",
        "repo_code",
        "repo_code_evidence_observation",
        "repo_code_evidence_answer",
      ],
      [
        "docs-viewer.locate_in_doc",
        "docs-viewer.locate_in_doc",
        "docs_viewer",
        "doc_location_matches",
        "doc_location_matches",
      ],
      [
        "docs-viewer.doc_equation_context",
        "docs-viewer.doc_equation_context",
        "docs_viewer",
        "doc_equation_context",
        "doc_equation_context",
      ],
      [
        "workspace-directory.resolve",
        "workspace-directory.resolve",
        "workspace_directory",
        "workspace_directory_resolution",
        "workspace_directory_resolution",
      ],
      [
        "internet_search.web_research",
        "internet_search.web_research",
        "internet_search",
        "internet_search_observation",
        "internet_search_answer",
      ],
      [
        "scholarly-research.lookup_papers",
        "scholarly-research.lookup_papers",
        "scholarly_research",
        "scholarly_research_observation",
        "scholarly_research_answer",
      ],
      [
        "helix_ask.reflect_theory_context",
        "helix_ask.reflect_theory_context",
        "theory_locator",
        "theory_context_reflection",
        "theory_context_reflection_answer",
      ],
      [
        "live_env.query_micro_reasoner_presets",
        "live_env.query_micro_reasoner_presets",
        "live_source_mail",
        "stage_play_micro_reasoner_prompt_preset_query_result",
        "model_synthesized_answer",
      ],
      [
        "live_env.draft_micro_reasoner_preset",
        "live_env.draft_micro_reasoner_preset",
        "live_source_mail",
        "stage_play_micro_reasoner_prompt_preset_draft",
        "model_synthesized_answer",
      ],
      [
        "live_env.route_micro_reasoner_prompt",
        "live_env.route_micro_reasoner_prompt",
        "live_source_mail",
        "stage_play_micro_reasoner_prompt_delegation_result",
        "model_synthesized_answer",
      ],
      [
        "live_env.read_processed_live_source_mail",
        "live_env.read_processed_live_source_mail",
        "live_source_mail",
        "stage_play_processed_mail_packet",
        "model_synthesized_answer",
      ],
      [
        "live_env.process_live_source_mail",
        "live_env.process_live_source_mail",
        "live_source_mail",
        "stage_play_processed_mail_packet",
        "model_synthesized_answer",
      ],
      [
        "live_env.reflect_live_source_mail_loop",
        "live_env.reflect_live_source_mail_loop",
        "live_source_mail",
        "stage_play_live_source_mail_loop_reflection",
        "model_synthesized_answer",
      ],
      [
        "live_env.record_live_source_mail_decision",
        "live_env.record_live_source_mail_decision",
        "live_source_decision",
        "stage_play_live_source_mail_decision",
        "model_synthesized_answer",
      ],
      [
        "live_env.request_interim_voice_callout",
        "live_env.request_interim_voice_callout",
        "voice_delivery",
        "live_source_interim_voice_callout_receipt",
        "model_synthesized_answer",
      ],
      [
        "workspace_os.status",
        "workspace_os.status",
        "workspace_diagnostic",
        "workspace_os_status_observation",
        "model_synthesized_answer",
      ],
      [
        "helix_ask.reflect_ideology_context",
        "helix_ask.reflect_ideology_context",
        "moral_graph_reflection",
        "ideology_context_reflection/v1",
        "model_synthesized_answer",
      ],
      [
        "helix_ask.build_civilization_scenario_frame",
        "helix_ask.build_civilization_scenario_frame",
        "civilization_bounds",
        "civilization_scenario_frame/v1",
        "model_synthesized_answer",
      ],
      [
        "helix_ask.reflect_civilization_bounds",
        "helix_ask.reflect_civilization_bounds",
        "civilization_bounds",
        "civilization_bounds_roadmap/v1",
        "model_synthesized_answer",
      ],
      [
        "situation-room.describe_visual_capture",
        "image_lens.inspect",
        "visual_capture",
        "situation_context_pack",
        "situation_context_pack",
      ],
    ] as const;

    for (const [requestedName, expectedCapability, family, observationKind, terminalKind] of cases) {
      const contract = explicitCapabilityContractForCapability(requestedName);
      expect(contract?.capability, requestedName).toBe(expectedCapability);
      expect(contract?.capability_family, requestedName).toBe(family);
      expect(contract?.required_observation_kinds, requestedName).toContain(observationKind);
      expect(contract?.required_terminal_kind, requestedName).toBe(terminalKind);
      expect(contract?.forbidden_nearby_capabilities, requestedName).toContain("model.direct_answer");

      const extracted = extractExplicitCapabilityContracts(`Call ${requestedName} for the parity rail check.`);
      expect(extracted.map((entry) => entry.contract.capability), requestedName).toContain(expectedCapability);
    }
  });
});
