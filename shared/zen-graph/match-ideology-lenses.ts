import type { IdeologyNodeMatchV1 } from "../ideology-context-reflection";
import type { IdeologyGraph, IdeologyGraphNode } from "./ideology-graph-types";
import {
  findIdeologyActionGates,
  findIdeologyOuterEdgeLenses,
  getIdeologyPathToRoot,
} from "./traverse-ideology-graph";

export type IdeologyLensMatchSet = {
  exact: IdeologyNodeMatchV1[];
  likely: IdeologyNodeMatchV1[];
  inferred_lenses: IdeologyNodeMatchV1[];
};

const WORD_PATTERN = /[a-z0-9]+/g;
const EXACT_NODE_ID_SCORE = 1;
const EXACT_LABEL_OR_ALIAS_SCORE = 0.9;
const TAG_ACTION_REFERENCE_SCORE = 0.75;
const LIKELY_KEYWORD_OVERLAP_SCORE = 0.5;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(value: string): Set<string> {
  return new Set(normalize(value).match(WORD_PATTERN) ?? []);
}

function phraseMatches(text: string, phrase: string): boolean {
  const normalizedPhrase = normalize(phrase);
  return normalizedPhrase.length > 0 && ` ${text} `.includes(` ${normalizedPhrase} `);
}

function idMatches(inputText: string, nodeId: string): boolean {
  const escapedNodeId = nodeId.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapedNodeId}([^a-z0-9]|$)`, "i").test(inputText);
}

function stringArrayFromUnknown(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function nodeAliases(node: IdeologyGraphNode): string[] {
  return [...stringArrayFromUnknown(node.aliases), ...stringArrayFromUnknown(node.alias)];
}

function referenceStrings(node: IdeologyGraphNode): string[] {
  return (node.references ?? []).flatMap((reference) =>
    [reference.id, reference.kind, reference.title, reference.path, reference.url].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    ),
  );
}

function actionLabels(node: IdeologyGraphNode): string[] {
  return (node.actions ?? []).map((action) => action.label).filter((label) => label.trim().length > 0);
}

function nodeKeywords(node: IdeologyGraphNode): Set<string> {
  return tokenize(
    [
      node.id,
      node.slug,
      node.title,
      node.excerpt,
      node.summary,
      ...(node.tags ?? []),
      ...nodeAliases(node),
      ...referenceStrings(node),
      ...actionLabels(node),
    ]
      .filter((value): value is string => typeof value === "string")
      .join(" "),
  );
}

function toMatch(node: IdeologyGraphNode, score: number, reasons: string[], graph: IdeologyGraph): IdeologyNodeMatchV1 {
  return {
    nodeId: node.id,
    label: node.title,
    score,
    reasons,
    ...(node.tags ? { tags: node.tags } : {}),
    pathToRoot: getIdeologyPathToRoot(graph, node.id),
  };
}

function mergeBestMatch(
  matchesByNode: Map<string, IdeologyNodeMatchV1>,
  node: IdeologyGraphNode,
  score: number,
  reasons: string[],
  graph: IdeologyGraph,
): void {
  const existing = matchesByNode.get(node.id);
  if (!existing || score > existing.score) {
    matchesByNode.set(node.id, toMatch(node, score, reasons, graph));
    return;
  }
  if (existing.score === score) {
    existing.reasons = Array.from(new Set([...existing.reasons, ...reasons]));
  }
}

function gateTerms(graph: IdeologyGraph): string[] {
  const policy = graph.actionGatePolicy;
  return [
    ...Object.keys(policy?.hard_fail_ids ?? {}),
    ...Object.values(policy?.hard_fail_ids ?? {}),
    ...(policy?.covered_action_tags ?? []),
    ...(policy?.legal_key_tags ?? []),
    ...(policy?.ethos_key_tags ?? []),
    ...(policy?.jurisdiction_floor_ok_tags ?? []),
  ];
}

export function matchIdeologyLenses(graph: IdeologyGraph, inputText: string): IdeologyLensMatchSet {
  const normalizedText = normalize(inputText);
  const rawInputText = inputText.toLowerCase();
  const inputTokens = tokenize(inputText);
  const exactByNode = new Map<string, IdeologyNodeMatchV1>();
  const likelyByNode = new Map<string, IdeologyNodeMatchV1>();

  for (const node of graph.nodes) {
    if (idMatches(rawInputText, node.id)) {
      mergeBestMatch(exactByNode, node, EXACT_NODE_ID_SCORE, ["exact node id match"], graph);
      continue;
    }

    if (phraseMatches(normalizedText, node.title)) {
      mergeBestMatch(exactByNode, node, EXACT_LABEL_OR_ALIAS_SCORE, ["exact label match"], graph);
      continue;
    }

    const alias = nodeAliases(node).find((entry) => phraseMatches(normalizedText, entry));
    if (alias) {
      mergeBestMatch(exactByNode, node, EXACT_LABEL_OR_ALIAS_SCORE, [`alias match: ${alias}`], graph);
      continue;
    }

    const tag = (node.tags ?? []).find((entry) => phraseMatches(normalizedText, entry));
    if (tag) {
      mergeBestMatch(exactByNode, node, TAG_ACTION_REFERENCE_SCORE, [`tag match: ${tag}`], graph);
      continue;
    }

    const actionLabel = actionLabels(node).find((entry) => phraseMatches(normalizedText, entry));
    if (actionLabel) {
      mergeBestMatch(exactByNode, node, TAG_ACTION_REFERENCE_SCORE, [`action label match: ${actionLabel}`], graph);
      continue;
    }

    const reference = referenceStrings(node).find((entry) => phraseMatches(normalizedText, entry));
    if (reference) {
      mergeBestMatch(exactByNode, node, TAG_ACTION_REFERENCE_SCORE, [`reference match: ${reference}`], graph);
      continue;
    }

    const keywords = nodeKeywords(node);
    const overlap = [...inputTokens].filter((token) => token.length > 3 && keywords.has(token));
    if (overlap.length >= 2) {
      mergeBestMatch(
        likelyByNode,
        node,
        LIKELY_KEYWORD_OVERLAP_SCORE,
        [`likely keyword overlap: ${overlap.slice(0, 5).join(", ")}`],
        graph,
      );
    }
  }

  for (const gateTerm of gateTerms(graph)) {
    if (!phraseMatches(normalizedText, gateTerm)) continue;
    for (const gateNode of findIdeologyActionGates(graph)) {
      mergeBestMatch(exactByNode, gateNode, TAG_ACTION_REFERENCE_SCORE, [`gate term match: ${gateTerm}`], graph);
    }
  }

  const exact = [...exactByNode.values()].sort((a, b) => b.score - a.score || a.nodeId.localeCompare(b.nodeId));
  const exactIds = new Set(exact.map((match) => match.nodeId));
  const likely = [...likelyByNode.values()]
    .filter((match) => !exactIds.has(match.nodeId))
    .sort((a, b) => b.score - a.score || a.nodeId.localeCompare(b.nodeId));

  const outerEdgeIds = new Set(findIdeologyOuterEdgeLenses(graph).map((node) => node.id));
  const inferred_lenses = [...exact, ...likely]
    .filter((match) => outerEdgeIds.has(match.nodeId))
    .map((match) => ({
      ...match,
      reasons: Array.from(new Set([...match.reasons, "outer-edge lens activation"])),
    }));

  return { exact, likely, inferred_lenses };
}
