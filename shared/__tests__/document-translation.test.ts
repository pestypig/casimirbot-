import { describe, expect, it } from "vitest";
import {
  composeTranslatedMarkdown,
  hashDocumentSource,
  runDocumentTranslationChecks,
  segmentMarkdownForTranslation,
} from "../document-translation";

describe("document translation artifacts", () => {
  it("segments translatable Markdown while protecting code fences and frontmatter", () => {
    const source = [
      "---",
      "title: Test",
      "---",
      "",
      "# Hello",
      "",
      "Use `npm test` and /api/docs/translate.",
      "",
      "```ts",
      "const value = 1;",
      "```",
    ].join("\n");

    const units = segmentMarkdownForTranslation(source);

    expect(hashDocumentSource(source)).toMatch(/^fnv1a32:/);
    expect(units.some((unit) => unit.kind === "heading" && unit.translatable)).toBe(true);
    expect(units.some((unit) => unit.source_markdown.includes("const value") && !unit.translatable)).toBe(true);
    expect(units.flatMap((unit) => unit.protected_spans)).toEqual(
      expect.arrayContaining(["`npm test`", "/api/docs/translate"]),
    );
  });

  it("fails checks when translated units drop protected spans", () => {
    const source = "See [the API](/api/docs/translate) and `npm test`.";
    const units = segmentMarkdownForTranslation(source);
    const translationsByUnitId = {
      [units[0].unit_id]: "E nānā i ka API.",
    };
    const translated = composeTranslatedMarkdown(units, translationsByUnitId);

    const checks = runDocumentTranslationChecks(source, units, translated, translationsByUnitId);

    expect(checks.find((check) => check.name === "protected_span_parity")?.status).toBe("fail");
    expect(checks.find((check) => check.name === "link_target_parity")?.status).toBe("fail");
  });
});
