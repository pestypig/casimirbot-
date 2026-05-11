import { z } from "zod";
import { starSimAccordionGalacticNullEvaluationSchema } from "./starsim-accordion-galactic-null-model";

export const starSimGalacticDynamicsArtifactSchema = starSimAccordionGalacticNullEvaluationSchema.superRefine(
  (artifact, ctx) => {
    if (artifact.evidence.claimIds.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "claimIds are required" });
    }
    if (artifact.evidence.citations.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "citations are required" });
    }
    if (artifact.evidence.uncertaintyNotes.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "uncertaintyNotes are required" });
    }
    if (artifact.qstBoundary.spacetimeCL !== "proxy_only" || artifact.qstBoundary.mayPromoteToCL4 !== false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "QST boundary must remain proxy_only and non-promotional" });
    }
    if (artifact.qstBoundary.caveat !== "erDensityProxy_is_not_wormhole_density") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "erDensityProxy caveat is required" });
    }
  },
);

export type StarSimGalacticDynamicsArtifact = z.infer<
  typeof starSimGalacticDynamicsArtifactSchema
>;
