import { z } from "zod";
import { starSimFusionStage2GateArtifactSchema } from "./starsim-fusion-stage2-gate";
import { validateStarSimFusionStage2GateSafeLanguage } from "./starsim-fusion-stage2-gate-safe-language";

export const starSimFusionStage2GateReportArtifactSchema = z
  .object({
    schemaVersion: z.literal("starsim-fusion-stage2-gate-report-artifact.v1"),
    artifactId: z.string().min(1),
    createdAt: z.string().datetime(),
    gate: starSimFusionStage2GateArtifactSchema,
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    uncertaintyNotes: z.array(z.string()).min(1),
    safeSummary: z.string().min(1),
  })
  .superRefine((artifact, ctx) => {
    const safe = validateStarSimFusionStage2GateSafeLanguage(artifact.safeSummary);
    if (!safe.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["safeSummary"],
        message: `Forbidden language: ${safe.forbiddenPhrases.join(", ")}`,
      });
    }
    if (artifact.gate.qstBoundary.spacetimeCL !== "proxy_only") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gate", "qstBoundary", "spacetimeCL"],
        message: "Stage 2 gate artifacts cannot promote spacetimeCL.",
      });
    }
    if (artifact.gate.qstBoundary.mayPromoteToCL4 !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gate", "qstBoundary", "mayPromoteToCL4"],
        message: "Stage 2 gate artifacts cannot promote to CL4.",
      });
    }
  });

export type StarSimFusionStage2GateReportArtifact = z.infer<
  typeof starSimFusionStage2GateReportArtifactSchema
>;
