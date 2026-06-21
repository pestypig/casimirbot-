import { describe, expect, it } from "vitest";
import { buildLoopParityTrace } from "../services/helix-ask/loop-parity-trace";

describe("Helix Ask loop parity trace", () => {
  it("canonicalizes calculator panel action aliases to the admitted calculator capability", () => {
    const turnId = "ask:test:calculator-alias";
    const trace = buildLoopParityTrace({
      turnId,
      promptText: "Call scientific-calculator.solve_expression with expression 2 + 2.",
      selectedRoute: "calculator_solve",
      terminalArtifactKind: "workstation_tool_evaluation",
      finalAnswerSource: "workstation_tool_evaluation",
      payload: {
        source_target_intent: {
          target_source: "calculator_stream",
          target_kind: "current_turn_action",
          strength: "hard",
        },
        tool_call_admission_decision: {
          admitted_tool_families: ["calculator", "workstation_action"],
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          allowed_terminal_artifact_kinds: ["workstation_tool_evaluation"],
          forbidden_terminal_artifact_kinds: [],
        },
        terminal_answer_authority: {
          server_authoritative: true,
        },
        route_authority_audit: {
          route_authority_ok: true,
          violation_codes: [],
        },
        poison_audit: {
          ok: true,
          violations: [],
        },
        terminal_presentation: {
          terminal_artifact_kind: "workstation_tool_evaluation",
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: `${turnId}:runtime_tool_call:1:calculator`,
            kind: "runtime_tool_call",
            payload: {
              capability_key: "scientific-calculator.solve_expression",
              call_id: `${turnId}:runtime_tool_call:1:calculator`,
            },
          },
          {
            artifact_id: `${turnId}:agent_runtime_1_scientific_calculator_solve_expression:calculator_result_trace:5`,
            kind: "calculator_result_trace",
            payload: {
              action_id: "solve_expression",
              trace_source: "scientific-calculator.solve_expression",
            },
          },
        ],
      },
    });

    expect(trace.actual_tool_calls).toEqual([
      expect.objectContaining({
        tool_id: "scientific-calculator.solve_expression",
        family: "calculator",
        admitted: true,
      }),
    ]);
    expect(trace.unexpected_tool_calls).toEqual([]);
    expect(trace.short_circuit_risk_flags).not.toContain("tool_called_without_admission");
  });
});
