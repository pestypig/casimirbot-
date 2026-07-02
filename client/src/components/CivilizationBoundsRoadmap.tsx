import React, { useMemo, useState } from "react";
import { ComposableMap } from "react-simple-maps";
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
import { buildDefaultCivilizationTraversabilityAtlas } from "@shared/civilization/civilization-traversability-fixtures";
import {
  CivilizationCountryLayer,
  civilizationBalanceScore,
  parameterColor,
} from "./civilization/CivilizationCountryLayer";
import {
  CivilizationDependencyEdgeLayer,
  selectedEdgeTone,
} from "./civilization/CivilizationDependencyEdgeLayer";
import { CivilizationEnvironmentalFlowLayer } from "./civilization/CivilizationEnvironmentalFlowLayer";
import { CivilizationRouteCandidateLayer } from "./civilization/CivilizationRouteCandidateLayer";
import { CivilizationTectonicPlateLayer } from "./civilization/CivilizationTectonicPlateLayer";

const GEO_URL = new URL("../assets/world-countries.json", import.meta.url).href;

function formatSourceRef(ref: string): string {
  return CIVILIZATION_NATION_SOURCE_REFS[
    ref as keyof typeof CIVILIZATION_NATION_SOURCE_REFS
  ] ?? ref;
}

function parameterLabel(value: number | null): string {
  if (value === null) return "missing";
  return value.toFixed(2);
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
  const traversabilityAtlas = useMemo(
    () => buildDefaultCivilizationTraversabilityAtlas(),
    [],
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
        <CivilizationCountryLayer
          geographyUrl={GEO_URL}
          selectedIso3s={selectedIso3s}
          onToggleCountry={toggleSelectedCountry}
        />
        <CivilizationEnvironmentalFlowLayer />
        <CivilizationTectonicPlateLayer />
        <CivilizationDependencyEdgeLayer
          edges={selectedEdges}
          selectedIso3s={selectedIso3s}
        />
        <CivilizationRouteCandidateLayer
          routes={traversabilityAtlas.routeCandidates}
          nodes={traversabilityAtlas.infrastructureNodes}
          visible={selectedIso3s.length > 0}
        />
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
