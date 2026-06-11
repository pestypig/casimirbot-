import { describe, expect, it } from "vitest";

import {
  buildCodexStyleTurnStatePacket,
  buildSolverContinuationObservation,
} from "../services/helix-ask/solver-continuation";

describe("Helix Ask solver continuation", () => {
  it("turns missing_followup_reasoning into a model-visible continuation observation", () => {
    const continuation = buildSolverContinuationObservation({
      turnId: "turn-1",
      payload: {},
      hardGateCode: "missing_followup_reasoning",
      finalRoute: "live_source_visual_answer",
      terminalKind: "typed_failure",
      artifactLedger: [],
    });

    expect(continuation).toMatchObject({
      schema: "helix.solver_continuation_observation.v1",
      reason: "missing_followup_reasoning",
      required_next_step: "model_followup_reasoning",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(continuation?.model_visible_instruction).toMatch(/follow-up reasoning/i);
  });

  it("turns route authority gaps into route authority repair continuations", () => {
    const continuation = buildSolverContinuationObservation({
      turnId: "turn-2",
      payload: {},
      hardGateCode: "route_authority_missing",
      finalRoute: null,
      terminalKind: "typed_failure",
      artifactLedger: [],
    });

    expect(continuation?.required_next_step).toBe("route_authority_repair");
  });

  it("turns receipt re-entry gaps into evidence re-entry continuations", () => {
    const continuation = buildSolverContinuationObservation({
      turnId: "turn-3",
      payload: {},
      hardGateCode: "receipt_terminal_without_reentry",
      finalRoute: "dispatch:observe_explore",
      terminalKind: "typed_failure",
      artifactLedger: [],
    });

    expect(continuation?.required_next_step).toBe("evidence_reentry");
  });

  it("does not continue blocked contextual tool execution failures", () => {
    const continuation = buildSolverContinuationObservation({
      turnId: "turn-4",
      payload: {},
      hardGateCode: "blocked_contextual_tool_executed",
      finalRoute: "dispatch:act",
      terminalKind: "typed_failure",
      artifactLedger: [],
    });

    expect(continuation).toBeNull();
  });

  it("builds a Codex-style turn state packet with observations and unresolved reasons", () => {
    const packet = buildCodexStyleTurnStatePacket({
      turnId: "turn-5",
      payload: { available_capabilities: ["answer", "ask_user"] },
      artifactLedger: [
        {
          artifact_id: "artifact-1",
          kind: "live_pipeline_receipt",
          payload: { text: "receipt only" },
        },
      ],
      unresolvedReasons: ["missing_followup_reasoning"],
      terminalForbiddenReasons: ["receipt_terminal_without_reentry"],
    });

    expect(packet).toMatchObject({
      schema: "helix.ask_codex_style_turn_state_packet.v1",
      prompt_preserved: true,
      unresolved_solver_reasons: ["missing_followup_reasoning"],
      terminal_forbidden_reasons: ["receipt_terminal_without_reentry"],
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(packet.observations[0]).toMatchObject({
      artifact_ref: "artifact-1",
      content_role: "observation_not_assistant_answer",
    });
  });
});
