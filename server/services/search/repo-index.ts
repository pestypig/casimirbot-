import fs from "node:fs/promises";
import path from "node:path";
import { hashEmbed } from "../hce-text";
import { IDEOLOGY_ARTIFACTS } from "@shared/ideology/ideology-artifacts";

export type RepoSearchKind = "artifact" | "ideology-node" | "doc" | "code";

type RepoSearchEntry = {
  id: string;
  kind: RepoSearchKind;
  title: string;
  summary?: string;
  body?: string;
  tags?: string[];
  source: Record<string, string | undefined>;
  tokens: string[];
  embedding: Float64Array | null;
};

export type RepoSearchHit = {
  id: string;
  kind: RepoSearchKind;
  title: string;
  summary?: string;
  snippet?: string;
  tags?: string[];
  score: number;
  source: Record<string, string | undefined>;
};

export type RepoSearchResponse = {
  query: string;
  items: RepoSearchHit[];
  total: number;
  filters: {
    kinds?: RepoSearchKind[];
    tags?: string[];
  };
};

export type RepoSearchItem = Omit<RepoSearchHit, "score"> & { body?: string };

type SearchOptions = {
  query: string;
  limit?: number;
  offset?: number;
  kinds?: RepoSearchKind[];
  tags?: string[];
};

const NON_WORD = /[^\p{Letter}\p{Number}]+/gu;
const KEYWORD_WEIGHT = 0.55;
const EMBEDDING_DIM = 128;
const parseEnvNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const CACHE_TTL_MS = Math.max(
  10_000,
  parseEnvNumber(process.env.REPO_SEARCH_CACHE_TTL_MS, 5 * 60 * 1000),
);
const FORCE_REFRESH = process.env.REPO_SEARCH_FORCE_REFRESH === "1";

const DEFAULT_MAX_FILES = Math.max(
  800,
  parseEnvNumber(process.env.REPO_SEARCH_MAX_FILES, 2400),
);
const DEFAULT_MAX_FILE_BYTES = Math.max(
  2_000,
  parseEnvNumber(process.env.REPO_SEARCH_MAX_BYTES_PER_FILE, 600_000),
);
const DEFAULT_PREVIEW_BYTES = Math.max(
  1_000,
  parseEnvNumber(process.env.REPO_SEARCH_PREVIEW_BYTES, 20_000),
);
const DEFAULT_ROOTS = [
  "docs",
  "docs/zen-ladder-pack",
  "shared",
  "client",
  "server",
  "src",
  "modules",
  "packages",
  "sdk",
  "tools",
  "scripts",
  "skills",
  "tests",
  "datasets",
  "configs",
  "public",
  "reports",
];
const DEFAULT_CODE_ROOTS = [
  "server",
  "client",
  "shared",
  "src",
  "modules",
  "packages",
  "sdk",
  "cli",
  "tools",
  "scripts",
  "tests",
];
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
const CODE_EXTENSIONS = new Set([
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
const DEFAULT_MAX_CODE_FILES = Math.max(
  800,
  parseEnvNumber(process.env.REPO_SEARCH_MAX_CODE_FILES, 4000),
);
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".cache",
  ".turbo",
  ".venv",
  ".pytest_cache",
  "artifacts",
  "out",
  "coverage",
  "tmp",
  "test-results",
  "sunpy_out",
]);

let cache: { entries: RepoSearchEntry[]; builtAt: number } | null = null;
let forceRefreshUsed = false;

const tokenize = (value: string): string[] =>
  value
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(NON_WORD, " ")
    .split(/\s+/)
    .filter(Boolean);

const dedupeTokens = (tokens: string[]): string[] => Array.from(new Set(tokens));

const dot = (a: Float64Array, b: Float64Array): number => {
  const len = Math.min(a.length, b.length);
  let acc = 0;
  for (let i = 0; i < len; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
};

const normalizeScore = (value: number): number => Math.max(0, Math.min(1, (value + 1) / 2));

const keywordScore = (queryTokens: string[], docTokens: string[]): number => {
  if (queryTokens.length === 0 || docTokens.length === 0) {
    return 0;
  }
  const set = new Set(docTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (set.has(token)) {
      hits += 1;
    }
  }
  return hits / queryTokens.length;
};

const embeddingScore = (query: Float64Array | null, doc: Float64Array | null): number => {
  if (!query || !doc || query.length === 0 || doc.length === 0) {
    return 0;
  }
  const similarity = dot(query, doc);
  return normalizeScore(similarity);
};

const buildEmbedding = (text?: string): Float64Array | null => {
  const normalized = text?.trim();
  if (!normalized) return null;
  return hashEmbed(normalized, EMBEDDING_DIM);
};

const clip = (value: string, max: number): string => {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 3))}...`;
};

const deriveTitle = (content: string, filePath: string): string => {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading && heading[1]) {
    return heading[1].trim();
  }
  return path.basename(filePath);
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeRoots = (roots: string[], fallback: string[]): string[] => {
  const resolved = roots.length > 0 ? roots : fallback;
  const trimmed = resolved.map((entry) => entry.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
};

const buildEntry = (
  id: string,
  kind: RepoSearchKind,
  title: string,
  summary: string | undefined,
  body: string | undefined,
  tags: string[] | undefined,
  source: Record<string, string | undefined>,
): RepoSearchEntry => {
  const text = [title, summary ?? "", body ?? "", ...(tags ?? [])].join(" ");
  return {
    id,
    kind,
    title,
    summary,
    body,
    tags,
    source,
    tokens: dedupeTokens(tokenize(text)),
    embedding: buildEmbedding(text),
  };
};

const artifactEntries = (): RepoSearchEntry[] =>
  IDEOLOGY_ARTIFACTS.map((artifact) =>
    buildEntry(
      `artifact:${artifact.id}`,
      "artifact",
      artifact.title,
      artifact.summary,
      artifact.body,
      artifact.tags,
      {
        artifactId: artifact.id,
        panelId: artifact.panelId,
        nodeId: artifact.nodeId,
        exportKind: artifact.exportKind,
        exportTargetId: artifact.exportTargetId,
        formats: artifact.formats?.join(","),
      },
    ),
  );

type IdeologyNode = {
  id: string;
  title?: string;
  excerpt?: string;
  bodyMD?: string;
  tags?: string[];
};

const ideologyEntries = async (): Promise<RepoSearchEntry[]> => {
  try {
    const payload = await fs.readFile(path.resolve("docs/ethos/ideology.json"), "utf8");
    const parsed = JSON.parse(payload) as { nodes?: IdeologyNode[] };
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    return nodes.map((node) =>
      buildEntry(
        `ideology:${node.id}`,
        "ideology-node",
        node.title ?? node.id,
        node.excerpt,
        node.bodyMD,
        node.tags,
        { nodeId: node.id },
      ),
    );
  } catch {
    return [];
  }
};

const walkFiles = async (
  root: string,
  limit: number,
  extensions: Set<string>,
): Promise<string[]> => {
  const results: string[] = [];
  const queue: string[] = [root];
  let cursor = 0;
  while (cursor < queue.length && results.length < limit) {
    const current = queue[cursor];
    cursor += 1;
    let entries: Array<import("node:fs").Dirent>;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) {
          continue;
        }
        queue.push(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.has(ext)) {
          results.push(full);
          if (results.length >= limit) break;
        }
      }
      if (results.length >= limit) break;
    }
  }
  return results;
};

const docEntries = async (): Promise<RepoSearchEntry[]> => {
  const roots = (process.env.REPO_SEARCH_ROOTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const searchRoots = normalizeRoots(roots, DEFAULT_ROOTS);
  const entries: RepoSearchEntry[] = [];
  const maxFiles = DEFAULT_MAX_FILES;
  const cwd = process.cwd();
  const seen = new Set<string>();
  try {
    const rootEntries = await fs.readdir(cwd, { withFileTypes: true });
    rootEntries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of rootEntries) {
      if (entries.length >= maxFiles) break;
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!DOC_EXTENSIONS.has(ext)) continue;
      const rel = entry.name;
      const normalizedPath = rel.replace(/\\/g, "/");
      if (seen.has(normalizedPath)) continue;
      try {
        const filePath = path.resolve(cwd, entry.name);
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;
        if (stat.size > DEFAULT_MAX_FILE_BYTES) continue;
        const contentRaw = await fs.readFile(filePath, "utf8");
        const normalized = normalizeWhitespace(contentRaw);
        const preview = clip(normalized, DEFAULT_PREVIEW_BYTES);
        const title = deriveTitle(contentRaw, rel);
        const summary = clip(
          normalizeWhitespace(contentRaw.split("\n").slice(0, 6).join(" ")),
          240,
        );
        const tagParts = normalizedPath
          .split("/")
          .map((part) => part.replace(/\.[^.]+$/, ""))
          .filter(Boolean);
        const tags = Array.from(new Set([normalizedPath, ...tagParts]));
        entries.push(
          buildEntry(
            `doc:${rel}`,
            "doc",
            title,
            summary,
            preview,
            tags,
            { path: rel },
          ),
        );
        seen.add(normalizedPath);
      } catch {
        continue;
      }
    }
  } catch {
    // Ignore root scan failures.
  }
  let remainingRoots = searchRoots.length;
  let remainingBudget = Math.max(0, maxFiles - entries.length);

  for (const root of searchRoots) {
    if (entries.length >= maxFiles || remainingBudget <= 0) break;
    const perRoot = Math.max(1, Math.floor(remainingBudget / remainingRoots));
    const budget = Math.min(remainingBudget, perRoot);
    if (budget <= 0) continue;
    const absRoot = path.resolve(cwd, root);
    const files = await walkFiles(absRoot, budget, DOC_EXTENSIONS);
    let added = 0;
    for (const filePath of files) {
      if (entries.length >= maxFiles) break;
      const rel = path.relative(cwd, filePath);
      const normalizedPath = rel.replace(/\\/g, "/");
      if (seen.has(normalizedPath)) continue;
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;
        if (stat.size > DEFAULT_MAX_FILE_BYTES) continue;
        const contentRaw = await fs.readFile(filePath, "utf8");
        const normalized = normalizeWhitespace(contentRaw);
        const preview = clip(normalized, DEFAULT_PREVIEW_BYTES);
        const title = deriveTitle(contentRaw, rel);
        const summary = clip(normalizeWhitespace(contentRaw.split("\n").slice(0, 6).join(" ")), 240);
        const tagParts = normalizedPath
          .split("/")
          .map((part) => part.replace(/\.[^.]+$/, ""))
          .filter(Boolean);
        const tags = Array.from(new Set([normalizedPath, ...tagParts]));
        entries.push(
          buildEntry(
            `doc:${rel}`,
            "doc",
            title,
            summary,
            preview,
            tags,
            { path: rel },
          ),
        );
        seen.add(normalizedPath);
        added += 1;
      } catch {
        continue;
      }
    }
    remainingBudget -= added;
    remainingRoots = Math.max(0, remainingRoots - 1);
  }
  return entries;
};

const codeEntries = async (): Promise<RepoSearchEntry[]> => {
  if (process.env.REPO_SEARCH_INCLUDE_CODE === "0") {
    return [];
  }
  const roots = (process.env.REPO_SEARCH_CODE_ROOTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const searchRoots = normalizeRoots(roots, DEFAULT_CODE_ROOTS);
  const entries: RepoSearchEntry[] = [];
  const maxFiles = DEFAULT_MAX_CODE_FILES;
  const cwd = process.cwd();
  const seen = new Set<string>();
  try {
    const rootEntries = await fs.readdir(cwd, { withFileTypes: true });
    rootEntries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of rootEntries) {
      if (entries.length >= maxFiles) break;
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) continue;
      const rel = entry.name;
      const normalizedPath = rel.replace(/\\/g, "/");
      if (seen.has(normalizedPath)) continue;
      try {
        const filePath = path.resolve(cwd, entry.name);
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;
        if (stat.size > DEFAULT_MAX_FILE_BYTES) continue;
        const contentRaw = await fs.readFile(filePath, "utf8");
        const normalized = normalizeWhitespace(contentRaw);
        const preview = clip(normalized, DEFAULT_PREVIEW_BYTES);
        const title = path.basename(rel);
        const summary = clip(
          normalizeWhitespace(contentRaw.split("\n").slice(0, 6).join(" ")),
          240,
        );
        const tagParts = normalizedPath
          .split("/")
          .map((part) => part.replace(/\.[^.]+$/, ""))
          .filter(Boolean);
        const tags = Array.from(new Set([normalizedPath, ...tagParts]));
        entries.push(
          buildEntry(
            `code:${rel}`,
            "code",
            title,
            summary,
            preview,
            tags,
            { path: rel },
          ),
        );
        seen.add(normalizedPath);
      } catch {
        continue;
      }
    }
  } catch {
    // Ignore root scan failures.
  }
  let remainingRoots = searchRoots.length;
  let remainingBudget = Math.max(0, maxFiles - entries.length);

  for (const root of searchRoots) {
    if (entries.length >= maxFiles || remainingBudget <= 0) break;
    const perRoot = Math.max(1, Math.floor(remainingBudget / remainingRoots));
    const budget = Math.min(remainingBudget, perRoot);
    if (budget <= 0) continue;
    const absRoot = path.resolve(cwd, root);
    const files = await walkFiles(absRoot, budget, CODE_EXTENSIONS);
    let added = 0;
    for (const filePath of files) {
      if (entries.length >= maxFiles) break;
      const rel = path.relative(cwd, filePath);
      const normalizedPath = rel.replace(/\\/g, "/");
      if (seen.has(normalizedPath)) continue;
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;
        if (stat.size > DEFAULT_MAX_FILE_BYTES) continue;
        const contentRaw = await fs.readFile(filePath, "utf8");
        const normalized = normalizeWhitespace(contentRaw);
        const preview = clip(normalized, DEFAULT_PREVIEW_BYTES);
        const title = path.basename(rel);
        const summary = clip(
          normalizeWhitespace(contentRaw.split("\n").slice(0, 6).join(" ")),
          240,
        );
        const tagParts = normalizedPath
          .split("/")
          .map((part) => part.replace(/\.[^.]+$/, ""))
          .filter(Boolean);
        const tags = Array.from(new Set([normalizedPath, ...tagParts]));
        entries.push(
          buildEntry(
            `code:${rel}`,
            "code",
            title,
            summary,
            preview,
            tags,
            { path: rel },
          ),
        );
        seen.add(normalizedPath);
        added += 1;
      } catch {
        continue;
      }
    }
    remainingBudget -= added;
    remainingRoots = Math.max(0, remainingRoots - 1);
  }
  return entries;
};

const buildIndex = async (): Promise<RepoSearchEntry[]> => {
  const [ideology, docs, code] = await Promise.all([
    ideologyEntries(),
    docEntries(),
    codeEntries(),
  ]);
  return [...artifactEntries(), ...ideology, ...docs, ...code];
};

const filterByTags = (entry: RepoSearchEntry, tags?: string[]): boolean => {
  if (!tags || tags.length === 0) return true;
  const tagSet = new Set((entry.tags ?? []).map((tag) => tag.toLowerCase()));
  return tags.some((tag) => tagSet.has(tag.toLowerCase()));
};

export async function getRepoSearchIndex(): Promise<RepoSearchEntry[]> {        
  const now = Date.now();
  const shouldForceRefresh = FORCE_REFRESH && !forceRefreshUsed;
  if (!shouldForceRefresh && cache && now - cache.builtAt < CACHE_TTL_MS) {
    return cache.entries;
  }
  const entries = await buildIndex();
  cache = { entries, builtAt: now };
  if (FORCE_REFRESH) {
    forceRefreshUsed = true;
  }
  return entries;
}

export async function searchRepoIndex(options: SearchOptions): Promise<RepoSearchResponse> {
  const query = (options.query ?? "").trim();
  const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
  const offset = Math.max(0, options.offset ?? 0);
  const tags = options.tags?.map((tag) => tag.trim()).filter(Boolean);
  const kinds = options.kinds?.length ? options.kinds : undefined;
  const entries = await getRepoSearchIndex();

  if (!query) {
    return { query, items: [], total: 0, filters: { kinds, tags } };
  }

  const queryTokens = dedupeTokens(tokenize(query));
  const queryVector = hashEmbed(query, EMBEDDING_DIM);

  const ranked = entries
    .filter((entry) => (kinds ? kinds.includes(entry.kind) : true))
    .filter((entry) => filterByTags(entry, tags))
    .map((entry) => {
      const kwScore = keywordScore(queryTokens, entry.tokens);
      const embScore = embeddingScore(queryVector, entry.embedding);
      const score = KEYWORD_WEIGHT * kwScore + (1 - KEYWORD_WEIGHT) * embScore;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const total = ranked.length;
  const sliced = ranked.slice(offset, offset + limit);
  const items = sliced.map(({ entry, score }) => ({
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    summary: entry.summary,
    snippet: entry.body ? clip(entry.body, 320) : undefined,
    tags: entry.tags,
    score: Number(score.toFixed(3)),
    source: entry.source,
  }));

  return { query, items, total, filters: { kinds, tags } };
}

export async function getRepoSearchItem(id: string): Promise<RepoSearchItem | null> {
  const entries = await getRepoSearchIndex();
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) return null;
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    summary: entry.summary,
    snippet: entry.body ? clip(entry.body, 320) : undefined,
    tags: entry.tags,
    source: entry.source,
    body: entry.body,
  };
}
