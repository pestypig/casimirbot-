import React, { useMemo } from "react";
import type { ProbabilityTerrainV1 } from "@shared/contracts/probability-terrain.v1";
import { probabilityTerrainNoise2D } from "@/lib/probability/probabilityTerrainField";

export type ProbabilityTerrainOverlayNode = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  renderChunkId?: string | null;
  semanticChunkId?: string | null;
};

export type ProbabilityTerrainOverlayChunk = {
  id: string;
  bounds: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
};

type ProbabilityTerrainOverlayProps = {
  terrain: ProbabilityTerrainV1 | null | undefined;
  nodes: ProbabilityTerrainOverlayNode[];
  chunks?: ProbabilityTerrainOverlayChunk[];
  width: number;
  height: number;
  seed: string;
  testId?: string;
};

type TerrainNode = ProbabilityTerrainOverlayNode & {
  probability: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function center(node: ProbabilityTerrainOverlayNode): { x: number; y: number } {
  return {
    x: node.x + (node.width ?? 44) / 2,
    y: node.y + (node.height ?? 44) / 2,
  };
}

function uncertaintySpread(terrain: ProbabilityTerrainV1): number {
  const entropyRatio =
    terrain.priorEntropyBits > 0 ? clamp01(terrain.posteriorEntropyBits / terrain.priorEntropyBits) : 0;
  const base =
    terrain.uncertaintyMode === "focused"
      ? 70
      : terrain.uncertaintyMode === "ambiguous"
        ? 112
        : 156;
  return base + entropyRatio * 64;
}

function graphTone(terrain: ProbabilityTerrainV1): {
  fill: string;
  stroke: string;
  contour: string;
} {
  if (terrain.graphKind === "zen_badge_graph") {
    return {
      fill: "rgba(45, 212, 191, 0.22)",
      stroke: "rgba(125, 211, 252, 0.52)",
      contour: "rgba(134, 239, 172, 0.22)",
    };
  }
  if (terrain.graphKind === "theory_badge_graph") {
    return {
      fill: "rgba(34, 211, 238, 0.2)",
      stroke: "rgba(103, 232, 249, 0.56)",
      contour: "rgba(251, 191, 36, 0.18)",
    };
  }
  return {
    fill: "rgba(148, 163, 184, 0.2)",
    stroke: "rgba(203, 213, 225, 0.48)",
    contour: "rgba(148, 163, 184, 0.18)",
  };
}

function probabilityForNode(terrain: ProbabilityTerrainV1, node: ProbabilityTerrainOverlayNode): number {
  const direct = terrain.candidateProbabilityById[node.id] ?? 0;
  const renderChunk = node.renderChunkId ? terrain.renderChunkProbabilityById[node.renderChunkId] ?? 0 : 0;
  const semanticChunk = node.semanticChunkId ? terrain.semanticChunkProbabilityById[node.semanticChunkId] ?? 0 : 0;
  return Math.max(direct, renderChunk * 0.42, semanticChunk * 0.34);
}

function chunkProbability(terrain: ProbabilityTerrainV1, chunk: ProbabilityTerrainOverlayChunk): number {
  return terrain.renderChunkProbabilityById[chunk.id] ?? terrain.semanticChunkProbabilityById[chunk.id] ?? 0;
}

function topNodes(terrain: ProbabilityTerrainV1, nodes: ProbabilityTerrainOverlayNode[]): TerrainNode[] {
  return nodes
    .map((node) => ({ ...node, probability: probabilityForNode(terrain, node) }))
    .filter((node) => node.probability > 0)
    .sort((left, right) => right.probability - left.probability || left.id.localeCompare(right.id))
    .slice(0, 28);
}

export default function ProbabilityTerrainOverlay({
  terrain,
  nodes,
  chunks = [],
  width,
  height,
  seed,
  testId = "probability-terrain-field",
}: ProbabilityTerrainOverlayProps) {
  const tone = terrain ? graphTone(terrain) : null;
  const activeNodes = useMemo(() => (terrain ? topNodes(terrain, nodes) : []), [nodes, terrain]);

  if (!terrain || !tone || activeNodes.length === 0) return null;

  const spread = uncertaintySpread(terrain);
  const posteriorRatio =
    terrain.priorEntropyBits > 0 ? clamp01(terrain.posteriorEntropyBits / terrain.priorEntropyBits) : 0;
  const contourOpacity = 0.1 + posteriorRatio * 0.16;
  const terrainSeed = `${seed}:${terrain.graphKind}:${terrain.dominantSemanticChunkId ?? "terrain"}`;

  return (
    <svg
      aria-label="Probability terrain overlay"
      className="pointer-events-none absolute inset-0"
      data-testid={testId}
      width={width}
      height={height}
    >
      <defs>
        <filter id={`${testId}-blur`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      {chunks
        .map((chunk) => ({ chunk, probability: chunkProbability(terrain, chunk) }))
        .filter((entry) => entry.probability > 0)
        .slice(0, 16)
        .map(({ chunk, probability }) => {
          const noise = probabilityTerrainNoise2D(terrainSeed, chunk.bounds.x0 / 420, chunk.bounds.y0 / 420, 3);
          return (
            <rect
              key={chunk.id}
              x={chunk.bounds.x0}
              y={chunk.bounds.y0}
              width={chunk.bounds.x1 - chunk.bounds.x0}
              height={chunk.bounds.y1 - chunk.bounds.y0}
              fill={tone.contour}
              opacity={Math.min(0.34, 0.08 + probability * 0.24 + noise * 0.06)}
              stroke={tone.stroke}
              strokeOpacity={Math.min(0.42, 0.12 + probability * 0.22)}
              strokeDasharray="12 10"
            />
          );
        })}
      {activeNodes.map((node, index) => {
        const nodeCenter = center(node);
        const noise = probabilityTerrainNoise2D(terrainSeed, nodeCenter.x / 260, nodeCenter.y / 260, 4);
        const jitterX = (noise - 0.5) * 38;
        const jitterY = (probabilityTerrainNoise2D(`${terrainSeed}:y`, nodeCenter.x / 260, nodeCenter.y / 260, 4) - 0.5) * 38;
        const radius = spread * (0.62 + node.probability * 1.25 + noise * 0.34);
        const outerOpacity = Math.min(0.34, 0.08 + node.probability * 0.26);
        const innerOpacity = Math.min(0.42, 0.1 + node.probability * 0.36);
        return (
          <g key={`${node.id}:${index}`} data-testid="probability-terrain-contour">
            <ellipse
              cx={nodeCenter.x + jitterX}
              cy={nodeCenter.y + jitterY}
              rx={radius * 1.18}
              ry={radius * (0.74 + noise * 0.34)}
              fill={tone.fill}
              opacity={outerOpacity}
              filter={`url(#${testId}-blur)`}
            />
            <ellipse
              cx={nodeCenter.x}
              cy={nodeCenter.y}
              rx={radius * 0.54}
              ry={radius * 0.34}
              fill="none"
              stroke={tone.stroke}
              strokeOpacity={innerOpacity}
              strokeWidth={2}
              strokeDasharray={terrain.uncertaintyMode === "focused" ? undefined : "10 8"}
            />
          </g>
        );
      })}
      <text
        x={18}
        y={height - 18}
        fill="rgba(226,232,240,0.48)"
        fontSize={11}
        fontWeight={700}
        letterSpacing={0}
      >
        placement probability terrain / {terrain.uncertaintyMode} / H={terrain.posteriorEntropyBits.toFixed(2)} bits
      </text>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        opacity={contourOpacity}
      />
    </svg>
  );
}
