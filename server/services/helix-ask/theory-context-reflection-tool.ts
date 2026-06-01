import type {
  HelixTheoryContextReflectionPanelSyncOverlayMode,
  HelixTheoryContextReflectionToolReceiptV1,
} from "../../../shared/contracts/helix-theory-context-reflection-tool-receipt.v1";
import type {
  TheoryContextReflectionConfidenceMode,
} from "../../../shared/contracts/theory-context-reflection.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../../shared/theory/nhm2-theory-badges";
import { runHelixTheoryContextReflectionTool } from "../../../shared/theory/theory-context-reflection-tool";

export type RunAskLevelTheoryContextReflectionToolInput = {
  prompt: string;
  conversationContext?: string | null;
  mentionedEquations?: string[];
  mentionedSymbols?: string[];
  mentionedDomains?: string[];
  confidenceMode?: TheoryContextReflectionConfidenceMode;
  limit?: number;
  threadId?: string | null;
  turnId: string;
  buildExplanationPlan?: boolean;
  syncPanel?: boolean;
  openPanel?: boolean;
  panelOverlayMode?: HelixTheoryContextReflectionPanelSyncOverlayMode;
};

export function runAskLevelTheoryContextReflectionTool(
  input: RunAskLevelTheoryContextReflectionToolInput,
): HelixTheoryContextReflectionToolReceiptV1 {
  const graph = buildNhm2TheoryBadgeGraphV1();
  return runHelixTheoryContextReflectionTool({
    graph,
    prompt: input.prompt,
    conversationContext: input.conversationContext ?? null,
    mentionedEquations: input.mentionedEquations ?? [],
    mentionedSymbols: input.mentionedSymbols ?? [],
    mentionedDomains: input.mentionedDomains ?? [],
    confidenceMode: input.confidenceMode ?? "soft_locator",
    limit: input.limit,
    threadId: input.threadId ?? null,
    turnId: input.turnId,
    source: "helix_ask",
    buildExplanationPlan: input.buildExplanationPlan ?? true,
    panelSync: {
      requested: input.syncPanel ?? true,
      applied: false,
      overlayMode: input.panelOverlayMode ?? "live_answer_context",
      openPanel: input.openPanel ?? false,
      selectedLiveContextBlock: true,
    },
  });
}
