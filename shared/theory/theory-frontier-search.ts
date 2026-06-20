import { buildProbabilityTerrainV1 } from "../probability-terrain";
import type { TheoryBadgeEdgeRelation, TheoryBadgeGraphV1, TheoryBadgeSourceRefV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";
import type { TheoryBiomeCoordinateV1 } from "../contracts/theory-biome-layout.v1";
import { THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION } from "../contracts/theory-frontier-exact-contract-verification.v1";
import {
  buildTheoryFrontierCandidateV1,
  type TheoryFrontierKindV1,
  type TheoryFrontierCandidateStatusV1,
  type TheoryFrontierCandidateV1,
  type TheoryFrontierScoresV1,
  type TheoryFrontierUnitCompatibilityV1,
} from "../contracts/theory-frontier-candidate.v1";
import {
  buildTheoryFrontierSearchV1,
  type TheoryFrontierScholarlyLookupRequestV1,
  type TheoryFrontierSearchV1,
} from "../contracts/theory-frontier-search.v1";
import { buildTheoryBiomeLayoutV1, hashTheoryBiome01 } from "./theory-biome-layout";
import { locateTheoryBadges, traceTheoryBadgeConnections } from "./theory-badge-overlap-locator";

export const THEORY_FRONTIER_TAXONOMY_VERSION = "theory_frontier_taxonomy/v1" as const;
export const THEORY_FRONTIER_SCORING_VERSION = "theory_frontier_scoring/v1" as const;
export const THEORY_FRONTIER_VERIFIER_VERSION = THEORY_FRONTIER_EXACT_CONTRACT_VERIFIER_VERSION;

export type BuildTheoryFrontierSearchInput = {
  graph: TheoryBadgeGraphV1;
  query: string;
  searchSeed?: string;
  generatedAt?: string;
  limit?: number;
  originBadgeIds?: string[];
};

const FRONTIER_EDGE_RELATIONS = new Set<TheoryBadgeEdgeRelation>([
  "derives",
  "requires",
  "specializes",
  "approximates",
  "bounds",
  "shares_units",
  "uses_constant",
  "numerically_solves",
  "diagnostic_checks",
  "documents",
  "blocks",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "badge",
  "candidate",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "theory",
  "to",
  "with",
]);

const SOURCE_KEY_SEPARATOR = "::";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const round6 = (value: number): number => Number(value.toFixed(6));

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

function tokenize(value: string): string[] {
  return unique(
    value
      .toLowerCase()
      .split(/[^a-z0-9_./^-]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token) && !STOP_WORDS.has(normalizeKey(token))),
  );
}

function stableHashHex(input: string): string {
  let h = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    h ^= input.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function stableGraphProjection(graph: TheoryBadgeGraphV1): string {
  return JSON.stringify({
    graphId: graph.graphId,
    badges: graph.badges
      .map((badge) => ({
        id: badge.id,
        level: badge.level,
        status: badge.status,
        subjects: [...badge.subjects].sort(),
        equationFamilies: [...badge.equationFamilies].sort(),
        units: badge.units
          .map((unit) => ({
            symbol: unit.symbol,
            dimensionSignature: unit.dimensionSignature ?? null,
          }))
          .sort((left, right) => left.symbol.localeCompare(right.symbol)),
        sourceRefs: badge.sourceRefs
          .map((sourceRef) => sourceReferenceId(sourceRef))
          .sort(),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    edges: graph.edges
      .map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        relation: edge.relation,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}

export function hashTheoryFrontierGraph(graph: TheoryBadgeGraphV1): string {
  return `tfh_${stableHashHex(stableGraphProjection(graph))}`;
}

function badgeSymbols(badge: TheoryBadgeV1): string[] {
  return unique([
    ...badge.hintKeys.symbols,
    ...badge.units.map((unit) => unit.symbol),
    ...badge.equations.flatMap((equation) => [...equation.inputSymbols, ...equation.outputSymbols]),
  ]);
}

function badgeUnitSignatures(badge: TheoryBadgeV1): string[] {
  return unique([
    ...badge.hintKeys.unitSignatures,
    ...badge.units.map((unit) => unit.dimensionSignature ?? "").filter(Boolean),
  ]);
}

function intersection(valuesByBadge: string[][]): string[] {
  if (valuesByBadge.length === 0) return [];
  const [first, ...rest] = valuesByBadge.map((values) => values.map(normalizeKey));
  const commonKeys = first.filter((key) => rest.every((values) => values.includes(key)));
  return unique(
    commonKeys.map((key) => valuesByBadge[0].find((value) => normalizeKey(value) === key) ?? key),
  ).sort();
}

function compatibilityScore(valuesByBadge: string[][]): number {
  const unionSize = new Set(valuesByBadge.flat().map(normalizeKey)).size;
  if (unionSize === 0) return 0;
  return round6(intersection(valuesByBadge).length / unionSize);
}

function sourceReferenceId(sourceRef: TheoryBadgeSourceRefV1): string {
  return [sourceRef.kind, sourceRef.path ?? "", sourceRef.id ?? "", sourceRef.note ?? ""].join(SOURCE_KEY_SEPARATOR);
}

function uniqueSourceRefs(sourceRefs: TheoryBadgeSourceRefV1[]): TheoryBadgeSourceRefV1[] {
  const byKey = new Map<string, TheoryBadgeSourceRefV1>();
  for (const sourceRef of sourceRefs) {
    byKey.set(sourceReferenceId(sourceRef), sourceRef);
  }
  return [...byKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, sourceRef]) => sourceRef);
}

function candidatePairKey(left: string, right: string): string {
  return [left, right].sort().join("|");
}

function candidateQuery(candidate: TheoryFrontierCandidateV1): string {
  return unique([
    candidate.title,
    ...candidate.badgeIds,
    ...candidate.congruence.sharedSymbols,
    ...candidate.congruence.sharedEquationFamilies,
    ...candidate.congruence.sharedUnitSignatures,
  ]).join(" ");
}

export function buildTheoryFrontierScholarlyLookupRequests(
  candidates: TheoryFrontierCandidateV1[],
): TheoryFrontierScholarlyLookupRequestV1[] {
  return candidates
    .filter(
      (candidate) =>
        candidate.literaturePolicy.scholarlyLookupAllowed &&
        candidate.claimBoundary.promotionAllowed === false &&
        candidate.claimBoundary.validatesTheory === false,
    )
    .map((candidate) => {
      const requestedOutputs: TheoryFrontierScholarlyLookupRequestV1["requestedOutputs"] = [
        "scholarly_paper_refs",
        "doi_metadata",
      ];
      if (candidate.status === "exact_verification_pending" || candidate.status === "needs_scholarly_evidence") {
        requestedOutputs.push("scholarly_full_text", "paper_pdf_pages");
      }
      return {
        requestId: `scholarly_lookup:${stableHashHex(`${candidate.candidateId}:${candidateQuery(candidate)}`)}`,
        candidateId: candidate.candidateId,
        targetSource: "scholarly_research" as const,
        requestedOutputs,
        query: candidateQuery(candidate),
        badgeIds: [...candidate.badgeIds].sort(),
        renderChunkIds: [...candidate.biomeRegion.renderChunkIds].sort(),
        semanticChunkIds: [...candidate.biomeRegion.semanticChunkIds].sort(),
        reason: "High-value unresolved frontier candidate requires scholarly references as bounded evidence only.",
        mutating: false as const,
        noAutoPromoteLiterature: true as const,
      };
    })
    .sort((left, right) => left.requestId.localeCompare(right.requestId));
}

function sourceEvidenceReferences(badges: TheoryBadgeV1[]): TheoryBadgeSourceRefV1[] {
  return uniqueSourceRefs(badges.flatMap((badge) => badge.sourceRefs));
}

function observableRequirements(badges: TheoryBadgeV1[]): string[] {
  return unique([
    ...badges
      .filter((badge) => badge.level === "diagnostic_gate")
      .map((badge) => `diagnostic gate: ${badge.title}`),
    ...badges.flatMap((badge) =>
      badge.sourceRefs
        .filter((sourceRef) => sourceRef.kind === "test" || sourceRef.kind === "artifact" || sourceRef.kind === "visualizer_preset")
        .map((sourceRef) => `${sourceRef.kind}: ${sourceRef.path ?? sourceRef.id ?? badge.id}`),
    ),
  ]).sort();
}

function artifactRequirements(badges: TheoryBadgeV1[]): string[] {
  return unique([
    ...badges.flatMap((badge) => badge.calculatorPayloads.map((payload) => `calculator_payload:${payload.id}`)),
    ...badges.flatMap((badge) =>
      badge.sourceRefs
        .filter((sourceRef) => sourceRef.kind === "repo_module" || sourceRef.kind === "artifact" || sourceRef.kind === "test")
        .map((sourceRef) => `${sourceRef.kind}:${sourceRef.path ?? sourceRef.id ?? badge.id}`),
    ),
  ]).sort();
}

function claimBoundaryNotes(badges: TheoryBadgeV1[], traceNotes: string[]): string[] {
  return unique([
    ...traceNotes,
    ...badges.flatMap((badge) => {
      const notes: string[] = [];
      if (badge.claimBoundary.diagnosticOnly) notes.push(`${badge.id}: diagnostic-only`);
      if (!badge.claimBoundary.validationClaimAllowed) notes.push(`${badge.id}: validation claim not allowed`);
      if (!badge.claimBoundary.physicalMechanismClaimAllowed) {
        notes.push(`${badge.id}: physical mechanism claim not allowed`);
      }
      if (!badge.claimBoundary.promotionAllowed) notes.push(`${badge.id}: promotion not allowed`);
      return notes;
    }),
  ]).sort();
}

function falsificationChecks(badges: TheoryBadgeV1[], observables: string[]): string[] {
  return unique([
    ...observables.map((observable) => `candidate fails placement if required observable is absent: ${observable}`),
    ...badges.flatMap((badge) => badge.assumptions.map((assumption) => `candidate weakens if assumption fails: ${assumption}`)),
    "candidate must not be promoted without independent dimensional, observable, and falsifier closure",
  ]).slice(0, 12);
}

function coordinateEnvelope(coordinates: TheoryBiomeCoordinateV1[]): {
  min: number | null;
  max: number | null;
} {
  const scales = coordinates
    .map((coordinate) => coordinate.scaleLog10M)
    .filter((scale): scale is number => typeof scale === "number" && Number.isFinite(scale));
  if (scales.length === 0) return { min: null, max: null };
  return {
    min: Math.min(...scales),
    max: Math.max(...scales),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function scoreCheapBiome(coordinates: TheoryBiomeCoordinateV1[]): number {
  if (coordinates.length === 0) return 0;
  const semanticCount = new Set(coordinates.map((coordinate) => coordinate.semanticChunkId)).size;
  const domainCount = new Set(coordinates.map((coordinate) => coordinate.domainKey)).size;
  const renderCount = new Set(coordinates.map((coordinate) => coordinate.renderChunkId)).size;
  const compactness = clamp01(1 / Math.max(1, semanticCount));
  const domainFocus = clamp01(1 / Math.max(1, domainCount));
  const renderFocus = clamp01(1 / Math.max(1, renderCount));
  const boundaryPenalty = average(coordinates.map((coordinate) => coordinate.claimPressure)) * 0.2;
  return round6(clamp01(0.35 + compactness * 0.25 + domainFocus * 0.2 + renderFocus * 0.15 - boundaryPenalty));
}

function statusFor(args: {
  badges: TheoryBadgeV1[];
  unitCompatibility: TheoryFrontierUnitCompatibilityV1;
  requiredObservables: string[];
  sourceReferences: TheoryBadgeSourceRefV1[];
  firstPrinciplesPathBadgeIds: string[];
  averageClaimPressure: number;
}): TheoryFrontierCandidateStatusV1 {
  if (args.badges.some((badge) => badge.level === "claim_boundary") || args.averageClaimPressure >= 0.98) {
    return "blocked_by_boundary";
  }
  if (args.requiredObservables.length === 0) return "needs_observable";
  if (args.sourceReferences.length === 0) return "needs_scholarly_evidence";
  if (args.unitCompatibility === "incompatible") return "coarse_candidate";
  if (args.firstPrinciplesPathBadgeIds.length > 0) return "exact_verification_pending";
  return "coarse_candidate";
}

function edgeRelationsFor(graph: TheoryBadgeGraphV1, badgeIds: string[]): TheoryBadgeEdgeRelation[] {
  const badgeIdSet = new Set(badgeIds);
  return unique(
    graph.edges
      .filter((edge) => badgeIdSet.has(edge.from) && badgeIdSet.has(edge.to) && FRONTIER_EDGE_RELATIONS.has(edge.relation))
      .map((edge) => edge.relation),
  ) as TheoryBadgeEdgeRelation[];
}

function frontierKindFor(args: {
  directRelations: TheoryBadgeEdgeRelation[];
  requiredObservables: string[];
  sourceReferences: TheoryBadgeSourceRefV1[];
  status: TheoryFrontierCandidateStatusV1;
}): TheoryFrontierKindV1 {
  if (
    args.requiredObservables.length === 0 ||
    args.sourceReferences.length === 0 ||
    args.status === "needs_observable" ||
    args.status === "needs_scholarly_evidence"
  ) {
    return "unresolved_semantic_region";
  }
  if (args.directRelations.length === 0) {
    return "missing_intermediate_badge";
  }
  return "candidate_connection";
}

function selectCandidatePairs(args: {
  graph: TheoryBadgeGraphV1;
  query: string;
  searchSeed: string;
  originBadgeIds: string[];
  limit: number;
}): string[][] {
  const matches = locateTheoryBadges({
    graph: args.graph,
    input: {
      query: args.query,
      limit: Math.max(args.limit * 2, 12),
    },
  });
  const matchedIds = unique([...args.originBadgeIds, ...matches.map((match) => match.badgeId)])
    .filter((badgeId) => args.graph.badges.some((badge) => badge.id === badgeId))
    .slice(0, Math.max(args.limit * 2, 12));
  const pairKeys = new Set<string>();
  const pairs: string[][] = [];

  const pushPair = (left: string, right: string) => {
    if (left === right) return;
    const key = candidatePairKey(left, right);
    if (pairKeys.has(key)) return;
    pairKeys.add(key);
    pairs.push(key.split("|"));
  };

  for (const edge of args.graph.edges) {
    if (!FRONTIER_EDGE_RELATIONS.has(edge.relation)) continue;
    if (matchedIds.includes(edge.from)) pushPair(edge.from, edge.to);
    if (matchedIds.includes(edge.to)) pushPair(edge.from, edge.to);
  }

  for (let leftIndex = 0; leftIndex < matchedIds.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < matchedIds.length; rightIndex += 1) {
      pushPair(matchedIds[leftIndex], matchedIds[rightIndex]);
    }
  }

  return pairs
    .sort((left, right) => {
      const leftJitter = hashTheoryBiome01(`${args.searchSeed}:${left.join("|")}`);
      const rightJitter = hashTheoryBiome01(`${args.searchSeed}:${right.join("|")}`);
      return leftJitter - rightJitter || left.join("|").localeCompare(right.join("|"));
    })
    .slice(0, Math.max(1, args.limit));
}

function buildCandidate(args: {
  graph: TheoryBadgeGraphV1;
  graphHash: string;
  query: string;
  searchSeed: string;
  generatedAt: string;
  badgeIds: string[];
  coordinatesByBadgeId: Map<string, TheoryBiomeCoordinateV1>;
}): TheoryFrontierCandidateV1 {
  const badgesById = new Map(args.graph.badges.map((badge) => [badge.id, badge]));
  const badges = args.badgeIds.map((badgeId) => badgesById.get(badgeId)).filter((badge): badge is TheoryBadgeV1 => Boolean(badge));
  const coordinates = args.badgeIds
    .map((badgeId) => args.coordinatesByBadgeId.get(badgeId))
    .filter((coordinate): coordinate is TheoryBiomeCoordinateV1 => Boolean(coordinate));
  const trace = traceTheoryBadgeConnections({ graph: args.graph, badgeIds: args.badgeIds });
  const symbolsByBadge = badges.map(badgeSymbols);
  const unitsByBadge = badges.map(badgeUnitSignatures);
  const equationFamiliesByBadge = badges.map((badge) => unique([...badge.equationFamilies, ...badge.hintKeys.equationFamilies]));
  const sharedUnitSignatures = intersection(unitsByBadge);
  const sharedSymbols = intersection(symbolsByBadge);
  const sharedEquationFamilies = intersection(equationFamiliesByBadge);
  const sourceReferences = sourceEvidenceReferences(badges);
  const requiredObservables = observableRequirements(badges);
  const requiredArtifacts = artifactRequirements(badges);
  const firstPrincipleIds = trace.sharedAncestorIds.filter((badgeId) => {
    const badge = badgesById.get(badgeId);
    return badge?.level === "first_principle" || badge?.level === "law";
  });
  const firstPrinciplesPathBadgeIds = unique([...firstPrincipleIds, ...trace.connectingBadgeIds]);
  const averageClaimPressure = round6(average(coordinates.map((coordinate) => coordinate.claimPressure)));
  const unitCompatibility: TheoryFrontierUnitCompatibilityV1 =
    sharedUnitSignatures.length > 0 ? "compatible" : unitsByBadge.flat().length > 0 ? "partial" : "unknown";
  const boundaryNotes = claimBoundaryNotes(badges, trace.claimBoundaryNotes);
  const falsifiers = falsificationChecks(badges, requiredObservables);
  const symbolScore = compatibilityScore(symbolsByBadge);
  const equationScore = compatibilityScore(equationFamiliesByBadge);
  const directRelations = edgeRelationsFor(args.graph, args.badgeIds);
  const pathRelations = edgeRelationsFor(args.graph, firstPrinciplesPathBadgeIds);
  const cheapBiomeScore = scoreCheapBiome(coordinates);
  const congruenceScore = round6(
    clamp01(
      (unitCompatibility === "compatible" ? 0.3 : unitCompatibility === "partial" ? 0.16 : 0.08) +
        symbolScore * 0.2 +
        equationScore * 0.2 +
        (firstPrinciplesPathBadgeIds.length > 0 ? 0.2 : 0) +
        (pathRelations.length > 0 ? 0.1 : 0),
    ),
  );
  const evidenceClosureScore = round6(
    clamp01(
      Math.min(0.25, sourceReferences.length * 0.04) +
        Math.min(0.25, requiredObservables.length * 0.08) +
        Math.min(0.2, requiredArtifacts.length * 0.04) +
        Math.min(0.2, falsifiers.length * 0.04) +
        (boundaryNotes.length > 0 ? 0.1 : 0),
    ),
  );
  const estimatedCost = round6(1 + args.badgeIds.length * 0.75 + sourceReferences.length * 0.12 + requiredArtifacts.length * 0.08);
  const verifiedFrontierYieldPerBudget = round6((cheapBiomeScore + congruenceScore + evidenceClosureScore) / Math.max(1, estimatedCost));
  const scores: TheoryFrontierScoresV1 = {
    cheapBiomeScore,
    congruenceScore,
    evidenceClosureScore,
    informationGainBits: 0,
    estimatedCost,
    verifiedFrontierYieldPerBudget,
  };
  const status = statusFor({
    badges,
    unitCompatibility,
    requiredObservables,
    sourceReferences,
    firstPrinciplesPathBadgeIds,
    averageClaimPressure,
  });
  const frontierKind = frontierKindFor({
    directRelations,
    requiredObservables,
    sourceReferences,
    status,
  });
  const title = `Frontier: ${badges.map((badge) => badge.title).join(" <-> ")}`;
  const candidateId = `frontier:${stableHashHex(
    [args.graphHash, args.searchSeed, args.query, ...args.badgeIds].join("|"),
  )}`;

  return buildTheoryFrontierCandidateV1({
    generatedAt: args.generatedAt,
    candidateId,
    frontierKind,
    status,
    title,
    summary: "Deterministic candidate placement for a possible theory-graph connection; exact verification is required before any claim movement.",
    badgeIds: args.badgeIds,
    missingBadgeTitle:
      frontierKind === "missing_intermediate_badge"
        ? `Intermediate badge between ${badges.map((badge) => badge.title).join(" and ")}`
        : null,
    replay: {
      graphHash: args.graphHash,
      graphId: args.graph.graphId,
      query: args.query,
      searchSeed: args.searchSeed,
      taxonomyVersion: THEORY_FRONTIER_TAXONOMY_VERSION,
      scoringVersion: THEORY_FRONTIER_SCORING_VERSION,
      evidenceReferenceIds: sourceReferences.map(sourceReferenceId),
    },
    biomeRegion: {
      scaleEnvelopeLog10M: coordinateEnvelope(coordinates),
      scaleBands: unique(coordinates.map((coordinate) => coordinate.scaleBand)).sort(),
      domainKeys: unique(coordinates.map((coordinate) => coordinate.domainKey)).sort(),
      fidelityKeys: unique(coordinates.map((coordinate) => coordinate.fidelity)).sort(),
      renderChunkIds: unique(coordinates.map((coordinate) => coordinate.renderChunkId)).sort(),
      semanticChunkIds: unique(coordinates.map((coordinate) => coordinate.semanticChunkId)).sort(),
      averageClaimPressure,
    },
    congruence: {
      unitCompatibility,
      sharedUnitSignatures,
      dimensionalIssues: [],
      symbolCompatibilityScore: symbolScore,
      sharedSymbols,
      equationFamilyCompatibilityScore: equationScore,
      sharedEquationFamilies,
      sharedFirstPrincipleBadgeIds: firstPrincipleIds,
      firstPrinciplesPathBadgeIds,
      allowedTypedEdgeRelations: pathRelations,
      requiredObservables,
      requiredArtifacts,
      sourceReferences,
      falsificationChecks: falsifiers,
      uncertaintyBudget: [
        `placement entropy is scoped to query "${args.query}"`,
        `average claim pressure ${averageClaimPressure}`,
        "probability terrain is placement uncertainty, not truth probability",
      ],
      claimBoundaryNotes: boundaryNotes,
    },
    scores,
    literaturePolicy: {
      scholarlyLookupAllowed: status === "needs_scholarly_evidence" || status === "exact_verification_pending",
      noAutoPromoteLiterature: true,
      allowedEvidenceEffects: [
        "support_existing_context",
        "conflict_with_badge",
        "identify_missing_evidence",
        "suggest_missing_badge",
        "unrelated",
      ],
    },
    claimBoundary: {
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      promotionAllowed: false,
      terminalEligible: false,
      assistantAnswer: false,
      probabilityMeans: "placement_uncertainty_not_truth_probability",
    },
  });
}

export function buildTheoryFrontierSearch(input: BuildTheoryFrontierSearchInput): TheoryFrontierSearchV1 {
  const query = input.query.trim();
  const searchSeed = input.searchSeed?.trim() || `frontier:${normalizeKey(query) || "empty"}`;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const graphHash = hashTheoryFrontierGraph(input.graph);
  const layout = buildTheoryBiomeLayoutV1(input.graph);
  const coordinatesByBadgeId = new Map(layout.coordinates.map((coordinate) => [coordinate.badgeId, coordinate]));
  const candidateLimit = Math.max(1, Math.min(25, input.limit ?? 8));
  const pairs = selectCandidatePairs({
    graph: input.graph,
    query,
    searchSeed,
    originBadgeIds: input.originBadgeIds ?? [],
    limit: candidateLimit,
  });
  const rawCandidates = pairs.map((badgeIds) =>
    buildCandidate({
      graph: input.graph,
      graphHash,
      query,
      searchSeed,
      generatedAt,
      badgeIds,
      coordinatesByBadgeId,
    }),
  );
  const probabilityTerrain = buildProbabilityTerrainV1({
    graphKind: "theory_badge_graph",
    candidates: rawCandidates.map((candidate) => ({
      id: candidate.candidateId,
      weight: candidate.scores.verifiedFrontierYieldPerBudget,
      renderChunkId: candidate.biomeRegion.renderChunkIds[0] ?? null,
      semanticChunkId: candidate.biomeRegion.semanticChunkIds[0] ?? null,
    })),
  });
  const candidates = rawCandidates
    .map((candidate) => {
      const probability = probabilityTerrain.candidateProbabilityById[candidate.candidateId] ?? 0;
      return {
        ...candidate,
        scores: {
          ...candidate.scores,
          informationGainBits: round6(probability * probabilityTerrain.informationGainBits),
        },
      };
    })
    .sort((left, right) => {
      const scoreDelta = right.scores.verifiedFrontierYieldPerBudget - left.scores.verifiedFrontierYieldPerBudget;
      return scoreDelta !== 0 ? scoreDelta : left.candidateId.localeCompare(right.candidateId);
    });

  return buildTheoryFrontierSearchV1({
    generatedAt,
    searchId: `frontier_search:${stableHashHex([graphHash, query, searchSeed].join("|"))}`,
    graphId: input.graph.graphId,
    graphHash,
    query,
    searchSeed,
    taxonomyVersion: THEORY_FRONTIER_TAXONOMY_VERSION,
    scoringVersion: THEORY_FRONTIER_SCORING_VERSION,
    verifierVersion: THEORY_FRONTIER_VERIFIER_VERSION,
    candidates,
    scholarlyLookupRequests: buildTheoryFrontierScholarlyLookupRequests(candidates),
    probabilityTerrain,
    optimization: {
      candidateBudget: {
        requestedLimit: candidateLimit,
        evaluatedPairCount: pairs.length,
        emittedCandidateCount: candidates.length,
      },
    },
  });
}
