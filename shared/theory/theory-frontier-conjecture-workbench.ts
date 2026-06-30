import type { TheoryContextReflectionRecommendedActionV1 } from "../contracts/theory-context-reflection.v1";
import type { TheoryBadgeSourceRefV1 } from "../contracts/theory-badge-graph.v1";
import type {
  TheoryFrontierBiomeRegionV1,
  TheoryFrontierCandidateV1,
  TheoryFrontierKindV1,
  TheoryFrontierCandidateStatusV1,
} from "../contracts/theory-frontier-candidate.v1";
import type { TheoryFrontierSearchV1 } from "../contracts/theory-frontier-search.v1";

export const THEORY_FRONTIER_CONJECTURE_WORKBENCH_ARTIFACT_ID =
  "theory_frontier_conjecture_workbench" as const;
export const THEORY_FRONTIER_CONJECTURE_WORKBENCH_SCHEMA_VERSION =
  "theory_frontier_conjecture_workbench/v1" as const;

export type TheoryFrontierConjectureRecommendedActionV1 = {
  action_id: string;
  label: string;
  panel_id: TheoryContextReflectionRecommendedActionV1["panelId"];
  args: Record<string, unknown>;
  mutates_calculator: boolean;
  solves: boolean;
};

export type TheoryFrontierConjectureSourceReferenceV1 = {
  kind: string;
  path: string | null;
  id: string | null;
  note: string | null;
};

export type TheoryFrontierConjectureCandidateV1 = {
  candidate_id: string;
  candidate_kind: TheoryFrontierKindV1;
  status: TheoryFrontierCandidateStatusV1;
  title: string;
  summary: string;
  nearby_badge_ids: string[];
  proposed_relation_or_missing_badge: string;
  biome_region: TheoryFrontierBiomeRegionV1;
  scale_bands: string[];
  render_chunk_ids: string[];
  semantic_chunk_ids: string[];
  congruence_score: number;
  information_gain_bits: number;
  calculator_probe_available: boolean;
  recommended_next_actions: TheoryFrontierConjectureRecommendedActionV1[];
  required_observables: string[];
  required_artifacts: string[];
  source_references: TheoryFrontierConjectureSourceReferenceV1[];
  falsification_checks: string[];
  claim_boundary_notes: string[];
  promotion_allowed: false;
  terminal_eligible: false;
  assistant_answer: false;
  post_tool_model_step_required: true;
};

export type TheoryFrontierConjectureWorkbenchV1 = {
  artifact_id: typeof THEORY_FRONTIER_CONJECTURE_WORKBENCH_ARTIFACT_ID;
  schema_version: typeof THEORY_FRONTIER_CONJECTURE_WORKBENCH_SCHEMA_VERSION;
  search_id: string;
  graph_id: string;
  query: string;
  candidates: TheoryFrontierConjectureCandidateV1[];
  candidate_status_counts: Record<string, number>;
  top_candidate_id: string | null;
  scholarly_lookup_request_count: number;
  probability_terrain: TheoryFrontierSearchV1["probabilityTerrain"];
  authority: {
    assistant_answer: false;
    raw_content_included: false;
    terminal_eligible: false;
    post_tool_model_step_required: true;
  };
};

const FORBIDDEN_CONJECTURE_OVERCLAIM_PATTERNS = [
  /\b(?:prove|validate|confirm|certify)\b.*\b(?:physical viability|physical mechanism|warp drive|propulsion)\b/i,
  /\b(?:physical viability|physical mechanism|warp drive|propulsion)\b.*\b(?:proven|validated|confirmed|certified)\b/i,
  /\b(?:promote|approve)\b.*\b(?:badge|edge|candidate)\b/i,
  /\b(?:calculator|literature|paper|graph placement|probability)\b.*\b(?:proves|validates|confirms)\b/i,
] as const;

export function theoryFrontierConjectureForbiddenClaimNotes(prompt: string): string[] {
  for (const pattern of FORBIDDEN_CONJECTURE_OVERCLAIM_PATTERNS) {
    if (pattern.test(prompt)) {
      return [
        "Prompt requested proof, validation, physical viability, promotion, or proof-by-placement; workbench output is boundary-blocked evidence only.",
      ];
    }
  }
  return [];
}

const sourceRefProjection = (
  sourceRef: TheoryBadgeSourceRefV1,
): TheoryFrontierConjectureSourceReferenceV1 => ({
  kind: sourceRef.kind,
  path: sourceRef.path ?? null,
  id: sourceRef.id ?? null,
  note: sourceRef.note ?? null,
});

const actionProjection = (
  action: TheoryContextReflectionRecommendedActionV1,
): TheoryFrontierConjectureRecommendedActionV1 => ({
  action_id: action.actionId,
  label: action.label,
  panel_id: action.panelId,
  args: action.args,
  mutates_calculator: action.mutatesCalculator,
  solves: action.solves,
});

const actionCandidateId = (action: TheoryContextReflectionRecommendedActionV1): string | null => {
  const candidateId = action.args.candidate_id ?? action.args.candidateId;
  return typeof candidateId === "string" && candidateId.trim().length > 0 ? candidateId : null;
};

const actionBadgeIds = (action: TheoryContextReflectionRecommendedActionV1): string[] => {
  const badgeIds = action.args.badge_ids ?? action.args.badgeIds;
  return Array.isArray(badgeIds)
    ? badgeIds.filter((badgeId): badgeId is string => typeof badgeId === "string" && badgeId.trim().length > 0)
    : [];
};

function actionsForCandidate(
  candidate: TheoryFrontierCandidateV1,
  actions: TheoryContextReflectionRecommendedActionV1[],
): TheoryContextReflectionRecommendedActionV1[] {
  return actions.filter((action) => {
    const candidateId = actionCandidateId(action);
    if (candidateId) return candidateId === candidate.candidateId;
    const badgeIds = actionBadgeIds(action);
    if (badgeIds.length === 0) return false;
    return badgeIds.some((badgeId) => candidate.badgeIds.includes(badgeId));
  });
}

function proposedRelationOrMissingBadge(candidate: TheoryFrontierCandidateV1): string {
  if (candidate.missingBadgeTitle) return candidate.missingBadgeTitle;
  if (candidate.congruence.allowedTypedEdgeRelations.length > 0) {
    return candidate.congruence.allowedTypedEdgeRelations.join(", ");
  }
  return "unresolved semantic bridge";
}

export function projectTheoryFrontierConjectureCandidate(
  candidate: TheoryFrontierCandidateV1,
  recommendedActions: TheoryContextReflectionRecommendedActionV1[] = [],
  forcedClaimBoundaryNotes: string[] = [],
): TheoryFrontierConjectureCandidateV1 {
  const boundaryBlocked = forcedClaimBoundaryNotes.length > 0;
  return {
    candidate_id: candidate.candidateId,
    candidate_kind: candidate.frontierKind,
    status: boundaryBlocked ? "blocked_by_boundary" : candidate.status,
    title: candidate.title,
    summary: candidate.summary,
    nearby_badge_ids: [...candidate.badgeIds],
    proposed_relation_or_missing_badge: proposedRelationOrMissingBadge(candidate),
    biome_region: candidate.biomeRegion,
    scale_bands: [...candidate.biomeRegion.scaleBands],
    render_chunk_ids: [...candidate.biomeRegion.renderChunkIds],
    semantic_chunk_ids: [...candidate.biomeRegion.semanticChunkIds],
    congruence_score: candidate.scores.congruenceScore,
    information_gain_bits: candidate.scores.informationGainBits,
    calculator_probe_available: candidate.congruence.requiredArtifacts.some((artifact) =>
      artifact.startsWith("calculator_payload:"),
    ),
    recommended_next_actions: actionsForCandidate(candidate, recommendedActions).map(actionProjection),
    required_observables: [...candidate.congruence.requiredObservables],
    required_artifacts: [...candidate.congruence.requiredArtifacts],
    source_references: candidate.congruence.sourceReferences.map(sourceRefProjection),
    falsification_checks: [...candidate.congruence.falsificationChecks],
    claim_boundary_notes: [...forcedClaimBoundaryNotes, ...candidate.congruence.claimBoundaryNotes],
    promotion_allowed: false,
    terminal_eligible: false,
    assistant_answer: false,
    post_tool_model_step_required: true,
  };
}

export function buildTheoryFrontierConjectureWorkbenchV1(
  frontierSearch: TheoryFrontierSearchV1,
  recommendedActions: TheoryContextReflectionRecommendedActionV1[] = [],
  forcedClaimBoundaryNotes: string[] = [],
): TheoryFrontierConjectureWorkbenchV1 {
  const searchId = frontierSearch.searchId.startsWith("theory-frontier-search:")
    ? frontierSearch.searchId
    : frontierSearch.searchId.replace(/^frontier_search:/, "theory-frontier-search:");
  const candidateStatusCounts =
    forcedClaimBoundaryNotes.length > 0
      ? { blocked_by_boundary: frontierSearch.candidates.length }
      : { ...frontierSearch.summary.statusCounts };
  return {
    artifact_id: THEORY_FRONTIER_CONJECTURE_WORKBENCH_ARTIFACT_ID,
    schema_version: THEORY_FRONTIER_CONJECTURE_WORKBENCH_SCHEMA_VERSION,
    search_id: searchId,
    graph_id: frontierSearch.graphId,
    query: frontierSearch.query,
    candidates: frontierSearch.candidates.map((candidate) =>
      projectTheoryFrontierConjectureCandidate(candidate, recommendedActions, forcedClaimBoundaryNotes),
    ),
    candidate_status_counts: candidateStatusCounts,
    top_candidate_id: frontierSearch.summary.topCandidateId,
    scholarly_lookup_request_count: frontierSearch.scholarlyLookupRequests.length,
    probability_terrain: frontierSearch.probabilityTerrain,
    authority: {
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
    },
  };
}
