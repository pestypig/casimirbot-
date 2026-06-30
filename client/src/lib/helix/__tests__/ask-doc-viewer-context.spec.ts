import { describe, expect, it } from "vitest";
import {
  extractExplicitDocsViewerPath,
  normalizeDocPathForDebugCompare,
  normalizeDocViewerPathForAskSnapshot,
  normalizeDocsViewerAnchorPath,
} from "../ask-doc-viewer-context";

describe("ask docs-viewer context helpers", () => {
  it("normalizes docs-viewer anchor paths without changing absolute Windows paths", () => {
    expect(normalizeDocsViewerAnchorPath("\\docs\\research\\paper.md")).toBe("docs/research/paper.md");
    expect(normalizeDocsViewerAnchorPath("/docs/research/paper.md")).toBe("docs/research/paper.md");
    expect(normalizeDocsViewerAnchorPath("C:\\repo\\docs\\paper.md")).toBe("C:/repo/docs/paper.md");
  });

  it("normalizes retained Ask snapshot paths to safe docs-relative paths", () => {
    expect(normalizeDocViewerPathForAskSnapshot("\\docs\\research\\paper.md")).toBe("docs/research/paper.md");
    expect(normalizeDocViewerPathForAskSnapshot("/docs/research/paper.md")).toBe("docs/research/paper.md");
    expect(normalizeDocViewerPathForAskSnapshot("docs/research/paper.md")).toBe("docs/research/paper.md");
    expect(normalizeDocViewerPathForAskSnapshot("client/src/App.tsx")).toBeNull();
    expect(normalizeDocViewerPathForAskSnapshot("../docs/research/paper.md")).toBeNull();
    expect(normalizeDocViewerPathForAskSnapshot("C:\\repo\\docs\\paper.md")).toBeNull();
    expect(normalizeDocViewerPathForAskSnapshot(null)).toBeNull();
  });

  it("extracts explicit document path lines before generic path tokens", () => {
    expect(
      extractExplicitDocsViewerPath("Please use document path: /docs/research/current.md\nIgnore client/src/App.tsx"),
    ).toBe("docs/research/current.md");
  });

  it("extracts supported inline file path tokens", () => {
    expect(extractExplicitDocsViewerPath("Open docs/research/current-status.md for context")).toBe(
      "docs/research/current-status.md",
    );
    expect(extractExplicitDocsViewerPath("No path here")).toBeNull();
  });

  it("normalizes debug compare paths from unknown values", () => {
    expect(normalizeDocPathForDebugCompare(" /docs\\research\\current.md ")).toBe("docs/research/current.md");
    expect(normalizeDocPathForDebugCompare("")).toBeNull();
    expect(normalizeDocPathForDebugCompare(null)).toBeNull();
  });
});
