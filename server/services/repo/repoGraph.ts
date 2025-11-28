import * as fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

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

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt"]);
const DEFAULT_MAX_FILES = Math.max(200, Number(process.env.REPO_GRAPH_MAX_FILES ?? 600));
const CACHE_TTL_MS = 5 * 60 * 1000;

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

function scoreNode(node: RepoGraphNode, query: string, degree: number, opts?: { warpIntent?: boolean }): number {
  const nameScore = normalizeForMatch(node.name).includes(query) ? 3 : 0;
  const tagScore = (node.tags ?? []).some((t) => normalizeForMatch(t).includes(query)) ? 1 : 0;
  const warpBoost = opts?.warpIntent && isWarpRelevantPath(node.path) ? 5 : 0;
  const warpPenalty = opts?.warpIntent && !isWarpRelevantPath(node.path) ? -1 : 0;
  return nameScore + tagScore + Math.log(1 + degree) + warpBoost + warpPenalty;
}

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
  if (!cache || now - cache.builtAt > CACHE_TTL_MS) {
    await buildRepoGraph();
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

  ranked = ranked.slice(0, limit);

  const selectedIds = new Set(ranked.map((r) => r.node.id));
  const edgesSubset = graph.edges.filter((edge) => selectedIds.has(edge.source) || selectedIds.has(edge.target)).slice(0, limit * 2);

  const hits: SearchHit[] = ranked.map((entry) => ({
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
