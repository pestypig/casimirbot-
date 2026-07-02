import {
  IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
  type IdeologyContextReflectionV1,
  type IdeologyContextReflectionInputKindV1,
  type IdeologyNodeMatchV1,
} from "../ideology-context-reflection";
import {
  buildMoralBadgeLocatorV1,
  type MoralBadgeLocatedBindingV1,
  type MoralBadgeLocationV1,
  type MoralBadgeLocatorMatchTypeV1,
  type MoralBadgeLocatorV1,
} from "../moral-badge-locator";
import type { IdeologyGraph } from "./ideology-graph-types";
import { buildProbabilityTerrainV1 } from "../probability-terrain";
import { buildMoralBadgeComparisonSeed } from "./build-moral-badge-comparison-seed";
import { matchIdeologyLenses } from "./match-ideology-lenses";
import { getIdeologyNodeById, getIdeologyPathToRoot } from "./traverse-ideology-graph";
import { getMoralWisdomPrinciple, MORAL_WISDOM_ROOT_ID } from "./wisdom-principles";
import {
  moralRenderChunkForLocation,
  moralSemanticChunkForLocation,
} from "./moral-probability-chunks";

export type LocateMoralBadgesInput = {
  kind: IdeologyContextReflectionInputKindV1;
  text?: string;
  summary?: string;
  refs?: string[];
  reflection?: IdeologyContextReflectionV1;
  generatedAt?: string;
  locatorId?: string;
};

function labelize(value: string): string {
  return value.replace(/[_-]/g, " ");
}

function proceduralToken(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "_");
}

function summarizeInput(input: LocateMoralBadgesInput): string {
  return [input.summary, input.text].filter((value): value is string => Boolean(value?.trim())).join("\n").trim();
}

function matchTypeFromReasons(reasons: string[]): MoralBadgeLocatorMatchTypeV1 {
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

function reasonCodesForMatch(match: IdeologyNodeMatchV1, matchType: MoralBadgeLocatorMatchTypeV1): string[] {
  return Array.from(
    new Set([
      "moral_badge_locator",
      `match_type:${matchType}`,
      ...match.reasons.map((reason) => reason.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")),
    ]),
  );
}

function proceduralExpressionForMatch(match: IdeologyNodeMatchV1, matchType: MoralBadgeLocatorMatchTypeV1): string {
  if (match.nodeId === MORAL_WISDOM_ROOT_ID) {
    return `objective.${MORAL_WISDOM_ROOT_ID} receives preset.wisdom-foundation`;
  }

  const principle = getMoralWisdomPrinciple(match.nodeId);
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
  overrideMatchType?: MoralBadgeLocatorMatchTypeV1,
): MoralBadgeLocationV1 {
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
  if (bindingId === MORAL_WISDOM_ROOT_ID) return "Wisdom First Principles";
  return node?.title ?? labelize(bindingId);
}

function buildLocatedBindings(graph: IdeologyGraph, locations: MoralBadgeLocationV1[]): MoralBadgeLocatedBindingV1[] {
  const byPath = new Map<string, MoralBadgeLocatedBindingV1>();
  for (const location of locations) {
    const rootId = location.pathToBinding[location.pathToBinding.length - 1];
    if (!rootId) continue;
    const key = `${rootId}:${location.pathToBinding.join(">")}`;
    const existing = byPath.get(key);
    const binding: MoralBadgeLocatedBindingV1 = {
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

function uniqueByNodeId(locations: MoralBadgeLocationV1[]): MoralBadgeLocationV1[] {
  const best = new Map<string, MoralBadgeLocationV1>();
  for (const location of locations) {
    const existing = best.get(location.nodeId);
    if (!existing || location.confidence > existing.confidence) best.set(location.nodeId, location);
  }
  return [...best.values()].sort((a, b) => b.confidence - a.confidence || a.nodeId.localeCompare(b.nodeId));
}

export function locateMoralBadges(graph: IdeologyGraph, input: LocateMoralBadgesInput): MoralBadgeLocatorV1 {
  const summary = summarizeInput(input);
  const matches = matchIdeologyLenses(graph, summary);
  const exact = uniqueByNodeId(matches.exact.map((match) => toLocation(graph, match)));
  const likely = uniqueByNodeId(matches.likely.map((match) => toLocation(graph, match)));
  const inferred = uniqueByNodeId(matches.inferred_lenses.map((match) => toLocation(graph, match, "outer_edge_inference")));
  const allLocations = uniqueByNodeId([...exact, ...likely, ...inferred]);
  const locatedBindings = buildLocatedBindings(graph, allLocations);
  const probabilityTerrain = buildProbabilityTerrainV1({
    graphKind: "moral_badge_graph",
    candidates: allLocations.map((location) => ({
      id: location.nodeId,
      weight: location.confidence,
      renderChunkId: moralRenderChunkForLocation({ rootId: graph.rootId, location }),
      semanticChunkId: moralSemanticChunkForLocation(location),
    })),
  });

  return buildMoralBadgeLocatorV1({
    generatedAt: input.generatedAt,
    locatorId: input.locatorId,
    input: {
      kind: input.kind,
      summary: summary || "No input text provided.",
      ...(input.refs ? { refs: input.refs } : {}),
    },
    graph: {
      graphId: "moral-graph",
      rootId: graph.rootId,
      source: IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
    },
    locatedBadges: { exact, likely, inferred },
    probabilityTerrain,
    locatedBindings,
    comparisonSeed: buildMoralBadgeComparisonSeed({ locations: allLocations, locatedBindings }),
  });
}
