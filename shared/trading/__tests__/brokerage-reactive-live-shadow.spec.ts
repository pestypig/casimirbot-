import { describe, expect, it } from "vitest";
import fixture from
  "../../../fixtures/brokerage-reactive-simulation/spy-no-lookahead.v1.json";
import {
  HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  type HelixBrokerageObservation,
} from "../../helix-brokerage-environment";
import {
  HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA,
  helixBrokerageReactiveLiveShadowAcceptanceRequestSchema,
  helixBrokerageReactiveLiveShadowProjectionSchema,
  helixBrokerageReactiveLiveShadowStartSchema,
} from "../brokerage-reactive-live-shadow";
import { normalizeRobinhoodQuoteForReactiveShadow } from
  "../../../server/services/trading/brokerage-reactive-live-shadow-store";

const safety = {
  owner_private_source: true as const,
  source_read_only: true as const,
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

const projection = () => helixBrokerageReactiveLiveShadowProjectionSchema.parse({
  schema: HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA,
  shadow_session_id: "brokerage_shadow:test",
  client_shadow_session_id: "client_shadow:test",
  controller_run_id: "brokerage_controller:test",
  controller_profile_id: "resident.brokerage.simulated_execution.v1",
  owner_profile_id: fixture.manifest.owner_profile_id,
  connection_id: fixture.manifest.connection_id,
  room_id: fixture.manifest.room_id,
  environment_binding_id: fixture.manifest.environment_binding_id,
  paper_account_id: fixture.manifest.paper_account_id,
  producer_epoch_ref: fixture.manifest.producer_epoch_ref,
  strategy_manifest_id: fixture.manifest.strategy_manifest_id,
  strategy_artifact_hash: fixture.manifest.strategy_artifact_hash,
  symbol: "SPY",
  status: "active",
  terminal_reason: null,
  poll_interval_ms: 1_000,
  maximum_polls: 2,
  polls_attempted: 1,
  polls_succeeded: 0,
  consecutive_failures: 0,
  maximum_consecutive_failures: 2,
  regular_session_observations: 0,
  degraded_timing_observations: 0,
  last_observation_id: null,
  last_source_output_hash: null,
  last_error_code: null,
  poll_in_flight: true,
  next_poll_at: "2026-08-28T14:00:01.000Z",
  session_expires_at: "2026-08-28T14:00:10.000Z",
  started_at: "2026-08-28T14:00:00.000Z",
  updated_at: "2026-08-28T14:00:00.000Z",
  terminal_at: null,
  poll_duration: { samples: 0, minimum_ms: null, maximum_ms: null, mean_ms: null },
  provider_to_arrival: { samples: 0, minimum_ms: null, maximum_ms: null, mean_ms: null },
  arrival_to_decision: { samples: 0, minimum_ms: null, maximum_ms: null, mean_ms: null },
  end_to_end: { samples: 0, minimum_ms: null, maximum_ms: null, mean_ms: null },
  bounded_polling: true,
  private_model_loop_present: false,
  ...safety,
});

const source = (data: unknown): HelixBrokerageObservation => ({
  schema: HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  ok: true,
  observation_id: "brokerage_observation:live-shadow",
  connection_id: fixture.manifest.connection_id,
  room_id: fixture.manifest.room_id,
  provider: "robinhood",
  environment_domain: "brokerage",
  upstream_tool: "get_equity_quotes",
  capability_id: "brokerage.robinhood.market_data.read",
  producer_epoch_ref: fixture.manifest.producer_epoch_ref,
  observed_at: "2026-08-28T14:00:00.000Z",
  freshness_state: "fresh",
  data,
  input_hash: `sha256:${"1".repeat(64)}`,
  output_hash: `sha256:${"2".repeat(64)}`,
  redaction_count: 0,
  truncated: false,
  read_only: true,
  live_order_execution_enabled: false,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

describe("brokerage reactive live shadow R3 contract", () => {
  it("freezes a finite bounded polling request", () => {
    expect(helixBrokerageReactiveLiveShadowStartSchema.parse({
      client_shadow_session_id: "client_shadow:test",
      symbol: "SPY",
      poll_interval_ms: 1_000,
      maximum_polls: 2,
      maximum_consecutive_failures: 2,
      earnings_observation_id: null,
      session_expires_at: "2026-08-28T14:00:10.000Z",
    })).toMatchObject({ maximum_polls: 2 });
    expect(() => helixBrokerageReactiveLiveShadowStartSchema.parse({
      client_shadow_session_id: "client_shadow:test",
      symbol: "SPY",
      poll_interval_ms: 999,
      maximum_polls: 2,
      maximum_consecutive_failures: 2,
      earnings_observation_id: null,
      session_expires_at: "2026-08-28T14:00:10.000Z",
    })).toThrow();
  });

  it("requires at least two unique sessions for R3 qualification", () => {
    expect(helixBrokerageReactiveLiveShadowAcceptanceRequestSchema.parse({
      shadow_session_ids: ["shadow:day-one", "shadow:day-two"],
    })).toMatchObject({
      shadow_session_ids: ["shadow:day-one", "shadow:day-two"],
    });
    expect(() => helixBrokerageReactiveLiveShadowAcceptanceRequestSchema.parse({
      shadow_session_ids: ["shadow:day-one", "shadow:day-one"],
    })).toThrow(/unique/u);
  });

  it("normalizes only explicit provider quote and clock fields", () => {
    const result = normalizeRobinhoodQuoteForReactiveShadow({
      source: source({ quotes: [{
        symbol: "SPY",
        bid_price: "640.10",
        ask_price: "640.12",
        last_trade_price: "640.11",
        previous_close: "638.00",
        market_session: "regular",
        updated_at: "2026-08-28T14:00:00.100Z",
      }] }),
      projection: projection(),
      pollSequence: 1,
      readCompletedAt: "2026-08-28T14:00:00.300Z",
      processingAt: "2026-08-28T14:00:00.310Z",
    });
    expect(result.providerTimeBasis).toBe("provider_payload");
    expect(result.observation).toMatchObject({
      bid_micros: 640_100_000,
      ask_micros: 640_120_000,
      last_micros: 640_110_000,
      prior_close_micros: 638_000_000,
      market_session: "regular",
      simulation_input_only: true,
      live_order_execution_enabled: false,
    });
  });

  it("reports an arrival proxy when provider time is absent", () => {
    const result = normalizeRobinhoodQuoteForReactiveShadow({
      source: source({ quotes: [{
        symbol: "SPY", bid: "640.10", ask: "640.12",
        last: "640.11", prior_close: "638.00",
        market_session: "post",
      }] }),
      projection: projection(),
      pollSequence: 1,
      readCompletedAt: "2026-08-28T20:00:00.300Z",
      processingAt: "2026-08-28T20:00:00.310Z",
    });
    expect(result.providerTimeBasis).toBe("arrival_proxy");
    expect(result.observation.provider_observed_at)
      .toBe("2026-08-28T20:00:00.300Z");
  });

  it("rejects a quote when session or prior-close evidence is absent", () => {
    expect(() => normalizeRobinhoodQuoteForReactiveShadow({
      source: source({ quotes: [{
        symbol: "SPY", bid: "640.10", ask: "640.12", last: "640.11",
      }] }),
      projection: projection(),
      pollSequence: 1,
      readCompletedAt: "2026-08-28T14:00:00.300Z",
      processingAt: "2026-08-28T14:00:00.310Z",
    })).toThrow(/lacks an explicit valid/u);
  });
});
