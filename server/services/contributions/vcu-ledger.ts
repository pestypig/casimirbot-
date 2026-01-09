import { awardEarnings, spendTokens } from "../jobs/token-budget";
import type { TokenBalance } from "@shared/jobs";
import {
  getContributionReceipt,
  getContributionReceiptEntries,
  getContributionReviewSummary,
  updateContributionReceipt,
  revokeContributionReceipt,
  type ContributionReceiptRecord,
  type ContributionReviewSummary,
} from "./receipts";
import {
  checkContributionConcentrationPolicy,
  updateContributionConcentrationMetrics,
} from "./concentration";

export type VcuMintPolicy = {
  windowMs: number;
  hardCap: number;
  softCap: number;
  diminishRate: number;
};

export type VcuMintWindow = {
  mintedSoFar: number;
  remainingHardCap: number;
  remainingSoftCap: number;
};

export type VcuMintResult = {
  ok: boolean;
  minted: boolean;
  award: number;
  planned: number;
  capped: boolean;
  reason?: string;
  receipt?: ContributionReceiptRecord;
  balance?: TokenBalance;
  policy: VcuMintPolicy;
  window?: VcuMintWindow;
  reviewSummary?: ContributionReviewSummary;
};

export type VcuRevokeResult = {
  ok: boolean;
  reversed: boolean;
  reversal: number;
  reason?: string;
  receipt?: ContributionReceiptRecord;
  balance?: TokenBalance;
};

const parseEnvNumber = (
  value: string | undefined,
  fallback: number,
  min?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = min === undefined ? parsed : Math.max(min, parsed);
  return clamped;
};

const policy: VcuMintPolicy = {
  windowMs:
    parseEnvNumber(process.env.VCU_MINT_WINDOW_HOURS, 24, 1) * 60 * 60 * 1000,
  hardCap: parseEnvNumber(process.env.VCU_MINT_DAILY_CAP, 50, 0),
  softCap: parseEnvNumber(process.env.VCU_MINT_SOFT_CAP, 15, 0),
  diminishRate: Math.min(
    1,
    parseEnvNumber(process.env.VCU_MINT_DIMINISH_RATE, 0.5, 0),
  ),
};

const buildWindow = (
  contributorId: string,
  now: number,
): VcuMintWindow => {
  const start = now - policy.windowMs;
  let minted = 0;
  for (const receipt of getContributionReceiptEntries()) {
    if (receipt.contributorId !== contributorId) continue;
    if (!receipt.ledgerMintedAt) continue;
    const mintedAt = Date.parse(receipt.ledgerMintedAt);
    if (!Number.isFinite(mintedAt) || mintedAt < start) continue;
    minted += receipt.ledgerAwardedVcu ?? 0;
  }
  const remainingHardCap = Math.max(0, policy.hardCap - minted);
  const remainingSoftCap = Math.max(0, policy.softCap - minted);
  return {
    mintedSoFar: minted,
    remainingHardCap,
    remainingSoftCap,
  };
};

const computeAward = (planned: number, window: VcuMintWindow) => {
  const base = Math.max(0, Math.min(planned, window.remainingSoftCap));
  const extra = Math.max(0, planned - base);
  const diminishedExtra = extra * policy.diminishRate;
  const rawAward = base + diminishedExtra;
  const cappedAward = Math.min(rawAward, window.remainingHardCap);
  const award = Math.floor(Math.max(0, cappedAward));
  const capped = award < planned;
  return { award, capped };
};

const updateReceiptForAward = (
  receiptId: string,
  award: number,
  capped: boolean,
): ContributionReceiptRecord | null => {
  const nowIso = new Date().toISOString();
  return updateContributionReceipt(receiptId, (current) => ({
    ...current,
    status: "minted",
    updatedAt: nowIso,
    mintedAt: current.mintedAt ?? nowIso,
    capped: current.capped || capped,
    ledgerAwardedVcu: award,
    ledgerMintedAt: nowIso,
    receipt: {
      ...current.receipt,
      payout: {
        vcu: award,
        capped: current.receipt.payout.capped || capped,
      },
    },
  }));
};

const updateReceiptForReversal = (
  receiptId: string,
): ContributionReceiptRecord | null => {
  const nowIso = new Date().toISOString();
  return updateContributionReceipt(receiptId, (current) => ({
    ...current,
    updatedAt: nowIso,
    ledgerRevokedAt: nowIso,
    receipt: {
      ...current.receipt,
      payout: {
        ...current.receipt.payout,
        vcu: 0,
      },
    },
  }));
};

export const mintContributionReceiptToLedger = (
  receiptId: string,
): VcuMintResult => {
  const receipt = getContributionReceipt(receiptId);
  if (!receipt) {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned: 0,
      capped: false,
      reason: "not_found",
      policy,
    };
  }
  if (receipt.status === "revoked" || receipt.status === "rejected") {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned: receipt.plannedVcu,
      capped: false,
      reason: `not_mintable:${receipt.status}`,
      receipt,
      policy,
    };
  }
  if (receipt.status !== "minted") {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned: receipt.plannedVcu,
      capped: false,
      reason: "cooldown",
      receipt,
      policy,
    };
  }
  if (receipt.receipt.verification.verdict !== "pass") {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned: receipt.plannedVcu,
      capped: false,
      reason: "verification_fail",
      receipt,
      policy,
    };
  }
  const reviewSummary = getContributionReviewSummary(receipt);
  if (!reviewSummary.ok) {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned: receipt.plannedVcu,
      capped: false,
      reason: reviewSummary.openDisputes > 0 ? "dispute_open" : "review_required",
      receipt,
      policy,
      reviewSummary,
    };
  }
  if (receipt.ledgerMintedAt) {
    return {
      ok: true,
      minted: false,
      award: receipt.ledgerAwardedVcu ?? 0,
      planned: receipt.plannedVcu,
      capped: receipt.capped,
      reason: "already_minted",
      receipt,
      policy,
      reviewSummary,
    };
  }
  const planned = Math.max(0, Math.floor(receipt.plannedVcu));
  if (planned <= 0) {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned,
      capped: false,
      reason: "zero_vcu",
      receipt,
      policy,
      reviewSummary,
    };
  }
  const window = buildWindow(receipt.contributorId, Date.now());
  const { award, capped } = computeAward(planned, window);
  if (award <= 0) {
    return {
      ok: false,
      minted: false,
      award: 0,
      planned,
      capped: true,
      reason: "cap_exhausted",
      receipt,
      policy,
      window,
      reviewSummary,
    };
  }
  const concentration = checkContributionConcentrationPolicy({
    award: { contributorId: receipt.contributorId, amount: award },
  });
  if (!concentration.ok) {
    updateContributionConcentrationMetrics();
    return {
      ok: false,
      minted: false,
      award: 0,
      planned,
      capped: true,
      reason: "concentration_guard",
      receipt,
      policy,
      window,
      reviewSummary,
    };
  }
  const balance = awardEarnings(
    receipt.contributorId,
    award,
    `vcu:mint:${receipt.id}`,
    undefined,
    { source: "contribution", ref: receipt.id },
  );
  const updated = updateReceiptForAward(receipt.id, award, capped) ?? receipt;
  updateContributionConcentrationMetrics();
  return {
    ok: true,
    minted: true,
    award,
    planned,
    capped,
    receipt: updated,
    balance,
    policy,
    window,
    reviewSummary,
  };
};

export const revokeReceiptFromLedger = (
  receiptId: string,
  input?: { reason?: string; actorId?: string },
): VcuRevokeResult => {
  const receipt = getContributionReceipt(receiptId);
  if (!receipt) {
    return {
      ok: false,
      reversed: false,
      reversal: 0,
      reason: "not_found",
    };
  }
  const reversal = Math.max(0, Math.floor(receipt.ledgerAwardedVcu ?? 0));      
  let balance: TokenBalance | undefined;
  if (reversal > 0 && !receipt.ledgerRevokedAt) {
    balance = spendTokens(
      receipt.contributorId,
      reversal,
      `vcu:revoke:${receipt.id}`,
      { source: "contribution", ref: receipt.id },
    );
  }
  const revoked = revokeContributionReceipt(receiptId, {
    reason: input?.reason,
    actorId: input?.actorId,
    source: "ledger",
  });
  const updated = revoked
    ? updateReceiptForReversal(receiptId) ?? revoked
    : receipt;
  updateContributionConcentrationMetrics();
  return {
    ok: true,
    reversed: reversal > 0,
    reversal,
    receipt: updated,
    balance,
  };
};
