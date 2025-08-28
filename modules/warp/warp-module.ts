/**
 * Warp Bubble Casimir Module
 * Integrates Natário zero-expansion warp bubble calculations with the module system
 */

import type { CasimirModule } from '../core/module-registry.js';
import type { SimulationParameters } from '../../shared/schema.js';
import { calculateNatarioWarpBubble, type NatarioWarpParams, type NatarioWarpResult } from './natario-warp.js';

export interface WarpBubbleResult extends NatarioWarpResult {
  // Module-specific additions
  moduleVersion: string;
  calculationTime: number;
  validationSummary: {
    geometryValid: boolean;
    amplificationValid: boolean;
    quantumSafe: boolean;
    warpFieldStable: boolean;
    overallStatus: 'optimal' | 'acceptable' | 'warning' | 'failure';
  };
}

/**
 * Resolve effective duty from pipeline parameters (no double division)
 */
function resolveDutyEff(params: SimulationParameters): number {
  console.log('[WarpModule] resolveDutyEff input params:', {
    dynamicConfig: params.dynamicConfig,
    dutyEffectiveFR: (params as any).dutyEffectiveFR,
    dutyShip: (params as any).dutyShip,
    dutyEff: (params as any).dutyEff
  });

  const dyn = params.dynamicConfig ?? {};
  const S_total = Math.max(1, Math.floor(dyn.sectorCount ?? 1));
  
  console.log('[WarpModule] Sector count:', S_total);

  // 1) Prefer authoritative FR duty if present (server/pipeline)
  const frFromPipeline =
    (params as any).dutyEffectiveFR ??
    (params as any).dutyShip ??
    (params as any).dutyEff;
  
  console.log('[WarpModule] FR from pipeline:', frFromPipeline);
  
  if (Number.isFinite(+frFromPipeline)) {
    const result = Math.max(0, Math.min(1, +frFromPipeline));
    console.log('[WarpModule] Using pipeline FR duty:', result);
    return result;
  }

  // 2) If burst/dwell provided, infer local duty and convert to FR with sector count
  const burst = dyn.burstLengthUs;
  const dwell = dyn.cycleLengthUs;
  
  console.log('[WarpModule] Burst/dwell timing:', { burst, dwell });
  
  if (Number.isFinite(burst) && Number.isFinite(dwell) && (dwell as number) > 0) {
    const d_local = Math.max(0, Math.min(1, (burst as number) / (dwell as number)));
    console.log('[WarpModule] Calculated local duty:', d_local);
    
    // If a sectorDuty is provided and already ≤ local, assume it's FR and don't divide again
    if (Number.isFinite(dyn.sectorDuty) && (dyn.sectorDuty as number) <= d_local) {
      const result = Math.max(0, Math.min(1, dyn.sectorDuty as number));
      console.log('[WarpModule] Using provided sectorDuty as FR:', result);
      return result;
    }
    const result = Math.max(0, Math.min(1, d_local * (1 / S_total)));
    console.log('[WarpModule] Converting local to FR duty:', result, '(', d_local, '/', S_total, ')');
    return result;
  }

  // 3) Fall back to sectorDuty:
  //    - If very small (e.g., ≤2e-2 with many sectors), treat as FR (already averaged).
  //    - Otherwise treat as local and divide by S_total.
  const dProvided = Number.isFinite(dyn.sectorDuty) ? (dyn.sectorDuty as number) : 0.14;
  console.log('[WarpModule] Fallback sectorDuty:', dProvided);
  
  if (S_total > 1 && dProvided <= 2e-2) {
    console.log('[WarpModule] Treating small duty as already FR:', dProvided);
    return Math.max(0, Math.min(1, dProvided)); // assume FR already
  }
  
  const result = Math.max(0, Math.min(1, dProvided * (1 / S_total)));
  console.log('[WarpModule] Treating as local duty, converting to FR:', result);
  return result; // treat as local
}

/**
 * Convert simulation parameters to Natário warp parameters (pipeline-true)
 */
function convertToWarpParams(params: SimulationParameters): NatarioWarpParams {
  console.log('[WarpModule] convertToWarpParams input:', params);
  
  const dyn = params.dynamicConfig ?? ({} as NonNullable<SimulationParameters["dynamicConfig"]>);
  console.log('[WarpModule] Dynamic config:', dyn);

  // Prefer pipeline hull if present; else fallback to Needle Hull (~1.007 km × 264 m × 173 m overall)
  const hull = (params as any).hull
    ? { a: (params as any).hull.Lx_m / 2, b: (params as any).hull.Ly_m / 2, c: (params as any).hull.Lz_m / 2 }
    : { a: 503.5, b: 132.0, c: 86.5 }; // meters (semi-axes)
  const R_geom_m = Math.cbrt(hull.a * hull.b * hull.c); // meters
  const R_geom_um = R_geom_m * 1e6;                     // Natário expects µm
  
  console.log('[WarpModule] Hull geometry:', { hull, R_geom_m, R_geom_um });

  // Sector counts / duty
  const sectorCount = Math.max(1, Math.floor(dyn.sectorCount ?? 1));
  const d_eff = resolveDutyEff(params);
  
  console.log('[WarpModule] Sector/duty resolution:', { sectorCount, d_eff });

  // Pipeline seeds (thread through untouched if provided)
  const amps = (params as any).amps ?? {};
  console.log('[WarpModule] Amps object:', amps);
  
  const gammaGeo = Number.isFinite(+amps.gammaGeo) ? +amps.gammaGeo : (Number.isFinite(+(params as any).gammaGeo) ? +(params as any).gammaGeo : undefined);
  const gammaVanDenBroeck =
    Number.isFinite(+amps.gammaVanDenBroeck) ? +amps.gammaVanDenBroeck :
    (Number.isFinite(+(params as any).gammaVanDenBroeck) ? +(params as any).gammaVanDenBroeck : undefined);
  const qSpoilingFactor =
    Number.isFinite(+amps.qSpoilingFactor) ? +amps.qSpoilingFactor :
    (Number.isFinite(+(dyn as any).qSpoilingFactor) ? +(dyn as any).qSpoilingFactor :
    (Number.isFinite(+(params as any).qSpoilingFactor) ? +(params as any).qSpoilingFactor : undefined));
    
  console.log('[WarpModule] Amplification factors:', {
    gammaGeo,
    gammaVanDenBroeck,
    qSpoilingFactor
  });

  // Tile census / area and live power from pipeline if available
  const tileCount = Number.isFinite(+(params as any).N_tiles) ? +(params as any).N_tiles : undefined;
  const tileArea_m2 =
    Number.isFinite(+(params as any).tileArea_cm2) ? (+(params as any).tileArea_cm2) * 1e-4 :
    (Number.isFinite(+(params as any).tileArea_m2) ? +(params as any).tileArea_m2 : undefined);
  const P_avg_W =
    Number.isFinite(+(params as any).P_avg_W) ? +(params as any).P_avg_W :
    (Number.isFinite(+(params as any).P_avg) ? +(params as any).P_avg * 1e6 : undefined);
    
  console.log('[WarpModule] Tile and power data:', {
    tileCount,
    tileArea_m2,
    P_avg_W,
    tileArea_cm2: (params as any).tileArea_cm2,
    P_avg: (params as any).P_avg
  });

  const dutyFactor = ((): number => {
    // "Local" duty (burst window) if we can infer it; otherwise keep provided value (do not double-divide)
    if (Number.isFinite(dyn.sectorDuty)) return dyn.sectorDuty as number;
    if (Number.isFinite(dyn.burstLengthUs) && Number.isFinite(dyn.cycleLengthUs) && (dyn.cycleLengthUs as number) > 0) {
      return Math.max(0, Math.min(1, (dyn.burstLengthUs as number) / (dyn.cycleLengthUs as number)));
    }
    return 0.01; // conservative default
  })();
  
  console.log('[WarpModule] Duty factor calculation:', dutyFactor);

  const finalParams = {
    // Geometry (Natário warp currently expects µm & nm)
    bowlRadius: R_geom_um,                              // µm
    sagDepth: params.sagDepth ?? 16,                    // nm
    gap: params.gap ?? 1,                               // nm

    // Dynamics (from pipeline)
    cavityQ: dyn.cavityQ ?? 1e9,
    burstDuration: dyn.burstLengthUs ?? 10,             // µs
    cycleDuration: dyn.cycleLengthUs ?? 1000,           // µs

    // Strobing (pipeline values only)
    sectorCount,
    dutyFactor,
    effectiveDuty: d_eff,                               // ship-wide FR duty (0..1)

    // Warp-field microscopic stroke
    shiftAmplitude: (dyn.strokeAmplitudePm ?? 50) * 1e-12, // pm → m

    // Tolerance
    expansionTolerance: dyn.expansionTolerance ?? 1e-12,

    // --- Pipeline seeds (threaded through) ---
    gammaGeo,
    gammaVanDenBroeck,
    qSpoilingFactor,
    tileCount,
    tileArea_m2,
    P_avg_W,
    referenceQ: 1e9,
    // Optional knobs (left undefined unless you want to enforce targets)
    // powerTarget_W: MODE_POLICY[...]?.P_target_W, // not available here
    // powerTolerance: 0.10,
  };
  
  console.log('[WarpModule] Final warp parameters:', finalParams);
  return finalParams;
}

/**
 * Validate warp bubble calculation results using pipeline inputs (not fixed "paper" bands)
 */
function validateWarpResults(result: NatarioWarpResult, params: SimulationParameters): WarpBubbleResult['validationSummary'] {
  const γ_geo = (params as any).amps?.gammaGeo ?? 26;
  const γ_vdb = (params as any).amps?.gammaVanDenBroeck ?? 3.83e1;
  const Q      = params.dynamicConfig?.cavityQ ?? 1e9;

  // "Sane" bands scale with inputs
  const geomMin = 0.5 * γ_geo;
  const geomMax = 2.0 * γ_geo;

  const qEnhMin = 0; // nonnegative
  const ampMin  = Math.pow(γ_geo, 3) * Math.sqrt(Q / 1e9) * Math.max(1, γ_vdb) * 1e-6; // allow very small d_eff
  const ampMax  = ampMin * 1e9; // prevent NaN/Inf explosions

  const geometryValid = (result.geometricBlueshiftFactor > geomMin) && (result.geometricBlueshiftFactor < geomMax) && Number.isFinite(result.effectivePathLength);
  const amplificationValid = (result.totalAmplificationFactor > ampMin) && (result.totalAmplificationFactor < ampMax) && (result.qEnhancementFactor >= qEnhMin) && Number.isFinite(result.totalAmplificationFactor);

  const quantumSafe = !!result.isQuantumSafe && result.quantumSafetyStatus !== 'violation';
  const warpFieldStable = !!result.isZeroExpansion && !!result.isCurlFree && !!result.stressEnergyTensor?.isNullEnergyConditionSatisfied;

  const overallStatus =
    geometryValid && amplificationValid && quantumSafe && warpFieldStable ? 'optimal' :
    geometryValid && amplificationValid && quantumSafe                       ? 'acceptable' :
    geometryValid && quantumSafe                                             ? 'warning' : 'failure';

  return { geometryValid, amplificationValid, quantumSafe, warpFieldStable, overallStatus };
}

/**
 * Warp Bubble Module Definition
 */
export const warpBubbleModule: CasimirModule = {
  name: 'warp',
  version: '1.0.0',
  description: 'Natário zero-expansion warp bubble with sector-strobed Casimir lattice',
  dependencies: ['static', 'dynamic'], // Requires both static and dynamic calculations

  async initialize(): Promise<boolean> {
    // Validate physics constants and dependencies
    console.log('Initializing Warp Bubble module...');
    return true;
  },

  async calculate(params: SimulationParameters): Promise<WarpBubbleResult> {
    const startTime = Date.now();
    console.log('[WarpModule] Starting calculation with params:', params);

    try {
      // Convert simulation parameters to warp parameters
      const warpParams = convertToWarpParams(params);
      console.log('[WarpModule] Converted warp parameters:', warpParams);

      // Perform Natário warp bubble calculations
      const warpResult = calculateNatarioWarpBubble(warpParams);
      console.log('[WarpModule] Warp calculation result:', warpResult);

      // Validate results
      const validationSummary = validateWarpResults(warpResult, params);
      console.log('[WarpModule] Validation summary:', validationSummary);

      const calculationTime = Date.now() - startTime;
      console.log('[WarpModule] Calculation completed in', calculationTime, 'ms');

      const finalResult = {
        ...warpResult,
        moduleVersion: '1.0.0',
        calculationTime,
        validationSummary
      };
      
      console.log('[WarpModule] Final result:', finalResult);
      return finalResult;

    } catch (error) {
      console.error('[WarpModule] Calculation failed:', error);
      throw new Error(`Warp bubble calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default warpBubbleModule;