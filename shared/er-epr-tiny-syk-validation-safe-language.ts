import type { TinySykValidationSweepArtifact } from "./er-epr-tiny-syk-validation-artifact";

const FORBIDDEN = [
  "proves ER=EPR",
  "real wormhole",
  "traversable wormhole created",
  "NHM2 propulsion evidence",
  "Needle Hull evidence",
  "stress-energy source",
  "CL4 support",
  "wormhole inventory",
  "wormhole density",
  "exact diagonalization result",
];

export function validateTinySykValidationSafeLanguage(text: string): { ok: boolean; blockedPhrases: string[] } {
  const lower = text.toLowerCase();
  const blockedPhrases = FORBIDDEN.filter((phrase) => lower.includes(phrase.toLowerCase()));
  return { ok: blockedPhrases.length === 0, blockedPhrases };
}

export function renderTinySykValidationMarkdown(report: TinySykValidationSweepArtifact): string {
  const markdown = [
    "# ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1",
    "",
    `Verdict: ${report.aggregate.strongestAllowedVerdict}`,
    `Candidate pass rate: ${report.aggregate.candidatePassRate}`,
    `Candidate runs: ${report.aggregate.totalCandidateRuns}`,
    "",
    "Allowed claim: model-internal validation support observed only when the declared seed ensemble, controls, numerical-method checks, and entropy-stretch washout pass.",
    "",
    "Numerical method boundary: current reports use tiny matrix evolution with Taylor matrix evolution labels, not exact diagonalization labels.",
    "",
    "QST boundary: proxy-only; mayPromoteToCL4=false.",
    "",
    "Boundary: this is not real-universe ER=EPR evidence, not an ER-bridge catalog, not a source term, and not NHM2 evidence.",
    "",
    "Blockers:",
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker.blockerId}: ${blocker.detail}`) : ["- none"]),
    "",
    "Claim IDs:",
    ...report.evidence.claimIds.map((claimId) => `- ${claimId}`),
    "",
    "Citations:",
    ...report.evidence.citations.map((citation) => `- ${citation}`),
    "",
    "Uncertainty notes:",
    ...report.evidence.uncertaintyNotes.map((note) => `- ${note}`),
  ].join("\n") + "\n";
  const validation = validateTinySykValidationSafeLanguage(markdown);
  if (!validation.ok) {
    throw new Error(`Tiny SYK validation report contains forbidden language: ${validation.blockedPhrases.join(", ")}`);
  }
  return markdown;
}

export function tinySykValidationForbiddenPhrases(): string[] {
  return [...FORBIDDEN];
}
