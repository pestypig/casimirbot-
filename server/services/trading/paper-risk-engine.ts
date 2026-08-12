import crypto from "node:crypto";
import {
  helixPaperAccountStateSchema,
  helixPaperTradeCandidateSchema,
  helixTradingRiskDecisionSchema,
  helixTradingRiskPolicySchema,
  type HelixPaperAccountState,
  type HelixPaperTradeCandidate,
  type HelixTradingRiskDecision,
  type HelixTradingRiskPolicy,
  type HelixTradingRiskReason,
} from "@shared/trading/risk-contract";

const ceilRatio = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.ceil(numerator / denominator) : Number.MAX_SAFE_INTEGER;

const equityLimit = (
  absoluteCents: number,
  equityCents: number,
  equityBps: number,
): number => Math.min(
  absoluteCents,
  Math.floor((equityCents * equityBps) / 10_000),
);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const hashInput = (input: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(input)))
    .digest("hex")}`;

const addReason = (
  reasons: HelixTradingRiskReason[],
  reason: HelixTradingRiskReason,
): void => {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
};

export const evaluatePaperTradeRisk = (input: {
  policy: HelixTradingRiskPolicy;
  candidate: HelixPaperTradeCandidate;
  account: HelixPaperAccountState;
  now?: Date;
  decisionId?: string;
}): HelixTradingRiskDecision => {
  const policy = helixTradingRiskPolicySchema.parse(input.policy);
  const candidate = helixPaperTradeCandidateSchema.parse(input.candidate);
  const account = helixPaperAccountStateSchema.parse(input.account);
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new Error("paper risk evaluation requires a valid clock");
  }

  const reasons: HelixTradingRiskReason[] = [];
  const quoteTime = new Date(candidate.quote_observed_at).getTime();
  const quoteAgeMs = now.getTime() - quoteTime;
  const currentDailyLossCents = Math.max(
    0,
    -(account.realized_pnl_cents + account.unrealized_pnl_cents),
  );
  const positionLimitCents = equityLimit(
    policy.max_position_cents,
    account.account_equity_cents,
    policy.max_position_equity_bps,
  );
  const riskPerTradeLimitCents = equityLimit(
    policy.max_risk_per_trade_cents,
    account.account_equity_cents,
    policy.max_risk_per_trade_equity_bps,
  );
  const dailyLossLimitCents = equityLimit(
    policy.max_daily_loss_cents,
    account.account_equity_cents,
    policy.max_daily_loss_equity_bps,
  );

  if (account.kill_switch_active) addReason(reasons, "kill_switch_active");
  if (account.account_equity_cents <= 0) {
    addReason(reasons, "account_equity_unavailable");
  }
  if (candidate.market_session !== "regular") {
    addReason(reasons, "market_not_regular");
  }
  if (
    candidate.minutes_since_regular_open <
    policy.no_new_trades_first_minutes
  ) {
    addReason(reasons, "opening_buffer_active");
  }
  if (
    candidate.minutes_until_regular_close <
    policy.no_new_trades_last_minutes
  ) {
    addReason(reasons, "closing_buffer_active");
  }
  if (quoteAgeMs < -policy.max_future_quote_skew_ms) {
    addReason(reasons, "quote_from_future");
  }
  if (quoteAgeMs > policy.max_quote_age_ms) {
    addReason(reasons, "quote_stale");
  }

  let spreadBps: number | null = null;
  let entryDeviationBps: number | null = null;
  if (candidate.ask_micros < candidate.bid_micros) {
    addReason(reasons, "invalid_quote");
  } else {
    const midpointMicros = Math.floor(
      (candidate.ask_micros + candidate.bid_micros) / 2,
    );
    spreadBps = ceilRatio(
      (candidate.ask_micros - candidate.bid_micros) * 10_000,
      midpointMicros,
    );
    entryDeviationBps = ceilRatio(
      Math.abs(candidate.entry_limit_micros - midpointMicros) * 10_000,
      midpointMicros,
    );
    if (spreadBps > policy.max_spread_bps) {
      addReason(reasons, "spread_too_wide");
    }
    if (entryDeviationBps > policy.max_entry_deviation_bps) {
      addReason(reasons, "entry_too_far_from_market");
    }
  }

  let estimatedRiskCents: number | null = null;
  if (candidate.stop_price_micros >= candidate.entry_limit_micros) {
    addReason(reasons, "invalid_long_stop");
  } else {
    estimatedRiskCents = ceilRatio(
      candidate.notional_cents *
        (candidate.entry_limit_micros - candidate.stop_price_micros),
      candidate.entry_limit_micros,
    );
  }

  if (candidate.earnings_status === "unknown") {
    addReason(reasons, "earnings_status_unknown");
  }
  if (
    candidate.earnings_status === "within_blackout" ||
    (candidate.minutes_until_earnings !== null &&
      candidate.minutes_until_earnings >= 0 &&
      candidate.minutes_until_earnings <= policy.earnings_blackout_minutes)
  ) {
    addReason(reasons, "earnings_blackout_active");
  }
  if (currentDailyLossCents >= dailyLossLimitCents) {
    addReason(reasons, "daily_loss_limit_reached");
  }
  if (account.new_trades_today >= policy.max_new_trades_per_day) {
    addReason(reasons, "trade_count_limit_reached");
  }
  if (account.open_symbols.length >= policy.max_open_positions) {
    addReason(reasons, "open_position_limit_reached");
  }
  if (account.consecutive_losses >= policy.max_consecutive_losses) {
    addReason(reasons, "consecutive_loss_limit_reached");
  }
  if (account.open_symbols.includes(candidate.symbol)) {
    addReason(reasons, "averaging_down_forbidden");
  }
  if (candidate.notional_cents > positionLimitCents) {
    addReason(reasons, "position_limit_exceeded");
  }
  if (
    estimatedRiskCents !== null &&
    estimatedRiskCents > riskPerTradeLimitCents
  ) {
    addReason(reasons, "risk_per_trade_limit_exceeded");
  }
  if (candidate.notional_cents > account.buying_power_cents) {
    addReason(reasons, "buying_power_exceeded");
  }

  return helixTradingRiskDecisionSchema.parse({
    schema: "helix.trading_risk.v1",
    decision_id: input.decisionId ?? `trading_risk:${crypto.randomUUID()}`,
    candidate_id: candidate.candidate_id,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    mode: "paper",
    verdict: reasons.length === 0 ? "accepted" : "rejected",
    reasons,
    calculated: {
      quote_age_ms: quoteAgeMs,
      spread_bps: spreadBps,
      entry_deviation_bps: entryDeviationBps,
      estimated_risk_cents: estimatedRiskCents,
      position_limit_cents: positionLimitCents,
      risk_per_trade_limit_cents: riskPerTradeLimitCents,
      daily_loss_limit_cents: dailyLossLimitCents,
      current_daily_loss_cents: currentDailyLossCents,
    },
    evaluated_at: now.toISOString(),
    input_hash: hashInput({ policy, candidate, account }),
    read_only_observations_required: true,
    live_order_execution_enabled: false,
    answer_authority: false,
  });
};
