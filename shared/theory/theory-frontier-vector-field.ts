import type {
  TheoryBadgeEdgeRelation,
  TheoryBadgeGraphV1,
  TheoryBadgeSourceRefV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import {
  buildTheoryFrontierVectorFieldTraceV1,
  THEORY_BADGE_COORDINATE_BASIS_VERSION,
  type TheoryBadgeCoordinateVectorV1,
  type TheoryBadgeRelationTensorV1,
  type TheoryFrontierFitClassV1,
  type TheoryFrontierPlacementDiagnosticV1,
  type TheoryFrontierVectorCandidateTraceV1,
  type TheoryFrontierVectorDeltaV1,
  type TheoryFrontierVectorFieldTraceV1,
  type TheoryFrontierTraceDiagnosticsV1,
} from "../contracts/theory-frontier-vector-field.v1";
import { buildTheoryBiomeLayoutV1, computeTheoryBiomeDepths } from "./theory-biome-layout";
import { locateTheoryBadges, traceTheoryBadgeConnections } from "./theory-badge-overlap-locator";

export const THEORY_FRONTIER_VECTOR_FIELD_SCORING_VERSION = "theory_frontier_vector_scoring/v1" as const;
export const THEORY_FRONTIER_VECTOR_TAXONOMY_VERSION = "theory_frontier_vector_taxonomy/v1" as const;

export type TraceTheoryFrontierVectorFieldInput = {
  graph: TheoryBadgeGraphV1;
  query: string;
  searchSeed?: string;
  generatedAt?: string;
  basisVersion?: string;
  scoringVersion?: string;
  taxonomyVersion?: string;
  originBadgeIds?: string[];
  candidateBadgePairs?: string[][];
  limit?: number;
  maxDepth?: number;
};

const SOURCE_KEY_SEPARATOR = "::";

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

const AXES: TheoryBadgeRelationTensorV1["axes"] = [
  "scale_log10_m",
  "unit_dimension_signature",
  "equation_family",
  "domain",
  "fidelity",
  "claim_pressure",
  "evidence_density",
  "first_principles_depth",
];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const round6 = (value: number): number => Number(value.toFixed(6));

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean))).sort();

const average = (values: number[]): number =>
  values.length > 0 ? round6(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function stableHashHex(input: string): string {
  let h = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    h ^= input.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function sourceReferenceId(sourceRef: TheoryBadgeSourceRefV1): string {
  return [sourceRef.kind, sourceRef.path ?? "", sourceRef.id ?? "", sourceRef.note ?? ""].join(SOURCE_KEY_SEPARATOR);
}

function uniqueSourceRefs(sourceRefs: TheoryBadgeSourceRefV1[]): TheoryBadgeSourceRefV1[] {
  const byKey = new Map<string, TheoryBadgeSourceRefV1>();
  for (const sourceRef of sourceRefs) byKey.set(sourceReferenceId(sourceRef), sourceRef);
  return [...byKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, sourceRef]) => sourceRef);
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
        scaleEnvelope: badge.scaleEnvelope
          ? {
              characteristicLog10M: badge.scaleEnvelope.characteristicLog10M,
              minLog10M: badge.scaleEnvelope.minLog10M,
              maxLog10M: badge.scaleEnvelope.maxLog10M,
              basis: badge.scaleEnvelope.basis,
              sourceRefs: badge.scaleEnvelope.sourceRefs.map((sourceRef) => sourceReferenceId(sourceRef)).sort(),
            }
          : null,
        sourceRefs: badge.sourceRefs.map((sourceRef) => sourceReferenceId(sourceRef)).sort(),
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

export function hashTheoryFrontierVectorGraph(graph: TheoryBadgeGraphV1): string {
  return `tfh_${stableHashHex(stableGraphProjection(graph))}`;
}

function badgeUnitSignatures(badge: TheoryBadgeV1): string[] {
  return unique([
    ...badge.hintKeys.unitSignatures,
    ...badge.units.map((unit) => unit.dimensionSignature ?? "").filter(Boolean),
  ]);
}

function badgeSymbols(badge: TheoryBadgeV1): string[] {
  return unique([
    ...badge.hintKeys.symbols,
    ...badge.units.map((unit) => unit.symbol),
    ...badge.equations.flatMap((equation) => [...equation.inputSymbols, ...equation.outputSymbols]),
  ]);
}

function evidenceDensity(badge: TheoryBadgeV1): number {
  return round6(
    clamp01(
      badge.sourceRefs.length * 0.08 +
        badge.equations.length * 0.05 +
        badge.calculatorPayloads.length * 0.04 +
        badge.units.length * 0.03,
    ),
  );
}

function entropyFor(args: {
  vector: Omit<TheoryBadgeCoordinateVectorV1, "entropyContributionBits" | "uncertaintyBudget">;
  badge: TheoryBadgeV1;
}): { entropy: number; budget: string[] } {
  const budget: string[] = [];
  let entropy = 0;
  const envelope = args.vector.scaleEnvelopeLog10M;
  if (typeof envelope.min === "number" && typeof envelope.max === "number") {
    const width = Math.max(0, envelope.max - envelope.min);
    entropy += Math.log2(1 + width);
    if (width > 1) budget.push(`scale-envelope width ${round6(width)} log10(m)`);
  } else {
    entropy += 1;
    budget.push("unbounded scale envelope");
  }

  const basisPenalty = envelope.basis === "heuristic" ? 0.75 : envelope.basis === "model_assumption" ? 0.45 : envelope.basis === "derived" ? 0.2 : 0.05;
  entropy += basisPenalty;
  if (basisPenalty >= 0.45) budget.push(`scale basis ${envelope.basis}`);

  if (args.vector.unitDimensionSignatures.length === 0) {
    entropy += 0.4;
    budget.push("missing unit dimension signature");
  }
  if (args.vector.equationFamilyCoordinates.length === 0) {
    entropy += 0.3;
    budget.push("missing equation-family coordinate");
  }
  if (args.badge.sourceRefs.length === 0) {
    entropy += 0.5;
    budget.push("sparse source references");
  }
  if (!args.badge.sourceRefs.some((source) => source.kind === "test" || source.kind === "artifact" || source.kind === "visualizer_preset")) {
    entropy += 0.35;
    budget.push("missing observable or artifact reference");
  }
  if (args.vector.claimPressureCoordinate > 0) {
    entropy += args.vector.claimPressureCoordinate * 0.75;
    budget.push(`claim-boundary pressure ${args.vector.claimPressureCoordinate}`);
  }

  return {
    entropy: round6(entropy),
    budget: unique([
      ...budget,
      "entropy is placement and boundary uncertainty, not theory truth probability",
    ]),
  };
}

export function buildTheoryBadgeCoordinateVectors(args: {
  graph: TheoryBadgeGraphV1;
  basisVersion?: string;
}): TheoryBadgeCoordinateVectorV1[] {
  const basisVersion = args.basisVersion ?? THEORY_BADGE_COORDINATE_BASIS_VERSION;
  const layout = buildTheoryBiomeLayoutV1(args.graph);
  const coordinatesByBadgeId = new Map(layout.coordinates.map((coordinate) => [coordinate.badgeId, coordinate]));
  const depths = computeTheoryBiomeDepths(args.graph);

  return args.graph.badges
    .map((badge): TheoryBadgeCoordinateVectorV1 => {
      const coordinate = coordinatesByBadgeId.get(badge.id);
      const scaleEnvelope = coordinate?.scaleEnvelope ?? {
        characteristicLog10M: null,
        minLog10M: null,
        maxLog10M: null,
        basis: "heuristic" as const,
        sourceRefs: [],
      };
      const sourceReferences = uniqueSourceRefs([...badge.sourceRefs, ...scaleEnvelope.sourceRefs]);
      const base = {
        badgeId: badge.id,
        basisVersion,
        scaleEnvelopeLog10M: {
          characteristic: scaleEnvelope.characteristicLog10M,
          min: scaleEnvelope.minLog10M,
          max: scaleEnvelope.maxLog10M,
          basis: scaleEnvelope.basis,
        },
        unitDimensionSignatures: badgeUnitSignatures(badge),
        equationFamilyCoordinates: unique([...badge.equationFamilies, ...badge.hintKeys.equationFamilies]),
        domainCoordinates: unique([coordinate?.domainKey ?? "general", ...badge.subjects, ...badge.hintKeys.subjects]),
        fidelityCoordinate: coordinate?.fidelity ?? "model",
        claimPressureCoordinate: round6(coordinate?.claimPressure ?? 0),
        evidenceDensityCoordinate: evidenceDensity(badge),
        firstPrinciplesDepthCoordinate: depths.get(badge.id) ?? 0,
        coordinateProvenance: unique([
          `basis:${basisVersion}`,
          `scale:${scaleEnvelope.basis}`,
          coordinate ? `biome:${coordinate.semanticChunkId}` : "biome:missing",
          `depth:${depths.get(badge.id) ?? 0}`,
          ...sourceReferences.map((sourceRef) => sourceReferenceId(sourceRef)),
        ]),
        sourceReferences,
      };
      const uncertainty = entropyFor({ vector: base, badge });
      return {
        ...base,
        uncertaintyBudget: uncertainty.budget,
        entropyContributionBits: uncertainty.entropy,
      };
    })
    .sort((left, right) => left.badgeId.localeCompare(right.badgeId));
}

function jaccardDistance(left: string[], right: string[]): number {
  const leftKeys = new Set(left.map(normalizeKey));
  const rightKeys = new Set(right.map(normalizeKey));
  const union = new Set([...leftKeys, ...rightKeys]);
  if (union.size === 0) return 0;
  const intersection = [...leftKeys].filter((key) => rightKeys.has(key)).length;
  return round6(1 - intersection / union.size);
}

function scaleDelta(left: TheoryBadgeCoordinateVectorV1, right: TheoryBadgeCoordinateVectorV1): {
  gap: number | null;
  overlap: number | null;
} {
  const aMin = left.scaleEnvelopeLog10M.min;
  const aMax = left.scaleEnvelopeLog10M.max;
  const bMin = right.scaleEnvelopeLog10M.min;
  const bMax = right.scaleEnvelopeLog10M.max;
  if ([aMin, aMax, bMin, bMax].some((value) => typeof value !== "number")) {
    return { gap: null, overlap: null };
  }
  const minA = aMin as number;
  const maxA = aMax as number;
  const minB = bMin as number;
  const maxB = bMax as number;
  const overlap = Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
  if (overlap > 0) return { gap: 0, overlap: round6(overlap) };
  return { gap: round6(Math.max(0, Math.max(minA, minB) - Math.min(maxA, maxB))), overlap: 0 };
}

function vectorDelta(left: TheoryBadgeCoordinateVectorV1, right: TheoryBadgeCoordinateVectorV1): TheoryFrontierVectorDeltaV1 {
  const scale = scaleDelta(left, right);
  return {
    scaleGapLog10M: scale.gap,
    scaleOverlapLog10M: scale.overlap,
    dimensionalDistance: jaccardDistance(left.unitDimensionSignatures, right.unitDimensionSignatures),
    equationFamilyDistance: jaccardDistance(left.equationFamilyCoordinates, right.equationFamilyCoordinates),
    domainDistance: jaccardDistance(left.domainCoordinates, right.domainCoordinates),
    fidelityMismatch: left.fidelityCoordinate === right.fidelityCoordinate ? 0 : 1,
    claimPressureIncrease: round6(Math.max(0, right.claimPressureCoordinate - left.claimPressureCoordinate)),
    evidenceDensityDelta: round6(Math.abs(left.evidenceDensityCoordinate - right.evidenceDensityCoordinate)),
    firstPrinciplesDepthDelta: round6(Math.abs(left.firstPrinciplesDepthCoordinate - right.firstPrinciplesDepthCoordinate)),
  };
}

function matrixFor(delta: TheoryFrontierVectorDeltaV1): number[][] {
  const values = [
    delta.scaleGapLog10M ?? 0,
    delta.dimensionalDistance,
    delta.equationFamilyDistance,
    delta.domainDistance,
    delta.fidelityMismatch,
    delta.claimPressureIncrease,
    delta.evidenceDensityDelta,
    delta.firstPrinciplesDepthDelta,
  ];
  return values.map((value, index) =>
    values.map((inner, innerIndex) => (index === innerIndex ? round6(value) : round6((value * inner) / 8))),
  );
}

function relationFor(graph: TheoryBadgeGraphV1, fromBadgeId: string, toBadgeId: string): TheoryBadgeEdgeRelation | "candidate_frontier" {
  return graph.edges.find((edge) =>
    edge.from === fromBadgeId && edge.to === toBadgeId && FRONTIER_EDGE_RELATIONS.has(edge.relation)
  )?.relation ?? "candidate_frontier";
}

function buildTensor(args: {
  graph: TheoryBadgeGraphV1;
  from: TheoryBadgeCoordinateVectorV1;
  to: TheoryBadgeCoordinateVectorV1;
  candidateId: string;
}): TheoryBadgeRelationTensorV1 {
  const delta = vectorDelta(args.from, args.to);
  const fromBadge = args.graph.badges.find((badge) => badge.id === args.from.badgeId);
  const toBadge = args.graph.badges.find((badge) => badge.id === args.to.badgeId);
  const toSymbolKeys = new Set(toBadge ? badgeSymbols(toBadge).map(normalizeKey) : []);
  const sharedSymbols = unique(
    fromBadge ? badgeSymbols(fromBadge).filter((symbol) => toSymbolKeys.has(normalizeKey(symbol))) : [],
  );
  const inputEntropy = round6(args.from.entropyContributionBits + args.to.entropyContributionBits);
  const outputEntropy = round6(inputEntropy + (delta.scaleGapLog10M ?? 0) * 0.1 + delta.dimensionalDistance + delta.equationFamilyDistance + delta.claimPressureIncrease);
  const relation = relationFor(args.graph, args.from.badgeId, args.to.badgeId);
  const evidenceRefs = unique([
    ...args.from.sourceReferences.map((sourceRef) => sourceReferenceId(sourceRef)),
    ...args.to.sourceReferences.map((sourceRef) => sourceReferenceId(sourceRef)),
  ]);

  return {
    tensorId: `relation_tensor:${stableHashHex(`${args.candidateId}:${args.from.badgeId}:${args.to.badgeId}`)}`,
    fromBadgeId: args.from.badgeId,
    toBadgeId: args.to.badgeId,
    relation,
    sourceBasisVersion: args.from.basisVersion,
    targetBasisVersion: args.to.basisVersion,
    transformKind: relation === "shares_units" ? "dimensional_map" : relation === "candidate_frontier" ? "candidate_delta" : "projection",
    axes: AXES,
    matrix: matrixFor(delta),
    vectorDelta: delta,
    dimensionalChecks:
      delta.dimensionalDistance === 0
        ? ["unit dimension signatures are compatible in vector basis"]
        : ["unit dimension signature gap requires exact verification"],
    equationVariableMap:
      sharedSymbols.length > 0
        ? sharedSymbols.map((symbol) => ({ fromSymbol: symbol, toSymbol: symbol, status: "shared" as const }))
        : [{ fromSymbol: "*", toSymbol: "*", status: "missing" as const }],
    uncertaintyPropagation: {
      inputEntropyBits: inputEntropy,
      outputEntropyBits: outputEntropy,
      entropyDeltaBits: round6(outputEntropy - inputEntropy),
      covarianceDiagonal: matrixFor(delta).map((row, index) => round6(Math.abs(row[index]))),
      interpretation: "placement_uncertainty_not_truth_probability",
    },
    typedEdgeSemantics: [relation],
    falsifierRequirements: [
      "relation tensor is rejected if dimensional mapping fails exact verification",
      "relation tensor is rejected if required observable or source evidence is absent",
    ],
    evidenceRequirements: evidenceRefs.length > 0 ? evidenceRefs : ["missing source-reference evidence"],
    evidenceRefs,
    claimBoundary: {
      validatesTheory: false,
      solvesPhysicalMechanism: false,
      promotionAllowed: false,
    },
  };
}

function candidatePairKey(left: string, right: string): string {
  return [left, right].sort().join("|");
}

function frontierCandidateId(args: {
  graphHash: string;
  searchSeed: string;
  query: string;
  badgeIds: string[];
}): string {
  return `frontier:${stableHashHex([args.graphHash, args.searchSeed, args.query, ...args.badgeIds].join("|"))}`;
}

function missingStructureHintsFor(args: {
  query: string;
  delta: TheoryFrontierVectorDeltaV1;
  evidenceGaps: string[];
}): string[] {
  const queryKey = normalizeKey(args.query);
  return unique([
    ...(args.delta.dimensionalDistance > 0.5 ? ["add explicit unit or dimensional-basis bridge"] : []),
    ...(args.delta.equationFamilyDistance > 0.5 ? ["add equation-family mapping badge or variable map"] : []),
    ...(args.delta.domainDistance > 0.75 ? ["add intermediate domain bridge badge"] : []),
    ...(args.evidenceGaps.some((gap) => /scale/i.test(gap)) ? ["add bounded scale-envelope evidence"] : []),
    ...(args.evidenceGaps.some((gap) => /source|reference/i.test(gap)) ? ["add source-reference evidence"] : []),
    ...(queryKey.includes("holographic") || queryKey.includes("ads_cft")
      ? ["add boundary-bulk mapping badge", "add entropy-area relation badge", "add minimal-surface geometry badge"]
      : []),
    ...(queryKey.includes("weyl")
      ? ["add conformal-curvature decomposition badge", "add Weyl/Ricci/Riemann variable mapping"]
      : []),
    ...(queryKey.includes("tensor_network") || queryKey.includes("error_correction")
      ? ["add tensor-network encoding badge", "add quantum-error-correction boundary badge"]
      : []),
  ]);
}

function placementDiagnostic(args: {
  query: string;
  delta: TheoryFrontierVectorDeltaV1;
  evidenceGaps: string[];
  uncertaintyReductionPotential: number;
  verifiedFrontierYieldPerBudget: number;
}): TheoryFrontierPlacementDiagnosticV1 {
  const localCongruenceScore = round6(
    clamp01(
      1 -
        (args.delta.dimensionalDistance * 0.35 +
          args.delta.equationFamilyDistance * 0.25 +
          args.delta.domainDistance * 0.2 +
          args.delta.fidelityMismatch * 0.1 +
          (args.delta.scaleGapLog10M != null && args.delta.scaleGapLog10M > 0 ? 0.1 : 0)),
    ),
  );
  const evidenceReadinessScore = round6(clamp01(1 / (1 + args.evidenceGaps.length * 0.75)));
  const uncertaintyPressureScore = round6(clamp01(args.uncertaintyReductionPotential));
  const fitScore = round6(
    clamp01(
      args.verifiedFrontierYieldPerBudget * 0.35 +
        localCongruenceScore * 0.4 +
        evidenceReadinessScore * 0.15 +
        (1 - uncertaintyPressureScore) * 0.1,
    ),
  );
  const missingStructureHints = missingStructureHintsFor({
    query: args.query,
    delta: args.delta,
    evidenceGaps: args.evidenceGaps,
  });
  const blockingSignals = unique([
    ...args.evidenceGaps,
    ...(args.delta.dimensionalDistance > 0 ? [`dimensional distance ${args.delta.dimensionalDistance}`] : []),
    ...(args.delta.equationFamilyDistance > 0 ? [`equation-family distance ${args.delta.equationFamilyDistance}`] : []),
    ...(args.delta.domainDistance > 0.75 ? [`domain distance ${args.delta.domainDistance}`] : []),
    ...(args.delta.scaleGapLog10M != null && args.delta.scaleGapLog10M > 0
      ? [`scale gap ${args.delta.scaleGapLog10M} log10(m)`]
      : []),
  ]);
  const positiveSignals = unique([
    ...(args.delta.dimensionalDistance === 0 ? ["unit dimensions align"] : []),
    ...(args.delta.scaleOverlapLog10M != null && args.delta.scaleOverlapLog10M > 0
      ? [`scale envelopes overlap ${args.delta.scaleOverlapLog10M} log10(m)`]
      : []),
    ...(args.delta.fidelityMismatch === 0 ? ["fidelity class aligns"] : []),
    ...(args.delta.claimPressureIncrease === 0 ? ["no added claim pressure"] : []),
    ...(args.verifiedFrontierYieldPerBudget >= 0.4 ? ["high verified-yield-per-budget score"] : []),
    ...(args.evidenceGaps.length <= 1 ? ["limited evidence-gap count"] : []),
  ]);

  const fitClass: TheoryFrontierFitClassV1 =
    localCongruenceScore >= 0.72 && evidenceReadinessScore >= 0.55
      ? "strong_local_fit"
      : localCongruenceScore >= 0.52 && fitScore >= 0.32
        ? "moderate_local_fit"
        : missingStructureHints.length >= 3 && localCongruenceScore < 0.45
          ? "missing_region_suspected"
          : localCongruenceScore < 0.25 && fitScore < 0.2
            ? "off_manifold"
            : "weak_cross_domain_fit";
  const interpretation =
    fitClass === "strong_local_fit" || fitClass === "moderate_local_fit"
      ? "candidate_region_has_local_support"
      : fitClass === "missing_region_suspected" || fitClass === "off_manifold"
        ? "candidate_region_probably_missing_graph_structure"
        : "candidate_region_is_cross_domain";

  return {
    fitClass,
    fitScore,
    localCongruenceScore,
    evidenceReadinessScore,
    uncertaintyPressureScore,
    positiveSignals,
    blockingSignals,
    missingStructureHints,
    interpretation,
  };
}

function emptyFitHistogram(): Record<TheoryFrontierFitClassV1, number> {
  return {
    strong_local_fit: 0,
    moderate_local_fit: 0,
    weak_cross_domain_fit: 0,
    off_manifold: 0,
    missing_region_suspected: 0,
  };
}

function traceDiagnostics(candidateTraces: TheoryFrontierVectorCandidateTraceV1[]): TheoryFrontierTraceDiagnosticsV1 {
  const histogram = emptyFitHistogram();
  for (const candidate of candidateTraces) histogram[candidate.placementDiagnostic.fitClass] += 1;
  const sortedByFit = [...candidateTraces].sort((left, right) =>
    right.placementDiagnostic.fitScore - left.placementDiagnostic.fitScore,
  );
  const strongest = sortedByFit[0] ?? null;
  const weakest = sortedByFit[sortedByFit.length - 1] ?? null;
  const missingStructureHints = unique(candidateTraces.flatMap((candidate) => candidate.placementDiagnostic.missingStructureHints));
  const averageFitScore = average(candidateTraces.map((candidate) => candidate.placementDiagnostic.fitScore));
  const averageLocalCongruenceScore = average(
    candidateTraces.map((candidate) => candidate.placementDiagnostic.localCongruenceScore),
  );
  const overallFitClass: TheoryFrontierFitClassV1 =
    histogram.strong_local_fit > 0 && averageLocalCongruenceScore >= 0.55
      ? "strong_local_fit"
      : histogram.moderate_local_fit > 0 && averageFitScore >= 0.32
        ? "moderate_local_fit"
        : histogram.missing_region_suspected > 0 && averageLocalCongruenceScore < 0.45
          ? "missing_region_suspected"
          : histogram.off_manifold > candidateTraces.length / 2
            ? "off_manifold"
            : "weak_cross_domain_fit";
  const interpretation =
    overallFitClass === "strong_local_fit" || overallFitClass === "moderate_local_fit"
      ? "frontier_region_has_local_support"
      : overallFitClass === "missing_region_suspected" || overallFitClass === "off_manifold"
        ? "frontier_region_probably_missing_graph_structure"
        : "frontier_region_is_cross_domain";

  return {
    overallFitClass,
    strongestCandidateId: strongest?.candidateId ?? null,
    weakestCandidateId: weakest?.candidateId ?? null,
    candidateFitHistogram: histogram,
    averageFitScore,
    averageLocalCongruenceScore,
    strongestSignals: unique(strongest?.placementDiagnostic.positiveSignals ?? []),
    weakestSignals: unique(weakest?.placementDiagnostic.blockingSignals ?? []),
    missingStructureHints,
    interpretation,
  };
}

function selectCandidatePairs(args: {
  graph: TheoryBadgeGraphV1;
  query: string;
  originBadgeIds: string[];
  limit: number;
}): string[][] {
  const matches = locateTheoryBadges({
    graph: args.graph,
    input: { query: args.query, limit: Math.max(args.limit * 2, 12) },
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
  return pairs.slice(0, Math.max(1, args.limit));
}

function candidateTrace(args: {
  graph: TheoryBadgeGraphV1;
  graphHash: string;
  query: string;
  searchSeed: string;
  badgeIds: string[];
  tensor: TheoryBadgeRelationTensorV1;
}): TheoryFrontierVectorCandidateTraceV1 {
  const trace = traceTheoryBadgeConnections({ graph: args.graph, badgeIds: args.badgeIds });
  const delta = args.tensor.vectorDelta;
  const entropyContributors = unique([
    `scaleGap:${delta.scaleGapLog10M ?? "unbounded"}`,
    `dimensionalDistance:${delta.dimensionalDistance}`,
    `equationFamilyDistance:${delta.equationFamilyDistance}`,
    `domainDistance:${delta.domainDistance}`,
    `claimPressureIncrease:${delta.claimPressureIncrease}`,
    ...trace.claimBoundaryNotes,
  ]);
  const evidenceGaps = unique([
    ...(args.tensor.evidenceRefs.length === 0 ? ["missing source references"] : []),
    ...(delta.dimensionalDistance > 0 ? ["dimensional mapping requires exact verification"] : []),
    ...(delta.equationFamilyDistance > 0 ? ["equation-family mapping requires evidence"] : []),
    ...(delta.scaleGapLog10M != null && delta.scaleGapLog10M > 0 ? ["scale transition requires bounding evidence"] : []),
  ]);
  const uncertaintyReductionPotential = round6(
    clamp01((args.tensor.uncertaintyPropagation.entropyDeltaBits + evidenceGaps.length * 0.25) / 4),
  );
  const expectedEvidenceClosureCost = round6(1 + evidenceGaps.length * 0.5 + Math.max(0, trace.connectingBadgeIds.length - 2) * 0.2);
  const verifiedFrontierYieldPerBudget = round6(
    (1 - clamp01(delta.dimensionalDistance * 0.35 + delta.equationFamilyDistance * 0.25 + delta.domainDistance * 0.15)) /
      Math.max(1, expectedEvidenceClosureCost),
  );
  const diagnostic = placementDiagnostic({
    query: args.query,
    delta,
    evidenceGaps,
    uncertaintyReductionPotential,
    verifiedFrontierYieldPerBudget,
  });

  return {
    candidateId: frontierCandidateId(args),
    badgeIds: [...args.badgeIds].sort(),
    vectorDelta: delta,
    relationTensorIds: [args.tensor.tensorId],
    entropyContributors,
    evidenceGaps,
    exactVerificationRequirements: [
      "complete first-principles-to-claim path",
      "dimensional checks",
      "equation and variable mappings",
      "required observables",
      "uncertainty budget",
      "falsification checks",
      "evidence provenance",
      "active claim boundaries",
    ],
    uncertaintyReductionPotential,
    expectedEvidenceClosureCost,
    verifiedFrontierYieldPerBudget,
    placementDiagnostic: diagnostic,
  };
}

export function traceTheoryFrontierVectorField(
  input: TraceTheoryFrontierVectorFieldInput,
): TheoryFrontierVectorFieldTraceV1 {
  const query = input.query.trim();
  const searchSeed = input.searchSeed?.trim() || `frontier:${normalizeKey(query) || "empty"}`;
  const basisVersion = input.basisVersion ?? THEORY_BADGE_COORDINATE_BASIS_VERSION;
  const scoringVersion = input.scoringVersion ?? THEORY_FRONTIER_VECTOR_FIELD_SCORING_VERSION;
  const taxonomyVersion = input.taxonomyVersion ?? THEORY_FRONTIER_VECTOR_TAXONOMY_VERSION;
  const graphHash = hashTheoryFrontierVectorGraph(input.graph);
  const limit = Math.max(1, Math.min(25, input.limit ?? 8));
  const vectors = buildTheoryBadgeCoordinateVectors({ graph: input.graph, basisVersion });
  const vectorsByBadgeId = new Map(vectors.map((vector) => [vector.badgeId, vector]));
  const pairs = input.candidateBadgePairs ?? selectCandidatePairs({
    graph: input.graph,
    query,
    originBadgeIds: input.originBadgeIds ?? [],
    limit,
  });
  const boundedPairs = pairs.slice(0, input.maxDepth ? Math.max(1, input.maxDepth) : pairs.length);
  const relationTensors = boundedPairs
    .map((badgeIds): TheoryBadgeRelationTensorV1 | null => {
      const [fromBadgeId, toBadgeId] = badgeIds;
      const from = vectorsByBadgeId.get(fromBadgeId);
      const to = vectorsByBadgeId.get(toBadgeId);
      if (!from || !to) return null;
      return buildTensor({
        graph: input.graph,
        from,
        to,
        candidateId: frontierCandidateId({ graphHash, query, searchSeed, badgeIds }),
      });
    })
    .filter((tensor): tensor is TheoryBadgeRelationTensorV1 => Boolean(tensor))
    .sort((left, right) => left.tensorId.localeCompare(right.tensorId));
  const tensorByBadgePair = new Map(
    relationTensors.map((tensor) => [candidatePairKey(tensor.fromBadgeId, tensor.toBadgeId), tensor]),
  );
  const candidateTraces = boundedPairs
    .map((badgeIds): TheoryFrontierVectorCandidateTraceV1 | null => {
      const tensor = tensorByBadgePair.get(candidatePairKey(badgeIds[0], badgeIds[1]));
      if (!tensor) return null;
      return candidateTrace({ graph: input.graph, graphHash, query, searchSeed, badgeIds, tensor });
    })
    .filter((trace): trace is TheoryFrontierVectorCandidateTraceV1 => Boolean(trace))
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  const evidenceReferenceIds = unique([
    ...vectors.flatMap((vector) => vector.sourceReferences.map((sourceRef) => sourceReferenceId(sourceRef))),
    ...relationTensors.flatMap((tensor) => tensor.evidenceRefs),
  ]);

  return buildTheoryFrontierVectorFieldTraceV1({
    generatedAt: input.generatedAt,
    traceId: `vector_field:${stableHashHex([graphHash, query, searchSeed, basisVersion, scoringVersion].join("|"))}`,
    graphId: input.graph.graphId,
    graphHash,
    query,
    searchSeed,
    basisVersion,
    scoringVersion,
    taxonomyVersion,
    vectors,
    relationTensors,
    candidateTraces,
    traceDiagnostics: traceDiagnostics(candidateTraces),
    replay: {
      graphHash,
      query,
      searchSeed,
      basisVersion,
      scoringVersion,
      taxonomyVersion,
      evidenceReferenceIds,
    },
  });
}
