import * as fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { searchRepoIndex, type RepoSearchKind } from "../search/repo-index";

type RepoNodeKind = "file" | "symbol" | "concept";
export type RepoGraphNode = {
  id: string;
  kind: RepoNodeKind;
  name: string;
  path?: string;
  tags?: string[];
  score?: number;
};

export type RepoGraphEdgeKind = "imports" | "reexports" | "defines" | "calls" | "tests" | "mentions";
export type RepoGraphEdge = {
  source: string;
  target: string;
  kind: RepoGraphEdgeKind;
  citation_context?: string;
};

type RepoGraph = {
  nodes: Map<string, RepoGraphNode>;
  edges: RepoGraphEdge[];
  builtAt: number;
};

type SearchHit = {
  id: string;
  snippet: string;
  score: number;
  kind: RepoNodeKind;
  keys: string[];
  path?: string;
  file_path?: string;
  symbol_name?: string;
  snippet_id?: string;
};

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".cpp",
  ".c",
  ".h",
]);
const DOC_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".csv",
  ".tsv",
  ".sql",
  ".graphql",
  ".proto",
]);
const DEFAULT_MAX_FILES = Math.max(
  500,
  Number(process.env.REPO_GRAPH_MAX_FILES ?? 2000),
);
const CACHE_TTL_MS = Math.max(
  10_000,
  Number(process.env.REPO_GRAPH_CACHE_TTL_MS ?? 5 * 60 * 1000),
);
const RRF_K = Math.max(1, Number(process.env.REPO_GRAPH_RRF_K ?? 60));
const FUSE_DOCS = process.env.REPO_GRAPH_FUSE_DOCS !== "0";
const FUSE_CODE = process.env.REPO_GRAPH_FUSE_CODE !== "0";
const DIVERSIFY_HITS = process.env.REPO_GRAPH_HIT_DIVERSIFY !== "0";

const normalizeForMatch = (value: string): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isWarpRelevantPath = (value?: string): boolean => {
  if (!value) return false;
  const normalized = normalizeForMatch(value.replace(/\\/g, "/"));
  return (
    normalized.includes("modules/warp") ||
    normalized.includes("energy-pipeline.ts") ||
    normalized.includes("natario") ||
    normalized.includes("alcubierre") ||
    normalized.includes("natario-metric") ||
    normalized.includes("target-validation") ||
    normalized.includes("theta") ||
    normalized.includes("casimir")
  );
};

let cache: RepoGraph | null = null;
let forceRefreshUsed = false;

const fileCacheKey = (filePath: string) => path.normalize(filePath);

const safeReadFile = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
};

async function walkFiles(root: string, limit: number): Promise<string[]> {
  const files: string[] = [];
  const queue: string[] = [root];
  while (queue.length > 0 && files.length < limit) {
    const current = queue.pop();
    if (!current) break;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Skip common heavy directories
        if ([".git", "node_modules", "dist", "build", ".next"].includes(entry.name)) {
          continue;
        }
        queue.push(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SOURCE_EXTENSIONS.has(ext) || DOC_EXTENSIONS.has(ext)) {
          files.push(full);
          if (files.length >= limit) break;
        }
      }
      if (files.length >= limit) break;
    }
  }
  return files;
}

const extractImports = (contents: string): Array<{ target: string; context: string }> => {
  const matches = [...contents.matchAll(/import\s+[^'"]*['"]([^'"]+)['"]/g)];
  return matches.map((m) => ({ target: m[1], context: m[0].slice(0, 240) }));
};

const extractExports = (contents: string): string[] => {
  const matches = [...contents.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/g)];
  return matches.map((m) => m[1]);
};

const extractTestTargets = (filePath: string, exports: string[]): string[] => {
  if (!/\.test\.|\.spec\./i.test(filePath)) return [];
  const base = path.basename(filePath).replace(/(\.test|\.spec)?\.[^.]+$/, "");
  const inferred = base ? [base] : [];
  return exports.length > 0 ? exports : inferred;
};

const extractConcepts = (contents: string): string[] => {
  const headings = [...contents.matchAll(/^#{1,3}\s+([^\n]+)/gm)].map((m) => m[1].trim());
  return headings.slice(0, 10);
};

async function buildRepoGraph(root = process.cwd(), maxFiles = DEFAULT_MAX_FILES): Promise<RepoGraph> {
  const nodes = new Map<string, RepoGraphNode>();
  const edges: RepoGraphEdge[] = [];
  const files = await walkFiles(root, maxFiles);

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const rel = path.relative(root, filePath);
    const fileId = fileCacheKey(rel);
    nodes.set(fileId, { id: fileId, kind: "file", name: path.basename(filePath), path: rel, tags: [ext.replace(".", "")] });
    const contents = await safeReadFile(filePath);
    if (!contents) continue;

    if (SOURCE_EXTENSIONS.has(ext)) {
      const imports = extractImports(contents);
      for (const imp of imports) {
        edges.push({ source: fileId, target: imp.target, kind: "imports", citation_context: imp.context });
      }
      const exports = extractExports(contents);
      for (const symbol of exports) {
        const symbolId = `${rel}::${symbol}`;
        nodes.set(symbolId, { id: symbolId, kind: "symbol", name: symbol, path: rel, tags: ["export"] });
        edges.push({ source: symbolId, target: fileId, kind: "defines" });
      }
      const tests = extractTestTargets(rel, exports);
      for (const target of tests) {
        edges.push({ source: fileId, target, kind: "tests", citation_context: "test file references target symbol" });
      }
    } else if (DOC_EXTENSIONS.has(ext)) {
      const concepts = extractConcepts(contents);
      for (const concept of concepts) {
        const conceptId = `${rel}#${concept.toLowerCase().slice(0, 48)}`;
        nodes.set(conceptId, { id: conceptId, kind: "concept", name: concept, path: rel, tags: ["doc"] });
        edges.push({ source: conceptId, target: fileId, kind: "mentions", citation_context: concept });
      }
    }
  }

  cache = { nodes, edges, builtAt: Date.now() };
  return cache;
}

type SearchParams = { query: string; projectId?: string; limit?: number; intentTags?: string[] };

const normalizeHitKey = (hit: SearchHit): string => {
  const value = hit.file_path ?? hit.path ?? hit.id;
  return normalizeForMatch(value);
};

const mergeHit = (base: SearchHit, incoming: SearchHit): SearchHit => ({
  ...base,
  snippet: base.snippet ?? incoming.snippet,
  path: base.path ?? incoming.path,
  file_path: base.file_path ?? incoming.file_path,
  symbol_name: base.symbol_name ?? incoming.symbol_name,
  keys: base.keys.length > 0 ? base.keys : incoming.keys,
});

const fuseHitsRrf = (
  primary: SearchHit[],
  secondary: SearchHit[],
  limit: number,
): SearchHit[] => {
  const scores = new Map<string, { hit: SearchHit; score: number }>();
  const addRanked = (hits: SearchHit[]) => {
    hits.forEach((hit, index) => {
      const key = normalizeHitKey(hit);
      if (!key) return;
      const rank = index + 1;
      const score = 1 / (RRF_K + rank);
      const existing = scores.get(key);
      if (existing) {
        existing.score += score;
        existing.hit = mergeHit(existing.hit, hit);
      } else {
        scores.set(key, { hit: { ...hit }, score });
      }
    });
  };
  addRanked(primary);
  addRanked(secondary);
  return Array.from(scores.values())
    .map(({ hit, score }) => ({ ...hit, score: Number(score.toFixed(3)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

function scoreNode(node: RepoGraphNode, query: string, degree: number, opts?: { warpIntent?: boolean }): number {
  const nameScore = normalizeForMatch(node.name).includes(query) ? 3 : 0;
  const tagScore = (node.tags ?? []).some((t) => normalizeForMatch(t).includes(query)) ? 1 : 0;
  const warpBoost = opts?.warpIntent && isWarpRelevantPath(node.path) ? 5 : 0;
  const warpPenalty = opts?.warpIntent && !isWarpRelevantPath(node.path) ? -1 : 0;
  return nameScore + tagScore + Math.log(1 + degree) + warpBoost + warpPenalty;
}

const bucketKey = (value?: string): string => {
  if (!value) return "unknown";
  const normalized = value.replace(/\\/g, "/");
  const first = normalized.split("/").filter(Boolean)[0];
  return first || "unknown";
};

const diversifyHitsByPath = (hits: SearchHit[], limit: number): SearchHit[] => {
  const buckets = new Map<string, SearchHit[]>();
  for (const hit of hits) {
    const key = bucketKey(hit.file_path ?? hit.path ?? hit.id);
    const group = buckets.get(key) ?? [];
    group.push(hit);
    buckets.set(key, group);
  }
  const bucketOrder = Array.from(buckets.entries())
    .map(([key, entries]) => ({ key, score: entries[0]?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.key);
  const selected: SearchHit[] = [];
  while (selected.length < limit) {
    let progressed = false;
    for (const key of bucketOrder) {
      const group = buckets.get(key);
      if (!group || group.length === 0) continue;
      selected.push(group.shift() as SearchHit);
      progressed = true;
      if (selected.length >= limit) break;
    }
    if (!progressed) break;
  }
  return selected;
};

const diversifyRanked = (
  ranked: Array<{ node: RepoGraphNode; score: number }>,
  limit: number,
): Array<{ node: RepoGraphNode; score: number }> => {
  const buckets = new Map<string, Array<{ node: RepoGraphNode; score: number }>>();
  for (const entry of ranked) {
    const key = bucketKey(entry.node.path);
    const group = buckets.get(key) ?? [];
    group.push(entry);
    buckets.set(key, group);
  }
  const bucketOrder = Array.from(buckets.entries())
    .map(([key, entries]) => ({ key, score: entries[0]?.score ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.key);

  const selected: Array<{ node: RepoGraphNode; score: number }> = [];
  while (selected.length < limit) {
    let progressed = false;
    for (const key of bucketOrder) {
      const group = buckets.get(key);
      if (!group || group.length === 0) continue;
      selected.push(group.shift() as { node: RepoGraphNode; score: number });
      progressed = true;
      if (selected.length >= limit) break;
    }
    if (!progressed) break;
  }
  return selected;
};

export async function searchRepoGraph(params: SearchParams): Promise<{
  nodes: RepoGraphNode[];
  edges: RepoGraphEdge[];
  hits: SearchHit[];
  packets?: Array<{
    id: string;
    essence_id: string;
    kind: "repo_context";
    file_path: string;
    symbol_name?: string;
    snippet: string;
    score: number;
  }>;
  collapse_inputs?: {
    text?: string[];
    image?: string[];
    audio?: string[];
  };
}> {
  const queryRaw = (params.query || "").trim();
  if (!queryRaw) {
    return { nodes: [], edges: [], hits: [] };
  }
  const warpIntent = Array.isArray(params.intentTags) && params.intentTags.includes("warp-physics");
  const query = normalizeForMatch(queryRaw);
  const now = Date.now();
  const forceRefresh = process.env.REPO_GRAPH_FORCE_REFRESH === "1";
  const shouldForceRefresh = forceRefresh && !forceRefreshUsed;
  if (shouldForceRefresh || !cache || now - cache.builtAt > CACHE_TTL_MS) {
    await buildRepoGraph();
    if (forceRefresh) {
      forceRefreshUsed = true;
    }
  }
  const graph = cache ?? (await buildRepoGraph());
  const limit = Math.max(3, Math.min(50, params.limit ?? 12));

  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  let ranked = [...graph.nodes.values()]
    .map((node) => ({ node, score: scoreNode(node, query, degree.get(node.id) ?? 0, { warpIntent }) }))
    .filter((item) => item.score > 0 || nodeMatchesQuery(item.node, query))
    .sort((a, b) => b.score - a.score);

  if (warpIntent) {
    const warpRanked = ranked.filter((entry) => isWarpRelevantPath(entry.node.path));
    if (warpRanked.length > 0) {
      ranked = warpRanked;
    }
  }

  if (process.env.REPO_GRAPH_DIVERSIFY !== "0") {
    ranked = diversifyRanked(ranked, limit);
  } else {
    ranked = ranked.slice(0, limit);
  }

  const selectedIds = new Set(ranked.map((r) => r.node.id));
  const edgesSubset = graph.edges.filter((edge) => selectedIds.has(edge.source) || selectedIds.has(edge.target)).slice(0, limit * 2);

  const graphHits: SearchHit[] = ranked.map((entry) => ({
    id: entry.node.id,
    snippet: buildSnippet(entry.node, edgesSubset),
    score: Number(entry.score.toFixed(3)),
    kind: entry.node.kind,
    keys: entry.node.tags ?? [],
    path: entry.node.path,
    file_path: entry.node.path,
    symbol_name: entry.node.kind === "symbol" ? entry.node.name : undefined,    
    snippet_id: entry.node.id,
  }));

  let hits = graphHits;
  const indexKinds: RepoSearchKind[] = [];
  if (FUSE_DOCS) indexKinds.push("doc");
  if (FUSE_CODE) indexKinds.push("code");
  if (indexKinds.length > 0) {
    const docLimit = Math.max(3, Math.min(50, limit));
    try {
      const docs = await searchRepoIndex({
        query: queryRaw,
        limit: docLimit,
        kinds: indexKinds,
      });
      const docHits: SearchHit[] = docs.items.map((item) => ({
        id: item.id,
        snippet: item.snippet ?? item.summary ?? item.title,
        score: Number(item.score.toFixed(3)),
        kind: "file",
        keys: [...(item.tags ?? []), item.kind],
        path: item.source?.path,
        file_path: item.source?.path,
        snippet_id: item.id,
      }));
      hits = fuseHitsRrf(graphHits, docHits, limit);
    } catch {
      hits = graphHits;
    }
  }
  if (DIVERSIFY_HITS) {
    hits = diversifyHitsByPath(hits, limit);
  }

  const packets = hits.map((hit) => ({
    id: hit.id,
    essence_id: params.projectId ? `${params.projectId}::${hit.id}` : hit.id,   
    kind: "repo_context" as const,
    file_path: hit.file_path ?? hit.path ?? hit.id,
    symbol_name: hit.symbol_name,
    snippet: hit.snippet,
    score: hit.score,
  }));

  const collapse_inputs = { text: packets.map((p) => p.essence_id) };
  return { nodes: ranked.map((r) => ({ ...r.node, score: r.score })), edges: edgesSubset, hits, packets, collapse_inputs };
}

function nodeMatchesQuery(node: RepoGraphNode, query: string): boolean {
  const normalized = query;
  return (
    normalizeForMatch(node.name).includes(normalized) ||
    normalizeForMatch(node.path ?? "").includes(normalized)
  );
}

function buildSnippet(node: RepoGraphNode, edges: RepoGraphEdge[]): string {
  const related = edges.filter((edge) => edge.source === node.id || edge.target === node.id);
  const parts = [`${node.kind}: ${node.name}`];
  const withContext = related.slice(0, 3).map((edge) => {
    const label = edge.kind;
    const target = edge.source === node.id ? edge.target : edge.source;
    const citation = edge.citation_context ? ` (${edge.citation_context.slice(0, 140)})` : "";
    return `${label} ${target}${citation}`;
  });
  return [...parts, ...withContext].join(" | ");
}
