import { describe, expect, it } from "vitest";

import {
  collectUiDebugRailCandidates,
  collectUiDebugRailMirrorViolations,
} from "../../scripts/helix-ask-ui-debug-parity-harness";
import { CODEX_PARITY_AGENT_SPINE_CLASSES } from "../services/helix-ask/codex-parity-agent-spine-contract";

const baseRail = (): Record<string, unknown> => ({
  schema: "helix.codex_parity_agent_spine_rail_table.v1",
  turn_id: "ask:ui-debug-parity:test",
  prompt: "What tools are available for the helix ask to use?",
  requested_capability: null,
  visible_tool_surface: ["helix_ask.inspect_capability_catalog"],
  visible_tool_surface_original_count: 1,
  visible_tool_surface_truncated: false,
  selected_capability: "helix_ask.inspect_capability_catalog",
  admitted_capability: "helix_ask.inspect_capability_catalog",
  admission_proof_source: "capability_plan.selected_capability",
  admission_proven: true,
  executed_capability: "helix_ask.inspect_capability_catalog",
  observation_kind: "capability_registry",
  observation_ref: "ask:ui-debug-parity:test:capability_registry",
  required_observation_kinds_for_requested_capability: ["capability_registry"],
  observed_artifact_supports_requested_capability: true,
  reentry_status: "reentered",
  reentry_proof_source: "tool_lifecycle_trace.lifecycle_stage",
  reentry_proven: true,
  goal_satisfaction: "satisfied",
  required_terminal_kind: "capability_help_summary",
  selected_terminal_kind: "capability_help_summary",
  terminal_authority_proof_source: "terminal_answer_authority.terminal_artifact_kind",
  terminal_authority_proven: true,
  visible_terminal_kind: "capability_help_summary",
  visible_projection_source: "terminal_presentation.terminal_artifact_kind",
  visible_projection_proven: true,
  codex_parity_class: "complete",
  first_broken_rail: null,
  repair_target: null,
  rail_status: "complete",
  rail_failure_code: null,
  normalized_codex_parity_classes: [...CODEX_PARITY_AGENT_SPINE_CLASSES],
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

describe("Helix Ask UI debug parity harness", () => {
  it("collects rail tables from top-level, payload, and nested debug mirrors", () => {
    const rail = baseRail();
    const debugExport = {
      codex_parity_agent_spine_rail_table: rail,
      payload: {
        codex_parity_agent_spine_rail_table: rail,
        debug: {
          codex_parity_agent_spine_rail_table: rail,
        },
        artifact_query_index: {
          codex_parity_agent_spine_rail_table: rail,
        },
      },
    };

    const rails = collectUiDebugRailCandidates(debugExport);

    expect(rails).toHaveLength(4);
    expect(rails.every((entry) => entry.turn_id === "ask:ui-debug-parity:test")).toBe(true);
  });

  it("flags stale UI debug rail mirrors", () => {
    const rail = baseRail();
    const staleRail = {
      ...rail,
      turn_id: "ask:ui-debug-parity:previous",
      prompt: "Stale previous prompt",
      visible_tool_surface: ["model.direct_answer"],
      selected_terminal_kind: "direct_answer_text",
      visible_terminal_kind: "direct_answer_text",
    };

    const violations = collectUiDebugRailMirrorViolations([rail, staleRail]);

    expect(violations).toEqual(
      expect.arrayContaining([
        "rail_mirror_1_turn_id_mismatch:ask:ui-debug-parity:previous!=ask:ui-debug-parity:test",
        "rail_mirror_1_prompt_mismatch:Stale previous prompt!=What tools are available for the helix ask to use?",
        "rail_mirror_1_visible_tool_surface_mismatch:model.direct_answer!=helix_ask.inspect_capability_catalog",
        "rail_mirror_1_selected_terminal_kind_mismatch:direct_answer_text!=capability_help_summary",
        "rail_mirror_1_visible_terminal_kind_mismatch:direct_answer_text!=capability_help_summary",
      ]),
    );
  });
});
