import type { ImageLensRegionInspectionReceiptV1 } from "@shared/contracts/image-lens-region-inspection.v1";
import { useDocumentImageRegionStore } from "@/store/useDocumentImageRegionStore";
import {
  VISUAL_SOURCE_FRAME_HISTORY_TTL_MS,
  type VisualSourceCaptureFrameHistoryItem,
  useVisualSourceCaptureStore,
} from "@/store/useVisualSourceCaptureStore";

export type ApplyImageLensRegionInspectionReceiptInput = {
  receipt: ImageLensRegionInspectionReceiptV1;
  threadId: string;
  capturedAt?: string;
  producerId?: string | null;
  environmentId?: string | null;
  pipelineId?: string | null;
};

const hashString = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const isDisplayableImageRef = (value: string | null | undefined): value is string =>
  typeof value === "string" &&
  /^(data:image\/|blob:|https?:\/\/|file:\/\/)/i.test(value.trim());

export function applyImageLensRegionInspectionReceipt(
  input: ApplyImageLensRegionInspectionReceiptInput,
): VisualSourceCaptureFrameHistoryItem {
  const { receipt } = input;
  const documentReceipt = receipt.document_region_receipt;
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const capturedAtMs = Date.parse(capturedAt);
  const expiresAt = new Date(
    (Number.isFinite(capturedAtMs) ? capturedAtMs : Date.now()) + VISUAL_SOURCE_FRAME_HISTORY_TTL_MS,
  ).toISOString();
  const sourceId = documentReceipt.visualSource.sourceId;
  const frameId = documentReceipt.visualSource.frameId;
  const sourceImageRef = receipt.source_kind === "pdf_page_render"
    ? receipt.page_image_ref ?? receipt.source_image_ref
    : receipt.source_image_ref ?? receipt.page_image_ref;

  const documentStore = useDocumentImageRegionStore.getState();
  if (isDisplayableImageRef(sourceImageRef)) {
    documentStore.setSourceImage({
      sourceImageUrl: sourceImageRef,
      sourceAttachmentId: documentReceipt.sourceAttachmentId,
      sourceKind: receipt.source_kind,
      pageNumber: receipt.page_number,
    });
  }
  useDocumentImageRegionStore.getState().setCropDraft(receipt.bbox_px);
  useDocumentImageRegionStore.getState().addReceipt(documentReceipt);
  useVisualSourceCaptureStore.getState().upsertProducer({
    source_id: sourceId,
    thread_id: input.threadId,
    producer_id: input.producerId ?? "image_lens_region_inspection",
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    stream_active: false,
    interval_active: false,
    track_ready_state: "ended",
    capture_mode: "manual",
    cadence_ms: null,
    last_frame_at: capturedAt,
    last_heartbeat_at: capturedAt,
    last_frame_hash: documentReceipt.crop.imageHash,
    last_frame_preview_data_url: receipt.crop_image_ref,
    capture_count: 1,
    post_count: 0,
    last_error: null,
  });

  const frame: VisualSourceCaptureFrameHistoryItem = {
    history_id: `image_lens_region_history:${receipt.region_id}`,
    source_id: sourceId,
    frame_id: frameId,
    evidence_id: receipt.evidence_id,
    captured_at: capturedAt,
    preview_data_url: receipt.crop_image_ref,
    preview_hash: documentReceipt.crop.imageHash || hashString(receipt.crop_image_ref),
    source_kind: "image_lens_crop",
    crop_only: true,
    crop_bbox_px: receipt.bbox_px,
    crop_region_id: receipt.region_id,
    summary: receipt.summary,
    visual_observer_profile_id: documentReceipt.visualSource.observerProfileId,
    visual_observer_profile_title: "Image Lens region inspection",
    visual_prompt_hash: hashString([
      receipt.requested_question ?? "",
      receipt.reason_for_crop ?? "",
      receipt.detail,
    ].join("|")),
    expires_at: expiresAt,
  };
  useVisualSourceCaptureStore.getState().appendFrameHistory(sourceId, frame, {
    last_frame_at: capturedAt,
    last_heartbeat_at: capturedAt,
    last_frame_hash: frame.preview_hash,
    last_frame_preview_data_url: receipt.crop_image_ref,
  });
  return frame;
}
