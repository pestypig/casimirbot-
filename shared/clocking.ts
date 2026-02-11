export const SPEED_OF_LIGHT_M_S = 299_792_458;

export type ClockingSnapshot = {
  tauLC_ms: number | null;
  tauPulse_ms: number | null;
  epsilon: number | null;
  TS: number | null;
  regime: "ok" | "warn" | "fail" | "unknown";
  detail: string;
  dwell_ms: number | null;
  burst_ms: number | null;
  metricDerived?: boolean;
  metricDerivedSource?: string;
  metricDerivedReason?: string;
  metricDerivedChart?: string;
};

export type ClockingInput = {
  tauLC_ms?: number | null;
  tauLC_us?: number | null;
  path_m?: number | null;
  hull?: { Lx_m?: number; Ly_m?: number; Lz_m?: number; wallThickness_m?: number | null };
  burst_ms?: number | null;
  burst_us?: number | null;
  dwell_ms?: number | null;
  sectorPeriod_ms?: number | null;
  localDuty?: number | null;
};

export type ClockingThresholds = {
  okTS: number;
  warnTS: number;
  okEpsilon: number;
  warnEpsilon: number;
};

export const DEFAULT_CLOCKING_THRESHOLDS: ClockingThresholds = {
  okTS: 50,
  warnTS: 10,
  okEpsilon: 0.05,
  warnEpsilon: 0.2,
};

const firstFinitePositive = (...choices: Array<number | null | undefined>): number | null => {
  for (const candidate of choices) {
    const n = Number(candidate);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const formatMsForDetail = (value: number | null | undefined): string => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "missing";
  return `${n.toFixed(3)} ms`;
};

export function computeClocking(
  input: ClockingInput,
  thresholds: ClockingThresholds = DEFAULT_CLOCKING_THRESHOLDS,
): ClockingSnapshot {
  const dwell_ms = firstFinitePositive(input.dwell_ms, input.sectorPeriod_ms);

  const hullTau_ms = (() => {
    const hull = input.hull;
    if (!hull) return null;
    const dims = [hull.Lx_m, hull.Ly_m, hull.Lz_m].map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
    const longest = dims.length ? Math.max(...dims) : null;
    if (longest && longest > 0) return (longest / SPEED_OF_LIGHT_M_S) * 1000;
    const wall = Number(hull.wallThickness_m);
    return Number.isFinite(wall) && wall > 0 ? (wall / SPEED_OF_LIGHT_M_S) * 1000 : null;
  })();

  const tauLC_ms = firstFinitePositive(
    input.tauLC_ms,
    input.tauLC_us != null ? input.tauLC_us / 1000 : null,
    input.path_m != null && input.path_m > 0 ? (input.path_m / SPEED_OF_LIGHT_M_S) * 1000 : null,
    hullTau_ms,
  );

  const duty = (() => {
    const n = Number(input.localDuty);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return 0;
    if (n >= 1) return 1;
    return n;
  })();

  const burst_ms = firstFinitePositive(
    input.burst_ms,
    input.burst_us != null ? input.burst_us / 1000 : null,
    dwell_ms != null && duty != null ? dwell_ms * duty : null,
  );

  const tauPulse_ms = burst_ms;

  const epsilon =
    tauPulse_ms != null && tauLC_ms != null && tauLC_ms > 0 ? tauPulse_ms / tauLC_ms : null;
  const TS =
    tauPulse_ms != null && tauLC_ms != null && tauPulse_ms > 0 ? tauLC_ms / tauPulse_ms : null;

  let regime: ClockingSnapshot["regime"] = "unknown";
  const detailBase = `tau_pulse=${formatMsForDetail(tauPulse_ms)}, tau_LC=${formatMsForDetail(tauLC_ms)}`;
  let detail =
    tauPulse_ms == null || tauLC_ms == null ? `${detailBase}; awaiting tau_pulse/tau_LC` : detailBase;

  if (tauPulse_ms != null && tauLC_ms != null) {
    if (!(tauPulse_ms > 0) || !(tauLC_ms > 0)) {
      regime = "fail";
      detail = `${detailBase}; non-positive tau_pulse or tau_LC`;
    } else if (TS != null && epsilon != null) {
      if (TS >= thresholds.okTS && epsilon <= thresholds.okEpsilon) {
        regime = "ok";
        detail = `${detailBase}; epsilon << 1 (cycle-average valid)`;
      } else if (TS >= thresholds.warnTS && epsilon <= thresholds.warnEpsilon) {
        regime = "warn";
        detail = `${detailBase}; borderline averaging; widen spacing`;
      } else {
        regime = "fail";
        detail = `${detailBase}; epsilon too large for averaging proxy`;
      }
    }
  }

  return {
    tauLC_ms: tauLC_ms ?? null,
    tauPulse_ms: tauPulse_ms ?? null,
    epsilon: epsilon ?? null,
    TS: TS ?? null,
    regime,
    detail,
    dwell_ms: dwell_ms ?? null,
    burst_ms: burst_ms ?? null,
  };
}
