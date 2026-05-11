import { z } from "zod";
import type { StarSimAccordionGalacticNullEvaluation } from "./starsim-accordion-galactic-null-model";

export const STARSIM_GALACTIC_DYNAMICS_FORBIDDEN_LANGUAGE = [
  "stellar cores are wormholes",
  "star positions prove ER=EPR",
  "fusion proves ER=EPR",
  "fusion proves spacetime entanglement",
  "galaxy rotation proves wormholes",
  "wormhole density",
  "wormhole inventory",
  "Needle Hull evidence",
  "propulsion evidence",
  "stress-energy source",
  "CL4 support",
  "cosmic expansion inside stellar cores",
  "hydrostatic equilibrium explains galactic rotation",
] as const;

export const starSimGalacticDynamicsSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export function validateStarSimGalacticDynamicsSafeLanguage(text: string) {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = STARSIM_GALACTIC_DYNAMICS_FORBIDDEN_LANGUAGE.filter((phrase) => {
    const lower = phrase.toLowerCase();
    if (lower === "wormhole density") {
      return normalized.includes(lower) && !normalized.includes("not wormhole density");
    }
    if (lower.includes("direct er=epr")) {
      return normalized.includes(lower) && !normalized.includes("not direct er=epr");
    }
    return normalized.includes(lower);
  });
  return starSimGalacticDynamicsSafeLanguageValidationSchema.parse({
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  });
}

export function renderStarSimGalacticDynamicsReport(
  evaluation: StarSimAccordionGalacticNullEvaluation,
): string {
  const controlSummary = evaluation.galacticDynamics.controls
    .map((control) => `${control.model}:rms=${control.summary.rmsResidual_km_s ?? "not_tested"}:${control.summary.fitQuality}`)
    .join(", ") || "none";
  const lines = [
    `Stage: ${evaluation.evidence.stage}`,
    `Claim tier: ${evaluation.evidence.claimTier}`,
    `Run ID: ${evaluation.runId}`,
    `Accordion expansion role: ${evaluation.accordionContext.expansionRole}`,
    `Population nodes: ${evaluation.starPopulation.populationSummary.nodeCount}`,
    `Fusion channels: ${JSON.stringify(evaluation.starPopulation.populationSummary.fusionChannelHistogram)}`,
    `Galactic controls: ${controlSummary}`,
    `Preferred interpretation: ${evaluation.galacticDynamics.preferredInterpretation}; reason=${evaluation.galacticDynamics.reason}`,
    `QST boundary: ${evaluation.qstBoundary.spacetimeCL}; mayPromoteToCL4=${evaluation.qstBoundary.mayPromoteToCL4}; edgeType=${evaluation.qstBoundary.edgeType}`,
    `ER proxy caveat: erDensityProxy is not wormhole density`,
    `Allowed claim: cosmological structure context, astrophysical population prior, stellar microphysics prior, galactic dynamics null model, QST entropy annotation, not direct ER=EPR evidence.`,
    `Claim IDs: ${evaluation.evidence.claimIds.join(", ")}`,
    `Citations: ${evaluation.evidence.citations.join(", ")}`,
    `Source roles: ${Object.entries(evaluation.evidence.sourceRoles).map(([claimId, role]) => `${claimId}:${role}`).join(", ")}`,
    `Uncertainty notes: ${evaluation.evidence.uncertaintyNotes.join(" | ")}`,
  ];
  const text = lines.join("\n");
  const validation = validateStarSimGalacticDynamicsSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(`StarSim galactic dynamics language failed: ${validation.forbiddenPhrases.join(", ")}`);
  }
  return text;
}
