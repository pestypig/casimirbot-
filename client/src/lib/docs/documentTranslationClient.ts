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
      traffic?: {
        sourceHash?: string | null;
        chunkId?: string;
        chunkIndex?: number;
        dedupeKey?: string;
        sourceEventId?: string;
        sourceEventMs?: number;
        targetLanguage?: string;
        accountLocale?: string;
        acceptedUnits?: number;
        deferredUnits?: number;
        acceptedChars?: number;
        maxUnits?: number;
        maxChars?: number;
      };
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

type StagePlayWakeCycleResponse =
  | { ok: true; cycle?: unknown }
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
  observationRef?: string | null;
  receiptRef?: string | null;
  docPath?: string | null;
  sourceHash?: string | null;
  chunkId?: string | null;
  chunkIndex?: number | null;
  dedupeKey?: string | null;
  sourceEventId?: string | null;
  sourceEventMs?: number | null;
  observedAtMs?: number | null;
  projectionStatus?: string | null;
  freshnessStatus?: string | null;
  selectedBackendProvider?: string | null;
  sourceId?: string | null;
  source?: "document_microdeck";
  sourceKind?: string | null;
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  accountLocale?: string | null;
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
  targetLanguage?: string | null;
  accountLocale?: string | null;
  sourceHash: string;
  title?: string;
  sourceId?: string;
  chunkId?: string;
  chunkIndex?: number | null;
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
        targetLanguage: params.targetLanguage ?? params.locale,
        accountLocale: params.accountLocale ?? params.locale,
        sourceHash: params.sourceHash,
        title: params.title,
        sourceId,
        chunkId: params.chunkId,
        chunkIndex: params.chunkIndex ?? null,
        units: params.units,
      }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as StagePlayDocumentMarkdownMailResponse | null;
    if (!response.ok || !body || !body.ok) {
      const message = body && !body.ok ? body.message ?? body.error : `Document Markdown mail enqueue failed (${response.status}).`;
      throw new Error(message);
    }
    await runDocumentMarkdownMicroDeckCycle({ sourceId, signal: controller.signal });
    return {
      sourceId: body.sourceId,
      mailId: body.mail?.mailId ?? null,
    };
  } finally {
    globalThis.clearTimeout(timeout);
    params.signal?.removeEventListener("abort", abortHandler);
  }
}

export async function runDocumentMarkdownMicroDeckCycle(params: {
  sourceId?: string;
  threadId?: string;
  signal?: AbortSignal;
} = {}): Promise<void> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), DOCUMENT_TRANSLATION_REQUEST_TIMEOUT_MS);
  const abortHandler = () => controller.abort();
  params.signal?.addEventListener("abort", abortHandler, { once: true });
  try {
    const response = await fetch("/api/helix/stage-play/live-source-mail/wake/cycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: params.threadId ?? "helix-ask:desktop",
        sourceId: params.sourceId,
        manualRun: true,
        executeHiddenAsk: false,
      }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as StagePlayWakeCycleResponse | null;
    if (!response.ok || !body || !body.ok) {
      const message = body && !body.ok
        ? body.message ?? body.error
        : `Document MicroDeck wake cycle failed (${response.status}).`;
      throw new Error(message);
    }
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
    const sourceKind = readFirstString(parsed, ["sourceKind", "source_kind"]) ?? null;
    const docPath = readFirstString(parsed, ["docPath", "doc_path"]) ?? null;
    const sourceHash = readFirstString(parsed, ["sourceHash", "source_hash"]) ?? null;
    const chunkId = readFirstString(parsed, ["chunkId", "chunk_id"]) ?? null;
    const chunkIndex = readFirstNumber(parsed, ["chunkIndex", "chunk_index"]);
    const dedupeKey = readFirstString(parsed, ["dedupeKey", "dedupe_key"]) ?? null;
    const sourceEventId = readFirstString(parsed, ["sourceEventId", "source_event_id"]) ?? null;
    const sourceEventMs = readFirstNumber(parsed, ["sourceEventMs", "source_event_ms"]);
    const observedAtMs =
      readFirstNumber(parsed, ["observedAtMs", "observed_at_ms"]) ??
      readIsoTimestampMs(readFirstString(parsed, ["createdAt", "created_at"])) ??
      readIsoTimestampMs(run.completedAt) ??
      readIsoTimestampMs(run.startedAt);
    const projectionStatus = readFirstString(parsed, ["projectionStatus", "projection_status"]) ?? null;
    const freshnessStatus = readFirstString(parsed, ["freshnessStatus", "freshness_status"]) ?? null;
    const sourceId = readFirstString(parsed, ["sourceId", "source_id"]) ?? null;
    const selectedBackendProvider =
      readFirstString(parsed, ["selectedBackendProvider", "selected_backend_provider"]) ??
      run.modelUsed ??
      "stage_play_microdeck";
    const observationRef = readFirstString(parsed, ["observationRef", "observation_ref"]) ?? run.runId;
    const receiptRef = readFirstString(parsed, ["receiptRef", "receipt_ref"]) ?? null;
    const projectionTarget = readFirstString(parsed, ["projectionTarget", "projection_target"]) ?? null;
    const targetLanguage = readFirstString(parsed, ["targetLanguage", "target_language", "locale"]) ?? null;
    const accountLocale = readFirstString(parsed, ["accountLocale", "account_locale", "locale"]) ?? null;
    const projectionMeta = {
      source: "document_microdeck" as const,
      ...(sourceKind ? { sourceKind } : {}),
      ...(docPath ? { docPath } : {}),
      ...(sourceHash ? { sourceHash } : {}),
      ...(chunkId ? { chunkId } : {}),
      ...(typeof chunkIndex === "number" ? { chunkIndex } : {}),
      ...(dedupeKey ? { dedupeKey } : {}),
      ...(sourceEventId ? { sourceEventId } : {}),
      ...(typeof sourceEventMs === "number" ? { sourceEventMs } : {}),
      ...(typeof observedAtMs === "number" ? { observedAtMs } : {}),
      ...(projectionStatus ? { projectionStatus } : {}),
      ...(freshnessStatus ? { freshnessStatus } : {}),
      ...(sourceId ? { sourceId } : {}),
      ...(selectedBackendProvider ? { selectedBackendProvider } : {}),
      ...(observationRef ? { observationRef } : {}),
      ...(receiptRef ? { receiptRef } : {}),
      ...(projectionTarget ? { projectionTarget } : {}),
      ...(targetLanguage ? { targetLanguage } : {}),
      ...(accountLocale ? { accountLocale } : {}),
    };
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
        ...projectionMeta,
      });
    }
    const unitErrors = Array.isArray(parsed.unit_errors)
      ? parsed.unit_errors
      : Array.isArray(parsed.unitErrors)
        ? parsed.unitErrors
        : [];
    const baselineOnlyUnavailable =
      run.status === "completed" &&
      (run.deckExecutionMode === "baseline_fallback" || run.deckProductRole !== true) &&
      unitErrors.length > 0 &&
      unitErrors.every((entry) => {
        const record = readRecord(entry);
        return readFirstString(record, ["reason", "error", "message"]) === "document_translation_model_output_unavailable";
      });
    if (baselineOnlyUnavailable) continue;
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
        ...projectionMeta,
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

function readFirstNumber(record: Record<string, unknown> | null, keys: string[]): number | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function readIsoTimestampMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}
