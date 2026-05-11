import { readFileSync } from "node:fs";
import { z } from "zod";

export const starSimGyreSummarySchema = z.object({
  schemaVersion: z.literal("starsim-gyre-summary.v1"),
  objectId: z.string().min(1),
  summaryHash: z.string().optional(),
  source: z.enum(["gyre_imported_summary", "gyre_external_run", "fixture_only", "not_available"]),
  largeSeparation_uHz: z.number().positive().optional(),
  smallSeparation_uHz: z.number().positive().optional(),
  modeCount: z.number().int().nonnegative().optional(),
  lowDegreeModesAvailable: z.boolean().optional(),
  soundSpeedProfileAvailable: z.boolean().optional(),
});

export type StarSimGyreSummary = z.infer<typeof starSimGyreSummarySchema>;

export function importStarSimGyreSummary(args: {
  enabled: boolean;
  summaryPath?: string;
  summaryHash?: string;
  requireSummaryHash?: boolean;
}): StarSimGyreSummary {
  if (!args.enabled) {
    return starSimGyreSummarySchema.parse({
      schemaVersion: "starsim-gyre-summary.v1",
      objectId: "Sun",
      source: "not_available",
    });
  }
  if (!args.summaryPath) {
    throw new Error("GYRE summary import requires summaryPath when enabled.");
  }
  const summary = starSimGyreSummarySchema.parse(
    JSON.parse(readFileSync(args.summaryPath, "utf8")),
  );
  const summaryHash = args.summaryHash ?? summary.summaryHash;
  if (args.requireSummaryHash && !summaryHash) {
    throw new Error("Reproduced GYRE summary requires mode summary hash.");
  }
  return { ...summary, summaryHash };
}
