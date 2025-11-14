import { randomUUID } from "node:crypto";
import type { TokenBalance, TokenLedgerEntry } from "@shared/jobs";

type UserId = string;

const DEFAULT_DAILY_BASE = Number(process.env.ESSENCE_TOKENS_DAILY_BASE ?? 500);

interface BudgetRecord {
  balance: number;
  dailyBase: number;
  nextResetAt: number; // epoch ms
  ledger: TokenLedgerEntry[];
}

const byUser = new Map<UserId, BudgetRecord>();

const now = () => Date.now();

const startOfTomorrow = () => {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
};

function ensure(userId: UserId): BudgetRecord {
  let record = byUser.get(userId);
  const todayReset = startOfTomorrow();
  if (!record) {
    record = { balance: DEFAULT_DAILY_BASE, dailyBase: DEFAULT_DAILY_BASE, nextResetAt: todayReset, ledger: [] };
    byUser.set(userId, record);
  }
  if (now() >= record.nextResetAt) {
    record.balance = record.dailyBase;
    record.nextResetAt = startOfTomorrow();
  }
  return record;
}

export function getTokenBalance(userId: UserId, withLedger = false): TokenBalance {
  const rec = ensure(userId);
  return {
    userId,
    balance: rec.balance,
    dailyBase: rec.dailyBase,
    nextResetAt: rec.nextResetAt,
    ledger: withLedger ? rec.ledger.slice(-50) : undefined,
  };
}

export function awardTokens(userId: UserId, amount: number, reason: string, jobId?: string): TokenBalance {
  if (!Number.isFinite(amount)) amount = 0;
  amount = Math.round(amount);
  const rec = ensure(userId);
  rec.balance += amount;
  rec.ledger.push({ id: randomUUID(), at: now(), delta: amount, reason, jobId });
  return getTokenBalance(userId);
}

export function spendTokens(userId: UserId, amount: number, reason = "spend"): TokenBalance {
  if (!Number.isFinite(amount)) amount = 0;
  amount = Math.round(amount);
  const rec = ensure(userId);
  rec.balance = Math.max(0, rec.balance - amount);
  rec.ledger.push({ id: randomUUID(), at: now(), delta: -amount, reason });
  return getTokenBalance(userId);
}

