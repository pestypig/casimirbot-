import crypto from "node:crypto";
import {
  helixPaperFillSchema,
  helixPaperJournalEventSchema,
  helixPaperLifecycleProjectionSchema,
  helixPaperOrderSchema,
  helixPaperPositionSchema,
  helixPaperProcessObservationReceiptSchema,
  type HelixPaperFill,
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
    status: row.status,
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
    const { rows } = await client.query<OrderRow>(
      `INSERT INTO helix_paper_orders (
         order_id, client_order_id, account_id, owner_profile_id,
         connection_id, room_id, risk_decision_id, intent, symbol, side,
         order_type, notional_cents, quantity_micros, limit_price_micros,
         stop_price_micros, reserved_cents, status, source_observation_id,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'entry', $8, 'buy',
         'limit', $9, $10, $11, $12, $9, 'open', $13, $14, $14)
       RETURNING *;`,
      [orderId, input.clientOrderId, input.accountId, input.ownerProfileId,
        account.connection_id, account.room_id, input.riskDecisionId,
        candidate.symbol, candidate.notional_cents, quantityMicros,
        candidate.entry_limit_micros, candidate.stop_price_micros,
        quote.observationId, at],
    );
    await client.query(
      `UPDATE helix_paper_trading_accounts
       SET buying_power_cents = $3, updated_at = $4
       WHERE account_id = $1 AND owner_profile_id = $2;`,
      [input.accountId, input.ownerProfileId,
        integer(account.buying_power_cents) - candidate.notional_cents, at],
    );
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
     FROM helix_paper_orders WHERE account_id = $1 AND status = 'open';`,
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

const fillEntry = async (input: {
  db: Queryable;
  account: AccountRow;
  order: OrderRow;
  quote: PaperQuoteEvidence;
  at: string;
}): Promise<{ orderId: string; position: PositionRow }> => {
  const quantity = integer(input.order.quantity_micros);
  const reserved = integer(input.order.reserved_cents);
  const gross = grossCents(quantity, input.quote.askMicros, "ceil");
  if (gross > reserved) throw new Error("paper entry exceeded reserved cash");
  const marketValue = grossCents(quantity, input.quote.bidMicros, "floor");
  const positionId = `paper_position:${crypto.randomUUID()}`;
  const fillId = `paper_fill:${crypto.randomUUID()}`;
  const { rows: positions } = await input.db.query<PositionRow>(
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
      input.account.connection_id, input.account.room_id, input.order.symbol,
      quantity, input.quote.askMicros, input.order.stop_price_micros, gross,
      input.quote.bidMicros, marketValue, marketValue - gross,
      input.order.order_id, input.at],
  );
  await input.db.query(
    `INSERT INTO helix_paper_fills (
       fill_id, order_id, account_id, position_id, side, symbol,
       quantity_micros, price_micros, gross_cents, source_observation_id,
       market_observed_at, filled_at
     ) VALUES ($1, $2, $3, $4, 'buy', $5, $6, $7, $8, $9, $10, $11);`,
    [fillId, input.order.order_id, input.account.account_id, positionId,
      input.order.symbol, quantity, input.quote.askMicros, gross,
      input.quote.observationId, input.quote.observedAt, input.at],
  );
  await input.db.query(
    `UPDATE helix_paper_orders
     SET status = 'filled', reserved_cents = 0, filled_at = $2, updated_at = $2
     WHERE order_id = $1;`,
    [input.order.order_id, input.at],
  );
  const nextSymbols = Array.from(new Set([
    ...stringArray(input.account.open_symbols),
    input.order.symbol,
  ]));
  await input.db.query(
    `UPDATE helix_paper_trading_accounts
     SET buying_power_cents = buying_power_cents + $3,
         new_trades_today = new_trades_today + 1,
         open_symbols = $4::jsonb, updated_at = $5
     WHERE account_id = $1 AND owner_profile_id = $2;`,
    [input.account.account_id, input.account.owner_profile_id,
      reserved - gross, JSON.stringify(nextSymbols), input.at],
  );
  await writeJournal(input.db, {
    account: input.account,
    type: "entry_filled",
    subjectRef: input.order.order_id,
    payload: {
      fill_id: fillId,
      position_id: positionId,
      symbol: input.order.symbol,
      quantity_micros: quantity,
      price_micros: input.quote.askMicros,
      gross_cents: gross,
      observation_id: input.quote.observationId,
    },
    at: input.at,
  });
  return { orderId: input.order.order_id, position: positions[0] };
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
       stop_price_micros, reserved_cents, status, source_observation_id,
       created_at, updated_at, filled_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NULL, 'exit', $7, 'sell',
       'limit', $8, $9, $10, NULL, 0, 'filled', $11, $12, $12, $12);`,
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
  const db = await readSharedRealtimeRoomDatabase();
  const initial = await loadAccount(db, input.ownerProfileId, input.accountId);
  await assertAccountAccess(initial);
  const quote = await readQuoteForAccount({
    account: initial,
    observationId: input.observationId,
    symbol: input.symbol.toUpperCase(),
    now,
  });
  assertRegularSession(quote);
  return withSharedRealtimeRoomTransaction(async (client) => {
    const account = await loadAccount(
      client, input.ownerProfileId, input.accountId, true,
    );
    const { rows: processed } = await client.query<{ receipt_json: unknown }>(
      `SELECT receipt_json FROM helix_paper_processed_observations
       WHERE account_id = $1 AND observation_id = $2 LIMIT 1;`,
      [input.accountId, input.observationId],
    );
    if (processed[0]) {
      return helixPaperProcessObservationReceiptSchema.parse(
        processed[0].receipt_json,
      );
    }
    const filledOrderIds: string[] = [];
    const markedPositionIds: string[] = [];
    const stopExitOrderIds: string[] = [];
    const { rows: orders } = await client.query<OrderRow>(
      `SELECT * FROM helix_paper_orders
       WHERE account_id = $1 AND symbol = $2 AND status = 'open'
         AND intent = 'entry' ORDER BY created_at FOR UPDATE;`,
      [input.accountId, quote.symbol],
    );
    for (const order of orders) {
      if (quote.askMicros <= integer(order.limit_price_micros)) {
        const filled = await fillEntry({ db: client, account, order, quote,
          at: now.toISOString() });
        filledOrderIds.push(filled.orderId);
      }
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
    if (order.status !== "open") return projectOrder(order);
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
