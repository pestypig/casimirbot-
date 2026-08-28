import { z } from "zod";

export const HELIX_PAPER_TRADING_SCHEMA = "helix.paper_trading.v1" as const;

const identifier = z.string().trim().min(1).max(160);
const symbol = z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/u);
const cents = z.number().int().min(0).max(100_000_000);
const signedCents = z.number().int().min(-100_000_000).max(100_000_000);
const micros = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const helixPaperExecutionModelSchema = z.object({
  kind: z.literal("quote_touch_v1"),
  deterministic_latency_ms: z.number().int().nonnegative().max(300_000),
  deterministic_slippage_bps: z.number().int().nonnegative().max(10_000),
  partial_fill_policy: z.object({
    kind: z.literal("deterministic_fraction_bps"),
    fill_fraction_bps: z.number().int().positive().max(10_000),
  }).strict(),
}).strict();

export type HelixPaperExecutionModel = z.infer<
  typeof helixPaperExecutionModelSchema
>;

export const helixPaperOrderSchema = z.object({
  schema: z.literal(HELIX_PAPER_TRADING_SCHEMA),
  order_id: identifier,
  client_order_id: identifier,
  account_id: identifier,
  risk_decision_id: identifier.nullable(),
  intent: z.enum(["entry", "exit"]),
  symbol,
  side: z.enum(["buy", "sell"]),
  order_type: z.literal("limit"),
  notional_cents: cents,
  quantity_micros: micros,
  limit_price_micros: micros,
  stop_price_micros: micros.nullable(),
  reserved_cents: cents,
  filled_quantity_micros: z.number().int().nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
  filled_notional_cents: cents,
  execution_model: helixPaperExecutionModelSchema.nullable(),
  status: z.enum(["open", "filled", "cancelled"]),
  fill_state: z.enum(["unfilled", "partially_filled", "filled", "cancelled"]),
  source_observation_id: identifier,
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  filled_at: z.string().datetime({ offset: true }).nullable(),
  cancelled_at: z.string().datetime({ offset: true }).nullable(),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict().superRefine((order, context) => {
  if (order.filled_quantity_micros > order.quantity_micros) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["filled_quantity_micros"],
      message: "Filled quantity cannot exceed the paper order quantity.",
    });
  }
  const expectedFillState = order.status === "open"
    ? order.filled_quantity_micros === 0
      ? "unfilled"
      : "partially_filled"
    : order.status;
  const fillStateValid = order.fill_state === expectedFillState &&
    (order.status === "open"
      ? order.filled_quantity_micros < order.quantity_micros &&
        order.filled_at === null
      : order.status === "filled"
        ? order.filled_quantity_micros === order.quantity_micros &&
          order.filled_at !== null
        : order.filled_quantity_micros < order.quantity_micros);
  if (!fillStateValid) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["status"],
      message: "Paper order status does not match its cumulative fill state.",
    });
  }
});

export type HelixPaperOrder = z.infer<typeof helixPaperOrderSchema>;

export const helixPaperPositionSchema = z.object({
  schema: z.literal(HELIX_PAPER_TRADING_SCHEMA),
  position_id: identifier,
  account_id: identifier,
  symbol,
  quantity_micros: micros,
  average_entry_price_micros: micros,
  stop_price_micros: micros,
  cost_basis_cents: cents,
  last_price_micros: micros,
  market_value_cents: cents,
  unrealized_pnl_cents: signedCents,
  entry_order_id: identifier,
  exit_order_id: identifier.nullable(),
  status: z.enum(["open", "closed"]),
  opened_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  closed_at: z.string().datetime({ offset: true }).nullable(),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export type HelixPaperPosition = z.infer<typeof helixPaperPositionSchema>;

export const helixPaperFillSchema = z.object({
  schema: z.literal(HELIX_PAPER_TRADING_SCHEMA),
  fill_id: identifier,
  order_id: identifier,
  account_id: identifier,
  position_id: identifier.nullable(),
  side: z.enum(["buy", "sell"]),
  symbol,
  quantity_micros: micros,
  price_micros: micros,
  gross_cents: cents,
  source_observation_id: identifier,
  market_observed_at: z.string().datetime({ offset: true }),
  filled_at: z.string().datetime({ offset: true }),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export type HelixPaperFill = z.infer<typeof helixPaperFillSchema>;

export const helixPaperJournalEventSchema = z.object({
  schema: z.literal(HELIX_PAPER_TRADING_SCHEMA),
  event_id: identifier,
  account_id: identifier,
  event_type: z.enum([
    "entry_submitted",
    "entry_filled",
    "entry_cancelled",
    "position_marked",
    "stop_triggered",
    "exit_filled",
  ]),
  subject_ref: identifier,
  payload: z.record(z.unknown()),
  created_at: z.string().datetime({ offset: true }),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export type HelixPaperJournalEvent = z.infer<
  typeof helixPaperJournalEventSchema
>;

export const helixPaperLifecycleProjectionSchema = z.object({
  schema: z.literal(HELIX_PAPER_TRADING_SCHEMA),
  ok: z.literal(true),
  account_id: identifier,
  orders: z.array(helixPaperOrderSchema).max(500),
  positions: z.array(helixPaperPositionSchema).max(500),
  fills: z.array(helixPaperFillSchema).max(500),
  journal: z.array(helixPaperJournalEventSchema).max(500),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export type HelixPaperLifecycleProjection = z.infer<
  typeof helixPaperLifecycleProjectionSchema
>;

export const helixPaperProcessObservationReceiptSchema = z.object({
  schema: z.literal(HELIX_PAPER_TRADING_SCHEMA),
  ok: z.literal(true),
  account_id: identifier,
  observation_id: identifier,
  symbol,
  filled_order_ids: z.array(identifier),
  marked_position_ids: z.array(identifier),
  stop_exit_order_ids: z.array(identifier),
  simulated: z.literal(true),
  live_order_execution_enabled: z.literal(false),
  answer_authority: z.literal(false),
}).strict();

export type HelixPaperProcessObservationReceipt = z.infer<
  typeof helixPaperProcessObservationReceiptSchema
>;
