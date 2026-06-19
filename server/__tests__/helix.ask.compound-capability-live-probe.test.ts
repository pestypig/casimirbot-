import { describe, expect, it } from "vitest";

import {
  COMPOUND_CAPABILITY_LIVE_SCENARIOS,
  evaluateCompoundCapabilityScenario,
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
      observation_kind: "workspace_os_status_observation",
      observation_ref: "obs:workspace-status",
      satisfaction: "satisfied",
      rail_status: "complete",
      rail_failure_code: null,
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
      observation_kind: "calculator_receipt",
      observation_ref: "obs:calculator",
      satisfaction: "satisfied",
      rail_status: "complete",
      rail_failure_code: null,
    },
  ];
  const compoundSubgoalRailStatuses = compoundSubgoalLedger.map((entry) => ({
    subgoal_id: entry.subgoal_id,
    order: entry.order,
    requested_capability: entry.requested_capability,
    selected_capability: entry.selected_capability,
    executed_capability: entry.executed_capability,
    observation_kind: entry.observation_kind,
    observation_ref: entry.observation_ref,
    satisfaction: entry.satisfaction,
    rail_status: entry.rail_status,
    rail_failure_code: entry.rail_failure_code,
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
      observation_kind: "doc_location_matches",
      observation_ref: "obs:doc-location",
      satisfaction: "satisfied",
      rail_status: "complete",
      rail_failure_code: null,
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
      observation_kind: null,
      observation_ref: null,
      satisfaction: "failed",
      rail_status: "fail_closed",
      rail_failure_code: "invalid_arg:latex_is_prose",
    },
  ];
  const compoundSubgoalRailStatuses = compoundSubgoalLedger.map((entry) => ({
    subgoal_id: entry.subgoal_id,
    order: entry.order,
    requested_capability: entry.requested_capability,
    selected_capability: entry.selected_capability,
    executed_capability: entry.executed_capability,
    observation_kind: entry.observation_kind,
    observation_ref: entry.observation_ref,
    satisfaction: entry.satisfaction,
    rail_status: entry.rail_status,
    rail_failure_code: entry.rail_failure_code,
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
    expect(result.executed_capabilities).toEqual([
      "workspace_os.status",
      "scientific-calculator.solve_expression",
    ]);
    expect(result.subgoal_satisfactions).toEqual(["satisfied", "satisfied"]);
    expect(result.subgoal_rail_statuses).toEqual(["complete", "complete"]);
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
