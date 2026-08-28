import { readSharedRealtimeRoomDatabase } from
  "../helix-ask/realtime-room/room-store/database";
import { PaperTradingError } from "./paper-trading-errors";

export type PaperQuoteEvidence = {
  observationId: string;
  symbol: string;
  bidMicros: number;
  askMicros: number;
  observedAt: string;
  outputHash: string;
  producerEpochRef: string;
};

type EvidenceRow = {
  observation_id: string;
  upstream_tool: string;
  capability_id: string;
  status: string;
  audit_output_hash: string | null;
  evidence_output_hash: string;
  normalized_data: unknown;
  observed_at: string | Date;
  producer_epoch_ref: string;
};

const normalizedKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");

const decimalToMicros = (value: unknown): number | null => {
  const source = typeof value === "number"
    ? (Number.isFinite(value) ? String(value) : "")
    : typeof value === "string"
      ? value.trim().replace(/^\$/u, "").replace(/,/gu, "")
      : "";
  const match = /^(\d{1,7})(?:\.(\d{0,6}))?$/u.exec(source);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(6, "0"));
  const micros = whole * 1_000_000 + fraction;
  return Number.isSafeInteger(micros) && micros > 0 ? micros : null;
};

const scalarFrom = (
  value: unknown,
  nestedKeys: ReadonlySet<string>,
): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (nestedKeys.has(normalizedKey(key))) return entry;
  }
  return null;
};

const findDirect = (
  record: Record<string, unknown>,
  keys: ReadonlySet<string>,
): unknown => {
  for (const [key, value] of Object.entries(record)) {
    if (keys.has(normalizedKey(key))) return value;
  }
  return null;
};

const collectRecords = (
  value: unknown,
  output: Record<string, unknown>[],
  depth = 0,
): void => {
  if (depth > 7 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) collectRecords(entry, output, depth + 1);
    return;
  }
  const record = value as Record<string, unknown>;
  output.push(record);
  for (const entry of Object.values(record)) {
    collectRecords(entry, output, depth + 1);
  }
};

const SYMBOL_KEYS = new Set(["symbol", "ticker", "stocksymbol"]);
const BID_KEYS = new Set(["bid", "bidprice", "bestbid", "bestbidprice"]);
const ASK_KEYS = new Set(["ask", "askprice", "bestask", "bestaskprice"]);
const PRICE_KEYS = new Set(["price", "amount", "value"]);

export const extractPaperQuote = (input: {
  data: unknown;
  symbol: string;
}): { bidMicros: number; askMicros: number } => {
  const records: Record<string, unknown>[] = [];
  collectRecords(input.data, records);
  const target = input.symbol.toUpperCase();
  for (const record of records) {
    const symbolValue = findDirect(record, SYMBOL_KEYS);
    if (typeof symbolValue !== "string" || symbolValue.toUpperCase() !== target) {
      continue;
    }
    const bidMicros = decimalToMicros(
      scalarFrom(findDirect(record, BID_KEYS), PRICE_KEYS),
    );
    const askMicros = decimalToMicros(
      scalarFrom(findDirect(record, ASK_KEYS), PRICE_KEYS),
    );
    if (bidMicros !== null && askMicros !== null && askMicros >= bidMicros) {
      return { bidMicros, askMicros };
    }
  }
  throw new PaperTradingError(
    "paper_quote_evidence_invalid",
    409,
    "The stored Robinhood observation does not contain a valid quote for this symbol.",
  );
};

export const readPaperQuoteEvidenceRecord = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  observationId: string;
  symbol: string;
}): Promise<PaperQuoteEvidence> => {
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = await db.query<EvidenceRow>(
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
  if (!row || row.status !== "succeeded" ||
      row.upstream_tool !== "get_equity_quotes" ||
      row.capability_id !== "brokerage.robinhood.market_data.read" ||
      !row.audit_output_hash || row.audit_output_hash !== row.evidence_output_hash) {
    throw new PaperTradingError(
      "paper_quote_evidence_invalid",
      409,
      "A matching successful Robinhood quote observation is required.",
    );
  }
  const observedAt = new Date(row.observed_at);
  const quote = extractPaperQuote({ data: row.normalized_data, symbol: input.symbol });
  return {
    observationId: row.observation_id,
    symbol: input.symbol.toUpperCase(),
    bidMicros: quote.bidMicros,
    askMicros: quote.askMicros,
    observedAt: observedAt.toISOString(),
    outputHash: row.evidence_output_hash,
    producerEpochRef: row.producer_epoch_ref,
  };
};

export const readPaperQuoteEvidence = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  observationId: string;
  symbol: string;
  now: Date;
  maxAgeMs: number;
  maxFutureSkewMs: number;
}): Promise<PaperQuoteEvidence> => {
  const evidence = await readPaperQuoteEvidenceRecord(input);
  const ageMs = input.now.getTime() - Date.parse(evidence.observedAt);
  if (!Number.isFinite(ageMs) || ageMs > input.maxAgeMs ||
      ageMs < -input.maxFutureSkewMs) {
    throw new PaperTradingError(
      "paper_quote_evidence_stale",
      409,
      "The Robinhood quote observation is stale or has invalid clock ordering.",
    );
  }
  return evidence;
};
