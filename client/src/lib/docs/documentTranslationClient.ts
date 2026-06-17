import type {
  DocumentTranslationApiResponse,
  DocumentTranslationRequestPayload,
  DocumentTranslationResult,
  DocumentTranslationUnitsApiResponse,
  DocumentTranslationUnitsRequestPayload,
  DocumentTranslationUnitsResult,
  DocumentTranslationUnit,
} from "@shared/document-translation";
import type { StagePlayMicroReasonerRunV1 } from "@shared/contracts/stage-play-live-source-mail.v1";

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

type StagePlayLiveSourceMailRead =
  | {
      ok: true;
      microReasonerRuns?: StagePlayMicroReasonerRunV1[];
      micro_reasoner_runs?: StagePlayMicroReasonerRunV1[];
    }
  | { ok: false; error?: string; message?: string };

export type DocumentMarkdownTranslationEntry = {
  unitId: string;
  status: "ready" | "error";
  text?: string;
  error?: string;
  runId: string;
  role: StagePlayMicroReasonerRunV1["role"];
};

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

export async function readDocumentMarkdownMicroDeckRuns(params: {
  sourceId: string;
  threadId?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<StagePlayMicroReasonerRunV1[]> {
  const query = new URLSearchParams({
    threadId: params.threadId ?? "helix-ask:desktop",
    sourceId: params.sourceId,
    sourceKind: "document_markdown",
    view: "full",
    includeConfig: "0",
    limit: String(params.limit ?? 24),
  });
  const response = await fetch(`/api/helix/stage-play/live-source-mail?${query.toString()}`, {
    signal: params.signal,
  });
  const body = (await response.json().catch(() => null)) as StagePlayLiveSourceMailRead | null;
  if (!response.ok || !body || !body.ok) {
    const message = body && !body.ok
      ? body.message ?? body.error ?? "Document Markdown MicroDeck read failed."
      : `Document Markdown MicroDeck read failed (${response.status}).`;
    throw new Error(message);
  }
  return Array.isArray(body.microReasonerRuns)
    ? body.microReasonerRuns
    : Array.isArray(body.micro_reasoner_runs)
      ? body.micro_reasoner_runs
      : [];
}

export function extractDocumentMarkdownTranslationsFromRuns(
  runs: StagePlayMicroReasonerRunV1[],
): DocumentMarkdownTranslationEntry[] {
  const entries = new Map<string, DocumentMarkdownTranslationEntry>();
  for (const run of runs) {
    const parsed = parseDocumentTranslationRunPreview(run.outputPreview);
    if (!parsed) continue;
    const isDocumentProjection =
      parsed.schema === "stage_play_document_inline_translation_output/v1" ||
      parsed.projectionTarget === "docs_viewer_inline" ||
      Array.isArray(parsed.translations);
    if (!isDocumentProjection) continue;
    const translations = Array.isArray(parsed?.translations) ? parsed.translations : [];
    for (const item of translations) {
      const record = readRecord(item);
      const unitId = readFirstString(record, ["unit_id", "unitId", "id"]);
      const text = readFirstString(record, [
        "translated_markdown",
        "translatedMarkdown",
        "translation",
        "text",
      ]);
      if (!unitId || !text) continue;
      entries.set(unitId, {
        unitId,
        status: "ready",
        text,
        runId: run.runId,
        role: run.role,
      });
    }
    const unitErrors = Array.isArray(parsed.unit_errors)
      ? parsed.unit_errors
      : Array.isArray(parsed.unitErrors)
        ? parsed.unitErrors
        : [];
    for (const item of unitErrors) {
      const record = readRecord(item);
      const unitId = readFirstString(record, ["unit_id", "unitId", "id"]);
      const reason = readFirstString(record, ["reason", "error", "message"]) ?? "translation_unavailable";
      if (!unitId || entries.get(unitId)?.status === "ready") continue;
      entries.set(unitId, {
        unitId,
        status: "error",
        error: reason,
        runId: run.runId,
        role: run.role,
      });
    }
  }
  return Array.from(entries.values());
}

export function documentMarkdownSourceId(docPath: string): string {
  return `document_markdown:${docPath}`;
}

function parseDocumentTranslationRunPreview(preview: string | null | undefined): Record<string, unknown> | null {
  const trimmed = preview?.trim();
  if (!trimmed) return null;
  const candidates = [trimmed];
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  if (fencedJson) candidates.push(fencedJson);
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }
  for (const candidate of candidates) {
    try {
      return readRecord(JSON.parse(candidate));
    } catch {
      // Overview previews can be clipped or can contain non-JSON run notes.
    }
  }
  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readFirstString(record: Record<string, unknown> | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}
