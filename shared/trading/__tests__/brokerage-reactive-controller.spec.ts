import { describe, expect, it } from "vitest";
import fixture from
  "../../../fixtures/brokerage-reactive-simulation/spy-no-lookahead.v1.json";
import {
  HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
  helixBrokerageReactiveControllerCycleReceiptSchema,
  helixBrokerageReactiveControllerProjectionSchema,
  helixBrokerageReactiveControllerStartSchema,
} from "../brokerage-reactive-controller";
import {
  createBrokerageReactiveDecision,
  runDeterministicBrokerageReactiveReplay,
} from "../brokerage-reactive-simulation";

const safety = {
  simulated: true as const,
  provider_order_tool_calls_made: 0 as const,
  provider_mutation_attempted: false as const,
  live_order_execution_enabled: false as const,
  credential_included: false as const,
  account_numbers_included: false as const,
  raw_provider_payload_included: false as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
};

const activeRun = () => ({
  schema: HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
  controller_run_id: "brokerage_controller:test",
  client_controller_id: "client_controller:test",
  controller_profile_id: "resident.brokerage.simulated_execution.v1" as const,
  controller_profile_hash: fixture.manifest.controller_profile_hash,
  strategy_manifest_id: fixture.manifest.strategy_manifest_id,
  strategy_artifact_hash: fixture.manifest.strategy_artifact_hash,
  owner_profile_id: fixture.manifest.owner_profile_id,
  connection_id: fixture.manifest.connection_id,
  room_id: fixture.manifest.room_id,
  environment_binding_id: fixture.manifest.environment_binding_id,
  paper_account_id: fixture.manifest.paper_account_id,
  producer_epoch_ref: fixture.manifest.producer_epoch_ref,
  status: "active" as const,
  maximum_cycles: 3,
  processed_cycles: 0,
  unresolved_effect_timeout_ms: 1_000,
  last_sequence: null,
  last_arrival_time: null,
  last_observation_id: null,
  entry_already_proposed: false,
  new_simulated_risk_locked: false,
  controller_lease_released: false,
  fresh_snapshot_required: false,
  released_simulated_order_count: 0,
  released_reservation_cents: 0,
  terminal_reason: null,
  next_observation_deadline_at: "2026-08-28T14:00:02.000Z",
  controller_deadline_at: "2026-08-28T14:00:10.000Z",
  lease_expires_at: "2026-08-28T14:00:15.000Z",
  manifest_expires_at: fixture.manifest.manifest_expires_at,
  started_at: "2026-08-28T14:00:00.000Z",
  updated_at: "2026-08-28T14:00:00.000Z",
  terminal_at: null,
  current_event_sequence: 0,
  latest_event_hash: null,
  finite_scheduler: true as const,
  independent_watchdog: true as const,
  private_model_loop_present: false as const,
  ...safety,
});

describe("brokerage reactive controller R2 contract", () => {
  it("accepts only a finite manifest-bound lease", () => {
    expect(helixBrokerageReactiveControllerStartSchema.parse({
      client_controller_id: "client_controller:test",
      manifest: fixture.manifest,
      maximum_cycles: 3,
      unresolved_effect_timeout_ms: 1_000,
      controller_deadline_at: "2026-08-28T14:00:10.000Z",
      lease_expires_at: "2026-08-28T14:00:15.000Z",
    })).toMatchObject({ maximum_cycles: 3 });
    expect(() => helixBrokerageReactiveControllerStartSchema.parse({
      client_controller_id: "client_controller:test",
      manifest: fixture.manifest,
      maximum_cycles: 0,
      unresolved_effect_timeout_ms: 1_000,
      controller_deadline_at: "2026-08-28T14:00:10.000Z",
      lease_expires_at: "2026-08-28T14:00:15.000Z",
    })).toThrow();
  });

  it("requires every terminal path to release the lease", () => {
    expect(helixBrokerageReactiveControllerProjectionSchema.parse(
      activeRun(),
    ).controller_lease_released).toBe(false);
    expect(() => helixBrokerageReactiveControllerProjectionSchema.parse({
      ...activeRun(),
      status: "emergency_stopped",
      terminal_reason: "emergency_stop",
      terminal_at: "2026-08-28T14:00:01.000Z",
      controller_lease_released: false,
    })).toThrow(/terminal controller state/u);
    expect(helixBrokerageReactiveControllerProjectionSchema.parse({
      ...activeRun(),
      status: "emergency_stopped",
      terminal_reason: "emergency_stop",
      terminal_at: "2026-08-28T14:00:01.000Z",
      new_simulated_risk_locked: true,
      controller_lease_released: true,
    })).toMatchObject({
      status: "emergency_stopped",
      controller_lease_released: true,
      private_model_loop_present: false,
      provider_order_tool_calls_made: 0,
    });
  });

  it("makes an incremental resident decision identical to the replay prefix", () => {
    const incremental = createBrokerageReactiveDecision({
      manifest: fixture.manifest,
      observation: fixture.observations[0],
      previousSequence: null,
      previousArrivalTime: null,
      historyLength: 0,
      entryAlreadyProposed: false,
    });
    expect(incremental).toEqual(
      runDeterministicBrokerageReactiveReplay({
        manifest: fixture.manifest,
        observations: [fixture.observations[0]],
      }).receipts[0],
    );
  });

  it("rejects a receipt that hides terminal resource state or invents authority", () => {
    const decision = createBrokerageReactiveDecision({
      manifest: fixture.manifest,
      observation: fixture.observations[0],
      previousSequence: null,
      previousArrivalTime: null,
      historyLength: 0,
      entryAlreadyProposed: false,
    });
    const receipt = {
      schema: HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
      operation: "brokerage.reactive_controller.process_observation",
      controller_run: activeRun(),
      decision_receipt: decision,
      arbiter_receipt: null,
      duplicate_replay: false,
      effect_resolved: true,
      resource_release_verified: false,
      ...safety,
    };
    expect(helixBrokerageReactiveControllerCycleReceiptSchema.parse(receipt))
      .toMatchObject({ answer_authority: false, terminal_eligible: false });
    expect(() => helixBrokerageReactiveControllerCycleReceiptSchema.parse({
      ...receipt,
      live_order_execution_enabled: true,
    })).toThrow();
  });
});
