/**
 * @vitest-environment jsdom
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dispatchScientificCalculatorMathPicked,
  type ScientificCalculatorMathPickedDetail
} from "@/lib/scientific-calculator/events";

let handleDocMathPick: typeof import("@/components/DocViewerPanel").handleDocMathPick;
let applyDocNarratorSourceIds: typeof import("@/components/DocViewerPanel").applyDocNarratorSourceIds;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ applyDocNarratorSourceIds, handleDocMathPick } = await import("@/components/DocViewerPanel"));
});

describe("doc viewer math interaction", () => {
  it("dispatches scientific calculator ingest event and copies latex", () => {
    const clipboardWrite = vi.fn(async () => undefined);
    const events: ScientificCalculatorMathPickedDetail[] = [];
    const dispatch = vi.fn((detail: { latex: string; sourcePath: string | null; anchor: string | null }) => {
      events.push(
        dispatchScientificCalculatorMathPicked({
          latex: detail.latex,
          sourcePath: detail.sourcePath,
          anchor: detail.anchor,
        }),
      );
    });

    handleDocMathPick({
      latex: "x^2-4=0",
      currentPath: "/docs/research/sample.md",
      anchor: "eq-1",
      clipboardWrite,
      dispatchEvent: dispatch,
    });

    expect(clipboardWrite).toHaveBeenCalledWith("x^2-4=0");
    expect(dispatch).toHaveBeenCalledOnce();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      latex: "x^2-4=0",
      sourcePath: "/docs/research/sample.md",
      anchor: "eq-1",
    });
  });

  it("adds stable narrator source ids to rendered document text blocks", () => {
    document.body.innerHTML = `
      <div>
        <article>
          <h1>Readable heading</h1>
          <p>First readable sentence. Second readable sentence.</p>
          <div class="doc-math-clickable doc-math-clickable-display" role="button" title="Copy LaTeX">
            <span>Equation display</span>
          </div>
        </article>
      </div>
    `;

    const count = applyDocNarratorSourceIds(document.body, "docs/example/readme.md");
    const paragraph = document.querySelector("p");
    const heading = document.querySelector("h1");
    const equation = document.querySelector(".doc-math-clickable-display");

    expect(count).toBe(2);
    expect(heading?.getAttribute("data-narrator-source-id")).toBe("docs-viewer:docs-example-readme-md:h1:0");
    expect(paragraph?.getAttribute("data-narrator-source-id")).toBe("docs-viewer:docs-example-readme-md:p:1");
    expect(equation?.getAttribute("data-narrator-source-id")).toBeNull();
  });

  it("routes inline document translation through Stage Play document Markdown mail", () => {
    const panelSource = readFileSync(join(process.cwd(), "client/src/components/DocViewerPanel.tsx"), "utf8");
    const clientSource = readFileSync(join(process.cwd(), "client/src/lib/docs/documentTranslationClient.ts"), "utf8");
    const stagePlayRouteSource = readFileSync(join(process.cwd(), "server/routes/helix/stage-play.ts"), "utf8");

    expect(panelSource).toContain("enqueueDocumentMarkdownTranslationMail");
    expect(panelSource).toContain("readDocumentMarkdownMicroDeckRuns");
    expect(panelSource).toContain("extractDocumentMarkdownTranslationsFromRuns");
    expect(panelSource).toContain("documentMarkdownSourceId(currentEntry.relativePath)");
    expect(panelSource).toContain("DOC_TRANSLATION_MAX_UNITS_PER_CHUNK = 3");
    expect(panelSource).toContain("DOC_TRANSLATION_MAX_CHARS_PER_CHUNK = 2200");
    expect(panelSource).toContain("documentTranslationChunkInFlightRef");
    expect(panelSource).toContain("chunkId: `doc-inline:${rawMarkdownSourceHash}:${targetIds.join(\",\")}`");
    expect(panelSource).not.toContain("requestDocumentTranslationUnits");
    expect(clientSource).toContain("/api/helix/stage-play/live-source-mail/document-markdown");
    expect(clientSource).toContain("/api/helix/stage-play/live-source-mail?");
    expect(clientSource).toContain('view: "full"');
    expect(clientSource).toContain("chunkId: params.chunkId");
    expect(clientSource).toContain("/api/helix/stage-play/micro-reasoner-prompt-preset/apply");
    expect(clientSource).toContain("stage_play_micro_reasoner_prompt_preset:document-translate-haw-inline:v1");
    expect(stagePlayRouteSource).toContain("DOCUMENT_MARKDOWN_TRANSLATION_MAX_UNITS_PER_MAIL = 3");
    expect(stagePlayRouteSource).toContain("DOCUMENT_MARKDOWN_TRANSLATION_MAX_CHARS_PER_MAIL = 2200");
    expect(stagePlayRouteSource).toContain("deferredUnits");
    expect(stagePlayRouteSource).toContain("acceptedChars");
  });
});
