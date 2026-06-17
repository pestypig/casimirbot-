import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enqueueDocumentMarkdownTranslationMail,
  extractDocumentMarkdownTranslationsFromRuns,
  type DocumentMarkdownTranslationEntry,
} from "@/lib/docs/documentTranslationClient";
import type { StagePlayMicroReasonerRunV1 } from "@shared/contracts/stage-play-live-source-mail.v1";

const baseRun = {
  artifactId: "stage_play_micro_reasoner_run",
  schemaVersion: "stage_play_micro_reasoner_run/v1",
  runId: "run-doc-1",
  role: "packet_composer",
  jobId: "job-doc-1",
  sourceId: "document_markdown:docs/example.md",
  mailIds: ["mail-doc-1"],
  inputRefs: [],
  outputRefs: [],
  inputPreview: "",
  outputPreview: "",
  status: "completed",
  startedAt: "2026-06-17T12:00:00.000Z",
  completedAt: "2026-06-17T12:00:01.000Z",
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  context_role: "micro_reasoner_evidence",
} satisfies StagePlayMicroReasonerRunV1;

const originalFetch = globalThis.fetch;

describe("document translation MicroDeck output parsing", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("applies the document deck, enqueues visible units, and runs a wake cycle", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, preset: { presetId: "document-preset" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          sourceId: "document_markdown:docs/example.md",
          sourceKind: "document_markdown",
          mail: { mailId: "mail-doc-1" },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, cycle: { result: { wakeRequestId: "wake-doc-1" } } }),
      } as Response) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    await enqueueDocumentMarkdownTranslationMail({
      docPath: "docs/example.md",
      locale: "haw",
      sourceHash: "fnv1a32:test",
      sourceId: "document_markdown:docs/example.md",
      units: [
        {
          unit_id: "u0001",
          kind: "heading",
          source_markdown: "Example Heading",
          translatable: true,
          protected_spans: [],
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0]?.[0] ?? "")).toBe("/api/helix/stage-play/micro-reasoner-prompt-preset/apply");
    expect(String(fetchMock.mock.calls[1]?.[0] ?? "")).toBe("/api/helix/stage-play/live-source-mail/document-markdown");
    expect(String(fetchMock.mock.calls[2]?.[0] ?? "")).toBe("/api/helix/stage-play/live-source-mail/wake/cycle");
    const wakeBody = JSON.parse(String((fetchMock.mock.calls[2]?.[1] as RequestInit | undefined)?.body ?? "{}"));
    expect(wakeBody).toMatchObject({
      threadId: "helix-ask:desktop",
      sourceId: "document_markdown:docs/example.md",
      manualRun: true,
      executeHiddenAsk: false,
    });
  });

  it("extracts unit-keyed inline translations from document projection JSON runs", () => {
    const outputPreview = JSON.stringify({
      schema: "stage_play_document_inline_translation_output/v1",
      projectionTarget: "docs_viewer_inline",
      translations: [
        { unit_id: "u0001", translated_markdown: "Translated heading" },
        { unit_id: "u0002", translated_markdown: "Kikokikona unuhi" },
      ],
    });

    const entries: DocumentMarkdownTranslationEntry[] = extractDocumentMarkdownTranslationsFromRuns([
      { ...baseRun, outputPreview },
    ]);

    expect(entries).toEqual([
      { unitId: "u0001", status: "ready", text: "Translated heading", runId: "run-doc-1", role: "packet_composer" },
      { unitId: "u0002", status: "ready", text: "Kikokikona unuhi", runId: "run-doc-1", role: "packet_composer" },
    ]);
  });

  it("extracts unit-level translation errors from document projection output", () => {
    const outputPreview = JSON.stringify({
      schema: "stage_play_document_inline_translation_output/v1",
      projectionTarget: "docs_viewer_inline",
      translations: [],
      unit_errors: [
        { unit_id: "u0003", reason: "document_translation_model_output_unavailable" },
      ],
    });

    const entries = extractDocumentMarkdownTranslationsFromRuns([
      { ...baseRun, status: "failed", outputPreview },
    ]);

    expect(entries).toEqual([
      {
        unitId: "u0003",
        status: "error",
        error: "document_translation_model_output_unavailable",
        runId: "run-doc-1",
        role: "packet_composer",
      },
    ]);
  });

  it("ignores completed run notes that are not structured translation output", () => {
    const entries = extractDocumentMarkdownTranslationsFromRuns([
      {
        ...baseRun,
        outputPreview:
          'wait_for_next_summary; low; stage_play_live_source_mail:883acaba: {"schema":"stage_play.document_markdown_visible_units.v1"}',
      },
    ]);

    expect(entries).toEqual([]);
  });
});
