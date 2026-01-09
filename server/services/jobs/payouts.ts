import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import {
  payoutRecordSchema,
  type PayoutKind,
  type PayoutRecord,
  type PayoutStatus,
} from "@shared/jobs";
import {
  awardTokens,
  getTokenBalance,
  getUbiPoolUserId,
  listTokenBalances,
  spendTokens,
} from "./token-budget";

const parseNumber = (value: string | undefined, fallback: number, min = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.floor(parsed));
};

const parseRotateMaxBytes = (): number =>
  parseNumber(process.env.ESSENCE_PAYOUT_ROTATE_MAX_BYTES, 20000000, 0);

const parseRotateMaxFiles = (): number =>
  parseNumber(process.env.ESSENCE_PAYOUT_ROTATE_MAX_FILES, 5, 0);

const parseBufferSize = (): number =>
  Math.min(
    Math.max(25, parseNumber(process.env.ESSENCE_PAYOUT_BUFFER_SIZE, 200, 1)),
    5000,
  );

const parseMinBalance = (): number =>
  parseNumber(process.env.UBI_ELIGIBLE_MIN_BALANCE, 1, 0);

const parseMinPayout = (): number =>
  parseNumber(process.env.UBI_MIN_PAYOUT, 1, 0);

const parseMaxUsers = (): number =>
  parseNumber(process.env.UBI_MAX_USERS, 500, 1);

const AUDIT_PERSIST_ENABLED = process.env.ESSENCE_PAYOUT_PERSIST !== "0";
const AUDIT_LOG_PATH = resolveAuditLogPath();
const ROTATE_MAX_BYTES = parseRotateMaxBytes();
const ROTATE_MAX_FILES = parseRotateMaxFiles();
const MAX_BUFFER_SIZE = parseBufferSize();
const UBI_MIN_BALANCE = parseMinBalance();
const UBI_MIN_PAYOUT = parseMinPayout();
const UBI_MAX_USERS = parseMaxUsers();

const payoutById = new Map<string, PayoutRecord>();
const payoutBuffer: PayoutRecord[] = [];
let payoutSequence = 0;
let persistChain = Promise.resolve();
let persistedBytes = loadPersistedBytes();

const nextSequence = () => {
  payoutSequence += 1;
  return payoutSequence;
};

const storePayoutRecord = (record: PayoutRecord): void => {
  payoutById.set(record.id, record);
  payoutBuffer.push(record);
  if (payoutBuffer.length > MAX_BUFFER_SIZE) {
    payoutBuffer.splice(0, payoutBuffer.length - MAX_BUFFER_SIZE);
  }
};

const persistPayoutRecord = (record: PayoutRecord): void => {
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
      console.warn("[payouts] failed to persist audit log", error);
    });
};

const updatePayoutRecord = (
  record: PayoutRecord,
  updates: Partial<PayoutRecord>,
): PayoutRecord => {
  const updated: PayoutRecord = {
    ...record,
    ...updates,
    seq: nextSequence(),
    updatedAt: Date.now(),
  };
  storePayoutRecord(updated);
  persistPayoutRecord(updated);
  return updated;
};

const createPayoutRecord = (record: PayoutRecord): PayoutRecord => {
  storePayoutRecord(record);
  persistPayoutRecord(record);
  return record;
};

export const listPayouts = (opts?: {
  userId?: string | null;
  kind?: PayoutKind;
  status?: PayoutStatus;
  limit?: number;
}): PayoutRecord[] => {
  const limit = Math.max(1, Math.min(opts?.limit ?? 50, 200));
  const userId = opts?.userId?.trim() || null;
  const filtered = Array.from(payoutById.values())
    .filter((record) => (userId ? record.userId === userId : true))
    .filter((record) => (opts?.kind ? record.kind === opts.kind : true))
    .filter((record) => (opts?.status ? record.status === opts.status : true))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  return filtered;
};

export const getPayout = (id: string): PayoutRecord | null =>
  payoutById.get(id) ?? null;

export const requestPayout = (input: {
  userId: string;
  amount: number;
  destination?: string;
  reason?: string;
}):
  | { ok: true; payout: PayoutRecord }
  | { ok: false; error: "insufficient_balance" | "invalid_amount" } => {
  const amount = Math.max(0, Math.floor(input.amount));
  if (amount <= 0) {
    return { ok: false, error: "invalid_amount" };
  }
  const balance = getTokenBalance(input.userId);
  if (balance.balance < amount) {
    return { ok: false, error: "insufficient_balance" };
  }
  const now = Date.now();
  const payoutId = `payout_${randomUUID().replace(/-/g, "")}`;
  spendTokens(input.userId, amount, `payout:withdrawal:${payoutId}`, {
    source: "payout",
    ref: payoutId,
  });
  const record: PayoutRecord = {
    id: payoutId,
    seq: nextSequence(),
    createdAt: now,
    updatedAt: now,
    userId: input.userId,
    kind: "withdrawal",
    status: "pending",
    amount,
    reason: input.reason?.trim() || "user_withdrawal",
    destination: input.destination?.trim() || undefined,
    meta: { balanceAfter: Math.max(0, balance.balance - amount) },
  };
  return { ok: true, payout: createPayoutRecord(record) };
};

export const fundUbiPool = (input: {
  amount: number;
  reason?: string;
}):
  | { ok: true; balance: ReturnType<typeof getTokenBalance> }
  | { ok: false; error: "invalid_amount" } => {
  const amount = Math.max(0, Math.floor(input.amount));
  if (amount <= 0) {
    return { ok: false, error: "invalid_amount" };
  }
  const poolUser = getUbiPoolUserId();
  const fundId = `ubi_fund_${randomUUID().replace(/-/g, "")}`;
  const reason = input.reason?.trim() || "ubi:fund";
  const balance = awardTokens(poolUser, amount, `${reason}:${fundId}`, undefined, {
    source: "ubi",
    ref: fundId,
  });
  return { ok: true, balance };
};

export const updatePayoutStatus = (
  id: string,
  status: PayoutStatus,
  note?: string,
): PayoutRecord | null => {
  const existing = payoutById.get(id);
  if (!existing) return null;
  const meta = note ? { ...(existing.meta ?? {}), note } : existing.meta;
  return updatePayoutRecord(existing, { status, meta });
};

export const runUbiDistribution = (input?: {
  minBalance?: number;
  minPayout?: number;
  maxUsers?: number;
}):
  | {
      ok: true;
      distributionId: string;
      perUser: number;
      total: number;
      poolBefore: number;
      poolAfter: number;
      participants: number;
    }
  | { ok: false; reason: "pool_empty" | "no_eligible_users" | "below_min" } => {
  const poolUser = getUbiPoolUserId();
  const poolBefore = getTokenBalance(poolUser).balance;
  if (poolBefore <= 0) {
    return { ok: false, reason: "pool_empty" };
  }
  const minBalance = Math.max(0, input?.minBalance ?? UBI_MIN_BALANCE);
  const maxUsers = Math.max(1, input?.maxUsers ?? UBI_MAX_USERS);
  const eligible = listTokenBalances({ includePool: false, limit: maxUsers })
    .filter((entry) => entry.balance >= minBalance)
    .sort((a, b) => a.userId.localeCompare(b.userId));
  if (eligible.length === 0) {
    return { ok: false, reason: "no_eligible_users" };
  }
  const perUser = Math.floor(poolBefore / eligible.length);
  const minPayout = Math.max(0, input?.minPayout ?? UBI_MIN_PAYOUT);
  if (perUser < minPayout) {
    return { ok: false, reason: "below_min" };
  }
  const distributionId = `ubi_${randomUUID().replace(/-/g, "")}`;
  const total = perUser * eligible.length;
  const now = Date.now();

  for (const entry of eligible) {
    awardTokens(
      entry.userId,
      perUser,
      `ubi:distribution:${distributionId}`,
      undefined,
      { source: "ubi", ref: distributionId },
    );
    createPayoutRecord({
      id: `payout_${randomUUID().replace(/-/g, "")}`,
      seq: nextSequence(),
      createdAt: now,
      updatedAt: now,
      userId: entry.userId,
      kind: "ubi",
      status: "completed",
      amount: perUser,
      reason: "ubi_distribution",
      distributionId,
    });
  }

  spendTokens(poolUser, total, `ubi:distribution:${distributionId}`, {
    source: "ubi",
    ref: distributionId,
  });

  createPayoutRecord({
    id: `payout_${randomUUID().replace(/-/g, "")}`,
    seq: nextSequence(),
    createdAt: now,
    updatedAt: now,
    kind: "ubi",
    status: "completed",
    amount: total,
    reason: "ubi_distribution_summary",
    distributionId,
    meta: {
      poolBefore,
      poolAfter: Math.max(0, poolBefore - total),
      participants: eligible.length,
      perUser,
    },
  });

  return {
    ok: true,
    distributionId,
    perUser,
    total,
    poolBefore,
    poolAfter: Math.max(0, poolBefore - total),
    participants: eligible.length,
  };
};

function resolveAuditLogPath(): string {
  const explicit = process.env.ESSENCE_PAYOUT_AUDIT_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  const dir = process.env.ESSENCE_PAYOUT_AUDIT_DIR?.trim() || ".cal";
  return path.resolve(process.cwd(), dir, "payouts.jsonl");
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

function readPersistedRecords(): PayoutRecord[] {
  if (!AUDIT_PERSIST_ENABLED) {
    return [];
  }
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_LOG_PATH, "utf8");
    const lines = raw.split(/\r?\n/);
    const parsed: PayoutRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed);
        const result = payoutRecordSchema.safeParse(record);
        if (result.success) {
          parsed.push(result.data);
        }
      } catch {
        continue;
      }
    }
    return parsed;
  } catch (error) {
    console.warn("[payouts] failed to read audit log", error);
    return [];
  }
}

function hydrateFromPersisted(): void {
  const records = readPersistedRecords();
  if (records.length === 0) return;
  for (const record of records) {
    payoutById.set(record.id, record);
    payoutBuffer.push(record);
    if (record.seq > payoutSequence) {
      payoutSequence = record.seq;
    }
  }
  if (payoutBuffer.length > MAX_BUFFER_SIZE) {
    payoutBuffer.splice(0, payoutBuffer.length - MAX_BUFFER_SIZE);
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

hydrateFromPersisted();
