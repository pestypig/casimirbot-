import type {
  TheoryBiomeBand,
  TheoryBiomeChunkV1,
  TheoryBiomeCoordinateV1,
  TheoryBiomeFidelity,
  TheoryBiomeLayoutV1,
} from "@shared/contracts/theory-biome-layout.v1";
import {
  THEORY_BIOME_LAYOUT_SCHEMA_VERSION,
  THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1,
} from "@shared/contracts/theory-biome-layout.v1";
import type {
  TheoryBadgeEdgeV1,
  TheoryBadgeGraphV1,
  TheoryBadgeLevel,
  TheoryBadgeV1,
} from "@shared/contracts/theory-badge-graph.v1";
import {
  inferTheoryBiomeCoordinateSeed,
  THEORY_BIOME_BAND_ORDER,
  THEORY_BIOME_DOMAIN_ORDER,
  THEORY_SCALE_BANDS,
} from "@shared/theory/theory-biome-scale-taxonomy";
import type {
  TheoryAchievementLayout,
  TheoryAchievementLayoutEdge,
  TheoryAchievementLayoutNode,
} from "./theoryAchievementLayout";
import { hash01 } from "./theoryBiomeField";

export type TheoryBiomeAchievementLayout = TheoryAchievementLayout & {
  biome: TheoryBiomeLayoutV1;
};

const BAND_WIDTH = THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.scaleBandWidthPx;
const DOMAIN_HEIGHT = 178;
const X_OFFSET = 92;
const Y_OFFSET = 104;
const JITTER_X = 54;
const JITTER_Y = 46;
const CHUNK_SIZE = THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.chunkSizePx;
const BADGE_STEP_X =
  THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.badgeSizePx +
  THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.minBadgeGapXPx;
const BADGE_STEP_Y =
  THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.badgeSizePx +
  THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.minBadgeGapYPx;

const LEVEL_DEPTH: Record<TheoryBadgeLevel, number> = {
  first_principle: 0,
  law: 1,
  derived_relation: 2,
  model: 3,
  simulation_specific: 4,
  diagnostic_gate: 5,
  claim_boundary: 6,
};

const FIDELITY_OFFSET: Record<TheoryBiomeFidelity, number> = {
  canonical: -54,
  derived: -28,
  model: 0,
  simulation_proxy: 24,
  runtime_artifact: 42,
  diagnostic_gate: 58,
  claim_boundary: 76,
};

const FIDELITY_VALUE: Record<TheoryBiomeFidelity, number> = {
  canonical: 0.94,
  derived: 0.82,
  model: 0.62,
  simulation_proxy: 0.48,
  runtime_artifact: 0.68,
  diagnostic_gate: 0.34,
  claim_boundary: 0.12,
};

const LAYOUT_EDGE_RELATIONS = new Set([
  "derives",
  "requires",
  "specializes",
  "approximates",
  "bounds",
  "uses_constant",
  "numerically_solves",
  "diagnostic_checks",
  "shares_units",
]);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function bandIndex(band: TheoryBiomeBand): number {
  return Math.max(0, THEORY_BIOME_BAND_ORDER.indexOf(band));
}

function domainIndex(domainKey: string): number {
  const index = THEORY_BIOME_DOMAIN_ORDER.indexOf(domainKey as (typeof THEORY_BIOME_DOMAIN_ORDER)[number]);
  return index >= 0 ? index : THEORY_BIOME_DOMAIN_ORDER.length - 1;
}

function bandScaleFraction(band: TheoryBiomeBand, scaleLog10M: number | null): number {
  if (scaleLog10M == null) return 0.5;
  const found = THEORY_SCALE_BANDS.find((candidate) => candidate.band === band);
  if (!found) return 0.5;
  return clamp01((scaleLog10M - found.minLog10M) / (found.maxLog10M - found.minLog10M));
}

function incomingLayoutEdges(graph: TheoryBadgeGraphV1): Map<string, TheoryBadgeEdgeV1[]> {
  const incoming = new Map<string, TheoryBadgeEdgeV1[]>();
  for (const edge of graph.edges) {
    if (!LAYOUT_EDGE_RELATIONS.has(edge.relation)) continue;
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  }
  return incoming;
}

function computeDepths(graph: TheoryBadgeGraphV1): Map<string, number> {
  const incoming = incomingLayoutEdges(graph);
  const badgeIds = new Set(graph.badges.map((badge: TheoryBadgeV1) => badge.id));
  const badgesById = new Map(graph.badges.map((badge: TheoryBadgeV1) => [badge.id, badge]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const depthFor = (badge: TheoryBadgeV1): number => {
    const cached = memo.get(badge.id);
    if (cached !== undefined) return cached;
    if (visiting.has(badge.id)) return LEVEL_DEPTH[badge.level];

    visiting.add(badge.id);
    const upstreamDepths = (incoming.get(badge.id) ?? [])
      .filter((edge: TheoryBadgeEdgeV1) => badgeIds.has(edge.from))
      .map((edge: TheoryBadgeEdgeV1) => {
        const upstream = badgesById.get(edge.from);
        return upstream ? depthFor(upstream) + 1 : LEVEL_DEPTH[badge.level];
      });
    visiting.delete(badge.id);

    const computed =
      upstreamDepths.length > 0
        ? Math.max(LEVEL_DEPTH[badge.level], ...upstreamDepths)
        : LEVEL_DEPTH[badge.level];
    memo.set(badge.id, computed);
    return computed;
  };

  for (const badge of graph.badges) depthFor(badge);
  return memo;
}

function semanticX(args: {
  scaleBand: TheoryBiomeBand;
  scaleLog10M: number | null;
  depth: number;
  seed: string;
  badgeId: string;
}): number {
  const base = X_OFFSET + bandIndex(args.scaleBand) * BAND_WIDTH;
  const within = bandScaleFraction(args.scaleBand, args.scaleLog10M) * (BAND_WIDTH * 0.54);
  const topologyDrift = Math.min(130, args.depth * 20);
  const jitter = (hash01(`${args.seed}:${args.badgeId}:x`) - 0.5) * JITTER_X;
  return Math.round(base + within + topologyDrift + jitter);
}

function semanticY(args: {
  domainKey: string;
  fidelity: TheoryBiomeFidelity;
  seed: string;
  badgeId: string;
}): number {
  const base = Y_OFFSET + domainIndex(args.domainKey) * DOMAIN_HEIGHT;
  const fidelityOffset = FIDELITY_OFFSET[args.fidelity];
  const jitter = (hash01(`${args.seed}:${args.badgeId}:y`) - 0.5) * JITTER_Y;
  return Math.round(base + fidelityOffset + jitter);
}

function chunkFor(x: number, y: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(x / CHUNK_SIZE),
    chunkY: Math.floor(y / CHUNK_SIZE),
  };
}

function hasReadableCollision(x: number, y: number, placed: Array<{ x: number; y: number }>): boolean {
  return placed.some((node) => Math.abs(node.x - x) < BADGE_STEP_X && Math.abs(node.y - y) < BADGE_STEP_Y);
}

function candidateOffsets(ring: number): Array<{ dx: number; dy: number }> {
  if (ring === 0) return [{ dx: 0, dy: 0 }];
  const offsets: Array<{ dx: number; dy: number }> = [];
  for (let dy = -ring; dy <= ring; dy += 1) {
    for (let dx = -ring; dx <= ring; dx += 1) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
      offsets.push({ dx, dy });
    }
  }
  return offsets.sort((a, b) => {
    const aScore = Math.abs(a.dx) * 1.25 + Math.abs(a.dy);
    const bScore = Math.abs(b.dx) * 1.25 + Math.abs(b.dy);
    return aScore - bScore || a.dy - b.dy || a.dx - b.dx;
  });
}

function resolveReadablePosition(args: {
  x: number;
  y: number;
  badgeId: string;
  seed: string;
  placed: Array<{ x: number; y: number }>;
}): { x: number; y: number; spacingAttempts: number } {
  const minX = 24;
  const minY = THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.labelReserveTopPx + 10;
  let attempts = 0;
  const direction = hash01(`${args.seed}:${args.badgeId}:spacing-direction`) > 0.5 ? 1 : -1;

  for (let ring = 0; ring <= 96; ring += 1) {
    const offsets = candidateOffsets(ring);
    for (const offset of offsets) {
      attempts += 1;
      const x = Math.max(minX, Math.round(args.x + offset.dx * BADGE_STEP_X * direction));
      const y = Math.max(minY, Math.round(args.y + offset.dy * BADGE_STEP_Y));
      if (!hasReadableCollision(x, y, args.placed)) {
        return { x, y, spacingAttempts: attempts - 1 };
      }
    }
  }

  const fallback = {
    x: Math.max(minX, args.x),
    y: Math.max(minY, args.y + args.placed.length * BADGE_STEP_Y),
  };
  return {
    ...fallback,
    spacingAttempts: attempts,
  };
}

function temperatureFor(scaleBand: TheoryBiomeBand, scaleLog10M: number | null): number {
  if (scaleBand === "claim_boundary") return 1;
  if (scaleLog10M != null) return clamp01((scaleLog10M + 35) / 58);
  return clamp01(bandIndex(scaleBand) / Math.max(1, THEORY_BIOME_BAND_ORDER.length - 1));
}

function claimPressureFor(badge: TheoryBadgeV1, scaleBand: TheoryBiomeBand): number {
  if (scaleBand === "claim_boundary" || badge.level === "claim_boundary") return 1;
  const boundary = badge.claimBoundary;
  const strict =
    Number(boundary.diagnosticOnly) +
    Number(!boundary.validationClaimAllowed) +
    Number(!boundary.physicalMechanismClaimAllowed) +
    Number(!boundary.promotionAllowed);
  return clamp01(strict / 5);
}

function edgePoints(
  from: TheoryAchievementLayoutNode,
  to: TheoryAchievementLayoutNode,
  relation: string,
): Array<{ x: number; y: number }> {
  const badgeHalf = 22;
  const start = { x: from.x + badgeHalf, y: from.y + badgeHalf };
  const end = { x: to.x + badgeHalf, y: to.y + badgeHalf };
  const dx = end.x - start.x;
  const crossScale = Math.abs((from.scaleLog10M ?? 0) - (to.scaleLog10M ?? 0)) > 8;
  const bend = crossScale ? Math.max(84, Math.min(260, Math.abs(dx) * 0.22)) : 0;
  const midX = start.x + Math.max(44, dx / 2);
  const midY = (start.y + end.y) / 2 - bend;
  if (relation === "blocks") {
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  }
  return [start, { x: midX, y: midY }, end];
}

function dominant<T extends string>(values: T[]): T {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function buildChunks(coordinates: TheoryBiomeCoordinateV1[]): TheoryBiomeChunkV1[] {
  const grouped = new Map<string, TheoryBiomeCoordinateV1[]>();
  for (const coordinate of coordinates) {
    const id = `${coordinate.chunkX}:${coordinate.chunkY}`;
    grouped.set(id, [...(grouped.get(id) ?? []), coordinate]);
  }

  return [...grouped.entries()]
    .map(([id, chunkCoordinates]): TheoryBiomeChunkV1 => {
      const chunkX = chunkCoordinates[0].chunkX;
      const chunkY = chunkCoordinates[0].chunkY;
      const averageClaimPressure =
        chunkCoordinates.reduce((sum, coordinate) => sum + coordinate.claimPressure, 0) / chunkCoordinates.length;
      const averageFidelity =
        chunkCoordinates.reduce((sum, coordinate) => sum + FIDELITY_VALUE[coordinate.fidelity], 0) /
        chunkCoordinates.length;
      return {
        id,
        chunkX,
        chunkY,
        lod: averageClaimPressure > 0.7 || chunkCoordinates.length > 8 ? 2 : 1,
        bounds: {
          x0: chunkX * CHUNK_SIZE,
          y0: chunkY * CHUNK_SIZE,
          x1: (chunkX + 1) * CHUNK_SIZE,
          y1: (chunkY + 1) * CHUNK_SIZE,
        },
        badgeIds: chunkCoordinates.map((coordinate) => coordinate.badgeId).sort(),
        dominantScaleBand: dominant(chunkCoordinates.map((coordinate) => coordinate.scaleBand)),
        dominantDomainKey: dominant(chunkCoordinates.map((coordinate) => coordinate.domainKey)),
        averageClaimPressure,
        averageFidelity,
      };
    })
    .sort((a, b) => a.chunkY - b.chunkY || a.chunkX - b.chunkX);
}

export function layoutTheoryBiomeMap(graph: TheoryBadgeGraphV1): TheoryBiomeAchievementLayout {
  const seed = `${graph.graphId}:theory-biome:v1`;
  const depths = computeDepths(graph);
  const placed: Array<{ x: number; y: number }> = [];

  const coordinates: TheoryBiomeCoordinateV1[] = graph.badges.map((badge: TheoryBadgeV1) => {
    const inferred = inferTheoryBiomeCoordinateSeed(badge);
    const depth = depths.get(badge.id) ?? LEVEL_DEPTH[badge.level];
    const baseX = semanticX({ ...inferred, depth, seed, badgeId: badge.id });
    const baseY = semanticY({ ...inferred, seed, badgeId: badge.id });
    const resolved = resolveReadablePosition({
      x: baseX,
      y: baseY,
      badgeId: badge.id,
      seed,
      placed,
    });
    placed.push({ x: resolved.x, y: resolved.y });

    const claimPressure = claimPressureFor(badge, inferred.scaleBand);
    const { chunkX, chunkY } = chunkFor(resolved.x, resolved.y);
    return {
      badgeId: badge.id,
      scaleLog10M: inferred.scaleLog10M,
      scaleBand: inferred.scaleBand,
      fidelity: inferred.fidelity,
      domainKey: inferred.domainKey,
      temperature: temperatureFor(inferred.scaleBand, inferred.scaleLog10M),
      moisture: FIDELITY_VALUE[inferred.fidelity],
      altitude: claimPressure,
      claimPressure,
      x: resolved.x,
      y: resolved.y,
      chunkX,
      chunkY,
      lod: claimPressure > 0.8 ? 3 : 2,
      reasons:
        resolved.spacingAttempts > 0
          ? [...inferred.reasons, `spacing:${resolved.spacingAttempts}`]
          : inferred.reasons,
    };
  });

  const coordinateByBadgeId = new Map(coordinates.map((coordinate) => [coordinate.badgeId, coordinate]));
  const nodes: TheoryAchievementLayoutNode[] = coordinates.map((coordinate) => ({
    badgeId: coordinate.badgeId,
    x: coordinate.x,
    y: coordinate.y,
    depth: depths.get(coordinate.badgeId) ?? 0,
    lane: domainIndex(coordinate.domainKey),
    scaleBand: coordinate.scaleBand,
    scaleLog10M: coordinate.scaleLog10M,
    domainKey: coordinate.domainKey,
    chunkX: coordinate.chunkX,
    chunkY: coordinate.chunkY,
    claimPressure: coordinate.claimPressure,
  }));

  const nodesById = new Map(nodes.map((node: TheoryAchievementLayoutNode) => [node.badgeId, node]));
  const edges = graph.edges
    .map((edge: TheoryBadgeEdgeV1): TheoryAchievementLayoutEdge | null => {
      const from = nodesById.get(edge.from);
      const to = nodesById.get(edge.to);
      if (!from || !to) return null;
      const fromCoord = coordinateByBadgeId.get(edge.from);
      const toCoord = coordinateByBadgeId.get(edge.to);
      const scaleDelta =
        fromCoord?.scaleLog10M != null && toCoord?.scaleLog10M != null
          ? Math.abs(fromCoord.scaleLog10M - toCoord.scaleLog10M)
          : Math.abs(bandIndex(from.scaleBand ?? "abstract_formal") - bandIndex(to.scaleBand ?? "abstract_formal"));
      return {
        edgeId: edge.id,
        from: edge.from,
        to: edge.to,
        relation: edge.relation,
        points: edgePoints(from, to, edge.relation),
        scaleDistanceKind:
          from.scaleBand === to.scaleBand ? "same_biome" : scaleDelta > 8 ? "cross_scale" : "neighbor_biome",
      };
    })
    .filter((edge: TheoryAchievementLayoutEdge | null): edge is TheoryAchievementLayoutEdge => Boolean(edge));

  const chunks = buildChunks(coordinates);
  const maxX = Math.max(...coordinates.map((coordinate) => coordinate.x), X_OFFSET);
  const maxY = Math.max(...coordinates.map((coordinate) => coordinate.y), Y_OFFSET);
  const width = Math.max(maxX + X_OFFSET + BAND_WIDTH, THEORY_BIOME_BAND_ORDER.length * BAND_WIDTH + X_OFFSET * 2);
  const height = Math.max(maxY + Y_OFFSET + 180, THEORY_BIOME_DOMAIN_ORDER.length * DOMAIN_HEIGHT + Y_OFFSET);

  return {
    width,
    height,
    nodes,
    edges,
    biome: {
      schemaVersion: THEORY_BIOME_LAYOUT_SCHEMA_VERSION,
      graphId: graph.graphId,
      seed,
      width,
      height,
      coordinates: coordinates.sort((a, b) => a.badgeId.localeCompare(b.badgeId)),
      chunks,
    },
  };
}
