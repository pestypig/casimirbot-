import { z } from "zod";
import type { StarSimFusionBenchmarkReport } from "./starsim-fusion-benchmark-runner";

export const STARSIM_FUSION_BENCHMARK_FORBIDDEN_LANGUAGE = [
  "proves ER=EPR",
  "direct ER=EPR evidence",
  "wormhole density",
  "wormhole inventory",
  "fusion proves spacetime entanglement",
  "Needle Hull evidence",
  "propulsion evidence",
  "stress-energy source",
  "CL4 support",
  "new Planck constant",
  "derived Planck constant",
] as const;

export const starSimFusionBenchmarkSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export function validateStarSimFusionBenchmarkSafeLanguage(text: string) {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = STARSIM_FUSION_BENCHMARK_FORBIDDEN_LANGUAGE.filter(
    (phrase) => {
      const lower = phrase.toLowerCase();
      if (lower === "direct er=epr evidence") {
        return (
          normalized.includes(lower) &&
          !normalized.includes("not direct er=epr evidence")
        );
      }
      return normalized.includes(lower);
    },
  );
  return starSimFusionBenchmarkSafeLanguageValidationSchema.parse({
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  });
}

export function renderStarSimFusionBenchmarkReport(report: StarSimFusionBenchmarkReport) {
  const lines = [
    `Benchmark verdict: ${report.aggregate.strongestVerdict}`,
    `Profile count: ${report.aggregate.profileCount}`,
    `Closure summary: passed=${report.aggregate.passedClosureCount}; failed=${report.aggregate.failedClosureCount}; warnings=${report.aggregate.warningCount}`,
    `Uncertainty summary: coverage=${report.aggregate.uncertaintyCoverageRate ?? 0}`,
    `Blockers: ${report.blockers.map((blocker) => `${blocker.blockerId}:${blocker.objectId ?? "batch"}`).join(", ") || "none"}`,
    `Claim IDs: ${report.evidence.claimIds.join(", ")}`,
    `Citations: ${report.evidence.citations.join(", ")}`,
    `Source roles: ${Object.entries(report.evidence.sourceRoles).map(([claimId, role]) => `${claimId}:${role}`).join(", ")}`,
    `Uncertainty notes: ${report.evidence.uncertaintyNotes.join(" | ")}`,
    `QST boundary: ${report.qstBoundary.spacetimeCL}; mayPromoteToCL4=${report.qstBoundary.mayPromoteToCL4}`,
    "Allowed claim: benchmark support for a proxy-only astrophysical prior; not direct ER=EPR evidence; requires external reproduction for stronger status.",
    `Caveats: ${report.qstBoundary.caveats.join(" | ")}`,
  ];
  const text = lines.join("\n");
  const validation = validateStarSimFusionBenchmarkSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(`StarSim fusion benchmark language failed: ${validation.forbiddenPhrases.join(", ")}`);
  }
  return text;
}
