import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { getRepoSearchIndex } from "../server/services/search/repo-index";
import { getRepoGraphSnapshot } from "../server/services/repo/repoGraph";
import { buildCodeLatticeSnapshot } from "../server/services/code-lattice/builders";

const execFileAsync = promisify(execFile);

export type AtlasNodeKind = "file" | "symbol" | "concept" | "value" | "gate";
export type AtlasEdgeKind = "imports" | "defines" | "mentions" | "tests" | "causal";

export type AtlasNode = {
  id: string;
  kind: AtlasNodeKind;
  label: string;
  path?: string;
  source?: string;
  stageHints?: string[];
  meta?: Record<string, unknown>;
};

export type AtlasEdge = {
  source: string;
  target: string;
  kind: AtlasEdgeKind;
  sourceSystem: string;
  meta?: Record<string, unknown>;
};

export type RepoAtlas = {
  version: "repo-atlas/1";
  snapshot: {
    generatedAt: string;
    commitHash: string;
    repoGraphBuiltAt?: number;
    treeDagWalkLoaded?: boolean;
  };
  nodes: AtlasNode[];
  edges: AtlasEdge[];
};

export const DEFAULT_ATLAS_PATH = path.join(process.cwd(), "artifacts", "repo-atlas", "repo-atlas.v1.json");
const DEFAULT_TREE_DAG_WALK_REPORT_PATH = path.join(process.cwd(), "docs", "warp-tree-dag-walk-report.json");

type TreeDagWalkVisitedNode = {
  id?: string;
  depth?: number;
  via?: {
    source?: string;
    target?: string;
    edgeType?: string;
    requiresCL?: string;
    condition?: string | null;
    chartDependency?: string | null;
    note?: string | null;
  };
};

type TreeDagWalkReport = {
  visited?: TreeDagWalkVisitedNode[];
};

type AtlasSources = {
  generatedAt: string;
  commitHash: string;
  repoIndex: Awaited<ReturnType<typeof getRepoSearchIndex>>;
  repoGraph: Awaited<ReturnType<typeof getRepoGraphSnapshot>>;
  codeLattice: Awaited<ReturnType<typeof buildCodeLatticeSnapshot>>["snapshot"];
  treeDagWalk?: TreeDagWalkReport | null;
};

const STAGE_HINT_FIELDS = ["S0_source", "S1_qi_sample", "S2_bound_computed", "S3_bound_policy", "S4_margin", "S5_gate"];
const STAGE_HINT_VOCABULARY: Record<string, string[]> = {
  S0_source: ["rhosource", "metrict00ref", "metrict00si_jm3", "warpfieldtype"],
  S1_qi_sample: ["lhs_jm3"],
  S2_bound_computed: ["boundcomputed_jm3", "tau_s", "tauconfigured_s", "\"k\"", "kprovenance"],
  S3_bound_policy: ["boundused_jm3", "boundfloorapplied", "boundpolicyfloor_jm3", "boundfloor_jm3"],
  S4_margin: ["marginratioraw", "marginratiorawcomputed", "marginratio"],
  S5_gate: ["applicabilitystatus", "reasoncode", "g4reasoncodes", "g4_qi_margin", "warpviable"],
};
const G4_STAGE_CHAIN_NODES: AtlasNode[] = [
  { id: "value:rhoSource", kind: "value", label: "rhoSource", source: "g4-stage-chain", stageHints: ["S0_source"] },
  { id: "value:lhs_Jm3", kind: "value", label: "lhs_Jm3", source: "g4-stage-chain", stageHints: ["S1_qi_sample"] },
  {
    id: "value:boundComputed_Jm3",
    kind: "value",
    label: "boundComputed_Jm3",
    source: "g4-stage-chain",
    stageHints: ["S2_bound_computed"],
  },
  {
    id: "value:boundUsed_Jm3",
    kind: "value",
    label: "boundUsed_Jm3",
    source: "g4-stage-chain",
    stageHints: ["S3_bound_policy"],
  },
  {
    id: "value:marginRatioRaw",
    kind: "value",
    label: "marginRatioRaw",
    source: "g4-stage-chain",
    stageHints: ["S4_margin"],
  },
  {
    id: "gate:G4_QI_margin",
    kind: "gate",
    label: "G4_QI_margin",
    source: "g4-stage-chain",
    stageHints: ["S5_gate"],
    meta: { condition: "marginRatioRaw < 1" },
  },
];
const G4_STAGE_CHAIN_EDGES: AtlasEdge[] = [
  { source: "value:rhoSource", target: "value:lhs_Jm3", kind: "causal", sourceSystem: "g4-stage-chain" },
  { source: "value:lhs_Jm3", target: "value:boundComputed_Jm3", kind: "causal", sourceSystem: "g4-stage-chain" },
  { source: "value:boundComputed_Jm3", target: "value:boundUsed_Jm3", kind: "causal", sourceSystem: "g4-stage-chain" },
  { source: "value:boundUsed_Jm3", target: "value:marginRatioRaw", kind: "causal", sourceSystem: "g4-stage-chain" },
  { source: "value:marginRatioRaw", target: "gate:G4_QI_margin", kind: "causal", sourceSystem: "g4-stage-chain" },
];

const stableSort = <T>(rows: T[], by: (row: T) => string): T[] => [...rows].sort((a, b) => by(a).localeCompare(by(b)));

const addNode = (nodes: Map<string, AtlasNode>, node: AtlasNode) => {
  if (nodes.has(node.id)) return;
  nodes.set(node.id, node);
};

const addEdge = (edges: Map<string, AtlasEdge>, edge: AtlasEdge) => {
  const key = `${edge.source}|${edge.target}|${edge.kind}|${edge.sourceSystem}`;
  if (edges.has(key)) return;
  edges.set(key, edge);
};

const normalizeEdgeKind = (kind: string): AtlasEdgeKind => {
  if (kind === "imports" || kind === "defines" || kind === "mentions" || kind === "tests") {
    return kind;
  }
  return "causal";
};

const readStageHints = (meta: unknown): string[] => {
  const text =
    meta == null
      ? ""
      : typeof meta === "string"
      ? meta
      : JSON.stringify(meta);
  const normalized = text.toLowerCase();
  const hints = new Set<string>();
  for (const field of STAGE_HINT_FIELDS) {
    if (meta && typeof meta === "object" && field in (meta as Record<string, unknown>)) {
      hints.add(field);
      continue;
    }
    for (const token of STAGE_HINT_VOCABULARY[field] ?? []) {
      if (normalized.includes(token)) {
        hints.add(field);
        break;
      }
    }
  }
  return Array.from(hints).sort((a, b) => a.localeCompare(b));
};

const mergeStageHints = (...collections: Array<string[] | undefined>): string[] | undefined => {
  const hints = new Set<string>();
  for (const collection of collections) {
    for (const hint of collection ?? []) {
      if (hint) hints.add(hint);
    }
  }
  if (hints.size === 0) return undefined;
  return Array.from(hints).sort((a, b) => a.localeCompare(b));
};

const addTreeDagWalkGraph = (
  nodes: Map<string, AtlasNode>,
  edges: Map<string, AtlasEdge>,
  report: TreeDagWalkReport | null | undefined,
) => {
  if (!report || !Array.isArray(report.visited)) return;

  for (const visited of report.visited) {
    const visitedId = typeof visited.id === "string" ? visited.id : null;
    if (!visitedId) continue;
    addNode(nodes, {
      id: `tree:${visitedId}`,
      kind: "concept",
      label: visitedId,
      source: "warp-tree-dag-walk",
      meta: { depth: visited.depth ?? null },
      stageHints: readStageHints(visited),
    });

    const via = visited.via;
    if (!via || typeof via !== "object") continue;
    const sourceId = typeof via.source === "string" ? via.source : null;
    const targetId = typeof via.target === "string" ? via.target : null;
    if (!sourceId || !targetId) continue;

    addNode(nodes, {
      id: `tree:${sourceId}`,
      kind: "concept",
      label: sourceId,
      source: "warp-tree-dag-walk",
      stageHints: readStageHints(via),
    });
    addNode(nodes, {
      id: `tree:${targetId}`,
      kind: "concept",
      label: targetId,
      source: "warp-tree-dag-walk",
      stageHints: readStageHints(via),
    });
    addEdge(edges, {
      source: `tree:${sourceId}`,
      target: `tree:${targetId}`,
      kind: "causal",
      sourceSystem: "warp-tree-dag-walk",
      meta: {
        edgeType: typeof via.edgeType === "string" ? via.edgeType : null,
        requiresCL: typeof via.requiresCL === "string" ? via.requiresCL : null,
        condition: typeof via.condition === "string" ? via.condition : via.condition ?? null,
        chartDependency: typeof via.chartDependency === "string" ? via.chartDependency : via.chartDependency ?? null,
        note: typeof via.note === "string" ? via.note : via.note ?? null,
      },
    });
  }
};

export const buildRepoAtlasFromSources = (sources: AtlasSources): RepoAtlas => {
  const nodes = new Map<string, AtlasNode>();
  const edges = new Map<string, AtlasEdge>();

  for (const node of G4_STAGE_CHAIN_NODES) addNode(nodes, node);
  for (const edge of G4_STAGE_CHAIN_EDGES) addEdge(edges, edge);

  for (const entry of sources.repoIndex) {
    const pathRef = entry.source?.path;
    const nodeId = `index:${entry.id}`;
    const kind: AtlasNodeKind = entry.kind === "artifact" ? "value" : pathRef ? "file" : "concept";
    const stageHints = readStageHints({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      body: entry.body,
      source: entry.source,
      tags: entry.tags,
    });
    addNode(nodes, {
      id: nodeId,
      kind,
      label: entry.title,
      path: pathRef,
      source: "repo-index",
      stageHints: stageHints.length > 0 ? stageHints : undefined,
      meta: { entryKind: entry.kind, tags: entry.tags ?? [] },
    });
    if (pathRef) {
      const fileId = `file:${pathRef}`;
      addNode(nodes, {
        id: fileId,
        kind: "file",
        label: path.basename(pathRef),
        path: pathRef,
        source: "repo-index",
        stageHints: stageHints.length > 0 ? stageHints : undefined,
      });
      addEdge(edges, { source: nodeId, target: fileId, kind: "mentions", sourceSystem: "repo-index" });
    }
  }

  for (const node of sources.repoGraph.nodes) {
    const nodeId = node.kind === "file" && node.path ? `file:${node.path}` : `graph:${node.id}`;
    const stageHints = readStageHints({ ...node, id: node.id });
    const existing = nodes.get(nodeId);
    addNode(nodes, {
      id: nodeId,
      kind: node.kind,
      label: node.name,
      path: node.path,
      source: "repo-graph",
      stageHints: mergeStageHints(existing?.stageHints, stageHints),
      meta: { tags: node.tags ?? [] },
    });
  }

  for (const edge of sources.repoGraph.edges) {
    const sourceId = edge.source.includes("/") ? `file:${edge.source}` : `graph:${edge.source}`;
    const targetId = edge.target.includes("/") ? `file:${edge.target}` : `graph:${edge.target}`;
    addEdge(edges, {
      source: sourceId,
      target: targetId,
      kind: normalizeEdgeKind(edge.kind),
      sourceSystem: "repo-graph",
      meta: edge.citation_context ? { citationContext: edge.citation_context } : undefined,
    });
  }

  for (const node of sources.codeLattice.nodes) {
    const nodeId = `lattice:${node.nodeId}`;
    const stageHints = readStageHints({
      nodeId: node.nodeId,
      symbol: node.symbol,
      doc: node.doc,
      signature: node.signature,
      metrics: node.metrics,
      tags: node.tags,
    });
    addNode(nodes, {
      id: nodeId,
      kind: node.kind === "test" ? "gate" : "symbol",
      label: node.symbol,
      path: node.filePath,
      source: "code-lattice",
      stageHints: stageHints.length > 0 ? stageHints : undefined,
      meta: { resonanceKind: node.resonanceKind, kind: node.kind },
    });

    if (node.filePath) {
      const fileId = `file:${node.filePath}`;
      addNode(nodes, {
        id: fileId,
        kind: "file",
        label: path.basename(node.filePath),
        path: node.filePath,
        source: "code-lattice",
      });
      addEdge(edges, { source: nodeId, target: fileId, kind: "defines", sourceSystem: "code-lattice" });
    }
  }

  for (const edge of sources.codeLattice.edges) {
    addEdge(edges, {
      source: `lattice:${edge.from}`,
      target: `lattice:${edge.to}`,
      kind: normalizeEdgeKind(edge.kind),
      sourceSystem: "code-lattice",
      meta: edge.label ? { label: edge.label } : undefined,
    });
  }

  addTreeDagWalkGraph(nodes, edges, sources.treeDagWalk);

  return {
    version: "repo-atlas/1",
    snapshot: {
      generatedAt: sources.generatedAt,
      commitHash: sources.commitHash,
      repoGraphBuiltAt: sources.repoGraph.builtAt,
      treeDagWalkLoaded: Array.isArray(sources.treeDagWalk?.visited),
    },
    nodes: stableSort([...nodes.values()], (row) => `${row.kind}|${row.id}`),
    edges: stableSort([...edges.values()], (row) => `${row.kind}|${row.source}|${row.target}|${row.sourceSystem}`),
  };
};

const resolveCommitHash = async (): Promise<string> => {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: process.cwd() });
    return stdout.trim();
  } catch {
    return "unknown";
  }
};

const readTreeDagWalkReport = async (reportPath = DEFAULT_TREE_DAG_WALK_REPORT_PATH): Promise<TreeDagWalkReport | null> => {
  try {
    const raw = await fs.readFile(reportPath, "utf8");
    const parsed = JSON.parse(raw) as TreeDagWalkReport;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

async function main() {
  const generatedAt = new Date().toISOString();
  const commitHash = await resolveCommitHash();
  const [repoIndex, repoGraph, codeLattice, treeDagWalk] = await Promise.all([
    getRepoSearchIndex(),
    getRepoGraphSnapshot(),
    buildCodeLatticeSnapshot().then((row) => row.snapshot),
    readTreeDagWalkReport(),
  ]);

  const atlas = buildRepoAtlasFromSources({
    generatedAt,
    commitHash,
    repoIndex,
    repoGraph,
    codeLattice,
    treeDagWalk,
  });
  const outPath = DEFAULT_ATLAS_PATH;
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(atlas, null, 2));
  console.log(`[repo-atlas] wrote ${atlas.nodes.length} nodes and ${atlas.edges.length} edges to ${path.relative(process.cwd(), outPath)}`);
}

export const isDirectExecution = (importMetaUrl: string, argvPath = process.argv[1]): boolean => {
  if (!argvPath) return false;
  return importMetaUrl === pathToFileURL(path.resolve(argvPath)).href;
};

if (isDirectExecution(import.meta.url)) {
  void main();
}
