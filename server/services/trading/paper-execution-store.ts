import crypto from "node:crypto";
import {
  helixPaperFillSchema,
  helixPaperExecutionModelSchema,
  helixPaperJournalEventSchema,
  helixPaperLifecycleProjectionSchema,
  helixPaperOrderSchema,
  helixPaperPositionSchema,
  helixPaperProcessObservationReceiptSchema,
  type HelixPaperFill,
  type HelixPaperExecutionModel,
  type HelixPaperJournalEvent,
  type HelixPaperLifecycleProjection,
  type HelixPaperOrder,
  type HelixPaperPosition,
  type HelixPaperProcessObservationReceipt,
} from "@shared/trading/paper-contract";
import {
  helixPaperTradeCandidateSchema,
  helixTradingRiskDecisionSchema,
  helixTradingRiskPolicySchema,
  type HelixPaperAccountState,
} from "@shared/trading/risk-contract";
import { assertRobinhoodPrivateRoomReadCapability } from
  "../brokerage/robinhood-connection-store";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { evaluatePaperTradeRisk } from "./paper-risk-engine";
import { readPaperQuoteEvidence, type PaperQuoteEvidence } from
  "./paper-market-evidence";
import { PaperTradingError } from "./paper-trading-errors";
import { readUsMarketClock } from "./us-market-clock";

type AccountRow = {
  account_id: string;
  owner_profile_id: string;
  connection_id: string;
  room_id: string;
  policy_json: unknown;
  trading_day: string | Date;
  account_equity_cents: number | string;
  buying_power_cents: number | string;
  realized_pnl_cents: number | string;
  unrealized_pnl_cents: number | string;
  new_trades_today: number | string;
  open_symbols: unknown;
  consecutive_losses: number | string;
  kill_switch_active: boolean;
  kill_switch_reason: string | null;
};

type OrderRow = {
  order_id: string;
  client_order_id: string;
  account_id: string;
  risk_decision_id: string | null;
  intent: "entry" | "exit";
  symbol: string;
  side: "buy" | "sell";
  order_type: "limit";
  notional_cents: number | string;
  quantity_micros: number | string;
  limit_price_micros: number | string;
  stop_price_micros: number | string | null;
  reserved_cents: number | string;
  filled_quantity_micros: number | string;
  filled_notional_cents: number | string;
  execution_model_json: unknown | null;
  status: "open" | "filled" | "cancelled";
  source_observation_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  filled_at: string | Date | null;
  cancelled_at: string | Date | null;
};

type PositionRow = {
  position_id: string;
  account_id: string;
  symbol: string;
  quantity_micros: number | string;
  average_entry_price_micros: number | string;
  stop_price_micros: number | string;
  cost_basis_cents: number | string;
  last_price_micros: number | string;
  market_value_cents: number | string;
  unrealized_pnl_cents: number | string;
  entry_order_id: string;
  exit_order_id: string | null;
  status: "open" | "closed";
  opened_at: string | Date;
  updated_at: string | Date;
  closed_at: string | Date | null;
};

type FillRow = {
  fill_id: string;
  order_id: string;
  account_id: string;
  position_id: string | null;
  side: "buy" | "sell";
  symbol: string;
  quantity_micros: number | string;
  price_micros: number | string;
  gross_cents: number | string;
  source_observation_id: string;
  market_observed_at: string | Date;
  filled_at: string | Date;
};

type JournalRow = {
  event_id: string;
  account_id: string;
  event_type: HelixPaperJournalEvent["event_type"];
  subject_ref: string;
  payload: unknown;
  created_at: string | Date;
};

const toIso = (value: string | Date): string => new Date(value).toISOString();
const nullableIso = (value: string | Date | null): string | null =>
  value === null ? null : toIso(value);
const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
const integer = (value: number | string): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("unsafe paper ledger integer");
  return parsed;
};

const quantityForNotional = (notionalCents: number, priceMicros: number): number => {
  const value = (BigInt(notionalCents) * 10_000_000_000n) / BigInt(priceMicros);
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The paper order is too small to simulate at this limit price.",
    );
  }
  return result;
};

const grossCents = (
  quantityMicros: number,
  priceMicros: number,
  rounding: "floor" | "ceil",
): number => {
  const numerator = BigInt(quantityMicros) * BigInt(priceMicros);
  const denominator = 10_000_000_000n;
  const value = rounding === "ceil"
    ? (numerator + denominator - 1n) / denominator
    : numerator / denominator;
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new Error("invalid paper fill value");
  }
  return result;
};

const projectOrder = (row: OrderRow): HelixPaperOrder =>
  helixPaperOrderSchema.parse({
    schema: "helix.paper_trading.v1",
    order_id: row.order_id,
    client_order_id: row.client_order_id,
    account_id: row.account_id,
    risk_decision_id: row.risk_decision_id,
    intent: row.intent,
    symbol: row.symbol,
    side: row.side,
    order_type: row.order_type,
    notional_cents: integer(row.notional_cents),
    quantity_micros: integer(row.quantity_micros),
    limit_price_micros: integer(row.limit_price_micros),
    stop_price_micros: row.stop_price_micros === null
      ? null
      : integer(row.stop_price_micros),
    reserved_cents: integer(row.reserved_cents),
    filled_quantity_micros: integer(row.filled_quantity_micros),
    filled_notional_cents: integer(row.filled_notional_cents),
    execution_model: row.execution_model_json === null
      ? null
      : helixPaperExecutionModelSchema.parse(row.execution_model_json),
    status: row.status,
    fill_state: row.status === "open"
      ? integer(row.filled_quantity_micros) === 0
        ? "unfilled"
        : "partially_filled"
      : row.status,
    source_observation_id: row.source_observation_id,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    filled_at: nullableIso(row.filled_at),
    cancelled_at: nullableIso(row.cancelled_at),
    simulated: true,
    live_order_execution_enabled: false,
    answer_authority: false,
  });

const projectPosition = (row: PositionRow): HelixPaperPosition =>
  helixPaperPositionSchema.parse({
    schema: "helix.paper_trading.v1",
    position_id: row.position_id,
    account_id: row.account_id,
    symbol: row.symbol,
    quantity_micros: integer(row.quantity_micros),
    average_entry_price_micros: integer(row.average_entry_price_micros),
    stop_price_micros: integer(row.stop_price_micros),
    cost_basis_cents: integer(row.cost_basis_cents),
    last_price_micros: integer(row.last_price_micros),
    market_value_cents: integer(row.market_value_cents),
    unrealized_pnl_cents: integer(row.unrealized_pnl_cents),
    entry_order_id: row.entry_order_id,
    exit_order_id: row.exit_order_id,
    status: row.status,
    opened_at: toIso(row.opened_at),
    updated_at: toIso(row.updated_at),
    closed_at: nullableIso(row.closed_at),
    simulated: true,
    live_order_execution_enabled: false,
    answer_authority: false,
  });

const projectFill = (row: FillRow): HelixPaperFill =>
  helixPaperFillSchema.parse({
    schema: "helix.paper_trading.v1",
    fill_id: row.fill_id,
    order_id: row.order_id,
    account_id: row.account_id,
    position_id: row.position_id,
    side: row.side,
    symbol: row.symbol,
    quantity_micros: integer(row.quantity_micros),
    price_micros: integer(row.price_micros),
    gross_cents: integer(row.gross_cents),
    source_observation_id: row.source_observation_id,
    market_observed_at: toIso(row.market_observed_at),
    filled_at: toIso(row.filled_at),
    simulated: true,
    live_order_execution_enabled: false,
    answer_authority: false,
  });

const projectJournal = (row: JournalRow): HelixPaperJournalEvent =>
  helixPaperJournalEventSchema.parse({
    schema: "helix.paper_trading.v1",
    event_id: row.event_id,
    account_id: row.account_id,
    event_type: row.event_type,
    subject_ref: row.subject_ref,
    payload: row.payload,
    created_at: toIso(row.created_at),
    simulated: true,
    live_order_execution_enabled: false,
    answer_authority: false,
  });

const accountState = (row: AccountRow): HelixPaperAccountState => ({
  schema: "helix.trading_risk.v1",
  trading_day: typeof row.trading_day === "string"
    ? row.trading_day.slice(0, 10)
    : row.trading_day.toISOString().slice(0, 10),
  account_equity_cents: integer(row.account_equity_cents),
  buying_power_cents: integer(row.buying_power_cents),
  realized_pnl_cents: integer(row.realized_pnl_cents),
  unrealized_pnl_cents: integer(row.unrealized_pnl_cents),
  new_trades_today: integer(row.new_trades_today),
  open_symbols: stringArray(row.open_symbols),
  consecutive_losses: integer(row.consecutive_losses),
  kill_switch_active: row.kill_switch_active,
  kill_switch_reason: row.kill_switch_reason,
});

const loadAccount = async (
  db: Queryable,
  ownerProfileId: string,
  accountId: string,
  lock = false,
): Promise<AccountRow> => {
  const { rows } = await db.query<AccountRow>(
    `SELECT * FROM helix_paper_trading_accounts
     WHERE account_id = $1 AND owner_profile_id = $2 AND status = 'active'
     LIMIT 1${lock ? " FOR UPDATE" : ""};`,
    [accountId, ownerProfileId],
  );
  if (!rows[0]) throw new PaperTradingError(
    "paper_account_not_found", 404, "The paper trading account was not found.",
  );
  return rows[0];
};

const assertAccountAccess = async (row: AccountRow): Promise<void> => {
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: row.owner_profile_id,
    connectionId: row.connection_id,
    roomId: row.room_id,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
};

const writeJournal = async (db: Queryable, input: {
  account: AccountRow;
  type: HelixPaperJournalEvent["event_type"];
  subjectRef: string;
  payload: Record<string, unknown>;
  at: string;
}): Promise<void> => {
  await db.query(
    `INSERT INTO helix_paper_journal_events (
       event_id, account_id, owner_profile_id, event_type,
       subject_ref, payload, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7);`,
    [`paper_event:${crypto.randomUUID()}`, input.account.account_id,
      input.account.owner_profile_id, input.type, input.subjectRef,
      JSON.stringify(input.payload), input.at],
  );
};

const readQuoteForAccount = async (input: {
  account: AccountRow;
  observationId: string;
  symbol: string;
  now: Date;
}): Promise<PaperQuoteEvidence> => {
  const policy = helixTradingRiskPolicySchema.parse(input.account.policy_json);
  return readPaperQuoteEvidence({
    ownerProfileId: input.account.owner_profile_id,
    connectionId: input.account.connection_id,
    roomId: input.account.room_id,
    observationId: input.observationId,
    symbol: input.symbol,
    now: input.now,
    maxAgeMs: policy.max_quote_age_ms,
    maxFutureSkewMs: policy.max_future_quote_skew_ms,
  });
};

const assertRegularSession = (quote: PaperQuoteEvidence): void => {
  if (readUsMarketClock(new Date(quote.observedAt)).session !== "regular") {
    throw new PaperTradingError(
      "paper_quote_evidence_invalid", 409,
      "Paper fills are simulated only during the regular US equity session.",
    );
  }
};

export const submitAcceptedPaperEntry = async (input: {
  ownerProfileId: string;
  accountId: string;
  riskDecisionId: string;
  clientOrderId: string;
  executionModel?: HelixPaperExecutionModel | null;
  reactiveControllerRunId?: string;
  now?: Date;
}): Promise<HelixPaperOrder> => {
  const now = input.now ?? new Date();
  const db = await readSharedRealtimeRoomDatabase();
  const initial = await loadAccount(db, input.ownerProfileId, input.accountId);
  await assertAccountAccess(initial);
  const { rows: decisions } = await db.query<{
    verdict: string;
    candidate_json: unknown;
    decision_json: unknown;
  }>(
    `SELECT verdict, candidate_json, decision_json
     FROM helix_paper_risk_decisions
     WHERE decision_id = $1 AND account_id = $2 AND owner_profile_id = $3
     LIMIT 1;`,
    [input.riskDecisionId, input.accountId, input.ownerProfileId],
  );
  const sourceDecision = decisions[0];
  if (!sourceDecision || sourceDecision.verdict !== "accepted") {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "Only an accepted deterministic paper-risk decision can create an entry.",
    );
  }
  helixTradingRiskDecisionSchema.parse(sourceDecision.decision_json);
  const candidate = helixPaperTradeCandidateSchema.parse(sourceDecision.candidate_json);
  const quote = await readQuoteForAccount({
    account: initial,
    observationId: candidate.source_observation_ids[0],
    symbol: candidate.symbol,
    now,
  });
  assertRegularSession(quote);
  return withSharedRealtimeRoomTransaction(async (client) => {
    if (input.reactiveControllerRunId) {
      const controller = await client.query<{
        owner_profile_id: string;
        paper_account_id: string;
        status: string;
      }>(
        `SELECT owner_profile_id, paper_account_id, status
           FROM helix_brokerage_reactive_controller_runs
          WHERE controller_run_id=$1 LIMIT 1 FOR UPDATE;`,
        [input.reactiveControllerRunId],
      );
      const active = controller.rows[0];
      if (!active || active.owner_profile_id !== input.ownerProfileId ||
          active.paper_account_id !== input.accountId ||
          active.status !== "active") {
        throw new PaperTradingError(
          "reactive_controller_not_active", 409,
          "The reactive controller lease was released before simulated entry reservation.",
        );
      }
    }
    const account = await loadAccount(
      client, input.ownerProfileId, input.accountId, true,
    );
    const { rows: existingRows } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders
       WHERE account_id = $1 AND client_order_id = $2 LIMIT 1;`,
      [input.accountId, input.clientOrderId],
    );
    if (existingRows[0]) {
      if (existingRows[0].risk_decision_id !== input.riskDecisionId) {
        throw new PaperTradingError(
          "paper_order_replay_conflict", 409,
          "This client paper-order identity was already used for another decision.",
        );
      }
      if (input.reactiveControllerRunId) {
        const linked = await client.query<{ controller_run_id: string }>(
          `SELECT controller_run_id
             FROM helix_brokerage_reactive_controller_effects
            WHERE order_id=$1 LIMIT 1;`,
          [existingRows[0].order_id],
        );
        if (linked.rows[0] && linked.rows[0].controller_run_id !==
            input.reactiveControllerRunId) {
          throw new PaperTradingError(
            "paper_order_replay_conflict", 409,
            "The replayed paper order belongs to a different controller lease.",
          );
        }
        if (!linked.rows[0]) {
          await client.query(
            `INSERT INTO helix_brokerage_reactive_controller_effects(
               controller_run_id, order_id, source_observation_id, created_at
             ) VALUES ($1,$2,$3,$4);`,
            [input.reactiveControllerRunId, existingRows[0].order_id,
              quote.observationId, now.toISOString()],
          );
        }
      }
      return projectOrder(existingRows[0]);
    }
    const { rows: exposureRows } = await client.query<{ count: number | string }>(
      `SELECT (
         (SELECT count(*) FROM helix_paper_orders
          WHERE account_id = $1 AND intent = 'entry' AND status = 'open') +
         (SELECT count(*) FROM helix_paper_positions
          WHERE account_id = $1 AND status = 'open')
       ) AS count;`,
      [input.accountId],
    );
    if (integer(exposureRows[0]?.count ?? 0) > 0) {
      throw new PaperTradingError(
        "paper_risk_decision_not_accepted", 409,
        "A paper entry or position is already open for this account.",
      );
    }
    const policy = helixTradingRiskPolicySchema.parse(account.policy_json);
    const recheck = evaluatePaperTradeRisk({
      policy,
      candidate,
      account: accountState(account),
      now,
    });
    if (recheck.verdict !== "accepted") {
      throw new PaperTradingError(
        "paper_risk_decision_not_accepted", 409,
        `The paper entry no longer passes risk: ${recheck.reasons.join(", ")}.`,
      );
    }
    const quantityMicros = quantityForNotional(
      candidate.notional_cents,
      candidate.entry_limit_micros,
    );
    const orderId = `paper_order:${crypto.randomUUID()}`;
    const at = now.toISOString();
    const executionModel = input.executionModel === undefined
      ? null
      : helixPaperExecutionModelSchema.nullable().parse(input.executionModel);
    const { rows } = await client.query<OrderRow>(
      `INSERT INTO helix_paper_orders (
         order_id, client_order_id, account_id, owner_profile_id,
         connection_id, room_id, risk_decision_id, intent, symbol, side,
         order_type, notional_cents, quantity_micros, limit_price_micros,
         stop_price_micros, reserved_cents, filled_quantity_micros,
         filled_notional_cents, execution_model_json, status,
         source_observation_id, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'entry', $8, 'buy',
         'limit', $9, $10, $11, $12, $9, 0, 0, $13::jsonb,
         'open', $14, $15, $15)
       RETURNING *;`,
      [orderId, input.clientOrderId, input.accountId, input.ownerProfileId,
        account.connection_id, account.room_id, input.riskDecisionId,
        candidate.symbol, candidate.notional_cents, quantityMicros,
        candidate.entry_limit_micros, candidate.stop_price_micros,
        executionModel === null ? null : JSON.stringify(executionModel),
        quote.observationId, at],
    );
    await client.query(
      `UPDATE helix_paper_trading_accounts
       SET buying_power_cents = $3, updated_at = $4
       WHERE account_id = $1 AND owner_profile_id = $2;`,
      [input.accountId, input.ownerProfileId,
        integer(account.buying_power_cents) - candidate.notional_cents, at],
    );
    if (input.reactiveControllerRunId) {
      await client.query(
        `INSERT INTO helix_brokerage_reactive_controller_effects(
           controller_run_id, order_id, source_observation_id, created_at
         ) VALUES ($1,$2,$3,$4);`,
        [input.reactiveControllerRunId, orderId, quote.observationId, at],
      );
    }
    await writeJournal(client, {
      account,
      type: "entry_submitted",
      subjectRef: orderId,
      payload: {
        symbol: candidate.symbol,
        notional_cents: candidate.notional_cents,
        quantity_micros: quantityMicros,
        limit_price_micros: candidate.entry_limit_micros,
        risk_decision_id: input.riskDecisionId,
        observation_id: quote.observationId,
      },
      at,
    });
    return projectOrder(rows[0]);
  });
};

const recalculateAccount = async (
  db: Queryable,
  accountId: string,
  ownerProfileId: string,
  at: string,
): Promise<void> => {
  const { rows: accounts } = await db.query<AccountRow>(
    `SELECT * FROM helix_paper_trading_accounts
     WHERE account_id = $1 AND owner_profile_id = $2 LIMIT 1;`,
    [accountId, ownerProfileId],
  );
  const account = accounts[0];
  if (!account) return;
  const { rows: reserves } = await db.query<{ total: number | string | null }>(
    `SELECT COALESCE(sum(reserved_cents), 0) AS total
     FROM helix_paper_orders
     WHERE account_id = $1 AND status = 'open';`,
    [accountId],
  );
  const { rows: positions } = await db.query<{
    market_value: number | string | null;
    unrealized: number | string | null;
  }>(
    `SELECT COALESCE(sum(market_value_cents), 0) AS market_value,
            COALESCE(sum(unrealized_pnl_cents), 0) AS unrealized
     FROM helix_paper_positions WHERE account_id = $1 AND status = 'open';`,
    [accountId],
  );
  const equity = integer(account.buying_power_cents) +
    integer(reserves[0]?.total ?? 0) + integer(positions[0]?.market_value ?? 0);
  await db.query(
    `UPDATE helix_paper_trading_accounts
     SET account_equity_cents = $3, unrealized_pnl_cents = $4,
         updated_at = $5
     WHERE account_id = $1 AND owner_profile_id = $2;`,
    [accountId, ownerProfileId, equity,
      integer(positions[0]?.unrealized ?? 0), at],
  );
};

const activateAutomaticKillSwitchIfNeeded = async (
  db: Queryable,
  accountId: string,
  ownerProfileId: string,
  at: string,
): Promise<void> => {
  const { rows } = await db.query<AccountRow>(
    `SELECT * FROM helix_paper_trading_accounts
     WHERE account_id = $1 AND owner_profile_id = $2 LIMIT 1;`,
    [accountId, ownerProfileId],
  );
  const account = rows[0];
  if (!account || account.kill_switch_active) return;
  const policy = helixTradingRiskPolicySchema.parse(account.policy_json);
  const equity = integer(account.account_equity_cents);
  const dailyLimit = Math.min(
    policy.max_daily_loss_cents,
    Math.floor((equity * policy.max_daily_loss_equity_bps) / 10_000),
  );
  const currentLoss = Math.max(
    0,
    -(integer(account.realized_pnl_cents) +
      integer(account.unrealized_pnl_cents)),
  );
  const consecutiveLosses = integer(account.consecutive_losses);
  const reason = currentLoss >= dailyLimit
    ? `[automatic] daily loss ${currentLoss} cents reached ${dailyLimit} cent limit`
    : consecutiveLosses >= policy.max_consecutive_losses
      ? `[automatic] ${consecutiveLosses} consecutive losing paper trades`
      : null;
  if (!reason) return;
  await db.query(
    `UPDATE helix_paper_trading_accounts
     SET kill_switch_active = true, kill_switch_reason = $3, updated_at = $4
     WHERE account_id = $1 AND owner_profile_id = $2;`,
    [accountId, ownerProfileId, reason, at],
  );
  await db.query(
    `INSERT INTO helix_trading_kill_switch_events (
       event_id, account_id, owner_profile_id, active, reason, created_at
     ) VALUES ($1, $2, $3, true, $4, $5);`,
    [`kill_switch:${crypto.randomUUID()}`, accountId, ownerProfileId, reason, at],
  );
};

export const derivePaperEntryFillTerms = (input: {
  orderQuantityMicros: number;
  filledQuantityMicros: number;
  limitPriceMicros: number;
  orderCreatedAt: string;
  executionModel: HelixPaperExecutionModel | null;
  quoteAskMicros: number;
  quoteObservedAt: string;
}): { quantityMicros: number; priceMicros: number } | null => {
  const model = helixPaperExecutionModelSchema.nullable().parse(
    input.executionModel,
  );
  const remaining = input.orderQuantityMicros - input.filledQuantityMicros;
  if (remaining <= 0 || input.quoteAskMicros > input.limitPriceMicros) {
    return null;
  }
  if (model) {
    const eligibleAt = new Date(input.orderCreatedAt).getTime() +
      model.deterministic_latency_ms;
    if (new Date(input.quoteObservedAt).getTime() < eligibleAt) return null;
  }
  const fractionBps = model?.partial_fill_policy.fill_fraction_bps ?? 10_000;
  const scheduledQuantity = Math.max(1, Number(
    (BigInt(input.orderQuantityMicros) * BigInt(fractionBps)) / 10_000n,
  ));
  const quantityMicros = Math.min(remaining, scheduledQuantity);
  const slipped = model
    ? Number(
      (BigInt(input.quoteAskMicros) *
        BigInt(10_000 + model.deterministic_slippage_bps) + 9_999n) /
        10_000n,
    )
    : input.quoteAskMicros;
  const priceMicros = Math.min(
    input.limitPriceMicros,
    slipped,
  );
  return { quantityMicros, priceMicros };
};

const entryFillTerms = (input: {
  order: OrderRow;
  quote: PaperQuoteEvidence;
}): { quantityMicros: number; priceMicros: number } | null =>
  derivePaperEntryFillTerms({
    orderQuantityMicros: integer(input.order.quantity_micros),
    filledQuantityMicros: integer(input.order.filled_quantity_micros),
    limitPriceMicros: integer(input.order.limit_price_micros),
    orderCreatedAt: toIso(input.order.created_at),
    executionModel: input.order.execution_model_json === null
      ? null
      : helixPaperExecutionModelSchema.parse(input.order.execution_model_json),
    quoteAskMicros: input.quote.askMicros,
    quoteObservedAt: input.quote.observedAt,
  });

const applyEntryFill = async (input: {
  db: Queryable;
  account: AccountRow;
  order: OrderRow;
  quote: PaperQuoteEvidence;
  quantityMicros: number;
  priceMicros: number;
  at: string;
}): Promise<{
  orderId: string;
  position: PositionRow;
  completed: boolean;
}> => {
  const orderQuantity = integer(input.order.quantity_micros);
  const priorQuantity = integer(input.order.filled_quantity_micros);
  const nextQuantity = priorQuantity + input.quantityMicros;
  if (nextQuantity > orderQuantity) {
    throw new Error("paper entry fill exceeded order quantity");
  }
  const reserved = integer(input.order.reserved_cents);
  const gross = grossCents(
    input.quantityMicros,
    input.priceMicros,
    "ceil",
  );
  const remainingQuantity = orderQuantity - nextQuantity;
  const nextReserved = remainingQuantity === 0
    ? 0
    : grossCents(
      remainingQuantity,
      integer(input.order.limit_price_micros),
      "ceil",
    );
  const refund = reserved - gross - nextReserved;
  if (refund < 0) throw new Error("paper entry exceeded reserved cash");
  const { rows: existingPositions } = await input.db.query<PositionRow>(
    `SELECT * FROM helix_paper_positions
     WHERE entry_order_id = $1 LIMIT 1 FOR UPDATE;`,
    [input.order.order_id],
  );
  const existingPosition = existingPositions[0];
  const positionId = existingPosition?.position_id ??
    `paper_position:${crypto.randomUUID()}`;
  const fillId = `paper_fill:${crypto.randomUUID()}`;
  let position: PositionRow;
  if (existingPosition) {
    const positionQuantity = integer(existingPosition.quantity_micros);
    const updatedQuantity = positionQuantity + input.quantityMicros;
    const updatedCost = integer(existingPosition.cost_basis_cents) + gross;
    const weightedPrice = Number(
      (BigInt(integer(existingPosition.average_entry_price_micros)) *
        BigInt(positionQuantity) +
        BigInt(input.priceMicros) * BigInt(input.quantityMicros)) /
        BigInt(updatedQuantity),
    );
    const marketValue = grossCents(
      updatedQuantity,
      input.quote.bidMicros,
      "floor",
    );
    const { rows } = await input.db.query<PositionRow>(
      `UPDATE helix_paper_positions
       SET quantity_micros = $2, average_entry_price_micros = $3,
           cost_basis_cents = $4, last_price_micros = $5,
           market_value_cents = $6, unrealized_pnl_cents = $7,
           updated_at = $8
       WHERE position_id = $1 RETURNING *;`,
      [positionId, updatedQuantity, weightedPrice, updatedCost,
        input.quote.bidMicros, marketValue, marketValue - updatedCost,
        input.at],
    );
    position = rows[0];
  } else {
    const marketValue = grossCents(
      input.quantityMicros,
      input.quote.bidMicros,
      "floor",
    );
    const { rows } = await input.db.query<PositionRow>(
      `INSERT INTO helix_paper_positions (
         position_id, account_id, owner_profile_id, connection_id, room_id,
         symbol, quantity_micros, average_entry_price_micros,
         stop_price_micros, cost_basis_cents, last_price_micros,
         market_value_cents, unrealized_pnl_cents, entry_order_id,
         status, opened_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, 'open', $15, $15)
       RETURNING *;`,
      [positionId, input.account.account_id, input.account.owner_profile_id,
        input.account.connection_id, input.account.room_id,
        input.order.symbol, input.quantityMicros, input.priceMicros,
        input.order.stop_price_micros, gross, input.quote.bidMicros,
        marketValue, marketValue - gross, input.order.order_id, input.at],
    );
    position = rows[0];
  }
  await input.db.query(
    `INSERT INTO helix_paper_fills (
       fill_id, order_id, account_id, position_id, side, symbol,
       quantity_micros, price_micros, gross_cents, source_observation_id,
       market_observed_at, filled_at
     ) VALUES ($1, $2, $3, $4, 'buy', $5, $6, $7, $8, $9, $10, $11);`,
    [fillId, input.order.order_id, input.account.account_id, positionId,
      input.order.symbol, input.quantityMicros, input.priceMicros, gross,
      input.quote.observationId, input.quote.observedAt, input.at],
  );
  await input.db.query(
    `UPDATE helix_paper_orders
     SET status = $2, reserved_cents = $3,
         filled_quantity_micros = $4,
         filled_notional_cents = filled_notional_cents + $5,
         filled_at = $6, updated_at = $7
     WHERE order_id = $1;`,
    [input.order.order_id,
      nextQuantity === orderQuantity ? "filled" : "open",
      nextReserved, nextQuantity, gross,
      nextQuantity === orderQuantity ? input.at : null, input.at],
  );
  const nextSymbols = Array.from(new Set([
    ...stringArray(input.account.open_symbols),
    input.order.symbol,
  ]));
  await input.db.query(
    `UPDATE helix_paper_trading_accounts
     SET buying_power_cents = buying_power_cents + $3,
         new_trades_today = new_trades_today + $4,
         open_symbols = $5::jsonb, updated_at = $6
     WHERE account_id = $1 AND owner_profile_id = $2;`,
    [input.account.account_id, input.account.owner_profile_id, refund,
      priorQuantity === 0 ? 1 : 0, JSON.stringify(nextSymbols), input.at],
  );
  await writeJournal(input.db, {
    account: input.account,
    type: "entry_filled",
    subjectRef: input.order.order_id,
    payload: {
      fill_id: fillId,
      position_id: positionId,
      symbol: input.order.symbol,
      quantity_micros: input.quantityMicros,
      cumulative_quantity_micros: nextQuantity,
      order_quantity_micros: orderQuantity,
      completed: nextQuantity === orderQuantity,
      price_micros: input.priceMicros,
      gross_cents: gross,
      observation_id: input.quote.observationId,
    },
    at: input.at,
  });
  return {
    orderId: input.order.order_id,
    position,
    completed: nextQuantity === orderQuantity,
  };
};

const closePosition = async (input: {
  db: Queryable;
  account: AccountRow;
  position: PositionRow;
  quote: PaperQuoteEvidence;
  clientOrderId: string;
  at: string;
  stopTriggered: boolean;
}): Promise<string> => {
  const quantity = integer(input.position.quantity_micros);
  const proceeds = grossCents(quantity, input.quote.bidMicros, "floor");
  const realized = proceeds - integer(input.position.cost_basis_cents);
  const orderId = `paper_order:${crypto.randomUUID()}`;
  const fillId = `paper_fill:${crypto.randomUUID()}`;
  await input.db.query(
    `INSERT INTO helix_paper_orders (
       order_id, client_order_id, account_id, owner_profile_id,
       connection_id, room_id, risk_decision_id, intent, symbol, side,
       order_type, notional_cents, quantity_micros, limit_price_micros,
       stop_price_micros, reserved_cents, filled_quantity_micros,
       filled_notional_cents, execution_model_json, status,
       source_observation_id, created_at, updated_at, filled_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NULL, 'exit', $7, 'sell',
       'limit', $8, $9, $10, NULL, 0, $9, $8, NULL,
       'filled', $11, $12, $12, $12);`,
    [orderId, input.clientOrderId, input.account.account_id,
      input.account.owner_profile_id, input.account.connection_id,
      input.account.room_id, input.position.symbol, proceeds, quantity,
      input.quote.bidMicros, input.quote.observationId, input.at],
  );
  await input.db.query(
    `INSERT INTO helix_paper_fills (
       fill_id, order_id, account_id, position_id, side, symbol,
       quantity_micros, price_micros, gross_cents, source_observation_id,
       market_observed_at, filled_at
     ) VALUES ($1, $2, $3, $4, 'sell', $5, $6, $7, $8, $9, $10, $11);`,
    [fillId, orderId, input.account.account_id, input.position.position_id,
      input.position.symbol, quantity, input.quote.bidMicros, proceeds,
      input.quote.observationId, input.quote.observedAt, input.at],
  );
  await input.db.query(
    `UPDATE helix_paper_positions
     SET exit_order_id = $2, status = 'closed', last_price_micros = $3,
         market_value_cents = $4, unrealized_pnl_cents = 0,
         updated_at = $5, closed_at = $5
     WHERE position_id = $1;`,
    [input.position.position_id, orderId, input.quote.bidMicros,
      proceeds, input.at],
  );
  const nextSymbols = stringArray(input.account.open_symbols)
    .filter((symbol) => symbol !== input.position.symbol);
  await input.db.query(
    `UPDATE helix_paper_trading_accounts
     SET buying_power_cents = buying_power_cents + $3,
         realized_pnl_cents = realized_pnl_cents + $4,
         consecutive_losses = CASE WHEN $4 < 0 THEN consecutive_losses + 1 ELSE 0 END,
         open_symbols = $5::jsonb, updated_at = $6
     WHERE account_id = $1 AND owner_profile_id = $2;`,
    [input.account.account_id, input.account.owner_profile_id,
      proceeds, realized, JSON.stringify(nextSymbols), input.at],
  );
  if (input.stopTriggered) {
    await writeJournal(input.db, {
      account: input.account,
      type: "stop_triggered",
      subjectRef: input.position.position_id,
      payload: {
        stop_price_micros: integer(input.position.stop_price_micros),
        bid_micros: input.quote.bidMicros,
        observation_id: input.quote.observationId,
      },
      at: input.at,
    });
  }
  await writeJournal(input.db, {
    account: input.account,
    type: "exit_filled",
    subjectRef: orderId,
    payload: {
      fill_id: fillId,
      position_id: input.position.position_id,
      symbol: input.position.symbol,
      quantity_micros: quantity,
      price_micros: input.quote.bidMicros,
      proceeds_cents: proceeds,
      realized_pnl_cents: realized,
      exit_reason: input.stopTriggered ? "stop" : "operator",
      observation_id: input.quote.observationId,
    },
    at: input.at,
  });
  return orderId;
};

export const processPaperQuoteObservation = async (input: {
  ownerProfileId: string;
  accountId: string;
  observationId: string;
  symbol: string;
  now?: Date;
}): Promise<HelixPaperProcessObservationReceipt> => {
  const now = input.now ?? new Date();
  const symbol = input.symbol.toUpperCase();
  const db = await readSharedRealtimeRoomDatabase();
  const initial = await loadAccount(db, input.ownerProfileId, input.accountId);
  await assertAccountAccess(initial);
  const readProcessedReceipt = async (
    queryable: Queryable,
  ): Promise<HelixPaperProcessObservationReceipt | null> => {
    const { rows } = await queryable.query<{ receipt_json: unknown }>(
      `SELECT receipt_json FROM helix_paper_processed_observations
       WHERE account_id = $1 AND observation_id = $2 LIMIT 1;`,
      [input.accountId, input.observationId],
    );
    if (!rows[0]) return null;
    const receipt = helixPaperProcessObservationReceiptSchema.parse(
      rows[0].receipt_json,
    );
    if (receipt.account_id !== input.accountId ||
        receipt.observation_id !== input.observationId ||
        receipt.symbol !== symbol) {
      throw new PaperTradingError(
        "paper_observation_replay_conflict",
        409,
        "The processed paper observation does not match this replay identity.",
      );
    }
    return receipt;
  };
  const existingReceipt = await readProcessedReceipt(db);
  if (existingReceipt) return existingReceipt;
  let quote: PaperQuoteEvidence;
  try {
    quote = await readQuoteForAccount({
      account: initial,
      observationId: input.observationId,
      symbol,
      now,
    });
  } catch (error) {
    // A concurrent first delivery may have committed while this invocation was
    // validating freshness. Exact replay remains safe; new stale evidence does not.
    const concurrentReceipt = await readProcessedReceipt(db);
    if (concurrentReceipt) return concurrentReceipt;
    throw error;
  }
  assertRegularSession(quote);
  return withSharedRealtimeRoomTransaction(async (client) => {
    const account = await loadAccount(
      client, input.ownerProfileId, input.accountId, true,
    );
    const processedReceipt = await readProcessedReceipt(client);
    if (processedReceipt) return processedReceipt;
    const filledOrderIds: string[] = [];
    const markedPositionIds: string[] = [];
    const stopExitOrderIds: string[] = [];
    const { rows: orders } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders
       WHERE account_id = $1 AND symbol = $2
         AND status = 'open'
         AND intent = 'entry' ORDER BY created_at FOR UPDATE;`,
      [input.accountId, quote.symbol],
    );
    for (const order of orders) {
      const terms = entryFillTerms({ order, quote });
      if (!terms) continue;
      const filled = await applyEntryFill({
        db: client,
        account,
        order,
        quote,
        ...terms,
        at: now.toISOString(),
      });
      if (filled.completed) filledOrderIds.push(filled.orderId);
    }
    const { rows: positions } = await client.query<PositionRow>(
      `SELECT * FROM helix_paper_positions
       WHERE account_id = $1 AND symbol = $2 AND status = 'open'
       ORDER BY opened_at FOR UPDATE;`,
      [input.accountId, quote.symbol],
    );
    for (const position of positions) {
      const marketValue = grossCents(
        integer(position.quantity_micros), quote.bidMicros, "floor",
      );
      await client.query(
        `UPDATE helix_paper_positions
         SET last_price_micros = $2, market_value_cents = $3,
             unrealized_pnl_cents = $4, updated_at = $5
         WHERE position_id = $1;`,
        [position.position_id, quote.bidMicros, marketValue,
          marketValue - integer(position.cost_basis_cents), now.toISOString()],
      );
      markedPositionIds.push(position.position_id);
      await writeJournal(client, {
        account,
        type: "position_marked",
        subjectRef: position.position_id,
        payload: {
          symbol: position.symbol,
          bid_micros: quote.bidMicros,
          market_value_cents: marketValue,
          unrealized_pnl_cents: marketValue - integer(position.cost_basis_cents),
          observation_id: quote.observationId,
        },
        at: now.toISOString(),
      });
      if (quote.bidMicros <= integer(position.stop_price_micros)) {
        const exitOrderId = await closePosition({
          db: client,
          account,
          position: { ...position, market_value_cents: marketValue,
            last_price_micros: quote.bidMicros },
          quote,
          clientOrderId: `auto_stop:${position.position_id}:${quote.observationId}`,
          at: now.toISOString(),
          stopTriggered: true,
        });
        stopExitOrderIds.push(exitOrderId);
      }
    }
    await recalculateAccount(
      client, input.accountId, input.ownerProfileId, now.toISOString(),
    );
    await activateAutomaticKillSwitchIfNeeded(
      client, input.accountId, input.ownerProfileId, now.toISOString(),
    );
    const receipt = helixPaperProcessObservationReceiptSchema.parse({
      schema: "helix.paper_trading.v1",
      ok: true,
      account_id: input.accountId,
      observation_id: quote.observationId,
      symbol: quote.symbol,
      filled_order_ids: filledOrderIds,
      marked_position_ids: markedPositionIds,
      stop_exit_order_ids: stopExitOrderIds,
      simulated: true,
      live_order_execution_enabled: false,
      answer_authority: false,
    });
    await client.query(
      `INSERT INTO helix_paper_processed_observations (
         account_id, observation_id, receipt_json, processed_at
       ) VALUES ($1, $2, $3::jsonb, $4);`,
      [input.accountId, quote.observationId, JSON.stringify(receipt),
        now.toISOString()],
    );
    return receipt;
  });
};

export const closePaperPosition = async (input: {
  ownerProfileId: string;
  accountId: string;
  positionId: string;
  clientOrderId: string;
  observationId: string;
  now?: Date;
}): Promise<HelixPaperOrder> => {
  const now = input.now ?? new Date();
  const db = await readSharedRealtimeRoomDatabase();
  const initial = await loadAccount(db, input.ownerProfileId, input.accountId);
  await assertAccountAccess(initial);
  const { rows: positionRows } = await db.query<PositionRow>(
    `SELECT * FROM helix_paper_positions
     WHERE position_id = $1 AND account_id = $2 AND status = 'open' LIMIT 1;`,
    [input.positionId, input.accountId],
  );
  if (!positionRows[0]) throw new PaperTradingError(
    "paper_position_not_found", 404, "The open paper position was not found.",
  );
  const quote = await readQuoteForAccount({
    account: initial,
    observationId: input.observationId,
    symbol: positionRows[0].symbol,
    now,
  });
  assertRegularSession(quote);
  return withSharedRealtimeRoomTransaction(async (client) => {
    const account = await loadAccount(
      client, input.ownerProfileId, input.accountId, true,
    );
    const { rows: existing } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders
       WHERE account_id = $1 AND client_order_id = $2 LIMIT 1;`,
      [input.accountId, input.clientOrderId],
    );
    if (existing[0]) {
      if (existing[0].intent !== "exit") throw new PaperTradingError(
        "paper_order_replay_conflict", 409,
        "This client paper-order identity was already used for another purpose.",
      );
      return projectOrder(existing[0]);
    }
    const { rows: positions } = await client.query<PositionRow>(
      `SELECT * FROM helix_paper_positions
       WHERE position_id = $1 AND account_id = $2 AND status = 'open'
       LIMIT 1 FOR UPDATE;`,
      [input.positionId, input.accountId],
    );
    if (!positions[0]) throw new PaperTradingError(
      "paper_position_not_found", 404, "The open paper position was not found.",
    );
    const orderId = await closePosition({
      db: client, account, position: positions[0], quote,
      clientOrderId: input.clientOrderId,
      at: now.toISOString(), stopTriggered: false,
    });
    await recalculateAccount(
      client, input.accountId, input.ownerProfileId, now.toISOString(),
    );
    await activateAutomaticKillSwitchIfNeeded(
      client, input.accountId, input.ownerProfileId, now.toISOString(),
    );
    const { rows } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders WHERE order_id = $1 LIMIT 1;`,
      [orderId],
    );
    return projectOrder(rows[0]);
  });
};

export const cancelOpenPaperEntry = async (input: {
  ownerProfileId: string;
  accountId: string;
  orderId: string;
  now?: Date;
}): Promise<HelixPaperOrder> => {
  const db = await readSharedRealtimeRoomDatabase();
  const initial = await loadAccount(db, input.ownerProfileId, input.accountId);
  await assertAccountAccess(initial);
  const now = input.now ?? new Date();
  return withSharedRealtimeRoomTransaction(async (client) => {
    const account = await loadAccount(
      client, input.ownerProfileId, input.accountId, true,
    );
    const { rows } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders
       WHERE order_id = $1 AND account_id = $2 AND intent = 'entry'
       LIMIT 1 FOR UPDATE;`,
      [input.orderId, input.accountId],
    );
    const order = rows[0];
    if (!order) throw new PaperTradingError(
      "paper_order_not_found", 404, "The paper entry order was not found.",
    );
    if (order.status !== "open") {
      return projectOrder(order);
    }
    const at = now.toISOString();
    await client.query(
      `UPDATE helix_paper_orders
       SET status = 'cancelled', reserved_cents = 0,
           cancelled_at = $2, updated_at = $2 WHERE order_id = $1;`,
      [order.order_id, at],
    );
    await client.query(
      `UPDATE helix_paper_trading_accounts
       SET buying_power_cents = buying_power_cents + $3, updated_at = $4
       WHERE account_id = $1 AND owner_profile_id = $2;`,
      [input.accountId, input.ownerProfileId, integer(order.reserved_cents), at],
    );
    await writeJournal(client, {
      account, type: "entry_cancelled", subjectRef: order.order_id,
      payload: { refunded_cents: integer(order.reserved_cents) }, at,
    });
    const { rows: updated } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders WHERE order_id = $1 LIMIT 1;`,
      [order.order_id],
    );
    return projectOrder(updated[0]);
  });
};

export const listPaperTradingLifecycle = async (input: {
  ownerProfileId: string;
  accountId: string;
}): Promise<HelixPaperLifecycleProjection> => {
  const db = await readSharedRealtimeRoomDatabase();
  const account = await loadAccount(db, input.ownerProfileId, input.accountId);
  await assertAccountAccess(account);
  const [orders, positions, fills, journal] = await Promise.all([
    db.query<OrderRow>(
      `SELECT * FROM helix_paper_orders WHERE account_id = $1
       ORDER BY created_at DESC LIMIT 500;`, [input.accountId]),
    db.query<PositionRow>(
      `SELECT * FROM helix_paper_positions WHERE account_id = $1
       ORDER BY opened_at DESC LIMIT 500;`, [input.accountId]),
    db.query<FillRow>(
      `SELECT * FROM helix_paper_fills WHERE account_id = $1
       ORDER BY filled_at DESC LIMIT 500;`, [input.accountId]),
    db.query<JournalRow>(
      `SELECT * FROM helix_paper_journal_events WHERE account_id = $1
       ORDER BY created_at DESC LIMIT 500;`, [input.accountId]),
  ]);
  return helixPaperLifecycleProjectionSchema.parse({
    schema: "helix.paper_trading.v1",
    ok: true,
    account_id: input.accountId,
    orders: orders.rows.map(projectOrder),
    positions: positions.rows.map(projectPosition),
    fills: fills.rows.map(projectFill),
    journal: journal.rows.map(projectJournal),
    simulated: true,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    answer_authority: false,
  });
};
