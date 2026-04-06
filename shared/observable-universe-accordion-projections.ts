import { SPEED_OF_LIGHT_MPS } from "./observable-universe-accordion-projections-constants";
import {
  isCertifiedWarpMissionTimeComparisonContract,
  type WarpMissionTimeComparisonContractV1,
} from "./contracts/warp-mission-time-comparison.v1";
import {
  isCertifiedWarpMissionTimeEstimatorContract,
  type WarpMissionTimeEstimatorContractV1,
} from "./contracts/warp-mission-time-estimator.v1";
import {
  isCertifiedWarpCatalogEtaProjectionContract,
  type WarpCatalogEtaProjectionV1,
} from "./contracts/warp-catalog-eta-projection.v1";

export type ObservableUniverseAccordionVec3 = [number, number, number];

export type ObservableUniverseAccordionMode =
  | "raw_distance"
  | "sr_accessibility"
  | "nhm2_accessibility";

export type ObservableUniverseAccordionCatalogEntry = {
  id: string;
  label?: string;
  position_m: ObservableUniverseAccordionVec3;
};

export type ObservableUniverseAccordionControl = {
  properAcceleration_m_s2: number;
};

export type ObservableUniverseAccordionProjectionRequest = {
  projectionKind: "observable_universe_accordion";
  accordionMode: ObservableUniverseAccordionMode;
  catalog: ObservableUniverseAccordionCatalogEntry[];
  frame?: "heliocentric-icrs";
  control?: ObservableUniverseAccordionControl;
  selectedLaneId?: string;
  selectedProfileId?: string;
  warpCatalogEtaProjection?: WarpCatalogEtaProjectionV1 | null;
  warpMissionTimeEstimator?: WarpMissionTimeEstimatorContractV1 | null;
  warpMissionTimeComparison?: WarpMissionTimeComparisonContractV1 | null;
};

export type ObservableUniverseAccordionEntry = {
  id: string;
  label?: string;
  inputPosition_m: ObservableUniverseAccordionVec3;
  inputDistance_m: number;
  inputDirectionUnit: ObservableUniverseAccordionVec3;
  mappedRadius_s: number | null;
  mappedRadiusCt_m: number;
  outputPosition_m: ObservableUniverseAccordionVec3;
};

type ObservableUniverseAccordionBase = {
  kind: "observable_universe_accordion_projection";
  projectionKind: "observable_universe_accordion";
  accordionMode: ObservableUniverseAccordionMode;
  observerFamily: "grid_static";
  semantics: "outer_reference_only";
  claim_tier: "diagnostic";
  certifying: false;
  frame: "heliocentric-icrs";
  provenance_class: "proxy" | "inferred" | "solve_backed" | "deferred";
  projection_contract: string;
  contract_badge: string;
  status: "computed" | "unavailable";
  metadata?: Record<string, unknown>;
};

export type ComputedObservableUniverseAccordionProjection =
  ObservableUniverseAccordionBase & {
    status: "computed";
    entries: ObservableUniverseAccordionEntry[];
  };

export type UnavailableObservableUniverseAccordionProjection =
  ObservableUniverseAccordionBase & {
    status: "unavailable";
    fail_id:
      | "OBSERVABLE_UNIVERSE_ACCORDION_CONTROL_MISSING"
      | "OBSERVABLE_UNIVERSE_ACCORDION_NHM2_DEFERRED";
    reason: string;
    required?: string[];
  };

export type ObservableUniverseAccordionProjectionResult =
  | ComputedObservableUniverseAccordionProjection
  | UnavailableObservableUniverseAccordionProjection;

const zeroVec = (): ObservableUniverseAccordionVec3 => [0, 0, 0];

const scale = (
  vec: ObservableUniverseAccordionVec3,
  factor: number,
): ObservableUniverseAccordionVec3 => [vec[0] * factor, vec[1] * factor, vec[2] * factor];

const norm = (vec: ObservableUniverseAccordionVec3): number =>
  Math.hypot(vec[0], vec[1], vec[2]);

const directionUnitFor = (
  vec: ObservableUniverseAccordionVec3,
): ObservableUniverseAccordionVec3 => {
  const magnitude = norm(vec);
  if (!(magnitude > 0)) return zeroVec();
  return scale(vec, 1 / magnitude);
};

const baseShape = (
  request: ObservableUniverseAccordionProjectionRequest,
  args: Pick<
    ObservableUniverseAccordionBase,
    "provenance_class" | "projection_contract" | "contract_badge"
  >,
): ObservableUniverseAccordionBase => ({
  kind: "observable_universe_accordion_projection",
  projectionKind: "observable_universe_accordion",
  accordionMode: request.accordionMode,
  observerFamily: "grid_static",
  semantics: "outer_reference_only",
  claim_tier: "diagnostic",
  certifying: false,
  frame: request.frame ?? "heliocentric-icrs",
  provenance_class: args.provenance_class,
  projection_contract: args.projection_contract,
  contract_badge: args.contract_badge,
  status: "computed",
});

const unavailable = (
  request: ObservableUniverseAccordionProjectionRequest,
  args: Omit<UnavailableObservableUniverseAccordionProjection, keyof ObservableUniverseAccordionBase | "accordionMode" | "projectionKind" | "kind" | "frame"> & {
    provenance_class: ObservableUniverseAccordionBase["provenance_class"];
    projection_contract: string;
    contract_badge: string;
  },
): UnavailableObservableUniverseAccordionProjection => ({
  ...baseShape(request, {
    provenance_class: args.provenance_class,
    projection_contract: args.projection_contract,
    contract_badge: args.contract_badge,
  }),
  status: "unavailable",
  fail_id: args.fail_id,
  reason: args.reason,
  ...(args.required ? { required: args.required } : {}),
  ...(args.metadata ? { metadata: args.metadata } : {}),
});

const buildEntry = (
  entry: ObservableUniverseAccordionCatalogEntry,
  mappedRadiusCt_m: number,
  mappedRadius_s: number | null,
): ObservableUniverseAccordionEntry => {
  const inputDistance = norm(entry.position_m);
  const inputDirection = directionUnitFor(entry.position_m);
  const outputPosition =
    inputDistance > 0 ? scale(inputDirection, mappedRadiusCt_m) : zeroVec();
  return {
    id: entry.id,
    label: entry.label,
    inputPosition_m: entry.position_m,
    inputDistance_m: inputDistance,
    inputDirectionUnit: inputDirection,
    mappedRadius_s,
    mappedRadiusCt_m,
    outputPosition_m: outputPosition,
  };
};

const buildRawDistanceProjection = (
  request: ObservableUniverseAccordionProjectionRequest,
): ComputedObservableUniverseAccordionProjection => ({
  ...baseShape(request, {
    provenance_class: "inferred",
    projection_contract:
      "Keep each heliocentric-ICRS direction ray fixed and use the raw catalog radius D as the accordion radius.",
    contract_badge: "accordion_raw_distance/v1",
  }),
  entries: request.catalog.map((entry) =>
    buildEntry(entry, norm(entry.position_m), norm(entry.position_m) / SPEED_OF_LIGHT_MPS),
  ),
  metadata: {
    radiusSource: "catalog_distance",
  },
});

const buildSrAccessibilityProjection = (
  request: ObservableUniverseAccordionProjectionRequest,
  control: ObservableUniverseAccordionControl,
): ComputedObservableUniverseAccordionProjection => ({
  ...baseShape(request, {
    provenance_class: "proxy",
    projection_contract:
      "Keep each heliocentric-ICRS direction ray fixed and replace radius D with the flat-SR flip-burn proper-time reachability radius.",
    contract_badge: "accordion_sr_accessibility/v1",
  }),
  entries: request.catalog.map((entry) => {
    const inputDistance = norm(entry.position_m);
    const midpointGamma =
      1 +
      (control.properAcceleration_m_s2 * inputDistance) /
        (2 * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS);
    const mappedRadiusProperTime_s =
      inputDistance > 0
        ? (2 * SPEED_OF_LIGHT_MPS) / control.properAcceleration_m_s2 * Math.acosh(midpointGamma)
        : 0;
    return buildEntry(
      entry,
      mappedRadiusProperTime_s * SPEED_OF_LIGHT_MPS,
      mappedRadiusProperTime_s,
    );
  }),
  metadata: {
    properAcceleration_m_s2: control.properAcceleration_m_s2,
    trajectory_model: "flat_sr_constant_proper_acceleration_flip_burn",
  },
});

const buildNhm2DeferredProjection = (
  request: ObservableUniverseAccordionProjectionRequest,
): UnavailableObservableUniverseAccordionProjection => {
  const missionTimeReady = isCertifiedWarpMissionTimeEstimatorContract(
    request.warpMissionTimeEstimator,
  );
  const missionComparisonReady = isCertifiedWarpMissionTimeComparisonContract(
    request.warpMissionTimeComparison,
  );
  return unavailable(request, {
    provenance_class: "deferred",
    projection_contract:
      "NHM2 accordion radius is admitted only from a certified warp_catalog_eta_projection/v1 surface and must fail closed until that surface exists.",
    contract_badge: "deferred",
    fail_id: "OBSERVABLE_UNIVERSE_ACCORDION_NHM2_DEFERRED",
    required: ["warpCatalogEtaProjection.contractVersion=warp_catalog_eta_projection/v1"],
    reason: missionTimeReady
      ? "A bounded NHM2 mission-time estimator is present, but the observable-universe accordion remains deferred until an explicit certified catalog ETA projection contract is available."
      : "NHM2 accordion access remains deferred because no certified catalog ETA projection contract is available.",
    metadata: {
      missionTimeEstimatorReady: missionTimeReady,
      missionTimeComparisonReady: missionComparisonReady,
      selectedLaneId: request.selectedLaneId ?? null,
      selectedProfileId: request.selectedProfileId ?? null,
    },
  });
};

const buildNhm2Projection = (
  request: ObservableUniverseAccordionProjectionRequest,
  contract: WarpCatalogEtaProjectionV1,
): ObservableUniverseAccordionProjectionResult => {
  if (
    request.selectedLaneId &&
    request.selectedLaneId !== contract.selectedLaneId
  ) {
    return buildNhm2DeferredProjection(request);
  }
  if (
    request.selectedProfileId &&
    request.selectedProfileId !== contract.selectedProfileId
  ) {
    return buildNhm2DeferredProjection(request);
  }

  const entriesById = new Map(contract.entries.map((entry) => [entry.id, entry]));
  const requestedEntries: ObservableUniverseAccordionEntry[] = [];
  for (const catalogEntry of request.catalog) {
    const contractEntry = entriesById.get(catalogEntry.id);
    if (!contractEntry) {
      return buildNhm2DeferredProjection(request);
    }
    requestedEntries.push({
      id: contractEntry.id,
      label: contractEntry.label,
      inputPosition_m: contractEntry.inputPosition_m,
      inputDistance_m: contractEntry.inputDistance_m,
      inputDirectionUnit: directionUnitFor(contractEntry.inputPosition_m),
      mappedRadius_s: contractEntry.mappedRadius_s,
      mappedRadiusCt_m: contractEntry.mappedRadius_s * SPEED_OF_LIGHT_MPS,
      outputPosition_m: contractEntry.outputPosition_m,
    });
  }

  return {
    ...baseShape(request, {
      provenance_class: "solve_backed",
      projection_contract:
        "Keep each heliocentric-ICRS direction ray fixed and use the certified catalog-facing ETA surface as the sole NHM2 radius source.",
      contract_badge: contract.contractVersion,
    }),
    entries: requestedEntries,
    metadata: {
      integrityStatus: contract.integrityStatus,
      claimTier: contract.claimTier,
      metricFamily: contract.metricFamily,
      selectedLaneId: contract.selectedLaneId,
      selectedProfileId: contract.selectedProfileId,
      defaultOperatingProfileId: contract.defaultOperatingProfileId,
      supportedBandFloorProfileId: contract.supportedBandFloorProfileId,
      supportedBandCeilingProfileId: contract.supportedBandCeilingProfileId,
      evidenceFloorProfileId: contract.evidenceFloorProfileId,
      evidenceFloorCenterlineAlpha: contract.evidenceFloorCenterlineAlpha,
      supportBufferDeltaCenterlineAlpha: contract.supportBufferDeltaCenterlineAlpha,
      sourceSurfaceId: contract.sourceSurfaceId,
      sourceWorldlineContractId: contract.sourceWorldlineContractId,
      sourceWorldlineContractVersion: contract.sourceWorldlineContractVersion,
      sourceRouteTimeWorldlineContractId: contract.sourceRouteTimeWorldlineContractId,
      sourceRouteTimeWorldlineContractVersion:
        contract.sourceRouteTimeWorldlineContractVersion,
      sourceMissionTimeEstimatorContractId: contract.sourceMissionTimeEstimatorContractId,
      sourceMissionTimeEstimatorContractVersion:
        contract.sourceMissionTimeEstimatorContractVersion,
      sourceMissionTimeComparisonContractId:
        contract.sourceMissionTimeComparisonContractId ?? null,
      sourceMissionTimeComparisonContractVersion:
        contract.sourceMissionTimeComparisonContractVersion ?? null,
      targetDistanceContractId: contract.targetDistanceContractId,
      targetDistanceContractVersion: contract.targetDistanceContractVersion,
      targetDistanceBasis: contract.targetDistanceBasis,
      radiusMeaning: contract.radiusMeaning,
      claimBoundary: contract.claimBoundary,
      nonClaims: contract.nonClaims,
    },
  };
};

export function buildObservableUniverseAccordionProjection(
  request: ObservableUniverseAccordionProjectionRequest,
): ObservableUniverseAccordionProjectionResult {
  if (request.accordionMode === "raw_distance") {
    return buildRawDistanceProjection(request);
  }

  if (request.accordionMode === "sr_accessibility") {
    if (!request.control) {
      return unavailable(request, {
        provenance_class: "proxy",
        projection_contract:
          "SR accessibility mode requires an explicit flat-SR control law and must fail closed when it is absent.",
        contract_badge: "missing-control",
        fail_id: "OBSERVABLE_UNIVERSE_ACCORDION_CONTROL_MISSING",
        required: ["control.properAcceleration_m_s2"],
        reason: "SR accessibility mode requires a declared proper-acceleration control.",
      });
    }
    return buildSrAccessibilityProjection(request, request.control);
  }

  if (!isCertifiedWarpCatalogEtaProjectionContract(request.warpCatalogEtaProjection)) {
    return buildNhm2DeferredProjection(request);
  }

  return buildNhm2Projection(request, request.warpCatalogEtaProjection);
}
