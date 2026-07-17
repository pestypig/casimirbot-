import { describe, expect, it } from "vitest";
import {
  buildToolUseRestatement,
  detectInternetSearchIntent,
} from "../internet-search-intent";
import {
  hasWorkstationPanelScopeCue,
  isActiveWorkstationContextPrompt,
} from "../workstation-active-context-intent";

describe("internet-search arbitration for workstation context", () => {
  it.each([
    "What panel is active right now?",
    "What panels are open and which panel is active?",
    "Tell me which workstation panel you are currently looking at.",
  ])("keeps current panel state local: %s", (prompt) => {
    expect(hasWorkstationPanelScopeCue(prompt)).toBe(true);
    expect(isActiveWorkstationContextPrompt(prompt)).toBe(true);
    expect(buildToolUseRestatement(prompt).requiredToolFamilies).not.toContain("internet_search");
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });

  it.each([
    "I am not asking what panel is active right now; explain that phrase.",
    "If we later ask what panel is active right now, explain what evidence would be needed.",
    "The screen text says what panel is active right now; explain the wording.",
  ])("does not turn contextual panel language into web freshness: %s", (prompt) => {
    expect(hasWorkstationPanelScopeCue(prompt)).toBe(true);
    expect(isActiveWorkstationContextPrompt(prompt)).toBe(false);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });

  it("still admits an explicit web request alongside local panel context", () => {
    const prompt = "What panel is active right now, and search the web for the current OpenAI API status.";

    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(true);
  });
});
