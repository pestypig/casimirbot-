import { beforeEach, describe, expect, it } from "vitest";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  ingestWorkstationLiveSourceEvent,
  resetWorkstationLiveSources,
} from "../services/situation-room/workstation-live-source-ingest";

describe("workstation live computation source", () => {
  beforeEach(() => {
    resetLiveAnswerEnvironments();
    resetWorkstationLiveSources();
  });

  it("updates calculator prime stream lines from deterministic source ticks", () => {
    const { environment } = createLiveAnswerEnvironment({
      thread_id: "helix-ask:test",
      created_turn_id: "turn:prime",
      objective: "Set up a live prime number generator and show the next primes as they are found.",
      source_ids: ["source:calculator-prime-stream"],
      preset: "calculator_prime_stream",
      now: "2026-05-08T16:00:00.000Z",
    });

    const result = ingestWorkstationLiveSourceEvent({
      source_id: "source:calculator-prime-stream",
      environment_id: environment.environment_id,
      kind: "calculator_series",
      event_type: "prime_found",
      seq: 6,
      ts: "2026-05-08T16:00:06.000Z",
      payload: {
        candidate: 7,
        is_prime: true,
        latest_prime: 7,
        prime_count: 4,
        gap: 2,
      },
      evidence_refs: ["calculator:prime:7"],
      trace: {
        calculator_trace_id: "scicalc-prime:6:7",
        algorithm: "trial_division",
        deterministic: true,
      },
    });

    expect(result.computation_event).toMatchObject({
      schema: "helix.live_computation_event.v1",
      ok: true,
      output: expect.objectContaining({ candidate: 7, is_prime: true }),
    });
    expect(result.live_answer_environment_delta).toMatchObject({
      schema: "helix.live_answer_environment_delta.v1",
      reason: "computation_tick",
      changed_line_keys: expect.arrayContaining(["current_candidate", "latest_prime", "prime_count", "last_test"]),
    });
    expect(result.event).toMatchObject({
      source_event_id: result.event.event_id,
      source_family: "calculator_stream",
      tick_index: 6,
      deterministic: true,
    });
    expect(result.live_answer_environment?.lines.find((line) => line.key === "latest_prime")?.value).toBe("7");
    expect(result.live_answer_environment?.latest_evaluation).toMatchObject({
      reason: "tick_based",
      model_invoked: false,
      deterministic: true,
    });
    expect(result.live_answer_environment?.lines.find((line) => line.key === "last_test")?.value).toBe("7 is prime.");
  });
});
