import { describe, expect, it } from "vitest";
import {
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

describe("document translation MicroDeck output parsing", () => {
  it("extracts unit-keyed inline translations from completed JSON runs", () => {
    const outputPreview = JSON.stringify({
      translations: [
        { unit_id: "u0001", translated_markdown: "Poʻo unuhi" },
        { unit_id: "u0002", translated_markdown: "Kikokikona unuhi" },
      ],
    });

    const entries: DocumentMarkdownTranslationEntry[] = extractDocumentMarkdownTranslationsFromRuns([
      { ...baseRun, outputPreview },
    ]);

    expect(entries).toEqual([
      { unitId: "u0001", text: "Poʻo unuhi", runId: "run-doc-1", role: "packet_composer" },
      { unitId: "u0002", text: "Kikokikona unuhi", runId: "run-doc-1", role: "packet_composer" },
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
