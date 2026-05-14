import type { GameSemanticEntry, GameSemanticLookupReceipt } from "@shared/helix-game-semantic-dictionary";
import type { GameUtilityHypothesis } from "@shared/helix-game-utility-hypothesis";
import type { HelixSyntheticEvidence, HelixSyntheticEvidenceSupportStatus } from "@shared/helix-synthetic-evidence";
import type {
  HelixMinecraftEntitySenseSummary,
  HelixMinecraftWorldSenseContext,
} from "@shared/helix-minecraft-world-sense";
import { lookupGameSemanticReference } from "./game-semantic-reference";
import { reasonGameUtilityFromEntityCluster } from "./game-utility-reasoner";
import { recordSyntheticEvidence } from "./synthetic-evidence-ledger";

const utilityHypothesesByThread = new Map<string, GameUtilityHypothesis[]>();

export type MinecraftEntityUtilityReduction = {
  lookup_receipts: GameSemanticLookupReceipt[];
  utility_hypotheses: GameUtilityHypothesis[];
  synthetic_evidence: HelixSyntheticEvidence[];
};

const supportStatusForHypothesis = (status: GameUtilityHypothesis["status"]): HelixSyntheticEvidenceSupportStatus =>
  status === "confirmed" || status === "likely"
    ? "supports"
    : status === "possible"
      ? "partial"
      : status === "contradicted"
        ? "contradicts"
        : "unknown";

export function reduceMinecraftEntityUtility(input: {
  threadId: string;
  context: HelixMinecraftWorldSenseContext;
  now?: string;
}): MinecraftEntityUtilityReduction {
  const lookupReceipts: GameSemanticLookupReceipt[] = [];
  const hypotheses: GameUtilityHypothesis[] = [];
  const syntheticEvidence: HelixSyntheticEvidence[] = [];
  for (const cluster of input.context.entity_clusters) {
    const queryRefs = [
      cluster.entity_type,
      ...(cluster.item_flow ?? []).map((flow: NonNullable<HelixMinecraftEntitySenseSummary["item_flow"]>[number]) => flow.item_type),
      ...(cluster.containment?.nearby_blocks ?? []),
      ...(cluster.containment?.likely_barriers ?? []),
    ];
    const { receipt, entries } = lookupGameSemanticReference({
      threadId: input.threadId,
      gameId: "minecraft",
      queryRefs,
      now: input.now,
    });
    lookupReceipts.push(receipt);
    const hypothesis = reasonGameUtilityFromEntityCluster({
      threadId: input.threadId,
      roomId: input.context.room_id,
      gameId: "minecraft",
      cluster,
      semanticEntries: entries.filter((entry: GameSemanticEntry) => entry.kind === "entity"),
      semanticLookupId: receipt.lookup_id,
      now: input.now,
    });
    if (hypothesis) {
      hypotheses.push(hypothesis);
      syntheticEvidence.push(recordSyntheticEvidence({
        thread_id: input.threadId,
        produced_by: "game_utility_reasoner",
        claim: `${hypothesis.utility_label} is ${hypothesis.status} from compact Minecraft world-sense evidence.`,
        support_status: supportStatusForHypothesis(hypothesis.status),
        source_refs: hypothesis.supporting_evidence_refs,
        reusable_context_ref: hypothesis.hypothesis_id,
        deterministic: hypothesis.deterministic,
        model_invoked: hypothesis.model_invoked,
      }));
    }
  }
  if (hypotheses.length > 0) {
    const existing = utilityHypothesesByThread.get(input.threadId) ?? [];
    utilityHypothesesByThread.set(input.threadId, [...existing, ...hypotheses].slice(-200));
  }
  return {
    lookup_receipts: lookupReceipts,
    utility_hypotheses: hypotheses,
    synthetic_evidence: syntheticEvidence,
  };
}

export function listGameUtilityHypotheses(threadId: string): GameUtilityHypothesis[] {
  return [...(utilityHypothesesByThread.get(threadId) ?? [])];
}

export function clearGameUtilityHypothesesForTest(): void {
  utilityHypothesesByThread.clear();
}
