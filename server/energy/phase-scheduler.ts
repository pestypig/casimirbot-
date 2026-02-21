import type { SamplingKind, GatePulse } from "../../shared/schema.js";

export type PhaseSchedule = {
  phi_deg_by_sector: number[];
  negSectors: number[];
  posSectors: number[];
  weights: number[];
};

export function computeSectorPhaseOffsets(args: {
  N: number;
  sectorPeriod_ms: number;
  phase01: number;
  tau_s_ms: number;
  sampler: SamplingKind;
  negativeFraction?: number;
  deltaPos_deg?: number;
  neutral_deg?: number;
}): PhaseSchedule {
  const {
    N,
    sectorPeriod_ms,
    phase01,
    tau_s_ms,
    sampler,
    negativeFraction = 0.4,
    deltaPos_deg = 90,
    neutral_deg = 45,
  } = args;

  const safeN = Math.max(1, Math.floor(N));
  const dt = safeN > 0 ? sectorPeriod_ms / safeN : 0;
  const weights: { k: number; w: number }[] = [];
  const weightBySector: number[] = new Array(safeN).fill(0);
  const tau = Math.max(1, tau_s_ms);
  const phaseWrapped = ((phase01 % 1) + 1) % 1;

  for (let k = 0; k < safeN; k++) {
    const t_k = ((k / safeN) - phaseWrapped) * sectorPeriod_ms;
    let w: number;
    if (sampler === "gaussian") {
      w = Math.exp(-((t_k * t_k) / (2 * tau * tau)));
    } else if (sampler === "compact") {
      const dist = Math.abs(t_k);
      if (dist > tau) {
        w = 0;
      } else {
        const x = dist / Math.max(tau, 1e-3);
        w = 0.5 * (1 + Math.cos(Math.PI * x)); // compact Hann window
      }
    } else {
      w = 1 / (1 + (t_k * t_k) / (tau * tau));
    }
    weights.push({ k, w });
    weightBySector[k] = w;
  }

  weights.sort((a, b) => b.w - a.w);
  const negCount = Math.max(1, Math.floor(safeN * Math.min(1, Math.max(0, negativeFraction))));
  const neg = new Set(weights.slice(0, negCount).map((entry) => entry.k));
  const pos = new Set(weights.slice(-negCount).map((entry) => entry.k));

  const phi: number[] = new Array(safeN).fill(neutral_deg);
  for (let k = 0; k < safeN; k++) {
    if (pos.has(k)) {
      phi[k] = deltaPos_deg;
    } else if (neg.has(k)) {
      phi[k] = 0;
    }
  }

  return {
    phi_deg_by_sector: phi,
    negSectors: [...neg].sort((a, b) => a - b),
    posSectors: [...pos].sort((a, b) => a - b),
    weights: weightBySector,
  };
}

export function applyPhaseScheduleToPulses(
  pulses: GatePulse[],
  phi_deg_by_sector: number[],
  roles?: { neg: Set<number>; pos: Set<number> },
): GatePulse[] {
  if (!Array.isArray(pulses) || !pulses.length) return pulses ?? [];
  return pulses.map((pulse) => {
    const sector = pulse?.sectorIndex;
    if (sector == null) return pulse;
    const extra = phi_deg_by_sector[sector] ?? 0;
    const role =
      roles != null
        ? roles.neg.has(sector)
          ? "neg"
          : roles.pos.has(sector)
          ? "pos"
          : "neutral"
        : undefined;
    return {
      ...pulse,
      phi_deg: (pulse.phi_deg ?? 0) + extra,
      role,
    };
  });
}


export function buildSectorRoleAssignment(schedule: Pick<PhaseSchedule, "negSectors" | "posSectors">) {
  const neg = new Set<number>([...schedule.negSectors].sort((a, b) => a - b));
  const pos = new Set<number>([...schedule.posSectors].sort((a, b) => a - b));
  return { neg, pos };
}
