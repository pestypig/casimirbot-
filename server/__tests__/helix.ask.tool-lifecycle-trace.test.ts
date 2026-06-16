import { describe, expect, it } from "vitest";

import {
  buildToolFollowupDecision,
  buildToolLifecycleTrace,
  refreshToolLifecycleRecords,
} from "../services/helix-ask/tool-lifecycle-trace";
import { buildArtifactQueryIndex } from "../services/helix-ask/artifact-query-index";
import { resolveToolFamilyContract } from "../services/helix-ask/tool-family-contract";

describe("Helix Ask tool lifecycle trace", () => {
  it("recognizes docs-viewer summarize_doc observation contract", () => {
    const contract = resolveToolFamilyContract({
      toolName: "docs-viewer.summarize_doc",
      toolFamily: "docs_viewer",
    });

    expect(contract).toMatchObject({
      toolFamily: "docs_viewer",
      toolName: "docs-viewer.summarize_doc",
      requiredObservationKinds: ["observation_review"],
      requiredReentry: true,
    });
    expect(contract?.allowedTerminalKinds).toEqual(expect.arrayContaining(["doc_summary"]));
  });

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
      runtime_tool_call: {
        tool_call_id: "tool:calculator-index",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      capability_lifecycle_ledger: {
        schema: "helix.capability_lifecycle_ledger.v1",
        turn_id: "ask:test:calculator-index",
        ok: true,
        failure_codes: [],
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:calculator-index:final_answer_draft",
        support_refs: [
          "calculator_receipt:1",
          "calculator_result_trace:1",
          "calculator_result_validation:1",
        ],
      },
      terminal_artifact_kind: "calculator_stream_result",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "calculator_stream_result",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "calculator_stream_result",
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
          artifact_id: "calculator_result_trace:1",
          kind: "calculator_result_trace",
          payload: {
            schema: "helix.calculator_result_trace.v1",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "calculator_result_validation:1",
          kind: "calculator_result_validation",
          payload: {
            schema: "helix.calculator_result_validation.v1",
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
      expect.arrayContaining(["calculator_receipt:1", "calculator_result_trace:1", "calculator_result_validation:1"]),
    );
    expect(index.tool_turn_chain_audit).toMatchObject({
      schema: "helix.tool_turn_chain_audit.v1",
      route_family: "calculator",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      observation_artifact_kind: "calculator_receipt",
      required_terminal_kind: "calculator_stream_result",
      expected_reentry_capability: "model.direct_answer",
      reentry_executed: true,
      final_answer_draft_ref: "ask:test:calculator-index:final_answer_draft",
      support_refs_count: 3,
      materialized_terminal_artifact_kind: "calculator_stream_result",
      terminal_authority_kind: "calculator_stream_result",
      visible_terminal_kind: "calculator_stream_result",
      rail_status: "complete",
      rail_failure_code: null,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      schema: "helix.tool_rail_failure_triage.v1",
      route_family: "calculator",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      did_tool_run: true,
      observation_ref: "calculator_receipt:1",
      reentry_executed: true,
      first_broken_rail: null,
      failure_bucket: null,
      rail_status: "complete",
      rail_failure_code: null,
      repair_target: null,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(index.tool_turn_chain_family_matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ route_family: "docs_viewer" }),
        expect.objectContaining({ route_family: "repo_code" }),
        expect.objectContaining({ route_family: "live_env" }),
        expect.objectContaining({ route_family: "workspace_directory" }),
        expect.objectContaining({
          route_family: "calculator",
          observed: true,
          did_tool_run: true,
          artifact_produced: true,
          artifact_reentered: true,
          rail_status: "complete",
          rail_failure_code: null,
        }),
        expect.objectContaining({ route_family: "internet_search" }),
        expect.objectContaining({ route_family: "image_lens / visual_capture" }),
      ]),
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
      runtime_tool_call: {
        tool_call_id: "tool:calculator-index-missing",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
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
      expect.arrayContaining(["calculator_result_trace", "calculator_result_validation"]),
    );
    expect(index.reentry_status).toMatchObject({
      evidence_reentered: true,
      terminal_use_allowed: false,
    });
    expect(index.tool_turn_chain_audit).toMatchObject({
      route_family: "calculator",
      rail_status: "broken",
      rail_failure_code: "observation_missing",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "observation_artifact",
      failure_bucket: "B_tool_executed_observation_missing",
      repair_target: "observation_materializer",
    });
    expect(index.assistant_answer).toBe(false);
  });

  it("does not count route selection as progress without execution and observation", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:planned-not-run",
        capability_family: "workspace_directory",
        requested_action: "workspace-directory.resolve",
        admission_status: "admitted",
      },
      current_turn_artifact_ledger: [],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:planned-not-run", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:planned-not-run", payload });

    expect(index.tool_rail_failure_triage).toMatchObject({
      route_family: "workspace_directory",
      selected_capability: "workspace-directory.resolve",
      executed_capability: null,
      did_tool_run: false,
      observation_ref: null,
      first_broken_rail: "capability_execution",
      failure_bucket: "A_tool_did_not_execute",
      repair_target: "tool_execution",
    });
  });

  it("does not count a policy-rejected runtime tool call as execution", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:calculator-policy-rejected",
        capability_family: "debug_export",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      runtime_tool_call: {
        tool_call_id: "tool:calculator-policy-rejected",
        capability_key: "scientific-calculator.solve_expression",
        status: "rejected",
      },
      terminal_artifact_kind: "typed_failure",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "runtime_tool_call:calculator-policy-rejected",
          kind: "runtime_tool_call",
          payload: {
            schema: "helix.runtime_tool_call.v1",
            capability_key: "scientific-calculator.solve_expression",
          },
        },
        {
          artifact_id: "runtime_tool_observation:calculator-policy-rejected",
          kind: "runtime_tool_observation",
          payload: {
            schema: "helix.runtime_tool_observation.v1",
            summary:
              "Runtime tool call rejected before execution: runtime_capability_not_admitted_by_tool_policy:scientific-calculator.solve_expression:calculator|workstation_action, runtime_tool_forbidden_by_tool_policy:scientific-calculator.solve_expression.",
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:calculator-policy-rejected", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:calculator-policy-rejected", payload });

    expect(index).toMatchObject({
      tool_family: "calculator",
      capability: "scientific-calculator.solve_expression",
      missing_required_observation_kinds: expect.arrayContaining([
        "calculator_receipt",
        "calculator_result_trace",
        "calculator_result_validation",
      ]),
    });
    expect(index.tool_turn_chain_audit).toMatchObject({
      route_family: "calculator",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: null,
      policy_rejection_ref: "runtime_tool_observation:calculator-policy-rejected",
      observation_ref: null,
      materialized_terminal_artifact_kind: "typed_failure",
      terminal_authority_kind: "typed_failure",
      visible_terminal_kind: "typed_failure",
      rail_status: "fail_closed",
      rail_failure_code: "tool_execution_rejected",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      route_family: "calculator",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: null,
      did_tool_run: false,
      observation_ref: null,
      first_broken_rail: "capability_execution",
      failure_bucket: "A_tool_did_not_execute",
      repair_target: "tool_admission",
      rail_status: "fail_closed",
      rail_failure_code: "tool_execution_rejected",
    });
    expect(index.tool_turn_chain_family_matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route_family: "calculator",
          observed: true,
          did_tool_run: false,
          artifact_produced: false,
          rail_status: "fail_closed",
          rail_failure_code: "tool_execution_rejected",
        }),
      ]),
    );
  });

  it("classifies internet search provider key failures as config_missing", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:internet-config-missing",
        capability_family: "internet_search",
        requested_action: "internet_search.web_research",
        admission_status: "admitted",
      },
      terminal_error_code: "internet_search_config_missing",
      selected_final_answer: "Internet search is unavailable because Tavily, Exa, or Google CSE API keys are missing.",
      terminal_artifact_kind: "typed_failure",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
      },
      current_turn_artifact_ledger: [],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:internet-config-missing", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:internet-config-missing", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      route_family: "internet_search",
      selected_capability: "internet_search.web_research",
      executed_capability: null,
      observation_ref: null,
      materialized_terminal_artifact_kind: "typed_failure",
      terminal_authority_kind: "typed_failure",
      visible_terminal_kind: "typed_failure",
      rail_status: "fail_closed",
      rail_failure_code: "config_missing",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "config",
      failure_bucket: "G_config_missing",
      repair_target: "operator_config",
      rail_status: "fail_closed",
      rail_failure_code: "config_missing",
    });
    expect(index.tool_turn_chain_family_matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route_family: "internet_search",
          observed: true,
          did_tool_run: false,
          artifact_produced: false,
          rail_status: "fail_closed",
          rail_failure_code: "config_missing",
        }),
      ]),
    );
  });

  it("classifies calculator terminal projection mismatch as presenter_boundary", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:calculator-projection-mismatch",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:calculator-projection-mismatch",
        status: "succeeded",
        receipt_refs: ["calculator_receipt:projection"],
        evidence_refs: ["calculator_result_validation:projection"],
        selected_for_answer: true,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:calculator-projection-mismatch",
        requested_surface_satisfied: true,
        next_decision: "allow_terminal",
      },
      runtime_tool_call: {
        tool_call_id: "tool:calculator-projection-mismatch",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:calculator-projection-mismatch:final_answer_draft",
        support_refs: [
          "calculator_receipt:projection",
          "calculator_result_trace:projection",
          "calculator_result_validation:projection",
        ],
      },
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "typed_failure",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: [
        { artifact_id: "calculator_receipt:projection", kind: "calculator_receipt", payload: { schema: "helix.calculator_receipt.v1" } },
        { artifact_id: "calculator_result_trace:projection", kind: "calculator_result_trace", payload: { schema: "helix.calculator_result_trace.v1" } },
        { artifact_id: "calculator_result_validation:projection", kind: "calculator_result_validation", payload: { schema: "helix.calculator_result_validation.v1" } },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:calculator-projection-mismatch", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:calculator-projection-mismatch", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      rail_status: "broken",
      rail_failure_code: "terminal_projection_mismatch",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "visible_projection",
      failure_bucket: "F_terminal_projection_mismatch",
      repair_target: "presenter_boundary",
    });
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
