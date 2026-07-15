import type {
  DocumentImageBboxPxV1,
  DocumentImageRegionKindV1,
  DocumentImageRegionReceiptV1,
  DocumentImageSourceKindV1,
} from "./document-image-region-receipt.v1";
import {
  DOCUMENT_IMAGE_REGION_KIND_VALUES,
  DOCUMENT_IMAGE_SOURCE_KIND_VALUES,
  validateDocumentImageRegionReceiptV1,
} from "./document-image-region-receipt.v1";
import type { HelixAgentRuntimeId } from "../helix-agent-runtime";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneId,
  HelixCapabilityLaneResolveTrace,
} from "../helix-capability-lane";
import type { HelixAgentStepObservationPacket } from "../helix-agent-step-observation-packet";
import type {
  ScientificEvidencePacketV1,
  ScientificImageEvidenceSidecarV1,
} from "../scientific-evidence-adaptor";

export const IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA =
  "image_lens_region_inspection_request/v1" as const;
export const IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA =
  "image_lens_region_inspection_receipt/v1" as const;
export const IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA =
  "helix.image_lens_region_inspection_result.v1" as const;
export const IMAGE_LENS_REGION_INSPECTION_OBSERVATION_SCHEMA =
  "helix.image_lens_region_inspection_observation.v1" as const;

export const IMAGE_LENS_REGION_INSPECTION_CAPABILITY =
  "visual_analysis.inspect_image_region" as const;

export const IMAGE_LENS_REGION_INSPECTION_DETAIL_VALUES = [
  "low",
  "high",
  "original",
  "auto",
] as const;

export type ImageLensRegionInspectionDetailV1 =
  (typeof IMAGE_LENS_REGION_INSPECTION_DETAIL_VALUES)[number];

export const IMAGE_LENS_REGION_EXTRACTION_STATUS_VALUES = [
  "extracted",
  "partial",
  "failed",
  "not_run",
] as const;

export type ImageLensRegionExtractionStatusV1 =
  (typeof IMAGE_LENS_REGION_EXTRACTION_STATUS_VALUES)[number];

export const IMAGE_LENS_VISUAL_ALIGNMENT_VALUES = [
  "left",
  "center",
  "right",
  "aligned_at_relation",
  "mixed",
  "unknown",
] as const;

export const IMAGE_LENS_VISUAL_STRUCTURE_VALUES = [
  "single_line",
  "multi_line",
  "aligned_block",
  "cases",
  "matrix",
  "unknown",
] as const;

export type ImageLensVisualLayoutCandidateV1 = {
  displayed_line_count: number | null;
  displayed_lines: string[];
  horizontal_alignment: (typeof IMAGE_LENS_VISUAL_ALIGNMENT_VALUES)[number];
  structure: (typeof IMAGE_LENS_VISUAL_STRUCTURE_VALUES)[number];
  equation_bbox_px: DocumentImageBboxPxV1 | null;
  notes: string[];
};

export type ImageLensRegionInspectionRequestV1 = {
  schema: typeof IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA;
  capability: typeof IMAGE_LENS_REGION_INSPECTION_CAPABILITY;
  source_id: string;
  frame_id?: string | null;
  source_attachment_id?: string | null;
  source_kind?: DocumentImageSourceKindV1 | null;
  source_image_ref?: string | null;
  page_number?: number | null;
  page_count?: number | null;
  page_image_ref?: string | null;
  scholarly_source_pdf_ref?: string | null;
  scholarly_pdf_cache_path?: string | null;
  source_dimensions_px?: { width: number; height: number } | null;
  /** Mount the rendered source in Image Lens without running OCR or visual analysis. */
  source_mount_only?: boolean;
  bbox_px: DocumentImageBboxPxV1;
  crop_ref?: string | null;
  current_crop_ref?: string | null;
  crop_image_ref?: string | null;
  question?: string | null;
  reason_for_crop?: string | null;
  region_label?: string | null;
  requested_equation_label?: string | null;
  equation_capture_mode?: "context" | "exact_row" | "exact_block" | null;
  parent_region_id?: string | null;
  detail?: ImageLensRegionInspectionDetailV1 | null;
  region_kind?: DocumentImageRegionKindV1 | null;
  confidence?: number | null;
  summary?: string | null;
  text_candidate?: string | null;
  latex_candidate?: string | null;
  visual_layout_candidate?: ImageLensVisualLayoutCandidateV1 | null;
  extraction_status?: ImageLensRegionExtractionStatusV1 | null;
  table_candidate_ref?: string | null;
  uncertainty?: string[];
  requested_backend_provider?: string | null;
  turn_id?: string | null;
  thread_id?: string | null;
  assistant_answer: false;
  terminal_eligible: false;
};

export type ImageLensRegionInspectionReceiptV1 = {
  schema: typeof IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA;
  capability: typeof IMAGE_LENS_REGION_INSPECTION_CAPABILITY;
  region_id: string;
  crop_image_ref: string;
  source_kind: DocumentImageSourceKindV1;
  source_image_ref: string | null;
  page_number: number | null;
  page_count?: number | null;
  page_image_ref: string | null;
  scholarly_source_pdf_ref?: string | null;
  scholarly_pdf_cache_path?: string | null;
  source_dimensions_px?: { width: number; height: number } | null;
  source_mount_only?: boolean;
  bbox_px: DocumentImageBboxPxV1;
  crop_ref?: string | null;
  source_refs: string[];
  summary: string;
  text_candidate?: string;
  latex_candidate?: string;
  visual_layout_candidate?: ImageLensVisualLayoutCandidateV1;
  extraction_status: ImageLensRegionExtractionStatusV1;
  table_candidate_ref?: string;
  uncertainty: string[];
  evidence_id: string;
  requested_question: string | null;
  reason_for_crop: string | null;
  region_label?: string | null;
  requested_equation_label?: string | null;
  equation_capture_mode?: ScientificEvidencePacketV1["equation_capture_mode"];
  observed_equation_labels?: string[];
  label_match_status?: ScientificEvidencePacketV1["label_match_status"];
  exact_equation_admissibility?: ScientificEvidencePacketV1["exact_equation_admissibility"];
  row_quality_diagnostics?: ScientificEvidencePacketV1["row_quality_diagnostics"];
  exact_row_promotion?: ScientificEvidencePacketV1["exact_row_promotion"];
  exact_block_promotion?: ScientificEvidencePacketV1["exact_block_promotion"];
  evidence_role?: ScientificEvidencePacketV1["evidence_role"];
  quality_flags?: string[];
  quality_rejection_reasons?: string[];
  retry_debug?: ScientificEvidencePacketV1["retry_debug"];
  parent_region_id: string | null;
  detail: ImageLensRegionInspectionDetailV1;
  document_region_receipt: DocumentImageRegionReceiptV1;
  scientific_evidence_packet?: ScientificEvidencePacketV1;
  scientific_evidence_sidecar?: ScientificImageEvidenceSidecarV1;
  claim_boundary: {
    cropObservationOnly: true;
    ocrCandidateOnly: true;
    notProofAuthority: true;
  };
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type ImageLensRegionInspectionObservationV1 = {
  schema: typeof IMAGE_LENS_REGION_INSPECTION_OBSERVATION_SCHEMA;
  observation_id: string;
  observation_ref: string;
  lane_id: "visual_analysis";
  capability: typeof IMAGE_LENS_REGION_INSPECTION_CAPABILITY;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  requested_backend_provider: string | null;
  selected_backend_provider: string | null;
  selection_reason: string | null;
  backend_selection_decision: HelixCapabilityLaneBackendSelectionDecision;
  source_id: string;
  frame_id: string | null;
  source_attachment_id: string;
  page_number: number | null;
  bbox_px: DocumentImageBboxPxV1;
  crop_region_id: string;
  crop_image_ref: string;
  receipt_ref: string;
  evidence_id: string;
  summary: string;
  text_candidate?: string;
  latex_candidate?: string;
  visual_layout_candidate?: ImageLensVisualLayoutCandidateV1;
  extraction_status: ImageLensRegionExtractionStatusV1;
  uncertainty: string[];
  observed_equation_labels?: string[];
  label_match_status?: ScientificEvidencePacketV1["label_match_status"];
  exact_equation_admissibility?: ScientificEvidencePacketV1["exact_equation_admissibility"];
  row_quality_diagnostics?: ScientificEvidencePacketV1["row_quality_diagnostics"];
  exact_row_promotion?: ScientificEvidencePacketV1["exact_row_promotion"];
  exact_block_promotion?: ScientificEvidencePacketV1["exact_block_promotion"];
  equation_capture_mode?: ScientificEvidencePacketV1["equation_capture_mode"];
  evidence_role?: ScientificEvidencePacketV1["evidence_role"];
  quality_flags?: string[];
  quality_rejection_reasons?: string[];
  retry_debug?: ScientificEvidencePacketV1["retry_debug"];
  scientific_evidence_packet?: ScientificEvidencePacketV1;
  scientific_evidence_sidecar?: ScientificImageEvidenceSidecarV1;
  deterministic: true;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

export type ImageLensRegionInspectionResultV1 = {
  schema: typeof IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA;
  ok: boolean;
  lane_id: HelixCapabilityLaneId;
  capability: typeof IMAGE_LENS_REGION_INSPECTION_CAPABILITY;
  selected_runtime_agent_provider: HelixAgentRuntimeId;
  lane_resolve_trace: HelixCapabilityLaneResolveTrace;
  observation: ImageLensRegionInspectionObservationV1 | null;
  observation_packet: HelixAgentStepObservationPacket;
  receipt: ImageLensRegionInspectionReceiptV1 | null;
  artifact_refs: string[];
  error?: string;
  reentry_required: true;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateBbox(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  for (const key of ["x", "y", "width", "height"] as const) {
    if (!isFiniteNumber(value[key])) issues.push(`${path}.${key} must be a finite number`);
  }
  if (isFiniteNumber(value.width) && value.width <= 0) issues.push(`${path}.width must be positive`);
  if (isFiniteNumber(value.height) && value.height <= 0) issues.push(`${path}.height must be positive`);
}

function validateStringArray(path: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string") issues.push(`${path}[${index}] must be a string`);
  });
}

function validateVisualLayoutCandidate(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  if (value.displayed_line_count !== null && (!isFiniteNumber(value.displayed_line_count) || value.displayed_line_count < 0)) {
    issues.push(`${path}.displayed_line_count must be a non-negative number or null`);
  }
  validateStringArray(`${path}.displayed_lines`, value.displayed_lines, issues);
  if (!includes(IMAGE_LENS_VISUAL_ALIGNMENT_VALUES, value.horizontal_alignment)) {
    issues.push(`${path}.horizontal_alignment must be one of ${IMAGE_LENS_VISUAL_ALIGNMENT_VALUES.join(", ")}`);
  }
  if (!includes(IMAGE_LENS_VISUAL_STRUCTURE_VALUES, value.structure)) {
    issues.push(`${path}.structure must be one of ${IMAGE_LENS_VISUAL_STRUCTURE_VALUES.join(", ")}`);
  }
  if (value.equation_bbox_px !== null) validateBbox(`${path}.equation_bbox_px`, value.equation_bbox_px, issues);
  validateStringArray(`${path}.notes`, value.notes, issues);
}

export function validateImageLensRegionInspectionRequestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["request must be an object"];
  if (value.schema !== IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA) {
    issues.push(`schema must be ${IMAGE_LENS_REGION_INSPECTION_REQUEST_SCHEMA}`);
  }
  if (value.capability !== IMAGE_LENS_REGION_INSPECTION_CAPABILITY) {
    issues.push(`capability must be ${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}`);
  }
  if (!isNonEmptyString(value.source_id)) issues.push("source_id must be a non-empty string");
  validateBbox("bbox_px", value.bbox_px, issues);
  if (value.source_kind !== undefined && value.source_kind !== null && !includes(DOCUMENT_IMAGE_SOURCE_KIND_VALUES, value.source_kind)) {
    issues.push(`source_kind must be one of ${DOCUMENT_IMAGE_SOURCE_KIND_VALUES.join(", ")}`);
  }
  if (value.region_kind !== undefined && value.region_kind !== null && !includes(DOCUMENT_IMAGE_REGION_KIND_VALUES, value.region_kind)) {
    issues.push(`region_kind must be one of ${DOCUMENT_IMAGE_REGION_KIND_VALUES.join(", ")}`);
  }
  if (value.detail !== undefined && value.detail !== null && !includes(IMAGE_LENS_REGION_INSPECTION_DETAIL_VALUES, value.detail)) {
    issues.push(`detail must be one of ${IMAGE_LENS_REGION_INSPECTION_DETAIL_VALUES.join(", ")}`);
  }
  if (value.extraction_status !== undefined && value.extraction_status !== null && !includes(IMAGE_LENS_REGION_EXTRACTION_STATUS_VALUES, value.extraction_status)) {
    issues.push(`extraction_status must be one of ${IMAGE_LENS_REGION_EXTRACTION_STATUS_VALUES.join(", ")}`);
  }
  if (value.page_number !== undefined && value.page_number !== null) {
    if (!isFiniteNumber(value.page_number) || value.page_number < 1) {
      issues.push("page_number must be a positive number when present");
    }
  }
  if (value.confidence !== undefined && value.confidence !== null) {
    if (!isFiniteNumber(value.confidence) || value.confidence < 0 || value.confidence > 1) {
      issues.push("confidence must be a number from 0 to 1 when present");
    }
  }
  if (value.uncertainty !== undefined) validateStringArray("uncertainty", value.uncertainty, issues);
  if (value.visual_layout_candidate !== undefined && value.visual_layout_candidate !== null) {
    validateVisualLayoutCandidate("visual_layout_candidate", value.visual_layout_candidate, issues);
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  return issues;
}

export function validateImageLensRegionInspectionReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["receipt must be an object"];
  if (value.schema !== IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA) {
    issues.push(`schema must be ${IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA}`);
  }
  if (value.capability !== IMAGE_LENS_REGION_INSPECTION_CAPABILITY) {
    issues.push(`capability must be ${IMAGE_LENS_REGION_INSPECTION_CAPABILITY}`);
  }
  if (!isNonEmptyString(value.region_id)) issues.push("region_id must be a non-empty string");
  if (!isNonEmptyString(value.crop_image_ref)) issues.push("crop_image_ref must be a non-empty string");
  if (!includes(DOCUMENT_IMAGE_SOURCE_KIND_VALUES, value.source_kind)) {
    issues.push(`source_kind must be one of ${DOCUMENT_IMAGE_SOURCE_KIND_VALUES.join(", ")}`);
  }
  for (const key of ["source_image_ref", "page_image_ref"] as const) {
    if (value[key] !== null && value[key] !== undefined && !isNonEmptyString(value[key])) {
      issues.push(`${key} must be a non-empty string or null`);
    }
  }
  if (value.page_number !== null && value.page_number !== undefined) {
    if (!isFiniteNumber(value.page_number) || value.page_number < 1) {
      issues.push("page_number must be a positive number or null");
    }
  }
  validateBbox("bbox_px", value.bbox_px, issues);
  validateStringArray("source_refs", value.source_refs, issues);
  if (!isNonEmptyString(value.summary)) issues.push("summary must be a non-empty string");
  if (!includes(IMAGE_LENS_REGION_EXTRACTION_STATUS_VALUES, value.extraction_status)) {
    issues.push(`extraction_status must be one of ${IMAGE_LENS_REGION_EXTRACTION_STATUS_VALUES.join(", ")}`);
  }
  validateStringArray("uncertainty", value.uncertainty, issues);
  if (value.visual_layout_candidate !== undefined) {
    validateVisualLayoutCandidate("visual_layout_candidate", value.visual_layout_candidate, issues);
  }
  if (!isNonEmptyString(value.evidence_id)) issues.push("evidence_id must be a non-empty string");
  if (value.detail !== undefined && !includes(IMAGE_LENS_REGION_INSPECTION_DETAIL_VALUES, value.detail)) {
    issues.push(`detail must be one of ${IMAGE_LENS_REGION_INSPECTION_DETAIL_VALUES.join(", ")}`);
  }
  if (value.document_region_receipt !== undefined) {
    issues.push(...validateDocumentImageRegionReceiptV1(value.document_region_receipt).map((issue) => `document_region_receipt.${issue}`));
  } else {
    issues.push("document_region_receipt must be present");
  }
  if (!isRecord(value.claim_boundary)) {
    issues.push("claim_boundary must be an object");
  } else {
    if (value.claim_boundary.cropObservationOnly !== true) issues.push("claim_boundary.cropObservationOnly must be true");
    if (value.claim_boundary.ocrCandidateOnly !== true) issues.push("claim_boundary.ocrCandidateOnly must be true");
    if (value.claim_boundary.notProofAuthority !== true) issues.push("claim_boundary.notProofAuthority must be true");
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  return issues;
}

export function isImageLensRegionInspectionReceiptV1(value: unknown): value is ImageLensRegionInspectionReceiptV1 {
  return validateImageLensRegionInspectionReceiptV1(value).length === 0;
}
