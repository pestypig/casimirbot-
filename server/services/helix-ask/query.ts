export type EvidenceEligibility = {
  ok: boolean;
  matchCount: number;
  tokenCount: number;
  matchRatio: number;
};

export type EvidenceEligibilityOptions = {
  minTokens: number;
  minRatio: number;
  signalTokens?: string[];
  useQuestionTokens?: boolean;
};

export type EvidenceClaimCoverageOptions = EvidenceEligibilityOptions & {
  minSupportRatio: number;
  minClaims?: number;
};

export type EvidenceClaimCoverage = {
  ok: boolean;
  claimCount: number;
  supportedCount: number;
  supportRatio: number;
  supported: string[];
  unsupported: string[];
};

const HELIX_ASK_STOP_TOKENS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "being",
  "this",
  "that",
  "these",
  "those",
  "does",
  "do",
  "how",
  "what",
  "why",
  "when",
  "where",
  "which",
  "who",
  "whom",
  "it",
  "its",
  "using",
  "as",
  "at",
  "by",
  "from",
  "about",
  "into",
  "over",
  "under",
  "up",
  "down",
  "vs",
  "versus",
  "than",
  "then",
]);

const HELIX_ASK_META_TOKENS = new Set([
  "answer",
  "answers",
  "brief",
  "bullet",
  "bullets",
  "cite",
  "citation",
  "citations",
  "clarify",
  "compare",
  "define",
  "defined",
  "definition",
  "detail",
  "details",
  "explain",
  "format",
  "include",
  "list",
  "paragraph",
  "paragraphs",
  "respond",
  "response",
  "second",
  "sentence",
  "sentences",
  "short",
  "step",
  "steps",
  "third",
  "two",
]);

export function tokenizeAskQuery(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9_/.:-]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export const filterSignalTokens = (tokens: string[]): string[] =>
  tokens.filter((token) => token.length >= 3 && !HELIX_ASK_STOP_TOKENS.has(token));

export const filterCriticTokens = (tokens: string[]): string[] =>
  filterSignalTokens(tokens).filter((token) => !HELIX_ASK_META_TOKENS.has(token));

const uniqueTokens = (tokens: string[]): string[] => Array.from(new Set(tokens));

const CLAIM_LINE_PREFIX = /^\s*(?:[-*]|\d+\.)\s+/;
const CLAIM_CITATION_RE =
  /\s*\([^)]*(?:\/|\.tsx?|\.jsx?|\.json|\.md|\.yml|gate:|certificate:)[^)]*\)\s*[.!?]*\s*$/gi;
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

const buildEligibilityTokens = (
  question: string,
  signalTokens?: string[],
  useQuestionTokens = true,
): string[] => {
  const baseTokens = useQuestionTokens ? filterCriticTokens(tokenizeAskQuery(question)) : [];
  if (!signalTokens || signalTokens.length === 0) {
    return baseTokens;
  }
  const extraTokens = signalTokens
    .flatMap((token) => tokenizeAskQuery(token))
    .flatMap((token) => filterCriticTokens([token]));
  return uniqueTokens([...baseTokens, ...extraTokens]);
};

const countTokenMatches = (tokens: string[], haystack: string): number => {
  if (!tokens.length) return 0;
  const lower = haystack.toLowerCase();
  let count = 0;
  for (const token of tokens) {
    if (lower.includes(token)) {
      count += 1;
    }
  }
  return count;
};

export function evaluateEvidenceEligibility(
  question: string,
  contextText: string,
  options: EvidenceEligibilityOptions,
): EvidenceEligibility {
  const tokens = buildEligibilityTokens(
    question,
    options.signalTokens,
    options.useQuestionTokens ?? true,
  );
  const tokenCount = tokens.length;
  if (!contextText || tokenCount === 0) {
    return { ok: false, matchCount: 0, tokenCount, matchRatio: 0 };
  }
  const matchCount = countTokenMatches(tokens, contextText);
  const matchRatio = tokenCount > 0 ? matchCount / tokenCount : 0;
  const ok = matchCount >= options.minTokens && matchRatio >= options.minRatio;
  return { ok, matchCount, tokenCount, matchRatio };
}

export function evaluateEvidenceCritic(
  question: string,
  contextText: string,
  options: EvidenceEligibilityOptions,
): EvidenceEligibility {
  const tokens = buildEligibilityTokens(
    question,
    options.signalTokens,
    options.useQuestionTokens ?? true,
  );
  const tokenCount = tokens.length;
  if (!contextText || tokenCount === 0) {
    return { ok: false, matchCount: 0, tokenCount, matchRatio: 0 };
  }
  const matchCount = countTokenMatches(tokens, contextText);
  const matchRatio = tokenCount > 0 ? matchCount / tokenCount : 0;
  const ok = matchCount >= options.minTokens && matchRatio >= options.minRatio;
  return { ok, matchCount, tokenCount, matchRatio };
}

const sanitizeClaimLine = (line: string): string => {
  if (!line) return "";
  const trimmed = line.trim();
  if (!trimmed) return "";
  const stripped = trimmed.replace(CLAIM_LINE_PREFIX, "").trim();
  if (!stripped) return "";
  return stripped.replace(CLAIM_CITATION_RE, "").trim();
};

const sentenceClaims = (text: string): string[] => {
  const sentences = text.split(SENTENCE_SPLIT).map((entry) => entry.trim()).filter(Boolean);
  return sentences.map((entry) => entry.replace(CLAIM_CITATION_RE, "").trim()).filter(Boolean);
};

export function extractClaimCandidates(text: string, limit: number): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    const tokens = filterCriticTokens(tokenizeAskQuery(cleaned));
    if (tokens.length < 2) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(cleaned);
  };
  const lines = text.split(/\r?\n/).map((line) => sanitizeClaimLine(line)).filter(Boolean);
  for (const line of lines) {
    push(line);
    if (out.length >= limit) return out.slice(0, limit);
  }
  if (out.length === 0) {
    const sentences = sentenceClaims(text);
    for (const sentence of sentences) {
      push(sentence);
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit);
}

export function evaluateClaimCoverage(
  claims: string[],
  contextText: string,
  options: EvidenceClaimCoverageOptions,
): EvidenceClaimCoverage {
  const minClaims = options.minClaims ?? 1;
  const claimCount = claims.length;
  if (claimCount < minClaims || !contextText) {
    return {
      ok: false,
      claimCount,
      supportedCount: 0,
      supportRatio: 0,
      supported: [],
      unsupported: claims.slice(),
    };
  }
  const supported: string[] = [];
  const unsupported: string[] = [];
  for (const claim of claims) {
    const coverage = evaluateEvidenceEligibility(claim, contextText, options);
    if (coverage.ok) {
      supported.push(claim);
    } else {
      unsupported.push(claim);
    }
  }
  const supportedCount = supported.length;
  const supportRatio = claimCount > 0 ? supportedCount / claimCount : 0;
  const ok = supportRatio >= options.minSupportRatio;
  return {
    ok,
    claimCount,
    supportedCount,
    supportRatio,
    supported,
    unsupported,
  };
}
