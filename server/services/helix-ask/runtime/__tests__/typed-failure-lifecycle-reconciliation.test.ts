import { describe, expect, it } from "vitest";

import { reconcileAuthoritativeTypedFailureLifecycle } from "../typed-failure-lifecycle-reconciliation";

const basePayload = (): Record<string, unknown> => ({
  terminal_artifact_kind: "typed_failure",
  final_answer_source: "typed_failure",
  route_product_contract: {
    schema: "helix.route_product_contract.v1",
    source_target: "visual_capture",
    allowed_terminal_artifact_kinds: ["typed_failure"],
    forbidden_terminal_artifact_kinds: [],
  },
  source_target_intent: {
    schema: "helix.ask_source_target_intent.v1",
    target_source: "visual_capture",
    target_kind: "visual_capture",
    strength: "hard",
    must_enter_backend_ask: true,
    allow_client_shortcut: false,
    allow_no_tool_direct: false,
  },
  tool_call_admission_decision: {
    schema: "helix.tool_call_admission_decision.v1",
    requested_capability: "situation_run",
    admitted_capability: "situation_run",
    required_observation_kinds_for_requested_capability: [],
    admitted_tool_families: ["situation_run"],
  },
  current_turn_artifact_ledger: [],
  loop_parity_trace: {
    schema: "helix.loop_parity_trace.v1",
    selected_route: "/ask/turn",
    observations_created: [],
    route_authority_ok: false,
    terminal_selection_ran_after_observations: false,
    short_circuit_risk_flags: [
      "route_contract_missing",
      "route_authority_missing",
      "terminal_selected_before_observation_finalizer",
    ],
  },
  ask_turn_solver_trace: {
    schema: "helix.ask_turn_solver_trace.v1",
    route_authority_ok: false,
    solver_risk_flags: ["terminal_authority_before_solver_completion"],
    solver_short_circuit_flags: [
      "terminal_authority_before_solver_completion",
    ],
    evidence_reentry: {
      required: true,
      completed: false,
      skipped_reason: "terminal_selection_missing_after_required_evidence",
    },
    followup_reasoning_gate: {
      required: true,
      completed: false,
      skipped_reason: "final_arbitration_missing_after_evidence_or_tool_result",
      violation_codes: ["missing_followup_reasoning"],
    },
    final_arbitration: {
      terminal_artifact_kind: "unknown",
      final_answer_source: "unknown",
      remaining_uncertainty: [
        "terminal_authority_before_solver_completion",
      ],
    },
  },
  codex_parity_agent_spine_rail_table: {
    requested_capability: "situation_run",
    required_observation_kinds_for_requested_capability: [],
    observed_artifact_supports_requested_capability: true,
  },
});

describe("authoritative typed-failure lifecycle reconciliation", () => {
  it("settles stale route and terminal flags after a zero-observation typed failure", () => {
    const payload = basePayload();
    delete payload.route_product_contract;

    expect(
      reconcileAuthoritativeTypedFailureLifecycle({
        payload,
        turnId: "ask:test:capability-unavailable",
        promptText: "Review what is happening in the screen capture.",
        selectedTerminalArtifactKind: "typed_failure",
        finalAnswerSource: "typed_failure",
      }),
    ).toBe(true);

    expect(payload.route_authority_audit).toMatchObject({
      schema: "helix.route_authority_audit.v1",
      route_authority_ok: true,
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(payload.route_product_contract).toMatchObject({
      schema: "helix.route_product_contract.v1",
      source_target: "visual_capture",
    });
    expect(payload.canonical_goal_frame).toMatchObject({
      authoritative_zero_observation_typed_failure: true,
    });
    expect(payload.tool_call_admission_decision).toMatchObject({
      requested_capability: "situation_run",
      required_observation_kinds_for_requested_capability: [
        "visual_frame_evidence",
        "situation_context_pack",
        "visual_capture_coverage",
      ],
    });
    expect(payload.loop_parity_trace).toMatchObject({
      route_authority_ok: true,
      terminal_selection_ran_after_observations: true,
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      short_circuit_risk_flags: [],
    });
    expect(payload.ask_turn_solver_trace).toMatchObject({
      route_authority_ok: true,
      completed_solver_path: true,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      evidence_reentry: {
        required: false,
        completed: true,
        reason: "authoritative_typed_failure_no_observation",
      },
      followup_reasoning_gate: {
        required: false,
        completed: true,
        reason: "authoritative_typed_failure_no_observation",
        violation_codes: [],
      },
      final_arbitration: {
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        remaining_uncertainty: [],
      },
    });
    expect(payload.codex_parity_agent_spine_rail_table).toMatchObject({
      requested_capability: "situation_run",
      required_observation_kinds_for_requested_capability: [
        "visual_frame_evidence",
        "situation_context_pack",
        "visual_capture_coverage",
      ],
      observed_artifact_supports_requested_capability: false,
    });
  });

  it("does not reconcile an observed-tool path", () => {
    const payload = basePayload();
    (
      payload.loop_parity_trace as Record<string, unknown>
    ).observations_created = [
      {
        observation_id: "obs:1",
        source_kind: "tool_observation",
      },
    ];

    expect(
      reconcileAuthoritativeTypedFailureLifecycle({
        payload,
        turnId: "ask:test:post-tool-failure",
        promptText: "Use the observation and continue.",
        selectedTerminalArtifactKind: "typed_failure",
        finalAnswerSource: "typed_failure",
      }),
    ).toBe(false);
    expect(
      (
        payload.loop_parity_trace as {
          short_circuit_risk_flags: string[];
        }
      ).short_circuit_risk_flags,
    ).toContain("route_authority_missing");
  });
});
