import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";

export type HelixTurnInputIntegrityAuditViolationKind =
  | "visual_prompt_without_visual_input"
  | "stale_image_item"
  | "invalid_raw_image_scope"
  | "missing_evidence_ref";

export type HelixTurnInputIntegrityAudit = {
  schema: "helix.turn_input_integrity_audit.v1";
  ok: boolean;
  violations: Array<{
    kind: HelixTurnInputIntegrityAuditViolationKind;
    summary: string;
  }>;
  text_input_count: number;
  image_input_count: number;
  evidence_ref_count: number;
  assistant_answer: false;
};

const VISUAL_PROMPT_PATTERN =
  /\b(?:image|screenshot|picture|photo|visible|from this|from the image|hotbar|inventory|chest|container)\b/i;

const ATTACHED_VISUAL_PATTERN =
  /\battached\b[\s\S]{0,60}\b(?:image|screenshot|picture|photo|frame)\b|\b(?:image|screenshot|picture|photo|frame)\b[\s\S]{0,60}\battached\b/i;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export const helixTurnInputLooksVisual = (text: string): boolean =>
  VISUAL_PROMPT_PATTERN.test(text) || ATTACHED_VISUAL_PATTERN.test(text);

export function auditHelixTurnInputIntegrity(input: {
  userText: string;
  request: Record<string, unknown>;
  context: HelixMultimodalTurnContext;
}): HelixTurnInputIntegrityAudit {
  const violations: HelixTurnInputIntegrityAudit["violations"] = [];
  const items = Array.isArray(input.context.turn_input_items) ? input.context.turn_input_items : [];
  const textInputCount = items.filter((item) => item.type === "text").length;
  const imageInputCount = items.filter((item) => item.type === "image").length;
  const evidenceRefCount = items.filter((item) => item.type === "evidence_ref").length;

  const hasValidVisualInput = items.some((item) => {
    if (item.type === "image") {
      return Boolean(readString(item.image_base64) || readString(item.image_ref) || readString(item.evidence_id));
    }
    if (item.type === "evidence_ref") {
      return item.evidence_kind === "visual_frame_evidence" || item.evidence_kind === "visual_extraction_evidence";
    }
    return false;
  });

  if (helixTurnInputLooksVisual(input.userText) && !hasValidVisualInput) {
    violations.push({
      kind: "visual_prompt_without_visual_input",
      summary: "The prompt asks about visual input, but the committed turn has no valid image or visual evidence item.",
    });
  }

  const rawTurnInputItems = Array.isArray(input.request.turn_input_items) ? input.request.turn_input_items : [];
  for (const rawItem of rawTurnInputItems) {
    const item = asRecord(rawItem);
    if (!item) continue;
    if (item.type === "image") {
      const hasImageBase64 = Boolean(readString(item.image_base64));
      const hasImageRef = Boolean(readString(item.image_ref));
      const hasEvidenceId = Boolean(readString(item.evidence_id));
      if (!hasImageBase64 && !hasImageRef && !hasEvidenceId) {
        violations.push({
          kind: "stale_image_item",
          summary: "An image turn input item was present, but it had no image bytes, image ref, or evidence id.",
        });
      }
      if (item.raw_image_included === true && item.raw_image_scope !== "turn_input_only") {
        violations.push({
          kind: "invalid_raw_image_scope",
          summary: "Raw image bytes are only allowed with raw_image_scope=turn_input_only.",
        });
      }
    }
    if (item.type === "evidence_ref" && !readString(item.evidence_id)) {
      violations.push({
        kind: "missing_evidence_ref",
        summary: "An evidence_ref turn input item was present without an evidence_id.",
      });
    }
  }

  return {
    schema: "helix.turn_input_integrity_audit.v1",
    ok: violations.length === 0,
    violations,
    text_input_count: textInputCount,
    image_input_count: imageInputCount,
    evidence_ref_count: evidenceRefCount,
    assistant_answer: false,
  };
}
