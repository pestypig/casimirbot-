import type { TinySykSolverArtifact } from "./er-epr-tiny-syk-artifact";

const FORBIDDEN = [
  "proves ER=EPR",
  "real wormhole",
  "real-universe wormhole",
  "wormhole density",
  "wormhole inventory",
  "traversable wormhole created",
  "spacetime bridge discovered",
  "NHM2 propulsion evidence",
  "Needle Hull evidence",
  "stress-energy source",
  "CL4 support",
  "certified quantum gravity",
  "stars prove ER=EPR",
  "galaxy map proves ER=EPR",
];

export function validateTinySykSafeLanguage(text: string): { ok: boolean; blockedPhrases: string[] } {
  const lower = text.toLowerCase();
  const blockedPhrases = FORBIDDEN.filter((phrase) => lower.includes(phrase.toLowerCase()));
  return { ok: blockedPhrases.length === 0, blockedPhrases };
}

export function renderTinySykReportMarkdown(artifact: TinySykSolverArtifact): string {
  const lines = [
    "# ER_EPR_TINY_SYK_EXACT_DIAG_V1",
    "",
    `Verdict: ${artifact.verdict.solverVerdict}`,
    `Backend: ${artifact.backend}`,
    `Numerical method: ${artifact.numerical.numericalMethod}`,
    `Dimension: ${artifact.numerical.dimension}`,
    "",
    "Allowed claim: model-internal support from a tiny SYK-like toy backend, when declared controls fail under thresholds and entropy-stretch washout is observed.",
    "",
    "Boundary: this is not real-universe ER=EPR evidence, not an ER-bridge catalog, not a source term, and not NHM2 propulsion validation.",
    "",
    "QST boundary: proxy-only; mayPromoteToCL4=false.",
    "",
    "Claim IDs:",
    ...artifact.evidence.claimIds.map((claimId) => `- ${claimId}`),
    "",
    "Citations:",
    ...artifact.evidence.citations.map((citation) => `- ${citation}`),
    "",
    "Uncertainty notes:",
    ...artifact.evidence.uncertaintyNotes.map((note) => `- ${note}`),
    "",
    "Caveats:",
    ...artifact.qstBoundary.caveats.map((caveat) => `- ${caveat}`),
  ];
  const markdown = `${lines.join("\n")}\n`;
  const validation = validateTinySykSafeLanguage(markdown);
  if (!validation.ok) {
    throw new Error(`Tiny SYK report contains forbidden language: ${validation.blockedPhrases.join(", ")}`);
  }
  return markdown;
}

export function tinySykForbiddenPhrases(): string[] {
  return [...FORBIDDEN];
}
