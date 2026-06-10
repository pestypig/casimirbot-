import React, { useEffect, useMemo, useRef } from "react";
import type {
  TheoryBadgeEquationV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "@shared/contracts/theory-badge-graph.v1";
import type { ProbabilityTerrainV1 } from "@shared/contracts/probability-terrain.v1";
import type { PhysicsAtlasBlockId, PhysicsAtlasBlockV1 } from "@shared/contracts/physics-atlas.v1";
import type { TheoryBiomeBand, TheoryBiomeChunkV1 } from "@shared/contracts/theory-biome-layout.v1";
import { THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1 } from "@shared/contracts/theory-biome-layout.v1";
import { THEORY_BIOME_BAND_ORDER } from "@shared/theory/theory-biome-scale-taxonomy";
import { PHYSICS_ATLAS_BLOCKS } from "@shared/theory/physics-atlas-blocks";
import ProbabilityTerrainOverlay from "@/components/graphs/ProbabilityTerrainOverlay";
import {
  layoutTheoryAchievementMap,
  type TheoryAchievementLayoutEdge,
  type TheoryAchievementLayoutNode,
} from "@/lib/theory/theoryAchievementLayout";
import { biomeNoise2D } from "@/lib/theory/theoryBiomeField";

type TheoryAchievementMapProps = {
  graph: TheoryBadgeGraphV1;
  selectedBadgeId: string | null;
  selectedBadgeIds: string[];
  highlightedBadgeIds: string[];
  highlightedEdgeIds: string[];
  exactBadgeIds: string[];
  likelyBadgeIds: string[];
  softRegions: Array<{
    id: string;
    label: string;
    badgeIds: string[];
    confidence: number;
    tone: "green";
    meaning: "discussion_context_not_proof";
  }>;
  playbackBadgeIds: string[];
  solvedBadgeIds: string[];
  failedBadgeIds: string[];
  rippleBadgeIds: string[];
  heatByBadgeId: Record<string, number>;
  probabilityTerrain?: ProbabilityTerrainV1;
  routeBadgeLabels?: Record<string, {
    label: string;
    tone: "cyan" | "emerald" | "amber" | "rose" | "slate";
    title: string;
  }>;
  activeAtlasLensId: PhysicsAtlasBlockId | null;
  onSelectBadge: (badgeId: string) => void;
  onToggleBadgeSelection: (badgeId: string) => void;
  onClearSelection: () => void;
  onRunPath: (badgeId: string) => void;
  onLoadCalculatorPayload: (badgeId: string, payloadId: string) => void;
  viewport: {
    scrollLeft: number;
    scrollTop: number;
  };
  onViewportChange: (viewport: { scrollLeft: number; scrollTop: number }) => void;
};

const ATLAS_GLOW_COLORS: Record<PhysicsAtlasBlockId, string> = {
  stellar_evolution: "rgba(192, 38, 211, 0.72)",
  astrochemistry_prebiotic: "rgba(77, 124, 15, 0.72)",
  cosmic_distance_ladder: "rgba(217, 119, 6, 0.72)",
  solar_surface_spectrum: "rgba(234, 179, 8, 0.76)",
  casimir_cavity_modes: "rgba(6, 182, 212, 0.72)",
  warp_gr_nhm2: "rgba(124, 58, 237, 0.72)",
  nhm2_full_solve: "rgba(79, 70, 229, 0.72)",
  qei_stress_energy: "rgba(148, 163, 184, 0.72)",
  tokamak_plasma: "rgba(249, 115, 22, 0.72)",
  galactic_dynamics: "rgba(14, 165, 233, 0.72)",
  curvature_collapse: "rgba(16, 185, 129, 0.72)",
};

const BAND_LABELS: Record<TheoryBiomeBand, string> = {
  abstract_formal: "Formal",
  planck_quantum: "Quantum",
  nuclear: "Nuclear",
  atomic: "Atomic",
  molecular: "Molecular",
  cellular_biophysical: "Biophysical",
  device_laboratory: "Device / Lab",
  human_engineering: "Engineering",
  planetary: "Planetary",
  stellar: "Stellar",
  galactic_cosmic: "Galactic",
  claim_boundary: "Boundary",
};

const BAND_COLORS: Record<TheoryBiomeBand, string> = {
  abstract_formal: "rgba(71, 85, 105, 0.42)",
  planck_quantum: "rgba(30, 64, 175, 0.42)",
  nuclear: "rgba(37, 99, 235, 0.36)",
  atomic: "rgba(8, 145, 178, 0.36)",
  molecular: "rgba(22, 101, 52, 0.38)",
  cellular_biophysical: "rgba(77, 124, 15, 0.38)",
  device_laboratory: "rgba(202, 138, 4, 0.34)",
  human_engineering: "rgba(124, 58, 237, 0.36)",
  planetary: "rgba(14, 116, 144, 0.34)",
  stellar: "rgba(194, 65, 12, 0.34)",
  galactic_cosmic: "rgba(88, 28, 135, 0.42)",
  claim_boundary: "rgba(127, 29, 29, 0.46)",
};

const BIOME_BAND_WIDTH = THEORY_BIOME_LAYOUT_SPACING_CONTRACT_V1.scaleBandWidthPx;
const BIOME_X_OFFSET = 92;

function chunkFill(chunk: TheoryBiomeChunkV1, seed: string): string {
  const base = BAND_COLORS[chunk.dominantScaleBand];
  const noise = biomeNoise2D(seed, chunk.chunkX * 0.65, chunk.chunkY * 0.65, 3);
  const alphaBoost = Math.min(0.2, chunk.averageClaimPressure * 0.16 + noise * 0.08);
  return base.replace(/0\.\d+\)$/, `${(0.22 + alphaBoost).toFixed(2)})`);
}

function badgeAtlasBlockId(badge: TheoryBadgeV1): PhysicsAtlasBlockId | null {
  const direct = PHYSICS_ATLAS_BLOCKS.find((block: PhysicsAtlasBlockV1) =>
    block.primaryBadgeIds.includes(badge.id) || block.claimBoundaryBadgeIds.includes(badge.id),
  );
  if (direct) return direct.id;
  const badgeTokens = new Set([
    ...badge.subjects,
    ...badge.tags,
    ...badge.simulationOwners,
    ...badge.equationFamilies,
    ...badge.hintKeys.subjects,
    ...badge.hintKeys.simulationOwners,
    ...badge.hintKeys.equationFamilies,
  ]);
  return (
    PHYSICS_ATLAS_BLOCKS.find((block: PhysicsAtlasBlockV1) =>
      [...block.subjects, ...block.simulationOwners, ...block.equationFamilies].some((token) => badgeTokens.has(token)),
    )?.id ?? null
  );
}

function badgeGlyph(badge: TheoryBadgeV1): string {
  if (badge.subjects.includes("uncertainty")) return "u";
  if (badge.subjects.includes("curvature") || badge.subjects.includes("collapse")) return "K";
  if (badge.subjects.includes("galactic") || badge.subjects.includes("rotation_curve")) return "◎";
  if (badge.subjects.includes("relative_velocity")) return "v";
  if (badge.id.includes("halpha") || badge.subjects.includes("halpha")) return "Hα";
  if (badge.subjects.includes("zeeman") || badge.subjects.includes("magnetism") || badge.id.includes("zeeman")) return "B";
  if (badge.subjects.includes("doppler") || badge.subjects.includes("redshift")) return "z";
  if (badge.subjects.includes("spectrum") || badge.subjects.includes("wavelength") || badge.subjects.includes("radiation")) return "λ";
  if (badge.subjects.includes("solar")) return "☀";
  if (badge.subjects.includes("quantum")) return "h";
  if (badge.subjects.includes("relativity")) return "c";
  if (badge.subjects.includes("energy")) return "E";
  if (badge.subjects.includes("stress_energy")) return "T";
  if (badge.subjects.includes("general_relativity")) return "G";
  if (badge.subjects.includes("qei")) return "Q";
  if (badge.subjects.includes("starsim")) return "*";
  if (badge.subjects.includes("cosmic_distance")) return "z";
  if (badge.subjects.includes("nhm2")) return "N";
  if (badge.level === "claim_boundary") return "!";
  return "S";
}

function toPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return [`M ${first.x} ${first.y}`, ...rest.map((point: { x: number; y: number }) => `L ${point.x} ${point.y}`)].join(" ");
}

function primaryExpression(badge: TheoryBadgeV1): string | null {
  return (
    badge.calculatorPayloads[0]?.displayLatex ??
    badge.equations.find((equation: TheoryBadgeEquationV1) => Boolean(equation.displayLatex))?.displayLatex ??
    null
  );
}

function edgeClass(edge: TheoryAchievementLayoutEdge, highlightedEdgeIds: Set<string>, hasFocus: boolean): string {
  const highlighted = highlightedEdgeIds.has(edge.edgeId);
  const base = highlighted ? "stroke-cyan-200 opacity-100" : "stroke-zinc-400 opacity-70";
  const ghost = hasFocus && !highlighted ? " opacity-25" : "";
  return `${base}${ghost}`;
}

function isContextEdge(edge: TheoryAchievementLayoutEdge): boolean {
  return edge.relation === "shares_units" || edge.relation === "documents" || edge.relation === "blocks";
}

function edgeDashArray(edge: TheoryAchievementLayoutEdge): string | undefined {
  if (edge.relation === "blocks") return "4 5";
  if (edge.scaleDistanceKind === "cross_scale") return "9 8";
  if (isContextEdge(edge)) return "5 7";
  return undefined;
}

function badgeClass(args: {
  selected: boolean;
  multiSelected: boolean;
  highlighted: boolean;
  playback: boolean;
  solved: boolean;
  failed: boolean;
  hasFocus: boolean;
  loadable: boolean;
  foundation: boolean;
  claimBoundary: boolean;
  plannedDomain: boolean;
  routeBlocked: boolean;
  exactDiscussion: boolean;
  likelyDiscussion: boolean;
}) {
  const classes = [
    "absolute flex h-11 w-11 items-center justify-center border-2 text-[13px] font-black uppercase shadow transition",
    "focus:outline-none focus:ring-2 focus:ring-cyan-200",
    args.loadable
      ? "border-zinc-200 bg-gradient-to-br from-zinc-100 via-zinc-400 to-zinc-700 text-zinc-950"
      : "border-zinc-300 bg-gradient-to-br from-zinc-200 via-zinc-500 to-zinc-800 text-zinc-950",
  ];
  if (args.selected || args.multiSelected) classes.push("ring-4 ring-cyan-200/80 shadow-cyan-200/50");
  else if (args.failed) classes.push("ring-4 ring-rose-400/75 shadow-rose-500/40");
  else if (args.solved) classes.push("ring-4 ring-emerald-300/75 shadow-emerald-500/40");
  else if (args.playback) classes.push("ring-2 ring-cyan-500/70 shadow-cyan-900/40");
  if (args.highlighted) classes.push("ring-2 ring-cyan-400/70");
  if (args.foundation) classes.push("shadow-[0_0_16px_rgba(148,163,184,0.28)]");
  if (args.claimBoundary) classes.push("border-amber-300 bg-gradient-to-br from-amber-100 via-zinc-400 to-rose-900");
  if (args.routeBlocked) classes.push("ring-4 ring-rose-500/80 shadow-rose-500/40");
  if (!args.claimBoundary && args.exactDiscussion) {
    classes.push("ring-4 ring-emerald-300/90 shadow-emerald-300/50");
  } else if (!args.claimBoundary && args.likelyDiscussion) {
    classes.push("ring-2 ring-emerald-400/70 shadow-emerald-500/30");
  }
  if (args.plannedDomain) classes.push("opacity-55 saturate-50");
  if (args.hasFocus && !args.highlighted && !args.multiSelected) classes.push("opacity-30 grayscale");
  return classes.join(" ");
}

function softRegionGeometry(
  region: TheoryAchievementMapProps["softRegions"][number],
  nodesById: Map<string, TheoryAchievementLayoutNode>,
) {
  const centers = region.badgeIds
    .map((badgeId) => nodesById.get(badgeId))
    .filter((node): node is TheoryAchievementLayoutNode => Boolean(node))
    .map((node) => ({ x: node.x + 22, y: node.y + 22 }));
  if (centers.length === 0) return null;

  if (centers.length === 1) {
    const [center] = centers;
    return {
      cx: center.x,
      cy: center.y,
      rx: 88,
      ry: 88,
      labelX: center.x - 78,
      labelY: center.y - 92,
    };
  }

  const xs = centers.map((center) => center.x);
  const ys = centers.map((center) => center.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = 88;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = Math.max(88, (maxX - minX) / 2 + padding);
  const ry = Math.max(88, (maxY - minY) / 2 + padding);
  return {
    cx,
    cy,
    rx,
    ry,
    labelX: cx - rx + 14,
    labelY: cy - ry - 10,
  };
}

export default function TheoryAchievementMap({
  graph,
  selectedBadgeId,
  selectedBadgeIds,
  highlightedBadgeIds,
  highlightedEdgeIds,
  exactBadgeIds,
  likelyBadgeIds,
  softRegions,
  playbackBadgeIds,
  solvedBadgeIds,
  failedBadgeIds,
  rippleBadgeIds,
  heatByBadgeId,
  probabilityTerrain,
  routeBadgeLabels = {},
  activeAtlasLensId,
  onSelectBadge,
  onToggleBadgeSelection,
  onClearSelection,
  onRunPath,
  onLoadCalculatorPayload,
  viewport,
  onViewportChange,
}: TheoryAchievementMapProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const restoredRef = useRef(false);
  const layout = useMemo(() => layoutTheoryAchievementMap(graph), [graph]);
  const nodesById = useMemo(
    () => new Map<string, TheoryAchievementLayoutNode>(layout.nodes.map((node) => [node.badgeId, node])),
    [layout.nodes],
  );
  const badgesById = useMemo(
    () => new Map<string, TheoryBadgeV1>(graph.badges.map((badge: TheoryBadgeV1) => [badge.id, badge])),
    [graph.badges],
  );
  const selectedSet = new Set(selectedBadgeIds);
  const highlightedSet = new Set(highlightedBadgeIds);
  const edgeHighlightSet = new Set(highlightedEdgeIds);
  const exactBadgeSet = new Set(exactBadgeIds);
  const likelyBadgeSet = new Set(likelyBadgeIds);
  const playbackSet = new Set(playbackBadgeIds);
  const solvedSet = new Set(solvedBadgeIds);
  const failedSet = new Set(failedBadgeIds);
  const rippleSet = new Set(rippleBadgeIds);
  const hasFocus = highlightedSet.size > 0 || selectedSet.size > 1;
  const activeAtlasBlock = activeAtlasLensId
    ? PHYSICS_ATLAS_BLOCKS.find((block: PhysicsAtlasBlockV1) => block.id === activeAtlasLensId) ?? null
    : null;
  const activeAtlasGlow = activeAtlasLensId ? ATLAS_GLOW_COLORS[activeAtlasLensId] : null;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || restoredRef.current) return;
    element.scrollLeft = viewport.scrollLeft;
    element.scrollTop = viewport.scrollTop;
    restoredRef.current = true;
  }, [layout.height, layout.width, viewport.scrollLeft, viewport.scrollTop]);

  return (
    <div
      ref={viewportRef}
      data-testid="theory-achievement-map-scrollport"
      className="relative h-full min-h-0 w-full overflow-scroll border border-zinc-950 bg-zinc-900"
      style={{ scrollbarGutter: "stable both-edges" }}
      onScroll={(event: React.UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        onViewportChange({
          scrollLeft: element.scrollLeft,
          scrollTop: element.scrollTop,
        });
      }}
    >
      <div
        className="relative"
        onClick={(event: React.MouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget) onClearSelection();
        }}
        style={{
          width: layout.width,
          height: layout.height,
          backgroundColor: "#111827",
        }}
      >
        {layout.biome ? (
          <svg
            className="pointer-events-none absolute inset-0"
            data-testid="theory-biome-terrain"
            width={layout.width}
            height={layout.height}
          >
            <defs>
              <linearGradient id="theory-biome-scale-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="15%" stopColor="#1d4ed8" />
                <stop offset="36%" stopColor="#166534" />
                <stop offset="55%" stopColor="#a16207" />
                <stop offset="75%" stopColor="#c2410c" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
              <pattern id="theory-biome-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={layout.width} height={layout.height} fill="url(#theory-biome-scale-gradient)" opacity={0.24} />
            {THEORY_BIOME_BAND_ORDER.map((band: TheoryBiomeBand, index: number) => {
              const x = BIOME_X_OFFSET + index * BIOME_BAND_WIDTH;
              return (
                <g key={band}>
                  <rect
                    x={x}
                    y={0}
                    width={BIOME_BAND_WIDTH}
                    height={layout.height}
                    fill={BAND_COLORS[band]}
                    opacity={band === "claim_boundary" ? 0.48 : 0.32}
                  />
                  <line x1={x} x2={x} y1={0} y2={layout.height} stroke="rgba(255,255,255,0.09)" />
                  <text
                    x={x + 18}
                    y={28}
                    fill="rgba(241,245,249,0.78)"
                    fontSize={12}
                    fontWeight={800}
                    letterSpacing={0}
                  >
                    {BAND_LABELS[band]}
                  </text>
                </g>
              );
            })}
            {layout.biome.chunks.map((chunk: TheoryBiomeChunkV1) => {
              const width = chunk.bounds.x1 - chunk.bounds.x0;
              const height = chunk.bounds.y1 - chunk.bounds.y0;
              return (
                <g key={chunk.id}>
                  <rect
                    x={chunk.bounds.x0}
                    y={chunk.bounds.y0}
                    width={width}
                    height={height}
                    fill={chunkFill(chunk, layout.biome?.seed ?? "theory-biome")}
                    stroke={chunk.averageClaimPressure > 0.7 ? "rgba(251,191,36,0.32)" : "rgba(255,255,255,0.07)"}
                    strokeWidth={chunk.averageClaimPressure > 0.7 ? 2 : 1}
                    strokeDasharray={chunk.averageClaimPressure > 0.7 ? "10 7" : undefined}
                  />
                  {chunk.badgeIds.length > 3 ? (
                    <text
                      x={chunk.bounds.x0 + 14}
                      y={chunk.bounds.y0 + 26}
                      fill="rgba(226,232,240,0.5)"
                      fontSize={11}
                      fontWeight={700}
                      letterSpacing={0}
                    >
                      {chunk.dominantDomainKey} / {chunk.badgeIds.length}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <rect width={layout.width} height={layout.height} fill="url(#theory-biome-grid)" opacity={0.74} />
          </svg>
        ) : null}
        <ProbabilityTerrainOverlay
          terrain={probabilityTerrain}
          nodes={layout.nodes.map((node: TheoryAchievementLayoutNode) => ({
            id: node.badgeId,
            x: node.x,
            y: node.y,
            width: 44,
            height: 44,
            renderChunkId: node.renderChunkId,
            semanticChunkId: node.semanticChunkId,
          }))}
          chunks={
            layout.biome?.chunks.map((chunk: TheoryBiomeChunkV1) => ({
              id: chunk.id,
              bounds: chunk.bounds,
            })) ?? []
          }
          width={layout.width}
          height={layout.height}
          seed={layout.biome?.seed ?? graph.graphId}
          testId="theory-probability-terrain-field"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_50%_82%,rgba(0,0,0,0.48),transparent_42%)]" />
        <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height}>
          <defs>
            <marker id="theory-achievement-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill="rgb(161 161 170)" />
            </marker>
          </defs>
          {softRegions.map((region) => {
            const geometry = softRegionGeometry(region, nodesById);
            if (!geometry) return null;
            const alpha = Math.max(0.12, Math.min(0.22, 0.12 + region.confidence * 0.1));
            return (
              <g
                key={region.id}
                data-testid="discussion-soft-region"
                aria-label="Discussion context zone, not proof"
              >
                <title>Discussion context zone, not proof</title>
                <ellipse
                  cx={geometry.cx}
                  cy={geometry.cy}
                  rx={geometry.rx}
                  ry={geometry.ry}
                  fill={`rgba(22, 163, 74, ${alpha})`}
                  stroke="rgba(74, 222, 128, 0.45)"
                  strokeWidth={2}
                  strokeDasharray="10 8"
                />
                <text
                  x={geometry.labelX}
                  y={geometry.labelY}
                  fill="rgba(187, 247, 208, 0.86)"
                  fontSize={12}
                  fontWeight={700}
                  letterSpacing={0}
                >
                  {region.label}
                </text>
              </g>
            );
          })}
          {layout.edges.map((edge: TheoryAchievementLayoutEdge) => (
            <path
              key={edge.edgeId}
              d={toPath(edge.points)}
              className={edgeClass(edge, edgeHighlightSet, hasFocus)}
              strokeWidth={edgeHighlightSet.has(edge.edgeId) ? 3 : 2}
              strokeDasharray={edgeDashArray(edge)}
              fill="none"
              strokeLinecap="square"
              strokeLinejoin="miter"
              markerEnd={isContextEdge(edge) ? undefined : "url(#theory-achievement-arrow)"}
            />
          ))}
        </svg>
        {layout.nodes.map((node: TheoryAchievementLayoutNode) => {
          const badge = badgesById.get(node.badgeId);
          if (!badge) return null;
          const expression = primaryExpression(badge);
          const routeLabel = routeBadgeLabels[node.badgeId] ?? null;
          const titleParts = [
            badge.title,
            expression,
            routeLabel ? `${routeLabel.label}: ${routeLabel.title}` : null,
          ].filter(Boolean);
          const title = titleParts.join("\n");
          const heat = heatByBadgeId[node.badgeId] ?? 0;
          const ripple = rippleSet.has(node.badgeId);
          const badgeBlockId = badgeAtlasBlockId(badge);
          const foundation = badge.level === "first_principle" || badge.subjects.includes("constants");
          const claimBoundary = badge.level === "claim_boundary";
          const atlasHighlighted = highlightedSet.has(node.badgeId) && Boolean(activeAtlasGlow);
          const plannedDomain = Boolean(
            activeAtlasBlock?.status === "planned" && badgeBlockId === activeAtlasBlock.id,
          );
          const glowShadow = [
            heat > 0
              ? `0 0 ${Math.round(12 + heat * 18)}px rgba(34, 211, 238, ${Math.min(0.72, 0.22 + heat * 0.5)})`
              : null,
            atlasHighlighted && activeAtlasGlow ? `0 0 24px ${activeAtlasGlow}` : null,
            foundation ? "0 0 14px rgba(226,232,240,0.22)" : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <button
              key={node.badgeId}
              type="button"
              className={badgeClass({
                selected: selectedBadgeId === node.badgeId,
                multiSelected: selectedSet.has(node.badgeId),
                highlighted: highlightedSet.has(node.badgeId),
                playback: playbackSet.has(node.badgeId),
                solved: solvedSet.has(node.badgeId),
                failed: failedSet.has(node.badgeId),
                hasFocus,
                loadable: badge.calculatorPayloads.length > 0,
                foundation,
                claimBoundary,
                plannedDomain,
                routeBlocked: routeLabel?.tone === "rose",
                exactDiscussion: exactBadgeSet.has(node.badgeId),
                likelyDiscussion: !exactBadgeSet.has(node.badgeId) && likelyBadgeSet.has(node.badgeId),
              })}
              data-discussion-match={
                exactBadgeSet.has(node.badgeId)
                  ? "exact"
                  : likelyBadgeSet.has(node.badgeId)
                    ? "likely"
                    : undefined
              }
              style={{
                left: node.x,
                top: node.y,
                boxShadow: glowShadow || undefined,
              }}
              title={title}
              aria-label={badge.title}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                if (event.ctrlKey || event.metaKey || event.altKey) {
                  onToggleBadgeSelection(node.badgeId);
                } else {
                  onSelectBadge(node.badgeId);
                  const payload = badge.calculatorPayloads[0];
                  if (payload) onLoadCalculatorPayload(node.badgeId, payload.id);
                }
              }}
              onDoubleClick={() => onRunPath(node.badgeId)}
            >
              <span className="flex h-7 w-7 items-center justify-center border border-zinc-700 bg-zinc-300 shadow-inner">
                {badgeGlyph(badge)}
              </span>
              {badge.calculatorPayloads.length > 0 ? (
                <span className="absolute -right-1 -top-1 h-3 w-3 border border-cyan-100 bg-cyan-400" />
              ) : null}
              {ripple ? (
                <span className="pointer-events-none absolute -inset-2 border border-cyan-200/80" />
              ) : null}
              {foundation ? (
                <span className="pointer-events-none absolute -inset-1 border border-zinc-100/30" />
              ) : null}
              {claimBoundary ? (
                <span className="pointer-events-none absolute -inset-1.5 border-2 border-amber-300/80" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
