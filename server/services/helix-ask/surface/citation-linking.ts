import { normalizeEvidencePath } from "../../agi/refinery-identity";
import { extractFilePathsFromText } from "../paths";

const isStructuredCitationToken = (value: string): boolean =>
  /^(?:gate|certificate):/i.test(value.trim());

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

export type ClaimCitationSemanticLinkageScore = {
  claimCount: number;
  linkedClaimCount: number;
  linkRate: number;
  failReasons: Array<"CLAIM_CITATION_LINK_MISSING" | "CLAIM_CITATION_LINK_WEAK">;
};

export const collectSourcesLineCitationRefs = (value: string): string[] => {
  if (!value) return [];
  const refs: string[] = [];
  const lines = value.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*sources?\s*:\s*(.+)$/i);
    if (!match) continue;
    const parts = match[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    refs.push(...parts);
  }
  return normalizeCitations(refs);
};

export const scoreDeterministicClaimCitationLinkage = (args: {
  value: string;
  splitGroundedSentences: (text: string) => string[];
  extractCitationTokensFromText: (value: string) => string[];
}): ClaimCitationSemanticLinkageScore => {
  const claimSentences = args
    .splitGroundedSentences(args.value)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 20)
    .filter((sentence) => !/^sources?\s*:/i.test(sentence));
  if (claimSentences.length === 0) {
    return {
      claimCount: 0,
      linkedClaimCount: 0,
      linkRate: 1,
      failReasons: [],
    };
  }

  const citationRefs = normalizeCitations([
    ...extractFilePathsFromText(args.value),
    ...args.extractCitationTokensFromText(args.value),
    ...collectSourcesLineCitationRefs(args.value),
  ]);
  if (citationRefs.length === 0) {
    return {
      claimCount: claimSentences.length,
      linkedClaimCount: 0,
      linkRate: 0,
      failReasons: ["CLAIM_CITATION_LINK_MISSING"],
    };
  }

  const normalizedRefs = citationRefs.map((ref) => ref.toLowerCase());
  let linkedClaimCount = 0;
  for (const sentence of claimSentences) {
    const normalizedSentence = sentence.toLowerCase();
    const linked = normalizedRefs.some((ref) => normalizedSentence.includes(ref));
    if (linked) linkedClaimCount += 1;
  }
  const linkRate = linkedClaimCount / claimSentences.length;
  if (linkedClaimCount === claimSentences.length) {
    return {
      claimCount: claimSentences.length,
      linkedClaimCount,
      linkRate,
      failReasons: [],
    };
  }
  return {
    claimCount: claimSentences.length,
    linkedClaimCount,
    linkRate,
    failReasons: ["CLAIM_CITATION_LINK_WEAK"],
  };
};
