import type { IdeologyActionGatePolicy, IdeologyGraph, IdeologyGraphNode } from "./ideology-graph-types";

const OUTER_EDGE_TAGS = new Set(["lens", "trait", "posture", "applied", "outer_edge", "outer-edge"]);
const SCENARIO_REFERENCE_TERMS = ["scenario", "case", "event", "situation", "workstation", "voice", "repo", "mission"];
const SAFEGUARD_TERMS = [
  "approval",
  "capture",
  "check",
  "floor",
  "gate",
  "guard",
  "integrity",
  "jurisdiction",
  "law",
  "legal",
  "policy",
  "protocol",
  "repair",
  "resistance",
  "restraint",
  "safeguard",
  "verification",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function nodeText(node: IdeologyGraphNode): string {
  return [
    node.id,
    node.slug,
    node.title,
    node.excerpt,
    node.summary,
    node.bodyMD,
    ...(node.tags ?? []),
    ...(node.references ?? []).flatMap((reference) => [
      reference.kind,
      reference.title,
      reference.path,
      reference.url,
      reference.id,
    ]),
    ...(node.actions ?? []).map((action) => action.label),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function uniqueNodesById(nodes: IdeologyGraphNode[]): IdeologyGraphNode[] {
  const seen = new Set<string>();
  const unique: IdeologyGraphNode[] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    unique.push(node);
  }
  return unique;
}

function getNodesByIds(graph: IdeologyGraph, ids: string[]): IdeologyGraphNode[] {
  return ids.map((id) => graph.nodeById.get(id)).filter((node): node is IdeologyGraphNode => Boolean(node));
}

function walkIds(graph: IdeologyGraph, startId: string, nextIds: (id: string) => string[]): IdeologyGraphNode[] {
  const visited = new Set<string>();
  const result: IdeologyGraphNode[] = [];
  const queue = [...nextIds(startId)];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || visited.has(id)) continue;
    visited.add(id);
    const node = graph.nodeById.get(id);
    if (!node) continue;
    result.push(node);
    queue.push(...nextIds(id));
  }
  return result;
}

export function getIdeologyNodeById(graph: IdeologyGraph, id: string): IdeologyGraphNode | undefined {
  return graph.nodeById.get(id);
}

export function getIdeologyParents(graph: IdeologyGraph, id: string): IdeologyGraphNode[] {
  return getNodesByIds(graph, graph.parentIdsById.get(id) ?? []);
}

export function getIdeologyChildren(graph: IdeologyGraph, id: string): IdeologyGraphNode[] {
  return getNodesByIds(graph, graph.childIdsById.get(id) ?? []);
}

export function getIdeologyAncestors(graph: IdeologyGraph, id: string): IdeologyGraphNode[] {
  return walkIds(graph, id, (nodeId) => graph.parentIdsById.get(nodeId) ?? []);
}

export function getIdeologyDescendants(graph: IdeologyGraph, id: string): IdeologyGraphNode[] {
  return walkIds(graph, id, (nodeId) => graph.childIdsById.get(nodeId) ?? []);
}

export function getIdeologyPathToRoot(graph: IdeologyGraph, id: string): string[] {
  if (!graph.nodeById.has(id)) return [];
  const queue: string[][] = [[id]];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;
    const currentId = path[path.length - 1];
    if (!currentId || visited.has(currentId)) continue;
    if (currentId === graph.rootId) return path;
    visited.add(currentId);
    for (const parentId of graph.parentIdsById.get(currentId) ?? []) {
      queue.push([...path, parentId]);
    }
  }
  return [];
}

export function getNeighboringSafeguards(graph: IdeologyGraph, id: string): IdeologyGraphNode[] {
  const candidates = getNodesByIds(graph, graph.linkedIdsById.get(id) ?? []);
  return uniqueNodesById(candidates.filter((node) => SAFEGUARD_TERMS.some((term) => nodeText(node).includes(term))));
}

export function findIdeologyNodesByTag(graph: IdeologyGraph, tag: string): IdeologyGraphNode[] {
  const wanted = normalize(tag);
  return graph.nodes.filter((node) => (node.tags ?? []).some((nodeTag) => normalize(nodeTag) === wanted));
}

export function findIdeologyNodesByActionLabel(graph: IdeologyGraph, label: string): IdeologyGraphNode[] {
  const wanted = normalize(label);
  return graph.nodes.filter((node) => (node.actions ?? []).some((action) => normalize(action.label).includes(wanted)));
}

export function findIdeologyNodesByReference(graph: IdeologyGraph, query: string): IdeologyGraphNode[] {
  const wanted = normalize(query);
  return graph.nodes.filter((node) =>
    (node.references ?? []).some((reference) =>
      [reference.kind, reference.title, reference.path, reference.url, reference.id]
        .filter((value): value is string => typeof value === "string")
        .some((value) => normalize(value).includes(wanted)),
    ),
  );
}

export function getIdeologyActionGatePolicy(graph: IdeologyGraph): IdeologyActionGatePolicy | undefined {
  return graph.actionGatePolicy;
}

export function findIdeologyActionGates(graph: IdeologyGraph): IdeologyGraphNode[] {
  const policyTags = new Set(
    [
      ...(graph.actionGatePolicy?.covered_action_tags ?? []),
      ...(graph.actionGatePolicy?.legal_key_tags ?? []),
      ...(graph.actionGatePolicy?.ethos_key_tags ?? []),
      ...(graph.actionGatePolicy?.jurisdiction_floor_ok_tags ?? []),
    ].map(normalize),
  );

  return graph.nodes.filter((node) => {
    const tags = (node.tags ?? []).map(normalize);
    if (tags.some((tag) => policyTags.has(tag))) return true;
    const gateIdentity = normalize([node.id, node.slug, node.title, ...(node.tags ?? [])].filter(Boolean).join(" "));
    return /\b(gate|approval|dual key|two key|covered action)\b/.test(gateIdentity);
  });
}

export function findIdeologyOuterEdgeLenses(graph: IdeologyGraph): IdeologyGraphNode[] {
  const ordered: IdeologyGraphNode[] = [];
  const add = (nodes: IdeologyGraphNode[]) => ordered.push(...nodes);

  add(graph.nodes.filter((node) => (node.tags ?? []).some((tag) => OUTER_EDGE_TAGS.has(normalize(tag)))));
  add(graph.nodes.filter((node) => (graph.childIdsById.get(node.id) ?? []).length === 0));
  add(graph.nodes.filter((node) => (node.actions?.length ?? 0) > 0 || findIdeologyActionGates(graph).some((gate) => gate.id === node.id)));
  add(
    graph.nodes.filter((node) =>
      (node.references ?? []).some((reference) =>
        [reference.kind, reference.title, reference.path, reference.url, reference.id]
          .filter((value): value is string => typeof value === "string")
          .some((value) => SCENARIO_REFERENCE_TERMS.some((term) => normalize(value).includes(term))),
      ),
    ),
  );

  return uniqueNodesById(ordered);
}
