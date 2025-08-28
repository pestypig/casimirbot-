/**
 * Shared theta-scale calculation utility
 * Consolidates physics calculations between WarpVisualizer and WarpBubbleCompare
 */

export type DutySource = 'fr' | 'ui';

/**
 * Resolves theta-scale from physics parameters using unified logic
 * @param p Physics parameters object
 * @param dutySource Whether to use FR-effective duty ('fr') or UI duty ('ui')
 * @returns Calculated theta-scale value
 */
export function resolveThetaScale(p: any, dutySource: DutySource = 'fr') {
  // Small helpers for robust numeric coercion
  const toNum = (v: any) => (v === undefined || v === null || v === '' ? NaN : Number(v));
  const isFin = (v: any) => Number.isFinite(v);
  const pickNum = (candidates: any[], fallback: number) => {
    for (const c of candidates) {
      const n = toNum(c);
      if (isFin(n)) return n;
    }
    return fallback;
  };

  // Prefer direct scalar if upstream provided it (supports numeric strings too)
  const thetaScalar = toNum(p?.thetaScale);
  if (isFin(thetaScalar)) return thetaScalar;

  const gammaGeo = pickNum([p?.gammaGeo, p?.g_y], 26);
  const qSpoil   = pickNum([p?.qSpoilingFactor, p?.deltaAOverA], 1);
  const gammaVdB = pickNum([p?.gammaVdB, p?.gammaVanDenBroeck], 0);

  // Duty resolution based on source preference
  let duty = pickNum([p?.dutyCycle], 0.14); // UI duty (visible) - fallback

  if (dutySource === 'fr') {
    // FR source: prefer FR-effective values, then lightCrossing, finally UI duty
    const dutyFR = pickNum([p?.dutyEffectiveFR, p?.dutyEffective_FR], NaN);
    if (isFin(dutyFR)) {
      duty = dutyFR;
    } else if (
      p?.lightCrossing &&
      isFin(toNum(p.lightCrossing.burst_ms)) &&
      isFin(toNum(p.lightCrossing.dwell_ms)) &&
      toNum(p.lightCrossing.dwell_ms) > 0
    ) {
      // For WarpBubbleCompare: divide by sectors for per-sector duty
      const sectorsLC = Math.max(1, pickNum([p?.sectorCount, p?.sectors], 1));
      duty = toNum(p.lightCrossing.burst_ms) / toNum(p.lightCrossing.dwell_ms) / sectorsLC;
    }
    // Clamp to valid duty cycle range
    duty = Math.max(0, Math.min(1, duty));
  }
  // For 'ui' source, we already have the UI duty from dutyCycle fallback

  // IMPORTANT: use total sectors for averaging, not concurrent strobing
  const sectors = Math.max(
    1,
    Math.floor(
      pickNum(
        [
          p?.sectorCount,
          p?.sectors,                 // fallback
          p?.sectorStrobing,          // last resort (viz)
          p?.lightCrossing?.sectorCount,
        ],
        400
      )
    )
  );

  const viewAvg  = (p?.viewAvg ?? true) ? 1 : 0;     // if you ever allow per-view toggles
  const A_geo    = Math.pow(Math.max(1, gammaGeo), 3);
  const dutyTerm = viewAvg ? Math.max(1e-12, duty / sectors) : 1;
  const result   = A_geo * Math.max(1e-12, qSpoil) * Math.max(1, gammaVdB) * dutyTerm;

  // Debug: Track exact thetaScale calculation (safe in both browser & node)
  const __DEV__ =
    (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') ||
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV);

  if (__DEV__) {
    // toExponential on numbers (including 0/NaN) is safe; coerce explicitly
    const gammaVdBStr = Number(gammaVdB).toExponential(2);
    console.log(
      `[${dutySource.toUpperCase()}] thetaScale=${Number(result).toExponential(2)} ` +
      `(γGeo=${gammaGeo}, qSpoil=${qSpoil}, γVdB=${gammaVdBStr}, duty=${duty}, sectors=${sectors})`
    );
  }

  return result;
}