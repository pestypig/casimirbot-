/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/agi/api", () => ({
  speakVoice: vi.fn(),
}));
import {
  buildHoverFocusNarratorInspection,
  pickNarratorSentenceAtOffset,
  splitNarratorSentences,
} from "../hoverFocusInspector";

describe("hoverFocusInspector", () => {
  it("splits long UI text into sentence-sized narrator chunks", () => {
    expect(splitNarratorSentences("First sentence. Second sentence! Third sentence?")).toEqual([
      "First sentence.",
      "Second sentence!",
      "Third sentence?",
    ]);
  });

  it("selects the sentence nearest the current cursor text offset", () => {
    const text = "Alpha starts here. Beta is the target sentence. Gamma is later.";

    expect(pickNarratorSentenceAtOffset(text, text.indexOf("target"))).toBe("Beta is the target sentence.");
  });

  it("builds inspection events from accessible labels before raw text", () => {
    document.body.innerHTML = `
      <button aria-label="Open the narrator panel">Visible icon text</button>
    `;

    const button = document.querySelector("button");
    const inspection = buildHoverFocusNarratorInspection(button);

    expect(inspection).toMatchObject({
      text: "Open the narrator panel",
    });
    expect(inspection?.dedupeKey).toContain("hover_focus_inspector");
  });

  it("uses paragraph sentences instead of forcing whole-paragraph reads", () => {
    document.body.innerHTML = `
      <p>One sentence. Two sentence. Three sentence.</p>
    `;

    const paragraph = document.querySelector("p");
    const inspection = buildHoverFocusNarratorInspection(paragraph);

    expect(inspection?.text).toBe("One sentence.");
  });

  it("does not read password input values or placeholders", () => {
    document.body.innerHTML = `
      <input type="password" aria-label="Password" placeholder="Secret password" value="12345" />
    `;

    const input = document.querySelector("input");

    expect(buildHoverFocusNarratorInspection(input)).toBeNull();
  });
});
