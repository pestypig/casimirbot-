import type { EssenceProposal } from "@shared/proposals";
import {
  extractPostulateEvidenceContextFromText,
  normalizePostulateEvidenceContext,
  type PostulateEvidenceContext,
  type PostulateProposalScore,
} from "./postulate";

export type PostulateReviewDecision = "submit" | "revise" | "block";
export type PostulateCalculatorStatus = "template_only" | "bound_but_unsolved" | "calculation_ready";

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
  value === "calculation_ready" || value === "bound_but_unsolved" || value === "template_only"
    ? value
    : "template_only";

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
      readStringArray(record.packet_refs).forEach((ref) => promotedEquationRowRefs.add(ref));
      readStringArray(record.produced_artifact_refs).forEach((ref) => provenanceAuditRefs.add(ref));
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

    if (schema === "helix.scientific_image_graph_reflection_lookup.v1") {
      pushUniqueRef(graphReflectionRefs, record.selected_reflection_id);
      pushUniqueRef(provenanceAuditRefs, record.selected_lookup_key ? `provenance_audit:${record.selected_lookup_key}` : null);
      pushUniqueRef(uncertaintyReductionRefs, record.selected_gate_state ? `uncertainty_reduction:graph_gate:${record.selected_gate_state}` : null);
    }

    if (schema === "helix.calculator_template_admissibility.v1") {
      const status = readString(record.status) ?? "template_only";
      const admitted = Number(record.admitted_template_count ?? record.admitted_count ?? 0);
      pushUniqueRef(calculatorCheckRefs, `calculator_check:template_admissibility:${status}:${Number.isFinite(admitted) ? admitted : 0}`);
    }

    if (
      schema === "helix.theory_context_reflection.v1" ||
      schema === "helix.theory_badge_graph_reflection.v1" ||
      /theory.*reflection|graph.*reflection/i.test(kind ?? "")
    ) {
      pushUniqueRef(graphReflectionRefs, record.ref ?? record.ref_id ?? record.refId ?? record.id ?? record.artifact_id);
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

export const parseAskPostulateReviewRequest = (prompt: string): ParsedAskPostulateReviewRequest | null => {
  const text = typeof prompt === "string" ? prompt.trim() : "";
  if (!POSTULATE_COMMAND_RE.test(text)) return null;
  const body = text.replace(POSTULATE_COMMAND_RE, "").trim();
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
    evidenceContext: extractPostulateEvidenceContextFromText(text),
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
  lines.push(`Calculator status: ${review?.calculatorStatus ?? "template_only"}.`);
  lines.push("Boundary: accepted means constructive review candidate, not proof, physical viability, or certification.");
  return lines.join("\n");
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
