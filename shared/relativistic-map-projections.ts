import {
  computeWarpWorldlineEffectiveTransportVelocityCoord,
  isCertifiedWarpWorldlineContract,
  resolveWarpWorldlineRepresentativeSample,
  type WarpWorldlineContractV1,
} from "./contracts/warp-worldline-contract.v1";
import {
  isCertifiedWarpRouteTimeWorldlineContract,
  type WarpRouteTimeWorldlineContractV1,
} from "./contracts/warp-route-time-worldline.v1";
import {
  isCertifiedWarpMissionTimeEstimatorContract,
  type WarpMissionTimeEstimatorContractV1,
} from "./contracts/warp-mission-time-estimator.v1";
import {
  isCertifiedWarpMissionTimeComparisonContract,
  type WarpMissionTimeComparisonContractV1,
} from "./contracts/warp-mission-time-comparison.v1";

const SPEED_OF_LIGHT_MPS = 299_792_458;

export type RelativisticMapVec3 = [number, number, number];

export type RelativisticMapProjectionKind =
  | "instantaneous_ship_view"
  | "sun_centered_accessibility";

export type RelativisticMapSourceModel =
  | "flat_sr_flip_burn_control"
  | "warp_worldline_route_time"
  | "warp_worldline_local_comoving";

export type RelativisticMapObserverFamily = "ship_comoving" | "grid_static";

export type RelativisticMapSemantics =
  | "instantaneous_comoving_projection"
  | "outer_reference_only";

export type RelativisticMapCatalogEntry = {
  id: string;
  position_m: RelativisticMapVec3;
  label?: string;
};

export type FlatSrFlipBurnControl = {
  properAcceleration_m_s2: number;
  currentProperTime_s?: number;
  direction?: RelativisticMapVec3;
  shipPosition_m?: RelativisticMapVec3;
};

export type RelativisticMapProjectionRequest = {
  projectionKind: RelativisticMapProjectionKind;
  sourceModel: RelativisticMapSourceModel;
  catalog: RelativisticMapCatalogEntry[];
  control?: FlatSrFlipBurnControl;
  warpWorldline?: WarpWorldlineContractV1 | null;
  warpRouteTimeWorldline?: WarpRouteTimeWorldlineContractV1 | null;
  warpMissionTimeEstimator?: WarpMissionTimeEstimatorContractV1 | null;
  warpMissionTimeComparison?: WarpMissionTimeComparisonContractV1 | null;
};

type RelativisticMapEntryBase = {
  id: string;
  label?: string;
  inputPosition_m: RelativisticMapVec3;
  inputDistance_m: number;
  inputDirectionUnit: RelativisticMapVec3;
};

export type SunCenteredAccessibilityEntry = RelativisticMapEntryBase & {
  mappedRadiusProperTime_s: number;
  mappedRadiusCt_m: number;
  outputPosition_m: RelativisticMapVec3;
  midpointGamma: number;
};

export type InstantaneousShipViewEntry = RelativisticMapEntryBase & {
  shipFramePosition_m: RelativisticMapVec3;
  separationFromShip_m: RelativisticMapVec3;
  inputParallel_m: number;
  outputParallel_m: number;
  perpendicularDistance_m: number;
  shipFrameDistance_m: number;
};

type RelativisticProjectionBase = {
  kind: "relativistic_map_projection";
  projectionKind: RelativisticMapProjectionKind;
  sourceModel: RelativisticMapSourceModel;
  observerFamily: RelativisticMapObserverFamily;
  semantics: RelativisticMapSemantics;
  provenance_class: "proxy" | "inferred" | "solve_backed";
  claim_tier: "diagnostic";
  certifying: false;
  status: "computed" | "unavailable";
  projection_contract: string;
  claim_boundary: string;
  catalogFrame: "sun_centered_cartesian";
  units: {
    distance: "m";
    properTime: "s";
  };
};

export type ComputedSunCenteredAccessibilityProjection = RelativisticProjectionBase & {
  projectionKind: "sun_centered_accessibility";
  status: "computed";
  entries: SunCenteredAccessibilityEntry[];
  metadata: Record<string, unknown>;
};

export type ComputedInstantaneousShipViewProjection = RelativisticProjectionBase & {
  projectionKind: "instantaneous_ship_view";
  status: "computed";
  entries: InstantaneousShipViewEntry[];
  metadata: Record<string, unknown>;
};

export type ComputedRelativisticMapProjection =
  | ComputedSunCenteredAccessibilityProjection
  | ComputedInstantaneousShipViewProjection;

export type UnavailableRelativisticMapProjection = RelativisticProjectionBase & {
  status: "unavailable";
  fail_id:
    | "RELATIVISTIC_MAP_CONTROL_MISSING"
    | "RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED"
    | "RELATIVISTIC_MAP_WARP_ROUTE_TIME_DEFERRED";
  required?: string[];
  reason: string;
  metadata?: Record<string, unknown>;
};

export type RelativisticMapProjectionResult =
  | ComputedRelativisticMapProjection
  | UnavailableRelativisticMapProjection;

const zeroVec = (): RelativisticMapVec3 => [0, 0, 0];

const dot = (left: RelativisticMapVec3, right: RelativisticMapVec3): number =>
  left[0] * right[0] + left[1] * right[1] + left[2] * right[2];

const add = (left: RelativisticMapVec3, right: RelativisticMapVec3): RelativisticMapVec3 => [
  left[0] + right[0],
  left[1] + right[1],
  left[2] + right[2],
];

const sub = (left: RelativisticMapVec3, right: RelativisticMapVec3): RelativisticMapVec3 => [
  left[0] - right[0],
  left[1] - right[1],
  left[2] - right[2],
];

const scale = (vec: RelativisticMapVec3, factor: number): RelativisticMapVec3 => [
  vec[0] * factor,
  vec[1] * factor,
  vec[2] * factor,
];

const norm = (vec: RelativisticMapVec3): number => Math.hypot(vec[0], vec[1], vec[2]);

const normalizeDirection = (vec?: RelativisticMapVec3): RelativisticMapVec3 => {
  const candidate = vec ?? [1, 0, 0];
  const magnitude = norm(candidate);
  if (!(magnitude > 0)) return [1, 0, 0];
  return scale(candidate, 1 / magnitude);
};

const directionUnitFor = (vec: RelativisticMapVec3): RelativisticMapVec3 => {
  const magnitude = norm(vec);
  if (!(magnitude > 0)) return zeroVec();
  return scale(vec, 1 / magnitude);
};

const baseProjectionShape = (
  request: RelativisticMapProjectionRequest,
  args: {
    observerFamily: RelativisticMapObserverFamily;
    semantics: RelativisticMapSemantics;
    provenance_class: "proxy" | "inferred";
    projection_contract: string;
    claim_boundary: string;
  },
): RelativisticProjectionBase => ({
  kind: "relativistic_map_projection",
  projectionKind: request.projectionKind,
  sourceModel: request.sourceModel,
  observerFamily: args.observerFamily,
  semantics: args.semantics,
  provenance_class: args.provenance_class,
  claim_tier: "diagnostic",
  certifying: false,
  status: "computed",
  projection_contract: args.projection_contract,
  claim_boundary: args.claim_boundary,
  catalogFrame: "sun_centered_cartesian",
  units: {
    distance: "m",
    properTime: "s",
  },
});

const unavailableProjection = (
  request: RelativisticMapProjectionRequest,
  args: {
    observerFamily: RelativisticMapObserverFamily;
    semantics: RelativisticMapSemantics;
    fail_id:
      | "RELATIVISTIC_MAP_CONTROL_MISSING"
      | "RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED"
      | "RELATIVISTIC_MAP_WARP_ROUTE_TIME_DEFERRED";
    required?: string[];
    reason: string;
    projection_contract: string;
    metadata?: Record<string, unknown>;
  },
): UnavailableRelativisticMapProjection => ({
  ...baseProjectionShape(request, {
    observerFamily: args.observerFamily,
    semantics: args.semantics,
    provenance_class: request.sourceModel === "flat_sr_flip_burn_control" ? "proxy" : "inferred",
    projection_contract: args.projection_contract,
    claim_boundary:
      "This projection is diagnostic-only. It must not be promoted to a warp-derived geometry claim without a resolved warp worldline contract.",
  }),
  status: "unavailable",
  fail_id: args.fail_id,
  required: args.required,
  reason: args.reason,
  ...(args.metadata ? { metadata: args.metadata } : {}),
});

const buildSunCenteredAccessibilityMap = (
  request: RelativisticMapProjectionRequest & { projectionKind: "sun_centered_accessibility" },
  control: FlatSrFlipBurnControl,
): ComputedSunCenteredAccessibilityProjection => {
  const acceleration = control.properAcceleration_m_s2;
  const naturalScale = (SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS) / acceleration;
  const entries: SunCenteredAccessibilityEntry[] = request.catalog.map((entry) => {
    const inputDistance = norm(entry.position_m);
    const inputDirection = directionUnitFor(entry.position_m);
    const midpointGamma = 1 + (acceleration * inputDistance) / (2 * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS);
    const mappedRadiusProperTime_s =
      inputDistance > 0
        ? (2 * SPEED_OF_LIGHT_MPS) / acceleration * Math.acosh(midpointGamma)
        : 0;
    const mappedRadiusCt_m = SPEED_OF_LIGHT_MPS * mappedRadiusProperTime_s;
    return {
      id: entry.id,
      label: entry.label,
      inputPosition_m: entry.position_m,
      inputDistance_m: inputDistance,
      inputDirectionUnit: inputDirection,
      mappedRadiusProperTime_s,
      mappedRadiusCt_m,
      outputPosition_m: scale(inputDirection, mappedRadiusCt_m),
      midpointGamma,
    };
  });

  return {
    ...baseProjectionShape(request, {
      observerFamily: "grid_static",
      semantics: "outer_reference_only",
      provenance_class: "proxy",
      projection_contract:
        "Keep Sun-frame angular coordinates fixed and replace radius D with onboard proper-time reachability tau_trip(D) under the declared flip-burn control law.",
      claim_boundary:
        "This accessibility map is a reachability reprojection, not a resolved warp metric, ADM field, or Lane A proof surface.",
    }),
    entries,
    metadata: {
      trajectory_model: "flat_sr_constant_proper_acceleration_flip_burn",
      properAcceleration_m_s2: acceleration,
      naturalScale_c2_over_a_m: naturalScale,
      radialMappingFormula:
        "tau_trip(D) = (2c/a) * arcosh(1 + aD/(2c^2)); output radius = c * tau_trip(D)",
    },
  };
};

const buildInstantaneousShipViewMap = (
  request: RelativisticMapProjectionRequest & { projectionKind: "instantaneous_ship_view" },
  control: FlatSrFlipBurnControl,
): ComputedInstantaneousShipViewProjection => {
  const acceleration = control.properAcceleration_m_s2;
  const properTime = control.currentProperTime_s ?? 0;
  const direction = normalizeDirection(control.direction);
  const rapidity = (acceleration * properTime) / SPEED_OF_LIGHT_MPS;
  const beta = Math.tanh(rapidity);
  const gamma = Math.cosh(rapidity);
  const analyticShipPosition = scale(
    direction,
    ((SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS) / acceleration) * (Math.cosh(rapidity) - 1),
  );
  const shipPosition = control.shipPosition_m ?? analyticShipPosition;
  const shipPositionSource = control.shipPosition_m ? "request.control.shipPosition_m" : "analytic_accelerating_leg";
  const entries: InstantaneousShipViewEntry[] = request.catalog.map((entry) => {
    const separation = sub(entry.position_m, shipPosition);
    const inputDistance = norm(entry.position_m);
    const inputDirection = directionUnitFor(entry.position_m);
    const inputParallel = dot(separation, direction);
    const parallelVec = scale(direction, inputParallel);
    const perpendicularVec = sub(separation, parallelVec);
    const outputParallel = inputParallel / gamma;
    const shipFramePosition = add(perpendicularVec, scale(direction, outputParallel));
    return {
      id: entry.id,
      label: entry.label,
      inputPosition_m: entry.position_m,
      inputDistance_m: inputDistance,
      inputDirectionUnit: inputDirection,
      shipFramePosition_m: shipFramePosition,
      separationFromShip_m: separation,
      inputParallel_m: inputParallel,
      outputParallel_m: outputParallel,
      perpendicularDistance_m: norm(perpendicularVec),
      shipFrameDistance_m: norm(shipFramePosition),
    };
  });

  return {
    ...baseProjectionShape(request, {
      observerFamily: "ship_comoving",
      semantics: "instantaneous_comoving_projection",
      provenance_class: "proxy",
      projection_contract:
        "At one declared proper-time sample, split Sun-frame separation vectors into components parallel and perpendicular to the ship velocity, then contract only the parallel component by 1/gamma.",
      claim_boundary:
        "This map is an instantaneous comoving projection under a declared control law. It is not a stitched global Euclidean atlas and not a warp-derived geometry claim.",
    }),
    entries,
    metadata: {
      trajectory_model: "flat_sr_constant_proper_acceleration",
      properAcceleration_m_s2: acceleration,
      currentProperTime_s: properTime,
      rapidity,
      beta,
      gamma,
      direction,
      shipPosition_m: shipPosition,
      shipPositionSource,
      projectionFormula:
        "Delta r'_parallel = Delta r_parallel / gamma; Delta r'_perp = Delta r_perp",
    },
  };
};

const buildWarpUnavailableProjection = (
  request: RelativisticMapProjectionRequest,
): UnavailableRelativisticMapProjection =>
  unavailableProjection(request, {
    observerFamily: request.projectionKind === "instantaneous_ship_view" ? "ship_comoving" : "grid_static",
    semantics:
      request.projectionKind === "instantaneous_ship_view"
        ? "instantaneous_comoving_projection"
        : "outer_reference_only",
    fail_id: "RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED",
    required:
      request.projectionKind === "instantaneous_ship_view"
        ? [
            "warpWorldline.certified",
            "warpWorldline.samples",
            "warpWorldline.dtau_dt",
            "warpWorldline.normalizationResidual",
          ]
        : [
            "warpRouteTimeWorldline.certified",
            "warpRouteTimeWorldline.progressionSamples",
          ],
    reason:
      request.sourceModel === "warp_worldline_route_time"
        ? "Warp-derived route-time map projections remain unavailable until a certified bounded route-time worldline contract is emitted from the actual solve-backed transport chain."
        : "Warp-derived relativistic map projections remain unavailable until a certified warp worldline contract is emitted from the actual solve.",
    projection_contract:
      request.sourceModel === "warp_worldline_route_time"
        ? "Warp-derived route-time map projections require a certified bounded route-time worldline contract and must fail closed until it exists."
        : "Warp-derived map projections require a certified bounded warp worldline contract and must fail closed until it exists.",
  });

const buildWarpRouteTimeDeferredProjection = (
  request: RelativisticMapProjectionRequest,
): UnavailableRelativisticMapProjection =>
  unavailableProjection(request, {
    observerFamily: "grid_static",
    semantics: "outer_reference_only",
    fail_id: "RELATIVISTIC_MAP_WARP_ROUTE_TIME_DEFERRED",
    required:
      isCertifiedWarpMissionTimeEstimatorContract(request.warpMissionTimeEstimator)
        ? ["explicit_catalog_eta_projection_contract"]
        : isCertifiedWarpRouteTimeWorldlineContract(request.warpRouteTimeWorldline)
          ? ["mission_time_estimator.contract", "target_distance_contract"]
          : ["warpRouteTimeWorldline.progressionSamples"],
    reason: isCertifiedWarpMissionTimeEstimatorContract(request.warpMissionTimeEstimator)
      ? "A bounded NHM2 mission-time estimator is present, but catalog-facing relativistic map projections remain deferred until an explicit ETA/map projection contract is certified. This route-map surface stays fail-closed."
      : isCertifiedWarpRouteTimeWorldlineContract(request.warpRouteTimeWorldline)
        ? "A bounded NHM2 route-time worldline contract is present, but catalog-facing route projections remain deferred until a mission-time estimator and target-distance contract are certified."
        : "The bounded NHM2 local transport chain has not yet emitted a certified route-time worldline contract. Route-time warp projections remain fail-closed.",
    projection_contract: isCertifiedWarpRouteTimeWorldlineContract(
      request.warpRouteTimeWorldline,
    )
      ? isCertifiedWarpMissionTimeEstimatorContract(request.warpMissionTimeEstimator)
        ? "A bounded target-coupled mission-time estimator exists, but this route-map projection surface is still not an ETA contract. Catalog-facing route maps remain fail-closed until a later explicit route-map ETA layer is certified."
        : "A bounded route-time worldline exists for local probe progression only. Catalog-facing route maps and ETA-style outputs remain fail-closed until a later mission-time layer is certified."
      : "This patch activates only bounded local transport surfaces. Route-time warp projections remain fail-closed until a certified route-time worldline contract exists.",
    metadata: isCertifiedWarpRouteTimeWorldlineContract(request.warpRouteTimeWorldline)
      ? {
          routeTimeContractVersion: request.warpRouteTimeWorldline.contractVersion,
          routeModelId: request.warpRouteTimeWorldline.routeModelId,
          routeParameterName: request.warpRouteTimeWorldline.routeParameterName,
          progressionSampleCount:
            request.warpRouteTimeWorldline.progressionSampleCount,
          coordinateTimeSummary:
            request.warpRouteTimeWorldline.coordinateTimeSummary,
          properTimeSummary: request.warpRouteTimeWorldline.properTimeSummary,
          routeTimeStatus: request.warpRouteTimeWorldline.routeTimeStatus,
          nextEligibleProducts:
            request.warpRouteTimeWorldline.nextEligibleProducts,
          missionTimeEstimatorSummary: isCertifiedWarpMissionTimeEstimatorContract(
            request.warpMissionTimeEstimator,
          )
            ? {
                contractVersion: request.warpMissionTimeEstimator.contractVersion,
                estimatorModelId: request.warpMissionTimeEstimator.estimatorModelId,
                targetId: request.warpMissionTimeEstimator.targetId,
                targetName: request.warpMissionTimeEstimator.targetName,
                targetFrame: request.warpMissionTimeEstimator.targetFrame,
                coordinateTimeEstimate:
                  request.warpMissionTimeEstimator.coordinateTimeEstimate,
                properTimeEstimate:
                  request.warpMissionTimeEstimator.properTimeEstimate,
                routeTimeStatus: request.warpMissionTimeEstimator.routeTimeStatus,
                nonClaims: request.warpMissionTimeEstimator.nonClaims,
              }
            : null,
          missionTimeComparisonSummary: isCertifiedWarpMissionTimeComparisonContract(
            request.warpMissionTimeComparison,
          )
            ? {
                contractVersion: request.warpMissionTimeComparison.contractVersion,
                comparisonModelId: request.warpMissionTimeComparison.comparisonModelId,
                targetId: request.warpMissionTimeComparison.targetId,
                targetName: request.warpMissionTimeComparison.targetName,
                targetFrame: request.warpMissionTimeComparison.targetFrame,
                warpCoordinateTimeEstimate:
                  request.warpMissionTimeComparison.warpCoordinateTimeEstimate,
                warpProperTimeEstimate:
                  request.warpMissionTimeComparison.warpProperTimeEstimate,
                classicalReferenceTimeEstimate:
                  request.warpMissionTimeComparison.classicalReferenceTimeEstimate,
                comparisonInterpretationStatus:
                  request.warpMissionTimeComparison.comparisonMetrics
                    .interpretationStatus,
                properMinusCoordinateSeconds:
                  request.warpMissionTimeComparison.comparisonMetrics
                    .properMinusCoordinate_seconds,
                properMinusClassicalSeconds:
                  request.warpMissionTimeComparison.comparisonMetrics
                    .properMinusClassical_seconds,
                comparisonReadiness:
                  request.warpMissionTimeComparison.comparisonReadiness,
                deferredComparators:
                  request.warpMissionTimeComparison.deferredComparators,
                nonClaims: request.warpMissionTimeComparison.nonClaims,
              }
            : null,
          nonClaims: request.warpRouteTimeWorldline.nonClaims,
        }
      : { routeTimeStatus: "deferred" },
  });

const buildWarpLocalComovingProjection = (
  request: RelativisticMapProjectionRequest & { projectionKind: "instantaneous_ship_view" },
): RelativisticMapProjectionResult => {
  if (!isCertifiedWarpWorldlineContract(request.warpWorldline)) {
    return buildWarpUnavailableProjection(request);
  }

  const sample = resolveWarpWorldlineRepresentativeSample(request.warpWorldline);
  if (!sample) {
    return buildWarpUnavailableProjection(request);
  }

  const transportVelocity =
    sample.effectiveTransportVelocityCoord ??
    computeWarpWorldlineEffectiveTransportVelocityCoord({
      coordinateVelocity: sample.coordinateVelocity,
      betaCoord: sample.betaCoord,
    });
  const speed = Math.min(norm(transportVelocity), 0.999999999999);
  const gamma = 1 / Math.sqrt(Math.max(1e-12, 1 - speed * speed));
  const direction = speed > 0 ? scale(transportVelocity, 1 / speed) : normalizeDirection([1, 0, 0]);
  const shipPosition = sample.position_m;
  const entries: InstantaneousShipViewEntry[] = request.catalog.map((entry) => {
    const separation = sub(entry.position_m, shipPosition);
    const inputDistance = norm(entry.position_m);
    const inputDirection = directionUnitFor(entry.position_m);
    const inputParallel = dot(separation, direction);
    const parallelVec = scale(direction, inputParallel);
    const perpendicularVec = sub(separation, parallelVec);
    const outputParallel = inputParallel / gamma;
    const shipFramePosition = add(perpendicularVec, scale(direction, outputParallel));
    return {
      id: entry.id,
      label: entry.label,
      inputPosition_m: entry.position_m,
      inputDistance_m: inputDistance,
      inputDirectionUnit: inputDirection,
      shipFramePosition_m: shipFramePosition,
      separationFromShip_m: separation,
      inputParallel_m: inputParallel,
      outputParallel_m: outputParallel,
      perpendicularDistance_m: norm(perpendicularVec),
      shipFrameDistance_m: norm(shipFramePosition),
    };
  });

  return {
    ...baseProjectionShape(request, {
      observerFamily: "ship_comoving",
      semantics: "instantaneous_comoving_projection",
      provenance_class: "solve_backed",
      projection_contract:
        "At one certified representative NHM2 worldline sample from the bounded local shell-cross family, split catalog separations into components parallel and perpendicular to the effective transport velocity and contract only the parallel component by 1/gamma.",
      claim_boundary:
        "This is a bounded local-comoving projection from a certified representative warp worldline sample within the shell-cross family. It is not a route-time map, mission-time estimator, speed certificate, cruise envelope, or Lane A proof surface.",
    }),
    entries,
    metadata: {
      trajectory_model: "warp_worldline_bounded_local_comoving",
      worldlineContractVersion: request.warpWorldline.contractVersion,
      worldlineStatus: request.warpWorldline.status,
      sourceSurface: request.warpWorldline.sourceSurface.surfaceId,
      validityRegimeId: request.warpWorldline.validityRegime.regimeId,
      representativeSampleId: request.warpWorldline.representativeSampleId,
      representativeSampleRole: sample.sampleRole,
      sampleGeometryFamilyId: request.warpWorldline.sampleGeometry.familyId,
      transportVariationStatus: request.warpWorldline.transportVariation.transportVariationStatus,
      transportInformativenessStatus: request.warpWorldline.transportInformativenessStatus,
      sampleFamilyAdequacy: request.warpWorldline.sampleFamilyAdequacy,
      flatnessInterpretation: request.warpWorldline.flatnessInterpretation,
      certifiedTransportMeaning: request.warpWorldline.certifiedTransportMeaning,
      eligibleNextProducts: request.warpWorldline.eligibleNextProducts,
      routeTimeStatus: "deferred",
      shipPosition_m: shipPosition,
      coordinateVelocity: sample.coordinateVelocity,
      betaCoord: sample.betaCoord,
      effectiveTransportVelocityCoord: transportVelocity,
      transportInterpretation: request.warpWorldline.transportInterpretation,
      dtau_dt: sample.dtau_dt,
      normalizationResidual: sample.normalizationResidual,
      gamma,
      direction,
      projectionFormula:
        "Delta r'_parallel = Delta r_parallel / gamma_eff; Delta r'_perp = Delta r_perp",
      claimBoundary: request.warpWorldline.claimBoundary,
    },
  };
};

export function buildRelativisticMapProjection(
  request: RelativisticMapProjectionRequest,
): RelativisticMapProjectionResult {
  if (request.sourceModel === "flat_sr_flip_burn_control") {
    if (!request.control) {
      return unavailableProjection(request, {
        observerFamily: request.projectionKind === "instantaneous_ship_view" ? "ship_comoving" : "grid_static",
        semantics:
          request.projectionKind === "instantaneous_ship_view"
            ? "instantaneous_comoving_projection"
            : "outer_reference_only",
        fail_id: "RELATIVISTIC_MAP_CONTROL_MISSING",
        required: ["control.properAcceleration_m_s2"],
        reason: "Flat-SR relativistic map projections require a declared proper-acceleration control.",
        projection_contract:
          "Flat-SR projections require an explicit acceleration control and must fail closed when it is absent.",
      });
    }
    return request.projectionKind === "instantaneous_ship_view"
      ? buildInstantaneousShipViewMap(request as RelativisticMapProjectionRequest & { projectionKind: "instantaneous_ship_view" }, request.control)
      : buildSunCenteredAccessibilityMap(request as RelativisticMapProjectionRequest & { projectionKind: "sun_centered_accessibility" }, request.control);
  }

  if (request.sourceModel === "warp_worldline_local_comoving") {
    return request.projectionKind === "instantaneous_ship_view"
      ? buildWarpLocalComovingProjection(
          request as RelativisticMapProjectionRequest & {
            projectionKind: "instantaneous_ship_view";
          },
        )
      : buildWarpRouteTimeDeferredProjection(request);
  }

  if (
    request.sourceModel === "warp_worldline_route_time" &&
    (isCertifiedWarpRouteTimeWorldlineContract(request.warpRouteTimeWorldline) ||
      isCertifiedWarpWorldlineContract(request.warpWorldline))
  ) {
    return buildWarpRouteTimeDeferredProjection(request);
  }

  return buildWarpUnavailableProjection(request);
}
