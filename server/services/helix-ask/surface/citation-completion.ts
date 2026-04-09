import type { AgiEvidence } from "@shared/agi-refinery";
import { isRestrictedEvidencePath } from "../../agi/refinery-gates";
import {
  normalizeEvidencePath,
  normalizeEvidenceRef,
} from "../../agi/refinery-identity";
import { buildEvidenceKey, mergeEvidence } from "../retrieval/evidence-merging";

const CITATION_COMPLETION_CLAIM_PATTERN =
  /\b(is|are|does|returns|means|implements|uses|adds|removes|updates|exposes|requires|includes|defined|located|calls|builds|runs|function|class|module|endpoint|route|api|handler|schema|component|service|config)\b/i;
const CITATION_COMPLETION_FILE_PATTERN =
  /\b[a-z0-9_.-]+\.(ts|tsx|js|jsx|json|md|yml|yaml|py|go|rs|java|cpp|c|h)\b/i;
const CITATION_COMPLETION_MAX = (() => {
  const parsed = Number(process.env.AGI_REFINERY_CITATION_COMPLETION_MAX);
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(Math.max(1, Math.floor(parsed)), 64);
})();
const CITATION_COMPLETION_MIN = (() => {
  const parsed = Number(process.env.AGI_REFINERY_CITATION_COMPLETION_MIN);
  if (!Number.isFinite(parsed)) return 2;
  return Math.min(Math.max(0, Math.floor(parsed)), CITATION_COMPLETION_MAX);
})();
const CITATION_COMPLETION_RATIO = (() => {
  const parsed = Number(process.env.AGI_REFINERY_CITATION_COMPLETION_RATIO);
  if (!Number.isFinite(parsed)) return 0.5;
  return Math.min(Math.max(0, parsed), 1);
})();

const isStructuredCitationToken = (value: string): boolean =>
  /^(?:gate|certificate):/i.test(value.trim());

const hasCitationClaim = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  return (
    CITATION_COMPLETION_CLAIM_PATTERN.test(normalized) ||
    CITATION_COMPLETION_FILE_PATTERN.test(normalized)
  );
};

const collectEvidenceTokens = (item: AgiEvidence): string[] => {
  const tokens = new Set<string>();
  const path = normalizeEvidenceRef(item.path);
  if (path) {
    tokens.add(path);
    const base = path.split("/").pop();
    if (base) tokens.add(base);
  }
  if (item.id) tokens.add(item.id.toLowerCase());
  if (Array.isArray(item.keys)) {
    item.keys.forEach((key) => tokens.add(String(key).toLowerCase()));
  }
  if (item.extra && typeof item.extra === "object") {
    const extra = item.extra as { snippetId?: unknown; symbolName?: unknown };
    if (typeof extra.snippetId === "string") {
      tokens.add(extra.snippetId.toLowerCase());
    }
    if (typeof extra.symbolName === "string") {
      tokens.add(extra.symbolName.toLowerCase());
    }
  }
  return Array.from(tokens).filter((token) => token.length >= 3);
};

const scoreEvidence = (textLower: string, item: AgiEvidence): number => {
  let score = 0;
  for (const token of collectEvidenceTokens(item)) {
    if (textLower.includes(token)) score += 1;
  }
  return score;
};

const normalizeCitationRef = (value: string): string =>
  normalizeEvidenceRef(value) ?? "";

const buildEvidenceTokenSet = (items: AgiEvidence[]): string[] => {
  const tokens = new Set<string>();
  for (const item of items) {
    collectEvidenceTokens(item).forEach((token) => tokens.add(token));
    if (item.path) {
      const normalized = normalizeCitationRef(item.path);
      if (normalized) tokens.add(normalized);
    }
  }
  return Array.from(tokens);
};

const citationMatchesEvidence = (
  citation: string,
  evidenceTokens: string[],
): boolean => {
  const normalized = normalizeCitationRef(citation);
  if (!normalized) return false;
  for (const token of evidenceTokens) {
    if (!token) continue;
    if (normalized === token) return true;
    if (normalized.endsWith(token)) return true;
    if (token.endsWith(normalized)) return true;
  }
  return false;
};

type CitationLinkStats = {
  hasClaim: boolean;
  citationCount: number;
  linkedCount: number;
  recall: number;
};

const normalizeVisibleCitationPath = (value: string): string | null => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (isStructuredCitationToken(trimmed) || /^https?:/i.test(trimmed)) return trimmed;
  const normalized =
    normalizeEvidencePath(trimmed, {
      repoRoot: process.cwd(),
      stripDecorators: true,
      stripPrefixes: true,
      stripCitationSuffix: true,
      normalizeExtensions: false,
      lowercase: false,
    }) ?? trimmed;
  const repoRelative = normalized.replace(/\\/g, "/").replace(/^\.\/+/, "").trim();
  if (!repoRelative || repoRelative.includes(",")) return null;
  if (/^[A-Za-z]:\//.test(repoRelative) || repoRelative.startsWith("../")) return null;
  return repoRelative;
};

const normalizeCitations = (citations: string[]): string[] =>
  Array.from(
    new Set(
      citations
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .map((value) => normalizeVisibleCitationPath(value) ?? String(value).trim())
        .filter((value) => value.length > 0),
    ),
  );

const computeCitationLinkStats = (args: {
  citations: string[];
  evidence: AgiEvidence[];
  hasClaim: boolean;
}): CitationLinkStats => {
  const normalized = normalizeCitations(args.citations);
  const evidenceTokens = buildEvidenceTokenSet(args.evidence);
  let linkedCount = 0;
  for (const citation of normalized) {
    if (citationMatchesEvidence(citation, evidenceTokens)) linkedCount += 1;
  }
  if (!args.hasClaim) {
    return {
      hasClaim: args.hasClaim,
      citationCount: normalized.length,
      linkedCount,
      recall: 1,
    };
  }
  if (normalized.length === 0 || evidenceTokens.length === 0) {
    return {
      hasClaim: args.hasClaim,
      citationCount: normalized.length,
      linkedCount,
      recall: 0,
    };
  }
  return {
    hasClaim: args.hasClaim,
    citationCount: normalized.length,
    linkedCount,
    recall: linkedCount / normalized.length,
  };
};

const resolveCitationValue = (item: AgiEvidence): string | undefined => {
  if (item.path && !isRestrictedEvidencePath(item.path)) return item.path;
  if (item.id) return item.id;
  if (item.hash) return item.hash;
  return undefined;
};

export type CitationCompletionMetrics = {
  candidateRecallPreCompletion: number;
  candidateRecallPostCompletion: number;
  selectedRecallPreCompletion: number;
  selectedRecallPostCompletion: number;
  citationsPreCompletion: number;
  citationsPostCompletion: number;
  completionQueriesCount: number;
  completionLatencyMs: number;
};

type SafeRetrievalFallbackResult = {
  candidates: AgiEvidence[];
  selected: AgiEvidence[];
};

export const completeHelixAskCitations = async (args: {
  outputText: string;
  citations: string[];
  retrievalCandidates: AgiEvidence[];
  retrievalSelected: AgiEvidence[];
  searchQuery?: string;
  buildSafeRetrievalFallback: (
    searchQuery?: string,
  ) => Promise<SafeRetrievalFallbackResult>;
}): Promise<{
  citations: string[];
  retrievalCandidates: AgiEvidence[];
  retrievalSelected: AgiEvidence[];
  added: boolean;
  metrics: CitationCompletionMetrics;
}> => {
  const completionStart = Date.now();
  let completionQueriesCount = 0;
  const baseCitations = normalizeCitations(args.citations);
  const outputText = args.outputText.trim();
  const forceCompletion =
    process.env.AGI_REFINERY_CITATION_COMPLETION_FORCE === "1";
  const hasClaim = forceCompletion
    ? outputText.length > 0 || baseCitations.length > 0
    : hasCitationClaim(outputText);
  const preCandidateStats = computeCitationLinkStats({
    citations: baseCitations,
    evidence: args.retrievalCandidates,
    hasClaim,
  });
  const preSelectedStats = computeCitationLinkStats({
    citations: baseCitations,
    evidence: args.retrievalSelected,
    hasClaim,
  });

  const finalize = (result: {
    citations: string[];
    retrievalCandidates: AgiEvidence[];
    retrievalSelected: AgiEvidence[];
    added: boolean;
  }) => {
    const finalCitations = normalizeCitations(result.citations);
    const nextSelected =
      finalCitations.length > 0 && result.retrievalSelected.length === 0
        ? mergeEvidence(result.retrievalSelected, result.retrievalCandidates)
        : result.retrievalSelected;
    const postCandidateStats = computeCitationLinkStats({
      citations: finalCitations,
      evidence: result.retrievalCandidates,
      hasClaim,
    });
    const postSelectedStats = computeCitationLinkStats({
      citations: finalCitations,
      evidence: nextSelected,
      hasClaim,
    });
    return {
      citations: finalCitations,
      retrievalCandidates: result.retrievalCandidates,
      retrievalSelected: nextSelected,
      added: result.added,
      metrics: {
        candidateRecallPreCompletion: preCandidateStats.recall,
        candidateRecallPostCompletion: postCandidateStats.recall,
        selectedRecallPreCompletion: preSelectedStats.recall,
        selectedRecallPostCompletion: postSelectedStats.recall,
        citationsPreCompletion: baseCitations.length,
        citationsPostCompletion: finalCitations.length,
        completionQueriesCount,
        completionLatencyMs: Math.max(0, Date.now() - completionStart),
      },
    };
  };

  if (!hasClaim && baseCitations.length === 0) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates: args.retrievalCandidates,
      retrievalSelected: args.retrievalSelected,
      added: false,
    });
  }

  let retrievalCandidates = args.retrievalCandidates;
  let retrievalSelected = args.retrievalSelected;
  if (retrievalCandidates.length === 0 && retrievalSelected.length === 0) {
    if (args.searchQuery) completionQueriesCount += 1;
    const fallback = await args.buildSafeRetrievalFallback(args.searchQuery);
    if (fallback.candidates.length > 0) {
      retrievalCandidates = mergeEvidence(retrievalCandidates, fallback.candidates);
    }
    if (fallback.selected.length > 0) {
      retrievalSelected = mergeEvidence(retrievalSelected, fallback.selected);
    }
  }
  if (baseCitations.length > 0 && retrievalSelected.length === 0) {
    retrievalSelected = mergeEvidence(retrievalSelected, retrievalCandidates);
  }

  const targetEvidence = mergeEvidence(retrievalSelected, retrievalCandidates);
  const targetCount = Math.min(
    CITATION_COMPLETION_MAX,
    Math.max(
      CITATION_COMPLETION_MIN,
      Math.ceil(
        (
          targetEvidence.length > 0
            ? targetEvidence
            : retrievalSelected.length > 0
              ? retrievalSelected
              : retrievalCandidates
        ).length * CITATION_COMPLETION_RATIO,
      ),
    ),
  );
  const allowedEvidence =
    retrievalSelected.length > 0 ? retrievalSelected : retrievalCandidates;
  const allowedTokens = buildEvidenceTokenSet(allowedEvidence);
  const linkedCitations = baseCitations.filter((citation) =>
    citationMatchesEvidence(citation, allowedTokens),
  );
  const hasLinkedCitation = linkedCitations.length > 0;
  const removedUnlinked = linkedCitations.length !== baseCitations.length;

  if (
    baseCitations.length > 0 &&
    hasLinkedCitation &&
    !removedUnlinked &&
    baseCitations.length >= targetCount
  ) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates,
      retrievalSelected,
      added: false,
    });
  }
  if (baseCitations.length > 0 && hasLinkedCitation && removedUnlinked) {
    return finalize({
      citations: linkedCitations,
      retrievalCandidates,
      retrievalSelected,
      added: true,
    });
  }
  if (retrievalCandidates.length === 0 && retrievalSelected.length === 0) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates,
      retrievalSelected,
      added: false,
    });
  }

  const pool: Array<{ item: AgiEvidence; index: number }> = [];
  const seen = new Set<string>();
  let index = 0;
  const addToPool = (item: AgiEvidence): void => {
    const key = buildEvidenceKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({ item, index });
    index += 1;
  };
  retrievalSelected.forEach(addToPool);
  retrievalCandidates.forEach(addToPool);

  const textLower = outputText.toLowerCase();
  const ordered = pool
    .map(({ item, index }) => ({
      item,
      index,
      score: scoreEvidence(textLower, item),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const nextCitations: string[] = [...linkedCitations];
  const usedEvidence: AgiEvidence[] = [];
  for (const entry of ordered) {
    if (nextCitations.length >= CITATION_COMPLETION_MAX) break;
    if (nextCitations.length >= targetCount) break;
    const citation = resolveCitationValue(entry.item);
    if (!citation) continue;
    if (nextCitations.includes(citation)) continue;
    nextCitations.push(citation);
    usedEvidence.push(entry.item);
  }

  if (nextCitations.length === 0) {
    return finalize({
      citations: baseCitations,
      retrievalCandidates,
      retrievalSelected,
      added: false,
    });
  }

  const finalCitations = Array.from(new Set(nextCitations)).slice(
    0,
    CITATION_COMPLETION_MAX,
  );
  const nextCandidates = mergeEvidence(retrievalCandidates, usedEvidence);
  const nextSelected = mergeEvidence(retrievalSelected, usedEvidence);
  return finalize({
    citations: finalCitations,
    retrievalCandidates: nextCandidates,
    retrievalSelected: nextSelected,
    added: finalCitations.length !== baseCitations.length,
  });
};
