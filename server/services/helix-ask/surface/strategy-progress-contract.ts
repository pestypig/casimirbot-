import { extractFilePathsFromText } from "../paths";
import {
  extractResearchCitations,
  selectResearchCitationFallback,
} from "./research-citation-policy";

const REPO_PATH_RE = /^(?:docs|server|client|shared|modules|scripts|tests|external)\//i;
const CODEX_CLONE_CITATION_RE =
  /external\/openai-codex\/codex-rs\/app-server(?:-protocol)?\/src\/(?:protocol\/v2\.rs|bespoke_event_handling\.rs|codex_message_processor\.rs)/i;
const STRATEGY_SIGNAL_RE =
  /\b(?:strateg(?:y|ic)|benchmark\s+parity|parity|inflection\s+point|progress(?:ion)?|continue|pivot|highest[-\s]leverage|next\s+experiment|pass\/fail|threshold|evaluation\s+budget|sweep|ablation)\b/i;
const STRATEGY_ACTION_SIGNAL_RE =
  /\b(?:experiment|test|sweep|ablation|threshold|metric|scorecard|continue|pivot|decision)\b/i;
const SINGLE_EXPERIMENT_RE =
  /\b(?:single|one|highest[-\s]leverage)\b[^.\n:]{0,120}\b(?:experiment|test|sweep|ablation|trial)\b/i;
const NUMERIC_THRESHOLD_RE =
  /(?:>=|<=|>|<|=|at\s+least|at\s+most|minimum|max(?:imum)?|target|below|above)\s*\d+(?:\.\d+)?\s*(?:%|ms|s|x|\/\d+)?/i;
const PASS_THRESHOLD_RE =
  /\b(?:pass|continue|promote|ship|accept|go)\b[^.\n:]{0,120}(?:>=|>|at\s+least|minimum|max(?:imum)?|target|below|above|\d)/i;
const PIVOT_THRESHOLD_RE =
  /\b(?:pivot|fail|rollback|stop|abort|fallback)\b[^.\n:]{0,120}(?:<=|<|at\s+most|maximum|target|below|above|\d)/i;
const MEASUREMENT_ARTIFACT_RE =
  /\b(?:artifacts\/|reports\/|summary\.json|failures\.json|debug(?:context)?|trace|event_journal|scorecard|coverage_ratio|grounded_sentence_rate|rattling_score|claim_ref_rate)\b/i;
const NON_TRIVIAL_CLAIM_RE =
  /\b(?:run|prioriti[sz]e|patch|measure|continue|pivot|ship|promote|rollback|threshold|target|experiment|sweep|ablation|benchmark|decision)\b/i;
const INLINE_CITATION_RE =
  /(?:\[[^\]]+\]|https?:\/\/|(?:docs|server|client|shared|modules|scripts|tests|external)\/[^\s,)\]]+|(?:arxiv:|doi:))/i;

type SectionMap = Map<string, string[]>;

export type HelixAskStrategyProgressContractEvaluation = {
  required: boolean;
  pass: boolean;
  missingReasons: string[];
  hasSingleExperiment: boolean;
  hasPassThreshold: boolean;
  hasPivotThreshold: boolean;
  hasMeasurementArtifact: boolean;
  claimEvidenceBindingPass: boolean;
  claimEvidenceBindingMissing: string[];
  nonTrivialClaimCount: number;
  citations: string[];
  repoCitationCount: number;
  codexCloneCitationCount: number;
  webResearchCitationCount: number;
};

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const normalized = String(raw ?? "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const normalizePath = (value: string): string =>
  String(value ?? "")
    .trim()
    .replace(/\\/g, "/");

const clip = (value: string, maxChars: number): string => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(1, maxChars - 3)).trimEnd()}...`;
};

const ensureSentence = (value: string): string => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

const parseSections = (text: string): SectionMap => {
  const sections: SectionMap = new Map();
  const lines = String(text ?? "").split(/\r?\n/);
  let current: string | null = null;
  for (const line of lines) {
    const headingMatch = line.match(/^\s*([A-Za-z][A-Za-z0-9 /_-]{1,96})\s*:\s*$/);
    if (headingMatch) {
      current = headingMatch[1]!.trim().toLowerCase();
      if (!sections.has(current)) {
        sections.set(current, []);
      }
      continue;
    }
    if (!current) continue;
    sections.get(current)?.push(line);
  }
  return sections;
};

const readSection = (sections: SectionMap, candidates: string[]): string[] => {
  for (const candidate of candidates) {
    const lines = sections.get(candidate.toLowerCase());
    if (Array.isArray(lines) && lines.length > 0) return lines;
  }
  return [];
};

const stripBulletPrefix = (line: string): string =>
  String(line ?? "")
    .trim()
    .replace(/^(?:[-*]\s+|\d+\.\s+)/, "")
    .trim();

const collectNormalizedCitations = (args: { text: string; seedCitations?: string[] }): string[] =>
  unique([
    ...(args.seedCitations ?? []).map((entry) => String(entry ?? "").trim()),
    ...extractFilePathsFromText(args.text).map((entry) => normalizePath(entry)),
    ...extractResearchCitations(args.text),
  ]);

const buildSourcePool = (citations: string[]): string[] =>
  unique([
    ...citations,
    ...selectResearchCitationFallback({
      existingCitations: citations,
      claimTier: "diagnostic",
      limit: 10,
    }),
  ]).slice(0, 10);

export const isHelixAskStrategyProgressQuestion = (question: string): boolean => {
  const normalized = String(question ?? "").trim();
  if (!normalized) return false;
  return STRATEGY_SIGNAL_RE.test(normalized) && STRATEGY_ACTION_SIGNAL_RE.test(normalized);
};

const hasThresholdMatch = (line: string, re: RegExp): boolean => {
  const normalized = stripBulletPrefix(line);
  if (!normalized) return false;
  return re.test(normalized) && NUMERIC_THRESHOLD_RE.test(normalized);
};

export const evaluateHelixAskStrategyProgressContract = (args: {
  question: string;
  text: string;
  required?: boolean;
  seedCitations?: string[];
}): HelixAskStrategyProgressContractEvaluation => {
  const question = String(args.question ?? "");
  const text = String(args.text ?? "");
  const sections = parseSections(text);
  const required = args.required ?? isHelixAskStrategyProgressQuestion(question);
  const strategyLines = unique([
    ...readSection(sections, ["direct answer", "decision", "recommendation", "next step"]),
    ...readSection(sections, ["single highest-leverage experiment", "experiment"]),
    ...readSection(sections, ["pass thresholds", "continue thresholds", "thresholds"]),
    ...readSection(sections, ["pivot/fail thresholds", "pivot thresholds", "fail thresholds"]),
    ...readSection(sections, ["measurement artifact", "measurement artifacts", "scorecard"]),
    ...text.split(/\r?\n/),
  ]).map(stripBulletPrefix);
  const hasSingleExperiment =
    strategyLines.some((line) => SINGLE_EXPERIMENT_RE.test(line)) ||
    /\bsingle\s+highest[-\s]leverage\s+experiment\b/i.test(text);
  const hasPassThreshold = strategyLines.some((line) => hasThresholdMatch(line, PASS_THRESHOLD_RE));
  const hasPivotThreshold = strategyLines.some((line) => hasThresholdMatch(line, PIVOT_THRESHOLD_RE));
  const hasMeasurementArtifact = strategyLines.some((line) => MEASUREMENT_ARTIFACT_RE.test(line));

  const citations = collectNormalizedCitations({
    text,
    seedCitations: args.seedCitations,
  });
  const repoCitations = citations.filter((entry) => REPO_PATH_RE.test(normalizePath(entry)));
  const codexCloneCitations = citations.filter((entry) =>
    CODEX_CLONE_CITATION_RE.test(normalizePath(entry)),
  );
  const webResearchCitations = citations.filter((entry) => /^https?:\/\//i.test(entry));

  const nonTrivialClaims = strategyLines
    .filter((line) => line.length >= 24 && NON_TRIVIAL_CLAIM_RE.test(line))
    .slice(0, 12);
  const claimEvidenceBindingMissing: string[] = [];
  nonTrivialClaims.forEach((line, index) => {
    if (!INLINE_CITATION_RE.test(line)) {
      claimEvidenceBindingMissing.push(
        `claim_evidence_binding_missing:strategy_claim_${index + 1}`,
      );
    }
  });
  if (required && codexCloneCitations.length <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:codex_clone_reference");
  }
  if (required && webResearchCitations.length <= 0) {
    claimEvidenceBindingMissing.push("claim_evidence_binding_missing:web_research_reference");
  }
  const claimEvidenceBindingPass = claimEvidenceBindingMissing.length === 0;

  const missingReasons: string[] = [];
  if (required && !hasSingleExperiment) {
    missingReasons.push("strategy_progress_contract_missing:single_experiment");
  }
  if (required && !hasPassThreshold) {
    missingReasons.push("strategy_progress_contract_missing:pass_threshold");
  }
  if (required && !hasPivotThreshold) {
    missingReasons.push("strategy_progress_contract_missing:pivot_threshold");
  }
  if (required && !hasMeasurementArtifact) {
    missingReasons.push("strategy_progress_contract_missing:measurement_artifact");
  }
  if (required && repoCitations.length <= 0) {
    missingReasons.push("strategy_progress_contract_missing:repo_anchor");
  }
  if (required && !claimEvidenceBindingPass) {
    missingReasons.push(...claimEvidenceBindingMissing);
  }
  const normalizedMissingReasons = unique(missingReasons);
  return {
    required,
    pass: !required || normalizedMissingReasons.length === 0,
    missingReasons: normalizedMissingReasons,
    hasSingleExperiment,
    hasPassThreshold,
    hasPivotThreshold,
    hasMeasurementArtifact,
    claimEvidenceBindingPass,
    claimEvidenceBindingMissing: unique(claimEvidenceBindingMissing),
    nonTrivialClaimCount: nonTrivialClaims.length,
    citations: citations.slice(0, 24),
    repoCitationCount: repoCitations.length,
    codexCloneCitationCount: codexCloneCitations.length,
    webResearchCitationCount: webResearchCitations.length,
  };
};

const pickCitation = (sources: string[], fallbackIndex = 0): string =>
  sources[fallbackIndex] ?? "server/routes/agi.plan.ts";

export const buildHelixAskStrategyProgressContractRepairAnswer = (args: {
  question: string;
  text: string;
  citations: string[];
}): string => {
  const sources = buildSourcePool(args.citations);
  const codexCloneCitation =
    sources.find((entry) => CODEX_CLONE_CITATION_RE.test(normalizePath(entry))) ?? pickCitation(sources, 0);
  const webCitation =
    sources.find((entry) => /^https?:\/\//i.test(entry)) ?? pickCitation(sources, 1);
  const repoCitation =
    sources.find((entry) => REPO_PATH_RE.test(normalizePath(entry))) ?? pickCitation(sources, 0);
  const directAnswerSeed = String(args.text ?? "")
    .split(/\r?\n/)
    .map(stripBulletPrefix)
    .find((line) => line.length >= 24 && NON_TRIVIAL_CLAIM_RE.test(line));
  const directAnswer =
    ensureSentence(clip(directAnswerSeed ?? "", 220)) ||
    ensureSentence(
      `Run one targeted real-model variety sweep for "${clip(args.question, 96)}" and patch only the top recurring failure signature before widening refactors`,
    );
  return [
    "Direct Answer:",
    `- Single highest-leverage experiment this week: ${directAnswer} [${codexCloneCitation}]`,
    "",
    "Pass Thresholds:",
    `- Continue this patch line if strategy prompts achieve coverage_ratio >= 0.80 and grounded_sentence_rate >= 0.90 on the sweep summary [${webCitation}].`,
    `- Continue only if claim_ref_rate = 1.0 and rattling_score <= 0.20 on median and p75 cases [${repoCitation}].`,
    "",
    "Pivot/Fail Thresholds:",
    `- Pivot if coverage_ratio remains < 0.60 after one focused repair pass on the top recurring failure signature [${webCitation}].`,
    `- Pivot if claim_evidence_binding_pass is false in any representative strategy case after repair [${codexCloneCitation}].`,
    "",
    "Measurement Artifact:",
    `- Inspect artifacts/experiments/helix-ask-versatility/<run>/summary.json and failures.json, plus debug keys coverage_ratio, grounded_sentence_rate, claim_ref_rate, and rattling_score [${repoCitation}].`,
    "",
    "Confidence/Uncertainty:",
    `- Recommendation is diagnostic; keep claims fail-closed until the thresholds above hold under live-model sweeps [${webCitation}].`,
    "",
    "Next Step:",
    `- Execute one sweep, patch only the top signature, rerun the same sweep pack, and compare deltas before promoting any broad refactor [${codexCloneCitation}].`,
    "",
    sources.length > 0 ? `Sources: ${sources.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
};

export const buildHelixAskStrategyProgressContractUnknownFallback = (args: {
  question: string;
  citations: string[];
  missingReasons: string[];
}): string => {
  const sources = buildSourcePool(args.citations);
  const repoCitation =
    sources.find((entry) => REPO_PATH_RE.test(normalizePath(entry))) ?? pickCitation(sources, 0);
  const reasons = unique(args.missingReasons).slice(0, 8).join(", ");
  return [
    "Direct Answer:",
    `- UNKNOWN for "${clip(args.question, 120)}" until strategy progress obligations are satisfied with evidence-bound thresholds.`,
    "",
    "Pass Thresholds:",
    `- Missing: provide explicit numeric continue thresholds and cite the measurement basis [${repoCitation}].`,
    "",
    "Pivot/Fail Thresholds:",
    `- Missing: provide explicit numeric pivot thresholds and fail-closed criteria [${repoCitation}].`,
    "",
    "Measurement Artifact:",
    "- Missing: specify concrete artifact paths (for example, summary.json/failures.json) for auditability.",
    "",
    "Confidence/Uncertainty:",
    "- High uncertainty; fail-closed to avoid over-claiming strategy readiness from incomplete evidence.",
    reasons ? `Why: ${clip(reasons, 340)}` : "",
    sources.length > 0 ? `Sources: ${sources.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
};
