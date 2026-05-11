import { z } from "zod";
import type { ErEprSolverAdapterResult } from "./er-epr-solver-adapter";

export const ER_EPR_SOLVER_FORBIDDEN_LANGUAGE = [
  "proves ER=EPR",
  "proves wormholes exist",
  "real-universe wormhole",
  "wormhole inventory",
  "wormhole density",
  "Needle Hull evidence",
  "NHM2 propulsion evidence",
  "propulsion evidence",
  "stress-energy source",
  "CL4 support",
  "fixture-only solver evidence",
] as const;

export const erEprSolverSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export function validateErEprSolverSafeLanguage(text: string) {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = ER_EPR_SOLVER_FORBIDDEN_LANGUAGE.filter((phrase) => {
    const lower = phrase.toLowerCase();
    if (lower === "real-universe wormhole") {
      return normalized.includes(lower) && !normalized.includes("not real-universe wormhole");
    }
    return normalized.includes(lower);
  });
  return erEprSolverSafeLanguageValidationSchema.parse({
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  });
}

export function renderErEprSolverAdapterReport(result: ErEprSolverAdapterResult): string {
  const lines = [
    `Stage: ${result.evidence.stage}`,
    `Claim tier: ${result.evidence.claimTier}`,
    `Adapter run ID: ${result.adapterRunId}`,
    `Backend: ${result.raw.backend}`,
    `Raw provenance: ${result.raw.provenance.reproducibilityStatus}`,
    `Hamiltonian hash: ${result.raw.model.hamiltonianHash ?? "none"}`,
    `Seed: ${result.raw.model.seed ?? "none"}`,
    `Evaluation verdict: ${result.evaluation.evidence.verdict}`,
    `Signal composite: ${result.evaluation.values.signalComposite}`,
    `Control leakage: ${result.evaluation.values.controlLeakage}`,
    `QST boundary: ${result.qstBoundary.spacetimeCL}; mayPromoteToCL4=${result.qstBoundary.mayPromoteToCL4}`,
    "Allowed claim: model-internal solver-adapter telemetry for a declared toy-dual backend; not real-universe wormhole evidence; not NHM2 propulsion validation.",
    `Claim IDs: ${result.evidence.claimIds.join(", ")}`,
    `Citations: ${result.evidence.citations.join(", ")}`,
    `Source roles: ${Object.entries(result.evidence.sourceRoles).map(([claimId, role]) => `${claimId}:${role}`).join(", ")}`,
    `Uncertainty notes: ${result.evidence.uncertaintyNotes.join(" | ")}`,
    `Caveats: ${result.qstBoundary.caveats.join(" | ")}`,
  ];
  const text = lines.join("\n");
  const validation = validateErEprSolverSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(`ER=EPR solver language failed: ${validation.forbiddenPhrases.join(", ")}`);
  }
  return text;
}
