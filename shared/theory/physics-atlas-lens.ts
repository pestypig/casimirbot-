import type { PhysicsAtlasBlockId, PhysicsAtlasBlockV1 } from "../contracts/physics-atlas.v1";
import type {
  TheoryBadgeCalculatorPayloadV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { buildPhysicsAtlasBlocksV1 } from "./physics-atlas-blocks";

export type PhysicsAtlasLensResult = {
  blockId: PhysicsAtlasBlockId;
  badgeIds: string[];
  edgeIds: string[];
  rootBadgeIds: string[];
  claimBoundaryBadgeIds: string[];
  calculatorPayloadIds: string[];
  claimBoundaryNotes: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

const matchesAny = (values: string[], requested: string[]) => {
  const requestedKeys = requested.map((value: string) => normalize(value));
  return values.some((value) => {
    const key = normalize(value);
    return requestedKeys.some((requestedKey: string) => key === requestedKey || key.includes(requestedKey));
  });
};

function badgeMatchesBlock(badge: TheoryBadgeV1, block: PhysicsAtlasBlockV1): boolean {
  return (
    block.primaryBadgeIds.includes(badge.id) ||
    block.rootBadgeIds.includes(badge.id) ||
    block.claimBoundaryBadgeIds.includes(badge.id) ||
    matchesAny([...badge.subjects, ...badge.tags, ...badge.hintKeys.subjects], block.subjects) ||
    matchesAny(badge.hintKeys.symbols, block.symbols) ||
    matchesAny(badge.hintKeys.unitSignatures, block.unitSignatures) ||
    matchesAny([...badge.equationFamilies, ...badge.hintKeys.equationFamilies], block.equationFamilies) ||
    matchesAny([...badge.simulationOwners, ...badge.hintKeys.simulationOwners], block.simulationOwners) ||
    matchesAny(badge.hintKeys.repoPaths, block.repoPathHints)
  );
}

function neighborBadgeIds(graph: TheoryBadgeGraphV1, seedIds: Set<string>): Set<string> {
  const result = new Set(seedIds);
  for (const edge of graph.edges) {
    if (seedIds.has(edge.from) || seedIds.has(edge.to)) {
      result.add(edge.from);
      result.add(edge.to);
    }
  }
  return result;
}

export function resolvePhysicsAtlasLens(args: {
  graph: TheoryBadgeGraphV1;
  blockId: PhysicsAtlasBlockId;
}): PhysicsAtlasLensResult | null {
  const atlas = buildPhysicsAtlasBlocksV1(args.graph.graphId);
  const block = atlas.blocks.find((candidate: PhysicsAtlasBlockV1) => candidate.id === args.blockId);
  if (!block) return null;

  const directBadgeIds = new Set(
    args.graph.badges
      .filter((badge: TheoryBadgeV1) => badgeMatchesBlock(badge, block))
      .map((badge: TheoryBadgeV1) => badge.id),
  );
  for (const id of [...block.primaryBadgeIds, ...block.rootBadgeIds, ...block.claimBoundaryBadgeIds]) {
    if (args.graph.badges.some((badge: TheoryBadgeV1) => badge.id === id)) directBadgeIds.add(id);
  }

  const badgeIds = Array.from(neighborBadgeIds(args.graph, directBadgeIds));
  const badgeIdSet = new Set(badgeIds);
  const edgeIds = args.graph.edges
    .filter((edge: TheoryBadgeEdgeV1) => badgeIdSet.has(edge.from) && badgeIdSet.has(edge.to))
    .map((edge: TheoryBadgeEdgeV1) => edge.id);
  const calculatorPayloadIds = args.graph.badges
    .filter((badge: TheoryBadgeV1) => badgeIdSet.has(badge.id))
    .flatMap((badge: TheoryBadgeV1) =>
      badge.calculatorPayloads.map((payload: TheoryBadgeCalculatorPayloadV1) => `${badge.id}:${payload.id}`),
    );

  return {
    blockId: block.id,
    badgeIds,
    edgeIds,
    rootBadgeIds: block.rootBadgeIds.filter((id: string) => badgeIdSet.has(id)),
    claimBoundaryBadgeIds: block.claimBoundaryBadgeIds.filter((id: string) => badgeIdSet.has(id)),
    calculatorPayloadIds,
    claimBoundaryNotes: block.claimBoundaryNotes,
  };
}
