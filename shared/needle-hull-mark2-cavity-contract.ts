import { z } from "zod";
import cavityContractJson from "../configs/needle-hull-mark2-cavity-contract.v1.json";
import {
  simulationParametersSchema,
  type SimulationParameters,
} from "./schema";
import {
  NHM2_FULL_HULL_DIMENSIONS_M,
  NHM2_FULL_HULL_REFERENCE_RADIUS_M,
  NHM2_FULL_HULL_TAU_LC_MS,
  NHM2_FULL_HULL_TAU_LC_NS,
  NHM2_REDUCED_ORDER_REFERENCE as PROMOTED_NHM2_REDUCED_ORDER_REFERENCE,
} from "./warp-promoted-profile";

const nonEmptyStringSchema = z.string().trim().min(1);
const SPEED_OF_LIGHT_M_S = 299_792_458;

export const needleHullMark2CavityStatusSchema = z.enum([
  "draft_smoke_test",
  "geometry_freeze",
]);
export type NeedleHullMark2CavityStatus = z.infer<
  typeof needleHullMark2CavityStatusSchema
>;

export const needleHullMark2ReducedOrderReferenceSchema = z.object({
  radius_m: z.number().positive(),
  tauLC_ms: z.number().positive().optional(),
});
export type NeedleHullMark2ReducedOrderReference = z.infer<
  typeof needleHullMark2ReducedOrderReferenceSchema
>;

export const needleHullMark2FullHullGeometrySchema = z.object({
  Lx_m: z.number().positive(),
  Ly_m: z.number().positive(),
  Lz_m: z.number().positive(),
});
export type NeedleHullMark2FullHullGeometry = z.infer<
  typeof needleHullMark2FullHullGeometrySchema
>;

export const needleHullMark2CavityGeometrySchema = z.object({
  warpFieldType: nonEmptyStringSchema,
  reducedOrderReference: needleHullMark2ReducedOrderReferenceSchema.optional(),
  fullHull: needleHullMark2FullHullGeometrySchema,
  sectorCount: z.number().int().positive(),
  concurrentSectors: z.number().int().positive(),
  gammaGeo: z.number().positive(),
  gammaVanDenBroeck: z.number().positive(),
  gap_nm: z.number().positive(),
  pocketDiameter_um: z.number().positive(),
  sag_nm: z.number().positive(),
  tileWidth_mm: z.number().positive(),
  tileHeight_mm: z.number().positive(),
  topMirrorThickness_um: z.number().positive(),
  bottomMirrorThickness_um: z.number().positive(),
  rimWidth_um: z.number().positive(),
  sectorIndex: z.number().int().nonnegative(),
});
export type NeedleHullMark2CavityGeometry = z.infer<
  typeof needleHullMark2CavityGeometrySchema
>;

export const needleHullMark2CavitySealRingSchema = z.object({
  inset_um: z.number().positive(),
  width_um: z.number().positive(),
});
export type NeedleHullMark2CavitySealRing = z.infer<
  typeof needleHullMark2CavitySealRingSchema
>;

export const needleHullMark2CavityAnchorPostsSchema = z.object({
  count: z.number().int().positive(),
  radius_um: z.number().positive(),
  ringRadius_um: z.number().positive(),
});
export type NeedleHullMark2CavityAnchorPosts = z.infer<
  typeof needleHullMark2CavityAnchorPostsSchema
>;

export const needleHullMark2CavityReleaseHolesSchema = z.object({
  diameter_um: z.number().positive(),
  pitch_um: z.number().positive(),
  rows: z.number().int().positive(),
  columns: z.number().int().positive(),
});
export type NeedleHullMark2CavityReleaseHoles = z.infer<
  typeof needleHullMark2CavityReleaseHolesSchema
>;

export const needleHullMark2CavityPadArraySchema = z.object({
  count: z.number().int().positive(),
  width_um: z.number().positive(),
  height_um: z.number().positive(),
  edgeInset_um: z.number().positive(),
});
export type NeedleHullMark2CavityPadArray = z.infer<
  typeof needleHullMark2CavityPadArraySchema
>;

export const needleHullMark2CavityAlignmentMarksSchema = z.object({
  size_um: z.number().positive(),
  edgeInset_um: z.number().positive(),
});
export type NeedleHullMark2CavityAlignmentMarks = z.infer<
  typeof needleHullMark2CavityAlignmentMarksSchema
>;

export const needleHullMark2CavityWitnessZoneSchema = z.object({
  spacing_um: z.number().positive(),
  centerOffsetFromBottom_um: z.number().positive(),
});
export type NeedleHullMark2CavityWitnessZone = z.infer<
  typeof needleHullMark2CavityWitnessZoneSchema
>;

export const needleHullMark2CavityWitnessCouponSchema = z.object({
  name: nonEmptyStringSchema,
  width_um: z.number().positive(),
  height_um: z.number().positive(),
});
export type NeedleHullMark2CavityWitnessCoupon = z.infer<
  typeof needleHullMark2CavityWitnessCouponSchema
>;

export const needleHullMark2CavityLayoutSchema = z.object({
  tileArea_mm2: z.number().positive(),
  margin_um: z.number().positive(),
  sealRing: needleHullMark2CavitySealRingSchema,
  anchorPosts: needleHullMark2CavityAnchorPostsSchema,
  releaseHoles: needleHullMark2CavityReleaseHolesSchema,
  padArray: needleHullMark2CavityPadArraySchema,
  alignmentMarks: needleHullMark2CavityAlignmentMarksSchema,
  witnessZone: needleHullMark2CavityWitnessZoneSchema,
  witnessCoupons: z.array(needleHullMark2CavityWitnessCouponSchema).min(1),
});
export type NeedleHullMark2CavityLayout = z.infer<
  typeof needleHullMark2CavityLayoutSchema
>;

export const needleHullMark2CavityContractSchema = z.object({
  solutionCategory: z.literal("Needle Hull Mark 2"),
  profileVersion: nonEmptyStringSchema,
  generator_version: nonEmptyStringSchema,
  status: needleHullMark2CavityStatusSchema,
  provenance: z.object({
    promotedProfileAuthority: z.array(nonEmptyStringSchema).min(1),
    engineeringFreezeAssumptions: z.array(nonEmptyStringSchema).min(1),
  }),
  geometry: needleHullMark2CavityGeometrySchema,
  boundary: z.object({
    material: nonEmptyStringSchema,
    model: nonEmptyStringSchema,
    statement: nonEmptyStringSchema,
  }),
  thermal: z.object({
    temperature_K: z.number().positive(),
    stabilityBand_mK: z.number().nonnegative(),
  }),
  loss: z.object({
    qCavity: z.number().positive(),
    qSpoilingFactor: z.number().positive(),
    dutyCycle: z.number().min(0).max(1),
    dutyShip: z.number().min(0).max(1),
  }),
  drive: z.object({
    driveLaw: nonEmptyStringSchema,
    modulationFreq_GHz: z.number().positive(),
  }),
  readout: z.object({
    zeta: z.number().positive(),
    metricT00Source: nonEmptyStringSchema,
  }),
  layout: needleHullMark2CavityLayoutSchema,
});
export type NeedleHullMark2CavityContract = z.infer<
  typeof needleHullMark2CavityContractSchema
>;

export const needleHullMark2CavityViewGeometrySchema = z.object({
  pocketDiameter_um: z.number().positive(),
  sag_nm: z.number().positive(),
  gap_nm: z.number().positive(),
  topMirror_thick_um: z.number().positive(),
  botMirror_thick_um: z.number().positive(),
  alnRim_width_um: z.number().positive(),
  tileWidth_mm: z.number().positive(),
  tileHeight_mm: z.number().positive(),
  modulationFreq_Hz: z.number().positive(),
  diaphragm_thick_um: z.number().positive(),
});
export type NeedleHullMark2CavityViewGeometry = z.infer<
  typeof needleHullMark2CavityViewGeometrySchema
>;

export type NeedleHullMark2CavityViewOverrides = Partial<
  NeedleHullMark2CavityViewGeometry
>;

export const NHM2_CAVITY_CONTRACT =
  needleHullMark2CavityContractSchema.parse(cavityContractJson);

export const resolveNeedleHullMark2ReducedOrderReference = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
): NeedleHullMark2ReducedOrderReference => {
  const reducedOrderReference = contract.geometry.reducedOrderReference;
  if (reducedOrderReference) {
    return reducedOrderReference;
  }

  return needleHullMark2ReducedOrderReferenceSchema.parse(
    PROMOTED_NHM2_REDUCED_ORDER_REFERENCE,
  );
};

export const resolveNeedleHullMark2FullHullGeometry = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
): NeedleHullMark2FullHullGeometry =>
  needleHullMark2FullHullGeometrySchema.parse(contract.geometry.fullHull);

export const resolveNeedleHullMark2HullReferenceRadiusM = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
) => {
  const hull = resolveNeedleHullMark2FullHullGeometry(contract);
  return Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / 2;
};

export const resolveNeedleHullMark2FullHullTauLcMs = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
) => {
  const hull = resolveNeedleHullMark2FullHullGeometry(contract);
  return (
    (Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / SPEED_OF_LIGHT_M_S) * 1e3
  );
};

export const resolveNeedleHullMark2FullHullTauLcNs = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
) => resolveNeedleHullMark2FullHullTauLcMs(contract) * 1e6;

export const NHM2_FULL_HULL_GEOMETRY =
  resolveNeedleHullMark2FullHullGeometry();
export const NHM2_REDUCED_ORDER_REFERENCE =
  resolveNeedleHullMark2ReducedOrderReference();

export const resolveNeedleHullMark2CavityViewGeometry = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
  overrides: NeedleHullMark2CavityViewOverrides = {},
): NeedleHullMark2CavityViewGeometry =>
  needleHullMark2CavityViewGeometrySchema.parse({
    pocketDiameter_um:
      overrides.pocketDiameter_um ?? contract.geometry.pocketDiameter_um,
    sag_nm: overrides.sag_nm ?? contract.geometry.sag_nm,
    gap_nm: overrides.gap_nm ?? contract.geometry.gap_nm,
    topMirror_thick_um:
      overrides.topMirror_thick_um ?? contract.geometry.topMirrorThickness_um,
    botMirror_thick_um:
      overrides.botMirror_thick_um ??
      contract.geometry.bottomMirrorThickness_um,
    alnRim_width_um:
      overrides.alnRim_width_um ?? contract.geometry.rimWidth_um,
    tileWidth_mm: overrides.tileWidth_mm ?? contract.geometry.tileWidth_mm,
    tileHeight_mm: overrides.tileHeight_mm ?? contract.geometry.tileHeight_mm,
    modulationFreq_Hz:
      overrides.modulationFreq_Hz ?? contract.drive.modulationFreq_GHz * 1e9,
    diaphragm_thick_um:
      overrides.diaphragm_thick_um ?? contract.geometry.topMirrorThickness_um,
  });

export const NHM2_CAVITY_VIEW_GEOMETRY =
  resolveNeedleHullMark2CavityViewGeometry(NHM2_CAVITY_CONTRACT);

export const NHM2_SIMULATION_CONTROL_DEFAULTS = {
  tileAreaCm2: NHM2_CAVITY_CONTRACT.layout.tileArea_mm2 / 100,
  hullReferenceRadiusM: resolveNeedleHullMark2HullReferenceRadiusM(
    NHM2_CAVITY_CONTRACT,
  ),
  reducedOrderReferenceRadiusM: NHM2_REDUCED_ORDER_REFERENCE.radius_m,
  gammaGeo: NHM2_CAVITY_CONTRACT.geometry.gammaGeo,
  qFactor: NHM2_CAVITY_CONTRACT.loss.qCavity,
  duty: NHM2_CAVITY_CONTRACT.loss.dutyShip,
  sagDepthNm: NHM2_CAVITY_CONTRACT.geometry.sag_nm,
  temperatureK: NHM2_CAVITY_CONTRACT.thermal.temperature_K,
  strokeAmplitudePm: 50,
  burstTimeUs: 10,
  cycleTimeUs: 1000,
  xiPoints: 25000,
  fullHullTauLCMs: resolveNeedleHullMark2FullHullTauLcMs(
    NHM2_CAVITY_CONTRACT,
  ),
  fullHullTauLCNs: resolveNeedleHullMark2FullHullTauLcNs(
    NHM2_CAVITY_CONTRACT,
  ),
  lightCrossingTimeNs: resolveNeedleHullMark2FullHullTauLcNs(
    NHM2_CAVITY_CONTRACT,
  ),
  xiMin: 0.0001,
  intervals: 100,
  absTol: 0,
  relTol: 0.005,
} as const;

export type NeedleHullMark2SimulationControlDefaults =
  typeof NHM2_SIMULATION_CONTROL_DEFAULTS;

export const buildNeedleHullMark2SimulationParameters = (
  contract: NeedleHullMark2CavityContract = NHM2_CAVITY_CONTRACT,
  controls: NeedleHullMark2SimulationControlDefaults =
    NHM2_SIMULATION_CONTROL_DEFAULTS,
): SimulationParameters =>
  simulationParametersSchema.parse({
    geometry: "bowl",
    gap: contract.geometry.gap_nm,
    radius: contract.geometry.pocketDiameter_um / 2,
    sagDepth: controls.sagDepthNm,
    material: "custom",
    materialModel: "ideal_retarded",
    temperature: controls.temperatureK,
    moduleType: "warp",
    dynamicConfig: {
      modulationFreqGHz: contract.drive.modulationFreq_GHz,
      strokeAmplitudePm: controls.strokeAmplitudePm,
      burstLengthUs: controls.burstTimeUs,
      cycleLengthUs: controls.cycleTimeUs,
      dutyCycle: contract.loss.dutyCycle,
      cavityQ: controls.qFactor,
      sectorCount: contract.geometry.sectorCount,
      sectorDuty: controls.duty,
      pulseFrequencyGHz: contract.drive.modulationFreq_GHz,
      lightCrossingTimeNs: controls.lightCrossingTimeNs,
      shiftAmplitude: controls.strokeAmplitudePm * 1e-12,
      expansionTolerance: 1e-12,
      warpFieldType: contract.geometry.warpFieldType,
      gap_nm: contract.geometry.gap_nm,
    },
    advanced: {
      xiMin: controls.xiMin,
      maxXiPoints: controls.xiPoints,
      intervals: controls.intervals,
      absTol: controls.absTol,
      relTol: controls.relTol,
    },
  });

export const NHM2_SIMULATION_PARAMETERS =
  buildNeedleHullMark2SimulationParameters();

if (
  NHM2_FULL_HULL_GEOMETRY.Lx_m !== NHM2_FULL_HULL_DIMENSIONS_M.Lx_m ||
  NHM2_FULL_HULL_GEOMETRY.Ly_m !== NHM2_FULL_HULL_DIMENSIONS_M.Ly_m ||
  NHM2_FULL_HULL_GEOMETRY.Lz_m !== NHM2_FULL_HULL_DIMENSIONS_M.Lz_m
) {
  throw new Error(
    "NHM2 cavity contract full-hull geometry drifted from promoted profile dimensions.",
  );
}

if (
  Math.abs(
    NHM2_SIMULATION_CONTROL_DEFAULTS.hullReferenceRadiusM -
      NHM2_FULL_HULL_REFERENCE_RADIUS_M,
  ) > 1e-9
) {
  throw new Error("NHM2 full-hull reference radius drifted from promoted profile.");
}

if (
  Math.abs(
    NHM2_SIMULATION_CONTROL_DEFAULTS.fullHullTauLCMs - NHM2_FULL_HULL_TAU_LC_MS,
  ) > 1e-12
) {
  throw new Error("NHM2 full-hull tau_LC drifted from promoted profile.");
}

if (
  Math.abs(
    NHM2_SIMULATION_CONTROL_DEFAULTS.fullHullTauLCNs - NHM2_FULL_HULL_TAU_LC_NS,
  ) > 1e-6
) {
  throw new Error("NHM2 full-hull tau_LC(ns) drifted from promoted profile.");
}
