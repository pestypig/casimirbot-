import crypto from "node:crypto";
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
  IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
  IMAGE_LENS_REGION_INSPECTION_OBSERVATION_SCHEMA,
  IMAGE_LENS_REGION_INSPECTION_RECEIPT_SCHEMA,
  IMAGE_LENS_REGION_INSPECTION_RESULT_SCHEMA,
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

const nonEmpty = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => value?.trim() ?? "").filter(Boolean)));

const imageHash = (value: unknown): string => `sha256:${hashHex(value)}`;

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

const buildDocumentRegionReceipt = (input: {
  request: ImageLensRegionInspectionRequestV1;
  bbox: DocumentImageBboxPxV1;
  cropImageRef: string;
  regionId: string;
  generatedAt: string;
  summary: string;
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
      ...(input.request.text_candidate ? { textCandidate: input.request.text_candidate } : {}),
      ...(input.request.latex_candidate ? { latexCandidate: input.request.latex_candidate } : {}),
      ...(input.request.table_candidate_ref ? { tableCandidateRef: input.request.table_candidate_ref } : {}),
      status: "candidate",
    },
    locatorAnchor: {
      pageNumber: input.request.page_number ?? null,
      bboxPx: input.bbox,
      ...(input.request.text_candidate ? { ocrHash: imageHash(input.request.text_candidate) } : {}),
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
  });
  const sourceRefs = uniqueStrings([
    input.request.source_id,
    input.request.frame_id,
    input.request.source_attachment_id,
    input.request.page_image_ref,
    input.request.parent_region_id,
    documentRegionReceipt.visualSource.frameId,
  ]);
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
    ...(input.request.text_candidate ? { text_candidate: input.request.text_candidate } : {}),
    ...(input.request.latex_candidate ? { latex_candidate: input.request.latex_candidate } : {}),
    ...(input.request.table_candidate_ref ? { table_candidate_ref: input.request.table_candidate_ref } : {}),
    uncertainty: input.request.uncertainty ?? [],
    evidence_id: input.evidenceId,
    requested_question: input.request.question ?? null,
    reason_for_crop: input.request.reason_for_crop ?? null,
    parent_region_id: input.request.parent_region_id ?? null,
    detail: input.request.detail ?? "auto",
    document_region_receipt: documentRegionReceipt,
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
    ? [input.observationRef, input.receipt.evidence_id, input.receipt.region_id]
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
          receipt_ref: input.receipt.evidence_id,
          evidence_id: input.receipt.evidence_id,
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
    ? [{
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
      }]
    : [],
  consumed_affordances: [],
  typed_handoff_contract: {
    schema: "helix.workstation_typed_handoff_contract.v1",
    producer_capability: IMAGE_LENS_REGION_INSPECTION_CAPABILITY,
    consumer_capability: null,
    required_affordance_kinds: ["source_ref"],
    produced_affordance_kinds: input.receipt ? ["image_lens_region_evidence", "visual_observer_eval"] : [],
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

export const runImageLensRegionInspection = (input: {
  provider: HelixAgentProvider;
  request: ImageLensRegionInspectionRequestV1;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): ImageLensRegionInspectionResultV1 => {
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
  const bbox = normalizeBbox(input.request.bbox_px);

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
  const receipt = buildReceipt({
    request: { ...input.request, source_id: normalizedSourceId },
    bbox,
    cropImageRef,
    regionId,
    evidenceId,
    generatedAt,
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
    uncertainty: receipt.uncertainty,
    deterministic: true,
    reentry_required: true,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const packet = buildObservationPacket({
    request: { ...input.request, source_id: normalizedSourceId },
    turnId,
    iteration,
    status: "succeeded",
    summary: `Image Lens crop observation ready: ${bbox.x},${bbox.y},${bbox.width},${bbox.height}.`,
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
