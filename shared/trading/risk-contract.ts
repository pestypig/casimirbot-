import { z } from "zod";

export const HELIX_TRADING_RISK_SCHEMA = "helix.trading_risk.v1" as const;

const cents = z.number().int().min(0).max(100_000_000);
const signedCents = z.number().int().min(-100_000_000).max(100_000_000);
const priceMicros = z.number().int().positive().max(10_000_000_000);
const basisPoints = z.number().int().min(0).max(10_000);
const symbol = z.string().trim().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u);
const sha256Ref = z.string().regex(/^sha256:[a-f0-9]{64}$/u);

export const helixTradingRiskPolicySchema = z.object({
  schema: z.literal(HELIX_TRADING_RISK_SCHEMA),
  policy_id: z.string().min(1).max(160),
  policy_version: z.number().int().positive(),
  mode: z.literal("paper"),
  long_equities_only: z.literal(true),
  limit_orders_only: z.literal(true),
  allow_margin: z.literal(false),
  allow_options: z.literal(false),
  allow_extended_hours: z.literal(false),
  allow_averaging_down: z.literal(false),
  require_manual_live_approval: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  max_position_cents: cents,
  max_position_equity_bps: basisPoints,
  max_risk_per_trade_cents: cents,
  max_risk_per_trade_equity_bps: basisPoints,
  max_daily_loss_cents: cents,
  max_daily_loss_equity_bps: basisPoints,
  max_new_trades_per_day: z.number().int().min(0).max(100),
  max_open_positions: z.number().int().min(0).max(100),
  max_consecutive_losses: z.number().int().min(0).max(100),
  max_spread_bps: basisPoints,
  max_entry_deviation_bps: basisPoints,
  max_quote_age_ms: z.number().int().positive().max(300_000),
  max_future_quote_skew_ms: z.number().int().min(0).max(60_000),
  no_new_trades_first_minutes: z.number().int().min(0).max(180),
  no_new_trades_last_minutes: z.number().int().min(0).max(180),
  earnings_blackout_minutes: z.number().int().min(0).max(43_200),
}).strict();

export type HelixTradingRiskPolicy = z.infer<
  typeof helixTradingRiskPolicySchema
>;

export const DEFAULT_HELIX_PAPER_RISK_POLICY: HelixTradingRiskPolicy = {
  schema: HELIX_TRADING_RISK_SCHEMA,
  policy_id: "helix:paper:starter",
  policy_version: 1,
  mode: "paper",
  long_equities_only: true,
  limit_orders_only: true,
  allow_margin: false,
  allow_options: false,
  allow_extended_hours: false,
  allow_averaging_down: false,
  require_manual_live_approval: true,
  live_order_execution_enabled: false,
  max_position_cents: 5_000,
  max_position_equity_bps: 2_000,
  max_risk_per_trade_cents: 350,
  max_risk_per_trade_equity_bps: 50,
  max_daily_loss_cents: 700,
  max_daily_loss_equity_bps: 200,
  max_new_trades_per_day: 2,
  max_open_positions: 1,
  max_consecutive_losses: 2,
  max_spread_bps: 50,
  max_entry_deviation_bps: 100,
  max_quote_age_ms: 30_000,
  max_future_quote_skew_ms: 5_000,
  no_new_trades_first_minutes: 5,
  no_new_trades_last_minutes: 10,
  earnings_blackout_minutes: 1_440,
};

export const helixPaperTradeCandidateSchema = z.object({
  schema: z.literal(HELIX_TRADING_RISK_SCHEMA),
  candidate_id: z.string().min(1).max(160),
  room_id: z.string().min(1).max(160),
  connection_id: z.string().min(1).max(160),
  symbol,
  asset_type: z.literal("equity"),
  side: z.literal("buy"),
  order_type: z.literal("limit"),
  notional_cents: cents,
  entry_limit_micros: priceMicros,
  stop_price_micros: priceMicros,
  bid_micros: priceMicros,
  ask_micros: priceMicros,
  quote_observed_at: z.string().datetime({ offset: true }),
  market_session: z.enum(["regular", "pre", "post", "closed"]),
  minutes_since_regular_open: z.number().int().min(-1_440).max(1_440),
  minutes_until_regular_close: z.number().int().min(-1_440).max(1_440),
  earnings_status: z.enum(["clear", "within_blackout", "unknown"]),
  minutes_until_earnings: z.number().int().min(-525_600).max(525_600).nullable(),
  strategy_version_ref: sha256Ref,
  source_observation_ids: z.array(z.string().min(1).max(160)).min(1).max(32),
}).strict();

export type HelixPaperTradeCandidate = z.infer<
  typeof helixPaperTradeCandidateSchema
>;

export const helixPaperAccountStateSchema = z.object({
  schema: z.literal(HELIX_TRADING_RISK_SCHEMA),
  trading_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  account_equity_cents: cents,
  buying_power_cents: cents,
  realized_pnl_cents: signedCents,
  unrealized_pnl_cents: signedCents,
  new_trades_today: z.number().int().min(0).max(10_000),
  open_symbols: z.array(symbol).max(1_000),
  consecutive_losses: z.number().int().min(0).max(10_000),
  kill_switch_active: z.boolean(),
  kill_switch_reason: z.string().trim().min(1).max(500).nullable(),
}).strict();

export type HelixPaperAccountState = z.infer<
  typeof helixPaperAccountStateSchema
>;

export const HELIX_TRADING_RISK_REASONS = [
  "kill_switch_active",
  "account_equity_unavailable",
  "market_not_regular",
  "opening_buffer_active",
  "closing_buffer_active",
  "quote_from_future",
  "quote_stale",
  "invalid_quote",
  "spread_too_wide",
  "entry_too_far_from_market",
  "invalid_long_stop",
  "earnings_status_unknown",
  "earnings_blackout_active",
  "daily_loss_limit_reached",
  "trade_count_limit_reached",
  "open_position_limit_reached",
  "consecutive_loss_limit_reached",
  "averaging_down_forbidden",
  "position_limit_exceeded",
  "risk_per_trade_limit_exceeded",
  "buying_power_exceeded",
] as const;

export type HelixTradingRiskReason =
  (typeof HELIX_TRADING_RISK_REASONS)[number];

export const helixTradingRiskDecisionSchema = z.object({
  schema: z.literal(HELIX_TRADING_RISK_SCHEMA),
  decision_id: z.string().min(1).max(160),
  candidate_id: z.string().min(1).max(160),
  policy_id: z.string().min(1).max(160),
  policy_version: z.number().int().positive(),
  mode: z.literal("paper"),
  verdict: z.enum(["accepted", "rejected"]),
  reasons: z.array(z.enum(HELIX_TRADING_RISK_REASONS)),
  calculated: z.object({
    quote_age_ms: z.number().int(),
    spread_bps: z.number().int().min(0).nullable(),
    entry_deviation_bps: z.number().int().min(0).nullable(),
    estimated_risk_cents: cents.nullable(),
    position_limit_cents: cents,
    risk_per_trade_limit_cents: cents,
    daily_loss_limit_cents: cents,
    current_daily_loss_cents: cents,
  }).strict(),
  evaluated_at: z.string().datetime({ offset: true }),
  input_hash: sha256Ref,
  read_only_observations_required: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export type HelixTradingRiskDecision = z.infer<
  typeof helixTradingRiskDecisionSchema
>;
