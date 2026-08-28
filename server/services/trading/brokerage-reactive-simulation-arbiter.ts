import {
  HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
  helixBrokerageReactiveArbiterReceiptSchema,
  helixBrokerageReactiveDecisionReceiptSchema,
  helixBrokerageReactiveStrategyManifestSchema,
  type HelixBrokerageReactiveArbiterReceipt,
} from "@shared/trading/brokerage-reactive-simulation";
import { submitAcceptedPaperEntry } from "./paper-execution-store";
import { readPaperQuoteEvidence } from "./paper-market-evidence";
import {
  requireResolvedNoEarningsEvidence,
} from "./paper-observer-canary-stage";
import { PaperTradingError } from "./paper-trading-errors";
import {
  evaluateAndRecordPaperTradeCandidate,
  getPaperTradingAccountById,
} from "./paper-trading-store";
import { readUsMarketClock } from "./us-market-clock";

export type BrokerageReactiveSimulationArbiterDependencies = {
  readAccount: typeof getPaperTradingAccountById;
  readQuoteEvidence: typeof readPaperQuoteEvidence;
  requireNoEarningsEvidence: typeof requireResolvedNoEarningsEvidence;
  evaluateCandidate: typeof evaluateAndRecordPaperTradeCandidate;
  submitEntry: typeof submitAcceptedPaperEntry;
  readMarketClock: typeof readUsMarketClock;
};

const defaultDependencies: BrokerageReactiveSimulationArbiterDependencies = {
  readAccount: getPaperTradingAccountById,
  readQuoteEvidence: readPaperQuoteEvidence,
  requireNoEarningsEvidence: requireResolvedNoEarningsEvidence,
  evaluateCandidate: evaluateAndRecordPaperTradeCandidate,
  submitEntry: submitAcceptedPaperEntry,
  readMarketClock: readUsMarketClock,
};

const stableSuffix = (value: string): string =>
  value.startsWith("sha256:") ? value.slice(-32) : value.slice(-32);

const assertEqual = (
  condition: boolean,
  code: "paper_candidate_identity_mismatch" | "paper_quote_evidence_invalid",
  message: string,
): void => {
  if (!condition) throw new PaperTradingError(code, 409, message);
};

export const admitBrokerageReactiveSimulationProposal = async (input: {
  manifest: unknown;
  decisionReceipt: unknown;
  earningsObservationId: string;
  reactiveControllerRunId?: string;
  now?: Date;
}, dependencies: BrokerageReactiveSimulationArbiterDependencies =
defaultDependencies): Promise<HelixBrokerageReactiveArbiterReceipt> => {
  const manifest = helixBrokerageReactiveStrategyManifestSchema.parse(
    input.manifest,
  );
  const receipt = helixBrokerageReactiveDecisionReceiptSchema.parse(
    input.decisionReceipt,
  );
  const proposal = receipt.proposal;
  const entry = proposal.simulated_entry;
  const now = input.now ?? new Date();

  assertEqual(
    receipt.strategy_manifest_id === manifest.strategy_manifest_id &&
      receipt.strategy_artifact_hash === manifest.strategy_artifact_hash &&
      receipt.controller_profile_hash === manifest.controller_profile_hash &&
      proposal.strategy_manifest_id === manifest.strategy_manifest_id &&
      proposal.strategy_artifact_hash === manifest.strategy_artifact_hash,
    "paper_candidate_identity_mismatch",
    "The reactive decision does not match the admitted strategy manifest.",
  );
  if (
    receipt.watchdog.state !== "healthy" ||
    proposal.response !== "propose_simulated_limit_entry" ||
    !entry
  ) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted",
      409,
      "Only a healthy simulated limit-entry proposal can reach paper-risk admission.",
    );
  }

  const account = await dependencies.readAccount({
    ownerProfileId: manifest.owner_profile_id,
    accountId: manifest.paper_account_id,
  });
  if (
    !account ||
    account.owner_profile_id !== manifest.owner_profile_id ||
    account.connection_id !== manifest.connection_id ||
    account.room_id !== manifest.room_id ||
    account.account_id !== manifest.paper_account_id
  ) {
    throw new PaperTradingError(
      "paper_account_not_found",
      404,
      "The reactive simulation account identity is not current.",
    );
  }

  const quote = await dependencies.readQuoteEvidence({
    ownerProfileId: manifest.owner_profile_id,
    connectionId: manifest.connection_id,
    roomId: manifest.room_id,
    observationId: receipt.source_observation_id,
    symbol: proposal.symbol,
    now,
    maxAgeMs: Math.min(
      account.policy.max_quote_age_ms,
      manifest.maximum_quote_age_ms,
    ),
    maxFutureSkewMs: account.policy.max_future_quote_skew_ms,
  });
  assertEqual(
    quote.outputHash === receipt.source_output_hash &&
      quote.producerEpochRef === receipt.producer_epoch_ref &&
      quote.producerEpochRef === manifest.producer_epoch_ref,
    "paper_quote_evidence_invalid",
    "The stored quote hash or producer epoch does not match the reactive decision.",
  );
  const expectedStopMicros = Number(
    (BigInt(quote.askMicros) *
      BigInt(10_000 - manifest.protective_exit_policy.stop_distance_bps)) /
      10_000n,
  );
  const expectedRiskCents = Number(
    (BigInt(manifest.maximum_notional_cents) *
      BigInt(manifest.protective_exit_policy.stop_distance_bps) + 9_999n) /
      10_000n,
  );
  assertEqual(
    manifest.allowed_symbols.includes(proposal.symbol) &&
      entry.notional_cents === manifest.maximum_notional_cents &&
      entry.limit_price_micros === quote.askMicros &&
      entry.stop_price_micros === expectedStopMicros &&
      entry.estimated_risk_cents === expectedRiskCents &&
      entry.estimated_risk_cents <= manifest.maximum_estimated_risk_cents,
    "paper_quote_evidence_invalid",
    "The simulated entry parameters do not match the stored quote and strategy manifest.",
  );

  await dependencies.requireNoEarningsEvidence({
    ownerProfileId: manifest.owner_profile_id,
    connectionId: manifest.connection_id,
    roomId: manifest.room_id,
    observationId: input.earningsObservationId,
    symbol: proposal.symbol,
    producerEpochRef: quote.producerEpochRef,
    now,
  });
  const clock = dependencies.readMarketClock(new Date(quote.observedAt));
  const identity = [
    stableSuffix(manifest.strategy_artifact_hash),
    stableSuffix(receipt.source_output_hash),
    String(receipt.source_sequence),
  ].join(":");
  const decision = await dependencies.evaluateCandidate({
    ownerProfileId: manifest.owner_profile_id,
    accountId: manifest.paper_account_id,
    candidate: {
      schema: "helix.trading_risk.v1",
      candidate_id: `reactive_sim_candidate:${identity}`,
      room_id: manifest.room_id,
      connection_id: manifest.connection_id,
      symbol: proposal.symbol,
      asset_type: "equity",
      side: "buy",
      order_type: "limit",
      notional_cents: entry.notional_cents,
      entry_limit_micros: entry.limit_price_micros,
      stop_price_micros: entry.stop_price_micros,
      bid_micros: quote.bidMicros,
      ask_micros: quote.askMicros,
      quote_observed_at: quote.observedAt,
      market_session: clock.session,
      minutes_since_regular_open: clock.minutesSinceRegularOpen,
      minutes_until_regular_close: clock.minutesUntilRegularClose,
      earnings_status: "clear",
      minutes_until_earnings: null,
      strategy_version_ref: manifest.strategy_artifact_hash,
      source_observation_ids: [
        receipt.source_observation_id,
        input.earningsObservationId,
      ],
    },
    now,
  });
  const clientOrderId = `reactive_sim_order:${identity}`;
  const order = decision.verdict === "accepted"
    ? await dependencies.submitEntry({
      ownerProfileId: manifest.owner_profile_id,
      accountId: manifest.paper_account_id,
      riskDecisionId: decision.decision_id,
      clientOrderId,
      executionModel: manifest.simulation_model,
      reactiveControllerRunId: input.reactiveControllerRunId,
      now,
    })
    : null;

  return helixBrokerageReactiveArbiterReceiptSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
    operation: "brokerage.reactive_simulation.admit_proposal",
    strategy_manifest_id: manifest.strategy_manifest_id,
    strategy_artifact_hash: manifest.strategy_artifact_hash,
    decision_id: receipt.decision_id,
    proposal_id: proposal.proposal_id,
    source_observation_id: receipt.source_observation_id,
    source_output_hash: receipt.source_output_hash,
    earnings_observation_id: input.earningsObservationId,
    effect_idempotency_key: clientOrderId,
    disposition: decision.verdict === "accepted"
      ? "simulated_entry_reserved"
      : "risk_rejected",
    risk_decision: decision,
    order,
    provider_order_tool_calls_made: 0,
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};
