import { describe, expect, it } from "vitest";

import {
  evaluateTerminalBoundaryEligibility,
  goalSatisfactionAllowsTerminal,
  hasAgentRuntimeLoopDecisionChain,
  hasDirectAnswerDraft,
  hasPostObservationModelDecision,
  hasSelectedCapabilityObservation,
  isSourceCapabilityDiagnosticTurn,
} from "../services/helix-ask/runtime-authority-contract";

describe("helix ask runtime authority contract", () => {
  it("requires model-only direct answers to pass through the runtime answer step", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "agent_runtime_loop_missing",
        "agent_step_decision_missing",
        "direct_answer_text_missing",
      ]),
    );
  });

  it("allows model-only direct answers after the loop records a model answer draft", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "model_only_concept",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-answer",
            decision_authority: "llm",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "model_answer_draft",
            observed_artifact_refs: ["direct-answer-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "direct-answer-1",
          kind: "direct_answer_text",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "An electron is a negatively charged elementary particle.",
          },
        },
      ],
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(false);
    expect(hasAgentRuntimeLoopDecisionChain(payload)).toBe(true);
    expect(hasDirectAnswerDraft(payload)).toBe(true);
    expect(hasPostObservationModelDecision(payload)).toBe(true);
    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.severity).toBe("pass");
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
      current_turn_artifact_ledger: [
        {
          artifact_id: "receipt-1",
          kind: "workspace_action_receipt",
          payload: {
            kind: "workspace_action_receipt",
            panel_id: "docs-viewer",
            action_id: "open",
          },
        },
      ],
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

  it("treats doc_summary artifacts as docs capability observations", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "active_doc_summary", required_terminal_kind: "doc_summary" },
      terminal_artifact_kind: "doc_summary",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "active_doc_summary",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-doc-summary",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.summarize_doc",
            artifact_refs: ["doc-summary-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          payload: {
            kind: "doc_summary",
            path: "/docs/research/example.md",
            text: "This document summarizes the current status and caveats.",
          },
        },
      ],
    };

    expect(isSourceCapabilityDiagnosticTurn(payload)).toBe(true);
    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("accepts agent step loop capability observations recorded after the selected action step", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "doc_evidence_location", required_terminal_kind: "doc_location_result" },
      terminal_artifact_kind: "doc_location_matches",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "doc_evidence_location",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-answer",
            decision_authority: "llm",
            decision_timing: "terminal_review",
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            observation_role: "terminal_decision",
          },
        ],
      },
      final_answer_draft: {
        text: "Locations:\n- /docs/research/example.md:12 - Assumptions are listed here.",
      },
      agent_step_loop: {
        steps: [
          {
            step_id: "initial",
            decision_ref: "agent-step-locate",
            next_step: "next_action",
            chosen_capability: "docs-viewer.locate_in_doc",
            observation_refs: [],
            sampling_mode: "llm",
          },
          {
            step_id: "post_observation",
            decision_ref: "agent-step-answer",
            next_step: "answer",
            chosen_capability: null,
            observation_refs: ["doc-location-1"],
            sampling_mode: "llm",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-location-1",
          kind: "doc_location_matches",
          payload: {
            kind: "doc_location_matches",
            path: "/docs/research/example.md",
            matches: [{ path: "/docs/research/example.md", line_start: 12, line_end: 12, text: "Assumptions are listed here." }],
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("does not let an unrelated current-turn artifact satisfy the selected capability observation", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "calculator_solve", required_terminal_kind: "calculator_receipt" },
      terminal_artifact_kind: "calculator_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "calculator_solve",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-calculator",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "scientific-calculator.solve_expression",
            observed_artifact_refs: ["doc-summary-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          payload: {
            kind: "doc_summary",
            path: "/docs/research/example.md",
            text: "This is not a calculator receipt.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("does not let a completed tool observation satisfy the wrong selected capability by ref presence alone", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "calculator_solve", required_terminal_kind: "calculator_receipt" },
      terminal_artifact_kind: "calculator_receipt",
      final_answer_source: "artifact_synthesis",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "calculator_solve",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-calculator",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "scientific-calculator.solve_expression",
            tool_observation: {
              status: "completed",
              artifact_refs: ["doc-summary-1"],
            },
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          payload: {
            kind: "doc_summary",
            decision_ref: "agent-step-calculator",
            path: "/docs/research/example.md",
            text: "This artifact is linked to the decision but is still the wrong tool family.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
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
