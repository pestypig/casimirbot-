import { describe, expect, it } from "vitest";
import {
  buildHelixEnvironmentTemporalPlan,
  buildHelixEnvironmentTemporalPlanEvent,
  buildHelixEnvironmentAffordanceFrontier,
  buildHelixEnvironmentFeedbackLatency,
  buildHelixEnvironmentInterruptReceipt,
  canonicalEnvironmentTimeValue,
  evaluateHelixEnvironmentPlanCurrentness,
  helixEnvironmentAffordanceFrontierSchema,
  helixEnvironmentFeedbackLatencySchema,
  helixEnvironmentInterruptReceiptSchema,
  helixEnvironmentTemporalPlanSchema,
  helixEnvironmentTimeSha256,
  reduceHelixEnvironmentTemporalPlanEvents,
  HelixEnvironmentPlanReductionError,
  type HelixEnvironmentTemporalPlanEvent,
  type HelixEnvironmentTemporalPlan,
  type HelixEnvironmentTimeIdentity,
} from "../helix-environment-time";

const identity = (): HelixEnvironmentTimeIdentity => ({
  environment_id: "environment:minecraft:test",
  source_id: "source:fabric:test",
  subject_id: "player:test",
  producer_epoch: "epoch:fabric:7",
  authority_id: "authority:player:7",
  authority_revision: 3,
  goal_id: "goal:walk:test",
  goal_revision: 4,
  observation_revision: 12,
  affordance_revision: 9,
});

const clocks = (sequence = 100, elapsed = 1_000) => ({
  environment: {
    kind: "tick" as const,
    sequence,
    resolution_unit: "minecraft_tick",
    nominal_units_per_second: 20,
  },
  monotonic: {
    origin_id: "process:fabric:7",
    elapsed_ms: elapsed,
  },
  audit_at: "2026-09-03T12:00:00.000Z",
});

const buildPlan = (patch: Record<string, unknown> = {}) =>
  buildHelixEnvironmentTemporalPlan({
    plan_id: "temporal_plan:test:1",
    previous_plan_id: null,
    previous_plan_hash: null,
    identity: identity(),
    clocks: clocks(),
    adapter_id: "minecraft.fabric_client",
    adapter_version: "0.4.0",
    compiler_version: "environment_time_minecraft:1",
    resident_executor_version: "native_fabric_concurrent:1",
    start_node_id: "node:walk",
    maximum_total_units: 60,
    monotonic_deadline_elapsed_ms: 5_000,
    watermarks: {
      decision_unit: 30,
      stop_unit: 45,
      committed_through_unit: 60,
      stabilization_node_id: "node:checkpoint",
    },
    lanes: [
      {
        lane_id: "lane:locomotion",
        priority: 100,
        resource_keys: ["resource:locomotion"],
      },
    ],
    effect_ceiling: { "effect:player_motion": 1 },
    nodes: [
      {
        kind: "action",
        node_id: "node:walk",
        lane_id: "lane:locomotion",
        capability_id: "com.casimirbot.minecraft.player.walk",
        capability_version: "1",
        arguments: { direction: "forward", duration_ticks: 20 },
        required_resources: ["resource:locomotion"],
        timing: {
          earliest_start_unit: 0,
          latest_start_unit: 20,
          maximum_duration_units: 20,
        },
        preconditions: [
          { kind: "boolean_equals", fact_key: "player.grounded", expected: true },
        ],
        completion_conditions: [
          {
            kind: "number_compare",
            fact_key: "player.distance_blocks",
            operator: "gte",
            value: 1,
          },
        ],
        abort_guards: [
          { kind: "boolean_equals", fact_key: "hazard.critical", expected: true },
        ],
        effect_budget: { "effect:player_motion": 1 },
        on_success_node_id: "node:checkpoint",
        on_failure_node_id: "node:failed",
        on_timeout_node_id: "node:failed",
      },
      {
        kind: "checkpoint",
        node_id: "node:checkpoint",
        checkpoint_id: "checkpoint:post_walk",
        required_evidence_kinds: ["player_pose"],
        condition: {
          kind: "adapter_condition",
          condition_id: "minecraft.player_grounded",
          arguments: { expected: true },
        },
        wait_up_to_units: 5,
        on_satisfied_node_id: "node:success",
        on_timeout_node_id: "node:failed",
      },
      {
        kind: "terminal",
        node_id: "node:success",
        outcome: "succeeded",
        reason_code: "postcondition_satisfied",
      },
      {
        kind: "terminal",
        node_id: "node:failed",
        outcome: "failed",
        reason_code: "postcondition_failed",
      },
    ],
    ...patch,
  } as Parameters<typeof buildHelixEnvironmentTemporalPlan>[0]);

const rehash = (plan: HelixEnvironmentTemporalPlan) => {
  const { plan_hash: _ignored, ...withoutHash } = plan;
  return {
    ...withoutHash,
    plan_hash: helixEnvironmentTimeSha256(withoutHash),
  };
};

describe("provider-neutral environment time contract", () => {
  it("canonicalizes object keys and binds semantic plan content to one hash", () => {
    expect(canonicalEnvironmentTimeValue({ z: 1, a: { y: 2, x: 3 } })).toEqual({
      a: { x: 3, y: 2 },
      z: 1,
    });
    expect(helixEnvironmentTimeSha256({ b: 2, a: 1 })).toBe(
      helixEnvironmentTimeSha256({ a: 1, b: 2 }),
    );
    expect(helixEnvironmentTemporalPlanSchema.parse(buildPlan())).toMatchObject({
      automatic_replay: false,
      adapter_strategy_authority: false,
      answer_authority: false,
      terminal_eligible: false,
    });
  });

  it("rejects cycles, unreachable nodes and missing targets", () => {
    const plan = buildPlan();
    const cyclic = structuredClone(plan);
    cyclic.nodes[2] = {
      kind: "checkpoint",
      node_id: "node:success",
      checkpoint_id: "checkpoint:cycle",
      required_evidence_kinds: ["player_pose"],
      condition: {
        kind: "adapter_condition",
        condition_id: "minecraft.player_grounded",
        arguments: { expected: true },
      },
      wait_up_to_units: 5,
      on_satisfied_node_id: "node:walk",
      on_timeout_node_id: "node:failed",
    };
    expect(helixEnvironmentTemporalPlanSchema.safeParse(rehash(cyclic)).success).toBe(false);

    const missing = structuredClone(plan);
    if (missing.nodes[0].kind !== "action") throw new Error("fixture drift");
    missing.nodes[0].on_success_node_id = "node:absent";
    expect(helixEnvironmentTemporalPlanSchema.safeParse(rehash(missing)).success).toBe(false);
  });

  it("rejects undeclared resources, effect overflow and invalid watermarks", () => {
    const plan = buildPlan();
    const resource = structuredClone(plan);
    if (resource.nodes[0].kind !== "action") throw new Error("fixture drift");
    resource.nodes[0].required_resources = ["resource:main_hand"];
    expect(helixEnvironmentTemporalPlanSchema.safeParse(rehash(resource)).success).toBe(false);

    const effects = structuredClone(plan);
    if (effects.nodes[0].kind !== "action") throw new Error("fixture drift");
    effects.nodes[0].effect_budget = { "effect:player_motion": 2 };
    expect(helixEnvironmentTemporalPlanSchema.safeParse(rehash(effects)).success).toBe(false);

    expect(() => buildPlan({
      watermarks: {
        decision_unit: 50,
        stop_unit: 40,
        committed_through_unit: 60,
        stabilization_node_id: "node:checkpoint",
      },
    })).toThrow(/Watermarks/);
  });

  it.each([
    ["epoch", { producer_epoch: "epoch:fabric:8" }],
    ["authority", { authority_revision: 4 }],
    ["goal", { goal_revision: 5 }],
    ["observation", { observation_revision: 13 }],
    ["affordance", { affordance_revision: 10 }],
  ])("fails currentness after %s drift", (_label, identityPatch) => {
    expect(
      evaluateHelixEnvironmentPlanCurrentness({
        plan: buildPlan(),
        current_identity: { ...identity(), ...identityPatch },
        monotonic_elapsed_ms: 1_500,
      }),
    ).toMatchObject({ current: false, reason: "identity_stale" });
  });

  it("uses monotonic time for expiry instead of audit time", () => {
    expect(
      evaluateHelixEnvironmentPlanCurrentness({
        plan: buildPlan(),
        current_identity: identity(),
        monotonic_elapsed_ms: 5_000,
      }),
    ).toEqual({
      current: false,
      reason: "deadline_expired",
      mismatch_fields: ["monotonic_deadline_elapsed_ms"],
    });
  });

  it("keeps affordance frontiers deterministic and non-authoritative", () => {
    const frontier = {
      schema: "environment.affordance_frontier.v1",
      frontier_id: "frontier:test:9",
      identity: identity(),
      clocks: clocks(),
      expires_at_environment_sequence: 105,
      entries: [
        {
          capability_id: "com.casimirbot.minecraft.player.walk",
          capability_version: "1",
          subject_id: "player:test",
          state: "available_now",
          reason_codes: ["grounded_and_clear"],
          required_authority_ids: ["authority:player:7"],
          held_resource_keys: [],
          parameter_bounds: { maximum_ticks: 20 },
          missing_observation_kinds: [],
          evidence_probe_capability_ids: [],
        },
      ],
      newly_available_capability_ids: ["com.casimirbot.minecraft.player.walk"],
      newly_blocked_capability_ids: [],
      materially_changed_capability_ids: [],
      expired_capability_ids: [],
      strategy_recommendation_included: false,
      execution_authority: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    };
    expect(helixEnvironmentAffordanceFrontierSchema.parse(frontier)).toEqual(frontier);
    expect(
      helixEnvironmentAffordanceFrontierSchema.safeParse({
        ...frontier,
        strategy_recommendation_included: true,
      }).success,
    ).toBe(false);
  });

  it("records steering as a non-authoritative replan observation", () => {
    const receipt = {
      schema: "environment.interrupt_receipt.v1",
      interrupt_id: "interrupt:user:1",
      plan_id: "temporal_plan:test:1",
      plan_hash: buildPlan().plan_hash,
      identity: identity(),
      kind: "user_steering",
      priority: "user_intent",
      detected_clocks: clocks(110, 2_000),
      preempted_clocks: clocks(111, 2_050),
      affected_node_ids: ["node:walk"],
      released_resource_keys: ["resource:locomotion"],
      performed_effects: { "effect:player_motion": 1 },
      checkpoint_id: "checkpoint:steering",
      next_decision: "replan",
      controls_released: true,
      execution_authority: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    };
    expect(helixEnvironmentInterruptReceiptSchema.parse(receipt)).toMatchObject({
      next_decision: "replan",
      execution_authority: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(
      helixEnvironmentInterruptReceiptSchema.safeParse({
        ...receipt,
        next_decision: "resume",
      }).success,
    ).toBe(false);
  });

  it("separates speech finalization from the post-finalization latency spans", () => {
    expect(
      helixEnvironmentFeedbackLatencySchema.parse({
        schema: "environment.feedback_latency.v1",
        trace_id: "latency:test:1",
        identity: identity(),
        spans_ms: {
          manual_input_to_release: null,
          finalized_input_to_task_available: 40,
          pickup_to_acknowledgement: 20,
          arbitration_to_plan_stop: 50,
          observation_to_replacement_proposal: 800,
          proposal_to_admission: 25,
          admission_to_first_execution_unit: 45,
          final_observation_to_presentation: 60,
        },
        speech_capture_and_finalization_ms: 900,
        provider_id: "provider:openai_realtime",
        credential_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      }),
    ).toMatchObject({
      speech_capture_and_finalization_ms: 900,
      spans_ms: { finalized_input_to_task_available: 40 },
      terminal_eligible: false,
    });
  });

  it("derives each progressive-affordance transition once without strategy authority", () => {
    const entry = {
      capability_id: "capability:move",
      capability_version: "1",
      subject_id: identity().subject_id,
      state: "blocked" as const,
      reason_codes: ["ground_unknown"],
      required_authority_ids: [identity().authority_id],
      held_resource_keys: [],
      parameter_bounds: {},
      missing_observation_kinds: ["ground_state"],
      evidence_probe_capability_ids: ["capability:observe_ground"],
    };
    const first = buildHelixEnvironmentAffordanceFrontier({
      frontier_id: "frontier:1",
      identity: identity(),
      clocks: clocks(),
      expires_at_environment_sequence: 110,
      entries: [entry],
    });
    const nextIdentity = { ...identity(), observation_revision: 13, affordance_revision: 10 };
    const second = buildHelixEnvironmentAffordanceFrontier({
      frontier_id: "frontier:2",
      identity: nextIdentity,
      clocks: clocks(101, 1_050),
      expires_at_environment_sequence: 111,
      previous_frontier: first,
      entries: [{
        ...entry,
        state: "available_now",
        reason_codes: ["grounded"],
        missing_observation_kinds: [],
      }],
    });
    expect(first.newly_blocked_capability_ids).toEqual(["capability:move"]);
    expect(second.newly_available_capability_ids).toEqual(["capability:move"]);
    expect(second.materially_changed_capability_ids).toEqual(["capability:move"]);
    expect(second).toMatchObject({
      strategy_recommendation_included: false,
      execution_authority: false,
      answer_authority: false,
    });
    expect(() => buildHelixEnvironmentAffordanceFrontier({
      frontier_id: "frontier:bad",
      identity: { ...nextIdentity, affordance_revision: 12 },
      clocks: clocks(102, 1_100),
      expires_at_environment_sequence: 112,
      previous_frontier: second,
      entries: [],
    })).toThrow("exactly one");
  });

  it("builds authority-reducing interrupt receipts from fixed priority policy", () => {
    const receipt = buildHelixEnvironmentInterruptReceipt({
      interrupt_id: "interrupt:steering:1",
      plan_id: "plan:1",
      plan_hash: `sha256:${"a".repeat(64)}`,
      identity: identity(),
      kind: "user_steering",
      detected_clocks: clocks(101, 1_050),
      preempted_clocks: clocks(102, 1_080),
      affected_node_ids: ["node:walk"],
      released_resource_keys: ["resource:locomotion"],
      performed_effects: { "effect:player_motion": 1 },
      checkpoint_id: "checkpoint:post_walk",
    });
    expect(receipt).toMatchObject({
      priority: "user_intent",
      next_decision: "replan",
      controls_released: true,
      execution_authority: false,
      terminal_eligible: false,
    });
  });

  it("computes feedback spans while keeping speech finalization separate", () => {
    const latency = buildHelixEnvironmentFeedbackLatency({
      trace_id: "latency:builder:1",
      identity: identity(),
      provider_id: "provider:realtime",
      marks_ms: {
        speech_capture_started: 100,
        input_finalized: 900,
        task_available: 940,
        steering_picked_up: 950,
        steering_acknowledged: 970,
        replacement_proposed: 1_400,
        proposal_admitted: 1_425,
        first_execution_unit: 1_470,
      },
    });
    expect(latency.speech_capture_and_finalization_ms).toBe(800);
    expect(latency.spans_ms).toMatchObject({
      finalized_input_to_task_available: 40,
      pickup_to_acknowledgement: 20,
      proposal_to_admission: 25,
      admission_to_first_execution_unit: 45,
    });
    expect(() => buildHelixEnvironmentFeedbackLatency({
      trace_id: "latency:bad",
      identity: identity(),
      provider_id: null,
      marks_ms: { input_finalized: 10, task_available: 9 },
    })).toThrow("cannot regress");
  });

  it("reduces an append-only plan lifecycle without granting terminal authority", () => {
    const plan = buildPlan();
    const events: HelixEnvironmentTemporalPlanEvent[] = [];
    const append = (
      payload: Parameters<typeof buildHelixEnvironmentTemporalPlanEvent>[0]["payload"],
      sequence: number,
    ) => {
      events.push(
        buildHelixEnvironmentTemporalPlanEvent({
          event_id: `temporal_plan_event:test:${events.length + 1}`,
          plan_id: plan.plan_id,
          sequence: events.length + 1,
          previous_event_hash: events.at(-1)?.event_hash ?? null,
          identity: identity(),
          clocks: clocks(sequence, 1_000 + events.length * 50),
          payload,
        }),
      );
    };
    append({ kind: "plan_admitted", plan_hash: plan.plan_hash }, 100);
    append({ kind: "execution_started" }, 101);
    append(
      {
        kind: "checkpoint_settled",
        checkpoint_id: "checkpoint:post_walk",
        observation_revision: 13,
        affordance_revision: 10,
        evidence_refs: ["evidence:post_walk:1"],
      },
      120,
    );
    append(
      {
        kind: "plan_settled",
        outcome: "succeeded",
        performed_effects: { "effect:player_motion": 1 },
        controls_released: true,
        resources_released: true,
        evidence_refs: ["evidence:post_walk:1"],
      },
      121,
    );

    expect(reduceHelixEnvironmentTemporalPlanEvents(events)).toMatchObject({
      state: "settled",
      latest_checkpoint_id: "checkpoint:post_walk",
      latest_observation_revision: 13,
      latest_affordance_revision: 10,
      performed_effects: { "effect:player_motion": 1 },
      controls_may_be_asserted: false,
      answer_authority: false,
      terminal_eligible: false,
    });
  });

  it.each([
    [
      "hash chain",
      (events: HelixEnvironmentTemporalPlanEvent[]) => {
        events[1].previous_event_hash = null;
      },
      "environment_plan_event_chain_invalid",
    ],
    [
      "identity drift",
      (events: HelixEnvironmentTemporalPlanEvent[]) => {
        events[1].identity.producer_epoch = "epoch:fabric:8";
      },
      "environment_plan_identity_drift",
    ],
    [
      "clock regression",
      (events: HelixEnvironmentTemporalPlanEvent[]) => {
        events[1].clocks.environment.sequence = 99;
        const { event_hash: _ignored, ...withoutHash } = events[1];
        events[1].event_hash = helixEnvironmentTimeSha256(withoutHash);
      },
      "environment_plan_clock_regressed",
    ],
  ])("rejects lifecycle %s", (_label, mutate, code) => {
    const plan = buildPlan();
    const first = buildHelixEnvironmentTemporalPlanEvent({
      event_id: "temporal_plan_event:test:1",
      plan_id: plan.plan_id,
      sequence: 1,
      previous_event_hash: null,
      identity: identity(),
      clocks: clocks(100, 1_000),
      payload: { kind: "plan_admitted", plan_hash: plan.plan_hash },
    });
    const second = buildHelixEnvironmentTemporalPlanEvent({
      event_id: "temporal_plan_event:test:2",
      plan_id: plan.plan_id,
      sequence: 2,
      previous_event_hash: first.event_hash,
      identity: identity(),
      clocks: clocks(101, 1_050),
      payload: { kind: "execution_started" },
    });
    const events = structuredClone([first, second]);
    mutate(events);
    try {
      reduceHelixEnvironmentTemporalPlanEvents(events);
      throw new Error("expected reduction failure");
    } catch (error) {
      expect(error).toBeInstanceOf(HelixEnvironmentPlanReductionError);
      expect((error as HelixEnvironmentPlanReductionError).code).toBe(code);
    }
  });
});
