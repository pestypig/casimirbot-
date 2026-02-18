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

export type ClaimCitationLinkageFailReason =
  | "CLAIM_CITATION_LINK_MISSING"
  | "CLAIM_CITATION_LINK_WEAK";

export type ClaimCitationLinkageResult = {
  ok: boolean;
  claimCount: number;
  citationCount: number;
  linkedCount: number;
  unlinkedClaims: string[];
  failReason?: ClaimCitationLinkageFailReason;
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

const NON_EVIDENCE_LINE_RE = /navigation hint only;\s*no doc span bound\./i;

const stripNonEvidenceLines = (value: string): string => {
  if (!value) return value;
  return value
    .split(/\r?\n/)
    .filter((line) => !NON_EVIDENCE_LINE_RE.test(line))
    .join("\n");
};

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
const CITATION_PATH_RE =
  /\b[a-z0-9_./-]+\.(?:ts|tsx|js|jsx|json|md|yml|yaml|py|go|rs|java|cpp|c|h)\b/gi;
const CITATION_TOKEN_RE = /\b(?:gate|certificate):[a-z0-9_./:-]+\b/gi;
const SOURCES_LINE_RE = /^\s*sources?\s*:\s*(.+)$/i;

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
  const lower = stripNonEvidenceLines(haystack).toLowerCase();
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

const extractCitationTokens = (value: string): string[] => {
  if (!value) return [];
  const out = new Set<string>();
  const pathMatches = value.match(CITATION_PATH_RE) ?? [];
  for (const token of pathMatches) {
    out.add(token.trim());
  }
  const citeMatches = value.match(CITATION_TOKEN_RE) ?? [];
  for (const token of citeMatches) {
    out.add(token.trim());
  }
  return Array.from(out);
};

export function evaluateClaimCitationLinkage(
  answerText: string,
  citationHints: string[] = [],
): ClaimCitationLinkageResult {
  const claims = extractClaimCandidates(answerText, 12);
  const claimCount = claims.length;
  if (claimCount === 0) {
    return {
      ok: true,
      claimCount,
      citationCount: 0,
      linkedCount: 0,
      unlinkedClaims: [],
    };
  }

  const inlineCitationTokens = extractCitationTokens(answerText);
  const sourcesCitationTokens = answerText
    .split(/\r?\n/)
    .map((line) => line.match(SOURCES_LINE_RE))
    .filter((match): match is RegExpMatchArray => Boolean(match?.[1]))
    .flatMap((match) => extractCitationTokens(match[1]));
  const citations = uniqueTokens([
    ...inlineCitationTokens,
    ...sourcesCitationTokens,
    ...citationHints,
  ]);

  if (citations.length === 0) {
    return {
      ok: false,
      claimCount,
      citationCount: 0,
      linkedCount: 0,
      unlinkedClaims: claims,
      failReason: "CLAIM_CITATION_LINK_MISSING",
    };
  }

  const reserve = citations.slice();
  const unlinkedClaims: string[] = [];
  let linkedCount = 0;
  for (const claim of claims) {
    const claimCitations = extractCitationTokens(claim);
    if (claimCitations.length > 0) {
      linkedCount += 1;
      continue;
    }
    if (reserve.length > 0) {
      reserve.shift();
      linkedCount += 1;
      continue;
    }
    unlinkedClaims.push(claim);
  }

  if (unlinkedClaims.length > 0) {
    return {
      ok: false,
      claimCount,
      citationCount: citations.length,
      linkedCount,
      unlinkedClaims,
      failReason: "CLAIM_CITATION_LINK_WEAK",
    };
  }

  return {
    ok: true,
    claimCount,
    citationCount: citations.length,
    linkedCount,
    unlinkedClaims: [],
  };
}
