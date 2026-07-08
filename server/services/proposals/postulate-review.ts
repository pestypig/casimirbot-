import type { EssenceProposal } from "@shared/proposals";
import {
  extractPostulateEvidenceContextFromText,
  normalizePostulateEvidenceContext,
  type PostulateEvidenceContext,
  type PostulateProposalScore,
} from "./postulate";

export type PostulateReviewDecision = "submit" | "revise" | "block";
export type PostulateCalculatorStatus = "no_template" | "template_admissible" | "calculation_ready" | "solved";

export type PostulateReadinessReview = {
  schema?: string;
  readinessRating: number;
  decision: PostulateReviewDecision;
  reason: string;
  missingDefinitions: string[];
  missingEvidence: string[];
  claimBoundaryWarnings: string[];
  calculatorStatus: PostulateCalculatorStatus;
  boardReadyTitle?: string | null;
  boardReadyDraft?: string | null;
};

export type ParsedAskPostulateReviewRequest = {
  proposalText: string;
  originatingSessionId: string | null;
  originatingAnswerId: string | null;
  evidenceContext: PostulateEvidenceContext;
};

export type PostulateSubmissionGateResult = {
  shouldSubmit: boolean;
  reasons: string[];
  threshold: number;
};

const POSTULATE_COMMAND_RE = /^\/postulate\b/i;
const POSTULATE_PROPOSAL_MARKER_RE = /(?:candidate\s+postulate|final\s+answer\s+proposal)\s*:/i;
export const POSTULATE_RUNTIME_REVIEW_THRESHOLD = 75;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry)).slice(0, 24)
    : [];

const readReviewDecision = (value: unknown): PostulateReviewDecision =>
  value === "submit" || value === "revise" || value === "block" ? value : "block";

const readCalculatorStatus = (value: unknown): PostulateCalculatorStatus =>
  value === "no_template" ||
  value === "template_admissible" ||
  value === "calculation_ready" ||
  value === "solved"
    ? value
    : value === "template_only" || value === "bound_but_unsolved"
      ? "template_admissible"
      : "no_template";

const clampRating = (value: unknown): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const mergeEvidenceContexts = (...contexts: Array<PostulateEvidenceContext | null | undefined>): PostulateEvidenceContext => {
  const normalized = contexts.map((context) => normalizePostulateEvidenceContext(context));
  const merge = (key: keyof Required<PostulateEvidenceContext>): string[] =>
    Array.from(new Set(normalized.flatMap((context) => context[key]))).slice(0, 24);
  return {
    evidenceSidecarRefs: merge("evidenceSidecarRefs"),
    promotedEquationRowRefs: merge("promotedEquationRowRefs"),
    pageRenderRefs: merge("pageRenderRefs"),
    cropRefs: merge("cropRefs"),
    graphReflectionRefs: merge("graphReflectionRefs"),
    provenanceAuditRefs: merge("provenanceAuditRefs"),
    calculatorCheckRefs: merge("calculatorCheckRefs"),
    uncertaintyReductionRefs: merge("uncertaintyReductionRefs"),
  };
};

const pushUniqueRef = (refs: Set<string>, value: unknown): void => {
  const raw = readString(value);
  if (!raw) return;
  refs.add(raw.replace(/[),.;`]+$/g, "").slice(0, 240));
};

const cropRefFromPacket = (packet: Record<string, unknown>): string | null => {
  const cropRegion = packet.crop_region && typeof packet.crop_region === "object" && !Array.isArray(packet.crop_region)
    ? packet.crop_region as Record<string, unknown>
    : null;
  const bbox = packet.bbox_px && typeof packet.bbox_px === "object" && !Array.isArray(packet.bbox_px)
    ? packet.bbox_px as Record<string, unknown>
    : cropRegion?.bbox_px && typeof cropRegion.bbox_px === "object" && !Array.isArray(cropRegion.bbox_px)
      ? cropRegion.bbox_px as Record<string, unknown>
      : null;
  const sourceHash = readString(cropRegion?.source_ref_hash ?? packet.source_ref_hash);
  if (!sourceHash || !bbox) return null;
  const x = Number(bbox.x);
  const y = Number(bbox.y);
  const width = Number(bbox.width);
  const height = Number(bbox.height);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return `${sourceHash}#crop=${x},${y},${width},${height}`;
};

export const extractPostulateEvidenceContextFromRuntimePayload = (payload: unknown): PostulateEvidenceContext => {
  const context = normalizePostulateEvidenceContext();
  const evidenceSidecarRefs = new Set(context.evidenceSidecarRefs);
  const promotedEquationRowRefs = new Set(context.promotedEquationRowRefs);
  const pageRenderRefs = new Set(context.pageRenderRefs);
  const cropRefs = new Set(context.cropRefs);
  const graphReflectionRefs = new Set(context.graphReflectionRefs);
  const provenanceAuditRefs = new Set(context.provenanceAuditRefs);
  const calculatorCheckRefs = new Set(context.calculatorCheckRefs);
  const uncertaintyReductionRefs = new Set(context.uncertaintyReductionRefs);
  const seen = new Set<unknown>();

  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.slice(0, 200).forEach(visit);
      return;
    }
    const record = value as Record<string, unknown>;
    const schema = readString(record.schema);
    const kind = readString(record.kind ?? record.observation_kind ?? record.terminal_artifact_kind);

    if (schema === "helix.scientific_image_evidence_sidecar.v1" || kind === "scientific_image_evidence_sidecar") {
      pushUniqueRef(evidenceSidecarRefs, record.sidecar_id);
      const promotedRef = readString(record.promoted_equation_ref);
      if (promotedRef) promotedEquationRowRefs.add(promotedRef);
      readStringArray(record.packet_refs).forEach((ref) => promotedEquationRowRefs.add(ref));
      readStringArray(record.produced_artifact_refs).forEach((ref) => provenanceAuditRefs.add(ref));
    }

    if (schema === "helix.promoted_scientific_image_evidence.v1") {
      pushUniqueRef(promotedEquationRowRefs, record.packet_ref);
      pushUniqueRef(promotedEquationRowRefs, record.evidence_id);
      pushUniqueRef(cropRefs, record.crop_ref ? `equation_crop:${record.crop_ref}` : null);
      pushUniqueRef(pageRenderRefs, record.source_hash ? `page_render:${record.source_hash}${record.page_number ? `:page:${record.page_number}` : ""}` : null);
      pushUniqueRef(provenanceAuditRefs, record.source_id ? `provenance_audit:${record.source_id}` : null);
      pushUniqueRef(evidenceSidecarRefs, record.sidecar_id);
    }

    if (schema === "helix.scientific_evidence_packet.v1") {
      const cropRegionId = readString(record.crop_region_id);
      const promotion = record.exact_row_promotion && typeof record.exact_row_promotion === "object" && !Array.isArray(record.exact_row_promotion)
        ? record.exact_row_promotion as Record<string, unknown>
        : null;
      if (readString(promotion?.status) === "promoted") {
        pushUniqueRef(promotedEquationRowRefs, cropRegionId ? `promoted_equation_row:${cropRegionId}` : null);
        const cropRef = cropRefFromPacket(record);
        pushUniqueRef(cropRefs, cropRef ? `equation_crop:${cropRef}` : null);
      }
      const sourceImage = record.source_image && typeof record.source_image === "object" && !Array.isArray(record.source_image)
        ? record.source_image as Record<string, unknown>
        : null;
      if (readString(sourceImage?.source_kind) === "pdf_page_render") {
        const pageNumber =
          typeof sourceImage.page_number === "number" && Number.isFinite(sourceImage.page_number)
            ? String(sourceImage.page_number)
            : readString(sourceImage.page_number);
        const sourceHash = readString(sourceImage.ref_hash ?? record.source_ref_hash);
        pushUniqueRef(pageRenderRefs, sourceHash ? `page_render:${sourceHash}${pageNumber ? `:page:${pageNumber}` : ""}` : null);
      }
    }

    if (schema === "helix.scientific_image_evidence_continuation_lookup.v1") {
      pushUniqueRef(evidenceSidecarRefs, record.sidecar_id);
      pushUniqueRef(provenanceAuditRefs, record.selected_lookup_key ? `provenance_audit:${record.selected_lookup_key}` : null);
    }

    if (schema === "helix.scientific_evidence_workflow_status.v1") {
      pushUniqueRef(evidenceSidecarRefs, record.sidecarId ?? record.sidecar_id);
      pushUniqueRef(promotedEquationRowRefs, record.cropRef ? `promoted_equation_row:${record.cropRef}` : null);
      pushUniqueRef(pageRenderRefs, record.sourceId ?? record.source_id);
      pushUniqueRef(
        pageRenderRefs,
        record.sourceImageHash
          ? `page_render:${record.sourceImageHash}${record.pageNumber ? `:page:${record.pageNumber}` : ""}`
          : null,
      );
      pushUniqueRef(cropRefs, record.cropRef ? `equation_crop:${record.cropRef}` : null);
      pushUniqueRef(cropRefs, record.cropRegionRef ?? record.crop_region_ref);
      pushUniqueRef(provenanceAuditRefs, record.sourceImageHash ? `provenance_audit:${record.sourceImageHash}` : null);
      const readyRefs = record.postulateReadyRefs && typeof record.postulateReadyRefs === "object" && !Array.isArray(record.postulateReadyRefs)
        ? record.postulateReadyRefs as Record<string, unknown>
        : null;
      readStringArray(readyRefs?.evidenceSidecarRefs).forEach((ref) => evidenceSidecarRefs.add(ref));
      readStringArray(readyRefs?.promotedEquationRowRefs).forEach((ref) => promotedEquationRowRefs.add(ref));
      readStringArray(readyRefs?.pageRenderRefs).forEach((ref) => pageRenderRefs.add(ref));
      readStringArray(readyRefs?.cropRefs).forEach((ref) => cropRefs.add(ref));
      readStringArray(readyRefs?.graphReflectionRefs).forEach((ref) => graphReflectionRefs.add(ref));
      readStringArray(readyRefs?.provenanceAuditRefs).forEach((ref) => provenanceAuditRefs.add(ref));
      readStringArray(readyRefs?.calculatorCheckRefs).forEach((ref) => calculatorCheckRefs.add(ref));
      readStringArray(readyRefs?.uncertaintyReductionRefs).forEach((ref) => uncertaintyReductionRefs.add(ref));
      const calculatorStatus = readCalculatorStatus(record.calculatorTemplateStatus ?? record.calculator_template_status);
      if (calculatorStatus !== "no_template") {
        pushUniqueRef(calculatorCheckRefs, `calculator_check:template_admissibility:${calculatorStatus}:0`);
      }
    }

    if (schema === "helix.scientific_image_graph_reflection_lookup.v1") {
      pushUniqueRef(graphReflectionRefs, record.selected_reflection_id);
      pushUniqueRef(provenanceAuditRefs, record.selected_lookup_key ? `provenance_audit:${record.selected_lookup_key}` : null);
      pushUniqueRef(uncertaintyReductionRefs, record.selected_gate_state ? `uncertainty_reduction:graph_gate:${record.selected_gate_state}` : null);
    }

    if (schema === "helix.calculator_template_admissibility.v1") {
      const status = readCalculatorStatus(record.status);
      const admitted = Number(record.admitted_template_count ?? record.admitted_count ?? 0);
      pushUniqueRef(calculatorCheckRefs, `calculator_check:template_admissibility:${status}:${Number.isFinite(admitted) ? admitted : 0}`);
    }

    if (schema === "helix.scientific_calculator_receipt.v1" || schema === "helix.calculator_receipt.v1" || kind === "calculator_receipt") {
      const status = readCalculatorStatus(record.status);
      const receiptId = readString(record.receipt_id ?? record.artifact_id);
      pushUniqueRef(
        calculatorCheckRefs,
        receiptId
          ? `calculator_check:receipt:${status}:${receiptId}`
          : `calculator_check:receipt:${status}`,
      );
    }

    if (
      schema === "helix.theory_context_reflection.v1" ||
      schema === "helix.theory_badge_graph_reflection.v1" ||
      schema === "helix.scientific_evidence_graph_reflection.v1" ||
      /theory.*reflection|graph.*reflection/i.test(kind ?? "")
    ) {
      pushUniqueRef(graphReflectionRefs, record.ref ?? record.ref_id ?? record.refId ?? record.id ?? record.reflection_id ?? record.artifact_id);
      pushUniqueRef(promotedEquationRowRefs, record.exact_evidence_ref);
      pushUniqueRef(uncertaintyReductionRefs, record.congruence_delta_ref ?? record.uncertainty_reduction_ref);
    }

    for (const [key, nested] of Object.entries(record)) {
      if (/(sidecar|packet|evidence|artifact|reflection|calculator|debug|payload|result|ledger|state|refs?)/i.test(key)) {
        visit(nested);
      }
      if (/graph.*reflection.*ref/i.test(key)) readStringArray(nested).forEach((ref) => graphReflectionRefs.add(ref));
      if (/calculator.*(?:check|template).*ref/i.test(key)) readStringArray(nested).forEach((ref) => calculatorCheckRefs.add(ref));
    }
  };

  visit(payload);
  return normalizePostulateEvidenceContext({
    evidenceSidecarRefs: Array.from(evidenceSidecarRefs),
    promotedEquationRowRefs: Array.from(promotedEquationRowRefs),
    pageRenderRefs: Array.from(pageRenderRefs),
    cropRefs: Array.from(cropRefs),
    graphReflectionRefs: Array.from(graphReflectionRefs),
    provenanceAuditRefs: Array.from(provenanceAuditRefs),
    calculatorCheckRefs: Array.from(calculatorCheckRefs),
    uncertaintyReductionRefs: Array.from(uncertaintyReductionRefs),
  });
};

const extractJsonRecord = (text: string): Record<string, unknown> | null => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const source = fenced || text;
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    const parsed = JSON.parse(source.slice(first, last + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
};

const extractPromptEvidenceContext = (body: string): PostulateEvidenceContext => {
  const match = body.match(/\bevidence\s+context\s*:\s*([\s\S]*?)(?:\n\s*scientific\s+evidence\s+workflow\s+status\s*:|\n\s*candidate\s+postulate\s*:|\n\s*final\s+answer\s+proposal\s*:|$)/i);
  const raw = match?.[1]?.trim();
  const workflowMatch = body.match(/\bscientific\s+evidence\s+workflow\s+status\s*:\s*([\s\S]*?)(?:\n\s*candidate\s+postulate\s*:|\n\s*final\s+answer\s+proposal\s*:|$)/i);
  const workflowRaw = workflowMatch?.[1]?.trim();
  const workflowContext = (() => {
    if (!workflowRaw) return normalizePostulateEvidenceContext();
    const first = workflowRaw.indexOf("{");
    const last = workflowRaw.lastIndexOf("}");
    if (first < 0 || last <= first) return extractPostulateEvidenceContextFromText(workflowRaw);
    try {
      return extractPostulateEvidenceContextFromRuntimePayload(JSON.parse(workflowRaw.slice(first, last + 1)));
    } catch {
      return extractPostulateEvidenceContextFromText(workflowRaw);
    }
  })();
  if (!raw) return workflowContext;
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) {
    return mergeEvidenceContexts(extractPostulateEvidenceContextFromText(raw), workflowContext);
  }
  try {
    const parsed = JSON.parse(raw.slice(first, last + 1));
    return mergeEvidenceContexts(
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as PostulateEvidenceContext
        : null,
      extractPostulateEvidenceContextFromText(raw),
      workflowContext,
    );
  } catch {
    return mergeEvidenceContexts(extractPostulateEvidenceContextFromText(raw), workflowContext);
  }
};

export const parseAskPostulateReviewRequest = (prompt: string): ParsedAskPostulateReviewRequest | null => {
  const text = typeof prompt === "string" ? prompt.trim() : "";
  if (!POSTULATE_COMMAND_RE.test(text)) return null;
  const body = text.replace(POSTULATE_COMMAND_RE, "").trim();
  const promptEvidenceContext = extractPromptEvidenceContext(body);
  const marker = body.match(POSTULATE_PROPOSAL_MARKER_RE);
  const proposalBlock = marker?.index !== undefined
    ? body.slice(marker.index + marker[0].length).trim()
    : body
      .replace(/^send\s+this\s+postulate\s+to\s+be\s+reviewed\.?:?/i, "")
      .replace(/^review\s+this\s+postulate\s+candidate\.?:?/i, "")
      .trim();
  const originatingSessionId =
    body.match(/originating\s+session\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null;
  const originatingAnswerId =
    body.match(/originating\s+answer\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null;
  const proposalText = proposalBlock
    .replace(/\n+originating\s+session\s*:\s*[^\n]+/gi, "")
    .replace(/\n+originating\s+answer\s*:\s*[^\n]+/gi, "")
    .replace(/\n+return\s+json[\s\S]*$/i, "")
    .trim();
  if (!proposalText) return null;
  return {
    proposalText,
    originatingSessionId,
    originatingAnswerId,
    evidenceContext: mergeEvidenceContexts(
      promptEvidenceContext,
      extractPostulateEvidenceContextFromText(text),
    ),
  };
};

export const parsePostulateReadinessReview = (text: string): PostulateReadinessReview | null => {
  const record = extractJsonRecord(typeof text === "string" ? text : "");
  if (!record) return null;
  const readinessRating = clampRating(
    record.readinessRating ?? record.readiness_rating ?? record.rating,
  );
  const decision = readReviewDecision(record.decision);
  const reason = readString(record.reason) ?? "No review reason provided.";
  return {
    schema: readString(record.schema) ?? undefined,
    readinessRating,
    decision,
    reason,
    missingDefinitions: readStringArray(record.missingDefinitions ?? record.missing_definitions),
    missingEvidence: readStringArray(record.missingEvidence ?? record.missing_evidence),
    claimBoundaryWarnings: readStringArray(record.claimBoundaryWarnings ?? record.claim_boundary_warnings),
    calculatorStatus: readCalculatorStatus(record.calculatorStatus ?? record.calculator_status),
    boardReadyTitle: readString(record.boardReadyTitle ?? record.board_ready_title),
    boardReadyDraft: readString(record.boardReadyDraft ?? record.board_ready_draft),
  };
};

const hasUnsupportedPromotionClaim = (text: string): boolean => {
  const normalized = text.toLowerCase();
  return /\b(?:is|are|was|were|has been|have been|establishes|established as)\s+(?:proven|certified)\b/.test(normalized) ||
    /\bphysical viability (?:is|was|has been) (?:proven|certified|established)\b/.test(normalized) ||
    /\b(?:badge|graph)\s+(?:is|was|has been)\s+(?:promoted|mutated|updated)\b/.test(normalized);
};

export const evaluatePostulateSubmissionGate = (input: {
  review: PostulateReadinessReview | null;
  evidenceContext?: PostulateEvidenceContext | null;
  proposalText?: string | null;
  threshold?: number;
}): PostulateSubmissionGateResult => {
  const threshold = input.threshold ?? POSTULATE_RUNTIME_REVIEW_THRESHOLD;
  const context = normalizePostulateEvidenceContext(input.evidenceContext);
  const reasons: string[] = [];
  const review = input.review;
  if (!review) {
    reasons.push("runtime_review_missing");
  } else {
    if (review.decision !== "submit") reasons.push(`decision_${review.decision}`);
    if (review.readinessRating < threshold) reasons.push(`rating_below_${threshold}`);
    if (!review.boardReadyTitle) reasons.push("board_ready_title_missing");
    if (!review.boardReadyDraft) reasons.push("board_ready_draft_missing");
    if (hasUnsupportedPromotionClaim([review.boardReadyDraft, input.proposalText].filter(Boolean).join(" "))) {
      reasons.push("unsupported_proof_or_graph_promotion_claim");
    }
  }
  if (context.evidenceSidecarRefs.length === 0) reasons.push("scientific_sidecar_ref_missing");
  if (context.promotedEquationRowRefs.length === 0) reasons.push("promoted_equation_row_ref_missing");
  if (context.pageRenderRefs.length === 0) reasons.push("page_render_ref_missing");
  if (context.cropRefs.length === 0) reasons.push("crop_ref_missing");
  if (context.graphReflectionRefs.length === 0) reasons.push("graph_reflection_ref_missing");
  return {
    shouldSubmit: reasons.length === 0,
    reasons,
    threshold,
  };
};

export const buildPostulateReviewFinalText = (input: {
  review: PostulateReadinessReview | null;
  gate: PostulateSubmissionGateResult;
  proposal?: EssenceProposal | null;
  score?: PostulateProposalScore | null;
  receiptId?: string | null;
}): string => {
  const review = input.review;
  const rating = review ? `${Math.round(review.readinessRating)}%` : "unreadable";
  const decision = review?.decision ?? "block";
  const lines = [
    `Postulate review: ${decision} at ${rating}.`,
    review?.reason ? `Reason: ${review.reason}` : "Reason: runtime review was missing or unreadable.",
  ];
  if (input.gate.shouldSubmit && input.proposal && input.receiptId) {
    lines.push(`Submitted: yes. Receipt: ${input.receiptId}.`);
    lines.push(input.proposal.status === "queued_for_graph_review"
      ? "Board: queued for developer graph-patch review; the theory badge graph was not auto-mutated."
      : "Board: accepted for structured review.");
  } else {
    lines.push("Submitted: no.");
    lines.push(`Missing requirements: ${input.gate.reasons.join(", ") || "none"}.`);
    const continuationActions = buildPostulateRevisionContinuationActions({
      review,
      gate: input.gate,
    });
    if (continuationActions.length > 0) {
      lines.push(`Next evidence actions: ${continuationActions.join("; ")}.`);
    }
  }
  if (review?.missingDefinitions.length) {
    lines.push(`Missing definitions: ${review.missingDefinitions.join("; ")}.`);
  }
  if (review?.missingEvidence.length) {
    lines.push(`Missing evidence: ${review.missingEvidence.join("; ")}.`);
  }
  if (review?.claimBoundaryWarnings.length) {
    lines.push(`Claim boundaries: ${review.claimBoundaryWarnings.join("; ")}.`);
  }
  lines.push(`Calculator status: ${review?.calculatorStatus ?? "no_template"}.`);
  lines.push("Boundary: accepted means constructive review candidate, not proof, physical viability, or certification.");
  return lines.join("\n");
};

const buildPostulateRevisionContinuationActions = (input: {
  review: PostulateReadinessReview | null;
  gate: PostulateSubmissionGateResult;
}): string[] => {
  const review = input.review;
  const reasons = new Set(input.gate.reasons);
  const missingText = [
    ...(review?.missingEvidence ?? []),
    ...(review?.missingDefinitions ?? []),
  ].join(" ").toLowerCase();
  const actions: string[] = [];
  if (reasons.has("runtime_review_missing")) {
    actions.push("rerun through backend Ask so a runtime-authored readiness review is available");
  }
  if (reasons.has("decision_revise") || reasons.has("decision_block") || review?.decision === "revise") {
    actions.push("continue the solver path instead of treating the review JSON as a terminal answer");
  }
  if (reasons.has("scientific_sidecar_ref_missing")) {
    actions.push("create or hydrate the latest scientific Image Lens sidecar ref");
  }
  if (reasons.has("promoted_equation_row_ref_missing")) {
    actions.push("promote a clean page-grounded equation row before retrying");
  }
  if (reasons.has("page_render_ref_missing") || reasons.has("crop_ref_missing")) {
    actions.push("attach page render and crop provenance for the same equation row");
  }
  if (reasons.has("graph_reflection_ref_missing") || /\bgraph|congruence|unblocked\b/.test(missingText)) {
    actions.push("run a diagnostic Theory Badge Graph reflection with explicit blocked or admitted gate status");
  }
  if (/\bprovenance\s+audit|source\s+hash\b/.test(missingText)) {
    actions.push("run a provenance audit that binds paper, page, row, crop, and source hash");
  }
  if (/\buncertainty|congruence\s+trace|reduction\b/.test(missingText)) {
    actions.push("produce an uncertainty-reduction or congruence trace for the same unresolved constraint");
  }
  if (
    review?.calculatorStatus === "no_template" ||
    review?.calculatorStatus === "template_admissible" ||
    /\bcalculator|dimensional|bound\b/.test(missingText)
  ) {
    actions.push("bind or explicitly block the calculator template with missing-variable diagnostics");
  }
  return Array.from(new Set(actions)).slice(0, 8);
};

export const buildPostulateSubmissionTextAndEvidence = (input: {
  request: ParsedAskPostulateReviewRequest;
  review: PostulateReadinessReview;
  hydratedEvidenceContext?: PostulateEvidenceContext | null;
}): { proposalText: string; evidenceContext: PostulateEvidenceContext } => {
  const proposalText = input.review.boardReadyDraft || input.request.proposalText;
  return {
    proposalText,
    evidenceContext: mergeEvidenceContexts(
      input.request.evidenceContext,
      input.hydratedEvidenceContext,
      extractPostulateEvidenceContextFromText(proposalText),
    ),
  };
};
