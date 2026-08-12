import crypto from "node:crypto";
import type { HelixBrokerageObservation } from
  "@shared/helix-brokerage-environment";
import type { HelixLiveEquityOrderIntent } from
  "@shared/trading/live-order-contract";
import { executeRobinhoodPrivateRoomRead, type RobinhoodMcpReadCall } from
  "../brokerage/robinhood-read-adapter";
import { readPaperQuoteEvidence } from "./paper-market-evidence";
import { PaperTradingError } from "./paper-trading-errors";

export type LiveAccountPreflightSnapshot = {
  schema: "helix.live_account_preflight.v1";
  buying_power_cents: number;
  daily_pnl_cents: number;
  open_position_count: number;
  open_order_count: number;
  symbol_position_open: boolean;
  bid_micros: number;
  ask_micros: number;
  quote_observation_id: string;
  observed_at: string;
  observation_ids: string[];
  snapshot_hash: `sha256:${string}`;
};

const normalized = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const collectRecords = (
  value: unknown,
  output: Record<string, unknown>[],
  depth = 0,
): void => {
  if (depth > 7 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry: unknown) => collectRecords(entry, output, depth + 1));
    return;
  }
  const record = value as Record<string, unknown>;
  output.push(record);
  Object.values(record).forEach((entry: unknown) =>
    collectRecords(entry, output, depth + 1));
};
const field = (record: Record<string, unknown>, aliases: ReadonlySet<string>): unknown => {
  for (const [key, value] of Object.entries(record)) {
    if (aliases.has(normalized(key))) return value;
  }
  return undefined;
};
const decimalCents = (value: unknown): number | null => {
  const raw = typeof value === "number" && Number.isFinite(value)
    ? String(value) : typeof value === "string"
      ? value.trim().replace(/^\$/u, "").replace(/,/gu, "") : "";
  const match = /^(-?)(\d{1,9})(?:\.(\d{0,2}))?$/u.exec(raw);
  if (!match) return null;
  const cents = Number(match[2]) * 100 + Number((match[3] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? (match[1] ? -cents : cents) : null;
};
const decimalQuantity = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value :
    typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

export const extractLiveAccountPreflight = (input: {
  portfolio: unknown;
  positions: unknown;
  orders: unknown;
  symbol: string;
}): Omit<LiveAccountPreflightSnapshot,
  "schema" | "bid_micros" | "ask_micros" | "quote_observation_id" |
  "observed_at" | "observation_ids" | "snapshot_hash"> => {
  const portfolioRecords: Record<string, unknown>[] = [];
  collectRecords(input.portfolio, portfolioRecords);
  const buyingAliases = new Set([
    "buyingpower", "equitybuyingpower", "cashavailableforwithdrawal",
  ]);
  const pnlAliases = new Set([
    "daypnl", "dailypnl", "todayspnl", "todaypnl", "dayprofitloss",
    "todaysprofitloss", "totalreturntoday",
  ]);
  const buyingValues = new Set<number>();
  const pnlValues = new Set<number>();
  for (const record of portfolioRecords) {
    const buying = decimalCents(field(record, buyingAliases));
    if (buying !== null && buying >= 0) buyingValues.add(buying);
    const pnl = decimalCents(field(record, pnlAliases));
    if (pnl !== null) pnlValues.add(pnl);
  }
  if (buyingValues.size !== 1 || pnlValues.size !== 1) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "Robinhood's live buying-power or daily-P&L projection is missing or ambiguous.",
    );
  }

  const positionRecords: Record<string, unknown>[] = [];
  collectRecords(input.positions, positionRecords);
  const symbolAliases = new Set(["symbol", "ticker", "stocksymbol"]);
  const quantityAliases = new Set(["quantity", "shares", "assetquantity"]);
  const openSymbols = new Set<string>();
  for (const record of positionRecords) {
    const symbol = field(record, symbolAliases);
    const quantity = decimalQuantity(field(record, quantityAliases));
    if (typeof symbol === "string" && quantity !== null && quantity > 0) {
      openSymbols.add(symbol.toUpperCase());
    }
  }

  const orderRecords: Record<string, unknown>[] = [];
  collectRecords(input.orders, orderRecords);
  const statusAliases = new Set(["status", "state", "orderstate"]);
  const idAliases = new Set(["orderid", "ordernumber", "orderref"]);
  const terminal = new Set([
    "filled", "cancelled", "canceled", "rejected", "failed", "expired", "voided",
  ]);
  const openOrderIds = new Set<string>();
  for (const record of orderRecords) {
    const id = field(record, idAliases);
    const status = field(record, statusAliases);
    if (typeof id === "string" && typeof status === "string" &&
        !terminal.has(normalized(status))) openOrderIds.add(id);
  }
  return {
    buying_power_cents: [...buyingValues][0],
    daily_pnl_cents: [...pnlValues][0],
    open_position_count: openSymbols.size,
    open_order_count: openOrderIds.size,
    symbol_position_open: openSymbols.has(input.symbol.toUpperCase()),
  };
};

const hashSnapshot = (value: unknown): `sha256:${string}` =>
  `sha256:${crypto.createHash("sha256")
    .update(`helix-live-account-preflight/v1\n${JSON.stringify(value)}`)
    .digest("hex")}`;

export const readLiveAccountPreflight = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  accountRef: string;
  intent: HelixLiveEquityOrderIntent;
  now: Date;
  maxAgeMs: number;
  mcpCall?: RobinhoodMcpReadCall;
}): Promise<LiveAccountPreflightSnapshot> => {
  const read = (toolName: "get_portfolio" | "get_equity_positions" |
    "get_equity_orders" | "get_equity_quotes", args: Record<string, unknown>) =>
    executeRobinhoodPrivateRoomRead({
      ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId,
      roomId: input.roomId,
      toolName,
      arguments: args,
      now: input.now,
      mcpCall: input.mcpCall,
    });
  const accountArgs = { account_number: input.accountRef };
  const observations: HelixBrokerageObservation[] = [];
  observations.push(await read("get_portfolio", accountArgs));
  observations.push(await read("get_equity_positions", accountArgs));
  observations.push(await read("get_equity_orders", accountArgs));
  observations.push(await read("get_equity_quotes", { symbols: [input.intent.symbol] }));
  const base = extractLiveAccountPreflight({
    portfolio: observations[0].data,
    positions: observations[1].data,
    orders: observations[2].data,
    symbol: input.intent.symbol,
  });
  const quote = await readPaperQuoteEvidence({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    observationId: observations[3].observation_id,
    symbol: input.intent.symbol,
    now: input.now,
    maxAgeMs: input.maxAgeMs,
    maxFutureSkewMs: 5_000,
  });
  const payload = {
    ...base,
    bid_micros: quote.bidMicros,
    ask_micros: quote.askMicros,
    quote_observation_id: quote.observationId,
    observed_at: quote.observedAt,
    observation_ids: observations.map((entry) => entry.observation_id),
  };
  return {
    schema: "helix.live_account_preflight.v1",
    ...payload,
    snapshot_hash: hashSnapshot(payload),
  };
};
