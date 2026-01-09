export type ContributionRateLimitAction =
  | "ingest"
  | "verify"
  | "receipt"
  | "mint"
  | "review"
  | "dispute"
  | "disputeResolve";

export type ContributionRateLimitResult =
  | {
      ok: true;
      limit: number;
      remaining: number;
      resetMs: number;
      windowMs: number;
    }
  | {
      ok: false;
      limit: number;
      remaining: number;
      resetMs: number;
      windowMs: number;
    };

const parseLimit = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
};

const WINDOW_MS =
  parseLimit(process.env.CONTRIBUTION_RATE_WINDOW_SECONDS, 60) * 1000;

const LIMITS: Record<ContributionRateLimitAction, number> = {
  ingest: parseLimit(process.env.CONTRIBUTION_RATE_INGEST_LIMIT, 12),
  verify: parseLimit(process.env.CONTRIBUTION_RATE_VERIFY_LIMIT, 10),
  receipt: parseLimit(process.env.CONTRIBUTION_RATE_RECEIPT_LIMIT, 10),
  mint: parseLimit(process.env.CONTRIBUTION_RATE_MINT_LIMIT, 5),
  review: parseLimit(process.env.CONTRIBUTION_RATE_REVIEW_LIMIT, 20),
  dispute: parseLimit(process.env.CONTRIBUTION_RATE_DISPUTE_LIMIT, 6),
  disputeResolve: parseLimit(
    process.env.CONTRIBUTION_RATE_DISPUTE_RESOLVE_LIMIT,
    12,
  ),
};

const rateBuckets = new Map<string, number[]>();

const resolveKey = (
  action: ContributionRateLimitAction,
  actorId: string,
): string => `${action}:${actorId}`;

const prune = (entries: number[], now: number): number[] => {
  const cutoff = now - WINDOW_MS;
  let idx = 0;
  while (idx < entries.length && entries[idx] < cutoff) {
    idx += 1;
  }
  return idx > 0 ? entries.slice(idx) : entries;
};

const computeResetMs = (entries: number[], now: number): number => {
  if (entries.length === 0) return WINDOW_MS;
  const oldest = entries[0];
  const resetAt = oldest + WINDOW_MS;
  return Math.max(0, resetAt - now);
};

export const checkContributionRateLimit = (
  action: ContributionRateLimitAction,
  actorId: string,
): ContributionRateLimitResult => {
  const limit = LIMITS[action];
  if (limit <= 0) {
    return {
      ok: true,
      limit,
      remaining: Number.POSITIVE_INFINITY,
      resetMs: WINDOW_MS,
      windowMs: WINDOW_MS,
    };
  }
  const key = resolveKey(action, actorId);
  const now = Date.now();
  const entries = prune(rateBuckets.get(key) ?? [], now);
  const nextCount = entries.length + 1;
  const remaining = Math.max(0, limit - nextCount);
  const resetMs = computeResetMs(entries, now);
  if (entries.length >= limit) {
    rateBuckets.set(key, entries);
    return {
      ok: false,
      limit,
      remaining: 0,
      resetMs,
      windowMs: WINDOW_MS,
    };
  }
  entries.push(now);
  rateBuckets.set(key, entries);
  return {
    ok: true,
    limit,
    remaining,
    resetMs,
    windowMs: WINDOW_MS,
  };
};

export const __resetContributionRateLimits = (): void => {
  rateBuckets.clear();
};
