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

type DefectMatch = {
  previous: Nhm2PhaseDefect;
  current: Nhm2PhaseDefect;
  distance01: number;
  speed_mps: number | null;
};

const TWO_PI = 2 * Math.PI;

const PHASE_SINGULARITY_REFS = [
  "https://arxiv.org/abs/2509.17675",
  "https://www.nature.com/articles/s41586-026-10209-z",
];
const QI_GUARDRAIL_REFS = [
  "https://arxiv.org/abs/gr-qc/9711030",
];
const CASIMIR_CONTEXT_REFS = [
  "https://arxiv.org/abs/1006.4790",
  "https://arxiv.org/abs/2112.06824",
  "https://doi.org/10.1103/y261-8r5s",
];

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

const estimateHullMeridianSpanM = (hull?: HullDims | null): number => {
  const z = Number(hull?.Lz_m);
  if (Number.isFinite(z) && z > 0) return z;
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

const defectDistance01 = (a: Nhm2PhaseDefect, b: Nhm2PhaseDefect): number => {
  const dTheta = a.theta01 - b.theta01;
  const dPhi = circularDistance01(a.phi01, b.phi01);
  return Math.hypot(dTheta, dPhi);
};

const estimateDefectDistanceM = (
  a: Nhm2PhaseDefect,
  b: Nhm2PhaseDefect,
  hull?: HullDims | null,
): number | null => {
  const circumferenceM = estimateHullEquatorCircumferenceM(hull);
  const meridianSpanM = estimateHullMeridianSpanM(hull);
  if (!(circumferenceM > 0) && !(meridianSpanM > 0)) return null;
  const dPhiM = circumferenceM * circularDistance01(a.phi01, b.phi01);
  const dThetaM = meridianSpanM * Math.abs(a.theta01 - b.theta01);
  return Math.hypot(dThetaM, dPhiM);
};

const matchDefects = (
  previous: Nhm2PhaseDefect[] | null | undefined,
  current: Nhm2PhaseDefect[],
  hull: HullDims | null | undefined,
  previousNowMs: number | null | undefined,
  nowMs: number,
  maxDistance01 = 0.08,
): DefectMatch[] => {
  if (!previous?.length || !current.length || previousNowMs == null || !(nowMs > previousNowMs)) {
    return [];
  }

  const candidates: Array<{ previousIndex: number; currentIndex: number; distance01: number }> = [];
  for (let p = 0; p < previous.length; p++) {
    for (let c = 0; c < current.length; c++) {
      if (previous[p].charge !== current[c].charge) continue;
      const distance01 = defectDistance01(previous[p], current[c]);
      if (distance01 <= maxDistance01) {
        candidates.push({ previousIndex: p, currentIndex: c, distance01 });
      }
    }
  }

  candidates.sort((a, b) => a.distance01 - b.distance01);
  const usedPrevious = new Set<number>();
  const usedCurrent = new Set<number>();
  const dtS = (nowMs - previousNowMs) / 1000;
  const matches: DefectMatch[] = [];

  for (const candidate of candidates) {
    if (usedPrevious.has(candidate.previousIndex) || usedCurrent.has(candidate.currentIndex)) continue;
    usedPrevious.add(candidate.previousIndex);
    usedCurrent.add(candidate.currentIndex);
    const previousDefect = previous[candidate.previousIndex];
    const currentDefect = current[candidate.currentIndex];
    const distanceM = estimateDefectDistanceM(previousDefect, currentDefect, hull);
    matches.push({
      previous: previousDefect,
      current: currentDefect,
      distance01: candidate.distance01,
      speed_mps: distanceM == null || !(dtS > 0) ? null : distanceM / dtS,
    });
  }

  return matches;
};

const countDefectsNearSeams = (
  defects: Nhm2PhaseDefect[],
  sectorCount: number,
  seamBand01: number,
): number => {
  const safeN = Math.max(1, Math.floor(sectorCount));
  return defects.filter((defect) => {
    const scaled = defect.phi01 * safeN;
    const distanceToNearestInteger = Math.min(scaled - Math.floor(scaled), Math.ceil(scaled) - scaled);
    return distanceToNearestInteger / safeN <= seamBand01;
  }).length;
};

const histogramUpperBounds = (values: number[], upperBounds: number[]): number[] =>
  upperBounds.map((upper, index) => {
    const lower = index === 0 ? Number.NEGATIVE_INFINITY : upperBounds[index - 1];
    return values.filter((value) => value > lower && value <= upper).length;
  });

const computePairDistanceHistograms = (
  defects: Nhm2PhaseDefect[],
  hull?: HullDims | null,
): {
  distanceBins_m: number[];
  sameChargePairCounts: number[];
  oppositeChargePairCounts: number[];
} => {
  const circumferenceM = estimateHullEquatorCircumferenceM(hull);
  const scaleM = circumferenceM > 0 ? circumferenceM : 1;
  const distanceBins_m = [0.01, 0.025, 0.05, 0.1, 0.2].map((value) => value * scaleM);
  const same: number[] = [];
  const opposite: number[] = [];

  for (let a = 0; a < defects.length; a++) {
    for (let b = a + 1; b < defects.length; b++) {
      const distanceM = estimateDefectDistanceM(defects[a], defects[b], hull);
      if (distanceM == null) continue;
      if (defects[a].charge === defects[b].charge) same.push(distanceM);
      else opposite.push(distanceM);
    }
  }

  return {
    distanceBins_m,
    sameChargePairCounts: histogramUpperBounds(same, distanceBins_m),
    oppositeChargePairCounts: histogramUpperBounds(opposite, distanceBins_m),
  };
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
  const matches = matchDefects(
    args.previous?.defects,
    defects,
    args.hull,
    args.previous?.nowMs,
    args.nowMs,
  );
  const matchedSpeeds = matches
    .map((match) => match.speed_mps)
    .filter((speed): speed is number => typeof speed === "number" && Number.isFinite(speed));
  const matchedDefectSpeedMax = matchedSpeeds.length ? Math.max(...matchedSpeeds) : null;
  const schedulePatternMax = estimatePatternSpeed(args.schedule, args.hull, args.previous, args.nowMs);
  const patternMax =
    matchedDefectSpeedMax == null
      ? schedulePatternMax
      : schedulePatternMax == null
        ? matchedDefectSpeedMax
        : Math.max(schedulePatternMax, matchedDefectSpeedMax);
  const patternOverC = patternMax == null ? null : patternMax / C;
  const superluminalPatternObserved = patternOverC != null && patternOverC > 1;
  const previousDefectCount = args.previous?.defects.length ?? null;
  const creationCount = previousDefectCount == null ? null : Math.max(0, defects.length - matches.length);
  const annihilationCount =
    previousDefectCount == null ? null : Math.max(0, previousDefectCount - matches.length);
  const safeN = Math.max(1, Math.floor(args.schedule.N));
  const seamBand01 = Math.min(0.05, Math.max(0.01, 0.5 / safeN));
  const defectsNearSeams = countDefectsNearSeams(defects, safeN, seamBand01);
  const seamConcentration = defects.length > 0 ? defectsNearSeams / defects.length : 0;
  const speedBins_mps = [0.25 * C, 0.5 * C, C, 2 * C, 5 * C];
  const pairHistograms = computePairDistanceHistograms(defects, args.hull);

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
  if (defects.length > 0 && seamConcentration >= 0.5) {
    reasonCodes.push("phase_defects_concentrated_at_seams_review");
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
      matchedDefectSpeedMax_mps: matchedDefectSpeedMax,
      transportInterpretation: "pattern_only_no_energy_or_signal_claim",
    },
    seams: {
      seamBand01,
      defectsNearSeams,
      seamConcentration,
      maxSectorPhaseJump_rad: maxSeamJump,
    },
    phaseSpace: {
      speedBins_mps,
      speedCounts: histogramUpperBounds(matchedSpeeds, speedBins_mps),
      distanceBins_m: pairHistograms.distanceBins_m,
      sameChargePairCounts: pairHistograms.sameChargePairCounts,
      oppositeChargePairCounts: pairHistograms.oppositeChargePairCounts,
    },
    thresholds,
    researchBasis: {
      phaseSingularityRefs: PHASE_SINGULARITY_REFS,
      qiGuardrailRefs: QI_GUARDRAIL_REFS,
      casimirContextRefs: CASIMIR_CONTEXT_REFS,
      claimLimitations: [
        "Phase-singularity literature is used as a phase-field diagnostic analogy, not as evidence that NHM2 sector fields reproduce hBN polariton physics.",
        "Quantum inequality references remain the governing constraint class for negative-energy admissibility.",
        "Casimir references provide context for dynamic boundary and near-field modulation only; they do not promote topology diagnostics to metric source terms.",
      ],
    },
    claimLimit: {
      metricSourceAdmitted: false,
      energyTransportAdmitted: false,
      signalTransportAdmitted: false,
      strobePatternDiagnosticAdmitted: true,
      uncertainty: "experimental_analogy_not_validated_metric_source",
    },
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
