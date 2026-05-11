import { z } from "zod";
import { validateStarSimSolarReferenceSafeLanguage } from "./starsim-solar-reference-safe-language";

export const starSimSolarReferenceRunArtifactSchema = z
  .object({
    schemaVersion: z.literal("starsim-solar-reference-run-artifact.v1"),
    runId: z.string().min(1),
    planId: z.string().min(1),
    createdAt: z.string().datetime(),
    reproducibilityStatus: z.enum([
      "fixture_only",
      "mesa_imported",
      "mesa_reproduced",
      "mesa_gyre_reproduced",
      "externally_reproduced",
      "failed",
    ]),
    mesaMetadata: z.object({
      mesaVersion: z.string().optional(),
      inlistHash: z.string().optional(),
      profileHash: z.string().optional(),
      historyHash: z.string().optional(),
      network: z.string().optional(),
      ratesSource: z.string().optional(),
      eos: z.string().optional(),
      opacity: z.string().optional(),
      atmosphere: z.string().optional(),
      initialMass_Msun: z.number().positive().optional(),
      initialMetallicity_Z: z.number().nonnegative().optional(),
      initialHelium_Y: z.number().nonnegative().optional(),
      mixingLengthAlpha: z.number().positive().optional(),
      age_Gyr: z.number().nonnegative().optional(),
    }),
    importedProfileRef: z.string().min(1),
    fusionProfileValidationRef: z.string().min(1),
    benchmarkReportRef: z.string().min(1),
    stage2GateReportRef: z.string().min(1),
    closures: z.object({
      luminosityClosureStatus: z.enum(["pass", "warn", "fail", "not_tested"]),
      neutrinoClosureStatus: z.enum(["pass", "warn", "fail", "not_tested"]),
      asteroseismicClosureStatus: z.enum(["pass", "warn", "fail", "not_tested"]),
    }),
    evidence: z.object({
      stage: z.literal("STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1"),
      claimTier: z.enum([
        "fixture_only_solar_reference",
        "solver_imported_solar_reference",
        "solver_reproduced_solar_reference",
      ]),
      claimIds: z.array(z.string()).min(1),
      citations: z.array(z.string()).min(1),
      sourceRoles: z.record(
        z.string(),
        z.enum([
          "supports_model",
          "supports_observational_closure",
          "supports_guardrail",
          "supports_boundary",
        ]),
      ),
      uncertaintyNotes: z.array(z.string()).min(1),
    }),
    qstBoundary: z.object({
      spacetimeCL: z.literal("proxy_only"),
      mayPromoteToCL4: z.literal(false),
      caveats: z.array(z.string()).min(1),
    }),
    safeSummary: z.string().optional(),
  })
  .superRefine((artifact, ctx) => {
    if (artifact.safeSummary) {
      const safe = validateStarSimSolarReferenceSafeLanguage(artifact.safeSummary);
      if (!safe.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["safeSummary"],
          message: `Forbidden language: ${safe.forbiddenPhrases.join(", ")}`,
        });
      }
    }
    if (
      artifact.evidence.claimTier === "solver_reproduced_solar_reference" &&
      (!artifact.mesaMetadata.profileHash || !artifact.mesaMetadata.inlistHash)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mesaMetadata"],
        message: "Solver-reproduced solar references require profileHash and inlistHash.",
      });
    }
  });

export type StarSimSolarReferenceRunArtifact = z.infer<
  typeof starSimSolarReferenceRunArtifactSchema
>;
