import { z } from "zod";
import { starSimFusionBenchmarkReportSchema } from "./starsim-fusion-benchmark-runner";
import { validateStarSimFusionBenchmarkSafeLanguage } from "./starsim-fusion-benchmark-safe-language";

export const starSimFusionBenchmarkArtifactSchema = z
  .object({
    schemaVersion: z.literal("starsim-fusion-benchmark-artifact.v1"),
    artifactId: z.string().min(1),
    createdAt: z.string().datetime(),
    report: starSimFusionBenchmarkReportSchema,
    claimIds: z.array(z.string()).min(1),
    citations: z.array(z.string()).min(1),
    uncertaintyNotes: z.array(z.string()).min(1),
    safeSummary: z.string().min(1),
  })
  .superRefine((artifact, ctx) => {
    const safe = validateStarSimFusionBenchmarkSafeLanguage(artifact.safeSummary);
    if (!safe.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["safeSummary"],
        message: `Forbidden language: ${safe.forbiddenPhrases.join(", ")}`,
      });
    }
    if (artifact.report.qstBoundary.spacetimeCL !== "proxy_only") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["report", "qstBoundary", "spacetimeCL"],
        message: "Benchmark artifacts cannot promote spacetimeCL.",
      });
    }
    if (artifact.report.qstBoundary.mayPromoteToCL4 !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["report", "qstBoundary", "mayPromoteToCL4"],
        message: "Benchmark artifacts cannot promote to CL4.",
      });
    }
  });

export type StarSimFusionBenchmarkArtifact = z.infer<
  typeof starSimFusionBenchmarkArtifactSchema
>;
