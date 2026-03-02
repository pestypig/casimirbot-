export const WARP_SOLUTION_CATEGORY = 'Needle Hull Mark 2' as const;
export const PROMOTED_WARP_PROFILE_VERSION = 'NHM2-2026-03-01' as const;

export const PROMOTED_WARP_PROFILE = Object.freeze({
  solutionCategory: WARP_SOLUTION_CATEGORY,
  profileVersion: PROMOTED_WARP_PROFILE_VERSION,
  warpFieldType: 'natario_sdf' as const,
  gammaGeo: 1,
  dutyCycle: 0.12,
  dutyShip: 0.12,
  sectorCount: 80,
  concurrentSectors: 2,
  qSpoilingFactor: 3,
  qCavity: 100_000,
  gammaVanDenBroeck: 500,
  gap_nm: 8,
  shipRadius_m: 2,
  modulationFreq_GHz: 15,
  tauLC_ms: 3.34,
  qi: {
    sampler: 'hann' as const,
    fieldType: 'em' as const,
    tau_s_ms: 0.02,
  },
});
