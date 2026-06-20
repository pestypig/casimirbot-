import {
  buildHelixTheoryContextReflectionToolReceiptV1,
  type HelixTheoryContextReflectionPanelSyncOverlayMode,
  type HelixTheoryContextReflectionToolReceiptV1,
} from "../contracts/helix-theory-context-reflection-tool-receipt.v1";
import type {
  TheoryContextReflectionConfidenceMode,
  TheoryContextReflectionRecommendedActionV1,
  TheoryContextReflectionSource,
} from "../contracts/theory-context-reflection.v1";
import type { TheoryBadgeGraphV1 } from "../contracts/theory-badge-graph.v1";
import type { TheoryFrontierCandidateV1 } from "../contracts/theory-frontier-candidate.v1";
import type {
  HelixScholarlyFullTextObservation,
  HelixScholarlyResearchObservation,
} from "../helix-scholarly-research-observation";
import { buildTheoryContextExplanationPlan } from "./theory-context-explanation-plan";
import { buildTheoryContextReflection } from "./theory-context-reflector";
import { verifyTheoryFrontierCandidateExactContract } from "./theory-frontier-exact-verifier";
import { buildTheoryFrontierLiteratureMapFromScholarlyObservations } from "./theory-frontier-literature-map";
import { buildTheoryFrontierSearch } from "./theory-frontier-search";

export type RunHelixTheoryContextReflectionToolInput = {
  graph: TheoryBadgeGraphV1;
  prompt: string;
  conversationContext?: string | null;
  mentionedEquations?: string[];
  mentionedSymbols?: string[];
  mentionedDomains?: string[];
  source?: TheoryContextReflectionSource;
  confidenceMode?: TheoryContextReflectionConfidenceMode;
  limit?: number;
  threadId?: string | null;
  turnId: string;
  buildExplanationPlan?: boolean;
  buildFrontierSearch?: boolean;
  frontierSearchSeed?: string;
  buildFrontierLiteratureMap?: boolean;
  scholarlyResearchObservation?: HelixScholarlyResearchObservation | null;
  scholarlyFullTextObservation?: HelixScholarlyFullTextObservation | null;
  panelSync?: {
    requested: boolean;
    applied?: boolean;
    openPanel?: boolean;
    overlayMode?: HelixTheoryContextReflectionPanelSyncOverlayMode;
    selectedLiveContextBlock?: boolean;
  };
};

const theoryFrontierRequested = (prompt: string): boolean =>
  /\b(?:theory\s+frontier|frontier\s+seed|seed\s+finder|frontier\s+candidate|missing\s+intermediate\s+badges?|unresolved\s+semantic\s+regions?|in\s+between\s+(?:the\s+)?badges?|candidate\s+terrain|biome\s+fields?|probability\s+terrain|verified_frontier_yield_per_budget|frontier\s+projection)\b/i.test(prompt);

function frontierScholarlyRecommendedActions(
  frontierSearchV1: ReturnType<typeof buildTheoryFrontierSearch> | null,
): TheoryContextReflectionRecommendedActionV1[] {
  if (!frontierSearchV1 || frontierSearchV1.scholarlyLookupRequests.length === 0) return [];
  return frontierSearchV1.scholarlyLookupRequests.map((request) => ({
    actionId: "theory-badge-graph.request_frontier_scholarly_lookup",
    label: "Run frontier scholarly lookup",
    panelId: "theory-badge-graph",
    args: {
      request_id: request.requestId,
      candidate_id: request.candidateId,
      target_source: request.targetSource,
      requested_outputs: request.requestedOutputs,
      query: request.query,
      badge_ids: request.badgeIds,
      render_chunk_ids: request.renderChunkIds,
      semantic_chunk_ids: request.semanticChunkIds,
      reason: request.reason,
      mutating: request.mutating,
      no_auto_promote_literature: request.noAutoPromoteLiterature,
      expected_artifacts: request.requestedOutputs.some(
        (output) => output === "scholarly_full_text" || output === "paper_pdf_pages",
      )
        ? ["scholarly_research_observation", "scholarly_full_text_observation", "theory_frontier_literature_map"]
        : ["scholarly_research_observation", "theory_frontier_literature_map"],
    },
    mutatesCalculator: false,
    solves: false,
  }));
}

export function runHelixTheoryContextReflectionTool(
  input: RunHelixTheoryContextReflectionToolInput,
): HelixTheoryContextReflectionToolReceiptV1 {
  const reflectionV1 = buildTheoryContextReflection({
    graph: input.graph,
    prompt: input.prompt,
    conversationContext: input.conversationContext ?? null,
    mentionedEquations: input.mentionedEquations ?? [],
    mentionedSymbols: input.mentionedSymbols ?? [],
    mentionedDomains: input.mentionedDomains ?? [],
    source: input.source ?? "helix_ask",
    confidenceMode: input.confidenceMode ?? "soft_locator",
    limit: input.limit,
  });

  const explanationPlanV1 = input.buildExplanationPlan
    ? buildTheoryContextExplanationPlan({
        graph: input.graph,
        reflection: reflectionV1,
      })
    : null;
  const shouldBuildFrontierSearch = input.buildFrontierSearch ?? theoryFrontierRequested(input.prompt);
  const frontierSearchV1 = shouldBuildFrontierSearch
      ? buildTheoryFrontierSearch({
          graph: input.graph,
          query: input.prompt,
          searchSeed: input.frontierSearchSeed ?? `ask:${input.turnId}:theory-frontier`,
          limit: input.limit,
        })
      : null;
  const frontierExactVerificationResultsV1 =
    frontierSearchV1?.candidates.map((candidate: TheoryFrontierCandidateV1) =>
      verifyTheoryFrontierCandidateExactContract(candidate),
    ) ?? [];
  const shouldBuildFrontierLiteratureMap =
    Boolean(frontierSearchV1) &&
    (input.buildFrontierLiteratureMap ??
      Boolean(input.scholarlyResearchObservation || input.scholarlyFullTextObservation));
  const frontierLiteratureMapV1 =
    frontierSearchV1 && shouldBuildFrontierLiteratureMap
      ? buildTheoryFrontierLiteratureMapFromScholarlyObservations({
          graph: input.graph,
          query: input.prompt,
          searchSeed: input.frontierSearchSeed ?? `ask:${input.turnId}:theory-frontier`,
          candidates: frontierSearchV1.candidates,
          researchObservation: input.scholarlyResearchObservation,
          fullTextObservation: input.scholarlyFullTextObservation,
        })
      : null;

  return buildHelixTheoryContextReflectionToolReceiptV1({
    turnId: input.turnId,
    threadId: input.threadId ?? null,
    prompt: input.prompt,
    conversationContext: input.conversationContext ?? null,
    reflectionV1,
    explanationPlanV1,
    frontierSearchV1,
    frontierLiteratureMapV1,
    frontierExactVerificationResultsV1,
    panelSync: {
      requested: input.panelSync?.requested ?? false,
      applied: input.panelSync?.applied ?? false,
      panelId: "theory-badge-graph",
      selectedLiveContextBlock: input.panelSync?.selectedLiveContextBlock ?? false,
      openPanel: input.panelSync?.openPanel ?? false,
      overlayMode: input.panelSync?.overlayMode ?? "none",
    },
    recommendedNextActions: [
      ...reflectionV1.evidenceForAsk.recommendedNextActions,
      ...(explanationPlanV1?.recommendedNextActions ?? []),
      ...frontierScholarlyRecommendedActions(frontierSearchV1),
    ],
  });
}
