import { Router } from "express";
import {
  DOCUMENT_TRANSLATION_GLOSSARY_VERSION,
  DOCUMENT_TRANSLATION_MODEL_POLICY_VERSION,
  DOCUMENT_TRANSLATION_SCHEMA,
  composeTranslatedMarkdown,
  hashDocumentSource,
  hasFailingDocumentTranslationChecks,
  runDocumentTranslationChecks,
  segmentMarkdownForTranslation,
  type DocumentTranslationApiResponse,
  type DocumentTranslationRequestPayload,
  type DocumentTranslationUnit,
} from "@shared/document-translation";

export const docsTranslationRouter = Router();

const DEFAULT_OPENAI_BASE = "https://api.openai.com";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TRANSLATION_UNITS = Number.parseInt(process.env.DOC_TRANSLATION_MAX_UNITS ?? "80", 10);
const MAX_TRANSLATION_CHARS = Number.parseInt(process.env.DOC_TRANSLATION_MAX_CHARS ?? "12000", 10);

docsTranslationRouter.post("/translate", async (req, res) => {
  const payload = req.body as Partial<DocumentTranslationRequestPayload>;
  const docPath = typeof payload.doc_path === "string" ? payload.doc_path.trim() : "";
  const locale = typeof payload.locale === "string" ? payload.locale.trim() : "";
  const sourceMarkdown = typeof payload.source_markdown === "string" ? payload.source_markdown : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : undefined;

  if (!docPath || !locale || !sourceMarkdown) {
    const response: DocumentTranslationApiResponse = {
      ok: false,
      error: "invalid_document_translation_request",
      message: "doc_path, locale, and source_markdown are required.",
    };
    res.status(400).json(response);
    return;
  }
  if (locale === "en") {
    const response: DocumentTranslationApiResponse = {
      ok: false,
      error: "document_translation_not_needed",
      message: "English is the canonical document source language.",
    };
    res.status(400).json(response);
    return;
  }

  const sourceHash = hashDocumentSource(sourceMarkdown);
  const units = segmentMarkdownForTranslation(sourceMarkdown);
  const selectedUnits = selectUnitsForTranslation(units);
  const skippedCount = units.filter((unit) => unit.translatable).length - selectedUnits.length;
  const warnings: string[] = [];
  if (skippedCount > 0) {
    warnings.push(
      `Translation draft capped at ${selectedUnits.length} units / ${MAX_TRANSLATION_CHARS} characters; ${skippedCount} units left as source text.`,
    );
  }

  const providerBase = (process.env.DOC_TRANSLATION_BASE || process.env.LLM_HTTP_BASE || DEFAULT_OPENAI_BASE).trim();
  const apiKey = (process.env.DOC_TRANSLATION_API_KEY || process.env.OPENAI_API_KEY || "").trim();
  const model = (process.env.DOC_TRANSLATION_MODEL || process.env.LLM_HTTP_MODEL || DEFAULT_MODEL).trim();
  const isDefaultOpenAIBase = providerBase.replace(/\/+$/, "") === DEFAULT_OPENAI_BASE;

  if (isDefaultOpenAIBase && !apiKey) {
    const response: DocumentTranslationApiResponse = {
      ok: false,
      error: "document_translation_unavailable",
      message: "OPENAI_API_KEY or DOC_TRANSLATION_API_KEY is not configured.",
    };
    res.status(503).json(response);
    return;
  }

  try {
    const translatedUnits = selectedUnits.length
      ? await requestTranslations({
          providerBase,
          apiKey,
          model,
          locale,
          docPath,
          title,
          units: selectedUnits.map((unit) => ({
            unit_id: unit.unit_id,
            kind: unit.kind,
            source_markdown: unit.source_markdown,
            protected_spans: unit.protected_spans,
          })),
        })
      : {};
    const translationsByUnitId = Object.fromEntries(
      units
        .filter((unit) => unit.translatable)
        .map((unit) => [unit.unit_id, translatedUnits[unit.unit_id] ?? unit.source_markdown]),
    );
    const translatedMarkdown = composeTranslatedMarkdown(units, translationsByUnitId);
    const checks = runDocumentTranslationChecks(sourceMarkdown, units, translatedMarkdown, translationsByUnitId);
    const failed = hasFailingDocumentTranslationChecks(checks);
    const now = new Date().toISOString();
    const response: DocumentTranslationApiResponse = {
      ok: true,
      result: {
        schema: DOCUMENT_TRANSLATION_SCHEMA,
        doc_path: docPath,
        locale,
        source_hash: sourceHash,
        glossary_version: DOCUMENT_TRANSLATION_GLOSSARY_VERSION,
        model_policy_version: DOCUMENT_TRANSLATION_MODEL_POLICY_VERSION,
        status: failed || warnings.length > 0 ? "needs_review" : "generated_checked",
        title,
        translated_markdown: translatedMarkdown,
        units,
        checks,
        warnings,
        provider: providerBase,
        model,
        created_at: now,
        updated_at: now,
      },
    };
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document translation failed.";
    const response: DocumentTranslationApiResponse = {
      ok: false,
      error: "document_translation_failed",
      message,
    };
    res.status(502).json(response);
  }
});

type TranslationRequestUnit = {
  unit_id: string;
  kind: string;
  source_markdown: string;
  protected_spans: string[];
};

async function requestTranslations(params: {
  providerBase: string;
  apiKey: string;
  model: string;
  locale: string;
  docPath: string;
  title?: string;
  units: TranslationRequestUnit[];
}): Promise<Record<string, string>> {
  const endpoint = `${params.providerBase.replace(/\/+$/, "")}/v1/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (params.apiKey) {
    headers.Authorization = `Bearer ${params.apiKey}`;
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: params.model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Translate technical Markdown units from English into the requested locale. Preserve Markdown structure, code spans, math, URLs, API paths, file paths, product names, and every protected span exactly. Return only JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            schema: "casimir.document_translation_request.v1",
            locale: params.locale,
            locale_guidance:
              params.locale === "haw"
                ? "Use Hawaiian where confident. Keep uncertain product terms in English. Use correct okina and kahako when Hawaiian words require them."
                : "Use the requested locale where confident. Keep uncertain product terms in English.",
            doc_path: params.docPath,
            title: params.title ?? null,
            output_shape: {
              translations: [
                {
                  unit_id: "u0001",
                  translated_markdown: "translated Markdown preserving protected spans",
                },
              ],
              warnings: ["optional warnings"],
            },
            units: params.units,
          }),
        },
      ],
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Provider returned ${response.status}${text ? `: ${text.slice(0, 400)}` : ""}`);
  }
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Provider response did not include translated content.");
  }
  const parsed = parseTranslationJson(content);
  const translations = Array.isArray(parsed.translations) ? parsed.translations : [];
  return Object.fromEntries(
    translations
      .filter(
        (item): item is { unit_id: string; translated_markdown: string } =>
          item &&
          typeof item.unit_id === "string" &&
          typeof item.translated_markdown === "string",
      )
      .map((item) => [item.unit_id, item.translated_markdown]),
  );
}

function selectUnitsForTranslation(units: DocumentTranslationUnit[]): DocumentTranslationUnit[] {
  const selected: DocumentTranslationUnit[] = [];
  let totalChars = 0;
  for (const unit of units) {
    if (!unit.translatable) continue;
    const nextChars = totalChars + unit.source_markdown.length;
    if (selected.length >= MAX_TRANSLATION_UNITS || nextChars > MAX_TRANSLATION_CHARS) {
      break;
    }
    selected.push(unit);
    totalChars = nextChars;
  }
  return selected;
}

function parseTranslationJson(content: string): { translations?: unknown[] } {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([^]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed) as { translations?: unknown[] };
}
