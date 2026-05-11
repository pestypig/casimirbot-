import { z } from "zod";
import type { StarSimFusionStage2GateArtifact } from "./starsim-fusion-stage2-gate";

export const STARSIM_FUSION_STAGE2_GATE_FORBIDDEN_LANGUAGE = [
  "certified Stage 2",
  "proves stellar fusion model",
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

export const starSimFusionStage2GateSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export function validateStarSimFusionStage2GateSafeLanguage(text: string) {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = STARSIM_FUSION_STAGE2_GATE_FORBIDDEN_LANGUAGE.filter(
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
  return starSimFusionStage2GateSafeLanguageValidationSchema.parse({
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  });
}

export function renderStarSimFusionStage2GateReport(
  artifact: StarSimFusionStage2GateArtifact,
) {
  const lines = [
    `Gate verdict: ${artifact.verdict}`,
    `External reproduction status: ${artifact.externalReproManifest.reproducibilityStatus}`,
    `MESA metadata: profileHash=${artifact.externalReproManifest.mesa?.profileHash ? "present" : "missing"}; inlistHash=${artifact.externalReproManifest.mesa?.inlistHash ? "present" : "missing"}; network=${artifact.externalReproManifest.mesa?.network ?? "missing"}; rates=${artifact.externalReproManifest.mesa?.ratesSource ?? "missing"}`,
    `Benchmark summary: verdict=${artifact.benchmarkReport.aggregate.strongestVerdict}; profiles=${artifact.benchmarkReport.aggregate.profileCount}; failedClosure=${artifact.benchmarkReport.aggregate.failedClosureCount}; uncertaintyCoverage=${artifact.benchmarkReport.aggregate.uncertaintyCoverageRate ?? 0}`,
    `Solar anchor: ${artifact.solarAnchor ? "present" : "not_tested"}`,
    `Neutrino closure: ${artifact.neutrinoClosure?.status ?? "not_tested"}`,
    `Asteroseismic closure: ${artifact.asteroseismicClosure?.status ?? "not_tested"}`,
    `Blockers: ${artifact.blockers.map((blocker) => blocker.blockerId).join(", ") || "none"}`,
    `Claim IDs: ${artifact.evidence.claimIds.join(", ")}`,
    `Citations: ${artifact.evidence.citations.join(", ")}`,
    `Source roles: ${Object.entries(artifact.evidence.sourceRoles).map(([claimId, role]) => `${claimId}:${role}`).join(", ")}`,
    `Uncertainty notes: ${artifact.evidence.uncertaintyNotes.join(" | ")}`,
    `QST boundary: ${artifact.qstBoundary.spacetimeCL}; mayPromoteToCL4=${artifact.qstBoundary.mayPromoteToCL4}`,
    "Allowed claim: Stage 2 gate ready for review when evidence passes; proxy-only astrophysical prior; not direct ER=EPR evidence; requires independent reproduction.",
    `Caveats: ${artifact.qstBoundary.caveats.join(" | ")}`,
  ];
  const text = lines.join("\n");
  const validation = validateStarSimFusionStage2GateSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(
      `StarSim fusion Stage 2 gate language failed: ${validation.forbiddenPhrases.join(", ")}`,
    );
  }
  return text;
}
