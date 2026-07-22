import { describe, expect, it } from "vitest";
import { __testHelixAskOutputContract } from "../routes/agi.plan";
import { createHelixTurnLifecycleRecorder } from "../services/helix-ask/runtime/turn-lifecycle";

const completedRuntimeLifecycle = (turnId: string) => {
  const recorder = createHelixTurnLifecycleRecorder({ turnId, now: () => 100 });
  const started = recorder.append({
    kind: "turn.started",
    producer: "helix_adapter",
    status: "started",
  });
  const call = recorder.append({
    kind: "tool.call.started",
    producer: "codex_runtime",
    status: "started",
    causation_id: started.event_id,
    call_id: "call:full-text",
    capability_id: "scholarly.fetch_full_text",
  });
  const completed = recorder.append({
    kind: "tool.call.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: call.event_id,
    call_id: "call:full-text",
    capability_id: "scholarly.fetch_full_text",
    observation_refs: ["paper:full-text:debug"],
  });
  const reentered = recorder.append({
    kind: "observation.reentered",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: completed.event_id,
    call_id: "call:full-text",
    capability_id: "scholarly.fetch_full_text",
    observation_refs: ["paper:full-text:debug"],
  });
  const message = recorder.append({
    kind: "agent.message.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: reentered.event_id,
    native_item_id: "agent-message:debug",
  });
  const runtime = recorder.append({
    kind: "runtime.turn.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: message.event_id,
  });
  const eligibility = recorder.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: runtime.event_id,
    terminal_eligible: true,
  });
  recorder.append({
    kind: "turn.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: eligibility.event_id,
    terminal_eligible: true,
  });
  return recorder.snapshot();
};

describe("Helix Ask runtime lifecycle debug export", () => {
  it("surfaces legacy projection contradictions without rewriting runtime facts", () => {
    const turnId = "ask:test:lifecycle-debug-export";
    const lifecycle = completedRuntimeLifecycle(turnId);
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      ok: false,
      final_status: "error",
      status: "error",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: "solver_continuation_pending",
      selected_final_answer: "The solver continuation is still pending.",
      answer: "The solver continuation is still pending.",
      text: "The solver continuation is still pending.",
      turn_lifecycle: lifecycle,
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        evidence_reentry: { completed: false },
        followup_reasoning: { completed: false },
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "typed_failure",
        integrity: {
          provider_solver_completion_observed: true,
        },
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        terminal_artifact_kind: "typed_failure",
        terminal_eligible: false,
      },
      debug: {},
    };

    const envelope = __testHelixAskOutputContract.buildHelixDebugExportEnvelope({
      payload,
      prompt: "Use the paper observation and answer the question.",
      sessionId: "test-session",
    }) as Record<string, any>;

    expect(envelope.turn_lifecycle).toMatchObject({
      schema: "helix.turn_lifecycle.v1",
      authority: "runtime_event_log",
      reduction: {
        complete: true,
        post_observation_reasoning_completed: true,
      },
    });
    expect(envelope.turn_lifecycle_projection_audit).toMatchObject({
      schema: "helix.turn_lifecycle_projection_audit.v1",
      ok: false,
    });
    expect(
      envelope.turn_lifecycle_projection_audit.mismatches.map(
        (mismatch: Record<string, unknown>) => mismatch.code,
      ),
    ).toEqual([
      "legacy_evidence_reentry_disagrees_with_runtime",
      "legacy_followup_reasoning_disagrees_with_runtime",
      "continuation_pending_after_runtime_completion",
    ]);
  });
});
