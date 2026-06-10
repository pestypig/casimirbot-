import type { PhysicsAtlasBlockId, PhysicsAtlasBlockV1 } from "../contracts/physics-atlas.v1";
import type { TheoryBiomeBand } from "../contracts/theory-biome-layout.v1";
import {
  buildTheoryContextReflectionV1,
  type TheoryContextReflectionConfidenceMode,
  type TheoryContextReflectionMatchV1,
  type TheoryContextReflectionRecommendedActionV1,
  type TheoryContextReflectionSource,
  type TheoryContextReflectionUncertaintyV1,
  type TheoryContextReflectionV1,
} from "../contracts/theory-context-reflection.v1";
import type { TheoryBadgeGraphV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";
import { buildHelixPhysicsAtlasV1 } from "./physics-atlas-blocks";
import { resolvePhysicsAtlasLens } from "./physics-atlas-lens";
import { buildTheoryBiomeLayoutV1 } from "./theory-biome-layout";
import {
  locateTheoryBadges,
  traceTheoryBadgeConnections,
  type TheoryBadgeLookupMatch,
} from "./theory-badge-overlap-locator";

export type BuildTheoryContextReflectionInput = {
  graph: TheoryBadgeGraphV1;
  prompt: string;
  conversationContext?: string | null;
  mentionedEquations?: string[];
  mentionedSymbols?: string[];
  mentionedDomains?: string[];
  confidenceMode?: TheoryContextReflectionConfidenceMode;
  source?: TheoryContextReflectionSource;
  limit?: number;
  generatedAt?: string;
  reflectionId?: string;
};

const STRONG_MATCH_SCORE = 70;

const DIRECT_MATCH_REASON_PATTERNS = [
  /direct badge id match/i,
  /direct badge title match/i,
  /calculator payload match/i,
  /symbol match/i,
  /equation family match/i,
  /repo path match/i,
  /source path hint/i,
] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string): string {
  return normalize(value)
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function roundProbability(value: number): number {
  return Number(value.toFixed(6));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function entropyBits(probabilities: number[]): number {
  return Number(
    probabilities
      .filter((probability) => probability > 0)
      .reduce((entropy, probability) => entropy - probability * Math.log2(probability), 0)
      .toFixed(6),
  );
}

function probabilityByBadgeId(matches: TheoryBadgeLookupMatch[]): Record<string, number> {
  if (matches.length === 0) return {};
  const weights = matches.map((match) => Math.max(0, match.score));
  const totalWeight = sum(weights);
  if (totalWeight <= 0) {
    const uniform = roundProbability(1 / matches.length);
    return Object.fromEntries(matches.map((match) => [match.badgeId, uniform]));
  }
  return Object.fromEntries(
    matches.map((match, index) => [match.badgeId, roundProbability(weights[index] / totalWeight)]),
  );
}

function aggregateProbabilityByKey(
  badgeProbabilities: Record<string, number>,
  keyForBadgeId: (badgeId: string) => string | null,
): Record<string, number> {
  const aggregate = new Map<string, number>();
  for (const [badgeId, probability] of Object.entries(badgeProbabilities)) {
    const key = keyForBadgeId(badgeId);
    if (!key) continue;
    aggregate.set(key, (aggregate.get(key) ?? 0) + probability);
  }
  return Object.fromEntries(
    [...aggregate.entries()]
      .map(([key, probability]) => [key, roundProbability(probability)] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function uncertaintyMode(args: {
  matchCount: number;
  priorEntropyBits: number;
  posteriorEntropyBits: number;
  badgeProbabilityById: Record<string, number>;
}): TheoryContextReflectionUncertaintyV1["uncertaintyMode"] {
  if (args.matchCount === 0) return "broad";
  const topProbability = Math.max(0, ...Object.values(args.badgeProbabilityById));
  if (
    topProbability >= 0.55 ||
    (args.priorEntropyBits > 0 && args.posteriorEntropyBits <= args.priorEntropyBits * 0.45)
  ) {
    return "focused";
  }
  if (args.priorEntropyBits === 0 || args.posteriorEntropyBits >= args.priorEntropyBits * 0.78) {
    return "broad";
  }
  return "ambiguous";
}

function queryText(args: BuildTheoryContextReflectionInput): string {
  return unique([
    args.prompt,
    args.conversationContext ?? "",
    ...(args.mentionedEquations ?? []),
  ]).join("\n");
}

function textIncludes(value: string, candidate: string): boolean {
  return Boolean(value && candidate && normalize(value).includes(normalize(candidate)));
}

function badgeById(graph: TheoryBadgeGraphV1): Map<string, TheoryBadgeV1> {
  return new Map(graph.badges.map((badge) => [badge.id, badge]));
}

function inferAtlasBlockIds(args: {
  atlasBlocks: PhysicsAtlasBlockV1[];
  mentionedDomains: string[];
  query: string;
}): PhysicsAtlasBlockId[] {
  const requestedKeys = new Set(args.mentionedDomains.map(normalizeKey));
  const query = args.query;
  return args.atlasBlocks
    .filter((block) => {
      if (requestedKeys.has(normalizeKey(block.id))) return true;
      if (requestedKeys.has(normalizeKey(block.title)) || requestedKeys.has(normalizeKey(block.shortTitle))) return true;
      if (block.subjects.some((subject) => requestedKeys.has(normalizeKey(subject)))) return true;
      return (
        textIncludes(query, block.title) ||
        textIncludes(query, block.shortTitle) ||
        block.subjects.some((subject) => textIncludes(query, subject)) ||
        block.equationFamilies.some((family) => textIncludes(query, family)) ||
        block.simulationOwners.some((owner) => textIncludes(query, owner))
      );
    })
    .map((block) => block.id);
}

function inferEquationFamilies(graph: TheoryBadgeGraphV1, query: string, equations: string[]): string[] {
  const text = `${query}\n${equations.join("\n")}`;
  return unique(
    graph.badges.flatMap((badge) =>
      badge.equationFamilies.filter((family) => textIncludes(text, family)),
    ),
  );
}

function inferSimulationOwners(graph: TheoryBadgeGraphV1, query: string, domains: string[]): string[] {
  const keys = new Set(domains.map(normalizeKey));
  return unique(
    graph.badges.flatMap((badge) =>
      badge.simulationOwners.filter((owner) => keys.has(normalizeKey(owner)) || textIncludes(query, owner)),
    ),
  );
}

function isExactMatch(match: TheoryBadgeLookupMatch): boolean {
  return (
    match.score >= STRONG_MATCH_SCORE ||
    match.reasons.some((reason) => DIRECT_MATCH_REASON_PATTERNS.some((pattern) => pattern.test(reason)))
  );
}

function hasDirectMatchReason(match: TheoryBadgeLookupMatch): boolean {
  return match.reasons.some((reason) =>
    DIRECT_MATCH_REASON_PATTERNS.some((pattern) => pattern.test(reason)),
  );
}

function toReflectionMatch(match: TheoryBadgeLookupMatch): TheoryContextReflectionMatchV1 {
  return {
    badgeId: match.badgeId,
    title: match.badgeTitle,
    score: match.score,
    reasons: match.reasons,
    matchedSymbols: match.matchedSymbols,
    matchedEquationFamilies: match.matchedEquationFamilies,
    matchedRepoPaths: match.matchedRepoPaths,
    claimBoundaryNotes: match.claimBoundaryWarnings,
  };
}

function scoreAtlasBlock(args: {
  block: PhysicsAtlasBlockV1;
  matches: TheoryBadgeLookupMatch[];
  query: string;
  mentionedDomains: string[];
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const matchedBadgeIds = new Set(args.matches.map((match) => match.badgeId));
  const mentionedDomainKeys = new Set(args.mentionedDomains.map(normalizeKey));

  const primaryHits = args.block.primaryBadgeIds.filter((id) => matchedBadgeIds.has(id));
  if (primaryHits.length > 0) {
    score += 35 * primaryHits.length;
    reasons.push(`primary badge matches: ${primaryHits.join(", ")}`);
  }

  const rootHits = args.block.rootBadgeIds.filter((id) => matchedBadgeIds.has(id));
  if (rootHits.length > 0) {
    score += 20 * rootHits.length;
    reasons.push(`root badge matches: ${rootHits.join(", ")}`);
  }

  if (
    mentionedDomainKeys.has(normalizeKey(args.block.id)) ||
    mentionedDomainKeys.has(normalizeKey(args.block.title)) ||
    mentionedDomainKeys.has(normalizeKey(args.block.shortTitle))
  ) {
    score += 40;
    reasons.push("mentioned domain matched atlas block");
  }

  const subjectHits = args.block.subjects.filter((subject) => textIncludes(args.query, subject));
  if (subjectHits.length > 0) {
    score += 12 * subjectHits.length;
    reasons.push(`subject hits: ${subjectHits.join(", ")}`);
  }

  return { score, reasons: unique(reasons) };
}

function claimBoundaryNotes(matches: TheoryBadgeLookupMatch[], traceNotes: string[]): string[] {
  return unique([
    ...matches.flatMap((match) => match.claimBoundaryWarnings.map((warning) => `${match.badgeId}: ${warning}`)),
    ...traceNotes,
  ]);
}

function hasScalarRows(matches: TheoryBadgeLookupMatch[]): boolean {
  return matches.some((match) => match.calculatorPayloadIds.length > 0);
}

function firstScalarBadgeId(matches: TheoryBadgeLookupMatch[]): string | null {
  return matches.find((match) => match.calculatorPayloadIds.length > 0)?.badgeId ?? null;
}

function firstRuntimeBadgeId(graph: TheoryBadgeGraphV1, badgeIds: string[]): string | null {
  const badges = badgeById(graph);
  for (const id of badgeIds) {
    const badge = badges.get(id);
    if (
      badge?.equations.some((equation) =>
        typeof equation.operatorKind === "string" &&
        [
          "tensor_component",
          "field_sample",
          "region_aggregate",
          "worldline_integral",
          "gate_status",
          "noncomputable_reference",
        ].includes(equation.operatorKind),
      )
    ) {
      return id;
    }
  }
  return null;
}

function hasRuntimeRows(graph: TheoryBadgeGraphV1, badgeIds: string[]): boolean {
  return firstRuntimeBadgeId(graph, badgeIds) !== null;
}

function recommendedActions(args: {
  graph: TheoryBadgeGraphV1;
  selectedBadgeIds: string[];
  matches: TheoryBadgeLookupMatch[];
}): TheoryContextReflectionRecommendedActionV1[] {
  const selectedBadgeIds = unique(args.selectedBadgeIds);
  if (selectedBadgeIds.length === 0) return [];
  const scalarBadgeId = firstScalarBadgeId(args.matches);
  const runtimeBadgeId = firstRuntimeBadgeId(args.graph, selectedBadgeIds);
  const actions: TheoryContextReflectionRecommendedActionV1[] = [
    {
      actionId: "theory-badge-graph.build_compound_theory_run",
      label: "Build compound theory run",
      panelId: "theory-badge-graph" as const,
      args: {
        badge_ids: selectedBadgeIds,
        mode: "dependency_path",
        include_scalar: true,
        include_runtime: true,
        include_evidence: true,
        include_boundaries: true,
      },
      mutatesCalculator: false,
      solves: false,
    },
    {
      actionId: "theory-badge-graph.load_compound_theory_run",
      label: "Load compound theory run",
      panelId: "theory-badge-graph" as const,
      args: {
        badge_ids: selectedBadgeIds,
        mode: "dependency_path",
      },
      mutatesCalculator: true,
      solves: false,
    },
  ];

  if (hasScalarRows(args.matches)) {
    actions.push({
      actionId: "theory-badge-graph.load_payloads_to_calculator",
      label: "Load scalar payloads",
      panelId: "theory-badge-graph",
      args: {
        ...(scalarBadgeId ? { badge_id: scalarBadgeId } : {}),
      },
      mutatesCalculator: true,
      solves: false,
    });
  }

  if (runtimeBadgeId) {
    actions.push({
      actionId: "theory-badge-graph.get_runtime_math_trace",
      label: "Get runtime math trace",
      panelId: "theory-badge-graph",
      args: {
        badge_id: runtimeBadgeId,
      },
      mutatesCalculator: false,
      solves: false,
    });
  }

  return actions;
}

function summaryText(args: {
  domains: Array<{ title: string }>;
  exactMatches: TheoryContextReflectionMatchV1[];
  likelyMatches: TheoryContextReflectionMatchV1[];
  claimBoundaries: string[];
}): string {
  const domainText = args.domains.map((domain) => domain.title).slice(0, 3).join(" and ");
  const exactText = args.exactMatches.map((match) => match.title).slice(0, 3).join(", ");
  const likelyText = args.likelyMatches.map((match) => match.title).slice(0, 3).join(", ");
  const boundaryText = args.claimBoundaries.length > 0 ? " Claim boundaries remain diagnostic/proxy constrained." : "";

  if (domainText && exactText) {
    return `The discussion appears near ${domainText}, with exact matches on ${exactText}.${boundaryText}`;
  }
  if (domainText && likelyText) {
    return `The discussion appears near ${domainText}, with likely matches on ${likelyText}.${boundaryText}`;
  }
  if (exactText) return `The discussion has exact theory badge matches on ${exactText}.${boundaryText}`;
  if (likelyText) return `The discussion has likely theory badge matches on ${likelyText}.${boundaryText}`;
  return "The discussion did not produce a strong theory badge location. No final answer is implied.";
}

const THEORY_IDEOLOGY_BRIDGE_THEORY_CUE =
  /\b(?:theory\s+(?:badge\s*)?graph|physics\s+(?:badge\s*)?graph|observable\s+physics|mathematics|entropy|conservation|self[-\s]?organization|chemistry|first\s+principles|boundary\s+conditions?|feedback\s+loops?|symmetry|invariance)\b/i;

const THEORY_IDEOLOGY_BRIDGE_ZEN_CUE =
  /\b(?:zen\s*(?:badge\s*)?graph|zengraph|fruition|justice|fairness|due\s+process|morality|moral|ethos|procedural\s+justice|personalization|priorit(?:y|ies)|non[-\s]?harm|right\s+speech)\b/i;

const BRIDGE_FOCUS_GROUPS = [
  {
    label: "entropy",
    lookupQuery: "entropy irreversibility open_system_entropy",
    promptPattern: /\b(?:entropy|drift|irreversibility|impermanence)\b/i,
    evidencePattern: /\b(?:entropy|drift|irreversibility|impermanence|open_system_entropy)\b/i,
  },
  {
    label: "conservation",
    lookupQuery: "conservation stress_energy_conservation energy_momentum_conservation",
    promptPattern: /\b(?:conservation|stress[-_\s]?energy\s+conservation)\b/i,
    evidencePattern: /\b(?:conservation|stress[-_\s]?energy\s+conservation|energy[-_\s]?momentum\s+conservation)\b/i,
  },
  {
    label: "self-organization",
    lookupQuery: "self organization feedback non_equilibrium open_system",
    promptPattern: /\b(?:self[-_\s]?organization|self[-_\s]?organizing|feedback\s+loops?)\b/i,
    evidencePattern: /\b(?:self[-_\s]?organization|self[-_\s]?organizing|feedback\s+loops?|open_system|non_equilibrium)\b/i,
  },
  {
    label: "observation",
    lookupQuery: "observation measurement provenance falsifiability",
    promptPattern: /\b(?:observation|measurement|provenance|falsifiability|testable|source\s+refs?)\b/i,
    evidencePattern: /\b(?:observation|measurement|provenance|falsifiability|testable|observational_proxy)\b/i,
  },
  {
    label: "boundary conditions",
    lookupQuery: "boundary conditions boundary_condition error_budget",
    promptPattern: /\b(?:boundary\s+conditions?|jurisdiction|contestability)\b/i,
    evidencePattern: /\b(?:boundary\s+conditions?|boundary_condition|error_budget|jurisdiction|contestability)\b/i,
  },
  {
    label: "symmetry",
    lookupQuery: "symmetry invariance unit dimension energy_momentum",
    promptPattern: /\b(?:symmetry|invariance|equal[-_\s]?condition|unit|dimension)\b/i,
    evidencePattern: /\b(?:symmetry|invariance|unit|dimension|energy[-_\s]?momentum)\b/i,
  },
] as const;

function isTheoryIdeologyBridgePrompt(query: string): boolean {
  return THEORY_IDEOLOGY_BRIDGE_THEORY_CUE.test(query) && THEORY_IDEOLOGY_BRIDGE_ZEN_CUE.test(query);
}

function requestedBridgeFocusGroups(query: string): Array<(typeof BRIDGE_FOCUS_GROUPS)[number]> {
  return BRIDGE_FOCUS_GROUPS.filter((group) => group.promptPattern.test(query));
}

function bridgeFocusEvidenceText(match: TheoryBadgeLookupMatch): string {
  const directReasons = match.reasons.filter((reason) =>
    !/direct atlas primary badge|inside selected atlas lens|via atlas block|source path hint via atlas block|calculator example expression\/symbol match/i.test(
      reason,
    ),
  );
  return [
    match.badgeId,
    match.badgeTitle,
    ...match.matchedSubjects,
    ...match.matchedEquationFamilies,
    ...match.matchedSymbols,
    ...directReasons,
  ].join(" ");
}

function bridgeFocusScore(match: TheoryBadgeLookupMatch, focusGroups: Array<(typeof BRIDGE_FOCUS_GROUPS)[number]>): number {
  if (focusGroups.length === 0) return 0;
  const evidenceText = bridgeFocusEvidenceText(match);
  const matchedFocusGroups = focusGroups.filter((group) => group.evidencePattern.test(evidenceText));
  if (matchedFocusGroups.length === 0) return 0;
  const directReasonCount = match.reasons.filter((reason) =>
    /subject\/tag match|equation family match|symbol match|calculator payload match|text match/i.test(reason),
  ).length;
  return matchedFocusGroups.length * 100 + Math.min(40, directReasonCount * 10);
}

function prioritizeTheoryIdeologyBridgeMatches(args: {
  query: string;
  matches: TheoryBadgeLookupMatch[];
}): TheoryBadgeLookupMatch[] {
  if (!isTheoryIdeologyBridgePrompt(args.query)) return args.matches;
  const focusGroups = requestedBridgeFocusGroups(args.query);
  if (focusGroups.length === 0) return args.matches;
  return [...args.matches].sort((left, right) => {
    const focusDelta = bridgeFocusScore(right, focusGroups) - bridgeFocusScore(left, focusGroups);
    if (focusDelta !== 0) return focusDelta;
    return right.score - left.score || left.badgeId.localeCompare(right.badgeId);
  });
}

function mergeTheoryLookupMatches(matches: TheoryBadgeLookupMatch[]): TheoryBadgeLookupMatch[] {
  const byBadgeId = new Map<string, TheoryBadgeLookupMatch>();
  for (const match of matches) {
    const existing = byBadgeId.get(match.badgeId);
    if (!existing || match.score > existing.score) {
      byBadgeId.set(match.badgeId, match);
    }
  }
  return Array.from(byBadgeId.values());
}

export function buildTheoryContextReflection(
  args: BuildTheoryContextReflectionInput,
): TheoryContextReflectionV1 {
  const confidenceMode = args.confidenceMode ?? "soft_locator";
  const source = args.source ?? "helix_ask";
  const limit = Math.max(1, Math.min(24, args.limit ?? 12));
  const atlas = buildHelixPhysicsAtlasV1({ graph: args.graph });
  const query = queryText(args);
  const mentionedEquations = args.mentionedEquations ?? [];
  const mentionedSymbols = args.mentionedSymbols ?? [];
  const mentionedDomains = args.mentionedDomains ?? [];
  const bridgePrompt = isTheoryIdeologyBridgePrompt(query);
  const atlasBlockIds = inferAtlasBlockIds({
    atlasBlocks: atlas.blocks,
    mentionedDomains,
    query,
  });
  const equationFamilies = inferEquationFamilies(args.graph, query, mentionedEquations);
  const simulationOwners = inferSimulationOwners(args.graph, query, mentionedDomains);
  const lookupLimit = bridgePrompt ? Math.max(limit, 40) : limit;
  const bridgeFocusGroups = bridgePrompt ? requestedBridgeFocusGroups(query) : [];

  const locatedMatches = prioritizeTheoryIdeologyBridgeMatches({
    query,
    matches: mergeTheoryLookupMatches([
      ...locateTheoryBadges({
        graph: args.graph,
        input: {
          query,
          symbols: mentionedSymbols,
          subjects: mentionedDomains,
          equationFamilies,
          simulationOwners,
          atlasBlockIds,
          limit: lookupLimit,
        },
      }),
      ...bridgeFocusGroups.flatMap((group) =>
        locateTheoryBadges({
          graph: args.graph,
          input: {
            query: group.lookupQuery,
            limit: 8,
          },
        }),
      ),
    ]),
  }).slice(0, limit);

  const exactLookupMatches = locatedMatches.filter(isExactMatch);
  const likelyLookupMatches =
    confidenceMode === "strict_badge_match"
      ? locatedMatches.filter((match) => !isExactMatch(match) && match.score >= STRONG_MATCH_SCORE)
      : locatedMatches.filter((match) => !isExactMatch(match));
  const exactMatches = exactLookupMatches.map(toReflectionMatch);
  const likelyMatches = likelyLookupMatches.map(toReflectionMatch);
  const traceTargetIds = unique([...exactLookupMatches, ...likelyLookupMatches].slice(0, 8).map((match) => match.badgeId));
  const trace = traceTheoryBadgeConnections({ graph: args.graph, badgeIds: traceTargetIds });
  const connectedBadgeIds = trace.connectingBadgeIds;
  const highlightedBadgeIds = unique([...traceTargetIds, ...connectedBadgeIds]);
  const highlightedEdgeIds = unique(trace.pathSegments.flatMap((segment) => segment.edgeIds));
  const maxScore = Math.max(1, ...locatedMatches.map((match) => match.score));
  const heatByBadgeId = Object.fromEntries(
    locatedMatches.map((match) => [match.badgeId, Math.min(1, Number((match.score / maxScore).toFixed(4)))]),
  );

  const inferredDomains = atlas.blocks
    .map((block) => {
      const blockScore = scoreAtlasBlock({ block, matches: locatedMatches, query, mentionedDomains });
      return {
        atlasBlockId: block.id,
        title: block.title,
        score: blockScore.score,
        reasons: blockScore.reasons,
      };
    })
    .filter((domain) => domain.score > 0)
    .sort((left, right) => right.score - left.score || left.atlasBlockId.localeCompare(right.atlasBlockId))
    .slice(0, 5);

  const exactBadgeIds = exactMatches.map((match) => match.badgeId);
  const likelyBadgeIds = likelyMatches.map((match) => match.badgeId);
  const centerBadgeIds = exactBadgeIds.length > 0 ? exactBadgeIds.slice(0, 3) : likelyBadgeIds.slice(0, 3);
  const softRegionBadgeIds = unique([...exactBadgeIds, ...likelyBadgeIds, ...connectedBadgeIds]);
  const biomeLayout = buildTheoryBiomeLayoutV1(args.graph);
  const biomeCoordinateByBadgeId = new Map(biomeLayout.coordinates.map((coordinate) => [coordinate.badgeId, coordinate]));
  const biomeFocusCoordinates = unique([...centerBadgeIds, ...exactBadgeIds, ...likelyBadgeIds, ...connectedBadgeIds])
    .map((badgeId) => biomeCoordinateByBadgeId.get(badgeId))
    .filter((coordinate): coordinate is NonNullable<typeof coordinate> => Boolean(coordinate));
  const badgeProbabilityById = probabilityByBadgeId(locatedMatches);
  const renderChunkProbabilityById = aggregateProbabilityByKey(
    badgeProbabilityById,
    (badgeId) => biomeCoordinateByBadgeId.get(badgeId)?.renderChunkId ?? null,
  );
  const semanticChunkProbabilityById = aggregateProbabilityByKey(
    badgeProbabilityById,
    (badgeId) => biomeCoordinateByBadgeId.get(badgeId)?.semanticChunkId ?? null,
  );
  const priorEntropyBits =
    locatedMatches.length > 0 ? Number(Math.log2(locatedMatches.length).toFixed(6)) : 0;
  const posteriorEntropyBits = entropyBits(Object.values(badgeProbabilityById));
  const informationGainBits = Number(Math.max(0, priorEntropyBits - posteriorEntropyBits).toFixed(6));
  const uncertainty: TheoryContextReflectionUncertaintyV1 = {
    badgeProbabilityById,
    renderChunkProbabilityById,
    semanticChunkProbabilityById,
    priorEntropyBits,
    posteriorEntropyBits,
    informationGainBits,
    normalizedMass: roundProbability(sum(Object.values(badgeProbabilityById))),
    uncertaintyMode: uncertaintyMode({
      matchCount: locatedMatches.length,
      priorEntropyBits,
      posteriorEntropyBits,
      badgeProbabilityById,
    }),
  };
  const suggestedBiomeChunkIds = unique(
    biomeFocusCoordinates.map((coordinate) => coordinate.renderChunkId),
  ).slice(0, 8);
  const suggestedSemanticChunkIds = unique(
    biomeFocusCoordinates.map((coordinate) => coordinate.semanticChunkId),
  ).slice(0, 8);
  const suggestedScaleBands = unique(biomeFocusCoordinates.map((coordinate) => coordinate.scaleBand)).slice(
    0,
    8,
  ) as TheoryBiomeBand[];
  const allowSoftRegion =
    softRegionBadgeIds.length >= 2 &&
    (confidenceMode === "soft_locator" || exactLookupMatches.some(hasDirectMatchReason));
  const claimBoundaries = claimBoundaryNotes(locatedMatches, trace.claimBoundaryNotes);

  // Resolve atlas lenses after scoring so future callers can compare the reflected
  // domain with the map lens; the receipt itself stays graph-location focused.
  for (const domain of inferredDomains.slice(0, 2)) {
    resolvePhysicsAtlasLens({
      graph: args.graph,
      atlas,
      blockId: domain.atlasBlockId as PhysicsAtlasBlockId,
    });
  }

  return buildTheoryContextReflectionV1({
    generatedAt: args.generatedAt,
    reflectionId: args.reflectionId,
    graphId: args.graph.graphId,
    input: {
      prompt: args.prompt,
      conversationContext: args.conversationContext ?? null,
      mentionedEquations,
      mentionedSymbols,
      mentionedDomains,
      source,
      confidenceMode,
    },
    exactMatches,
    likelyMatches,
    inferredDomains,
    overlay: {
      centerBadgeIds,
      highlightedBadgeIds,
      highlightedEdgeIds,
      heatByBadgeId,
      exactBadgeIds,
      likelyBadgeIds,
      suggestedBiomeChunkIds,
      suggestedSemanticChunkIds,
      suggestedScaleBands,
      uncertainty,
      softRegion: allowSoftRegion
        ? {
            id: `discussion-zone:${args.graph.graphId}:${centerBadgeIds[0] ?? softRegionBadgeIds[0]}`,
            label: "Current discussion zone",
            badgeIds: softRegionBadgeIds,
            confidence: Math.min(1, Number((softRegionBadgeIds.length / Math.max(2, limit)).toFixed(4))),
            tone: "green",
            meaning: "discussion_context_not_proof",
          }
        : null,
    },
    evidenceForAsk: {
      summary: summaryText({
        domains: inferredDomains,
        exactMatches,
        likelyMatches,
        claimBoundaries,
      }),
      claimBoundaries,
      recommendedNextActions: recommendedActions({
        graph: args.graph,
        selectedBadgeIds: traceTargetIds,
        matches: locatedMatches,
      }),
    },
  });
}
