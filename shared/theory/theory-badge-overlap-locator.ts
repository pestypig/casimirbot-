import type {
  PhysicsAtlasBlockId,
  PhysicsAtlasBlockV1,
} from "../contracts/physics-atlas.v1";
import type {
  TheoryBadgeEdgeV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { buildHelixPhysicsAtlasV1 } from "./physics-atlas-blocks";
import { resolvePhysicsAtlasLens } from "./physics-atlas-lens";

export type TheoryBadgeLookupInput = {
  query?: string;
  subjects?: string[];
  symbols?: string[];
  unitSignatures?: string[];
  repoPaths?: string[];
  equationFamilies?: string[];
  simulationOwners?: string[];
  atlasBlockIds?: PhysicsAtlasBlockId[];
  limit?: number;
};

export type TheoryBadgeLookupMatch = {
  badgeId: string;
  badgeTitle: string;
  score: number;
  reasons: string[];
  matchedSubjects: string[];
  matchedSymbols: string[];
  matchedUnitSignatures: string[];
  matchedRepoPaths: string[];
  matchedEquationFamilies: string[];
  calculatorPayloadIds: string[];
  claimBoundaryWarnings: string[];
};

export type TheoryBadgeConnectionTrace = {
  selectedBadgeIds: string[];
  connectingBadgeIds: string[];
  sharedAncestorIds: string[];
  sharedSubjects: string[];
  sharedSymbols: string[];
  sharedUnitSignatures: string[];
  pathSegments: Array<{
    from: string;
    to: string;
    badgeIds: string[];
    edgeIds: string[];
  }>;
  claimBoundaryNotes: string[];
  warnings: string[];
};

const TOKEN_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "badge",
  "be",
  "by",
  "can",
  "do",
  "does",
  "evidence",
  "for",
  "from",
  "graph",
  "how",
  "in",
  "is",
  "it",
  "keep",
  "moral",
  "not",
  "of",
  "only",
  "on",
  "or",
  "physics",
  "proof",
  "reflect",
  "solve",
  "that",
  "the",
  "theory",
  "this",
  "through",
  "to",
  "treat",
  "using",
  "with",
]);

const normalize = (value: string) => value.trim().toLowerCase();

const normalizeKey = (value: string) =>
  normalize(value)
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const isSpecificUnitSignature = (value: string) => normalize(value).length >= 3;

const intersectNormalized = (left: string[], right: string[]) => {
  const rightByKey = new Map(right.map((value) => [normalizeKey(value), value]));
  return unique(
    left
      .map((value) => rightByKey.get(normalizeKey(value)) ?? null)
      .filter((value): value is string => Boolean(value)),
  );
};

const intersectUnitSignatures = (left: string[], right: string[]) =>
  intersectNormalized(left.filter(isSpecificUnitSignature), right.filter(isSpecificUnitSignature));

const tokenize = (value: string | undefined) =>
  unique(
    (value ?? "")
      .toLowerCase()
      .split(/[^a-z0-9_./^-]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !TOKEN_STOP_WORDS.has(token) && !TOKEN_STOP_WORDS.has(normalizeKey(token))),
  );

function badgeSymbols(badge: TheoryBadgeV1) {
  return unique([
    ...badge.hintKeys.symbols,
    ...badge.equations.flatMap((equation) => [...equation.inputSymbols, ...equation.outputSymbols]),
    ...badge.units.map((unit) => unit.symbol),
  ]);
}

function badgeUnitSignatures(badge: TheoryBadgeV1) {
  return unique([
    ...badge.hintKeys.unitSignatures,
    ...badge.units.map((unit) => unit.dimensionSignature ?? "").filter(Boolean),
  ]);
}

function badgeRepoPaths(badge: TheoryBadgeV1) {
  return unique([
    ...badge.hintKeys.repoPaths,
    ...badge.sourceRefs.map((source) => source.path ?? "").filter(Boolean),
  ]);
}

function claimBoundaryWarnings(badge: TheoryBadgeV1) {
  const warnings: string[] = [];
  if (badge.claimBoundary.diagnosticOnly) warnings.push("diagnostic-only badge");
  if (!badge.claimBoundary.validationClaimAllowed) warnings.push("validation claim not allowed");
  if (!badge.claimBoundary.physicalMechanismClaimAllowed) {
    warnings.push("physical mechanism claim not allowed");
  }
  if (!badge.claimBoundary.promotionAllowed) warnings.push("promotion not allowed");
  return warnings;
}

function textIncludesAny(haystack: string, needles: string[]) {
  const normalizedHaystack = normalize(haystack);
  return needles.filter((needle) => normalizedHaystack.includes(normalize(needle)));
}

function unitSignaturesInQuery(query: string, unitSignatures: string[]) {
  const normalizedQuery = normalize(query);
  return unitSignatures.filter((signature) => {
    const normalizedSignature = normalize(signature);
    return isSpecificUnitSignature(signature) && normalizedQuery.includes(normalizedSignature);
  });
}

function symbolMatchesQuery(queryTokens: string[], symbols: string[]) {
  const tokenKeys = new Set(queryTokens.map(normalizeKey));
  return symbols.filter((symbol) => {
    const key = normalizeKey(symbol);
    if (key.length <= 3) return tokenKeys.has(key);
    return queryTokens.some((token) => normalize(token).includes(normalize(symbol)));
  });
}

export function locateTheoryBadges(args: {
  graph: TheoryBadgeGraphV1;
  input: TheoryBadgeLookupInput;
}): TheoryBadgeLookupMatch[] {
  const { graph } = args;
  const input = args.input;
  const query = input.query?.trim() ?? "";
  const queryTokens = tokenize(query);
  const queryKey = normalizeKey(query);
  const requestedSubjects = input.subjects ?? [];
  const requestedSymbols = input.symbols ?? [];
  const requestedUnitSignatures = input.unitSignatures ?? [];
  const requestedRepoPaths = input.repoPaths ?? [];
  const requestedEquationFamilies = input.equationFamilies ?? [];
  const requestedSimulationOwners = input.simulationOwners ?? [];
  const atlas = buildHelixPhysicsAtlasV1({ graph });
  const requestedAtlasBlockIds = unique(input.atlasBlockIds ?? []).filter((blockId: string): blockId is PhysicsAtlasBlockId =>
    atlas.blocks.some((block: PhysicsAtlasBlockV1) => block.id === blockId),
  );
  const atlasBlocks = requestedAtlasBlockIds
    .map((blockId: PhysicsAtlasBlockId) =>
      atlas.blocks.find((block: PhysicsAtlasBlockV1) => block.id === blockId),
    )
    .filter((block): block is PhysicsAtlasBlockV1 => Boolean(block));
  const atlasLensBadgeIds = new Set(
    requestedAtlasBlockIds.flatMap((blockId: PhysicsAtlasBlockId) =>
      resolvePhysicsAtlasLens({ graph, atlas, blockId }).highlightedBadgeIds,
    ),
  );
  const atlasPrimaryBadgeIds = new Set(atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.primaryBadgeIds));
  const atlasSubjectPriors = unique(atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.subjects));
  const atlasUnitSignaturePriors = unique(atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.unitSignatures));
  const atlasEquationFamilyPriors = unique(atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.equationFamilies));
  const atlasSimulationOwnerPriors = unique(atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.simulationOwners));
  const atlasRepoPathPriors = unique(atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.repoPathHints));
  const atlasCalculatorExamples = atlasBlocks.flatMap((block: PhysicsAtlasBlockV1) => block.calculatorExamples);
  const limit = Math.max(1, Math.min(50, input.limit ?? 8));

  const matches = graph.badges
    .map((badge): TheoryBadgeLookupMatch | null => {
      const subjects = unique([...badge.subjects, ...badge.tags, ...badge.hintKeys.subjects]);
      const symbols = badgeSymbols(badge);
      const unitSignatures = badgeUnitSignatures(badge);
      const repoPaths = badgeRepoPaths(badge);
      const equationFamilies = unique([...badge.equationFamilies, ...badge.hintKeys.equationFamilies]);
      const simulationOwners = unique([...badge.simulationOwners, ...badge.hintKeys.simulationOwners]);
      const payloadText = badge.calculatorPayloads
        .map((payload) => `${payload.id} ${payload.expression} ${payload.displayLatex}`)
        .join(" ");
      const badgeText = [
        badge.id,
        badge.title,
        badge.plainMeaning,
        badge.whyItMatters,
        ...subjects,
        ...symbols,
        ...unitSignatures,
        ...repoPaths,
        ...equationFamilies,
        ...simulationOwners,
        payloadText,
      ].join(" ");

      let score = 0;
      const reasons: string[] = [];
      const addScore = (points: number, reason: string) => {
        score += points;
        reasons.push(reason);
      };

      if (queryKey && normalizeKey(badge.id) === queryKey) addScore(100, "direct badge id match");
      if (queryKey && normalizeKey(badge.title) === queryKey) addScore(60, "direct badge title match");

      if (atlasPrimaryBadgeIds.has(badge.id)) addScore(40, "direct atlas primary badge");
      if (atlasLensBadgeIds.has(badge.id)) addScore(10, "inside selected atlas lens");

      const matchedSymbols = unique([
        ...intersectNormalized(requestedSymbols, symbols),
        ...symbolMatchesQuery(queryTokens, symbols),
      ]);
      if (matchedSymbols.length > 0) addScore(35 * matchedSymbols.length, `symbol match: ${matchedSymbols.join(", ")}`);

      const matchedUnitSignatures = unique([
        ...intersectUnitSignatures(requestedUnitSignatures, unitSignatures),
        ...unitSignaturesInQuery(query, unitSignatures),
      ]);
      if (matchedUnitSignatures.length > 0) {
        addScore(30 * matchedUnitSignatures.length, `unit signature match: ${matchedUnitSignatures.join(", ")}`);
      }

      const matchedEquationFamilies = unique([
        ...intersectNormalized(requestedEquationFamilies, equationFamilies),
        ...textIncludesAny(query, equationFamilies),
      ]);
      if (matchedEquationFamilies.length > 0) {
        addScore(25 * matchedEquationFamilies.length, `equation family match: ${matchedEquationFamilies.join(", ")}`);
      }

      const payloadHits = queryTokens.length
        ? badge.calculatorPayloads.filter((payload) =>
            queryTokens.some((token) => normalize(`${payload.id} ${payload.expression} ${payload.displayLatex}`).includes(token)),
          )
        : [];
      if (payloadHits.length > 0) {
        addScore(25 * payloadHits.length, `calculator payload match: ${payloadHits.map((payload) => payload.id).join(", ")}`);
      }

      const matchedSubjects = unique([
        ...intersectNormalized(requestedSubjects, subjects),
        ...textIncludesAny(query, subjects),
      ]);
      if (matchedSubjects.length > 0) addScore(20 * matchedSubjects.length, `subject/tag match: ${matchedSubjects.join(", ")}`);

      const matchedRepoPaths = unique([
        ...intersectNormalized(requestedRepoPaths, repoPaths),
        ...repoPaths.filter((path) => requestedRepoPaths.some((requested) => normalize(path).includes(normalize(requested)))),
        ...repoPaths.filter((path) => query && normalize(query).includes(normalize(path))),
      ]);
      if (matchedRepoPaths.length > 0) addScore(20 * matchedRepoPaths.length, `repo path match: ${matchedRepoPaths.join(", ")}`);

      const matchedOwners = intersectNormalized(requestedSimulationOwners, simulationOwners);
      if (matchedOwners.length > 0) addScore(20 * matchedOwners.length, `simulation owner match: ${matchedOwners.join(", ")}`);

      const atlasSubjectMatches = intersectNormalized(atlasSubjectPriors, subjects);
      if (atlasSubjectMatches.length > 0) {
        addScore(20 * atlasSubjectMatches.length, `subject match via atlas block: ${atlasSubjectMatches.join(", ")}`);
      }

      const atlasOwnerMatches = intersectNormalized(atlasSimulationOwnerPriors, simulationOwners);
      if (atlasOwnerMatches.length > 0) {
        addScore(20 * atlasOwnerMatches.length, `simulation owner match via atlas block: ${atlasOwnerMatches.join(", ")}`);
      }

      const atlasEquationFamilyMatches = intersectNormalized(atlasEquationFamilyPriors, equationFamilies);
      if (atlasEquationFamilyMatches.length > 0) {
        addScore(18 * atlasEquationFamilyMatches.length, `equation family via atlas block: ${atlasEquationFamilyMatches.join(", ")}`);
      }

      const atlasUnitMatches = intersectUnitSignatures(atlasUnitSignaturePriors, unitSignatures);
      if (atlasUnitMatches.length > 0) {
        addScore(18 * atlasUnitMatches.length, `unit signature via atlas block: ${atlasUnitMatches.join(", ")}`);
      }

      const atlasRepoMatches = unique([
        ...intersectNormalized(atlasRepoPathPriors, repoPaths),
        ...repoPaths.filter((path) => atlasRepoPathPriors.some((prior) => normalize(path).includes(normalize(prior)))),
      ]);
      if (atlasRepoMatches.length > 0) {
        addScore(15 * atlasRepoMatches.length, `source path hint via atlas block: ${atlasRepoMatches.join(", ")}`);
      }

      const atlasCalculatorExampleHits = atlasCalculatorExamples.filter((example) => {
        const exampleExpression = normalize(example.expression);
        const exampleDisplay = normalize(example.displayLatex);
        const normalizedPayloadText = normalize(payloadText);
        return (
          normalizedPayloadText.includes(exampleExpression) ||
          normalizedPayloadText.includes(exampleDisplay) ||
          intersectNormalized(example.symbols, symbols).length > 0
        );
      });
      if (atlasCalculatorExampleHits.length > 0) {
        addScore(
          15 * atlasCalculatorExampleHits.length,
          `calculator example expression/symbol match: ${atlasCalculatorExampleHits.map((example) => example.label).join(", ")}`,
        );
      }

      const textTokenHits = queryTokens.filter((token) => normalize(badgeText).includes(token));
      if (textTokenHits.length > 0) addScore(Math.min(30, 10 * textTokenHits.length), `text match: ${textTokenHits.join(", ")}`);

      if (score <= 0) return null;
      return {
        badgeId: badge.id,
        badgeTitle: badge.title,
        score,
        reasons: unique(reasons),
        matchedSubjects,
        matchedSymbols,
        matchedUnitSignatures,
        matchedRepoPaths,
        matchedEquationFamilies,
        calculatorPayloadIds: badge.calculatorPayloads.map((payload) => payload.id),
        claimBoundaryWarnings: claimBoundaryWarnings(badge),
      };
    })
    .filter((match): match is TheoryBadgeLookupMatch => Boolean(match));

  return matches
    .sort((left, right) => right.score - left.score || left.badgeId.localeCompare(right.badgeId))
    .slice(0, limit);
}

function edgeIndexes(edges: TheoryBadgeEdgeV1[]) {
  const outgoing = new Map<string, TheoryBadgeEdgeV1[]>();
  const incoming = new Map<string, TheoryBadgeEdgeV1[]>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  }
  return { outgoing, incoming };
}

function ancestorDistances(badgeId: string, incoming: Map<string, TheoryBadgeEdgeV1[]>) {
  const distances = new Map<string, number>();
  const queue: Array<{ id: string; distance: number }> = [{ id: badgeId, distance: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (distances.has(current.id) && (distances.get(current.id) ?? 0) <= current.distance) continue;
    distances.set(current.id, current.distance);
    for (const edge of incoming.get(current.id) ?? []) {
      queue.push({ id: edge.from, distance: current.distance + 1 });
    }
  }
  return distances;
}

function shortestDirectedPath(args: {
  from: string;
  to: string;
  outgoing: Map<string, TheoryBadgeEdgeV1[]>;
}) {
  const queue: Array<{ id: string; badgeIds: string[]; edgeIds: string[] }> = [
    { id: args.from, badgeIds: [args.from], edgeIds: [] },
  ];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.id === args.to) return current;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    for (const edge of args.outgoing.get(current.id) ?? []) {
      if (visited.has(edge.to)) continue;
      queue.push({
        id: edge.to,
        badgeIds: [...current.badgeIds, edge.to],
        edgeIds: [...current.edgeIds, edge.id],
      });
    }
  }
  return null;
}

export function traceTheoryBadgeConnections(args: {
  graph: TheoryBadgeGraphV1;
  badgeIds: string[];
}): TheoryBadgeConnectionTrace {
  const { graph } = args;
  const badgesById = new Map(graph.badges.map((badge) => [badge.id, badge]));
  const selectedBadgeIds = unique(args.badgeIds).filter((id) => badgesById.has(id));
  const warnings = args.badgeIds
    .filter((id) => !badgesById.has(id))
    .map((id) => `badge not found: ${id}`);
  const { outgoing, incoming } = edgeIndexes(graph.edges);

  if (selectedBadgeIds.length === 0) {
    return {
      selectedBadgeIds: [],
      connectingBadgeIds: [],
      sharedAncestorIds: [],
      sharedSubjects: [],
      sharedSymbols: [],
      sharedUnitSignatures: [],
      pathSegments: [],
      claimBoundaryNotes: [],
      warnings,
    };
  }

  const ancestorMaps = selectedBadgeIds.map((id) => ancestorDistances(id, incoming));
  const sharedAncestorIds = Array.from(ancestorMaps[0].keys()).filter((ancestorId) =>
    ancestorMaps.every((map) => map.has(ancestorId)),
  );
  const rankedAncestors = sharedAncestorIds.sort((left, right) => {
    const leftDistance = ancestorMaps.reduce((sum, map) => sum + (map.get(left) ?? 0), 0);
    const rightDistance = ancestorMaps.reduce((sum, map) => sum + (map.get(right) ?? 0), 0);
    return leftDistance - rightDistance || left.localeCompare(right);
  });
  const rootAncestor = rankedAncestors[0] ?? selectedBadgeIds[0];
  const pathSegments = selectedBadgeIds
    .map((to) => {
      const path = shortestDirectedPath({ from: rootAncestor, to, outgoing });
      if (!path) {
        warnings.push(`no directed path from ${rootAncestor} to ${to}`);
        return null;
      }
      return {
        from: rootAncestor,
        to,
        badgeIds: path.badgeIds,
        edgeIds: path.edgeIds,
      };
    })
    .filter((segment): segment is TheoryBadgeConnectionTrace["pathSegments"][number] => Boolean(segment));

  const selectedBadges = selectedBadgeIds.map((id) => badgesById.get(id)).filter((badge): badge is TheoryBadgeV1 => Boolean(badge));
  const sharedValues = (selector: (badge: TheoryBadgeV1) => string[]) => {
    if (selectedBadges.length === 0) return [];
    const [first, ...rest] = selectedBadges.map(selector);
    return first.filter((value) =>
      rest.every((values) => values.some((candidate) => normalizeKey(candidate) === normalizeKey(value))),
    );
  };

  const connectingBadgeIds = unique(pathSegments.flatMap((segment) => segment.badgeIds));
  const claimBoundaryNotes = unique(
    connectingBadgeIds.flatMap((id) => {
      const badge = badgesById.get(id);
      return badge ? claimBoundaryWarnings(badge).map((warning) => `${badge.id}: ${warning}`) : [];
    }),
  );

  return {
    selectedBadgeIds,
    connectingBadgeIds,
    sharedAncestorIds: rankedAncestors,
    sharedSubjects: unique(sharedValues((badge) => badge.subjects)),
    sharedSymbols: unique(sharedValues(badgeSymbols)),
    sharedUnitSignatures: unique(sharedValues(badgeUnitSignatures)),
    pathSegments,
    claimBoundaryNotes,
    warnings,
  };
}
