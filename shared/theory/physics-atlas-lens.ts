import type {
  PhysicsAtlasBlockId,
  PhysicsAtlasBlockV1,
  PhysicsAtlasV1,
} from "../contracts/physics-atlas.v1";
import type {
  TheoryBadgeEdgeV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";

export type PhysicsAtlasLensResult = {
  blockId: PhysicsAtlasBlockId;
  title: string;
  centerBadgeIds: string[];
  highlightedBadgeIds: string[];
  highlightedEdgeIds: string[];
  foundationBadgeIds: string[];
  claimBoundaryBadgeIds: string[];
  dimmedBadgeIds: string[];
  suggestedViewport: {
    centerBadgeId: string | null;
    zoom: number;
  };
  calculatorExamples: PhysicsAtlasBlockV1["calculatorExamples"];
  runtimeActions: PhysicsAtlasBlockV1["runtimeActions"];
  claimBoundaryNotes: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

const matchesAny = (values: string[], requested: string[]) => {
  const requestedKeys = requested.map((value: string) => normalize(value));
  return values.some((value: string) => {
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

function existingBadgeIds(graph: TheoryBadgeGraphV1, ids: string[]): string[] {
  const badgeIds = new Set(graph.badges.map((badge: TheoryBadgeV1) => badge.id));
  return ids.filter((id: string) => badgeIds.has(id));
}

export function resolvePhysicsAtlasLens(args: {
  graph: TheoryBadgeGraphV1;
  atlas: PhysicsAtlasV1;
  blockId: PhysicsAtlasBlockId;
}): PhysicsAtlasLensResult {
  const block = args.atlas.blocks.find((candidate: PhysicsAtlasBlockV1) => candidate.id === args.blockId);
  if (!block) {
    throw new Error(`Unknown physics atlas block: ${args.blockId}`);
  }

  const matchedBadgeIds = new Set(
    args.graph.badges
      .filter((badge: TheoryBadgeV1) => badgeMatchesBlock(badge, block))
      .map((badge: TheoryBadgeV1) => badge.id),
  );
  for (const id of existingBadgeIds(args.graph, block.primaryBadgeIds)) {
    matchedBadgeIds.add(id);
  }

  const foundationBadgeIds = existingBadgeIds(args.graph, [
    ...args.atlas.alwaysOnFoundationBadgeIds,
    ...block.rootBadgeIds,
  ]);
  const claimBoundaryBadgeIds = existingBadgeIds(args.graph, [
    ...args.atlas.alwaysOnClaimBoundaryBadgeIds,
    ...block.claimBoundaryBadgeIds,
  ]);

  const highlightedBadgeIds = Array.from(new Set([
    ...foundationBadgeIds,
    ...Array.from(matchedBadgeIds),
    ...claimBoundaryBadgeIds,
  ]));
  const highlightedBadgeSet = new Set(highlightedBadgeIds);
  const highlightedEdgeIds = args.graph.edges
    .filter((edge: TheoryBadgeEdgeV1) => highlightedBadgeSet.has(edge.from) && highlightedBadgeSet.has(edge.to))
    .map((edge: TheoryBadgeEdgeV1) => edge.id);
  const centerBadgeIds = existingBadgeIds(args.graph, block.primaryBadgeIds).filter((id: string) => matchedBadgeIds.has(id));
  const dimmedBadgeIds = args.graph.badges
    .map((badge: TheoryBadgeV1) => badge.id)
    .filter((id: string) => !highlightedBadgeSet.has(id));
  const centerBadgeId = centerBadgeIds[0] ?? Array.from(matchedBadgeIds)[0] ?? foundationBadgeIds[0] ?? null;

  return {
    blockId: block.id,
    title: block.title,
    centerBadgeIds,
    highlightedBadgeIds,
    highlightedEdgeIds,
    foundationBadgeIds,
    claimBoundaryBadgeIds,
    dimmedBadgeIds,
    suggestedViewport: {
      centerBadgeId,
      zoom: centerBadgeId ? 1.12 : 1,
    },
    calculatorExamples: block.calculatorExamples,
    runtimeActions: block.runtimeActions,
    claimBoundaryNotes: block.claimBoundaryNotes,
  };
}
