import { canonicalizeStarSimRequest } from "./canonicalize";
import { deriveObsClass, assessCompleteness, derivePhysClass } from "./completeness";
import { scoreLanes } from "./congruence";
import type {
  RequestedLane,
  StarSimRequest,
  StarSimResponse,
  StarSimLaneResult,
} from "./contract";
import { runActivitySolarLane } from "./lanes/activity-solar";
import { runBarycenterAnalyticLane } from "./lanes/barycenter-analytic";
import { runClassificationLane } from "./lanes/classification";
import { runStructureReducedLane } from "./lanes/structure-reduced";

type LaneRunner = (request: ReturnType<typeof canonicalizeStarSimRequest>) => Promise<StarSimLaneResult> | StarSimLaneResult;

const registry: Record<RequestedLane, LaneRunner> = {
  classification: runClassificationLane,
  structure_1d: runStructureReducedLane,
  activity: runActivitySolarLane,
  barycenter: runBarycenterAnalyticLane,
};

export async function runStarSim(request: StarSimRequest): Promise<StarSimResponse> {
  const canonical = canonicalizeStarSimRequest(request);
  const completeness = assessCompleteness(canonical);
  const obsClass = deriveObsClass(canonical);

  const lanes = await Promise.all(canonical.requested_lanes.map((lane) => registry[lane](canonical)));
  const scored = scoreLanes(lanes);
  const physClass = derivePhysClass(scored.lanes);
  const unavailableRequested = scored.lanes
    .filter((lane) => lane.availability !== "available")
    .map((lane) => lane.requested_lane);

  return {
    schema_version: "star-sim-v1",
    target: canonical.target,
    taxonomy: {
      obs_class: obsClass,
      phys_class: physClass,
    },
    canonical_observables: canonical.fields,
    completeness,
    solver_plan: {
      requested_lanes: canonical.requested_lanes,
      executed_lanes: scored.lanes.map((lane) => lane.lane_id),
      unavailable_requested_lanes: unavailableRequested,
    },
    lanes: scored.lanes,
    congruence: scored.congruence,
  };
}
