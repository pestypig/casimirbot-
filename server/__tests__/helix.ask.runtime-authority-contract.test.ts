import { describe, expect, it } from "vitest";

import {
  buildCapabilityBindingMismatchObservation,
  evaluateTerminalBoundaryEligibility,
  goalSatisfactionAllowsTerminal,
  hasAgentRuntimeLoopDecisionChain,
  hasDirectAnswerDraft,
  hasPostObservationModelDecision,
  hasSelectedCapabilityObservation,
  isSourceCapabilityDiagnosticTurn,
} from "../services/helix-ask/runtime-authority-contract";

describe("helix ask runtime authority contract", () => {
  it("requires model-only direct answers to include a model answer step and answer draft", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
    });

    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "agent_step_decision_missing",
        "direct_answer_text_missing",
        "post_observation_model_decision_missing",
      ]),
    );
  });

  it("allows model-only direct answers from a terminal-review model decision and answer artifact without a tool loop", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "model_only_concept" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "model_only_concept",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_step_decision: {
        decision_timing: "terminal_review",
        sampling: { mode: "llm" },
        model_decision: {
          next_step: "answer",
          chosen_capability: "model.direct_answer",
        },
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "direct-answer-1",
          kind: "direct_answer_text",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "Electrons are negatively charged and much lighter than protons.",
          },
        },
      ],
    };

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.blocking_reasons).toEqual([]);
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

  it("treats Dottie observer receipts as observations for selected Situation Room observer capabilities", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-dottie-attach",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "situation-room-pipelines.observer.attach",
            observed_artifact_refs: ["dottie-attach-1"],
          },
          {
            decision_id: "agent-step-dottie-voice",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "situation-room-pipelines.voice_delivery.propose_from_trace",
            observed_artifact_refs: ["dottie-voice-1"],
          },
          {
            decision_id: "agent-step-dottie-query",
            decision_authority: "llm",
            decision_timing: "terminal_review",
            chosen_capability: "situation-room-pipelines.observer.query",
            observed_artifact_refs: ["dottie-query-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          decision_ref: "agent-step-dottie-attach",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
        {
          artifact_id: "dottie-voice-1",
          kind: "dottie_voice_receipt",
          decision_ref: "agent-step-dottie-voice",
          payload: {
            schema: "helix.dottie_voice_receipt.v1",
            panel_id: "situation-room-pipelines",
            action_id: "voice_delivery.propose_from_trace",
            source_event_id: "agent_commentary:orientation",
          },
        },
        {
          artifact_id: "dottie-query-1",
          kind: "dottie_observer_query_receipt",
          decision_ref: "agent-step-dottie-query",
          payload: {
            panel_id: "situation-room-pipelines",
            action_id: "observer.query",
            observer_count: 1,
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

  it("does not let Dottie receipts satisfy a stale docs capability selection", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-docs",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
            observed_artifact_refs: ["dottie-attach-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          decision_ref: "agent-step-stale-docs",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it("reconciles current-turn Dottie receipts for selected Dottie capability even when iteration refs are missing", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-dottie-attach",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "situation-room-pipelines.observer.attach",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          source_scope: "current_turn",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
        {
          artifact_id: "dottie-eval-1",
          kind: "workstation_tool_evaluation",
          source_scope: "current_turn",
          payload: {
            schema: "helix.workstation_tool_evaluation.v1",
            tool_key: "situation-room-pipelines.observer.attach",
            supports_goal: true,
            summary: "Dottie observer attach/query/voice receipts completed.",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).not.toContain("selected_capability_observation_missing");
  });

  it("does not reconcile unlinked Dottie receipts for stale docs capability", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-docs",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          source_scope: "current_turn",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toContain("selected_capability_observation_missing");
  });

  it.each([
    ["docs-viewer.open_doc_by_path", "dottie_voice_receipt"],
    ["scientific-calculator.solve_with_steps", "dottie_observer_query_receipt"],
    ["situation-room-pipelines.open", "dottie_observer_subscription_receipt"],
  ])("does not let %s consume unrelated Dottie artifact %s", (chosenCapability, artifactKind) => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-tool",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: chosenCapability,
            observed_artifact_refs: ["dottie-artifact-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-artifact-1",
          kind: artifactKind,
          decision_ref: "agent-step-stale-tool",
          source_scope: "current_turn",
          payload: {
            schema: `helix.${artifactKind}.v1`,
            panel_id: "situation-room-pipelines",
            action_id: artifactKind === "dottie_voice_receipt" ? "voice_delivery.propose_from_trace" : "observer.query",
          },
        },
      ],
    };

    expect(hasSelectedCapabilityObservation(payload)).toBe(false);
  });

  it("builds a repair observation when selected capability and observed artifact family diverge", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "panel_control", required_terminal_kind: "workstation_tool_evaluation" },
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      goal_satisfaction_evaluation: {
        canonical_goal_kind: "panel_control",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-stale-docs",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "docs-viewer.open",
            observed_artifact_refs: ["dottie-attach-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "dottie-attach-1",
          kind: "dottie_observer_subscription_receipt",
          decision_ref: "agent-step-stale-docs",
          payload: {
            schema: "helix.dottie_observer_subscription.v1",
            panel_id: "situation-room-pipelines",
            action_id: "observer.attach",
            target_run_id: "run:ask:dottie-ui-smoke",
          },
        },
      ],
    };

    const observation = buildCapabilityBindingMismatchObservation(payload);

    expect(observation).toMatchObject({
      schema: "helix.capability_binding_mismatch_observation.v1",
      selected_capability: "docs-viewer.open",
      observed_artifact_refs: ["dottie-attach-1"],
      observed_artifact_kinds: ["dottie_observer_subscription_receipt"],
      suggested_capability: "situation-room-pipelines.observer.attach",
      suggested_repair: "rebind_selected_capability_to_observed_tool_plan",
    });
  });

  it("exposes model-direct selection as a mismatch when docs observations exist", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "doc_summary", required_terminal_kind: "doc_summary" },
      terminal_artifact_kind: "doc_summary",
      final_answer_source: "doc_summary",
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-model-direct",
            decision_authority: "llm",
            decision_timing: "post_observation",
            chosen_capability: "model.direct_answer",
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc-summary-1",
          kind: "doc_summary",
          source_scope: "current_turn",
          payload: {
            schema: "helix.doc_summary.v1",
            path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          },
        },
      ],
    };

    const observation = buildCapabilityBindingMismatchObservation(payload);

    expect(observation).toMatchObject({
      schema: "helix.capability_binding_mismatch_observation.v1",
      selected_capability: "model.direct_answer",
      observed_artifact_refs: ["doc-summary-1"],
      observed_artifact_kinds: ["doc_summary"],
      suggested_capability: "docs-viewer.summarize_doc",
      suggested_repair: "rebind_model_direct_answer_to_observed_tool_family",
    });
  });

  it("does not flag a clean model-direct answer draft as a tool binding mismatch", () => {
    const payload = {
      canonical_goal_frame: { goal_kind: "model_only_concept", required_terminal_kind: "direct_answer_text" },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      agent_runtime_loop: {
        iterations: [
          {
            decision_id: "agent-step-model-direct",
            decision_authority: "llm",
            decision_timing: "terminal_review",
            chosen_capability: "model.direct_answer",
            observed_artifact_refs: ["direct-answer-1"],
          },
        ],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "direct-answer-1",
          kind: "direct_answer_text",
          source_scope: "current_turn",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "An electron is a negatively charged elementary particle.",
          },
        },
      ],
    };

    expect(buildCapabilityBindingMismatchObservation(payload)).toBeNull();
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

  it("allows live pipeline control receipts when route authority and disclosure keep them observation-only", () => {
    const payload = {
      canonical_goal_frame: {
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      source_target_intent: {
        target_source: "live_pipeline",
        target_kind: "live_pipeline",
        allow_no_tool_direct: false,
        allow_client_shortcut: false,
      },
      route_product_contract: {
        source_target: "live_pipeline",
        allowed_terminal_artifact_kinds: ["live_pipeline_receipt", "typed_failure"],
        forbidden_terminal_artifact_kinds: ["situation_context_pack"],
      },
      terminal_artifact_selection_guard: {
        allowed: true,
        terminal_artifact_kind: "live_pipeline_receipt",
      },
      product_authority_guard: {
        allowed: true,
      },
      tool_call_admission_decision: {
        source_target: "live_pipeline",
        required: true,
        admitted_tool_families: ["live_pipeline"],
      },
      live_pipeline_turn_receipt: {
        schema: "helix.live_pipeline_turn_receipt.v1",
        actions: ["situation-room.pipeline.inspect", "situation-room.live-source.set_rate"],
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_trace_disclosure: {
        schema: "helix.ask_tool_trace_disclosure.v1",
        items: [
          {
            tool: "situation-room.live-source.set_rate",
            role: "state_mutation",
            authority: "mutation_receipt",
            summary: "Changed the live source cadence policy.",
          },
        ],
        assistant_answer: false,
        terminal_eligible: false,
      },
      terminal_artifact_kind: "live_pipeline_receipt",
      final_answer_source: "live_pipeline_receipt",
    };

    expect(goalSatisfactionAllowsTerminal(payload)).toBe(true);

    const report = evaluateTerminalBoundaryEligibility(payload);
    expect(report.source_capability_diagnostic_turn).toBe(true);
    expect(report.requires_runtime_loop).toBe(false);
    expect(report.eligible).toBe(true);
    expect(report.blocking_reasons).toEqual([]);
  });

  it("does not allow live pipeline receipts when the route contract forbids receipt terminals", () => {
    const report = evaluateTerminalBoundaryEligibility({
      canonical_goal_frame: {
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      source_target_intent: {
        target_source: "live_pipeline",
        target_kind: "live_pipeline",
        allow_no_tool_direct: false,
        allow_client_shortcut: false,
      },
      route_product_contract: {
        source_target: "live_pipeline",
        allowed_terminal_artifact_kinds: ["typed_failure"],
        forbidden_terminal_artifact_kinds: ["live_pipeline_receipt"],
      },
      terminal_artifact_selection_guard: {
        allowed: false,
        terminal_artifact_kind: "live_pipeline_receipt",
      },
      tool_call_admission_decision: {
        source_target: "live_pipeline",
        required: true,
        admitted_tool_families: ["live_pipeline"],
      },
      live_pipeline_turn_receipt: {
        schema: "helix.live_pipeline_turn_receipt.v1",
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_trace_disclosure: {
        schema: "helix.ask_tool_trace_disclosure.v1",
        items: [{ tool: "situation-room.pipeline.inspect" }],
        assistant_answer: false,
        terminal_eligible: false,
      },
      terminal_artifact_kind: "live_pipeline_receipt",
      final_answer_source: "live_pipeline_receipt",
    });

    expect(report.requires_runtime_loop).toBe(true);
    expect(report.eligible).toBe(false);
    expect(report.blocking_reasons).toEqual(
      expect.arrayContaining([
        "goal_satisfaction_not_terminal",
        "agent_runtime_loop_missing",
        "selected_capability_observation_missing",
      ]),
    );
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
