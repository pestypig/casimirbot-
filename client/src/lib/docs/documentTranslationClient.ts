import type {
  DocumentTranslationApiResponse,
  DocumentTranslationRequestPayload,
  DocumentTranslationResult,
  DocumentTranslationUnitsApiResponse,
  DocumentTranslationUnitsRequestPayload,
  DocumentTranslationUnitsResult,
  DocumentTranslationUnit,
} from "@shared/document-translation";

export const DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS = 60_000;
export const DOCUMENT_MARKDOWN_TRANSLATION_PRESET_ID =
  "stage_play_micro_reasoner_prompt_preset:document-translate-haw-inline:v1";

type StagePlayDocumentMarkdownMailResponse =
  | {
      ok: true;
      sourceId: string;
      sourceKind: "document_markdown";
      mailboxThreadId?: string;
      mail?: { mailId?: string; sourceId?: string; sourceKind?: string };
    }
  | { ok: false; error: string; message?: string };

type StagePlayPresetApplyResponse =
  | {
      ok: true;
      preset?: {
        presetId?: string;
        title?: string;
        sourceIds?: string[];
      };
    }
  | { ok: false; error: string; message?: string };

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

export async function requestDocumentTranslationUnits(
  payload: DocumentTranslationUnitsRequestPayload,
  signal?: AbortSignal,
): Promise<DocumentTranslationUnitsResult> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS);
  const abortHandler = () => controller.abort();
  signal?.addEventListener("abort", abortHandler, { once: true });
  try {
    const response = await fetch("/api/docs/translate-units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as DocumentTranslationUnitsApiResponse | null;
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

export async function applyDocumentMarkdownMicroDeckPreset(params: {
  sourceId: string;
  presetId?: string;
  signal?: AbortSignal;
}): Promise<void> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS);
  const abortHandler = () => controller.abort();
  params.signal?.addEventListener("abort", abortHandler, { once: true });
  try {
    const response = await fetch("/api/helix/stage-play/micro-reasoner-prompt-preset/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presetId: params.presetId ?? DOCUMENT_MARKDOWN_TRANSLATION_PRESET_ID,
        sourceIds: [params.sourceId],
        sourceKind: "document_markdown",
      }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as StagePlayPresetApplyResponse | null;
    if (!response.ok || !body || !body.ok) {
      const message = body && !body.ok ? body.message ?? body.error : `Document MicroDeck preset apply failed (${response.status}).`;
      throw new Error(message);
    }
  } finally {
    globalThis.clearTimeout(timeout);
    params.signal?.removeEventListener("abort", abortHandler);
  }
}

export async function enqueueDocumentMarkdownTranslationMail(params: {
  docPath: string;
  locale: string;
  sourceHash: string;
  title?: string;
  sourceId?: string;
  units: DocumentTranslationUnit[];
  signal?: AbortSignal;
}): Promise<{ sourceId: string; mailId: string | null }> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS);
  const abortHandler = () => controller.abort();
  params.signal?.addEventListener("abort", abortHandler, { once: true });
  try {
    const sourceId = params.sourceId ?? documentMarkdownSourceId(params.docPath);
    await applyDocumentMarkdownMicroDeckPreset({ sourceId, signal: controller.signal });
    const response = await fetch("/api/helix/stage-play/live-source-mail/document-markdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docPath: params.docPath,
        locale: params.locale,
        sourceHash: params.sourceHash,
        title: params.title,
        sourceId,
        units: params.units,
      }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as StagePlayDocumentMarkdownMailResponse | null;
    if (!response.ok || !body || !body.ok) {
      const message = body && !body.ok ? body.message ?? body.error : `Document Markdown mail enqueue failed (${response.status}).`;
      throw new Error(message);
    }
    return {
      sourceId: body.sourceId,
      mailId: body.mail?.mailId ?? null,
    };
  } finally {
    globalThis.clearTimeout(timeout);
    params.signal?.removeEventListener("abort", abortHandler);
  }
}

export function documentMarkdownSourceId(docPath: string): string {
  return `document_markdown:${docPath}`;
}
