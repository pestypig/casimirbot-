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
  ResonanceTelemetrySummary,
} from "@shared/code-lattice";
import {
  CASIMIR_BAND_BIAS,
  CASIMIR_BLUEPRINT_BY_BAND,
  CASIMIR_LOW_SIGNAL,
  RESONANCE_EVENT_RATE_CAP,
  RESONANCE_RECENCY_TAU_MS,
  RESONANCE_WEIGHTS,
} from "./resonance.constants";
import { loadCodeLattice } from "./loader";

type LatticeIndex = {
  nodesById: Map<string, TCodeFeature>;
  nodesByFile: Map<string, TCodeFeature[]>;
  adjacency: Map<string, CodeEdge[]>;
  fingerprint: string;
  snapshot: CodeLatticeSnapshot;
};

type PanelHitMap = Map<string, Set<string>>;
type NodeBandMap = Map<string, Set<string>>;
type NodeSourceMap = Map<string, Set<string>>;

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

type TelemetrySeedResult = {
  seeds: Map<string, number>;
  panels: PanelHitMap;
  bandsByNode: NodeBandMap;
  sourcesByNode: NodeSourceMap;
  telemetry?: ResonanceTelemetrySummary;
};

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

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const addToSetMap = <T>(map: Map<string, Set<T>>, key: string, value: T): void => {
  const set = map.get(key) ?? new Set<T>();
  set.add(value);
  map.set(key, set);
};

type CasimirSeedArtifacts = {
  seeds: Map<string, number>;
  panels: PanelHitMap;
  bandsByNode: NodeBandMap;
  sourcesByNode: NodeSourceMap;
  telemetry?: ResonanceTelemetrySummary;
};

const normalizeBand = (name?: string): string => (name ?? "").toLowerCase();

function collectCasimirSeeds(
  panel: NonNullable<ConsoleTelemetryBundle["panels"]>[number],
  nodesById: Map<string, TCodeFeature>,
  nodesByFile: Map<string, TCodeFeature[]>,
  now = Date.now(),
): CasimirSeedArtifacts {
  const seeds = new Map<string, number>();
  const panels = new Map<string, Set<string>>();
  const bandsByNode: NodeBandMap = new Map();
  const sourcesByNode: NodeSourceMap = new Map();
  const tileSample = panel.tile_sample ?? {
    total: toFiniteNumber(panel.metrics?.totalTiles) ?? undefined,
    active: toFiniteNumber(panel.metrics?.tilesActive) ?? undefined,
  };
  const fallbackOccupancy =
    tileSample?.total && tileSample?.total > 0 && tileSample?.active != null
      ? clamp01(tileSample.active / tileSample.total)
      : clamp01(toFiniteNumber(panel.metrics?.occupancy) ?? 0);
  const bandCandidates =
    (panel.bands ?? []).filter(
      (band) => toFiniteNumber(band?.q) !== null || toFiniteNumber(band?.coherence) !== null || band?.name,
    ) ??
    [];
  const bands =
    bandCandidates.length > 0
      ? bandCandidates
      : [
          {
            name: "mhz",
            q: toFiniteNumber(panel.metrics?.avgQFactor) ?? 0,
            coherence: toFiniteNumber(panel.metrics?.coherence) ?? 0,
            occupancy: fallbackOccupancy,
            event_rate: toFiniteNumber(panel.metrics?.eventRate ?? panel.metrics?.eventsPerMin ?? panel.metrics?.eventsPerMinute) ?? undefined,
            last_event: panel.strings?.lastEventIso ?? panel.strings?.lastEvent,
          },
        ];

  const bandStats: NonNullable<ResonanceTelemetrySummary["casimir"]>["bands"] = [];
  let totalCoherence = 0;

  for (const band of bands) {
    const q = clamp01(toFiniteNumber((band as any)?.q) ?? 0);
    const coherence = clamp01(toFiniteNumber((band as any)?.coherence) ?? 0);
    const occupancy = clamp01(toFiniteNumber((band as any)?.occupancy) ?? fallbackOccupancy);
    const lastEventIso = (band as any)?.last_event ?? panel.strings?.lastEventIso ?? panel.strings?.lastEvent ?? null;
    const dtMs = lastEventIso ? Math.max(0, now - Date.parse(lastEventIso)) : null;
    const recency = dtMs === null ? 0 : Math.exp(-dtMs / RESONANCE_RECENCY_TAU_MS);
    const eventsPerMin =
      toFiniteNumber((band as any)?.event_rate) ??
      toFiniteNumber(panel.metrics?.eventRate ?? panel.metrics?.eventsPerMinute ?? panel.metrics?.eventsPerMin);
    const eventTerm = clamp01(((eventsPerMin ?? 0) as number) / RESONANCE_EVENT_RATE_CAP);
    let seed =
      RESONANCE_WEIGHTS.wOcc * occupancy +
      RESONANCE_WEIGHTS.wQ * q +
      RESONANCE_WEIGHTS.wCoh * coherence +
      RESONANCE_WEIGHTS.wRec * recency +
      RESONANCE_WEIGHTS.wEvt * eventTerm;
    if (occupancy < CASIMIR_LOW_SIGNAL.occupancy && coherence < CASIMIR_LOW_SIGNAL.coherence) {
      seed *= CASIMIR_LOW_SIGNAL.damp;
    }
    if (!Number.isFinite(seed) || seed <= 0) {
      continue;
    }
    const bandName = normalizeBand((band as any)?.name ?? "mhz");
    totalCoherence += coherence;
    const sourceIds = Array.isArray(panel.sourceIds) ? panel.sourceIds.filter(Boolean) : [];
    for (const sourceId of sourceIds) {
      const targets = resolveTelemetryTargets(sourceId, nodesById, nodesByFile);
      for (const nodeId of targets) {
        seeds.set(nodeId, (seeds.get(nodeId) ?? 0) + seed);
        addToSetMap(panels, nodeId, panel.panelId);
        addToSetMap(bandsByNode, nodeId, bandName);
        addToSetMap(sourcesByNode, nodeId, sourceId);
      }
    }
    bandStats.push({
      name: bandName,
      seed,
      q,
      coherence,
      occupancy,
      eventRate: eventsPerMin ?? undefined,
      lastEventIso: lastEventIso ?? undefined,
      sourceIds,
    });
  }

  const telemetry =
    bandStats.length > 0
      ? {
          casimir: {
            bands: bandStats,
            tileSample,
            totalCoherence,
          },
        }
      : undefined;

  return { seeds, panels, bandsByNode, sourcesByNode, telemetry };
}

function mergeSeedArtifacts(target: TelemetrySeedResult, incoming: TelemetrySeedResult): TelemetrySeedResult {
  for (const [nodeId, value] of incoming.seeds.entries()) {
    target.seeds.set(nodeId, (target.seeds.get(nodeId) ?? 0) + value);
  }
  for (const [nodeId, set] of incoming.panels.entries()) {
    for (const panelId of set.values()) {
      addToSetMap(target.panels, nodeId, panelId);
    }
  }
  for (const [nodeId, set] of incoming.bandsByNode.entries()) {
    for (const band of set.values()) {
      addToSetMap(target.bandsByNode, nodeId, band);
    }
  }
  for (const [nodeId, set] of incoming.sourcesByNode.entries()) {
    for (const source of set.values()) {
      addToSetMap(target.sourcesByNode, nodeId, source);
    }
  }

  const existingCasimir = target.telemetry?.casimir;
  const incomingCasimir = incoming.telemetry?.casimir;
  if (incomingCasimir) {
    const mergedCasimir = {
      bands: [...(existingCasimir?.bands ?? []), ...incomingCasimir.bands],
      tileSample: incomingCasimir.tileSample ?? existingCasimir?.tileSample,
      totalCoherence: (existingCasimir?.totalCoherence ?? 0) + (incomingCasimir.totalCoherence ?? 0),
    };
    target.telemetry = { ...(target.telemetry ?? {}), casimir: mergedCasimir };
  }

  return target;
}

function collectTelemetrySeeds(
  telemetry: ConsoleTelemetryBundle | null,
  nodesById: Map<string, TCodeFeature>,
  nodesByFile: Map<string, TCodeFeature[]>,
): TelemetrySeedResult {
  const seedResult: TelemetrySeedResult = {
    seeds: new Map<string, number>(),
    panels: new Map<string, Set<string>>(),
    bandsByNode: new Map<string, Set<string>>(),
    sourcesByNode: new Map<string, Set<string>>(),
    telemetry: undefined,
  };
  if (!telemetry) {
    return seedResult;
  }
  for (const panel of telemetry.panels ?? []) {
    if (!Array.isArray(panel.sourceIds) || panel.sourceIds.length === 0) continue;
    if (panel.kind === "casimir") {
      const casimirSeeds = collectCasimirSeeds(panel, nodesById, nodesByFile);
      mergeSeedArtifacts(seedResult, casimirSeeds);
      continue;
    }
    const panelWeight = Math.max(0.5, (panel.metrics?.attention ?? 0) + 1);
    for (const sourceId of panel.sourceIds) {
      const targets = resolveTelemetryTargets(sourceId, nodesById, nodesByFile);
      for (const nodeId of targets) {
        seedResult.seeds.set(nodeId, (seedResult.seeds.get(nodeId) ?? 0) + panelWeight);
        addToSetMap(seedResult.panels, nodeId, panel.panelId);
        addToSetMap(seedResult.sourcesByNode, nodeId, sourceId);
      }
    }
  }
  return seedResult;
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

const applyBlueprintBias = (
  seeds: Map<string, number>,
  bandsByNode: NodeBandMap,
  mode: ResonancePatchMode,
): Map<string, number> => {
  const biasFactor = CASIMIR_BAND_BIAS[mode];
  if (!biasFactor || biasFactor <= 1) {
    return seeds;
  }
  const adjusted = new Map<string, number>();
  for (const [nodeId, score] of seeds.entries()) {
    const bands = bandsByNode.get(nodeId);
    const hasMatch =
      bands &&
      Array.from(bands).some((band) => {
        const mapped = CASIMIR_BLUEPRINT_BY_BAND[normalizeBand(band)];
        return mapped === mode;
      });
    adjusted.set(nodeId, hasMatch ? score * biasFactor : score);
  }
  return adjusted;
};

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
  bandsByNode: NodeBandMap;
  sourcesByNode: NodeSourceMap;
  casimirCoherence?: number;
};

const clampLimit = (base: number, scale: number) => Math.max(3, Math.min(64, Math.round(base * scale)));

function buildPatchFromBlueprint(args: PatchBuilderArgs): ResonancePatch | null {
  const limit = clampLimit(args.baseLimit, args.blueprint.limitScale);
  const biasedSeeds = applyBlueprintBias(args.seeds, args.bandsByNode, args.blueprint.mode);
  const propagated = propagateActivations(biasedSeeds, args.indexed.adjacency, args.blueprint.hops);
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
    const nodeBands = args.bandsByNode.get(node.nodeId);
    const nodeSources = args.sourcesByNode.get(node.nodeId);
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
      bands: nodeBands ? Array.from(nodeBands) : undefined,
      sources: nodeSources ? Array.from(nodeSources) : undefined,
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
      casimirBandTotalCoherence: args.casimirCoherence,
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
  const telemetrySeedResult = collectTelemetrySeeds(
    args.telemetry ?? null,
    indexed.nodesById,
    indexed.nodesByFile,
  );
  for (const [nodeId, score] of telemetrySeedResult.seeds) {
    seeds.set(nodeId, (seeds.get(nodeId) ?? 0) + score);
  }
  const bandsByNode = telemetrySeedResult.bandsByNode;
  const sourcesByNode = telemetrySeedResult.sourcesByNode;
  const telemetrySummary = telemetrySeedResult.telemetry;

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
      panels: telemetrySeedResult.panels,
      indexed,
      bandsByNode,
      sourcesByNode,
      casimirCoherence: telemetrySummary?.casimir?.totalCoherence,
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
    telemetry: telemetrySummary,
  };
}

export async function buildResonantCodeKnowledge(args: BuildResonanceArgs): Promise<KnowledgeProjectExport | null> {
  const bundle = await buildResonanceBundle(args);
  return bundle?.candidates?.[0]?.knowledge ?? null;
}
