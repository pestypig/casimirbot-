import { describe, expect, it } from "vitest";
import {
  buildToolUseRestatement,
  detectInternetSearchIntent,
  hasKnownWorkstationSurfaceScopeCue,
} from "../internet-search-intent";
import {
  hasWorkstationPanelScopeCue,
  isActiveWorkstationContextPrompt,
} from "../workstation-active-context-intent";
import { arbitrateAskSourceTarget } from "../ask-source-target-arbitrator";

describe("internet-search arbitration for workstation context", () => {
  it.each([
    "What panel is active right now?",
    "What panel am I looking at right now?",
    "What panel in the workstation is active?",
    "What panels are open and which panel is active?",
    "Tell me which workstation panel you are currently looking at.",
    "Use the workstation agent to verify which panel is active, then give me the verified result when it returns.",
    "Use the workstation agent to verify the active panel.",
    "You can use the workstation agent to verify the active panel.",
    "Could you ask the runtime agent to check the current workspace?",
  ])("keeps current panel state local: %s", (prompt) => {
    expect(hasWorkstationPanelScopeCue(prompt)).toBe(true);
    expect(isActiveWorkstationContextPrompt(prompt)).toBe(true);
    expect(buildToolUseRestatement(prompt).requiredToolFamilies).not.toContain("internet_search");
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
    expect(arbitrateAskSourceTarget({
      turnId: "ask:test:workstation-context",
      threadId: "thread:test",
      promptText: prompt,
    }).target_source).not.toBe("internet_search");
  });

  it("routes the reported first-person panel-view prompt to local workstation context", () => {
    expect(arbitrateAskSourceTarget({
      turnId: "ask:test:first-person-workstation-context",
      threadId: "thread:test",
      promptText: "What panel am I looking at right now?",
    }).target_source).toBe("workspace_panel");
  });

  it.each([
    "I am not asking what panel is active right now; explain that phrase.",
    "Do not answer what panel in the workstation is active; explain why that would need evidence.",
    "If we later ask what panel is active right now, explain what evidence would be needed.",
    "If we later ask what panel in the workstation is active, explain what evidence would be needed.",
    "Earlier I asked what panel in the workstation is active; summarize that request.",
    "The screen text says what panel is active right now; explain the wording.",
    "The button label reads \"What panel in the workstation is active?\"",
    "Do not use the workstation agent to verify the active panel; explain the phrase.",
    "Later, you can use the workstation agent to verify the active panel.",
    "Earlier, I asked the workstation agent to verify the active panel.",
    "The page says \"Use the workstation agent to verify the active panel\".",
    "Explain how to use the workstation agent to verify the active panel.",
  ])("does not turn contextual panel language into web freshness: %s", (prompt) => {
    expect(hasWorkstationPanelScopeCue(prompt)).toBe(true);
    expect(isActiveWorkstationContextPrompt(prompt)).toBe(false);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });

  it("still admits an explicit web request alongside local panel context", () => {
    const prompt = "What panel is active right now, and search the web for the current OpenAI API status.";

    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(true);
  });

  it("keeps current Situation Room pipeline inspection in local workstation scope", () => {
    const prompt =
      "Inspect the current situation-room pipelines and summarize what is active or blocked.";

    expect(hasKnownWorkstationSurfaceScopeCue(prompt)).toBe(true);
    expect(buildToolUseRestatement(prompt).requiredToolFamilies).not.toContain("internet_search");
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
    expect(arbitrateAskSourceTarget({
      turnId: "ask:test:situation-room-context",
      threadId: "thread:test",
      promptText: prompt,
    }).target_source).not.toBe("internet_search");
  });

  it.each([
    "Inspect the current situation room pipelines.",
    "What is active in Stage Play Badge Graph right now?",
    "Summarize the current workstation task manager.",
    "Check the live answer environment status.",
  ])("recognizes registered workstation surfaces as local scope: %s", (prompt) => {
    expect(hasKnownWorkstationSurfaceScopeCue(prompt)).toBe(true);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });

  it("still admits an explicit web request alongside Situation Room context", () => {
    const prompt =
      "Inspect the current situation-room pipelines and search the web for the current OpenAI API status.";

    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(true);
  });

  it("admits an affirmative panel question after quoted screen-visible wording", () => {
    const prompt =
      "The button label reads \"What panel in the workstation is active?\", but what panel in the workstation is active?";

    expect(hasWorkstationPanelScopeCue(prompt)).toBe(true);
    expect(isActiveWorkstationContextPrompt(prompt)).toBe(true);
    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });

  it("does not add general web search for a supplied scholarly URL", () => {
    const prompt =
      "Use https://ingentaconnect.com/content/imp/jcs/2026/00000033/f0020001/art00013 as a supporting scholarly source for this claim.";

    expect(detectInternetSearchIntent(prompt).searchRequested).toBe(false);
  });
});
