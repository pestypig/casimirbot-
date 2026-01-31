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
  beliefGateApplied: boolean;
  beliefGateReason?: string;
  rattlingScore: number;
  rattlingGateApplied: boolean;
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
const RATTLING_MAX = Number(process.env.HELIX_ASK_RATTLING_MAX ?? 0.8);
const CONCEPT_MAX_SENTENCES = 3;

const SYSTEM_TERMS =
  /\b(helix ask|this system|repo|repository|codebase|server\/|client\/|api\/|endpoint|constraint gate|certificate|admissible|verified|integrity_ok)\b/i;

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

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
  "explain",
  "explanation",
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

function jaccardDistance(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  if (union <= 0) return 1;
  const similarity = intersection / union;
  return 1 - similarity;
}

function computeRattlingScore(input: HelixAskPlatonicInput): number {
  const reference =
    input.repoScaffold || input.generalScaffold || input.promptScaffold || input.evidenceText || "";
  if (!reference) return 0;
  const answerTokens = toTokenSet(input.answer);
  const referenceTokens = toTokenSet(reference);
  return jaccardDistance(answerTokens, referenceTokens);
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
  const beliefSummary = computeBeliefSummary(coverageInput);
  const beliefGate = coverageGate.applied
    ? { answer: coverageInput.answer, applied: false as const }
    : applyBeliefGate(coverageInput, beliefSummary);
  const gatedInput: HelixAskPlatonicInput = { ...coverageInput, answer: beliefGate.answer };
  const rattlingScore = computeRattlingScore(gatedInput);
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
    beliefGateApplied: beliefGate.applied,
    beliefGateReason: beliefGate.reason,
    rattlingScore,
    rattlingGateApplied,
  };
}
