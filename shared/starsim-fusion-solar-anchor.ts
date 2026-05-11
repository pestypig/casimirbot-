import { z } from "zod";

export const starSimSolarFusionAnchorSchema = z.object({
  schemaVersion: z.literal("starsim-solar-fusion-anchor.v1"),
  objectId: z.literal("Sun"),
  referenceObservables: z.object({
    age_Gyr: z.number().positive(),
    luminosity_Lsun: z.number().positive(),
    radius_Rsun: z.number().positive(),
    effectiveTemperature_K: z.number().positive(),
    mass_Msun: z.number().positive(),
    surfaceZoverX: z.number().positive().optional(),
    convectionZoneBase_Rsun: z.number().positive().optional(),
    surfaceHeliumY: z.number().positive().optional(),
  }),
  neutrinoTargets: z
    .object({
      pp: z.number().positive().optional(),
      be7: z.number().positive().optional(),
      pep: z.number().positive().optional(),
      b8: z.number().positive().optional(),
      cno: z.number().positive().optional(),
      units: z.literal("cm^-2 s^-1"),
      sourceRef: z.enum(["Borexino", "SSM", "mixed"]),
    })
    .optional(),
  seismicTargets: z
    .object({
      lowDegreeModeRefs: z.array(z.string()).optional(),
      soundSpeedProfileRef: z.string().optional(),
      frequencySeparation_uHz: z.number().positive().optional(),
    })
    .optional(),
  validityDomain: z.object({
    system: z.literal("solar_calibration"),
    constraints: z.array(z.string()).min(1),
  }),
  evidence: z.object({
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    caveats: z.array(z.string()).min(1),
  }),
});

export type StarSimSolarFusionAnchor = z.infer<typeof starSimSolarFusionAnchorSchema>;

export function parseStarSimSolarFusionAnchor(value: unknown): StarSimSolarFusionAnchor {
  return starSimSolarFusionAnchorSchema.parse(value);
}
