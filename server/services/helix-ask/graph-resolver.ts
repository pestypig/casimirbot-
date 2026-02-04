import * as fs from "node:fs";
import * as path from "node:path";
import type { HelixAskConceptMatch } from "./concepts";
import type { HelixAskTopicTag } from "./topic";
import { filterSignalTokens, tokenizeAskQuery } from "./query";

export type HelixAskGraphResolvedNode = {
  id: string;
  title: string;
  excerpt?: string;
  artifact?: string;
  tags: string[];
  score: number;
  depth: number;
  relation?: string;
  role?: string;
};

export type HelixAskGraphFramework = {
  treeId: string;
  treeLabel?: string;
  sourcePath: string;
  rootId?: string;
  anchors: HelixAskGraphResolvedNode[];
  path: HelixAskGraphResolvedNode[];
  scaffoldText: string;
  contextText: string;
  preferGraph: boolean;
  rankScore?: number;
  anchorScore?: number;
  pathScore?: number;
};

export type HelixAskGraphPack = {
  frameworks: HelixAskGraphFramework[];
  scaffoldText: string;
  contextText: string;
  preferGraph: boolean;
  sourcePaths: string[];
  treeIds: string[];
  primaryTreeId?: string;
};

type GraphResolverTreeConfig = {
  id: string;
  label?: string;
  path: string;
  topicTags?: HelixAskTopicTag[];
  matchers?: string[];
  maxAnchors?: number;
  maxDepth?: number;
  maxNodes?: number;
  minAnchorScore?: number;
  preferGraph?: boolean;
  edgePriority?: Record<string, number>;
  roleMatchers?: Record<string, string[]>;
};

type GraphResolverPackConfig = {
  maxTrees?: number;
  minScore?: number;
  minScoreRatio?: number;
};

type GraphResolverConfig = {
  version?: number;
  pack?: GraphResolverPackConfig;
  trees?: GraphResolverTreeConfig[];
};

type GraphLink = { rel?: string; to?: string };

type GraphNode = {
  id: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  bodyMD?: string;
  tags: string[];
  children: string[];
  links: GraphLink[];
  searchText: string;
  tagText: string;
};

type GraphTree = {
  id: string;
  label?: string;
  sourcePath: string;
  rootId?: string;
  nodes: GraphNode[];
  nodeById: Map<string, GraphNode>;
  neighbors: Map<string, Array<{ id: string; rel: string; weight: number }>>;
  config: GraphResolverTreeConfig;
};

const GRAPH_CONFIG_PATHS = [
  "configs/graph-resolvers.json",
  "graph-resolvers.json",
  "configs/helix-ask-graphs.json",
  "helix-ask-graphs.json",
];

const DEFAULT_EDGE_PRIORITY: Record<string, number> = {
  child: 3,
  parent: 2,
  "see-also": 1,
};

const DEFAULT_MAX_ANCHORS = 3;
const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_MAX_NODES = 8;
const DEFAULT_MIN_ANCHOR_SCORE = 4;
const DEFAULT_MAX_PACK_TREES = 3;
const DEFAULT_PACK_MIN_SCORE = 6;
const DEFAULT_PACK_MIN_SCORE_RATIO = 0.25;
const MAX_PACK_TREES_LIMIT = 6;

type GraphConfigCache = { config: GraphResolverConfig; path: string; mtimeMs: number };
let graphConfigCache: GraphConfigCache | null = null;

const graphTreeCache = new Map<string, { tree: GraphTree; mtimeMs: number }>();

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^a-z0-9\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clipText = (value: string, limit: number): string => {
  const cleaned = value.trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, Math.max(0, limit - 3)).trim()}...`;
};

const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const coerceNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveConfigPath = (): string | null => {
  for (const candidate of GRAPH_CONFIG_PATHS) {
    const fullPath = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
};

const loadGraphResolverConfig = (): GraphResolverConfig | null => {
  const configPath = resolveConfigPath();
  if (!configPath) return null;
  try {
    const stats = fs.statSync(configPath);
    if (graphConfigCache && graphConfigCache.path === configPath && graphConfigCache.mtimeMs === stats.mtimeMs) {
      return graphConfigCache.config;
    }
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as GraphResolverConfig;
    graphConfigCache = { config: parsed, path: configPath, mtimeMs: stats.mtimeMs };
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[helix-ask] graph resolver config load failed: ${message}`);
    return null;
  }
};

const buildSearchText = (node: GraphNode): string => {
  const parts = [
    node.id,
    node.slug ?? "",
    node.title ?? "",
    node.excerpt ?? "",
    node.bodyMD ?? "",
    ...(node.tags ?? []),
  ]
    .map((part) => normalizeText(part))
    .filter(Boolean);
  return parts.join(" ");
};

const buildTagText = (node: GraphNode): string => normalizeText((node.tags ?? []).join(" "));

const coerceNode = (raw: any): GraphNode | null => {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : undefined;
  const title = typeof raw.title === "string" ? raw.title.trim() : undefined;
  const excerpt = typeof raw.excerpt === "string" ? raw.excerpt.trim() : undefined;
  const bodyMD = typeof raw.bodyMD === "string" ? raw.bodyMD.trim() : undefined;
  const tags = ensureArray<string>(raw.tags).filter((entry) => typeof entry === "string");
  const children = ensureArray<string>(raw.children).filter((entry) => typeof entry === "string");
  const links = ensureArray<GraphLink>(raw.links).filter((link) => link && typeof link === "object");
  const node: GraphNode = {
    id,
    slug,
    title,
    excerpt,
    bodyMD,
    tags,
    children,
    links,
    searchText: "",
    tagText: "",
  };
  node.searchText = buildSearchText(node);
  node.tagText = buildTagText(node);
  return node;
};

const loadGraphTree = (config: GraphResolverTreeConfig): GraphTree | null => {
  const sourcePath = config.path;
  if (!sourcePath) return null;
  const fullPath = path.resolve(process.cwd(), sourcePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    const stats = fs.statSync(fullPath);
    const cacheKey = `${config.id}:${fullPath}`;
    const cached = graphTreeCache.get(cacheKey);
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.tree;
    }
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as { rootId?: string; nodes?: unknown[] };
    const nodes = ensureArray(parsed.nodes).map(coerceNode).filter(Boolean) as GraphNode[];
    const nodeById = new Map<string, GraphNode>();
    nodes.forEach((node) => nodeById.set(node.id, node));
    const neighbors = new Map<string, Array<{ id: string; rel: string; weight: number }>>();
    const edgePriority = { ...DEFAULT_EDGE_PRIORITY, ...(config.edgePriority ?? {}) };
    const addNeighbor = (from: string, to: string, rel: string): void => {
      if (!nodeById.has(from) || !nodeById.has(to)) return;
      const list = neighbors.get(from) ?? [];
      list.push({ id: to, rel, weight: edgePriority[rel] ?? 1 });
      neighbors.set(from, list);
    };
    for (const node of nodes) {
      for (const child of node.children) {
        addNeighbor(node.id, child, "child");
        addNeighbor(child, node.id, "parent");
      }
      for (const link of node.links) {
        const target = typeof link.to === "string" ? link.to : "";
        const rel = typeof link.rel === "string" ? link.rel : "see-also";
        if (target) {
          addNeighbor(node.id, target, rel);
        }
      }
    }
    const tree: GraphTree = {
      id: config.id,
      label: config.label,
      sourcePath,
      rootId: typeof parsed.rootId === "string" ? parsed.rootId : undefined,
      nodes,
      nodeById,
      neighbors,
      config,
    };
    graphTreeCache.set(cacheKey, { tree, mtimeMs: stats.mtimeMs });
    return tree;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[helix-ask] graph resolver tree load failed (${config.path}): ${message}`);
    return null;
  }
};

const parseMatcher = (value: string): RegExp => {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && trimmed.endsWith("/")) {
    const body = trimmed.slice(1, -1);
    return new RegExp(body, "i");
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
};

const shouldUseTree = (config: GraphResolverTreeConfig, question: string, tags: HelixAskTopicTag[]): boolean => {
  const tagMatch =
    (config.topicTags ?? []).length > 0 ? (config.topicTags ?? []).some((tag) => tags.includes(tag)) : false;
  const matchers = (config.matchers ?? []).map(parseMatcher);
  const matcherMatch = matchers.length > 0 ? matchers.some((matcher) => matcher.test(question)) : false;
  if (config.topicTags?.length || config.matchers?.length) {
    return tagMatch || matcherMatch;
  }
  return false;
};

const extractQuestionTokens = (question: string): string[] => {
  const tokens = filterSignalTokens(tokenizeAskQuery(question))
    .map((token) => normalizeText(token))
    .filter((token) => token.length >= 4 && !/^\d+$/.test(token));
  return Array.from(new Set(tokens));
};

const extractConceptBoosts = (conceptMatch?: HelixAskConceptMatch | null): string[] => {
  if (!conceptMatch) return [];
  const boosts = [
    conceptMatch.card.id,
    conceptMatch.card.label ?? "",
    ...(conceptMatch.card.aliases ?? []),
  ]
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
  return Array.from(new Set(boosts));
};

const scoreNode = (
  node: GraphNode,
  tokens: string[],
  questionNorm: string,
  conceptBoosts: string[],
): number => {
  if (tokens.length === 0 && conceptBoosts.length === 0) return 0;
  let score = 0;
  const idText = normalizeText(node.id);
  const slugText = normalizeText(node.slug ?? "");
  const titleText = normalizeText(node.title ?? "");
  const excerptText = normalizeText(node.excerpt ?? "");
  const bodyText = normalizeText(node.bodyMD ?? "");
  for (const token of tokens) {
    if (!token) continue;
    if (idText.includes(token)) score += 8;
    if (slugText.includes(token)) score += 6;
    if (titleText.includes(token)) score += 6;
    if (node.tagText.includes(token)) score += 5;
    if (excerptText.includes(token)) score += 3;
    if (bodyText.includes(token)) score += 1;
  }
  if (titleText && questionNorm.includes(titleText)) {
    score += 6;
  }
  if (conceptBoosts.length) {
    for (const boost of conceptBoosts) {
      if (!boost) continue;
      if (idText === boost || slugText === boost || titleText === boost) {
        score += 12;
      } else if (titleText.includes(boost) || idText.includes(boost)) {
        score += 6;
      }
    }
  }
  return score;
};

const extractArtifact = (bodyMD?: string): string | undefined => {
  if (!bodyMD) return undefined;
  const match = bodyMD.match(/minimal artifact:\s*([^\n]+)/i);
  if (!match) return undefined;
  return match[1].trim();
};

const extractExcerpt = (node: GraphNode): string | undefined => {
  if (node.excerpt) return node.excerpt;
  if (!node.bodyMD) return undefined;
  const cleaned = node.bodyMD.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  const match = cleaned.match(/(.{40,220}?[.!?])\s/);
  if (match) return match[1].trim();
  return cleaned.slice(0, 200).trim();
};

const scoreRoleMatch = (node: GraphNode, terms: string[]): number => {
  if (terms.length === 0) return 0;
  const haystack = node.searchText;
  let score = 0;
  for (const term of terms) {
    const norm = normalizeText(term);
    if (!norm) continue;
    if (haystack.includes(norm)) score += 1;
  }
  return score;
};

const resolveRoles = (
  tree: GraphTree,
  selected: HelixAskGraphResolvedNode[],
): HelixAskGraphResolvedNode[] => {
  const roleMatchers = tree.config.roleMatchers;
  if (!roleMatchers || Object.keys(roleMatchers).length === 0) return selected;
  const selectedIds = new Set(selected.map((node) => node.id));
  const next = [...selected];
  for (const [role, terms] of Object.entries(roleMatchers)) {
    if (next.some((node) => node.role === role)) continue;
    if (next.some((node) => scoreRoleMatch(tree.nodeById.get(node.id)!, terms) > 0)) continue;
    let best: GraphNode | null = null;
    let bestScore = 0;
    for (const node of tree.nodes) {
      if (selectedIds.has(node.id)) continue;
      const score = scoreRoleMatch(node, terms);
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    }
    if (best && bestScore > 0) {
      selectedIds.add(best.id);
      next.push({
        id: best.id,
        title: best.title ?? best.id,
        excerpt: extractExcerpt(best),
        artifact: extractArtifact(best.bodyMD),
        tags: best.tags,
        score: bestScore,
        depth: 0,
        relation: "role",
        role,
      });
    }
  }
  return next;
};

const buildScaffoldLines = (
  tree: GraphTree,
  anchors: HelixAskGraphResolvedNode[],
  path: HelixAskGraphResolvedNode[],
): string[] => {
  const anchorIds = new Set(anchors.map((node) => node.id));
  return path.map((node) => {
    const title = node.title ?? node.id;
    const excerpt = node.excerpt ? clipText(node.excerpt, 160) : "";
    const artifact = node.artifact ? clipText(node.artifact, 120) : "";
    const rolePrefix = node.role ? `Role:${node.role}` : anchorIds.has(node.id) ? "Anchor" : "Walk";
    const parts = [`${rolePrefix}: ${title}`];
    if (node.id && normalizeText(title) !== normalizeText(node.id)) {
      parts.push(`(${node.id})`);
    }
    if (excerpt) {
      parts.push(`— ${excerpt}`);
    }
    if (artifact) {
      parts.push(`Minimal artifact: ${artifact}.`);
    }
    parts.push(`(${tree.sourcePath})`);
    return `- ${parts.join(" ")}`;
  });
};

const buildContextBlock = (tree: GraphTree, lines: string[]): string => {
  if (lines.length === 0) return "";
  const header = `Graph assembly (anchor-and-walk): ${tree.label ?? tree.id} (source: ${tree.sourcePath})`;
  return [header, ...lines].join("\n");
};

type GraphFrameworkCandidate = {
  framework: HelixAskGraphFramework;
  score: number;
  anchorScore: number;
  pathScore: number;
  hitCount: number;
};

const scoreGraphCandidate = (anchorScore: number, pathScore: number, hitCount: number): number =>
  anchorScore * 2 + pathScore + hitCount;

const mergeScaffoldText = (blocks: string[]): string => {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const trimmed = block?.trim();
    if (!trimmed) continue;
    for (const line of trimmed.split(/\r?\n/)) {
      const cleaned = line.trim();
      if (!cleaned) continue;
      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(cleaned);
    }
  }
  return lines.join("\n");
};

const mergeContextBlocks = (blocks: string[]): string => {
  const trimmed = blocks.map((block) => block?.trim() ?? "").filter(Boolean);
  if (trimmed.length === 0) return "";
  return trimmed.join("\n\n");
};

const buildFrameworkCandidate = (
  tree: GraphTree,
  tokens: string[],
  questionNorm: string,
  conceptBoosts: string[],
): GraphFrameworkCandidate | null => {
  const nodeScores = tree.nodes
    .map((node) => ({
      node,
      score: scoreNode(node, tokens, questionNorm, conceptBoosts),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (nodeScores.length === 0) return null;

  const treeConfig = tree.config;
  const minScore = treeConfig.minAnchorScore ?? DEFAULT_MIN_ANCHOR_SCORE;
  let anchors = nodeScores.filter((entry) => entry.score >= minScore);
  if (anchors.length === 0) {
    anchors = nodeScores.slice(0, 1);
  }
  const maxAnchors = treeConfig.maxAnchors ?? DEFAULT_MAX_ANCHORS;
  anchors = anchors.slice(0, maxAnchors);
  const resolvedAnchors: HelixAskGraphResolvedNode[] = anchors.map((entry) => ({
    id: entry.node.id,
    title: entry.node.title ?? entry.node.id,
    excerpt: extractExcerpt(entry.node),
    artifact: extractArtifact(entry.node.bodyMD),
    tags: entry.node.tags,
    score: entry.score,
    depth: 0,
    relation: "anchor",
  }));
  const maxDepth = treeConfig.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxNodes = treeConfig.maxNodes ?? DEFAULT_MAX_NODES;
  const ordered: HelixAskGraphResolvedNode[] = [...resolvedAnchors];
  const visited = new Set(resolvedAnchors.map((entry) => entry.id));
  const queue: Array<{ id: string; depth: number }> = resolvedAnchors.map((entry) => ({
    id: entry.id,
    depth: 0,
  }));
  while (queue.length > 0 && ordered.length < maxNodes) {
    const current = queue.shift();
    if (!current) break;
    if (current.depth >= maxDepth) continue;
    const neighbors = tree.neighbors.get(current.id) ?? [];
    const sortedNeighbors = neighbors
      .map((neighbor) => ({
        neighbor,
        score: tree.nodeById.get(neighbor.id)
          ? scoreNode(tree.nodeById.get(neighbor.id)!, tokens, questionNorm, conceptBoosts)
          : 0,
      }))
      .sort((a, b) => {
        if (a.neighbor.weight !== b.neighbor.weight) {
          return b.neighbor.weight - a.neighbor.weight;
        }
        return b.score - a.score;
      });
    for (const entry of sortedNeighbors) {
      if (ordered.length >= maxNodes) break;
      const neighbor = entry.neighbor;
      if (visited.has(neighbor.id)) continue;
      const node = tree.nodeById.get(neighbor.id);
      if (!node) continue;
      visited.add(neighbor.id);
      ordered.push({
        id: node.id,
        title: node.title ?? node.id,
        excerpt: extractExcerpt(node),
        artifact: extractArtifact(node.bodyMD),
        tags: node.tags,
        score: entry.score,
        depth: current.depth + 1,
        relation: neighbor.rel,
      });
      queue.push({ id: neighbor.id, depth: current.depth + 1 });
    }
  }
  const withRoles = resolveRoles(tree, ordered).slice(0, maxNodes);
  const lines = buildScaffoldLines(tree, resolvedAnchors, withRoles);
  if (lines.length === 0) return null;
  const scaffoldText = lines.join("\n");
  const contextText = buildContextBlock(tree, lines);
  const anchorScore = resolvedAnchors.reduce((sum, node) => sum + Math.max(0, node.score), 0);
  const pathScore = withRoles.reduce((sum, node) => sum + Math.max(0, node.score), 0);
  const hitCount = nodeScores.length;
  const treeScore = scoreGraphCandidate(anchorScore, pathScore, hitCount);
  const framework: HelixAskGraphFramework = {
    treeId: tree.id,
    treeLabel: tree.label,
    sourcePath: tree.sourcePath,
    rootId: tree.rootId,
    anchors: resolvedAnchors,
    path: withRoles,
    scaffoldText,
    contextText,
    preferGraph: treeConfig.preferGraph !== false,
    rankScore: treeScore,
    anchorScore,
    pathScore,
  };
  return { framework, score: treeScore, anchorScore, pathScore, hitCount };
};

export function resolveHelixAskGraphPack(input: {
  question: string;
  topicTags: HelixAskTopicTag[];
  conceptMatch?: HelixAskConceptMatch | null;
}): HelixAskGraphPack | null {
  const config = loadGraphResolverConfig();
  if (!config?.trees?.length) return null;
  const packConfig = config.pack ?? {};
  const maxPackTrees = clampNumber(
    Math.floor(coerceNumber(packConfig.maxTrees, DEFAULT_MAX_PACK_TREES)),
    1,
    MAX_PACK_TREES_LIMIT,
  );
  const minPackScore = coerceNumber(packConfig.minScore, DEFAULT_PACK_MIN_SCORE);
  const minPackScoreRatio = clampNumber(
    coerceNumber(packConfig.minScoreRatio, DEFAULT_PACK_MIN_SCORE_RATIO),
    0,
    1,
  );
  const question = input.question.trim();
  if (!question) return null;
  const trees = config.trees.filter((tree) => tree && tree.id && tree.path);
  if (trees.length === 0) return null;
  const matchingTrees = trees.filter((tree) => shouldUseTree(tree, question, input.topicTags));
  if (matchingTrees.length === 0) return null;
  const questionNorm = normalizeText(question);
  const tokens = extractQuestionTokens(question);
  const conceptBoosts = extractConceptBoosts(input.conceptMatch);
  const candidates: GraphFrameworkCandidate[] = [];
  for (const treeConfig of matchingTrees) {
    const tree = loadGraphTree(treeConfig);
    if (!tree) continue;
    const candidate = buildFrameworkCandidate(tree, tokens, questionNorm, conceptBoosts);
    if (candidate) candidates.push(candidate);
  }
  if (candidates.length === 0) return null;
  const sorted = candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.anchorScore !== a.anchorScore) return b.anchorScore - a.anchorScore;
    if (b.framework.path.length !== a.framework.path.length) {
      return b.framework.path.length - a.framework.path.length;
    }
    return a.framework.treeId.localeCompare(b.framework.treeId);
  });
  const topScore = sorted[0].score;
  const threshold = Math.max(minPackScore, topScore * minPackScoreRatio);
  let filtered = sorted.filter((candidate) => candidate.score >= threshold);
  if (filtered.length === 0) filtered = [sorted[0]];
  const maxTrees = Math.min(maxPackTrees, filtered.length);
  const selected = filtered.slice(0, maxTrees).map((candidate) => candidate.framework);
  const scaffoldText = mergeScaffoldText(selected.map((framework) => framework.scaffoldText));
  const contextText = mergeContextBlocks(selected.map((framework) => framework.contextText));
  const preferGraph = selected.some((framework) => framework.preferGraph);
  const sourcePaths = Array.from(
    new Set(
      selected
        .map((framework) => framework.sourcePath)
        .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0),
    ),
  );
  const treeIds = selected.map((framework) => framework.treeId);
  return {
    frameworks: selected,
    scaffoldText,
    contextText,
    preferGraph,
    sourcePaths,
    treeIds,
    primaryTreeId: selected[0]?.treeId,
  };
}

export function resolveHelixAskGraphFramework(input: {
  question: string;
  topicTags: HelixAskTopicTag[];
  conceptMatch?: HelixAskConceptMatch | null;
}): HelixAskGraphFramework | null {
  const pack = resolveHelixAskGraphPack(input);
  return pack?.frameworks[0] ?? null;
}
