import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  FileImage,
  Image as ImageIcon,
  Link,
  RotateCcw,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import {
  DOCUMENT_IMAGE_REGION_KIND_VALUES,
  type DocumentImageRegionKindV1,
  type DocumentImageSourceKindV1,
} from "@shared/contracts/document-image-region-receipt.v1";
import {
  DEFAULT_DOCUMENT_IMAGE_OBSERVER_PROFILE_ID,
  DEFAULT_DOCUMENT_IMAGE_SHADE_PROMPT_ID,
  buildDocumentImageRegionReceipt,
  clampDocumentImageBbox,
  cropImageToDataUrl,
  hashDocumentImageString,
} from "@/lib/document-image/documentImageRegions";
import { emitHelixAskLiveEvent } from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useDocumentImageRegionStore, type DocumentImageRegionState } from "@/store/useDocumentImageRegionStore";
import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";

const SOURCE_KIND_LABELS: Record<DocumentImageSourceKindV1, string> = {
  image_attachment: "Image attachment",
  pdf_page_render: "PDF page render",
  manual_image_url: "Manual image URL",
};

const SOURCE_KIND_OPTIONS = Object.entries(SOURCE_KIND_LABELS) as Array<[DocumentImageSourceKindV1, string]>;

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(2)}%`;
}

function buildImageSourceId(value: string): string {
  return `document-image:${hashDocumentImageString(value).replace("fnv1a32:", "")}`;
}

export default function DocumentImageLensPanel() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [sourceKind, setSourceKind] = useState<DocumentImageSourceKindV1>("manual_image_url");
  const [pageDraft, setPageDraft] = useState("1");
  const [kind, setKind] = useState<DocumentImageRegionKindV1>("equation");
  const [confidence, setConfidence] = useState(0.65);
  const [summary, setSummary] = useState("Document image region candidate.");
  const [textCandidate, setTextCandidate] = useState("");
  const [latexCandidate, setLatexCandidate] = useState("");
  const [statusMessage, setStatusMessage] = useState("Load an image, position the crop, then create a candidate receipt.");
  const source = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.source);
  const naturalSize = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.naturalSize);
  const cropDraft = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.cropDraft);
  const receipts = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.receipts);
  const setSourceImage = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.setSourceImage);
  const setNaturalSize = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.setNaturalSize);
  const setCropDraft = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.setCropDraft);
  const addReceipt = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.addReceipt);
  const updateReceiptStatus = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.updateReceiptStatus);
  const clearReceipts = useDocumentImageRegionStore((state: DocumentImageRegionState) => state.clearReceipts);

  const clampedCrop = useMemo(() => {
    if (!naturalSize) return cropDraft;
    return clampDocumentImageBbox(cropDraft, naturalSize);
  }, [cropDraft, naturalSize]);

  const cropBoxStyle = useMemo<React.CSSProperties>(() => {
    if (!naturalSize) return { display: "none" };
    return {
      left: formatPercent((clampedCrop.x / naturalSize.width) * 100),
      top: formatPercent((clampedCrop.y / naturalSize.height) * 100),
      width: formatPercent((clampedCrop.width / naturalSize.width) * 100),
      height: formatPercent((clampedCrop.height / naturalSize.height) * 100),
    };
  }, [clampedCrop, naturalSize]);

  const loadUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      setStatusMessage("Enter an image URL or choose a local image file.");
      return;
    }
    const pageNumber = sourceKind === "pdf_page_render" ? Math.max(1, Math.floor(parseNumber(pageDraft, 1))) : null;
    setSourceImage({
      sourceImageUrl: trimmed,
      sourceAttachmentId: buildImageSourceId(trimmed),
      sourceKind,
      pageNumber,
    });
    setStatusMessage("Image source loaded. Crop values use natural image pixels.");
  };

  const loadFile = (file: File | null) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrlDraft(objectUrl);
    setSourceKind("image_attachment");
    setSourceImage({
      sourceImageUrl: objectUrl,
      sourceAttachmentId: `image-attachment:${hashDocumentImageString(`${file.name}:${file.size}:${file.lastModified}`).replace("fnv1a32:", "")}`,
      sourceKind: "image_attachment",
      pageNumber: null,
    });
    setStatusMessage("Local image loaded. Crop values use natural image pixels.");
  };

  const useFullImage = () => {
    if (!naturalSize) return;
    setCropDraft({
      x: 0,
      y: 0,
      width: naturalSize.width,
      height: naturalSize.height,
    });
  };

  const createReceipt = async () => {
    if (!source || !naturalSize) {
      setStatusMessage("Load an image before creating a crop receipt.");
      return;
    }
    const img = imageRef.current;
    const bboxPx = clampDocumentImageBbox(cropDraft, naturalSize);
    let imageRefValue = `${source.sourceImageUrl}#crop=${bboxPx.x},${bboxPx.y},${bboxPx.width},${bboxPx.height}`;
    if (img) {
      try {
        imageRefValue = await cropImageToDataUrl(img, bboxPx);
      } catch {
        imageRefValue = `${source.sourceImageUrl}#crop=${bboxPx.x},${bboxPx.y},${bboxPx.width},${bboxPx.height}`;
      }
    }

    const receipt = buildDocumentImageRegionReceipt({
      sourceAttachmentId: source.sourceAttachmentId,
      sourceKind: source.sourceKind,
      sourceImageRef: source.sourceImageUrl,
      pageNumber: source.pageNumber,
      pageImageRef: source.sourceKind === "pdf_page_render" ? source.sourceImageUrl : undefined,
      bboxPx,
      imageRef: imageRefValue,
      kind,
      confidence,
      summary,
      textCandidate: textCandidate.trim() || undefined,
      latexCandidate: latexCandidate.trim() || undefined,
      status: "candidate",
      observerProfileId: DEFAULT_DOCUMENT_IMAGE_OBSERVER_PROFILE_ID,
      shadePromptId: DEFAULT_DOCUMENT_IMAGE_SHADE_PROMPT_ID,
      nearbyText: summary,
    });

    addReceipt(receipt);
    useVisualSourceCaptureStore.getState().upsertProducer({
      source_id: receipt.visualSource.sourceId,
      thread_id: HELIX_ASK_CONTEXT_ID.desktop,
      stream_active: true,
      track_ready_state: "live",
      capture_mode: "manual",
      cadence_ms: null,
      last_frame_at: receipt.generatedAt,
      last_frame_hash: receipt.crop.imageHash,
      last_frame_preview_data_url: receipt.crop.imageRef.startsWith("data:image/") ? receipt.crop.imageRef : null,
      frame_history: [
        {
          history_id: `history:${receipt.crop.regionId}`,
          source_id: receipt.visualSource.sourceId,
          frame_id: receipt.visualSource.frameId,
          evidence_id: receipt.crop.regionId,
          captured_at: receipt.generatedAt,
          preview_data_url: receipt.crop.imageRef.startsWith("data:image/") ? receipt.crop.imageRef : source.sourceImageUrl,
          preview_hash: receipt.crop.imageHash,
          summary: receipt.classification.summary,
          visual_observer_profile_id: receipt.visualSource.observerProfileId,
          visual_observer_profile_title: "Document Image Lens",
          visual_prompt_hash: receipt.visualSource.shadePromptId
            ? hashDocumentImageString(receipt.visualSource.shadePromptId)
            : null,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      ],
    });
    emitHelixAskLiveEvent({
      contextId: HELIX_ASK_CONTEXT_ID.desktop,
      entry: {
        id: `document-image-region:${receipt.crop.regionId}`,
        ts: receipt.generatedAt,
        text: `Document Image Lens captured ${receipt.classification.kind} region ${receipt.crop.regionId}; candidate only, not proof authority.`,
        tool: "document-image-lens.region_receipt",
        meta: {
          artifact_kind: "document_image_region_receipt/v1",
          assistant_answer: false,
          terminal_eligible: false,
          receipt,
        },
      },
    });
    setStatusMessage("Candidate receipt created and published as a visual source frame.");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100" data-testid="document-image-lens-panel">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileImage className="h-4 w-4 text-cyan-200" />
          Document Image Lens
        </div>
        <button
          type="button"
          onClick={clearReceipts}
          className="inline-flex items-center gap-1 rounded border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-100 hover:bg-rose-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear receipts
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(300px,420px)_1fr] gap-0 overflow-hidden">
        <aside className="min-h-0 overflow-auto border-r border-white/10 p-3">
          <section className="space-y-3 rounded border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <Link className="h-3.5 w-3.5" />
              Source
            </div>
            <label className="block text-xs text-slate-300">
              Image URL
              <input
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400/60"
                placeholder="https://... or data:image/..."
              />
            </label>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <label className="block text-xs text-slate-300">
                Source kind
                <select
                  value={sourceKind}
                  onChange={(event) => setSourceKind(event.target.value as DocumentImageSourceKindV1)}
                  className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
                >
                  {SOURCE_KIND_OPTIONS.map(([value, label]: [DocumentImageSourceKindV1, string]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-300">
                Page
                <input
                  value={pageDraft}
                  onChange={(event) => setPageDraft(event.target.value)}
                  disabled={sourceKind !== "pdf_page_render"}
                  className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs disabled:opacity-50"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadUrl}
                className="inline-flex items-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Load URL
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-500/50 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-700">
                <FileImage className="h-3.5 w-3.5" />
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => loadFile(event.currentTarget.files?.[0] ?? null)}
                />
              </label>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">{statusMessage}</p>
          </section>

          <section className="mt-3 space-y-3 rounded border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <Scissors className="h-3.5 w-3.5" />
                Crop
              </div>
              <button
                type="button"
                onClick={useFullImage}
                disabled={!naturalSize}
                className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Full image
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["x", "y", "width", "height"] as const).map((key) => (
                <label key={key} className="block text-xs text-slate-300">
                  {key}
                  <input
                    type="number"
                    min={key === "width" || key === "height" ? 1 : 0}
                    value={Math.round(cropDraft[key])}
                    onChange={(event) => setCropDraft({ [key]: parseNumber(event.target.value, cropDraft[key]) })}
                    className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
                  />
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Natural size: {naturalSize ? `${naturalSize.width} x ${naturalSize.height}px` : "not loaded"}
            </p>
          </section>

          <section className="mt-3 space-y-3 rounded border border-white/10 bg-black/20 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Candidate metadata</div>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <label className="block text-xs text-slate-300">
                Region kind
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as DocumentImageRegionKindV1)}
                  className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
                >
                  {DOCUMENT_IMAGE_REGION_KIND_VALUES.map((value: DocumentImageRegionKindV1) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-300">
                Confidence
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={confidence}
                  onChange={(event) => setConfidence(parseNumber(event.target.value, confidence))}
                  className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
                />
              </label>
            </div>
            <label className="block text-xs text-slate-300">
              Summary
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="mt-1 h-16 w-full resize-none rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
              />
            </label>
            <label className="block text-xs text-slate-300">
              OCR text candidate
              <textarea
                value={textCandidate}
                onChange={(event) => setTextCandidate(event.target.value)}
                className="mt-1 h-16 w-full resize-none rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
              />
            </label>
            <label className="block text-xs text-slate-300">
              LaTeX candidate
              <input
                value={latexCandidate}
                onChange={(event) => setLatexCandidate(event.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-xs"
                placeholder="T_{00} = ..."
              />
            </label>
            <button
              type="button"
              onClick={createReceipt}
              disabled={!source || !naturalSize}
              className="inline-flex w-full items-center justify-center gap-1 rounded border border-emerald-400/40 bg-emerald-500/10 px-2 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Scissors className="h-3.5 w-3.5" />
              Create candidate receipt
            </button>
          </section>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto bg-slate-950 p-4">
            <div className="relative flex min-h-[420px] items-center justify-center rounded border border-white/10 bg-[linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.04)_75%),linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.04)_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px]">
              {source ? (
                <div className="relative max-h-full max-w-full">
                  <img
                    ref={imageRef}
                    src={source.sourceImageUrl}
                    alt="Document source"
                    crossOrigin="anonymous"
                    className="max-h-[70vh] max-w-full select-none object-contain"
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      setNaturalSize({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
                    }}
                    onError={() => setStatusMessage("Image failed to load. Check the URL or choose a local file.")}
                  />
                  <div
                    className="pointer-events-none absolute border-2 border-cyan-300 bg-cyan-300/10 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]"
                    style={cropBoxStyle}
                    data-testid="document-image-crop-box"
                  />
                </div>
              ) : (
                <div className="text-center text-sm text-slate-500">
                  <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                  No document image loaded.
                </div>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-auto border-t border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Region receipts</div>
              <div className="text-[11px] text-slate-500">candidate only / not proof authority</div>
            </div>
            {receipts.length === 0 ? (
              <p className="text-xs text-slate-500">No region receipts yet.</p>
            ) : (
              <div className="space-y-2">
                {receipts.map((receipt: NonNullable<DocumentImageRegionState["lastReceipt"]>) => (
                  <article key={receipt.crop.regionId} className="rounded border border-white/10 bg-slate-900/70 p-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium text-slate-100">
                        {receipt.classification.kind} - {receipt.extraction.status}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateReceiptStatus(receipt.crop.regionId, "confirmed")}
                          className="inline-flex items-center gap-1 rounded border border-emerald-400/30 px-1.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/10"
                        >
                          <Check className="h-3 w-3" />
                          Confirm candidate
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReceiptStatus(receipt.crop.regionId, "rejected")}
                          className="inline-flex items-center gap-1 rounded border border-rose-400/30 px-1.5 py-1 text-[11px] text-rose-100 hover:bg-rose-500/10"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-slate-300">{receipt.classification.summary}</p>
                    <p className="mt-1 break-all text-[11px] text-slate-500">
                      {receipt.crop.regionId} - bbox={receipt.crop.bboxPx.x},{receipt.crop.bboxPx.y},{receipt.crop.bboxPx.width},{receipt.crop.bboxPx.height} - hash={receipt.crop.imageHash}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-200">
                      Claim boundary: OCR candidate only; not proof authority.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
