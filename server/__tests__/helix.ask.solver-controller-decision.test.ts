import { describe, expect, it } from "vitest";

import {
  buildFinalRouteReconciliation,
  buildSolverControllerDecision,
  buildTurnIdIntegrityAudit,
} from "../services/helix-ask/solver-controller-decision";

const satisfiedGoal = (goalKind: string, terminalKind: string) => ({
  schema: "helix.goal_satisfaction_evaluation.v1",
  turn_id: `ask:${goalKind}`,
  canonical_goal_kind: goalKind,
  required_terminal_kind: terminalKind,
  terminal_contract: {
    goal_kind: goalKind,
    required_terminal_kinds: [terminalKind],
    acceptable_fallbacks: [],
    forbidden_terminal_kinds: [],
  },
  required_actions: [],
  required_evidence: [],
  observed_results: [],
  satisfaction: "satisfied",
  next_decision: "allow_terminal",
  assistant_answer: false,
  raw_content_included: false,
});

const terminalEquivalenceOk = {
  schema: "helix.terminal_equivalence_harness_result.v1",
  ok: true,
  failure_codes: [],
};

const capabilityLifecycleOk = (turnId: string, terminalKind: string) => {
  const live = terminalKind === "live_pipeline_receipt";
  const capabilityFamily = live ? "live_source" : "workstation_action";
  const requestedAction = live ? "control_live_source" : "execute_workstation_action";
  const capabilityPlanId = `capability_plan:${turnId}:${capabilityFamily}:${requestedAction}`;
  const terminalArtifactId = `${turnId}:${terminalKind}`;
  return {
    terminal_artifact_id: terminalArtifactId,
    capability_plan: {
      schema: "helix.capability_plan.v1",
      turn_id: turnId,
      capability_family: capabilityFamily,
      requested_action: requestedAction,
      mutating: true,
      operator_command_required: true,
      operator_command_present: true,
      source_target: live ? "live_pipeline" : "workstation_panel",
      goal_kind: live ? "live_interval_set" : "panel_control",
      required_terminal_kind: terminalKind,
      admission_status: "admitted",
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_result: {
      schema: "helix.capability_result.v1",
      turn_id: turnId,
      capability_plan_id: capabilityPlanId,
      status: "succeeded",
      receipt_refs: [terminalArtifactId],
      evidence_refs: [],
      selected_for_answer: true,
      reentered_solver: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_lifecycle_ledger: {
      schema: "helix.capability_lifecycle_ledger.v1",
      turn_id: turnId,
      capability_plan_id: capabilityPlanId,
      capability_result_id: capabilityPlanId,
      stages: [],
      failure_codes: [],
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_adapter_request: {
      schema: "helix.capability_adapter_request.v1",
      turn_id: turnId,
      capability_plan_id: capabilityPlanId,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_adapter_result: {
      schema: "helix.capability_adapter_result.v1",
      turn_id: turnId,
      capability_plan_id: capabilityPlanId,
      status: "succeeded",
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

describe("helix ask solver controller decision", () => {
  it("blocks stale terminal authority routes before normal terminal answers", () => {
    const payload = {
      canonical_goal_frame: {
        turn_id: "ask:stale",
        goal_kind: "doc_open_best",
        required_terminal_kind: "doc_open_receipt",
      },
      route_reason_code: "doc_open_best",
      terminal_artifact_kind: "doc_open_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:stale",
        route: "dispatch:act",
        terminal_artifact_kind: "doc_open_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:stale", completed_solver_path: true },
      goal_satisfaction_evaluation: satisfiedGoal("doc_open_best", "doc_open_receipt"),
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const routeReconciliation = buildFinalRouteReconciliation({
      turnId: "ask:stale",
      finalRoute: "doc_open_best",
      payload,
    });
    const decision = buildSolverControllerDecision({
      turnId: "ask:stale",
      finalRoute: "doc_open_best",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:stale", payload }),
      finalRouteReconciliation: routeReconciliation,
    });

    expect(routeReconciliation.ok).toBe(false);
    expect(decision.decision).toBe("fail_closed");
    expect(decision.blocking_reasons).toContain("terminal_route_mismatch");
  });

  it("allows typed failures as fail-closed terminal products even when the previous route contract rejected the normal answer", () => {
    const payload = {
      canonical_goal_frame: {
        turn_id: "ask:typed-failure",
        goal_kind: "doc_open_best",
        required_terminal_kind: "doc_open_receipt",
      },
      route_reason_code: "doc_open_best",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:typed-failure",
        route: "dispatch:act",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        server_authoritative: true,
      },
      terminal_artifact_selection_guard: { allowed: false },
      product_authority_guard: { allowed: false },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: false },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:typed-failure", completed_solver_path: false },
    };

    const routeReconciliation = buildFinalRouteReconciliation({
      turnId: "ask:typed-failure",
      finalRoute: "doc_open_best",
      payload,
    });
    const decision = buildSolverControllerDecision({
      turnId: "ask:typed-failure",
      finalRoute: "doc_open_best",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:typed-failure", payload }),
      finalRouteReconciliation: routeReconciliation,
    });

    expect(routeReconciliation.ok).toBe(true);
    expect(decision.decision).toBe("allow_terminal");
    expect(decision.blocking_reasons).toEqual([]);
  });

  it("blocks explicit visual answers when the live source identity audit is not ok", () => {
    const payload = {
      active_prompt: "Describe what you see in the visual capture.",
      canonical_goal_frame: {
        turn_id: "ask:visual",
        goal_kind: "situation_context_question",
        required_terminal_kind: "situation_context_pack",
      },
      source_target_intent: { target_source: "visual_capture", target_kind: "visual_capture" },
      route_reason_code: "situation_context_question",
      terminal_artifact_kind: "situation_context_pack",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:visual",
        route: "situation_context_question",
        terminal_artifact_kind: "situation_context_pack",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:visual", completed_solver_path: false },
      goal_satisfaction_evaluation: satisfiedGoal("situation_context_question", "situation_context_pack"),
      terminal_equivalence_harness_result: terminalEquivalenceOk,
      live_source_identity_audit: {
        schema: "helix.live_source_identity_audit.v1",
        identity_ok: false,
        freshness_ok: false,
        diagnosis: "field_evaluations_missing",
      },
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:visual",
      finalRoute: "situation_context_question",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:visual", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:visual",
        finalRoute: "situation_context_question",
        payload,
      }),
    });

    expect(decision.decision).toBe("fail_closed");
    expect(decision.blocking_reasons).toContain("visual_evidence_missing");
    expect(decision.typed_failure_code).toBe("field_evaluations_missing");
  });

  it("blocks no-tool direct answers to live capture content prompts", () => {
    const payload = {
      active_prompt: "Describe what you see in the live capture.",
      canonical_goal_frame: {
        turn_id: "ask:live-capture-direct",
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      },
      route_reason_code: "model_only_concept / no_tool_direct",
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "no_tool_direct",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:live-capture-direct",
        route: "model_only_concept",
        terminal_artifact_kind: "direct_answer_text",
        final_answer_source: "no_tool_direct",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:live-capture-direct", completed_solver_path: true },
      goal_satisfaction_evaluation: satisfiedGoal("model_only_concept", "direct_answer_text"),
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:live-capture-direct",
      finalRoute: "model_only_concept / no_tool_direct",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:live-capture-direct", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:live-capture-direct",
        finalRoute: "model_only_concept / no_tool_direct",
        payload,
      }),
    });

    expect(decision.decision).toBe("fail_closed");
    expect(decision.blocking_reasons).toContain("visual_evidence_missing");
  });

  it("blocks live pipeline receipts from satisfying live capture content prompts", () => {
    const payload = {
      active_prompt: "Can you review what is happening in the screen capture? I haven't started the interval 10 seconds yet.",
      canonical_goal_frame: {
        turn_id: "ask:visual-control-receipt",
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      source_target_intent: { target_source: "visual_capture", target_kind: "visual_capture" },
      route_reason_code: "live_pipeline_control",
      terminal_artifact_kind: "live_pipeline_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:visual-control-receipt",
        route: "live_pipeline_control",
        terminal_artifact_kind: "live_pipeline_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:visual-control-receipt", completed_solver_path: true },
      goal_satisfaction_evaluation: {
        ...satisfiedGoal("visual_capture_describe", "situation_context_pack"),
        terminal_contract: {
          goal_kind: "visual_capture_describe",
          required_terminal_kinds: ["visual_context_pack", "situation_context_pack", "visual_frame_evidence"],
          acceptable_fallbacks: ["typed_failure"],
          forbidden_terminal_kinds: ["live_pipeline_receipt", "visual_producer_cadence_receipt"],
          required_evidence: ["visual_observation", "field_evaluation"],
        },
        satisfaction: "not_satisfied",
        next_decision: "continue",
      },
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:visual-control-receipt",
      finalRoute: "live_pipeline_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:visual-control-receipt", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:visual-control-receipt",
        finalRoute: "live_pipeline_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("continue");
    expect(decision.blocking_reasons).toEqual(
      expect.arrayContaining(["goal_not_satisfied", "terminal_kind_not_required", "visual_evidence_missing"]),
    );
    expect(decision.typed_failure_code).toBe("visual_evidence_missing");
  });

  it("allows affirmative live interval control receipts under the live interval goal contract", () => {
    const payload = {
      active_prompt: "Set the visual capture interval to 10 seconds.",
      canonical_goal_frame: {
        turn_id: "ask:live-interval",
        goal_kind: "live_pipeline_control",
        required_terminal_kind: "live_pipeline_receipt",
      },
      route_reason_code: "live_pipeline_control",
      terminal_artifact_kind: "live_pipeline_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:live-interval",
        route: "live_pipeline_control",
        terminal_artifact_kind: "live_pipeline_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:live-interval", completed_solver_path: true },
      ...capabilityLifecycleOk("ask:live-interval", "live_pipeline_receipt"),
      goal_satisfaction_evaluation: {
        ...satisfiedGoal("live_interval_set", "live_pipeline_receipt"),
        terminal_contract: {
          goal_kind: "live_interval_set",
          required_terminal_kinds: ["live_pipeline_receipt"],
          acceptable_fallbacks: ["typed_failure", "request_user_input"],
          forbidden_terminal_kinds: ["visual_context_pack", "situation_context_pack", "visual_frame_evidence"],
          required_actions: ["situation-room.live-source.set_rate"],
          required_evidence: ["live_pipeline_receipt"],
        },
      },
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:live-interval",
      finalRoute: "live_pipeline_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:live-interval", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:live-interval",
        finalRoute: "live_pipeline_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("allow_terminal");
    expect(decision.blocking_reasons).toEqual([]);
  });

  it("blocks workstation action receipts when the capability lifecycle is incomplete", () => {
    const payload = {
      active_prompt: "Open the docs panel.",
      canonical_goal_frame: {
        turn_id: "ask:capability-incomplete",
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      route_reason_code: "panel_control",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:capability-incomplete",
        route: "panel_control",
        terminal_artifact_kind: "workspace_action_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:capability-incomplete", completed_solver_path: true },
      goal_satisfaction_evaluation: satisfiedGoal("docs_panel_open", "workspace_action_receipt"),
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:capability-incomplete",
      finalRoute: "panel_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:capability-incomplete", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:capability-incomplete",
        finalRoute: "panel_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("fail_closed");
    expect(decision.blocking_reasons).toContain("capability_lifecycle_incomplete");
  });

  it("allows workstation action receipts after plan, adapter result, lifecycle, and re-entry are complete", () => {
    const payload = {
      active_prompt: "Open the docs panel.",
      canonical_goal_frame: {
        turn_id: "ask:capability-complete",
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      route_reason_code: "panel_control",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:capability-complete",
        route: "panel_control",
        terminal_artifact_kind: "workspace_action_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:capability-complete", completed_solver_path: true },
      ...capabilityLifecycleOk("ask:capability-complete", "workspace_action_receipt"),
      goal_satisfaction_evaluation: satisfiedGoal("docs_panel_open", "workspace_action_receipt"),
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:capability-complete",
      finalRoute: "panel_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:capability-complete", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:capability-complete",
        finalRoute: "panel_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("allow_terminal");
    expect(decision.blocking_reasons).toEqual([]);
    expect(decision.consumed_artifact_refs).toEqual(
      expect.arrayContaining([
        "capability_plan",
        "capability_result",
        "capability_lifecycle_ledger",
        "capability_adapter_request",
        "capability_adapter_result",
      ]),
    );
  });

  it("blocks normal terminal answers when the goal satisfaction evaluator did not allow terminal", () => {
    const payload = {
      active_prompt: "Okay, can you open up the Docs panel?",
      canonical_goal_frame: {
        turn_id: "ask:docs-panel",
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      route_reason_code: "panel_control",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:docs-panel",
        route: "panel_control",
        terminal_artifact_kind: "workspace_action_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        turn_id: "ask:docs-panel",
        completed_solver_path: true,
        final_arbitration: { reason: "all_subgoals_observed" },
      },
      goal_satisfaction_evaluation: {
        ...satisfiedGoal("docs_panel_open", "workspace_action_receipt"),
        satisfaction: "not_satisfied",
        next_decision: "continue",
      },
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:docs-panel",
      finalRoute: "panel_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:docs-panel", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:docs-panel",
        finalRoute: "panel_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("continue");
    expect(decision.blocking_reasons).toEqual(
      expect.arrayContaining(["goal_not_satisfied", "subgoals_observed_not_satisfied"]),
    );
  });

  it("blocks satisfied evaluations whose terminal artifact kind is not required by the goal contract", () => {
    const payload = {
      canonical_goal_frame: {
        turn_id: "ask:wrong-terminal",
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      route_reason_code: "panel_control",
      terminal_artifact_kind: "active_doc_identity",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:wrong-terminal",
        route: "panel_control",
        terminal_artifact_kind: "active_doc_identity",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:wrong-terminal", completed_solver_path: true },
      goal_satisfaction_evaluation: satisfiedGoal("docs_panel_open", "workspace_action_receipt"),
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:wrong-terminal",
      finalRoute: "panel_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:wrong-terminal", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:wrong-terminal",
        finalRoute: "panel_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("typed_failure");
    expect(decision.blocking_reasons).toContain("terminal_kind_not_required");
  });

  it("fails source-targeted normal terminals that lack a required artifact contract", () => {
    const payload = {
      active_prompt: "Open the docs panel.",
      canonical_goal_frame: {
        turn_id: "ask:missing-contract",
        goal_kind: "panel_control",
        required_terminal_kind: "workspace_action_receipt",
      },
      source_target_intent: {
        target_source: "docs_viewer",
        target_kind: "docs_viewer",
        strength: "hard",
        requested_outputs: ["workspace_action_receipt"],
        allow_no_tool_direct: false,
      },
      route_reason_code: "panel_control",
      terminal_artifact_kind: "workspace_action_receipt",
      final_answer_source: "artifact_synthesis",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        turn_id: "ask:missing-contract",
        route: "panel_control",
        terminal_artifact_kind: "workspace_action_receipt",
        final_answer_source: "artifact_synthesis",
        server_authoritative: true,
      },
      poison_audit: { schema: "helix.turn_poison_audit.v1", ok: true, violations: [] },
      route_authority_audit: { schema: "helix.route_authority_audit.v1", route_authority_ok: true },
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1", turn_id: "ask:missing-contract", completed_solver_path: true },
      goal_satisfaction_evaluation: {
        ...satisfiedGoal("docs_panel_open", "workspace_action_receipt"),
        terminal_contract: undefined,
      },
      terminal_equivalence_harness_result: terminalEquivalenceOk,
    };

    const decision = buildSolverControllerDecision({
      turnId: "ask:missing-contract",
      finalRoute: "panel_control",
      payload,
      turnIdIntegrityAudit: buildTurnIdIntegrityAudit({ turnId: "ask:missing-contract", payload }),
      finalRouteReconciliation: buildFinalRouteReconciliation({
        turnId: "ask:missing-contract",
        finalRoute: "panel_control",
        payload,
      }),
    });

    expect(decision.decision).toBe("typed_failure");
    expect(decision.blocking_reasons).toContain("required_artifact_contract_missing");
  });
});
