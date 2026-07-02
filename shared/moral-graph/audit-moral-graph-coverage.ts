import {
  MORAL_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID,
  MORAL_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION,
  type MoralGraphCoverageAuditNodeV1,
  type MoralGraphCoverageAuditSummaryV1,
  type MoralGraphCoverageAuditV1,
  type MoralGraphCoverageRecommendedPatchTypeV1,
  type MoralGraphCoverageStatusV1,
} from "../contracts/moral-graph-coverage-audit.v1";
import type { IdeologyGraph, IdeologyGraphDocument, IdeologyGraphNode } from "./ideology-graph-types";
import { buildIdeologyGraph } from "./build-ideology-graph";
import { findIdeologyActionGates } from "./traverse-ideology-graph";
import { getMoralWisdomPrinciple } from "./wisdom-principles";

const CONCEPTUAL_FIELDS = ["summary", "excerpt", "bodyMD", "tags", "references", "children", "links"] as const;

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasConceptualContent(node: IdeologyGraphNode): boolean {
  return CONCEPTUAL_FIELDS.some((field) => {
    const value = node[field];
    if (typeof value === "string") return value.trim().length > 0;
    return hasNonEmptyArray(value);
  });
}

function graphFromInput(input: IdeologyGraph | IdeologyGraphDocument): IdeologyGraph {
  if ("nodeById" in input && input.nodeById instanceof Map) return input as IdeologyGraph;
  return buildIdeologyGraph(input as IdeologyGraphDocument);
}

function orderedNodes(graph: IdeologyGraph): IdeologyGraphNode[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const ordered: IdeologyGraphNode[] = [];
  const queue = [graph.rootId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || visited.has(id)) continue;
    const node = byId.get(id);
    if (!node) continue;
    visited.add(id);
    ordered.push(node);
    queue.push(...(node.children ?? []));
  }

  const remaining = graph.nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  return [...ordered, ...remaining];
}

function actionIdsForNode(node: IdeologyGraphNode, isActionGate: boolean): string[] {
  const actionIds = (node.actions ?? []).map((action, index) => {
    const actionLabel = slug(action.label);
    return `ideology.${node.id}.action.${actionLabel || index + 1}`;
  });

  if (isActionGate) actionIds.push(`moral-graph.action_gate.${node.id}`);
  return uniqueSorted(actionIds);
}

function classifyNode(params: {
  node: IdeologyGraphNode;
  hasPrinciple: boolean;
  isActionGate: boolean;
  mappedActionIds: string[];
}): MoralGraphCoverageStatusV1 {
  if (params.hasPrinciple) return "mapped";
  if (params.isActionGate || params.mappedActionIds.length > 0) return "partial";
  if (hasConceptualContent(params.node)) return "conceptual_only";
  return "unmapped";
}

function missingPiecesForStatus(params: {
  status: MoralGraphCoverageStatusV1;
  hasPrinciple: boolean;
  isActionGate: boolean;
  hasActions: boolean;
  hasReferences: boolean;
}): string[] {
  if (params.status === "mapped") return [];

  const missing: string[] = [];
  if (!params.hasPrinciple) missing.push("principle_operator");
  if (!params.isActionGate && !params.hasActions) missing.push("action_gate_or_recommended_action");
  if (!params.hasReferences) missing.push("source_reference");

  if (params.status === "conceptual_only" || params.status === "unmapped") {
    missing.unshift("procedural_badge_mapping");
  }
  if (params.status === "unmapped") {
    missing.push("ideology_reference");
  }

  return uniqueSorted(missing);
}

function recommendedPatchType(params: {
  status: MoralGraphCoverageStatusV1;
  isActionGate: boolean;
  hasActions: boolean;
  hasReferences: boolean;
}): MoralGraphCoverageRecommendedPatchTypeV1 {
  if (params.status === "mapped") return "no_change";
  if (params.isActionGate) return "add_constraint";
  if (params.hasActions) return "add_action_gate";
  if (!params.hasReferences) return "add_reference";
  return "add_badge";
}

function notesForNode(params: {
  status: MoralGraphCoverageStatusV1;
  node: IdeologyGraphNode;
  hasPrinciple: boolean;
  isActionGate: boolean;
  hasActions: boolean;
  hasReferences: boolean;
}): string[] {
  const notes: string[] = [];
  if (params.hasPrinciple) notes.push("Mapped by MORAL_WISDOM_PRINCIPLES procedural role/operator metadata.");
  if (params.isActionGate) notes.push("Detected as an ideology action gate by graph policy or gate-like tags.");
  if (params.hasActions) notes.push("Node exposes ideology actions but is missing full procedural principle metadata.");
  if (params.status === "conceptual_only") {
    notes.push("Node has ideology prose/reference structure but no procedural Moral badge binding yet.");
    notes.push("Explicitly left conceptual-only until a concrete procedural rule, evidence need, or action gate is defined.");
  }
  if (params.status === "unmapped") {
    notes.push("Node has no detected procedural binding or supporting conceptual reference.");
  }
  if (!params.hasReferences) notes.push("No explicit source reference is attached to this ideology node.");
  return notes;
}

export function auditMoralGraphCoverage(input: IdeologyGraph | IdeologyGraphDocument): MoralGraphCoverageAuditV1 {
  const graph = graphFromInput(input);
  const actionGateIds = new Set(findIdeologyActionGates(graph).map((node) => node.id));
  const nodes: MoralGraphCoverageAuditNodeV1[] = orderedNodes(graph).map((node) => {
    const principle = getMoralWisdomPrinciple(node.id);
    const isActionGate = actionGateIds.has(node.id);
    const mappedActionIds = actionIdsForNode(node, isActionGate);
    const hasActions = (node.actions?.length ?? 0) > 0;
    const hasReferences = (node.references?.length ?? 0) > 0;
    const status = classifyNode({
      node,
      hasPrinciple: Boolean(principle),
      isActionGate,
      mappedActionIds,
    });

    return {
      ideologyNodeId: node.id,
      ideologyNodeLabel: node.title,
      coverageStatus: status,
      mappedBadgeIds: principle || isActionGate || mappedActionIds.length > 0 ? [node.id] : [],
      mappedPrincipleIds: principle ? [principle.id] : [],
      mappedActionIds,
      missingProceduralPieces: missingPiecesForStatus({
        status,
        hasPrinciple: Boolean(principle),
        isActionGate,
        hasActions,
        hasReferences,
      }),
      notes: notesForNode({
        status,
        node,
        hasPrinciple: Boolean(principle),
        isActionGate,
        hasActions,
        hasReferences,
      }),
      recommendedPatchType: recommendedPatchType({
        status,
        isActionGate,
        hasActions,
        hasReferences,
      }),
    };
  });

  const summary: MoralGraphCoverageAuditSummaryV1 = {
    mapped: 0,
    partial: 0,
    conceptual_only: 0,
    unmapped: 0,
    total: nodes.length,
  };
  for (const node of nodes) {
    summary[node.coverageStatus] += 1;
  }

  return {
    artifactId: MORAL_GRAPH_COVERAGE_AUDIT_ARTIFACT_ID,
    schemaVersion: MORAL_GRAPH_COVERAGE_AUDIT_SCHEMA_VERSION,
    graphId: "moral-ideology-graph",
    source: "docs/ethos/ideology.json",
    rootId: graph.rootId,
    summary,
    nodes,
  };
}
