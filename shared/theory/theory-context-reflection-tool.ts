import {
  buildHelixTheoryContextReflectionToolReceiptV1,
  type HelixTheoryContextReflectionPanelSyncOverlayMode,
  type HelixTheoryContextReflectionToolReceiptV1,
} from "../contracts/helix-theory-context-reflection-tool-receipt.v1";
import type {
  TheoryContextReflectionConfidenceMode,
  TheoryContextReflectionSource,
} from "../contracts/theory-context-reflection.v1";
import type { TheoryBadgeGraphV1 } from "../contracts/theory-badge-graph.v1";
import { buildTheoryContextExplanationPlan } from "./theory-context-explanation-plan";
import { buildTheoryContextReflection } from "./theory-context-reflector";

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
  panelSync?: {
    requested: boolean;
    applied?: boolean;
    openPanel?: boolean;
    overlayMode?: HelixTheoryContextReflectionPanelSyncOverlayMode;
    selectedLiveContextBlock?: boolean;
  };
};

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

  return buildHelixTheoryContextReflectionToolReceiptV1({
    turnId: input.turnId,
    threadId: input.threadId ?? null,
    prompt: input.prompt,
    conversationContext: input.conversationContext ?? null,
    reflectionV1,
    explanationPlanV1,
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
    ],
  });
}
