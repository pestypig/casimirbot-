
/**
 * Shared theta-scale calculation utility
 * Consolidates physics calculations between WarpVisualizer and WarpBubbleCompare
 */

export type DutySource = 'fr' | 'ui';

/**
 * Debug logging utility with environment detection
 */
function debugLog(message: string, ...args: any[]) {
  // Robust development environment detection
  const isDev = 
    (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') ||
    (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV) ||
    (typeof window !== 'undefined' && (window as any).__DEV__) ||
    false;
    
  if (isDev) {
    console.log(`[warp-theta] ${message}`, ...args);
  }
}

/**
 * Enhanced parameter validation and debugging
 */
function validateParameters(p: any, dutySource: DutySource) {
  const issues: string[] = [];
  
  if (!p || typeof p !== 'object') {
    issues.push('Parameters object is null or not an object');
    return issues;
  }
  
  // Check for required physics parameters
  const gammaGeo = toNum(p?.gammaGeo) || toNum(p?.g_y);
  const qSpoil = toNum(p?.qSpoilingFactor) || toNum(p?.deltaAOverA);
  const duty = toNum(p?.dutyCycle);
  
  if (!isFin(gammaGeo) || gammaGeo <= 0) {
    issues.push(`Invalid gammaGeo: ${gammaGeo} (should be positive finite number)`);
  }
  
  if (!isFin(qSpoil) || qSpoil <= 0) {
    issues.push(`Invalid qSpoilingFactor: ${qSpoil} (should be positive finite number)`);
  }
  
  if (dutySource === 'ui' && (!isFin(duty) || duty < 0 || duty > 1)) {
    issues.push(`Invalid UI duty cycle: ${duty} (should be between 0 and 1)`);
  }
  
  if (dutySource === 'fr') {
    const dutyFR = toNum(p?.dutyEffectiveFR) || toNum(p?.dutyEffective_FR);
    if (!isFin(dutyFR) && !p?.lightCrossing) {
      issues.push('FR duty source requested but no dutyEffectiveFR or lightCrossing data available');
    }
  }
  
  return issues;
}

/**
 * Resolves theta-scale from physics parameters using unified logic
 * @param p Physics parameters object
 * @param dutySource Whether to use FR-effective duty ('fr') or UI duty ('ui')
 * @returns Calculated theta-scale value
 */
export function resolveThetaScale(p: any, dutySource: DutySource = 'fr') {
  debugLog(`Starting theta-scale calculation with dutySource: ${dutySource}`);
  
  // Validate input parameters
  const validationIssues = validateParameters(p, dutySource);
  if (validationIssues.length > 0) {
    debugLog('Parameter validation issues:', validationIssues);
    console.warn('[warp-theta] Parameter validation issues:', validationIssues);
  }
  
  // Small helpers for robust numeric coercion
  const toNum = (v: any) => {
    if (v === undefined || v === null || v === '') return NaN;
    const num = Number(v);
    debugLog(`toNum(${v}) -> ${num}`);
    return num;
  };
  
  const isFin = (v: any) => Number.isFinite(v);
  
  const pickNum = (candidates: any[], fallback: number, label?: string) => {
    debugLog(`pickNum for ${label || 'unnamed'}:`, candidates, `fallback: ${fallback}`);
    for (const c of candidates) {
      const n = toNum(c);
      if (isFin(n)) {
        debugLog(`Selected ${n} from candidates`);
        return n;
      }
    }
    debugLog(`Using fallback ${fallback}`);
    return fallback;
  };

  // Prefer direct scalar if upstream provided it (supports numeric strings too)
  const thetaScalar = toNum(p?.thetaScale);
  if (isFin(thetaScalar)) {
    debugLog(`Using direct thetaScale: ${thetaScalar}`);
    return thetaScalar;
  }

  // Extract core physics parameters with debugging
  const gammaGeo = pickNum([p?.gammaGeo, p?.g_y], 26, 'gammaGeo');
  const qSpoil = pickNum([p?.qSpoilingFactor, p?.deltaAOverA], 1, 'qSpoilingFactor');
  const gammaVdB = pickNum([p?.gammaVdB, p?.gammaVanDenBroeck], 0, 'gammaVanDenBroeck');

  debugLog('Core physics parameters:', {
    gammaGeo,
    qSpoil,
    gammaVdB
  });

  // Duty resolution based on source preference
  let duty = pickNum([p?.dutyCycle], 0.14, 'UI duty (fallback)'); // UI duty (visible) - fallback

  if (dutySource === 'fr') {
    debugLog('Resolving FR duty...');
    
    // FR source: prefer FR-effective values, then lightCrossing, finally UI duty
    const dutyFR = pickNum([p?.dutyEffectiveFR, p?.dutyEffective_FR], NaN, 'dutyEffectiveFR');
    
    if (isFin(dutyFR)) {
      duty = dutyFR;
      debugLog(`Using FR duty: ${duty}`);
    } else if (
      p?.lightCrossing &&
      isFin(toNum(p.lightCrossing.burst_ms)) &&
      isFin(toNum(p.lightCrossing.dwell_ms)) &&
      toNum(p.lightCrossing.dwell_ms) > 0
    ) {
      const burstMs = toNum(p.lightCrossing.burst_ms);
      const dwellMs = toNum(p.lightCrossing.dwell_ms);
      const sectorsLC = Math.max(1, pickNum([p?.sectorCount, p?.sectors], 1, 'lightCrossing sectors'));
      
      duty = burstMs / dwellMs / sectorsLC;
      debugLog(`Calculated duty from lightCrossing: ${duty} (burst=${burstMs}ms, dwell=${dwellMs}ms, sectors=${sectorsLC})`);
    } else {
      debugLog('No FR duty sources available, using UI duty fallback');
    }
    
    // Clamp to valid duty cycle range
    const originalDuty = duty;
    duty = Math.max(0, Math.min(1, duty));
    if (duty !== originalDuty) {
      debugLog(`Clamped duty from ${originalDuty} to ${duty}`);
    }
  }

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
        400,
        'sectors'
      )
    )
  );

  debugLog('Sector configuration:', { sectors });

  const viewAvg = (p?.viewAvg ?? true) ? 1 : 0;     // if you ever allow per-view toggles
  const A_geo = Math.pow(Math.max(1, gammaGeo), 3);
  const dutyTerm = viewAvg ? Math.max(1e-12, duty / sectors) : 1;
  const result = A_geo * Math.max(1e-12, qSpoil) * Math.max(1, gammaVdB) * dutyTerm;

  // Validate result is finite and reasonable
  if (!Number.isFinite(result) || result < 0) {
    console.error(`[warp-theta] Invalid theta scale result: ${result}`);
    return 1e-12; // Safe fallback
  }

  debugLog('Calculation breakdown:', {
    viewAvg,
    A_geo: `${gammaGeo}^3 = ${A_geo}`,
    dutyTerm: `${duty} / ${sectors} = ${dutyTerm}`,
    finalResult: result,
    formula: `${A_geo} * ${qSpoil} * ${gammaVdB} * ${dutyTerm} = ${result}`
  });

  // Enhanced audit vs expected with better error handling
  if (Number.isFinite(+p.thetaScaleExpected) && Number.isFinite(+result)) {
    const exp = +p.thetaScaleExpected;
    const rel = Math.abs(result - exp) / Math.max(1e-12, Math.abs(exp));
    const relPct = (rel * 100).toFixed(1);
    
    debugLog('Theta-scale audit:', {
      calculated: result,
      expected: exp,
      relativeDifference: relPct + '%'
    });
    
    if (rel > 0.50) { // Increased threshold to avoid noise
      console.warn(
        `[warp-theta] θ significant mismatch vs expected (>${relPct}%): ` +
        `calculated=${result.toExponential(2)}, expected=${exp.toExponential(2)}, rel=${relPct}%`
      );
    }
  }

  // Final result logging with enhanced debugging
  const gammaVdBStr = Number(gammaVdB).toExponential(2);
  debugLog(
    `[${dutySource.toUpperCase()}] Final θ-scale=${Number(result).toExponential(2)} ` +
    `(γGeo=${gammaGeo}, qSpoil=${qSpoil}, γVdB=${gammaVdBStr}, duty=${duty}, sectors=${sectors})`
  );
  
  // Additional validation logging
  if (result < 1e-12) {
    console.warn(`[warp-theta] Suspiciously small theta scale: ${result.toExponential(2)}`);
  }
  if (result > 1e15) {
    console.warn(`[warp-theta] Suspiciously large theta scale: ${result.toExponential(2)}`);
  }
  
  // Log component contributions
  debugLog('Theta scale components:', {
    A_geo_contribution: A_geo,
    qSpoil_contribution: qSpoil,
    gammaVdB_contribution: gammaVdB,
    duty_contribution: dutyTerm,
    final_product: result
  });

  return result;
}
