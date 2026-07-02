import {
  CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES,
  type CivilizationRouteCandidateV1,
  type CivilizationTraversabilityRouteObjectiveV1,
} from "../civilization-traversability-atlas";

export { CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES };
export type { CivilizationTraversabilityRouteObjectiveV1 };

export function isCivilizationRouteObjective(
  value: unknown,
): value is CivilizationTraversabilityRouteObjectiveV1 {
  return (
    typeof value === "string" &&
    CIVILIZATION_TRAVERSABILITY_ROUTE_OBJECTIVES.includes(
      value as CivilizationTraversabilityRouteObjectiveV1,
    )
  );
}

function numericMetric(route: CivilizationRouteCandidateV1, objective: CivilizationTraversabilityRouteObjectiveV1): number {
  switch (objective) {
    case "fastest":
      return route.metrics.durationHours ?? Number.POSITIVE_INFINITY;
    case "lowest_energy":
      return route.metrics.energyCost ?? Number.POSITIVE_INFINITY;
    case "highest_capacity":
      return -(route.metrics.capacity ?? 0);
    case "highest_reliability":
      return -(route.metrics.reliability ?? 0);
    case "lowest_hazard_exposure":
      return route.constraints.filter((constraint) => constraint.kind === "hazard").length + (route.uncertainty ?? 0);
    case "lowest_permission_risk":
      return -(route.feasibility.jurisdictional ?? 0);
    case "best_observed":
      return -(route.feasibility.operationalEvidence ?? 0);
    default:
      return route.uncertainty ?? 1;
  }
}

export function sortRoutesForObjective(
  routes: CivilizationRouteCandidateV1[],
  objective: CivilizationTraversabilityRouteObjectiveV1 = "best_observed",
): CivilizationRouteCandidateV1[] {
  return [...routes].sort((left, right) => {
    const delta = numericMetric(left, objective) - numericMetric(right, objective);
    return delta !== 0 ? delta : left.routeId.localeCompare(right.routeId);
  });
}

export function describeRouteObjective(objective: CivilizationTraversabilityRouteObjectiveV1): string {
  switch (objective) {
    case "fastest":
      return "prioritize lower modeled or observed duration";
    case "lowest_energy":
      return "prioritize lower energy cost before speed or capacity";
    case "highest_capacity":
      return "prioritize throughput where capacity evidence exists";
    case "highest_reliability":
      return "prioritize routes with higher reliability evidence";
    case "lowest_hazard_exposure":
      return "prioritize fewer active hazard constraints and lower uncertainty";
    case "lowest_permission_risk":
      return "prioritize jurisdictional admissibility and fewer permission blockers";
    case "best_observed":
      return "prioritize routes with the strongest operational evidence";
    default:
      return "prioritize evidence-backed traversal context";
  }
}
