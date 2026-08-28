import crypto from "node:crypto";
import {
  DEFAULT_HELIX_PAPER_RISK_POLICY,
  helixPaperTradeCandidateSchema,
  helixTradingRiskDecisionSchema,
  helixTradingRiskPolicySchema,
  type HelixPaperAccountState,
  type HelixPaperTradeCandidate,
  type HelixTradingRiskDecision,
  type HelixTradingRiskPolicy,
} from "@shared/trading/risk-contract";
import { assertRobinhoodPrivateRoomReadCapability } from
  "../brokerage/robinhood-connection-store";
import { readSharedRealtimeRoomDatabase } from
  "../helix-ask/realtime-room/room-store/database";
import { evaluatePaperTradeRisk } from "./paper-risk-engine";
import { PaperTradingError } from "./paper-trading-errors";
export { PaperTradingError } from "./paper-trading-errors";
import { readPaperQuoteEvidence } from "./paper-market-evidence";
import { readUsMarketClock } from "./us-market-clock";

export type PaperTradingAccountProjection = HelixPaperAccountState & {
  account_id: string;
  owner_profile_id: string;
  connection_id: string;
  room_id: string;
  policy: HelixTradingRiskPolicy;
  policy_hash: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  live_order_execution_enabled: false;
  credential_included: false;
  account_numbers_included: false;
  answer_authority: false;
};

type PaperAccountRow = {
  account_id: string;
  owner_profile_id: string;
  connection_id: string;
  room_id: string;
  policy_json: unknown;
  policy_hash: string;
  account_equity_cents: number | string;
  buying_power_cents: number | string;
  realized_pnl_cents: number | string;
  unrealized_pnl_cents: number | string;
  trading_day: string | Date;
  new_trades_today: number | string;
  open_symbols: unknown;
  consecutive_losses: number | string;
  kill_switch_active: boolean;
  kill_switch_reason: string | null;
  status: "active" | "archived";
  created_at: string | Date;
  updated_at: string | Date;
};

const iso = (value: string | Date): string => new Date(value).toISOString();
const dateOnly = (value: string | Date): string =>
  typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string =>
    typeof entry === "string") : [];
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
};
const hash = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256")
    .update(JSON.stringify(canonicalize(value))).digest("hex")}`;

const projectAccount = (row: PaperAccountRow): PaperTradingAccountProjection => ({
  schema: "helix.trading_risk.v1",
  account_id: row.account_id,
  owner_profile_id: row.owner_profile_id,
  connection_id: row.connection_id,
  room_id: row.room_id,
  policy: helixTradingRiskPolicySchema.parse(row.policy_json),
  policy_hash: row.policy_hash,
  trading_day: dateOnly(row.trading_day),
  account_equity_cents: Number(row.account_equity_cents),
  buying_power_cents: Number(row.buying_power_cents),
  realized_pnl_cents: Number(row.realized_pnl_cents),
  unrealized_pnl_cents: Number(row.unrealized_pnl_cents),
  new_trades_today: Number(row.new_trades_today),
  open_symbols: strings(row.open_symbols),
  consecutive_losses: Number(row.consecutive_losses),
  kill_switch_active: row.kill_switch_active,
  kill_switch_reason: row.kill_switch_reason,
  status: row.status,
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
  live_order_execution_enabled: false,
  credential_included: false,
  account_numbers_included: false,
  answer_authority: false,
});

const readAccount = async (input: {
  ownerProfileId: string;
  accountId?: string;
  connectionId?: string;
  roomId?: string;
}): Promise<PaperAccountRow | null> => {
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = input.accountId
    ? await db.query<PaperAccountRow>(
        `SELECT * FROM helix_paper_trading_accounts
         WHERE account_id = $1 AND owner_profile_id = $2 AND status = 'active'
         LIMIT 1;`,
        [input.accountId, input.ownerProfileId],
      )
    : await db.query<PaperAccountRow>(
        `SELECT * FROM helix_paper_trading_accounts
         WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
           AND status = 'active'
         LIMIT 1;`,
        [input.ownerProfileId, input.connectionId, input.roomId],
      );
  return rows[0] ?? null;
};

export const createPaperTradingAccount = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  startingEquityCents: number;
  tradingDay: string;
  policy?: HelixTradingRiskPolicy;
  now?: Date;
}): Promise<PaperTradingAccountProjection> => {
  if (!Number.isInteger(input.startingEquityCents) ||
      input.startingEquityCents <= 0 || input.startingEquityCents > 100_000_000) {
    throw new PaperTradingError(
      "paper_trading_unavailable",
      400,
      "Paper starting equity must be a positive integer number of cents.",
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(input.tradingDay)) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 400, "A valid trading day is required.",
    );
  }
  const now = input.now ?? new Date();
  const serverTradingDay = readUsMarketClock(now).tradingDate;
  if (input.tradingDay !== serverTradingDay) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The paper account trading day must match the server's New York market date.",
    );
  }
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const existing = await readAccount(input);
  if (existing) return projectAccount(existing);
  const policy = helixTradingRiskPolicySchema.parse(
    input.policy ?? DEFAULT_HELIX_PAPER_RISK_POLICY,
  );
  const db = await readSharedRealtimeRoomDatabase();
  const accountId = `paper_account:${crypto.randomUUID()}`;
  await db.query(
    `INSERT INTO helix_paper_trading_accounts (
       account_id, owner_profile_id, connection_id, room_id, policy_json,
       policy_hash, starting_equity_cents, account_equity_cents,
       buying_power_cents, trading_day, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $7, $7, $8, $9, $9)
     ON CONFLICT DO NOTHING;`,
    [accountId, input.ownerProfileId, input.connectionId, input.roomId,
      JSON.stringify(policy), hash(policy), input.startingEquityCents,
      input.tradingDay, now.toISOString()],
  );
  const created = await readAccount(input);
  if (!created) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 503,
      "The paper trading account could not be initialized.",
    );
  }
  return projectAccount(created);
};

export const getPaperTradingAccount = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
}): Promise<PaperTradingAccountProjection | null> => {
  await assertRobinhoodPrivateRoomReadCapability({
    ...input,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const row = await readAccount(input);
  return row ? projectAccount(row) : null;
};

export const getPaperTradingAccountById = async (input: {
  ownerProfileId: string;
  accountId: string;
}): Promise<PaperTradingAccountProjection | null> => {
  const row = await readAccount(input);
  if (!row) return null;
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: row.connection_id,
    roomId: row.room_id,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  return projectAccount(row);
};

export const evaluateAndRecordPaperTradeCandidate = async (input: {
  ownerProfileId: string;
  accountId: string;
  candidate: HelixPaperTradeCandidate;
  now?: Date;
}): Promise<HelixTradingRiskDecision> => {
  const candidate = helixPaperTradeCandidateSchema.parse(input.candidate);
  let row = await readAccount({
    ownerProfileId: input.ownerProfileId,
    accountId: input.accountId,
  });
  if (!row) {
    throw new PaperTradingError(
      "paper_account_not_found", 404, "The paper trading account was not found.",
    );
  }
  if (row.connection_id !== candidate.connection_id ||
      row.room_id !== candidate.room_id) {
    throw new PaperTradingError(
      "paper_candidate_identity_mismatch", 409,
      "The paper candidate does not belong to this account and room.",
    );
  }
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: row.connection_id,
    roomId: row.room_id,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const observationIds = [...new Set(candidate.source_observation_ids)];
  const db = await readSharedRealtimeRoomDatabase();
  const observationPlaceholders = observationIds
    .map((_, index) => `$${index + 4}`)
    .join(", ");
  const { rows: observations } = await db.query<{
    observation_id: string;
    capability_id: string;
  }>(
    `SELECT observation_id, capability_id
     FROM helix_brokerage_read_audit
     WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       AND status = 'succeeded'
       AND observation_id IN (${observationPlaceholders});`,
    [input.ownerProfileId, row.connection_id, row.room_id, ...observationIds],
  );
  if (observations.length !== observationIds.length ||
      !observations.some((entry) =>
        entry.capability_id === "brokerage.robinhood.market_data.read")) {
    throw new PaperTradingError(
      "paper_source_observation_invalid", 409,
      "Paper candidates require matching, successful market-data observations from this private room.",
    );
  }
  const account = projectAccount(row);
  const now = input.now ?? new Date();
  const quoteObservationId = candidate.source_observation_ids[0];
  const quote = await readPaperQuoteEvidence({
    ownerProfileId: input.ownerProfileId,
    connectionId: row.connection_id,
    roomId: row.room_id,
    observationId: quoteObservationId,
    symbol: candidate.symbol,
    now,
    maxAgeMs: account.policy.max_quote_age_ms,
    maxFutureSkewMs: account.policy.max_future_quote_skew_ms,
  });
  const marketClock = readUsMarketClock(new Date(quote.observedAt));
  if (candidate.bid_micros !== quote.bidMicros ||
      candidate.ask_micros !== quote.askMicros ||
      Date.parse(candidate.quote_observed_at) !== Date.parse(quote.observedAt) ||
      candidate.market_session !== marketClock.session ||
      candidate.minutes_since_regular_open !== marketClock.minutesSinceRegularOpen ||
      candidate.minutes_until_regular_close !== marketClock.minutesUntilRegularClose) {
    throw new PaperTradingError(
      "paper_quote_evidence_invalid", 409,
      "The paper candidate quote or market clock does not match its stored Robinhood evidence.",
    );
  }
  const accountTradingDay = dateOnly(row.trading_day);
  if (accountTradingDay > marketClock.tradingDate) {
    throw new PaperTradingError(
      "paper_quote_evidence_stale", 409,
      "The paper quote predates the account trading day.",
    );
  }
  if (accountTradingDay < marketClock.tradingDate) {
    await db.query(
      `UPDATE helix_paper_trading_accounts
       SET trading_day = $3, realized_pnl_cents = 0,
           new_trades_today = 0, consecutive_losses = 0,
           kill_switch_active = CASE
             WHEN kill_switch_reason LIKE '[automatic]%' THEN false
             ELSE kill_switch_active
           END,
           kill_switch_reason = CASE
             WHEN kill_switch_reason LIKE '[automatic]%' THEN NULL
             ELSE kill_switch_reason
           END,
           updated_at = $4
       WHERE account_id = $1 AND owner_profile_id = $2;`,
      [input.accountId, input.ownerProfileId, marketClock.tradingDate,
        now.toISOString()],
    );
    row = await readAccount({
      ownerProfileId: input.ownerProfileId,
      accountId: input.accountId,
    });
    if (!row) throw new PaperTradingError(
      "paper_account_not_found", 404, "The paper trading account was not found.",
    );
  }
  const currentAccount = projectAccount(row);
  const decision = evaluatePaperTradeRisk({
    policy: currentAccount.policy,
    candidate,
    account: {
      schema: currentAccount.schema,
      trading_day: currentAccount.trading_day,
      account_equity_cents: currentAccount.account_equity_cents,
      buying_power_cents: currentAccount.buying_power_cents,
      realized_pnl_cents: currentAccount.realized_pnl_cents,
      unrealized_pnl_cents: currentAccount.unrealized_pnl_cents,
      new_trades_today: currentAccount.new_trades_today,
      open_symbols: currentAccount.open_symbols,
      consecutive_losses: currentAccount.consecutive_losses,
      kill_switch_active: currentAccount.kill_switch_active,
      kill_switch_reason: currentAccount.kill_switch_reason,
    },
    now,
  });
  try {
    await db.query(
      `INSERT INTO helix_paper_risk_decisions (
         decision_id, account_id, owner_profile_id, connection_id, room_id,
         candidate_id, input_hash, verdict, reasons, source_observation_ids,
         candidate_json, decision_json, evaluated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb,
         $11::jsonb, $12::jsonb, $13);`,
      [decision.decision_id, input.accountId, input.ownerProfileId,
        row.connection_id, row.room_id, candidate.candidate_id,
        decision.input_hash, decision.verdict, JSON.stringify(decision.reasons),
        JSON.stringify(observationIds), JSON.stringify(candidate),
        JSON.stringify(decision), decision.evaluated_at],
    );
  } catch (error) {
    if ((error as { code?: string }).code !== "23505") throw error;
    const { rows } = await db.query<{ decision_json: unknown; input_hash: string }>(
      `SELECT decision_json, input_hash FROM helix_paper_risk_decisions
       WHERE account_id = $1 AND candidate_id = $2 LIMIT 1;`,
      [input.accountId, candidate.candidate_id],
    );
    if (!rows[0] || rows[0].input_hash !== decision.input_hash) {
      throw new PaperTradingError(
        "paper_candidate_replay_conflict", 409,
        "This paper candidate identity was already used for different inputs.",
      );
    }
    return helixTradingRiskDecisionSchema.parse(rows[0].decision_json);
  }
  return decision;
};

export const setPaperTradingKillSwitch = async (input: {
  ownerProfileId: string;
  accountId: string;
  connectionId: string;
  roomId: string;
  active: boolean;
  reason: string;
  now?: Date;
}): Promise<PaperTradingAccountProjection> => {
  const reason = input.reason.trim();
  if (!reason || reason.length > 500) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 400,
      "A concise kill-switch reason is required.",
    );
  }
  const row = await readAccount({
    ownerProfileId: input.ownerProfileId,
    accountId: input.accountId,
  });
  if (!row) {
    throw new PaperTradingError(
      "paper_account_not_found", 404, "The paper trading account was not found.",
    );
  }
  if (row.connection_id !== input.connectionId || row.room_id !== input.roomId) {
    throw new PaperTradingError(
      "paper_candidate_identity_mismatch", 409,
      "The paper account does not belong to this connection and room.",
    );
  }
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: row.connection_id,
    roomId: row.room_id,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const db = await readSharedRealtimeRoomDatabase();
  const now = input.now ?? new Date();
  await db.query(
    `UPDATE helix_paper_trading_accounts
     SET kill_switch_active = $3, kill_switch_reason = $4, updated_at = $5
     WHERE account_id = $1 AND owner_profile_id = $2;`,
    [input.accountId, input.ownerProfileId, input.active,
      input.active ? reason : null, now.toISOString()],
  );
  await db.query(
    `INSERT INTO helix_trading_kill_switch_events
       (event_id, account_id, owner_profile_id, active, reason, created_at)
     VALUES ($1, $2, $3, $4, $5, $6);`,
    [`kill_switch:${crypto.randomUUID()}`, input.accountId,
      input.ownerProfileId, input.active, reason, now.toISOString()],
  );
  const updated = await readAccount({
    ownerProfileId: input.ownerProfileId,
    accountId: input.accountId,
  });
  if (!updated) throw new PaperTradingError(
    "paper_account_not_found", 404, "The paper trading account was not found.",
  );
  return projectAccount(updated);
};
