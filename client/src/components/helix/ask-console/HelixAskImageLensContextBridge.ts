import { useDocumentImageRegionStore } from "@/store/useDocumentImageRegionStore";

export function readHelixAskActiveImageLensSourceContext(): Record<string, unknown> | null {
  const source = useDocumentImageRegionStore.getState().source;
  if (!source) return null;
  return {
    source_id: source.sourceId ?? null,
    source_attachment_id: source.sourceAttachmentId,
    source_kind: source.sourceKind,
    source_image_ref: source.pageImageRef ?? source.sourceImageUrl,
    page_image_ref: source.pageImageRef ?? null,
    source_ref_hash: source.sourceRefHash ?? null,
    page_number: source.pageNumber ?? null,
    page_count: source.pageCount ?? null,
    evidence_id: source.evidenceId ?? null,
    region_id: source.regionId ?? null,
    scientific_evidence_sidecar_id: source.scientificEvidenceSidecarId ?? null,
    scholarly_source_pdf_ref: source.scholarlySourcePdfRef ?? null,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}

export function attachHelixAskActiveImageLensSourceContext<T extends Record<string, unknown>>(snapshot: T): T {
  const activeImageLensSource = readHelixAskActiveImageLensSourceContext();
  if (!activeImageLensSource) return snapshot;
  return {
    ...snapshot,
    activeImageLensSource,
    active_image_lens_source: activeImageLensSource,
  };
}
