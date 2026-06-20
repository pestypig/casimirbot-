import {
  buildHelixTheoryFrontierVectorFieldToolReceiptV1,
  HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY,
  type HelixTheoryFrontierVectorFieldFailureCode,
  type HelixTheoryFrontierVectorFieldToolReceiptV1,
} from "../contracts/helix-theory-frontier-vector-field-tool-receipt.v1";
import { validateTheoryBadgeGraphV1, type TheoryBadgeGraphV1 } from "../contracts/theory-badge-graph.v1";
import { validateTheoryFrontierVectorFieldTraceV1 } from "../contracts/theory-frontier-vector-field.v1";
import { locateTheoryBadges } from "./theory-badge-overlap-locator";
import {
  hashTheoryFrontierVectorGraph,
  THEORY_FRONTIER_VECTOR_FIELD_SCORING_VERSION,
  THEORY_FRONTIER_VECTOR_TAXONOMY_VERSION,
  traceTheoryFrontierVectorField,
} from "./theory-frontier-vector-field";

export type RunHelixTheoryFrontierVectorFieldToolInput = {
  graph: TheoryBadgeGraphV1;
  query: string;
  originBadgeIds?: string[];
  maxDepth?: number;
  basisVersion?: string;
  scoringVersion?: string;
  searchSeed?: string;
  turnId: string;
  threadId?: string | null;
  generatedAt?: string;
  admissionReason?: string;
};

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean))).sort();

const stableHashHex = (input: string): string => {
  let h = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    h ^= input.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};

const normalizeSearchSeed = (query: string, searchSeed?: string): string =>
  searchSeed?.trim() || `ask:theory-frontier-vector:${stableHashHex(query.trim() || "empty")}`;

const statusFor = (typedFailures: HelixTheoryFrontierVectorFieldFailureCode[]): "ok" | "partial" | "failed" => {
  if (typedFailures.includes("graph_unavailable") || typedFailures.includes("vector_trace_invalid")) return "failed";
  if (typedFailures.includes("no_badge_matches") || typedFailures.includes("no_candidate_pairs")) return "failed";
  return typedFailures.length > 0 ? "partial" : "ok";
};

const defaultDebugReceipt = (input: {
  query: string;
  selectedBadgeIds?: string[];
  graphHash?: string;
  searchSeed: string;
  basisVersion?: string;
  scoringVersion?: string;
  taxonomyVersion?: string;
  vectorTraceId?: string;
  admissionReason?: string;
}) => ({
  admissionReason: input.admissionReason ?? "frontier_vector_field_requested",
  selectedRoute: "theory_locator" as const,
  selectedCapability: HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY,
  query: input.query,
  selectedBadgeIds: input.selectedBadgeIds ?? [],
  graphHash: input.graphHash ?? "graph_unavailable",
  searchSeed: input.searchSeed,
  basisVersion: input.basisVersion ?? "theory_badge_coordinate_basis/v1",
  scoringVersion: input.scoringVersion ?? THEORY_FRONTIER_VECTOR_FIELD_SCORING_VERSION,
  vectorTraceId: input.vectorTraceId ?? "vector_trace_unavailable",
  candidateCount: 0,
  relationTensorCount: 0,
  validationIssues: [],
  evidenceGaps: [],
  claimBoundaryBlocks: [],
  exactVerificationRequirements: [],
  replayKeys: {
    graphHash: input.graphHash ?? "graph_unavailable",
    query: input.query,
    searchSeed: input.searchSeed,
    basisVersion: input.basisVersion ?? "theory_badge_coordinate_basis/v1",
    scoringVersion: input.scoringVersion ?? THEORY_FRONTIER_VECTOR_FIELD_SCORING_VERSION,
    taxonomyVersion: input.taxonomyVersion ?? THEORY_FRONTIER_VECTOR_TAXONOMY_VERSION,
    evidenceReferenceIds: [],
  },
});

export function runHelixTheoryFrontierVectorFieldTool(
  input: RunHelixTheoryFrontierVectorFieldToolInput,
): HelixTheoryFrontierVectorFieldToolReceiptV1 {
  const query = input.query.trim();
  const searchSeed = normalizeSearchSeed(query, input.searchSeed);
  const graphIssues = validateTheoryBadgeGraphV1(input.graph);
  if (graphIssues.length > 0) {
    const debugReceipt = {
      ...defaultDebugReceipt({
        query,
        searchSeed,
        admissionReason: input.admissionReason,
      }),
      validationIssues: graphIssues,
    };
    return buildHelixTheoryFrontierVectorFieldToolReceiptV1({
      generatedAt: input.generatedAt,
      receiptId: `helix-theory-frontier-vector-field:${stableHashHex([input.turnId, query, searchSeed, "graph_unavailable"].join("|"))}`,
      status: "failed",
      typedFailures: ["graph_unavailable"],
      turnId: input.turnId,
      threadId: input.threadId ?? null,
      query,
      originBadgeIds: input.originBadgeIds ?? [],
      maxDepth: input.maxDepth ?? null,
      vectorFieldTrace: null,
      candidateTraces: [],
      relationTensors: [],
      evidenceGaps: [],
      exactVerificationRequirements: [],
      validationIssues: graphIssues,
      debugReceipt,
    });
  }

  const graphHash = hashTheoryFrontierVectorGraph(input.graph);
  const originBadgeIds = unique(input.originBadgeIds ?? []);
  const matchedBadgeIds = unique([
    ...originBadgeIds.filter((badgeId) => input.graph.badges.some((badge) => badge.id === badgeId)),
    ...locateTheoryBadges({
      graph: input.graph,
      input: { query, limit: Math.max(12, input.maxDepth ?? 8) },
    }).map((match) => match.badgeId),
  ]);

  const vectorFieldTrace = traceTheoryFrontierVectorField({
    graph: input.graph,
    query,
    searchSeed,
    generatedAt: input.generatedAt,
    basisVersion: input.basisVersion,
    scoringVersion: input.scoringVersion,
    originBadgeIds,
    maxDepth: input.maxDepth,
  });
  const validationIssues = validateTheoryFrontierVectorFieldTraceV1(vectorFieldTrace);
  const evidenceGaps = unique(vectorFieldTrace.candidateTraces.flatMap((trace) => trace.evidenceGaps));
  const exactVerificationRequirements = unique(
    vectorFieldTrace.candidateTraces.flatMap((trace) => trace.exactVerificationRequirements),
  );
  const claimBoundaryBlocks = unique(
    vectorFieldTrace.relationTensors.flatMap((tensor) => [
      tensor.claimBoundary.validatesTheory === false ? `no_theory_validation:${tensor.tensorId}` : "",
      tensor.claimBoundary.solvesPhysicalMechanism === false ? `no_physical_mechanism_validation:${tensor.tensorId}` : "",
      tensor.claimBoundary.promotionAllowed === false ? `no_edge_promotion:${tensor.tensorId}` : "",
    ]),
  );
  const typedFailures = unique([
    ...(matchedBadgeIds.length === 0 ? ["no_badge_matches"] : []),
    ...(vectorFieldTrace.candidateTraces.length === 0 ? ["no_candidate_pairs"] : []),
    ...(validationIssues.length > 0 ? ["vector_trace_invalid"] : []),
    ...(claimBoundaryBlocks.length > 0 ? ["claim_boundary_blocked"] : []),
    ...(evidenceGaps.some((gap) => /dimensional/i.test(gap)) ? ["dimensional_mapping_incomplete"] : []),
    ...(evidenceGaps.length > 0 ? ["evidence_gap_unclosed"] : []),
    ...(exactVerificationRequirements.length > 0 ? ["exact_verification_required"] : []),
    ...(/\b(?:paper|papers|scholarly|literature|doi|arxiv|full[-\s]?text)\b/i.test(query)
      ? ["live_scholarly_lookup_not_available"]
      : []),
  ]) as HelixTheoryFrontierVectorFieldFailureCode[];

  const debugReceipt = {
    admissionReason: input.admissionReason ?? "frontier_vector_field_requested",
    selectedRoute: "theory_locator" as const,
    selectedCapability: HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY,
    query,
    selectedBadgeIds: matchedBadgeIds,
    graphHash,
    searchSeed,
    basisVersion: vectorFieldTrace.basisVersion,
    scoringVersion: vectorFieldTrace.scoringVersion,
    vectorTraceId: vectorFieldTrace.traceId,
    candidateCount: vectorFieldTrace.candidateTraces.length,
    relationTensorCount: vectorFieldTrace.relationTensors.length,
    validationIssues,
    evidenceGaps,
    claimBoundaryBlocks,
    exactVerificationRequirements,
    replayKeys: {
      graphHash: vectorFieldTrace.replay.graphHash,
      query: vectorFieldTrace.replay.query,
      searchSeed: vectorFieldTrace.replay.searchSeed,
      basisVersion: vectorFieldTrace.replay.basisVersion,
      scoringVersion: vectorFieldTrace.replay.scoringVersion,
      taxonomyVersion: vectorFieldTrace.replay.taxonomyVersion,
      evidenceReferenceIds: vectorFieldTrace.replay.evidenceReferenceIds,
    },
  };

  return buildHelixTheoryFrontierVectorFieldToolReceiptV1({
    generatedAt: input.generatedAt,
    receiptId: `helix-theory-frontier-vector-field:${stableHashHex([input.turnId, vectorFieldTrace.traceId].join("|"))}`,
    status: statusFor(typedFailures),
    typedFailures,
    turnId: input.turnId,
    threadId: input.threadId ?? null,
    query,
    originBadgeIds,
    maxDepth: input.maxDepth ?? null,
    vectorFieldTrace,
    candidateTraces: vectorFieldTrace.candidateTraces,
    relationTensors: vectorFieldTrace.relationTensors,
    evidenceGaps,
    exactVerificationRequirements,
    validationIssues,
    debugReceipt,
  });
}
