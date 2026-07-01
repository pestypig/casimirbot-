import { readAgentLoopAuditRecord } from "@/lib/helix/ask-runtime-authority-readers";
import { coerceText } from "@/lib/helix/ask-value-normalization";

export function readHelixPendingInputRecord(value: unknown): Record<string, unknown> | null {
  const record = readAgentLoopAuditRecord(value);
  if (!record) return null;
  const status = coerceText(record.status ?? record.state ?? record.resolution_status).trim().toLowerCase();
  if (status === "resolved" || status === "cancelled" || status === "canceled" || status === "superseded") {
    return null;
  }
  const requestId = coerceText(record.request_id ?? record.requestId ?? record.id).trim();
  const prompt = coerceText(record.prompt ?? record.message ?? record.text ?? record.question).trim();
  const requiredFieldsCandidate = record.required_fields ?? record.requiredFields;
  const requiredFields = Array.isArray(requiredFieldsCandidate) ? requiredFieldsCandidate : [];
  if (requestId || prompt || requiredFields.length > 0 || record.kind === "request_user_input") return record;
  return null;
}

export function normalizeHelixPendingTransitionMarker(value: unknown): string {
  return coerceText(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function readHelixPendingTransitionTrace(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeHelixPendingTransitionMarker(entry)).filter(Boolean);
  }
  const text = normalizeHelixPendingTransitionMarker(value);
  return text ? [text] : [];
}
