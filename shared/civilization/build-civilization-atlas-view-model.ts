import type { CivilizationBoundsRoadmapV1 } from "../civilization-bounds-roadmap";
import type {
  CivilizationRouteCandidateV1,
  CivilizationTraversabilityAtlasV1,
  CivilizationTraversabilityContextV1,
  CivilizationTraversabilityRouteObjectiveV1,
} from "../civilization-traversability-atlas";
import { sortRoutesForObjective } from "./civilization-route-objectives";

export type CivilizationAtlasViewModelV1 = {
  roadmapId: string;
  atlasId: string;
  scenarioId: string;
  routeObjective: CivilizationTraversabilityRouteObjectiveV1;
  timeCursor?: string;
  traversabilityContext: CivilizationTraversabilityContextV1;
  routes: CivilizationRouteCandidateV1[];
};

export type BuildCivilizationAtlasViewModelInput = {
  roadmap: CivilizationBoundsRoadmapV1;
  atlas: CivilizationTraversabilityAtlasV1;
  selectedRouteIds?: string[];
  selectedFieldLayerIds?: string[];
  routeObjective?: CivilizationTraversabilityRouteObjectiveV1;
  timeCursor?: string;
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function lowestNamedFeasibility(route: CivilizationRouteCandidateV1): string | null {
  const entries = Object.entries(route.feasibility)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))
    .sort((left, right) => left[1] - right[1]);
  return entries[0]?.[0] ?? null;
}

function routeHasBlockingConstraint(route: CivilizationRouteCandidateV1): boolean {
  return route.constraints.some((constraint) => constraint.effect === "blocks");
}

function selectRoutes(input: BuildCivilizationAtlasViewModelInput): CivilizationRouteCandidateV1[] {
  const selectedRouteIds = new Set(input.selectedRouteIds ?? []);
  const selectedFieldLayerIds = new Set(input.selectedFieldLayerIds ?? []);
  const routes = input.atlas.routeCandidates.filter((route) => {
    if (selectedRouteIds.size > 0 && !selectedRouteIds.has(route.routeId)) return false;
    if (
      selectedFieldLayerIds.size > 0 &&
      !route.activeFieldLayerIds.some((fieldLayerId) => selectedFieldLayerIds.has(fieldLayerId))
    ) {
      return false;
    }
    return true;
  });
  return sortRoutesForObjective(routes, input.routeObjective ?? "best_observed");
}

export function buildCivilizationAtlasViewModel(
  input: BuildCivilizationAtlasViewModelInput,
): CivilizationAtlasViewModelV1 {
  const routeObjective = input.routeObjective ?? "best_observed";
  const routes = selectRoutes(input);
  const routeIds = new Set(routes.map((route) => route.routeId));
  const activeFieldLayerIds = unique(routes.flatMap((route) => route.activeFieldLayerIds));
  const transferNodeIds = unique(routes.flatMap((route) => route.transferNodeIds));
  const observedRouteIds = new Set(
    input.atlas.observedFlows
      .filter((flow) => routeIds.has(flow.routeId))
      .map((flow) => flow.routeId),
  );
  const unavailableAlternatives = input.atlas.routeCandidates
    .filter((route) => !routeIds.has(route.routeId) || routeHasBlockingConstraint(route))
    .map((route) =>
      routeHasBlockingConstraint(route)
        ? `${route.routeId}:blocked_by_constraint`
        : `${route.routeId}:not_selected_for_current_context`,
    );
  const limitingFactors = unique([
    ...routes.flatMap((route) =>
      route.constraints
        .filter((constraint) => constraint.effect === "blocks" || constraint.effect === "unknown")
        .map((constraint) => `${constraint.kind}:${constraint.refId}`),
    ),
    ...routes
      .map((route) => lowestNamedFeasibility(route))
      .filter((factor): factor is string => Boolean(factor))
      .map((factor) => `feasibility:${factor}`),
    ...input.roadmap.collaborationBounds.map((bound) => `collaboration:${bound.limitingFactor}`),
  ]);
  const selectedBadgeIds = new Set(input.roadmap.badges.map((badge) => badge.badgeId));
  const context: CivilizationTraversabilityContextV1 = {
    dependencyEdgeIds: unique(routes.map((route) => route.dependencyEdgeId)),
    routeCandidateIds: routes.map((route) => route.routeId),
    activeFieldLayerIds,
    infrastructureNodeIds: transferNodeIds,
    limitingFactors,
    unavailableAlternatives,
    theoryBadgeIds: unique([
      ...routes.flatMap((route) => route.theoryBadgeIds ?? []),
      ...input.roadmap.theoryBindings
        .filter((binding) => selectedBadgeIds.has(binding.badgeId))
        .flatMap((binding) => binding.theoryBadgeIds),
    ]),
    zenNodeIds: unique([
      ...routes.flatMap((route) => route.zenNodeIds ?? []),
      ...input.roadmap.zenBindings
        .filter((binding) => selectedBadgeIds.has(binding.badgeId))
        .flatMap((binding) => binding.zenNodeIds),
    ]),
    evidenceRefs: unique([
      input.atlas.atlasId,
      ...routes.flatMap((route) => route.evidenceRefs),
      ...input.atlas.fieldLayers
        .filter((layer) => activeFieldLayerIds.includes(layer.fieldLayerId))
        .flatMap((layer) => layer.evidenceRefs),
      ...input.atlas.observedFlows
        .filter((flow) => observedRouteIds.has(flow.routeId))
        .flatMap((flow) => flow.evidenceRefs),
    ]),
    missingEvidence: unique([
      ...input.roadmap.missingEvidence,
      ...routes.flatMap((route) => route.missingEvidence),
      ...input.atlas.fieldLayers
        .filter((layer) => activeFieldLayerIds.includes(layer.fieldLayerId))
        .flatMap((layer) => layer.missingEvidence),
      ...input.atlas.infrastructureNodes
        .filter((node) => transferNodeIds.includes(node.nodeId))
        .flatMap((node) => node.missingEvidence),
    ]),
    routeObjective,
    ...(input.timeCursor ? { timeCursor: input.timeCursor } : {}),
  };
  return {
    roadmapId: input.roadmap.roadmapId,
    atlasId: input.atlas.atlasId,
    scenarioId: input.roadmap.scenarioId,
    routeObjective,
    ...(input.timeCursor ? { timeCursor: input.timeCursor } : {}),
    traversabilityContext: context,
    routes,
  };
}
