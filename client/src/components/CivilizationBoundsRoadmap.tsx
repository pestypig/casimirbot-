import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import { Info, X } from "lucide-react";
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

function civilizationBalanceScore(vector: CivilizationNationStateVector): number {
  const scores = CIVILIZATION_NATION_PARAMETER_SCOPES.map((scope) => {
    const value = vector.parameters[scope];
    if (value === null) return null;
    return SCOPE_RISK_ORIENTED.has(scope) ? 1 - value : value;
  }).filter((value): value is number => value !== null);

  if (scores.length === 0) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function balanceColor(score: number): string {
  if (score >= 0.68) return "#22c55e";
  if (score >= 0.52) return "#eab308";
  if (score >= 0.36) return "#f97316";
  return "#ef4444";
}

function eventPulseScore(vector: CivilizationNationStateVector): number {
  return Math.max(
    vector.eventPulse.politicalViolence30d,
    vector.eventPulse.demonstrations30d,
    vector.eventPulse.strategicDevelopments30d,
    vector.eventPulse.activeConflict ? 0.8 : 0,
  );
}

function markerRadius(vector: CivilizationNationStateVector): number {
  return 6 + Math.max(vector.confidence, eventPulseScore(vector) * 0.75) * 8;
}

function edgeEndpoint(edge: CivilizationNationDependencyEdge, iso3: string) {
  return CIVILIZATION_NATION_STATE_VECTORS.find((vector) => vector.countryIso3 === iso3);
}

function selectedEdgeTone(
  edge: CivilizationNationDependencyEdge,
  selectedIso3s: string[],
): "direct" | "comparison" | "hidden" {
  const fromSelected = selectedIso3s.includes(edge.fromIso3);
  const toSelected = selectedIso3s.includes(edge.toIso3);
  if (fromSelected && toSelected) return "comparison";
  if (fromSelected || toSelected) return "direct";
  return "hidden";
}

function scopeSpread(
  vectors: CivilizationNationStateVector[],
  scope: CivilizationNationParameterScope,
): string {
  const values = vectors
    .map((vector) => vector.parameters[scope])
    .filter((value): value is number => value !== null);
  if (values.length < 2) return "0.00";
  return (Math.max(...values) - Math.min(...values)).toFixed(2);
}

export type CivilizationBoundsRoadmapProps = {
  scenarioId?: string;
};

export function CivilizationBoundsRoadmap(_props: CivilizationBoundsRoadmapProps) {
  const [selectedIso3s, setSelectedIso3s] = useState<string[]>([]);

  const selectedVectors = useMemo(
    () =>
      selectedIso3s
        .map((iso3) =>
          CIVILIZATION_NATION_STATE_VECTORS.find((vector) => vector.countryIso3 === iso3),
        )
        .filter((vector): vector is CivilizationNationStateVector => Boolean(vector)),
    [selectedIso3s],
  );

  const selectedEdges = useMemo(
    () =>
      CIVILIZATION_NATION_DEPENDENCY_EDGES.filter(
        (edge) => selectedEdgeTone(edge, selectedIso3s) !== "hidden",
      ),
    [selectedIso3s],
  );

  const comparisonEdges = selectedEdges.filter(
    (edge) => selectedEdgeTone(edge, selectedIso3s) === "comparison",
  );

  const toggleSelectedCountry = (iso3: string) => {
    setSelectedIso3s((current) =>
      current.includes(iso3)
        ? current.filter((selectedIso3) => selectedIso3 !== iso3)
        : [...current, iso3],
    );
  };

  return (
    <div
      className="relative h-full min-h-[620px] overflow-hidden bg-[#06110f] text-slate-100"
      aria-label="Civilization Bounds Atlas"
    >
      {selectedVectors.length > 0 && (
        <div
          className="absolute bottom-3 left-3 right-3 z-10 max-h-[42%] overflow-auto rounded-md border border-white/10 bg-black/80 p-3 text-xs shadow-2xl backdrop-blur"
          data-testid="civilization-bounds-country-inspector"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Info className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                {selectedVectors.length === 1
                  ? selectedVectors[0].label
                  : "Compare selected countries"}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {selectedVectors.map((vector) => vector.countryIso3).join(" + ")}
                {" - "}
                click a selected marker again to remove it
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIso3s([])}
              className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white"
              aria-label="Clear selected countries"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {selectedVectors.length === 1 ? (
            <CountryReceipt vector={selectedVectors[0]} edges={selectedEdges} />
          ) : (
            <CountryComparison vectors={selectedVectors} comparisonEdges={comparisonEdges} />
          )}
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

        {selectedEdges.map((edge) => {
          const from = edgeEndpoint(edge, edge.fromIso3);
          const to = edgeEndpoint(edge, edge.toIso3);
          if (!from || !to) return null;
          const tone = selectedEdgeTone(edge, selectedIso3s);
          return (
            <Line
              key={edge.edgeId}
              data-testid="civilization-bounds-edge"
              from={[from.coordinates.lon, from.coordinates.lat]}
              to={[to.coordinates.lon, to.coordinates.lat]}
              stroke={EDGE_COLORS[edge.kind]}
              strokeWidth={tone === "comparison" ? 2.8 : 1.4}
              strokeLinecap="round"
              strokeOpacity={tone === "comparison" ? 0.9 : 0.42}
            />
          );
        })}

        {CIVILIZATION_NATION_STATE_VECTORS.map((vector) => {
          const selected = selectedIso3s.includes(vector.countryIso3);
          const pulse = eventPulseScore(vector);
          const missing = vector.missingObservations.length > 0;
          const radius = markerRadius(vector);
          const score = civilizationBalanceScore(vector);
          const fill = balanceColor(score);
          return (
            <Marker
              key={vector.countryIso3}
              data-testid="civilization-bounds-badge"
              data-country-iso={vector.countryIso3}
              aria-label={`${vector.label} civilization vector`}
              coordinates={[vector.coordinates.lon, vector.coordinates.lat]}
              onClick={() => toggleSelectedCountry(vector.countryIso3)}
              style={{
                default: { cursor: "pointer" },
                hover: { cursor: "pointer" },
                pressed: { cursor: "pointer" },
              }}
            >
              <circle
                r={radius + (selected ? 4 : 0)}
                fill="none"
                stroke={selected ? "#f8fafc" : fill}
                strokeWidth={selected ? 2.2 : 1.2}
                strokeDasharray={missing ? "3 2" : undefined}
                strokeOpacity={selected ? 0.95 : 0.62}
              />
              {pulse > 0.55 && (
                <circle
                  r={radius + 7}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={1.2}
                  strokeOpacity={0.5}
                />
              )}
              <circle
                r={radius}
                fill={fill}
                fillOpacity={selected ? 0.96 : 0.78}
                stroke="#03120f"
                strokeWidth={1}
              />
              {selected && (
                <g transform={`translate(${radius - 1}, ${-radius - 1})`}>
                  <circle r={5} fill="#f8fafc" stroke="#06110f" strokeWidth={1} />
                  <text
                    y={0.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      fontSize: 7,
                      fontWeight: 800,
                      fill: "#06110f",
                      pointerEvents: "none",
                    }}
                  >
                    i
                  </text>
                </g>
              )}
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

function CountryReceipt({
  vector,
  edges,
}: {
  vector: CivilizationNationStateVector;
  edges: CivilizationNationDependencyEdge[];
}) {
  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300 sm:grid-cols-4">
        <div>
          <span className="text-slate-500">observed</span>
          <div className="mt-1 text-slate-100">{vector.observedAt}</div>
        </div>
        <div>
          <span className="text-slate-500">freshness</span>
          <div className="mt-1 text-slate-100">{vector.freshnessDays}d</div>
        </div>
        <div>
          <span className="text-slate-500">confidence</span>
          <div className="mt-1 text-emerald-100">{vector.confidence.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-slate-500">balance</span>
          <div className="mt-1 text-slate-100">
            {civilizationBalanceScore(vector).toFixed(2)}
          </div>
        </div>
      </div>

      <ParameterGrid vectors={[vector]} />

      <div className="mt-3 flex flex-wrap gap-1">
        {vector.clusters.map((cluster) => (
          <span
            key={cluster}
            className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100"
          >
            {cluster.replaceAll("_", " ")}
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="text-[11px] text-slate-300">
          <span className="text-slate-500">missing: </span>
          {vector.missingObservations.join(", ")}
        </div>
        <div className="text-[11px] text-slate-400">
          sources: {vector.sourceRefs.slice(0, 6).map(formatSourceRef).join(", ")}
        </div>
      </div>

      <DependencyList edges={edges} emptyLabel="No seeded dependency relation selected." />
    </>
  );
}

function CountryComparison({
  vectors,
  comparisonEdges,
}: {
  vectors: CivilizationNationStateVector[];
  comparisonEdges: CivilizationNationDependencyEdge[];
}) {
  return (
    <>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {vectors.map((vector) => (
          <div key={vector.countryIso3} className="rounded-md border border-white/10 bg-white/[0.04] p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-white">{vector.label}</div>
              <div className="text-[10px] text-slate-400">{vector.countryIso3}</div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-400">
              <span>balance {civilizationBalanceScore(vector).toFixed(2)}</span>
              <span>confidence {vector.confidence.toFixed(2)}</span>
              <span>fresh {vector.freshnessDays}d</span>
            </div>
          </div>
        ))}
      </div>

      <ParameterGrid vectors={vectors} />

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {CIVILIZATION_NATION_PARAMETER_SCOPES.map((scope) => (
          <div key={scope} className="rounded-md border border-white/10 bg-white/[0.03] p-2">
            <div className="text-[10px] text-slate-500">
              {CIVILIZATION_NATION_SCOPE_LABELS[scope]} spread
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {scopeSpread(vectors, scope)}
            </div>
          </div>
        ))}
      </div>

      <DependencyList edges={comparisonEdges} emptyLabel="No seeded relation directly links the selected countries." />
    </>
  );
}

function ParameterGrid({ vectors }: { vectors: CivilizationNationStateVector[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {CIVILIZATION_NATION_PARAMETER_SCOPES.map((scope) => (
        <div key={scope} className="rounded-md border border-white/10 bg-white/[0.04] p-2">
          <div className="text-[10px] text-slate-400">
            {CIVILIZATION_NATION_SCOPE_LABELS[scope]}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {vectors.map((vector) => (
              <span
                key={`${vector.countryIso3}:${scope}`}
                className="text-sm font-semibold"
                style={{ color: parameterColor(scope, vector.parameters[scope]) }}
              >
                {vectors.length > 1 ? `${vector.countryIso3} ` : ""}
                {parameterLabel(vector.parameters[scope])}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DependencyList({
  edges,
  emptyLabel,
}: {
  edges: CivilizationNationDependencyEdge[];
  emptyLabel: string;
}) {
  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        Dependency relations
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        {edges.length === 0 ? (
          <div className="text-[11px] text-slate-400">{emptyLabel}</div>
        ) : (
          edges.map((edge) => (
            <div key={edge.edgeId} className="rounded-md border border-white/10 bg-white/[0.04] p-2">
              <div className="text-[11px] text-slate-200">{edge.label}</div>
              <div className="mt-1 text-[10px] text-slate-500">
                {edge.fromIso3} to {edge.toIso3} - {edge.kind.replaceAll("_", " ")} -
                confidence {edge.confidence.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CivilizationBoundsRoadmap;
