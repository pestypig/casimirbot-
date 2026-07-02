import {
  buildIdeologyContextReflectionV1,
  IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
  type IdeologyActivatedTraitV1,
  type IdeologyContextReflectionInputKindV1,
  type IdeologyContextReflectionV1,
} from "../ideology-context-reflection";
import { buildIdeologyOverlay } from "./build-ideology-overlay";
import {
  buildIdeologyActionGateWarnings,
  buildIdeologyRecommendedActions,
} from "./build-ideology-recommended-actions";
import type { IdeologyGraph } from "./ideology-graph-types";
import { matchIdeologyLenses } from "./match-ideology-lenses";
import { findIdeologyOuterEdgeLenses, getIdeologyPathToRoot } from "./traverse-ideology-graph";

export type ReflectIdeologyContextInput = {
  kind: IdeologyContextReflectionInputKindV1;
  text?: string;
  summary?: string;
  refs?: string[];
  generatedAt?: string;
  reflectionId?: string;
};

function normalizeInputText(input: ReflectIdeologyContextInput): string {
  return [input.summary, input.text].filter((value): value is string => Boolean(value?.trim())).join("\n").trim();
}

function buildMissingEvidence(input: ReflectIdeologyContextInput, hasMatches: boolean): string[] {
  const missing = new Set<string>();
  if (!input.refs || input.refs.length === 0) missing.add("input_refs");
  if (!hasMatches) missing.add("deterministic_ideology_lens_match");
  return [...missing];
}

export function reflectIdeologyContext(graph: IdeologyGraph, input: ReflectIdeologyContextInput): IdeologyContextReflectionV1 {
  const summary = normalizeInputText(input) || "No context supplied.";
  const matches = matchIdeologyLenses(graph, summary);
  const activeOuterEdgeIds = new Set(findIdeologyOuterEdgeLenses(graph).map((node) => node.id));
  const activated_traits: IdeologyActivatedTraitV1[] = matches.inferred_lenses
    .filter((match) => activeOuterEdgeIds.has(match.nodeId))
    .map((match) => ({
      nodeId: match.nodeId,
      label: match.label,
      confidence: match.score,
      pathToRoot: getIdeologyPathToRoot(graph, match.nodeId),
      ...(match.tags ? { tags: match.tags } : {}),
    }));

  const hasMatches = matches.exact.length > 0 || matches.likely.length > 0 || matches.inferred_lenses.length > 0;
  const actionGateWarnings = buildIdeologyActionGateWarnings(graph, matches);
  const missingEvidence = buildMissingEvidence(input, hasMatches);

  return buildIdeologyContextReflectionV1({
    generatedAt: input.generatedAt,
    reflectionId: input.reflectionId,
    graph: {
      graphId: "moral-ideology-graph",
      rootId: graph.rootId,
      source: IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
    },
    input: {
      kind: input.kind,
      summary,
      ...(input.refs ? { refs: input.refs } : {}),
    },
    matches,
    activated_traits,
    ...(actionGateWarnings.length > 0 ? { action_gate_warnings: actionGateWarnings } : {}),
    claim_boundaries: {
      diagnostic_only: true,
      avoid_character_judgment: true,
      needs_user_confirmation: true,
      ...(missingEvidence.length > 0 ? { missing_evidence: missingEvidence } : {}),
    },
    recommended_actions: buildIdeologyRecommendedActions({
      matches,
      actionGateWarnings,
      missingEvidence,
    }),
    overlay: buildIdeologyOverlay(matches),
  });
}
