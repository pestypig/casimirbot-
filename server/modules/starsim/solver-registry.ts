import { canonicalizeStarSimRequest } from "./canonicalize";
import { deriveObsClass, assessCompleteness, derivePhysDepthSummary } from "./completeness";
import { scoreLanes } from "./congruence";
import type {
  ExecutionKind,
  PhysClass,
  RequestedLane,
  StarSimRequest,
  StarSimResponse,
  StarSimLaneResult,
} from "./contract";
import { runActivitySolarLane } from "./lanes/activity-solar";
import { runBarycenterAnalyticLane } from "./lanes/barycenter-analytic";
import { runClassificationLane } from "./lanes/classification";
import { runOscillationGyreLane } from "./lanes/oscillation-gyre";
import { runStructureMesaLane, type StarSimLaneExecutionMode } from "./lanes/structure-mesa";
import { runStructureReducedLane } from "./lanes/structure-reduced";
import { hashStableJson } from "../../utils/information-boundary";

type LaneRunnerContext = {
  executionMode: StarSimLaneExecutionMode;
  resolvedLanes: Partial<Record<RequestedLane, StarSimLaneResult>>;
};

type LaneRunner = (
  request: ReturnType<typeof canonicalizeStarSimRequest>,
  context: LaneRunnerContext,
) => Promise<StarSimLaneResult> | StarSimLaneResult;

const registry: Record<RequestedLane, LaneRunner> = {
  classification: (request) => runClassificationLane(request),
  structure_1d: (request) => runStructureReducedLane(request),
  structure_mesa: (request, context) => runStructureMesaLane(request, { executionMode: context.executionMode }),
  oscillation_gyre: (request, context) =>
    runOscillationGyreLane(request, {
      executionMode: context.executionMode,
      resolvedLanes: context.resolvedLanes,
    }),
  activity: (request) => runActivitySolarLane(request),
  barycenter: (request) => runBarycenterAnalyticLane(request),
};

const laneLabelByRequested: Record<RequestedLane, string> = {
  classification: "Stellar classification",
  structure_1d: "Reduced-order 1D structure",
  structure_mesa: "MESA-backed 1D structure",
  oscillation_gyre: "GYRE oscillation solver",
  activity: "Solar activity diagnostics",
  barycenter: "Analytic barycenter state",
};

const laneExecutionKindByRequested: Record<RequestedLane, ExecutionKind> = {
  classification: "fit",
  structure_1d: "analytic",
  structure_mesa: "simulation",
  oscillation_gyre: "simulation",
  activity: "replay",
  barycenter: "analytic",
};

const lanePhysClassByRequested: Record<RequestedLane, PhysClass> = {
  classification: "P0",
  structure_1d: "P1",
  structure_mesa: "P2",
  oscillation_gyre: "P3",
  activity: "P4",
  barycenter: "P2",
};

const laneOrder: RequestedLane[] = [
  "classification",
  "structure_1d",
  "structure_mesa",
  "oscillation_gyre",
  "activity",
  "barycenter",
];

const availabilityFromStatus = (status: StarSimLaneResult["status"]): "available" | "unavailable" =>
  status === "available" ? "available" : "unavailable";

async function runLaneSafely(
  canonical: ReturnType<typeof canonicalizeStarSimRequest>,
  requestedLane: RequestedLane,
  context: LaneRunnerContext,
): Promise<StarSimLaneResult> {
  try {
    const result = await registry[requestedLane](canonical, context);
    return {
      ...result,
      availability: availabilityFromStatus(result.status),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      lane_id: `${requestedLane}_failed`,
      requested_lane: requestedLane,
      solver_id: `star-sim.${requestedLane}.failed/1`,
      label: laneLabelByRequested[requestedLane],
      availability: "unavailable",
      status: "failed",
      status_reason: "lane_execution_error",
      execution_kind: laneExecutionKindByRequested[requestedLane],
      maturity: "reduced_order",
      phys_class: lanePhysClassByRequested[requestedLane],
      assumptions: ["Lane execution raised an internal error and was isolated by the adapter."],
      domain_validity: {},
      observables_used: [],
      inferred_params: {},
      residuals_sigma: {},
      falsifier_ids: [`STAR_SIM_${requestedLane.toUpperCase()}_EXECUTION_FAILED`],
      tree_dag: {
        claim_id: `claim:star-sim:${requestedLane}:failed`,
        parent_claim_ids: [],
        equation_refs: [],
        evidence_refs: canonical.evidence_refs,
      },
      result: {
        error: message,
      },
      evidence_fit: 0,
      domain_penalty: 0,
      note: "Lane failure was isolated so the adapter could still return the other lanes.",
    };
  }
}

export async function runStarSim(
  request: StarSimRequest,
  options?: {
    executionMode?: StarSimLaneExecutionMode;
  },
): Promise<StarSimResponse> {
  const canonical = canonicalizeStarSimRequest(request);
  const completeness = assessCompleteness(canonical);
  const obsClass = deriveObsClass(canonical);
  const executionMode = options?.executionMode ?? "sync";
  const resolvedLanes: Partial<Record<RequestedLane, StarSimLaneResult>> = {};
  const requestedLanes = [...canonical.requested_lanes].sort(
    (left, right) => laneOrder.indexOf(left) - laneOrder.indexOf(right),
  );
  const lanes: StarSimLaneResult[] = [];
  for (const lane of requestedLanes) {
    const result = await runLaneSafely(canonical, lane, {
      executionMode,
      resolvedLanes,
    });
    resolvedLanes[lane] = result;
    lanes.push(result);
  }
  const scored = scoreLanes(lanes);
  const physDepth = derivePhysDepthSummary(scored.lanes);
  const unavailableRequested = scored.lanes
    .filter((lane) => lane.status === "unavailable" || lane.status === "failed")
    .map((lane) => lane.requested_lane);
  const solverManifest = {
    requested_lanes: canonical.requested_lanes,
    strict_lanes: canonical.strict_lanes,
    benchmark_case_id: canonical.benchmark_case_id,
    fit_profile_id: canonical.fit_profile_id,
    fit_constraints: canonical.fit_constraints,
    physics_flags: canonical.physics_flags,
    lanes: scored.lanes.map((lane) => ({
      lane_id: lane.lane_id,
      requested_lane: lane.requested_lane,
      solver_id: lane.solver_id,
      status: lane.status,
      execution_kind: lane.execution_kind,
      maturity: lane.maturity,
      phys_class: lane.phys_class,
    })),
  };

  return {
    schema_version: "star-sim-v1",
    meta: {
      contract_version: "star-sim-v1",
      normalization_version: "star-sim.canonicalize/4",
      solver_manifest_version: "star-sim.registry/6",
      congruence_version: "star-sim.harmonic/2",
      claim_identity_version: "star-sim.claims/3",
      deterministic_request_hash: hashStableJson(request),
      canonical_observables_hash: hashStableJson(canonical.fields),
      solver_manifest_hash: hashStableJson(solverManifest),
    },
    target: canonical.target,
    taxonomy: {
      obs_class: obsClass,
      phys_class: physDepth.max_lane_depth,
      requested_phys_class: physDepth.requested_lane_depth,
      requested_phys_class_status: physDepth.requested_lane_status,
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
