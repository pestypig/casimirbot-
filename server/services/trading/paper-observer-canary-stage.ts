import crypto from "node:crypto";
import type { HelixPaperOrder } from "@shared/trading/paper-contract";
import type { HelixTradingRiskDecision } from "@shared/trading/risk-contract";
import { readSharedRealtimeRoomDatabase } from
  "../helix-ask/realtime-room/room-store/database";
import { submitAcceptedPaperEntry } from "./paper-execution-store";
import { readPaperQuoteEvidence } from "./paper-market-evidence";
import { PaperTradingError } from "./paper-trading-errors";
import {
  evaluateAndRecordPaperTradeCandidate,
  getPaperTradingAccountById,
} from "./paper-trading-store";
import { readUsMarketClock } from "./us-market-clock";

type EarningsEvidenceRow = {
  observation_id: string;
  upstream_tool: string;
  capability_id: string;
  status: string;
  producer_epoch_ref: string;
  audit_output_hash: string | null;
  evidence_output_hash: string;
  normalized_data: unknown;
  observed_at: string | Date;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const digest = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256")
    .update(JSON.stringify(canonicalize(value))).digest("hex")}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

export const requireResolvedNoEarningsEvidence = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  observationId: string;
  symbol: string;
  producerEpochRef: string;
  now: Date;
}): Promise<void> => {
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = await db.query<EarningsEvidenceRow>(
    `SELECT a.observation_id, a.upstream_tool, a.capability_id, a.status,
            a.producer_epoch_ref,
            a.output_hash AS audit_output_hash,
            e.output_hash AS evidence_output_hash, e.normalized_data,
            e.observed_at
       FROM helix_brokerage_read_audit a
       JOIN helix_brokerage_observation_evidence e
         ON e.observation_id = a.observation_id
      WHERE a.observation_id = $1 AND a.owner_profile_id = $2
        AND a.connection_id = $3 AND a.room_id = $4
      LIMIT 1;`,
    [input.observationId, input.ownerProfileId, input.connectionId, input.roomId],
  );
  const row = rows[0];
  const ageMs = row
    ? input.now.getTime() - new Date(row.observed_at).getTime()
    : Number.NaN;
  if (!row || row.status !== "succeeded" ||
      row.upstream_tool !== "get_earnings_results" ||
      row.capability_id !== "brokerage.robinhood.market_data.read" ||
      row.producer_epoch_ref !== input.producerEpochRef ||
      !row.audit_output_hash ||
      row.audit_output_hash !== row.evidence_output_hash ||
      !Number.isFinite(ageMs) || ageMs < -5_000 || ageMs > 5 * 60_000) {
    throw new PaperTradingError(
      "paper_source_observation_invalid", 409,
      "A fresh, matching Robinhood earnings observation is required.",
    );
  }
  const root = asRecord(row.normalized_data);
  const data = asRecord(root?.data);
  const results = data?.results;
  const notFound = Array.isArray(data?.not_found) ? data.not_found : [];
  const symbol = input.symbol.toUpperCase();
  if (!Array.isArray(results) || results.length > 0 ||
      notFound.some((entry) => String(entry).toUpperCase() === symbol)) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The paper observer canary requires resolved evidence with no earnings events.",
    );
  }
};

export type PaperObserverCanaryStageDependencies = {
  readAccount: typeof getPaperTradingAccountById;
  readQuoteEvidence: typeof readPaperQuoteEvidence;
  requireNoEarningsEvidence: typeof requireResolvedNoEarningsEvidence;
  evaluateCandidate: typeof evaluateAndRecordPaperTradeCandidate;
  submitEntry: typeof submitAcceptedPaperEntry;
  readMarketClock: typeof readUsMarketClock;
};

const defaultDependencies: PaperObserverCanaryStageDependencies = {
  readAccount: getPaperTradingAccountById,
  readQuoteEvidence: readPaperQuoteEvidence,
  requireNoEarningsEvidence: requireResolvedNoEarningsEvidence,
  evaluateCandidate: evaluateAndRecordPaperTradeCandidate,
  submitEntry: submitAcceptedPaperEntry,
  readMarketClock: readUsMarketClock,
};

export type PaperObserverCanaryStageReceipt = {
  operation: "paper.observer_canary.stage";
  decision: HelixTradingRiskDecision;
  order: HelixPaperOrder;
  quote_observation_id: string;
  earnings_observation_id: string;
  simulated: true;
  provider_mutation_attempted: false;
  live_order_execution_enabled: false;
  answer_authority: false;
};

export const stagePaperObserverCanary = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  accountId: string;
  symbol: string;
  notionalCents: number;
  quoteObservationId: string;
  earningsObservationId: string;
  clientCanaryId: string;
  now?: Date;
}, dependencies: PaperObserverCanaryStageDependencies = defaultDependencies):
Promise<PaperObserverCanaryStageReceipt> => {
  const now = input.now ?? new Date();
  const account = await dependencies.readAccount({
    ownerProfileId: input.ownerProfileId,
    accountId: input.accountId,
  });
  if (!account || account.connection_id !== input.connectionId ||
      account.room_id !== input.roomId) {
    throw new PaperTradingError(
      "paper_account_not_found", 404,
      "The paper canary account does not belong to this connection and room.",
    );
  }
  const symbol = input.symbol.toUpperCase();
  const quote = await dependencies.readQuoteEvidence({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    observationId: input.quoteObservationId,
    symbol,
    now,
    maxAgeMs: account.policy.max_quote_age_ms,
    maxFutureSkewMs: account.policy.max_future_quote_skew_ms,
  });
  await dependencies.requireNoEarningsEvidence({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    observationId: input.earningsObservationId,
    symbol,
    producerEpochRef: quote.producerEpochRef,
    now,
  });
  const marketClock = dependencies.readMarketClock(new Date(quote.observedAt));
  const entryLimitMicros = Math.floor((quote.askMicros * 10_050) / 10_000);
  const stopPriceMicros = Math.floor((entryLimitMicros * 9_900) / 10_000);
  const strategyVersionRef = digest({
    profile: "paper_observer_canary",
    version: 1,
    entry_buffer_bps: 50,
    stop_distance_bps: 100,
    earnings_policy: "resolved_no_events",
  });
  const decision = await dependencies.evaluateCandidate({
    ownerProfileId: input.ownerProfileId,
    accountId: input.accountId,
    candidate: {
      schema: "helix.trading_risk.v1",
      candidate_id: `paper_canary:${input.clientCanaryId}`,
      room_id: input.roomId,
      connection_id: input.connectionId,
      symbol,
      asset_type: "equity",
      side: "buy",
      order_type: "limit",
      notional_cents: input.notionalCents,
      entry_limit_micros: entryLimitMicros,
      stop_price_micros: stopPriceMicros,
      bid_micros: quote.bidMicros,
      ask_micros: quote.askMicros,
      quote_observed_at: quote.observedAt,
      market_session: marketClock.session,
      minutes_since_regular_open: marketClock.minutesSinceRegularOpen,
      minutes_until_regular_close: marketClock.minutesUntilRegularClose,
      earnings_status: "clear",
      minutes_until_earnings: null,
      strategy_version_ref: strategyVersionRef,
      source_observation_ids: [
        input.quoteObservationId,
        input.earningsObservationId,
      ],
    },
    now,
  });
  if (decision.verdict !== "accepted") {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      `The deterministic paper canary was rejected: ${decision.reasons.join(", ")}.`,
    );
  }
  const order = await dependencies.submitEntry({
    ownerProfileId: input.ownerProfileId,
    accountId: input.accountId,
    riskDecisionId: decision.decision_id,
    clientOrderId: `paper_canary_order:${input.clientCanaryId}`,
    now,
  });
  return {
    operation: "paper.observer_canary.stage",
    decision,
    order,
    quote_observation_id: input.quoteObservationId,
    earnings_observation_id: input.earningsObservationId,
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    answer_authority: false,
  };
};
