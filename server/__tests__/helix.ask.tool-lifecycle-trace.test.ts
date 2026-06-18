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
      terminal_eligible: false,
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
      terminal_eligible: false,
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
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      requested_capability: null,
      selected_capability: "scientific-calculator.solve_expression",
      admitted_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      observation_kind: "calculator_receipt",
      observation_ref: "calculator_receipt:1",
      reentry_status: "reentered",
      required_terminal_kind: "calculator_stream_result",
      selected_terminal_kind: "calculator_stream_result",
      visible_terminal_kind: "calculator_stream_result",
      first_broken_rail: null,
      repair_target: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(index.codex_parity_agent_spine_rail_table.normalized_codex_parity_classes).toEqual([
      "complete",
      "tool_surface_missing",
      "explicit_capability_demoted",
      "tool_admission_rejected",
      "selected_not_executed",
      "observation_missing",
      "observation_not_reentered",
      "goal_contract_mismatch",
      "terminal_product_not_allowed",
      "terminal_authority_mismatch",
      "visible_projection_mismatch",
      "debug_mirror_stale",
      "provider_config_missing",
    ]);
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

  it("does not report observation_missing after a calculator workstation terminal chain completes", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "calculator_stream",
        allowed_terminal_artifact_kinds: ["workstation_tool_evaluation", "typed_failure"],
        required_terminal_kinds: ["workstation_tool_evaluation"],
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:calculator-workstation-terminal",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      runtime_tool_call: {
        tool_call_id: "tool:calculator-workstation-terminal",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      selected_final_answer: "Calculator verification plan completed.\nExpression: ((sqrt(81)+ln(e^3))*7-5^2)/2\nResult: 29.5",
      final_answer_source: "workstation_tool_evaluation",
      terminal_artifact_kind: "workstation_tool_evaluation",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        concise_text: "Calculator verification plan completed.\nExpression: ((sqrt(81)+ln(e^3))*7-5^2)/2\nResult: 29.5",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "workstation_tool_evaluation",
        terminal_artifact_kind: "workstation_tool_evaluation",
        terminal_kind: "answer",
        terminal_text_preview:
          "Calculator verification plan completed.\nExpression: ((sqrt(81)+ln(e^3))*7-5^2)/2\nResult: 29.5",
        server_authoritative: true,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "calculator_receipt:1",
          kind: "calculator_receipt",
          payload: {
            schema: "helix.calculator_receipt.v1",
            expression: "((sqrt(81)+ln(e^3))*7-5^2)/2",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "workstation_tool_evaluation:1",
          kind: "workstation_tool_evaluation",
          payload: {
            schema: "helix.workstation_tool_evaluation.v1",
            supports_goal: true,
            summary: "Calculator-backed result: ((sqrt(81)+ln(e^3))*7-5^2)/2 = 29.5.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "final_answer_draft:1",
          kind: "final_answer_draft",
          payload: {
            schema: "helix.final_answer_draft.v1",
            text: "Calculator verification plan completed.\nExpression: ((sqrt(81)+ln(e^3))*7-5^2)/2\nResult: 29.5",
            support_refs: ["calculator_receipt:1", "workstation_tool_evaluation:1"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:calculator-workstation-terminal", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:calculator-workstation-terminal", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      route_family: "calculator",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      observation_artifact_kind: "calculator_receipt",
      required_terminal_kind: "workstation_tool_evaluation",
      reentry_executed: true,
      materialized_terminal_artifact_kind: "workstation_tool_evaluation",
      terminal_authority_kind: "workstation_tool_evaluation",
      visible_terminal_kind: "workstation_tool_evaluation",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: null,
      failure_bucket: null,
      rail_status: "complete",
      rail_failure_code: null,
      repair_target: null,
    });
  });

  it("prefers terminal authority over draft materializer when mirroring materialized terminal kind", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:terminal-authority-mirror",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      runtime_tool_call: {
        tool_call_id: "tool:terminal-authority-mirror",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        observation_refs: ["calculator_receipt:1", "calculator_result_trace:1", "calculator_result_validation:1"],
        evidence_refs: ["calculator_result_validation:1", "workstation_tool_evaluation:1"],
        lifecycle_stage: "reentered_solver",
        status: "succeeded",
        evidence_reentered: true,
      },
      canonical_goal_frame: {
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "workstation_tool_evaluation",
        terminal_artifact_kind: "workstation_tool_evaluation",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
      },
      final_answer_draft_selection: {
        schema: "helix.final_answer_draft_selection.v1",
        materialized_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "calculator_receipt:1",
          kind: "calculator_receipt",
          payload: {
            schema: "helix.calculator_receipt.v1",
            receipt_id: "calculator_receipt:1",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "workstation_tool_evaluation:1",
          kind: "workstation_tool_evaluation",
          payload: {
            schema: "helix.workstation_tool_evaluation.v1",
            evaluation_id: "workstation_tool_evaluation:1",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "calculator_result_trace:1",
          kind: "calculator_result_trace",
          payload: {
            schema: "helix.calculator_result_trace.v1",
            trace_id: "calculator_result_trace:1",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "calculator_result_validation:1",
          kind: "calculator_result_validation",
          payload: {
            schema: "helix.calculator_result_validation.v1",
            validation_id: "calculator_result_validation:1",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:terminal-authority-mirror", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      materialized_terminal_artifact_kind: "workstation_tool_evaluation",
      terminal_authority_kind: "workstation_tool_evaluation",
      visible_terminal_kind: "workstation_tool_evaluation",
      rail_status: "broken",
      rail_failure_code: "debug_mirror_stale",
      stale_terminal_debug_mirrors: [
        {
          source: "final_answer_draft_selection.materialized_terminal_artifact_kind",
          terminal_kind: "model_synthesized_answer",
        },
      ],
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_terminal_kind: "workstation_tool_evaluation",
      visible_terminal_kind: "workstation_tool_evaluation",
      first_broken_rail: "visible_projection",
      repair_target: "presenter_boundary",
      codex_parity_class: "debug_mirror_stale",
      rail_failure_code: "debug_mirror_stale",
    });
  });

  it("classifies contextual no-tool suppression as a complete model-only rail, not tool drift", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:suppressed-model-only",
        capability_family: "model_only",
        requested_action: "suppressed_contextual_tool_reference",
        selected_capability: "suppressed_contextual_tool_reference",
        admission_status: "rejected",
        rejection_reason: "contextual_tool_reference_suppressed",
        tool_admission_suppressed: true,
        capability_contract_arbitration: {
          schema: "helix.ask_capability_contract_arbitration.v1",
          contract_state: "suppressed_contextual_reference",
          selected_source_target: "model_only",
          selected_plan_family: "model_only",
          canonical_goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      operational_capability_trace: {
        schema: "helix.operational_capability_trace.v1",
        executed_capability: "model.direct_answer",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            executed_action_key: null,
            stop_reason: "terminal_satisfied",
            satisfaction: "satisfied",
          },
        ],
        executed_tool_call_count: 0,
        stop_reason: "terminal_satisfied",
      },
      final_answer_source: "model_direct_answer",
      terminal_artifact_kind: "direct_answer_text",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "model_direct_answer",
        terminal_artifact_kind: "direct_answer_text",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "direct_answer_text",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "reasoning_context:1",
          kind: "reasoning_context",
          payload: {
            schema: "helix.reasoning_context.v1",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "direct_answer_text:1",
          kind: "direct_answer_text",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "Receipts are observations, not terminal answers.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "final_answer_draft:1",
          kind: "final_answer_draft",
          payload: {
            schema: "helix.final_answer_draft.v1",
            support_refs: ["reasoning_context:1", "direct_answer_text:1"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:suppressed-model-only", payload });
    (payload.tool_lifecycle_trace as Record<string, unknown>).executed_capability = "model.direct_answer";
    const index = buildArtifactQueryIndex({ turnId: "ask:test:suppressed-model-only", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      route_family: "model_only",
      selected_capability: "suppressed_contextual_tool_reference",
      executed_capability: null,
      required_terminal_kind: "direct_answer_text",
      materialized_terminal_artifact_kind: "direct_answer_text",
      terminal_authority_kind: "direct_answer_text",
      visible_terminal_kind: "direct_answer_text",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      selected_capability: "suppressed_contextual_tool_reference",
      executed_capability: null,
      did_tool_run: false,
      first_broken_rail: null,
      failure_bucket: null,
      rail_status: "complete",
      rail_failure_code: null,
      repair_target: null,
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      requested_capability: null,
      selected_capability: "suppressed_contextual_tool_reference",
      admitted_capability: null,
      executed_capability: null,
      observation_kind: "reasoning_context",
      reentry_status: "reentered",
      required_terminal_kind: "direct_answer_text",
      selected_terminal_kind: "direct_answer_text",
      visible_terminal_kind: "direct_answer_text",
      first_broken_rail: null,
      repair_target: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("preserves executed docs tool capability when a later model answer performs synthesis", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "doc_evidence_synthesis",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: "ask:test:docs-locate-reentry",
        source_target: "docs_viewer",
        required: true,
        admitted_tool_families: ["docs_viewer"],
        capability_contract_guard_version: "E82",
        requested_capability: "docs-viewer.locate_in_doc",
        requested_capability_family: "docs_viewer",
        requested_capability_source: "explicit_user_command",
        requested_capability_confidence: 0.99,
        required_observation_kinds_for_requested_capability: [
          "doc_location_result",
          "doc_location_matches",
          "doc_evidence_location",
        ],
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:docs-locate-reentry",
        capability_family: "docs_viewer",
        requested_action: "docs-viewer.locate_in_doc",
        selected_capability: "docs-viewer.locate_in_doc",
        requested_capability: "docs-viewer.locate_in_doc",
        admission_status: "admitted",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      operational_capability_trace: {
        schema: "helix.operational_capability_trace.v1",
        executed_capability: "model.direct_answer",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            next_step: "next_action",
            chosen_capability: "docs-viewer.locate_in_doc",
            executed_action_key: "docs-viewer.locate_in_doc",
            satisfaction: "satisfied",
            observed_artifact_refs: ["doc_location_matches:1"],
          },
          {
            iteration: 2,
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            executed_action_key: null,
            satisfaction: "satisfied",
            stop_reason: "terminal_satisfied",
          },
        ],
        executed_tool_call_count: 1,
        stop_reason: "terminal_satisfied",
      },
      final_answer_source: "final_answer_draft",
      terminal_artifact_kind: "doc_evidence_synthesis_answer",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "final_answer_draft",
        terminal_artifact_kind: "doc_evidence_synthesis_answer",
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "doc_evidence_synthesis_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc_location_matches:1",
          kind: "doc_location_matches",
          payload: {
            schema: "helix.doc_location_matches.v1",
            document_path: "docs/helix-ask-codex-loop-discipline.md",
            matches: [{ line: 216, text: "Routes choose procedures." }],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "final_answer_draft:docs-locate",
          kind: "final_answer_draft",
          payload: {
            schema: "helix.final_answer_draft.v1",
            support_refs: ["doc_location_matches:1"],
            artifact_refs: ["doc_location_matches:1"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:docs-locate-reentry", payload });
    (payload.tool_lifecycle_trace as Record<string, unknown>).executed_capability = "model.direct_answer";
    const index = buildArtifactQueryIndex({ turnId: "ask:test:docs-locate-reentry", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      capability_contract_guard_version: "E82",
      requested_capability: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.locate_in_doc",
      executed_capability: "docs-viewer.locate_in_doc",
      requested_selected_match: true,
      selected_executed_match: true,
      observation_artifact_kind: "doc_location_matches",
      required_terminal_kind: "doc_evidence_synthesis_answer",
      materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      terminal_authority_kind: "doc_evidence_synthesis_answer",
      visible_terminal_kind: "doc_evidence_synthesis_answer",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      requested_capability: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.locate_in_doc",
      executed_capability: "docs-viewer.locate_in_doc",
      did_tool_run: true,
      first_broken_rail: null,
      failure_bucket: null,
      rail_status: "complete",
      rail_failure_code: null,
      repair_target: null,
    });
  });

  it("does not report observation_missing when docs locate observed matches but terminal authority failed closed", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "doc_evidence_synthesis",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: "ask:test:docs-locate-terminal-failed-later",
        source_target: "docs_viewer",
        required: true,
        admitted_tool_families: ["docs_viewer"],
        requested_capability: "docs-viewer.locate_in_doc",
        requested_capability_family: "docs_viewer",
        requested_capability_source: "explicit_user_command",
        requested_capability_confidence: 0.99,
        required_observation_kinds_for_requested_capability: [
          "doc_location_result",
          "doc_location_matches",
          "doc_evidence_location",
        ],
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:docs-locate-terminal-failed-later",
        capability_family: "docs",
        requested_action: "docs-viewer.locate_in_doc",
        selected_capability: "docs-viewer.locate_in_doc",
        requested_capability: "docs-viewer.locate_in_doc",
        admission_status: "admitted",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            next_step: "next_action",
            chosen_capability: "docs-viewer.locate_in_doc",
            executed_action_key: "docs-viewer.locate_in_doc",
            satisfaction: "satisfied",
            observed_artifact_refs: ["doc_location_matches:1"],
          },
          {
            iteration: 2,
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            executed_action_key: null,
            satisfaction: "satisfied",
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "typed_failure",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc_location_matches:1",
          kind: "doc_location_matches",
          payload: {
            schema: "helix.doc_location_matches.v1",
            document_path: "docs/helix-ask-codex-loop-discipline.md",
            matches: [{ line: 216, text: "Routes choose procedures." }],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "final_answer_draft:docs-locate",
          kind: "final_answer_draft",
          payload: {
            schema: "helix.final_answer_draft.v1",
            support_refs: ["doc_location_matches:1"],
            artifact_refs: ["doc_location_matches:1"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:docs-locate-terminal-failed-later", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:docs-locate-terminal-failed-later", payload });

    expect(index.required_observation_coverage_mode).toBe("any");
    expect(index.missing_required_observation_kinds).toEqual([]);
    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: "docs-viewer.locate_in_doc",
      executed_capability: "docs-viewer.locate_in_doc",
      observation_artifact_kind: "doc_location_matches",
      observed_artifact_supports_requested_capability: true,
      materialized_terminal_artifact_kind: "typed_failure",
      terminal_authority_kind: "typed_failure",
      visible_terminal_kind: "typed_failure",
      rail_status: "fail_closed",
      rail_failure_code: "terminal_not_materialized",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      requested_capability: "docs-viewer.locate_in_doc",
      executed_capability: "docs-viewer.locate_in_doc",
      first_broken_rail: "terminal_materialization",
      failure_bucket: "E_terminal_materializer_gap",
      rail_failure_code: "terminal_not_materialized",
      repair_target: "terminal_materializer",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      requested_capability: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.locate_in_doc",
      executed_capability: "docs-viewer.locate_in_doc",
      observation_kind: "doc_location_matches",
      goal_satisfaction: null,
      required_terminal_kind: "doc_evidence_synthesis_answer",
      selected_terminal_kind: "typed_failure",
      visible_terminal_kind: "typed_failure",
      first_broken_rail: "terminal_materialization",
      repair_target: "terminal_materializer",
      codex_parity_class: "goal_contract_mismatch",
    });
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
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      observation_kind: "calculator_receipt",
      reentry_status: "reentered",
      first_broken_rail: "observation_artifact",
      repair_target: "observation_materializer",
      codex_parity_class: "observation_missing",
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
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "workspace-directory.resolve",
      admitted_capability: "workspace-directory.resolve",
      executed_capability: null,
      observation_kind: null,
      reentry_status: "no_observation",
      first_broken_rail: "capability_execution",
      repair_target: "tool_execution",
      codex_parity_class: "selected_not_executed",
      rail_failure_code: "observation_missing",
    });
  });

  it("fails audit when a selected docs summary does not satisfy explicit locate_in_doc request", () => {
    const payload: Record<string, unknown> = {
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: "ask:test:wrong-docs-procedure",
        source_target: "docs_viewer",
        required: true,
        admitted_tool_families: ["docs_viewer"],
        capability_contract_guard_version: "E82",
        requested_capability: "docs-viewer.locate_in_doc",
        requested_capability_family: "docs_viewer",
        requested_capability_source: "explicit_user_command",
        requested_capability_confidence: 0.99,
        required_observation_kinds_for_requested_capability: [
          "doc_location_result",
          "doc_location_matches",
          "doc_evidence_location",
        ],
        forbidden_terminal_artifact_kinds: ["direct_answer_text"],
        forbidden_routes: ["model_only_concept"],
        reason: "docs_viewer_requires_document_tool_path+explicit_capability_contract_required",
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:wrong-docs-procedure",
        capability_family: "docs",
        requested_action: "docs-viewer.summarize_doc",
        selected_capability: "docs-viewer.summarize_doc",
        requested_capability: "docs-viewer.locate_in_doc",
        admission_status: "admitted",
      },
      runtime_tool_call: {
        tool_call_id: "tool:wrong-docs-procedure",
        capability_key: "docs-viewer.summarize_doc",
        status: "completed",
      },
      terminal_artifact_kind: "doc_summary",
      terminal_presentation: { terminal_artifact_kind: "doc_summary" },
      terminal_answer_authority: { terminal_artifact_kind: "doc_summary" },
      current_turn_artifact_ledger: [
        {
          artifact_id: "doc_summary:wrong",
          kind: "observation_review",
          payload: {
            schema: "helix.observation_review.v1",
            summary: "Summarized the document.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:wrong-docs-procedure", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:wrong-docs-procedure", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      capability_contract_guard_version: "E82",
      requested_capability: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.summarize_doc",
      requested_selected_match: false,
      rail_status: "broken",
      rail_failure_code: "explicit_capability_not_selected",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "route_admission",
      rail_failure_code: "explicit_capability_not_selected",
      repair_target: "intent_arbitration",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      requested_capability: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.summarize_doc",
      executed_capability: "docs-viewer.summarize_doc",
      first_broken_rail: "route_admission",
      repair_target: "intent_arbitration",
      codex_parity_class: "explicit_capability_demoted",
      rail_failure_code: "explicit_capability_not_selected",
    });
  });

  it("classifies repeated weak repo evidence as an evidence re-entry progress failure", () => {
    const payload: Record<string, unknown> = {
      terminal_error_code: "repo_evidence_weak_after_repair",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: "ask:test:weak-repo-loop",
        source_target: "repo_code",
        required: true,
        admitted_tool_families: ["repo_code"],
        capability_contract_guard_version: "E82",
        requested_capability: "repo-code.search_concept",
        requested_capability_family: "repo_code",
        requested_capability_source: "explicit_user_command",
        required_observation_kinds_for_requested_capability: [
          "repo_code_evidence_observation",
          "repo_evidence_relevance_gate",
        ],
        forbidden_terminal_artifact_kinds: ["direct_answer_text"],
        forbidden_routes: ["model_only_concept"],
        reason: "repo_code_requires_repo_evidence_path+explicit_capability_contract_required",
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:weak-repo-loop",
        capability_family: "repo_evidence",
        requested_action: "repo-code.search_concept",
        selected_capability: "repo-code.search_concept",
        requested_capability: "repo-code.search_concept",
        admission_status: "needs_evidence",
      },
      runtime_tool_call: {
        tool_call_id: "tool:weak-repo-loop",
        capability_key: "repo-code.search_concept",
        status: "completed",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "repo_obs:weak",
          kind: "repo_code_evidence_observation",
          payload: {
            schema: "helix.repo_code_evidence_observation.v1",
            concept: "terminal authority",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "repo_gate:weak",
          kind: "repo_evidence_relevance_gate",
          payload: {
            schema: "helix.repo_evidence_relevance_gate.v1",
            repair_required: true,
            terminal_allowed: false,
            coverage: "weak",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "typed_failure:weak",
          kind: "typed_failure",
          payload: {
            schema: "helix.typed_failure.v1",
            error_code: "repo_evidence_weak_after_repair",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:weak-repo-loop", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:weak-repo-loop", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      requested_capability: "repo-code.search_concept",
      selected_capability: "repo-code.search_concept",
      executed_capability: "repo-code.search_concept",
      rail_status: "fail_closed",
      rail_failure_code: "weak_evidence_repair_loop",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "evidence_reentry",
      rail_failure_code: "weak_evidence_repair_loop",
      repair_target: "repo_retrieval_repair_policy",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      requested_capability: "repo-code.search_concept",
      selected_capability: "repo-code.search_concept",
      executed_capability: "repo-code.search_concept",
      first_broken_rail: "evidence_reentry",
      repair_target: "repo_retrieval_repair_policy",
      codex_parity_class: "observation_not_reentered",
      rail_failure_code: "weak_evidence_repair_loop",
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
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: null,
      observation_kind: null,
      observation_ref: null,
      reentry_status: "no_observation",
      required_terminal_kind: expect.any(String),
      selected_terminal_kind: "typed_failure",
      visible_terminal_kind: "typed_failure",
      first_broken_rail: "capability_execution",
      repair_target: "tool_admission",
      codex_parity_class: "tool_admission_rejected",
      rail_status: "fail_closed",
      rail_failure_code: "tool_execution_rejected",
      assistant_answer: false,
      raw_content_included: false,
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
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "internet_search.web_research",
      executed_capability: null,
      first_broken_rail: "config",
      repair_target: "operator_config",
      codex_parity_class: "provider_config_missing",
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
      rail_status: "fail_closed",
      rail_failure_code: "terminal_projection_mismatch",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "visible_projection",
      failure_bucket: "F_terminal_projection_mismatch",
      repair_target: "presenter_boundary",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      first_broken_rail: "visible_projection",
      repair_target: "presenter_boundary",
      codex_parity_class: "visible_projection_mismatch",
      rail_failure_code: "terminal_projection_mismatch",
    });
  });

  it("reports a missing terminal authority writer as a terminal authority mismatch", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:terminal-authority-missing",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:terminal-authority-missing",
        status: "succeeded",
        receipt_refs: ["calculator_receipt:authority"],
        evidence_refs: ["calculator_result_validation:authority"],
        selected_for_answer: true,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:terminal-authority-missing",
        requested_surface_satisfied: true,
        next_decision: "allow_terminal",
      },
      runtime_tool_call: {
        tool_call_id: "tool:terminal-authority-missing",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:terminal-authority-missing:final_answer_draft",
        support_refs: [
          "calculator_receipt:authority",
          "calculator_result_trace:authority",
          "calculator_result_validation:authority",
        ],
      },
      terminal_artifact_kind: "calculator_stream_result",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "calculator_stream_result",
      },
      current_turn_artifact_ledger: [
        { artifact_id: "calculator_receipt:authority", kind: "calculator_receipt", payload: { schema: "helix.calculator_receipt.v1" } },
        { artifact_id: "calculator_result_trace:authority", kind: "calculator_result_trace", payload: { schema: "helix.calculator_result_trace.v1" } },
        { artifact_id: "calculator_result_validation:authority", kind: "calculator_result_validation", payload: { schema: "helix.calculator_result_validation.v1" } },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:terminal-authority-missing", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:terminal-authority-missing", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      materialized_terminal_artifact_kind: "calculator_stream_result",
      terminal_authority_kind: null,
      visible_terminal_kind: "calculator_stream_result",
      rail_status: "broken",
      rail_failure_code: "terminal_authority_missing",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "terminal_authority",
      repair_target: "terminal_authority",
      rail_failure_code: "terminal_authority_missing",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_terminal_kind: null,
      visible_terminal_kind: "calculator_stream_result",
      first_broken_rail: "terminal_authority",
      repair_target: "terminal_authority",
      codex_parity_class: "terminal_authority_mismatch",
      rail_failure_code: "terminal_authority_missing",
    });
  });

  it("classifies a materialized terminal product that violates the route contract", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "calculator_stream_result",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:terminal-product-mismatch",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:terminal-product-mismatch",
        status: "succeeded",
        receipt_refs: ["calculator_receipt:terminal-product"],
        evidence_refs: ["calculator_result_validation:terminal-product"],
        selected_for_answer: true,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      operational_satisfaction_evaluation: {
        schema: "helix.operational_satisfaction_evaluation.v1",
        turn_id: "ask:test:terminal-product-mismatch",
        requested_surface_satisfied: true,
        next_decision: "allow_terminal",
      },
      runtime_tool_call: {
        tool_call_id: "tool:terminal-product-mismatch",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:terminal-product-mismatch:final_answer_draft",
        support_refs: [
          "calculator_receipt:terminal-product",
          "calculator_result_trace:terminal-product",
          "calculator_result_validation:terminal-product",
        ],
      },
      terminal_artifact_kind: "doc_summary",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "doc_summary",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "doc_summary",
      },
      current_turn_artifact_ledger: [
        { artifact_id: "calculator_receipt:terminal-product", kind: "calculator_receipt", payload: { schema: "helix.calculator_receipt.v1" } },
        { artifact_id: "calculator_result_trace:terminal-product", kind: "calculator_result_trace", payload: { schema: "helix.calculator_result_trace.v1" } },
        { artifact_id: "calculator_result_validation:terminal-product", kind: "calculator_result_validation", payload: { schema: "helix.calculator_result_validation.v1" } },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:terminal-product-mismatch", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:terminal-product-mismatch", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      required_terminal_kind: "calculator_stream_result",
      materialized_terminal_artifact_kind: "doc_summary",
      terminal_authority_kind: "doc_summary",
      visible_terminal_kind: "doc_summary",
      rail_status: "broken",
      rail_failure_code: "terminal_product_mismatch",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      required_terminal_kind: "calculator_stream_result",
      selected_terminal_kind: "doc_summary",
      visible_terminal_kind: "doc_summary",
      first_broken_rail: "terminal_materialization",
      repair_target: "terminal_materializer",
      codex_parity_class: "terminal_product_not_allowed",
      rail_failure_code: "terminal_product_mismatch",
    });
  });

  it("classifies unsupported terminal drafts as goal contract mismatches", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "calculator_solve",
        required_terminal_kind: "calculator_stream_result",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:support-refs-missing",
        capability_family: "calculator",
        requested_action: "scientific-calculator.solve_expression",
        admission_status: "admitted",
      },
      capability_result: {
        schema: "helix.capability_result.v1",
        turn_id: "ask:test:support-refs-missing",
        status: "succeeded",
        receipt_refs: ["calculator_receipt:support-missing"],
        evidence_refs: ["calculator_result_validation:support-missing"],
        selected_for_answer: true,
        reentered_solver: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: "scientific-calculator.solve_expression",
        admitted_capability: "scientific-calculator.solve_expression",
        executed_capability: "scientific-calculator.solve_expression",
        lifecycle_stage: "reentered_solver",
        status: "completed",
        observation_refs: ["calculator_receipt:support-missing"],
        evidence_refs: ["calculator_result_validation:support-missing"],
      },
      runtime_tool_call: {
        tool_call_id: "tool:support-refs-missing",
        capability_key: "scientific-calculator.solve_expression",
        status: "completed",
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:support-refs-missing:final_answer_draft",
        support_refs: [],
      },
      terminal_artifact_kind: "calculator_stream_result",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "calculator_stream_result",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "calculator_stream_result",
      },
      current_turn_artifact_ledger: [
        { artifact_id: "calculator_receipt:support-missing", kind: "calculator_receipt", payload: { schema: "helix.calculator_receipt.v1" } },
        { artifact_id: "calculator_result_trace:support-missing", kind: "calculator_result_trace", payload: { schema: "helix.calculator_result_trace.v1" } },
        { artifact_id: "calculator_result_validation:support-missing", kind: "calculator_result_validation", payload: { schema: "helix.calculator_result_validation.v1" } },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:support-refs-missing", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:support-refs-missing", payload });

    expect(index.tool_turn_chain_audit).toMatchObject({
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      reentry_executed: true,
      final_answer_draft_ref: "ask:test:support-refs-missing:final_answer_draft",
      support_refs_count: 0,
      rail_status: "broken",
      rail_failure_code: "support_refs_missing",
    });
    expect(index.tool_rail_failure_triage).toMatchObject({
      first_broken_rail: "support_backed_draft",
      repair_target: "draft_builder",
      rail_failure_code: "support_refs_missing",
    });
    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "scientific-calculator.solve_expression",
      executed_capability: "scientific-calculator.solve_expression",
      reentry_status: "reentered",
      first_broken_rail: "support_backed_draft",
      repair_target: "draft_builder",
      codex_parity_class: "goal_contract_mismatch",
      rail_failure_code: "support_refs_missing",
    });
  });

  it("surfaces a missing visible capability surface before treating selected capability as progress", () => {
    const payload: Record<string, unknown> = {
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:tool-surface-missing",
        capability_family: "docs",
        requested_action: "docs-viewer.locate_in_doc",
        selected_capability: "docs-viewer.locate_in_doc",
        requested_capability: "docs-viewer.locate_in_doc",
        requested_capability_source: "explicit_user_command",
        admission_status: "admitted",
      },
      current_turn_artifact_ledger: [],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:tool-surface-missing", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:tool-surface-missing", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      requested_capability: "docs-viewer.locate_in_doc",
      visible_tool_surface: [],
      selected_capability: "docs-viewer.locate_in_doc",
      executed_capability: null,
      first_broken_rail: "capability_execution",
      codex_parity_class: "tool_surface_missing",
    });
  });

  it("normalizes a completed workspace_os.status turn through the same rail table", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "workspace_status_diagnostic",
        required_terminal_kind: "model_synthesized_answer",
      },
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: "ask:test:workspace-os-status",
        source_target: "workspace_diagnostic",
        required: true,
        admitted_tool_families: ["workspace_diagnostic"],
        requested_capability: "workspace_os.status",
        requested_capability_family: "workspace_diagnostic",
        requested_capability_source: "explicit_user_command",
        required_observation_kinds_for_requested_capability: ["workspace_os_status_observation"],
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:workspace-os-status",
        capability_family: "workspace_diagnostic",
        requested_action: "workspace_os.status",
        selected_capability: "workspace_os.status",
        requested_capability: "workspace_os.status",
        admission_status: "admitted",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "workspace_os.status",
            executed_action_key: "workspace_os.status",
            observed_artifact_refs: ["workspace_os_status_observation:1"],
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:workspace-os-status:final_answer_draft",
        support_refs: ["workspace_os_status_observation:1"],
      },
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "workspace_os_status_observation:1",
          kind: "workspace_os_status_observation",
          payload: {
            schema: "helix.workspace_os_status_observation.v1",
            available_count: 18,
            blocked_count: 3,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:workspace-os-status", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:workspace-os-status", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      requested_capability: "workspace_os.status",
      selected_capability: "workspace_os.status",
      admitted_capability: "workspace_os.status",
      executed_capability: "workspace_os.status",
      observation_kind: "workspace_os_status_observation",
      observation_ref: "workspace_os_status_observation:1",
      reentry_status: "reentered",
      required_terminal_kind: "model_synthesized_answer",
      selected_terminal_kind: "model_synthesized_answer",
      visible_terminal_kind: "model_synthesized_answer",
      first_broken_rail: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
    });
  });

  it("normalizes a completed live-source mail read through the same rail table", () => {
    const payload: Record<string, unknown> = {
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "live_source_mailbox_review",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:live-mail-read",
        capability_family: "live_environment",
        requested_action: "live_env.read_processed_live_source_mail",
        selected_capability: "live_env.read_processed_live_source_mail",
        admission_status: "admitted",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "live_env.read_processed_live_source_mail",
            executed_action_key: "live_env.read_processed_live_source_mail",
            observed_artifact_refs: ["stage_play_processed_mail_packet:1"],
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:live-mail-read:final_answer_draft",
        support_refs: ["stage_play_processed_mail_packet:1"],
      },
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage_play_processed_mail_packet:1",
          kind: "stage_play_processed_mail_packet",
          producer_item_id: "live_env.read_processed_live_source_mail",
          payload: {
            schema: "stage_play_processed_mail_packet/v1",
            tool_name: "live_env.read_processed_live_source_mail",
            packet_id: "stage_play_processed_mail_packet:1",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:live-mail-read", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:live-mail-read", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      selected_capability: "live_env.read_processed_live_source_mail",
      admitted_capability: "live_env.read_processed_live_source_mail",
      executed_capability: "live_env.read_processed_live_source_mail",
      observation_kind: "stage_play_processed_mail_packet",
      observation_ref: "stage_play_processed_mail_packet:1",
      reentry_status: "reentered",
      selected_terminal_kind: "model_synthesized_answer",
      visible_terminal_kind: "model_synthesized_answer",
      first_broken_rail: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.tool_turn_chain_family_matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route_family: "live_env",
          observed: true,
          did_tool_run: true,
          artifact_produced: true,
          rail_status: "complete",
        }),
      ]),
    );
  });

  it("normalizes workstation goal-context query artifacts as live-env capability evidence", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Inspect workstation goal context updates for the visual source.",
      tool_surface_packet: {
        schema: "helix.tool_surface_packet.v1",
        tools: [{ name: "live_env.query_workstation_goal_context" }],
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.query_workstation_goal_context",
        admitted_capability: "live_env.query_workstation_goal_context",
        decision: "admitted",
      },
      agent_step_decision: {
        next_step: "call_tool",
        chosen_capability: "live_env.query_workstation_goal_context",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "live_env.query_workstation_goal_context",
            executed_action_key: "live_env.query_workstation_goal_context",
            observed_artifact_refs: ["stage_play_workstation_goal_context_read_result:1"],
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:goal-context:final_answer_draft",
        support_refs: ["stage_play_workstation_goal_context_read_result:1"],
      },
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage_play_workstation_goal_context_read_result:1",
          kind: "stage_play_workstation_goal_context_read_result",
          producer_item_id: "live_env.query_workstation_goal_context",
          payload: {
            schema: "stage_play_workstation_goal_context_read_result/v1",
            tool_name: "live_env.query_workstation_goal_context",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:goal-context", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:goal-context", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      selected_capability: "live_env.query_workstation_goal_context",
      admitted_capability: "live_env.query_workstation_goal_context",
      executed_capability: "live_env.query_workstation_goal_context",
      observation_kind: "stage_play_workstation_goal_context_read_result",
      observation_ref: "stage_play_workstation_goal_context_read_result:1",
      reentry_status: "reentered",
      selected_terminal_kind: "model_synthesized_answer",
      first_broken_rail: null,
      rail_status: "complete",
      rail_failure_code: null,
    });
  });

  it("maps source health goal-context artifacts to the source health query tool", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Query source health before deciding what the workstation can monitor.",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.query_source_health",
        requested_capability_family: "live_source_mail",
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "helix.situation_source_capability_read:1",
          kind: "helix.situation_source_capability_read",
          producer_item_id: "live_env.query_source_health",
          payload: {
            schema: "helix.situation_source_capability_read.v1",
            tool_name: "live_env.query_source_health",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:source-health",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.query_source_health",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.query_source_health",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:source-health", payload });

    expect(index).toMatchObject({
      capability: "live_env.query_source_health",
      tool_family: "live_source_mail",
      tool_family_contract: {
        tool_name: "live_env.query_source_health",
        authority: "evidence_only",
        required_observation_kinds: [
          "helix.situation_source_capability_read",
          "helix.workstation_goal_context_update.v1",
        ],
      },
      missing_required_observation_kinds: [],
    });
  });

  it("maps trace-memory goal-context artifacts to the trace memory query tool", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Query trace memory for the last workstation reasoning trace.",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.query_trace_memory",
        requested_capability_family: "live_source_mail",
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "helix.workstation_reasoning_trace_query_result:1",
          kind: "helix.workstation_reasoning_trace_query_result",
          producer_item_id: "live_env.query_trace_memory",
          payload: {
            schema: "helix.workstation_reasoning_trace_query_result.v1",
            tool_name: "live_env.query_trace_memory",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:trace-memory",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.query_trace_memory",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.query_trace_memory",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:trace-memory", payload });

    expect(index).toMatchObject({
      capability: "live_env.query_trace_memory",
      tool_family: "live_source_mail",
      tool_family_contract: {
        tool_name: "live_env.query_trace_memory",
        authority: "evidence_only",
        required_observation_kinds: [
          "helix.workstation_reasoning_trace_query_result",
          "helix.workstation_goal_context_update.v1",
        ],
      },
      missing_required_observation_kinds: [],
    });
  });

  it("maps feed-specific goal-context artifacts to the selected workstation feed query tool", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Query translation segments for the active audio live source.",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.query_translation_segments",
        requested_capability_family: "live_source_mail",
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage_play_workstation_context_feed_query_result:translation",
          kind: "stage_play_workstation_context_feed_query_result",
          producer_item_id: "live_env.query_translation_segments",
          payload: {
            schema: "stage_play_workstation_context_feed_query_result/v1",
            tool_name: "live_env.query_translation_segments",
            feed_kind: "translated_transcripts",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:translation-feed",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.query_translation_segments",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.query_translation_segments",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:translation-feed", payload });

    expect(index).toMatchObject({
      capability: "live_env.query_translation_segments",
      tool_family: "live_source_mail",
      tool_family_contract: {
        tool_name: "live_env.query_translation_segments",
        authority: "evidence_only",
        required_observation_kinds: [
          "stage_play_workstation_context_feed_query_result",
          "helix.workstation_goal_context_update.v1",
        ],
      },
      missing_required_observation_kinds: [],
    });
  });

  it("maps route-evidence feed artifacts to the route-evidence query tool", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Show route-watch evidence for the active workstation goal.",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.query_route_evidence",
        requested_capability_family: "live_source_mail",
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage_play_workstation_context_feed_query_result:route-evidence",
          kind: "stage_play_workstation_context_feed_query_result",
          producer_item_id: "live_env.query_route_evidence",
          payload: {
            schema: "stage_play_workstation_context_feed_query_result/v1",
            tool_name: "live_env.query_route_evidence",
            feed_kind: "route_evidence",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:route-evidence-feed",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.query_route_evidence",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.query_route_evidence",
            producer_kind: "route_watch",
            update_kind: "route_evidence",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:automation-policy",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.query_route_evidence",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.query_route_evidence",
            producer_kind: "automation",
            update_kind: "automation_status",
            source_kind: "automation_policies",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:route-evidence-feed", payload });

    expect(index).toMatchObject({
      capability: "live_env.query_route_evidence",
      tool_family: "live_source_mail",
      tool_family_contract: {
        tool_name: "live_env.query_route_evidence",
        authority: "evidence_only",
        required_observation_kinds: [
          "stage_play_workstation_context_feed_query_result",
          "helix.workstation_goal_context_update.v1",
        ],
      },
      missing_required_observation_kinds: [],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(index.queryable_artifact_keys).toEqual(expect.arrayContaining([
      "route_evidence",
      "stage_play_workstation_context_feed_query_result:route-evidence",
      "stage_play_goal_context_update:route-evidence-feed",
      "stage_play_goal_context_update:automation-policy",
    ]));
  });

  it("maps workstation control receipt artifacts to the governed control tool", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Apply the frog classifier preset to the active visual source.",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.change_workstation_preset",
        requested_capability_family: "live_source_mail",
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "stage_play_workstation_control_receipt:change_preset:1",
          kind: "stage_play_workstation_control_receipt",
          producer_item_id: "live_env.change_workstation_preset",
          payload: {
            schema: "stage_play_workstation_control_receipt/v1",
            tool_name: "live_env.change_workstation_preset",
            control_kind: "change_preset",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:workstation-control",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.change_workstation_preset",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.change_workstation_preset",
            update_kind: "suggested_action",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:workstation-control", payload });

    expect(index).toMatchObject({
      capability: "live_env.change_workstation_preset",
      tool_family: "live_source_mail",
      tool_family_contract: {
        tool_name: "live_env.change_workstation_preset",
        authority: "control_receipt",
        required_observation_kinds: [
          "stage_play_workstation_control_receipt",
          "helix.workstation_goal_context_update.v1",
        ],
      },
      missing_required_observation_kinds: [],
    });
  });

  it("maps narrator request artifacts to governed non-terminal voice delivery tools", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Run live_env.narrator_bind_stream for the translated transcript.",
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        requested_capability: "live_env.narrator_bind_stream",
        requested_capability_family: "voice_delivery",
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "helix_narrator_bind_stream_request:translated:1",
          kind: "helix.narrator_bind_stream_request.v1",
          producer_item_id: "live_env.narrator_bind_stream",
          payload: {
            schema: "helix.narrator_bind_stream_request.v1",
            schemaVersion: "helix.narrator_bind_stream_request.v1",
            tool_name: "live_env.narrator_bind_stream",
            sourceRef: "source:browser-audio",
            streamKind: "translated_transcript",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
        {
          artifact_id: "stage_play_goal_context_update:narrator-bind",
          kind: "helix.workstation_goal_context_update.v1",
          producer_item_id: "live_env.narrator_bind_stream",
          payload: {
            schema: "helix.workstation_goal_context_update.v1",
            tool_name: "live_env.narrator_bind_stream",
            producer_kind: "narrator",
            update_kind: "suggested_action",
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      ],
    };

    const index = buildArtifactQueryIndex({ turnId: "ask:test:narrator-bind", payload });

    expect(index).toMatchObject({
      capability: "live_env.narrator_bind_stream",
      tool_family: "voice_delivery",
      tool_family_contract: {
        tool_name: "live_env.narrator_bind_stream",
        authority: "control_receipt",
        required_observation_kinds: [
          "helix.narrator_bind_stream_request.v1",
          "helix.workstation_goal_context_update.v1",
        ],
      },
      missing_required_observation_kinds: [],
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("normalizes a completed internet_search.web_research turn through the same rail table", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "Use internet_search.web_research to find current source evidence.",
      tool_surface_packet: {
        schema: "helix.tool_surface_packet.v1",
        tools: [{ name: "internet_search.web_research" }],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "internet_research",
        required_terminal_kind: "internet_search_answer",
      },
      tool_call_admission_decision: {
        schema: "helix.tool_call_admission_decision.v1",
        turn_id: "ask:test:internet-search-complete",
        source_target: "internet_search",
        required: true,
        admitted_tool_families: ["internet_search"],
        requested_capability: "internet_search.web_research",
        requested_capability_family: "internet_search",
        requested_capability_source: "explicit_user_command",
        required_observation_kinds_for_requested_capability: ["internet_search_observation"],
        assistant_answer: false,
        raw_content_included: false,
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:internet-search-complete",
        capability_family: "internet_search",
        requested_action: "internet_search.web_research",
        selected_capability: "internet_search.web_research",
        requested_capability: "internet_search.web_research",
        admission_status: "admitted",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "internet_search.web_research",
            executed_action_key: "internet_search.web_research",
            observed_artifact_refs: ["internet_search_observation:1"],
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:internet-search-complete:final_answer_draft",
        support_refs: ["internet_search_observation:1"],
      },
      terminal_artifact_kind: "internet_search_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "internet_search_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "internet_search_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "internet_search_observation:1",
          kind: "internet_search_observation",
          producer_item_id: "internet_search.web_research",
          payload: {
            schema: "helix.internet_search_observation.v1",
            result_count: 3,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:internet-search-complete", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:internet-search-complete", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      prompt: "Use internet_search.web_research to find current source evidence.",
      requested_capability: "internet_search.web_research",
      visible_tool_surface: expect.arrayContaining(["internet_search.web_research"]),
      selected_capability: "internet_search.web_research",
      admitted_capability: "internet_search.web_research",
      executed_capability: "internet_search.web_research",
      observation_kind: "internet_search_observation",
      observation_ref: "internet_search_observation:1",
      reentry_status: "reentered",
      required_terminal_kind: "internet_search_answer",
      selected_terminal_kind: "internet_search_answer",
      visible_terminal_kind: "internet_search_answer",
      first_broken_rail: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
    });
  });

  it("normalizes a completed visual capture turn through the same rail table", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "What is happening right now in the visual screen capture?",
      tool_surface_packet: {
        schema: "helix.tool_surface_packet.v1",
        tools: [{ name: "situation-room.describe_visual_capture" }],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "visual_capture_describe",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:visual-capture-complete",
        capability_family: "visual_capture",
        requested_action: "situation-room.describe_visual_capture",
        selected_capability: "situation-room.describe_visual_capture",
        admission_status: "admitted",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "situation-room.describe_visual_capture",
            executed_action_key: "situation-room.describe_visual_capture",
            observed_artifact_refs: ["visual_frame_evidence:1"],
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:visual-capture-complete:final_answer_draft",
        support_refs: ["visual_frame_evidence:1"],
      },
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "visual_frame_evidence:1",
          kind: "visual_frame_evidence",
          producer_item_id: "situation-room.describe_visual_capture",
          payload: {
            schema: "helix.visual_frame_evidence.v1",
            summary: "A seeded visual frame is available.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:visual-capture-complete", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:visual-capture-complete", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      prompt: "What is happening right now in the visual screen capture?",
      visible_tool_surface: expect.arrayContaining(["situation-room.describe_visual_capture"]),
      selected_capability: "situation-room.describe_visual_capture",
      admitted_capability: "situation-room.describe_visual_capture",
      executed_capability: "situation-room.describe_visual_capture",
      observation_kind: "visual_frame_evidence",
      observation_ref: "visual_frame_evidence:1",
      reentry_status: "reentered",
      required_terminal_kind: "model_synthesized_answer",
      selected_terminal_kind: "model_synthesized_answer",
      visible_terminal_kind: "model_synthesized_answer",
      first_broken_rail: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.tool_turn_chain_family_matrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route_family: "image_lens / visual_capture",
          observed: true,
          did_tool_run: true,
          artifact_produced: true,
          rail_status: "complete",
        }),
      ]),
    );
  });

  it("normalizes a completed capability catalog turn through the same rail table", () => {
    const payload: Record<string, unknown> = {
      active_prompt: "What tools are available for Helix Ask to use?",
      tool_surface_packet: {
        schema: "helix.tool_surface_packet.v1",
        tools: [{ name: "helix_ask.inspect_capability_catalog" }],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "capability_help",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: "ask:test:capability-catalog-complete",
        capability_family: "capability_catalog",
        requested_action: "helix_ask.inspect_capability_catalog",
        selected_capability: "helix_ask.inspect_capability_catalog",
        admission_status: "admitted",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            chosen_capability: "helix_ask.inspect_capability_catalog",
            executed_action_key: "helix_ask.inspect_capability_catalog",
            observed_artifact_refs: ["capability_registry:1", "capability_help_summary:1"],
          },
        ],
        executed_tool_call_count: 1,
      },
      final_answer_draft: {
        schema: "helix.final_answer_draft.v1",
        draft_id: "ask:test:capability-catalog-complete:final_answer_draft",
        support_refs: ["capability_registry:1", "capability_help_summary:1"],
      },
      terminal_artifact_kind: "model_synthesized_answer",
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "model_synthesized_answer",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "capability_registry:1",
          kind: "capability_registry",
          producer_item_id: "helix_ask.inspect_capability_catalog",
          payload: {
            schema: "helix.capability_registry.v1",
            tools: [{ name: "repo-code.search_concept" }, { name: "workspace_os.status" }],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "capability_help_summary:1",
          kind: "capability_help_summary",
          producer_item_id: "helix_ask.inspect_capability_catalog",
          payload: {
            schema: "helix.capability_help_summary.v1",
            summary: "Capability catalog was inspected.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
    };

    refreshToolLifecycleRecords({ turnId: "ask:test:capability-catalog-complete", payload });
    const index = buildArtifactQueryIndex({ turnId: "ask:test:capability-catalog-complete", payload });

    expect(index.codex_parity_agent_spine_rail_table).toMatchObject({
      schema: "helix.codex_parity_agent_spine_rail_table.v1",
      prompt: "What tools are available for Helix Ask to use?",
      visible_tool_surface: expect.arrayContaining([
        "helix_ask.inspect_capability_catalog",
        "repo-code.search_concept",
        "workspace_os.status",
      ]),
      selected_capability: "helix_ask.inspect_capability_catalog",
      admitted_capability: "helix_ask.inspect_capability_catalog",
      executed_capability: "helix_ask.inspect_capability_catalog",
      observation_kind: "capability_registry",
      observation_ref: "capability_registry:1",
      reentry_status: "reentered",
      required_terminal_kind: "model_synthesized_answer",
      selected_terminal_kind: "model_synthesized_answer",
      visible_terminal_kind: "model_synthesized_answer",
      first_broken_rail: null,
      codex_parity_class: "complete",
      rail_status: "complete",
      rail_failure_code: null,
    });
    expect(index.required_observation_coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "capability_registry", present: true }),
        expect.objectContaining({ kind: "capability_help_summary", present: true }),
      ]),
    );
  });

  it("covers the required Codex-parity spine families in one convergence matrix", () => {
    const buildCompletePayload = (input: {
      turnId: string;
      prompt: string;
      capability: string;
      requestedCapability?: string | null;
      capabilityFamily: string;
      sourceTarget: string;
      goalKind: string;
      terminalKind: string;
      observationKinds: string[];
      visibleTools?: string[];
      requestedObservationKinds?: string[];
    }): Record<string, unknown> => {
      const primaryObservation = input.observationKinds[0] ?? "observation";
      const observationRefs = input.observationKinds.map((kind, index) => `${kind}:${index + 1}`);
      return {
        active_prompt: input.prompt,
        tool_surface_packet: {
          schema: "helix.tool_surface_packet.v1",
          tools: (input.visibleTools ?? [input.capability]).map((name) => ({ name })),
          assistant_answer: false,
          raw_content_included: false,
        },
        canonical_goal_frame: {
          schema: "helix.canonical_goal_frame.v1",
          goal_kind: input.goalKind,
          required_terminal_kind: input.terminalKind,
        },
        tool_call_admission_decision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: input.turnId,
          source_target: input.sourceTarget,
          required: true,
          admitted_tool_families: [input.sourceTarget],
          requested_capability: input.requestedCapability ?? input.capability,
          requested_capability_family: input.sourceTarget,
          requested_capability_source: input.requestedCapability ? "explicit_user_command" : null,
          required_observation_kinds_for_requested_capability: input.requestedObservationKinds ?? input.observationKinds,
          assistant_answer: false,
          raw_content_included: false,
        },
        capability_plan: {
          schema: "helix.capability_plan.v1",
          turn_id: input.turnId,
          capability_family: input.capabilityFamily,
          requested_action: input.capability,
          selected_capability: input.capability,
          requested_capability: input.requestedCapability ?? input.capability,
          admission_status: "admitted",
        },
        agent_runtime_loop: {
          schema: "helix.agent_runtime_loop.v1",
          iterations: [
            {
              iteration: 1,
              chosen_capability: input.capability,
              executed_action_key: input.capability,
              observed_artifact_refs: observationRefs,
            },
          ],
          executed_tool_call_count: 1,
        },
        final_answer_draft: {
          schema: "helix.final_answer_draft.v1",
          draft_id: `${input.turnId}:final_answer_draft`,
          support_refs: observationRefs,
        },
        terminal_artifact_kind: input.terminalKind,
        terminal_authority_single_writer: {
          schema: "helix.terminal_authority_single_writer_result.v1",
          selected_terminal_artifact_kind: input.terminalKind,
        },
        terminal_presentation: {
          schema: "helix.terminal_presentation.v1",
          terminal_artifact_kind: input.terminalKind,
        },
        current_turn_artifact_ledger: input.observationKinds.map((kind, index) => ({
          artifact_id: observationRefs[index],
          kind,
          producer_item_id: input.capability,
          payload: {
            schema: `helix.${kind}.v1`,
            tool_name: input.capability,
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        })),
        selected_final_answer: `Completed ${primaryObservation}.`,
      };
    };

    const buildSuppressedContextPayload = (turnId: string): Record<string, unknown> => ({
      active_prompt: "Explain why calculator receipts are observations, but do not call the calculator.",
      tool_surface_packet: {
        schema: "helix.tool_surface_packet.v1",
        tools: [
          { name: "scientific-calculator.solve_expression" },
          { name: "suppressed_contextual_tool_reference" },
        ],
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        schema: "helix.canonical_goal_frame.v1",
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      },
      capability_plan: {
        schema: "helix.capability_plan.v1",
        turn_id: turnId,
        capability_family: "model_only",
        requested_action: "suppressed_contextual_tool_reference",
        selected_capability: "suppressed_contextual_tool_reference",
        admission_status: "rejected",
        rejection_reason: "contextual_tool_reference_suppressed",
        tool_admission_suppressed: true,
        capability_contract_arbitration: {
          schema: "helix.ask_capability_contract_arbitration.v1",
          contract_state: "suppressed_contextual_reference",
          selected_source_target: "model_only",
          selected_plan_family: "model_only",
          canonical_goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      operational_capability_trace: {
        schema: "helix.operational_capability_trace.v1",
        executed_capability: "model.direct_answer",
      },
      agent_runtime_loop: {
        schema: "helix.agent_runtime_loop.v1",
        iterations: [
          {
            iteration: 1,
            next_step: "answer",
            chosen_capability: "model.direct_answer",
            executed_action_key: null,
            stop_reason: "terminal_satisfied",
            satisfaction: "satisfied",
          },
        ],
        executed_tool_call_count: 0,
        stop_reason: "terminal_satisfied",
      },
      final_answer_source: "model_direct_answer",
      terminal_artifact_kind: "direct_answer_text",
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        final_answer_source: "model_direct_answer",
        terminal_artifact_kind: "direct_answer_text",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "direct_answer_text",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "reasoning_context:1",
          kind: "reasoning_context",
          payload: {
            schema: "helix.reasoning_context.v1",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "direct_answer_text:1",
          kind: "direct_answer_text",
          payload: {
            schema: "helix.direct_answer_text.v1",
            text: "Receipts are observations, not terminal answers.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: "final_answer_draft:1",
          kind: "final_answer_draft",
          payload: {
            schema: "helix.final_answer_draft.v1",
            support_refs: ["reasoning_context:1", "direct_answer_text:1"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      selected_final_answer: "Receipts are observations, not terminal answers.",
    });

    const cases = [
      {
        coverage: "calculator",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-calculator",
          prompt: "Use scientific-calculator.solve_expression for 2 + 2.",
          capability: "scientific-calculator.solve_expression",
          requestedCapability: "scientific-calculator.solve_expression",
          capabilityFamily: "workstation_action",
          sourceTarget: "calculator",
          goalKind: "calculator_solve",
          terminalKind: "workstation_tool_evaluation",
          observationKinds: ["calculator_receipt"],
        }),
      },
      {
        coverage: "docs",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-docs",
          prompt: "Use docs-viewer.locate_in_doc to cite the claim.",
          capability: "docs-viewer.locate_in_doc",
          requestedCapability: "docs-viewer.locate_in_doc",
          capabilityFamily: "docs_viewer",
          sourceTarget: "docs_viewer",
          goalKind: "locate_in_doc",
          terminalKind: "doc_location_matches",
          observationKinds: ["doc_location_matches"],
        }),
      },
      {
        coverage: "repo_code",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-repo",
          prompt: "Use repo-code.search_concept to find terminal authority evidence.",
          capability: "repo-code.search_concept",
          requestedCapability: "repo-code.search_concept",
          capabilityFamily: "repo_evidence",
          sourceTarget: "repo_code",
          goalKind: "repo_concept_explanation",
          terminalKind: "repo_code_evidence_answer",
          observationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
        }),
      },
      {
        coverage: "workspace_status",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-workspace-status",
          prompt: "Use workspace_os.status to inspect workstation status.",
          capability: "workspace_os.status",
          requestedCapability: "workspace_os.status",
          capabilityFamily: "workspace_diagnostic",
          sourceTarget: "workspace_diagnostic",
          goalKind: "workspace_status_diagnostic",
          terminalKind: "model_synthesized_answer",
          observationKinds: ["workspace_os_status_observation"],
        }),
      },
      {
        coverage: "live_source_mail",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-live-mail",
          prompt: "Read the processed live-source mailbox packet.",
          capability: "live_env.read_processed_live_source_mail",
          capabilityFamily: "live_environment",
          sourceTarget: "live_environment",
          goalKind: "live_source_mailbox_review",
          terminalKind: "model_synthesized_answer",
          observationKinds: ["stage_play_processed_mail_packet"],
        }),
      },
      {
        coverage: "internet_search",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-internet",
          prompt: "Use internet_search.web_research to find current source evidence.",
          capability: "internet_search.web_research",
          requestedCapability: "internet_search.web_research",
          capabilityFamily: "internet_search",
          sourceTarget: "internet_search",
          goalKind: "internet_research",
          terminalKind: "internet_search_answer",
          observationKinds: ["internet_search_observation"],
        }),
      },
      {
        coverage: "visual_image_lens",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-visual",
          prompt: "What is happening right now in the visual screen capture?",
          capability: "situation-room.describe_visual_capture",
          capabilityFamily: "visual_capture",
          sourceTarget: "visual_capture",
          goalKind: "visual_capture_describe",
          terminalKind: "situation_context_pack",
          observationKinds: ["situation_context_pack"],
        }),
      },
      {
        coverage: "capability_catalog",
        payload: buildCompletePayload({
          turnId: "ask:test:coverage-capability-catalog",
          prompt: "What tools are available for Helix Ask to use?",
          capability: "helix_ask.inspect_capability_catalog",
          capabilityFamily: "capability_catalog",
          sourceTarget: "runtime_evidence",
          goalKind: "capability_help",
          terminalKind: "model_synthesized_answer",
          observationKinds: ["capability_registry", "capability_help_summary"],
          visibleTools: [
            "helix_ask.inspect_capability_catalog",
            "repo-code.search_concept",
            "workspace_os.status",
            "scientific-calculator.solve_expression",
          ],
        }),
      },
      {
        coverage: "contextual_suppression",
        payload: buildSuppressedContextPayload("ask:test:coverage-contextual-suppression"),
        expected: {
          selected_capability: "suppressed_contextual_tool_reference",
          admitted_capability: null,
          executed_capability: null,
          observation_kind: "reasoning_context",
          reentry_status: "reentered",
          required_terminal_kind: "direct_answer_text",
          selected_terminal_kind: "direct_answer_text",
          visible_terminal_kind: "direct_answer_text",
          first_broken_rail: null,
          codex_parity_class: "complete",
          rail_status: "complete",
          rail_failure_code: null,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ];

    const covered = new Set<string>();
    for (const entry of cases) {
      refreshToolLifecycleRecords({ turnId: String(entry.payload.capability_plan && (entry.payload.capability_plan as Record<string, unknown>).turn_id), payload: entry.payload });
      const index = buildArtifactQueryIndex({
        turnId: String(entry.payload.capability_plan && (entry.payload.capability_plan as Record<string, unknown>).turn_id),
        payload: entry.payload,
      });
      const railTable = index.codex_parity_agent_spine_rail_table as Record<string, unknown>;
      covered.add(entry.coverage);
      expect(railTable).toMatchObject(
        entry.expected ?? {
          schema: "helix.codex_parity_agent_spine_rail_table.v1",
          selected_capability: (entry.payload.capability_plan as Record<string, unknown>).selected_capability,
          admitted_capability: (entry.payload.capability_plan as Record<string, unknown>).selected_capability,
          executed_capability: (entry.payload.capability_plan as Record<string, unknown>).selected_capability,
          reentry_status: "reentered",
          first_broken_rail: null,
          codex_parity_class: "complete",
          rail_status: "complete",
          rail_failure_code: null,
          assistant_answer: false,
          raw_content_included: false,
        },
      );
      expect(Array.isArray(railTable.visible_tool_surface)).toBe(true);
      expect((railTable.visible_tool_surface as unknown[]).length).toBeGreaterThan(0);
      expect(railTable.selected_terminal_kind).toBe(railTable.visible_terminal_kind);
    }

    expect([...covered].sort()).toEqual([
      "calculator",
      "capability_catalog",
      "contextual_suppression",
      "docs",
      "internet_search",
      "live_source_mail",
      "repo_code",
      "visual_image_lens",
      "workspace_status",
    ]);
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
