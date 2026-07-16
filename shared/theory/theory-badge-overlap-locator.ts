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

const intersectSymbols = (left: string[], right: string[]) => {
  const rightSet = new Set(right.map((value) => value.trim()));
  return unique(left.map((value) => value.trim()).filter((value) => rightSet.has(value)));
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

function textIncludesAny(
  haystack: string,
  needles: string[],
  options: { minimumKeyLength?: number } = {},
) {
  const normalizedHaystack = `_${normalizeKey(haystack)}_`;
  const minimumKeyLength = options.minimumKeyLength ?? 1;
  return needles.filter((needle) => {
    const key = normalizeKey(needle);
    if (!key || key.length < minimumKeyLength) return false;
    return normalizedHaystack.includes(`_${key}_`);
  });
}

function unitSignaturesInQuery(query: string, unitSignatures: string[]) {
  const normalizedQuery = normalize(query);
  return unitSignatures.filter((signature) => {
    const normalizedSignature = normalize(signature);
    return isSpecificUnitSignature(signature) && normalizedQuery.includes(normalizedSignature);
  });
}

function symbolMatchesQuery(query: string, queryTokens: string[], symbols: string[]) {
  const tokenKeys = new Set(queryTokens.map(normalizeKey));
  const caseSensitiveTokens = new Set(
    query
      .split(/[^a-z0-9_./^-]+/i)
      .map((token) => token.trim())
      .filter(Boolean),
  );
  return symbols.filter((symbol) => {
    const key = normalizeKey(symbol);
    if (/^[A-Za-z]$/.test(symbol)) {
      if (symbol === "a" || symbol === "I") return false;
      return caseSensitiveTokens.has(symbol);
    }
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
      let hasAdmissionSignal = false;
      const reasons: string[] = [];
      const addScore = (points: number, reason: string) => {
        score += points;
        reasons.push(reason);
      };

      if (queryKey && normalizeKey(badge.id) === queryKey) {
        addScore(100, "direct badge id match");
        hasAdmissionSignal = true;
      }
      if (queryKey && normalizeKey(badge.title) === queryKey) {
        addScore(60, "direct badge title match");
        hasAdmissionSignal = true;
      }

      if (atlasPrimaryBadgeIds.has(badge.id)) {
        addScore(40, "direct atlas primary badge");
        hasAdmissionSignal = true;
      }
      if (atlasLensBadgeIds.has(badge.id)) {
        addScore(10, "inside selected atlas lens");
        hasAdmissionSignal = true;
      }

      const requestedSymbolMatches = intersectSymbols(requestedSymbols, symbols);
      const querySymbolMatches = symbolMatchesQuery(query, queryTokens, symbols);
      const matchedSymbols = unique([...requestedSymbolMatches, ...querySymbolMatches]);
      if (matchedSymbols.length > 0) {
        addScore(35 * matchedSymbols.length, `symbol match: ${matchedSymbols.join(", ")}`);
        hasAdmissionSignal ||=
          requestedSymbolMatches.length > 0 ||
          querySymbolMatches.some((symbol) => normalizeKey(symbol).length >= 4);
      }

      const matchedUnitSignatures = unique([
        ...intersectUnitSignatures(requestedUnitSignatures, unitSignatures),
        ...unitSignaturesInQuery(query, unitSignatures),
      ]);
      if (matchedUnitSignatures.length > 0) {
        addScore(30 * matchedUnitSignatures.length, `unit signature match: ${matchedUnitSignatures.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const matchedEquationFamilies = unique([
        ...intersectNormalized(requestedEquationFamilies, equationFamilies),
        ...textIncludesAny(query, equationFamilies),
      ]);
      if (matchedEquationFamilies.length > 0) {
        addScore(25 * matchedEquationFamilies.length, `equation family match: ${matchedEquationFamilies.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const meaningfulPayloadTokens = queryTokens.filter((token) => {
        const key = normalizeKey(token);
        return key.length >= 4 && /[a-z]/i.test(key);
      });
      const normalizedQueryKey = normalizeKey(query);
      const payloadHits = queryTokens.length
        ? badge.calculatorPayloads.filter((payload) => {
            const payloadParts = [payload.id, payload.expression, payload.displayLatex];
            const exactPayloadMatch = payloadParts.some((part) => {
              const key = normalizeKey(part);
              return key.length >= 4 && normalizedQueryKey.includes(key);
            });
            const normalizedPayloadText = normalize(payloadParts.join(" "));
            const meaningfulTokenHits = meaningfulPayloadTokens.filter((token) =>
              normalizedPayloadText.includes(token),
            );
            return exactPayloadMatch || meaningfulTokenHits.length >= 2;
          })
        : [];
      if (payloadHits.length > 0) {
        addScore(25 * payloadHits.length, `calculator payload match: ${payloadHits.map((payload) => payload.id).join(", ")}`);
        hasAdmissionSignal = true;
      }

      const requestedSubjectMatches = intersectNormalized(requestedSubjects, subjects);
      const querySubjectMatches = textIncludesAny(query, subjects, { minimumKeyLength: 3 });
      const matchedSubjects = unique([...requestedSubjectMatches, ...querySubjectMatches]);
      if (matchedSubjects.length > 0) {
        addScore(20 * matchedSubjects.length, `subject/tag match: ${matchedSubjects.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const matchedRepoPaths = unique([
        ...intersectNormalized(requestedRepoPaths, repoPaths),
        ...repoPaths.filter((path) => requestedRepoPaths.some((requested) => normalize(path).includes(normalize(requested)))),
        ...repoPaths.filter((path) => query && normalize(query).includes(normalize(path))),
      ]);
      if (matchedRepoPaths.length > 0) {
        addScore(20 * matchedRepoPaths.length, `repo path match: ${matchedRepoPaths.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const matchedOwners = intersectNormalized(requestedSimulationOwners, simulationOwners);
      if (matchedOwners.length > 0) {
        addScore(20 * matchedOwners.length, `simulation owner match: ${matchedOwners.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const atlasSubjectMatches = intersectNormalized(atlasSubjectPriors, subjects);
      if (atlasSubjectMatches.length > 0) {
        addScore(20 * atlasSubjectMatches.length, `subject match via atlas block: ${atlasSubjectMatches.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const atlasOwnerMatches = intersectNormalized(atlasSimulationOwnerPriors, simulationOwners);
      if (atlasOwnerMatches.length > 0) {
        addScore(20 * atlasOwnerMatches.length, `simulation owner match via atlas block: ${atlasOwnerMatches.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const atlasEquationFamilyMatches = intersectNormalized(atlasEquationFamilyPriors, equationFamilies);
      if (atlasEquationFamilyMatches.length > 0) {
        addScore(18 * atlasEquationFamilyMatches.length, `equation family via atlas block: ${atlasEquationFamilyMatches.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const atlasUnitMatches = intersectUnitSignatures(atlasUnitSignaturePriors, unitSignatures);
      if (atlasUnitMatches.length > 0) {
        addScore(18 * atlasUnitMatches.length, `unit signature via atlas block: ${atlasUnitMatches.join(", ")}`);
        hasAdmissionSignal = true;
      }

      const atlasRepoMatches = unique([
        ...intersectNormalized(atlasRepoPathPriors, repoPaths),
        ...repoPaths.filter((path) => atlasRepoPathPriors.some((prior) => normalize(path).includes(normalize(prior)))),
      ]);
      if (atlasRepoMatches.length > 0) {
        addScore(15 * atlasRepoMatches.length, `source path hint via atlas block: ${atlasRepoMatches.join(", ")}`);
        hasAdmissionSignal = true;
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
        hasAdmissionSignal = true;
      }

      const textTokenHits = queryTokens.filter((token) => normalize(badgeText).includes(token));
      if (textTokenHits.length > 0) {
        addScore(Math.min(30, 10 * textTokenHits.length), `text match: ${textTokenHits.join(", ")}`);
        const textCoverage = textTokenHits.length / Math.max(1, queryTokens.length);
        hasAdmissionSignal ||= textTokenHits.length >= 2 && textCoverage >= 0.5;
      }

      if (score <= 0 || !hasAdmissionSignal) return null;
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

const CONTEXTUAL_TRACE_RELATIONS = new Set<TheoryBadgeEdgeV1["relation"]>([
  "bounds",
  "shares_units",
  "diagnostic_checks",
  "documents",
  "blocks",
]);

const MAX_CONTEXTUAL_TRACE_HOPS = 1;

const contextualTraceHop = (edge: TheoryBadgeEdgeV1) =>
  CONTEXTUAL_TRACE_RELATIONS.has(edge.relation) ? 1 : 0;

const traversalStateKey = (id: string, contextualHops: number) => `${id}\u0000${contextualHops}`;

function boundedTraversalDistances(args: {
  badgeId: string;
  adjacency: Map<string, TheoryBadgeEdgeV1[]>;
  nextId: (edge: TheoryBadgeEdgeV1) => string;
  direction: "incoming" | "outgoing";
}) {
  const distances = new Map<string, number>();
  const stateDistances = new Map<string, number>();
  const queue: Array<{ id: string; distance: number; contextualHops: number }> = [
    { id: args.badgeId, distance: 0, contextualHops: 0 },
  ];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const stateKey = traversalStateKey(current.id, current.contextualHops);
    if ((stateDistances.get(stateKey) ?? Number.POSITIVE_INFINITY) <= current.distance) continue;
    stateDistances.set(stateKey, current.distance);
    distances.set(current.id, Math.min(distances.get(current.id) ?? Number.POSITIVE_INFINITY, current.distance));
    if (args.direction === "outgoing" && current.contextualHops > 0) continue;
    for (const edge of args.adjacency.get(current.id) ?? []) {
      const contextualHop = contextualTraceHop(edge);
      if (contextualHop > 0 && args.direction === "incoming" && current.distance > 0) continue;
      const contextualHops = current.contextualHops + contextualHop;
      if (contextualHops > MAX_CONTEXTUAL_TRACE_HOPS) continue;
      queue.push({
        id: args.nextId(edge),
        distance: current.distance + 1,
        contextualHops,
      });
    }
  }
  return distances;
}

function ancestorDistances(badgeId: string, incoming: Map<string, TheoryBadgeEdgeV1[]>) {
  return boundedTraversalDistances({
    badgeId,
    adjacency: incoming,
    nextId: (edge) => edge.from,
    direction: "incoming",
  });
}

function descendantDistances(badgeId: string, outgoing: Map<string, TheoryBadgeEdgeV1[]>) {
  return boundedTraversalDistances({
    badgeId,
    adjacency: outgoing,
    nextId: (edge) => edge.to,
    direction: "outgoing",
  });
}

function shortestDirectedPath(args: {
  from: string;
  to: string;
  outgoing: Map<string, TheoryBadgeEdgeV1[]>;
}) {
  const queue: Array<{ id: string; badgeIds: string[]; edgeIds: string[]; contextualHops: number }> = [
    { id: args.from, badgeIds: [args.from], edgeIds: [], contextualHops: 0 },
  ];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.id === args.to) return current;
    const stateKey = traversalStateKey(current.id, current.contextualHops);
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);
    if (current.contextualHops > 0) continue;
    for (const edge of args.outgoing.get(current.id) ?? []) {
      const contextualHops = current.contextualHops + contextualTraceHop(edge);
      if (contextualHops > MAX_CONTEXTUAL_TRACE_HOPS) continue;
      if (visited.has(traversalStateKey(edge.to, contextualHops))) continue;
      queue.push({
        id: edge.to,
        badgeIds: [...current.badgeIds, edge.to],
        edgeIds: [...current.edgeIds, edge.id],
        contextualHops,
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
  const descendantMaps = selectedBadgeIds.map((id) => descendantDistances(id, outgoing));
  const sharedDescendantIds = Array.from(descendantMaps[0].keys()).filter((descendantId) =>
    descendantMaps.every((map) => map.has(descendantId)),
  );
  const rankedJunctions = sharedDescendantIds
    .filter((id) => badgesById.get(id)?.tags.includes("selection_convergence_junction"))
    .map((id) => ({
      id,
      distances: descendantMaps.map((map) => map.get(id) ?? Number.POSITIVE_INFINITY),
    }))
    .filter(({ distances }) => distances.every((distance) => distance <= 4))
    .filter(({ distances }) => distances.reduce((sum, distance) => sum + distance, 0) <= 6)
    .sort((left, right) => {
      const leftTotal = left.distances.reduce((sum, distance) => sum + distance, 0);
      const rightTotal = right.distances.reduce((sum, distance) => sum + distance, 0);
      const leftMax = Math.max(...left.distances);
      const rightMax = Math.max(...right.distances);
      return leftTotal - rightTotal || leftMax - rightMax || left.id.localeCompare(right.id);
    });
  const rootAncestor = rankedAncestors[0] ?? null;
  const commonJunction = rootAncestor ? null : rankedJunctions[0]?.id ?? null;
  const pathRequests = rootAncestor
    ? selectedBadgeIds.map((to) => ({ from: rootAncestor, to }))
    : commonJunction
      ? selectedBadgeIds.map((from) => ({ from, to: commonJunction }))
      : selectedBadgeIds.map((to) => ({ from: selectedBadgeIds[0], to }));
  const pathSegments = pathRequests
    .map(({ from, to }) => {
      const path = shortestDirectedPath({ from, to, outgoing });
      if (!path) {
        warnings.push("no directed connection between " + from + " and " + to);
        return null;
      }
      return {
        from,
        to,
        badgeIds: path.badgeIds,
        edgeIds: path.edgeIds,
      };
    })
    .filter((segment): segment is TheoryBadgeConnectionTrace["pathSegments"][number] => Boolean(segment));

  const selectedBadges = selectedBadgeIds.map((id) => badgesById.get(id)).filter((badge): badge is TheoryBadgeV1 => Boolean(badge));
  const sharedValues = (
    selector: (badge: TheoryBadgeV1) => string[],
    equivalent: (left: string, right: string) => boolean = (left, right) =>
      normalizeKey(left) === normalizeKey(right),
  ) => {
    if (selectedBadges.length === 0) return [];
    const [first, ...rest] = selectedBadges.map(selector);
    return first.filter((value) =>
      rest.every((values) => values.some((candidate) => equivalent(candidate, value))),
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
    sharedSymbols: unique(sharedValues(badgeSymbols, (left, right) => left.trim() === right.trim())),
    sharedUnitSignatures: unique(sharedValues(badgeUnitSignatures)),
    pathSegments,
    claimBoundaryNotes,
    warnings,
  };
}
