import { describe, expect, it } from "vitest";
import { CODEX_PARITY_AGENT_SPINE_CLASSES } from "../server/services/helix-ask/codex-parity-agent-spine-contract";
import { collectRailTableViolations } from "../scripts/helix-ask-ui-debug-parity-harness";

const baseRailTable = () => ({
  schema: "helix.codex_parity_agent_spine_rail_table.v1",
  turn_id: "turn-ui-debug-rail",
  prompt: "What tools are available for the helix ask to use?",
  requested_capability: null,
  visible_tool_surface: ["helix_ask.inspect_capability_catalog"],
  selected_capability: "helix_ask.inspect_capability_catalog",
  admitted_capability: "helix_ask.inspect_capability_catalog",
  admission_proof_source: "capability_contract_arbitration",
  admission_proven: true,
  executed_capability: "helix_ask.inspect_capability_catalog",
  observation_kind: "capability_registry",
  observation_ref: "artifact:capability-registry",
  required_observation_kinds_for_requested_capability: [],
  observed_artifact_supports_requested_capability: true,
  reentry_status: "reentered",
  reentry_proof_source: "capability_registry_observation",
  reentry_proven: true,
  goal_satisfaction: "satisfied",
  required_terminal_kind: "model_synthesized_answer",
  selected_terminal_kind: "model_synthesized_answer",
  terminal_authority_proof_source: "terminal_authority_single_writer",
  terminal_authority_proven: true,
  visible_terminal_kind: "model_synthesized_answer",
  visible_projection_source: "terminal_authority_single_writer.visible_text",
  visible_projection_proven: true,
  first_broken_rail: null,
  repair_target: null,
  codex_parity_class: "complete",
  normalized_codex_parity_classes: [...CODEX_PARITY_AGENT_SPINE_CLASSES],
  rail_status: "complete",
  rail_failure_code: null,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

describe("helix-ask-ui-debug-parity-harness rail validation", () => {
  it("accepts a complete rail table that is tied to the copied turn and remains debug-only", () => {
    const violations = collectRailTableViolations(
      baseRailTable(),
      { selected_terminal_artifact_kind: "model_synthesized_answer" },
      "turn-ui-debug-rail",
    );
    expect(violations).toEqual([]);
  });

  it("rejects stale or terminal-eligible rail debug mirrors", () => {
    const rail = {
      ...baseRailTable(),
      turn_id: "turn-stale",
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
    };

    expect(collectRailTableViolations(rail, { selected_terminal_artifact_kind: "model_synthesized_answer" }, "turn-ui-debug-rail")).toEqual(
      expect.arrayContaining([
        "rail_turn_id_mismatch:turn-stale!=turn-ui-debug-rail",
        "rail_assistant_answer_not_false",
        "rail_terminal_eligible_not_false",
        "rail_raw_content_included_not_false",
      ]),
    );
  });
});
