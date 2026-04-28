import { C } from "../utils/physics-const-safe.ts";
import type { PhaseSchedule } from "./phase-scheduler.ts";
import {
  NHM2_PHASE_TOPOLOGY_ARTIFACT_ID,
  NHM2_PHASE_TOPOLOGY_SCHEMA_VERSION,
  type Nhm2PhaseDefect,
  type Nhm2PhaseTopologyArtifact,
} from "../../shared/contracts/nhm2-phase-topology.v1.ts";

type HullDims = {
  Lx_m?: number;
  Ly_m?: number;
  Lz_m?: number;
};

type PreviousTopologyState = {
  nowMs: number;
  defects: Nhm2PhaseDefect[];
  phase01: number;
};

type AnalyzeArgs = {
  schedule: PhaseSchedule & {
    N: number;
    phase01: number;
    sectorPeriod_ms: number;
    tau_s_ms: number;
    sampler: string;
  };
  hull?: HullDims | null;
  nowMs: number;
  previous?: PreviousTopologyState | null;
  gridTheta?: number;
  gridPhi?: number;
};

const TWO_PI = 2 * Math.PI;

const wrapRad = (x: number): number => Math.atan2(Math.sin(x), Math.cos(x));

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

const circularDistance01 = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
};

const cis = (phaseRad: number): [number, number] => [
  Math.cos(phaseRad),
  Math.sin(phaseRad),
];

const ellipseCircumferenceRamanujan = (a: number, b: number): number => {
  if (!(a > 0) || !(b > 0)) return 0;
  const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
};

const estimateHullEquatorCircumferenceM = (hull?: HullDims | null): number => {
  const a = Number(hull?.Lx_m) / 2;
  const b = Number(hull?.Ly_m) / 2;
  if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
    return ellipseCircumferenceRamanujan(a, b);
  }
  return 0;
};

const buildComplexGrid = (
  schedule: AnalyzeArgs["schedule"],
  gridTheta: number,
  gridPhi: number,
): Array<Array<{ re: number; im: number; amp: number; phase: number }>> => {
  const N = Math.max(1, Math.floor(schedule.N));
  const sigmaPhi = Math.max(1 / N, 2.5 / N);
  const sigmaTheta = 0.22;

  const phiDeg = schedule.phi_deg_by_sector ?? [];
  const weights = schedule.weights ?? new Array(N).fill(1);
  const grid: Array<Array<{ re: number; im: number; amp: number; phase: number }>> = [];

  for (let j = 0; j < gridTheta; j++) {
    const theta01 = gridTheta === 1 ? 0.5 : j / (gridTheta - 1);
    const thetaCentered = theta01 - 0.5;
    const thetaKernel = Math.exp(-(thetaCentered * thetaCentered) / (2 * sigmaTheta * sigmaTheta));
    const row: Array<{ re: number; im: number; amp: number; phase: number }> = [];

    for (let i = 0; i < gridPhi; i++) {
      const phi01 = i / gridPhi;
      let re = 0;
      let im = 0;

      for (let k = 0; k < N; k++) {
        const sector01 = k / N;
        const dPhi = circularDistance01(phi01, sector01);
        const kernel = Math.exp(-(dPhi * dPhi) / (2 * sigmaPhi * sigmaPhi));
        const amp = Math.max(0, Number(weights[k]) || 0) * kernel * thetaKernel;
        const phaseRad = ((Number(phiDeg[k]) || 0) * Math.PI) / 180;
        const [cr, ci] = cis(phaseRad);
        re += amp * cr;
        im += amp * ci;
      }

      const amp = Math.hypot(re, im);
      row.push({ re, im, amp, phase: Math.atan2(im, re) });
    }

    grid.push(row);
  }

  return grid;
};

const detectDefects = (
  grid: ReturnType<typeof buildComplexGrid>,
  amplitudeEpsilon: number,
  windingTolerance = 0.55,
): Nhm2PhaseDefect[] => {
  const gridTheta = grid.length;
  const gridPhi = grid[0]?.length ?? 0;
  const defects: Nhm2PhaseDefect[] = [];

  if (gridTheta < 2 || gridPhi < 3) return defects;

  for (let j = 0; j < gridTheta - 1; j++) {
    for (let i = 0; i < gridPhi; i++) {
      const i1 = (i + 1) % gridPhi;
      const p00 = grid[j][i];
      const p10 = grid[j][i1];
      const p11 = grid[j + 1][i1];
      const p01 = grid[j + 1][i];
      const winding =
        wrapRad(p10.phase - p00.phase) +
        wrapRad(p11.phase - p10.phase) +
        wrapRad(p01.phase - p11.phase) +
        wrapRad(p00.phase - p01.phase);
      const qFloat = winding / TWO_PI;
      const q = Math.round(qFloat);
      const minAmp = Math.min(p00.amp, p10.amp, p11.amp, p01.amp);

      if ((q === 1 || q === -1) && Math.abs(qFloat - q) < windingTolerance && minAmp <= amplitudeEpsilon) {
        defects.push({
          id: `q${q}_t${j}_p${i}`,
          charge: q as 1 | -1,
          theta01: clamp01((j + 0.5) / (gridTheta - 1)),
          phi01: clamp01((i + 0.5) / gridPhi),
          amplitude: minAmp,
          confidence: clamp01(1 - Math.abs(qFloat - q) / windingTolerance),
        });
      }
    }
  }

  return defects;
};

const maxSectorPhaseJumpRad = (phiDeg: number[]): number => {
  if (!phiDeg.length) return 0;
  let maxJump = 0;

  for (let i = 0; i < phiDeg.length; i++) {
    const a = ((Number(phiDeg[i]) || 0) * Math.PI) / 180;
    const b = ((Number(phiDeg[(i + 1) % phiDeg.length]) || 0) * Math.PI) / 180;
    maxJump = Math.max(maxJump, Math.abs(wrapRad(b - a)));
  }

  return maxJump;
};

const countCloseOppositePairs = (
  defects: Nhm2PhaseDefect[],
  closeDistance01 = 0.035,
): number => {
  let count = 0;

  for (let a = 0; a < defects.length; a++) {
    for (let b = a + 1; b < defects.length; b++) {
      if (defects[a].charge === defects[b].charge) continue;
      const dTheta = defects[a].theta01 - defects[b].theta01;
      const dPhi = circularDistance01(defects[a].phi01, defects[b].phi01);
      if (Math.hypot(dTheta, dPhi) <= closeDistance01) count++;
    }
  }

  return count;
};

const estimatePatternSpeed = (
  schedule: AnalyzeArgs["schedule"],
  hull?: HullDims | null,
  previous?: PreviousTopologyState | null,
  nowMs?: number,
): number | null => {
  const circumferenceM = estimateHullEquatorCircumferenceM(hull);
  if (!(circumferenceM > 0)) return null;

  if (previous && nowMs && nowMs > previous.nowMs) {
    const dtS = (nowMs - previous.nowMs) / 1000;
    const dPhase = circularDistance01(schedule.phase01, previous.phase01);
    if (dtS > 0) return (circumferenceM * dPhase) / dtS;
  }

  const periodS = Number(schedule.sectorPeriod_ms) / 1000;
  if (periodS > 0) return circumferenceM / periodS;

  return null;
};

export function analyzeNhm2PhaseTopology(args: AnalyzeArgs): {
  artifact: Nhm2PhaseTopologyArtifact;
  nextState: PreviousTopologyState;
} {
  const gridTheta = args.gridTheta ?? 16;
  const gridPhi = args.gridPhi ?? Math.max(64, Math.min(256, args.schedule.N));
  const amplitudeEpsilon = 1e-4;
  const windingTolerance = 0.55;
  const grid = buildComplexGrid(args.schedule, gridTheta, gridPhi);
  const defects = detectDefects(grid, amplitudeEpsilon, windingTolerance);
  const positiveCount = defects.filter((d) => d.charge === 1).length;
  const negativeCount = defects.filter((d) => d.charge === -1).length;
  const density = defects.length / Math.max(1, gridTheta * gridPhi);
  const closeOppositePairs = countCloseOppositePairs(defects);
  const maxSeamJump = maxSectorPhaseJumpRad(args.schedule.phi_deg_by_sector);
  const patternMax = estimatePatternSpeed(args.schedule, args.hull, args.previous, args.nowMs);
  const patternOverC = patternMax == null ? null : patternMax / C;
  const superluminalPatternObserved = patternOverC != null && patternOverC > 1;
  const previousCount = args.previous?.defects.length ?? null;
  const creationCount = previousCount == null ? null : Math.max(0, defects.length - previousCount);
  const annihilationCount = previousCount == null ? null : Math.max(0, previousCount - defects.length);

  const thresholds = {
    defectDensityReview: 0.005,
    defectDensityFail: 0.02,
    closeOppositePairsReview: 3,
    maxSeamJumpReview_rad: Math.PI * 0.9,
  };

  const reasonCodes: string[] = [];
  if (density >= thresholds.defectDensityFail) reasonCodes.push("phase_defect_density_fail");
  else if (density >= thresholds.defectDensityReview) reasonCodes.push("phase_defect_density_review");
  if (closeOppositePairs >= thresholds.closeOppositePairsReview) {
    reasonCodes.push("close_opposite_charge_pairs_review");
  }
  if (maxSeamJump >= thresholds.maxSeamJumpReview_rad) {
    reasonCodes.push("hard_phase_seam_review");
  }
  if (superluminalPatternObserved) {
    reasonCodes.push("superluminal_pattern_velocity_not_transport");
  }

  const hardFail = reasonCodes.includes("phase_defect_density_fail");
  const artifact: Nhm2PhaseTopologyArtifact = {
    artifactId: NHM2_PHASE_TOPOLOGY_ARTIFACT_ID,
    schemaVersion: NHM2_PHASE_TOPOLOGY_SCHEMA_VERSION,
    status: hardFail ? "fail" : reasonCodes.length > 0 ? "review" : "pass",
    reasonCodes,
    method: "sector_complex_field_winding/v1",
    sourcePath: "state.phaseSchedule",
    claimScope: "strobe_pattern_diagnostic_not_metric_source",
    schedule: {
      N: args.schedule.N,
      phase01: args.schedule.phase01,
      sectorPeriod_ms: args.schedule.sectorPeriod_ms,
      tau_s_ms: args.schedule.tau_s_ms,
      sampler: args.schedule.sampler,
      negativeCount: args.schedule.negSectors.length,
      positiveCount: args.schedule.posSectors.length,
    },
    field: {
      gridTheta,
      gridPhi,
      amplitudeEpsilon,
      windingTolerance,
    },
    defects: {
      count: defects.length,
      positiveCount,
      negativeCount,
      density,
      netCharge: positiveCount - negativeCount,
      closeOppositePairs,
      creationCount,
      annihilationCount,
      maxSeamJump_rad: maxSeamJump,
    },
    velocities: {
      patternMax_mps: patternMax,
      patternMaxOverC: patternOverC,
      superluminalPatternObserved,
      transportInterpretation: "pattern_only_no_energy_or_signal_claim",
    },
    phaseSpace: {
      speedBins_mps: [],
      speedCounts: [],
      distanceBins_m: [],
      sameChargePairCounts: [],
      oppositeChargePairCounts: [],
    },
    thresholds,
    notes: [
      "Phase topology is a scheduler/strobe diagnostic.",
      "It does not modify Casimir energy, QI duty, metric T00, or GR source terms.",
      "Superluminal pattern speed is reported as pattern-only and is not treated as energy or signal transport.",
    ],
  };

  return {
    artifact,
    nextState: {
      nowMs: args.nowMs,
      defects,
      phase01: args.schedule.phase01,
    },
  };
}
