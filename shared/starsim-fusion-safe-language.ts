import { z } from "zod";

import type { StarSimFusionArtifact } from "./starsim-fusion-artifact";
import {
  sourceRolesForStarSimFusionClaims,
  uncertaintyNotesForStarSimFusionClaims,
  validityDomainsForStarSimFusionClaims,
  type StarSimFusionClaimId,
} from "./starsim-fusion-claims";
import type {
  StarMapFusionGraph,
  StarSimFusionMicrophysicsEvaluation,
} from "./starsim-fusion-microphysics";

export const STARSIM_FUSION_FORBIDDEN_LANGUAGE = [
  "stars prove ER=EPR",
  "direct ER=EPR evidence",
  "wormhole density",
  "wormhole inventory",
  "Needle Hull propulsion evidence",
  "CL4 support",
  "stress-energy source",
  "spacetime metric evidence",
  "fusion proves quantum gravity",
  "derived Planck constant",
] as const;

export const starSimFusionSafeLanguageValidationSchema = z.object({
  ok: z.boolean(),
  forbiddenPhrases: z.array(z.string()),
});

export type StarSimFusionSafeLanguageValidation = z.infer<
  typeof starSimFusionSafeLanguageValidationSchema
>;

type RenderableStarSimFusion =
  | StarSimFusionMicrophysicsEvaluation
  | StarSimFusionArtifact
  | StarMapFusionGraph;

export function validateStarSimFusionSafeLanguage(
  text: string,
): StarSimFusionSafeLanguageValidation {
  const normalized = text.toLowerCase();
  const forbiddenPhrases = STARSIM_FUSION_FORBIDDEN_LANGUAGE.filter((phrase) => {
    const lower = phrase.toLowerCase();
    if (lower === "direct er=epr evidence") {
      return (
        normalized.includes(lower) &&
        !normalized.includes("not direct er=epr evidence") &&
        !normalized.includes("cannot claim direct er=epr evidence")
      );
    }
    return normalized.includes(lower);
  });
  return {
    ok: forbiddenPhrases.length === 0,
    forbiddenPhrases,
  };
}

export function renderStarSimFusionClaim(value: RenderableStarSimFusion): string {
  if (isArtifact(value)) {
    return renderEvaluation(value.evaluation, {
      reproducibilityStatus: value.reproducibilityStatus,
      artifactId: value.artifactId,
    });
  }
  if (isGraph(value)) {
    const claimIds = value.claimIds as StarSimFusionClaimId[];
    return assertSafe(
      [
        "Stage: STARSIM_FUSION_MICROPHYSICS_STAGE1",
        "Claim tier: Stage1_reduced_order_astrophysical_prior",
        "Allowed claim: StarMap graph is an astrometric and population-structure prior only.",
        `QST role: ${value.qstRole}`,
        "Proxy status: proxy_only; mayPromoteToCL4=false",
        `Claim IDs: ${claimIds.join(", ")}`,
        `Citations: ${value.citations.join(", ")}`,
        `Source roles: ${renderRecord(sourceRolesForStarSimFusionClaims(claimIds))}`,
        `Uncertainty notes: ${uncertaintyNotesForStarSimFusionClaims(claimIds).join(" | ")}`,
        `Validity domains: ${renderValidityDomains(claimIds)}`,
        `Caveats: ${renderStarSimFusionCaveats(value).join(" | ")}`,
      ].join("\n"),
    );
  }
  return renderEvaluation(value);
}

export function renderStarSimFusionCaveats(value: RenderableStarSimFusion): string[] {
  if (isArtifact(value)) return renderStarSimFusionCaveats(value.evaluation);
  if (isGraph(value)) {
    return [
      "proxy-only",
      "not direct ER=EPR evidence",
      "ordinary astrometric and population structure prior only",
      value.caveat,
    ];
  }

  const caveats = [
    "proxy-only",
    "not direct ER=EPR evidence",
    "not a metric-equivalence lane",
    "not evidence for Needle Hull propulsion",
    "not a stress-energy model",
    "requires independent theoretical and experimental validation",
    ...value.qstPrior.caveats,
  ];
  if (value.hSpectralFit) {
    caveats.push("hSpectralFit is calibration_only and does not infer a new h value.");
  }
  return [...new Set(caveats)];
}

function renderEvaluation(
  evaluation: StarSimFusionMicrophysicsEvaluation,
  artifact?: { artifactId: string; reproducibilityStatus: string },
) {
  const claimIds = evaluation.evidence.claimIds as StarSimFusionClaimId[];
  const lines = [
    "Stage: STARSIM_FUSION_MICROPHYSICS_STAGE1",
    `Claim tier: ${evaluation.evidence.claimTier}`,
    "Allowed claim: reduced-order Stage 1 astrophysical prior for stellar microphysics context.",
    `Dominant fusion channel: ${evaluation.inferred.dominantFusionChannel}`,
    `Fusion active: ${evaluation.inferred.fusionActive}`,
    `Quantum microphysics role: ${evaluation.quantumMicrophysics.role}`,
    `QST role: ${evaluation.qstPrior.role}`,
    `Proxy status: ${evaluation.qstPrior.spacetimeCL}; mayPromoteToCL4=${evaluation.qstPrior.mayPromoteToCL4}`,
    `Claim IDs: ${claimIds.join(", ")}`,
    `Citations: ${evaluation.evidence.citations.join(", ")}`,
    `Source roles: ${renderRecord(sourceRolesForStarSimFusionClaims(claimIds))}`,
    `Uncertainty notes: ${uncertaintyNotesForStarSimFusionClaims(claimIds).join(" | ")}`,
    `Validity domains: ${renderValidityDomains(claimIds)}`,
    `Caveats: ${renderStarSimFusionCaveats(evaluation).join(" | ")}`,
  ];
  if (artifact) {
    lines.splice(1, 0, `Artifact ID: ${artifact.artifactId}`);
    lines.push(`Reproducibility status: ${artifact.reproducibilityStatus}`);
  }
  if (evaluation.hSpectralFit) {
    lines.push(`hSpectralFit status: ${evaluation.hSpectralFit.status}`);
  }
  if (evaluation.qstPrior.blockedClaims.length > 0) {
    lines.push(`Blocked claims: ${evaluation.qstPrior.blockedClaims.join(", ")}`);
  }
  return assertSafe(lines.join("\n"));
}

function renderRecord(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
}

function renderValidityDomains(claimIds: StarSimFusionClaimId[]): string {
  const domains = validityDomainsForStarSimFusionClaims(claimIds);
  return Object.entries(domains)
    .map(([claimId, domain]) => `${claimId}:${domain.system}`)
    .join(", ");
}

function assertSafe(text: string): string {
  const validation = validateStarSimFusionSafeLanguage(text);
  if (!validation.ok) {
    throw new Error(
      `StarSim fusion safe-language validation failed: ${validation.forbiddenPhrases.join(", ")}`,
    );
  }
  return text;
}

function isArtifact(value: RenderableStarSimFusion): value is StarSimFusionArtifact {
  return "artifactId" in value && "evaluation" in value;
}

function isGraph(value: RenderableStarSimFusion): value is StarMapFusionGraph {
  return "nodes" in value && "edges" in value && "qstRole" in value;
}
