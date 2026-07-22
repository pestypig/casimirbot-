import { describe, expect, it } from "vitest";
import { createHelixTurnLifecycleRecorder } from "../turn-lifecycle";
import { readVerifiedHelixTurnLifecycle } from "../turn-lifecycle";
import { readVerifiedHelixRuntimeLifecycleFromPayload } from "../turn-lifecycle";
import { auditHelixTurnLifecycleProjection } from "../turn-lifecycle-projection-audit";

const buildCompletedLifecycle = () => {
  const recorder = createHelixTurnLifecycleRecorder({
    turnId: "ask:test:lifecycle",
    now: () => 100,
  });
  const started = recorder.append({
    kind: "turn.started",
    producer: "helix_adapter",
    status: "started",
  });
  const route = recorder.append({
    kind: "route.committed",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: started.event_id,
    route_commit_id: "route:test",
    capability_ids: ["scholarly.fetch_full_text"],
  });
  recorder.append({
    kind: "capability.admitted",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: route.event_id,
    route_commit_id: "route:test",
    capability_id: "scholarly.fetch_full_text",
  });
  const call = recorder.append({
    kind: "tool.call.started",
    producer: "codex_runtime",
    status: "started",
    route_commit_id: "route:test",
    call_id: "call:paper",
    capability_id: "scholarly.fetch_full_text",
  });
  const completed = recorder.append({
    kind: "tool.call.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: call.event_id,
    route_commit_id: "route:test",
    call_id: "call:paper",
    capability_id: "scholarly.fetch_full_text",
    observation_refs: ["paper:full-text:1"],
  });
  const reentered = recorder.append({
    kind: "observation.reentered",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: completed.event_id,
    route_commit_id: "route:test",
    call_id: "call:paper",
    capability_id: "scholarly.fetch_full_text",
    observation_refs: ["paper:full-text:1"],
  });
  const message = recorder.append({
    kind: "agent.message.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: reentered.event_id,
    native_item_id: "agent-message:1",
    message_sha256: "hash:test",
  });
  const runtime = recorder.append({
    kind: "runtime.turn.completed",
    producer: "codex_runtime",
    status: "succeeded",
    causation_id: message.event_id,
    native_turn_id: "native-turn:1",
  });
  const eligibility = recorder.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_policy",
    status: "succeeded",
    causation_id: runtime.event_id,
    terminal_kind: "agent_provider_terminal_candidate",
    terminal_eligible: true,
  });
  recorder.append({
    kind: "turn.completed",
    producer: "helix_adapter",
    status: "succeeded",
    causation_id: eligibility.event_id,
    terminal_kind: "agent_provider_terminal_candidate",
    terminal_eligible: true,
  });
  return recorder.snapshot();
};

describe("Helix factual turn lifecycle", () => {
  it("reduces a tool observation and post-observation model completion without inference", () => {
    const lifecycle = buildCompletedLifecycle();

    expect(lifecycle).toMatchObject({
      authority: "runtime_event_log",
      scope: "helix_ask_turn",
      reduction: {
        route_commit_id: "route:test",
        admitted_capability_ids: ["scholarly.fetch_full_text"],
        observation_reentry_refs: ["paper:full-text:1"],
        post_observation_reasoning_completed: true,
        runtime_turn_completed: true,
        terminal_event_count: 1,
        terminal_outcome: "completed",
        complete: true,
      },
      integrity: {
        ok: true,
        violations: [],
      },
    });
  });

  it("recomputes authority from events instead of trusting stored projections", () => {
    const lifecycle = buildCompletedLifecycle();
    const verified = readVerifiedHelixTurnLifecycle({
      turnId: lifecycle.turn_id,
      value: {
        ...lifecycle,
        reduction: {
          ...lifecycle.reduction,
          runtime_turn_completed: false,
          post_observation_reasoning_completed: false,
          complete: false,
        },
        integrity: {
          ...lifecycle.integrity,
          ok: true,
          violations: [],
        },
      },
    });

    expect(verified?.reduction).toMatchObject({
      runtime_turn_completed: true,
      post_observation_reasoning_completed: true,
      complete: true,
    });
  });

  it("prefers the verified native Codex event log for runtime facts", () => {
    const nativeLifecycle = {
      ...buildCompletedLifecycle(),
      scope: "codex_native_provider_cycle" as const,
    };
    const invalidOuter = {
      ...buildCompletedLifecycle(),
      events: buildCompletedLifecycle().events.filter(
        (event) => event.kind !== "observation.reentered",
      ),
    };

    const selected = readVerifiedHelixRuntimeLifecycleFromPayload({
      turnId: nativeLifecycle.turn_id,
      payload: {
        turn_lifecycle: invalidOuter,
        native_provider_turn_lifecycle: nativeLifecycle,
      },
    });

    expect(selected).toMatchObject({
      scope: "codex_native_provider_cycle",
      reduction: {
        observation_reentry_refs: ["paper:full-text:1"],
        post_observation_reasoning_completed: true,
      },
    });
  });

  it("rejects a lifecycle whose event history fails recomputed integrity", () => {
    const lifecycle = buildCompletedLifecycle();
    const value = {
      ...lifecycle,
      events: lifecycle.events.filter((event) => event.kind !== "observation.reentered"),
      integrity: { ...lifecycle.integrity, ok: true, violations: [] },
    };

    expect(readVerifiedHelixTurnLifecycle({ turnId: lifecycle.turn_id, value })).toBeNull();
  });

  it("does not treat provider-cycle completion as global terminal authority", () => {
    const lifecycle = {
      ...buildCompletedLifecycle(),
      scope: "codex_native_provider_cycle" as const,
    };
    const audit = auditHelixTurnLifecycleProjection({
      lifecycle,
      projection: {
        evidence_reentry_completed: false,
        followup_reasoning_completed: false,
        terminal_error_code: "solver_continuation_pending",
      },
    });

    expect(audit.mismatches.map((mismatch) => mismatch.code)).toEqual([
      "legacy_evidence_reentry_disagrees_with_runtime",
      "legacy_followup_reasoning_disagrees_with_runtime",
    ]);
  });

  it("identifies legacy solver projections that contradict runtime facts", () => {
    const audit = auditHelixTurnLifecycleProjection({
      lifecycle: buildCompletedLifecycle(),
      projection: {
        evidence_reentry_completed: false,
        followup_reasoning_completed: false,
        provider_solver_completion_observed: true,
        terminal_error_code: "solver_continuation_pending",
        terminal_eligible: true,
        terminal_rejection_reason: null,
      },
    });

    expect(audit.ok).toBe(false);
    expect(audit.mismatches.map((mismatch) => mismatch.code)).toEqual([
      "legacy_evidence_reentry_disagrees_with_runtime",
      "legacy_followup_reasoning_disagrees_with_runtime",
      "continuation_pending_after_runtime_completion",
    ]);
  });

  it("flags a pending capability request projected as a terminal candidate", () => {
    const audit = auditHelixTurnLifecycleProjection({
      lifecycle: buildCompletedLifecycle(),
      projection: {
        provider_terminal_candidate_text:
          'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability_lane_call":{"capability":"scholarly-research.fetch_full_text","source_ref":"lookup:magnetar"}}',
      },
    });

    expect(audit).toMatchObject({
      ok: false,
      mismatches: [{
        code: "pending_lane_request_projected_as_terminal_candidate",
        projection_path: "provider_terminal_candidate.candidate_text_preview",
        lifecycle_value: "capability_lane_request",
        projection_value: "agent_provider_terminal_candidate",
      }],
    });
  });

  it("fails integrity when a completed turn never re-enters a tool observation", () => {
    const recorder = createHelixTurnLifecycleRecorder({ turnId: "ask:test:missing-reentry" });
    const started = recorder.append({
      kind: "turn.started",
      producer: "helix_adapter",
      status: "started",
    });
    const admitted = recorder.append({
      kind: "capability.admitted",
      producer: "helix_policy",
      status: "succeeded",
      causation_id: started.event_id,
      capability_id: "scholarly.fetch_full_text",
    });
    const call = recorder.append({
      kind: "tool.call.started",
      producer: "codex_runtime",
      status: "started",
      causation_id: admitted.event_id,
      call_id: "call:missing-reentry",
      capability_id: "scholarly.fetch_full_text",
    });
    const completed = recorder.append({
      kind: "tool.call.completed",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: call.event_id,
      call_id: "call:missing-reentry",
      capability_id: "scholarly.fetch_full_text",
      observation_refs: ["paper:missing-reentry"],
    });
    const message = recorder.append({
      kind: "agent.message.completed",
      producer: "codex_runtime",
      status: "succeeded",
      causation_id: completed.event_id,
      native_item_id: "agent-message:missing-reentry",
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

    const lifecycle = recorder.snapshot();
    expect(lifecycle.reduction.observation_reentry_refs).toEqual([]);
    expect(lifecycle.integrity.ok).toBe(false);
    expect(lifecycle.integrity.violations).toEqual([
      expect.objectContaining({
        code: "completed_tool_observation_not_reentered",
        call_id: "call:missing-reentry",
      }),
    ]);
  });

  it("rejects runtime completion recorded before the final agent message", () => {
    const recorder = createHelixTurnLifecycleRecorder({ turnId: "ask:test:completion-order" });
    const started = recorder.append({
      kind: "turn.started",
      producer: "helix_adapter",
      status: "started",
    });
    const runtime = recorder.append({
      kind: "runtime.turn.completed",
      producer: "codex_runtime",
      status: "succeeded",
      causation_id: started.event_id,
    });
    const message = recorder.append({
      kind: "agent.message.completed",
      producer: "codex_runtime",
      status: "succeeded",
      causation_id: runtime.event_id,
      native_item_id: "agent-message:late",
    });
    const eligibility = recorder.append({
      kind: "terminal.eligibility.checked",
      producer: "helix_policy",
      status: "succeeded",
      causation_id: message.event_id,
      terminal_eligible: true,
    });
    recorder.append({
      kind: "turn.completed",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: eligibility.event_id,
      terminal_eligible: true,
    });

    const lifecycle = recorder.snapshot();
    expect(lifecycle.integrity.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "runtime_completion_without_prior_agent_message",
        event_id: runtime.event_id,
      }),
    ]));
    expect(readVerifiedHelixTurnLifecycle({
      turnId: lifecycle.turn_id,
      value: lifecycle,
    })).toBeNull();
  });

  it("rejects execution without prior capability admission", () => {
    const recorder = createHelixTurnLifecycleRecorder({ turnId: "ask:test:missing-admission" });
    const started = recorder.append({
      kind: "turn.started",
      producer: "helix_adapter",
      status: "started",
    });
    recorder.append({
      kind: "tool.call.started",
      producer: "codex_runtime",
      status: "started",
      causation_id: started.event_id,
      call_id: "call:unadmitted",
      capability_id: "visual_analysis.inspect_image_region",
    });

    expect(recorder.snapshot().integrity.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "tool_call_started_without_admission",
        call_id: "call:unadmitted",
      }),
    ]));
  });

  it("rejects re-entry under observation identities different from the tool result", () => {
    const recorder = createHelixTurnLifecycleRecorder({ turnId: "ask:test:ref-mismatch" });
    const started = recorder.append({
      kind: "turn.started",
      producer: "helix_adapter",
      status: "started",
    });
    const admitted = recorder.append({
      kind: "capability.admitted",
      producer: "helix_policy",
      status: "succeeded",
      causation_id: started.event_id,
      capability_id: "scholarly-research.fetch_full_text",
    });
    const call = recorder.append({
      kind: "tool.call.started",
      producer: "codex_runtime",
      status: "started",
      causation_id: admitted.event_id,
      call_id: "call:paper",
      capability_id: "scholarly-research.fetch_full_text",
    });
    const completed = recorder.append({
      kind: "tool.call.completed",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: call.event_id,
      call_id: "call:paper",
      capability_id: "scholarly-research.fetch_full_text",
      observation_refs: ["paper:expected"],
    });
    recorder.append({
      kind: "observation.reentered",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: completed.event_id,
      call_id: "call:paper",
      capability_id: "scholarly-research.fetch_full_text",
      observation_refs: ["paper:different"],
    });

    expect(recorder.snapshot().integrity.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "observation_reentry_ref_mismatch",
        call_id: "call:paper",
      }),
    ]));
  });
});
