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
  evidence?: HelixAskGraphEvidence[];
  summary?: string;
  nodeType?: string;
  inputs?: Array<Record<string, unknown>>;
  outputs?: Array<Record<string, unknown>>;
  assumptions?: string[];
  validity?: Record<string, unknown>;
  deterministic?: boolean;
  tolerance?: Record<string, unknown>;
  dependencies?: string[];
  environment?: Record<string, unknown>;
  sourcePath?: string;
};

type HelixAskGraphPathMode = "full" | "root_to_leaf" | "root_to_anchor";

export type HelixAskGraphEvidence = {
  type: "doc" | "code" | "test" | "telemetry";
  path?: string;
  symbol?: string;
  heading?: string;
  field?: string;
  contains?: string;
  note?: string;
  scope?: string;
  provenance_class?: "measured" | "proxy" | "inferred";
  claim_tier?: "diagnostic" | "reduced-order" | "certified";
  certifying?: boolean;
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
  pathMode?: HelixAskGraphPathMode;
  pathFallbackReason?: string;
  rankScore?: number;
  anchorScore?: number;
  pathScore?: number;
  congruenceDiagnostics?: HelixAskGraphCongruenceDiagnostics;
  missingEvidencePath?: HelixAskGraphMissingEvidencePath;
};

export type HelixAskGraphMissingEvidencePath = {
  treeId: string;
  family: "life_cosmology_consciousness" | "ai_financial_defense_security";
  requiredAnchors: string[];
  missingAnchors: string[];
  bridgeNodes: string[];
};

export type HelixAskGraphCongruenceDiagnostics = {
  inventory: {
    nodesCount: number;
    evaluatedEdges: number;
    blockedLinkCount: number;
  };
  allowedEdges: number;
  blockedEdges: number;
  resolvedInTreeEdges: number;
  resolvedCrossTreeEdges: number;
  blockedByReason: {
    blocked_link: number;
    conceptual_disallowed: number;
    proxy_disallowed: number;
    cl_exceeds_allowed: number;
    chart_mismatch: number;
    condition_unsatisfied: number;
    unresolved_target: number;
    node_missing_equation_ref: number;
    node_missing_claim_ids: number;
  };
  blockedByCondition: Record<string, number>;
  strictSignals: {
    B_equals_1: boolean;
    qi_metric_derived_equals_true: boolean;
    qi_strict_ok_equals_true: boolean;
    theta_geom_equals_true: boolean;
    vdb_two_wall_support_equals_true: boolean;
    ts_metric_derived_equals_true: boolean;
    cl3_metric_t00_available_equals_true: boolean;
    cl3_rho_gate_equals_true: boolean;
  };
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
  pathMode?: HelixAskGraphPathMode;
  topicTags?: HelixAskTopicTag[];
  matchers?: string[];
  weight?: number;
  maxAnchors?: number;
  maxDepth?: number;
  maxNodes?: number;
  minAnchorScore?: number;
  preferGraph?: boolean;
  edgePriority?: Record<string, number>;
  roleMatchers?: Record<string, string[]>;
  congruenceWalkOverride?: HelixAskCongruenceWalkOverride;
};

type GraphResolverPackConfig = {
  maxTrees?: number;
  minScore?: number;
  minScoreRatio?: number;
  pathMode?: HelixAskGraphPathMode;
};

type GraphResolverConfig = {
  version?: number;
  pack?: GraphResolverPackConfig;
  trees?: GraphResolverTreeConfig[];
  routingPolicy?: {
    equation_binding_rail?: {
      required_node_types?: string[];
      canonical_backbone_path?: string;
      strict_fail_reason?: string;
    };
    claim_ids_linkage_rail?: {
      strict_fail_reason?: string;
    };
  };
};

type GraphLink = {
  rel?: string;
  to?: string;
  edgeType?: string;
  requiresCL?: string;
  condition?: string | null;
  chartDependency?: string | null;
  note?: string;
};

type GraphEdgeMeta = {
  edgeType?: string;
  requiresCL?: string;
  condition?: string | null;
  chartDependency?: string | null;
  proxy?: boolean | null;
};

type BlockedEdge = {
  source: string;
  target: string;
  edgeType?: string;
  requiresCL?: string;
  reason?: string;
};

type GraphNode = {
  id: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  bodyMD?: string;
  summary?: string;
  nodeType?: string;
  inputs?: Array<Record<string, unknown>>;
  outputs?: Array<Record<string, unknown>>;
  assumptions?: string[];
  validity?: Record<string, unknown>;
  deterministic?: boolean;
  tolerance?: Record<string, unknown>;
  dependencies?: string[];
  environment?: Record<string, unknown>;
  tags: string[];
  children: string[];
  links: GraphLink[];
  congruence?: { class?: string; chart?: string | null; congruenceLevel?: string | null } | null;
  childMeta?: Record<string, GraphEdgeMeta>;
  blockedLinks?: BlockedEdge[];
  evidence?: HelixAskGraphEvidence[];
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
  congruenceDiagnostics: HelixAskGraphCongruenceDiagnostics;
};

type GraphNodeRef = {
  node: GraphNode;
  treeId: string;
  sourcePath: string;
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
  "depends-on": 2,
};

const DEFAULT_MAX_ANCHORS = 3;
const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_MAX_NODES = 8;
const DEFAULT_MIN_ANCHOR_SCORE = 4;
const DEFAULT_MAX_PACK_TREES = 3;
const DEFAULT_PACK_MIN_SCORE = 6;
const DEFAULT_PACK_MIN_SCORE_RATIO = 0.25;
const MAX_PACK_TREES_LIMIT = 6;
const LOCKED_TREE_SCORE_BONUS = 4;
const DEFAULT_GRAPH_PATH_MODE: HelixAskGraphPathMode = "full";
const DEFAULT_MISSING_EQUATION_REF_FAIL_REASON = "FAIL_NODE_MISSING_EQUATION_REF";
const DEFAULT_MISSING_CLAIM_IDS_FAIL_REASON = "FAIL_NODE_MISSING_CLAIM_IDS";
const DEFAULT_EQUATION_BACKBONE_PATH = "configs/physics-equation-backbone.v1.json";
const DEFAULT_MATH_CLAIMS_DIR = "docs/knowledge/math-claims";

const LIFE_COSMOLOGY_CONSCIOUSNESS_RE =
  /\b(life|origin(?:s)? of life|abiogenesis|cosmology|consciousness|stellar consciousness|open-world)\b/i;
const AI_FINANCIAL_DEFENSE_SECURITY_RE =
  /\b(ai|financial|defense|security|fraud|phish(?:ing)?|cyber(?:security| attack)?)\b/i;

const DEFAULT_CONGRUENCE_WALK_CONFIG_PATH = "docs/warp-tree-dag-walk-config.json";
const DEFAULT_CONGRUENCE_WALK_CONFIG = {
  allowedCL: "CL4" as const,
  allowConceptual: false,
  allowProxies: false,
  chart: "comoving_cartesian",
  region: {
    B_equals_1: true,
    qi_metric_derived_equals_true: true,
    qi_strict_ok_equals_true: true,
    theta_geom_equals_true: true,
    vdb_two_wall_support_equals_true: false,
    ts_metric_derived_equals_true: false,
    cl3_metric_t00_available_equals_true: false,
    cl3_rho_gate_equals_true: false,
  },
};

type GraphConfigCache = { config: GraphResolverConfig; path: string; mtimeMs: number };
let graphConfigCache: GraphConfigCache | null = null;
type EquationBackboneCache = { ids: Set<string>; fullPath: string; mtimeMs: number };
let equationBackboneCache: EquationBackboneCache | null = null;
type ClaimRegistryCache = { ids: Set<string>; dirPath: string; fingerprint: string };
let claimRegistryCache: ClaimRegistryCache | null = null;

const graphTreeCache = new Map<string, { tree: GraphTree; mtimeMs: number }>();

const normalizeGraphPathMode = (value: unknown): HelixAskGraphPathMode | undefined => {
  if (value === "full" || value === "root_to_leaf") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "full") return "full";
    if (normalized === "root_to_leaf" || normalized === "root-to-leaf") return "root_to_leaf";
    if (normalized === "root_to_anchor" || normalized === "root-to-anchor") return "root_to_anchor";
  }
  return undefined;
};

type CongruenceWalkConfig = {
  allowedCL: "CL0" | "CL1" | "CL2" | "CL3" | "CL4";
  allowConceptual?: boolean;
  allowProxies?: boolean;
  chart?: string | null;
  region?: Record<string, boolean>;
};

type GraphFilterReason =
  | "blocked_link"
  | "conceptual_disallowed"
  | "proxy_disallowed"
  | "cl_exceeds_allowed"
  | "chart_mismatch"
  | "condition_unsatisfied"
  | "unresolved_target"
  | "node_missing_equation_ref"
  | "node_missing_claim_ids";

type GraphEdgeDecision = {
  allowed: boolean;
  reason?: GraphFilterReason;
  condition?: string | null;
  conditionKey?: string | null;
};

export type HelixAskCongruenceWalkOverride = Partial<
  Pick<CongruenceWalkConfig, "allowedCL" | "allowConceptual" | "allowProxies" | "chart" | "region">
>;

let congruenceWalkConfigCache: { config: CongruenceWalkConfig; mtimeMs: number } | null = null;

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

const cloneCongruenceWalkConfig = (config: CongruenceWalkConfig): CongruenceWalkConfig => ({
  ...config,
  region: config.region ? { ...config.region } : undefined,
});

const applyCongruenceWalkOverride = (
  base: CongruenceWalkConfig,
  override?: HelixAskCongruenceWalkOverride,
): CongruenceWalkConfig => {
  if (!override) return cloneCongruenceWalkConfig(base);
  const mergedRegion = {
    ...(base.region ?? {}),
    ...(override.region ?? {}),
  };
  return {
    allowedCL: override.allowedCL ?? base.allowedCL,
    allowConceptual: override.allowConceptual ?? base.allowConceptual,
    allowProxies: override.allowProxies ?? base.allowProxies,
    chart: override.chart ?? base.chart,
    region: Object.keys(mergedRegion).length > 0 ? mergedRegion : undefined,
  };
};

const mergeCongruenceOverrides = (
  base?: HelixAskCongruenceWalkOverride,
  override?: HelixAskCongruenceWalkOverride,
): HelixAskCongruenceWalkOverride | undefined => {
  if (!base && !override) return undefined;
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    region: {
      ...(base?.region ?? {}),
      ...(override?.region ?? {}),
    },
  };
};

const serializeCongruenceWalkConfig = (config: CongruenceWalkConfig): string => {
  const regionPairs = Object.entries(config.region ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value ? "1" : "0"}`);
  return [
    `cl=${config.allowedCL}`,
    `conceptual=${config.allowConceptual ? "1" : "0"}`,
    `proxies=${config.allowProxies ? "1" : "0"}`,
    `chart=${config.chart ?? ""}`,
    `region=${regionPairs.join("|")}`,
  ].join(";");
};

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

const normalizeEvidenceEntry = (value: unknown): HelixAskGraphEvidence | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const type = typeof raw.type === "string" ? raw.type.trim().toLowerCase() : "";
  if (!["doc", "code", "test", "telemetry"].includes(type)) return null;
  const entry: HelixAskGraphEvidence = { type: type as HelixAskGraphEvidence["type"] };
  const assignString = (key: Exclude<keyof HelixAskGraphEvidence, "type">) => {
    const rawValue = raw[key as string];
    if (typeof rawValue !== "string") return;
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    entry[key] = trimmed;
  };
  assignString("path");
  assignString("symbol");
  assignString("heading");
  assignString("field");
  assignString("contains");
  assignString("note");
  assignString("scope");
  const rawProvenanceClass =
    typeof raw.provenance_class === "string" ? raw.provenance_class.trim().toLowerCase() : "";
  if (rawProvenanceClass === "measured" || rawProvenanceClass === "proxy" || rawProvenanceClass === "inferred") {
    entry.provenance_class = rawProvenanceClass;
  }
  const rawClaimTier = typeof raw.claim_tier === "string" ? raw.claim_tier.trim().toLowerCase() : "";
  if (rawClaimTier === "diagnostic" || rawClaimTier === "reduced-order" || rawClaimTier === "certified") {
    entry.claim_tier = rawClaimTier;
  }
  if (typeof raw.certifying === "boolean") {
    entry.certifying = raw.certifying;
  }
  return entry;
};

export const __testOnlyNormalizeGraphEvidenceEntry = normalizeEvidenceEntry;

const normalizeEvidenceList = (value: unknown): HelixAskGraphEvidence[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeEvidenceEntry(entry))
    .filter((entry): entry is HelixAskGraphEvidence => Boolean(entry));
};

const coerceNode = (raw: any): GraphNode | null => {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : undefined;
  const title = typeof raw.title === "string" ? raw.title.trim() : undefined;
  const excerpt = typeof raw.excerpt === "string" ? raw.excerpt.trim() : undefined;
  const bodyMD = typeof raw.bodyMD === "string" ? raw.bodyMD.trim() : undefined;
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : undefined;
  const nodeType = typeof raw.nodeType === "string" ? raw.nodeType.trim() : undefined;
  const inputs = Array.isArray(raw.inputs) ? raw.inputs.filter((entry: unknown) => !!entry) : undefined;
  const outputs = Array.isArray(raw.outputs) ? raw.outputs.filter((entry: unknown) => !!entry) : undefined;
  const assumptions = ensureArray<string>(raw.assumptions).filter((entry) => typeof entry === "string");
  const validity =
    raw.validity && typeof raw.validity === "object" && !Array.isArray(raw.validity)
      ? (raw.validity as Record<string, unknown>)
      : undefined;
  const deterministic = typeof raw.deterministic === "boolean" ? raw.deterministic : undefined;
  const tolerance =
    raw.tolerance && typeof raw.tolerance === "object" && !Array.isArray(raw.tolerance)
      ? (raw.tolerance as Record<string, unknown>)
      : undefined;
  const dependencies = ensureArray<string>(raw.dependencies).filter((entry) => typeof entry === "string");
  const environment =
    raw.environment && typeof raw.environment === "object" && !Array.isArray(raw.environment)
      ? (raw.environment as Record<string, unknown>)
      : undefined;
  const tags = ensureArray<string>(raw.tags).filter((entry) => typeof entry === "string");
  const children = ensureArray<string>(raw.children).filter((entry) => typeof entry === "string");
  const links = ensureArray<GraphLink>(raw.links).filter((link) => link && typeof link === "object");
  const congruence =
    raw.congruence && typeof raw.congruence === "object" && !Array.isArray(raw.congruence)
      ? (raw.congruence as { class?: string; chart?: string | null; congruenceLevel?: string | null })
      : undefined;
  const childMeta =
    raw.childMeta && typeof raw.childMeta === "object" && !Array.isArray(raw.childMeta)
      ? (raw.childMeta as Record<string, GraphEdgeMeta>)
      : undefined;
  const blockedLinks = Array.isArray(raw.blockedLinks)
    ? (raw.blockedLinks as BlockedEdge[])
    : undefined;
  const evidence = normalizeEvidenceList(raw.evidence);
  const node: GraphNode = {
    id,
    slug,
    title,
    excerpt,
    bodyMD,
    summary,
    nodeType,
    inputs: inputs?.length ? (inputs as Array<Record<string, unknown>>) : undefined,
    outputs: outputs?.length ? (outputs as Array<Record<string, unknown>>) : undefined,
    assumptions: assumptions.length > 0 ? assumptions : undefined,
    validity,
    deterministic,
    tolerance,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    environment,
    tags,
    children,
    links,
    congruence,
    childMeta,
    blockedLinks,
    evidence: evidence.length > 0 ? evidence : undefined,
    searchText: "",
    tagText: "",
  };
  node.searchText = buildSearchText(node);
  node.tagText = buildTagText(node);
  return node;
};

const resolveCongruenceWalkConfig = (
  override?: HelixAskCongruenceWalkOverride,
): CongruenceWalkConfig => {
  const configPath = process.env.HELIX_ASK_CONGRUENCE_WALK_CONFIG ?? DEFAULT_CONGRUENCE_WALK_CONFIG_PATH;
  const fullPath = path.resolve(process.cwd(), configPath);
  let baseConfig: CongruenceWalkConfig;
  if (!fs.existsSync(fullPath)) {
    baseConfig = cloneCongruenceWalkConfig(DEFAULT_CONGRUENCE_WALK_CONFIG);
    return applyCongruenceWalkOverride(baseConfig, override);
  }
  try {
    const stats = fs.statSync(fullPath);
    if (congruenceWalkConfigCache && congruenceWalkConfigCache.mtimeMs === stats.mtimeMs) {
      return applyCongruenceWalkOverride(congruenceWalkConfigCache.config, override);
    }
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as CongruenceWalkConfig;
    baseConfig = {
      allowedCL: parsed.allowedCL ?? DEFAULT_CONGRUENCE_WALK_CONFIG.allowedCL,
      allowConceptual: parsed.allowConceptual ?? DEFAULT_CONGRUENCE_WALK_CONFIG.allowConceptual,
      allowProxies: parsed.allowProxies ?? DEFAULT_CONGRUENCE_WALK_CONFIG.allowProxies,
      chart: parsed.chart ?? DEFAULT_CONGRUENCE_WALK_CONFIG.chart,
      region: parsed.region ?? DEFAULT_CONGRUENCE_WALK_CONFIG.region,
    };
    congruenceWalkConfigCache = {
      config: cloneCongruenceWalkConfig(baseConfig),
      mtimeMs: stats.mtimeMs,
    };
    return applyCongruenceWalkOverride(baseConfig, override);
  } catch (error) {
    console.warn(`[helix-ask] congruence walk config failed: ${error instanceof Error ? error.message : error}`);
    baseConfig = cloneCongruenceWalkConfig(DEFAULT_CONGRUENCE_WALK_CONFIG);
    return applyCongruenceWalkOverride(baseConfig, override);
  }
};

const normalizeConditionKey = (condition: string): string =>
  condition.replace(/\s+/g, "").replace(/=+/g, "_equals_").replace(/[()]/g, "");

const conditionSatisfied = (
  condition: string | null | undefined,
  region?: Record<string, boolean>,
): { ok: boolean; key?: string | null } => {
  if (!condition) return { ok: true };
  if (!region) return { ok: false, key: null };
  if (condition.includes("B(r)=1") || condition.includes("B=1")) {
    return { ok: Boolean(region.B_equals_1 === true), key: "B_equals_1" };
  }
  const normalized = normalizeConditionKey(condition);
  return { ok: Boolean(region[normalized] === true), key: normalized };
};

const resolveCLIndex = (value: string | undefined): number => {
  if (!value || value === "none") return -1;
  const idx = CL_ORDER.indexOf(value as CongruenceWalkConfig["allowedCL"]);
  return idx >= 0 ? idx : -1;
};

const CL_ORDER: CongruenceWalkConfig["allowedCL"][] = ["CL0", "CL1", "CL2", "CL3", "CL4"];

const evaluateCongruenceEdge = (
  meta: GraphEdgeMeta | undefined,
  config: CongruenceWalkConfig,
  blockedSet: Set<string>,
  edge: { source: string; target: string },
): GraphEdgeDecision => {
  if (blockedSet.has(`${edge.source}::${edge.target}`)) {
    return { allowed: false, reason: "blocked_link" };
  }

  const edgeType = meta?.edgeType ?? "association";
  if (edgeType === "hierarchy" || edgeType === "association") {
    return config.allowConceptual
      ? { allowed: true }
      : { allowed: false, reason: "conceptual_disallowed" };
  }
  if (edgeType === "proxy_only") {
    return config.allowProxies
      ? { allowed: true }
      : { allowed: false, reason: "proxy_disallowed" };
  }
  const requiredIdx = resolveCLIndex(meta?.requiresCL);
  const allowedIdx = resolveCLIndex(config.allowedCL);
  if (requiredIdx > allowedIdx) return { allowed: false, reason: "cl_exceeds_allowed" };
  if (meta?.chartDependency && config.chart && meta.chartDependency !== config.chart) {
    return { allowed: false, reason: "chart_mismatch" };
  }
  const condition = conditionSatisfied(meta?.condition, config.region);
  if (!condition.ok) {
    return {
      allowed: false,
      reason: "condition_unsatisfied",
      condition: meta?.condition ?? null,
      conditionKey: condition.key ?? null,
    };
  }
  return { allowed: true };
};


const resolveEquationBackbonePath = (config?: GraphResolverConfig | null): string => {
  const configured = String(config?.routingPolicy?.equation_binding_rail?.canonical_backbone_path ?? "").trim();
  return configured || DEFAULT_EQUATION_BACKBONE_PATH;
};

const loadCanonicalEquationRefs = (config?: GraphResolverConfig | null): Set<string> => {
  const relPath = resolveEquationBackbonePath(config);
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    return new Set<string>();
  }
  try {
    const stats = fs.statSync(fullPath);
    if (
      equationBackboneCache &&
      equationBackboneCache.fullPath === fullPath &&
      equationBackboneCache.mtimeMs === stats.mtimeMs
    ) {
      return equationBackboneCache.ids;
    }
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as { equations?: Array<{ id?: string }> };
    const ids = new Set(
      ensureArray<{ id?: string }>(parsed?.equations)
        .map((entry) => String(entry?.id ?? "").trim())
        .filter(Boolean),
    );
    equationBackboneCache = { ids, fullPath, mtimeMs: stats.mtimeMs };
    return ids;
  } catch {
    return new Set<string>();
  }
};

const loadKnownClaimIds = (): Set<string> => {
  const dirPath = path.resolve(process.cwd(), DEFAULT_MATH_CLAIMS_DIR);
  if (!fs.existsSync(dirPath)) return new Set<string>();
  try {
    const files = fs
      .readdirSync(dirPath)
      .filter((entry) => entry.toLowerCase().endsWith(".json"))
      .sort((a, b) => a.localeCompare(b));
    const fingerprintParts: string[] = [];
    const ids = new Set<string>();
    for (const file of files) {
      const full = path.join(dirPath, file);
      const stats = fs.statSync(full);
      fingerprintParts.push(`${file}:${stats.mtimeMs}`);
      const raw = fs.readFileSync(full, "utf8");
      const parsed = JSON.parse(raw) as { claims?: Array<{ claimId?: string }> };
      for (const claim of ensureArray<{ claimId?: string }>(parsed?.claims)) {
        const claimId = String(claim?.claimId ?? "").trim();
        if (claimId) ids.add(claimId);
      }
    }
    const fingerprint = fingerprintParts.join("|");
    if (claimRegistryCache && claimRegistryCache.dirPath === dirPath && claimRegistryCache.fingerprint === fingerprint) {
      return claimRegistryCache.ids;
    }
    claimRegistryCache = { ids, dirPath, fingerprint };
    return ids;
  } catch {
    return new Set<string>();
  }
};

const hasValidClaimLinkage = (node: GraphNode, knownClaimIds: Set<string>): boolean => {
  const validity = node.validity && typeof node.validity === "object" ? node.validity : undefined;
  const claimIds = Array.isArray(validity?.claim_ids)
    ? validity.claim_ids.map((entry) => String(entry ?? "").trim()).filter(Boolean)
    : [];
  if (claimIds.length === 0) return false;
  if (knownClaimIds.size === 0) return false;
  return claimIds.every((claimId) => knownClaimIds.has(claimId));
};

const hasKnownEquationRef = (node: GraphNode, canonicalEquationRefs: Set<string>): boolean => {
  const validity = node.validity && typeof node.validity === "object" ? node.validity : undefined;
  const equationRef = typeof validity?.equation_ref === "string" ? validity.equation_ref.trim() : "";
  if (!equationRef) return false;
  if (canonicalEquationRefs.size === 0) return false;
  return canonicalEquationRefs.has(equationRef);
};

const resolveEquationBindingGuardedNodeTypes = (config?: GraphResolverConfig | null): Set<string> => {
  const configured = ensureArray(config?.routingPolicy?.equation_binding_rail?.required_node_types)
    .map((entry) => String(entry ?? "").trim().toLowerCase())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  const fallback = ["physics_assertion", "bridge", "derived_metric"];
  return new Set(configured.length > 0 ? configured : fallback);
};

const isEquationBindingGuardedNode = (node: GraphNode, guardedNodeTypes: Set<string>): boolean => {
  const nodeType = String(node.nodeType ?? "").trim().toLowerCase();
  return nodeType.length > 0 && guardedNodeTypes.has(nodeType);
};

const requiresEquationBindingRail = (
  node: GraphNode,
  guardedNodeTypes: Set<string>,
  edgeMeta?: GraphEdgeMeta,
): boolean => {
  if (isEquationBindingGuardedNode(node, guardedNodeTypes)) return true;
  const edgeType = String(edgeMeta?.edgeType ?? "").trim().toLowerCase();
  return edgeType === "proxy_only";
};
const shouldIncludeEdge = (
  meta: GraphEdgeMeta | undefined,
  config: CongruenceWalkConfig,
  blockedSet: Set<string>,
  edge: { source: string; target: string },
): boolean => evaluateCongruenceEdge(meta, config, blockedSet, edge).allowed;

const loadGraphTree = (
  config: GraphResolverTreeConfig,
  congruenceWalkOverride?: HelixAskCongruenceWalkOverride,
): GraphTree | null => {
  const sourcePath = config.path;
  if (!sourcePath) return null;
  const fullPath = path.resolve(process.cwd(), sourcePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    const mergedOverride = mergeCongruenceOverrides(
      config.congruenceWalkOverride,
      congruenceWalkOverride,
    );
    const congruenceConfig = resolveCongruenceWalkConfig(mergedOverride);
    const congruenceKey = serializeCongruenceWalkConfig(congruenceConfig);
    const stats = fs.statSync(fullPath);
    const cacheKey = `${config.id}:${fullPath}:${congruenceKey}`;
    const cached = graphTreeCache.get(cacheKey);
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.tree;
    }
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as { rootId?: string; nodes?: unknown[] };
    const graphResolverConfig = loadGraphResolverConfig();
    const guardedEquationBindingNodeTypes = resolveEquationBindingGuardedNodeTypes(graphResolverConfig);
    const canonicalEquationRefs = loadCanonicalEquationRefs(graphResolverConfig);
    const knownClaimIds = loadKnownClaimIds();
    const nodes = ensureArray(parsed.nodes).map(coerceNode).filter(Boolean) as GraphNode[];
    const nodeById = new Map<string, GraphNode>();
    nodes.forEach((node) => nodeById.set(node.id, node));
    const neighbors = new Map<string, Array<{ id: string; rel: string; weight: number }>>();
    const edgePriority = { ...DEFAULT_EDGE_PRIORITY, ...(config.edgePriority ?? {}) };
    const blockedSet = new Set<string>();
    for (const node of nodes) {
      for (const blocked of node.blockedLinks ?? []) {
        if (blocked?.source && blocked?.target) {
          blockedSet.add(`${blocked.source}::${blocked.target}`);
        }
      }
    }
    const blockedByReason: HelixAskGraphCongruenceDiagnostics["blockedByReason"] = {
      blocked_link: 0,
      conceptual_disallowed: 0,
      proxy_disallowed: 0,
      cl_exceeds_allowed: 0,
      chart_mismatch: 0,
      condition_unsatisfied: 0,
      unresolved_target: 0,
      node_missing_equation_ref: 0,
      node_missing_claim_ids: 0,
    };
    const blockedByCondition: Record<string, number> = {};
    let allowedEdges = 0;
    let blockedEdges = 0;
    let resolvedInTreeEdges = 0;
    let resolvedCrossTreeEdges = 0;
    let evaluatedEdges = 0;
    const addNeighbor = (
      from: string,
      to: string,
      rel: string,
      opts?: { allowExternalTarget?: boolean },
    ): boolean => {
      if (!nodeById.has(from)) return false;
      if (!nodeById.has(to) && !opts?.allowExternalTarget) return false;
      const list = neighbors.get(from) ?? [];
      list.push({ id: to, rel, weight: edgePriority[rel] ?? 1 });
      neighbors.set(from, list);
      return true;
    };
    for (const node of nodes) {
      for (const child of node.children) {
        const meta = node.childMeta?.[child];
        evaluatedEdges += 1;
        if (
          requiresEquationBindingRail(node, guardedEquationBindingNodeTypes, meta) &&
          !hasKnownEquationRef(node, canonicalEquationRefs)
        ) {
          blockedEdges += 1;
          blockedByReason.node_missing_equation_ref += 1;
          continue;
        }
        if (isEquationBindingGuardedNode(node, guardedEquationBindingNodeTypes) && !hasValidClaimLinkage(node, knownClaimIds)) {
          blockedEdges += 1;
          blockedByReason.node_missing_claim_ids += 1;
          continue;
        }
        const decision = evaluateCongruenceEdge(meta, congruenceConfig, blockedSet, {
          source: node.id,
          target: child,
        });
        if (decision.allowed) {
          const forwardAdded = addNeighbor(node.id, child, "child");
          const reverseAdded = addNeighbor(child, node.id, "parent");
          if (forwardAdded && reverseAdded) {
            allowedEdges += 1;
            resolvedInTreeEdges += 1;
          } else {
            blockedEdges += 1;
            blockedByReason.unresolved_target += 1;
          }
        } else {
          blockedEdges += 1;
          if (decision.reason) blockedByReason[decision.reason] += 1;
          if (decision.reason === "condition_unsatisfied") {
            const key = decision.conditionKey ?? decision.condition ?? "unknown_condition";
            blockedByCondition[key] = (blockedByCondition[key] ?? 0) + 1;
          }
        }
      }
      for (const link of node.links) {
        const target = typeof link.to === "string" ? link.to : "";
        const rel = typeof link.rel === "string" ? link.rel : "see-also";
        if (!target) continue;
        const meta: GraphEdgeMeta | undefined = {
          edgeType: link.edgeType,
          requiresCL: link.requiresCL,
          condition: link.condition ?? null,
          chartDependency: link.chartDependency ?? null,
        };
        evaluatedEdges += 1;
        if (
          requiresEquationBindingRail(node, guardedEquationBindingNodeTypes, meta) &&
          !hasKnownEquationRef(node, canonicalEquationRefs)
        ) {
          blockedEdges += 1;
          blockedByReason.node_missing_equation_ref += 1;
          continue;
        }
        if (isEquationBindingGuardedNode(node, guardedEquationBindingNodeTypes) && !hasValidClaimLinkage(node, knownClaimIds)) {
          blockedEdges += 1;
          blockedByReason.node_missing_claim_ids += 1;
          continue;
        }
        const decision = evaluateCongruenceEdge(meta, congruenceConfig, blockedSet, {
          source: node.id,
          target,
        });
        if (decision.allowed) {
          if (addNeighbor(node.id, target, rel, { allowExternalTarget: true })) {
            allowedEdges += 1;
            if (nodeById.has(target)) {
              resolvedInTreeEdges += 1;
            } else {
              resolvedCrossTreeEdges += 1;
            }
          } else {
            blockedEdges += 1;
            blockedByReason.unresolved_target += 1;
          }
        } else {
          blockedEdges += 1;
          if (decision.reason) blockedByReason[decision.reason] += 1;
          if (decision.reason === "condition_unsatisfied") {
            const key = decision.conditionKey ?? decision.condition ?? "unknown_condition";
            blockedByCondition[key] = (blockedByCondition[key] ?? 0) + 1;
          }
        }
      }
    }
    const congruenceDiagnostics: HelixAskGraphCongruenceDiagnostics = {
      inventory: {
        nodesCount: nodes.length,
        evaluatedEdges,
        blockedLinkCount: blockedSet.size,
      },
      allowedEdges,
      blockedEdges,
      resolvedInTreeEdges,
      resolvedCrossTreeEdges,
      blockedByReason,
      blockedByCondition,
      strictSignals: {
        B_equals_1: congruenceConfig.region?.B_equals_1 === true,
        qi_metric_derived_equals_true: congruenceConfig.region?.qi_metric_derived_equals_true === true,
        qi_strict_ok_equals_true: congruenceConfig.region?.qi_strict_ok_equals_true === true,
        theta_geom_equals_true: congruenceConfig.region?.theta_geom_equals_true === true,
        vdb_two_wall_support_equals_true: congruenceConfig.region?.vdb_two_wall_support_equals_true === true,
        ts_metric_derived_equals_true: congruenceConfig.region?.ts_metric_derived_equals_true === true,
        cl3_metric_t00_available_equals_true:
          congruenceConfig.region?.cl3_metric_t00_available_equals_true === true,
        cl3_rho_gate_equals_true: congruenceConfig.region?.cl3_rho_gate_equals_true === true,
      },
    };
    const tree: GraphTree = {
      id: config.id,
      label: config.label,
      sourcePath,
      rootId: typeof parsed.rootId === "string" ? parsed.rootId : undefined,
      nodes,
      nodeById,
      neighbors,
      config,
      congruenceDiagnostics,
    };
    graphTreeCache.set(cacheKey, { tree, mtimeMs: stats.mtimeMs });
    return tree;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[helix-ask] graph resolver tree load failed (${config.path}): ${message}`);
    return null;
  }
};

const buildCrossTreeNodeIndex = (
  treeConfigs: GraphResolverTreeConfig[],
  congruenceWalkOverride?: HelixAskCongruenceWalkOverride,
): Map<string, GraphNodeRef> => {
  const index = new Map<string, GraphNodeRef>();
  for (const treeConfig of treeConfigs) {
    const tree = loadGraphTree(treeConfig, congruenceWalkOverride);
    if (!tree) continue;
    for (const node of tree.nodes) {
      if (!index.has(node.id)) {
        index.set(node.id, {
          node,
          treeId: tree.id,
          sourcePath: tree.sourcePath,
        });
      }
    }
  }
  return index;
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
    if (
      next.some((entry) => {
        const node = tree.nodeById.get(entry.id);
        return node ? scoreRoleMatch(node, terms) > 0 : false;
      })
    ) {
      continue;
    }
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
        evidence: best.evidence,
        summary: best.summary,
        nodeType: best.nodeType,
        inputs: best.inputs,
        outputs: best.outputs,
        assumptions: best.assumptions,
        validity: best.validity,
        deterministic: best.deterministic,
        tolerance: best.tolerance,
        dependencies: best.dependencies,
        environment: best.environment,
        sourcePath: tree.sourcePath,
      });
    }
  }
  return next;
};

const buildScaffoldLines = (
  tree: GraphTree,
  anchors: HelixAskGraphResolvedNode[],
  path: HelixAskGraphResolvedNode[],
  missingEvidencePath?: HelixAskGraphMissingEvidencePath,
): string[] => {
  const anchorIds = new Set(anchors.map((node) => node.id));
  const lines = path.map((node) => {
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
    parts.push(`(${node.sourcePath ?? tree.sourcePath})`);
    return `- ${parts.join(" ")}`;
  });
  if (missingEvidencePath) {
    lines.push(
      `- MissingEvidencePath: ${JSON.stringify(missingEvidencePath)} (${tree.sourcePath})`,
    );
  }
  return lines;
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

const VALID_BRIDGE_EVIDENCE_SCOPE = new Set(["left", "right"]);
const EXTERNAL_INTEGRATION_TREE_ID = "external-integrations-tree";

export type ExternalIntegrationEvidenceFailureReason =
  | "missing_provenance_metadata"
  | "contradictory_provenance_metadata";

const classifyExternalIntegrationEvidenceFailure = (
  evidence: HelixAskGraphEvidence[],
): ExternalIntegrationEvidenceFailureReason | undefined => {
  const normalizedEvidence = [...evidence].sort((left, right) => {
    const leftKey = [
      left.path ?? "",
      left.symbol ?? "",
      left.heading ?? "",
      left.field ?? "",
      left.contains ?? "",
      left.note ?? "",
      left.scope ?? "",
      left.type,
    ].join("::");
    const rightKey = [
      right.path ?? "",
      right.symbol ?? "",
      right.heading ?? "",
      right.field ?? "",
      right.contains ?? "",
      right.note ?? "",
      right.scope ?? "",
      right.type,
    ].join("::");
    return leftKey.localeCompare(rightKey);
  });
  const evidenceContractByPath = new Map<string, string>();
  let hasMissingMetadata = false;
  for (const entry of normalizedEvidence) {
    const hasProvenanceClass = typeof entry.provenance_class === "string";
    const hasClaimTier = typeof entry.claim_tier === "string";
    if (!hasProvenanceClass || !hasClaimTier) {
      hasMissingMetadata = true;
      continue;
    }
    const evidenceKey =
      entry.path ??
      [entry.type, entry.symbol, entry.heading, entry.field, entry.contains, entry.note, entry.scope]
        .filter(Boolean)
        .join("::");
    const evidenceContract = `${entry.provenance_class}::${entry.claim_tier}`;
    const current = evidenceContractByPath.get(evidenceKey);
    if (!current) {
      evidenceContractByPath.set(evidenceKey, evidenceContract);
      continue;
    }
    if (current !== evidenceContract) {
      return "contradictory_provenance_metadata";
    }
  }
  if (hasMissingMetadata) return "missing_provenance_metadata";
  return undefined;
};

const hasExternalIntegrationsEvidenceContract = (framework: HelixAskGraphFramework): boolean => {
  if (framework.treeId !== EXTERNAL_INTEGRATION_TREE_ID) return true;
  const integrationNodes = framework.path.filter((node) => node.id !== EXTERNAL_INTEGRATION_TREE_ID);
  if (integrationNodes.length === 0) return false;
  return integrationNodes.every((node) => {
    const evidence = node.evidence ?? [];
    if (evidence.length === 0) return false;
    return !classifyExternalIntegrationEvidenceFailure(evidence);
  });
};

export const __testOnlyClassifyExternalIntegrationEvidenceFailure =
  classifyExternalIntegrationEvidenceFailure;

export function __testOnlyHasExternalIntegrationsEvidenceContract(input: {
  treeId?: string;
  path: Array<{ id: string; evidence?: HelixAskGraphEvidence[] }>;
}): boolean {
  return hasExternalIntegrationsEvidenceContract({
    treeId: input.treeId ?? EXTERNAL_INTEGRATION_TREE_ID,
    treeLabel: input.treeId,
    sourcePath: "tests/fixtures/external-integrations-contract-tree.json",
    anchors: [],
    path: input.path.map((entry, depth) => ({
      id: entry.id,
      title: entry.id,
      tags: [],
      score: 1,
      depth,
      evidence: entry.evidence,
    })),
    scaffoldText: "",
    contextText: "",
    preferGraph: true,
  });
}

const hasStellarBridgeEvidenceContract = (framework: HelixAskGraphFramework): boolean => {
  if (framework.treeId !== "stellar-ps1-bridges") return true;
  const bridgeNodes = framework.path.filter(
    (node) => node.nodeType === "bridge" || node.id.includes("bridge-"),
  );
  if (bridgeNodes.length === 0) return false;
  const hasCertifyingEvidence = bridgeNodes.some((node) =>
    (node.evidence ?? []).some((entry) => entry.certifying === true),
  );
  if (!hasCertifyingEvidence) return false;
  return bridgeNodes.every((node) => {
    const evidence = node.evidence ?? [];
    if (evidence.length === 0) return false;
    return evidence.every((entry) => {
      const hasContractFields =
        typeof entry.provenance_class === "string" &&
        typeof entry.claim_tier === "string" &&
        typeof entry.certifying === "boolean";
      if (!hasContractFields) return false;
      if (entry.scope && !VALID_BRIDGE_EVIDENCE_SCOPE.has(entry.scope)) return false;
      return true;
    });
  });
};

export function __testOnlyHasStellarBridgeEvidenceContract(input: {
  treeId?: string;
  path: Array<{ id: string; nodeType?: string; evidence?: HelixAskGraphEvidence[] }>;
}): boolean {
  return hasStellarBridgeEvidenceContract({
    treeId: input.treeId ?? "stellar-ps1-bridges",
    treeLabel: input.treeId,
    sourcePath: "tests/fixtures/stellar-bridge-contract.json",
    anchors: [],
    path: input.path.map((entry, depth) => ({
      id: entry.id,
      title: entry.id,
      tags: [],
      score: 1,
      depth,
      nodeType: entry.nodeType,
      evidence: entry.evidence,
    })),
    scaffoldText: "",
    contextText: "",
    preferGraph: true,
  });
}

const resolveBridgeMissingEvidencePath = (input: {
  question: string;
  tree: GraphTree;
  resolvedPath: HelixAskGraphResolvedNode[];
  crossTreeNodeIndex: Map<string, GraphNodeRef>;
}): HelixAskGraphMissingEvidencePath | undefined => {
  if (input.tree.id !== "stellar-ps1-bridges") return undefined;
  const question = input.question;
  const bridgeNodes = input.resolvedPath
    .filter((node) => node.nodeType === "bridge" || node.id.includes("bridge-"))
    .map((node) => node.id)
    .sort((a, b) => a.localeCompare(b));
  if (bridgeNodes.length === 0) return undefined;

  const family = LIFE_COSMOLOGY_CONSCIOUSNESS_RE.test(question)
    ? "life_cosmology_consciousness"
    : AI_FINANCIAL_DEFENSE_SECURITY_RE.test(question)
      ? "ai_financial_defense_security"
      : undefined;
  if (!family) return undefined;
  const requiredAnchors =
    family === "life_cosmology_consciousness"
      ? [
          "uncertainty-mechanics",
          "no-feasibility-claims",
          "sampling-time-bounds",
          "scaling-laws",
          "qi-diagnostics-schema",
          "expansion_frontier",
          "entropy-directionality",
        ]
      : [
          "uncertainty-mechanics",
          "no-feasibility-claims",
          "verification_hook",
          "sampling-time-bounds",
        ];
  const missingAnchors = requiredAnchors
    .filter((anchor) => !input.tree.nodeById.has(anchor) && !input.crossTreeNodeIndex.has(anchor))
    .sort((a, b) => a.localeCompare(b));
  if (missingAnchors.length === 0) return undefined;
  return {
    treeId: input.tree.id,
    family,
    requiredAnchors,
    missingAnchors,
    bridgeNodes,
  };
};

export function __testOnlyResolveBridgeMissingEvidencePath(input: {
  question: string;
  treeId?: string;
  availableNodeIds?: string[];
  bridgeNodeIds?: string[];
}): HelixAskGraphMissingEvidencePath | undefined {
  const treeId = input.treeId ?? "stellar-ps1-bridges";
  const availableNodeIds = new Set(input.availableNodeIds ?? []);
  const bridgeNodeIds = input.bridgeNodeIds ?? ["bridge-orch-or-to-stellar-coherence"];
  return resolveBridgeMissingEvidencePath({
    question: input.question,
    tree: {
      id: treeId,
      label: treeId,
      sourcePath: "tests/fixtures/bridge-missing-evidence-tree.json",
      rootId: "root",
      nodes: [],
      nodeById: new Map(Array.from(availableNodeIds).map((id) => [id, { id } as GraphNode])),
      neighbors: new Map(),
      config: { id: treeId, path: "tests/fixtures/bridge-missing-evidence-tree.json" },
      congruenceDiagnostics: {
        inventory: { nodesCount: 0, evaluatedEdges: 0, blockedLinkCount: 0 },
        allowedEdges: 0,
        blockedEdges: 0,
        resolvedInTreeEdges: 0,
        resolvedCrossTreeEdges: 0,
        blockedByReason: {
          blocked_link: 0,
          conceptual_disallowed: 0,
          proxy_disallowed: 0,
          cl_exceeds_allowed: 0,
          chart_mismatch: 0,
          condition_unsatisfied: 0,
          unresolved_target: 0,
          node_missing_equation_ref: 0,
        },
        blockedByCondition: {},
        strictSignals: {
          B_equals_1: true,
          qi_metric_derived_equals_true: true,
          qi_strict_ok_equals_true: true,
          theta_geom_equals_true: true,
          vdb_two_wall_support_equals_true: false,
          ts_metric_derived_equals_true: false,
          cl3_metric_t00_available_equals_true: false,
          cl3_rho_gate_equals_true: false,
        },
      },
    },
    resolvedPath: bridgeNodeIds.map((id) => ({
      id,
      title: id,
      tags: ["bridge"],
      score: 1,
      depth: 0,
      nodeType: "bridge",
    })),
    crossTreeNodeIndex: new Map(),
  });
}

const buildNodeScoringMap = (
  nodeScores: Array<{ node: GraphNode; score: number }>,
): Map<string, number> =>
  new Map(nodeScores.map((entry) => [entry.node.id, entry.score]));

const scorePath = (
  nodeIds: string[],
  nodeScoreMap: Map<string, number>,
): number =>
  nodeIds.reduce((sum, nodeId) => sum + (nodeScoreMap.get(nodeId) ?? 0), 0);

const buildPathFromNodeIds = (
  tree: GraphTree,
  pathIds: string[],
  defaultScore: number,
  sourcePath: string,
): HelixAskGraphResolvedNode[] => {
  const nodes: HelixAskGraphResolvedNode[] = [];
  for (const nodeId of pathIds) {
    const node = tree.nodeById.get(nodeId);
    if (!node) continue;
    nodes.push({
      id: node.id,
      title: node.title ?? node.id,
      excerpt: extractExcerpt(node),
      artifact: extractArtifact(node.bodyMD),
      tags: node.tags,
      score: defaultScore,
      depth: 0,
      evidence: node.evidence,
      summary: node.summary,
      nodeType: node.nodeType,
      inputs: node.inputs,
      outputs: node.outputs,
      assumptions: node.assumptions,
      validity: node.validity,
      deterministic: node.deterministic,
      tolerance: node.tolerance,
      dependencies: node.dependencies,
      environment: node.environment,
      sourcePath,
    });
  }
  return nodes;
};

const buildBestRootToTargetPath = (params: {
  tree: GraphTree;
  rootId: string;
  nodeScores: Array<{ node: GraphNode; score: number }>;
  maxDepth: number;
  maxNodes: number;
  anchors: Array<{ node: GraphNode; score: number }>;
}): { path: string[] } => {
  const { tree, rootId, nodeScores, maxDepth, maxNodes, anchors } = params;
  const nodeScoreMap = buildNodeScoringMap(nodeScores);
  let bestPath: string[] | null = null;
  let bestScore = -Infinity;
  for (const anchor of anchors) {
    const candidate = findRootToTargetPath({
      tree,
      startId: rootId,
      targetId: anchor.node.id,
      maxDepth,
      maxNodes,
      nodeScoreMap,
    });
    if (!candidate || candidate.length === 0) continue;
    const candidateScore = scorePath(candidate, nodeScoreMap);
    const adjustedScore = candidateScore + anchors.length * 0.001 * anchor.score;
    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestPath = candidate;
    }
  }
  return { path: bestPath ?? [] };
};

const findRootToTargetPath = (params: {
  tree: GraphTree;
  startId: string;
  targetId: string;
  maxDepth: number;
  maxNodes: number;
  nodeScoreMap: Map<string, number>;
}): string[] | null => {
  const { tree, startId, targetId, maxDepth, maxNodes, nodeScoreMap } = params;
  if (startId === targetId) return [startId];
  const maxLength = Math.max(1, Math.min(maxDepth + 1, maxNodes));
  let bestPath: string[] | null = null;
  let bestScore = -Infinity;
  const dfs = (
    currentId: string,
    depth: number,
    visited: Set<string>,
    path: string[],
    scoreSoFar: number,
  ): void => {
    if (depth >= maxLength) return;
    const neighbors = (tree.neighbors.get(currentId) ?? [])
      .filter((entry) => tree.nodeById.has(entry.id))
      .filter((entry) => !visited.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        weight: entry.weight,
      }))
      .sort((a, b) => {
        if (a.weight !== b.weight) return b.weight - a.weight;
        return (nodeScoreMap.get(b.id) ?? 0) - (nodeScoreMap.get(a.id) ?? 0);
      });
    for (const neighbor of neighbors) {
      const nextId = neighbor.id;
      const nextScore = scoreSoFar + (nodeScoreMap.get(nextId) ?? 0) + Math.min(0.2, 0.01 * neighbor.weight);
      if (nextId === targetId) {
        const candidate = [...path, nextId];
        if (candidate.length <= maxNodes && nextScore > bestScore) {
          bestScore = nextScore;
          bestPath = candidate;
        }
        continue;
      }
      visited.add(nextId);
      dfs(nextId, depth + 1, visited, [...path, nextId], nextScore);
      visited.delete(nextId);
    }
  };

  const visited = new Set([startId]);
  dfs(startId, 1, visited, [startId], nodeScoreMap.get(startId) ?? 0);
  return bestPath;
};

const buildSingleRootToLeafPath = (params: {
  tree: GraphTree;
  nodeScores: Array<{ node: GraphNode; score: number }>;
  maxDepth: number;
  maxNodes: number;
  anchors: Array<{ node: GraphNode; score: number }>;
}): { pathIds: string[]; fallbackReason?: string; fallbackToRootToAnchor?: boolean } => {
  const { tree, nodeScores, maxDepth, maxNodes, anchors } = params;
  const rootNode = tree.rootId
    ? tree.nodeById.get(tree.rootId)
    : null;
  const rootId = rootNode?.id ?? nodeScores[0]?.node.id;
  if (!rootId) {
    return {
      pathIds: [],
      fallbackReason: "missing_root_or_anchor_seed",
      fallbackToRootToAnchor: true,
    };
  }
  const rootToLeaf = buildBestRootToTargetPath({
    tree,
    rootId,
    nodeScores,
    maxDepth,
    maxNodes,
    anchors: anchors.slice().sort((a, b) => b.score - a.score),
  });
  if (rootToLeaf.path.length > 0) {
    return {
      pathIds: rootToLeaf.path.slice(0, maxNodes),
      fallbackReason: undefined,
      fallbackToRootToAnchor: false,
    };
  }
  const fallbackTarget = anchors[0]?.node.id;
  if (!fallbackTarget || !tree.nodeById.has(rootId)) {
    return {
      pathIds: rootId ? [rootId] : [],
      fallbackReason: "root_to_leaf_disconnected",
      fallbackToRootToAnchor: true,
    };
  }
  const fallbackTargetNode = tree.nodeById.get(fallbackTarget);
  if (!fallbackTargetNode) {
    return {
      pathIds: [rootId],
      fallbackReason: "root_to_anchor_unreachable",
      fallbackToRootToAnchor: true,
    };
  }
  const fallbackPath = buildBestRootToTargetPath({
    tree,
    rootId,
    nodeScores,
    maxDepth,
    maxNodes,
    anchors: [{ node: fallbackTargetNode, score: 0 }],
  }).path;
  return {
    pathIds: fallbackPath.length > 0 ? fallbackPath : [rootId],
    fallbackReason: fallbackPath.length > 0 ? "root_to_anchor_fallback" : "root_to_anchor_unreachable",
    fallbackToRootToAnchor: true,
  };
};

const buildSingleRootToAnchorPath = (params: {
  tree: GraphTree;
  nodeScores: Array<{ node: GraphNode; score: number }>;
  maxDepth: number;
  maxNodes: number;
  anchors: Array<{ node: GraphNode; score: number }>;
}): { pathIds: string[]; fallbackReason?: string } => {
  const { tree, nodeScores, maxDepth, maxNodes, anchors } = params;
  const rootNode = tree.rootId
    ? tree.nodeById.get(tree.rootId)
    : null;
  const rootId = rootNode?.id ?? nodeScores[0]?.node.id;
  if (!rootId) {
    return {
      pathIds: [],
      fallbackReason: "missing_root_or_anchor_seed",
    };
  }
  const rootToAnchor = buildBestRootToTargetPath({
    tree,
    rootId,
    nodeScores,
    maxDepth,
    maxNodes,
    anchors: anchors.slice().sort((a, b) => b.score - a.score),
  });
  if (rootToAnchor.path.length > 0) {
    return {
      pathIds: rootToAnchor.path.slice(0, maxNodes),
      fallbackReason: undefined,
    };
  }
  return {
    pathIds: [rootId],
    fallbackReason: "root_to_anchor_unreachable",
  };
};

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

const resolveTreeWeight = (value: unknown): number =>
  clampNumber(coerceNumber(value, 1), 0.1, 5);

const buildFrameworkCandidate = (
  tree: GraphTree,
  crossTreeNodeIndex: Map<string, GraphNodeRef>,
  tokens: string[],
  questionNorm: string,
  conceptBoosts: string[],
  options?: { locked?: boolean; pathMode?: HelixAskGraphPathMode },
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
    evidence: entry.node.evidence,
    summary: entry.node.summary,
    nodeType: entry.node.nodeType,
    inputs: entry.node.inputs,
    outputs: entry.node.outputs,
    assumptions: entry.node.assumptions,
    validity: entry.node.validity,
    deterministic: entry.node.deterministic,
    tolerance: entry.node.tolerance,
    dependencies: entry.node.dependencies,
    environment: entry.node.environment,
    sourcePath: tree.sourcePath,
  }));
  const maxDepth = treeConfig.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxNodes = treeConfig.maxNodes ?? DEFAULT_MAX_NODES;
  const pathMode = options?.pathMode ?? "full";
  let resolvedPathMode: HelixAskGraphPathMode = pathMode;
  let withRoles: HelixAskGraphResolvedNode[] = [];
  let pathFallbackReason: string | undefined = undefined;
  if (pathMode === "root_to_leaf") {
    const anchorEntries = anchors.slice().sort((a, b) => b.score - a.score);
    const singlePath = buildSingleRootToLeafPath({
      tree,
      nodeScores,
      maxDepth,
      maxNodes,
      anchors: anchorEntries,
    });
    pathFallbackReason = singlePath.fallbackReason;
    if (singlePath.fallbackToRootToAnchor) {
      resolvedPathMode = "root_to_anchor";
    }
    withRoles = buildPathFromNodeIds(tree, singlePath.pathIds, 0, tree.sourcePath)
      .map((entry, index) => {
        const matchAnchor = anchorEntries.find((anchor) => anchor.node.id === entry.id) != null;
        return {
          ...entry,
          score: nodeScores.find((scoreEntry) => scoreEntry.node.id === entry.id)?.score ?? entry.score,
          depth: index,
          relation: index === 0 ? "root" : "child",
          role: matchAnchor ? "anchor" : undefined,
        };
      })
      .slice(0, maxNodes);
  } else if (pathMode === "root_to_anchor") {
    const anchorEntries = anchors.slice().sort((a, b) => b.score - a.score);
    const singlePath = buildSingleRootToAnchorPath({
      tree,
      nodeScores,
      maxDepth,
      maxNodes,
      anchors: anchorEntries,
    });
    pathFallbackReason = singlePath.fallbackReason;
    withRoles = buildPathFromNodeIds(tree, singlePath.pathIds, 0, tree.sourcePath)
      .map((entry, index) => {
        const matchAnchor = anchorEntries.find((anchor) => anchor.node.id === entry.id) != null;
        return {
          ...entry,
          score: nodeScores.find((scoreEntry) => scoreEntry.node.id === entry.id)?.score ?? entry.score,
          depth: index,
          relation: index === 0 ? "root" : "child",
          role: matchAnchor ? "anchor" : undefined,
        };
      })
      .slice(0, maxNodes);
  } else {
    const resolveNodeRef = (id: string): GraphNodeRef | null => {
      const local = tree.nodeById.get(id);
      if (local) {
        return {
          node: local,
          treeId: tree.id,
          sourcePath: tree.sourcePath,
        };
      }
      return crossTreeNodeIndex.get(id) ?? null;
    };
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
          score: (() => {
            const ref = resolveNodeRef(neighbor.id);
            return ref ? scoreNode(ref.node, tokens, questionNorm, conceptBoosts) : 0;
          })(),
        }))
        .sort((a, b) => {
          if (a.neighbor.weight !== b.neighbor.weight) {
            return b.neighbor.weight - a.neighbor.weight;
          }
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return a.neighbor.id.localeCompare(b.neighbor.id);
        });
      for (const entry of sortedNeighbors) {
        if (ordered.length >= maxNodes) break;
        const neighbor = entry.neighbor;
        if (visited.has(neighbor.id)) continue;
        const ref = resolveNodeRef(neighbor.id);
        if (!ref) continue;
        const node = ref.node;
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
          evidence: node.evidence,
          summary: node.summary,
          nodeType: node.nodeType,
          inputs: node.inputs,
          outputs: node.outputs,
          assumptions: node.assumptions,
          validity: node.validity,
          deterministic: node.deterministic,
          tolerance: node.tolerance,
          dependencies: node.dependencies,
          environment: node.environment,
          sourcePath: ref.sourcePath,
        });
        queue.push({ id: neighbor.id, depth: current.depth + 1 });
      }
    }
    withRoles = resolveRoles(tree, ordered).slice(0, maxNodes);
  }
  const missingEvidencePath = resolveBridgeMissingEvidencePath({
    question: questionNorm,
    tree,
    resolvedPath: withRoles,
    crossTreeNodeIndex,
  });
  if (missingEvidencePath) {
    pathFallbackReason = pathFallbackReason ?? "missing_required_bridge_anchor";
  }
  const lines = buildScaffoldLines(tree, resolvedAnchors, withRoles, missingEvidencePath);
  if (lines.length === 0) return null;
  const scaffoldText = lines.join("\n");
  const contextText = buildContextBlock(tree, lines);
  const anchorScore = resolvedAnchors.reduce((sum, node) => sum + Math.max(0, node.score), 0);
  const pathScore = withRoles.reduce((sum, node) => sum + Math.max(0, node.score), 0);
  const hitCount = nodeScores.length;
  const baseScore = scoreGraphCandidate(anchorScore, pathScore, hitCount);
  const weightedScore =
    baseScore * resolveTreeWeight(tree.config.weight) +
    (options?.locked ? LOCKED_TREE_SCORE_BONUS : 0);
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
    rankScore: weightedScore,
    anchorScore,
    pathScore,
    pathMode: resolvedPathMode,
    pathFallbackReason,
    congruenceDiagnostics: tree.congruenceDiagnostics,
    missingEvidencePath,
  };
  if (!hasStellarBridgeEvidenceContract(framework)) {
    framework.pathFallbackReason = framework.pathFallbackReason ?? "stellar_bridge_contract_invalid";
  }
  return { framework, score: weightedScore, anchorScore, pathScore, hitCount };
};

export function resolveHelixAskGraphPack(input: {
  question: string;
  topicTags: HelixAskTopicTag[];
  conceptMatch?: HelixAskConceptMatch | null;
  lockedTreeIds?: string[];
  congruenceWalkOverride?: HelixAskCongruenceWalkOverride;
  pathMode?: HelixAskGraphPathMode;
}): HelixAskGraphPack | null {
  const config = loadGraphResolverConfig();
  if (!config?.trees?.length) return null;
  const missingEquationRefFailReason =
    config.routingPolicy?.equation_binding_rail?.strict_fail_reason ?? DEFAULT_MISSING_EQUATION_REF_FAIL_REASON;
  const missingClaimIdsFailReason =
    config.routingPolicy?.claim_ids_linkage_rail?.strict_fail_reason ?? DEFAULT_MISSING_CLAIM_IDS_FAIL_REASON;
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
  const lockedTreeIds = new Set(
    (input.lockedTreeIds ?? []).map((entry) => entry.trim()).filter(Boolean),
  );
  const matchingTrees = trees.filter((tree) => shouldUseTree(tree, question, input.topicTags));
  const combinedTrees = new Map<string, GraphResolverTreeConfig>();
  for (const tree of matchingTrees) {
    combinedTrees.set(tree.id, tree);
  }
  if (lockedTreeIds.size > 0) {
    for (const tree of trees) {
      if (lockedTreeIds.has(tree.id)) {
        combinedTrees.set(tree.id, tree);
      }
    }
  }
  const selectedTrees = Array.from(combinedTrees.values());
  if (selectedTrees.length === 0) return null;
  const crossTreeNodeIndex = buildCrossTreeNodeIndex(trees, input.congruenceWalkOverride);
  const questionNorm = normalizeText(question);
  const tokens = extractQuestionTokens(question);
  const conceptBoosts = extractConceptBoosts(input.conceptMatch);
  const resolvedPackPathMode = normalizeGraphPathMode(input.pathMode) ?? normalizeGraphPathMode(packConfig.pathMode);
  const candidates: GraphFrameworkCandidate[] = [];
  for (const treeConfig of selectedTrees) {
    const tree = loadGraphTree(treeConfig, input.congruenceWalkOverride);
    if (!tree) continue;
    const treePathMode =
      normalizeGraphPathMode(input.pathMode) ??
      normalizeGraphPathMode(treeConfig.pathMode) ??
      resolvedPackPathMode ??
      DEFAULT_GRAPH_PATH_MODE;
    const candidate = buildFrameworkCandidate(tree, crossTreeNodeIndex, tokens, questionNorm, conceptBoosts, {
      locked: lockedTreeIds.has(treeConfig.id),
      pathMode: treePathMode,
    });
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
  const maxTrees = Math.min(maxPackTrees, sorted.length);
  const selected: HelixAskGraphFramework[] = [];
  const selectedIds = new Set<string>();
  const lockedCandidates = sorted
    .filter((candidate) => lockedTreeIds.has(candidate.framework.treeId))
    .sort((a, b) => b.score - a.score);
  const addCandidate = (candidate: GraphFrameworkCandidate): void => {
    if (selected.length >= maxTrees) return;
    const id = candidate.framework.treeId;
    if (selectedIds.has(id)) return;
    selectedIds.add(id);
    if ((candidate.framework.congruenceDiagnostics?.blockedByReason.node_missing_equation_ref ?? 0) > 0) {
      candidate.framework.pathFallbackReason = missingEquationRefFailReason;
    }
    if ((candidate.framework.congruenceDiagnostics?.blockedByReason.node_missing_claim_ids ?? 0) > 0) {
      candidate.framework.pathFallbackReason = candidate.framework.pathFallbackReason ?? missingClaimIdsFailReason;
    }
    selected.push(candidate.framework);
  };
  for (const candidate of lockedCandidates) {
    addCandidate(candidate);
  }
  for (const candidate of filtered) {
    addCandidate(candidate);
  }
  if (selected.length === 0) {
    addCandidate(sorted[0]);
  }
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
  congruenceWalkOverride?: HelixAskCongruenceWalkOverride;
  pathMode?: HelixAskGraphPathMode;
}): HelixAskGraphFramework | null {
  const pack = resolveHelixAskGraphPack(input);
  return pack?.frameworks[0] ?? null;
}

export function __testOnlyResolveTreeNeighborIds(input: {
  treeId: string;
  treePath: string;
  nodeId: string;
  congruenceWalkOverride?: HelixAskCongruenceWalkOverride;
}): string[] {
  const tree = loadGraphTree(
    {
      id: input.treeId,
      path: input.treePath,
      label: input.treeId,
    },
    input.congruenceWalkOverride,
  );
  if (!tree) return [];
  const neighborIds = (tree.neighbors.get(input.nodeId) ?? []).map((entry) => entry.id);
  return Array.from(new Set(neighborIds)).sort((a, b) => a.localeCompare(b));
}
