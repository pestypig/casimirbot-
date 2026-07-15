import React, { useMemo, useState } from "react";
import { ComposableMap } from "react-simple-maps";
import { Info, X } from "lucide-react";
import type { CivicOrderParticipationV1 } from "@shared/civic-order-participation";
import type {
  CivilizationProvisioningLensV1,
  CivilizationProvisioningNetworkV1,
} from "@shared/civilization-provisioning-network";
import {
  CIVILIZATION_NATION_DEPENDENCY_EDGES,
  CIVILIZATION_NATION_STATE_VECTORS,
  type CivilizationNationStateVector,
} from "@/data/civilizationNationStateVectors";
import { buildDefaultCivilizationTraversabilityAtlas } from "@shared/civilization/civilization-traversability-fixtures";
import { CivilizationCountryLayer } from "./civilization/CivilizationCountryLayer";
import { CivilizationCountryInspector } from "./civilization/CivilizationCountryInspector";
import { CivilizationLensControls } from "./civilization/CivilizationLensControls";
import { DEFAULT_CIVILIZATION_LENS } from "./civilization/civilizationLensModel";
import {
  CivilizationDependencyEdgeLayer,
  selectedEdgeTone,
} from "./civilization/CivilizationDependencyEdgeLayer";
import { CivilizationEnvironmentalFlowLayer } from "./civilization/CivilizationEnvironmentalFlowLayer";
import { CivilizationRouteCandidateLayer } from "./civilization/CivilizationRouteCandidateLayer";
import { CivilizationTectonicPlateLayer } from "./civilization/CivilizationTectonicPlateLayer";

const GEO_URL = new URL("../assets/world-countries.json", import.meta.url).href;

export type CivilizationBoundsRoadmapProps = {
  scenarioId?: string;
  provisioningNetwork?: CivilizationProvisioningNetworkV1;
  civicOrderParticipation?: CivicOrderParticipationV1;
};

export function CivilizationBoundsRoadmap({
  provisioningNetwork,
  civicOrderParticipation,
}: CivilizationBoundsRoadmapProps) {
  const [selectedIso3s, setSelectedIso3s] = useState<string[]>([]);
  const [selectedLens, setSelectedLens] = useState<CivilizationProvisioningLensV1>(
    DEFAULT_CIVILIZATION_LENS,
  );

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
      <CivilizationLensControls value={selectedLens} onChange={setSelectedLens} />

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

          <CivilizationCountryInspector
            vectors={selectedVectors}
            edges={selectedEdges}
            comparisonEdges={comparisonEdges}
            lens={selectedLens}
            provisioningNetwork={provisioningNetwork}
            civicOrderParticipation={civicOrderParticipation}
          />
        </div>
      )}

      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        style={{ width: "100%", height: "100%" }}
      >
        <CivilizationCountryLayer
          geographyUrl={GEO_URL}
          lens={selectedLens}
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

export default CivilizationBoundsRoadmap;
