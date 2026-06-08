import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type {
  CivilizationBoundsBadgeKindV1,
  CivilizationBoundsBadgeV1,
  CivilizationLayerModeV1,
  CivilizationPhaseV1,
} from "@shared/civilization-bounds-roadmap";
import { buildCivilizationBoundsScenario } from "@/data/civilizationBoundsScenarios";

const GEO_URL = new URL("../assets/world-countries.json", import.meta.url).href;

const PHASE_COLORS: Record<string, string> = {
  P0: "#38bdf8",
  P1: "#a855f7",
  P2: "#22c55e",
  P3: "#eab308",
  P4: "#f97316",
};

const BOUND_BADGE_GLYPHS: Record<CivilizationBoundsBadgeKindV1, string> = {
  system_actor: "o",
  capability: "D",
  resource: "v",
  constraint: "<>",
  dependency: "<->",
  risk: "!",
  governance_interface: "@",
  observation_gap: "?",
  collaboration_bound: "8",
  theory_binding: "T",
  zen_binding: "Z",
};

const KIND_COLORS: Record<CivilizationBoundsBadgeKindV1, string> = {
  system_actor: "#38bdf8",
  capability: "#22c55e",
  resource: "#f97316",
  constraint: "#eab308",
  dependency: "#8b5cf6",
  risk: "#ef4444",
  governance_interface: "#94a3b8",
  observation_gap: "#f43f5e",
  collaboration_bound: "#14b8a6",
  theory_binding: "#06b6d4",
  zen_binding: "#a78bfa",
};

function boundWeightToRadius(weight: number | undefined, kind: CivilizationBoundsBadgeKindV1): number {
  const base = kind === "system_actor" ? 7 : 4;
  const max = kind === "system_actor" ? 18 : 10;
  const clamped = Math.max(0, Math.min(weight ?? 0.12, 0.6));
  return base + (clamped / 0.6) * (max - base);
}

function phaseMidpoint(phase: CivilizationPhaseV1): number {
  const start = typeof phase.start === "number" ? phase.start : Number.parseFloat(phase.start);
  const end = typeof phase.end === "number" ? phase.end : Number.parseFloat(phase.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return (start + end) / 2;
}

function activePhaseForYear(phases: CivilizationPhaseV1[], year: number): CivilizationPhaseV1 {
  const sorted = [...phases].sort((a, b) => Number(a.end) - Number(b.end));
  return (
    sorted.find((phase) => {
      const start = typeof phase.start === "number" ? phase.start : Number.parseFloat(phase.start);
      const end = typeof phase.end === "number" ? phase.end : Number.parseFloat(phase.end);
      return year >= start && year < end;
    }) ?? sorted[sorted.length - 1]
  );
}

function badgeHasCoordinate(badge: CivilizationBoundsBadgeV1): badge is CivilizationBoundsBadgeV1 & {
  coordinates: { lat: number; lon: number };
} {
  return Boolean(
    badge.coordinates &&
      Number.isFinite(badge.coordinates.lat) &&
      Number.isFinite(badge.coordinates.lon),
  );
}

function layerLabel(layer: CivilizationLayerModeV1): string {
  return layer.replaceAll("_", " ");
}

export type CivilizationBoundsRoadmapProps = {
  scenarioId?: string;
};

export function CivilizationBoundsRoadmap({
  scenarioId,
}: CivilizationBoundsRoadmapProps) {
  const roadmap = useMemo(() => buildCivilizationBoundsScenario(scenarioId), [scenarioId]);
  const [year, setYear] = useState(() => phaseMidpoint(roadmap.phases[0]));
  const [selectedLayer, setSelectedLayer] = useState<CivilizationLayerModeV1>(
    roadmap.activeLayerModes[0] ?? "ideal_bounds",
  );
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const activePhase = useMemo(() => activePhaseForYear(roadmap.phases, year), [roadmap.phases, year]);
  const visibleBadges = useMemo(
    () =>
      roadmap.badges.filter(
        (badge) =>
          badge.layerMode === selectedLayer &&
          badge.phaseId === activePhase.phaseId &&
          badgeHasCoordinate(badge),
      ) as Array<CivilizationBoundsBadgeV1 & { coordinates: { lat: number; lon: number } }>,
    [activePhase.phaseId, roadmap.badges, selectedLayer],
  );
  const selectedBadge = visibleBadges.find((badge) => badge.badgeId === selectedBadgeId) ?? null;
  const connectedBadgeIds = useMemo(() => {
    if (!selectedBadge) return new Set<string>();
    const connected = new Set<string>([selectedBadge.badgeId]);
    roadmap.edges.forEach((edge) => {
      if (edge.fromBadgeId === selectedBadge.badgeId) connected.add(edge.toBadgeId);
      if (edge.toBadgeId === selectedBadge.badgeId) connected.add(edge.fromBadgeId);
    });
    return connected;
  }, [roadmap.edges, selectedBadge]);

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden bg-[#050915] text-slate-100">
      <div className="absolute left-3 top-3 z-10 flex max-w-[70%] flex-wrap items-center gap-2 rounded-md border border-white/10 bg-black/70 p-2">
        <span className="text-xs font-semibold">Civilization Bounds Roadmap</span>
        {roadmap.phases.map((phase) => {
          const active = phase.phaseId === activePhase.phaseId;
          const color = PHASE_COLORS[phase.phaseId] ?? "#38bdf8";
          return (
            <button
              key={phase.phaseId}
              type="button"
              onClick={() => setYear(phaseMidpoint(phase))}
              className={`h-7 rounded-md border px-2 text-[11px] ${
                active
                  ? "border-white/70 bg-white/15 text-white"
                  : "border-white/15 bg-white/5 text-slate-300 hover:border-white/40"
              }`}
              style={{ boxShadow: active ? `0 0 0 1px ${color}` : undefined }}
            >
              {phase.phaseId}
            </button>
          );
        })}
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2 rounded-md border border-white/10 bg-black/70 p-2">
        {roadmap.activeLayerModes.map((layer) => {
          const active = layer === selectedLayer;
          return (
            <button
              key={layer}
              type="button"
              onClick={() => setSelectedLayer(layer)}
              className={`h-7 rounded-md border px-2 text-[11px] ${
                active
                  ? "border-emerald-300/80 bg-emerald-300/15 text-emerald-100"
                  : "border-white/15 bg-white/5 text-slate-300 hover:border-white/40"
              }`}
            >
              {layerLabel(layer)}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 rounded-md border border-white/10 bg-black/70 px-3 py-2">
        <span className="w-10 text-[11px] text-slate-400">0y</span>
        <input
          aria-label="Civilization bounds phase year"
          type="range"
          min={0}
          max={50}
          step={0.5}
          value={year}
          className="min-w-0 flex-1 accent-emerald-400"
          onChange={(event) => setYear(Number(event.target.value))}
        />
        <span className="w-12 text-right text-[11px] text-slate-400">50y</span>
        <span className="hidden text-[11px] text-slate-200 sm:inline">
          t={year.toFixed(1)}
        </span>
      </div>

      {selectedBadge && (
        <div
          className="absolute bottom-16 right-3 z-10 w-64 rounded-md border border-white/10 bg-black/75 p-3 text-xs"
          data-testid="civilization-bounds-badge-inspector"
        >
          <div className="font-semibold text-white">{selectedBadge.label}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <span>kind</span>
            <span className="text-right text-slate-100">{selectedBadge.kind}</span>
            <span>confidence</span>
            <span className="text-right text-slate-100">{selectedBadge.confidence.toFixed(2)}</span>
            <span>claim tier</span>
            <span className="text-right text-slate-100">{selectedBadge.claimTier}</span>
            <span>missing</span>
            <span className="text-right text-slate-100">{selectedBadge.missingEvidence?.length ?? 0}</span>
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: "#0b1223",
                    stroke: "#1f2937",
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  hover: {
                    fill: "#10192f",
                    stroke: "#334155",
                    strokeWidth: 0.7,
                    outline: "none",
                  },
                  pressed: {
                    fill: "#10192f",
                    stroke: "#334155",
                    strokeWidth: 0.7,
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>

        {visibleBadges.map((badge) => {
          const color = KIND_COLORS[badge.kind];
          const selected = badge.badgeId === selectedBadge?.badgeId;
          const connected = connectedBadgeIds.has(badge.badgeId);
          const radius = boundWeightToRadius(badge.weight, badge.kind);
          const missing = (badge.missingEvidence?.length ?? 0) > 0;
          return (
            <Marker
              key={badge.badgeId}
              coordinates={[badge.coordinates.lon, badge.coordinates.lat]}
              onClick={() => setSelectedBadgeId(badge.badgeId)}
              style={{
                default: { cursor: "pointer" },
                hover: { cursor: "pointer" },
                pressed: { cursor: "pointer" },
              }}
            >
              <circle
                r={radius + (selected ? 4 : connected ? 2 : 0)}
                fill="none"
                stroke={selected ? "#f8fafc" : connected ? "#94a3b8" : PHASE_COLORS[activePhase.phaseId] ?? "#38bdf8"}
                strokeWidth={selected ? 2.2 : connected ? 1.5 : 1}
                strokeDasharray={missing ? "3 2" : undefined}
                strokeOpacity={selected || connected ? 0.95 : 0.55}
              />
              <circle
                r={radius}
                fill={color}
                fillOpacity={selected || connected ? 0.95 : 0.78}
                stroke="#020617"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: badge.kind === "system_actor" ? 9 : 7,
                  fontWeight: 700,
                  fill: "#020617",
                  pointerEvents: "none",
                }}
              >
                {BOUND_BADGE_GLYPHS[badge.kind]}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

export default CivilizationBoundsRoadmap;
