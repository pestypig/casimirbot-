import { z } from "zod";
import type { StarSimSolarReferenceRunArtifact } from "./starsim-solar-reference-artifact";

export const STARSIM_SOLAR_REFERENCE_FORBIDDEN_LANGUAGE = [
  "certified Stage 2",
  "proves solar model",
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
  "fixture reproduced externally",
] as const;

export const starSimSolarReferenceSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export function validateStarSimSolarReferenceSafeLanguage(text: string) {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = STARSIM_SOLAR_REFERENCE_FORBIDDEN_LANGUAGE.filter(
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
  return starSimSolarReferenceSafeLanguageValidationSchema.parse({
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  });
}

export function renderStarSimSolarReferenceRun(artifact: StarSimSolarReferenceRunArtifact) {
  const lines = [
    `Solar reference run: ${artifact.runId}`,
    `Reproducibility status: ${artifact.reproducibilityStatus}`,
    `Claim tier: ${artifact.evidence.claimTier}`,
    `MESA metadata: profileHash=${artifact.mesaMetadata.profileHash ? "present" : "missing"}; inlistHash=${artifact.mesaMetadata.inlistHash ? "present" : "missing"}; network=${artifact.mesaMetadata.network ?? "missing"}; rates=${artifact.mesaMetadata.ratesSource ?? "missing"}`,
    `Profile validation: ${artifact.fusionProfileValidationRef}`,
    `Benchmark report: ${artifact.benchmarkReportRef}`,
    `Stage 2 gate report: ${artifact.stage2GateReportRef}`,
    `Closures: luminosity=${artifact.closures.luminosityClosureStatus}; neutrino=${artifact.closures.neutrinoClosureStatus}; asteroseismic=${artifact.closures.asteroseismicClosureStatus}`,
    `Claim IDs: ${artifact.evidence.claimIds.join(", ")}`,
    `Citations: ${artifact.evidence.citations.join(", ")}`,
    `Source roles: ${Object.entries(artifact.evidence.sourceRoles).map(([claimId, role]) => `${claimId}:${role}`).join(", ")}`,
    `Uncertainty notes: ${artifact.evidence.uncertaintyNotes.join(" | ")}`,
    `QST boundary: ${artifact.qstBoundary.spacetimeCL}; mayPromoteToCL4=${artifact.qstBoundary.mayPromoteToCL4}`,
    "Allowed claim: solar reference run for a proxy-only stellar microphysics prior; not direct ER=EPR evidence; requires independent reproduction for stronger status.",
    `Caveats: ${artifact.qstBoundary.caveats.join(" | ")}`,
  ];
  const text = lines.join("\n");
  const validation = validateStarSimSolarReferenceSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(
      `StarSim solar reference language failed: ${validation.forbiddenPhrases.join(", ")}`,
    );
  }
  return text;
}
