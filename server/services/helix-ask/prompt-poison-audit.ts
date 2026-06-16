import crypto from "node:crypto";
import type { HelixPromptPoisonAudit, HelixPromptPoisonAuditViolationKind } from "@shared/helix-prompt-poison-audit";
import type { HelixTurnInputItem } from "@shared/helix-turn-input-item";

type PromptPoisonViolation = HelixPromptPoisonAudit["violations"][number];

const hashText = (text: string): string =>
  crypto.createHash("sha256").update(text).digest("hex");

const addViolation = (
  violations: HelixPromptPoisonAudit["violations"],
  kind: HelixPromptPoisonAuditViolationKind,
  summary: string,
): void => {
  if (violations.some((violation: PromptPoisonViolation) => violation.kind === kind && violation.summary === summary)) return;
  violations.push({ kind, summary });
};

export function auditHelixPromptForPoison(input: {
  userText: string;
  turnInputItems?: HelixTurnInputItem[];
}): HelixPromptPoisonAudit {
  const userText = typeof input.userText === "string" ? input.userText : "";
  const violations: HelixPromptPoisonAudit["violations"] = [];

  if (/Attached visual evidence summary/i.test(userText)) {
    addViolation(violations, "evidence_summary_in_user_text", "Visual evidence summary was appended into user prompt text.");
  }
  if (/\bassistant_answer\s*=\s*false\b|helix\.(?:ask_attached_visual_evidence|visual_frame_evidence|synthetic_evidence)/i.test(userText)) {
    addViolation(violations, "evidence_summary_in_user_text", "Evidence metadata leaked into user prompt text.");
  }
  if (/\bimage_base64\b|data:image\/[a-z0-9.+-]+;base64,|[A-Za-z0-9+/]{160,}={0,2}/.test(userText)) {
    addViolation(violations, "raw_image_in_user_text", "Raw image data or base64-like content leaked into user prompt text.");
  }
  if (/\b(?:toolObservation|tool_receipt|dynamicToolCall|workspace_action_receipt)\b/i.test(userText)) {
    addViolation(violations, "tool_receipt_in_user_text", "Tool receipt language leaked into user prompt text.");
  }
  if (/\b(?:helix\.visual_extraction_evidence|visual_extraction_evidence|hotbar_slots|derived_equation)\b/i.test(userText)) {
    addViolation(violations, "tool_receipt_in_user_text", "Derived multimodal extraction, equation, or calculator receipt leaked into user prompt text.");
  }
  if (
    /\bhelix\.calculator_receipt\.v1\b/i.test(userText) ||
    /\bkind\s*[:=]\s*["']calculator_receipt["']/i.test(userText) ||
    /\bcalculator_receipt\s*[:=]\s*[{[]/i.test(userText) ||
    /\breceipt_id\s*[:=]\s*["'][^"']*calculator_receipt/i.test(userText)
  ) {
    addViolation(violations, "tool_receipt_in_user_text", "Structured calculator receipt payload leaked into user prompt text.");
  }
  if (/\b(?:Now|Structure|Goal|Risk|Progress|Unknowns|Next check)\s*:/i.test(userText)) {
    addViolation(violations, "live_projection_in_user_text", "Live-card projection labels leaked into user prompt text.");
  }
  if (/\b(?:profile archive|archive_summary|interpreted_event_summaries)\b/i.test(userText)) {
    addViolation(violations, "archive_summary_in_user_text", "Archive summary language leaked into user prompt text.");
  }

  const items = Array.isArray(input.turnInputItems) ? input.turnInputItems : [];
  return {
    schema: "helix.prompt_poison_audit.v1",
    ok: violations.length === 0,
    violations,
    user_text_hash: hashText(userText),
    evidence_ref_count: items.filter((item: HelixTurnInputItem) => item.type === "evidence_ref").length,
    image_input_count: items.filter((item: HelixTurnInputItem) => item.type === "image").length,
  };
}
