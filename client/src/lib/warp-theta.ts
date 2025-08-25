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
  // Prefer direct scalar if upstream provided it
  if (Number.isFinite(p?.thetaScale)) return Number(p.thetaScale);

  const gammaGeo = Number(p?.gammaGeo ?? p?.g_y ?? 26);
  const qSpoil   = Number(p?.qSpoilingFactor ?? p?.deltaAOverA ?? 1);
  const gammaVdB = Number(p?.gammaVdB ?? p?.gammaVanDenBroeck ?? 0);

  // Duty resolution based on source preference
  let duty = Number(p?.dutyCycle ?? 0.14);            // UI duty (visible) - fallback
  
  if (dutySource === 'fr') {
    // FR source: prefer FR-effective values, then lightCrossing, finally UI duty
    if (Number.isFinite(p?.dutyEffectiveFR)) {
      duty = Number(p.dutyEffectiveFR);
    } else if (Number.isFinite(p?.dutyEffective_FR)) {
      duty = Number(p.dutyEffective_FR);
    } else if (p?.lightCrossing && Number.isFinite(p.lightCrossing.burst_ms) &&
               Number.isFinite(p.lightCrossing.dwell_ms) && p.lightCrossing.dwell_ms > 0) {
      // For WarpBubbleCompare: divide by sectors for per-sector duty
      const sectors = Math.max(1, (p.sectorCount ?? p.sectors ?? 1));
      duty = p.lightCrossing.burst_ms / p.lightCrossing.dwell_ms / sectors;
    }
    // Clamp to valid duty cycle range
    duty = Math.max(0, Math.min(1, duty));
  }
  // For 'ui' source, we already have the UI duty from dutyCycle fallback

  // IMPORTANT: use total sectors for averaging, not concurrent strobing
  const sectors = Math.max(
    1,
    Number(
      p?.sectorCount ??
      p?.sectors ??                   // fallback
      p?.sectorStrobing ??            // last resort (viz)
      p?.lightCrossing?.sectorCount ??
      400
    )
  );
  
  const viewAvg  = (p?.viewAvg ?? true) ? 1 : 0;     // if you ever allow per-view toggles
  const A_geo    = Math.pow(Math.max(1, gammaGeo), 3);
  const dutyTerm = viewAvg ? Math.max(1e-12, duty / sectors) : 1;
  const result = A_geo * Math.max(1e-12, qSpoil) * Math.max(1, gammaVdB) * dutyTerm;
  
  // Debug: Track exact thetaScale calculation (can be disabled in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${dutySource.toUpperCase()}] thetaScale=` + result.toExponential(2) + 
      ` (γGeo=${gammaGeo}, qSpoil=${qSpoil}, γVdB=${gammaVdB.toExponential(2)}, duty=${duty}, sectors=${sectors})`);
  }
  
  return result;
}