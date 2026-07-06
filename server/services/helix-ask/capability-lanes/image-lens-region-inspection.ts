import crypto from "node:crypto";
import sharp from "sharp";
import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
} from "@shared/helix-agent-step-observation-packet";
import type {
  DocumentImageBboxPxV1,
  DocumentImageRegionReceiptV1,
  DocumentImageSourceKindV1,
} from "@shared/contracts/document-image-region-receipt.v1";
import {
  DOCUMENT_IMAGE_REGION_RECEIPT_VERSION,
} from "@shared/contracts/document-image-region-receipt.v1";
import {
  buildScientificEvidencePacket,
  buildScientificImageEvidenceSidecar,
} from "@shared/scientific-evidence-adaptor";
import {
  IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
  IMAGE_LENS_REGION_INSPECTION_OBSERVATION_SCHEMA,
  IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA,
  IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA,
  type ImageLensRegionExtractionStatusV1,
  type ImageLensRegionInspectionDetailV1,
  type ImageLensRegionInspectionObservationV1,
  type ImageLensRegionInspectionReceiptV1,
  type ImageLensRegionInspectionRequestV1,
  type ImageLensRegionInspectionResultV1,
} from "@shared/contracts/image-lens-region-inspection.v1";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneResolveTrace,
} from "@shared/helix-capability-lane";
import type { HelixAgentProvider } from "../agent-providers/types";
import { getVisionProvider, getVisionProviderHealth } from "../../vision/provider";
import { resolveHelixCapabilityLaneRequest } from "./registry";

const LANE_ID = "visual_analysis" as const;

const hashHex = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const hashShort = (value: unknown): string => hashHex(value).slice(0, 16);

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const normalizeBbox = (bbox: DocumentImageBboxPxV1): DocumentImageBboxPxV1 => ({
  x: Math.max(0, Math.floor(bbox.x)),
  y: Math.max(0, Math.floor(bbox.y)),
  width: Math.max(1, Math.floor(bbox.width)),
  height: Math.max(1, Math.floor(bbox.height)),
});

const isDegenerateBbox = (bbox: DocumentImageBboxPxV1): boolean =>
  bbox.width <= 1 || bbox.height <= 1;

const nonEmpty = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => value?.trim() ?? "").filter(Boolean)));

const imageHash = (value: unknown): string => `sha256:${hashHex(value)}`;

type ImageLensRegionExtractionResult = {
  extraction_status: ImageLensRegionExtractionStatusV1;
  text_candidate?: string;
  latex_candidate?: string;
  table_candidate_ref?: string;
  uncertainty: string[];
  backend_ref: string | null;
};

const sourceKindFor = (request: ImageLensRegionInspectionRequestV1): DocumentImageSourceKindV1 =>
  request.source_kind ?? (request.page_number ? "pdf_page_render" : "image_lens_source");

const sourceAttachmentIdFor = (request: ImageLensRegionInspectionRequestV1): string =>
  request.source_attachment_id?.trim() || request.source_id.trim();

const cropImageRefFor = (request: ImageLensRegionInspectionRequestV1, bbox: DocumentImageBboxPxV1): string => {
  const supplied = nonEmpty(request.crop_image_ref);
  if (supplied) return supplied;
  const base = nonEmpty(request.source_image_ref) ?? nonEmpty(request.page_image_ref) ?? request.source_id.trim();
  return `${base}#crop=${bbox.x},${bbox.y},${bbox.width},${bbox.height}`;
};

const normalizeExtractionStatus = (
  value: unknown,
  fallback: ImageLensRegionExtractionStatusV1,
): ImageLensRegionExtractionStatusV1 => {
  if (
    value === "extracted" ||
    value === "partial" ||
    value === "failed" ||
    value === "not_run"
  ) {
    return value;
  }
  return fallback;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => readString(entry)).filter((entry): entry is string => Boolean(entry))
    : [];

const bboxKey = (bbox: DocumentImageBboxPxV1): string =>
  `${bbox.x},${bbox.y},${bbox.width},${bbox.height}`;

const readDataUrlImage = (value: unknown): { mime: string; base64: string } | null => {
  const text = readString(value);
  if (!text) return null;
  const withoutFragment = text.split("#")[0] ?? text;
  const match = withoutFragment.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1]?.trim() || "image/png";
  const base64 = (match[2] ?? "").replace(/\s+/g, "");
  return base64 ? { mime, base64 } : null;
};

const readDataUrlImageDimensions = async (
  value: unknown,
): Promise<{ width: number; height: number } | null> => {
  const dataUrl = readDataUrlImage(value);
  if (!dataUrl) return null;
  try {
    const metadata = await sharp(Buffer.from(dataUrl.base64, "base64"), { failOn: "none" }).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    return width > 1 && height > 1 ? { width, height } : null;
  } catch {
    return null;
  }
};

const resolveEffectiveBbox = async (request: ImageLensRegionInspectionRequestV1): Promise<DocumentImageBboxPxV1> => {
  const bbox = normalizeBbox(request.bbox_px);
  if (!isDegenerateBbox(bbox)) return bbox;
  const dimensions =
    await readDataUrlImageDimensions(request.source_image_ref) ??
    await readDataUrlImageDimensions(request.page_image_ref) ??
    await readDataUrlImageDimensions(request.crop_image_ref);
  return dimensions ? { x: 0, y: 0, width: dimensions.width, height: dimensions.height } : bbox;
};

const cropImageBase64 = async (
  sourceBase64: string,
  bbox: DocumentImageBboxPxV1,
): Promise<{ mime: string; base64: string } | null> => {
  const sourceBuffer = Buffer.from(sourceBase64, "base64");
  const source = sharp(sourceBuffer, { failOn: "none" });
  const metadata = await source.metadata();
  const sourceWidth = metadata.width ?? 0;
  const sourceHeight = metadata.height ?? 0;
  if (sourceWidth <= 0 || sourceHeight <= 0) return null;
  const left = clampNumber(bbox.x, 0, Math.max(0, sourceWidth - 1));
  const top = clampNumber(bbox.y, 0, Math.max(0, sourceHeight - 1));
  const width = clampNumber(bbox.width, 1, sourceWidth - left);
  const height = clampNumber(bbox.height, 1, sourceHeight - top);
  const crop = await sharp(sourceBuffer, { failOn: "none" })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
  return { mime: "image/png", base64: crop.toString("base64") };
};

const resolveCropImagePayload = async (input: {
  request: ImageLensRegionInspectionRequestV1;
  bbox: DocumentImageBboxPxV1;
  cropImageRef: string;
}): Promise<{ mime: string; base64: string; source: "crop_image_ref" | "source_image_ref_crop" | "page_image_ref_crop" } | null> => {
  const cropDataUrl = readDataUrlImage(input.request.crop_image_ref);
  if (cropDataUrl) return { ...cropDataUrl, source: "crop_image_ref" };

  const sourceDataUrl =
    readDataUrlImage(input.request.source_image_ref) ??
    readDataUrlImage(input.cropImageRef);
  if (sourceDataUrl) {
    const cropped = await cropImageBase64(sourceDataUrl.base64, input.bbox);
    return cropped ? { ...cropped, source: "source_image_ref_crop" } : null;
  }

  const pageDataUrl = readDataUrlImage(input.request.page_image_ref);
  if (pageDataUrl) {
    const cropped = await cropImageBase64(pageDataUrl.base64, input.bbox);
    return cropped ? { ...cropped, source: "page_image_ref_crop" } : null;
  }
  return null;
};

const buildExtractionPrompt = (request: ImageLensRegionInspectionRequestV1, bbox: DocumentImageBboxPxV1): string => [
  "You are extracting observation-only evidence from one cropped Image Lens region.",
  "Return only JSON with keys: text_candidate, latex_candidate, uncertainty.",
  "Use null when a field is not readable. Use uncertainty as an array of short strings.",
  "For equations or symbolic math, preserve symbols as closely as possible in latex_candidate.",
  "Do not infer content outside the crop. Do not provide a final answer.",
  `bbox_px: ${bbox.x},${bbox.y},${bbox.width},${bbox.height}`,
  request.region_label ? `region_label: ${request.region_label}` : "",
  request.requested_equation_label ? `requested_equation_label: ${request.requested_equation_label}` : "",
  request.question ? `crop_question: ${request.question}` : "",
].filter(Boolean).join("\n");

const parseJsonObjectFromText = (text: string): Record<string, unknown> | null => {
  const trimmed = text.replace(/\u200B/g, "").trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidates = [
    fenced,
    trimmed,
    trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1),
  ].filter((entry): entry is string => Boolean(entry && entry.trim().startsWith("{") && entry.trim().endsWith("}")));
  for (const candidate of candidates) {
    try {
      return readRecord(JSON.parse(candidate));
    } catch {
      // Try the next candidate.
    }
  }
  return null;
};

const decodeJsonStringLiteral = (value: string): string | null => {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value.replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
  }
};

const extractLooseJsonString = (text: string, key: string): string | null => {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "s"));
  return match?.[1] ? decodeJsonStringLiteral(match[1]) : null;
};

const extractLooseLatexCandidate = (text: string): string | null => {
  const fieldMatch = text.match(/"latex_candidate"\s*:\s*([\s\S]*?)(?:,\s*"uncertainty"|\n\s*}|\s*})/);
  const raw = fieldMatch?.[1]?.trim();
  if (!raw) return null;
  const chunks = [...raw.matchAll(/"((?:\\.|[^"\\])*)"/g)]
    .map((match) => decodeJsonStringLiteral(match[1] ?? ""))
    .filter((entry): entry is string => Boolean(entry && entry.trim()));
  if (chunks.length > 0) return chunks.join("");
  return extractLooseJsonString(text, "latex_candidate");
};

const extractLooseUncertainty = (text: string): string[] => {
  const fieldMatch = text.match(/"uncertainty"\s*:\s*\[([\s\S]*?)\]/);
  const raw = fieldMatch?.[1];
  if (!raw) return [];
  return [...raw.matchAll(/"((?:\\.|[^"\\])*)"/g)]
    .map((match) => decodeJsonStringLiteral(match[1] ?? ""))
    .filter((entry): entry is string => Boolean(entry && entry.trim()));
};

const parseLooseExtractionObjectFromText = (text: string): Record<string, unknown> | null => {
  const normalized = text.replace(/\u200B/g, "");
  const objectText = normalized.includes("{") && normalized.includes("}")
    ? normalized.slice(normalized.indexOf("{"), normalized.lastIndexOf("}") + 1)
    : normalized;
  const textCandidate = extractLooseJsonString(objectText, "text_candidate");
  const latexCandidate = extractLooseLatexCandidate(objectText);
  const uncertainty = extractLooseUncertainty(objectText);
  if (!textCandidate && !latexCandidate && uncertainty.length === 0) return null;
  return {
    ...(textCandidate ? { text_candidate: textCandidate } : {}),
    ...(latexCandidate ? { latex_candidate: latexCandidate } : {}),
    uncertainty,
  };
};

const extractionFromVisionText = (
  text: string,
  backendRef: string,
): ImageLensRegionExtractionResult => {
  const parsed = parseJsonObjectFromText(text) ?? parseLooseExtractionObjectFromText(text);
  const textCandidate = readString(parsed?.text_candidate ?? parsed?.textCandidate) ?? undefined;
  const latexCandidate = readString(parsed?.latex_candidate ?? parsed?.latexCandidate) ?? undefined;
  const tableCandidateRef = readString(parsed?.table_candidate_ref ?? parsed?.tableCandidateRef) ?? undefined;
  const uncertainty = readStringArray(parsed?.uncertainty);
  const hasCandidate = Boolean(textCandidate || latexCandidate || tableCandidateRef);
  if (!parsed) {
    return {
      extraction_status: "partial",
      text_candidate: text,
      uncertainty: ["Vision backend returned non-JSON extraction text; treating it as a text_candidate."],
      backend_ref: backendRef,
    };
  }
  return {
    extraction_status: hasCandidate ? (textCandidate && latexCandidate ? "extracted" : "partial") : "failed",
    ...(textCandidate ? { text_candidate: textCandidate } : {}),
    ...(latexCandidate ? { latex_candidate: latexCandidate } : {}),
    ...(tableCandidateRef ? { table_candidate_ref: tableCandidateRef } : {}),
    uncertainty: uncertainty.length ? uncertainty : hasCandidate ? [] : ["Vision backend returned JSON without text_candidate or latex_candidate."],
    backend_ref: backendRef,
  };
};

const readFixtureExtractionEntries = (env: NodeJS.ProcessEnv | undefined): Record<string, unknown>[] => {
  const raw = env?.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
    }
    const record = readRecord(parsed);
    if (!record) return [];
    const entries = Array.isArray(record.entries) ? record.entries : Array.isArray(record.fixtures) ? record.fixtures : [];
    return entries.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
  } catch {
    return [];
  }
};

const fixtureMatchesRequest = (
  fixture: Record<string, unknown>,
  request: ImageLensRegionInspectionRequestV1,
  bbox: DocumentImageBboxPxV1,
  cropImageRef: string,
): boolean => {
  const fixtureRegionLabel = readString(fixture.region_label ?? fixture.regionLabel);
  const fixtureEquationLabel = readString(fixture.requested_equation_label ?? fixture.requestedEquationLabel);
  const fixtureCropRef = readString(fixture.crop_image_ref ?? fixture.cropImageRef);
  const fixtureBbox = readString(fixture.bbox_key ?? fixture.bboxKey);
  const requestRegionLabel = readString(request.region_label);
  const requestEquationLabel = readString(request.requested_equation_label);
  return (
    Boolean(fixtureRegionLabel && requestRegionLabel && fixtureRegionLabel === requestRegionLabel) ||
    Boolean(fixtureEquationLabel && requestEquationLabel && fixtureEquationLabel === requestEquationLabel) ||
    Boolean(fixtureCropRef && fixtureCropRef === cropImageRef) ||
    Boolean(fixtureBbox && fixtureBbox === bboxKey(bbox))
  );
};

const extractionFromFixture = (
  fixture: Record<string, unknown>,
): ImageLensRegionExtractionResult => {
  const textCandidate = readString(fixture.text_candidate ?? fixture.textCandidate) ?? undefined;
  const latexCandidate = readString(fixture.latex_candidate ?? fixture.latexCandidate) ?? undefined;
  const tableCandidateRef = readString(fixture.table_candidate_ref ?? fixture.tableCandidateRef) ?? undefined;
  const hasCandidate = Boolean(textCandidate || latexCandidate || tableCandidateRef);
  return {
    extraction_status: normalizeExtractionStatus(
      fixture.extraction_status ?? fixture.extractionStatus,
      hasCandidate ? (textCandidate && latexCandidate ? "extracted" : "partial") : "failed",
    ),
    ...(textCandidate ? { text_candidate: textCandidate } : {}),
    ...(latexCandidate ? { latex_candidate: latexCandidate } : {}),
    ...(tableCandidateRef ? { table_candidate_ref: tableCandidateRef } : {}),
    uncertainty: readStringArray(fixture.uncertainty),
    backend_ref: readString(fixture.backend_ref ?? fixture.backendRef) ?? "fixture",
  };
};

const shouldRunVisionExtractionBackend = (env: NodeJS.ProcessEnv | undefined): boolean => {
  const mode = (env?.HELIX_IMAGE_LENS_EXTRACTION_BACKEND ?? process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND ?? "").trim().toLowerCase();
  if (mode === "off" || mode === "disabled" || mode === "none" || mode === "fixture") return false;
  if (process.env.NODE_ENV === "test" && !mode) return false;
  const health = getVisionProviderHealth();
  return health.configured && health.can_analyze_inline_image;
};

const resolveImageLensRegionExtraction = async (input: {
  request: ImageLensRegionInspectionRequestV1;
  bbox: DocumentImageBboxPxV1;
  cropImageRef: string;
  env?: NodeJS.ProcessEnv;
}): Promise<ImageLensRegionExtractionResult> => {
  const requestTextCandidate = readString(input.request.text_candidate) ?? undefined;
  const requestLatexCandidate = readString(input.request.latex_candidate) ?? undefined;
  const requestTableCandidateRef = readString(input.request.table_candidate_ref) ?? undefined;
  const requestUncertainty = input.request.uncertainty ?? [];
  const hasRequestCandidate = Boolean(requestTextCandidate || requestLatexCandidate || requestTableCandidateRef);
  if (hasRequestCandidate || input.request.extraction_status) {
    return {
      extraction_status: normalizeExtractionStatus(
        input.request.extraction_status,
        hasRequestCandidate
          ? (requestTextCandidate && requestLatexCandidate ? "extracted" : "partial")
          : "failed",
      ),
      ...(requestTextCandidate ? { text_candidate: requestTextCandidate } : {}),
      ...(requestLatexCandidate ? { latex_candidate: requestLatexCandidate } : {}),
      ...(requestTableCandidateRef ? { table_candidate_ref: requestTableCandidateRef } : {}),
      uncertainty: requestUncertainty,
      backend_ref: "runtime_supplied_candidate",
    };
  }

  const fixture = readFixtureExtractionEntries(input.env)
    .find((entry) => fixtureMatchesRequest(entry, input.request, input.bbox, input.cropImageRef));
  if (fixture) {
    return extractionFromFixture(fixture);
  }

  if (shouldRunVisionExtractionBackend(input.env)) {
    try {
      const imagePayload = await resolveCropImagePayload(input);
      if (!imagePayload) {
        return {
          extraction_status: "failed",
          uncertainty: [
            "Image Lens OCR/math extraction backend was configured, but no inline crop or source image data was available.",
          ],
          backend_ref: "vision_provider",
        };
      }
      const provider = getVisionProvider();
      const response = await provider.describeImage(
        imagePayload.base64,
        imagePayload.mime,
        buildExtractionPrompt(input.request, input.bbox),
      );
      if (response?.trim()) {
        return extractionFromVisionText(response, `vision_provider:${imagePayload.source}`);
      }
      const health = getVisionProviderHealth();
      return {
        extraction_status: "failed",
        uncertainty: [health.last_error || "Vision backend returned no OCR/math extraction payload for this crop."],
        backend_ref: "vision_provider",
      };
    } catch (error) {
      return {
        extraction_status: "failed",
        uncertainty: [
          error instanceof Error
            ? `Vision extraction backend failed: ${error.message}`
            : "Vision extraction backend failed.",
        ],
        backend_ref: "vision_provider",
      };
    }
  }

  return {
    extraction_status: "failed",
    uncertainty: [
      "No Image Lens OCR/math extraction backend returned text_candidate or latex_candidate for this crop.",
    ],
    backend_ref: null,
  };
};

const buildDocumentRegionReceipt = (input: {
  request: ImageLensRegionInspectionRequestV1;
  bbox: DocumentImageBboxPxV1;
  cropImageRef: string;
  regionId: string;
  generatedAt: string;
  summary: string;
  extraction: ImageLensRegionExtractionResult;
}): DocumentImageRegionReceiptV1 => {
  const sourceAttachmentId = sourceAttachmentIdFor(input.request);
  const sourceKind = sourceKindFor(input.request);
  const sourceImageRef =
    nonEmpty(input.request.source_image_ref) ??
    nonEmpty(input.request.page_image_ref) ??
    input.request.source_id.trim();
  const confidence = clampNumber(input.request.confidence ?? 0.55, 0, 1);
  return {
    contractVersion: DOCUMENT_IMAGE_REGION_RECEIPT_VERSION,
    generatedAt: input.generatedAt,
    sourceAttachmentId,
    sourceKind,
    ...(input.request.page_number && input.request.page_image_ref
      ? {
          pageRef: {
            pageNumber: input.request.page_number,
            pageImageRef: input.request.page_image_ref,
          },
        }
      : {}),
    crop: {
      regionId: input.regionId,
      bboxPx: input.bbox,
      imageRef: input.cropImageRef,
      imageHash: imageHash({ cropImageRef: input.cropImageRef, bbox: input.bbox, sourceImageRef }),
    },
    visualSource: {
      sourceId: input.request.source_id.trim(),
      frameId: input.request.frame_id?.trim() || `visual_frame:${input.regionId}`,
      observerProfileId: "stage_play_visual_observer_profile:image-lens-region:v1",
      shadePromptId: "image_lens_region_inspection",
    },
    classification: {
      kind: input.request.region_kind ?? "unknown",
      confidence,
      summary: input.summary,
    },
    extraction: {
      ...(input.extraction.text_candidate ? { textCandidate: input.extraction.text_candidate } : {}),
      ...(input.extraction.latex_candidate ? { latexCandidate: input.extraction.latex_candidate } : {}),
      ...(input.extraction.table_candidate_ref ? { tableCandidateRef: input.extraction.table_candidate_ref } : {}),
      status:
        input.extraction.extraction_status === "failed" ||
        input.extraction.extraction_status === "not_run"
          ? "rejected"
          : "candidate",
    },
    locatorAnchor: {
      pageNumber: input.request.page_number ?? null,
      bboxPx: input.bbox,
      ...(input.extraction.text_candidate ? { ocrHash: imageHash(input.extraction.text_candidate) } : {}),
      anchorConfidence: confidence,
    },
    claimBoundary: {
      ocrCandidateOnly: true,
      notProofAuthority: true,
    },
  };
};

const buildReceipt = (input: {
  request: ImageLensRegionInspectionRequestV1;
  bbox: DocumentImageBboxPxV1;
  cropImageRef: string;
  regionId: string;
  evidenceId: string;
  generatedAt: string;
  extraction: ImageLensRegionExtractionResult;
}): ImageLensRegionInspectionReceiptV1 => {
  const summary =
    input.request.summary?.trim() ||
    `Image Lens region inspection crop prepared at ${input.bbox.x},${input.bbox.y},${input.bbox.width},${input.bbox.height}.`;
  const sourceKind = sourceKindFor(input.request);
  const sourceImageRef = nonEmpty(input.request.source_image_ref);
  const pageImageRef = nonEmpty(input.request.page_image_ref);
  const documentRegionReceipt = buildDocumentRegionReceipt({
    request: input.request,
    bbox: input.bbox,
    cropImageRef: input.cropImageRef,
    regionId: input.regionId,
    generatedAt: input.generatedAt,
    summary,
    extraction: input.extraction,
  });
  const sourceRefs = uniqueStrings([
    input.request.source_id,
    input.request.frame_id,
    input.request.source_attachment_id,
    input.request.page_image_ref,
    input.request.parent_region_id,
    documentRegionReceipt.visualSource.frameId,
  ]);
  const scientificEvidencePacket = buildScientificEvidencePacket({
    cropRegionId: input.regionId,
    sourceRefHash: imageHash({ cropImageRef: input.cropImageRef, bbox: input.bbox }),
    sourceKind,
    pageNumber: input.request.page_number ?? null,
    bboxPx: input.bbox,
    textCandidate: input.extraction.text_candidate ?? null,
    latexCandidate: input.extraction.latex_candidate ?? null,
    uncertainty: input.extraction.uncertainty,
    extractionStatus: input.extraction.extraction_status,
    requestedEquationLabel: input.request.requested_equation_label ?? null,
    regionLabel: input.request.region_label ?? null,
  });
  const scientificEvidenceSidecar = buildScientificImageEvidenceSidecar({
    sidecarId: `${input.evidenceId}:scientific_image_sidecar`,
    sourceRefHash: scientificEvidencePacket.source_ref_hash,
    packets: [scientificEvidencePacket],
  });
  return {
    schema: IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA,
    capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
    region_id: input.regionId,
    crop_image_ref: input.cropImageRef,
    source_kind: sourceKind,
    source_image_ref: sourceImageRef,
    page_number: input.request.page_number ?? null,
    page_image_ref: pageImageRef,
    bbox_px: input.bbox,
    source_refs: sourceRefs,
    summary,
    ...(input.extraction.text_candidate ? { text_candidate: input.extraction.text_candidate } : {}),
    ...(input.extraction.latex_candidate ? { latex_candidate: input.extraction.latex_candidate } : {}),
    extraction_status: input.extraction.extraction_status,
    ...(input.extraction.table_candidate_ref ? { table_candidate_ref: input.extraction.table_candidate_ref } : {}),
    uncertainty: scientificEvidencePacket.uncertainty,
    evidence_id: input.evidenceId,
    requested_question: input.request.question ?? null,
    reason_for_crop: input.request.reason_for_crop ?? null,
    ...(input.request.region_label ? { region_label: input.request.region_label } : {}),
    ...(input.request.requested_equation_label ? { requested_equation_label: input.request.requested_equation_label } : {}),
    observed_equation_labels: scientificEvidencePacket.observed_equation_labels,
    label_match_status: scientificEvidencePacket.label_match_status,
    exact_equation_admissibility: scientificEvidencePacket.exact_equation_admissibility,
    evidence_role: scientificEvidencePacket.evidence_role,
    quality_flags: scientificEvidencePacket.quality_flags,
    quality_rejection_reasons: scientificEvidencePacket.quality_rejection_reasons,
    retry_debug: scientificEvidencePacket.retry_debug,
    parent_region_id: input.request.parent_region_id ?? null,
    detail: input.request.detail ?? "auto",
    document_region_receipt: documentRegionReceipt,
    scientific_evidence_packet: scientificEvidencePacket,
    scientific_evidence_sidecar: scientificEvidenceSidecar,
    claim_boundary: {
      cropObservationOnly: true,
      ocrCandidateOnly: true,
      notProofAuthority: true,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const withExecutionTrace = (input: {
  trace: HelixCapabilityLaneResolveTrace;
  observationRef: string | null;
  receiptRef: string | null;
  status: "executed_observation_only" | "not_executed_shadow_only";
  blockedReason?: string | null;
}): HelixCapabilityLaneResolveTrace => ({
  ...input.trace,
  execution_status: input.status,
  result_ref: input.observationRef,
  observation_ref: input.observationRef,
  receipt_ref: input.receiptRef,
  blocked_reason: input.blockedReason ?? input.trace.blocked_reason,
});

const buildObservationPacket = (input: {
  request: ImageLensRegionInspectionRequestV1;
  turnId: string;
  iteration: number;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observationRef: string;
  receipt: ImageLensRegionInspectionReceiptV1 | null;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  missingRequirements?: HelixAgentStepObservationPacket["missing_requirements"];
}): HelixAgentStepObservationPacket => ({
  schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  turn_id: input.turnId,
  iteration: input.iteration,
  call_id: `${input.turnId}:capability_lane:${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}:call`,
  decision_id: `${input.turnId}:capability_lane:${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}:decision`,
  capability_key: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
  panel_id: "image_lens",
  action: "inspect_image_region",
  status: input.status,
  produced_artifact_refs: input.receipt
    ? [
        input.observationRef,
        input.receipt.evidence_id,
        input.receipt.region_id,
        input.receipt.scientific_evidence_sidecar?.sidecar_id,
      ].filter((value): value is string => Boolean(value))
    : [input.observationRef],
  observation_summary: input.summary,
  receipts: input.receipt
    ? [{
        receipt_ref: input.receipt.evidence_id,
        kind: "image_lens_region_inspection_receipt",
        status: "candidate",
      }]
    : [],
  missing_requirements: input.missingRequirements ?? [],
  backend_selection_decision: input.backendSelectionDecision,
  state_delta: input.receipt
    ? {
        attached_sources: input.receipt.source_refs,
        visual_analysis_region_inspection: {
          lane_id: LANE_ID,
          capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
          source_id: input.request.source_id,
          frame_id: input.request.frame_id ?? null,
          source_attachment_id: sourceAttachmentIdFor(input.request),
          page_number: input.request.page_number ?? null,
          crop_region_id: input.receipt.region_id,
          crop_bbox_px: input.receipt.bbox_px,
          crop_image_ref: input.receipt.crop_image_ref,
          region_label: input.receipt.region_label ?? null,
          requested_equation_label: input.receipt.requested_equation_label ?? null,
          receipt_ref: input.receipt.evidence_id,
          evidence_id: input.receipt.evidence_id,
          text_candidate: input.receipt.text_candidate ?? null,
          latex_candidate: input.receipt.latex_candidate ?? null,
          extraction_status: input.receipt.extraction_status,
          uncertainty: input.receipt.uncertainty,
          observed_equation_labels: input.receipt.observed_equation_labels ?? [],
          label_match_status: input.receipt.label_match_status ?? null,
          exact_equation_admissibility: input.receipt.exact_equation_admissibility ?? null,
          evidence_role: input.receipt.evidence_role ?? null,
          quality_flags: input.receipt.quality_flags ?? [],
          quality_rejection_reasons: input.receipt.quality_rejection_reasons ?? [],
          retry_debug: input.receipt.retry_debug ?? null,
          scientific_evidence_packet: input.receipt.scientific_evidence_packet,
          scientific_evidence_sidecar: input.receipt.scientific_evidence_sidecar,
          receipt: input.receipt,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      }
    : {},
  suggested_next_steps:
    input.status === "succeeded"
      ? ["answer", "use_another_tool"]
      : input.status === "missing_input"
        ? ["ask_user", "repair"]
        : ["repair", "fail_closed"],
  produced_affordances: input.receipt
    ? [
        {
          schema: "helix.workstation_typed_affordance.v1",
          kind: "image_lens_region_evidence",
          role: "producer",
          source_capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
          artifact_ref: input.receipt.evidence_id,
          source_refs: input.receipt.source_refs,
          claim_boundary: "Image Lens crop evidence is observation-only and requires solver re-entry before any answer.",
          status: "available",
          assistant_answer: false,
          raw_content_included: false,
        },
        ...(input.receipt.scientific_evidence_packet
          ? [{
              schema: "helix.workstation_typed_affordance.v1" as const,
              kind: "scientific_evidence" as const,
              role: "producer" as const,
              source_capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
              artifact_ref: input.receipt.scientific_evidence_packet.source_ref_hash,
              source_refs: [input.receipt.evidence_id, input.receipt.scientific_evidence_packet.crop_region_id],
              claim_boundary: "Scientific evidence packet is typed observation only; branch gates must validate it before graph or calculator handoff.",
              status: input.receipt.scientific_evidence_packet.admissibility.status === "inadmissible_for_exact_mapping"
                ? "blocked" as const
                : "available" as const,
              assistant_answer: false as const,
              raw_content_included: false as const,
            }]
          : []),
        ...(input.receipt.scientific_evidence_sidecar
          ? [{
              schema: "helix.workstation_typed_affordance.v1" as const,
              kind: "scientific_evidence" as const,
              role: "producer" as const,
              source_capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
              artifact_ref: input.receipt.scientific_evidence_sidecar.sidecar_id,
              source_refs: [
                input.receipt.evidence_id,
                ...input.receipt.scientific_evidence_sidecar.packet_refs.slice(0, 8),
              ],
              claim_boundary: "Scientific image evidence sidecar is transient observation memory; downstream graph/calculator tools must validate admissibility before use.",
              status: input.receipt.scientific_evidence_sidecar.admissibility.status === "admissible_observation"
                ? "available" as const
                : "blocked" as const,
              assistant_answer: false as const,
              raw_content_included: false as const,
            }]
          : []),
      ]
    : [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
    consumer_capability: null,
    required_affordance_kinds: ["source_ref"],
    produced_affordance_kinds: input.receipt ? ["image_lens_region_evidence", "visual_observer_eval", "scientific_evidence"] : [],
    missing_affordance_kinds: input.receipt ? [] : ["source_ref"],
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const runImageLensRegionInspection = async (input: {
  provider: HelixAgentProvider;
  request: ImageLensRegionInspectionRequestV1;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): Promise<ImageLensRegionInspectionResultV1> => {
  const turnId = input.turnId?.trim() || input.request.turn_id?.trim() || "ask:lane:image_lens";
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.trunc(input.iteration))
    : 0;
  const trace = resolveHelixCapabilityLaneRequest({
    provider: input.provider,
    requestedLane: LANE_ID,
    requestedBackendProvider: input.request.requested_backend_provider ?? null,
    env: input.env,
  });
  const normalizedSourceId = input.request.source_id.trim();
  const bbox = await resolveEffectiveBbox(input.request);

  if (!normalizedSourceId) {
    const observationRef = `${turnId}:capability_lane:${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}:${hashShort({ status: "missing_source_id", bbox })}`;
    const packet = buildObservationPacket({
      request: input.request,
      turnId,
      iteration,
      status: "missing_input",
      summary: "Image Lens region inspection missing source_id.",
      observationRef,
      receipt: null,
      backendSelectionDecision: trace.backend_selection_decision,
      missingRequirements: [{
        code: "missing_source_id",
        message: "visual_analysis.inspect_image_region requires a source_id for the admitted image or Image Lens source.",
        repair_action: "provide_source_id",
      }],
    });
    return {
      schema: IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA,
      ok: false,
      lane_id: LANE_ID,
      capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        receiptRef: null,
        status: "not_executed_shadow_only",
        blockedReason: "missing_source_id",
      }),
      observation: null,
      observation_packet: packet,
      receipt: null,
      artifact_refs: packet.produced_artifact_refs,
      error: "missing_source_id",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (trace.admission_status !== "admitted_shadow_only") {
    const observationRef = `${turnId}:capability_lane:${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}:${hashShort({ status: trace.admission_status, bbox })}`;
    const packet = buildObservationPacket({
      request: input.request,
      turnId,
      iteration,
      status: "blocked",
      summary: `Image Lens region inspection lane blocked: ${trace.blocked_reason ?? "not_admitted"}.`,
      observationRef,
      receipt: null,
      backendSelectionDecision: trace.backend_selection_decision,
    });
    return {
      schema: IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA,
      ok: false,
      lane_id: LANE_ID,
      capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
      selected_runtime_agent_provider: input.provider.id,
      lane_resolve_trace: withExecutionTrace({
        trace,
        observationRef,
        receiptRef: null,
        status: "not_executed_shadow_only",
        blockedReason: trace.blocked_reason,
      }),
      observation: null,
      observation_packet: packet,
      receipt: null,
      artifact_refs: packet.produced_artifact_refs,
      error: trace.blocked_reason ?? "visual_analysis_lane_blocked",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const cropImageRef = cropImageRefFor(input.request, bbox);
  const regionId = `image_lens_region:${hashShort({
    sourceId: normalizedSourceId,
    frameId: input.request.frame_id ?? null,
    bbox,
    cropImageRef,
  })}`;
  const evidenceId = `${turnId}:image_lens_region_inspection:${hashShort({ regionId, cropImageRef })}`;
  const generatedAt = new Date().toISOString();
  const normalizedRequest = { ...input.request, source_id: normalizedSourceId };
  const extraction = await resolveImageLensRegionExtraction({
    request: normalizedRequest,
    bbox,
    cropImageRef,
    env: input.env,
  });
  const receipt = buildReceipt({
    request: normalizedRequest,
    bbox,
    cropImageRef,
    regionId,
    evidenceId,
    generatedAt,
    extraction,
  });
  const observationRef = `${turnId}:capability_lane:${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}:${hashShort(receipt)}`;
  const observation: ImageLensRegionInspectionObservationV1 = {
    schema: IMAGE_LENS_REGION_INSPECTION_OBSERVATION_SCHEMA,
    observation_id: `${turnId}:image_lens_region:observation`,
    observation_ref: observationRef,
    lane_id: LANE_ID,
    capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
    selected_runtime_agent_provider: input.provider.id,
    requested_backend_provider: trace.requested_backend_provider,
    selected_backend_provider: trace.selected_backend_provider,
    selection_reason: trace.selection_reason,
    backend_selection_decision: trace.backend_selection_decision,
    source_id: normalizedSourceId,
    frame_id: input.request.frame_id ?? null,
    source_attachment_id: sourceAttachmentIdFor(input.request),
    page_number: input.request.page_number ?? null,
    bbox_px: bbox,
    crop_region_id: regionId,
    crop_image_ref: cropImageRef,
    receipt_ref: evidenceId,
    evidence_id: evidenceId,
    summary: receipt.summary,
    ...(receipt.text_candidate ? { text_candidate: receipt.text_candidate } : {}),
    ...(receipt.latex_candidate ? { latex_candidate: receipt.latex_candidate } : {}),
    extraction_status: receipt.extraction_status,
    uncertainty: receipt.uncertainty,
    observed_equation_labels: receipt.observed_equation_labels,
    label_match_status: receipt.label_match_status,
    exact_equation_admissibility: receipt.exact_equation_admissibility,
    evidence_role: receipt.evidence_role,
    quality_flags: receipt.quality_flags,
    quality_rejection_reasons: receipt.quality_rejection_reasons,
    retry_debug: receipt.retry_debug,
    scientific_evidence_packet: receipt.scientific_evidence_packet,
    scientific_evidence_sidecar: receipt.scientific_evidence_sidecar,
    deterministic: true,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const packet = buildObservationPacket({
    request: normalizedRequest,
    turnId,
    iteration,
    status: "succeeded",
    summary: `Image Lens crop observation ready: ${bbox.x},${bbox.y},${bbox.width},${bbox.height}; extraction_status=${receipt.extraction_status}.`,
    observationRef,
    receipt,
    backendSelectionDecision: trace.backend_selection_decision,
  });

  return {
    schema: IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA,
    ok: true,
    lane_id: LANE_ID,
    capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
    selected_runtime_agent_provider: input.provider.id,
    lane_resolve_trace: withExecutionTrace({
      trace,
      observationRef,
      receiptRef: evidenceId,
      status: "executed_observation_only",
    }),
    observation,
    observation_packet: packet,
    receipt,
    artifact_refs: packet.produced_artifact_refs,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
