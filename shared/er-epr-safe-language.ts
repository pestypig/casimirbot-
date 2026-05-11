import { z } from "zod";

import type { ErEprSimulationEvaluation } from "./er-epr-simulation";
import type { ErEprStage1BatchReport } from "./er-epr-stage1-runner";

export const ER_EPR_FORBIDDEN_LANGUAGE = [
  "proves ER=EPR",
  "proves wormholes exist",
  "real wormhole density",
  "local wormhole inventory",
  "propulsion evidence",
  "Needle Hull works",
  "CL4 support",
  "stress-energy source",
  "Hubble-driven photon production",
  "direct StarSim ER=EPR evidence",
] as const;

export const erEprSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export type ErEprSafeLanguageValidation = z.infer<typeof erEprSafeLanguageValidationSchema>;

type RenderableErEpr = ErEprSimulationEvaluation | ErEprStage1BatchReport;

export function validateErEprSafeLanguage(text: string): ErEprSafeLanguageValidation {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = ER_EPR_FORBIDDEN_LANGUAGE.filter((phrase) =>
    normalized.includes(phrase.toLowerCase()),
  );
  return {
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  };
}

export function renderErEprStage1Claim(value: RenderableErEpr): string {
  if (isBatchReport(value)) {
    const lines = [
      `Claim tier: ${value.strongestAllowedClaim.claimTier}`,
      `Verdict: ${value.strongestVerdict}`,
      `Allowed claim: ${value.strongestAllowedClaim.statement}`,
      `Claim IDs: ${value.claimIds.join(", ")}`,
      `Source roles: ${renderSourceRoles(value.sourceRoles)}`,
      `Uncertainty notes: ${value.uncertaintyNotes.join(" | ")}`,
      `Caveats: ${value.caveats.join(" | ")}`,
    ];
    if (value.failedControlSummary.signalCarryingControls.length === 0) {
      lines.push("Control result: ordinary controls failed under the declared threshold profile.");
    } else {
      lines.push("Control result: at least one ordinary control carried the signal, so the batch claim is demoted.");
    }
    return assertSafe(lines.join("\n"));
  }

  const lines = [
    `Claim tier: ${value.evidence.claimTier}`,
    `Verdict: ${value.evidence.verdict}`,
    "Allowed claim: Stage 1 simulated evidence from a controlled holographic/toy-dual simulation, bounded to model-internal support.",
    `Proxy status: ${value.guards.spacetimeCL}; mayPromoteToCL4=${value.guards.mayPromoteToCL4}`,
    `Claim IDs: ${value.evidence.claimIds.join(", ")}`,
    `Source roles: ${renderSourceRoles(value.evidence.sourceRoles)}`,
    `Uncertainty notes: ${value.evidence.uncertaintyNotes.join(" | ")}`,
    `Caveats: ${renderErEprStage1Caveats(value).join(" | ")}`,
  ];
  if (value.gates.ordinaryControlsFail) {
    lines.push("Control result: ordinary controls failed under the declared threshold profile.");
  }
  return assertSafe(lines.join("\n"));
}

export function renderErEprStage1Caveats(value: RenderableErEpr): string[] {
  if (isBatchReport(value)) {
    return value.caveats;
  }

  return [
    "proxy-only",
    "requires independent theoretical and experimental validation",
    "model-internal support is limited to the declared controlled holographic/toy-dual simulation",
    "not a metric-equivalence lane",
    "not a wormhole inventory",
    "not evidence for Needle Hull or propulsion systems",
    ...value.guards.overclaimWarnings,
  ];
}

function renderSourceRoles(sourceRoles: Record<string, string>): string {
  return Object.entries(sourceRoles)
    .map(([claimId, role]) => `${claimId}:${role}`)
    .join(", ");
}

function assertSafe(text: string): string {
  const validation = validateErEprSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(`ER=EPR safe-language validation failed: ${validation.forbiddenPhrases.join(", ")}`);
  }
  return text;
}

function isBatchReport(value: RenderableErEpr): value is ErEprStage1BatchReport {
  return "candidateEvaluations" in value && "strongestAllowedClaim" in value;
}
