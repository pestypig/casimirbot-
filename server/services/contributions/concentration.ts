import { metrics } from "../../metrics";
import { getContributionReceiptEntries } from "./receipts";

export type ContributionConcentrationSummary = {
  totalVcu: number;
  contributorCount: number;
  topShare: number;
  hhi: number;
  windowMs: number;
};

export type ContributionConcentrationPolicy = {
  windowMs: number;
  minContributors: number;
  minTotalVcu: number;
  maxTopShare: number;
  maxHhi: number;
};

export type ContributionConcentrationCheck = {
  ok: boolean;
  reason?: "top_share_exceeded" | "hhi_exceeded";
  summary: ContributionConcentrationSummary;
  policy: ContributionConcentrationPolicy;
};

type ContributionConcentrationState = {
  perContributor: Map<string, number>;
  total: number;
  windowMs: number;
};

const parseWindowHours = (): number => {
  const requested = Number(process.env.VCU_MINT_WINDOW_HOURS ?? 24);
  if (!Number.isFinite(requested) || requested < 1) {
    return 24;
  }
  return Math.min(Math.max(1, requested), 168);
};

const parseNonNegativeInt = (
  value: string | undefined,
  fallback: number,
  max = 1000000,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(Math.max(0, Math.floor(parsed)), max);
};

const parseFraction = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(0, parsed), 1);
};

const POLICY: ContributionConcentrationPolicy = {
  windowMs: parseWindowHours() * 60 * 60 * 1000,
  minContributors: parseNonNegativeInt(
    process.env.VCU_CONCENTRATION_MIN_CONTRIBUTORS,
    5,
    10000,
  ),
  minTotalVcu: parseNonNegativeInt(
    process.env.VCU_CONCENTRATION_MIN_TOTAL_VCU,
    20,
    1000000,
  ),
  maxTopShare: parseFraction(
    process.env.VCU_CONCENTRATION_MAX_TOP_SHARE,
    0.5,
  ),
  maxHhi: parseFraction(process.env.VCU_CONCENTRATION_MAX_HHI, 0.25),
};

const REPORT_MIN_CONTRIBUTORS = parseNonNegativeInt(
  process.env.VCU_CONCENTRATION_REPORT_MIN_CONTRIBUTORS,
  POLICY.minContributors,
  10000,
);
const REPORT_MIN_TOTAL_VCU = parseNonNegativeInt(
  process.env.VCU_CONCENTRATION_REPORT_MIN_TOTAL_VCU,
  POLICY.minTotalVcu,
  1000000,
);

const buildState = (
  now: number,
  windowMs: number,
): ContributionConcentrationState => {
  const start = now - windowMs;
  const perContributor = new Map<string, number>();
  let total = 0;
  for (const receipt of getContributionReceiptEntries()) {
    if (!receipt.ledgerMintedAt) continue;
    if (receipt.ledgerRevokedAt) continue;
    const mintedAt = Date.parse(receipt.ledgerMintedAt);
    if (!Number.isFinite(mintedAt) || mintedAt < start) continue;
    const award = Math.max(0, Math.floor(receipt.ledgerAwardedVcu ?? 0));
    if (award <= 0) continue;
    total += award;
    perContributor.set(
      receipt.contributorId,
      (perContributor.get(receipt.contributorId) ?? 0) + award,
    );
  }
  return { perContributor, total, windowMs };
};

const applyAward = (
  state: ContributionConcentrationState,
  contributorId: string,
  award: number,
): void => {
  if (!contributorId || award <= 0) return;
  const current = state.perContributor.get(contributorId) ?? 0;
  state.perContributor.set(contributorId, current + award);
  state.total += award;
};

const summarizeState = (
  state: ContributionConcentrationState,
): ContributionConcentrationSummary => {
  const contributorCount = state.perContributor.size;
  let topShare = 0;
  let hhi = 0;
  if (state.total > 0) {
    let max = 0;
    for (const value of state.perContributor.values()) {
      if (value > max) max = value;
      const share = value / state.total;
      hhi += share * share;
    }
    topShare = max / state.total;
  }
  return {
    totalVcu: state.total,
    contributorCount,
    topShare,
    hhi,
    windowMs: state.windowMs,
  };
};

export const computeContributionConcentration = (
  now: number = Date.now(),
  windowMs: number = POLICY.windowMs,
): ContributionConcentrationSummary => {
  const state = buildState(now, windowMs);
  return summarizeState(state);
};

export const checkContributionConcentrationPolicy = (input?: {
  now?: number;
  award?: { contributorId: string; amount: number };
}): ContributionConcentrationCheck => {
  const now = input?.now ?? Date.now();
  const state = buildState(now, POLICY.windowMs);
  if (input?.award?.contributorId && input.award.amount > 0) {
    applyAward(state, input.award.contributorId, input.award.amount);
  }
  const summary = summarizeState(state);
  if (
    summary.contributorCount < POLICY.minContributors ||
    summary.totalVcu < POLICY.minTotalVcu
  ) {
    return { ok: true, summary, policy: POLICY };
  }
  if (summary.totalVcu <= 0) {
    return { ok: true, summary, policy: POLICY };
  }
  if (summary.topShare > POLICY.maxTopShare) {
    return { ok: false, reason: "top_share_exceeded", summary, policy: POLICY };
  }
  if (summary.hhi > POLICY.maxHhi) {
    return { ok: false, reason: "hhi_exceeded", summary, policy: POLICY };
  }
  return { ok: true, summary, policy: POLICY };
};

export const updateContributionConcentrationMetrics = (): ContributionConcentrationSummary => {
  const summary = computeContributionConcentration();
  const reportable =
    summary.contributorCount >= REPORT_MIN_CONTRIBUTORS &&
    summary.totalVcu >= REPORT_MIN_TOTAL_VCU;
  metrics.setContributionConcentration({
    totalVcu: reportable ? summary.totalVcu : 0,
    contributorCount: reportable ? summary.contributorCount : 0,
    topShare: reportable ? summary.topShare : 0,
    hhi: reportable ? summary.hhi : 0,
    masked: !reportable,
  });
  return summary;
};
