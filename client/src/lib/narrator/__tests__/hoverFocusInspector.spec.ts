/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/agi/api", () => ({
  speakVoice: vi.fn(),
  speakVoiceStream: vi.fn(),
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

  it("keeps sentence-ending punctuation and following space attached to the sentence", () => {
    const text = "Alpha starts here. Beta is the next sentence.";

    expect(pickNarratorSentenceAtOffset(text, text.indexOf("."))).toBe("Alpha starts here.");
    expect(pickNarratorSentenceAtOffset(text, text.indexOf(".") + 1)).toBe("Alpha starts here.");
    expect(pickNarratorSentenceAtOffset(text, text.indexOf("Beta"))).toBe("Beta is the next sentence.");
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

  it("prefers the specific hovered control over a broad readable container", () => {
    document.body.innerHTML = `
      <section aria-label="Narrator panel">
        <button aria-label="Speak narrator event">Speak</button>
      </section>
    `;

    const button = document.querySelector("button");
    const inspection = buildHoverFocusNarratorInspection(button);

    expect(inspection?.text).toBe("Speak narrator event");
    expect(inspection?.sourceId).toContain("Speak narrator event");
  });

  it("uses aria-labelledby text as a readable control label", () => {
    document.body.innerHTML = `
      <span id="labelled-control">Auto-speak hover focus inspector</span>
      <button aria-labelledby="labelled-control">Toggle</button>
    `;

    const button = document.querySelector("button");
    const inspection = buildHoverFocusNarratorInspection(button);

    expect(inspection?.text).toBe("Auto-speak hover focus inspector");
  });

  it("uses paragraph sentences instead of forcing whole-paragraph reads", () => {
    document.body.innerHTML = `
      <p>One sentence. Two sentence. Three sentence.</p>
    `;

    const paragraph = document.querySelector("p");
    const inspection = buildHoverFocusNarratorInspection(paragraph);

    expect(inspection?.text).toBe("One sentence.");
  });

  it("prefers Helix console paragraph text over broad role container labels", () => {
    document.body.innerHTML = `
      <div role="group" aria-label="Turn stream">
        <p>Question text should be read. Final answer text is later.</p>
      </div>
    `;

    const paragraph = document.querySelector("p");
    const inspection = buildHoverFocusNarratorInspection(paragraph);

    expect(inspection?.text).toBe("Question text should be read.");
    expect(inspection?.sourceId).not.toContain("Turn stream");
  });

  it("does not read password input values or placeholders", () => {
    document.body.innerHTML = `
      <input type="password" aria-label="Password" placeholder="Secret password" value="12345" />
    `;

    const input = document.querySelector("input");

    expect(buildHoverFocusNarratorInspection(input)).toBeNull();
  });
});
