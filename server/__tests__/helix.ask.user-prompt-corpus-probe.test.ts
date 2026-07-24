import { describe, expect, it } from "vitest";

import {
  resolveUserPromptScenarioThreadId,
  summarizeTurn,
  type UserPromptScenario,
} from "../../scripts/helix-ask-user-prompt-corpus-probe";

const modelOnlyScenario: UserPromptScenario = {
  id: "model-only-control",
  category: "negated_context",
  prompt: "Explain a hypothesis and a theory without workstation tools.",
  expected_tool_mode: "none",
  expected_maximum_observations: 0,
  expected_terminal_kinds: ["direct_answer_text"],
  expected_answer_patterns: ["hypothesis", "theory"],
  expected_minimum_answer_chars: 40,
};

describe("Helix Ask natural prompt corpus scoring", () => {
  it("keeps journey scenarios on one thread while isolating unrelated scenarios", () => {
    const first = { ...modelOnlyScenario, id: "journey-first", thread_group: "docs journey" };
    const second = { ...modelOnlyScenario, id: "journey-second", thread_group: "docs journey" };
    const isolated = { ...modelOnlyScenario, id: "isolated" };

    expect(resolveUserPromptScenarioThreadId(first, "run-1"))
      .toBe(resolveUserPromptScenarioThreadId(second, "run-1"));
    expect(resolveUserPromptScenarioThreadId(isolated, "run-1"))
      .not.toBe(resolveUserPromptScenarioThreadId(first, "run-1"));
  });

  it("does not treat model-only policy refs as executed tool observations", () => {
    const result = summarizeTurn(modelOnlyScenario, {
      selected_final_answer:
        "A hypothesis is a specific testable proposal, while a theory is a broad explanation supported by repeated evidence.",
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "agent_provider_codex",
      codex_parity_agent_spine_rail_table: {
        rail_status: "selected_not_executed",
        codex_parity_class: "selected_not_executed",
        first_broken_rail: "capability_execution",
        requested_capability: "model_only",
        selected_capability: "model_only",
        admitted_capability: "model_only",
        executed_capability: null,
        observation_ref: "policy:model_only:placeholder",
      },
    }, {});

    expect(result).toMatchObject({
      verdict: "PASS",
      lifecycle_failure_stage: "not_required",
      executed_capabilities: [],
      answer_quality_flags: [],
    });
  });

  it("still rejects real tool execution in a model-only control", () => {
    const result = summarizeTurn(modelOnlyScenario, {
      selected_final_answer:
        "A hypothesis is a specific testable proposal, while a theory is a broad explanation supported by repeated evidence.",
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "agent_provider_codex",
      codex_parity_agent_spine_rail_table: {
        rail_status: "complete",
        codex_parity_class: "complete",
        executed_capability: "docs.search",
        observation_ref: "artifact:docs.search:1",
      },
    }, {});

    expect(result.verdict).toBe("WARN");
    expect(result.lifecycle_failure_stage).toBe("unexpected_tool_lifecycle");
    expect(result.answer_quality_flags).toEqual(
      expect.arrayContaining(["unexpected_tool_execution:docs.search"]),
    );
  });

  it("fails a required tool case when the gateway receipt is blocked despite a plausible answer", () => {
    const result = summarizeTurn({
      id: "calculator-blocked",
      category: "calculator",
      prompt: "Calculate 2*pi*3.",
      expected_tool_mode: "required",
      expected_capability_patterns: ["^scientific-calculator\\.solve_expression$"],
      expected_minimum_observations: 1,
      expected_answer_patterns: ["18\\.849"],
    }, {
      selected_final_answer: "The answer is approximately 18.8495559215.",
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "agent_provider_codex",
      workstation_gateway_call_results: [{
        capability_id: "scientific-calculator.solve_expression",
        ok: false,
        observation_packet: {
          status: "blocked",
          observation_ref: "artifact:calculator:blocked",
        },
        tool_lifecycle_trace: {
          failure_reason: "expression_evaluation_failed",
        },
      }],
      codex_parity_agent_spine_rail_table: {
        rail_status: "complete",
        codex_parity_class: "complete",
        executed_capability: "scientific-calculator.solve_expression",
        observation_ref: "artifact:calculator:blocked",
        reentry_status: "reentered",
      },
    }, {});

    expect(result).toMatchObject({
      verdict: "FAIL",
      lifecycle_failure_stage: "capability_execution",
      expected_capabilities_successful: false,
    });
    expect(result.answer_quality_flags).toEqual(expect.arrayContaining([
      "expected_capability_not_successful:^scientific-calculator\\.solve_expression$",
      expect.stringContaining("tool_observation_failed:scientific-calculator.solve_expression:blocked"),
    ]));
  });

  it("passes a required tool case only when the expected gateway observation succeeds", () => {
    const result = summarizeTurn({
      id: "workspace-status-success",
      category: "workspace_status",
      prompt: "What is the current workstation status?",
      expected_tool_mode: "required",
      expected_capability_patterns: ["^workspace_os\\.status$"],
      expected_minimum_observations: 1,
      expected_answer_patterns: ["available"],
    }, {
      selected_final_answer: "The workspace status reports 19 capabilities available and normal memory pressure.",
      terminal_artifact_kind: "workspace_status_answer",
      final_answer_source: "agent_provider_codex",
      workstation_gateway_call_results: [{
        capability_id: "workspace_os.status",
        ok: true,
        observation_packet: {
          status: "succeeded",
          observation_ref: "artifact:workspace-status:1",
        },
      }],
      codex_parity_agent_spine_rail_table: {
        rail_status: "complete",
        codex_parity_class: "complete",
        executed_capability: "workspace_os.status",
        observation_ref: "artifact:workspace-status:1",
        reentry_status: "reentered",
      },
    }, {});

    expect(result).toMatchObject({
      verdict: "PASS",
      lifecycle_failure_stage: "complete",
      expected_capabilities_successful: true,
    });
  });
});
