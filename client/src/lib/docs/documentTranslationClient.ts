import type {
  DocumentTranslationApiResponse,
  DocumentTranslationRequestPayload,
  DocumentTranslationResult,
} from "@shared/document-translation";

export async function requestDocumentTranslation(
  payload: DocumentTranslationRequestPayload,
  signal?: AbortSignal,
): Promise<DocumentTranslationResult> {
  const response = await fetch("/api/docs/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  const body = (await response.json().catch(() => null)) as DocumentTranslationApiResponse | null;
  if (!response.ok || !body || !body.ok) {
    const message = body && !body.ok ? body.message : `Document translation failed (${response.status}).`;
    throw new Error(message);
  }
  return body.result;
}
