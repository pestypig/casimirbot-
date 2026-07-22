import { describe, expect, it } from "vitest";

import {
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
});
