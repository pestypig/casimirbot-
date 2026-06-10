import { describe, expect, it } from "vitest";

import {
  buildToolFollowupDecision,
  buildToolLifecycleTrace,
  refreshToolLifecycleRecords,
} from "../services/helix-ask/tool-lifecycle-trace";
import { buildArtifactQueryIndex } from "../services/helix-ask/artifact-query-index";

describe("Helix Ask tool lifecycle trace", () => {
  it("keeps pending multi-step tools in poll mode instead of terminalizing", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:pending",
        capability_family: "debug_export",
        requested_action: "chrome_extension.visual_capture",
        admission_status: "admitted",
      },
      runtime_tool_call: {
        tool_call_id: "tool:pending",
        capability_key: "chrome_extension.visual_capture",
        session_id: "session:5050",
        process_id: "5880",
        status: "running",
      },
      pending_server_request: {
        request_id: "request:pending",
        session_id: "session:5050",
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:pending",
        next_decision: "continue",
        requested_surface_satisfied: false,
      },
    };

    const trace = buildToolLifecycleTrace({ turnId: "ask:test:pending", payload });
    const followup = buildToolFollowupDecision({ turnId: "ask:test:pending", payload, trace });

    expect(trace.lifecycle_stage).toBe("polling");
    expect(trace.status).toBe("running");
    expect(trace.retry_recommendation).toBe("poll_same_tool");
    expect(trace.terminal_eligible).toBe(false);
    expect(trace.session_ref).toBe("session:5050");
    expect(trace.process_ref).toBe("5880");
    expect(followup.next_action).toBe("poll");
    expect(followup.terminal_blockers).toContain("tool_still_running");
  });

  it("classifies disappeared local servers as external-change failures", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:server-gone",
        capability_family: "debug_export",
        requested_action: "backend_api.debug_export",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:server-gone",
        capability_plan_id: "plan:server-gone",
        status: "failed",
        receipt_refs: [],
        evidence_refs: [],
        selected_for_answer: false,
        reentered_solver: false,
        failure_reason: "server unavailable: no listener on port 5050",
        assistant_answer: false,
        raw_content_included: false,
      },
    };

    const trace = buildToolLifecycleTrace({ turnId: "ask:test:server-gone", payload });
    const followup = buildToolFollowupDecision({ turnId: "ask:test:server-gone", payload, trace });

    expect(trace.lifecycle_stage).toBe("failed");
    expect(trace.status).toBe("failed");
    expect(trace.retry_recommendation).toBe("stop_external_change_required");
    expect(followup.next_action).toBe("terminal_failure");
    expect(followup.external_change_required).toBe(true);
  });

  it("blocks diagnostic fallbacks from becoming terminal answers", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:fallback",
        capability_family: "repo_evidence",
        requested_action: "repo-code.search_concept",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:fallback",
        capability_plan_id: "plan:fallback",
        status: "succeeded",
        receipt_refs: ["receipt:fallback"],
        evidence_refs: ["evidence:fallback"],
        selected_for_answer: false,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:fallback",
        required_surface: "chrome_extension_localhost_5050_tab",
        requested_surface_satisfied: false,
        fallback_used: true,
        fallback_equivalent: false,
        remaining_surface_blocker: "required_surface_not_satisfied:chrome_extension_localhost_5050_tab",
        next_decision: "continue",
        evidence_refs: ["evidence:fallback"],
      },
      capability_lifecycle_ledger: {
        schema: "helix.capability_lifecycle_ledger.v1",
        turn_id: "ask:test:fallback",
        ok: true,
        failure_codes: [],
      },
    };

    const trace = buildToolLifecycleTrace({ turnId: "ask:test:fallback", payload });
    const followup = buildToolFollowupDecision({ turnId: "ask:test:fallback", payload, trace });

    expect(trace.lifecycle_stage).toBe("reentered_solver");
    expect(trace.terminal_eligible).toBe(false);
    expect(trace.retry_recommendation).toBe("try_alternate_probe");
    expect(followup.next_action).toBe("alternate_probe");
    expect(followup.terminal_blockers).toContain("required_surface_not_satisfied:chrome_extension_localhost_5050_tab");
  });

  it("allows terminal answer only after calculator evidence re-enters the solver", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:calculator",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:calculator",
        capability_plan_id: "plan:calculator",
        status: "succeeded",
        receipt_refs: ["calculator_receipt:1"],
        evidence_refs: ["calculator_validation:1"],
        selected_for_answer: true,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:calculator",
        requested_surface_satisfied: true,
        next_decision: "allow_terminal",
        evidence_refs: ["calculator_validation:1"],
      },
      capability_lifecycle_ledger: {
        schema: "helix.capability_lifecycle_ledger.v1",
        turn_id: "ask:test:calculator",
        ok: true,
        failure_codes: [],
      },
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:calculator", payload });

    expect(payload.tool_lifecycle_trace).toMatchObject({
      lifecycle_stage: "reentered_solver",
      status: "completed",
      tool_family: "calculator",
      terminal_eligible: true,
      retry_recommendation: "allow_terminal",
      assistant_answer: false,
    });
    expect(payload.tool_followup_decision).toMatchObject({
      next_action: "terminal_answer",
      evidence_reentered: true,
      assistant_answer: false,
    });
  });

  it("indexes queryable artifacts against the tool-family contract without creating answer authority", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:calculator-index",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:calculator-index",
        capability_plan_id: "plan:calculator-index",
        status: "succeeded",
        receipt_refs: ["calculator_receipt:1"],
        evidence_refs: ["calculator_validation:1"],
        selected_for_answer: true,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:calculator-index",
        requested_surface_satisfied: true,
        next_decision: "allow_terminal",
        evidence_refs: ["calculator_validation:1"],
      },
      capability_lifecycle_ledger: {
        schema: "helix.capability_lifecycle_ledger.v1",
        turn_id: "ask:test:calculator-index",
        ok: true,
        failure_codes: [],
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "calculator_receipt:1",
          kind: "calculator_receipt",
          payload: {
            schema: "helix.calculator_receipt.v1",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "calculation_trace:1",
          kind: "calculation_trace",
          payload: {
            schema: "helix.calculation_trace.v1",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "calculator_validation:1",
          kind: "calculator_validation",
          payload: {
            schema: "helix.calculator_validation.v1",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:calculator-index", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:calculator-index", payload });

    expect(index).toMatchObject({
      schema: "helix.artifact_query_index.v1",
      tool_family: "calculator",
      capability: "scientific-calculator.solve_expression",
      artifact_count: 3,
      assistant_answer: false,
      raw_content_included: false,
      reentry_status: {
        evidence_reentered: true,
        followup_next_action: "terminal_answer",
        terminal_use_allowed: true,
      },
    });
    expect(index.missing_required_observation_kinds).toEqual([]);
    expect(index.queryable_artifact_keys).toEqual(
      expect.arrayContaining(["calculator_receipt:1", "calculation_trace:1", "calculator_validation:1"]),
    );
  });

  it("reports missing contract observations for incomplete tool evidence", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:calculator-index-missing",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "calculator_receipt:only",
          kind: "calculator_receipt",
          payload: {
            schema: "helix.calculator_receipt.v1",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:calculator-index-missing", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:calculator-index-missing", payload });

    expect(index.missing_required_observation_kinds).toEqual(
      expect.arrayContaining(["calculation_trace", "calculator_validation"]),
    );
    expect(index.reentry_status).toMatchObject({
      evidence_reentered: false,
      terminal_use_allowed: false,
    });
    expect(index.assistant_answer).toBe(false);
  });

  it("keeps contextual tool mentions as follow-up reasoning, not execution", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:contextual",
        capability_family: "workstation_action",
        requested_action: "click.start",
        admission_status: "rejected",
        rejection_reason: "contextual_tool_reference_suppressed",
        tool_admission_suppressed: true,
        suppression_reason: "screen_visible_tool_word_not_operator_command",
      },
    };

    const trace = buildToolLifecycleTrace({ turnId: "ask:test:contextual", payload });
    const followup = buildToolFollowupDecision({ turnId: "ask:test:contextual", payload, trace });

    expect(trace.lifecycle_stage).toBe("blocked");
    expect(trace.status).toBe("blocked");
    expect(trace.executed_capability).toBeNull();
    expect(trace.terminal_eligible).toBe(false);
    expect(followup.next_action).toBe("continue_reasoning");
    expect(followup.assistant_answer).toBe(false);
  });
});
