import { z } from "zod";
import { starSimFusionProfileImportSchema } from "./starsim-fusion-profile-import";
import { starSimFusionProfileValidationSchema } from "./starsim-fusion-profile-validation";
import { validateStarSimFusionSafeLanguage } from "./starsim-fusion-safe-language";

export const starSimFusionProfileArtifactSchema = z
  .object({
    schemaVersion: z.literal("starsim-fusion-profile-artifact.v1"),
    artifactId: z.string().min(1),
    createdAt: z.string().datetime(),
    profile: starSimFusionProfileImportSchema,
    validation: starSimFusionProfileValidationSchema,
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    caveats: z.array(z.string()).min(1),
    uncertaintyNotes: z.array(z.string()).min(1),
    safeSummary: z.string().min(1),
  })
  .superRefine((artifact, ctx) => {
    const language = validateStarSimFusionSafeLanguage(artifact.safeSummary);
    if (!language.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["safeSummary"],
        message: `Forbidden language: ${language.forbiddenPhrases.join(", ")}`,
      });
    }
    if (
      artifact.profile.hSpectralFit?.role === "new_measurement_of_h" ||
      artifact.profile.hSpectralFit?.role === "varying_planck_constant"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["profile", "hSpectralFit", "role"],
        message: "hSpectralFit must remain calibration_only.",
      });
    }
    if (artifact.validation.qstBoundary.spacetimeCL !== "proxy_only") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validation", "qstBoundary", "spacetimeCL"],
        message: "Profile artifacts must remain proxy_only.",
      });
    }
  });

export type StarSimFusionProfileArtifact = z.infer<
  typeof starSimFusionProfileArtifactSchema
>;
