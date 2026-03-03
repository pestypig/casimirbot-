import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
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
  };
  nodes: AtlasNode[];
  edges: AtlasEdge[];
};

type AtlasSources = {
  generatedAt: string;
  commitHash: string;
  repoIndex: Awaited<ReturnType<typeof getRepoSearchIndex>>;
  repoGraph: Awaited<ReturnType<typeof getRepoGraphSnapshot>>;
  codeLattice: Awaited<ReturnType<typeof buildCodeLatticeSnapshot>>["snapshot"];
};

const STAGE_HINT_FIELDS = ["S0_source", "S1_qi_sample", "S2_bound_computed", "S3_bound_policy", "S4_margin", "S5_gate"];

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
  if (!meta || typeof meta !== "object") return [];
  const obj = meta as Record<string, unknown>;
  return STAGE_HINT_FIELDS.filter((field) => field in obj);
};

export const buildRepoAtlasFromSources = (sources: AtlasSources): RepoAtlas => {
  const nodes = new Map<string, AtlasNode>();
  const edges = new Map<string, AtlasEdge>();

  for (const entry of sources.repoIndex) {
    const pathRef = entry.source?.path;
    const nodeId = `index:${entry.id}`;
    const kind: AtlasNodeKind = entry.kind === "artifact" ? "value" : pathRef ? "file" : "concept";
    addNode(nodes, {
      id: nodeId,
      kind,
      label: entry.title,
      path: pathRef,
      source: "repo-index",
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
      });
      addEdge(edges, { source: nodeId, target: fileId, kind: "mentions", sourceSystem: "repo-index" });
    }
  }

  for (const node of sources.repoGraph.nodes) {
    const nodeId = node.kind === "file" && node.path ? `file:${node.path}` : `graph:${node.id}`;
    addNode(nodes, {
      id: nodeId,
      kind: node.kind,
      label: node.name,
      path: node.path,
      source: "repo-graph",
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
    const stageHints = readStageHints(node.metrics);
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

  return {
    version: "repo-atlas/1",
    snapshot: {
      generatedAt: sources.generatedAt,
      commitHash: sources.commitHash,
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

async function main() {
  const generatedAt = new Date().toISOString();
  const commitHash = await resolveCommitHash();
  const [repoIndex, repoGraph, codeLattice] = await Promise.all([
    getRepoSearchIndex(),
    getRepoGraphSnapshot(),
    buildCodeLatticeSnapshot().then((row) => row.snapshot),
  ]);

  const atlas = buildRepoAtlasFromSources({ generatedAt, commitHash, repoIndex, repoGraph, codeLattice });
  const outPath = path.join(process.cwd(), "artifacts", "repo-atlas", "repo-atlas.v1.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(atlas, null, 2));
  console.log(`[repo-atlas] wrote ${atlas.nodes.length} nodes and ${atlas.edges.length} edges to ${path.relative(process.cwd(), outPath)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
