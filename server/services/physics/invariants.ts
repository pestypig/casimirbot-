export type UncertaintyInterval = {
  low: number;
  high: number;
  confidence: number;
};

export type IntervalThresholdComparator = "<=" | ">=";

export type IntervalGateDecision = {
  pass: boolean;
  confidence: number;
  reason: string;
  observed: UncertaintyInterval;
  threshold: number;
  comparator: IntervalThresholdComparator;
};

const clampConfidence = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const intervalFromValue = (
  value: number,
  absoluteUncertainty: number,
  confidence = 0.68,
): UncertaintyInterval => {
  const center = Number.isFinite(value) ? value : 0;
  const spread = Number.isFinite(absoluteUncertainty)
    ? Math.abs(absoluteUncertainty)
    : 0;
  return {
    low: center - spread,
    high: center + spread,
    confidence: clampConfidence(confidence),
  };
};

export const combineIntervalSum = (
  intervals: UncertaintyInterval[],
): UncertaintyInterval => {
  let low = 0;
  let high = 0;
  let confidence = 1;
  for (const interval of intervals) {
    const l = Number.isFinite(interval.low) ? interval.low : 0;
    const h = Number.isFinite(interval.high) ? interval.high : 0;
    low += Math.min(l, h);
    high += Math.max(l, h);
    confidence = Math.min(confidence, clampConfidence(interval.confidence));
  }
  return { low, high, confidence };
};

export const scaleInterval = (
  interval: UncertaintyInterval,
  scalar: number,
): UncertaintyInterval => {
  const factor = Number.isFinite(scalar) ? scalar : 0;
  const candidates = [interval.low * factor, interval.high * factor];
  return {
    low: Math.min(...candidates),
    high: Math.max(...candidates),
    confidence: clampConfidence(interval.confidence),
  };
};

export const sqrtInterval = (interval: UncertaintyInterval): UncertaintyInterval => {
  const low = Math.max(0, Math.min(interval.low, interval.high));
  const high = Math.max(0, Math.max(interval.low, interval.high));
  return {
    low: Math.sqrt(low),
    high: Math.sqrt(high),
    confidence: clampConfidence(interval.confidence),
  };
};

export function integrateEnergyJ(
  u: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  thickness: number,
): number {
  let sum = 0;
  const total = nx * ny;
  for (let i = 0; i < total; i++) {
    sum += u[i];
  }
  return sum * dx * dy * thickness;
}

export const integrateEnergyIntervalJ = (
  u: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  thickness: number,
  cellAbsoluteUncertainty = 0,
  confidence = 0.68,
): UncertaintyInterval => {
  const scale = dx * dy * thickness;
  const total = nx * ny;
  const terms: UncertaintyInterval[] = [];
  for (let i = 0; i < total; i += 1) {
    terms.push(
      scaleInterval(
        intervalFromValue(u[i], cellAbsoluteUncertainty, confidence),
        scale,
      ),
    );
  }
  return combineIntervalSum(terms);
};

export const computeInvariantMassEnergyInterval = (
  energy_J: UncertaintyInterval,
  momentum_kg_m_s: UncertaintyInterval,
  c: number,
): UncertaintyInterval => {
  const safeC = Number.isFinite(c) && Math.abs(c) > 0 ? Math.abs(c) : 1;
  const e2 = {
    low: Math.min(energy_J.low ** 2, energy_J.high ** 2),
    high: Math.max(energy_J.low ** 2, energy_J.high ** 2),
    confidence: Math.min(energy_J.confidence, momentum_kg_m_s.confidence),
  };
  const pc = scaleInterval(momentum_kg_m_s, safeC);
  const pc2 = {
    low: Math.min(pc.low ** 2, pc.high ** 2),
    high: Math.max(pc.low ** 2, pc.high ** 2),
    confidence: Math.min(energy_J.confidence, momentum_kg_m_s.confidence),
  };
  const mc2Squared: UncertaintyInterval = {
    low: e2.low - pc2.high,
    high: e2.high - pc2.low,
    confidence: Math.min(e2.confidence, pc2.confidence),
  };
  return sqrtInterval(mc2Squared);
};

export const evaluateIntervalGate = (
  label: string,
  observed: UncertaintyInterval,
  comparator: IntervalThresholdComparator,
  threshold: number,
): IntervalGateDecision => {
  const conf = clampConfidence(observed.confidence);
  if (comparator === "<=") {
    if (observed.high <= threshold) {
      return {
        pass: true,
        confidence: conf,
        reason: `${label} passed: upper bound ${observed.high.toExponential(3)} <= ${threshold.toExponential(3)} @ ${(conf * 100).toFixed(1)}% confidence`,
        observed,
        threshold,
        comparator,
      };
    }
    if (observed.low > threshold) {
      return {
        pass: false,
        confidence: conf,
        reason: `${label} failed: lower bound ${observed.low.toExponential(3)} exceeds ${threshold.toExponential(3)} @ ${(conf * 100).toFixed(1)}% confidence`,
        observed,
        threshold,
        comparator,
      };
    }
    return {
      pass: false,
      confidence: conf,
      reason: `${label} failed conservatively: interval [${observed.low.toExponential(3)}, ${observed.high.toExponential(3)}] straddles threshold ${threshold.toExponential(3)} @ ${(conf * 100).toFixed(1)}% confidence`,
      observed,
      threshold,
      comparator,
    };
  }

  if (observed.low >= threshold) {
    return {
      pass: true,
      confidence: conf,
      reason: `${label} passed: lower bound ${observed.low.toExponential(3)} >= ${threshold.toExponential(3)} @ ${(conf * 100).toFixed(1)}% confidence`,
      observed,
      threshold,
      comparator,
    };
  }
  if (observed.high < threshold) {
    return {
      pass: false,
      confidence: conf,
      reason: `${label} failed: upper bound ${observed.high.toExponential(3)} below ${threshold.toExponential(3)} @ ${(conf * 100).toFixed(1)}% confidence`,
      observed,
      threshold,
      comparator,
    };
  }
  return {
    pass: false,
    confidence: conf,
    reason: `${label} failed conservatively: interval [${observed.low.toExponential(3)}, ${observed.high.toExponential(3)}] straddles threshold ${threshold.toExponential(3)} @ ${(conf * 100).toFixed(1)}% confidence`,
    observed,
    threshold,
    comparator,
  };
};

export function poissonResidualRMS(
  phi: Float32Array,
  rhoEff: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
): number {
  const invdx2 = 1 / (dx * dx);
  const invdy2 = 1 / (dy * dy);
  let sse = 0;
  let n = 0;
  for (let y = 1; y < ny - 1; y++) {
    for (let x = 1; x < nx - 1; x++) {
      const i = y * nx + x;
      const lap =
        (phi[i - 1] - 2 * phi[i] + phi[i + 1]) * invdx2 +
        (phi[i - nx] - 2 * phi[i] + phi[i + nx]) * invdy2;
      const res = lap - fourPiG * rhoEff[i];
      sse += res * res;
      n++;
    }
  }
  if (n === 0) {
    return 0;
  }
  return Math.sqrt(sse / n);
}

export const poissonResidualRMSInterval = (
  phi: Float32Array,
  rhoEff: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
  absoluteUncertainty = 0,
  confidence = 0.68,
): UncertaintyInterval => {
  const base = poissonResidualRMS(phi, rhoEff, nx, ny, dx, dy, fourPiG);
  return intervalFromValue(base, absoluteUncertainty, confidence);
};
