import type {
  DocumentTranslationApiResponse,
  DocumentTranslationRequestPayload,
  DocumentTranslationResult,
} from "@shared/document-translation";

export const DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS = 60_000;

export async function requestDocumentTranslation(
  payload: DocumentTranslationRequestPayload,
  signal?: AbortSignal,
): Promise<DocumentTranslationResult> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS);
  const abortHandler = () => controller.abort();
  signal?.addEventListener("abort", abortHandler, { once: true });
  try {
    const response = await fetch("/api/docs/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as DocumentTranslationApiResponse | null;
    if (!response.ok || !body || !body.ok) {
      const message = body && !body.ok ? body.message : `Document translation failed (${response.status}).`;
      throw new Error(message);
    }
    return body.result;
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortHandler);
  }
}
