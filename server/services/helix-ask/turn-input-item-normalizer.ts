import type { HelixMultimodalTurnContext } from "@shared/helix-multimodal-turn-context";
import type { HelixTurnInputItem } from "@shared/helix-turn-input-item";
import crypto from "node:crypto";

type HelixEvidenceInputKind = Extract<HelixTurnInputItem, { type: "evidence_ref" }>["evidence_kind"];

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readPositiveNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

const readAttachmentKind = (value: unknown): Extract<HelixTurnInputItem, { type: "attachment" }>["attachment_kind"] => {
  const raw = readString(value);
  if (
    raw === "text" ||
    raw === "json" ||
    raw === "code" ||
    raw === "pdf" ||
    raw === "audio" ||
    raw === "image" ||
    raw === "unknown"
  ) {
    return raw;
  }
  return "unknown";
};

const sha256Base64Payload = (value: string): string => {
  const trimmed = value.trim();
  const dataUrlMatch = trimmed.match(/^data:[^;,]+;base64,(.+)$/i);
  const payload = (dataUrlMatch?.[1] ?? trimmed).replace(/\s+/g, "");
  return crypto.createHash("sha256").update(Buffer.from(payload, "base64")).digest("hex");
};

const normalizeIncomingItem = (value: unknown): HelixTurnInputItem | null => {
  const item = asRecord(value);
  if (!item) return null;
  if (item.type === "text") {
    const text = readString(item.text);
    if (!text) return null;
    return { type: "text", text, source: "user" };
  }
  if (item.type === "image") {
    const imageRef = readString(item.image_ref);
    const imageBase64 = readString(item.image_base64);
    const mimeType = readString(item.mime_type) ?? "image/png";
    if (!imageRef && !imageBase64) return null;
    return {
      type: "image",
      image_ref: imageRef,
      image_base64: imageBase64,
      mime_type: mimeType,
      file_name: readString(item.file_name),
      evidence_id: readString(item.evidence_id),
      raw_image_included: Boolean(imageBase64) || item.raw_image_included === true,
      raw_image_scope: imageBase64 ? "turn_input_only" : null,
    };
  }
  if (item.type === "attachment") {
    const attachmentId = readString(item.attachment_id);
    if (!attachmentId) return null;
    const mimeType = readString(item.mime_type) ?? "application/octet-stream";
    const contentBase64 = readString(item.content_base64);
    const contentSha256 = readString(item.content_sha256) ?? (contentBase64 ? sha256Base64Payload(contentBase64) : null);
    return {
      type: "attachment",
      attachment_id: attachmentId,
      attachment_kind: readAttachmentKind(item.attachment_kind),
      mime_type: mimeType,
      file_name: readString(item.file_name),
      size_bytes: readPositiveNumber(item.size_bytes),
      content_base64: null,
      content_sha256: contentSha256,
      preview: readString(item.preview),
      raw_content_included: false,
      raw_content_scope: null,
      assistant_answer: false,
    };
  }
  if (item.type === "evidence_ref") {
    const evidenceId = readString(item.evidence_id);
    const evidenceKind = readString(item.evidence_kind);
    if (!evidenceId || !evidenceKind) return null;
    if (!["visual_frame_evidence", "visual_extraction_evidence", "synthetic_evidence", "subgoal_evaluation", "interpreted_event", "tool_observation"].includes(evidenceKind)) {
      return null;
    }
    return {
      type: "evidence_ref",
      evidence_id: evidenceId,
      evidence_kind: evidenceKind as HelixEvidenceInputKind,
      compact_summary: readString(item.compact_summary),
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  return null;
};

export function normalizeHelixTurnInputItems(input: {
  request: Record<string, unknown>;
  threadId: string;
}): HelixMultimodalTurnContext {
  const request = input.request;
  const rawPrompt = readString(request.raw_user_prompt);
  const prompt = readString(request.prompt);
  const question = readString(request.question);
  const transcript = readString(request.transcript);
  const userText =
    rawPrompt ??
    (
      prompt && question && prompt.length > question.length
        ? prompt
        : null
    ) ??
    prompt ??
    question ??
    transcript ??
    "";
  const items: HelixTurnInputItem[] = [];
  if (userText) items.push({ type: "text", text: userText, source: "user" });

  const providedItems = Array.isArray(request.turn_input_items) ? request.turn_input_items : [];
  for (const value of providedItems) {
    const normalized = normalizeIncomingItem(value);
    if (!normalized) continue;
    if (normalized.type === "text" && items.some((item) => item.type === "text" && item.text === normalized.text)) {
      continue;
    }
    items.push(normalized);
  }

  const snapshot = asRecord(request.workspace_context_snapshot);
  const attached = asRecord(snapshot?.attached_visual_evidence);
  const evidence = asRecord(attached?.evidence);
  const evidenceId = readString(evidence?.evidence_id);
  const frameId = readString(evidence?.frame_id);
  const summary = readString(evidence?.summary);
  if (evidenceId && !items.some((item) => item.type === "evidence_ref" && item.evidence_id === evidenceId)) {
    items.push({
      type: "evidence_ref",
      evidence_id: evidenceId,
      evidence_kind: "visual_frame_evidence",
      compact_summary: summary,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  if (frameId && !items.some((item) => item.type === "image" && item.image_ref === frameId)) {
    items.push({
      type: "image",
      image_ref: frameId,
      mime_type: readString(evidence?.mime_type) ?? readString(attached?.mime_type) ?? "image/png",
      evidence_id: evidenceId,
      raw_image_included: false,
    });
  }

  const visualEvidenceRefs = items
    .filter((item): item is Extract<HelixTurnInputItem, { type: "evidence_ref" }> =>
      item.type === "evidence_ref" && item.evidence_kind === "visual_frame_evidence")
    .map((item) => item.evidence_id);

  return {
    schema: "helix.multimodal_turn_context.v1",
    thread_id: input.threadId,
    turn_input_items: items,
    visual_evidence_refs: Array.from(new Set(visualEvidenceRefs)),
    selected_evidence_refs: Array.from(new Set(items.flatMap((item) => item.type === "evidence_ref" ? [item.evidence_id] : []))),
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
}

export function getUserTextFromTurnInputItems(items: HelixTurnInputItem[]): string {
  return items.find((item): item is Extract<HelixTurnInputItem, { type: "text" }> => item.type === "text")?.text ?? "";
}

export function getVisualEvidenceSummaryFromTurnInputItems(items: HelixTurnInputItem[]): string | null {
  const item = items.find((entry): entry is Extract<HelixTurnInputItem, { type: "evidence_ref" }> =>
    entry.type === "evidence_ref" && entry.evidence_kind === "visual_frame_evidence" && Boolean(entry.compact_summary?.trim()));
  return item?.compact_summary?.trim() ?? null;
}
