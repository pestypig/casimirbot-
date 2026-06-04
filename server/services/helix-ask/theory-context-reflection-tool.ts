import type {
  HelixTheoryContextReflectionPanelSyncOverlayMode,
  HelixTheoryContextReflectionToolReceiptV1,
} from "../../../shared/contracts/helix-theory-context-reflection-tool-receipt.v1";
import type {
  TheoryContextReflectionConfidenceMode,
} from "../../../shared/contracts/theory-context-reflection.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../../shared/theory/nhm2-theory-badges";
import { runHelixTheoryContextReflectionTool } from "../../../shared/theory/theory-context-reflection-tool";
import {
  buildTheoryCongruenceTrace,
  type TheoryCongruenceTraceFeatureFlagMode,
} from "./theory-congruence/solver-adapter";

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

function theoryCongruenceTraceMode(): TheoryCongruenceTraceFeatureFlagMode {
  const raw = process.env.HELIX_ASK_THEORY_CONGRUENCE_TRACE;
  return raw === "off" || raw === "on" || raw === "shadow" ? raw : "shadow";
}

export function runAskLevelTheoryContextReflectionTool(
  input: RunAskLevelTheoryContextReflectionToolInput,
): HelixTheoryContextReflectionToolReceiptV1 {
  const graph = buildNhm2TheoryBadgeGraphV1();
  const receipt = runHelixTheoryContextReflectionTool({
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
  const mode = theoryCongruenceTraceMode();
  if (mode === "off") return receipt;
  return {
    ...receipt,
    theoryCongruenceTraceV1: buildTheoryCongruenceTrace({
      graph,
      turnId: input.turnId,
      prompt: input.prompt,
      reflection: receipt.reflectionV1,
      explanationPlan: receipt.explanationPlanV1,
      featureFlagMode: mode,
    }),
  };
}
