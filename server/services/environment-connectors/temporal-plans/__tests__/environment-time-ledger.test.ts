import { describe, expect, it } from "vitest";
import {
  buildHelixEnvironmentTemporalPlan,
  type HelixEnvironmentTemporalPlan,
  type HelixEnvironmentTimeIdentity,
} from "@shared/helix-environment-time";
import {
  EnvironmentTimeLedgerError,
  EnvironmentTimePlanLedger,
} from "../environment-time-ledger";

const identity = (patch: Partial<HelixEnvironmentTimeIdentity> = {}) => ({
  environment_id: "environment:test",
  source_id: "source:test",
  subject_id: "subject:test",
  producer_epoch: "epoch:test:1",
  authority_id: "authority:test:1",
  authority_revision: 1,
  goal_id: "goal:test:1",
  goal_revision: 1,
  observation_revision: 1,
  affordance_revision: 1,
  ...patch,
});

const clocks = (sequence: number, elapsed_ms: number) => ({
  environment: {
    kind: "tick" as const,
    sequence,
    resolution_unit: "test_tick",
    nominal_units_per_second: 20,
  },
  monotonic: { origin_id: "process:test:1", elapsed_ms },
  audit_at: "2026-09-03T12:00:00.000Z",
});

const plan = (input: {
  plan_id?: string;
  previous?: HelixEnvironmentTemporalPlan | null;
  identity?: HelixEnvironmentTimeIdentity;
  direction?: string;
  node_namespace?: string;
} = {}) =>
  buildHelixEnvironmentTemporalPlan((() => {
    const node = (id: string) => `${input.node_namespace ?? "node"}:${id}`;
    return {
    plan_id: input.plan_id ?? "temporal_plan:test:1",
    previous_plan_id: input.previous?.plan_id ?? null,
    previous_plan_hash: input.previous?.plan_hash ?? null,
    identity: input.identity ?? identity(),
    clocks: clocks(10, 100),
    adapter_id: "adapter:test",
    adapter_version: "1",
    compiler_version: "compiler:test:1",
    resident_executor_version: "executor:test:1",
    start_node_id: node("action"),
    maximum_total_units: 20,
    monotonic_deadline_elapsed_ms: 2_000,
    watermarks: {
      decision_unit: 10,
      stop_unit: 15,
      committed_through_unit: 20,
      stabilization_node_id: node("checkpoint"),
    },
    lanes: [
      {
        lane_id: "lane:motion",
        priority: 10,
        resource_keys: ["resource:motion"],
      },
    ],
    effect_ceiling: { "effect:motion": 1 },
    nodes: [
      {
        kind: "action",
        node_id: node("action"),
        lane_id: "lane:motion",
        capability_id: "capability:move",
        capability_version: "1",
        arguments: { direction: input.direction ?? "forward" },
        required_resources: ["resource:motion"],
        timing: {
          earliest_start_unit: 0,
          latest_start_unit: 5,
          maximum_duration_units: 5,
        },
        preconditions: [],
        completion_conditions: [
          { kind: "boolean_equals", fact_key: "motion.complete", expected: true },
        ],
        abort_guards: [],
        effect_budget: { "effect:motion": 1 },
        on_success_node_id: node("checkpoint"),
        on_failure_node_id: node("failed"),
        on_timeout_node_id: node("failed"),
      },
      {
        kind: "checkpoint",
        node_id: node("checkpoint"),
        checkpoint_id: "checkpoint:test:1",
        required_evidence_kinds: ["actor_pose"],
        condition: {
          kind: "adapter_condition",
          condition_id: "test.motion_complete",
          arguments: { expected: true },
        },
        wait_up_to_units: 5,
        on_satisfied_node_id: node("terminal"),
        on_timeout_node_id: node("failed"),
      },
      {
        kind: "terminal",
        node_id: node("terminal"),
        outcome: "succeeded",
        reason_code: "complete",
      },
      {
        kind: "terminal",
        node_id: node("failed"),
        outcome: "failed",
        reason_code: "failed",
      },
    ],
  };
  })());

const expectCode = (fn: () => unknown, code: string) => {
  try {
    fn();
    throw new Error("expected ledger error");
  } catch (error) {
    expect(error).toBeInstanceOf(EnvironmentTimeLedgerError);
    expect((error as EnvironmentTimeLedgerError).code).toBe(code);
  }
};

describe("EnvironmentTimePlanLedger", () => {
  it("admits idempotently and rejects semantic reuse of a plan id", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const admitted = plan();
    expect(
      ledger.admit({
        plan: admitted,
        current_identity: identity(),
        monotonic_elapsed_ms: 100,
      }),
    ).toMatchObject({ created: true, projection: { state: "admitted" } });
    expect(
      ledger.admit({
        plan: admitted,
        current_identity: identity(),
        monotonic_elapsed_ms: 100,
      }),
    ).toMatchObject({ created: false });
    expectCode(
      () =>
        ledger.admit({
          plan: plan({ direction: "left" }),
          current_identity: identity(),
          monotonic_elapsed_ms: 100,
        }),
      "temporal_plan_idempotency_conflict",
    );
  });

  it.each([
    ["producer epoch", { producer_epoch: "epoch:test:2" }],
    ["authority revision", { authority_revision: 2 }],
    ["observation revision", { observation_revision: 2 }],
    ["affordance revision", { affordance_revision: 2 }],
  ])("fails admission on stale %s", (_name, patch) => {
    const ledger = new EnvironmentTimePlanLedger();
    expectCode(
      () =>
        ledger.admit({
          plan: plan(),
          current_identity: identity(patch),
          monotonic_elapsed_ms: 100,
        }),
      "temporal_plan_identity_stale",
    );
  });

  it("uses the monotonic deadline and exact clock domain", () => {
    const ledger = new EnvironmentTimePlanLedger();
    expectCode(
      () =>
        ledger.admit({
          plan: plan(),
          current_identity: identity(),
          monotonic_elapsed_ms: 2_000,
        }),
      "temporal_plan_deadline_expired",
    );

    const admitted = plan();
    ledger.admit({
      plan: admitted,
      current_identity: identity(),
      monotonic_elapsed_ms: 100,
    });
    expectCode(
      () =>
        ledger.start({
          plan_id: admitted.plan_id,
          clocks: {
            ...clocks(11, 150),
            monotonic: { origin_id: "process:other", elapsed_ms: 150 },
          },
        }),
      "temporal_plan_clock_domain_mismatch",
    );
  });

  it("records a successful checkpointed lifecycle append-only", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const admitted = plan();
    ledger.admit({
      plan: admitted,
      current_identity: identity(),
      monotonic_elapsed_ms: 100,
    });
    ledger.start({ plan_id: admitted.plan_id, clocks: clocks(11, 150) });
    ledger.checkpoint({
      plan_id: admitted.plan_id,
      clocks: clocks(15, 350),
      checkpoint_id: "checkpoint:test:1",
      observation_revision: 2,
      affordance_revision: 2,
      evidence_refs: ["evidence:test:1"],
    });
    ledger.settle({
      plan_id: admitted.plan_id,
      clocks: clocks(16, 400),
      outcome: "succeeded",
      performed_effects: { "effect:motion": 1 },
      evidence_refs: ["evidence:test:1"],
    });
    expect(ledger.get(admitted.plan_id)).toMatchObject({
      events: [{ sequence: 1 }, { sequence: 2 }, { sequence: 3 }, { sequence: 4 }],
      projection: {
        state: "settled",
        latest_checkpoint_id: "checkpoint:test:1",
        latest_observation_revision: 2,
        controls_may_be_asserted: false,
        answer_authority: false,
      },
    });
    expectCode(
      () => ledger.start({ plan_id: admitted.plan_id, clocks: clocks(17, 450) }),
      "temporal_plan_transition_invalid",
    );
  });

  it("stabilizes on runway exhaustion and cancels through an authority-reducing event", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const admitted = plan();
    ledger.admit({ plan: admitted, current_identity: identity(), monotonic_elapsed_ms: 100 });
    ledger.start({ plan_id: admitted.plan_id, clocks: clocks(11, 150) });
    ledger.noteRunwayLow({ plan_id: admitted.plan_id, clocks: clocks(17, 450), remaining_units: 3 });
    ledger.requireStabilization({
      plan_id: admitted.plan_id,
      clocks: clocks(18, 500),
      stabilization_node_id: "node:checkpoint",
      reason_code: "extension_not_admitted_before_stop_watermark",
    });
    expect(ledger.get(admitted.plan_id).projection).toMatchObject({
      state: "stabilizing",
      controls_may_be_asserted: true,
    });
    ledger.requestCancel({
      plan_id: admitted.plan_id,
      clocks: clocks(19, 550),
      reason_code: "user_cancel",
    });
    ledger.settle({
      plan_id: admitted.plan_id,
      clocks: clocks(20, 600),
      outcome: "canceled",
      performed_effects: { "effect:motion": 1 },
      evidence_refs: ["evidence:cancel:1"],
    });
    expect(ledger.get(admitted.plan_id).projection).toMatchObject({
      state: "settled",
      controls_may_be_asserted: false,
      performed_effects: { "effect:motion": 1 },
    });
  });

  it("requires a successor to bind the exact predecessor and stable authority identity", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const first = plan();
    ledger.admit({ plan: first, current_identity: identity(), monotonic_elapsed_ms: 100 });
    const nextIdentity = identity({ observation_revision: 2, affordance_revision: 2 });
    const successor = plan({
      plan_id: "temporal_plan:test:2",
      previous: first,
      identity: nextIdentity,
    });
    expect(
      ledger.assertCompatibleSuccessor({
        predecessor_plan_id: first.plan_id,
        successor,
        current_identity: nextIdentity,
        monotonic_elapsed_ms: 150,
      }),
    ).toEqual(successor);

    const wrongEpoch = plan({
      plan_id: "temporal_plan:test:3",
      previous: first,
      identity: identity({ producer_epoch: "epoch:test:2" }),
    });
    expectCode(
      () =>
        ledger.assertCompatibleSuccessor({
          predecessor_plan_id: first.plan_id,
          successor: wrongEpoch,
          current_identity: wrongEpoch.identity,
          monotonic_elapsed_ms: 150,
        }),
      "temporal_plan_identity_stale",
    );
  });

  it("appends an exact checkpoint-bound successor idempotently", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const first = plan();
    ledger.admit({ plan: first, current_identity: identity(), monotonic_elapsed_ms: 100 });
    ledger.start({ plan_id: first.plan_id, clocks: clocks(11, 150) });
    ledger.checkpoint({
      plan_id: first.plan_id,
      clocks: clocks(15, 350),
      checkpoint_id: "checkpoint:test:1",
      observation_revision: 2,
      affordance_revision: 2,
      evidence_refs: ["evidence:test:1"],
    });
    const current = identity({ observation_revision: 2, affordance_revision: 2 });
    const successor = plan({
      plan_id: "temporal_plan:test:2",
      previous: first,
      identity: current,
    });
    const committed = ledger.commitExtension({
      predecessor_plan_id: first.plan_id,
      successor,
      after_checkpoint_id: "checkpoint:test:1",
      current_identity: current,
      monotonic_elapsed_ms: 400,
      clocks: clocks(16, 400),
    });
    expect(committed).toMatchObject({
      created: true,
      event: { payload: { kind: "extension_appended" } },
      successor: { created: true, projection: { state: "admitted" } },
    });
    expect(
      ledger.commitExtension({
        predecessor_plan_id: first.plan_id,
        successor,
        after_checkpoint_id: "checkpoint:test:1",
        current_identity: current,
        monotonic_elapsed_ms: 400,
        clocks: clocks(16, 400),
      }),
    ).toMatchObject({ created: false, successor: { created: false } });
  });

  it("rejects an extension not bound to the latest checkpoint revisions", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const first = plan();
    ledger.admit({ plan: first, current_identity: identity(), monotonic_elapsed_ms: 100 });
    ledger.start({ plan_id: first.plan_id, clocks: clocks(11, 150) });
    ledger.checkpoint({
      plan_id: first.plan_id,
      clocks: clocks(15, 350),
      checkpoint_id: "checkpoint:test:1",
      observation_revision: 2,
      affordance_revision: 2,
      evidence_refs: ["evidence:test:1"],
    });
    const stale = plan({
      plan_id: "temporal_plan:test:stale",
      previous: first,
      identity: identity(),
    });
    expectCode(
      () =>
        ledger.commitExtension({
          predecessor_plan_id: first.plan_id,
          successor: stale,
          after_checkpoint_id: "checkpoint:test:1",
          current_identity: identity(),
          monotonic_elapsed_ms: 400,
          clocks: clocks(16, 400),
        }),
      "temporal_plan_checkpoint_mismatch",
    );
  });

  it("replaces only known unexecuted nodes and preserves performed effects", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const first = plan();
    ledger.admit({ plan: first, current_identity: identity(), monotonic_elapsed_ms: 100 });
    ledger.start({ plan_id: first.plan_id, clocks: clocks(11, 150) });
    const replacement = plan({
      plan_id: "temporal_plan:test:replacement",
      previous: first,
      direction: "right",
    });
    const committed = ledger.commitReplacement({
      predecessor_plan_id: first.plan_id,
      replacement,
      current_identity: identity(),
      monotonic_elapsed_ms: 200,
      clocks: clocks(12, 200),
      canceled_unexecuted_node_ids: ["node:checkpoint", "node:terminal"],
      executed_node_ids: ["node:action"],
    });
    expect(committed).toMatchObject({
      created: true,
      event: {
        payload: {
          kind: "replacement_committed",
          performed_effects_preserved: true,
        },
      },
      replacement: { projection: { state: "admitted" } },
    });
    expectCode(
      () =>
        ledger.commitReplacement({
          predecessor_plan_id: first.plan_id,
          replacement: plan({
            plan_id: "temporal_plan:test:replacement:bad",
            previous: first,
          }),
          current_identity: identity(),
          monotonic_elapsed_ms: 250,
          clocks: clocks(13, 250),
          canceled_unexecuted_node_ids: ["node:action"],
          executed_node_ids: ["node:action"],
        }),
      "temporal_plan_replacement_invalid",
    );
  });

  it("recovers after reconnect only from a settled checkpoint and never reuses performed node ids", () => {
    const ledger = new EnvironmentTimePlanLedger();
    const first = plan();
    ledger.admit({ plan: first, current_identity: identity(), monotonic_elapsed_ms: 100 });
    ledger.start({ plan_id: first.plan_id, clocks: clocks(11, 150) });
    ledger.checkpoint({
      plan_id: first.plan_id,
      clocks: clocks(15, 350),
      checkpoint_id: "checkpoint:test:1",
      observation_revision: 2,
      affordance_revision: 2,
      evidence_refs: ["evidence:checkpoint:1"],
    });
    ledger.settle({
      plan_id: first.plan_id,
      clocks: clocks(16, 400),
      outcome: "interrupted",
      performed_effects: { "effect:motion": 1 },
      evidence_refs: ["evidence:checkpoint:1"],
    });
    const freshIdentity = identity({
      producer_epoch: "epoch:test:2",
      authority_id: "authority:test:2",
      authority_revision: 2,
      observation_revision: 3,
      affordance_revision: 3,
    });
    const successor = plan({
      plan_id: "temporal_plan:test:reconnect",
      previous: first,
      identity: freshIdentity,
      node_namespace: "reconnect",
    });
    expect(ledger.admitCheckpointRecovery({
      predecessor_plan_id: first.plan_id,
      successor,
      checkpoint_id: "checkpoint:test:1",
      performed_node_ids: ["node:action"],
      current_identity: freshIdentity,
      monotonic_elapsed_ms: 500,
    })).toMatchObject({ created: true, projection: { state: "admitted" } });

    expectCode(() => ledger.admitCheckpointRecovery({
      predecessor_plan_id: first.plan_id,
      successor: plan({
        plan_id: "temporal_plan:test:replay",
        previous: first,
        identity: freshIdentity,
      }),
      checkpoint_id: "checkpoint:test:1",
      performed_node_ids: ["node:action"],
      current_identity: freshIdentity,
      monotonic_elapsed_ms: 500,
    }), "temporal_plan_recovery_invalid");
  });
});
