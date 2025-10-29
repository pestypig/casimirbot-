import type {
  EntropyLedgerEntry,
  GateAnalytics,
  GatePulse,
  GateRoute,
  GateRouteRole,
  GateRoutingSummary,
  VacuumGapSweepRow,
} from "@shared/schema";

const TWO_PI = 2 * Math.PI;
const DEFAULT_PHASE_TOLERANCE_DEG = 0.5;
const DEFAULT_BATH_T_K = 0.05; // 50 mK refrigeration lane
const HBAR = 1.054_571_817e-34;
const BOLTZMANN = 1.380_649e-23;

export interface GateEvaluationOptions {
  phaseTolerance_deg?: number;
  bathTemperature_K?: number;
}

function wrapPhaseDelta(a: number, b: number): number {
  let delta = a - b;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function buildRouteMap(routes: GateRoute[] | undefined): Map<string, GateRouteRole> {
  const map = new Map<string, GateRouteRole>();
  if (!routes) return map;
  for (const entry of routes) {
    if (!entry || typeof entry.port !== "string") continue;
    const role = entry.role ?? "BUS";
    if (role === "BUS" || role === "SINK") {
      map.set(entry.port, role);
    }
  }
  return map;
}

function pickPulseForRow(
  row: VacuumGapSweepRow,
  pulses: GatePulse[],
  phaseTolerance: number,
): GatePulse | undefined {
  let best: { pulse: GatePulse; delta: number } | undefined;
  for (const pulse of pulses) {
    if (!pulse) continue;
    const delta = Math.abs(wrapPhaseDelta(row.phi_deg, pulse.phi_deg));
    if (delta > phaseTolerance) continue;
    if (!best || delta < best.delta) {
      best = { pulse, delta };
    }
  }
  return best?.pulse;
}

function landauerEnergyPerBit(temperature_K: number): number {
  const T = Math.max(temperature_K, 1e-6);
  return BOLTZMANN * T * Math.log(2);
}

function pumpOmegaRad(row: VacuumGapSweepRow): number {
  if (Number.isFinite(row.Omega_rad_s)) {
    return Math.max(Number(row.Omega_rad_s), 0);
  }
  if (Number.isFinite(row.Omega_GHz)) {
    return Math.max(0, Number(row.Omega_GHz) * 1e9 * TWO_PI);
  }
  return 0;
}

function sampleEnergyJ(row: VacuumGapSweepRow, duty: number): number {
  const base =
    Number.isFinite(row.deltaU_cycle_J) && row.deltaU_cycle_J != null
      ? Number(row.deltaU_cycle_J)
      : Number.isFinite(row.deltaU_mode_J) && row.deltaU_mode_J != null
      ? Number(row.deltaU_mode_J)
      : 0;
  return Math.max(0, base) * Math.max(0, Math.min(1, duty));
}

function dutyFromPulse(pulse: GatePulse, row: VacuumGapSweepRow): number {
  if (!Number.isFinite(pulse.dur_ns) || pulse.dur_ns <= 0) return 0;
  const f_GHz = Number(row.Omega_GHz);
  if (Number.isFinite(f_GHz) && f_GHz > 0) {
    const period_ns = 1 / f_GHz;
    return Math.min(1, pulse.dur_ns / Math.max(period_ns, 1e-9));
  }
  return Math.min(1, pulse.dur_ns / 1e3); // fallback to microsecond-scale cap
}

function summarizeRowGate(
  row: VacuumGapSweepRow,
  pulse: GatePulse,
  route: GateRouteRole,
  opts: GateEvaluationOptions,
): GateRoutingSummary {
  const duty = dutyFromPulse(pulse, row);
  const energyJ = sampleEnergyJ(row, duty);
  const omega = pumpOmegaRad(row);
  const photons = omega > 0 ? energyJ / (HBAR * omega) : 0;
  const landauer = landauerEnergyPerBit(opts.bathTemperature_K ?? DEFAULT_BATH_T_K);
  const bits = landauer > 0 ? energyJ / landauer : 0;
  const sink = route === "SINK" || pulse.sink === true;
  const reversible = !sink;
  const gateId = pulse.id ?? `${pulse.out}:${Math.round(pulse.t0_ns)}`;
  const ledgerEntry: EntropyLedgerEntry = {
    t_ns: pulse.t0_ns,
    gateId,
    photons,
    joules: energyJ,
    reversible,
    bits,
  };
  const summary: GateRoutingSummary = {
    gateId,
    kind: pulse.kind,
    route,
    sink,
    reversible,
    photons,
    joules: energyJ,
    bits,
    phi_deg: pulse.phi_deg,
    rho: pulse.rho,
    out: pulse.out,
    ledger: [ledgerEntry],
    duty,
  };
  if (!Number.isFinite(summary.rho) || summary.rho == null) {
    summary.rho = Number.isFinite(row.pumpRatio) ? Number(row.pumpRatio) : 0;
  }
  if (!Number.isFinite(summary.phi_deg) || summary.phi_deg == null) {
    summary.phi_deg = row.phi_deg;
  }
  if (pulse.tags?.length) {
    summary.tags = Array.from(new Set(pulse.tags));
  }
  return summary;
}

export interface GateAssignmentResult {
  summaries: GateRoutingSummary[];
  analytics: GateAnalytics | null;
}

export function assignGateSummaries(
  rows: VacuumGapSweepRow[],
  pulses: GatePulse[] | undefined,
  routes: GateRoute[] | undefined,
  options: GateEvaluationOptions = {},
): GateAssignmentResult {
  if (!Array.isArray(rows) || !rows.length) {
    return { summaries: [], analytics: null };
  }
  if (!Array.isArray(pulses) || !pulses.length) {
    for (const row of rows) {
      if (row && "gate" in row) {
        delete row.gate;
      }
    }
    return { summaries: [], analytics: null };
  }
  const phaseTolerance = options.phaseTolerance_deg ?? DEFAULT_PHASE_TOLERANCE_DEG;
  const routeMap = buildRouteMap(routes);
  const summaries: GateRoutingSummary[] = [];
  const ledger: EntropyLedgerEntry[] = [];
  let busJ = 0;
  let sinkJ = 0;
  let bits = 0;

  for (const row of rows) {
    if (!row) continue;
    const pulse = pickPulseForRow(row, pulses, phaseTolerance);
    if (!pulse) {
      if (row && "gate" in row) {
        delete row.gate;
      }
      continue;
    }
    const role = routeMap.get(pulse.out) ?? (pulse.sink ? "SINK" : "BUS");
    const summary = summarizeRowGate(row, pulse, role, options);
    row.gate = summary;
    summaries.push(summary);
    if (summary.ledger) {
      ledger.push(...summary.ledger);
    }
    if (summary.joules > 0) {
      if (summary.reversible) busJ += summary.joules;
      else sinkJ += summary.joules;
    }
    if (summary.bits > 0) {
      bits += summary.bits;
    }
  }

  const totalJ = busJ + sinkJ;
  const analytics: GateAnalytics = {
    reversibleFraction: totalJ > 0 ? busJ / totalJ : 0,
    busJoules: busJ,
    sinkJoules: sinkJ,
    totalBits: bits,
    pulses,
    ledger,
  };

  return { summaries, analytics };
}
