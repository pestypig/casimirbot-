import { describe, expect, it } from "vitest";
import fixture from "../../../fixtures/brokerage-reactive-simulation/spy-no-lookahead.v1.json";
import {
  HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE,
  HelixBrokerageReactiveReplayError,
  helixBrokerageReactiveMarketObservationSchema,
  helixBrokerageReactiveSimulationProfileSchema,
  helixBrokerageReactiveStrategyManifestSchema,
  runDeterministicBrokerageReactiveReplay,
} from "../brokerage-reactive-simulation";

describe("brokerage reactive simulation R0 contract", () => {
  it("freezes a bounded local-simulation profile with no provider mutation vocabulary", () => {
    expect(
      helixBrokerageReactiveSimulationProfileSchema.parse(
        HELIX_BROKERAGE_REACTIVE_SIMULATION_PROFILE,
      ),
    ).toMatchObject({
      profile_id: "resident.brokerage.simulated_execution.v1",
      reaction_requirement: "bounded_reflex",
      execution_plane: "local_simulation_ledger",
      provider_mutation_vocabulary: [],
      simulated: true,
      live_order_execution_enabled: false,
      answer_authority: false,
    });
  });

  it("accepts the frozen strategy manifest and rejects authority or identity expansion", () => {
    expect(
      helixBrokerageReactiveStrategyManifestSchema.parse(fixture.manifest),
    ).toMatchObject({
      allowed_symbols: ["SPY"],
      maximum_notional_cents: 500,
      maximum_estimated_risk_cents: 100,
      regular_session_only: true,
      provider_mutation_attempted: false,
    });
    expect(() =>
      helixBrokerageReactiveStrategyManifestSchema.parse({
        ...fixture.manifest,
        allowed_symbols: ["SPY", "SPY"],
      }),
    ).toThrow();
    expect(() =>
      helixBrokerageReactiveStrategyManifestSchema.parse({
        ...fixture.manifest,
        live_order_execution_enabled: true,
      }),
    ).toThrow();
    expect(() =>
      helixBrokerageReactiveStrategyManifestSchema.parse({
        ...fixture.manifest,
        review_equity_order: true,
      }),
    ).toThrow();
  });

  it("produces deterministic prefix-causal decisions with zero provider order calls", () => {
    const first = runDeterministicBrokerageReactiveReplay(fixture);
    const second = runDeterministicBrokerageReactiveReplay(fixture);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      processed_observation_count: 3,
      simulated_entry_proposal_count: 1,
      watchdog_trip_count: 0,
      deterministic: true,
      no_lookahead_enforced: true,
      provider_order_tool_calls_made: 0,
      provider_mutation_attempted: false,
      live_order_execution_enabled: false,
    });
    expect(first.receipts.map((receipt) => receipt.proposal.response)).toEqual([
      "abstain",
      "propose_simulated_limit_entry",
      "abstain",
    ]);
    expect(first.receipts[1]?.proposal.simulated_entry).toMatchObject({
      notional_cents: 500,
      limit_price_micros: 98_810_000,
      estimated_risk_cents: 5,
    });
  });

  it("proves no look-ahead by preserving every prefix receipt when a future quote is appended", () => {
    const prefix = runDeterministicBrokerageReactiveReplay({
      manifest: fixture.manifest,
      observations: fixture.observations.slice(0, 2),
    });
    const full = runDeterministicBrokerageReactiveReplay(fixture);

    expect(full.receipts.slice(0, prefix.receipts.length)).toEqual(
      prefix.receipts,
    );
    expect(prefix.receipts[0]?.available_through_event_time).toBe(
      fixture.observations[0]?.event_time,
    );
    expect(prefix.receipts[1]?.available_through_event_time).toBe(
      fixture.observations[1]?.event_time,
    );
  });

  it("trips the watchdog on a gap and refuses to turn that urgency into provider authority", () => {
    const gapped = {
      ...fixture.observations[1],
      observation_id: "brokerage_observation:spy-gap",
      sequence: 4,
      observation_revision: 4,
      retention_gap_after_sequence: 1,
    };
    const result = runDeterministicBrokerageReactiveReplay({
      manifest: fixture.manifest,
      observations: [fixture.observations[0], gapped],
    });
    expect(result.receipts[1]).toMatchObject({
      proposal: {
        response: "activate_simulated_kill_switch",
        reasons: ["watchdog_intervention"],
        effect_status: "proposal_only",
        provider_mutation_attempted: false,
      },
      watchdog: {
        state: "tripped",
        reasons: ["retention_gap", "sequence_gap"],
        new_simulated_risk_locked: true,
        fresh_snapshot_required: true,
      },
      semantic_wake_eligible: true,
      answer_authority: false,
    });
    expect(result.provider_order_tool_calls_made).toBe(0);
  });

  it("ends a replay at the first watchdog trip until a later stage admits fresh-snapshot recovery", () => {
    const gapped = {
      ...fixture.observations[1],
      observation_id: "brokerage_observation:spy-terminal-gap",
      sequence: 4,
      observation_revision: 4,
      retention_gap_after_sequence: 1,
    };
    const result = runDeterministicBrokerageReactiveReplay({
      manifest: fixture.manifest,
      observations: [
        fixture.observations[0],
        gapped,
        { ...fixture.observations[2], sequence: 5, observation_revision: 5 },
      ],
    });
    expect(result.processed_observation_count).toBe(2);
    expect(result.receipts.at(-1)?.watchdog.state).toBe("tripped");
    expect(result.simulated_entry_proposal_count).toBe(0);
  });

  it("rejects malformed quote chronology and non-monotonic replay input", () => {
    expect(() =>
      helixBrokerageReactiveMarketObservationSchema.parse({
        ...fixture.observations[0],
        processed_at: "2026-08-28T13:59:59.000Z",
      }),
    ).toThrow();

    expect(() =>
      runDeterministicBrokerageReactiveReplay({
        manifest: fixture.manifest,
        observations: [fixture.observations[1], fixture.observations[0]],
      }),
    ).toThrowError(
      expect.objectContaining<Partial<HelixBrokerageReactiveReplayError>>({
        code: "replay_observation_order_invalid",
      }),
    );
  });

  it("rejects a cross-room observation before any proposal is produced", () => {
    expect(() =>
      runDeterministicBrokerageReactiveReplay({
        manifest: fixture.manifest,
        observations: [{
          ...fixture.observations[0],
          room_id: "shared_realtime_room:other",
        }],
      }),
    ).toThrowError(
      expect.objectContaining<Partial<HelixBrokerageReactiveReplayError>>({
        code: "replay_identity_mismatch",
      }),
    );
  });
});
