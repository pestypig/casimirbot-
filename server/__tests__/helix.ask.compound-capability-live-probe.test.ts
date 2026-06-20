import { describe, expect, it } from "vitest";

import {
  BROAD_LIVE_PROBE_BLOCK_MESSAGE,
  COMPOUND_CAPABILITY_LIVE_SCENARIOS,
  evaluateCompoundCapabilityScenario,
  resolveCompoundCapabilityLiveRunPolicy,
  selectCompoundCapabilityLiveScenarios,
  type CompoundCapabilityScenario,
} from "../../scripts/helix-ask-compound-capability-live-probe";

const scenarioById = (id: string): CompoundCapabilityScenario => {
  const scenario = COMPOUND_CAPABILITY_LIVE_SCENARIOS.find((entry) => entry.id === id);
  if (!scenario) throw new Error(`missing_scenario:${id}`);
  return scenario;
};

const workspaceThenCalculatorDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:compound-live";
  const workspaceSubgoalId = `${turnId}:compound_capability_subgoal:1:workspace_os_status`;
  const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:2:scientific-calculator_solve_expression`;
  const compoundSubgoalLedger = [
    {
      subgoal_id: workspaceSubgoalId,
      order: 1,
      requested_capability: "workspace_os.status",
      selected_capability: "workspace_os.status",
      executed_capability: "workspace_os.status",
      args: {},
      required_args: [],
      optional_args: [],
      input_bindings: [],
      observation_kind: "workspace_os_status_observation",
      observation_ref: "obs:workspace-status",
      observation_provenance: "compound_subgoal_id",
      support_refs: ["obs:workspace-status"],
      bound_input_refs: [],
      unresolved_input_bindings: [],
      satisfaction: "satisfied",
      rail_status: "complete",
      first_broken_rail: null,
      rail_failure_code: null,
      repair_target: null,
    },
    {
      subgoal_id: calculatorSubgoalId,
      order: 2,
      requested_capability: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      args: {
        latex: "14*23+8",
        expression: "14*23+8",
      },
      required_args: ["latex"],
      optional_args: ["expression", "equation"],
      input_bindings: [],
      observation_kind: "calculator_receipt",
      observation_ref: "obs:calculator",
      observation_provenance: "capability_key",
      support_refs: ["obs:calculator"],
      bound_input_refs: [],
      unresolved_input_bindings: [],
      satisfaction: "satisfied",
      rail_status: "complete",
      first_broken_rail: null,
      rail_failure_code: null,
      repair_target: null,
    },
  ];
  const compoundSubgoalRailStatuses = compoundSubgoalLedger.map((entry) => ({
    subgoal_id: entry.subgoal_id,
    order: entry.order,
    requested_capability: entry.requested_capability,
    selected_capability: entry.selected_capability,
    executed_capability: entry.executed_capability,
    args: entry.args,
    required_args: entry.required_args,
    optional_args: entry.optional_args,
    input_bindings: entry.input_bindings,
    observation_kind: entry.observation_kind,
    observation_ref: entry.observation_ref,
    observation_provenance: entry.observation_provenance,
    support_refs: entry.support_refs,
    bound_input_refs: entry.bound_input_refs,
    unresolved_input_bindings: entry.unresolved_input_bindings,
    satisfaction: entry.satisfaction,
    rail_status: entry.rail_status,
    first_broken_rail: entry.first_broken_rail,
    rail_failure_code: entry.rail_failure_code,
    repair_target: entry.repair_target,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }));
  const payload = {
    terminal_artifact_kind: "model_synthesized_answer",
    terminal_presentation: {
      terminal_artifact_kind: "model_synthesized_answer",
    },
    final_answer_source: "final_answer_draft",
    compound_capability_contract: {
      schema: "helix.compound_capability_contract.v1",
      turn_id: turnId,
      subgoals: [
        {
          subgoal_id: workspaceSubgoalId,
          order: 1,
          requested_capability: "workspace_os.status",
          runtime_capability: "workspace_os.status",
          args_hint: {},
          required_args: [],
          optional_args: [],
        },
        {
          subgoal_id: calculatorSubgoalId,
          order: 2,
          requested_capability: "scientific-calculator.solve_expression",
          runtime_capability: "scientific-calculator.solve_expression",
          args_hint: {
            latex: "14*23+8",
            expression: "14*23+8",
          },
          required_args: ["latex"],
          optional_args: ["expression", "equation"],
        },
      ],
    },
    capability_itinerary_execution_state: {
      compound_subgoal_ledger: compoundSubgoalLedger,
    },
    artifact_query_index: {
      compound_subgoal_rail_statuses: compoundSubgoalRailStatuses,
    },
    ...overrides,
  };
  return {
    ask: {
      turn_id: turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
    },
    debugExport: {
      schema: "helix.ask.debug_export.v1",
      payload,
    },
  };
};

const invalidCalculatorArgsFailClosedDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:compound-invalid-args";
  const docsSubgoalId = `${turnId}:compound_capability_subgoal:1:docs-viewer_locate_in_doc`;
  const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:2:scientific-calculator_solve_expression`;
  const compoundSubgoalLedger = [
    {
      subgoal_id: docsSubgoalId,
      order: 1,
      requested_capability: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.locate_in_doc",
      executed_capability: "docs-viewer.locate_in_doc",
      args: {
        query: "rule of thumb",
      },
      required_args: ["query"],
      optional_args: ["document_path", "doc"],
      input_bindings: [],
      observation_kind: "doc_location_matches",
      observation_ref: "obs:doc-location",
      observation_provenance: "compound_subgoal_id",
      support_refs: ["obs:doc-location"],
      bound_input_refs: [],
      unresolved_input_bindings: [],
      satisfaction: "satisfied",
      rail_status: "complete",
      first_broken_rail: null,
      rail_failure_code: null,
      repair_target: null,
    },
    {
      subgoal_id: calculatorSubgoalId,
      order: 2,
      requested_capability: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: null,
      args: {
        latex: "explain why receipts matter",
        expression: "explain why receipts matter",
      },
      required_args: ["latex"],
      optional_args: ["expression", "equation"],
      input_bindings: [],
      observation_kind: null,
      observation_ref: null,
      observation_provenance: null,
      support_refs: [],
      bound_input_refs: [],
      unresolved_input_bindings: [],
      satisfaction: "failed",
      rail_status: "fail_closed",
      first_broken_rail: "capability_execution",
      rail_failure_code: "invalid_arg:latex_is_prose",
      repair_target: "tool_execution",
    },
  ];
  const compoundSubgoalRailStatuses = compoundSubgoalLedger.map((entry) => ({
    subgoal_id: entry.subgoal_id,
    order: entry.order,
    requested_capability: entry.requested_capability,
    selected_capability: entry.selected_capability,
    executed_capability: entry.executed_capability,
    args: entry.args,
    required_args: entry.required_args,
    optional_args: entry.optional_args,
    input_bindings: entry.input_bindings,
    observation_kind: entry.observation_kind,
    observation_ref: entry.observation_ref,
    observation_provenance: entry.observation_provenance,
    support_refs: entry.support_refs,
    bound_input_refs: entry.bound_input_refs,
    unresolved_input_bindings: entry.unresolved_input_bindings,
    satisfaction: entry.satisfaction,
    rail_status: entry.rail_status,
    first_broken_rail: entry.first_broken_rail,
    rail_failure_code: entry.rail_failure_code,
    repair_target: entry.repair_target,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }));
  const payload = {
    terminal_error_code: "compound_subgoal_invalid_args_after_repair",
    terminal_artifact_kind: "typed_failure",
    terminal_presentation: {
      terminal_artifact_kind: "typed_failure",
    },
    final_answer_source: "typed_failure",
    compound_capability_contract: {
      schema: "helix.compound_capability_contract.v1",
      turn_id: turnId,
      subgoals: [
        {
          subgoal_id: docsSubgoalId,
          order: 1,
          requested_capability: "docs-viewer.locate_in_doc",
          runtime_capability: "docs-viewer.locate_in_doc",
          args_hint: {
            query: "rule of thumb",
          },
          required_args: ["query"],
          optional_args: ["document_path", "doc"],
        },
        {
          subgoal_id: calculatorSubgoalId,
          order: 2,
          requested_capability: "scientific-calculator.solve_expression",
          runtime_capability: "scientific-calculator.solve_expression",
          args_hint: {
            latex: "explain why receipts matter",
            expression: "explain why receipts matter",
          },
          required_args: ["latex"],
          optional_args: ["expression", "equation"],
        },
      ],
    },
    capability_itinerary_execution_state: {
      compound_subgoal_ledger: compoundSubgoalLedger,
    },
    artifact_query_index: {
      compound_subgoal_rail_statuses: compoundSubgoalRailStatuses,
    },
    ...overrides,
  };
  return {
    ask: {
      turn_id: turnId,
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    },
    debugExport: {
      schema: "helix.ask.debug_export.v1",
      payload,
    },
  };
};

const compoundDebug = (input: {
  turnId: string;
  terminalArtifactKind?: string;
  finalAnswerSource?: string;
  subgoals: Array<{
    requested_capability: string;
    runtime_capability?: string;
    executed_capability: string | null;
    args?: Record<string, unknown>;
    required_args?: string[];
    optional_args?: string[];
    input_bindings?: Array<Record<string, unknown>>;
    observation_kind: string | null;
    observation_ref: string | null;
    observation_provenance?: string | null;
    support_refs?: string[];
    bound_input_refs?: Array<Record<string, unknown>>;
    unresolved_input_bindings?: Array<Record<string, unknown>>;
    satisfaction?: string;
    rail_status?: string;
    first_broken_rail?: string | null;
    rail_failure_code?: string | null;
    repair_target?: string | null;
  }>;
  overrides?: Record<string, unknown>;
}) => {
  const terminalArtifactKind = input.terminalArtifactKind ?? "model_synthesized_answer";
  const finalAnswerSource = input.finalAnswerSource ?? "final_answer_draft";
  const ledger = input.subgoals.map((entry, index) => {
    const subgoalId = `${input.turnId}:compound_capability_subgoal:${index + 1}:${entry.requested_capability.replace(/[^A-Za-z0-9_-]+/g, "_")}`;
    return {
      subgoal_id: subgoalId,
      order: index + 1,
      requested_capability: entry.requested_capability,
      selected_capability: entry.runtime_capability ?? entry.requested_capability,
      executed_capability: entry.executed_capability,
      args: entry.args ?? {},
      required_args: entry.required_args ?? [],
      optional_args: entry.optional_args ?? [],
      input_bindings: entry.input_bindings ?? [],
      observation_kind: entry.observation_kind,
      observation_ref: entry.observation_ref,
      observation_provenance:
        entry.observation_provenance ??
        (entry.observation_ref && (entry.satisfaction ?? "satisfied") === "satisfied" ? "capability_key" : null),
      support_refs: entry.support_refs ?? (entry.observation_ref ? [entry.observation_ref] : []),
      bound_input_refs: entry.bound_input_refs ?? [],
      unresolved_input_bindings: entry.unresolved_input_bindings ?? [],
      satisfaction: entry.satisfaction ?? "satisfied",
      rail_status: entry.rail_status ?? "complete",
      first_broken_rail: entry.first_broken_rail ?? null,
      rail_failure_code: entry.rail_failure_code ?? null,
      repair_target: entry.repair_target ?? null,
    };
  });
  const railStatuses = ledger.map((entry) => ({
    ...entry,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }));
  const contractSubgoals = ledger.map((entry) => ({
    subgoal_id: entry.subgoal_id,
    order: entry.order,
    requested_capability: entry.requested_capability,
    runtime_capability: input.subgoals[entry.order - 1]?.runtime_capability ?? entry.requested_capability,
    args_hint: entry.args,
    required_args: entry.required_args,
    optional_args: entry.optional_args,
    input_bindings: entry.input_bindings,
  }));
  const payload = {
    terminal_artifact_kind: terminalArtifactKind,
    terminal_presentation: {
      terminal_artifact_kind: terminalArtifactKind,
    },
    final_answer_source: finalAnswerSource,
    compound_capability_contract: {
      schema: "helix.compound_capability_contract.v1",
      turn_id: input.turnId,
      subgoals: contractSubgoals,
    },
    capability_itinerary_execution_state: {
      compound_subgoal_ledger: ledger,
    },
    artifact_query_index: {
      compound_subgoal_rail_statuses: railStatuses,
    },
    ...(input.overrides ?? {}),
  };
  return {
    ask: {
      turn_id: input.turnId,
      terminal_artifact_kind: terminalArtifactKind,
      final_answer_source: finalAnswerSource,
    },
    debugExport: {
      schema: "helix.ask.debug_export.v1",
      payload,
    },
  };
};

const internetReflectionCalculatorDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:internet-reflection-calculator";
  const researchSubgoalId = `${turnId}:compound_capability_subgoal:1:internet_search_web_research`;
  const reflectionSubgoalId = `${turnId}:compound_capability_subgoal:2:helix_ask_reflect_theory_context`;
  const bindingId = `${reflectionSubgoalId}:input_binding:1`;
  const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:3:scientific-calculator_solve_expression`;
  const calculatorResearchBindingId = `${calculatorSubgoalId}:input_binding:1`;
  const calculatorReflectionBindingId = `${calculatorSubgoalId}:input_binding:2`;
  return compoundDebug({
    turnId,
    subgoals: [
      {
        requested_capability: "internet_search.web_research",
        runtime_capability: "internet-search.search_web",
        executed_capability: "internet-search.search_web",
        args: {
          query: "Alcubierre metric energy estimates",
        },
        required_args: ["query"],
        observation_kind: "internet_search_observation",
        observation_ref: "obs:web-search",
      },
      {
        requested_capability: "helix_ask.reflect_theory_context",
        executed_capability: "helix_ask.reflect_theory_context",
        args: {
          prompt: "connect source to receipts-as-observations",
          source_ref: "obs:web-search",
        },
        input_bindings: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "internet_search.web_research",
            required_observation_kinds: ["internet_search_observation"],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "theory_context_reflection",
        observation_ref: "obs:reflection",
        bound_input_refs: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "internet_search.web_research",
            ref: "obs:web-search",
          },
        ],
      },
      {
        requested_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        args: {
          latex: "(9+3)*7-25",
          expression: "(9+3)*7-25",
        },
        required_args: ["latex"],
        optional_args: ["expression", "equation"],
        input_bindings: [
          {
            binding_id: calculatorResearchBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "internet_search.web_research",
            required_observation_kinds: ["internet_search_observation"],
            required: true,
            status: "pending",
          },
          {
            binding_id: calculatorReflectionBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: reflectionSubgoalId,
            from_capability: "helix_ask.reflect_theory_context",
            required_observation_kinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "calculator_receipt",
        observation_ref: "obs:calculator",
        support_refs: ["obs:web-search", "obs:reflection", "obs:calculator"],
        bound_input_refs: [
          {
            binding_id: calculatorResearchBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "internet_search.web_research",
            ref: "obs:web-search",
          },
          {
            binding_id: calculatorReflectionBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: reflectionSubgoalId,
            from_capability: "helix_ask.reflect_theory_context",
            ref: "obs:reflection",
          },
        ],
      },
    ],
    overrides,
  });
};

const scholarlyReflectionCalculatorDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:scholarly-reflection-calculator";
  const researchSubgoalId = `${turnId}:compound_capability_subgoal:1:scholarly-research_lookup_papers`;
  const reflectionSubgoalId = `${turnId}:compound_capability_subgoal:2:helix_ask_reflect_theory_context`;
  const bindingId = `${reflectionSubgoalId}:input_binding:1`;
  const calculatorSubgoalId = `${turnId}:compound_capability_subgoal:3:scientific-calculator_solve_expression`;
  const calculatorResearchBindingId = `${calculatorSubgoalId}:input_binding:1`;
  const calculatorReflectionBindingId = `${calculatorSubgoalId}:input_binding:2`;
  return compoundDebug({
    turnId,
    subgoals: [
      {
        requested_capability: "scholarly-research.lookup_papers",
        executed_capability: "scholarly-research.lookup_papers",
        args: {
          query: "Alcubierre metric energy estimates",
        },
        required_args: ["query"],
        observation_kind: "scholarly_research_observation",
        observation_ref: "obs:scholarly-lookup",
      },
      {
        requested_capability: "helix_ask.reflect_theory_context",
        executed_capability: "helix_ask.reflect_theory_context",
        args: {
          prompt: "connect scholarly source to receipts-as-observations",
          source_ref: "obs:scholarly-lookup",
        },
        input_bindings: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "scholarly-research.lookup_papers",
            required_observation_kinds: ["scholarly_research_observation"],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "theory_context_reflection",
        observation_ref: "obs:reflection",
        bound_input_refs: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "scholarly-research.lookup_papers",
            ref: "obs:scholarly-lookup",
          },
        ],
      },
      {
        requested_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        args: {
          latex: "(12+5)*3",
          expression: "(12+5)*3",
        },
        required_args: ["latex"],
        optional_args: ["expression", "equation"],
        input_bindings: [
          {
            binding_id: calculatorResearchBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "scholarly-research.lookup_papers",
            required_observation_kinds: ["scholarly_research_observation"],
            required: true,
            status: "pending",
          },
          {
            binding_id: calculatorReflectionBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: reflectionSubgoalId,
            from_capability: "helix_ask.reflect_theory_context",
            required_observation_kinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "calculator_receipt",
        observation_ref: "obs:calculator",
        support_refs: ["obs:scholarly-lookup", "obs:reflection", "obs:calculator"],
        bound_input_refs: [
          {
            binding_id: calculatorResearchBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: researchSubgoalId,
            from_capability: "scholarly-research.lookup_papers",
            ref: "obs:scholarly-lookup",
          },
          {
            binding_id: calculatorReflectionBindingId,
            arg_name: "support_refs",
            binding_kind: "support_ref",
            from_subgoal_id: reflectionSubgoalId,
            from_capability: "helix_ask.reflect_theory_context",
            ref: "obs:reflection",
          },
        ],
      },
    ],
    overrides,
  });
};

const workspaceDirectoryThenDocsDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:workspace-directory-then-docs";
  const directorySubgoalId = `${turnId}:compound_capability_subgoal:1:workspace-directory_resolve`;
  const docsSubgoalId = `${turnId}:compound_capability_subgoal:2:docs-viewer_locate_in_doc`;
  const docsTargetBindingId = `${docsSubgoalId}:input_binding:1`;
  return compoundDebug({
    turnId,
    subgoals: [
      {
        requested_capability: "workspace-directory.resolve",
        executed_capability: "workspace-directory.resolve",
        args: {
          query: "docs/helix-ask-codex-loop-discipline.md",
        },
        required_args: ["query"],
        optional_args: ["uri", "path", "target", "target_kinds", "limit"],
        observation_kind: "workspace_directory_resolution",
        observation_ref: "obs:workspace-directory",
      },
      {
        requested_capability: "docs-viewer.locate_in_doc",
        executed_capability: "docs-viewer.locate_in_doc",
        args: {
          query: "rule of thumb",
          path: "docs/helix-ask-codex-loop-discipline.md",
        },
        required_args: ["query"],
        optional_args: ["path", "anchor", "term", "text"],
        input_bindings: [
          {
            binding_id: docsTargetBindingId,
            arg_name: "target_ref",
            binding_kind: "target_ref",
            from_subgoal_id: directorySubgoalId,
            from_capability: "workspace-directory.resolve",
            required_observation_kinds: ["workspace_directory_resolution"],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "doc_location_matches",
        observation_ref: "obs:doc-location",
        bound_input_refs: [
          {
            binding_id: docsTargetBindingId,
            arg_name: "target_ref",
            binding_kind: "target_ref",
            from_subgoal_id: directorySubgoalId,
            from_capability: "workspace-directory.resolve",
            ref: "obs:workspace-directory",
          },
        ],
      },
    ],
    overrides,
  });
};

const microReasonerPresetsThenDraftDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:micro-reasoner-presets-then-draft";
  return compoundDebug({
    turnId,
    subgoals: [
      {
        requested_capability: "live_env.query_micro_reasoner_presets",
        executed_capability: "live_env.query_micro_reasoner_presets",
        args: {},
        observation_kind: "stage_play_micro_reasoner_prompt_preset_query_result",
        observation_ref: "obs:micro-reasoner-presets",
      },
      {
        requested_capability: "live_env.draft_micro_reasoner_preset",
        executed_capability: "live_env.draft_micro_reasoner_preset",
        args: {
          prompt: "draft a live-source micro reasoner preset",
        },
        observation_kind: "stage_play_micro_reasoner_prompt_preset_draft",
        observation_ref: "obs:micro-reasoner-draft",
      },
    ],
    overrides,
  });
};

const civilizationBoundsReflectionDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:civilization-bounds-reflection";
  const frameSubgoalId = `${turnId}:compound_capability_subgoal:1:helix_ask_build_civilization_scenario_frame`;
  const reflectionSubgoalId = `${turnId}:compound_capability_subgoal:2:helix_ask_reflect_civilization_bounds`;
  const bindingId = `${reflectionSubgoalId}:input_binding:1`;
  return compoundDebug({
    turnId,
    subgoals: [
      {
        requested_capability: "helix_ask.build_civilization_scenario_frame",
        executed_capability: "helix_ask.build_civilization_scenario_frame",
        args: {
          prompt: "long-range settlement scenario",
        },
        observation_kind: "civilization_scenario_frame/v1",
        observation_ref: "obs:civilization-frame",
      },
      {
        requested_capability: "helix_ask.reflect_civilization_bounds",
        executed_capability: "helix_ask.reflect_civilization_bounds",
        args: {
          prompt: "reflect collaboration and falsification bounds",
          scenarioFrameRef: "obs:civilization-frame",
        },
        input_bindings: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: frameSubgoalId,
            from_capability: "helix_ask.build_civilization_scenario_frame",
            required_observation_kinds: [
              "civilization_scenario_frame/v1",
              "helix_civilization_scenario_frame_tool_result",
            ],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "civilization_bounds_reflection",
        observation_ref: "obs:civilization-bounds",
        bound_input_refs: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: frameSubgoalId,
            from_capability: "helix_ask.build_civilization_scenario_frame",
            ref: "obs:civilization-frame",
          },
        ],
      },
    ],
    overrides,
  });
};

const zenGraphReflectionBridgeDebug = (overrides: Record<string, unknown> = {}) => {
  const turnId = "ask:test:zen-graph-reflection-bridge";
  const reflectionSubgoalId = `${turnId}:compound_capability_subgoal:1:helix_ask_reflect_ideology_context`;
  const bridgeSubgoalId = `${turnId}:compound_capability_subgoal:2:helix_ask_bridge_theory_ideology_context`;
  const bindingId = `${bridgeSubgoalId}:input_binding:1`;
  return compoundDebug({
    turnId,
    subgoals: [
      {
        requested_capability: "helix_ask.reflect_ideology_context",
        executed_capability: "helix_ask.reflect_ideology_context",
        args: {
          prompt: "wisdom under uncertainty",
        },
        observation_kind: "ideology_context_reflection/v1",
        observation_ref: "obs:zen-reflection",
      },
      {
        requested_capability: "helix_ask.bridge_theory_ideology_context",
        executed_capability: "helix_ask.bridge_theory_ideology_context",
        args: {
          prompt: "bridge theory and ideology context",
          ideology_reflection_ref: "obs:zen-reflection",
        },
        input_bindings: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: reflectionSubgoalId,
            from_capability: "helix_ask.reflect_ideology_context",
            required_observation_kinds: [
              "ideology_context_reflection/v1",
              "procedural_zen_classification/v1",
              "helix_zen_graph_reflection_tool_result",
              "workstation_tool_evaluation",
            ],
            required: true,
            status: "pending",
          },
        ],
        observation_kind: "helix_theory_ideology_bridge_tool_result",
        observation_ref: "obs:theory-zen-bridge",
        bound_input_refs: [
          {
            binding_id: bindingId,
            arg_name: "source_ref",
            binding_kind: "source_ref",
            from_subgoal_id: reflectionSubgoalId,
            from_capability: "helix_ask.reflect_ideology_context",
            ref: "obs:zen-reflection",
          },
        ],
      },
    ],
    overrides,
  });
};

describe("Helix Ask compound capability live probe", () => {
  it("selects all compound live scenarios by default and reports unknown filters", () => {
    const all = selectCompoundCapabilityLiveScenarios([]);
    expect(all.requestedIds).toEqual([]);
    expect(all.unknownIds).toEqual([]);
    expect(all.scenarios.map((scenario) => scenario.id)).toEqual(
      COMPOUND_CAPABILITY_LIVE_SCENARIOS.map((scenario) => scenario.id),
    );

    const filtered = selectCompoundCapabilityLiveScenarios([
      " workspace_then_calculator ",
      "workspace_then_calculator",
      "missing_scenario",
    ]);
    expect(filtered.requestedIds).toEqual(["workspace_then_calculator", "missing_scenario"]);
    expect(filtered.unknownIds).toEqual(["missing_scenario"]);
    expect(filtered.scenarios.map((scenario) => scenario.id)).toEqual(["workspace_then_calculator"]);
    expect(filtered.availableIds).toContain("docs_then_calculator");
    expect(filtered.availableIds).toContain("workspace_directory_then_docs");
    expect(filtered.availableIds).toContain("micro_reasoner_presets_then_draft");
    expect(filtered.availableIds).toContain("internet_reflection_calculator");
    expect(filtered.availableIds).toContain("scholarly_reflection_calculator");
    expect(filtered.availableIds).toContain("civilization_bounds_reflection");
    expect(filtered.availableIds).toContain("zen_graph_reflection_bridge");
  });

  it("blocks broad keyed live execution unless scenarios are filtered or explicitly allowed", () => {
    expect(resolveCompoundCapabilityLiveRunPolicy({
      dryRun: true,
      scenarioFilter: [],
      allowAllLiveScenarios: false,
    })).toEqual({
      blocked: false,
      blocked_reason: null,
      message: null,
    });

    expect(resolveCompoundCapabilityLiveRunPolicy({
      dryRun: false,
      scenarioFilter: [],
      allowAllLiveScenarios: false,
    })).toEqual({
      blocked: true,
      blocked_reason: "scenario_filter_required_for_live_probe",
      message: BROAD_LIVE_PROBE_BLOCK_MESSAGE,
    });

    expect(resolveCompoundCapabilityLiveRunPolicy({
      dryRun: false,
      scenarioFilter: ["docs_then_calculator"],
      allowAllLiveScenarios: false,
    })).toEqual({
      blocked: false,
      blocked_reason: null,
      message: null,
    });

    expect(resolveCompoundCapabilityLiveRunPolicy({
      dryRun: false,
      scenarioFilter: [],
      allowAllLiveScenarios: true,
    })).toEqual({
      blocked: false,
      blocked_reason: null,
      message: null,
    });
  });

  it("accepts a complete ordered compound ledger with bounded calculator args", () => {
    const { ask, debugExport } = workspaceThenCalculatorDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.selected_capabilities).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.executed_capabilities).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.observation_kinds).toEqual([
      "workspace_os_status_observation",
      "calculator_receipt",
    ]);
    expect(result.observation_refs).toEqual([
      "obs:workspace-status",
      "obs:calculator",
    ]);
    expect(result.observation_provenance).toEqual([
      "compound_subgoal_id",
      "capability_key",
    ]);
    expect(result.rail_observation_kinds).toEqual([
      "workspace_os_status_observation",
      "calculator_receipt",
    ]);
    expect(result.rail_observation_refs).toEqual([
      "obs:workspace-status",
      "obs:calculator",
    ]);
    expect(result.rail_observation_provenance).toEqual([
      "compound_subgoal_id",
      "capability_key",
    ]);
    expect(result.subgoal_satisfactions).toEqual(["satisfied", "satisfied"]);
    expect(result.subgoal_rail_statuses).toEqual(["complete", "complete"]);
    expect(result.subgoal_first_broken_rails).toEqual([null, null]);
    expect(result.subgoal_rail_failure_codes).toEqual([null, null]);
    expect(result.subgoal_repair_targets).toEqual([null, null]);
  });

  it("accepts internet search plus theory reflection plus calculator with source binding", () => {
    const { ask, debugExport } = internetReflectionCalculatorDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("internet_reflection_calculator"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "internet_search.web_research",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.executed_capabilities).toEqual([
      "internet-search.search_web",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.observation_kinds).toEqual([
      "internet_search_observation",
      "theory_context_reflection",
      "calculator_receipt",
    ]);
    expect(result.observation_refs).toEqual(["obs:web-search", "obs:reflection", "obs:calculator"]);
  });

  it("accepts scholarly research plus theory reflection plus calculator with source binding", () => {
    const { ask, debugExport } = scholarlyReflectionCalculatorDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("scholarly_reflection_calculator"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "scholarly-research.lookup_papers",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.executed_capabilities).toEqual([
      "scholarly-research.lookup_papers",
      "helix_ask.reflect_theory_context",
      "scientific-calculator.solve_expression",
    ]);
  });

  it("accepts workspace-directory resolution plus docs location without dropping either rail", () => {
    const { ask, debugExport } = workspaceDirectoryThenDocsDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_directory_then_docs"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "workspace-directory.resolve",
      "docs-viewer.locate_in_doc",
    ]);
    expect(result.executed_capabilities).toEqual([
      "workspace-directory.resolve",
      "docs-viewer.locate_in_doc",
    ]);
  });

  it("accepts live-env micro-reasoner preset query plus draft without mailbox packet state", () => {
    const { ask, debugExport } = microReasonerPresetsThenDraftDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("micro_reasoner_presets_then_draft"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "live_env.query_micro_reasoner_presets",
      "live_env.draft_micro_reasoner_preset",
    ]);
    expect(result.executed_capabilities).toEqual([
      "live_env.query_micro_reasoner_presets",
      "live_env.draft_micro_reasoner_preset",
    ]);
  });

  it("accepts civilization scenario frame plus civilization bounds reflection with source binding", () => {
    const { ask, debugExport } = civilizationBoundsReflectionDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("civilization_bounds_reflection"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "helix_ask.build_civilization_scenario_frame",
      "helix_ask.reflect_civilization_bounds",
    ]);
    expect(result.executed_capabilities).toEqual([
      "helix_ask.build_civilization_scenario_frame",
      "helix_ask.reflect_civilization_bounds",
    ]);
  });

  it("accepts zen graph reflection plus theory-ideology bridge with source binding", () => {
    const { ask, debugExport } = zenGraphReflectionBridgeDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("zen_graph_reflection_bridge"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.requested_capabilities).toEqual([
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
    ]);
    expect(result.executed_capabilities).toEqual([
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
    ]);
  });

  it("catches satisfied reflection subgoals that lose required bound input refs", () => {
    const base = internetReflectionCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[1].bound_input_refs = [];
    payload.artifact_query_index.compound_subgoal_rail_statuses[1].bound_input_refs = [];

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("internet_reflection_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_2_bound_input_refs_missing");
  });

  it("catches calculator subgoals that lose upstream research/reflection support bindings", () => {
    const base = internetReflectionCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[2].input_bindings =
      payload.capability_itinerary_execution_state.compound_subgoal_ledger[2].input_bindings.slice(1);
    payload.artifact_query_index.compound_subgoal_rail_statuses[2].input_bindings =
      payload.artifact_query_index.compound_subgoal_rail_statuses[2].input_bindings.slice(1);
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[2].bound_input_refs = [];
    payload.artifact_query_index.compound_subgoal_rail_statuses[2].bound_input_refs = [];

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("internet_reflection_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain(
      "subgoal_3_input_binding_from_capability_missing:internet_search.web_research",
    );
    expect(result.failures).toContain("subgoal_3_bound_input_refs_missing");
  });

  it("catches reflection subgoals bound to the wrong upstream capability", () => {
    const base = civilizationBoundsReflectionDebug();
    const payload = (base.debugExport as any).payload;
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[1].input_bindings[0].from_capability =
      "model.direct_answer";
    payload.artifact_query_index.compound_subgoal_rail_statuses[1].input_bindings[0].from_capability =
      "model.direct_answer";

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("civilization_bounds_reflection"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain(
      "subgoal_2_input_binding_from_capability_missing:helix_ask.build_civilization_scenario_frame",
    );
  });

  it("catches scholarly reflection subgoals bound to non-scholarly upstream evidence", () => {
    const base = scholarlyReflectionCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[1].input_bindings[0].from_capability =
      "internet_search.web_research";
    payload.artifact_query_index.compound_subgoal_rail_statuses[1].input_bindings[0].from_capability =
      "internet_search.web_research";

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("scholarly_reflection_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain(
      "subgoal_2_input_binding_from_capability_missing:scholarly-research.lookup_papers",
    );
  });

  it("catches zen bridge subgoals bound to non-zen upstream evidence", () => {
    const base = zenGraphReflectionBridgeDebug();
    const payload = (base.debugExport as any).payload;
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[1].input_bindings[0].from_capability =
      "helix_ask.reflect_theory_context";
    payload.artifact_query_index.compound_subgoal_rail_statuses[1].input_bindings[0].from_capability =
      "helix_ask.reflect_theory_context";

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("zen_graph_reflection_bridge"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain(
      "subgoal_2_input_binding_from_capability_missing:helix_ask.reflect_ideology_context",
    );
  });

  it("catches dropped later subgoals instead of allowing first-tool success", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.compound_capability_contract.subgoals = payload.compound_capability_contract.subgoals.slice(0, 1);
    payload.capability_itinerary_execution_state.compound_subgoal_ledger =
      payload.capability_itinerary_execution_state.compound_subgoal_ledger.slice(0, 1);
    payload.artifact_query_index.compound_subgoal_rail_statuses = [];

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("compound_subgoals_dropped:1<2");
    expect(result.failures).toContain("compound_subgoal_ledger_dropped:1<2");
    expect(result.failures).toContain("compound_subgoal_rail_statuses_dropped:0<2");
    expect(result.failures).toContain("subgoal_2_executed_mismatch:null");
  });

  it("catches missing per-subgoal rail-status debug mirrors", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.artifact_query_index.compound_subgoal_rail_statuses = [];

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("compound_subgoal_rail_statuses_dropped:0<2");
    expect(result.failures).toContain("subgoal_1_rail_status_entry_missing");
    expect(result.failures).toContain("subgoal_2_rail_status_entry_missing");
  });

  it("catches calculator subgoal args that include non-math prompt text", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.capability_itinerary_execution_state.compound_subgoal_ledger[1].args = {
      latex:
        "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
      expression:
        "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
    };

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain(
      "calculator_expression_mismatch:Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
    );
    expect(result.failures).toContain("calculator_expression_contains_non_math_prompt_text");
  });

  it("catches missing rail args even when ledger args are present", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    delete payload.artifact_query_index.compound_subgoal_rail_statuses[1].args;

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_2_rail_args_missing");
    expect(result.failures).toContain("calculator_rail_expression_mismatch:null");
  });

  it("catches missing required-arg rail mirrors", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    delete payload.artifact_query_index.compound_subgoal_rail_statuses[1].required_args;

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_2_rail_required_args_missing");
  });

  it("catches missing support-ref rail mirrors for satisfied subgoals", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    delete payload.artifact_query_index.compound_subgoal_rail_statuses[0].support_refs;

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_1_rail_support_refs_missing");
  });

  it("catches missing observation provenance for satisfied subgoals", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    delete payload.capability_itinerary_execution_state.compound_subgoal_ledger[0].observation_provenance;
    delete payload.artifact_query_index.compound_subgoal_rail_statuses[0].observation_provenance;

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_1_observation_provenance_missing");
    expect(result.failures).toContain("subgoal_1_rail_observation_provenance_missing");
  });

  it("catches calculator rail args that include non-math prompt text", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    payload.artifact_query_index.compound_subgoal_rail_statuses[1].args = {
      latex:
        "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
      expression:
        "Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
    };

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_2_rail_args_mismatch");
    expect(result.failures).toContain(
      "calculator_rail_expression_mismatch:Use workspace_os.status to inspect workstation status, then call scientific-calculator.solve_expression with this exact expression: 14*23+8.",
    );
    expect(result.failures).toContain("calculator_rail_expression_contains_non_math_prompt_text");
  });

  it("catches budget exhaustion and terminal projection divergence", () => {
    const base = workspaceThenCalculatorDebug({
      terminal_error_code: "agent_loop_budget_exhausted",
      terminal_artifact_kind: "typed_failure",
      terminal_presentation: {
        terminal_artifact_kind: "model_synthesized_answer",
      },
    });

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: {
        ...base.ask,
        terminal_artifact_kind: "typed_failure",
      },
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("budget_exhaustion:agent_loop_budget_exhausted");
    expect(result.failures).toContain("terminal_projection_mismatch:typed_failure!=model_synthesized_answer");
  });

  it("catches receipt terminal fallback for successful compound turns", () => {
    const base = workspaceThenCalculatorDebug({
      terminal_artifact_kind: "tool_receipt",
      terminal_presentation: {
        terminal_artifact_kind: "tool_receipt",
      },
      final_answer_source: "tool_receipt",
    });

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: {
        ...base.ask,
        terminal_artifact_kind: "tool_receipt",
        final_answer_source: "tool_receipt",
      },
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("receipt_terminal_forbidden:tool_receipt");
    expect(result.failures).toContain("receipt_final_answer_source_forbidden:tool_receipt");
  });

  it("catches missing terminal authority on successful compound turns", () => {
    const base = workspaceThenCalculatorDebug();
    const payload = (base.debugExport as any).payload;
    delete payload.terminal_artifact_kind;
    delete payload.terminal_presentation;

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: {
        turn_id: base.ask.turn_id,
        final_answer_source: base.ask.final_answer_source,
      },
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("terminal_authority_kind_missing");
    expect(result.failures).toContain("visible_terminal_kind_missing");
  });

  it("catches compound final drafts missing satisfied subgoal support refs", () => {
    const base = workspaceThenCalculatorDebug({
      terminal_error_code: "compound_subgoal_support_refs_missing",
      compound_subgoal_draft_support_coverage: {
        schema: "helix.compound_subgoal_draft_support_coverage.v1",
        applies: true,
        ok: false,
        missing_observation_refs: ["obs:calculator"],
      },
    });

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("workspace_then_calculator"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("compound_draft_missing_subgoal_support_refs:obs:calculator");
  });

  it("accepts expected invalid-args fail-closed subgoals without treating them as live-probe regressions", () => {
    const { ask, debugExport } = invalidCalculatorArgsFailClosedDebug();

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("invalid_calculator_args_fail_closed"),
      ask,
      debugExport,
    });

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.terminal_error_code).toBe("compound_subgoal_invalid_args_after_repair");
    expect(result.final_answer_source).toBe("typed_failure");
    expect(result.executed_capabilities).toEqual(["docs-viewer.locate_in_doc", null]);
    expect(result.subgoal_satisfactions).toEqual(["satisfied", "failed"]);
    expect(result.subgoal_rail_statuses).toEqual(["complete", "fail_closed"]);
    expect(result.subgoal_first_broken_rails).toEqual([null, "capability_execution"]);
    expect(result.subgoal_rail_failure_codes).toEqual([null, "invalid_arg:latex_is_prose"]);
    expect(result.subgoal_repair_targets).toEqual([null, "tool_execution"]);
  });

  it("catches failed subgoals missing first-broken-rail metadata", () => {
    const base = invalidCalculatorArgsFailClosedDebug();
    const payload = (base.debugExport as any).payload;
    delete payload.capability_itinerary_execution_state.compound_subgoal_ledger[1].first_broken_rail;
    delete payload.artifact_query_index.compound_subgoal_rail_statuses[1].first_broken_rail;

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("invalid_calculator_args_fail_closed"),
      ask: base.ask,
      debugExport: base.debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("subgoal_2_first_broken_rail_missing");
    expect(result.failures).toContain("subgoal_2_rail_first_broken_rail_missing");
  });

  it("rejects invalid-args fail-closed scenarios when the terminal error is not the expected typed failure", () => {
    const { ask, debugExport } = invalidCalculatorArgsFailClosedDebug({
      terminal_error_code: "agent_loop_budget_exhausted",
    });

    const result = evaluateCompoundCapabilityScenario({
      scenario: scenarioById("invalid_calculator_args_fail_closed"),
      ask,
      debugExport,
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toContain("budget_exhaustion:agent_loop_budget_exhausted");
    expect(result.failures).toContain("terminal_error_code_mismatch:agent_loop_budget_exhausted");
  });
});
