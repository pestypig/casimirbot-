import { describe, expect, it } from "vitest";

import {
  evaluateTerminalBoundaryEligibility,
  goalSatisfactionAllowsTerminal,
  hasAgentRuntimeLoopDecisionChain,
  hasPostObservationModelDecision,
  hasSelectedCapabilityObservation,
  isSourceCapabilityDiagnosticTurn,
} from "../services/helix-ask/runtime-authority-contract";

describe("helix ask runtime authority contract", () => {
  it("does not require the runtime loop for model-only direct answers", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "no_tool_direct",
    });

    expect(report.source_capability_diagnostic_turn).toBe(false);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).toEqual([]);
  });

  it("blocks source/capability terminals that skip the runtime loop", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "docs_panel_open" },
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "docs_panel_open",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.severity).toBe("p0");
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "agent_runtime_loop_missing",
        "agent_step_decision_missing",
        "selected_capability_observation_missing",
        "post_observation_model_decision_missing",
      ]),
    );
  });

  it("allows source/capability terminals after model decision, observation, post-observation review, and goal satisfaction", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "docs_panel_open" },
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "docs_panel_open",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-1",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
            tool_observation: {
              status: "completed",
              artifact_refs: ["receipt-1"],
            },
          },
        ],
      },
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasAgentRuntimeLoopDecisionChain(payload)).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);
    expect(hasPostObservationModelDecision(payload)).toBe(true);
    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.severity).toBe("pass");
    expect(report.blocking_reasons).toEqual([]);
  });

  it("allows clean typed failures for source/capability turns without minting a successful terminal", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "debug_diagnosis" },
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "debug_evidence_missing",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.checks.typed_failure_clean).toBe(true);
    expect(report.eligible).toBe(true);
  });

  it("blocks typed failures that do not carry a failure code", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "visual_capture_describe" },
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.severity).toBe("p1");
    expect(report.blocking_reasons).toContain("goal_satisfaction_not_terminal");
    expect(report.blocking_reasons).toContain("typed_failure_missing_code");
  });
});
