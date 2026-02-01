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

const buildEligibilityTokens = (question: string, signalTokens?: string[]): string[] => {
  const baseTokens = filterCriticTokens(tokenizeAskQuery(question));
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
  const tokens = buildEligibilityTokens(question, options.signalTokens);
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
  const tokens = buildEligibilityTokens(question, options.signalTokens);
  const tokenCount = tokens.length;
  if (!contextText || tokenCount === 0) {
    return { ok: false, matchCount: 0, tokenCount, matchRatio: 0 };
  }
  const matchCount = countTokenMatches(tokens, contextText);
  const matchRatio = tokenCount > 0 ? matchCount / tokenCount : 0;
  const ok = matchCount >= options.minTokens && matchRatio >= options.minRatio;
  return { ok, matchCount, tokenCount, matchRatio };
}
