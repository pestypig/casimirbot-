import type { GameSemanticLookupReceipt } from "@shared/helix-game-semantic-dictionary";
import type { GameUtilityHypothesis } from "@shared/helix-game-utility-hypothesis";

export function selectGameSemanticContext(input: {
  prompt: string;
  lookupReceipts: GameSemanticLookupReceipt[];
  utilityHypotheses: GameUtilityHypothesis[];
  limit?: number;
}): {
  semantic_reference_hits: GameSemanticLookupReceipt[];
  utility_hypotheses: GameUtilityHypothesis[];
  missing_evidence_notes: string[];
  semantic_confidence_ladder: string[];
} {
  const prompt = input.prompt.toLowerCase();
  const limit = input.limit ?? 5;
  const hypotheses = input.utilityHypotheses
    .filter((hypothesis) =>
      prompt.includes("farm") ||
      prompt.includes("use") ||
      prompt.includes("utility") ||
      prompt.includes(hypothesis.subject_ref.replace(/^minecraft:/, "")),
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
  const referencedEntries = new Set(hypotheses.flatMap((hypothesis) => hypothesis.semantic_entry_refs));
  const receipts = input.lookupReceipts
    .filter((receipt) => receipt.matched_entry_ids.some((entryId) => referencedEntries.has(entryId)))
    .slice(-limit);
  return {
    semantic_reference_hits: receipts,
    utility_hypotheses: hypotheses,
    missing_evidence_notes: Array.from(new Set(hypotheses.flatMap((hypothesis) => hypothesis.missing_evidence))).slice(0, 8),
    semantic_confidence_ladder: hypotheses
      .map((hypothesis) => `${hypothesis.utility_label}: ${hypothesis.status} (${hypothesis.confidence.toFixed(2)})`)
      .slice(0, 8),
  };
}
