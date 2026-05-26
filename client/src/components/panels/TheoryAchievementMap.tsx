import React, { useEffect, useMemo, useRef } from "react";
import type {
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "@shared/contracts/theory-badge-graph.v1";
import {
  layoutTheoryAchievementMap,
  type TheoryAchievementLayoutEdge,
  type TheoryAchievementLayoutNode,
} from "@/lib/theory/theoryAchievementLayout";

type TheoryAchievementMapProps = {
  graph: TheoryBadgeGraphV1;
  selectedBadgeId: string | null;
  selectedBadgeIds: string[];
  highlightedBadgeIds: string[];
  highlightedEdgeIds: string[];
  playbackBadgeIds: string[];
  solvedBadgeIds: string[];
  failedBadgeIds: string[];
  rippleBadgeIds: string[];
  heatByBadgeId: Record<string, number>;
  onSelectBadge: (badgeId: string) => void;
  onToggleBadgeSelection: (badgeId: string) => void;
  onRunPath: (badgeId: string) => void;
  onLoadCalculatorPayload: (badgeId: string, payloadId: string) => void;
  viewport: {
    scrollLeft: number;
    scrollTop: number;
  };
  onViewportChange: (viewport: { scrollLeft: number; scrollTop: number }) => void;
};

function badgeGlyph(badge: TheoryBadgeV1): string {
  if (badge.subjects.includes("quantum")) return "h";
  if (badge.subjects.includes("relativity")) return "c";
  if (badge.subjects.includes("energy")) return "E";
  if (badge.subjects.includes("stress_energy")) return "T";
  if (badge.subjects.includes("general_relativity")) return "G";
  if (badge.subjects.includes("qei")) return "Q";
  if (badge.subjects.includes("nhm2")) return "N";
  if (badge.level === "claim_boundary") return "!";
  return "S";
}

function toPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return [`M ${first.x} ${first.y}`, ...rest.map((point) => `L ${point.x} ${point.y}`)].join(" ");
}

function primaryExpression(badge: TheoryBadgeV1): string | null {
  return (
    badge.calculatorPayloads[0]?.displayLatex ??
    badge.equations.find((equation) => Boolean(equation.displayLatex))?.displayLatex ??
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

function badgeClass(args: {
  selected: boolean;
  multiSelected: boolean;
  highlighted: boolean;
  playback: boolean;
  solved: boolean;
  failed: boolean;
  hasFocus: boolean;
  loadable: boolean;
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
  if (args.hasFocus && !args.highlighted && !args.multiSelected) classes.push("opacity-30 grayscale");
  return classes.join(" ");
}

export default function TheoryAchievementMap({
  graph,
  selectedBadgeId,
  selectedBadgeIds,
  highlightedBadgeIds,
  highlightedEdgeIds,
  playbackBadgeIds,
  solvedBadgeIds,
  failedBadgeIds,
  rippleBadgeIds,
  heatByBadgeId,
  onSelectBadge,
  onToggleBadgeSelection,
  onRunPath,
  onLoadCalculatorPayload,
  viewport,
  onViewportChange,
}: TheoryAchievementMapProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const restoredRef = useRef(false);
  const layout = useMemo(() => layoutTheoryAchievementMap(graph), [graph]);
  const badgesById = useMemo(
    () => new Map<string, TheoryBadgeV1>(graph.badges.map((badge: TheoryBadgeV1) => [badge.id, badge])),
    [graph.badges],
  );
  const selectedSet = new Set(selectedBadgeIds);
  const highlightedSet = new Set(highlightedBadgeIds);
  const edgeHighlightSet = new Set(highlightedEdgeIds);
  const playbackSet = new Set(playbackBadgeIds);
  const solvedSet = new Set(solvedBadgeIds);
  const failedSet = new Set(failedBadgeIds);
  const rippleSet = new Set(rippleBadgeIds);
  const hasFocus = highlightedSet.size > 0 || selectedSet.size > 1;

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
        style={{
          width: layout.width,
          height: layout.height,
          backgroundImage: [
            "linear-gradient(rgba(10,10,10,0.22) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(10,10,10,0.22) 1px, transparent 1px)",
            "radial-gradient(circle at 14% 20%, rgba(127,29,29,0.32) 0 8px, transparent 9px)",
            "radial-gradient(circle at 78% 22%, rgba(22,78,99,0.28) 0 7px, transparent 8px)",
            "radial-gradient(circle at 35% 68%, rgba(113,63,18,0.28) 0 10px, transparent 11px)",
            "linear-gradient(to bottom, #4b3324 0 70px, #3f3f46 70px 78%, #171717 78% 100%)",
          ].join(", "),
          backgroundSize: "32px 32px, 32px 32px, 220px 180px, 260px 210px, 300px 240px, auto",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-[70px] h-10 bg-[linear-gradient(135deg,transparent_0_16px,rgba(39,39,42,0.9)_17px_32px,transparent_33px_48px)] bg-[length:96px_40px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_50%_82%,rgba(0,0,0,0.48),transparent_42%)]" />
        <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height}>
          <defs>
            <marker id="theory-achievement-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill="rgb(161 161 170)" />
            </marker>
          </defs>
          {layout.edges.map((edge: TheoryAchievementLayoutEdge) => (
            <path
              key={edge.edgeId}
              d={toPath(edge.points)}
              className={edgeClass(edge, edgeHighlightSet, hasFocus)}
              strokeWidth={edgeHighlightSet.has(edge.edgeId) ? 3 : 2}
              strokeDasharray={isContextEdge(edge) ? "5 7" : undefined}
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
          const title = expression ? `${badge.title}\n${expression}` : badge.title;
          const heat = heatByBadgeId[node.badgeId] ?? 0;
          const ripple = rippleSet.has(node.badgeId);
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
              })}
              style={{
                left: node.x,
                top: node.y,
                boxShadow:
                  heat > 0
                    ? `0 0 ${Math.round(12 + heat * 18)}px rgba(34, 211, 238, ${Math.min(0.72, 0.22 + heat * 0.5)})`
                    : undefined,
              }}
              title={title}
              aria-label={badge.title}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                if (event.ctrlKey || event.metaKey) {
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
