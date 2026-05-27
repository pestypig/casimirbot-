import type { RepoSearchHit } from "../repo-search";
import type { HelixRepoCodeEvidenceObservation } from "../../../../shared/helix-repo-code-evidence-observation";

const INDEX_ONLY_PATHS = [
  /(?:^|\/)\.cache\//i,
  /(?:^|\/)\.tmp/i,
  /(?:^|\/)node_modules\//i,
  /(?:^|\/)dist\//i,
  /(?:^|\/)build\//i,
  /(?:^|\/)coverage\//i,
  /(?:^|\/)attached_assets\//i,
];

const GENERATED_OR_ARTIFACT_PATHS = [
  /(?:^|\/)server\/_generated\//i,
  /(?:^|\/)(?:generated|artifacts?|tmp|temp)\//i,
  /(?:^|\/)[^/]*\.generated\./i,
];

const normalize = (value: string): string => value.replace(/\\/g, "/").toLowerCase();

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3);

const exactTermsFor = (input: {
  query: string;
  concept?: string | null;
  exactTerms?: string[];
}): string[] =>
  Array.from(
    new Set(
      [input.query, input.concept ?? "", ...(input.exactTerms ?? [])]
        .map((entry) => entry.trim())
        .filter((entry) => entry.length >= 3),
    ),
  );

const sourceKindForPath = (filePath: string): "repo_code" | "repo_doc" =>
  normalize(filePath).startsWith("docs/") ? "repo_doc" : "repo_code";

const isContractLikeLine = (hit: RepoSearchHit): boolean => {
  const filePath = normalize(hit.filePath);
  const text = hit.text;
  return (
    /\b(?:export|type|interface|class|function|const|enum|schema|capability_key|describe|it|test)\b/i.test(text) ||
    /\.(?:test|spec)\.[tj]sx?$/.test(filePath) ||
    /(?:^|\/)__tests__(?:\/|$)/.test(filePath)
  );
};

const scoreHit = (
  hit: RepoSearchHit,
  queryTokens: Set<string>,
  exactTerms: string[],
): number => {
  const filePath = normalize(hit.filePath);
  const text = hit.text.toLowerCase();
  let score = 0;
  for (const term of exactTerms) {
    const normalizedTerm = term.toLowerCase();
    if (!normalizedTerm) continue;
    if (filePath.includes(normalizedTerm.replace(/\s+/g, "-")) || filePath.includes(normalizedTerm.replace(/\s+/g, "_"))) {
      score += 30;
    }
    if (text.includes(normalizedTerm)) {
      score += isContractLikeLine(hit) ? 100 : 80;
    }
  }
  for (const token of queryTokens) {
    if (filePath.includes(token)) score += 6;
    if (text.includes(token)) score += 4;
  }

  if (/server\/services\/helix-ask/.test(filePath)) score += 65;
  if (/shared\//.test(filePath)) score += 60;
  if (/client\/src\/lib\/workstation/.test(filePath)) score += 55;
  if (/client\/src\/components\/workstation/.test(filePath)) score += 55;
  if (/server\/services\/situation-room/.test(filePath)) score += 45;
  if (/(?:^|\/)__tests__\/|(?:\.test|\.spec)\.[tj]sx?$/.test(filePath)) score += 35;
  if (/docs\//.test(filePath)) score += 25;
  if (GENERATED_OR_ARTIFACT_PATHS.some((pattern) => pattern.test(filePath))) score -= 40;
  if (INDEX_ONLY_PATHS.some((pattern) => pattern.test(filePath))) score -= 60;
  return score;
};

export const isRepoCodeEvidenceIndexOnlyPath = (filePath: string): boolean =>
  INDEX_ONLY_PATHS.some((pattern) => pattern.test(normalize(filePath)));

export function rankRepoCodeEvidenceHits(input: {
  hits: RepoSearchHit[];
  query: string;
  concept?: string | null;
  exactTerms?: string[];
  maxHits?: number;
}): RepoSearchHit[] {
  const maxHits = Math.max(1, Math.min(input.maxHits ?? 40, 80));
  const queryTokens = new Set(tokenize([input.query, input.concept ?? ""].filter(Boolean).join(" ")));
  const exactTerms = exactTermsFor(input);
  const scored = input.hits
    .filter((hit) => !isRepoCodeEvidenceIndexOnlyPath(hit.filePath))
    .map((hit, index) => {
      return { hit, score: scoreHit(hit, queryTokens, exactTerms), index };
    });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, maxHits).map((entry) => entry.hit);
}

export function buildRepoCodeEvidenceSpans(input: {
  hits: RepoSearchHit[];
  query: string;
  concept?: string | null;
  exactTerms?: string[];
}): HelixRepoCodeEvidenceObservation["spans"] {
  const queryTokens = new Set(tokenize([input.query, input.concept ?? ""].filter(Boolean).join(" ")));
  const exactTerms = exactTermsFor(input);
  return input.hits.map((hit) => {
    const score = scoreHit(hit, queryTokens, exactTerms);
    const ref = `${hit.filePath}:${hit.line}`;
    const path = hit.filePath.replace(/\\/g, "/");
    return {
      ref,
      path,
      start_line: Math.max(1, Math.trunc(Number(hit.line) || 1)),
      end_line: Math.max(1, Math.trunc(Number(hit.line) || 1)),
      excerpt: hit.text,
      reason: score > 0 ? "matched_concept_path_or_text_signal" : "retrieved_repo_search_hit",
      source_kind: sourceKindForPath(path),
      score,
    };
  });
}
