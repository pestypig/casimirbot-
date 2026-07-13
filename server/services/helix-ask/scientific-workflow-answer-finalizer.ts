import type { ScientificImageEvidenceSidecarV1 } from "@shared/scientific-evidence-adaptor";

type ScientificWorkflowSourceState = {
  sourceId?: string | null;
  sourceHash?: string | null;
  pageNumber?: number | null;
  cropRef?: string | null;
};

type ScientificWorkflowStatusState = {
  evidenceDepth?: string | null;
  promotedRowState?: string | null;
  activeBlockers?: string[] | null;
  historicalBlockers?: string[] | null;
};

type ScientificWorkflowFinalizerInput = {
  promptText: string;
  rawText: string;
  sidecar?: ScientificImageEvidenceSidecarV1 | null;
  sourceState?: ScientificWorkflowSourceState | null;
  workflowStatus?: ScientificWorkflowStatusState | null;
  failureReason?: string | null;
};

const RAW_AUDIT_PROMPT_RE =
  /\b(?:audit|debug|provenance|raw\s+refs?|lookup\s+keys?|evidence\s+depth|sidecar(?:\s+id)?|source\s+(?:id|image\s+hash|hash)|crop\s+ref|bbox|active\s+promoted\s+(?:row|block)\s+blockers|historical\s+non-promoted\s+(?:row|block)\s+blockers|report\s+only|tell\s+me\s+which\s+promoted\s+page-grounded\s+equation\s+(?:row|block)|which\s+promoted\s+page-grounded\s+equation\s+(?:row|block)|which\s+paper,\s*page,\s*equation)\b/i;

const readSidecarDepth = (sidecar: ScientificImageEvidenceSidecarV1 | null | undefined): string => {
  if (!sidecar) return "missing";
  const summary = sidecar.exact_equation_summary;
  if ((summary.promoted_block_count ?? 0) > 0) return "exact_block_promoted";
  if ((summary.admissible_block_count ?? 0) > 0 || (summary.partial_block_count ?? 0) > 0) return "exact_block_partial";
  if (summary.promoted_row_count > 0) return "exact_row_promoted";
  if (summary.admissible_row_count > 0 || summary.partial_row_count > 0) return "exact_row_partial";
  if (sidecar.packets.some((packet) => packet.latex_candidate || packet.text_candidate || packet.ocr_text_candidate)) {
    return "page_image_ocr_math_candidate";
  }
  return sidecar.packets.length > 0 ? "page_image_observation" : "missing";
};

const firstInterestingBlocker = (values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized || normalized === "none") continue;
    return normalized;
  }
  return null;
};

export const shouldUseRawScientificWorkflowAuditAnswer = (promptText: string): boolean =>
  RAW_AUDIT_PROMPT_RE.test(promptText);

export const finalizeScientificWorkflowAnswer = (input: ScientificWorkflowFinalizerInput): string => {
  if (shouldUseRawScientificWorkflowAuditAnswer(input.promptText)) return input.rawText;

  const sidecar = input.sidecar ?? null;
  const source = input.sourceState ?? null;
  const workflowStatus = input.workflowStatus ?? null;
  const sidecarDepth = readSidecarDepth(sidecar);
  const evidenceDepth = workflowStatus?.evidenceDepth ?? sidecarDepth;
  const promotedRowCount = sidecar?.exact_equation_summary.promoted_row_count ?? 0;
  const promotedBlockCount = sidecar?.exact_equation_summary.promoted_block_count ?? 0;
  const partialRowCount = sidecar?.exact_equation_summary.partial_row_count ?? 0;
  const partialBlockCount = sidecar?.exact_equation_summary.partial_block_count ?? 0;
  const promotedCount = promotedRowCount + promotedBlockCount;
  const partialCount = partialRowCount + partialBlockCount;
  const activeBlocker = firstInterestingBlocker([
    ...(workflowStatus?.activeBlockers ?? []),
    ...(sidecar?.selected_evidence_object?.active_blockers ?? []),
    ...(sidecar?.historical_blockers ?? []),
    input.failureReason ?? null,
  ]);
  const hasPageSource = Boolean(source?.sourceId || source?.sourceHash || source?.pageNumber !== null || source?.cropRef);

  if (!sidecar && hasPageSource) {
    return [
      "I can see the scientific workflow still has a page source to work from, but the reusable scientific evidence package is not available in this turn. That means the page can guide the next extraction, but it is not enough yet for graph reflection, calculator handoff, or Postulate Board review.",
      "",
      `Evidence state: page source loaded; scientific sidecar missing; exact row not promoted; graph/calculator/postulate handoff blocked.`,
      source?.pageNumber !== null && source?.pageNumber !== undefined ? `Current page: ${source.pageNumber}.` : null,
      "Next step: recreate or restore the scientific Image Lens sidecar by cropping the full equation row, then rerun the reflection.",
    ].filter(Boolean).join("\n");
  }

  if (!sidecar) {
    return [
      "I do not have a recoverable scientific evidence package for this workflow yet. I can discuss the general idea from the chat, but I should not claim page-grounded paper evidence, graph reflection, calculator status, or postulate readiness until the Image Lens evidence chain is restored.",
      "",
      "Evidence state: scientific sidecar missing; exact row not promoted; graph/calculator/postulate handoff blocked.",
      "Next step: load or recreate the page evidence, then promote a full equation row before asking for reflection or review.",
    ].join("\n");
  }

  if (promotedCount > 0) {
    return [
      "I have page-grounded equation evidence available, so this can support a bounded conceptual reflection. The right use is diagnostic: explain what the equation appears to contribute, compare it to nearby theory-graph concepts, and identify what would still be needed before stronger claims.",
      "",
      "This does not prove the paper's broader claims, promote a badge, or make calculator results authoritative. Calculator work still needs bound variables, units, assumptions, and source refs.",
      "",
      `Evidence state: ${evidenceDepth}; promoted exact rows: ${promotedRowCount}; promoted exact blocks: ${promotedBlockCount}; partial rows: ${partialRowCount}; partial blocks: ${partialBlockCount}.`,
      "Next step: use the promoted equation evidence as the cited target, then keep the answer framed as relevance/adjacency unless a derivation chain is added.",
    ].join("\n");
  }

  if (evidenceDepth === "exact_row_partial" || evidenceDepth === "exact_block_partial" || partialCount > 0 || workflowStatus?.promotedRowState === "partial") {
    return [
      "The workflow has found equation-like evidence, but not a promoted full equation row. That can help locate the relevant science, but it is still too weak for graph reflection, calculator handoff, or postulate submission.",
      "",
      `Evidence state: ${evidenceDepth}; promoted exact rows: ${promotedRowCount}; promoted exact blocks: ${promotedBlockCount}; partial rows: ${partialRowCount}; partial blocks: ${partialBlockCount}.`,
      activeBlocker ? `Current blocker: ${activeBlocker}.` : null,
      "Next step: crop the complete equation row, including the equation body and label if required, then promote only if the row is single-line, non-truncated, and has clean LaTeX.",
    ].filter(Boolean).join("\n");
  }

  return [
    "The workflow has page/image evidence, but it has not produced a usable equation row yet. Treat this as a source-location state, not scientific evidence for graph, calculator, or postulate workflows.",
    "",
    `Evidence state: ${evidenceDepth}; promoted exact rows: 0.`,
    activeBlocker ? `Current blocker: ${activeBlocker}.` : null,
    "Next step: inspect the page and extract the full equation row before asking for reflection or review.",
  ].filter(Boolean).join("\n");
};
