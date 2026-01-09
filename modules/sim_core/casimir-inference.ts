import { PHYSICS_CONSTANTS } from "../core/physics-constants.js";
import type { CasimirForceDataset } from "../../shared/schema.js";

type ForceSample = {
  separation_m: number;
  force_N: number;
  sigmaForce_N?: number;
  sigmaSep_m?: number;
};

type ForceSign = "negative" | "positive";
type ForceSignObserved = ForceSign | "mixed" | "unknown";

export type CasimirForceSignDiagnostics = {
  expected: ForceSign;
  observed: ForceSignObserved;
  positiveFraction: number;
  negativeFraction: number;
  sampleCount: number;
  autoFlipApplied: boolean;
  note?: string;
};

const FORCE_SIGN_DOMINANCE = 0.6;
const FORCE_SIGN_MIN_SAMPLES = 3;
const FORCE_SIGN_REL_EPS = 1e-6;
const FORCE_SIGN_ABS_EPS = 1e-30;

export type CasimirForceEnergyInference = {
  energy_J_at_a0: number;
  sigmaEnergy_J?: number;
  referenceSeparation_m: number;
  sampleCount: number;
  forceSign?: CasimirForceSignDiagnostics;
};

export type CasimirForceScaleInference = {
  kCasimir: number;
  sigmaK?: number;
  referenceSeparation_m: number;
  sampleCount: number;
  fitResiduals?: {
    rms_N?: number;
    rms_rel?: number;
    sampleCount?: number;
  };
  forceSign?: CasimirForceSignDiagnostics;
};

const resolveExpectedForceSign = (ds: CasimirForceDataset): ForceSign => {
  return ds.forceSignConvention === "attractionPositive" ? "positive" : "negative";
};

const computeForceSignDiagnostics = (
  samples: ForceSample[],
  expected: ForceSign,
): CasimirForceSignDiagnostics => {
  const magnitudes = samples
    .map((sample) => Math.abs(sample.force_N))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const median =
    magnitudes.length > 0
      ? magnitudes[Math.floor(magnitudes.length / 2)]
      : 0;
  const threshold = Math.max(FORCE_SIGN_ABS_EPS, median * FORCE_SIGN_REL_EPS);
  let positiveCount = 0;
  let negativeCount = 0;
  for (const sample of samples) {
    const force = sample.force_N;
    if (!Number.isFinite(force)) continue;
    if (force > threshold) {
      positiveCount += 1;
    } else if (force < -threshold) {
      negativeCount += 1;
    }
  }
  const counted = positiveCount + negativeCount;
  const positiveFraction = counted > 0 ? positiveCount / counted : 0;
  const negativeFraction = counted > 0 ? negativeCount / counted : 0;
  let observed: ForceSignObserved = "unknown";
  if (counted >= FORCE_SIGN_MIN_SAMPLES) {
    if (positiveFraction >= FORCE_SIGN_DOMINANCE) {
      observed = "positive";
    } else if (negativeFraction >= FORCE_SIGN_DOMINANCE) {
      observed = "negative";
    } else {
      observed = "mixed";
    }
  } else if (counted > 0) {
    observed = "mixed";
  }
  return {
    expected,
    observed,
    positiveFraction,
    negativeFraction,
    sampleCount: counted,
    autoFlipApplied: false,
  };
};

const isForceSignMismatch = (forceSign: CasimirForceSignDiagnostics): boolean =>
  (forceSign.observed === "positive" || forceSign.observed === "negative") &&
  forceSign.observed !== forceSign.expected;

const normalizeForceSamples = (ds: CasimirForceDataset): {
  samples: ForceSample[];
  forceSign: CasimirForceSignDiagnostics;
} => {
  const n = Math.min(
    ds.separation_m.length,
    ds.force_N.length,
    ds.sigmaForce_N?.length ?? Infinity,
    ds.sigmaSep_m?.length ?? Infinity,
  );
  const samples: ForceSample[] = [];
  for (let i = 0; i < n; i += 1) {
    const separation_m = Number(ds.separation_m[i]);
    const force_N = Number(ds.force_N[i]);
    if (!Number.isFinite(separation_m) || separation_m <= 0) continue;
    if (!Number.isFinite(force_N)) continue;
    const sigmaForce_N =
      ds.sigmaForce_N && Number.isFinite(ds.sigmaForce_N[i])
        ? Number(ds.sigmaForce_N[i])
        : undefined;
    const sigmaSep_m =
      ds.sigmaSep_m && Number.isFinite(ds.sigmaSep_m[i])
        ? Number(ds.sigmaSep_m[i])
        : undefined;
    samples.push({ separation_m, force_N, sigmaForce_N, sigmaSep_m });
  }
  samples.sort((a, b) => a.separation_m - b.separation_m);
  if (samples.length < 2) {
    throw new Error("casimir force dataset must include at least 2 valid samples");
  }
  const expectedSign = resolveExpectedForceSign(ds);
  const forceSign = computeForceSignDiagnostics(samples, expectedSign);
  if (isForceSignMismatch(forceSign)) {
    if (ds.allowForceSignAutoFlip) {
      console.warn("[casimir] Force sign mismatch; auto-flipping dataset", {
        datasetId: ds.datasetId,
        expected: forceSign.expected,
        observed: forceSign.observed,
        positiveFraction: forceSign.positiveFraction,
        negativeFraction: forceSign.negativeFraction,
        sampleCount: forceSign.sampleCount,
      });
      for (const sample of samples) {
        sample.force_N = -sample.force_N;
      }
      forceSign.autoFlipApplied = true;
      forceSign.note = "auto_flipped";
    } else {
      const err = new Error(
        `casimir force sign mismatch for dataset ${ds.datasetId}; ` +
          `expected ${forceSign.expected}, observed ${forceSign.observed}. ` +
          "Set allowForceSignAutoFlip=true to apply an explicit sign flip.",
      ) as Error & { code?: string; forceSign?: CasimirForceSignDiagnostics };
      err.code = "CASIMIR_FORCE_SIGN_MISMATCH";
      err.forceSign = forceSign;
      throw err;
    }
  }
  return { samples, forceSign };
};

const idealCasimirForce = (ds: CasimirForceDataset, separation_m: number): number => {
  const a = Math.max(1e-12, separation_m);
  const hbar_c = PHYSICS_CONSTANTS.HBAR_C;
  if (ds.geometry === "parallelPlate") {
    const area = ds.area_m2 ?? 0;
    if (!Number.isFinite(area) || area <= 0) return Number.NaN;
    return -(Math.PI ** 2) * hbar_c * area / (240 * a ** 4);
  }
  const radius = ds.radius_m ?? 0;
  if (!Number.isFinite(radius) || radius <= 0) return Number.NaN;
  return -(Math.PI ** 3) * hbar_c * radius / (360 * a ** 3);
};

export function inferEnergyFromForceSeries(
  ds: CasimirForceDataset,
): CasimirForceEnergyInference {
  const { samples, forceSign } = normalizeForceSamples(ds);
  let energy = 0;
  let variance = 0;
  for (let i = samples.length - 1; i > 0; i -= 1) {
    const hi = samples[i];
    const lo = samples[i - 1];
    const avgF = 0.5 * (hi.force_N + lo.force_N);
    const da = lo.separation_m - hi.separation_m;
    const dE = -avgF * da;
    energy += dE;

    const sigmaF_hi = hi.sigmaForce_N ?? 0;
    const sigmaF_lo = lo.sigmaForce_N ?? 0;
    const sigmaF_avg = 0.5 * Math.hypot(sigmaF_hi, sigmaF_lo);
    const sigmaA_hi = hi.sigmaSep_m ?? 0;
    const sigmaA_lo = lo.sigmaSep_m ?? 0;
    const sigmaDa = Math.hypot(sigmaA_hi, sigmaA_lo);
    if (sigmaF_avg > 0 || sigmaDa > 0) {
      const termF = Math.abs(da) * sigmaF_avg;
      const termA = Math.abs(avgF) * sigmaDa;
      variance += termF * termF + termA * termA;
    }
  }

  return {
    energy_J_at_a0: energy,
    sigmaEnergy_J: variance > 0 ? Math.sqrt(variance) : undefined,
    referenceSeparation_m: samples[samples.length - 1].separation_m,
    sampleCount: samples.length,
    forceSign,
  };
}

export function inferCasimirForceScale(
  ds: CasimirForceDataset,
): CasimirForceScaleInference | null {
  const { samples, forceSign } = normalizeForceSamples(ds);
  let weightedSum = 0;
  let weightTotal = 0;
  let hasWeights = false;

  for (const sample of samples) {
    const modelForce = idealCasimirForce(ds, sample.separation_m);
    if (!Number.isFinite(modelForce) || modelForce === 0) continue;
    const ratio = sample.force_N / modelForce;
    if (!Number.isFinite(ratio)) continue;
    const sigmaF = sample.sigmaForce_N;
    const sigmaRatio =
      sigmaF && Number.isFinite(sigmaF)
        ? Math.abs(sigmaF / modelForce)
        : undefined;
    const weight =
      sigmaRatio && sigmaRatio > 0 ? 1 / (sigmaRatio * sigmaRatio) : 1;
    if (sigmaRatio && sigmaRatio > 0) hasWeights = true;
    weightedSum += ratio * weight;
    weightTotal += weight;
  }

  if (weightTotal <= 0) return null;
  const kCasimir = weightedSum / weightTotal;
  let residualSumSq = 0;
  let residualRelSumSq = 0;
  let residualCount = 0;
  let residualRelCount = 0;
  for (const sample of samples) {
    const modelForce = idealCasimirForce(ds, sample.separation_m);
    if (!Number.isFinite(modelForce) || modelForce === 0) continue;
    const residual = sample.force_N - (kCasimir * modelForce);
    residualSumSq += residual * residual;
    residualCount += 1;
    if (Number.isFinite(sample.force_N) && sample.force_N !== 0) {
      const rel = residual / sample.force_N;
      residualRelSumSq += rel * rel;
      residualRelCount += 1;
    }
  }
  const fitResiduals = residualCount > 0
    ? {
        rms_N: Math.sqrt(residualSumSq / residualCount),
        rms_rel: residualRelCount > 0
          ? Math.sqrt(residualRelSumSq / residualRelCount)
          : undefined,
        sampleCount: residualCount,
      }
    : undefined;
  return {
    kCasimir,
    sigmaK: hasWeights ? Math.sqrt(1 / weightTotal) : undefined,
    referenceSeparation_m: samples[samples.length - 1].separation_m,
    sampleCount: samples.length,
    fitResiduals,
    forceSign,
  };
}
