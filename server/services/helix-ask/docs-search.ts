import fs from "node:fs";
import path from "node:path";

import type { RepoSearchHit } from "./repo-search";

export type DocsSearchDocumentCandidate = {
  path: string;
  title: string;
  score: number;
  doc_class?: string;
  bundle_kind?: string;
  canonical?: boolean;
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
const DOCS_TAXONOMY_PATH = path.resolve(process.cwd(), "docs", "doc-taxonomy.v1.json");

type DocsTaxonomyDocumentEntry = {
  path: string;
  docClass?: string;
  bundleKind?: string;
  canonical?: boolean;
  sidecars?: string[];
  toolHints?: Record<string, unknown>;
};

let docsTaxonomyByPath: Map<string, DocsTaxonomyDocumentEntry> | null = null;

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
    ...tokens,
    ...docsSearchAliases(query),
  ].filter((term) => term.length >= 3);
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
        docClass: typeof candidate.docClass === "string" ? candidate.docClass : undefined,
        bundleKind: typeof candidate.bundleKind === "string" ? candidate.bundleKind : undefined,
        canonical: typeof candidate.canonical === "boolean" ? candidate.canonical : undefined,
        sidecars: Array.isArray(candidate.sidecars)
          ? candidate.sidecars.filter((entry): entry is string => typeof entry === "string").map(normalizeDocsPath)
          : undefined,
        toolHints: candidate.toolHints && typeof candidate.toolHints === "object" && !Array.isArray(candidate.toolHints)
          ? candidate.toolHints as Record<string, unknown>
          : undefined,
      });
    }
  } catch {
    // Taxonomy metadata is optional discovery context; docs search still works without it.
  }
  docsTaxonomyByPath = entries;
  return entries;
};

const readDocsTaxonomyEntry = (filePath: string): DocsTaxonomyDocumentEntry | null =>
  readDocsTaxonomyByPath().get(normalizeDocsPath(filePath)) ?? null;

const docsPathTitleScore = (filePath: string, query: string): number => {
  const normalizedPathTitle = normalizeDocsSearchText(`${filePath} ${docsPathTitle(filePath)}`);
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
  const normalizedHaystack = normalizeDocsSearchText(`${hit.filePath} ${docsPathTitle(hit.filePath)} ${hit.text}`);
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
      const normalizedPathTitle = normalizeDocsSearchText(`${filePath} ${docsPathTitle(filePath)}`);
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
      const latestDateBonus = latestPathDateScore > 0 && docsSearchPathDateScore(filePath) === latestPathDateScore ? 500 : 0;
      const sidecarPenalty = /\.(?:json|source)$/i.test(filePath) ? 1000 : 0;
      return {
        path: filePath,
        title: docsPathTitle(filePath),
        score: pathTitleScore + bestHitScore + coverageBonus + mdBonus + latestDateBonus - sidecarPenalty,
        ...(taxonomyEntry?.docClass ? { doc_class: taxonomyEntry.docClass } : {}),
        ...(taxonomyEntry?.bundleKind ? { bundle_kind: taxonomyEntry.bundleKind } : {}),
        ...(typeof taxonomyEntry?.canonical === "boolean" ? { canonical: taxonomyEntry.canonical } : {}),
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
      text: `Document title/path match: ${docsPathTitle(relativePath)}`,
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
