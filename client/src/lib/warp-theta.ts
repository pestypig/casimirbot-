
/**
 * Shared theta-scale calculation utility
 * Consolidates physics calculations between WarpVisualizer and WarpBubbleCompare
 */

// Utility functions
const toNum = (x: any): number | undefined => {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
};

const isFin = (x: any): boolean => Number.isFinite(x);

export type DutySource = 'fr' | 'ui';

export type ThetaInputs = {
  gammaGeo?: number;                 // ~26
  qSpoilingFactor?: number;          // ~1
  gammaVanDenBroeck?: number;        // legacy single value
  gammaVanDenBroeck_mass?: number;   // physics chain (used for REAL)
  gammaVanDenBroeck_vis?: number;    // cosmetic chain (used for SHOW)
  dutyEffectiveFR?: number;          // Ford–Roman duty (0..1)
};

/**
 * SCIENTIFIC MODE — pipeline-authoritative θ only.
 * Thin pass-through:
 *  • Prefer p.thetaScale exactly as sent from server/adapter.
 *  • No recomputation from γ_geo, q, γ_VdB, duty.
 *  • Standby shortcut: currentMode === 'standby' → 0.
 */
export type ThetaOptions = { /* retained for signature compatibility; unused */ };

function getPipelineTheta(src: any): number {
  const mode = String(src?.currentMode ?? '').toLowerCase();
  if (mode === 'standby') return 0;
  const t = Number(src?.thetaScale);
  return Number.isFinite(t) ? t : 0;
}

/**
 * θ = γ_geo³ · q · γ_VdB · √(d_FR)
 */
export function computeThetaScale(inp: ThetaInputs, _opt: ThetaOptions = {}): number {
  return getPipelineTheta(inp as any);
}

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
  const gammaGeo = toNum(p?.gammaGeo) ?? toNum(p?.g_y);
  const qSpoil = toNum(p?.qSpoilingFactor) ?? toNum(p?.deltaAOverA);
  const duty = toNum(p?.dutyCycle) ?? undefined;
  
  if (!isFin(gammaGeo) || (gammaGeo as number) <= 0) {
    issues.push(`Invalid gammaGeo: ${gammaGeo} (should be positive finite number)`);
  }
  
  if (!isFin(qSpoil) || (qSpoil as number) <= 0) {
    issues.push(`Invalid qSpoilingFactor: ${qSpoil} (should be positive finite number)`);
  }
  
  if (dutySource === 'ui' && (!isFin(duty) || (duty as number) < 0 || (duty as number) > 1)) {
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
export function resolveThetaScale(p: any, _dutySource: DutySource = 'fr') {
  return getPipelineTheta(p);
}
