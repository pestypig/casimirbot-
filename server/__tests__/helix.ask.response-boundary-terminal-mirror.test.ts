import { describe, expect, it } from "vitest";

import { __testHelixAskOutputContract } from "../routes/agi.plan";
import { HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION } from "../services/helix-ask/terminal-rail-failure-reconciliation";

describe("Helix Ask response-boundary terminal mirrors", () => {
  it("projects workstation terminal authority over stale model-synthesized debug mirrors", () => {
    const answerText = "Calculator verification plan completed.\nExpression: 2+2\nResult: 4";
    const payload = {
      turn_id: "ask:test-workstation-terminal-mirror",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      selected_final_answer: answerText,
      answer: answerText,
      text: answerText,
      canonical_goal_frame: {
        goal_kind: "calculator_solve",
        required_terminal_kind: "workstation_tool_evaluation",
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_kind: "answer",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
        terminal_text_preview: answerText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "workstation_tool_evaluation",
        concise_text: answerText,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "workstation_tool_evaluation",
        source: "workstation_tool_evaluation",
        visible_text: answerText,
      },
      resolved_turn_summary: {
        final_status: "final_answer",
        resolved_route_label: "calculator_solve / workstation_tool_evaluation",
        terminal_artifact_kind: "workstation_tool_evaluation",
        final_answer_source: "workstation_tool_evaluation",
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        final_arbitration: {
          terminal_artifact_kind: "model_synthesized_answer",
          final_answer_source: "final_answer_draft",
        },
      },
      solver_controller_decision: {
        schema: "helix.solver_controller_decision.v1",
        decision: "allow_terminal",
        canonical_goal_kind: "temporal_followup",
        required_terminal_kind: "model_synthesized_answer",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      solver_controller_summary: {
        decision: "allow_terminal",
        required_terminal_kind: "model_synthesized_answer",
        selected_terminal_artifact_kind: "model_synthesized_answer",
      },
      terminal_projection_guard: {
        schema: "helix.terminal_projection_guard.v1",
        terminal_authority_kind: "workstation_tool_evaluation",
        visible_terminal_kind: "model_synthesized_answer",
        action: "project_authority_artifact",
        error_code: null,
      },
      debug: {},
    };

    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Call scientific-calculator.solve_expression with 2+2.",
      sessionId: "test-session",
    }) as Record<string, any>;

    expect(envelope.final_answer_source).toBe("workstation_tool_evaluation");
    expect(envelope.resolved_turn_summary).toMatchObject({
      resolved_route_label: "calculator_solve / workstation_tool_evaluation",
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
    });
    expect(envelope.ask_turn_solver_trace.final_arbitration).toMatchObject({
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
    });
    expect(envelope.solver_controller_decision).toMatchObject({
      canonical_goal_kind: "calculator_solve",
      required_terminal_kind: "workstation_tool_evaluation",
      selected_terminal_artifact_kind: "workstation_tool_evaluation",
    });
    expect(envelope.terminal_projection_guard).toMatchObject({
      terminal_authority_kind: "workstation_tool_evaluation",
      visible_terminal_kind: "workstation_tool_evaluation",
      error_code: null,
    });
  });

  it("normalizes stale top-level final-draft mirrors from typed-failure authority", () => {
    const failureText = "I could not produce a terminal answer for this turn.";
    const payload = {
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      selected_final_answer: "stale draft",
      answer: "stale draft",
      text: "stale draft",
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
      },
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
        concise_text: failureText,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      debug: {
        final_answer_source: "final_answer_draft",
      },
    };

    const normalized = __testHelixAskOutputContract.prepareHelixAskLiveResponsePayload(payload, { mode: "deep" }) as Record<string, unknown>;

    expect(normalized).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      selected_final_answer: failureText,
      answer: failureText,
      text: failureText,
    });
    expect(normalized.debug).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      selected_final_answer: failureText,
    });
  });

  it("normalizes debug-export cache envelopes from typed-failure authority", () => {
    const failureText = "Compound prompt coverage failed before terminal success.";
    const payload = {
      turn_id: "ask:test-debug-export-terminal-mirror",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      selected_final_answer: "stale draft",
      answer: "stale draft",
      text: "stale draft",
      current_turn_artifact_ledger: [],
      compound_prompt_coverage_gate: {
        schema: "helix.compound_prompt_coverage_gate.v1",
        applies: true,
        passed: false,
        decision: "FAIL_CLOSED",
      },
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
        concise_text: failureText,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      debug: {
        final_answer_source: "final_answer_draft",
      },
    };

    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Find scholarly sources, locate theory badges, then synthesize.",
      sessionId: "test-session",
    });

    expect(envelope).toMatchObject({
      selected_final_answer: failureText,
      final_answer_source: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      terminal_artifact_kind: "typed_failure",
      response_type: "final_failure",
      final_status: "final_failure",
      status: "final_failure",
      ok: false,
    });
    expect(envelope?.resolved_turn_summary).toMatchObject({
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "compound_prompt_coverage_incomplete",
      final_answer_source: "typed_failure",
    });
    expect(envelope?.terminal_answer_authority).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(JSON.stringify(envelope)).not.toContain("terminal_consistency_violation");
  });

  it("normalizes terminal-consistency errors to typed failure when coverage is missing", () => {
    const failureText = "The turn failed before a terminal answer was authoritative.";
    const payload = {
      turn_id: "ask:test-missing-coverage-terminal-mirror",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "model_synthesized_answer",
      final_answer_source: "final_answer_draft",
      terminal_error_code: "terminal_consistency_violation",
      selected_final_answer: "stale draft",
      answer: "stale draft",
      text: "stale draft",
      current_turn_artifact_ledger: [],
      terminal_answer_authority: {
        schema: "helix.terminal_authority.v1",
        terminal_kind: "failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        terminal_text_preview: failureText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "typed_failure",
        concise_text: failureText,
      },
      resolved_turn_summary: {
        final_status: "final_failure",
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      debug: {
        final_answer_source: "final_answer_draft",
      },
    };

    const normalized = __testHelixAskOutputContract.prepareHelixAskLiveResponsePayload(payload, { mode: "deep" }) as Record<string, any>;
    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Use scholarly research then theory locator.",
      sessionId: "test-session",
    });

    expect(normalized).toMatchObject({
      ok: false,
      response_type: "final_failure",
      final_status: "final_failure",
      status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "typed_failure",
    });
    expect(normalized.debug).toMatchObject({
      terminal_error_code: "typed_failure",
    });
    expect(envelope).toMatchObject({
      terminal_error_code: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(envelope?.resolved_turn_summary).toMatchObject({
      terminal_error_code: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
    });
    expect(JSON.stringify(envelope)).not.toContain("terminal_consistency_violation");
  });

  it("normalizes superseded compound coverage from authoritative terminal answers", () => {
    const answerText = [
      "Evidence packet includes six source-backed article references for the photosynthetic coherence question.",
      "The second observation maps the topic near photosynthetic light-harvesting and coherence-window context.",
      "The final synthesis keeps the boundary diagnostic and cites the collected source records.",
    ].join("\n");
    const staleGate = {
      schema: "helix.compound_prompt_coverage_gate.v1",
      applies: true,
      passed: true,
      decision: "PASS",
      reason: "all required compound prompt items were answered, visibly blocked, or failed closed",
      required_count: 3,
      answered_count: 0,
      blocked_count: 0,
      failed_closed_count: 3,
      unresolved_requirement_ids: [],
      non_visible_blocked_requirement_ids: [],
      resolutions: ["R1", "R2", "R3"].map((id) => ({
        requirement_id: id,
        status: "failed_closed",
        reason: "terminal failed closed before a partial success answer could be authoritative",
        evidence_refs: [],
        terminal_visible: true,
        assistant_answer: false,
        raw_content_included: false,
      })),
      assistant_answer: false,
      raw_content_included: false,
    };
    const payload = {
      turn_id: "ask:test-superseded-compound-coverage",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "scholarly_research_answer",
      final_answer_source: "final_answer_draft",
      selected_final_answer: answerText,
      answer: answerText,
      text: answerText,
      compound_prompt_coverage_gate: staleGate,
      current_turn_artifact_ledger: [
        {
          artifact_id: "ask:test-superseded-compound-coverage:compound_prompt_coverage_gate",
          kind: "compound_prompt_coverage_gate",
          payload: staleGate,
        },
      ],
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_kind: "answer",
        terminal_artifact_kind: "scholarly_research_answer",
        final_answer_source: "final_answer_draft",
        terminal_text_preview: answerText,
        server_authoritative: true,
      },
      solver_controller_decision: {
        schema: "helix.solver_controller_decision.v1",
        decision: "allow_terminal",
        compound_prompt_coverage_gate_superseded_by_answer_artifact: true,
        compound_prompt_coverage_superseded_ref: "ask:test-superseded-compound-coverage:scholarly_research_answer",
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        compound_prompt_contract: {
          schema: "helix.compound_prompt_contract.v1",
          requirements: [
            { id: "R1", text: "Use scholarly research to find papers about quantum coherence in photosynthesis.", required: true },
            { id: "R2", text: "Use the Theory Badge Graph locator to place the claim.", required: true },
            { id: "R3", text: "Synthesize uncertainty with citations.", required: true },
          ],
        },
      },
      debug: {
        compound_prompt_coverage_gate: staleGate,
      },
    };

    const normalized = __testHelixAskOutputContract.prepareHelixAskLiveResponsePayload(payload, { mode: "deep" }) as Record<string, any>;
    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Use scholarly research, then the Theory Badge Graph locator, then synthesize uncertainty with citations.",
      sessionId: "test-session",
    }) as Record<string, any>;

    expect(normalized.compound_prompt_coverage_gate).toMatchObject({
      passed: true,
      decision: "PASS",
      answered_count: 3,
      failed_closed_count: 0,
      unresolved_requirement_ids: [],
    });
    expect(normalized.compound_prompt_coverage_gate.resolutions.map((entry: any) => entry.status)).toEqual([
      "answered",
      "answered",
      "answered",
    ]);
    expect(normalized.debug.compound_prompt_coverage_gate).toMatchObject({
      answered_count: 3,
      failed_closed_count: 0,
    });
    expect(normalized.current_turn_artifact_ledger[0].payload).toMatchObject({
      answered_count: 3,
      failed_closed_count: 0,
    });
    expect(envelope.compound_prompt_coverage_gate).toMatchObject({
      answered_count: 3,
      failed_closed_count: 0,
      reason: "terminal authority superseded an earlier fail-closed coverage gate after the compound solver path allowed the answer",
    });
    expect(envelope.compound_prompt_coverage_gate.resolutions.map((entry: any) => entry.status)).not.toContain("failed_closed");
  });

  it("exports terminal rail reconciliation runtime marker on complete ask-turn envelopes", () => {
    const answerText = "Helix Ask can use the runtime capability catalog.";
    const payload = {
      turn_id: "ask:test-terminal-rail-reconciliation-runtime-marker",
      ok: true,
      response_type: "final_answer",
      final_status: "final_answer",
      status: "final_answer",
      terminal_artifact_kind: "capability_help_summary",
      final_answer_source: "capability_help_summary",
      selected_final_answer: answerText,
      answer: answerText,
      text: answerText,
      canonical_goal_frame: {
        goal_kind: "capability_catalog_help",
        required_terminal_kind: "capability_help_summary",
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: "ask:test-terminal-rail-reconciliation-runtime-marker:capability_registry:1",
          kind: "capability_registry",
          source_scope: "current_turn",
          payload: {
            schema: "helix.capability_catalog_observation.v1",
            selected_capability: "helix_ask.inspect_capability_catalog",
          },
        },
        {
          artifact_id: "ask:test-terminal-rail-reconciliation-runtime-marker:capability_help_summary:1",
          kind: "capability_help_summary",
          source_scope: "current_turn",
          payload: {
            schema: "helix.capability_help_summary.v1",
            text: answerText,
          },
        },
      ],
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_kind: "answer",
        terminal_artifact_kind: "capability_help_summary",
        final_answer_source: "capability_help_summary",
        terminal_text_preview: answerText,
        server_authoritative: true,
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        terminal_artifact_kind: "capability_help_summary",
        concise_text: answerText,
      },
      resolved_turn_summary: {
        final_status: "final_answer",
        resolved_route_label: "capability_catalog / capability_help_summary",
        terminal_artifact_kind: "capability_help_summary",
        final_answer_source: "capability_help_summary",
      },
      codex_parity_agent_spine_rail_table: {
        rail_status: "complete",
        first_broken_rail: null,
        rail_failure_code: null,
      },
      debug: {},
    };

    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "What tools are available for the helix ask to use?",
      sessionId: "test-session",
    }) as Record<string, any>;

    expect((payload as Record<string, any>).tool_rail_terminal_failure_reconciliation_runtime).toMatchObject({
      schema: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      available: true,
    });
    expect(envelope.tool_rail_terminal_failure_reconciliation_runtime).toMatchObject({
      schema: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      available: true,
    });
    expect(envelope.debug.tool_rail_terminal_failure_reconciliation_runtime).toMatchObject({
      schema: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      version: HELIX_TOOL_RAIL_TERMINAL_FAILURE_RECONCILIATION_VERSION,
      available: true,
    });
  });
});
