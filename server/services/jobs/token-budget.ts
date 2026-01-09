import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  tokenLedgerEntrySchema,
  type TokenBalance,
  type TokenLedgerEntry,
  type TokenLedgerSource,
} from "@shared/jobs";

type UserId = string;

const parseNumber = (value: string | undefined, fallback: number, min = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.floor(parsed));
};

const parseFraction = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(0, parsed), 1);
};

const parseRotateMaxBytes = (): number =>
  parseNumber(process.env.ESSENCE_TOKENS_ROTATE_MAX_BYTES, 20000000, 0);

const parseRotateMaxFiles = (): number =>
  parseNumber(process.env.ESSENCE_TOKENS_ROTATE_MAX_FILES, 5, 0);

const parseLedgerBuffer = (): number =>
  Math.min(
    Math.max(25, parseNumber(process.env.ESSENCE_TOKENS_LEDGER_BUFFER, 200, 1)),
    5000,
  );

const DEFAULT_DAILY_BASE = parseNumber(
  process.env.ESSENCE_TOKENS_DAILY_BASE,
  500,
  0,
);
const UBI_POOL_USER =
  process.env.UBI_POOL_USER?.trim() || "__ubi_pool__";
const UBI_POOL_DAILY_BASE = parseNumber(
  process.env.UBI_POOL_DAILY_BASE,
  0,
  0,
);
const UBI_POOL_SHARE = parseFraction(process.env.UBI_POOL_SHARE, 0);

const AUDIT_PERSIST_ENABLED = process.env.ESSENCE_TOKENS_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const MAX_LEDGER_ENTRIES = parseLedgerBuffer();

const tokenLedgerRecordSchema = z
  .object({
    id: z.string(),
    seq: z.number().int().nonnegative(),
    userId: z.string(),
    entry: tokenLedgerEntrySchema,
    balance: z.number().int(),
    dailyBase: z.number().int(),
    nextResetAt: z.number().int(),
  })
  .strict();
type TokenLedgerRecord = z.infer<typeof tokenLedgerRecordSchema>;

interface BudgetRecord {
  balance: number;
  dailyBase: number;
  nextResetAt: number; // epoch ms
  ledger: TokenLedgerEntry[];
}

const byUser = new Map<UserId, BudgetRecord>();
let ledgerSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

const now = () => Date.now();

const startOfTomorrow = () => {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
};

const resolveDailyBase = (userId: UserId): number =>
  userId === UBI_POOL_USER ? UBI_POOL_DAILY_BASE : DEFAULT_DAILY_BASE;

const nextSequence = () => {
  ledgerSequence += 1;
  return ledgerSequence;
};

const storeLedgerEntry = (
  userId: UserId,
  record: BudgetRecord,
  entry: TokenLedgerEntry,
): void => {
  record.ledger.push(entry);
  if (record.ledger.length > MAX_LEDGER_ENTRIES) {
    record.ledger.splice(0, record.ledger.length - MAX_LEDGER_ENTRIES);
  }
  const logRecord: TokenLedgerRecord = {
    id: entry.id,
    seq: nextSequence(),
    userId,
    entry,
    balance: record.balance,
    dailyBase: record.dailyBase,
    nextResetAt: record.nextResetAt,
  };
  persistLedgerRecord(logRecord);
};

const applyDailyReset = (userId: UserId, record: BudgetRecord, ts: number) => {
  const resetAt = startOfTomorrow();
  const delta = record.dailyBase - record.balance;
  record.balance = record.dailyBase;
  record.nextResetAt = resetAt;
  if (delta !== 0) {
    storeLedgerEntry(userId, record, {
      id: randomUUID(),
      at: ts,
      delta,
      reason: "ubi:daily-reset",
      source: "ubi",
    });
  }
};

function ensure(userId: UserId): BudgetRecord {
  let record = byUser.get(userId);
  const ts = now();
  if (!record) {
    const dailyBase = resolveDailyBase(userId);
    record = {
      balance: dailyBase,
      dailyBase,
      nextResetAt: startOfTomorrow(),
      ledger: [],
    };
    byUser.set(userId, record);
    if (dailyBase !== 0) {
      storeLedgerEntry(userId, record, {
        id: randomUUID(),
        at: ts,
        delta: dailyBase,
        reason: "ubi:daily-base:init",
        source: "ubi",
      });
    }
  }
  if (ts >= record.nextResetAt) {
    applyDailyReset(userId, record, ts);
  }
  return record;
}

export function getUbiPoolUserId(): string {
  return UBI_POOL_USER;
}

export function getTokenBalance(
  userId: UserId,
  withLedger = false,
): TokenBalance {
  const rec = ensure(userId);
  return {
    userId,
    balance: rec.balance,
    dailyBase: rec.dailyBase,
    nextResetAt: rec.nextResetAt,
    ledger: withLedger ? rec.ledger.slice(-50) : undefined,
  };
}

export function listTokenBalances(opts?: {
  limit?: number;
  includePool?: boolean;
}): TokenBalance[] {
  const limit = Math.max(1, Math.min(opts?.limit ?? 200, 1000));
  const includePool = opts?.includePool ?? false;
  const userIds = Array.from(byUser.keys())
    .filter((userId) => includePool || userId !== UBI_POOL_USER)
    .sort((a, b) => a.localeCompare(b));
  return userIds.map((userId) => getTokenBalance(userId, false)).slice(0, limit);
}

type LedgerMeta = {
  source?: TokenLedgerSource;
  ref?: string;
  evidence?: string;
};

const buildLedgerEntry = (
  delta: number,
  reason: string,
  jobId?: string,
  meta?: LedgerMeta,
): TokenLedgerEntry => ({
  id: randomUUID(),
  at: now(),
  delta,
  reason,
  jobId,
  source: meta?.source,
  ref: meta?.ref,
  evidence: meta?.evidence,
});

export function awardTokens(
  userId: UserId,
  amount: number,
  reason: string,
  jobId?: string,
  meta?: LedgerMeta,
): TokenBalance {
  if (!Number.isFinite(amount)) amount = 0;
  amount = Math.round(amount);
  if (amount === 0) {
    return getTokenBalance(userId);
  }
  const rec = ensure(userId);
  rec.balance += amount;
  storeLedgerEntry(userId, rec, buildLedgerEntry(amount, reason, jobId, meta));
  return getTokenBalance(userId);
}

export function awardEarnings(
  userId: UserId,
  amount: number,
  reason: string,
  jobId?: string,
  meta?: LedgerMeta,
): TokenBalance {
  if (!Number.isFinite(amount)) amount = 0;
  const rounded = Math.round(amount);
  if (rounded <= 0) {
    return getTokenBalance(userId);
  }
  const poolShare =
    UBI_POOL_SHARE > 0 ? Math.max(0, Math.floor(rounded * UBI_POOL_SHARE)) : 0;
  const balance = awardTokens(userId, rounded, reason, jobId, meta);
  if (poolShare > 0) {
    awardTokens(
      UBI_POOL_USER,
      poolShare,
      "ubi:pool:earnings",
      jobId,
      { source: "ubi", ref: meta?.ref },
    );
  }
  return balance;
}

export function spendTokens(
  userId: UserId,
  amount: number,
  reason = "spend",
  meta?: LedgerMeta,
): TokenBalance {
  if (!Number.isFinite(amount)) amount = 0;
  amount = Math.round(amount);
  if (amount === 0) {
    return getTokenBalance(userId);
  }
  const rec = ensure(userId);
  const applied = Math.min(rec.balance, amount);
  rec.balance = Math.max(0, rec.balance - amount);
  if (applied !== 0) {
    storeLedgerEntry(
      userId,
      rec,
      buildLedgerEntry(-applied, reason, undefined, meta),
    );
  }
  return getTokenBalance(userId);
}

function resolveAuditLogPath(): string {
  const explicit = process.env.ESSENCE_TOKENS_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.ESSENCE_TOKENS_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "token-ledger.jsonl");
}

function loadPersistedBytes(): number {
  if (!AUDIT_PERSIST_ENABLED) {
    return 0;
  }
  try {
    const stat = fs.statSync(AUDIT_LOG_PATH);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function readPersistedRecords(): TokenLedgerRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: TokenLedgerRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = tokenLedgerRecordSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[token-ledger] failed to read audit log", error);
    return [];
  }
}

function hydrateFromPersisted(): void {
  const records = readPersistedRecords();
  if (records.length === 0) return;
  for (const record of records) {
    const rec = byUser.get(record.userId) ?? {
      balance: record.balance,
      dailyBase: record.dailyBase,
      nextResetAt: record.nextResetAt,
      ledger: [],
    };
    rec.balance = record.balance;
    rec.dailyBase = record.dailyBase;
    rec.nextResetAt = record.nextResetAt;
    rec.ledger.push(record.entry);
    if (rec.ledger.length > MAX_LEDGER_ENTRIES) {
      rec.ledger.splice(0, rec.ledger.length - MAX_LEDGER_ENTRIES);
    }
    byUser.set(record.userId, rec);
    if (record.seq > ledgerSequence) {
      ledgerSequence = record.seq;
    }
  }
}

function maybeRotateAuditLog(nextBytes: number): Promise<void> {
  if (ROTATE_MAX_BYTES <= 0) return Promise.resolve();
  if (persistedBytes + nextBytes <= ROTATE_MAX_BYTES) {
    return Promise.resolve();
  }
  return rotateAuditLog();
}

async function rotateAuditLog(): Promise<void> {
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    persistedBytes = 0;
    return;
  }
  const dir = path.dirname(AUDIT_LOG_PATH);
  const ext = path.extname(AUDIT_LOG_PATH) || ".jsonl";
  const base = path.basename(AUDIT_LOG_PATH, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "");
  const rotated = path.join(dir, `${base}.${stamp}${ext}`);
  await fsPromises.rename(AUDIT_LOG_PATH, rotated);
  persistedBytes = 0;
  await pruneAuditRotations(dir, base, ext);
}

async function pruneAuditRotations(
  dir: string,
  base: string,
  ext: string,
): Promise<void> {
  if (ROTATE_MAX_FILES <= 0) return;
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const prefix = `${base}.`;
  const candidates = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(prefix) &&
        entry.name.endsWith(ext),
    )
    .map((entry) => entry.name)
    .sort();
  const excess = candidates.length - ROTATE_MAX_FILES;
  if (excess <= 0) return;
  const toRemove = candidates.slice(0, excess);
  await Promise.all(
    toRemove.map((name) =>
      fsPromises.unlink(path.join(dir, name)).catch(() => undefined),
    ),
  );
}

const persistLedgerRecord = (record: TokenLedgerRecord): void => {
  if (!AUDIT_PERSIST_ENABLED) {
    return;
  }
  const line = JSON.stringify(record);
  const lineBytes = Buffer.byteLength(`${line}\n`, "utf8");
  persistChain = persistChain
    .then(async () => {
      await fsPromises.mkdir(path.dirname(AUDIT_LOG_PATH), { recursive: true });
      await maybeRotateAuditLog(lineBytes);
      await fsPromises.appendFile(AUDIT_LOG_PATH, `${line}\n`, "utf8");
      persistedBytes += lineBytes;
    })
    .catch((error) => {
      console.warn("[token-ledger] failed to persist audit log", error);
    });
};

hydrateFromPersisted();

