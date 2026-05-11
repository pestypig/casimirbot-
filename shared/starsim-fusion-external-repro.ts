import { z } from "zod";

export const starSimFusionExternalReproManifestSchema = z.object({
  schemaVersion: z.literal("starsim-fusion-external-repro-manifest.v1"),
  runId: z.string().min(1),
  createdAt: z.string().datetime(),
  objectId: z.string().min(1),
  profileSource: z.enum([
    "mesa_external_run",
    "mesa_imported_profile",
    "mesa_fixture",
    "external_profile",
    "fixture_only",
  ]),
  mesa: z
    .object({
      mesaVersion: z.string().optional(),
      mesaRevision: z.string().optional(),
      inlistHash: z.string().optional(),
      profileHash: z.string().optional(),
      historyHash: z.string().optional(),
      photosHash: z.string().optional(),
      network: z.string().optional(),
      ratesSource: z.string().optional(),
      eos: z.string().optional(),
      opacity: z.string().optional(),
      atmosphere: z.string().optional(),
      initialMass_Msun: z.number().positive().optional(),
      initialMetallicity_Z: z.number().nonnegative().optional(),
      initialHelium_Y: z.number().nonnegative().optional(),
      mixingLengthAlpha: z.number().positive().optional(),
      diffusionEnabled: z.boolean().optional(),
      overshootPolicy: z.string().optional(),
      age_Gyr: z.number().nonnegative().optional(),
    })
    .optional(),
  gyre: z
    .object({
      gyreVersion: z.string().optional(),
      gyreInputHash: z.string().optional(),
      modeSummaryHash: z.string().optional(),
      adiabatic: z.boolean().optional(),
      nonAdiabatic: z.boolean().optional(),
    })
    .optional(),
  artifacts: z.object({
    profilePath: z.string().optional(),
    historyPath: z.string().optional(),
    gyreSummaryPath: z.string().optional(),
    benchmarkReportPath: z.string().optional(),
  }),
  reproducibilityStatus: z.enum([
    "fixture_only",
    "mesa_imported",
    "mesa_reproduced",
    "mesa_gyre_reproduced",
    "externally_reproduced",
    "failed",
  ]),
  requestedSpacetimeCL: z.string().optional(),
  hSpectralFit: z
    .object({
      role: z.string(),
      mayInferNewH: z.boolean().optional(),
    })
    .optional(),
  claimRole: z
    .enum([
      "stellar_quantum_microphysics_prior",
      "cosmological_structure_prior",
      "not_direct_er_epr_evidence",
      "direct_er_epr_evidence",
    ])
    .optional(),
});

export type StarSimFusionExternalReproManifest = z.infer<
  typeof starSimFusionExternalReproManifestSchema
>;

export function parseStarSimFusionExternalReproManifest(
  value: unknown,
): StarSimFusionExternalReproManifest {
  return starSimFusionExternalReproManifestSchema.parse(value);
}
