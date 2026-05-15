import crypto from "node:crypto";
import {
  HELIX_VISUAL_EXTRACTION_EVIDENCE_SCHEMA,
  type HelixVisualExtractionEvidence,
  type HelixVisualExtractionGoal,
} from "@shared/helix-visual-extraction-evidence";
import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import { getUserTextFromTurnInputItems, getVisualEvidenceSummaryFromTurnInputItems } from "./turn-input-item-normalizer";

const hashShort = (parts: unknown[]): string =>
  crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);

function extractHotbarCounts(summary: string): { counts: number[]; uncertainty: string[] } {
  const counts: number[] = [];
  const uncertainty: string[] = [];
  const explicitCounts =
    summary.match(/\b(?:hotbar|inventory|item)\s+counts?\b[^.\n:]{0,100}(?::|=|\bare\b)\s*([^.]+)/i)?.[1] ??
    summary.match(/\b(?:counts?|stacks?)\b[^.\n:]{0,80}(?::|=|\bare\b)\s*([^.]+)/i)?.[1];
  if (explicitCounts) {
    counts.push(...(explicitCounts.match(/\d{1,3}/g) ?? []).map((value: string) => Number(value)));
    if (/\b(?:uncertain|unclear|illegible|blurry|not\s+legible)\b/i.test(explicitCounts)) {
      uncertainty.push("Some visible hotbar slots were marked uncertain in the compact visual evidence.");
    }
  }
  const countAssignments = [...summary.matchAll(/\bcount\s*[:=]\s*(\d{1,3})\b/gi)].map((match) => Number(match[1]));
  counts.push(...countAssignments);
  const stackPhrases = [...summary.matchAll(/\b(?:stack(?:s)?\s+of\s+|x\s*)?(\d{1,3})\s+(?:[a-z][a-z0-9_-]*(?:\s+[a-z][a-z0-9_-]*){0,3})\b/gi)]
    .filter((match) => !/\bslot\s*$/i.test(summary.slice(Math.max(0, match.index - 8), match.index)))
    .map((match) => Number(match[1]))
    .filter((value: number) => value > 1);
  if (counts.length === 0 && /\b(?:hotbar|inventory)\b/i.test(summary)) counts.push(...stackPhrases);
  if (counts.length === 0) {
    uncertainty.push("No reliable numeric item counts were present in the compact visual evidence.");
  }
  return { counts: counts.filter((value: number) => Number.isFinite(value) && value >= 0), uncertainty };
}

export function buildVisualExtractionEvidence(input: {
  threadId: string;
  turnId: string;
  context: HelixMultimodalTurnContext;
  extractionGoal?: HelixVisualExtractionGoal;
}): HelixVisualExtractionEvidence {
  const userGoal = getUserTextFromTurnInputItems(input.context.turn_input_items);
  const summary = getVisualEvidenceSummaryFromTurnInputItems(input.context.turn_input_items) ?? "";
  const extractionGoal =
    input.extractionGoal ??
    (/\binventory\b/i.test(userGoal)
      ? "inventory_counts"
      : /\b(?:hotbar|items?|how\s+many|count)\b/i.test(userGoal)
      ? "hotbar_item_counts"
      : "visible_objects");
  const { counts, uncertainty } =
    extractionGoal === "hotbar_item_counts" || extractionGoal === "inventory_counts"
      ? extractHotbarCounts(summary)
      : { counts: [], uncertainty: summary ? [] : ["No compact visual summary was available."] };
  const hotbarSlots = counts.map((count: number, index: number) => ({
    slot: index + 1,
    visible: true,
    item_hint: "unknown",
    count,
    confidence: 0.72,
  }));
  const slotKey = extractionGoal === "inventory_counts" ? "inventory_slots" : "hotbar_slots";

  return {
    schema: HELIX_VISUAL_EXTRACTION_EVIDENCE_SCHEMA,
    extraction_id: `visual-extraction:${hashShort([input.threadId, input.turnId, extractionGoal, summary])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    source_evidence_refs: input.context.visual_evidence_refs,
    extraction_goal: extractionGoal,
    structured_result: {
      source_summary: summary,
      [slotKey]: hotbarSlots,
      counts,
      unclear_slots: uncertainty.length > 0 ? ["unknown"] : [],
    },
    confidence: counts.length > 0 ? 0.72 : 0.35,
    uncertainty,
    model_invoked: false,
    assistant_answer: false,
    raw_image_included: false,
    context_policy: "compact_context_pack_only",
  };
}
