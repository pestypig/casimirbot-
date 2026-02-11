type Vec3 = [number, number, number];

export type WarpChartLabel =
  | "lab_cartesian"
  | "comoving_cartesian"
  | "spherical_comoving"
  | "unspecified";

export type DtGammaPolicy = "assumed_zero" | "computed" | "unknown";

export type WarpMetricFamily =
  | "natario"
  | "natario_sdf"
  | "alcubierre"
  | "vdb"
  | "unknown";

export type WarpChartContract = {
  label: WarpChartLabel;
  dtGammaPolicy: DtGammaPolicy;
  coordinateMap?: string;
  notes?: string;
  contractStatus?: "ok" | "override" | "unknown";
  contractReason?: string;
};

type ShiftVectorField = {
  amplitude?: number;
  evaluateShiftVector?: (x: number, y: number, z: number) => Vec3;
};

type HodgeDiagnostics = {
  maxDiv?: number;
  rmsDiv?: number;
  maxCurl?: number;
  rmsCurl?: number;
  grid?: [number, number, number];
  domain?: { min: Vec3; max: Vec3 };
};

type VdbConformalDiagnostics = {
  bMin?: number;
  bMax?: number;
  bprimeMin?: number;
  bprimeMax?: number;
  bdoubleMin?: number;
  bdoubleMax?: number;
  betaAmplitude?: number;
};

export type WarpMetricAdapterSnapshot = {
  family: WarpMetricFamily;
  chart: WarpChartContract;
  alpha: number;
  gammaDiag: [number, number, number];
  betaSource: "shiftVectorField" | "none";
  requestedFieldType?: string;
  betaDiagnostics?: {
    method:
      | "hodge-grid"
      | "finite-diff"
      | "hodge-grid+conformal"
      | "finite-diff+conformal"
      | "not-computed";
    thetaMax?: number;
    thetaRms?: number;
    curlMax?: number;
    curlRms?: number;
    thetaConformalMax?: number;
    thetaConformalRms?: number;
    bPrimeOverBMax?: number;
    bDoubleOverBMax?: number;
    sampleCount?: number;
    step_m?: number;
    note?: string;
  };
};

export type WarpMetricAdapterInput = {
  family: WarpMetricFamily;
  chart?: Partial<WarpChartContract>;
  alpha?: number;
  gammaDiag?: [number, number, number];
  shiftVectorField?: ShiftVectorField;
  requestedFieldType?: string;
  hodgeDiagnostics?: HodgeDiagnostics;
  vdbConformalDiagnostics?: VdbConformalDiagnostics;
  betaDiagnostics?: WarpMetricAdapterSnapshot["betaDiagnostics"];
  expansionScalar?: number;
  curlMagnitude?: number;
  sampleScale_m?: number;
  sampleCount?: number;
  dtGammaProvided?: boolean;
  note?: string;
};

const DEFAULT_CHART: WarpChartContract = {
  label: "comoving_cartesian",
  dtGammaPolicy: "assumed_zero",
};

const DEFAULT_DT_GAMMA_POLICY: Record<WarpChartLabel, DtGammaPolicy> = {
  lab_cartesian: "computed",
  comoving_cartesian: "assumed_zero",
  spherical_comoving: "assumed_zero",
  unspecified: "unknown",
};

const DEFAULT_CHART_DESCRIPTIONS: Record<
  WarpChartLabel,
  { coordinateMap?: string; notes?: string }
> = {
  lab_cartesian: {
    coordinateMap: "lab frame (t, x, y, z)",
    notes: "lab slicing; dt gamma computed when available",
  },
  comoving_cartesian: {
    coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
    notes: "bubble-centered chart; dt gamma assumed zero",
  },
  spherical_comoving: {
    coordinateMap: "spherical_comoving: (r,theta,phi) with x-axis as polar",
    notes: "comoving spherical chart for divergence-free shift fields",
  },
  unspecified: {
    coordinateMap: "unspecified",
    notes: "chart label or coordinate map not provided",
  },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const normalize = (v: Vec3): Vec3 => {
  const m = Math.hypot(v[0], v[1], v[2]);
  if (!m) return [0, 0, 0];
  return [v[0] / m, v[1] / m, v[2] / m];
};

const buildSamplePoints = (scale: number, count: number): Vec3[] => {
  const safeScale = Math.max(1e-9, Math.abs(scale));
  const radii = [safeScale * 0.5, safeScale];
  const directions: Vec3[] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];
  const points: Vec3[] = [[0, 0, 0]];
  for (const dir of directions) {
    const nd = normalize(dir);
    for (const r of radii) {
      points.push([nd[0] * r, nd[1] * r, nd[2] * r]);
      if (points.length >= count) return points;
    }
  }
  return points.slice(0, count);
};

const finiteDiffDiagnostics = (
  evaluate: (x: number, y: number, z: number) => Vec3,
  points: Vec3[],
  step: number,
) => {
  const h = Math.max(1e-9, Math.abs(step));
  let maxDiv = 0;
  let sumDiv2 = 0;
  let maxCurl = 0;
  let sumCurl2 = 0;
  let sampleCount = 0;

  for (const p of points) {
    const [x, y, z] = p;
    const xp = evaluate(x + h, y, z);
    const xm = evaluate(x - h, y, z);
    const yp = evaluate(x, y + h, z);
    const ym = evaluate(x, y - h, z);
    const zp = evaluate(x, y, z + h);
    const zm = evaluate(x, y, z - h);

    if (
      !xp.every(isFiniteNumber) ||
      !xm.every(isFiniteNumber) ||
      !yp.every(isFiniteNumber) ||
      !ym.every(isFiniteNumber) ||
      !zp.every(isFiniteNumber) ||
      !zm.every(isFiniteNumber)
    ) {
      continue;
    }

    const dBx_dx = (xp[0] - xm[0]) / (2 * h);
    const dBy_dx = (xp[1] - xm[1]) / (2 * h);
    const dBz_dx = (xp[2] - xm[2]) / (2 * h);
    const dBx_dy = (yp[0] - ym[0]) / (2 * h);
    const dBy_dy = (yp[1] - ym[1]) / (2 * h);
    const dBz_dy = (yp[2] - ym[2]) / (2 * h);
    const dBx_dz = (zp[0] - zm[0]) / (2 * h);
    const dBy_dz = (zp[1] - zm[1]) / (2 * h);
    const dBz_dz = (zp[2] - zm[2]) / (2 * h);

    const div = dBx_dx + dBy_dy + dBz_dz;
    const curlX = dBz_dy - dBy_dz;
    const curlY = dBx_dz - dBz_dx;
    const curlZ = dBy_dx - dBx_dy;
    const curlMag = Math.hypot(curlX, curlY, curlZ);

    if (Number.isFinite(div)) {
      maxDiv = Math.max(maxDiv, Math.abs(div));
      sumDiv2 += div * div;
    }
    if (Number.isFinite(curlMag)) {
      maxCurl = Math.max(maxCurl, Math.abs(curlMag));
      sumCurl2 += curlMag * curlMag;
    }
    sampleCount += 1;
  }

  if (sampleCount === 0) return null;
  return {
    maxDiv,
    rmsDiv: Math.sqrt(sumDiv2 / sampleCount),
    maxCurl,
    rmsCurl: Math.sqrt(sumCurl2 / sampleCount),
    sampleCount,
  };
};

const maxAbsPair = (a: unknown, b: unknown): number | undefined => {
  const an = isFiniteNumber(a) ? Math.abs(a) : undefined;
  const bn = isFiniteNumber(b) ? Math.abs(b) : undefined;
  if (an == null && bn == null) return undefined;
  return Math.max(an ?? 0, bn ?? 0);
};

const computeVdbConformalCorrection = (
  diagnostics: VdbConformalDiagnostics | undefined,
  fallbackBetaAmplitude: number | undefined,
): {
  thetaConformalMax: number;
  thetaConformalRms: number;
  bPrimeOverBMax: number;
  bDoubleOverBMax: number;
  betaAmplitude: number;
} | null => {
  if (!diagnostics) return null;
  const bPrimeMaxAbs = maxAbsPair(diagnostics.bprimeMin, diagnostics.bprimeMax);
  const bDoubleMaxAbs = maxAbsPair(diagnostics.bdoubleMin, diagnostics.bdoubleMax);
  const bMin = isFiniteNumber(diagnostics.bMin) ? diagnostics.bMin : undefined;
  const bMax = isFiniteNumber(diagnostics.bMax) ? diagnostics.bMax : undefined;
  const bRef =
    bMin != null && bMax != null && bMin > 0 && bMax > 0
      ? Math.sqrt(bMin * bMax)
      : bMin != null && bMin > 0
        ? bMin
        : bMax != null && bMax > 0
          ? bMax
          : undefined;
  const betaAmplitude =
    isFiniteNumber(diagnostics.betaAmplitude) && diagnostics.betaAmplitude >= 0
      ? diagnostics.betaAmplitude
      : isFiniteNumber(fallbackBetaAmplitude) && fallbackBetaAmplitude >= 0
        ? fallbackBetaAmplitude
        : 0;

  if (
    bRef == null ||
    !isFiniteNumber(bPrimeMaxAbs) ||
    bPrimeMaxAbs <= 0 ||
    !isFiniteNumber(betaAmplitude) ||
    betaAmplitude <= 0
  ) {
    return null;
  }

  const bPrimeOverBMax = bPrimeMaxAbs / Math.max(1e-12, bRef);
  const bDoubleOverBMax =
    isFiniteNumber(bDoubleMaxAbs) && bDoubleMaxAbs > 0
      ? bDoubleMaxAbs / Math.max(1e-12, bRef)
      : 0;
  // For gamma_ij = B(r)^2 delta_ij, divergence term includes +3*beta^k*partial_k ln(B).
  const thetaConformalMax = 3 * betaAmplitude * bPrimeOverBMax;
  const thetaConformalRms = thetaConformalMax / Math.sqrt(3);
  return {
    thetaConformalMax,
    thetaConformalRms,
    bPrimeOverBMax,
    bDoubleOverBMax,
    betaAmplitude,
  };
};

export const buildWarpMetricAdapterSnapshot = (
  input: WarpMetricAdapterInput,
): WarpMetricAdapterSnapshot => {
  const requestedChart = input.chart ?? {};
  const label = requestedChart.label ?? DEFAULT_CHART.label;
  const defaultPolicy = DEFAULT_DT_GAMMA_POLICY[label];
  const dtGammaPolicy = requestedChart.dtGammaPolicy ?? defaultPolicy;
  const dtGammaProvided = input.dtGammaProvided === true;
  const defaultDesc = DEFAULT_CHART_DESCRIPTIONS[label];
  let notes = requestedChart.notes ?? defaultDesc?.notes;
  const coordinateMap =
    requestedChart.coordinateMap ?? defaultDesc?.coordinateMap;
  if (
    requestedChart.dtGammaPolicy &&
    requestedChart.dtGammaPolicy !== defaultPolicy
  ) {
    const note = `dtGammaPolicy override (${requestedChart.dtGammaPolicy}) for chart ${label}`;
    notes = notes ? `${notes}; ${note}` : note;
  }
  let contractStatus: WarpChartContract["contractStatus"] = "ok";
  let contractReason: string | undefined;
  if (label === "unspecified" || dtGammaPolicy === "unknown") {
    contractStatus = "unknown";
    contractReason = "chart label or dtGammaPolicy unspecified";
  } else if (
    requestedChart.dtGammaPolicy &&
    requestedChart.dtGammaPolicy !== defaultPolicy
  ) {
    contractStatus = "override";
    contractReason = `dtGammaPolicy override from ${defaultPolicy} to ${requestedChart.dtGammaPolicy} for chart ${label}`;
  } else if (dtGammaPolicy === "computed" && !dtGammaProvided) {
    contractStatus = "unknown";
    contractReason = "dtGammaPolicy computed but dtGamma data not provided";
  }
  if (!contractReason && contractStatus === "ok") {
    contractReason = "ok";
  }
  const chart: WarpChartContract = {
    ...DEFAULT_CHART,
    ...requestedChart,
    label,
    dtGammaPolicy,
    ...(notes ? { notes } : {}),
    ...(coordinateMap ? { coordinateMap } : {}),
    ...(contractStatus ? { contractStatus } : {}),
    ...(contractReason ? { contractReason } : {}),
  };
  const alpha = isFiniteNumber(input.alpha) ? input.alpha : 1;
  const gammaDiag = input.gammaDiag ?? [1, 1, 1];
  const shift = input.shiftVectorField;
  const hasShift = !!shift?.evaluateShiftVector;

  let betaDiagnostics: WarpMetricAdapterSnapshot["betaDiagnostics"] | undefined =
    input.betaDiagnostics ? { ...input.betaDiagnostics } : undefined;
  if (betaDiagnostics && !betaDiagnostics.method) {
    betaDiagnostics.method = "not-computed";
  }
  if (!betaDiagnostics && input.hodgeDiagnostics) {
    betaDiagnostics = {
      method: "hodge-grid",
      thetaMax: input.hodgeDiagnostics.maxDiv,
      thetaRms: input.hodgeDiagnostics.rmsDiv,
      curlMax: input.hodgeDiagnostics.maxCurl,
      curlRms: input.hodgeDiagnostics.rmsCurl,
      note: "Derived from Helmholtz-Hodge diagnostics grid.",
    };
  } else if (!betaDiagnostics && hasShift) {
    const scale = Math.max(1e-9, input.sampleScale_m ?? 1);
    const step = clamp(scale * 0.02, 1e-9, scale);
    const sampleCount = Math.max(12, Math.floor(input.sampleCount ?? 32));
    const points = buildSamplePoints(scale, sampleCount);
    const diag = finiteDiffDiagnostics(shift!.evaluateShiftVector!, points, step);
    if (diag) {
      betaDiagnostics = {
        method: "finite-diff",
        thetaMax: diag.maxDiv,
        thetaRms: diag.rmsDiv,
        curlMax: diag.maxCurl,
        curlRms: diag.rmsCurl,
        sampleCount: diag.sampleCount,
        step_m: step,
        note: "Central-difference estimate from shiftVectorField.",
      };
    } else {
      betaDiagnostics = {
        method: "not-computed",
        note: "Shift vector returned non-finite samples.",
      };
    }
  } else if (
    !betaDiagnostics &&
    (isFiniteNumber(input.expansionScalar) || isFiniteNumber(input.curlMagnitude))
  ) {
    betaDiagnostics = {
      method: "not-computed",
      thetaMax: input.expansionScalar,
      curlMax: input.curlMagnitude,
      note: "Scalar diagnostics present but derivative-based checks not computed.",
    };
  }

  if (input.note && betaDiagnostics) {
    betaDiagnostics.note = betaDiagnostics.note
      ? `${betaDiagnostics.note} ${input.note}`
      : input.note;
  }

  if (input.vdbConformalDiagnostics) {
    const conformal = computeVdbConformalCorrection(
      input.vdbConformalDiagnostics,
      shift?.amplitude,
    );
    if (conformal && !betaDiagnostics) {
      betaDiagnostics = {
        method: "not-computed",
        thetaConformalMax: conformal.thetaConformalMax,
        thetaConformalRms: conformal.thetaConformalRms,
        bPrimeOverBMax: conformal.bPrimeOverBMax,
        bDoubleOverBMax: conformal.bDoubleOverBMax,
        note: `VdB conformal diagnostics available (|grad ln B|max=${conformal.bPrimeOverBMax.toExponential(
          3,
        )}) but no base shift diagnostics were provided.`,
      };
    } else if (conformal && betaDiagnostics) {
      const baseThetaMax = isFiniteNumber(betaDiagnostics.thetaMax)
        ? Math.abs(betaDiagnostics.thetaMax)
        : 0;
      const baseThetaRms = isFiniteNumber(betaDiagnostics.thetaRms)
        ? Math.abs(betaDiagnostics.thetaRms)
        : baseThetaMax;
      betaDiagnostics.thetaConformalMax = conformal.thetaConformalMax;
      betaDiagnostics.thetaConformalRms = conformal.thetaConformalRms;
      betaDiagnostics.bPrimeOverBMax = conformal.bPrimeOverBMax;
      betaDiagnostics.bDoubleOverBMax = conformal.bDoubleOverBMax;
      betaDiagnostics.thetaMax = baseThetaMax + conformal.thetaConformalMax;
      betaDiagnostics.thetaRms = Math.hypot(baseThetaRms, conformal.thetaConformalRms);
      if (betaDiagnostics.method === "finite-diff") {
        betaDiagnostics.method = "finite-diff+conformal";
      } else if (betaDiagnostics.method === "hodge-grid") {
        betaDiagnostics.method = "hodge-grid+conformal";
      }
      const conformalNote = `VdB conformal correction (+3 beta*grad ln B) applied with |grad ln B|max=${conformal.bPrimeOverBMax.toExponential(
        3,
      )}, betaAmp=${conformal.betaAmplitude.toExponential(3)}.`;
      betaDiagnostics.note = betaDiagnostics.note
        ? `${betaDiagnostics.note} ${conformalNote}`
        : conformalNote;
    }
  }

  return {
    family: input.family,
    chart,
    alpha,
    gammaDiag,
    betaSource: hasShift ? "shiftVectorField" : "none",
    ...(input.requestedFieldType
      ? { requestedFieldType: input.requestedFieldType }
      : {}),
    ...(betaDiagnostics ? { betaDiagnostics } : {}),
  };
};

