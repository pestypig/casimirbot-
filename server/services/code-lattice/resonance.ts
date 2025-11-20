import { createHash } from "node:crypto";
import path from "node:path";
import type { ConsoleTelemetryBundle } from "@shared/desktop";
import type { KnowledgeFileAttachment, KnowledgeProjectExport } from "@shared/knowledge";
import type { TCodeFeature } from "@shared/essence-schema";
import type {
  CodeEdge,
  CodeLatticeSnapshot,
  ResonanceBundle,
  ResonancePatch,
  ResonancePatchMode,
  ResonanceNodeKind,
} from "@shared/code-lattice";
import { loadCodeLattice } from "./loader";

type LatticeIndex = {
  nodesById: Map<string, TCodeFeature>;
  nodesByFile: Map<string, TCodeFeature[]>;
  adjacency: Map<string, CodeEdge[]>;
  fingerprint: string;
  snapshot: CodeLatticeSnapshot;
};

type PanelHitMap = Map<string, Set<string>>;

type ResonancePatchConfig = {
  id: string;
  label: string;
  mode: ResonancePatchMode;
  hops: number;
  limitScale: number;
};

const EDGE_WEIGHTS: Record<CodeEdge["kind"], number> = {
  import: 0.85,
  export: 0.6,
  call: 0.9,
  local: 0.35,
  cochange: 0.5,
  reference: 0.45,
};
const KIND_BIAS: Record<ResonanceNodeKind, number> = {
  architecture: 0.14,
  ideology: 0.1,
  ui: 0.05,
  plumbing: 0.015,
  test: -0.02,
  doc: 0.06,
  data: 0.02,
  unknown: 0,
};
const RESONANCE_LIMIT_DEFAULT = 12;
const PROPAGATION_STEPS = 3;
const DECAY_PER_STEP = 0.55;
const MIN_SCORE = 0.05;
const PATCH_BLUEPRINTS: ResonancePatchConfig[] = [
  { id: "patch_local", label: "Local resonance", mode: "local", hops: 2, limitScale: 0.7 },
  { id: "patch_module", label: "Module resonance", mode: "module", hops: 4, limitScale: 1 },
  { id: "patch_ideology", label: "Ideology resonance", mode: "ideology", hops: 6, limitScale: 1.25 },
];

let cachedIndex: LatticeIndex | null = null;

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const normalizePath = (value: string | undefined): string =>
  (value ?? "").replace(/\\/g, "/").replace(/^\.\//, "");

const fingerprintSnapshot = (snapshot: CodeLatticeSnapshot) =>
  `${snapshot.commit}:${snapshot.generatedAt}:${snapshot.nodes.length}:${snapshot.edges.length}`;

function indexSnapshot(snapshot: CodeLatticeSnapshot): LatticeIndex {
  const nodesById = new Map<string, TCodeFeature>();
  const nodesByFile = new Map<string, TCodeFeature[]>();
  for (const node of snapshot.nodes) {
    nodesById.set(node.nodeId, node);
    const list = nodesByFile.get(node.filePath) ?? [];
    list.push(node);
    nodesByFile.set(node.filePath, list);
  }
  const adjacency = new Map<string, CodeEdge[]>();
  for (const edge of snapshot.edges) {
    const current = adjacency.get(edge.from) ?? [];
    current.push(edge);
    adjacency.set(edge.from, current);
  }
  return {
    nodesById,
    nodesByFile,
    adjacency,
    fingerprint: fingerprintSnapshot(snapshot),
    snapshot,
  };
}

async function getIndexedSnapshot(): Promise<LatticeIndex | null> {
  const snapshot = await loadCodeLattice();
  if (!snapshot) {
    return null;
  }
  const fp = fingerprintSnapshot(snapshot);
  if (!cachedIndex || cachedIndex.fingerprint !== fp) {
    cachedIndex = indexSnapshot(snapshot);
  }
  return cachedIndex;
}

const toSuiteScore = (value: string | undefined): number => {
  switch ((value ?? "").toLowerCase()) {
    case "pass":
    case "passed":
      return 0.1;
    case "fail":
    case "failed":
      return 0.2;
    default:
      return 0;
  }
};

function textMatchScore(node: TCodeFeature, terms: Set<string>): number {
  if (!terms.size) return 0;
  const haystack = [node.symbol, node.filePath, node.doc, node.snippet, ...(node.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!haystack) return 0;
  let hits = 0;
  for (const token of terms) {
    if (haystack.includes(token)) {
      hits += 1;
    }
  }
  return hits > 0 ? hits / terms.size : 0;
}

function resolveTelemetryTargets(
  sourceId: string,
  nodesById: Map<string, TCodeFeature>,
  nodesByFile: Map<string, TCodeFeature[]>,
): string[] {
  const explicit = nodesById.has(sourceId) ? [sourceId] : [];
  const normalized = normalizePath(sourceId);
  if (!normalized) {
    return explicit;
  }
  const directFile = nodesByFile.get(normalized) ?? [];
  const suffixMatch =
    directFile.length === 0
      ? Array.from(nodesByFile.entries())
          .filter(([file]) => file.endsWith(normalized))
          .flatMap(([, nodes]) => nodes)
      : directFile;
  const ids = suffixMatch.map((node) => node.nodeId);
  return [...new Set([...explicit, ...ids])];
}

function collectTelemetrySeeds(
  telemetry: ConsoleTelemetryBundle | null,
  nodesById: Map<string, TCodeFeature>,
  nodesByFile: Map<string, TCodeFeature[]>,
): { seeds: Map<string, number>; panels: PanelHitMap } {
  const seeds = new Map<string, number>();
  const panels = new Map<string, Set<string>>();
  if (!telemetry) {
    return { seeds, panels };
  }
  for (const panel of telemetry.panels ?? []) {
    if (!Array.isArray(panel.sourceIds) || panel.sourceIds.length === 0) continue;
    const panelWeight = Math.max(0.5, (panel.metrics?.attention ?? 0) + 1);
    for (const sourceId of panel.sourceIds) {
      const targets = resolveTelemetryTargets(sourceId, nodesById, nodesByFile);
      for (const nodeId of targets) {
        seeds.set(nodeId, (seeds.get(nodeId) ?? 0) + panelWeight);
        const set = panels.get(nodeId) ?? new Set<string>();
        set.add(panel.panelId);
        panels.set(nodeId, set);
      }
    }
  }
  return { seeds, panels };
}

function propagateActivations(
  seeds: Map<string, number>,
  adjacency: Map<string, CodeEdge[]>,
  steps = PROPAGATION_STEPS,
  decay = DECAY_PER_STEP,
): Map<string, number> {
  const scores = new Map<string, number>(seeds);
  for (let iter = 0; iter < steps; iter += 1) {
    const next = new Map<string, number>();
    for (const [nodeId, score] of scores) {
      if (!Number.isFinite(score) || score <= 0) continue;
      const edges = adjacency.get(nodeId);
      if (!edges || edges.length === 0) continue;
      for (const edge of edges) {
        const edgeWeight = EDGE_WEIGHTS[edge.kind] ?? 0.25;
        const delta = score * edgeWeight * decay;
        if (delta <= 0) continue;
        next.set(edge.to, (next.get(edge.to) ?? 0) + delta);
      }
    }
    for (const [nodeId, delta] of next) {
      scores.set(nodeId, (scores.get(nodeId) ?? 0) + delta);
    }
  }
  return scores;
}

const clip = (value: string, max = 360) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 3)}...`;
};

const summarizeNode = (node: TCodeFeature): string | undefined => {
  if (node.doc?.trim()) {
    return clip(node.doc, 200);
  }
  if (node.snippet?.trim()) {
    return clip(node.snippet, 200);
  }
  return undefined;
};

const resolveKind = (kind?: ResonanceNodeKind): ResonanceNodeKind => kind ?? "unknown";

const kindBias = (node?: TCodeFeature): number => {
  if (!node) {
    return KIND_BIAS.unknown;
  }
  return KIND_BIAS[resolveKind(node.resonanceKind)] ?? KIND_BIAS.unknown;
};

function formatPreview(node: TCodeFeature, score: number, panels?: Set<string>): string {
  const parts: string[] = [];
  if (node.doc) {
    parts.push(clip(node.doc, 400));
  }
  if (node.snippet) {
    parts.push(clip(node.snippet, 320));
  }
  const meta: string[] = [`score=${score.toFixed(3)}`];
  if (panels && panels.size > 0) {
    meta.push(`panels=${Array.from(panels).join(",")}`);
  } else if (node.salience?.activePanels?.length) {
    meta.push(`panels=${node.salience.activePanels.join(",")}`);
  }
  if (node.salience?.attention) {
    meta.push(`attention=${node.salience.attention.toFixed(2)}`);
  }
  if (node.health?.lastStatus) {
    meta.push(`tests=${node.health.lastStatus}`);
  }
  parts.push(meta.join(" | "));
  return parts.filter(Boolean).join("\n");
}

type BuildResonanceArgs = {
  goal: string;
  query?: string;
  limit?: number;
  telemetry?: ConsoleTelemetryBundle | null;
};

type PatchBuilderArgs = {
  blueprint: ResonancePatchConfig;
  baseLimit: number;
  trimmed: string;
  seeds: Map<string, number>;
  panels: PanelHitMap;
  indexed: LatticeIndex;
};

const clampLimit = (base: number, scale: number) => Math.max(3, Math.min(64, Math.round(base * scale)));

function buildPatchFromBlueprint(args: PatchBuilderArgs): ResonancePatch | null {
  const limit = clampLimit(args.baseLimit, args.blueprint.limitScale);
  const propagated = propagateActivations(args.seeds, args.indexed.adjacency, args.blueprint.hops);
  const rankedRaw = Array.from(propagated.entries())
    .map(([nodeId, score]) => {
      const node = args.indexed.nodesById.get(nodeId);
      if (!node || score < MIN_SCORE) {
        return null;
      }
      return {
        node,
        nodeId,
        score,
        rankScore: score + kindBias(node),
      };
    })
    .filter((entry): entry is { node: TCodeFeature; nodeId: string; score: number; rankScore: number } => Boolean(entry))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit);
  if (rankedRaw.length === 0) {
    return null;
  }
  const hash = createHash("sha256").update(`${args.trimmed}:${args.blueprint.id}`).digest("hex").slice(0, 12);
  const projectId = `${args.blueprint.id}-${hash}`;

  const nodes: ResonancePatch["nodes"] = [];
  const files: KnowledgeFileAttachment[] = [];
  let approxBytes = 0;
  let failingTests = 0;
  const touchedPanels = new Set<string>();

  let activationTotal = 0;
  let telemetryWeight = 0;

  for (const entry of rankedRaw) {
    const { node, score } = entry;
    const panelSet = args.panels.get(node.nodeId);
    if (panelSet && panelSet.size > 0) {
      for (const panelId of panelSet) {
        touchedPanels.add(panelId);
      }
      telemetryWeight += panelSet.size;
    }
    const status = node.health?.lastStatus ?? "";
    if (status.toLowerCase().startsWith("fail")) {
      failingTests += 1;
    }
    activationTotal += score;
    nodes.push({
      id: node.nodeId,
      symbol: node.symbol,
      filePath: node.filePath,
      score,
      kind: resolveKind(node.resonanceKind),
      panels: panelSet ? Array.from(panelSet) : undefined,
      attention: node.salience?.attention,
      tests: status || undefined,
      summary: summarizeNode(node),
    });

    const snippetBytes = node.metrics?.bytes ?? Buffer.byteLength(node.snippet ?? "", "utf8");
    const attachment: KnowledgeFileAttachment = {
      id: node.nodeId,
      name: `${node.symbol} (${path.posix.basename(node.filePath)})`,
      path: node.filePath,
      mime: "text/plain",
      size: snippetBytes,
      hashSlug: node.astHash,
      projectId,
      kind: "code",
      preview: formatPreview(node, score, panelSet),
    };
    files.push(attachment);
    approxBytes += Math.max(0, snippetBytes);
  }

  if (nodes.length === 0) {
    return null;
  }

  const patchScore = nodes.reduce((sum, node) => sum + node.score, 0) / nodes.length;
  const summary = [
    `${args.blueprint.label} for "${args.trimmed}"`,
    `${nodes.length} nodes`,
    `score=${patchScore.toFixed(2)}`,
    `panels=${touchedPanels.size}`,
    `failing=${failingTests}`,
  ].join(" | ");

  return {
    id: args.blueprint.id,
    label: args.blueprint.label,
    mode: args.blueprint.mode,
    hops: args.blueprint.hops,
    limit,
    score: patchScore,
    summary,
    stats: {
      activationTotal,
      telemetryWeight,
      failingTests,
      activePanels: touchedPanels.size,
      nodeCount: nodes.length,
    },
    nodes,
    knowledge: {
      project: {
        id: projectId,
        name: `${args.blueprint.label}`,
        type: "code",
        hashSlug: projectId,
      },
      summary,
      files,
      approxBytes,
    },
  };
}

export async function buildResonanceBundle(args: BuildResonanceArgs): Promise<ResonanceBundle | null> {
  const indexed = await getIndexedSnapshot();
  if (!indexed) {
    return null;
  }
  const limit = Math.max(3, Math.min(48, args.limit ?? RESONANCE_LIMIT_DEFAULT));
  const trimmed = `${args.goal ?? ""} ${args.query ?? ""}`.trim();
  if (!trimmed) {
    return null;
  }
  const tokenSet = new Set(tokenize(trimmed));
  const seeds = new Map<string, number>();
  const { seeds: telemetrySeeds, panels } = collectTelemetrySeeds(
    args.telemetry ?? null,
    indexed.nodesById,
    indexed.nodesByFile,
  );
  for (const [nodeId, score] of telemetrySeeds) {
    seeds.set(nodeId, (seeds.get(nodeId) ?? 0) + score);
  }
  for (const node of indexed.nodesById.values()) {
    const textScore = textMatchScore(node, tokenSet);
    if (textScore > 0) {
      seeds.set(node.nodeId, (seeds.get(node.nodeId) ?? 0) + textScore);
    }
    if (node.salience?.attention) {
      const salienceBoost = node.salience.attention * 0.5;
      seeds.set(node.nodeId, (seeds.get(node.nodeId) ?? 0) + salienceBoost);
    }
    if (node.health?.lastStatus) {
      seeds.set(node.nodeId, (seeds.get(node.nodeId) ?? 0) + toSuiteScore(node.health.lastStatus));
    }
  }
  if (seeds.size === 0) {
    return null;
  }

  const candidates: ResonancePatch[] = [];
  for (const blueprint of PATCH_BLUEPRINTS) {
    const patch = buildPatchFromBlueprint({
      blueprint,
      baseLimit: limit,
      trimmed,
      seeds,
      panels,
      indexed,
    });
    if (patch) {
      candidates.push(patch);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.score - a.score);

  return {
    goal: args.goal,
    query: trimmed,
    capturedAt: new Date().toISOString(),
    baseLimit: limit,
    seedCount: seeds.size,
    candidates,
  };
}

export async function buildResonantCodeKnowledge(args: BuildResonanceArgs): Promise<KnowledgeProjectExport | null> {
  const bundle = await buildResonanceBundle(args);
  return bundle?.candidates?.[0]?.knowledge ?? null;
}
