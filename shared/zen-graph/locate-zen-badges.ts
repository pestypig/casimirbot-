import {
  IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
  type IdeologyContextReflectionInputKindV1,
  type IdeologyNodeMatchV1,
} from "../ideology-context-reflection";
import {
  buildZenBadgeLocatorV1,
  type ZenBadgeLocatedBindingV1,
  type ZenBadgeLocationV1,
  type ZenBadgeLocatorMatchTypeV1,
  type ZenBadgeLocatorV1,
} from "../zen-badge-locator";
import type { IdeologyGraph } from "./ideology-graph-types";
import { buildProbabilityTerrainV1 } from "../probability-terrain";
import { buildZenBadgeComparisonSeed } from "./build-zen-badge-comparison-seed";
import { matchIdeologyLenses } from "./match-ideology-lenses";
import { getIdeologyNodeById, getIdeologyPathToRoot } from "./traverse-ideology-graph";
import { getZenWisdomPrinciple, ZEN_WISDOM_ROOT_ID } from "./wisdom-principles";

export type LocateZenBadgesInput = {
  kind: IdeologyContextReflectionInputKindV1;
  text?: string;
  summary?: string;
  refs?: string[];
  generatedAt?: string;
  locatorId?: string;
};

function labelize(value: string): string {
  return value.replace(/[_-]/g, " ");
}

function proceduralToken(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_");
}

function summarizeInput(input: LocateZenBadgesInput): string {
  return [input.summary, input.text].filter((value): value is string => Boolean(value?.trim())).join("\n").trim();
}

function matchTypeFromReasons(reasons: string[]): ZenBadgeLocatorMatchTypeV1 {
  if (reasons.some((reason) => reason.startsWith("exact node id"))) return "node_id";
  if (reasons.some((reason) => reason.startsWith("exact label"))) return "label";
  if (reasons.some((reason) => reason.startsWith("alias match"))) return "alias";
  if (reasons.some((reason) => reason.startsWith("gate term match"))) return "gate_term";
  if (reasons.some((reason) => reason.startsWith("tag match"))) return "tag";
  if (reasons.some((reason) => reason.startsWith("action label match"))) return "action_label";
  if (reasons.some((reason) => reason.startsWith("reference match"))) return "reference";
  if (reasons.some((reason) => reason.startsWith("likely keyword overlap"))) return "keyword_overlap";
  if (reasons.some((reason) => reason === "outer-edge lens activation")) return "outer_edge_inference";
  return "keyword_overlap";
}

function reasonCodesForMatch(match: IdeologyNodeMatchV1, matchType: ZenBadgeLocatorMatchTypeV1): string[] {
  return Array.from(
    new Set([
      "zen_badge_locator",
      `match_type:${matchType}`,
      ...match.reasons.map((reason) => reason.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")),
    ]),
  );
}

function proceduralExpressionForMatch(match: IdeologyNodeMatchV1, matchType: ZenBadgeLocatorMatchTypeV1): string {
  if (match.nodeId === ZEN_WISDOM_ROOT_ID) {
    return `objective.${ZEN_WISDOM_ROOT_ID} receives preset.wisdom-foundation`;
  }

  const principle = getZenWisdomPrinciple(match.nodeId);
  if (principle) {
    return `principle.${proceduralToken(principle.id)} ${labelize(
      principle.procedureOperator,
    )} result.procedural_posture`;
  }

  const tags = (match.tags ?? []).map((tag) => tag.toLowerCase());
  const tagText = tags.join(" ");
  if (matchType === "gate_term" || /\b(covered-action|covered_action|legal-key|ethos-key|approval|gate)\b/.test(tagText)) {
    return `gate.${proceduralToken(match.nodeId)} requires result.procedural_posture`;
  }
  if (/\b(speech|posture|constraint|right_speech|non-harm|repair|restraint)\b/.test(tagText)) {
    return `lens.${proceduralToken(match.nodeId)} constrains result.procedural_posture`;
  }
  if (/\b(balance|yin|yang|interdependence)\b/.test(tagText)) {
    return `lens.${proceduralToken(match.nodeId)} balances result.procedural_posture`;
  }
  if (matchType === "outer_edge_inference" || /\b(trait|lens|outer_edge|outer-edge)\b/.test(tagText)) {
    return `lens.${proceduralToken(match.nodeId)} supports result.procedural_posture`;
  }
  return `lens.${proceduralToken(match.nodeId)} supports result.procedural_posture`;
}

function toLocation(
  graph: IdeologyGraph,
  match: IdeologyNodeMatchV1,
  overrideMatchType?: ZenBadgeLocatorMatchTypeV1,
): ZenBadgeLocationV1 {
  const matchType = overrideMatchType ?? matchTypeFromReasons(match.reasons);
  const pathToBinding = match.pathToRoot?.length ? match.pathToRoot : getIdeologyPathToRoot(graph, match.nodeId);
  return {
    nodeId: match.nodeId,
    label: match.label,
    confidence: match.score,
    matchType,
    pathToBinding: pathToBinding.length ? pathToBinding : [match.nodeId],
    proceduralExpression: proceduralExpressionForMatch(match, matchType),
    reasonCodes: reasonCodesForMatch(match, matchType),
    ...(match.tags ? { tags: match.tags } : {}),
  };
}

function bindingLabel(graph: IdeologyGraph, bindingId: string): string {
  const node = getIdeologyNodeById(graph, bindingId);
  if (bindingId === ZEN_WISDOM_ROOT_ID) return "Wisdom First Principles";
  return node?.title ?? labelize(bindingId);
}

function buildLocatedBindings(graph: IdeologyGraph, locations: ZenBadgeLocationV1[]): ZenBadgeLocatedBindingV1[] {
  const byPath = new Map<string, ZenBadgeLocatedBindingV1>();
  for (const location of locations) {
    const rootId = location.pathToBinding[location.pathToBinding.length - 1];
    if (!rootId) continue;
    const key = `${rootId}:${location.pathToBinding.join(">")}`;
    const existing = byPath.get(key);
    const binding: ZenBadgeLocatedBindingV1 = {
      id: rootId,
      label: bindingLabel(graph, rootId),
      bindingType: "objective_binding",
      pathNodeIds: location.pathToBinding,
      reasonCodes: Array.from(new Set(["located_path_to_binding", ...location.reasonCodes])),
      confidence: Math.max(existing?.confidence ?? 0, location.confidence),
    };
    byPath.set(key, binding);
  }
  return [...byPath.values()].sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
}

function uniqueByNodeId(locations: ZenBadgeLocationV1[]): ZenBadgeLocationV1[] {
  const best = new Map<string, ZenBadgeLocationV1>();
  for (const location of locations) {
    const existing = best.get(location.nodeId);
    if (!existing || location.confidence > existing.confidence) best.set(location.nodeId, location);
  }
  return [...best.values()].sort((a, b) => b.confidence - a.confidence || a.nodeId.localeCompare(b.nodeId));
}

function postureForLocation(location: ZenBadgeLocationV1): string {
  const expression = location.proceduralExpression.toLowerCase();
  const tags = (location.tags ?? []).map((tag) => tag.toLowerCase());
  if (expression.includes("blocks")) return "blocked_or_missing_check";
  if (
    expression.includes("requires") ||
    location.matchType === "gate_term" ||
    tags.some((tag) => tag === "covered-action" || tag === "legal-key" || tag === "ethos-key")
  ) {
    return "requires_check";
  }
  if (expression.includes("constrains") || expression.includes("balances")) {
    return "constrained_action_posture";
  }
  return "supported_action_posture";
}

function proceduralBucketForLocation(location: ZenBadgeLocationV1): string {
  const tags = (location.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => tag === "first_principle" || tag === "objective_binding")) return "first_principle";
  if (tags.some((tag) => tag === "covered-action" || tag === "legal-key" || tag === "ethos-key")) return "safeguard";
  if (tags.some((tag) => tag === "trait" || tag === "outer_edge")) return "outer_edge";
  if (location.matchType === "gate_term") return "safeguard";
  return "lens";
}

function renderChunkForLocation(graph: IdeologyGraph, location: ZenBadgeLocationV1): string {
  const rootId = location.pathToBinding[location.pathToBinding.length - 1] ?? graph.rootId;
  const depthBucket = location.pathToBinding.length <= 2 ? "root_near" : "path_deep";
  return `zen:${rootId}:${depthBucket}:${location.matchType}`;
}

function semanticChunkForLocation(location: ZenBadgeLocationV1): string {
  return `zen:${proceduralBucketForLocation(location)}:${postureForLocation(location)}:${location.matchType}`;
}

export function locateZenBadges(graph: IdeologyGraph, input: LocateZenBadgesInput): ZenBadgeLocatorV1 {
  const summary = summarizeInput(input);
  const matches = matchIdeologyLenses(graph, summary);
  const exact = uniqueByNodeId(matches.exact.map((match) => toLocation(graph, match)));
  const likely = uniqueByNodeId(matches.likely.map((match) => toLocation(graph, match)));
  const inferred = uniqueByNodeId(matches.inferred_lenses.map((match) => toLocation(graph, match, "outer_edge_inference")));
  const allLocations = uniqueByNodeId([...exact, ...likely, ...inferred]);
  const locatedBindings = buildLocatedBindings(graph, allLocations);
  const probabilityTerrain = buildProbabilityTerrainV1({
    graphKind: "zen_badge_graph",
    candidates: allLocations.map((location) => ({
      id: location.nodeId,
      weight: location.confidence,
      renderChunkId: renderChunkForLocation(graph, location),
      semanticChunkId: semanticChunkForLocation(location),
    })),
  });

  return buildZenBadgeLocatorV1({
    generatedAt: input.generatedAt,
    locatorId: input.locatorId,
    input: {
      kind: input.kind,
      summary: summary || "No input text provided.",
      ...(input.refs ? { refs: input.refs } : {}),
    },
    graph: {
      graphId: "zen-graph",
      rootId: graph.rootId,
      source: IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
    },
    locatedBadges: { exact, likely, inferred },
    probabilityTerrain,
    locatedBindings,
    comparisonSeed: buildZenBadgeComparisonSeed({ locations: allLocations, locatedBindings }),
  });
}
