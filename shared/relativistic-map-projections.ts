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
  provenance_class: "proxy" | "inferred";
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
    | "RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED";
  required?: string[];
  reason: string;
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
      | "RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED";
    required?: string[];
    reason: string;
    projection_contract: string;
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
            "warpWorldline.position_m",
            "warpWorldline.dxdt",
            "warp.metricAdapter.alpha",
            "warp.metricAdapter.beta",
            "warp.metricAdapter.gammaDiag",
          ]
        : [
            "warpWorldline.routeSamples",
            "warpWorldline.dtau_dt",
            "warp.metricAdapter.alpha",
            "warp.metricAdapter.beta",
            "warp.metricAdapter.gammaDiag",
          ],
    reason:
      "Warp-derived relativistic map projections remain unavailable until the route-time/worldline contract is computed from the actual warp solution.",
    projection_contract:
      "Warp-derived map projections require a resolved worldline contract and must fail closed until those fields exist.",
  });

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

  return buildWarpUnavailableProjection(request);
}
