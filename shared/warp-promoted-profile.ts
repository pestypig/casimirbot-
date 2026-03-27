export const WARP_SOLUTION_CATEGORY = 'Needle Hull Mark 2' as const;
export const PROMOTED_WARP_PROFILE_VERSION = 'NHM2-2026-03-01' as const;
const SPEED_OF_LIGHT_M_S = 299_792_458;

export const NHM2_FULL_HULL_DIMENSIONS_M = Object.freeze({
  Lx_m: 1007,
  Ly_m: 264,
  Lz_m: 173,
});

export const NHM2_FULL_HULL_SEMI_AXES_M = Object.freeze({
  a_m: NHM2_FULL_HULL_DIMENSIONS_M.Lx_m / 2,
  b_m: NHM2_FULL_HULL_DIMENSIONS_M.Ly_m / 2,
  c_m: NHM2_FULL_HULL_DIMENSIONS_M.Lz_m / 2,
});

export const NHM2_FULL_HULL_REFERENCE_RADIUS_M = Math.max(
  NHM2_FULL_HULL_SEMI_AXES_M.a_m,
  NHM2_FULL_HULL_SEMI_AXES_M.b_m,
  NHM2_FULL_HULL_SEMI_AXES_M.c_m,
);

export const NHM2_FULL_HULL_TAU_LC_MS =
  (Math.max(
    NHM2_FULL_HULL_DIMENSIONS_M.Lx_m,
    NHM2_FULL_HULL_DIMENSIONS_M.Ly_m,
    NHM2_FULL_HULL_DIMENSIONS_M.Lz_m,
  ) /
    SPEED_OF_LIGHT_M_S) *
  1e3;

export const NHM2_FULL_HULL_TAU_LC_NS = NHM2_FULL_HULL_TAU_LC_MS * 1e6;

export const NHM2_REDUCED_ORDER_REFERENCE = Object.freeze({
  radius_m: 2,
  tauLC_ms: 3.34,
});

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
  fullHull: Object.freeze({
    ...NHM2_FULL_HULL_DIMENSIONS_M,
    ...NHM2_FULL_HULL_SEMI_AXES_M,
    referenceRadius_m: NHM2_FULL_HULL_REFERENCE_RADIUS_M,
    tauLC_ms: NHM2_FULL_HULL_TAU_LC_MS,
  }),
  reducedOrderReference: NHM2_REDUCED_ORDER_REFERENCE,
  modulationFreq_GHz: 15,
  tauLC_ms: NHM2_REDUCED_ORDER_REFERENCE.tauLC_ms,
  qi: {
    sampler: 'hann' as const,
    fieldType: 'em' as const,
    tau_s_ms: 0.02,
  },
});
