import fs from "node:fs";
import path from "node:path";

import {
  isHelixDocsRetrievalScope,
  isHelixDocsRetrievalStatus,
  type HelixDocsRetrievalScope,
  type HelixDocsRetrievalStatus,
} from "@shared/helix-docs-retrieval-authority";
import type { RepoSearchHit } from "./repo-search";
import {
  buildEvidenceUnitsFromText,
  selectEvidencePassagesWithCoverage,
} from "./retrieval/evidence-passage-selection";

export type DocsSearchDocumentCandidate = {
  path: string;
  title: string;
  score: number;
  doc_class?: string;
  bundle_kind?: string;
  canonical?: boolean;
  retrieval_status: HelixDocsRetrievalStatus;
  retrieval_admission_reason: string;
  topic_id?: string;
  authority_rank?: number;
  superseded_by?: string;
  sidecars?: string[];
  tool_hints?: Record<string, unknown>;
  best_snippets: Array<{
    line: number;
    text: string;
    term: string;
    score: number;
  }>;
  line_hit_count: number;
  matched_terms: string[];
};

export type DocsRetrievalSuppression = {
  path: string;
  retrieval_status: HelixDocsRetrievalStatus;
  reason: "archive_not_requested" | "excluded_from_runtime_retrieval" | "outside_requested_scope";
  topic_id?: string;
  superseded_by?: string;
};

export type DocsRetrievalAuthorityResult = {
  scope: HelixDocsRetrievalScope;
  admitted_hits: RepoSearchHit[];
  admitted_document_count: number;
  suppressed_document_count: number;
  suppressed: DocsRetrievalSuppression[];
};

export type DocsEvidencePassage = {
  passage_id: string;
  path: string;
  title: string;
  section?: string;
  line_start?: number;
  line_end?: number;
  text_excerpt: string;
  relevance_score: number;
  matched_terms: string[];
  citation_ref: string;
  citation_label: string;
};

export type AuthoritativeDocsTopicMatch = {
  topic_id: string;
  primary_path: string;
  primary_title: string;
  matched_terms: string[];
};

const DOCS_SEARCH_QUERY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "doc",
  "docs",
  "document",
  "documents",
  "for",
  "from",
  "in",
  "of",
  "on",
  "paper",
  "papers",
  "the",
]);
const DOCS_SEARCH_LOW_VALUE_TOKENS = new Set(["current", "status", "latest", "report", "memo", "plan"]);
const DOCS_SEARCH_NUMBER_WORDS = new Map<string, string>([
  ["zero", "0"],
  ["one", "1"],
  ["two", "2"],
  ["three", "3"],
  ["four", "4"],
  ["five", "5"],
  ["six", "6"],
  ["seven", "7"],
  ["eight", "8"],
  ["nine", "9"],
  ["ten", "10"],
  ["eleven", "11"],
  ["twelve", "12"],
  ["thirteen", "13"],
  ["fourteen", "14"],
  ["fifteen", "15"],
  ["sixteen", "16"],
  ["seventeen", "17"],
  ["eighteen", "18"],
  ["nineteen", "19"],
  ["twenty", "20"],
]);
const DOCS_TAXONOMY_PATH = path.resolve(process.cwd(), "docs", "doc-taxonomy.v1.json");

type DocsTaxonomyDocumentEntry = {
  path: string;
  title?: string;
  docClass?: string;
  bundleKind?: string;
  canonical?: boolean;
  sidecars?: string[];
  toolHints?: Record<string, unknown>;
  retrievalStatus?: HelixDocsRetrievalStatus;
  topicId?: string;
  authorityRank?: number;
  supersededBy?: string;
};

type DocsTaxonomyFolderRule = {
  path: string;
  docClass: string;
};

type DocsTaxonomyRetrievalRule = {
  pathPrefix: string;
  retrievalStatus: HelixDocsRetrievalStatus;
  topicId?: string;
  authorityRank?: number;
  supersededBy?: string;
};

let docsTaxonomyByPath: Map<string, DocsTaxonomyDocumentEntry> | null = null;
let docsTaxonomyFolderRules: DocsTaxonomyFolderRule[] | null = null;
let docsTaxonomyRetrievalRules: DocsTaxonomyRetrievalRule[] | null = null;

export const normalizeDocsSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const docsSearchQueryTokens = (query: string): string[] =>
  normalizeDocsSearchText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !DOCS_SEARCH_QUERY_STOP_WORDS.has(token));

const docsSearchAliases = (query: string): string[] => {
  const aliases: string[] = [];
  if (/\bwhite\s+paper\b/i.test(query)) aliases.push("whitepaper");
  if (/\bwhitepaper\b/i.test(query)) aliases.push("white paper");
  if (/\bnhm2\b/i.test(query)) aliases.push("needle hull mark 2", "needle hull mark2");
  if (/\bneedle\s+hull\s+mark\s*2\b/i.test(query)) aliases.push("nhm2");
  for (const token of docsSearchQueryTokens(query)) {
    const numericAlias = DOCS_SEARCH_NUMBER_WORDS.get(token);
    if (numericAlias) aliases.push(numericAlias);
  }
  return aliases;
};

export const buildDocsSearchTerms = (query: string): string[] => {
  const normalizedQuery = normalizeDocsSearchText(query);
  const tokens = [...docsSearchQueryTokens(query)].sort((left, right) => {
    const leftLow = DOCS_SEARCH_LOW_VALUE_TOKENS.has(left) ? 1 : 0;
    const rightLow = DOCS_SEARCH_LOW_VALUE_TOKENS.has(right) ? 1 : 0;
    if (leftLow !== rightLow) return leftLow - rightLow;
    if (left.length !== right.length) return right.length - left.length;
    return left.localeCompare(right);
  });
  const terms = [
    query.trim(),
    normalizedQuery,
    normalizedQuery.replace(/\s+/g, ""),
    ...docsSearchAliases(query),
    ...tokens,
  ].filter((term) => term.length >= 3 || /^\d{1,2}$/.test(term));
  return Array.from(new Set(terms.map((term) => term.toLowerCase()))).slice(0, 10);
};

const docsSearchPathDateScore = (filePath: string): number => {
  const match = filePath.match(/\b(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])\b/g)?.at(-1);
  if (!match) return 0;
  const parsed = Number(match.replace(/[-_]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const docsPathTitle = (filePath: string): string => {
  const fileName = filePath.replace(/\\/g, "/").split("/").at(-1) ?? filePath;
  return fileName
    .replace(/\.(?:md|mdx|txt|json|rst|adoc)$/i, "")
    .replace(/\.(?:equation-actions|source)$/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const isMarkdownDocPath = (filePath: string): boolean => /\.md$/i.test(filePath.replace(/\\/g, "/"));

const normalizeDocsPath = (filePath: string): string => filePath.replace(/\\/g, "/").replace(/^\/+/, "");

const readDocsTaxonomyByPath = (): Map<string, DocsTaxonomyDocumentEntry> => {
  if (docsTaxonomyByPath) return docsTaxonomyByPath;
  const entries = new Map<string, DocsTaxonomyDocumentEntry>();
  try {
    const raw = fs.readFileSync(DOCS_TAXONOMY_PATH, "utf8");
    const parsed = JSON.parse(raw) as { documents?: unknown };
    const documents = Array.isArray(parsed.documents) ? parsed.documents : [];
    for (const documentEntry of documents) {
      if (!documentEntry || typeof documentEntry !== "object") continue;
      const candidate = documentEntry as Record<string, unknown>;
      const filePath = typeof candidate.path === "string" ? normalizeDocsPath(candidate.path) : "";
      if (!filePath) continue;
      entries.set(filePath, {
        path: filePath,
        title: typeof candidate.title === "string" ? candidate.title : undefined,
        docClass: typeof candidate.docClass === "string" ? candidate.docClass : undefined,
        bundleKind: typeof candidate.bundleKind === "string" ? candidate.bundleKind : undefined,
        canonical: typeof candidate.canonical === "boolean" ? candidate.canonical : undefined,
        sidecars: Array.isArray(candidate.sidecars)
          ? candidate.sidecars.filter((entry): entry is string => typeof entry === "string").map(normalizeDocsPath)
          : undefined,
        toolHints: candidate.toolHints && typeof candidate.toolHints === "object" && !Array.isArray(candidate.toolHints)
          ? candidate.toolHints as Record<string, unknown>
          : undefined,
        retrievalStatus: isHelixDocsRetrievalStatus(candidate.retrievalStatus)
          ? candidate.retrievalStatus
          : undefined,
        topicId: typeof candidate.topicId === "string" ? candidate.topicId : undefined,
        authorityRank: typeof candidate.authorityRank === "number" && Number.isFinite(candidate.authorityRank)
          ? candidate.authorityRank
          : undefined,
        supersededBy: typeof candidate.supersededBy === "string"
          ? normalizeDocsPath(candidate.supersededBy)
          : undefined,
      });
    }
  } catch {
    // Taxonomy metadata is optional discovery context; docs search still works without it.
  }
  docsTaxonomyByPath = entries;
  return entries;
};

const readDocsTaxonomyRetrievalRules = (): DocsTaxonomyRetrievalRule[] => {
  if (docsTaxonomyRetrievalRules) return docsTaxonomyRetrievalRules;
  const rules: DocsTaxonomyRetrievalRule[] = [];
  try {
    const raw = fs.readFileSync(DOCS_TAXONOMY_PATH, "utf8");
    const parsed = JSON.parse(raw) as { retrievalRules?: unknown };
    const retrievalRules = Array.isArray(parsed.retrievalRules) ? parsed.retrievalRules : [];
    for (const rule of retrievalRules) {
      if (!rule || typeof rule !== "object") continue;
      const candidate = rule as Record<string, unknown>;
      if (
        typeof candidate.pathPrefix !== "string" ||
        !isHelixDocsRetrievalStatus(candidate.retrievalStatus)
      ) continue;
      rules.push({
        pathPrefix: normalizeDocsPath(candidate.pathPrefix),
        retrievalStatus: candidate.retrievalStatus,
        ...(typeof candidate.topicId === "string" ? { topicId: candidate.topicId } : {}),
        ...(typeof candidate.authorityRank === "number" && Number.isFinite(candidate.authorityRank)
          ? { authorityRank: candidate.authorityRank }
          : {}),
        ...(typeof candidate.supersededBy === "string"
          ? { supersededBy: normalizeDocsPath(candidate.supersededBy) }
          : {}),
      });
    }
  } catch {
    // Retrieval metadata is optional; the conservative class fallback still applies.
  }
  docsTaxonomyRetrievalRules = rules
    .filter((rule) => rule.pathPrefix.length > 0)
    .sort((left, right) => right.pathPrefix.length - left.pathPrefix.length);
  return docsTaxonomyRetrievalRules;
};

const readDocsTaxonomyFolderRules = (): DocsTaxonomyFolderRule[] => {
  if (docsTaxonomyFolderRules) return docsTaxonomyFolderRules;
  const rules: DocsTaxonomyFolderRule[] = [];
  try {
    const raw = fs.readFileSync(DOCS_TAXONOMY_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      classes?: Record<string, { defaultFolder?: unknown; defaultFolders?: unknown }>;
      folderRules?: unknown;
    };
    for (const [docClass, entry] of Object.entries(parsed.classes ?? {})) {
      const folders = [
        entry.defaultFolder,
        ...(Array.isArray(entry.defaultFolders) ? entry.defaultFolders : []),
      ];
      for (const folder of folders) {
        if (typeof folder !== "string" || !folder.trim()) continue;
        rules.push({ docClass, path: normalizeDocsPath(folder) });
      }
    }
    const folderRules = Array.isArray(parsed.folderRules) ? parsed.folderRules : [];
    for (const rule of folderRules) {
      if (!rule || typeof rule !== "object") continue;
      const candidate = rule as Record<string, unknown>;
      if (typeof candidate.path !== "string" || typeof candidate.docClass !== "string") continue;
      rules.push({ docClass: candidate.docClass, path: normalizeDocsPath(candidate.path) });
    }
  } catch {
    // Taxonomy metadata is optional discovery context; docs search still works without it.
  }
  docsTaxonomyFolderRules = rules
    .filter((rule) => rule.path.length > 0)
    .sort((left, right) => right.path.length - left.path.length);
  return docsTaxonomyFolderRules;
};

const inferDocsTaxonomyClass = (filePath: string): string | undefined => {
  const normalized = normalizeDocsPath(filePath);
  for (const rule of readDocsTaxonomyFolderRules()) {
    if (normalized === rule.path || normalized.startsWith(`${rule.path}/`)) return rule.docClass;
  }
  return undefined;
};

const readDocsTaxonomyEntry = (filePath: string): DocsTaxonomyDocumentEntry | null =>
  readDocsTaxonomyByPath().get(normalizeDocsPath(filePath)) ?? null;

const authoritativeDocsTopicTerms = (entry: DocsTaxonomyDocumentEntry): string[] => {
  const topicTerms = normalizeDocsSearchText(entry.topicId ?? "")
    .split(/\s+/)
    .filter((term) => term.length >= 2);
  if (topicTerms.length > 0) return topicTerms;
  return docsSearchQueryTokens(entry.title ?? docsPathTitle(entry.path))
    .filter((term) => !DOCS_SEARCH_LOW_VALUE_TOKENS.has(term))
    .slice(0, 3);
};

export const resolveAuthoritativeDocsTopicMatch = (
  promptText: string,
): AuthoritativeDocsTopicMatch | null => {
  const normalizedPrompt = normalizeDocsSearchText(promptText);
  if (!normalizedPrompt) return null;
  const promptTerms = new Set(normalizedPrompt.split(/\s+/).filter(Boolean));
  const matches = Array.from(readDocsTaxonomyByPath().values())
    .filter(
      (entry) =>
        entry.retrievalStatus === "primary" &&
        typeof entry.topicId === "string" &&
        entry.topicId.trim().length > 0,
    )
    .flatMap((entry) => {
      const topicTerms = authoritativeDocsTopicTerms(entry);
      if (topicTerms.length === 0 || !topicTerms.every((term) => promptTerms.has(term))) {
        return [];
      }
      return [{
        topic_id: entry.topicId as string,
        primary_path: entry.path,
        primary_title: entry.title ?? docsPathTitle(entry.path),
        matched_terms: topicTerms,
        authority_rank: entry.authorityRank ?? 0,
      }];
    })
    .sort((left, right) =>
      right.matched_terms.length - left.matched_terms.length ||
      right.authority_rank - left.authority_rank ||
      left.primary_path.localeCompare(right.primary_path),
    );
  const selected = matches[0];
  if (!selected) return null;
  const { authority_rank: _authorityRank, ...match } = selected;
  return match;
};

const docsAuthorityTitle = (filePath: string): string =>
  readDocsTaxonomyEntry(filePath)?.title ?? docsPathTitle(filePath);

const readDocsTaxonomyRetrievalRule = (filePath: string): DocsTaxonomyRetrievalRule | null => {
  const normalized = normalizeDocsPath(filePath);
  for (const rule of readDocsTaxonomyRetrievalRules()) {
    if (normalized === rule.pathPrefix || normalized.startsWith(rule.pathPrefix)) return rule;
  }
  return null;
};

export const normalizeDocsRetrievalScope = (value: unknown): HelixDocsRetrievalScope =>
  isHelixDocsRetrievalScope(value) ? value : "default";

export const resolveDocsRetrievalAuthority = (filePath: string): {
  retrieval_status: HelixDocsRetrievalStatus;
  topic_id?: string;
  authority_rank?: number;
  superseded_by?: string;
} => {
  const taxonomyEntry = readDocsTaxonomyEntry(filePath);
  const retrievalRule = readDocsTaxonomyRetrievalRule(filePath);
  const inheritedRetrievalRule = taxonomyEntry?.retrievalStatus
    ? null
    : retrievalRule;
  const docClass = taxonomyEntry?.docClass ?? inferDocsTaxonomyClass(filePath);
  const retrievalStatus = taxonomyEntry?.retrievalStatus ??
    inheritedRetrievalRule?.retrievalStatus ??
    (taxonomyEntry?.canonical === true
      ? "primary"
      : docClass === "synthetic-research" || docClass === "legacy-development"
        ? "archive"
        : "supporting");
  const topicId = taxonomyEntry?.topicId ?? inheritedRetrievalRule?.topicId;
  const authorityRank = taxonomyEntry?.authorityRank ?? inheritedRetrievalRule?.authorityRank;
  const supersededBy = taxonomyEntry?.supersededBy ?? inheritedRetrievalRule?.supersededBy;
  return {
    retrieval_status: retrievalStatus,
    ...(topicId ? { topic_id: topicId } : {}),
    ...(authorityRank !== undefined ? { authority_rank: authorityRank } : {}),
    ...(supersededBy ? { superseded_by: supersededBy } : {}),
  };
};

const docsQueryExplicitlyNamesPath = (query: string, filePath: string): boolean => {
  const normalizedQuery = normalizeDocsSearchText(query);
  const normalizedTitle = normalizeDocsSearchText(docsAuthorityTitle(filePath));
  if (normalizedTitle.length < 8) return false;
  if (normalizedQuery.includes(normalizedTitle)) return true;
  const queryTokens = new Set(docsSearchQueryTokens(query));
  const titleTokens = docsSearchQueryTokens(docsAuthorityTitle(filePath));
  return titleTokens.length >= 3 && titleTokens.every((token) => queryTokens.has(token));
};

const docsSearchPathsExplicitlyIncludeFile = (
  searchPaths: string[],
  filePath: string,
): boolean => {
  const normalizedFilePath = normalizeDocsPath(filePath).toLowerCase();
  return searchPaths.some((searchPath) => {
    const normalizedSearchPath = normalizeDocsPath(searchPath).toLowerCase();
    return /\.md$/i.test(normalizedSearchPath) && normalizedSearchPath === normalizedFilePath;
  });
};

const resolveDocsRetrievalAdmission = (input: {
  filePath: string;
  query: string;
  searchPaths?: string[];
  scope?: HelixDocsRetrievalScope;
}): {
  admitted: boolean;
  reason: string;
  authority: ReturnType<typeof resolveDocsRetrievalAuthority>;
} => {
  const authority = resolveDocsRetrievalAuthority(input.filePath);
  const scope = input.scope ?? "default";
  if (authority.retrieval_status === "excluded") {
    return { admitted: false, reason: "excluded_from_runtime_retrieval", authority };
  }
  if (scope === "archive_only") {
    return authority.retrieval_status === "archive"
      ? { admitted: true, reason: "archive_scope_requested", authority }
      : { admitted: false, reason: "outside_requested_scope", authority };
  }
  if (scope === "include_archive") {
    return { admitted: true, reason: "archive_scope_requested", authority };
  }
  if (authority.retrieval_status !== "archive") {
    return {
      admitted: true,
      reason: authority.retrieval_status === "primary"
        ? "default_primary"
        : "default_supporting",
      authority,
    };
  }
  if (docsSearchPathsExplicitlyIncludeFile(input.searchPaths ?? [], input.filePath)) {
    return { admitted: true, reason: "exact_path_requested", authority };
  }
  if (docsQueryExplicitlyNamesPath(input.query, input.filePath)) {
    return { admitted: true, reason: "exact_title_requested", authority };
  }
  return { admitted: false, reason: "archive_not_requested", authority };
};

export const applyDocsRetrievalAuthority = (input: {
  hits: RepoSearchHit[];
  query: string;
  searchPaths?: string[];
  scope?: HelixDocsRetrievalScope;
}): DocsRetrievalAuthorityResult => {
  const scope = input.scope ?? "default";
  const decisions = new Map<string, ReturnType<typeof resolveDocsRetrievalAdmission>>();
  const admittedHits: RepoSearchHit[] = [];
  for (const hit of input.hits) {
    const normalizedPath = normalizeDocsPath(hit.filePath);
    const decision = decisions.get(normalizedPath) ?? resolveDocsRetrievalAdmission({
      filePath: normalizedPath,
      query: input.query,
      searchPaths: input.searchPaths,
      scope,
    });
    decisions.set(normalizedPath, decision);
    if (decision.admitted) admittedHits.push({ ...hit, filePath: normalizedPath });
  }
  const suppressed = Array.from(decisions.entries()).flatMap(([filePath, decision]) =>
    decision.admitted
      ? []
      : [{
          path: filePath,
          retrieval_status: decision.authority.retrieval_status,
          reason: decision.reason as DocsRetrievalSuppression["reason"],
          ...(decision.authority.topic_id ? { topic_id: decision.authority.topic_id } : {}),
          ...(decision.authority.superseded_by ? { superseded_by: decision.authority.superseded_by } : {}),
        }],
  );
  return {
    scope,
    admitted_hits: admittedHits,
    admitted_document_count: Array.from(decisions.values()).filter((decision) => decision.admitted).length,
    suppressed_document_count: suppressed.length,
    suppressed,
  };
};

const docsPathTitleScore = (filePath: string, query: string): number => {
  const normalizedPathTitle = normalizeDocsSearchText(`${filePath} ${docsAuthorityTitle(filePath)}`);
  const compactPathTitle = normalizedPathTitle.replace(/\s+/g, "");
  const normalizedQuery = normalizeDocsSearchText(query);
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const tokens = docsSearchQueryTokens(query);
  const aliases = docsSearchAliases(query).map(normalizeDocsSearchText).filter(Boolean);
  let score = 0;
  if (normalizedQuery && normalizedPathTitle.includes(normalizedQuery)) score += 1800;
  if (compactQuery && compactPathTitle.includes(compactQuery)) score += 1400;
  for (const token of tokens) {
    if (normalizedPathTitle.includes(token)) score += 350;
  }
  for (const alias of aliases) {
    const compactAlias = alias.replace(/\s+/g, "");
    if (normalizedPathTitle.includes(alias) || compactPathTitle.includes(compactAlias)) score += 175;
  }
  if (/\bwhite\s+paper\b/i.test(query) && /whitepaper|white-paper|white_paper/i.test(filePath)) score += 500;
  return score;
};

const docsSearchHitScore = (hit: RepoSearchHit, query: string, latestPathDateScore = 0): number => {
  const normalizedNeedle = normalizeDocsSearchText(query);
  const compactNeedle = normalizedNeedle.replace(/\s+/g, "");
  const tokens = docsSearchQueryTokens(query);
  const normalizedHaystack = normalizeDocsSearchText(`${hit.filePath} ${docsAuthorityTitle(hit.filePath)} ${hit.text}`);
  const compactHaystack = normalizedHaystack.replace(/\s+/g, "");
  let score = 0;
  if (normalizedNeedle && normalizedHaystack.includes(normalizedNeedle)) score += 1000;
  if (compactNeedle && compactHaystack.includes(compactNeedle)) score += 800;
  for (const alias of docsSearchAliases(query)) {
    const normalizedAlias = normalizeDocsSearchText(alias);
    if (normalizedAlias && normalizedHaystack.includes(normalizedAlias)) score += 250;
  }
  for (const token of tokens) {
    if (normalizedHaystack.includes(token)) score += 100;
  }
  if (/docs\/research\//i.test(hit.filePath)) score += 25;
  if (/whitepaper|white-paper|white_paper/i.test(hit.filePath)) score += 25;
  if (/\.md$/i.test(hit.filePath)) score += 75;
  if (/\.(?:json|source)$/i.test(hit.filePath)) score -= 125;
  if (latestPathDateScore > 0 && docsSearchPathDateScore(hit.filePath) === latestPathDateScore) score += 50;
  score += Math.min(docsPathTitleScore(hit.filePath, query), 1000);
  return score;
};

export const rankDocsSearchHits = (hits: RepoSearchHit[], query: string): RepoSearchHit[] => {
  const latestPathDateScore = Math.max(0, ...hits.map((hit) => docsSearchPathDateScore(hit.filePath)));
  const deduped = new Map<string, RepoSearchHit>();
  for (const hit of hits) {
    const key = `${hit.filePath.toLowerCase()}:${hit.line}`;
    const prior = deduped.get(key);
    if (!prior || docsSearchHitScore(hit, query, latestPathDateScore) > docsSearchHitScore(prior, query, latestPathDateScore)) {
      deduped.set(key, hit);
    }
  }
  return Array.from(deduped.values()).sort((left, right) => {
    const scoreDelta = docsSearchHitScore(right, query, latestPathDateScore) - docsSearchHitScore(left, query, latestPathDateScore);
    if (scoreDelta !== 0) return scoreDelta;
    const pathDelta = left.filePath.localeCompare(right.filePath);
    return pathDelta || left.line - right.line;
  });
};

export const buildDocsSearchDocumentCandidates = (
  hits: RepoSearchHit[],
  query: string,
  limit = 8,
  options: {
    searchPaths?: string[];
    retrievalScope?: HelixDocsRetrievalScope;
  } = {},
): DocsSearchDocumentCandidate[] => {
  const latestPathDateScore = Math.max(0, ...hits.map((hit) => docsSearchPathDateScore(hit.filePath)));
  const byPath = new Map<string, RepoSearchHit[]>();
  for (const hit of hits) {
    const normalizedPath = hit.filePath.replace(/\\/g, "/");
    byPath.set(normalizedPath, [...(byPath.get(normalizedPath) ?? []), { ...hit, filePath: normalizedPath }]);
  }

  return Array.from(byPath.entries())
    .map(([filePath, pathHits]) => {
      const taxonomyEntry = readDocsTaxonomyEntry(filePath);
      const docClass = taxonomyEntry?.docClass ?? inferDocsTaxonomyClass(filePath);
      const retrievalAdmission = resolveDocsRetrievalAdmission({
        filePath,
        query,
        searchPaths: options.searchPaths,
        scope: options.retrievalScope,
      });
      const retrievalAuthority = retrievalAdmission.authority;
      const normalizedPathTitle = normalizeDocsSearchText(`${filePath} ${docsAuthorityTitle(filePath)}`);
      const compactPathTitle = normalizedPathTitle.replace(/\s+/g, "");
      const scoredHits = pathHits
        .map((hit) => ({ hit, score: docsSearchHitScore(hit, query, latestPathDateScore) }))
        .sort((left, right) => right.score - left.score || left.hit.line - right.hit.line);
      const pathMatchedTerms = [
        ...docsSearchQueryTokens(query),
        ...docsSearchAliases(query),
      ].filter((term) => {
        const normalizedTerm = normalizeDocsSearchText(term);
        const compactTerm = normalizedTerm.replace(/\s+/g, "");
        return normalizedTerm && (normalizedPathTitle.includes(normalizedTerm) || compactPathTitle.includes(compactTerm));
      });
      const matchedTerms = Array.from(new Set([
        ...pathMatchedTerms,
        ...pathHits.map((hit) => hit.term).filter(Boolean),
      ])).sort();
      const bestHitScore = scoredHits[0]?.score ?? 0;
      const pathTitleScore = docsPathTitleScore(filePath, query);
      const coverageBonus = matchedTerms.length * 30 + Math.min(pathHits.length, 8) * 5;
      const mdBonus = /\.md$/i.test(filePath) ? 100 : 0;
      const canonicalBonus = taxonomyEntry?.canonical === true || retrievalAuthority.retrieval_status === "primary"
        ? 5000
        : 0;
      const authorityBonus = Math.max(0, Math.min(1000, retrievalAuthority.authority_rank ?? 0)) * 10;
      const latestDateBonus = latestPathDateScore > 0 && docsSearchPathDateScore(filePath) === latestPathDateScore ? 500 : 0;
      const sidecarPenalty = /\.(?:json|source)$/i.test(filePath) ? 5000 : 0;
      return {
        path: filePath,
        title: docsAuthorityTitle(filePath),
        score: pathTitleScore + bestHitScore + coverageBonus + mdBonus + canonicalBonus + authorityBonus + latestDateBonus - sidecarPenalty,
        ...(docClass ? { doc_class: docClass } : {}),
        ...(taxonomyEntry?.bundleKind ? { bundle_kind: taxonomyEntry.bundleKind } : {}),
        ...(typeof taxonomyEntry?.canonical === "boolean" ? { canonical: taxonomyEntry.canonical } : {}),
        retrieval_status: retrievalAuthority.retrieval_status,
        retrieval_admission_reason: retrievalAdmission.reason,
        ...(retrievalAuthority.topic_id ? { topic_id: retrievalAuthority.topic_id } : {}),
        ...(retrievalAuthority.authority_rank !== undefined
          ? { authority_rank: retrievalAuthority.authority_rank }
          : {}),
        ...(retrievalAuthority.superseded_by ? { superseded_by: retrievalAuthority.superseded_by } : {}),
        ...(taxonomyEntry?.sidecars?.length ? { sidecars: taxonomyEntry.sidecars } : {}),
        ...(taxonomyEntry?.toolHints ? { tool_hints: taxonomyEntry.toolHints } : {}),
        best_snippets: scoredHits.slice(0, 3).map(({ hit, score }) => ({
          line: hit.line,
          text: hit.text,
          term: hit.term,
          score,
        })),
        line_hit_count: pathHits.length,
        matched_terms: matchedTerms,
      };
    })
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) return scoreDelta;
      const dateDelta = docsSearchPathDateScore(right.path) - docsSearchPathDateScore(left.path);
      if (dateDelta !== 0) return dateDelta;
      return left.path.localeCompare(right.path);
    })
    .slice(0, Math.max(1, limit));
};

const collectDocsPathCandidates = (searchPaths: string[], query: string): RepoSearchHit[] => {
  const workspaceRoot = process.cwd();
  const queue = searchPaths.map((entry) => path.resolve(workspaceRoot, entry));
  const docsRoot = path.resolve(workspaceRoot, "docs");
  const hits: RepoSearchHit[] = [];
  const maxFiles = 8000;
  let visitedFiles = 0;

  while (queue.length > 0 && visitedFiles < maxFiles) {
    const current = queue.shift();
    if (!current) continue;
    const relativeToDocsRoot = path.relative(docsRoot, current);
    if (relativeToDocsRoot.startsWith("..") || path.isAbsolute(relativeToDocsRoot)) continue;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(current);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        queue.push(path.join(current, entry.name));
      }
      continue;
    }
    visitedFiles += 1;
    if (!stat.isFile() || !isMarkdownDocPath(current)) continue;
    const relativePath = path.relative(workspaceRoot, current).replace(/\\/g, "/");
    const score = docsPathTitleScore(relativePath, query);
    if (score <= 0) continue;
    hits.push({
      filePath: relativePath,
      line: 1,
      text: `Document title/path match: ${docsAuthorityTitle(relativePath)}`,
      term: "document_path_title",
    });
  }
  return hits.sort((left, right) => docsPathTitleScore(right.filePath, query) - docsPathTitleScore(left.filePath, query)).slice(0, 20);
};

export const mergeDocsSearchPathCandidates = (
  hits: RepoSearchHit[],
  searchPaths: string[],
  query: string,
): RepoSearchHit[] => {
  const merged = [...hits];
  const seen = new Set(merged.map((hit) => `${hit.filePath.toLowerCase()}:${hit.line}:${hit.term.toLowerCase()}`));
  for (const hit of collectDocsPathCandidates(searchPaths, query)) {
    const key = `${hit.filePath.toLowerCase()}:${hit.line}:${hit.term.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
  }
  return merged;
};

export const buildDocsEvidencePassages = (
  candidates: DocsSearchDocumentCandidate[],
  query: string,
  limit = 8,
): DocsEvidencePassage[] => {
  const workspaceRoot = process.cwd();
  const docsRoot = path.resolve(workspaceRoot, "docs");
  const passages: DocsEvidencePassage[] = [];

  for (const candidate of candidates.slice(0, 4)) {
    const absolutePath = path.resolve(workspaceRoot, candidate.path);
    const relativeToDocs = path.relative(docsRoot, absolutePath);
    if (relativeToDocs.startsWith("..") || path.isAbsolute(relativeToDocs)) continue;
    let text = "";
    try {
      text = fs.readFileSync(absolutePath, "utf8");
    } catch {
      continue;
    }
    const selected = selectEvidencePassagesWithCoverage({
      units: buildEvidenceUnitsFromText({ text }),
      query,
      source_ref: `workspace://${candidate.path}`,
      title: candidate.title,
      max_passages: 3,
      max_chars: 1200,
    });
    passages.push(...selected.map((passage) => ({
      passage_id: passage.passage_id,
      path: candidate.path,
      title: candidate.title,
      ...(passage.section ? { section: passage.section } : {}),
      ...(passage.line_start ? { line_start: passage.line_start } : {}),
      ...(passage.line_end ? { line_end: passage.line_end } : {}),
      text_excerpt: passage.text,
      relevance_score: Number(Math.min(1, passage.relevance_score + (candidate.canonical ? 0.05 : 0)).toFixed(3)),
      matched_terms: passage.matched_terms,
      citation_ref: passage.citation_ref,
      citation_label: passage.citation_label,
    })));
  }

  return passages
    .sort((left, right) =>
      right.relevance_score - left.relevance_score ||
      left.path.localeCompare(right.path) ||
      (left.line_start ?? 0) - (right.line_start ?? 0),
    )
    .slice(0, Math.max(1, limit));
};
