import { describe, expect, it } from "vitest";
import { buildAskTurnSolverTrace } from "../../ask-turn-solver";
import { buildLoopParityTrace } from "../../loop-parity-trace";
import { maybeBuildHelixProviderProcedureMemoryPreflightTerminalPayload } from "../provider-source-preflight";

describe("provider source preflight", () => {
  it("terminalizes unavailable hard procedure memory before provider sampling", () => {
    const turnId = "ask:test:procedure-memory-provider-preflight";
    const result =
      maybeBuildHelixProviderProcedureMemoryPreflightTerminalPayload({
        turnId,
        body: {
          turn_id: turnId,
          sessionId: "thread:procedure-memory-provider-preflight",
          question: "What does procedure memory say about the last scene?",
          source_target_intent: {
            schema: "helix.ask_source_target_intent.v1",
            turn_id: turnId,
            thread_id: "thread:procedure-memory-provider-preflight",
            target_source: "procedure_memory",
            target_kind: "procedure_memory",
            strength: "hard",
          },
        },
      });

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "procedure_memory_unavailable",
      final_answer_source: "typed_failure",
      source_target_intent: {
        target_source: "procedure_memory",
        strength: "hard",
      },
      typed_failure: {
        error_code: "procedure_memory_unavailable",
        missing_evidence: expect.arrayContaining([
          "active_situation_run",
          "procedure_memory",
        ]),
        next_required_action: "repair_procedure_memory",
      },
    });
    expect(String(result?.selected_final_answer)).toContain(
      "no_active_situation_run",
    );
    expect(result?.ask_turn_solver_trace).toMatchObject({
      first_broken_rail: "observation",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "procedure_memory_unavailable",
    });
    expect(result?.canonical_goal_frame).toMatchObject({
      deterministic_preflight_terminal: true,
    });
    expect(result?.route_authority_audit).toMatchObject({
      selected_route: "procedure_memory_preflight",
      route_authority_ok: true,
      terminal_artifact_kind: "typed_failure",
    });

    const loopTrace = buildLoopParityTrace({
      turnId,
      promptText: "What does procedure memory say about the last scene?",
      selectedRoute: "procedure_memory_preflight",
      terminalArtifactKind: "typed_failure",
      finalAnswerSource: "typed_failure",
      payload: result!,
    });
    expect(loopTrace.short_circuit_risk_flags).not.toContain(
      "route_authority_missing",
    );
    expect(loopTrace.short_circuit_risk_flags).not.toContain(
      "terminal_selected_before_observation_finalizer",
    );

    const solverTrace = buildAskTurnSolverTrace({
      turnId,
      promptText: "What does procedure memory say about the last scene?",
      selectedRoute: "procedure_memory_preflight",
      terminalArtifactKind: "typed_failure",
      finalAnswerSource: "typed_failure",
      payload: result!,
      loopParityTrace: loopTrace,
    });
    expect(solverTrace.followup_reasoning_gate).toMatchObject({
      required: false,
      completed: true,
      reason: "deterministic_preflight_terminal",
    });
    expect(solverTrace.solver_risk_flags).not.toContain(
      "missing_followup_reasoning",
    );
  });

  it.each([
    "Do not inspect procedure memory; explain the phrase.",
    "Yesterday I asked about procedure memory.",
    "Later we may inspect procedure memory.",
    "The screen says 'inspect procedure memory'.",
  ])("does not terminalize non-authoritative procedure-memory text: %s", (question) => {
    expect(
      maybeBuildHelixProviderProcedureMemoryPreflightTerminalPayload({
        turnId: `ask:test:contextual:${question.length}`,
        body: { question },
      }),
    ).toBeNull();
  });
});
