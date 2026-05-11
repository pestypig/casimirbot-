import { z } from "zod";
import type { StarSimSolarMesaReproArtifact } from "./starsim-solar-mesa-repro-artifact";

export const STARSIM_SOLAR_MESA_REPRO_FORBIDDEN_LANGUAGE = [
  "fixture reproduced externally",
  "certified Stage 2",
  "proves ER=EPR",
  "direct ER=EPR evidence",
  "wormhole density",
  "wormhole inventory",
  "Needle Hull evidence",
  "propulsion evidence",
  "stress-energy source",
  "CL4 support",
  "new Planck constant",
  "derived Planck constant",
] as const;

export const starSimSolarMesaReproSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export function validateStarSimSolarMesaReproSafeLanguage(text: string) {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = STARSIM_SOLAR_MESA_REPRO_FORBIDDEN_LANGUAGE.filter(
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
  return starSimSolarMesaReproSafeLanguageValidationSchema.parse({
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  });
}

export function renderStarSimSolarMesaReproArtifact(artifact: StarSimSolarMesaReproArtifact) {
  const lines = [
    `Solar MESA reproduction run: ${artifact.runId}`,
    `Runtime: ${artifact.runtime.runtimeKind}; exitCode=${artifact.runtime.exitCode}`,
    `Runtime image: ${artifact.runtime.dockerImage ?? "n/a"}; digest=${artifact.runtime.dockerImageDigest ?? "n/a"}`,
    `Inputs: inlistProjectHash=${artifact.inputs.inlistProjectHash}; inlistSolarHash=${artifact.inputs.inlistSolarHash ?? "n/a"}`,
    `Outputs: profileHash=${artifact.outputs.profileHash}; historyHash=${artifact.outputs.historyHash ?? "n/a"}; runLogHash=${artifact.runtime.runLogHash}`,
    `Parsed refs: profile=${artifact.parsed.profileImportRef}; validation=${artifact.parsed.profileValidationRef}; benchmark=${artifact.parsed.benchmarkReportRef}; gate=${artifact.parsed.stage2GateReportRef}`,
    `Claim tier: ${artifact.evidence.claimTier}`,
    `Claim IDs: ${artifact.evidence.claimIds.join(", ")}`,
    `Citations: ${artifact.evidence.citations.join(", ")}`,
    `Uncertainty notes: ${artifact.evidence.uncertaintyNotes.join(" | ")}`,
    `Caveats: ${artifact.evidence.caveats.join(" | ")}`,
    `QST boundary: ${artifact.qstBoundary.spacetimeCL}; mayPromoteToCL4=${artifact.qstBoundary.mayPromoteToCL4}`,
    "Allowed claim: MESA-imported or MESA-reproduced solar reference evidence for a proxy-only stellar microphysics prior; not direct ER=EPR evidence.",
  ];
  const text = lines.join("\n");
  const validation = validateStarSimSolarMesaReproSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(
      `StarSim solar MESA repro language failed: ${validation.forbiddenPhrases.join(", ")}`,
    );
  }
  return text;
}
