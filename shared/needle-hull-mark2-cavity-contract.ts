import { z } from "zod";
import cavityContractJson from "../configs/needle-hull-mark2-cavity-contract.v1.json";

const nonEmptyStringSchema = z.string().trim().min(1);

export const needleHullMark2CavityStatusSchema = z.enum([
  "draft_smoke_test",
  "geometry_freeze",
]);
export type NeedleHullMark2CavityStatus = z.infer<
  typeof needleHullMark2CavityStatusSchema
>;

export const needleHullMark2CavityGeometrySchema = z.object({
  warpFieldType: nonEmptyStringSchema,
  shipRadius_m: z.number().positive(),
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
      overrides.modulationFreq_Hz ??
      contract.drive.modulationFreq_GHz * 1e9,
    diaphragm_thick_um:
      overrides.diaphragm_thick_um ??
      contract.geometry.topMirrorThickness_um,
  });

export const NHM2_CAVITY_VIEW_GEOMETRY =
  resolveNeedleHullMark2CavityViewGeometry(NHM2_CAVITY_CONTRACT);
