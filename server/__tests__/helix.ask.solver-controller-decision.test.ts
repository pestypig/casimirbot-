import { describe, expect, it } from "vitest";

import {
  buildFinalRouteReconciliation,
  buildSolverControllerDecision,
  buildTurnIdIntegrityAudit,
} from "../services/helix-ask/solver-controller-decision";

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
});
