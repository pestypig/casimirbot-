import { extractFilePathsFromText } from "./paths";
import { filterSignalTokens, tokenizeAskQuery } from "./query";
import type { HelixAskFormat } from "./format";
import type { HelixAskConceptMatch } from "./concepts";

export type HelixAskDomain = "general" | "repo" | "hybrid" | "falsifiable";

export type HelixAskBeliefSummary = {
  claimCount: number;
  supportedCount: number;
  unsupportedCount: number;
  unsupportedRate: number;
  contradictionCount: number;
};

export type HelixAskCoverageSummary = {
  tokenCount: number;
  keyCount: number;
  missingKeyCount: number;
  coverageRatio: number;
  missingKeys: string[];
};

export type HelixAskBeliefGraphSummary = {
  nodeCount: number;
  edgeCount: number;
  claimCount: number;
  definitionCount: number;
  conclusionCount: number;
  evidenceRefCount: number;
  constraintCount: number;
  edgeCounts: {
    supports: number;
    contradicts: number;
    depends_on: number;
    maps_to: number;
  };
  claimIds: string[];
  unsupportedClaimIds: string[];
  contradictionIds: string[];
};

export type HelixAskRattlingDetail = {
  baseDistance: number;
  perturbationDistance: number;
  claimSetCount: number;
};

export type HelixAskVariantSummary = {
  applied: boolean;
  reason?: string;
  selectedLabel?: string;
  candidateCount?: number;
};

export type HelixAskPlatonicInput = {
  question: string;
  answer: string;
  domain: HelixAskDomain;
  tier?: string;
  intentId?: string;
  format: HelixAskFormat;
  evidenceText?: string;
  evidencePaths?: string[];
  generalScaffold?: string;
  repoScaffold?: string;
  promptScaffold?: string;
  conceptMatch?: HelixAskConceptMatch | null;
};

export type HelixAskPlatonicResult = {
  answer: string;
  junkCleanApplied: boolean;
  junkCleanReasons: string[];
  conceptLintApplied: boolean;
  conceptLintReasons: string[];
  physicsLintApplied: boolean;
  physicsLintReasons: string[];
  coverageSummary: HelixAskCoverageSummary;
  coverageGateApplied: boolean;
  coverageGateReason?: string;
  beliefSummary: HelixAskBeliefSummary;
  beliefGraphSummary: HelixAskBeliefGraphSummary;
  beliefGateApplied: boolean;
  beliefGateReason?: string;
  rattlingScore: number;
  rattlingGateApplied: boolean;
  rattlingDetail?: HelixAskRattlingDetail;
  variantSummary?: HelixAskVariantSummary;
};

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const JUNK_CLEAN_ENABLED = String(process.env.HELIX_ASK_JUNK_CLEAN ?? "1").trim() !== "0";
const CONCEPT_LINT_ENABLED = String(process.env.HELIX_ASK_CONCEPT_LINT ?? "1").trim() !== "0";
const PHYSICS_LINT_ENABLED = String(process.env.HELIX_ASK_PHYSICS_LINT ?? "1").trim() !== "0";
const COVERAGE_GATE_ENABLED = String(process.env.HELIX_ASK_COVERAGE_GATE ?? "1").trim() !== "0";
const BELIEF_GATE_ENABLED = String(process.env.HELIX_ASK_BELIEF_GATE ?? "1").trim() !== "0";
const RATTLING_GATE_ENABLED = String(process.env.HELIX_ASK_RATTLING_GATE ?? "1").trim() !== "0";
const COVERAGE_MIN_RATIO = Number(process.env.HELIX_ASK_COVERAGE_MIN_RATIO ?? 0.35);
const BELIEF_UNSUPPORTED_MAX = Number(process.env.HELIX_ASK_BELIEF_UNSUPPORTED_MAX ?? 0.85);
const BELIEF_NOVEL_MIN_RATIO = Number(process.env.HELIX_ASK_BELIEF_NOVEL_MIN_RATIO ?? 0.25);
const BELIEF_SUPPORT_MIN_RATIO = clampNumber(
  Number(process.env.HELIX_ASK_BELIEF_SUPPORT_MIN_RATIO ?? BELIEF_NOVEL_MIN_RATIO),
  0.05,
  1,
);
const BELIEF_SUPPORT_MIN_TOKENS = clampNumber(
  Number(process.env.HELIX_ASK_BELIEF_SUPPORT_MIN_TOKENS ?? 2),
  1,
  6,
);
const RATTLING_MAX = Number(process.env.HELIX_ASK_RATTLING_MAX ?? 0.8);
const RATTLING_PERTURB_ENABLED =
  String(process.env.HELIX_ASK_RATTLING_PERTURB ?? "1").trim() !== "0";
const VARIANT_SELECTION_ENABLED =
  String(process.env.HELIX_ASK_VARIANT_SELECTION ?? "0").trim() === "1";
const VARIANT_MIN_SENTENCES = clampNumber(
  Number(process.env.HELIX_ASK_VARIANT_MIN_SENTENCES ?? 2),
  1,
  6,
);
const VARIANT_MIN_RATIO = clampNumber(
  Number(process.env.HELIX_ASK_VARIANT_MIN_RATIO ?? 0.5),
  0,
  1,
);
const QUESTION_ALIGNMENT_MIN_TOKENS = 1;
const QUESTION_ALIGNMENT_MIN_RATIO = 0.15;
const CONCEPT_MAX_SENTENCES = 3;

const SYSTEM_TERMS =
  /\b(helix ask|this system|repo|repository|codebase|server\/|client\/|api\/|endpoint|constraint gate|certificate|admissible|verified|integrity_ok)\b/i;

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const LIST_STRUCTURE_RE = /^\s*(?:[-*]|\d+\.)\s+/m;

const COMMON_QUERY_TOKENS = new Set([
  "helix",
  "ask",
  "pipeline",
  "system",
  "repo",
  "repository",
  "codebase",
  "file",
  "files",
  "path",
  "paths",
  "cite",
  "cites",
  "citations",
  "stage",
  "stages",
  "module",
  "modules",
  "work",
  "works",
  "working",
  "select",
  "selects",
  "selection",
  "source",
  "sources",
  "report",
  "reports",
  "note",
  "notes",
  "list",
  "lists",
  "explain",
  "explanation",
  "define",
  "defined",
  "definition",
  "include",
  "including",
  "use",
  "uses",
  "used",
  "short",
  "brief",
  "paragraph",
  "paragraphs",
  "sentence",
  "sentences",
  "using",
  "first",
  "second",
  "third",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "must",
  "should",
  "required",
  "requirement",
  "requirements",
  "apply",
  "applies",
  "applied",
  "format",
  "formatted",
  "section",
  "sections",
  "ts",
  "tsx",
]);

const CONCEPTUAL_TOKENS = new Set([
  "scientific",
  "method",
  "philosophy",
  "epistemology",
  "platonic",
  "reasoning",
  "logic",
  "knowledge",
  "hypothesis",
  "experiment",
  "analysis",
  "explain",
  "definition",
  "conceptual",
  "general",
  "verification",
  "verify",
  "falsifiable",
  "falsifiability",
  "methodology",
]);

const SMOKE_QUESTION_RE = /\b(smoke)\b.*\brise\b|\brise\b.*\bsmoke\b/i;
const SMOKE_BAD_RE = /\bsmoke (particles?|plume)?\s*(are|is)\s*(lighter|less dense)\s*than air\b/i;
const SMOKE_CORE_RE = /\b(hot|warm)\s+air\b|\bbuoyan(t|cy)\b/i;
const SMOKE_COOL_RE = /\bcool\b|\binversion\b|\bdense\b/i;

const JUNK_LINE_PATTERNS = [
  /^",?\s*no headings\./i,
  /^you are helix ask citation fixer\./i,
  /^revise the answer to include citations/i,
  /^do not add new claims or steps/i,
  /^keep the numbered step list/i,
  /^keep the paragraph format/i,
  /^use only citation identifiers/i,
  /^answer:\s*$/i,
  /^final:\s*$/i,
  /^general reasoning:/i,
  /^repo evidence:/i,
  /^evidence:/i,
  /^ts[x]?`/i,
  /^ts\b/i,
];

const JUNK_FRAGMENT_RE = /\btsx?\)\.\s*/gi;
const REPEATED_TS_FRAGMENT_RE = /(tsx?\)\.\s*){2,}|(ts\)\.\s*){2,}/i;
const TS_FRAGMENT_START_RE = /^(?:ts|tsx)[`.)\s]/i;
const TS_BACKTICK_FRAGMENT_RE = /\bts`[^.\n]*\.?/gi;
const ORPHAN_EXT_TOKEN_RE = /(^|[\s([{"'`])(?:md|json|ts|tsx|html)[\.,](?=\s|$)/g;
const ORPHAN_EXT_PAREN_RE = /(^|[\s([{"'`])(?:md|json|ts|tsx|html)\)(?=\s|$)/g;
const ORPHAN_EXT_BACKTICK_RE = /(^|[\s([{"'`])(?:md|json|ts|tsx|html)`(?=\s|$)/g;
const ORPHAN_EXT_PUNCT_RE = /(^|[\s([{"'`])(?:md|json|ts|tsx|html)[`.)]+(?=\s|$)/g;
const LEADING_EXT_TOKEN_RE = /^(?:md|json|ts|tsx|html)\b[`.)]*\s*/gim;

function splitSentences(text: string): string[] {
  return text
    .split(SENTENCE_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
}

function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

type ClaimNode = {
  id: string;
  text: string;
  tokens: Set<string>;
  isDefinition: boolean;
  isConclusion: boolean;
  hasNegation: boolean;
  evidenceRefs: string[];
};

const NEGATION_TOKENS = new Set([
  "no",
  "not",
  "never",
  "without",
  "cannot",
  "can't",
  "fail",
  "fails",
  "failed",
  "missing",
]);
const CLAIM_DEFINITION_RE =
  /(^definition:|\b(is|are|means|refers to|defined as)\b)/i;
const CLAIM_CONCLUSION_RE = /\b(therefore|thus|so|hence|as a result)\b/i;

function buildClaimNodes(answer: string): ClaimNode[] {
  const sentences = splitSentences(answer);
  return sentences.map((text, index) => {
    const tokens = toTokenSet(text);
    const evidenceRefs = extractFilePathsFromText(text);
    const lower = text.toLowerCase();
    const hasNegation = Array.from(NEGATION_TOKENS).some((token) =>
      lower.includes(token),
    );
    const isDefinition =
      /^definition:/i.test(text) || CLAIM_DEFINITION_RE.test(text);
    const isConclusion =
      CLAIM_CONCLUSION_RE.test(text) && sentences.length > 1
        ? true
        : index === sentences.length - 1 && sentences.length > 1;
    return {
      id: `claim:${index + 1}`,
      text,
      tokens,
      isDefinition,
      isConclusion,
      hasNegation,
      evidenceRefs,
    };
  });
}

function countTokenOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) overlap += 1;
  }
  return overlap;
}

function isClaimSupported(tokens: Set<string>, evidenceTokens: Set<string>): boolean {
  if (tokens.size === 0 || evidenceTokens.size === 0) return false;
  const overlap = countTokenOverlap(tokens, evidenceTokens);
  if (overlap < BELIEF_SUPPORT_MIN_TOKENS) return false;
  const ratio = overlap / tokens.size;
  return ratio >= BELIEF_SUPPORT_MIN_RATIO;
}

function buildClaimSupportSet(claims: ClaimNode[], tokens: Set<string>): Set<string> {
  const supported = new Set<string>();
  for (const claim of claims) {
    if (isClaimSupported(claim.tokens, tokens)) {
      supported.add(claim.id);
    }
  }
  return supported;
}

function jaccardDistanceForSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  if (a.size === 0 || b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  if (union <= 0) return 1;
  return 1 - intersection / union;
}

function extractEvidenceLines(scaffold?: string, limit = 4): string[] {
  if (!scaffold) return [];
  const lines = scaffold
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^(-|\d+\.)\s+/.test(line));
  if (lines.length === 0) {
    return scaffold
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, limit);
  }
  return lines.slice(0, limit);
}

function applyIdeologyConceptOverride(
  input: HelixAskPlatonicInput,
): { answer: string; applied: boolean; reason?: string } {
  if (input.intentId !== "repo.ideology_reference") {
    return { answer: input.answer, applied: false };
  }
  const match = input.conceptMatch;
  if (!match) {
    return { answer: input.answer, applied: false };
  }
  if (!input.repoScaffold?.trim() && !input.evidenceText?.trim()) {
    return { answer: input.answer, applied: false };
  }
  const conceptSentences: string[] = [];
  if (match.card.definition) {
    conceptSentences.push(ensureSentence(match.card.definition));
  }
  if (match.card.keyQuestions) {
    conceptSentences.push(ensureSentence(`Key questions include: ${match.card.keyQuestions}`));
  }
  const paragraph1 = conceptSentences.join(" ").trim();
  const evidenceLines = extractEvidenceLines(input.repoScaffold, 4);
  const paragraph2 = evidenceLines.join("\n").trim();
  const composed = [paragraph1, paragraph2].filter(Boolean).join("\n\n").trim();
  if (!composed) {
    return { answer: input.answer, applied: false };
  }
  return { answer: composed, applied: true, reason: "ideology_concept_override" };
}

function stripJunkFragments(answer: string): { answer: string; applied: boolean; reasons: string[] } {
  if (!JUNK_CLEAN_ENABLED) {
    return { answer, applied: false, reasons: [] };
  }
  const reasons: string[] = [];
  const lines = answer.split(/\r?\n/);
  const filteredLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      filteredLines.push("");
      continue;
    }
    if (JUNK_LINE_PATTERNS.some((re) => re.test(trimmed))) {
      reasons.push("junk_heading_removed");
      continue;
    }
    if (/^\d+\.$/.test(trimmed)) {
      reasons.push("orphan_number_removed");
      continue;
    }
    if (/^(md|json|ts|tsx)\.$/i.test(trimmed)) {
      reasons.push("orphan_extension_removed");
      continue;
    }
    if (TS_FRAGMENT_START_RE.test(trimmed)) {
      reasons.push("ts_fragment_start_removed");
      continue;
    }
    if (trimmed.length <= 24 && REPEATED_TS_FRAGMENT_RE.test(trimmed)) {
      reasons.push("repeated_ts_fragment_removed");
      continue;
    }
    filteredLines.push(line);
  }
  let cleaned = filteredLines.join("\n");
  const fragmentCleaned = cleaned.replace(JUNK_FRAGMENT_RE, "");
  if (fragmentCleaned !== cleaned) {
    reasons.push("ts_fragment_removed");
    cleaned = fragmentCleaned;
  }
  const backtickCleaned = cleaned.replace(TS_BACKTICK_FRAGMENT_RE, "");
  if (backtickCleaned !== cleaned) {
    reasons.push("ts_backtick_fragment_removed");
    cleaned = backtickCleaned;
  }
  const extTokenCleaned = cleaned.replace(ORPHAN_EXT_TOKEN_RE, (_match, prefix: string) => prefix);
  if (extTokenCleaned !== cleaned) {
    reasons.push("orphan_extension_token_removed");
    cleaned = extTokenCleaned;
  }
  const extParenCleaned = cleaned.replace(ORPHAN_EXT_PAREN_RE, (_match, prefix: string) => prefix);
  if (extParenCleaned !== cleaned) {
    reasons.push("orphan_extension_paren_removed");
    cleaned = extParenCleaned;
  }
  const extBacktickCleaned = cleaned.replace(
    ORPHAN_EXT_BACKTICK_RE,
    (_match, prefix: string) => prefix,
  );
  if (extBacktickCleaned !== cleaned) {
    reasons.push("orphan_extension_backtick_removed");
    cleaned = extBacktickCleaned;
  }
  const extPunctCleaned = cleaned.replace(ORPHAN_EXT_PUNCT_RE, (_match, prefix: string) => prefix);
  if (extPunctCleaned !== cleaned) {
    reasons.push("orphan_extension_punct_removed");
    cleaned = extPunctCleaned;
  }
  const leadingExtCleaned = cleaned.replace(LEADING_EXT_TOKEN_RE, "");
  if (leadingExtCleaned !== cleaned) {
    reasons.push("leading_extension_token_removed");
    cleaned = leadingExtCleaned;
  }
  cleaned = collapseBlankLines(cleaned);
  const applied = cleaned !== answer;
  return { answer: cleaned, applied, reasons };
}

function truncateSentences(sentences: string[], maxCount: number): string[] {
  if (sentences.length <= maxCount) return sentences;
  return sentences.slice(0, maxCount);
}

function sanitizeConceptSentences(sentences: string[]): { kept: string[]; reasons: string[] } {
  const reasons: string[] = [];
  const kept: string[] = [];
  for (const sentence of sentences) {
    if (!sentence) continue;
    if (extractFilePathsFromText(sentence).length > 0) {
      reasons.push("file_path_removed");
      continue;
    }
    if (SYSTEM_TERMS.test(sentence)) {
      reasons.push("system_term_removed");
      continue;
    }
    kept.push(sentence);
  }
  if (kept.length === 0 && sentences.length > 0) {
    kept.push(sentences[0]);
    reasons.push("fallback_first_sentence");
  }
  const clipped = truncateSentences(kept, CONCEPT_MAX_SENTENCES);
  if (clipped.length < kept.length) {
    reasons.push("sentence_limit");
  }
  return { kept: clipped, reasons };
}

function applyConceptLint(input: HelixAskPlatonicInput): {
  answer: string;
  applied: boolean;
  reasons: string[];
} {
  if (!CONCEPT_LINT_ENABLED) {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  if (input.domain !== "general") {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  if (input.tier && input.tier !== "F0") {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  if (SYSTEM_TERMS.test(input.question)) {
    return { answer: input.answer, applied: false, reasons: ["system_term_question"] };
  }
  const sentences = splitSentences(input.answer);
  if (sentences.length === 0) {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  const { kept, reasons } = sanitizeConceptSentences(sentences);
  const applied = kept.join(" ") !== sentences.join(" ");
  return { answer: kept.join(" "), applied, reasons };
}

function applyPhysicsLint(input: HelixAskPlatonicInput): {
  answer: string;
  applied: boolean;
  reasons: string[];
} {
  if (!PHYSICS_LINT_ENABLED) {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  if (input.domain !== "general") {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  if (input.tier && input.tier !== "F0") {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  if (!SMOKE_QUESTION_RE.test(input.question)) {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  const sentences = splitSentences(input.answer);
  if (sentences.length === 0) {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  const reasons: string[] = [];
  const filtered = sentences.filter((sentence) => {
    if (SMOKE_BAD_RE.test(sentence)) {
      reasons.push("smoke_density_removed");
      return false;
    }
    return true;
  });
  const hasCore = filtered.some((sentence) => SMOKE_CORE_RE.test(sentence));
  if (!hasCore) {
    filtered.push(
      "Smoke usually rises because the hot air carrying it is less dense than the surrounding air, so buoyancy lifts the plume.",
    );
    reasons.push("smoke_buoyancy_added");
  }
  const hasCooling = filtered.some((sentence) => SMOKE_COOL_RE.test(sentence));
  if (!hasCooling) {
    filtered.push(
      "As the plume cools it spreads, mixes, and can stop rising or sink under temperature inversions.",
    );
    reasons.push("smoke_cooling_added");
  }
  if (filtered.length === 0) {
    return { answer: input.answer, applied: false, reasons: [] };
  }
  const answer = filtered.join(" ");
  return { answer, applied: reasons.length > 0, reasons };
}

function expandPathToken(token: string): string[] {
  const out = new Set<string>();
  const normalized = token.replace(/\\/g, "/");
  out.add(normalized);
  const segments = normalized.split("/").filter(Boolean);
  for (const segment of segments) {
    out.add(segment);
    if (segment.includes("-") || segment.includes("_")) {
      for (const part of segment.split(/[-_]/g)) {
        const trimmed = part.trim();
        if (trimmed.length >= 3) {
          out.add(trimmed);
        }
      }
    }
  }
  const last = segments.length > 0 ? segments[segments.length - 1] : normalized;
  if (last.includes(".")) {
    out.add(last);
    const stem = last.replace(/\.[^.]+$/, "");
    if (stem && stem.length >= 3) {
      out.add(stem);
    }
  }
  return Array.from(out);
}

function toTokenSet(text: string): Set<string> {
  const normalizeToken = (token: string): string =>
    token
      .replace(/^[\"'`]+/g, "")
      .replace(/[\"'`.,;:!?]+$/g, "")
      .trim();
  const tokens = filterSignalTokens(tokenizeAskQuery(text))
    .map((token) => normalizeToken(token))
    .flatMap((token) => expandPathToken(token))
    .map((token) => normalizeToken(token))
    .filter((token) => token.length >= 3);
  return new Set(tokens);
}

function computeCoverageSummary(input: HelixAskPlatonicInput): HelixAskCoverageSummary {
  const questionTokens = Array.from(toTokenSet(input.question));
  const tokenCount = questionTokens.length;
  const referenceText = [
    input.evidenceText,
    input.repoScaffold,
    input.promptScaffold,
    input.generalScaffold,
  ]
    .filter(Boolean)
    .join("\n\n");
  const referenceTokens = referenceText ? toTokenSet(referenceText) : new Set<string>();
  const keyTokens = questionTokens.filter((token) => {
    if (COMMON_QUERY_TOKENS.has(token)) return false;
    if (input.domain === "hybrid" && CONCEPTUAL_TOKENS.has(token)) return false;
    return token.length >= 5;
  });
  const keyCount = keyTokens.length;
  if (keyCount === 0) {
    return {
      tokenCount,
      keyCount: 0,
      missingKeyCount: 0,
      coverageRatio: 1,
      missingKeys: [],
    };
  }
  const missingKeys = keyTokens.filter((token) => !referenceTokens.has(token));
  const missingKeyCount = missingKeys.length;
  const coverageRatio = keyCount > 0 ? (keyCount - missingKeyCount) / keyCount : 0;
  return {
    tokenCount,
    keyCount,
    missingKeyCount,
    coverageRatio,
    missingKeys: missingKeys.slice(0, 6),
  };
}

function applyCoverageGate(
  input: HelixAskPlatonicInput,
  summary: HelixAskCoverageSummary,
): { answer: string; applied: boolean; reason?: string } {
  if (!COVERAGE_GATE_ENABLED) {
    return { answer: input.answer, applied: false };
  }
  if (input.intentId === "hybrid.composite_system_synthesis") {
    return { answer: input.answer, applied: false, reason: "composite_skip" };
  }
  if (input.domain !== "repo" && input.domain !== "hybrid" && input.domain !== "falsifiable") {
    return { answer: input.answer, applied: false };
  }
  if (!input.evidenceText || input.evidenceText.trim().length === 0) {
    return { answer: input.answer, applied: false };
  }
  if (summary.keyCount === 0) {
    return { answer: input.answer, applied: false };
  }
  if (summary.coverageRatio >= COVERAGE_MIN_RATIO) {
    return { answer: input.answer, applied: false };
  }
  if (summary.missingKeyCount === 0) {
    return { answer: input.answer, applied: false };
  }
  const missingList = summary.missingKeys.join(", ");
  const guarded = missingList
    ? `Repo evidence did not cover key terms from the question (${missingList}). Please point to the relevant files or narrow the request.`
    : "Repo evidence did not cover key terms from the question. Please point to the relevant files or narrow the request.";
  return { answer: guarded, applied: true, reason: "missing_key_terms" };
}

function computeBeliefSummary(input: HelixAskPlatonicInput): HelixAskBeliefSummary {
  const claims = splitSentences(input.answer);
  if (claims.length === 0) {
    return {
      claimCount: 0,
      supportedCount: 0,
      unsupportedCount: 0,
      unsupportedRate: 0,
      contradictionCount: 0,
    };
  }
  const evidenceText = [
    input.evidenceText,
    input.repoScaffold,
    input.generalScaffold,
    input.promptScaffold,
  ]
    .filter(Boolean)
    .join("\n\n");
  const evidenceTokens = evidenceText ? toTokenSet(evidenceText) : new Set<string>();
  const questionTokens = toTokenSet(input.question);
  let supportedCount = 0;
  let unsupportedCount = 0;
  for (const claim of claims) {
    if (extractFilePathsFromText(claim).length > 0) {
      supportedCount += 1;
      continue;
    }
    if (evidenceTokens.size === 0) {
      unsupportedCount += 1;
      continue;
    }
    const claimTokens = toTokenSet(claim);
    if (claimTokens.size === 0) {
      unsupportedCount += 1;
      continue;
    }
    const novelTokens = Array.from(claimTokens).filter((token) => !questionTokens.has(token));
    if (novelTokens.length === 0) {
      supportedCount += 1;
      continue;
    }
    let novelOverlap = 0;
    for (const token of novelTokens) {
      if (evidenceTokens.has(token)) {
        novelOverlap += 1;
      }
    }
    const novelRatio = novelOverlap / novelTokens.length;
    if (novelRatio >= BELIEF_NOVEL_MIN_RATIO) {
      supportedCount += 1;
    } else {
      unsupportedCount += 1;
    }
  }
  const unsupportedRate = claims.length > 0 ? unsupportedCount / claims.length : 0;
  const lower = input.answer.toLowerCase();
  const contradictionCount =
    lower.includes("fail") && lower.includes("pass") ? 1 : 0;
  return {
    claimCount: claims.length,
    supportedCount,
    unsupportedCount,
    unsupportedRate,
    contradictionCount,
  };
}

const CONSTRAINT_LINE_RE =
  /^(gate:|status:|residuals:|constraints:|violations:|certificate:|integrity_ok:|source:)/i;

const ensureUnique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

function buildBeliefGraphSummary(
  input: HelixAskPlatonicInput,
  claimsOverride?: ClaimNode[],
): HelixAskBeliefGraphSummary {
  const claims = claimsOverride ?? buildClaimNodes(input.answer);
  const evidenceText = [
    input.evidenceText,
    input.repoScaffold,
    input.generalScaffold,
    input.promptScaffold,
  ]
    .filter(Boolean)
    .join("\n\n");
  const evidenceTokens = evidenceText ? toTokenSet(evidenceText) : new Set<string>();
  const evidenceRefs = ensureUnique(extractFilePathsFromText(evidenceText));
  const constraintLines = evidenceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => CONSTRAINT_LINE_RE.test(line));
  const constraintCount = constraintLines.length;
  let supports = 0;
  let mapsTo = 0;
  let dependsOn = 0;
  let contradicts = 0;
  const unsupportedClaimIds: string[] = [];
  const contradictionIds = new Set<string>();

  for (const claim of claims) {
    const hasEvidenceRef = claim.evidenceRefs.length > 0;
    if (hasEvidenceRef) {
      mapsTo += claim.evidenceRefs.length;
    }
    const supported = hasEvidenceRef || isClaimSupported(claim.tokens, evidenceTokens);
    if (supported) {
      supports += 1;
    } else {
      unsupportedClaimIds.push(claim.id);
    }
  }

  for (let i = 0; i < claims.length; i += 1) {
    const claim = claims[i];
    if (!claim.isConclusion) continue;
    for (let j = 0; j < claims.length; j += 1) {
      if (i === j) continue;
      const overlap = countTokenOverlap(claim.tokens, claims[j]?.tokens ?? new Set<string>());
      if (overlap >= 2) {
        const ratio = overlap / Math.max(1, Math.min(claim.tokens.size, claims[j].tokens.size));
        if (ratio >= 0.2) {
          dependsOn += 1;
        }
      }
    }
  }

  for (let i = 0; i < claims.length; i += 1) {
    for (let j = i + 1; j < claims.length; j += 1) {
      const a = claims[i];
      const b = claims[j];
      if (!a || !b) continue;
      if (a.hasNegation === b.hasNegation) continue;
      const overlap = countTokenOverlap(a.tokens, b.tokens);
      if (overlap < 2) continue;
      const ratio = overlap / Math.max(1, Math.min(a.tokens.size, b.tokens.size));
      if (ratio >= 0.3) {
        contradicts += 1;
        contradictionIds.add(a.id);
        contradictionIds.add(b.id);
      }
    }
  }

  const definitionCount = claims.filter((claim) => claim.isDefinition).length;
  const conclusionCount = claims.filter((claim) => claim.isConclusion).length;
  const edgeCount = supports + mapsTo + dependsOn + contradicts;
  const nodeCount = claims.length + evidenceRefs.length + constraintCount;
  const claimIds = claims.map((claim) => claim.id).slice(0, 8);
  return {
    nodeCount,
    edgeCount,
    claimCount: claims.length,
    definitionCount,
    conclusionCount,
    evidenceRefCount: evidenceRefs.length,
    constraintCount,
    edgeCounts: {
      supports,
      contradicts,
      depends_on: dependsOn,
      maps_to: mapsTo,
    },
    claimIds,
    unsupportedClaimIds: unsupportedClaimIds.slice(0, 8),
    contradictionIds: Array.from(contradictionIds).slice(0, 8),
  };
}

function conceptEvidenceAnchored(input: HelixAskPlatonicInput): boolean {
  const match = input.conceptMatch;
  if (!match) return false;
  const sourcePath = match.card.sourcePath.toLowerCase();
  const evidencePaths = (input.evidencePaths ?? [])
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (sourcePath && evidencePaths.some((path) => path === sourcePath || path.endsWith(sourcePath))) {
    return true;
  }
  const evidenceText = [
    input.evidenceText,
    input.repoScaffold,
    input.generalScaffold,
    input.promptScaffold,
  ]
    .filter(Boolean)
    .join("\n\n")
    .toLowerCase();
  if (!evidenceText) return false;
  if (sourcePath && evidenceText.includes(sourcePath)) {
    return true;
  }
  const evidenceTokens = toTokenSet(evidenceText);
  if (evidenceTokens.has(match.card.id.toLowerCase())) {
    return true;
  }
  return match.card.aliases.some((alias) => evidenceTokens.has(alias.toLowerCase()));
}

function applyBeliefGate(
  input: HelixAskPlatonicInput,
  summary: HelixAskBeliefSummary,
): { answer: string; applied: boolean; reason?: string } {
  if (!BELIEF_GATE_ENABLED) {
    return { answer: input.answer, applied: false };
  }
  if (input.domain === "general") {
    return { answer: input.answer, applied: false };
  }
  if (!input.evidenceText || input.evidenceText.trim().length === 0) {
    return { answer: input.answer, applied: false };
  }
  // Concept-anchored answers can be legitimate even when token overlap is thin.
  if (conceptEvidenceAnchored(input)) {
    return { answer: input.answer, applied: false };
  }
  if (summary.unsupportedRate < BELIEF_UNSUPPORTED_MAX) {
    return { answer: input.answer, applied: false };
  }
  const guarded =
    "Available evidence was weakly reflected in the answer. Please narrow the request or specify the relevant files.";
  return { answer: guarded, applied: true, reason: "unsupported_rate" };
}

type VariantCandidate = {
  label: string;
  answer: string;
  claims: ClaimNode[];
  keptRatio: number;
  sentenceCount: number;
  beliefSummary: HelixAskBeliefSummary;
  beliefGraphSummary: HelixAskBeliefGraphSummary;
  rattlingScore: number;
  rattlingDetail: HelixAskRattlingDetail;
  penalty: number;
};

const buildVariantAnswer = (claims: ClaimNode[]): string =>
  claims
    .map((claim) => claim.text.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

const isQuestionAligned = (tokens: Set<string>, questionTokens: Set<string>): boolean => {
  if (tokens.size === 0 || questionTokens.size === 0) return false;
  const overlap = countTokenOverlap(tokens, questionTokens);
  if (overlap < QUESTION_ALIGNMENT_MIN_TOKENS) return false;
  const ratio = overlap / tokens.size;
  return ratio >= QUESTION_ALIGNMENT_MIN_RATIO;
};

const computeVariantPenalty = (
  beliefSummary: HelixAskBeliefSummary,
  beliefGraphSummary: HelixAskBeliefGraphSummary,
  rattlingScore: number,
): number => {
  const contradictionPenalty =
    beliefGraphSummary.edgeCounts.contradicts > 0
      ? Math.min(1, beliefGraphSummary.edgeCounts.contradicts * 0.25)
      : 0;
  const rattlingPenalty = rattlingScore * 0.6;
  return beliefSummary.unsupportedRate + contradictionPenalty + rattlingPenalty;
};

const evaluateVariantCandidate = (
  input: HelixAskPlatonicInput,
  label: string,
  claims: ClaimNode[],
  baseCount: number,
): VariantCandidate => {
  const answer = label === "base" ? input.answer : buildVariantAnswer(claims);
  const candidateInput: HelixAskPlatonicInput = { ...input, answer };
  const beliefSummary = computeBeliefSummary(candidateInput);
  const beliefGraphSummary = buildBeliefGraphSummary(candidateInput, claims);
  const rattling = computeRattlingSummary(candidateInput, claims);
  const keptRatio = baseCount > 0 ? claims.length / baseCount : 1;
  const penalty = computeVariantPenalty(beliefSummary, beliefGraphSummary, rattling.score);
  return {
    label,
    answer,
    claims,
    keptRatio,
    sentenceCount: claims.length,
    beliefSummary,
    beliefGraphSummary,
    rattlingScore: rattling.score,
    rattlingDetail: rattling.detail,
    penalty,
  };
};

const shouldSkipVariantSelection = (input: HelixAskPlatonicInput, claims: ClaimNode[]): string | null => {
  if (!VARIANT_SELECTION_ENABLED) return "disabled";
  if (input.domain === "general") return "general_domain";
  if (!input.evidenceText?.trim()) return "missing_evidence";
  if (LIST_STRUCTURE_RE.test(input.answer)) return "list_format";
  if (claims.length < VARIANT_MIN_SENTENCES) return "short_answer";
  return null;
};

const chooseVariantCandidate = (
  input: HelixAskPlatonicInput,
): {
  answer: string;
  claims: ClaimNode[];
  summary?: HelixAskVariantSummary;
  beliefGraphSummary?: HelixAskBeliefGraphSummary;
} => {
  const baseClaims = buildClaimNodes(input.answer);
  const skipReason = shouldSkipVariantSelection(input, baseClaims);
  if (skipReason) {
    return {
      answer: input.answer,
      claims: baseClaims,
      summary: VARIANT_SELECTION_ENABLED
        ? { applied: false, reason: skipReason, candidateCount: baseClaims.length ? 1 : 0 }
        : undefined,
    };
  }
  const evidenceText = [
    input.evidenceText,
    input.repoScaffold,
    input.generalScaffold,
    input.promptScaffold,
  ]
    .filter(Boolean)
    .join("\n\n");
  const evidenceTokens = evidenceText ? toTokenSet(evidenceText) : new Set<string>();
  if (evidenceTokens.size === 0) {
    return {
      answer: input.answer,
      claims: baseClaims,
      summary: { applied: false, reason: "missing_evidence_tokens", candidateCount: 1 },
    };
  }
  const questionTokens = toTokenSet(input.question);
  const signals = baseClaims.map((claim) => ({
    claim,
    supported: claim.evidenceRefs.length > 0 || isClaimSupported(claim.tokens, evidenceTokens),
    questionAligned: isQuestionAligned(claim.tokens, questionTokens),
  }));
  const baseCount = baseClaims.length;
  const baseCandidate = evaluateVariantCandidate(input, "base", baseClaims, baseCount);
  const candidates: VariantCandidate[] = [baseCandidate];
  const addCandidate = (label: string, filtered: ClaimNode[]) => {
    if (filtered.length === 0) return;
    if (filtered.length < VARIANT_MIN_SENTENCES) return;
    if (baseCount > 0 && filtered.length / baseCount < VARIANT_MIN_RATIO) return;
    const answer = buildVariantAnswer(filtered);
    if (!answer || answer === input.answer) return;
    candidates.push(evaluateVariantCandidate(input, label, filtered, baseCount));
  };
  addCandidate(
    "supported_only",
    signals.filter((entry) => entry.supported).map((entry) => entry.claim),
  );
  addCandidate(
    "question_aligned",
    signals
      .filter((entry) => entry.supported || entry.questionAligned)
      .map((entry) => entry.claim),
  );
  if (candidates.length <= 1) {
    return {
      answer: input.answer,
      claims: baseClaims,
      summary: { applied: false, reason: "no_variants", candidateCount: candidates.length },
      beliefGraphSummary: baseCandidate.beliefGraphSummary,
    };
  }
  const sorted = [...candidates].sort((a, b) => a.penalty - b.penalty);
  const best = sorted[0];
  const improvementEpsilon = 0.02;
  const improvesUnsupported =
    best.beliefSummary.unsupportedRate + 0.01 < baseCandidate.beliefSummary.unsupportedRate;
  const improvesContradictions =
    best.beliefGraphSummary.edgeCounts.contradicts <
    baseCandidate.beliefGraphSummary.edgeCounts.contradicts;
  const improvesRattling = best.rattlingScore + 0.05 < baseCandidate.rattlingScore;
  const improvedSignal = improvesUnsupported || improvesContradictions || improvesRattling;
  const improved = best.penalty + improvementEpsilon < baseCandidate.penalty && improvedSignal;
  if (!improved || best.label === "base") {
    return {
      answer: input.answer,
      claims: baseClaims,
      summary: { applied: false, reason: "no_improvement", candidateCount: candidates.length },
      beliefGraphSummary: baseCandidate.beliefGraphSummary,
    };
  }
  return {
    answer: best.answer,
    claims: best.claims,
    summary: {
      applied: true,
      reason: "penalty_improved",
      selectedLabel: best.label,
      candidateCount: candidates.length,
    },
    beliefGraphSummary: best.beliefGraphSummary,
  };
};

function computeRattlingSummary(
  input: HelixAskPlatonicInput,
  claimsOverride?: ClaimNode[],
): { score: number; detail: HelixAskRattlingDetail } {
  const reference =
    input.repoScaffold || input.generalScaffold || input.promptScaffold || input.evidenceText || "";
  const answerTokens = toTokenSet(input.answer);
  const referenceTokens = reference ? toTokenSet(reference) : new Set<string>();
  const baseDistance = referenceTokens.size
    ? jaccardDistanceForSets(answerTokens, referenceTokens)
    : 0;

  if (!RATTLING_PERTURB_ENABLED) {
    return {
      score: baseDistance,
      detail: { baseDistance, perturbationDistance: 0, claimSetCount: 0 },
    };
  }

  const claims = claimsOverride ?? buildClaimNodes(input.answer);
  const tokenSets: Set<string>[] = [];
  const questionTokens = toTokenSet(input.question);
  if (questionTokens.size > 0) tokenSets.push(questionTokens);
  if (input.evidenceText?.trim()) tokenSets.push(toTokenSet(input.evidenceText));
  if (input.repoScaffold?.trim()) tokenSets.push(toTokenSet(input.repoScaffold));
  if (input.generalScaffold?.trim()) tokenSets.push(toTokenSet(input.generalScaffold));
  if (input.promptScaffold?.trim()) tokenSets.push(toTokenSet(input.promptScaffold));

  const claimSets = tokenSets.map((tokens) => buildClaimSupportSet(claims, tokens));
  let perturbationDistance = 0;
  if (claimSets.length >= 2) {
    for (let i = 0; i < claimSets.length; i += 1) {
      for (let j = i + 1; j < claimSets.length; j += 1) {
        const distance = jaccardDistanceForSets(claimSets[i], claimSets[j]);
        if (distance > perturbationDistance) perturbationDistance = distance;
      }
    }
  }

  const score = Math.max(baseDistance, perturbationDistance);
  return {
    score,
    detail: {
      baseDistance,
      perturbationDistance,
      claimSetCount: claimSets.length,
    },
  };
}

function applyRattlingGate(input: HelixAskPlatonicInput, score: number): boolean {
  if (!RATTLING_GATE_ENABLED) return false;
  if (input.domain === "general") return false;
  if (!input.evidenceText) return false;
  return score >= RATTLING_MAX;
}

export function applyHelixAskPlatonicGates(input: HelixAskPlatonicInput): HelixAskPlatonicResult {
  const junkClean = stripJunkFragments(input.answer);
  const junkInput: HelixAskPlatonicInput = { ...input, answer: junkClean.answer };
  const ideologyOverride = applyIdeologyConceptOverride(junkInput);
  const overrideInput: HelixAskPlatonicInput = { ...junkInput, answer: ideologyOverride.answer };
  const conceptLint = applyConceptLint(overrideInput);
  const lintedInput: HelixAskPlatonicInput = { ...overrideInput, answer: conceptLint.answer };
  const physicsLint = applyPhysicsLint(lintedInput);
  const physicsInput: HelixAskPlatonicInput = { ...lintedInput, answer: physicsLint.answer };
  const coverageSummary = computeCoverageSummary(physicsInput);
  const coverageGate = applyCoverageGate(physicsInput, coverageSummary);
  const coverageInput: HelixAskPlatonicInput = { ...physicsInput, answer: coverageGate.answer };
  let variantSummary: HelixAskVariantSummary | undefined;
  let variantClaims = buildClaimNodes(coverageInput.answer);
  let variantInput = coverageInput;
  let variantGraphSummary: HelixAskBeliefGraphSummary | undefined;
  if (!coverageGate.applied) {
    const variantResult = chooseVariantCandidate(coverageInput);
    variantSummary = variantResult.summary;
    variantClaims = variantResult.claims;
    variantInput = { ...coverageInput, answer: variantResult.answer };
    variantGraphSummary = variantResult.beliefGraphSummary;
  }
  const beliefSummary = computeBeliefSummary(variantInput);
  const beliefGraphSummary =
    variantGraphSummary ?? buildBeliefGraphSummary(variantInput, variantClaims);
  const beliefGate = coverageGate.applied
    ? { answer: variantInput.answer, applied: false as const }
    : applyBeliefGate(variantInput, beliefSummary);
  const gatedInput: HelixAskPlatonicInput = { ...variantInput, answer: beliefGate.answer };
  const rattling = computeRattlingSummary(
    gatedInput,
    beliefGate.applied ? undefined : variantClaims,
  );
  const rattlingScore = rattling.score;
  const rattlingGateApplied =
    !coverageGate.applied &&
    !beliefGate.applied &&
    applyRattlingGate(gatedInput, rattlingScore);
  let answer = gatedInput.answer;
  if (
    rattlingGateApplied &&
    (gatedInput.domain === "repo" || gatedInput.domain === "falsifiable")
  ) {
    answer =
      "Answer drifted too far from the provided evidence. Please narrow the request or specify the relevant files.";
  }
  return {
    answer,
    junkCleanApplied: junkClean.applied,
    junkCleanReasons: ideologyOverride.applied
      ? [...junkClean.reasons, ideologyOverride.reason ?? "ideology_override"]
      : junkClean.reasons,
    conceptLintApplied: conceptLint.applied,
    conceptLintReasons: conceptLint.reasons,
    physicsLintApplied: physicsLint.applied,
    physicsLintReasons: physicsLint.reasons,
    coverageSummary,
    coverageGateApplied: coverageGate.applied,
    coverageGateReason: coverageGate.reason,
    beliefSummary,
    beliefGraphSummary,
    beliefGateApplied: beliefGate.applied,
    beliefGateReason: beliefGate.reason,
    rattlingScore,
    rattlingGateApplied,
    rattlingDetail: rattling.detail,
    variantSummary,
  };
}
