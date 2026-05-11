import { z } from "zod";
import {
  starSimFusionMicrophysicsEvaluationSchema,
  starSimFusionMicrophysicsInputSchema,
} from "./starsim-fusion-microphysics";

export const starSimFusionReproducibilityStatusSchema = z.enum([
  "fixture_only",
  "reduced_order_simulated",
  "mesa_imported",
  "externally_reproduced",
]);

export const starSimFusionArtifactSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    artifactId: z.string().min(1),
    createdAt: z.string().datetime(),
    input: starSimFusionMicrophysicsInputSchema,
    evaluation: starSimFusionMicrophysicsEvaluationSchema,
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    caveats: z.array(z.string()).min(1),
    evidence: z
      .object({
        claimIds: z.array(z.string()).min(1),
        citations: z.array(z.string()).min(1),
        sourceRoles: z.record(z.string(), z.string()),
        uncertaintyNotes: z.array(z.string()).min(1),
        validityDomains: z.record(
          z.string(),
          z.object({
            system: z.string().min(1),
            constraints: z.array(z.string()).min(1),
          }),
        ),
      })
      .optional(),
    reproducibilityStatus: starSimFusionReproducibilityStatusSchema,
  })
  .superRefine((artifact, ctx) => {
    if (artifact.input.qstUse.role === "direct_er_epr_evidence") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["input", "qstUse", "role"],
        message: "StarSim fusion artifacts cannot claim direct ER=EPR evidence.",
      });
    }
    if (artifact.evaluation.qstPrior.spacetimeCL !== "proxy_only") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evaluation", "qstPrior", "spacetimeCL"],
        message: "StarSim fusion artifacts must remain proxy_only.",
      });
    }
    if (artifact.evaluation.qstPrior.mayPromoteToCL4 !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evaluation", "qstPrior", "mayPromoteToCL4"],
        message: "StarSim fusion artifacts cannot promote to CL4.",
      });
    }
    if (artifact.evidence) {
      if (artifact.evidence.claimIds.length !== artifact.claimIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["evidence", "claimIds"],
          message: "Artifact evidence claimIds must mirror top-level claimIds.",
        });
      }
      if (artifact.evidence.citations.length !== artifact.citations.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["evidence", "citations"],
          message: "Artifact evidence citations must mirror top-level citations.",
        });
      }
    }
  });

export type StarSimFusionArtifact = z.infer<typeof starSimFusionArtifactSchema>;
