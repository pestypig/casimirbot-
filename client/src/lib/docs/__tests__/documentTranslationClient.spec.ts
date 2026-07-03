import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enqueueDocumentMarkdownTranslationMail,
  extractDocumentMarkdownTranslationsFromRuns,
  runDocumentMarkdownTranslationLaneSessionControl,
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
  modelUsed: "test-document-translator",
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
      sourceTextHash: "fnv1a32:text-payload",
      sourceTextCharCount: "Example Heading".length,
      sourceId: "document_markdown:docs/example.md",
      chunkId: "doc-inline:fnv1a32:test:u0001",
      laneSessionId: "lane-session-docs",
      sessionControlKey: "lane-session-docs::document_markdown:docs/example.md::fnv1a32:test::docs_chunk::haw::haw",
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
    const mailBody = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit | undefined)?.body ?? "{}"));
    expect(mailBody.chunkId).toBe("doc-inline:fnv1a32:test:u0001");
    expect(mailBody).toMatchObject({
      locale: "haw",
      targetLanguage: "haw",
      accountLocale: "haw",
      sourceTextHash: "fnv1a32:text-payload",
      sourceTextCharCount: "Example Heading".length,
      laneSessionId: "lane-session-docs",
      sessionControlKey: "lane-session-docs::document_markdown:docs/example.md::fnv1a32:test::docs_chunk::haw::haw",
      projectionTarget: "docs_chunk",
    });
    expect(wakeBody).toMatchObject({
      threadId: "helix-ask:desktop",
      sourceId: "document_markdown:docs/example.md",
      manualRun: true,
      executeHiddenAsk: false,
    });
  });

  it("runs governed document translation lane session control through AGI session endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          schema: "helix.capability_lane.session_control_response.v1",
          ok: true,
          agent_runtime: "helix",
          capability_lane_session_debug_summaries: [
            {
              lane_session_id: "lane-session-docs",
              lane_id: "live_translation",
              session_status: "running",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            },
          ],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    ) as unknown as typeof fetch;
    globalThis.fetch = fetchMock;

    const response = await runDocumentMarkdownTranslationLaneSessionControl({
      action: "start",
      docPath: "docs/example.md",
      locale: "haw",
      targetLanguage: "haw",
      accountLocale: "haw",
      sourceHash: "fnv1a32:test",
      sourceTextHash: "fnv1a32:text-payload",
      sourceTextCharCount: 41,
      sourceId: "document_markdown:docs/example.md",
      laneSessionId: "lane-session-docs",
      requestedBackendProvider: "live_translation.local_runtime",
      projectionTarget: "docs_chunk",
      agentRuntime: "helix",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0] ?? "")).toBe("/api/agi/capability-lanes/session");
    const body = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body ?? "{}"));
    expect(body).toMatchObject({
      agentRuntime: "helix",
      agent_runtime: "helix",
      capability_lane_session_call: {
        action: "start",
        lane_id: "live_translation",
        lane_session_id: "lane-session-docs",
        requested_backend_provider: "live_translation.local_runtime",
        source_binding: {
          source_id: "document_markdown:docs/example.md",
          source_hash: "fnv1a32:test",
          source_text_hash: "fnv1a32:text-payload",
          source_text_char_count: 41,
          source_kind: "docs",
          projection_target: "docs_chunk",
          account_locale: "haw",
          target_language: "haw",
        },
      },
    });
    expect(response.terminal_eligible).toBe(false);
    expect(response.assistant_answer).toBe(false);
    expect(response.raw_content_included).toBe(false);
  });

  it("extracts unit-keyed inline translations from document projection JSON runs", () => {
    const outputPreview = JSON.stringify({
      schema: "stage_play_document_inline_translation_output/v1",
      sourceId: "document_markdown:docs/example.md",
      sourceKind: "document_markdown",
      docPath: "docs/example.md",
      sourceHash: "fnv1a32:test",
      sourceTextHash: "fnv1a32:text-payload",
      sourceTextCharCount: 41,
      chunkId: "doc-inline:fnv1a32:test:u0001,u0002",
      chunkIndex: 3,
      dedupeKey: "document_markdown:docs/example.md:doc-inline:fnv1a32:test:u0001,u0002:haw",
      sourceEventId: "document_markdown_event:doc-inline:fnv1a32:test:u0001,u0002",
      sourceEventMs: 1780000000000,
      observedAtMs: 1780000001000,
      projectionStatus: "projected",
      freshnessStatus: "fresh",
      laneSessionId: "lane-session-docs",
      observationLaneSessionId: "lane-session-docs-observation",
      goalBindingId: "goal-binding-docs",
      latestEventId: "lane-session-docs:observation_recorded:1780000001000",
      hasObservation: true,
      terminalAuthorityStatus: "pending_helix_terminal_authority",
      projectionTarget: "docs_chunk",
      targetLanguage: "haw",
      accountLocale: "haw",
      translations: [
        { unit_id: "u0001", translated_markdown: "Translated heading" },
        { unit_id: "u0002", translated_markdown: "Kikokikona unuhi" },
      ],
    });

    const entries: DocumentMarkdownTranslationEntry[] = extractDocumentMarkdownTranslationsFromRuns([
      { ...baseRun, outputPreview },
    ]);

    expect(entries).toEqual([
      {
        unitId: "u0001",
        status: "ready",
        text: "Translated heading",
        runId: "run-doc-1",
        role: "packet_composer",
        observationRef: "run-doc-1",
        sourceId: "document_markdown:docs/example.md",
        sourceKind: "document_markdown",
        docPath: "docs/example.md",
        sourceHash: "fnv1a32:test",
        sourceTextHash: "fnv1a32:text-payload",
        sourceTextCharCount: 41,
        chunkId: "doc-inline:fnv1a32:test:u0001,u0002",
        chunkIndex: 3,
        dedupeKey: "document_markdown:docs/example.md:doc-inline:fnv1a32:test:u0001,u0002:haw",
        sourceEventId: "document_markdown_event:doc-inline:fnv1a32:test:u0001,u0002",
        sourceEventMs: 1780000000000,
        observedAtMs: 1780000001000,
        projectionStatus: "projected",
        freshnessStatus: "fresh",
        laneSessionId: "lane-session-docs",
        observationLaneSessionId: "lane-session-docs-observation",
        goalBindingId: "goal-binding-docs",
        latestEventId: "lane-session-docs:observation_recorded:1780000001000",
        hasObservation: true,
        terminalAuthorityStatus: "pending_helix_terminal_authority",
        selectedBackendProvider: "test-document-translator",
        source: "document_microdeck",
        projectionTarget: "docs_chunk",
        targetLanguage: "haw",
        accountLocale: "haw",
      },
      {
        unitId: "u0002",
        status: "ready",
        text: "Kikokikona unuhi",
        runId: "run-doc-1",
        role: "packet_composer",
        observationRef: "run-doc-1",
        sourceId: "document_markdown:docs/example.md",
        sourceKind: "document_markdown",
        docPath: "docs/example.md",
        sourceHash: "fnv1a32:test",
        sourceTextHash: "fnv1a32:text-payload",
        sourceTextCharCount: 41,
        chunkId: "doc-inline:fnv1a32:test:u0001,u0002",
        chunkIndex: 3,
        dedupeKey: "document_markdown:docs/example.md:doc-inline:fnv1a32:test:u0001,u0002:haw",
        sourceEventId: "document_markdown_event:doc-inline:fnv1a32:test:u0001,u0002",
        sourceEventMs: 1780000000000,
        observedAtMs: 1780000001000,
        projectionStatus: "projected",
        freshnessStatus: "fresh",
        laneSessionId: "lane-session-docs",
        observationLaneSessionId: "lane-session-docs-observation",
        goalBindingId: "goal-binding-docs",
        latestEventId: "lane-session-docs:observation_recorded:1780000001000",
        hasObservation: true,
        terminalAuthorityStatus: "pending_helix_terminal_authority",
        selectedBackendProvider: "test-document-translator",
        source: "document_microdeck",
        projectionTarget: "docs_chunk",
        targetLanguage: "haw",
        accountLocale: "haw",
      },
    ]);
  });

  it("extracts unit-level translation errors from document projection output", () => {
    const outputPreview = JSON.stringify({
      schema: "stage_play_document_inline_translation_output/v1",
      projectionTarget: "docs_chunk",
      translations: [],
      unit_errors: [
        { unit_id: "u0003", reason: "document_translation_model_output_unavailable" },
      ],
    });

    const entries = extractDocumentMarkdownTranslationsFromRuns([
      {
        ...baseRun,
        status: "failed",
        deckPresetId: "stage_play_micro_reasoner_prompt_preset:document-translate-haw-inline:v1",
        deckPresetTitle: "Document Markdown Translate To Hawaiian",
        deckExecutionMode: "uses_prior_outputs",
        outputPreview,
      },
    ]);

    expect(entries).toEqual([
      {
        unitId: "u0003",
        status: "error",
        error: "document_translation_model_output_unavailable",
        runId: "run-doc-1",
        role: "packet_composer",
        observationRef: "run-doc-1",
        observedAtMs: 1781697601000,
        hasObservation: true,
        terminalAuthorityStatus: "not_terminal_authority",
        selectedBackendProvider: "test-document-translator",
        source: "document_microdeck",
        projectionTarget: "docs_chunk",
      },
    ]);
  });

  it("ignores baseline-only document unavailable projections before a prompted deck product run exists", () => {
    const outputPreview = JSON.stringify({
      schema: "stage_play_document_inline_translation_output/v1",
      projectionTarget: "docs_chunk",
      translations: [],
      unit_errors: [
        { unit_id: "u0003", reason: "document_translation_model_output_unavailable" },
      ],
    });

    const entries = extractDocumentMarkdownTranslationsFromRuns([
      {
        ...baseRun,
        status: "completed",
        deckPresetId: "stage_play_micro_reasoner_prompt_preset:document-translate-haw-inline:v1",
        deckPresetTitle: "Document Markdown Translate To Hawaiian",
        deckExecutionMode: "baseline_fallback",
        deckProductRole: true,
        outputPreview,
      },
    ]);

    expect(entries).toEqual([]);
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
