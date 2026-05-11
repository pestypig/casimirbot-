import { z } from "zod";
import { validateStarSimSolarMesaReproSafeLanguage } from "./starsim-solar-mesa-repro-safe-language";

export const starSimSolarMesaReproArtifactSchema = z
  .object({
    schemaVersion: z.literal("starsim-solar-mesa-repro-artifact.v1"),
    runId: z.string().min(1),
    createdAt: z.string().datetime(),
    runtime: z.object({
      runtimeKind: z.enum(["local", "docker", "wsl"]),
      mesaCommand: z.string().optional(),
      mesaVersion: z.string().optional(),
      mesaRevision: z.string().optional(),
      dockerImage: z.string().optional(),
      dockerImageDigest: z.string().optional(),
      wslDistro: z.string().optional(),
      exitCode: z.number().int(),
      runLogPath: z.string().min(1),
      runLogHash: z.string().min(1),
    }),
    inputs: z.object({
      inlistProjectPath: z.string().min(1),
      inlistProjectHash: z.string().min(1),
      inlistSolarPath: z.string().optional(),
      inlistSolarHash: z.string().optional(),
      network: z.string().optional(),
      ratesSource: z.string().optional(),
      eos: z.string().optional(),
      opacity: z.string().optional(),
      atmosphere: z.string().optional(),
    }),
    outputs: z.object({
      profilePath: z.string().min(1),
      profileHash: z.string().min(1),
      historyPath: z.string().optional(),
      historyHash: z.string().optional(),
      photosPath: z.string().optional(),
      photosHash: z.string().optional(),
      gyreSummaryPath: z.string().optional(),
      gyreSummaryHash: z.string().optional(),
    }),
    parsed: z.object({
      profileImportRef: z.string().min(1),
      profileValidationRef: z.string().min(1),
      benchmarkReportRef: z.string().min(1),
      stage2GateReportRef: z.string().min(1),
    }),
    evidence: z.object({
      stage: z.literal("STARSIM_SOLAR_MESA_DOCKER_REPRO_V1"),
      claimTier: z.enum([
        "mesa_imported_solar_reference",
        "mesa_reproduced_solar_reference",
        "externally_reproduced_solar_reference",
      ]),
      claimIds: z.array(z.string()).min(1),
      citations: z.array(z.string()).min(1),
      uncertaintyNotes: z.array(z.string()).min(1),
      caveats: z.array(z.string()).min(1),
    }),
    qstBoundary: z.object({
      spacetimeCL: z.literal("proxy_only"),
      mayPromoteToCL4: z.literal(false),
      caveats: z.array(z.string()).min(1),
    }),
    safeSummary: z.string().optional(),
  })
  .superRefine((artifact, ctx) => {
    if (
      artifact.evidence.claimTier !== "mesa_imported_solar_reference" &&
      (!artifact.inputs.inlistProjectHash ||
        !artifact.outputs.profileHash ||
        !artifact.outputs.historyHash ||
        !artifact.runtime.runLogHash)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence", "claimTier"],
        message: "Reproduced artifacts require inlist, profile, history, and run-log hashes.",
      });
    }
    if (artifact.safeSummary) {
      const safe = validateStarSimSolarMesaReproSafeLanguage(artifact.safeSummary);
      if (!safe.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["safeSummary"],
          message: `Forbidden language: ${safe.forbiddenPhrases.join(", ")}`,
        });
      }
    }
  });

export type StarSimSolarMesaReproArtifact = z.infer<
  typeof starSimSolarMesaReproArtifactSchema
>;
