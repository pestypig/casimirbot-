import type { IdeologyGraph, IdeologyGraphDocument } from "./ideology-graph-types";
import { assertValidIdeologyGraphDocument } from "./validate-ideology-graph";

function addUnique(map: Map<string, string[]>, key: string, value: string): void {
  const existing = map.get(key) ?? [];
  if (!existing.includes(value)) existing.push(value);
  map.set(key, existing);
}

export function buildIdeologyGraph(document: IdeologyGraphDocument): IdeologyGraph {
  assertValidIdeologyGraphDocument(document);

  const nodeById = new Map(document.nodes.map((node) => [node.id, node]));
  const parentIdsById = new Map<string, string[]>();
  const childIdsById = new Map<string, string[]>();
  const linkedIdsById = new Map<string, string[]>();

  for (const node of document.nodes) {
    parentIdsById.set(node.id, parentIdsById.get(node.id) ?? []);
    childIdsById.set(node.id, childIdsById.get(node.id) ?? []);
    linkedIdsById.set(node.id, linkedIdsById.get(node.id) ?? []);
  }

  for (const node of document.nodes) {
    for (const childId of node.children ?? []) {
      addUnique(childIdsById, node.id, childId);
      addUnique(parentIdsById, childId, node.id);
      addUnique(linkedIdsById, node.id, childId);
      addUnique(linkedIdsById, childId, node.id);
    }

    for (const link of node.links ?? []) {
      addUnique(linkedIdsById, node.id, link.to);
      addUnique(linkedIdsById, link.to, node.id);

      const rel = link.rel?.toLowerCase();
      if (rel === "child") {
        addUnique(childIdsById, node.id, link.to);
        addUnique(parentIdsById, link.to, node.id);
      }
      if (rel === "parent") {
        addUnique(parentIdsById, node.id, link.to);
        addUnique(childIdsById, link.to, node.id);
      }
    }
  }

  return {
    ...document,
    nodeById,
    parentIdsById,
    childIdsById,
    linkedIdsById,
  };
}
