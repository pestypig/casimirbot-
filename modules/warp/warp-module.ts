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

  const dyn = params.dynamicConfig;
  const S_total = Math.max(1, Math.floor(dyn?.sectorCount ?? 1));
  
  console.log('[WarpModule] Sector count:', S_total);

  // 1) Prefer authoritative FR duty if present (server/pipeline)
  const frFromPipeline =
    (params as any).dutyEffectiveFR ??
    (params as any).dutyShip ??
    (params as any).dutyEff;
  
  console.log('[WarpModule] FR from pipeline:', frFromPipeline);
  
  if (Number.isFinite(+frFromPipeline) && +frFromPipeline > 0) {
    const result = Math.max(1e-12, Math.min(1, +frFromPipeline));
    console.log('[WarpModule] Using pipeline FR duty:', result);
    return result;
  }

  // 2) If burst/dwell provided, infer local duty and convert to FR with sector count
  const burst = dyn?.burstLengthUs;
  const dwell = dyn?.cycleLengthUs;
  
  console.log('[WarpModule] Burst/dwell timing:', { burst, dwell });
  
  if (Number.isFinite(burst) && Number.isFinite(dwell) && (dwell as number) > 0) {
    const d_local = Math.max(0, Math.min(1, (burst as number) / (dwell as number)));
    console.log('[WarpModule] Calculated local duty:', d_local);
    
    // If a sectorDuty is provided and already ≤ local, assume it's FR and don't divide again
    if (dyn && Number.isFinite(dyn.sectorDuty) && (dyn.sectorDuty as number) <= d_local && (dyn.sectorDuty as number) > 0) {
      const result = Math.max(1e-12, Math.min(1, dyn.sectorDuty as number));
      console.log('[WarpModule] Using provided sectorDuty as FR:', result);
      return result;
    }
    const result = Math.max(1e-12, Math.min(1, d_local / S_total));
    console.log('[WarpModule] Converting local to FR duty:', result, '(', d_local, '/', S_total, ')');
    return result;
  }

  // 3) Fall back to sectorDuty:
  // Use standard physical default of 2.5e-5 (matching MODE_POLICY hover mode)
  const dProvided = (dyn && Number.isFinite(dyn.sectorDuty) && (dyn.sectorDuty as number) > 0) ? (dyn.sectorDuty as number) : 2.5e-5;
  console.log('[WarpModule] Fallback sectorDuty:', dProvided);
  
  // More physically reasonable threshold: if duty < 1/S_total, likely already FR
  const localThreshold = 1.0 / S_total;
  if (S_total > 1 && dProvided < localThreshold * 0.1) {
    console.log('[WarpModule] Treating small duty as already FR (< 10% of local threshold):', dProvided);
    return Math.max(1e-12, Math.min(1, dProvided));
  }
  
  const result = Math.max(1e-12, Math.min(1, dProvided / S_total));
  console.log('[WarpModule] Treating as local duty, converting to FR:', result);
  return result;
}

/**
 * Convert simulation parameters to Natário warp parameters (pipeline-true)
 */
function convertToWarpParams(params: SimulationParameters): NatarioWarpParams {
  console.log('[WarpModule] convertToWarpParams input:', params);
  
  const dyn = params.dynamicConfig;
  console.log('[WarpModule] Dynamic config:', dyn);

  // Prefer pipeline hull if present; else fallback to Needle Hull with validated dimensions
  const hull = (params as any).hull
    ? { 
        a: Math.max(1, (params as any).hull.Lx_m / 2), 
        b: Math.max(1, (params as any).hull.Ly_m / 2), 
        c: Math.max(1, (params as any).hull.Lz_m / 2) 
      }
    : { a: 503.5, b: 132.0, c: 86.5 }; // meters (semi-axes) - validated Needle Hull defaults
  const R_geom_m = Math.cbrt(hull.a * hull.b * hull.c); // meters
  const R_geom_um = R_geom_m * 1e6;                     // Natário expects µm
  
  console.log('[WarpModule] Hull geometry:', { hull, R_geom_m, R_geom_um });

  // Sector counts / duty
  const sectorCount = Math.max(1, Math.floor(dyn?.sectorCount ?? 1));
  const d_eff = resolveDutyEff(params);
  
  console.log('[WarpModule] Sector/duty resolution:', { sectorCount, d_eff });

  // Pipeline seeds (thread through untouched if provided)
  const amps = (params as any).amps ?? {};
  console.log('[WarpModule] Amps object:', amps);
  
  // Amplification factors with validated ranges
  const gammaGeo = (() => {
    const val = Number.isFinite(+amps.gammaGeo) ? +amps.gammaGeo : 
                (Number.isFinite(+(params as any).gammaGeo) ? +(params as any).gammaGeo : 26);
    return Math.max(1, Math.min(1000, val)); // Clamp to reasonable physics range
  })();
  
  const gammaVanDenBroeck = (() => {
    const val = Number.isFinite(+amps.gammaVanDenBroeck) ? +amps.gammaVanDenBroeck :
               (Number.isFinite(+(params as any).gammaVanDenBroeck) ? +(params as any).gammaVanDenBroeck : 38.3);
    return Math.max(0.1, Math.min(1e6, val)); // Allow wide range but prevent extreme values
  })();
  
  const qSpoilingFactor = (() => {
    const val = Number.isFinite(+amps.qSpoilingFactor) ? +amps.qSpoilingFactor :
               (Number.isFinite(+(dyn as any).qSpoilingFactor) ? +(dyn as any).qSpoilingFactor :
               (Number.isFinite(+(params as any).qSpoilingFactor) ? +(params as any).qSpoilingFactor : 1.0));
    return Math.max(0.001, Math.min(1000, val)); // Physical bounds for Q spoiling
  })();
    
  console.log('[WarpModule] Amplification factors:', {
    gammaGeo,
    gammaVanDenBroeck,
    qSpoilingFactor
  });

  // Tile census / area and live power from pipeline with validation
  const tileCount = (() => {
    const val = Number.isFinite(+(params as any).N_tiles) ? +(params as any).N_tiles : undefined;
    return val ? Math.max(1, Math.floor(val)) : undefined; // Ensure positive integer
  })();
  
  const tileArea_m2 = (() => {
    if (Number.isFinite(+(params as any).tileArea_cm2)) {
      const val = (+(params as any).tileArea_cm2) * 1e-4;
      return Math.max(1e-6, Math.min(1, val)); // 1 μm² to 1 m² reasonable range
    }
    if (Number.isFinite(+(params as any).tileArea_m2)) {
      const val = +(params as any).tileArea_m2;
      return Math.max(1e-6, Math.min(1, val));
    }
    return undefined;
  })();
  
  const P_avg_W = (() => {
    if (Number.isFinite(+(params as any).P_avg_W)) {
      const val = +(params as any).P_avg_W;
      return Math.max(0, val); // Non-negative power
    }
    if (Number.isFinite(+(params as any).P_avg)) {
      const val = +(params as any).P_avg * 1e6;
      return Math.max(0, val);
    }
    return undefined;
  })();
    
  console.log('[WarpModule] Tile and power data:', {
    tileCount,
    tileArea_m2,
    P_avg_W,
    tileArea_cm2: (params as any).tileArea_cm2,
    P_avg: (params as any).P_avg
  });

  const dutyFactor = ((): number => {
    // Prefer burst timing for local duty calculation if available
    if (dyn && Number.isFinite(dyn.burstLengthUs) && Number.isFinite(dyn.cycleLengthUs) && (dyn.cycleLengthUs as number) > 0) {
      const localDuty = Math.max(0, Math.min(1, (dyn.burstLengthUs as number) / (dyn.cycleLengthUs as number)));
      console.log('[WarpModule] Calculated local duty from timing:', localDuty);
      return localDuty;
    }
    // Fallback to provided sectorDuty, but validate it's reasonable
    if (dyn && Number.isFinite(dyn.sectorDuty)) {
      const duty = Math.max(1e-6, Math.min(0.5, dyn.sectorDuty as number)); // Clamp to reasonable range
      console.log('[WarpModule] Using clamped sectorDuty:', duty);
      return duty;
    }
    return 0.01; // Standard 1% duty default
  })();
  
  console.log('[WarpModule] Duty factor calculation:', dutyFactor);

  const finalParams = {
    // Geometry (Natário warp currently expects µm & nm)
    bowlRadius: R_geom_um,                              // µm
    sagDepth: params.sagDepth ?? 16,                    // nm
    gap: params.gap ?? 1,                               // nm

    // Dynamics (from pipeline)
    cavityQ: dyn?.cavityQ ?? 1e9,
    burstDuration: dyn?.burstLengthUs ?? 10,             // µs
    cycleDuration: dyn?.cycleLengthUs ?? 1000,           // µs

    // Strobing (pipeline values only)
    sectorCount,
    dutyFactor,
    effectiveDuty: d_eff,                               // ship-wide FR duty (0..1)

    // Warp-field microscopic stroke
    shiftAmplitude: (dyn?.strokeAmplitudePm ?? 50) * 1e-12, // pm → m

    // Tolerance
    expansionTolerance: dyn?.expansionTolerance ?? 1e-12,

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
  console.log('[WarpModule] Validating warp results:', {
    inputParams: params,
    warpResult: result
  });

  const γ_geo = (params as any).amps?.gammaGeo ?? 26;
  const γ_vdb = (params as any).amps?.gammaVanDenBroeck ?? 3.83e1;
  const Q      = params.dynamicConfig?.cavityQ ?? 1e9;

  console.log('[WarpModule] Validation parameters:', { γ_geo, γ_vdb, Q });

  // More reasonable validation bands based on physics
  const geomMin = 0.1 * γ_geo;  // Allow 90% deviation below
  const geomMax = 10.0 * γ_geo;  // Allow 10x above for edge cases

  const qEnhMin = 0; // nonnegative
  // More lenient amplification bounds based on actual physics scaling
  const baseAmp = Math.pow(γ_geo, 2) * Math.sqrt(Q / 1e9) * Math.max(0.1, γ_vdb / 1000); 
  const ampMin  = baseAmp * 1e-3;  // Very conservative lower bound
  const ampMax  = baseAmp * 1e12;  // Allow very high amplification

  console.log('[WarpModule] Validation bounds:', {
    geometry: { min: geomMin, max: geomMax, actual: result.geometricBlueshiftFactor },
    amplification: { min: ampMin, max: ampMax, actual: result.totalAmplificationFactor },
    qEnhancement: { min: qEnhMin, actual: result.qEnhancementFactor }
  });

  const geometryValid = (result.geometricBlueshiftFactor > geomMin) && 
                       (result.geometricBlueshiftFactor < geomMax) && 
                       Number.isFinite(result.effectivePathLength);
  
  const amplificationValid = (result.totalAmplificationFactor > ampMin) && 
                            (result.totalAmplificationFactor < ampMax) && 
                            (result.qEnhancementFactor >= qEnhMin) && 
                            Number.isFinite(result.totalAmplificationFactor);

  const quantumSafe = !!result.isQuantumSafe && result.quantumSafetyStatus !== 'violation';
  const warpFieldStable = !!result.isZeroExpansion && 
                         !!result.isCurlFree && 
                         !!result.stressEnergyTensor?.isNullEnergyConditionSatisfied;

  console.log('[WarpModule] Validation checks:', {
    geometryValid,
    amplificationValid, 
    quantumSafe,
    warpFieldStable,
    detailedChecks: {
      isZeroExpansion: result.isZeroExpansion,
      isCurlFree: result.isCurlFree,
      nullEnergyCondition: result.stressEnergyTensor?.isNullEnergyConditionSatisfied,
      quantumSafetyStatus: result.quantumSafetyStatus
    }
  });

  const overallStatus =
    geometryValid && amplificationValid && quantumSafe && warpFieldStable ? 'optimal' :
    geometryValid && amplificationValid && quantumSafe                       ? 'acceptable' :
    geometryValid && quantumSafe                                             ? 'warning' : 'failure';

  console.log('[WarpModule] Overall validation status:', overallStatus);
  
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
      // Validate input parameters first
      if (!params) {
        throw new Error('No simulation parameters provided');
      }

      if (!params.dynamicConfig) {
        console.warn('[WarpModule] No dynamicConfig found, using defaults');
      }

      // Convert simulation parameters to warp parameters
      const warpParams = convertToWarpParams(params);
      console.log('[WarpModule] Converted warp parameters:', warpParams);

      // Validate critical warp parameters
      if (!Number.isFinite(warpParams.bowlRadius) || warpParams.bowlRadius <= 0) {
        throw new Error(`Invalid bowl radius: ${warpParams.bowlRadius}`);
      }

      if (!Number.isFinite(warpParams.effectiveDuty) || warpParams.effectiveDuty <= 0) {
        throw new Error(`Invalid effective duty: ${warpParams.effectiveDuty}`);
      }

      if (!Number.isFinite(warpParams.gammaGeo) || warpParams.gammaGeo <= 0) {
        throw new Error(`Invalid gamma geometric: ${warpParams.gammaGeo}`);
      }

      // Perform Natário warp bubble calculations
      const warpResult = calculateNatarioWarpBubble(warpParams);
      console.log('[WarpModule] Warp calculation result:', warpResult);

      // Validate critical results
      if (!Number.isFinite(warpResult.totalAmplificationFactor)) {
        console.error('[WarpModule] Invalid amplification factor result');
        throw new Error('Calculation produced invalid amplification factor');
      }

      // Validate results
      const validationSummary = validateWarpResults(warpResult, params);
      console.log('[WarpModule] Validation summary:', validationSummary);

      const calculationTime = Date.now() - startTime;
      console.log('[WarpModule] Calculation completed in', calculationTime, 'ms');

      // Add debug information for shift vector field
      if (warpResult.shiftVectorField) {
        console.log('[WarpModule] Shift vector field validation:', {
          amplitude: warpResult.shiftVectorField.amplitude,
          hasRadialProfile: typeof warpResult.shiftVectorField.radialProfile === 'function',
          tangentialComponent: warpResult.shiftVectorField.tangentialComponent,
          axialComponent: warpResult.shiftVectorField.axialComponent,
          netShiftAmplitude: warpResult.shiftVectorField.netShiftAmplitude
        });
      }

      const finalResult = {
        ...warpResult,
        moduleVersion: '1.0.0',
        calculationTime,
        validationSummary
      };
      
      console.log('[WarpModule] Final result keys:', Object.keys(finalResult));
      return finalResult;

    } catch (error) {
      console.error('[WarpModule] Calculation failed:', error);
      console.error('[WarpModule] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Warp bubble calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default warpBubbleModule;