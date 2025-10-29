import type { SamplingKind } from "../../shared/schema.js";

export interface FordRomanBoundArgs {
  tau_s_ms: number;
  sampler: SamplingKind;
  fieldKind?: "em" | "scalar";
  scalarFallback?: number;
}

/**
 * Placeholder Ford–Roman quantum inequality bound helper.
 * Centralizes the computation so the monitor and target validation use the same hook.
 */
export function fordRomanBound({
  tau_s_ms,
  sampler,
  fieldKind,
  scalarFallback = -1,
}: FordRomanBoundArgs): number {
  void tau_s_ms;
  void sampler;
  void fieldKind;
  return scalarFallback;
}

/**
 * Helper to read a scalar bound from environment variables.
 * Prefer QI_BOUND_SCALAR but accept legacy QI_BOUND; defaults to -1.
 */
export function configuredQiScalarBound(): number {
  const raw = process.env.QI_BOUND_SCALAR ?? process.env.QI_BOUND;
  const n = Number(raw);
  return Number.isFinite(n) ? n : -1;
}
