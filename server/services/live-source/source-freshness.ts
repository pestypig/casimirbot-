import type { LiveSourceFreshnessStatus } from "@shared/live-source-observation";

export function evaluateLiveSourceFreshness(input: {
  observedAt: string;
  now?: Date;
  staleAfterMs?: number | null;
  explicitStatus?: LiveSourceFreshnessStatus | null;
  message?: string | null;
}): {
  status: LiveSourceFreshnessStatus;
  age_ms?: number;
  stale_after_ms?: number;
  message?: string;
} {
  if (input.explicitStatus && input.explicitStatus !== "unknown") {
    return {
      status: input.explicitStatus,
      stale_after_ms: input.staleAfterMs ?? undefined,
      message: input.message ?? undefined,
    };
  }

  const now = input.now ?? new Date();
  const observed = new Date(input.observedAt);
  const ageMs = Number.isFinite(observed.valueOf())
    ? Math.max(0, now.valueOf() - observed.valueOf())
    : undefined;
  const staleAfterMs = input.staleAfterMs ?? undefined;
  const status: LiveSourceFreshnessStatus =
    ageMs !== undefined && staleAfterMs !== undefined && ageMs > staleAfterMs
      ? "stale"
      : "fresh";

  return {
    status,
    age_ms: ageMs,
    stale_after_ms: staleAfterMs,
    message: input.message ?? undefined,
  };
}
