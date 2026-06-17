import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import type { CivilizationLayerModeV1 } from "@shared/civilization-bounds-roadmap";
import { buildCivilizationBoundsScenario } from "@/data/civilizationBoundsScenarios";
import {
  CIVILIZATION_NATION_DEPENDENCY_EDGES,
  CIVILIZATION_NATION_PARAMETER_SCOPES,
  CIVILIZATION_NATION_SCOPE_LABELS,
  CIVILIZATION_NATION_SOURCE_REFS,
  CIVILIZATION_NATION_STATE_VECTORS,
  type CivilizationNationDependencyEdge,
  type CivilizationNationParameterScope,
  type CivilizationNationStateVector,
} from "@/data/civilizationNationStateVectors";

const GEO_URL = new URL("../assets/world-countries.json", import.meta.url).href;

const EDGE_COLORS: Record<CivilizationNationDependencyEdge["kind"], string> = {
  trade_dependency: "#22c55e",
  logistics_corridor: "#38bdf8",
  security_exposure: "#ef4444",
  climate_shared_risk: "#84cc16",
  institutional_alignment: "#a78bfa",
};

const SCOPE_RISK_ORIENTED = new Set<CivilizationNationParameterScope>([
  "security_exposure",
  "social_cohesion_pressure",
  "information_legitimacy_pressure",
  "environmental_pressure",
]);

function formatLayerLabel(layer: CivilizationLayerModeV1): string {
  return layer.replaceAll("_", " ");
}

function formatSourceRef(ref: string): string {
  return CIVILIZATION_NATION_SOURCE_REFS[
    ref as keyof typeof CIVILIZATION_NATION_SOURCE_REFS
  ] ?? ref;
}

function parameterColor(scope: CivilizationNationParameterScope, value: number | null): string {
  if (value === null) return "#64748b";
  const riskOriented = SCOPE_RISK_ORIENTED.has(scope);
  if (riskOriented) {
    if (value >= 0.7) return "#ef4444";
    if (value >= 0.45) return "#f97316";
    if (value >= 0.25) return "#eab308";
    return "#22c55e";
  }
  if (value >= 0.7) return "#22c55e";
  if (value >= 0.45) return "#eab308";
  if (value >= 0.25) return "#f97316";
  return "#ef4444";
}

function parameterLabel(value: number | null): string {
  if (value === null) return "missing";
  return value.toFixed(2);
}

function eventPulseScore(vector: CivilizationNationStateVector): number {
  return Math.max(
    vector.eventPulse.politicalViolence30d,
    vector.eventPulse.demonstrations30d,
    vector.eventPulse.strategicDevelopments30d,
    vector.eventPulse.activeConflict ? 0.8 : 0,
  );
}

function markerRadius(vector: CivilizationNationStateVector, eventPulseOn: boolean): number {
  const pulse = eventPulseOn ? eventPulseScore(vector) : 0;
  return 6 + Math.max(vector.confidence, pulse) * 8;
}

function edgeEndpoint(edge: CivilizationNationDependencyEdge, iso3: string) {
  return CIVILIZATION_NATION_STATE_VECTORS.find((vector) => vector.countryIso3 === iso3);
}

export type CivilizationBoundsRoadmapProps = {
  scenarioId?: string;
};

export function CivilizationBoundsRoadmap({
  scenarioId,
}: CivilizationBoundsRoadmapProps) {
  const roadmap = useMemo(() => buildCivilizationBoundsScenario(scenarioId), [scenarioId]);
  const [selectedScope, setSelectedScope] =
    useState<CivilizationNationParameterScope>("material_base");
  const [selectedLayer, setSelectedLayer] = useState<CivilizationLayerModeV1>(
    roadmap.activeLayerModes[0] ?? "ideal_bounds",
  );
  const [showEdges, setShowEdges] = useState(true);
  const [showEventPulse, setShowEventPulse] = useState(true);
  const [showMissing, setShowMissing] = useState(true);
  const [selectedIso3, setSelectedIso3] = useState<string>(
    CIVILIZATION_NATION_STATE_VECTORS[0]?.countryIso3 ?? "",
  );

  const selectedVector =
    CIVILIZATION_NATION_STATE_VECTORS.find((vector) => vector.countryIso3 === selectedIso3) ??
    CIVILIZATION_NATION_STATE_VECTORS[0];

  const visibleEdges = useMemo(
    () =>
      CIVILIZATION_NATION_DEPENDENCY_EDGES.filter((edge) => {
        if (!showEdges) return false;
        return edgeEndpoint(edge, edge.fromIso3) && edgeEndpoint(edge, edge.toIso3);
      }),
    [showEdges],
  );

  const selectedEdges = useMemo(
    () =>
      CIVILIZATION_NATION_DEPENDENCY_EDGES.filter(
        (edge) => edge.fromIso3 === selectedIso3 || edge.toIso3 === selectedIso3,
      ),
    [selectedIso3],
  );

  return (
    <div className="relative h-full min-h-[620px] overflow-hidden bg-[#06110f] text-slate-100">
      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-md border border-white/10 bg-black/70 p-2">
        <span className="text-xs font-semibold">Civilization Bounds Atlas</span>
        {CIVILIZATION_NATION_PARAMETER_SCOPES.map((scope) => {
          const active = selectedScope === scope;
          return (
            <button
              key={scope}
              type="button"
              onClick={() => setSelectedScope(scope)}
              className={`h-7 rounded-md border px-2 text-[11px] ${
                active
                  ? "border-emerald-300/80 bg-emerald-300/15 text-emerald-100"
                  : "border-white/15 bg-white/5 text-slate-300 hover:border-white/40"
              }`}
            >
              {CIVILIZATION_NATION_SCOPE_LABELS[scope]}
            </button>
          );
        })}
      </div>

      <div className="absolute right-3 top-16 z-10 flex flex-col gap-2 rounded-md border border-white/10 bg-black/70 p-2 text-[11px] text-slate-200 sm:top-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showEdges}
            onChange={(event) => setShowEdges(event.target.checked)}
            className="accent-emerald-400"
          />
          dependency edges
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showEventPulse}
            onChange={(event) => setShowEventPulse(event.target.checked)}
            className="accent-emerald-400"
          />
          event pulse
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showMissing}
            onChange={(event) => setShowMissing(event.target.checked)}
            className="accent-emerald-400"
          />
          missing evidence
        </label>
      </div>

      <div
        className="absolute bottom-3 left-3 z-10 w-[min(26rem,calc(100%-1.5rem))] rounded-md border border-white/10 bg-black/75 p-3 text-xs"
        data-testid="civilization-bounds-country-inspector"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">
              {selectedVector.label}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {selectedVector.countryIso3} · observed {selectedVector.observedAt} · freshness{" "}
              {selectedVector.freshnessDays}d
            </div>
          </div>
          <div className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-emerald-100">
            confidence {selectedVector.confidence.toFixed(2)}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CIVILIZATION_NATION_PARAMETER_SCOPES.map((scope) => (
            <div key={scope} className="rounded-md border border-white/10 bg-white/[0.04] p-2">
              <div className="text-[10px] text-slate-400">
                {CIVILIZATION_NATION_SCOPE_LABELS[scope]}
              </div>
              <div
                className="mt-1 text-sm font-semibold"
                style={{ color: parameterColor(scope, selectedVector.parameters[scope]) }}
              >
                {parameterLabel(selectedVector.parameters[scope])}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {selectedVector.clusters.map((cluster) => (
            <span
              key={cluster}
              className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100"
            >
              {cluster.replaceAll("_", " ")}
            </span>
          ))}
        </div>

        {showMissing && (
          <div className="mt-3 text-[11px] text-slate-300">
            <span className="text-slate-500">missing: </span>
            {selectedVector.missingObservations.join(", ")}
          </div>
        )}

        <div className="mt-3 text-[11px] text-slate-400">
          sources: {selectedVector.sourceRefs.slice(0, 6).map(formatSourceRef).join(", ")}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-10 hidden w-72 rounded-md border border-white/10 bg-black/70 p-3 text-xs lg:block">
        <div className="font-semibold text-white">Selected edges</div>
        <div className="mt-2 space-y-2">
          {selectedEdges.length === 0 ? (
            <div className="text-[11px] text-slate-400">No seed edges selected.</div>
          ) : (
            selectedEdges.map((edge) => (
              <div key={edge.edgeId} className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
                <div className="text-[11px] text-slate-200">{edge.label}</div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {edge.kind.replaceAll("_", " ")} · confidence {edge.confidence.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="absolute left-3 top-[4.25rem] z-10 hidden rounded-md border border-white/10 bg-black/70 p-2 text-[11px] text-slate-300 md:block">
        <span className="mr-2 text-slate-500">roadmap layer</span>
        {roadmap.activeLayerModes.map((layer) => {
          const active = layer === selectedLayer;
          return (
            <button
              key={layer}
              type="button"
              onClick={() => setSelectedLayer(layer)}
              className={`ml-1 rounded-md border px-2 py-1 ${
                active
                  ? "border-white/60 bg-white/15 text-white"
                  : "border-white/15 bg-white/5 text-slate-300"
              }`}
            >
              {formatLayerLabel(layer)}
            </button>
          );
        })}
      </div>

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
                    fill: "#0d1b17",
                    stroke: "#244136",
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  hover: {
                    fill: "#10231e",
                    stroke: "#3c6b5a",
                    strokeWidth: 0.7,
                    outline: "none",
                  },
                  pressed: {
                    fill: "#10231e",
                    stroke: "#3c6b5a",
                    strokeWidth: 0.7,
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>

        {visibleEdges.map((edge) => {
          const from = edgeEndpoint(edge, edge.fromIso3);
          const to = edgeEndpoint(edge, edge.toIso3);
          if (!from || !to) return null;
          const selected = edge.fromIso3 === selectedIso3 || edge.toIso3 === selectedIso3;
          return (
            <Line
              key={edge.edgeId}
              from={[from.coordinates.lon, from.coordinates.lat]}
              to={[to.coordinates.lon, to.coordinates.lat]}
              stroke={EDGE_COLORS[edge.kind]}
              strokeWidth={selected ? 2.2 : 1.1}
              strokeLinecap="round"
              strokeOpacity={selected ? 0.85 : 0.32}
            />
          );
        })}

        {CIVILIZATION_NATION_STATE_VECTORS.map((vector) => {
          const value = vector.parameters[selectedScope];
          const selected = vector.countryIso3 === selectedIso3;
          const pulse = eventPulseScore(vector);
          const missing = vector.missingObservations.length > 0;
          const radius = markerRadius(vector, showEventPulse);
          return (
            <Marker
              key={vector.countryIso3}
              coordinates={[vector.coordinates.lon, vector.coordinates.lat]}
              onClick={() => setSelectedIso3(vector.countryIso3)}
              style={{
                default: { cursor: "pointer" },
                hover: { cursor: "pointer" },
                pressed: { cursor: "pointer" },
              }}
            >
              <circle
                r={radius + (selected ? 4 : 0)}
                fill="none"
                stroke={selected ? "#f8fafc" : parameterColor(selectedScope, value)}
                strokeWidth={selected ? 2.2 : 1.2}
                strokeDasharray={showMissing && missing ? "3 2" : undefined}
                strokeOpacity={selected ? 0.95 : 0.65}
              />
              {showEventPulse && pulse > 0.55 && (
                <circle
                  r={radius + 7}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={1.2}
                  strokeOpacity={0.55}
                />
              )}
              <circle
                r={radius}
                fill={parameterColor(selectedScope, value)}
                fillOpacity={selected ? 0.95 : 0.78}
                stroke="#03120f"
                strokeWidth={1}
              />
              <text
                y={1}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 7,
                  fontWeight: 700,
                  fill: "#06110f",
                  pointerEvents: "none",
                }}
              >
                {vector.countryIso3}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

export default CivilizationBoundsRoadmap;
